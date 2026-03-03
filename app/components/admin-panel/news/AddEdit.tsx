"use client";

import React, { useCallback, useEffect, useState } from "react";
import { fetchAdmin } from "@/app/lib/fetchAdmin";
import ResponseModal from "@/app/components/ui/ResponseModal";

interface NewsItem {
  id?: number;
  title?: string;
  slug?: string;
  cat_id?: number | string;
  photo?: string;
  thumbnail_image?: string;
  news_dtl?: string;
  is_external?: number;
  external_url?: string;
  on_headline?: number;
  status?: number;
  is_seo?: number;
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
}
interface FormData {
  title: string;
  slug: string;
  cat_id: number | string;
  photo: string;
  thumbnail_image: string;
  news_dtl: string;
  is_external: number;
  external_url: string;
  on_headline: number;
  status: number;
  is_seo: number;
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
}
interface SubmitApiResponse {
  status: boolean;
  message?: string;
  data: NewsItem;
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
  item: NewsItem | null;
  modalTitle: string;
  onClose: () => void;
  onSave: (item: NewsItem) => void;
}

const emptyForm: FormData = {
  title: "",
  slug: "",
  cat_id: "",
  photo: "",
  thumbnail_image: "",
  news_dtl: "",
  is_external: 0,
  external_url: "",
  on_headline: 0,
  status: 0,
  is_seo: 0,
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
};
const skipValidations = [
  "id",
  "photo",
  "thumbnail_image",
  "status",
  "on_headline",
  "is_external",
  "external_url",
  "is_seo",
  "description",
  "og_title",
  "og_description",
  "og_image",
  "og_image_alt",
  "og_url",
  "og_type",
  "og_locale",
  "twitter_card",
  "twitter_title",
  "twitter_site",
  "twitter_description",
  "twitter_image",
  "twitter_image_alt",
  "twitter_creator",
  "keywords",
  "robots",
  "author",
  "publisher",
  "canonical",
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
  const [isCheckedExternal, setIsCheckedExternal] = useState(false);
  const [isCheckedSEO, setIsCheckedSEO] = useState(false);
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

  useEffect(() => {
    if (isOpen) {
      fetchAdmin("admin/news-categories").then((res: any) => {
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
        slug: item.slug || "",
        cat_id: item.cat_id || "",
        photo: item.photo || "",
        thumbnail_image: item.thumbnail_image || "",
        news_dtl: item.news_dtl || "",
        is_external: item.is_external || 0,
        external_url: item.external_url || "",
        on_headline: item.on_headline || 0,
        status: item.status || 0,
        is_seo: item.is_seo || 0,
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
      });
      setIsChecked(item.status === 1);
      setIsCheckedExternal(item.is_external === 1);
      setIsCheckedSEO(item.is_seo === 1);
    } else {
      setFormData({ ...emptyForm });
      setIsChecked(false);
      setIsCheckedExternal(false);
      setIsCheckedSEO(false);
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
        is_external: isCheckedExternal ? 1 : 0,
        is_seo: isCheckedSEO ? 1 : 0,
      };

      if (
        submitData.photo &&
        (submitData.photo.includes("http") ||
          submitData.photo.includes("https"))
      ) {
        delete (submitData as any).photo;
      }
      if (
        submitData.thumbnail_image &&
        (submitData.thumbnail_image.includes("http") ||
          submitData.thumbnail_image.includes("https"))
      ) {
        delete (submitData as any).thumbnail_image;
      }

      const isEdit = modalTitle !== "Create";
      const result = await fetchAdmin<SubmitApiResponse>(
        isEdit ? `admin/news/${item?.id}` : "admin/news",
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

  return (
    <>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl mx-4 animate-modal-enter max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-center w-full gap-2 p-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
            <h4 className="text-xl font-semibold text-gray-900 dark:text-white">
              {modalTitle} News
            </h4>
          </div>
          <div className="p-6 overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="col-span-1">
                <label className="font-semibold block mb-1 text-gray-900 dark:text-white">
                  Banner Image
                </label>
                <input
                  type="text"
                  value={formData.photo}
                  onChange={(e) => updateField("photo", e.target.value)}
                  placeholder="Image URL or upload"
                  className={inputClass("photo")}
                  autoComplete="off"
                />
              </div>
              <div className="col-span-1">
                <label className="font-semibold block mb-1 text-gray-900 dark:text-white">
                  Thumbnail Image
                </label>
                <input
                  type="text"
                  value={formData.thumbnail_image}
                  onChange={(e) =>
                    updateField("thumbnail_image", e.target.value)
                  }
                  placeholder="Image URL or upload"
                  className={inputClass("thumbnail_image")}
                  autoComplete="off"
                />
              </div>
              <div className="col-span-1"></div>

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
              <div className="col-span-1">
                <label className="font-semibold block mb-1 text-gray-900 dark:text-white">
                  Show in Headline
                </label>
                <select
                  value={formData.on_headline}
                  onChange={(e) =>
                    updateField("on_headline", Number(e.target.value))
                  }
                  className={inputClass("on_headline")}
                >
                  <option value={1}>Yes</option>
                  <option value={0}>No</option>
                </select>
              </div>

              <div className="col-span-1 sm:col-span-3">
                <label className="font-semibold block mb-1 text-gray-900 dark:text-white">
                  News Details
                </label>
                <textarea
                  value={formData.news_dtl}
                  onChange={(e) => updateField("news_dtl", e.target.value)}
                  className={inputClass("news_dtl")}
                  rows={5}
                  onFocus={() =>
                    setValidationErrors((prev) => ({ ...prev, news_dtl: "" }))
                  }
                />
                {validationErrors.news_dtl && (
                  <p className="text-red-500 text-sm mt-1">
                    {validationErrors.news_dtl}
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
                  placeholder="i.e. example-slug"
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

              {/* Switches */}
              <div className="col-span-1 sm:col-span-3 flex flex-wrap gap-6 mt-2 items-end">
                <div className="flex flex-col gap-2">
                  <label className="font-semibold text-gray-900 dark:text-white">
                    Show External URL
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCheckedExternal(!isCheckedExternal)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isCheckedExternal ? "bg-sky-500" : "bg-gray-300 dark:bg-gray-600"}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isCheckedExternal ? "translate-x-6" : "translate-x-1"}`}
                    />
                  </button>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-semibold text-gray-900 dark:text-white">
                    Add SEO
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCheckedSEO(!isCheckedSEO)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isCheckedSEO ? "bg-sky-500" : "bg-gray-300 dark:bg-gray-600"}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isCheckedSEO ? "translate-x-6" : "translate-x-1"}`}
                    />
                  </button>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-semibold text-gray-900 dark:text-white">
                    Status
                  </label>
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

              {isCheckedExternal && (
                <div className="col-span-1 sm:col-span-3 mt-2">
                  <label className="font-semibold block mb-1 text-gray-900 dark:text-white">
                    External URL
                  </label>
                  <input
                    type="text"
                    value={formData.external_url}
                    onChange={(e) =>
                      updateField("external_url", e.target.value)
                    }
                    placeholder="i.e https://example.com"
                    className={inputClass("external_url")}
                    autoComplete="off"
                  />
                </div>
              )}

              {/* SEO Settings */}
              {isCheckedSEO && (
                <div className="col-span-1 sm:col-span-3 border-t border-gray-200 dark:border-gray-700 pt-4 mt-4 mb-4">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                    SEO Settings
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="col-span-1">
                      <label className="font-semibold block mb-1 text-gray-900 dark:text-white">
                        Title
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => updateField("title", e.target.value)}
                        className={inputClass("title")}
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="font-semibold block mb-1 text-gray-900 dark:text-white">
                        OG Title
                      </label>
                      <input
                        type="text"
                        value={formData.og_title}
                        onChange={(e) =>
                          updateField("og_title", e.target.value)
                        }
                        className={inputClass("og_title")}
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="font-semibold block mb-1 text-gray-900 dark:text-white">
                        Twitter Title
                      </label>
                      <input
                        type="text"
                        value={formData.twitter_title}
                        onChange={(e) =>
                          updateField("twitter_title", e.target.value)
                        }
                        className={inputClass("twitter_title")}
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="font-semibold block mb-1 text-gray-900 dark:text-white">
                        Description
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) =>
                          updateField("description", e.target.value)
                        }
                        className={inputClass("description")}
                        rows={3}
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="font-semibold block mb-1 text-gray-900 dark:text-white">
                        OG Description
                      </label>
                      <textarea
                        value={formData.og_description}
                        onChange={(e) =>
                          updateField("og_description", e.target.value)
                        }
                        className={inputClass("og_description")}
                        rows={3}
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="font-semibold block mb-1 text-gray-900 dark:text-white">
                        Twitter Description
                      </label>
                      <textarea
                        value={formData.twitter_description}
                        onChange={(e) =>
                          updateField("twitter_description", e.target.value)
                        }
                        className={inputClass("twitter_description")}
                        rows={3}
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="font-semibold block mb-1 text-gray-900 dark:text-white">
                        OG URL
                      </label>
                      <input
                        type="text"
                        value={formData.og_url}
                        onChange={(e) => updateField("og_url", e.target.value)}
                        className={inputClass("og_url")}
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="font-semibold block mb-1 text-gray-900 dark:text-white">
                        OG Type
                      </label>
                      <input
                        type="text"
                        value={formData.og_type}
                        onChange={(e) => updateField("og_type", e.target.value)}
                        className={inputClass("og_type")}
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="font-semibold block mb-1 text-gray-900 dark:text-white">
                        Twitter Card
                      </label>
                      <input
                        type="text"
                        value={formData.twitter_card}
                        onChange={(e) =>
                          updateField("twitter_card", e.target.value)
                        }
                        className={inputClass("twitter_card")}
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="font-semibold block mb-1 text-gray-900 dark:text-white">
                        Keywords
                      </label>
                      <input
                        type="text"
                        value={formData.keywords}
                        onChange={(e) =>
                          updateField("keywords", e.target.value)
                        }
                        className={inputClass("keywords")}
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="font-semibold block mb-1 text-gray-900 dark:text-white">
                        Robots
                      </label>
                      <input
                        type="text"
                        value={formData.robots}
                        onChange={(e) => updateField("robots", e.target.value)}
                        className={inputClass("robots")}
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="font-semibold block mb-1 text-gray-900 dark:text-white">
                        Twitter Site
                      </label>
                      <input
                        type="text"
                        value={formData.twitter_site}
                        onChange={(e) =>
                          updateField("twitter_site", e.target.value)
                        }
                        className={inputClass("twitter_site")}
                      />
                    </div>
                  </div>
                </div>
              )}
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
