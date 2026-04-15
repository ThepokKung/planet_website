"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Bot, Check, ChevronsUpDown, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AnalyticsFiltersProps {
  robots: { id: string; name: string | null }[];
}

export function AnalyticsFilters({ robots }: AnalyticsFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedRobots = searchParams.get("robots")?.split(",").filter(Boolean) || [];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleRobot = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    let newSelected: string[];
    
    if (selectedRobots.includes(id)) {
      newSelected = selectedRobots.filter(r => r !== id);
    } else {
      newSelected = [...selectedRobots, id];
    }

    if (newSelected.length === 0) {
      params.delete("robots");
    } else {
      params.set("robots", newSelected.join(","));
    }
    router.push(`/analytics?${params.toString()}`);
  };

  const clearRobots = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("robots");
    router.push(`/analytics?${params.toString()}`);
  };

  return (
    <div className="relative w-full md:w-72" ref={dropdownRef}>
      <label className="text-[10px] font-bold text-[#757575] uppercase tracking-widest mb-1 block flex items-center gap-1">
        <Bot className="w-3 h-3 text-[#0E6633]" /> Filter by Robot ID
      </label>
      
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium cursor-pointer hover:border-[#0E6633] transition-all shadow-sm"
      >
        <div className="flex flex-wrap gap-1 items-center overflow-hidden">
          {selectedRobots.length === 0 ? (
            <span className="text-gray-400">Select Robots...</span>
          ) : (
            <span className="text-[#0E6633] font-bold">
              {selectedRobots.length} Selected
            </span>
          )}
        </div>
        <ChevronsUpDown className="w-4 h-4 text-gray-400" />
      </div>

      {isOpen && (
        <div className="absolute z-20 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="p-2 border-b border-gray-50 flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#757575] uppercase px-2">Robot Fleet</span>
            {selectedRobots.length > 0 && (
              <button 
                onClick={(e) => { e.stopPropagation(); clearRobots(); }}
                className="text-[10px] font-bold text-red-500 hover:text-red-600 px-2"
              >
                Clear All
              </button>
            )}
          </div>
          <div className="max-h-60 overflow-y-auto p-1">
            {robots.map((robot) => {
              const isSelected = selectedRobots.includes(robot.id);
              return (
                <div
                  key={robot.id}
                  onClick={(e) => { e.stopPropagation(); toggleRobot(robot.id); }}
                  className={cn(
                    "flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors text-sm",
                    isSelected ? "bg-green-50 text-[#0E6633] font-bold" : "hover:bg-gray-50 text-gray-700"
                  )}
                >
                  <div className="flex flex-col">
                    <span>{robot.id}</span>
                    <span className="text-[10px] font-medium text-gray-400">{robot.name || "Default"}</span>
                  </div>
                  {isSelected && <Check className="w-4 h-4" />}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
