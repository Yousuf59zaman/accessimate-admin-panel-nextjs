"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
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
import type { ApiEnvelope, PdfRemediation } from "@/app/lib/citizen/types";
import { formatBytes, formatDate } from "@/app/lib/citizen/types";

type PdfPayload = {
  stats: { total: number; accessible: number; inaccessible: number; processing: number };
  data: PdfRemediation[];
};

export default function DocumentPdfPage() {
  const { citizenUser } = useCitizenAuth();
  const [payload, setPayload] = useState<PdfPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [supporting, setSupporting] = useState(false);
  const [support, setSupport] = useState({ kind: "pdf-remediation", subject: "PDF accessibility review", message: "", preferred_at: "" });
  const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetchCitizen<ApiEnvelope<PdfPayload>>("customer/pdf-remediations");
      setPayload(response.data);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "PDF remediation data is unavailable.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const selectFiles = (selected: FileList | null) => {
    if (!selected) return;
    const rows = Array.from(selected).slice(0, 4);
    const invalid = rows.find((file) => file.type !== "application/pdf" || file.size > 2 * 1024 * 1024);
    if (invalid) {
      setToast({ message: `${invalid.name} must be a PDF no larger than 2 MB.`, tone: "error" });
      return;
    }
    setFiles(rows);
  };

  const upload = async () => {
    if (!files.length) return;
    setUploading(true);
    try {
      const form = new FormData();
      files.forEach((file) => form.append("files", file));
      const response = await fetchCitizen<ApiEnvelope<PdfRemediation[]>>(
        "customer/pdf-remediations",
        { method: "POST", body: form },
      );
      setToast({ message: response.message || "PDF files submitted.", tone: "success" });
      setFiles([]);
      if (fileInput.current) fileInput.current.value = "";
      await load();
    } catch (reason) {
      setToast({ message: reason instanceof Error ? reason.message : "PDF upload failed.", tone: "error" });
    } finally {
      setUploading(false);
    }
  };

  const submitSupport = async (event: FormEvent) => {
    event.preventDefault();
    setSupporting(true);
    try {
      const response = await fetchCitizen<ApiEnvelope<{ id: string }>>("customer/support-requests", {
        method: "POST",
        body: { ...support, preferred_at: support.preferred_at || undefined },
      });
      setToast({ message: response.message || "Support request submitted.", tone: "success" });
      setSupportOpen(false);
      setSupport((value) => ({ ...value, message: "", preferred_at: "" }));
    } catch (reason) {
      setToast({ message: reason instanceof Error ? reason.message : "Support request failed.", tone: "error" });
    } finally {
      setSupporting(false);
    }
  };

  if (loading && !payload) return <LoadingPanel label="Loading secure PDF submissions…" />;
  if (error && !payload) return <ErrorPanel message={error} retry={() => void load()} />;
  const stats = payload?.stats ?? { total: 0, accessible: 0, inaccessible: 0, processing: 0 };

  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="Document accessibility"
        title="Documents & PDFs"
        description="Submit PDF documents through a validated, ownership-protected pipeline and track real remediation records from upload to review."
        actions={<button className="citizen-button secondary" type="button" onClick={() => setSupportOpen(true)} disabled={citizenUser?.is_demo}><i className="fa-regular fa-life-ring" /> Request expert support</button>}
      />

      <div className="portal-grid metrics">
        <MetricCard icon="fa-solid fa-file-pdf" label="Total submissions" value={stats.total} helper="Owned by this account" tone="blue" />
        <MetricCard icon="fa-solid fa-file-circle-check" label="Accessible" value={stats.accessible} helper="Review completed" tone="green" />
        <MetricCard icon="fa-solid fa-file-circle-exclamation" label="Needs remediation" value={stats.inaccessible} helper="Action required" tone="orange" />
        <MetricCard icon="fa-solid fa-hourglass-half" label="In progress" value={stats.processing} helper="Submitted or under review" tone="violet" />
      </div>

      <div className="portal-grid dashboard-detail" style={{ marginTop: 17 }}>
        <PortalCard>
          <div className="portal-card-head"><div><h2>Secure PDF submission</h2><p>Upload up to four PDF files, maximum 2 MB each.</p></div><i className="fa-solid fa-cloud-arrow-up" style={{ color: "#1769e0" }} /></div>
          <div className="portal-card-body" style={{ display: "grid", gap: 14 }}>
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              disabled={citizenUser?.is_demo}
              style={{ display: "grid", minHeight: 190, placeItems: "center", alignContent: "center", gap: 8, border: "1.5px dashed #a9c1cf", borderRadius: 14, background: "var(--citizen-bg)", color: "var(--citizen-muted)", cursor: citizenUser?.is_demo ? "not-allowed" : "pointer", opacity: citizenUser?.is_demo ? .55 : 1 }}
            >
              <span className="metric-icon metric-blue"><i className="fa-solid fa-file-arrow-up" /></span>
              <strong style={{ color: "var(--citizen-text)", fontSize: 12 }}>Choose PDF documents</strong>
              <small>Signature, MIME type, file count, and size are revalidated by NestJS.</small>
            </button>
            <input ref={fileInput} type="file" accept="application/pdf,.pdf" multiple hidden onChange={(event) => selectFiles(event.target.files)} />
            {files.length > 0 && <div style={{ display: "grid", gap: 8 }}>{files.map((file) => <div key={`${file.name}-${file.size}`} style={{ display: "flex", alignItems: "center", gap: 10, padding: 10, border: "1px solid var(--citizen-border)", borderRadius: 10 }}><i className="fa-solid fa-file-pdf" style={{ color: "#d94c59" }} /><div className="table-primary" style={{ flex: 1 }}><strong>{file.name}</strong><small>{formatBytes(file.size)}</small></div><button className="citizen-icon-button" type="button" onClick={() => setFiles((rows) => rows.filter((row) => row !== file))} aria-label={`Remove ${file.name}`}><i className="fa-solid fa-xmark" /></button></div>)}</div>}
            {citizenUser?.is_demo && <InlineNotice tone="warning">Reviewer mode displays persisted file metadata and verifies protected downloads while uploads remain read-only.</InlineNotice>}
            <div className="citizen-form-actions" style={{ marginTop: 0 }}><button className="citizen-button primary" type="button" onClick={() => void upload()} disabled={!files.length || uploading || citizenUser?.is_demo}>{uploading ? "Uploading…" : `Submit ${files.length || ""} PDF${files.length === 1 ? "" : "s"}`}</button></div>
          </div>
        </PortalCard>

        <PortalCard>
          <div className="portal-card-head"><div><h2>How the workflow works</h2><p>Clear state, no random simulated result.</p></div></div>
          <div className="portal-card-body" style={{ display: "grid", gap: 15 }}>
            {[
              ["1", "Validated upload", "PDF signature, MIME type, size, and ownership are checked."],
              ["2", "Persisted review queue", "The document and status are stored in PostgreSQL."],
              ["3", "Remediation outcome", "Review status and issue count remain traceable in your account."],
              ["4", "Protected download", "Only the owning citizen session can retrieve the file."],
            ].map(([number, title, detail]) => <div key={number} style={{ display: "flex", gap: 11 }}><span style={{ display: "grid", width: 28, height: 28, flex: "0 0 28px", placeItems: "center", borderRadius: 9, background: "#e9f1fe", color: "#1769e0", fontSize: 10, fontWeight: 800 }}>{number}</span><div><strong style={{ display: "block", fontSize: 11 }}>{title}</strong><p style={{ margin: "3px 0 0", color: "var(--citizen-muted)", fontSize: 9, lineHeight: 1.5 }}>{detail}</p></div></div>)}
          </div>
        </PortalCard>
      </div>

      <PortalCard style={{ marginTop: 17 }}>
        <div className="portal-card-head"><div><h2>Submission history</h2><p>Account-scoped records with protected file downloads.</p></div><button className="citizen-button secondary" type="button" onClick={() => void load()} disabled={loading}><i className="fa-solid fa-rotate" /> Refresh</button></div>
        {payload?.data.length ? <div className="portal-table-wrap"><table className="portal-table"><thead><tr><th>Document</th><th>Size</th><th>Status</th><th>Issues</th><th>Submitted</th><th>Download</th></tr></thead><tbody>{payload.data.map((pdf) => <tr key={pdf.id}><td><div className="table-primary"><strong>{pdf.original_name}</strong><small>{pdf.id}</small></div></td><td>{formatBytes(pdf.size)}</td><td><StatusPill value={pdf.status} /></td><td>{pdf.issue_count ?? "Pending"}</td><td>{formatDate(pdf.created_at)}</td><td><div className="table-actions"><a href={pdf.download_url} title={`Download ${pdf.original_name}`}><i className="fa-solid fa-download" /></a></div></td></tr>)}</tbody></table></div> : <EmptyState icon="fa-solid fa-file-pdf" title="No PDF submissions" description="Validated PDF remediation records will appear here." />}
      </PortalCard>

      <Modal open={supportOpen} title="Request accessibility support" onClose={() => setSupportOpen(false)}>
        <form className="portal-modal-body" onSubmit={submitSupport}>
          <div className="citizen-form-grid"><div className="citizen-field"><label htmlFor="support-kind">Request type</label><select id="support-kind" value={support.kind} onChange={(event) => setSupport((value) => ({ ...value, kind: event.target.value }))}><option value="pdf-remediation">PDF remediation</option><option value="onboarding">Onboarding session</option><option value="support">Technical support</option></select></div><div className="citizen-field"><label htmlFor="support-date">Preferred time (optional)</label><input id="support-date" type="datetime-local" value={support.preferred_at} onChange={(event) => setSupport((value) => ({ ...value, preferred_at: event.target.value }))} /></div></div>
          <div className="citizen-field" style={{ marginTop: 15 }}><label htmlFor="support-subject">Subject</label><input id="support-subject" required minLength={3} maxLength={120} value={support.subject} onChange={(event) => setSupport((value) => ({ ...value, subject: event.target.value }))} /></div>
          <div className="citizen-field" style={{ marginTop: 15 }}><label htmlFor="support-message">What do you need help with?</label><textarea id="support-message" required minLength={10} maxLength={2000} value={support.message} onChange={(event) => setSupport((value) => ({ ...value, message: event.target.value }))} placeholder="Describe the document, current blockers, and desired outcome…" /></div>
          <div className="citizen-form-actions"><button className="citizen-button secondary" type="button" onClick={() => setSupportOpen(false)}>Cancel</button><button className="citizen-button primary" type="submit" disabled={supporting}>{supporting ? "Submitting…" : "Submit request"}</button></div>
        </form>
      </Modal>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}
