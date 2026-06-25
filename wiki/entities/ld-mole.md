---
name: ld-mole
description: LD-MoLE — Learnable Dynamic Routing for Mixture of LoRA Experts. 2025.
type: entity
entity_type: paper
tags: [paper, lora, moe, dynamic-routing]
sources: [https://arxiv.org/abs/2509.25684]
last_updated: 2026-05-21
---

# LD-MoLE — Learnable Dynamic Routing for Mixture of LoRA Experts

## Riferimento

- Paper: https://arxiv.org/abs/2509.25684 (2025)
- OpenReview: https://openreview.net/forum?id=4ST2YyTjI7

## Cosa fa

Variante della famiglia MoLE che enfatizza il **routing dinamico learnable** — il router cambia il pattern di attivazione in base al contenuto del prompt, non solo al task type.

## Differenza vs MoLE base

- Routing più adattivo: per-token decision
- Migliora performance su task ibridi (es. coding + matematica + spiegazione)

## Rilevanza per noi

Se il problema nei nostri verticali è "task ibridi" (utente chiede "scrivi backend FastAPI + frontend React + query SQL" in un solo turno), LD-MoLE potrebbe gestirlo meglio del nostro hot-swap "uno alla volta".

Limite: stesso compounding error nel routing. Se sbaglia per un token, output degradato.

## Confidence

- Esistenza paper: **[EXTRACTED]**
- Applicabilità al nostro coding setup: **[INFERRED]**

## Link interni

- [[mole]]
- [[hmora]]
- [[architecture/vertical-loras]]
