import { prisma } from "@/lib/prisma";
import { DateRangePicker } from "@/components/date-range-picker";
import { SystemLogTable } from "@/components/system-log-table";
import { 
  Download,
  History
} from "lucide-react";

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<{ from?: string; to?: string }>;
}

export default async function SystemLogsPage({ searchParams }: Props) {
  const params = await searchParams;
  
  // 1. Resolve date range (default to last 7 days)
  const to = params.to ? new Date(params.to) : new Date();
  const from = params.from ? new Date(params.from) : new Date();
  if (!params.from) {
    from.setDate(to.getDate() - 7);
  }
  
  // Set time for inclusive range
  from.setHours(0, 0, 0, 0);
  to.setHours(23, 59, 59, 999);

  // 2. Query 'robot_logs' from Prisma with related Robot name
  const robotLogs = await prisma.robotLog.findMany({
    where: {
      createdAt: {
        gte: from,
        lte: to
      }
    },
    include: {
      robot: {
        select: {
          name: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-[#1e1e1e] flex items-center gap-3">
            <History className="w-8 h-8 text-[#0E6633]" />
            System Audit Trail
          </h2>
          <p className="text-[#757575] mt-1 font-medium">Deep-dive into chronological hardware states and error reporting</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <DateRangePicker />
          <button className="flex items-center gap-2 px-6 py-2.5 bg-[#0E6633] text-white rounded-xl text-sm font-bold hover:bg-[#0c592b] transition-all shadow-lg shadow-[#0E6633]/20">
            <Download className="w-4 h-4" /> Export Audit Log
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <SystemLogTable logs={robotLogs} />
      </div>

      {/* Quick Summary Footer */}
      <div className="flex items-center justify-between p-6 bg-gray-50 rounded-2xl border border-gray-100">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-[#757575] uppercase tracking-widest">Selected Range</span>
            <span className="text-xs font-bold text-[#1e1e1e]">{from.toLocaleDateString()} — {to.toLocaleDateString()}</span>
          </div>
          <div className="w-px h-8 bg-gray-200" />
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-[#757575] uppercase tracking-widest">Incident Ratio</span>
            <span className="text-xs font-bold text-red-600">
              {robotLogs.filter(l => l.state?.toUpperCase() === 'ERROR').length} Errors Detected
            </span>
          </div>
        </div>
        <p className="text-[10px] text-[#757575] font-bold italic tracking-tight">
          Logs are retained for 90 days as per organizational policy.
        </p>
      </div>
    </div>
  );
}
