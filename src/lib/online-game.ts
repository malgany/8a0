import type { Draft, PenaltyResult, Player } from "./types";
import { calculateStats, rng, squadFiles, squadIndex } from "./game";

export type OnlineGoal = { minute: number; name: string; side: "me" | "them" };

export type OnlineTeamProfile = {
  name: string;
  flagPixels: Array<string | null>;
};

export type OnlineCampaignMatch = {
  index: number;
  attempt: number;
  opponentSel: string;
  opponentCopa: number;
  opponentOverall: number;
  gf: number;
  ga: number;
  won: boolean;
  penalties?: PenaltyResult;
  goals: OnlineGoal[];
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
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

function lambda(attack: number, defense: number) {
  return clamp(1.35 + (attack - defense) * 0.07, 0.2, 4.8);
}

function squadOverall(players: Player[]) {
  if (!players.length) return 74;
  const top = [...players].sort((left, right) => right.force - left.force).slice(0, 11);
  return Math.round(top.reduce((total, player) => total + player.force, 0) / top.length);
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

function createPenalties(random: () => number, won: boolean, meSquad: Player[], themSquad: Player[]): PenaltyResult {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const me = Array.from({ length: 5 }, () => +(random() < 0.78));
    const them = Array.from({ length: 5 }, () => +(random() < 0.78));
    const meScore = sum(me);
    const themScore = sum(them);
    const winnerScore = won ? meScore : themScore;
    const loserScore = won ? themScore : meScore;
    if (winnerScore > loserScore) {
      const cutoff = penaltyShootoutCutoff(me, them);
      return {
        score: `${meScore}-${themScore}`,
        me: me.slice(0, cutoff.meCount),
        them: them.slice(0, cutoff.themCount),
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
          const winnerKick = +won;
          const loserKick = +!won;
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
        const winnerKick = +won;
        const loserKick = +!won;
        sdMe.push(winnerKick);
        sdThem.push(loserKick);
        liveMeScore += winnerKick;
        liveThemScore += loserKick;
      }
      return {
        score: `${liveMeScore}-${liveThemScore}`,
        me,
        them,
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
  return won
    ? { score: "1-0", me: [1], them: [0], meNames: penaltyTakerNames(meSquad, 1), themNames: penaltyTakerNames(themSquad, 1) }
    : { score: "0-1", me: [0], them: [1], meNames: penaltyTakerNames(meSquad, 1), themNames: penaltyTakerNames(themSquad, 1) };
}

function goalScorers(random: () => number, players: Player[], goals: number) {
  if (goals <= 0) return [];
  const fallback = ["Jogador"];
  const pool = players.length ? players : [];
  const weights = pool.map((player) => {
    if (player.positions.includes("GOL")) return player.force * 0.02;
    if (player.positions.some((position) => ["PD", "PE", "CA"].includes(position))) return player.force * 1.2;
    if (player.positions.some((position) => ["MEI", "MC", "MD", "ME"].includes(position))) return player.force * 0.7;
    return player.force * 0.25;
  });
  return Array.from({ length: goals }, () => {
    if (!pool.length) return fallback[0]!;
    const total = weights.reduce((sum, weight) => sum + weight, 0);
    let marker = random() * total;
    let index = 0;
    for (; index < weights.length - 1; index += 1) {
      marker -= weights[index] ?? 0;
      if (marker <= 0) break;
    }
    weights[index] = (weights[index] ?? 0) * 0.45;
    return pool[index]?.name ?? fallback[0]!;
  });
}

function goalTimeline(random: () => number, me: string[], them: string[]): OnlineGoal[] {
  const usedMinutes = new Set<number>();
  return [
    ...me.map((name) => ({ name, side: "me" as const })),
    ...them.map((name) => ({ name, side: "them" as const })),
  ]
    .map((goal) => {
      let minute = 1 + Math.floor(90 * Math.pow(random(), 0.86));
      while (usedMinutes.has(minute)) minute = Math.min(90, minute + 1);
      usedMinutes.add(minute);
      return { minute, ...goal };
    })
    .sort((left, right) => left.minute - right.minute);
}

export function createOnlineCampaignMatch(seed: string, draft: Draft, meta: { sel: string; copa: number }, index: number, attempt = 0): OnlineCampaignMatch {
  const selected = draft.filled.filter(Boolean) as Player[];
  const userStats = calculateStats(draft);
  const squad = squadFiles.find((item) => item.sel === meta.sel && item.copa === meta.copa);
  const opponentPlayers = squad?.squad ?? [];
  const opponentOverall = squadOverall(opponentPlayers);
  const tiltRandom = rng(`${seed}:online:tilt:${meta.sel}:${meta.copa}:${attempt}`);
  const tilt = Math.round((tiltRandom() - 0.5) * 8);
  const retryBoost = Math.min(18, attempt * 6);
  const opponentAttack = clamp(opponentOverall + tilt, 45, 99);
  const opponentDefense = clamp(opponentOverall - tilt, 45, 99);
  const scoreRandom = rng(`${seed}:online:score:${index}:${attempt}`);
  const gf = poisson(scoreRandom, lambda(userStats.attack + retryBoost, opponentDefense));
  const ga = poisson(scoreRandom, lambda(opponentAttack, userStats.defense + retryBoost));
  const scorerRandom = rng(`${seed}:online:goals:${index}:${attempt}`);
  const meScorers = goalScorers(scorerRandom, selected, gf);
  const themScorers = goalScorers(scorerRandom, opponentPlayers, ga);
  const goals = goalTimeline(rng(`${seed}:online:minutes:${index}:${attempt}`), meScorers, themScorers);
  let won = gf > ga;
  let penalties: PenaltyResult | undefined;
  if (gf === ga) {
    const penaltyRandom = rng(`${seed}:online:pen:${index}:${attempt}`);
    const winChance = clamp(0.5 + (userStats.overall + retryBoost - opponentOverall) / 70, 0.24, 0.82);
    won = penaltyRandom() < winChance;
    penalties = createPenalties(penaltyRandom, won, selected, opponentPlayers);
  }
  return {
    index,
    attempt,
    opponentSel: meta.sel,
    opponentCopa: meta.copa,
    opponentOverall,
    gf,
    ga,
    won,
    penalties,
    goals,
  };
}

export function createOnlineCampaign(seed: string, draft: Draft): OnlineCampaignMatch[] {
  const selected = draft.filled.filter(Boolean) as Player[];
  const selectedKeys = new Set(selected.map((player) => `${player.sel}:${player.copa}`));
  const random = rng(`${seed}:online:opponents`);
  const metas = [...squadIndex];
  const campaignMetas = [];
  const used = new Set(selectedKeys);

  while (campaignMetas.length < 8) {
    const pool = metas.filter((meta) => !used.has(`${meta.sel}:${meta.copa}`));
    const source = pool.length ? pool : metas;
    const meta = source[Math.floor(random() * source.length)]!;
    const key = `${meta.sel}:${meta.copa}`;
    used.add(key);
    campaignMetas.push(meta);
  }

  return campaignMetas.map((meta, index) => createOnlineCampaignMatch(seed, draft, meta, index));
}
