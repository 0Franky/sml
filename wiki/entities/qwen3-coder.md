---
name: qwen3-coder
description: Qwen3-Coder — variante coding-specialized della famiglia Qwen3, base candidate.
type: entity
entity_type: model
tags: [qwen, coding-model, base-candidate]
sources: [https://qwenlm.github.io, transcript.md]
last_updated: 2026-05-21
---

# Qwen3-Coder

## Cosa è

Variante della famiglia Qwen3 specializzata su coding. Pretrained con pesi tilt verso codice. Citato come base candidate nel transcript della sessione precedente (transcript:265).

## Dimensioni

- Qwen3-Coder 7B — consumer GPU friendly (24GB VRAM con QLoRA)
- Qwen3-Coder 30B-A3B — MoE, 3B parametri attivi, richiede cloud A100 40GB
- (Vedi anche [[qwen3-coder-next]] per la variante successiva)

## Perché rilevante per noi

- **Base candidato Tier 2/3**: se l'orchestrator (Tier 1) viene fatto su Qwen3-generic e i verticali su Qwen3-Coder, abbiamo base diversi → problema di compatibilità adapter. Alternativa: base unificato (tutto su Qwen3-Coder, orchestrator FT sopra).
- **Trade-off vs Qwen3.5-9B generic**: il design v1.0 originale usava 9B generic, ma il transcript ha notato (correttamente) che per coding è sub-ottimo. Decisione aperta — vedi [[open-questions]] #5, #6.

## Riferimenti

- Qwen3-Coder-Next guide (Unsloth): https://unsloth.ai/docs/models/qwen3-coder-next
- Latent Space top local models April 2026: https://www.latent.space/p/ainews-top-local-models-list-april

## Confidence

- Esistenza modello: **[EXTRACTED]** (citato in transcript da multiple fonti web)
- Dimensioni esatte / nomi varianti correnti: **[INFERRED]** — verificare HF Qwen org prima di scaricare
- Performance esatta benchmark 2026: **[AMBIGUOUS]** — da misurare empiricamente in Phase 0 (baseline eval)

## Link interni

- [[architecture/three-tier-design]]
- [[architecture/orchestrator-layer]]
- [[architecture/vertical-loras]]
- [[qwen3-coder-next]]
- [[open-questions]]
