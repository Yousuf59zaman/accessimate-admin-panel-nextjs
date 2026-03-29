"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/app/contexts/SidebarContext";
import { fetchAdmin } from "@/app/lib/fetchAdmin";
import ApplicationLogo from "@/app/components/ui/ApplicationLogo";
import RecursiveMenuItem from "@/app/components/layout/RecursiveMenuItem";
import type { MenuItem } from "@/app/components/layout/RecursiveMenuItem";

export default function AdminSidebar() {
  const { isOpen, isMobile, toggleSidebar, closeSidebar } = useSidebar();
  const pathname = usePathname();

  const [menuList, setMenuList] = useState<MenuItem[]>([]);
  const [isMenuLoading, setIsMenuLoading] = useState(false);

  // Load menu data from API
  const loadData = useCallback(async () => {
    setIsMenuLoading(true);
    try {
      const getData = await fetchAdmin<{ data: MenuItem[] }>(
        "admin/tree-entity/main-menu",
        { method: "POST" },
      );
      setMenuList(getData.data || []);
    } catch (e: unknown) {
      const error = e as Error;
      console.log("Get Message", error.message);
    } finally {
      setIsMenuLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Automatically open the parent if a child is selected
  const updateMenuState = useCallback(() => {
    setMenuList((prevList) => {
      const newList = [...prevList];
      const setActiveState = (items: MenuItem[]) => {
        items.forEach((item) => {
          if (item.child && item.child.length) {
            item.is_open = item.child.some((child) => {
              if (child.child && child.child.length) {
                child.is_open = child.child.some((subChild) =>
                  pathname.startsWith(subChild.route),
                );
                return child.is_open || pathname.startsWith(child.route);
              }
              return pathname.startsWith(child.route);
            });
          }
        });
      };
      setActiveState(newList);
      return newList;
    });
  }, [pathname]);

  useEffect(() => {
    if (menuList.length > 0) {
      updateMenuState();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // After initial load, set active states
  useEffect(() => {
    if (menuList.length > 0) {
      updateMenuState();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menuList.length]);

  const toggleChildMenu = useCallback((item: MenuItem) => {
    if (item.child?.length) {
      item.is_open = !item.is_open;
      setMenuList((prev) => [...prev]);
    }
  }, []);

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-10 animate-fade-in"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed h-full top-0 left-0 flex flex-col transition-all duration-300 ease-in-out transform z-20 
          bg-white dark:bg-slate-900 border-r border-slate-200/60 dark:border-slate-700/60
          ${isOpen ? "w-[280px]" : "w-[70px]"} 
          ${!isOpen && isMobile ? "-translate-x-full" : "translate-x-0"}`}
      >
        {/* Brand Header — Stitch style */}
        <div className={`${isOpen ? "pt-7 pb-8 px-7" : "pt-5 pb-4 px-0"}`}>
          <div className={`flex items-center ${isOpen ? "gap-3.5" : "justify-center"}`}>
            {/* Brand icon */}
            <div className="w-10 h-10 rounded-xl bg-[#025ADB] flex items-center justify-center shadow-lg shadow-[#025ADB]/25 shrink-0">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
              </svg>
            </div>
            {isOpen && (
              <div className="flex items-center justify-between flex-1">
                <Link href="/" className="transition-opacity duration-200">
                  <ApplicationLogo width="140px" />
                </Link>
                <button
                  onClick={toggleSidebar}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none transition-all duration-200"
                >
                  <svg className="h-4 w-4" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            {!isOpen && (
              <button
                onClick={toggleSidebar}
                className="absolute top-5 left-1/2 -translate-x-1/2 hidden"
                aria-hidden
              />
            )}
          </div>
          {/* Collapsed: show hamburger below icon */}
          {!isOpen && (
            <div className="flex justify-center mt-3">
              <button
                onClick={toggleSidebar}
                className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none transition-all duration-200"
              >
                <svg className="h-5 w-5" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Navigation label */}
        {isOpen && !isMenuLoading && (
          <div className="relative px-8 pb-3">
            <span className="text-[11px] font-bold tracking-[0.15em] text-slate-400/60 dark:text-slate-500/60 uppercase">
              Navigation
            </span>
          </div>
        )}

        {/* Menu content */}
        {isMenuLoading && isOpen ? (
          /* Shimmer skeleton loading — expanded */
          <div className="relative overflow-hidden overflow-y-auto py-2 px-4 flex-1">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="mb-1">
                <div className="flex items-center gap-4 px-4 py-2.5 rounded-xl">
                  <div className="w-10 h-10 skeleton rounded-full shrink-0" />
                  <div className="h-4 flex-1 skeleton rounded-md" />
                  <div className="w-4 h-4 skeleton rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : isMenuLoading && !isOpen ? (
          /* Shimmer skeleton loading — collapsed */
          <div className="relative overflow-hidden overflow-y-auto py-4 flex-1">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="flex justify-center py-2.5 px-3">
                <div className="w-10 h-10 skeleton rounded-full" />
              </div>
            ))}
          </div>
        ) : (
          /* Loaded menu items */
          <nav className="relative overflow-hidden overflow-y-auto py-1 flex-1 px-4 space-y-0.5 sidebar-scroll">
            {menuList.map((item, index) => (
              <div key={item.id || index} className="relative">
                <RecursiveMenuItem
                  item={item}
                  currentPath={pathname}
                  isExpanded={isOpen}
                  onToggleMenu={toggleChildMenu}
                />
              </div>
            ))}
          </nav>
        )}

        {/* Footer Status Bar — Stitch style */}
        <div className={`mt-auto ${isOpen ? "p-5 bg-slate-50/80 dark:bg-slate-800/50" : "p-3"} border-t border-slate-200/50 dark:border-slate-700/50`}>
          {isOpen ? (
            <>
              <div className="flex items-center gap-2.5 mb-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                </span>
                <span className="text-[10px] font-bold tracking-[0.2em] text-slate-500 dark:text-slate-400 uppercase">
                  Admin Panel
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-400/70 dark:text-slate-500">
                  v2.4.0 Production
                </span>
                <span className="text-[10px] font-bold text-[#025ADB] bg-[#025ADB]/10 px-2 py-0.5 rounded">
                  ONLINE
                </span>
              </div>
            </>
          ) : (
            <div className="flex justify-center">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
