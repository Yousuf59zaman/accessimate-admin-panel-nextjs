"use client";

import React, { useCallback, useEffect, useState } from "react";
import { fetchAdmin } from "@/app/lib/fetchAdmin";
import ResponseModal from "@/app/components/ui/ResponseModal";

interface FeatureItem {
  feature: string;
  description: string;
  is_included: boolean | number;
}
interface PriceItem {
  billing_cycle: string;
  price: number;
  discount: number;
  final_price: number;
}
interface PlanItem {
  id?: number;
  name?: string;
  slug?: string;
  serials?: number;
  description?: string;
  status?: number;
  features?: FeatureItem[];
  prices?: PriceItem[];
}
interface FormData {
  name: string;
  slug: string;
  serials: number;
  description: string;
  status: number;
  features: FeatureItem[];
  prices: PriceItem[];
}
interface SubmitApiResponse {
  status: boolean;
  message?: string;
  data: PlanItem;
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
  item: PlanItem | null;
  modalTitle: string;
  onClose: () => void;
  onSave: (item: PlanItem) => void;
}

const typePackageList = [
  { key: "monthly", name: "Monthly" },
  { key: "quarterly", name: "Quarterly" },
  { key: "semi_annually", name: "Semi Annually" },
  { key: "annually", name: "Annually" },
];

const emptyForm: FormData = {
  name: "",
  slug: "",
  serials: 0,
  description: "",
  status: 0,
  features: [],
  prices: [],
};
const skipValidations = ["id", "status", "features", "prices"];

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

  // Feature drawer state
  const [openFeature, setOpenFeature] = useState(false);
  const [featureIndex, setFeatureIndex] = useState<number | null>(null);
  const [featureForm, setFeatureForm] = useState({
    feature: "",
    description: "",
    is_included: false,
  });

  // Price drawer state
  const [openPrice, setOpenPrice] = useState(false);
  const [priceIndex, setPriceIndex] = useState<number | null>(null);
  const [priceForm, setPriceForm] = useState({
    billing_cycle: "",
    price: 0,
    discount: 0,
    final_price: 0,
  });

  useEffect(() => {
    if (item && Object.keys(item).length > 0) {
      setValidationErrors({});
      setFormData({
        name: item.name || "",
        slug: item.slug || "",
        serials: item.serials || 0,
        description: item.description || "",
        status: item.status || 0,
        features: item.features
          ? item.features.map((f) => ({
              ...f,
              is_included: f.is_included === 1 || f.is_included === true,
            }))
          : [],
        prices: item.prices
          ? item.prices.map((p) => ({
              billing_cycle: p.billing_cycle,
              price: p.price,
              discount: p.discount,
              final_price: p.final_price,
            }))
          : [],
      });
      setIsChecked(item.status === 1);
    } else {
      setFormData({ ...emptyForm, features: [], prices: [] });
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
        features: formData.features.map((f) => ({
          feature: f.feature,
          description: f.description,
          is_included: f.is_included ? 1 : 0,
        })),
        prices: formData.prices.map((p) => ({
          billing_cycle: p.billing_cycle,
          price: p.price,
          discount: p.discount,
          final_price: p.final_price,
        })),
      };
      const isEdit = modalTitle !== "Create";
      const result = await fetchAdmin<SubmitApiResponse>(
        isEdit ? `admin/plans/${item?.id}` : "admin/plans",
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

  // Feature CRUD
  const addFeature = () => {
    setFeatureIndex(null);
    setFeatureForm({ feature: "", description: "", is_included: false });
    setOpenFeature(true);
  };
  const editFeature = (index: number) => {
    setFeatureIndex(index);
    const f = formData.features[index];
    setFeatureForm({
      feature: f.feature,
      description: f.description,
      is_included: !!f.is_included,
    });
    setOpenFeature(true);
  };
  const saveFeature = () => {
    if (!featureForm.feature) {
      setValidationErrors((prev) => ({ ...prev, feature: "* required" }));
      return;
    }
    setFormData((prev) => {
      const features = [...prev.features];
      if (featureIndex !== null) {
        features[featureIndex] = { ...featureForm };
      } else {
        features.push({ ...featureForm });
      }
      return { ...prev, features };
    });
    setOpenFeature(false);
    setValidationErrors((prev) => {
      const n = { ...prev };
      delete n.feature;
      return n;
    });
  };
  const removeFeature = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  // Price CRUD
  const addPrice = () => {
    setPriceIndex(null);
    setPriceForm({ billing_cycle: "", price: 0, discount: 0, final_price: 0 });
    setOpenPrice(true);
  };
  const editPrice = (index: number) => {
    setPriceIndex(index);
    setPriceForm({ ...formData.prices[index] });
    setOpenPrice(true);
  };
  const savePrice = () => {
    const pErrors: Record<string, string> = {};
    if (!priceForm.billing_cycle) pErrors.billing_cycle = "* required";
    if (!priceForm.price) pErrors.price = "* required";
    if (!priceForm.final_price) pErrors.final_price = "* required";
    if (Object.keys(pErrors).length > 0) {
      setValidationErrors((prev) => ({ ...prev, ...pErrors }));
      return;
    }
    setFormData((prev) => {
      const prices = [...prev.prices];
      if (priceIndex !== null) {
        prices[priceIndex] = { ...priceForm };
      } else {
        prices.push({ ...priceForm });
      }
      return { ...prev, prices };
    });
    setOpenPrice(false);
    setValidationErrors((prev) => {
      const n = { ...prev };
      delete n.billing_cycle;
      delete n.price;
      delete n.final_price;
      return n;
    });
  };
  const removePrice = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      prices: prev.prices.filter((_, i) => i !== index),
    }));
  };

  const truncateText = (text: string, len: number) =>
    text && text.length > len ? text.substring(0, len) + "..." : text || "";

  if (!isOpen) return null;
  const inputClass = (field: string) =>
    `w-full border rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-sky-500 ${validationErrors[field] ? "border-red-500" : "border-gray-300 dark:border-gray-600"}`;

  return (
    <>
      <div className="fixed inset-0 z-9999 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-[100vw] mx-4 animate-modal-enter max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-center w-full gap-2 p-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
            <h4 className="text-xl font-semibold text-gray-900 dark:text-white">
              {modalTitle} Plans
            </h4>
          </div>
          <div className="p-6 overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Slug - col-span-2 */}
              <div className="col-span-1 sm:col-span-2">
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
              {/* Name */}
              <div className="col-span-1">
                <label className="font-semibold block mb-1 text-gray-900 dark:text-white">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="i.e. Web Development"
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
                  rows={2}
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
              {/* Hierarchy */}
              <div className="col-span-1">
                <label className="font-semibold block mb-1 text-gray-900 dark:text-white">
                  Hierarchy
                </label>
                <input
                  type="number"
                  value={formData.serials || ""}
                  onChange={(e) =>
                    updateField("serials", parseInt(e.target.value, 10) || 0)
                  }
                  className={inputClass("serials")}
                  autoComplete="off"
                  onFocus={() =>
                    setValidationErrors((prev) => ({ ...prev, serials: "" }))
                  }
                />
                {validationErrors.serials && (
                  <p className="text-red-500 text-sm mt-1">
                    {validationErrors.serials}
                  </p>
                )}
              </div>
              {/* Status */}
              <div className="col-span-1 flex flex-col justify-end pb-2">
                <label className="font-semibold block mb-2 text-gray-900 dark:text-white">
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

              {/* Features + Prices side by side */}
              <div className="col-span-1 sm:col-span-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 w-full gap-4 sm:gap-10">
                  {/* Features */}
                  <div>
                    <div className="flex items-center justify-between gap-3 pb-2 mb-4 border-b border-gray-200 dark:border-gray-700">
                      <label className="font-semibold text-gray-900 dark:text-white">
                        Features
                      </label>
                      <button
                        type="button"
                        onClick={addFeature}
                        className="bg-sky-200 dark:bg-sky-900 hover:dark:bg-sky-400 text-sky-500 dark:text-sky-200 hover:text-sky-800 p-2 text-[12px] h-[26px] w-[26px] flex items-center justify-center rounded-full transition duration-150"
                      >
                        <i className="fa-solid fa-plus" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {formData.features.map((feat, index) => (
                        <div
                          key={index}
                          className="rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md p-4 bg-white dark:bg-gray-800 relative group transition-all duration-300"
                        >
                          <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                            <button
                              type="button"
                              onClick={() => editFeature(index)}
                              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150"
                              title="Edit Feature"
                            >
                              <i className="fas fa-edit text-emerald-600 text-sm" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeFeature(index)}
                              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150"
                              title="Delete Feature"
                            >
                              <i className="fas fa-trash-alt text-red-600 text-sm" />
                            </button>
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-start gap-3">
                              <div className="p-2 rounded-lg bg-violet-50 dark:bg-violet-900/30 mt-1">
                                <i className="fas fa-list text-violet-600" />
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Feature</p>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {truncateText(feat.feature, 20)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 mt-1">
                                <i className="fas fa-chart-bar text-blue-600" />
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">
                                  Description
                                </p>
                                <p className="font-medium text-gray-900 dark:text-white line-clamp-2">
                                  {truncateText(feat.description, 50)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-700">
                                <i className="fas fa-toggle-on text-gray-600 dark:text-gray-400" />
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500">
                                  Status:
                                </span>
                                {feat.is_included ? (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    <i className="fas fa-check mr-1" />
                                    Included
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                    <i className="fas fa-times mr-1" />
                                    Not Included
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Prices */}
                  <div>
                    <div className="flex items-center justify-between gap-3 pb-2 mb-4 border-b border-gray-200 dark:border-gray-700">
                      <label className="font-semibold text-gray-900 dark:text-white">
                        Prices
                      </label>
                      <button
                        type="button"
                        onClick={addPrice}
                        className="bg-sky-200 dark:bg-sky-900 hover:dark:bg-sky-400 text-sky-500 dark:text-sky-200 hover:text-sky-800 p-2 text-[12px] h-[26px] w-[26px] flex items-center justify-center rounded-full transition duration-150"
                      >
                        <i className="fa-solid fa-plus" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {formData.prices.map((p, index) => (
                        <div
                          key={index}
                          className="rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md p-4 bg-white dark:bg-gray-800 relative group transition-all duration-300"
                        >
                          <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                            <button
                              type="button"
                              onClick={() => editPrice(index)}
                              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150"
                              title="Edit Price"
                            >
                              <i className="fas fa-edit text-emerald-600 text-sm" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removePrice(index)}
                              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150"
                              title="Delete Price"
                            >
                              <i className="fas fa-trash-alt text-red-600 text-sm" />
                            </button>
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30">
                                <i className="fas fa-clock text-blue-600" />
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">
                                  Billing Cycle
                                </p>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {p.billing_cycle}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/30">
                                <i className="fas fa-wallet text-emerald-600" />
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Price</p>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  ${p.price}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
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

      {/* Feature Drawer */}
      {openFeature && (
        <div className="fixed inset-0 z-[10000] flex">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setOpenFeature(false)}
          />
          <div className="ml-auto relative bg-white dark:bg-gray-800 w-full max-w-md h-full shadow-xl flex flex-col animate-slide-in-right">
            <div className="p-6 flex-1 overflow-y-auto">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <div className="flex items-start gap-2">
                    <label className="font-semibold text-gray-900 dark:text-white">
                      Feature
                    </label>
                    {validationErrors.feature && (
                      <span className="text-red-500 text-sm">
                        {validationErrors.feature}
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={featureForm.feature}
                    onChange={(e) => {
                      setFeatureForm((p) => ({
                        ...p,
                        feature: e.target.value,
                      }));
                      setValidationErrors((p) => ({ ...p, feature: "" }));
                    }}
                    placeholder="i.e. Unlimited Bandwidth"
                    className={inputClass("feature")}
                    autoComplete="off"
                  />
                </div>
                <div>
                  <div className="flex items-start gap-2">
                    <label className="font-semibold text-gray-900 dark:text-white">
                      Description
                    </label>
                  </div>
                  <textarea
                    value={featureForm.description}
                    onChange={(e) =>
                      setFeatureForm((p) => ({
                        ...p,
                        description: e.target.value,
                      }))
                    }
                    placeholder="i.e. Write your description here"
                    className={inputClass("featureDesc")}
                    rows={4}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-semibold text-gray-900 dark:text-white">
                    Is Included
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setFeatureForm((p) => ({
                        ...p,
                        is_included: !p.is_included,
                      }))
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${featureForm.is_included ? "bg-sky-500" : "bg-gray-300 dark:bg-gray-600"}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${featureForm.is_included ? "translate-x-6" : "translate-x-1"}`}
                    />
                  </button>
                </div>
              </div>
            </div>
            <div className="flex justify-end items-center gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setOpenFeature(false)}
                className="px-4 py-2 border border-red-500 text-red-500 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-300 hover:scale-105 flex items-center gap-2"
              >
                <i className="pi pi-times-circle" />
                Cancel
              </button>
              <button
                type="button"
                onClick={saveFeature}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center gap-2"
              >
                <i className="pi pi-check-circle" />
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Price Drawer */}
      {openPrice && (
        <div className="fixed inset-0 z-[10000] flex">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setOpenPrice(false)}
          />
          <div className="ml-auto relative bg-white dark:bg-gray-800 w-full max-w-md h-full shadow-xl flex flex-col animate-slide-in-right">
            <div className="p-6 flex-1 overflow-y-auto">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="font-semibold text-gray-900 dark:text-white">
                    Billing Cycle
                  </label>
                  <select
                    value={priceForm.billing_cycle}
                    onChange={(e) => {
                      setPriceForm((p) => ({
                        ...p,
                        billing_cycle: e.target.value,
                      }));
                      setValidationErrors((p) => ({ ...p, billing_cycle: "" }));
                    }}
                    className={inputClass("billing_cycle")}
                  >
                    <option value="">Select Billing Cycle</option>
                    {typePackageList.map((t) => (
                      <option key={t.key} value={t.key}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                  {validationErrors.billing_cycle && (
                    <p className="text-red-500 text-sm mt-1">
                      {validationErrors.billing_cycle}
                    </p>
                  )}
                </div>
                <div>
                  <label className="font-semibold text-gray-900 dark:text-white">
                    Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={priceForm.price || ""}
                    onChange={(e) => {
                      setPriceForm((p) => ({
                        ...p,
                        price: parseFloat(e.target.value) || 0,
                      }));
                      setValidationErrors((p) => ({ ...p, price: "" }));
                    }}
                    className={inputClass("price")}
                  />
                  {validationErrors.price && (
                    <p className="text-red-500 text-sm mt-1">
                      {validationErrors.price}
                    </p>
                  )}
                </div>
                <div>
                  <label className="font-semibold text-gray-900 dark:text-white">
                    Discount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={priceForm.discount || ""}
                    onChange={(e) =>
                      setPriceForm((p) => ({
                        ...p,
                        discount: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className={inputClass("discount")}
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-900 dark:text-white">
                    Final Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={priceForm.final_price || ""}
                    onChange={(e) => {
                      setPriceForm((p) => ({
                        ...p,
                        final_price: parseFloat(e.target.value) || 0,
                      }));
                      setValidationErrors((p) => ({ ...p, final_price: "" }));
                    }}
                    className={inputClass("final_price")}
                  />
                  {validationErrors.final_price && (
                    <p className="text-red-500 text-sm mt-1">
                      {validationErrors.final_price}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-end items-center gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setOpenPrice(false)}
                className="px-4 py-2 border border-red-500 text-red-500 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-300 hover:scale-105 flex items-center gap-2"
              >
                <i className="pi pi-times-circle" />
                Cancel
              </button>
              <button
                type="button"
                onClick={savePrice}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center gap-2"
              >
                <i className="pi pi-check-circle" />
                Save
              </button>
            </div>
          </div>
        </div>
      )}

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
