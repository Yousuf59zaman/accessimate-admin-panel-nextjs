"use client";

import * as React from "react";
import { useCallback, useEffect, useState } from "react";
import { fetchAdmin } from "@/app/lib/fetchAdmin";
import ResponseModal from "@/app/components/ui/ResponseModal";

interface FooterGroupType {
  id: number;
  name: string;
}

interface FooterItem {
  id?: number;
  title?: string;
  link?: string;
  link_type?: string | number | null;
  group_type_id?: string | number | null;
  content?: string;
  status?: number;
}

interface FormData {
  title: string;
  link: string;
  link_type: string | number | null;
  group_type_id: string | number | null;
  content: string;
  status: number;
}

interface SubmitApiResponse {
  status: boolean;
  message?: string;
  data: FooterItem;
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
  item: FooterItem | null;
  modalTitle: string;
  onClose: () => void;
  onSave: (item: FooterItem) => void;
}

const emptyForm: FormData = {
  title: "",
  link: "",
  link_type: "",
  group_type_id: "",
  content: "",
  status: 0,
};

const skipValidations = ["id", "status", "content"];
const CONTENT_PREFIX = "/content";

const isType2 = (val: unknown) => Number(val) === 2;
const isType1 = (val: unknown) => Number(val) === 1;

const stripSlashPrefix = (val: unknown) => {
  if (typeof val !== "string") return "";
  let s = val.trim();
  while (s.startsWith("/")) s = s.slice(1);
  return s;
};
const withSlashPrefix = (val: unknown) => {
  const clean = stripSlashPrefix(val ?? "");
  return `/${clean}`;
};

const stripContentPrefix = (val: unknown) => {
  if (typeof val !== "string") return "";
  let s = val.trim();
  if (s.startsWith(CONTENT_PREFIX)) {
    s = s.slice(CONTENT_PREFIX.length);
  }
  while (s.startsWith("/")) {
    s = s.slice(1);
  }
  return s;
};
const withContentPrefix = (val: unknown) => {
  const clean = stripContentPrefix(val ?? "");
  return clean ? `${CONTENT_PREFIX}/${clean}` : CONTENT_PREFIX;
};

const linkTypeOptions = [
  { name: "Internal", value: "1" },
  { name: "External", value: "2" },
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
  const [isLoadingGroupTypes, setIsLoadingGroupTypes] = useState(false);
  const [footerGroupTypes, setFooterGroupTypes] = useState<FooterGroupType[]>(
    [],
  );
  const [responseModal, setResponseModal] = useState<Record<string, unknown>>(
    {},
  );

  useEffect(() => {
    if (isOpen) {
      loadFooterGroupTypes();
    }
  }, [isOpen]);

  const loadFooterGroupTypes = async () => {
    setIsLoadingGroupTypes(true);
    try {
      const res = await fetchAdmin<unknown>("admin/footer-group-types/all", {
        method: "POST",
      });
      const response = res as Record<string, unknown>;
      const innerData = response?.data as Record<string, unknown>;
      const data = innerData?.data ?? response?.data ?? [];

      setFooterGroupTypes(
        Array.isArray(data)
          ? (data as FooterGroupType[])
          : (Object.values(data) as FooterGroupType[]),
      );
    } catch {
      // Group types endpoint may not be available — degrade gracefully
      setFooterGroupTypes([]);
    } finally {
      setIsLoadingGroupTypes(false);
    }
  };

  useEffect(() => {
    if (item && Object.keys(item).length > 0) {
      setValidationErrors({});

      let parsedLink = item.link ?? "";
      if (isType2(item.link_type)) {
        parsedLink = stripContentPrefix(item.link ?? "");
      } else if (isType1(item.link_type)) {
        parsedLink = stripSlashPrefix(item.link ?? "");
      }

      setFormData({
        title: item.title ?? "",
        link: parsedLink,
        link_type: item.link_type ?? "",
        group_type_id: item.group_type_id ?? "",
        content: item.content ?? "",
        status: item.status || 0,
      });

      // Changed 'as any' to 'as unknown as boolean' to satisfy strict typing rules
      setIsChecked(
        item.status === 1 || (item.status as unknown as boolean) === true,
      );
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
      let finalLink = formData.link;
      if (isType2(formData.link_type)) {
        finalLink = withContentPrefix(formData.link);
      } else if (isType1(formData.link_type)) {
        finalLink = withSlashPrefix(formData.link);
      }

      const submitData = {
        ...formData,
        link: finalLink,
        status: isChecked ? 1 : 0,
      };

      const isEdit = modalTitle !== "Create";
      const result = await fetchAdmin<SubmitApiResponse>(
        isEdit ? `admin/footers/${item?.id}` : "admin/footers",
        { method: isEdit ? "PUT" : "POST", body: submitData },
      );
      if (result?.status === true) {
        setResponseModal(result as unknown as Record<string, unknown>);
        onSave(result.data);
      }
    } catch (e: unknown) {
      const error = e as FetchError;
      if (
        error?.response?.status === 404 ||
        error?.response?.status === 409 ||
        error?.response?.status === 422
      ) {
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
      <div className="fixed inset-0 z-[9999] flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl mx-4 animate-modal-enter max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-center w-full gap-2 p-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
            <h4 className="text-xl font-semibold text-gray-900 dark:text-white">
              {modalTitle} Footer
            </h4>
          </div>
          <div className="p-6 overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="col-span-1">
                <label className="font-semibold block mb-1 text-gray-900 dark:text-white">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  placeholder="i.e. Example Tag"
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
                  Group Type
                </label>
                {isLoadingGroupTypes ? (
                  <div className="w-full h-[38px] bg-white dark:bg-gray-700 rounded-md animate-pulse flex items-center px-3 border border-gray-300 dark:border-gray-600">
                    <div className="w-24 h-4 bg-gray-200 dark:bg-gray-600 rounded"></div>
                  </div>
                ) : (
                  <select
                    value={formData.group_type_id?.toString() || ""}
                    onChange={(e) =>
                      updateField("group_type_id", e.target.value)
                    }
                    className={inputClass("group_type_id")}
                    onFocus={() =>
                      setValidationErrors((prev) => ({
                        ...prev,
                        group_type_id: "",
                      }))
                    }
                  >
                    <option value="">Select Group Type</option>
                    {footerGroupTypes.map((gt) => (
                      <option key={gt.id} value={gt.id.toString()}>
                        {gt.name}
                      </option>
                    ))}
                  </select>
                )}
                {validationErrors.group_type_id && (
                  <p className="text-red-500 text-sm mt-1">
                    {validationErrors.group_type_id}
                  </p>
                )}
              </div>

              <div className="col-span-1">
                <label className="font-semibold block mb-1 text-gray-900 dark:text-white">
                  Link Type
                </label>
                <select
                  value={formData.link_type?.toString() || ""}
                  onChange={(e) => updateField("link_type", e.target.value)}
                  className={inputClass("link_type")}
                  onFocus={() =>
                    setValidationErrors((prev) => ({ ...prev, link_type: "" }))
                  }
                >
                  <option value="">Select Link Type</option>
                  {linkTypeOptions.map((lt) => (
                    <option key={lt.value} value={lt.value}>
                      {lt.name}
                    </option>
                  ))}
                </select>
                {validationErrors.link_type && (
                  <p className="text-red-500 text-sm mt-1">
                    {validationErrors.link_type}
                  </p>
                )}
              </div>

              <div className="col-span-1">
                <label className="font-semibold block mb-1 text-gray-900 dark:text-white">
                  Slug
                </label>
                <input
                  type="text"
                  value={formData.link}
                  onChange={(e) => updateField("link", e.target.value)}
                  placeholder="i.e. example-slug"
                  className={inputClass("link")}
                  autoComplete="off"
                  onFocus={() =>
                    setValidationErrors((prev) => ({ ...prev, link: "" }))
                  }
                />
                {validationErrors.link && (
                  <p className="text-red-500 text-sm mt-1">
                    {validationErrors.link}
                  </p>
                )}
              </div>

              {Number(formData.link_type) === 2 && (
                <div className="col-span-1 sm:col-span-2 mt-2">
                  <label className="font-semibold block mb-1 text-gray-900 dark:text-white">
                    Content
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => updateField("content", e.target.value)}
                    className={inputClass("content")}
                    rows={5}
                    onFocus={() =>
                      setValidationErrors((prev) => ({ ...prev, content: "" }))
                    }
                  />
                  {validationErrors.content && (
                    <p className="text-red-500 text-sm mt-1">
                      {validationErrors.content}
                    </p>
                  )}
                </div>
              )}

              <div className="col-span-1 sm:col-span-2 flex items-center gap-4 mt-2">
                <label className="font-semibold w-24 text-gray-900 dark:text-white">
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
    </>
  );
}
