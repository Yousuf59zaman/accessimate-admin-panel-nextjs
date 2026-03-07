"use client";

import { Suspense, useCallback, useState, useEffect, useMemo } from "react";
import { useAdminCrud } from "@/app/hooks/useAdminCrud";
import { optionsList as optionsListFn } from "@/app/helpers/globalFunctions";
import Pagination from "@/app/components/ui/Pagination";
import ConfirmModal from "@/app/components/ui/ConfirmModal";
import ResponseModal from "@/app/components/ui/ResponseModal";
import AddEdit from "@/app/components/admin-panel/portfolios/AddEdit";
import { fetchAdmin } from "@/app/lib/fetchAdmin";

interface PortfolioCategory {
  id: number;
  title: string;
}
interface PortfolioItem {
  id: number;
  title: string;
  slug: string;
  status: number;
  photo?: string;
  category?: PortfolioCategory;
  cat_id?: number | string;
  description?: string;
  client_name?: string;
  project_url?: string;
  completion_date?: string;
  technologies?: string;
}
interface GroupedPortfolio {
  id: number | null;
  title: string;
  items: PortfolioItem[];
}

function PortfoliosPageInner() {
  const options = optionsListFn();
  const {
    data,
    isLoading,
    permissions,
    paginationMeta,
    search,
    setSearch,
    status,
    setStatus,
    loadData,
    handleDelete,
    handleRestore,
    handleAfterSave,
    resetPagination,
  } = useAdminCrud<PortfolioItem>({
    apiEndpoint: "admin/portfolios/all",
    apiBase: "admin/portfolios",
    pageSize: 10,
  });

  // Group data by category (derived state via useMemo)
  const groupedData = useMemo<GroupedPortfolio[]>(() => {
    const grouped: Record<string, GroupedPortfolio> = {};
    data.forEach((item) => {
      const categoryId = item.category ? item.category.id : null;
      const categoryName = item.category
        ? item.category.title
        : "Uncategorized";
      const categoryKey = categoryId
        ? `${categoryId}-${categoryName}`
        : `null-${categoryName}`;
      if (!grouped[categoryKey]) {
        grouped[categoryKey] = {
          id: categoryId,
          title: categoryName,
          items: [],
        };
      }
      grouped[categoryKey].items.push(item);
    });
    return Object.values(grouped);
  }, [data]);

  // Categories for AddEdit dropdown
  const [categories, setCategories] = useState<PortfolioCategory[]>([]);
  useEffect(() => {
    fetchAdmin<{ data: { data: PortfolioCategory[] } }>(
      "admin/portfolio-categories",
      { method: "GET" },
    )
      .then((res) => {
        if (res?.data?.data) setCategories(res.data.data);
      })
      .catch((err) => console.error("Error fetching categories:", err));
  }, []);

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
      const selected = options.find(
        (o) => `${o.key}-${o.value}` === e.target.value,
      );
      if (selected) {
        setStatus(selected);
        resetPagination();
      }
    },
    [options, setStatus, resetPagination],
  );

  const [isOpenModal, setIsOpenModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("Create");
  const [editItem, setEditItem] = useState<PortfolioItem | null>(null);
  const addNew = () => {
    setEditItem(null);
    setModalTitle("Create");
    setIsOpenModal(true);
  };
  const editHandler = (item: PortfolioItem) => {
    setEditItem(item);
    setModalTitle("Edit");
    setIsOpenModal(true);
  };
  const cancelModal = () => {
    setEditItem(null);
    setIsOpenModal(false);
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const receivedData = (item: any) => {
    handleAfterSave(item as PortfolioItem, modalTitle === "Edit");
    setIsOpenModal(false);
  };

  const [isOpenConModal, setIsOpenConModal] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [responseModal, setResponseModal] = useState<Record<string, unknown>>(
    {},
  );
  const openDeleteModal = (id: number) => {
    setDeleteId(id);
    setIsOpenConModal(true);
  };
  const deleteHandler = async () => {
    if (deleteId === null) return;
    setResponseModal({});
    const { response } = await handleDelete(deleteId);
    setResponseModal(response);
    setIsOpenConModal(false);
  };
  const restoreAction = async (id: number) => {
    setResponseModal({});
    const { response } = await handleRestore(id);
    setResponseModal(response);
  };
  const paginationConfig = {
    data: paginationMeta,
    lang: "en",
    align: "center" as const,
    action: undefined as "ajax" | "url" | undefined,
  };

  // Accordion state
  const [expandedPanels, setExpandedPanels] = useState<number[]>([0]);
  const togglePanel = (idx: number) => {
    setExpandedPanels((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx],
    );
  };

  // Skeleton for loading with accordion shape
  const renderSkeleton = () => (
    <div className="border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg bg-white dark:bg-gray-800">
      {Array.from({ length: 5 }).map((_, idx) => (
        <div
          key={idx}
          className="border-b last:border-b-0 border-gray-200 dark:border-gray-700 p-4"
        >
          <div className="w-20 h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
      ))}
    </div>
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
                  {options.map((opt) => (
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
          {isLoading ? (
            <div className="w-28 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
          ) : (
            permissions?.add && (
              <button
                onClick={addNew}
                className="px-4 py-2 bg-sky-500 text-white text-xs font-medium rounded-md hover:bg-sky-600 transition-colors whitespace-nowrap"
              >
                Create Portfolios
              </button>
            )
          )}
        </div>
        <div className="pb-2 flex flex-col justify-between w-full">
          <div className="mt-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 py-2 px-4">
                Portfolios
              </h4>
            </div>
            <div className="p-4">
              <div className="custom_table overflow-auto border-b border-gray-200 dark:border-gray-700">
                {isLoading ? (
                  renderSkeleton()
                ) : (
                  <div className="border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg bg-white dark:bg-gray-800">
                    {groupedData.length === 0 && (
                      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                        No portfolios found.
                      </div>
                    )}
                    {groupedData.map((group, groupIdx) => {
                      const isExpanded = expandedPanels.includes(groupIdx);
                      return (
                        <div
                          key={group.id ?? `uncat-${groupIdx}`}
                          className="border-b last:border-b-0 border-gray-200 dark:border-gray-700"
                        >
                          {/* Accordion Header */}
                          <button
                            onClick={() => togglePanel(groupIdx)}
                            className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                          >
                            <span className="font-semibold text-gray-800 dark:text-gray-200">
                              {group.title}
                            </span>
                            <i
                              className={`fa-solid ${isExpanded ? "fa-chevron-up" : "fa-chevron-down"} text-gray-500`}
                            />
                          </button>
                          {/* Accordion Content */}
                          {isExpanded && (
                            <div className="border-t border-gray-300 dark:border-gray-600 pt-4">
                              <div className="custom_table overflow-auto border-b border-gray-200 dark:border-gray-700">
                                <table className="table-auto w-full">
                                  <thead className="sticky z-10 top-0 bg-gray-50 dark:bg-gray-900">
                                    <tr>
                                      <th
                                        className="text-left p-3"
                                        style={{ width: "80%" }}
                                      >
                                        <span className="text-gray-800 dark:text-gray-200">
                                          Title
                                        </span>
                                      </th>
                                      <th
                                        className="text-center p-3"
                                        style={{ width: "5%" }}
                                      >
                                        <span className="text-gray-800 dark:text-gray-200">
                                          Status
                                        </span>
                                      </th>
                                      {(permissions.edit ||
                                        permissions.delete) && (
                                        <th
                                          className="text-center p-3"
                                          style={{ width: "10%" }}
                                        >
                                          <span className="text-gray-800 dark:text-gray-200">
                                            Action
                                          </span>
                                        </th>
                                      )}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {group.items.map((item) => (
                                      <tr
                                        key={item.id}
                                        className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                                      >
                                        <td className="text-gray-800 dark:text-gray-200 text-start p-3">
                                          <div className="flex items-center gap-2">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                              src={
                                                item.photo ||
                                                "/svg/not-found-img.svg"
                                              }
                                              alt={item.title}
                                              className="w-24 h-24 object-cover rounded-md"
                                            />
                                            <div className="flex flex-col gap-1">
                                              <span className="text-sm font-semibold">
                                                {item.title}
                                              </span>
                                            </div>
                                          </div>
                                        </td>
                                        <td className="p-3">
                                          <div className="flex justify-center items-center">
                                            <span
                                              className={
                                                item.status === 1
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
                                        {(permissions.edit ||
                                          permissions.delete) && (
                                          <td className="p-3">
                                            {status.key === "trashed" &&
                                            permissions.delete ? (
                                              <div className="flex justify-center items-center gap-2">
                                                <i
                                                  onClick={() =>
                                                    restoreAction(item.id)
                                                  }
                                                  className="fa-solid fa-trash-restore text-green-500 hover:text-green-800 cursor-pointer transition duration-150 ease-in-out"
                                                />
                                              </div>
                                            ) : (
                                              <div className="flex justify-center items-center gap-2">
                                                {permissions.edit && (
                                                  <i
                                                    onClick={() =>
                                                      editHandler(item)
                                                    }
                                                    className="fa-solid fa-pen-to-square text-gray-800 dark:text-gray-200 hover:text-green-500 cursor-pointer transition duration-150 ease-in-out"
                                                  />
                                                )}
                                                {permissions.delete && (
                                                  <i
                                                    onClick={() =>
                                                      openDeleteModal(item.id)
                                                    }
                                                    className="fa-solid fa-trash text-red-500 hover:text-red-800 cursor-pointer transition duration-150 ease-in-out"
                                                  />
                                                )}
                                              </div>
                                            )}
                                          </td>
                                        )}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            <AddEdit
              isOpen={isOpenModal}
              item={editItem}
              modalTitle={modalTitle}
              categories={categories}
              onClose={cancelModal}
              onSave={receivedData}
            />
            {!isLoading && (
              <div className="px-4">
                <Pagination
                  config={paginationConfig}
                  onLoadData={(page) => loadData(page)}
                />
              </div>
            )}
            <ConfirmModal
              isOpen={isOpenConModal}
              onConfirm={deleteHandler}
              onClose={() => setIsOpenConModal(false)}
            />
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

export default function PortfoliosPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <PortfoliosPageInner />
    </Suspense>
  );
}
