import type { Locale, Player } from "./types";

const missingNumberLabels: Record<Locale, string> = {
  pt: "S/N",
  en: "N/A",
  es: "S/D",
};

export function formatPlayerNumber(number: Player["number"], locale: Locale) {
  return typeof number === "number" && number > 0 ? String(number) : missingNumberLabels[locale];
}

export function formatPlayerNumberWithHash(number: Player["number"], locale: Locale) {
  return typeof number === "number" && number > 0 ? `#${number}` : formatPlayerNumber(number, locale);
}
