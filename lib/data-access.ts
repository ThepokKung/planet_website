import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function getAccessibleData() {
  const session = await getSession();
  if (!session) return { role: null, zones: [], robots: [] };

  const { role, userId } = session;

  if (role === 'SUPER ADMIN') {
    const zones = await prisma.location.findMany({
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
      }
    });
    const robots = await prisma.robot.findMany({
      select: {
        id: true,
        name: true,
        locationId: true,
      }
    });
    return { role, zones, robots };
  } else {
    // ADMIN - find assigned locations
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { 
        locations: {
          select: {
            id: true,
            spotName: true,
            fullCode: true,
            buildingCode: true,
            robots: {
              select: {
                id: true,
                name: true,
                locationId: true,
              }
            }
          }
        }
      }
    });

    const zones = user?.locations || [];
    const robots = zones.flatMap(z => z.robots);
    
    return { role, zones, robots };
  }
}
