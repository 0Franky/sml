---
name: open-questions
description: Decisioni da chiudere con l'utente. Status aggiornato + raccomandazioni precompilate.
type: questions
last_updated: 2026-06-29
---

# Open Questions

> ⚠️ Parzialmente superato dagli ADR 2026-06-28 (D1-D6) + msg 266 (compute-access); vedi [[decisions/2026-06-28-decisions-d1-d5]]. Diversi item ancora marcati `open` qui sono stati chiusi o ridefiniti da quelle decisioni. Contenuto storico mantenuto: i pointer indicano dove la decisione è stata superata.

Status dopo grill-me #1 (2026-05-21). Le wrapper-related sono posticipate al grill-me #2.

Convenzione: ogni domanda ha **Status** (open / closed / deferred), **Raccomandazione precompilata** (se possibile) con **Ragione**. Dopo conferma utente → entry in `decisions/`.

---

## Blocco 1 — Vision

### #1 Use case primario ✅ CLOSED 2026-05-21
**Risposta**: Agent autonomo coding versatile (tutti i livelli: code+exec+git+cross-codebase+multi-day).

### #2 Forma del wrapper → grill-me #2 dedicato
**Status**: deferred (richiesta utente). Sotto-domande emerse: deployment (CLI/IDE/web/orchestrator), context organization, memory layer, tool calling, sandbox, session lifecycle, streaming.

### #3 Utenti finali ✅ CLOSED 2026-05-21

**Risposta utente**: "target ultimo se riesco commerciale, ma facciamo le cose per step, prima mvp poi oos community, poi commerciale nel caso".

**Sequenza target audience**:
1. **MVP**: solo l'utente. Workflow ottimizzato sul suo uso reale, no auth/multi-tenant, eval su task tuoi specifici + benchmark standard.
2. **OSS community**: post-MVP (post Wave 6-8 con modello funzionante). Release Apache 2.0 su GitHub, documentazione onboarding, dataset/pesi pubblici.
3. **Commerciale**: north star ultimo, eventualmente. Richiede team + funding + business logic.

**Implicazioni operative**:
- Wave 1-8: single-user, niente auth/multi-tenant nel wrapper
- Documentazione rigorosa sin da subito (facilita OSS release dopo)
- Dataset training può essere customizzato al workflow utente (no need di generalist a tutti i costi)
- Wrapper architettura deve essere **non-blocking** per future feature multi-user (es. memory layer pluggabile, non hard-coded single-user assumption)

→ ADR cross-reference: vedi `decisions/2026-05-21-vision-clarification.md` per dettagli.

### #4 Vincoli pubblicazione — open

**Raccomandazione precompilata**: **Vision paper-worthy + release open-weight**. Ipotesi paper: "Hierarchical LoRA adapter stacking for autonomous coding agents: a three-tier architecture on Qwen3 family". Vale la pena se Step 2-3 producono numeri SWE-Bench competitivi. Apache 2.0 modello + dataset + codice → comunità OSS riproduce. Skill ARIS (`aris-paper-write`, `aris-research-pipeline`) supportano workflow.

**Chiarimento utente 2026-05-21**: "Facciamolo, documentiamo tutto perché poi voglio creare il repo e renderlo pubblico su GitHub. Non so se vale la pena di renderlo pubblico già mentre sviluppo o solo dopo. Comunque tu intanto segna tutto che non ci dobbiamo perdere nulla."

→ **Decisione preliminare**: GitHub publish pianificato. Timing (durante dev vs dopo MVP) da decidere. **Documentazione rigorosa** è priorità ALTA per facilitare future publishing.

**Sub-domande emerse**:
- Pubblicare durante sviluppo → trasparenza, possibili contributor, ma esposizione idee originali pre-paper
- Pubblicare dopo MVP funzionante → claim paper più solidi, ma niente network effect early
- Licenza scelta (Apache 2.0 default per coerenza con Qwen base, MIT alternative, GPL se vuoi protezione forte)
- README + docs di onboarding necessari prima di publish
- Repo già su `github.com/0Franky/sml` (privato attualmente)
- Possibili paper-contribution claims (3 gap identificati): structured update injection, runtime contradiction detection, runtime symbol randomization training

---

## Blocco 2 — Architettura

### #5 Base orchestratore ✅ CLOSED 2026-05-21 (ADR base-model-pipeline)
Qwen3-4B locale → Qwen3-8B cloud → Qwen3.6-35B-A3B target SOTA.

### #6 Base verticali ✅ CLOSED 2026-05-21 (stesso ADR)
Stessa famiglia del orchestratore.

### #7 Routing tra orchestratore e LoRA ✅ CLOSED 2026-05-21

**Risposta utente**: Ibrido (classifier + token speciali) confermato.

**Architettura runtime**:
1. **Classifier esterno fast-path**: BERT-tiny finetuned o regex+keyword. <50ms, deterministico. Decide coarse: "è coding? quale macro-area (frontend/backend-py/backend-ts/data/devops)?"
2. **Token speciali orchestratore**: durante reasoning Tier 1 può emettere `<load:programming>`, `<load:vertical:frontend>`, etc. per scelte fini ambigue. Trainato esplicitamente in Tier 1 (dataset include examples di routing decision).
3. **Fallback safe**: se confidence classifier bassa AND nessun token speciale emesso → carica solo `programming` LoRA default (MVP v2+, post-Tier 2).

**MVP v1**: solo classifier esterno (Tier 1 non ancora trained per emettere token speciali). Token routing aggiunto in Wave 6+ (training Tier 1 cloud).

**Implicazioni operative**:
- Dataset Tier 1 deve includere examples di routing token decision (Wave 6+)
- Wrapper deve implementare hook che intercetta `<load:X>` token e fa hot-swap PEFT
- Audit log di ogni routing decision (per debug e paper futuro)
- Compatibile con `pre-flight-safety-checks` (token speciale può triggerare check pre-load)

### #8 Stacking programming + verticale ✅ CLOSED 2026-05-21
### #14 Composition-aware training ✅ CLOSED 2026-05-21 (decisione combinata)

**Risposta utente**: Strategia A confermata — Composition-aware training + additive runtime.

**Setup runtime (MVP v2+)**:
- Tier 2 programming generalist + Tier 3 verticale caricati simultaneamente
- Stacking additive standard PEFT (`--enable-lora` con multi-adapter)
- Wrapper gestisce hot-swap di Tier 3 quando cambia dominio

**Setup training (Wave 6+ quando Tier 2 esiste)**:
- Tier 3 trainato con Tier 2 caricato e **frozen** (`requires_grad_=False` su Tier 2)
- Gradient di Tier 3 "vede" Tier 2 → si adatta per ridurre interferenza
- Costo: ~+50% wall-clock training (forward pass attraversa entrambi)
- Mantiene modularità completa (Tier 2 e Tier 3 entrambi swap-abili)

**Fallback escalation**: se strategia A mostra interferenza ingestibile in Wave 7-8 → escalate a strategia C (X-LoRA / MoLE / HMoRA composition learned). Documentato come Plan B nel concept `lora-stacking.md`.

**Compatibile con stack PEFT Wave 2**: DoRA + LoRA+ + RsLoRA + composition-aware = 4 tecniche stackate.

### #9 Granularità verticali ✅ CLOSED 2026-05-21

**Risposta utente**: Area larga Frontend r=64 confermata.

**Decisione dominio**: 3-5 LoRA area larga
- Frontend (React + Next + Vue + TS + CSS + styling) — MVP v1
- Backend Python (FastAPI + Django + asyncio + pytest + pandas) — Wave 6+
- Backend TypeScript/Node (Express + Nest + TS + Prisma) — Wave 6+
- Data/Infra — opzionale Wave 7+
- DevOps — opzionale Wave 7+

**Decisione size tecnico LoRA Tier 3 MVP v1**:
- QLoRA NF4 **rank 64**, alpha 128, target all-linear
- Stack PEFT: **DoRA + LoRA+ (λ=15) + RsLoRA**
- Dataset ~30K sample multi-framework
- VRAM ~5-6GB su 2080 Ti 11GB
- Eval: LiveCodeBench frontend + 200 custom + SWE-Bench Lite frontend

**Metodologia completa + checklist verifiche**: vedi [[../concepts/lora-sizing-methodology]] (file dedicato).

### #10 Programming generalist necessario? — open
**Raccomandazione precompilata**: **Sì in Step 1-2, validare empiricamente per Step 3**.
- Step 1-2 (Qwen3 dense generic): il programming generalist riempie il gap tra orchestrator (organizzativo) e verticali (stack-specific). Senza, l'orchestrator sarebbe sovraccarico di conoscenza coding generica.
- Step 3 (Qwen3.6-35B-A3B): MoE + scale = base potrebbe già contenere knowledge programming generalist sufficiente. Validare con **ablation A/B**: con programming LoRA vs senza, eval delta. Se delta <3% → drop programming LoRA in Step 3.
Ragione: evidence-based. Tier 2 ha costo training reale, va giustificato.

---

## Blocco 3 — Training

### #11 Hardware ✅ CLOSED 2026-05-21 (⚠️ aggiornato 2026-06-28: vedi [[decisions/2026-06-28-compute-access]])
2080 Ti 11GB locale → cloud **A100-80GB** (Step 2) → cloud H100 80GB / B200 (Step 3).

> ⚠️ **Correzione 2026-06-28 (msg 266)**: serve **A100-80GB** (non 40GB) per il full-FT del Tier 1 — QLoRA ≠ full-FT (il full-FT ha footprint VRAM molto maggiore). Dettagli accesso compute (NVIDIA Inception, spot A100, costi per-run) in [[decisions/2026-06-28-compute-access]].

### #12 Dataset interni disponibili? — open
**Raccomandazione precompilata**: **Probabilmente no nel breve termine**. Costruisci da OSS:
- The Stack v2 filtered (BigCode) — base coding generico
- OSS-Instruct (Magicoder) — synthetic istruzioni
- CommitPackFT — istruzioni da git commits
- SWE-bench-train — real PR pairs
- Aider-leaderboard data — multi-turn refactoring
Decontamination obbligatoria vs eval set. Skill `ml-ml-training-recipes` + `aris-experiment-plan` per pipeline.
Ragione: utente è ricercatore solo, dataset interni proprietari improbabili. Conferma necessaria.

### #13 Replay coding % nel training orchestratore ✅ CLOSED 2026-05-21

**Risposta utente**: Adaptive — iniziamo con 10%, calibri empiricamente.

**Strategia Wave 5 (MVP v1)**:
1. **Start**: 10% sample coding (~3K su 30K dataset Tier 1)
2. **Run training + eval** LiveCodeBench post-training (subset frontend tasks)
3. **Decision tree adattivo**:
   - Forgetting <3% vs baseline pretrained → 10% OK, freeze
   - Forgetting 3-10% → retry con 15%
   - Forgetting >10% → retry con 20%
4. **Documenta numero finale** in `wave-5-closure-ADR.md` (futuro)

**Razionale**: approccio scientifico evolutivo. Evita over/under-replay deciso a priori. Costo: 2-3 train run iterativi (~+50% tempo Wave 5) ma garantisce sweet spot empirico.

**Implicazione**: dataset Tier 1 deve essere generato con ratio coding/organization parametrizzabile (non hard-coded). Generator B1 (vedi `pipeline-architecture-data-generation`) deve avere flag `--coding-ratio 0.10`.

### #14 Composition-aware training per verticali → ✅ CHIUSA, vedi §#14 a `:87` (moncone rimosso 2026-07-16)

> **✅ RISOLTA il 2026-07-16 — questo era un MONCONE, non una domanda aperta.**
> La risposta vera vive a **`:87`**, accanto a #8: *"Risposta utente: **Strategia A confermata** —
> composition-aware training + additive runtime"*, col setup completo (Tier-3 addestrato con **Tier-2 caricato
> e frozen** → i gradienti del verticale "vedono" il generalista e si adattano a non interferire; costo ~+50%
> wall-clock; fallback su X-LoRA/MoLE/HMoRA se l'interferenza diventa ingestibile in Wave 7-8).
> Questa sezione conteneva **solo** *"Raccomandazione precompilata: Sì (vedi #8)"* — cioè la scheda
> **pre-decisione** rimasta indietro dopo che la risposta era arrivata ed era stata registrata sopra.
>
> **Nota di processo (perché lo scrivo invece di cancellare in silenzio).** Il 2026-07-16 l'avevo marcata
> *"CONTESA, la sa solo l'utente"* — **sbagliato**: mi ero fermato ai **titoli** senza aprire i **corpi**, e i
> corpi discriminavano da soli. È l'errore **simmetrico** alla regola #0: non fermarsi al livello comodo, ma
> nemmeno **dichiarare non-decidibile ciò che una lettura in più decide**. L'eccesso di cautela non è gratis —
> produce un **falso gate** che consuma l'attenzione dell'utente su una domanda già chiusa (la simmetria di
> #0 e #30: over-gating è un fallimento quanto l'under-verification).
**Raccomandazione precompilata**: **Sì** (vedi #8). Costo 2x giustificato.

### #15 Post-training ✅ CLOSED 2026-05-21 (+ idea curriculum staged)

**Risposta utente**:
1. **Skip RL in MVP v1** (solo SFT su 2080 Ti)
2. **ORPO + PRM + GRPO (se necessario) in Wave 6 cloud** (A100)
3. **Idea originale aggiunta**: curriculum SFT staged a 4 fasi (vedi sotto + nuovo concept dedicato)

### Curriculum SFT stage-by-stage (nuova idea utente)

> "Sarebbe possibile fare prima parte di training SOLO sui task di reasoning → poi organizzazione → poi coding e il resto? Vorrei abbassare la loss sezione per sezione: <sezione solo reasoning> → <reasoning + organization> → <reasoning + organization + awareness> → <reasoning + organization + awareness + coding>"

**4 stage SFT incrementali**, ognuno abbassa loss sopra la base precedente:

| Stage | Dataset | Cosa consolida | Eval dopo stage |
|---|---|---|---|
| 1 | Solo reasoning strutturato (caveman thinking, marker `[V]/[A]/[?]`) | Formato pensiero strutturato | Eval reasoning format compliance |
| 2 | Stage 1 + organization (planning, decomposition, state tracking) | Capacità organizzativa | Eval AgentBench OS + τ-Bench |
| 3 | Stage 2 + criticality awareness + safety reasoning | Awareness criticità implicite | Eval custom criticality 200 task |
| 4 | Stage 3 + coding replay 10% + generic | Coding + general (Tier 1 finale) | Eval HumanEval (forgetting check) + LiveCodeBench |

Concept dedicato: vedi [[../concepts/staged-curriculum-training]] per dettagli, rischi, riferimenti letteratura.

### #16 Framework training ✅ CLOSED 2026-05-21

**Risposta utente**: Pipeline mista per wave confermata.

**Stack framework per wave**:

| Wave | Framework primario | Use case | Razionale |
|---|---|---|---|
| **Wave 5 (MVP v1 locale)** | **Unsloth** | Qwen3-4B QLoRA + curriculum staged + adversarial needle ridotto + out-of-domain refusal | 2× speedup single-GPU, Qwen ottimizzato, Turing compatibile, Apache 2.0, ecosystem maturo |
| **Wave 6 (MVP v2 cloud A100)** | **Axolotl** | Qwen3-8B Full FT + Tier 2-3 LoRA stacked composition-aware | YAML config rapido, multi-GPU native |
| **Wave 6 RL phase** | **TRL native** | ORPO + PRM + GRPO post-training | Standard HuggingFace, granular control RL |
| **Wave 7-8 (target finale MoE)** | **ms-swift** (Alibaba native) o **TRL + DeepSpeed ZeRO-3** | Qwen3.6-35B-A3B MoE training | ms-swift ottimizzato per Qwen family + MoE supportato; TRL+DeepSpeed fallback standard |

**Trade-off accettato**: 3 strumenti diversi da imparare cross-wave. Beneficio: ogni framework nel suo sweet spot, no workaround forzati.

**Skill rilevanti**: `ml-unsloth`, `ml-axolotl`, `ml-trl-fine-tuning`, `ml-llama-factory`, `ml-deepspeed`, `ml-openrlhf`.

---

## Blocco 4 — Eval

### #17 Benchmark obbligatori ✅ CLOSED 2026-05-21

**Risposta utente**: Doppio focus (Tier 1 standalone + Tier 1+3 insieme) confermato.

**Eval suite MVP v1**:

**Tier 1 standalone** (vision organization-first):
- τ-Bench (multi-turn tool use con state)
- AgentBench OS subset (planning multi-step generale)
- **Custom criticality awareness 200 task** (nostro contributo originale, gap letteratura)
- **Custom multi-day continuity 50 task** (resume from yesterday, gap analysis)

**Tier 1+3 frontend** (modello completo):
- LiveCodeBench v6 frontend subset
- SWE-Bench Lite frontend issues
- **Custom 200 frontend tasks** (cross-framework: React+Vue+Next)

**Sanity check (forgetting baseline vs FT)**:
- HumanEval/MBPP (saturi ma utili per misurare forgetting)

**Skip in MVP v1 (aggiunti Wave 6 cloud)**:
- SWE-Bench Verified full
- BigCodeBench
- Aider Polyglot

**Razionale**:
- Doppio focus rispetta vision organization-first
- Custom criticality awareness è **paper claim candidato #4** (insieme ai 2 gap noti + organization-first SFT)
- Skip benchmark heavy in MVP v1 per snellezza, full suite in Wave 6+ cloud

**Tooling consigliato**: `lm-evaluation-harness` (oltre 60 benchmark) + `bigcode-evaluation-harness` (coding-specific) + custom Python runner per criticality/multi-day.

### #18 Custom eval interno — open
**Raccomandazione precompilata**: **Sì, 200 task per verticale**, esecuzione automatica + 50 human eval sample.
- Per ogni LoRA verticale (frontend, backend-py, backend-ts, ecc.): 200 task multi-turn con esecuzione test.
- Cross-domain regression: LoRA frontend NON deve degradare backend (eval cross).
- 50 sample human eval per validare metriche automatiche.
Ragione: standard benchmark non catturano la nostra granularità verticale; custom eval permette ablation rigorosa.

### #19 Baseline da battere + SOFFITTO di qualità — ⏳ open (parz. deciso 2026-06-29)
**Due riferimenti distinti** (decisione utente msg 314 Q3):
1. **BASELINE-da-battere** (floor, same-class): **Qwen3-4B-Instruct-2507 base** misurato su quad-suite Phase 0 → il numero diventa la baseline. Ogni LoRA verticale ≥ +5% sul domain-specific eval, no degrado > 2% cross-domain. *Ragione: hard target evita "vibe-check"; soglia 5% giustifica il costo training.*
2. **SOFFITTO di qualità** (ceiling, reference, NON competitor-da-battere): **Claude Sonnet latest** (`claude-sonnet-4-6`) sulle stesse suite (criticality + coding). Serve a **calibrare il gap** verso un modello di frontiera molto più grande — *quanto ci avviciniamo al soffitto*, non un target da superare (irrealistico per un 4B). Si riporta come banda di riferimento nei grafici di eval (baseline-floor … nostro-modello … ceiling-Sonnet).
   - ⚠️ **Vincolo ToS**: Claude può essere usato come **riferimento di misura/ceiling** (eval), MAI **dentro il loop di reward/training** (council judge resta OPEN — DSv4/Qwen, vedi [[concepts/judge-design]]). La distinzione è netta: misurare-vs ≠ trainare-con.

---

## Blocco 5 — Roadmap

### #20 Timeline scadenze esterne — open
**Raccomandazione precompilata da chiedere**: hai paper deadline (NeurIPS Jul 2026, ICLR Sep 2026, ICML Jan 2027)? Demo concrete? Solo ricerca senza deadline?

### #21 Coinvolgimento (autonomia vs step-by-step) — open
**Raccomandazione precompilata**: **Step-by-step su decisioni architetturali + ADR, autonomo su esecuzione training** (notturna). Aggiornamenti via log.md + ADR su decisioni emergenti durante esperimenti. Skill `aris-auto-review-loop` per loop autonomi notturni.
Ragione: tu vuoi controllo su strategia, ma esperimenti di training (12h+) sono naturalmente autonomi.

### #22 MVP ✅ CLOSED 2026-05-21 (v1 e v2 definite)

**Risposta utente**: "Mini Three-Tier funzionante" + chiarificazione successiva: "MVP v1 = Tier 1 + Tier 3 → se validiamo → MVP v2 = Tier 1 + Tier 2 + Tier 3".

**MVP v1** (primo deliverable, ~Wave 5):
- **Tier 1 organization mini-FT** su Qwen3-4B locale
- **+ Tier 3 LoRA verticale frontend** caricato sopra (self-contained: knowledge coding generic + frontend specifico)
- **Skip Tier 2** programming generalist (escalation a v2 se v1 valida)
- **Eval**: criticality awareness Tier 1 standalone + SWE-Bench Lite frontend Tier 1+3

**MVP v2** (post-validazione v1, ~Wave 6):
- Aggiunge **Tier 2 programming generalist** sopra Tier 1
- Valida ipotesi "Tier 2 ponte coding-generic è utile vs Tier 3 self-contained"
- Eval comparativo: stesso eval suite, vs metric v1

**Razionale aggiornato post-vision-clarification**:
- La raccomandazione precompilata originale ("1 LoRA frontend solo") era pre-vision clarification — non ottimale perché non valida Tier 1 organization (che è il valore principale)
- Mini Three-Tier valida **entrambe** le ipotesi critiche simultaneamente: organization-first + modularità LoRA stacking
- Costo locale ~$0 (2080 Ti)
- Successo: entrambi i livelli battono baseline +5% → promosso, scale-up cloud Wave 6
- Fallimento di un livello → identifica esattamente dove ripensare

**Cosa NON è in MVP**:
- Tier 2 programming generalist (verrà in Wave 6-7)
- Wrapper Web/App (verrà in Wave 9)
- Post-training RL (ORPO/PRM) — verrà in Wave 6
- Multi-day session continuity tests (verrà in Wave 7-8)
- Cross-codebase reasoning su repo grandi (verrà in Wave 7-8)

### #23 Ipotesi paper / claim — open
**Raccomandazione precompilata da raffinare con te**: **"Three-tier hierarchical LoRA adapter stacking outperforms monolithic fine-tuning for autonomous coding agents at <30B scale"**. Ablation key: (a) base vs base+programming; (b) base+programming vs base+programming+verticale; (c) tre tier vs monolithic full-FT. Numeri target: SWE-Bench Verified +Xpt, LCB +Ypt.
Ragione: claim "modular > monolithic" è verificabile, novelty rispetto a HMoRA/X-LoRA che fanno routing differenziabile invece di sequential hot-swap. Da affinare quando hai più dati.

---

## Blocco 6 — Ottimizzazioni contesto/ragionamento → grill-me #2 dedicato

Posticipate a sessione dedicata wrapper:

- #24 Thinking mode (Qwen3 native vs custom token reasoning vs CoT esplicito)
- #25 Long context (context length target, RoPE/YaRN scaling, lost-in-the-middle mitigation)
- #26 Tool calling (nativo modello vs framework esterno LangGraph)
- #27 Memory persistente tra sessioni (forma, semantic search, decay strategy)
- #28 Streaming/latency (TTFT target, streaming token, KV cache reuse)

Sotto-domande emerse durante grill-me #1 (da approfondire in grill-me #2):
- **Context organization**: layered + RAG + compaction strategy (preview in grill-me #1)
- **Sandbox**: Docker vs Firecracker vs bare-process. Sicurezza vs latency.
- **Multi-day session persistence**: cosa sopravvive tra restart (codebase state, memory, plan, history)?
- **Tool granularity**: tool atomici (read_file, write_file, exec_shell) vs tool aggregate (apply_patch, run_tests, git_commit)?
- **Tool calling format**: JSON native, XML, structured (Qwen function calling)?
- **Concurrency**: agent loop sync vs async, multi-tool parallel calls?
- **Audit/replay**: ogni interazione loggata per debug? Replay session per regression?

---

## Tabella riassuntiva

| # | Topic | Status | Notes |
|---|-------|--------|-------|
| 1 | Use case | ✅ closed | Agent autonomo |
| 2 | Wrapper form | ⏸ deferred grill-me #2 | |
| 3 | Utenti finali | ✅ closed | solo tu MVP → OSS → commerciale (north star) |
| 4 | Pubblicazione | ⏳ open | rec: paper-worthy + open-weight |
| 5 | Base orchestratore | ✅ closed | Qwen3-4B → 8B → 3.6-35B-A3B |
| 6 | Base verticali | ✅ closed | Stessa famiglia |
| 7 | Routing | ✅ closed | ibrido classifier + token speciali (MVP v1 = solo classifier) |
| 8 | Stacking | ✅ closed | composition-aware training + additive runtime (strategia A) |
| 9 | Granularità | ✅ closed | 3-5 LoRA area larga, frontend r=64 MVP v1 |
| 10 | Programming generalist? | ⏳ open | rec: sì Step 1-2, ablation Step 3 |
| 11 | Hardware | ✅ closed | 2080 Ti + cloud progressivo |
| 12 | Dataset interni | ⏳ open | rec: no, costruire da OSS |
| 13 | Replay coding % | ✅ closed | 10% adaptive (calibrato empiricamente Wave 5) |
| 14 | Composition-aware | ⏳ open | rec: sì (vedi #8) |
| 15 | Post-training | ✅ closed 2026-05-21 | skip RL in MVP v1 · ORPO+PRM+GRPO Wave 6 · curriculum SFT a 4 fasi (corpo §#15:171 + memory `project_post_training_strategy`) |
| 16 | Framework | ✅ closed 2026-05-21 | Unsloth → Axolotl → ms-swift/TRL+DeepSpeed, pipeline mista per wave (corpo §#16:193 + memory `project_framework_stack`) |
| 17 | Benchmark | ✅ closed 2026-05-21 | quad-suite SWE+LCB+BCB+Aider (corpo §#17:214 + memory `project_eval_suite`) |
| 18 | Custom eval | ⏳ open | rec: 200/verticale + 50 human |
| 19 | Baseline + soffitto | ⏳ open (parz.) | floor: Qwen3-4B base Phase 0 · **ceiling: Claude-Sonnet-4-6** (reference, non target; fuori dal reward-loop per ToS) |
| 20 | Timeline | ⏳ open | da chiederti deadline |
| 21 | Coinvolgimento | ⏳ open | rec: step-by-step strategy + auto training |
| 22 | MVP | ✅ closed | Mini Three-Tier Tier1+3 (la reco "1 LoRA frontend prima di Tier 1" è SUPERATA) |
| 23 | Claim paper | ⏳ open | rec: "modular > monolithic at <30B" |
| 24-28 | Context/reasoning | ⏸ deferred grill-me #2 | |
| 29 | **Context-layout model-controlled (pinned salience zone)** (msg 538, 2026-06-29) | ⏳ open — DA VALIDARE (review+sim) | **Idea utente**: dare al modello la capacità di riordinare la struttura del contesto (JSON posizionale) per spostare i concetti ad alto rilievo dove gli è più comodo (es. fine-contesto, alta recency) su contesti lunghi. **Tensione (catena)**: WHY=position-bias reale (lost-in-the-middle; coda=recency alta) → generalizza l'aim-in-coda già shippato. PROBLEMA=il reorder libero della struttura fissa rompe la **cache-stable-prefix** (KV-cache riusata cross-turno → reorder=cache-invalidata=riprocessa tutto, costoso) + carico training + meta-hack ("riordina per sembrare organizzato"). **RECO (cache-aware)**: NON reorder totale → tenere PREFISSO STABILE (cached) + piccola **zona-pin in CODA model-controlled** (bounded 1-3 item, tool `pin_context(ids)` → lane `<pinned>` finale). Split STABILE(cached)\|VOLATILE(coda). Il modello già influenza l'ordine indiretto (CURR→aim, priority/deps→task_list). **Raffinamento utente (msg 540/541)**: il reorder è model-triggered + un algoritmo %-contesto che AUTO-riposiziona gli item importanti OPPURE manda un reminder; **in LOCALE il cache-miss NON costa soldi** (concessione: l'obiezione-costo cade). **Obiezioni residue (non-costo)**: (1) beneficio NON provato (un 4B può impaginarsi peggio → thrash); (2) carico training + meta-hack (riordinare-per-sembrare-a-posto); (3) latenza prefill anche locale. **SINTESI convergente**: harness %-trigger deterministico riposiziona un set BOUNDED in coda SOLO su soglia (cache-miss raro) + modello sceglie COSA pinnare (`pin_context`, 1-3 item) + reminder = `reorganize_hint` (già shippato). Reorder TOTALE libero = **da validare A/B empirico** (layout-fisso+aim-coda vs pin-zone vs reorder-totale, eval contesto-lungo) quando avremo il modello — "siamo scienziati, lo misuriamo". → candidato concept `model-controlled-context-layout` + prereq = curva effective-context. **Angolo-TRAINING (msg 563, rafforza il lato FISSO)**: addestrare il modello sulla **struttura fissa** gli dà un **prior strutturale** (sa ~dove sono le sezioni — l'ORDINE, non l'offset) via **train-serve match** → la struttura fissa è IMPARABILE mentre il reorder-libero no (layout variabile = niente prior stabile). Distinzione: navigazione (trovare-la-sezione, la dà il training) ≠ salienza (attenzione-sul-middle, la danno i hook aim-in-coda/segnale-nascosti come **rete di sicurezza post-RL complementare**). → questo sposta la reco verso **fisso+trainato+hook** vs reorder; A/B deve includere il braccio "fisso trainato". Vedi [[model-testbook]] TB-10. Vedi [[concepts/context-limits-explained]] (position-bias) + aim-in-coda in [[concepts/focus-task-prioritization]].|
