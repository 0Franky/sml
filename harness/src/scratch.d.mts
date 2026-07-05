import type { VarsQueue } from "./vars-queue.mjs";

export const SCRATCH_NS: string;
export const DEFAULT_MAX_SCRATCH: number;
export const SCRATCH_STORE_CAP: number;

export interface ScratchEntry {
  key: string;
  text: string;
  ts: number;
}

export function listScratch(vq: VarsQueue): ScratchEntry[];
export function jotScratch(
  vq: VarsQueue,
  text: string,
  opts: { key: string; now?: number; storeCap?: number },
): { key: string; pruned: number };
export function pruneScratch(vq: VarsQueue, opts?: { storeCap?: number }): number;
export function recallScratch(vq: VarsQueue, opts?: { limit?: number }): ScratchEntry[];
export function clearScratch(vq: VarsQueue): number;
