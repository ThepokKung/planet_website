import { prisma } from "@/lib/prisma";
import { getAccessibleData } from "@/lib/data-access";
import { 
  Leaf, 
  Bot, 
  MapPin, 
  Droplets, 
  Clock, 
  Search,
  ChevronRight,
  Flower2
} from "lucide-react";
import Link from "next/link";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { DashboardFilters } from "@/components/dashboard-filters";
import { PageHeader } from "@/components/page-header";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const dynamic = 'force-dynamic';

export default async function PlantsPage({
  searchParams,
}: {
  searchParams: Promise<{ zone?: string; robot?: string }>;
}) {
  const { zone, robot } = await searchParams;
  const { zones, robots: allAccessibleRobots } = await getAccessibleData();

  // Determine target robot IDs based on filters
  let targetRobotIds = allAccessibleRobots.map(r => r.id);
  if (zone && zone !== 'all') {
    targetRobotIds = allAccessibleRobots.filter(r => r.locationId === zone).map(r => r.id);
  }
  if (robot && robot !== 'all') {
    targetRobotIds = targetRobotIds.filter(id => id === robot);
  }

  const plants = await prisma.plant.findMany({
    where: {
      pot: {
        robotId: { in: targetRobotIds }
      }
    },
    include: {
      pot: {
        include: {
          robot: {
            include: {
              location: true
            }
          }
        }
      },
      wateringLogs: {
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    },
    orderBy: { plantName: 'asc' }
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <PageHeader 
        title="Plant Inventory"
        description="Comprehensive list of all plants across your active robot fleet"
      >
        <div className="relative group w-full md:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#0E6633] transition-colors" />
          <input 
            type="text" 
            placeholder="Search plants..." 
            className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0E6633]/20 focus:border-[#0E6633] w-full md:w-64 transition-all"
          />
        </div>
      </PageHeader>

      <DashboardFilters 
        zones={zones} 
        robots={allAccessibleRobots} 
        showZoneFilter={true} 
      />

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100 text-[#757575] text-xs uppercase tracking-wider font-bold bg-gray-50/50">
                <th className="px-6 py-4">Plant Identity</th>
                <th className="px-6 py-4">Robot / Track</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4 text-center">Moisture Target</th>
                <th className="px-6 py-4">Last Hydration</th>
                <th className="px-6 py-4 text-right">Status</th>
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {plants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-8 py-20 text-center">
                    <Leaf className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-400 font-medium">No plants found in your fleet.</p>
                  </td>
                </tr>
              ) : (
                plants.map((plant) => {
                  const lastLog = plant.wateringLogs[0];
                  const robot = plant.pot?.robot;
                  const location = robot?.location;
                  
                  return (
                    <tr key={plant.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-[#0E6633]">
                            <Leaf className="w-5 h-5" />
                          </div>
                          <div>
                            <Link href={`/plants/${plant.id}`}>
                              <p className="font-bold text-[#1e1e1e] hover:text-[#0E6633] transition-colors">{plant.plantName || "Unknown Specimen"}</p>
                            </Link>
                            <p className="text-[10px] font-mono text-gray-400 uppercase tracking-tighter">ID: {plant.id.split('-')[0]}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <Link href={`/details/${robot?.id}`} className="flex items-center gap-1.5 text-xs font-bold text-[#1e1e1e] hover:text-[#0E6633] transition-colors">
                            <Bot className="w-3.5 h-3.5 text-[#757575]" />
                            {robot?.name || "Unidentified Bot"}
                          </Link>
                          <div className="flex items-center gap-1.5 text-[10px] text-[#757575] font-bold uppercase tracking-widest">
                            <Flower2 className="w-3 h-3" />
                            Track {plant.pot?.trackIndex} • {plant.pot?.potName}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-[#1e1e1e]">
                          <MapPin className="w-3.5 h-3.5 text-[#757575]" />
                          {location?.spotName || "No Zone"}
                        </div>
                        <p className="text-[10px] text-gray-400 font-medium ml-5">{location?.fullCode || ""}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-center gap-1.5">
                          <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500 rounded-full" 
                              style={{ width: `${plant.targetMoisturePct}%` }}
                            />
                          </div>
                          <span className="text-xs font-black text-[#1e1e1e]">{plant.targetMoisturePct}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {lastLog ? (
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-[#1e1e1e] flex items-center gap-1.5">
                              <Droplets className="w-3.5 h-3.5 text-blue-500" />
                              +{lastLog.waterAmountMl}ml
                            </p>
                            <p className="text-[10px] font-medium text-gray-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(lastLog.createdAt!).toLocaleDateString()}
                            </p>
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold text-gray-300 uppercase italic">No history</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={cn(
                          "inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter",
                          lastLog && lastLog.moistureAfter && lastLog.moistureAfter >= (plant.targetMoisturePct || 0)
                            ? "bg-green-100 text-[#0E6633]"
                            : "bg-blue-100 text-blue-700"
                        )}>
                          {lastLog && lastLog.moistureAfter && lastLog.moistureAfter >= (plant.targetMoisturePct || 0) ? "Optimal" : "Healthy"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link 
                          href={`/plants/${plant.id}`}
                          className="inline-flex items-center justify-center gap-1.5 text-xs font-bold bg-white border border-gray-200 text-[#1e1e1e] px-4 py-2 rounded-xl hover:bg-gray-50 hover:border-[#0E6633]/30 hover:text-[#0E6633] transition-all shadow-sm"
                        >
                          View
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
