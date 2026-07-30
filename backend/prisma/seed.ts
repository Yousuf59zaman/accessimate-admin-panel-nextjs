import {
  AccountType,
  InvoiceStatus,
  PaymentStatus,
  PdfRemediationStatus,
  Prisma,
  PrismaClient,
  ScanType,
  SubscriptionStatus,
  SubscriptionType,
  WebsiteStatus,
} from '@prisma/client';
import { hash } from 'bcryptjs';
import { randomUUID } from 'node:crypto';

const prisma = new PrismaClient();

const primitiveText = (value: unknown): string | undefined => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') {
    return `${value}`;
  }
  return undefined;
};

const scalarText = (value: unknown): string[] => {
  if (value === null || value === undefined) return [];
  const text = primitiveText(value);
  if (text !== undefined) return [text];
  if (Array.isArray(value)) return value.flatMap(scalarText);
  if (typeof value === 'object')
    return Object.values(value).flatMap(scalarText);
  return [];
};

const accounts = async () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const ownerLoginId =
    process.env.OWNER_ADMIN_LOGIN_ID ?? (isProduction ? undefined : 'owner');
  const ownerEmail =
    process.env.OWNER_ADMIN_EMAIL ??
    (isProduction ? undefined : 'owner@accessimate.demo');
  const ownerPasswordValue =
    process.env.OWNER_ADMIN_PASSWORD ??
    (isProduction ? undefined : 'LocalOwnerOnly2026!');

  if (!ownerLoginId || !ownerEmail || !ownerPasswordValue) {
    throw new Error(
      'OWNER_ADMIN_LOGIN_ID, OWNER_ADMIN_EMAIL, and OWNER_ADMIN_PASSWORD are required when seeding production.',
    );
  }

  const ownerPassword = await hash(ownerPasswordValue, 12);
  const reviewerPassword = await hash(randomUUID(), 12);
  const citizenPassword = await hash(randomUUID(), 12);
  const adminPermissions = [
    'dashboard.view',
    'resources.view',
    'resources.create',
    'resources.update',
    'resources.delete',
    'resources.restore',
    'resources.export',
    'menus.manage',
  ];

  await prisma.account.upsert({
    where: { loginId: ownerLoginId },
    update: {
      email: ownerEmail,
      passwordHash: ownerPassword,
      isActive: true,
    },
    create: {
      loginId: ownerLoginId,
      email: ownerEmail,
      passwordHash: ownerPassword,
      firstName: 'Yousuf',
      lastName: 'Zaman',
      type: AccountType.ADMIN,
      isDemo: false,
      roles: ['super-admin'],
      permissions: adminPermissions,
      profile: { title: 'Platform Owner' },
    },
  });

  await prisma.account.upsert({
    where: { loginId: 'reviewer' },
    update: {},
    create: {
      loginId: 'reviewer',
      email: 'reviewer@accessimate.demo',
      passwordHash: reviewerPassword,
      firstName: 'Portfolio',
      lastName: 'Reviewer',
      type: AccountType.ADMIN,
      isDemo: true,
      roles: ['reviewer'],
      permissions: ['dashboard.view', 'resources.view', 'resources.export'],
      profile: { title: 'Read-only reviewer' },
    },
  });

  await prisma.account.upsert({
    where: { loginId: 'citizen-reviewer' },
    update: {
      apiKey: 'am_demo_reviewer_2026',
      mobile: '1700000000',
      countryCode: '880',
      profile: { title: 'Citizen reviewer', middleName: '' },
    },
    create: {
      loginId: 'citizen-reviewer',
      email: 'citizen@accessimate.demo',
      passwordHash: citizenPassword,
      firstName: 'Demo',
      lastName: 'Citizen',
      type: AccountType.CITIZEN,
      isDemo: true,
      roles: ['citizen'],
      permissions: ['dashboard.view'],
      profile: { title: 'Citizen reviewer', middleName: '' },
      mobile: '1700000000',
      countryCode: '880',
      apiKey: 'am_demo_reviewer_2026',
    },
  });
};

const citizenPortal = async () => {
  const citizen = await prisma.account.findUniqueOrThrow({
    where: { loginId: 'citizen-reviewer' },
  });
  const website = await prisma.citizenWebsite.upsert({
    where: {
      accountId_url: {
        accountId: citizen.id,
        url: 'https://www.w3.org/WAI/demos/bad/',
      },
    },
    update: {
      name: 'WAI Before Demo',
      status: WebsiteStatus.PAID,
      planName: 'Professional',
      trialEndsAt: null,
    },
    create: {
      accountId: citizen.id,
      name: 'WAI Before Demo',
      url: 'https://www.w3.org/WAI/demos/bad/',
      status: WebsiteStatus.PAID,
      planName: 'Professional',
    },
  });

  const existingScan = await prisma.accessibilityScan.findFirst({
    where: { accountId: citizen.id, websiteId: website.id },
  });
  if (!existingScan) {
    const results = {
      perceivable: {
        title: 'Perceivable content',
        wcag: '1.1.1, 1.3.1',
        level: 'A',
        issues: [
          {
            type: 'error',
            message: 'Three images are missing alternative text.',
            recommendation:
              'Add concise alt text that communicates each image purpose.',
            element: '<img src="/wai-site-logo.png">',
            page_url: website.url,
          },
        ],
      },
      operable: {
        title: 'Operable interface',
        wcag: '2.1.1, 2.4.1, 2.4.4',
        level: 'A',
        issues: [
          {
            type: 'warning',
            message: 'The page does not expose a skip-to-content link.',
            recommendation:
              'Add a keyboard-visible skip link before primary navigation.',
            page_url: website.url,
          },
        ],
      },
      understandable: {
        title: 'Understandable content',
        wcag: '3.1.1, 3.3.2',
        level: 'A',
        issues: [
          {
            type: 'notice',
            message: 'Review form instructions for plain-language guidance.',
            recommendation:
              'Keep labels and error recovery instructions concise.',
            page_url: website.url,
          },
        ],
      },
      robust: {
        title: 'Robust markup',
        wcag: '4.1.2',
        level: 'A',
        issues: [],
      },
    };
    await prisma.accessibilityScan.create({
      data: {
        accountId: citizen.id,
        websiteId: website.id,
        scanType: ScanType.SITE,
        scannedUrl: website.url,
        verdict: 'attention required',
        wcagVersion: '2.2',
        complianceLevel: 'AA',
        issues: {
          results,
          page_results: {
            [website.url]: {
              results,
              summary: { errors: 1, warnings: 1, notices: 1, total: 3 },
              status_code: 200,
            },
          },
        },
        issueCategories: {
          perceivable: 1,
          operable: 1,
          understandable: 1,
          robust: 0,
        },
        issuesFound: 3,
        errorsCount: 1,
        warningsCount: 1,
        noticesCount: 1,
        pagesScanned: 1,
        pagesWithIssues: 1,
        scanDurationMs: 842,
      },
    });
  }

  let subscription = await prisma.citizenSubscription.findFirst({
    where: { accountId: citizen.id, planSlug: 'professional' },
  });
  const startedAt = new Date(Date.now() - 14 * 86_400_000);
  const nextBillingAt = new Date(Date.now() + 16 * 86_400_000);
  if (!subscription) {
    subscription = await prisma.citizenSubscription.create({
      data: {
        accountId: citizen.id,
        planName: 'Professional',
        planDescription:
          'Accessibility monitoring, PDF reviews, and developer tools.',
        planSlug: 'professional',
        amount: new Prisma.Decimal(49),
        currency: 'USD',
        type: SubscriptionType.MONTHLY,
        status: SubscriptionStatus.ACTIVE,
        startDate: startedAt,
        nextBillingDate: nextBillingAt,
        autoRenew: true,
      },
    });
  }

  const existingInvoice = await prisma.citizenInvoice.findFirst({
    where: { accountId: citizen.id, subscriptionId: subscription.id },
  });
  if (!existingInvoice) {
    await prisma.citizenInvoice.create({
      data: {
        accountId: citizen.id,
        subscriptionId: subscription.id,
        billAmount: new Prisma.Decimal(49),
        currency: 'USD',
        billDate: startedAt,
        paymentDueDate: new Date(startedAt.getTime() + 7 * 86_400_000),
        status: InvoiceStatus.PAID,
      },
    });
  }
  await prisma.citizenPaymentTransaction.upsert({
    where: { externalId: 'demo_pi_accessimate_professional' },
    update: { subscriptionId: subscription.id, accountId: citizen.id },
    create: {
      accountId: citizen.id,
      subscriptionId: subscription.id,
      externalId: 'demo_pi_accessimate_professional',
      gateway: 'Stripe test environment',
      planName: 'Professional',
      amount: new Prisma.Decimal(49),
      currency: 'USD',
      status: PaymentStatus.COMPLETED,
      metadata: {
        receipt: 'Demo payment record',
        card_brand: 'Visa',
        card_last4: '4242',
      },
    },
  });

  const pdfBytes = Buffer.from(
    '%PDF-1.4\n% Accessimate reviewer sample\n%%EOF\n',
  );
  const existingPdf = await prisma.pdfRemediation.findFirst({
    where: {
      accountId: citizen.id,
      originalName: 'accessibility-statement.pdf',
    },
  });
  if (!existingPdf) {
    await prisma.pdfRemediation.create({
      data: {
        accountId: citizen.id,
        originalName: 'accessibility-statement.pdf',
        mimeType: 'application/pdf',
        size: pdfBytes.length,
        bytes: pdfBytes,
        status: PdfRemediationStatus.ACCESSIBLE,
        issueCount: 0,
      },
    });
  }
};

const resourceSeeds: Record<string, Record<string, unknown>[]> = {
  'auth-client': [
    { name: 'Portfolio CMS Client', email: 'cms@accessimate.demo', status: 1 },
  ],
  compliances: [
    {
      title: 'WCAG 2.2 AA Readiness',
      slug: 'wcag-aa',
      description: 'Accessibility compliance review workflow',
      status: 1,
    },
  ],
  countries: [
    {
      en_short_name: 'Bangladesh',
      nationality: 'Bangladeshi',
      num_code: '050',
      alpha_2_code: 'BD',
      alpha_3_code: 'BGD',
      status: 1,
    },
  ],
  currencies: [{ name: 'US Dollar', code: 'USD', exchange_rate: 1, status: 1 }],
  'customer-reviews': [
    {
      name: 'Amina Rahman',
      review: 'Clear workflows and accessible navigation.',
      rating: 5,
      plan: { name: 'Professional' },
      status: 1,
    },
  ],
  'email-templates': [
    {
      name: 'Welcome email',
      slug: 'welcome-email',
      subject: 'Welcome to Accessimate',
      status: 1,
    },
  ],
  'event-categories': [
    {
      title: 'Accessibility Workshops',
      slug: 'accessibility-workshops',
      status: 1,
    },
  ],
  events: [
    {
      title: 'Inclusive Design Review',
      slug: 'inclusive-design-review',
      event_date: '2026-08-15',
      status: 1,
    },
  ],
  'faq-categories': [
    { title: 'Getting Started', slug: 'getting-started', status: 1 },
  ],
  faqs: [
    {
      question: 'How does reviewer mode work?',
      title: 'Reviewer mode',
      answer:
        'Reviewer mode provides safe read-only access to the live dashboard.',
      status: 1,
    },
  ],
  features: [
    {
      name: 'Accessibility audit',
      icon: 'fa-solid fa-universal-access',
      color: '#025ADB',
      status: 1,
    },
  ],
  'footer-group-types': [{ name: 'Company', slug: 'company', status: 1 }],
  footers: [
    {
      title: 'Privacy Policy',
      name: 'Privacy Policy',
      link: '/privacy-policy',
      link_type: 1,
      group_type_id: 1,
      status: 1,
    },
  ],
  genders: [{ gender_name: 'Prefer not to say', status: 1 }],
  languages: [{ language_name: 'English', code: 'en', status: 1 }],
  metas: [
    {
      title: 'Accessimate Admin Panel',
      description: 'Independent multi-panel SaaS portfolio',
      slug: 'home',
      robots: 'index,follow',
      status: 1,
    },
  ],
  news: [
    {
      title: 'Reviewer Dashboard Launched',
      slug: 'reviewer-dashboard-launched',
      category: { title: 'Product' },
      status: 1,
    },
  ],
  'news-categories': [{ title: 'Product', slug: 'product', status: 1 }],
  partners: [
    {
      name: 'Inclusive Web Alliance',
      short_desc: 'Accessibility delivery partner',
      status: 1,
    },
  ],
  'payment-gateways': [
    { name: 'Stripe', slug: 'stripe', mode: 'test', status: 1 },
  ],
  plans: [
    {
      name: 'Professional',
      slug: 'professional',
      serials: 1,
      price: 49,
      status: 1,
    },
  ],
  'portfolio-categories': [
    { title: 'Web Applications', slug: 'web-applications', status: 1 },
  ],
  portfolios: [
    {
      title: 'Accessible Citizen Portal',
      slug: 'accessible-citizen-portal',
      description: 'A role-aware public-service workflow.',
      status: 1,
    },
  ],
  'release-notes': [
    {
      title: 'Independent API migration',
      version_name: '1.0.0',
      notes: 'NestJS, Prisma, and PostgreSQL backend introduced.',
      status: 1,
    },
  ],
  roles: [{ role_name: 'Content Manager', name: 'Content Manager', status: 1 }],
  'sms-templates': [
    {
      name: 'OTP notification',
      slug: 'otp-notification',
      content: 'Your verification code is {{code}}.',
      status: 1,
    },
  ],
  'social-links': [
    {
      social_title: 'GitHub',
      icon: 'fa-brands fa-github',
      color: '#111827',
      url: 'https://github.com/',
      status: 1,
    },
  ],
  subscribes: [
    {
      email: 'subscriber@example.com',
      subscribed_at: '2026-07-20',
      expires_at: null,
      is_active: 1,
      status: 1,
    },
  ],
  tags: [{ tag_title: 'Accessibility', name: 'Accessibility', status: 1 }],
  'trusted-brands': [
    {
      title: 'Open Standards Initiative',
      name: 'Open Standards Initiative',
      status: 1,
    },
  ],
  'tutorial-categories': [
    { title: 'Admin Guides', slug: 'admin-guides', status: 1 },
  ],
  tutorials: [
    {
      title: 'Managing accessible content',
      slug: 'managing-accessible-content',
      category: { title: 'Admin Guides' },
      status: 1,
    },
  ],
  users: [
    {
      first_name: 'Nadia',
      last_name: 'Ahmed',
      name: 'Nadia Ahmed',
      email: 'nadia@example.com',
      login_id: 'nadia',
      status: 1,
    },
  ],
  years: [{ year: 2026, status: 1 }],
};

const resources = async () => {
  for (const [resource, rows] of Object.entries(resourceSeeds)) {
    const existing = await prisma.resourceRecord.count({ where: { resource } });
    if (existing > 0) continue;
    for (const row of rows) {
      const { status = 1, ...data } = row;
      const identityValue =
        primitiveText(
          data.title ?? data.name ?? data.email ?? data.year ?? data.slug ?? '',
        ) ?? '';
      const normalizedIdentity = identityValue.trim().toLowerCase();
      await prisma.resourceRecord.create({
        data: {
          resource,
          status: Number(status),
          data: data as Prisma.InputJsonValue,
          searchText: scalarText(data).join(' '),
          identityValue: normalizedIdentity || null,
        },
      });
    }
  }
};

const menuItems = [
  ['Dashboard', '/admin-panel', 'dashboard', 'fa-solid fa-chart-line'],
  ['Users', '/admin-panel/users', 'users', 'fa-solid fa-users'],
  ['Roles', '/admin-panel/role', 'roles', 'fa-solid fa-user-shield'],
  [
    'Menu Setup',
    '/admin-panel/menu-setup',
    'tree-entity',
    'fa-solid fa-sitemap',
  ],
  ['CMS Metadata', '/admin-panel/metas', 'metas', 'fa-solid fa-tags'],
  ['News', '/admin-panel/news', 'news', 'fa-solid fa-newspaper'],
  ['FAQs', '/admin-panel/faq', 'faqs', 'fa-solid fa-circle-question'],
  [
    'Tutorials',
    '/admin-panel/tutorial',
    'tutorials',
    'fa-solid fa-graduation-cap',
  ],
  [
    'Portfolios',
    '/admin-panel/portfolios',
    'portfolios',
    'fa-solid fa-briefcase',
  ],
  ['Plans', '/admin-panel/plans', 'plans', 'fa-solid fa-layer-group'],
  [
    'Payments',
    '/admin-panel/payment-gateways',
    'payment-gateways',
    'fa-solid fa-credit-card',
  ],
  [
    'Compliance',
    '/admin-panel/compliance',
    'compliances',
    'fa-solid fa-universal-access',
  ],
  [
    'Release Notes',
    '/admin-panel/release-notes',
    'release-notes',
    'fa-solid fa-code-branch',
  ],
] as const;

const menus = async () => {
  if ((await prisma.menuItem.count()) > 0) return;
  for (const [nodeName, routeName, routeLocation, icon] of menuItems) {
    await prisma.menuItem.create({
      data: {
        nodeName,
        routeName,
        routeLocation,
        icon,
        status: 1,
        serial: menuItems.findIndex((item) => item[0] === nodeName),
      },
    });
  }
};

const main = async () => {
  await accounts();
  await citizenPortal();
  await resources();
  await menus();
};

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
