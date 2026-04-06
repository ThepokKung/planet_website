import { prisma } from '../lib/prisma';

async function check() {
  try {
    const count = await prisma.wateringLog.count();
    const latest = await prisma.wateringLog.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' }
    });
    
    console.log('Total Watering Logs:', count);
    console.log('Latest Logs:', JSON.stringify(latest, null, 2));
  } catch (err) {
    console.error('Error during check:', err);
  }
}

check().finally(() => (prisma as any).$disconnect?.());
