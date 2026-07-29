import { ForbiddenException } from '@nestjs/common';
import type { ResourceRecord } from '@prisma/client';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-request';
import type { PrismaService } from '../prisma/prisma.service';
import type { AssetsService } from '../assets/assets.service';
import { ResourcesService } from './resources.service';

const owner: AuthenticatedUser = {
  id: 'owner-1',
  loginId: 'owner',
  type: 'ADMIN',
  isDemo: false,
  roles: ['super-admin'],
  permissions: ['resources.create'],
};

const reviewer: AuthenticatedUser = {
  ...owner,
  id: 'reviewer-1',
  loginId: 'reviewer',
  isDemo: true,
  roles: ['reviewer'],
  permissions: ['resources.view'],
};

const now = new Date('2026-07-30T00:00:00.000Z');
const record: ResourceRecord = {
  id: 7,
  resource: 'news',
  status: 1,
  data: { title: 'Inclusive release', slug: 'inclusive-release' },
  searchText: 'Inclusive release inclusive-release',
  identityValue: 'inclusive release',
  deletedAt: null,
  createdAt: now,
  updatedAt: now,
};

describe('ResourcesService', () => {
  const prisma = {
    resourceRecord: {
      count: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    auditLog: { create: jest.fn() },
  };
  const assets = { store: jest.fn(), storeDataUrls: jest.fn() };
  const service = new ResourcesService(
    prisma as unknown as PrismaService,
    assets as unknown as AssetsService,
  );

  beforeEach(() => {
    jest.resetAllMocks();
    prisma.resourceRecord.count.mockResolvedValue(1);
    prisma.resourceRecord.findMany.mockResolvedValue([record]);
    prisma.resourceRecord.findFirst.mockResolvedValue(null);
    prisma.resourceRecord.create.mockResolvedValue(record);
    prisma.auditLog.create.mockResolvedValue({});
    assets.store.mockResolvedValue({});
    assets.storeDataUrls.mockResolvedValue({});
  });

  it('keeps pagination, search, filtering, and permissions backend-owned', async () => {
    const response = await service.list(
      'news',
      { paginate: true, page: 2, length: 10, search: 'release', status: 1 },
      reviewer,
    );

    expect(prisma.resourceRecord.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 10 }),
    );
    expect(response.data.meta).toEqual({
      current_page: 1,
      last_page: 1,
      per_page: 10,
      from: 1,
      to: 1,
      total: 1,
    });
    expect(response.data.permissions).toEqual(
      expect.objectContaining({ add: false, edit: false, delete: false }),
    );
  });

  it('blocks read-only reviewer writes at the service boundary', async () => {
    await expect(
      service.create('news', { title: 'Blocked' }, [], reviewer),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.resourceRecord.create).not.toHaveBeenCalled();
  });

  it('sanitizes protected keys and writes auditable owner changes', async () => {
    const response = await service.create(
      'news',
      {
        title: '  Inclusive release  ',
        slug: 'inclusive-release',
        password: 'must-not-persist',
        id: 999,
        status: 1,
      },
      [],
      owner,
      'request-1',
    );

    expect(prisma.resourceRecord.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        resource: 'news',
        status: 1,
        identityValue: 'inclusive release',
        data: {
          title: 'Inclusive release',
          slug: 'inclusive-release',
        },
      }),
    });
    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        accountId: owner.id,
        action: 'create',
        resource: 'news',
        requestId: 'request-1',
      }),
    });
    expect(response.status).toBe(true);
  });
});
