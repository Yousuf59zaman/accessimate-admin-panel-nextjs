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
  let citizenToken = '';
  let demoCitizenToken = '';
  let createdResourceId: number | undefined;
  let createdAssetId: string | undefined;
  const loginId = `e2e-owner-${Date.now()}`;
  const email = `${loginId}@accessimate.test`;
  const password = 'E2eOwnerOnly2026!';
  const uniqueTitle = `E2E release ${Date.now()}`;
  const identityValue = uniqueTitle.toLowerCase();
  const citizenLoginId = `e2e-citizen-${Date.now()}`;
  const citizenEmail = `${citizenLoginId}@accessimate.test`;
  const citizenPassword = 'E2eCitizenOnly2026!';
  const citizenNewPassword = 'E2eCitizenUpdated2026!';
  const citizenWebsiteUrl = `https://example.com/e2e-${Date.now()}`;
  const widgetOrigin = 'https://widget-e2e.test';

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
    await prisma.account.create({
      data: {
        loginId: citizenLoginId,
        email: citizenEmail,
        passwordHash: await hash(citizenPassword, 12),
        firstName: 'Citizen',
        lastName: 'Tester',
        type: 'CITIZEN',
        roles: ['citizen'],
        permissions: ['dashboard.view'],
        apiKey: `am_${citizenLoginId}`,
        countryCode: '880',
        widgetOrigins: { create: { origin: widgetOrigin } },
      },
    });
  });

  afterAll(async () => {
    if (!prisma || !app) return;
    await prisma.auditLog.deleteMany({
      where: { account: { loginId: { in: [loginId, citizenLoginId] } } },
    });
    await prisma.resourceRecord.deleteMany({
      where: { resource: 'news', identityValue },
    });
    if (createdAssetId) {
      await prisma.asset.deleteMany({ where: { id: createdAssetId } });
    }
    await prisma.widgetSession.deleteMany({ where: { origin: widgetOrigin } });
    await prisma.account.deleteMany({
      where: { loginId: { in: [loginId, citizenLoginId] } },
    });
    await app.close();
  });

  it('reports a connected public health check', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200);
    expect(response.body.data.database).toBe('connected');
  });

  it('validates the original public widget account and origin contract', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/customer/validete')
      .send({ api_key: `am_${citizenLoginId}`, origin: `${widgetOrigin}/page` })
      .expect(201);

    expect(response.body).toMatchObject({
      status: true,
      data: { origin: widgetOrigin },
    });
  });

  it('persists, retrieves, updates, and clears the original widget cache contract', async () => {
    await request(app.getHttpServer())
      .post('/api/cache/store')
      .send({
        origin: widgetOrigin,
        apiKey: `am_${citizenLoginId}`,
        validationStatus: 'valid',
        adjustments: { lineHeight: 1.75 },
      })
      .expect(201)
      .expect(({ body }) => {
        expect(body).toMatchObject({ success: true });
      });

    await request(app.getHttpServer())
      .post('/api/cache/retrieve')
      .send({ origin: widgetOrigin })
      .expect(201)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          success: true,
          data: { adjustments: { lineHeight: 1.75 } },
        });
      });

    await request(app.getHttpServer())
      .post('/api/cache/update-adjustments')
      .send({ origin: widgetOrigin, adjustments: { contrast: true } })
      .expect(201)
      .expect(({ body }) => {
        expect(body).toMatchObject({ success: true });
      });

    await request(app.getHttpServer())
      .delete('/api/cache/clear')
      .send({ origin: widgetOrigin })
      .expect(200)
      .expect(({ body }) => {
        expect(body).toMatchObject({ success: true });
      });
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
      .send({
        title: uniqueTitle,
        slug: identityValue.replaceAll(' ', '-'),
        status: 1,
      })
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
      expect.objectContaining({
        name: expect.any(String),
        route: expect.any(String),
        child: expect.any(Array),
      }),
    );

    const dashboard = await request(app.getHttpServer())
      .get('/api/v1/admin/dashboard/overview')
      .set('authorization', `Bearer ${reviewerToken}`)
      .expect(200);
    expect(dashboard.body.data.totals.active_records).toEqual(
      expect.any(Number),
    );
    expect(dashboard.body.data.resources).toEqual(expect.any(Array));
    expect(dashboard.body.data.activity_by_day).toHaveLength(7);
  });

  it('supports a separate citizen reviewer session', async () => {
    const login = await request(app.getHttpServer())
      .post('/api/v1/customer/demo-login')
      .expect(201);
    const token = login.body.data.token as string;
    demoCitizenToken = token;

    const currentUser = await request(app.getHttpServer())
      .post('/api/v1/customer/user')
      .set('authorization', `Bearer ${token}`)
      .expect(201);
    expect(currentUser.body.data.roles).toContain('citizen');
    expect(currentUser.body.data.user_account_detail.api_key).toEqual(
      expect.any(String),
    );
  });

  it('authenticates a writable citizen without exposing the token in account data', async () => {
    const login = await request(app.getHttpServer())
      .post('/api/v1/customer/login')
      .send({ login_id: citizenLoginId, password: citizenPassword })
      .expect(201);
    citizenToken = login.body.data.token as string;
    expect(login.body.data.user.user_account_detail.api_key).toBe(
      `am_${citizenLoginId}`,
    );
    expect(login.body.data.user.token).toBeUndefined();
  });

  it('supports an owner-scoped citizen website CRUD lifecycle', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/customer/websites')
      .set('authorization', `Bearer ${citizenToken}`)
      .send({ name: 'E2E accessibility website', url: citizenWebsiteUrl })
      .expect(201);
    const websiteId = created.body.data.id as number;
    expect(created.body.data.status).toBe('trial');

    const updated = await request(app.getHttpServer())
      .put(`/api/v1/customer/websites/${websiteId}`)
      .set('authorization', `Bearer ${citizenToken}`)
      .send({ name: 'Updated E2E website', url: citizenWebsiteUrl })
      .expect(200);
    expect(updated.body.data.name).toBe('Updated E2E website');

    const websites = await request(app.getHttpServer())
      .get('/api/v1/customer/websites')
      .set('authorization', `Bearer ${citizenToken}`)
      .expect(200);
    expect(websites.body.data.data).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: websiteId })]),
    );

    await request(app.getHttpServer())
      .get(`/api/v1/customer/websites/${websiteId}`)
      .set('authorization', `Bearer ${demoCitizenToken}`)
      .expect(404);

    const foreignScan = await request(app.getHttpServer())
      .post('/api/v1/customer/scan')
      .set('authorization', `Bearer ${citizenToken}`)
      .send({
        website_id: websiteId,
        url: 'https://example.org/not-the-registered-origin',
      })
      .expect(400);
    expect(foreignScan.body.message).toContain('same origin');

    await request(app.getHttpServer())
      .delete(`/api/v1/customer/websites/${websiteId}`)
      .set('authorization', `Bearer ${citizenToken}`)
      .expect(200);
  });

  it('returns real citizen resources while keeping reviewer mutations blocked', async () => {
    const [
      overview,
      scans,
      accessibility,
      invoices,
      subscription,
      payments,
      pdfs,
      resources,
      embed,
    ] = await Promise.all([
      request(app.getHttpServer())
        .get('/api/v1/customer/portal/overview')
        .set('authorization', `Bearer ${demoCitizenToken}`),
      request(app.getHttpServer())
        .get('/api/v1/customer/scan-history')
        .set('authorization', `Bearer ${demoCitizenToken}`),
      request(app.getHttpServer())
        .get('/api/v1/customer/accessibility-overview')
        .set('authorization', `Bearer ${demoCitizenToken}`),
      request(app.getHttpServer())
        .get('/api/v1/customer/billing/invoices')
        .set('authorization', `Bearer ${demoCitizenToken}`),
      request(app.getHttpServer())
        .get('/api/v1/customer/subscriptions/my-subscriptions')
        .set('authorization', `Bearer ${demoCitizenToken}`),
      request(app.getHttpServer())
        .get('/api/v1/customer/payment-transactions/my-transactions')
        .set('authorization', `Bearer ${demoCitizenToken}`),
      request(app.getHttpServer())
        .get('/api/v1/customer/pdf-remediations')
        .set('authorization', `Bearer ${demoCitizenToken}`),
      request(app.getHttpServer())
        .get('/api/v1/customer/developer-resources')
        .set('authorization', `Bearer ${demoCitizenToken}`),
      request(app.getHttpServer())
        .get('/api/v1/customer/embed-config')
        .set('authorization', `Bearer ${demoCitizenToken}`),
    ]);
    [
      overview,
      scans,
      accessibility,
      invoices,
      subscription,
      payments,
      pdfs,
      resources,
      embed,
    ].forEach((response) => expect(response.status).toBe(200));
    expect(overview.body.data.totals.websites).toBeGreaterThanOrEqual(1);
    expect(scans.body.data.length).toBeGreaterThanOrEqual(1);
    expect(accessibility.body.data.sections.length).toBeGreaterThanOrEqual(1);
    expect(subscription.body.data.status).toBe('active');
    expect(payments.body.data.length).toBeGreaterThanOrEqual(1);
    expect(resources.body.data.endpoints.length).toBeGreaterThanOrEqual(6);
    expect(embed.body.data.embed_code).toContain('/js/main.js');
    expect(embed.body.data.preview_url).toContain('/accessibility-widget');

    const blocked = await request(app.getHttpServer())
      .post('/api/v1/customer/websites')
      .set('authorization', `Bearer ${demoCitizenToken}`)
      .send({ name: 'Blocked demo website', url: 'https://example.org/' })
      .expect(403);
    expect(blocked.body.message).toContain('read-only');
  });

  it('keeps widget validation public while rejecting an invalid key', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/customer/validete')
      .send({ api_key: 'invalid-key', origin: 'https://unknown.test' })
      .expect(201);

    expect(response.body).toEqual({
      status: false,
      message: 'Token invalid / Origin not allowed',
    });
  });

  it('validates, stores, lists, and ownership-protects citizen PDF files', async () => {
    const bytes = Buffer.from('%PDF-1.4\n% e2e protected document\n%%EOF\n');
    const uploaded = await request(app.getHttpServer())
      .post('/api/v1/customer/pdf-remediations')
      .set('authorization', `Bearer ${citizenToken}`)
      .attach('files', bytes, {
        filename: 'e2e-document.pdf',
        contentType: 'application/pdf',
      })
      .expect(201);
    const pdfId = uploaded.body.data[0].id as string;

    const download = await request(app.getHttpServer())
      .get(`/api/v1/customer/pdf-remediations/${pdfId}/download`)
      .set('authorization', `Bearer ${citizenToken}`)
      .expect(200);
    expect(download.headers['content-type']).toContain('application/pdf');
    expect(Buffer.from(download.body).subarray(0, 4).toString('ascii')).toBe(
      '%PDF',
    );

    await request(app.getHttpServer())
      .get(`/api/v1/customer/pdf-remediations/${pdfId}/download`)
      .set('authorization', `Bearer ${demoCitizenToken}`)
      .expect(404);
  });

  it('updates citizen profile and password through validated owner-only workflows', async () => {
    const account = await prisma.account.findUniqueOrThrow({
      where: { loginId: citizenLoginId },
    });
    const profile = await request(app.getHttpServer())
      .post(`/api/v1/customer/account-information/${account.id}`)
      .set('authorization', `Bearer ${citizenToken}`)
      .send({
        first_name: 'Citizen',
        middle_name: 'API',
        last_name: 'Tester',
        email: citizenEmail,
        ccode: '880',
        mobile: '1700000000',
      })
      .expect(201);
    expect(profile.body.data.user_info.middle_name).toBe('API');

    await request(app.getHttpServer())
      .post('/api/v1/customer/update-password')
      .set('authorization', `Bearer ${citizenToken}`)
      .send({
        old_password: citizenPassword,
        password: citizenNewPassword,
        password_confirmation: citizenNewPassword,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/v1/customer/login')
      .send({ login_id: citizenLoginId, password: citizenNewPassword })
      .expect(201);
  });

  it('rejects invalid bearer tokens', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/admin/dashboard/overview')
      .set('authorization', 'Bearer invalid-token')
      .expect(401);
  });
});
