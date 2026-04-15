"use client";

import { useState } from "react";
import { UserPlus, MapPin, Shield, ShieldCheck, X } from "lucide-react";
import { createUserAction } from "@/actions/users";

export function UserForm({ zones }: { zones: any[] }) {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    role: "ADMIN" as "SUPER ADMIN" | "ADMIN",
    locationIds: [] as string[]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await createUserAction(formData);
      setFormData({ username: "", password: "", role: "ADMIN", locationIds: [] });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleZone = (id: string) => {
    if (formData.locationIds.includes(id)) {
      setFormData({ ...formData, locationIds: formData.locationIds.filter(zid => zid !== id) });
    } else {
      setFormData({ ...formData, locationIds: [...formData.locationIds, id] });
    }
  };

  return (
    <div className="bg-white rounded-[32px] border border-gray-100 shadow-xl p-8 sticky top-24">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center">
          <UserPlus className="w-6 h-6 text-[#0E6633]" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-[#1e1e1e]">Create New User</h3>
          <p className="text-xs text-[#757575] font-medium uppercase tracking-wider">Access Control</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 text-red-500 rounded-2xl text-xs font-bold uppercase tracking-widest border border-red-100">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-[#757575] uppercase tracking-widest px-1">Email / Username</label>
          <input 
            value={formData.username}
            onChange={(e) => setFormData({...formData, username: e.target.value})}
            type="text" 
            required
            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 font-bold text-[#1e1e1e] focus:ring-2 focus:ring-[#0E6633] transition-all"
            placeholder="operator@vertical-forest.local"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-[#757575] uppercase tracking-widest px-1">Initial Password</label>
          <input 
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            type="password" 
            required
            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 font-bold text-[#1e1e1e] focus:ring-2 focus:ring-[#0E6633] transition-all"
            placeholder="••••••••"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-[#757575] uppercase tracking-widest px-1">System Role</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFormData({...formData, role: 'ADMIN'})}
              className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${formData.role === 'ADMIN' ? 'bg-[#0E6633] border-[#0E6633] text-white shadow-lg' : 'bg-gray-50 border-gray-100 text-gray-500 hover:bg-white hover:border-[#0E6633]'}`}
            >
              <Shield className="w-5 h-5" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Admin</span>
            </button>
            <button
              type="button"
              onClick={() => setFormData({...formData, role: 'SUPER ADMIN'})}
              className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${formData.role === 'SUPER ADMIN' ? 'bg-[#0E6633] border-[#0E6633] text-white shadow-lg' : 'bg-gray-50 border-gray-100 text-gray-500 hover:bg-white hover:border-[#0E6633]'}`}
            >
              <ShieldCheck className="w-5 h-5" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Super Admin</span>
            </button>
          </div>
        </div>

        {formData.role === 'ADMIN' && (
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-[#757575] uppercase tracking-widest px-1 flex items-center justify-between">
              <span>Assign Zones</span>
              <span className="text-[10px] text-[#0E6633] normal-case font-medium">{formData.locationIds.length} Selected</span>
            </label>
            <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto p-1">
              {zones.map(z => (
                <div 
                  key={z.id}
                  onClick={() => toggleZone(z.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${formData.locationIds.includes(z.id) ? 'bg-green-50 border-[#0E6633]' : 'bg-white border-gray-100 hover:bg-gray-50'}`}
                >
                  <MapPin className={`w-3.5 h-3.5 ${formData.locationIds.includes(z.id) ? 'text-[#0E6633]' : 'text-gray-400'}`} />
                  <span className={`text-[11px] font-bold ${formData.locationIds.includes(z.id) ? 'text-[#0E6633]' : 'text-gray-500'}`}>
                    {z.spotName || z.fullCode}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <button 
          disabled={loading}
          type="submit"
          className="w-full py-4 bg-[#0E6633] text-white rounded-[20px] font-bold text-sm hover:bg-[#0c592b] transition-all flex items-center justify-center gap-2 mt-4 shadow-xl shadow-[#0E6633]/20 disabled:opacity-50"
        >
          {loading ? "Creating..." : "Generate Account"}
        </button>
      </form>
    </div>
  );
}
