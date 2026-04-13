import { Sidebar } from "@/components/sidebar";
import { LiveClock } from "@/components/live-clock";
import { getSession } from "@/lib/session";
import Link from "next/link";
import { LogIn } from "lucide-react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const userRole = session?.role as string | undefined;

  return (
    <div className="flex h-screen w-full bg-[#f4f6f8] text-[#1e1e1e] overflow-hidden font-sans">
      <Sidebar role={userRole} />

      {/* Main Content */}
      <main className="flex-1 overflow-auto flex flex-col">
        <header className="h-16 bg-white border-b border-gray-200 px-8 flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <div>
            <h1 className="text-lg font-bold text-[#1e1e1e]">
              Vertical Forest Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <LiveClock />
            {session ? (
              <div className="flex flex-col items-end">
                <div className="w-8 h-8 rounded-full bg-[#0E6633] flex items-center justify-center text-white text-xs font-bold shadow-md">
                  {userRole?.substring(0, 2).toUpperCase()}
                </div>
                <span className="text-[10px] text-[#757575] font-bold mt-1 uppercase tracking-tighter">
                  {userRole}
                </span>
              </div>
            ) : (
              <Link 
                href="/login" 
                className="flex items-center gap-2 px-4 py-1.5 bg-[#0E6633] text-white rounded-lg text-xs font-bold hover:bg-[#0c592b] transition-all shadow-sm"
              >
                <LogIn className="w-3.5 h-3.5" />
                Admin Login
              </Link>
            )}
          </div>
        </header>
        
        <div className="flex-1 p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
