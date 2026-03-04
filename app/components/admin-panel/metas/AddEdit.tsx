"use client";

import React, { useCallback, useEffect, useState } from "react";
import { fetchAdmin } from "@/app/lib/fetchAdmin";
import ResponseModal from "@/app/components/ui/ResponseModal";

interface MetaItem {
  id?: number;
  title?: string;
  description?: string;
  og_title?: string;
  og_description?: string;
  og_image?: string;
  og_image_alt?: string;
  og_url?: string;
  og_type?: string;
  og_locale?: string;
  twitter_card?: string;
  twitter_title?: string;
  twitter_site?: string;
  twitter_description?: string;
  twitter_image?: string;
  twitter_image_alt?: string;
  twitter_creator?: string;
  keywords?: string;
  robots?: string;
  author?: string;
  publisher?: string;
  canonical?: string;
  slug?: string;
  status?: number;
}
interface MetaFormData {
  title: string;
  description: string;
  og_title: string;
  og_description: string;
  og_image: string;
  og_image_alt: string;
  og_url: string;
  og_type: string;
  og_locale: string;
  twitter_card: string;
  twitter_title: string;
  twitter_site: string;
  twitter_description: string;
  twitter_image: string;
  twitter_image_alt: string;
  twitter_creator: string;
  keywords: string;
  robots: string;
  author: string;
  publisher: string;
  canonical: string;
  slug: string;
  status: number;
}
interface SubmitApiResponse {
  status: boolean;
  message?: string;
  data: MetaItem;
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
  item: MetaItem | null;
  modalTitle: string;
  allData?: MetaItem[];
  onClose: () => void;
  onSave: (item: MetaItem) => void;
}

const emptyForm: MetaFormData = {
  title: "",
  description: "",
  og_title: "",
  og_description: "",
  og_image: "",
  og_image_alt: "",
  og_url: "",
  og_type: "",
  og_locale: "",
  twitter_card: "",
  twitter_title: "",
  twitter_site: "",
  twitter_description: "",
  twitter_image: "",
  twitter_image_alt: "",
  twitter_creator: "",
  keywords: "",
  robots: "",
  author: "",
  publisher: "",
  canonical: "",
  slug: "",
  status: 0,
};
const skipValidations = ["id", "status"];

export default function AddEdit({
  isOpen,
  item,
  modalTitle,
  onClose,
  onSave,
}: AddEditProps) {
  const [formData, setFormData] = useState<MetaFormData>({ ...emptyForm });
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
        description: item.description || "",
        og_title: item.og_title || "",
        og_description: item.og_description || "",
        og_image: item.og_image || "",
        og_image_alt: item.og_image_alt || "",
        og_url: item.og_url || "",
        og_type: item.og_type || "",
        og_locale: item.og_locale || "",
        twitter_card: item.twitter_card || "",
        twitter_title: item.twitter_title || "",
        twitter_site: item.twitter_site || "",
        twitter_description: item.twitter_description || "",
        twitter_image: item.twitter_image || "",
        twitter_image_alt: item.twitter_image_alt || "",
        twitter_creator: item.twitter_creator || "",
        keywords: item.keywords || "",
        robots: item.robots || "",
        author: item.author || "",
        publisher: item.publisher || "",
        canonical: item.canonical || "",
        slug: item.slug || "",
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
    (field: keyof MetaFormData, value: string | number) => {
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
      // Remove image fields if they're existing URLs (matches Nuxt behavior)
      if (
        typeof submitData.og_image === "string" &&
        (submitData.og_image as string).startsWith("http")
      ) {
        delete submitData.og_image;
      }
      if (
        typeof submitData.twitter_image === "string" &&
        (submitData.twitter_image as string).startsWith("http")
      ) {
        delete submitData.twitter_image;
      }

      const isEdit = modalTitle !== "Create";
      const result = await fetchAdmin<SubmitApiResponse>(
        isEdit ? `admin/metas/${item?.id}` : "admin/metas",
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

  if (!isOpen) return null;
  const inputClass = (field: string) =>
    `w-full border rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-sky-500 ${validationErrors[field] ? "border-red-500" : "border-gray-300 dark:border-gray-600"}`;

  const renderInput = (
    label: string,
    field: keyof MetaFormData,
    placeholder: string,
    colSpan?: number,
  ) => (
    <div
      className={
        colSpan
          ? `col-span-1 sm:col-span-${colSpan} flex items-center gap-4`
          : "flex items-center gap-4"
      }
    >
      <div className="flex-auto">
        <label className="font-semibold text-gray-900 dark:text-white">
          {label}
        </label>
        <input
          type="text"
          value={formData[field] as string}
          onChange={(e) => updateField(field, e.target.value)}
          placeholder={placeholder}
          className={inputClass(field)}
          autoComplete="off"
          onFocus={() =>
            setValidationErrors((prev) => ({ ...prev, [field]: "" }))
          }
        />
        {validationErrors[field] && (
          <p className="text-red-500 text-sm mt-1">{validationErrors[field]}</p>
        )}
      </div>
    </div>
  );

  const renderTextarea = (
    label: string,
    field: keyof MetaFormData,
    placeholder: string,
  ) => (
    <div className="flex items-center gap-4">
      <div className="flex-auto">
        <label className="font-semibold text-gray-900 dark:text-white">
          {label}
        </label>
        <textarea
          value={formData[field] as string}
          onChange={(e) => updateField(field, e.target.value)}
          placeholder={placeholder}
          className={inputClass(field)}
          rows={5}
          onFocus={() =>
            setValidationErrors((prev) => ({ ...prev, [field]: "" }))
          }
        />
        {validationErrors[field] && (
          <p className="text-red-500 text-sm mt-1">{validationErrors[field]}</p>
        )}
      </div>
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 z-9999 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-5xl mx-4 animate-modal-enter max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-center w-full gap-2 p-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
            <h4 className="text-xl font-semibold text-gray-900 dark:text-white">
              {modalTitle} Meta
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-6 overflow-y-auto">
            {/* Row 1: Title, OG Title, Twitter Title */}
            {renderInput("Title", "title", "Enter page title")}
            {renderInput("OG Title", "og_title", "Enter Open Graph title")}
            {renderInput(
              "Twitter Title",
              "twitter_title",
              "Enter Twitter card title",
            )}

            {/* Row 2: Description, OG Description, Twitter Description */}
            {renderTextarea(
              "Description",
              "description",
              "Enter page description",
            )}
            {renderTextarea(
              "OG Description",
              "og_description",
              "Enter Open Graph description",
            )}
            {renderTextarea(
              "Twitter Description",
              "twitter_description",
              "Enter Twitter card description",
            )}

            {/* Row 3: OG URL, OG Type, Twitter Card */}
            {renderInput("OG URL", "og_url", "https://example.com/page")}
            {renderInput(
              "OG Type",
              "og_type",
              "website, article, product, etc.",
            )}
            {renderInput(
              "Twitter Card",
              "twitter_card",
              "summary, summary_large_image, etc.",
            )}

            {/* Row 4: OG Locale, OG Image Alt, Twitter Image Alt */}
            {renderInput("OG Locale", "og_locale", "en_US, fr_FR, etc.")}
            {renderInput(
              "OG Image Alt",
              "og_image_alt",
              "Image description for accessibility",
            )}
            {renderInput(
              "Twitter Image Alt",
              "twitter_image_alt",
              "Image description for accessibility",
            )}

            {/* Row 5: Keywords, Robots, Twitter Site */}
            {renderInput(
              "Keywords",
              "keywords",
              "keyword1, keyword2, keyword3",
            )}
            {renderInput(
              "Robots",
              "robots",
              "index, follow, noindex, nofollow",
            )}
            {renderInput("Twitter Site", "twitter_site", "@yoursiteusername")}

            {/* Row 6: Slug (col-span-2), Twitter Creator */}
            <div className="col-span-1 sm:col-span-2 flex items-center gap-4">
              <div className="flex-auto">
                <label className="font-semibold text-gray-900 dark:text-white">
                  Slug
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => updateField("slug", e.target.value)}
                  placeholder="page-url-slug"
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
            {renderInput(
              "Twitter Creator",
              "twitter_creator",
              "@contentcreator",
            )}

            {/* Row 7: Author, Publisher, Canonical */}
            {renderInput("Author", "author", "Author name")}
            {renderInput(
              "Publisher",
              "publisher",
              "Publisher name or organization",
            )}
            {renderInput(
              "Canonical",
              "canonical",
              "https://example.com/canonical-url",
            )}

            {/* Row 8: OG Image, Twitter Image, Status */}
            <div className="flex items-center gap-4">
              <div className="flex-auto">
                <label className="font-semibold text-gray-900 dark:text-white">
                  OG Image
                </label>
                <div className="w-full mt-2">
                  {formData.og_image ? (
                    <img
                      src={formData.og_image}
                      alt="OG Image"
                      className="w-full h-32 object-cover rounded-md bg-gray-50 dark:bg-gray-700/50 p-1"
                    />
                  ) : (
                    <div className="w-full h-32 bg-gray-100 dark:bg-gray-700 rounded-md flex items-center justify-center text-gray-400">
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
                          og_image: "",
                        }));
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          updateField("og_image", ev.target?.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </div>
                {validationErrors.og_image && (
                  <p className="text-red-500 text-sm mt-1">
                    {validationErrors.og_image}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-auto">
                <label className="font-semibold text-gray-900 dark:text-white">
                  Twitter Image
                </label>
                <div className="w-full mt-2">
                  {formData.twitter_image ? (
                    <img
                      src={formData.twitter_image}
                      alt="Twitter Image"
                      className="w-full h-32 object-cover rounded-md bg-gray-50 dark:bg-gray-700/50 p-1"
                    />
                  ) : (
                    <div className="w-full h-32 bg-gray-100 dark:bg-gray-700 rounded-md flex items-center justify-center text-gray-400">
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
                          twitter_image: "",
                        }));
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          updateField(
                            "twitter_image",
                            ev.target?.result as string,
                          );
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </div>
                {validationErrors.twitter_image && (
                  <p className="text-red-500 text-sm mt-1">
                    {validationErrors.twitter_image}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-end justify-start gap-4">
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
