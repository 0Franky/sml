# Graph Report - .  (2026-06-25)

## Corpus Check
- 99 files · ~99,999 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 416 nodes · 758 edges · 14 communities (12 shown, 2 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 33 edges (avg confidence: 0.79)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Training Taxonomy & Reward Design|Training Taxonomy & Reward Design]]
- [[_COMMUNITY_Tier-1 Reasoning Protocol & Constitution|Tier-1 Reasoning Protocol & Constitution]]
- [[_COMMUNITY_Context Engineering & User Notes|Context Engineering & User Notes]]
- [[_COMMUNITY_Multi-Expert Collaboration & Safety|Multi-Expert Collaboration & Safety]]
- [[_COMMUNITY_Training Philosophy & Data Regime|Training Philosophy & Data Regime]]
- [[_COMMUNITY_Project Schema, Wiki & v1.0 Design|Project Schema, Wiki & v1.0 Design]]
- [[_COMMUNITY_LoRA Stacking, Verticals & Wrapper|LoRA Stacking, Verticals & Wrapper]]
- [[_COMMUNITY_ADRs & Foundational Papers|ADRs & Foundational Papers]]
- [[_COMMUNITY_Base Models & Hardware|Base Models & Hardware]]
- [[_COMMUNITY_Open Questions & Model Pipeline|Open Questions & Model Pipeline]]
- [[_COMMUNITY_Intrinsic Motivation & Memory Papers|Intrinsic Motivation & Memory Papers]]
- [[_COMMUNITY_User Notes - Dataset Buckets|User Notes - Dataset Buckets]]
- [[_COMMUNITY_Tier 2 Programming Generalist|Tier 2 Programming Generalist]]
- [[_COMMUNITY_Project Bootstrap ADR|Project Bootstrap ADR]]

## God Nodes (most connected - your core abstractions)
1. `User Notes — Related Research & Derivative Ideas` - 29 edges
2. `Agent Constitution (operational code of conduct)` - 24 edges
3. `User Notes 2026-06-23 (Telegram batch)` - 24 edges
4. `Training Taxonomy backbone master (16 areas)` - 24 edges
5. `Multi-Expert Collaboration via Sequential LoRA Hot-Swap` - 21 edges
6. `Scientific Method Operating Protocol (Tier 1)` - 19 edges
7. `Reward-hacking mitigation (first-class cross-pipeline constraint)` - 17 edges
8. `Structured Context — Sections and State Tracking` - 16 edges
9. `Steering Vectors (Activation Steering)` - 16 edges
10. `SLM Coding Models Landscape 2026` - 15 edges

## Surprising Connections (you probably didn't know these)
- `Confidence tags convention (EXTRACTED/INFERRED/AMBIGUOUS)` --semantically_similar_to--> `State markers [V]/[A]/[?] for assertions`  [INFERRED] [semantically similar]
  CLAUDE.md → prompts/thinking-style.v1.md
- `LLM Wiki pattern (raw/wiki/schema 3 layers)` --references--> `CLAUDE.md — Project schema and onboarding`  [EXTRACTED]
  .karpathy-wiki-template.md → CLAUDE.md
- `QLoRA 4-bit` --conceptually_related_to--> `Qwen3-Coder-Next 80B-A3B`  [INFERRED]
  wiki/architecture/vertical-loras.md → wiki/entities/qwen3-coder-next.md
- `Structured Thinking — Caveman Reasoning` --cites--> `prompts/thinking-style.v1.md`  [EXTRACTED]
  wiki/concepts/structured-thinking.md → prompts/thinking-style.v1.md
- `Staged Curriculum Training (reasoning→org→criticality→coding)` --semantically_similar_to--> `Post-RL Path Optimization (impratichimento, token compression)`  [INFERRED] [semantically similar]
  wiki/concepts/staged-curriculum-training.md → wiki/concepts/post-rl-path-optimization.md

## Hyperedges (group relationships)
- **Runtime Safety & Coherence Stack** — pre_flight_safety_checks, contradiction_detection_layer, error_memo_system, agent_constitution [INFERRED 0.85]
- **Organization-First Reasoning & Training Protocol** — scientific_method_protocol, staged_curriculum_training, post_rl_path_optimization, structured_context_sections [INFERRED 0.85]
- **Router-Learned MoE-of-LoRA Family (concurrent alternative)** — ext_xlora, ext_hmora, ext_mole, hdmole_paper, multi_expert_collaboration [INFERRED 0.85]
- **Per-leaf hack-check / reward-hacking defense recurs across all 16 areas** — ext_reward_hacking_mitigation, training-taxonomy_hack_check, area-02_over_flagging_defense, area-03_process_marker_spoofing, area-05_overfit_visible_tests_defense, area-06_judge_reward_hacking_defense, area-07_over_refusal_defense, area-08_participation_hack_defense, area-09_sycophancy_defense, area-12_confident_hallucination_defense, area-13_test_tampering_defense, area-14_hardcode_shortcut_defense, area-16_scorer_not_scored [INFERRED 0.85]
- **3-phase macro-curriculum (theory->exercises->agentic RL) assigns every area/leaf** — training-taxonomy_macro_curriculum_3_phases, ext_staged_curriculum_training, ext_scuola_learning_philosophy, ext_scientific_method_protocol, ext_pi_harness_adr [INFERRED 0.85]
- **Process-reward (PRM) cluster: long-correct CoT, verify-loop, self-verification anchored to outcome** — area-03_prm_core, area-14_algorithmic_math, area-16_self_evaluation_critique, ext_prm_paper, ext_rstar_math_paper [INFERRED 0.75]

## Communities (14 total, 2 thin omitted)

### Community 0 - "Training Taxonomy & Reward Design"
Cohesion: 0.05
Nodes (69): Area 1 - Organization & Long-Horizon Planning (T1), Quality-target inference & calibration leaf, Area 2 - Criticality & Safety Awareness (T1, SIGNATURE), Over-flagging / cry-wolf defense (balanced asymmetric reward), Process-reward core (long-correct CoT + verify-loop, PRM split pos/neg), Process-marker spoofing defense (anchor to outcome not marker), Area 3 - Reasoning & Scientific Method (T1), Area 4 - Context Management & Metacognition (T1/X) (+61 more)

### Community 1 - "Tier-1 Reasoning Protocol & Constitution"
Cohesion: 0.06
Nodes (68): ADR 2026-06-23 pi Harness Base, Adversarial Needle-in-Haystack Training, Agent Constitution (operational code of conduct), Axolotl (training framework), DeepSeek-R1 (teacher, long-CoT), Ollama (local serving), pi (earendil-works/pi harness, MIT), Qwen3-4B-Instruct-2507 (base model) (+60 more)

### Community 2 - "Context Engineering & User Notes"
Cohesion: 0.10
Nodes (48): Agent Wrapper Runtime — Queue + Vars Registry, Contradiction Detection Layer, Error Memo System, Explicit Attention Layer, External Update Injection, Multi-Token Prediction Training, OWASP Top 10 LLM01 Prompt Injection, ADaPT (Archiki 2024) (+40 more)

### Community 3 - "Multi-Expert Collaboration & Safety"
Cohesion: 0.09
Nodes (48): Agent Wrapper Runtime — Queue + Vars Registry, Graphify OS-Agnostic Portability Rule (repo-relative paths), Karpathy LLM-Wiki Pattern (raw/wiki/schema layers), CLAUDE.md Project Schema (Wiki Layout & Rules), Contradiction Detection Layer (runtime coherence monitor), Error Memo System (lessons-learned memory), AutoGen (Wu et al. 2023, Microsoft), Constitutional AI (Bai et al. 2022, Anthropic) (+40 more)

### Community 4 - "Training Philosophy & Data Regime"
Cohesion: 0.08
Nodes (40): ADR 2026-05-21 Project Bootstrap, Curiosity-Driven Exploration Training, Dynamic Context Training Regime, PyTorch Lightning, Ray Data, graphify knowledge graph tool, grill-me skill, HANDOFF.md (raw source) (+32 more)

### Community 5 - "Project Schema, Wiki & v1.0 Design"
Cohesion: 0.06
Nodes (35): AI-Research-SKILLs library (LoRA, PEFT, RL), ARIS — Auto Claude Code Research In Sleep skill suite, CLAUDE.md — Project schema and onboarding, Confidence tags convention (EXTRACTED/INFERRED/AMBIGUOUS), Curriculum Learning training strategy (Approach C), Conceptual confusion: 'delegation' base->LoRA misinterpreted as MoE, Design v1.0 — Modular layered LLM architecture, Approach A — External Python router (+27 more)

### Community 6 - "LoRA Stacking, Verticals & Wrapper"
Cohesion: 0.09
Nodes (32): Aider Polyglot, BigCodeBench, Catastrophic Forgetting, CommitPackFT, Composition-aware training, Eval Modern Coding Benchmarks, Elastic Weight Consolidation (EWC), FastAPI (+24 more)

### Community 7 - "ADRs & Foundational Papers"
Cohesion: 0.07
Nodes (28): concept:async-producer-consumer-pipeline, concept:code-augmented-cot, concept:gradient-collapse-rank, concept:iterative-prompting-env-feedback, concept:lora-plus-lr-ratio, concept:mcts-test-time, concept:organization-first-vision, concept:process-preference-model-ppm (+20 more)

### Community 8 - "Base Models & Hardware"
Cohesion: 0.24
Nodes (14): ADR 2026-05-21 — Base Model Pipeline, Codestral-22B-v0.1, DeepSeek-Coder-V2-Lite-Instruct, granite-8b-code-instruct-4k, RTX 2080 Ti 11GB (Turing), Open Questions register, Qwen3-4B-Instruct-2507, Qwen3-8B (+6 more)

### Community 9 - "Open Questions & Model Pipeline"
Cohesion: 0.16
Nodes (14): ADR Training From Scratch Clarification, Aider Polyglot benchmark, BigCodeBench, LiveCodeBench v6, SWE-Bench Verified, The Stack v2 (filtered), Axolotl, DeepSpeed (+6 more)

### Community 10 - "Intrinsic Motivation & Memory Papers"
Cohesion: 0.16
Nodes (14): concept:active-inference, concept:bayesian-surprise-segmentation, concept:compression-progress-reward, concept:icm-forward-inverse-model, concept:noisy-tv-problem, concept:predictive-coding, concept:surprise-as-gradient-magnitude, concept:titans-mac-mag-mal-variants (+6 more)

### Community 11 - "User Notes - Dataset Buckets"
Cohesion: 0.67
Nodes (3): concept:user-notes-dataset-buckets, concept:user-notes-sliding-window-variable, image:appunti-quaderno

## Knowledge Gaps
- **84 isolated node(s):** `Prompts CHANGELOG — Thinking style versioning`, `wiki — Tier 2 Programming Generalist LoRA`, `Qwen 3.5 9B base model`, `PEFT (Hugging Face) — Adapter management`, `LoRA: Low-Rank Adaptation of LLMs (Hu et al., 2021)` (+79 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Wiki Index` connect `Training Philosophy & Data Regime` to `Open Questions & Model Pipeline`, `Context Engineering & User Notes`, `Project Schema, Wiki & v1.0 Design`, `LoRA Stacking, Verticals & Wrapper`?**
  _High betweenness centrality (0.093) - this node is a cross-community bridge._
- **Why does `wiki/README.md — Wiki entry point + synthesis` connect `Project Schema, Wiki & v1.0 Design` to `Open Questions & Model Pipeline`, `Training Philosophy & Data Regime`?**
  _High betweenness centrality (0.076) - this node is a cross-community bridge._
- **Why does `Process Reward Model (PRM) paper` connect `Multi-Expert Collaboration & Safety` to `Training Taxonomy & Reward Design`?**
  _High betweenness centrality (0.071) - this node is a cross-community bridge._
- **What connects `Persistent compounding artifact principle`, `Ingest / Query / Lint operations`, `Memex (Vannevar Bush, 1945)` to the rest of the system?**
  _119 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Training Taxonomy & Reward Design` be split into smaller, more focused modules?**
  _Cohesion score 0.05285592497868713 - nodes in this community are weakly interconnected._
- **Should `Tier-1 Reasoning Protocol & Constitution` be split into smaller, more focused modules?**
  _Cohesion score 0.06409130816505706 - nodes in this community are weakly interconnected._
- **Should `Context Engineering & User Notes` be split into smaller, more focused modules?**
  _Cohesion score 0.09574468085106383 - nodes in this community are weakly interconnected._