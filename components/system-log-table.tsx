"use client";

import { Clock, Bot, Activity, Info, AlertTriangle, CheckCircle2 } from "lucide-react";

export interface RobotLogWithRobot {
  id: string;
  robotId: string | null;
  state: string | null;
  message: string | null;
  createdAt: Date | null;
  robot: {
    name: string | null;
  } | null;
}

const getStateBadge = (state: string | null) => {
  const s = state?.toUpperCase() || "UNKNOWN";
  
  switch (s) {
    case "ERROR":
      return <span className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-600 rounded-lg text-[10px] font-black border border-red-100 uppercase tracking-tighter shadow-sm shadow-red-500/10"><AlertTriangle className="w-3 h-3" /> {s}</span>;
    case "WATERING":
      return <span className="flex items-center gap-1.5 px-2.5 py-1 bg-[#22a042]/10 text-[#22a042] rounded-lg text-[10px] font-black border border-[#22a042]/20 uppercase tracking-tighter shadow-sm"><Activity className="w-3 h-3" /> {s}</span>;
    case "SLEEP":
      return <span className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-500 rounded-lg text-[10px] font-black border border-gray-200 uppercase tracking-tighter shadow-sm"><Clock className="w-3 h-3" /> {s}</span>;
    case "MOVING":
      return <span className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black border border-blue-100 uppercase tracking-tighter shadow-sm"><Bot className="w-3 h-3" /> {s}</span>;
    case "WAKEUP":
      return <span className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 text-purple-600 rounded-lg text-[10px] font-black border border-purple-100 uppercase tracking-tighter shadow-sm"><Info className="w-3 h-3" /> {s}</span>;
    default:
      return <span className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-[#0E6633] rounded-lg text-[10px] font-black border border-green-100 uppercase tracking-tighter shadow-sm"><CheckCircle2 className="w-3 h-3" /> {s}</span>;
  }
};

export function SystemLogTable({ logs }: { logs: RobotLogWithRobot[] }) {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gradient-to-r from-white to-gray-50/50">
        <div>
          <h3 className="font-bold text-xl text-[#1e1e1e] flex items-center gap-3">
            <div className="p-2 bg-[#0E6633]/5 rounded-xl">
              <Bot className="w-6 h-6 text-[#0E6633]" />
            </div>
            System Operational Logs
          </h3>
          <p className="text-xs text-[#757575] font-medium mt-1 ml-11">Real-time sequence of hardware events and system state transitions</p>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-black text-[#757575] bg-white px-3 py-1.5 rounded-xl uppercase border border-gray-100 tracking-widest shadow-sm">
            {logs.length} Sequential Events
          </span>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/30">
              <th className="px-8 py-5 text-[10px] font-black text-[#757575] uppercase tracking-[0.2em] border-b border-gray-50">Date & Time</th>
              <th className="px-8 py-5 text-[10px] font-black text-[#757575] uppercase tracking-[0.2em] border-b border-gray-50">Robot Name (ID)</th>
              <th className="px-8 py-5 text-[10px] font-black text-[#757575] uppercase tracking-[0.2em] border-b border-gray-50">Operational State</th>
              <th className="px-8 py-5 text-[10px] font-black text-[#757575] uppercase tracking-[0.2em] border-b border-gray-50">Message</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-8 py-20 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                      <Clock className="w-8 h-8 text-gray-200" />
                    </div>
                    <p className="text-sm text-[#757575] font-bold uppercase tracking-widest">No Log Data Identified</p>
                    <p className="text-xs text-[#757575]/60 mt-1 italic">Adjust the date range to explore historical sequences.</p>
                  </div>
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-[#0E6633]/[0.02] transition-colors group">
                  <td className="px-8 py-5 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-[#1e1e1e] group-hover:text-[#0E6633] transition-colors">
                        {log.createdAt ? new Date(log.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "-"}
                      </span>
                      <span className="text-[10px] text-[#757575] font-black uppercase tracking-tighter">
                        {log.createdAt ? new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) : "-"}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-sm font-extrabold text-[#1e1e1e]">
                        {log.robot?.name || "Unidentified Unit"}
                      </span>
                      <span className="text-[10px] font-black text-[#757575] bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200 uppercase tracking-widest w-fit mt-1">
                        {log.robotId || "N/A"}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap">
                    {getStateBadge(log.state)}
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#0E6633]/20 group-hover:bg-[#0E6633] transition-colors shrink-0" />
                      <p className="text-sm font-bold text-[#4a4a4a] line-clamp-2 leading-relaxed">{log.message || "Sequence executed without descriptive output."}</p>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
