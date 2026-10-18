import {
  getCountries,
  getCountryCallingCode,
  type CountryCode,
} from "libphonenumber-js";

export interface CountryOption {
  name: string;
  code: CountryCode;
  dial: string;
}

const englishNames = new Intl.DisplayNames(["en"], { type: "region" });
const allCountries = getCountries().map((code) => ({
  code,
  name: englishNames.of(code) ?? code,
  dial: `+${getCountryCallingCode(code)}`,
}));
const priorityCodes: CountryCode[] = ["MY", "YE", "AE", "SA", "GB"];
const prioritySet = new Set<CountryCode>(priorityCodes);

export const countries: CountryOption[] = [
  ...priorityCodes.map((code) => allCountries.find((country) => country.code === code)!),
  ...allCountries
    .filter((country) => !prioritySet.has(country.code))
    .sort((a, b) => a.name.localeCompare(b.name, "en")),
];

export function localizedCountryName(code: CountryCode, language: string): string {
  const locale = language === "ms" ? "ms" : language;
  try {
    return new Intl.DisplayNames([locale], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

export const serviceOptions = [
  ["company-setup", "Company setup"],
  ["pvip", "PVIP"],
  ["mm2h", "MM2H"],
  ["banking", "Banking"],
  ["market-entry", "Market entry"],
  ["corporate-structuring", "Corporate structuring"],
  ["other", "Other"],
];
