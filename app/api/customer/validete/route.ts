import { NextRequest } from 'next/server';
import { proxyWidgetBackendRequest } from '@/app/lib/server/widgetBackendProxy';

export const POST = (request: NextRequest) =>
  proxyWidgetBackendRequest(request, 'customer/validete');
