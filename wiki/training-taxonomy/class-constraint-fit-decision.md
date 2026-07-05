---
name: class-constraint-fit-decision
description: Classe-PADRE (radice) di training — scegliere l'opzione le cui proprietà/costi COMBACIANO coi requisiti-e-vincoli REALI del compito, invece del default / più-potente / più-a-portata-di-mano. Incarnazione-training dell'optimization-first. Figlia iniziale: resource-appropriate-substitution (Gemma-vs-Gemini). Gerarchia obbligatoria (regola #20).
type: training-class
tags: [reasoning, planning, optimization, decision-making, resource-awareness, parent-class, area-03]
last_updated: 2026-07-05
---

# Classe-PADRE (radice) — DECISIONE PER FIT-AI-VINCOLI

> **Ruolo**: nodo-radice della gerarchia di training per le **scelte logiche preferenziali** — scegliere non "l'opzione di default / la più potente", ma quella che **combacia** coi requisiti e i vincoli REALI del compito. Regola #20 (utente msg 1195/1218): classi sempre gerarchiche.
> **Origine**: proposta utente msg 1218 ("scelte logiche preferenziali", esempio Gemma-vs-Gemini). È l'incarnazione-training dell'**optimization-first** ([[../feedback_optimization_first]], CLAUDE.md #8): non over-provisionare, non sotto-provisionare, allocare a misura.

## La skill-RADICE (livello padre)

**Gap comune**: il ragionatore sceglie l'opzione **di default / più potente / più a portata** senza mappare i **requisiti load-bearing** del compito contro le **proprietà** delle opzioni disponibili → over-provisiona (spreco) o sotto-provisiona (esito degradato). La skill radice: **mappare requisiti↔proprietà e scegliere il fit**, non la potenza assoluta né l'abitudine.

**Perché padre + figlie** (regola #20): tutte le figlie condividono il muscolo "che cosa richiede DAVVERO questo compito, e quale opzione lo soddisfa al costo minimo?" — impararlo una volta, poi specializzare *quale* dimensione si sceglie (risorsa, strumento, algoritmo, livello-di-sforzo).

## Le figlie (cosa si sceglie)

| Figlia | Dimensione della scelta | Esempio | Doc |
|---|---|---|---|
| **sostituzione risorsa-appropriata** | quale RISORSA (costosa vs sostituto equivalente) | Gemma per il meccanismo, Gemini per i dati | [[class-resource-appropriate-substitution]] (gold Gemma/Gemini held-out) |
| **percorso-alternativo sotto-blocco** | come SBLOCCARSI quando la default è bloccata (alternativa EQUIVALENTE) | 2 modelli bloccati → modello fresco non-testato di parità | [[class-alternative-path-under-block]] (msg 1229; cross-link stagnation-recovery) |
| *(futura)* right-tool-for-job | quale STRUMENTO | grep vs parser AST vs LLM | — |
| *(futura)* right-effort-for-stakes | quanto SFORZO/rigore | one-liner vs design-doc | — |

> Le figlie "future" sono placeholder estensibili (regola #20 — la gerarchia cresce quando emerge un gap reale, non a priori).

## Reward (condiviso, ANCORATO all'OUTCOME + SIMMETRICO)

Ogni figlia premia l'**allocazione corretta** verificata sull'esito reale (costo risparmiato ∧ requisito soddisfatto), su **casi bilanciati** (dove sostituire/semplificare È giusto E dove NON lo è). MAI la cerimonia del "valuto le alternative". La **simmetria** (né sempre-cheap né sempre-precious) è l'anti-hack condiviso — stessa filosofia di [[class-confabulation-retrieval-failure]]. Esempi **NEGATIVI** obbligatori (regola #21): il confine dove la scelta economica è SBAGLIATA.

## Hack-check (condiviso)

- **Default fisso** (always-cheap / always-powerful) → neutralizzato dalla simmetria.
- **Cerimonia** ("confronto le opzioni…" senza allocare bene) → 0.
- **Decontaminazione**: l'istanza osservata (Gemma/Gemini) è held-out.

## Links
[[class-resource-appropriate-substitution]] · [[class-metacognitive-self-audit]] · [[class-consequence-intention-conflict]] · [[../concepts/training-set-construction-principles]] · [[../feedback_optimization_first]] · [[../feedback_intelligence_gap_to_training_class]] · [[area-03-reasoning-scientific-method]]
