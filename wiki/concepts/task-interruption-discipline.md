---
name: task-interruption-discipline
description: Preemption-policy by-urgency — quando arriva una nuova richiesta mentre un task è in corso, default enqueue+reference+finish; preempt con checkpoint solo se urgente/bloccante o invalidante.
type: concept
tags: [agent-skill, scheduling, preemption, long-horizon, organization, optimization]
sources: [user notes 2026-06-27 msg 162]
last_updated: 2026-06-27
status: draft v0
confidence: provisional
---

# Task Interruption Discipline — Quando (non) Stoppare

## Catena di pensiero (why → problema → soluzione)

- **Why.** Le richieste arrivano **async**: l'utente (o un tool, o un sub-agent) manda una NUOVA richiesta mentre il modello sta GIÀ eseguendo un task. Un agente long-horizon non lavora mai in un mondo a singolo task isolato. [EXTRACTED] (idea utente 2026-06-27 msg 162)
- **Problema.** Il comportamento naïve è il **context-switch distruttivo**: stoppare il task corrente lasciandolo **incompleto** e saltare al nuovo. Costo reale: lavoro a metà perso, stato intermedio orfano, **thrash** (rimbalzo continuo tra task senza chiuderne nessuno). È l'anti-pattern diretto di [[feedback_optimization_first|optimization-first]] (no batch, no chiusura, context churn). [INFERRED]
- **Soluzione.** Una **preemption-policy basata su urgenza**. Default = *enqueue + reference-source + finish-then-switch*: la nuova richiesta viene **annotata** nella task-list **referenziando il messaggio/sorgente** da cui riprendere le info (così nessuna informazione si perde), si **FINISCE** il task corrente, poi ci si dedica al nuovo. **Preempt** (interruzione vera, con checkpoint dello stato corrente) SOLO se il nuovo task è urgente/bloccante o **invalida** il corrente. Tutto **dipende dall'urgenza**. [EXTRACTED]

## Policy (decision tree per urgenza)

Alla nuova richiesta `N` mentre il task corrente `C` è IN_PROGRESS, valuta in quest'ordine:

- **(a) Urgenza bassa, indipendente** → **enqueue**. Push `N` in coda TASKS come `TODO`, con `reference` al message_id sorgente. Continua `C` fino a `DONE`. Default e caso più comune. [EXTRACTED]
- **(b) Urgenza alta / bloccante** → **checkpoint + switch + resume**. Salva lo stato di `C` (var handles + step parziale + nota "resume da qui"), marca `C` come `BLOCKED` o `IN_PROGRESS`-paused, esegui `N`, poi **resume `C`** dal checkpoint. Preempt giustificato solo qui. [EXTRACTED]
- **(c) `N` dipende-da / invalida `C`** → **switch o riordino**. Se `N` rende inutile o sbagliato il lavoro di `C` (es. "annulla la feature X" mentre la stai scrivendo), **non finire `C`**: riordina la coda o abbandona `C` esplicitamente. Qui finire-prima sarebbe *spreco*, non disciplina. Registra la dipendenza in `deps`. [EXTRACTED]
- **(d) Reversibilità / costo del checkpoint** → modula. Se `C` è in uno stato **non checkpoint-abile a basso costo** (operazione atomica a metà, side-effect non reversibile in corso), preferisci **finire** anche con urgenza media; se il checkpoint è cheap, preempt costa poco. Il costo-di-switch entra nella decisione. [INFERRED]
- **(e) Reference SEMPRE la sorgente** → invariante trasversale a tutti i casi. Ogni task accodato porta `reference: <message_id | source>` così al resume le info originali sono recuperabili senza ricostruirle a memoria (anti-loss). Non opzionale. [EXTRACTED]

## Meccanismo sul wrapper

Si appoggia interamente alle strutture già definite:

- **Lane TASKS** di [[agent-wrapper-vars-queue]]: ogni richiesta è una riga con `status` ∈ {TODO, IN_PROGRESS, DONE, BLOCKED} + `deps` + un campo `reference` al messaggio sorgente. Enqueue (a) = append `TODO`. Checkpoint (b) = `C` → `BLOCKED`/paused + var handle dello stato parziale nel registry VARS. Invalidazione (c) = mutazione `deps` / drop di `C`. Il puntatore `CURR` resta su `C` salvo preempt. [INFERRED]
- **`state_queue` / `current_state`** di [[structured-context-sections]]: la nuova richiesta compare nel `state_queue` (con la sua priorità), il task in corso resta marcato `[IN_PROGRESS]` in `current_state` finché non è `DONE` o esplicitamente `BLOCKED`. Il modello *vede* la coda e quindi può ragionare sulla preemption invece di reagire d'impulso. [INFERRED]

Punto chiave: la disciplina **non è un nuovo meccanismo**, è una *policy di scheduling* sopra la lane TASKS esistente. Il modello deve solo imparare *quando* scrivere in coda vs *quando* preemptare.

## Reward / hack-check

- **Skill da premiare.** Scegliere **bene** preempt vs enqueue: enqueue quando l'urgenza è bassa (niente thrash), preempt+checkpoint quando è davvero bloccante/invalidante (niente "testardaggine" che ignora un'emergenza). [EXTRACTED]
- **Hack #1 — non-preemptare MAI.** Il modello impara "finisci sempre il corrente" e ignora le urgenze reali → l'utente aspetta un task bloccante dietro uno irrilevante. (Over-fit del default.)
- **Hack #2 — preemptare SEMPRE.** Il modello salta a ogni nuovo input → context-switch distruttivo, thrash, lavoro a metà. (Esattamente il problema originale, mascherato da "reattività".)
- **Difesa.** Ground truth del reward = **urgenza reale + dipendenza reale**, non la presenza di un nuovo messaggio. Penalità **simmetrica**: punisci sia il preempt ingiustificato (thrash) sia il mancato-preempt su task bloccante (latenza). Ancorato all'OUTCOME (utente sbloccato / lavoro non perso), non alla "partecipazione" del modello — vedi [[feedback_reward_hacking_principle|reward-hacking principle]]. [INFERRED]

## Linked

- [[agent-wrapper-vars-queue]] — lane TASKS (status + deps + reference) su cui poggia la policy
- [[structured-context-sections]] — `state_queue` / `current_state` che rendono la coda visibile al modello
- [[feedback_optimization_first|optimization-first]] — il context-switch distruttivo ne è l'anti-pattern diretto
- [[feedback_reward_hacking_principle|reward-hacking principle]] — reward ancorato all'outcome, penalità simmetrica
- `rules-tg-warn-before-blocking` — caso speciale: avvisare prima di un'azione bloccante è una preemption-decision verso l'esterno

> Nota training: questa è una **skill di Area 1 (organization / long-horizon planning)**. Va insegnata con casi sintetici che coprono tutti i rami (a-e), inclusi gli edge (urgenza ambigua, checkpoint costoso, invalidazione parziale). [INFERRED]
