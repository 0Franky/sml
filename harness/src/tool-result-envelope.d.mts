export interface ToolResultMeta {
  name?: string | null;
  callId?: string | null;
  status?: "ok" | "error";
  at?: string | null;
  bytes?: number;
}

export function formatToolResultHeader(meta?: ToolResultMeta): string;
export function wrapToolResultText(text: string, meta?: ToolResultMeta): string;
export function frameToolResultsInMessages<T = any>(messages: T[], opts?: { now?: string }): T[];

declare const _default: {
  formatToolResultHeader: typeof formatToolResultHeader;
  wrapToolResultText: typeof wrapToolResultText;
  frameToolResultsInMessages: typeof frameToolResultsInMessages;
};
export default _default;
