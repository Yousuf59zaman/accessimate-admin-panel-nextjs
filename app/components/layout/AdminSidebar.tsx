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
    setActiveState(menuList);
    // Force re-render
    setMenuList([...menuList]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const toggleChildMenu = useCallback(
    (item: MenuItem) => {
      if (item.child?.length) {
        item.is_open = !item.is_open;
        setMenuList([...menuList]);
      }
    },
    [menuList],
  );

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-10 transition-opacity"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed bg-[url('/images/effect-onlight.png')] bg-no-repeat h-full top-0 left-0 flex flex-col transition-all duration-300 ease-in-out transform dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 bg-white dark:text-white z-20 ${
          isOpen ? "w-[250px]" : "w-[70px]"
        } ${!isOpen && isMobile ? "-translate-x-full" : "translate-x-0"}`}
      >
        {/* Logo + hamburger */}
        <div className="flex items-center justify-between w-full px-2 sm:px-3 border-b-2 border-gray-200 dark:border-gray-700">
          <Link href="/" className={!isOpen ? "hidden" : ""}>
            <ApplicationLogo width="140px" />
          </Link>
          <div
            className={`w-full flex h-14 ${
              isOpen ? "justify-end" : "justify-center"
            }`}
          >
            <button
              onClick={toggleSidebar}
              className="inline-flex items-center justify-center rounded-md text-gray-400 dark:text-gray-500 focus:outline-none transition duration-150 ease-in-out"
            >
              <svg
                className="h-6 w-6"
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

        {/* Menu content */}
        {isMenuLoading && isOpen ? (
          /* Skeleton loading — expanded */
          <div className="overflow-hidden overflow-y-auto py-2">
            {Array.from({ length: 20 }).map((_, index) => (
              <div key={index} className="w-full">
                <div className="flex items-center w-full pb-3 px-4 gap-2 flex-row">
                  <div className="h-8 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="h-6 flex-1 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="h-8 w-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : isMenuLoading && !isOpen ? (
          /* Skeleton loading — collapsed */
          <div className="overflow-hidden overflow-y-auto py-2">
            {Array.from({ length: 20 }).map((_, index) => (
              <div key={index} className="w-full">
                <div className="flex items-center w-full py-2 px-4">
                  <div className="w-full flex justify-center items-center">
                    <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Loaded menu items */
          <div className="overflow-hidden overflow-y-auto py-2">
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
      </div>
    </>
  );
}
