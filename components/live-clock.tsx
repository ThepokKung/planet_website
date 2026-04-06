"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

export function LiveClock() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      setTime(new Date().toLocaleTimeString('en-US', { hour12: false }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center gap-2 text-xs text-[#757575] font-mono bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 shadow-sm">
      <Clock className="w-3.5 h-3.5" />
      <span>{time}</span>
    </div>
  );
}
