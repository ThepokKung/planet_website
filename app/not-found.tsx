import Link from 'next/link';
import { Search, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4 text-center">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-gray-50 rounded-full text-[#0E6633]">
            <Search className="w-12 h-12" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h1>
        <p className="text-gray-600 mb-8 leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or has been moved. 
          Please check the URL or return to the dashboard.
        </p>

        <Link
          href="/dashboard"
          className="w-full flex items-center justify-center gap-2 bg-[#0E6633] hover:bg-[#0c552a] text-white font-semibold py-3 px-6 rounded-xl transition-all active:scale-95 shadow-lg shadow-green-900/20"
        >
          <Home className="w-5 h-5" />
          Return to Dashboard
        </Link>
      </div>
      
      <p className="mt-8 text-sm text-gray-400">
        Vertical Forest Dashboard • System Version 1.0.4
      </p>
    </div>
  );
}
