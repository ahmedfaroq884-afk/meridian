import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import type { AnalyticsEvent, ContentRecord, EducationAgent, EducationCommissionAgreement, EducationLead, EducationAgentConsent, EducationReferral, Lead, SiteSetting, ThemeChoice } from "../lib/types";
import { assignEducationLead, checkAdminAccess, createEducationAgent, createEducationAgreement, exportSnapshot, getAdminSession, listAnalytics, listEducationAgents, listEducationAgreements, listEducationAgentConsents, listEducationLeads, listEducationReferrals, listLeads, listSettings, listSiteContent, revokeEducationAgentConsent, saveContent, saveLead, saveSetting, signIn, signOut, supabaseEnabled, updateEducationReferral } from "../lib/supabase";
import { t } from "../lib/i18n";
import type { Language } from "../lib/types";
import { EducationAdminSection } from "./EducationAdminSection";

type AuthState = "loading" | "signedOut" | "unauthorized" | "ready";
type Section = "overview" | "leads" | "education" | "content" | "seo" | "performance" | "analytics" | "utilities" | "settings" | "theme";
const sections: { id: Section; label: string; icon: string }[] = [
  { id: "overview", label: "Overview", icon: "01" }, { id: "leads", label: "Leads", icon: "02" },
  { id: "education", label: "Education referrals", icon: "03" }, { id: "content", label: "Content", icon: "04" }, { id: "seo", label: "SEO", icon: "05" },
  { id: "performance", label: "Performance", icon: "06" }, { id: "analytics", label: "Analytics", icon: "07" },
  { id: "utilities", label: "System utilities", icon: "08" }, { id: "settings", label: "Settings", icon: "09" },
  { id: "theme", label: "Theme preview", icon: "10" },
];
const statuses: Lead["status"][] = ["new", "contacted", "qualified", "processing", "completed", "closed"];
const priorities: Lead["priority"][] = ["high", "standard", "completed"];
const pretty = (value: string) => value.replace(/_/g, " ").replace(/-/g, " ").replace(/\b\w/g, (match) => match.toUpperCase());
const when = (date: string) => new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(date));

function BrandMark() {
  return <span className="brand" aria-label="Meridian Malaysia"><span className="brand-mark" aria-hidden="true"><svg viewBox="0 0 36 40" fill="none"><path d="M3 34V6l15 14L33 6v28" stroke="currentColor" strokeWidth="1.6"/><path d="M9 34V20l9 8 9-8v14" stroke="currentColor"/></svg></span><span className="brand-copy"><span className="brand-name">MERIDIAN</span><span className="brand-caption">Secure workspace</span></span></span>;
}

function LoadingState() {
  return <div className="admin-content"><div className="skeleton skeleton-line" style={{ width: "230px", height: 28 }}/><div className="stat-grid">{[1, 2, 3, 4].map((n) => <div className="skeleton skeleton-block" key={n}/>)}</div><div className="skeleton skeleton-block" style={{ height: 270 }}/></div>;
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return <div className="empty-state"><div className="empty-state-mark" aria-hidden="true">—</div><h3>{title}</h3><p>{body}</p></div>;
}

function ErrorState({ message, retry }: { message: string; retry?: () => void }) {
  return <div className="error-state" role="alert"><strong>Something could not be loaded.</strong><br/>{message}{retry && <div><button className="button small-button" onClick={retry}>Try again</button></div>}</div>;
}

function downloadFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url; anchor.download = filename; anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function csvEscape(value: unknown) {
  let text = value == null ? "" : typeof value === "boolean" ? String(value) : String(value);
  if (/^[\s]*[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

interface AdminProps { language: Language; theme: ThemeChoice; setTheme: (theme: ThemeChoice) => void }
export function AdminConsole({ language, theme, setTheme }: AdminProps) {
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [authError, setAuthError] = useState("");
  const [section, setSection] = useState<Section>("overview");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [content, setContent] = useState<ContentRecord[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsEvent[]>([]);
  const [settings, setSettings] = useState<SiteSetting[]>([]);
  const [educationLeads, setEducationLeads] = useState<EducationLead[]>([]);
  const [educationAgents, setEducationAgents] = useState<EducationAgent[]>([]);
  const [educationAgreements, setEducationAgreements] = useState<EducationCommissionAgreement[]>([]);
  const [educationConsents, setEducationConsents] = useState<EducationAgentConsent[]>([]);
  const [educationReferrals, setEducationReferrals] = useState<EducationReferral[]>([]);
  const [educationError, setEducationError] = useState("");
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(0);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [leadSaveError, setLeadSaveError] = useState("");
  const [contentRecordId, setContentRecordId] = useState("");
  const [contentDraft, setContentDraft] = useState("");
  const [contentSaved, setContentSaved] = useState(false);
  const [contentError, setContentError] = useState("");
  const [editingSetting, setEditingSetting] = useState<string | null>(null);
  const [settingDraft, setSettingDraft] = useState("");
  const [settingError, setSettingError] = useState("");
  const [snapshotReady, setSnapshotReady] = useState(false);
  const [snapshotError, setSnapshotError] = useState("");
  const pageSize = 10;

  const loadData = useCallback(async () => {
    setDataLoading(true); setDataError("");
    try {
      const [leadRows, contentRows, analyticsRows, settingRows] = await Promise.all([listLeads(), listSiteContent(), listAnalytics(), listSettings()]);
      setLeads(leadRows); setContent(contentRows); setContentRecordId((current) => current || contentRows[0]?.id || ""); setAnalytics(analyticsRows); setSettings(settingRows);
      try {
        const [studentRows, agentRows, agreementRows, consentRows, referralRows] = await Promise.all([
          listEducationLeads(), listEducationAgents(), listEducationAgreements(), listEducationAgentConsents(), listEducationReferrals(),
        ]);
        setEducationLeads(studentRows); setEducationAgents(agentRows); setEducationAgreements(agreementRows);
        setEducationConsents(consentRows); setEducationReferrals(referralRows); setEducationError("");
      } catch (educationLoadError) {
        setEducationError(educationLoadError instanceof Error ? educationLoadError.message : "Education referral records are unavailable.");
      }
    } catch (error) {
      setDataError(error instanceof Error ? error.message : "The secure data service did not respond.");
    } finally { setDataLoading(false); }
  }, []);

  const verifySession = useCallback(async () => {
    setAuthState("loading"); setAuthError("");
    try {
      const session = await getAdminSession();
      if (!session) { setAdminEmail(""); setAuthState("signedOut"); return; }
      setAdminEmail(session.email);
      const allowed = await checkAdminAccess();
      if (!allowed) { setAuthState("unauthorized"); return; }
      setAuthState("ready");
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Unable to verify this session.");
      setAuthState("signedOut");
    }
  }, []);

  useEffect(() => { void verifySession(); }, [verifySession]);
  useEffect(() => { if (authState === "ready") void loadData(); }, [authState, loadData]);
  useEffect(() => {
    const record = content.find((item) => item.id === contentRecordId);
    if (record) { setContentDraft(record.content_value); setContentSaved(false); setContentError(""); }
  }, [contentRecordId]);

  const filteredLeads = useMemo(() => {
    const q = query.toLowerCase().trim();
    return leads.filter((lead) => (statusFilter === "all" || lead.status === statusFilter) &&
      (!q || [lead.full_name, lead.email, lead.country, lead.nationality, lead.service_interest, lead.id].some((field) => String(field ?? "").toLowerCase().includes(q))))
      .sort((a, b) => sort === "oldest" ? Date.parse(a.created_at) - Date.parse(b.created_at) : Date.parse(b.created_at) - Date.parse(a.created_at));
  }, [leads, query, sort, statusFilter]);
  const pageCount = Math.max(1, Math.ceil(filteredLeads.length / pageSize));
  const visibleLeads = filteredLeads.slice(page * pageSize, (page + 1) * pageSize);
  const currentRecord = content.find((item) => item.id === contentRecordId) ?? content[0];
  const navPerformance = useMemo(() => {
    const timing = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    if (!timing) return null;
    const resources = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
    const transferBytes = resources.reduce((sum, entry) => sum + entry.transferSize, 0);
    return {
      dom: Math.max(0, Math.round(timing.domContentLoadedEventEnd - timing.startTime)),
      load: Math.max(0, Math.round(timing.loadEventEnd - timing.startTime)),
      resourceCount: resources.length,
      resourceDuration: Math.round(resources.reduce((sum, entry) => sum + entry.duration, 0)),
      transferBytes: transferBytes > 0 ? transferBytes : null,
    };
  }, []);

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault(); setAuthError("");
    if (!supabaseEnabled()) { setAuthError("Secure authentication is not configured for this deployment."); return; }
    try {
      await signIn(email, password);
      const session = await getAdminSession();
      if (!session) { setAuthState("signedOut"); setAuthError("Authentication returned without an active session."); return; }
      setAdminEmail(session.email);
      if (!(await checkAdminAccess())) { setAuthState("unauthorized"); return; }
      setAuthState("ready");
    } catch (error) { setAuthError(error instanceof Error ? error.message : "Sign in failed. Check your credentials and try again."); }
  };
  const handleLogout = async () => {
    try { await signOut(); setAdminEmail(""); setAuthState("signedOut"); setLeads([]); setContent([]); setAnalytics([]); setSettings([]); setEducationLeads([]); setEducationAgents([]); setEducationAgreements([]); setEducationConsents([]); setEducationReferrals([]); }
    catch (error) { setAuthError(error instanceof Error ? error.message : "Unable to end this session."); }
  };

  const updateLeadField = async (lead: Lead, field: "status" | "priority", value: Lead["status"] | Lead["priority"]) => {
    setLeadSaveError("");
    const prior = lead[field];
    setLeads((items) => items.map((item) => item.id === lead.id ? { ...item, [field]: value } : item));
    setSelectedLead((current) => current?.id === lead.id ? { ...current, [field]: value } : current);
    try { await saveLead(lead.id, { [field]: value }); }
    catch (error) {
      setLeads((items) => items.map((item) => item.id === lead.id ? { ...item, [field]: prior } : item));
      setSelectedLead((current) => current?.id === lead.id ? { ...current, [field]: prior } : current);
      setLeadSaveError(error instanceof Error ? error.message : "Unable to save lead changes.");
    }
  };

  const exportLeads = () => {
    const rows: (keyof Lead)[] = ["id", "created_at", "updated_at", "full_name", "email", "country", "nationality", "phone_country_code", "phone_number", "service_interest", "business_stage", "business_type", "has_existing_company", "company_country", "estimated_budget", "timeline", "visa_interest", "banking_interest", "contact_preference", "message", "priority", "status", "source", "language", "timezone", "utm_source", "utm_medium", "utm_campaign"];
    const csv = [rows.join(","), ...filteredLeads.map((lead) => rows.map((key) => csvEscape(lead[key])).join(","))].join("\r\n");
    downloadFile(`meridian-leads-${new Date().toISOString().slice(0, 10)}.csv`, csv, "text/csv;charset=utf-8");
  };

  const addEducationAgent = async (input: Pick<EducationAgent, "email" | "display_name">) => {
    const agent = await createEducationAgent(input);
    setEducationAgents((items) => [...items, agent].sort((a, b) => a.display_name.localeCompare(b.display_name)));
  };

  const addEducationAgreement = async (input: Omit<EducationCommissionAgreement, "id" | "created_at" | "is_active">) => {
    const agreement = await createEducationAgreement(input);
    setEducationAgreements((items) => [agreement, ...items]);
  };

  const assignStudentToAgent = async (input: {
    studentLeadId: string; agentId: string; agreementId: string; consentedAt: string;
    consentMethod: EducationAgentConsent["consent_method"]; evidenceReference: string; commissionBaseAmount: number;
  }) => {
    await assignEducationLead(input);
    const [consents, referrals] = await Promise.all([listEducationAgentConsents(), listEducationReferrals()]);
    setEducationConsents(consents);
    setEducationReferrals(referrals);
  };

  const saveEducationReferral = async (id: string, changes: Pick<EducationReferral, "application_status" | "actual_received_amount" | "commission_base_amount" | "payment_status" | "payment_note">) => {
    await updateEducationReferral(id, changes);
    setEducationReferrals(await listEducationReferrals());
  };

  const revokeStudentAgentAccess = async (studentLeadId: string, agentId: string) => {
    await revokeEducationAgentConsent(studentLeadId, agentId);
    setEducationConsents(await listEducationAgentConsents());
  };

  const saveContentDraft = async () => {
    setContentError(""); setContentSaved(false);
    if (!currentRecord) return;
    if (!contentDraft.trim()) { setContentError("Content cannot be empty."); return; }
    if (contentDraft.length > 20000) { setContentError("Content must be 20,000 characters or fewer."); return; }
    try {
      await saveContent(currentRecord.id, contentDraft);
      setContent((items) => items.map((record) => record.id === currentRecord.id ? { ...record, content_value: contentDraft, updated_at: new Date().toISOString() } : record));
      setContentSaved(true);
    } catch (error) { setContentError(error instanceof Error ? error.message : "Unable to save content."); }
  };

  const saveSettingDraft = async (setting: SiteSetting) => {
    setSettingError("");
    let value: unknown = settingDraft;
    try { value = JSON.parse(settingDraft); } catch { /* plain text settings remain strings */ }
    try {
      await saveSetting(setting.id, value, setting.is_public);
      setSettings((items) => items.map((item) => item.id === setting.id ? { ...item, setting_value: value, updated_at: new Date().toISOString() } : item));
      setEditingSetting(null);
    } catch (error) { setSettingError(error instanceof Error ? error.message : "Unable to save this setting."); }
  };

  const prepareSnapshot = async () => {
    setSnapshotReady(false); setSnapshotError("");
    try {
      const snapshot = await exportSnapshot();
      downloadFile(`meridian-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(snapshot, null, 2), "application/json");
      setSnapshotReady(true);
    } catch (error) { setSnapshotError(error instanceof Error ? error.message : "Unable to create a backup."); }
  };

  if (authState === "loading") return <div className="admin-layout"><aside className="admin-sidebar"><BrandMark/></aside><main className="admin-main"><LoadingState/></main></div>;

  if (authState === "signedOut") return <div className="admin-login-wrap">
    <aside className="admin-login-aside"><a href="/"><BrandMark/></a><div><span className="eyebrow" style={{ color: "hsl(var(--gold))" }}>CONTROLLED ACCESS</span><h1>Good work starts with good boundaries.</h1><p>This private workspace is available only to authorised Meridian Malaysia administrators. Access is governed by secure authentication and database policy.</p></div><small className="mono muted" style={{ color: "hsl(42 18% 66%)" }}>PRIVATE ADMINISTRATION · RLS ENFORCED</small></aside>
    <div className="login-form-side"><form className="login-card" onSubmit={handleLogin}><span className="eyebrow">MERIDIAN · ADMIN CONSOLE</span><h2>Sign in</h2><p>Use your authorised administrator account. There is no public registration path.</p>
      <div className="field"><label htmlFor="admin-email">Email address</label><input id="admin-email" required type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)}/></div>
      <div className="field"><label htmlFor="admin-password">Password</label><input id="admin-password" required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)}/></div>
      {authError && <div className="form-message" role="alert">{authError}</div>}
      <button className="button" type="submit">Continue securely <span className="arrow">→</span></button>
      <a className="button-text" href="/" style={{ display: "inline-block", marginTop: 16 }}>Return to public site</a>
    </form></div>
  </div>;

  if (authState === "unauthorized") return <div className="admin-login-wrap">
    <aside className="admin-login-aside"><a href="/"><BrandMark/></a><div><span className="eyebrow" style={{ color: "hsl(var(--gold))" }}>ACCESS CONTROL</span><h1>This account is not authorised.</h1><p>A valid session is present, but this account is not permitted to access the administrative workspace.</p></div><small className="mono muted" style={{ color: "hsl(42 18% 66%)" }}>PRIVATE ADMINISTRATION · RLS ENFORCED</small></aside>
    <div className="login-form-side"><div className="login-card"><span className="eyebrow">UNAUTHORISED</span><h2>Access not granted</h2><p>Sign out of this session or return to the public site. Access remains enforced by database policies.</p>{authError && <div className="form-message" role="alert">{authError}</div>}<button className="button" onClick={handleLogout}>Sign out</button><a className="button-text" href="/" style={{ display: "inline-block", marginTop: 15 }}>Return to public site</a></div></div>
  </div>;

  return <div className="admin-layout">
    <aside className="admin-sidebar"><a href="/"><BrandMark/></a><nav className="admin-nav" aria-label="Admin sections">{sections.map((item) => <button key={item.id} className={section === item.id ? "active" : ""} aria-current={section === item.id ? "page" : undefined} onClick={() => setSection(item.id)}><span className="nav-icon">{item.icon}</span>{item.label}</button>)}</nav><div className="admin-sidebar-bottom">AUTHENTICATED ADMIN<br/>Access checks enforced by RLS.</div></aside>
    <main className="admin-main">
      <header className="admin-topbar"><span className="admin-top-title">{sections.find((item) => item.id === section)?.label}</span><div className="admin-top-right"><span>{adminEmail}</span><button className="button button-outline small-button" onClick={handleLogout}>Log out</button></div></header>
      <div className="admin-content">
        {dataError && <div style={{ marginBottom: 18 }}><ErrorState message={dataError} retry={() => void loadData()}/></div>}
        {dataLoading ? <LoadingState/> : <>
          {section === "overview" && <OverviewSection leads={leads} analytics={analytics} performance={navPerformance} onOpen={setSelectedLead}/>}
          {section === "leads" && <LeadsSection leads={visibleLeads} total={filteredLeads.length} count={leads.length} page={page} pageCount={pageCount} setPage={setPage} query={query} setQuery={(value) => { setQuery(value); setPage(0); }} statusFilter={statusFilter} setStatusFilter={(value) => { setStatusFilter(value); setPage(0); }} sort={sort} setSort={setSort} exportLeads={exportLeads} onOpen={setSelectedLead}/>}
          {section === "education" && <EducationAdminSection leads={educationLeads} agents={educationAgents} agreements={educationAgreements} consents={educationConsents} referrals={educationReferrals} error={educationError} onRefresh={() => void loadData()} onCreateAgent={addEducationAgent} onCreateAgreement={addEducationAgreement} onAssign={assignStudentToAgent} onUpdateReferral={saveEducationReferral} onRevoke={revokeStudentAgentAccess}/>}
          {section === "content" && <ContentSection content={content} currentRecord={currentRecord} recordId={contentRecordId} setRecordId={setContentRecordId} draft={contentDraft} setDraft={(value) => { setContentDraft(value); setContentSaved(false); }} saved={contentSaved} error={contentError} onSave={() => void saveContentDraft()} onCancel={() => { if (currentRecord) setContentDraft(currentRecord.content_value); setContentError(""); setContentSaved(false); }}/>}
          {section === "seo" && <SettingsSection title="SEO & metadata" subtitle="Review public site values configured in the secure settings store. Changes remain plain text or JSON values." settings={settings.filter((setting) => /seo|meta|title|description|canonical|robots/i.test(setting.setting_key))} editingId={editingSetting} setEditingId={setEditingSetting} draft={settingDraft} setDraft={setSettingDraft} error={settingError} onSave={saveSettingDraft}/>}
          {section === "settings" && <SettingsSection title="Site settings" subtitle="Edit configured settings. Sensitive access policy is not exposed or changed here." settings={settings.filter((setting) => !/seo|meta|title|description|canonical|robots/i.test(setting.setting_key))} editingId={editingSetting} setEditingId={setEditingSetting} draft={settingDraft} setDraft={setSettingDraft} error={settingError} onSave={saveSettingDraft}/>}
          {section === "analytics" && <AnalyticsSection analytics={analytics}/>}
          {section === "performance" && <PerformanceSection performance={navPerformance}/>}
          {section === "utilities" && <BackupSection ready={snapshotReady} error={snapshotError} onExport={() => void prepareSnapshot()}/>}
          {section === "theme" && <ThemeSection theme={theme} setTheme={setTheme}/>}
        </>}
      </div>
    </main>
    {selectedLead && <LeadDetail lead={selectedLead} error={leadSaveError} onClose={() => { setSelectedLead(null); setLeadSaveError(""); }} onChange={updateLeadField}/>}
    <div className="sr-only" aria-live="polite">{t(language, "language")}: {language}</div>
  </div>;
}

function SectionHeading({ title, subtitle, action }: { title: string; subtitle: string; action?: import("react").ReactNode }) {
  return <div className="admin-heading"><div><h1>{title}</h1><p>{subtitle}</p></div>{action}</div>;
}

function OverviewSection({ leads, analytics, performance, onOpen }: { leads: Lead[]; analytics: AnalyticsEvent[]; performance: { dom: number; load: number } | null; onOpen: (lead: Lead) => void }) {
  const newLeads = leads.filter((lead) => lead.status === "new").length;
  const qualified = leads.filter((lead) => lead.status === "qualified").length;
  const open = leads.filter((lead) => !["completed", "closed"].includes(lead.status)).length;
  return <><SectionHeading title="Good morning, Meridian." subtitle="A current view of the enquiries and configured measurement available in this workspace."/>
    <div className="stat-grid">{[[ "Total enquiries", leads.length, "All records accessible to this account" ], ["New enquiries", newLeads, "Awaiting first status update"], ["In progress", open, "Not completed or closed"], ["Qualified", qualified, "Marked as qualified"]].map(([label, value, note]) => <div className="stat-card" key={label}><span>{label}</span><strong>{value}</strong><small>{note}</small></div>)}</div>
    <div className="admin-panel" style={{ marginBottom: 18 }}><div className="panel-head"><h2>Recent enquiries</h2><span className="badge">{leads.length} records</span></div>{leads.length ? <LeadTable leads={[...leads].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)).slice(0, 6)} onOpen={onOpen}/> : <EmptyState title="No enquiries yet" body="Submitted enquiries will appear here once received through the public site."/>}</div>
    <div className="admin-panel"><div className="panel-head"><h2>Browser page timing</h2><span className="badge">This session</span></div><div className="panel-body"><div className="stat-grid" style={{ marginBottom: 0 }}><div className="stat-card"><span>DOMContentLoaded</span><strong>{performance ? `${performance.dom} ms` : "—"}</strong><small>Navigation Timing API · this browser tab</small></div><div className="stat-card"><span>Load event</span><strong>{performance ? `${performance.load} ms` : "—"}</strong><small>Navigation Timing API · this browser tab</small></div><div className="stat-card"><span>Analytics events</span><strong>{analytics.length}</strong><small>Rows returned by configured analytics store</small></div><div className="stat-card"><span>Measurement scope</span><strong style={{ fontSize: 19 }}>Observed</strong><small>Not a site-wide performance benchmark</small></div></div></div></div>
  </>;
}

function PerformanceSection({ performance }: { performance: { dom: number; load: number; resourceCount: number; resourceDuration: number; transferBytes: number | null } | null }) {
  const transfer = performance?.transferBytes == null
    ? "Unavailable"
    : performance.transferBytes < 1024 * 1024
      ? `${(performance.transferBytes / 1024).toFixed(1)} KB`
      : `${(performance.transferBytes / (1024 * 1024)).toFixed(2)} MB`;
  return <><SectionHeading title="Performance" subtitle="Browser timing captured in this admin session. These are local observations, not a site-wide benchmark."/>
    <div className="stat-grid">
      <div className="stat-card"><span>DOMContentLoaded</span><strong>{performance ? `${performance.dom} ms` : "Unavailable"}</strong><small>Measured · Navigation Timing API</small></div>
      <div className="stat-card"><span>Load event</span><strong>{performance ? `${performance.load} ms` : "Unavailable"}</strong><small>Measured · Navigation Timing API</small></div>
      <div className="stat-card"><span>Resource entries</span><strong>{performance?.resourceCount ?? "Unavailable"}</strong><small>Measured · current browser session</small></div>
      <div className="stat-card"><span>Cumulative resource duration</span><strong>{performance ? `${performance.resourceDuration} ms` : "Unavailable"}</strong><small>Estimated sum · requests may overlap</small></div>
      <div className="stat-card"><span>Transferred resource data</span><strong>{transfer}</strong><small>Browser-reported estimate · may be unavailable for cached or cross-origin resources</small></div>
      <div className="stat-card"><span>Ad response latency</span><strong>Unavailable</strong><small>No advertising provider or publisher tag is configured.</small></div>
      <div className="stat-card"><span>Core Web Vitals</span><strong>Not collected</strong><small>No field-user measurements are inferred.</small></div>
    </div>
  </>;
}

function LeadTable({ leads, onOpen }: { leads: Lead[]; onOpen: (lead: Lead) => void }) {
  return <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Contact</th><th>Interest</th><th>Residence</th><th>Received</th><th>Status</th><th>Priority</th></tr></thead><tbody>{leads.map((lead) => <tr key={lead.id}>
    <td><button className="table-link" onClick={() => onOpen(lead)}>{lead.full_name}</button><br/><span className="muted">{lead.email}</span></td>
    <td>{pretty(lead.service_interest)}</td><td>{lead.country}</td><td>{when(lead.created_at)}</td>
    <td><span className={`badge ${lead.status === "qualified" ? "good" : lead.status === "new" ? "warn" : ""}`}>{pretty(lead.status)}</span></td>
    <td><span className={`badge ${lead.priority === "high" ? "warn" : ""}`}>{pretty(lead.priority)}</span></td>
  </tr>)}</tbody></table></div>;
}

function LeadsSection({ leads, total, count, page, pageCount, setPage, query, setQuery, statusFilter, setStatusFilter, sort, setSort, exportLeads, onOpen }: {
  leads: Lead[]; total: number; count: number; page: number; pageCount: number; setPage: (page: number) => void;
  query: string; setQuery: (value: string) => void; statusFilter: string; setStatusFilter: (value: string) => void;
  sort: string; setSort: (value: string) => void; exportLeads: () => void; onOpen: (lead: Lead) => void;
}) {
  return <><SectionHeading title="Enquiries" subtitle={`${total} matching records from ${count} total`} action={<button className="button small-button" onClick={exportLeads}>Export filtered CSV</button>}/>
    <div className="admin-panel"><div className="panel-head"><h2>Lead register</h2><div className="admin-controls"><label className="sr-only" htmlFor="lead-search">Search leads</label><input id="lead-search" type="search" placeholder="Search name, email, country…" value={query} onChange={(event) => setQuery(event.target.value)}/><label className="sr-only" htmlFor="lead-status">Filter by status</label><select id="lead-status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">All statuses</option>{statuses.map((status) => <option key={status} value={status}>{pretty(status)}</option>)}</select><label className="sr-only" htmlFor="lead-sort">Sort leads</label><select id="lead-sort" value={sort} onChange={(event) => setSort(event.target.value)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select></div></div>
      {leads.length ? <><LeadTable leads={leads} onOpen={onOpen}/><div className="panel-body" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 15 }}><span className="muted" style={{ fontSize: 11 }}>Page {page + 1} of {pageCount}</span><div className="admin-controls"><button className="button button-outline small-button" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</button><button className="button button-outline small-button" disabled={page + 1 >= pageCount} onClick={() => setPage(page + 1)}>Next</button></div></div></> : <EmptyState title={count ? "No matching enquiries" : "No enquiries yet"} body={count ? "Try widening the search or selecting a different status." : "Enquiries submitted through the public form will be listed here."}/>}
    </div>
  </>;
}

function LeadDetail({ lead, error, onClose, onChange }: { lead: Lead; error: string; onClose: () => void; onChange: (lead: Lead, field: "status" | "priority", value: Lead["status"] | Lead["priority"]) => void }) {
  useEffect(() => { const close = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); }; window.addEventListener("keydown", close); return () => window.removeEventListener("keydown", close); }, [onClose]);
  const fields: [string, unknown][] = [
    ["Received", when(lead.created_at)], ["Residence", lead.country], ["Nationality", lead.nationality],
    ["Phone", `${lead.phone_country_code} ${lead.phone_number}`], ["Service interest", pretty(lead.service_interest)],
    ["Business stage", pretty(lead.business_stage)], ["Business type", lead.business_type],
    ["Existing company", lead.has_existing_company ? `Yes · ${lead.company_country}` : "No"],
    ["Estimated budget", pretty(lead.estimated_budget)], ["Timeline", lead.timeline],
    ["Visa interest", pretty(lead.visa_interest)], ["Banking interest", pretty(lead.banking_interest)],
    ["Contact preference", pretty(lead.contact_preference)], ["Language", lead.language], ["Timezone", lead.timezone],
    ["Source", lead.source], ["Campaign", [lead.utm_source, lead.utm_medium, lead.utm_campaign].filter(Boolean).join(" / ") || "—"],
    ["Message", lead.message || "—"],
  ];
  return <div className="lead-detail-panel" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="lead-detail" role="dialog" aria-modal="true" aria-labelledby="lead-detail-title">
    <div className="detail-head"><div><span className="eyebrow">LEAD DETAIL · {lead.id.slice(0, 8)}</span><h2 id="lead-detail-title">{lead.full_name}</h2><a className="table-link" href={`mailto:${encodeURIComponent(lead.email)}`}>{lead.email}</a></div><button className="icon-button" onClick={onClose} aria-label="Close lead details">×</button></div>
    <div className="detail-actions"><label className="field"><span>Status</span><select className="admin-inline-select" value={lead.status} onChange={(event) => onChange(lead, "status", event.target.value as Lead["status"])}>{statuses.map((status) => <option value={status} key={status}>{pretty(status)}</option>)}</select></label><label className="field"><span>Priority</span><select className="admin-inline-select" value={lead.priority} onChange={(event) => onChange(lead, "priority", event.target.value as Lead["priority"])}>{priorities.map((priority) => <option value={priority} key={priority}>{pretty(priority)}</option>)}</select></label></div>
    {error && <div className="form-message" role="alert">{error}</div>}
    {fields.map(([label, value]) => <div className="admin-row" key={label}><span>{label}</span><strong style={{ whiteSpace: label === "Message" ? "pre-wrap" : undefined, overflowWrap: "anywhere" }}>{String(value || "—")}</strong></div>)}
  </section></div>;
}

function ContentSection({ content, currentRecord, recordId, setRecordId, draft, setDraft, saved, error, onSave, onCancel }: {
  content: ContentRecord[]; currentRecord?: ContentRecord; recordId: string; setRecordId: (id: string) => void; draft: string; setDraft: (value: string) => void; saved: boolean; error: string; onSave: () => void; onCancel: () => void;
}) {
  return <><SectionHeading title="Content studio" subtitle="Edit plain-text content by key and language. Markup is displayed as text, never rendered as HTML."/>
    {!content.length ? <div className="admin-panel"><EmptyState title="No editable content records" body="Public content records will appear here when configured in the secure content store."/></div> : <div className="admin-panel"><div className="panel-head"><h2>Content entry</h2><div className="admin-controls"><label className="sr-only" htmlFor="content-record">Choose content record</label><select id="content-record" value={currentRecord?.id ?? recordId} onChange={(event) => setRecordId(event.target.value)}>{content.map((record) => <option value={record.id} key={record.id}>{record.content_key} · {record.language}</option>)}</select></div></div><div className="panel-body">
      {currentRecord && <><div className="admin-row"><span>Content key</span><strong>{currentRecord.content_key}</strong></div><div className="admin-row"><span>Language / publication</span><strong>{currentRecord.language} · {currentRecord.is_public ? "Public" : "Private"}</strong></div>
        <div className="field" style={{ marginTop: 22 }}><label htmlFor="content-value">Content value <span>{draft.length}/20,000</span></label><textarea id="content-value" className="admin-textarea" maxLength={20000} value={draft} onChange={(event) => setDraft(event.target.value)}/></div>
        <div className="preview-box"><small>Plain text preview · {currentRecord.language}</small><h3>{currentRecord.content_key}</h3><p>{draft || "Preview text will appear here."}</p></div>
        {error && <div className="form-message" role="alert">{error}</div>}{saved && <p className="muted" role="status">Content saved.</p>}
        <div className="admin-controls" style={{ marginTop: 18 }}><button className="button small-button" onClick={onSave}>Save content</button><button className="button button-outline small-button" onClick={onCancel}>Cancel changes</button></div>
      </>}
    </div></div>}
  </>;
}

function SettingsSection({ title, subtitle, settings, editingId, setEditingId, draft, setDraft, error, onSave }: {
  title: string; subtitle: string; settings: SiteSetting[]; editingId: string | null; setEditingId: (id: string | null) => void; draft: string; setDraft: (value: string) => void; error: string; onSave: (setting: SiteSetting) => void;
}) {
  return <><SectionHeading title={title} subtitle={subtitle}/>
    <div className="admin-panel"><div className="panel-head"><h2>Configured values</h2><span className="badge">{settings.length} entries</span></div>
      {settings.length ? settings.map((setting) => <div className="panel-body" key={setting.id} style={{ borderBottom: "1px solid hsl(var(--line))" }}>
        <div className="admin-row"><span>Key</span><strong>{setting.setting_key}</strong></div><div className="admin-row"><span>Visibility</span><strong>{setting.is_public ? "Public" : "Private"}</strong></div>
        {editingId === setting.id ? <><div className="field" style={{ marginTop: 13 }}><label htmlFor={`setting-${setting.id}`}>Value (plain text or valid JSON)</label><textarea className="admin-textarea" id={`setting-${setting.id}`} value={draft} onChange={(event) => setDraft(event.target.value)}/></div>{error && <div className="form-message" role="alert">{error}</div>}<div className="admin-controls" style={{ marginTop: 12 }}><button className="button small-button" onClick={() => onSave(setting)}>Save setting</button><button className="button button-outline small-button" onClick={() => setEditingId(null)}>Cancel</button></div></>
          : <><div className="admin-row"><span>Value</span><strong style={{ overflowWrap: "anywhere" }}>{typeof setting.setting_value === "string" ? setting.setting_value : JSON.stringify(setting.setting_value)}</strong></div><button className="button button-outline small-button" style={{ marginTop: 13 }} onClick={() => { setDraft(typeof setting.setting_value === "string" ? setting.setting_value : JSON.stringify(setting.setting_value, null, 2)); setEditingId(setting.id); }}>Edit value</button></>}
      </div>) : <EmptyState title="No matching settings" body="Configured settings appear here. Nothing has been invented or pre-filled."/>}
    </div>
  </>;
}

function AnalyticsSection({ analytics }: { analytics: AnalyticsEvent[] }) {
  const days = useMemo(() => {
    const items = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(); date.setDate(date.getDate() - (6 - index)); date.setHours(0, 0, 0, 0);
      const next = new Date(date); next.setDate(next.getDate() + 1);
      return { label: new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(date), count: analytics.filter((event) => {
        const time = Date.parse(event.created_at); return time >= date.getTime() && time < next.getTime();
      }).length };
    });
    return items;
  }, [analytics]);
  const max = Math.max(1, ...days.map((day) => day.count));
  const types = Object.entries(analytics.reduce<Record<string, number>>((acc, event) => { acc[event.event_type] = (acc[event.event_type] ?? 0) + 1; return acc; }, {})).sort((a, b) => b[1] - a[1]);
  return <><SectionHeading title="Analytics" subtitle="Events returned by the configured analytics store. Counts reflect available records only."/>
    <div className="stat-grid"><div className="stat-card"><span>Available event records</span><strong>{analytics.length}</strong><small>Current list response</small></div><div className="stat-card"><span>Event types</span><strong>{types.length}</strong><small>Distinct event_type values</small></div><div className="stat-card"><span>Measurement</span><strong style={{ fontSize: 19 }}>Configured</strong><small>No extrapolation beyond returned rows</small></div><div className="stat-card"><span>External tracking</span><strong style={{ fontSize: 18 }}>Not assumed</strong><small>Only event records available here</small></div></div>
    <div className="admin-panel" style={{ marginBottom: 18 }}><div className="panel-head"><h2>Recorded events by day</h2><span className="badge">Last 7 calendar days</span></div><div className="panel-body">{analytics.length ? <><div className="chart-area" role="img" aria-label="Daily event record counts from the configured analytics store">{days.map((day) => <div className="chart-bar" key={day.label} title={`${day.label}: ${day.count}`} style={{ height: `${Math.max(4, (day.count / max) * 100)}%` }}/>)}</div><div className="chart-labels">{days.map((day, i) => <span key={`${day.label}-${i}`}>{day.label} · {day.count}</span>)}</div></> : <EmptyState title="No analytics events available" body="This view remains empty until the configured event store has returned records."/>}</div></div>
    <div className="admin-panel"><div className="panel-head"><h2>Event types</h2></div>{types.length ? <div className="panel-body">{types.map(([type, count]) => <div className="admin-row" key={type}><span>{type}</span><strong>{count}</strong></div>)}</div> : <EmptyState title="No event types recorded" body="Nothing is inferred or fabricated when analytics are unavailable."/>}</div>
  </>;
}

function BackupSection({ ready, error, onExport }: { ready: boolean; error: string; onExport: () => void }) {
  return <><SectionHeading title="Data backup" subtitle="Export a JSON snapshot through the authenticated backend. Keep the downloaded file in a controlled location."/>
    <div className="admin-panel"><div className="panel-head"><h2>Workspace snapshot</h2><span className="badge">JSON</span></div><div className="panel-body"><p className="muted" style={{ maxWidth: 630, fontSize: 13, lineHeight: 1.8 }}>The snapshot is supplied by the configured secure backend and may include lead, content, analytics and setting records according to account permissions. This screen does not stage or modify your data.</p><button className="button" onClick={onExport}>Export JSON snapshot <span className="arrow">→</span></button>{ready && <p role="status" className="muted" style={{ marginTop: 16 }}>Snapshot download prepared by the backend.</p>}{error && <div className="form-message" role="alert">{error}</div>}</div></div>
  </>;
}

function ThemeSection({ theme, setTheme }: { theme: ThemeChoice; setTheme: (theme: ThemeChoice) => void }) {
  return <><SectionHeading title="Theme preview" subtitle="Appearance is saved locally in this browser. It does not change public content or data."/>
    <div className="admin-panel"><div className="panel-head"><h2>Color direction</h2><span className="badge">{pretty(theme)}</span></div><div className="panel-body"><div className="admin-controls"><label htmlFor="admin-theme">Theme preference</label><select id="admin-theme" value={theme} onChange={(event) => setTheme(event.target.value as ThemeChoice)}><option value="light">Light</option><option value="dark">Dark</option><option value="system">System</option></select></div><div className="theme-swatches" aria-label="Meridian palette preview"><span style={{ background: "hsl(42 29% 94%)" }}/><span style={{ background: "hsl(166 35% 22%)" }}/><span style={{ background: "hsl(13 55% 48%)" }}/><span style={{ background: "hsl(40 50% 52%)" }}/><span style={{ background: "hsl(164 23% 89%)" }}/></div><div className="preview-box"><small>LIVE PREVIEW</small><h3>Meridian Malaysia</h3><p>Warm paper, deep forest and restrained terracotta. The current theme follows your selected preference.</p><button className="button">Primary action</button></div></div></div>
  </>;
}
