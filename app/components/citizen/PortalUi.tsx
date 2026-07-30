"use client";

import type { HTMLAttributes, ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <header className="citizen-page-header">
      <div>
        {eyebrow && <p className="citizen-eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actions && <div className="citizen-page-actions">{actions}</div>}
    </header>
  );
}

export function PortalCard({
  children,
  className = "",
  ...properties
}: { children: ReactNode } & HTMLAttributes<HTMLElement>) {
  return <section className={`portal-card ${className}`} {...properties}>{children}</section>;
}

export function MetricCard({
  icon,
  label,
  value,
  helper,
  tone = "blue",
}: {
  icon: string;
  label: string;
  value: string | number;
  helper: string;
  tone?: "blue" | "violet" | "green" | "orange";
}) {
  return (
    <PortalCard className="metric-card">
      <span className={`metric-icon metric-${tone}`} aria-hidden="true">
        <i className={icon} />
      </span>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <small>{helper}</small>
      </div>
    </PortalCard>
  );
}

export function LoadingPanel({ label = "Loading live data…" }: { label?: string }) {
  return (
    <div className="portal-state" role="status">
      <span className="portal-spinner" aria-hidden="true" />
      <strong>{label}</strong>
      <p>Securely requesting the latest data from the Accessimate API.</p>
    </div>
  );
}

export function ErrorPanel({
  message,
  retry,
}: {
  message: string;
  retry?: () => void;
}) {
  return (
    <div className="portal-state portal-state-error" role="alert">
      <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" />
      <strong>We could not load this workspace</strong>
      <p>{message}</p>
      {retry && (
        <button className="citizen-button secondary" type="button" onClick={retry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="portal-state">
      <i className={icon} aria-hidden="true" />
      <strong>{title}</strong>
      <p>{description}</p>
      {action}
    </div>
  );
}

export function StatusPill({ value }: { value: string }) {
  const normalized = value.toLowerCase().replaceAll("_", "-");
  const positive = ["active", "paid", "completed", "accessible", "passed"].includes(
    normalized,
  );
  const warning = ["trial", "pending", "submitted", "under-review"].includes(
    normalized,
  );
  return (
    <span
      className={`portal-status ${positive ? "positive" : warning ? "warning" : "negative"}`}
    >
      <span aria-hidden="true" />
      {value.replaceAll("_", " ")}
    </span>
  );
}

export function InlineNotice({
  children,
  tone = "info",
}: {
  children: ReactNode;
  tone?: "info" | "success" | "warning";
}) {
  return (
    <div className={`portal-notice ${tone}`}>
      <i
        className={`fa-solid ${tone === "success" ? "fa-circle-check" : tone === "warning" ? "fa-triangle-exclamation" : "fa-circle-info"}`}
        aria-hidden="true"
      />
      <div>{children}</div>
    </div>
  );
}

export function Modal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="portal-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="portal-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <h2>{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close dialog">
            <i className="fa-solid fa-xmark" />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}

export function Toast({
  message,
  tone = "success",
  onClose,
}: {
  message: string;
  tone?: "success" | "error";
  onClose: () => void;
}) {
  return (
    <div className={`portal-toast ${tone}`} role={tone === "error" ? "alert" : "status"}>
      <i className={`fa-solid ${tone === "success" ? "fa-circle-check" : "fa-circle-xmark"}`} />
      <span>{message}</span>
      <button type="button" onClick={onClose} aria-label="Dismiss notification">
        <i className="fa-solid fa-xmark" />
      </button>
    </div>
  );
}
