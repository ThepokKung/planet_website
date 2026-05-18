"use client";

import { useState, useRef, useEffect } from "react";
import { MapPin, X } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Zone {
  id: string;
  fullCode: string | null;
}

interface UserZoneBadgeProps {
  locations: Zone[];
  username: string;
}

export function UserZoneBadge({ locations, username }: UserZoneBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  if (locations.length === 0) {
    return <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest italic">No Zones Assigned</span>;
  }

  const visibleZones = locations.slice(0, 3);
  const remainingCount = locations.length - 3;

  return (
    <div className="relative flex flex-wrap gap-1 max-w-[240px]">
      {visibleZones.map((loc) => (
        <span 
          key={loc.id} 
          className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-50 text-[#757575] border border-gray-100 rounded text-[9px] font-bold whitespace-nowrap shadow-sm"
        >
          <MapPin className="w-2.5 h-2.5" /> {loc.fullCode}
        </span>
      ))}

      {remainingCount > 0 && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center px-2 py-0.5 bg-[#0E6633]/5 text-[#0E6633] border border-[#0E6633]/10 rounded text-[9px] font-bold hover:bg-[#0E6633]/10 transition-colors shadow-sm cursor-pointer"
        >
          +{remainingCount} more
        </button>
      )}

      {isOpen && (
        <div 
          ref={popoverRef}
          className="absolute z-50 bottom-full mb-2 left-0 w-64 bg-white rounded-2xl border border-gray-100 shadow-2xl p-4 animate-in fade-in zoom-in-95 duration-200"
        >
          <div className="flex items-center justify-between mb-4 border-b border-gray-50 pb-2">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-[#757575] uppercase tracking-widest">All Permissions</span>
              <span className="text-xs font-bold text-[#1e1e1e]">{username}</span>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="grid grid-cols-4 gap-1.5 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
            {locations.map((loc) => (
              <span 
                key={loc.id} 
                className="inline-flex items-center justify-center px-2 py-1.5 bg-green-50 text-[#0E6633] border border-green-100 rounded text-[9px] font-bold"
              >
                {loc.fullCode}
              </span>
            ))}
          </div>
          
          <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Total Scope</span>
            <span className="text-[10px] font-black text-[#0E6633]">{locations.length} Zones</span>
          </div>
        </div>
      )}
    </div>
  );
}
