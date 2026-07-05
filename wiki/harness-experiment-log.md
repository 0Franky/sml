---
name: harness-experiment-log
description: "Registro scientifico dell'A/B harness (pi vanilla vs pi+nostre-estensioni). Risultati + condizioni + cronologia (cosa/quando/quale-testa) + cosa l'harness HA oggi vs cosa abbiamo PROGETTATO ma non costruito. Living lab-notebook."
type: architecture
tags: [eval, experiment-log, ab-test, scientific-record, harness-state, roadmap]
last_updated: 2026-07-05
sources:
  - "harness/eval/data/report-*.json (run reali 2026-07-04) + trace HE/145 + smoke Modo-2"
  - "Sessione design 2026-07-04/05 (utente TG msg 1020-1064)"
---

# Registro esperimenti & stato harness — A/B pi vanilla vs nostre-estensioni

> Living lab-notebook. **Metodo scientifico**: ogni risultato porta CONDIZIONI + n + caveat. n piccolo = SEGNALE, non conclusione. Modello di TEST = **gemini-3.1-flash-lite** (stand-in neutro, NON il nostro SLM — vedi [[project_test_model_vs_target]]).

## 1. Setup & condizioni (valide per tutti i run salvo diverso avviso)

- **Bracci ("teste")**: `vanilla` = pi `--no-extensions` (0 estensioni, pi puro) · `ours` = pi + 20 `.pi/extensions` (context-assembly + `<context>` iniettato). Unica differenza = le nostre estensioni.
- **keepTurns** ∈ {1, 6} testati (design: aggiungere 8). Config via env `HARNESS_NATIVE_KEEP_TURNS`.
- **Reward**: verifier ufficiale HumanEval (test NASCOSTO al modello), exit 0 = PASS. Oggetto = pass/fail oggettivo.
- **Isolamento**: 1 processo per run, `HARNESS_STATE_DIR` + workdir dedicati (no cross-talk). Provider Gemini NATIVO (`authHeader:false`). Headless auto-approva i confirm.
- **Modalità**: **Modo 1** = 1 task per sessione (agentico: scrive solution.py, testa con bash, itera). **Modo 2** = N task NELLA STESSA sessione (long-horizon, contesto accumula) + probe memoria.
- **Vincolo operativo**: key Gemini FREE rate-limited → run SEQUENZIALI, retry+backoff sui 429, errori-API esclusi dal pass-rate.
- **Caveat trasversale**: n=1-2 per cella (tranne hard n=5). Segnali, non prove.

## 2. Cronologia esperimenti (cosa · quando · quale testa · esito)

Tutti il **2026-07-04** (sera, ora locale utente ~UTC+? — tempi approssimati dalla sessione TG):

| # | ~ora | Esperimento | Teste (config) | Dataset | Esito sintetico | Report |
|---|---|---|---|---|---|---|
| E1 | (pre-compact) | Modo-1 FACILI | vanilla, ours@6 | HE/0-2 | entrambi PASS; harness **~3-4× token** (HE/0: 7.5K vs 49K) | — |
| E2 | ~21:29 (335s) | Modo-1 OSTICI | vanilla, ours@6 | HE/32,126,129,132,145 | vanilla **5/5**, ours@6 **4/5** | `report-hard.json` |
| E3 | ~21:36 (196s) | Modo-1 OSTICI @1 | ours@1 | (stessi 5) | ours@1 **2/5** (patologico) | `report-hard-keep1.json` |
| E4 | ~21:53 | Modo-2 SMOKE | ours@1 | HE/0-2 (1 sessione) | pass **3/3**; probe recall **100%** (post fix grader fuzzy) | `report-session-smoke.json` |
| E5 | ~21:39 | SWE-bench download | — | SWE-bench Lite | **300 task** metadata (12 repo OSS), Docker-gated | `eval/data/swe/` |
| E6 | ~22:01 (128s) | HE/145 TRACCIATO | vanilla, ours@1, ours@6 | HE/145 | vanilla **PASS**, ours **0/2 FAIL** → diagnosi fissazione | `report-he145-trace.json` + trace |
| E7 | 2026-07-05 ~02:15 | **headless full-vs-lean** (validazione wiring `slm-scaffolding`) | ours@6 {laneMemoryHintLevel: full, lean} | probe memoria 2-turni (9B `qwen3.5:9b` locale, quota-free) | wiring OK entrambe (pi parte, `set_var`, no crash); **lean ctx-input 6637 vs full 6811** (~174 tok, ~2.5%); 9B ricorda in entrambe (lean T2 richiama entrambi i nomi) | driver `tools/drive-qwen.mjs` |

## 3. Risultati numerici (con condizioni)

### Modo-1 OSTICI (5 task algoritmici, n=1/cella)
| testa | pass% | avg turni | avg token | avg tools | ctx% |
|---|---|---|---|---|---|
| vanilla | **100%** (5/5) | 13 | 56.6K | 12 | 0 |
| ours@keep6 | **80%** (4/5) | 5 | 48.7K | 4 | 100 |
| ours@keep1 | **40%** (2/5) | 11 | **138.7K** | 10 | 100 |

### HE/145 tracciato (n=1/cella, ri-run dedicato)
| testa | pass | turni | token | tools |
|---|---|---|---|---|
| vanilla | **PASS** | 15 | 61.4K | 14 |
| ours@keep1 | **FAIL** | 17 | 187.1K | 16 |
| ours@keep6 | **FAIL** | 17 | 181.7K | 16 |

## 4. Findings & stato ipotesi

- **F1** [n basso]: su task FACILI entrambi risolvono; harness = **~3-4× token** = overhead puro (nessun guadagno di qualità).
- **F2** [n=5]: **keep1 patologico** sui single-hard — pass 40%, token 2.5× (HE/32: 190K/FAIL@1 vs 9.8K/PASS@6 = 20×). Causa: finestra nativa=1 turno → il modello non vede i propri tentativi.
- **F3** [n=2, DA CONFERMARE n≥5]: su HE/145 **ours 4/4 FAIL vs vanilla 2/2 PASS** (~3× token). Meccanismo (dal trace): **FISSAZIONE sul sotto-problema sbagliato** (permuta il tie-breaking ~10 turni senza riquestionare `digit_sum(abs)` errato sui negativi). Ipotesi **H6**: il `<context>` grande diluisce il ragionamento del modello piccolo. Report turn-by-turn: `harness/eval/data/trace/REPORT-he145-ours-k1.md`.
- **F4** [EXTRACTED]: il `<context>` di ours = **12.7K char (~3200 token)**, in gran parte `how_memory_works` + spiegazioni-lane; i dati veri (`current_aim`/`task_list`/`facts`) sono **VUOTI** su task self-contained.

**Verdetti ipotesi** (validate sui log): H1 convergenza-prematura → **REFUTATA** (17 turni). H2 lane-non-preservano-iterazione → **NON è il problema** (ri-testa ogni turno). H3 non-usa-note/facts → **CONFERMATA** (irrilevanti qui). H5 prompt-sopprime-ragionamento → **REFUTATA**. H4 rumore → parziale (2/2 vs 4/4). H6 contesto-diluisce → **LEADING, da confermare**.

## 5. Cosa l'harness HA OGGI [EXTRACTED]

- **Context-assembly**: lane `how_memory_works`, `rules`, `facts`, `task_list`, `current_aim`, `last_tool_calls`, `messages_with_user`, `secrets`, `vars`, `recent_changes` (+ temporal-anchoring `[+Xs]` shift).
- **Memoria durabile (tool)**: `note`/`remove_note`, `record_decision`/`get_decisions`, `set_var`/`get_var`, `list_secrets`, `find_tool`/`open_category`.
- **keepTurns** config-driven (`HARNESS_NATIVE_KEEP_TURNS`, native-window ext).
- **Safety**: secrets-guardrail, pre-flight distruttivo, eviction-checkpoint, tool-gating.
- **Infra eval**: Modo-1 (`run-one`/`run-ab`), Modo-2 (`run-session`/`run-session-ab`), verifier HumanEval (oracle 8/8), isolamento (`HARNESS_STATE_DIR`), **tracing completo** (`EVAL_TRACE_DIR` → eventi+solution+`<context>`), report turn-by-turn (`gen-trajectory-report`).

## 6. Cosa l'harness NON HA ma abbiamo PROGETTATO in questa sessione [design backlog]

| Idea | Origine | Stato | Pagina |
|---|---|---|---|
| Iniezione contesto **ADATTIVA/lean** (gate lane per rilevanza; niente scaffolding-memoria su self-contained) | H6 + msg 1045 | 🟡 progettato, non costruito | [[concepts/adaptive-context-injection]] |
| Tool **on-demand** (`Read temp file`, pull-non-push) | msg 1051 | 🟡 concept | [[concepts/harness-capabilities-as-files]] |
| **Rung anti-fissazione** (stagnation-triggered: decompose→questiona-assunzione→diversifica + note-ledger) | msg 1056/1057 | 🟡 progettato+validato (efficacia DA provare) | [[concepts/anti-fixation-metacognition-rung]] |
| **keepTurns MODEL-CONTROLLED** (`set_keepturns` + reminder-revert + cap) | msg 1062 | 🟡 mecc=F-harness / decisione=S-da-addestrare | [[concepts/adaptive-context-injection]] §3b |
| **Training regime-aware** (keepTurns curriculum {1,3,8} + esporre keepTurns + doppia-testa) | msg 1047 | 🟡 design Fase-3 RL | [[concepts/adaptive-context-injection]] §3 |
| **native-window non-piatta** (preserva iterazione intra-task sotto keepTurns basso) | msg 1045 | 🔵 DA DISCUTERE | [[architecture/ab-eval-harness]] §Da discutere |

## 7. Prossimi passi scientifici (ordinati, con criterio di successo)

1. **Confermare H6**: HE/145 (e HE/32,132) **5×/braccio** → il gap ours-vs-vanilla è significativo o rumore? Criterio: differenza pass-rate stabile su n≥5.
2. **Modo-2 full long-horizon**: {vanilla, ours@1, ours@8} su 5-6 task in sessione + probe → l'harness paga DOVE la memoria serve? Criterio: pass-rate mantenuto + probe-recall alto a keepTurns basso (vs vanilla che cresce in token).
3. **Prototipo rung anti-fissazione** + A/B vs harness-plain sui task-fissazione → rompe la fissazione senza costo netto? Criterio: pass-rate↑ sugli hard a token comparabili.
4. **SWE-bench** (long-horizon vero): richiede Docker su → harness agentico-su-repo sandboxato.

## 8. Riproducibilità

Da `harness/` (key in `.env`, gitignored):
- E2: `EVAL_DATASET=eval/data/humaneval-hard.jsonl EVAL_ARMS=vanilla,ours EVAL_KEEPS=6 EVAL_LABEL=hard node eval/run-ab.mjs`
- E3: `... EVAL_ARMS=ours EVAL_KEEPS=1 EVAL_LABEL=hard-keep1 ...`
- E6: `EVAL_DATASET=eval/data/he145.jsonl EVAL_ARMS=vanilla,ours EVAL_KEEPS=1,6 EVAL_TRACE_DIR=<abs> node eval/run-ab.mjs`
- E4: `EVAL_N=3 EVAL_ARMS=ours EVAL_KEEPS=1 EVAL_TASKS_FILE=eval/data/humaneval-6.jsonl node eval/run-session-ab.mjs`
- Artefatti: `eval/data/report-*.json` + `eval/data/trace/` (gitignored — rigenerabili).

## Links
[[architecture/ab-eval-harness]] · [[concepts/adaptive-context-injection]] · [[concepts/anti-fixation-metacognition-rung]] · [[architecture/context-pressure-mechanism]] · [[project_test_model_vs_target]]
