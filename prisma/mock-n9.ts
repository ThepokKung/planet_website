import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Generating Mock Data for B-N9-001...");

  const robotId = "B-N9-001";

  // Check if robot exists
  const robot = await prisma.robot.findUnique({
    where: { id: robotId },
    include: { pots: { include: { plants: true } } }
  });

  if (!robot) {
    console.error(`❌ Error: Robot ${robotId} not found in the database. Please create it first.`);
    return;
  }

  // Clear existing mock logs for this robot
  await prisma.wateringLog.deleteMany({ where: { robotId } });
  await prisma.robotLog.deleteMany({ where: { robotId } });

  console.log('--- 🤖 Starting 7-Day Simulation (8-Step Workflow) ---');

  const now = new Date();

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
          message: `[SYSTEM] เช็ค Config: ${robot.id}, หน้าที่รดน้ำ ${robot.pots.length} กระถาง`,
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
      for (const pot of robot.pots) {
        // STEP 4: TRACKING
        await prisma.robotLog.create({
          data: {
            robotId: robot.id,
            state: 'TRACKING',
            message: `[TRACKING] ตรวจพบ กระถาง Track ${pot.trackIndex}, กำลังเช็คจำนวน Plant`,
            createdAt: addSeconds(10),
          }
        });

        for (const plant of pot.plants) {
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
            message: `[SYSTEM] รดน้ำกระถาง Track ${pot.trackIndex} เสร็จสิ้น เตรียมเคลื่อนที่ต่อ`,
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
