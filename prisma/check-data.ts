import { prisma } from '../lib/prisma';

async function check() {
  try {
    const locations = await prisma.location.findMany({
      select: {
        id: true,
        spotName: true,
        fullCode: true,
        buildingCode: true,
        robots: {
          select: {
            id: true,
          }
        }
      },
      orderBy: { fullCode: 'asc' },
      take: 50
    });
    
    console.log('Locations found:', locations.length);
    console.log('Location Data (First 50):', JSON.stringify(locations, null, 2));
  } catch (err) {
    console.error('Error during check:', err);
  }
}

check().finally(() => (prisma as any).$disconnect?.());
