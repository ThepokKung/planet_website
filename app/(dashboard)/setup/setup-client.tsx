"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
  Cpu,
  List,
  Zap,
  Plus,
  Trash2,
  Save,
  CheckCircle,
  AlertCircle,
  Search,
  Loader2,
  Leaf,
  X,
  Usb,
  Terminal,
  Database,
  RefreshCw,
  CloudDownload,
  MapPin,
  Eye,
  EyeOff,
  Bot
} from "lucide-react";
import { useRouter } from "next/navigation";
import { saveRobotConfigAction } from "@/actions/robots";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface PlantEntry {
  templateId: string;
}

interface PotEntry {
  index: number;
  potName: string;
  plants: PlantEntry[];
}

interface Props {
  zones: any[];
  plantTemplates: any[];
}

export default function SetupClientPage({ zones, plantTemplates }: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Form States
  const [robotId, setRobotId] = useState("BOT-001");
  const [robotName, setRobotName] = useState("");
  const [zoneId, setZoneId] = useState("");
  const [robotIp, setRobotIp] = useState("Not Connected");
  const [pots, setPots] = useState<PotEntry[]>([
    { index: 0, potName: "Pot 0", plants: [{ templateId: "" }] }
  ]);

  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info', msg: string } | null>(null);

  // Serial Port States
  const portRef = useRef<any>(null);
  const writerRef = useRef<any>(null);
  const readerRef = useRef<any>(null);
  const [serialStatus, setSerialStatus] = useState<string>("Waiting for USB connection...");
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [showJson, setShowJson] = useState<boolean>(false);

  // Memoize plant template lookup map for O(1) access
  const templateMap = useMemo(() => {
    const map: Record<string, any> = {};
    plantTemplates.forEach(t => { map[t.id] = t; });
    return map;
  }, [plantTemplates]);

  // Compute JSON payload - Memoized to only change when inputs change
  const mappedConfig = useMemo(() => {
    return {
      robot_id: robotId,
      robot_name: robotName,
      locationId: zoneId,
      pots: pots.map(p => ({
        index: p.index,
        potName: p.potName,
        plants: p.plants.map(pl => {
          const template = templateMap[pl.templateId];
          return {
            name: template?.name || "Unknown Plant",
            targetMoisturePct: template?.targetMoisturePct
          };
        })
      })),
      version: "1.2.0",
      timestamp: new Date().toISOString()
    };
  }, [robotId, robotName, zoneId, pots, templateMap]);

  useEffect(() => {
    return () => {
      if (portRef.current) disconnectUsb();
    };
  }, []);

  // --- USB Logic ---
  const connectUsb = async () => {
    setIsConnecting(true);
    try {
      const port = await (navigator as any).serial.requestPort();
      await port.open({ baudRate: 115200 });
      portRef.current = port;
      const encoder = new TextEncoderStream();
      encoder.readable.pipeTo(port.writable);
      writerRef.current = encoder.writable.getWriter();
      const decoder = new TextDecoderStream();
      port.readable.pipeTo(decoder.writable);
      const reader = decoder.readable.getReader();
      readerRef.current = reader;
      setIsConnected(true);
      setSerialStatus("USB Connected! ESP32 Ready.");
      setStatus({ type: 'success', msg: 'Hardware Link Established' });
      readLoop(reader);
    } catch (error: any) {
      console.error(error);
      setIsConnected(false);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectUsb = async () => {
    try {
      if (readerRef.current) { await readerRef.current.cancel(); readerRef.current.releaseLock(); }
      if (writerRef.current) { await writerRef.current.close(); writerRef.current.releaseLock(); }
      if (portRef.current) { await portRef.current.close(); }
      setIsConnected(false);
      setSerialStatus("USB Disconnected.");
    } catch (e) { console.error(e); setIsConnected(false); }
  };

  const readLoop = async (reader: any) => {
    let buffer = "";
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += value;
        let lines = buffer.split('\n');
        buffer = lines.pop() || "";
        for (let line of lines) { if (line.trim().startsWith('{')) processESP32Message(line.trim()); }
      }
    } catch (e) { setIsConnected(false); }
  };

  const processESP32Message = (line: string) => {
    try {
      const data = JSON.parse(line);
      if (data.ip) setRobotIp(data.ip);
      if (data.type === "success") setStatus({ type: 'success', msg: data.msg });
    } catch (e) {}
  };

  const uploadViaUsb = async () => {
    if (!writerRef.current) return;
    setIsUploading(true);
    try {
      const payload = JSON.stringify(mappedConfig) + "\n";
      await writerRef.current.write(payload);
      setStatus({ type: 'success', msg: 'Configuration Synced to Hardware!' });
    } catch (e) {
      setStatus({ type: 'error', msg: 'USB Sync Failed' });
    } finally {
      setIsUploading(false);
    }
  };

  // --- Database Logic ---
  const saveToDb = async () => {
    setStatus({ type: 'info', msg: 'Saving to cloud...' });
    const result = await saveRobotConfigAction(mappedConfig);
    if (result.success) setStatus({ type: 'success', msg: 'Saved to Master Database' });
    else setStatus({ type: 'error', msg: result.error || 'Cloud Save Failed' });
  };

  // --- UI Helpers ---
  const addPot = () => setPots([...pots, { index: pots.length, potName: `Pot ${pots.length}`, plants: [{ templateId: "" }] }]);
  const removePot = (idx: number) => setPots(pots.filter((_, i) => i !== idx).map((p, i) => ({ ...p, index: i })));
  const addPlant = (pIdx: number) => { const n = [...pots]; n[pIdx].plants.push({ templateId: "" }); setPots(n); };
  const removePlant = (pIdx: number, plIdx: number) => {
    const n = [...pots];
    n[pIdx].plants = n[pIdx].plants.filter((_, i) => i !== plIdx);
    setPots(n);
  };

  const handleZoneChange = (id: string) => {
    setZoneId(id);
    if (!id) return;

    const selectedZone = zones.find(z => z.id === id);
    if (selectedZone) {
      const buildingCode = selectedZone.buildingCode || "UNK";
      const existingCount = selectedZone.robots?.length || 0;
      const nextNumber = (existingCount + 1).toString().padStart(3, '0');
      setRobotId(`BOT-${buildingCode}-${nextNumber}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-[#1e1e1e]">Hardware Commissioning</h2>
          <p className="text-[#757575] mt-1 font-medium text-sm">Link robot to zone and sync configuration via USB</p>
        </div>
        <div className="flex items-center gap-3">
          {isConnected ? (
            <button onClick={disconnectUsb} className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 transition-all border border-red-100">
              <X className="w-4 h-4" /> Disconnect USB
            </button>
          ) : (
            <button onClick={connectUsb} disabled={isConnecting} className="flex items-center gap-2 px-6 py-2.5 bg-[#1e1e1e] text-white rounded-xl text-xs font-bold hover:bg-black transition-all shadow-lg">
              {isConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Usb className="w-4 h-4 text-[#22a042]" />} Connect Robot (USB)
            </button>
          )}
        </div>
      </div>

      {status && (
        <div className={cn(
          "px-6 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest flex items-center gap-3 border shadow-sm animate-in slide-in-from-top-2",
          status.type === 'success' ? 'bg-green-50 border-green-100 text-[#0E6633]' : 
          status.type === 'error' ? 'bg-red-50 border-red-100 text-red-600' : 'bg-blue-50 border-blue-100 text-blue-600'
        )}>
          {status.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {status.msg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar: Profile & Controls */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-[32px] border border-gray-100 p-8 shadow-xl space-y-8">
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-2xl bg-green-50 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-[#0E6633]" />
                </div>
                <h3 className="font-bold text-[#1e1e1e] uppercase text-[10px] tracking-widest">Robot Profile</h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#757575] uppercase tracking-widest px-1">Hardware ID</label>
                  <input 
                    type="text" 
                    value={robotId} 
                    onChange={(e) => setRobotId(e.target.value)} 
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 font-bold text-[#1e1e1e] focus:ring-2 focus:ring-[#0E6633] outline-none transition-all" 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#757575] uppercase tracking-widest px-1">Display Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Lobby Forest A"
                    value={robotName} 
                    onChange={(e) => setRobotName(e.target.value)} 
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 font-bold text-[#1e1e1e] focus:ring-2 focus:ring-[#0E6633] outline-none transition-all" 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#757575] uppercase tracking-widest px-1">Active Zone</label>
                  <select 
                    value={zoneId}
                    onChange={(e) => handleZoneChange(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 font-bold text-[#1e1e1e] focus:ring-2 focus:ring-[#0E6633] outline-none transition-all"
                  >
                    <option value="">Unassigned</option>
                    {zones.map(z => <option key={z.id} value={z.id}>{z.spotName || z.fullCode}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-4 space-y-3">
              <button 
                onClick={saveToDb}
                className="w-full py-4 bg-white border border-gray-200 text-[#1e1e1e] rounded-2xl font-bold text-sm hover:bg-gray-50 transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <Database className="w-4 h-4 text-[#0E6633]" /> Save to Web DB
              </button>
              <button 
                disabled={!isConnected || isUploading}
                onClick={uploadViaUsb}
                className="w-full py-4 bg-[#0E6633] text-white rounded-2xl font-bold text-sm hover:bg-[#0c592b] transition-all flex items-center justify-center gap-2 shadow-xl shadow-[#0E6633]/20 disabled:opacity-50"
              >
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 text-[#22a042]" />} Sync to Hardware
              </button>
            </div>
          </div>

          <div className="bg-gray-900 rounded-[32px] p-6 space-y-4 shadow-inner border border-gray-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                <Terminal className="w-3 h-3 text-[#22a042]" /> Console Output
              </div>
              <div className="flex items-center gap-2">
                <div className={cn("w-1.5 h-1.5 rounded-full", isConnected ? "bg-[#22a042] animate-pulse" : "bg-red-500")} />
                <span className="text-[9px] font-mono text-gray-500 uppercase">{isConnected ? "Live" : "Offline"}</span>
              </div>
            </div>
            <p className="text-[11px] font-mono text-gray-300 leading-relaxed min-h-[40px]">
              <span className="text-[#22a042] mr-2">&gt;&gt;</span>
              {serialStatus}
            </p>
          </div>
        </div>

        {/* Main: Configuration Grid */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <List className="w-5 h-5 text-[#0E6633]" />
              <h3 className="font-bold text-[#1e1e1e]">Track Index Assignment</h3>
            </div>
            <button onClick={addPot} className="flex items-center gap-2 px-4 py-2 bg-green-50 text-[#0E6633] rounded-xl text-xs font-bold hover:bg-green-100 transition-all">
              <Plus className="w-3 h-3" /> Add Pot
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pots.map((pot, pIdx) => (
              <div key={pIdx} className="bg-white rounded-[32px] border border-gray-100 p-6 shadow-lg relative group animate-in zoom-in-95 duration-200">
                <button 
                  onClick={() => removePot(pIdx)}
                  className="absolute top-6 right-6 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center text-xs font-black text-[#0E6633] font-mono border border-gray-100">
                    {pot.index}
                  </div>
                  <input 
                    type="text" 
                    value={pot.potName} 
                    onChange={(e) => {
                      const n = [...pots];
                      n[pIdx].potName = e.target.value;
                      setPots(n);
                    }}
                    className="bg-transparent border-b border-gray-200 focus:border-[#0E6633] outline-none font-bold text-sm flex-1"
                  />
                </div>

                <div className="space-y-3">
                  {pot.plants.map((plant, plIdx) => (
                    <div key={plIdx} className="flex items-center gap-2 group/pl">
                      <div className="relative flex-1">
                        <Leaf className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#22a042]" />
                        <select 
                          value={plant.templateId}
                          onChange={(e) => {
                            const n = [...pots];
                            n[pIdx].plants[plIdx].templateId = e.target.value;
                            setPots(n);
                          }}
                          className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-9 pr-4 py-2 text-xs font-bold text-[#1e1e1e] focus:ring-1 focus:ring-[#0E6633] outline-none appearance-none"
                        >
                          <option value="">Select Template</option>
                          {plantTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                      </div>
                      {pot.plants.length > 1 && (
                        <button onClick={() => removePlant(pIdx, plIdx)} className="text-gray-300 hover:text-red-500">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button 
                    onClick={() => addPlant(pIdx)}
                    className="text-[10px] font-bold text-[#0E6633] flex items-center gap-1 hover:underline pt-1 opacity-60 hover:opacity-100 transition-opacity"
                  >
                    <Plus className="w-3 h-3" /> Add Plant
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-[32px] border border-gray-100 overflow-hidden shadow-xl">
            <button 
              onClick={() => setShowJson(!showJson)}
              className="w-full px-8 py-5 flex items-center justify-between hover:bg-gray-50 transition-all group"
            >
              <div className="flex items-center gap-3">
                {showJson ? <EyeOff className="w-4 h-4 text-gray-400 group-hover:text-red-500" /> : <Eye className="w-4 h-4 text-gray-400 group-hover:text-[#0E6633]" />}
                <span className="font-bold text-sm text-gray-600 uppercase tracking-widest text-[10px]">JSON Payload (Hardware Config)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono text-gray-400 uppercase tracking-tighter">Click to {showJson ? "Hide" : "Preview"}</span>
              </div>
            </button>
            {showJson && (
              <div className="p-0 animate-in slide-in-from-top-2 duration-300">
                <textarea 
                  readOnly 
                  value={JSON.stringify(mappedConfig, null, 2)}
                  className="w-full h-64 p-8 bg-[#1e1e1e] text-[#22a042] font-mono text-xs leading-relaxed outline-none border-none resize-none shadow-inner"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
