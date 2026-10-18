import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type {
  AnalyticsEvent,
  ContentRecord,
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
  return {
    schema_version: 1,
    exported_at: new Date().toISOString(),
    leads,
    site_content: siteContent,
    site_settings: siteSettings,
    analytics_events: analytics,
  };
}
