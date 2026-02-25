"use client";

import React, { useState, useEffect, useCallback } from "react";

interface OptionItem {
  name: string;
  value: string;
  key: string;
}

interface SearchFilterProps {
  /** List of filter options (e.g. from optionsList()) */
  options: OptionItem[];
  /** Callback fired when search/filter changes */
  onFilter: (params: {
    search: string;
    status: string;
    trashed: string;
  }) => void;
  /** Debounce delay in ms (default: 400) */
  debounceMs?: number;
  /** Placeholder text for search input */
  placeholder?: string;
}

/**
 * SearchFilter — Extracted from inline CRUD patterns
 *
 * Usage:
 *   <SearchFilter
 *     options={optionsList()}
 *     onFilter={({ search, status, trashed }) => loadData({ search, status, trashed })}
 *   />
 */
export default function SearchFilter({
  options,
  onFilter,
  debounceMs = 400,
  placeholder = "Search...",
}: SearchFilterProps) {
  const [search, setSearch] = useState("");
  const [selectedOption, setSelectedOption] = useState<OptionItem>(
    options[0] || { name: "All", value: "", key: "" },
  );

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      onFilter({
        search,
        status: selectedOption.key === "status" ? selectedOption.value : "",
        trashed: selectedOption.key === "trashed" ? selectedOption.value : "",
      });
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [search, selectedOption, debounceMs, onFilter]);

  const handleOptionChange = useCallback(
    (optionName: string) => {
      const found = options.find((o) => o.name === optionName);
      if (found) {
        setSelectedOption(found);
      }
    },
    [options],
  );

  return (
    <div className="flex flex-col sm:flex-row items-center gap-3 mb-4">
      {/* Search input */}
      <div className="relative w-full sm:w-auto sm:flex-1">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <i className="fas fa-search text-gray-400 text-sm" />
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={placeholder}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm"
        />
      </div>

      {/* Filter select */}
      <select
        value={selectedOption.name}
        onChange={(e) => handleOptionChange(e.target.value)}
        className="block w-full sm:w-auto px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm cursor-pointer"
      >
        {options.map((option) => (
          <option key={option.name} value={option.name}>
            {option.name}
          </option>
        ))}
      </select>
    </div>
  );
}
