import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type {
  AnalyticsEvent,
  ContentRecord,
  EducationAgent,
  EducationAgentConsent,
  EducationApplicationStatus,
  EducationCommissionAgreement,
  EducationLead,
  EducationLeadInput,
  EducationPaymentStatus,
  EducationReferral,
  Language,
  Lead,
  LeadInput,
  SiteSetting,
  TrackEvent,
} from "./types";

const projectUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const publishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ||
  import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

const client: SupabaseClient | null =
  projectUrl && publishableKey
    ? createClient(projectUrl, publishableKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
    : null;

const PAGE_SIZE = 500;

export function supabaseEnabled(): boolean {
  return client !== null;
}

function requireClient(): SupabaseClient {
  if (!client) {
    throw new Error("The enquiry service is not configured yet. Please try again later or contact the site owner.");
  }
  return client;
}

async function getAllRows<T>(
  table: "leads" | "site_content" | "site_settings" | "analytics_events",
  select: string,
): Promise<T[]> {
  const db = requireClient();
  const result: T[] = [];

  for (let start = 0; ; start += PAGE_SIZE) {
    const { data, error } = await db
      .from(table)
      .select(select)
      .range(start, start + PAGE_SIZE - 1);
    if (error) throw new Error("Unable to load records. Check the connection and administrator permissions.");
    const page = (data ?? []) as T[];
    result.push(...page);
    if (page.length < PAGE_SIZE) return result;
  }
}

export async function submitLead(lead: LeadInput): Promise<void> {
  const db = requireClient();
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 20_000);
  try {
    const { error } = await db
      .from("leads")
      .insert({
        ...lead,
        source: lead.source || "website",
        message: lead.message?.trim() ?? "",
      })
      .abortSignal(controller.signal);
    if (error) {
      if (/storage safety limit reached/i.test(error.message)) {
        throw new Error("LEAD_STORAGE_PAUSED");
      }
      throw new Error("We could not send your enquiry. Please check the details and try again.");
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("The request timed out. Your enquiry may not have been sent; please retry.");
    }
    throw error instanceof Error
      ? error
      : new Error("We could not send your enquiry. Please try again.");
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function submitEducationLead(lead: EducationLeadInput): Promise<void> {
  const db = requireClient();
  const { error } = await db.from("education_leads").insert({
    ...lead,
    full_name: lead.full_name.trim(),
    email: lead.email.trim(),
    current_country: lead.current_country.trim(),
    university_preference: lead.university_preference?.trim() || null,
    intended_subject: lead.intended_subject.trim(),
    intake: lead.intake?.trim() || null,
    highest_qualification: lead.highest_qualification.trim(),
    additional_message: lead.additional_message?.trim() || "",
  });
  if (error) {
    if (/storage safety limit reached/i.test(error.message)) throw new Error("LEAD_STORAGE_PAUSED");
    throw new Error("EDUCATION_SUBMISSION_FAILED");
  }
}

export async function listEducationLeads(): Promise<EducationLead[]> {
  const { data, error } = await requireClient()
    .from("education_leads")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error("Unable to load student enquiries. Confirm the education migration is installed.");
  return (data ?? []) as EducationLead[];
}

export async function listEducationAgents(): Promise<EducationAgent[]> {
  const { data, error } = await requireClient()
    .from("education_agents")
    .select("*")
    .order("display_name");
  if (error) throw new Error("Unable to load education agents.");
  return (data ?? []) as EducationAgent[];
}

export async function listEducationAgreements(): Promise<EducationCommissionAgreement[]> {
  const { data, error } = await requireClient()
    .from("education_commission_agreements")
    .select("*")
    .order("written_agreement_date", { ascending: false });
  if (error) throw new Error("Unable to load written commission agreements.");
  return (data ?? []) as EducationCommissionAgreement[];
}

export async function listEducationReferrals(): Promise<EducationReferral[]> {
  const { data, error } = await requireClient()
    .from("education_referrals")
    .select("*")
    .order("assigned_at", { ascending: false });
  if (error) throw new Error("Unable to load education referrals.");
  return (data ?? []) as EducationReferral[];
}

export async function listEducationAgentConsents(): Promise<EducationAgentConsent[]> {
  const { data, error } = await requireClient()
    .from("education_agent_consents")
    .select("*")
    .order("consented_at", { ascending: false });
  if (error) throw new Error("Unable to load education-consent records.");
  return (data ?? []) as EducationAgentConsent[];
}

export async function createEducationAgent(input: Pick<EducationAgent, "email" | "display_name">): Promise<EducationAgent> {
  const { data, error } = await requireClient()
    .from("education_agents")
    .insert({ email: input.email.trim().toLowerCase(), display_name: input.display_name.trim() })
    .select("*")
    .single();
  if (error || !data) throw new Error("Unable to add this education agent.");
  return data as EducationAgent;
}

export async function createEducationAgreement(input: Omit<EducationCommissionAgreement, "id" | "created_at" | "is_active">): Promise<EducationCommissionAgreement> {
  const { data, error } = await requireClient()
    .from("education_commission_agreements")
    .insert(input)
    .select("*")
    .single();
  if (error || !data) throw new Error("Unable to save this written commission agreement.");
  return data as EducationCommissionAgreement;
}

export async function assignEducationLead(input: {
  studentLeadId: string;
  agentId: string;
  agreementId: string;
  consentedAt: string;
  consentMethod: "email" | "written" | "phone" | "video" | "other";
  evidenceReference: string;
  commissionBaseAmount: number;
}): Promise<string> {
  const { data, error } = await requireClient().rpc("assign_education_lead", {
    p_student_lead_id: input.studentLeadId,
    p_agent_id: input.agentId,
    p_agreement_id: input.agreementId,
    p_consent_at: input.consentedAt,
    p_consent_method: input.consentMethod,
    p_evidence_reference: input.evidenceReference.trim(),
    p_commission_base_amount: input.commissionBaseAmount,
  });
  if (error || typeof data !== "string") {
    throw new Error(error?.message || "Unable to assign this student enquiry.");
  }
  return data;
}

export async function updateEducationReferral(
  id: string,
  changes: {
    application_status: EducationApplicationStatus;
    actual_received_amount: number;
    commission_base_amount: number;
    payment_status: EducationPaymentStatus;
    payment_note: string;
  },
): Promise<void> {
  const { error } = await requireClient()
    .from("education_referrals")
    .update(changes)
    .eq("id", id);
  if (error) throw new Error("Unable to update referral or commission tracking.");
}

export async function revokeEducationAgentConsent(studentLeadId: string, agentId: string): Promise<void> {
  const { error } = await requireClient()
    .from("education_agent_consents")
    .update({ revoked_at: new Date().toISOString() })
    .eq("student_lead_id", studentLeadId)
    .eq("agent_id", agentId);
  if (error) throw new Error("Unable to revoke this agent's access.");
}

export async function getEducationAgentProfile(): Promise<EducationAgent | null> {
  const { data, error } = await requireClient().from("education_agents").select("*").maybeSingle();
  if (error) throw new Error("Unable to verify education-agent access.");
  return (data as EducationAgent | null) ?? null;
}

export async function listMyEducationReferrals(): Promise<{
  leads: EducationLead[];
  referrals: EducationReferral[];
}> {
  const agent = await getEducationAgentProfile();
  if (!agent?.is_active) throw new Error("This account is not authorised as an active education agent.");
  const { data: referralRows, error: referralError } = await requireClient()
    .from("education_referrals")
    .select("*")
    .eq("agent_id", agent.id)
    .order("assigned_at", { ascending: false });
  if (referralError) throw new Error("Unable to load your assigned student enquiries.");
  const referrals = (referralRows ?? []) as EducationReferral[];
  if (!referrals.length) return { leads: [], referrals };
  const { data: leadRows, error: leadError } = await requireClient()
    .from("education_leads")
    .select("*")
    .in("id", referrals.map((referral) => referral.student_lead_id));
  if (leadError) throw new Error("Unable to load your consented student enquiries.");
  return { leads: (leadRows ?? []) as EducationLead[], referrals };
}

export async function signIn(email: string, password: string): Promise<void> {
  const { error } = await requireClient().auth.signInWithPassword({ email, password });
  if (error) throw new Error("Sign-in failed. Check your details and Supabase Auth configuration.");
}

export async function signOut(): Promise<void> {
  const { error } = await requireClient().auth.signOut();
  if (error) throw new Error("Unable to sign out. Please retry.");
}

export async function getAdminSession(): Promise<{ email: string } | null> {
  const { data, error } = await requireClient().auth.getSession();
  if (error) throw new Error("Unable to check the administrator session.");
  const user = data.session?.user;
  return user ? { email: user.email ?? "" } : null;
}

export async function checkAdminAccess(): Promise<boolean> {
  const { data, error } = await requireClient().rpc("is_admin");
  if (error) throw new Error("Unable to verify administrator access. Confirm the migration is installed.");
  return data === true;
}

export async function listLeads(): Promise<Lead[]> {
  const db = requireClient();
  const rows: Lead[] = [];
  for (let start = 0; ; start += PAGE_SIZE) {
    const { data, error } = await db
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false })
      .range(start, start + PAGE_SIZE - 1);
    if (error) throw new Error("Unable to load enquiries. Check administrator permissions.");
    const page = (data ?? []) as Lead[];
    rows.push(...page);
    if (page.length < PAGE_SIZE) return rows;
  }
}

export async function saveLead(id: string, changes: Partial<Lead>): Promise<void> {
  const safeChanges: Partial<Pick<Lead, "priority" | "status">> = {};
  if (changes.priority) safeChanges.priority = changes.priority;
  if (changes.status) safeChanges.status = changes.status;
  if (Object.keys(safeChanges).length === 0) return;
  const { error } = await requireClient().from("leads").update(safeChanges).eq("id", id);
  if (error) throw new Error("Unable to update the enquiry. Check administrator permissions.");
}

export async function listSiteContent(): Promise<ContentRecord[]> {
  return getAllRows<ContentRecord>("site_content", "*");
}

export async function getPublicSiteContent(language: Language): Promise<ContentRecord[]> {
  if (!client) return [];
  const { data, error } = await client
    .from("site_content")
    .select("*")
    .eq("is_public", true)
    .eq("language", language)
    .order("content_key");
  if (error) throw new Error("Public content is temporarily unavailable.");
  return (data ?? []) as ContentRecord[];
}

export async function saveContent(id: string, value: string): Promise<void> {
  if (value.length > 30_000) throw new Error("Content must be 30,000 characters or fewer.");
  const { error } = await requireClient()
    .from("site_content")
    .update({ content_value: value })
    .eq("id", id);
  if (error) throw new Error("Unable to save content. Check administrator permissions.");
}

export async function listAnalytics(): Promise<AnalyticsEvent[]> {
  const db = requireClient();
  const rows: AnalyticsEvent[] = [];
  for (let start = 0; ; start += PAGE_SIZE) {
    const { data, error } = await db
      .from("analytics_events")
      .select("*")
      .order("created_at", { ascending: false })
      .range(start, start + PAGE_SIZE - 1);
    if (error) throw new Error("Unable to load analytics. Check administrator permissions.");
    const page = (data ?? []) as AnalyticsEvent[];
    rows.push(...page);
    if (page.length < PAGE_SIZE) return rows;
  }
}

export async function listSettings(): Promise<SiteSetting[]> {
  return getAllRows<SiteSetting>("site_settings", "*");
}

export async function getPublicSettings(): Promise<SiteSetting[]> {
  if (!client) return [];
  const { data, error } = await client
    .from("site_settings")
    .select("*")
    .eq("is_public", true);
  if (error) throw new Error("Public site settings are temporarily unavailable.");
  return (data ?? []) as SiteSetting[];
}

export async function saveSetting(
  id: string,
  value: unknown,
  isPublic: boolean,
): Promise<void> {
  const serialized = JSON.stringify(value);
  if (serialized.length > 10_000) throw new Error("Setting data must be 10,000 characters or fewer.");
  const { error } = await requireClient()
    .from("site_settings")
    .update({ setting_value: value, is_public: isPublic })
    .eq("id", id);
  if (error) throw new Error("Unable to save the setting. Check administrator permissions.");
}

const validEventTypes = new Set([
  "page_view",
  "language_change",
  "theme_change",
  "lead_started",
  "lead_completed",
  "cta_clicked",
  "ad_loaded",
  "ad_failed",
]);

export async function track(event: TrackEvent): Promise<void> {
  if (!client || !validEventTypes.has(event.event_type)) return;
  const metadata: Record<string, string | number | boolean> = {};
  for (const key of ["section", "action", "source", "service", "label"]) {
    const value = event.metadata[key];
    if (
      typeof value === "string" && value.length <= 80 ||
      typeof value === "number" && Number.isFinite(value) ||
      typeof value === "boolean"
    ) {
      metadata[key] = value as string | number | boolean;
    }
  }
  const { error } = await client.from("analytics_events").insert({
    event_type: event.event_type,
    page: event.page.slice(0, 300),
    language: event.language,
    timezone: event.timezone.slice(0, 100),
    metadata,
  });
  if (error) {
    // Analytics is non-critical; never break a public action when it is unavailable.
    console.warn("Anonymous analytics event was not recorded.");
  }
}

export async function exportSnapshot(): Promise<Record<string, unknown>> {
  const [leads, siteContent, siteSettings, analytics] = await Promise.all([
    listLeads(),
    listSiteContent(),
    listSettings(),
    listAnalytics(),
  ]);
  let education: Record<string, unknown>;
  try {
    const [educationLeads, educationAgents, agreements, consents, referrals] = await Promise.all([
      listEducationLeads(),
      listEducationAgents(),
      listEducationAgreements(),
      listEducationAgentConsents(),
      listEducationReferrals(),
    ]);
    education = {
      export_status: "complete",
      student_enquiries: educationLeads,
      agents: educationAgents,
      written_commission_agreements: agreements,
      named_agent_consents: consents,
      referrals: referrals,
    };
  } catch (error) {
    education = {
      export_status: "incomplete",
      warning: error instanceof Error ? error.message : "Education records were unavailable.",
      student_enquiries: [],
      agents: [],
      written_commission_agreements: [],
      named_agent_consents: [],
      referrals: [],
    };
  }
  return {
    schema_version: 2,
    exported_at: new Date().toISOString(),
    leads,
    site_content: siteContent,
    site_settings: siteSettings,
    analytics_events: analytics,
    education,
  };
}
