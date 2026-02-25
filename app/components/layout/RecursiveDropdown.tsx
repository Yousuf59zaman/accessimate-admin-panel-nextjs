"use client";

import React from "react";
import Link from "next/link";

interface MenuItem {
  id?: number;
  name: string;
  route: string;
  icon?: string;
  is_open?: boolean;
  child?: MenuItem[];
  [key: string]: unknown;
}

interface RecursiveDropdownProps {
  item: MenuItem;
  currentPath: string;
  level?: number;
  onToggleMenu: (item: MenuItem) => void;
  onLinkClick: () => void;
}

export default function RecursiveDropdown({
  item,
  currentPath,
  level = 0,
  onToggleMenu,
  onLinkClick,
}: RecursiveDropdownProps) {
  const hasActiveChildPath = React.useMemo(() => {
    const checkChild = (children?: MenuItem[]): boolean => {
      if (!children || !children.length) return false;
      return children.some((child) => {
        if (currentPath === child.route) return true;
        if (child.child?.length) return checkChild(child.child);
        return false;
      });
    };
    return checkChild(item.child);
  }, [item.child, currentPath]);

  const handleItemClick = () => {
    if (item.child?.length) {
      onToggleMenu(item);
    }
  };

  return (
    <div className="dropdown-menu-item relative mb-0.5">
      <div className={level > 0 ? "pl-4 relative" : ""}>
        {/* Tree connector for child items */}
        {level > 0 && (
          <div className="absolute left-0 top-0 h-full w-1 z-[1] pointer-events-none">
            <div className="absolute left-0 top-0 w-[1px] h-full bg-gray-300 dark:bg-gray-600" />
            <div className="absolute left-0 top-[1.1rem] w-4 h-[1px] bg-gray-300 dark:bg-gray-600" />
          </div>
        )}

        {/* Item with no children — leaf node link */}
        {!item.child?.length ? (
          <Link
            href={item.route === "#" ? "" : item.route}
            className="flex items-center"
            onClick={onLinkClick}
          >
            <div
              className={`px-2 py-1 flex w-full rounded-md ${
                currentPath === item.route
                  ? "bg-gray-200 dark:bg-gray-700 border-l-4 border-l-cyan-600"
                  : "border-l-4 border-l-transparent"
              }`}
            >
              <div className="flex items-center min-w-0">
                <i
                  className={`text-base ${item.icon || ""} ${
                    currentPath === item.route
                      ? "text-cyan-600"
                      : "text-gray-600 dark:text-white"
                  }`}
                />
                <span className="text-gray-600 dark:text-white text-base ml-3 whitespace-nowrap overflow-hidden text-ellipsis">
                  {item.name}
                </span>
              </div>
            </div>
          </Link>
        ) : (
          /* Item with children — parent node */
          <div className="cursor-pointer" onClick={handleItemClick}>
            <div
              className={`px-2 py-1 flex justify-between w-full rounded-md ${
                item.is_open || currentPath === item.route || hasActiveChildPath
                  ? "bg-gray-200 dark:bg-gray-700"
                  : ""
              } ${
                currentPath === item.route
                  ? "border-l-4 border-l-cyan-600"
                  : "border-l-4 border-l-transparent"
              }`}
            >
              <div className="flex items-center min-w-0">
                <i
                  className={`text-base ${item.icon || ""} ${
                    currentPath === item.route
                      ? "text-cyan-600"
                      : "text-gray-600 dark:text-white"
                  }`}
                />
                <span className="text-gray-600 dark:text-white text-base ml-3 whitespace-nowrap overflow-hidden text-ellipsis">
                  {item.name}
                </span>
              </div>
              <span className="ml-auto pl-1">
                <i
                  className={`text-xs ${
                    item.is_open ? "fas fa-chevron-up" : "fas fa-chevron-down"
                  }`}
                />
              </span>
            </div>
          </div>
        )}

        {/* Recursive children */}
        {item.child?.length && item.is_open ? (
          <div className="mt-0.5 ml-2 relative py-0.5">
            {item.child.length > 1 && (
              <div className="absolute left-0 top-0 w-[1px] h-full bg-gray-300 dark:bg-gray-600" />
            )}
            {item.child.map((childItem) => (
              <RecursiveDropdown
                key={childItem.id || childItem.name}
                item={childItem}
                currentPath={currentPath}
                level={level + 1}
                onToggleMenu={onToggleMenu}
                onLinkClick={onLinkClick}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
