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
        className={`fixed bg-[url('/images/effect-onlight.png')] bg-no-repeat h-full top-0 left-0 flex flex-col transition-all duration-300 ease-in-out transform border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 z-20 ${
          isOpen ? "w-[250px]" : "w-[70px]"
        } ${!isOpen && isMobile ? "-translate-x-full" : "translate-x-0"}`}
      >
        {/* Logo + hamburger */}
        <div className="relative flex items-center justify-between w-full px-3 h-16 border-b border-gray-200 dark:border-gray-700">
          <Link
            href="/"
            className={`${!isOpen ? "hidden" : "block"} transition-opacity duration-200`}
          >
            <ApplicationLogo width="140px" />
          </Link>
          <div
            className={`w-full flex h-14 ${
              isOpen ? "justify-end" : "justify-center"
            }`}
          >
            <button
              onClick={toggleSidebar}
              className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none transition-all duration-200"
            >
              <svg
                className="h-5 w-5"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 24 24"
              >
                {!isOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Navigation label */}
        {isOpen && !isMenuLoading && (
          <div className="relative px-4 pt-4 pb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Navigation
            </span>
          </div>
        )}

        {/* Menu content */}
        {isMenuLoading && isOpen ? (
          /* Shimmer skeleton loading — expanded */
          <div className="relative overflow-hidden overflow-y-auto py-4 px-3 flex-1">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="mb-2">
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
                  <div className="w-8 h-8 skeleton rounded-lg shrink-0" />
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
                <div className="w-8 h-8 skeleton rounded-lg" />
              </div>
            ))}
          </div>
        ) : (
          /* Loaded menu items */
          <div className="relative overflow-hidden overflow-y-auto py-2 flex-1">
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
          </div>
        )}

        {/* Bottom section — ADMIN PANEL label */}
        <div className="relative border-t border-gray-200 dark:border-gray-700 px-3 py-3">
          {isOpen ? (
            <div className="flex items-center gap-2 px-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
              <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                Admin Panel
              </span>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
