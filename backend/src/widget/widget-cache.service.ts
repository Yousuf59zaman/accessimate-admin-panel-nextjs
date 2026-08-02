import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export const WIDGET_CACHE_VALIDITY_MS = 60 * 60 * 1000;

@Injectable()
export class WidgetCacheService {
  constructor(private readonly prisma: PrismaService) {}

  static createCacheKey(origin: string) {
    return `wcag_${origin.replace(/[^a-zA-Z0-9]/g, '_')}`;
  }

  async store(
    origin: string,
    apiKey: string,
    validationStatus = 'valid',
    adjustments: Record<string, unknown> = {},
  ) {
    const cacheKey = WidgetCacheService.createCacheKey(origin);
    const account = await this.prisma.account.findUnique({
      where: { apiKey },
      select: { id: true },
    });
    const validatedAt = new Date();

    await this.prisma.widgetSession.upsert({
      where: { cacheKey },
      create: {
        cacheKey,
        origin,
        apiKey,
        validationStatus,
        adjustments: adjustments as Prisma.InputJsonValue,
        validatedAt,
        accountId: account?.id,
      },
      update: {
        origin,
        apiKey,
        validationStatus,
        adjustments: adjustments as Prisma.InputJsonValue,
        validatedAt,
        accountId: account?.id ?? null,
      },
    });

    return {
      success: true,
      message: 'Data stored successfully',
      cacheKey,
    };
  }

  async retrieve(origin: string) {
    const cacheKey = WidgetCacheService.createCacheKey(origin);
    const cachedData = await this.prisma.widgetSession.findUnique({
      where: { cacheKey },
    });

    if (!cachedData) {
      return { success: false, message: 'No cached data found' };
    }

    if (Date.now() - cachedData.validatedAt.getTime() >= WIDGET_CACHE_VALIDITY_MS) {
      await this.prisma.widgetSession.delete({ where: { cacheKey } });
      return { success: false, message: 'Cached data expired' };
    }

    return {
      success: true,
      data: {
        apiKey: cachedData.apiKey,
        validationStatus: cachedData.validationStatus,
        timestamp: cachedData.validatedAt.getTime(),
        adjustments: cachedData.adjustments,
      },
    };
  }

  async updateAdjustments(
    origin: string,
    adjustments: Record<string, unknown> = {},
  ) {
    const cacheKey = WidgetCacheService.createCacheKey(origin);
    const existing = await this.prisma.widgetSession.findUnique({
      where: { cacheKey },
      select: { id: true },
    });

    if (!existing) {
      return { success: false, message: 'No cached session found' };
    }

    await this.prisma.widgetSession.update({
      where: { cacheKey },
      data: { adjustments: adjustments as Prisma.InputJsonValue },
    });

    return {
      success: true,
      message: 'Adjustments updated successfully',
    };
  }

  async clear(origin: string) {
    const cacheKey = WidgetCacheService.createCacheKey(origin);
    await this.prisma.widgetSession.deleteMany({ where: { cacheKey } });
    return { success: true, message: 'Cache cleared successfully' };
  }
}
