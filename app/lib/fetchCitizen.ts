import Cookies from 'js-cookie';

export const XCTN_TOKEN = 'XCTN-TOKEN';

interface FetchError extends Error {
  response?: Response;
  data?: Record<string, unknown> | null;
}

interface FetchCitizenOptions extends Omit<RequestInit, 'body'> {
  body?: Record<string, unknown> | FormData | BodyInit | null;
}

export async function fetchCitizen<T = unknown>(
  path: string,
  options: FetchCitizenOptions = {}
): Promise<T> {
  const baseURL = process.env.NEXT_PUBLIC_API_URL_CITIZEN;
  const token = Cookies.get(XCTN_TOKEN);
  const { body: rawBody, ...restOptions } = options;

  const headers: Record<string, string> = {
    accept: 'application/json',
    ...(restOptions.headers as Record<string, string>),
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  // Don't set Content-Type for FormData — browser sets it with boundary
  let processedBody: BodyInit | null | undefined = rawBody as BodyInit | null | undefined;
  if (rawBody && !(rawBody instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    processedBody = JSON.stringify(rawBody);
  }

  const url = `${baseURL}${path}`;

  try {
    const response = await fetch(url, {
      ...restOptions,
      headers,
      body: processedBody,
    });

    // Handle 401 — clear token and redirect to login
    if (response.status === 401) {
      Cookies.remove(XCTN_TOKEN);
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new Error('Unauthorized');
    }

    // Handle server errors
    if (response.status >= 500) {
      const errorData = await response.json().catch(() => null);
      console.error('[Http Error]', errorData?.message, errorData);
      throw new Error(errorData?.message || 'Server error');
    }

    // Handle other errors (404, 409, etc.)
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const error: FetchError = new Error(errorData?.message || 'Request failed');
      error.response = response;
      error.data = errorData;
      throw error;
    }

    return await response.json();
  } catch (error: unknown) {
    // Re-throw fetch errors with response data attached
    throw error;
  }
}
