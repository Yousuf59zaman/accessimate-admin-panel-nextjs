import { NextRequest } from 'next/server';
import { proxyBackendRequest } from '@/app/lib/server/backendProxy';

type RouteContext = { params: Promise<{ path: string[] }> };

const handler = async (request: NextRequest, context: RouteContext) => {
  const { path } = await context.params;
  return proxyBackendRequest(request, 'citizen', path);
};

export {
  handler as DELETE,
  handler as GET,
  handler as PATCH,
  handler as POST,
  handler as PUT,
};
