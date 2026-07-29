import {
  apiRequest,
  ApiRequestOptions,
} from '@/app/lib/api/client';

export const fetchCitizen = <T = unknown>(
  path: string,
  options: ApiRequestOptions = {},
) => apiRequest<T>('citizen', path, options);
