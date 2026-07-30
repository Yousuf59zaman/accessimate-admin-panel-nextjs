"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCitizenAuth } from "@/app/contexts/CitizenAuthContext";
import { fetchCitizen } from "@/app/lib/fetchCitizen";
import type { ApiEnvelope, Notification } from "@/app/lib/citizen/types";
import { formatDate } from "@/app/lib/citizen/types";

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: "fa-solid fa-grid-2" },
  { href: "/audit", label: "Audit", icon: "fa-solid fa-magnifying-glass-chart" },
  { href: "/accessibility", label: "Accessibility", icon: "fa-solid fa-universal-access" },
  { href: "/embeded-code", label: "Embed code", icon: "fa-solid fa-code" },
  { href: "/developer-resourse", label: "Developer resources", icon: "fa-solid fa-terminal" },
  { href: "/document-pdf", label: "Documents & PDFs", icon: "fa-solid fa-file-pdf" },
  { href: "/billing-payments", label: "Billing & payments", icon: "fa-solid fa-credit-card" },
  { href: "/settings", label: "Account settings", icon: "fa-solid fa-gear" },
] as const;

const isActivePath = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(`${href}/`);

export default function CitizenShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { citizenUser, isLoading, logout } = useCitizenAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const notificationRef = useRef<HTMLDivElement>(null);

  const title = useMemo(
    () => navigation.find((item) => isActivePath(pathname, item.href))?.label ?? "Citizen portal",
    [pathname],
  );

  useEffect(() => {
    if (!citizenUser) return;
    let active = true;
    void fetchCitizen<ApiEnvelope<Notification[]>>("customer/notifications")
      .then((response) => {
        if (active) setNotifications(response.data);
      })
      .catch(() => {
        if (active) setNotifications([]);
      });
    return () => {
      active = false;
    };
  }, [citizenUser]);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!notificationRef.current?.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div className={`citizen-shell ${collapsed ? "sidebar-collapsed" : ""}`}>
      <button
        className={`citizen-overlay ${mobileOpen ? "visible" : ""}`}
        type="button"
        aria-label="Close navigation"
        onClick={() => setMobileOpen(false)}
      />
      <aside className={`citizen-sidebar ${mobileOpen ? "mobile-open" : ""}`}>
        <div className="citizen-brand-row">
          <Link href="/dashboard" className="citizen-brand" aria-label="Accessimate dashboard">
            <span className="citizen-brand-mark" aria-hidden="true">
              <i className="fa-solid fa-universal-access" />
            </span>
            <span className="citizen-brand-copy">
              <strong>AccessiMate</strong>
              <small>Citizen control center</small>
            </span>
          </Link>
          <button
            className="citizen-sidebar-close"
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <p className="citizen-nav-label">Workspace</p>
        <nav className="citizen-nav" aria-label="Citizen workspace">
          {navigation.slice(0, 6).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={isActivePath(pathname, item.href) ? "active" : ""}
              title={collapsed ? item.label : undefined}
              onClick={() => setMobileOpen(false)}
            >
              <i className={item.icon} aria-hidden="true" />
              <span>{item.label}</span>
              {item.href === "/audit" && <small>Live</small>}
            </Link>
          ))}
        </nav>

        <p className="citizen-nav-label citizen-nav-secondary">Account</p>
        <nav className="citizen-nav" aria-label="Account workspace">
          {navigation.slice(6).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={isActivePath(pathname, item.href) ? "active" : ""}
              title={collapsed ? item.label : undefined}
              onClick={() => setMobileOpen(false)}
            >
              <i className={item.icon} aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="citizen-sidebar-foot">
          <div className="citizen-help-card">
            <i className="fa-regular fa-life-ring" aria-hidden="true" />
            <div>
              <strong>Need help?</strong>
              <span>Send a support request from Documents.</span>
            </div>
          </div>
          <button
            className="citizen-collapse"
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <i className={`fa-solid ${collapsed ? "fa-angles-right" : "fa-angles-left"}`} />
            <span>{collapsed ? "Expand" : "Collapse sidebar"}</span>
          </button>
        </div>
      </aside>

      <div className="citizen-main">
        <header className="citizen-topbar">
          <div className="citizen-topbar-title">
            <button
              className="citizen-mobile-menu"
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
            >
              <i className="fa-solid fa-bars" />
            </button>
            <div>
              <small>Citizen portal</small>
              <strong>{title}</strong>
            </div>
          </div>
          <div className="citizen-topbar-actions">
            {citizenUser?.is_demo && (
              <span className="citizen-reviewer-chip">
                <i className="fa-solid fa-shield-halved" /> Reviewer mode
              </span>
            )}
            <button
              type="button"
              className="citizen-icon-button"
              aria-label="Toggle color theme"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            >
              <i className={`fa-solid ${resolvedTheme === "dark" ? "fa-sun" : "fa-moon"}`} />
            </button>
            <div className="citizen-notifications" ref={notificationRef}>
              <button
                type="button"
                className="citizen-icon-button"
                aria-label="Open notifications"
                aria-expanded={notificationsOpen}
                onClick={() => setNotificationsOpen((value) => !value)}
              >
                <i className="fa-regular fa-bell" />
                {notifications.length > 0 && <span>{notifications.length}</span>}
              </button>
              {notificationsOpen && (
                <section className="notification-panel">
                  <header>
                    <div>
                      <strong>Activity</strong>
                      <small>From your persisted workspace</small>
                    </div>
                    <span>{notifications.length}</span>
                  </header>
                  {notifications.length ? (
                    notifications.map((item) => (
                      <div className="notification-item" key={item.id}>
                        <i
                          className={`fa-solid ${item.type === "audit" ? "fa-magnifying-glass-chart" : item.type === "billing" ? "fa-receipt" : "fa-file-pdf"}`}
                        />
                        <div>
                          <strong>{item.title}</strong>
                          <small>{formatDate(item.created_at)}</small>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="notification-empty">No recent workspace activity.</p>
                  )}
                </section>
              )}
            </div>
            <div className="citizen-user-summary">
              <span>{citizenUser?.name?.slice(0, 1).toUpperCase() || "C"}</span>
              <div>
                <strong>{isLoading ? "Loading…" : citizenUser?.name || "Citizen"}</strong>
                <small>{citizenUser?.email || "Secure account"}</small>
              </div>
            </div>
            <button className="citizen-logout" type="button" onClick={() => void logout()}>
              <i className="fa-solid fa-arrow-right-from-bracket" />
              <span>Sign out</span>
            </button>
          </div>
        </header>
        {citizenUser?.is_demo && (
          <div className="citizen-demo-banner">
            <i className="fa-solid fa-eye" aria-hidden="true" />
            <span>
              You are exploring a live read-only reviewer workspace backed by NestJS and PostgreSQL.
            </span>
          </div>
        )}
        <main className="citizen-content">{children}</main>
      </div>
    </div>
  );
}
