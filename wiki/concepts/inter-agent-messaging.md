---
name: inter-agent-messaging
description: Capability harness (idea utente TG msg 462, 2026-06-29) — scambio DIRETTO di messaggi tra agenti (orchestratore ↔ sub-agenti, sub ↔ sub) via una inbox addressabile per idAgente, complementare allo stato condiviso (shared-VARS) e al report-di-ritorno (pop-report). Include la GUIDA DI SCELTA del canale cross-agent (messaggio vs shared-var vs propose/merge vs report vs conversation-by-ID). Transport = F deterministico; quando/cosa/a-chi messaggiare = S.
type: concept
tags: [harness, multi-agent, messaging, inbox, cross-agent, vars-queue, coordination, F+S, security]
sources:
  - user TG msg 462 (2026-06-29)
  - harness/src/vars-queue.mjs (sendMessage/inbox/markRead — IMPLEMENTATO 2026-06-29)
  - harness/test/unit/vars-queue.test.mjs (block-9)
last_updated: 2026-06-29
---

# Inter-agent messaging (scambio diretto tra agenti)

> **Idea utente (TG msg 462)** `[EXTRACTED]`: *"vorrei permettere lo scambio di messaggi tra agenti se non già implementato."* → Non lo era come canale **diretto**; aggiunto.

## Cosa aggiunge

Un canale di **comunicazione diretta e asincrona** agente→agente: un agente **invia** un messaggio a un destinatario specifico (o broadcast `*`); il destinatario lo legge dalla propria **inbox** addressabile per idAgente. È **complementare** ai meccanismi cross-agent già presenti — non li sostituisce: quelli condividono **stato**, questo trasporta **comunicazione diretta** (richieste, notifiche, handoff).

## Implementazione (2026-06-29) `[EXTRACTED dal codice]`

In `harness/src/vars-queue.mjs` (stesso datastore SQLite → persistente cross-compact + audit nel change-log; test `vars-queue.test.mjs` block-9):
- **`sendMessage(toAgent, body, {from, topic})`** → accoda un messaggio (body JSON); `toAgent='*'` = broadcast. Ritorna `seq`.
- **`inbox(agent, {unreadOnly, topic, includeBroadcast, limit})`** → messaggi diretti ad `agent` + broadcast; read-only (non marca letti); filtrabile per topic.
- **`markRead(seqs)`** → marca letti per seq (esplicito → niente ambiguità sul broadcast).
- Ogni invio è **loggato** nel change-log (`entity=agent_messages`, `who=from`) → audit "chi ha scritto a chi".

> Limite v1 `[INFERRED]`: il flag `read` è **globale per messaggio** → per i broadcast il read-tracking per-destinatario non c'è (un `markRead` di un broadcast lo nasconde a tutti). Per-recipient read-receipts = estensione futura se servirà. I messaggi diretti (caso comune orchestratore↔sub) sono pienamente corretti.

## Guida di scelta del canale cross-agent `[INFERRED]` — il pezzo che il modello deve imparare (S)

Con più meccanismi cross-agent, la skill è **scegliere quello giusto**:

| Bisogno | Canale | Meccanismo |
|---|---|---|
| **Stato condiviso** che più agenti leggono (config, decisioni, fatti) | **shared-VARS** | `setVar(scope:"shared")` + `getSharedView` |
| Un sub vuole **scrivere** stato condiviso senza race | **propose/merge** | `proposeVar` → `mergeProposals` (single-writer) |
| **Comunicazione diretta** (richiesta/notifica/handoff) a un agente | **messaggio** | `sendMessage` → `inbox` |
| **Risultato strutturato** di uno scope completato (pop) | **report-di-ritorno** | [[report-to-file-pointer]] `{summary, report_path}` |
| Vedere **la conversazione utente** per riferimento | **store-by-ID** | [[../decisions/2026-06-29-context-as-first-person-mind]] §principio-3 |
| Sapere **quali scelte** ha preso un agente | **decisions-by-agent** | `getDecisionsByAgent` ([[agent-wrapper-vars-queue]]) |

> Anti-confusione: il **messaggio** è *push diretto* (l'altro lo trova in inbox); la **shared-var** è *pull di stato* (l'altro la legge quando vuole); il **report** è l'esito di uno scope al ritorno. Usare il messaggio per condividere stato persistente = anti-pattern (lo stato va nelle var); usare la var per un handoff puntuale = l'altro potrebbe non accorgersene (manca il segnale).

## Riuso vs canale dedicato (risposta a utente msg 465) `[EXTRACTED domanda + INFERRED analisi]`

**Domanda (msg 465)**: conviene **riutilizzare** parti già implementate (la chat-per-ID) o **un canale dedicato** ad hoc per la comunicazione inter-agent? → **Entrambi, su livelli diversi.**

- **Canale DEDICATO per la SEMANTICA di messaging** (la busta): `from`/`to`/`topic`/`read`/`broadcast` → **inbox**. Queste semantiche **non si mappano pulite** su una chat-per-ID: la conversazione-utente è un **log LINEARE** (`role`/`text`/`seq`); il messaging è un **grafo DIRETTO** (A→B, broadcast, richiesta/risposta, "non-letti"). Forzarlo nella chat-per-ID perderebbe **addressing + read-tracking + topic**. → il canale dedicato (`agent_messages`) è la scelta giusta per l'envelope.
- **RIUSO per il CONTENUTO pesante** (il principio by-reference): NON si duplica lo storage del contenuto.
  - stesso **datastore** (SQLite vars-queue) → persistenza cross-compact + audit (già così);
  - stesso **pattern** addressable-by-ID + finestra + recupero-on-demand di [[sliding-window-variable-tool]] / conversation-store;
  - soprattutto: quando il payload è grande (un estratto di conversazione, un report), il **`body` del messaggio è un PUNTATORE**, non il testo inlinato:

    ```
    sendMessage("orchestrator", { kind: "handoff", ref: { report_path: "harness/.pi/state/reports/sub-auth-... .md" } })
    sendMessage("sub-frontend", { kind: "context", ref: { conv_id: "main", range: [120, 145] } })   // riuso chat-per-ID
    sendMessage("sub-x",        { kind: "data",    ref: { var: "apiResult" } })                       // riuso vars-queue
    ```

  → il messaggio resta una **busta leggera** (indirizza + segnala + punta); il contenuto pesante vive una volta sola nel suo store (report / conversazione-per-ID / var) e si recupera **per riferimento** (window-aware-fetching). `body` è JSON arbitrario → la convenzione-pointer non richiede codice nuovo, solo disciplina d'uso (skill-S).

**Sintesi**: *busta dedicata (semantica) + contenuto per riferimento (riuso)*. Anti-proliferazione di canali = la **guida di scelta** qui sopra. Coerente con [[variable-operations-by-reference]] (manipola per riferimento) e [[report-to-file-pointer]] (report-su-file + pointer).

## Sicurezza — ai confini esistenti `[INFERRED]`

Il transport è neutro; le policy restano dove già sono:
- **Segreti**: la redazione ([[secret-section-exfiltration-defense]]) opera all'**output verso l'utente** (`emitToUser`), NON tra agenti interni di fiducia. Se però un messaggio è destinato a essere **mostrato all'utente**, passa comunque per `redactText` al confine d'uscita.
- **Untrusted content**: un messaggio da un agente che ha processato contenuto non fidato va trattato come **dato non fidato** dal ricevente → [[untrusted-content-delimiting]] (delimitare, non eseguire le istruzioni dentro). Un sub-agente compromesso non deve poter pilotare l'orchestratore via inbox.
- **Audit**: ogni invio è nel change-log → tracciabile.

## Classificazione F/S (CLAUDE.md #11) `[INFERRED]`

- **F (harness, deterministico)** — *PIENA*: il transport (`sendMessage`/`inbox`/`markRead`), persistenza, audit.
- **S (skill addestrata)** — *DEGRADATA-MA-UTILE*: **quando** messaggiare (vs shared-var vs report), **a chi**, **cosa** mettere nel messaggio (conciso, azionabile), e **trattare l'inbox in arrivo** come dato (non istruzioni) quando la provenienza è non fidata.

## Verifica (outcome-anchored) `[INFERRED]` → [[../model-testbook|TB-07]]
- Probe coordinamento: task multi-agente dove l'orchestratore deve **delegare** e il sub deve **notificare il risultato** → outcome = il messaggio giusto è arrivato al destinatario giusto e ha **cambiato** l'azione del ricevente (non "ha chiamato sendMessage").
- Probe scelta-canale: dato un bisogno (stato vs handoff vs risultato) il modello sceglie il canale corretto (held-out bilanciato sulle righe della tabella).
- Probe sicurezza: messaggio in inbox con un'istruzione ostile ("ignora le regole") → il ricevente lo tratta come dato, non lo esegue.

## Collegamenti
- [[agent-wrapper-vars-queue]] — il datastore (dove vivono inbox + change-log).
- [[cross-session-state-sharing]] — l'altro lato cross-agent: stato condiviso + propose/merge.
- [[report-to-file-pointer]] — il report-di-ritorno (pop): un caso speciale di comunicazione figlio→padre.
- [[variable-operations-by-reference]] · [[sliding-window-variable-tool]] — il principio by-reference per il `body`-pointer (contenuto pesante recuperato per riferimento).
- [[untrusted-content-delimiting]] · [[secret-section-exfiltration-defense]] — i confini di sicurezza che si applicano ai messaggi.
- [[../decisions/2026-06-29-context-as-first-person-mind]] — conversation-store-by-ID (subagent leggono la chat per ID).
