export type Locale = "pt" | "en" | "es";

export type Position =
  | "GOL"
  | "LD"
  | "LE"
  | "ZAG"
  | "MD"
  | "ME"
  | "VOL"
  | "MC"
  | "MEI"
  | "PD"
  | "PE"
  | "CA";

export type Style = "defensivo" | "equilibrado" | "ofensivo";
export type Mode = "classico" | "almanaque";
export type Formation = "4-3-3" | "4-4-2" | "4-2-3-1" | "4-2-4" | "3-5-2" | "5-3-2" | "4-5-1" | "3-4-3";

export interface Player {
  playerId: string;
  name: string;
  sel: string;
  copa: number;
  positions: Position[];
  number: number;
  force: number;
  legend: boolean;
}

export interface SquadFile {
  sel: string;
  copa: number;
  squad: Player[];
}

export interface SquadMeta {
  sel: string;
  copa: number;
  slug: string;
}

export interface Slot {
  pos: Position;
  x: number;
  y: number;
}

export interface PickedPlayer extends Player {
  slot: number;
}

export interface DraftOptions {
  formation: Formation;
  style: Style;
  mode: Mode;
}

export interface Draft {
  seed: string;
  options: DraftOptions;
  slots: Slot[];
  filled: Array<Player | null>;
  current: { sel: string; copa: number } | null;
  rollIndex: number;
  rerollsLeft: number;
  usedPlayerIds: string[];
}

export interface TeamStats {
  attack: number;
  defense: number;
  overall: number;
}

export interface PenaltyResult {
  score: string;
  me: number[];
  them: number[];
  meNames?: string[];
  themNames?: string[];
  sd?: {
    me: number[];
    them: number[];
    meNames?: string[];
    themNames?: string[];
  };
}

export interface CampaignMatch {
  phase: string;
  opponent: string;
  opponentOverall: number;
  gf: number;
  ga: number;
  outcome: "V" | "E" | "D";
  advanced: boolean;
  penalties?: PenaltyResult;
  scorers: string[];
  conceded: string[];
  minutes: Array<{ minute: number; name: string; side: "me" | "them" }>;
  groupTable?: Array<{
    me: boolean;
    pts: number;
    gd: number;
    gf: number;
    label: string;
  }>;
}

export interface SimResult {
  record: string;
  champion: boolean;
  perfect: boolean;
  wins: number;
  draws: number;
  losses: number;
  gf: number;
  ga: number;
  campaign: CampaignMatch[];
  badge: "ESMAGADOR DE RECORDES" | "MURALHA" | null;
}

export interface SharePayload {
  v: 1;
  seed: string;
  formation: Formation;
  style: Style;
  mode: Mode;
  xi: Array<{ sel: string; copa: number; playerId: string; slot: number }>;
}
