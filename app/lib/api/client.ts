export type ApiRequestBody =
  | Record<string, unknown>
  | Record<string, unknown>[]
  | BodyInit
  | null;

export interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  body?: ApiRequestBody;
}

export class ApiRequestError extends Error {
  readonly status: number;
  readonly response: Response;
  readonly data?: Record<string, unknown> | null;

  constructor(
    message: string,
    response: Response,
    data?: Record<string, unknown> | null,
  ) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = response.status;
    this.response = response;
    this.data = data;
  }
}

type ApiRole = 'admin' | 'citizen';

const normalizePath = (role: ApiRole, path: string) => {
  const rolePrefix = role === 'admin' ? 'admin/' : 'customer/';
  const cleanPath = path.replace(/^\/+/, '');
  return cleanPath.startsWith(rolePrefix)
    ? cleanPath.slice(rolePrefix.length)
    : cleanPath;
};

const isNativeBody = (body: ApiRequestBody): body is BodyInit =>
  typeof body === 'string' ||
  body instanceof FormData ||
  body instanceof URLSearchParams ||
  body instanceof Blob ||
  body instanceof ArrayBuffer ||
  ArrayBuffer.isView(body);

const unauthorizedEvent = (role: ApiRole, path: string) => {
  if (typeof window === 'undefined') return;
  if (['login', 'demo-login', 'user'].includes(path)) return;
  window.dispatchEvent(new Event(`accessimate:${role}-unauthorized`));
};

export const apiRequest = async <T>(
  role: ApiRole,
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> => {
  const cleanPath = normalizePath(role, path);
  const { body: rawBody, ...requestOptions } = options;
  const headers = new Headers(requestOptions.headers);
  headers.set('accept', 'application/json');

  let body: BodyInit | null | undefined;
  if (rawBody !== undefined && rawBody !== null) {
    if (isNativeBody(rawBody)) {
      body = rawBody;
    } else {
      headers.set('content-type', 'application/json');
      body = JSON.stringify(rawBody);
    }
  }

  const response = await fetch(`/api/${role}/${cleanPath}`, {
    ...requestOptions,
    headers,
    body,
    cache: 'no-store',
  });

  if (response.status === 204) return undefined as T;
  const contentType = response.headers.get('content-type') ?? '';
  const payload = contentType.includes('application/json')
    ? ((await response.json().catch(() => null)) as Record<string, unknown> | null)
    : null;

  if (!response.ok) {
    if (response.status === 401) unauthorizedEvent(role, cleanPath);
    const message =
      typeof payload?.message === 'string'
        ? payload.message
        : 'The request could not be completed.';
    throw new ApiRequestError(message, response, payload);
  }

  return payload as T;
};
