import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const robotId = searchParams.get("robot_id");

  if (!robotId) {
    return NextResponse.json({ error: "Missing robot_id" }, { status: 400 });
  }

  try {
    const robot = await prisma.robot.findUnique({
      where: { id: robotId },
      include: {
        location: true,
        pots: {
          include: { plants: true },
          orderBy: { trackIndex: 'asc' }
        }
      }
    });

    if (!robot) {
      return NextResponse.json({ error: "Robot not found" }, { status: 404 });
    }

    // --- Create plant_config (Grouped by plantName/Type) ---
    const plantConfig: Record<string, { targetMoisturePct: number }> = {};
    
    robot.pots.forEach(pot => {
      pot.plants.forEach(plant => {
        const typeKey = plant.plantName || "Unknown";
        if (!plantConfig[typeKey]) {
          plantConfig[typeKey] = {
            targetMoisturePct: plant.targetMoisturePct || 50
          };
        }
      });
    });

    // --- Map Pots and Plants to the new Schema ---
    const formattedPots = robot.pots.map(pot => ({
      index: pot.trackIndex,
      potName: pot.potName,
      plants: pot.plants.map(plant => ({
        id: plant.id, // Unique DB ID or could be index-based
        type: plant.plantName || "Unknown"
      }))
    }));

    return NextResponse.json({
      robot_id: robot.id,
      robot_name: robot.name,
      locationId: robot.location?.fullCode || robot.locationId,
      plant_config: plantConfig,
      pots: formattedPots,
      version: "1.2.1",
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("OTA Config Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
