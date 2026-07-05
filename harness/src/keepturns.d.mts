import type { VarsQueue } from "./vars-queue.mjs";

export const KEEPTURNS_MAX: number;
export const KEEPTURNS_OVERRIDE_META: string;

export function getEffectiveKeepTurns(vq: VarsQueue, configDefault?: number | null): number;
export function setKeepTurnsOverride(
  vq: VarsQueue,
  n: number | null,
): { effective: number; overridden: boolean; def: number };
