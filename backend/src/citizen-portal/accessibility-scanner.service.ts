import {
  BadGatewayException,
  BadRequestException,
  Injectable,
} from "@nestjs/common";
import * as cheerio from "cheerio";
import type { LookupAddress } from "node:dns";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

type IssueSeverity = "error" | "warning" | "notice";

export type AccessibilityIssue = {
  type: IssueSeverity;
  message: string;
  recommendation: string;
  element?: string;
  page_url?: string;
};

export type AccessibilityCategory = {
  title: string;
  wcag: string;
  level: "A" | "AA" | "AAA";
  issues: AccessibilityIssue[];
};

export type PageAnalysis = {
  results: Record<string, AccessibilityCategory>;
  summary: { errors: number; warnings: number; notices: number; total: number };
};

export type ScanAnalysis = PageAnalysis & {
  pageResults: Record<
    string,
    PageAnalysis & { status_code: number; error?: string }
  >;
  pagesScanned: number;
  pagesWithIssues: number;
  durationMs: number;
};

const MAX_RESPONSE_BYTES = 1_500_000;
const MAX_SITE_PAGES = 8;
const MAX_SITEMAP_URLS = 100;

const isPrivateIpv4 = (address: string) => {
  const octets = address.split(".").map(Number);
  if (octets.length !== 4 || octets.some((value) => !Number.isInteger(value))) {
    return true;
  }
  const [first, second] = octets;
  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    first >= 224 ||
    (first === 100 && second >= 64 && second <= 127) ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168)
  );
};

const isPrivateAddress = (address: string) => {
  const normalized = address.toLowerCase();
  if (isIP(normalized) === 4) return isPrivateIpv4(normalized);
  if (isIP(normalized) !== 6) return true;
  if (normalized.startsWith("::ffff:")) {
    return isPrivateIpv4(normalized.slice("::ffff:".length));
  }
  return (
    normalized === "::" ||
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    /^fe[89ab]/.test(normalized)
  );
};

const normalizedUrl = (rawUrl: string) => {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new BadRequestException("A valid website URL is required.");
  }
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new BadRequestException(
      "Only HTTP and HTTPS websites can be scanned.",
    );
  }
  if (url.username || url.password) {
    throw new BadRequestException("Website URLs cannot contain credentials.");
  }
  if (url.port && !["80", "443"].includes(url.port)) {
    throw new BadRequestException("Only standard web ports can be scanned.");
  }
  url.hash = "";
  return url;
};

const mergePageAnalyses = (
  pages: Array<{ url: string; analysis: PageAnalysis; statusCode: number }>,
  durationMs: number,
): ScanAnalysis => {
  const results: Record<string, AccessibilityCategory> = {};
  const pageResults: ScanAnalysis["pageResults"] = {};

  for (const page of pages) {
    pageResults[page.url] = { ...page.analysis, status_code: page.statusCode };
    for (const [key, category] of Object.entries(page.analysis.results)) {
      const target = (results[key] ??= {
        title: category.title,
        wcag: category.wcag,
        level: category.level,
        issues: [],
      });
      target.issues.push(
        ...category.issues.map((issue) => ({ ...issue, page_url: page.url })),
      );
    }
  }

  const issues = Object.values(results).flatMap((category) => category.issues);
  const summary = {
    errors: issues.filter((issue) => issue.type === "error").length,
    warnings: issues.filter((issue) => issue.type === "warning").length,
    notices: issues.filter((issue) => issue.type === "notice").length,
    total: issues.length,
  };

  return {
    results,
    summary,
    pageResults,
    pagesScanned: pages.length,
    pagesWithIssues: pages.filter((page) => page.analysis.summary.total > 0)
      .length,
    durationMs,
  };
};

@Injectable()
export class AccessibilityScannerService {
  async scan(
    websiteUrl: string,
    options: {
      fullSite: boolean;
      includePaths?: string[];
      excludePaths?: string[];
      requestDelay?: number;
    },
  ): Promise<ScanAnalysis> {
    const startedAt = Date.now();
    const baseUrl = normalizedUrl(websiteUrl);
    const includePaths = options.fullSite
      ? options.includePaths?.length
        ? options.includePaths
        : ["/"]
      : [baseUrl.pathname || "/"];
    const excludePaths = options.excludePaths ?? [];
    const uniqueUrls = new Map<string, URL>();

    for (const path of includePaths) {
      const candidate = normalizedUrl(new URL(path, baseUrl).toString());
      if (candidate.hostname !== baseUrl.hostname) continue;
      if (
        excludePaths.some((excluded) => candidate.pathname.startsWith(excluded))
      ) {
        continue;
      }
      uniqueUrls.set(candidate.toString(), candidate);
      if (uniqueUrls.size >= MAX_SITE_PAGES) break;
    }

    const pages: Array<{
      url: string;
      analysis: PageAnalysis;
      statusCode: number;
    }> = [];
    for (const candidate of uniqueUrls.values()) {
      const page = await this.fetchContent(candidate.toString(), ["text/html"]);
      pages.push({
        url: page.url,
        statusCode: page.statusCode,
        analysis: this.analyzeHtml(page.body),
      });
      if (options.requestDelay && uniqueUrls.size > 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, Math.min(options.requestDelay ?? 0, 1_000)),
        );
      }
    }

    if (!pages.length) {
      throw new BadRequestException(
        "No safe pages were selected for scanning.",
      );
    }
    return mergePageAnalyses(pages, Date.now() - startedAt);
  }

  async sitemapPaths(rawUrl: string) {
    const sitemapUrl = normalizedUrl(rawUrl);
    const response = await this.fetchContent(sitemapUrl.toString(), [
      "application/xml",
      "text/xml",
      "text/plain",
      "application/octet-stream",
    ]);
    const $ = cheerio.load(response.body, { xmlMode: true });
    const paths = new Set<string>();
    $("loc").each((_, element) => {
      const value = $(element).text().trim();
      if (!value || paths.size >= MAX_SITEMAP_URLS) return;
      try {
        const candidate = new URL(value, sitemapUrl);
        if (candidate.hostname !== sitemapUrl.hostname) return;
        paths.add(`${candidate.pathname}${candidate.search}` || "/");
      } catch {
        // Ignore malformed sitemap entries while retaining valid entries.
      }
    });
    if (!paths.size) {
      throw new BadRequestException(
        "The sitemap did not contain any valid page URLs.",
      );
    }
    return [...paths];
  }

  analyzeHtml(html: string): PageAnalysis {
    const $ = cheerio.load(html);
    const categories: Record<string, AccessibilityCategory> = {
      document: {
        title: "Document structure",
        wcag: "2.4.2",
        level: "A",
        issues: [],
      },
      images: {
        title: "Images and alternatives",
        wcag: "1.1.1",
        level: "A",
        issues: [],
      },
      clickables: {
        title: "Clickables",
        wcag: "4.1.2",
        level: "A",
        issues: [],
      },
      forms: {
        title: "Forms and labels",
        wcag: "3.3.2",
        level: "A",
        issues: [],
      },
      orientation: {
        title: "Orientation and navigation",
        wcag: "2.4.1",
        level: "A",
        issues: [],
      },
    };

    const add = (
      category: keyof typeof categories,
      issue: AccessibilityIssue,
    ) => {
      if (categories[category].issues.length < 20) {
        categories[category].issues.push(issue);
      }
    };
    const snippet = (element: Parameters<typeof $.html>[0]) =>
      $.html(element).replace(/\s+/g, " ").trim().slice(0, 240);

    if (!$("html").attr("lang")?.trim()) {
      add("document", {
        type: "error",
        message: "The document language is not declared.",
        recommendation: "Add a valid lang attribute to the html element.",
        element: "<html>",
      });
    }
    if (!$("title").first().text().trim()) {
      add("document", {
        type: "error",
        message: "The page title is missing or empty.",
        recommendation: "Provide a concise, unique title element.",
        element: "<title>",
      });
    }
    const headingCount = $("h1").length;
    if (headingCount !== 1) {
      add("document", {
        type: "warning",
        message: `The page has ${headingCount} H1 headings; one is recommended.`,
        recommendation:
          "Use one descriptive H1 and a logical heading hierarchy.",
      });
    }
    if (!$('meta[name="viewport"]').length) {
      add("document", {
        type: "notice",
        message: "A responsive viewport declaration was not found.",
        recommendation: "Add a viewport meta tag that supports browser zoom.",
      });
    }

    $("img").each((_, element) => {
      if ($(element).attr("alt") === undefined) {
        add("images", {
          type: "error",
          message: "An image does not have an alt attribute.",
          recommendation:
            'Add meaningful alternative text or alt="" for decorative images.',
          element: snippet(element),
        });
      }
    });

    $('button, [role="button"]').each((_, element) => {
      const target = $(element);
      const name =
        target.text().trim() ||
        target.attr("aria-label")?.trim() ||
        target.attr("title")?.trim();
      if (!name) {
        add("clickables", {
          type: "error",
          message: "An interactive button has no accessible name.",
          recommendation:
            "Add visible text, aria-label, or an associated accessible name.",
          element: snippet(element),
        });
      }
    });

    $("a[href]").each((_, element) => {
      const target = $(element);
      const name =
        target.text().trim() ||
        target.attr("aria-label")?.trim() ||
        target.find("img[alt]").attr("alt")?.trim();
      if (!name) {
        add("clickables", {
          type: "warning",
          message: "A link has no accessible name.",
          recommendation: "Provide descriptive link text or an aria-label.",
          element: snippet(element),
        });
      }
    });

    $('input:not([type="hidden"]), select, textarea').each((_, element) => {
      const target = $(element);
      const id = target.attr("id");
      const hasLabel = id
        ? $("label")
            .toArray()
            .some((label) => $(label).attr("for") === id)
        : false;
      const hasName = Boolean(
        target.attr("aria-label")?.trim() ||
        target.attr("aria-labelledby")?.trim() ||
        target.attr("title")?.trim(),
      );
      if (!hasLabel && !hasName) {
        add("forms", {
          type: "warning",
          message:
            "A form control is not associated with a visible or accessible label.",
          recommendation: "Connect a label with for/id or provide aria-label.",
          element: snippet(element),
        });
      }
    });

    const hasSkipLink = $('a[href^="#"]')
      .toArray()
      .some((element) => $(element).text().toLowerCase().includes("skip"));
    if (!hasSkipLink) {
      add("orientation", {
        type: "notice",
        message: "No skip navigation link was detected.",
        recommendation: "Add a keyboard-visible skip link to the main content.",
      });
    }

    const issues = Object.values(categories).flatMap(
      (category) => category.issues,
    );
    return {
      results: categories,
      summary: {
        errors: issues.filter((issue) => issue.type === "error").length,
        warnings: issues.filter((issue) => issue.type === "warning").length,
        notices: issues.filter((issue) => issue.type === "notice").length,
        total: issues.length,
      },
    };
  }

  private async fetchContent(rawUrl: string, acceptedContentTypes: string[]) {
    let currentUrl = normalizedUrl(rawUrl);
    for (let redirect = 0; redirect <= 3; redirect += 1) {
      await this.assertPublicHost(currentUrl.hostname);
      let response: Response;
      try {
        response = await fetch(currentUrl, {
          redirect: "manual",
          signal: AbortSignal.timeout(8_000),
          headers: {
            accept: acceptedContentTypes.join(", "),
            "user-agent": "Accessimate-Portfolio-Scanner/1.0",
          },
        });
      } catch {
        throw new BadGatewayException(
          "The website could not be reached safely.",
        );
      }

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location || redirect === 3) {
          throw new BadGatewayException(
            "The website returned an invalid redirect.",
          );
        }
        currentUrl = normalizedUrl(new URL(location, currentUrl).toString());
        continue;
      }
      if (!response.ok) {
        throw new BadGatewayException(
          `The website returned HTTP ${response.status}.`,
        );
      }
      const contentType =
        response.headers.get("content-type")?.toLowerCase() ?? "";
      if (!acceptedContentTypes.some((type) => contentType.includes(type))) {
        throw new BadRequestException(
          "The URL did not return supported web content.",
        );
      }
      const contentLength = Number(response.headers.get("content-length") ?? 0);
      if (contentLength > MAX_RESPONSE_BYTES) {
        throw new BadRequestException(
          "The website response is too large to scan safely.",
        );
      }
      const bytes = new Uint8Array(await response.arrayBuffer());
      if (bytes.length > MAX_RESPONSE_BYTES) {
        throw new BadRequestException(
          "The website response is too large to scan safely.",
        );
      }
      return {
        url: currentUrl.toString(),
        statusCode: response.status,
        body: new TextDecoder().decode(bytes),
      };
    }
    throw new BadGatewayException("The website could not be reached safely.");
  }

  private async assertPublicHost(hostname: string) {
    if (hostname === "localhost" || hostname.endsWith(".local")) {
      throw new BadRequestException(
        "Private network websites cannot be scanned.",
      );
    }
    const literalType = isIP(hostname);
    if (literalType && isPrivateAddress(hostname)) {
      throw new BadRequestException(
        "Private network websites cannot be scanned.",
      );
    }
    let addresses: LookupAddress[];
    try {
      addresses = await lookup(hostname, { all: true, verbatim: true });
    } catch {
      throw new BadGatewayException(
        "The website hostname could not be resolved.",
      );
    }
    if (
      !addresses.length ||
      addresses.some(({ address }) => isPrivateAddress(address))
    ) {
      throw new BadRequestException(
        "Private network websites cannot be scanned.",
      );
    }
  }
}
