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

## Stato implementazione

- [x] Meccanismo documentato ([[architecture/context-pressure-mechanism]]).
- [ ] Refactor `classifyPressure`/`evaluateTrigger` → `{work,occ,recommend}` + `pressureDriver`.
- [ ] Reporting onesto in `context-assembly.ts` (focus_hint/reorganize_hint) + focus_status.
- [ ] keepTurns literal → config default (3 file) + commenti.
- [ ] Test (split + edge keepTurns=1) + typecheck + validazione driver.

## Links

[[architecture/context-pressure-mechanism]] · [[project_test_model_vs_target]] · [[feedback_optimization_first]] · [[feedback_document_findings_always]] · workflow `wf_ed7e6e5f-a51`.
