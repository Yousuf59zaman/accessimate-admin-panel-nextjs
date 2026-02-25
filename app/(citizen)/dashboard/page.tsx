"use client";

import { useCitizenAuth } from "@/app/contexts/CitizenAuthContext";

export default function CitizenDashboardPage() {
  const { citizenUser, logout, isLoading } = useCitizenAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          Citizen Dashboard
        </h1>
        {citizenUser && (
          <p className="text-gray-600 mb-6">
            Welcome, {citizenUser.name || citizenUser.email || "User"}!
          </p>
        )}
        <button
          onClick={logout}
          className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors duration-200"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
