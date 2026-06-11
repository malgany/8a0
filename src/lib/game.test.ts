import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  calculateStats,
  createDraft,
  defaultOptions,
  formations,
  rng,
  simulateCampaign,
  squadIndex,
} from "./game";
import type { Player, SquadFile } from "./types";

function readSquad(slug: string): SquadFile {
  return JSON.parse(readFileSync(path.join(process.cwd(), "public", "squads", `${slug}.json`), "utf8")) as SquadFile;
}

describe("7a0 dataset", () => {
  it("keeps the mirrored squad index and squad files aligned", () => {
    const files = readdirSync(path.join(process.cwd(), "public", "squads")).filter((file) => file.endsWith(".json"));
    expect(squadIndex).toHaveLength(250);
    expect(files).toHaveLength(250);
    const players = squadIndex.flatMap((meta) => readSquad(meta.slug).squad);
    expect(players).toHaveLength(5613);
    expect(players.every((player) => player.playerId && player.name && player.positions.length > 0)).toBe(true);
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
    const squad = readSquad("BRA-1970-43aa9180");
    const draft = createDraft("fixed", defaultOptions);
    draft.filled = squad.squad.slice(0, 11);
    const first = simulateCampaign("fixed", draft, []);
    const second = simulateCampaign("fixed", draft, []);
    expect(second).toEqual(first);
    expect(first.campaign.length).toBeGreaterThan(0);
  });
});
