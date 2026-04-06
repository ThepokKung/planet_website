"use client";

import { useState, useEffect } from "react";
import { 
  Settings, 
  User, 
  Shield, 
  Bell, 
  Database, 
  Save, 
  Loader2, 
  CheckCircle,
  AlertTriangle,
  Cpu,
  Droplets,
  HardDrive
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
  
  // Settings State
  const [config, setConfig] = useState({
    defaultMoisture: 50,
    maxWaterDuration: 30,
    flowRate: 1.5,
    notifications: true,
    hardwareApiKey: "AGRO-XXXX-8888",
    autoUpdate: false
  });

  const [profile, setProfile] = useState({
    username: "",
    role: ""
  });

  useEffect(() => {
    async function checkAuth() {
      const res = await fetch('/api/auth/session');
      const session = await res.json();
      if (!session || session.role !== 'ADMIN') {
        router.push('/fleet');
      } else {
        setProfile({
          username: session.username || "Admin",
          role: session.role || "ADMIN"
        });
        setIsLoading(false);
      }
    }
    checkAuth();
  }, [router]);

  const saveSettings = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise(r => setTimeout(r, 1000));
    setStatus({ type: 'success', msg: "Settings updated successfully!" });
    setIsSaving(false);
    setTimeout(() => setStatus(null), 3000);
  };

  if (isLoading) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-[#0E6633]" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-bold text-[#1e1e1e]">System Settings</h2>
          <p className="text-[#757575] mt-1">Configure your IoT ecosystem and account preferences</p>
        </div>
        <button 
          onClick={saveSettings}
          disabled={isSaving}
          className="px-6 py-2.5 bg-[#0E6633] text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-[#0c592b] shadow-lg shadow-[#0E6633]/20 transition-all disabled:opacity-70"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </button>
      </div>

      {status && (
        <div className={`px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2 border animate-in slide-in-from-top-2 ${
          status.type === 'success' ? 'bg-green-50 border-green-200 text-[#0E6633]' : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {status.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {status.msg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Navigation Sidebar */}
        <div className="md:col-span-1 space-y-2">
          {[
            { id: 'general', label: 'General', icon: Settings },
            { id: 'profile', label: 'Profile', icon: User },
            { id: 'notifications', label: 'Notifications', icon: Bell },
            { id: 'security', label: 'Security', icon: Shield },
            { id: 'hardware', label: 'Hardware API', icon: Database }
          ].map((item) => (
            <button
              key={item.id}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                item.id === 'general' ? 'bg-[#0E6633] text-white shadow-md' : 'text-[#757575] hover:bg-white'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="md:col-span-2 space-y-6">
          {/* General System Preferences */}
          <div className="bg-white rounded-2xl border border-gray-100 p-8 space-y-6 shadow-sm">
            <h3 className="font-bold flex items-center gap-2 text-lg"><Cpu className="w-5 h-5 text-[#0E6633]" /> System Preferences</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                  <Droplets className="w-3 h-3" /> Default Moisture %
                </label>
                <input 
                  type="number" 
                  value={config.defaultMoisture} 
                  onChange={(e) => setConfig({...config, defaultMoisture: parseInt(e.target.value)})}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-[#0E6633]/10 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                  <Loader2 className="w-3 h-3" /> Max Duration (Sec)
                </label>
                <input 
                  type="number" 
                  value={config.maxWaterDuration} 
                  onChange={(e) => setConfig({...config, maxWaterDuration: parseInt(e.target.value)})}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-[#0E6633]/10 outline-none"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold">Auto-Update Firmware</p>
                <p className="text-xs text-[#757575]">Allow robots to pull updates over WiFi</p>
              </div>
              <button 
                onClick={() => setConfig({...config, autoUpdate: !config.autoUpdate})}
                className={`w-12 h-6 rounded-full transition-colors relative ${config.autoUpdate ? 'bg-[#0E6633]' : 'bg-gray-200'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${config.autoUpdate ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
          </div>

          {/* Account Profile */}
          <div className="bg-white rounded-2xl border border-gray-100 p-8 space-y-6 shadow-sm">
            <h3 className="font-bold flex items-center gap-2 text-lg"><User className="w-5 h-5 text-[#0E6633]" /> Profile Account</h3>
            
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-2xl bg-[#0E6633] flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-[#0E6633]/20">
                {profile.username.substring(0, 2).toUpperCase()}
              </div>
              <div className="space-y-1">
                <p className="font-black text-xl">{profile.username}</p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-[#0E6633] uppercase">
                    {profile.role}
                  </span>
                  <span className="text-xs text-[#757575]">Member since March 2026</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-4">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Hardware API Access Key</label>
              <div className="flex gap-2">
                <input 
                  type="password" 
                  value={config.hardwareApiKey} 
                  readOnly
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:ring-0 outline-none"
                />
                <button className="px-4 py-2 bg-gray-100 text-[#757575] rounded-xl text-xs font-bold hover:bg-gray-200">Reset</button>
              </div>
              <p className="text-[10px] text-amber-600 font-bold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Never share this key with anyone.
              </p>
            </div>
          </div>

          {/* Data Management */}
          <div className="bg-red-50 border border-red-100 rounded-2xl p-8 space-y-4">
            <h3 className="font-bold flex items-center gap-2 text-red-700"><HardDrive className="w-5 h-5" /> Danger Zone</h3>
            <p className="text-xs text-red-600 font-medium">Permanently delete all watering logs and reset system counters. This action cannot be undone.</p>
            <button className="px-6 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 shadow-md shadow-red-600/20">
              Purge Database
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
