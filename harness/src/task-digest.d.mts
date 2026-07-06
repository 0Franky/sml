/** Type declarations for task-digest.mjs — cattura deterministica della task-history (F24/F25). */

export const MEMORY_TOOLS: Set<string>;
export const READONLY_TOOLS: Set<string>;
export const TASK_FACT_PREFIX: string;
export const TASK_FACT_IMPORTANCE: number;

export function pathOf(args: unknown): string | null;
export function contentOf(args: unknown): string | null;
export function extractDefs(content: unknown): string[];

export function buildTaskDigest(
  toolCalls: Array<{ name?: string; args?: object; status?: string; result?: string; ts?: number }>,
  opts?: { maxLines?: number; maxDefsPerFile?: number },
): string[];

export function digestFactFromCall(
  call?: { name?: string; args?: object; status?: string },
): { key: string; text: string; importance: number } | null;

declare const _default: {
  buildTaskDigest: typeof buildTaskDigest;
  digestFactFromCall: typeof digestFactFromCall;
  extractDefs: typeof extractDefs;
  pathOf: typeof pathOf;
  contentOf: typeof contentOf;
  MEMORY_TOOLS: typeof MEMORY_TOOLS;
  READONLY_TOOLS: typeof READONLY_TOOLS;
  TASK_FACT_PREFIX: typeof TASK_FACT_PREFIX;
  TASK_FACT_IMPORTANCE: typeof TASK_FACT_IMPORTANCE;
};
export default _default;
