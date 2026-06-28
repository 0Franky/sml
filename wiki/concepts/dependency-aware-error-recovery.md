---
name: dependency-aware-error-recovery
description: Scoperto un errore a una decisione T1, NON basta fixare T1 — capire il delta concettuale (root-cause), ripercorrere le azioni dall'errore ad ora, e propagare il fix a TUTTE le decisioni DIPENDENTI lungo il dependency-graph (truth-maintenance / cascading revision). FEATURE = dep-graph già esistente; SKILL = traversare + ri-esaminare il downstream (training, reward outcome-anchored). Idea utente msg 197 (2026-06-27).
type: concept
tags: [concept, error-recovery, truth-maintenance, dependency-graph, metacognition, self-correction, reward-hacking, organization-first]
sources: [user notes 2026-06-27 msg 197, wiki/concepts/task-interruption-discipline, self-analysis-strategy-revision, error-memo-system]
last_updated: 2026-06-27
status: draft v0
confidence: provisional
---

# Dependency-Aware Error Recovery (truth-maintenance sul dep-graph)

> **Stato**: draft v0. Cattura dell'idea utente 2026-06-27 (msg 197). Capability **forte** del Tier 1 organization-first: la correzione di un errore non è locale, è **a cascata** lungo le dipendenze.

## Catena di pensiero (why → problema → soluzione)

- **Why** `[EXTRACTED]` — quando il modello (o l'utente) scopre che una decisione passata era sbagliata, quella decisione raramente è isolata: altre decisioni successive (T2, T3, …) sono state prese **sulla base** di T1. Fixare solo T1 lascia il downstream **incoerente** con la premessa corretta.
- **Problema** `[EXTRACTED]` — il default ingenuo è "correggi il sintomo dove l'errore è stato notato". Ma (i) il punto di *notifica* dell'errore ≠ il punto di *origine* (root-cause); (ii) anche corretto il root-cause, le conclusioni **derivate** restano basate sulla premessa vecchia → il sistema resta in uno stato falso-ma-coerente-localmente.
- **Soluzione** `[EXTRACTED]` — tre passi: (1) **capire il delta concettuale** — in cosa differiscono le due visioni, *cosa* è stato sbagliato concettualmente (root-cause, non sintomo); (2) **ripercorrere** tutte le azioni/decisioni dall'errore ad ora; (3) **propagare il fix** a tutte le decisioni **dipendenti** da T1 (rianalizzarle, rivederle, e se serve fixarle). È la **truth-maintenance / cascading revision** dell'IA classica: ritratta una premessa → ri-esamina tutte le conclusioni che ne derivavano.

## Esempio auto-dimostrativo `[EXTRACTED]`

L'esempio dell'utente è **questa stessa sessione**: l'utente mi ha corretto su `section-boundary` (= T1). Non bastava cambiare la singola frase: ho dovuto (1) capire il delta (section≠turn, e la mia "downgrade a turn" era il sbaglio concettuale), (2) ripercorrere dove quel framing era propagato (catalog Classe-B, §3 mapping, plan div-1, concept external-update-injection, open-question, §2ter), (3) fixare **tutte** le occorrenze dipendenti, non solo quella notata. → il dep-graph della conoscenza wiki è il dependency-graph; la revisione a cascata è la skill.

## FEATURE vs SKILL

- **FEATURE (wrapper, già esistente)**: il **dependency-graph** vive già nelle strutture — lane `interconnections` (deps + flag WIP) + `deps` della vars-queue + decision-cache `block_notes`. Non serve un meccanismo nuovo: le dipendenze sono già tracciate.
- **SKILL (pesi, da addestrare)**: **traversare** il dep-graph dal nodo-errore + **ri-esaminare** ogni nodo downstream + decidere quali vanno rivisti/fixati. È metacognitiva: il modello deve *riconoscere* che un fix ha conseguenze a valle e *agire* su di esse.

## Reward / hack-check

- **Outcome desiderato**: dopo un fix, il sistema è coerente **end-to-end** (nessuna decisione downstream resta basata sulla premessa errata).
- **Reward ancorato all'OUTCOME** `[EXTRACTED]` — premia se **il fix a cascata ha risolto davvero** (lo stato finale è verificabilmente coerente / il test a valle passa), MAI il gesto di "ho ripercorso le dipendenze" (participation-hack: traversare il grafo per incassare il reward anche dove non serviva). Vedi [[reward-hacking-mitigation]].
- **Hack A — over**: ri-analizza tutto il downstream anche per errori senza dipendenze → spreco. **Difesa**: premia solo la revisione di nodi **realmente** dipendenti (verificabile dal dep-graph).
- **Hack B — under**: fixa solo il sintomo → stato falso-coerente. È il fallimento di default che la skill esiste per coprire.

## Training

- **Regime** `[INFERRED]`: SFT su traiettorie (errore→root-cause→traversal→fix-a-cascata) → **RL outcome-anchored** (coerenza finale verificabile).
- **Label-generation** `[INFERRED]`: traiettorie con errore iniettato a un nodo + dipendenze note → la ground-truth è "quali downstream vanno toccati". Metodo SOTA concreto (review-loop dim-5): **PALADIN** (arXiv 2509.25238, impara strategie compositive di recovery) + **AgentDebug** (trova il *critical error step* in una traiettoria fallita + re-rollout mirato) `[ref? da confermare]`.
- **Foglia di training**: Area 2 (criticality/deps) + Area 4 (metacognition) + Area 16 (self-analysis). Distinta da [[task-interruption-discipline]] "invalidation-via-deps": stesso dep-graph, ma qui per **error-correction** (a valle), lì per **preemption** (cosa abbandonare).

## Linked
- [[task-interruption-discipline]] — condivide il dep-graph (invalidation-via-deps); lì = preemption, qui = revisione a cascata post-errore.
- [[self-analysis-strategy-revision]] — il root-cause/delta concettuale è il post-mortem di traiettoria; qui esteso alla propagazione downstream.
- [[error-memo-system]] — la lezione del fix-a-cascata alimenta la memo (non ripetere l'errore + ricordare di propagare).
- [[scientific-method-operating-protocol]] — il verify-loop deve verificare il downstream, non solo il sintomo.
- [[reward-hacking-mitigation]] — outcome-anchored, anti participation-hack.

> **Next**: foglia di training (Area 2/4/16) con example-space; ablare PALADIN/AgentDebug-style label-gen; verificare i ref.
