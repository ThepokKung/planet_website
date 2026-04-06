import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { Users, UserPlus, Trash2, ShieldCheck, User } from "lucide-react";
import { createUserAction, deleteUserAction } from "@/actions/users";
import { revalidatePath } from "next/cache";

export default async function UserManagementPage() {
  const session = await getSession();

  // STRICT RULE: Non-admin can't see/access this page
  if (!session || session.role !== "ADMIN") {
    redirect("/fleet");
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-[#1e1e1e]">User Management</h2>
          <p className="text-[#757575] mt-1">Manage system administrators and operators</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create User Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-bold text-[#1e1e1e] flex items-center gap-2 mb-6">
              <UserPlus className="w-5 h-5 text-[#0E6633]" /> Register New User
            </h3>
            
            <form action={createUserAction} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#757575] uppercase mb-1">Email / Username</label>
                <input 
                  name="username"
                  type="email" 
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#0E6633]/20 outline-none transition-all"
                  placeholder="operator@agrobot.local"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#757575] uppercase mb-1">Password</label>
                <input 
                  name="password"
                  type="password" 
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#0E6633]/20 outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#757575] uppercase mb-1">System Role</label>
                <select 
                  name="role"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#0E6633]/20 outline-none transition-all appearance-none bg-white"
                >
                  <option value="USER">Standard Operator</option>
                  <option value="ADMIN">Administrator</option>
                </select>
              </div>
              <button 
                type="submit"
                className="w-full py-3 bg-[#0E6633] text-white rounded-xl font-bold text-sm hover:bg-[#0c592b] transition-all flex items-center justify-center gap-2 mt-2 shadow-md shadow-[#0E6633]/20"
              >
                Create Account
              </button>
            </form>
          </div>
        </div>

        {/* User List Table */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <h3 className="font-bold text-[#1e1e1e] flex items-center gap-2">
                <Users className="w-5 h-5 text-[#0E6633]" /> System Accounts
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[#757575] text-[10px] uppercase font-bold tracking-widest border-b border-gray-100">
                    <th className="px-6 py-4">Account</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Created</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                            u.role === 'ADMIN' ? "bg-[#0E6633] text-white" : "bg-gray-100 text-[#757575]"
                          )}>
                            {u.role === 'ADMIN' ? <ShieldCheck className="w-4 h-4" /> : <User className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-[#1e1e1e]">{u.username}</p>
                            <p className="text-[10px] text-[#757575] font-mono">{u.id.substring(0, 8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tight",
                          u.role === 'ADMIN' ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                        )}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-[#757575]">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {u.id !== session.userId && (
                          <form action={async () => {
                            "use server";
                            await deleteUserAction(u.id);
                          }}>
                            <button className="text-red-400 hover:text-red-600 p-2 transition-colors">
                              <Trash2 className="w-4 h-4" />
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

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
