"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useCitizenAuth } from "@/app/contexts/CitizenAuthContext";
import {
  EmptyState,
  ErrorPanel,
  InlineNotice,
  LoadingPanel,
  MetricCard,
  Modal,
  PageHeader,
  PortalCard,
  StatusPill,
  Toast,
} from "@/app/components/citizen/PortalUi";
import { fetchCitizen } from "@/app/lib/fetchCitizen";
import type { ApiEnvelope, PortalOverview, Website } from "@/app/lib/citizen/types";
import { formatDate, formatMoney } from "@/app/lib/citizen/types";

type WebsiteForm = { name: string; url: string };
const emptyForm: WebsiteForm = { name: "", url: "https://" };

export default function CitizenDashboardPage() {
  const { citizenUser } = useCitizenAuth();
  const [overview, setOverview] = useState<PortalOverview | null>(null);
  const [websites, setWebsites] = useState<Website[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Website | null>(null);
  const [deleting, setDeleting] = useState<Website | null>(null);
  const [form, setForm] = useState<WebsiteForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [overviewResponse, websitesResponse] = await Promise.all([
        fetchCitizen<ApiEnvelope<PortalOverview>>("customer/portal/overview"),
        fetchCitizen<ApiEnvelope<{ data: Website[] }>>("customer/websites"),
      ]);
      setOverview(overviewResponse.data);
      setWebsites(websitesResponse.data.data);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Live portal data is unavailable.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredWebsites = useMemo(() => {
    const text = query.trim().toLowerCase();
    if (!text) return websites;
    return websites.filter((website) =>
      [website.name, website.url, website.status, website.plan]
        .join(" ")
        .toLowerCase()
        .includes(text),
    );
  }, [query, websites]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (website: Website) => {
    setEditing(website);
    setForm({ name: website.name, url: website.url });
    setFormOpen(true);
  };

  const saveWebsite = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await fetchCitizen<ApiEnvelope<Website>>(
        editing ? `customer/websites/${editing.id}` : "customer/websites",
        { method: editing ? "PUT" : "POST", body: form },
      );
      setToast({ message: response.message || "Website saved.", tone: "success" });
      setFormOpen(false);
      await load();
    } catch (reason) {
      setToast({
        message: reason instanceof Error ? reason.message : "The website could not be saved.",
        tone: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteWebsite = async () => {
    if (!deleting) return;
    setSaving(true);
    try {
      const response = await fetchCitizen<ApiEnvelope<never>>(
        `customer/websites/${deleting.id}`,
        { method: "DELETE" },
      );
      setToast({ message: response.message || "Website removed.", tone: "success" });
      setDeleting(null);
      await load();
    } catch (reason) {
      setToast({
        message: reason instanceof Error ? reason.message : "The website could not be removed.",
        tone: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingPanel label="Loading your citizen workspace…" />;
  if (error) return <ErrorPanel message={error} retry={() => void load()} />;

  const latest = overview?.latest_scan;
  const subscription = overview?.subscription;
  const score = latest
    ? Math.max(0, 100 - latest.errors_count * 12 - latest.warnings_count * 5 - latest.notices_count * 2)
    : 0;

  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="Live citizen workspace"
        title={`Welcome back, ${citizenUser?.name?.split(" ")[0] || "Citizen"}`}
        description="Monitor connected websites, review WCAG findings, and manage accessibility delivery from one secure workspace."
        actions={
          <>
            <Link className="citizen-button secondary" href="/audit">
              <i className="fa-solid fa-magnifying-glass-chart" /> View audits
            </Link>
            <button
              className="citizen-button primary"
              type="button"
              onClick={openCreate}
              disabled={citizenUser?.is_demo}
              title={citizenUser?.is_demo ? "Reviewer mode is read-only" : "Connect a website"}
            >
              <i className="fa-solid fa-plus" /> Add website
            </button>
          </>
        }
      />

      <div className="portal-grid metrics">
        <MetricCard icon="fa-solid fa-globe" label="Connected websites" value={overview?.totals.websites ?? 0} helper="Persisted in your account" tone="blue" />
        <MetricCard icon="fa-solid fa-magnifying-glass-chart" label="Completed audits" value={overview?.totals.audits ?? 0} helper="Real scan history" tone="violet" />
        <MetricCard icon="fa-solid fa-gauge-high" label="Latest score" value={latest ? `${score}%` : "—"} helper={latest ? latest.website_name || "Latest website" : "Run an audit to begin"} tone="green" />
        <MetricCard icon="fa-solid fa-file-shield" label="PDF submissions" value={overview?.totals.pdf_submissions ?? 0} helper="Secure remediation records" tone="orange" />
      </div>

      <div className="portal-grid dashboard-detail">
        <PortalCard>
          <div className="portal-card-head">
            <div>
              <h2>Latest accessibility signal</h2>
              <p>Calculated from the most recent persisted scan.</p>
            </div>
            {latest && <StatusPill value={latest.verdict} />}
          </div>
          {latest ? (
            <div className="portal-card-body" style={{ display: "grid", gap: 18 }}>
              <div style={{ display: "flex", gap: 22, alignItems: "center", flexWrap: "wrap" }}>
                <div className="score-ring" style={{ "--score": score } as React.CSSProperties}>
                  <div><strong>{score}%</strong><small>WCAG score</small></div>
                </div>
                <div style={{ flex: 1, minWidth: 220, display: "grid", gap: 12 }}>
                  <div className="table-primary"><strong>{latest.website_name}</strong><small>{latest.scanned_url}</small></div>
                  <div className="progress-track"><span style={{ width: `${score}%` }} /></div>
                  <div style={{ display: "flex", gap: 18, flexWrap: "wrap", color: "var(--citizen-muted)", fontSize: 10 }}>
                    <span><strong style={{ color: "#d94c59" }}>{latest.errors_count}</strong> errors</span>
                    <span><strong style={{ color: "#d88b20" }}>{latest.warnings_count}</strong> warnings</span>
                    <span><strong style={{ color: "#1769e0" }}>{latest.notices_count}</strong> notices</span>
                    <span>{latest.pages_scanned} page{latest.pages_scanned === 1 ? "" : "s"}</span>
                  </div>
                  <small style={{ color: "var(--citizen-muted)", fontSize: 9 }}>Scanned {formatDate(latest.scan_date)} · WCAG {latest.wcag_version} {latest.compliance_level}</small>
                </div>
              </div>
              <Link className="citizen-button secondary" href="/accessibility" style={{ justifySelf: "start" }}>
                Explore all findings <i className="fa-solid fa-arrow-right" />
              </Link>
            </div>
          ) : (
            <EmptyState icon="fa-solid fa-chart-simple" title="No audit signal yet" description="Connect a website and run a real accessibility audit to generate your compliance score." />
          )}
        </PortalCard>

        <PortalCard>
          <div className="portal-card-head"><div><h2>Current plan</h2><p>Live entitlement and renewal status.</p></div>{subscription && <StatusPill value={subscription.status} />}</div>
          {subscription ? (
            <div className="portal-card-body" style={{ display: "grid", gap: 17 }}>
              <div>
                <p style={{ margin: 0, color: "var(--citizen-muted)", fontSize: 10 }}>PLAN</p>
                <h3 style={{ margin: "4px 0 0", fontSize: 20 }}>{subscription.plan.name}</h3>
                <p style={{ margin: "5px 0 0", color: "var(--citizen-muted)", fontSize: 10, lineHeight: 1.55 }}>{subscription.plan.description}</p>
              </div>
              <strong style={{ fontSize: 24 }}>{formatMoney(subscription.amount, subscription.currency)}<small style={{ color: "var(--citizen-muted)", fontSize: 10, fontWeight: 500 }}> / {subscription.subscription_type}</small></strong>
              <div className="portal-notice success"><i className="fa-solid fa-calendar-check" /><div>Next billing date<br /><strong>{formatDate(subscription.next_billing_date)}</strong></div></div>
              <Link href="/billing-payments" className="citizen-button secondary">Open billing details</Link>
            </div>
          ) : (
            <EmptyState icon="fa-solid fa-layer-group" title="No subscription" description="No active plan is attached to this account." />
          )}
        </PortalCard>
      </div>

      <PortalCard style={{ marginTop: 17 }}>
        <div className="portal-card-head">
          <div><h2>Connected websites</h2><p>Only websites owned by this citizen account are returned.</p></div>
          <div className="portal-search"><i className="fa-solid fa-magnifying-glass" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search websites…" aria-label="Search websites" /></div>
        </div>
        {filteredWebsites.length ? (
          <div className="portal-table-wrap">
            <table className="portal-table">
              <thead><tr><th>Website</th><th>Plan</th><th>Status</th><th>Access</th><th>Updated</th><th>Actions</th></tr></thead>
              <tbody>
                {filteredWebsites.map((website) => (
                  <tr key={website.id}>
                    <td><div className="table-primary"><strong>{website.name}</strong><small>{website.url}</small></div></td>
                    <td>{website.plan}</td><td><StatusPill value={website.status} /></td><td>{website.time_left}</td><td>{formatDate(website.updated_at)}</td>
                    <td><div className="table-actions">
                      <Link href={`/audit?website=${website.id}`} title="Open audit"><i className="fa-solid fa-magnifying-glass-chart" /></Link>
                      <button type="button" onClick={() => openEdit(website)} disabled={citizenUser?.is_demo} title="Edit website"><i className="fa-solid fa-pen" /></button>
                      <button type="button" onClick={() => setDeleting(website)} disabled={citizenUser?.is_demo} title="Remove website"><i className="fa-regular fa-trash-can" /></button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon="fa-solid fa-globe" title={query ? "No matching websites" : "No websites connected"} description={query ? "Try a different search phrase." : "Connect your first website to start monitoring accessibility."} action={!query && !citizenUser?.is_demo ? <button className="citizen-button primary" type="button" onClick={openCreate}>Add website</button> : undefined} />
        )}
      </PortalCard>

      {citizenUser?.is_demo && <div style={{ marginTop: 17 }}><InlineNotice>Reviewer mode keeps every mutation disabled, while all visible metrics, scans, billing records, downloads, and developer settings come from the live API.</InlineNotice></div>}

      <Modal open={formOpen} title={editing ? "Edit connected website" : "Connect a website"} onClose={() => setFormOpen(false)}>
        <form className="portal-modal-body" onSubmit={saveWebsite}>
          <div className="citizen-form-grid">
            <div className="citizen-field"><label htmlFor="website-name">Display name</label><input id="website-name" required minLength={2} maxLength={100} value={form.name} onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))} placeholder="Company website" /></div>
            <div className="citizen-field"><label htmlFor="website-url">Public website URL</label><input id="website-url" required type="url" value={form.url} onChange={(event) => setForm((value) => ({ ...value, url: event.target.value }))} placeholder="https://example.com" /></div>
          </div>
          <div style={{ marginTop: 15 }}><InlineNotice tone="warning">Only public HTTP/HTTPS websites can be scanned. Local and private-network addresses are blocked by the backend.</InlineNotice></div>
          <div className="citizen-form-actions"><button className="citizen-button secondary" type="button" onClick={() => setFormOpen(false)}>Cancel</button><button className="citizen-button primary" type="submit" disabled={saving}>{saving ? "Saving…" : editing ? "Save changes" : "Connect website"}</button></div>
        </form>
      </Modal>

      <Modal open={Boolean(deleting)} title="Remove website" onClose={() => setDeleting(null)}>
        <div className="portal-modal-body">
          <InlineNotice tone="warning">Removing <strong>{deleting?.name}</strong> also removes its persisted scan history. This cannot be undone.</InlineNotice>
          <div className="citizen-form-actions"><button className="citizen-button secondary" type="button" onClick={() => setDeleting(null)}>Keep website</button><button className="citizen-button danger" type="button" onClick={() => void deleteWebsite()} disabled={saving}>{saving ? "Removing…" : "Remove website"}</button></div>
        </div>
      </Modal>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}
