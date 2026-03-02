"use client";

import { Suspense, useCallback, useState } from "react";
import { useCrudPage } from "@/app/hooks/useCrudPage";
import { optionsListAcIn, viewFormatDate } from "@/app/helpers/globalFunctions";
import Pagination from "@/app/components/ui/Pagination";
import ResponseModal from "@/app/components/ui/ResponseModal";

interface Subscribe {
  id: number;
  email: string;
  subscribed_at: string | null;
  expires_at: string | null;
  is_active: number;
  status: number;
}

function SubscribesPageInner() {
  const optionsList = optionsListAcIn();
  const {
    data,
    isLoading,
    paginationMeta,
    search,
    setSearch,
    status,
    setStatus,
    loadData,
    resetPagination,
  } = useCrudPage<Subscribe>({
    apiEndpoint: "admin/subscribes/all",
    apiBase: "admin/subscribes",
    pageSize: 10,
  });

  const [searchInput, setSearchInput] = useState(search);
  const onSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setSearchInput(val);
      setSearch(val);
    },
    [setSearch],
  );
  const onStatusChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const selected = optionsList.find(
        (o) => `${o.key}-${o.value}` === e.target.value,
      );
      if (selected) {
        setStatus(selected);
        resetPagination();
      }
    },
    [optionsList, setStatus, resetPagination],
  );

  const [responseModal, setResponseModal] = useState<Record<string, unknown>>(
    {},
  );

  const paginationConfig = {
    data: paginationMeta,
    lang: "en",
    align: "center" as const,
    action: undefined as "ajax" | "url" | undefined,
  };

  const renderSkeleton = () => (
    <tbody>
      {Array.from({ length: 10 }).map((_, idx) => (
        <tr key={idx}>
          <td className="text-gray-800 dark:text-gray-200 text-start p-3">
            <div className="w-32 h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </td>
          <td className="p-3">
            <div className="flex justify-center items-center">
              <div className="w-24 h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          </td>
          <td className="p-3">
            <div className="flex justify-center items-center">
              <div className="w-24 h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          </td>
          <td className="p-3">
            <div className="flex justify-center items-center">
              <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          </td>
        </tr>
      ))}
    </tbody>
  );

  return (
    <div className="h-full mx-auto max-w-7xl px-2 sm:px-6 lg:px-8 my-6">
      <div className="h-full w-full overflow-auto">
        <div className="w-full flex flex-wrap md:flex-nowrap justify-between items-center gap-4 mb-4">
          <div className="w-full md:w-auto flex flex-wrap gap-4">
            <div className="flex flex-wrap md:flex-nowrap items-center gap-4 w-full md:w-auto">
              <div className="flex items-center gap-2 w-full md:w-auto">
                <label
                  htmlFor="search"
                  className="text-gray-800 dark:text-gray-200"
                >
                  Search
                </label>
                <input
                  id="search"
                  type="text"
                  value={searchInput}
                  onChange={onSearchChange}
                  onKeyDown={(e) => e.key === "Enter" && loadData()}
                  className="w-full md:w-auto border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Search..."
                />
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto">
                <label
                  htmlFor="status"
                  className="text-gray-800 dark:text-gray-200"
                >
                  Status
                </label>
                <select
                  id="status"
                  value={`${status.key}-${status.value}`}
                  onChange={onStatusChange}
                  className="w-full md:w-auto border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  {optionsList.map((opt) => (
                    <option
                      key={`${opt.key}-${opt.value}`}
                      value={`${opt.key}-${opt.value}`}
                    >
                      {opt.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="pb-2 flex flex-col justify-between w-full">
          <div className="mt-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 py-2 px-4">
                Subscribers
              </h4>
            </div>
            <div className="p-4">
              <div className="custom_table overflow-auto border-b border-gray-200 dark:border-gray-700">
                <table className="table-auto w-full">
                  <thead className="sticky z-10 top-0 bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="text-left p-3" style={{ width: "50%" }}>
                        <span className="text-gray-800 dark:text-gray-200">
                          Title
                        </span>
                      </th>
                      <th className="text-center p-3" style={{ width: "20%" }}>
                        <span className="text-gray-800 dark:text-gray-200">
                          Subscribed
                        </span>
                      </th>
                      <th className="text-center p-3" style={{ width: "20%" }}>
                        <span className="text-gray-800 dark:text-gray-200">
                          Expires
                        </span>
                      </th>
                      <th className="text-center p-3" style={{ width: "10%" }}>
                        <span className="text-gray-800 dark:text-gray-200">
                          Status
                        </span>
                      </th>
                    </tr>
                  </thead>
                  {isLoading ? (
                    renderSkeleton()
                  ) : (
                    <tbody>
                      {data.map((item) => (
                        <tr
                          key={item.id}
                          className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                        >
                          <td className="text-gray-800 dark:text-gray-200 text-start p-3">
                            <div className="flex justify-start gap-2">
                              <span className="text-sm">{item?.email}</span>
                            </div>
                          </td>
                          <td className="text-gray-800 dark:text-gray-200 text-start p-3">
                            <div className="flex justify-center gap-2">
                              <span className="text-sm">
                                {item.subscribed_at
                                  ? viewFormatDate(item.subscribed_at)
                                  : "-"}
                              </span>
                            </div>
                          </td>
                          <td className="text-gray-800 dark:text-gray-200 text-start p-3">
                            <div className="flex justify-center gap-2">
                              <span className="text-sm">
                                {item.expires_at
                                  ? viewFormatDate(item.expires_at)
                                  : "-"}
                              </span>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex justify-center items-center">
                              <span
                                className={
                                  item.is_active === 1
                                    ? "text-green-600"
                                    : "text-red-500"
                                }
                              >
                                <i
                                  className="fa fa-power-off"
                                  aria-hidden="true"
                                />
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {data.length === 0 && (
                        <tr>
                          <td
                            colSpan={4}
                            className="text-center py-8 text-gray-500 dark:text-gray-400"
                          >
                            No subscribers found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  )}
                </table>
              </div>
            </div>
            {!isLoading && (
              <div className="px-4">
                <Pagination
                  config={paginationConfig}
                  onLoadData={(page) => loadData(page)}
                />
              </div>
            )}
            <ResponseModal
              data={
                responseModal as {
                  status?: boolean;
                  message?: string;
                  error?: Record<string, string[]>;
                }
              }
              onClose={() => setResponseModal({})}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SubscribesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <SubscribesPageInner />
    </Suspense>
  );
}
