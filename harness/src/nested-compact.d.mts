/** Type declarations for nested-compact.mjs (orchestrazione matrioska del context). */
import type { VarsQueue, FocusFrameRecord, TaskRecord, DecisionRecord, RuleRecord, VarRecord } from "./vars-queue.mjs";
import type { ConversationStore } from "./conversation-store.mjs";

export type PressureLevel = "none" | "reorder" | "matrioska";

export interface NestedCfg {
  tokenReorderPct: number;
  tokenMatrioskaPct: number;
  watchReorder: number;
  watchMatrioska: number;
  focusK: number;
  maxDepth: number;
  cooldownMs: number;
}
export const DEFAULT_CFG: NestedCfg;

export interface Metrics {
  openTasks: number;
  pendingVerifs: number;
  sharedVars: number;
  recentChanges: number;
  watchCount: number;
  percent: number | null;
}

export interface Frame {
  aim: TaskRecord | null;
  decisions: DecisionRecord[];
  constraints: RuleRecord[];
  sharedState: VarRecord[];
  backlog: TaskRecord[];
  depth: number;
  frameTs: number;
}

export function collectMetrics(vq: VarsQueue, opts?: { now?: number; tokens?: number | null; contextWindow?: number | null }): Metrics;
export function classifyPressure(metrics: Metrics, cfg?: Partial<NestedCfg>): PressureLevel;
export function currentDepth(vq: VarsQueue): number;
export function canEnter(vq: VarsQueue, cfg?: Partial<NestedCfg>): { ok: boolean; depth: number; reason?: string };
export function evaluateTrigger(
  vq: VarsQueue,
  opts?: { now?: number; tokens?: number | null; contextWindow?: number | null; currentDepth?: number },
  cfg?: Partial<NestedCfg>,
): { level: PressureLevel; recommend: PressureLevel; depthSaturated: boolean; metrics: Metrics };

export function shouldEmitFocusHint(vq: VarsQueue, opts?: { now?: number; cooldownMs?: number }): boolean;
export function markFocusHintEmitted(vq: VarsQueue, opts?: { now?: number }): void;
export function shouldEmitReorgHint(vq: VarsQueue, opts?: { now?: number; cooldownMs?: number }): boolean;
export function markReorgEmitted(vq: VarsQueue, opts?: { now?: number }): void;
export function requireGateBlocks(vq: VarsQueue, cfg?: { mode?: string; minTasksForForce?: number }): boolean;
export function maybeAutoFocus(
  vq: VarsQueue,
  usage?: { tokens?: number | null; contextWindow?: number | null; now?: number },
  cfg?: Partial<NestedCfg>,
): { scopeId: string; depth: number; sinceSeq: number } | null;

export function buildFrame(vq: VarsQueue, opts?: { now?: number }): Frame;
export function serializeFrame(frame: Frame, opts?: { displayCap?: number }): string;
export function getFocusStack(vq: VarsQueue): FocusFrameRecord[];

export function enterFocus(
  vq: VarsQueue,
  opts?: { taskSubset?: string[]; parentScopeId?: string | null; aimTask?: string | null; now?: number },
  cfg?: Partial<NestedCfg>,
): { scopeId: string; depth: number; sinceSeq: number };

export function popFocus(
  vq: VarsQueue,
  scopeId: string,
  opts?: { reportDir?: string; now?: number },
): { summary: string; report_path: string | null; promotedDecisionId: string; restoredCurr: string | null };

export function realignParent(
  vq: VarsQueue,
  opts?: { parentScopeId?: string | null; savedAimTask?: string | null; now?: number },
): { restoredCurr: string | null; aim: TaskRecord | null; frame: Frame };

export function buildNestedWorkspace(
  vq: VarsQueue,
  opts?: {
    store?: ConversationStore;
    convId?: string;
    focusScopeId?: string;
    now?: number;
    absoluteTimestamps?: boolean;
    messagesN?: number;
    messagesCharCap?: number;
    afterSeq?: number;
  },
): string;
