---
name: med-moe-lora
description: Med-MoE-LoRA / "Towards Specialized Generalists" — framework Multi-Task MoE-LoRA per adattamento domain-specific. Decoupling cognizione generale vs expertise di dominio. Match concettuale con la three-tier.
type: entity
entity_type: paper
tags: [paper, lora, moe, hierarchical, domain-adaptation, specialized-generalist]
sources: [https://arxiv.org/abs/2601.07935, https://arxiv.org/html/2601.07935v1]
last_updated: 2026-06-25
---

# Med-MoE-LoRA / Specialized Generalists

## Riferimento
- "Towards Specialized Generalists: A Multi-Task MoE-LoRA Framework for Domain-Specific LLM Adaptation" — arXiv:2601.07935 (2026).

## Cosa fa
Framework **Multi-Task MoE-LoRA** che **disaccoppia la cognizione generale dall'expertise di dominio**: il modello mantiene capacità generali e attiva expert LoRA per il dominio specifico. Osservazione chiave (hierarchical features): **layer bassi = sintassi/feature universali, layer alti = task/dominio**. Domain di studio = medical, ma il **pattern è trasferibile al coding**.

## Perché rilevante per noi
- **Match concettuale con la [[../architecture/three-tier-design|three-tier]]**: "generalista specializzato" = base generale (Tier 1) + expertise di dominio (LoRA verticali Tier 3). Conferma l'intuizione dell'allocazione asimmetrica per profondità di layer.
- Supporta il bivio router-learned ([[x-lora]], [[hmora]]) come alternativa al nostro sequenziale.

## Confidence
- Esistenza paper: **[EXTRACTED]** (citato nella ricerca sessione precedente, [[../concepts/_paper-verification-2026-05-21|da ri-verificare in sweep]]).
- Performance sul nostro use case: **[AMBIGUOUS]**.

## Link interni
- [[hmora]], [[x-lora]], [[hdmole]], [[mole]]
- [[../architecture/three-tier-design]]
