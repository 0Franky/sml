---
name: qwen3-coder-next
description: Qwen3-Coder-Next — variante successiva, 80B MoE con 3B parametri attivi.
type: entity
entity_type: model
tags: [qwen, coding-model, moe, base-candidate]
sources: [https://unsloth.ai/docs/models/qwen3-coder-next, transcript.md]
last_updated: 2026-05-21
---

# Qwen3-Coder-Next

## Cosa è

Variante "Next" della linea Qwen3-Coder. Architettura MoE (Mixture of Experts): 80B parametri totali, ~3B attivi per token. Citato nel transcript come best agentic coding locale 2026.

## Perché rilevante

- Top scelta della community LocalLLaMA + Latent Space (April 2026) come "best local coding model"
- VRAM activated low → inference accessibile pure su hardware consumer alto-end
- MoE già nativo nel base → trade-off interessante vs custom MoE layer

## Trade-off vs Qwen3-Coder 7B

| Aspetto | Qwen3-Coder 7B | Qwen3-Coder-Next 80B-A3B |
|---------|----------------|---------------------------|
| VRAM inference | ~12GB Q4 | ~50GB (80B weights necessari in memoria anche se 3B attivi) |
| Performance baseline | Solido | Top local 2026 |
| Compatibilità Unsloth training | Sì | Sì (vedi guide) |
| LoRA training overhead | Basso | Alto (MoE rende LoRA più complesso da trainare bene) |

## Rilevanza per architettura three-tier

- Se base orchestrator = Qwen3-Coder-Next → costo training Tier 1 alto, ma capacità grande
- LoRA su MoE = stato dell'arte ancora in evoluzione, attenzione a layer expert vs LoRA target modules
- Considerare se VRAM permette: vincolo decisivo (vedi [[open-questions]] #11)

## Riferimenti

- Unsloth guide: https://unsloth.ai/docs/models/qwen3-coder-next
- Latent Space coverage: https://www.latent.space/p/ainews-top-local-models-list-april

## Confidence

- Esistenza + architettura MoE 80B-A3B: **[EXTRACTED]**
- Performance "top local 2026": **[EXTRACTED]** (community consensus)
- Compatibilità training tecnica esatta col nostro setup: **[INFERRED]** — verificare con Unsloth + PEFT compat matrix

## Link interni

- [[qwen3-coder]]
- [[architecture/orchestrator-layer]]
