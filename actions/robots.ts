"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";

const saveRobotSchema = z.object({
  robot_id: z.string(),
  robot_name: z.string(),
  locationId: z.string(),
  plant_config: z.record(z.string(), z.object({
    targetMoisturePct: z.number()
  })).optional(),
  pots: z.array(z.object({
    index: z.number(),
    potName: z.string(),
    plants: z.array(z.object({
      type: z.string(),
      targetMoisturePct: z.number().optional(),
    }))
  }))
});

export async function saveRobotConfigAction(data: unknown) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const result = saveRobotSchema.safeParse(data);
  if (!result.success) {
    return { success: false, error: result.error.message };
  }

  const { robot_id, robot_name, locationId, pots, plant_config } = result.data;

  try {
    // Resolve location ID: Handle 'Unassigned', short codes (e.g., 'S12'), or raw UUIDs
    let finalLocationId: string | null = null;
    
    if (locationId && locationId !== "Unassigned") {
      if (locationId.length < 10) {
        // Resolve from fullCode
        const loc = await prisma.location.findUnique({
          where: { fullCode: locationId }
        });
        finalLocationId = loc ? loc.id : null;
      } else {
        // Assume it's a valid UUID
        finalLocationId = locationId;
      }
    }

    // --- RBAC CHECK ---
    if (session.role === 'ADMIN') {
      const user = await prisma.user.findUnique({
        where: { id: session.userId },
        include: { locations: { select: { id: true } } }
      });
      const accessibleZoneIds = user?.locations.map(l => l.id) || [];
      
      // 1. Check if trying to move robot to an unauthorized zone
      if (finalLocationId && !accessibleZoneIds.includes(finalLocationId)) {
        return { success: false, error: "Unauthorized: You do not have access to this zone." };
      }

      // 2. Check if the robot itself currently belongs to an authorized zone
      const robot = await prisma.robot.findUnique({ where: { id: robot_id }, select: { locationId: true } });
      if (robot?.locationId && !accessibleZoneIds.includes(robot.locationId)) {
        return { success: false, error: "Unauthorized: This robot belongs to another zone." };
      }
    }

    // 1. Check if robot exists or create it
    await prisma.robot.upsert({
      where: { id: robot_id },
      update: { 
        name: robot_name,
        locationId: finalLocationId
      },
      create: { 
        id: robot_id, 
        name: robot_name,
        locationId: finalLocationId,
        status: 'Ready',
        state: 'SLEEP'
      }
    });

    // 2. Fetch existing pots for this robot to perform non-destructive updates
    const existingPots = await prisma.pot.findMany({ 
      where: { robotId: robot_id },
      include: { plants: true }
    });

    // Strategy: Identify pots to update, create, or delete
    const incomingTrackIndices = pots.map(p => p.index);
    const potsToDelete = existingPots.filter(p => p.trackIndex !== null && !incomingTrackIndices.includes(p.trackIndex));

    // Delete removed pots and their plants (this is still destructive but only for REMOVED items)
    if (potsToDelete.length > 0) {
      const potIdsToDelete = potsToDelete.map(p => p.id);
      await prisma.plant.deleteMany({ where: { potId: { in: potIdsToDelete } } });
      await prisma.pot.deleteMany({ where: { id: { in: potIdsToDelete } } });
    }

    let plantCount = 0;
    for (const potData of pots) {
      // Find matching existing pot by track index
      const existingPot = existingPots.find(p => p.trackIndex === potData.index);
      
      let potId: string;
      if (existingPot) {
        // Update existing pot name if changed
        await prisma.pot.update({
          where: { id: existingPot.id },
          data: { potName: potData.potName }
        });
        potId = existingPot.id;
      } else {
        // Create new pot
        const newPot = await prisma.pot.create({
          data: {
            robotId: robot_id,
            trackIndex: potData.index,
            potName: potData.potName
          }
        });
        potId = newPot.id;
      }

      // Handle Plants for this pot
      const existingPlants = existingPot?.plants || [];
      const incomingPlantIndices = potData.plants.map((_, i) => i);

      // Delete removed plants
      await prisma.plant.deleteMany({
        where: { 
          potId: potId,
          plantIndex: { notIn: incomingPlantIndices }
        }
      });

      for (let i = 0; i < potData.plants.length; i++) {
        const plantType = potData.plants[i].type;
        const targetMoisture = plant_config?.[plantType]?.targetMoisturePct ?? potData.plants[i].targetMoisturePct;
        
        const existingPlant = existingPlants.find(p => p.plantIndex === i);

        if (existingPlant) {
          // Update existing plant
          await prisma.plant.update({
            where: { id: existingPlant.id },
            data: {
              plantName: plantType,
              targetMoisturePct: targetMoisture,
            }
          });
        } else {
          // Create new plant
          await prisma.plant.create({
            data: {
              potId: potId,
              plantIndex: i,
              plantName: plantType,
              targetMoisturePct: targetMoisture,
            }
          });
        }
        plantCount++;
      }
    }

    // 4. Record Audit Log
    await prisma.robotLog.create({
      data: {
        robot: { connect: { id: robot_id } },
        user: session.userId ? { connect: { id: session.userId } } : undefined,
        state: 'CONFIG_UPDATE',
        message: `[USER_ACTION] User '${session.username || 'System'}' อัปเดตการตั้งค่า: ${pots.length} กระถาง, ${plantCount} ต้นไม้ (Non-destructive update)`
      }
    });

    // 5. Deploy via OTA (Node-RED)
    const nodeRedBaseUrl = process.env.NODE_RED_BASE_URL;
    if (nodeRedBaseUrl) {
      try {
        const response = await fetch(`${nodeRedBaseUrl}/api/v1/robots/${robot_id}/config`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });
        
        if (!response.ok) {
          console.error("Node-RED returned status:", response.status);
        }
      } catch (err) {
        console.error("Failed to push config to Node-RED:", err);
      }
    }

    revalidatePath("/dashboard");
    revalidatePath("/setup");
    return { success: true };
  } catch (error) {
    console.error("Save config error:", error);
    return { success: false, error: error instanceof Error ? error.message : "An unknown error occurred" };
  }
}

export async function getRobotLogsAction(robotId: string, page: number = 1) {
  const pageSize = 50;
  try {
    const [logs, total] = await Promise.all([
      prisma.robotLog.findMany({
        where: { robotId },
        include: { user: { select: { username: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.robotLog.count({
        where: { robotId }
      })
    ]);

    return {
      logs,
      total,
      totalPages: Math.ceil(total / pageSize)
    };
  } catch (error) {
    console.error("Failed to fetch robot logs:", error);
    throw new Error("Failed to fetch logs.");
  }
}

export async function updatePlantNameAction(plantId: string, newName: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  try {
    const updatedPlant = await prisma.plant.update({
      where: { id: plantId },
      data: { plantName: newName },
      include: { pot: { select: { robotId: true } } }
    });

    // Audit Log for plant rename
    if (updatedPlant.pot?.robotId) {
      await prisma.robotLog.create({
        data: {
          robotId: updatedPlant.pot.robotId,
          userId: session.userId,
          state: 'PLANT_RENAME',
          message: `[USER_ACTION] User '${session.username}' เปลี่ยนชื่อพืชเป็น: '${newName}'`
        }
      });
    }

    revalidatePath("/details");
    return { success: true };
  } catch (error) {
    console.error("Update plant name error:", error);
    return { success: false, error: "Failed to update plant name." };
  }
}

const debugCommandSchema = z.object({
  robotId: z.string(),
  command: z.string(),
  endpointType: z.enum(["cmd", "debug"]).optional().default("debug"),
});

export async function sendDebugCommandAction(data: unknown) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const result = debugCommandSchema.safeParse(data);
  if (!result.success) {
    return { success: false, error: result.error.message };
  }

  const { robotId, command, endpointType } = result.data;

  try {
    await prisma.robot.update({
      where: { id: robotId },
      data: { debugCommand: command }
    });

    // Record Audit Log
    await prisma.robotLog.create({
      data: {
        robotId,
        userId: session.userId,
        state: 'DEBUG_COMMAND',
        message: `[DEBUG_ACTION] User '${session.username}' sent command: ${command} to ${endpointType}`
      }
    });

    // 1. WEBSITE -> NODE-RED (REST API)
    const nodeRedBaseUrl = process.env.NODE_RED_BASE_URL;
    if (nodeRedBaseUrl) {
      try {
        const response = await fetch(`${nodeRedBaseUrl}/api/v1/robots/${robotId}/${endpointType}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ command }),
        });
        
        if (!response.ok) {
          console.error("Node-RED returned status:", response.status);
        }
      } catch (err) {
        console.error("Failed to push command to Node-RED:", err);
      }
    }

    revalidatePath("/dashboard");
    revalidatePath("/details");
    return { success: true };
  } catch (error) {
    console.error("Debug command error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to send command" };
  }
}
