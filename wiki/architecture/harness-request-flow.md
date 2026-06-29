---
name: harness-request-flow
description: Spiegazione dettagliata, richiesta-per-richiesta, di COSA viene inviato al modello dall'harness pi nello stato ATTUALE (2026-06-29) e di come evolve il contesto. Distingue ciò che è NOSTRO (il blocco <context> assemblato dal vars-queue) da ciò che è di PI (l'array messaggi della conversazione + compaction + sessione). Include i byte reali prodotti da harness/src/_demo-context-evolution.mjs, i gap noti, e la decisione architetturale aperta su chi possiede la conversazione.
type: architecture
tags: [harness, pi, context, request-flow, conversation, compaction, cross-session, vars-queue, dogfood]
sources:
  - harness/src/context-assembler.mjs
  - harness/src/vars-queue.mjs
  - harness/.pi/extensions/context-assembly.ts
  - harness/src/_demo-context-evolution.mjs
  - harness/node_modules/@earendil-works/pi-coding-agent/dist/core/compaction/compaction.d.ts
  - harness/node_modules/@earendil-works/pi-coding-agent/dist/core/extensions/types.d.ts
last_updated: 2026-06-29
---

# Harness — flusso di una richiesta (stato ATTUALE, 2026-06-29)

> Documento nato dal dogfood di Sonnet sul nostro pi (2026-06-29): *"ricomincio da zero ogni sessione"* + *"la conversazione non sopravvive"*. Qui si spiega, **richiesta per richiesta**, cosa riceve davvero il modello e perché. I blocchi `<context>` sotto sono **output del demo** `harness/src/_demo-context-evolution.mjs` (ordine delle lane reale; valori lunghi abbreviati con `…` e annotazioni spostate fuori dal blocco, per leggibilità).

## TL;DR — cosa riceve il modello a OGNI richiesta `[EXTRACTED]`

Ogni chiamata al modello trasporta **due canali**:

```
┌─ system prompt ────────────────────────────────────────────────┐
│  <system-prompt base di pi>                                     │  ← di PI
│  \n\n                                                           │
│  <context> … </context>                                        │  ← NOSTRO: assemblato dal vars.db,
└────────────────────────────────────────────────────────────────┘     RICOSTRUITO da zero ad ogni richiesta
┌─ messages ─────────────────────────────────────────────────────┐
│  [ user#1, assistant#1(+tool_calls), tool_results…, user#2, … ]│  ← di PI: la CONVERSAZIONE vera.
└────────────────────────────────────────────────────────────────┘     Cresce ogni turno; pi compatta a soglia.
```

- Il **`<context>`** è **NOSTRO** ([[../concepts/wrapper-context-assembly-example|context-assembly]]): contiene lo **STATO** (regole, obiettivo, task, variabili, cambi recenti). È **stateless**: `context-assembler.mjs` lo ri-assembla dal `vars.db` ad **ogni** richiesta → riflette sempre lo stato corrente del datastore.
- I **`messages`** sono di **PI**: l'array della conversazione, mandato al modello ad ogni richiesta. **Non** passano per il nostro `<context>`.

> Punto chiave: **noi iniettiamo lo STATO, non la chat.** La conversazione è gestita interamente da pi (vedi §"Cosa fa pi nativamente").

## Le lane del nostro `<context>` `[EXTRACTED da context-assembler.mjs]`

| Lane | Contenuto | Finestra / cap |
|---|---|---|
| `<rules>` | regole always-context, ordinate per severità (hard > strong > soft) | tutte |
| `<current_aim>` | il task puntato da `CURR` (l'obiettivo corrente) | 1 |
| `<task_list>` | task aperti (in_progress + pending) | cap 20 + segnale `(+N…)` |
| `<verify_queue>` | verifiche pendenti | tutte le pending |
| `<vars>` | variabili shared (+ private opz.), più recenti prima | cap 12 + segnale `(+N…)` |
| `<recent_changes>` | change-log: chi/quando/cosa | **finestra 15 min** + cap 12 + segnale |
| `<notes count=N>` | memo/lezioni: **silenti** nel flusso, solo segnalate | conteggio (richiamo via `recall_lessons`) |

## Walkthrough richiesta-per-richiesta (output del demo) `[EXTRACTED]`

### REQUEST #1 — sessione fresca, `vars.db` vuoto

È *esattamente* ciò che ha visto Sonnet su sessione nuova: solo le 3 regole seed, nessun obiettivo, nessun task.

```xml
<context>
  <rules>
    - [hard] Mai esfiltrare segreti o contenuti sensibili.
    - [hard] Azioni distruttive: pre-flight (reversibile? dipendenze? backup?), HALT se irreversibile.
    - [soft] Pensiero STRUTTURATO (marker [V]/[A]/[?]); risposta all'utente in prosa.
  </rules>
  <current_aim>(nessuno)</current_aim>
  <task_list>
  </task_list>
  <recent_changes>
    - 0s fa, orchestrator: rules/no-secret-exfil.text =Mai esfiltrare segreti…
    - 0s fa, orchestrator: rules/pre-flight-destructive.text =…
    - 0s fa, orchestrator: rules/structured-thinking.text =…
  </recent_changes>
</context>
```
`messages = [ user: «implementa POST /users» ]`

> Le 3 righe `<recent_changes>` qui sono il **rumore del seeding rules** che finisce nel change-log su DB fresco (minor wart — vedi gap-table sotto). L'ordine delle `<rules>` è quello reale del demo (tiebreaker `localeCompare` sull'id: `no-secret-exfil` < `pre-flight-destructive`).

### REQUEST #2 — dopo che il turno-1 ha scritto stato

Il modello, nel turno 1, ha usato i nostri tool (`set_curr` / `add_task` / `set_var`). Lo stato ora compare nel `<context>` della richiesta **successiva**:

```xml
<context>
  <rules> … invariate … </rules>
  <current_aim id="t1" status="in_progress">Implementare endpoint POST /users</current_aim>
  <task_list>
    - [in_progress] t1: Implementare endpoint POST /users
    - [pending] t2: Aggiungere validazione input
  </task_list>
  <vars>
    - api_auth="JWT" (scope=shared, 0s fa, per D1)
  </vars>
  <recent_changes> … cronologia mutazioni, la più recente in cima … </recent_changes>
</context>
```
`messages = [ user#1, assistant#1(+tool_calls), tool_results…, user#2 ]`  ← **cresce ad ogni turno**

### REQUEST #3 — verifiche + memo silente

```xml
<context>
  <rules> … </rules>
  <current_aim id="t1" status="in_progress">Implementare endpoint POST /users</current_aim>
  <task_list>
    - [in_progress] t1: Implementare endpoint POST /users
    - [pending] t2: Aggiungere validazione input
  </task_list>
  <verify_queue>
    - v1 (task t1): pytest tests/test_users.py
  </verify_queue>
  <vars>
    - db_schema_has_email=true (scope=shared, 0s fa)
    - api_auth="JWT" (scope=shared, 0s fa, per D1)
  </vars>
  <recent_changes> … </recent_changes>
  <notes count="1">1 lezione-memo disponibile (non mostrata qui) — usa recall_lessons</notes>
</context>
```
`messages` continua a crescere → **quando supera la soglia, pi AUTO-COMPATTA** (summarize i vecchi + tiene i recenti). La compaction tocca **solo** i `messages`; il nostro `<context>` **non cambia** (è ricostruito dal DB).

### NUOVA SESSIONE — chiudi pi, riapri (nuovo processo, **stesso** `vars.db`)

```xml
<context>
  … lo STATO sopravvive: current_aim=t1, task_list (t1,t2), verify_queue (v1), vars (api_auth, db_schema_has_email) …
</context>
```
`messages = [ ]`  ← **VUOTO**: pi **non** ha ripreso la conversazione precedente (sessione nuova).

> ⚠️ **Ecco il "ricomincio da zero" di Sonnet**: lo **stato** persiste (il `vars.db` è su disco), ma la **conversazione** no, e **manca un digest di resume** che dica "da dove riparti".

### REQUEST a +1 GIORNO — `recent_changes` si SVUOTA

```xml
<context>
  … current_aim / task_list / vars restano …
  (nessun <recent_changes>: tutti i cambi sono > 15 min → fuori finestra)
</context>
```
> ⚠️ **Gap**: dopo un gap reale di sessione, la lane "cosa è successo di recente" è **vuota** (finestra 15 min). Serve la lane `<resuming_from>` che legga lo stato **senza** quel cutoff.

## Cosa è NOSTRO vs cosa è di PI `[EXTRACTED]`

| Aspetto | Chi lo gestisce | Persistenza |
|---|---|---|
| `<context>` (rules/aim/task/vars/changes/notes) | **NOSTRO** (`context-assembler` + `vars-queue`) | `vars.db` (SQLite) — sopravvive a compact **e** a nuova sessione |
| Conversazione (array messaggi) | **PI** (nativo) | session-file di pi — sopravvive **dentro** la sessione e attraverso la compaction; **non** ripresa da un nuovo processo senza resume esplicito |
| Compaction (summarize a soglia) | **PI** (nativo, `shouldCompact` + `keepRecentTokens`) | il summary entra nel session-file |
| Secrets-guardrail / pre-flight / contradiction / sliding-var / error-memo | **NOSTRO** (extensions) | via `vars-queue` dove applicabile |

## Cosa fa pi nativamente (verificato nel package) `[EXTRACTED]`

- **Conversazione**: array messaggi nativo, salvato su session-file (`SessionManager` / `SessionEntry`).
- **Auto-compaction**: `shouldCompact(contextTokens, contextWindow, settings)` + `DEFAULT_COMPACTION_SETTINGS {enabled, reserveTokens, keepRecentTokens}`. Quando il contesto supera la soglia → `compact()` genera un summary LLM dei messaggi vecchi e tiene i recenti. **Default attivo.**
- **`/compact` manuale**: l'utente può forzarla.
- **Hook a disposizione delle extensions** (rilevanti qui):
  - `before_agent_start` → **dove iniettiamo oggi** il `<context>` (prepend al system prompt).
  - `context` → *"Fired before each LLM call. Can modify messages"* (`messages: AgentMessage[]`, types.d.ts:482-486): un'extension **può leggere e modificare l'array messaggi** prima dell'invio. È il punto dove una futura lane `<messages_with_user>` serializzerebbe gli ultimi X. *(NB: `before_provider_request`, types.d.ts:488-491, opera invece sul `payload: unknown` grezzo — "Can replace the payload" — e NON espone `messages`.)*
  - `session_before_compact` (`SessionBeforeCompactEvent`, cancellabile/customizzabile; può ritornare `compaction?: CompactionResult`) e `session_compact` (after): possiamo **flushare l'handoff** prima della compaction e/o iniettare il **nostro** summary.
  - `ExtensionActions.compact(options?)` → *"Trigger compaction without awaiting completion"*: un'extension/tool **può triggerare** la compaction programmaticamente.

## Gap noti e stato del fix `[INFERRED]`

| Gap | Causa | Fix | Stato |
|---|---|---|---|
| **A — "where we left off"** | conversazione non ripresa + manca `<resuming_from>` + `recent_changes` 15 min si svuota | lane resume-digest (legge aim+task+decisioni+handoff senza cutoff, self-gating sul tempo) | 🔨 funzione fatta+testata (`context-assembler.mjs:67-107`, suite verde), non ancora wirata nell'extension/demo |
| **B — "no autocompact su richiesta del modello"** | pi compatta a soglia e ha `/compact` manuale, ma **il modello non ha un tool** | tool `request_compaction` → `actions.compact()` + flush handoff su `session_before_compact` | 🔨 pianificato (`.pi/extensions/self-compaction.ts`) |
| **C — conversazione non nel nostro formato** | la lane conversazione del design **non è implementata**; ci appoggiamo a pi-native | ✅ Strada 2 (B) — [[../decisions/2026-06-29-context-as-first-person-mind]] | ✅ risolta (vedi sotto) |
| minor — seed-rules nel change-log | il seeding genera entry in `recent_changes` su DB fresco | seed silent o escludere dal change-log | 📋 todo |

## La decisione architetturale — chi possiede la conversazione? → ✅ RISOLTA: Strada 2 `[EXTRACTED]`

> **RISOLTA 2026-06-29** (utente TG msg 424): scelta **Strada 2 (B)** → [[../decisions/2026-06-29-context-as-first-person-mind]]. Il `<context>` è la **mente in prima persona** del modello (auto-curata); la conversazione è persistita per **ID** (sopravvive al compact + condivisibile coi subagent); la **compaction nativa di pi si spegne** e si sostituisce con una compaction "a **matrioska**" (nested-vision). Le opzioni sotto restano per traccia storica.

Era il punto che richiedeva la scelta dell'utente (è il train-serve-match dell'[[../decisions/2026-06-29-headroom-evaluation|ADR headroom]]):

- **A — pi-native (stato attuale)**: pi possiede messaggi+compaction+sessione; noi aggiungiamo lo STATO sopra. Semplice. *Ma* la chat **non** è nel nostro formato `<context>` → un SLM addestrato sul nostro formato non vedrà i messaggi come "nostro contesto" (**mismatch train-serve** sui messaggi); niente resume conversazione cross-sessione.
- **B — noi possediamo la conversazione (il design originale utente)**: via l'hook `context` serializziamo gli ultimi X messaggi in una lane `<messages_with_user>` nel nostro formato, persistiamo nel nostro store, controlliamo finestra e compaction. **Controllo pieno + train-serve match.** *Ma* combatte i sistemi nativi di pi (doppia gestione), più lavoro.
- **Ibrido (raccomandato)**: pi resta il **trasporto** dei messaggi; noi aggiungiamo (1) `<resuming_from>`, (2) `request_compaction`, (3) handoff-flush su `session_before_compact`. La lane `<messages_with_user>` nostra si costruisce **solo se/quando** si conferma B.

## Come riprodurre

```bash
node harness/src/_demo-context-evolution.mjs
```
Stampa i blocchi `<context>` reali per REQUEST #1 → #2 → #3 → nuova-sessione → +1 giorno.

## Collegamenti

- [[../concepts/wrapper-context-assembly-example]] — il design completo delle lane (incl. la lane conversazione non ancora implementata).
- [[../concepts/cross-session-state-sharing]] — cross-compact + cross-agent del vars-queue (lo STATO che sopravvive).
- [[../concepts/structured-context-sections]] — la teoria delle sezioni del `<context>`.
- [[../decisions/2026-06-23-pi-harness-base]] — base pi + lista hook.
- [[../decisions/2026-06-29-headroom-evaluation]] — context-compression + train-serve-match.
- `harness/src/_demo-context-evolution.mjs` — il demo riproducibile.
- `wiki/todo.md` §NEXT BUILD — item-0 (resume-lane), item-0b (request_compaction + handoff), decisione conversazione.
