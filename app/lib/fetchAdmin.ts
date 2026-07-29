import {
  apiRequest,
  ApiRequestOptions,
} from '@/app/lib/api/client';

export const fetchAdmin = <T = unknown>(
  path: string,
  options: ApiRequestOptions = {},
) => apiRequest<T>('admin', path, options);
