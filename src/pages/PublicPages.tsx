import { useState } from "react";
import type { Language } from "../lib/types";
import { t } from "../lib/i18n";
import { useTimezoneGreeting } from "../components/SiteShell";
import { AdSlot } from "../ads/AdSlot";

interface PageProps { language: Language }

const serviceItems = [
  { path: "/company-setup", no: "01", title: "Company setup & structuring", copy: "Explore an appropriate company structure, formation considerations and the practical steps around establishing a Malaysian presence." },
  { path: "/pvip", no: "02", title: "PVIP coordination", copy: "Understand the published programme framework and coordinate enquiries with appropriate independent professionals." },
  { path: "/mm2h", no: "03", title: "MM2H coordination", copy: "Consider MM2H programme information and organise conversations with suitable independent advisers." },
  { path: "/banking", no: "04", title: "Banking introductions", copy: "Prepare for conversations about account requirements and potential institutional introductions, subject to each bank's own review." },
  { path: "/market-entry", no: "05", title: "Market entry", copy: "Map your early questions around local context, operating models, and potential professional support." },
  { path: "/services", no: "06", title: "Relocation & local setup", copy: "Bring business, relocation and practical establishment considerations into one well-sequenced plan." },
];

const process = [
  ["01", "Listen first", "A focused conversation to understand your plans, timing and constraints."],
  ["02", "Map the options", "We outline considerations and possible routes without promising an outcome."],
  ["03", "Coordinate carefully", "Where appropriate, we help organise discussions with independent professionals."],
  ["04", "Move at your pace", "You choose whether and how to proceed. The decision remains yours."],
];

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
        <div className="hero-meta"><span>Kuala Lumpur time</span><span>Independent coordination</span></div>
      </div>
      <div className="hero-art" aria-label="Abstract topographic illustration of the region">
        <div className="map-lines" aria-hidden="true" /><span className="map-pin" aria-hidden="true" /><span className="map-label">Kuala Lumpur</span>
        <div className="map-card"><small>Latitude / Longitude</small><strong>3° 08′ N<br/>101° 41′ E</strong><span>Peninsular Malaysia</span></div>
        <span className="map-coordinate">SOUTHEAST ASIA · 03.1390° N / 101.6869° E</span>
      </div>
    </section>
    <section className="container home-intro">
      <div><span className="eyebrow">A measured way forward</span><h2 className="section-title">{t(language, "understandNeeds")}</h2></div>
      <div className="intro-right"><span className="intro-index">01 / CONTEXT BEFORE CHECKLISTS</span><p>{t(language, "introBody")}</p><div className="intro-foot"><div className="mini-metric"><b>Local context</b><span>With an international lens</span></div><div className="mini-metric"><b>Clear boundaries</b><span>No outcome promises</span></div></div></div>
    </section>
    <section className="services-band"><div className="container">
      <div className="band-heading"><div><span className="eyebrow">{t(language, "servicesEyebrow")}</span><h2 className="section-title">{t(language, "servicesTitle")}</h2></div><a href="/services" className="button button-outline">{t(language, "viewAllServices")} <span className="arrow">→</span></a></div>
      <div className="service-grid">{serviceItems.map((service) => <article className="service-card" key={service.no}>
        <span className="service-num">{service.no} / MERIDIAN</span><h3>{service.title}</h3><p>{service.copy}</p><a href={service.path}>Explore the scope <span className="arrow">→</span></a>
      </article>)}</div>
    </div></section>
    <section className="context-section"><div className="container context-grid">
      <div className="context-art" aria-hidden="true"><span className="context-tag one">ASEAN connection</span><span className="context-tag two">Regional access</span><div className="context-ring">Malaysia<small>the context</small></div><span className="context-tag three">Commercial depth</span><span className="context-tag four">Multilingual region</span></div>
      <div className="context-copy"><span className="eyebrow">{t(language, "malaysiaEyebrow")}</span><h2 className="section-title">{t(language, "malaysiaTitle")}</h2><p>{t(language, "malaysiaBody")}</p><ul className="context-list"><li>Understand local requirements before choosing a route.</li><li>Consider business and relocation needs together.</li><li>Bring the right independent experts into the conversation.</li></ul><a href="/market-entry" className="button-text" style={{ display: "inline-block", marginTop: 18 }}>Explore market entry <span className="arrow">→</span></a></div>
    </div></section>
    <section className="process-section"><div className="container">
      <div className="process-head"><span className="eyebrow">{t(language, "processEyebrow")}</span><h2 className="section-title">{t(language, "processTitle")}</h2><p className="lead">No pressure to proceed. Start by understanding the choices and the edges of each one.</p></div>
      <div className="process-steps">{process.map(([no, title, copy]) => <article className="process-step" key={no}><b>{no} /</b><h3>{title}</h3><p>{copy}</p></article>)}</div>
    </div></section>
    <section className="faq-block"><div className="container faq-layout">
      <div><span className="eyebrow">{t(language, "faqEyebrow")}</span><h2 className="section-title">{t(language, "faqTitle")}</h2><p className="muted">A few useful boundaries, up front.</p></div>
      <FAQList language={language} compact />
    </div></section>
    <CTA language={language}/>
  </>;
}

export function ServicesPage({ language }: PageProps) {
  return <>
    <section className="page-hero"><div className="container"><span className="eyebrow">{t(language, "servicesEyebrow")}</span><h1 className="display">{t(language, "servicesTitle")}</h1><p className="lead">{t(language, "servicesIntro")}</p><div className="page-meta"><span>Business · Relocation · Coordination</span><span>Malaysia</span></div></div></section>
    <section className="container content-section" style={{ borderTop: 0 }}><div className="service-grid" style={{ borderColor: "hsl(var(--line))" }}>{serviceItems.map((service) => <article className="service-card" key={service.no} style={{ color: "hsl(var(--ink))", borderColor: "hsl(var(--line))" }}><span className="service-num">{service.no} / SCOPE</span><h3>{service.title}</h3><p style={{ color: "hsl(var(--muted))" }}>{service.copy}</p><a href={service.path} style={{ color: "hsl(var(--forest))" }}>Read more <span className="arrow">→</span></a></article>)}</div></section>
    <CTA language={language}/>
  </>;
}

const details: Record<string, { eyebrow: string; title: string; lead: string; section: string; body: string; list: string[]; note: string }> = {
  "/company-setup": {
    eyebrow: "Company formation & structuring", title: "A sound structure starts with the right questions.",
    lead: "Understand the practical considerations around a Malaysian company presence, before committing to a setup.",
    section: "Start with the shape of the business.", body: "The right structure depends on what the business will do, where decisions will be made, who will own it and what your plans are for the region. We help map those questions and coordinate the relevant conversations.",
    list: ["Clarify the proposed activity, ownership and operating footprint.", "Consider basic formation sequence and information requirements.", "Coordinate independent legal, tax or company-secretarial advice where needed."],
    note: "Registration and regulatory determinations are made by the relevant authorities. We facilitate and share information; we do not provide legal or tax advice or guarantee an outcome.",
  },
  "/pvip": {
    eyebrow: "Long-term residency information", title: "PVIP, considered carefully.",
    lead: "A clear introduction to programme information and practical questions around the Premium Visa Programme.",
    section: "Information before application.", body: "Eligibility, terms and administrative requirements can change. We help you organise your questions around current public information and, where appropriate, coordinate a conversation with an independent immigration professional.",
    list: ["Understand that programme criteria and decisions sit with the relevant authorities.", "Review the questions to discuss with a suitably qualified independent adviser.", "Coordinate next-step conversations only where appropriate."],
    note: "We are not an immigration authority or law firm. A visa or residency approval cannot be promised or guaranteed.",
  },
  "/mm2h": {
    eyebrow: "Residency programme information", title: "Make room for an informed MM2H decision.",
    lead: "Explore public programme information and organise a sensible conversation about long-stay planning.",
    section: "Your circumstances come first.", body: "MM2H terms and categories may change, and personal suitability depends on the requirements in force when you apply. Start with your objectives, timing and the questions you need an independent expert to answer.",
    list: ["Identify the lifestyle and timing questions that matter to your plans.", "Prepare to discuss programme requirements with an independent professional.", "Coordinate information and conversations without representing an official programme."],
    note: "We provide information and coordination only. We are not affiliated with programme administrators and cannot guarantee approval.",
  },
  "/banking": {
    eyebrow: "Banking introductions", title: "Prepare for a banking conversation.",
    lead: "Understand the questions institutions may ask and approach discussions with clearer expectations.",
    section: "A bank makes its own assessment.", body: "Account opening, services and requirements are determined entirely by each financial institution. We can help organise an introduction or clarify general preparation questions where possible, without representing a bank or intermediary.",
    list: ["Clarify your intended use, business activity and operating geography.", "Prepare a concise description of the proposed business or personal needs.", "Understand that institutions apply their own due diligence and acceptance criteria."],
    note: "No banking partner or account outcome is represented or promised. Financial institutions make all decisions independently.",
  },
  "/market-entry": {
    eyebrow: "Market entry & local context", title: "Take the time to understand the market.",
    lead: "Bring local context, operating questions and professional conversations into one thoughtful early plan.",
    section: "A better first map.", body: "Early market questions can shape a company's structure, local operating model and timing. A disciplined first review gives you a more useful basis for deciding what to investigate next.",
    list: ["Define the customer, operating model and reason for entering Malaysia.", "Identify the local questions that need independent research or advice.", "Coordinate early conversations with relevant service providers where appropriate."],
    note: "Market context is not a substitute for legal, tax, financial or regulatory advice. Decisions and outcomes remain yours and those of the relevant authorities.",
  },
};

export function ServiceDetailPage({ language, path }: PageProps & { path: string }) {
  const detail = details[path];
  if (!detail) return <ServicesPage language={language}/>;
  return <>
    <section className="page-hero"><div className="container"><span className="eyebrow">{detail.eyebrow}</span><h1 className="display">{detail.title}</h1><p className="lead">{detail.lead}</p><div className="page-meta"><span>Information · Facilitation · Coordination</span><span>Malaysia</span></div></div></section>
    <section className="container service-detail-grid">
      <div className="detail-copy"><h2>{detail.section}</h2><p>{detail.body}</p><h3>Questions to bring into the conversation</h3><ul className="detail-list">{detail.list.map((item, index) => <li key={item}><span>0{index + 1}</span><span>{item}</span></li>)}</ul></div>
      <aside className="side-note"><span className="eyebrow">A clear boundary</span><h3>Know what is — and isn't — in scope.</h3><p>{detail.note}</p><a className="button" href="/start">Discuss your plans <span className="arrow">→</span></a></aside>
    </section>
    <section className="content-section"><div className="container"><h2>Clarity is useful at every stage.</h2><p>Whether you are gathering information or preparing to act, the right conversation begins with your objectives and an honest view of the relevant requirements. No step is taken without your direction.</p></div></section>
    <AdSlot language={language}/>
    <CTA language={language}/>
  </>;
}

export function FAQPage({ language }: PageProps) {
  return <><section className="page-hero"><div className="container"><span className="eyebrow">{t(language, "faqEyebrow")}</span><h1 className="display">{t(language, "faqTitle")}</h1><p className="lead">A clear view of our role and the decisions that remain with institutions, authorities and you.</p></div></section><section className="faq-page-list container"><FAQList language={language}/></section><CTA language={language}/></>;
}

export function ContactPage({ language }: PageProps) {
  return <><section className="page-hero"><div className="container"><span className="eyebrow">{t(language, "contact")}</span><h1 className="display">{t(language, "contactTitle")}</h1><p className="lead">{t(language, "contactLead")}</p></div></section><section className="container contact-grid">
    <aside className="contact-side"><h2>Start with a few details.</h2><p>Share a little about the support you are looking for. The enquiry form is designed to collect only what helps us understand your plans.</p><div className="contact-method"><small>Private by design</small><strong>No document uploads</strong></div><div className="contact-method"><small>Our role</small><strong>Information & coordination</strong></div><p>{t(language, "noClaims")}</p></aside>
    <div className="side-note"><span className="eyebrow">A measured first step</span><h3>Put the outline on the table.</h3><p>The short enquiry will ask about your service interest, business situation and preferred way for us to respond. You can review everything before sending.</p><a className="button" href="/start">{t(language, "beginEnquiry")} <span className="arrow">→</span></a></div>
  </section><CTA language={language}/></>;
}

const legalSections = {
  "/privacy": {
    title: "Privacy notice",
    body: [
      ["Information you choose to share", "When you submit an enquiry, we collect the information you provide in the form, including contact details and information about your business or relocation plans. Do not provide identity documents or sensitive personal data through the enquiry form."],
      ["How information is used", "Information is used to review and respond to an enquiry, coordinate the requested conversation and maintain appropriate operational records. It should not be used for a separate purpose without an appropriate notice or legal basis."],
      ["Storage and access", "Enquiry information is stored using the systems configured for this website and is accessible only to authorised personnel for relevant purposes. Technical, retention and access controls depend on the production deployment."],
      ["Your choices", "You may ask to review, correct or request deletion of information you have submitted, subject to applicable law and legitimate record-keeping needs. Use the contact route on this site to make a request."],
      ["Browser preferences and measurement", "The site stores your selected language and appearance preference in your browser when storage is available. When the secure event store is configured, page, language and timezone metadata may be recorded for site measurement. No geolocation is used, and measurement does not affect access to the core site."],
    ],
  },
  "/terms": {
    title: "Terms of use",
    body: [
      ["Information, not professional advice", "Website material is general information only. It is not legal, tax, financial, immigration or regulatory advice and should not be relied on as a substitute for independent professional advice."],
      ["Scope of service", "Meridian Malaysia's role is limited to information, facilitation and coordination. Any independent adviser, service provider, financial institution or authority acts independently and is responsible for its own services and decisions."],
      ["No guaranteed outcomes", "No company registration, regulatory permission, visa, residency status, bank account or other institutional decision is guaranteed. Requirements and policies may change."],
      ["Your responsibilities", "You are responsible for ensuring that information you provide is accurate and for obtaining the advice and approvals appropriate to your circumstances."],
      ["Changes and availability", "Website content may be updated or withdrawn without notice. We do not warrant uninterrupted availability or that all information will remain current."],
    ],
  },
  "/disclaimer": {
    title: "Disclaimer",
    body: [
      ["Independent facilitation", "Meridian Malaysia provides information, facilitation and coordination only. It is not a government authority, bank, law firm, immigration adviser or tax adviser, and no affiliation with such bodies is implied."],
      ["No representation or guarantee", "We do not represent that any registration, visa, residency, banking or regulatory outcome will be achieved. Decisions are made solely by the relevant authority or institution under its own criteria."],
      ["Independent advice", "Laws, programme conditions and institutional requirements can change and may apply differently to each person. Obtain advice from an appropriately qualified independent professional before making decisions."],
      ["External links and providers", "References to third-party providers or external resources are for information and coordination purposes. Their inclusion is not an endorsement or guarantee of their services."],
      ["Use of information", "You remain responsible for decisions made using information on this website and for confirming current requirements with the relevant authority or professional."],
    ],
  },
};

export function LegalPage({ path }: PageProps & { path: string }) {
  const page = legalSections[path as keyof typeof legalSections];
  if (!page) return null;
  return <article className="container legal-page"><span className="eyebrow">Meridian Malaysia · Public information</span><h1>{page.title}</h1><p className="legal-updated">Public information · Read carefully before proceeding</p><div className="legal-content">{page.body.map(([title, copy]) => <section key={title}><h2>{title}</h2><p>{copy}</p></section>)}</div></article>;
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

