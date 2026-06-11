import type { Locale } from "./types";

export const nationAliases: Record<string, string[]> = {
  URS: ["URS", "RUS"],
  RUS: ["URS", "RUS"],
  YUG: ["YUG", "SRB"],
  SRB: ["YUG", "SRB"],
  TCH: ["TCH", "CZE"],
  CZE: ["TCH", "CZE"],
};

export const nations: Record<
  string,
  { pt: string; en: string; es: string; flag: string }
> = {
  BRA: { pt: "Brasil", en: "Brazil", es: "Brasil", flag: "🇧🇷" },
  ARG: { pt: "Argentina", en: "Argentina", es: "Argentina", flag: "🇦🇷" },
  ITA: { pt: "Itália", en: "Italy", es: "Italia", flag: "🇮🇹" },
  GER: { pt: "Alemanha", en: "Germany", es: "Alemania", flag: "🇩🇪" },
  FRA: { pt: "França", en: "France", es: "Francia", flag: "🇫🇷" },
  NED: { pt: "Holanda", en: "Netherlands", es: "Países Bajos", flag: "🇳🇱" },
  ESP: { pt: "Espanha", en: "Spain", es: "España", flag: "🇪🇸" },
  URU: { pt: "Uruguai", en: "Uruguay", es: "Uruguay", flag: "🇺🇾" },
  ENG: { pt: "Inglaterra", en: "England", es: "Inglaterra", flag: "🏴" },
  POR: { pt: "Portugal", en: "Portugal", es: "Portugal", flag: "🇵🇹" },
  BEL: { pt: "Bélgica", en: "Belgium", es: "Bélgica", flag: "🇧🇪" },
  CRO: { pt: "Croácia", en: "Croatia", es: "Croacia", flag: "🇭🇷" },
  COL: { pt: "Colômbia", en: "Colombia", es: "Colombia", flag: "🇨🇴" },
  MEX: { pt: "México", en: "Mexico", es: "México", flag: "🇲🇽" },
  NGA: { pt: "Nigéria", en: "Nigeria", es: "Nigeria", flag: "🇳🇬" },
  CMR: { pt: "Camarões", en: "Cameroon", es: "Camerún", flag: "🇨🇲" },
  KOR: { pt: "Coreia do Sul", en: "South Korea", es: "Corea del Sur", flag: "🇰🇷" },
  JPN: { pt: "Japão", en: "Japan", es: "Japón", flag: "🇯🇵" },
  MAR: { pt: "Marrocos", en: "Morocco", es: "Marruecos", flag: "🇲🇦" },
  GHA: { pt: "Gana", en: "Ghana", es: "Ghana", flag: "🇬🇭" },
  SWE: { pt: "Suécia", en: "Sweden", es: "Suecia", flag: "🇸🇪" },
  DEN: { pt: "Dinamarca", en: "Denmark", es: "Dinamarca", flag: "🇩🇰" },
  USA: { pt: "Estados Unidos", en: "United States", es: "Estados Unidos", flag: "🇺🇸" },
  ROU: { pt: "Romênia", en: "Romania", es: "Rumanía", flag: "🇷🇴" },
  BUL: { pt: "Bulgária", en: "Bulgaria", es: "Bulgaria", flag: "🇧🇬" },
  POL: { pt: "Polônia", en: "Poland", es: "Polonia", flag: "🇵🇱" },
  CHI: { pt: "Chile", en: "Chile", es: "Chile", flag: "🇨🇱" },
  TUR: { pt: "Turquia", en: "Turkey", es: "Turquía", flag: "🇹🇷" },
  SEN: { pt: "Senegal", en: "Senegal", es: "Senegal", flag: "🇸🇳" },
  CRC: { pt: "Costa Rica", en: "Costa Rica", es: "Costa Rica", flag: "🇨🇷" },
  RUS: { pt: "Rússia", en: "Russia", es: "Rusia", flag: "🇷🇺" },
  PAR: { pt: "Paraguai", en: "Paraguay", es: "Paraguay", flag: "🇵🇾" },
  PER: { pt: "Peru", en: "Peru", es: "Perú", flag: "🇵🇪" },
  AUS: { pt: "Austrália", en: "Australia", es: "Australia", flag: "🇦🇺" },
  CZE: { pt: "Tchéquia", en: "Czech Republic", es: "Chequia", flag: "🇨🇿" },
  SRB: { pt: "Sérvia", en: "Serbia", es: "Serbia", flag: "🇷🇸" },
  CIV: { pt: "Costa do Marfim", en: "Ivory Coast", es: "Costa de Marfil", flag: "🇨🇮" },
  SUI: { pt: "Suíça", en: "Switzerland", es: "Suiza", flag: "🇨🇭" },
  UKR: { pt: "Ucrânia", en: "Ukraine", es: "Ucrania", flag: "🇺🇦" },
  GRE: { pt: "Grécia", en: "Greece", es: "Grecia", flag: "🇬🇷" },
  ECU: { pt: "Equador", en: "Ecuador", es: "Ecuador", flag: "🇪🇨" },
  ALG: { pt: "Argélia", en: "Algeria", es: "Argelia", flag: "🇩🇿" },
  IRL: { pt: "Irlanda", en: "Ireland", es: "Irlanda", flag: "🇮🇪" },
  AUT: { pt: "Áustria", en: "Austria", es: "Austria", flag: "🇦🇹" },
  SCO: { pt: "Escócia", en: "Scotland", es: "Escocia", flag: "🏴" },
  EGY: { pt: "Egito", en: "Egypt", es: "Egipto", flag: "🇪🇬" },
  URS: { pt: "União Soviética", en: "Soviet Union", es: "Unión Soviética", flag: "🇷🇺" },
  YUG: { pt: "Iugoslávia", en: "Yugoslavia", es: "Yugoslavia", flag: "🇷🇸" },
  TCH: { pt: "Tchecoslováquia", en: "Czechoslovakia", es: "Checoslovaquia", flag: "🇨🇿" },
  HUN: { pt: "Hungria", en: "Hungary", es: "Hungría", flag: "🇭🇺" },
  NIR: { pt: "Irlanda do Norte", en: "Northern Ireland", es: "Irlanda del Norte", flag: "🇬🇧" },
  WAL: { pt: "País de Gales", en: "Wales", es: "Gales", flag: "🏴" },
};

export function nationName(code: string, locale: Locale = "pt") {
  return nations[code]?.[locale] ?? code;
}

export function nationFlag(code: string) {
  return nations[code]?.flag ?? "";
}
