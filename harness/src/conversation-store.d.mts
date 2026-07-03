/** Type declarations for conversation-store.mjs (conversazione persistita per ID + lane messages_with_user). */

export interface ConversationTurn {
  seq: number;
  role: string;
  text: string;
  ts: number;
}

export class ConversationStore {
  agent: string;
  constructor(dbPath?: string, opts?: { agent?: string });
  close(): void;
  append(convId: string, role: string, text: string, opts?: { ts?: number }): number;
  count(convId: string, opts?: { afterSeq?: number; untilSeq?: number | null }): number;
  window(convId: string, n?: number, opts?: { afterSeq?: number; untilSeq?: number | null }): ConversationTurn[];
  nthLastUserSeq(convId: string, k: number, opts?: { afterSeq?: number }): number | null;
  lastSeq(convId: string): number;
  range(convId: string, fromSeq: number, toSeq: number): ConversationTurn[];
  all(convId: string): ConversationTurn[];
}

export function isGenuineUserInput(event?: { text?: unknown; source?: string; streamingBehavior?: string }): boolean;

export function buildMessagesLane(store: ConversationStore, convId: string, opts?: { n?: number; charCap?: number; afterSeq?: number; excludeCurrentTurn?: boolean; nativeKeepTurns?: number }): string;

export function windowNativeMessages<T extends { role?: string }>(messages: T[], opts?: { keepTurns?: number }): T[];

export default ConversationStore;
