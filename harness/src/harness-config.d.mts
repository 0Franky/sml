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
export type SinkGatingMode = "strict" | "warn" | "off";
export type RegexIngressMode = "off" | "ask" | "auto";
export interface SecretsConfig {
  sinkGating: SinkGatingMode;
  regexIngress: RegexIngressMode;
  allowSecretToFile: boolean;
}
export type ToolGatingMode = "off" | "discover" | "gated";
export interface HarnessConfig {
  trigger: TriggerConfig;
  messagesWindowN: number;
  messagesCharCap: number;
  messagesExcludeCurrentTurn: boolean;
  gathering: GatheringConfig;
  autofocus: AutofocusConfig;
  secrets: SecretsConfig;
  toolGating: ToolGatingMode;
}
export const GATHERING_MODES: GatheringMode[];
export const AUTOFOCUS_MODES: AutofocusMode[];
export const SINK_GATING_MODES: SinkGatingMode[];
export const REGEX_INGRESS_MODES: RegexIngressMode[];
export const TOOL_GATING_MODES: ToolGatingMode[];
export const DEFAULT_HARNESS_CONFIG: HarnessConfig;
export function loadHarnessConfig(path?: string, opts?: { env?: Record<string, string | undefined> }): HarnessConfig;
declare const _default: { loadHarnessConfig: typeof loadHarnessConfig; DEFAULT_HARNESS_CONFIG: HarnessConfig };
export default _default;
