'use client';

import { useEffect } from 'react';
import { Database, AlertTriangle, RefreshCcw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application Error:', error);
  }, [error]);

  const isDatabaseError = 
    error.message?.toLowerCase().includes('database') || 
    error.message?.toLowerCase().includes('prisma') ||
    error.message?.toLowerCase().includes('connection') ||
    error.message?.toLowerCase().includes('p1001'); // Prisma connection error code

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4 text-center">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-red-50 rounded-full text-red-600">
            {isDatabaseError ? (
              <Database className="w-12 h-12" />
            ) : (
              <AlertTriangle className="w-12 h-12" />
            )}
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {isDatabaseError ? 'Database Connection Error' : 'Something went wrong'}
        </h1>
        
        <p className="text-gray-600 mb-8 leading-relaxed">
          {isDatabaseError 
            ? "We're having trouble connecting to the database server. This could be due to network issues or server maintenance."
            : "An unexpected error occurred. Our team has been notified."}
        </p>

        <div className="space-y-3">
          <button
            onClick={() => reset()}
            className="w-full flex items-center justify-center gap-2 bg-[#0E6633] hover:bg-[#0c552a] text-white font-semibold py-3 px-6 rounded-xl transition-all active:scale-95 shadow-lg shadow-green-900/20"
          >
            <RefreshCcw className="w-5 h-5" />
            Try Again
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 px-6 rounded-xl border border-gray-200 transition-all"
          >
            Refresh Page
          </button>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 pt-6 border-t border-gray-100 text-left">
            <p className="text-xs font-mono text-red-500 bg-red-50 p-3 rounded-lg overflow-auto max-h-32">
              {error.message}
            </p>
          </div>
        )}
      </div>
      
      <p className="mt-8 text-sm text-gray-400">
        Vertical Forest Dashboard • System Version 1.0.4
      </p>
    </div>
  );
}
