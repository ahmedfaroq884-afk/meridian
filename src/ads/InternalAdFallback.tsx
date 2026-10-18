import type { Language } from "../lib/types";
import { t } from "../lib/i18n";

export function InternalAdFallback({ language }: { language: Language }) {
  return <div className="internal-ad-fallback">
    <span className="eyebrow">{t(language, "serviceSetup")}</span>
    <h2>{t(language, "servicesTitle")}</h2>
    <p>{t(language, "heroLead")}</p>
    <a className="button button-outline" href="/company-setup">
      {t(language, "companySetup")} <span className="arrow" aria-hidden="true">→</span>
    </a>
  </div>;
}
