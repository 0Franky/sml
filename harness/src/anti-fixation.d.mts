export type TurnSignal = "fail" | "pass" | "neutral";
export interface RungCfg { rung1: number; rung2: number; rung3: number; }
export interface StagnationState { consecutiveFails: number; }
export interface StagnationInjectionResult { level: number; message: string; consecutiveFails: number; }

export const DEFAULT_RUNG_CFG: RungCfg;
export function classifyTurnSignal(toolResultTexts: string[]): TurnSignal;
export function updateStagnation(state: StagnationState | undefined | null, signal: TurnSignal): StagnationState;
export function rungLevel(consecutiveFails: number, cfg?: RungCfg): number;
export function rungMessage(level: number): string;
export function stagnationInjection(signalHistory: TurnSignal[], cfg?: RungCfg): StagnationInjectionResult;

declare const _default: {
  DEFAULT_RUNG_CFG: RungCfg;
  classifyTurnSignal: typeof classifyTurnSignal;
  updateStagnation: typeof updateStagnation;
  rungLevel: typeof rungLevel;
  rungMessage: typeof rungMessage;
  stagnationInjection: typeof stagnationInjection;
};
export default _default;
