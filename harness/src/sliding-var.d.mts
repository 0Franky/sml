/** Type declarations for sliding-var.mjs (read/replace VAR per char-range + preview). */
import type { VarsQueue } from "./vars-queue.mjs";

export interface SlidingReadResult {
  var_id: string;
  requested_range: [number, number];
  content: string;
  context_before: string;
  context_after: string;
  var_total_length: number;
}
export interface SlidingReplaceResult {
  var_id: string;
  preview: string;
  diff_summary: string;
  applied: boolean;
  new_total_length: number;
}
export function slidingRead(
  vq: VarsQueue, varId: string, start: number, end: number, contextAround?: number,
): SlidingReadResult | { error: string };
export function slidingReplace(
  vq: VarsQueue, varId: string, start: number, end: number, newContent: string,
  opts?: { contextAround?: number; previewOnly?: boolean; who?: string },
): SlidingReplaceResult | { error: string };
