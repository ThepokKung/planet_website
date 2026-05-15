import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const logSchema = z.object({
  robot_id: z.string(),
  logs: z.array(z.object({
    plant_id: z.string(), // Changed from pot_id
    moisture_before: z.number(),
    moisture_after: z.number().optional(),
    watering_start_time: z.string().datetime(),
    watering_end_time: z.string().datetime(),
    watering_duration_sec: z.number(),
    water_amount_ml: z.number().optional(),
    status: z.enum(["Success", "Failed", "Skipped"]),
  }))
});

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("x-api-key");
  const expectedApiKey = process.env.IOT_API_KEY || "vertical-forest-iot-secret-2026";

  if (apiKey !== expectedApiKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const result = logSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Invalid payload format", details: result.error.format() }, { status: 400 });
    }

    const { robot_id, logs } = result.data;

    // Efficient bulk insert using Prisma as per Gemini.md
    const createdLogs = await prisma.wateringLog.createMany({
      data: logs.map(log => ({
        robotId: robot_id,
        plantId: log.plant_id,
        moistureBefore: log.moisture_before,
        moistureAfter: log.moisture_after,
        wateringStartTime: new Date(log.watering_start_time),
        wateringEndTime: new Date(log.watering_end_time),
        wateringDurationSec: log.watering_duration_sec,
        waterAmountMl: log.water_amount_ml,
        status: log.status,
      }))
    });

    return NextResponse.json({ 
      success: true, 
      count: createdLogs.count 
    });

  } catch (error) {
    console.error("Failed to sync logs:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
