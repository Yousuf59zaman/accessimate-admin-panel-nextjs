'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { fetchAdmin } from '@/app/lib/fetchAdmin';
import type { OptionItem } from '@/app/helpers/globalFunctions';

// ─── Types ──────────────────────────────────────────────────

interface Permissions {
  add?: boolean;
  edit?: boolean;
  delete?: boolean;
  [key: string]: boolean | undefined;
}

interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

/** Standard API list response shape */
interface ApiListResponse<T> {
  status: boolean;
  message?: string;
  data: {
    data: T[];
    permissions: Permissions;
    meta: PaginationMeta;
  };
}

/** Standard API single-item response shape */
interface ApiActionResponse {
  status: boolean;
  message?: string;
  [key: string]: unknown;
}

interface FetchError {
  message?: string;
  response?: {
    status?: number;
    _data?: Record<string, unknown>;
  };
}

interface UseAdminCrudOptions {
  /** API endpoint for listing, e.g. 'admin/users/all' */
  apiEndpoint: string;
  /** API base for delete/restore, e.g. 'admin/users' */
  apiBase: string;
  /** Items per page (default: 10) */
  pageSize?: number;
  /** Initial status option (default: Active with status=1). Use optionsAcTr()[0] for tables without a status column. */
  initialStatus?: OptionItem;
}

interface CrudActionResult {
  success: boolean;
  response: Record<string, unknown>;
}

interface UseAdminCrudReturn<T> {
  data: T[];
  setData: React.Dispatch<React.SetStateAction<T[]>>;
  isLoading: boolean;
  permissions: Permissions;
  paginationMeta: PaginationMeta;
  search: string;
  setSearch: (v: string) => void;
  status: OptionItem;
  setStatus: (v: OptionItem) => void;
  loadData: (page?: number) => Promise<void>;
  handleDelete: (id: number | string) => Promise<CrudActionResult>;
  handleRestore: (id: number | string) => Promise<CrudActionResult>;
  handleAfterSave: (item: T, isEdit: boolean) => void;
  resetPagination: () => void;
}

// ─── Hook ───────────────────────────────────────────────────

export function useAdminCrud<T extends { id: number | string }>(
  options: UseAdminCrudOptions
): UseAdminCrudReturn<T> {
  const { apiEndpoint, apiBase, pageSize = 10, initialStatus } = options;

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [permissions, setPermissions] = useState<Permissions>({});
  const [paginationMeta, setPaginationMeta] = useState<PaginationMeta>({
    current_page: 1,
    last_page: 1,
    per_page: pageSize,
    total: 0,
    from: 0,
    to: 0,
  });
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<OptionItem>(
    initialStatus ?? { name: 'All', value: '', key: '' }
  );

  // ─── Load data from API ─────────────────────────────────

  const loadData = useCallback(
    async (page?: number) => {
      setIsLoading(true);
      setPermissions({});
      try {
        const currentPage = page ?? Number(searchParams.get('page') || 1);
        const result = await fetchAdmin<ApiListResponse<T>>(apiEndpoint, {
          method: 'POST',
          body: {
            paginate: true,
            page: currentPage,
            length: pageSize,
            search,
            status: status.key === 'status' ? status.value : '',
            trashed: status.key === 'trashed' ? 'only' : '',
          },
        });

        if (result?.data) {
          setData(result.data.data || []);
          setPermissions(result.data.permissions || {});
          setPaginationMeta(result.data.meta || paginationMeta);
        }
      } catch (e: unknown) {
        const error = e as FetchError;
        console.error('CRUD loadData error:', error?.message);
      } finally {
        setIsLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [apiEndpoint, pageSize, search, status, searchParams]
  );

  // ─── Auto-load on mount & when query changes ───────────

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ─── Delete handler ─────────────────────────────────────

  const handleDelete = useCallback(
    async (id: number | string): Promise<CrudActionResult> => {
      try {
        const result = await fetchAdmin<ApiActionResponse>(`${apiBase}/${id}`, {
          method: 'DELETE',
        });
        if (result?.status === true) {
          setData((prev) => prev.filter((item) => item.id !== id));
          return { success: true, response: result as unknown as Record<string, unknown> };
        }
        return { success: false, response: (result || {}) as Record<string, unknown> };
      } catch (e: unknown) {
        const error = e as FetchError;
        if (
          error?.response?.status === 404 ||
          error?.response?.status === 409
        ) {
          return { success: false, response: (error.response._data || {}) as Record<string, unknown> };
        }
        return { success: false, response: {} as Record<string, unknown> };
      }
    },
    [apiBase]
  );

  // ─── Restore handler ───────────────────────────────────

  const handleRestore = useCallback(
    async (id: number | string): Promise<CrudActionResult> => {
      try {
        const result = await fetchAdmin<ApiActionResponse>(`${apiBase}/restore/${id}`, {
          method: 'POST',
        });
        if (result?.status === true) {
          setData((prev) => prev.filter((item) => item.id !== id));
          return { success: true, response: result as unknown as Record<string, unknown> };
        }
        return { success: false, response: (result || {}) as Record<string, unknown> };
      } catch (e: unknown) {
        const error = e as FetchError;
        if (
          error?.response?.status === 404 ||
          error?.response?.status === 409
        ) {
          return { success: false, response: (error.response._data || {}) as Record<string, unknown> };
        }
        return { success: false, response: {} as Record<string, unknown> };
      }
    },
    [apiBase]
  );

  // ─── After save helper ─────────────────────────────────

  const handleAfterSave = useCallback(
    (item: T, isEdit: boolean) => {
      if (isEdit) {
        setData((prev) =>
          prev.map((existing) => (existing.id === item.id ? item : existing))
        );
      } else {
        setData((prev) => [...prev, item]);
      }
    },
    []
  );

  // ─── Reset pagination ──────────────────────────────────

  const resetPagination = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('page');
    router.replace(`${pathname}?${params.toString()}`);
  }, [searchParams, router, pathname]);

  return {
    data,
    setData,
    isLoading,
    permissions,
    paginationMeta,
    search,
    setSearch,
    status,
    setStatus,
    loadData,
    handleDelete,
    handleRestore,
    handleAfterSave,
    resetPagination,
  };
}
