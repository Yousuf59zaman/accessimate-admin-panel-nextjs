"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useCitizenAuth } from "@/app/contexts/CitizenAuthContext";
import {
  EmptyState,
  ErrorPanel,
  InlineNotice,
  LoadingPanel,
  Modal,
  PageHeader,
  PortalCard,
  StatusPill,
  Toast,
} from "@/app/components/citizen/PortalUi";
import { fetchCitizen } from "@/app/lib/fetchCitizen";
import type { ApiEnvelope, Scan, Website } from "@/app/lib/citizen/types";
import { formatDate } from "@/app/lib/citizen/types";

export default function AuditPage() {
  const { citizenUser } = useCitizenAuth();
  const [websites, setWebsites] = useState<Website[]>([]);
  const [history, setHistory] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(0);
  const [fullSite, setFullSite] = useState(false);
  const [wcag, setWcag] = useState("2.2");
  const [level, setLevel] = useState("AA");
  const [includePaths, setIncludePaths] = useState("/");
  const [scanning, setScanning] = useState(false);
  const [selectedScan, setSelectedScan] = useState<Scan | null>(null);
  const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [websiteResponse, historyResponse] = await Promise.all([
        fetchCitizen<ApiEnvelope<{ data: Website[] }>>("customer/websites"),
        fetchCitizen<ApiEnvelope<Scan[]>>("customer/scan-history"),
      ]);
      const websiteRows = websiteResponse.data.data;
      setWebsites(websiteRows);
      setHistory(historyResponse.data);
      setSelectedId((current) => {
        if (current && websiteRows.some((website) => website.id === current)) return current;
        const queryId = typeof window === "undefined" ? 0 : Number(new URLSearchParams(window.location.search).get("website"));
        return websiteRows.some((website) => website.id === queryId) ? queryId : websiteRows[0]?.id ?? 0;
      });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Audit data is unavailable.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase();
    if (!text) return history;
    return history.filter((scan) =>
      [scan.website_name, scan.scanned_url, scan.verdict, scan.scan_type, scan.wcag_version]
        .join(" ")
        .toLowerCase()
        .includes(text),
    );
  }, [history, query]);

  const runScan = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedId) return;
    setScanning(true);
    try {
      const paths = includePaths
        .split("\n")
        .map((path) => path.trim())
        .filter(Boolean);
      const response = await fetchCitizen<ApiEnvelope<Scan>>("customer/scan", {
        method: "POST",
        body: {
          website_id: selectedId,
          scan_entire_site: fullSite,
          wcag_version: wcag,
          compliance_level: level,
          standards: ["wcag", "ada"],
          options: { include_paths: fullSite ? paths : undefined, request_delay: 150 },
        },
      });
      setSelectedScan(response.data);
      setToast({ message: response.message || "Accessibility scan completed.", tone: "success" });
      await load();
    } catch (reason) {
      setToast({
        message: reason instanceof Error ? reason.message : "The accessibility scan failed.",
        tone: "error",
      });
    } finally {
      setScanning(false);
    }
  };

  if (loading) return <LoadingPanel label="Loading accessibility audit history…" />;
  if (error) return <ErrorPanel message={error} retry={() => void load()} />;

  const totals = history.reduce(
    (value, scan) => ({
      issues: value.issues + scan.issues_found,
      errors: value.errors + scan.errors_count,
      pages: value.pages + scan.pages_scanned,
    }),
    { issues: 0, errors: 0, pages: 0 },
  );
  const issueCategories = selectedScan?.issues.results ?? {};

  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="WCAG audit engine"
        title="Accessibility audits"
        description="Run protected server-side checks against public pages, then inspect every persisted finding and remediation recommendation."
        actions={<button className="citizen-button secondary" type="button" onClick={() => void load()}><i className="fa-solid fa-rotate" /> Refresh history</button>}
      />

      <div className="portal-grid dashboard-detail">
        <PortalCard>
          <div className="portal-card-head"><div><h2>Run a new audit</h2><p>The backend blocks credentials, private hosts, unsafe ports, and oversized responses.</p></div><span className="portal-status positive"><span />Live engine</span></div>
          <form className="portal-card-body" onSubmit={runScan}>
            <div className="citizen-form-grid">
              <div className="citizen-field"><label htmlFor="audit-site">Connected website</label><select id="audit-site" required value={selectedId} onChange={(event) => setSelectedId(Number(event.target.value))}><option value={0}>Select a website</option>{websites.map((website) => <option key={website.id} value={website.id}>{website.name} — {website.url}</option>)}</select></div>
              <div className="citizen-field"><label htmlFor="audit-wcag">WCAG version</label><select id="audit-wcag" value={wcag} onChange={(event) => setWcag(event.target.value)}><option value="2.0">WCAG 2.0</option><option value="2.1">WCAG 2.1</option><option value="2.2">WCAG 2.2</option></select></div>
              <div className="citizen-field"><label htmlFor="audit-level">Compliance target</label><select id="audit-level" value={level} onChange={(event) => setLevel(event.target.value)}><option value="A">Level A</option><option value="AA">Level AA</option><option value="AAA">Level AAA</option></select></div>
              <label className="portal-notice" style={{ cursor: "pointer", alignItems: "center" }}><input type="checkbox" checked={fullSite} onChange={(event) => setFullSite(event.target.checked)} /><div><strong>Multi-page scan</strong><br />Scan up to eight explicitly selected paths.</div></label>
            </div>
            {fullSite && <div className="citizen-field" style={{ marginTop: 15 }}><label htmlFor="audit-paths">Included paths (one per line)</label><textarea id="audit-paths" value={includePaths} onChange={(event) => setIncludePaths(event.target.value)} placeholder={"/\n/about\n/contact"} /><small>All paths must stay on the connected website hostname.</small></div>}
            {citizenUser?.is_demo && <div style={{ marginTop: 15 }}><InlineNotice tone="warning">Live reviewer mode exposes real saved scan results but blocks resource-intensive scan mutations. The owner workflow is covered by authenticated API tests.</InlineNotice></div>}
            <div className="citizen-form-actions"><button className="citizen-button primary" type="submit" disabled={!selectedId || scanning || citizenUser?.is_demo}>{scanning ? <><span className="portal-spinner" style={{ width: 16, height: 16 }} /> Scanning pages…</> : <><i className="fa-solid fa-radar" /> Start secure audit</>}</button></div>
          </form>
        </PortalCard>

        <PortalCard>
          <div className="portal-card-head"><div><h2>Audit coverage</h2><p>Aggregate persisted workspace totals.</p></div></div>
          <div className="portal-card-body" style={{ display: "grid", gap: 13 }}>
            {[
              ["Saved audit runs", history.length, "fa-clock-rotate-left", "#1769e0"],
              ["Pages inspected", totals.pages, "fa-file-code", "#7652d9"],
              ["Findings captured", totals.issues, "fa-list-check", "#d88b20"],
              ["Errors requiring action", totals.errors, "fa-circle-exclamation", "#d94c59"],
            ].map(([labelText, value, icon, color]) => (
              <div key={String(labelText)} style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, border: "1px solid var(--citizen-border)", borderRadius: 11 }}>
                <i className={`fa-solid ${icon}`} style={{ color: String(color), width: 20, textAlign: "center" }} /><div style={{ display: "grid" }}><strong style={{ fontSize: 18 }}>{value}</strong><small style={{ color: "var(--citizen-muted)", fontSize: 9 }}>{labelText}</small></div>
              </div>
            ))}
          </div>
        </PortalCard>
      </div>

      <PortalCard style={{ marginTop: 17 }}>
        <div className="portal-card-head"><div><h2>Scan history</h2><p>Every result below is loaded from PostgreSQL.</p></div><div className="portal-search"><i className="fa-solid fa-magnifying-glass" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search history…" aria-label="Search scan history" /></div></div>
        {filtered.length ? (
          <div className="portal-table-wrap"><table className="portal-table"><thead><tr><th>Website</th><th>Scope</th><th>Standard</th><th>Findings</th><th>Verdict</th><th>Completed</th><th>Report</th></tr></thead><tbody>
            {filtered.map((scan) => <tr key={scan.id}><td><div className="table-primary"><strong>{scan.website_name || "Connected website"}</strong><small>{scan.scanned_url}</small></div></td><td>{scan.scan_type} · {scan.pages_scanned} page{scan.pages_scanned === 1 ? "" : "s"}</td><td>WCAG {scan.wcag_version} {scan.compliance_level}</td><td><strong>{scan.issues_found}</strong> <small>({scan.errors_count} errors)</small></td><td><StatusPill value={scan.verdict} /></td><td>{formatDate(scan.scan_date)}</td><td><div className="table-actions"><button type="button" onClick={() => setSelectedScan(scan)} title="View report"><i className="fa-regular fa-eye" /></button></div></td></tr>)}
          </tbody></table></div>
        ) : <EmptyState icon="fa-solid fa-magnifying-glass-chart" title={query ? "No matching audit" : "No audit history"} description={query ? "Adjust your search query." : "Run the first secure scan for a connected website."} />}
      </PortalCard>

      <Modal open={Boolean(selectedScan)} title="Accessibility audit report" onClose={() => setSelectedScan(null)}>
        {selectedScan && <div className="portal-modal-body" style={{ display: "grid", gap: 17 }}>
          <div className="portal-grid two">
            <div className="portal-notice"><i className="fa-solid fa-globe" /><div><strong>{selectedScan.website_name}</strong><br />{selectedScan.scanned_url}</div></div>
            <div className="portal-notice success"><i className="fa-solid fa-shield-check" /><div><strong>WCAG {selectedScan.wcag_version} {selectedScan.compliance_level}</strong><br />{selectedScan.pages_scanned} page{selectedScan.pages_scanned === 1 ? "" : "s"} in {selectedScan.scan_duration}s</div></div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><StatusPill value={`${selectedScan.errors_count} errors`} /><StatusPill value={`${selectedScan.warnings_count} warnings`} /><StatusPill value={`${selectedScan.notices_count} notices`} /></div>
          {Object.keys(issueCategories).length ? Object.entries(issueCategories).map(([key, category]) => <section key={key} style={{ display: "grid", gap: 9 }}><div><strong style={{ fontSize: 12 }}>{category.title}</strong><p style={{ margin: "3px 0 0", color: "var(--citizen-muted)", fontSize: 9 }}>WCAG {category.wcag} · Level {category.level}</p></div>{category.issues.length ? <div className="issue-list">{category.issues.map((issue, index) => <article className={`issue-item ${issue.type}`} key={`${key}-${index}`}><i className={`fa-solid ${issue.type === "error" ? "fa-circle-xmark" : issue.type === "warning" ? "fa-triangle-exclamation" : "fa-circle-info"}`} /><div><strong>{issue.message}</strong><p>{issue.recommendation}</p>{issue.element && <code>{issue.element}</code>}</div></article>)}</div> : <InlineNotice tone="success">No findings were recorded in this category.</InlineNotice>}</section>) : <EmptyState icon="fa-solid fa-circle-check" title="No categorized findings" description="This scan did not record any accessibility issues." />}
        </div>}
      </Modal>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}
