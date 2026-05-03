"use client";

import { Play, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function RobotCommandButton() {
  const [isOpen, setIsOpen] = useState(false);

  const handleStartTask = () => {
    const confirmed = window.confirm("this button for test only be sure it's clear");
    if (confirmed) {
      console.log("Test task initiated manually.");
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden transition-all duration-300">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-8 py-5 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <h3 className="font-bold text-[#1e1e1e] flex items-center gap-2 uppercase text-xs tracking-widest">
          <Play className="w-4 h-4 text-[#0E6633]" /> Command Center
        </h3>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>
      
      <div className={cn(
        "px-8 pb-8 space-y-6 overflow-hidden transition-all duration-300",
        isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0 pb-0"
      )}>
        <div className="pt-2 space-y-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Manual Operations</p>
          
          <button 
            onClick={handleStartTask}
            className="w-full flex items-center justify-center gap-3 py-4 bg-[#0E6633] text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-[#0c592b] transition-all shadow-lg shadow-[#0E6633]/20 active:scale-[0.98]"
          >
            <Play className="w-5 h-5 fill-current" />
            Start Task
          </button>

          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest leading-tight">Test Mode Active</p>
              <p className="text-[10px] text-amber-600/70 font-medium leading-relaxed mt-1">
                Manual triggers bypass scheduled logic. Ensure the robot track is clear of obstructions before starting.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
