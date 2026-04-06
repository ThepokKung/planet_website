"use client";

import { useState, useEffect } from "react";
import { 
  Bot, 
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
  Flower2,
  Leaf,
  X,
  Usb,
  Terminal
} from "lucide-react";
import { useRouter } from "next/navigation";
import { getRobotConfigAction, saveRobotConfigAction } from "@/actions/robots";

interface PlantEntry {
  name: string;
}

interface PotEntry {
  index: number;
  potName: string;
  plants: PlantEntry[];
}

interface Config {
  robot_id: string;
  robot_name: string;
  pots: PotEntry[];
  created_at: string;
  version: string;
}

export default function CommissioningPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [robotId, setRobotId] = useState("BOT-001");
  const [robotName, setRobotName] = useState("Greenhouse Alpha");
  const [robotIp, setRobotIp] = useState("192.168.1.100");
  const [pots, setPots] = useState<PotEntry[]>([
    { index: 0, potName: "Pot 0", plants: [{ name: "Basil" }, { name: "Mint" }] }
  ]);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info', msg: string } | null>(null);
  
  // Serial Port States
  const [serialStatus, setSerialStatus] = useState<string>("Waiting for connection...");
  const [isSerialSupported, setIsSerialSupported] = useState<boolean>(false);
  const [isSecureContext, setIsSecureContext] = useState<boolean>(true);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isWifiFetching, setIsWifiFetching] = useState<boolean>(false);

  useEffect(() => {
    // Check Web Serial Support & Secure Context
    const supported = "serial" in navigator;
    const secure = window.isSecureContext;
    
    setIsSerialSupported(supported);
    setIsSecureContext(secure);

    if (!supported) {
      setSerialStatus("Error: Browser not supported. Please use Chrome or Edge.");
    } else if (!secure) {
      setSerialStatus("Error: Web Serial requires a secure context (HTTPS or localhost).");
    }

    async function checkAuth() {
      const res = await fetch('/api/auth/session');
      const session = await res.json();
      if (!session || session.role !== 'ADMIN') {
        router.push('/fleet');
      } else {
        setIsLoading(false);
      }
    }
    checkAuth();
  }, [router]);

  const addPot = () => {
    setPots([...pots, { index: pots.length, potName: `Pot ${pots.length}`, plants: [{ name: "New Plant" }] }]);
  };

  const removePot = (index: number) => {
    setPots(pots.filter((_, i) => i !== index).map((p, i) => ({ ...p, index: i })));
  };

  const addPlantToPot = (potIndex: number) => {
    const newPots = [...pots];
    newPots[potIndex].plants.push({ name: "New Plant" });
    setPots(newPots);
  };

  const removePlantFromPot = (potIndex: number, plantIndex: number) => {
    const newPots = [...pots];
    newPots[potIndex].plants = newPots[potIndex].plants.filter((_, i) => i !== plantIndex);
    setPots(newPots);
  };

  const updatePlantName = (potIndex: number, plantIndex: number, name: string) => {
    const newPots = [...pots];
    newPots[potIndex].plants[plantIndex].name = name;
    setPots(newPots);
  };

  const updatePotName = (potIndex: number, name: string) => {
    const newPots = [...pots];
    newPots[potIndex].potName = name;
    setPots(newPots);
  };

  const fetchExistingConfig = async () => {
    setIsFetching(true);
    setStatus({ type: 'info', msg: `Fetching ${robotId} from DB...` });
    try {
      const data = await getRobotConfigAction(robotId);
      if (data) {
        setRobotName(data.robotName);
        setPots(data.pots.map((p: any) => ({
          index: p.index,
          potName: p.potName,
          plants: p.plants.map((pl: any) => ({ name: pl.name }))
        })));
        setStatus({ type: 'success', msg: "Configuration loaded from database!" });
      } else {
        setStatus({ type: 'error', msg: "Robot not found in database." });
      }
    } catch (err) {
      setStatus({ type: 'error', msg: "Fetch failed." });
    } finally {
      setIsFetching(false);
    }
  };

  const fetchFromRobotViaWifi = async () => {
    setIsWifiFetching(true);
    setStatus({ type: 'info', msg: `Fetching from robot at ${robotIp}...` });
    try {
      const res = await fetch(`http://${robotIp}/get-config`, { 
        cache: 'no-store',
        mode: 'cors'
      }); 
      
      if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
      
      const data: Config = await res.json();
      
      if (data.robot_id) setRobotId(data.robot_id);
      if (data.robot_name) setRobotName(data.robot_name);
      if (data.pots) setPots(data.pots);
      
      setStatus({ type: 'success', msg: "Configuration synced from Robot via WiFi!" });
    } catch (error: any) {
      console.error("WiFi Fetch Error:", error);
      setStatus({ type: 'error', msg: `WiFi Fetch Failed: ${error.message}` });
    } finally {
      setIsWifiFetching(false);
    }
  };

  const saveToDb = async () => {
    setStatus({ type: 'info', msg: 'Saving to database...' });
    const result = await saveRobotConfigAction({ robot_id: robotId, robot_name: robotName, pots });
    if (result.success) {
      setStatus({ type: 'success', msg: 'Saved to database successfully!' });
    } else {
      setStatus({ type: 'error', msg: result.error || 'Failed to save.' });
    }
  };

  const uploadViaUsb = async () => {
    if (!isSerialSupported) {
      setSerialStatus("Error: Web Serial not supported in this browser.");
      return;
    }

    setIsUploading(true);
    setSerialStatus("Requesting port...");
    
    let port;
    try {
      port = await (navigator as any).serial.requestPort();
      setSerialStatus("Connecting to ESP32 (115200 baud)...");
      await port.open({ baudRate: 115200 });

      setSerialStatus("Preparing data...");
      const robotConfig: Config = {
        robot_id: robotId,
        robot_name: robotName,
        pots: pots,
        created_at: new Date().toISOString(),
        version: "1.0.0"
      };

      const singleLineJson = JSON.stringify(robotConfig); 
      const payload = singleLineJson + "\n"; 

      const encoder = new TextEncoder();
      const data = encoder.encode(payload);

      setSerialStatus("Sending data...");
      const writer = port.writable.getWriter();
      await writer.write(data);
      writer.releaseLock();

      setSerialStatus("Success! Configuration flashed.");
      setStatus({ type: 'success', msg: 'USB Upload Successful!' });

    } catch (error: any) {
      console.error("USB Upload Error:", error);
      setSerialStatus(`Error: ${error.message}`);
      setStatus({ type: 'error', msg: 'USB Upload Failed.' });
    } finally {
      if (port) {
        setTimeout(async () => {
          try {
            await port.close();
          } catch (e) {}
          setIsUploading(false);
        }, 1000);
      } else {
        setIsUploading(false);
      }
    }
  };

  if (isLoading) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-[#0E6633]" /></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-bold text-[#1e1e1e]">Setup & Commissioning</h2>
          <p className="text-[#757575] mt-1">Configure pots and flash to ESP32 via USB</p>
        </div>
        <button 
          onClick={fetchExistingConfig}
          disabled={isFetching}
          className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-gray-50 shadow-sm"
        >
          {isFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Fetch Existing
        </button>
      </div>

      {(!isSerialSupported || !isSecureContext) && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-4 animate-in slide-in-from-top-4 duration-500">
          <AlertCircle className="w-6 h-6 text-amber-600 mt-1 flex-shrink-0" />
          <div className="space-y-1">
            <h4 className="font-bold text-amber-900">
              {!isSerialSupported ? "Browser Not Supported" : "Secure Connection Required"}
            </h4>
            <p className="text-sm text-amber-800 leading-relaxed">
              {!isSerialSupported 
                ? "Your current browser does not support the Web Serial API. Please use Google Chrome, Microsoft Edge, or Opera to flash the robot configuration via USB."
                : "Web Serial requires a secure context (HTTPS or localhost). If you are accessing this via an IP address, please ensure you use a secure connection."}
            </p>
          </div>
        </div>
      )}

      {status && (
        <div className={`px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2 border ${
          status.type === 'success' ? 'bg-green-50 border-green-200 text-[#0E6633]' : 
          status.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-blue-50 border-blue-200 text-blue-700'
        }`}>
          {status.msg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4 shadow-sm">
            <h3 className="font-bold flex items-center gap-2"><Cpu className="w-5 h-5 text-[#0E6633]" /> 1. Robot Profile</h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Robot ID</label>
                <input type="text" value={robotId} onChange={(e) => setRobotId(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-[#0E6633] outline-none" placeholder="Robot ID" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Robot Name</label>
                <input type="text" value={robotName} onChange={(e) => setRobotName(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-[#0E6633] outline-none" placeholder="Robot Name" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Robot IP (WiFi)</label>
                <div className="flex gap-2">
                  <input type="text" value={robotIp} onChange={(e) => setRobotIp(e.target.value)} className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-[#0E6633] outline-none font-mono" placeholder="192.168.1.xxx" />
                  <button 
                    onClick={fetchFromRobotViaWifi}
                    disabled={isWifiFetching}
                    className="p-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors text-[#0E6633]"
                    title="Fetch via WiFi"
                  >
                    {isWifiFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button onClick={saveToDb} className="w-full py-3 bg-white border border-gray-200 text-[#1e1e1e] rounded-xl font-bold text-sm hover:bg-gray-50 flex items-center justify-center gap-2 shadow-sm">
              <Save className="w-4 h-4" /> Save to Database
            </button>
            
            <button 
              onClick={uploadViaUsb} 
              disabled={isUploading || !isSerialSupported || !isSecureContext}
              className="w-full py-3 bg-[#0E6633] text-white rounded-xl font-bold text-sm hover:bg-[#0c592b] flex items-center justify-center gap-2 shadow-lg shadow-[#0E6633]/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Usb className="w-4 h-4" />}
              Connect & Upload via USB
            </button>
          </div>

          <div className="bg-gray-900 rounded-2xl p-4 space-y-2 shadow-inner border border-gray-800">
            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
              <Terminal className="w-3 h-3" /> USB Status
            </div>
            <p className={`text-xs font-mono ${
              serialStatus.includes('Success') ? 'text-green-400' : 
              serialStatus.includes('Error') ? 'text-red-400' : 'text- agro-300'
            }`}>
              {`> ${serialStatus}`}
            </p>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold flex items-center gap-2"><List className="w-5 h-5 text-[#0E6633]" /> 2. Track & Pot Assignment</h3>
            <button onClick={addPot} className="text-xs font-bold text-[#0E6633] flex items-center gap-1 hover:underline"><Plus className="w-3 h-3" /> Add Pot</button>
          </div>

          <div className="space-y-4">
            {pots.map((pot, pIdx) => (
              <div key={pIdx} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm relative group">
                <button onClick={() => removePot(pIdx)} className="absolute top-4 right-4 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4" /></button>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center font-bold text-[#0E6633] font-mono border border-gray-100">{pot.index}</div>
                  <input 
                    type="text" 
                    value={pot.potName}
                    onChange={(e) => updatePotName(pIdx, e.target.value)}
                    className="flex-1 font-bold text-sm bg-transparent border-b border-transparent focus:border-[#0E6633] outline-none"
                    placeholder="Pot Name"
                  />
                </div>

                <div className="space-y-3 pl-4 border-l-2 border-dashed border-gray-100">
                  {pot.plants.map((plant, plIdx) => (
                    <div key={plIdx} className="flex items-center gap-3">
                      <Leaf className="w-4 h-4 text-[#22a042]" />
                      <input 
                        type="text" 
                        value={plant.name}
                        onChange={(e) => updatePlantName(pIdx, plIdx, e.target.value)}
                        className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:ring-1 focus:ring-[#0E6633] outline-none"
                      />
                      {pot.plants.length > 1 && (
                        <button onClick={() => removePlantFromPot(pIdx, plIdx)} className="text-gray-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                      )}
                    </div>
                  ))}
                  <button onClick={() => addPlantToPot(pIdx)} className="text-[10px] font-bold text-[#0E6633] flex items-center gap-1 hover:underline pt-1"><Plus className="w-3 h-3" /> Add Plant to this Pot</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
