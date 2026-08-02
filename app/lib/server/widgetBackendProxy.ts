import { NextRequest, NextResponse } from 'next/server';

const widgetContracts = new Map<string, ReadonlySet<string>>([
  ['cache/store', new Set(['POST'])],
  ['cache/retrieve', new Set(['POST'])],
  ['cache/update-adjustments', new Set(['POST'])],
  ['cache/clear', new Set(['DELETE'])],
  ['customer/validete', new Set(['POST'])],
]);

const unavailableResponse = (message: string, status: number) =>
  NextResponse.json(
    { status: false, success: false, message },
    { status, headers: { 'Cache-Control': 'no-store' } },
  );

export const proxyWidgetBackendRequest = async (
  request: NextRequest,
  contract: string,
) => {
  const methods = widgetContracts.get(contract);
  if (!methods || !methods.has(request.method)) {
    return unavailableResponse('The widget API request is not supported.', 405);
  }

  const backendBaseUrl = process.env.API_URL_BACKEND?.replace(/\/+$/, '');
  if (!backendBaseUrl) {
    return unavailableResponse(
      'The widget backend is not configured for this deployment.',
      503,
    );
  }

  const headers = new Headers({
    accept: 'application/json',
    'content-type': request.headers.get('content-type') ?? 'application/json',
  });
  const requestId = request.headers.get('x-request-id');
  if (requestId) headers.set('x-request-id', requestId);

  let upstream: Response;
  try {
    const body = await request.arrayBuffer();
    upstream = await fetch(`${backendBaseUrl}/api/${contract}`, {
      method: request.method,
      headers,
      body: body.byteLength ? body : undefined,
      cache: 'no-store',
      redirect: 'manual',
    });
  } catch {
    return unavailableResponse(
      'The widget backend is temporarily unavailable.',
      502,
    );
  }

  const contentType = upstream.headers.get('content-type') ?? 'application/json';
  const response = new NextResponse(await upstream.arrayBuffer(), {
    status: upstream.status,
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': contentType,
    },
  });
  const upstreamRequestId = upstream.headers.get('x-request-id');
  if (upstreamRequestId) response.headers.set('x-request-id', upstreamRequestId);
  return response;
};
