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
  number: number | null;
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
  matchId?: number;
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

export type TournamentStage =
  | "GROUP"
  | "ROUND_OF_32"
  | "ROUND_OF_16"
  | "QUARTERFINAL"
  | "SEMIFINAL"
  | "THIRD_PLACE"
  | "FINAL";

export interface TournamentTeam {
  id: string;
  label: string;
  sel?: string;
  copa?: number;
  group: string;
  slot: number;
  attack: number;
  defense: number;
  overall: number;
  isUser: boolean;
}

export interface TournamentMatch {
  id: number;
  stage: TournamentStage;
  group?: string;
  matchday?: number;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
  winnerTeamId?: string;
  loserTeamId?: string;
  penalties?: PenaltyResult;
  isUserMatch: boolean;
}

export interface TournamentStanding {
  teamId: string;
  rank: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  gf: number;
  ga: number;
  gd: number;
  pts: number;
  qualified: boolean;
  thirdRank?: number;
}

export interface TournamentGroup {
  group: string;
  teamIds: string[];
  matchIds: number[];
  standings: TournamentStanding[];
}

export interface TournamentBracket {
  roundOf32: number[];
  roundOf16: number[];
  quarterfinals: number[];
  semifinals: number[];
  thirdPlace: number;
  final: number;
}

export interface TournamentData {
  userTeamId: string;
  userGroup: string;
  teams: TournamentTeam[];
  groups: TournamentGroup[];
  matches: TournamentMatch[];
  bracket: TournamentBracket;
  qualifiedThirdGroups: string[];
  thirdPlaceAssignments: Record<string, string>;
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
  tournament: TournamentData;
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
