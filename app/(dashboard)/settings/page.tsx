"use client";

import { useState, useEffect } from "react";
import { 
  Shield, 
  Loader2, 
  CheckCircle,
  AlertTriangle,
  Lock
} from "lucide-react";
import { useRouter } from "next/navigation";
import { updatePasswordAction } from "@/actions/users";

export default function SettingsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
  
  // Password Change State
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  useEffect(() => {
    async function checkAuth() {
      const res = await fetch('/api/auth/session');
      const session = await res.json();
      if (!session) {
        router.push('/login');
      } else {
        setIsLoading(false);
      }
    }
    checkAuth();
  }, [router]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setStatus({ type: 'error', msg: "New passwords do not match." });
      return;
    }

    setIsSaving(true);
    try {
      const result = await updatePasswordAction({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      if (result.success) {
        setStatus({ type: 'success', msg: "Password updated successfully!" });
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        setStatus({ type: 'error', msg: result.error || "Failed to update password." });
      }
    } catch (error) {
      setStatus({ type: 'error', msg: "An unexpected error occurred." });
    }
    setIsSaving(false);
    setTimeout(() => setStatus(null), 5000);
  };

  if (isLoading) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-[#0E6633]" /></div>;

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div>
        <h2 className="text-3xl font-bold text-[#1e1e1e]">Account Security</h2>
        <p className="text-[#757575] mt-1">Update your password to keep your account secure</p>
      </div>

      {status && (
        <div className={`px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2 border animate-in slide-in-from-top-2 ${
          status.type === 'success' ? 'bg-green-50 border-green-200 text-[#0E6633]' : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {status.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {status.msg}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 p-8 space-y-6 shadow-sm">
        <h3 className="font-bold flex items-center gap-2 text-lg"><Shield className="w-5 h-5 text-[#0E6633]" /> Change Password</h3>
        
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
              <Lock className="w-3 h-3" /> Current Password
            </label>
            <input 
              type="password" 
              required
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-[#0E6633]/10 outline-none text-black"
              placeholder="••••••••"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
              <Lock className="w-3 h-3" /> New Password
            </label>
            <input 
              type="password" 
              required
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-[#0E6633]/10 outline-none text-black"
              placeholder="••••••••"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
              <Lock className="w-3 h-3" /> Confirm New Password
            </label>
            <input 
              type="password" 
              required
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-[#0E6633]/10 outline-none text-black"
              placeholder="••••••••"
            />
          </div>
          <button 
            type="submit"
            disabled={isSaving}
            className="w-full py-3 mt-4 bg-[#0E6633] text-white rounded-xl text-sm font-bold hover:bg-[#0c592b] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#0E6633]/20"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update Password"}
          </button>
        </form>
      </div>

      <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 flex items-start gap-4">
        <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-blue-800">Security Recommendation</p>
          <p className="text-xs text-blue-600 leading-relaxed mt-1">
            Use at least 8 characters, including a mix of letters, numbers, and symbols to ensure your account remains protected.
          </p>
        </div>
      </div>
    </div>
  );
}
