"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { useCitizenAuth } from "@/app/contexts/CitizenAuthContext";
import {
  InlineNotice,
  PageHeader,
  PortalCard,
  Toast,
} from "@/app/components/citizen/PortalUi";
import { fetchCitizen } from "@/app/lib/fetchCitizen";
import type { ApiEnvelope } from "@/app/lib/citizen/types";

type Country = { id: number; en_short_name?: string; num_code?: string; alpha_2_code?: string };
type ProfileUser = {
  id?: string;
  name?: string;
  email?: string;
  mobile?: string | null;
  ccode?: string | null;
  photo?: string | null;
  user_info?: { first_name?: string; middle_name?: string; last_name?: string };
  user_account_detail?: { api_key?: string | null };
  is_demo?: boolean;
};

export default function SettingsPage() {
  const { citizenUser, refreshUser } = useCitizenAuth();
  const current = citizenUser as ProfileUser | null;
  const [tab, setTab] = useState<"profile" | "security" | "api">("profile");
  const [countries, setCountries] = useState<Country[]>([]);
  const [profile, setProfile] = useState({ first_name: "", middle_name: "", last_name: "", email: "", ccode: "880", mobile: "", photo: "" });
  const [password, setPassword] = useState({ old_password: "", password: "", password_confirmation: "" });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(null);

  useEffect(() => {
    setProfile({
      first_name: current?.user_info?.first_name || current?.name?.split(" ")[0] || "",
      middle_name: current?.user_info?.middle_name || "",
      last_name: current?.user_info?.last_name || current?.name?.split(" ").slice(1).join(" ") || "",
      email: current?.email || "",
      ccode: current?.ccode || "880",
      mobile: current?.mobile || "",
      photo: current?.photo || "",
    });
  }, [current?.ccode, current?.email, current?.mobile, current?.name, current?.photo, current?.user_info?.first_name, current?.user_info?.last_name, current?.user_info?.middle_name]);

  useEffect(() => {
    void fetchCitizen<ApiEnvelope<Country[]>>("customer/reference/countries")
      .then((response) => setCountries(response.data))
      .catch(() => setCountries([]));
  }, []);

  const initials = useMemo(
    () => `${profile.first_name.slice(0, 1)}${profile.last_name.slice(0, 1)}`.toUpperCase() || "C",
    [profile.first_name, profile.last_name],
  );

  const choosePhoto = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 750_000) {
      setToast({ message: "Choose an image no larger than 750 KB.", tone: "error" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setProfile((value) => ({ ...value, photo: String(reader.result || "") }));
    reader.readAsDataURL(file);
  };

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    if (!current?.id) return;
    setSaving(true);
    try {
      const response = await fetchCitizen<ApiEnvelope<ProfileUser>>(
        `customer/account-information/${current.id}`,
        { method: "POST", body: profile },
      );
      await refreshUser();
      setToast({ message: response.message || "Profile saved.", tone: "success" });
    } catch (reason) {
      setToast({ message: reason instanceof Error ? reason.message : "Profile update failed.", tone: "error" });
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async (event: FormEvent) => {
    event.preventDefault();
    if (password.password !== password.password_confirmation) {
      setToast({ message: "New password confirmation does not match.", tone: "error" });
      return;
    }
    setSaving(true);
    try {
      const response = await fetchCitizen<ApiEnvelope<never>>("customer/update-password", { method: "POST", body: password });
      setPassword({ old_password: "", password: "", password_confirmation: "" });
      setToast({ message: response.message || "Password updated.", tone: "success" });
    } catch (reason) {
      setToast({ message: reason instanceof Error ? reason.message : "Password update failed.", tone: "error" });
    } finally {
      setSaving(false);
    }
  };

  const apiKey = current?.user_account_detail?.api_key || "Not provisioned";

  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="Account control"
        title="Account settings"
        description="Manage account-scoped profile data, update your password securely, and inspect the API key used by the accessibility widget."
      />

      <div className="portal-tabs" style={{ width: "fit-content", marginBottom: 17 }}>
        <button type="button" className={tab === "profile" ? "active" : ""} onClick={() => setTab("profile")}><i className="fa-regular fa-user" /> Profile</button>
        <button type="button" className={tab === "security" ? "active" : ""} onClick={() => setTab("security")}><i className="fa-solid fa-shield-halved" /> Security</button>
        <button type="button" className={tab === "api" ? "active" : ""} onClick={() => setTab("api")}><i className="fa-solid fa-key" /> API access</button>
      </div>

      {tab === "profile" && <div className="portal-grid dashboard-detail">
        <PortalCard>
          <div className="portal-card-head"><div><h2>Personal information</h2><p>Your email remains immutable in this profile workflow.</p></div></div>
          <form className="portal-card-body" onSubmit={saveProfile}>
            <div className="citizen-form-grid">
              <div className="citizen-field"><label htmlFor="first-name">First name</label><input id="first-name" required minLength={1} maxLength={80} value={profile.first_name} onChange={(event) => setProfile((value) => ({ ...value, first_name: event.target.value }))} disabled={current?.is_demo} /></div>
              <div className="citizen-field"><label htmlFor="middle-name">Middle name</label><input id="middle-name" maxLength={80} value={profile.middle_name} onChange={(event) => setProfile((value) => ({ ...value, middle_name: event.target.value }))} disabled={current?.is_demo} /></div>
              <div className="citizen-field"><label htmlFor="last-name">Last name</label><input id="last-name" required minLength={1} maxLength={80} value={profile.last_name} onChange={(event) => setProfile((value) => ({ ...value, last_name: event.target.value }))} disabled={current?.is_demo} /></div>
              <div className="citizen-field"><label htmlFor="profile-email">Email address</label><input id="profile-email" required type="email" value={profile.email} readOnly /></div>
              <div className="citizen-field"><label htmlFor="country-code">Country code</label>{countries.length ? <select id="country-code" value={profile.ccode} onChange={(event) => setProfile((value) => ({ ...value, ccode: event.target.value }))} disabled={current?.is_demo}>{countries.map((country) => <option key={country.id} value={country.num_code}>{country.en_short_name} (+{country.num_code})</option>)}</select> : <input id="country-code" pattern="\d{1,4}" value={profile.ccode} onChange={(event) => setProfile((value) => ({ ...value, ccode: event.target.value }))} disabled={current?.is_demo} />}</div>
              <div className="citizen-field"><label htmlFor="mobile">Mobile number</label><input id="mobile" maxLength={30} value={profile.mobile} onChange={(event) => setProfile((value) => ({ ...value, mobile: event.target.value }))} disabled={current?.is_demo} /></div>
            </div>
            {current?.is_demo && <div style={{ marginTop: 15 }}><InlineNotice tone="warning">Reviewer mode loads the real profile but intentionally blocks personal-data changes.</InlineNotice></div>}
            <div className="citizen-form-actions"><button className="citizen-button primary" type="submit" disabled={saving || current?.is_demo}>{saving ? "Saving…" : "Save account details"}</button></div>
          </form>
        </PortalCard>

        <PortalCard>
          <div className="portal-card-head"><div><h2>Profile image</h2><p>Validated and served by the protected asset pipeline.</p></div></div>
          <div className="portal-card-body" style={{ display: "grid", justifyItems: "center", gap: 15, textAlign: "center" }}>
            {profile.photo ? <span role="img" aria-label="Citizen profile preview" style={{ display: "block", width: 118, height: 118, backgroundImage: `url(${profile.photo})`, backgroundPosition: "center", backgroundSize: "cover", borderRadius: 28, border: "4px solid var(--citizen-card)", boxShadow: "0 12px 35px rgba(16,50,68,.18)" }} /> : <span style={{ display: "grid", width: 118, height: 118, placeItems: "center", borderRadius: 28, background: "linear-gradient(135deg,#1769e0,#20c7b7)", color: "white", fontSize: 33, fontWeight: 800 }}>{initials}</span>}
            <div><strong style={{ display: "block", fontSize: 14 }}>{profile.first_name} {profile.last_name}</strong><small style={{ color: "var(--citizen-muted)", fontSize: 9 }}>{profile.email}</small></div>
            <label className="citizen-button secondary" style={{ cursor: current?.is_demo ? "not-allowed" : "pointer", opacity: current?.is_demo ? .5 : 1 }}><i className="fa-solid fa-camera" /> Choose photo<input type="file" accept="image/*" hidden onChange={choosePhoto} disabled={current?.is_demo} /></label>
            <small style={{ color: "var(--citizen-muted)", fontSize: 9 }}>PNG, JPEG, WebP or GIF · maximum 750 KB</small>
          </div>
        </PortalCard>
      </div>}

      {tab === "security" && <PortalCard>
        <div className="portal-card-head"><div><h2>Change password</h2><p>The old password is verified with bcrypt before a new hash is stored.</p></div><i className="fa-solid fa-lock" style={{ color: "#1769e0" }} /></div>
        <form className="portal-card-body" onSubmit={savePassword} style={{ maxWidth: 760 }}>
          <div className="citizen-form-grid"><div className="citizen-field" style={{ gridColumn: "1 / -1" }}><label htmlFor="old-password">Current password</label><input id="old-password" required type="password" minLength={8} maxLength={128} autoComplete="current-password" value={password.old_password} onChange={(event) => setPassword((value) => ({ ...value, old_password: event.target.value }))} disabled={current?.is_demo} /></div><div className="citizen-field"><label htmlFor="new-password">New password</label><input id="new-password" required type="password" minLength={10} maxLength={128} autoComplete="new-password" value={password.password} onChange={(event) => setPassword((value) => ({ ...value, password: event.target.value }))} disabled={current?.is_demo} /><small>Use at least 10 characters and avoid reusing your current password.</small></div><div className="citizen-field"><label htmlFor="confirm-password">Confirm new password</label><input id="confirm-password" required type="password" minLength={10} maxLength={128} autoComplete="new-password" value={password.password_confirmation} onChange={(event) => setPassword((value) => ({ ...value, password_confirmation: event.target.value }))} disabled={current?.is_demo} /></div></div>
          {current?.is_demo && <div style={{ marginTop: 15 }}><InlineNotice tone="warning">Password changes are disabled in the shared reviewer account.</InlineNotice></div>}
          <div className="citizen-form-actions"><button className="citizen-button primary" type="submit" disabled={saving || current?.is_demo}>{saving ? "Updating…" : "Update password"}</button></div>
        </form>
      </PortalCard>}

      {tab === "api" && <div className="portal-grid two">
        <PortalCard><div className="portal-card-head"><div><h2>Widget API key</h2><p>Account-bound public integration identifier.</p></div><i className="fa-solid fa-key" style={{ color: "#d88b20" }} /></div><div className="portal-card-body" style={{ display: "grid", gap: 13 }}><div className="code-block"><button type="button" onClick={() => void navigator.clipboard.writeText(apiKey).then(() => setToast({ message: "API key copied.", tone: "success" }))}>Copy</button>{apiKey}</div><InlineNotice>Use this key only with the deployed widget. Authenticated customer APIs still require the secure citizen session.</InlineNotice></div></PortalCard>
        <PortalCard><div className="portal-card-head"><div><h2>Security posture</h2><p>Current browser/API boundaries.</p></div></div><div className="portal-card-body" style={{ display: "grid", gap: 11 }}>{["HttpOnly same-site session cookie","Server-only backend origin","Account-scoped database queries","Read-only public reviewer account","No token storage in localStorage"].map((item) => <div key={item} style={{ display: "flex", alignItems: "center", gap: 9, padding: 10, border: "1px solid var(--citizen-border)", borderRadius: 10, fontSize: 10 }}><i className="fa-solid fa-circle-check" style={{ color: "#23a77e" }} /><strong>{item}</strong></div>)}</div></PortalCard>
      </div>}
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}
