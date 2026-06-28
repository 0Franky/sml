---
name: wiki-index
description: Catalogo di tutte le pagine della wiki. Aggiornato a ogni ingest.
type: index
last_updated: 2026-06-27
---

# Index

Catalogo content-oriented. Ogni pagina = 1 riga (link + one-line summary). Aggiornato a ogni ingest/lint.

## Overview

- [`README.md`](README.md) — entry point + synthesis del progetto
- [`open-questions.md`](open-questions.md) — decisioni aperte da chiudere con l'utente
- [`experiments-backlog.md`](experiments-backlog.md) 🆕🔬 — tracker esperimenti da eseguire (ipotesi + metrica + wave). Batch multi-expert (EXP-ME-1..8) + altri flaggati
- [`sota-techniques-catalog.md`](sota-techniques-catalog.md) 🆕⭐ — **catalogo SOTA esaustivo** delle tecniche da introdurre (9 dimensioni + 7 orizzontali): per ognuna have-already vs NUOVO + classif training-vs-harness (F-pi/F-serving/S/F+S) + fase + rischi. Base mia + **review-loop 10 agenti** (msg 210). Knowledge-transfer SOTA 2024-2026
- [`todo.md`](todo.md) 🆕📋 — **tracker vivo** del lavoro rinviato/aperto (ADR pendenti, dettagli training, rifiniture, ref-da-verificare, milestone). Regola "tracciamo sempre tutto / mai lavori a metà" (CLAUDE.md #12)
- [`log.md`](log.md) — ledger cronologico di tutte le operazioni

## Architecture

- [`architecture/three-tier-design.md`](architecture/three-tier-design.md) — idea utente: orchestrator FT + LoRA programming + LoRA verticali
- [`architecture/orchestrator-layer.md`](architecture/orchestrator-layer.md) — dettagli livello orchestratore (base full-FT)
- [`architecture/programming-generalist.md`](architecture/programming-generalist.md) — dettagli LoRA programming generalist
- [`architecture/vertical-loras.md`](architecture/vertical-loras.md) — dettagli LoRA verticali stack-specifici
- [`architecture/wrapper.md`](architecture/wrapper.md) — wrapper applicativo, **ancorato su pi (harness MIT)**: 3 layer (frontend Web/App → pi+extensions → serving vLLM). I concept wrapper = extension di pi
- [`architecture/harness-feature-catalog.md`](architecture/harness-feature-catalog.md) — **catalogo delle 6 feature-class che introduciamo su pi** (Context-Assembly · Dynamic-Context · Safety · Reasoning · Routing · Verification): contesto + funzionamento + mapping hook pi + MVP-vs-post + principio SKILL(pesi)-vs-FEATURE(wrapper). Punto di partenza per l'allineamento harness
- [`architecture/wrapper-implementation-plan.md`](architecture/wrapper-implementation-plan.md) — piano operativo fasato (Fase 0 walking-skeleton → 1 MVP → 2 abilitatori Phase-3 → 3 post-MVP) + Step 0.0 verifica API pi

## Entities (paper, modelli, framework, persone)

### Modelli base candidati
- [`entities/qwen3-coder.md`](entities/qwen3-coder.md) — Qwen3-Coder, base coding-specialized
- [`entities/qwen3-coder-next.md`](entities/qwen3-coder-next.md) — Qwen3-Coder-Next 80B-A3B MoE

### Paper rilevanti (multi-LoRA, MoE, routing)
- [`entities/hmora.md`](entities/hmora.md) — HMoRA, ICLR 2025, hierarchical mixture LoRA experts
- [`entities/x-lora.md`](entities/x-lora.md) — X-LoRA, scaling weight per layer/token
- [`entities/lorahub.md`](entities/lorahub.md) — LoraHub, composizione gradient-free di LoRA
- [`entities/mole.md`](entities/mole.md) — Mixture of LoRA Experts (MoLE)
- [`entities/ld-mole.md`](entities/ld-mole.md) — LD-MoLE, learnable dynamic routing
- [`entities/lora-mixer.md`](entities/lora-mixer.md) — LoRA-Mixer, serial attention routing
- [`entities/s-lora.md`](entities/s-lora.md) — S-LoRA, serving thousands of concurrent LoRA
- [`entities/med-moe-lora.md`](entities/med-moe-lora.md) — Med-MoE-LoRA / Specialized Generalists, decoupling cognizione generale vs dominio (match three-tier)
- [`entities/hdmole.md`](entities/hdmole.md) — HDMoLE, hierarchical routing + dynamic thresholds, mapping esplicito experts↔dominio (ASR)

### Tooling / inference engines
- (da popolare in grill-me) — Unsloth, PEFT, vLLM, TRL, Axolotl, LLaMA-Factory
- [`entities/dwarfstar4.md`](entities/dwarfstar4.md) 🆕🔬 — **DwarfStar 4 (DS4)** di antirez: inference engine locale self-contained per **DeepSeek V4 Flash** (MoE ~284B). **Quant asimmetrica 2/8-bit sui soli routed experts** (router/shared/proj full) = **esempio shipped** del per-expert MoE quant. KV-cache su disco = sessione (multi-day), coding agent in-process + server OpenAI/Anthropic. Rilevante per quant MoE + wrapper + teacher. Studiato 2026-06-26

## Concepts (tecniche, principi, trade-off)

### Training & architettura LoRA

- [`training-taxonomy/README.md`](training-taxonomy/README.md) 🆕⭐ — **tassonomia completa dei dati di training**: **16 aree** · ~77 topic · ~215 foglie, ognuna taggata Q/L + skill-target + example-space (con-hint/senza-hint/wrong-awareness/wrong-recovery/other). Backbone + schema + Benchmark Coverage Matrix + macro-curriculum 3 fasi. Copertura verificata vs benchmark pubblici. **Example-space GENERATO 2026-06-25** (16 file `area-NN-*.md`)
- [`training-taxonomy/_coverage-audit-2026-06-23.md`](training-taxonomy/_coverage-audit-2026-06-23.md) 🆕 — audit copertura: gap vs doc (subagent) + gap vs benchmark + note utente → +4 aree (13 SWE, 14 Algo/Math, 15 Instruction/Interaction, 16 Self-Critique)
- **Example-space per area** 🆕✅ (generato 2026-06-25 via 16 subagent — per ogni foglia: skill-target + 5 classi esempi + hint fade-out forte→debole + fase curriculum §4.bis + reward design Q/L + hack-check anti reward-hacking):
  - [`area-01-organization-planning`](training-taxonomy/area-01-organization-planning.md) · [`area-02-criticality-safety`](training-taxonomy/area-02-criticality-safety.md) · [`area-03-reasoning-scientific-method`](training-taxonomy/area-03-reasoning-scientific-method.md) · [`area-04-context-metacognition`](training-taxonomy/area-04-context-metacognition.md)
  - [`area-05-code-correctness`](training-taxonomy/area-05-code-correctness.md) · [`area-06-code-quality-architecture`](training-taxonomy/area-06-code-quality-architecture.md) · [`area-07-security-privacy`](training-taxonomy/area-07-security-privacy.md) · [`area-08-tool-use-agentic`](training-taxonomy/area-08-tool-use-agentic.md)
  - [`area-09-communication-deference`](training-taxonomy/area-09-communication-deference.md) · [`area-10-output-mechanics-precision`](training-taxonomy/area-10-output-mechanics-precision.md) · [`area-11-refusal-scope`](training-taxonomy/area-11-refusal-scope.md) · [`area-12-domain-knowledge-fixed`](training-taxonomy/area-12-domain-knowledge-fixed.md)
  - [`area-13-swe-repo-level`](training-taxonomy/area-13-swe-repo-level.md) · [`area-14-algorithmic-math`](training-taxonomy/area-14-algorithmic-math.md) · [`area-15-instruction-following-interaction`](training-taxonomy/area-15-instruction-following-interaction.md) · [`area-16-self-evaluation-critique`](training-taxonomy/area-16-self-evaluation-critique.md)
- [`training-taxonomy/training-curriculum-design.md`](training-taxonomy/training-curriculum-design.md) 🆕⭐ — **design del curriculum** (stadi/ordine/dati/reward) — validato vs **NVIDIA Nemotron**: SFT-teoria → RL-verificabile → preference-corto → merge; +3 correzioni +toggle. **§6 review-loop 6 agenti**: tabella pesi-per-stadio + budget onesto (full-FT Tier1=A100) + MVP-v1-subset + 5 decisioni aperte
- [`training-taxonomy/curriculum-stages-detail.md`](training-taxonomy/curriculum-stages-detail.md) 🆕 — **design DETTAGLIATO per-stadio** (5 stadi: obiettivo/dataset+volume/metodo+reward/hyperparam/rischi/eval) + **piano dataset & decontaminazione** (acquisizione HF-id + pipeline 3-stadi + license-check). Output review-loop, numeri da calibrare con ablation
- [`training-taxonomy/provenance-manifest.md`](training-taxonomy/provenance-manifest.md) 🆕🔒 — **manifest tracciabilità dataset** (legal-defense): dataset→teacher→licenza→verdetto. Shortlist approvata + caveat + avoid-list. Il rischio = il teacher-model, non il tag
- [`training-taxonomy/data-volume-estimate.md`](training-taxonomy/data-volume-estimate.md) 🆕📊 — **stima volume dati foglia-per-foglia** (16 aree, fan-out 16 subagent + **review-loop** 5 reviewer agnostici+specializzati). Framework Q~500/L~200 → **corretto**: base 2-5× troppo alte (skill già in pretrain → elicitation), dedup ~10% (non 18%), augmentation knob ×3-5. **Stima v2**: SFT authoring ~17-22K (MVP) / ~28-34K (full); collo di bottiglia = harness+authoring umano, NON soldi (MVP <$200). Query utente 2026-06-26
- [`training-taxonomy/gold-example-area02-criticality.md`](training-taxonomy/gold-example-area02-criticality.md) 🆕🥇⭐ — **esempio GOLD di training data per-foglia** (foglia criticality §3.1) = **template** per le altre. 5 classi complete (INPUT formato wrapper + OUTPUT reasoning `[V]/[A]/[?]`+tool-call scoped + LABEL verifier deterministico ancorato al *trace reale*), **sandbox-fixture** per ogni held-out (riproducibilità), anti reward-hacking a più livelli (check-fantasma isolato, coppia bilanciata untracked→HALT/tracked→procedi con penalità simmetrica anti cry-wolf, doppio ramo recovery, verifier che esegue il binding dinamico). Prodotto da **team multi-agente** (produce→giudica→verifica→sintesi→critica) + polish finale. §4 = come replicarlo. 2026-06-27
- [`concepts/lora-stacking.md`](concepts/lora-stacking.md) — caricare più LoRA insieme, interferenza, soluzioni
- [`concepts/catastrophic-forgetting.md`](concepts/catastrophic-forgetting.md) — degrado knowledge base durante FT, mitigazioni
- [`concepts/eval-modern-coding.md`](concepts/eval-modern-coding.md) — SWE-Bench Verified, LiveCodeBench, BigCodeBench, Aider polyglot
- [`concepts/slm-coding-landscape.md`](concepts/slm-coding-landscape.md) — landscape SLM coding 1B-30B 2026, Qwen3 vs Qwen3.5 architecture deep-dive, scelta base model per 2080 Ti 11GB
- [`concepts/lora-sizing-methodology.md`](concepts/lora-sizing-methodology.md) ⭐ — metodologia per dimensionare LoRA (formula rank/dataset/eval, stack PEFT DoRA+LoRA+RsLoRA, checklist verifiche 6 sezioni, esempio concreto MVP v1)
- [`concepts/lora-initialization-strategy.md`](concepts/lora-initialization-strategy.md) 🆕 — **init dei LoRA per preservare il Tier 1**: standard (B=0) parte da output=base (zero perturbazione) poi impara; il vero bivio = quali direzioni l'adapter impara → MiLoRA(preserva/anti-forgetting ⭐)/PiSSA(veloce,rischio)/LoRA-GA(convergenza). Reco: B=0 default + ablation MiLoRA. Risposta utente msg 243
- [`concepts/staged-curriculum-training.md`](concepts/staged-curriculum-training.md) ⭐ — curriculum SFT a 4 stage (reasoning → organization → criticality → coding), idea utente formalizzata, allineato scuola-philosophy
- [`concepts/adversarial-needle-haystack-training.md`](concepts/adversarial-needle-haystack-training.md) ⭐ — needle-in-haystack come TRAINING regime adversariale (non solo eval). Position random epoch-by-epoch, 4 variazioni di rumore. Idea utente — candidato paper claim #5
- [`concepts/out-of-domain-refusal-training.md`](concepts/out-of-domain-refusal-training.md) ⭐ — counter-examples nel dataset Tier 3 (10% out-of-domain con refusal + hint). Implementabile MVP v1. Idea utente
- [`concepts/multi-expert-collaboration.md`](concepts/multi-expert-collaboration.md) ⭐ — Multi-expert collaboration via LoRA hot-swap sequenziale per task multi-domain. Pianificato Wave 7-8. **+ evoluzione 2026-06-24**: reclutamento dinamico (self-limit → recruit) + completeness-gate orchestratore + granularità switch (per-request/per-stage/per-token) + caveat KV-cache. Candidato paper claim #6
- [`concepts/xlora-vs-hmora.md`](concepts/xlora-vs-hmora.md) 🆕 — confronto **X-LoRA vs HMoRA**: entrambi router-learned per-token (opzione concurrent, vs nostro hot-swap sequenziale). X-LoRA = scaling su LoRA frozen; HMoRA = gerarchia di expert co-trainati con routing per-profondità

### Reasoning structure & Wrapper (appunti utente 2026-05-21)

- [`concepts/_user-notes-index.md`](concepts/_user-notes-index.md) ⭐ — **hub di navigazione** per gli appunti wrapper/reasoning/training, organizzati in 4 categorie
- [`concepts/_user-notes-related-research.md`](concepts/_user-notes-related-research.md) ⭐ — **letteratura correlata + idee derivative + cross-concept patterns** (output ricerca)
- [`concepts/_user-notes-2026-06-23.md`](concepts/_user-notes-2026-06-23.md) 🆕⏳ — **batch 9 appunti Telegram 2026-06-23** (provisional, in attesa analisi congiunta): metacognizione/autocompact, awareness anti-pattern, lookahead ai bivi, trajectory critique, char-level, secret section, tag tipologia, steering vectors
- [`concepts/scientific-method-operating-protocol.md`](concepts/scientific-method-operating-protocol.md) 🆕⏳ — **metodo scientifico come protocollo operativo Tier 1** (system prompt + tracce) + two-phase CoT (fase 1 lungo-corretto via RL, fase 2 ottimizzato-adaptive) + codice di condotta. Idea utente 2026-06-23, draft in grill-me (D1–D5 aperte)
- [`concepts/steering-vectors.md`](concepts/steering-vectors.md) 🆕 — **activation steering / representation engineering**: cosa sono, estrazione, 8 aree di applicazione + 3 più promettenti (depth-reasoning control, anti-exfiltration, domain-modulation), tradeoff vs LoRA, possibile 4° asse di controllo ortogonale alla three-tier. Esplosione nota 1
- [`concepts/wrapper-context-assembly-example.md`](concepts/wrapper-context-assembly-example.md) 🆕 — **esempio concreto di contesto generato dinamicamente** dal wrapper (canonico co-progettato): history gerarchica blocchi+step, secrets-map dinamica, verify annidati, tool-call con scope, stream-read inline. Scenario JWT-migration
- [`concepts/secret-section-exfiltration-defense.md`](concepts/secret-section-exfiltration-defense.md) 🆕 — **difesa anti-exfiltration** dati sensibili: 3+1 livelli (training adversariale red-team, contesto a riferimenti opachi, **guardrail deterministico secrets-map dinamica**, refusal steering opzionale) + edge case. Graduazione nota 8
- [`concepts/agent-constitution.md`](concepts/agent-constitution.md) 🆕 — **constitution operativa** (codice di condotta stile Constitutional AI, no Asimov verbatim): 16 principi in 6 gruppi (sicurezza, riservatezza, trasparenza/deferenza, veridicità, coerenza/memoria, limiti). Chiude D4
- [`concepts/quality-target-tiers.md`](concepts/quality-target-tiers.md) 🆕 — **livello di qualità target del deliverable** (PoC/Prototype/MVP/Production/Hardened) + **scorecard** (dimensioni × 0-5 per tier) + override-da-dominio (max(tier, domain_floor)): il modello inferisce il tier, calibra lo sforzo, **chiede se ambiguo** mostrando le statistiche. Idea utente 2026-06-23
- [`concepts/reward-hacking-mitigation.md`](concepts/reward-hacking-mitigation.md) 🆕⚠️ — **vincolo di prima classe su tutto il reward design**: mappa dove il reward hacking avviene nella pipeline (PRM/GRPO/RLAIF/self-score/judge) + difese in profondità (ancorare al verificabile, scorer≠scored, hidden tests, monitor overoptimization). Emphasis utente 2026-06-23
- [`concepts/judge-design.md`](concepts/judge-design.md) 🆕⚖️ — **giudice del reward RL** (D5): contract strutturato + checklist pre&finali + **council OPEN** (Claude/GPT/Gemini fuori per ToS commerciali) + audit; classificato **F-harness** (infra-training) + **S-contract** (pesi); scorer≠scored ancorato all'outcome
- [`concepts/glossario.md`](concepts/glossario.md) 🆕📖 — **glossario plain-language** (GRPO-calibration · XGrammar · inoculation · mini-SWE-agent · GiGPO · OSS-Instruct/EpiCoder/LESS): versione accessibile dei termini, linkata al catalogo. Integra la Parte-1 del briefing (utente msg 243)
- [`training-taxonomy/gold-methodology.md`](training-taxonomy/gold-methodology.md) 🆕📐 — **metodologia gold-example** (guida rollout): review-loop obbligatorio · oracolo-unificato H0⊆post · predicato-vs-esecuzione · marker [UNVERIFIED] · coherence-anchoring 2-livelli per L. Estratta dal pilota 2026-06-29
- [`training-taxonomy/gold-example-decomposition.md`](training-taxonomy/gold-example-decomposition.md) 🆕🧩 — **gold-esercizi per `hierarchical-decomposition`** (idea utente msg 284): rifattorizza N handler in gerarchia; reward Q materializzato (pytest-coverage + pylint-duplicate-code + mutation-probe ∀-stmt) + anti-over-decomposition differenziale. Authored→reviewed→fixed; `[UNVERIFIED]` (oracoli da eseguire nel sandbox)
- [`concepts/multimodality-vision-audio.md`](concepts/multimodality-vision-audio.md) 🆕 — **feasibility vision+audio (comprensione)**: Gemma 4 encoder-free (verificato), Qwen3-VL/Omni, spettro 4 opzioni (wrapper-as-tool / adapter / base-swap / encoder-free) + reco (defer native, wrapper-as-tool per MVP). Impatta base-model ADR. Domanda utente 2026-06-24
- [`concepts/self-analysis-strategy-revision.md`](concepts/self-analysis-strategy-revision.md) 🆕 — **autoanalisi introspettiva**: il modello capisce *perché* fallisce, cosa crea attrito (anche lato utente) e **revisiona le proprie strategie** (oltre l'artefatto). Estende Area 16/4 al livello traiettoria+strategia. Reflexion-like ma reward **outcome-anchored** (anti-confabulazione) + friction-awareness. Candidato paper-claim #7. Idea utente 2026-06-26
- [`concepts/moe-per-expert-quantization.md`](concepts/moe-per-expert-quantization.md) 🆕🔬 — **quantizzare ogni esperto MoE in modo differente** (mixed-precision per-expert): fattibile e SOTA (MoQE/QMoE/MoPEQ/MxMoE/AlphaQ). Bit allocati per frequenza o (meglio) **sensibilità Hessian**. Caveat: kernel eterogenei, importanza data-dependent, router in alta precisione. Per noi = ottimizzazione **Wave 7-8** sul target 35B-A3B MoE. Query utente 2026-06-26 (citazioni verificate)

### Agentic skills & operating rules (2026-06-27) 🆕

- [`concepts/path-portability-awareness.md`](concepts/path-portability-awareness.md) 🆕 — path relativi vs assoluti **context-aware** + why-chain. **DEMOTED 2026-06-27** (review): micro-regola, gold-example in [`secret-section-exfiltration-defense`](concepts/secret-section-exfiltration-defense.md); enforcement = regex-linter wrapper-side
- [`concepts/harness-capabilities-as-files.md`](concepts/harness-capabilities-as-files.md) 🆕 — temp-read on-fly delle capacità harness (open→extract→note→close). **Demoted a primitiva-wrapper** (review): è context-editing già nativo; caveat costo KV-cache; la skill residua = "cosa annotare"
- [`concepts/low-confidence-gather-and-reorg.md`](concepts/low-confidence-gather-and-reorg.md) 🆕 — sotto bassa confidence: STOP → reorg contesto → bivio **have-lead→gather / no-lead→ASK** (no gather-cieco). Anti-confabulazione
- [`concepts/task-interruption-discipline.md`](concepts/task-interruption-discipline.md) 🆕 — **preemption-by-urgency**: nuova richiesta durante un task → enqueue+reference+finish di default; preempt solo se urgente/invalidante. Anti context-switch distruttivo
- [`concepts/dataset-on-the-fly-pseudorandom.md`](concepts/dataset-on-the-fly-pseudorandom.md) 🆕 — transform-layer pseudo-random sui gold template (posizione/lingua/prompt) con **label invariante** + NO success-checklist in training. Verdetto: sì come knob ×3-5, non ×N
- [`concepts/phased-reward-and-rh-detection.md`](concepts/phased-reward-and-rh-detection.md) 🆕 — reward **per-fase** + twin-pair discriminanti + final-reward pesato dall'RH rilevato (monitor LLM). Safeguard: potential-based shaping + outcome-anchor dominante. Verdetto: sì con cautele
- [`concepts/training-vs-harness-classification.md`](concepts/training-vs-harness-classification.md) 🆕⭐ — **PLAYBOOK + regola fondamentale**: classificare ogni capacità sull'asse training(pesi)-vs-harness(wrapper) → **F-pi/F-serving/S/F+S** + decision-tree + stato-senza-training (PIENA/DEGRADATA/INERTE) + reward outcome-anchored + anti-pattern. Principio cardine emerso 2026-06-27 (msg 205)
- [`concepts/dependency-aware-error-recovery.md`](concepts/dependency-aware-error-recovery.md) 🆕 — errore a T1 → root-cause (delta concettuale) + ripercorri + propaga il fix a TUTTE le decisioni dipendenti (truth-maintenance sul dep-graph). FEATURE=dep-graph esistente, SKILL=traversal. Idea utente msg 197
- [`concepts/situational-policy-table.md`](concepts/situational-policy-table.md) 🆕 — router "SE situazione X → azione Y": FEATURE lane lookup O(1) + SKILL recognition (addestra il COMPORTAMENTO non il file-path) + governance a 4 tier. Training goldmine. Idea utente msg 200-202 (pattern generico PII-free)
- [`concepts/interruption-robust-reasoning.md`](concepts/interruption-robust-reasoning.md) 🆕 — skill (pesi) di mantenere accuratezza se interrotto a fine-sezione per un update esterno (−60% senza training, 2510.11713); il meccanismo MinD multi-call dà l'aggancio, il valore è gated sul training. Decisione utente msg 193

**Categoria A — Reasoning structure** (come pensa il modello):
- [`concepts/structured-thinking.md`](concepts/structured-thinking.md) — "caveman thinking" strutturato, marker `[V]/[A]/[?]`, no discorsivo
- [`concepts/hierarchical-decomposition.md`](concepts/hierarchical-decomposition.md) 🆕🧩 — **pensare per fattorizzazione**: problema generale → invariante-core + assi-di-specializzazione → foglie (la stessa struttura del template-inheritance, promossa a SKILL del modello). Reward = coverage+non-ridondanza+invariante; ⚠️ proporzionalità anti over-decomposition. + foglia-esercizi. Idea utente msg 284
- [`concepts/post-rl-path-optimization.md`](concepts/post-rl-path-optimization.md) — impratichimento dopo RL training, token compression, distillation
- [`concepts/error-memo-system.md`](concepts/error-memo-system.md) — memo errori + lessons learned, due livelli (generico + esempi pratici)
- [`concepts/multi-token-prediction-training.md`](concepts/multi-token-prediction-training.md) — training multi-target: next, +2, +3, sketch, state heads

**Categoria B — Context engineering** (cosa vede il modello):
- [`concepts/structured-context-sections.md`](concepts/structured-context-sections.md) — formato XML con `<aim>`, `<current_state>`, `<assets>` (hard_limits), `<interconnections>`, etc.
- [`concepts/external-update-injection.md`](concepts/external-update-injection.md) — inject di update esterni durante il pensiero
- [`concepts/untrusted-content-delimiting.md`](concepts/untrusted-content-delimiting.md) — confinamento untrusted content, prompt injection mitigation
- [`concepts/task-decomposition-adhoc-context.md`](concepts/task-decomposition-adhoc-context.md) — plan-then-execute, context ad-hoc per step
- [`concepts/temporal-awareness-timestamps.md`](concepts/temporal-awareness-timestamps.md) — senso del tempo: timestamp + tool call timing, multi-day continuity

**Categoria C — Runtime safety + coherence**:
- [`concepts/contradiction-detection-layer.md`](concepts/contradiction-detection-layer.md) — detector contraddizioni nel context, attention event
- [`concepts/pre-flight-safety-checks.md`](concepts/pre-flight-safety-checks.md) — verifiche pre-azione (git, backup, hard limits)

**Categoria D — Wrapper runtime architecture**:
- [`concepts/agent-wrapper-vars-queue.md`](concepts/agent-wrapper-vars-queue.md) — datastore interno wrapper: 4 lane (TASKS/VERIFICATIONS/RULES/VARS) + CURR pointer, map O(1)
- [`concepts/sliding-window-variable-tool.md`](concepts/sliding-window-variable-tool.md) — tool char-range read/replace + preview, risparmio token
- [`concepts/explicit-attention-layer.md`](concepts/explicit-attention-layer.md) — attention forzata su current_aim/prev_step/global/rules

**Categoria E — Training philosophy & data regime** (appunti utente 2026-05-21 post grill-me):
- [`concepts/scuola-learning-philosophy.md`](concepts/scuola-learning-philosophy.md) — filosofia "come la scuola": copiare → capire → allenarsi → migliorare. Analogia bambini per design pipeline
- [`concepts/runtime-symbol-randomization-training.md`](concepts/runtime-symbol-randomization-training.md) — two-regime: fisso (memorizzato) vs variabile (skill di citare via simboli random runtime). Include hash-based + codebase-grounded renaming
- [`concepts/dynamic-context-training-regime.md`](concepts/dynamic-context-training-regime.md) — contesto dinamico durante training: 5+ dimensioni variabili per sezione, combinazioni grandezze, distribuzioni realistiche
- [`concepts/pipeline-architecture-data-generation.md`](concepts/pipeline-architecture-data-generation.md) — pipeline async producer/consumer, ibrido programmatico+teacher model, cache buffer
- [`concepts/curiosity-driven-exploration-training.md`](concepts/curiosity-driven-exploration-training.md) ⚠ exploratory — surprise-maximization come obiettivo (Titans Google, Pathak ICM). Include sezione "Le 4 teorie della surprise" (Titans, Schmidhuber, Friston, Pathak). Da rivalutare in Wave 6+
- [`concepts/pretrained-name-bias-mitigation.md`](concepts/pretrained-name-bias-mitigation.md) ⭐ — come gestire name bias del pretraining (Qwen ha visto miliardi di nomi naturali) senza buttare via tutto. 4 tecniche stacked. Risponde a preoccupazione utente su "training from scratch"
- [`concepts/_paper-verification-2026-05-21.md`](concepts/_paper-verification-2026-05-21.md) ⭐ — verifica esistenza 39 paper citati. **0 allucinazioni**. 4 metadata corrections applicate (SelfCheckGPT ID, LoraHub author, MoLE authors, ADaPT first author)

**Paper deep-dives** (entities):

*Memoria + reasoning + intrinsic motivation*:
- [`entities/voyager-paper.md`](entities/voyager-paper.md) ⭐ — Voyager (Wang 2023) ~2700 parole
- [`entities/titans-paper.md`](entities/titans-paper.md) ⭐ — Titans (Behrouz 2025, Google) memoria test-time via surprise
- [`entities/schmidhuber-creativity-paper.md`](entities/schmidhuber-creativity-paper.md) ⭐ — Schmidhuber formal theory creativity (IEEE TAMD 2010)
- [`entities/friston-free-energy-paper.md`](entities/friston-free-energy-paper.md) ⭐ — Friston free energy principle (Nature Rev Neurosci 2010)
- [`entities/pathak-icm-paper.md`](entities/pathak-icm-paper.md) ⭐ — Pathak ICM (ICML 2017) curiosity-driven exploration in RL
- [`entities/em-llm-paper.md`](entities/em-llm-paper.md) ⭐ — EM-LLM episodic memory (esplorativo)

*Wave 2 SOTA — Training stack + reasoning*:
- [`entities/dora-paper.md`](entities/dora-paper.md) ⭐ — DoRA (Liu 2024) drop-in upgrade LoRA
- [`entities/lora-plus-paper.md`](entities/lora-plus-paper.md) ⭐ — LoRA+ (Hayou 2024) 2× speedup learning rate ratio
- [`entities/rslora-paper.md`](entities/rslora-paper.md) ⭐ — RsLoRA scaling 1/√r per rank alto
- [`entities/rstar-math-paper.md`](entities/rstar-math-paper.md) ⭐ — rStar-Math (Microsoft 2025) SLM 7B con MCTS+PRM batte o1
- [`entities/prm-paper.md`](entities/prm-paper.md) ⭐ — Process Reward Models (Lightman/OpenAI 2023) reward su step intermedi

*Hub navigazionale findings*:
- [`concepts/_wave-2-research-findings.md`](concepts/_wave-2-research-findings.md) ⭐ — sintesi Wave 2 SOTA: top paper + 5 idee derivative + 3 cross-paper patterns + 2 nuovi gap letteratura
- [`entities/schmidhuber-creativity-paper.md`](entities/schmidhuber-creativity-paper.md) ⭐ — Schmidhuber Formal Theory of Creativity (IEEE TAMD 2010) — curiosity via compression progress. In corso (agent dedicato)
- [`entities/friston-free-energy-paper.md`](entities/friston-free-energy-paper.md) ⭐ — Friston Free Energy Principle (Nature Reviews Neuroscience 2010) — predictive coding nel cervello. In corso (agent dedicato)
- [`entities/pathak-icm-paper.md`](entities/pathak-icm-paper.md) ⭐ — Pathak ICM (ICML 2017) — curiosity-driven exploration in RL. In corso (agent dedicato)

## Decisions (ADR datati)

- [`decisions/2026-05-21-project-bootstrap.md`](decisions/2026-05-21-project-bootstrap.md) — bootstrap progetto, scelte iniziali, alternative considerate
- [`decisions/2026-05-21-base-model-pipeline.md`](decisions/2026-05-21-base-model-pipeline.md) — pipeline base model: Qwen3-4B locale → Qwen3-8B cloud → Qwen3.6-35B-A3B target SOTA
- [`decisions/2026-05-21-vision-clarification.md`](decisions/2026-05-21-vision-clarification.md) — organization-first, coding via LoRA. Corregge precedenti ADR
- [`decisions/2026-05-21-training-philosophy-roadmap.md`](decisions/2026-05-21-training-philosophy-roadmap.md) — roadmap 10 wave + filosofia scuola + two-regime dataset
- [`decisions/2026-05-21-training-from-scratch-clarification.md`](decisions/2026-05-21-training-from-scratch-clarification.md) — chiarimento "training da zero": 5 opzioni (pre-training scratch / continual pretrain / full FT / LoRA), costi reali, awaiting user clarification
- [`decisions/2026-06-23-pi-harness-base.md`](decisions/2026-06-23-pi-harness-base.md) 🆕 — **harness base = pi** (earendil-works/pi, MIT). I concept wrapper diventano extension di pi. Separazione: pi = harness, ricerca = modello+training. Mappatura concept→meccanismo pi + to-verify impl
- [`decisions/2026-06-28-open-decisions-briefing.md`](decisions/2026-06-28-open-decisions-briefing.md) 🆕⭐ — **briefing decisioni aperte** (per utente non-tecnico): glossario (GRPO-calibrazione/XGrammar/inoculation/mini-SWE-agent/GiGPO/OSS-Instruct) + 6 decisioni con contesto+come-funziona+reco + **ricerca dataset & licensing**
- [`decisions/2026-06-28-decisions-d1-d5.md`](decisions/2026-06-28-decisions-d1-d5.md) 🆕✅ — **ADR: decisioni D1-D6 CONFERMATE** (msg 245): LoRA-init(B=0+MiLoRA) · tokenizer+XGrammar · 2080Ti-fp16 · marker-espliciti(+Coconut-ibrido futuro) · judge DSv4-su-DS4 structured-contract · data-licensing commercial-clean
- [`decisions/2026-06-28-compute-access.md`](decisions/2026-06-28-compute-access.md) 🆕💻 — **accesso compute per full-FT/RL Tier1**: NVIDIA no-free-self-serve; via pratica = A100-80GB spot (~$10-55/run); Inception worth-apply (~$10-25K partner-credits); QLoRA≠full-FT (msg 266)

## Da popolare (placeholder)

Aree note ma non ancora documentate. Ordina per priorità in `open-questions.md`.

- Pipeline training dettagliata (curriculum, fasi, recipe)
- Dataset strategy (sources, sintesi, filtering, decontamination)
- Hardware/cost scenarios concreti
- Roadmap MVP con milestone
- Risk register completo
- Wrapper functional spec
- Routing strategy concreta
- Inference serving stack (vLLM + multi-LoRA hot-swap)
