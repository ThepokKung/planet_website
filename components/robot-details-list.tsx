"use client";

import { useState } from "react";
import { 
  Bot, 
  Flower2, 
  Leaf, 
  ChevronDown, 
  ChevronRight, 
  Info, 
  Battery, 
  Search, 
  X,
  Edit2,
  Check,
  Loader2,
  ExternalLink
} from "lucide-react";
import Link from "next/link";
import { updatePlantNameAction } from "@/actions/robots";

interface Plant {
  id: string;
  plantName: string | null;
  status?: string | null;
  moisture?: number | null;
  targetMoisturePct?: number | null;
}

interface Pot {
  id: string;
  trackIndex: number | null;
  potName: string | null;
  plants: Plant[];
}

interface Robot {
  id: string;
  name: string | null;
  status: string | null;
  batteryLevel: number | null;
  pots: Pot[];
}

export function RobotDetailsList({ robots, role }: { robots: Robot[], role?: string }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedRobots, setExpandedRobots] = useState<Record<string, boolean>>(
    Object.fromEntries(robots.map(r => [r.id, true]))
  );
  
  const [editingPlantId, setEditingPlantId] = useState<string | null>(null);
  const [tempName, setTempName] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const isAdmin = role === "ADMIN";

  const savePlantName = async (plantId: string) => {
    if (!tempName.trim()) return;
    setIsUpdating(true);
    try {
      const result = await updatePlantNameAction(plantId, tempName);
      if (result.success) setEditingPlantId(null);
      else alert(result.error);
    } catch (err) {
      alert("Failed to update.");
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredRobots = robots.filter(r => 
    r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  return (
    <div className="space-y-6">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-3 h-4 w-4 text-[#757575]" />
        <input
          type="text"
          placeholder="Search Robot..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="block w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#0E6633]/20 bg-white shadow-sm"
        />
      </div>

      <div className="space-y-4">
        {filteredRobots.map((robot) => (
          <div key={robot.id} className="border border-gray-100 rounded-2xl bg-white shadow-sm overflow-hidden">
            <button 
              onClick={() => setExpandedRobots(prev => ({ ...prev, [robot.id]: !prev[robot.id] }))}
              className="w-full bg-gray-50/50 px-6 py-4 flex items-center gap-3 border-b border-gray-100 hover:bg-gray-100/50 transition-colors"
            >
              {expandedRobots[robot.id] ? <ChevronDown className="w-4 h-4 text-[#757575]" /> : <ChevronRight className="w-4 h-4 text-[#757575]" />}
              <Bot className="w-6 h-6 text-[#0E6633]" />
              <div className="flex-1 text-left">
                <span className="font-bold text-[#1e1e1e]">{robot.id}</span>
                <span className="ml-3 text-xs font-mono text-[#757575]">{robot.name}</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#757575]">
                  <Battery className="w-4 h-4" /> {robot.batteryLevel}%
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-[#0E6633] uppercase">
                  {robot.status || 'Idle'}
                </span>
                <Link 
                  href={`/details/${robot.id}`}
                  className="p-2 hover:bg-[#0E6633] hover:text-white rounded-lg transition-all text-[#0E6633] border border-[#0E6633]/10"
                  onClick={(e) => e.stopPropagation()} // ป้องกันไม่ให้ไป trigger การยุบ/ขยาย card
                  title="View Detailed Logs & Analytics"
                >
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
            </button>
            
            {expandedRobots[robot.id] && (
              <div className="p-6 space-y-4">
                {robot.pots.map((pot) => (
                  <div key={pot.id} className="border border-gray-100 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Flower2 className="w-4 h-4 text-[#757575]" />
                        <span className="text-sm font-bold text-[#1e1e1e]">{pot.potName || `Pot ${pot.trackIndex}`}</span>
                      </div>
                      <span className="text-[10px] font-mono text-[#757575] bg-gray-50 px-2 py-0.5 rounded border border-gray-100 uppercase tracking-widest">Index {pot.trackIndex}</span>
                    </div>
                    
                    <div className="ml-6 border-l-2 border-dashed border-[#c8e6c9] pl-6 space-y-4">
                      {pot.plants.map((plant) => (
                        <div key={plant.id} className="flex items-center justify-between group">
                          <div className="flex items-center gap-3">
                            <Leaf className="w-4 h-4 text-[#22a042]" />
                            {editingPlantId === plant.id ? (
                              <div className="flex items-center gap-2">
                                <input 
                                  autoFocus
                                  value={tempName}
                                  onChange={(e) => setTempName(e.target.value)}
                                  className="border border-gray-300 rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-[#0E6633]"
                                />
                                <button onClick={() => savePlantName(plant.id)} className="p-1 bg-[#0E6633] text-white rounded">{isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}</button>
                                <button onClick={() => setEditingPlantId(null)} className="p-1 bg-gray-100 rounded text-gray-500"><X className="w-3 h-3" /></button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{plant.plantName}</span>
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-[#757575] uppercase">{plant.status || 'Healthy'}</span>
                                {isAdmin && (
                                  <button onClick={() => { setEditingPlantId(plant.id); setTempName(plant.plantName || ""); }} className="opacity-0 group-hover:opacity-100 p-1 text-[#757575] hover:text-[#0E6633]"><Edit2 className="w-3 h-3" /></button>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-xs font-mono text-[#757575]">{plant.moisture || 0}% moisture</span>
                            <button className="text-[10px] font-bold text-[#0E6633] hover:underline uppercase">Stats</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
