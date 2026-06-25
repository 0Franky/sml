---
name: mole
description: Mixture of LoRA Experts (MoLE) — gating per fusion di adapter. Wu, Huang, Wei et al. (Microsoft Research) 2024 ICLR.
type: entity
entity_type: paper
tags: [paper, lora, moe, gating]
sources: [https://arxiv.org/abs/2404.13628]
last_updated: 2026-05-21
---

# MoLE — Mixture of LoRA Experts

## Riferimento

- Paper: https://arxiv.org/abs/2404.13628 (**Xun Wu, Shaohan Huang, Furu Wei** — Microsoft Research, 2024)
- OpenReview: https://openreview.net/forum?id=uWvKBCYh4S
- Venue: ICLR 2024

> Nota: in versione iniziale di questa pagina avevo citato "Feng et al." — è ERRATO. Gli autori sono Wu/Huang/Wei (Microsoft Research). Corretto 2026-05-21 dopo paper verification sweep.

## Cosa fa

Modello che combina N LoRA pre-trainati attraverso un **gating learned**. Differisce da X-LoRA per dettagli del gating (probabilistico vs scaling), e da LoraHub perché il gating è gradient-trained.

## Perché rilevante

- **Famiglia di metodi** di cui fanno parte X-LoRA, HMoRA, LD-MoLE, HDMoLE, LoRA-Mixer
- Tutti puntano allo stesso problema: come comporre più LoRA mantenendo flessibilità senza interferenza
- Paper "ombrello" della famiglia → buon riferimento iniziale per literature review

## Pattern condiviso famiglia MoLE

1. N LoRA pre-trainati su task diversi
2. Router/gating piccolo learned
3. Inference: gating decide quanto pesare ciascun LoRA (per layer / per token / per task)
4. Vs hot-swap nostro: gating è continuo e learned, non binario e deterministico

## Trade-off

- Più flessibile di hot-swap discreto
- Meno interpretabile
- Richiede co-training del gating
- Performance dipende da quanti LoRA hai (sotto 5 il vantaggio è marginale)

## Confidence

- Esistenza paper: **[EXTRACTED]**
- Posizione nella famiglia MoLE: **[EXTRACTED]**

## Link interni

- [[hmora]]
- [[x-lora]]
- [[ld-mole]]
- [[lora-mixer]]
- [[concepts/lora-stacking]]
