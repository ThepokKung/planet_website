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
} from "lucide-react";
import Link from "next/link";
import { RobotHistoryLogs } from "@/components/robot-history-logs";
import { RobotCommandButton } from "@/components/robot-command-button";
import { RobotStartTaskButton } from "@/components/robot-start-task-button";
import { RobotTelemetryStream } from "@/components/robot-telemetry-stream";
import { PageHeader } from "@/components/page-header";

interface PageProps {
  params: Promise<{ id: string }>;
}

import { AutoRefresh } from "@/components/auto-refresh";

export default async function RobotDetailsPage({ params }: PageProps) {
  const { id } = await params;
  const nodeRedBaseUrl =
    process.env.NODE_RED_BASE_URL ||
    (process.env.NODE_ENV === "development" ? "http://localhost:1880" : "");

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

  const initialTelemetry = {
    state: robot.state ?? undefined,
    status: robot.status ?? undefined,
    battery_level: robot.batteryLevel ?? undefined,
    current_track_index: robot.currentTrackIndex ?? undefined,
    last_active: robot.lastActive ? robot.lastActive.toISOString() : undefined,
  };

  const isOffline = !robot.lastActive || (Date.now() - new Date(robot.lastActive).getTime() > 5000);
  const displayStatus = isOffline ? 'Offline' : (robot.status || 'Idle');

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <AutoRefresh intervalMs={5000} />
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs font-bold text-[#757575] uppercase tracking-widest">
        <Link href="/dashboard" className="hover:text-[#0E6633] transition-colors">Dashboard</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-[#0E6633]">Robot Details</span>
      </div>

      <PageHeader
        title={robot.name || "Unnamed Robot Unit"}
        description={`Unit ID: ${robot.id}`}
        titleBadge={
          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-sm ${
            isOffline ? 'bg-red-500 text-white' : (robot.status === 'Active' ? 'bg-[#22a042] text-white' : 'bg-yellow-400 text-yellow-900')
          }`}>
            {displayStatus}
          </span>
        }
      >
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
              <Wifi className={`w-5 h-5 ${isOffline ? 'text-red-500' : 'text-blue-500'}`} />
              <span className={`text-sm font-bold ${isOffline ? 'text-red-500' : 'text-[#1e1e1e]'}`}>{isOffline ? 'Offline' : 'Stable'}</span>
            </div>
          </div>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Stats & Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-[#1e1e1e] flex items-center gap-2 border-b border-gray-50 pb-4">
              <Bot className="w-5 h-5 text-[#0E6633]" /> System Information
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

          <RobotStartTaskButton robotId={robot.id} />
          <RobotCommandButton robotId={robot.id} pots={robot.pots} />
          {/* 
          <RobotTelemetryStream
            robotId={robot.id}
            nodeRedBaseUrl={nodeRedBaseUrl}
            initialTelemetry={initialTelemetry}
          /> 
          */}

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
            <h3 className="text-lg font-bold text-[#1e1e1e] flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#0E6633]" /> Assigned Tracks & Pots
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {robot.pots.map((pot) => (
                <div key={pot.id} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:border-[#0E6633]/20 transition-all group overflow-hidden">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center font-black text-[#0E6633] border border-gray-100 group-hover:bg-[#0E6633] group-hover:text-white transition-all">
                        {pot.trackIndex}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-[#1e1e1e] break-words leading-tight">{pot.potName}</h4>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sector {(pot.trackIndex ?? 0) + 1}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {pot.plants.map((plant) => (
                      <div key={plant.id} className="flex flex-col gap-1 p-3 rounded-xl bg-gray-50/50">
                        <div className="flex items-start justify-between gap-2">
                          <Link href={`/plants/${plant.id}`} className="flex items-start gap-2 group/plant min-w-0 flex-1">
                            <Flower2 className="w-3.5 h-3.5 text-[#22a042] group-hover/plant:scale-110 transition-transform" />
                            <span className="text-xs font-bold text-[#1e1e1e] group-hover/plant:text-[#0E6633] transition-colors whitespace-normal break-words leading-tight">{plant.plantName}</span>
                          </Link>
                          <span className="text-[10px] font-bold text-[#22a042] uppercase tracking-tighter bg-green-50 px-1.5 py-0.5 rounded shrink-0">Healthy</span>
                        </div>
                        <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-1 pl-0 sm:pl-5">
                          <div className="flex items-center gap-1">
                            <Droplets className="w-3 h-3 text-blue-400" />
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Target:</span>
                            <span className="text-[10px] font-black text-[#1e1e1e]">{plant.targetMoisturePct}%</span>
                          </div>
                          <div className="hidden sm:block w-px h-2 bg-gray-200" />
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Limit:</span>
                            <span className="text-[10px] font-black text-[#1e1e1e]">{plant.maxWaterDurationSec}s</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Watering Activity Section */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#1e1e1e] flex items-center gap-2">
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
