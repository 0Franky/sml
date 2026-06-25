---
name: wave-2-research-findings
description: Sintesi Wave 2 SOTA research — top paper, idee derivative, cross-paper patterns, gap aperti.
type: meta
tags: [meta, wave-2, sota-research, paper-findings, derivative-ideas, patterns]
sources: [wiki/entities/dora-paper.md, wiki/entities/lora-plus-paper.md, wiki/entities/rslora-paper.md, wiki/entities/rstar-math-paper.md, wiki/entities/prm-paper.md, wiki/entities/em-llm-paper.md]
last_updated: 2026-05-21
---

# Wave 2 — Research Findings Synthesis

Output del Wave 2 (deep dive 6 paper + esplorazione mirata). Hub navigazionale per le evoluzioni.

## Top paper esaminati (6 deep dive in entities/)

| Paper | Wave | Cosa ci dà |
|---|---|---|
| [[dora-paper]] | W5 | Drop-in upgrade LoRA. Decomposizione magnitude+direction. ~4% improvement vs LoRA standard |
| [[lora-plus-paper]] | W5 | 2× speedup training via learning rate ratio λ (LR matrice B = λ × LR matrice A, λ ≫ 1) |
| [[rslora-paper]] | W5-W6 | Scaling 1/√r vs 1/r. Permette rank alto (>32) senza gradient collapse |
| [[rstar-math-paper]] | W7-W8 | SLM 7B con MCTS + PRM batte o1 su MATH. Pattern operativo search-augmented reasoning |
| [[prm-paper]] | W6 | Process Reward Models. Reward su step intermedi (vs ORM su outcome finale). Dataset PRM800K |
| [[em-llm-paper]] | W7-W10 (wrapper) | Episodic memory per LLM. Esplorativo. Connessione naturale con `error-memo-system` runtime |

## 5 idee derivative emergenti

### Idea 1 — **PEFT Stack Triplo** (DoRA + LoRA+ + RsLoRA)

Combinazione drop-in: DoRA (better convergence) + LoRA+ (2× speedup) + RsLoRA (stable high-rank). Applicabile in Wave 5 senza rischio architetturale. Tre tweak indipendenti, stack additivo, code change <50 righe.

**Quando**: Wave 5 (Step 1 locale Qwen3-4B). Validate stack vs LoRA vanilla in baseline eval.

### Idea 2 — **Search-Augmented Reasoning** (rStar-Math MCTS + Titans surprise memory)

rStar-Math usa MCTS per esplorare reasoning tree + PRM per scorerare step. Aggiungere Titans-style memory che ricorda branch promettenti tra sessioni → agent organization-first con "intuizione" su quali path sono pagati storicamente.

**Quando**: Wave 7-8 (target finale Qwen3.6-35B-A3B). Bridge con `curiosity-driven-exploration-training.md` e `titans-paper.md`.

### Idea 3 — **Safety Reasoning Reward Stack** (PRM + Constitutional AI + criticality)

PRM su step intermedi + Constitutional AI per principi safety + criticality awareness eval custom. Reward composito che premia "ho riconosciuto criticità implicita prima di agire" (esempio cancellazione file).

**Quando**: Wave 6 (RL post-training Qwen3-8B). Bridge naturale con `pre-flight-safety-checks.md` e vision organization-first.

### Idea 4 — **Episodic Skill Library** (EM-LLM + Voyager pattern)

Voyager salva codice eseguibile (skill library). EM-LLM aggiunge episodic memory (cosa succedeva quando ho usato quella skill). Combinati: skill library evoluta con context di successo/fallimento + recovery di skill via similarity search semantica del contesto, non solo nome.

**Quando**: Wave 7-10 (wrapper runtime). Sostituisce/evolve `error-memo-system.md` con backend più sofisticato.

### Idea 5 — **Structured Thinking + MCTS Pruning** (caveman thinking + rStar-Math)

Il thinking strutturato genera scheda contesto con marker `[V]/[A]/[?]`. MCTS può esplorare branch alternativi dato lo stato corrente. Pruning aggressivo via process reward → tree narrow ma profondo, low-token thinking.

**Quando**: Wave 6+ Tier 1 organization. Bridge con `structured-thinking.md` e `post-rl-path-optimization.md`.

## 3 Cross-paper patterns notevoli

### Pattern α — Search + Reward + Memory (triade reasoning agentico)

rStar-Math (MCTS search) + PRM (step reward) + Titans (memory) = **reasoning agent maturo**. Tre componenti compongono uno stack di reasoning superiore al CoT puro:

- Search: esplora reasoning tree invece di scegliere greedily
- Reward: valuta ciascun step intermedio
- Memory: ricorda pattern di successo cross-session

Connessione: tutti e tre i paper esistono in entities/. Cross-pattern già esplicito.

### Pattern β — Composizione LoRA modulare (DoRA + RsLoRA + LoRA+ + composition-aware)

I tre paper LoRA aggiungono ortogonali assi di miglioramento:

- DoRA: representational power
- LoRA+: training speed
- RsLoRA: stability at high rank

Plus composition-aware training (concept esistente in `lora-stacking.md`). Stack 4-fold per Wave 5-7 Tier 2-3.

### Pattern γ — Skill Lifecycle Management (Voyager + EM-LLM + error-memo)

Voyager: skill library accumula skill nuove
EM-LLM: episodic memory di quando una skill è stata usata
error-memo (nostro concept): memo errori e lessons learned

Triade per **gestione life-cycle skill** nel wrapper: skill creata → usata + osservata → memo aggiornato → skill rifined o deprecata.

## Gap di letteratura ancora aperti

Oltre ai 2 gap già noti (structured update injection + contradiction detection layer runtime), Wave 2 ne aggiunge altri 2:

3. **Organization-first SFT (NON coding)** come paradigma esplicito: paper SFT focus su coding/math/instruction-following. Manca "agent organization specialist" come obiettivo di training standalone.
4. **Criticality awareness training**: nessun paper trovato che addestra esplicitamente il modello a "riconoscere quando un'azione è destructiva e chiedere conferma prima di eseguirla". I lavori su safety si concentrano su content harm, non su action reversibility.

Entrambi candidati come **paper-contribution originali** del progetto, oltre ai 2 già identificati.

## Mapping completo a Wave

| Wave | Paper rilevanti | Concept correlati |
|---|---|---|
| W3 Generator design | OSS-Instruct, OctoPack (cit. landscape) | `runtime-symbol-randomization-training`, `pipeline-architecture-data-generation` |
| W4 Baseline eval | Tutti (definizione metric) | `eval-modern-coding` |
| W5 Step 1 LoRA | **DoRA + LoRA+ + RsLoRA** | `lora-stacking`, `pretrained-name-bias-mitigation` |
| W6 Step 2 Full FT + RL | **PRM** + Constitutional AI + ORPO | `error-memo-system`, `pre-flight-safety-checks`, `post-rl-path-optimization` |
| W7-W8 Tier 2-3 + Step 3 | **rStar-Math** + Voyager + Titans | `task-decomposition-adhoc-context`, `multi-token-prediction-training`, `curiosity-driven-exploration-training` |
| W9-W10 Wrapper + self-supervision | **EM-LLM** + Voyager + Titans + Reflexion | `agent-wrapper-vars-queue`, `error-memo-system`, `temporal-awareness-timestamps`, `contradiction-detection-layer` |

## Limiti del Wave 2 research

- Solo 6 deep dive (target era 5 obbligatori + fino a 5 esplorativi). Solo EM-LLM come esplorativo.
- Aree non coperte: Kimi K1.5 reasoning, Tülu 3 post-training, s1 simple test-time scaling, LIMO efficient reasoning data. Da considerare per Wave 2.5 se serve.

## Linked

- Wave 2 paper entities: vedi `entities/` per tutti i 6 file
- Pattern α implementazione: Wave 7-8 ADR (da scrivere)
- Pattern β implementazione: Wave 5 ADR (da scrivere)
- Pattern γ implementazione: Wave 10 ADR (da scrivere)

## Status

`wave-2-completed` — Wave 2 SOTA research conclusa. Findings integrati nel knowledge graph (graphify-out, ri-aggiornato 2026-05-21 dopo Wave 2).
