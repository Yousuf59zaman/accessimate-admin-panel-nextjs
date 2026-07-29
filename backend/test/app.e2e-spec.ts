import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { hash } from 'bcryptjs';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApplication } from '../src/configure-app';
import { PrismaService } from '../src/prisma/prisma.service';
import { RESOURCE_DEFINITIONS } from '../src/resources/resource-registry';

describe('Accessimate API (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let reviewerToken = '';
  let ownerToken = '';
  let createdResourceId: number | undefined;
  let createdAssetId: string | undefined;
  const loginId = `e2e-owner-${Date.now()}`;
  const email = `${loginId}@accessimate.test`;
  const password = 'E2eOwnerOnly2026!';
  const uniqueTitle = `E2E release ${Date.now()}`;
  const identityValue = uniqueTitle.toLowerCase();

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>();
    configureApplication(app, { enableSwagger: false });
    await app.init();
    prisma = app.get(PrismaService);
    await prisma.account.create({
      data: {
        loginId,
        email,
        passwordHash: await hash(password, 12),
        firstName: 'E2E',
        lastName: 'Owner',
        type: 'ADMIN',
        roles: ['super-admin'],
        permissions: [
          'dashboard.view',
          'resources.view',
          'resources.create',
          'resources.update',
          'resources.delete',
          'resources.restore',
        ],
      },
    });
  });

  afterAll(async () => {
    await prisma.auditLog.deleteMany({ where: { account: { loginId } } });
    await prisma.resourceRecord.deleteMany({
      where: { resource: 'news', identityValue },
    });
    if (createdAssetId) {
      await prisma.asset.deleteMany({ where: { id: createdAssetId } });
    }
    await prisma.account.deleteMany({ where: { loginId } });
    await app.close();
  });

  it('reports a connected public health check', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200);
    expect(response.body.data.database).toBe('connected');
  });

  it('creates and verifies a read-only reviewer session', async () => {
    const login = await request(app.getHttpServer())
      .post('/api/v1/admin/demo-login')
      .expect(201);
    reviewerToken = login.body.data.token as string;
    expect(reviewerToken).toEqual(expect.any(String));

    const currentUser = await request(app.getHttpServer())
      .post('/api/v1/admin/user')
      .set('authorization', `Bearer ${reviewerToken}`)
      .expect(201);
    expect(currentUser.body.data.is_demo).toBe(true);
  });

  it('returns real paginated data and read-only permissions to reviewers', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/admin/news/all')
      .set('authorization', `Bearer ${reviewerToken}`)
      .send({ paginate: true, page: 1, length: 10, search: 'reviewer' })
      .expect(201);
    expect(response.body.data.meta).toEqual(
      expect.objectContaining({ current_page: 1, per_page: 10 }),
    );
    expect(response.body.data.permissions).toEqual(
      expect.objectContaining({ add: false, edit: false, delete: false }),
    );
  });

  it('serves every frontend CMS resource through the independent API', async () => {
    const resources = Object.keys(RESOURCE_DEFINITIONS);
    const responses = await Promise.all(
      resources.map((resource) =>
        request(app.getHttpServer())
          .post(`/api/v1/admin/${resource}/all`)
          .set('authorization', `Bearer ${reviewerToken}`)
          .send({ paginate: true, page: 1, length: 1 }),
      ),
    );

    expect(responses).toHaveLength(34);
    responses.forEach((response) => {
      expect(response.status).toBe(201);
      expect(response.body.data.data).toEqual(expect.any(Array));
      expect(response.body.data.meta).toEqual(
        expect.objectContaining({ current_page: 1, per_page: 1 }),
      );
      expect(response.body.data.permissions.add).toBe(false);
    });
  });

  it('blocks reviewer writes at the HTTP boundary', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/admin/news')
      .set('authorization', `Bearer ${reviewerToken}`)
      .send({ title: 'Blocked reviewer mutation' })
      .expect(403);
    expect(response.body.message).toContain('read-only');
  });

  it('validates login payloads and rejects unknown fields', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/admin/login')
      .send({ login_id: loginId, password, unexpected: true })
      .expect(400);
    expect(response.body.status).toBe(false);
    expect(response.body.data.unexpected).toEqual(expect.any(Array));
  });

  it('supports an authenticated owner CRUD lifecycle with soft delete and restore', async () => {
    const login = await request(app.getHttpServer())
      .post('/api/v1/admin/login')
      .send({ login_id: loginId, password })
      .expect(201);
    ownerToken = login.body.data.token as string;

    const created = await request(app.getHttpServer())
      .post('/api/v1/admin/news')
      .set('authorization', `Bearer ${ownerToken}`)
      .send({ title: uniqueTitle, slug: identityValue.replaceAll(' ', '-'), status: 1 })
      .expect(201);
    createdResourceId = created.body.data.id as number;
    expect(created.body.data.title).toBe(uniqueTitle);

    const updated = await request(app.getHttpServer())
      .put(`/api/v1/admin/news/${createdResourceId}`)
      .set('authorization', `Bearer ${ownerToken}`)
      .send({ description: 'Verified through the real PostgreSQL API.' })
      .expect(200);
    expect(updated.body.data.description).toContain('PostgreSQL');

    await request(app.getHttpServer())
      .delete(`/api/v1/admin/news/${createdResourceId}`)
      .set('authorization', `Bearer ${ownerToken}`)
      .expect(200);

    const trash = await request(app.getHttpServer())
      .post('/api/v1/admin/news/all')
      .set('authorization', `Bearer ${ownerToken}`)
      .send({ paginate: true, search: uniqueTitle, trashed: 'only' })
      .expect(201);
    expect(trash.body.data.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: createdResourceId }),
      ]),
    );

    await request(app.getHttpServer())
      .post(`/api/v1/admin/news/restore/${createdResourceId}`)
      .set('authorization', `Bearer ${ownerToken}`)
      .expect(201);
  });

  it('accepts legacy Base64 image forms larger than the default JSON limit', async () => {
    const onePixelPng = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
      'base64',
    );
    const compatiblePng = Buffer.concat([onePixelPng, Buffer.alloc(120_000)]);
    const photo = `data:image/png;base64,${compatiblePng.toString('base64')}`;

    const updated = await request(app.getHttpServer())
      .put(`/api/v1/admin/news/${createdResourceId}`)
      .set('authorization', `Bearer ${ownerToken}`)
      .send({ photo })
      .expect(200);

    expect(updated.body.data.photo).toMatch(/\/api\/v1\/assets\//);
    createdAssetId = (updated.body.data.photo as string).split('/').at(-1);
    expect(createdAssetId).toEqual(expect.any(String));

    const asset = await request(app.getHttpServer())
      .get(`/api/v1/assets/${createdAssetId}`)
      .expect(200);
    expect(asset.headers['content-type']).toContain('image/png');
    expect(asset.body.length).toBe(compatiblePng.length);
  });

  it('returns consumer-specific menu and analytics DTOs', async () => {
    const menu = await request(app.getHttpServer())
      .post('/api/v1/admin/tree-entity/main-menu')
      .set('authorization', `Bearer ${reviewerToken}`)
      .expect(201);
    expect(menu.body.data[0]).toEqual(
      expect.objectContaining({ name: expect.any(String), route: expect.any(String), child: expect.any(Array) }),
    );

    const dashboard = await request(app.getHttpServer())
      .get('/api/v1/admin/dashboard/overview')
      .set('authorization', `Bearer ${reviewerToken}`)
      .expect(200);
    expect(dashboard.body.data.totals.active_records).toEqual(expect.any(Number));
    expect(dashboard.body.data.resources).toEqual(expect.any(Array));
    expect(dashboard.body.data.activity_by_day).toHaveLength(7);
  });

  it('supports a separate citizen reviewer session', async () => {
    const login = await request(app.getHttpServer())
      .post('/api/v1/customer/demo-login')
      .expect(201);
    const token = login.body.data.token as string;

    const currentUser = await request(app.getHttpServer())
      .post('/api/v1/customer/user')
      .set('authorization', `Bearer ${token}`)
      .expect(201);
    expect(currentUser.body.data.roles).toContain('citizen');
  });

  it('rejects invalid bearer tokens', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/admin/dashboard/overview')
      .set('authorization', 'Bearer invalid-token')
      .expect(401);
  });
});
