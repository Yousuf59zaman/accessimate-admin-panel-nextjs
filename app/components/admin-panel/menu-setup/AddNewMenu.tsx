"use client";

import React, { useCallback, useEffect, useState } from "react";
import { fetchAdmin } from "@/app/lib/fetchAdmin";
import ResponseModal from "@/app/components/ui/ResponseModal";
import IconPicker from "@/app/components/ui/IconPicker";

interface AddNewMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (item: MenuNode) => void;
}

export interface MenuNode {
  id: number;
  node_name: string;
  route_name: string | null;
  route_location: string | null;
  pid: number;
  icon: string;
  status: number;
  serials: number;
  menus: MenuNode[];
  showChild?: boolean;
}

interface FormData {
  pid: number;
  node_name: string;
  route_name: string;
  route_location: string;
  icon: string;
  serials: number;
  status: boolean;
}

interface SubmitApiResponse {
  status: boolean;
  message?: string;
  data: MenuNode;
}

interface FetchError extends Error {
  response?: Response;
  data?: { status?: boolean; message?: string; data?: Record<string, string[]> };
}

const emptyForm: FormData = {
  pid: 0,
  node_name: "",
  route_name: "",
  route_location: "",
  icon: "fas fa-upload",
  serials: 0,
  status: false,
};

export default function AddNewMenu({ isOpen, onClose, onCreated }: AddNewMenuProps) {
  const [formData, setFormData] = useState<FormData>({ ...emptyForm });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [responseModal, setResponseModal] = useState<Record<string, unknown>>({});
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setFormData({ ...emptyForm });
      setValidationErrors({});
    }
  }, [isOpen]);

  const updateField = useCallback((field: keyof FormData, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setValidationErrors((prev) => ({ ...prev, [field]: "" }));
  }, []);

  const handleSubmit = async () => {
    // Basic validation
    const errors: Record<string, string> = {};
    if (!formData.node_name.trim()) errors.node_name = "Name is required";
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setIsLoading(true);
    setResponseModal({});
    try {
      const result = await fetchAdmin<SubmitApiResponse>("admin/tree-entity", {
        method: "POST",
        body: { ...formData, status: formData.status ? 1 : 0 },
      });
      if (result?.status === true) {
        onCreated({ ...result.data, menus: [] });
        onClose();
      }
    } catch (e: unknown) {
      const error = e as FetchError;
      if (error?.response?.status === 404 || error?.response?.status === 409) {
        if (error.data?.data) {
          const se: Record<string, string> = {};
          for (const [key, val] of Object.entries(error.data.data)) {
            se[key] = val[0];
          }
          setValidationErrors(se);
        }
      } else {
        setResponseModal({
          status: false,
          message: error.data?.message ?? "Something went wrong.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const inputClass = (field: string) =>
    `w-full border rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-sky-500 ${
      validationErrors[field] ? "border-red-500" : "border-gray-300 dark:border-gray-600"
    }`;

  return (
    <>
      <div className="fixed inset-0 z-9999 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 animate-modal-enter max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-center w-full gap-2 p-4 border-b border-gray-200 dark:border-gray-700">
            <h4 className="text-xl font-semibold text-gray-900 dark:text-white">Create Menu</h4>
          </div>

          {/* Form */}
          <div className="grid grid-cols-1 gap-4 p-6">
            {/* Name */}
            <div className="flex items-center gap-4">
              <label className="font-semibold w-24 text-gray-900 dark:text-white">Name</label>
              <div className="flex-auto">
                <input
                  type="text"
                  value={formData.node_name}
                  onChange={(e) => updateField("node_name", e.target.value)}
                  placeholder="i.e. Portfolio Categories"
                  className={inputClass("node_name")}
                  autoComplete="off"
                  onFocus={() => setValidationErrors((prev) => ({ ...prev, node_name: "" }))}
                />
                {validationErrors.node_name && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.node_name}</p>
                )}
              </div>
            </div>

            {/* Route */}
            <div className="flex items-center gap-4">
              <label className="font-semibold w-24 text-gray-900 dark:text-white">Route</label>
              <div className="flex-auto">
                <input
                  type="text"
                  value={formData.route_name}
                  onChange={(e) => updateField("route_name", e.target.value)}
                  placeholder="i.e. /admin-panel/portfolio-categories"
                  className={inputClass("route_name")}
                  autoComplete="off"
                  onFocus={() => setValidationErrors((prev) => ({ ...prev, route_name: "" }))}
                />
                {validationErrors.route_name && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.route_name}</p>
                )}
              </div>
            </div>

            {/* API Route Permission */}
            <div className="flex items-center gap-4">
              <label className="font-semibold w-24 text-gray-900 dark:text-white text-xs leading-tight">
                Api Route Permission
              </label>
              <div className="flex-auto">
                <input
                  type="text"
                  value={formData.route_location}
                  onChange={(e) => updateField("route_location", e.target.value)}
                  placeholder="i.e. portfolio-categories"
                  className={inputClass("route_location")}
                  autoComplete="off"
                  onFocus={() => setValidationErrors((prev) => ({ ...prev, route_location: "" }))}
                />
                {validationErrors.route_location && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.route_location}</p>
                )}
              </div>
            </div>

            {/* Icon */}
            <div className="flex items-center gap-4">
              <label className="font-semibold w-24 text-gray-900 dark:text-white">Icon</label>
              <div className="flex-auto">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={formData.icon}
                    className={`${inputClass("icon")} bg-gray-100 dark:bg-gray-700`}
                    disabled
                  />
                  <i
                    className={`${formData.icon} text-[25px] cursor-pointer text-orange-500 hover:text-orange-600 transition-colors`}
                    onClick={() => setIsIconPickerOpen(true)}
                  />
                </div>
                {validationErrors.icon && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.icon}</p>
                )}
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center gap-4">
              <label className="font-semibold w-24 text-gray-900 dark:text-white">Status</label>
              <div className="flex-auto">
                <button
                  type="button"
                  onClick={() => updateField("status", !formData.status)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.status ? "bg-sky-500" : "bg-gray-300 dark:bg-gray-600"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.status ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Footer buttons */}
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
                  <i className="pi pi-plus-circle" />
                  Save
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Icon Picker */}
      <IconPicker
        isOpen={isIconPickerOpen}
        value={formData.icon}
        onClose={() => setIsIconPickerOpen(false)}
        onChange={(icon) => updateField("icon", icon)}
      />

      <ResponseModal
        data={responseModal as { status?: boolean; message?: string; error?: Record<string, string[]> }}
        onClose={() => setResponseModal({})}
      />
    </>
  );
}
