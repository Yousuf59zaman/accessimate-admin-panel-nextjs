"use client";

import { useAdminAuth } from "@/app/contexts/AdminAuthContext";
import {
  Chart as ChartJS,
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
} from "chart.js";
import { Line, Pie, Bar } from "react-chartjs-2";

// Register Chart.js modules
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

// ─── Chart Colors (replacing PrimeVue CSS variables) ────────
const colors = {
  cyan500: "#06b6d4",
  cyan400: "#22d3ee",
  orange500: "#f97316",
  orange400: "#fb923c",
  gray500: "#6b7280",
  gray400: "#9ca3af",
};

// ─── Line Chart Data & Options ──────────────────────────────
const lineChartData = {
  labels: ["January", "February", "March", "April", "May", "June", "July"],
  datasets: [
    {
      label: "First Dataset",
      data: [65, 59, 80, 81, 56, 55, 40],
      fill: false,
      tension: 0.4,
      borderColor: colors.cyan500,
    },
    {
      label: "Second Dataset",
      data: [28, 48, 40, 19, 86, 27, 90],
      fill: false,
      borderDash: [5, 5],
      tension: 0.4,
      borderColor: colors.orange500,
    },
    {
      label: "Third Dataset",
      data: [12, 51, 62, 33, 21, 62, 45],
      fill: true,
      borderColor: colors.gray500,
      tension: 0.4,
      backgroundColor: "rgba(107, 114, 128, 0.2)",
    },
  ],
};

const lineChartOptions = {
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        color: "#374151",
      },
    },
  },
  scales: {
    x: {
      ticks: { color: "#6b7280" },
      grid: { color: "#e5e7eb" },
    },
    y: {
      ticks: { color: "#6b7280" },
      grid: { color: "#e5e7eb" },
    },
  },
};

// ─── Pie Chart Data & Options ───────────────────────────────
const pieChartData = {
  labels: ["A", "B", "C"],
  datasets: [
    {
      data: [540, 325, 702],
      backgroundColor: [colors.cyan500, colors.orange500, colors.gray500],
      hoverBackgroundColor: [colors.cyan400, colors.orange400, colors.gray400],
    },
  ],
};

const pieChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "right" as const,
      labels: {
        color: "#374151",
        font: { size: 14 },
      },
    },
  },
};

// ─── Bar/Vertical Chart Data & Options ──────────────────────
const barChartData = {
  labels: ["January", "February", "March", "April", "May", "June", "July"],
  datasets: [
    {
      label: "My First dataset",
      backgroundColor: colors.cyan500,
      borderColor: colors.cyan500,
      data: [65, 59, 80, 81, 56, 55, 40],
    },
    {
      label: "My Second dataset",
      backgroundColor: colors.gray500,
      borderColor: colors.gray500,
      data: [28, 48, 40, 19, 86, 27, 90],
    },
  ],
};

const barChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "top" as const,
      labels: { color: "#374151" },
    },
  },
  scales: {
    x: {
      ticks: {
        color: "#6b7280",
        font: { weight: 500 as const },
      },
      grid: {
        display: false,
      },
    },
    y: {
      ticks: { color: "#6b7280" },
      grid: {
        color: "#e5e7eb",
      },
    },
  },
};

// ─── Component ──────────────────────────────────────────────

export default function AdminPanelPage() {
  const { adminUser, isLoading } = useAdminAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full mx-auto max-w-7xl px-2 sm:px-6 lg:px-8 my-6">
      {/* Dashboard Header */}
      <div className="mb-8">
        <div className="relative">
          <div
            className="absolute inset-0 flex items-center"
            aria-hidden="true"
          >
            <div className="w-full border-t border-gray-200 dark:border-gray-700" />
          </div>
          <div className="relative flex justify-start">
            <span className="pr-3 bg-white dark:bg-gray-900 text-lg font-semibold leading-6 text-gray-900 dark:text-white">
              Dashboard
            </span>
          </div>
        </div>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
          Analytics Overview
        </h1>
        <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-400">
          Track your platform&apos;s performance and user engagement metrics in
          real-time.
          {adminUser?.name && (
            <span className="ml-1 font-medium text-sky-600">
              Welcome, {adminUser.name}!
            </span>
          )}
        </p>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6">
        {/* Line Chart — Full width */}
        <div className="transition-all duration-300 ease-in hover:-translate-y-0.5 hover:shadow-md flex flex-col p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Line Chart
          </h3>
          <div className="h-[400px]">
            <Line data={lineChartData} options={lineChartOptions} />
          </div>
        </div>

        {/* Pie + Bar — Two column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <div className="transition-all duration-300 ease-in hover:-translate-y-0.5 hover:shadow-md flex flex-col justify-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Chart Distribution
            </h3>
            <div className="h-[400px] flex items-center justify-center">
              <Pie data={pieChartData} options={pieChartOptions} />
            </div>
          </div>

          {/* Bar Chart */}
          <div className="transition-all duration-300 ease-in hover:-translate-y-0.5 hover:shadow-md flex flex-col p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Monthly Statistics
            </h3>
            <div className="h-[400px]">
              <Bar data={barChartData} options={barChartOptions} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
