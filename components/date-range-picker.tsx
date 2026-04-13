"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Calendar, Filter } from "lucide-react";
import { useState, useEffect } from "react";

export function DateRangePicker() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [fromDate, setFromDate] = useState(
    searchParams.get("from") || 
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [toDate, setToDate] = useState(
    searchParams.get("to") || 
    new Date().toISOString().split("T")[0]
  );

  const handleApply = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("from", fromDate);
    params.set("to", toDate);
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-xl border border-gray-100">
        <Calendar className="w-4 h-4 text-[#0E6633]" />
        <span className="text-xs font-bold text-[#757575] uppercase tracking-wider">Range</span>
      </div>
      
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          className="text-sm font-medium border-none focus:ring-0 bg-transparent p-1 cursor-pointer"
        />
        <span className="text-gray-300">to</span>
        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          className="text-sm font-medium border-none focus:ring-0 bg-transparent p-1 cursor-pointer"
        />
      </div>

      <button
        onClick={handleApply}
        className="flex items-center gap-2 px-4 py-1.5 bg-[#0E6633] text-white rounded-xl text-xs font-bold hover:bg-[#0c592b] transition-all shadow-md shadow-[#0E6633]/10"
      >
        <Filter className="w-3.5 h-3.5" /> Apply Filter
      </button>
    </div>
  );
}
