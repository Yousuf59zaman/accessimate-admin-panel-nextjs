import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  Res,
  UploadedFiles,
  UseInterceptors,
} from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiConsumes, ApiTags } from "@nestjs/swagger";
import type { Response } from "express";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import type {
  AuthenticatedRequest,
  AuthenticatedUser,
} from "../common/interfaces/authenticated-request";
import { CitizenPortalService } from "./citizen-portal.service";
import {
  AccessibilityQueryDto,
  CreateScanDto,
  CreateSupportRequestDto,
  CreateWebsiteDto,
  SitemapDto,
  UpdateAccountDto,
  UpdatePasswordDto,
  UpdateWebsiteDto,
} from "./dto/citizen-portal.dto";

const PDF_UPLOAD_LIMIT = 2 * 1024 * 1024;

@ApiTags("Citizen portal")
@ApiBearerAuth()
@Controller("customer")
export class CitizenPortalController {
  constructor(private readonly portal: CitizenPortalService) {}

  @Get("portal/overview")
  overview(@CurrentUser() user: AuthenticatedUser) {
    return this.portal.overview(user);
  }

  @Get("websites")
  websites(@CurrentUser() user: AuthenticatedUser) {
    return this.portal.websites(user);
  }

  @Get("websites/:id")
  website(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseIntPipe) id: number,
  ) {
    return this.portal.website(user, id);
  }

  @Post("websites")
  createWebsite(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateWebsiteDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.portal.createWebsite(user, dto, request.requestId);
  }

  @Put("websites/:id")
  updateWebsite(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateWebsiteDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.portal.updateWebsite(user, id, dto, request.requestId);
  }

  @Delete("websites/:id")
  deleteWebsite(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.portal.deleteWebsite(user, id, request.requestId);
  }

  @Get("scan-history")
  scanHistory(@CurrentUser() user: AuthenticatedUser) {
    return this.portal.scanHistory(user);
  }

  @Post("scan")
  scan(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateScanDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.portal.createScan(user, dto, request.requestId);
  }

  @Post("sitemap-to-url")
  sitemap(@CurrentUser() user: AuthenticatedUser, @Body() dto: SitemapDto) {
    return this.portal.sitemapPaths(user, dto.sitemap_url);
  }

  @Get("accessibility-overview")
  accessibility(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: AccessibilityQueryDto,
  ) {
    return this.portal.accessibilityOverview(user, query.website_id);
  }

  @Get("billing/invoices")
  invoice(@CurrentUser() user: AuthenticatedUser) {
    return this.portal.billingInvoice(user);
  }

  @Get("subscriptions/my-subscriptions")
  subscription(@CurrentUser() user: AuthenticatedUser) {
    return this.portal.subscription(user);
  }

  @Get("payment-transactions/my-transactions")
  transactions(@CurrentUser() user: AuthenticatedUser) {
    return this.portal.paymentTransactions(user);
  }

  @Post("account-information/:id")
  updateAccount(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: UpdateAccountDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.portal.updateAccount(user, id, dto, request.requestId);
  }

  @Post("update-password")
  updatePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdatePasswordDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.portal.updatePassword(user, dto, request.requestId);
  }

  @Get("reference/countries")
  countries(@CurrentUser() user: AuthenticatedUser) {
    return this.portal.countries(user);
  }

  @Get("developer-resources")
  developerResources(@CurrentUser() user: AuthenticatedUser) {
    return this.portal.developerResources(user);
  }

  @Get("embed-config")
  embedConfig(@CurrentUser() user: AuthenticatedUser) {
    return this.portal.embedConfig(user);
  }

  @Get("pdf-remediations")
  pdfRemediations(@CurrentUser() user: AuthenticatedUser) {
    return this.portal.pdfRemediations(user);
  }

  @Post("pdf-remediations")
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(
    FilesInterceptor("files", 4, {
      limits: { fileSize: PDF_UPLOAD_LIMIT, files: 4 },
    }),
  )
  submitPdfs(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFiles() files: Express.Multer.File[] = [],
    @Req() request: AuthenticatedRequest,
  ) {
    return this.portal.submitPdfRemediations(user, files, request.requestId);
  }

  @Get("pdf-remediations/:id/download")
  async downloadPdf(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Res() response: Response,
  ) {
    const pdf = await this.portal.pdfDownload(user, id);
    response.setHeader("Content-Type", pdf.mimeType);
    response.setHeader("Content-Length", pdf.size.toString());
    response.setHeader(
      "Content-Disposition",
      `attachment; filename*=UTF-8''${encodeURIComponent(pdf.originalName)}`,
    );
    response.setHeader("Cache-Control", "private, no-store");
    response.send(Buffer.from(pdf.bytes));
  }

  @Post("support-requests")
  supportRequest(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateSupportRequestDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.portal.supportRequest(user, dto, request.requestId);
  }

  @Get("notifications")
  notifications(@CurrentUser() user: AuthenticatedUser) {
    return this.portal.notifications(user);
  }
}
