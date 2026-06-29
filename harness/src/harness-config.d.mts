/** Type declarations for harness-config.mjs (context-budget configurabile opt-in). */
export interface TriggerConfig {
  tokenReorderPct: number;
  tokenMatrioskaPct: number;
  watchReorder: number;
  watchMatrioska: number;
  maxDepth: number;
  focusK: number;
}
export interface HarnessConfig {
  trigger: TriggerConfig;
  messagesWindowN: number;
}
export const DEFAULT_HARNESS_CONFIG: HarnessConfig;
export function loadHarnessConfig(path?: string, opts?: { env?: Record<string, string | undefined> }): HarnessConfig;
declare const _default: { loadHarnessConfig: typeof loadHarnessConfig; DEFAULT_HARNESS_CONFIG: HarnessConfig };
export default _default;
