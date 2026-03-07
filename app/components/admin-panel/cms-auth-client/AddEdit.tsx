"use client";

import React, { useCallback, useEffect, useState } from "react";
import { fetchAdmin } from "@/app/lib/fetchAdmin";
import ResponseModal from "@/app/components/ui/ResponseModal";

interface CmsAuthClient {
  id?: number;
  name?: string;
  email?: string;
}
interface AuthFormData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}
interface SubmitApiResponse {
  status: boolean;
  message?: string;
  data: CmsAuthClient;
}
interface FetchError extends Error {
  response?: Response;
  data?: {
    status?: boolean;
    message?: string;
    data?: Record<string, string[]>;
  };
}
interface AddEditProps {
  isOpen: boolean;
  item: CmsAuthClient | null;
  modalTitle: string;
  onClose: () => void;
  onSave: (item: CmsAuthClient) => void;
}

const emptyForm: AuthFormData = {
  name: "",
  email: "",
  password: "",
  password_confirmation: "",
};
const skipValidations = ["id"];

export default function AddEdit({
  isOpen,
  item,
  modalTitle,
  onClose,
  onSave,
}: AddEditProps) {
  const [formData, setFormData] = useState<AuthFormData>({ ...emptyForm });
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [isLoading, setIsLoading] = useState(false);
  const [responseModal, setResponseModal] = useState<Record<string, unknown>>(
    {},
  );

  useEffect(() => {
    if (item && Object.keys(item).length > 0) {
      setValidationErrors({});
      setFormData({
        name: item.name || "",
        email: item.email || "",
        password: "",
        password_confirmation: "",
      });
    } else {
      setFormData({ ...emptyForm });
      setValidationErrors({});
    }
  }, [item]);

  const updateField = useCallback((field: keyof AuthFormData, value: string) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };

      // Password validation
      if (field === "password") {
        const errors: string[] = [];
        if (value && typeof value === "string") {
          if (value.length < 8)
            errors.push("✘ Password must be at least 8 characters long.");
          if (!/[a-z]/.test(value))
            errors.push(
              "✘ Password must contain at least one lowercase letter.",
            );
          if (!/[A-Z]/.test(value))
            errors.push(
              "✘ Password must contain at least one uppercase letter.",
            );
          if (!/[0-9]/.test(value))
            errors.push(
              "✘ Password must contain at least one numeric character.",
            );
        }
        setValidationErrors((prevErr) => ({
          ...prevErr,
          password: errors.join("\n"),
          ...(next.password_confirmation &&
          next.password !== next.password_confirmation
            ? {
                password_confirmation:
                  "✘ Password and Confirm Password must be the same.",
              }
            : { password_confirmation: "" }),
        }));
      } else if (field === "password_confirmation") {
        setValidationErrors((prevErr) => ({
          ...prevErr,
          password_confirmation:
            value && value !== next.password
              ? "✘ Password and Confirm Password must be the same."
              : "",
        }));
      } else {
        setValidationErrors((prevErr) => ({ ...prevErr, [field]: "" }));
      }

      return next;
    });
  }, []);

  const validate = (): boolean => {
    if (formData.password !== formData.password_confirmation) {
      setValidationErrors((prev) => ({
        ...prev,
        password_confirmation: "Password and Confirm Password does not match",
      }));
      return false;
    }
    const newErrors: Record<string, string> = {};
    for (const [key, value] of Object.entries(formData)) {
      if (!value && !skipValidations.includes(key)) {
        newErrors[key] = `${key.replaceAll("_", " ")} is required`;
      }
    }
    if (Object.keys(newErrors).length > 0) {
      setValidationErrors(newErrors);
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsLoading(true);
    setResponseModal({});
    try {
      const isEdit = modalTitle !== "Create";
      const result = await fetchAdmin<SubmitApiResponse>(
        isEdit ? `admin/auth-client/${item?.id}` : "admin/auth-client",
        { method: isEdit ? "PUT" : "POST", body: formData as unknown as Record<string, unknown> },
      );
      if (result?.status === true) {
        setResponseModal(result as unknown as Record<string, unknown>);
        onSave(result.data);
      }
    } catch (e: unknown) {
      const error = e as FetchError;
      if (error?.response?.status === 404 || error?.response?.status === 422) {
        if (error.data?.data) {
          const se: Record<string, string> = {};
          for (const [key, val] of Object.entries(error.data.data)) {
            se[key] = val[0];
          }
          setValidationErrors(se);
        }
      } else if (!error?.response?.status) {
        setResponseModal({
          status: false,
          message: "Something went wrong. Please try again later.",
        });
      } else {
        setResponseModal({
          status: error.data?.status ?? false,
          message: error.data?.message ?? "An error occurred",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };
  const inputClass = (field: string) =>
    `w-full border rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-sky-500 ${validationErrors[field] ? "border-red-500" : "border-gray-300 dark:border-gray-600"}`;

  return (
    <>

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

      {isOpen && (
      <div className="fixed inset-0 z-9999 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg mx-4 animate-modal-enter max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center w-full gap-2 p-4 border-b border-gray-200 dark:border-gray-700">
            <h4 className="text-xl font-semibold text-gray-900 dark:text-white">
              {modalTitle} Auth Client
            </h4>
          </div>
          <form className="grid grid-cols-1 gap-4 p-6">
            <div className="flex items-center gap-4">
              <label className="font-semibold min-w-32 text-gray-900 dark:text-white">
                Name
              </label>
              <div className="flex-auto">
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="i.e John Doe"
                  className={inputClass("name")}
                  autoComplete="off"
                  onFocus={() =>
                    setValidationErrors((prev) => ({ ...prev, name: "" }))
                  }
                />
                {validationErrors.name && (
                  <p className="text-red-500 text-sm mt-1">
                    {validationErrors.name}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <label className="font-semibold min-w-32 text-gray-900 dark:text-white">
                Email
              </label>
              <div className="flex-auto">
                <input
                  type="text"
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="i.e. john@example.com"
                  className={inputClass("email")}
                  autoComplete="username"
                  onFocus={() =>
                    setValidationErrors((prev) => ({ ...prev, email: "" }))
                  }
                />
                {validationErrors.email && (
                  <p className="text-red-500 text-sm mt-1">
                    {validationErrors.email}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <label className="font-semibold min-w-32 text-gray-900 dark:text-white">
                Password
              </label>
              <div className="flex-auto">
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => updateField("password", e.target.value)}
                  className={inputClass("password")}
                  autoComplete="new-password"
                  onFocus={() =>
                    setValidationErrors((prev) => ({ ...prev, password: "" }))
                  }
                />
                {validationErrors.password && (
                  <p className="text-red-500 text-sm mt-1 whitespace-pre-line">
                    {validationErrors.password}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <label className="font-semibold min-w-32 text-gray-900 dark:text-white">
                Confirm Password
              </label>
              <div className="flex-auto">
                <input
                  type="password"
                  value={formData.password_confirmation}
                  onChange={(e) =>
                    updateField("password_confirmation", e.target.value)
                  }
                  className={inputClass("password_confirmation")}
                  autoComplete="new-password"
                  onFocus={() =>
                    setValidationErrors((prev) => ({
                      ...prev,
                      password_confirmation: "",
                    }))
                  }
                />
                {validationErrors.password_confirmation && (
                  <p className="text-red-500 text-sm mt-1">
                    {validationErrors.password_confirmation}
                  </p>
                )}
              </div>
            </div>
          </form>
          <div className="flex justify-end items-center gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
            {isLoading ? (
              <button
                disabled
                className="px-6 py-2 bg-gray-400 text-white rounded-md cursor-not-allowed flex items-center gap-2"
              >
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-red-500 text-red-500 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-300 hover:scale-105 flex items-center gap-2"
                >
                  <i className="pi pi-times-circle" />
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center gap-2"
                >
                  <i
                    className={
                      modalTitle === "Create"
                        ? "pi pi-plus-circle"
                        : "pi pi-refresh"
                    }
                  />
                  {modalTitle === "Create" ? "Create" : "Update"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      )}
    </>
  );
}
