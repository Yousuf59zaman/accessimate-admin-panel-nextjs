import type { PrismaService } from '../prisma/prisma.service';
import {
  WIDGET_CACHE_VALIDITY_MS,
  WidgetCacheService,
} from './widget-cache.service';

describe('WidgetCacheService', () => {
  const prisma = {
    account: { findUnique: jest.fn() },
    widgetSession: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
  };
  const service = new WidgetCacheService(
    prisma as unknown as PrismaService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses the original Express cache-key algorithm', () => {
    expect(WidgetCacheService.createCacheKey('https://demo.test:3000/a')).toBe(
      'wcag_https___demo_test_3000_a',
    );
  });

  it('persists the original store contract in PostgreSQL', async () => {
    prisma.account.findUnique.mockResolvedValue({ id: 'account-1' });
    prisma.widgetSession.upsert.mockResolvedValue({ id: 'session-1' });

    await expect(
      service.store('https://demo.test', 'api-key', 'valid', {
        lineHeight: 1.75,
      }),
    ).resolves.toMatchObject({
      success: true,
      message: 'Data stored successfully',
      cacheKey: 'wcag_https___demo_test',
    });
    expect(prisma.widgetSession.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { cacheKey: 'wcag_https___demo_test' },
        create: expect.objectContaining({
          origin: 'https://demo.test',
          apiKey: 'api-key',
          accountId: 'account-1',
          adjustments: { lineHeight: 1.75 },
        }),
      }),
    );
  });

  it('returns the original retrieve shape for a live session', async () => {
    const validatedAt = new Date();
    prisma.widgetSession.findUnique.mockResolvedValue({
      apiKey: 'api-key',
      validationStatus: 'valid',
      adjustments: { contrast: true },
      validatedAt,
    });

    await expect(service.retrieve('https://demo.test')).resolves.toEqual({
      success: true,
      data: {
        apiKey: 'api-key',
        validationStatus: 'valid',
        timestamp: validatedAt.getTime(),
        adjustments: { contrast: true },
      },
    });
  });

  it('deletes sessions older than the original one-hour validity window', async () => {
    prisma.widgetSession.findUnique.mockResolvedValue({
      apiKey: 'api-key',
      validationStatus: 'valid',
      adjustments: {},
      validatedAt: new Date(Date.now() - WIDGET_CACHE_VALIDITY_MS - 1),
    });
    prisma.widgetSession.delete.mockResolvedValue({});

    await expect(service.retrieve('https://demo.test')).resolves.toEqual({
      success: false,
      message: 'Cached data expired',
    });
    expect(prisma.widgetSession.delete).toHaveBeenCalledWith({
      where: { cacheKey: 'wcag_https___demo_test' },
    });
  });

  it('preserves the original missing-session response for updates', async () => {
    prisma.widgetSession.findUnique.mockResolvedValue(null);

    await expect(
      service.updateAdjustments('https://demo.test', { zoom: 1.2 }),
    ).resolves.toEqual({
      success: false,
      message: 'No cached session found',
    });
    expect(prisma.widgetSession.update).not.toHaveBeenCalled();
  });
});
