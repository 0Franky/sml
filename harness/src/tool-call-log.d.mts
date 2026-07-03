/** Type declarations for tool-call-log.mjs — ring buffer delle ultime tool-call (lane <last_tool_calls>). */
export interface ToolCallEntry {
  callId: string | null;
  name: string;
  args: string;
  status: "pending" | "ok" | "error";
  result: string;
}
export function summarizeArgs(args: unknown): string;
export function recordCall(entry: { callId?: string | null; name: string; args?: unknown }): void;
export function recordResult(entry: { callId?: string | null; isError?: boolean; text?: string }): void;
export function getRecent(n?: number): ToolCallEntry[];
export function formatLane(n?: number, opts?: { redact?: (s: string) => string }): string;
export function clearToolCallLog(): void;

declare const _default: {
  summarizeArgs: typeof summarizeArgs;
  recordCall: typeof recordCall;
  recordResult: typeof recordResult;
  getRecent: typeof getRecent;
  formatLane: typeof formatLane;
  clearToolCallLog: typeof clearToolCallLog;
};
export default _default;
