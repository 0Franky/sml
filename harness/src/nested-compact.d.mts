/** Type declarations for nested-compact.mjs (orchestrazione matrioska del context). */
import type { VarsQueue, FocusFrameRecord, TaskRecord, DecisionRecord, RuleRecord, VarRecord } from "./vars-queue.mjs";
import type { ConversationStore } from "./conversation-store.mjs";

export type PressureLevel = "none" | "reorder" | "matrioska";
export type PressureDriver = "max" | "work" | "occupancy";
export type PressureReasonKind = "none" | "task-backlog" | "context-fill" | "both";

export interface NestedCfg {
  tokenReorderPct: number;
  tokenMatrioskaPct: number;
  watchReorder: number;
  watchMatrioska: number;
  focusK: number;
  maxDepth: number;
  cooldownMs: number;
  outputReservePct: number;
  pressureDriver: PressureDriver;
}
export const DEFAULT_CFG: NestedCfg;
export const PRESSURE_DRIVERS: PressureDriver[];

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

export function collectMetrics(vq: VarsQueue, opts?: { now?: number; tokens?: number | null; contextWindow?: number | null; outputReservePct?: number }): Metrics;
export function classifyAxes(metrics: Metrics, cfg?: Partial<NestedCfg>): { work: PressureLevel; occ: PressureLevel };
export function pickDriver(work: PressureLevel, occ: PressureLevel, driver?: PressureDriver): PressureLevel;
export function pressureReason(work: PressureLevel, occ: PressureLevel, level: PressureLevel, driver?: PressureDriver): PressureReasonKind;
export function classifyPressure(metrics: Metrics, cfg?: Partial<NestedCfg>): PressureLevel;
export function currentDepth(vq: VarsQueue): number;
export function canEnter(vq: VarsQueue, cfg?: Partial<NestedCfg>): { ok: boolean; depth: number; reason?: string };
export function evaluateTrigger(
  vq: VarsQueue,
  opts?: { now?: number; tokens?: number | null; contextWindow?: number | null; currentDepth?: number },
  cfg?: Partial<NestedCfg>,
): {
  level: PressureLevel; recommend: PressureLevel; depthSaturated: boolean; metrics: Metrics;
  work: PressureLevel; occ: PressureLevel; driver: PressureDriver; reason: PressureReasonKind;
};

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
    excludeCurrentTurn?: boolean;
    /** complementarità native-window: la lane mostra solo i turni più vecchi del K-esimo user (K>0 → precede excludeCurrentTurn). */
    nativeKeepTurns?: number;
    /** inventario sealed-secrets (nomi+sink+flag, MAI valori) per la lane <secrets> nel ramo nested (gate-critical). */
    secrets?: import("./sealed-secrets.d.mts").SecretMeta[];
  },
): string;
