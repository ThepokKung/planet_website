"use client";

import { Play, AlertTriangle, ChevronDown, ChevronUp, MapPin, Leaf, Loader2, Droplets, Activity } from "lucide-react";
import { useState } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Pot, Plant } from "@prisma/client";
import { sendDebugCommandAction } from "@/actions/robots";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Props {
  robotId: string;
  pots: (Pot & { plants: Plant[] })[];
}

type DebugAction = "GOTO" | "WATER_TEST" | "SENSOR_TEST";

export function RobotCommandButton({ robotId, pots }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [selectedPotId, setSelectedPotId] = useState<string>("");
  const [selectedPlantId, setSelectedPlantId] = useState<string>("");
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  const selectedPot = pots.find(p => p.id === selectedPotId);
  const availablePlants = selectedPot?.plants || [];

  const handleSendCommand = async (action: DebugAction) => {
    if (!selectedPotId || !selectedPlantId) {
      alert("Please select both a Pot and a Plant for context.");
      return;
    }

    const plant = availablePlants.find(p => p.id === selectedPlantId);
    if (!plant || !selectedPot) return;

    let confirmMsg = "";
    switch(action) {
      case "GOTO": confirmMsg = `Move robot to Pot: ${selectedPot.potName}, Plant: ${plant.plantName}?`; break;
      case "WATER_TEST": confirmMsg = `Test watering (Pump) on Pot: ${selectedPot.potName}, Plant: ${plant.plantName}?`; break;
      case "SENSOR_TEST": confirmMsg = `Test sensors on Pot: ${selectedPot.potName}, Plant: ${plant.plantName}?`; break;
    }

    if (window.confirm(confirmMsg)) {
      setIsSending(true);
      setStatus(null);
      
      const command = JSON.stringify({
        action: action,
        potIndex: selectedPot.trackIndex,
        plantIndex: plant.plantIndex,
        timestamp: new Date().toISOString()
      });

      try {
        const result = await sendDebugCommandAction({ 
          robotId, 
          command,
          endpointType: "debug"
        });
        if (result.success) {
          setStatus({ type: 'success', msg: `${action} Command Sent!` });
        } else {
          setStatus({ type: 'error', msg: result.error || 'Failed to send command' });
        }
      } catch {
        setStatus({ type: 'error', msg: 'An unexpected error occurred' });
      } finally {
        setIsSending(false);
      }
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden transition-all duration-300">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-8 py-5 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <h3 className="font-bold text-[#1e1e1e] flex items-center gap-2 uppercase text-xs tracking-widest">
          <Play className="w-4 h-4 text-orange-500" /> Command Center (Debug)
        </h3>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>
      
      <div className={cn(
        "px-8 pb-8 space-y-6 overflow-hidden transition-all duration-300",
        isOpen ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0 pb-0"
      )}>
        <div className="pt-2 space-y-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Target Selection</p>
          
          <div className="space-y-3">
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#757575]" />
              <select 
                value={selectedPotId}
                onChange={(e) => {
                  setSelectedPotId(e.target.value);
                  setSelectedPlantId("");
                }}
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-10 pr-4 py-3.5 text-sm font-bold text-[#1e1e1e] focus:ring-2 focus:ring-[#0E6633] outline-none appearance-none"
              >
                <option value="">Select Target Pot</option>
                {pots.map(p => (
                  <option key={p.id} value={p.id}>{p.potName} (Index {p.trackIndex})</option>
                ))}
              </select>
            </div>

            <div className={cn("relative transition-opacity", !selectedPotId && "opacity-50 pointer-events-none")}>
              <Leaf className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#22a042]" />
              <select 
                value={selectedPlantId}
                onChange={(e) => setSelectedPlantId(e.target.value)}
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-10 pr-4 py-3.5 text-sm font-bold text-[#1e1e1e] focus:ring-2 focus:ring-[#0E6633] outline-none appearance-none"
              >
                <option value="">Select Target Plant</option>
                {availablePlants.map(pl => (
                  <option key={pl.id} value={pl.id}>{pl.plantName} (Index {pl.plantIndex})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Actions</p>
            <div className="grid grid-cols-1 gap-2">
              <button 
                disabled={!selectedPlantId || isSending}
                onClick={() => handleSendCommand("GOTO")}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gray-100 text-[#1e1e1e] rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-gray-200 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                <MapPin className="w-3.5 h-3.5" /> Move to Position
              </button>
              
              <div className="grid grid-cols-2 gap-2">
                <button 
                  disabled={!selectedPlantId || isSending}
                  onClick={() => handleSendCommand("WATER_TEST")}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-blue-50 text-blue-700 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-blue-100 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  <Droplets className="w-3.5 h-3.5" /> Check Watering
                </button>
                <button 
                  disabled={!selectedPlantId || isSending}
                  onClick={() => handleSendCommand("SENSOR_TEST")}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-green-50 text-green-700 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-green-100 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  <Activity className="w-3.5 h-3.5" /> Check Sensor
                </button>
              </div>
            </div>
          </div>

          {status && (
            <div className={cn(
              "p-4 rounded-2xl text-[10px] font-bold uppercase tracking-wider text-center border animate-in fade-in slide-in-from-top-1",
              status.type === 'success' ? 'bg-green-50 border-green-100 text-[#0E6633]' : 'bg-red-50 border-red-100 text-red-600'
            )}>
              {status.msg}
            </div>
          )}

          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest leading-tight">Debug Mode</p>
              <p className="text-[10px] text-amber-600/70 font-medium leading-relaxed mt-1">
                These tests override autonomous safety checks. Monitor the robot physically during these operations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
