"use client";

import React, { useState } from "react";
import Link from "next/link";
import { UserIcon, LockClosedIcon } from "@heroicons/react/24/outline";
import { useAdminAuth } from "@/app/contexts/AdminAuthContext";
import ApplicationLogo from "@/app/components/ui/ApplicationLogo";
import ButtonPrimary from "@/app/components/ui/ButtonPrimary";
import InputError from "@/app/components/ui/InputError";

export default function AdminLogin() {
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [form, setForm] = useState({ login_id: "", password: "" });
  const [unauthorizedError, setUnauthorizedError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAdminAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setUnauthorizedError("");

    try {
      const response = await login(form);
      if (response) {
        window.location.href = "/admin-panel";
        return;
      }
    } catch (error: unknown) {
      if (error && typeof error === "object" && "data" in error) {
        const apiError = error as { data?: { message?: string } };
        setUnauthorizedError(apiError.data?.message || "Login failed");
      } else if (error instanceof Error) {
        setUnauthorizedError(error.message || "Login failed");
      } else {
        setUnauthorizedError(
          "An unexpected error occurred. Please try again later.",
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center animate-gradient bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
      <div className="w-full max-w-md p-8 transform perspective-1000">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-8 backdrop-blur-xl hover:shadow-[0_8px_40px_rgb(0,0,0,0.16)] transition-all duration-300 ease-in-out">
          <div className="flex justify-center mb-6 scale-animation select-none">
            <Link href="/">
              <ApplicationLogo width="160px" height="55px" />
            </Link>
          </div>

          <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
            Admin Portal
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="floating-input">
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="login_id"
                  type="text"
                  value={form.login_id}
                  onChange={(e) =>
                    setForm({ ...form, login_id: e.target.value })
                  }
                  className="w-full pl-12 pr-4 py-4 rounded-xl bg-gray-50 dark:bg-gray-800 border-0 focus:ring-2 focus:ring-purple-500 transition-all duration-200 text-gray-900 dark:text-white"
                  required
                  placeholder="User ID"
                />
              </div>
            </div>

            <div className="floating-input">
              <div className="relative">
                <LockClosedIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  type={passwordOpen ? "text" : "password"}
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  className="w-full pl-12 pr-12 py-4 rounded-xl bg-gray-50 dark:bg-gray-800 border-0 focus:ring-2 focus:ring-purple-500 transition-all duration-200 text-gray-900 dark:text-white"
                  required
                  placeholder="Password"
                />
                <button
                  type="button"
                  onClick={() => setPasswordOpen(!passwordOpen)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <i
                    className={`fa text-lg ${passwordOpen ? "fa-eye" : "fa-eye-slash"}`}
                  ></i>
                </button>
              </div>
            </div>

            <ButtonPrimary
              disabled={isLoading}
              className={`w-full py-4 rounded-xl text-[15px] font-semibold bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 transform hover:-translate-y-0.5 transition-all duration-200 ${isLoading ? "opacity-85" : ""}`}
            >
              {!isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  Sign In <i className="fa fa-arrow-right"></i>
                </span>
              ) : (
                <div className="flex justify-center items-center">
                  <div className="w-7 h-7 border-[3px] border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </ButtonPrimary>

            <div className="min-h-4">
              <InputError message={unauthorizedError} />
            </div>
          </form>
        </div>
      </div>

      <style jsx>{`
        .animate-gradient {
          background-size: 400% 400%;
          animation: gradient 15s ease infinite;
        }
        .scale-animation:hover {
          transform: scale(1.05);
          transition: transform 0.3s ease;
        }
        .floating-input:focus-within {
          transform: translateY(-2px);
        }
        @keyframes gradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
      `}</style>
    </div>
  );
}
