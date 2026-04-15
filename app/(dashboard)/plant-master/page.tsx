import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { Leaf, Plus, Trash2, Edit2, Droplets, Thermometer, Gauge } from "lucide-react";
import { PlantTemplateForm } from "@/components/plant-template-form";

export const dynamic = 'force-dynamic';

interface PlantTemplateItem {
  id: string;
  name: string;
  targetMoisturePct: number;
}

export default async function PlantMasterPage() {
  const session = await getSession();
  if (!session || session.role !== 'SUPER ADMIN') {
    redirect("/dashboard");
  }
  const plantTemplate = (prisma as any).plantTemplate;
  const canManageTemplates = !!plantTemplate?.findMany;

  let templates: PlantTemplateItem[] = [];

  if (canManageTemplates) {
    templates = await plantTemplate.findMany({
      orderBy: { name: 'asc' }
    });
  } else {
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

    templates = fallbackPlants.map((plant) => ({
      id: plant.id,
      name: plant.plantName || "Unknown Plant",
      targetMoisturePct: plant.targetMoisturePct ?? 50,
    }));
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#1e1e1e]">Plant Master</h2>
          <p className="text-[#757575] mt-1">Manage global plant templates for robot configuration</p>
          {!canManageTemplates && (
            <p className="text-amber-600 mt-2 text-xs font-bold uppercase tracking-wide">
              Read-only mode: PlantTemplate model is unavailable in current Prisma client.
            </p>
          )}
        </div>
        {canManageTemplates && <PlantTemplateForm />}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.length === 0 ? (
          <div className="col-span-full bg-white border border-dashed border-gray-300 rounded-3xl p-12 text-center">
            <Leaf className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-400">No plant templates found</h3>
            <p className="text-sm text-gray-400 mt-1">Create your first template to start configuring robots.</p>
          </div>
        ) : (
          templates.map((template) => (
            <div key={template.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                  <Leaf className="w-6 h-6 text-[#0E6633]" />
                </div>
                {canManageTemplates && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <PlantTemplateForm template={template} isEdit />
                  </div>
                )}
              </div>

              <h3 className="text-xl font-bold text-[#1e1e1e] mb-4">{template.name}</h3>

              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Thermometer className="w-4 h-4 text-orange-500" />
                    <span className="text-xs font-bold text-[#757575] uppercase tracking-wider">Target Moisture</span>
                  </div>
                  <span className="text-sm font-extrabold text-[#1e1e1e]">{template.targetMoisturePct}%</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
