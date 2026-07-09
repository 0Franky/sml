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
export interface AdaptiveContextConfig {
  /** true → keepTurns adattivo alla pressione (default false = keepTurns fisso). */
  enabled: boolean;
  /** fill% (tokens/finestra) oltre cui si passa da highKeep a nativeKeepTurns. */
  lowThreshold: number;
  /** keepTurns "vanilla" quando fill < lowThreshold (praticamente illimitato). */
  highKeep: number;
  /** frazione max della finestra fisica occupabile dal regime vanilla (cap anti-stallo). Default 0.8. */
  safetyPct?: number;
  /** stima token/turno per derivare il cap = safetyPct·finestra/avgTurnTokens. Default 2000. */
  avgTurnTokens?: number;
  /** banda d'isteresi sotto lowThreshold: una volta compresso si torna vanilla solo se fill<lowThreshold-hysteresis (anti flip-flop). Default 0.1; 0=off. */
  hysteresis?: number;
}
export type SinkGatingMode = "strict" | "warn" | "off";
export type RegexIngressMode = "off" | "ask" | "auto";
export interface SecretsConfig {
  sinkGating: SinkGatingMode;
  regexIngress: RegexIngressMode;
  allowSecretToFile: boolean;
}
export type ToolGatingMode = "off" | "discover" | "gated";
export type { ToolProfile } from "./tool-gating.mjs"; // SSOT: il tipo vive col valore TOOL_PROFILES in tool-gating
import type { ToolProfile } from "./tool-gating.mjs";
export interface HarnessConfig {
  trigger: TriggerConfig;
  messagesWindowN: number;
  messagesCharCap: number;
  nativeKeepTurns: number;
  adaptiveContext: AdaptiveContextConfig;
  laneMemoryHint: boolean;
  laneMemoryHintLevel: "full" | "lean";
  messagesExcludeCurrentTurn: boolean;
  singleUser: boolean;
  gathering: GatheringConfig;
  autofocus: AutofocusConfig;
  secrets: SecretsConfig;
  toolGating: ToolGatingMode;
  /** Profilo del set-attivo quando gated (ORTOGONALE al modo). Default "standard" = ESSENTIAL (storico). */
  toolProfile: ToolProfile;
  /** Lista-nomi per toolProfile="custom" (altrimenti []). Intersecata coi tool presenti. */
  toolGatingCustom: string[];
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
