"use client";

import { useState } from "react";
import { loginAction } from "@/actions/auth";
import { Lock, User, Loader2 } from "lucide-react";
import TreeIcon from "@/components/tree-icon";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    console.log("Submit button clicked, starting login process...");
    setLoading(true);
    setError(null);
    
    try {
      const result = await loginAction(formData);
      console.log("Server responded:", result);
      
      if (result?.error) {
        setError(result.error);
        setLoading(false);
      }
    } catch (err) {
      console.error("Network or execution error:", err);
      setError("Cannot connect to server. Check your network.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0E6633] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-2xl">
        <div className="text-center">
          <div className="flex justify-center">
            <div className="w-14 h-14 rounded-xl bg-white border border-gray-200 flex items-center justify-center shadow-sm text-[#1e1e1e]">
              <TreeIcon size={34} />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Vertical Forest Dashboard
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to manage your robot fleet
          </p>
        </div>

        <form 
          className="mt-8 space-y-6" 
          action={handleSubmit}
        >
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-red-400 text-sm">⚠️</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#0E6633] focus:border-[#0E6633] sm:text-sm text-black"
                  placeholder="admin"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#0E6633] focus:border-[#0E6633] sm:text-sm text-black"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-[#0E6633] focus:ring-[#0E6633] border-gray-300 rounded cursor-pointer"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 cursor-pointer">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <a href="#" className="font-medium text-[#0E6633] hover:text-[#0c592b] transition-colors">
                Forgot your password?
              </a>
            </div>
          </div>

          <div className="space-y-3">
            <button
              disabled={loading}
              type="submit"
              onClick={() => console.log("Physical click on sign-in button detected")}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-[#0E6633] hover:bg-[#0c592b] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0E6633] disabled:opacity-50 transition-all active:scale-[0.98]"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign in"}
            </button>
          </div>
        </form>


        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500 font-medium">IoT Fleet Dashboard</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
