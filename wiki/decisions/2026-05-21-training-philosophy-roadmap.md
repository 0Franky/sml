---
name: 2026-05-21-training-philosophy-roadmap
description: Roadmap concreta per training pipeline basata su filosofia "come la scuola" + runtime symbol/context randomization.
type: decision
status: provisional
date: 2026-05-21
last_updated: 2026-05-21
---

# ADR 2026-05-21 (c) — Training Philosophy + Roadmap

## Context

L'utente ha proposto un design di training pipeline radicalmente più sofisticato dei pattern standard SFT + RL. Tre principi guida emersi durante grill-me #1:

1. **Filosofia "come la scuola"**: pre-training → SFT (basi) → RL (allenarsi) → post-training optimization (migliorare). Analogia esplicita con sviluppo cognitivo dei bambini.
2. **Runtime symbol randomization**: separazione esplicita fra knowledge immutabile (memorizzato) vs variabile (skill di citare dal contesto), generato runtime con nomi random.
3. **Dynamic context regime**: anche il contesto è dinamico durante training — sezioni di dimensioni e combinazioni variabili per allenare attention long-context retrieval.

## Decisioni

### 1. Adotta filosofia "come la scuola" come frame guida

Riferimento principale: [[../concepts/scuola-learning-philosophy]]. Citazione utente protetta:

> "Come la scuola, inizi a copiare, poi a capire le basi, poi ti alleni e migliori."

Si applica a tutta la sequenza di training: pre-training (copiare) → SFT (capire) → RL (allenarsi) → runtime self-supervision loop (migliorare).

### 2. Adotta two-regime dataset design

Riferimento: [[../concepts/runtime-symbol-randomization-training]].

| Regime | Tipo dato | Strategia | Effetto |
|---|---|---|---|
| **Fisso** | Formule, fisica, fatti, vocabolario marker, pattern canonical reasoning | CE loss, ripetizione N volte | Memorizzazione in-weight |
| **Variabile** | Codice, nomi simboli, contenuti asset, paths, task names | Generated runtime, mai due volte uguale | Skill di citare dal contesto |

Per Tier 1 (Organization): fissi sono tag strutturali, variabili sono nomi task/asset/nodi.
Per Tier 2-3 (Coding): fissi sono keyword linguaggio, variabili sono identifier user-defined.

### 3. Adotta dynamic context training regime

Riferimento: [[../concepts/dynamic-context-training-regime]]. Almeno **5 dimensioni variabili per sezione + combinazioni cross-sezione**. Allinea training format con runtime format → no domain shift.

### 4. Adotta pipeline async producer/consumer

Riferimento: [[../concepts/pipeline-architecture-data-generation]]. Generator B (dynamic) produce in continuo, training consuma dal buffer. Generator A (fixed) curato una tantum.

### 5. Untrusted come SINGOLO tag aggregato

Chiarimento utente: `<untrusted_zone>` è un tag che contiene TUTTE le sezioni untrusted, non sezioni multiple sparse. Aggiornato in [[../concepts/untrusted-content-delimiting]].

## Roadmap operativa

Sequenza di esecuzione del progetto, suddivisa in **wave** per non disperdere energie. Ogni wave è gestita con focus, completata, validata prima di passare alla successiva. Ogni wave produce ADR di chiusura con risultati.

### Wave 0 — Foundation (FATTO 2026-05-21)

- [x] Bootstrap repo + wiki + graph + memory
- [x] Vision allineata (organization-first, coding via LoRA)
- [x] Pipeline base model decisa (Qwen3-4B → 8B → 3.6-35B-A3B)
- [x] Wrapper form decisa (Web UI o App)
- [x] 18 concept file formalizzati
- [x] Filosofia training "come la scuola" definita

### Wave 1 — Open Questions Closure + Wrapper Spec (PROSSIMO)

**Obiettivo**: chiudere tutte le decisioni architetturali e di processo prima di toccare codice.

Step:
1. **Smarcare 14 open questions precompilate** (utente review delle raccomandazioni)
2. **Grill-me #2 wrapper-specific** (Web vs App, context org, memory, tool calling, session lifecycle, streaming)
3. **Sprint idee** sui 5+3 pattern emersi dalla ricerca + nuovi pattern dal grafo
4. **Wave 1 closure ADR**: riassunto decisioni chiuse, design completato

**Output**: spec architettura completa, niente più "open questions" maggiori.

**Stimato**: 1-3 sessioni di lavoro.

### Wave 2 — SOTA Research Deep Dive

**Obiettivo**: capire cosa è stato fatto recentemente che possiamo riusare o di cui dobbiamo essere consapevoli.

Ricerche da fare:

| Area | Cosa cercare | Skills consigliate |
|---|---|---|
| **Training agent organization (non coding)** | AgentBench, τ-Bench, LIBERO, BigToM, OpenAgent — paper 2024-2026 | `aris-research-lit`, `aris-arxiv`, `paper-search` |
| **Long-context training datasets** | LongBench, RULER, BABILong + how they're constructed | `aris-research-lit`, `aris-deepxiv` |
| **Symbol grounding / variable name robustness** | CodeBERT/GraphCodeBERT renaming studies, AlphaGeometry synthetic data | `paper-search`, `aris-novelty-check` |
| **Dataset generation pipelines** | OSS-Instruct, Magicoder, OpenCoder pipeline, Cosmopedia, Phi-3 data prep | `aris-research-lit`, `ml-ml-paper-writing` |
| **Curriculum learning in LLM** | Recent papers 2024-2026 (Self-Curriculum, CurriculumBench) | `aris-research-lit` |
| **Constitutional AI + safety reasoning data** | Anthropic Constitutional AI, RLHF pipelines, safety datasets | `paper-search` |
| **Multi-day agent persistence** | MemGPT, Letta, Mem0, Cognitive Architectures for Agents | Cited in `_user-notes-related-research.md` |
| **MoE training (per Step 3 Qwen3.6)** | MegaBlocks, Switch Transformer training, OpenRLHF MoE | `ml-megatron-core`, `ml-openrlhf` |
| **GRPO / ORPO post-training** | TRL implementations, recent papers | `ml-grpo-rl-training`, `ml-trl-fine-tuning` |
| **Self-supervision loops** | Voyager, Reflexion, Generative Agents | Cited in `_user-notes-related-research.md` |

**Output**: paper digest file in `wiki/concepts/`, lista tecniche/repo da considerare per ogni step.

**Stimato**: 2-4 sessioni di ricerca (sub-agent paralleli).

### Wave 3 — Generator Design & Implementation

**Obiettivo**: costruire il generator B1 programmatic + integrazione teacher B2 + cache infrastructure.

Step:
1. Definire **schema** dei sample (Pydantic + JSON Schema)
2. Implementare **Generator B1**:
   - Templates per task type (switch, refactor, complete, organize, plan, ecc.)
   - Random name generator (language-aware, blacklist keywords)
   - Random context structure generator (5 dimensioni × N sezioni)
   - Output validation (sintassi, schema)
3. Integrare **Generator B2** (teacher model wrapper):
   - Inizialmente API esterna (Claude/GPT) per qualità
   - Fallback self-hosted (Qwen3-Max) per budget
4. **Cache layer**:
   - Fixed dataset curato (5K sample math/physics/facts iniziali)
   - Dynamic buffer (JSONL su disk, monitor size)
5. **Generator loop**:
   - Producer B1 + B2 in subprocess separato
   - Backpressure se buffer > soglia
6. Test: generare 10K sample, verifica qualità + distribuzione

**Output**: code in `src/data/generators/`, dataset sample piloti, validation report.

**Stimato**: 1-2 settimane full-time, ma 2-4 settimane se part-time + ricerca durante.

### Wave 4 — Phase 0 Baseline Eval

**Obiettivo**: misurare capability di Qwen3-4B-Instruct-2507 SENZA training nostro, su:
- AgentBench (organization-relevant subset)
- τ-Bench (tool use multi-turn)
- LiveCodeBench v6 (coding baseline)
- SWE-Bench Verified Lite (sotto baseline tipico ma da quantificare)
- Custom criticality awareness eval (200 task con criticità implicite)
- Custom needle-in-haystack su context dinamico (validare baseline retrieval)

Step:
1. Setup environment locale (Unsloth + Transformers + PEFT + bitsandbytes su 2080 Ti)
2. Run eval suite
3. Salva numeri come **baseline da battere**

**Output**: `wiki/concepts/baseline-eval-2026-XX-XX.md` con numeri.

**Stimato**: 1 settimana setup + run.

### Wave 5 — Step 1 Workflow Consolidation Training (Qwen3-4B locale)

**Obiettivo**: validare pipeline end-to-end con un mini-training su Qwen3-4B QLoRA.

Step:
1. Genera 30K-50K sample (mix fixed/dynamic) — task organization basic + criticality awareness
2. Train Qwen3-4B QLoRA r=64 su 2080 Ti
3. Eval su baseline suite
4. Validare improvement vs baseline (target: +X% su criticality awareness eval)
5. **Decisione**: workflow funziona? Si scala a Wave 6 cloud. No? Ripensa architettura.

**Output**: primo modello FT funzionante locale + eval comparativo.

**Stimato**: 1-2 settimane.

### Wave 6 — Step 2 Organization Full FT (Qwen3-8B cloud A100)

**Obiettivo**: organization specialist serio. Tier 1 FT con dataset ampio (200K-500K).

Step:
1. Scale generator a 200K-500K sample
2. Setup cloud (vast.ai o Modal su A100 40GB, budget stimato $50-200)
3. Train Qwen3-8B LoRA bf16 (oppure full FT con DeepSpeed se budget permette)
4. Eval comparativo Step 2 vs Step 1
5. **Post-training RL** (ORPO): preference su buon naming, decomposizione, criticality

**Output**: Tier 1 organization specialist su Qwen3-8B + ADR Wave 6.

**Stimato**: 2-3 settimane wall-clock.

### Wave 7 — Tier 2-3 LoRA Coding (sopra Step 2)

**Obiettivo**: aggiungi capability coding via LoRA stackati.

Step:
1. Genera dataset coding (random symbol regime + natural mix)
2. Train Tier 2 programming generalist LoRA sopra Step 2 base
3. Train Tier 3 verticali (frontend, backend-py, backend-ts) separati
4. Composition-aware training (vedi [[../concepts/lora-stacking]])
5. Eval composite (Tier 1 + 2 + 3) su SWE-Bench Verified + LiveCodeBench

**Output**: prima versione end-to-end del modello three-tier funzionante.

**Stimato**: 3-6 settimane (multi LoRA training).

### Wave 8 — Step 3 Target Finale (Qwen3.6-35B-A3B cloud H100)

**Obiettivo**: target SOTA su modello grande, ripeti pipeline su MoE.

Step:
1. Adattamento generator a Qwen3.6 (tokenizer diverso, MoE)
2. Train su H100/B200 (budget significativo, $500-2000)
3. Eval full suite
4. Decisione paper / open weight release

**Output**: modello finale + claim paper se numeri lo supportano.

**Stimato**: 1-2 mesi.

### Wave 9 — Wrapper MVP

**Obiettivo**: backend FastAPI + frontend Web/Tauri integrato col modello.

Step:
1. Backend FastAPI con tool calling, sandbox Docker, memory SQLite
2. Frontend Web o App
3. Integrazione vLLM `--enable-lora` per hot-swap
4. Testing end-to-end con multi-day session

**Output**: prodotto usabile per real-world test.

**Stimato**: 2-3 mesi (in parallelo con Wave 7-8).

### Wave 10 — Self-Supervision Loop in Produzione

**Obiettivo**: implementare il loop di apprendimento continuo runtime (Pattern β della ricerca).

Step:
1. Implementare error-memo system runtime
2. Implementare contradiction-detection-layer runtime
3. Implementare LoRA swap incrementale (training LoRA su lesson learned durante produzione)
4. Telemetria, dashboard

**Output**: agent che migliora con uso reale.

**Stimato**: 2-4 mesi.

## Sequenza wave (vista compatta)

```
W0 Foundation       ━━━━━ done 2026-05-21
W1 Closure ADR      ░░░░░ next
W2 SOTA research    ░░░░░ parallel to W1
W3 Generator        ░░░░░ after W1
W4 Baseline eval    ░░░░░ parallel to W3
W5 Step 1 training  ░░░░░ after W3+W4
W6 Step 2 cloud     ░░░░░ after W5 validates
W7 Tier 2-3 LoRA    ░░░░░ after W6
W8 Step 3 final     ░░░░░ after W7
W9 Wrapper MVP      ░░░░░ parallel W7-W8
W10 Self-supervision░░░░░ after W8+W9
```

**Filosofia ordine** (chiarimento utente):

> "Quando ci metteremo a curare il dataset ci penseremo, procediamo per wave così non ci disconcentriamo e andiamo ordinati e organizzati."

→ Wave one-at-a-time, non parallelizzare se non strettamente indipendenti (W2-W4-W9 sì, altre no).

## Trade-off ammessi

Approccio scientifico (vedi [[../../memory/feedback_scientific_evolution]]):
- Ogni Wave produce un **ADR di chiusura** con risultati e decisioni revisited
- Se Wave X invalida un'assunzione di Wave precedente, **scriviamo correzione**, non nascondiamo
- Ridimensionare ambizione tra wave è ok se basato su evidenze numeriche
- Validazione cross-modello/architettura/grandezza in W5-W7 (testare regime su Qwen3-4B + Qwen3-8B + altre famiglie se possibile)

## Open questions per ciascuna wave

Documentate in `wiki/open-questions.md` o in nuovi file `wave-N-questions.md` quando appropriato.

## Linked

- [[../concepts/scuola-learning-philosophy]] — filosofia base
- [[../concepts/runtime-symbol-randomization-training]] — regime fisso/variabile
- [[../concepts/dynamic-context-training-regime]] — context dinamico
- [[../concepts/pipeline-architecture-data-generation]] — infrastructure
- [[2026-05-21-vision-clarification]] — vision organization-first
- [[2026-05-21-base-model-pipeline]] — pipeline modello base
- [[2026-05-21-project-bootstrap]] — bootstrap

## Stato

`provisional` — roadmap iniziale. Ogni Wave aggiorna la road con learning empirici. Filosofia scientifica.
