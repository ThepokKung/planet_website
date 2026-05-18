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

  console.log('--- 🛡️  Vertical Forest Seed: Initializing Wipe ---');
  
  // 1. Clean DB
  await prisma.robotLog.deleteMany();
  await prisma.wateringLog.deleteMany();
  await prisma.plant.deleteMany();
  await prisma.pot.deleteMany();
  await prisma.robot.deleteMany();
  await prisma.location.deleteMany();
  await prisma.user.deleteMany();
  await prisma.plantTemplate.deleteMany();

  console.log('--- 🏗️  Vertical Forest Seed: Creating Base Infrastructure ---');

  // 1.5 Setup Plant Templates
  const templates = [
    { name: 'Catnip', targetMoisturePct: 50 },
    { name: 'Devil’s ivy', targetMoisturePct: 60 },
    { name: 'Snake plant', targetMoisturePct: 30 },
  ];

  const createdTemplates = [];
  for (const t of templates) {
    createdTemplates.push(await prisma.plantTemplate.create({ data: t }));
  }

  // 2. Setup Base Data
  const hashedAdminPassword = await bcrypt.hash('admin123', 10);
  const hashedSuperAdminPassword = await bcrypt.hash('superadmin123', 10);

  await prisma.user.create({
    data: {
      username: 'superadmin',
      passwordHash: hashedSuperAdminPassword,
      role: 'SUPER ADMIN',
    },
  });

  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      passwordHash: hashedAdminPassword,
      role: 'ADMIN',
    },
  });

  console.log('--- 🏗️  Vertical Forest Seed: Generating 35 Locations (S1-S15, N1-N20) ---');
  
  const locationsData = [
    ...Array.from({ length: 15 }, (_, i) => ({ code: `S${i + 1}`, building: `S${i + 1}`, name: `South Zone ${i + 1}` })),
    ...Array.from({ length: 20 }, (_, i) => ({ code: `N${i + 1}`, building: `N${i + 1}`, name: `North Zone ${i + 1}` }))
  ];

  const createdLocations = [];
  for (const loc of locationsData) {
    const newLoc = await prisma.location.create({
      data: {
        buildingCode: loc.building,
        floorLevel: '1',
        spotName: loc.name,
        fullCode: loc.code,
        userId: admin.id,
      },
    });
    createdLocations.push(newLoc);
  }

  // Use the first location for our demo robot
  const demoLocation = createdLocations.find(l => l.fullCode === 'N9') || createdLocations[0];

  const robot = await prisma.robot.create({
    data: {
      id: `B-N9-001`,
      name: 'Vertical Forest Alpha',
      locationId: demoLocation.id,
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

  // Create Plants dynamically from templates
  const createdPlants = [];

  // Assign first 2 templates to pot0 (Catnip, Devil's ivy)
  for (let i = 0; i < 2; i++) {
    createdPlants.push(
      await prisma.plant.create({
        data: {
          potId: pot0.id,
          plantIndex: i,
          plantName: createdTemplates[i].name,
          targetMoisturePct: createdTemplates[i].targetMoisturePct,
          maxWaterDurationSec: 5,
          flowRateMlPerSec: 10.0,
        },
      })
    );
  }

  // Assign 3rd template to pot1 (Snake plant)
  createdPlants.push(
    await prisma.plant.create({
      data: {
        potId: pot1.id,
        plantIndex: 0,
        plantName: createdTemplates[2].name,
        targetMoisturePct: createdTemplates[2].targetMoisturePct,
        maxWaterDurationSec: 3,
        flowRateMlPerSec: 5.0,
      },
    })
  );

  console.log('--- 🤖 Vertical Forest Seed: Starting 7-Day Simulation (8-Step Workflow) ---');

  const now = new Date();
  const pots = [
    { record: pot0, plants: createdPlants.slice(0, 2) },
    { record: pot1, plants: createdPlants.slice(2, 3) }
  ];

  // Simulation Loop: 7 Days
  for (let d = 6; d >= 0; d--) {
    const simulationDate = new Date(now);
    simulationDate.setDate(simulationDate.getDate() - d);
    
    // Two runs per day: 07:00 and 17:00
    const runHours = [7, 17];

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
          const moistureBefore = hour === 7 
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

  console.log('--- ✅ Vertical Forest Seed: Simulation Complete ---');
  await prisma.$disconnect();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
