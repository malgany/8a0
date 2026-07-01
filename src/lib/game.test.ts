import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  calculateStats,
  createDraft,
  createShowcaseDraft,
  defaultOptions,
  findSquadMeta,
  formations,
  rng,
  simulateCampaign,
  squadFiles,
  squadIndex,
} from "./game";
import { createOnlineCampaign } from "./online-game";
import type { Player, SquadFile } from "./types";

const groupLetters = "ABCDEFGHIJKL".split("");
const earlyWorldCupYears = new Set([1930, 1934, 1938]);
const earlyHighlightedRanges = [
  { sel: "URU", copa: 1930, min: 85, max: 95, ids: ["jose-leandro-andrade", "jose-nasazzi", "hector-scarone", "pedro-cea"] },
  { sel: "ARG", copa: 1930, min: 85, max: 92, ids: ["guillermo-stabile", "luis-monti", "francisco-varallo", "manuel-ferreira"] },
  { sel: "USA", copa: 1930, min: 85, max: 89, ids: ["bert-patenaude", "billy-gonsalves", "jim-brown"] },
  { sel: "ITA", copa: 1934, min: 85, max: 95, ids: ["giuseppe-meazza", "luis-monti-ita-1934", "raimundo-orsi", "giovanni-ferrari", "angelo-schiavio", "gianpiero-combi"] },
  { sel: "TCH", copa: 1934, min: 85, max: 90, ids: ["frantisek-planicka", "oldrich-nejedly", "antonin-puc"] },
  { sel: "GER", copa: 1934, min: 85, max: 90, ids: ["edmund-conen", "fritz-szepan", "ernst-lehner"] },
  { sel: "ITA", copa: 1938, min: 85, max: 95, ids: ["giuseppe-meazza-ita-1938", "silvio-piola", "giovanni-ferrari-ita-1938", "gino-colaussi"] },
  { sel: "HUN", copa: 1938, min: 85, max: 90, ids: ["gyorgy-sarosi-hun-1938", "gyula-zsengeller", "pal-titkos"] },
  { sel: "BRA", copa: 1938, min: 85, max: 95, ids: ["leonidas-bra-1938", "domingos-da-guia-bra-1938", "romeu", "peracio"] },
];
const earlyHighlightedKeys = new Set(
  earlyHighlightedRanges.flatMap((group) => group.ids.map((id) => `${group.sel}:${group.copa}:${id}`)),
);

function readSquad(slug: string): SquadFile {
  return JSON.parse(readFileSync(path.join(process.cwd(), "public", "squads", `${slug}.json`), "utf8")) as SquadFile;
}

function filledDraft(seed = "fixed") {
  const squad = readSquad("BRA-1970-43aa9180");
  const draft = createDraft(seed, defaultOptions);
  draft.filled = squad.squad.slice(0, 11);
  return draft;
}

function matchCount(result: ReturnType<typeof simulateCampaign>, stage: string) {
  return result.tournament.matches.filter((match) => match.stage === stage).length;
}

describe("8a0 dataset", () => {
  it("keeps the mirrored squad index and squad files aligned", () => {
    const files = readdirSync(path.join(process.cwd(), "public", "squads")).filter((file) => file.endsWith(".json"));
    expect(squadIndex).toHaveLength(294);
    expect(squadFiles).toHaveLength(294);
    expect(files).toHaveLength(294);
    const players = squadIndex.flatMap((meta) => readSquad(meta.slug).squad);
    expect(players).toHaveLength(6514);
    expect(players.every((player) => player.playerId && player.name && player.positions.length > 0)).toBe(true);
    expect(players.every((player) => player.number !== null)).toBe(true);
    expect(players.every((player) => player.number !== 0)).toBe(true);
    for (const meta of squadIndex.filter((item) => earlyWorldCupYears.has(item.copa))) {
      const squad = readSquad(meta.slug).squad;
      const numbers = squad.map((player) => player.number).sort((left, right) => Number(left) - Number(right));
      expect(numbers).toEqual(Array.from({ length: squad.length }, (_, index) => index + 1));
      expect(squad.find((player) => player.number === 1)?.positions).toContain("GOL");
    }
    for (const group of earlyHighlightedRanges) {
      const squad = readSquad(findSquadMeta(group.sel, group.copa)!.slug).squad;
      const highlighted = squad.filter((player) => group.ids.includes(player.playerId));
      const forceValues = new Set(highlighted.map((player) => player.force));
      expect(highlighted).toHaveLength(group.ids.length);
      expect(forceValues.size).toBe(group.ids.length);
      expect(highlighted.every((player) => player.legend && player.force >= group.min && player.force <= group.max)).toBe(true);
    }
    const earlyRegulars = players.filter(
      (player) => earlyWorldCupYears.has(player.copa) && !earlyHighlightedKeys.has(`${player.sel}:${player.copa}:${player.playerId}`),
    );
    expect(earlyRegulars.every((player) => player.force >= 73 && player.force <= 86)).toBe(true);
  });
});

describe("game model", () => {
  it("uses deterministic rng for a seed", () => {
    const left = Array.from({ length: 5 }, () => rng("abc")());
    const right = Array.from({ length: 5 }, () => rng("abc")());
    expect(left).toEqual(right);
  });

  it("calculates attack, defense, and overall from slots", () => {
    const draft = createDraft("test", defaultOptions);
    draft.filled = formations["4-3-3"].equilibrado.map((slot, index) => ({
      playerId: `p${index}`,
      name: `P${index}`,
      sel: "BRA",
      copa: 1970,
      positions: [slot.pos],
      number: index + 1,
      force: 80 + index,
      legend: false,
    })) as Player[];
    expect(calculateStats(draft)).toEqual({ attack: 88, defense: 83, overall: 85 });
  });

  it("simulates a stable campaign result for the same seed and XI", () => {
    const draft = filledDraft();
    const first = simulateCampaign("fixed", draft, []);
    const second = simulateCampaign("fixed", draft, []);
    expect(second).toEqual(first);
    expect(first.campaign.length).toBeGreaterThan(0);
  });

  it("builds the showcase XI with each player's best World Cup version", () => {
    const draft = createShowcaseDraft("showcase-fixed");
    expect(draft.filled.map((player) => `${player?.sel}:${player?.copa}:${player?.playerId}`)).toEqual([
      "GER:2014:manuel-neuer",
      "BRA:1938:domingos-da-guia-bra-1938",
      "GER:1974:franz-beckenbauer",
      "ENG:1966:bobby-moore",
      "ITA:1998:paolo-maldini",
      "FRA:1982:michel-platini",
      "BRA:1970:pele",
      "ARG:1986:diego-maradona",
      "ARG:2022:lionel-messi",
      "BRA:2002:ronaldo",
      "BRA:1962:garrincha",
    ]);
    expect(draft.filled.every(Boolean)).toBe(true);
    expect(draft.rerollsLeft).toBe(0);
  });

  it("shows real opponent labels when opponent squads are loaded", () => {
    const opponent = readSquad("ITA-1970-8dc490d2");
    const draft = filledDraft();
    const result = simulateCampaign("fixed", draft, [opponent]);
    expect(result.tournament.teams.some((team) => team.label === "ITA 1970")).toBe(true);
    expect(result.campaign.every((match) => /^[A-Z]{3} \d{4}$/.test(match.opponent))).toBe(true);
  });

  it("falls back to real opponent labels without loaded squads", () => {
    const draft = filledDraft();
    const result = simulateCampaign("fixed", draft, []);
    expect(result.campaign[0]?.opponent).toMatch(/^[A-Z]{3} \d{4}$/);
    expect(result.campaign[0]?.opponent).not.toMatch(/Grupo|Oitavas|Quartas|Semifinal|Final/);
  });

  it("builds a 48-team tournament with 12 groups of four", () => {
    const result = simulateCampaign("fixed", filledDraft(), []);
    expect(result.tournament.teams).toHaveLength(48);
    expect(new Set(result.tournament.teams.map((team) => team.id))).toHaveLength(48);
    expect(result.tournament.groups.map((group) => group.group)).toEqual(groupLetters);
    expect(result.tournament.groups.every((group) => group.teamIds.length === 4)).toBe(true);
  });

  it("puts the user in one group with three known group opponents", () => {
    const result = simulateCampaign("fixed", filledDraft(), []);
    const userGroups = result.tournament.groups.filter((group) => group.teamIds.includes(result.tournament.userTeamId));
    const userGroup = userGroups[0]!;
    const groupOpponents = userGroup.teamIds.filter((teamId) => teamId !== result.tournament.userTeamId);
    const userGroupMatches = result.tournament.matches.filter((match) => match.stage === "GROUP" && match.isUserMatch);
    expect(userGroups).toHaveLength(1);
    expect(groupOpponents).toHaveLength(3);
    expect(userGroupMatches).toHaveLength(3);
  });

  it("generates 72 group matches across three matchdays", () => {
    const result = simulateCampaign("fixed", filledDraft(), []);
    const groupMatches = result.tournament.matches.filter((match) => match.stage === "GROUP");
    expect(groupMatches).toHaveLength(72);
    expect(new Set(groupMatches.map((match) => match.matchday))).toEqual(new Set([1, 2, 3]));
    expect([1, 2, 3].map((matchday) => groupMatches.filter((match) => match.matchday === matchday).length)).toEqual([24, 24, 24]);
  });

  it("qualifies 24 top-two teams and eight third-placed teams", () => {
    const result = simulateCampaign("fixed", filledDraft(), []);
    const qualified = result.tournament.groups.flatMap((group) => group.standings.filter((row) => row.qualified));
    const topTwo = qualified.filter((row) => row.rank <= 2);
    const thirds = qualified.filter((row) => row.rank === 3);
    expect(qualified).toHaveLength(32);
    expect(topTwo).toHaveLength(24);
    expect(thirds).toHaveLength(8);
    expect(result.tournament.qualifiedThirdGroups).toHaveLength(8);
  });

  it("places the eight qualified third-place teams in the Round of 32 assignments", () => {
    const result = simulateCampaign("fixed", filledDraft(), []);
    const thirdTeamIds = new Set(result.tournament.groups.map((group) => group.standings[2]!.teamId));
    const qualifiedThirdTeamIds = new Set(
      result.tournament.groups
        .flatMap((group) => group.standings)
        .filter((row) => row.rank === 3 && row.qualified)
        .map((row) => row.teamId),
    );
    const assignedGroups = Object.values(result.tournament.thirdPlaceAssignments);
    const assignedThirds = result.tournament.matches
      .filter((match) => match.stage === "ROUND_OF_32")
      .flatMap((match) => [match.homeTeamId, match.awayTeamId])
      .filter((teamId) => thirdTeamIds.has(teamId));

    expect(Object.keys(result.tournament.thirdPlaceAssignments).sort()).toEqual(["1A", "1B", "1D", "1E", "1G", "1I", "1K", "1L"]);
    expect(new Set(assignedGroups)).toEqual(new Set(result.tournament.qualifiedThirdGroups));
    expect(assignedThirds).toHaveLength(8);
    expect(new Set(assignedThirds)).toEqual(qualifiedThirdTeamIds);
  });

  it("generates the full knockout bracket including third place and final", () => {
    const result = simulateCampaign("fixed", filledDraft(), []);
    expect(matchCount(result, "ROUND_OF_32")).toBe(16);
    expect(matchCount(result, "ROUND_OF_16")).toBe(8);
    expect(matchCount(result, "QUARTERFINAL")).toBe(4);
    expect(matchCount(result, "SEMIFINAL")).toBe(2);
    expect(matchCount(result, "THIRD_PLACE")).toBe(1);
    expect(matchCount(result, "FINAL")).toBe(1);
    expect(result.tournament.bracket.thirdPlace).toBe(103);
    expect(result.tournament.bracket.final).toBe(104);
  });

  it("adds named penalty takers to shootouts", () => {
    const opponents = squadIndex.slice(0, 47).map((meta) => readSquad(meta.slug));
    const draft = filledDraft();
    let shootout = null as ReturnType<typeof simulateCampaign>["campaign"][number] | null;
    for (let index = 0; index < 1500 && !shootout; index += 1) {
      shootout = simulateCampaign(`pens-${index}`, draft, opponents).campaign.find((match) => Boolean(match.penalties)) ?? null;
    }
    expect(shootout?.penalties?.meNames?.length).toBeGreaterThan(0);
    expect(shootout?.penalties?.themNames?.length).toBeGreaterThan(0);
  });

  it("builds a stable eight-game online campaign", () => {
    const draft = filledDraft("online-fixed");
    const first = createOnlineCampaign("online-fixed", draft);
    const second = createOnlineCampaign("online-fixed", draft);

    expect(first).toHaveLength(8);
    expect(second).toEqual(first);
    first.forEach((match, index) => {
      expect(match.index).toBe(index);
      expect(match.opponentSel).toMatch(/^[A-Z]{3}$/);
      expect(match.opponentCopa).toBeGreaterThanOrEqual(1930);
      expect(match.opponentOverall).toBeGreaterThan(0);
      expect(match.gf).toBeGreaterThanOrEqual(0);
      expect(match.ga).toBeGreaterThanOrEqual(0);
      expect(typeof match.won).toBe("boolean");
      expect(match.goals).toHaveLength(match.gf + match.ga);
      expect(match.goals.every((goal) => goal.side === "me" || goal.side === "them")).toBe(true);
      if (match.gf === match.ga) {
        expect(match.penalties).toBeDefined();
        const [mePens, themPens] = match.penalties!.score.split("-").map(Number);
        expect(mePens).not.toBe(themPens);
        expect(match.won).toBe((mePens ?? 0) > (themPens ?? 0));
      } else {
        expect(match.penalties).toBeUndefined();
        expect(match.won).toBe(match.gf > match.ga);
      }
    });
  });
});
