"use client";

import React, { useCallback, useEffect, useState } from "react";
import { fetchAdmin } from "@/app/lib/fetchAdmin";
import ResponseModal from "@/app/components/ui/ResponseModal";

interface FaqCategory { id?: number; title?: string; slug?: string; parent_id?: number | string; status?: number; }
interface FormData { title: string; slug: string; parent_id: string | number; status: number; }
interface SubmitApiResponse { status: boolean; message?: string; data: FaqCategory; }
interface FetchError extends Error { response?: Response; data?: { status?: boolean; message?: string; data?: Record<string, string[]> }; }
interface AddEditProps { isOpen: boolean; item: FaqCategory | null; modalTitle: string; onClose: () => void; onSave: (item: FaqCategory) => void; allData?: FaqCategory[]; }

const emptyForm: FormData = { title: "", slug: "", parent_id: "", status: 0 };
const skipValidations = ["status", "parent_id"];

export default function AddEdit({ isOpen, item, modalTitle, onClose, onSave, allData }: AddEditProps) {
  const [formData, setFormData] = useState<FormData>({ ...emptyForm });
  const [isChecked, setIsChecked] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [responseModal, setResponseModal] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (item && Object.keys(item).length > 0) { setValidationErrors({}); setFormData({ title: item.title || "", slug: item.slug || "", parent_id: item.parent_id || "", status: item.status || 0 }); setIsChecked(item.status === 1); }
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
      const result = await fetchAdmin<SubmitApiResponse>(isEdit ? `admin/faq-categories/${item?.id}` : "admin/faq-categories", { method: isEdit ? "PUT" : "POST", body: submitData });
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

      <ResponseModal data={responseModal as { status?: boolean; message?: string; error?: Record<string, string[]> }} onClose={() => setResponseModal({})} />

      {isOpen && (
      <div className="fixed inset-0 z-9999 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg mx-4 animate-modal-enter max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center w-full gap-2 p-4 border-b border-gray-200 dark:border-gray-700"><h4 className="text-xl font-semibold text-gray-900 dark:text-white">{modalTitle} Category</h4></div>
          <div className="grid grid-cols-1 gap-4 p-6">
            <div className="flex items-center gap-4">
              <label className="font-semibold w-24 text-gray-900 dark:text-white">Title</label>
              <div className="flex-auto">
                <input type="text" value={formData.title} onChange={(e) => updateField("title", e.target.value)} placeholder="i.e. General" className={inputClass("title")} autoComplete="off" onFocus={() => setValidationErrors((prev) => ({ ...prev, title: "" }))} />
                {validationErrors.title && <p className="text-red-500 text-sm mt-1">{validationErrors.title}</p>}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <label className="font-semibold w-24 text-gray-900 dark:text-white">Slug</label>
              <div className="flex-auto">
                <input type="text" value={formData.slug} onChange={(e) => updateField("slug", e.target.value)} placeholder="i.e. general" className={inputClass("slug")} autoComplete="off" onFocus={() => setValidationErrors((prev) => ({ ...prev, slug: "" }))} />
                {validationErrors.slug && <p className="text-red-500 text-sm mt-1">{validationErrors.slug}</p>}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <label className="font-semibold w-24 text-gray-900 dark:text-white">Parent</label>
              <div className="flex-auto">
                <select value={formData.parent_id} onChange={(e) => updateField("parent_id", e.target.value)} className={inputClass("parent_id")} onFocus={() => setValidationErrors((prev) => ({ ...prev, parent_id: "" }))}>
                  <option value="">Select Parent</option>
                  {(allData || []).filter(d => d.id !== item?.id).map((d) => (<option key={d.id} value={d.id}>{d.title}</option>))}
                </select>
                {validationErrors.parent_id && <p className="text-red-500 text-sm mt-1">{validationErrors.parent_id}</p>}
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
      )}
    </>
  );
}