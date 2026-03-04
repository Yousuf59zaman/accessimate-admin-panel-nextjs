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

  return (
    <div className="mb-0.5" ref={menuRef}>
      {/* Leaf menu item (no children, or has a real route) */}
      {isLeafItem && (
        <div
          className={`menu-item-header text-gray-600 dark:text-white text-base font-medium leading-normal cursor-pointer ${
            isActive ? "rounded-md" : ""
          } ${level > 0 ? "relative pl-2" : ""}`}
        >
          {/* Tree connector for child items */}
          {level > 0 && (
            <div className="absolute left-0 top-0 h-full">
              <div className="absolute left-0 top-[1.1rem] w-3 h-[1px] bg-gray-300 dark:bg-gray-600" />
            </div>
          )}

          <Link
            href={item.route === "#" ? "" : item.route}
            className="flex items-center px-2 pt-1"
          >
            <div
              className={`px-2 mb-0.5 flex w-full rounded-md ${
                isActive
                  ? "bg-gray-200 dark:bg-gray-700 border-l-4 border-l-cyan-600"
                  : ""
              } ${isExpanded ? "justify-between py-1" : "justify-center py-2"}`}
            >
              <div className="flex items-center min-w-0">
                <i
                  className={`text-base ${item.icon || ""} ${
                    isActive ? "text-cyan-600" : "text-gray-600 dark:text-white"
                  }`}
                />
                {isExpanded && (
                  <span className="text-gray-600 dark:text-white text-base ml-3">
                    {item.name}
                  </span>
                )}
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* Parent menu item with children */}
      {!isLeafItem && (
        <div
          className={`menu-item-parent px-2 pt-1 text-gray-600 dark:text-white text-base font-medium leading-normal cursor-pointer ${
            isActive || hasActiveChild ? "rounded-md" : ""
          } ${level > 0 ? "relative pl-4" : ""}`}
          onClick={() => handleClick(item)}
        >
          {/* Tree connector for child items */}
          {level > 0 && (
            <div className="absolute left-0 top-0 h-full">
              <div className="absolute left-0 top-[1.1rem] w-3 h-[1px] bg-gray-300 dark:bg-gray-600" />
            </div>
          )}

          <div
            className={`px-2 mb-0.5 flex w-full rounded-md ${
              item.is_open || isActive || hasActiveChild
                ? "bg-gray-200 dark:bg-gray-700"
                : ""
            } ${isActive ? "border-l-4 border-l-cyan-600" : ""} ${
              isExpanded ? "justify-between py-1" : "justify-center py-2"
            }`}
          >
            <div className="flex items-center min-w-0">
              <i
                className={`text-base ${item.icon || ""} ${
                  isActive ? "text-cyan-600" : "text-gray-600 dark:text-white"
                }`}
              />
              {isExpanded && (
                <span className="text-gray-600 dark:text-white text-base ml-3">
                  {item.name}
                </span>
              )}
            </div>
            {hasChildren && isExpanded && (
              <span className="ml-auto pl-1">
                <i
                  className={
                    item.is_open ? "fas fa-chevron-up" : "fas fa-chevron-down"
                  }
                />
              </span>
            )}
          </div>
        </div>
      )}

      {/* Recursive children — expanded sidebar, tree view */}
      {hasChildren && !!item.is_open && isExpanded && (
        <div className="ml-3 relative pt-0 pb-0">
          {/* Vertical line connecting all children */}
          {item.child!.length > 0 && (
            <div className="absolute left-0 top-0 w-px h-[calc(100%-0.6rem)] bg-gray-300 dark:bg-gray-600 z-1" />
          )}
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
          className="fixed left-[70px] min-w-[220px] bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-[9999] p-2 overflow-y-auto"
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
