"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  TreePine, 
  Zap, 
  BarChart3, 
  Settings, 
  Bot,
  Users,
  LogOut,
  LogIn,
  History
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { logoutAction } from "@/actions/auth";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function Sidebar({ role }: { role?: string }) {
  const pathname = usePathname();
  const isAdmin = role === 'ADMIN';

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Robot Details", href: "/details", icon: TreePine },
    { name: "Analytics", href: "/analytics", icon: BarChart3 },
    { name: "System Logs", href: "/system-logs", icon: History },
  ];

  const adminItems = [
    { name: "Setup Robot", href: "/setup", icon: Zap },
    { name: "User Management", href: "/users", icon: Users },
  ];

  return (
    <aside className="w-64 bg-[#0E6633] flex flex-col flex-shrink-0">
      <div className="p-6 border-b border-white border-opacity-10 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white bg-opacity-20 flex items-center justify-center shadow-inner">
          <Bot className="w-6 h-6 text-white" />
        </div>
        <span className="font-bold text-sm text-white leading-tight">
          Vertical Forest<br />Dashboard
        </span>
      </div>
      
      <nav className="flex-1 py-6 flex flex-col gap-1 px-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 text-white hover:bg-white hover:bg-opacity-10",
                isActive && "bg-white bg-opacity-20 border-l-4 border-white pl-3"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          );
        })}

        {isAdmin && (
          <>
            <div className="my-4 px-4">
              <div className="h-px bg-white/10 w-full" />
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-4 mb-2 px-4">Admin Tools</p>
            </div>
            {adminItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 text-white hover:bg-white hover:bg-opacity-10",
                  pathname === item.href && "bg-white bg-opacity-20 border-l-4 border-white pl-3"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            ))}
          </>
        )}
      </nav>

      <div className="p-4 border-t border-white border-opacity-10 text-xs text-white text-opacity-70 space-y-4">
        {role ? (
          <button 
            onClick={() => logoutAction()}
            className="flex items-center gap-2 text-white hover:text-white/80 transition-colors px-2 py-1"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        ) : (
          <Link 
            href="/login"
            className="flex items-center gap-2 text-white hover:text-white/80 transition-colors px-2 py-1"
          >
            <LogIn className="w-4 h-4" /> Admin Login
          </Link>
        )}
        
        <div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#22a042] animate-pulse"></div>
            System Online
          </div>
          <div className="mt-2 font-mono text-[10px] tracking-wider">
            v0.0.1-demo
          </div>
        </div>
      </div>
    </aside>
  );
}
