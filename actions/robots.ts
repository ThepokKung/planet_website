"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const saveRobotSchema = z.object({
  robot_id: z.string(),
  robot_name: z.string(),
  locationId: z.string(),
  pots: z.array(z.object({
    index: z.number(),
    potName: z.string(),
    plants: z.array(z.object({
      name: z.string(),
      targetMoisturePct: z.number().optional(),
    }))
  }))
});

export async function getRobotConfigAction(robotId: string) {
  const robot = await prisma.robot.findUnique({
    where: { id: robotId },
    include: {
      pots: {
        include: {
          plants: true
        }
      }
    }
  });

  if (!robot) return null;

  return {
    robotName: robot.name,
    pots: robot.pots.map(p => ({
      index: p.trackIndex,
      potName: p.potName,
      plants: p.plants.map(pl => ({
        name: pl.plantName,
        targetMoisturePct: pl.targetMoisturePct,
      }))
    }))
  };
}

export async function saveRobotConfigAction(data: any) {
  const result = saveRobotSchema.safeParse(data);
  if (!result.success) {
    return { success: false, error: result.error.message };
  }

  const { robot_id, robot_name, locationId, pots } = result.data;

  try {
    // 1. Check if robot exists or create it
    await prisma.robot.upsert({
      where: { id: robot_id },
      update: { 
        name: robot_name,
        locationId: locationId
      },
      create: { 
        id: robot_id, 
        name: robot_name,
        locationId: locationId,
        status: 'Ready',
        state: 'SLEEP'
      }
    });

    // 2. Clear existing pots/plants for this robot to overwrite
    const existingPots = await prisma.pot.findMany({ where: { robotId: robot_id } });
    const potIds = existingPots.map(p => p.id);
    
    await prisma.plant.deleteMany({ where: { potId: { in: potIds } } });
    await prisma.pot.deleteMany({ where: { robotId: robot_id } });

    // 3. Create new pots and plants
    for (const potData of pots) {
      const pot = await prisma.pot.create({
        data: {
          robotId: robot_id,
          trackIndex: potData.index,
          potName: potData.potName
        }
      });

      for (let i = 0; i < potData.plants.length; i++) {
        await prisma.plant.create({
          data: {
            potId: pot.id,
            plantIndex: i,
            plantName: potData.plants[i].name,
            targetMoisturePct: potData.plants[i].targetMoisturePct,
          }
        });
      }
    }

    revalidatePath("/dashboard");
    revalidatePath("/setup");
    return { success: true };
  } catch (error: any) {
    console.error("Save config error:", error);
    return { success: false, error: error.message };
  }
}

export async function getRobotLogsAction(robotId: string, page: number = 1) {
  const pageSize = 50;
  try {
    const [logs, total] = await Promise.all([
      prisma.robotLog.findMany({
        where: { robotId },
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
  try {
    await prisma.plant.update({
      where: { id: plantId },
      data: { plantName: newName }
    });
    revalidatePath("/details");
    return { success: true };
  } catch (error) {
    console.error("Update plant name error:", error);
    return { success: false, error: "Failed to update plant name." };
  }
}
