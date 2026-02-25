/**
 * Global Helper Functions
 *
 * Replaces: plugins/globalFunction.ts (Nuxt defineNuxtPlugin → plain exports)
 *
 * Nuxt usage:  const { $truncateText } = useNuxtApp()
 * Next usage:  import { truncateText } from '@/app/helpers/globalFunctions'
 */

// ─── Option Lists ──────────────────────────────────────────────

export interface OptionItem {
  name: string;
  value?: string;
  key?: string;
}

export interface TypeItem {
  id: number | null;
  name: string;
}

export interface PackageTypeItem {
  key: string;
  name: string;
}

/** Status filter: All / Active / Inactive / Trashed */
export function optionsList(): OptionItem[] {
  return [
    { name: 'All', value: '', key: '' },
    { name: 'Active', value: '1', key: 'status' },
    { name: 'Inactive', value: '0', key: 'status' },
    { name: 'Trashed', value: 'only', key: 'trashed' },
  ];
}

/** Status filter: Active / Trashed */
export function optionsAcTr(): OptionItem[] {
  return [
    { name: 'Active', value: '', key: '' },
    { name: 'Trashed', value: 'only', key: 'trashed' },
  ];
}

/** Status filter: Active / Inactive */
export function optionsListAcIn(): OptionItem[] {
  return [
    { name: 'Active', value: '', key: '' },
    { name: 'Inactive', value: '0', key: 'status' },
  ];
}

/** Content type list */
export function typetList(): TypeItem[] {
  return [
    { id: null, name: 'Select Type' },
    { id: 1, name: 'Content' },
    { id: 2, name: 'Image' },
    { id: 3, name: 'PDF' },
    { id: 4, name: 'Video' },
  ];
}

/** Icon type list */
export function typetIconList(): TypeItem[] {
  return [
    { id: null, name: 'Select Type' },
    { id: 1, name: 'Icon' },
    { id: 2, name: 'Text' },
    { id: 3, name: 'Icon & Text' },
  ];
}

/** Package duration type */
export function typePackageList(): PackageTypeItem[] {
  return [
    { key: 'yearly', name: 'Yearly' },
    { key: 'monthly', name: 'Monthly' },
  ];
}

/** Link type list */
export function linkTypeList(): OptionItem[] {
  return [
    { name: 'Internal', value: '1' },
    { name: 'External', value: '2' },
  ];
}

// ─── Text Helpers ──────────────────────────────────────────────

/** Truncate text to a given length, appending "..." */
export function truncateText(text: string, length: number): string {
  if (text.length > length) {
    return text.substring(0, length) + '...';
  }
  return text;
}

// ─── Date Helpers ──────────────────────────────────────────────

/** Format date for display: "25 February, 2026" */
export function viewFormatDate(dateString: string): string {
  const options = { day: '2-digit', month: 'long', year: 'numeric' } as const;
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', options);
}

/** Format date+time for display: "25 February, 2026 at 11:50 AM" */
export function viewFormatDateTime(dateString: string): string {
  const options = {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  } as const;
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', options);
}

/** Format for API submission: "2026-02-25 11:50:00" (24h) */
export function submitDateTimeFormat(isoString: string): string {
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/** Format for API submission in 12h: "2026-02-25 11:50 AM" */
export function submitDateTimeAmPmFormat(isoString: string): string {
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${year}-${month}-${day} ${String(hours12).padStart(2, '0')}:${minutes} ${ampm}`;
}

// ─── Conversion Helpers ────────────────────────────────────────

/** Convert minutes to milliseconds */
export function minutesToMilliseconds(minutes: number): number {
  return minutes * 60 * 1000;
}
