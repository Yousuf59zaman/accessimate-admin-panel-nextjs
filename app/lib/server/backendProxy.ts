import { NextRequest, NextResponse } from 'next/server';
import {
  ADMIN_SESSION_COOKIE,
  CITIZEN_SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
} from '@/app/lib/auth/constants';

type BackendRole = 'admin' | 'citizen';

type ProxyConfiguration = {
  backendPrefix: 'admin' | 'customer';
  cookieName: string;
  publicPaths: Set<string>;
};

const configurations: Record<BackendRole, ProxyConfiguration> = {
  admin: {
    backendPrefix: 'admin',
    cookieName: ADMIN_SESSION_COOKIE,
    publicPaths: new Set(['login', 'demo-login']),
  },
  citizen: {
    backendPrefix: 'customer',
    cookieName: CITIZEN_SESSION_COOKIE,
    publicPaths: new Set(['login', 'demo-login', 'sso-login']),
  },
};

const isSafeSegment = (segment: string) =>
  segment !== '.' &&
  segment !== '..' &&
  /^[a-zA-Z0-9._~-]+$/.test(segment);

const jsonResponse = (body: unknown, status: number) =>
  NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });

const sessionPayload = (payload: unknown) => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { payload, token: undefined };
  }

  const response = payload as Record<string, unknown>;
  if (!response.data || typeof response.data !== 'object' || Array.isArray(response.data)) {
    return { payload, token: undefined };
  }

  const data = response.data as Record<string, unknown>;
  const token = typeof data.token === 'string' ? data.token : undefined;
  if (!token) return { payload, token: undefined };

  const { token: _token, ...safeData } = data;
  void _token;
  return {
    payload: { ...response, data: safeData },
    token,
  };
};

export const proxyBackendRequest = async (
  request: NextRequest,
  role: BackendRole,
  segments: string[],
) => {
  if (!segments.length || segments.some((segment) => !isSafeSegment(segment))) {
    return jsonResponse(
      { status: false, message: 'The requested API path is invalid.' },
      400,
    );
  }

  const config = configurations[role];
  const routePath = segments.join('/');
  const isPublicPath = config.publicPaths.has(routePath);
  const token = request.cookies.get(config.cookieName)?.value;

  if (!isPublicPath && !token) {
    const response = jsonResponse(
      { status: false, message: 'Authentication is required.' },
      401,
    );
    response.cookies.delete(config.cookieName);
    return response;
  }

  const backendBaseUrl = process.env.API_URL_BACKEND?.replace(/\/+$/, '');
  if (!backendBaseUrl) {
    return jsonResponse(
      {
        status: false,
        message: 'The backend service is not configured for this deployment.',
      },
      503,
    );
  }

  const upstreamUrl = `${backendBaseUrl}/api/v1/${config.backendPrefix}/${routePath}${request.nextUrl.search}`;
  const headers = new Headers({ accept: 'application/json' });
  const contentType = request.headers.get('content-type');
  const requestId = request.headers.get('x-request-id');
  if (contentType) headers.set('content-type', contentType);
  if (requestId) headers.set('x-request-id', requestId);
  if (token) headers.set('authorization', `Bearer ${token}`);

  const hasBody = request.method !== 'GET' && request.method !== 'HEAD';
  const body = hasBody ? await request.arrayBuffer() : undefined;

  let upstream: Response;
  try {
    upstream = await fetch(upstreamUrl, {
      method: request.method,
      headers,
      body: body?.byteLength ? body : undefined,
      cache: 'no-store',
      redirect: 'manual',
    });
  } catch {
    return jsonResponse(
      {
        status: false,
        message: 'The backend service is temporarily unavailable.',
      },
      502,
    );
  }

  const upstreamContentType = upstream.headers.get('content-type') ?? '';
  const requestIdResponse = upstream.headers.get('x-request-id');
  let response: NextResponse;
  let sessionToken: string | undefined;

  if (upstreamContentType.includes('application/json')) {
    const payload = (await upstream.json().catch(() => ({
      status: false,
      message: 'The backend returned an invalid JSON response.',
    }))) as unknown;
    const safeSession = sessionPayload(payload);
    sessionToken = safeSession.token;
    response = jsonResponse(safeSession.payload, upstream.status);
  } else {
    response = new NextResponse(await upstream.arrayBuffer(), {
      status: upstream.status,
      headers: {
        'Cache-Control': 'no-store',
        ...(upstreamContentType ? { 'Content-Type': upstreamContentType } : {}),
      },
    });
  }

  if (requestIdResponse) response.headers.set('x-request-id', requestIdResponse);
  if (sessionToken && upstream.ok) {
    response.cookies.set(config.cookieName, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE_SECONDS,
    });
  }
  if (routePath === 'logout' || upstream.status === 401) {
    response.cookies.delete(config.cookieName);
  }

  return response;
};
