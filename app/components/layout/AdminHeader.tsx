"use client";

import React, { useState, useRef, useEffect } from "react";
import { useSidebar } from "@/app/contexts/SidebarContext";
import { useAdminAuth } from "@/app/contexts/AdminAuthContext";
import ColorModeToggle from "@/app/components/layout/ColorModeToggle";

export default function AdminHeader() {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { adminUser, logout } = useAdminAuth();
  const { isOpen, isMobile, toggleSidebar } = useSidebar();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const userData = adminUser as Record<string, Record<string, unknown>> | null;
  const userInfo = (userData?.data?.user_info ||
    userData?.user_info ||
    userData) as Record<string, string> | null;
  const userEmail = (userData?.data?.email || userData?.email || "") as string;
  const firstName = userInfo?.first_name || "";
  const lastName = userInfo?.last_name || "";
  const fullName = `${firstName} ${lastName}`.trim() || "Admin";

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-lg sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
        <div className="relative flex h-14 items-center justify-between">
          <div className="flex flex-1 items-center justify-start sm:items-stretch sm:justify-start">
            {/* Mobile hamburger button — only visible when sidebar is closed on mobile */}
            {!isOpen && isMobile && (
              <button
                onClick={toggleSidebar}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900 focus:outline-none transition duration-150 ease-in-out"
              >
                <svg
                  className="h-6 w-6"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            )}
          </div>
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
            {/* Profile dropdown */}
            <div className="flex items-center justify-center">
              <div
                className="relative flex items-center gap-3"
                ref={dropdownRef}
              >
                <ColorModeToggle />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDropdown(!showDropdown);
                  }}
                  className="flex items-center transition-transform duration-200 hover:scale-105"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://primefaces.org/cdn/primevue/images/avatar/amyelsner.png"
                    alt="Avatar"
                    className="w-10 h-10 rounded-full border-2 border-gray-200 dark:border-gray-700 object-cover"
                  />
                </button>

                {/* Dropdown menu */}
                {showDropdown && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 top-12 w-72 origin-top-right bg-white dark:bg-gray-800 rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none transition duration-200 ease-out transform scale-100 opacity-100"
                  >
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="https://primefaces.org/cdn/primevue/images/avatar/amyelsner.png"
                          alt="Avatar"
                          className="w-12 h-12 rounded-full border-2 border-gray-200 dark:border-gray-700 object-cover"
                        />
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900 dark:text-white truncate">
                            {fullName}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {userEmail}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="p-2">
                      <button
                        onClick={() => {
                          setShowDropdown(false);
                          logout();
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-150 flex items-center gap-2"
                      >
                        <i className="fas fa-sign-out-alt"></i>
                        <span>Sign out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
