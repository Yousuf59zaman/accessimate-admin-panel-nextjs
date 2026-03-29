"use client";

import { Suspense, useCallback, useState, useEffect, useMemo } from "react";
import { useAdminCrud } from "@/app/hooks/useAdminCrud";
import { optionsList as optionsListFn } from "@/app/helpers/globalFunctions";
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
  status: number | boolean;
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

interface PaginationData {
  current_page: number;
  last_page: number;
  from: number;
  to: number;
  total: number;
}

const portfolioAccentThemes = [
  {
    border: "border-l-[#025ADB]",
    dot: "bg-[#025ADB]",
    shadow: "shadow-[#025ADB]/20",
    tint: "bg-[#025ADB]",
  },
  {
    border: "border-l-[#7C3AED]",
    dot: "bg-[#7C3AED]",
    shadow: "shadow-[#7C3AED]/20",
    tint: "bg-[#7C3AED]",
  },
  {
    border: "border-l-emerald-400",
    dot: "bg-emerald-400",
    shadow: "shadow-emerald-400/20",
    tint: "bg-emerald-400",
  },
  {
    border: "border-l-sky-400",
    dot: "bg-sky-400",
    shadow: "shadow-sky-400/20",
    tint: "bg-sky-400",
  },
];

const stripHtml = (value?: string) =>
  (value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

const formatCompletionDate = (value?: string) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

const getDomain = (value?: string) => {
  if (!value) return "";

  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return value;
  }
};

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

  const paginationData = paginationMeta as PaginationData;
  const totalProjects = paginationData?.total ?? data.length;

  const pageTokens = useMemo(() => {
    if (!paginationData || paginationData.last_page <= 1) return [];

    const { current_page: currentPage, last_page: lastPage } = paginationData;

    if (lastPage <= 5) {
      return Array.from({ length: lastPage }, (_, index) => index + 1);
    }

    if (currentPage <= 3) {
      return [1, 2, 3, "ellipsis", lastPage];
    }

    if (currentPage >= lastPage - 2) {
      return [1, "ellipsis", lastPage - 2, lastPage - 1, lastPage];
    }

    return [
      1,
      "ellipsis",
      currentPage - 1,
      currentPage,
      currentPage + 1,
      "ellipsis",
      lastPage,
    ];
  }, [paginationData]);

  const goToPage = useCallback(
    (page: number) => {
      if (
        !paginationData ||
        page === paginationData.current_page ||
        page < 1 ||
        page > paginationData.last_page
      ) {
        return;
      }

      loadData(page);
    },
    [loadData, paginationData],
  );

  // Accordion state
  const [expandedPanels, setExpandedPanels] = useState<number[]>([0]);
  const togglePanel = (idx: number) => {
    setExpandedPanels((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx],
    );
  };

  // Skeleton for loading with accordion shape
  const renderSkeleton = () => (
    <div className="space-y-5">
      {Array.from({ length: 3 }).map((_, idx) => (
        <div
          key={idx}
          className="overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white shadow-[0_18px_45px_-32px_rgba(15,23,42,0.28)]"
        >
          <div className="flex items-center justify-between px-6 py-5">
            <div className="flex items-center gap-4">
              <div className="h-3 w-3 animate-pulse rounded-full bg-slate-200" />
              <div className="h-6 w-40 animate-pulse rounded bg-slate-200" />
              <div className="h-6 w-[88px] animate-pulse rounded-lg bg-slate-100" />
            </div>
            <div className="h-5 w-5 animate-pulse rounded-full bg-slate-100" />
          </div>
          <div className="space-y-2 px-4 pb-4 pt-1">
            {Array.from({ length: idx === 0 ? 3 : 2 }).map((__, rowIndex) => (
              <div
                key={rowIndex}
                className="flex items-center gap-6 rounded-xl border border-slate-100 px-4 py-4"
              >
                <div className="h-[72px] w-[96px] animate-pulse rounded-xl bg-slate-200" />
                <div className="flex-1 space-y-3">
                  <div className="h-5 w-56 animate-pulse rounded bg-slate-200" />
                  <div className="flex gap-2">
                    <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
                    <div className="h-4 w-[72px] animate-pulse rounded bg-slate-100" />
                  </div>
                </div>
                <div className="h-6 w-20 animate-pulse rounded-full bg-slate-100" />
                <div className="flex gap-2">
                  <div className="h-9 w-9 animate-pulse rounded-lg bg-slate-100" />
                  <div className="h-9 w-9 animate-pulse rounded-lg bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="mx-auto my-6 h-full max-w-7xl px-3 sm:px-6 lg:px-8">
      <div className="min-h-full overflow-auto rounded-[2rem] bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.08),_transparent_38%),linear-gradient(180deg,_#ffffff_0%,_#f8fbff_56%,_#f3f7fd_100%)] px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8 dark:bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_34%),linear-gradient(180deg,_#0f172a_0%,_#111c33_58%,_#0f172a_100%)]">
        <div className="space-y-8">
          <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400 dark:text-slate-500">
                  Portfolio Manager
                </p>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-[2.2rem]">
                  Portfolios
                </h1>
              </div>
              <p className="max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-300 sm:text-[15px]">
                Showcase your best work, curated and organized for high-impact
                presentation.
              </p>
            </div>

            {isLoading ? (
              <div className="h-12 w-40 animate-pulse rounded-2xl bg-slate-200/80 dark:bg-slate-800/80" />
            ) : (
              permissions?.add && (
                <button
                  onClick={addNew}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#025ADB] px-5 text-sm font-semibold text-white shadow-[0_20px_40px_-24px_rgba(2,90,219,0.95)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#0148b3] focus:outline-none focus:ring-2 focus:ring-[#025ADB]/40"
                >
                  <i className="fa-solid fa-circle-plus text-xs" />
                  Create Portfolio
                </button>
              )
            )}
          </section>

          <section className="rounded-[1.75rem] border border-white/70 bg-white/92 p-3 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.32)] backdrop-blur dark:border-white/10 dark:bg-slate-900/80">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
              <div className="relative flex-1">
                <label htmlFor="search" className="sr-only">
                  Search portfolios
                </label>
                <i className="fa-solid fa-magnifying-glass pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-300 dark:text-slate-500" />
                <input
                  id="search"
                  type="text"
                  value={searchInput}
                  onChange={onSearchChange}
                  onKeyDown={(e) => e.key === "Enter" && loadData()}
                  className="h-14 w-full rounded-2xl border border-slate-200/70 bg-slate-50/90 pl-11 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#025ADB]/40 focus:bg-white focus:ring-4 focus:ring-[#025ADB]/10 dark:border-slate-700/80 dark:bg-slate-950/50 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-sky-500/40 dark:focus:bg-slate-950"
                  placeholder="Filter by project name, tech stack or client..."
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row xl:w-auto">
                <div className="relative min-w-[170px]">
                  <label htmlFor="status" className="sr-only">
                    Status
                  </label>
                  <select
                    id="status"
                    value={`${status.key}-${status.value}`}
                    onChange={onStatusChange}
                    className="h-14 w-full appearance-none rounded-2xl border border-slate-200/70 bg-white px-4 pr-10 text-sm font-medium text-slate-600 outline-none transition focus:border-[#025ADB]/40 focus:ring-4 focus:ring-[#025ADB]/10 dark:border-slate-700/80 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-sky-500/40"
                  >
                    {options.map((opt) => (
                      <option
                        key={`${opt.key}-${opt.value}`}
                        value={`${opt.key}-${opt.value}`}
                      >
                        {opt.key === "all" ? "All Status" : opt.name}
                      </option>
                    ))}
                  </select>
                  <i className="fa-solid fa-chevron-down pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 dark:text-slate-500" />
                </div>

                <button
                  type="button"
                  onClick={() => loadData()}
                  className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200/80 bg-white text-slate-500 transition hover:border-[#025ADB]/30 hover:text-[#025ADB] focus:outline-none focus:ring-4 focus:ring-[#025ADB]/10 dark:border-slate-700/80 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-sky-500/40 dark:hover:text-sky-400"
                  aria-label="Refresh filtered portfolios"
                >
                  <i className="fa-solid fa-sliders text-sm" />
                </button>
              </div>
            </div>
          </section>

          <section className="space-y-5">
            {isLoading ? (
              renderSkeleton()
            ) : groupedData.length === 0 ? (
              <div className="rounded-[1.85rem] border border-dashed border-slate-300/80 bg-white/80 px-6 py-16 text-center shadow-[0_18px_45px_-36px_rgba(15,23,42,0.28)] dark:border-slate-700 dark:bg-slate-900/70">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                  <i className="fa-regular fa-folder-open text-xl" />
                </div>
                <h2 className="mt-5 text-lg font-semibold text-slate-900 dark:text-white">
                  No portfolios found
                </h2>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
                  Adjust your search or status filters to find the right
                  portfolio entries.
                </p>
              </div>
            ) : (
              groupedData.map((group, groupIdx) => {
                const isExpanded = expandedPanels.includes(groupIdx);
                const theme =
                  portfolioAccentThemes[
                    groupIdx % portfolioAccentThemes.length
                  ];

                return (
                  <article
                    key={group.id ?? `uncat-${groupIdx}`}
                    className={`overflow-hidden rounded-[1.85rem] border border-slate-200/80 bg-white/95 shadow-[0_22px_55px_-38px_rgba(15,23,42,0.34)] transition-all duration-200 dark:border-slate-800 dark:bg-slate-900/80 ${
                      isExpanded ? `border-l-4 ${theme.border}` : ""
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => togglePanel(groupIdx)}
                      className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left transition hover:bg-slate-50/80 dark:hover:bg-slate-800/60 sm:px-6"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${theme.dot}`}
                        />
                        <div className="min-w-0 sm:flex sm:items-center sm:gap-3">
                          <h2 className="truncate text-lg font-semibold text-slate-900 dark:text-white">
                            {group.title}
                          </h2>
                          <span className="mt-1 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:bg-slate-800 dark:text-slate-500 sm:mt-0">
                            {group.items.length}{" "}
                            {group.items.length === 1 ? "project" : "projects"}
                          </span>
                        </div>
                      </div>

                      <span className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500">
                        <i
                          className={`fa-solid ${
                            isExpanded ? "fa-chevron-up" : "fa-chevron-down"
                          } text-xs`}
                        />
                      </span>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-slate-100 px-4 pb-4 pt-1 dark:border-slate-800 sm:px-5">
                        <div className="hidden items-center gap-4 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500 lg:grid lg:grid-cols-[minmax(0,1.5fr)_160px_110px]">
                          <span>Portfolio</span>
                          <span className="text-center">Status</span>
                          <span className="text-center">Action</span>
                        </div>

                        <div className="space-y-3">
                          {group.items.map((item) => {
                            const isActive =
                              item.status === 1 || item.status === true;
                            const cleanDescription = stripHtml(item.description);
                            const dateLabel = formatCompletionDate(
                              item.completion_date,
                            );
                            const domain = getDomain(item.project_url);
                            const metaBits = [
                              item.technologies,
                              item.client_name,
                              dateLabel,
                              domain,
                            ].filter(Boolean);

                            return (
                              <div
                                key={item.id}
                                className="grid gap-4 rounded-[1.4rem] border border-slate-200/70 bg-white px-4 py-4 transition hover:border-[#025ADB]/20 hover:shadow-[0_20px_40px_-34px_rgba(2,90,219,0.5)] dark:border-slate-800 dark:bg-slate-950/40 dark:hover:border-sky-500/30 lg:grid-cols-[minmax(0,1.5fr)_160px_110px] lg:items-center"
                              >
                                <div className="flex min-w-0 gap-4">
                                  <div className="relative h-[72px] w-[96px] flex-shrink-0 overflow-hidden rounded-[1rem] border border-slate-200/70 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={
                                        item.photo || "/svg/not-found-img.svg"
                                      }
                                      alt={item.title}
                                      className="h-full w-full object-cover"
                                    />
                                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-slate-950/35 to-transparent" />
                                  </div>

                                  <div className="min-w-0 space-y-1.5">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <h3 className="truncate text-base font-semibold text-slate-900 dark:text-white">
                                        {item.title}
                                      </h3>
                                      {item.category?.title && (
                                        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                                          {item.category.title}
                                        </span>
                                      )}
                                    </div>

                                    {metaBits.length > 0 && (
                                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 dark:text-slate-500">
                                        {metaBits.map((meta, metaIndex) => (
                                          <span
                                            key={`${item.id}-meta-${metaIndex}`}
                                            className="inline-flex items-center gap-1.5"
                                          >
                                            <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                                            {meta}
                                          </span>
                                        ))}
                                      </div>
                                    )}

                                    {cleanDescription && (
                                      <p className="line-clamp-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
                                        {cleanDescription}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center lg:justify-center">
                                  <span
                                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] ${
                                      isActive
                                        ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300"
                                        : "bg-rose-50 text-rose-500 dark:bg-rose-500/10 dark:text-rose-300"
                                    }`}
                                  >
                                    <span
                                      className={`h-1.5 w-1.5 rounded-full ${
                                        isActive
                                          ? "bg-emerald-400"
                                          : "bg-rose-400"
                                      }`}
                                    />
                                    {isActive ? "Active" : "Inactive"}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2 lg:justify-center">
                                  {status.key === "trashed" &&
                                  permissions.delete ? (
                                    <button
                                      type="button"
                                      onClick={() => restoreAction(item.id)}
                                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-600 transition hover:border-emerald-300 hover:bg-emerald-100 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
                                      aria-label={`Restore ${item.title}`}
                                    >
                                      <i className="fa-solid fa-trash-restore text-sm" />
                                    </button>
                                  ) : (
                                    <>
                                      {permissions.edit && (
                                        <button
                                          type="button"
                                          onClick={() => editHandler(item)}
                                          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 transition hover:border-[#025ADB]/20 hover:bg-[#025ADB]/5 hover:text-[#025ADB] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-sky-500/30 dark:hover:bg-sky-500/10 dark:hover:text-sky-300"
                                          aria-label={`Edit ${item.title}`}
                                        >
                                          <i className="fa-solid fa-pen text-sm" />
                                        </button>
                                      )}
                                      {permissions.delete && (
                                        <button
                                          type="button"
                                          onClick={() => openDeleteModal(item.id)}
                                          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-500 transition hover:border-rose-300 hover:bg-rose-100 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300"
                                          aria-label={`Delete ${item.title}`}
                                        >
                                          <i className="fa-solid fa-trash text-sm" />
                                        </button>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </article>
                );
              })
            )}
          </section>

          {!isLoading && (
            <footer className="flex flex-col gap-4 border-t border-slate-200/80 pt-4 text-xs text-slate-400 dark:border-slate-800 dark:text-slate-500 sm:flex-row sm:items-center sm:justify-between">
              <p className="font-medium tracking-[0.04em]">
                Showing {totalProjects} portfolios across {groupedData.length}{" "}
                categories
              </p>

              {paginationData?.last_page > 1 && (
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => goToPage(paginationData.current_page - 1)}
                    disabled={paginationData.current_page === 1}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 transition hover:border-[#025ADB]/20 hover:text-[#025ADB] disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500 dark:hover:border-sky-500/30 dark:hover:text-sky-300"
                    aria-label="Previous page"
                  >
                    <i className="fa-solid fa-chevron-left text-[11px]" />
                  </button>

                  {pageTokens.map((token, index) =>
                    token === "ellipsis" ? (
                      <span
                        key={`ellipsis-${index}`}
                        className="inline-flex h-10 min-w-10 items-center justify-center px-1 text-sm font-semibold text-slate-300 dark:text-slate-600"
                      >
                        ...
                      </span>
                    ) : (
                      <button
                        key={token}
                        type="button"
                        onClick={() => goToPage(token)}
                        className={`inline-flex h-10 min-w-10 items-center justify-center rounded-xl px-3 text-sm font-semibold transition ${
                          paginationData.current_page === token
                            ? "bg-[#025ADB] text-white shadow-[0_16px_34px_-20px_rgba(2,90,219,0.9)]"
                            : "border border-slate-200 bg-white text-slate-500 hover:border-[#025ADB]/20 hover:text-[#025ADB] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-sky-500/30 dark:hover:text-sky-300"
                        }`}
                      >
                        {token}
                      </button>
                    ),
                  )}

                  <button
                    type="button"
                    onClick={() => goToPage(paginationData.current_page + 1)}
                    disabled={
                      paginationData.current_page === paginationData.last_page
                    }
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 transition hover:border-[#025ADB]/20 hover:text-[#025ADB] disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500 dark:hover:border-sky-500/30 dark:hover:text-sky-300"
                    aria-label="Next page"
                  >
                    <i className="fa-solid fa-chevron-right text-[11px]" />
                  </button>
                </div>
              )}
            </footer>
          )}
        </div>

        <AddEdit
          isOpen={isOpenModal}
          item={editItem}
          modalTitle={modalTitle}
          categories={categories}
          onClose={cancelModal}
          onSave={receivedData}
        />
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
