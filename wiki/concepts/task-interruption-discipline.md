---
name: task-interruption-discipline
description: Preemption-policy by-urgency — quando arriva una nuova richiesta mentre un task è in corso, default enqueue+reference+finish; preempt con checkpoint solo se urgente/bloccante o invalidante. Urgenza stimata da feature osservabili (cardine = invalidazione via deps); default conservativo = ENQUEUE.
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
- **Problema.** Il comportamento naïve è il **context-switch distruttivo**: stoppare il task corrente lasciandolo **incompleto** e saltare al nuovo. Costo reale: lavoro a metà perso, stato intermedio orfano, **thrash** (rimbalzo continuo tra task senza chiuderne nessuno). È l'anti-pattern diretto di optimization-first (feedback_optimization_first, memory) — no batch, no chiusura, context churn. [INFERRED]
- **Soluzione.** Una **preemption-policy basata su urgenza**. Default = *enqueue + reference-source + finish-then-switch*: la nuova richiesta viene **annotata** nella task-list **referenziando il messaggio/sorgente** da cui riprendere le info (così nessuna informazione si perde), si **FINISCE** il task corrente, poi ci si dedica al nuovo. **Preempt** (interruzione vera, con checkpoint dello stato corrente) SOLO se il nuovo task è urgente/bloccante o **invalida** il corrente. Tutto **dipende dall'urgenza**. [EXTRACTED]

## Policy (decision tree per urgenza)

Alla nuova richiesta `N` mentre il task corrente `C` è IN_PROGRESS:

- **Default → enqueue + finish.** Push `N` in coda TASKS come `TODO`, continua `C` fino a `DONE`. È il caso comune (scheduling FIFO ovvio); il valore non sta qui ma nei due rami non-ovvi sotto. [EXTRACTED]
- **`N` invalida `C` → NON finire `C`.** Se `N` rende inutile o sbagliato il lavoro di `C` (es. "annulla la feature X" mentre la stai scrivendo), riordina la coda o abbandona `C` esplicitamente. Qui finire-prima sarebbe *spreco*, non disciplina — è il caso che ribalta il default. Registra la dipendenza in `deps`. [EXTRACTED]
- **Costo del checkpoint → modula il preempt.** Se `C` è in uno stato **non checkpoint-abile a basso costo** (operazione atomica a metà, side-effect non reversibile in corso), preferisci **finire** anche con urgenza media; se il checkpoint è cheap, preempt costa poco. Il costo-di-switch entra nella decisione, non solo l'urgenza di `N`. [INFERRED]
- **Reference SEMPRE la sorgente** (invariante). Ogni task accodato porta `reference: <message_id | source>`: al resume le info originali sono recuperabili senza ricostruirle a memoria (anti-loss). Non opzionale. [EXTRACTED]

> **Composizione con STOP-low-confidence (B1).** Il default *finish-then-switch* NON confligge con lo STOP di [[low-confidence-gather-and-reorg]]: quest'ultimo opera **dentro `C`** (ti fermi a fare gathering/reorg per completare bene il task corrente), **non** è un preempt verso un nuovo task. Sono due assi ortogonali: uno regola *come* eseguire `C`, l'altro *se/quando* abbandonarlo per `N`. [INFERRED]

## Stima dell'urgenza — feature osservabili

Il decision tree dipende da "urgenza", ma "urgente" non può definirsi come "ciò per cui fai preempt" (circolare). Serve renderla **operativa** via proxy ordinati per **oggettività decrescente** — più in alto = più falsificabile senza stimare un'astrazione:

1. **Invalidazione via deps** (CARDINE). `N` rende inutile/sbagliato `C`. È l'unico segnale **HARD**: rilevabile **oggettivamente dal grafo deps** (es. `N` muta una dep da cui `C` discende, o `N` droppa il target di `C`), falsificabile senza stimare nulla. Trigger diretto del ramo "`N` invalida `C`". [EXTRACTED]
2. **Bloccante-per-altri-task** (deps). `C` è dep di molti task in coda, e `N` lo sblocca / cambia la testa della catena. Derivabile dal grafo deps (in-degree di `C`, archi `N→altri`). Oggettivo ma meno netto dell'invalidazione. [INFERRED]
3. **Segnali espliciti nel messaggio** (MEDIUM). L'utente dice "stop" / "urgente" / "prima di tutto" / "lascia perdere quello". Osservabile ma soggetto a iperbole e ambiguità linguistica → non HARD. [EXTRACTED]
4. **Costo-di-attesa / deadline esterna** (SOFT). `N` ha una scadenza esterna o un costo-di-attesa che cresce nel tempo. Il più astratto: spesso va inferito, raramente è verificabile dal solo input. [INFERRED]

**Regola di default robusta:** in **assenza di un segnale HARD** (invalidazione via deps, o bloccante-per-altri derivabile dal grafo), **ENQUEUE**. Default conservativo: evita il **thrash**, che è il fallimento più costoso. I segnali soft (3-4) da soli non giustificano un preempt vero — al più alzano la priorità in coda. [INFERRED]

## Meccanismo sul wrapper

Si appoggia interamente alle strutture già definite:

- **Lane TASKS** di [[agent-wrapper-vars-queue]]: ogni richiesta è una riga con `status` ∈ {TODO, IN_PROGRESS, DONE, BLOCKED} + `deps` + un campo `reference` al messaggio sorgente. Enqueue (default) = append `TODO`. Checkpoint (preempt) = `C` → `BLOCKED`/paused + var handle dello stato parziale nel registry VARS. Invalidazione = mutazione `deps` / drop di `C`. Il puntatore `CURR` resta su `C` salvo preempt. [INFERRED]
- **`state_queue` / `current_state`** di [[structured-context-sections]]: la nuova richiesta compare nel `state_queue` (con la sua priorità), il task in corso resta marcato `[IN_PROGRESS]` in `current_state` finché non è `DONE` o esplicitamente `BLOCKED`. Il modello *vede* la coda e quindi può ragionare sulla preemption invece di reagire d'impulso. [INFERRED]

Punto chiave: la disciplina **non è un nuovo meccanismo**, è una *policy di scheduling* sopra la lane TASKS esistente. Il modello deve solo imparare *quando* scrivere in coda vs *quando* preemptare.

## Reward / hack-check

- **Skill da premiare.** Scegliere **bene** preempt vs enqueue: enqueue quando l'urgenza è bassa (niente thrash), preempt+checkpoint quando è davvero bloccante/invalidante (niente "testardaggine" che ignora un'emergenza). [EXTRACTED]
- **Hack #1 — non-preemptare MAI.** Il modello impara "finisci sempre il corrente" e ignora le urgenze reali → l'utente aspetta un task bloccante dietro uno irrilevante. (Over-fit del default.)
- **Hack #2 — preemptare SEMPRE.** Il modello salta a ogni nuovo input → context-switch distruttivo, thrash, lavoro a metà. (Esattamente il problema originale, mascherato da "reattività".)
- **Difesa.** Ground truth del reward = **urgenza reale + dipendenza reale**, non la presenza di un nuovo messaggio. Penalità **simmetrica**: punisci sia il preempt ingiustificato (thrash) sia il mancato-preempt su task bloccante (latenza). Ancorato all'OUTCOME (utente sbloccato / lavoro non perso), non alla "partecipazione" del modello — vedi reward-hacking principle (feedback_reward_hacking_principle, memory). [INFERRED]
- **Labellabilità (come ottenere la ground-truth "urgenza reale").** Senza una label oggettiva, la penalità simmetrica non è addestrabile. Due regimi:
  - **Dati sintetici → urgenza COSTRUITA.** Generi tu lo scenario, quindi **sai** per costruzione se `N` invalida `C` / è bloccante: la label esce dal generatore, il reward è ancorabile direttamente. È il regime preferito per insegnare la skill (controlli il segnale HARD). [INFERRED]
  - **Dati reali → proxy-outcome.** L'urgenza vera non è etichettata a priori; serve un segnale osservabile *a posteriori* del **mancato-preempt**, es. l'utente ha dovuto ripetere ("te l'avevo detto subito" / "ti avevo detto di fermarti") = preempt mancato; oppure lavoro buttato per un'invalidazione ignorata. Proxy rumoroso ma ancorato all'outcome, non alla partecipazione. [INFERRED]

## Linked

- [[agent-wrapper-vars-queue]] — lane TASKS (status + deps + reference) su cui poggia la policy; il grafo deps è anche la fonte del segnale HARD di urgenza
- [[structured-context-sections]] — `state_queue` / `current_state` che rendono la coda visibile al modello
- [[low-confidence-gather-and-reorg]] — STOP-low-confidence: opera DENTRO `C`, ortogonale al preempt verso `N` (vedi nota B1)
- optimization-first (feedback_optimization_first, memory) — il context-switch distruttivo ne è l'anti-pattern diretto
- reward-hacking principle (feedback_reward_hacking_principle, memory) — reward ancorato all'outcome, penalità simmetrica
- `rules-tg-warn-before-blocking` — caso speciale: avvisare prima di un'azione bloccante è una preemption-decision verso l'esterno

> Nota training: questa è una **skill di Area 1 (organization / long-horizon planning)**. Va insegnata con casi sintetici che coprono il default (enqueue) e i due rami non-ovvi (invalidazione via deps, checkpoint costoso), inclusi gli edge (urgenza ambigua, invalidazione parziale, segnale soft senza HARD). Nel sintetico l'urgenza è costruita → label oggettiva per il reward simmetrico. [INFERRED]
