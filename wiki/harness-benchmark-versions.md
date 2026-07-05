---
name: harness-benchmark-versions
description: "Benchmark VERSIONATO dell'harness + CHANGELOG per-versione. pi vanilla vs nostra-versione per stato (scaffolding full/lean, keepTurns). Per ogni versione: TUTTE le estensioni che comprende + il diff specifico vs la precedente (test dei 2 anni). Aggiornato a ogni nuovo stato."
type: reference
tags: [benchmark, changelog, harness, eval, h6, scaffolding, versioning, ab-eval]
last_updated: 2026-07-05
sources:
  - "Utente TG msg 1103/1106/1108/1109 (2026-07-05): n>5 + tabella comparativa versionata + changelog specifico per-versione"
  - "eval/run-versioned.mjs → eval/data/report-versioned.json (Modo-1 hard10 n=10, flash-lite)"
---

# Harness — Benchmark versionato + Changelog

> **Scopo (utente msg 1108/1109, 2026-07-05):** «per ogni versione descrivi cosa comprende — TUTTE le estensioni — e cosa è
> cambiato tra una versione e l'altra; niente changelog vago, dobbiamo essere specifici, così fra due anni ricordiamo cosa
> stava succedendo». Questo doc è **living**: a ogni nuovo stato dell'harness si aggiunge una versione con (a) composizione
> completa, (b) diff specifico vs la precedente, (c) numeri di benchmark. Ancorato ai **commit git** (riproducibile).

## Cos'è una "versione"

Due assi, tenuti distinti apposta:
- **Codebase** (changelog cronologico): lo stato del codice dell'harness a un dato commit — QUALI estensioni esistono e come.
- **Config-stato** (asse A/B del benchmark): a parità di codebase, quale *configurazione* gira (livello scaffolding `full`/`lean`/`off`,
  `nativeKeepTurns`, `toolGating`, …). È ciò che l'A/B varia per isolare l'effetto di UN parametro.

La domanda dell'utente («vanilla vs stato-1 vs stato-2 vs successive») è sull'asse **config-stato**; «tutte le estensioni + cosa è
cambiato» è sull'asse **codebase**. Sotto trovi entrambi.

---

## Piattaforma: le 21 estensioni (cosa comprende la "nostra versione")

Il braccio `ours` carica TUTTE le `.pi/extensions/*.ts`. `vanilla` = 0 estensioni (pi puro). Colonna **classe**: CORE = meccanismo
sempre-on ([[decisions/2026-07-05-slm-scaffolding-extension]]); SCAFFOLD = pezza-per-il-modello (target di training, recede); FEAT = feature.

| # | Estensione | Ruolo | Classe |
|---|---|---|---|
| 1 | `context-assembly` | Assembla il `<context>` (lane: rules/current_aim/task_list/history 2-livelli/last_tool_calls…) | CORE |
| 2 | `vars-queue` | Persistenza stato/task/note (SQLite) + tool `note`/`set_var`/task + `set_keepturns` | CORE |
| 3 | `native-window` | Windowing dell'array messaggi NATIVO (`nativeKeepTurns`) — la storia recente dove il modello guarda davvero | CORE |
| 4 | `tool-result-frame` | Confine tool_result = DATA non-istruzione (anti prompt-injection) | CORE |
| 5 | `pre-flight` | Gate di safety prima di azioni distruttive (rm/overwrite) | CORE |
| 6 | `secrets-guardrail` | Scanner + redazione dei secret in egress (secrets-map dinamica + pattern statici) | CORE |
| 7 | `regex-ingress` | Cattura valori secret-shaped in INGRESSO e li sigilla prima del provider | CORE |
| 8 | `slm` | **Le "pezze": scaffolding `<how_memory_works>`/reminder/resources + nudge set-aim** (livello full/lean/off via registry) | SCAFFOLD |
| 9 | `tool-gating` | Scoperta tool per modelli piccoli: set essenziale attivo + coda-lunga via find_tool/open_category | SCAFFOLD |
| 10 | `nested-compact` | Compattazione "matrioska" sotto pressione di contesto (soglie config-driven) | CORE |
| 11 | `eviction-checkpoint` | Rete di sicurezza: avvisa/digesta i fatti durevoli che stanno per uscire dalla finestra nativa | FEAT |
| 12 | `checkpoint` | Checkpoint/restore dello stato conversazione | FEAT |
| 13 | `conversation-capture` | Cattura la conversazione per `get_conversation` (msg vecchi oltre la finestra) | CORE |
| 14 | `tool-call-log` | Log delle tool-call → lane `<last_tool_calls>` | FEAT |
| 15 | `turn-trace` | Osservabilità per-turno: `last-turn-raw.json` (autoritativo) + `last-turn-full.md` + metriche | FEAT |
| 16 | `error-memo` | Memo degli errori (`remember_lesson`/`recall_lessons`) — riuso lezioni | FEAT |
| 17 | `sliding-var` | Lettura/scrittura a finestra scorrevole di variabili grandi (stream) | FEAT |
| 18 | `var-ops` | Operazioni var avanzate (propose/merge/extract/render_template) | FEAT |
| 19 | `verifier-sandbox` | `run_verifier` in sandbox (seme del reward Phase-3) | FEAT |
| 20 | `contradiction-detection` | Rileva contraddizioni nel contesto (post-MVP, judges) | FEAT |
| 21 | `gemini-compat` | Compat del provider Gemini (adatta il payload OpenAI-completions) | INFRA |

> Nota: `context-invariants.mjs` (RL-time checker) è LOGICA pura usata da eval/RL, non un'estensione runtime-hookata → non in tabella.

---

## Changelog codebase (cronologico)

### CB-2026-07-04 — pre-notte (baseline "full")
Le 21 estensioni sopra, con `slm` che emette lo scaffolding **full** cablato nel core. `set_keepturns` NON ancora presente;
`note` registrato ma **non categorizzato/essenziale** (bug latente). Ultimo commit rappresentativo: `b8171a7`.

### CB-2026-07-05 — notte (questa sessione)
Diff **specifico** vs CB-2026-07-04 (commit → cosa cambia):
- `03020a7` — **estensione `slm` + registry**: lo scaffolding-crutch esce dal core in un'estensione dedicata; `context-assembly`
  lo legge lazy via `getRegisteredScaffolding()`. Reso **modulare** (full→lean→off, poi rimozione file). → abilita l'asse config-stato.
- `d880b54` — **`set_keepturns` model-controlled**: nuovo tool (finestra nativa auto-gestita dal modello), cap 20, override in meta.
- `059383f` — **`context-invariants`**: checker RL-time (aim non-vuoto a task attivo, stati∈enum, no dep non soddisfatte) — reward outcome-anchored.
- categorizzazione `<rules>` (safety/task/memory/general) + enum stati task validato.
- `9447c63` — **wiring-test `tool-reachability`** + fix `note`/`remove_note` gated (bug latente classe-`set_keepturns`) — regola #17.
- `17fe33c` — **fedeltà `turn-trace`**: `last-turn-raw.json` autoritativo; header senza literal dei nomi-tag (fix falso-positivo di diagnosi).

---

## Config-stati messi a benchmark

| Stato | Codebase | Estensioni | scaffolding | nativeKeepTurns | Note |
|---|---|---|---|---|---|
| **V0 vanilla** | — | 0 | — | — | pi puro, baseline |
| **V1 ours-full (stato-1)** | CB-2026-07-05 | 21 | `full` | 6 | scaffolding pieno (checklist anti-amnesia completa) |
| **V2 ours-lean (stato-2)** | CB-2026-07-05 | 21 | `lean` | 6 | **diff vs V1: SOLO `laneMemoryHintLevel` full→lean** (via env, stesso codice) |
| **V3 ours-off (stato-3)** | CB-2026-07-05 | 21 (`slm` caricato ma scaffolding **OFF** via `laneMemoryHint=false`) | `off` | 6 | **diff vs V2: scaffolding `<how_memory_works>` spento del tutto**. Misura "quanto il modello ha interiorizzato" |

---

## Benchmark

### Modo-1 — per-task, set HARD, n=10 (>5) · model `gemini-3.1-flash-lite`
Dataset `humaneval-hard10` (5 hard noti {32,126,129,132,145} + 5 per proxy-difficoltà {69,94,95,141,133}). Run PULITO: 0 errori-API.

| Stato | pass | pass% | avg token | avg turni | ctx% | wrote% |
|---|---|---|---|---|---|---|
| V0 vanilla | 8/10 | **80** | 10 421 | 5 | 0 | 100 |
| V1 ours-full | 7/10 | **70** | 55 144 | 5 | 100 | 100 |
| V2 ours-lean | 8/10 | **80** | 46 198 | 5 | 100 | 100 |
| V3 ours-off | 8/10 | **80** | 49 321 | 5 | 100 | 100 |

**Lettura:** su task HARD self-contained lo scaffolding **full peggiora** (70 < 80 vanilla): il `<context>` verboso diluisce il
ragionamento del modello piccolo (**H6 confermato a n=10**, prima solo n≤5). Il **lean recupera** al livello vanilla (80) **e** costa
il 16% di token in meno del full (46K vs 55K). Il costo-token 4-5× vs vanilla è l'overhead del contesto: è valore su multi-turno/long-horizon
(dove vanilla NON ha memoria), overhead puro su single-shot. → [[concepts/adaptive-context-injection]].

### Modo-2 — long-horizon, 6 task in una sessione + probe memoria/timeline · `gemini-3.1-flash-lite`
Config {vanilla, ours@keep1, ours@keep6} sui 6 task base (HE/0-5). Run **SPAZIATO 2026-07-05** (30s/task → PULITO; il primo run era
saturato dal rate-limit/TPM del free-tier, ~200K tok/sessione).

| Config | pass | probe-recall | probe-ordine | turni-tot | token-finali |
|---|---|---|---|---|---|
| vanilla | **6/6** | **100%** | 100% | 19 | 66 297 |
| ours@keep1 | **6/6** | **33%** | 33% | 44 | 505 518 |
| ours@keep6 | **6/6** | **100%** | 100% | 47 | 722 695 |

**Lettura ONESTA (critica oggettiva, non auto-promozione):** tutti risolvono 6/6 (task facili). Sulla **probe memoria/timeline**
`vanilla` fa **100%**: la sessione a 6 task **entra nella finestra nativa di pi** → vanilla ricorda tutto da solo, e qui la
memoria-harness **non aggiunge nulla** costando **8-11× token**. `ours@keep1` fa **33%** (PEGGIO di vanilla): con finestra nativa=1
turno la ricostruzione della memoria vive nella lane `<messages_with_user>`, che **il modello ignora** (amnesia nota, [[feedback_instrument_before_hypothesizing]])
→ dimentica 4/6 E costa 8× token. `ours@keep6` recupera 100% ma a **11× token**. **Conclusione:** l'harness-memoria PAGA solo su
sessioni **più lunghe della finestra nativa** (dove vanilla comincia a dimenticare); 6 task facili NON stressano vanilla → serve un
long-horizon vero (SWE-scale o molti più task) per un test equo. Finché non c'è, l'harness qui è overhead. [[architecture/ab-eval-harness]]

> **Regola quota (utente msg 1106):** ladder `gemini-3.1-flash-lite → gemini-3.1-flash` su esaurimento; il modello è etichettato per-cella.
> Se si esaurisce anche `flash` → serve la 2ª key. NESSUNA PII (hardware utente ecc.) nei report.

---

## Findings

- **H6 (adaptive-context) — SUPPORTATO a n=10**: scaffolding full diluisce il ragionamento su task hard self-contained
  (V1 70% < V0 80%); il lean lo mitiga (V2 80% = V0) a token inferiori. Direzione coerente con E8/E9 ([[harness-experiment-log]]).
- **Scaffold-che-recede CONFERMATO (V1→V2→V3)**: full **70%** → lean **80%** → off **80%**. Abbassare/rimuovere lo scaffolding NON
  regredisce (anzi full→lean *migliora*); a `off` il pass-rate resta 80% = vanilla. Su hard self-contained lo scaffolding `how_memory_works`
  full è un **crutch dannoso RIMOVIBILE** (non solo neutro). La metrica "scaffold receded" (niente regressione abbassando il livello) è **verde**.
  ⚠️ Vale per task self-contained; su long-horizon lo scaffolding-memoria potrebbe ancora servire (da testare, vedi Modo-2).
- **Costo del contesto**: il valore dell'harness NON è sul single-shot HumanEval (dove è overhead).
- **Modo-2 (memoria) — l'harness NON vince su sessioni corte** (finding onesto): a 6 task vanilla ha **100%** probe-recall (la sessione
  entra nella finestra nativa) → la memoria-harness è **overhead** (8-11× token) e `keep1` **peggiora** (33%, lane ignorata). Il
  valore-memoria è atteso SOLO su long-horizon **> finestra-nativa** → da dimostrare con SWE-scale / molti più task. Non abbiamo ancora
  un setup dove l'harness-memoria vince: è il prossimo test critico, non un dettaglio.

## Metodo / riproducibilità
- Orchestratore: `eval/run-versioned.mjs` (Modo-1) + `eval/run-session-ab.mjs` (Modo-2). Report: `eval/data/report-*.json` (gitignored, path assoluti).
- Isolamento: workdir + `HARNESS_STATE_DIR` per cella (nessun cross-talk). Gate interattivi auto-approvati (headless).
- Comando V1/V2: `EVAL_DATASET=eval/data/humaneval-hard10.jsonl EVAL_ARMS=ours EVAL_KEEPS=6 HARNESS_LANE_MEMORY_HINT_LEVEL={full|lean} node eval/run-ab.mjs`.
- n=10 (>5, utente msg 1103). Modello free/rate-limited → SEQUENZIALE.

## Links
[[harness-experiment-log]] · [[concepts/adaptive-context-injection]] · [[architecture/ab-eval-harness]] · [[decisions/2026-07-05-slm-scaffolding-extension]] · [[architecture/context-pressure-mechanism]]
