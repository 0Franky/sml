---
name: 2026-06-29-context-as-first-person-mind
description: ADR — il context dell'harness è la MENTE IN PRIMA PERSONA del modello, non una chat. Decisione "Strada 2" (la conversazione la gestiamo NOI, non pi-native), confermata dall'utente (TG msg 422/424, 2026-06-29). Il modello auto-cura il proprio workspace; la conversazione è persistita in store addressabile per ID (sopravvive al compact, condivisibile coi subagent); la compaction nativa di pi si spegne e si sostituisce con una compaction "a matrioska" (nested-vision) per i casi estremi. Risolve la decisione aperta di harness-request-flow + compaction-coherence.
type: decision
status: accepted (utente TG msg 424, 2026-06-29) — build da riorientare su questa cornice
tags: [harness, pi, context, first-person, strada-2, compaction, matrioska, conversation-store, subagents, train-serve, anti-context-rot]
sources:
  - user TG msg 422/424/425 (2026-06-29)
  - harness/src/context-assembler.mjs
  - harness/src/vars-queue.mjs
last_updated: 2026-06-29
---

# ADR — Il context è la mente in prima persona del modello (Strada 2)

> **Decisione confermata dall'utente** (TG msg 424, 2026-06-29): *"Certo è il modello che auto-cura il proprio context, chi meglio di lui sa come ragiona e di cosa ha bisogno."* Risolve la decisione aperta "chi possiede la conversazione" di [[../architecture/harness-request-flow]] → **Strada 2** (la gestiamo NOI).

## Contesto / problema

Il dogfood di Sonnet (2026-06-29) ha rivelato che l'harness, allo stato attuale, inietta **solo lo STATO** nel `<context>` e lascia la **conversazione** a pi (array messaggi nativo + compaction generica). Per un SLM **che addestriamo**, questo crea **mismatch train-serve** (il modello vedrebbe a runtime un formato — la chat grezza + il summary generico di pi — diverso da quello su cui è addestrato) e **context-rot** (la chat accumula rumore). Vedi [[2026-06-29-compaction-coherence]].

## Decisione (i 5 principi)

### 1. Il context È un workspace in prima persona, NON una chat `[EXTRACTED (msg 422: «inizia/finisce con context, non una chat») + INFERRED (mapping sulle lane)]`
Il modello non vede "messaggio dopo messaggio". Vede **una sola schermata mentale coerente** che inizia e finisce con `<context>`, contenente: **aim** + **cose-da-tenere-sott'occhio** (watch-list) + **step-fatti** + **step-successivi** + **stato-attuale** + **materiale di lavoro**, e — **in coda, come blocco `<messages_with_user>` separato e ultimo** (dopo il prefisso stabile) — gli **ultimi messaggi-utente** verbatim. È il *pensiero organizzato* del modello, non un log: «prima persona» = **un flusso logico coerente**, NON una stringa monolitica byte-stabile. Anti context-rot; forma-mentis focalizzata.

### 2. Auto-curazione: il MODELLO cura il proprio workspace `[EXTRACTED — utente msg 424]`
*"Chi meglio di lui sa come ragiona e di cosa ha bisogno."* Il modello mantiene il workspace **mentre lavora**, tramite i tool (`set_curr`/`add_task`/`record_decision`/`set_var`/…). L'harness fornisce la **struttura**, la **persistenza** e le **finestre** (cap + segnale); il modello decide *cosa* tenere in vista. È F+S: F = la struttura/i tool/le finestre (harness, deterministico); S = la *politica* di curazione (skill addestrata). **Stato-senza-training = DEGRADATA-MA-UTILE con floor F nominato**: anche senza emettere tool di curazione, l'harness applica housekeeping deterministico (cap+sort+GC + open-loop che esclude i done + promote-to-durable), già implementato in `context-assembler`/`vars-queue` e dimostrato dalle suite `test:scenarios` (organization/long-run: lo stato resta organizzato e bounded attraverso compaction multiple, senza modello). Vedi [[../concepts/training-vs-harness-classification]].

### 3. La conversazione è persistita in store addressabile per ID `[EXTRACTED — utente msg 425]`
*"La chat va a finire dentro un file o dentro il DB in modo che anche attraverso il compact o attraverso i subagents possano continuare a vedere la chat e passarsela tramite l'ID."* → La conversazione è un **artefatto memorizzato** (file/DB) con un **ID**: (a) **sopravvive al compact** (non vive solo nella finestra visibile); (b) **condivisibile coi subagent** per riferimento (passano l'ID, non il testo); (c) nel workspace se ne mostra una **finestra degli ultimi N messaggi VERBATIM** (no perdita delle parole esatte recenti) + un **marker recuperabile-per-ID** per il pieno. È lo stesso pattern di [[../concepts/sliding-window-variable-tool]] applicato **alla conversazione stessa**. *(Il **meccanismo** di accesso-per-ID dai subagent è `[AMBIGUOUS]`: [[../concepts/cross-session-state-sharing]] copre le **VARS** cross-agent, NON un conversation-store indirizzabile → serve un meccanismo NUOVO/estensione esplicita, vedi TODO build.)*

### 4. La compaction nativa di pi si SPEGNE; la gestiamo noi `[INFERRED]`
Con un workspace sempre curato e di dimensione limitata, **non esiste più "la chat lunga da riassumere col metodo generico di pi"**. → `CompactionSettings.enabled = false` (config pi); la riduzione di contesto diventa **curazione continua del workspace** nel NOSTRO formato. Chiude le 5 incoerenze di [[2026-06-29-compaction-coherence]] (niente più summary fatto dal modello-piccolo, niente formato estraneo, niente doppia-memoria scoordinata).

### 5. Compaction "a MATRIOSKA" (nested-vision) per i casi estremi `[EXTRACTED (idea-nucleo + citazione, msg 424) + INFERRED (formalizzazione zoom-in/out, cornice, riconciliazione)]`
Su progetti molto grossi le cose-da-tenere-sott'occhio/verificare/fare diventano troppe anche per un workspace curato. Allora:
- **Caso moderato**: basta un **riordino per priorità** dei task + lavorazione focalizzata (proporzionalità — non scomodare la compaction).
- **Caso complesso**: **compaction a matrioska** = (i) un **sub-workspace** con visione/scopo **ristretti** a un **sottoinsieme** di task/obiettivi (lo zoom-IN, focus sul corrente); + (ii) un **summary dello stato precedente** (cosa si stava facendo, obiettivi iniziali) = la **cornice esterna** che mantiene la visione generale (lo zoom-OUT). *"Quando ho tante cose da fare e non ci capisco più nulla, mi faccio una classifica delle primarie e mi focalizzo su quelle."*
- È **decomposizione gerarchica del context** ([[../concepts/task-decomposition-adhoc-context]]): la cornice esterna compressa-ma-veritiera + il sub-context focalizzato; a sottotask completato, i risultati **risalgono** alla cornice e si fa zoom-out.

## Valutazione onesta della matrioska (risposta alla domanda utente) `[INFERRED]`

**Sì, ha senso** — è essenzialmente *focus+context* / decomposizione gerarchica, ben fondata e allineata ai nostri concept. Pro: preserva la visione mentre si focalizza; scala a progetti grandi; rispecchia come un umano prioritizza sotto sovraccarico. **Nuance/rischi da gestire** (perché funzioni):
1. **Trigger**: quando passare da riordino-priorità → matrioska? Soglia su #item-in-watch/#task-aperti o su budget-token del workspace. La tua euristica "prima riordino, poi compact" è giusta (proporzionalità).
2. **Scelta del sottoinsieme**: la cornice esterna deve restare **veritiera** (non un riassunto che droppa vincoli/decisioni critiche) → la cornice si costruisce dallo **stato durevole** (aim/decisioni/vincoli), non da una sintesi lossy.
3. **Profondità limitata**: la matrioska non deve annidarsi all'infinito (**budget profondità ≤ 3**, come [[../concepts/situational-policy-table]] §budget-profondità).
4. **Ritorno-risultati**: a sottotask chiuso, il sub-context deve **riconciliare** i risultati nella cornice esterna (altrimenti si perde il lavoro fatto nello zoom-in).

→ Raccomandazione: **riordino-priorità come default**, **matrioska solo quando il riordino non basta**; cornice esterna derivata dallo stato durevole (veritiera per costruzione); profondità bounded; riconciliazione obbligatoria al ritorno.

→ *Le 4 nuance (trigger-threshold, algoritmo cornice-da-stato-durevole, depth-bound ≤3, meccanismo di riconciliazione) sono **rinviate al build** e tracciate come TODO atomici in [[../todo|todo §NEXT BUILD]] (regola no-half-work); qui restano `[INFERRED]`, da validare empiricamente.*

## Conseguenze / implicazioni sul build

- La lane **`<messages_with_user>`** (finestra verbatim ultimi-N + recupero-per-ID) — nel design ma **non implementata** — diventa il **pezzo centrale**, non opzionale.
- Serve un **conversation-store** (file/DB) con ID + finestra + recupero on-demand (riusa [[../concepts/sliding-window-variable-tool]] + `vars-queue`).
- `request_compaction` ([[../todo|todo §NEXT BUILD item-0b]]) diventa **`request_focus`/nested-compact** (zoom-in matrioska) oltre che trigger; la compaction nativa di pi si disabilita.
- **cache-stable-prefix** (item-1, ✅ FATTO 2026-06-29: `absoluteTimestamps` + anchor `<current_time>` + tiebreaker, smoke 18/18) resta valido: il workspace di Strada 2 eredita il contratto stabile-in-testa / volatile-in-fondo. **La finestra verbatim degli ultimi-N messaggi è intrinsecamente VOLATILE** (cambia a ogni turno) → va collocata nella **zona volatile in coda**, come blocco `<messages_with_user>` **separato e ultimo** (coerente con [[../concepts/wrapper-context-assembly-example]] che lo pone dopo `</context>`), così da NON spostare contenuto volatile dentro il prefisso che il KV-cache vuole stabile.
- **train-serve**: l'SLM si addestra ED è servito sullo STESSO workspace di prima persona → match perfetto (il fattore #1, motivo della scelta).

## Alternative considerate

- **Strada 1 — pi-native** (pi possiede chat+compaction, noi solo stato sopra): più semplice, ottima coi modelli grandi, **scartata** per il NOSTRO SLM (mismatch train-serve sui messaggi + compaction generica fatta dal modello-piccolo). Documentata in [[../architecture/harness-request-flow]] §decisione.
- **Compaction flat di pi** (summarize generico a soglia): **scartata** (formato estraneo, qualità dipendente dal modello-attivo, doppia-memoria scoordinata — [[2026-06-29-compaction-coherence]]).

## Collegamenti
- [[../architecture/harness-request-flow]] — il flusso richiesta-per-richiesta (questa ADR risolve la sua §decisione).
- [[2026-06-29-compaction-coherence]] — l'analisi che questa ADR chiude (pi-compaction off).
- [[../concepts/wrapper-context-assembly-example]] — design delle lane (la lane conversazione qui diventa centrale).
- [[../concepts/sliding-window-variable-tool]] · [[../concepts/cross-session-state-sharing]] — store-by-ID + finestra + cross-agent (principio 3).
- [[../concepts/task-decomposition-adhoc-context]] — la matrioska = decomposizione gerarchica del context (principio 5).
- [[../concepts/structured-context-sections]] · [[../concepts/structured-thinking]] — il workspace strutturato (principio 1).
- [[../concepts/training-vs-harness-classification]] — F (struttura/finestre/store) vs S (politica di curazione) del principio 2.
- [[../concepts/variable-operations-by-reference]] — data-flow per riferimento (extract_var/interpolazione) sulle var del workspace auto-curato.
