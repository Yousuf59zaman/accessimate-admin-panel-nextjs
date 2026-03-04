"use client";

import React, { useCallback, useEffect, useState } from "react";
import { fetchAdmin } from "@/app/lib/fetchAdmin";
import ResponseModal from "@/app/components/ui/ResponseModal";

interface PortfolioItem {
  id?: number;
  title?: string;
  slug?: string;
  status?: number;
  cat_id?: number | string;
  photo?: string;
  description?: string;
  client_name?: string;
  project_url?: string;
  completion_date?: string;
  technologies?: string;
  category?: { id: number; title: string };
}
interface PortfolioFormData {
  title: string;
  slug: string;
  cat_id: number | string;
  photo: string;
  description: string;
  client_name: string;
  project_url: string;
  completion_date: string;
  technologies: string;
  status: number;
}
interface SubmitApiResponse {
  status: boolean;
  message?: string;
  data: PortfolioItem;
}
interface FetchError extends Error {
  response?: Response;
  data?: {
    status?: boolean;
    message?: string;
    data?: Record<string, string[]>;
    errors?: Record<string, string[]>;
  };
}
interface AddEditProps {
  isOpen: boolean;
  item: PortfolioItem | null;
  modalTitle: string;
  categories: { id: number; title: string }[];
  onClose: () => void;
  onSave: (item: PortfolioItem) => void;
}

const emptyForm: PortfolioFormData = {
  title: "",
  slug: "",
  cat_id: "",
  photo: "",
  description: "",
  client_name: "",
  project_url: "",
  completion_date: "",
  technologies: "",
  status: 0,
};
const skipValidations = ["status", "photo"];

export default function AddEdit({
  isOpen,
  item,
  modalTitle,
  categories,
  onClose,
  onSave,
}: AddEditProps) {
  const [formData, setFormData] = useState<PortfolioFormData>({ ...emptyForm });
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
        slug: item.slug || "",
        cat_id: item.cat_id || (item.category ? item.category.id : ""),
        photo: item.photo || "",
        description: item.description || "",
        client_name: item.client_name || "",
        project_url: item.project_url || "",
        completion_date: item.completion_date || "",
        technologies: item.technologies || "",
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
    (field: keyof PortfolioFormData, value: string | number) => {
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
      const submitData: Record<string, unknown> = {
        ...formData,
        status: isChecked ? 1 : 0,
      };
      // If photo is an existing URL, don't re-send it (matches Nuxt behavior)
      if (
        typeof submitData.photo === "string" &&
        (submitData.photo as string).startsWith("http")
      ) {
        delete submitData.photo;
      }
      const isEdit = modalTitle !== "Create";
      const result = await fetchAdmin<SubmitApiResponse>(
        isEdit ? `admin/portfolios/${item?.id}` : "admin/portfolios",
        { method: isEdit ? "PUT" : "POST", body: submitData },
      );
      if (result?.status === true) {
        setResponseModal(result as unknown as Record<string, unknown>);
        onSave(result.data);
      }
    } catch (e: unknown) {
      const error = e as FetchError;
      if (error?.response?.status === 404 || error?.response?.status === 422) {
        const errorData = error.data?.data || error.data?.errors;
        if (errorData) {
          const se: Record<string, string> = {};
          for (const [key, val] of Object.entries(errorData)) {
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

  if (!isOpen) return null;
  const inputClass = (field: string) =>
    `w-full border rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-sky-500 ${validationErrors[field] ? "border-red-500" : "border-gray-300 dark:border-gray-600"}`;

  return (
    <>
      <div className="fixed inset-0 z-9999 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl mx-4 animate-modal-enter max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-center w-full gap-2 p-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
            <h4 className="text-xl font-semibold text-gray-900 dark:text-white">
              {modalTitle} Portfolios
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-6 overflow-y-auto">
            {/* Row 1: Upload Image */}
            <div className="col-span-1 sm:col-span-3">
              <label className="font-semibold block mb-1 text-gray-900 dark:text-white">
                Upload Image
              </label>
              <div className="w-full mt-2">
                {formData.photo ? (
                  <img
                    src={formData.photo}
                    alt="Portfolio Image"
                    className="w-48 h-32 object-cover rounded-md bg-gray-50 dark:bg-gray-700/50 p-1"
                  />
                ) : (
                  <div className="w-48 h-32 bg-gray-100 dark:bg-gray-700 rounded-md flex items-center justify-center text-gray-400">
                    <i className="fa fa-camera text-2xl" />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="mt-3 block w-full text-sm text-gray-600 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100 dark:file:bg-sky-900/30 dark:file:text-sky-400"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setValidationErrors((prev) => ({ ...prev, photo: "" }));
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        updateField("photo", ev.target?.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </div>
              {validationErrors.photo && (
                <p className="text-red-500 text-sm mt-1">
                  {validationErrors.photo}
                </p>
              )}
            </div>
            <div className="col-span-1 hidden sm:block" />
            <div className="col-span-1 hidden sm:block" />

            {/* Row 2: Title, Category, Slug */}
            <div className="col-span-1">
              <label className="font-semibold block mb-1 text-gray-900 dark:text-white">
                Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => updateField("title", e.target.value)}
                placeholder="i.e How to use this website?"
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
            <div className="col-span-1">
              <label className="font-semibold block mb-1 text-gray-900 dark:text-white">
                Category
              </label>
              <select
                value={formData.cat_id}
                onChange={(e) => updateField("cat_id", e.target.value)}
                className={inputClass("cat_id")}
                onFocus={() =>
                  setValidationErrors((prev) => ({ ...prev, cat_id: "" }))
                }
              >
                <option value="" disabled>
                  Select Category
                </option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.title}
                  </option>
                ))}
              </select>
              {validationErrors.cat_id && (
                <p className="text-red-500 text-sm mt-1">
                  {validationErrors.cat_id}
                </p>
              )}
            </div>
            <div className="col-span-1">
              <label className="font-semibold block mb-1 text-gray-900 dark:text-white">
                Slug
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => updateField("slug", e.target.value)}
                placeholder="i.e https://example-slug"
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

            {/* Row 3: Client Name, Project URL, Completion Date */}
            <div className="col-span-1">
              <label className="font-semibold block mb-1 text-gray-900 dark:text-white">
                Client Name
              </label>
              <input
                type="text"
                value={formData.client_name}
                onChange={(e) => updateField("client_name", e.target.value)}
                placeholder="i.e Jhon Doe"
                className={inputClass("client_name")}
                autoComplete="off"
                onFocus={() =>
                  setValidationErrors((prev) => ({ ...prev, client_name: "" }))
                }
              />
              {validationErrors.client_name && (
                <p className="text-red-500 text-sm mt-1">
                  {validationErrors.client_name}
                </p>
              )}
            </div>
            <div className="col-span-1">
              <label className="font-semibold block mb-1 text-gray-900 dark:text-white">
                Project Url
              </label>
              <input
                type="text"
                value={formData.project_url}
                onChange={(e) => updateField("project_url", e.target.value)}
                placeholder="i.e https://example.com"
                className={inputClass("project_url")}
                autoComplete="off"
                onFocus={() =>
                  setValidationErrors((prev) => ({ ...prev, project_url: "" }))
                }
              />
              {validationErrors.project_url && (
                <p className="text-red-500 text-sm mt-1">
                  {validationErrors.project_url}
                </p>
              )}
            </div>
            <div className="col-span-1">
              <label className="font-semibold block mb-1 text-gray-900 dark:text-white">
                Completion Date
              </label>
              <input
                type="date"
                value={formData.completion_date}
                onChange={(e) => updateField("completion_date", e.target.value)}
                className={inputClass("completion_date")}
                autoComplete="off"
                onFocus={() =>
                  setValidationErrors((prev) => ({
                    ...prev,
                    completion_date: "",
                  }))
                }
              />
              {validationErrors.completion_date && (
                <p className="text-red-500 text-sm mt-1">
                  {validationErrors.completion_date}
                </p>
              )}
            </div>

            {/* Row 4: Description (full width) */}
            <div className="col-span-1 sm:col-span-3">
              <label className="font-semibold block mb-1 text-gray-900 dark:text-white">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => updateField("description", e.target.value)}
                className={inputClass("description")}
                rows={5}
                onFocus={() =>
                  setValidationErrors((prev) => ({ ...prev, description: "" }))
                }
              />
              {validationErrors.description && (
                <p className="text-red-500 text-sm mt-1">
                  {validationErrors.description}
                </p>
              )}
            </div>

            {/* Row 5: Technologies, Status */}
            <div className="col-span-1">
              <label className="font-semibold block mb-1 text-gray-900 dark:text-white">
                Technologies
              </label>
              <input
                type="text"
                value={formData.technologies}
                onChange={(e) => updateField("technologies", e.target.value)}
                placeholder="i.e Vue, React, Laravel"
                className={inputClass("technologies")}
                autoComplete="off"
                onFocus={() =>
                  setValidationErrors((prev) => ({ ...prev, technologies: "" }))
                }
              />
              {validationErrors.technologies && (
                <p className="text-red-500 text-sm mt-1">
                  {validationErrors.technologies}
                </p>
              )}
            </div>
            <div className="col-span-1 flex items-end gap-4 pb-1">
              <label className="font-semibold w-14 mb-2 text-gray-900 dark:text-white">
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
          <div className="flex justify-end items-center gap-3 p-4 border-t border-gray-200 dark:border-gray-700 shrink-0">
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
    </>
  );
}
