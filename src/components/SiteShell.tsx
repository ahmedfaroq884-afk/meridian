import { useState } from "react";
import type { ReactNode } from "react";
import type { Language, ThemeChoice } from "../lib/types";
import { t } from "../lib/i18n";

interface SiteShellProps {
  children: ReactNode;
  language: Language;
  setLanguage: (language: Language) => void;
  theme: ThemeChoice;
  setTheme: (theme: ThemeChoice) => void;
  currentPath: string;
}

const navItems = [
  ["/", "home"], ["/services", "services"], ["/company-setup", "companySetup"],
  ["/pvip", "pvip"], ["/mm2h", "mm2h"], ["/banking", "banking"], ["/market-entry", "marketEntry"],
] as const;

function Brand() {
  return <span className="brand" aria-label="Meridian Malaysia">
    <span className="brand-mark" aria-hidden="true">
      <svg viewBox="0 0 36 40" fill="none">
        <path d="M3 34V6l15 14L33 6v28" stroke="currentColor" strokeWidth="1.6"/>
        <path d="M9 34V20l9 8 9-8v14" stroke="currentColor" strokeWidth="1" opacity=".7"/>
        <circle cx="18" cy="5" r="2" fill="currentColor"/>
      </svg>
    </span>
    <span className="brand-copy"><span className="brand-name">MERIDIAN</span><span className="brand-caption">Malaysia · Gateway</span></span>
  </span>;
}

export function SiteShell({ children, language, setLanguage, theme, setTheme, currentPath }: SiteShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const rtl = language === "ar";
  const changeLanguage = (value: string) => {
    if (value === "en" || value === "ar" || value === "ms" || value === "zh") setLanguage(value);
  };
  if (currentPath === "/admin-console-secure") {
    return <div className={`admin-site-shell ${rtl ? "rtl" : ""}`} dir={rtl ? "rtl" : "ltr"}>
      <div className="admin-preferences container">
        <a href="/" aria-label="Meridian Malaysia home"><Brand/></a>
        <div className="nav-actions">
          <label htmlFor="admin-language" className="sr-only">{t(language, "language")}</label>
          <select id="admin-language" value={language} onChange={(event) => changeLanguage(event.target.value)} aria-label={t(language, "language")}>
            <option value="en">English</option><option value="ar">العربية</option><option value="ms">Bahasa Melayu</option><option value="zh">中文</option>
          </select>
          <label htmlFor="admin-quick-theme" className="sr-only">{t(language, "theme")}</label>
          <select id="admin-quick-theme" value={theme} onChange={(event) => setTheme(event.target.value as ThemeChoice)} aria-label={t(language, "theme")}>
            <option value="light">{t(language, "light")}</option><option value="dark">{t(language, "dark")}</option><option value="system">{t(language, "system")}</option>
          </select>
        </div>
      </div>
      {children}
    </div>;
  }
  return <div className={`site-shell ${rtl ? "rtl" : ""}`} dir={rtl ? "rtl" : "ltr"}>
    <a href="#main-content" className="skip-link">Skip to content</a>
    <div className="topbar">
      <div className="container topbar-inner">
        <span className="topbar-note">{t(language, "greeting")}</span>
        <div className="topbar-right">
          <label htmlFor="site-language" className="sr-only">{t(language, "language")}</label>
          <select id="site-language" className="select-quiet" value={language} onChange={(event) => changeLanguage(event.target.value)} aria-label={t(language, "language")}>
            <option value="en">EN</option><option value="ar">العربية</option><option value="ms">MS</option><option value="zh">中文</option>
          </select>
          <label htmlFor="site-theme" className="sr-only">{t(language, "theme")}</label>
          <select id="site-theme" className="select-quiet" value={theme} onChange={(event) => setTheme(event.target.value as ThemeChoice)} aria-label={t(language, "theme")}>
            <option value="light">{t(language, "light")}</option><option value="dark">{t(language, "dark")}</option><option value="system">{t(language, "system")}</option>
          </select>
        </div>
      </div>
    </div>
    <header className="site-header">
      <div className="container nav-wrap">
        <a href="/" aria-label="Meridian Malaysia home"><Brand /></a>
        <nav className="main-nav" aria-label="Main navigation">
          {navItems.map(([path, key]) => <a key={path} href={path} aria-current={path === currentPath ? "page" : undefined}>{t(language, key)}</a>)}
        </nav>
        <div className="nav-actions">
          <a className="button nav-cta" href="/start">{t(language, "getStarted")} <span className="arrow" aria-hidden="true">→</span></a>
          <button className="icon-button mobile-toggle" aria-label={menuOpen ? "Close navigation" : t(language, "menu")} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
            <svg width="17" height="17" viewBox="0 0 20 20" fill="none" aria-hidden="true">{menuOpen ? <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.5"/> : <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="1.5"/>}</svg>
          </button>
        </div>
      </div>
      <nav className={`mobile-menu ${menuOpen ? "open" : ""}`} aria-label="Mobile navigation">
        {navItems.map(([path, key]) => <a key={path} href={path} aria-current={path === currentPath ? "page" : undefined} onClick={() => setMenuOpen(false)}>{t(language, key)}</a>)}
        <a href="/contact" onClick={() => setMenuOpen(false)}>{t(language, "contact")}</a>
        <a className="button" href="/start" onClick={() => setMenuOpen(false)}>{t(language, "getStarted")} <span className="arrow" aria-hidden="true">→</span></a>
        <div className="nav-actions" style={{ paddingTop: 12 }}>
          <label htmlFor="mobile-language" className="sr-only">{t(language, "language")}</label>
          <select id="mobile-language" className="select-quiet" value={language} onChange={(event) => changeLanguage(event.target.value)} aria-label={t(language, "language")}>
            <option value="en">English</option><option value="ar">العربية</option><option value="ms">Bahasa Melayu</option><option value="zh">中文</option>
          </select>
          <label htmlFor="mobile-theme" className="sr-only">{t(language, "theme")}</label>
          <select id="mobile-theme" className="select-quiet" value={theme} onChange={(event) => setTheme(event.target.value as ThemeChoice)} aria-label={t(language, "theme")}>
            <option value="light">{t(language, "light")}</option><option value="dark">{t(language, "dark")}</option><option value="system">{t(language, "system")}</option>
          </select>
        </div>
      </nav>
    </header>
    <main id="main-content" tabIndex={-1}>{children}</main>
    <footer className="site-footer">
      <div className="container footer-main">
        <div className="footer-brand">
          <a href="/" aria-label="Meridian Malaysia home"><Brand /></a>
          <p>{t(language, "footerNote")}</p>
          <p>{t(language, "legalFooter")}</p>
        </div>
        <div className="footer-col"><h3>{t(language, "services")}</h3><div className="footer-links">
          <a href="/company-setup">{t(language, "companySetup")}</a><a href="/pvip">PVIP coordination</a><a href="/mm2h">MM2H coordination</a><a href="/banking">{t(language, "banking")}</a><a href="/market-entry">{t(language, "marketEntry")}</a>
        </div></div>
        <div className="footer-col"><h3>Explore</h3><div className="footer-links">
          <a href="/services">{t(language, "services")}</a><a href="/faq">{t(language, "faq")}</a><a href="/contact">{t(language, "contact")}</a><a href="/start">{t(language, "getStarted")}</a>
        </div></div>
        <div className="footer-col"><h3>Clear boundaries</h3><p style={{ color: "hsl(42 18% 72%)", fontSize: 12, lineHeight: 1.75, maxWidth: 260 }}>Independent facilitation and information. No guaranteed registration, visa, banking or regulatory outcome.</p></div>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} Meridian Malaysia. For information purposes only.</span>
        <div className="footer-bottom-links"><a href="/privacy">{t(language, "privacy")}</a><a href="/terms">{t(language, "terms")}</a><a href="/disclaimer">{t(language, "disclaimer")}</a></div>
      </div>
    </footer>
  </div>;
}

export function useTimezoneGreeting(language: Language): string {
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const hour = Number(new Intl.DateTimeFormat("en", {
    hour: "numeric",
    hour12: false,
  }).format(new Date()));
  const period = hour < 5 || hour >= 21 ? "night" : hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
  const cityByZone: Record<string, [string, string, string, string]> = {
    "Asia/Kuala_Lumpur": ["Kuala Lumpur", "كوالالمبور", "Kuala Lumpur", "吉隆坡"],
    "Asia/Riyadh": ["Riyadh", "الرياض", "Riyadh", "利雅得"],
    "Asia/Dubai": ["Dubai", "دبي", "Dubai", "迪拜"],
    "Europe/London": ["London", "لندن", "London", "伦敦"],
    "Asia/Singapore": ["Singapore", "سنغافورة", "Singapura", "新加坡"],
    "Asia/Kolkata": ["Kolkata", "كولكاتا", "Kolkata", "加尔各答"],
    "Asia/Tokyo": ["Tokyo", "طوكيو", "Tokyo", "东京"],
    "Asia/Shanghai": ["Shanghai", "شنغهاي", "Shanghai", "上海"],
    "America/New_York": ["New York", "نيويورك", "New York", "纽约"],
    "America/Los_Angeles": ["Los Angeles", "لوس أنجلوس", "Los Angeles", "洛杉矶"],
    "Australia/Sydney": ["Sydney", "سيدني", "Sydney", "悉尼"],
  };
  const cities = cityByZone[zone];
  const city = cities?.[(["en", "ar", "ms", "zh"] as Language[]).indexOf(language)] ??
    ({ en: "your local time", ar: "التوقيت المحلي", ms: "waktu tempatan", zh: "当地时间" }[language]);
  const greetings: Record<Language, Record<typeof period, string>> = {
    en: { morning: "Good morning", afternoon: "Good afternoon", evening: "Good evening", night: "Good night" },
    ar: { morning: "صباح الخير", afternoon: "مساء الخير", evening: "مساء الخير", night: "طاب مساؤك" },
    ms: { morning: "Selamat pagi", afternoon: "Selamat tengah hari", evening: "Selamat petang", night: "Selamat malam" },
    zh: { morning: "早上好", afternoon: "下午好", evening: "晚上好", night: "晚安" },
  };
  const greeting = greetings[language][period];
  if (language === "zh") return `${greeting} · ${city}`;
  const inWord = language === "ar" ? "في" : language === "ms" ? "di" : "in";
  return `${greeting} ${inWord} ${city}`;
}
