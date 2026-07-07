/** Type declarations for state-db.mjs (connessioni DB condivise singleton per-path + SSOT path/agent). */
import type { VarsQueue } from "./vars-queue.mjs";
import type { ConversationStore } from "./conversation-store.mjs";
import type { ToolCallStore } from "./tool-call-store.mjs";

export const VARS_DB_PATH: string;
export const CONV_DB_PATH: string;
export const TOOLCALL_DB_PATH: string;
export const ORCHESTRATOR_AGENT: string;

export function getVarsQueue(dbPath?: string, opts?: { agent?: string }): VarsQueue;
export function getConversationStore(dbPath?: string, opts?: { agent?: string }): ConversationStore;
export function getToolCallStore(dbPath?: string): ToolCallStore;
export function closeAll(): void;

declare const _default: {
  getVarsQueue: typeof getVarsQueue;
  getConversationStore: typeof getConversationStore;
  getToolCallStore: typeof getToolCallStore;
  closeAll: typeof closeAll;
  VARS_DB_PATH: string;
  CONV_DB_PATH: string;
  TOOLCALL_DB_PATH: string;
  ORCHESTRATOR_AGENT: string;
};
export default _default;
