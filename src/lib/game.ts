import squadIndexRaw from "@/data/squad-index.json";
import squadsRaw from "@/data/squads.json";
import type {
  CampaignMatch,
  Draft,
  DraftOptions,
  Formation,
  PenaltyResult,
  Player,
  Position,
  SimResult,
  Slot,
  SquadFile,
  SquadMeta,
  Style,
  TeamStats,
} from "./types";
import { nationName } from "./nations";

export const squadIndex = squadIndexRaw as SquadMeta[];
export const squadFiles = squadsRaw as SquadFile[];
const squadFilesByKey = new Map(squadFiles.map((squad) => [`${squad.sel}:${squad.copa}`, squad]));

export const defaultOptions: DraftOptions = {
  formation: "4-3-3",
  style: "equilibrado",
  mode: "classico",
};

export const modeConfig = {
  classico: { rerolls: 3, statsVisible: true },
  almanaque: { rerolls: 1, statsVisible: false },
} as const;

export const formations: Record<Formation, Record<Style, Slot[]>> = {
  "4-3-3": {
    defensivo: [
      { pos: "GOL", x: 50, y: 90 },
      { pos: "LD", x: 82, y: 76 },
      { pos: "ZAG", x: 63, y: 78 },
      { pos: "ZAG", x: 37, y: 78 },
      { pos: "LE", x: 18, y: 76 },
      { pos: "VOL", x: 38, y: 60 },
      { pos: "VOL", x: 62, y: 60 },
      { pos: "MC", x: 50, y: 50 },
      { pos: "PD", x: 80, y: 25 },
      { pos: "CA", x: 50, y: 18 },
      { pos: "PE", x: 20, y: 25 },
    ],
    equilibrado: [
      { pos: "GOL", x: 50, y: 90 },
      { pos: "LD", x: 80, y: 74 },
      { pos: "ZAG", x: 63, y: 76 },
      { pos: "ZAG", x: 37, y: 76 },
      { pos: "LE", x: 20, y: 74 },
      { pos: "VOL", x: 50, y: 60 },
      { pos: "MC", x: 65, y: 50 },
      { pos: "MEI", x: 35, y: 50 },
      { pos: "PD", x: 82, y: 22 },
      { pos: "CA", x: 50, y: 17 },
      { pos: "PE", x: 18, y: 22 },
    ],
    ofensivo: [
      { pos: "GOL", x: 50, y: 90 },
      { pos: "LD", x: 82, y: 68 },
      { pos: "ZAG", x: 63, y: 76 },
      { pos: "ZAG", x: 37, y: 76 },
      { pos: "LE", x: 18, y: 68 },
      { pos: "MC", x: 50, y: 57 },
      { pos: "MC", x: 65, y: 45 },
      { pos: "MEI", x: 35, y: 45 },
      { pos: "PD", x: 82, y: 20 },
      { pos: "CA", x: 50, y: 15 },
      { pos: "PE", x: 18, y: 20 },
    ],
  },
  "4-4-2": {
    defensivo: [
      { pos: "GOL", x: 50, y: 90 },
      { pos: "LD", x: 82, y: 77 },
      { pos: "ZAG", x: 63, y: 78 },
      { pos: "ZAG", x: 37, y: 78 },
      { pos: "LE", x: 18, y: 77 },
      { pos: "MD", x: 80, y: 58 },
      { pos: "VOL", x: 60, y: 58 },
      { pos: "VOL", x: 40, y: 58 },
      { pos: "ME", x: 20, y: 58 },
      { pos: "CA", x: 40, y: 22 },
      { pos: "CA", x: 60, y: 22 },
    ],
    equilibrado: [
      { pos: "GOL", x: 50, y: 90 },
      { pos: "LD", x: 82, y: 75 },
      { pos: "ZAG", x: 63, y: 77 },
      { pos: "ZAG", x: 37, y: 77 },
      { pos: "LE", x: 18, y: 75 },
      { pos: "MD", x: 80, y: 57 },
      { pos: "VOL", x: 60, y: 53 },
      { pos: "MC", x: 40, y: 53 },
      { pos: "ME", x: 20, y: 57 },
      { pos: "CA", x: 40, y: 20 },
      { pos: "CA", x: 60, y: 20 },
    ],
    ofensivo: [
      { pos: "GOL", x: 50, y: 90 },
      { pos: "LD", x: 82, y: 74 },
      { pos: "ZAG", x: 63, y: 76 },
      { pos: "ZAG", x: 37, y: 76 },
      { pos: "LE", x: 18, y: 74 },
      { pos: "VOL", x: 50, y: 62 },
      { pos: "MC", x: 35, y: 52 },
      { pos: "MC", x: 65, y: 52 },
      { pos: "MEI", x: 50, y: 40 },
      { pos: "CA", x: 38, y: 20 },
      { pos: "CA", x: 62, y: 20 },
    ],
  },
  "4-2-3-1": {
    defensivo: [
      { pos: "GOL", x: 50, y: 90 },
      { pos: "LD", x: 82, y: 77 },
      { pos: "ZAG", x: 63, y: 78 },
      { pos: "ZAG", x: 37, y: 78 },
      { pos: "LE", x: 18, y: 77 },
      { pos: "VOL", x: 40, y: 65 },
      { pos: "VOL", x: 60, y: 65 },
      { pos: "PE", x: 20, y: 52 },
      { pos: "MEI", x: 50, y: 50 },
      { pos: "PD", x: 80, y: 52 },
      { pos: "CA", x: 50, y: 30 },
    ],
    equilibrado: [
      { pos: "GOL", x: 50, y: 90 },
      { pos: "LD", x: 82, y: 75 },
      { pos: "ZAG", x: 63, y: 77 },
      { pos: "ZAG", x: 37, y: 77 },
      { pos: "LE", x: 18, y: 75 },
      { pos: "VOL", x: 38, y: 60 },
      { pos: "MC", x: 62, y: 60 },
      { pos: "PE", x: 18, y: 45 },
      { pos: "MEI", x: 50, y: 43 },
      { pos: "PD", x: 82, y: 45 },
      { pos: "CA", x: 50, y: 22 },
    ],
    ofensivo: [
      { pos: "GOL", x: 50, y: 90 },
      { pos: "LD", x: 85, y: 62 },
      { pos: "ZAG", x: 63, y: 76 },
      { pos: "ZAG", x: 37, y: 76 },
      { pos: "LE", x: 15, y: 62 },
      { pos: "MC", x: 38, y: 53 },
      { pos: "MC", x: 62, y: 53 },
      { pos: "PE", x: 15, y: 38 },
      { pos: "MEI", x: 50, y: 36 },
      { pos: "PD", x: 85, y: 38 },
      { pos: "CA", x: 50, y: 17 },
    ],
  },
  "4-2-4": {
    defensivo: [
      { pos: "GOL", x: 50, y: 90 },
      { pos: "LD", x: 82, y: 77 },
      { pos: "ZAG", x: 63, y: 78 },
      { pos: "ZAG", x: 37, y: 78 },
      { pos: "LE", x: 18, y: 77 },
      { pos: "VOL", x: 38, y: 65 },
      { pos: "VOL", x: 62, y: 65 },
      { pos: "PE", x: 15, y: 28 },
      { pos: "CA", x: 38, y: 24 },
      { pos: "CA", x: 62, y: 24 },
      { pos: "PD", x: 85, y: 28 },
    ],
    equilibrado: [
      { pos: "GOL", x: 50, y: 90 },
      { pos: "LD", x: 82, y: 75 },
      { pos: "ZAG", x: 63, y: 77 },
      { pos: "ZAG", x: 37, y: 77 },
      { pos: "LE", x: 18, y: 75 },
      { pos: "MC", x: 38, y: 58 },
      { pos: "MC", x: 62, y: 58 },
      { pos: "PE", x: 15, y: 24 },
      { pos: "CA", x: 38, y: 20 },
      { pos: "CA", x: 62, y: 20 },
      { pos: "PD", x: 85, y: 24 },
    ],
    ofensivo: [
      { pos: "GOL", x: 50, y: 90 },
      { pos: "LD", x: 85, y: 67 },
      { pos: "ZAG", x: 63, y: 76 },
      { pos: "ZAG", x: 37, y: 76 },
      { pos: "LE", x: 15, y: 67 },
      { pos: "MC", x: 40, y: 55 },
      { pos: "MEI", x: 60, y: 50 },
      { pos: "PE", x: 12, y: 22 },
      { pos: "CA", x: 38, y: 17 },
      { pos: "CA", x: 62, y: 17 },
      { pos: "PD", x: 88, y: 22 },
    ],
  },
  "3-5-2": {
    defensivo: [
      { pos: "GOL", x: 50, y: 90 },
      { pos: "ZAG", x: 72, y: 78 },
      { pos: "ZAG", x: 50, y: 79 },
      { pos: "ZAG", x: 28, y: 78 },
      { pos: "MD", x: 84, y: 60 },
      { pos: "VOL", x: 62, y: 61 },
      { pos: "VOL", x: 38, y: 61 },
      { pos: "ME", x: 16, y: 60 },
      { pos: "MEI", x: 50, y: 45 },
      { pos: "CA", x: 40, y: 22 },
      { pos: "CA", x: 60, y: 22 },
    ],
    equilibrado: [
      { pos: "GOL", x: 50, y: 90 },
      { pos: "ZAG", x: 72, y: 77 },
      { pos: "ZAG", x: 50, y: 78 },
      { pos: "ZAG", x: 28, y: 77 },
      { pos: "MD", x: 84, y: 55 },
      { pos: "MC", x: 62, y: 55 },
      { pos: "VOL", x: 50, y: 62 },
      { pos: "MC", x: 38, y: 55 },
      { pos: "ME", x: 16, y: 55 },
      { pos: "CA", x: 40, y: 20 },
      { pos: "CA", x: 60, y: 20 },
    ],
    ofensivo: [
      { pos: "GOL", x: 50, y: 90 },
      { pos: "ZAG", x: 75, y: 77 },
      { pos: "ZAG", x: 50, y: 78 },
      { pos: "ZAG", x: 25, y: 77 },
      { pos: "MD", x: 88, y: 48 },
      { pos: "MC", x: 62, y: 54 },
      { pos: "MC", x: 38, y: 54 },
      { pos: "ME", x: 12, y: 48 },
      { pos: "MEI", x: 50, y: 38 },
      { pos: "CA", x: 40, y: 18 },
      { pos: "CA", x: 60, y: 18 },
    ],
  },
  "5-3-2": {
    defensivo: [
      { pos: "GOL", x: 50, y: 90 },
      { pos: "LD", x: 86, y: 74 },
      { pos: "ZAG", x: 68, y: 78 },
      { pos: "ZAG", x: 50, y: 80 },
      { pos: "ZAG", x: 32, y: 78 },
      { pos: "LE", x: 14, y: 74 },
      { pos: "VOL", x: 50, y: 62 },
      { pos: "MC", x: 35, y: 52 },
      { pos: "MC", x: 65, y: 52 },
      { pos: "CA", x: 40, y: 22 },
      { pos: "CA", x: 60, y: 22 },
    ],
    equilibrado: [
      { pos: "GOL", x: 50, y: 90 },
      { pos: "LD", x: 86, y: 70 },
      { pos: "ZAG", x: 68, y: 77 },
      { pos: "ZAG", x: 50, y: 79 },
      { pos: "ZAG", x: 32, y: 77 },
      { pos: "LE", x: 14, y: 70 },
      { pos: "VOL", x: 50, y: 60 },
      { pos: "MC", x: 36, y: 50 },
      { pos: "MEI", x: 64, y: 50 },
      { pos: "CA", x: 40, y: 20 },
      { pos: "CA", x: 60, y: 20 },
    ],
    ofensivo: [
      { pos: "GOL", x: 50, y: 90 },
      { pos: "LD", x: 88, y: 64 },
      { pos: "ZAG", x: 68, y: 77 },
      { pos: "ZAG", x: 50, y: 79 },
      { pos: "ZAG", x: 32, y: 77 },
      { pos: "LE", x: 12, y: 64 },
      { pos: "MC", x: 50, y: 58 },
      { pos: "MC", x: 35, y: 48 },
      { pos: "MEI", x: 65, y: 48 },
      { pos: "CA", x: 40, y: 18 },
      { pos: "CA", x: 60, y: 18 },
    ],
  },
  "4-5-1": {
    defensivo: [
      { pos: "GOL", x: 50, y: 90 },
      { pos: "LD", x: 82, y: 77 },
      { pos: "ZAG", x: 63, y: 78 },
      { pos: "ZAG", x: 37, y: 78 },
      { pos: "LE", x: 18, y: 77 },
      { pos: "MD", x: 82, y: 58 },
      { pos: "VOL", x: 62, y: 60 },
      { pos: "VOL", x: 38, y: 60 },
      { pos: "ME", x: 18, y: 58 },
      { pos: "MEI", x: 50, y: 44 },
      { pos: "CA", x: 50, y: 22 },
    ],
    equilibrado: [
      { pos: "GOL", x: 50, y: 90 },
      { pos: "LD", x: 82, y: 75 },
      { pos: "ZAG", x: 63, y: 77 },
      { pos: "ZAG", x: 37, y: 77 },
      { pos: "LE", x: 18, y: 75 },
      { pos: "MD", x: 82, y: 54 },
      { pos: "MC", x: 62, y: 56 },
      { pos: "VOL", x: 50, y: 62 },
      { pos: "MC", x: 38, y: 56 },
      { pos: "ME", x: 18, y: 54 },
      { pos: "CA", x: 50, y: 22 },
    ],
    ofensivo: [
      { pos: "GOL", x: 50, y: 90 },
      { pos: "LD", x: 84, y: 70 },
      { pos: "ZAG", x: 63, y: 77 },
      { pos: "ZAG", x: 37, y: 77 },
      { pos: "LE", x: 16, y: 70 },
      { pos: "MD", x: 86, y: 48 },
      { pos: "MC", x: 62, y: 55 },
      { pos: "MC", x: 38, y: 55 },
      { pos: "ME", x: 14, y: 48 },
      { pos: "MEI", x: 50, y: 40 },
      { pos: "CA", x: 50, y: 18 },
    ],
  },
  "3-4-3": {
    defensivo: [
      { pos: "GOL", x: 50, y: 90 },
      { pos: "ZAG", x: 72, y: 78 },
      { pos: "ZAG", x: 50, y: 79 },
      { pos: "ZAG", x: 28, y: 78 },
      { pos: "MD", x: 84, y: 60 },
      { pos: "VOL", x: 60, y: 61 },
      { pos: "VOL", x: 40, y: 61 },
      { pos: "ME", x: 16, y: 60 },
      { pos: "PD", x: 78, y: 26 },
      { pos: "CA", x: 50, y: 20 },
      { pos: "PE", x: 22, y: 26 },
    ],
    equilibrado: [
      { pos: "GOL", x: 50, y: 90 },
      { pos: "ZAG", x: 72, y: 77 },
      { pos: "ZAG", x: 50, y: 78 },
      { pos: "ZAG", x: 28, y: 77 },
      { pos: "MD", x: 86, y: 55 },
      { pos: "MC", x: 60, y: 55 },
      { pos: "MC", x: 40, y: 55 },
      { pos: "ME", x: 14, y: 55 },
      { pos: "PD", x: 78, y: 23 },
      { pos: "CA", x: 50, y: 17 },
      { pos: "PE", x: 22, y: 23 },
    ],
    ofensivo: [
      { pos: "GOL", x: 50, y: 90 },
      { pos: "ZAG", x: 75, y: 77 },
      { pos: "ZAG", x: 50, y: 78 },
      { pos: "ZAG", x: 25, y: 77 },
      { pos: "ME", x: 8, y: 28 },
      { pos: "MC", x: 35, y: 47 },
      { pos: "MEI", x: 65, y: 47 },
      { pos: "MD", x: 92, y: 28 },
      { pos: "PE", x: 20, y: 17 },
      { pos: "CA", x: 50, y: 14 },
      { pos: "PD", x: 80, y: 17 },
    ],
  },
};

const attackWeights: Record<Position, number> = {
  GOL: 0,
  LD: 0,
  ZAG: 0,
  LE: 0,
  MD: 0.5,
  ME: 0.5,
  VOL: 0.2,
  MC: 0.5,
  MEI: 0.8,
  PD: 1,
  CA: 1,
  PE: 1,
};

const defenseWeights: Record<Position, number> = {
  GOL: 1,
  LD: 1,
  ZAG: 1,
  LE: 1,
  MD: 0.5,
  ME: 0.5,
  VOL: 0.8,
  MC: 0.5,
  MEI: 0.2,
  PD: 0,
  CA: 0,
  PE: 0,
};

const phases = [
  {
    key: "GRUPOS",
    type: "group" as const,
    opponents: [
      { label: "Grupo · 1º jogo", overall: 68 },
      { label: "Grupo · 2º jogo", overall: 72 },
      { label: "Grupo · 3º jogo", overall: 76 },
    ],
  },
  { key: "OITAVAS", type: "knockout" as const, opponent: { label: "Oitavas", overall: 79 } },
  { key: "QUARTAS", type: "knockout" as const, opponent: { label: "Quartas", overall: 83 } },
  { key: "SEMI", type: "knockout" as const, opponent: { label: "Semifinal", overall: 87 } },
  { key: "FINAL", type: "knockout" as const, opponent: { label: "Final", overall: 91 } },
];

export function createDraft(seed: string, options: DraftOptions = defaultOptions): Draft {
  return {
    seed,
    options,
    slots: formations[options.formation][options.style],
    filled: Array.from({ length: 11 }, () => null),
    current: null,
    rollIndex: 0,
    rerollsLeft: modeConfig[options.mode].rerolls,
    usedPlayerIds: [],
  };
}

export function playerKey(player: Pick<Player, "sel" | "copa" | "playerId">) {
  return `${player.sel}:${player.copa}:${player.playerId}`;
}

export async function fetchSquad(sel: string, copa: number): Promise<SquadFile> {
  const squad = squadFilesByKey.get(`${sel}:${copa}`);
  if (!squad) throw new Error(`Squad not indexed: ${sel}:${copa}`);
  return squad;
}

export function findSquadMeta(sel: string, copa: number) {
  return squadIndex.find((item) => item.sel === sel && item.copa === copa);
}

export function hashSeed(input: string) {
  let hash = 0x6a09e667 ^ input.length;
  for (let index = 0; index < input.length; index += 1) {
    hash = Math.imul(hash ^ input.charCodeAt(index), 0xcc9e2d51);
    hash = (hash << 13) | (hash >>> 19);
  }
  return hash >>> 0;
}

export function rng(seed: string) {
  let state = hashSeed(seed);
  return () => {
    state |= 0;
    let value = Math.imul((state = (state + 0x6d2b79f5) | 0) ^ (state >>> 15), 1 | state);
    value = value + Math.imul(value ^ (value >>> 7), 61 | value) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 0x100000000;
  };
}

export function pick<T>(random: () => number, values: T[]) {
  if (values.length === 0) throw new Error("Cannot pick from an empty array");
  return values[Math.floor(random() * values.length)] as T;
}

export function rollPair(seed: string, rollIndex: number, avoid: Array<{ sel: string; copa: number }> = []) {
  const random = rng(`${seed.toUpperCase()}:roll:${rollIndex}`);
  const avoidKeys = new Set(avoid.map((item) => `${item.sel}:${item.copa}`));
  const pool = squadIndex.filter((item) => !avoidKeys.has(`${item.sel}:${item.copa}`));
  return pick(random, pool.length ? pool : squadIndex);
}

export function rerollPair(
  seed: string,
  base: { sel: string; copa: number },
  axis: "sel" | "copa",
  rerollNo: number,
) {
  const random = rng(`${seed.toUpperCase()}:reroll:${axis}:${rerollNo}:${base.sel}:${base.copa}`);
  if (axis === "sel") {
    const pool = squadIndex.filter((item) => item.copa === base.copa && item.sel !== base.sel);
    return pick(random, pool);
  }
  const pool = squadIndex.filter((item) => item.sel === base.sel && item.copa !== base.copa);
  return pick(random, pool.length ? pool : squadIndex.filter((item) => item.sel !== base.sel));
}

export function fitsSlot(player: Player, slot: Slot) {
  return player.positions.includes(slot.pos);
}

export function availablePositions(draft: Draft, player: Player) {
  return draft.slots
    .map((slot, index) => ({ slot, index }))
    .filter(({ slot, index }) => draft.filled[index] === null && fitsSlot(player, slot));
}

export function canFillAnySlot(draft: Draft, player: Player) {
  return availablePositions(draft, player).length > 0;
}

export function calculateStats(draftOrPlayers: Draft | Array<Player | null>, slots?: Slot[]): TeamStats {
  const filled = Array.isArray(draftOrPlayers) ? draftOrPlayers : draftOrPlayers.filled;
  const useSlots = slots ?? (Array.isArray(draftOrPlayers) ? formations["4-3-3"].equilibrado : draftOrPlayers.slots);
  let attack = 0;
  let attackWeight = 0;
  let defense = 0;
  let defenseWeight = 0;
  let overall = 0;
  let count = 0;

  useSlots.forEach((slot, index) => {
    const player = filled[index];
    const attackSlotWeight = attackWeights[slot.pos];
    const defenseSlotWeight = defenseWeights[slot.pos];
    attackWeight += attackSlotWeight;
    defenseWeight += defenseSlotWeight;
    if (!player) return;
    attack += player.force * attackSlotWeight;
    defense += player.force * defenseSlotWeight;
    overall += player.force;
    count += 1;
  });

  return {
    attack: attackWeight > 0 ? Math.round(attack / attackWeight) : 0,
    defense: defenseWeight > 0 ? Math.round(defense / defenseWeight) : 0,
    overall: count > 0 ? Math.round(overall / count) : 0,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function lambda(a: number, b: number) {
  return clamp(1.4 + (a - b) * 0.08, 0.15, 5);
}

function poisson(random: () => number, expected: number) {
  if (expected <= 0) return 0;
  const limit = Math.exp(-expected);
  let count = 0;
  let product = 1;
  do {
    count += 1;
    product *= random();
  } while (product > limit);
  return count - 1;
}

function playMatch(random: () => number, attack: number, defense: number, opponentOverall: number) {
  const gf = poisson(random, lambda(attack, opponentOverall));
  const ga = poisson(random, lambda(opponentOverall, defense));
  return { gf, ga, outcome: gf > ga ? "V" : gf < ga ? "D" : "E" } as const;
}

function weightedGoalScorers(random: () => number, squad: Player[], goals: number) {
  if (goals <= 0) return [];
  const out: string[] = [];
  const weights = squad.map((player) => {
    if (player.positions.includes("GOL")) return 0.02 * player.force;
    if (player.positions.some((position) => ["PD", "PE", "CA"].includes(position))) return 1.2 * player.force;
    if (player.positions.some((position) => ["MEI", "MC", "MD", "ME"].includes(position))) return 0.7 * player.force;
    return 0.25 * player.force;
  });
  for (let goal = 0; goal < goals; goal += 1) {
    const total = weights.reduce((sum, weight) => sum + weight, 0);
    let marker = random() * total;
    let index = 0;
    for (; index < weights.length - 1; index += 1) {
      marker -= weights[index] ?? 0;
      if (marker <= 0) break;
    }
    out.push(squad[index]?.name ?? "?");
    weights[index] = (weights[index] ?? 0) * 0.45;
  }
  return out;
}

function goalMinutes(random: () => number, me: string[], them: string[]) {
  const all = [
    ...me.map((name) => ({ name, side: "me" as const })),
    ...them.map((name) => ({ name, side: "them" as const })),
  ];
  const minutes = new Set<number>();
  return all
    .map((goal) => {
      let minute = 1 + Math.floor(90 * Math.pow(random(), 0.85));
      while (minutes.has(minute)) minute = Math.min(90, minute + 1);
      minutes.add(minute);
      return { minute, ...goal };
    })
    .sort((a, b) => a.minute - b.minute);
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function penaltyShootoutCutoff(me: number[], them: number[]) {
  let meScore = 0;
  let themScore = 0;
  const rounds = me.length;
  for (let index = 0; index < rounds; index += 1) {
    meScore += me[index] ?? 0;
    if (meScore > themScore + (rounds - index)) return { meCount: index + 1, themCount: index };
    themScore += them[index] ?? 0;
    const remaining = rounds - 1 - index;
    if (meScore > themScore + remaining || themScore > meScore + remaining) {
      return { meCount: index + 1, themCount: index + 1 };
    }
  }
  return { meCount: rounds, themCount: rounds };
}

function penaltyTakerNames(squad: Player[], count: number) {
  if (count <= 0 || squad.length === 0) return undefined;
  const ordered = [...squad].sort((left, right) => {
    const leftGoalkeeper = Number(left.positions.includes("GOL"));
    const rightGoalkeeper = Number(right.positions.includes("GOL"));
    return leftGoalkeeper - rightGoalkeeper || right.force - left.force;
  });
  return Array.from({ length: count }, (_, index) => ordered[index % ordered.length]?.name ?? "?");
}

function penalties(random: () => number, advanced: boolean, meSquad: Player[], themSquad: Player[]): PenaltyResult {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const me = Array.from({ length: 5 }, () => +(random() < 0.78));
    const them = Array.from({ length: 5 }, () => +(random() < 0.78));
    const meScore = sum(me);
    const themScore = sum(them);
    const expectedWinnerScore = advanced ? meScore : themScore;
    const expectedLoserScore = advanced ? themScore : meScore;
    if (expectedWinnerScore > expectedLoserScore) {
      const cutoff = penaltyShootoutCutoff(me, them);
      return {
        me: me.slice(0, cutoff.meCount),
        them: them.slice(0, cutoff.themCount),
        score: `${meScore}-${themScore}`,
        meNames: penaltyTakerNames(meSquad, cutoff.meCount),
        themNames: penaltyTakerNames(themSquad, cutoff.themCount),
      };
    }
    if (meScore === themScore) {
      const sdMe: number[] = [];
      const sdThem: number[] = [];
      let liveMeScore = meScore;
      let liveThemScore = themScore;
      for (let round = 0; liveMeScore === liveThemScore && round < 5; round += 1) {
        const meKick = +(random() < 0.78);
        const themKick = +(random() < 0.78);
        if (meKick !== themKick) {
          const winnerKick = +advanced;
          const loserKick = +!advanced;
          sdMe.push(winnerKick);
          sdThem.push(loserKick);
          liveMeScore += winnerKick;
          liveThemScore += loserKick;
        } else {
          sdMe.push(meKick);
          sdThem.push(themKick);
          liveMeScore += meKick;
          liveThemScore += themKick;
        }
      }
      if (liveMeScore === liveThemScore) {
        const winnerKick = +advanced;
        const loserKick = +!advanced;
        sdMe.push(winnerKick);
        sdThem.push(loserKick);
        liveMeScore += winnerKick;
        liveThemScore += loserKick;
      }
      return {
        me,
        them,
        score: `${liveMeScore}-${liveThemScore}`,
        meNames: penaltyTakerNames(meSquad, me.length),
        themNames: penaltyTakerNames(themSquad, them.length),
        sd: {
          me: sdMe,
          them: sdThem,
          meNames: penaltyTakerNames(meSquad, me.length + sdMe.length)?.slice(me.length),
          themNames: penaltyTakerNames(themSquad, them.length + sdThem.length)?.slice(them.length),
        },
      };
    }
  }
  return advanced
    ? { me: [1], them: [0], score: "1-0", meNames: penaltyTakerNames(meSquad, 1), themNames: penaltyTakerNames(themSquad, 1) }
    : { me: [0], them: [1], score: "0-1", meNames: penaltyTakerNames(meSquad, 1), themNames: penaltyTakerNames(themSquad, 1) };
}

function groupStandings(
  random: () => number,
  userMatches: Array<{ gf: number; ga: number; outcome: "V" | "E" | "D" }>,
  opponents: Array<{ label: string; overall: number }>,
) {
  const me = {
    me: true,
    label: "Você",
    pts: userMatches.reduce((sum, match) => sum + (match.outcome === "V" ? 3 : match.outcome === "E" ? 1 : 0), 0),
    gd: userMatches.reduce((sum, match) => sum + match.gf - match.ga, 0),
    gf: userMatches.reduce((sum, match) => sum + match.gf, 0),
  };
  const table = opponents.map((opponent, index) => {
    const match = userMatches[index]!;
    return {
      me: false,
      label: opponent.label,
      pts: match.outcome === "D" ? 3 : match.outcome === "E" ? 1 : 0,
      gd: match.ga - match.gf,
      gf: match.ga,
    };
  });

  for (let left = 0; left < opponents.length; left += 1) {
    for (let right = left + 1; right < opponents.length; right += 1) {
      const match = playMatch(random, opponents[left]!.overall, opponents[left]!.overall, opponents[right]!.overall);
      if (match.outcome === "V") table[left]!.pts += 3;
      else if (match.outcome === "E") {
        table[left]!.pts += 1;
        table[right]!.pts += 1;
      } else table[right]!.pts += 3;
      table[left]!.gd += match.gf - match.ga;
      table[left]!.gf += match.gf;
      table[right]!.gd += match.ga - match.gf;
      table[right]!.gf += match.ga;
    }
  }

  return [me, ...table].sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
}

function opponentLabel(opponent: Pick<SquadFile, "sel" | "copa"> | SquadMeta | undefined, fallback: string) {
  return opponent ? `${opponent.sel} ${opponent.copa}` : fallback;
}

function fallbackOpponentMetas(seed: string, selected: Player[], count: number) {
  const random = rng(`${seed}:opponents`);
  const used = new Set(selected.map((player) => `${player.sel}:${player.copa}`));
  const metas: SquadMeta[] = [];
  while (metas.length < count && used.size < squadIndex.length) {
    const meta = squadIndex[Math.floor(random() * squadIndex.length)]!;
    const key = `${meta.sel}:${meta.copa}`;
    if (used.has(key)) continue;
    used.add(key);
    metas.push(meta);
  }
  return metas;
}

export function simulateCampaign(
  seed: string,
  draft: Draft,
  opponentSquads: SquadFile[] = [],
): SimResult {
  const stats = calculateStats(draft);
  const selected = draft.filled.filter(Boolean) as Player[];
  const fallbackOpponents = fallbackOpponentMetas(seed, selected, 7);
  const random = rng(`${seed.toUpperCase()}:copa`);
  const scorerRandom = rng(`${seed.toUpperCase()}:gols`);
  let wins = 0;
  let draws = 0;
  let losses = 0;
  let gf = 0;
  let ga = 0;
  let eliminated = false;
  let opponentIndex = 0;
  const campaign: CampaignMatch[] = [];

  for (const phase of phases) {
    if (eliminated) break;
    if (phase.type === "group") {
      const groupMatches: Array<{ gf: number; ga: number; outcome: "V" | "E" | "D" }> = [];
      const groupOpponents: Array<{ label: string; overall: number }> = [];
      phase.opponents.forEach((opponent) => {
        const opponentSquad = opponentSquads[opponentIndex];
        const opponentMeta = opponentSquad ?? fallbackOpponents[opponentIndex];
        const label = opponentLabel(opponentMeta, opponent.label);
        groupOpponents.push({ label, overall: opponent.overall });
        const match = playMatch(random, stats.attack, stats.defense, opponent.overall);
        groupMatches.push(match);
        gf += match.gf;
        ga += match.ga;
        if (match.outcome === "V") wins += 1;
        else if (match.outcome === "E") draws += 1;
        else losses += 1;
        opponentIndex += 1;
        const scorers = weightedGoalScorers(scorerRandom, selected, match.gf);
        const conceded = weightedGoalScorers(scorerRandom, opponentSquad?.squad ?? [], match.ga);
        campaign.push({
          phase: phase.key,
          opponent: label,
          opponentOverall: opponent.overall,
          gf: match.gf,
          ga: match.ga,
          outcome: match.outcome,
          advanced: true,
          scorers,
          conceded,
          minutes: goalMinutes(rng(`${seed}:min:${campaign.length}`), scorers, conceded),
        });
      });
      const table = groupStandings(random, groupMatches, groupOpponents);
      campaign[campaign.length - 1]!.groupTable = table;
      if (table.findIndex((row) => row.me) >= 2) {
        campaign[campaign.length - 1]!.advanced = false;
        eliminated = true;
      }
      continue;
    }

    const opponent = phase.opponent;
    const opponentSquad = opponentSquads[opponentIndex];
    const opponentMeta = opponentSquad ?? fallbackOpponents[opponentIndex];
    const label = opponentLabel(opponentMeta, opponent.label);
    opponentIndex += 1;
    const match = playMatch(random, stats.attack, stats.defense, opponent.overall);
    gf += match.gf;
    ga += match.ga;
    let advanced = false;
    let penaltyResult;
    if (match.outcome === "V") {
      advanced = true;
    } else if (match.outcome === "E") {
      const tiebreakStrength = (stats.attack + stats.defense) / 2;
      const chance = clamp(0.5 + (tiebreakStrength - opponent.overall) * 0.012, 0.1, 0.9);
      advanced = random() < chance;
      penaltyResult = penalties(rng(`${seed}:pen:${campaign.length}`), advanced, selected, opponentSquad?.squad ?? []);
    }
    if (advanced) wins += 1;
    else losses += 1;
    eliminated = !advanced;
    const scorers = weightedGoalScorers(scorerRandom, selected, match.gf);
    const conceded = weightedGoalScorers(scorerRandom, opponentSquad?.squad ?? [], match.ga);
    campaign.push({
      phase: phase.key,
      opponent: label,
      opponentOverall: opponent.overall,
      gf: match.gf,
      ga: match.ga,
      outcome: match.outcome,
      advanced,
      penalties: penaltyResult,
      scorers,
      conceded,
      minutes: goalMinutes(rng(`${seed}:min:${campaign.length}`), scorers, conceded),
    });
  }

  const champion = !eliminated && campaign.at(-1)?.phase === "FINAL";
  const perfect = champion && wins === 7 && draws === 0 && losses === 0;
  const badge = perfect && gf - ga >= 18 ? "ESMAGADOR DE RECORDES" : champion && ga === 0 ? "MURALHA" : null;
  return {
    record: `${wins}-${losses}`,
    champion,
    perfect,
    wins,
    draws,
    losses,
    gf,
    ga,
    campaign,
    badge,
  };
}

export function randomSeed() {
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    return crypto.getRandomValues(new Uint32Array(1))[0]!.toString(36);
  }
  return Math.floor(Math.random() * 0xffffffff).toString(36);
}

export function findPlayerInSquad(squad: SquadFile, playerId: string) {
  return squad.squad.find((player) => player.playerId === playerId);
}

export function describePair(sel: string, copa: number, locale: "pt" | "en" | "es") {
  return `${nationName(sel, locale)} ${copa}`;
}
