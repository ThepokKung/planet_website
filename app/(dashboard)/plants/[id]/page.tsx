import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { 
  Leaf, 
  Droplets, 
  Clock, 
  Calendar, 
  ChevronRight,
  Bot,
  MapPin,
  Flower2,
  TrendingUp,
  History
} from "lucide-react";
import Link from "next/link";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PlantLogsPage({ params }: PageProps) {
  const { id } = await params;

  const plant = await prisma.plant.findUnique({
    where: { id },
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
      }
    }
  });

  if (!plant) {
    notFound();
  }

  const robot = plant.pot?.robot;
  const location = robot?.location;

  // Calculate some stats from logs
  const totalWater = plant.wateringLogs.reduce((acc, log) => acc + (log.waterAmountMl || 0), 0);
  const avgMoistureBefore = plant.wateringLogs.length > 0 
    ? Math.round(plant.wateringLogs.reduce((acc, log) => acc + (log.moistureBefore || 0), 0) / plant.wateringLogs.length)
    : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs font-bold text-[#757575] uppercase tracking-widest">
        <Link href="/plants" className="hover:text-[#0E6633] transition-colors">Plant Inventory</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-[#0E6633]">Plant Logs</span>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex items-start gap-6">
          <div className="w-20 h-20 rounded-3xl bg-green-50 flex items-center justify-center text-[#0E6633] border border-green-100 shadow-sm">
            <Leaf className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-4xl font-black text-[#1e1e1e] tracking-tighter mb-1">{plant.plantName || "Unnamed Specimen"}</h2>
            <div className="flex flex-wrap gap-3">
              <span className="px-3 py-1 bg-white rounded-full text-[10px] font-black uppercase tracking-tighter shadow-sm border border-gray-100 text-[#757575]">
                ID: {plant.id}
              </span>
              <span className="px-3 py-1 bg-[#22a042] rounded-full text-[10px] font-black uppercase tracking-tighter shadow-sm text-white">
                Active Growth
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Summary Cards */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm space-y-6">
            <h3 className="font-bold text-[#1e1e1e] flex items-center gap-2 uppercase text-xs tracking-widest border-b border-gray-50 pb-4">
              <TrendingUp className="w-4 h-4 text-[#0E6633]" /> Performance Summary
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-2xl space-y-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Total Water</p>
                <p className="text-xl font-black text-[#1e1e1e]">{totalWater}ml</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-2xl space-y-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Avg Moisture</p>
                <p className="text-xl font-black text-[#1e1e1e]">{avgMoistureBefore}%</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-2xl space-y-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Target</p>
                <p className="text-xl font-black text-[#0E6633]">{plant.targetMoisturePct}%</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-2xl space-y-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Events</p>
                <p className="text-xl font-black text-[#1e1e1e]">{plant.wateringLogs.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm space-y-6">
            <h3 className="font-bold text-[#1e1e1e] flex items-center gap-2 uppercase text-xs tracking-widest border-b border-gray-50 pb-4">
              <MapPin className="w-4 h-4 text-[#0E6633]" /> Deployment Info
            </h3>
            
            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Assigned Robot</span>
                <Link href={`/details/${robot?.id}`} className="text-sm font-black text-[#1e1e1e] flex items-center gap-2 hover:text-[#0E6633] transition-colors">
                  <Bot className="w-4 h-4" /> {robot?.name || "Unidentified Unit"}
                </Link>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Zone / Location</span>
                <div className="text-sm font-black text-[#1e1e1e] flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" /> {location?.spotName || "N/A"} ({location?.fullCode || "No Code"})
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Track Position</span>
                <div className="text-sm font-black text-[#1e1e1e] flex items-center gap-2">
                  <Flower2 className="w-4 h-4 text-gray-400" /> Track {plant.pot?.trackIndex} • {plant.pot?.potName}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Detailed Logs */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
              <h3 className="font-bold text-[#1e1e1e] flex items-center gap-2">
                <History className="w-5 h-5 text-[#0E6633]" /> Hydration Logs
              </h3>
              <span className="text-[10px] font-black text-[#757575] bg-white px-3 py-1 rounded-full border border-gray-100 shadow-sm">
                {plant.wateringLogs.length} Records
              </span>
            </div>
            
            <div className="divide-y divide-gray-50">
              {plant.wateringLogs.length === 0 ? (
                <div className="px-8 py-20 text-center text-gray-400">
                  <Droplets className="w-12 h-12 opacity-10 mx-auto mb-4" />
                  <p className="font-medium italic">No watering logs recorded for this plant yet.</p>
                </div>
              ) : (
                plant.wateringLogs.map((log) => (
                  <div key={log.id} className="px-8 py-6 flex items-center justify-between hover:bg-gray-50/50 transition-all group">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                        <Droplets className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-base font-black text-[#1e1e1e]">Hydration Event</p>
                        <div className="flex items-center gap-3 mt-1">
                          <p className="text-[10px] font-bold text-gray-400 flex items-center gap-1 uppercase tracking-widest">
                            <Calendar className="w-3 h-3" />
                            {log.createdAt ? new Date(log.createdAt).toLocaleDateString() : "N/A"}
                          </p>
                          <p className="text-[10px] font-bold text-gray-400 flex items-center gap-1 uppercase tracking-widest">
                            <Clock className="w-3 h-3" />
                            {log.createdAt ? new Date(log.createdAt).toLocaleTimeString() : "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-xl font-black text-[#0E6633]">+{log.waterAmountMl ?? 0}ml</p>
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Moisture</span>
                        <span className="px-2 py-0.5 bg-gray-100 rounded text-[10px] font-black text-[#1e1e1e]">
                          {log.moistureBefore}% → {log.moistureAfter}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
