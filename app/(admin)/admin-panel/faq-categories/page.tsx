"use client";

import { Suspense, useCallback, useState } from "react";
import { useAdminCrud } from "@/app/hooks/useAdminCrud";
import { optionsList as optionsListFn } from "@/app/helpers/globalFunctions";
import Pagination from "@/app/components/ui/Pagination";
import ConfirmModal from "@/app/components/ui/ConfirmModal";
import ResponseModal from "@/app/components/ui/ResponseModal";
import AddEdit from "@/app/components/admin-panel/faq-categories/AddEdit";

interface FaqCategory {
  id: number;
  title: string;
  slug: string;
  parent_id?: number;
  status: number;
  category?: { id: number; title: string };
}

function FaqCategoriesPageInner() {
  const optionsList = optionsListFn();
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
  } = useAdminCrud<FaqCategory>({
    apiEndpoint: "admin/faq-categories/all",
    apiBase: "admin/faq-categories",
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

  const [isOpenModal, setIsOpenModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("Create");
  const [editItem, setEditItem] = useState<FaqCategory | null>(null);
  const addNew = () => {
    setEditItem(null);
    setModalTitle("Create");
    setIsOpenModal(true);
  };
  const editHandler = (item: FaqCategory) => {
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
    handleAfterSave(item as FaqCategory, modalTitle === "Edit");
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

  const renderSkeleton = () => (
    <tbody>
      {Array.from({ length: 10 }).map((_, idx) => (
        <tr key={idx}>
          <td className="p-3">
            <div className="w-20 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </td>
          <td className="p-3">
            <div className="w-20 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </td>
          <td className="p-3">
            <div className="w-20 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </td>
          <td className="p-3">
            <div className="flex justify-center">
              <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          </td>
          <td className="p-3">
            <div className="flex justify-center gap-2">
              <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
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
          {isLoading ? (
            <div className="w-28 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
          ) : (
            permissions?.add && (
              <button
                onClick={addNew}
                className="px-4 py-2 bg-sky-500 text-white text-xs font-medium rounded-md hover:bg-sky-600 transition-colors whitespace-nowrap"
              >
                Create Category
              </button>
            )
          )}
        </div>
        <div className="pb-2 flex flex-col justify-between w-full">
          <div className="mt-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 py-2 px-4">
                FAQ Categories
              </h4>
            </div>
            <div className="p-4">
              <div className="custom_table overflow-auto border-b border-gray-200 dark:border-gray-700">
                <table className="table-auto w-full">
                  <thead className="sticky z-10 top-0 bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="text-left p-3" style={{ width: "10%" }}>
                        <span className="text-gray-800 dark:text-gray-200">
                          Title
                        </span>
                      </th>
                      <th className="text-left p-3" style={{ width: "10%" }}>
                        <span className="text-gray-800 dark:text-gray-200">
                          Parent Category
                        </span>
                      </th>
                      <th className="text-left p-3" style={{ width: "10%" }}>
                        <span className="text-gray-800 dark:text-gray-200">
                          Slug
                        </span>
                      </th>
                      <th className="text-center p-3" style={{ width: "10%" }}>
                        <span className="text-gray-800 dark:text-gray-200">
                          Status
                        </span>
                      </th>
                      {(permissions.edit ||
                        permissions.delete ||
                        isLoading) && (
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
                            {item.title}
                          </td>
                          <td className="text-gray-800 dark:text-gray-200 text-start p-3">
                            {item.category ? item.category.title : "None"}
                          </td>
                          <td className="text-gray-800 dark:text-gray-200 text-start p-3">
                            {item.slug}
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
                          {(permissions.edit || permissions.delete) && (
                            <td className="p-3">
                              {status.key === "trashed" &&
                              permissions.delete ? (
                                <div className="flex justify-center items-center gap-2">
                                  <i
                                    onClick={() => restoreAction(item.id)}
                                    className="fa-solid fa-trash-restore text-green-500 hover:text-green-800 cursor-pointer transition duration-150 ease-in-out"
                                  />
                                </div>
                              ) : (
                                <div className="flex justify-center items-center gap-2">
                                  {permissions.edit && (
                                    <i
                                      onClick={() => editHandler(item)}
                                      className="fa-solid fa-pen-to-square text-gray-800 dark:text-gray-200 hover:text-green-500 cursor-pointer transition duration-150 ease-in-out"
                                    />
                                  )}
                                  {permissions.delete && (
                                    <i
                                      onClick={() => openDeleteModal(item.id)}
                                      className="fa-solid fa-trash text-red-500 hover:text-red-800 cursor-pointer transition duration-150 ease-in-out"
                                    />
                                  )}
                                </div>
                              )}
                            </td>
                          )}
                        </tr>
                      ))}
                      {data.length === 0 && (
                        <tr>
                          <td
                            colSpan={5}
                            className="text-center py-8 text-gray-500 dark:text-gray-400"
                          >
                            No items found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  )}
                </table>
              </div>
            </div>
            <AddEdit
              isOpen={isOpenModal}
              item={editItem}
              modalTitle={modalTitle}
              onClose={cancelModal}
              onSave={receivedData}
              allData={data}
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

export default function FaqCategoriesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <FaqCategoriesPageInner />
    </Suspense>
  );
}
