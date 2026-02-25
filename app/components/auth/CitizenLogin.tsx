"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCitizenAuth } from "@/app/contexts/CitizenAuthContext";
import CitizenLayout from "@/app/components/auth/CitizenLayout";
import ButtonPrimary from "@/app/components/ui/ButtonPrimary";
import InputError from "@/app/components/ui/InputError";

export default function CitizenLogin() {
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [form, setForm] = useState({ login_id: "", password: "" });
  const [unauthorizedError, setUnauthorizedError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login, googleLogin, facebookLogin } = useCitizenAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setUnauthorizedError("");

    try {
      const response = await login(form);
      if (response) {
        window.location.href = "/dashboard";
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

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setUnauthorizedError("");
    try {
      const response = await googleLogin();
      if (response) {
        window.location.href = "/dashboard";
        return;
      }
    } catch (error: unknown) {
      if (error && typeof error === "object" && "data" in error) {
        const apiError = error as { data?: { errors?: string } };
        setUnauthorizedError(apiError.data?.errors || "Google login failed");
      } else if (error instanceof Error) {
        setUnauthorizedError(error.message || "Google login failed");
      } else {
        setUnauthorizedError("An unexpected error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFacebookLogin = async () => {
    setIsLoading(true);
    setUnauthorizedError("");
    try {
      const response = await facebookLogin();
      if (response) {
        window.location.href = "/dashboard";
        return;
      }
    } catch (error: unknown) {
      if (error && typeof error === "object" && "data" in error) {
        const apiError = error as { data?: { errors?: string } };
        setUnauthorizedError(apiError.data?.errors || "Facebook login failed");
      } else if (error instanceof Error) {
        setUnauthorizedError(error.message || "Facebook login failed");
      } else {
        setUnauthorizedError("An unexpected error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CitizenLayout>
      <form onSubmit={handleSubmit} className="flex flex-col w-full space-y-2">
        <div className="flex items-start justify-center mb-3">
          <div className="text-lg font-extrabold">
            <span>Sign In To Accessimate</span>
          </div>
        </div>

        {/* Social Login */}
        <div className="flex flex-wrap items-center justify-between gap-1 mt-2 space-y-2 text-blue-500">
          <button
            onClick={handleGoogleLogin}
            type="button"
            className="flex gap-4 px-4 py-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              loading="lazy"
              src="https://cdn.builder.io/api/v1/image/assets/TEMP/c9c122158c1ec8e6bba1d8d4ef6be9f67bd5a0235b3888a17bebb6cc24082ea8"
              alt="Google logo"
              className="w-3"
            />
            <span>Sign in with Google</span>
          </button>
          <div className="flex gap-2 m-[0!important]">
            <button
              type="button"
              onClick={handleFacebookLogin}
              className="focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                loading="lazy"
                src="https://cdn.builder.io/api/v1/image/assets/TEMP/c8e92a79c334270fd2f383aeb18f533e0e8b0fb583d30b483981e9ee2253e71a"
                alt="Facebook login"
                className="w-10 cursor-pointer"
              />
            </button>
          </div>
        </div>

        <div className="flex items-center my-6">
          <div className="grow h-px bg-gray-300"></div>
          <span className="mx-4 text-gray-500 text-sm font-medium">OR</span>
          <div className="grow h-px bg-gray-300"></div>
        </div>

        {/* Form Fields */}
        <div>
          <label htmlFor="username" className="block text-base text-black">
            E-mail
          </label>
          <input
            id="username"
            type="text"
            value={form.login_id}
            onChange={(e) => setForm({ ...form, login_id: e.target.value })}
            className="w-full px-4 py-2 mt-2 text-sm font-light bg-white border border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-base text-black">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={passwordOpen ? "text" : "password"}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-4 py-2 pr-12 mt-2 text-sm font-light bg-white border border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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

        <Link
          href="/forgot-password"
          className="self-end mt-2 text-sm text-blue-500 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Forgot Password
        </Link>

        <ButtonPrimary
          disabled={isLoading}
          className={`self-center w-full px-6 py-3 text-base font-medium text-white rounded-lg bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-600 ${isLoading ? "opacity-65" : ""}`}
        >
          {!isLoading ? (
            <span>Sign in</span>
          ) : (
            <svg
              className="text-gray-300 animate-spin mx-auto"
              viewBox="0 0 64 64"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
            >
              <path
                d="M32 3C35.8083 3 39.5794 3.75011 43.0978 5.20749C46.6163 6.66488 49.8132 8.80101 52.5061 11.4939C55.199 14.1868 57.3351 17.3837 58.7925 20.9022C60.2499 24.4206 61 28.1917 61 32C61 35.8083 60.2499 39.5794 58.7925 43.0978C57.3351 46.6163 55.199 49.8132 52.5061 52.5061C49.8132 55.199 46.6163 57.3351 43.0978 58.7925C39.5794 60.2499 35.8083 61 32 61C28.1917 61 24.4206 60.2499 20.9022 58.7925C17.3837 57.3351 14.1868 55.199 11.4939 52.5061C8.801 49.8132 6.66487 46.6163 5.20749 43.0978C3.7501 39.5794 3 35.8083 3 32C3 28.1917 3.75011 24.4206 5.2075 20.9022C6.66489 17.3837 8.80101 14.1868 11.4939 11.4939C14.1868 8.80099 17.3838 6.66487 20.9022 5.20749C24.4206 3.7501 28.1917 3 32 3L32 3Z"
                stroke="currentColor"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></path>
              <path
                d="M32 3C36.5778 3 41.0906 4.08374 45.1692 6.16256C49.2477 8.24138 52.7762 11.2562 55.466 14.9605C58.1558 18.6647 59.9304 22.9531 60.6448 27.4748C61.3591 31.9965 60.9928 36.6232 59.5759 40.9762"
                stroke="currentColor"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-green-500"
              ></path>
            </svg>
          )}
        </ButtonPrimary>

        <div className="min-h-4">
          <InputError message={unauthorizedError} />
        </div>
      </form>

      <div className="flex items-start justify-center mt-2">
        <div className="flex justify-center text-sm text-gray-500">
          No Account?&nbsp;
          <br />
          <button
            onClick={() => router.push("/registration")}
            type="button"
            className="text-sky-600 hover:underline focus:outline-none focus:ring-2 focus:ring-sky-600"
          >
            Sign up
          </button>
        </div>
      </div>
    </CitizenLayout>
  );
}
