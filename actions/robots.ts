"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";

const saveRobotSchema = z.object({
  robot_id: z.string(),
  robot_name: z.string(),
  locationId: z.string(),
  plant_config: z.record(z.object({
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

    // 2. Clear existing pots/plants
    const existingPots = await prisma.pot.findMany({ where: { robotId: robot_id } });
    const potIds = existingPots.map(p => p.id);
    
    await prisma.plant.deleteMany({ where: { potId: { in: potIds } } });
    await prisma.pot.deleteMany({ where: { robotId: robot_id } });

    // 3. Create new pots and plants
    let plantCount = 0;
    for (const potData of pots) {
      const pot = await prisma.pot.create({
        data: {
          robotId: robot_id,
          trackIndex: potData.index,
          potName: potData.potName
        }
      });

      for (let i = 0; i < potData.plants.length; i++) {
        const plantType = potData.plants[i].type;
        // Prioritize targetMoisturePct from plant_config if available
        const targetMoisture = plant_config?.[plantType]?.targetMoisturePct ?? potData.plants[i].targetMoisturePct;

        await prisma.plant.create({
          data: {
            potId: pot.id,
            plantIndex: i,
            plantName: plantType,
            targetMoisturePct: targetMoisture,
          }
        });
        plantCount++;
      }
    }

    // 4. Record Audit Log
    await prisma.robotLog.create({
      data: {
        robot: { connect: { id: robot_id } },
        user: session.userId ? { connect: { id: session.userId } } : undefined,
        state: 'CONFIG_UPDATE',
        message: `[USER_ACTION] User '${session.username || 'System'}' อัปเดตการตั้งค่า: ${pots.length} กระถาง, ${plantCount} ต้นไม้`
      }
    });

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
