"use client";

import React, { useMemo } from "react";

interface PaginationData {
  current_page: number;
  last_page: number;
  from: number;
  to: number;
  total: number;
}

interface PaginationConfig {
  data: PaginationData;
  action?: "ajax" | "url";
}

interface PaginationProps {
  config: PaginationConfig;
  onLoadData: (page: number) => void;
}

/**
 * Pagination — Replaces Nuxt's Pagination.vue
 *
 * Usage:
 *   <Pagination config={{ data: paginationData, action: 'ajax' }} onLoadData={(page) => loadData(page)} />
 */
export default function Pagination({ config, onLoadData }: PaginationProps) {
  const { data } = config;
  const pgDisplayLimit = 7;
  const centerPgPos = 3;

  const currentPage = data.current_page || 1;

  const pageList = useMemo(() => {
    const pages: number[] = [];
    const cp = currentPage;
    const lp = data.last_page;

    if (lp <= pgDisplayLimit) {
      // Show all pages
      for (let i = 1; i <= lp; i++) pages.push(i);
    } else {
      const showFirstEllipsis = cp - centerPgPos > centerPgPos;
      const showLastEllipsis = cp + centerPgPos < lp - centerPgPos;

      if (showFirstEllipsis && showLastEllipsis) {
        // Center window
        for (let i = cp - centerPgPos; i <= cp + centerPgPos; i++)
          pages.push(i);
      } else if (showFirstEllipsis) {
        // End window
        for (let i = lp - pgDisplayLimit + 1; i <= lp; i++) pages.push(i);
      } else {
        // Start window
        for (let i = 1; i <= pgDisplayLimit; i++) pages.push(i);
      }
    }

    return {
      pages,
      showFirstEllipsis: pages[0] > 1,
      showLastEllipsis: pages[pages.length - 1] < lp,
    };
  }, [currentPage, data.last_page]);

  const loadContent = (pg: number) => {
    if (pg !== currentPage && pg >= 1 && pg <= data.last_page) {
      onLoadData(pg);
    }
  };

  const goPrevious = () => {
    if (currentPage > 1) loadContent(currentPage - 1);
  };

  const goNext = () => {
    if (currentPage < data.last_page) loadContent(currentPage + 1);
  };

  if (data.last_page <= 1) return null;

  return (
    <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 py-3">
      {/* Mobile buttons */}
      <div className="flex flex-1 justify-between sm:hidden">
        <button
          onClick={goPrevious}
          className="relative inline-flex items-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
        >
          Previous
        </button>
        <button
          onClick={goNext}
          className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
        >
          Next
        </button>
      </div>

      {/* Desktop pagination */}
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700 dark:text-gray-200">
            Showing <span className="font-medium">{data.from}</span> to{" "}
            <span className="font-medium">{data.to}</span> of{" "}
            <span className="font-medium">{data.total}</span> results
          </p>
        </div>
        <div>
          <nav
            className="isolate inline-flex -space-x-px rounded-md shadow-sm"
            aria-label="Pagination"
          >
            {/* Previous */}
            <button
              onClick={goPrevious}
              className="relative inline-flex items-center rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 focus:z-20 cursor-pointer"
            >
              <span className="sr-only">Previous</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {/* First page + ellipsis */}
            {pageList.showFirstEllipsis && (
              <>
                <button
                  onClick={() => loadContent(1)}
                  className={`relative z-10 inline-flex items-center px-4 py-2 text-sm font-medium focus:z-20 cursor-pointer ${
                    data.current_page === 1
                      ? "border border-sky-500 bg-sky-50 dark:bg-gray-700 text-sky-600"
                      : "border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-500"
                  }`}
                >
                  1
                </button>
                <span className="relative inline-flex items-center border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  ...
                </span>
              </>
            )}

            {/* Page numbers */}
            {pageList.pages.map((pg) => (
              <button
                key={pg}
                onClick={() => loadContent(pg)}
                aria-current={data.current_page === pg ? "page" : undefined}
                className={`relative z-10 inline-flex items-center px-4 py-2 text-sm font-medium focus:z-20 cursor-pointer ${
                  data.current_page === pg
                    ? "border border-sky-500 bg-sky-50 dark:bg-gray-700 text-sky-600"
                    : "border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                {pg}
              </button>
            ))}

            {/* Ellipsis + last page */}
            {pageList.showLastEllipsis && (
              <>
                <span className="relative inline-flex items-center border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  ...
                </span>
                <button
                  onClick={() => loadContent(data.last_page)}
                  className={`relative z-10 inline-flex items-center px-4 py-2 text-sm font-medium focus:z-20 cursor-pointer ${
                    data.current_page === data.last_page
                      ? "border border-sky-500 bg-sky-50 dark:bg-gray-700 text-sky-600"
                      : "border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-500"
                  }`}
                >
                  {data.last_page}
                </button>
              </>
            )}

            {/* Next */}
            <button
              onClick={goNext}
              className="relative inline-flex items-center rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 focus:z-20 cursor-pointer"
            >
              <span className="sr-only">Next</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}
