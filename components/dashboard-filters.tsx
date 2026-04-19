"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Bot, MapPin, FilterX } from "lucide-react";

interface DashboardFiltersProps {
  zones: { id: string; spotName: string | null; fullCode: string | null }[];
  robots: { id: string; name: string | null }[];
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
    : robots.filter(r => (r as any).locationId === currentZone);

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
    <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-8">
      {showZoneFilter && (
        <div className="flex items-center gap-2">
          <label className="text-[10px] font-bold text-[#757575] uppercase tracking-widest flex items-center gap-1">
            <MapPin className="w-3 h-3 text-[#0E6633]" /> Zone
          </label>
          <select
            value={currentZone}
            onChange={(e) => updateFilters("zone", e.target.value)}
            className="bg-gray-50 border border-gray-200 text-sm rounded-lg focus:ring-[#0E6633] focus:border-[#0E6633] block w-full p-2 font-medium"
          >
            <option value="all">All Zones</option>
            {zones.map((zone) => (
              <option key={zone.id} value={zone.id}>
                {zone.spotName || zone.fullCode || zone.id}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex items-center gap-2">
        <label className="text-[10px] font-bold text-[#757575] uppercase tracking-widest flex items-center gap-1">
          <Bot className="w-3 h-3 text-[#0E6633]" /> Robot
        </label>
        <select
          value={currentRobot}
          onChange={(e) => updateFilters("robot", e.target.value)}
          className="bg-gray-50 border border-gray-200 text-sm rounded-lg focus:ring-[#0E6633] focus:border-[#0E6633] block w-full p-2 font-medium"
        >
          <option value="all">All Robots</option>
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
          className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-red-500 hover:text-red-600 transition-colors ml-auto"
        >
          <FilterX className="w-3 h-3" /> Clear Filters
        </button>
      )}
    </div>
  );
}
