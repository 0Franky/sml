/** Type declarations for facts-pre-check.mjs (livello-1 deterministico reward-L). */
export declare const FACT_KINDS: readonly string[];
export declare const REVERSIBILITA: readonly string[];

export interface Fact { kind: string; text?: string; }
export interface Contract {
  reversibilita?: string;
  opzioni?: Array<{ costo_tipo?: string }>;
  conseguenze?: string[];
  scelta?: string;
}
export declare function checkContractCoherence(
  contract: Contract,
  facts: Fact[],
): { ok: boolean; violations: string[] };
export default checkContractCoherence;
