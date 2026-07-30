"use client";

import { useCallback, useEffect, useState } from "react";
import {
  EmptyState,
  ErrorPanel,
  InlineNotice,
  LoadingPanel,
  PageHeader,
  PortalCard,
  StatusPill,
} from "@/app/components/citizen/PortalUi";
import { fetchCitizen } from "@/app/lib/fetchCitizen";
import type { ApiEnvelope, Invoice, Payment, Subscription } from "@/app/lib/citizen/types";
import { formatDate, formatMoney } from "@/app/lib/citizen/types";

export default function BillingPaymentsPage() {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [invoiceResponse, subscriptionResponse, paymentResponse] = await Promise.all([
        fetchCitizen<ApiEnvelope<Invoice | null>>("customer/billing/invoices"),
        fetchCitizen<ApiEnvelope<Subscription | null>>("customer/subscriptions/my-subscriptions"),
        fetchCitizen<ApiEnvelope<Payment[]>>("customer/payment-transactions/my-transactions"),
      ]);
      setInvoice(invoiceResponse.data);
      setSubscription(subscriptionResponse.data);
      setPayments(paymentResponse.data);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Billing details are unavailable.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <LoadingPanel label="Loading persisted billing details…" />;
  if (error) return <ErrorPanel message={error} retry={() => void load()} />;

  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="Subscription ledger"
        title="Billing & payments"
        description="Review your active entitlement, invoice status, renewal schedule, and payment records from one account-scoped ledger."
        actions={<button className="citizen-button secondary" type="button" onClick={() => window.print()}><i className="fa-solid fa-print" /> Print billing summary</button>}
      />

      {subscription ? (
        <div className="portal-grid dashboard-detail">
          <PortalCard>
            <div className="portal-card-head"><div><h2>Current subscription</h2><p>Access entitlement currently attached to your account.</p></div><StatusPill value={subscription.status} /></div>
            <div className="portal-card-body" style={{ display: "grid", gap: 20 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
                <div><p style={{ margin: 0, color: "var(--citizen-blue)", fontSize: 9, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase" }}>Professional access</p><h3 style={{ margin: "5px 0", fontSize: 24 }}>{subscription.plan.name}</h3><p style={{ maxWidth: 530, margin: 0, color: "var(--citizen-muted)", fontSize: 10, lineHeight: 1.65 }}>{subscription.plan.description}</p></div>
                <div style={{ textAlign: "right" }}><strong style={{ display: "block", fontSize: 29 }}>{formatMoney(subscription.amount, subscription.currency)}</strong><small style={{ color: "var(--citizen-muted)", fontSize: 10 }}>per {subscription.subscription_type}</small></div>
              </div>
              <div className="portal-grid two">
                <div className="portal-notice success"><i className="fa-solid fa-calendar-check" /><div><span>Subscription started</span><br /><strong>{formatDate(subscription.start_date)}</strong></div></div>
                <div className="portal-notice"><i className="fa-solid fa-rotate" /><div><span>Next billing date</span><br /><strong>{formatDate(subscription.next_billing_date)}</strong></div></div>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 15, padding: 13, border: "1px solid var(--citizen-border)", borderRadius: 11 }}><div><strong style={{ display: "block", fontSize: 11 }}>Automatic renewal</strong><small style={{ color: "var(--citizen-muted)", fontSize: 9 }}>Entitlement remains active while billing succeeds.</small></div><StatusPill value={subscription.auto_renew ? "active" : "disabled"} /></div>
            </div>
          </PortalCard>

          <PortalCard>
            <div className="portal-card-head"><div><h2>Latest invoice</h2><p>Most recent generated billing record.</p></div>{invoice && <StatusPill value={invoice.status} />}</div>
            {invoice ? <div className="portal-card-body" style={{ display: "grid", gap: 15 }}>
              <div style={{ padding: 18, borderRadius: 14, background: "linear-gradient(135deg,#071f2f,#154f67)", color: "white" }}><small style={{ color: "#9fc1cf", fontSize: 9 }}>AMOUNT BILLED</small><strong style={{ display: "block", marginTop: 4, fontSize: 29 }}>{formatMoney(invoice.bill_amount, invoice.currency)}</strong><span style={{ display: "block", marginTop: 13, color: "#a9c7d4", fontSize: 9 }}>Invoice {invoice.id.slice(0, 12).toUpperCase()}</span></div>
              {[ ["Bill date",formatDate(invoice.bill_date)],["Payment due",formatDate(invoice.payment_due_date)],["Billing cycle",invoice.subscription.subscription_type],["Plan",invoice.subscription.plan_id] ].map(([label,value]) => <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 10, paddingBottom: 9, borderBottom: "1px solid var(--citizen-border)", fontSize: 10 }}><span style={{ color: "var(--citizen-muted)" }}>{label}</span><strong style={{ textTransform: "capitalize", textAlign: "right" }}>{value}</strong></div>)}
            </div> : <EmptyState icon="fa-regular fa-file-lines" title="No invoice available" description="The next generated invoice will appear here." />}
          </PortalCard>
        </div>
      ) : <PortalCard><EmptyState icon="fa-solid fa-layer-group" title="No subscription found" description="No subscription entitlement is currently attached to this account." /></PortalCard>}

      <div style={{ marginTop: 17 }}><InlineNotice>This portfolio deployment reads genuine persisted billing state but does not present a fake checkout. Production payment capture would require the client&apos;s Stripe keys, products, tax rules, webhook signing secret, and approved billing policy.</InlineNotice></div>

      <PortalCard style={{ marginTop: 17 }}>
        <div className="portal-card-head"><div><h2>Payment history</h2><p>Gateway references and statuses saved by the backend.</p></div><button className="citizen-button secondary" type="button" onClick={() => void load()}><i className="fa-solid fa-rotate" /> Refresh ledger</button></div>
        {payments.length ? <div className="portal-table-wrap"><table className="portal-table"><thead><tr><th>Transaction</th><th>Gateway</th><th>Plan</th><th>Amount</th><th>Status</th><th>Processed</th></tr></thead><tbody>{payments.map((payment) => <tr key={payment.id}><td><div className="table-primary"><strong>{payment.payment_intent_id}</strong><small>{payment.id}</small></div></td><td>{payment.gateway}</td><td>{String(payment.metadata.plan_name ?? "Subscription")}</td><td><strong>{formatMoney(payment.amount,payment.currency)}</strong></td><td><StatusPill value={payment.status} /></td><td>{formatDate(payment.created_at)}</td></tr>)}</tbody></table></div> : <EmptyState icon="fa-regular fa-credit-card" title="No payment history" description="Completed or failed payment records will be listed here." />}
      </PortalCard>
    </div>
  );
}
