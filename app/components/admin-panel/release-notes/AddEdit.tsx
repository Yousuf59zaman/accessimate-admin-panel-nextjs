"use client";

import React, { useCallback, useEffect, useState } from "react";
import { fetchAdmin } from "@/app/lib/fetchAdmin";
import ResponseModal from "@/app/components/ui/ResponseModal";

interface ReleaseNote {
  id?: number;
  title?: string;
  version_name?: string;
  slug?: string;
  details?: string;
  status?: number;
}
interface FormData {
  title: string;
  version_name: string;
  slug: string;
  details: string;
  status: number;
}
interface SubmitApiResponse {
  status: boolean;
  message?: string;
  data: ReleaseNote;
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
  item: ReleaseNote | null;
  modalTitle: string;
  onClose: () => void;
  onSave: (item: ReleaseNote) => void;
}

const emptyForm: FormData = {
  title: "",
  version_name: "",
  slug: "",
  details: "",
  status: 0,
};
const skipValidations = ["status"];

export default function AddEdit({
  isOpen,
  item,
  modalTitle,
  onClose,
  onSave,
}: AddEditProps) {
  const [formData, setFormData] = useState<FormData>({ ...emptyForm });
  const [isChecked, setIsChecked] = useState(false);
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
        title: item.title || "",
        version_name: item.version_name || "",
        slug: item.slug || "",
        details: item.details || "",
        status: item.status || 0,
      });
      setIsChecked(item.status === 1);
    } else {
      setFormData({ ...emptyForm });
      setIsChecked(false);
      setValidationErrors({});
    }
  }, [item]);

  const updateField = useCallback(
    (field: keyof FormData, value: string | number) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setValidationErrors((prev) => ({ ...prev, [field]: "" }));
    },
    [],
  );

  const validate = (): boolean => {
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
      const submitData = { ...formData, status: isChecked ? 1 : 0 };
      const isEdit = modalTitle !== "Create";
      const result = await fetchAdmin<SubmitApiResponse>(
        isEdit ? `admin/release-notes/${item?.id}` : "admin/release-notes",
        { method: isEdit ? "PUT" : "POST", body: submitData },
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
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl mx-4 animate-modal-enter max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center w-full gap-2 p-4 border-b border-gray-200 dark:border-gray-700">
            <h4 className="text-xl font-semibold text-gray-900 dark:text-white">
              {modalTitle} Release Notes
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-6">
            {/* Title */}
            <div className="flex items-center gap-4">
              <div className="flex-auto">
                <label className="font-semibold text-gray-900 dark:text-white">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  placeholder="i.e. Version"
                  className={inputClass("title")}
                  autoComplete="off"
                  onFocus={() =>
                    setValidationErrors((prev) => ({ ...prev, title: "" }))
                  }
                />
                {validationErrors.title && (
                  <p className="text-red-500 text-sm mt-1">
                    {validationErrors.title}
                  </p>
                )}
              </div>
            </div>
            {/* Version Name */}
            <div className="flex items-center gap-4">
              <div className="flex-auto">
                <label className="font-semibold text-gray-900 dark:text-white">
                  Version Name
                </label>
                <input
                  type="text"
                  value={formData.version_name}
                  onChange={(e) => updateField("version_name", e.target.value)}
                  placeholder="i.e. v1.0.0"
                  className={inputClass("version_name")}
                  autoComplete="off"
                  onFocus={() =>
                    setValidationErrors((prev) => ({
                      ...prev,
                      version_name: "",
                    }))
                  }
                />
                {validationErrors.version_name && (
                  <p className="text-red-500 text-sm mt-1">
                    {validationErrors.version_name}
                  </p>
                )}
              </div>
            </div>
            {/* Slug */}
            <div className="flex items-center gap-4">
              <div className="flex-auto">
                <label className="font-semibold text-gray-900 dark:text-white">
                  Slug
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => updateField("slug", e.target.value)}
                  placeholder="i.e. version-1-0-0"
                  className={inputClass("slug")}
                  autoComplete="off"
                  onFocus={() =>
                    setValidationErrors((prev) => ({ ...prev, slug: "" }))
                  }
                />
                {validationErrors.slug && (
                  <p className="text-red-500 text-sm mt-1">
                    {validationErrors.slug}
                  </p>
                )}
              </div>
            </div>
            {/* Details - full width */}
            <div className="col-span-1 sm:col-span-3 flex items-center gap-4">
              <div className="flex-auto">
                <label className="font-semibold text-gray-900 dark:text-white">
                  Details
                </label>
                <textarea
                  value={formData.details}
                  onChange={(e) => updateField("details", e.target.value)}
                  className={inputClass("details")}
                  rows={10}
                  onFocus={() =>
                    setValidationErrors((prev) => ({ ...prev, details: "" }))
                  }
                />
                {validationErrors.details && (
                  <p className="text-red-500 text-sm mt-1">
                    {validationErrors.details}
                  </p>
                )}
              </div>
            </div>
            {/* Status */}
            <div className="flex items-center gap-4">
              <label className="font-semibold min-w-16 text-gray-900 dark:text-white">
                Status
              </label>
              <div className="flex-auto">
                <button
                  type="button"
                  onClick={() => setIsChecked(!isChecked)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isChecked ? "bg-sky-500" : "bg-gray-300 dark:bg-gray-600"}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isChecked ? "translate-x-6" : "translate-x-1"}`}
                  />
                </button>
              </div>
            </div>
          </div>
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
