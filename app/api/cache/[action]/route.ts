import { NextRequest } from 'next/server';
import { proxyWidgetBackendRequest } from '@/app/lib/server/widgetBackendProxy';

type RouteContext = { params: Promise<{ action: string }> };

const handler = async (request: NextRequest, context: RouteContext) => {
  const { action } = await context.params;
  return proxyWidgetBackendRequest(request, `cache/${action}`);
};

export { handler as DELETE, handler as POST };
