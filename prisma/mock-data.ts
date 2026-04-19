import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Generating Mock Data (Multi-Plant Edition)...");

  // Clean old data to avoid FK errors - Prisma model names are lowercase in the client
  await prisma.wateringLog.deleteMany({});
  await prisma.robotLog.deleteMany({});
  await prisma.plant.deleteMany({});
  await prisma.pot.deleteMany({});

  // 1. Create Robots
  const robotsData = [
    { id: "BOT-001", name: "Greenhouse Alpha", status: "Active", state: "Watering Pot 1", batteryLevel: 85, lastActive: new Date() },
    { id: "BOT-002", name: "Greenhouse Beta", status: "Idle", state: "Standby", batteryLevel: 64, lastActive: new Date(Date.now() - 1000 * 60 * 15) },
  ];

  for (const r of robotsData) {
    await prisma.robot.upsert({ where: { id: r.id }, update: r, create: r });
  }

  // 2. Create Pots & Multiple Plants per Pot
  const potsData = [
    { robotId: "BOT-001", trackIndex: 0, potName: "Alpha-1", plants: ["Basil", "Mint", "Parsley"] },
    { robotId: "BOT-001", trackIndex: 1, potName: "Alpha-2", plants: ["Tomato", "Chili"] },
    { robotId: "BOT-002", trackIndex: 0, potName: "Beta-1", plants: ["Lettuce", "Kale", "Spinach"] },
  ];

  for (const p of potsData) {
    await prisma.pot.create({
      data: {
        robotId: p.robotId,
        trackIndex: p.trackIndex,
        potName: p.potName,
        plants: {
          create: p.plants.map((name, index) => ({
            plantIndex: index,
            plantName: name,
            targetMoisturePct: Math.floor(Math.random() * 20) + 40,
            maxWaterDurationSec: 30,
            flowRateMlPerSec: 2.5
          }))
        }
      }
    });
  }

  console.log("✅ Mock data generation complete!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
