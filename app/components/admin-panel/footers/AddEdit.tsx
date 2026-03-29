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
  const isEditMode = modalTitle !== "Create";
  const isExternal = Number(formData.link_type) === 2;
  const slugPrefix = isExternal ? `${CONTENT_PREFIX}/` : "/";

  const fieldLabelClass =
    "px-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400";
  const fieldClass = (field: string) =>
    `w-full rounded-xl border bg-slate-50/90 dark:bg-slate-900/70 px-4 py-3.5 text-sm font-medium text-slate-900 dark:text-slate-100 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-[#025ADB]/25 focus:ring-4 focus:ring-[#025ADB]/10 ${
      validationErrors[field]
        ? "border-red-400/80 focus:border-red-400 focus:ring-red-500/10"
        : "border-slate-200/80 dark:border-slate-700/70"
    }`;
  const helperTextClass = "mt-2 px-1 text-xs text-red-500";

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
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
          <div
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
            onClick={onClose}
          />

          <div className="relative z-10 flex max-h-[calc(100vh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-[2rem] border border-white/60 bg-white/95 shadow-[0_32px_80px_rgba(15,23,42,0.18)] backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/95">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200/60 px-6 py-6 sm:px-8 dark:border-slate-800/80">
              <div>
                <h4 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
                  {isEditMode ? "Edit Footer Link" : "Create Footer Link"}
                </h4>
                <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                  {isEditMode
                    ? "Refine this navigation point for your site structure."
                    : "Define a new navigation point for your site structure."}
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close footer modal"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 6l12 12M18 6L6 18"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-7 overflow-y-auto px-6 py-6 sm:px-8">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="space-y-2.5">
                  <label htmlFor="footer-title" className={fieldLabelClass}>
                    Title
                  </label>
                  <input
                    id="footer-title"
                    type="text"
                    value={formData.title}
                    onChange={(e) => updateField("title", e.target.value)}
                    placeholder="e.g. Privacy Policy"
                    className={fieldClass("title")}
                    autoComplete="off"
                    onFocus={() =>
                      setValidationErrors((prev) => ({ ...prev, title: "" }))
                    }
                  />
                  {validationErrors.title && (
                    <p className={helperTextClass}>{validationErrors.title}</p>
                  )}
                </div>

                <div className="space-y-2.5">
                  <label htmlFor="footer-group-type" className={fieldLabelClass}>
                    Group Type
                  </label>
                  {isLoadingGroupTypes ? (
                    <div className="flex h-[54px] w-full items-center rounded-xl border border-slate-200/80 bg-slate-50/90 px-4 dark:border-slate-700/70 dark:bg-slate-900/70">
                      <div className="h-4 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                    </div>
                  ) : (
                    <select
                      id="footer-group-type"
                      value={formData.group_type_id?.toString() || ""}
                      onChange={(e) =>
                        updateField("group_type_id", e.target.value)
                      }
                      className={`${fieldClass("group_type_id")} cursor-pointer appearance-none`}
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
                    <p className={helperTextClass}>
                      {validationErrors.group_type_id}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2.5">
                <label className={fieldLabelClass}>Link Type</label>
                <div className="inline-flex w-full max-w-xs rounded-2xl border border-slate-200/70 bg-slate-100/90 p-1 dark:border-slate-700/60 dark:bg-slate-800/80">
                  {linkTypeOptions.map((lt) => {
                    const isActive = `${formData.link_type ?? ""}` === lt.value;

                    return (
                      <button
                        key={lt.value}
                        type="button"
                        onClick={() => updateField("link_type", lt.value)}
                        className={`flex-1 rounded-xl px-5 py-2.5 text-sm font-bold transition-all ${
                          isActive
                            ? "bg-[#025ADB] text-white shadow-[0_10px_20px_rgba(2,90,219,0.22)]"
                            : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-100"
                        }`}
                      >
                        {lt.name}
                      </button>
                    );
                  })}
                </div>
                {validationErrors.link_type && (
                  <p className={helperTextClass}>{validationErrors.link_type}</p>
                )}
              </div>

              <div className="space-y-2.5">
                <label htmlFor="footer-slug" className={fieldLabelClass}>
                  Slug / URL
                </label>
                <div
                  className={`flex overflow-hidden rounded-xl border bg-slate-50/90 transition-all focus-within:ring-4 dark:bg-slate-900/70 ${
                    validationErrors.link
                      ? "border-red-400/80 focus-within:border-red-400 focus-within:ring-red-500/10"
                      : "border-slate-200/80 focus-within:border-[#025ADB]/25 focus-within:ring-[#025ADB]/10 dark:border-slate-700/70"
                  }`}
                >
                  <span className="flex items-center border-r border-slate-200/70 bg-slate-100/70 px-4 text-sm font-semibold text-slate-500 dark:border-slate-700/70 dark:bg-slate-800/70 dark:text-slate-400">
                    {slugPrefix}
                  </span>
                  <input
                    id="footer-slug"
                    type="text"
                    value={formData.link}
                    onChange={(e) => updateField("link", e.target.value)}
                    placeholder="privacy-policy"
                    className="min-w-0 flex-1 bg-transparent px-4 py-3.5 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500"
                    autoComplete="off"
                    onFocus={() =>
                      setValidationErrors((prev) => ({ ...prev, link: "" }))
                    }
                  />
                </div>
                {validationErrors.link && (
                  <p className={helperTextClass}>{validationErrors.link}</p>
                )}
              </div>

              {isExternal && (
                <div className="space-y-2.5">
                  <label htmlFor="footer-content" className={fieldLabelClass}>
                    Content
                  </label>
                  <textarea
                    id="footer-content"
                    value={formData.content}
                    onChange={(e) => updateField("content", e.target.value)}
                    className={`${fieldClass("content")} min-h-36 resize-y`}
                    rows={5}
                    onFocus={() =>
                      setValidationErrors((prev) => ({ ...prev, content: "" }))
                    }
                  />
                  {validationErrors.content && (
                    <p className={helperTextClass}>
                      {validationErrors.content}
                    </p>
                  )}
                </div>
              )}

              <div className="flex flex-col gap-4 rounded-[1.5rem] border border-slate-200/70 bg-slate-50/80 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700/60 dark:bg-slate-800/60">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500/12 text-emerald-500">
                    <svg
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="h-5 w-5"
                      aria-hidden="true"
                    >
                      <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm4.38 7.53l-4.82 5.5a1 1 0 01-1.47.05l-2.46-2.46a1 1 0 111.42-1.41l1.7 1.7 4.08-4.65a1 1 0 111.55 1.27z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Active Status
                    </p>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Make this link visible on production immediately
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  aria-pressed={isChecked}
                  onClick={() => setIsChecked(!isChecked)}
                  className={`relative inline-flex h-7 w-12 shrink-0 rounded-full p-1 transition-all ${
                    isChecked
                      ? "bg-emerald-500 shadow-[0_8px_20px_rgba(16,185,129,0.28)]"
                      : "bg-slate-300 dark:bg-slate-600"
                  }`}
                >
                  <span
                    className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                      isChecked ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200/60 bg-slate-50/70 px-6 py-5 sm:flex-row sm:items-center sm:justify-end sm:px-8 dark:border-slate-800/80 dark:bg-slate-900/55">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-bold text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              >
                Cancel
              </button>

              {isLoading ? (
                <button
                  disabled
                  className="inline-flex min-w-40 items-center justify-center gap-2 rounded-xl bg-[#025ADB] px-8 py-3 text-sm font-bold text-white opacity-80"
                >
                  <div className="h-4 w-4 rounded-full border-2 border-white/80 border-t-transparent animate-spin" />
                  Saving...
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="inline-flex items-center justify-center rounded-xl bg-[#025ADB] px-8 py-3 text-sm font-bold text-white shadow-[0_18px_34px_rgba(2,90,219,0.24)] transition-all hover:bg-[#0149b3] active:scale-[0.98]"
                >
                  {isEditMode ? "Update Footer" : "Create Footer"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
