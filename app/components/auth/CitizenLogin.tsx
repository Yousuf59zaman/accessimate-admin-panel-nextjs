"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useCitizenAuth } from "@/app/contexts/CitizenAuthContext";
import CitizenLayout from "@/app/components/auth/CitizenLayout";
import ButtonPrimary from "@/app/components/ui/ButtonPrimary";
import InputError from "@/app/components/ui/InputError";

export default function CitizenLogin() {
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [form, setForm] = useState({ login_id: "", password: "" });
  const [errorMessage, setErrorMessage] = useState("");
  const [loadingAction, setLoadingAction] = useState<"login" | "demo" | null>(
    null,
  );
  const { login, demoLogin } = useCitizenAuth();

  const messageFrom = (error: unknown, fallback: string) => {
    if (error && typeof error === "object" && "data" in error) {
      const apiError = error as { data?: { message?: string } };
      return apiError.data?.message ?? fallback;
    }
    return error instanceof Error ? error.message : fallback;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoadingAction("login");
    setErrorMessage("");
    try {
      await login(form);
    } catch (error: unknown) {
      setErrorMessage(messageFrom(error, "Citizen sign-in failed."));
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDemoLogin = async () => {
    setLoadingAction("demo");
    setErrorMessage("");
    try {
      await demoLogin();
    } catch (error: unknown) {
      setErrorMessage(messageFrom(error, "Citizen reviewer access failed."));
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <CitizenLayout>
      <div className="mb-5 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-600">
          Citizen workspace
        </p>
        <h1 className="mt-2 text-2xl font-extrabold text-slate-900">
          Sign in to Accessimate
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Social sign-in is intentionally disabled until provider verification
          credentials are configured.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
        <div>
          <label htmlFor="citizen-login-id" className="text-sm font-medium text-slate-700">
            Email or login ID
          </label>
          <input
            id="citizen-login-id"
            type="text"
            required
            autoComplete="username"
            value={form.login_id}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                login_id: event.target.value,
              }))
            }
            className="mt-2 w-full rounded-lg border border-sky-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
          />
        </div>

        <div>
          <label htmlFor="citizen-password" className="text-sm font-medium text-slate-700">
            Password
          </label>
          <div className="relative">
            <input
              id="citizen-password"
              type={passwordOpen ? "text" : "password"}
              required
              autoComplete="current-password"
              value={form.password}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  password: event.target.value,
                }))
              }
              className="mt-2 w-full rounded-lg border border-sky-300 bg-white px-4 py-3 pr-12 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
            />
            <button
              type="button"
              aria-label={passwordOpen ? "Hide password" : "Show password"}
              onClick={() => setPasswordOpen((current) => !current)}
              className="absolute right-3 top-1/2 mt-1 -translate-y-1/2 rounded-md p-2 text-slate-400 hover:text-slate-700"
            >
              <i className={`fa ${passwordOpen ? "fa-eye" : "fa-eye-slash"}`} />
            </button>
          </div>
        </div>

        <ButtonPrimary
          disabled={loadingAction !== null}
          className="w-full rounded-lg bg-sky-600 px-6 py-3 font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loadingAction === "login" ? "Signing in…" : "Sign in"}
        </ButtonPrimary>

        <button
          type="button"
          onClick={handleDemoLogin}
          disabled={loadingAction !== null}
          className="w-full rounded-lg border border-sky-200 bg-sky-50 px-5 py-3 text-sm font-semibold text-sky-700 transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loadingAction === "demo"
            ? "Opening citizen demo…"
            : "Explore citizen reviewer demo"}
        </button>

        <div className="min-h-5">
          <InputError message={errorMessage} />
        </div>
      </form>

      <div className="mt-4 flex items-center justify-center gap-3 text-sm">
        <Link href="/" className="font-medium text-slate-500 hover:text-slate-800">
          Back to overview
        </Link>
        <span className="text-slate-300">•</span>
        <Link href="/admin-login" className="font-semibold text-sky-600 hover:text-sky-700">
          Admin portal
        </Link>
      </div>
    </CitizenLayout>
  );
}
