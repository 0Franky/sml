---
name: hdmole
description: HDMoLE — Mixture of LoRA Experts con Hierarchical Routing + Dynamic Thresholds, per fine-tuning di ASR LLM-based. Mapping esplicito experts↔dominio.
type: entity
entity_type: paper
tags: [paper, lora, moe, hierarchical-routing, dynamic-threshold, asr]
sources: [https://arxiv.org/abs/2409.19878, https://arxiv.org/html/2409.19878]
last_updated: 2026-06-25
---

# HDMoLE — Hierarchical Routing + Dynamic Thresholds

## Riferimento
- "HDMoLE: Mixture of LoRA Experts with Hierarchical Routing and Dynamic Thresholds for Fine-Tuning LLM-based ASR Models" — arXiv:2409.19878 (2024).

## Cosa fa
Mixture of LoRA Experts con **routing gerarchico** + **soglie dinamiche** di attivazione degli expert. Caratteristica utile: **mapping esplicito experts ↔ dominio** (a differenza del routing puramente implicito). Dominio di studio = **ASR** (speech recognition).

## Perché rilevante per noi
- Il **mapping esplicito experts↔dominio** è interessante per i nostri **stack verticali** (Tier 3): ogni LoRA verticale ↔ un dominio dichiarato, con soglia dinamica di attivazione → si lega al routing ([[../concepts/_user-notes-2026-06-23|tag tipologia]]) e al reclutamento dinamico in [[../concepts/multi-expert-collaboration]].
- Variante "hierarchical routing" della famiglia router-learned (vs nostro sequenziale).

## Confidence
- Esistenza paper: **[EXTRACTED]** (citato in sessione precedente).
- Applicabilità coding (vs ASR): **[AMBIGUOUS]** — pattern trasferibile ma non testato.

## Link interni
- [[hmora]], [[x-lora]], [[ld-mole]], [[med-moe-lora]]
- [[../concepts/multi-expert-collaboration]], [[../architecture/vertical-loras]]
