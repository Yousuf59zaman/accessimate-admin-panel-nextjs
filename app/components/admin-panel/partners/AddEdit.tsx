"use client";

import React, { useCallback, useEffect, useState } from "react";
import { fetchAdmin } from "@/app/lib/fetchAdmin";
import ResponseModal from "@/app/components/ui/ResponseModal";

interface Partner { id?: number; name?: string; logo?: string; url?: string; status?: number; }
interface FormData { name: string; logo: string; url: string; status: number; }
interface SubmitApiResponse { status: boolean; message?: string; data: Partner; }
interface FetchError extends Error { response?: Response; data?: { status?: boolean; message?: string; data?: Record<string, string[]> }; }
interface AddEditProps { isOpen: boolean; item: Partner | null; modalTitle: string; onClose: () => void; onSave: (item: Partner) => void; }

const emptyForm: FormData = { name: "", logo: "", url: "", status: 0 };
const skipValidations = ["status"];

export default function AddEdit({ isOpen, item, modalTitle, onClose, onSave }: AddEditProps) {
  const [formData, setFormData] = useState<FormData>({ ...emptyForm });
  const [isChecked, setIsChecked] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [responseModal, setResponseModal] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (item && Object.keys(item).length > 0) { setValidationErrors({}); setFormData({ name: item.name || "", logo: item.logo || "", url: item.url || "", status: item.status || 0 }); setIsChecked(item.status === 1); }
    else { setFormData({ ...emptyForm }); setIsChecked(false); setValidationErrors({}); }
  }, [item]);

  const updateField = useCallback((field: keyof FormData, value: string | number) => { setFormData((prev) => ({ ...prev, [field]: value })); setValidationErrors((prev) => ({ ...prev, [field]: "" })); }, []);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    for (const [key, value] of Object.entries(formData)) { if (!value && !skipValidations.includes(key)) { newErrors[key] = `${key.replaceAll("_", " ")} is required`; } }
    if (Object.keys(newErrors).length > 0) { setValidationErrors(newErrors); return false; }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsLoading(true); setResponseModal({});
    try {
      const submitData = { ...formData, status: isChecked ? 1 : 0 };
      const isEdit = modalTitle !== "Create";
      const result = await fetchAdmin<SubmitApiResponse>(isEdit ? `admin/partners/${item?.id}` : "admin/partners", { method: isEdit ? "PUT" : "POST", body: submitData });
      if (result?.status === true) { setResponseModal(result as unknown as Record<string, unknown>); onSave(result.data); }
    } catch (e: unknown) {
      const error = e as FetchError;
      if (error?.response?.status === 404 || error?.response?.status === 422) { if (error.data?.data) { const se: Record<string, string> = {}; for (const [key, val] of Object.entries(error.data.data)) { se[key] = val[0]; } setValidationErrors(se); } }
      else if (!error?.response?.status) { setResponseModal({ status: false, message: "Something went wrong. Please try again later." }); }
      else { setResponseModal({ status: error.data?.status ?? false, message: error.data?.message ?? "An error occurred" }); }
    } finally { setIsLoading(false); }
  };

  if (!isOpen) return null;
  const inputClass = (field: string) => `w-full border rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-sky-500 ${validationErrors[field] ? "border-red-500" : "border-gray-300 dark:border-gray-600"}`;

  return (
    <>
      <div className="fixed inset-0 z-9999 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg mx-4 animate-modal-enter max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center w-full gap-2 p-4 border-b border-gray-200 dark:border-gray-700"><h4 className="text-xl font-semibold text-gray-900 dark:text-white">{modalTitle} Partner</h4></div>
          <div className="grid grid-cols-1 gap-4 p-6">
            <div className="flex items-center gap-4">
              <label className="font-semibold w-24 text-gray-900 dark:text-white">Name</label>
              <div className="flex-auto">
                <input type="text" value={formData.name} onChange={(e) => updateField("name", e.target.value)} placeholder="i.e. Partner Inc." className={inputClass("name")} autoComplete="off" onFocus={() => setValidationErrors((prev) => ({ ...prev, name: "" }))} />
                {validationErrors.name && <p className="text-red-500 text-sm mt-1">{validationErrors.name}</p>}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <label className="font-semibold w-24 text-gray-900 dark:text-white">Logo URL</label>
              <div className="flex-auto">
                <input type="text" value={formData.logo} onChange={(e) => updateField("logo", e.target.value)} placeholder="i.e. /images/partner.png" className={inputClass("logo")} autoComplete="off" onFocus={() => setValidationErrors((prev) => ({ ...prev, logo: "" }))} />
                {validationErrors.logo && <p className="text-red-500 text-sm mt-1">{validationErrors.logo}</p>}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <label className="font-semibold w-24 text-gray-900 dark:text-white">URL</label>
              <div className="flex-auto">
                <input type="text" value={formData.url} onChange={(e) => updateField("url", e.target.value)} placeholder="i.e. https://partner.com" className={inputClass("url")} autoComplete="off" onFocus={() => setValidationErrors((prev) => ({ ...prev, url: "" }))} />
                {validationErrors.url && <p className="text-red-500 text-sm mt-1">{validationErrors.url}</p>}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <label className="font-semibold w-24 text-gray-900 dark:text-white">Status</label>
              <div className="flex-auto"><button type="button" onClick={() => setIsChecked(!isChecked)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isChecked ? "bg-sky-500" : "bg-gray-300 dark:bg-gray-600"}`}><span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isChecked ? "translate-x-6" : "translate-x-1"}`} /></button></div>
            </div>
          </div>
          <div className="flex justify-end items-center gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
            {isLoading ? (<button disabled className="px-6 py-2 bg-gray-400 text-white rounded-md cursor-not-allowed flex items-center gap-2"><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /></button>) : (<><button type="button" onClick={onClose} className="px-4 py-2 border border-red-500 text-red-500 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-300 hover:scale-105 flex items-center gap-2"><i className="pi pi-times-circle" />Cancel</button><button type="button" onClick={handleSubmit} className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center gap-2"><i className={modalTitle === "Create" ? "pi pi-plus-circle" : "pi pi-refresh"} />{modalTitle === "Create" ? "Create" : "Update"}</button></>)}
          </div>
        </div>
      </div>
      <ResponseModal data={responseModal as { status?: boolean; message?: string; error?: Record<string, string[]> }} onClose={() => setResponseModal({})} />
    </>
  );
}
