---
name: programming-generalist
description: Tier 2 — LoRA "programming generalist". Mindset programmazione, scelta stack.
type: architecture
tags: [tier2, lora, programming]
status: design-phase
last_updated: 2026-05-21
---

# Tier 2 — Programming Generalist LoRA

## Responsabilità

- **Mindset programmazione**: best practice trasversali (testing, error handling, naming, security).
- **Multi-repo understanding**: pattern architetturali, dipendenze, monorepo vs poly-repo.
- **Stack selection**: dato un requisito, scegliere combinazione di tecnologie sensata (es. "voglio CRUD app" → suggerisce FastAPI + Postgres + React).
- **Code quality assessment**: review-like reasoning su snippet propri o esterni.
- **Routing fine-grained**: dopo che l'orchestratore ha capito "è coding", questo LoRA può rifinire quale verticale è davvero rilevante.

## Implementazione

- **Method**: QLoRA 4-bit, rank 64-128, alpha 128-256.
- **Target modules**: `q_proj, k_proj, v_proj, o_proj, gate_proj, up_proj, down_proj` (all-linear), DoRA enabled.
- **Training data**:
  - Programming task descriptions + structured reasoning (input/reasoning/routing/code_guidance)
  - Multi-repo architecture examples
  - Stack selection con motivazione
  - Code review pairs (buono vs cattivo, con spiegazione)
- **Training order**: dopo orchestrator (frozen), prima dei verticali. Vedi [[../concepts/lora-stacking]] (copre il composition-aware training).

## Rischi noti

1. **Ridondanza se base = Qwen3-Coder**: il base coder ha già conoscenza programming generalista. Il LoRA aggiuntivo migliora marginalmente, costa training.
   - Mitigazione: validare empiricamente vs ablation (no programming LoRA). Se delta < 3% → drop.

2. **Interferenza con verticali**: programming + verticale caricati insieme = somma pesi non compositional.
   - Mitigazione: composition-aware training (trainare verticale con programming caricato e congelato). Costo training 2x.

3. **Forgetting da Tier 1**: trainare programming sopra orchestrator FT potrebbe danneggiare le capacità organizzative del base.
   - Mitigazione: freeze orchestrator durante training programming. Eval orchestrator post-training.

## Alternative considerate

- **Skip Tier 2**: base Qwen3-Coder + LoRA verticali direttamente. Più semplice ma perde il "ponte" tra alto livello e specializzazione. Documentata in [[decisions/2026-05-21-project-bootstrap]].
- **Merge nel base prima dei verticali**: distillare programming LoRA dentro il base diventato orchestratore. Più pulito serving, ma perde modularità (non più disattivabile).

## Open questions

[[open-questions]] #6, #8, #10, #14.

## Stato

Design-phase. Definizione dataset non iniziata.
