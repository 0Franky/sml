---
name: user-notes-index
description: Indice degli appunti utente 2026-05-21 sul wrapper/reasoning/context. Hub di navigazione per categorie.
type: index
tags: [index, user-notes, wrapper, reasoning, context]
last_updated: 2026-05-21
---

# User Notes — Indice per Categoria

Appunti dell'utente del 2026-05-21 sul **wrapper + reasoning + context organization + training**. Formalizzati in **14 file di concept**, organizzati in 4 categorie. Tutti i file sono interconnessi via `[[link]]`.

> **Status**: ingest completato. Ricerca letteratura correlata in background. Prossimo: sprint idee.

---

## Categoria A — Reasoning structure (come pensa il modello)

Come strutturare il **processo di pensiero** del modello per essere efficiente, verificabile e migliorabile nel tempo.

| File | Cosa copre | Idea chiave |
|---|---|---|
| [[structured-thinking]] | "Caveman thinking" — strutturato, non discorsivo | Pensiero in tabelle/scheda, marker `[V]/[A]/[?]`, verifica pre-risposta, self-correction su contraddizione |
| [[post-rl-path-optimization]] | "Impratichimento" dopo RL training | Path frequenti compressi in template / direct-action. Token compression. Distillation Tier 1 → Tier 2-3 |
| [[error-memo-system]] | Memo errori commessi + lessons learned | Due livelli: lezione generica + esempi pratici. Recupero semantic. Decay & validation |
| [[multi-token-prediction-training]] | Training multi-target: next, +2, +3, sketch, state | Heads multiple oltre next-token: group sketch reply, task assignment, busy/checking state |

**Connessione**: structured-thinking è il formato base; post-rl-path-optimization è ottimizzazione di quel formato; error-memo-system è feedback loop che migliora i path; multi-token-prediction-training è il **training objective** che insegna al modello a produrre più di "next token" — incluso struttura di reply, routing decisions, e meta-state.

---

## Categoria B — Context engineering (cosa vede il modello)

Come **formalizzare e organizzare** il contesto a runtime per massimizzare attention quality e minimizzare context-rot.

| File | Cosa copre | Idea chiave |
|---|---|---|
| [[structured-context-sections]] | Formato context con sezioni tag XML | `<aim>`, `<current_state>`, `<state_queue>`, `<assets>` (con hard_limits), `<interconnections>`, `<pending_verifications>`, `<memory>` etc. |
| [[external-update-injection]] | Inject di update esterni durante pensiero | `<update from external>` iniettato tra section, priority levels, `<update_handling>` response |
| [[untrusted-content-delimiting]] | Confinamento content untrusted | `<untrusted_zone>` con marker UUID anti-escape, regole comportamento, training adversarial |
| [[task-decomposition-adhoc-context]] | Context ad-hoc per ogni step | Plan-then-execute mode, context costruito su misura per ogni step, mitiga "Lost in the Middle" |
| [[temporal-awareness-timestamps]] | Senso del tempo: timestamp + tool call timing | `<temporal_state>` + tool call log con request/response/duration/status. Stale data detection. Multi-day continuity |

**Connessione**: structured-context-sections è il template formale; external-update-injection è streaming real-time; untrusted-content-delimiting isola untrusted; task-decomposition-adhoc-context evolve il context tra step; temporal-awareness-timestamps dà al modello senso del tempo necessario per multi-day.

---

## Categoria C — Runtime safety + coherence (come il modello evita errori)

Layer di **safety e coerenza** che intercettano problemi prima che diventino bug nel codice o nel sistema.

| File | Cosa copre | Idea chiave |
|---|---|---|
| [[contradiction-detection-layer]] | Detector contraddizioni nel context | Layer esterno wrapper-side. Tipi: factual, semantic, temporal, logical, cross-source. Emette `<attention_event>` |
| [[pre-flight-safety-checks]] | Verifiche pre-azione (git, backup, hard limits) | Check file system, DB, shell command, secrets. Backup auto. User confirmation per azioni irreversibili |

**Connessione**: entrambi sono **layer di intercetto** che corrono a fianco del modello. contradiction-detection-layer agisce sul thinking; pre-flight-safety-checks agisce sulle azioni. Insieme realizzano l'enforcement degli hard_limits dichiarati in [[structured-context-sections]].

---

## Categoria D — Wrapper runtime architecture (struttura interna del wrapper)

Come il **wrapper** gestisce internamente queue, vars registry, e accesso ottimizzato ai dati.

| File | Cosa copre | Idea chiave |
|---|---|---|
| [[agent-wrapper-vars-queue]] | Datastore interno wrapper: TASKS / VERIFICATIONS / RULES / VARS | 4 lane parallele in queue + CURR pointer. VARS registry con map O(1). Persistenza per multi-day |
| [[sliding-window-variable-tool]] | Tool dedicato per read/replace var via char range | `var_id + start_char + end_char + context_around`. Preview-then-apply pattern. Risparmio token enorme |
| [[explicit-attention-layer]] | Attention forzata su current_aim / prev_step / global / rules | Tre implementazioni: A) architetturale, B) training-time loss, C) prompt-only. Mitigates "Lost in the Middle" |

**Connessione**: agent-wrapper-vars-queue è la struttura dati; sliding-window-variable-tool è l'API che il modello chiama per leggerla; explicit-attention-layer assicura che le sezioni critiche del context derivato non vengano "lost in the middle". Tutti e tre supportano [[structured-context-sections]] (B) e [[task-decomposition-adhoc-context]] (B).

---

## Mappa relazioni (cross-category)

```
                            ┌──────────────────────────────────────────────┐
                            │  D — Wrapper runtime architecture            │
                            │  agent-wrapper-vars-queue                    │
                            │  sliding-window-variable-tool                │
                            │  explicit-attention-layer                    │
                            └──────────────┬───────────────────────────────┘
                                           │ alimenta
                                           ▼
                            ┌──────────────────────────────────────────────┐
                            │  B — Context engineering                     │
                            │  structured-context-sections (CONTAINER)     │
                            │  external-update-injection                   │
                            │  untrusted-content-delimiting                │
                            │  task-decomposition-adhoc-context            │
                            │  temporal-awareness-timestamps               │
                            └──────────┬─────────────────────┬─────────────┘
                                       │ ricevuto da         │ controllato da
                                       ▼                     ▼
                            ┌──────────────────┐  ┌──────────────────────┐
                            │  A — Reasoning   │  │  C — Runtime safety  │
                            │  structured-     │  │  contradiction-      │
                            │  thinking        │  │  detection-layer     │
                            │  post-rl-path-   │  │                      │
                            │  optimization    │  │  pre-flight-safety-  │
                            │  error-memo-     │  │  checks              │
                            │  system          │  │                      │
                            │  multi-token-    │  │                      │
                            │  prediction-     │  │                      │
                            │  training        │  │                      │
                            └──────────────────┘  └──────────────────────┘
```

**Pattern centrale**:
- **D (wrapper runtime)** produce/aggiorna lo state che alimenta **B (context engineering)**
- **B** è il container del context inviato al modello
- **A (reasoning structure)** è il comportamento del modello dentro **B**
- **C (runtime safety)** è il layer di intercetto trasversale che monitora **A** e **B**

---

## Dove si inserisce nel progetto SLM

Questi concept sono **funzionali al wrapper** (vedi [[../architecture/wrapper]]) e **al training del Tier 1 orchestrator** (vedi [[../architecture/orchestrator-layer]]):

- **Wrapper implementa**: tutta categoria D (queue, vars, attention boost). Tutta categoria C (safety). B-1 a B-5 (struttura context, injection, untrusted, ad-hoc, temporal). A-3 (memo storage).

- **Modello (Tier 1) deve imparare**: tutta categoria A (structured-thinking, path optimization, memo application, multi-token heads). Riconoscere e rispettare elementi di B (sections, untrusted, temporal). Rispondere a eventi di C (contradiction, safety halt).

- **Dataset training Tier 1 deve contenere**: examples in tutti questi formati. Skill `aris-experiment-plan` e `aris-experiment-bridge` aiutano a strutturare gli ablation.

---

## Open questions cross-file

Domande emerse durante la formalizzazione, da chiudere con utente o in sprint idee:

1. **Format finale**: XML (Anthropic), JSON (parsing), YAML (human-readable)? — [[structured-context-sections]]
2. **Vocab special tokens**: introduciamo `<load:X>`, `<update from external>`, `<contradiction>`, `<sketch>`, `<state>` etc. come special tokens (richiede tokenizer update) o come prompt patterns?
3. **Dataset di training**: come generare examples per structured-thinking + multi-token targets + memo application + temporal awareness?
4. **Benchmark wrapper-aware**: i benchmark coding standard (SWE-Bench, LCB) testano modello standalone. Come misurare il valore del wrapper structured?
5. **Compatibilità Qwen3.6-35B-A3B (MoE + DeltaNet hybrid)**: questi pattern funzionano allo stesso modo? Attention boost (D-explicit-attention-layer) richiede modifica architetturale incompatibile?
6. **MTP heads custom (A-multi-token-prediction-training)**: tokenizer Qwen3 supporta extension o serve retraining embedding from scratch?
7. **VARS persistence multi-day**: schema migration se queue/vars formato evolve?
8. **Tool call timing standardization**: timestamp granularity e timezone handling cross-host?

---

## Storia

- **2026-05-21 ingest #1**: 7 appunti core formalizzati in 9 file (A: structured-thinking, post-rl-path-optimization, error-memo-system; B: structured-context-sections, external-update-injection, untrusted-content-delimiting, task-decomposition-adhoc-context; C: contradiction-detection-layer, pre-flight-safety-checks).
- **2026-05-21 ingest #2**: foto appunti manoscritti + nota temporal awareness → 5 file nuovi (A: multi-token-prediction-training; B: temporal-awareness-timestamps; D: agent-wrapper-vars-queue, sliding-window-variable-tool, explicit-attention-layer).
- **Total**: 14 file concept, 4 categorie.
- **Next**: ricerca letteratura correlata + sprint idee.

---

## Sources

- User notes 2026-05-21 (chat conversation con questa AI + foto manoscritta `appunti su quaderno.png`)
- `prompts/thinking-style.v1.md` (esistente nel repo, baseline)
- `prompts/CHANGELOG.md` (v1 open issues → questa è v2 spec)
- **Nota su "+ APPUNTI SU TG"** annotato sulla foto: confermato dall'utente che si riferisce alla foto stessa, non a appunti aggiuntivi separati. Set di appunti completo dal 2026-05-21.
