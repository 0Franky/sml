import type { VarsQueue } from "./vars-queue.mjs";

export const KEEPTURNS_MAX: number;
export const KEEPTURNS_OVERRIDE_META: string;

export function getEffectiveKeepTurns(vq: VarsQueue, configDefault?: number | null): number;
export function adaptiveKeepTurns(
  usage: { tokens?: number | null; contextWindow?: number | null } | undefined,
  cfg: { lowThreshold: number; highKeep: number; safetyPct?: number; avgTurnTokens?: number },
  lowKeep: number,
  outputReservePct?: number,
): number;
export function setKeepTurnsOverride(
  vq: VarsQueue,
  n: number | null,
): { effective: number; overridden: boolean; def: number };
