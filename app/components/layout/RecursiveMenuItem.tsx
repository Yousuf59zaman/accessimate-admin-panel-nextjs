"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import RecursiveDropdown from "@/app/components/layout/RecursiveDropdown";

export interface MenuItem {
  id?: number;
  name: string;
  route: string;
  icon?: string;
  is_open?: boolean;
  child?: MenuItem[];
  [key: string]: unknown;
}

interface RecursiveMenuItemProps {
  item: MenuItem;
  currentPath: string;
  isExpanded: boolean;
  level?: number;
  onToggleMenu: (item: MenuItem) => void;
}

export default function RecursiveMenuItem({
  item,
  currentPath,
  isExpanded,
  level = 0,
  onToggleMenu,
}: RecursiveMenuItemProps) {
  const [localIsMobile, setLocalIsMobile] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownTop, setDropdownTop] = useState(0);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setLocalIsMobile(mobile);
      if (mobile && !isExpanded && item.is_open) {
        onToggleMenu(item);
      }
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close flyout dropdown on outside click (collapsed state)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        !isExpanded &&
        item.is_open &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        onToggleMenu(item);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpanded, item.is_open]);

  // Position the flyout dropdown when collapsed sidebar opens it
  useEffect(() => {
    if (item.is_open && !isExpanded && menuRef.current && !localIsMobile) {
      const rect = menuRef.current.getBoundingClientRect();
      let top = rect.top;
      if (dropdownRef.current) {
        const dropdownHeight = dropdownRef.current.offsetHeight;
        const windowHeight = window.innerHeight;
        if (top + dropdownHeight > windowHeight) {
          top = windowHeight - dropdownHeight - 10;
        }
      }
      setDropdownTop(top);
    }
  }, [item.is_open, isExpanded, localIsMobile]);

  const handleClick = useCallback(
    (menuItem: MenuItem) => {
      if (menuItem.child?.length) {
        if (localIsMobile && !isExpanded) {
          return;
        }
        onToggleMenu(menuItem);
      }
    },
    [localIsMobile, isExpanded, onToggleMenu],
  );

  const handleLinkClick = useCallback(() => {
    if (!isExpanded && item.is_open) {
      onToggleMenu(item);
    }
  }, [isExpanded, item, onToggleMenu]);

  const isLeafItem = item.route !== "#" || !item.child?.length;
  const hasChildren = !!(item.child && item.child.length > 0);
  const isActive = currentPath === item.route;
  const hasActiveChild = item.child?.some(
    (child) => currentPath === child.route,
  );

  // Modern active/hover styles
  // If it's a parent item and it's open (or has an active child), it gets a solid pill background
  const parentOpenClasses =
    !isLeafItem && (item.is_open || hasActiveChild)
      ? "bg-slate-50 dark:bg-slate-800/80"
      : "";

  // If it's a leaf/child item and it's active, it gets a rounded background with a left border
  const childActiveClasses =
    isLeafItem && isActive
      ? "bg-brand-50 dark:bg-brand-900/20 border-l-[3px] border-l-brand-600 dark:border-l-brand-400"
      : "";

  const hoverClasses =
    !isActive && !(!isLeafItem && (item.is_open || hasActiveChild))
      ? "hover:bg-slate-50 dark:hover:bg-slate-800/50"
      : "";

  return (
    <div className={`${level === 0 ? "px-2" : ""} mb-0.5`} ref={menuRef}>
      {/* Leaf menu item (no children, or has a real route) */}
      {isLeafItem && (
        <Link
          href={item.route === "#" ? "" : item.route}
          className={`group flex items-center gap-3 rounded-r-3xl rounded-l-md mx-0 cursor-pointer transition-all duration-200
            ${isExpanded ? "px-3 py-2" : "px-0 py-2 justify-center"}
            ${childActiveClasses} ${hoverClasses}
            ${level > 0 ? "ml-1" : ""}
          `}
        >
          <div
            className={`flex items-center justify-center ${isExpanded ? "w-9 h-9 rounded-full" : "w-9 h-9 rounded-lg"} transition-colors duration-200 shrink-0
            ${isActive ? "bg-brand-100 text-brand-700 dark:bg-brand-800 dark:text-brand-300" : "text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-200"}`}
          >
            <i className={`text-[13px] ${item.icon || ""}`} />
          </div>
          {isExpanded && (
            <span
              className={`text-[15px] font-medium transition-colors duration-200
              ${isActive ? "text-slate-900 dark:text-white font-semibold" : "text-slate-600 group-hover:text-slate-900 dark:text-slate-300 dark:group-hover:text-white"}`}
            >
              {item.name}
            </span>
          )}
        </Link>
      )}

      {/* Parent menu item with children */}
      {!isLeafItem && (
        <div
          className={`group flex items-center gap-3 rounded-full mx-0 cursor-pointer transition-all duration-200
            ${isExpanded ? "p-1.5 pr-4" : "px-0 py-2 justify-center"}
            ${parentOpenClasses} ${hoverClasses}
            ${level > 0 ? "ml-1" : ""}
          `}
          onClick={() => handleClick(item)}
        >
          <div
            className={`flex items-center justify-center ${isExpanded ? "w-10 h-10 rounded-full" : "w-9 h-9 rounded-lg"} transition-colors duration-200 shrink-0
            ${isActive || hasActiveChild ? "bg-blue-500 text-white dark:bg-blue-600" : "bg-transparent text-slate-500 group-hover:bg-slate-100 dark:text-slate-400 dark:group-hover:bg-slate-700"}`}
          >
            <i className={`text-[15px] ${item.icon || ""}`} />
          </div>
          {isExpanded && (
            <>
              <span
                className={`text-[16px] font-medium flex-1 transition-colors duration-200
                ${isActive || hasActiveChild ? "text-slate-900 dark:text-white" : "text-slate-600 group-hover:text-slate-900 dark:text-slate-300 dark:group-hover:text-white"}`}
              >
                {item.name}
              </span>
              {hasChildren && (
                <i
                  className={`fas fa-chevron-down text-[10px] text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-400 transition-transform duration-200
                    ${item.is_open ? "rotate-180" : "rotate-0"}`}
                />
              )}
            </>
          )}
        </div>
      )}

      {/* Recursive children — expanded sidebar */}
      {hasChildren && !!item.is_open && isExpanded && (
        <div
          className="ml-4 mt-0.5 relative border-l border-slate-200 dark:border-slate-700 overflow-hidden"
          style={{
            animation: "slideDown 0.2s ease-out",
          }}
        >
          {item.child!.map((child) => (
            <RecursiveMenuItem
              key={child.id || child.name}
              item={child}
              currentPath={currentPath}
              isExpanded={isExpanded}
              level={level + 1}
              onToggleMenu={onToggleMenu}
            />
          ))}
        </div>
      )}

      {/* Collapsed state flyout dropdown */}
      {hasChildren && !isExpanded && !!item.is_open && !localIsMobile && (
        <div
          ref={dropdownRef}
          className="fixed left-[70px] min-w-[220px] bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700/50 z-9999 p-2 overflow-y-auto backdrop-blur-xl"
          style={{ maxHeight: "70vh", top: `${dropdownTop}px` }}
          onMouseLeave={handleLinkClick}
        >
          {item.child!.map((child) => (
            <RecursiveDropdown
              key={child.id || child.name}
              item={child}
              currentPath={currentPath}
              level={0}
              onToggleMenu={onToggleMenu}
              onLinkClick={handleLinkClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}
