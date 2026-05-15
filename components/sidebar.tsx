"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Zap, 
  BarChart3, 
  Settings, 
  Users,
  LogOut,
  History,
  Leaf
} from "lucide-react";
import { cn } from "@/lib/utils";
import TreeIcon from "./tree-icon";
import { logoutAction } from "@/actions/auth";

export function Sidebar({ role }: { role?: string }) {
  const pathname = usePathname();
  const isSuperAdmin = role === 'SUPER ADMIN';

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Analytics", href: "/analytics", icon: BarChart3 },
    { name: "Plants", href: "/plants", icon: Leaf },
    { name: "System Logs", href: "/system-logs", icon: History },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  const adminItems = [
    { name: "Setup Robot", href: "/setup", icon: Zap },
    { name: "Plant Master", href: "/plant-master", icon: Leaf },
  ];

  const superAdminItems = [
    { name: "User Management", href: "/users", icon: Users },
  ];

  return (
    <aside className="w-64 bg-[#0E6633] flex flex-col flex-shrink-0">
      <div className="p-6 border-b border-white border-opacity-10 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white bg-opacity-20 flex items-center justify-center shadow-inner">
          <TreeIcon size={24} color="white" />
        </div>
        <div>
          <span className="font-bold text-sm text-white leading-tight block">
            Vertical Forest
          </span>
          <span className="text-[10px] text-white/60 font-medium uppercase tracking-wider">
            Command Center
          </span>
        </div>
      </div>
      
      <nav className="flex-1 py-6 flex flex-col gap-1 px-3 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 text-white hover:bg-white hover:bg-opacity-10",
                isActive && "bg-white/20 border-l-4 border-[#22a042] pl-3"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          );
        })}

        {role && (
          <>
            <div className="my-4 px-4">
              <div className="h-px bg-white/10 w-full" />
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-4 mb-2">Management</p>
            </div>
            
            {adminItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 text-white hover:bg-white hover:bg-opacity-10",
                  pathname === item.href && "bg-white/20 border-l-4 border-[#22a042] pl-3"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            ))}
          </>
        )}

        {isSuperAdmin && (
          <>
            <div className="my-4 px-4">
              <div className="h-px bg-white/10 w-full" />
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-4 mb-2">Super Admin</p>
            </div>
            {superAdminItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 text-white hover:bg-white hover:bg-opacity-10",
                  pathname === item.href && "bg-white/20 border-l-4 border-[#22a042] pl-3"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            ))}
          </>
        )}
      </nav>

      <div className="p-4 border-t border-white border-opacity-10 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#22a042] animate-pulse"></div>
            <span className="text-xs text-white/70">System Online</span>
          </div>
          <span className="font-mono text-[9px] text-white/30 tracking-wider">v1.2.0</span>
        </div>
        
        {role && (
          <button 
            onClick={() => logoutAction()}
            className="flex items-center justify-center gap-2 text-white/70 hover:text-white transition-colors py-2 border border-white/10 rounded-lg text-xs"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        )}
      </div>
    </aside>
  );
}
