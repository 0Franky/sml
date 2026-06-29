/** Type declarations for state-db.mjs (connessioni DB condivise singleton per-path). */
import type { VarsQueue } from "./vars-queue.mjs";
import type { ConversationStore } from "./conversation-store.mjs";

export function getVarsQueue(dbPath?: string, opts?: { agent?: string }): VarsQueue;
export function getConversationStore(dbPath?: string, opts?: { agent?: string }): ConversationStore;
export function closeAll(): void;

declare const _default: {
  getVarsQueue: typeof getVarsQueue;
  getConversationStore: typeof getConversationStore;
  closeAll: typeof closeAll;
};
export default _default;
