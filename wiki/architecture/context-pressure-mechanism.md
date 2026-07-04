---
name: context-pressure-mechanism
description: "Come funziona DAVVERO la pressione-contesto nell'harness: catena getContextUsage→percent→classifyPressure→consumatori, floor, keepTurns, soglie. Mappa verificata dal codice + misure reali. Base per il fix A2 (split onesto config-driven)."
type: architecture
status: current
tags: [harness, context-pressure, nested-compact, token-pressure, focus, matrioska, keepTurns, A2]
last_updated: 2026-07-04
sources:
  - "Workflow understand→design→verify wf_ed7e6e5f-a51 (2026-07-04), review adversariale"
  - "Misure driver RPC su qwen3.5:9b (2026-07-04)"
---

# Meccanismo di pressione-contesto (stato REALE, 2026-07-04)

> Documentato per NON ri-analizzare ogni volta ([[feedback_document_findings_always]], utente msg 995). Mappa dal workflow `wf_ed7e6e5f-a51` + misure reali. Confidence: [EXTRACTED] = letto nel codice, [INFERRED] = dedotto.

## Catena del segnale [EXTRACTED]

1. **READ** — `context-assembly.ts:141` `usage = ctx.getContextUsage()` → `{ tokens, contextWindow }`. Stesso getter: `focus_status` tool (`nested-compact.ts:103`), `turn-trace.ts:49` (diagnostico).
2. **COSA MISURA `getContextUsage()`** [EXTRACTED] — pi `agent-session.js:2405-2444`. `contextWindow = model.contextWindow` (finestra PIENA). `tokens = estimateContextTokens(this.messages)`. **CRUCIALE**: `estimateContextTokens` (`compaction.js:123-148`) NON somma ingenuamente la history: àncora su `getLastAssistantUsageInfo` = **la usage REALE fatturata dall'ultima richiesta** (già finestrata da native-window), + i soli messaggi trailing. Compaction nativa OFF (`.pi/settings.json`) → nessuna compaction-entry, path stabile.
   - ⇒ **L'ipotesi "la history-fantasma non-vista gonfia `percent`" è REFUTATA**: i turni più vecchi di keepTurns sono windowed-out del billing E stanno prima dell'anchor → non entrano nel conteggio. Se manca una usage valida → `tokens=null` → `percent=null` → asse-token=none (fail-safe).
3. **METRICHE** — `collectMetrics` (`nested-compact.mjs:51-66`): `percent = tokens / (contextWindow*(1-outputReservePct))`; `watchCount = openTasks + pendingVerifs`. `sharedVars`/`recentChanges` calcolati ma NON usati nella classificazione.
4. **CLASSIFICAZIONE** — `classifyPressure` (`nested-compact.mjs:69-80`): due ladder in **OR-max**. Token: `percent≥tokenMatrioskaPct(0.75)`→matrioska, `≥tokenReorderPct(0.55)`→reorder. Watch: `watchCount≥watchMatrioska(25)`→matrioska, `≥watchReorder(12)`→reorder. `evaluateTrigger` degrada matrioska→reorder a depth saturo.
5. **SOGLIE** (`DEFAULT_CFG`, `nested-compact.mjs:27-41`): tokenReorderPct=0.55, tokenMatrioskaPct=0.75, watchReorder=12, watchMatrioska=25, focusK=5, maxDepth=3, cooldownMs=90000, outputReservePct=0.

## Consumatori del segnale [EXTRACTED]

- **maybeAutoFocus** (autofocus.mode='auto', `context-assembly.ts:152`→`nested-compact.mjs:182-198`): se recommend=='matrioska' e nessuno scope aperto → ENTRA in focus da solo sui top-focusK task ready.
- **`<focus_hint>`** (autofocus.mode='nudge', DEFAULT, `context-assembly.ts:168-181`): emesso su recommend=='matrioska' & cooldown; mostra al modello `ctx="<round(percent*100)>%"` + `watch=watchCount`.
- **`<reorganize_hint>`** (`context-assembly.ts:182-186`): su recommend=='reorder'; anch'esso mostra `ctx="X%"` + watch.
- **focus_status** tool (`nested-compact.ts:97-110`): on-demand, pressure=recommend + watch.
- **turn-trace** (`turn-trace.ts:43-55`): consumatore PASSIVO/diagnostico; registra `contextFraction=tokens/contextWindow` + `systemLen` reale in `.pi/state/trace/`.
- **session_before_compact** (`nested-compact.ts:116-119`): NON legge percent; annulla solo su reason=='threshold' (con compaction OFF non scatta mai).

## Floor + growable [EXTRACTED/INFERRED]

- **Floor (fisso, ~ogni turno)**: base pi prompt + tool-schema + rules lane + i 3 blocchi AWARENESS gated da `laneMemoryHint` (default ON): `MEMORY_AWARENESS <how_memory_works>` (~2.4K char), `MEMORY_TAIL <reminder>` (~1K char), `RESOURCES_LANE <resources>` (~0.8K char) (`context-assembly.ts:49-99`). `laneMemoryHint:false` toglie ~4K char per modelli grandi.
- **Growable CAPPATO (lane curate)**: messagesCharCap=4000, maxVars=12, maxChanges=12, maxTasks=20, tool_calls=8, facts=12 → ceiling ~2K token. [INFERRED]
- **Growable NON cappato = array NATIVO** (`nativeKeepTurns` turni, con i loro **tool_result NON cappati**): è il vero termine variabile. [EXTRACTED/INFERRED]

## keepTurns — stato REALE (attenzione ai commenti stale) [EXTRACTED]

- **Default REALE = 6** (`harness-config.mjs:51 nativeKeepTurns: 6`; raise utente msg 863). Config-driven via `.pi/harness.config.json` o env `HARNESS_NATIVE_KEEP_TURNS`.
- **DEBITO**: `context-assembly.ts:43`, `native-window.ts:22`, `eviction-checkpoint.ts:46` hanno fallback `?? 1` (literal statico incoerente col default 6 — dead fallback perché `loadHarnessConfig` popola sempre il campo) + MOLTI commenti dicono "keepTurns:1" (stale, dall'era pre-raise). Da rendere config-driven (fallback = `DEFAULT_HARNESS_CONFIG.nativeKeepTurns`, mai un magic 6/1). [feedback utente msg 993]
- Complementarità: la lane `<messages_with_user>` mostra SOLO i turni più vecchi del K-esimo (`nthLastUserSeq`); l'array nativo mostra gli ultimi K → niente doppia-chat.

## Misure reali (driver RPC, qwen3.5:9b, finestra riportata 262144) [EXTRACTED]

| Sessione | system prompt | contesto | % | note |
|---|---|---|---|---|
| Fresca (2 turni) | 13.345 char (~3.3K tok) | 6.662 tok | **3%** | pochi task/var |
| Loaded (3 turni, 20 msg nativi tool-heavy) | 14.270 char (~3.6K tok) | 8.418 tok | **3%** | read/write/bash/find |

**Letture**: (a) floor STABILE ~3.3-3.6K tok; (b) su finestra grande l'**asse-token è INERTE** (3%, mai vicino a 0.55/0.75) → il firing verrebbe SOLO dall'asse-watch; (c) il "floor fisso 6-8K token" era SOVRASTIMATO (l'intero system è ~3.5K tok). ⇒ [[project_test_model_vs_target|target 27B a finestra grande]]: occupancy praticamente inerte in uso normale; **watchCount è il driver realistico** di focus/reorg. (D3 convId isolation ri-validato: ogni run = un solo conv_id.)

## Il DIFETTO reale (non quello ipotizzato)

Non "focus spurio da history-fantasma" (refutato). Il difetto è: **l'OR-max fonde due assi ORTOGONALI** — `work` (carico-lavoro = watchCount, illimitato) e `occupancy` (pienezza fisica del contesto) — in un solo `recommend`, e mostra al modello un `ctx=X%` **fuorviante** (i token anche quando a scattare è stato il carico-task). Su finestra grande l'asse-token è morto → tutto è watch-driven ma il modello vede una % che non c'entra. [EXTRACTED dal workflow + confermato dalle misure]

## Decisione A2 (fix, 2026-07-04) → [[decisions/2026-07-04-a2-context-pressure-honest-split]]

**Split onesto, config-driven, backward-compatible** (strategia scelta dopo delega utente msg 997): `classifyPressure` ritorna `{work, occ, recommend}` (2 assi separati); nuovo config `pressureDriver` (default "max" = firing attuale invariato = zero nuovi problemi; opzioni "work"/"occupancy"); reporting ONESTO al modello (`watch=N/soglia` intero quando work-driven, `ctx=X%` quando occupancy-driven); keepTurns-dependent → `cfg.nativeKeepTurns`, mai literal. **NON** si costruisce la macchina floor-decomposition/reducibility-gate (over-engineering per il regime reale; tracciata in [[todo]]). Casi limite (keepTurns=1, percent=null, watch=0) analizzati + testati.

## Links

[[decisions/2026-07-04-a2-context-pressure-honest-split]] · [[architecture/matrioska-orchestration-spec]] · [[architecture/harness-request-flow]] · [[project_test_model_vs_target]] · [[feedback_document_findings_always]] · workflow `wf_ed7e6e5f-a51`.
