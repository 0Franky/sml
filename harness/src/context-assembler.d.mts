/** Type declarations for context-assembler.mjs (assembla <context> dalle lane del vars-queue). */
import type { VarsQueue } from "./vars-queue.mjs";
import type { ConversationStore } from "./conversation-store.mjs";

export interface AssembleOpts {
  sinceMs?: number;
  maxChanges?: number;
  includePrivateVars?: boolean;
  now?: number;
  absoluteTimestamps?: boolean;
  maxTasks?: number;
  maxVars?: number;
}

export function assembleContext(vq: VarsQueue, opts?: AssembleOpts): string;

export function buildResumeDigest(vq: VarsQueue, opts?: { now?: number; resumeGapMs?: number; force?: boolean }): string;

export interface BuildWorkspaceOpts extends AssembleOpts {
  store?: ConversationStore;
  convId?: string;
  messagesN?: number;
  messagesCharCap?: number;
  resumeGapMs?: number;
  forceResume?: boolean;
}
export function buildWorkspace(vq: VarsQueue, opts?: BuildWorkspaceOpts): string;

export default assembleContext;
