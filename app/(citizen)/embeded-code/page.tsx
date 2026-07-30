"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ErrorPanel,
  InlineNotice,
  LoadingPanel,
  PageHeader,
  PortalCard,
  Toast,
} from "@/app/components/citizen/PortalUi";
import { fetchCitizen } from "@/app/lib/fetchCitizen";
import type { ApiEnvelope } from "@/app/lib/citizen/types";

type EmbedConfig = {
  api_key: string | null;
  script_url: string;
  preview_url: string;
  embed_code: string;
  capabilities: string[];
};

export default function EmbedCodePage() {
  const [config, setConfig] = useState<EmbedConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetchCitizen<ApiEnvelope<EmbedConfig>>("customer/embed-config");
      setConfig(response.data);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Embed configuration is unavailable.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const copy = async (value: string, label: string) => {
    await navigator.clipboard.writeText(value);
    setToast(`${label} copied to clipboard.`);
  };

  if (loading) return <LoadingPanel label="Loading your live embed configuration…" />;
  if (error || !config) return <ErrorPanel message={error || "Embed configuration was empty."} retry={() => void load()} />;

  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="Production integration"
        title="Accessibility widget"
        description="Install one account-bound script to give visitors practical accessibility controls. The preview below executes the deployed NestJS widget—not a static mockup."
        actions={<button type="button" className="citizen-button primary" onClick={() => void copy(config.embed_code, "Embed code")}><i className="fa-regular fa-copy" /> Copy installation code</button>}
      />

      <div className="portal-grid dashboard-detail">
        <PortalCard>
          <div className="portal-card-head"><div><h2>Interactive live preview</h2><p>Isolated inside an iframe so its settings cannot alter this dashboard.</p></div><span className="portal-status positive"><span />Widget online</span></div>
          <div className="portal-card-body">
            <iframe
              title="Accessimate accessibility widget preview"
              src={config.preview_url}
              sandbox="allow-scripts allow-same-origin"
              style={{ width: "100%", minHeight: 430, border: "1px solid var(--citizen-border)", borderRadius: 14, background: "white" }}
            />
          </div>
        </PortalCard>

        <div style={{ display: "grid", gap: 17 }}>
          <PortalCard>
            <div className="portal-card-head"><div><h2>Included controls</h2><p>Keyboard-accessible and resettable.</p></div></div>
            <div className="portal-card-body" style={{ display: "grid", gap: 10 }}>
              {config.capabilities.map((capability, index) => <div key={capability} style={{ display: "flex", alignItems: "center", gap: 10, padding: 10, border: "1px solid var(--citizen-border)", borderRadius: 10, fontSize: 10 }}><span className={`metric-icon ${index % 2 ? "metric-violet" : "metric-green"}`} style={{ width: 33, height: 33, flexBasis: 33 }}><i className={index === 0 ? "fa-solid fa-text-height" : index === 1 ? "fa-solid fa-circle-half-stroke" : index === 2 ? "fa-solid fa-link" : "fa-regular fa-keyboard"} /></span><strong>{capability}</strong></div>)}
            </div>
          </PortalCard>
          <InlineNotice tone="success">The script is public for browser delivery, while account management and configuration remain protected behind the secure citizen session.</InlineNotice>
        </div>
      </div>

      <PortalCard style={{ marginTop: 17 }}>
        <div className="portal-card-head"><div><h2>Installation snippet</h2><p>Paste this once before the closing <code>&lt;/body&gt;</code> tag.</p></div></div>
        <div className="portal-card-body" style={{ display: "grid", gap: 14 }}>
          <div className="code-block"><button type="button" onClick={() => void copy(config.embed_code, "Embed code")}><i className="fa-regular fa-copy" /> Copy</button>{config.embed_code}</div>
          <div className="citizen-form-grid">
            <div className="citizen-field"><span>Script endpoint</span><div className="code-block" style={{ minHeight: 52, paddingRight: 70 }}><button type="button" onClick={() => void copy(config.script_url, "Script URL")}>Copy</button>{config.script_url}</div></div>
            <div className="citizen-field"><span>Account API key</span><div className="code-block" style={{ minHeight: 52, paddingRight: 70 }}><button type="button" onClick={() => void copy(config.api_key || "", "API key")}>Copy</button>{config.api_key || "Not provisioned"}</div></div>
          </div>
          <InlineNotice><strong>Framework-agnostic:</strong>&nbsp; the same script works with plain HTML, React, Next.js, Vue, Nuxt, Laravel, and server-rendered applications.</InlineNotice>
        </div>
      </PortalCard>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
