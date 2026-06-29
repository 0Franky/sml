---
name: matrioska-orchestration-spec
description: Spec implementabile della nested-compact "a matrioska" (zoom-in/pop/re-align), prodotto dall'analisi con agente specializzato (2026-06-29, richiesta utente msg 464). Divide in core node-pure (harness/src/nested-compact.mjs) + thin extension (.pi/extensions/nested-compact.ts). Sblocca il codice della matrioska. NB: 2 open-question richiedono una scelta utente prima dell'implementazione.
type: architecture
status: spec-ready (da implementare; 2 open-question aperte per l'utente)
tags: [harness, matrioska, nested-compact, context, pop-report, strada-2, spec]
sources:
  - "[[../decisions/2026-06-29-context-as-first-person-mind]] §principio-5"
  - "[[../concepts/report-to-file-pointer]]"
  - analisi agente specializzato (review-loop 2026-06-29)
last_updated: 2026-06-29
---

# Matrioska nested-compact — spec di orchestrazione

> Pattern: **core deterministico node-pure** `harness/src/nested-compact.mjs` (testabile senza pi, come `pop-report.mjs`) + **thin extension** `.pi/extensions/nested-compact.ts` (solo wiring). Riusa as-is: `buildPopReport` (floor-F), la lane `decisions` + `getDecisionsByAgent`/`getChangesByAgent`, `compaction.enabled:false`.

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

## ⚠️ OPEN QUESTIONS — richiedono scelta utente PRIMA di implementare
- **OQ-A (chi sceglie il sub-set del focus)**: **modello** (S-policy: `enter_focus(task_ids)`, ADR principio-2 "il modello cura il suo workspace") **vs harness auto-enter** su un subset deterministico (floor-F più forte, optimization-first) quando il modello non agisce. *Reco: model-initiated + `<focus_hint>` harness; auto-enter solo come fallback opt-in.*
- **OQ-B (storage focus-stack)**: **table `focus_frames`** (queryable, stile schema esistente, +1 migration) **vs** `meta.focus_stack` JSON (zero-schema-churn). *Reco: table.*
- **OQ-C (calibrazione soglie)**: tutti i numeri `[CALIBRATE]` (0.55/0.75, 12/25, focusK=5, cooldown 90s) sono first-principles → pass empirico sui dogfood (ADR difersce già "soglie da calibrare").
