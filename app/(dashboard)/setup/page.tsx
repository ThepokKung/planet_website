"use client";

import { useState, useEffect, useRef } from "react";
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
  CloudDownload
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
  const [isFetchingDb, setIsFetchingDb] = useState(false);
  const [isFetchingMcu, setIsFetchingMcu] = useState(false);
  
  // Form States
  const [robotId, setRobotId] = useState("BOT-001");
  const [robotName, setRobotName] = useState("Vertical Forest Alpha");
  const [robotIp, setRobotIp] = useState("Not Connected");
  const [pots, setPots] = useState<PotEntry[]>([
    { index: 0, potName: "Pot 0", plants: [{ name: "Basil" }, { name: "Mint" }] }
  ]);
  
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info', msg: string } | null>(null);
  
  // Serial Port States (Persistent Refs)
  const portRef = useRef<any>(null);
  const writerRef = useRef<any>(null);
  const [serialStatus, setSerialStatus] = useState<string>("Waiting for connection...");
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [showJson, setShowJson] = useState<boolean>(false);
  const [boardConfigData, setBoardConfigData] = useState<string>("ไม่มีข้อมูล (กรุณาเชื่อมต่อ USB)");

  // Environment Checks
  const [isSerialSupported, setIsSerialSupported] = useState<boolean>(false);
  const [isSecureContext, setIsSecureContext] = useState<boolean>(true);

  const robotConfig: Config = {
    robot_id: robotId,
    robot_name: robotName,
    pots: pots,
    created_at: new Date().toISOString(),
    version: "1.0.0"
  };

  useEffect(() => {
    const supported = "serial" in navigator;
    const secure = window.isSecureContext;
    setIsSerialSupported(supported);
    setIsSecureContext(secure);

    if (!supported) setSerialStatus("Error: Browser not supported.");
    else if (!secure) setSerialStatus("Error: Web Serial requires HTTPS/localhost.");

    async function checkAuth() {
      const res = await fetch('/api/auth/session');
      const session = await res.json();
      if (!session || session.role !== 'ADMIN') router.push('/dashboard');
      else setIsLoading(false);
    }
    checkAuth();

    return () => {
      if (portRef.current) portRef.current.close().catch(() => {});
    };
  }, [router]);

  // --- USB Connection & Data Reading Logic ---

  const connectUsb = async () => {
    if (!isSerialSupported) return;

    setIsConnecting(true);
    setSerialStatus("Requesting port access...");
    
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

      setIsConnected(true);
      setSerialStatus("USB Connected! Fetching board info...");
      setStatus({ type: 'success', msg: 'USB Connected & Fetching Info...' });

      await writerRef.current.write("GET_INFO\n");
      readLoop(reader);
      
    } catch (error: any) {
      if (error.name === 'NotFoundError') {
        setSerialStatus("Connection cancelled by user.");
        setStatus({ type: 'info', msg: 'USB Selection Cancelled' });
      } else {
        console.error("USB Connection Error:", error);
        setSerialStatus(`Connection Failed: ${error.message}`);
        setStatus({ type: 'error', msg: 'USB Connection Failed' });
      }
      setIsConnected(false);
    } finally {
      setIsConnecting(false);
    }
  };

  const fetchFromMcu = async () => {
    if (!writerRef.current) {
      setStatus({ type: 'error', msg: 'Please Connect USB first.' });
      return;
    }
    setIsFetchingMcu(true);
    setSerialStatus("Fetching board configuration...");
    try {
      await writerRef.current.write("GET_INFO\n");
    } catch (error: any) {
      setSerialStatus(`Fetch Failed: ${error.message}`);
      setStatus({ type: 'error', msg: 'Failed to request data from board' });
    } finally {
      setTimeout(() => setIsFetchingMcu(false), 1000);
    }
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

        for (let line of lines) {
          processESP32Message(line.trim());
        }
      }
    } catch (error) {
      console.error("Read Error:", error);
      setIsConnected(false);
      setSerialStatus("Disconnected (Read Error)");
    }
  };

  const processESP32Message = (line: string) => {
    if (!line.startsWith("{")) return;

    try {
      const data = JSON.parse(line);
      
      if (data.type === "info") {
        setRobotIp(data.ip || "Unknown IP");
        if (data.config) {
          setBoardConfigData(JSON.stringify(data.config, null, 2));
          // Always update form with board data when specifically requested
          setRobotName(data.config.robot_name || robotName);
          if (data.config.pots) setPots(data.config.pots);
        }
        setSerialStatus("Board info synced successfully.");
        setStatus({ type: 'success', msg: 'MCU Data Loaded to Form' });
      } 
      else if (data.type === "success") {
        setSerialStatus(`ESP32: ${data.msg}`);
        setStatus({ type: 'success', msg: data.msg });
      } 
      else if (data.type === "error") {
        setSerialStatus(`ESP32 Error: ${data.msg}`);
        setStatus({ type: 'error', msg: data.msg });
      }
    } catch (e) {
      console.log("JSON Parse Error:", line);
    }
  };

  const uploadViaUsb = async () => {
    if (!writerRef.current) {
      setStatus({ type: 'error', msg: 'Please Connect USB first.' });
      return;
    }

    setIsUploading(true);
    setSerialStatus("Uploading new configuration...");
    
    try {
      const payload = JSON.stringify(robotConfig) + "\n";
      await writerRef.current.write(payload);
      setSerialStatus("Success: Configuration sent to board.");
      setStatus({ type: 'success', msg: 'Sync to Board Successful!' });
    } catch (error: any) {
      console.error("Upload Error:", error);
      setSerialStatus(`Upload Failed: ${error.message}`);
      setStatus({ type: 'error', msg: 'Upload Failed.' });
    } finally {
      setIsUploading(false);
    }
  };

  // --- Database Actions ---

  const fetchExistingFromDb = async () => {
    setIsFetchingDb(true);
    setStatus({ type: 'info', msg: `Fetching ${robotId} from Web DB...` });
    try {
      const data = await getRobotConfigAction(robotId);
      if (data) {
        setRobotName(data.robotName);
        setPots(data.pots.map((p: any) => ({
          index: p.index,
          potName: p.potName,
          plants: p.plants.map((pl: any) => ({ name: pl.name }))
        })));
        setStatus({ type: 'success', msg: "Database Data Loaded to Form" });
      } else {
        setStatus({ type: 'error', msg: "Robot not found in database." });
      }
    } catch (err) {
      setStatus({ type: 'error', msg: "Database Fetch failed." });
    } finally {
      setIsFetchingDb(false);
    }
  };

  const saveToDb = async () => {
    setStatus({ type: 'info', msg: 'Saving to database...' });
    const result = await saveRobotConfigAction({ robot_id: robotId, robot_name: robotName, pots });
    if (result.success) setStatus({ type: 'success', msg: 'Saved to Web Database!' });
    else setStatus({ type: 'error', msg: result.error || 'Failed to save.' });
  };

  // --- UI Helpers ---

  const addPot = () => setPots([...pots, { index: pots.length, potName: `Pot ${pots.length}`, plants: [{ name: "New Plant" }] }]);
  const removePot = (index: number) => setPots(pots.filter((_, i) => i !== index).map((p, i) => ({ ...p, index: i })));
  const addPlantToPot = (potIdx: number) => {
    const n = [...pots]; n[potIdx].plants.push({ name: "New Plant" }); setPots(n);
  };
  const removePlantFromPot = (potIdx: number, plantIdx: number) => {
    const n = [...pots];
    n[potIdx].plants = n[potIdx].plants.filter((_, i) => i !== plantIdx);
    setPots(n);
  };
  const updatePlantName = (pIdx: number, plIdx: number, name: string) => {
    const n = [...pots]; n[pIdx].plants[plIdx].name = name; setPots(n);
  };

  if (isLoading) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-[#0E6633]" /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-bold text-[#1e1e1e]">Setup & Commissioning</h2>
          <p className="text-[#757575] mt-1">Configure and sync robot via USB (Web Serial)</p>
        </div>
      </div>

      {status && (
        <div className={`px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 border animate-in slide-in-from-top-2 shadow-sm ${
          status.type === 'success' ? 'bg-green-50 border-green-200 text-[#0E6633]' : 
          status.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-blue-50 border-blue-200 text-blue-700'
        }`}>
          {status.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {status.msg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Actions & Profile (4/12) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Action Group 1: Fetch Data */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4 shadow-sm">
            <h3 className="font-bold flex items-center gap-2 text-gray-500 uppercase text-[10px] tracking-widest leading-none mb-2">Step 1: Get Existing Data</h3>
            <div className="grid grid-cols-1 gap-3">
              <button 
                onClick={fetchExistingFromDb} 
                disabled={isFetchingDb}
                className="w-full py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-50 flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 disabled:opacity-50"
              >
                {isFetchingDb ? <Loader2 className="w-4 h-4 animate-spin" /> : <CloudDownload className="w-4 h-4 text-[#0E6633]" />}
                Fetch from Database
              </button>

              <div className="flex gap-2">
                <button 
                  onClick={connectUsb} 
                  disabled={isConnecting || isConnected}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 disabled:opacity-70 ${
                    isConnected ? 'bg-green-50 text-[#0E6633] border border-[#0E6633]/20' : 'bg-white border border-gray-200 text-gray-700'
                  }`}
                >
                  {isConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Usb className="w-4 h-4" />}
                  {isConnected ? 'USB Linked' : 'Connect USB'}
                </button>
                <button 
                  onClick={fetchFromMcu} 
                  disabled={!isConnected || isFetchingMcu}
                  className="px-4 py-3 bg-white border border-gray-200 text-[#0E6633] rounded-xl font-bold text-sm hover:bg-gray-50 shadow-sm transition-all active:scale-95 disabled:opacity-30"
                  title="Pull Data from MCU"
                >
                  {isFetchingMcu ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4 shadow-sm">
            <h3 className="font-bold flex items-center gap-2 text-gray-500 uppercase text-[10px] tracking-widest leading-none mb-2">Step 2: Robot Profile</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Robot ID</label>
                  <input type="text" value={robotId} onChange={(e) => setRobotId(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-[#0E6633] outline-none font-bold" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Board IP</label>
                  <div className="w-full border border-gray-100 bg-gray-50 rounded-lg px-3 py-2 text-xs font-mono text-[#22a042] truncate">
                    {robotIp}
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Robot Name</label>
                <input type="text" value={robotName} onChange={(e) => setRobotName(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-[#0E6633] outline-none" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4 shadow-sm">
            <h3 className="font-bold flex items-center gap-2 text-gray-500 uppercase text-[10px] tracking-widest leading-none mb-2">Step 3: Sync & Save</h3>
            <div className="space-y-3">
              <button onClick={saveToDb} className="w-full py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-50 flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95">
                <Database className="w-4 h-4 text-[#0E6633]" /> Save to Web Database
              </button>
              
              <button 
                onClick={uploadViaUsb} 
                disabled={isUploading || !isConnected}
                className="w-full py-3 bg-[#0E6633] text-white rounded-xl font-bold text-sm hover:bg-[#0c592b] flex items-center justify-center gap-2 shadow-lg shadow-[#0E6633]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
              >
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                Sync Configuration to Board
              </button>
            </div>
          </div>

          <div className="bg-gray-900 rounded-2xl p-4 space-y-2 shadow-inner border border-gray-800">
            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
              <Terminal className="w-3 h-3 text-[#22a042]" /> Console Logs
            </div>
            <p className="text-xs font-mono text-gray-300">
              <span className="text-[#22a042] mr-2 leading-relaxed tracking-tighter uppercase font-black">{`>>`}</span>
              {serialStatus}
            </p>
          </div>
        </div>

        {/* Right Column: Assignment & Board Info (8/12) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold flex items-center gap-2"><List className="w-5 h-5 text-[#0E6633]" /> Track Assignment</h3>
            <button onClick={addPot} className="text-xs font-bold text-[#0E6633] flex items-center gap-1 hover:underline bg-green-50 px-3 py-1.5 rounded-full"><Plus className="w-3 h-3" /> Add Pot</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pots.map((pot, pIdx) => (
              <div key={pIdx} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm relative group animate-in zoom-in-95 duration-200">
                <button onClick={() => removePot(pIdx)} className="absolute top-4 right-4 text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-4 h-4" /></button>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center font-black text-xs text-[#0E6633] font-mono border border-gray-100">{pot.index}</div>
                  <input type="text" value={pot.potName} onChange={(e) => {const n=[...pots]; n[pIdx].potName=e.target.value; setPots(n);}} className="flex-1 font-bold text-sm bg-transparent border-b border-transparent focus:border-[#0E6633] outline-none" />
                </div>
                <div className="space-y-2 pl-4 border-l-2 border-dashed border-gray-100">
                  {pot.plants.map((plant, plIdx) => (
                    <div key={plIdx} className="flex items-center gap-2 group/plant">
                      <Leaf className="w-3.5 h-3.5 text-[#22a042]" />
                      <input type="text" value={plant.name} onChange={(e) => updatePlantName(pIdx, plIdx, e.target.value)} className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1 text-xs focus:ring-1 focus:ring-[#0E6633] outline-none" />
                      {pot.plants.length > 1 && (
                        <button 
                          onClick={() => removePlantFromPot(pIdx, plIdx)} 
                          className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover/plant:opacity-100"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button onClick={() => addPlantToPot(pIdx)} className="text-[10px] font-bold text-[#0E6633] flex items-center gap-1 hover:underline pt-1 opacity-60 hover:opacity-100 transition-opacity"><Plus className="w-3 h-3" /> Add Plant</button>
                </div>
              </div>
            ))}
          </div>

          {/* Board Info Display */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm transition-all">
            <button 
              onClick={() => setShowJson(!showJson)}
              className="w-full px-6 py-4 flex items-center justify-between bg-gray-50/50 hover:bg-gray-100 transition-colors group"
            >
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-gray-400 group-hover:text-[#0E6633] transition-colors" />
                <h3 className="font-bold text-sm text-gray-600 group-hover:text-[#0E6633] transition-colors">
                  Board Configuration (LittleFS)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  {showJson ? 'Hide' : 'Show'}
                </span>
                <div className={`transition-transform duration-300 ${showJson ? 'rotate-180' : ''}`}>
                  <Plus className={`w-4 h-4 ${showJson ? 'rotate-45 text-red-400' : 'text-[#0E6633]'}`} />
                </div>
              </div>
            </button>
            
            {showJson && (
              <div className="p-0 animate-in slide-in-from-top-2 duration-300">
                <textarea 
                  readOnly 
                  value={boardConfigData}
                  className="w-full h-48 p-6 bg-gray-900 text-[#22a042] font-mono text-[11px] leading-relaxed outline-none border-none resize-none shadow-inner"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
