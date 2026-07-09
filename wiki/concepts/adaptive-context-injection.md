---
name: adaptive-context-injection
description: "Il contesto iniettato NON è gratis (specie per modelli piccoli): su task self-contained la scaffolding-memoria dell'harness può diluire il ragionamento e costare 3× token. Principio: iniezione ADATTIVA/lean + tool on-demand + modello reso regime-aware in training."
type: concept
tags: [context-assembly, optimization-first, context-window-sizing, small-model, keepturns, rl-training, reward-hacking, h6]
last_updated: 2026-07-05
sources:
  - "A/B tracciato HE/145 (harness/eval/, 2026-07-04): vanilla 2/2 PASS vs ours 4/4 FAIL, trace reale"
  - "Utente TG msg 1045 (tools vs buco), 1047 (keepTurns curriculum + regime-awareness), 1051 (read-temp-file tools), 2026-07-04"
  - "harness/eval/data/trace/he145/ + REPORT-he145-ours-k1.md"
---

# Adaptive context injection — il contesto non è gratis

## Finding che lo origina (H6) [EXTRACTED — n piccolo, non conclusivo]

A/B tracciato su **HumanEval/145** (order_by_points, task algoritmico self-contained) con gemini-3.1-flash-lite:
`vanilla` **2/2 PASS** (~15-19 turni, ~61K token) · `ours@keep1`+`ours@keep6` **4/4 FAIL** (~17 turni, **~185K token = 3×**).

**Meccanismo (dal trace reale)**: il modello nel braccio `ours` si **FISSA sul sotto-problema sbagliato** — fissa `digit_sum = sum(abs(n))` (errato per i negativi: -12→3 invece di -1+2=**1**), vede l'output sbagliato, e per ~10 turni permuta all'infinito il **tie-breaking** (`x<0`, `nums.index`, `reverse`…) invece di riquestionare la somma-cifre. Minimo locale: ottimizza il **sintomo** (ordine) invece della **causa** (somma dei negativi). Aveva avuto l'intuizione giusta ("negatives handled differently?") e l'ha **abbandonata**. `vanilla` (contesto lean 2.6K char) ha riquestionato il `digit_sum` e derivato la regola giusta. Report: `harness/eval/data/trace/REPORT-he145-ours-k1.md`.

**Ipotesi H6 [AMBIGUOUS]**: il `<context>` da **12.7K char** (`how_memory_works` + rules + facts-vuoto + task + current_aim + last_tool_calls + messages) è **puro scaffolding-memoria** per un task self-contained (nessuna memoria serve) → sembra **diluire il budget cognitivo** del modello piccolo (meno "step-back" per riquestionare l'assunzione) e costa 3× token. **Da confermare con n≥5** (con n=2 non si esclude la fortuna del sampling). NON è: convergenza-prematura (REFUTATA: 17 turni), tool mancanti (REFUTATA: non usa né userebbe note/facts qui), lane-non-preservano (REFUTATA: ri-testa con bash ogni turno).

## Principio [INFERRED, allineato a [[feedback_optimization_first]] + [[feedback_context_window_sizing]]]

**Il contesto iniettato ha un costo** (token + attenzione del modello, che per un SLM è scarsa). Iniettare le lane-memoria SEMPRE è ottimo per task memory-heavy (long-horizon) ma **dannoso** per task self-contained. → **iniezione ADATTIVA**: iniettare una lane solo quando ha contenuto RILEVANTE (facts-vuoto → non iniettare; nessuna history → niente `how_memory_works` che anzi distrae verso "ricorda" invece di "risolvi"). Un task fresco self-contained dovrebbe ricevere **~0 lane**.

## Tre assi di miglioramento (composabili)

1. **HARNESS-side — iniezione lean/adattiva**: gate delle lane per rilevanza/contenuto. È la leva più diretta su H6. [track → prototipo + A/B "harness-lean vs harness-full" sugli hard]
2. **TOOLS-side — capacità on-demand (utente msg 1051)**: esporre contesto/capacità come **file che il modello LEGGE quando serve e CHIUDE per recuperare contesto**, invece di iniettare sempre (`Read temp file`). Pull invece di push. → [[concepts/harness-capabilities-as-files]] (già progettato). Riduce il floor di contesto senza perdere accesso all'informazione.
3. **MODEL-side / TRAINING — regime-awareness + keepTurns curriculum (utente msg 1047)**: durante l'RL, **variare keepTurns** ({1,3,8}) E **passare il keepTurns corrente al modello** (es. campo `<context_regime keepTurns=N>`) così impara ad **adattare il comportamento**: finestra piccola → persisti lo stato con note/facts ADESSO (dà un motivo REALE di usarli — [[feedback_training_vs_harness_classification]]); contesto lean → fidati del tuo ragionamento. **Doppia-testa** (con/senza contesto mostrato) per ciascun keepTurns → misura il valore marginale dell'harness a ogni regime. È la faccia-training del contesto-adattivo, e generalizza `how_memory_works` da hint statico a comportamento APPRESO. Collega [[feedback_temporal_anchoring]] (awareness-as-mechanism, msg 939).

   **3b. keepTurns MODEL-CONTROLLED (utente msg 1062)** — end-state: un tool `set_keepturns(n)` che il modello chiama per allocarsi più memoria su task stateful, + **reminder auto** dopo N turni ("hai finito? riporta al default") + **cap sul max**. È il model-controlled dell'asse-1 (l'harness dà il default lean, il modello fa override quando ha imparato). **Classificazione (regola #11)**: MECCANISMO (tool+reminder) = **F-harness** (build ora, keepTurns già config-driven); DECISIONE (quando aumentare/ridurre) = **S** (skill, serve training+reward) → sullo stand-in probabilmente **INERTE o dannosa** (non ha la metacognizione: HE/145 non si accorge nemmeno di essere fissato) → NON spedire come feature stand-in (guscio-inerte). **⚠️ CONFOUND critico**: "bloccato → più keepTurns" può essere SBAGLIATO — su una FISSAZIONE più contesto DILUISCE (H6); la cura è lo step-back del [[concepts/anti-fixation-metacognition-rung]], NON più memoria. Il modello deve IMPARARE a distinguere "task legittimamente stateful → più memoria" da "fissazione → step-back". **Awareness** del tradeoff nella DESCRIZIONE DEL TOOL (pull on-demand) + training, NON in blocco fisso di contesto (anti-H6). Reward OUTCOME-anchored (successo a costo minore), mai "ha regolato keepTurns".

## Valutazione critica dell'asse-3 (keepTurns curriculum) [INFERRED — critica oggettiva]

- **Perché {1,3,8}?** La distribuzione di training dovrebbe rispecchiare il **keepTurns di DEPLOYMENT** (train-test regime match), non essere uniforme sugli estremi. `@1` è degenere sui task single-hard (pathologico, [[architecture/ab-eval-harness]]) → tienilo come **caso-stress di minoranza**, non "preponderanza". Definire prima il keepTurns d'esercizio reale.
- **Reward OUTCOME-anchored obbligatorio** ([[feedback_reward_hacking_principle]]): premiare l'ESITO (task risolto / fatto durevole ripescabile a N turni), MAI la cerimonia "ho chiamato note() perché keepTurns è basso". Altrimenti il modello impara il rito regime-appropriato senza che serva.
- **Confound H6**: se il contesto grande fa male al ragionamento, l'arm "con contesto" a keepTurns alto può perdere sui task di ragionamento a prescindere dal training. Verificare che il modello **possa imparare a de-pesare** il contesto irrilevante, non solo esserne informato.
- **Costo**: keepTurns{1,3,8} × {con/senza} × task = 6× rollout. RL è caro → campionare, non cross completo per ogni task.

## Inquadramento [EXTRACTED]

HE/145 è il **caso peggiore** per l'harness: hard di puro ragionamento dove la memoria (= il valore dell'harness) è IRRILEVANTE → tutto costo, zero beneficio. Il valore vero dell'harness si misura dove la memoria SERVE = **Modo 2 long-horizon** ([[architecture/ab-eval-harness]]). Questo finding dice "l'harness può far male sui hard memory-irrilevanti → rendi il contesto adattivo", NON "l'harness è inutile".

## Pressure-adaptive keepTurns — IMPLEMENTATO opt-in (utente msg 1434, 2026-07-09) [EXTRACTED]

Implementazione RUNTIME di **F32** ("l'harness-memoria paga SOLO in overflow"): un keepTurns che **parte ALTO (vanilla) e SCENDE con la pressione**, invece che fisso. Distinto dall'asse-3 (curriculum di training) e da 3b (model-controlled `set_keepturns`): qui l'**HARNESS** adatta il keepTurns al **fill reale** del contesto, deterministicamente.

- **Config** (`harness-config.mjs`): `adaptiveContext: { enabled:false (DEFAULT OFF), lowThreshold:0.5, highKeep:9999 }`. Env `HARNESS_ADAPTIVE_CONTEXT`/`_LOW_THRESHOLD`/`_HIGH_KEEP`. Default OFF perché l'utente "non è fan" → opt-in con incoraggiamento a testare.
- **Meccanismo** (`keepturns.mjs:adaptiveKeepTurns` + hook `context` in `native-window.ts`): `usage=ctx.getContextUsage()`; `pct = tokens/(win*(1-reserve))`; `pct < lowThreshold → highKeep` (vanilla, vede tutto), `≥ → nativeKeepTurns` (compresso). Fail-safe (usage assente/null nei primi turni) → highKeep (parti vanilla). L'override esplicito del modello (`set_keepturns`) VINCE (via `getEffectiveKeepTurns(vq, adaptiveKeep)`).
- **CATTURA sempre-on** (il punto critico sollevato dall'utente): task-digest/note/jot/lane `<facts>`/`<vars>` sono INDIPENDENTI da keepTurns → i fatti durevoli si persistono già in regime vanilla, PRIMA che il contesto cresca. La modalità tocca SOLO l'INIEZIONE (finestra nativa), mai la cattura. (Distinzione CAPTURE ≠ INJECTION.)
- **Test**: `keepturns.test` (adaptiveKeepTurns 9 casi + integrazione override), `harness-config.test` (default OFF + file/env + clamp), `adaptive-context-wiring.test` (rule #14: catena config→usage→keep→`windowNativeMessages` REALE — fill basso→8 turni/vanilla, fill alto→6/compresso, transizione fill↑→turni↓, override-vince). Suite 62/0, typecheck 0.
- **⚠ Caveat onesto (F33)**: il VALORE dipende dal modello che salva i fatti in autonomia — il 9B NON lo fa nemmeno incoraggiato (→ la cattura DETERMINISTICA resta la rete); un ≥27B potrebbe. Perciò DEFAULT OFF + "provala e MISURA". La validazione E2E con overflow reale è quel passo (non un unit).

## Links
[[architecture/ab-eval-harness]] · [[architecture/context-pressure-mechanism]] · [[concepts/harness-capabilities-as-files]] · [[feedback_optimization_first]] · [[feedback_context_window_sizing]] · [[feedback_reward_hacking_principle]] · [[feedback_training_vs_harness_classification]]
