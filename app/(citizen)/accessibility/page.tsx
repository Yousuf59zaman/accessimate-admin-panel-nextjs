"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  EmptyState,
  ErrorPanel,
  LoadingPanel,
  PageHeader,
  PortalCard,
  StatusPill,
} from "@/app/components/citizen/PortalUi";
import { fetchCitizen } from "@/app/lib/fetchCitizen";
import type {
  AccessibilityOverview,
  ApiEnvelope,
  Website,
} from "@/app/lib/citizen/types";
import { formatDate } from "@/app/lib/citizen/types";

export default function AccessibilityPage() {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [selected, setSelected] = useState(0);
  const [overview, setOverview] = useState<AccessibilityOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openSection, setOpenSection] = useState<string | null>(null);

  const load = useCallback(async (websiteId?: number) => {
    setLoading(true);
    setError("");
    try {
      const websiteResponse = await fetchCitizen<ApiEnvelope<{ data: Website[] }>>(
        "customer/websites",
      );
      const rows = websiteResponse.data.data;
      const activeId = websiteId ?? selected ?? rows[0]?.id ?? 0;
      const response = await fetchCitizen<ApiEnvelope<AccessibilityOverview>>(
        `customer/accessibility-overview${activeId ? `?website_id=${activeId}` : ""}`,
      );
      setWebsites(rows);
      setSelected(activeId);
      setOverview(response.data);
      setOpenSection(response.data.sections[0]?.key ?? null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Accessibility details are unavailable.");
    } finally {
      setLoading(false);
    }
  }, [selected]);

  useEffect(() => {
    void load();
    // Initial load selects the first owned website.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading && !overview) return <LoadingPanel label="Calculating your accessibility score…" />;
  if (error && !overview) return <ErrorPanel message={error} retry={() => void load()} />;

  const scan = overview?.scan;
  const percentage = overview?.percentage ?? 0;

  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="Compliance intelligence"
        title="Accessibility overview"
        description="Turn the latest real scan into an explainable score, issue map, and practical remediation checklist."
        actions={
          <div className="citizen-field" style={{ minWidth: 260 }}>
            <label htmlFor="accessibility-site" className="sr-only">Website</label>
            <select id="accessibility-site" value={selected} onChange={(event) => void load(Number(event.target.value))} disabled={loading}>
              {websites.map((website) => <option key={website.id} value={website.id}>{website.name}</option>)}
            </select>
          </div>
        }
      />

      {!scan ? (
        <PortalCard>
          <EmptyState
            icon="fa-solid fa-universal-access"
            title="No accessibility result yet"
            description="Run a website audit first. This page will then derive its score and issue groups from the persisted scan."
            action={<Link href="/audit" className="citizen-button primary">Run an accessibility audit</Link>}
          />
        </PortalCard>
      ) : (
        <>
          <div className="portal-grid dashboard-detail">
            <PortalCard>
              <div className="portal-card-head"><div><h2>Latest compliance score</h2><p>{scan.website_name} · scanned {formatDate(scan.scan_date)}</p></div><StatusPill value={overview?.status || scan.verdict} /></div>
              <div className="portal-card-body" style={{ display: "flex", alignItems: "center", gap: 28, flexWrap: "wrap" }}>
                <div className="score-ring" style={{ "--score": percentage } as React.CSSProperties}><div><strong>{percentage}%</strong><small>Overall score</small></div></div>
                <div style={{ flex: 1, minWidth: 240, display: "grid", gap: 14 }}>
                  <div><h3 style={{ margin: 0, fontSize: 18 }}>{overview?.status}</h3><p style={{ margin: "5px 0 0", color: "var(--citizen-muted)", fontSize: 10, lineHeight: 1.6 }}>The score penalizes detected errors, warnings, and notices. It is an engineering signal—not a substitute for a complete manual accessibility review.</p></div>
                  <div className="progress-track"><span style={{ width: `${percentage}%` }} /></div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 9 }}>
                    {[ ["Errors",scan.errors_count,"#d94c59"],["Warnings",scan.warnings_count,"#d88b20"],["Notices",scan.notices_count,"#1769e0"] ].map(([label,value,color]) => <div key={String(label)} style={{ padding: 11, border: "1px solid var(--citizen-border)", borderRadius: 10 }}><strong style={{ display: "block", color: String(color), fontSize: 17 }}>{value}</strong><small style={{ color: "var(--citizen-muted)", fontSize: 9 }}>{label}</small></div>)}
                  </div>
                </div>
              </div>
            </PortalCard>
            <PortalCard>
              <div className="portal-card-head"><div><h2>Scan facts</h2><p>Traceable backend metadata.</p></div></div>
              <div className="portal-card-body" style={{ display: "grid", gap: 11 }}>
                {[ ["Engine",scan.system],["Standard",`WCAG ${scan.wcag_version} ${scan.compliance_level}`],["Scope",`${scan.scan_type} · ${scan.pages_scanned} page${scan.pages_scanned === 1 ? "" : "s"}`],["Pages with findings",`${scan.pages_with_issues} of ${scan.pages_scanned}`],["Runtime",`${scan.scan_duration} seconds`] ].map(([label,value]) => <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 15, paddingBottom: 10, borderBottom: "1px solid var(--citizen-border)", fontSize: 10 }}><span style={{ color: "var(--citizen-muted)" }}>{label}</span><strong style={{ textAlign: "right" }}>{value}</strong></div>)}
                <Link href="/audit" className="citizen-button secondary" style={{ marginTop: 3 }}>Open complete audit history</Link>
              </div>
            </PortalCard>
          </div>

          <div className="portal-grid two" style={{ marginTop: 17 }}>
            {overview?.sections.map((section) => (
              <PortalCard key={section.key}>
                <button
                  type="button"
                  className="portal-card-head"
                  style={{ width: "100%", border: 0, borderBottom: openSection === section.key ? "1px solid var(--citizen-border)" : 0, background: "transparent", color: "inherit", cursor: "pointer", textAlign: "left" }}
                  onClick={() => setOpenSection((value) => value === section.key ? null : section.key)}
                  aria-expanded={openSection === section.key}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span className={`metric-icon ${section.score >= 90 ? "metric-green" : section.score >= 60 ? "metric-orange" : "metric-violet"}`} style={{ width: 40, height: 40, flexBasis: 40 }}><i className={section.key.includes("image") ? "fa-regular fa-image" : section.key.includes("form") ? "fa-regular fa-rectangle-list" : section.key.includes("click") ? "fa-solid fa-hand-pointer" : "fa-solid fa-code"} /></span>
                    <div><h2>{section.title}</h2><p>WCAG {section.wcag} · Level {section.level}</p></div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}><strong style={{ color: section.score >= 90 ? "#23a77e" : "#d88b20" }}>{section.score}%</strong><i className={`fa-solid fa-chevron-${openSection === section.key ? "up" : "down"}`} /></div>
                </button>
                {openSection === section.key && <div className="portal-card-body">
                  {section.items.length ? <div className="issue-list">{section.items.map((issue,index) => <article className={`issue-item ${issue.type}`} key={`${section.key}-${index}`}><i className={`fa-solid ${issue.type === "error" ? "fa-circle-xmark" : issue.type === "warning" ? "fa-triangle-exclamation" : "fa-circle-info"}`} /><div><strong>{issue.message}</strong><p>{issue.recommendation}</p>{issue.element && <code>{issue.element}</code>}{issue.page_url && <small>{issue.page_url}</small>}</div></article>)}</div> : <div className="portal-notice success"><i className="fa-solid fa-circle-check" /><div>No findings detected in this automated category.</div></div>}
                </div>}
              </PortalCard>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
