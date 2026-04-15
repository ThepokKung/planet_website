import { prisma } from "@/lib/prisma";
import { getAccessibleData } from "@/lib/data-access";
import SetupClientPage from "./setup-client";

export const dynamic = 'force-dynamic';

interface PlantTemplateItem {
  id: string;
  name: string;
  targetMoisturePct: number;
}

export default async function SetupPage() {
  const { zones } = await getAccessibleData();
  const plantTemplate = (prisma as any).plantTemplate;

  let plantTemplates: PlantTemplateItem[] = [];

  if (plantTemplate?.findMany) {
    plantTemplates = await plantTemplate.findMany({
      orderBy: { name: 'asc' }
    });
  } else {
    // Fallback for environments where PlantTemplate model is not available in Prisma client
    const fallbackPlants = await prisma.plant.findMany({
      where: { plantName: { not: null } },
      select: {
        id: true,
        plantName: true,
        targetMoisturePct: true,
      },
      distinct: ["plantName"],
      orderBy: { plantName: "asc" },
      take: 200,
    });

    plantTemplates = fallbackPlants.map((plant) => ({
      id: plant.id,
      name: plant.plantName || "Unknown Plant",
      targetMoisturePct: plant.targetMoisturePct ?? 50,
    }));
  }

  return <SetupClientPage zones={zones} plantTemplates={plantTemplates} />;
}
