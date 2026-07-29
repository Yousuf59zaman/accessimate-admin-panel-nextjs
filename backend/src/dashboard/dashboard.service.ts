import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async overview() {
    const activityStart = new Date();
    activityStart.setUTCHours(0, 0, 0, 0);
    activityStart.setUTCDate(activityStart.getUTCDate() - 6);

    const [
      accounts,
      activeResources,
      trashedResources,
      grouped,
      recentActivity,
      activityRows,
    ] =
      await Promise.all([
        this.prisma.account.count({ where: { isActive: true } }),
        this.prisma.resourceRecord.count({ where: { deletedAt: null } }),
        this.prisma.resourceRecord.count({ where: { deletedAt: { not: null } } }),
        this.prisma.resourceRecord.groupBy({
          by: ['resource'],
          where: { deletedAt: null },
          _count: { _all: true },
          orderBy: { _count: { resource: 'desc' } },
          take: 10,
        }),
        this.prisma.auditLog.findMany({
          orderBy: { createdAt: 'desc' },
          take: 8,
          select: {
            id: true,
            action: true,
            resource: true,
            resourceId: true,
            createdAt: true,
          },
        }),
        this.prisma.auditLog.findMany({
          where: { createdAt: { gte: activityStart } },
          select: { createdAt: true },
        }),
      ]);

    const statusGroups = await this.prisma.resourceRecord.groupBy({
      by: ['status'],
      where: { deletedAt: null },
      _count: { _all: true },
      orderBy: { status: 'asc' },
    });

    const activityCounts = new Map<string, number>();
    activityRows.forEach((item) => {
      const day = item.createdAt.toISOString().slice(0, 10);
      activityCounts.set(day, (activityCounts.get(day) ?? 0) + 1);
    });
    const activityByDay = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(activityStart);
      date.setUTCDate(activityStart.getUTCDate() + index);
      const day = date.toISOString().slice(0, 10);
      return { day, count: activityCounts.get(day) ?? 0 };
    });

    return {
      status: true,
      data: {
        totals: {
          accounts,
          active_records: activeResources,
          trashed_records: trashedResources,
          modules: grouped.length,
        },
        resources: grouped.map((item) => ({
          resource: item.resource,
          count: item._count._all,
        })),
        status_distribution: statusGroups.map((item) => ({
          status: item.status,
          count: item._count._all,
        })),
        activity_by_day: activityByDay,
        recent_activity: recentActivity.map((item) => ({
          ...item,
          created_at: item.createdAt.toISOString(),
        })),
      },
    };
  }
}
