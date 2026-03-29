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

/** Filter out arrow/chevron icons from API data and use smart name-based fallback */
const DD_ARROW_PATTERNS = [
  "fa-angle-right", "fa-angle-left", "fa-angle-down", "fa-angle-up",
  "fa-chevron-right", "fa-chevron-left", "fa-chevron-down", "fa-chevron-up",
  "fa-arrow-right", "fa-arrow-left", "fa-arrow-down", "fa-arrow-up",
  "fa-caret-right", "fa-caret-left", "fa-caret-down", "fa-caret-up",
  "fa-angles-right", "fa-angles-left",
];
const DD_NAME_ICON_MAP: Record<string, string> = {
  "portfolio": "fas fa-briefcase", "portfolios": "fas fa-briefcase",
  "portfolio categories": "fas fa-folder-open", "portfolio category": "fas fa-folder-open",
  "event": "fas fa-calendar-alt", "events": "fas fa-calendar-alt",
  "event categories": "fas fa-calendar-check", "event category": "fas fa-calendar-check",
  "social links": "fas fa-share-alt", "social link": "fas fa-share-alt",
  "features": "fas fa-star", "feature": "fas fa-star",
  "partners": "fas fa-handshake", "partner": "fas fa-handshake",
  "years": "fas fa-history", "year": "fas fa-history",
  "release notes": "fas fa-clipboard-list", "release note": "fas fa-clipboard-list",
  "news": "fas fa-newspaper", "news categories": "fas fa-tags",
  "faq": "fas fa-question-circle", "faq categories": "fas fa-layer-group",
  "tutorials": "fas fa-book-open", "pages": "fas fa-file-alt",
  "comments": "fas fa-comments", "blog": "fas fa-blog",
  "gallery": "fas fa-images", "media": "fas fa-photo-video",
  "testimonials": "fas fa-quote-right", "slider": "fas fa-sliders-h",
  "banner": "fas fa-image", "banners": "fas fa-image",
  "footers": "fas fa-shoe-prints", "footer": "fas fa-shoe-prints",
  "headers": "fas fa-heading", "header": "fas fa-heading",
  "menus": "fas fa-bars", "menu": "fas fa-bars",
  "users": "fas fa-users", "user": "fas fa-user",
  "roles": "fas fa-user-shield", "permissions": "fas fa-key",
  "settings": "fas fa-cog", "categories": "fas fa-th-large",
  "tags": "fas fa-tags", "dashboard": "fas fa-tachometer-alt",
  "accessibility": "fas fa-universal-access", "accessibility features": "fas fa-universal-access",
  "seo": "fas fa-search", "analytics": "fas fa-chart-line",
  "notifications": "fas fa-bell", "email": "fas fa-envelope",
  "contacts": "fas fa-address-book", "messages": "fas fa-envelope-open-text",
  "templates": "fas fa-palette", "reports": "fas fa-chart-bar",
  "logs": "fas fa-list-alt", "menu setup": "fas fa-sitemap",
  "migration": "fas fa-exchange-alt", "billing": "fas fa-credit-card",
};
function getCleanIcon(icon?: string, itemName?: string): string {
  const fb = "far fa-dot-circle";
  if (!icon || !icon.trim()) {
    if (itemName) { const m = DD_NAME_ICON_MAP[itemName.toLowerCase().trim()]; if (m) return m; }
    return fb;
  }
  const lower = icon.toLowerCase();
  if (!DD_ARROW_PATTERNS.some((p) => lower.includes(p))) return icon;
  if (itemName) { const m = DD_NAME_ICON_MAP[itemName.toLowerCase().trim()]; if (m) return m; }
  return fb;
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

  const isActive = currentPath === item.route;

  return (
    <div className="dropdown-menu-item relative mb-0.5">
      <div className={level > 0 ? "pl-5 relative" : ""}>
        {/* Tree connector for child items */}
        {level > 0 && (
          <div className="absolute left-0 top-0 h-full w-1 z-1 pointer-events-none">
            <div className="absolute left-0 top-0 w-px h-full bg-slate-200 dark:bg-slate-700" />
            <div className="absolute left-0 top-[1.1rem] w-4 h-px bg-slate-200 dark:bg-slate-700" />
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
              className={`relative px-3 py-2 flex w-full rounded-xl transition-all duration-200 ${
                isActive
                  ? "bg-[#EFF6FF] dark:bg-[#025ADB]/10 text-[#025ADB] dark:text-blue-300"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50"
              }`}
            >
              {/* Active left indicator */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-3/5 bg-[#025ADB] dark:bg-blue-400 rounded-full" />
              )}
              <div className="flex items-center min-w-0 gap-3">
                <i
                  className={`text-[16px] ${getCleanIcon(item.icon, item.name)} ${
                    isActive
                      ? "text-[#025ADB] dark:text-blue-300"
                      : "opacity-70"
                  }`}
                />
                <span
                  className={`text-[14px] whitespace-nowrap overflow-hidden text-ellipsis ${
                    isActive ? "font-semibold" : "font-normal"
                  }`}
                >
                  {item.name}
                </span>
              </div>
            </div>
          </Link>
        ) : (
          /* Item with children — parent node */
          <div className="cursor-pointer" onClick={handleItemClick}>
            <div
              className={`px-3 py-2 flex justify-between w-full rounded-xl transition-all duration-200 ${
                item.is_open || isActive || hasActiveChildPath
                  ? "bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-white"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50"
              }`}
            >
              <div className="flex items-center min-w-0 gap-3">
                <i
                  className={`text-[16px] ${getCleanIcon(item.icon, item.name)} ${
                    isActive || hasActiveChildPath
                      ? "text-[#025ADB] dark:text-blue-300"
                      : "opacity-70"
                  }`}
                />
                <span className="text-[14px] font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                  {item.name}
                </span>
              </div>
              <span className="ml-auto pl-1 flex items-center">
                <i
                  className={`text-[10px] text-slate-400/60 transition-transform duration-200 ${
                    item.is_open ? "fas fa-chevron-down" : "fas fa-chevron-right"
                  }`}
                />
              </span>
            </div>
          </div>
        )}

        {/* Recursive children */}
        {item.child?.length && item.is_open ? (
          <div className="mt-0.5 ml-3 relative py-0.5">
            {item.child.length > 1 && (
              <div className="absolute left-0 top-0 w-px h-full bg-slate-200 dark:bg-slate-700" />
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
