"use client";

import React, { useCallback, useEffect, useState } from "react";
import { fetchAdmin } from "@/app/lib/fetchAdmin";
import ResponseModal from "@/app/components/ui/ResponseModal";

// ─── Types ──────────────────────────────────────────────────

interface UserItem {
  id?: number;
  email?: string;
  mobile?: string;
  ccode?: string;
  photo?: string;
  status?: number;
  user_type?: number;
  user_info?: {
    first_name?: string;
    middle_name?: string;
    last_name?: string;
    dob?: string;
    gender?: string | number;
    nationality_id?: string | number;
  };
}

interface FormData {
  photo: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  dob: string;
  gender: string | number;
  nationality_id: string | number;
  email: string;
  mobile: string;
  password: string;
  password_confirmation: string;
  user_type: string | number;
  status?: number;
}

interface DropdownItem {
  id: number;
  gender_name?: string;
  nationality?: string;
  role_name?: string;
  num_code?: string;
}

interface DropdownApiResponse {
  data: {
    data: DropdownItem[];
  };
}

interface SubmitApiResponse {
  status: boolean;
  message?: string;
  data: UserItem;
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
  item: UserItem | null;
  modalTitle: string;
  onClose: () => void;
  onSave: (item: UserItem) => void;
}

// ─── Initial empty form ─────────────────────────────────────

const emptyForm: FormData = {
  photo: "",
  first_name: "",
  middle_name: "",
  last_name: "",
  dob: "",
  gender: "",
  nationality_id: "",
  email: "",
  mobile: "",
  password: "",
  password_confirmation: "",
  user_type: "",
};

const skipValidations = ["middle_name", "photo", "status"];

// ─── Component ──────────────────────────────────────────────

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

  // ─── Dropdowns ─────────────────────────────────────────

  const [genderList, setGenderList] = useState<DropdownItem[]>([]);
  const [nationalityList, setNationalityList] = useState<DropdownItem[]>([]);
  const [roleList, setRoleList] = useState<DropdownItem[]>([]);

  useEffect(() => {
    const loadDropdowns = async () => {
      try {
        const [genders, nationalities, roles] = await Promise.all([
          fetchAdmin<DropdownApiResponse>("admin/genders/all", {
            method: "POST",
          }),
          fetchAdmin<DropdownApiResponse>("admin/countries/all", {
            method: "POST",
          }),
          fetchAdmin<DropdownApiResponse>("admin/roles/all", {
            method: "POST",
          }),
        ]);
        setGenderList(genders?.data?.data || []);
        setNationalityList(nationalities?.data?.data || []);
        setRoleList(roles?.data?.data || []);
      } catch (e) {
        console.error("Failed to load dropdown data:", e);
      }
    };
    loadDropdowns();
  }, []);

  // ─── Reset form when item changes ─────────────────────

  useEffect(() => {
    if (item && Object.keys(item).length > 0) {
      setValidationErrors({});
      setFormData({
        photo: item.photo || "",
        first_name: item.user_info?.first_name || "",
        middle_name: item.user_info?.middle_name || "",
        last_name: item.user_info?.last_name || "",
        dob: item.user_info?.dob || "",
        gender: item.user_info?.gender || "",
        nationality_id: item.user_info?.nationality_id || "",
        email: item.email || "",
        mobile: item.mobile || "",
        password: "",
        password_confirmation: "",
        user_type: item.user_type ? Number(item.user_type) : "",
      });
      setIsChecked(item.status === 1);
    } else {
      setFormData({ ...emptyForm });
      setIsChecked(false);
      setValidationErrors({});
    }
  }, [item]);

  // ─── Field handler ─────────────────────────────────────

  const updateField = useCallback(
    (field: keyof FormData, value: string | number) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setValidationErrors((prev) => ({ ...prev, [field]: "" }));
    },
    [],
  );

  // ─── Password validation ──────────────────────────────

  useEffect(() => {
    if (!formData.password) {
      setValidationErrors((prev) => ({ ...prev, password: "" }));
      return;
    }
    const errors: string[] = [];
    if (formData.password.length < 8) errors.push("✘ Min 8 characters.");
    if (!/[a-z]/.test(formData.password)) errors.push("✘ One lowercase.");
    if (!/[A-Z]/.test(formData.password)) errors.push("✘ One uppercase.");
    if (!/[0-9]/.test(formData.password)) errors.push("✘ One number.");
    setValidationErrors((prev) => ({
      ...prev,
      password: errors.join(" "),
    }));

    if (
      formData.password_confirmation &&
      formData.password !== formData.password_confirmation
    ) {
      setValidationErrors((prev) => ({
        ...prev,
        password_confirmation:
          "✘ Password and Confirm Password must be the same.",
      }));
    }
  }, [formData.password, formData.password_confirmation]);

  useEffect(() => {
    if (!formData.password_confirmation) {
      setValidationErrors((prev) => ({
        ...prev,
        password_confirmation: "",
      }));
      return;
    }
    if (formData.password_confirmation !== formData.password) {
      setValidationErrors((prev) => ({
        ...prev,
        password_confirmation:
          "✘ Password and Confirm Password must be the same.",
      }));
    } else {
      setValidationErrors((prev) => ({
        ...prev,
        password_confirmation: "",
      }));
    }
  }, [formData.password_confirmation, formData.password]);

  // ─── Validation ────────────────────────────────────────

  const validate = (): boolean => {
    if (formData.password !== formData.password_confirmation) {
      setValidationErrors((prev) => ({
        ...prev,
        password_confirmation: "Password and Confirm Password does not match",
      }));
      return false;
    }

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

  // ─── Submit ────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsLoading(true);
    setResponseModal({});

    try {
      const nationality = nationalityList.find(
        (n) => n.id === Number(formData.nationality_id),
      );

      const submitData: Record<string, unknown> = {
        ...formData,
        status: isChecked ? 1 : 0,
        ccode: nationality?.num_code || "",
      };

      // Don't send photo URL if it's an existing URL (only send on new upload)
      if (
        typeof submitData.photo === "string" &&
        (submitData.photo as string).includes("http")
      ) {
        delete submitData.photo;
      }

      const isEdit = modalTitle !== "Create";
      const url = isEdit ? `admin/users/${item?.id}` : "admin/users";
      const method = isEdit ? "PUT" : "POST";

      const result = await fetchAdmin<SubmitApiResponse>(url, {
        method,
        body: submitData,
      });

      if (result?.status === true) {
        setResponseModal(result as unknown as Record<string, unknown>);
        onSave(result.data);
      }
    } catch (e: unknown) {
      const error = e as FetchError;

      if (error?.response?.status === 404 || error?.response?.status === 422) {
        if (error.data?.data) {
          const serverErrors: Record<string, string> = {};
          for (const [key, val] of Object.entries(error.data.data)) {
            serverErrors[key] = val[0];
          }
          setValidationErrors(serverErrors);
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

  // ─── Don't render when closed ──────────────────────────

  if (!isOpen) return null;

  // ─── Input helper ──────────────────────────────────────

  const inputClass = (field: string) =>
    `w-full border rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-sky-500 ${
      validationErrors[field]
        ? "border-red-500"
        : "border-gray-300 dark:border-gray-600"
    }`;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-9999 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />

        {/* Dialog */}
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl mx-4 animate-modal-enter max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-center w-full gap-2 p-4 border-b border-gray-200 dark:border-gray-700">
            <h4 className="text-xl font-semibold text-gray-900 dark:text-white">
              {modalTitle} User
            </h4>
          </div>

          {/* Form */}
          <form className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-6">
            {/* Photo upload placeholder */}
            <div className="col-span-1 sm:col-span-3 flex items-center gap-4">
              <div className="flex-auto">
                <label className="font-semibold text-gray-900 dark:text-white">
                  Upload Profile Image
                </label>
                <div className="w-64 mt-2">
                  {formData.photo ? (
                    <img
                      src={formData.photo}
                      alt="Profile"
                      className="w-24 h-24 object-cover rounded-md"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-md flex items-center justify-center text-gray-400">
                      <i className="fa fa-camera text-2xl" />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="mt-2 text-sm text-gray-600 dark:text-gray-400"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
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
            </div>

            {/* First Name */}
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-gray-900 dark:text-white">
                First Name
              </label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => updateField("first_name", e.target.value)}
                placeholder="i.e. John"
                className={inputClass("first_name")}
                autoComplete="off"
              />
              {validationErrors.first_name && (
                <p className="text-red-500 text-sm">
                  {validationErrors.first_name}
                </p>
              )}
            </div>

            {/* Middle Name */}
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-gray-900 dark:text-white">
                Middle Name
              </label>
              <input
                type="text"
                value={formData.middle_name}
                onChange={(e) => updateField("middle_name", e.target.value)}
                placeholder="i.e. Doe"
                className={inputClass("middle_name")}
                autoComplete="off"
              />
              {validationErrors.middle_name && (
                <p className="text-red-500 text-sm">
                  {validationErrors.middle_name}
                </p>
              )}
            </div>

            {/* Last Name */}
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-gray-900 dark:text-white">
                Last Name
              </label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => updateField("last_name", e.target.value)}
                placeholder="i.e. Smith"
                className={inputClass("last_name")}
                autoComplete="off"
              />
              {validationErrors.last_name && (
                <p className="text-red-500 text-sm">
                  {validationErrors.last_name}
                </p>
              )}
            </div>

            {/* Date of Birth */}
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-gray-900 dark:text-white">
                Date of Birth
              </label>
              <input
                type="date"
                value={formData.dob}
                onChange={(e) => updateField("dob", e.target.value)}
                className={inputClass("dob")}
                autoComplete="off"
              />
              {validationErrors.dob && (
                <p className="text-red-500 text-sm">{validationErrors.dob}</p>
              )}
            </div>

            {/* Gender */}
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-gray-900 dark:text-white">
                Gender
              </label>
              <select
                value={formData.gender}
                onChange={(e) => updateField("gender", e.target.value)}
                className={inputClass("gender")}
              >
                <option value="">Select Gender</option>
                {genderList.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.gender_name}
                  </option>
                ))}
              </select>
              {validationErrors.gender && (
                <p className="text-red-500 text-sm">
                  {validationErrors.gender}
                </p>
              )}
            </div>

            {/* Nationality */}
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-gray-900 dark:text-white">
                Nationality
              </label>
              <select
                value={formData.nationality_id}
                onChange={(e) => updateField("nationality_id", e.target.value)}
                className={inputClass("nationality_id")}
              >
                <option value="">Select Nationality</option>
                {nationalityList.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.nationality}
                  </option>
                ))}
              </select>
              {validationErrors.nationality_id && (
                <p className="text-red-500 text-sm">
                  {validationErrors.nationality_id}
                </p>
              )}
            </div>

            {/* Email — spans 2 columns */}
            <div className="col-span-1 sm:col-span-2 flex flex-col gap-1">
              <label className="font-semibold text-gray-900 dark:text-white">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => updateField("email", e.target.value)}
                placeholder="i.e. john@example.com"
                className={inputClass("email")}
                autoComplete="username"
              />
              {validationErrors.email && (
                <p className="text-red-500 text-sm">{validationErrors.email}</p>
              )}
            </div>

            {/* Mobile */}
            <div className="col-span-1 flex flex-col gap-1">
              <label className="font-semibold text-gray-900 dark:text-white">
                Mobile
              </label>
              <input
                type="number"
                value={formData.mobile}
                onChange={(e) => updateField("mobile", e.target.value)}
                placeholder="i.e. 1234567890"
                className={inputClass("mobile")}
                autoComplete="off"
              />
              {validationErrors.mobile && (
                <p className="text-red-500 text-sm">
                  {validationErrors.mobile}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-gray-900 dark:text-white">
                Password
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => updateField("password", e.target.value)}
                className={inputClass("password")}
                autoComplete="new-password"
              />
              {validationErrors.password && (
                <p className="text-red-500 text-sm">
                  {validationErrors.password}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-gray-900 dark:text-white">
                Confirm Password
              </label>
              <input
                type="password"
                value={formData.password_confirmation}
                onChange={(e) =>
                  updateField("password_confirmation", e.target.value)
                }
                className={inputClass("password_confirmation")}
                autoComplete="new-password"
              />
              {validationErrors.password_confirmation && (
                <p className="text-red-500 text-sm">
                  {validationErrors.password_confirmation}
                </p>
              )}
            </div>

            {/* User Type */}
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-gray-900 dark:text-white">
                User Type
              </label>
              <select
                value={formData.user_type}
                onChange={(e) => updateField("user_type", e.target.value)}
                className={inputClass("user_type")}
              >
                <option value="">Select User Type</option>
                {roleList.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.role_name}
                  </option>
                ))}
              </select>
              {validationErrors.user_type && (
                <p className="text-red-500 text-sm">
                  {validationErrors.user_type}
                </p>
              )}
            </div>

            {/* Status Toggle */}
            <div className="flex items-center gap-4">
              <label className="font-semibold text-gray-900 dark:text-white">
                Status
              </label>
              <button
                type="button"
                onClick={() => setIsChecked(!isChecked)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isChecked ? "bg-sky-500" : "bg-gray-300 dark:bg-gray-600"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isChecked ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </form>

          {/* Footer */}
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

      {/* Response Modal */}
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
