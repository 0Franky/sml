/** Type declarations for var-ops.mjs (operazioni sulle var per riferimento — extract/interpolate/canale). */
import type { VarsQueue } from "./vars-queue.mjs";

export type PathResult = { ok: true; value: unknown } | { ok: false; error: string };
export type ExtractResult = { ok: true; dest: string; value: unknown } | { ok: false; error: string };
export interface EmitResult { text: string; interpolated: boolean; secretHit: boolean; }

export function parsePath(path: string): string[];
export function getByPath(obj: unknown, path: string): PathResult;
export function extractVar(
  vq: VarsQueue,
  src: string,
  path: string,
  dest: string,
  opts?: { scope?: "private" | "shared"; namespace?: string; who?: string; decisionRef?: string | null },
): ExtractResult;
export function interpolate(text: string, vq: VarsQueue): string;
export function emitToUser(
  text: string,
  vq: VarsQueue,
  opts?: { dynamicSecrets?: Iterable<string>; interpolate?: boolean },
): EmitResult;

declare const _default: {
  parsePath: typeof parsePath;
  getByPath: typeof getByPath;
  extractVar: typeof extractVar;
  interpolate: typeof interpolate;
  emitToUser: typeof emitToUser;
};
export default _default;
