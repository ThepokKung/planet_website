"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { MapPin, FilterX } from "lucide-react";

interface DashboardFiltersProps {
  zones: { id: string; spotName: string | null; fullCode: string | null }[];
  robots: { id: string; name: string | null; locationId: string | null }[];
  showZoneFilter: boolean;
}

export function DashboardFilters({ zones, robots, showZoneFilter }: DashboardFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const currentZone = searchParams.get("zone") || "all";
  const currentRobot = searchParams.get("robot") || "all";

  // Filter the robot list based on the selected zone
  const filteredRobotsList = currentZone === "all" 
    ? robots 
    : robots.filter(r => r.locationId === currentZone);

  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    // If zone changes, reset robot filter
    if (key === "zone") {
      params.delete("robot");
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push(pathname);
  };

  return (
    <div className="flex flex-wrap items-center gap-6 bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm mb-8 animate-in slide-in-from-top-4 duration-500">
      <div className="flex items-center gap-3 mr-2">
        <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-[#0E6633]">
          <MapPin className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Filter Fleet</p>
          <p className="text-xs font-bold text-[#1e1e1e]">Location Search</p>
        </div>
      </div>

      <div className="h-10 w-px bg-gray-100 hidden md:block" />

      {showZoneFilter && (
        <div className="flex flex-col gap-1.5 min-w-[180px]">
          <span className="text-[9px] font-black text-[#757575] uppercase tracking-[0.2em] ml-1">Building Zone</span>
          <select
            value={currentZone}
            onChange={(e) => updateFilters("zone", e.target.value)}
            className="bg-gray-50/50 border border-gray-100 text-xs rounded-xl focus:ring-2 focus:ring-[#0E6633]/10 focus:border-[#0E6633] block w-full px-4 py-2.5 font-bold text-[#1e1e1e] appearance-none cursor-pointer hover:bg-gray-100/50 transition-all outline-none"
          >
            <option value="all">All Available Zones</option>
            {zones.map((zone) => (
              <option key={zone.id} value={zone.id}>
                {zone.spotName || zone.fullCode || zone.id}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex flex-col gap-1.5 min-w-[180px]">
        <span className="text-[9px] font-black text-[#757575] uppercase tracking-[0.2em] ml-1">Specific Robot</span>
        <select
          value={currentRobot}
          onChange={(e) => updateFilters("robot", e.target.value)}
          className="bg-gray-50/50 border border-gray-100 text-xs rounded-xl focus:ring-2 focus:ring-[#0E6633]/10 focus:border-[#0E6633] block w-full px-4 py-2.5 font-bold text-[#1e1e1e] appearance-none cursor-pointer hover:bg-gray-100/50 transition-all outline-none"
        >
          <option value="all">All Active Robots</option>
          {filteredRobotsList.map((robot) => (
            <option key={robot.id} value={robot.id}>
              {robot.name || robot.id}
            </option>
          ))}
        </select>
      </div>

      {(currentZone !== "all" || currentRobot !== "all") && (
        <button
          onClick={clearFilters}
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-600 transition-all hover:bg-red-50 px-4 py-2 rounded-xl ml-auto border border-transparent hover:border-red-100"
        >
          <FilterX className="w-3.5 h-3.5" /> Reset View
        </button>
      )}
    </div>
  );
}
