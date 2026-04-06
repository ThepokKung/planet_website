"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function getRobotConfigAction(robotId: string) {
  const session = await getSession();
  if (session?.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  try {
    const robot = await prisma.robot.findUnique({
      where: { id: robotId },
      include: {
        pots: {
          include: { plants: true },
          orderBy: { trackIndex: 'asc' }
        }
      }
    });

    if (!robot) return null;

    return {
      robotId: robot.id,
      robotName: robot.name || "",
      pots: robot.pots.map(p => ({
        index: p.trackIndex,
        potName: p.potName || "",
        plants: p.plants.map(pl => ({ 
          name: pl.plantName || "",
          index: pl.plantIndex || 0,
          targetMoisture: pl.targetMoisturePct || 50,
          maxWaterDuration: pl.maxWaterDurationSec || 30,
          flowRate: pl.flowRateMlPerSec || 1.5
        }))
      }))
    };
  } catch (error) {
    console.error("Failed to fetch robot config:", error);
    return null;
  }
}

export async function saveRobotConfigAction(config: any) {
  const session = await getSession();
  if (session?.role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  try {
    await prisma.robot.upsert({
      where: { id: config.robot_id },
      update: { name: config.robot_name, status: 'Idle' },
      create: { 
        id: config.robot_id, 
        name: config.robot_name, 
        status: 'Idle',
        batteryLevel: 100,
        lastActive: new Date()
      }
    });

    // Delete existing pots (and cascaded plants handled by Prisma relations if configured, 
    // but here we manually delete or use onDelete: Cascade in schema)
    // Actually, in the new schema, I should ensure cascade deletion or manually handle it.
    // The previous schema had onDelete: Cascade on Plant -> Pot.
    
    // First, let's find existing pots for this robot to delete their plants if cascade isn't automatic
    const existingPots = await prisma.pot.findMany({ where: { robotId: config.robot_id } });
    const potIds = existingPots.map(p => p.id);
    
    await prisma.plant.deleteMany({ where: { potId: { in: potIds } } });
    await prisma.pot.deleteMany({ where: { robotId: config.robot_id } });

    // Create pots and their plants
    for (const p of config.pots) {
      await prisma.pot.create({
        data: {
          robotId: config.robot_id,
          trackIndex: p.index,
          potName: p.potName || `Pot ${p.index}`,
          plants: {
            create: p.plants.map((pl: any, idx: number) => ({
              plantName: pl.name,
              plantIndex: idx,
              targetMoisturePct: 50,
              maxWaterDurationSec: 30,
              flowRateMlPerSec: 1.5
            }))
          }
        }
      });
    }

    revalidatePath("/details");
    revalidatePath("/fleet");
    revalidatePath("/analytics");
    return { success: true };
  } catch (error) {
    console.error("Save config error:", error);
    return { error: "Failed to save configuration." };
  }
}

export async function updatePlantNameAction(plantId: string, newName: string) {
  const session = await getSession();
  if (session?.role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  try {
    await prisma.plant.update({
      where: { id: plantId },
      data: { plantName: newName }
    });
    revalidatePath("/details");
    revalidatePath("/analytics");
    return { success: true };
  } catch (error) {
    console.error("Update plant error:", error);
    return { error: "Failed to update plant name." };
  }
}
