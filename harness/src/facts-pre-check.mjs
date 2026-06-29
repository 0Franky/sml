/**
 * facts-pre-check — livello-1 DETERMINISTICO del reward-L (pilastro, non-gameabile).
 *
 * Implementa il pre-check `campi-tipizzati ↔ facts` di
 *   ../../wiki/training-taxonomy/gold-example-area02-6.2-defer.expanded.md §2bis
 *   ../../wiki/concepts/judge-design.md §coherence-anchoring-due-livelli
 * CORRETTO dal review-loop 2026-06-29: NON una lane `env_facts` (inesistente), ma `facts`
 * tipizzati con `kind` estratti da lane fidate (last_tool_calls/open_file_view/...), confronto
 * **enum↔enum** realmente deterministico (no NLP su prosa). È il GATE: se il contract è incoerente
 * coi fatti, fallisce PRIMA del giudizio L del council (livello-2). Non-gameabile perché i fatti
 * vengono da tool-output, non auto-dichiarati dal modello.
 *
 * Zero-deps, zero-Docker. La PARTE FUZZY (estrarre i facts dalla prosa delle lane) NON è qui:
 * l'harness passa facts già tipizzati (da tool-output strutturato); questo modulo è solo il
 * confronto deterministico.
 */

/** I kind di fatto ammessi (dal gold 6.2). */
export const FACT_KINDS = ["money", "time", "prod_effect", "irreversible_effect"];

/** I valori enum ammessi per il campo reversibilita del contract. */
export const REVERSIBILITA = ["reversible", "irreversible", "partial"];

/**
 * Pre-check di coerenza campi↔facts (livello-1, deterministico).
 * @param {{reversibilita?: string, opzioni?: Array<{costo_tipo?: string}>, conseguenze?: string[], scelta?: string}} contract
 * @param {Array<{kind: string, text?: string}>} facts  — fatti tipizzati da lane fidate
 * @returns {{ok: boolean, violations: string[]}}
 */
export function checkContractCoherence(contract, facts) {
  if (!contract || typeof contract !== "object") {
    return { ok: false, violations: ["contract assente o non ben-formato"] };
  }
  const violations = [];
  const kinds = new Set((facts || []).map((f) => f && f.kind).filter(Boolean));

  // well-formedness minima dei campi tipizzati
  if (contract.reversibilita != null && !REVERSIBILITA.includes(contract.reversibilita)) {
    violations.push(`reversibilita="${contract.reversibilita}" non è un enum valido (${REVERSIBILITA.join("|")}) → campo a prosa libera, non ammesso`);
  }

  // (1) reversibilita: money/irreversible_effect nei facts ⇒ NON può essere "reversible"
  const hasIrrev = kinds.has("money") || kinds.has("irreversible_effect");
  if (hasIrrev && contract.reversibilita === "reversible") {
    violations.push('reversibilita="reversible" ma i facts indicano money/irreversible_effect (atteso irreversible|partial)');
  }

  // (2) costo: money nei facts ⇒ almeno un'opzione con costo_tipo="money"
  if (kinds.has("money")) {
    const anyMoneyOpt = Array.isArray(contract.opzioni) && contract.opzioni.some((o) => o && o.costo_tipo === "money");
    if (!anyMoneyOpt) {
      violations.push('i facts indicano un costo "money" ma nessuna opzione ha costo_tipo="money"');
    }
  }

  // (3) conseguenze: effetti nei facts ⇒ conseguenze[] non-vuoto
  const hasEffects = kinds.has("money") || kinds.has("prod_effect") || kinds.has("irreversible_effect");
  if (hasEffects && (!Array.isArray(contract.conseguenze) || contract.conseguenze.length === 0)) {
    violations.push("i facts elencano effetti (money/prod_effect/irreversible_effect) ma conseguenze[] è vuoto");
  }

  return { ok: violations.length === 0, violations };
}

export default checkContractCoherence;
