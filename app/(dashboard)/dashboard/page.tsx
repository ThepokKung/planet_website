import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { 
  Bot, 
  Flower2, 
  Leaf, 
  Droplets,
  Radio,
  Clock,
  ArrowUpRight,
  ExternalLink
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Opt out of cache for live dashboard stats as per Gemini.md
export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  const robots = await prisma.robot.findMany({
    include: {
      pots: {
        include: {
          plants: true
        }
      },
      _count: {
        select: { wateringLogs: true }
      }
    }
  });

  const totalPots = robots.reduce((acc, r) => acc + r.pots.length, 0);
  const totalPlants = robots.reduce((acc, r) => 
    acc + r.pots.reduce((pAcc, p) => pAcc + p.plants.length, 0), 0
  );
  
  const totalLogsToday = await prisma.wateringLog.count({
    where: {
      createdAt: {
        gte: new Date(new Date().setHours(0, 0, 0, 0))
      }
    }
  });

  const stats = [
    { name: "Total Bots", value: robots.length, icon: Bot, status: "System connected", color: "text-[#0E6633]" },
    { name: "Total Pots", value: totalPots, icon: Flower2, status: `across ${robots.length} units`, color: "text-[#0E6633]" },
    { name: "Total Plants", value: totalPlants, icon: Leaf, status: "Healthy & Active", color: "text-[#22a042]" },
    { name: "Watering Events", value: totalLogsToday, icon: Droplets, status: "Past 24 hours", color: "text-blue-600" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#1e1e1e]">Dashboard Overview</h2>
          <p className="text-[#757575] mt-1">Real-time status of your IoT robot network</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2">
            <ArrowUpRight className="w-4 h-4" /> Export Report
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-[#757575] uppercase tracking-widest">{stat.name}</span>
              <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
                <stat.icon className={cn("w-5 h-5", stat.color)} />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-[#1e1e1e]">
              {stat.value}
            </div>
            <div className={cn("text-xs mt-2 font-medium flex items-center gap-1", stat.color)}>
              {stat.status}
            </div>
          </div>
        ))}
      </div>

      {/* Robot Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <h3 className="font-bold text-[#1e1e1e] flex items-center gap-2">
            <Bot className="w-5 h-5 text-[#0E6633]" /> Connected Robots
          </h3>
          <span className="text-xs font-mono text-[#757575] bg-white px-2 py-1 rounded border border-gray-200">
            {robots.length} Units Active
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100 text-[#757575] text-xs uppercase tracking-wider font-bold">
                <th className="px-6 py-4">Robot ID</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Battery</th>
                <th className="px-6 py-4">Current Task</th>
                <th className="px-6 py-4">Pots Assigned</th>
                <th className="px-6 py-4 text-right">Last Sync</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {robots.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3 text-[#757575]">
                      <Bot className="w-12 h-12 opacity-20" />
                      <p className="text-sm font-medium">No robots found in the database.</p>
                      <button className="text-xs font-bold text-[#0E6633] hover:underline">
                        Register New Hardware
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                robots.map((robot) => (
                  <tr key={robot.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                      <Link href={`/details/${robot.id}`} className="flex items-center gap-3 group/link">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#22a042] pulse-dot"></div>
                        <div>
                          <p className="font-bold text-sm text-[#1e1e1e] group-hover/link:text-[#0E6633] transition-colors">{robot.id}</p>
                          <p className="text-[10px] text-[#757575] font-mono group-hover/link:text-[#0E6633]/70 transition-colors">{robot.name || "Default Name"}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight",
                        robot.status === 'Active' ? "bg-green-100 text-[#0E6633]" : "bg-yellow-100 text-yellow-700"
                      )}>
                        {robot.status || 'Idle'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "h-full rounded-full transition-all",
                              (robot.batteryLevel ?? 0) > 70 ? "bg-[#22a042]" : (robot.batteryLevel ?? 0) > 30 ? "bg-yellow-500" : "bg-red-500"
                            )} 
                            style={{ width: `${robot.batteryLevel ?? 0}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono font-bold text-[#757575]">{robot.batteryLevel ?? 0}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-[#1e1e1e] font-medium">{robot.state || "Waiting for task..."}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <Flower2 className="w-3.5 h-3.5 text-[#757575]" />
                        <span className="text-xs font-bold">{robot.pots.length} Pots</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 text-[#757575]">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-medium">
                          {robot.lastActive ? new Date(robot.lastActive).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Never"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        href={`/details/${robot.id}`}
                        className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[#0E6633] hover:bg-green-50 px-3 py-1.5 rounded-lg transition-all"
                      >
                        Details <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
