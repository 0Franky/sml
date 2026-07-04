/** Type declarations for eviction-checkpoint.mjs (NEW-A: rete di sicurezza fatti-durevoli in eviction). */

export const EVICTION_RUNGS: string[];

export function loadEvictionConfig(env?: Record<string, string | undefined>): { rung: string; enabled: boolean };

export function evictionEvent(args: {
  userTurnCount: number;
  keepTurns: number;
  lastEvictedOrdinal?: number;
}): { evictedThrough: number; newlyEvicted: number[] };

export function summarizeEvicting(
  turns: Array<{ ordinal?: number; role?: string; text?: string }>,
  opts?: { maxCharsPerTurn?: number; maxTurns?: number },
): string;

export function buildEvictionDirective(rung: string, opts?: { digest?: string }): string;

export function buildOobPrompt(opts?: { digest?: string }): Array<{ role: string; content: string }>;

export function parseOobSave(responseText: string): Array<{ text: string }>;

export function extractChatText(data: unknown): string;

export function callModelOutOfBand(args: {
  endpoint: string;
  model?: string;
  messages: Array<{ role: string; content: string }>;
  apiKey?: string;
  fetchImpl?: (...args: any[]) => any;
  timeoutMs?: number;
}): Promise<{ ok: boolean; text?: string; saves?: Array<{ text: string }>; error?: string }>;
