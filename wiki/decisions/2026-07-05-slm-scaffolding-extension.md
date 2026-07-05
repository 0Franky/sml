---
name: 2026-07-05-slm-scaffolding-extension
description: "ADR: separare TUTTE le 'pezze per il modello' (hint/nudge/scaffolding che un modello capace non dovrebbe servirgli) in un'estensione pi DEDICATA `slm`, tenendo il CORE ai soli meccanismi. Modello grande → non la installa (contesto lean); SLM early-training → la installa; man mano che impara → si disinstalla (scaffold che recede, misurabile)."
type: decision
status: accepted
tags: [architecture, harness, slm, scaffold-recedes, lean-context, training-vs-harness, modularity, h6]
last_updated: 2026-07-05
sources:
  - "Utente TG msg 1069 (2026-07-04): estensione slm separata + modularizzabile"
  - "Findings sessione: H6 ([[concepts/adaptive-context-injection]]), fissazione ([[concepts/anti-fixation-metacognition-rung]])"
---

# ADR — Estensione `slm`: separare le pezze-per-il-modello dal core

**Status**: accepted (2026-07-05) · **Deciso da**: utente msg 1069 + sintesi.

## Contesto

I finding di sessione (H6: il `<context>` da 12.7K char, in gran parte scaffolding-memoria, DILUISCE il ragionamento del modello piccolo su task self-contained; + fissazione HE/145) mostrano che gli **hint/nudge/scaffolding** che aiutano un modello DEBOLE possono essere **rumore dannoso** per uno capace, e comunque sono **crutch temporanei** (il fix vero è il training che li interiorizza). Servono in modo ADATTIVO, non always-on. Finora vivono mescolati nel core (context-assembly), non separabili.

## Decisione

**Tutte le pezze-per-il-modello vanno in un'ESTENSIONE pi DEDICATA `slm`; il CORE tiene solo i MECCANISMI.**

### Criterio di classificazione (per ogni pezzo dell'harness)
- **CRUTCH / HINT / NUDGE** — istruisce/ricorda al modello un comportamento che dovrebbe **interiorizzare** → **estensione `slm`**.
- **MECCANISMO** — assembla contesto / persiste stato / applica safety / isola → **CORE (sempre-on)**.

Mappa sull'asse training-vs-harness ([[feedback_training_vs_harness_classification]], regola #11): il MECCANISMO `F-harness` = core; lo SCAFFOLDING che copre una `S`-skill-non-ancora-addestrata = `slm` (e RECEDE col training).

### Ripartizione iniziale
| → estensione `slm` (pezze) | → CORE (meccanismi) |
|---|---|
| `how_memory_works` (checklist verbosa anti-amnesia, semplificata) | context-assembly (lane rendering) |
| nudge "set aim / task_list" | vars-queue (persistenza stato/task) |
| rung anti-fissazione (stagnation-triggered) | secrets-guardrail + pre-flight safety |
| hint keepTurns-awareness / `set_keepturns` guidance | isolamento (`HARNESS_STATE_DIR`) |
| `laneMemoryHint` | keepTurns MECCANISMO (native-window) |
| | task-status MECCANISMO (+ enum validato) |

## Conseguenze

- **Modello capace (grande)** → NON installa `slm` → contesto LEAN, niente diluizione H6, niente rumore-scaffolding.
- **SLM early-training** → installa `slm` → riceve gli hint/crutch.
- **Scaffold-che-recede MISURABILE**: metrica = "si riesce a togliere/abbassare `slm` senza regressione?" → man mano che il training interiorizza i comportamenti, `slm` si disinstalla (anche per un SLM). Una pezza è permanente; uno scaffold modulare che si auto-estingue è l'opposto ([[feedback_reward_hacking_principle]] filosofia layer-3).
- **Anti-guscio-inerte**: `slm` è dichiaratamente un contenitore di CRUTCH (target di training), non feature permanenti.
- **Costo**: refactor dell'harness live → va fatto con **wiring-test** per pezzo (regola #14/#15), non alla cieca (il 9B stand-in dipende da `how_memory_works` per l'amnesia → non rimuoverlo senza ri-test).

## Alternative considerate
- **Flag/config per ogni hint** (invece di un'estensione unica): più granulare ma frammentato + gli hint restano nel core (non davvero rimovibili) → scartato a favore del confine netto estensione/core.
- **Sempre-on con relevance-gating interno**: utile ma non risolve la modularità per-modello (il grande porta comunque il codice) → complementare, non sostitutivo.

## Stato realizzazione (2026-07-05)

**MODULARITÀ PIENA REALIZZATA + E2E-validata.** Il confine estensione/core è concreto, non solo un flag:
- `.pi/extensions/slm.ts` è l'unità di install (pi carica ogni file in `.pi/extensions/`). REGISTRA lo scaffolding via `registerScaffolding(level, opts)` in `src/slm-scaffolding.mjs` (livello dalla config: `laneMemoryHint`=false→off, altrimenti `laneMemoryHintLevel` full/lean).
- Il CORE (`context-assembly.ts`) NON conosce il contenuto-crutch: legge **lazy per-turno** `getRegisteredScaffolding()` (registry vuoto se slm non installato → contesto core PULITO).
- **E2E (driver 9B)**: slm installato → `<how_memory_works …>` nel `last-turn-full.md`; slm off/assente → marker VERO assente (core pulito). ⚠️ nota metodologica: `turn-trace` scrive letteralmente "how_memory_works" nell'header del dump → per il check usare il testo VERO dello scaffolding, non il nome-tag.
- Contenuto `slm`: `how_memory_works`/`reminder`/`resources` (livelli full/lean/off) + nudge `set-aim-and-tasks` (via seed rules, categoria task) + `set_keepturns` guidance (nella tool-description). L'alternativa "config-only" (§Alternative) era scartata perché lasciava il codice nel core; qui il testo-crutch vive SOLO nell'estensione → genuinamente rimovibile.
- **Dial-down misurabile**: full→lean→off via config, poi rimozione del file; la metrica di "scaffold receded" = regressione E2E quando si abbassa/rimuove.

## Validazione / piano di build (ordine)
1. ADR (questo) → scheletro estensione `slm`.
2. Sposta `how_memory_works` in `slm` + **semplifica** (assenza-lane = segnale, no checklist verbosa) — [[concepts/adaptive-context-injection]].
3. Enum validato stati task {pending,in_progress,done,blocked,cancelled} (core; oggi `setTaskStatus` accetta stringa libera).
4. Categorizza `<rules>` per header ([safety] core, [memory] → `slm`).
5. Nudge "set aim/task_list" → `slm`.
6. **Context-invariant checker** (RL-time: aim non-vuoto a task attivo, stati ∈ enum, timestamp monotoni) — reward OUTCOME-anchored, non cerimonia.
7. Rung anti-fissazione → `slm` — [[concepts/anti-fixation-metacognition-rung]].
Ogni passo: unit + wiring-test + (dove tocca il modello) validazione driver.

## Links
[[concepts/adaptive-context-injection]] · [[concepts/anti-fixation-metacognition-rung]] · [[architecture/ab-eval-harness]] · [[architecture/context-pressure-mechanism]] · [[feedback_training_vs_harness_classification]] · [[feedback_reward_hacking_principle]]
