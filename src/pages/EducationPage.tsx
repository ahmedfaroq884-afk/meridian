import type { Language } from "../lib/types";
import { t } from "../lib/i18n";

const studyLevels = [
  ["educationLevelFoundation", "01"],
  ["educationLevelDiploma", "02"],
  ["educationLevelBachelors", "03"],
  ["educationLevelMasters", "04"],
  ["educationLevelDoctoral", "05"],
] as const;

export function EducationPage({ language }: { language: Language }) {
  return <>
    <section className="page-hero education-hero">
      <div className="container">
        <span className="eyebrow">{t(language, "educationEyebrow")}</span>
        <h1 className="display">{t(language, "educationTitle")}</h1>
        <p className="lead">{t(language, "educationIntro")}</p>
        <div className="hero-actions">
          <a className="button" href="/education/apply">{t(language, "educationApply")} <span className="arrow" aria-hidden="true">→</span></a>
        </div>
      </div>
    </section>
    <section className="container education-options">
      <div className="education-options-copy">
        <span className="eyebrow">{t(language, "educationEyebrow")}</span>
        <h2>{t(language, "educationLevelsTitle")}</h2>
        <p>{t(language, "educationLevelsIntro")}</p>
      </div>
      <ol className="education-level-list">
        {studyLevels.map(([key, number]) => <li key={key}><span>{number}</span><strong>{t(language, key)}</strong></li>)}
      </ol>
    </section>
    <section className="education-disclosure">
      <div className="container">
        <h2>{t(language, "educationDisclosureTitle")}</h2>
        <p>{t(language, "educationDisclosure")}</p>
        <a className="button-text" href="/education/apply">{t(language, "educationApply")} <span className="arrow" aria-hidden="true">→</span></a>
      </div>
    </section>
  </>;
}
