---
name: lora-mixer
description: LoRA-Mixer — coordinazione di LoRA experts via serial attention routing. 2025.
type: entity
entity_type: paper
tags: [paper, lora, moe, attention-routing]
sources: [https://arxiv.org/abs/2507.00029, https://openreview.net/forum?id=GMP1S4R6Ke]
last_updated: 2026-05-21
---

# LoRA-Mixer

## Riferimento

- Paper: https://arxiv.org/html/2507.00029v1 (2025)
- OpenReview: https://openreview.net/forum?id=GMP1S4R6Ke

## Cosa fa

Coordina LoRA experts modulari attraverso **serial attention routing** — il routing avviene **dentro la matrice di proiezione dell'attention**, non come modulo separato.

## Particolarità

- Routing integrato nell'attention → meno parametri rispetto a un router esterno
- Mantiene modularità degli expert
- Ordering seriale → un expert può raffinare l'output del precedente

## Rilevanza per noi

Pattern interessante per il flusso programming generalist → verticale: se invece di stacking additivo facessimo "Tier 2 produce intermediate, Tier 3 raffina", LoRA-Mixer è il riferimento architetturale.

## Confidence

- Esistenza paper: **[EXTRACTED]**
- Applicabilità: **[INFERRED]**

## Link interni

- [[mole]]
- [[architecture/programming-generalist]]
- [[architecture/vertical-loras]]
