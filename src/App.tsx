import { useEffect, useState } from "react";
import type { Language, ThemeChoice } from "./lib/types";
import { detectLanguage, t } from "./lib/i18n";
import { getPublicSettings, getPublicSiteContent, supabaseEnabled, track } from "./lib/supabase";
import { SiteShell } from "./components/SiteShell";
import { EnquiryForm } from "./components/EnquiryForm";
import { AdminConsole } from "./pages/AdminConsole";
import { ContactPage, FAQPage, HomePage, LegalPage, NotFoundPage, ServiceDetailPage, ServicesPage } from "./pages/PublicPages";
import { pageSeoEnglish } from "./lib/seo";
import { EducationPage } from "./pages/EducationPage";
import { EducationEnquiryForm } from "./components/EducationEnquiryForm";
import { EducationAgentPortal } from "./pages/EducationAgentPortal";
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
    "/disclaimer": "seoDisclaimer", "/admin-console-secure": "seoAdmin", "/education": "seoEducation",
    "/education/apply": "seoEducationApply", "/education-agent-console": "seoAgentConsole",
  };
  const pageTitle = `${t(language, titleKeyByPath[path] ?? "notFoundTitle")} | Meridian Malaysia`;
  const pageDescription = path in pageSeoEnglish
    ? (language === "en" ? pageSeoEnglish[path].description : localizedPageDescription(language, path) ?? t(language, "seoDescription"))
    : t(language, "seoDescription");
  const privatePath = path === "/admin-console-secure" || path === "/education-agent-console";
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
    const descriptionText = privatePath
      ? pageSeoEnglish[path].description
      : settingString(`seo.${pathKey}.${language}.og_description`) || (language === "en" ? settingString(`seo.${pathKey}.og_description`) : "") || resolvedDescription;
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
    setMeta(
      'meta[name="robots"]',
      "name",
      "robots",
      privatePath || pageSeoEnglish[path]?.noindex ? "noindex,nofollow" : allowedRobots.has(robotsSetting) ? robotsSetting : "index,follow",
    );
    setMeta('meta[property="og:url"]', "property", "og:url", canonical.href);
    setMeta('meta[property="og:site_name"]', "property", "og:site_name", "Meridian Malaysia");
  }, [language, pageDescription, pageTitle, path, publicSettings, theme]);

  useEffect(() => {
    if (!supabaseEnabled() || analyticsChoice !== "accepted" || privatePath) return;
    const event = {
      event_type: "page_view",
      page: path,
      language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
      metadata: {},
    };
    void track(event).catch(() => undefined);
  }, [analyticsChoice, language, path, privatePath]);

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
    path === "/education" ? <EducationPage language={language}/> :
    path === "/education/apply" ? <EducationEnquiryForm language={language}/> :
    path === "/education-agent-console" ? <EducationAgentPortal language={language}/> :
    path === "/contact" ? <ContactPage language={language}/> :
    path === "/faq" ? <FAQPage language={language}/> :
    ["/privacy", "/terms", "/disclaimer"].includes(path) ? <LegalPage language={language} path={path}/> :
    path === "/admin-console-secure" ? <AdminConsole language={language} theme={theme} setTheme={setTheme}/> :
    <NotFoundPage language={language}/>;

  return <SiteShell language={language} setLanguage={setLanguage} theme={theme} setTheme={setTheme} currentPath={path}>
    {content}
    {!privatePath && <WhatsAppWidget phoneNumber={publicSettings["contact.whatsapp_number"]} language={language}/>}
    {supabaseEnabled() && analyticsChoice === null && !privatePath && <aside className="consent-banner" aria-label={t(language, "consentTitle")}>
      <div><strong>{t(language, "consentTitle")}</strong><p>{t(language, "consentBody")}</p></div>
      <div className="consent-actions">
        <button className="button button-outline" onClick={() => chooseAnalytics("declined")}>{t(language, "declineAnalytics")}</button>
        <button className="button" onClick={() => chooseAnalytics("accepted")}>{t(language, "acceptAnalytics")}</button>
      </div>
    </aside>}
  </SiteShell>;
}

function localizedPageDescription(language: Language, path: string): string | undefined {
  if (path === "/education") return t(language, "educationIntro");
  if (path === "/education/apply") return t(language, "educationFormIntro");
  if (path === "/education-agent-console" || path === "/admin-console-secure") return pageSeoEnglish[path]?.description;
  const descriptions: Partial<Record<Language, Record<string, string>>> = {
    ar: {
      "/company-setup": "معلومات حول هيكل الشركة والملكية وخطوات التأسيس في ماليزيا.",
      "/pvip": "راجع معلومات PVIP المنشورة وجهّز أسئلتك لمستشار هجرة مستقل.",
      "/mm2h": "معلومات منشورة عن MM2H وتنسيق المشورة المستقلة بشأن الإقامة الطويلة.",
      "/banking": "استعد لمناقشة مصرفية بملف أعمال واضح. كل بنك يقرر بصورة مستقلة.",
      "/market-entry": "رتّب بحث العملاء والتشغيل والأسئلة المحلية قبل دخول السوق الماليزي.",
    },
    ms: {
      "/company-setup": "Maklumat struktur syarikat, pemilikan dan langkah pemerbadanan di Malaysia.",
      "/pvip": "Semak maklumat PVIP yang diterbitkan dan sediakan soalan untuk penasihat imigresen bebas.",
      "/mm2h": "Maklumat MM2H yang diterbitkan serta penyelarasan nasihat bebas tentang rancangan tinggal lama.",
      "/banking": "Bersedia untuk perbincangan bank dengan profil perniagaan yang jelas. Setiap bank membuat keputusan sendiri.",
      "/market-entry": "Susun kajian pelanggan, operasi dan persoalan tempatan sebelum memasuki pasaran Malaysia.",
    },
    zh: {
      "/company-setup": "了解马来西亚公司架构、股权安排和注册前的准备事项。",
      "/pvip": "查看已公布的 PVIP 信息，并准备问题咨询独立移民顾问。",
      "/mm2h": "了解已公布的 MM2H 信息，并协调长期居留规划的独立建议。",
      "/banking": "整理业务资料，为银行沟通做好准备。各银行独立作出决定。",
      "/market-entry": "进入马来西亚市场前，梳理客户、运营和本地调研问题。",
    },
  };
  return descriptions[language]?.[path];
}
