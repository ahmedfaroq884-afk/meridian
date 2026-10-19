import { useEffect, useState } from "react";
import type { Language, ThemeChoice } from "./lib/types";
import { detectLanguage, t } from "./lib/i18n";
import { getPublicSettings, getPublicSiteContent, supabaseEnabled, track } from "./lib/supabase";
import { SiteShell } from "./components/SiteShell";
import { EnquiryForm } from "./components/EnquiryForm";
import { AdminConsole } from "./pages/AdminConsole";
import { ContactPage, FAQPage, HomePage, LegalPage, NotFoundPage, ServiceDetailPage, ServicesPage } from "./pages/PublicPages";
import type { SiteSetting, ContentRecord } from "./lib/types";
import { WhatsAppWidget } from "./components/WhatsAppWidget";

function getStoredTheme(): ThemeChoice {
  try {
    const saved = localStorage.getItem("meridian-theme");
    if (saved === "light" || saved === "dark" || saved === "system") return saved;
  } catch { /* use the public light theme when storage is unavailable */ }
  return "light";
}

type AnalyticsChoice = "accepted" | "declined" | null;

function getAnalyticsChoice(): AnalyticsChoice {
  try {
    const saved = localStorage.getItem("meridian-analytics-consent");
    return saved === "accepted" || saved === "declined" ? saved : null;
  } catch {
    return null;
  }
}

export default function App() {
  const [language, setLanguageState] = useState<Language>(detectLanguage);
  const [theme, setThemeState] = useState<ThemeChoice>(getStoredTheme);
  const [analyticsChoice, setAnalyticsChoice] = useState<AnalyticsChoice>(getAnalyticsChoice);
  const [publicContent, setPublicContent] = useState<Record<string, string>>({});
  const [publicSettings, setPublicSettings] = useState<Record<string, unknown>>({});
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  const titleKeyByPath: Record<string, string> = {
    "/": "seoHome", "/services": "seoServices", "/company-setup": "seoCompany", "/pvip": "seoPvip",
    "/mm2h": "seoMm2h", "/banking": "seoBanking", "/market-entry": "seoMarket", "/start": "seoStart",
    "/contact": "seoContact", "/faq": "seoFaq", "/privacy": "seoPrivacy", "/terms": "seoTerms",
    "/disclaimer": "seoDisclaimer", "/admin-console-secure": "seoAdmin",
  };
  const pageTitle = `${t(language, titleKeyByPath[path] ?? "notFoundTitle")} | Meridian Malaysia`;
  const pageDescription = t(language, "seoDescription");
  const setLanguage = (next: Language) => {
    setLanguageState(next);
    try { localStorage.setItem("meridian-language", next); } catch { /* preference remains for this session */ }
  };
  const setTheme = (next: ThemeChoice) => {
    setThemeState(next);
    try { localStorage.setItem("meridian-theme", next); } catch { /* preference remains for this session */ }
  };

  useEffect(() => {
    let active = true;
    if (!supabaseEnabled()) {
      setPublicContent({});
      setPublicSettings({});
      return () => { active = false; };
    }
    void Promise.all([getPublicSiteContent(language), getPublicSettings()])
      .then(([contentRows, settingsRows]: [ContentRecord[], SiteSetting[]]) => {
        if (!active) return;
        setPublicContent(Object.fromEntries(contentRows.map((record) => [record.content_key, record.content_value])));
        setPublicSettings(Object.fromEntries(settingsRows.map((setting) => [setting.setting_key, setting.setting_value])));
      })
      .catch(() => {
        if (active) {
          setPublicContent({});
          setPublicSettings({});
        }
      });
    return () => { active = false; };
  }, [language]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    const pathKey = path === "/" ? "home" : path.slice(1).replaceAll("/", ".");
    const settingString = (key: string) => {
      const value = publicSettings[key];
      if (typeof value === "string") return value;
      if (value && typeof value === "object" && "value" in value && typeof value.value === "string") return value.value;
      return "";
    };
    const resolvedTitle = settingString(`seo.${pathKey}.${language}.title`) || (language === "en" ? settingString(`seo.${pathKey}.title`) : "") || pageTitle;
    const resolvedDescription = settingString(`seo.${pathKey}.${language}.description`) || (language === "en" ? settingString(`seo.${pathKey}.description`) : "") || pageDescription;
    document.title = resolvedTitle;
    let description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!description) {
      description = document.createElement("meta");
      description.name = "description";
      document.head.appendChild(description);
    }
    description.content = resolvedDescription;
    const setMeta = (selector: string, attribute: "name" | "property", key: string, value: string) => {
      let meta = document.querySelector<HTMLMetaElement>(selector);
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute(attribute, key);
        document.head.appendChild(meta);
      }
      meta.content = value;
    };
    const descriptionText = settingString(`seo.${pathKey}.${language}.og_description`) || (language === "en" ? settingString(`seo.${pathKey}.og_description`) : "") || resolvedDescription;
    setMeta('meta[property="og:title"]', "property", "og:title", settingString(`seo.${pathKey}.${language}.og_title`) || (language === "en" ? settingString(`seo.${pathKey}.og_title`) : "") || resolvedTitle);
    setMeta('meta[property="og:description"]', "property", "og:description", descriptionText);
    const configuredCanonical = settingString("seo.canonical_url") || import.meta.env.VITE_SITE_URL || window.location.origin;
    let canonicalOrigin = window.location.origin;
    try {
      const url = new URL(configuredCanonical, window.location.origin);
      if (url.protocol === "https:" || url.hostname === "localhost" || url.hostname === "127.0.0.1") canonicalOrigin = url.origin;
    } catch {
      canonicalOrigin = window.location.origin;
    }
    const canonicalBase = canonicalOrigin.replace(/\/+$/, "");
    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = `${canonicalBase}${path === "/" ? "/" : path}`;
    const allowedRobots = new Set(["index,follow", "index,nofollow", "noindex,follow", "noindex,nofollow"]);
    const robotsSetting = settingString("seo.robots");
    setMeta('meta[name="robots"]', "name", "robots", allowedRobots.has(robotsSetting) ? robotsSetting : "index,follow");
  }, [language, pageDescription, pageTitle, path, publicSettings, theme]);

  useEffect(() => {
    if (!supabaseEnabled() || analyticsChoice !== "accepted" || path === "/admin-console-secure") return;
    const event = {
      event_type: "page_view",
      page: path,
      language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
      metadata: {},
    };
    void track(event).catch(() => undefined);
  }, [analyticsChoice, language, path]);

  const chooseAnalytics = (choice: Exclude<AnalyticsChoice, null>) => {
    setAnalyticsChoice(choice);
    try {
      localStorage.setItem("meridian-analytics-consent", choice);
    } catch {
      // Consent applies to this page session even if persistent storage is unavailable.
    }
  };

  const content = path === "/" ? <HomePage language={language} publicContent={publicContent}/> :
    path === "/services" ? <ServicesPage language={language}/> :
    ["/company-setup", "/pvip", "/mm2h", "/banking", "/market-entry"].includes(path) ? <ServiceDetailPage language={language} path={path}/> :
    path === "/start" ? <EnquiryForm language={language} initialService={new URLSearchParams(window.location.search).get("service") ?? undefined}/> :
    path === "/contact" ? <ContactPage language={language}/> :
    path === "/faq" ? <FAQPage language={language}/> :
    ["/privacy", "/terms", "/disclaimer"].includes(path) ? <LegalPage language={language} path={path}/> :
    path === "/admin-console-secure" ? <AdminConsole language={language} theme={theme} setTheme={setTheme}/> :
    <NotFoundPage language={language}/>;

  return <SiteShell language={language} setLanguage={setLanguage} theme={theme} setTheme={setTheme} currentPath={path}>
    {content}
    {path !== "/admin-console-secure" && <WhatsAppWidget phoneNumber={publicSettings["contact.whatsapp_number"]} language={language}/>}
    {supabaseEnabled() && analyticsChoice === null && path !== "/admin-console-secure" && <aside className="consent-banner" aria-label={t(language, "consentTitle")}>
      <div><strong>{t(language, "consentTitle")}</strong><p>{t(language, "consentBody")}</p></div>
      <div className="consent-actions">
        <button className="button button-outline" onClick={() => chooseAnalytics("declined")}>{t(language, "declineAnalytics")}</button>
        <button className="button" onClick={() => chooseAnalytics("accepted")}>{t(language, "acceptAnalytics")}</button>
      </div>
    </aside>}
  </SiteShell>;
}
