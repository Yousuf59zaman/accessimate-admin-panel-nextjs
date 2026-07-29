import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import type { AuthenticatedRequest } from '../interfaces/authenticated-request';
import { DemoMutationGuard } from './demo-mutation.guard';

const contextFor = (
  request: Partial<AuthenticatedRequest>,
): ExecutionContext =>
  ({
    switchToHttp: () => ({ getRequest: () => request }),
  }) as unknown as ExecutionContext;

describe('DemoMutationGuard', () => {
  const guard = new DemoMutationGuard();

  it('allows owner mutations', () => {
    const context = contextFor({
      method: 'POST',
      path: '/api/v1/admin/news',
      user: {
        id: 'owner',
        loginId: 'owner',
        type: 'ADMIN',
        isDemo: false,
        roles: ['super-admin'],
        permissions: ['resources.create'],
      },
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it.each([
    ['GET', '/api/v1/admin/news'],
    ['POST', '/api/v1/admin/news/all'],
    ['POST', '/api/v1/admin/tree-entity/main-menu'],
    ['POST', '/api/v1/customer/user'],
    ['POST', '/api/v1/admin/logout'],
  ])('allows demo-safe %s %s requests', (method, path) => {
    const context = contextFor({
      method,
      path,
      user: {
        id: 'reviewer',
        loginId: 'reviewer',
        type: 'ADMIN',
        isDemo: true,
        roles: ['reviewer'],
        permissions: ['resources.view'],
      },
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('blocks demo mutations', () => {
    const context = contextFor({
      method: 'DELETE',
      path: '/api/v1/admin/news/1',
      user: {
        id: 'reviewer',
        loginId: 'reviewer',
        type: 'ADMIN',
        isDemo: true,
        roles: ['reviewer'],
        permissions: ['resources.view'],
      },
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
