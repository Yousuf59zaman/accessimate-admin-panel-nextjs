"use client";

import React, { useCallback, useEffect, useState } from "react";
import { fetchAdmin } from "@/app/lib/fetchAdmin";
import ResponseModal from "@/app/components/ui/ResponseModal";

interface EventItem {
  id?: number;
  title?: string;
  slug?: string;
  photo?: string;
  description?: string;
  category_id?: number | string;
  status?: number;
  details?: DetailItem[];
}
interface DetailItem {
  year_id?: number | string;
  venue?: string;
  start_date?: string;
  end_date?: string;
  status?: number | boolean;
}
interface FormData {
  title: string;
  slug: string;
  photo: string;
  description: string;
  category_id: string;
  status: number;
  details: DetailItem[];
}
interface CategoryOption {
  id: number;
  title: string;
}
interface SubmitApiResponse {
  status: boolean;
  message?: string;
  data: EventItem;
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
  item: EventItem | null;
  modalTitle: string;
  onClose: () => void;
  onSave: (item: EventItem) => void;
}

const emptyForm: FormData = {
  title: "",
  slug: "",
  photo: "",
  description: "",
  category_id: "",
  status: 0,
  details: [],
};
const skipValidations = ["id", "status", "details", "photo"];

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
  const [categoryData, setCategoryData] = useState<CategoryOption[]>([]);
  const [yearData, setYearData] = useState<{ id: number; year: string }[]>([]);

  // Load categories and years on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await fetchAdmin<{ data: { data: CategoryOption[] } }>(
          "admin/event-categories/all",
          { method: "POST" },
        );
        setCategoryData(res.data.data);
      } catch {
        /* ignore */
      }
    };
    const loadYears = async () => {
      try {
        const res = await fetchAdmin<{
          data: { data: { id: number; year: string }[] };
        }>("admin/years/all", { method: "POST" });
        setYearData(res.data.data);
      } catch {
        /* ignore */
      }
    };
    if (isOpen) {
      loadCategories();
      loadYears();
    }
  }, [isOpen]);

  useEffect(() => {
    if (item && Object.keys(item).length > 0) {
      setValidationErrors({});
      setFormData({
        title: item.title || "",
        slug: item.slug || "",
        photo: item.photo || "",
        description: item.description || "",
        category_id: String(item.category_id || ""),
        status: item.status || 0,
        details: item.details
          ? item.details.map((d) => ({
              ...d,
              status: d.status === 1 || d.status === true,
            }))
          : [],
      });
      setIsChecked(item.status === 1);
    } else {
      setFormData({ ...emptyForm, details: [] });
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
      const submitData = {
        ...formData,
        status: isChecked ? 1 : 0,
        details: formData.details.map((d) => ({
          year_id: d.year_id,
          venue: d.venue,
          start_date: d.start_date,
          end_date: d.end_date,
          status: d.status ? 1 : 0,
        })),
      };
      if (
        typeof submitData.photo === "string" &&
        submitData.photo.startsWith("http")
      ) {
        delete (submitData as Record<string, unknown>).photo;
      }
      const isEdit = modalTitle !== "Create";
      const result = await fetchAdmin<SubmitApiResponse>(
        isEdit ? `admin/events/${item?.id}` : "admin/events",
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

  // Details management
  const [openDetails, setOpenDetails] = useState(false);
  const [detailIndex, setDetailIndex] = useState<number | null>(null);
  const [detailForm, setDetailForm] = useState<{
    year_id: string;
    venue: string;
    start_date: string;
    end_date: string;
    status: boolean;
  }>({ year_id: "", venue: "", start_date: "", end_date: "", status: false });

  const addDetails = () => {
    setDetailIndex(null);
    setDetailForm({
      year_id: "",
      venue: "",
      start_date: "",
      end_date: "",
      status: false,
    });
    setOpenDetails(true);
    setValidationErrors({});
  };
  const editDetails = (index: number) => {
    const d = formData.details[index];
    setDetailIndex(index);
    setDetailForm({
      year_id: String(d.year_id || ""),
      venue: d.venue || "",
      start_date: d.start_date || "",
      end_date: d.end_date || "",
      status: d.status === true || d.status === 1,
    });
    setOpenDetails(true);
    setValidationErrors({});
  };
  const removeDetails = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      details: prev.details.filter((_, i) => i !== index),
    }));
  };
  const saveDetails = () => {
    const errs: Record<string, string> = {};
    if (!detailForm.year_id) errs.year_id = "* required";
    if (!detailForm.venue) errs.venue = "* required";
    if (!detailForm.start_date) errs.start_date = "* required";
    if (!detailForm.end_date) errs.end_date = "* required";
    if (
      detailForm.start_date &&
      detailForm.end_date &&
      new Date(detailForm.end_date) <= new Date(detailForm.start_date)
    ) {
      errs.end_date = "End date must be after start date";
    }
    if (Object.keys(errs).length) {
      setValidationErrors(errs);
      return;
    }
    const detail: DetailItem = {
      year_id: Number(detailForm.year_id),
      venue: detailForm.venue,
      start_date: detailForm.start_date,
      end_date: detailForm.end_date,
      status: detailForm.status,
    };
    if (detailIndex !== null) {
      setFormData((prev) => ({
        ...prev,
        details: prev.details.map((d, i) => (i === detailIndex ? detail : d)),
      }));
    } else {
      setFormData((prev) => ({ ...prev, details: [...prev.details, detail] }));
    }
    setOpenDetails(false);
    setValidationErrors({});
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
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-5xl mx-4 animate-modal-enter max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-center w-full gap-2 p-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
              <h4 className="text-xl font-semibold text-gray-900 dark:text-white">
                {modalTitle} Events
              </h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-6 overflow-y-auto">
              {/* Title & Slug */}
              <div className="col-span-1 sm:col-span-2 flex items-center gap-4">
                <div className="flex-auto">
                  <label className="font-semibold text-gray-900 dark:text-white">
                    Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => updateField("title", e.target.value)}
                    placeholder="i.e. Event Title"
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
                <div className="flex-auto">
                  <label className="font-semibold text-gray-900 dark:text-white">
                    Slug
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => updateField("slug", e.target.value)}
                    placeholder="i.e. event-slug"
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
              {/* Category */}
              <div className="col-span-1 flex items-center gap-4">
                <div className="flex-auto">
                  <label className="font-semibold text-gray-900 dark:text-white">
                    Category
                  </label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => updateField("category_id", e.target.value)}
                    className={inputClass("category_id")}
                    onFocus={() =>
                      setValidationErrors((prev) => ({
                        ...prev,
                        category_id: "",
                      }))
                    }
                  >
                    <option value="">Select</option>
                    {categoryData.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                  {validationErrors.category_id && (
                    <p className="text-red-500 text-sm mt-1">
                      {validationErrors.category_id}
                    </p>
                  )}
                </div>
              </div>
              {/* Description */}
              <div className="col-span-1 sm:col-span-3 flex items-center gap-4">
                <div className="flex-auto">
                  <label className="font-semibold text-gray-900 dark:text-white">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => updateField("description", e.target.value)}
                    placeholder="i.e. Event Description"
                    className={inputClass("description")}
                    rows={5}
                    onFocus={() =>
                      setValidationErrors((prev) => ({
                        ...prev,
                        description: "",
                      }))
                    }
                  />
                  {validationErrors.description && (
                    <p className="text-red-500 text-sm mt-1">
                      {validationErrors.description}
                    </p>
                  )}
                </div>
              </div>
              {/* Status */}
              <div className="col-span-1 flex items-end gap-4">
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
              {/* Details Section */}
              <div className="col-span-1 sm:col-span-3">
                <div className="flex items-center justify-between gap-3 pb-2 mb-4 border-b border-gray-200 dark:border-gray-700">
                  <label className="font-semibold text-gray-900 dark:text-white">
                    Details
                  </label>
                  <i
                    onClick={addDetails}
                    className="fa-solid fa-plus cursor-pointer bg-sky-200 dark:bg-sky-900 hover:dark:bg-sky-400 text-sky-500 dark:text-sky-200 hover:text-sky-800 p-2 text-[12px] h-[26px] w-[26px] flex items-center justify-center rounded-full"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  {formData.details.map((d, index) => (
                    <div
                      key={index}
                      className="rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md p-4 bg-white dark:bg-gray-900 relative group transition-all duration-300"
                    >
                      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                        <button
                          onClick={() => editDetails(index)}
                          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                          title="Edit"
                        >
                          <i className="fas fa-edit text-emerald-600 text-sm" />
                        </button>
                        <button
                          onClick={() => removeDetails(index)}
                          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                          title="Delete"
                        >
                          <i className="fas fa-trash-alt text-red-600 text-sm" />
                        </button>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/30">
                            <i className="fas fa-calendar-alt text-indigo-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Year
                            </p>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {yearData.find((y) => y.id === Number(d.year_id))
                                ?.year || d.year_id}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/30">
                            <i className="fas fa-map-marker-alt text-emerald-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Venue
                            </p>
                            <p className="font-medium text-gray-800 dark:text-gray-200 line-clamp-2">
                              {d.venue}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30">
                            <i className="fas fa-hourglass-start text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Start Date
                            </p>
                            <p className="font-medium text-gray-800 dark:text-gray-200">
                              {d.start_date}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/30">
                            <i className="fas fa-hourglass-end text-purple-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                              End Date
                            </p>
                            <p className="font-medium text-gray-800 dark:text-gray-200">
                              {d.end_date}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status:
                          </span>
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${d.status ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
                          >
                            {d.status ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
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
      )}
      {/* Details Drawer */}
      {openDetails && (
        <div className="fixed inset-0 z-[10000] flex justify-end">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setOpenDetails(false)}
          />
          <div className="relative bg-white dark:bg-gray-800 w-full md:w-[30rem] h-full shadow-xl flex flex-col animate-slide-in-right">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                {detailIndex !== null ? "Edit" : "Add"} Detail
              </h4>
            </div>
            <div className="grid grid-cols-1 gap-4 p-4 overflow-y-auto flex-1">
              <div>
                <label className="font-semibold text-gray-900 dark:text-white">
                  Year
                </label>
                {validationErrors.year_id && (
                  <span className="text-red-500 text-sm ml-2">
                    {validationErrors.year_id}
                  </span>
                )}
                <select
                  value={detailForm.year_id}
                  onChange={(e) => {
                    setDetailForm((p) => ({ ...p, year_id: e.target.value }));
                    setValidationErrors((p) => ({ ...p, year_id: "" }));
                  }}
                  className={inputClass("year_id")}
                >
                  <option value="">Select</option>
                  {yearData.map((y) => (
                    <option key={y.id} value={y.id}>
                      {y.year}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-semibold text-gray-900 dark:text-white">
                  Venue
                </label>
                {validationErrors.venue && (
                  <span className="text-red-500 text-sm ml-2">
                    {validationErrors.venue}
                  </span>
                )}
                <textarea
                  value={detailForm.venue}
                  onChange={(e) => {
                    setDetailForm((p) => ({ ...p, venue: e.target.value }));
                    setValidationErrors((p) => ({ ...p, venue: "" }));
                  }}
                  className={inputClass("venue")}
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-gray-900 dark:text-white">
                    Start Date
                  </label>
                  <input
                    type="datetime-local"
                    value={detailForm.start_date}
                    onChange={(e) => {
                      setDetailForm((p) => ({
                        ...p,
                        start_date: e.target.value,
                      }));
                      setValidationErrors((p) => ({ ...p, start_date: "" }));
                    }}
                    className={inputClass("start_date")}
                  />
                  {validationErrors.start_date && (
                    <p className="text-red-500 text-sm mt-1">
                      {validationErrors.start_date}
                    </p>
                  )}
                </div>
                <div>
                  <label className="font-semibold text-gray-900 dark:text-white">
                    End Date
                  </label>
                  <input
                    type="datetime-local"
                    value={detailForm.end_date}
                    onChange={(e) => {
                      setDetailForm((p) => ({
                        ...p,
                        end_date: e.target.value,
                      }));
                      setValidationErrors((p) => ({ ...p, end_date: "" }));
                    }}
                    className={inputClass("end_date")}
                  />
                  {validationErrors.end_date && (
                    <p className="text-red-500 text-sm mt-1">
                      {validationErrors.end_date}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <label className="font-semibold text-gray-900 dark:text-white">
                  Status
                </label>
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() =>
                      setDetailForm((p) => ({ ...p, status: !p.status }))
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${detailForm.status ? "bg-sky-500" : "bg-gray-300 dark:bg-gray-600"}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${detailForm.status ? "translate-x-6" : "translate-x-1"}`}
                    />
                  </button>
                </div>
              </div>
            </div>
            <div className="flex justify-end items-center gap-3 p-4 border-t border-gray-200 dark:border-gray-700 shrink-0">
              <button
                type="button"
                onClick={() => setOpenDetails(false)}
                className="px-4 py-2 border border-red-500 text-red-500 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-300 hover:scale-105 flex items-center gap-2"
              >
                <i className="pi pi-times-circle" />
                Cancel
              </button>
              <button
                type="button"
                onClick={saveDetails}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center gap-2"
              >
                <i className="pi pi-check-circle" />
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
