/** Type declarations for context-assembler.mjs (assembla <context> dalle lane del vars-queue). */
import type { VarsQueue } from "./vars-queue.mjs";
import type { ConversationStore } from "./conversation-store.mjs";
import type { SecretMeta } from "./sealed-secrets.d.mts";

export interface AssembleOpts {
  sinceMs?: number;
  maxChanges?: number;
  includePrivateVars?: boolean;
  now?: number;
  absoluteTimestamps?: boolean;
  maxTasks?: number;
  maxVars?: number;
  /** matrioska/nested-compact: se presente, la <task_list> è filtrata a questo subset di task id. */
  focusTaskIds?: (string | number)[] | null;
  /** inventario sealed-secrets (nomi+sink+flag, MAI valori) per la lane <secrets> — passato da context-assembly.ts. */
  secrets?: SecretMeta[];
  /** ANCHOR EPISTEMICO: se true, emette `<current_date>YYYY-MM-DD</current_date>` (granularità giorno, cache-stable)
   *  come prima riga del prefisso. È il FATTO-data (F, CLAUDE.md #11); il ragionamento di recency è la skill di training. */
  currentDate?: boolean;
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

export function buildAimTail(vq: VarsQueue): string;
export function buildExecutionOrderLines(tasks: any[], structured: boolean): string[];

export default assembleContext;
