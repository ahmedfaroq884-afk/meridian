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

export type StudyLevel = "foundation" | "diploma" | "bachelors" | "masters" | "doctoral";

export interface EducationLeadInput {
  full_name: string;
  email: string;
  phone_number?: string;
  current_country: string;
  university_preference?: string;
  study_level: StudyLevel;
  intended_subject: string;
  intake?: string;
  highest_qualification: string;
  tuition_budget: "under-20k" | "20k-50k" | "50k-100k" | "100k-plus" | "not-specified";
  additional_message?: string;
  agent_intro_requested: boolean;
  privacy_contact_consent: true;
  language: Language;
  timezone: string;
}

export interface EducationLead extends EducationLeadInput {
  id: string;
  created_at: string;
}

export interface EducationAgent {
  id: string;
  email: string;
  display_name: string;
  is_active: boolean;
  created_at: string;
}

export interface EducationCommissionAgreement {
  id: string;
  agent_id: string;
  agreement_reference: string;
  written_agreement_date: string;
  valid_from: string;
  valid_until: string | null;
  commission_rate: number;
  commission_basis: string;
  currency_code: string;
  is_active: boolean;
  created_at: string;
}

export interface EducationAgentConsent {
  student_lead_id: string;
  agent_id: string;
  consented_at: string;
  consent_method: "email" | "written" | "phone" | "video" | "other";
  evidence_reference: string;
  recorded_by: string;
  revoked_at: string | null;
}

export type EducationApplicationStatus =
  | "assigned"
  | "application-in-progress"
  | "offer-received"
  | "enrolled"
  | "declined"
  | "withdrawn"
  | "completed";

export type EducationPaymentStatus =
  | "not-due"
  | "pending"
  | "partially-received"
  | "received"
  | "disputed"
  | "not-payable";

export interface EducationReferral {
  id: string;
  student_lead_id: string;
  agent_id: string;
  agreement_id: string;
  assigned_at: string;
  application_status: EducationApplicationStatus;
  commission_base_amount: number;
  commission_rate_snapshot: number;
  expected_commission_amount: number;
  actual_received_amount: number;
  currency_code: string;
  payment_status: EducationPaymentStatus;
  payment_note: string;
  updated_at: string;
}
