import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import type { AuthenticatedRequest } from '../interfaces/authenticated-request';
import { JwtAuthGuard } from './jwt-auth.guard';

const contextFor = (
  request: Partial<AuthenticatedRequest>,
): ExecutionContext =>
  ({
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => request }),
  }) as unknown as ExecutionContext;

describe('JwtAuthGuard', () => {
  const reflector = {
    getAllAndOverride: jest.fn<boolean, unknown[]>(),
  };
  const jwtService = {
    verifyAsync: jest.fn(),
  };
  const guard = new JwtAuthGuard(
    reflector as unknown as Reflector,
    jwtService as unknown as JwtService,
  );

  beforeEach(() => {
    jest.resetAllMocks();
    reflector.getAllAndOverride.mockReturnValue(false);
  });

  it('bypasses authentication for public handlers', async () => {
    reflector.getAllAndOverride.mockReturnValue(true);

    await expect(guard.canActivate(contextFor({ headers: {} }))).resolves.toBe(
      true,
    );
    expect(jwtService.verifyAsync).not.toHaveBeenCalled();
  });

  it('hydrates a verified bearer session onto the request', async () => {
    const request: Partial<AuthenticatedRequest> = {
      headers: { authorization: 'Bearer signed-token' },
    };
    jwtService.verifyAsync.mockResolvedValue({
      sub: 'account-1',
      loginId: 'reviewer',
      type: 'ADMIN',
      isDemo: true,
      roles: ['reviewer'],
      permissions: ['resources.view'],
    });

    await expect(guard.canActivate(contextFor(request))).resolves.toBe(true);
    expect(jwtService.verifyAsync).toHaveBeenCalledWith('signed-token');
    expect(request.user).toEqual({
      id: 'account-1',
      loginId: 'reviewer',
      type: 'ADMIN',
      isDemo: true,
      roles: ['reviewer'],
      permissions: ['resources.view'],
    });
  });

  it('rejects missing and invalid bearer sessions', async () => {
    await expect(
      guard.canActivate(contextFor({ headers: {} })),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    jwtService.verifyAsync.mockRejectedValue(new Error('invalid'));
    await expect(
      guard.canActivate(
        contextFor({ headers: { authorization: 'Bearer invalid-token' } }),
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
