export type ApiEnvelope<T> = {
  status: boolean;
  message?: string;
  data: T;
};

export type Website = {
  id: number;
  name: string;
  url: string;
  status: string;
  plan: string;
  time_left: string;
  trial_ends_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AccessibilityIssue = {
  type: "error" | "warning" | "notice";
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

export type Scan = {
  id: string;
  website_id: number;
  website_name?: string;
  scanned_url: string;
  system: string;
  verdict: string;
  scan_type: string;
  scan_status: string;
  wcag_version: string;
  compliance_level: string;
  issues: {
    results?: Record<string, AccessibilityCategory>;
    page_results?: Record<string, unknown>;
  };
  issue_categories: Record<string, number>;
  issues_found: number;
  errors_count: number;
  warnings_count: number;
  notices_count: number;
  pages_scanned: number;
  pages_with_issues: number;
  scan_duration: number;
  scan_date: string;
  created_at: string;
};

export type Subscription = {
  id: string;
  plan_id: string;
  plan: { name: string; description: string };
  amount: string;
  currency: string;
  subscription_type: string;
  status: string;
  start_date: string;
  next_billing_date: string;
  auto_renew: boolean;
};

export type Invoice = {
  id: string;
  bill_amount: string;
  currency: string;
  bill_date: string;
  payment_due_date: string;
  status: string;
  subscription: {
    id: string;
    plan_id: string;
    subscription_type: string;
    auto_renew: boolean;
  };
};

export type Payment = {
  id: string;
  payment_intent_id: string;
  gateway: string;
  amount: string;
  currency: string;
  status: string;
  metadata: Record<string, string | number | boolean | null>;
  created_at: string;
};

export type PdfRemediation = {
  id: string;
  original_name: string;
  size: number;
  status: string;
  issue_count: number | null;
  download_url: string;
  created_at: string;
  updated_at: string;
};

export type PortalOverview = {
  totals: { websites: number; audits: number; pdf_submissions: number };
  latest_scan: Scan | null;
  subscription: Subscription | null;
};

export type AccessibilityOverview = {
  scan: Scan | null;
  percentage: number;
  status?: string;
  sections: Array<{
    key: string;
    title: string;
    score: number;
    items: AccessibilityIssue[];
    wcag: string;
    level: string;
  }>;
};

export type Notification = {
  id: string;
  type: string;
  title: string;
  created_at: string;
};

export const formatDate = (value?: string | null) => {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

export const formatMoney = (amount: string | number, currency = "USD") =>
  new Intl.NumberFormat("en", {
    style: "currency",
    currency,
  }).format(Number(amount));

export const formatBytes = (bytes: number) => {
  if (bytes < 1_024) return `${bytes} B`;
  if (bytes < 1_048_576) return `${(bytes / 1_024).toFixed(1)} KB`;
  return `${(bytes / 1_048_576).toFixed(1)} MB`;
};
