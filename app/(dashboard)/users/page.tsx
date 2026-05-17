import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { Users, UserPlus, Trash2, ShieldCheck, Shield, MapPin, Key } from "lucide-react";
import { deleteUserAction } from "@/actions/users";
import { UserForm } from "@/components/user-form";
import { UserZoneBadge } from "@/components/user-zone-badge";
import { UserZoneManager } from "@/components/user-zone-manager";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const dynamic = 'force-dynamic';

export default async function UserManagementPage() {
  const session = await getSession();

  if (!session || session.role !== "SUPER ADMIN") {
    redirect("/dashboard");
  }

  const users = await prisma.user.findMany({
    include: {
      locations: true
    },
    orderBy: { createdAt: 'desc' }
  });

  const allZones = await prisma.location.findMany();
  
  // Natural Sort Logic: Handle S1, S2, S10 correctly
  const zones = allZones.sort((a, b) => {
    const extract = (s: string | null) => {
      if (!s) return { prefix: '', num: 0 };
      const match = s.match(/([A-Z]+)(\d+)/);
      return match ? { prefix: match[1], num: parseInt(match[2], 10) } : { prefix: s, num: 0 };
    };
    
    const valA = extract(a.fullCode);
    const valB = extract(b.fullCode);
    
    // Sort by Prefix (North/South) then by Number
    if (valA.prefix !== valB.prefix) return valA.prefix.localeCompare(valB.prefix);
    return valA.num - valB.num;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-[#1e1e1e]">Access Management</h2>
        <p className="text-[#757575] mt-1">Control system hierarchy and zone assignments</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Create User Form */}
        <div className="lg:col-span-4">
          <UserForm zones={zones} />
        </div>

        {/* User List */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-visible">
            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between rounded-t-2xl">
              <h3 className="text-lg font-bold text-[#1e1e1e] flex items-center gap-2">
                <Users className="w-5 h-5 text-[#0E6633]" /> Active Personnel
              </h3>
              <span className="text-[10px] font-mono text-[#757575] bg-white px-3 py-1 rounded-full border border-gray-100">
                {users.length} Registered
              </span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[#757575] text-xs uppercase font-bold tracking-wider border-b border-gray-100">
                    <th className="px-6 py-4">Identities</th>
                    <th className="px-6 py-4">Role & Clearance</th>
                    <th className="px-6 py-4">Assigned Zones</th>
                    <th className="px-6 py-4 text-right">Ops</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-bold shadow-inner",
                            u.role === 'SUPER ADMIN' ? "bg-black text-white" : "bg-green-50 text-[#0E6633]"
                          )}>
                            {u.role === 'SUPER ADMIN' ? <ShieldCheck className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-[#1e1e1e]">{u.username}</p>
                            <div className="flex items-center gap-1.5 mt-1">
                              <Key className="w-3 h-3 text-[#757575]" />
                              <p className="text-[9px] text-[#757575] font-mono uppercase tracking-tighter">{u.id}</p>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider",
                          u.role === 'SUPER ADMIN' ? "bg-black text-white" : "bg-green-100 text-[#0E6633]"
                        )}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {u.role === 'SUPER ADMIN' ? (
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest italic">All Zones Permitted</span>
                        ) : (
                          <UserZoneManager 
                            userId={u.id} 
                            assignedLocations={u.locations} 
                            allZones={zones} 
                            username={u.username} 
                          />
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {u.id !== session.userId && (
                          <form action={async () => {
                            "use server";
                            try {
                              await deleteUserAction(u.id);
                            } catch (e) {
                              console.error(e);
                            }
                          }}>
                            <button className="text-gray-300 hover:text-red-500 p-2 transition-colors">
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </form>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
