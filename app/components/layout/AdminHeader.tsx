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
    <nav
      className="sticky top-0 z-50 border-b border-slate-200/60 dark:border-slate-700/60"
      style={{
        background: "rgba(255, 255, 255, 0.85)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
      }}
    >
      {/* Dark mode override */}
      <style>{`
        .dark nav[class*="sticky"] {
          background: rgba(15, 23, 42, 0.85) !important;
        }
      `}</style>

      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex h-14 items-center justify-between">
          <div className="flex flex-1 items-center justify-start sm:items-stretch sm:justify-start">
            {/* Mobile hamburger button */}
            {!isOpen && isMobile && (
              <button
                onClick={toggleSidebar}
                className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none transition-all duration-200"
              >
                <svg
                  className="h-5 w-5"
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

          <div className="flex items-center gap-2">
            {/* Color mode toggle */}
            <ColorModeToggle />

            {/* Profile dropdown */}
            <div className="relative flex items-center" ref={dropdownRef}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDropdown(!showDropdown);
                }}
                className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://primefaces.org/cdn/primevue/images/avatar/amyelsner.png"
                  alt="Avatar"
                  className="w-9 h-9 rounded-xl border-2 border-slate-200 dark:border-slate-600 object-cover shadow-sm"
                />
              </button>

              {/* Dropdown menu */}
              {showDropdown && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 top-13 w-72 origin-top-right rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-700/80 overflow-hidden animate-fade-in"
                  style={{
                    background: "rgba(255, 255, 255, 0.95)",
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                  }}
                >
                  {/* Dark mode style for dropdown */}
                  <style>{`
                    .dark div[class*="origin-top-right"] {
                      background: rgba(30, 41, 59, 0.95) !important;
                    }
                  `}</style>

                  <div className="p-4 border-b border-slate-100 dark:border-slate-700/50">
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="https://primefaces.org/cdn/primevue/images/avatar/amyelsner.png"
                        alt="Avatar"
                        className="w-11 h-11 rounded-xl border-2 border-slate-200 dark:border-slate-600 object-cover"
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-slate-900 dark:text-white truncate text-sm">
                          {fullName}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
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
                      className="w-full px-3 py-2.5 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors duration-150 flex items-center gap-2.5 font-medium"
                    >
                      <i className="fas fa-sign-out-alt text-xs"></i>
                      <span>Sign out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
