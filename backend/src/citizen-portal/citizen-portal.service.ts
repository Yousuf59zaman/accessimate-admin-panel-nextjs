import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  Account,
  AccessibilityScan,
  CitizenInvoice,
  CitizenPaymentTransaction,
  CitizenSubscription,
  CitizenWebsite,
  PdfRemediation,
  Prisma,
  ScanType,
} from "@prisma/client";
import { compare, hash } from "bcryptjs";
import { randomBytes } from "node:crypto";
import { AssetsService } from "../assets/assets.service";
import type { AuthenticatedUser } from "../common/interfaces/authenticated-request";
import { PrismaService } from "../prisma/prisma.service";
import {
  AccessibilityScannerService,
  type AccessibilityCategory,
} from "./accessibility-scanner.service";
import {
  CreateScanDto,
  CreateSupportRequestDto,
  CreateWebsiteDto,
  UpdateAccountDto,
  UpdatePasswordDto,
  UpdateWebsiteDto,
} from "./dto/citizen-portal.dto";

const PDF_LIMIT_BYTES = 2 * 1024 * 1024;

const profileObject = (value: Prisma.JsonValue | null): Prisma.JsonObject =>
  value && typeof value === "object" && !Array.isArray(value) ? value : {};

const iso = (value: Date | null | undefined) => value?.toISOString() ?? null;

const normalizedWebsiteUrl = (value: string) => {
  const url = new URL(value);
  url.hash = "";
  if (url.pathname !== "/") url.pathname = url.pathname.replace(/\/+$/, "");
  return url.toString();
};

@Injectable()
export class CitizenPortalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scanner: AccessibilityScannerService,
    private readonly assets: AssetsService,
    private readonly config: ConfigService,
  ) {}

  async overview(user: AuthenticatedUser) {
    this.assertCitizen(user);
    const [websites, scans, latestScan, subscription, pdfs] = await Promise.all(
      [
        this.prisma.citizenWebsite.count({ where: { accountId: user.id } }),
        this.prisma.accessibilityScan.count({ where: { accountId: user.id } }),
        this.prisma.accessibilityScan.findFirst({
          where: { accountId: user.id },
          orderBy: { createdAt: "desc" },
          include: { website: true },
        }),
        this.prisma.citizenSubscription.findFirst({
          where: { accountId: user.id },
          orderBy: { createdAt: "desc" },
        }),
        this.prisma.pdfRemediation.count({ where: { accountId: user.id } }),
      ],
    );
    return {
      status: true,
      data: {
        totals: { websites, audits: scans, pdf_submissions: pdfs },
        latest_scan: latestScan ? this.scanDto(latestScan) : null,
        subscription: subscription ? this.subscriptionDto(subscription) : null,
      },
    };
  }

  async websites(user: AuthenticatedUser) {
    this.assertCitizen(user);
    const rows = await this.prisma.citizenWebsite.findMany({
      where: { accountId: user.id },
      orderBy: { updatedAt: "desc" },
    });
    return {
      status: true,
      data: { data: rows.map((row) => this.websiteDto(row)) },
    };
  }

  async website(user: AuthenticatedUser, id: number) {
    const row = await this.findWebsite(user, id);
    return { status: true, data: this.websiteDto(row) };
  }

  async createWebsite(
    user: AuthenticatedUser,
    dto: CreateWebsiteDto,
    requestId?: string,
  ) {
    this.assertCitizen(user);
    const url = normalizedWebsiteUrl(dto.url);
    try {
      const row = await this.prisma.citizenWebsite.create({
        data: {
          accountId: user.id,
          name: dto.name.trim(),
          url,
          status: "TRIAL",
          planName: "Starter trial",
          trialEndsAt: new Date(Date.now() + 7 * 86_400_000),
        },
      });
      await this.audit(
        user,
        "create",
        "citizen-websites",
        `${row.id}`,
        requestId,
      );
      return {
        status: true,
        message: "Website added successfully.",
        data: this.websiteDto(row),
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictException(
          "This website is already connected to the account.",
        );
      }
      throw error;
    }
  }

  async updateWebsite(
    user: AuthenticatedUser,
    id: number,
    dto: UpdateWebsiteDto,
    requestId?: string,
  ) {
    await this.findWebsite(user, id);
    try {
      const row = await this.prisma.citizenWebsite.update({
        where: { id },
        data: { name: dto.name.trim(), url: normalizedWebsiteUrl(dto.url) },
      });
      await this.audit(
        user,
        "update",
        "citizen-websites",
        `${row.id}`,
        requestId,
      );
      return {
        status: true,
        message: "Website updated successfully.",
        data: this.websiteDto(row),
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictException(
          "This website is already connected to the account.",
        );
      }
      throw error;
    }
  }

  async deleteWebsite(user: AuthenticatedUser, id: number, requestId?: string) {
    await this.findWebsite(user, id);
    await this.prisma.citizenWebsite.delete({ where: { id } });
    await this.audit(user, "delete", "citizen-websites", `${id}`, requestId);
    return { status: true, message: "Website removed successfully." };
  }

  async scanHistory(user: AuthenticatedUser) {
    this.assertCitizen(user);
    const rows = await this.prisma.accessibilityScan.findMany({
      where: { accountId: user.id },
      orderBy: { createdAt: "desc" },
      include: { website: true },
      take: 50,
    });
    return { status: true, data: rows.map((row) => this.scanDto(row)) };
  }

  async createScan(
    user: AuthenticatedUser,
    dto: CreateScanDto,
    requestId?: string,
  ) {
    const website = await this.findWebsite(user, dto.website_id);
    const registeredUrl = new URL(website.url);
    const scanUrl = normalizedWebsiteUrl(dto.url ?? website.url);
    if (new URL(scanUrl).origin !== registeredUrl.origin) {
      throw new BadRequestException(
        "The scan URL must use the same origin as the selected website.",
      );
    }
    const analysis = await this.scanner.scan(scanUrl, {
      fullSite: dto.scan_entire_site === true,
      includePaths: dto.options?.include_paths,
      excludePaths: dto.options?.exclude_paths,
      requestDelay: dto.options?.request_delay,
    });
    const verdict =
      analysis.summary.errors === 0 ? "passed" : "attention required";
    const row = await this.prisma.accessibilityScan.create({
      data: {
        accountId: user.id,
        websiteId: website.id,
        scanType: dto.scan_entire_site ? ScanType.SITE : ScanType.SINGLE,
        scannedUrl: scanUrl,
        verdict,
        wcagVersion: dto.wcag_version ?? "2.1",
        complianceLevel: dto.compliance_level ?? "AA",
        issues: {
          results: analysis.results,
          page_results: analysis.pageResults,
        },
        issueCategories: Object.fromEntries(
          Object.entries(analysis.results).map(([key, category]) => [
            key,
            category.issues.length,
          ]),
        ),
        issuesFound: analysis.summary.total,
        errorsCount: analysis.summary.errors,
        warningsCount: analysis.summary.warnings,
        noticesCount: analysis.summary.notices,
        pagesScanned: analysis.pagesScanned,
        pagesWithIssues: analysis.pagesWithIssues,
        scanDurationMs: analysis.durationMs,
      },
      include: { website: true },
    });
    await this.audit(user, "scan", "accessibility-scans", row.id, requestId, {
      websiteId: website.id,
      pagesScanned: analysis.pagesScanned,
    });
    return {
      status: true,
      message: "Accessibility scan completed.",
      data: this.scanDto(row),
    };
  }

  async sitemapPaths(user: AuthenticatedUser, sitemapUrl: string) {
    this.assertCitizen(user);
    return { status: true, data: await this.scanner.sitemapPaths(sitemapUrl) };
  }

  async accessibilityOverview(user: AuthenticatedUser, websiteId?: number) {
    this.assertCitizen(user);
    if (websiteId) await this.findWebsite(user, websiteId);
    const scan = await this.prisma.accessibilityScan.findFirst({
      where: { accountId: user.id, ...(websiteId ? { websiteId } : {}) },
      orderBy: { createdAt: "desc" },
      include: { website: true },
    });
    if (!scan) {
      return {
        status: true,
        data: { scan: null, percentage: 0, sections: [] },
      };
    }
    const categories = scan.issues as Prisma.JsonObject;
    const results = (categories.results ?? {}) as Record<
      string,
      AccessibilityCategory
    >;
    const penalty =
      scan.errorsCount * 12 + scan.warningsCount * 5 + scan.noticesCount * 2;
    const percentage = Math.max(0, Math.min(100, 100 - penalty));
    return {
      status: true,
      data: {
        scan: this.scanDto(scan),
        percentage,
        status:
          percentage >= 90
            ? "Compliant"
            : percentage >= 60
              ? "Semi-compliant"
              : "Needs attention",
        sections: Object.entries(results).map(([key, category]) => ({
          key,
          title: category.title,
          score: Math.max(
            0,
            100 -
              category.issues.filter((issue) => issue.type === "error").length *
                20 -
              category.issues.filter((issue) => issue.type === "warning")
                .length *
                10 -
              category.issues.filter((issue) => issue.type === "notice")
                .length *
                4,
          ),
          items: category.issues,
          wcag: category.wcag,
          level: category.level,
        })),
      },
    };
  }

  async billingInvoice(user: AuthenticatedUser) {
    this.assertCitizen(user);
    const invoice = await this.prisma.citizenInvoice.findFirst({
      where: { accountId: user.id },
      orderBy: { billDate: "desc" },
      include: { subscription: true },
    });
    return { status: true, data: invoice ? this.invoiceDto(invoice) : null };
  }

  async subscription(user: AuthenticatedUser) {
    this.assertCitizen(user);
    const subscription = await this.prisma.citizenSubscription.findFirst({
      where: { accountId: user.id },
      orderBy: { createdAt: "desc" },
    });
    return {
      status: true,
      data: subscription ? this.subscriptionDto(subscription) : null,
    };
  }

  async paymentTransactions(user: AuthenticatedUser) {
    this.assertCitizen(user);
    const rows = await this.prisma.citizenPaymentTransaction.findMany({
      where: { accountId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return { status: true, data: rows.map((row) => this.paymentDto(row)) };
  }

  async updateAccount(
    user: AuthenticatedUser,
    accountId: string,
    dto: UpdateAccountDto,
    requestId?: string,
  ) {
    this.assertCitizen(user);
    if (user.id !== accountId)
      throw new ForbiddenException("Account ownership mismatch.");
    const account = await this.prisma.account.findUnique({
      where: { id: user.id },
    });
    if (!account) throw new NotFoundException("Account not found.");
    if (account.email.toLowerCase() !== dto.email.toLowerCase()) {
      throw new BadRequestException(
        "The account email cannot be changed here.",
      );
    }
    let photoUrl = account.photoUrl;
    if (dto.photo?.startsWith("data:")) {
      const stored = await this.assets.storeDataUrls({ photo: dto.photo });
      photoUrl = stored.photo;
    }
    const profile = profileObject(account.profile);
    const updated = await this.prisma.account.update({
      where: { id: user.id },
      data: {
        firstName: dto.first_name.trim(),
        lastName: dto.last_name.trim(),
        mobile: dto.mobile?.trim() || null,
        countryCode: dto.ccode,
        photoUrl,
        profile: {
          ...profile,
          middleName: dto.middle_name?.trim() ?? "",
        },
      },
    });
    await this.audit(user, "update", "citizen-account", user.id, requestId);
    return {
      status: true,
      message: "Account details saved successfully.",
      data: this.accountDto(updated),
    };
  }

  async updatePassword(
    user: AuthenticatedUser,
    dto: UpdatePasswordDto,
    requestId?: string,
  ) {
    this.assertCitizen(user);
    if (dto.password !== dto.password_confirmation) {
      throw new BadRequestException({
        message: "Password confirmation does not match.",
        password_confirmation: ["Password confirmation does not match."],
      });
    }
    const account = await this.prisma.account.findUnique({
      where: { id: user.id },
    });
    if (!account || !(await compare(dto.old_password, account.passwordHash))) {
      throw new UnauthorizedException("The current password is incorrect.");
    }
    if (await compare(dto.password, account.passwordHash)) {
      throw new BadRequestException("The new password must be different.");
    }
    await this.prisma.account.update({
      where: { id: user.id },
      data: { passwordHash: await hash(dto.password, 12) },
    });
    await this.audit(
      user,
      "update-password",
      "citizen-account",
      user.id,
      requestId,
    );
    return { status: true, message: "Password updated successfully." };
  }

  async countries(user: AuthenticatedUser) {
    this.assertCitizen(user);
    const rows = await this.prisma.resourceRecord.findMany({
      where: { resource: "countries", status: 1, deletedAt: null },
      orderBy: { updatedAt: "desc" },
      take: 250,
    });
    return {
      status: true,
      data: rows.map((row) => ({
        id: row.id,
        ...(row.data as Prisma.JsonObject),
      })),
    };
  }

  async developerResources(user: AuthenticatedUser) {
    const account = await this.account(user);
    return {
      status: true,
      data: {
        api_key: account.apiKey,
        swagger_url: `${this.publicApiUrl()}/api/docs`,
        base_url: `${this.publicApiUrl()}/api/v1`,
        endpoints: [
          {
            method: "GET",
            path: "/customer/websites",
            name: "List websites",
            description: "Returns websites owned by the authenticated citizen.",
          },
          {
            method: "POST",
            path: "/customer/websites",
            name: "Create website",
            description: "Connects a validated website to the account.",
          },
          {
            method: "POST",
            path: "/customer/scan",
            name: "Run accessibility scan",
            description: "Runs the protected live WCAG analysis pipeline.",
          },
          {
            method: "GET",
            path: "/customer/scan-history",
            name: "Audit history",
            description:
              "Returns persisted accessibility scans and issue summaries.",
          },
          {
            method: "GET",
            path: "/customer/billing/invoices",
            name: "Current invoice",
            description: "Returns the latest persisted billing invoice.",
          },
          {
            method: "POST",
            path: "/customer/pdf-remediations",
            name: "Submit PDF",
            description:
              "Creates a real PDF remediation request with secured file ownership.",
          },
        ],
      },
    };
  }

  async embedConfig(user: AuthenticatedUser) {
    const account = await this.account(user);
    const scriptUrl = `${this.publicApiUrl()}/api/v1/public/widget.js`;
    const previewUrl = `${this.publicApiUrl()}/api/v1/public/widget-preview?account=${encodeURIComponent(account.apiKey ?? "")}`;
    return {
      status: true,
      data: {
        api_key: account.apiKey,
        script_url: scriptUrl,
        preview_url: previewUrl,
        embed_code: `<script src="${scriptUrl}" data-account="${account.apiKey ?? ""}" defer></script>`,
        capabilities: [
          "Text scaling",
          "High contrast",
          "Link highlighting",
          "Keyboard-accessible controls",
        ],
      },
    };
  }

  async pdfRemediations(user: AuthenticatedUser) {
    this.assertCitizen(user);
    const rows = await this.prisma.pdfRemediation.findMany({
      where: { accountId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return {
      status: true,
      data: {
        stats: {
          total: rows.length,
          accessible: rows.filter((row) => row.status === "ACCESSIBLE").length,
          inaccessible: rows.filter((row) => row.status === "NEEDS_REMEDIATION")
            .length,
          processing: rows.filter((row) =>
            ["SUBMITTED", "UNDER_REVIEW"].includes(row.status),
          ).length,
        },
        data: rows.map((row) => this.pdfDto(row)),
      },
    };
  }

  async submitPdfRemediations(
    user: AuthenticatedUser,
    files: Express.Multer.File[],
    requestId?: string,
  ) {
    this.assertCitizen(user);
    if (!files.length)
      throw new BadRequestException("Select at least one PDF file.");
    const rows = [];
    for (const file of files) {
      if (file.mimetype !== "application/pdf") {
        throw new BadRequestException(
          `${file.originalname} is not a PDF file.`,
        );
      }
      if (!file.buffer.length || file.buffer.length > PDF_LIMIT_BYTES) {
        throw new BadRequestException(
          `${file.originalname} must be between 1 byte and 2 MB.`,
        );
      }
      if (file.buffer.subarray(0, 4).toString("ascii") !== "%PDF") {
        throw new BadRequestException(
          `${file.originalname} has an invalid PDF signature.`,
        );
      }
      const row = await this.prisma.pdfRemediation.create({
        data: {
          accountId: user.id,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          bytes: Uint8Array.from(file.buffer),
        },
      });
      rows.push(row);
      await this.audit(user, "create", "pdf-remediations", row.id, requestId);
    }
    return {
      status: true,
      message: `${rows.length} PDF file${rows.length === 1 ? "" : "s"} submitted for review.`,
      data: rows.map((row) => this.pdfDto(row)),
    };
  }

  async pdfDownload(user: AuthenticatedUser, id: string) {
    this.assertCitizen(user);
    const row = await this.prisma.pdfRemediation.findFirst({
      where: { id, accountId: user.id },
    });
    if (!row) throw new NotFoundException("PDF submission not found.");
    return row;
  }

  async supportRequest(
    user: AuthenticatedUser,
    dto: CreateSupportRequestDto,
    requestId?: string,
  ) {
    this.assertCitizen(user);
    let preferredAt: Date | null = null;
    if (dto.preferred_at) {
      preferredAt = new Date(dto.preferred_at);
      if (Number.isNaN(preferredAt.getTime())) {
        throw new BadRequestException(
          "preferred_at must be a valid date and time.",
        );
      }
    }
    const row = await this.prisma.supportRequest.create({
      data: {
        accountId: user.id,
        kind: dto.kind,
        subject: dto.subject.trim(),
        message: dto.message.trim(),
        preferredAt,
      },
    });
    await this.audit(user, "create", "support-requests", row.id, requestId);
    return {
      status: true,
      message: "Support request submitted successfully.",
      data: {
        id: row.id,
        status: row.status.toLowerCase(),
        created_at: row.createdAt.toISOString(),
      },
    };
  }

  async notifications(user: AuthenticatedUser) {
    this.assertCitizen(user);
    const [scans, invoices, pdfs] = await Promise.all([
      this.prisma.accessibilityScan.findMany({
        where: { accountId: user.id },
        orderBy: { createdAt: "desc" },
        take: 3,
        include: { website: true },
      }),
      this.prisma.citizenInvoice.findMany({
        where: { accountId: user.id },
        orderBy: { billDate: "desc" },
        take: 2,
      }),
      this.prisma.pdfRemediation.findMany({
        where: { accountId: user.id },
        orderBy: { createdAt: "desc" },
        take: 2,
      }),
    ]);
    const data = [
      ...scans.map((scan) => ({
        id: `scan-${scan.id}`,
        type: "audit",
        title: `${scan.website.name} audit ${scan.verdict}`,
        created_at: scan.createdAt.toISOString(),
      })),
      ...invoices.map((invoice) => ({
        id: `invoice-${invoice.id}`,
        type: "billing",
        title: `Invoice ${invoice.status.toLowerCase()}: ${invoice.currency} ${invoice.billAmount.toString()}`,
        created_at: invoice.createdAt.toISOString(),
      })),
      ...pdfs.map((pdf) => ({
        id: `pdf-${pdf.id}`,
        type: "pdf",
        title: `${pdf.originalName}: ${pdf.status.toLowerCase().replaceAll("_", " ")}`,
        created_at: pdf.createdAt.toISOString(),
      })),
    ]
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 6);
    return { status: true, data };
  }

  private async findWebsite(user: AuthenticatedUser, id: number) {
    this.assertCitizen(user);
    const row = await this.prisma.citizenWebsite.findFirst({
      where: { id, accountId: user.id },
    });
    if (!row) throw new NotFoundException("Website not found.");
    return row;
  }

  private async account(user: AuthenticatedUser) {
    this.assertCitizen(user);
    const account = await this.prisma.account.findUnique({
      where: { id: user.id },
    });
    if (!account) throw new NotFoundException("Account not found.");
    return account;
  }

  private websiteDto(row: CitizenWebsite) {
    const remainingDays = row.trialEndsAt
      ? Math.max(
          Math.ceil((row.trialEndsAt.getTime() - Date.now()) / 86_400_000),
          0,
        )
      : null;
    return {
      id: row.id,
      name: row.name,
      url: row.url,
      status: row.status.toLowerCase(),
      plan: row.planName ?? "-",
      time_left: remainingDays === null ? "-" : `${remainingDays} days`,
      trial_ends_at: iso(row.trialEndsAt),
      created_at: row.createdAt.toISOString(),
      updated_at: row.updatedAt.toISOString(),
    };
  }

  private scanDto(row: AccessibilityScan & { website?: CitizenWebsite }) {
    return {
      id: row.id,
      website_id: row.websiteId,
      website_name: row.website?.name,
      scanned_url: row.scannedUrl,
      system: row.system,
      verdict: row.verdict,
      scan_type: row.scanType.toLowerCase(),
      scan_status: row.scanStatus.toLowerCase(),
      wcag_version: row.wcagVersion,
      compliance_level: row.complianceLevel,
      issues: row.issues,
      issue_categories: row.issueCategories,
      issues_found: row.issuesFound,
      errors_count: row.errorsCount,
      warnings_count: row.warningsCount,
      notices_count: row.noticesCount,
      pages_scanned: row.pagesScanned,
      pages_with_issues: row.pagesWithIssues,
      scan_duration: Number((row.scanDurationMs / 1_000).toFixed(2)),
      scan_date: row.createdAt.toISOString(),
      created_at: row.createdAt.toISOString(),
    };
  }

  private subscriptionDto(row: CitizenSubscription) {
    return {
      id: row.id,
      plan_id: row.planSlug,
      plan: { name: row.planName, description: row.planDescription },
      amount: row.amount.toString(),
      currency: row.currency,
      subscription_type: row.type.toLowerCase(),
      status: row.status.toLowerCase(),
      start_date: row.startDate.toISOString(),
      next_billing_date: row.nextBillingDate.toISOString(),
      auto_renew: row.autoRenew,
    };
  }

  private invoiceDto(
    row: CitizenInvoice & { subscription: CitizenSubscription },
  ) {
    return {
      id: row.id,
      bill_amount: row.billAmount.toString(),
      currency: row.currency,
      bill_date: row.billDate.toISOString(),
      payment_due_date: row.paymentDueDate.toISOString(),
      status: row.status.toLowerCase(),
      subscription: {
        id: row.subscription.id,
        plan_id: row.subscription.planSlug,
        subscription_type: row.subscription.type.toLowerCase(),
        auto_renew: row.subscription.autoRenew,
      },
    };
  }

  private paymentDto(row: CitizenPaymentTransaction) {
    return {
      id: row.id,
      payment_intent_id: row.externalId,
      gateway: row.gateway,
      amount: row.amount.toString(),
      currency: row.currency,
      status: row.status.toLowerCase(),
      metadata: { plan_name: row.planName, ...profileObject(row.metadata) },
      created_at: row.createdAt.toISOString(),
    };
  }

  private pdfDto(row: PdfRemediation) {
    return {
      id: row.id,
      original_name: row.originalName,
      size: row.size,
      status: row.status.toLowerCase(),
      issue_count: row.issueCount,
      download_url: `/api/citizen/pdf-remediations/${row.id}/download`,
      created_at: row.createdAt.toISOString(),
      updated_at: row.updatedAt.toISOString(),
    };
  }

  private accountDto(account: Account) {
    const profile = profileObject(account.profile);
    return {
      id: account.id,
      name: `${account.firstName} ${account.lastName}`.trim(),
      email: account.email,
      login_id: account.loginId,
      mobile: account.mobile,
      ccode: account.countryCode,
      photo: account.photoUrl,
      user_info: {
        first_name: account.firstName,
        middle_name:
          typeof profile.middleName === "string" ? profile.middleName : "",
        last_name: account.lastName,
      },
      user_account_detail: { api_key: account.apiKey },
      roles: account.roles,
      permissions: account.permissions,
      is_demo: account.isDemo,
    };
  }

  private publicApiUrl() {
    return this.config
      .get<string>("PUBLIC_API_URL", "http://localhost:4000")
      .replace(/\/+$/, "");
  }

  private assertCitizen(user: AuthenticatedUser) {
    if (user.type !== "CITIZEN") {
      throw new ForbiddenException(
        "This endpoint is available to citizen accounts only.",
      );
    }
  }

  private async audit(
    user: AuthenticatedUser,
    action: string,
    resource: string,
    resourceId: string,
    requestId?: string,
    details?: Prisma.InputJsonValue,
  ) {
    await this.prisma.auditLog.create({
      data: {
        accountId: user.id,
        action,
        resource,
        resourceId,
        requestId,
        details,
      },
    });
  }
}

export const createApiKey = () => `am_${randomBytes(24).toString("base64url")}`;
