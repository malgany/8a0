"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, Dispatch, PointerEvent as ReactPointerEvent, SetStateAction, WheelEvent as ReactWheelEvent } from "react";
import type { Draft, DraftOptions, Locale, PenaltyResult, Player, SquadFile } from "@/lib/types";
import {
  availablePositions,
  calculateStats,
  canFillAnySlot,
  createDraft,
  defaultOptions,
  describePair,
  fetchSquad,
  formations,
  modeConfig,
  randomSeed,
  rerollPair,
  rng,
  rollPair,
  squadIndex,
} from "@/lib/game";
import { localePath, messages, positionLabels, styleLabels } from "@/lib/i18n";
import { nationFlag, nationFlagImageUrl, nationName } from "@/lib/nations";
import { formatPlayerNumber, formatPlayerNumberWithHash } from "@/lib/player-number";
import { createOnlineCampaign, createOnlineCampaignMatch, type OnlineCampaignMatch, type OnlineTeamProfile } from "@/lib/online-game";
import { getSupabaseBrowserClient } from "@/lib/supabase-client";
import { SettingsToggle } from "./ChromeControls";
import { Logo } from "./Logo";
import { PitchMarkings } from "./PitchMarkings";

type OnlinePhase = "login" | "team" | "draft" | "campaign";
type DrawPair = { sel: string; copa: number };
type Tool = "pen" | "eraser" | "bucket";
type PaintMode = "pen" | "eraser";
type OnlineIdentity = { kind: "guest" | "google"; id: string; accessToken?: string };

const FLAG_SIZE = 18;
const TEAM_STORAGE_KEY = "8a0-online-team";
const GUEST_STORAGE_KEY = "8a0-online-guest-id";
const ONLINE_STARTING_POINTS = 830;
const ONLINE_OPTIONS: DraftOptions = { ...defaultOptions, mode: "classico" };

function sanitizeTeamName(value: string) {
  return value.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 20);
}

function emptyPixels() {
  return Array.from({ length: FLAG_SIZE * FLAG_SIZE }, () => null) as Array<string | null>;
}

function readStoredTeam(): OnlineTeamProfile {
  if (typeof window === "undefined") return { name: "", flagPixels: emptyPixels() };
  try {
    const parsed = JSON.parse(localStorage.getItem(TEAM_STORAGE_KEY) ?? "");
    const pixels = Array.isArray(parsed?.flagPixels) ? parsed.flagPixels.slice(0, FLAG_SIZE * FLAG_SIZE) : emptyPixels();
    return {
      name: sanitizeTeamName(String(parsed?.name ?? "")),
      flagPixels: [...pixels, ...emptyPixels()].slice(0, FLAG_SIZE * FLAG_SIZE),
    };
  } catch {
    return { name: "", flagPixels: emptyPixels() };
  }
}

function createLocalId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

function getGuestIdentity(): OnlineIdentity {
  const stored = localStorage.getItem(GUEST_STORAGE_KEY);
  const id = stored ?? createLocalId();
  if (!stored) localStorage.setItem(GUEST_STORAGE_KEY, id);
  return { kind: "guest", id };
}

function serializeDraft(draft: Draft) {
  return {
    seed: draft.seed,
    options: draft.options,
    xi: draft.filled
      .map((player, slot) => (player ? { sel: player.sel, copa: player.copa, playerId: player.playerId, force: player.force, slot } : null))
      .filter(Boolean),
  };
}

async function persistOnlineTeam(identity: OnlineIdentity | null, team: OnlineTeamProfile, draft?: Draft) {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (identity?.accessToken) headers.authorization = `Bearer ${identity.accessToken}`;
  await fetch("/api/online/team", {
    method: "POST",
    headers,
    body: JSON.stringify({
      guestId: identity?.kind === "guest" ? identity.id : undefined,
      team,
      draft: draft ? serializeDraft(draft) : undefined,
    }),
  }).catch(() => null);
}

function createSeededDraft(options: DraftOptions = ONLINE_OPTIONS, seed = randomSeed()) {
  return createDraft(seed, { ...options, mode: "classico" });
}

function comparePlayersByNumber(left: Player, right: Player) {
  const leftNumber = left.number ?? Number.POSITIVE_INFINITY;
  const rightNumber = right.number ?? Number.POSITIVE_INFINITY;
  return leftNumber - rightNumber || left.name.localeCompare(right.name);
}

function createDummyPlayer(seed: string, slotIndex: number, force: number, positions: Player["positions"]): Player {
  return {
    playerId: `online-dummy-${seed}-${slotIndex}`,
    name: `DUMMY ${slotIndex + 1}`,
    sel: "DUMMY",
    copa: 0,
    positions,
    number: null,
    force,
    legend: false,
  };
}

function fillDraftWithDummies(draft: Draft, points: number) {
  const emptySlots = draft.filled
    .map((player, index) => ({ player, index }))
    .filter((item): item is { player: null; index: number } => item.player === null);
  if (emptySlots.length === 0) return { draft, points };

  const filled = [...draft.filled];
  const usedPlayerIds = [...draft.usedPlayerIds];
  const safePoints = Math.max(0, points);
  const baseForce = Math.floor(safePoints / emptySlots.length);
  let extraForce = safePoints % emptySlots.length;

  emptySlots.forEach(({ index }) => {
    const slot = draft.slots[index]!;
    const force = baseForce + (extraForce > 0 ? 1 : 0);
    extraForce = Math.max(0, extraForce - 1);
    const dummy = createDummyPlayer(draft.seed, index, force, [slot.pos]);
    filled[index] = dummy;
    usedPlayerIds.push(dummy.playerId);
  });

  return { draft: { ...draft, filled, current: null, usedPlayerIds }, points: 0 };
}

function hasAffordablePlayer(draft: Draft, squad: SquadFile | null, points: number) {
  if (!squad) return false;
  const used = new Set(draft.usedPlayerIds);
  return squad.squad.some((player) => !used.has(player.playerId) && player.force <= points && canFillAnySlot(draft, player));
}

function FlagImage({ code, label }: { code: string; label: string }) {
  const url = nationFlagImageUrl(code);
  if (!url) return <span aria-label={label}>{nationFlag(code) || code}</span>;
  return <span className="flag-img" aria-hidden="true" style={{ backgroundImage: `url(${url})` }} />;
}

function OnlineHeader({ locale, title }: { locale: Locale; title: string }) {
  const t = messages[locale];
  return (
    <header className="online-header">
      <Link href={localePath(locale, "/")} className="online-home-link" aria-label={t.play.back} prefetch={false}>
        <Logo subtitle={t.logoSub} />
      </Link>
      <div className="online-header-right">
        <span className="online-screen-label">{title}</span>
        <span className="online-header-rule" aria-hidden="true" />
        <SettingsToggle locale={locale} label={t.home.settings} />
      </div>
    </header>
  );
}

function LoginScreen({ locale, onGoogle, onGuest }: { locale: Locale; onGoogle: () => void; onGuest: () => void }) {
  const t = messages[locale].online;
  return (
    <main className="online-dream online-auth tx-paper">
      <OnlineHeader locale={locale} title={t.loginTitle} />
      <section className="online-login-actions" aria-label={t.loginTitle}>
        <button className="online-choice-btn" type="button" onClick={onGoogle}>
          <svg viewBox="0 0 36 36" aria-hidden="true">
            <circle cx="18" cy="13" r="6" />
            <path d="M7 31c1.7-7 6.1-10.6 11-10.6S27.3 24 29 31" />
          </svg>
          <span>{t.googleLogin}</span>
        </button>
        <span className="online-choice-divider" aria-hidden="true" />
        <button className="online-choice-btn" type="button" onClick={onGuest}>
          <svg viewBox="0 0 40 36" aria-hidden="true">
            <circle cx="20" cy="10" r="5" />
            <path d="M12 29c1.1-6 4.4-9 8-9s6.9 3 8 9" />
            <circle cx="8" cy="15" r="4" />
            <path d="M2 30c.8-5 3.6-7.2 7-7.2" />
            <circle cx="32" cy="15" r="4" />
            <path d="M38 30c-.8-5-3.6-7.2-7-7.2" />
          </svg>
          <span>{t.guestLogin}</span>
        </button>
      </section>
    </main>
  );
}

function FlagEditor({
  locale,
  pixels,
  color,
  tool,
  onColor,
  onPixels,
  onTool,
}: {
  locale: Locale;
  pixels: Array<string | null>;
  color: string;
  tool: Tool;
  onColor: (color: string) => void;
  onPixels: Dispatch<SetStateAction<Array<string | null>>>;
  onTool: (tool: Tool) => void;
}) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const drawingRef = useRef(false);
  const pointerIdRef = useRef<number | null>(null);
  const lastPixelRef = useRef<number | null>(null);
  const paintModeRef = useRef<PaintMode>("pen");
  const label = messages[locale].online;

  function floodFill(index: number, fillColor: string | null) {
    onPixels((current) => {
      const target = current[index] ?? null;
      if (target === fillColor) return current;

      const next = [...current];
      const queue = [index];
      const visited = new Set<number>();

      while (queue.length > 0) {
        const currentIndex = queue.pop();
        if (currentIndex === undefined || visited.has(currentIndex)) continue;
        visited.add(currentIndex);
        if ((next[currentIndex] ?? null) !== target) continue;

        next[currentIndex] = fillColor;
        const x = currentIndex % FLAG_SIZE;
        const y = Math.floor(currentIndex / FLAG_SIZE);
        if (x > 0) queue.push(currentIndex - 1);
        if (x < FLAG_SIZE - 1) queue.push(currentIndex + 1);
        if (y > 0) queue.push(currentIndex - FLAG_SIZE);
        if (y < FLAG_SIZE - 1) queue.push(currentIndex + FLAG_SIZE);
      }

      return next;
    });
  }

  function paint(index: number) {
    if (index === lastPixelRef.current) return;
    lastPixelRef.current = index;
    const fillColor = paintModeRef.current === "pen" ? color : null;
    onPixels((current) => current.map((pixel, pixelIndex) => (pixelIndex === index ? fillColor : pixel)));
  }

  function pixelFromPointer(event: ReactPointerEvent<HTMLDivElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(FLAG_SIZE - 1, Math.floor(((event.clientX - rect.left) / rect.width) * FLAG_SIZE)));
    const y = Math.max(0, Math.min(FLAG_SIZE - 1, Math.floor(((event.clientY - rect.top) / rect.height) * FLAG_SIZE)));
    return y * FLAG_SIZE + x;
  }

  function paintFromPointer(event: ReactPointerEvent<HTMLDivElement>) {
    const index = pixelFromPointer(event);
    if (index !== null) paint(index);
  }

  function stopDrawing(event: ReactPointerEvent<HTMLDivElement>) {
    if (pointerIdRef.current !== null && event.currentTarget.hasPointerCapture(pointerIdRef.current)) {
      event.currentTarget.releasePointerCapture(pointerIdRef.current);
    }
    pointerIdRef.current = null;
    drawingRef.current = false;
    lastPixelRef.current = null;
  }

  return (
    <div className="flag-editor">
      <div className="flag-tools" role="group" aria-label={label.newTeamTitle}>
        <button className={`flag-tool ${tool === "pen" ? "is-active" : ""}`} type="button" onClick={() => onTool("pen")} aria-label={label.pen}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m4 16 10.8-10.8 4 4L8 20H4v-4Z" />
            <path d="m13.2 6.8 4 4" />
          </svg>
        </button>
        <button className={`flag-tool ${tool === "eraser" ? "is-active" : ""}`} type="button" onClick={() => onTool("eraser")} aria-label={label.eraser}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m4 15 8-8 7 7-5 5H8l-4-4Z" />
            <path d="M13 19h7" />
          </svg>
        </button>
        <button className={`flag-tool ${tool === "bucket" ? "is-active" : ""}`} type="button" onClick={() => onTool("bucket")} aria-label={label.bucket}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m4 13 8-8 7 7-8 8-7-7Z" />
            <path d="m6.5 10.5 7 7" />
            <path d="M19 14c1.2 1.4 2 2.7 2 4a2 2 0 0 1-4 0c0-1.3.8-2.6 2-4Z" />
          </svg>
        </button>
      </div>
      <div
        ref={canvasRef}
        className={`flag-canvas flag-canvas-${tool}`}
        style={{ "--flag-size": FLAG_SIZE } as CSSProperties}
        onContextMenu={(event) => event.preventDefault()}
        onPointerDown={(event) => {
          event.preventDefault();
          lastPixelRef.current = null;
          const isRightButton = event.button === 2;
          paintModeRef.current = isRightButton || tool === "eraser" ? "eraser" : "pen";
          const index = pixelFromPointer(event);
          if (index === null) return;

          if (tool === "bucket" && !isRightButton) {
            floodFill(index, color);
            return;
          }

          event.currentTarget.setPointerCapture(event.pointerId);
          pointerIdRef.current = event.pointerId;
          drawingRef.current = true;
          paint(index);
        }}
        onPointerMove={(event) => {
          if (!drawingRef.current || pointerIdRef.current !== event.pointerId) return;
          event.preventDefault();
          paintFromPointer(event);
        }}
        onPointerUp={stopDrawing}
        onPointerCancel={stopDrawing}
        onLostPointerCapture={stopDrawing}
      >
        {pixels.map((pixel, index) => (
          <button
            aria-label={`pixel ${index + 1}`}
            className="flag-pixel"
            key={index}
            type="button"
            style={{ backgroundColor: pixel ?? "transparent" }}
          />
        ))}
      </div>
      <label className="flag-color">
        <span>{label.color}</span>
        <input type="color" value={color} onChange={(event) => onColor(event.target.value)} />
      </label>
    </div>
  );
}

function TeamScreen({ locale, initialTeam, onSave }: { locale: Locale; initialTeam: OnlineTeamProfile; onSave: (team: OnlineTeamProfile) => void }) {
  const t = messages[locale].online;
  const inputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(initialTeam.name);
  const [pixels, setPixels] = useState(initialTeam.flagPixels);
  const [color, setColor] = useState("#111111");
  const [tool, setTool] = useState<Tool>("pen");
  const canSave = name.length >= 2;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function save() {
    if (!canSave) return;
    const team = { name, flagPixels: pixels };
    localStorage.setItem(TEAM_STORAGE_KEY, JSON.stringify(team));
    onSave(team);
  }

  return (
    <main className="online-dream online-team tx-paper">
      <OnlineHeader locale={locale} title={t.newTeamTitle} />
      <section className="online-team-panel">
        <input
          ref={inputRef}
          className="online-team-name"
          maxLength={20}
          placeholder={t.teamNamePlaceholder}
          value={name}
          onChange={(event) => setName(sanitizeTeamName(event.target.value))}
        />
        <FlagEditor locale={locale} pixels={pixels} color={color} tool={tool} onColor={setColor} onPixels={setPixels} onTool={setTool} />
        <button className="online-save-btn" type="button" disabled={!canSave} onClick={save}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 4h12l2 2v14H5V4Z" />
            <path d="M8 4v6h8V4M8 20v-7h8v7" />
          </svg>
          <span>{t.save}</span>
        </button>
      </section>
    </main>
  );
}

function OnlineSetupControls({ locale, draft, points, onOptions }: { locale: Locale; draft: Draft; points: number; onOptions: (options: DraftOptions) => void }) {
  const t = messages[locale];
  return (
    <div className="play-setup sticker online-setup">
      <div className="setup-group">
        <span className="modes-label eyebrow">{t.play.formation}</span>
        <div className="modes-group">
          {(Object.keys(formations) as Array<keyof typeof formations>).map((formation) => (
            <button className={`chip ${draft.options.formation === formation ? "is-active" : ""}`} key={formation} onClick={() => onOptions({ ...draft.options, formation, mode: "classico" })}>
              {formation}
            </button>
          ))}
        </div>
      </div>
      <div className="setup-group">
        <span className="modes-label eyebrow">{t.play.style}</span>
        <div className="modes-group">
          {(["defensivo", "equilibrado", "ofensivo"] as const).map((style) => (
            <button className={`chip ${draft.options.style === style ? "is-active" : ""}`} key={style} onClick={() => onOptions({ ...draft.options, style, mode: "classico" })}>
              {styleLabels[locale][style]}
            </button>
          ))}
        </div>
      </div>
      <div className="setup-group online-points-group">
        <span className="modes-label eyebrow">{messages[locale].online.points}</span>
        <strong className="online-points num">{points}</strong>
      </div>
    </div>
  );
}

function Pitch({
  locale,
  draft,
  selected,
  movingFromSlot,
  onSlot,
}: {
  locale: Locale;
  draft: Draft;
  selected: Player | null;
  movingFromSlot: number | null;
  onSlot: (slot: number) => void;
}) {
  const movingPlayer = movingFromSlot === null ? null : draft.filled[movingFromSlot];
  return (
    <div className="pitch-outer">
      <div className="pitch-wrap">
        <div className="pitch">
          <PitchMarkings />
          {draft.slots.map((slot, index) => {
            const player = draft.filled[index];
            const active = selected ? selected.positions.includes(slot.pos) && !player : false;
            const moveFrom = movingFromSlot === index && Boolean(player);
            const moveTarget = movingPlayer ? !player && movingPlayer.positions.includes(slot.pos) : false;
            return (
              <button
                key={`${slot.pos}-${index}`}
                className={`disc ${player ? "slot-filled" : "empty slot-empty"} ${active ? "slot-active slot-pickable" : ""} ${moveFrom ? "move-from is-moving" : ""} ${moveTarget ? "move-target" : ""}`}
                style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
                onClick={() => onSlot(index)}
                type="button"
              >
                <span className="disc-circle num">{player ? formatPlayerNumber(player.number, locale) : positionLabels[locale][slot.pos]}</span>
                {player ? <span className="disc-name">{player.name}</span> : null}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function BoxScore({ locale, draft }: { locale: Locale; draft: Draft }) {
  const t = messages[locale];
  const stats = calculateStats(draft);
  const filledCount = draft.filled.filter(Boolean).length;
  return (
    <aside className="box">
      <div className="box-head">
        <span className="eyebrow">
          {t.play.box} · {filledCount}/11
        </span>
        <span className="num">{filledCount ? stats.overall : "—"}</span>
      </div>
      <div className="box-ratings">
        <span className="box-rating box-rating-atk">
          <b className="num">{filledCount ? stats.attack : "—"}</b> {t.play.attack}
        </span>
        <span className="box-rating box-rating-def">
          <b className="num">{filledCount ? stats.defense : "—"}</b> {t.play.defense}
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
  points,
  displayPoints,
  isRolling,
  isBudgetSettling,
  onRoll,
  onReroll,
  onSelect,
}: {
  locale: Locale;
  draft: Draft;
  squad: SquadFile | null;
  rollingPair: DrawPair | null;
  selected: Player | null;
  points: number;
  displayPoints: number;
  isRolling: boolean;
  isBudgetSettling: boolean;
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
      .map((player) => {
        const overBudget = player.force > points;
        return { player, overBudget, selectable: !overBudget && canFillAnySlot(draft, player) };
      });
  }, [draft, points, squad]);
  const hasSelectablePlayer = playerPool.some((item) => item.selectable);
  const displayPair = rollingPair ?? squad;

  if (!displayPair) {
    return (
      <section className="roll-panel">
        {isBudgetSettling ? (
          <div className="online-budget is-animating" aria-live="polite">
            <span className="eyebrow">{messages[locale].online.points}</span>
            <strong className="online-budget-value num">{displayPoints}</strong>
          </div>
        ) : (
          <>
            <div className="roll-idle">
              <p>{t.play.rollIdle}</p>
            </div>
            <button className="btn btn-primary roll-btn" onClick={onRoll} disabled={isRolling}>
          {t.play.roll} <span aria-hidden="true">🎲</span>
            </button>
          </>
        )}
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
      {isRolling ? (
        <div className="rolling-strip" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      ) : null}
      {!isRolling && draft.rerollsLeft > 0 ? (
        <div className="reroll-box">
          <span className="eyebrow reroll-label">{t.play.reroll} · {draft.rerollsLeft}</span>
          <div className="reroll-btns">
            <button className="btn btn-secondary reroll-btn" onClick={() => onReroll("sel")}>
              {t.play.anotherTeam}
            </button>
            <button className="btn btn-secondary reroll-btn" onClick={() => onReroll("copa")}>
              {t.play.anotherCup}
            </button>
          </div>
        </div>
      ) : null}
      {!isRolling ? (
        <div className={`online-budget ${isBudgetSettling ? "is-animating" : ""}`} aria-live={isBudgetSettling ? "polite" : undefined}>
          <span className="eyebrow">{messages[locale].online.points}</span>
          <strong className="online-budget-value num">{displayPoints}</strong>
        </div>
      ) : null}
      {!isRolling ? (
        <div className="player-pool">
          <span className="eyebrow">{hasSelectablePlayer ? t.play.choosePlayer : t.play.noPlayer}</span>
          <div className="player-list">
            {playerPool.map(({ player, overBudget, selectable }) => (
              <button
                type="button"
                key={`${player.sel}-${player.copa}-${player.playerId}`}
                className={`player-card ${selected?.playerId === player.playerId ? "is-active" : ""} ${player.legend ? "is-legend" : ""} ${selectable ? "" : "is-disabled"} ${overBudget ? "is-over-budget" : ""}`}
                disabled={!selectable}
                onClick={() => selectable && onSelect(player)}
              >
                <span className="pc-num num">{formatPlayerNumberWithHash(player.number, locale)}</span>
                <span className="pc-name">{player.name}</span>
                <span className="pc-pos">
                  {player.positions.slice(0, 2).map((position) => positionLabels[locale][position]).join("/")}
                  {player.positions.length > 2 ? <span className="pc-pos-more">+{player.positions.length - 2}</span> : null}
                </span>
                <span className="pc-force num">{player.force}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function DraftScreen({ locale, onCampaign }: { locale: Locale; onCampaign: (draft: Draft, campaign: OnlineCampaignMatch[]) => void }) {
  const t = messages[locale];
  const [draft, setDraft] = useState(() => createSeededDraft());
  const [points, setPoints] = useState(ONLINE_STARTING_POINTS);
  const [squad, setSquad] = useState<SquadFile | null>(null);
  const [selected, setSelected] = useState<Player | null>(null);
  const [movingFromSlot, setMovingFromSlot] = useState<number | null>(null);
  const [rollingPair, setRollingPair] = useState<DrawPair | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [displayPoints, setDisplayPoints] = useState(ONLINE_STARTING_POINTS);
  const [isBudgetSettling, setIsBudgetSettling] = useState(false);
  const displayPointsRef = useRef(ONLINE_STARTING_POINTS);
  const budgetFrameRef = useRef<number | null>(null);
  const budgetSettleTimerRef = useRef<number | null>(null);
  const complete = draft.filled.every(Boolean);

  function clearBudgetAnimation() {
    if (budgetFrameRef.current !== null) {
      window.cancelAnimationFrame(budgetFrameRef.current);
      budgetFrameRef.current = null;
    }
    if (budgetSettleTimerRef.current !== null) {
      window.clearTimeout(budgetSettleTimerRef.current);
      budgetSettleTimerRef.current = null;
    }
  }

  function setShownPoints(value: number) {
    const nextValue = Math.max(0, Math.round(value));
    displayPointsRef.current = nextValue;
    setDisplayPoints(nextValue);
  }

  function settleBudgetDisplay() {
    budgetSettleTimerRef.current = window.setTimeout(() => {
      budgetSettleTimerRef.current = null;
      setIsBudgetSettling(false);
    }, 1000);
  }

  function animateBudgetTo(nextPoints: number) {
    clearBudgetAnimation();
    const from = displayPointsRef.current;
    const to = Math.max(0, Math.round(nextPoints));
    setIsBudgetSettling(true);
    if (from === to) {
      setShownPoints(to);
      settleBudgetDisplay();
      return;
    }
    const distance = Math.abs(to - from);
    const duration = Math.min(1200, Math.max(520, distance * 8));
    const startedAt = window.performance.now();

    const tick = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const easedProgress = progress * progress;
      setShownPoints(from + (to - from) * easedProgress);
      if (progress < 1) {
        budgetFrameRef.current = window.requestAnimationFrame(tick);
        return;
      }
      budgetFrameRef.current = null;
      setShownPoints(to);
      settleBudgetDisplay();
    };

    budgetFrameRef.current = window.requestAnimationFrame(tick);
  }

  function snapBudgetTo(nextPoints: number) {
    clearBudgetAnimation();
    setIsBudgetSettling(false);
    setShownPoints(nextPoints);
  }

  useEffect(() => {
    return () => {
      if (budgetFrameRef.current !== null) window.cancelAnimationFrame(budgetFrameRef.current);
      if (budgetSettleTimerRef.current !== null) window.clearTimeout(budgetSettleTimerRef.current);
    };
  }, []);

  async function playRollAnimation(finalPair: DrawPair) {
    setIsRolling(true);
    const random = rng(`${draft.seed}:online-roll-preview:${draft.rollIndex}:${finalPair.sel}:${finalPair.copa}`);
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
    if (isRolling || isBudgetSettling) return;
    const recent = draft.current ? [draft.current] : [];
    const meta = rollPair(draft.seed, draft.rollIndex, recent);
    setSquad(null);
    setSelected(null);
    setMovingFromSlot(null);
    const [loaded] = await Promise.all([fetchSquad(meta.sel, meta.copa), playRollAnimation(meta)]);
    let nextPoints = points;
    let nextDraft: Draft = { ...draft, current: { sel: meta.sel, copa: meta.copa }, rollIndex: draft.rollIndex + 1 };
    let nextSquad: SquadFile | null = loaded;
    if (nextDraft.rerollsLeft <= 0 && !hasAffordablePlayer(nextDraft, loaded, nextPoints)) {
      const completed = fillDraftWithDummies(nextDraft, nextPoints);
      nextDraft = completed.draft;
      nextPoints = completed.points;
      nextSquad = null;
    }
    setSquad(nextSquad);
    setDraft(nextDraft);
    setPoints(nextPoints);
    if (nextPoints !== points) {
      animateBudgetTo(nextPoints);
    } else {
      snapBudgetTo(nextPoints);
    }
    setRollingPair(null);
    setIsRolling(false);
  }

  async function reroll(axis: "sel" | "copa") {
    if (!draft.current || draft.rerollsLeft <= 0 || isRolling || isBudgetSettling) return;
    const meta = rerollPair(draft.seed, draft.current, axis, modeConfig.classico.rerolls - draft.rerollsLeft + 1);
    setSquad(null);
    setSelected(null);
    setMovingFromSlot(null);
    const [loaded] = await Promise.all([fetchSquad(meta.sel, meta.copa), playRollAnimation(meta)]);
    let nextPoints = points;
    let nextDraft: Draft = { ...draft, current: { sel: meta.sel, copa: meta.copa }, rerollsLeft: draft.rerollsLeft - 1 };
    let nextSquad: SquadFile | null = loaded;
    if (nextDraft.rerollsLeft <= 0 && !hasAffordablePlayer(nextDraft, loaded, nextPoints)) {
      const completed = fillDraftWithDummies(nextDraft, nextPoints);
      nextDraft = completed.draft;
      nextPoints = completed.points;
      nextSquad = null;
    }
    setSquad(nextSquad);
    setDraft(nextDraft);
    setPoints(nextPoints);
    if (nextPoints !== points) {
      animateBudgetTo(nextPoints);
    } else {
      snapBudgetTo(nextPoints);
    }
    setRollingPair(null);
    setIsRolling(false);
  }

  function setOptions(options: DraftOptions) {
    setDraft((current) => createDraft(current.seed, { ...options, mode: "classico" }));
    setPoints(ONLINE_STARTING_POINTS);
    snapBudgetTo(ONLINE_STARTING_POINTS);
    setSquad(null);
    setSelected(null);
    setMovingFromSlot(null);
    setRollingPair(null);
    setIsRolling(false);
  }

  function movableTargetSlots(current: Draft, fromSlot: number) {
    const player = current.filled[fromSlot];
    if (!player) return [];
    return current.slots
      .map((slot, index) => ({ slot, index }))
      .filter(({ slot, index }) => index !== fromSlot && current.filled[index] === null && player.positions.includes(slot.pos));
  }

  function chooseSlot(index: number) {
    if (isBudgetSettling) return;
    if (movingFromSlot !== null) {
      if (index === movingFromSlot) {
        setMovingFromSlot(null);
        return;
      }
      setDraft((current) => {
        const player = current.filled[movingFromSlot];
        const target = current.slots[index];
        if (!player || !target || current.filled[index] || !player.positions.includes(target.pos)) return current;
        const filled = [...current.filled];
        filled[movingFromSlot] = null;
        filled[index] = player;
        return { ...current, filled };
      });
      setMovingFromSlot(null);
      return;
    }

    const clickedPlayer = draft.filled[index];
    if (!selected && clickedPlayer) {
      setMovingFromSlot((current) => (current === index || movableTargetSlots(draft, index).length === 0 ? null : index));
      return;
    }
    const target = draft.slots[index];
    if (!selected || !target || draft.filled[index] || !selected.positions.includes(target.pos) || selected.force > points) return;
    const filled = [...draft.filled];
    filled[index] = selected;
    let nextPoints = Math.max(0, points - selected.force);
    let nextDraft: Draft = { ...draft, filled, current: null, usedPlayerIds: [...draft.usedPlayerIds, selected.playerId] };
    if (nextPoints <= 0 && nextDraft.filled.some((player) => player === null)) {
      const completed = fillDraftWithDummies(nextDraft, nextPoints);
      nextDraft = completed.draft;
      nextPoints = completed.points;
    }
    setDraft(nextDraft);
    setPoints(nextPoints);
    animateBudgetTo(nextPoints);
    setSelected(null);
    setMovingFromSlot(null);
    setSquad(null);
  }

  function selectPlayer(player: Player) {
    if (isBudgetSettling) return;
    setMovingFromSlot(null);
    if (selected?.playerId === player.playerId) {
      setSelected(null);
      return;
    }
    setSelected(player.force <= points && availablePositions(draft, player).length ? player : null);
  }

  function startCampaign() {
    onCampaign(draft, createOnlineCampaign(draft.seed, draft));
  }

  return (
    <main className="play-dream online-draft tx-paper">
      <OnlineHeader locale={locale} title={messages[locale].online.playOnline} />
      <div className="draft-layout">
        <div className="col-roll">
          {draft.rollIndex === 0 ? <OnlineSetupControls locale={locale} draft={draft} points={points} onOptions={setOptions} /> : null}
          {complete ? (
            <div className="roll-panel">
              <div className="roll-result sticker">
                <span className="eyebrow">{t.play.lineupComplete}</span>
                <div className="rr-sel num">11/11</div>
              </div>
              <div className={`online-budget ${isBudgetSettling ? "is-animating" : ""}`} aria-live={isBudgetSettling ? "polite" : undefined}>
                <span className="eyebrow">{messages[locale].online.points}</span>
                <strong className="online-budget-value num">{displayPoints}</strong>
              </div>
              {!isBudgetSettling ? (
                <button className="btn btn-primary roll-btn" onClick={startCampaign}>
                  {messages[locale].online.playOnline}
                </button>
              ) : null}
            </div>
          ) : (
            <RollPanel
              locale={locale}
              draft={draft}
              squad={squad}
              rollingPair={rollingPair}
              selected={selected}
              points={points}
              displayPoints={displayPoints}
              isRolling={isRolling}
              isBudgetSettling={isBudgetSettling}
              onRoll={rollNext}
              onReroll={reroll}
              onSelect={selectPlayer}
            />
          )}
        </div>
        <div className="col-pitch">
          <Pitch locale={locale} draft={draft} selected={selected} movingFromSlot={movingFromSlot} onSlot={chooseSlot} />
          {!selected && draft.filled.some(Boolean) ? <p className="pitch-hint">{t.play.hintMove}</p> : null}
          {selected ? <p className="pitch-hint">{selected.name} · {describePair(selected.sel, selected.copa, locale)}</p> : null}
        </div>
        <div className="col-box">
          <BoxScore locale={locale} draft={draft} />
        </div>
      </div>
    </main>
  );
}

type OnlinePenaltyKick = { side: "me" | "them"; kick: number; index: number; stage: "base" | "sd"; name?: string };
type CampaignRevealState = {
  index: number;
  matchKey: string;
  visibleGoals: number;
  visiblePenaltyKicks: number;
  done: boolean;
};

const onlineGoalRevealMs = 1000;
const onlinePenaltyRevealMs = 680;
const onlineFinalRevealMs = 760;

function campaignMatchKey(match: OnlineCampaignMatch) {
  return `${match.index}:${match.attempt}`;
}

function onlinePenaltyTimeline(penalties?: PenaltyResult) {
  const kicks: OnlinePenaltyKick[] = [];
  if (!penalties) return kicks;
  const baseRounds = Math.max(penalties.me.length, penalties.them.length);
  for (let index = 0; index < baseRounds; index += 1) {
    const meKick = penalties.me[index];
    const themKick = penalties.them[index];
    if (meKick !== undefined) kicks.push({ side: "me", kick: meKick, index, stage: "base", name: penalties.meNames?.[index] });
    if (themKick !== undefined) kicks.push({ side: "them", kick: themKick, index, stage: "base", name: penalties.themNames?.[index] });
  }
  if (penalties.sd) {
    const suddenDeathRounds = Math.max(penalties.sd.me.length, penalties.sd.them.length);
    for (let index = 0; index < suddenDeathRounds; index += 1) {
      const meKick = penalties.sd.me[index];
      const themKick = penalties.sd.them[index];
      if (meKick !== undefined) kicks.push({ side: "me", kick: meKick, index, stage: "sd", name: penalties.sd.meNames?.[index] });
      if (themKick !== undefined) kicks.push({ side: "them", kick: themKick, index, stage: "sd", name: penalties.sd.themNames?.[index] });
    }
  }
  return kicks;
}

function onlinePenaltyKickKey(kick: Pick<OnlinePenaltyKick, "side" | "index" | "stage">) {
  return `${kick.stage}:${kick.side}:${kick.index}`;
}

function onlinePenaltyRows(penalties: PenaltyResult, stage: "base" | "sd", visibleKickKeys: Set<string>) {
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

function OnlinePenaltyKickMark({ kick }: { kick: number }) {
  return (
    <span className={`online-pen-kick ${kick ? "is-goal" : "is-miss"}`} aria-hidden="true">
      {kick ? "\u2713" : "\u00d7"}
    </span>
  );
}

function OnlinePenaltyRound({
  meLabel,
  me,
  opponent,
  opponentName,
  round,
}: {
  meLabel: string;
  me: { kick: number; name?: string } | null;
  opponent: { kick: number; name?: string } | null;
  opponentName: string;
  round: number;
}) {
  return (
    <div className="online-pen-round">
      <span className="online-pen-index num">{round}</span>
      <span className="online-pen-name online-pen-name-me">{me?.name ?? meLabel}</span>
      <span className="online-pen-slot">{me ? <OnlinePenaltyKickMark kick={me.kick} /> : <span className="online-pen-placeholder" aria-hidden="true" />}</span>
      <span className="online-pen-vs">{me && opponent ? "vs" : ""}</span>
      <span className="online-pen-slot">{opponent ? <OnlinePenaltyKickMark kick={opponent.kick} /> : <span className="online-pen-placeholder" aria-hidden="true" />}</span>
      <span className="online-pen-name online-pen-name-them">{opponent?.name ?? opponentName}</span>
    </div>
  );
}

function CampaignScreen({ locale, campaign, draft }: { locale: Locale; campaign: OnlineCampaignMatch[]; draft: Draft }) {
  const t = messages[locale].online;
  const [matches, setMatches] = useState(campaign);
  const [completedCount, setCompletedCount] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [reveal, setReveal] = useState<CampaignRevealState | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const snapTimerRef = useRef<number | null>(null);
  const revealPanelRef = useRef<HTMLDivElement>(null);
  const ignoreClickRef = useRef(false);
  const dragStateRef = useRef({ active: false, startX: 0, startScrollLeft: 0, moved: false });
  const selected = matches[selectedIndex] ?? matches[0]!;
  const selectedKey = campaignMatchKey(selected);
  const activeReveal = reveal?.index === selectedIndex && reveal.matchKey === selectedKey ? reveal : null;
  const wonAndCompleted = selectedIndex < completedCount;
  const selectedDone = wonAndCompleted || Boolean(activeReveal?.done);
  const isRevealing = Boolean(activeReveal && !activeReveal.done);
  const canPlay = selectedIndex === completedCount && completedCount < matches.length && !isRevealing && !selectedDone;
  const visibleGoals = selectedDone ? selected.goals : selected.goals.slice(0, activeReveal?.visibleGoals ?? 0);
  const penaltyKicks = onlinePenaltyTimeline(selected.penalties);
  const visiblePenaltyCount = selectedDone ? penaltyKicks.length : activeReveal?.visiblePenaltyKicks ?? 0;
  const visiblePenaltyKicks = penaltyKicks.slice(0, visiblePenaltyCount);
  const visiblePenaltyKeys = new Set(visiblePenaltyKicks.map(onlinePenaltyKickKey));
  const liveGf = selectedDone ? selected.gf : visibleGoals.filter((goal) => goal.side === "me").length;
  const liveGa = selectedDone ? selected.ga : visibleGoals.filter((goal) => goal.side === "them").length;
  const revealVisible = wonAndCompleted || Boolean(activeReveal);
  const showPenalties = Boolean(selected.penalties && (selectedDone || visibleGoals.length >= selected.goals.length));
  const penaltyScore = selected.penalties
    ? selectedDone
      ? selected.penalties.score
      : `${visiblePenaltyKicks.filter((kick) => kick.side === "me").reduce((sum, kick) => sum + kick.kick, 0)}-${visiblePenaltyKicks.filter((kick) => kick.side === "them").reduce((sum, kick) => sum + kick.kick, 0)}`
    : "";
  const basePenaltyRows = selected.penalties ? onlinePenaltyRows(selected.penalties, "base", visiblePenaltyKeys) : [];
  const suddenDeathPenaltyRows = selected.penalties ? onlinePenaltyRows(selected.penalties, "sd", visiblePenaltyKeys) : [];
  const opponentName = `${nationName(selected.opponentSel, locale)} ${selected.opponentCopa}`;

  const centerStep = useCallback((index: number, behavior: ScrollBehavior = "smooth") => {
    const container = scrollerRef.current;
    const step = stepRefs.current[index];
    if (!container || !step) return;
    const left = step.offsetLeft + step.offsetWidth / 2 - container.clientWidth / 2;
    container.scrollTo({ left: Math.max(0, left), behavior });
  }, []);

  const nearestAvailableStep = useCallback(() => {
    const container = scrollerRef.current;
    if (!container) return selectedIndex;
    const containerRect = container.getBoundingClientRect();
    const center = containerRect.left + containerRect.width / 2;
    const maxIndex = Math.min(completedCount, matches.length - 1);
    let nearest = Math.min(selectedIndex, maxIndex);
    let distance = Number.POSITIVE_INFINITY;
    for (let index = 0; index <= maxIndex; index += 1) {
      const step = stepRefs.current[index];
      if (!step) continue;
      const rect = step.getBoundingClientRect();
      const nextDistance = Math.abs(rect.left + rect.width / 2 - center);
      if (nextDistance < distance) {
        distance = nextDistance;
        nearest = index;
      }
    }
    return nearest;
  }, [matches.length, completedCount, selectedIndex]);

  const snapToNearest = useCallback(() => {
    const nearest = nearestAvailableStep();
    setSelectedIndex(nearest);
    centerStep(nearest);
  }, [centerStep, nearestAvailableStep]);

  const scheduleSnap = useCallback(() => {
    if (dragStateRef.current.active) return;
    if (snapTimerRef.current !== null) window.clearTimeout(snapTimerRef.current);
    snapTimerRef.current = window.setTimeout(() => {
      snapTimerRef.current = null;
      snapToNearest();
    }, 140);
  }, [snapToNearest]);

  useEffect(() => {
    centerStep(selectedIndex);
  }, [centerStep, selectedIndex]);

  useEffect(() => {
    return () => {
      if (snapTimerRef.current !== null) window.clearTimeout(snapTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!reveal || reveal.done) return;
    const match = matches[reveal.index];
    if (!match || campaignMatchKey(match) !== reveal.matchKey) return;
    const kicks = onlinePenaltyTimeline(match.penalties);
    const delay = reveal.visibleGoals < match.goals.length ? onlineGoalRevealMs : reveal.visiblePenaltyKicks < kicks.length ? onlinePenaltyRevealMs : onlineFinalRevealMs;
    const finalizing = reveal.visibleGoals >= match.goals.length && reveal.visiblePenaltyKicks >= kicks.length;
    const timer = window.setTimeout(() => {
      setReveal((current) => {
        if (!current || current.index !== reveal.index || current.matchKey !== reveal.matchKey || current.done) return current;
        if (current.visibleGoals < match.goals.length) return { ...current, visibleGoals: current.visibleGoals + 1 };
        if (current.visiblePenaltyKicks < kicks.length) return { ...current, visiblePenaltyKicks: current.visiblePenaltyKicks + 1 };
        return { ...current, done: true };
      });
      if (finalizing && match.won) setCompletedCount((value) => Math.max(value, match.index + 1));
    }, delay);
    return () => window.clearTimeout(timer);
  }, [matches, reveal]);

  useEffect(() => {
    if (!revealVisible) return;
    revealPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [activeReveal?.visibleGoals, activeReveal?.visiblePenaltyKicks, activeReveal?.done, revealVisible, selectedIndex]);

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || isRevealing) return;
    const container = scrollerRef.current;
    if (!container) return;
    dragStateRef.current = { active: true, startX: event.clientX, startScrollLeft: container.scrollLeft, moved: false };
    container.setPointerCapture(event.pointerId);
    container.classList.add("is-dragging");
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const container = scrollerRef.current;
    const state = dragStateRef.current;
    if (!container || !state.active) return;
    const delta = event.clientX - state.startX;
    if (Math.abs(delta) > 4) state.moved = true;
    container.scrollLeft = state.startScrollLeft - delta;
    if (state.moved) event.preventDefault();
  }

  function endDrag(event: ReactPointerEvent<HTMLDivElement>) {
    const container = scrollerRef.current;
    const state = dragStateRef.current;
    if (!container || !state.active) return;
    state.active = false;
    container.classList.remove("is-dragging");
    if (container.hasPointerCapture(event.pointerId)) container.releasePointerCapture(event.pointerId);
    if (state.moved) {
      ignoreClickRef.current = true;
      window.setTimeout(() => {
        ignoreClickRef.current = false;
      }, 0);
    }
    snapToNearest();
  }

  function onWheel(event: ReactWheelEvent<HTMLDivElement>) {
    if (!event.shiftKey || !scrollerRef.current || isRevealing) return;
    event.preventDefault();
    scrollerRef.current.scrollLeft += event.deltaY || event.deltaX;
    scheduleSnap();
  }

  function beginReveal(match: OnlineCampaignMatch) {
    setReveal({ index: match.index, matchKey: campaignMatchKey(match), visibleGoals: 0, visiblePenaltyKicks: 0, done: false });
  }

  function play() {
    if (!canPlay) return;
    beginReveal(selected);
  }

  function playAgain() {
    if (!selectedDone || selected.won || isRevealing) return;
    const nextMatch = createOnlineCampaignMatch(
      draft.seed,
      draft,
      { sel: selected.opponentSel, copa: selected.opponentCopa },
      selected.index,
      selected.attempt + 1,
    );
    setMatches((current) => current.map((match) => (match.index === selected.index ? nextMatch : match)));
    beginReveal(nextMatch);
  }

  function selectCampaignStep(index: number) {
    if (ignoreClickRef.current || isRevealing || index > completedCount) return;
    setSelectedIndex(index);
    centerStep(index);
  }

  return (
    <main className="online-dream online-campaign tx-paper">
      <OnlineHeader locale={locale} title={t.campaignTitle} />
      <section className="campaign-stage">
        <div className="campaign-counter">
          <strong className="num">
            {selectedIndex + 1} / {matches.length}
          </strong>
          <span>{t.campaignGame}</span>
        </div>
        <div className="campaign-detail" key={`opponent-${selectedIndex}`}>
          <div className="campaign-opponent">
            <span>vs</span>
            <span className="campaign-flag" aria-label={nationName(selected.opponentSel, locale)}>
              <FlagImage code={selected.opponentSel} label={nationName(selected.opponentSel, locale)} />
            </span>
            <strong>{opponentName}</strong>
          </div>
        </div>
        <div
          className={`campaign-track ${isRevealing ? "is-locked" : ""}`}
          ref={scrollerRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onWheel={onWheel}
          onScroll={scheduleSnap}
        >
          <div className="campaign-track-inner">
            <div className="campaign-line" aria-hidden="true" />
            {matches.map((match) => {
              const done = match.index < completedCount;
              const available = match.index <= completedCount && !isRevealing;
              const active = match.index === selectedIndex;
              return (
                <button
                  key={match.index}
                  ref={(node) => {
                    stepRefs.current[match.index] = node;
                  }}
                  className={`campaign-step ${done ? "is-done" : ""} ${active ? "is-active" : ""} ${available ? "is-available" : "is-locked"} ${isRevealing && active ? "is-revealing" : ""}`}
                  type="button"
                  disabled={!available}
                  onClick={() => selectCampaignStep(match.index)}
                >
                  <span className="num">{match.index + 1}</span>
                </button>
              );
            })}
          </div>
        </div>
        {canPlay ? (
          <button className="online-play-btn" type="button" onClick={play}>
            <span aria-hidden="true">⚽</span>
            <span>{t.play}</span>
          </button>
        ) : null}
        {revealVisible ? (
          <div className={`campaign-goals campaign-detail ${isRevealing ? "is-live" : ""}`} key={`goals-${selectedIndex}-${selected.attempt}`} ref={revealPanelRef}>
            <div className={`campaign-score num ${liveGf < liveGa ? "is-losing" : ""}`}>
              {liveGf} - {liveGa}
            </div>
            {visibleGoals.length ? (
              visibleGoals.map((goal, index) => (
                <div className={`campaign-goal ${goal.side === "them" ? "is-them" : "is-me"}`} key={`${goal.minute}-${goal.name}-${index}`}>
                  <span aria-hidden="true">⚽</span>
                  <b className="num">{goal.minute}&apos;</b>
                  <span>{goal.name}</span>
                </div>
              ))
            ) : selected.goals.length === 0 ? (
              <div className="campaign-goal is-me">
                <span aria-hidden="true">•</span>
                <b className="num">90&apos;</b>
                <span>{t.noGoals}</span>
              </div>
            ) : null}
            {showPenalties && selected.penalties ? (
              <div className="campaign-penalties">
                <div className="campaign-penalties-head">
                  <span className="eyebrow">{t.penalties}</span>
                  <strong className="num">{penaltyScore}</strong>
                </div>
                <div className="online-pen-stage">
                  <div className="online-pen-stage-title eyebrow">{t.penaltyShootout}</div>
                  <div className="online-pen-rounds">
                    {basePenaltyRows.map((row) => (
                      <OnlinePenaltyRound meLabel={messages[locale].reveal.yourTeam} me={row.me} opponent={row.them} opponentName={opponentName} round={row.index + 1} key={`base-${row.index}`} />
                    ))}
                  </div>
                </div>
                {suddenDeathPenaltyRows.length ? (
                  <div className="online-pen-stage">
                    <div className="online-pen-stage-title eyebrow">{t.suddenDeath}</div>
                    <div className="online-pen-rounds">
                      {suddenDeathPenaltyRows.map((row) => (
                        <OnlinePenaltyRound meLabel={messages[locale].reveal.yourTeam} me={row.me} opponent={row.them} opponentName={opponentName} round={row.index + 1} key={`sd-${row.index}`} />
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
            {selectedDone ? (
              <div className={`campaign-final ${selected.won ? "is-win" : "is-loss"}`}>
                <span>{t.finished}</span>
              </div>
            ) : null}
            {selectedDone && !selected.won ? (
              <button className="online-play-btn campaign-retry-btn" type="button" onClick={playAgain}>
                <span aria-hidden="true">{"\u21bb"}</span>
                <span>{t.playAgain}</span>
              </button>
            ) : null}
          </div>
        ) : null}
      </section>
    </main>
  );
}

export function OnlineClient({ locale }: { locale: Locale }) {
  const [phase, setPhase] = useState<OnlinePhase>("login");
  const [team, setTeam] = useState<OnlineTeamProfile>(() => ({ name: "", flagPixels: emptyPixels() }));
  const [identity, setIdentity] = useState<OnlineIdentity | null>(null);
  const [campaign, setCampaign] = useState<OnlineCampaignMatch[]>([]);
  const [campaignDraft, setCampaignDraft] = useState<Draft | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      const session = data.session;
      if (!active || !session?.user) return;
      setIdentity({ kind: "google", id: session.user.id, accessToken: session.access_token });
      setTeam(readStoredTeam());
      setPhase("team");
    });
    return () => {
      active = false;
    };
  }, []);

  function enterGuest() {
    setIdentity(getGuestIdentity());
    setTeam(readStoredTeam());
    setPhase("team");
  }

  async function enterGoogle() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      enterGuest();
      return;
    }
    const redirectTo = window.location.href;
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo } });
    if (error) enterGuest();
  }

  if (phase === "team") {
    return (
      <TeamScreen
        locale={locale}
        initialTeam={team}
        onSave={(nextTeam) => {
          setTeam(nextTeam);
          void persistOnlineTeam(identity, nextTeam);
          setPhase("draft");
        }}
      />
    );
  }

  if (phase === "draft") {
    return (
      <DraftScreen
        locale={locale}
        onCampaign={(draft, nextCampaign) => {
          void persistOnlineTeam(identity, team, draft);
          setCampaignDraft(draft);
          setCampaign(nextCampaign);
          setPhase("campaign");
        }}
      />
    );
  }

  if (phase === "campaign" && campaign.length && campaignDraft) {
    return <CampaignScreen locale={locale} campaign={campaign} draft={campaignDraft} />;
  }

  return (
    <LoginScreen
      locale={locale}
      onGoogle={() => void enterGoogle()}
      onGuest={enterGuest}
    />
  );
}
