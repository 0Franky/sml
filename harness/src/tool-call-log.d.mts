/** Type declarations for tool-call-log.mjs — ring buffer delle ultime tool-call (lane <last_tool_calls>). */
export interface ToolCallEntry {
  seq: number;
  callId: string | null;
  name: string;
  args: string;
  status: "pending" | "ok" | "error";
  result: string;
  ts: number;
}
export interface RingStats {
  buffered: number;
  minSeq: number;
  maxSeq: number;
  totalSeen: number;
  cap: number;
  dropped: number;
}
export interface RenderRowOpts { redact?: (s: string) => string; sessionStartMs?: number | null; withSeq?: boolean }
export function summarizeArgs(args: unknown): string;
export function recordCall(entry: { callId?: string | null; name: string; args?: unknown; ts?: number; seq?: number }): number;
export function recordResult(entry: { callId?: string | null; isError?: boolean; text?: string }): void;
export function getRecent(n?: number): ToolCallEntry[];
export function formatLane(n?: number, opts?: { redact?: (s: string) => string; sessionStartMs?: number | null; excludeMemoryOps?: boolean }): string;
export function ringStats(opts?: { excludeMemoryOps?: boolean }): RingStats;
export function viewRange(opts?: { from?: number; to?: number; count?: number; includeMemoryOps?: boolean; redact?: (s: string) => string; sessionStartMs?: number | null }): string;
export function renderCallRows(rows: Array<Partial<ToolCallEntry>>, opts?: RenderRowOpts): string;
export function clearToolCallLog(): void;

declare const _default: {
  summarizeArgs: typeof summarizeArgs;
  recordCall: typeof recordCall;
  recordResult: typeof recordResult;
  getRecent: typeof getRecent;
  formatLane: typeof formatLane;
  ringStats: typeof ringStats;
  viewRange: typeof viewRange;
  renderCallRows: typeof renderCallRows;
  clearToolCallLog: typeof clearToolCallLog;
};
export default _default;
