---
name: 2026-07-10-message-obligation-tracking
description: ADR — come harness+modello garantiscono che nessun messaggio/obbligo dell'utente venga droppato (specie sotto backlog/async/eviction). DECISIONE (approvata utente msg 1631): NO lane dedicata nuova; riusa il <task_list> esistente come substrato + addestra lo skill (prospective-memory/track-everything) + rete-di-sicurezza F leggera. Deriva da grill-me msg 1610-1631.
type: decision
status: accepted
date: 2026-07-10
tags: [harness, context-engineering, message-tracking, training-vs-harness, prospective-memory, ssot, adr]
last_updated: 2026-07-10
---

# ADR 2026-07-10 — Tracciamento degli obblighi-verso-l'utente (anti-drop dei messaggi)

> **Origine**: grill-me utente msg 1610→1631 (2026-07-10). **Stato**: ACCEPTED (ratifica esplicita utente msg 1631 *"adesso molto di più, procedi così"*, [[../feedback_decision_provenance|#26]]).

## Contesto / problema `[EXTRACTED]`

Sotto **backlog/async**, un messaggio non risposto subito rischia di essere **droppato**: l'euristica implicita *"ho mandato l'ultima parola ⇒ ho finito"* fallisce quando più messaggi sono in coda o arrivano mentre il modello lavora (scenario utente: *"ti chiedo X, poi ti chiedo Y; rispondo a Y e devo ricordarmi di tornare su X"*). Nel NOSTRO harness il rischio è aggravato dall'**eviction**: `<messages_with_user>` è una lane **finestrata** (keepTurns) → un messaggio deferito può **scivolare fuori** dalla finestra e sparire (= bug eviction-confabulation, [[../concepts/eviction-checkpoint]]).

## Opzioni considerate

1. **Lane dedicata `<pending_replies>` pinnata** (prima ipotesi mia) — **RIFIUTATA**: duplicherebbe il `<task_list>` (overlap SSOT, [[../feedback_ssot_dry|#16]]; cautela esplicita utente msg 1624), un sottosistema nuovo per una capacità già coperta dal meccanismo esistente.
2. **Design-2 utente** (unread SOLO in `<facts>` → spostato in finestra quando letto) — **RIFIUTATA**: terrebbe il messaggio più recente FUORI dalla finestra cronologica, rompendo la coerenza proprio sul turno che innesca la risposta.
3. **Reuse `<task_list>` + train skill + F-safety-net** — **SCELTA** (sotto).

## Decisione `[EXTRACTED]`

Scomposizione training-vs-harness ([[../concepts/training-vs-harness-classification|#11]]):

- **MECCANISMO = il `<task_list>` esistente** — è già **pinnato, persistente cross-turno, ordinato, eviction-safe**. Un messaggio non chiudibile subito → diventa un **task-obbligo** con criterio-di-fatto `done = "consegnato all'utente"`. Nessuna lane nuova.
- **SKILL = S / training**: [[../training-taxonomy/class-prospective-memory|prospective-memory]] + track-everything ([[../feedback_track_everything]]) — riconoscere l'obbligo, enqueue-arlo, tornarci, riportare, **non gamare** il "fatto". L'intelligenza sta nel MODELLO ([[../project_base_model_intelligence|identità Tier-1]]).
- **HARNESS = F-safety-net LEGGERA**: a fine-turno, se un messaggio utente è rimasto **non-affrontato**, l'harness auto-inserisce uno **stub-task** ("non affrontato: msg #X"). È lo **scaffold deterministico che recede** man mano che il training internalizza il riflesso (pattern hybrid, [[2026-07-05-slm-scaffolding-extension]]).

**Semantica dell'item** (valida come attributi del task, non come lane separata):
- **tipo-obbligo**: *solo-risposta* (chiude quando rispondo) vs *fai-un-task* (l'ACK "lo faccio" NON chiude; chiude solo a task fatto **E** riportato);
- **chiusura su CONSEGNA di ciò-che-era-dovuto** (per un task = il RISULTATO, non l'ack) → chiude il buco "prometto-e-non-mantengo";
- **ordinato per timestamp** (àncora temporale, [[../feedback_temporal_anchoring]]), non per posizione;
- **distinto dal lavoro**: `task-done ≠ user-informed` — un task può essere `[x]` mentre l'obbligo-comunicativo è ancora aperto ("ho fatto X ma non l'ho ancora riportato"); quel gap è **il difetto da beccare**.

**SSOT**: UNA sola coda (`<task_list>` = obblighi aperti), zero overlap ([[../feedback_ssot_dry|#16]]).

## Conseguenze

- **Scope-harness minimo**: solo la F-safety-net (auto-stub a fine-turno); niente lane/tool/stato nuovi.
- **Training (follow-up)**: facet *"reply-owed = task-obbligo con done=consegnato"* da valutare dentro [[../training-taxonomy/class-prospective-memory]] / track-everything (NON una classe nuova — evita duplicazione, [[../project_durable_fact_capture_is_training]]).
- Il *"fatto ma non riportato"* diventa un gap **osservabile e catturabile**.
- **[INFERRED]** riduce molto lo scope rispetto alla prima ipotesi (lane dedicata).

## Follow-up (tracciati in [[../todo]])
- Design della F-safety-net (dove/come l'harness rileva "msg non-affrontato a fine-turno" — deterministico, senza regex-semantica #24).
- Facet-training reply-owed (attende design; NON filare senza review-loop).

## Links
[[../concepts/agent-communication-protocol]] · [[../architecture/context-pressure-mechanism]] · [[../concepts/eviction-checkpoint]] · [[../training-taxonomy/class-prospective-memory]] · [[../feedback_context_window_sizing]] · [[../feedback_track_everything]] · [[../feedback_temporal_anchoring]] · [[../feedback_ssot_dry]] · [[../todo]]
