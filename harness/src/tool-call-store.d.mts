/** Type declarations for tool-call-store.mjs (tool-call persistite e queryable — recovery oltre il ring-24, F28). */

export interface ToolCallRow {
  seq: number;
  callId: string | null;
  name: string;
  args: string;
  status: "pending" | "ok" | "error";
  result: string;
  ts: number;
}
export interface ToolCallStoreStats { total: number; minSeq: number; maxSeq: number }
export interface ToolCallViewOpts {
  from?: number;
  to?: number;
  count?: number;
  includeMemoryOps?: boolean;
  redact?: (s: string) => string;
  sessionStartMs?: number | null;
}

export class ToolCallStore {
  constructor(dbPath?: string);
  close(): void;
  append(convId: string, entry: { callId?: string | null; name: string; args?: string; status?: string; result?: string; ts?: number }): number;
  setResult(convId: string, entry: { callId?: string | null; isError?: boolean; result?: string }): boolean;
  range(convId: string, fromSeq: number, toSeq: number): ToolCallRow[];
  recent(convId: string, n?: number): ToolCallRow[];
  stats(convId: string): ToolCallStoreStats;
  view(convId: string, opts?: ToolCallViewOpts): string;
}

declare const _default: typeof ToolCallStore;
export default _default;
