"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CampaignMatch, Draft, DraftOptions, Locale, Player, SharePayload, SquadFile } from "@/lib/types";
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
import { nationFlag, nationName } from "@/lib/nations";
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
const penaltyLiveLabels: Record<Locale, string> = {
  pt: "Cobrando",
  en: "Taking",
  es: "Patea",
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
    return 2 * Math.max(match.penalties.me.length, match.penalties.them.length) * penaltyKickDuration(msPerMin) + 520;
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
  const kicks: Array<{ side: "me" | "them"; kick: number; index: number }> = [];
  const rounds = Math.max(penalties.me.length, penalties.them.length);
  for (let index = 0; index < rounds; index += 1) {
    const meKick = penalties.me[index];
    const themKick = penalties.them[index];
    if (meKick !== undefined) kicks.push({ side: "me", kick: meKick, index });
    if (themKick !== undefined) kicks.push({ side: "them", kick: themKick, index });
  }
  return kicks;
}

function opponentCode(label: string) {
  return label.split(" ")[0] ?? "";
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
        ? ["anuncia aquí", "contacto", "anuncia aquí"]
        : ["advertise here", "contact", "advertise here"];
  const hrefs = ["https://ko-fi.com/7a0wc", "https://x.com/chavozik4", "https://pixgg.com/7a0"];
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

function scrollDraftIntoView() {
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
                <span className="disc-circle num">{player ? player.number : positionLabels[locale][slot.pos]}</span>
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
    return squad.squad
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
          <span className="rr-flag">{nationFlag(displayPair.sel)}</span>
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
            {t.play.reroll} · {draft.rerollsLeft} {locale === "pt" ? "restantes" : locale === "es" ? "restantes" : "left"}
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
              <span className="pc-num num">#{player.number}</span>
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
    <main className="reveal-wrap tx-paper">
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
              <span className="eyebrow">{match.phase}</span>
              <span className="num">{match.opponentOverall}</span>
            </div>
            <div className="fixture-score">
              <span>{t.reveal.yourTeam}</span>
              <strong className="num">
                {match.gf}–{match.ga}
              </strong>
              <span>{match.opponent}</span>
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
                    {rowIndex + 1}. {row.label} <b>{row.pts}</b>
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

function AnimatedRevealView({
  locale,
  result,
  draft,
  onDone,
}: {
  locale: Locale;
  result: NonNullable<ReturnType<typeof simulateCampaign>>;
  draft: Draft;
  onDone: () => void;
}) {
  const t = messages[locale];
  const controls = revealControlLabels[locale];
  const [visibleCount, setVisibleCount] = useState(0);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [readyForNext, setReadyForNext] = useState(true);
  const [mode, setMode] = useState<RevealMode>(() =>
    typeof window !== "undefined" && localStorage.getItem("s70-reveal") === "auto" ? "auto" : "manual",
  );
  const [speed, setSpeed] = useState<RevealSpeed>(() => {
    if (typeof window === "undefined") return "normal";
    const savedSpeed = localStorage.getItem("7a0-speed");
    return savedSpeed && revealSpeedKeys.includes(savedSpeed as RevealSpeed) ? (savedSpeed as RevealSpeed) : "normal";
  });
  const [reducedMotion, setReducedMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true,
  );
  const fixtureListRef = useRef<HTMLDivElement>(null);
  const visible = result.campaign.slice(0, visibleCount);
  const allMatchesVisible = visibleCount >= result.campaign.length;
  const campaignComplete = allMatchesVisible && readyForNext;
  const msPerMin = revealSpeeds[speed];

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
    localStorage.setItem("s70-reveal", next);
  }

  function setRevealSpeed(next: RevealSpeed) {
    setSpeed(next);
    localStorage.setItem("7a0-speed", next);
  }

  const showNextButton = readyForNext && (mode === "manual" || campaignComplete);

  return (
    <main className="reveal-wrap tx-paper">
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
      <div className="fixture-list" ref={fixtureListRef}>
        {visible.map((match, index) => (
          <AnimatedFixture
            active={index === activeIndex}
            instant={reducedMotion || index !== activeIndex}
            index={index}
            key={`${match.phase}-${index}`}
            locale={locale}
            match={match}
            msPerMin={msPerMin}
          />
        ))}
      </div>
      {campaignComplete && <RevealSummary locale={locale} result={result} />}
      {showNextButton && (
        <button className="btn btn-primary reveal-next" onClick={campaignComplete ? onDone : revealNext} type="button">
          {campaignComplete ? t.reveal.card : visibleCount === 0 ? t.reveal.first : t.reveal.next}
        </button>
      )}
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
  const goalsAgainstLabel = locale === "pt" ? "sofridos" : locale === "es" ? "recibidos" : "against";
  return (
    <section className="campaign-summary">
      <span className="num summary-record">{result.record}</span>
      <strong className="num summary-score">
        {result.wins}-{result.losses}
      </strong>
      <hr />
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
    </section>
  );
}

function AnimatedFixture({
  active,
  instant,
  index,
  locale,
  match,
  msPerMin,
}: {
  active: boolean;
  instant: boolean;
  index: number;
  locale: Locale;
  match: CampaignMatch;
  msPerMin: number;
}) {
  const t = messages[locale];
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
  const scoreText = pending ? "\u00b7 \u00b7 \u00b7" : `${liveGf}-${liveGa}`;
  const goalSummary = summarizeGoals(visibleGoals, "me");
  const concededSummary = summarizeGoals(visibleGoals, "them");
  const code = opponentCode(match.opponent);

  return (
    <article className={`fixture-card sticker reveal-fixture ${match.advanced ? "is-win" : "is-loss"} ${active ? "is-current" : ""}`}>
      <div className="fixture-score reveal-score">
        <span className="fx-phase">{match.phase}</span>
        <span className="fx-opp">
          <span className="fx-vs">vs</span>
          <span className="fx-flag" aria-hidden="true">
            {nationFlag(code)}
          </span>
          <strong>{match.opponent}</strong>
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
      </div>
      {!pending && (
        <div className={`reveal-body ${instant ? "is-instant" : ""}`}>
          {(goalSummary || concededSummary) && (
            <p className="goal-flow">
              {goalSummary && (
                <span className="me">
                  <b>GOLS</b> {goalSummary}
                </span>
              )}
              {concededSummary && (
                <span className="them">
                  <b>SOFREU</b> {concededSummary}
                </span>
              )}
            </p>
          )}
          {showFinal && match.penalties && (
            <div className={`fixture-pen ${penaltyComplete ? "is-complete" : "is-live"}`}>
              <span className="eyebrow">{t.reveal.penalties}</span>
              <span className="num">{livePenaltyScore}</span>
              {!penaltyComplete && nextPenaltyKick && (
                <span className="penalty-live">
                  {penaltyLiveLabels[locale]} {"\u00b7"} {nextPenaltyKick.side === "me" ? t.reveal.yourTeam : match.opponent}
                </span>
              )}
              <div className="penalty-flow">
                {visibleMeKicks.map(({ kick, index }) => (
                  <span className={kick ? "made" : "missed"} key={`me-${index}`}>
                    {kick ? "\u25cf" : "\u00d7"}
                  </span>
                ))}
                <em>vs</em>
                {visibleThemKicks.map(({ kick, index }) => (
                  <span className={kick ? "made" : "missed"} key={`them-${index}`}>
                    {kick ? "\u25cf" : "\u00d7"}
                  </span>
                ))}
              </div>
            </div>
          )}
          {showFinal && match.groupTable && (
            <div className="group-table">
              <span className="eyebrow">{t.reveal.group}</span>
              {match.groupTable.map((row, rowIndex) => (
                <span className={row.me ? "me" : ""} key={`${row.label}-${rowIndex}`} style={instant ? undefined : { animationDelay: `${rowIndex * 0.09}s` }}>
                  {rowIndex + 1}. {row.label} <b>{row.pts}</b>
                </span>
              ))}
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
  while (metas.length < 7) {
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
      />
    );
  }

  if (phase === "result" && result) {
    return <ResultCard locale={locale} result={result} draft={draft} onAgain={again} />;
  }

  return (
    <main>
      <header className="site-header draft-header">
        <div className="site-header-left">
          <Link href={localePath(locale, "/")} className="home-link" aria-label={t.play.back}>
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
              <Link className="profile-link profile-link--compact" href={localePath(locale, "/perfil")} aria-label={t.home.profile}>
                <svg className="profile-link-ic" viewBox="0 0 40 40" aria-hidden="true">
                  <rect x="7" y="9" width="26" height="22" rx="2" />
                  <circle cx="15" cy="18" r="3.2" />
                  <path d="M10.5 26.5c1.2-3 7.6-3 8.8 0" />
                  <line x1="24" y1="16" x2="29.5" y2="16" />
                  <line x1="24" y1="21" x2="29.5" y2="21" />
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
