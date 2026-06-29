/** Type declarations for harness-config.mjs (context-budget configurabile opt-in). */
export interface TriggerConfig {
  tokenReorderPct: number;
  tokenMatrioskaPct: number;
  watchReorder: number;
  watchMatrioska: number;
  maxDepth: number;
  focusK: number;
  outputReservePct: number;
}
export type GatheringMode = "delegated" | "inject" | "require";
export interface GatheringConfig {
  mode: GatheringMode;
  minTasksForForce: number;
}
export type AutofocusMode = "off" | "nudge" | "auto";
export interface AutofocusConfig {
  mode: AutofocusMode;
}
export interface HarnessConfig {
  trigger: TriggerConfig;
  messagesWindowN: number;
  gathering: GatheringConfig;
  autofocus: AutofocusConfig;
}
export const GATHERING_MODES: GatheringMode[];
export const AUTOFOCUS_MODES: AutofocusMode[];
export const DEFAULT_HARNESS_CONFIG: HarnessConfig;
export function loadHarnessConfig(path?: string, opts?: { env?: Record<string, string | undefined> }): HarnessConfig;
declare const _default: { loadHarnessConfig: typeof loadHarnessConfig; DEFAULT_HARNESS_CONFIG: HarnessConfig };
export default _default;
