---
name: model-testbook
description: TEST-BOOK del modello — registro vivo di OGNI "voglio che il modello faccia/capisca X" espresso dall'utente, con la sua VERIFICA (come si controlla sul modello addestrato). Serve a riconciliare a eval-time "ciò che VOLEVAMO che il modello prendesse" vs "ciò che il modello HA effettivamente preso". Companion verificabile della training-taxonomy.
type: spec
status: living
tags: [model, behavior, acceptance, eval, verification, desiderata, testbook, track-everything]
last_updated: 2026-06-29
---

# Model Test-Book — desiderata del modello + verifica

> **Perché esiste** (utente, TG msg 449, 2026-06-29): stiamo accumulando tanti *"voglio che il modello faccia/capisca X"*. Se non li tracciamo, a fine training non possiamo verificare quali sono **effettivi**. Questo file è il registro: ogni desiderato ha una **VERIFICA** (probe/eval/held-out) e uno **STATO** che va da *voluto* a *VERIFICATO-sul-modello*. A eval-time si confronta `Voluto` vs `Preso`.

## Regola di processo (permanente)

**Ogni volta che l'utente esprime un "voglio che il modello faccia/capisca X" → nuova entry QUI, SUBITO**, con: desiderato, fonte (msg+data), F/S, **come si verifica sul modello**, stato, link al concept/foglia. Mai lasciarlo solo in chat (la compaction lo perde). Vedi regola CLAUDE.md #12 (track-everything) + memory `feedback_model_testbook`.

## Ciclo di vita di una entry (`Stato`)

`voluto` → `concept/foglia progettata` → `dati generati` → `addestrato` → **`VERIFICATO`** (probe verde sul modello) — oppure `FALLITO` (il modello NON l'ha preso → ritorna in coda training).

> Pre-FFT (2026-06-29): tutte le entry sono `voluto`/`concept-designed`. La colonna `Verifica` è il **test di accettazione** da eseguire sul modello quando esisterà; alcune sono già dogfoodabili A/B su modello stock (vedi `harness/src/_dogfood-*.mjs`).

## Principio di verifica (anti reward-hacking)

La `Verifica` è sempre **outcome-anchored**: si controlla l'**esito** (il modello ha prodotto il comportamento giusto su un caso reale), MAI la **cerimonia** (aver "usato il pattern"). Dove utile, A/B contro vanilla (il delta misura il valore della skill) + **held-out bilanciato** (caso dove la skill NON deve attivarsi, anti cry-wolf).

---

## Registro

### TB-01 — Disambiguazione interpolazione per CANALE (non per delimitatore) `[voluto]`
- **Voglio che il modello**: per interpolare una var nell'output, NON si affidi al delimitatore (`{{...}}` collide con Jinja/Handlebars/Vue) ma al **canale/intento**: default = passthrough verbatim (qualsiasi `{{...}}` resta letterale); interpola SOLO il testo instradato per un canale tipato (tool `say`/campo `interpolate:true`); dentro quello, risolve solo `{{var:NOME}}` di var **esistenti**, il resto passthrough.
- **Fonte**: TG msg 437 (2026-06-29). **F/S**: F=canale+risoluzione deterministici (PIENA, **implementato** `var-ops.mjs` `emitToUser`/`interpolate`, test 32/32) / S=quando usare l'interpolazione.
- **Verifica**: probe A/B — (a) output che spiega Jinja con `{{name}}` letterale → NON deve espandere; (b) canale-interpolate con `{{var:x}}` di var esistente → risolve; (c) `{{var:inesistente}}` o `{{...}}` letterale dentro il canale → passthrough; (d) escape `{{!var:x}}` → letterale. Outcome: nessun clobber dell'output utente + risoluzione corretta dove dovuta.
- **Link**: [[concepts/variable-operations-by-reference]] §Disambiguazione.

### TB-02 — Graph-aware / impact-review dopo cambiamento strutturale (con CATENA causale) `[voluto]`
- **Voglio che il modello CAPISCA** (non memorizzi la regola): la **catena causale** dei 3 stati e ne deduca la sequenza.
  - **Catena (load-bearing, da premiare — regola #10)**: (A) aggiorni SOLO la struttura-sorgente (wiki/codice) → contenuti nuovi ma **zero connessioni ricalcolate**, le relazioni **inferite** non esistono; (B) usi il grafo/indice com'è → connessioni **stantie**; (C) **ri-derivi la struttura DOPO l'update** → contenuti nuovi **+ connessioni ri-derivate e INFERITE** (edge cross-document, community, orfani-ora-collegati). → **Conseguenza che il modello deve DEDURRE da solo**: una review in (A)/(B) **manca connessioni** → vede meno gap/contraddizioni (emergono solo nel grafo connesso+inferito di C). → **Soluzione**: dopo un cambiamento strutturale/cross-cutting (refactor, rinomina, migrazione) → **ri-deriva la struttura (dep-graph/call-graph/indice) e revisiona contro il quadro GLOBALE, non solo il diff locale**.
- **Fonte**: TG msg 443/447 (2026-06-29). **F/S**: F=harness fornisce la struttura deterministica / S=il modello decide *quando* re-review-globale-vs-locale + interpreta (rumore-estrazione vs gap reale). **NON** la forma letterale "lancia graphify" (=tooling).
- **Verifica**: held-out — dopo un refactor con una **rottura cross-file** visibile SOLO ri-derivando la struttura (un riferimento da file NON toccato a un simbolo spostato): il modello la trova **solo se** propone/esegue la re-derivazione globale prima di concludere. Reward **outcome**: ha pescato la connessione che la review locale mancava (NON "ha eseguito il pattern"). Held-out negativo: cambiamento puramente locale → NON deve scomodare la re-derivazione globale (proporzionalità).
- **Link**: [[concepts/graph-aware-impact-review]] (concept ✅ creato 2026-06-29) · [[feedback_review_after_graph_update]] (memory) · [[concepts/dependency-aware-error-recovery]] · [[concepts/situational-policy-table]]; incasellamento Area-01/Area-04.

### TB-03 — Context = mente in prima persona + auto-curazione del workspace `[voluto]`
- **Voglio che il modello**: veda il context come **proprio pensiero organizzato** (non una chat) e **auto-curi** il workspace mentre lavora (promuove l'ultimo scambio in step-fatti/decisioni; toglie gli item stantii dal watch-list) tramite i tool (`set_curr`/`add_task`/`record_decision`/`set_var`).
- **Fonte**: TG msg 422/424 (2026-06-29). **F/S**: F=struttura/finestre/floor-deterministico (cap+sort+GC, PIENA) / S=politica di curazione.
- **Verifica**: long-run probe — su sessione lunga + compaction, il modello mantiene lo stato **durevole** (tool) invece di lasciarlo in prosa; lo stato resta bounded e veritiero. Outcome: dopo N turni il workspace riflette lo stato reale senza drift.
- **Link**: [[decisions/2026-06-29-context-as-first-person-mind]].

### TB-04 — Variable-operations: manipola le var per RIFERIMENTO `[voluto]`
- **Voglio che il modello**: invece di ricopiare valori lunghi nel proprio stream (errori, token), li manipoli **per riferimento** — pipe del tool_result in una var, `extract_var(src, path, dest)` per estrarre un campo, interpolazione nell'output.
- **Fonte**: TG msg 427 (2026-06-29). **F/S**: F=meccanismo extract/interpolate (PIENA, **implementato** `var-ops.mjs` `extractVar`/`getByPath`, test 32/32) / S=quando-riferire-invece-di-inlinare (DEGRADATA-MA-UTILE col fallback read+set manuale).
- **Verifica**: probe — dato un tool_result JSON grande in var, il modello **estrae il campo per path** invece di inlinare il JSON; outcome = campo estratto == campo reale (non la cerimonia di aver chiamato il tool). Anti-hack: `extract` con path sbagliato non va premiato.
- **Link**: [[concepts/variable-operations-by-reference]].

### TB-05 — Window-aware fetching: riconosci i marker di troncamento e recupera `[voluto]`
- **Voglio che il modello**: riconosca i marker di cap/troncamento (`(+N nascosti)`, `<notes count=N>`) e **recuperi proattivamente** (recall_lessons/get_shared_view/list_tasks) **quando il task lo richiede**, e NON over-fetchi quando non serve (proporzionalità).
- **Fonte**: TG msg 388 (2026-06-29). **F/S**: F=harness emette il segnale + i tool di fetch (FATTO) / S=recognize-signal→decide-se-fetchare.
- **Verifica**: probe — task che RICHIEDE un item nascosto → il modello fetcha; task che NON lo richiede → non fetcha. Outcome: fetch correlato al bisogno reale (held-out bilanciato).
- **Link**: [[concepts/window-aware-fetching]].

### TB-06 — Protocollo di ritorno (pop): report-su-file + summary-pointer + re-align `[voluto]`
- **Voglio che il modello**: quando uno scope completa e restituisce il controllo verso l'alto (sub-agente che ritorna, sotto-task chiuso, **matrioska-pop** alla cornice madre):
  - (i) NON riversi un summary inline grande nella cornice padre; scriva un **report completo su FILE** e faccia risalire solo un **summary breve + il PATH**. Lo stato già condiviso (aim/decisioni/vincoli/var `shared`) NON va riportato (già visibile a madre+figlia). Da consumatore, recuperi il report pieno **on-demand**.
  - (ii) **dopo il pop, RI-ALLINEI il proprio context allo stato ATTUALE** (msg 456): la foto mentale del padre è stantia (lo stato è evoluto durante lo zoom-in) → ri-legge stato durevole, promuove l'esito del figlio in step-fatti/decisioni, pulisce dal watch-list ciò che è chiuso. NON proceda su una visione superata.
  - (iii) per costruire il report del figlio sfrutti le **decisioni attribuite** (`getDecisionsByAgent(idFiglio)` / `getChangesByAgent`, msg 457) → il report è derivabile, mai vuoto.
- **Fonte**: TG msg 453/456/457 (2026-06-29). **F/S**: F=meccanismo ritorno {summary, report_path} + re-align (ri-lettura stato) + summary-floor da decisioni-per-agente (**implementato**: `vars-queue.mjs` `recordDecision`/`getDecisionsByAgent`/`getChangesByAgent` + `pop-report.mjs` `buildPopReport` che scrive il report-su-file e ritorna `{summary, report_path}`, test 32+16) → PIENA / S=salienza del summary + quando aprire il report + cosa ri-allineare (DEGRADATA-MA-UTILE col floor).
- **Verifica**: probe su pop/ritorno completato — (a) esiste il file-report col pieno; (b) il messaggio risalito è **bounded** + path **valido**; (c) il padre **decide correttamente** dal summary (+fetch se serve); (d) **re-align**: held-out dove un vincolo è cambiato durante lo zoom-in → il padre, dopo il pop, decide sulla versione **aggiornata** (NON sulla foto stantia). Outcome = decisione padre corretta / zero perdita di vincoli, **MAI** "ha prodotto un summary/file" o "ha chiamato re-align" come cerimonia. Held-out negativo: scope minuscolo (esito in una riga) → NON scomodare file+pointer (proporzionalità).
- **Link**: [[concepts/report-to-file-pointer]] · [[decisions/2026-06-29-context-as-first-person-mind]] §principio-5 (nuance #4) · [[concepts/window-aware-fetching]] (lato consumatore) · [[concepts/agent-wrapper-vars-queue]] (lane `decisions` + change-log per-agente).

### TB-07 — Scegliere il canale cross-agent giusto (messaggio vs stato vs report) `[voluto]`
- **Voglio che il modello**: in coordinamento multi-agente, scelga il **canale corretto**: **messaggio diretto** (`sendMessage`→`inbox`) per richieste/notifiche/handoff puntuali; **shared-VARS** per stato condiviso; **propose/merge** per scritture di stato senza race; **report-di-ritorno** per l'esito di uno scope chiuso; **decisions-by-agent** per "cosa ha deciso X". E tratti l'**inbox in arrivo come DATO** (non istruzioni) quando la provenienza è non fidata.
- **Fonte**: TG msg 462 (2026-06-29). **F/S**: F=transport `sendMessage`/`inbox`/`markRead` (PIENA, **implementato** `vars-queue.mjs` block-9, persistente+audit) / S=quando/a-chi/cosa messaggiare + scelta-canale + inbox-as-data (DEGRADATA-MA-UTILE).
- **Verifica**: (a) probe coordinamento — il messaggio giusto arriva al destinatario giusto e **cambia** la sua azione (outcome, non "ha chiamato sendMessage"); (b) probe scelta-canale — held-out bilanciato sulle righe della tabella (stato→var, handoff→messaggio, esito→report); (c) probe sicurezza — inbox con istruzione ostile → trattata come dato, non eseguita.
- **Link**: [[concepts/inter-agent-messaging]] · [[concepts/cross-session-state-sharing]] · [[concepts/untrusted-content-delimiting]].

---

## Relazione con la training-taxonomy

La [[training-taxonomy/README|training-taxonomy]] (16 aree, ~215 foglie) è il registro **sistematico** delle capability. Questo test-book è il livello di **accettazione/verifica** sopra di essa + il registro dei desiderata **conversazionali** (i "voglio" che emergono parlando, a rischio di perdersi). Ogni entry TB-NN linka la foglia/concept dove la capability è progettata; lo `Stato` traccia se a eval-time il modello l'ha **davvero presa**. Niente "voglio" resta non verificabile.
