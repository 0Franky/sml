/** Type declarations for vars-queue.mjs (datastore SQLite 4-lane + cross-session/cross-agent). */

export interface VarRecord {
  id: string;
  value: unknown;
  scope: "private" | "shared";
  namespace: string;
  last_modified: number;
  last_modified_by: string | null;
  decision_ref: string | null;
}

export interface TaskRecord {
  id: string;
  title: string;
  status: string;
  payload: unknown;
  created: number;
  updated: number;
  updated_by: string | null;
}

export interface ChangeLogEntry {
  seq: number;
  ts: number;
  who: string | null;
  entity: string;
  entity_id: string | null;
  field: string | null;
  old_value: string | null;
  new_value: string | null;
  decision_ref: string | null;
  silent?: number;
}

export interface Proposal {
  seq: number;
  ts: number;
  agent: string;
  var_id: string;
  value: unknown;
  applied: number;
}

export interface RuleRecord { id: string; text: string; severity: string; created: number; }
export interface VerificationRecord { id: string; task_id: string; status: string; detail: string | null; created: number; }

export interface SetVarOpts { scope?: "private" | "shared"; namespace?: string; who?: string; decisionRef?: string | null; }
export interface WhoOpt { who?: string; }

export class VarsQueue {
  agent: string;
  constructor(dbPath?: string, opts?: { agent?: string });
  close(): void;

  // change-log
  getChangeLog(opts?: { since?: number; entity?: string | null; entityId?: string | null; limit?: number; includeSilent?: boolean }): ChangeLogEntry[];
  gcChangeLog(beforeTs: number): number;

  // VARS
  setVar(id: string, value: unknown, opts?: SetVarOpts): VarRecord;
  getVar(id: string): VarRecord | null;
  listVars(opts?: { scope?: string | null; namespace?: string | null }): VarRecord[];
  gcVars(beforeTs: number, opts?: { scope?: string | null }): number;

  // cross-agent
  getSharedView(): VarRecord[];
  proposeVar(varId: string, value: unknown, opts?: { agent?: string }): void;
  pendingProposals(): Proposal[];
  mergeProposals(resolve?: (prop: Proposal, current: VarRecord | null) => boolean): number;

  // TASKS
  addTask(id: string, title: string, opts?: { payload?: unknown; who?: string }): TaskRecord;
  getTask(id: string): TaskRecord | null;
  setTaskStatus(id: string, status: string, opts?: WhoOpt): TaskRecord;
  listTasks(opts?: { status?: string | null }): TaskRecord[];

  // VERIFICATIONS
  addVerification(id: string, taskId: string, opts?: { detail?: string | null; who?: string }): string;
  setVerificationStatus(id: string, status: string, opts?: WhoOpt): void;
  listVerifications(opts?: { status?: string | null }): VerificationRecord[];

  // RULES
  addRule(id: string, text: string, opts?: { severity?: string; who?: string }): void;
  listRules(): RuleRecord[];

  // CURR
  setCurr(taskId: string, opts?: WhoOpt): void;
  getCurr(): string | null;
}

export default VarsQueue;
