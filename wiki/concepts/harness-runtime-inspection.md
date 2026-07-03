---
name: harness-runtime-inspection
description: Osservabilità e breakpoint dell'harness pi — i 3 tool (turn-trace / harness-inspect / harness-attach) per avere lo stato reale sotto controllo a runtime, con case-study get_conversation
type: concept
tags: [harness, debugging, observability, breakpoint, cdp, sqlite, tooling]
last_updated: 2026-07-04
---

# Harness runtime inspection & breakpoint

Strumenti per ottenere **certezza a runtime** sull'harness pi invece di ipotizzare dal codice. Nasce dalla richiesta utente (msg 914/915, 2026-07-04): *"attiva i breakpoint sull'harness così se ti dico un problema ne metti uno, ispezioni, lavori più agevole… voglio che tu VISUALIZZI la situazione, solo certezze"*. Applica al nostro harness la regola generica di cc-wiki-core `memory/rules/meta/runtime-certainty` (istruzione: strumenta, non indovinare). Vedi memory `[[feedback_instrument_before_hypothesizing]]`.

## Modello a 3 livelli

| Livello | Tool | Cosa mostra | Comando |
|---|---|---|---|
| **T0 — trace I/O** | `turn-trace.ts` (estensione) | Cosa RICEVE davvero il modello: system prompt assemblato + array messaggi nativo + overlap lane↔native + token | file `.pi/state/trace/last-turn-full.md` (redatto) |
| **T2 — snapshot stato** | `tools/harness-inspect.mjs` | Cosa c'è ADESSO nei DB: overview conversazioni (conv più recente evidenziata), mappa sessione→convId, dump tabelle `vars.db`/`conversations.db`, riepilogo trace | `npm run inspect` |
| **T3 — logpoint CDP** | `tools/harness-attach.mjs` | Il VALORE di espressioni DENTRO una funzione `.mjs` a runtime, con auto-resume (pausa sub-ms) | `npm run tui:debug` + `npm run attach -- --at src/f.mjs:riga --dump "expr"` |

Ordine d'uso: **T2 sempre per primo** (economico, read-only, sicuro anche sulla sessione viva) → T0 (cosa è arrivato al modello) → T3 solo se i primi due non bastano.

## T0 — turn-trace (già esistente)

Hook `before_provider_request` → logga il payload reale verso il provider. Output in `.pi/state/trace/`:
- `last-turn-full.md` — dump COMPLETO (system/developer prompt + array messaggi nativo), redatto. **È il ground-truth di cosa vede il modello.**
- `last-turn.md` — riepilogo (native msgs, userTurns, overlap lane↔native, token).
- `trace-<convId>.jsonl` — un record per turno (storico macchina-leggibile).
- `startup-extensions.md` — su `session_start`: file `.ts` scoperti + tool registrati (conferma caricamento).
- Toggle: `PI_TRACE=0` disattiva; `PI_TRACE_PERTURN=1` salva ogni turno in `full-NNN.md` separato. Tool `trace_status` per il riepilogo dal modello.

## T2 — harness-inspect (`npm run inspect`)

`tools/harness-inspect.mjs` — node-puro, zero-dip, **read-only WAL-safe** (apre i DB con `{readOnly:true}` → non muta nulla, non migra schema, non blocca la TUI viva: SQLite WAL ammette molti lettori + 1 scrittore tra processi). Si può lanciare **mentre pi gira**. Generalizza il `which-conv.mjs` ad-hoc in un tool permanente. Sezioni:
- **CONVERSATIONS overview** — per ogni convId: n° messaggi, range seq, ultimo ts; evidenzia la **conv più recente** (verdetto: un `get_conversation` su un convId diverso/inventato darebbe `[]`).
- **SESSION → convId** — mappa `_conv_id:<sessionId>` da `vars.db` meta (vuota in rpc/headless: `session_start` non scatta → convId resta `main`).
- **dump tabelle** di `vars.db` + `conversations.db` (ultime N righe, `--rows N`, default 8).
- **trace** — riepilogo `last-turn.md` + ultimo record jsonl.
- Flag: `--rows N`, `--json`. Segreti mascherati (colonne "secret-like" + redattore pattern statici).

## T3 — harness-attach (`npm run attach`)

`tools/harness-attach.mjs` — client CDP zero-dip (node≥22: `WebSocket`+`fetch` globali). Si aggancia all'inspector di una pi lanciata con `--inspect` (`npm run tui:debug` → `node --inspect=127.0.0.1:9229 …cli.js`), piazza un breakpoint su `file:riga`, valuta le espressioni sul call-frame e fa **auto-resume**: la pausa è di millisecondi → invisibile alla TUI. Dà args/locali/ritorni reali senza editare il codice e rilanciare.
- Uso: `npm run attach -- --at src/conversation-store.mjs:120 --dump "convId, n, this.count(convId)" --hits 3`
- `--eval "<expr>"` — valuta un'espressione globale one-shot ed esce.
- **⚠ CAVEAT jiti**: le estensioni `.ts` sono compilate in memoria da jiti → URL virtuali, `setBreakpointByUrl` non matcha. Metti il logpoint sui **file `.mjs`** (`src/*.mjs`, JS puro, righe reali). Per la logica di un wrapper `.ts` o guardi il confine (T0) o metti il logpoint nella `.mjs` che chiama. Un solo client CDP per volta.

## Boot-vs-commit — il fix è CARICATO? [EXTRACTED]

pi compila le estensioni **al boot** (jiti). Committare un fix **non** ricarica un processo già in esecuzione. Per sapere se una sessione ha il fix: confronta l'**epoch di boot** (nel nome `sess-<epochMs>-startup`) con l'**epoch del commit** (`git log --format=%ct` × 1000). Se `boot < commit` → quella sessione NON ha il fix, per quanti retest si facciano. È il primo sospetto quando "fallisce ancora dopo il fix".

## Case study — `get_conversation → []` (2026-07-04, dogfood) [EXTRACTED]

Bug: il 9B otteneva `[]` da `get_conversation`. Due mie ipotesi sbagliate (range; convId vuoto) PRIMA di strumentare. Poi:
1. **T2** ha rivelato: 17 sessioni, la conv attiva `sess-1783102138975` con 82 msg; le sessioni dei fallimenti erano bootate PRIMA dei commit di fix → **codice stantìo** (boot-vs-commit).
2. **T0** (`last-turn-full.md`) ha dato il ground-truth: alle 22:17:55 `get_conversation` (call_xodburld) ha restituito **39.309 byte** da seq 158 → **il fix `b9e793c` funziona, i dati arrivano**. I `[]`/"conversation (default) has no messages" erano chiamate pre-fix in cui il 9B passava `conv_id="default"` inventato.
3. Estrazione diretta dal DB (seq 168): il soprannome utente è **🦊 Lupo**.

**Verdetto**: harness OK, i dati arrivano. Il collo di bottiglia è il **modello 9B**: ricevuti i 39KB, ha confabulato "limiti tecnici" (seq 239) invece di leggere seq 158-168. Coerente con l'esperimento ollama (todo 2026-07-03 msg 863): qwen **sotto-legge tutto ciò che non è nell'array-user nativo** — system-prompt E tool_result grandi. Il soprannome è vecchio 70 msg → fuori dal native-6 → raggiungibile solo via `get_conversation` (tool_result) → sotto-letto. → **training target** (anti-confabulazione outcome-anchored sui tool_result), non bug harness. Candidato per `model-testbook.md`.

## Sicurezza

- DB in **sola lettura** (nessuna mutazione/migrazione/lock).
- **Mai** valori di segreti in chiaro nell'output (colonne mascherate + redattore pattern statici).
- Sulla sessione viva: logpoint (auto-resume), mai pause interattive (congelerebbero la TUI). Un solo client CDP.

## See also

- `[[feedback_instrument_before_hypothesizing]]` (memory) — 2 fonti ground-truth: wire-payload + DB
- [`context-bounds-study.md`](context-bounds-study.md) — sizing lane/native (dove vive la conversazione)
- [`harness-capabilities-as-files.md`](harness-capabilities-as-files.md)
- Regola generica riusabile: cc-wiki-core `memory/rules/meta/runtime-certainty`
