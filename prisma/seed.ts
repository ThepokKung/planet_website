import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

if (!process.env.DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL is not defined in the environment variables.');
  process.exit(1);
}

const connectionString = process.env.DATABASE_URL;

async function main() {
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log('--- 🛡️  AgroBot Seed: Initializing Wipe ---');
  
  // 1. Clean DB
  await prisma.robotLog.deleteMany();
  await prisma.wateringLog.deleteMany();
  await prisma.plant.deleteMany();
  await prisma.pot.deleteMany();
  await prisma.robot.deleteMany();
  await prisma.location.deleteMany();
  await prisma.user.deleteMany();

  console.log('--- 🏗️  AgroBot Seed: Creating Base Infrastructure ---');

  // 2. Setup Base Data
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      passwordHash: hashedPassword,
      role: 'ADMIN',
    },
  });

  const location = await prisma.location.create({
    data: {
      buildingCode: 'N9',
      floorLevel: '1',
      spotName: 'Lab-1',
      fullCode: 'N9-1-1',
      userId: admin.id,
    },
  });

  const robot = await prisma.robot.create({
    data: {
      id: 'BOT-001',
      name: 'AgroBot Alpha',
      locationId: location.id,
      state: 'SLEEP',
      status: 'Ready',
      batteryLevel: 98,
      currentTrackIndex: 0,
    },
  });

  // Create Pots
  const pot0 = await prisma.pot.create({
    data: {
      robotId: robot.id,
      trackIndex: 0,
      potName: 'Vegetable Box A',
    },
  });

  const pot1 = await prisma.pot.create({
    data: {
      robotId: robot.id,
      trackIndex: 1,
      potName: 'Desert Zone B',
    },
  });

  // Create Plants
  const basil = await prisma.plant.create({
    data: {
      potId: pot0.id,
      plantIndex: 0,
      plantName: 'Basil (โหระพา)',
      targetMoisturePct: 60,
      maxWaterDurationSec: 5,
      flowRateMlPerSec: 10.0,
    },
  });

  const mint = await prisma.plant.create({
    data: {
      potId: pot0.id,
      plantIndex: 1,
      plantName: 'Peppermint (สะระแหน่)',
      targetMoisturePct: 70,
      maxWaterDurationSec: 5,
      flowRateMlPerSec: 10.0,
    },
  });

  const cactus = await prisma.plant.create({
    data: {
      potId: pot1.id,
      plantIndex: 0,
      plantName: 'Cactus (กระบองเพชร)',
      targetMoisturePct: 20,
      maxWaterDurationSec: 3,
      flowRateMlPerSec: 5.0,
    },
  });

  console.log('--- 🤖 AgroBot Seed: Starting 7-Day Simulation (8-Step Workflow) ---');

  const now = new Date();
  const pots = [
    { record: pot0, plants: [basil, mint] },
    { record: pot1, plants: [cactus] }
  ];

  // Simulation Loop: 7 Days
  for (let d = 6; d >= 0; d--) {
    const simulationDate = new Date(now);
    simulationDate.setDate(simulationDate.getDate() - d);
    
    // Two runs per day: 08:00 and 17:00
    const runHours = [8, 17];

    for (const hour of runHours) {
      let currentTime = new Date(simulationDate);
      currentTime.setHours(hour, 0, 0, 0);

      const addSeconds = (s: number) => {
        currentTime = new Date(currentTime.getTime() + s * 1000);
        return currentTime;
      };

      console.log(` > Simulating Run at ${currentTime.toISOString()}`);

      // STEP 1: WAKEUP
      await prisma.robotLog.create({
        data: {
          robotId: robot.id,
          state: 'WAKEUP',
          message: '[SYSTEM] ถึงเวลาทำงาน ตื่นนอนและเตรียมความพร้อม',
          createdAt: addSeconds(2),
        }
      });

      // STEP 2: FETCH_CONFIG
      await prisma.robotLog.create({
        data: {
          robotId: robot.id,
          state: 'FETCH_CONFIG',
          message: `[SYSTEM] เช็ค Config: ${robot.id}, หน้าที่รดน้ำ 2 กระถาง`,
          createdAt: addSeconds(3),
        }
      });

      // STEP 3: MOVING (Start)
      await prisma.robotLog.create({
        data: {
          robotId: robot.id,
          state: 'MOVING',
          message: '[SYSTEM] ระบบพร้อม เริ่มเดินหน้า',
          createdAt: addSeconds(5),
        }
      });

      // Loop through Pots
      for (const potEntry of pots) {
        // STEP 4: TRACKING
        await prisma.robotLog.create({
          data: {
            robotId: robot.id,
            state: 'TRACKING',
            message: `[TRACKING] ตรวจพบ กระถาง Track ${potEntry.record.trackIndex}, กำลังเช็คจำนวน Plant`,
            createdAt: addSeconds(10),
          }
        });

        for (const plant of potEntry.plants) {
          // STEP 5: SENSOR
          await prisma.robotLog.create({
            data: {
              robotId: robot.id,
              state: 'SENSOR',
              message: `[SENSOR] ยื่นแขนวัดความชื้นต้น ${plant.plantName}`,
              createdAt: addSeconds(5),
            }
          });

          // Simulate Moisture Logic
          const target = plant.targetMoisturePct || 50;
          // Randomize moisture: morning runs usually drier than evening
          const moistureBefore = hour === 8 
            ? Math.floor(Math.random() * (target + 10)) 
            : Math.floor(Math.random() * (target + 20));
          
          const needsWatering = moistureBefore < target;

          // STEP 6: DECISION
          await prisma.robotLog.create({
            data: {
              robotId: robot.id,
              state: 'DECISION',
              message: needsWatering 
                ? '[DECISION] ความชื้นต่ำกว่ากำหนด เตรียมรดน้ำ' 
                : '[DECISION] ความชื้นเพียงพอ ข้ามการรดน้ำ',
              createdAt: addSeconds(2),
            }
          });

          if (needsWatering) {
            const mlToGive = Math.floor(Math.random() * 50) + 50; // 50-100ml
            const moistureAfter = Math.min(100, moistureBefore + Math.floor(mlToGive / 5));

            // STEP 7: WATERING (Action Log)
            await prisma.robotLog.create({
              data: {
                robotId: robot.id,
                state: 'WATERING',
                message: `[ACTION] กำลังรดน้ำปริมาณ ${mlToGive} ML`,
                createdAt: addSeconds(8),
              }
            });

            // CREATE WATERING_LOG (Success)
            await prisma.wateringLog.create({
              data: {
                robotId: robot.id,
                plantId: plant.id,
                moistureBefore,
                moistureAfter,
                waterAmountMl: mlToGive,
                wateringDurationSec: Math.ceil(mlToGive / (plant.flowRateMlPerSec || 10)),
                status: 'Success',
                createdAt: currentTime,
              }
            });
          } else {
            // CREATE WATERING_LOG (Skipped)
            await prisma.wateringLog.create({
              data: {
                robotId: robot.id,
                plantId: plant.id,
                moistureBefore,
                moistureAfter: moistureBefore,
                waterAmountMl: 0,
                wateringDurationSec: 0,
                status: 'Skipped',
                createdAt: currentTime,
              }
            });
          }
        }

        // STEP 8: MOVING (Post Pot)
        await prisma.robotLog.create({
          data: {
            robotId: robot.id,
            state: 'MOVING',
            message: `[SYSTEM] รดน้ำกระถาง Track ${potEntry.record.trackIndex} เสร็จสิ้น เตรียมเคลื่อนที่ต่อ`,
            createdAt: addSeconds(5),
          }
        });
      }

      // END OF RUN: SLEEP
      await prisma.robotLog.create({
        data: {
          robotId: robot.id,
          state: 'SLEEP',
          message: '[SYSTEM] ทำงานเสร็จสิ้น กลับสู่โหมดพักผ่อน (Deep Sleep)',
          createdAt: addSeconds(10),
        }
      });
    }
  }

  console.log('--- ✅ AgroBot Seed: Simulation Complete ---');
  await prisma.$disconnect();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
