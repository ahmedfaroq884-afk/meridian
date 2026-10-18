export type Language = "en" | "ar" | "ms" | "zh";
export type ThemeChoice = "light" | "dark" | "system";

export interface LeadInput {
  full_name: string;
  email: string;
  country: string;
  nationality: string;
  phone_country_code: string;
  phone_number: string;
  service_interest: string;
  business_stage: "exploring" | "planning" | "operating" | "expanding" | "other";
  business_type: string;
  has_existing_company: boolean;
  company_country: string;
  estimated_budget: "under-10k" | "10k-50k" | "50k-100k" | "100k-250k" | "250k-plus" | "not-specified";
  timeline: string;
  visa_interest: "pvip" | "mm2h" | "other" | "no" | "not-specified";
  banking_interest: "yes" | "no" | "not-specified";
  contact_preference: string;
  message?: string;
  language: Language;
  timezone: string;
  source?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}

export interface Lead extends LeadInput {
  id: string;
  created_at: string;
  updated_at: string;
  priority: "high" | "standard" | "completed";
  status: "new" | "contacted" | "qualified" | "processing" | "completed" | "closed";
}

export interface ContentRecord {
  id: string;
  content_key: string;
  language: Language | string;
  content_value: string;
  updated_at: string;
  is_public: boolean;
}

export interface AnalyticsEvent {
  id: string;
  created_at: string;
  event_type: string;
  page: string;
  language: string;
  timezone: string;
  metadata: Record<string, unknown>;
}

export interface SiteSetting {
  id: string;
  setting_key: string;
  setting_value: unknown;
  is_public: boolean;
  updated_at: string;
}

export interface TrackEvent {
  event_type: string;
  page: string;
  language: string;
  timezone: string;
  metadata: Record<string, unknown>;
}
