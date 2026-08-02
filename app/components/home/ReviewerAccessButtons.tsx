"use client";

import { useState } from "react";
import Link from "next/link";
import { useAdminAuth } from "@/app/contexts/AdminAuthContext";
import { useCitizenAuth } from "@/app/contexts/CitizenAuthContext";

export default function ReviewerAccessButtons() {
  const { demoLogin: adminDemoLogin } = useAdminAuth();
  const { demoLogin: citizenDemoLogin } = useCitizenAuth();
  const [loadingRole, setLoadingRole] = useState<"admin" | "citizen" | null>(
    null,
  );
  const [errorMessage, setErrorMessage] = useState("");

  const openDemo = async (role: "admin" | "citizen") => {
    setLoadingRole(role);
    setErrorMessage("");
    try {
      if (role === "admin") await adminDemoLogin();
      else await citizenDemoLogin();
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Reviewer mode is temporarily unavailable.",
      );
      setLoadingRole(null);
    }
  };

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => void openDemo("admin")}
          disabled={loadingRole !== null}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <i className={`fa-solid ${loadingRole === "admin" ? "fa-spinner animate-spin" : "fa-chart-line"}`} />
          {loadingRole === "admin" ? "Opening admin demo…" : "Open admin reviewer demo"}
        </button>
        <button
          type="button"
          onClick={() => void openDemo("citizen")}
          disabled={loadingRole !== null}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:-translate-y-0.5 hover:border-blue-300 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        >
          <i className={`fa-solid ${loadingRole === "citizen" ? "fa-spinner animate-spin" : "fa-user"}`} />
          {loadingRole === "citizen" ? "Opening citizen demo…" : "Open citizen demo"}
        </button>
        <Link
          href="/accessibility-widget"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-cyan-300/60 bg-cyan-50 px-5 py-3 text-sm font-bold text-cyan-800 transition hover:-translate-y-0.5 hover:border-cyan-400 hover:bg-cyan-100 dark:border-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-200"
        >
          <i className="fa-solid fa-universal-access" />
          Try the original live widget
        </Link>
      </div>
      {errorMessage && (
        <p className="mt-3 text-sm font-medium text-rose-600" role="alert">
          {errorMessage}{" "}
          <Link href="/admin-login" className="underline">
            Use the sign-in page
          </Link>
        </p>
      )}
    </div>
  );
}
