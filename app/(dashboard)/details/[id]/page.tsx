import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { 
  Bot, 
  Battery, 
  Wifi, 
  MapPin, 
  Clock, 
  Calendar,
  Flower2,
  Droplets,
  AlertTriangle,
  ChevronRight,
  History,
  Terminal,
  ChevronLeft,
  ChevronRight as ChevronRightIcon
} from "lucide-react";
import Link from "next/link";
import { RobotHistoryLogs } from "@/components/robot-history-logs";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function RobotDetailsPage({ params }: PageProps) {
  const { id } = await params;

  // 1. Fetch specific robot data with relations
  const robot = await prisma.robot.findUnique({
    where: { id },
    include: {
      pots: {
        include: {
          plants: true
        }
      },
      wateringLogs: {
        orderBy: { createdAt: 'desc' },
        take: 5
      }
    }
  });

  if (!robot) {
    notFound();
  }

  // 2. Initial Fetch for Robot Logs (First Page)
  const pageSize = 50;
  const [robotLogs, totalLogs] = await Promise.all([
    prisma.robotLog.findMany({
      where: { robotId: id },
      orderBy: { createdAt: 'desc' },
      take: pageSize,
    }),
    prisma.robotLog.count({
      where: { robotId: id }
    })
  ]);

  const totalPages = Math.ceil(totalLogs / pageSize);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs font-bold text-[#757575] uppercase tracking-widest">
        <Link href="/dashboard" className="hover:text-[#0E6633] transition-colors">Dashboard</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-[#0E6633]">Robot Details</span>
      </div>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-4xl font-black text-[#1e1e1e] tracking-tighter">{robot.name || "Unnamed Robot Unit"}</h2>
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-sm ${
              robot.status === 'Active' ? 'bg-[#22a042] text-white' : 'bg-yellow-400 text-yellow-900'
            }`}>
              {robot.status || 'Idle'}
            </span>
          </div>
          <p className="text-lg text-[#757575] font-mono font-bold uppercase tracking-tighter">{robot.id}</p>
        </div>
        
        <div className="flex gap-4">
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Battery</p>
              <div className="flex items-center gap-2">
                <Battery className={`w-5 h-5 ${robot.batteryLevel && robot.batteryLevel > 20 ? 'text-[#22a042]' : 'text-red-500'}`} />
                <span className="text-xl font-black text-[#1e1e1e]">{robot.batteryLevel || 0}%</span>
              </div>
            </div>
            <div className="w-px h-8 bg-gray-100" />
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Connection</p>
              <div className="flex items-center gap-2">
                <Wifi className="w-5 h-5 text-blue-500" />
                <span className="text-sm font-bold text-[#1e1e1e]">Stable</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Stats & Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm space-y-6">
            <h3 className="font-bold text-[#1e1e1e] flex items-center gap-2 uppercase text-xs tracking-widest border-b border-gray-50 pb-4">
              <Bot className="w-4 h-4 text-[#0E6633]" /> System Information
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-400 uppercase">Current State</span>
                <span className="text-sm font-black text-[#0E6633]">{robot.state || "SLEEP"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-400 uppercase">Last Seen</span>
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#1e1e1e]">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  {robot.lastActive ? new Date(robot.lastActive).toLocaleTimeString() : "N/A"}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-400 uppercase">Total Tracks</span>
                <span className="text-sm font-black text-[#1e1e1e]">{robot.pots.length} Assigned</span>
              </div>
            </div>

            <div className="pt-4">
              <div className="p-4 bg-[#0E6633]/5 rounded-2xl border border-[#0E6633]/10 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-[#0E6633] mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-[#0E6633]">Autonomous Mode</p>
                  <p className="text-[10px] text-[#0E6633]/70 font-medium leading-relaxed">
                    This unit is operating under scheduled parameters. Manual override is restricted to setup phase only.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Robot Logs Section (Client Side Pagination) */}
          <RobotHistoryLogs 
            robotId={id} 
            initialLogs={robotLogs} 
            initialTotal={totalLogs} 
            initialTotalPages={totalPages} 
          />
        </div>

        {/* Right: Pots & Recent Logs */}
        <div className="lg:col-span-2 space-y-8">
          {/* Assigned Pots Section */}
          <div className="space-y-4">
            <h3 className="font-bold text-[#1e1e1e] flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#0E6633]" /> Assigned Tracks & Pots
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {robot.pots.map((pot) => (
                <div key={pot.id} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:border-[#0E6633]/20 transition-all group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center font-black text-[#0E6633] border border-gray-100 group-hover:bg-[#0E6633] group-hover:text-white transition-all">
                        {pot.trackIndex}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-[#1e1e1e]">{pot.potName}</h4>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sector {(pot.trackIndex ?? 0) + 1}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {pot.plants.map((plant) => (
                      <div key={plant.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50/50">
                        <div className="flex items-center gap-2">
                          <Flower2 className="w-3.5 h-3.5 text-[#22a042]" />
                          <span className="text-xs font-bold text-[#1e1e1e]">{plant.plantName}</span>
                        </div>
                        <span className="text-[10px] font-bold text-[#22a042] uppercase">Healthy</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Watering Activity Section */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between">
              <h3 className="font-bold text-[#1e1e1e] flex items-center gap-2">
                <History className="w-5 h-5 text-[#0E6633]" /> Recent Watering Activity
              </h3>
              <Link href="/analytics" className="text-[10px] font-bold text-[#0E6633] hover:underline uppercase tracking-widest">
                Full Analytics
              </Link>
            </div>
            
            <div className="divide-y divide-gray-50">
              {robot.wateringLogs.length === 0 ? (
                <div className="px-8 py-12 text-center text-gray-400 italic text-sm">
                  No watering activity recorded for this unit yet.
                </div>
              ) : (
                robot.wateringLogs.map((log) => (
                  <div key={log.id} className="px-8 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                        <Droplets className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#1e1e1e]">Hydration Event</p>
                        <p className="text-[10px] font-medium text-gray-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {log.createdAt
                            ? `${new Date(log.createdAt).toLocaleDateString()} at ${new Date(log.createdAt).toLocaleTimeString()}`
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-[#0E6633]">+{log.waterAmountMl ?? 0}ml</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Moisture: {log.moistureBefore}% → {log.moistureAfter}%</p>
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
