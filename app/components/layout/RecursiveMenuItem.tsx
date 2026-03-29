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

/**
 * The API sometimes returns generic arrow/chevron icons (e.g. "fas fa-angle-right")
 * for menu items instead of descriptive icons. This function detects those and
 * returns a meaningful fallback based on the item name so every item gets a
 * proper visual icon — matching the Stitch design quality.
 */
const ARROW_PATTERNS = [
  "fa-angle-right", "fa-angle-left", "fa-angle-down", "fa-angle-up",
  "fa-chevron-right", "fa-chevron-left", "fa-chevron-down", "fa-chevron-up",
  "fa-arrow-right", "fa-arrow-left", "fa-arrow-down", "fa-arrow-up",
  "fa-caret-right", "fa-caret-left", "fa-caret-down", "fa-caret-up",
  "fa-angles-right", "fa-angles-left",
];

/** Smart name-to-icon mapping for items with placeholder arrow icons */
const NAME_ICON_MAP: Record<string, string> = {
  // CMS & Content
  "portfolio": "fas fa-briefcase",
  "portfolios": "fas fa-briefcase",
  "portfolio categories": "fas fa-folder-open",
  "portfolio category": "fas fa-folder-open",
  "event": "fas fa-calendar-alt",
  "events": "fas fa-calendar-alt",
  "event categories": "fas fa-calendar-check",
  "event category": "fas fa-calendar-check",
  "social links": "fas fa-share-alt",
  "social link": "fas fa-share-alt",
  "features": "fas fa-star",
  "feature": "fas fa-star",
  "partners": "fas fa-handshake",
  "partner": "fas fa-handshake",
  "years": "fas fa-history",
  "year": "fas fa-history",
  "release notes": "fas fa-clipboard-list",
  "release note": "fas fa-clipboard-list",
  "news": "fas fa-newspaper",
  "news categories": "fas fa-tags",
  "news category": "fas fa-tags",
  "faq": "fas fa-question-circle",
  "faqs": "fas fa-question-circle",
  "faq categories": "fas fa-layer-group",
  "faq category": "fas fa-layer-group",
  "tutorials": "fas fa-book-open",
  "tutorial": "fas fa-book-open",
  "pages": "fas fa-file-alt",
  "page": "fas fa-file-alt",
  "comments": "fas fa-comments",
  "comment": "fas fa-comments",
  "blog": "fas fa-blog",
  "blogs": "fas fa-blog",
  "gallery": "fas fa-images",
  "media": "fas fa-photo-video",
  "testimonials": "fas fa-quote-right",
  "testimonial": "fas fa-quote-right",
  "slider": "fas fa-sliders-h",
  "sliders": "fas fa-sliders-h",
  "banner": "fas fa-image",
  "banners": "fas fa-image",
  // Layout
  "footers": "fas fa-shoe-prints",
  "footer": "fas fa-shoe-prints",
  "headers": "fas fa-heading",
  "header": "fas fa-heading",
  "menus": "fas fa-bars",
  "menu": "fas fa-bars",
  "navigation": "fas fa-compass",
  // Users & Auth
  "users": "fas fa-users",
  "user": "fas fa-user",
  "roles": "fas fa-user-shield",
  "role": "fas fa-user-shield",
  "permissions": "fas fa-key",
  "permission": "fas fa-key",
  "profile": "fas fa-id-card",
  // Settings & Config
  "settings": "fas fa-cog",
  "setting": "fas fa-cog",
  "configuration": "fas fa-tools",
  "general": "fas fa-sliders-h",
  "system": "fas fa-server",
  "email": "fas fa-envelope",
  "notifications": "fas fa-bell",
  "notification": "fas fa-bell",
  // SEO & Marketing
  "seo": "fas fa-search",
  "analytics": "fas fa-chart-line",
  "marketing": "fas fa-bullhorn",
  "campaign": "fas fa-megaphone",
  // E-commerce
  "products": "fas fa-box-open",
  "product": "fas fa-box-open",
  "orders": "fas fa-shopping-cart",
  "order": "fas fa-shopping-cart",
  "categories": "fas fa-th-large",
  "category": "fas fa-th-large",
  "tags": "fas fa-tags",
  "tag": "fas fa-tag",
  // Accessibility
  "accessibility": "fas fa-universal-access",
  "accessibility features": "fas fa-universal-access",
  // Dashboard
  "dashboard": "fas fa-tachometer-alt",
  "overview": "fas fa-chart-pie",
  "reports": "fas fa-chart-bar",
  "report": "fas fa-chart-bar",
  // Other common
  "logs": "fas fa-list-alt",
  "log": "fas fa-list-alt",
  "api": "fas fa-plug",
  "integrations": "fas fa-puzzle-piece",
  "integration": "fas fa-puzzle-piece",
  "templates": "fas fa-palette",
  "template": "fas fa-palette",
  "contacts": "fas fa-address-book",
  "contact": "fas fa-address-book",
  "messages": "fas fa-envelope-open-text",
  "message": "fas fa-envelope-open-text",
  "backup": "fas fa-database",
  "backups": "fas fa-database",
  "import": "fas fa-file-import",
  "export": "fas fa-file-export",
  "theme": "fas fa-paint-brush",
  "themes": "fas fa-paint-brush",
  "languages": "fas fa-language",
  "language": "fas fa-language",
  "translations": "fas fa-globe",
  "translation": "fas fa-globe",
  "menu setup": "fas fa-sitemap",
  "migration": "fas fa-exchange-alt",
  "billing": "fas fa-credit-card",
  "subscription": "fas fa-crown",
  "subscriptions": "fas fa-crown",
  "documents": "fas fa-file-pdf",
  "document": "fas fa-file-pdf",
  "files": "fas fa-folder",
  "file": "fas fa-folder",
  "maps": "fas fa-map-marked-alt",
  "location": "fas fa-map-marker-alt",
  "locations": "fas fa-map-marker-alt",
  "teams": "fas fa-user-friends",
  "team": "fas fa-user-friends",
  "members": "fas fa-user-friends",
  "member": "fas fa-user-friends",
  "staff": "fas fa-id-badge",
  "about": "fas fa-info-circle",
  "help": "fas fa-life-ring",
  "support": "fas fa-headset",
};

function getCleanIcon(icon?: string, itemName?: string): string {
  const defaultFallback = "far fa-dot-circle";

  if (!icon || !icon.trim()) {
    // No icon at all — try name mapping
    if (itemName) {
      const mapped = NAME_ICON_MAP[itemName.toLowerCase().trim()];
      if (mapped) return mapped;
    }
    return defaultFallback;
  }

  const lowerIcon = icon.toLowerCase();
  const isArrowIcon = ARROW_PATTERNS.some((p) => lowerIcon.includes(p));

  if (!isArrowIcon) return icon; // Valid descriptive icon from API

  // Arrow icon detected — try smart name-based fallback
  if (itemName) {
    const mapped = NAME_ICON_MAP[itemName.toLowerCase().trim()];
    if (mapped) return mapped;
  }

  return defaultFallback;
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

  // Check deep active child (recursive)
  const hasDeepActiveChild = React.useMemo(() => {
    const checkDeep = (children?: MenuItem[]): boolean => {
      if (!children?.length) return false;
      return children.some(
        (c) => currentPath === c.route || checkDeep(c.child),
      );
    };
    return checkDeep(item.child);
  }, [item.child, currentPath]);

  // ═══════════════════════════════════════════════════════
  // LEVEL 0 — Top-level items (with icon circles)
  // ═══════════════════════════════════════════════════════
  if (level === 0) {
    return (
      <div className="mb-0.5" ref={menuRef}>
        {/* ─── TOP-LEVEL LEAF (Dashboard, etc.) ─── */}
        {isLeafItem && (
          <Link
            href={item.route === "#" ? "" : item.route}
            className={`group flex items-center gap-4 cursor-pointer transition-all duration-200
              ${isExpanded ? "px-4 py-2.5 rounded-xl" : "px-0 py-2 justify-center"}
              ${isActive
                ? "text-[#025ADB] dark:text-blue-300"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }
            `}
          >
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full shrink-0 transition-colors duration-200
                ${isActive
                  ? "bg-[#EFF6FF] dark:bg-[#025ADB]/20"
                  : "bg-slate-100 dark:bg-slate-800 group-hover:bg-[#025ADB]/5 dark:group-hover:bg-slate-700"
                }`}
            >
              <i className={`text-[18px] ${getCleanIcon(item.icon, item.name)} ${
                isActive ? "text-[#025ADB] dark:text-blue-300" : ""
              }`} />
            </div>
            {isExpanded && (
              <span className={`text-[15px] font-medium transition-colors duration-200
                ${isActive
                  ? "text-[#025ADB] dark:text-blue-300 font-semibold"
                  : "text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white"
                }`}
              >
                {item.name}
              </span>
            )}
          </Link>
        )}

        {/* ─── TOP-LEVEL PARENT (CMS, Portfolio, Settings, etc.) ─── */}
        {!isLeafItem && (
          <div
            className={`group w-full flex items-center justify-between cursor-pointer transition-all duration-200
              ${isExpanded ? "px-4 py-2.5 rounded-xl" : "px-0 py-2 justify-center"}
              ${isActive || hasActiveChild || hasDeepActiveChild
                ? "text-slate-900 dark:text-white"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }
            `}
            onClick={() => handleClick(item)}
          >
            <div className="flex items-center gap-4">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full shrink-0 transition-colors duration-200
                  ${isActive || hasActiveChild || hasDeepActiveChild
                    ? "bg-[#EFF6FF] dark:bg-[#025ADB]/20"
                    : "bg-slate-100 dark:bg-slate-800 group-hover:bg-[#025ADB]/5 dark:group-hover:bg-slate-700"
                  }`}
              >
                <i className={`text-[18px] ${getCleanIcon(item.icon, item.name)} ${
                  isActive || hasActiveChild || hasDeepActiveChild
                    ? "text-[#025ADB] dark:text-blue-300"
                    : ""
                }`} />
              </div>
              {isExpanded && (
                <span className={`text-[15px] font-medium transition-colors duration-200
                  ${isActive || hasActiveChild || hasDeepActiveChild
                    ? "text-slate-900 dark:text-white"
                    : "text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white"
                  }`}
                >
                  {item.name}
                </span>
              )}
            </div>
            {isExpanded && hasChildren && (
              <i className={`fas text-[10px] opacity-40 transition-transform duration-200
                ${item.is_open ? "fa-chevron-down" : "fa-chevron-right"}`}
              />
            )}
          </div>
        )}

        {/* ─── CHILDREN TREE (expanded sidebar) ─── */}
        {hasChildren && !!item.is_open && isExpanded && (
          <div
            className="ml-[24px] relative pl-6 space-y-0.5 py-1"
            style={{ animation: "slideDown 0.25s ease-out" }}
          >
            {/* Tree connector line */}
            <div className="absolute left-0 top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-700" />

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

        {/* ─── COLLAPSED FLYOUT DROPDOWN ─── */}
        {hasChildren && !isExpanded && !!item.is_open && !localIsMobile && (
          <div
            ref={dropdownRef}
            className="fixed left-[70px] min-w-[240px] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50 z-9999 p-2.5 overflow-y-auto backdrop-blur-xl"
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

  // ═══════════════════════════════════════════════════════
  // LEVEL 1+ — Child items (Stitch style: icon + text, NO circle)
  // Like in Stitch: clean small icon + text for every child
  // ═══════════════════════════════════════════════════════
  return (
    <div className="mb-0.5" ref={menuRef}>
      {/* ─── CHILD LEAF ITEM (no children) — icon + text ─── */}
      {isLeafItem && (
        <Link
          href={item.route === "#" ? "" : item.route}
          className={`relative group flex items-center gap-3 py-2 px-3 rounded-xl cursor-pointer transition-all duration-200
            ${isActive
              ? "bg-[#EFF6FF] dark:bg-[#025ADB]/10 text-[#025ADB] dark:text-blue-300"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/30"
            }
          `}
        >
          {/* Active left blue pill indicator (like Stitch) */}
          {isActive && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-3/5 bg-[#025ADB] dark:bg-blue-400 rounded-full" />
          )}
          {/* Descriptive icon — NOT an arrow! */}
          <i className={`text-[18px] ${getCleanIcon(item.icon, item.name)} ${
            isActive
              ? "text-[#025ADB] dark:text-blue-300"
              : "opacity-60 group-hover:opacity-100"
          }`} />
          {isExpanded && (
            <span className={`text-[14px] transition-colors duration-200
              ${isActive
                ? "font-semibold text-[#025ADB] dark:text-blue-300"
                : "font-normal"
              }`}
            >
              {item.name}
            </span>
          )}
        </Link>
      )}

      {/* ─── CHILD PARENT ITEM (has sub-children) — icon + text + chevron ─── */}
      {!isLeafItem && (
        <div
          className={`group flex items-center justify-between py-2 px-3 rounded-xl cursor-pointer transition-all duration-200
            ${isActive || hasActiveChild || hasDeepActiveChild
              ? "text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-700/30"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/30"
            }
          `}
          onClick={() => handleClick(item)}
        >
          <div className="flex items-center gap-3">
            {/* Descriptive icon — NOT an arrow! */}
            <i className={`text-[18px] ${getCleanIcon(item.icon, item.name)} ${
              isActive || hasActiveChild || hasDeepActiveChild
                ? "text-[#025ADB] dark:text-blue-300"
                : "opacity-60 group-hover:opacity-100"
            }`} />
            {isExpanded && (
              <span className={`text-[14px] font-medium transition-colors duration-200
                ${isActive || hasActiveChild || hasDeepActiveChild
                  ? "text-slate-900 dark:text-white"
                  : ""
                }`}
              >
                {item.name}
              </span>
            )}
          </div>
          {isExpanded && hasChildren && (
            <i className={`fas text-[9px] opacity-40 transition-transform duration-200
              ${item.is_open ? "fa-chevron-down" : "fa-chevron-right"}`}
            />
          )}
        </div>
      )}

      {/* ─── NESTED CHILDREN TREE ─── */}
      {hasChildren && !!item.is_open && isExpanded && (
        <div
          className="ml-4 relative pl-5 space-y-0.5 py-0.5"
          style={{ animation: "slideDown 0.25s ease-out" }}
        >
          <div className="absolute left-0 top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-700" />

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

      {/* ─── COLLAPSED FLYOUT (for nested parents) ─── */}
      {hasChildren && !isExpanded && !!item.is_open && !localIsMobile && (
        <div
          ref={dropdownRef}
          className="fixed left-[70px] min-w-[240px] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50 z-9999 p-2.5 overflow-y-auto backdrop-blur-xl"
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
