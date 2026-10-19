import { useState } from "react";
import type { Language } from "../lib/types";
import { t } from "../lib/i18n";
import { serviceContent } from "../lib/serviceContent";
import { useTimezoneGreeting } from "../components/SiteShell";
import { AdSlot } from "../ads/AdSlot";

interface PageProps { language: Language }

const serviceItems = [
  { path: "/company-setup", no: "01", titleKey: "serviceTitle1", copyKey: "serviceCopy1" },
  { path: "/pvip", no: "02", titleKey: "serviceTitle2", copyKey: "serviceCopy2" },
  { path: "/mm2h", no: "03", titleKey: "serviceTitle3", copyKey: "serviceCopy3" },
  { path: "/banking", no: "04", titleKey: "serviceTitle4", copyKey: "serviceCopy4" },
  { path: "/market-entry", no: "05", titleKey: "serviceTitle5", copyKey: "serviceCopy5" },
  { path: "/services", no: "06", titleKey: "serviceTitle6", copyKey: "serviceCopy6" },
] as const;

const process = [
  ["01", "processStep1", "processCopy1"],
  ["02", "processStep2", "processCopy2"],
  ["03", "processStep3", "processCopy3"],
  ["04", "processStep4", "processCopy4"],
] as const;

export function FAQList({ language, compact = false }: PageProps & { compact?: boolean }) {
  const [opened, setOpened] = useState<number | null>(0);
  const questions = [[t(language, "faqA1"), t(language, "faqB1")], [t(language, "faqA2"), t(language, "faqB2")], [t(language, "faqA3"), t(language, "faqB3")], [t(language, "faqA4"), t(language, "faqB4")]];
  return <div className="faq-list">{questions.map(([question, answer], index) => <div className="faq-item" key={question} aria-expanded={opened === index}>
    <button className="faq-q" aria-expanded={opened === index} onClick={() => setOpened(opened === index ? null : index)}>
      {question}<span className="faq-plus" aria-hidden="true">+</span>
    </button>{opened === index && <div className="faq-answer">{answer}</div>}
  </div>)}
    {compact && <a className="button-text" style={{ display: "inline-block", marginTop: 21 }} href="/faq">{t(language, "moreQuestions")} <span className="arrow">→</span></a>}
  </div>;
}

function CTA({ language }: PageProps) {
  return <section className="cta-panel"><div className="container cta-content">
    <span className="eyebrow">{t(language, "ctaEyebrow")}</span>
    <h2>{t(language, "ctaTitle")}</h2><p>{t(language, "ctaBody")}</p>
    <div className="hero-actions"><a href="/start" className="button">{t(language, "beginEnquiry")} <span className="arrow">→</span></a><a href="/contact" className="button button-outline">{t(language, "contactUs")}</a></div>
  </div></section>;
}

export function HomePage({ language, publicContent = {} }: PageProps & { publicContent?: Record<string, string> }) {
  const greeting = useTimezoneGreeting(language);
  return <>
    <section className="hero">
      <div className="hero-copy">
        <span className="eyebrow">{greeting} · {t(language, "greeting")}</span>
        <h1 className="display">{publicContent["home.hero.title"] || t(language, "proposition")}</h1>
        <p className="lead">{publicContent["home.hero.description"] || t(language, "heroLead")}</p>
        <div className="hero-actions"><a href="/start" className="button">{t(language, "getStarted")} <span className="arrow">→</span></a><a href="/services" className="button button-outline">{t(language, "exploreServices")}</a></div>
        <div className="hero-meta"><span>{t(language, "heroTime")}</span><span>{t(language, "heroCoordination")}</span></div>
      </div>
      <div className="hero-art" aria-label={t(language, "heroArtAlt")}>
        <div className="map-lines" aria-hidden="true" /><span className="map-pin" aria-hidden="true" /><span className="map-label">Kuala Lumpur</span>
        <div className="map-card"><small>3° 08′ N · 101° 41′ E</small><strong>{t(language, "tagMalaysia")}</strong><span>Malaysia</span></div>
        <span className="map-coordinate">03.1390° N / 101.6869° E</span>
      </div>
    </section>
    <section className="container home-intro">
      <div><span className="eyebrow">{t(language, "introEyebrow")}</span><h2 className="section-title">{t(language, "understandNeeds")}</h2></div>
      <div className="intro-right"><span className="intro-index">01 / {t(language, "introIndex")}</span><p>{t(language, "introBody")}</p><div className="intro-foot"><div className="mini-metric"><b>{t(language, "localContext")}</b><span>{t(language, "internationalView")}</span></div><div className="mini-metric"><b>{t(language, "clearBoundaries")}</b><span>{t(language, "noOutcomePromises")}</span></div></div></div>
    </section>
    <section className="services-band"><div className="container">
      <div className="band-heading"><div><span className="eyebrow">{t(language, "servicesEyebrow")}</span><h2 className="section-title">{t(language, "servicesTitle")}</h2></div><a href="/services" className="button button-outline">{t(language, "viewAllServices")} <span className="arrow">→</span></a></div>
      <div className="service-grid">{serviceItems.map((service) => <article className="service-card" key={service.no}>
        <span className="service-num">{service.no} / {t(language, "serviceNumber")}</span><h3>{t(language, service.titleKey)}</h3><p>{t(language, service.copyKey)}</p><a href={service.path}>{t(language, "serviceReadMore")} <span className="arrow">→</span></a>
      </article>)}</div>
    </div></section>
    <section className="context-section"><div className="container context-grid">
      <div className="context-art" aria-hidden="true"><span className="context-tag one">{t(language, "tagAsean")}</span><span className="context-tag two">{t(language, "tagRegional")}</span><div className="context-ring">{t(language, "tagMalaysia")}<small>{t(language, "tagContext")}</small></div><span className="context-tag three">{t(language, "tagBusiness")}</span><span className="context-tag four">{t(language, "tagLanguages")}</span></div>
      <div className="context-copy"><span className="eyebrow">{t(language, "malaysiaEyebrow")}</span><h2 className="section-title">{t(language, "malaysiaTitle")}</h2><p>{t(language, "malaysiaBody")}</p><ul className="context-list"><li>{t(language, "contextPoint1")}</li><li>{t(language, "contextPoint2")}</li><li>{t(language, "contextPoint3")}</li></ul><a href="/market-entry" className="button-text" style={{ display: "inline-block", marginTop: 18 }}>{t(language, "contextExplore")} <span className="arrow">→</span></a></div>
    </div></section>
    <section className="process-section"><div className="container">
      <div className="process-head"><span className="eyebrow">{t(language, "processEyebrow")}</span><h2 className="section-title">{t(language, "processTitle")}</h2><p className="lead">{t(language, "processLead")}</p></div>
      <div className="process-steps">{process.map(([no, titleKey, copyKey]) => <article className="process-step" key={no}><b>{no} /</b><h3>{t(language, titleKey)}</h3><p>{t(language, copyKey)}</p></article>)}</div>
    </div></section>
    <section className="faq-block"><div className="container faq-layout">
      <div><span className="eyebrow">{t(language, "faqEyebrow")}</span><h2 className="section-title">{t(language, "faqTitle")}</h2><p className="muted">{t(language, "faqLead")}</p></div>
      <FAQList language={language} compact />
    </div></section>
    <CTA language={language}/>
  </>;
}

export function ServicesPage({ language }: PageProps) {
  return <>
    <section className="page-hero"><div className="container"><span className="eyebrow">{t(language, "servicesEyebrow")}</span><h1 className="display">{t(language, "servicesTitle")}</h1><p className="lead">{t(language, "servicesIntro")}</p><div className="page-meta"><span>{t(language, "servicePageMeta")}</span><span>{t(language, "tagMalaysia")}</span></div></div></section>
    <section className="container content-section" style={{ borderTop: 0 }}><div className="service-grid" style={{ borderColor: "hsl(var(--line))" }}>{serviceItems.map((service) => <article className="service-card" key={service.no} style={{ color: "hsl(var(--ink))", borderColor: "hsl(var(--line))" }}><span className="service-num">{service.no} / {t(language, "serviceNumber")}</span><h3>{t(language, service.titleKey)}</h3><p style={{ color: "hsl(var(--muted))" }}>{t(language, service.copyKey)}</p><a href={service.path} style={{ color: "hsl(var(--forest))" }}>{t(language, "serviceReadMore")} <span className="arrow">→</span></a></article>)}</div></section>
    <CTA language={language}/>
  </>;
}

export function ServiceDetailPage({ language, path }: PageProps & { path: string }) {
  const detail = serviceContent[language][path as keyof typeof serviceContent.en];
  if (!detail) return <ServicesPage language={language}/>;
  return <>
    <section className="page-hero"><div className="container"><span className="eyebrow">{detail.eyebrow}</span><h1 className="display">{detail.title}</h1><p className="lead">{detail.lead}</p><div className="page-meta"><span>{t(language, "servicePageMeta")}</span><span>{t(language, "tagMalaysia")}</span></div></div></section>
    <section className="container service-detail-grid">
      <div className="detail-copy"><h2>{detail.section}</h2><p>{detail.body}</p><h3>{t(language, "detailQuestions")}</h3><ul className="detail-list">{detail.points.map((point, index) => <li key={point}><span>0{index + 1}</span><span>{point}</span></li>)}</ul></div>
      <aside className="side-note"><span className="eyebrow">{t(language, "ourRole")}</span><p>{detail.boundary}</p><a className="button" href={`/start?service=${encodeURIComponent(path.slice(1))}`}>{t(language, "beginEnquiry")} <span className="arrow">→</span></a></aside>
    </section>
    <AdSlot language={language}/>
    <CTA language={language}/>
  </>;
}

export function FAQPage({ language }: PageProps) {
  return <><section className="page-hero"><div className="container"><span className="eyebrow">{t(language, "faqEyebrow")}</span><h1 className="display">{t(language, "faqTitle")}</h1><p className="lead">{t(language, "faqLead")}</p></div></section><section className="faq-page-list container"><FAQList language={language}/></section><CTA language={language}/></>;
}

export function ContactPage({ language }: PageProps) {
  return <><section className="page-hero"><div className="container"><span className="eyebrow">{t(language, "contact")}</span><h1 className="display">{t(language, "contactTitle")}</h1><p className="lead">{t(language, "contactLead")}</p></div></section><section className="container contact-grid">
    <aside className="contact-side"><h2>{t(language, "contactSideTitle")}</h2><p>{t(language, "contactSideBody")}</p><div className="contact-method"><small>{t(language, "privateByDesign")}</small><strong>{t(language, "noDocumentUploads")}</strong></div><div className="contact-method"><small>{t(language, "ourRole")}</small><strong>{t(language, "informationCoordination")}</strong></div><p>{t(language, "noClaims")}</p></aside>
    <div className="side-note"><span className="eyebrow">{t(language, "contactCardEyebrow")}</span><h3>{t(language, "contactCardTitle")}</h3><p>{t(language, "contactCardBody")}</p><a className="button" href="/start">{t(language, "beginEnquiry")} <span className="arrow">→</span></a></div>
  </section><CTA language={language}/></>;
}

const legalTypes: Record<string, "privacy" | "terms" | "disclaimer"> = {
  "/privacy": "privacy",
  "/terms": "terms",
  "/disclaimer": "disclaimer",
};

export function LegalPage({ language, path }: PageProps & { path: string }) {
  const type = legalTypes[path];
  if (!type) return null;
  const titleKey = type === "privacy" ? "titlePrivacy" : type === "terms" ? "titleTerms" : "titleDisclaimer";
  const sections = [1, 2, 3].map((number) => ({
    title: t(language, `${type}Section${number}`),
    copy: t(language, `${type}Text${number}`),
  }));
  return <article className="container legal-page"><span className="eyebrow">{t(language, "legalEyebrow")}</span><h1>{t(language, titleKey)}</h1><p className="legal-updated">{t(language, "legalUpdated")}</p><div className="legal-content">{sections.map(({ title, copy }) => <section key={title}><h2>{title}</h2><p>{copy}</p></section>)}</div></article>;
}

export function NotFoundPage({ language }: PageProps) {
  return <section className="not-found"><div><span className="error-code">404 / UNCHARTED</span><h1>{t(language, "notFoundTitle")}</h1><p>{t(language, "notFoundBody")}</p><a className="button" href="/">{t(language, "returnHome")} <span className="arrow">→</span></a></div></section>;
}

export const pageTitles: Record<string, string> = {
  "/": "Meridian Malaysia — Business & relocation gateway",
  "/services": "Services | Meridian Malaysia",
  "/company-setup": "Company setup & structuring | Meridian Malaysia",
  "/pvip": "PVIP coordination | Meridian Malaysia",
  "/mm2h": "MM2H coordination | Meridian Malaysia",
  "/banking": "Banking introductions | Meridian Malaysia",
  "/market-entry": "Market entry | Meridian Malaysia",
  "/start": "Start an enquiry | Meridian Malaysia",
  "/contact": "Contact | Meridian Malaysia",
  "/faq": "Frequently asked questions | Meridian Malaysia",
  "/privacy": "Privacy notice | Meridian Malaysia",
  "/terms": "Terms of use | Meridian Malaysia",
  "/disclaimer": "Disclaimer | Meridian Malaysia",
  "/admin-console-secure": "Secure administration | Meridian Malaysia",
};

export const pageDescriptions: Record<string, string> = {
  "/": "Your gateway to business in Malaysia. Explore company setup, market entry, relocation and independent coordination.",
  "/services": "Explore Meridian Malaysia's business facilitation and coordination services, including company setup, residency information and market entry.",
  "/company-setup": "Understand company formation and corporate structuring considerations for establishing a Malaysian presence.",
  "/pvip": "Explore public information and independent coordination for Malaysia's Premium Visa Programme. No approval is guaranteed.",
  "/mm2h": "Explore public information and independent coordination for Malaysia My Second Home programme enquiries.",
  "/banking": "Prepare for banking conversations in Malaysia. Financial institutions make their own independent decisions.",
  "/market-entry": "Map early operating questions and local context for entering the Malaysia market.",
  "/start": "Share your business and relocation plans through a private, step-by-step enquiry. No identity document uploads.",
  "/contact": "Contact Meridian Malaysia about company setup, relocation, market entry and business facilitation.",
  "/faq": "Answers about Meridian Malaysia's facilitation role, enquiry process and the limits of service outcomes.",
  "/privacy": "Learn what enquiry information Meridian Malaysia collects, how it is used, and your privacy choices.",
  "/terms": "Terms for using Meridian Malaysia's business facilitation and information website.",
  "/disclaimer": "Important limits on Meridian Malaysia's independent information, facilitation and coordination services.",
  "/admin-console-secure": "Private administration workspace for authorised Meridian Malaysia administrators.",
};

