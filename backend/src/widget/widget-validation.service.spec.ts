import type { PrismaService } from '../prisma/prisma.service';
import {
  normalizeWidgetOrigin,
  WidgetValidationService,
} from './widget-validation.service';

describe('WidgetValidationService', () => {
  const prisma = {
    account: { findUnique: jest.fn() },
  };
  const service = new WidgetValidationService(
    prisma as unknown as PrismaService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('normalizes URL paths to their origin', () => {
    expect(normalizeWidgetOrigin('https://demo.test/path?q=1')).toBe(
      'https://demo.test',
    );
  });

  it('accepts the public reviewer key on the wildcard demo origin', async () => {
    prisma.account.findUnique.mockResolvedValue({
      id: 'account-1',
      firstName: 'Demo',
      lastName: 'Citizen',
      apiKey: 'am_demo_reviewer_2026',
      isActive: true,
      widgetOrigins: [{ origin: '*' }],
      websites: [],
    });

    await expect(
      service.validate('am_demo_reviewer_2026', 'https://preview.vercel.app/path'),
    ).resolves.toEqual({
      status: true,
      data: {
        account_id: 'account-1',
        account_name: 'Demo Citizen',
        origin: 'https://preview.vercel.app',
      },
    });
  });

  it('accepts an account website origin even when the path differs', async () => {
    prisma.account.findUnique.mockResolvedValue({
      id: 'account-2',
      firstName: 'Site',
      lastName: 'Owner',
      apiKey: 'site-key',
      isActive: true,
      widgetOrigins: [],
      websites: [{ url: 'https://site.test/registered-path' }],
    });

    await expect(
      service.validate('site-key', 'https://site.test/live-page'),
    ).resolves.toMatchObject({ status: true });
  });

  it('rejects inactive, unknown, or origin-mismatched accounts', async () => {
    prisma.account.findUnique.mockResolvedValue({
      id: 'account-3',
      firstName: 'Blocked',
      lastName: 'User',
      apiKey: 'blocked-key',
      isActive: false,
      widgetOrigins: [{ origin: 'https://allowed.test' }],
      websites: [],
    });

    await expect(
      service.validate('blocked-key', 'https://allowed.test'),
    ).resolves.toEqual({
      status: false,
      message: 'Token invalid / Origin not allowed',
    });
  });
});
