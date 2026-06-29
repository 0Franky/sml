---
name: matrioska-orchestration-spec
description: Spec implementabile della nested-compact "a matrioska" (zoom-in/pop/re-align), prodotto dall'analisi con agente specializzato (2026-06-29, richiesta utente msg 464). Divide in core node-pure (harness/src/nested-compact.mjs) + thin extension (.pi/extensions/nested-compact.ts). Sblocca il codice della matrioska. NB: 2 open-question richiedono una scelta utente prima dell'implementazione.
type: architecture
status: IMPLEMENTED 2026-06-29 (core node-pure `harness/src/nested-compact.mjs` + extension `nested-compact.ts` + 49 test; OQ-A/OQ-B risolte coi reco di default)
tags: [harness, matrioska, nested-compact, context, pop-report, strada-2, spec, implemented]
sources:
  - "[[../decisions/2026-06-29-context-as-first-person-mind]] §principio-5"
  - "[[../concepts/report-to-file-pointer]]"
  - analisi agente specializzato (review-loop 2026-06-29)
last_updated: 2026-06-29
---

# Matrioska nested-compact — spec di orchestrazione

> Pattern: **core deterministico node-pure** `harness/src/nested-compact.mjs` (testabile senza pi, come `pop-report.mjs`) + **thin extension** `.pi/extensions/nested-compact.ts` (solo wiring). Riusa as-is: `buildPopReport` (floor-F), la lane `decisions` + `getDecisionsByAgent`/`getChangesByAgent`, `compaction.enabled:false`.

## ✅ IMPLEMENTATO (2026-06-29)

Build completo (suite harness 15 file verde, typecheck verde, 28 tool 0-collisioni). File reali:
- **Core node-pure** `harness/src/nested-compact.mjs` (+ `.d.mts`): `DEFAULT_CFG`, `collectMetrics`, `classifyPressure`, `currentDepth`, `canEnter`, `evaluateTrigger`, `buildFrame`, `serializeFrame`, `getFocusStack`, `enterFocus`, `popFocus`, `realignParent`, `buildNestedWorkspace` — **firme esatte come §7**.
- **Datastore** `harness/src/vars-queue.mjs`: tabella `focus_frames` + CRUD (`createFocusFrame`/`getFocusFrame`/`listFocusFrames`/`closeFocusFrame`/`currentChangeSeq`) + **`active_scope`** (`setActiveScope`/`getActiveScope`, routing dell'attribuzione `who` in-scope — vedi sotto).
- **Context** `harness/src/context-assembler.mjs`: opt `focusTaskIds` → `<task_list>` filtrata al subset a fuoco.
- **Extension** `.pi/extensions/nested-compact.ts`: tool `enter_focus`/`pop_focus`/`focus_status` (F+S) + `session_before_compact` defensive (cancel SOLO su `threshold`, non su `manual`/`overflow` per non brickare il turno).
- **Injector unico** `.pi/extensions/context-assembly.ts`: matrioska-aware — se uno scope è aperto inietta `buildNestedWorkspace` (frame + context filtrato); altrimenti resume + context + `<focus_hint>` quando `evaluateTrigger` (token reale via `ctx.getContextUsage()` + watch) raccomanda matrioska.
- **Routing who** `.pi/extensions/vars-queue.ts`: i tool di mutazione (`set_var`/`set_task_status`/`record_decision`/`propose_var`/`send_message`) usano `who = getActiveScope() ?? agent` → le mutazioni in-scope sono attribuite allo scope-figlio → `buildPopReport` deriva i delta (floor-F mai vuoto). **Risolve in produzione il "handle-swap" dello spec §3 senza una 2ª connessione DB.**
- **Test** `harness/test/unit/nested-compact.test.mjs` (49): classifyPressure (tabella+OR+null-percent), depth-saturation→reorder, enterFocus depth-guard (×3 ok ×4 throw + nesting via active_scope), serializeFrame (constraints MAI troncate), popFocus round-trip (figlio→who=scope→report deriva · padre ottiene decisione promossa · task done esce dall'open-loop · CURR ripristinato · active_scope torna a root), realignParent (aim done→non ripristina), buildNestedWorkspace.

> **Variazione vs spec**: lo spec §3 prevedeva `new VarsQueue(DB, {agent: scopeId})` come handle in-scope; in implementazione si usa **`active_scope` in `meta`** (condiviso cross-extension via lo stesso file DB) + routing `who` nei tool — stessa semantica (attribuzione per-scope, no rollup, no double-count), senza aprire una seconda connessione (evita il leak del refactor DB-singleton pendente). il pop-report delimita i delta del figlio per **`since_seq` MONOTONO** (review-loop #2 2026-06-29: era `frame.entered` wall-clock → fragile a clock-skew/NTP-step; ora `getChangesByAgent`+`buildPopReport` accettano `sinceSeq` e filtrano `seq > ?`). LIFO-guard sul pop (no scope non-top con figli aperti); `enter_focus` rifiuta subset vuoto/ghost.

## (1) Trigger — entrambi (utente msg 464), first-to-fire wins

Segnali misurabili dal datastore + pi:
- `watchCount = openTasks(in_progress+pending) + pendingVerifs` = "#item-in-watch"
- `percent = ctx.getContextUsage().{tokens,contextWindow,percent}` = token-budget (pi lo fornisce diretto)

Ladder `none < reorder < matrioska` (soglie `[CALIBRATE]`):
- token: `<0.55` none · `<0.75` reorder · `≥0.75` matrioska (sotto la banda di compaction nativa)
- watch: `<12` none · `<25` reorder · `≥25` matrioska (12 ≈ cap `maxTasks` dove `<task_list>` tronca)
- `result = max(tokenLevel, watchLevel)` (OR-semantics)
- **reorder** = priority-sort top-K (default 5) + `<focus_hint>`, NESSUN child/depth. **matrioska** = escalation solo se reorder non basta.
- **Hysteresis anti-thrash**: `cooldownMs` (90s) + richiedi un reorder fallito + pressione `matrioska` per ≥2 valutazioni. `tokens==null` post-compaction → fallback solo-watch (mai escalare su null).

## (2) Frame (zoom-OUT) — truthful by construction, no summarization

`buildFrame(vq)` = letture dirette: `aim`=getCurr→getTask · `decisions`=listDecisions (choice+rationale) · `constraints`=listRules (**MAI troncati**, hard incluso) · `sharedState`=getSharedView (già visibile a entrambi → non si riporta) · `backlog`=open tasks fuori dal subset. Serializza `<frame depth="K">` con cap solo di DISPLAY (`+N — list_tasks`), mai di contenuto. Stabile → zona cache-stable prima del `<context>`.

## (3) Enter-focus (zoom-IN) — child agent identity + focus marker nello store

Nuova table `focus_frames(scope_id PK, parent_id, depth, aim_task, task_subset JSON, entered, status, since_seq)`. `enterFocus`: depth=parent+1 (throw se >3) · `scopeId="focus-"+currId+"-"+ts` (sanitized) · cattura `since_seq`=max changelog seq · CURR=lead del subset. **Meccanismo chiave**: in-scope la datastore handle è `new VarsQueue(DB, {agent: scopeId})` → ogni mutazione è stampata `who=scopeId` → il pop-report è derivabile e mai-vuoto (è ciò che `pop-report.mjs` già assume). Workspace in-scope = `serializeFrame + assembleContext(focusTaskIds=subset) + messagesLane`.

## (4) Pop — buildPopReport + re-align

1. `{summary, report_path} = buildPopReport(vq, scopeId, {since: since_seq})` (scopa esattamente i delta del figlio).
2. **promuove**: `recordDecision("pop-"+scopeId, summary, {who: parent, decisionRef: report_path})` (esito = decisione del padre, report per riferimento); le var `shared` del figlio sono già visibili (no copia).
3. close scope (`status='popped'`, depth decrementa).
4. **RE-ALIGN del padre** (foto stantia): re-`buildFrame`; ripristina CURR all'`aim_task` salvato **se ancora aperto**; i task che il figlio ha messo `done` escono dall'open-loop automaticamente (open-loop = pending+in_progress); switch handle agent→parent.

## (5) Depth-bound ≤3

`depth` in `focus_frames`; `currentDepth(vq)=max(depth) WHERE status='open'`. `enterFocus` throw se `childDepth>3`; il trigger NON raccomanda matrioska a depth≥3 → degrada a `reorder` (graceful). Ogni enter/pop è una decisione registrata → storia ricostruibile.

## (6) pi integration

- **Tool** (model-facing, F+S): `enter_focus({task_ids, reason?})` (guarded `canEnter` depth≤3) · `pop_focus({scope_id?})`.
- **Hook**: `before_agent_start` assembla frame+focused-context+messages quando uno scope è aperto + inietta `<focus_hint>` quando pressione=matrioska e nessuno scope aperto (auto-suggest = floor S graceful) · `turn_end`/`context` chiama `getContextUsage()`+`evaluateTrigger` e persiste il livello in un `memo` · `session_before_compact` **defensive `{cancel:true}`** (compaction nativa OFF, la matrioska è il sostituto).
- **NON** `fork()`/`newSession()` per lo scope: sono command-context + usano il summarizer generico di pi; lo scope dev'essere nostro (sopravvive al compact, `who`-attribuibile, condivide `shared` live). `fork` resta per futuri sub-agenti paralleli, non per lo zoom-in.

## (7) Testabilità — signatures `nested-compact.mjs` (node-pure)

```
collectMetrics(vq, {now, tokens, contextWindow}) -> {openTasks,pendingVerifs,sharedVars,recentChanges,watchCount,percent}
classifyPressure(metrics, cfg) -> "none"|"reorder"|"matrioska"
evaluateTrigger(vq, {now,tokens,contextWindow,currentDepth}, cfg) -> {level, recommend, depthSaturated}
buildFrame(vq, {now}) -> {aim,decisions,constraints,sharedState,backlog,depth,frameTs}
serializeFrame(frame, {absoluteTimestamps}) -> "<frame>…</frame>"
currentDepth(vq) -> int   ·   canEnter(vq, cfg) -> {ok,depth,reason?}
enterFocus(vq, {taskSubset, parentScopeId, now}, cfg) -> {scopeId,depth,sinceSeq}  (throw se depth>maxDepth)
getFocusStack(vq) -> [...]
popFocus(vq, scopeId, {reportDir,now}) -> {summary, report_path, promotedDecisionId, restoredCurr}
realignParent(vq, {parentScopeId, savedAimTask}) -> {aim, frame}
buildNestedWorkspace(vq, {store,convId,focusScopeId,now,absoluteTimestamps}) -> string
DEFAULT_CFG = {tokenReorderPct:0.55, tokenMatrioskaPct:0.75, watchReorder:12, watchMatrioska:25, focusK:5, maxDepth:3, cooldownMs:90_000}
```
Test node-pure (in-memory VarsQueue): classifyPressure (tabella + OR + depth-saturation→reorder) · enterFocus depth-guard (×3 ok, ×4 throw) · buildFrame (constraints mai troncati) · popFocus round-trip (figlio muta who=scope → report deriva i delta · padre ottiene decisione promossa · task done escono · CURR ripristinato) · realignParent (aim chiuso→non ripristina). **E2e (API-gated)**: registrazione tool + model che li chiama + `getContextUsage` reale + `session_before_compact {cancel:true}`.

## Files
- **New**: `harness/src/nested-compact.mjs` + `.d.mts` · `.pi/extensions/nested-compact.ts` · `test/unit/nested-compact.test.mjs` (+ integration scenario).
- **Edit**: `vars-queue.mjs` (table `focus_frames` + helper) · `context-assembler.mjs` (`assembleContext` opt `focusTaskIds`; `buildNestedWorkspace`).

## Rischi
1. **Thrash/oscillazione** (alto) → hysteresis (cooldown + reorder-fallito + persist≥2). 2. `getContextUsage().tokens==null` post-compaction → fallback solo-watch. 3. token pi vs workspace iniettato (Strada-2) → `max(piPercent, selfEstimate char/4)`. 4. frame growth a depth → display-cap backlog/decisions (constraints no). 5. convId='main' single-conversation (scope non segmenta la chat — accettabile v1). 6. re-align race (task completato esternamente) → ok se tutte le transizioni passano da `setTaskStatus`.

## ✅ OPEN QUESTIONS — RISOLTE (2026-06-29, utente "riprendi" coi reco di default)
- **OQ-A (chi sceglie il sub-set del focus)** → **RISOLTA = model-initiated** (`enter_focus(task_ids)`, ADR principio-2 "il modello cura il suo workspace") **+ `<focus_hint>` harness** quando la pressione raccomanda matrioska (auto-suggest = floor-S graceful; la DECISIONE resta del modello). Auto-enter deterministico NON implementato in v1 (resta fallback opt-in futuro se i dogfood mostrano che il modello non agisce sotto pressione).
- **OQ-B (storage focus-stack)** → **RISOLTA = table `focus_frames`** (queryable, stile schema esistente; +1 migration idempotente via `CREATE TABLE IF NOT EXISTS`).
- **OQ-C (calibrazione soglie)**: tutti i numeri `[CALIBRATE]` (0.55/0.75, 12/25, focusK=5, cooldown 90s) sono first-principles → pass empirico sui dogfood (ADR difersce già "soglie da calibrare"). **Aperta** (calibrazione, non blocca l'impl).

> **Resta (post-impl, non-blocking)**: (1) **hysteresis/cooldown** dell'extension (`cooldownMs` è in `DEFAULT_CFG` ma il gating anti-thrash 2-valutazioni è da cablare nell'hook se i dogfood mostrano oscillazione); (2) **lane `<messages_with_user>` nel nested workspace** (gated sul wiring full-Strada-2 della conversation-store nell'injector); (3) calibrazione soglie OQ-C.
