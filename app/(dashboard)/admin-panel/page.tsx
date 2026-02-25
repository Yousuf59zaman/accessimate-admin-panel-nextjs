'use client';

import { useAdminAuth } from '@/app/contexts/AdminAuthContext';

export default function AdminPanelPage() {
  const { adminUser, isLoading, logout } = useAdminAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Admin Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Welcome, {adminUser?.name || adminUser?.email || 'Admin'}!
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500">
          This is a placeholder page. The full dashboard will be built in Phase 8.
        </p>
        <button
          onClick={logout}
          className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
