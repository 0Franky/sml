---
name: 2026-07-04-a2-context-pressure-honest-split
description: "A2 fix: spezzare l'OR-max della pressione-contesto in 2 assi ortogonali (work + occupancy) config-driven, con reporting ONESTO al modello e keepTurns legato alla config. NON costruire la macchina floor (over-engineering)."
type: decision
status: accepted
tags: [A2, context-pressure, nested-compact, config-driven, honest-signal, keepTurns]
last_updated: 2026-07-04
sources:
  - "Workflow wf_ed7e6e5f-a51 (understand→design→verify) + review adversariale"
  - "Misure driver RPC 2026-07-04 (Misura 1/2)"
  - "Utente TG msg 993/995/997 (2026-07-04)"
---

# ADR — A2: split onesto della pressione-contesto (config-driven, no macchina-floor)

## Contesto [EXTRACTED]

Meccanismo reale in [[architecture/context-pressure-mechanism]]. L'ipotesi originale (A2: "history-fantasma gonfia `percent` → focus spurio") è **REFUTATA** dal codice: `getContextUsage` àncora sulla usage reale già finestrata. Misure reali (driver 9B): contesto **3%** su finestra 262144 sia fresco (6.7K tok) sia loaded tool-heavy (8.4K tok); floor stabile ~3.5K tok. Su [[project_test_model_vs_target|target a finestra grande]] l'asse-token è di fatto INERTE.

## Decisione [EXTRACTED]

Il difetto reale è che `classifyPressure` fonde in **OR-max** due assi ORTOGONALI — `work` (watchCount, carico-lavoro) e `occupancy` (pienezza fisica) — e mostra al modello un `ctx=X%` **fuorviante** (token anche quando a scattare è il carico-task). Fix = **split onesto, config-driven, backward-compatible** (strategia A, delega utente msg 997 "procedi con A se migliora a prescindere senza crearne altri"):

1. `classifyPressure` ritorna `{ work, occ, recommend }` (2 ladder separate, non un max opaco).
2. **Config `pressureDriver`** (in `trigger`): `"max"` (DEFAULT = firing attuale INVARIATO → zero nuovi problemi) · `"work"` · `"occupancy"`. Selezionabile, non hardcoded.
3. **Reporting ONESTO** al modello: quando driver=work mostra `watch=N/soglia` (intero azionabile); quando driver=occupancy mostra `ctx=X%`. Basta col % fuorviante nei nudge (`context-assembly.ts:169,185`).
4. **keepTurns config-driven**: ogni logica che dipende dai turni nativi legata a `cfg.nativeKeepTurns` (fallback = `DEFAULT_HARNESS_CONFIG.nativeKeepTurns`), MAI a un literal 6/1. Fix dei `?? 1` morti in `context-assembly.ts:43`/`native-window.ts:22`/`eviction-checkpoint.ts:46` + correzione commenti stale "keepTurns:1".
5. Casi limite analizzati + testati: **keepTurns=1** (array nativo=1 turno, occupancy piccola, work invariato — watchCount è indipendente da keepTurns), `percent=null` (occ=none fail-safe), `watchCount=0` (nessun focus se driver=work).

## NON facciamo (over-engineering) [EXTRACTED]

La macchina **floor-decomposition + reducibility-gate + EWMA-calibration** (candidati workflow): NON giustificata dal regime reale (floor ~1.4% su finestra grande; occupancy inerte). Tracciata in [[todo]] per quando un target a finestra piccola la mostri necessaria. Principio [[feedback_optimization_first|optimization-first]]: non over-gatare.

## Perché non cambia il comportamento di default

`pressureDriver` default `"max"` = identico OR-max attuale per il FIRING; cambia SOLO il reporting (onesto) e la struttura (2 assi esposti). Nessuna regressione; il valore (onestà del segnale + config-drivenness + keepTurns pulito) è realizzato a prescindere. Il tuning del driver ("work" per target a finestra grande) è una scelta successiva sul dato.

## Stato implementazione — ✅ FATTO 2026-07-04 (commit A2, dopo il refactor SSOT/DRY)

- [x] Meccanismo documentato ([[architecture/context-pressure-mechanism]]).
- [x] Refactor: `classifyAxes(metrics,cfg) → {work,occ}` + `pickDriver(work,occ,driver)` + `pressureReason(...)`; `classifyPressure` resta BACKWARD-COMPAT (ritorna la stringa-livello, ora `pickDriver(...cfg.pressureDriver)`, default "max" = OR-max INVARIATO); `evaluateTrigger` espone additivamente `work/occ/driver/reason`. (`src/nested-compact.mjs` + `.d.mts`.)
- [x] Config `pressureDriver` in `DEFAULT_CFG` (trigger) = "max"; validazione enum file+env (`PRESSURE_DRIVERS`, `HARNESS_PRESSURE_DRIVER`) in `harness-config.mjs`; esposto nell'example.json.
- [x] Reporting ONESTO: `focus_hint`/`reorganize_hint` (`context-assembly.ts`) mostrano `reason=` + `watch="N/soglia"` azionabile + `ctx=X%` SOLO se `occ≠none` (niente % red-herring quando scatta il task-backlog); `focus_status` arricchito con reason/driver/work/occ.
- [x] keepTurns literal → config: già fatto nel refactor SSOT/DRY (commit `e3c426b`, `?? 1`/as any rimossi).
- [x] Test: 22 A2 (classifyAxes/pickDriver/pressureReason + evaluateTrigger espone assi + edge percent=null→occ=none, watchCount=0→work=none, driver isola l'asse, max=OR) in `nested-compact.test.mjs` (105/0) + 5 config (`harness-config.test.mjs` 58/0). typecheck 0, suite 37/0.
- [ ] **Validazione driver LIVE (residua)**: il firing è default-preserving (max) + backward-compat testato; la RESA del nudge sotto pressione (reason/watch-soglia) va confermata con un run del driver 9B in stato di pressione (≥25 task open) — non ancora eseguita.

## Links

[[architecture/context-pressure-mechanism]] · [[project_test_model_vs_target]] · [[feedback_optimization_first]] · [[feedback_document_findings_always]] · workflow `wf_ed7e6e5f-a51`.
