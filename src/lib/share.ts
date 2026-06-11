import type { Draft, Player, SharePayload } from "./types";
import { defaultOptions } from "./game";

function base64UrlEncode(value: string) {
  if (typeof window === "undefined") {
    return Buffer.from(value, "utf8").toString("base64url");
  }
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function base64UrlDecode(value: string) {
  if (typeof window === "undefined") {
    return Buffer.from(value, "base64url").toString("utf8");
  }
  const padded = value.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function encodeSharePayload(payload: SharePayload) {
  return base64UrlEncode(JSON.stringify(payload));
}

export function decodeSharePayload(code: string): SharePayload | null {
  try {
    const parsed = JSON.parse(base64UrlDecode(code)) as SharePayload;
    if (parsed?.v !== 1 || !Array.isArray(parsed.xi)) return null;
    return {
      v: 1,
      seed: parsed.seed || "shared",
      formation: parsed.formation || defaultOptions.formation,
      style: parsed.style || defaultOptions.style,
      mode: parsed.mode || defaultOptions.mode,
      xi: parsed.xi,
    };
  } catch {
    return null;
  }
}

export function draftToSharePayload(draft: Draft): SharePayload {
  return {
    v: 1,
    seed: draft.seed,
    formation: draft.options.formation,
    style: draft.options.style,
    mode: draft.options.mode,
    xi: draft.filled
      .map((player, slot) => ({ player, slot }))
      .filter((item): item is { player: Player; slot: number } => item.player !== null)
      .map(({ player, slot }) => ({
        sel: player.sel,
        copa: player.copa,
        playerId: player.playerId,
        slot,
      })),
  };
}

export function compactSlug(input: string) {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36).padStart(7, "0");
}
