/** Type declarations for file-view.mjs (lane <open_file_view>: porzioni di file inline finché il modello chiude). */
import type { VarsQueue } from "./vars-queue.mjs";

export const FILEVIEW_NS: string;
export const DEFAULT_VIEW_LINES: number;
export const MAX_VIEW_LINES: number;
export const MAX_VIEW_CHARS: number;
/** Default del cap (SSOT: lane-defaults). Il valore EFFETTIVO viene da cfg.maxOpenFileViews: passalo come `maxOpen`. */
export const MAX_OPEN_VIEWS: number;

export interface FileView {
  path: string;
  start: number;
  end: number;
  content: string;
  truncated: boolean;
  totalLines: number;
  ts: number;
}

export type OpenResult =
  | { ok: true; path: string; start: number; end: number; shown: number; truncated: boolean; totalLines: number }
  | { ok: false; reason: "too-many-open" | "empty" | "bad-range"; open: string[]; message: string };

export function listFileViews(vq: VarsQueue): FileView[];
export function viewKey(path: string): string;
export function openFileView(
  vq: VarsQueue,
  opts: { path: string; fileLines: string[]; startLine?: number; lines?: number; now?: number; maxOpen?: number },
): OpenResult;
export function closeFileView(vq: VarsQueue, path: string): { ok: boolean; path: string; message: string };
export function closeAllFileViews(vq: VarsQueue): number;
export function fileViewLaneLines(vq: VarsQueue, opts?: { esc?: (s: string) => string; maxOpen?: number }): string[];

declare const _default: {
  FILEVIEW_NS: string;
  DEFAULT_VIEW_LINES: number;
  MAX_VIEW_LINES: number;
  MAX_VIEW_CHARS: number;
  MAX_OPEN_VIEWS: number;
  listFileViews: typeof listFileViews;
  openFileView: typeof openFileView;
  closeFileView: typeof closeFileView;
  closeAllFileViews: typeof closeAllFileViews;
  fileViewLaneLines: typeof fileViewLaneLines;
  viewKey: typeof viewKey;
};
export default _default;
