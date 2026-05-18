"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Clock } from "lucide-react";

export function TimeRangeDropdown() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Determine current value from URL (default to 7)
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  
  let currentVal = "custom";
  
  if (!from && !to) {
    currentVal = "7"; // Default
  } else if (from && to) {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    const now = new Date();
    
    // Set all to midnight for accurate day comparison
    fromDate.setHours(0, 0, 0, 0);
    toDate.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    
    // Check if "to" is today
    const isToToday = toDate.getTime() === now.getTime();
    
    if (isToToday) {
      const diffTime = Math.abs(toDate.getTime() - fromDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if ([1, 7, 14].includes(diffDays)) {
        currentVal = diffDays.toString();
      }
    }
  }

  const handleRangeChange = (days: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (days === "custom") return;

    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setDate(toDate.getDate() - parseInt(days));

    params.set("from", fromDate.toISOString().split("T")[0]);
    params.set("to", toDate.toISOString().split("T")[0]);
    
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="relative group">
      <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl hover:border-[#0E6633] transition-all cursor-pointer shadow-sm">
        <Clock className="w-4 h-4 text-[#0E6633]" />
        <select 
          value={currentVal}
          onChange={(e) => handleRangeChange(e.target.value)}
          className="bg-transparent border-none text-xs font-bold text-[#1e1e1e] uppercase tracking-wider focus:ring-0 cursor-pointer outline-none appearance-none pr-6"
        >
          <option value="1">Last 24 Hours</option>
          <option value="7">Last 7 Days</option>
          <option value="14">Last 14 Days</option>
          <option value="custom" disabled={currentVal !== "custom"}>Custom Range</option>
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
        </div>
      </div>
    </div>
  );
}
