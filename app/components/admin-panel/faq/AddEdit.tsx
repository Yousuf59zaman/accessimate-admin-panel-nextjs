"use client";

import React, { useCallback, useEffect, useState } from "react";
import { fetchAdmin } from "@/app/lib/fetchAdmin";
import ResponseModal from "@/app/components/ui/ResponseModal";
import { typetList } from "@/app/helpers/globalFunctions";

interface FaqItem {
  id?: number;
  title?: string;
  type?: number;
  cat_id?: number | string;
  embed_url?: string;
  attachment?: string;
  description?: string;
  status?: number;
}
interface FormData {
  title: string;
  type: number | string;
  cat_id: number | string;
  embed_url: string;
  attachment: string;
  description: string;
  status: number;
}
interface SubmitApiResponse {
  status: boolean;
  message?: string;
  data: FaqItem;
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
  item: FaqItem | null;
  modalTitle: string;
  onClose: () => void;
  onSave: (item: FaqItem) => void;
}

const emptyForm: FormData = {
  title: "",
  type: "",
  cat_id: "",
  embed_url: "",
  attachment: "",
  description: "",
  status: 0,
};
const skipValidations = [
  "id",
  "status",
  "embed_url",
  "attachment",
  "description",
];

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
  const [categories, setCategories] = useState<{ id: number; title: string }[]>(
    [],
  );
  const typeList = typetList();

  useEffect(() => {
    if (isOpen) {
      fetchAdmin<{ data?: { data?: { id: number; title: string }[] } }>(
        "admin/faq-categories",
      ).then((res) => {
        if (res?.data?.data) {
          setCategories(res.data.data);
        }
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (item && Object.keys(item).length > 0) {
      setValidationErrors({});
      setFormData({
        title: item.title || "",
        type: item.type || "",
        cat_id: item.cat_id || "",
        embed_url: item.embed_url || "",
        attachment: item.attachment || "",
        description: item.description || "",
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
        isEdit ? `admin/faqs/${item?.id}` : "admin/faqs",
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

  const handleTypeChange = (value: string | number) => {
    updateField("type", value);
    updateField("embed_url", "");
    updateField("attachment", "");
    updateField("description", "");
  };

  if (!isOpen) return null;
  const inputClass = (field: string) =>
    `w-full border rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-sky-500 ${validationErrors[field] ? "border-red-500" : "border-gray-300 dark:border-gray-600"}`;

  return (
    <>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4 animate-modal-enter max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center w-full gap-2 p-4 border-b border-gray-200 dark:border-gray-700">
            <h4 className="text-xl font-semibold text-gray-900 dark:text-white">
              {modalTitle} Faq
            </h4>
          </div>
          <div className="grid grid-cols-1 gap-4 p-6">
            <div className="flex items-center gap-4">
              <label className="font-semibold w-32 text-gray-900 dark:text-white">
                Title
              </label>
              <div className="flex-auto">
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
            </div>

            <div className="flex items-center gap-4">
              <label className="font-semibold w-32 text-gray-900 dark:text-white">
                Category
              </label>
              <div className="flex-auto">
                <select
                  value={formData.cat_id}
                  onChange={(e) => updateField("cat_id", e.target.value)}
                  className={inputClass("cat_id")}
                >
                  <option value="">Select Category</option>
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
            </div>

            <div className="flex items-center gap-4">
              <label className="font-semibold w-32 text-gray-900 dark:text-white">
                Type
              </label>
              <div className="flex-auto">
                <select
                  value={formData.type}
                  onChange={(e) => handleTypeChange(e.target.value)}
                  className={inputClass("type")}
                >
                  <option value="">Select Type</option>
                  {typeList.map((type) => (
                    <option key={type.id ?? ""} value={type.id ?? ""}>
                      {type.name}
                    </option>
                  ))}
                </select>
                {validationErrors.type && (
                  <p className="text-red-500 text-sm mt-1">
                    {validationErrors.type}
                  </p>
                )}
              </div>
            </div>

            {String(formData.type) === "1" && (
              <div className="flex items-center gap-4">
                <label className="font-semibold w-32 text-gray-900 dark:text-white">
                  Description
                </label>
                <div className="flex-auto">
                  <textarea
                    value={formData.description}
                    onChange={(e) => updateField("description", e.target.value)}
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
            )}

            {String(formData.type) === "2" && (
              <div className="flex items-center gap-4">
                <label className="font-semibold w-32 text-gray-900 dark:text-white">
                  Upload Image
                </label>
                <div className="flex-auto">
                  <div className="w-full mt-2">
                    {formData.attachment ? (
                      <img
                        src={formData.attachment}
                        alt="FAQ Image"
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
                          setValidationErrors((prev) => ({
                            ...prev,
                            attachment: "",
                          }));
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            updateField(
                              "attachment",
                              ev.target?.result as string,
                            );
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </div>
                  {validationErrors.attachment && (
                    <p className="text-red-500 text-sm mt-1">
                      {validationErrors.attachment}
                    </p>
                  )}
                </div>
              </div>
            )}

            {String(formData.type) === "3" && (
              <div className="flex items-center gap-4">
                <label className="font-semibold w-32 text-gray-900 dark:text-white">
                  File Upload
                </label>
                <div className="flex-auto">
                  <div className="w-full mt-2">
                    {formData.attachment ? (
                      <div className="w-48 h-16 bg-gray-50 dark:bg-gray-700/50 rounded-md flex items-center justify-center text-gray-600 dark:text-gray-300 text-sm px-2 truncate">
                        <i className="fa fa-file mr-2" />
                        {formData.attachment.startsWith("data:")
                          ? "File selected"
                          : formData.attachment}
                      </div>
                    ) : (
                      <div className="w-48 h-16 bg-gray-100 dark:bg-gray-700 rounded-md flex items-center justify-center text-gray-400">
                        <i className="fa fa-file text-2xl" />
                      </div>
                    )}
                    <input
                      type="file"
                      className="mt-3 block w-full text-sm text-gray-600 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100 dark:file:bg-sky-900/30 dark:file:text-sky-400"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setValidationErrors((prev) => ({
                            ...prev,
                            attachment: "",
                          }));
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            updateField(
                              "attachment",
                              ev.target?.result as string,
                            );
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </div>
                  {validationErrors.attachment && (
                    <p className="text-red-500 text-sm mt-1">
                      {validationErrors.attachment}
                    </p>
                  )}
                </div>
              </div>
            )}

            {String(formData.type) === "4" && (
              <div className="flex items-center gap-4">
                <label className="font-semibold w-32 text-gray-900 dark:text-white">
                  Embed URL
                </label>
                <div className="flex-auto">
                  <input
                    type="text"
                    value={formData.embed_url}
                    onChange={(e) => updateField("embed_url", e.target.value)}
                    placeholder="i.e https://www.youtube.com/watch?v=..."
                    className={inputClass("embed_url")}
                  />
                  {validationErrors.embed_url && (
                    <p className="text-red-500 text-sm mt-1">
                      {validationErrors.embed_url}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center gap-4">
              <label className="font-semibold w-32 text-gray-900 dark:text-white">
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
