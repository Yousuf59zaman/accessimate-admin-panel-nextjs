"use client";

import React from "react";

interface DataTableSkeletonProps {
  /** Number of skeleton rows to display */
  rows?: number;
  /** Number of columns */
  columns?: number;
}

/**
 * DataTableSkeleton — Replaces inline v-for skeleton loading in CRUD pages
 *
 * Usage:
 *   <DataTableSkeleton rows={10} columns={5} />
 */
export default function DataTableSkeleton({
  rows = 10,
  columns = 5,
}: DataTableSkeletonProps) {
  return (
    <div className="w-full animate-pulse">
      {/* Header row */}
      <div className="flex gap-4 px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        {Array.from({ length: columns }).map((_, colIndex) => (
          <div
            key={`header-${colIndex}`}
            className="flex-1 h-4 bg-gray-300 dark:bg-gray-600 rounded"
          />
        ))}
      </div>

      {/* Data rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={`row-${rowIndex}`}
          className="flex gap-4 px-4 py-3 border-b border-gray-100 dark:border-gray-700"
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div
              key={`cell-${rowIndex}-${colIndex}`}
              className={`flex-1 h-4 rounded ${
                colIndex === 0
                  ? "bg-gray-200 dark:bg-gray-700 w-8 max-w-8 flex-none"
                  : "bg-gray-200 dark:bg-gray-700"
              }`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
