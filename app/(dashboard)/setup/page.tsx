import { prisma } from "@/lib/prisma";
import { getAccessibleData } from "@/lib/data-access";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import SetupClientPage from "./setup-client";

export const dynamic = 'force-dynamic';

interface PlantTemplateItem {
  id: string;
  name: string;
  targetMoisturePct: number;
}

export default async function SetupPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const { zones } = await getAccessibleData();
  
  const plantTemplates = await prisma.plantTemplate.findMany({
    orderBy: { name: 'asc' }
  });

  const formattedTemplates: PlantTemplateItem[] = plantTemplates.map(t => ({
    id: t.id,
    name: t.name,
    targetMoisturePct: t.targetMoisturePct,
  }));

  return <SetupClientPage zones={zones} plantTemplates={formattedTemplates} />;
}
