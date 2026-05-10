import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { Location, Robot } from "@prisma/client";

// Helper for natural sorting (N1, N2... N10, N20)
interface ZoneWithRobots extends Partial<Location> {
  id: string;
  fullCode: string | null;
  robots?: { id: string }[];
}

function naturalSortZones<T extends { fullCode: string | null }>(zones: T[]): T[] {
  return [...zones].sort((a, b) => {
    const codeA = a.fullCode || "";
    const codeB = b.fullCode || "";
    return codeA.localeCompare(codeB, undefined, { numeric: true, sensitivity: 'base' });
  });
}

export async function getAccessibleData() {
  const session = await getSession();
  
  if (!session) {
    return { role: null, zones: [] as ZoneWithRobots[], robots: [] as Partial<Robot>[] };
  }
  
  // If Super Admin, fetch all data
  if (session.role === 'SUPER ADMIN') {
    const rawZones = await prisma.location.findMany({
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
    const zones = naturalSortZones(rawZones);
    const robots = await prisma.robot.findMany({
      select: {
        id: true,
        name: true,
        locationId: true,
      }
    });
    return { role: session.role, zones, robots };
  }

  const { role, userId } = session;

  // ADMIN - find assigned locations (Still restricted to assigned zones for management/focus)
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

  const rawZones = user?.locations || [];
  const zones = naturalSortZones(rawZones);
  const robots = zones.flatMap(z => (z as ZoneWithRobots).robots || []) as Partial<Robot>[];
  
  return { role, zones, robots };
}
