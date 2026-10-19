import { useState } from "react";
import type { FormEvent } from "react";
import type { EducationLeadInput, Language, StudyLevel } from "../lib/types";
import { submitEducationLead, supabaseEnabled } from "../lib/supabase";
import { t } from "../lib/i18n";

type FormValues = Omit<EducationLeadInput, "privacy_contact_consent">;

function emptyForm(language: Language): FormValues {
  return {
    full_name: "",
    email: "",
    phone_number: "",
    current_country: "",
    university_preference: "",
    study_level: "foundation",
    intended_subject: "",
    intake: "",
    highest_qualification: "",
    tuition_budget: "not-specified",
    additional_message: "",
    agent_intro_requested: false,
    language,
    timezone: "",
  };
}

const levelOptions: Array<[StudyLevel, string]> = [
  ["foundation", "educationLevelFoundation"],
  ["diploma", "educationLevelDiploma"],
  ["bachelors", "educationLevelBachelors"],
  ["masters", "educationLevelMasters"],
  ["doctoral", "educationLevelDoctoral"],
];

const budgetOptions = [
  ["under-20k", "educationBudget1"],
  ["20k-50k", "educationBudget2"],
  ["50k-100k", "educationBudget3"],
  ["100k-plus", "educationBudget4"],
  ["not-specified", "educationBudget5"],
] as const;

export function EducationEnquiryForm({ language }: { language: Language }) {
  const [values, setValues] = useState<FormValues>(() => emptyForm(language));
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const update = <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
    setError("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (sending || !privacyConsent) return;
    setSending(true);
    setError("");
    try {
      await submitEducationLead({
        ...values,
        phone_number: values.phone_number?.trim() || undefined,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
        privacy_contact_consent: true,
      });
      setSuccess(true);
    } catch (submitError) {
      setError(submitError instanceof Error && submitError.message === "LEAD_STORAGE_PAUSED"
        ? t(language, "leadStoragePaused")
        : t(language, "educationSubmitError"));
    } finally {
      setSending(false);
    }
  };

  if (success) {
    return <section className="success-state" role="status" aria-live="polite">
      <div className="success-mark" aria-hidden="true">✓</div>
      <h1>{t(language, "educationReceivedTitle")}</h1>
      <p className="muted">{t(language, "educationReceivedBody")}</p>
      <a className="button button-outline" href="/education">{t(language, "education")}</a>
    </section>;
  }

  return <div className="funnel-page education-form-page">
    <div className="narrow funnel-card" dir={language === "ar" ? "rtl" : "ltr"}>
      <span className="eyebrow">{t(language, "educationEyebrow")}</span>
      <h1>{t(language, "educationFormTitle")}</h1>
      <p>{t(language, "educationFormIntro")}</p>
      {!supabaseEnabled() && <div className="config-notice" role="status">{t(language, "educationNotConfigured")}</div>}
      <form className="education-form" onSubmit={(event) => void handleSubmit(event)}>
        <div className="education-form-grid">
          <div className="field">
            <label htmlFor="education-name">{t(language, "educationName")} <span>*</span></label>
            <input id="education-name" required maxLength={160} autoComplete="name" value={values.full_name} onChange={(event) => update("full_name", event.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="education-email">{t(language, "educationEmail")} <span>*</span></label>
            <input id="education-email" required maxLength={320} type="email" autoComplete="email" value={values.email} onChange={(event) => update("email", event.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="education-phone">{t(language, "educationPhone")}</label>
            <input id="education-phone" maxLength={40} type="tel" autoComplete="tel" value={values.phone_number ?? ""} onChange={(event) => update("phone_number", event.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="education-country">{t(language, "educationCountry")} <span>*</span></label>
            <input id="education-country" required maxLength={100} autoComplete="country-name" value={values.current_country} onChange={(event) => update("current_country", event.target.value)} />
          </div>
          <div className="field full">
            <label htmlFor="education-university">{t(language, "educationUniversity")}</label>
            <input id="education-university" maxLength={500} value={values.university_preference ?? ""} onChange={(event) => update("university_preference", event.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="education-level">{t(language, "educationLevel")} <span>*</span></label>
            <select id="education-level" value={values.study_level} onChange={(event) => update("study_level", event.target.value as StudyLevel)}>
              {levelOptions.map(([value, label]) => <option key={value} value={value}>{t(language, label)}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="education-subject">{t(language, "educationSubject")} <span>*</span></label>
            <input id="education-subject" required minLength={2} maxLength={180} value={values.intended_subject} onChange={(event) => update("intended_subject", event.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="education-intake">{t(language, "educationIntake")}</label>
            <input id="education-intake" maxLength={80} value={values.intake ?? ""} onChange={(event) => update("intake", event.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="education-qualification">{t(language, "educationQualification")} <span>*</span></label>
            <input id="education-qualification" required minLength={2} maxLength={500} value={values.highest_qualification} onChange={(event) => update("highest_qualification", event.target.value)} />
          </div>
          <div className="field full">
            <label htmlFor="education-budget">{t(language, "educationBudget")}</label>
            <select id="education-budget" value={values.tuition_budget} onChange={(event) => update("tuition_budget", event.target.value as FormValues["tuition_budget"])}>
              {budgetOptions.map(([value, key]) => <option key={value} value={value}>{t(language, key)}</option>)}
            </select>
          </div>
          <div className="field full">
            <label htmlFor="education-message">{t(language, "educationMessage")}</label>
            <textarea id="education-message" maxLength={2000} value={values.additional_message ?? ""} onChange={(event) => update("additional_message", event.target.value)} />
          </div>
        </div>
        <fieldset className="education-consents">
          <legend>{t(language, "educationDisclosureTitle")}</legend>
          <label className="education-check">
            <input type="checkbox" checked={values.agent_intro_requested} onChange={(event) => update("agent_intro_requested", event.target.checked)} />
            <span>{t(language, "educationAgentIntro")}</span>
          </label>
          <label className="education-check">
            <input type="checkbox" required checked={privacyConsent} onChange={(event) => setPrivacyConsent(event.target.checked)} />
            <span>{t(language, "educationPrivacyConsent")}</span>
          </label>
        </fieldset>
        <p className="education-consent-note">{t(language, "educationDisclosure")}</p>
        {error && <div className="form-message" role="alert">{error}</div>}
        <button className="button" type="submit" disabled={sending || !supabaseEnabled()}>
          {sending ? t(language, "educationSending") : t(language, "educationSubmit")}
        </button>
      </form>
    </div>
  </div>;
}
