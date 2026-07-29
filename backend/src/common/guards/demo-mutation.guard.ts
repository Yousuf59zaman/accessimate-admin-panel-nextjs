import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../interfaces/authenticated-request';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const DEMO_SAFE_POST_PATHS = new Set([
  '/api/v1/admin/user',
  '/api/v1/admin/tree-entity/main-menu',
  '/api/v1/customer/user',
]);

@Injectable()
export class DemoMutationGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.user?.isDemo) return true;
    if (SAFE_METHODS.has(request.method)) return true;
    if (DEMO_SAFE_POST_PATHS.has(request.path)) return true;
    if (request.path.endsWith('/all')) return true;
    if (request.path.endsWith('/logout')) return true;

    throw new ForbiddenException(
      'Reviewer mode is read-only. Sign in as the owner to modify data.',
    );
  }
}
