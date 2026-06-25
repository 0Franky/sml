---
name: training-taxonomy
description: Tassonomia completa dei dati/argomenti di training del SLM. Ogni argomento → tag qual/quant → foglie (ognuna punta a skill specifiche) → spazio degli esempi (con-hint / senza-hint / wrong-awareness / wrong-recovery / other). Backbone master + schema. Avviata 2026-06-23.
type: index
tags: [training, dataset, taxonomy, curriculum, skills, qualitative, quantitative, hints, recovery, master]
last_updated: 2026-06-23
status: draft in costruzione — backbone completo, example-space da completare per tutte le foglie
---

# Training Taxonomy — backbone master

> **Origine**: richiesta utente 2026-06-23. "Tirare giù TUTTI gli argomenti da includere nel training; per ciascuno segnare se valutabile qualitativamente o quantitativamente; identificare edge case e foglie; ogni foglia punta a skill specifiche; per ogni foglia definire lo spazio degli esempi (con-hint, senza-hint, wrong-awareness, wrong-recovery, other)."
>
> **Stato**: questo file è il **backbone** (tutti gli argomenti + tag + foglie + skill). L'example-space dettagliato per ogni foglia vive nei file `area-NN-*.md` (in costruzione). Schema + 2 foglie canoniche lavorate qui sotto in §3.

---

## 1. Schema di valutazione (qual vs quant)

Ogni argomento/foglia è taggato:

| Tag | Significato | Esempio | Come si misura |
|-----|-------------|---------|----------------|
| **Q** (quantitativo) | esito oggettivo, binario o numerico | code correctness: funziona / non funziona | test, exec, exact-match, conteggio, verifier deterministico |
| **L** (qualitativo) | giudizio su una scala, richiede valutatore | "codice ben architettato vs sloppy" | rubric + LLM-judge / PRM / human / preference |
| **Q+L** | ha sia un nucleo oggettivo sia una dimensione di giudizio | "production-ready" = passa i test (Q) **e** è ben strutturato (L) | verifier + judge combinati |

**Perché conta**: il tag determina il **reward signal** in training. Q → reward verificabile (ideale per RL/process-reward, vedi [[../concepts/scientific-method-operating-protocol]] D3). L → serve teacher/judge/preference (DeepSeek teacher, vedi D2). Q+L → pipeline mista (verifier filtra, judge ordina).

> ⚠️ **Hack-check obbligatorio (reward-hacking, priorità utente 2026-06-23)**: per OGNI foglia, quando si definisce il reward, chiedersi *"come potrebbe il modello massimizzare questo senza la skill?"* e aggiungere la difesa. Preferire reward **Q** verificabili; scorer ≠ scored. Vedi [[../concepts/reward-hacking-mitigation]].

---

## 2. Schema dello spazio-esempi per foglia

Ogni **foglia** (categoria finale) punta a **una o più skill specifiche** (il "segnale" che vogliamo far emergere) e definisce 5 classi di esempi:

| Classe | Scopo | Note |
|--------|-------|------|
| **(1) WITH-hint** | l'hint nel prompt **scaffolda** la skill (la indica/suggerisce) | gli hint vanno **definiti tutti**, e devono **puntare a sviluppare la skill** della foglia |
| **(2) WITHOUT-hint** | astrarre il ragionamento **senza** l'hint (skill interiorizzata) | stessa task family della (1), hint rimosso |
| **(3) WRONG — awareness** | traiettoria/esempio sbagliato: il modello deve **riconoscere** la situazione errata | label = "questo è sbagliato perché…" (no recovery) |
| **(4) WRONG — recovery** | esempio sbagliato **+ recupero**: riconosce → diagnostica → ripara | insegna il loop di self-correction (verify-loop) |
| **(5) OTHER** | counter-example out-of-scope, adversarial, composite multi-skill, edge case raro | per robustezza e refusal |

### 2.1 Metodologia di batching (chiarimento "grouped query learning / DeepSeek")
- `[CRITICA/CHIARIMENTO]` "grouped query learning" non è un termine standard. **GQA (Grouped-Query Attention)** è *architettura*, non training. Ciò che l'utente descrive — **(1) con-hint e (2) senza-hint dello stesso task nello stesso gruppo/batch** — è un **paired/contrastive batching** (a volte "scaffolding fade-out" / curriculum di rimozione dell'hint).
- La tecnica **DeepSeek** pertinente è **GRPO** (Group Relative Policy Optimization, DeepSeek-R1): campiona **un gruppo di N completion dello stesso prompt** e usa l'**advantage relativo** dentro il gruppo (niente critic separato). Raggruppa *completion di un prompt*, non *varianti di prompt*.
- **Sintesi operativa (raccomandata)**: costruire **"task families"** = una task logica → le sue 5 varianti (1–5). Tenerle **nello stesso batch/gruppo** così il modello vede che la **skill è la stessa con o senza hint** (l'hint è impalcatura da togliere, come a scuola → [[../concepts/scuola-learning-philosophy]]). In fase RL, sopra questo, GRPO campiona N completion per prompt e premia per esito (Q) o judge (L). I due livelli si compongono.
- Lega a: curriculum staged [[../concepts/staged-curriculum-training]], fasi 1→2 [[../concepts/scientific-method-operating-protocol]], regime fisso/variabile [[../concepts/runtime-symbol-randomization-training]].

---

## 3. Esempio canonico dello schema (2 foglie lavorate)

Template di riferimento; tutte le altre foglie seguono questa forma nei file `area-NN-*.md`.

### 3.1 Foglia QUANTITATIVA — `criticità-implicita / cancellazione-file-non-versionato`
- **Area**: Criticality & Safety Awareness (A2). **Tag**: Q (+ L sul reasoning).
- **Skill target (segnale)**: prima di un'azione distruttiva, **verificare reversibilità** (il file è tracciato da git? qualcosa ci dipende?) e fermarsi/chiedere se irreversibile.
- **Esempi**:
  - **(1) WITH-hint** — prompt contiene l'impalcatura: *"⚠️ Prima di cancellare un file valuta: è versionato (git)? qualcosa ci dipende? è ripristinabile?"* → poi task "rimuovi `config_old.py`". Skill scaffoldata: il check esplicito.
    - *Hint da definire (varianti)*: hint forte (checklist completa) · hint medio ("ricorda la reversibilità") · hint debole ("attenzione alle conseguenze"). Fade-out progressivo.
  - **(2) WITHOUT-hint** — *"rimuovi il vecchio file di config"* senza alcun avviso. Il modello deve **spontaneamente** controllare `git status`/dipendenze prima.
  - **(3) WRONG — awareness** — traiettoria in cui il modello fa `rm config_old.py` senza check e un import altrove si rompe. Label: *"sbagliato: azione irreversibile su file non verificato"*. Il modello deve **riconoscerlo**.
  - **(4) WRONG — recovery** — come (3) + recupero: rileva l'errore (test rosso) → `git restore`/ricrea → aggiorna gli import → memo. Insegna verify-loop + [[../concepts/error-memo-system]].
  - **(5) OTHER** — composite: cancellazione dentro un refactor multi-step dove serve a uno step successivo (criticità *cross-step*); oppure file NON tracciato (rischio reale di perdita) vs tracciato (reversibile) → due esiti diversi.
- **Misura (Q)**: caught/missed il check (binario); danno evitato sì/no; (L) qualità del reasoning di rischio via judge.

### 3.2 Foglia QUALITATIVA — `code-quality / architettura-e-struttura`
- **Area**: Code Quality & Architecture (A6). **Tag**: L (+ Q sul "compila/passa test" come prerequisito).
- **Skill target (segnale)**: produrre codice **ben strutturato** (separation of concerns, naming auto-esplicativo, modularità) e **riconoscere** codice *sloppy*.
- **Esempi**:
  - **(1) WITH-hint** — prompt con impalcatura: *"struttura il codice per responsabilità, nomi auto-esplicativi, funzioni piccole e pure dove possibile"*. Skill scaffoldata: i principi di design.
    - *Hint da definire*: hint per dimensione (naming · modularità · SoC · testabilità · gestione errori), forte→debole.
  - **(2) WITHOUT-hint** — *"implementa il modulo di pagamento"* senza linee guida: il modello deve applicare le best practice da sé.
  - **(3) WRONG — awareness** — gli si mostra codice *sloppy* (funzione da 200 righe, nomi `x1`,`tmp`, logica duplicata) e deve **giudicarlo** ("perché è sloppy: …"). Lega a nota 6b trajectory-critique ([[../concepts/_user-notes-2026-06-23]]).
  - **(4) WRONG — recovery** — codice sloppy → **refactor** verso versione pulita, spiegando ogni mossa (estrai funzione, rinomina, dedup).
  - **(5) OTHER** — over-engineering (l'opposto dello sloppy: astrazione inutile) → riconoscere che *anche* è un anti-pattern; trade-off contestuale.
- **Misura (L)**: rubric multi-dimensione (naming, SoC, modularità, testabilità) via judge/preference; (Q) prerequisito compila + test verdi.

---

## 4. Backbone — TUTTI gli argomenti (12 aree)

Legenda tag: **Q** quantitativo · **L** qualitativo · **Q+L** entrambi. Tier: dove vive primariamente la skill (T1 organization, T2 programming, T3 verticale, X cross-tier).

### Area 1 — Organization & Long-Horizon Planning  · Tier T1
| Topic | Tag | Foglie (→ skill) |
|---|---|---|
| Task decomposition | Q+L | scomposizione completa (coverage del goal) `Q` · granularità giusta `L` · no overlap tra task `Q` |
| Interconnection / dependency mapping | Q+L | dipendenze corrette `Q` · ordine topologico valido `Q` · impatto su timeline futura `L` |
| Parallelization decisions | Q+L | identificare task paralleli `Q` · evitare conflitti di risorsa `Q` · efficienza dello scheduling `L` |
| Timeline blocking (concept-blocks) | L | aggregazione per concetto · decisione-vale-per-blocco (decision cache) · no buchi cross-task |
| Multi-day continuity / state persistence | Q | recall stato corretto dopo gap · ripresa senza perdita di contesto |
| Goal/aim tracking | Q | l'obiettivo resta invariato lungo i passi · rilevare drift dall'aim |
| Plan-mode & plan validation/revision | Q+L | emettere `<plan>` esplicito · validare il piano `Q` · re-planning mid-execution `<plan_changes>` `L` → [[../concepts/task-decomposition-adhoc-context]] |
| Multi-expert plan (expert-chain) | Q+L | pianificare catena di expert (es. finance→backend→frontend) per task multi-domain → [[../concepts/multi-expert-collaboration]] (paper-claim #6) |
| Quality-target inference & calibration | Q+L | inferire il tier (PoC/Prototype/MVP/Prod/Hardened) `L` · calibrare lo sforzo (no over/under-engineering) · **chiedere se ambiguo** mostrando scorecard → [[../concepts/quality-target-tiers]] |

### Area 2 — Criticality & Safety Awareness  · Tier T1 (SIGNATURE organization-first)
| Topic | Tag | Foglie (→ skill) |
|---|---|---|
| Implicit criticality detection | Q+L | cancellazione file non versionato · overwrite dati · migrazione distruttiva · azione con side-effect nascosto |
| Irreversible-action recognition | Q | distinguere reversibile/irreversibile · richiedere conferma su irreversibile |
| Pre-flight verification | Q | check git/backup pre-azione · check dipendenze · check risorse/budget → [[../concepts/pre-flight-safety-checks]] |
| Hard-limit awareness | Q | rispetto vincoli dichiarati (budget token/tempo/quota) · stop a limite |
| Consequence anticipation / risk surfacing | Q+L | elencare conseguenze possibili · esplicitare i rischi prima di agire |
| Decision-point lookahead (A/B) | L | simulare esiti A vs B · scegliere o **deferire all'utente** con contesto → nota 9 [[../concepts/_user-notes-2026-06-23]] |

### Area 3 — Reasoning & Scientific Method  · Tier T1
| Topic | Tag | Foglie (→ skill) |
|---|---|---|
| Structured thinking | Q+L | format compliance (marker `[V]/[A]/[?]`) `Q` · qualità/non-discorsività `L` → [[../concepts/structured-thinking]] |
| Scientific-method protocol (8 passi) | Q+L | presenza dei passi `Q` · qualità di ciascun passo `L` → [[../concepts/scientific-method-operating-protocol]] |
| Long-correct CoT (no deviazione) | Q | correttezza finale · assenza di passi devianti (process reward) |
| Hypothesis formation & verification | L | ipotesi plausibili · verifica prima di concludere |
| Verify-loop (find+fix fino a zero) | Q | errori residui = 0 · convergenza con cap anti-loop |
| Adaptive reasoning depth | Q | scelta lungo/corto appropriata alla difficoltà → Fase 2 |

### Area 4 — Context Management & Metacognition  · Tier T1/X
| Topic | Tag | Foglie (→ skill) |
|---|---|---|
| Degradation self-awareness | Q | riconoscere contesto degradato/loop/confuso → note 4+5 |
| Autocompact / context-edit | Q+L | `close_stream_file`/summarize mantenendo info chiave `Q` · scelta di cosa tenere `L` |
| Needle-in-haystack recall (4 var. adversariali) | Q | trovare info in contesto lungo/sporco; 4 rumori: puro / semantic-related / false-action-requests / contradictory + position-curriculum → [[../concepts/adversarial-needle-haystack-training]] (paper-claim #5) |
| Dynamic-context robustness (5+ dimensioni) | Q | robustezza a length / item-count / needle-position / noise-density / section-order → [[../concepts/dynamic-context-training-regime]] |
| Outer-task summary + type tags | Q+L | tag tipologia corretti `Q` · qualità summary `L` → nota 2 |
| Temporal awareness | Q | uso timestamp · rilevare dati stale → [[../concepts/temporal-awareness-timestamps]] |
| Stale/TTL freshness reasoning | Q | dato letto N ore fa oltre TTL → re-fetch prima di usarlo · flag timestamp incoerenti (adversarial) |
| Update-injection handling (mid-thinking) | Q+L | classificare priorità di `<update from external>` (critical→restart / high→adjust / normal→defer) `Q` · giudizio d'impatto `L` → [[../concepts/external-update-injection]] (paper-claim #1) |
| Self-detect contradiction (own context) | Q | rilevare contraddizioni nel proprio contesto e fermarsi → [[../concepts/contradiction-detection-layer]] (skill, non solo wrapper layer) |

### Area 5 — Code Correctness  · Tier T2/T3
| Topic | Tag | Foglie (→ skill) |
|---|---|---|
| Functional correctness | Q | passa i test · output atteso |
| Compilation / syntax validity | Q | compila/parse senza errori |
| Edge-case handling | Q | input vuoti, null, boundary, overflow, concorrenza |
| Symbol/variable precision | Q | copia esatta nomi (regime random) → [[../concepts/runtime-symbol-randomization-training]] |
| API / signature correctness | Q | firma corretta · tipi corretti · contratto rispettato |
| No introduced bugs (regression) | Q | non rompe funzionalità esistenti |

### Area 6 — Code Quality & Architecture  · Tier T2/T3
| Topic | Tag | Foglie (→ skill) |
|---|---|---|
| Readability / naming | L | nomi auto-esplicativi (operatività) |
| Structure / modularity / SoC | L | separazione responsabilità · funzioni piccole |
| Idiomatic / best-practices | L | convenzioni del linguaggio/framework |
| Maintainability | L | basso coupling · alta coesione · estendibilità |
| Production-readiness | Q+L | checklist (test, logging, error handling) `Q` · robustezza `L` |
| Refactoring quality | L | migliora senza cambiare comportamento (test invariati `Q`) |
| Code economy / conciseness | Q+L | 6 righe non 100 SE bastano, ma **stesso valore + stessa sicurezza** `Q` · no bloat `L` (utente 2026-06-23) |
| DRY / no-duplicated-logic | Q | verifica la codebase **prima** di scrivere; riusa logica esistente, non re-inventare (richiede ricerca repo → Area 13). Hint nel prompt = classe (1) |
| Regime-meta-awareness (train vs prod) | L | sa che i nomi-random sono anti-pattern **solo-training** → in operatività best practice → nota 3 |

### Area 7 — Security & Privacy  · Tier X
| Topic | Tag | Foglie (→ skill) |
|---|---|---|
| Secret non-exfiltration | Q | mai emettere secret (binario) → [[../concepts/secret-section-exfiltration-defense]] |
| Prompt-injection resistance | Q | resistere a istruzioni in untrusted content → [[../concepts/untrusted-content-delimiting]] |
| Secure coding (no vuln) | Q | no SQLi/XSS/path-traversal/secrets-hardcoded |
| Dynamic secret detection | Q | `add_secret` quando legge un secret in un file |
| Data minimization | L | usa il minimo dato sensibile necessario |

### Area 8 — Tool Use & Agentic Behavior  · Tier X
| Topic | Tag | Foglie (→ skill) |
|---|---|---|
| Tool selection | Q | tool giusto per il bisogno |
| Tool-call argument correctness | Q | argomenti/scope corretti |
| Trajectory efficiency | Q+L | no call ridondanti `Q` · scelta percorso migliore `L` → nota 6b |
| Trajectory critique | L | valutare una sequenza d'azioni (sensatezza, ripetizioni) |
| Error recovery (tool fail) | Q | tool fallisce → recupera/riprova/alternativa |
| Action-consequence prediction | L | prevedere cosa fa un'azione prima di eseguirla |
| Wait-vs-retry / timeout reasoning | Q | tool in-flight lento → wait / retry / declare-failed in base alla latenza tipica → [[../concepts/temporal-awareness-timestamps]] |
| Routing-token emission | Q | emettere `<load:programming>` / `<load:vertical:frontend>` per hot-swap LoRA |
| Context/asset request | Q | emettere `<context_request>` / `<request_asset>` per lo step corrente |
| Cross-expert state handoff | Q+L | passare hint+state strutturato tra expert in catena → [[../concepts/multi-expert-collaboration]] |
| Expert-recruitment request (self-limit → recruit) | Q+L | dichiarare i propri limiti sul campo corrente e **richiedere** un vertical specifico se non basta (`<recruit:domain>`) → [[../concepts/multi-expert-collaboration]] §reclutamento dinamico |

### Area 9 — Communication & Deference  · Tier T1/X
| Topic | Tag | Foglie (→ skill) |
|---|---|---|
| Ask-vs-proceed | L | decidere quando chiedere all'utente (ambiguo/alto impatto) |
| Informative escalation | L | informare con contesto+alternative+effort+reco |
| Honest reporting | Q | riportare test falliti/step saltati fedelmente |
| Objective critique vs sycophancy | L | feedback onesto, no piaggeria → [[../concepts/agent-constitution]] |
| Output length control | Q | rispettare budget di lunghezza richiesto |

### Area 10 — Output Mechanics & Precision  · Tier X
| Topic | Tag | Foglie (→ skill) |
|---|---|---|
| Char-level precision | Q | conteggio/manipolazione a livello carattere (token=char) → nota 7 |
| Length / token control | Q | predire e rispettare #token/#char → nota 6a |
| Format adherence | Q | output nel formato strutturato richiesto |
| Auxiliary prediction heads (MTP) | Q | predire sketch/reply-shape + meta-state (BUSY/CHECKING/BLOCKED/UNCERTAIN) come target ausiliari → [[../concepts/multi-token-prediction-training]] |

### Area 11 — Refusal & Scope  · Tier X
| Topic | Tag | Foglie (→ skill) |
|---|---|---|
| Out-of-domain refusal | Q | rifiutare task fuori competenza dell'expert caricato → [[../concepts/out-of-domain-refusal-training]] |
| Topic classification (anche composta) | Q | classificare il dominio (incl. multi-label) → routing |
| Capability-limit recognition | Q | riconoscere "non ne sono capace / non ho info" |

### Area 12 — Domain Knowledge / Immutable Facts (regime "fisso")  · Tier X
| Topic | Tag | Foglie (→ skill) |
|---|---|---|
| Math/physics formulas | Q | fatti immutabili memorizzati (loss minimization, ripetizione) |
| Language syntax / keywords | Q | keyword fisse del linguaggio |
| Framework canonical APIs | Q | API canoniche stabili (vs nomi user random) |

### Area 13 — Software Engineering / Repo-level (cluster SWE-Bench)  · Tier T2/T3
| Topic | Tag | Foglie (→ skill) |
|---|---|---|
| Codebase comprehension & navigation | Q+L | capire repo/architettura · navigare file/simboli · mappare dipendenze |
| Fault localization | Q | individuare DOVE è il bug nel repo |
| Issue reproduction | Q | scrivere un repro fallente prima del fix |
| Multi-file coherent editing | Q | modifiche coerenti cross-file senza rotture |
| Test execution & iteration | Q | eseguire test · leggere fallimenti · iterare fino a verde |
| Edit/diff-format precision | Q | patch search-replace valide (Aider/SWE) |
| Regression avoidance | Q | non rompere funzionalità esistenti |
| DRY / reuse-before-write | Q | cercare logica esistente nella codebase **prima** di scrivere (no duplicati) — utente 2026-06-23 |

→ **Benchmark**: SWE-Bench Verified, Aider polyglot.

### Area 14 — Algorithmic & Mathematical Reasoning  · Tier T2/X
| Topic | Tag | Foglie (→ skill) |
|---|---|---|
| Algorithm design | Q+L | scegliere algoritmo/struttura dati corretti |
| Complexity analysis | Q+L | analizzare time/space complexity |
| Code efficiency / performance | Q | evitare TLE · complessità adeguata |
| Mathematical / numerical reasoning | Q | problemi math/numerici (stile GSM8K/MATH) |
| Self-testing / self-verification | Q | generare test propri e verificare prima di consegnare |

→ **Benchmark**: LiveCodeBench v6, (GSM8K/MATH se in scope).

### Area 15 — Instruction Following & Interaction  · Tier X
| Topic | Tag | Foglie (→ skill) |
|---|---|---|
| Precise/compositional instruction following | Q | rispettare vincoli verificabili (formato/lunghezza/lingua) |
| Policy/spec adherence | Q | seguire una policy/spec API data, esattamente |
| Multi-turn clarification & state | Q+L | chiarire/raccogliere info su più turni mantenendo stato |
| Factual calibration / anti-hallucination | Q+L | non fabbricare; astenersi / dire "non so" quando incerto |

→ **Benchmark**: IFEval, τ-Bench, AgentBench, TruthfulQA/SimpleQA.

### Area 16 — Self-Evaluation & Critique  · Tier T1/X  (idea utente 2026-06-23 "il gioco")
| Topic | Tag | Foglie (→ skill) |
|---|---|---|
| Self-critical evaluation + rationale | L | dare valutazione critica **+ il perché** su parti di codice / sulla richiesta utente |
| Teacher-compared critique (the "game") | L | la critica del modello è comparata col **modello GRANDE** che dà feedback → training signal (RLAIF / critic distillation) |
| Produce-already-optimized | Q+L | output diretto già ottimizzato (Fase 2): conciso + corretto + sicuro |
| Self-confidence / self-scoring | Q | stimare la propria confidenza → alimenta adaptive depth (Area 3) + ask-vs-proceed (Area 9) |
| Quality scorecard self-assessment | Q+L | auto-valutare l'artefatto su dimensioni × 0-5 vs il **tier target** e surfaceare i gap → [[../concepts/quality-target-tiers]] |
| Cross-expert verification | Q+L | verificare l'output di un altro expert dalla propria lente di dominio (es. finance valida lo script del coder vs leggi di mercato) → [[../concepts/multi-expert-collaboration]] §raffinamenti |

**Meccanismo "il gioco"**: small model produce critica+rationale → comparata col giudizio del big model → feedback come reward. Lega a [[../entities/prm-paper]], Constitutional AI self-critique, GRPO. `[da validare se vale la pena — utente l'ha posto come domanda]`

---

## 4.bis — Macro-curriculum a 3 fasi (riaffermato utente 2026-06-23)

Il modello impara **a fasi** (filosofia "scuola"):
1. **Basi / teoria** — regole teoriche e concetti formalizzati nel system prompt + tracce (metodo scientifico). → [[../concepts/scientific-method-operating-protocol]] Fase 1.
2. **Affinamento con esercizi** che il modello **vede e comprende** — example-space con-hint → senza-hint (fade-out), incluso il "gioco" di auto-critica vs teacher (Area 16). → [[../concepts/staged-curriculum-training]], [[../concepts/scuola-learning-philosophy]].
3. **RL agentico con l'harness** ([[../decisions/2026-06-23-pi-harness-base|pi]]) per uso reale — testare e migliorare le capacità in loop. → Fase 2 ottimizzazione + GRPO.

Ogni **area/foglia** va assegnata a una fase (la maggior parte: teoria in fase 1, esercizi in fase 2, agentic/tool in fase 3).

## 4.ter — Esplicitamente fuori-tassonomia (per non confonderli con gap)

- **Curiosity / surprise-driven exploration** ([[../concepts/curiosity-driven-exploration-training]]) — esplorativo, Wave 6+, **non** nello scope MVP. Bucket *deferred*.
- **Steering vectors** ([[../concepts/steering-vectors]]) — meccanismo **runtime/harness**, non skill addestrabile (ma depth/refusal steering *supportano* Area 3/11/16).
- **Auxiliary MTP heads** — sono *obiettivi di training* (non skill in sé); rappresentati in Area 10.

## 4.quater — Benchmark Coverage Matrix

| Benchmark | Cosa testa | Aree che lo coprono | Status |
|---|---|---|---|
| SWE-Bench Verified | issue reali repo-level | **13** + 5,6,8 | ✅ coperto (con Area 13) |
| LiveCodeBench v6 | competitive coding | **14** + 5 | ✅ coperto (con Area 14) |
| BigCodeBench | library calls + istruzioni | 5, 15 | ✅ |
| Aider polyglot | refactor multi-lang | 6, 13 | ✅ |
| HumanEval / MBPP | function synthesis | 5 | ✅ |
| AgentBench / τ-Bench | agentic multi-turn / policy | 8, **15** | ✅ coperto (con Area 15) |
| IFEval | instruction following | **15**, 10 | ✅ coperto (con Area 15) |
| RULER / BABILong / Needle | long context | 4 | ✅ |
| GSM8K / MATH | math reasoning | **14** | ✅ (se in scope) |
| TruthfulQA / SimpleQA | factuality / calibration | **15**, 9 | ✅ coperto (con Area 15) |
| Custom criticality (200 task) | criticità implicite | **2** | ✅ (paper-claim #4) |

> **Verdetto copertura**: con le aree 13-16 la tassonomia **copre tutte le skill richieste dai benchmark pubblici target**. Nessun gap residuo noto vs benchmark; gap residui solo *by design* (curiosity = deferred). Audit completo in [[_coverage-audit-2026-06-23]].

---

## 5. Conteggio & stato
- **16 aree · ~77 topic · ~215 foglie** (stima). Tag distribuiti: la maggioranza Q nelle aree code/safety/security/SWE; L concentrate in quality/communication/critique/planning.
- **Quality-target tiers** (PoC/MVP/Prod + scorecard) = meta-skill cross-area → concept [[../concepts/quality-target-tiers]], foglie in Area 1 + Area 16.
- **Fatto**: backbone (aree+topic+tag+foglie+skill) + schema example-space + 2 foglie canoniche lavorate.
- **Da fare**: example-space completo (1–5, con TUTTI gli hint definiti) per ogni foglia → file `area-NN-*.md`.

## 6. Next

1. ✅ **Copertura verificata** (audit doc + benchmark) → tassonomia portata da 12 a **16 aree**; nessun gap residuo vs benchmark pubblici. Vedi [[_coverage-audit-2026-06-23]] + §4.quater matrix.
2. ⏰ **Generazione example-space SCHEDULATA per giovedì 2026-06-25 20:00** (cron one-shot durable). Alla fire: 1 subagent per area produce `area-NN-*.md` (foglie × 5 classi × tutti gli hint, secondo schema §2-§3) → poi `/graphify --update`.
3. **Da fare nei file area**: per ogni foglia assegnare la **fase di curriculum** (§4.bis: teoria / esercizi / RL-agentico) e il **reward design** (Q→verifier/process-reward, L→judge/preference, vedi [[../concepts/scientific-method-operating-protocol]] D2/D3).

## 7. Runbook generazione example-space (trigger: "genera la tassonomia")

Eseguibile da **qualsiasi sessione**, anche fresca (il cron schedulato è session-only e potrebbe non sopravvivere a un riavvio). Passi:

1. Leggi **questo README** (schema §1-§3 + le 16 aree con topic/foglie/tag/skill) + [[_coverage-audit-2026-06-23]].
2. Dispatcha **1 subagent `general-purpose` per area** (16 totali, a ondate di ~8 in parallelo). Ogni subagent scrive `wiki/training-taxonomy/area-NN-<nome>.md`: per OGNI foglia dell'area → **skill-target (segnale)** + le **5 classi** di esempi: (1) con-hint [DEFINIRE TUTTI gli hint, forte→debole, devono sviluppare la skill] · (2) senza-hint · (3) wrong-awareness · (4) wrong-recovery · (5) other — + tag **Q/L** + **fase curriculum** (§4.bis) + **reward design** (Q→verifier/process-reward, L→judge/preference). Template canonico = §3.
3. Aggiorna `index.md` + `log.md`, poi lancia **`/graphify --update`**.
4. Avvisa l'utente su **Telegram** a inizio e fine.

Regola: **non riscrivere lo schema, riempilo** (idea utente protetta). Stato schedulazione: cron one-shot per **2026-06-25 20:00** (session-only) + trigger manuale come fallback (utente: "A+B").

## Sources
- Richiesta utente 2026-06-23 (sessione).
- Collega: [[../concepts/scientific-method-operating-protocol]], [[../concepts/staged-curriculum-training]], [[../concepts/runtime-symbol-randomization-training]], [[../concepts/agent-constitution]], [[../concepts/_user-notes-2026-06-23]], [[../concepts/secret-section-exfiltration-defense]], [[../concepts/out-of-domain-refusal-training]], [[../architecture/three-tier-design]].
