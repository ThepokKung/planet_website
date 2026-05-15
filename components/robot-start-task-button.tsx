"use client";

import { Play, AlertTriangle, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { useState } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Props {
  robotId: string;
}

export function RobotStartTaskButton({ robotId }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const handleStartTask = () => {
    const confirmed = window.confirm("Initiate full watering cycle for this robot?");
    if (confirmed) {
      setIsSending(true);
      // In a real scenario, this would call a server action to set a "START_CYCLE" command
      console.log(`Manual cycle start for ${robotId}`);
      setTimeout(() => {
        setIsSending(false);
        alert("Task command queued. Hardware will begin shortly.");
      }, 1000);
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
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Operational Commands</p>
          
          <button 
            disabled={isSending}
            onClick={handleStartTask}
            className="w-full flex items-center justify-center gap-3 py-4 bg-[#0E6633] text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-[#0c592b] transition-all shadow-lg shadow-[#0E6633]/20 active:scale-[0.98] disabled:opacity-50"
          >
            {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
            Start Full Cycle
          </button>

          <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest leading-tight">Manual Trigger</p>
              <p className="text-[10px] text-blue-600/70 font-medium leading-relaxed mt-1">
                Triggering a cycle manually will execute the full watering sequence for all assigned tracks.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
