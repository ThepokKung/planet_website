"use client";

import { useState } from "react";
import { MapPin, ChevronDown, ChevronUp } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ZoneBadgeListProps {
  zones: { id: string; spotName: string | null }[];
  role: string | null;
  currentZoneId?: string;
}

export function ZoneBadgeList({ zones, role, currentZoneId }: ZoneBadgeListProps) {
  const [isExpanded, setIsOpen] = useState(false);
  const hasMultipleZones = zones.length > 3;
  const displayZones = isExpanded ? zones : zones.slice(0, 3);

  return (
    <div className="flex flex-wrap items-center gap-2 mt-2">
      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 rounded-lg border border-green-100">
        <MapPin className="w-3 h-3 text-[#0E6633]" />
        <span className="text-[10px] font-black uppercase tracking-wider text-[#0E6633]">
          {role === 'SUPER ADMIN' ? 'Global Fleet' : 'Assigned Zones'}
        </span>
      </div>
      
      {currentZoneId && currentZoneId !== 'all' ? (
        <span className="px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-[10px] font-bold text-[#1e1e1e] shadow-sm">
          Viewing: {zones.find(z => z.id === currentZoneId)?.spotName}
        </span>
      ) : (
        <div className="flex flex-wrap gap-1.5 items-center">
          {displayZones.map(z => (
            <span key={z.id} className="px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-[10px] font-bold text-[#757575] shadow-sm animate-in fade-in zoom-in-95 duration-200">
              {z.spotName}
            </span>
          ))}
          
          {hasMultipleZones && (
            <button 
              onClick={() => setIsOpen(!isExpanded)}
              className="px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-lg text-[10px] font-black text-[#0E6633] hover:bg-[#0E6633] hover:text-white transition-all flex items-center gap-1 shadow-sm"
            >
              {isExpanded ? (
                <>Show Less <ChevronUp className="w-3 h-3" /></>
              ) : (
                <>+{zones.length - 3} more <ChevronDown className="w-3 h-3" /></>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
