"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import { Bar, Line, Pie } from "react-chartjs-2";
import { useAdminAuth } from "@/app/contexts/AdminAuthContext";
import { fetchAdmin } from "@/app/lib/fetchAdmin";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

type DashboardOverview = {
  totals: {
    accounts: number;
    active_records: number;
    trashed_records: number;
    modules: number;
  };
  resources: Array<{ resource: string; count: number }>;
  status_distribution: Array<{ status: number; count: number }>;
  activity_by_day: Array<{ day: string; count: number }>;
  recent_activity: Array<{
    id: string;
    action: string;
    resource: string;
    resourceId?: string | null;
    created_at: string;
  }>;
};

type DashboardResponse = { status: boolean; data: DashboardOverview };

const emptyOverview: DashboardOverview = {
  totals: { accounts: 0, active_records: 0, trashed_records: 0, modules: 0 },
  resources: [],
  status_distribution: [],
  activity_by_day: [],
  recent_activity: [],
};

const formatResource = (value: string) =>
  value
    .split("-")
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");

const chartGrid = "rgba(148, 163, 184, 0.18)";
const chartText = "#64748b";

export default function AdminPanelPage() {
  const { adminUser } = useAdminAuth();
  const [overview, setOverview] = useState(emptyOverview);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const loadOverview = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const response = await fetchAdmin<DashboardResponse>(
        "admin/dashboard/overview",
        { method: "GET" },
      );
      setOverview(response.data);
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Dashboard analytics could not be loaded.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  const activityChart = useMemo(
    () => ({
      labels: overview.activity_by_day.map((item) =>
        new Intl.DateTimeFormat("en-US", {
          month: "short",
          day: "numeric",
          timeZone: "UTC",
        }).format(new Date(`${item.day}T00:00:00.000Z`)),
      ),
      datasets: [
        {
          label: "Verified admin actions",
          data: overview.activity_by_day.map((item) => item.count),
          borderColor: "#0284c7",
          backgroundColor: "rgba(14, 165, 233, 0.14)",
          pointBackgroundColor: "#0284c7",
          fill: true,
          tension: 0.38,
        },
      ],
    }),
    [overview.activity_by_day],
  );

  const statusChart = useMemo(
    () => ({
      labels: overview.status_distribution.map((item) =>
        item.status === 1 ? "Active" : item.status === 0 ? "Inactive" : `Status ${item.status}`,
      ),
      datasets: [
        {
          data: overview.status_distribution.map((item) => item.count),
          backgroundColor: ["#10b981", "#f43f5e", "#8b5cf6", "#f59e0b"],
          hoverOffset: 8,
        },
      ],
    }),
    [overview.status_distribution],
  );

  const resourcesChart = useMemo(
    () => ({
      labels: overview.resources.map((item) => formatResource(item.resource)),
      datasets: [
        {
          label: "Stored records",
          data: overview.resources.map((item) => item.count),
          backgroundColor: "rgba(37, 99, 235, 0.78)",
          borderRadius: 8,
        },
      ],
    }),
    [overview.resources],
  );

  const cards = [
    {
      label: "Active records",
      value: overview.totals.active_records,
      icon: "fa-solid fa-database",
      color: "text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-300",
    },
    {
      label: "CMS modules",
      value: overview.totals.modules,
      icon: "fa-solid fa-layer-group",
      color: "text-violet-600 bg-violet-50 dark:bg-violet-950/40 dark:text-violet-300",
    },
    {
      label: "Role accounts",
      value: overview.totals.accounts,
      icon: "fa-solid fa-users",
      color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300",
    },
    {
      label: "Trashed records",
      value: overview.totals.trashed_records,
      icon: "fa-solid fa-trash-can-arrow-up",
      color: "text-rose-600 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-300",
    },
  ];

  return (
    <div
      className="mx-auto my-6 max-w-7xl px-3 sm:px-6 lg:px-8"
      data-dashboard-loading={isLoading ? "true" : "false"}
    >
      <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 dark:border-slate-800 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-600 dark:text-sky-300">
              Live PostgreSQL analytics
            </p>
            {adminUser?.is_demo && (
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
                Read-only reviewer
              </span>
            )}
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
            Platform control center
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            Welcome, {adminUser?.name ?? "Admin"}. Every metric below is loaded
            from the independent NestJS API and PostgreSQL database.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadOverview()}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-sky-200 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        >
          <i className={`fa-solid fa-rotate ${isLoading ? "animate-spin" : ""}`} />
          Refresh analytics
        </button>
      </header>

      {errorMessage && (
        <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300 sm:flex-row sm:items-center sm:justify-between">
          <span>{errorMessage}</span>
          <button type="button" onClick={() => void loadOverview()} className="font-bold underline">
            Try again
          </button>
        </div>
      )}

      <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <article
            key={card.label}
            className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between">
              <span className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${card.color}`}>
                <i className={card.icon} />
              </span>
              {isLoading ? (
                <span className="h-8 w-16 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
              ) : (
                <strong className="text-3xl text-slate-950 dark:text-white">
                  {card.value.toLocaleString()}
                </strong>
              )}
            </div>
            <p className="mt-5 text-sm font-semibold text-slate-500 dark:text-slate-400">
              {card.label}
            </p>
          </article>
        ))}
      </section>

      <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 xl:col-span-2">
          <div className="mb-5">
            <h2 className="font-bold text-slate-950 dark:text-white">Seven-day admin activity</h2>
            <p className="mt-1 text-xs text-slate-500">Audited create, update, delete, and restore operations.</p>
          </div>
          <div className="h-80">
            <Line
              data={activityChart}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                interaction: { intersect: false, mode: "index" },
                plugins: { legend: { labels: { color: chartText } } },
                scales: {
                  x: { ticks: { color: chartText }, grid: { color: chartGrid } },
                  y: { beginAtZero: true, ticks: { color: chartText, precision: 0 }, grid: { color: chartGrid } },
                },
              }}
            />
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="font-bold text-slate-950 dark:text-white">Record status</h2>
          <p className="mt-1 text-xs text-slate-500">Current non-trashed CMS records.</p>
          <div className="mt-4 h-80">
            {statusChart.labels.length ? (
              <Pie
                data={statusChart}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: "bottom", labels: { color: chartText, padding: 18 } } },
                }}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">No status data yet.</div>
            )}
          </div>
        </article>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 xl:col-span-2">
          <h2 className="font-bold text-slate-950 dark:text-white">Largest CMS modules</h2>
          <p className="mt-1 text-xs text-slate-500">Top modules by active stored records.</p>
          <div className="mt-4 h-96">
            <Bar
              data={resourcesChart}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { labels: { color: chartText } } },
                scales: {
                  x: { ticks: { color: chartText, maxRotation: 45 }, grid: { display: false } },
                  y: { beginAtZero: true, ticks: { color: chartText, precision: 0 }, grid: { color: chartGrid } },
                },
              }}
            />
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="font-bold text-slate-950 dark:text-white">Recent audited changes</h2>
          <p className="mt-1 text-xs text-slate-500">Latest owner mutations across modules.</p>
          <div className="mt-5 space-y-3">
            {overview.recent_activity.length ? (
              overview.recent_activity.map((item) => (
                <div key={item.id} className="rounded-xl border border-slate-100 p-3 dark:border-slate-800">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {formatResource(item.resource)}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                      {item.action}
                    </span>
                  </div>
                  <time className="mt-2 block text-xs text-slate-400">
                    {new Intl.DateTimeFormat("en-US", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(item.created_at))}
                  </time>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-400 dark:border-slate-700">
                No owner mutations have been recorded yet.
              </div>
            )}
          </div>
        </article>
      </section>
    </div>
  );
}
