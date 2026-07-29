import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ResourceRecord } from '@prisma/client';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-request';
import { PrismaService } from '../prisma/prisma.service';
import { AssetsService } from '../assets/assets.service';
import { ListResourcesDto } from './dto/list-resources.dto';
import {
  isResourceName,
  RESOURCE_DEFINITIONS,
  ResourceName,
} from './resource-registry';

const FORBIDDEN_KEYS = new Set([
  '__proto__',
  'constructor',
  'prototype',
  'id',
  'created_at',
  'updated_at',
  'deleted_at',
]);

const MAX_TEXT_LENGTH = 100_000;
const MAX_DATA_URL_LENGTH = 1_500_000;

const primitiveText = (value: unknown): string | undefined => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') {
    return `${value}`;
  }
  return undefined;
};

@Injectable()
export class ResourcesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly assets: AssetsService,
  ) {}

  async list(
    rawResource: string,
    query: ListResourcesDto,
    user: AuthenticatedUser,
  ) {
    const resource = this.resource(rawResource);
    const requestedPage = Math.max(query.page ?? 1, 1);
    const shouldPaginate = query.paginate === true;
    const perPage = shouldPaginate ? Math.min(query.length ?? 10, 100) : 200;
    const status = this.optionalStatus(query.status);
    const where: Prisma.ResourceRecordWhereInput = {
      resource,
      deletedAt: query.trashed === 'only' ? { not: null } : null,
      ...(status === undefined ? {} : { status }),
      ...(query.search?.trim()
        ? { searchText: { contains: query.search.trim(), mode: 'insensitive' } }
        : {}),
    };
    const total = await this.prisma.resourceRecord.count({ where });
    const lastPage = Math.max(Math.ceil(total / perPage), 1);
    const page = Math.min(requestedPage, lastPage);
    const rows = await this.prisma.resourceRecord.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip: shouldPaginate ? (page - 1) * perPage : 0,
      take: perPage,
    });
    const from = total === 0 ? 0 : (page - 1) * perPage + 1;
    const to = total === 0 ? 0 : Math.min(from + rows.length - 1, total);

    return {
      status: true,
      data: {
        data: rows.map((row) => this.recordDto(row)),
        permissions: this.permissions(user),
        meta: {
          current_page: page,
          last_page: lastPage,
          per_page: perPage,
          from,
          to,
          total,
        },
      },
    };
  }

  async create(
    rawResource: string,
    rawBody: Record<string, unknown>,
    files: Express.Multer.File[],
    user: AuthenticatedUser,
    requestId?: string,
  ) {
    this.assertOwner(user);
    const resource = this.resource(rawResource);
    const initialBody = this.sanitize(rawBody);
    const status = this.status(initialBody.status);
    delete initialBody.status;
    this.assertData(resource, initialBody);
    const identityValue = this.identity(resource, initialBody);
    await this.assertUnique(resource, identityValue);
    const encodedAssets = await this.assets.storeDataUrls(initialBody);
    const uploadedAssets = await this.assets.store(files);
    const body = this.sanitize({
      ...initialBody,
      ...encodedAssets,
      ...uploadedAssets,
    });

    const record = await this.prisma.resourceRecord.create({
      data: {
        resource,
        status,
        data: body as Prisma.InputJsonValue,
        searchText: this.searchText(body),
        identityValue,
      },
    });
    await this.audit(user, 'create', resource, record.id, requestId);
    return {
      status: true,
      message: `${RESOURCE_DEFINITIONS[resource].label} created successfully.`,
      data: this.recordDto(record),
    };
  }

  async update(
    rawResource: string,
    id: number,
    rawBody: Record<string, unknown>,
    files: Express.Multer.File[],
    user: AuthenticatedUser,
    requestId?: string,
  ) {
    this.assertOwner(user);
    const resource = this.resource(rawResource);
    const existing = await this.findRecord(resource, id);
    const incoming = this.sanitize(rawBody);
    const currentData = existing.data as Prisma.JsonObject;
    const initialBody = { ...currentData, ...incoming } as Record<string, unknown>;
    const status = this.status(initialBody.status ?? existing.status);
    delete initialBody.status;
    this.assertData(resource, initialBody);
    const identityValue = this.identity(resource, initialBody);
    await this.assertUnique(resource, identityValue, id);
    const encodedAssets = await this.assets.storeDataUrls(incoming);
    const uploadedAssets = await this.assets.store(files);
    const body = this.sanitize({
      ...initialBody,
      ...encodedAssets,
      ...uploadedAssets,
    });

    const record = await this.prisma.resourceRecord.update({
      where: { id },
      data: {
        status,
        data: body as Prisma.InputJsonValue,
        searchText: this.searchText(body),
        identityValue,
      },
    });
    await this.audit(user, 'update', resource, record.id, requestId);
    return {
      status: true,
      message: `${RESOURCE_DEFINITIONS[resource].label} updated successfully.`,
      data: this.recordDto(record),
    };
  }

  async remove(
    rawResource: string,
    id: number,
    user: AuthenticatedUser,
    requestId?: string,
  ) {
    this.assertOwner(user);
    const resource = this.resource(rawResource);
    await this.findRecord(resource, id);
    await this.prisma.resourceRecord.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    await this.audit(user, 'delete', resource, id, requestId);
    return { status: true, message: 'Record moved to trash.' };
  }

  async restore(
    rawResource: string,
    id: number,
    user: AuthenticatedUser,
    requestId?: string,
  ) {
    this.assertOwner(user);
    const resource = this.resource(rawResource);
    const existing = await this.prisma.resourceRecord.findFirst({
      where: { id, resource, deletedAt: { not: null } },
    });
    if (!existing) throw new NotFoundException('Trashed record not found.');
    await this.assertUnique(resource, existing.identityValue, id);
    await this.prisma.resourceRecord.update({
      where: { id },
      data: { deletedAt: null },
    });
    await this.audit(user, 'restore', resource, id, requestId);
    return { status: true, message: 'Record restored successfully.' };
  }

  private resource(value: string): ResourceName {
    if (!isResourceName(value)) throw new NotFoundException('Resource not found.');
    return value;
  }

  private sanitize(input: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
      if (FORBIDDEN_KEYS.has(key)) continue;
      if (typeof value === 'string') {
        const maxLength = value.startsWith('data:')
          ? MAX_DATA_URL_LENGTH
          : MAX_TEXT_LENGTH;
        if (value.length > maxLength) {
          throw new BadRequestException(`${key} is too large.`);
        }
      }
      if (key.toLowerCase().includes('password')) continue;
      result[key] = typeof value === 'string' ? value.trim() : value;
    }
    return result;
  }

  private assertData(resource: ResourceName, data: Record<string, unknown>) {
    const hasValue = Object.values(data).some(
      (value) => value !== '' && value !== null && value !== undefined,
    );
    if (!hasValue) throw new BadRequestException('At least one field is required.');
    if (resource === 'users' && data.email) {
      const email = primitiveText(data.email);
      if (!email) {
        throw new BadRequestException('email must be a string.');
      }
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        throw new BadRequestException('email must be a valid email address.');
      }
    }
  }

  private identity(resource: ResourceName, data: Record<string, unknown>) {
    const definition = RESOURCE_DEFINITIONS[resource];
    for (const field of definition.identityFields) {
      const value = primitiveText(data[field])?.trim();
      if (value) {
        return value.toLocaleLowerCase();
      }
    }
    return null;
  }

  private async assertUnique(
    resource: ResourceName,
    identityValue: string | null,
    excludeId?: number,
  ) {
    if (!identityValue) return;
    const duplicate = await this.prisma.resourceRecord.findFirst({
      where: {
        resource,
        identityValue,
        deletedAt: null,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });
    if (duplicate) {
      throw new ConflictException(
        `A ${RESOURCE_DEFINITIONS[resource].label} with the same primary value already exists.`,
      );
    }
  }

  private async findRecord(resource: ResourceName, id: number) {
    const record = await this.prisma.resourceRecord.findFirst({
      where: { id, resource, deletedAt: null },
    });
    if (!record) throw new NotFoundException('Record not found.');
    return record;
  }

  private status(value: unknown) {
    const parsed = Number(value ?? 1);
    return Number.isFinite(parsed) ? Math.trunc(parsed) : 1;
  }

  private optionalStatus(value: unknown): number | undefined {
    if (value === '' || value === undefined || value === null) return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.trunc(parsed) : undefined;
  }

  private searchText(data: Record<string, unknown>) {
    const values: string[] = [];
    const visit = (value: unknown) => {
      if (value === null || value === undefined) return;
      const text = primitiveText(value);
      if (text !== undefined) {
        values.push(text);
        return;
      }
      if (Array.isArray(value)) value.forEach(visit);
      else if (typeof value === 'object') Object.values(value).forEach(visit);
    };
    visit(data);
    return values.join(' ').slice(0, 50_000);
  }

  private recordDto(record: ResourceRecord) {
    return {
      id: record.id,
      ...(record.data as Prisma.JsonObject),
      status: record.status,
      created_at: record.createdAt.toISOString(),
      updated_at: record.updatedAt.toISOString(),
      deleted_at: record.deletedAt?.toISOString() ?? null,
    };
  }

  private permissions(user: AuthenticatedUser) {
    const canMutate = user.type === 'ADMIN' && !user.isDemo;
    return {
      view: true,
      add: canMutate,
      edit: canMutate,
      delete: canMutate,
      restore: canMutate,
      export: true,
    };
  }

  private assertOwner(user: AuthenticatedUser) {
    if (user.type !== 'ADMIN' || user.isDemo) {
      throw new ForbiddenException('This account cannot modify admin data.');
    }
  }

  private async audit(
    user: AuthenticatedUser,
    action: string,
    resource: string,
    resourceId: number,
    requestId?: string,
  ) {
    await this.prisma.auditLog.create({
      data: {
        accountId: user.id,
        action,
        resource,
        resourceId: resourceId.toString(),
        requestId,
      },
    });
  }
}
