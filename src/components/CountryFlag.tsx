import type { CountryOption } from "../lib/countries";

const palettes: Record<string, [string, string, string]> = {
  MY: ["#c43d45", "#f3e4bf", "#174f42"], YE: ["#c23e3d", "#f0e9d8", "#202b29"],
  AE: ["#c7463c", "#f0e4c5", "#356d55"], SA: ["#145442", "#145442", "#145442"],
  GB: ["#23395d", "#f0e9d8", "#c7463c"], CN: ["#c7443c", "#dfb44b", "#c7443c"],
  SG: ["#c7443c", "#f0e9d8", "#c7443c"], ID: ["#c7443c", "#c7443c", "#f0e9d8"],
  TH: ["#c7443c", "#f0e9d8", "#253954"], IN: ["#d27a43", "#f2ebdc", "#478368"],
  PK: ["#f0e9d8", "#17513f", "#17513f"], BD: ["#19543f", "#c7443c", "#19543f"],
  JP: ["#f0e9d8", "#c7443c", "#f0e9d8"], KR: ["#f0e9d8", "#c7443c", "#23395d"],
  AU: ["#23395d", "#f0e9d8", "#c7443c"], NZ: ["#23395d", "#c7443c", "#f0e9d8"],
  US: ["#c7443c", "#f0e9d8", "#23395d"], CA: ["#c7443c", "#f0e9d8", "#c7443c"],
  DE: ["#27302d", "#c7443c", "#d7b35f"], FR: ["#315378", "#f0e9d8", "#c7443c"],
  NL: ["#c7443c", "#f0e9d8", "#315378"], TR: ["#c7443c", "#c7443c", "#f0e9d8"],
  EG: ["#c7443c", "#f0e9d8", "#27302d"], QA: ["#f0e9d8", "#6b3543", "#6b3543"],
  KW: ["#c7443c", "#f0e9d8", "#356d55"], OM: ["#c7443c", "#f0e9d8", "#356d55"],
  BH: ["#f0e9d8", "#c7443c", "#c7443c"], PH: ["#315378", "#c7443c", "#f0e9d8"],
  VN: ["#c7443c", "#dfb44b", "#c7443c"], ZA: ["#356d55", "#d7b35f", "#315378"],
  OT: ["#d8d4c9", "#9b4e3b", "#27594c"],
};

export function CountryFlag({ country, small = false }: { country: CountryOption; small?: boolean }) {
  const colors = palettes[country.code] ?? ["#c7443c", "#f0e9d8", "#315378"];
  const genericStyle = { background: `linear-gradient(to bottom, ${colors[0]} 0 33%, ${colors[1]} 33% 66%, ${colors[2]} 66% 100%)` };
  const detailed = ["MY", "YE", "AE", "SA", "GB"].includes(country.code);
  return <span className={`country-flag ${small ? "country-flag-small" : ""}`} aria-hidden="true" style={detailed ? undefined : genericStyle}>
    {country.code === "MY" && <svg className="country-flag-svg" viewBox="0 0 34 24" preserveAspectRatio="none">
      <rect width="34" height="24" fill="#f7f2e4"/>
      {[0, 4, 8, 12, 16, 20].map((y) => <rect key={y} y={y} width="34" height="2" fill="#c63d43"/> )}
      <rect width="16" height="12" fill="#183f68"/>
      <circle cx="6.2" cy="6" r="3.4" fill="#d9ae48"/><circle cx="7.5" cy="5.2" r="2.8" fill="#183f68"/>
      <path d="M11.5 2.5l.6 2 2-.8-1.2 1.7 2 .5-2 .6 1.1 1.7-1.9-.8-.7 2-.5-2-2 .7 1.2-1.7-2-.5 2-.6-1.1-1.7 1.9.8z" fill="#d9ae48"/>
    </svg>}
    {country.code === "YE" && <svg className="country-flag-svg" viewBox="0 0 34 24" preserveAspectRatio="none"><rect width="34" height="8" fill="#c74040"/><rect y="8" width="34" height="8" fill="#f6f0e1"/><rect y="16" width="34" height="8" fill="#26312e"/></svg>}
    {country.code === "AE" && <svg className="country-flag-svg" viewBox="0 0 34 24" preserveAspectRatio="none"><rect width="8" height="24" fill="#c74040"/><rect x="8" width="26" height="8" fill="#347155"/><rect x="8" y="8" width="26" height="8" fill="#f6f0e1"/><rect x="8" y="16" width="26" height="8" fill="#26312e"/></svg>}
    {country.code === "SA" && <svg className="country-flag-svg" viewBox="0 0 34 24" preserveAspectRatio="none"><rect width="34" height="24" fill="#145540"/><path d="M9 16h16M10 15l1-2h10l2 2" stroke="#eee9d9" strokeWidth="1.3" strokeLinecap="round"/></svg>}
    {country.code === "GB" && <svg className="country-flag-svg" viewBox="0 0 34 24" preserveAspectRatio="none"><rect width="34" height="24" fill="#263d63"/><path d="M0 0l34 24M34 0L0 24" stroke="#f6f0e1" strokeWidth="5"/><path d="M0 0l34 24M34 0L0 24" stroke="#bd3d43" strokeWidth="2"/><path d="M17 0v24M0 12h34" stroke="#f6f0e1" strokeWidth="7"/><path d="M17 0v24M0 12h34" stroke="#bd3d43" strokeWidth="3"/></svg>}
  </span>;
}
