"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CampaignMatch, Draft, DraftOptions, Locale, Player, SharePayload, SquadFile, TournamentMatch, TournamentStage, TournamentTeam } from "@/lib/types";
import {
  availablePositions,
  calculateStats,
  canFillAnySlot,
  createDraft,
  defaultOptions,
  describePair,
  fetchSquad,
  findPlayerInSquad,
  findSquadMeta,
  formations,
  modeConfig,
  randomSeed,
  rerollPair,
  rng,
  rollPair,
  simulateCampaign,
  squadIndex,
} from "@/lib/game";
import { localePath, messages, positionLabels, styleLabels } from "@/lib/i18n";
import { nationFlag, nationFlagImageUrl, nationName } from "@/lib/nations";
import { formatPlayerNumber, formatPlayerNumberWithHash } from "@/lib/player-number";
import { decodeSharePayload } from "@/lib/share";
import { SettingsToggle } from "./ChromeControls";
import { Logo } from "./Logo";
import { PitchMarkings } from "./PitchMarkings";
import { ResultCard } from "./ResultCard";

type Phase = "drafting" | "revealing" | "result";
type DrawPair = { sel: string; copa: number };
type RevealMode = "manual" | "auto";
type RevealSpeed = "slow" | "normal" | "fast" | "ultra";

const revealSpeeds: Record<RevealSpeed, number> = {
  slow: 300,
  normal: 150,
  fast: 50,
  ultra: 15,
};

const revealSpeedKeys = Object.keys(revealSpeeds) as RevealSpeed[];
const revealKickoffDelay = 1390;
const REVEAL_STORAGE_KEY = "s80-reveal";
const LEGACY_REVEAL_STORAGE_KEY = "s70-reveal";
const SPEED_STORAGE_KEY = "8a0-speed";
const LEGACY_SPEED_STORAGE_KEY = "7a0-speed";
const penaltyLiveLabels: Record<Locale, string> = {
  pt: "Cobrando",
  en: "Taking",
  es: "Ejecuta",
};
const penaltyStageLabels: Record<Locale, { bestOfFive: string; suddenDeath: string; advanced: string; eliminated: string }> = {
  pt: {
    bestOfFive: "Disputa de p\u00eanaltis \u00b7 melhor de 5",
    suddenDeath: "Alternadas (morte s\u00fabita)",
    advanced: "avan\u00e7ou",
    eliminated: "eliminado",
  },
  en: {
    bestOfFive: "Penalty shootout \u00b7 best of 5",
    suddenDeath: "Sudden death",
    advanced: "advanced",
    eliminated: "eliminated",
  },
  es: {
    bestOfFive: "Tanda de penales \u00b7 mejor de 5",
    suddenDeath: "Alternadas (muerte s\u00fabita)",
    advanced: "avanza",
    eliminated: "eliminado",
  },
};
const revealControlLabels: Record<
  Locale,
  {
    modeManual: string;
    modeAuto: string;
    speedLabel: string;
    speedSlow: string;
    speedNormal: string;
    speedFast: string;
    speedUltra: string;
  }
> = {
  pt: {
    modeManual: "Jogo a jogo",
    modeAuto: "Automático",
    speedLabel: "Velocidade",
    speedSlow: "Lento",
    speedNormal: "Normal",
    speedFast: "Rápida",
    speedUltra: "Ultra",
  },
  en: {
    modeManual: "Match by match",
    modeAuto: "Automatic",
    speedLabel: "Speed",
    speedSlow: "Slow",
    speedNormal: "Normal",
    speedFast: "Fast",
    speedUltra: "Ultra",
  },
  es: {
    modeManual: "Partido a partido",
    modeAuto: "Automático",
    speedLabel: "Velocidad",
    speedSlow: "Lento",
    speedNormal: "Normal",
    speedFast: "Rápido",
    speedUltra: "Ultra",
  },
};

const tournamentLabels: Record<
  Locale,
  {
    button: string;
    viewTable: string;
    close: string;
    groupsTab: string;
    bracketTab: string;
    group: string;
    round: string;
    table: string;
    bracket: string;
    schedule: string;
    locked: string;
    pts: string;
    gd: string;
    for: string;
    tbd: string;
    third: string;
    team: string;
    played: string;
    wins: string;
    draws: string;
    losses: string;
    ga: string;
    form: string;
  }
> = {
  pt: {
    button: "Copa",
    viewTable: "Ver tabela",
    close: "Fechar",
    groupsTab: "Fase de grupos",
    bracketTab: "Eliminat\u00f3rias",
    group: "Grupo",
    round: "Rodada",
    table: "Tabela",
    bracket: "Chave",
    schedule: "Calend\u00e1rio",
    locked: "Placar liberado depois do seu jogo",
    pts: "PTS",
    gd: "SG",
    for: "GM",
    tbd: "A definir",
    third: "3\u00ba",
    team: "Equipe",
    played: "PJ",
    wins: "VIT",
    draws: "E",
    losses: "DER",
    ga: "GC",
    form: "\u00daltimas",
  },
  en: {
    button: "Cup",
    viewTable: "View table",
    close: "Close",
    groupsTab: "Group stage",
    bracketTab: "Knockout",
    group: "Group",
    round: "Round",
    table: "Table",
    bracket: "Bracket",
    schedule: "Schedule",
    locked: "Score unlocks after your match",
    pts: "PTS",
    gd: "GD",
    for: "GF",
    tbd: "TBD",
    third: "3rd",
    team: "Team",
    played: "P",
    wins: "W",
    draws: "D",
    losses: "L",
    ga: "GA",
    form: "Last 5",
  },
  es: {
    button: "Copa",
    viewTable: "Ver tabla",
    close: "Cerrar",
    groupsTab: "Fase de grupos",
    bracketTab: "Eliminatorias",
    group: "Grupo",
    round: "Jornada",
    table: "Tabla",
    bracket: "Llave",
    schedule: "Calendario",
    locked: "Marcador liberado despu\u00e9s de tu partido",
    pts: "PTS",
    gd: "DG",
    for: "GF",
    tbd: "Por definir",
    third: "3.\u00ba",
    team: "Equipo",
    played: "PJ",
    wins: "VIC",
    draws: "E",
    losses: "DER",
    ga: "GC",
    form: "\u00daltimas",
  },
};

const fixtureSummaryLabels: Record<Locale, { goals: string; conceded: string }> = {
  pt: { goals: "GOLS", conceded: "SOFREU" },
  en: { goals: "GOALS", conceded: "CONCEDED" },
  es: { goals: "GOLES", conceded: "RECIBIÓ" },
};

const campaignPhaseLabels: Record<Locale, Record<string, string>> = {
  pt: {
    GRUPOS: "GRUPOS",
    "16 AVOS": "16 AVOS",
    OITAVAS: "OITAVAS",
    QUARTAS: "QUARTAS",
    SEMI: "SEMI",
    "3O LUGAR": "3º LUGAR",
    FINAL: "FINAL",
  },
  en: {
    GRUPOS: "GROUP",
    "16 AVOS": "ROUND OF 32",
    OITAVAS: "ROUND OF 16",
    QUARTAS: "QUARTERFINALS",
    SEMI: "SEMIFINAL",
    "3O LUGAR": "THIRD PLACE",
    FINAL: "FINAL",
  },
  es: {
    GRUPOS: "GRUPOS",
    "16 AVOS": "DIECISEISAVOS",
    OITAVAS: "OCTAVOS",
    QUARTAS: "CUARTOS",
    SEMI: "SEMIFINAL",
    "3O LUGAR": "TERCER PUESTO",
    FINAL: "FINAL",
  },
};

function readStoredRevealMode(): RevealMode {
  if (typeof window === "undefined") return "manual";
  const stored = localStorage.getItem(REVEAL_STORAGE_KEY) ?? localStorage.getItem(LEGACY_REVEAL_STORAGE_KEY);
  return stored === "auto" ? "auto" : "manual";
}

function readStoredRevealSpeed(): RevealSpeed {
  if (typeof window === "undefined") return "normal";
  const stored = localStorage.getItem(SPEED_STORAGE_KEY) ?? localStorage.getItem(LEGACY_SPEED_STORAGE_KEY);
  return stored && revealSpeedKeys.includes(stored as RevealSpeed) ? (stored as RevealSpeed) : "normal";
}

function FlagImage({ code, label }: { code: string; label: string }) {
  const url = nationFlagImageUrl(code);
  if (!url) {
    return <span aria-label={label}>{nationFlag(code) || code}</span>;
  }
  return <span className="flag-img" aria-hidden="true" style={{ backgroundImage: `url(${url})` }} />;
}

function TableIcon() {
  return (
    <svg className="table-icon" viewBox="0 0 18 18" aria-hidden="true" focusable="false">
      <rect x="2.25" y="3" width="13.5" height="12" rx="1.75" />
      <path d="M2.25 7h13.5M6.75 3v12M11.25 3v12" />
    </svg>
  );
}

function stoppageMinutes(gf: number, ga: number, index: number) {
  return [1 + ((2 * gf + 3 * ga + index + 1) % 5), 1 + ((3 * gf + 2 * ga + index) % 5)] as const;
}

function revealTiming(msPerMin: number, firstHalfExtra: number, secondHalfExtra: number) {
  const halfBreak = Math.round(10 * msPerMin);
  const p1End = 45 * msPerMin;
  const p2End = p1End + firstHalfExtra * msPerMin;
  const p3End = p2End + halfBreak;
  const p4End = p3End + 44 * msPerMin;
  const p5End = p4End + secondHalfExtra * msPerMin;
  return { p1End, p2End, p3End, p4End, p5End };
}

function penaltyKickDuration(msPerMin: number) {
  return Math.round((1200 * msPerMin) / revealSpeeds.normal);
}

function revealExtraDuration(match: CampaignMatch, msPerMin: number) {
  if (match.penalties) {
    const baseKicks = match.penalties.me.length + match.penalties.them.length;
    const suddenDeathKicks = (match.penalties.sd?.me.length ?? 0) + (match.penalties.sd?.them.length ?? 0);
    return (baseKicks + suddenDeathKicks) * penaltyKickDuration(msPerMin) + 720;
  }
  if (match.groupTable) return 210 * match.groupTable.length + 520;
  return 520;
}

function revealDuration(match: CampaignMatch, msPerMin: number, index: number) {
  const [firstHalfExtra, secondHalfExtra] = stoppageMinutes(match.gf, match.ga, index);
  return revealKickoffDelay + revealTiming(msPerMin, firstHalfExtra, secondHalfExtra).p5End + 600 + revealExtraDuration(match, msPerMin);
}

function clockFromElapsed(elapsed: number, msPerMin: number, firstHalfExtra: number, secondHalfExtra: number) {
  const timing = revealTiming(msPerMin, firstHalfExtra, secondHalfExtra);
  if (elapsed < 0) return { minute: 0, label: "" };
  if (elapsed < timing.p1End) {
    const minute = Math.min(Math.floor(elapsed / msPerMin) + 1, 45);
    return { minute, label: String(minute) };
  }
  if (elapsed < timing.p2End) {
    const extra = Math.min(Math.floor((elapsed - timing.p1End) / msPerMin) + 1, firstHalfExtra);
    return { minute: 45, label: `45+${extra}` };
  }
  if (elapsed < timing.p3End) return { minute: 45, label: `45+${firstHalfExtra}` };
  if (elapsed < timing.p4End) {
    const minute = Math.min(46 + Math.floor((elapsed - timing.p3End) / msPerMin), 90);
    return { minute, label: String(minute) };
  }
  if (elapsed < timing.p5End) {
    const extra = Math.min(Math.floor((elapsed - timing.p4End) / msPerMin) + 1, secondHalfExtra);
    return { minute: 90, label: `90+${extra}` };
  }
  return { minute: 90, label: `90+${secondHalfExtra}` };
}

function penaltyTimeline(penalties: NonNullable<CampaignMatch["penalties"]>) {
  const kicks: Array<{ side: "me" | "them"; kick: number; index: number; stage: "base" | "sd"; name?: string }> = [];
  const rounds = Math.max(penalties.me.length, penalties.them.length);
  for (let index = 0; index < rounds; index += 1) {
    const meKick = penalties.me[index];
    const themKick = penalties.them[index];
    if (meKick !== undefined) kicks.push({ side: "me", kick: meKick, index, stage: "base", name: penalties.meNames?.[index] });
    if (themKick !== undefined) kicks.push({ side: "them", kick: themKick, index, stage: "base", name: penalties.themNames?.[index] });
  }
  const suddenDeath = penalties.sd;
  if (suddenDeath) {
    const suddenDeathRounds = Math.max(suddenDeath.me.length, suddenDeath.them.length);
    for (let index = 0; index < suddenDeathRounds; index += 1) {
      const meKick = suddenDeath.me[index];
      const themKick = suddenDeath.them[index];
      if (meKick !== undefined) kicks.push({ side: "me", kick: meKick, index, stage: "sd", name: suddenDeath.meNames?.[index] });
      if (themKick !== undefined) kicks.push({ side: "them", kick: themKick, index, stage: "sd", name: suddenDeath.themNames?.[index] });
    }
  }
  return kicks;
}

function penaltyKickKey(kick: { side: "me" | "them"; index: number; stage: "base" | "sd" }) {
  return `${kick.stage}:${kick.side}:${kick.index}`;
}

function penaltyRows(
  penalties: NonNullable<CampaignMatch["penalties"]>,
  stage: "base" | "sd",
  visibleKickKeys: Set<string>,
) {
  const source =
    stage === "base"
      ? { me: penalties.me, them: penalties.them, meNames: penalties.meNames, themNames: penalties.themNames }
      : penalties.sd;
  if (!source) return [];
  const rounds = Math.max(source.me.length, source.them.length);
  return Array.from({ length: rounds }, (_, index) => {
    const meVisible = visibleKickKeys.has(`${stage}:me:${index}`);
    const themVisible = visibleKickKeys.has(`${stage}:them:${index}`);
    return {
      index,
      me: meVisible && source.me[index] !== undefined ? { kick: source.me[index]!, name: source.meNames?.[index] } : null,
      them: themVisible && source.them[index] !== undefined ? { kick: source.them[index]!, name: source.themNames?.[index] } : null,
    };
  }).filter((row) => row.me || row.them);
}

function opponentCode(label: string) {
  return label.split(" ")[0] ?? "";
}

function opponentParts(label: string) {
  const [code = "", year = ""] = label.split(" ");
  return { code, year };
}

function opponentDisplayName(label: string, locale: Locale) {
  const { code, year } = opponentParts(label);
  if (!code) return label;
  const name = nationName(code, locale);
  return year ? `${name} ${year}` : name;
}

function groupRank(index: number, locale: Locale) {
  const rank = index + 1;
  if (locale === "en") {
    const suffix = rank === 1 ? "st" : rank === 2 ? "nd" : rank === 3 ? "rd" : "th";
    return `${rank}${suffix}`;
  }
  if (locale === "es") return `${rank}.\u00ba`;
  return `${rank}\u00ba`;
}

function groupOutcomeLabel(locale: Locale, rank: string, advanced: boolean) {
  if (locale === "en") return advanced ? `Qualified ${rank} - advances` : `Eliminated ${rank}`;
  if (locale === "es") return advanced ? `Clasificado como ${rank} - avanza` : `Eliminado ${rank}`;
  return advanced ? `Classificado em ${rank} - avan\u00e7a` : `Eliminado em ${rank}`;
}

function campaignPhaseTitle(phase: string, locale: Locale) {
  return campaignPhaseLabels[locale][phase] ?? phase;
}

function groupTeamLabel(label: string, locale: Locale) {
  const { code, year } = opponentParts(label);
  if (!code) return label;
  return year ? `${nationName(code, locale)} ${year}` : nationName(code, locale);
}

function GroupTeamLabel({ label, locale }: { label: string; locale: Locale }) {
  const { code } = opponentParts(label);
  return (
    <span className="rv-team-display">
      <span className="rv-team-flag" aria-label={nationName(code, locale)}>
        <FlagImage code={code} label={nationName(code, locale)} />
      </span>
      <span>{groupTeamLabel(label, locale)}</span>
    </span>
  );
}

function pointsLabel(points: number, locale: Locale) {
  if (locale === "en") return points === 1 ? "pt" : "pts";
  return "pts";
}

function rerollsLeftLabel(count: number, locale: Locale) {
  if (locale === "en") return "left";
  return count === 1 ? "restante" : "restantes";
}

function playerNumberSortValue(player: Player) {
  return player.number ?? Number.POSITIVE_INFINITY;
}

function comparePlayersByNumber(left: Player, right: Player) {
  const numberDiff = playerNumberSortValue(left) - playerNumberSortValue(right);
  if (numberDiff !== 0) return numberDiff;
  return left.name.localeCompare(right.name);
}

function summarizeGoals(goals: CampaignMatch["minutes"], side: "me" | "them") {
  const counts = new Map<string, number>();
  goals
    .filter((goal) => goal.side === side)
    .forEach((goal) => {
      counts.set(goal.name, (counts.get(goal.name) ?? 0) + 1);
    });
  return [...counts.entries()].map(([name, count]) => (count > 1 ? `${name} (${count})` : name)).join(", ");
}

function AdStrip({ locale }: { locale: Locale }) {
  const labels =
    locale === "pt"
      ? ["anuncie aqui", "contato", "anuncie aqui"]
      : locale === "es"
        ? ["anúnciate aquí", "contacto", "anúnciate aquí"]
        : ["advertise here", "contact", "advertise here"];
  const hrefs = ["https://pixgg.com/8a0", "https://x.com/chavozik4", "https://pixgg.com/8a0"];
  const items = [...labels, ...labels];

  return (
    <div className="ad-strip">
      <div className="ad-ticker-track">
        {items.map((label, index) => (
          <span className="ad-ticker-item" key={`${label}-${index}`}>
            <a href={hrefs[index % hrefs.length]} target="_blank" rel="noopener noreferrer" className="ad-ticker-item">
              {label}
            </a>
            <span className="ad-ticker-sep">·</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function createSeededDraft(options: DraftOptions, seed = randomSeed()) {
  return createDraft(seed, options);
}

function updateDraftOptions(draft: Draft, options: DraftOptions) {
  return createDraft(draft.seed, options);
}

const MOBILE_DRAFT_SCROLL_QUERY = "(max-width: 900px)";

function scrollDraftIntoView() {
  if (!window.matchMedia?.(MOBILE_DRAFT_SCROLL_QUERY).matches) return;

  const layout = document.querySelector(".draft-layout");
  if (!layout) return;
  const top = layout.getBoundingClientRect().top + window.scrollY - 22;
  window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
}

function scrollTargetIntoView(target: Element | null) {
  if (!target) return;
  const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "nearest" });
}

function Pitch({
  locale,
  draft,
  selected,
  onSlot,
}: {
  locale: Locale;
  draft: Draft;
  selected: Player | null;
  onSlot: (slot: number) => void;
}) {
  return (
    <div className="pitch-outer">
      <AdStrip locale={locale} />
      <div className="pitch-wrap">
        <div className="pitch">
          <PitchMarkings />
          {draft.slots.map((slot, index) => {
            const player = draft.filled[index];
            const active = selected ? selected.positions.includes(slot.pos) && !player : false;
            return (
              <button
                key={`${slot.pos}-${index}`}
                className={`disc ${player ? "slot-filled" : "empty slot-empty"} ${active ? "slot-active slot-pickable" : ""}`}
                style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
                onClick={() => onSlot(index)}
                type="button"
              >
                <span className="disc-circle num">{player ? formatPlayerNumber(player.number, locale) : positionLabels[locale][slot.pos]}</span>
                {player && <span className="disc-name">{player.name}</span>}
              </button>
            );
          })}
        </div>
      </div>
      <AdStrip locale={locale} />
    </div>
  );
}

function BoxScore({ locale, draft }: { locale: Locale; draft: Draft }) {
  const t = messages[locale];
  const stats = calculateStats(draft);
  const filledCount = draft.filled.filter(Boolean).length;
  const hasPlayers = filledCount > 0;
  return (
    <aside className="box">
      <div className="box-head">
        <span className="eyebrow">
          {t.play.box} · {filledCount}/11
        </span>
        <span className="num">{hasPlayers ? stats.overall : "—"}</span>
      </div>
      <div className="box-ratings">
        <span className="box-rating box-rating-atk">
          <b className="num">{hasPlayers ? stats.attack : "—"}</b> {t.play.attack}
        </span>
        <span className="box-rating box-rating-def">
          <b className="num">{hasPlayers ? stats.defense : "—"}</b> {t.play.defense}
        </span>
      </div>
      <table className="boxscore">
        <tbody>
          {draft.slots.map((slot, index) => {
            const player = draft.filled[index];
            return (
              <tr key={`${slot.pos}-${index}`} className={player ? "" : "empty"}>
                <td className="pos">{positionLabels[locale][slot.pos]}</td>
                <td>{player?.name ?? "—"}</td>
                <td className="val">{player?.force ?? ""}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </aside>
  );
}

function RollPanel({
  locale,
  draft,
  squad,
  rollingPair,
  selected,
  isRolling,
  onRoll,
  onReroll,
  onSelect,
}: {
  locale: Locale;
  draft: Draft;
  squad: SquadFile | null;
  rollingPair: DrawPair | null;
  selected: Player | null;
  isRolling: boolean;
  onRoll: () => void;
  onReroll: (axis: "sel" | "copa") => void;
  onSelect: (player: Player) => void;
}) {
  const t = messages[locale];
  const playerPool = useMemo(() => {
    if (!squad) return [];
    const used = new Set(draft.usedPlayerIds);
    return [...squad.squad]
      .sort(comparePlayersByNumber)
      .filter((player) => !used.has(player.playerId))
      .map((player) => ({ player, selectable: canFillAnySlot(draft, player) }));
  }, [draft, squad]);
  const hasSelectablePlayer = playerPool.some((item) => item.selectable);
  const displayPair = rollingPair ?? squad;

  if (!displayPair) {
    return (
      <section className="roll-panel">
        <div className="roll-idle">
          <p>{t.play.rollIdle}</p>
        </div>
        <button className="btn btn-primary roll-btn" onClick={onRoll} disabled={isRolling}>
          {t.play.roll} <span aria-hidden="true">🎲</span>
        </button>
      </section>
    );
  }

  return (
    <section className="roll-panel">
      <div className={`roll-result sticker ${isRolling ? "is-spinning" : ""}`}>
        <span className="eyebrow">{t.play.drawn}</span>
        <div className="rr-sel">
          <span className="rr-flag" aria-label={nationName(displayPair.sel, locale)}>
            <FlagImage code={displayPair.sel} label={nationName(displayPair.sel, locale)} />
          </span>
          <span>{nationName(displayPair.sel, locale)}</span>
        </div>
        <div className="rr-copa num">
          {t.play.cup} {displayPair.copa}
        </div>
      </div>
      {isRolling && (
        <div className="rolling-strip" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      )}
      {!isRolling && draft.rerollsLeft > 0 && (
        <div className="reroll-box">
          <span className="eyebrow reroll-label">
            {t.play.reroll} · {draft.rerollsLeft} {rerollsLeftLabel(draft.rerollsLeft, locale)}
          </span>
          <div className="reroll-btns">
            <button className="btn btn-secondary reroll-btn" onClick={() => onReroll("sel")}>
              {t.play.anotherTeam}
            </button>
            <button className="btn btn-secondary reroll-btn" onClick={() => onReroll("copa")}>
              {t.play.anotherCup}
            </button>
          </div>
        </div>
      )}
      {!isRolling && (
      <div className="player-pool">
        <span className="eyebrow">{hasSelectablePlayer ? t.play.choosePlayer : t.play.noPlayer}</span>
        <div className="player-list">
          {playerPool.map(({ player, selectable }) => (
            <button
              type="button"
              key={player.playerId}
              className={`player-card ${selected?.playerId === player.playerId ? "is-active" : ""} ${player.legend ? "is-legend" : ""} ${selectable ? "" : "is-disabled"}`}
              disabled={!selectable}
              onClick={() => selectable && onSelect(player)}
            >
              <span className="pc-num num">{formatPlayerNumberWithHash(player.number, locale)}</span>
              <span className="pc-name">{player.name}</span>
              <span className="pc-pos">
                {player.positions.slice(0, 2).map((position) => positionLabels[locale][position]).join("/")}
                {player.positions.length > 2 && <span className="pc-pos-more">+{player.positions.length - 2}</span>}
              </span>
              {draft.options.mode === "classico" && <span className="pc-force num">{player.force}</span>}
            </button>
          ))}
        </div>
      </div>
      )}
    </section>
  );
}

function SetupControls({
  locale,
  draft,
  onOptions,
}: {
  locale: Locale;
  draft: Draft;
  onOptions: (options: DraftOptions) => void;
}) {
  const t = messages[locale];
  return (
    <div className="play-setup sticker">
      <div className="setup-group">
        <span className="modes-label eyebrow">{t.play.formation}</span>
        <div className="modes-group">
          {(Object.keys(formations) as Array<keyof typeof formations>).map((formation) => (
            <button
              className={`chip ${draft.options.formation === formation ? "is-active" : ""}`}
              key={formation}
              onClick={() => onOptions({ ...draft.options, formation })}
            >
              {formation}
            </button>
          ))}
        </div>
      </div>
      <div className="setup-group">
        <span className="modes-label eyebrow">{t.play.style}</span>
        <div className="modes-group">
          {(["defensivo", "equilibrado", "ofensivo"] as const).map((style) => (
            <button
              className={`chip ${draft.options.style === style ? "is-active" : ""}`}
              key={style}
              onClick={() => onOptions({ ...draft.options, style })}
            >
              {styleLabels[locale][style]}
            </button>
          ))}
        </div>
      </div>
      <div className="setup-group">
        <span className="modes-label eyebrow">{t.play.mode}</span>
        <div className="modes-group">
          {(["classico", "almanaque"] as const).map((mode) => (
            <button
              className={`chip ${draft.options.mode === mode ? "is-active" : ""}`}
              key={mode}
              onClick={() => onOptions({ ...draft.options, mode })}
            >
              {mode === "classico" ? t.play.classic : t.play.memory}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Kept temporarily as a reference for the simpler non-animated reveal.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function RevealView({
  locale,
  result,
  draft,
  revealIndex,
  onNext,
}: {
  locale: Locale;
  result: NonNullable<ReturnType<typeof simulateCampaign>>;
  draft: Draft;
  revealIndex: number;
  onNext: () => void;
}) {
  const t = messages[locale];
  const visible = result.campaign.slice(0, revealIndex + 1);
  const done = revealIndex >= result.campaign.length - 1;
  return (
    <main className="reveal-wrap reveal-dream tx-paper">
      <section className="reveal-head">
        <span className="eyebrow">
          {t.reveal.yourTeam} · seed #{draft.seed.toUpperCase()}
        </span>
        <h1>{result.champion ? t.reveal.titleChampion : t.reveal.titleDefault}</h1>
      </section>
      <div className="fixture-list">
        {visible.map((match, index) => (
          <article className={`fixture-card sticker ${match.advanced ? "is-win" : "is-loss"}`} key={`${match.phase}-${index}`}>
            <div className="fixture-top">
              <span className="eyebrow">{campaignPhaseTitle(match.phase, locale)}</span>
              <span className="num">{match.opponentOverall}</span>
            </div>
            <div className="fixture-score">
              <span>{t.reveal.yourTeam}</span>
              <strong className="num">
                {match.gf}–{match.ga}
              </strong>
              <span>{opponentDisplayName(match.opponent, locale)}</span>
            </div>
            {match.penalties && (
              <p className="fixture-pen">
                {t.reveal.penalties} · {match.penalties.score}
              </p>
            )}
            {match.groupTable && (
              <div className="group-table">
                <span className="eyebrow">{t.reveal.group}</span>
                {match.groupTable.map((row, rowIndex) => (
                  <span className={row.me ? "me" : ""} key={`${row.label}-${rowIndex}`}>
                    {rowIndex + 1}. {row.me ? t.reveal.yourTeam : groupTeamLabel(row.label, locale)} <b>{row.pts}</b>
                  </span>
                ))}
              </div>
            )}
            <div className="goal-flow">
              {match.minutes.map((goal, goalIndex) => (
                <span key={`${goal.name}-${goal.minute}-${goalIndex}`} className={goal.side}>
                  <b className="num">{goal.minute}&apos;</b> {goal.name}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
      <button className="btn btn-primary reveal-next" onClick={onNext}>
        {done ? t.reveal.card : revealIndex === -1 ? t.reveal.first : t.reveal.next}
      </button>
    </main>
  );
}


type TournamentTab = "groups" | "bracket";

function tournamentTeamName(team: TournamentTeam | undefined, locale: Locale, fallback: string) {
  if (!team) return fallback;
  if (team.isUser) return messages[locale].reveal.yourTeam;
  return team.sel && team.copa ? `${nationName(team.sel, locale)} ${team.copa}` : team.label;
}

function tournamentMatchScore(match: TournamentMatch, visible: boolean, labels: (typeof tournamentLabels)[Locale]) {
  if (!visible) return labels.locked;
  const score = `${match.homeScore}-${match.awayScore}`;
  return match.penalties ? `${score} (${match.penalties.score})` : score;
}

function tournamentStageTitle(stage: TournamentStage, locale: Locale) {
  if (stage === "GROUP") return tournamentLabels[locale].group;
  if (stage === "ROUND_OF_32") return locale === "pt" ? "16 avos" : locale === "es" ? "Dieciseisavos" : "Round of 32";
  if (stage === "ROUND_OF_16") return locale === "pt" ? "Oitavas" : locale === "es" ? "Octavos" : "Round of 16";
  if (stage === "QUARTERFINAL") return locale === "pt" ? "Quartas" : locale === "es" ? "Cuartos" : "Quarterfinals";
  if (stage === "SEMIFINAL") return "Semifinal";
  if (stage === "THIRD_PLACE") return locale === "pt" ? "3º lugar" : locale === "es" ? "Tercer puesto" : "Third place";
  return "Final";
}

type PanelStanding = {
  teamId: string;
  order: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  gf: number;
  ga: number;
  gd: number;
  pts: number;
  qualified?: boolean;
  thirdRank?: number;
};

function panelStandings(teamIds: string[], matches: TournamentMatch[], teamsById: Map<string, TournamentTeam>): PanelStanding[] {
  const base = new Map(
    teamIds.map((teamId, index) => [
      teamId,
      { teamId, order: index, played: 0, wins: 0, draws: 0, losses: 0, pts: 0, gf: 0, ga: 0, gd: 0 },
    ]),
  );
  matches.forEach((match) => {
    const home = base.get(match.homeTeamId);
    const away = base.get(match.awayTeamId);
    if (!home || !away) return;
    home.played += 1;
    away.played += 1;
    home.gf += match.homeScore;
    home.ga += match.awayScore;
    away.gf += match.awayScore;
    away.ga += match.homeScore;
    home.gd = home.gf - home.ga;
    away.gd = away.gf - away.ga;
    if (match.homeScore > match.awayScore) {
      home.wins += 1;
      away.losses += 1;
      home.pts += 3;
    } else if (match.homeScore < match.awayScore) {
      away.wins += 1;
      home.losses += 1;
      away.pts += 3;
    } else {
      home.draws += 1;
      away.draws += 1;
      home.pts += 1;
      away.pts += 1;
    }
  });
  return [...base.values()].sort((left, right) => {
    if (right.pts !== left.pts) return right.pts - left.pts;
    if (right.gd !== left.gd) return right.gd - left.gd;
    if (right.gf !== left.gf) return right.gf - left.gf;
    const leftUser = teamsById.get(left.teamId)?.isUser ? -1 : 0;
    const rightUser = teamsById.get(right.teamId)?.isUser ? -1 : 0;
    return leftUser - rightUser || left.order - right.order;
  });
}

function standingRowsForGroup(
  group: NonNullable<ReturnType<typeof simulateCampaign>>["tournament"]["groups"][number],
  visibleMatchday: number,
  tournamentMatches: TournamentMatch[],
  teamsById: Map<string, TournamentTeam>,
) {
  if (visibleMatchday >= 3) return group.standings;
  return panelStandings(
    group.teamIds,
    tournamentMatches.filter((match) => match.stage === "GROUP" && match.group === group.group && (match.matchday ?? 0) <= visibleMatchday),
    teamsById,
  );
}

function TeamFlag({ team, locale }: { team: TournamentTeam | undefined; locale: Locale }) {
  if (!team?.sel) return <span className="tour-flag-placeholder" aria-hidden="true" />;
  return <FlagImage code={team.sel} label={tournamentTeamName(team, locale, team.label)} />;
}

function teamResultInMatch(match: TournamentMatch, teamId: string) {
  const isHome = match.homeTeamId === teamId;
  const gf = isHome ? match.homeScore : match.awayScore;
  const ga = isHome ? match.awayScore : match.homeScore;
  if (gf > ga) return "win";
  if (gf < ga) return "loss";
  return "draw";
}

function TournamentForm({ teamId, matches }: { teamId: string; matches: TournamentMatch[] }) {
  const results = matches
    .filter((match) => match.homeTeamId === teamId || match.awayTeamId === teamId)
    .sort((left, right) => left.id - right.id)
    .slice(-5)
    .map((match) => teamResultInMatch(match, teamId));
  return (
    <div className="tour-form" aria-label="form">
      {Array.from({ length: 5 }, (_, index) => {
        const result = results[index];
        return <span className={`tour-form-dot ${result ? `is-${result}` : ""}`} key={index} aria-label={result ?? undefined} />;
      })}
    </div>
  );
}

function GroupStandingsTable({
  group,
  locale,
  labels,
  rows,
  teamsById,
  visibleMatches,
}: {
  group: string;
  locale: Locale;
  labels: (typeof tournamentLabels)[Locale];
  rows: PanelStanding[] | NonNullable<ReturnType<typeof simulateCampaign>>["tournament"]["groups"][number]["standings"];
  teamsById: Map<string, TournamentTeam>;
  visibleMatches: TournamentMatch[];
}) {
  return (
    <section className="tour-group-card">
      <h3>{labels.group} {group}</h3>
      <div className="tour-standings" role="table" aria-label={`${labels.group} ${group}`}>
        <div className="tour-standings-row is-head" role="row">
          <span>{labels.team}</span>
          <span>{labels.pts}</span>
          <span>{labels.played}</span>
          <span>{labels.wins}</span>
          <span>{labels.draws}</span>
          <span>{labels.losses}</span>
          <span>{labels.for}</span>
          <span>{labels.ga}</span>
          <span>{labels.gd}</span>
          <span>{labels.form}</span>
        </div>
        {rows.map((row, index) => {
          const team = teamsById.get(row.teamId);
          return (
            <div className={`tour-standings-row ${team?.isUser ? "is-user" : ""} ${row.qualified ? "is-qualified" : ""}`} role="row" key={row.teamId}>
              <span className="tour-team-name"><span className="num">{index + 1}</span><TeamFlag team={team} locale={locale} /><strong>{tournamentTeamName(team, locale, labels.tbd)}</strong></span>
              <strong className="num">{row.pts}</strong>
              <span className="num">{row.played}</span>
              <span className="num">{row.wins}</span>
              <span className="num">{row.draws}</span>
              <span className="num">{row.losses}</span>
              <span className="num">{row.gf}</span>
              <span className="num">{row.ga}</span>
              <span className="num">{row.gd > 0 ? `+${row.gd}` : row.gd}</span>
              <TournamentForm teamId={row.teamId} matches={visibleMatches} />
            </div>
          );
        })}
      </div>
    </section>
  );
}

function BracketMatchCard({
  locale,
  labels,
  match,
  teamsById,
  scoreVisible,
  teamsVisible,
}: {
  locale: Locale;
  labels: (typeof tournamentLabels)[Locale];
  match: TournamentMatch;
  teamsById: Map<string, TournamentTeam>;
  scoreVisible: boolean;
  teamsVisible: boolean;
}) {
  const home = teamsVisible ? teamsById.get(match.homeTeamId) : undefined;
  const away = teamsVisible ? teamsById.get(match.awayTeamId) : undefined;
  const score = scoreVisible ? tournamentMatchScore(match, scoreVisible, labels) : "vs";
  return (
    <article className={`tour-bracket-match ${match.isUserMatch ? "is-user" : ""}`}>
      <div className="tour-bracket-side"><TeamFlag team={home} locale={locale} /><strong>{tournamentTeamName(home, locale, labels.tbd)}</strong></div>
      <div className={`tour-bracket-score num ${scoreVisible ? "" : "is-locked"}`}>{score}</div>
      <div className="tour-bracket-side"><TeamFlag team={away} locale={locale} /><strong>{tournamentTeamName(away, locale, labels.tbd)}</strong></div>
    </article>
  );
}

function TournamentModal({
  locale,
  result,
  visibleCount,
  onClose,
}: {
  locale: Locale;
  result: NonNullable<ReturnType<typeof simulateCampaign>>;
  visibleCount: number;
  onClose: () => void;
}) {
  const labels = tournamentLabels[locale];
  const tournament = result.tournament;
  const teamsById = useMemo(() => new Map(tournament.teams.map((team) => [team.id, team])), [tournament.teams]);
  const revealedCampaign = result.campaign.slice(0, visibleCount);
  const revealedMatchIds = new Set(revealedCampaign.map((match) => match.matchId).filter((id): id is number => typeof id === "number"));
  const revealedTournamentMatches = tournament.matches.filter((match) => revealedMatchIds.has(match.id));
  const revealedStages = new Set(revealedTournamentMatches.map((match) => match.stage));
  const revealedGroupMatchday = Math.max(0, ...revealedTournamentMatches.filter((match) => match.stage === "GROUP").map((match) => match.matchday ?? 0));
  const nextCampaignMatch = result.campaign[visibleCount];
  const nextTournamentMatch = nextCampaignMatch?.matchId ? tournament.matches.find((match) => match.id === nextCampaignMatch.matchId) : null;
  const knockoutHasFocus = (nextTournamentMatch?.stage && nextTournamentMatch.stage !== "GROUP") || [...revealedStages].some((stage) => stage !== "GROUP");
  const [tab, setTab] = useState<TournamentTab>(knockoutHasFocus ? "bracket" : "groups");
  const bracketStages: TournamentStage[] = ["ROUND_OF_32", "ROUND_OF_16", "QUARTERFINAL", "SEMIFINAL", "FINAL", "THIRD_PLACE"];
  const stageOrder = new Map(bracketStages.map((stage, index) => [stage, index]));
  const visibleGroupMatches = tournament.matches.filter((match) => match.stage === "GROUP" && (match.matchday ?? 0) <= revealedGroupMatchday);
  const nextKnockoutStage = nextTournamentMatch?.stage !== "GROUP" ? nextTournamentMatch?.stage : undefined;
  const latestRevealedKnockoutIndex = Math.max(
    -1,
    ...[...revealedStages].filter((stage) => stage !== "GROUP").map((stage) => stageOrder.get(stage) ?? -1),
  );

  function scoreVisible(match: TournamentMatch) {
    if (match.stage === "GROUP") return (match.matchday ?? 0) <= revealedGroupMatchday;
    return revealedStages.has(match.stage);
  }

  function bracketTeamsVisible(stage: TournamentStage) {
    const index = stageOrder.get(stage) ?? 0;
    if (index === 0) return true;
    if (stage === nextKnockoutStage) return true;
    return latestRevealedKnockoutIndex >= index - 1;
  }

  return (
    <div className="tour-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="tour-modal" role="dialog" aria-modal="true" aria-label={labels.viewTable} onMouseDown={(event) => event.stopPropagation()}>
        <header className="tour-modal-head">
          <div>
            <span className="eyebrow">{labels.button}</span>
            <h2>{labels.viewTable}</h2>
          </div>
          <button className="tour-modal-close" type="button" onClick={onClose} aria-label={labels.close}>X</button>
        </header>
        <div className="tour-tabs" role="tablist" aria-label={labels.viewTable}>
          <button className={`tour-tab ${tab === "groups" ? "is-active" : ""}`} onClick={() => setTab("groups")} type="button">{labels.groupsTab}</button>
          <button className={`tour-tab ${tab === "bracket" ? "is-active" : ""}`} onClick={() => setTab("bracket")} type="button">{labels.bracketTab}</button>
        </div>

        {tab === "groups" ? (
          <div className="tour-groups-grid">
            {tournament.groups.map((group) => (
              <GroupStandingsTable
                group={group.group}
                key={group.group}
                labels={labels}
                locale={locale}
                rows={standingRowsForGroup(group, revealedGroupMatchday, tournament.matches, teamsById)}
                teamsById={teamsById}
                visibleMatches={visibleGroupMatches.filter((match) => match.group === group.group)}
              />
            ))}
          </div>
        ) : (
          <div className="tour-bracket-grid">
            {bracketStages.map((stage) => {
              const matches = tournament.matches.filter((match) => match.stage === stage);
              return (
                <section className={`tour-bracket-stage stage-${stage.toLowerCase().replaceAll("_", "-")}`} key={stage}>
                  <h3>{tournamentStageTitle(stage, locale)}</h3>
                  <div className="tour-bracket-list">
                    {matches.map((match) => (
                      <BracketMatchCard
                        key={match.id}
                        labels={labels}
                        locale={locale}
                        match={match}
                        teamsById={teamsById}
                        scoreVisible={scoreVisible(match)}
                        teamsVisible={bracketTeamsVisible(stage)}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function AnimatedRevealView({
  locale,
  result,
  draft,
  onDone,
  onAgain,
}: {
  locale: Locale;
  result: NonNullable<ReturnType<typeof simulateCampaign>>;
  draft: Draft;
  onDone: () => void;
  onAgain: () => void;
}) {
  const t = messages[locale];
  const controls = revealControlLabels[locale];
  const [visibleCount, setVisibleCount] = useState(0);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [readyForNext, setReadyForNext] = useState(true);
  const [tournamentOpen, setTournamentOpen] = useState(false);
  const [mode, setMode] = useState<RevealMode>(readStoredRevealMode);
  const [speed, setSpeed] = useState<RevealSpeed>(readStoredRevealSpeed);
  const [reducedMotion, setReducedMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true,
  );
  const fixtureListRef = useRef<HTMLDivElement>(null);
  const visible = result.campaign.slice(0, visibleCount);
  const allMatchesVisible = visibleCount >= result.campaign.length;
  const campaignComplete = allMatchesVisible && readyForNext;
  const msPerMin = revealSpeeds[speed];

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  useEffect(() => {
    const media = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!media) return;
    const updateReducedMotion = () => setReducedMotion(media.matches);
    media.addEventListener("change", updateReducedMotion);
    return () => media.removeEventListener("change", updateReducedMotion);
  }, []);

  const revealNext = useCallback(() => {
    if (!readyForNext || visibleCount >= result.campaign.length) return;
    const nextIndex = visibleCount;
    setVisibleCount(nextIndex + 1);
    setActiveIndex(nextIndex);
    setExpandedIndex(nextIndex);
    if (reducedMotion) {
      setReadyForNext(true);
      return;
    }
    setReadyForNext(false);
  }, [readyForNext, reducedMotion, result.campaign, visibleCount]);

  useEffect(() => {
    if (readyForNext || activeIndex < 0 || reducedMotion) return;
    const match = result.campaign[activeIndex];
    if (!match) return;
    const timer = window.setTimeout(() => {
      setReadyForNext(true);
    }, revealDuration(match, msPerMin, activeIndex));
    return () => window.clearTimeout(timer);
  }, [activeIndex, msPerMin, readyForNext, reducedMotion, result.campaign]);

  useEffect(() => {
    if (mode !== "auto" || !readyForNext || allMatchesVisible) return;
    const timer = window.setTimeout(() => {
      revealNext();
    }, visibleCount === 0 ? 300 : 350);
    return () => window.clearTimeout(timer);
  }, [allMatchesVisible, mode, readyForNext, revealNext, visibleCount]);

  useEffect(() => {
    const target = campaignComplete
      ? fixtureListRef.current?.parentElement?.querySelector(".campaign-summary")
      : fixtureListRef.current?.querySelector(".reveal-fixture.is-current");
    window.setTimeout(() => scrollTargetIntoView(target ?? null), 0);
  }, [activeIndex, campaignComplete, visibleCount]);

  function setRevealMode(next: RevealMode) {
    setMode(next);
    localStorage.setItem(REVEAL_STORAGE_KEY, next);
  }

  function setRevealSpeed(next: RevealSpeed) {
    setSpeed(next);
    localStorage.setItem(SPEED_STORAGE_KEY, next);
  }

  function toggleFixture(index: number) {
    setExpandedIndex((current) => (current === index ? null : index));
  }

  const showNextButton = readyForNext && (mode === "manual" || campaignComplete);

  return (
    <main className="reveal-wrap reveal-dream tx-paper">
      <section className="reveal-head reveal-head-animated">
        <div>
          <span className="eyebrow">
            {t.reveal.yourTeam} / seed #{draft.seed.toUpperCase()}
          </span>
          <h1>{result.champion && campaignComplete ? t.reveal.titleChampion : t.reveal.titleDefault}</h1>
        </div>
        <div className="reveal-controls">
          <div className="reveal-mode" role="group" aria-label={controls.modeManual}>
            {(["manual", "auto"] as const).map((option) => (
              <button
                className={`chip ${mode === option ? "is-active" : ""}`}
                key={option}
                onClick={() => setRevealMode(option)}
                type="button"
                aria-pressed={mode === option}
              >
                {option === "manual" ? controls.modeManual : controls.modeAuto}
              </button>
            ))}
          </div>
          <label className="reveal-speed">
            <span className="eyebrow">{controls.speedLabel}</span>
            <select value={speed} onChange={(event) => setRevealSpeed(event.target.value as RevealSpeed)}>
              {revealSpeedKeys.map((option) => (
                <option value={option} key={option}>
                  {controls[`speed${option[0].toUpperCase()}${option.slice(1)}` as keyof typeof controls]}
                </option>
              ))}
            </select>
          </label>
          <SettingsToggle locale={locale} label={t.home.settings} />
        </div>
      </section>
      {tournamentOpen && <TournamentModal locale={locale} result={result} visibleCount={visibleCount} onClose={() => setTournamentOpen(false)} />}
      <div className="fixture-list" ref={fixtureListRef}>
        {visible.map((match, index) => (
          <AnimatedFixture
            active={index === activeIndex}
            expanded={expandedIndex === index}
            instant={reducedMotion || index !== activeIndex}
            index={index}
            key={`${match.phase}-${index}`}
            locale={locale}
            match={match}
            msPerMin={msPerMin}
            onToggle={() => toggleFixture(index)}
          />
        ))}
      </div>
      {campaignComplete && <RevealSummary locale={locale} result={result} />}
      {campaignComplete ? (
        <div className="reveal-final-actions">
          <button className="btn btn-secondary reveal-repeat" onClick={onAgain} type="button">
            {"\u21bb"} {t.card.again}
          </button>
          <button className="btn btn-secondary reveal-table" onClick={() => setTournamentOpen(true)} type="button">
            <TableIcon /> {tournamentLabels[locale].viewTable}
          </button>
          <button className="btn btn-primary reveal-next" onClick={onDone} type="button">
            {t.reveal.card}
          </button>
        </div>
      ) : showNextButton ? (
        <div className="reveal-action-row">
          <button className="btn btn-primary reveal-next" onClick={revealNext} type="button">
            {visibleCount === 0 ? t.reveal.first : t.reveal.next}
          </button>
          <button className="btn btn-secondary reveal-table" onClick={() => setTournamentOpen(true)} type="button">
            <TableIcon /> {tournamentLabels[locale].viewTable}
          </button>
        </div>
      ) : null}
    </main>
  );
}

function RevealSummary({
  locale,
  result,
}: {
  locale: Locale;
  result: NonNullable<ReturnType<typeof simulateCampaign>>;
}) {
  const t = messages[locale];
  const goalsAgainstLabel = t.card.ga;
  return (
    <section className="campaign-summary">
      <div className="summary-mark">
        <span className="num summary-record">{result.record}</span>
        <strong className="num summary-score">
          {result.wins}-{result.losses}
        </strong>
      </div>
      <hr />
      <div className="summary-detail">
        <h2>{result.champion ? t.reveal.champion : t.reveal.eliminated}</h2>
        <div className="summary-stats">
          <span>
            <b className="num">{result.gf}</b>
            <small>{t.card.gf}</small>
          </span>
          <span>
            <b className="num">{result.ga}</b>
            <small>{goalsAgainstLabel}</small>
          </span>
          <span>
            <b className="num">{result.wins}</b>
            <small>{t.card.wins}</small>
          </span>
        </div>
      </div>
    </section>
  );
}

function PenaltyKickMark({ kick }: { kick: number }) {
  return (
    <span className={`rv-kick ${kick ? "is-goal" : "is-miss"}`} aria-hidden="true">
      {kick ? "\u2713" : "\u00d7"}
    </span>
  );
}

function PenaltyRound({
  locale,
  me,
  opponent,
  opponentName,
}: {
  locale: Locale;
  me: { kick: number; name?: string } | null;
  opponent: { kick: number; name?: string } | null;
  opponentName: string;
}) {
  const t = messages[locale];
  return (
    <div className="rv-pen-round">
      <span className="rv-kick-row rv-kick-row--me">
        {me && (
          <>
            <PenaltyKickMark kick={me.kick} />
            <span className="rv-kick-name">{me.name ?? t.reveal.yourTeam}</span>
          </>
        )}
      </span>
      <span className="rv-pen-vs">{me && opponent ? "vs" : ""}</span>
      <span className="rv-kick-row rv-kick-row--them">
        {opponent && (
          <>
            <span className="rv-kick-name">{opponent.name ?? opponentName}</span>
            <PenaltyKickMark kick={opponent.kick} />
          </>
        )}
      </span>
    </div>
  );
}

function AnimatedFixture({
  active,
  expanded,
  instant,
  index,
  locale,
  match,
  msPerMin,
  onToggle,
}: {
  active: boolean;
  expanded: boolean;
  instant: boolean;
  index: number;
  locale: Locale;
  match: CampaignMatch;
  msPerMin: number;
  onToggle: () => void;
}) {
  const t = messages[locale];
  const summaryLabels = fixtureSummaryLabels[locale];
  const [firstHalfExtra, secondHalfExtra] = stoppageMinutes(match.gf, match.ga, index);
  const timing = revealTiming(msPerMin, firstHalfExtra, secondHalfExtra);
  const finalElapsed = timing.p5End + 600 + revealExtraDuration(match, msPerMin);
  const [elapsed, setElapsed] = useState(instant ? finalElapsed : -1);

  useEffect(() => {
    if (!active || instant) {
      const resetTimer = window.setTimeout(() => setElapsed(finalElapsed), 0);
      return () => window.clearTimeout(resetTimer);
    }
    const resetTimer = window.setTimeout(() => setElapsed(-1), 0);
    const startedAt = Date.now();
    const interval = window.setInterval(() => {
      const next = Date.now() - startedAt - revealKickoffDelay;
      setElapsed(Math.max(-1, next));
      if (next >= finalElapsed) window.clearInterval(interval);
    }, 60);
    return () => {
      window.clearTimeout(resetTimer);
      window.clearInterval(interval);
    };
  }, [active, finalElapsed, instant]);

  const inProgress = active && !instant && elapsed < timing.p5End;
  const pending = active && !instant && elapsed < 0;
  const clock = clockFromElapsed(elapsed, msPerMin, firstHalfExtra, secondHalfExtra);
  const visibleGoals = inProgress ? match.minutes.filter((goal) => goal.minute <= clock.minute) : match.minutes;
  const liveGf = inProgress ? visibleGoals.filter((goal) => goal.side === "me").length : match.gf;
  const liveGa = inProgress ? visibleGoals.filter((goal) => goal.side === "them").length : match.ga;
  const latestGoal = visibleGoals.at(-1);
  const showFinal = !pending && !inProgress;
  const mark = match.phase === "FINAL" && match.advanced ? "*" : match.advanced ? "\u2713" : "\u00d7";
  const penaltyKicks = match.penalties ? penaltyTimeline(match.penalties) : [];
  const penaltyStart = timing.p5End + 600;
  const visiblePenaltyCount =
    match.penalties && showFinal
      ? instant
        ? penaltyKicks.length
        : Math.min(penaltyKicks.length, Math.max(0, Math.floor((elapsed - penaltyStart) / penaltyKickDuration(msPerMin))))
      : 0;
  const visiblePenaltyKicks = penaltyKicks.slice(0, visiblePenaltyCount);
  const visibleMeKicks = visiblePenaltyKicks.filter((kick) => kick.side === "me");
  const visibleThemKicks = visiblePenaltyKicks.filter((kick) => kick.side === "them");
  const nextPenaltyKick = match.penalties && visiblePenaltyCount < penaltyKicks.length ? penaltyKicks[visiblePenaltyCount] : null;
  const penaltyComplete = Boolean(match.penalties && visiblePenaltyCount >= penaltyKicks.length);
  const livePenaltyScore = match.penalties
    ? penaltyComplete
      ? match.penalties.score
      : `${visibleMeKicks.reduce((sum, kick) => sum + kick.kick, 0)}-${visibleThemKicks.reduce((sum, kick) => sum + kick.kick, 0)}`
    : "";
  const visiblePenaltyKeys = new Set(visiblePenaltyKicks.map(penaltyKickKey));
  const basePenaltyRows = match.penalties ? penaltyRows(match.penalties, "base", visiblePenaltyKeys) : [];
  const suddenDeathPenaltyRows = match.penalties ? penaltyRows(match.penalties, "sd", visiblePenaltyKeys) : [];
  const scoreText = pending ? "\u00b7 \u00b7 \u00b7" : `${liveGf}-${liveGa}`;
  const goalSummary = summarizeGoals(visibleGoals, "me");
  const concededSummary = summarizeGoals(visibleGoals, "them");
  const code = opponentCode(match.opponent);
  const opponentName = opponentDisplayName(match.opponent, locale);
  const showBody = !pending && expanded;
  const showHeaderSummary = !pending && !expanded && (goalSummary || concededSummary);
  const groupPosition = match.groupTable?.findIndex((row) => row.me) ?? -1;
  const groupRankText = groupPosition >= 0 ? groupRank(groupPosition, locale) : "";
  const hasFinalTone = !active || instant || showFinal;
  const resultTone = hasFinalTone ? (match.advanced ? "is-win" : "is-loss") : "is-live";
  const scoreTone = !pending && liveGf < liveGa ? "is-score-loss" : "";

  return (
    <article
      className={`fixture-card sticker reveal-fixture ${resultTone} ${scoreTone} ${active ? "is-current" : ""} ${expanded ? "is-expanded" : ""} ${match.penalties && showFinal ? "is-pen" : ""}`}
    >
      <button
        aria-expanded={expanded}
        className={`fixture-score reveal-score ${expanded ? "is-expanded" : ""}`}
        onClick={onToggle}
        type="button"
      >
        <span className="fx-phase">{campaignPhaseTitle(match.phase, locale)}</span>
        <span className="fx-opp">
          <span className="fx-vs">vs</span>
          <span className="fx-flag" aria-label={nationName(code, locale)}>
            <FlagImage code={code} label={nationName(code, locale)} />
          </span>
          <strong>{opponentName}</strong>
        </span>
        <strong
          className={`num fx-score ${pending ? "is-pending" : ""} ${latestGoal?.side === "them" ? "score-snap-them" : "score-snap"}`}
          key={pending ? "pending" : `${liveGf}-${liveGa}`}
        >
          {scoreText}
        </strong>
        <span className="fixture-clock">
          {showFinal ? <b className="fx-mark">{mark}</b> : clock.label ? <b className="num">{clock.label}&apos;</b> : ""}
        </span>
        <span className="rv-caret" aria-hidden="true">
          {"\u203a"}
        </span>
        {showHeaderSummary && (
          <span className="fx-scorers">
            {goalSummary && (
              <span>
                <b>{summaryLabels.goals}</b> {goalSummary}
              </span>
            )}
            {goalSummary && concededSummary && <em>{"\u00b7"}</em>}
            {concededSummary && (
              <span>
                <b>{summaryLabels.conceded}</b> {concededSummary}
              </span>
            )}
          </span>
        )}
      </button>
      {showBody && (
        <div className={`reveal-body ${instant ? "is-instant" : ""}`}>
          {visibleGoals.length > 0 && (
            <ol className="rv-tl">
              {visibleGoals.map((goal, goalIndex) => (
                <li
                  className={`rv-goal ${goal.side === "them" ? "is-opp" : ""}`}
                  key={`${goal.name}-${goal.minute}-${goalIndex}`}
                  style={instant ? undefined : { animationDelay: `${goalIndex * 0.05}s` }}
                >
                  <span className="rv-min num">{goal.minute}&apos;</span>
                  <span className="rv-ico" aria-hidden="true">
                    {"\u2022"}
                  </span>
                  <span className="rv-scorer">{goal.name}</span>
                </li>
              ))}
            </ol>
          )}
          {showFinal && match.penalties && (
            <div className={`fixture-pen ${penaltyComplete ? "is-complete" : "is-live"}`}>
              <div className="rv-pens-h eyebrow">{penaltyStageLabels[locale].bestOfFive}</div>
              {!penaltyComplete && nextPenaltyKick && (
                <span className="penalty-live">
                  {penaltyLiveLabels[locale]} {"\u00b7"} {nextPenaltyKick.name ?? (nextPenaltyKick.side === "me" ? t.reveal.yourTeam : opponentName)}
                </span>
              )}
              <div className="rv-pens-rounds">
                {basePenaltyRows.map((row) => (
                  <PenaltyRound locale={locale} me={row.me} opponent={row.them} opponentName={opponentName} key={`base-${row.index}`} />
                ))}
              </div>
              {suddenDeathPenaltyRows.length > 0 && (
                <div className="rv-sd">
                  <div className="rv-pens-h eyebrow">{penaltyStageLabels[locale].suddenDeath}</div>
                  <div className="rv-pens-rounds">
                    {suddenDeathPenaltyRows.map((row) => (
                      <PenaltyRound locale={locale} me={row.me} opponent={row.them} opponentName={opponentName} key={`sd-${row.index}`} />
                    ))}
                  </div>
                </div>
              )}
              {visiblePenaltyCount > 0 && (
                <div className="rv-pens-out">
                  <span className="num">{livePenaltyScore}</span> {penaltyComplete ? penaltyStageLabels[locale][match.advanced ? "advanced" : "eliminated"] : ""}
                </div>
              )}
            </div>
          )}
          {showFinal && match.groupTable && (
            <div className="rv-table-wrap">
              <div className="rv-table-h eyebrow">{t.reveal.group}</div>
              <div className="rv-table">
                {match.groupTable.map((row, rowIndex) => (
                  <div className={`rv-trow ${row.me ? "is-me" : ""}`} key={`${row.label}-${rowIndex}`} style={instant ? undefined : { animationDelay: `${rowIndex * 0.09}s` }}>
                    <span className="rv-tpos num">{groupRank(rowIndex, locale)}</span>
                    <span className="rv-tname">{row.me ? t.reveal.yourTeam : <GroupTeamLabel label={row.label} locale={locale} />}</span>
                    <span className="rv-tnum num">
                      {row.pts} {pointsLabel(row.pts, locale)}
                    </span>
                    <span className="rv-tnum num">{row.gd >= 0 ? `+${row.gd}` : row.gd}</span>
                  </div>
                ))}
              </div>
              {groupRankText && <div className="rv-qualified">{groupOutcomeLabel(locale, groupRankText, match.advanced)}</div>}
            </div>
          )}
        </div>
      )}
    </article>
  );
}

async function loadOpponentSquads(seed: string, selected: Player[]) {
  const random = rng(`${seed}:opponents`);
  const used = new Set(selected.map((player) => `${player.sel}:${player.copa}`));
  const metas: SquadFile[] = [];
  while (metas.length < 47) {
    const meta = squadIndex[Math.floor(random() * squadIndex.length)]!;
    const key = `${meta.sel}:${meta.copa}`;
    if (used.has(key)) continue;
    used.add(key);
    metas.push(await fetchSquad(meta.sel, meta.copa));
  }
  return metas;
}

function payloadToDraft(payload: SharePayload, squads: SquadFile[]) {
  const draft = createDraft(payload.seed, {
    formation: payload.formation,
    style: payload.style,
    mode: payload.mode,
  });
  for (const item of payload.xi) {
    const squad = squads.find((entry) => entry.sel === item.sel && entry.copa === item.copa);
    const player = squad ? findPlayerInSquad(squad, item.playerId) : null;
    if (player && draft.slots[item.slot]) {
      draft.filled[item.slot] = player;
      draft.usedPlayerIds.push(player.playerId);
    }
  }
  return draft;
}

export function PlayClient({ locale, sharedCode }: { locale: Locale; sharedCode?: string }) {
  const t = messages[locale];
  const [draft, setDraft] = useState(() => createSeededDraft(defaultOptions));
  const [squad, setSquad] = useState<SquadFile | null>(null);
  const [selected, setSelected] = useState<Player | null>(null);
  const [rollingPair, setRollingPair] = useState<DrawPair | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [phase, setPhase] = useState<Phase>("drafting");
  const [result, setResult] = useState<ReturnType<typeof simulateCampaign> | null>(null);
  const [loading, setLoading] = useState(Boolean(sharedCode));
  const rollColumnRef = useRef<HTMLDivElement>(null);
  const pitchColumnRef = useRef<HTMLDivElement>(null);
  const complete = draft.filled.every(Boolean);

  useEffect(() => {
    if (!sharedCode) return;
    let cancelled = false;
    async function loadShared() {
      const payload = decodeSharePayload(sharedCode!);
      if (!payload) {
        setLoading(false);
        return;
      }
      const unique = [...new Set(payload.xi.map((item) => `${item.sel}:${item.copa}`))];
      const squads = await Promise.all(
        unique.map((key) => {
          const [sel, copa] = key.split(":");
          return fetchSquad(sel!, Number(copa));
        }),
      );
      const loadedDraft = payloadToDraft(payload, squads);
      const opponents = await loadOpponentSquads(payload.seed, loadedDraft.filled.filter(Boolean) as Player[]);
      const sim = simulateCampaign(payload.seed, loadedDraft, opponents);
      if (!cancelled) {
        setDraft(loadedDraft);
        setResult(sim);
        setPhase("result");
        setLoading(false);
      }
    }
    loadShared().catch(() => setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [locale, sharedCode]);

  async function playRollAnimation(finalPair: DrawPair) {
    setIsRolling(true);
    const random = rng(`${draft.seed}:roll-preview:${draft.rollIndex}:${finalPair.sel}:${finalPair.copa}`);
    await new Promise<void>((resolve) => {
      let ticks = 0;
      const timer = window.setInterval(() => {
        const preview = squadIndex[Math.floor(random() * squadIndex.length)]!;
        setRollingPair({ sel: preview.sel, copa: preview.copa });
        ticks += 1;
        if (ticks >= 8) {
          window.clearInterval(timer);
          setRollingPair(finalPair);
          window.setTimeout(resolve, 140);
        }
      }, 80);
    });
  }

  async function rollNext() {
    if (isRolling) return;
    const recent = draft.current ? [draft.current] : [];
    const meta = rollPair(draft.seed, draft.rollIndex, recent);
    setSquad(null);
    setSelected(null);
    const [loaded] = await Promise.all([fetchSquad(meta.sel, meta.copa), playRollAnimation(meta)]);
    setSquad(loaded);
    setDraft((current) => ({
      ...current,
      current: { sel: meta.sel, copa: meta.copa },
      rollIndex: current.rollIndex + 1,
    }));
    setRollingPair(null);
    setIsRolling(false);
    window.setTimeout(scrollDraftIntoView, 0);
  }

  async function reroll(axis: "sel" | "copa") {
    if (!draft.current || draft.rerollsLeft <= 0 || isRolling) return;
    const meta = rerollPair(draft.seed, draft.current, axis, modeConfig[draft.options.mode].rerolls - draft.rerollsLeft + 1);
    setSquad(null);
    setSelected(null);
    const [loaded] = await Promise.all([fetchSquad(meta.sel, meta.copa), playRollAnimation(meta)]);
    setSquad(loaded);
    setDraft((current) => ({
      ...current,
      current: { sel: meta.sel, copa: meta.copa },
      rerollsLeft: current.rerollsLeft - 1,
    }));
    setRollingPair(null);
    setIsRolling(false);
    window.setTimeout(scrollDraftIntoView, 0);
  }

  function setOptions(options: DraftOptions) {
    setDraft((current) => updateDraftOptions(current, options));
    setSquad(null);
    setRollingPair(null);
    setIsRolling(false);
    setSelected(null);
    setResult(null);
    setPhase("drafting");
  }

  function chooseSlot(index: number) {
    if (!selected) return;
    if (draft.filled[index] || !selected.positions.includes(draft.slots[index]!.pos)) return;
    setDraft((current) => {
      const filled = [...current.filled];
      filled[index] = selected;
      return {
        ...current,
        filled,
        current: null,
        usedPlayerIds: [...current.usedPlayerIds, selected.playerId],
      };
    });
    setSelected(null);
    setSquad(null);
    window.setTimeout(() => scrollTargetIntoView(rollColumnRef.current), 0);
  }

  function selectPlayer(player: Player) {
    if (selected?.playerId === player.playerId) {
      setSelected(null);
      return;
    }
    const positions = availablePositions(draft, player);
    setSelected(positions.length ? player : null);
    if (positions.length) window.setTimeout(() => scrollTargetIntoView(pitchColumnRef.current), 0);
  }

  async function simulate() {
    const selectedPlayers = draft.filled.filter(Boolean) as Player[];
    const opponents = await loadOpponentSquads(draft.seed, selectedPlayers);
    const sim = simulateCampaign(draft.seed, draft, opponents);
    setResult(sim);
    setPhase("revealing");
  }

  function again() {
    setDraft(createSeededDraft(draft.options));
    setSquad(null);
    setSelected(null);
    setResult(null);
    setPhase("drafting");
  }

  if (loading) {
    return <main className="home-wrap">{t.play.loading}</main>;
  }

  if (phase === "revealing" && result) {
    return (
      <AnimatedRevealView
        locale={locale}
        result={result}
        draft={draft}
        onDone={() => setPhase("result")}
        onAgain={again}
      />
    );
  }

  if (phase === "result" && result) {
    return <ResultCard locale={locale} result={result} draft={draft} onAgain={again} />;
  }

  return (
    <main className="play-dream tx-paper">
      <header className="site-header draft-header">
        <div className="site-header-left">
          <Link href={localePath(locale, "/")} className="home-link" aria-label={t.play.back} prefetch={false}>
            <Logo subtitle={t.logoSub} />
          </Link>
        </div>
        <div className="site-header-right draft-header-right">
          <div className="play-controls">
            <span className="eyebrow">
              {draft.options.formation} · {styleLabels[locale][draft.options.style]} ·{" "}
              {draft.options.mode === "classico" ? t.play.classic : t.play.memory}
            </span>
            <div className="play-toggles">
              <Link className="profile-link play-profile-link" href={localePath(locale, "/perfil")} prefetch={false}>
                <svg className="profile-ic" viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="7.5" r="3.5" />
                  <path d="M5.2 20c.8-4 4-6.1 6.8-6.1s6 2.1 6.8 6.1" />
                  <path d="M8 20h8" />
                </svg>
                <span className="profile-link-label">{t.home.profile}</span>
              </Link>
              <SettingsToggle locale={locale} label={t.home.settings} />
            </div>
          </div>
        </div>
      </header>
      <div className="draft-layout">
        <div className="col-roll" ref={rollColumnRef}>
          {draft.rollIndex === 0 && <SetupControls locale={locale} draft={draft} onOptions={setOptions} />}
          {complete ? (
            <div className="roll-panel">
              <div className="roll-result sticker">
                <span className="eyebrow">{t.play.lineupComplete}</span>
                <div className="rr-sel num">11/11</div>
              </div>
              <button className="btn btn-primary roll-btn" onClick={simulate}>
                {t.play.simulate}
              </button>
            </div>
          ) : (
            <RollPanel
              locale={locale}
              draft={draft}
              squad={squad}
              rollingPair={rollingPair}
              selected={selected}
              isRolling={isRolling}
              onRoll={rollNext}
              onReroll={reroll}
              onSelect={selectPlayer}
            />
          )}
        </div>
        <div className="col-pitch" ref={pitchColumnRef}>
          <Pitch locale={locale} draft={draft} selected={selected} onSlot={chooseSlot} />
          {!selected && draft.filled.some(Boolean) && <p className="pitch-hint">{t.play.hintMove}</p>}
          {selected && <p className="pitch-hint">{selected.name} · {describePair(selected.sel, selected.copa, locale)}</p>}
        </div>
        <div className="col-box">
          <BoxScore locale={locale} draft={draft} />
        </div>
      </div>
    </main>
  );
}

export async function resolveSharedCode(code: string) {
  if (decodeSharePayload(code)) return code;
  const meta = findSquadMeta("BRA", 1970);
  void meta;
  return code;
}
