import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import type { Language, LeadInput } from "../lib/types";
import { countries, localizedCountryName, serviceOptions } from "../lib/countries";
import { t } from "../lib/i18n";
import { CountryFlag } from "./CountryFlag";
import { submitLead, supabaseEnabled } from "../lib/supabase";

interface EnquiryFormProps { language: Language; initialService?: string }
type FormValues = LeadInput;
const emptyForm: FormValues = {
  full_name: "", email: "", country: "", nationality: "", phone_country_code: "+60", phone_number: "",
  service_interest: "", business_stage: "exploring", business_type: "", has_existing_company: false,
  company_country: "", estimated_budget: "not-specified", timeline: "", visa_interest: "not-specified",
  banking_interest: "not-specified", contact_preference: "", message: "", language: "ar",
  timezone: "", source: "website",
};
const steps = ["step1", "step2", "step3", "step4", "step5"];

function CountryPicker({ label, value, onChange, error, id, language }: { label: string; value: string; onChange: (value: string) => void; error?: string; id: string; language: Language }) {
  const selectedCountry = countries.find((country) => country.code === value || country.name === value);
  const [query, setQuery] = useState(selectedCountry ? localizedCountryName(selectedCountry.code, language) : "");
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const selected = countries.find((country) => country.code === value || country.name === value);
    setQuery(selected ? localizedCountryName(selected.code, language) : "");
  }, [value, language]);
  const options = useMemo(() => {
    const q = query.trim().toLowerCase();
    return countries.filter((country) => !q || country.name.toLowerCase().includes(q) || localizedCountryName(country.code, language).toLowerCase().includes(q) || country.code.toLowerCase().includes(q) || country.dial.includes(q));
  }, [query, language]);
  return <div className="field">
    <label htmlFor={id}>{label} <span aria-hidden="true">*</span></label>
    <div className="country-control">
      <input id={id} className="country-search" type="text" role="combobox" autoComplete="off" aria-autocomplete="list" aria-expanded={open} aria-controls={`${id}-options`} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} value={query} onFocus={() => setOpen(true)} onChange={(event) => { setQuery(event.target.value); setOpen(true); }} onKeyDown={(event) => {
        if (event.key === "Escape") setOpen(false);
        if (event.key === "Enter" && open && options[0]) { event.preventDefault(); onChange(options[0].code); setQuery(localizedCountryName(options[0].code, language)); setOpen(false); }
      }} placeholder={t(language, "selectOption")}/>
      {open && <div className="country-options" role="listbox" id={`${id}-options`}>
        {options.length ? options.map((country) => <button type="button" role="option" aria-selected={value === country.code} className="country-option" key={country.code} onClick={() => { onChange(country.code); setQuery(localizedCountryName(country.code, language)); setOpen(false); }}>
          <CountryFlag country={country} small/><span>{localizedCountryName(country.code, language)}</span><small className="muted"> {country.code}</small>
        </button>) : <div className="country-option muted" role="option" aria-selected="false">{t(language, "noMatch")}</div>}
      </div>}
    </div>
    {error && <span className="field-error" id={`${id}-error`} role="alert">{error}</span>}
  </div>;
}

function PhoneCodePicker({ value, onChange, language }: { value: string; onChange: (value: string) => void; language: Language }) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const matches = useMemo(() => {
    const clean = query.trim().toLowerCase();
    return countries.filter((country) => !clean || country.name.toLowerCase().includes(clean) || localizedCountryName(country.code, language).toLowerCase().includes(clean) || country.dial.includes(clean) || country.code.toLowerCase().includes(clean));
  }, [query, language]);
  const selected = countries.find((country) => country.dial === value) ?? countries[0];
  return <div className="country-control">
    <input id="phone-country-code" className="country-search phone-dial" type="text" value={open ? query : `${selected.code} ${selected.dial}`} role="combobox" aria-label={t(language, "callingCode")} aria-expanded={open} aria-controls="dial-options" autoComplete="off" onFocus={() => { setQuery(""); setOpen(true); }} onChange={(event) => { setQuery(event.target.value); setOpen(true); }} onKeyDown={(event) => {
      if (event.key === "Escape") setOpen(false);
      if (event.key === "Enter" && open && matches[0]) { event.preventDefault(); onChange(matches[0].dial); setQuery(matches[0].dial); setOpen(false); }
    }}/>
    {!open && <span style={{ position: "absolute", top: 15, left: 10, pointerEvents: "none" }}><CountryFlag country={selected} small/></span>}
     {open && <div className="country-options" role="listbox" id="dial-options">{matches.slice(0, 60).map((country) => <button type="button" role="option" aria-selected={value === country.dial} className="country-option" key={country.code} onClick={() => { onChange(country.dial); setQuery(country.dial); setOpen(false); }}><CountryFlag country={country} small/><span>{localizedCountryName(country.code, language)}</span><small className="muted"> {country.dial}</small></button>)}{matches.length > 60 && <div className="country-option muted" aria-live="polite">{t(language, "narrowCountryList")}</div>}</div>}
  </div>;
}

export function EnquiryForm({ language, initialService }: EnquiryFormProps) {
  const [values, setValues] = useState<FormValues>({ ...emptyForm, language, service_interest: initialService ?? "" });
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [phoneValue, setPhoneValue] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [existingCompanyAnswered, setExistingCompanyAnswered] = useState(false);
  const inFlight = useRef(false);
  const formTitle = useRef<HTMLHeadingElement>(null);
  const update = (key: keyof FormValues, value: FormValues[keyof FormValues]) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => { const next = { ...current }; delete next[key]; return next; });
  };
  useEffect(() => { setValues((current) => ({ ...current, language })); }, [language]);
  useEffect(() => { if (initialService) setValues((current) => ({ ...current, service_interest: initialService })); }, [initialService]);
  useEffect(() => { formTitle.current?.focus(); }, [step]);
  const serviceLabelKeys: Record<string, string> = { "company-setup": "serviceTitle1", pvip: "serviceTitle2", mm2h: "serviceTitle3", banking: "serviceTitle4", "market-entry": "serviceTitle5", "corporate-structuring": "serviceTitle1", other: "other" };
  const serviceNames = serviceOptions.map(([id]) => [id, t(language, serviceLabelKeys[id] ?? "other")] as const);
  const businessOptions = [
    ["professional-services", "business1"], ["technology", "business2"], ["trade-distribution", "business3"],
    ["manufacturing", "business4"], ["hospitality-lifestyle", "business5"], ["holding-investment", "business6"], ["other", "other"],
  ] as const;
  const budgetOptions = [
    ["not-specified", "budget5"], ["under-10k", "budgetUnder10"], ["10k-50k", "budget10to50"],
    ["50k-100k", "budget50to100"], ["100k-250k", "budget100to250"], ["250k-plus", "budgetOver250"],
  ] as const;
  const countryLabel = (code: string) => {
    const country = countries.find((item) => item.code === code || item.name === code);
    return country ? localizedCountryName(country.code, language) : code;
  };
  const labelForService = (value: string) => serviceNames.find(([id]) => id === value)?.[1] ?? value;
  const businessLabel = (value: string) => {
    const option = businessOptions.find(([id]) => id === value);
    return option ? t(language, option[1]) : value;
  };
  const budgetLabel = (value: string) => t(language, ({
    "not-specified": "budget5", "under-10k": "budgetUnder10", "10k-50k": "budget10to50",
    "50k-100k": "budget50to100", "100k-250k": "budget100to250", "250k-plus": "budgetOver250",
  } as Record<string, string>)[value] ?? "budget5");
  const timelineLabel = (value: string) => t(language, ({
    immediately: "timeline1", "3-6-months": "timeline2", "6-12-months": "timeline3", exploring: "timeline4",
  } as Record<string, string>)[value] ?? "selectOption");
  const yesNoLabel = (value: boolean) => t(language, value ? "trueYes" : "trueNo");
  const interestLabel = (value: string) => value === "pvip" ? "PVIP" : value === "mm2h" ? "MM2H" : value === "other" ? t(language, "visaOther") : value === "no" ? t(language, "trueNo") : t(language, "selectOption");
  const bankingLabel = (value: string) => value === "yes" ? t(language, "trueYes") : value === "no" ? t(language, "trueNo") : t(language, "selectOption");
  const validateStep = (): boolean => {
    const nextErrors: Record<string, string> = {};
    const required = (field: keyof FormValues) => { if (!String(values[field] ?? "").trim()) nextErrors[field] = t(language, "fieldRequired"); };
    if (step === 0) {
      required("service_interest");
      required("timeline");
      required("business_type");
    } else if (step === 1) {
      required("country");
      required("nationality");
      if (!existingCompanyAnswered) nextErrors.has_existing_company = t(language, "companyAnswerRequired");
      if (values.has_existing_company) required("company_country");
    } else if (step === 2) {
      required("contact_preference");
    } else if (step === 3) {
      required("full_name");
      required("email");
      required("phone_number");
      if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) nextErrors.email = t(language, "invalidEmail");
      const digits = phoneValue.replace(/\D/g, "");
      if (phoneValue && (!/^[0-9 ()-]{5,24}$/.test(phoneValue) || digits.length < 5 || digits.length > 15)) {
        nextErrors.phone_number = t(language, "invalidPhone");
      }
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      window.setTimeout(() => document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(), 0);
      return false;
    }
    return true;
  };
  const goNext = (event: FormEvent) => { event.preventDefault(); setErrorMessage(""); if (!validateStep()) return; setStep((current) => Math.min(4, current + 1)); };
  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (honeypot.trim()) return;
    if (inFlight.current || !validateStep()) return;
    inFlight.current = true; setSending(true); setErrorMessage("");
    const query = new URLSearchParams(window.location.search);
    const payload: FormValues = {
      ...values,
      phone_number: phoneValue.trim(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
      utm_source: query.get("utm_source") || undefined,
      utm_medium: query.get("utm_medium") || undefined,
      utm_campaign: query.get("utm_campaign") || undefined,
    };
    try {
      if (!supabaseEnabled()) throw new Error(t(language, "unavailable"));
      await submitLead(payload);
      setSuccess(true);
    } catch (error) {
      void error;
      setErrorMessage(t(language, "unavailable"));
    } finally {
      inFlight.current = false; setSending(false);
    }
  };
  const setBool = (field: "has_existing_company", event: ChangeEvent<HTMLInputElement>) => update(field, event.target.value === "yes");
  if (success) return <div className="success-state" role="status" aria-live="polite"><div className="success-mark" aria-hidden="true">✓</div><h1>{t(language, "formReceivedTitle")}</h1><p className="muted">{t(language, "formReceivedBody")}</p><a href="/" className="button button-outline">{t(language, "returnHome")}</a></div>;
  return <div className="funnel-page">
    <div className="narrow funnel-top"><span className="eyebrow">{t(language, "stepProgress")} {step + 1} / 5 · {t(language, steps[step])}</span><div className="funnel-steps" aria-label={`${t(language, "stepProgress")} ${step + 1} of 5`}>{steps.map((_, index) => <span key={index} style={{ display: "contents" }}><span className={`step-dot ${index === step ? "active" : index < step ? "done" : ""}`} aria-current={index === step ? "step" : undefined}>{index < step ? "✓" : index + 1}</span>{index < 4 && <span className="step-line"/>}</span>)}</div></div>
    <div className="funnel-card" dir={language === "ar" ? "rtl" : "ltr"}>
      <span className="eyebrow">{t(language, "brandLabel")}</span>
      <h1 ref={formTitle} tabIndex={-1}>{t(language, "startTitle")}</h1><p>{t(language, "startLead")}</p>
      {!supabaseEnabled() && <div className="config-notice" role="status">{t(language, "backendNotConfigured")}</div>}
      <form onSubmit={step < 4 ? goNext : handleSubmit} noValidate>
        <label className="form-honeypot" aria-hidden="true">Website<input tabIndex={-1} autoComplete="off" name="website" value={honeypot} onChange={(event) => setHoneypot(event.target.value)}/></label>
        {step === 0 && <div className="form-grid">
          <div className="field full"><label htmlFor="service-interest">{t(language, "serviceQuestion")} <span>*</span></label><select id="service-interest" value={values.service_interest} aria-invalid={Boolean(errors.service_interest)} aria-describedby={errors.service_interest ? "service-error" : undefined} onChange={(event) => update("service_interest", event.target.value)}><option value="">{t(language, "selectOption")}</option>{serviceNames.map(([id, label]) => <option value={id} key={id}>{label}</option>)}</select>{errors.service_interest && <span id="service-error" className="field-error" role="alert">{errors.service_interest}</span>}</div>
          <div className="field"><label htmlFor="business-type">{t(language, "businessTypeQuestion")} <span>*</span></label><select id="business-type" value={values.business_type} aria-invalid={Boolean(errors.business_type)} onChange={(event) => update("business_type", event.target.value)}><option value="">{t(language, "selectOption")}</option>{businessOptions.map(([value, key]) => <option value={value} key={value}>{t(language, key)}</option>)}</select>{errors.business_type && <span className="field-error" role="alert">{errors.business_type}</span>}</div>
          <div className="field"><label htmlFor="budget">{t(language, "budgetQuestion")}</label><select id="budget" value={values.estimated_budget} onChange={(event) => update("estimated_budget", event.target.value as FormValues["estimated_budget"])}>{budgetOptions.map(([value, key]) => <option value={value} key={value}>{t(language, key)}</option>)}</select></div>
          <div className="field full"><label htmlFor="timeline">{t(language, "timelineQuestion")} <span>*</span></label><select id="timeline" value={values.timeline} aria-invalid={Boolean(errors.timeline)} aria-describedby={errors.timeline ? "timeline-error" : undefined} onChange={(event) => update("timeline", event.target.value)}><option value="">{t(language, "selectOption")}</option>{[["immediately", "timeline1"], ["3-6-months", "timeline2"], ["6-12-months", "timeline3"], ["exploring", "timeline4"]].map(([value, key]) => <option value={value} key={value}>{t(language, key)}</option>)}</select>{errors.timeline && <span id="timeline-error" className="field-error" role="alert">{errors.timeline}</span>}</div>
        </div>}
        {step === 1 && <div className="form-grid">
          <CountryPicker id="residence-country" label={t(language, "residenceQuestion")} value={values.country} onChange={(value) => update("country", value)} error={errors.country} language={language}/>
          <CountryPicker id="nationality" label={t(language, "nationalityQuestion")} value={values.nationality} onChange={(value) => update("nationality", value)} error={errors.nationality} language={language}/>
          <div className="field full"><span id="existing-company-label">{t(language, "existingQuestion")} <span>*</span></span><div className="choice-grid" role="radiogroup" aria-labelledby="existing-company-label" aria-invalid={Boolean(errors.has_existing_company)}>{[[true, "trueYes"], [false, "trueNo"]].map(([value, label]) => <div className="choice" key={String(value)}><input type="radio" id={`company-${value}`} name="existing-company" value={value ? "yes" : "no"} checked={existingCompanyAnswered && values.has_existing_company === value} aria-invalid={Boolean(errors.has_existing_company)} onChange={(event) => { setExistingCompanyAnswered(true); setBool("has_existing_company", event); }}/><label htmlFor={`company-${value}`}>{t(language, label as string)}</label></div>)}</div>{errors.has_existing_company && <span className="field-error" role="alert">{errors.has_existing_company}</span>}</div>
          {values.has_existing_company && <CountryPicker id="company-country" label={t(language, "companyCountryQuestion")} value={values.company_country} onChange={(value) => update("company_country", value)} error={errors.company_country} language={language}/>}
          <div className="field full"><label htmlFor="business-stage">{t(language, "businessStage")} <span>*</span></label><select id="business-stage" value={values.business_stage} onChange={(event) => update("business_stage", event.target.value as FormValues["business_stage"])}><option value="exploring">{t(language, "stageExploring")}</option><option value="planning">{t(language, "stagePlanning")}</option><option value="operating">{t(language, "stageOperating")}</option><option value="expanding">{t(language, "stageExpanding")}</option><option value="other">{t(language, "other")}</option></select></div>
        </div>}
        {step === 2 && <div className="form-grid">
          <div className="field full"><label htmlFor="visa-interest">{t(language, "visaQuestion")}</label><select id="visa-interest" value={values.visa_interest} onChange={(event) => update("visa_interest", event.target.value as FormValues["visa_interest"])}><option value="not-specified">{t(language, "selectOption")}</option><option value="pvip">PVIP</option><option value="mm2h">MM2H</option><option value="other">{t(language, "visaOther")}</option><option value="no">{t(language, "trueNo")}</option></select></div>
          <div className="field full"><label htmlFor="banking-interest">{t(language, "bankingQuestion")}</label><select id="banking-interest" value={values.banking_interest} onChange={(event) => update("banking_interest", event.target.value as FormValues["banking_interest"])}><option value="not-specified">{t(language, "selectOption")}</option><option value="yes">{t(language, "trueYes")}</option><option value="no">{t(language, "trueNo")}</option></select></div>
          <div className="field full"><label htmlFor="contact-preference">{t(language, "contactPreferenceQuestion")} <span>*</span></label><select id="contact-preference" value={values.contact_preference} aria-invalid={Boolean(errors.contact_preference)} aria-describedby={errors.contact_preference ? "contact-preference-error" : undefined} onChange={(event) => update("contact_preference", event.target.value)}><option value="">{t(language, "selectOption")}</option>{[["email", "prefEmail"], ["phone", "prefPhone"], ["whatsapp", "prefMessaging"], ["video", "prefVideo"]].map(([value, key]) => <option value={value} key={value}>{t(language, key)}</option>)}</select>{errors.contact_preference && <span id="contact-preference-error" className="field-error" role="alert">{errors.contact_preference}</span>}</div>
        </div>}
        {step === 3 && <div className="form-grid">
          <div className="field full"><label htmlFor="full-name">{t(language, "fullName")} <span>*</span></label><input id="full-name" type="text" autoComplete="name" required value={values.full_name} aria-invalid={Boolean(errors.full_name)} aria-describedby={errors.full_name ? "full-name-error" : undefined} onChange={(event) => update("full_name", event.target.value)} placeholder={t(language, "namePlaceholder")}/>{errors.full_name && <span id="full-name-error" className="field-error" role="alert">{errors.full_name}</span>}</div>
          <div className="field full"><label htmlFor="email">{t(language, "emailAddress")} <span>*</span></label><input id="email" type="email" autoComplete="email" required value={values.email} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "email-error" : undefined} onChange={(event) => update("email", event.target.value)} placeholder="name@example.com"/>{errors.email && <span id="email-error" className="field-error" role="alert">{errors.email}</span>}</div>
          <div className="field full"><label htmlFor="phone-country-code">{t(language, "phone")} <span>*</span></label><div style={{ display: "grid", gridTemplateColumns: "minmax(150px,.75fr) 1.25fr", gap: 8 }}>
            <PhoneCodePicker value={values.phone_country_code} onChange={(value) => update("phone_country_code", value)} language={language}/>
            <input id="phone-number" type="tel" autoComplete="tel-national" inputMode="tel" value={phoneValue} onChange={(event) => { setPhoneValue(event.target.value); update("phone_number", event.target.value); }} placeholder="12 345 6789" aria-label={t(language, "phone")} required aria-invalid={Boolean(errors.phone_number)}/>
          </div>{errors.phone_number && <span className="field-error" role="alert">{errors.phone_number}</span>}</div>
          <div className="field full"><label htmlFor="message">{t(language, "message")} <small>({t(language, "optional")})</small></label><textarea id="message" maxLength={2000} value={values.message ?? ""} onChange={(event) => update("message", event.target.value)} placeholder={t(language, "messagePlaceholder")}/><small className="muted">{(values.message ?? "").length}/2000</small></div>
          <p className="field full funnel-disclaimer">{t(language, "noUpload")}</p>
        </div>}
        {step === 4 && <div><p>{t(language, "reviewNote")}</p><div className="review-list">
          {[
            [t(language, "serviceQuestion"), labelForService(values.service_interest)],
            [t(language, "residenceQuestion"), countryLabel(values.country)],
            [t(language, "nationalityQuestion"), countryLabel(values.nationality)],
            [t(language, "businessStage"), t(language, `stage${values.business_stage.charAt(0).toUpperCase()}${values.business_stage.slice(1)}`)],
            [t(language, "businessTypeQuestion"), businessLabel(values.business_type)],
            [t(language, "existingQuestion"), `${yesNoLabel(values.has_existing_company)}${values.company_country ? ` · ${countryLabel(values.company_country)}` : ""}`],
            [t(language, "budgetQuestion"), budgetLabel(values.estimated_budget)],
            [t(language, "timelineQuestion"), timelineLabel(values.timeline)],
            [t(language, "visaQuestion"), interestLabel(values.visa_interest)],
            [t(language, "bankingQuestion"), bankingLabel(values.banking_interest)],
            [t(language, "contactPreferenceQuestion"), t(language, values.contact_preference === "email" ? "prefEmail" : values.contact_preference === "phone" ? "prefPhone" : values.contact_preference === "whatsapp" ? "prefMessaging" : "prefVideo")],
            [t(language, "fullName"), values.full_name], [t(language, "emailAddress"), values.email], [t(language, "phone"), `${values.phone_country_code} ${phoneValue}`],
            ...(values.message ? [[t(language, "message"), values.message] as [string, string]] : []),
          ].map(([label, value]) => <div className="review-row" key={label}><span>{label}</span><strong>{value || "—"}</strong></div>)}
        </div><p className="funnel-disclaimer">{t(language, "noUpload")}</p></div>}
        {errorMessage && <div className="form-message" role="alert">{errorMessage}</div>}
        <div className="form-actions">
          {step > 0 ? <button type="button" className="button button-outline" onClick={() => { setErrorMessage(""); setStep((current) => current - 1); }}>{t(language, "back")}</button> : <span/>}
          {step < 4 ? <button type="submit" className="button">{t(language, "next")} <span className="arrow">→</span></button> : <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}><button type="button" className="button-text" onClick={() => setStep(3)}>{t(language, "editDetails")}</button><button type="submit" className="button" disabled={sending || !supabaseEnabled()}>{sending ? t(language, "saving") : !supabaseEnabled() ? t(language, "submissionUnavailable") : t(language, "submit")}</button></div>}
        </div>
      </form>
    </div>
  </div>;
}
