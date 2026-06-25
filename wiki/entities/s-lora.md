---
name: s-lora
description: S-LoRA — serving thousands of concurrent LoRA adapters su single base model.
type: entity
entity_type: paper
tags: [paper, lora, serving, infrastructure]
sources: [https://arxiv.org/pdf/2311.03285]
last_updated: 2026-05-21
---

# S-LoRA

## Riferimento

- Paper: https://arxiv.org/pdf/2311.03285
- Titolo: "S-LoRA: Serving Thousands of Concurrent LoRA Adapters"

## Cosa fa

Sistema di inference che serve **migliaia di LoRA adapter contemporaneamente** su un singolo base model. Risolve il problema "ho 1000 LoRA per 1000 utenti diversi, come li servo?" via paged memory + batching speciale.

## Rilevanza per noi

- **Non immediatamente rilevante** se abbiamo 3-10 LoRA (numero piccolo, hot-swap basta).
- **Rilevante per il wrapper**: se il wrapper diventa multi-utente con LoRA personalizzati per ciascuno, S-LoRA è la baseline architetturale per il serving.
- **vLLM integration**: vLLM `--enable-lora` implementa concetti S-LoRA-like; nostra inference stack candidato.

## Quando approfondirlo

- Quando si arriva a Phase 4/5 (wrapper production con utenti)
- Se il numero di LoRA totali supera ~20

## Confidence

- Esistenza paper + architettura: **[EXTRACTED]**

## Link interni

- [[architecture/wrapper]]
- [[concepts/lora-stacking]]
