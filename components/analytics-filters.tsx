"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Bot, Check, X, Search, ChevronsUpDown, MapPin } from "lucide-react";
import { useState, useMemo, useRef, useEffect } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AnalyticsFiltersProps {
  zones: { id: string; spotName: string | null; fullCode: string | null }[];
  robots: { id: string; name: string | null; locationId: string | null }[];
}

export function AnalyticsFilters({ zones, robots }: AnalyticsFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentZone = searchParams.get("zone") || "all";

  const selectedRobots = useMemo(() => 
    searchParams.get("robots")?.split(",").filter(Boolean) || [],
    [searchParams]
  );

  // 1. Filter robots by the selected zone FIRST
  const robotsInZone = useMemo(() => 
    currentZone === "all" 
      ? robots 
      : robots.filter(r => r.locationId === currentZone),
    [robots, currentZone]
  );

  // 2. Further filter by search term for the dropdown list
  const filteredRobots = useMemo(() => 
    robotsInZone.filter(r => 
      r.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (r.name?.toLowerCase().includes(searchTerm.toLowerCase()))
    ),
    [robotsInZone, searchTerm]
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const updateParams = (newSelected: string[], newZone?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (newZone !== undefined) {
      if (newZone === "all") params.delete("zone");
      else params.set("zone", newZone);
      // When zone changes, we should clear robot selection to avoid showing robots from other zones
      params.delete("robots");
    } else {
      if (newSelected.length === 0) {
        params.delete("robots");
      } else {
        params.set("robots", Array.from(new Set(newSelected)).join(","));
      }
    }

    router.push(`/analytics?${params.toString()}`);
  };

  const toggleRobot = (id: string) => {
    if (selectedRobots.includes(id)) {
      updateParams(selectedRobots.filter(r => r !== id));
    } else {
      updateParams([...selectedRobots, id]);
    }
  };

  const toggleAll = () => {
    if (selectedRobots.length === robotsInZone.length) {
      updateParams([]);
    } else {
      updateParams(robotsInZone.map(r => r.id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Zone Selector */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-[#757575] uppercase tracking-widest flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-[#0E6633]" /> Building Zone
        </label>
        <select
          value={currentZone}
          onChange={(e) => updateParams([], e.target.value)}
          className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-xs font-bold text-[#1e1e1e] focus:ring-2 focus:ring-[#0E6633] outline-none transition-all appearance-none cursor-pointer"
        >
          <option value="all">All Zones</option>
          {zones.map(z => (
            <option key={z.id} value={z.id}>{z.spotName || z.fullCode}</option>
          ))}
        </select>
      </div>

      {/* Robot Multi-Select */}
      <div className="relative w-full" ref={dropdownRef}>
        <label className="text-[10px] font-bold text-[#757575] uppercase tracking-widest mb-2 block flex items-center gap-1.5">
          <Bot className="w-3.5 h-3.5 text-[#0E6633]" /> Fleet Selector
        </label>
        
        <div 
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex items-center justify-between w-full bg-white border rounded-xl px-4 py-2.5 text-xs font-bold cursor-pointer transition-all shadow-sm",
            isOpen ? "border-[#0E6633] ring-2 ring-[#0E6633]/10" : "border-gray-200 hover:border-gray-300"
          )}
        >
          <div className="truncate pr-2">
            {selectedRobots.length === 0 ? (
              <span className="text-gray-400">All Robots in Zone</span>
            ) : (
              <span className="text-[#0E6633]">
                {selectedRobots.length === robotsInZone.length ? 'All Units Selected' : `${selectedRobots.length} Units Selected`}
              </span>
            )}
          </div>
          <ChevronsUpDown className="w-4 h-4 text-gray-400 shrink-0" />
        </div>

        {isOpen && (
          <div className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-2 border-b border-gray-50 space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                <input 
                  autoFocus
                  type="text"
                  placeholder="Find unit..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 rounded-lg pl-8 pr-4 py-1.5 text-[10px] font-bold outline-none focus:border-[#0E6633] transition-all"
                />
              </div>
              <div className="flex items-center justify-between px-1">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Results ({filteredRobots.length})</span>
                <button 
                  onClick={(e) => { e.stopPropagation(); toggleAll(); }}
                  className="text-[9px] font-bold text-[#0E6633] hover:underline"
                >
                  {selectedRobots.length === robotsInZone.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto p-1 custom-scrollbar">
              {filteredRobots.length === 0 ? (
                <div className="py-6 text-center">
                  <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">No matching units</p>
                </div>
              ) : (
                filteredRobots.map((robot) => {
                  const isSelected = selectedRobots.includes(robot.id);
                  return (
                    <div
                      key={robot.id}
                      onClick={(e) => { e.stopPropagation(); toggleRobot(robot.id); }}
                      className={cn(
                        "flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors group",
                        isSelected ? "bg-green-50 text-[#0E6633]" : "hover:bg-gray-50 text-gray-600"
                      )}
                    >
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-tight">{robot.id}</span>
                        <span className="text-[8px] font-bold text-gray-400 group-hover:text-gray-500 truncate max-w-[140px]">
                          {robot.name || "Default Unit"}
                        </span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
