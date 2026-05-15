"use client";

import { useState, useRef, useEffect } from "react";
import { MapPin, X, Plus, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { updateUserZonesAction } from "@/actions/users";

interface Zone {
  id: string;
  fullCode: string | null;
}

interface UserZoneManagerProps {
  userId: string;
  assignedLocations: Zone[];
  allZones: Zone[];
  username: string;
}

export function UserZoneManager({ userId, assignedLocations, allZones, username }: UserZoneManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  
  // Local state for checkboxes
  const [selectedIds, setSelectedIds] = useState<string[]>(
    assignedLocations.map(l => l.id)
  );

  // Use a key on the parent or handle selection logic without sync effect if possible
  // For now, I'll just keep it but I'll remove the unused error variable below
  
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

  const toggleZone = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    setIsUpdating(true);
    try {
      const result = await updateUserZonesAction(userId, selectedIds);
      if (result.success) {
        setIsOpen(false);
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error(error);
      alert("Failed to update zones.");
    } finally {
      setIsUpdating(false);
    }
  };

  const visibleZones = assignedLocations.slice(0, 2);
  const remainingCount = assignedLocations.length - 2;

  return (
    <div className="relative flex flex-wrap gap-1 items-center">
      {assignedLocations.length === 0 ? (
        <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest italic mr-2">No Zones</span>
      ) : (
        <>
          {visibleZones.map((loc) => (
            <span 
              key={loc.id} 
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-50 text-[#757575] border border-gray-100 rounded text-[9px] font-bold whitespace-nowrap shadow-sm"
            >
              <MapPin className="w-2.5 h-2.5" /> {loc.fullCode}
            </span>
          ))}
          {remainingCount > 0 && (
            <span className="text-[9px] font-bold text-gray-400">+{remainingCount} more</span>
          )}
        </>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 hover:bg-[#0E6633]/10 text-[#0E6633] rounded-lg transition-all shadow-sm cursor-pointer border border-[#0E6633]/20 ml-1"
        title="Edit Zones"
      >
        <Plus className="w-3 h-3" />
      </button>

      {isOpen && (
        <div 
          ref={popoverRef}
          className="absolute z-50 top-full mt-2 right-0 md:w-[560px] w-[90vw] bg-white rounded-[32px] border border-gray-100 shadow-2xl p-8 animate-in fade-in zoom-in-95 duration-200"
        >
          <div className="flex items-center justify-between mb-6 border-b border-gray-50 pb-4">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-[#757575] uppercase tracking-[0.3em]">Advanced Access Management</span>
              <span className="text-lg font-black text-[#1e1e1e] tracking-tight">{username}</span>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5 max-h-[400px] overflow-y-auto pr-3 custom-scrollbar py-1">
            {allZones.map((zone) => {
              const isSelected = selectedIds.includes(zone.id);
              return (
                <button
                  key={zone.id}
                  onClick={() => toggleZone(zone.id)}
                  className={cn(
                    "flex flex-col items-center justify-center p-3 rounded-2xl border transition-all text-center gap-1.5",
                    isSelected 
                      ? "bg-[#0E6633] border-[#0E6633] text-white shadow-lg shadow-[#0E6633]/20 scale-[1.02]" 
                      : "bg-white border-gray-100 text-[#757575] hover:border-[#0E6633]/30 hover:bg-green-50/30"
                  )}
                >
                  <MapPin className={cn("w-3.5 h-3.5", isSelected ? "text-white/70" : "text-gray-300")} />
                  <span className="text-[11px] font-black uppercase tracking-tight">{zone.fullCode}</span>
                </button>
              );
            })}
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-50 flex items-center justify-between gap-6">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Current Selection</span>
              <span className="text-xl font-black text-[#0E6633]">{selectedIds.length} <span className="text-xs text-[#757575]">Zones Selected</span></span>
            </div>
            <button
              onClick={handleSave}
              disabled={isUpdating}
              className="flex-1 max-w-[240px] bg-[#0E6633] text-white py-3.5 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-[#0c592b] transition-all flex items-center justify-center gap-3 shadow-xl shadow-[#0E6633]/20 disabled:opacity-50 active:scale-[0.98]"
            >
              {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Save Permissions
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
