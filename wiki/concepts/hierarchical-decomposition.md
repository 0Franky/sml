---
name: hierarchical-decomposition
description: Skill cognitiva (pesi) — di fronte a un problema generale, fattorizzarlo come invariante-comune → assi-di-specializzazione → foglie-concrete (la stessa struttura del template-inheritance dei gold, promossa a capacità del modello). Idea utente 2026-06-29.
type: concept
tags: [concept, reasoning, decomposition, abstraction, organization-first, training, skill]
sources: [user msg 2026-06-29 (284), gold-methodology template-inheritance, task-decomposition-adhoc-context]
last_updated: 2026-06-29
---

# Hierarchical Decomposition — pensare per fattorizzazione (generale → specializza → foglia)

> Idea utente (2026-06-29, msg 284): il modello deve avere la **struttura mentale di decomposizione** — prendere un problema generale da specializzare in tante parti e **fattorizzarlo**. È la stessa idea adottata per l'authoring dei gold ([[../training-taxonomy/gold-methodology]] §template-inheritance), **promossa a capacità cognitiva del modello**. Connessione elegante/ricorsiva: usiamo il template-inheritance per *scrivere* i gold, e creiamo gold che *insegnano* la stessa decomposizione.

## Catena: why → problema → soluzione
- **WHY**: un orchestratore organization-first risolve i problemi complessi **scomponendoli**. La qualità della soluzione dipende dalla qualità della decomposizione → è una skill centrale, non accessoria.
- **PROBLEMA**: un LLM base decompone in modo *flat/sequenziale* (lista di step) ma spesso NON **fattorizza** — non separa l'**invariante comune** dalla **variazione**, quindi duplica, perde coerenza, o specializza male.
- **SOLUZIONE**: addestrare la struttura **generale → assi-di-specializzazione → foglie**: (1) isolare il **core invariante** (cosa è condiviso da TUTTE le parti); (2) identificare gli **assi di variazione** (come si specializza); (3) derivare le **foglie** (specializzazioni concrete) che **ricompongono** il generale senza ridondanza.

## Classificazione training-vs-harness ([[training-vs-harness-classification]])
- **S (skill nei pesi)**: il *decidere come fattorizzare* (riconoscere invariante / assi / foglie) — è ragionamento, non un meccanismo dell'harness.
- piccola **F (harness)**: un eventuale scaffold di output (`<decomposition>` con campi `core` / `axes` / `leaves`) struttura la forma, ma NON sostituisce il ragionamento.
- **Stato-senza-training**: DEGRADATA-ma-utile (il base sa decomporre genericamente; non fattorizza in modo affidabile).

## Reward (outcome-anchored, NON la forma)
La decomposizione è BUONA se, **espandendo le foglie, si ricopre il problema generale**: (a) **completamente** (coverage); (b) **senza ridondanza** (le foglie non si sovrappongono, il core non è ripetuto nelle foglie); (c) con l'**invariante corretto** (ciò che è nel core è davvero comune a tutte le foglie). In molti domini è **verificabile**: coding (la gerarchia rifattorizzata passa i test + zero duplicazione), taxonomy (le foglie partizionano lo spazio senza buchi/overlap).
- ⚠️ **hack-check**: NON premiare la *cerimonia* (produrre 3 heading core/axes/leaves) ma l'**outcome** (la fattorizzazione è corretta e si ricompone). Una decomposizione plausibile-ma-sbagliata (invariante errato, foglie che non coprono) → reward basso. Scorer ≠ scored.

## ⚠️ Proporzionalità (anti over-decomposition) — critica onesta
Decomporre un problema **banale** è overhead e una forma di reward-hacking della struttura. La skill DEVE includere il **WHEN**: fattorizzare dove la complessità lo giustifica, risolvere diretto dove no (stessa logica della proporzionalità CoT, CLAUDE.md #10). → gli esercizi includono **casi negativi** (problema semplice → NON gonfiare in gerarchia; falso-invariante adversariale → riconoscere che NON c'è un core comune).

## Esercizi (foglia di training) — "casistica decomposizione"
Famiglia di gold (via template-inheritance, coerentemente). Input = problema generale; output = decomposizione fattorizzata (`core` / `axes` / `leaves`) + ricomposizione verificata. **5 classi**:
1. **WITH-hint** — scaffold di decomposizione fornito (3 livelli forte→debole).
2. **WITHOUT-hint** — il modello fattorizza spontaneamente.
3. **WRONG-awareness** — decomposizione errata da riconoscere (invariante sbagliato / foglie che non coprono / foglie ridondanti).
4. **WRONG-recovery** — corregge una decomposizione difettosa.
5. **OTHER** — il caso che **NON va decomposto** (proporzionalità) + adversariale a **falso-invariante**.
Reward = coverage + non-ridondanza + invariante-corretto + ricomposizione (+ proporzionalità sul caso 5).

## Link
[[task-decomposition-adhoc-context]] (decomposizione *sequenziale* per l'esecuzione — complementare: lì è plan-then-execute, qui è *fattorizzazione* per astrazione) · [[structured-thinking]] · [[../training-taxonomy/gold-methodology]] (template-inheritance = la stessa struttura, lato authoring) · [[training-vs-harness-classification]] · [[scientific-method-operating-protocol]]
