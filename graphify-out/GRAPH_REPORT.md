# Graph Report - .  (2026-06-29)

## Corpus Check
- 48 files · ~170,596 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 646 nodes · 1144 edges · 36 communities (23 shown, 13 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 65 edges (avg confidence: 0.79)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Criticality & Decision-Policy (Area-02)|Criticality & Decision-Policy (Area-02)]]
- [[_COMMUNITY_Training Stack, Base Models & Teachers|Training Stack, Base Models & Teachers]]
- [[_COMMUNITY_Base-Model & Coding-Eval Landscape|Base-Model & Coding-Eval Landscape]]
- [[_COMMUNITY_Training Taxonomy — Skill Areas & Reward Defenses|Training Taxonomy — Skill Areas & Reward Defenses]]
- [[_COMMUNITY_Curriculum Decisions & Compute (D1-D6)|Curriculum Decisions & Compute (D1-D6)]]
- [[_COMMUNITY_Harness (pi) & Multi-LoRA Research|Harness (pi) & Multi-LoRA Research]]
- [[_COMMUNITY_Wrapper Runtime & Reasoning Techniques|Wrapper Runtime & Reasoning Techniques]]
- [[_COMMUNITY_Gold Template-Inheritance (Area-02 1.x)|Gold Template-Inheritance (Area-02 1.x)]]
- [[_COMMUNITY_Training Infra & Coding Benchmarks|Training Infra & Coding Benchmarks]]
- [[_COMMUNITY_Architecture Concepts & MoE Quant|Architecture Concepts & MoE Quant]]
- [[_COMMUNITY_Context Management & Metacognition (Area-04)|Context Management & Metacognition (Area-04)]]
- [[_COMMUNITY_Reasoning & Data-Gen Concepts|Reasoning & Data-Gen Concepts]]
- [[_COMMUNITY_Project Genesis & Wiki Method|Project Genesis & Wiki Method]]
- [[_COMMUNITY_Curiosity & Intrinsic-Motivation Research|Curiosity & Intrinsic-Motivation Research]]
- [[_COMMUNITY_Dynamic-Context & Data Augmentation|Dynamic-Context & Data Augmentation]]
- [[_COMMUNITY_Template Build Scripts (AST)|Template Build Scripts (AST)]]
- [[_COMMUNITY_Thinking-Style Prompts|Thinking-Style Prompts]]
- [[_COMMUNITY_User-Notes Sketches|User-Notes Sketches]]
- [[_COMMUNITY_Tier-2 Programming LoRA|Tier-2 Programming LoRA]]
- [[_COMMUNITY_ADR Bootstrap (orphan dup)|ADR Bootstrap (orphan dup)]]
- [[_COMMUNITY_Chain-of-Thought (Wei)|Chain-of-Thought (Wei)]]
- [[_COMMUNITY_Thinking-Style File|Thinking-Style File]]
- [[_COMMUNITY_Pre-Flight Safety (orphan)|Pre-Flight Safety (orphan)]]
- [[_COMMUNITY_Adversarial Needle (orphan)|Adversarial Needle (orphan)]]
- [[_COMMUNITY_Temporal Awareness (orphan)|Temporal Awareness (orphan)]]
- [[_COMMUNITY_Adversarial Needle (orphan dup)|Adversarial Needle (orphan dup)]]
- [[_COMMUNITY_Explicit Attention (orphan)|Explicit Attention (orphan)]]
- [[_COMMUNITY_Untrusted-Content (orphan)|Untrusted-Content (orphan)]]
- [[_COMMUNITY_Phased Reward (orphan)|Phased Reward (orphan)]]
- [[_COMMUNITY_User Notes 06-23 (orphan)|User Notes 06-23 (orphan)]]
- [[_COMMUNITY_Agent-Constitution (orphan)|Agent-Constitution (orphan)]]

## God Nodes (most connected - your core abstractions)
1. `Harness Feature Catalog (6 feature-class su pi)` - 34 edges
2. `Reward-Hacking Mitigation` - 29 edges
3. `User Notes — Related Research & Derivative Ideas` - 27 edges
4. `Agent Constitution` - 26 edges
5. `Scientific-Method Operating Protocol` - 25 edges
6. `Training-vs-Harness Classification (playbook)` - 23 edges
7. `User Notes 2026-06-23 (Telegram batch)` - 22 edges
8. `Training Taxonomy backbone master (16 areas)` - 21 edges
9. `Area 02 — Criticality/Safety (training-taxonomy)` - 21 edges
10. `Multi-Expert Collaboration (LoRA hot-swap sequential, paper-claim #6)` - 20 edges

## Surprising Connections (you probably didn't know these)
- `Regola #10 catene di pensiero = priorità` --rationale_for--> `Reward-Hacking Mitigation`  [INFERRED]
  CLAUDE.md → wiki/concepts/reward-hacking-mitigation.md
- `Idea three-tier protetta (regola permanente #1)` --references--> `Three-Tier Design (architettura)`  [INFERRED]
  CLAUDE.md → wiki/architecture/three-tier-design.md
- `Staged Curriculum Training` --semantically_similar_to--> `Post-RL Path Optimization (impratichimento, token compression)`  [INFERRED] [semantically similar]
  wiki/concepts/staged-curriculum-training.md → wiki/concepts/post-rl-path-optimization.md
- `Pre-Flight Safety Checks` --semantically_similar_to--> `Decision-Point Lookahead (candidate)`  [INFERRED] [semantically similar]
  wiki/concepts/agent-constitution.md → wiki/concepts/_user-notes-2026-06-23.md
- `Char-Level Precision Training (token=char 1:1 exercises)` --semantically_similar_to--> `Runtime Symbol Randomization Training (surgical copy skill)`  [INFERRED] [semantically similar]
  wiki/concepts/_user-notes-2026-06-23.md → wiki/concepts/runtime-symbol-randomization-training.md

## Hyperedges (group relationships)
- **Capability F+S classificate col playbook training-vs-harness** — training_vs_harness_classification, dependency_aware_error_recovery, interruption_robust_reasoning, situational_policy_table, low_confidence_gather_and_reorg [INFERRED 0.85]
- **Skill metacognitive con reward outcome-anchored + scorer-neq-scored** — reward_hacking_mitigation, judge_design, low_confidence_evpi_twin_pair, interruption_robust_reasoning, dependency_aware_error_recovery [INFERRED 0.75]
- **Pipeline authoring gold via template-inheritance** — gold_methodology, hierarchical_decomposition, todo_template_inheritance, area_02_criticality_safety, judge_coherence_two_level [INFERRED 0.75]
- **Decisioni D1-D5 confermano il briefing aperto** — adr_decisions_d1_d5, adr_open_decisions_briefing, training_curriculum_design [INFERRED 0.75]
- **Gold-examples area-02 condividono template+playbook+anti-RH** — gold_example_area02_criticality, training_vs_harness_classification, reward_hacking_mitigation [INFERRED 0.85]
- **pi hook lifecycle realizza i concept wrapper come F-harness** — pi_extension_api, structured_context_sections, training_vs_harness_categories [INFERRED 0.65]
- **Famiglia 1.x distruttive: template + 4 leaf-delta** — area02_group1_destructive_template, area02_leaf_11_delete_delta, area02_leaf_12_overwrite_delta, area02_leaf_13_migration_delta, area02_leaf_14_sideeffect_delta [EXTRACTED 1.00]
- **Pipeline espansione 1.1: template + delta + expander -> gold espanso byte-equal** — area02_group1_destructive_template, area02_leaf_11_delete_delta, expand_py, gold_example_area02_criticality_expanded [EXTRACTED 1.00]
- **Design curriculum+dataset commercial-clean (curriculum, manifest, volumi, briefing)** — training_curriculum_design, provenance_manifest, data_volume_estimate, decision_open_decisions_briefing [INFERRED 0.85]

## Communities (36 total, 13 thin omitted)

### Community 0 - "Criticality & Decision-Policy (Area-02)"
Cohesion: 0.05
Nodes (76): Anthropic policy: Claude fuori dal training-loop, automod Provenance Invariant (anti-injection), Balanced Asymmetric Reward (TP+FP penalty), Batch-First Consolidated Decision, Area 02 — Criticality/Safety (training-taxonomy), Over-Flagging / Cry-Wolf Defense, Check-Fantasma Detection (trace-anchored), Self-Versioning Gratis > Halt (+68 more)

### Community 1 - "Training Stack, Base Models & Teachers"
Cohesion: 0.06
Nodes (62): Adversarial Needle-in-Haystack Training, Agent Constitution, Axolotl (training framework), DeepSeek-R1 (teacher, long-CoT), Ollama (local serving), Qwen3-4B-Instruct-2507 (base model), TRL (RL post-training), Unsloth (training framework) (+54 more)

### Community 2 - "Base-Model & Coding-Eval Landscape"
Cohesion: 0.05
Nodes (60): ADR 2026-05-21 Project Bootstrap, ADR 2026-05-21 — Base Model Pipeline, Aider Polyglot, BigCodeBench, Catastrophic Forgetting, Codestral-22B-v0.1, CommitPackFT, Composition-aware training (+52 more)

### Community 3 - "Training Taxonomy — Skill Areas & Reward Defenses"
Cohesion: 0.05
Nodes (59): Area 1 - Organization & Long-Horizon Planning (T1), Quality-target inference & calibration leaf, Process-reward core (long-correct CoT + verify-loop, PRM split pos/neg), Process-marker spoofing defense (anchor to outcome not marker), Area 3 - Reasoning & Scientific Method (T1), Area 5 - Code Correctness (T2/T3, all Q), Anti-overfit-to-visible-tests defense (hidden/property/mutation tests), Area 6 - Code Quality & Architecture (T2/T3, mostly L) (+51 more)

### Community 4 - "Curriculum Decisions & Compute (D1-D6)"
Cohesion: 0.05
Nodes (53): A100-80GB spot/on-demand (RunPod/Vast/Lambda), ADR 2026-06-28 — Compute access full-FT/RL Tier1, ADR 2026-06-28 — Decisioni D1–D5 (+D6), Briefing — Decisioni aperte (2026-06-28), Catastrophic Forgetting, curriculum-stages-detail (5 stadi), D1 — LoRA init B=0 + spike aLoRA, D2 — Tokenizer/special-token + XGrammar (+45 more)

### Community 5 - "Harness (pi) & Multi-LoRA Research"
Cohesion: 0.09
Nodes (47): ADR 2026-06-23 — pi come base harness/wrapper, agent-wrapper-vars-queue, Contradiction-Detection Layer, Error-Memo System, AutoGen (Wu et al. 2023, Microsoft), Constitutional AI (Bai et al. 2022, Anthropic), Domain Randomization (Tobin et al. 2017), Gemma 4 (encoder-free multimodal, Google DeepMind 2026) (+39 more)

### Community 6 - "Wrapper Runtime & Reasoning Techniques"
Cohesion: 0.10
Nodes (43): Agent Wrapper Runtime — Queue + Vars Registry, Contradiction Detection Layer, Error Memo System, Explicit Attention Layer, Multi-Token Prediction Training, OWASP Top 10 LLM01 Prompt Injection, ADaPT (Archiki 2024), Attention Sinks (Xiao 2023) (+35 more)

### Community 7 - "Gold Template-Inheritance (Area-02 1.x)"
Cohesion: 0.12
Nodes (36): Anti-over-decomposition (proporzionalita, no cerimonia 3-heading), Template gruppo 1.x azioni distruttive (Q-deterministiche), Leaf-delta 1.1 cancellazione file non versionato, Leaf-delta 1.2 overwrite distruttivo, Leaf-delta 1.3 migrazione distruttiva DB/schema, Leaf-delta 1.4 azione con side-effect nascosto, Raw expandable skeleton (canonico-con-buchi), EXPANSION pipeline (template+delta -> full-gold) (+28 more)

### Community 8 - "Training Infra & Coding Benchmarks"
Cohesion: 0.07
Nodes (36): ADR Training From Scratch Clarification, Curiosity-Driven Exploration Training, Aider Polyglot benchmark, BigCodeBench, LiveCodeBench v6, SWE-Bench Verified, The Stack v2 (filtered), Axolotl (+28 more)

### Community 9 - "Architecture Concepts & MoE Quant"
Cohesion: 0.09
Nodes (32): Agent Constitution (codice di condotta), Coverage Audit 2026-06-23, Data Volume Estimate (16 aree), DwarfStar 4 (DS4), Per-Expert MoE Quantization, ADR 2026-05-21 base-model-pipeline, Agent Wrapper Vars-Queue, Contradiction-Detection Layer (+24 more)

### Community 10 - "Context Management & Metacognition (Area-04)"
Cohesion: 0.08
Nodes (31): Adversarial Needle-in-Haystack Training (paper-claim #5), Area 04 — Context Management & Metacognition (9 leaves example-space), Explicit-Attention Layer (pin CURRENT_AIM/PREV_STEP/GLOBAL/RULES), External Update Injection (section-boundary), Harness-Capabilities-as-Files (open→extract→note→close), KV-Cache Cost of close-to-reclaim, open->extract->note->close-to-reclaim, Skill vs Feature Demotion (+23 more)

### Community 11 - "Reasoning & Data-Gen Concepts"
Cohesion: 0.07
Nodes (28): concept:async-producer-consumer-pipeline, concept:code-augmented-cot, concept:gradient-collapse-rank, concept:iterative-prompting-env-feedback, concept:lora-plus-lr-ratio, concept:mcts-test-time, concept:organization-first-vision, concept:process-preference-model-ppm (+20 more)

### Community 12 - "Project Genesis & Wiki Method"
Cohesion: 0.13
Nodes (17): Curriculum Learning training strategy (Approach C), Conceptual confusion: 'delegation' base->LoRA misinterpreted as MoE, Design v1.0 — Modular layered LLM architecture, Approach A — External Python router, Approach B — MoE integration, Ingest / Query / Lint operations, Memex (Vannevar Bush, 1945), Persistent compounding artifact principle (+9 more)

### Community 13 - "Curiosity & Intrinsic-Motivation Research"
Cohesion: 0.16
Nodes (14): concept:active-inference, concept:bayesian-surprise-segmentation, concept:compression-progress-reward, concept:icm-forward-inverse-model, concept:noisy-tv-problem, concept:predictive-coding, concept:surprise-as-gradient-magnitude, concept:titans-mac-mag-mal-variants (+6 more)

### Community 14 - "Dynamic-Context & Data Augmentation"
Cohesion: 0.20
Nodes (10): Augmentation Knob K~3-5 (not volume), Label/Verifier Invariance under T, Dataset On-the-fly Pseudo-random (transform-layer, ×3-5 knob), Round-Trip Translation Check (gate), Seed Before Split (anti-leakage), Transform-Layer T(template, seed), 5+ Variable Dimensions per Section, Lost-in-the-Middle / Position Bias (+2 more)

### Community 15 - "Template Build Scripts (AST)"
Cohesion: 0.60
Nodes (5): derive(), expand(), main(), read(), unique_index()

### Community 16 - "Thinking-Style Prompts"
Cohesion: 0.40
Nodes (5): Prompts CHANGELOG — Thinking style versioning, State markers [V]/[A]/[?] for assertions, Structured reasoning principle (no free-flow thinking), Max yield per token spent — token efficiency, Thinking Style v1 — Structured reasoning prompt

### Community 19 - "User-Notes Sketches"
Cohesion: 0.67
Nodes (3): concept:user-notes-dataset-buckets, concept:user-notes-sliding-window-variable, image:appunti-quaderno

## Knowledge Gaps
- **98 isolated node(s):** `Prompts CHANGELOG — Thinking style versioning`, `wiki — Tier 2 Programming Generalist LoRA`, `Qwen 3.5 9B base model`, `PEFT (Hugging Face) — Adapter management`, `LoRA: Low-Rank Adaptation of LLMs (Hu et al., 2021)` (+93 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Process Reward Model (PRM) paper` connect `Training Taxonomy — Skill Areas & Reward Defenses` to `Harness (pi) & Multi-LoRA Research`?**
  _High betweenness centrality (0.077) - this node is a cross-community bridge._
- **Why does `Harness Feature Catalog (6 feature-class su pi)` connect `Context Management & Metacognition (Area-04)` to `Criticality & Decision-Policy (Area-02)`, `Training Stack, Base Models & Teachers`, `Curriculum Decisions & Compute (D1-D6)`, `Harness (pi) & Multi-LoRA Research`?**
  _High betweenness centrality (0.074) - this node is a cross-community bridge._
- **Why does `Scientific-Method Operating Protocol (8-step macro-loop, two-phase CoT)` connect `Harness (pi) & Multi-LoRA Research` to `Training Stack, Base Models & Teachers`, `Context Management & Metacognition (Area-04)`, `Training Taxonomy — Skill Areas & Reward Defenses`?**
  _High betweenness centrality (0.071) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `Reward-Hacking Mitigation` (e.g. with `Scorer≠Scored / Outcome-Anchored (anti participation-hack)` and `Regola #10 catene di pensiero = priorità`) actually correct?**
  _`Reward-Hacking Mitigation` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Persistent compounding artifact principle`, `Ingest / Query / Lint operations`, `Memex (Vannevar Bush, 1945)` to the rest of the system?**
  _215 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Criticality & Decision-Policy (Area-02)` be split into smaller, more focused modules?**
  _Cohesion score 0.05333333333333334 - nodes in this community are weakly interconnected._
- **Should `Training Stack, Base Models & Teachers` be split into smaller, more focused modules?**
  _Cohesion score 0.060814383923849816 - nodes in this community are weakly interconnected._