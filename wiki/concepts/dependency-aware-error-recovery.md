---
name: dependency-aware-error-recovery
description: Scoperto un errore a una decisione T1, NON basta fixare T1 — capire il delta concettuale (root-cause), ripercorrere le azioni dall'errore ad ora, e propagare il fix a TUTTE le decisioni DIPENDENTI lungo il dependency-graph (truth-maintenance / cascading revision). FEATURE = dep-graph già esistente; SKILL = traversare + ri-esaminare il downstream (training, reward outcome-anchored). Idea utente msg 197 (2026-06-27).
type: concept
tags: [concept, error-recovery, truth-maintenance, dependency-graph, metacognition, self-correction, reward-hacking, organization-first]
sources: [user notes 2026-06-27 msg 197, wiki/concepts/task-interruption-discipline, self-analysis-strategy-revision, error-memo-system]
last_updated: 2026-06-29
status: finalized v1 — training-spec completa (coerenza end-to-end + outcome-bisect)
confidence: provisional
---

# Dependency-Aware Error Recovery (truth-maintenance sul dep-graph)

> **Stato**: finalized v1. Cattura dell'idea utente 2026-06-27 (msg 197), con training-spec completata 2026-06-29. Capability **forte** del Tier 1 organization-first: la correzione di un errore non è locale, è **a cascata** lungo le dipendenze.

## Catena di pensiero (why → problema → soluzione)

- **Why** `[EXTRACTED]` — quando il modello (o l'utente) scopre che una decisione passata era sbagliata, quella decisione raramente è isolata: altre decisioni successive (T2, T3, …) sono state prese **sulla base** di T1. Fixare solo T1 lascia il downstream **incoerente** con la premessa corretta.
- **Problema** `[EXTRACTED]` — il default ingenuo è "correggi il sintomo dove l'errore è stato notato". Ma (i) il punto di *notifica* dell'errore ≠ il punto di *origine* (root-cause); (ii) anche corretto il root-cause, le conclusioni **derivate** restano basate sulla premessa vecchia → il sistema resta in uno stato falso-ma-coerente-localmente.
- **Soluzione** `[EXTRACTED]` — tre passi: (1) **capire il delta concettuale** — in cosa differiscono le due visioni, *cosa* è stato sbagliato concettualmente (root-cause, non sintomo); (2) **ripercorrere** tutte le azioni/decisioni dall'errore ad ora; (3) **propagare il fix** a tutte le decisioni **dipendenti** da T1 (rianalizzarle, rivederle, e se serve fixarle). È la **truth-maintenance / cascading revision** dell'IA classica: ritratta una premessa → ri-esamina tutte le conclusioni che ne derivavano.

## Esempio auto-dimostrativo `[EXTRACTED]`

L'esempio dell'utente è **questa stessa sessione**: l'utente mi ha corretto su `section-boundary` (= T1). Non bastava cambiare la singola frase: ho dovuto (1) capire il delta (section≠turn, e la mia "downgrade a turn" era il sbaglio concettuale), (2) ripercorrere dove quel framing era propagato (catalog Classe-B, §3 mapping, plan div-1, concept external-update-injection, open-question, §2ter), (3) fixare **tutte** le occorrenze dipendenti, non solo quella notata. → il dep-graph della conoscenza wiki è il dependency-graph; la revisione a cascata è la skill.

## FEATURE vs SKILL — classificazione training-vs-harness `[review-loop]`

Applico il decision-tree di [[training-vs-harness-classification]] (Step-0 scomponi → classifica ogni metà → stato-senza-training).

- **Q0 scomponi**:
  - **{meccanismo}** = il **dependency-graph** già esistente nelle strutture wrapper — lane `interconnections` (deps + flag WIP) + `deps` della vars-queue + decision-cache `block_notes`. Le dipendenze sono *già tracciate*.
  - **{decisione}** = **traversare** il dep-graph dal nodo-errore + capire il **delta concettuale** (root-cause ≠ sintomo) + **ri-esaminare** ogni nodo downstream + decidere quali vanno rivisti/fixati.
- **Q1/Q1a → F-harness**: il dep-graph + le sue strutture sono infra wrapper-side deterministica. **Stato: PIENA** (il grafo esiste e si interroga senza training).
- **Q2 → S**: riconoscere che un fix ha conseguenze a valle + traversare + decidere il sottoinsieme da rivedere è metacognitivo, va nei pesi.
- **Q3 → F+S**: Q1 ∧ Q2, e lo stato-senza-training della metà-S è **INERTE** (il default ingenuo "correggi il sintomo dove l'errore è notato" lascia il downstream falso-coerente — è il fallimento che la skill copre).
- **Q5 stato-senza-training (metà-S): INERTE**. Il base-model fixa il sintomo locale, non propaga. NON spedibile come skill di Fase-1.
- **Q6 fallback deterministico: PARZIALE**. Si può **enumerare deterministicamente** i nodi downstream dal dep-graph (la traversata è meccanica) → un fallback può *segnalare* "questi N nodi dipendono da T1, rivedili"; ma *decidere quali vanno effettivamente fixati e come* resta skill. Il fallback rende la capacità DEGRADATA-MA-UTILE (lista-candidati), non PIENA.

> **Output**: `{F+S · stato-S=INERTE / DEGRADATA-con-fallback · gate=fallback-enumera-F1, skill-decide-F2/3 · spec-S=outcome-bisect + coerenza-end-to-end}`.

> **Distinta da** [[task-interruption-discipline]] "invalidation-via-deps": **stesso dep-graph (F condivisa)**, ma qui per **error-correction** (a valle, post-errore), lì per **preemption** (cosa abbandonare quando un task ne invalida un altro).

## Reward / hack-check

- **Outcome desiderato**: dopo un fix, il sistema è coerente **end-to-end** (nessuna decisione downstream resta basata sulla premessa errata).
- **Reward ancorato all'OUTCOME = coerenza end-to-end dopo la propagazione** `[review-loop]` — il reward si misura sulla **coerenza dello stato finale dopo che il fix è stato propagato** lungo il dep-graph (il test a valle passa / nessun nodo downstream resta basato sulla premessa vecchia), **NON sul gesto di traversare** il grafo (participation-hack: percorrere le dipendenze per incassare il reward anche dove non serviva). Questo è la **truth-maintenance a cascata** dell'IA classica resa verificabile: ritratta una premessa → tutte le conclusioni derivate devono tornare coerenti, e *quello* è ciò che si premia. Vedi [[reward-hacking-mitigation]].
- **Hack A — over**: ri-analizza tutto il downstream anche per errori senza dipendenze → spreco. **Difesa**: premia solo la revisione di nodi **realmente** dipendenti (verificabile dal dep-graph: un nodo non-dipendente toccato è penalizzato).
- **Hack B — under**: fixa solo il sintomo → stato falso-coerente. È il fallimento di default che la skill esiste per coprire; lo scorer di coerenza-end-to-end lo cattura perché un nodo downstream resta incoerente.
- **Hack-check (scorer ≠ scored)** `[review-loop]`: lo scorer di coerenza è **deterministico** (esecuzione del test a valle / check di consistenza sul dep-graph), non un auto-giudizio del modello → **scorer ≠ scored** (CLAUDE.md #10). Il segnale è sullo stato del mondo dopo il fix, non sulla narrazione "ho propagato".

## Training

- **Regime** `[INFERRED]`: `SFT-format` (traiettorie errore→root-cause→traversal→fix-a-cascata) → **on-policy distillation cold-start** (student genera la traversata, teacher scora) → **RL-GRPO outcome-anchored** (coerenza finale verificabile). Il distillation step riduce il cold-start gap del GRPO su 4B.
- **Label-generation = outcome-bisect** `[review-loop]`: il metodo concreto è l'**outcome-bisect** — si iniettano errori a nodi noti del dep-graph e si genera la ground-truth "quali downstream vanno toccati" *per costruzione* (dipendenze note). Cruciale: l'outcome-bisect **cattura anche le traiettorie degradate-ma-recuperate** — una traiettoria che ha imboccato un fix sbagliato ma poi ha propagato correttamente fino a uno stato finale coerente riceve reward sull'esito (coerenza end-to-end), non penalità sulla forma del percorso. Premia il *recupero verificato*, non la pulizia del cammino.
  - Metodo SOTA di supporto (review-loop dim-5): **PALADIN** (arXiv 2509.25238, impara strategie compositive di recovery) + **AgentDebug** (arXiv 2509.25370 — *"Where LLM Agents Fail and How They can Learn From Failures"*, trova il *critical error step* in una traiettoria fallita + re-rollout mirato). `[ref verificati 2026-06-29]`
- **Foglia di training**: Area 2 (criticality/deps) + Area 4 (metacognition) + Area 16 (self-analysis).

## Linked
- [[training-vs-harness-classification]] — il playbook di classificazione; questo concept è un'istanza F+S (F=dep-graph, S=traversal-e-decide-downstream).
- [[task-interruption-discipline]] — condivide il dep-graph (invalidation-via-deps); lì = preemption, qui = revisione a cascata post-errore.
- [[self-analysis-strategy-revision]] — il root-cause/delta concettuale è il post-mortem di traiettoria; qui esteso alla propagazione downstream.
- [[error-memo-system]] — la lezione del fix-a-cascata alimenta la memo (non ripetere l'errore + ricordare di propagare).
- [[scientific-method-operating-protocol]] — il verify-loop deve verificare il downstream, non solo il sintomo.
- [[reward-hacking-mitigation]] — outcome-anchored (coerenza end-to-end), anti participation-hack, scorer≠scored.

> **Next**: foglia di training (Area 2/4/16) con example-space; ablare PALADIN/AgentDebug-style label-gen. Ref VERIFICATI 2026-06-29 (PALADIN 2509.25238, AgentDebug 2509.25370).
