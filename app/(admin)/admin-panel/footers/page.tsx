"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchAdmin } from "@/app/lib/fetchAdmin";
import {
  optionsList as optionsListFn,
  type OptionItem,
} from "@/app/helpers/globalFunctions";
import Pagination from "@/app/components/ui/Pagination";
import ConfirmModal from "@/app/components/ui/ConfirmModal";
import ResponseModal from "@/app/components/ui/ResponseModal";
import AddEdit from "@/app/components/admin-panel/footers/AddEdit";

interface GroupType {
  id: number;
  name: string;
}

interface FooterRow {
  id: number;
  title: string;
  link: string;
  url: string;
  status: number;
  group_type?: GroupType | null;
}

interface FooterGroup {
  id: number;
  title: string;
  items: FooterRow[];
}

function FootersPageInner() {
  const optionsList = optionsListFn();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState<FooterGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [paginationMeta, setPaginationMeta] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [status, setStatus] = useState<OptionItem>(
    optionsList[0] || { name: "All", value: "", key: "" },
  );

  // Accordion open states – keyed by group id
  const [openPanels, setOpenPanels] = useState<Record<number, boolean>>({});

  const togglePanel = useCallback((groupId: number) => {
    setOpenPanels((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  }, []);

  // --- Data loading with grouping ---
  const loadData = useCallback(
    async (page?: number) => {
      setIsLoading(true);
      setPermissions({});
      try {
        const currentPage = (page ?? Number(searchParams.get("page"))) || 1;
        const result = await fetchAdmin<{
          data: {
            data: FooterRow[];
            permissions: Record<string, boolean>;
            meta: Record<string, unknown>;
          };
        }>("admin/footers/all", {
          method: "POST",
          body: JSON.stringify({
            paginate: true,
            page: currentPage,
            length: 10,
            search,
            status: status.key === "status" ? status.value : "",
            trashed: status.key === "trashed" ? "only" : "",
          }),
        });

        const rows: FooterRow[] = result.data?.data || [];
        setPermissions(result.data?.permissions || {});
        setPaginationMeta(result.data?.meta || null);

        // Group by group_type (same as Nuxt)
        const grouped: Record<string, FooterGroup> = {};
        rows.forEach((r) => {
          const gId = r.group_type?.id ?? 0;
          const gName = r.group_type?.name ?? "Ungrouped";
          const key = `${gId}::${gName}`;
          if (!grouped[key])
            grouped[key] = { id: gId, title: gName, items: [] };
          grouped[key].items.push(r);
        });
        const groups = Object.values(grouped);
        setData(groups);

        // Auto-open first group on initial load
        if (Object.keys(openPanels).length === 0 && groups.length > 0) {
          setOpenPanels({ [groups[0].id]: true });
        }
      } catch (e: unknown) {
        const error = e as Error;
        console.log("Get Message", error.message);
      } finally {
        setIsLoading(false);
      }
    },
    [search, status, searchParams, openPanels],
  );

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status]);

  const resetPagination = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [searchParams, router]);

  // --- Search & Status handlers ---
  const onSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setSearchInput(val);
      setSearch(val);
    },
    [],
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
    [optionsList, resetPagination],
  );

  // --- Modal state ---
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("Create");
  const [editItem, setEditItem] = useState<FooterRow | null>(null);

  const addNew = () => {
    setEditItem(null);
    setModalTitle("Create");
    setIsOpenModal(true);
  };
  const editHandler = (item: FooterRow) => {
    setEditItem(item);
    setModalTitle("Edit");
    setIsOpenModal(true);
  };
  const cancelModal = () => {
    setEditItem(null);
    setIsOpenModal(false);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const receivedData = (d: any) => {
    setIsOpenModal(false);
    const gId = d.group_type?.id ?? 0;
    const gName = d.group_type?.name ?? "Ungrouped";

    setData((prev) => {
      const newData = prev.map((g) => ({
        ...g,
        items: [...g.items],
      }));

      if (modalTitle === "Create") {
        const groupIndex = newData.findIndex((g) => g.id === gId);
        if (groupIndex === -1) {
          newData.push({ id: gId, title: gName, items: [d] });
        } else {
          newData[groupIndex].items.push(d);
        }
      } else {
        // Edit: remove from old group, add to new
        const oldGroupIndex = newData.findIndex((g) =>
          g.items.some((i) => i.id === d.id),
        );
        if (oldGroupIndex !== -1) {
          newData[oldGroupIndex].items = newData[oldGroupIndex].items.filter(
            (i) => i.id !== d.id,
          );
          if (newData[oldGroupIndex].items.length === 0)
            newData.splice(oldGroupIndex, 1);
        }
        const groupIndex = newData.findIndex((g) => g.id === gId);
        if (groupIndex === -1) {
          newData.push({ id: gId, title: gName, items: [d] });
        } else {
          const idx = newData[groupIndex].items.findIndex((i) => i.id === d.id);
          if (idx === -1) newData[groupIndex].items.push(d);
          else newData[groupIndex].items[idx] = d;
        }
      }
      return newData;
    });

    // Open the panel the item was added/moved to
    setOpenPanels((prev) => ({ ...prev, [gId]: true }));
  };

  // --- Delete / Restore ---
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
    try {
      const result = await fetchAdmin<{ status: boolean; message?: string }>(
        `admin/footers/${deleteId}`,
        { method: "DELETE" },
      );
      if (result.status) {
        setResponseModal(result as unknown as Record<string, unknown>);
        setData((prev) =>
          prev
            .map((g) => ({
              ...g,
              items: g.items.filter((it) => it.id !== deleteId),
            }))
            .filter((g) => g.items.length > 0),
        );
      }
    } catch (e: unknown) {
      const error = e as {
        response?: { status?: number; _data?: Record<string, unknown> };
      };
      if (error.response?.status === 404 || error.response?.status === 409) {
        setResponseModal(error.response._data || {});
      }
    } finally {
      setIsOpenConModal(false);
    }
  };

  const restoreAction = async (id: number) => {
    setResponseModal({});
    try {
      const result = await fetchAdmin<{ status: boolean; message?: string }>(
        `admin/footers/restore/${id}`,
        { method: "POST" },
      );
      if (result.status) {
        setResponseModal(result as unknown as Record<string, unknown>);
        setData((prev) =>
          prev
            .map((g) => ({
              ...g,
              items: g.items.filter((it) => it.id !== id),
            }))
            .filter((g) => g.items.length > 0),
        );
      }
    } catch (e: unknown) {
      const error = e as {
        response?: { status?: number; _data?: Record<string, unknown> };
      };
      if (error.response?.status === 404 || error.response?.status === 409) {
        setResponseModal(error.response._data || {});
      }
    }
  };

  const paginationConfig = useMemo(
    () => ({
      data: paginationMeta as unknown as {
        current_page: number;
        last_page: number;
        from: number;
        to: number;
        total: number;
      },
      lang: "en",
      align: "center" as const,
      action: undefined as "ajax" | "url" | undefined,
    }),
    [paginationMeta],
  );

  // --- Skeleton ---
  const renderSkeleton = () => (
    <div className="space-y-3">
      {Array.from({ length: 2 }).map((_, gi) => (
        <div
          key={gi}
          className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden"
        >
          <div className="h-12 bg-gray-200 dark:bg-gray-700 animate-pulse" />
          <div className="p-4">
            <table className="table-auto w-full">
              <thead>
                <tr>
                  <th className="text-left p-3" style={{ width: "60%" }}>
                    <span className="text-gray-800 dark:text-gray-200">
                      Title
                    </span>
                  </th>
                  <th className="text-center p-3" style={{ width: "20%" }}>
                    <span className="text-gray-800 dark:text-gray-200">
                      Link
                    </span>
                  </th>
                  <th className="text-center p-3" style={{ width: "10%" }}>
                    <span className="text-gray-800 dark:text-gray-200">
                      Status
                    </span>
                  </th>
                  <th className="text-center p-3" style={{ width: "10%" }}>
                    <span className="text-gray-800 dark:text-gray-200">
                      Action
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 4 }).map((_, idx) => (
                  <tr key={idx}>
                    <td className="p-3">
                      <div className="w-24 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    </td>
                    <td className="p-3">
                      <div className="flex justify-center">
                        <div className="w-16 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      </div>
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
            </table>
          </div>
        </div>
      ))}
    </div>
  );

  // --- Render Accordion Table for a group ---
  const renderGroupTable = (group: FooterGroup) => (
    <table className="table-auto w-full">
      <thead className="sticky z-10 top-0">
        <tr>
          <th className="text-left p-3" style={{ width: "60%" }}>
            <div className="flex items-center justify-start gap-2 text-gray-800 dark:text-gray-200">
              <span>Title</span>
            </div>
          </th>
          <th className="text-center p-3" style={{ width: "20%" }}>
            <div className="flex items-center justify-center gap-2 text-gray-800 dark:text-gray-200">
              <span>Link</span>
            </div>
          </th>
          <th className="text-center p-3" style={{ width: "10%" }}>
            <div className="flex items-center justify-center gap-2 text-gray-800 dark:text-gray-200">
              <span>Status</span>
            </div>
          </th>
          {(permissions.edit || permissions.delete) && (
            <th className="text-center p-3" style={{ width: "10%" }}>
              <div className="flex items-center justify-center gap-2 text-gray-800 dark:text-gray-200">
                <span>Action</span>
              </div>
            </th>
          )}
        </tr>
      </thead>
      <tbody>
        {group.items.map((row) => (
          <tr
            key={row.id}
            className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
          >
            <td className="text-gray-800 dark:text-gray-200 p-3">
              {row.title}
            </td>
            <td className="text-gray-800 dark:text-gray-200 text-center p-3">
              <span className="text-xs break-all">{row.link || row.url}</span>
            </td>
            <td className="p-3">
              <div className="flex justify-center items-center">
                <span
                  className={
                    row.status === 1 ? "text-green-600" : "text-red-500"
                  }
                >
                  <i className="fa fa-power-off" aria-hidden="true" />
                </span>
              </div>
            </td>
            {(permissions.edit || permissions.delete) && (
              <td className="p-3">
                {status.key === "trashed" && permissions.delete ? (
                  <div className="flex justify-center items-center gap-2">
                    <i
                      onClick={() => restoreAction(row.id)}
                      className="fa-solid fa-trash-restore text-green-500 hover:text-green-800 cursor-pointer transition duration-150 ease-in-out"
                    />
                  </div>
                ) : (
                  <div className="flex justify-center items-center gap-2">
                    {permissions.edit && (
                      <i
                        onClick={() => editHandler(row)}
                        className="fa-solid fa-pen-to-square text-gray-800 dark:text-gray-200 hover:text-green-500 cursor-pointer transition duration-150 ease-in-out"
                      />
                    )}
                    {permissions.delete && (
                      <i
                        onClick={() => openDeleteModal(row.id)}
                        className="fa-solid fa-trash text-red-500 hover:text-red-800 cursor-pointer transition duration-150 ease-in-out"
                      />
                    )}
                  </div>
                )}
              </td>
            )}
          </tr>
        ))}
        {group.items.length === 0 && (
          <tr>
            <td
              colSpan={4}
              className="py-4 text-center text-sm text-gray-500 dark:text-gray-400"
            >
              No items in this group.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );

  return (
    <div className="h-full mx-auto max-w-7xl px-2 sm:px-6 lg:px-8 my-6">
      <div className="h-full w-full overflow-auto">
        {/* Search + Status + Create */}
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
                Create Footer
              </button>
            )
          )}
        </div>

        <div className="pb-2 flex flex-col justify-between w-full">
          <div className="mt-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 py-2 px-4">
                Footers
              </h4>
            </div>
            <div className="p-4">
              <div className="custom_table overflow-auto border-b border-gray-200 dark:border-gray-700">
                {isLoading ? (
                  renderSkeleton()
                ) : (
                  /* Accordion grouped by group_type */
                  <div className="border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg bg-white dark:bg-gray-800 overflow-hidden">
                    {data.map((group, gIndex) => (
                      <div
                        key={group.id ?? gIndex}
                        className={
                          gIndex > 0
                            ? "border-t border-gray-300 dark:border-gray-600"
                            : ""
                        }
                      >
                        {/* Accordion Header */}
                        <button
                          type="button"
                          onClick={() => togglePanel(group.id)}
                          className="w-full flex items-center justify-between px-5 py-3 bg-sky-500 hover:bg-sky-600 text-white font-semibold text-sm transition-colors cursor-pointer"
                        >
                          <span>{group.title}</span>
                          <i
                            className={`fas ${
                              openPanels[group.id]
                                ? "fa-chevron-up"
                                : "fa-chevron-down"
                            } transition-transform duration-200`}
                          />
                        </button>

                        {/* Accordion Content */}
                        {!!openPanels[group.id] && (
                          <div className="border-t border-gray-300 dark:border-gray-700 pt-4">
                            {renderGroupTable(group)}
                          </div>
                        )}
                      </div>
                    ))}
                    {data.length === 0 && (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        No items found.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <AddEdit
              isOpen={isOpenModal}
              item={editItem}
              modalTitle={modalTitle}
              onClose={cancelModal}
              onSave={receivedData}
            />
            {!isLoading && paginationMeta && (
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

export default function FootersPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <FootersPageInner />
    </Suspense>
  );
}
