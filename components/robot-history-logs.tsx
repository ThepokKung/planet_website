"use client";

import { useState, useEffect, useCallback } from "react";
import { Terminal, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { getRobotLogsAction } from "@/actions/robots";

interface RobotLog {
  id: string;
  state: string | null;
  message: string | null;
  createdAt: Date | null;
}

interface RobotHistoryLogsProps {
  robotId: string;
  initialLogs: RobotLog[];
  initialTotal: number;
  initialTotalPages: number;
}

export function RobotHistoryLogs({ 
  robotId, 
  initialLogs, 
  initialTotal, 
  initialTotalPages 
}: RobotHistoryLogsProps) {
  const [logs, setLogs] = useState<RobotLog[]>(initialLogs);
  const [total, setTotal] = useState(initialTotal);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const fetchLogs = useCallback(async (page: number) => {
    setIsLoading(true);
    try {
      const result = await getRobotLogsAction(robotId, page);
      setLogs(result.logs);
      setTotal(result.total);
      setTotalPages(result.totalPages);
      setCurrentPage(page);
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    } finally {
      setIsLoading(false);
    }
  }, [robotId]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && !isLoading) {
      fetchLogs(newPage);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-[600px]">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
        <h3 className="font-bold text-[#1e1e1e] flex items-center gap-2 text-sm">
          <Terminal className="w-4 h-4 text-[#0E6633]" /> Robot History Logs
        </h3>
        <div className="flex items-center gap-3">
          {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0E6633]" />}
          <span className="text-[10px] font-bold text-[#757575] bg-white px-2 py-1 rounded border">
            {total} Total
          </span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto font-mono text-[10px] relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-20 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-[#0E6633]" />
          </div>
        )}
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-white border-b border-gray-100 shadow-sm z-10">
            <tr className="text-[#757575] uppercase tracking-tighter font-bold">
              <th className="px-4 py-2">Time</th>
              <th className="px-4 py-2">State</th>
              <th className="px-4 py-2 text-right">Msg</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-gray-400 italic">No logs found</td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-2 text-gray-400 whitespace-nowrap">
                    {log.createdAt ? new Date(log.createdAt).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) : "-"}
                  </td>
                  <td className="px-4 py-2">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                      log.state === 'ERROR' ? 'bg-red-100 text-red-600' :
                      log.state === 'WATERING' ? 'bg-blue-100 text-blue-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {log.state}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-gray-600 text-right truncate max-w-[100px]" title={log.message || ""}>
                    {log.message}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <p className="text-[10px] font-bold text-gray-400 uppercase">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1 || isLoading}
              className={`p-1.5 rounded-lg border transition-all ${currentPage <= 1 ? 'opacity-30 bg-gray-100 cursor-not-allowed' : 'bg-white hover:bg-gray-50 border-gray-200'}`}
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages || isLoading}
              className={`p-1.5 rounded-lg border transition-all ${currentPage >= totalPages ? 'opacity-30 bg-gray-100 cursor-not-allowed' : 'bg-white hover:bg-gray-50 border-gray-200'}`}
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
