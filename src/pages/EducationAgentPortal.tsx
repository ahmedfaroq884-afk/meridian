import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { EducationAgent, EducationLead, EducationReferral, Language } from "../lib/types";
import { getAdminSession, getEducationAgentProfile, listMyEducationReferrals, signIn, signOut, supabaseEnabled } from "../lib/supabase";
import { t } from "../lib/i18n";

type AccessState = "loading" | "signedOut" | "unauthorized" | "ready";

const levelLabels: Record<EducationLead["study_level"], string> = {
  foundation: "educationLevelFoundation",
  diploma: "educationLevelDiploma",
  bachelors: "educationLevelBachelors",
  masters: "educationLevelMasters",
  doctoral: "educationLevelDoctoral",
};

const statusLabels: Record<EducationReferral["application_status"], string> = {
  assigned: "educationReferralAssigned",
  "application-in-progress": "educationReferralInProgress",
  "offer-received": "educationReferralOffer",
  enrolled: "educationReferralEnrolled",
  declined: "educationReferralDeclined",
  withdrawn: "educationReferralWithdrawn",
  completed: "educationReferralCompleted",
};

export function EducationAgentPortal({ language }: { language: Language }) {
  const [access, setAccess] = useState<AccessState>("loading");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agent, setAgent] = useState<EducationAgent | null>(null);
  const [leads, setLeads] = useState<EducationLead[]>([]);
  const [referrals, setReferrals] = useState<EducationReferral[]>([]);
  const [error, setError] = useState("");

  const verifyAccess = useCallback(async () => {
    setAccess("loading");
    setError("");
    try {
      const session = await getAdminSession();
      if (!session) {
        setAgent(null);
        setAccess("signedOut");
        return;
      }
      const currentAgent = await getEducationAgentProfile();
      if (!currentAgent?.is_active) {
        setAgent(null);
        setAccess("unauthorized");
        return;
      }
      const assigned = await listMyEducationReferrals();
      setAgent(currentAgent);
      setLeads(assigned.leads);
      setReferrals(assigned.referrals);
      setAccess("ready");
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : "Unable to verify this account.");
      setAccess("signedOut");
    }
  }, []);

  useEffect(() => { void verifyAccess(); }, [verifyAccess]);

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (!supabaseEnabled()) {
      setError(t(language, "educationNotConfigured"));
      return;
    }
    try {
      await signIn(email, password);
      await verifyAccess();
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Sign-in failed.");
      setAccess("signedOut");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      setAgent(null);
      setLeads([]);
      setReferrals([]);
      setAccess("signedOut");
    } catch (logoutError) {
      setError(logoutError instanceof Error ? logoutError.message : "Unable to end this session.");
    }
  };

  if (access === "loading") {
    return <main className="education-agent-page container"><p role="status">Checking access…</p></main>;
  }

  if (access === "signedOut") {
    return <main className="education-agent-page container">
      <form className="login-card" onSubmit={(event) => void handleLogin(event)}>
        <span className="eyebrow">{t(language, "educationAgentConsole")}</span>
        <h1>{t(language, "educationAgentLogin")}</h1>
        <p>Access is limited to active agent accounts configured by Meridian Malaysia.</p>
        {!supabaseEnabled() && <div className="config-notice" role="status">{t(language, "educationNotConfigured")}</div>}
        <div className="field"><label htmlFor="education-agent-email">{t(language, "educationEmail")}</label><input id="education-agent-email" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} /></div>
        <div className="field"><label htmlFor="education-agent-password">Password</label><input id="education-agent-password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} /></div>
        {error && <div className="form-message" role="alert">{error}</div>}
        <button className="button" type="submit" disabled={!supabaseEnabled()}>Sign in</button>
        <a className="button-text" href="/">{t(language, "returnHome")}</a>
      </form>
    </main>;
  }

  if (access === "unauthorized") {
    return <main className="education-agent-page container">
      <section className="login-card" role="alert">
        <span className="eyebrow">{t(language, "educationAgentConsole")}</span>
        <h1>{t(language, "educationAgentUnauthorized")}</h1>
        <p>Only confirmed accounts listed as active education agents may view assigned referrals.</p>
        {error && <p className="form-message">{error}</p>}
        <button className="button button-outline" onClick={() => void handleLogout()}>Sign out</button>
        <a className="button-text" href="/">{t(language, "returnHome")}</a>
      </section>
    </main>;
  }

  const leadById = new Map(leads.map((lead) => [lead.id, lead]));
  return <main className="education-agent-page container">
    <header className="admin-heading">
      <div><span className="eyebrow">PRIVATE REFERRAL ACCESS</span><h1>{agent?.display_name}</h1><p>{agent?.email}</p></div>
      <button className="button button-outline small-button" onClick={() => void handleLogout()}>Sign out</button>
    </header>
    {!referrals.length ? <div className="empty-state"><h2>{t(language, "educationAgentEmpty")}</h2></div> :
      <div className="education-agent-referrals">{referrals.map((referral) => {
        const lead = leadById.get(referral.student_lead_id);
        if (!lead) return null;
        return <article className="admin-panel education-agent-referral" key={referral.id}>
          <div className="panel-head"><h2>{lead.full_name}</h2><span className="badge">{t(language, statusLabels[referral.application_status])}</span></div>
          <div className="panel-body education-agent-details">
            <a href={`mailto:${encodeURIComponent(lead.email)}`}>{lead.email}</a>
            {lead.phone_number && <a href={`tel:${encodeURIComponent(lead.phone_number)}`}>{lead.phone_number}</a>}
            <span>{lead.current_country}</span>
            <span>{t(language, levelLabels[lead.study_level])} · {lead.intended_subject}</span>
            {lead.university_preference && <span>{lead.university_preference}</span>}
            {lead.intake && <span>{lead.intake}</span>}
            <span>{lead.highest_qualification}</span>
            {lead.additional_message && <p>{lead.additional_message}</p>}
          </div>
        </article>;
      })}</div>}
  </main>;
}
