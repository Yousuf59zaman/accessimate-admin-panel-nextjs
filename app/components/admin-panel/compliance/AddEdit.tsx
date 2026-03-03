"use client";

import React, { useCallback, useEffect, useState } from "react";
import { fetchAdmin } from "@/app/lib/fetchAdmin";
import ResponseModal from "@/app/components/ui/ResponseModal";

interface DetailItem {
  title: string;
  details: string;
  price: number | string;
  status: boolean | number;
}
interface ComplianceItem {
  id?: number;
  title?: string;
  slug?: string;
  description?: string;
  status?: number;
  images?: string;
  icon?: string;
  color?: string;
  totalPrice?: string;
  details?: DetailItem[];
}
interface FormData {
  title: string;
  slug: string;
  description: string;
  status: number;
  images: string;
  icon: string;
  color: string;
  totalPrice: string;
  details: DetailItem[];
}
interface SubmitApiResponse {
  status: boolean;
  message?: string;
  data: ComplianceItem;
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
  item: ComplianceItem | null;
  modalTitle: string;
  onClose: () => void;
  onSave: (item: ComplianceItem) => void;
}

const emptyForm: FormData = {
  title: "",
  slug: "",
  description: "",
  status: 0,
  images: "",
  icon: "fas fa-upload",
  color: "0077ff",
  totalPrice: "",
  details: [],
};
const skipValidations = ["id", "status", "details"];

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
  const [expandedPanels, setExpandedPanels] = useState<Record<number, boolean>>(
    {},
  );

  useEffect(() => {
    if (item && Object.keys(item).length > 0) {
      setValidationErrors({});
      setFormData({
        title: item.title || "",
        slug: item.slug || "",
        description: item.description || "",
        status: item.status || 0,
        images: item.images || "",
        icon: item.icon || "fas fa-upload",
        color: item.color || "0077ff",
        totalPrice: item.totalPrice || "",
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
      setExpandedPanels({});
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
      const submitImages = formData.images;
      const shouldSkipImages =
        submitImages.includes("http") || submitImages.includes("https");
      const submitData = {
        ...formData,
        ...(shouldSkipImages ? {} : { images: submitImages }),
        status: isChecked ? 1 : 0,
        details: formData.details.map((d) => ({
          ...d,
          status: d.status ? 1 : 0,
        })),
      };
      if (shouldSkipImages)
        delete (submitData as Record<string, unknown>).images;
      const isEdit = modalTitle !== "Create";
      const result = await fetchAdmin<SubmitApiResponse>(
        isEdit ? `admin/compliances/${item?.id}` : "admin/compliances",
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

  // Details CRUD
  const addDetail = () => {
    setFormData((prev) => ({
      ...prev,
      details: [
        ...prev.details,
        { title: "", details: "", price: "", status: false },
      ],
    }));
  };
  const removeDetail = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      details: prev.details.filter((_, i) => i !== index),
    }));
  };
  const updateDetail = (
    index: number,
    field: keyof DetailItem,
    value: string | number | boolean,
  ) => {
    setFormData((prev) => {
      const details = [...prev.details];
      details[index] = { ...details[index], [field]: value };
      return { ...prev, details };
    });
  };
  const togglePanel = (index: number) => {
    setExpandedPanels((prev) => ({ ...prev, [index]: !prev[index] }));
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
              {modalTitle} Compliance
            </h4>
          </div>
          <div className="p-6 overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Image */}
              <div className="col-span-1">
                <label className="font-semibold block mb-1 text-gray-900 dark:text-white">
                  Image
                </label>
                <input
                  type="text"
                  value={formData.images}
                  onChange={(e) => updateField("images", e.target.value)}
                  placeholder="Image URL or upload"
                  className={inputClass("images")}
                  autoComplete="off"
                  onFocus={() =>
                    setValidationErrors((prev) => ({ ...prev, images: "" }))
                  }
                />
                {validationErrors.images && (
                  <p className="text-red-500 text-sm mt-1">
                    {validationErrors.images}
                  </p>
                )}
              </div>
              {/* Description - col-span-2 */}
              <div className="col-span-1 sm:col-span-2">
                <label className="font-semibold block mb-1 text-gray-900 dark:text-white">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  placeholder="i.e. Write your description here"
                  className={inputClass("description")}
                  rows={7}
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
              {/* Title */}
              <div className="col-span-1">
                <label className="font-semibold block mb-1 text-gray-900 dark:text-white">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  placeholder="i.e. Web Development"
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
              {/* Slug */}
              <div className="col-span-1">
                <label className="font-semibold block mb-1 text-gray-900 dark:text-white">
                  Slug
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => updateField("slug", e.target.value)}
                  placeholder="i.e. web-development"
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
              {/* Total Price */}
              <div className="col-span-1">
                <label className="font-semibold block mb-1 text-gray-900 dark:text-white">
                  Total Price
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.totalPrice}
                  onChange={(e) => updateField("totalPrice", e.target.value)}
                  placeholder="0.00"
                  className={inputClass("totalPrice")}
                  autoComplete="off"
                  onFocus={() =>
                    setValidationErrors((prev) => ({ ...prev, totalPrice: "" }))
                  }
                />
                {validationErrors.totalPrice && (
                  <p className="text-red-500 text-sm mt-1">
                    {validationErrors.totalPrice}
                  </p>
                )}
              </div>
              {/* Icon + Color - col-span-2 */}
              <div className="col-span-1 sm:col-span-2 flex items-center gap-4">
                <label className="font-semibold min-w-[7rem] text-gray-900 dark:text-white">
                  Icon
                </label>
                <div className="grid grid-cols-2 gap-4 w-full">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <i
                        className={`text-[30px] cursor-pointer ${formData.icon}`}
                        style={{ color: `#${formData.color}` }}
                      />
                    </div>
                    <input
                      type="text"
                      value={formData.icon}
                      onChange={(e) => updateField("icon", e.target.value)}
                      placeholder="fas fa-upload"
                      className={inputClass("icon")}
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="font-semibold text-gray-900 dark:text-white">
                      Icon Color
                    </label>
                    <div className="flex-auto flex items-center gap-2">
                      <input
                        type="color"
                        value={`#${formData.color}`}
                        onChange={(e) =>
                          updateField("color", e.target.value.replace("#", ""))
                        }
                        className="w-10 h-10 rounded cursor-pointer border-0 p-0"
                      />
                      <input
                        type="text"
                        value={formData.color}
                        onChange={(e) => updateField("color", e.target.value)}
                        className={inputClass("color")}
                        placeholder="0077ff"
                      />
                    </div>
                  </div>
                </div>
              </div>
              {/* Status */}
              <div className="col-span-1 flex items-center gap-4">
                <label className="font-semibold text-gray-900 dark:text-white">
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

              {/* Details Accordion - full width */}
              <div className="col-span-1 sm:col-span-3">
                <div className="flex items-center gap-3 mb-2">
                  <label className="font-semibold text-gray-900 dark:text-white">
                    Details
                  </label>
                  {validationErrors.details && (
                    <span className="text-red-500 text-sm">
                      {validationErrors.details}
                    </span>
                  )}
                </div>
                {formData.details.length > 0 && (
                  <div className="border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg bg-white dark:bg-gray-800 mt-3 mb-4">
                    {formData.details.map((detail, index) => (
                      <div
                        key={index}
                        className="border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                      >
                        {/* Accordion Header */}
                        <button
                          type="button"
                          onClick={() => togglePanel(index)}
                          className="w-full flex justify-between items-center px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <span className="font-medium text-gray-900 dark:text-white">
                            {detail.title || `Detail ${index + 1}`}
                          </span>
                          <div className="flex items-center gap-2">
                            <span
                              className="px-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeDetail(index);
                              }}
                            >
                              <i className="fa-solid fa-trash cursor-pointer text-red-500 hover:text-red-700 transition duration-150 ease-in-out" />
                            </span>
                            <i
                              className={`fa-solid fa-chevron-down transition-transform duration-200 text-gray-500 ${expandedPanels[index] ? "rotate-180" : ""}`}
                            />
                          </div>
                        </button>
                        {/* Accordion Content */}
                        {expandedPanels[index] && (
                          <div className="border-t border-gray-300 dark:border-gray-600 pt-4 px-4 pb-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              <div>
                                <label className="font-semibold block mb-1 text-gray-900 dark:text-white">
                                  Title
                                </label>
                                <input
                                  type="text"
                                  value={detail.title}
                                  onChange={(e) =>
                                    updateDetail(index, "title", e.target.value)
                                  }
                                  className={inputClass(
                                    `detail_title_${index}`,
                                  )}
                                />
                              </div>
                              <div>
                                <label className="font-semibold block mb-1 text-gray-900 dark:text-white">
                                  Price
                                </label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={detail.price || ""}
                                  onChange={(e) =>
                                    updateDetail(
                                      index,
                                      "price",
                                      parseFloat(e.target.value) || 0,
                                    )
                                  }
                                  className={inputClass(
                                    `detail_price_${index}`,
                                  )}
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="font-semibold text-gray-900 dark:text-white">
                                  Status
                                </label>
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateDetail(
                                      index,
                                      "status",
                                      !detail.status,
                                    )
                                  }
                                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${detail.status ? "bg-sky-500" : "bg-gray-300 dark:bg-gray-600"}`}
                                >
                                  <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${detail.status ? "translate-x-6" : "translate-x-1"}`}
                                  />
                                </button>
                              </div>
                              <div className="col-span-1 sm:col-span-3">
                                <label className="font-semibold block mb-1 text-gray-900 dark:text-white">
                                  Details
                                </label>
                                <textarea
                                  value={detail.details}
                                  onChange={(e) =>
                                    updateDetail(
                                      index,
                                      "details",
                                      e.target.value,
                                    )
                                  }
                                  className={inputClass(
                                    `detail_details_${index}`,
                                  )}
                                  rows={6}
                                  placeholder="Write details here..."
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    type="button"
                    onClick={addDetail}
                    className="flex items-center px-3 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600 transition-colors"
                  >
                    <i className="fa-solid fa-plus text-white text-md" />
                  </button>
                </div>
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
