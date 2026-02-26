"use client";

import React, { useState, useMemo, useCallback } from "react";

// Font Awesome 6 icon list (commonly used subset)
const FA_ICONS = [
  "fa-solid fa-house", "fa-solid fa-user", "fa-solid fa-users", "fa-solid fa-gear", "fa-solid fa-gears",
  "fa-solid fa-bars", "fa-solid fa-circle-info", "fa-solid fa-circle-check", "fa-solid fa-circle-xmark",
  "fa-solid fa-pen", "fa-solid fa-pen-to-square", "fa-solid fa-trash", "fa-solid fa-trash-can",
  "fa-solid fa-plus", "fa-solid fa-minus", "fa-solid fa-xmark", "fa-solid fa-check",
  "fa-solid fa-arrow-right", "fa-solid fa-arrow-left", "fa-solid fa-arrow-up", "fa-solid fa-arrow-down",
  "fa-solid fa-chevron-right", "fa-solid fa-chevron-left", "fa-solid fa-chevron-up", "fa-solid fa-chevron-down",
  "fa-solid fa-angles-right", "fa-solid fa-angles-left",
  "fa-solid fa-magnifying-glass", "fa-solid fa-bell", "fa-solid fa-envelope", "fa-solid fa-phone",
  "fa-solid fa-location-dot", "fa-solid fa-map", "fa-solid fa-globe", "fa-solid fa-earth-americas",
  "fa-solid fa-heart", "fa-solid fa-star", "fa-solid fa-bookmark", "fa-solid fa-flag",
  "fa-solid fa-folder", "fa-solid fa-folder-open", "fa-solid fa-file", "fa-solid fa-file-lines",
  "fa-solid fa-image", "fa-solid fa-camera", "fa-solid fa-video", "fa-solid fa-music",
  "fa-solid fa-calendar", "fa-solid fa-calendar-days", "fa-solid fa-clock",
  "fa-solid fa-tag", "fa-solid fa-tags", "fa-solid fa-link", "fa-solid fa-paperclip",
  "fa-solid fa-download", "fa-solid fa-upload", "fa-solid fa-cloud-arrow-up", "fa-solid fa-cloud-arrow-down",
  "fa-solid fa-share", "fa-solid fa-share-nodes", "fa-solid fa-comment", "fa-solid fa-comments",
  "fa-solid fa-cart-shopping", "fa-solid fa-bag-shopping", "fa-solid fa-credit-card",
  "fa-solid fa-money-bill", "fa-solid fa-wallet", "fa-solid fa-coins",
  "fa-solid fa-chart-bar", "fa-solid fa-chart-line", "fa-solid fa-chart-pie",
  "fa-solid fa-table", "fa-solid fa-table-cells", "fa-solid fa-list", "fa-solid fa-list-ul",
  "fa-solid fa-grip", "fa-solid fa-grip-vertical",
  "fa-solid fa-lock", "fa-solid fa-lock-open", "fa-solid fa-key", "fa-solid fa-shield-halved",
  "fa-solid fa-eye", "fa-solid fa-eye-slash",
  "fa-solid fa-database", "fa-solid fa-server", "fa-solid fa-code", "fa-solid fa-terminal",
  "fa-solid fa-bolt", "fa-solid fa-fire", "fa-solid fa-snowflake", "fa-solid fa-sun", "fa-solid fa-moon",
  "fa-solid fa-palette", "fa-solid fa-paint-roller", "fa-solid fa-brush",
  "fa-solid fa-puzzle-piece", "fa-solid fa-cube", "fa-solid fa-cubes",
  "fa-solid fa-trophy", "fa-solid fa-medal", "fa-solid fa-award",
  "fa-solid fa-graduation-cap", "fa-solid fa-book", "fa-solid fa-book-open",
  "fa-solid fa-newspaper", "fa-solid fa-blog", "fa-solid fa-rss",
  "fa-solid fa-circle-question", "fa-solid fa-circle-exclamation",
  "fa-solid fa-thumbs-up", "fa-solid fa-thumbs-down", "fa-solid fa-handshake",
  "fa-solid fa-building", "fa-solid fa-city", "fa-solid fa-industry",
  "fa-solid fa-car", "fa-solid fa-truck", "fa-solid fa-plane",
  "fa-solid fa-right-to-bracket", "fa-solid fa-right-from-bracket",
  "fa-solid fa-user-plus", "fa-solid fa-user-minus", "fa-solid fa-user-gear",
  "fa-solid fa-user-shield", "fa-solid fa-user-tag",
  "fa-solid fa-layer-group", "fa-solid fa-sitemap", "fa-solid fa-diagram-project",
  "fa-solid fa-sliders", "fa-solid fa-filter", "fa-solid fa-sort",
  "fa-solid fa-rotate", "fa-solid fa-rotate-right", "fa-solid fa-arrows-rotate",
  "fa-solid fa-expand", "fa-solid fa-compress", "fa-solid fa-maximize", "fa-solid fa-minimize",
  // Regular (outline) icons
  "far fa-bell", "far fa-bell-slash", "far fa-bookmark", "far fa-calendar",
  "far fa-calendar-minus", "far fa-calendar-plus", "far fa-calendar-times",
  "far fa-clock", "far fa-comment", "far fa-comments", "far fa-envelope",
  "far fa-eye", "far fa-eye-slash", "far fa-file", "far fa-folder",
  "far fa-heart", "far fa-image", "far fa-list-alt", "far fa-star",
  "far fa-user", "far fa-address-card", "far fa-arrow-alt-circle-down",
  // Legacy/compatibility icons
  "fas fa-upload", "fas fa-download", "fas fa-user-tag",
  "fa fa-angle", "fa fa-power-off", "fa fa-pencil", "fa fa-trash",
  "fa fa-undo", "fa fa-check", "fa fa-times", "fa fa-up-down-left-right",
];

interface IconPickerProps {
  isOpen: boolean;
  value: string;
  onClose: () => void;
  onChange: (icon: string) => void;
}

export default function IconPicker({ isOpen, value, onClose, onChange }: IconPickerProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredIcons = useMemo(() => {
    if (!searchTerm) return FA_ICONS;
    const term = searchTerm.toLowerCase();
    return FA_ICONS.filter((icon) => icon.toLowerCase().includes(term));
  }, [searchTerm]);

  const selectIcon = useCallback(
    (icon: string) => {
      onChange(icon);
      onClose();
    },
    [onChange, onClose],
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4 animate-modal-enter max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Pick an Icon</h4>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            <i className="fa-solid fa-xmark text-lg" />
          </button>
        </div>

        {/* Current selected + Search */}
        <div className="flex items-center gap-4 p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Current:</span>
            <i className={`${value} text-2xl text-orange-500`} />
            <code className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{value}</code>
          </div>
          <div className="flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search icons..."
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>

        {/* Icons Grid */}
        <div className="overflow-y-auto p-4 flex-1">
          <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 gap-2">
            {filteredIcons.map((icon) => (
              <button
                key={icon}
                onClick={() => selectIcon(icon)}
                title={icon}
                className={`flex items-center justify-center w-10 h-10 rounded-lg border transition-all duration-200 hover:scale-110 hover:shadow-md ${
                  value === icon
                    ? "border-sky-500 bg-sky-50 dark:bg-sky-900/30 text-sky-600"
                    : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/20"
                }`}
              >
                <i className={`${icon} text-base`} />
              </button>
            ))}
          </div>
          {filteredIcons.length === 0 && (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">No icons found matching &quot;{searchTerm}&quot;</p>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 text-center text-xs text-gray-500 dark:text-gray-400">
          {filteredIcons.length} icons available • You can also type a custom class name in the icon input field
        </div>
      </div>
    </div>
  );
}
