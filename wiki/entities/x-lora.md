---
name: x-lora
description: X-LoRA — scaling weight per layer/token su LoRA pre-trainati. Buehler 2024.
type: entity
entity_type: paper
tags: [paper, lora, moe, scaling-weights]
sources: [https://github.com/EricLBuehler/xlora]
last_updated: 2026-05-21
---

# X-LoRA — Mixture of LoRA Experts

## Riferimento

- Repo: https://github.com/EricLBuehler/xlora
- Autore: Eric L. Buehler (2024)

## Cosa fa

Dato un set di LoRA pre-trainati, X-LoRA aggiunge un **router MLP piccolo** che impara a produrre **scaling weight per layer e per token** per ciascun adapter. Effettivamente un'altra forma di Mixture of LoRA Experts, ma con focus su scaling continuo invece di selezione discreta.

## Perché rilevante

- **Composizione learnable**: invece di scegliere "carico A o carico B", impara "quanto A + quanto B per ogni layer e token".
- **Funziona su LoRA esistenti**: non richiede co-training dei LoRA — li puoi addestrare separatamente e poi imparare il router sopra.
- **Soluzione potenziale al problema di composition-aware training** che affligge la nostra Tier 2 + Tier 3.

## Trade-off vs nostra architettura

- **Pro**: composizione fluida (non binaria) tra programming generalist + verticale.
- **Pro**: routing learned può catturare interazioni sottili che hot-swap deterministico perde.
- **Contro**: router MLP da addestrare = altra fase di training.
- **Contro**: meno interpretabile (perdi audit "ho caricato questi adapter, in questo ordine, per questo motivo").

## Possibili usi

1. **Wrapping della nostra Tier 2 + Tier 3**: invece di caricare programming + verticale con additivo o sequenziale, usare X-LoRA come livello composizione learnable.
2. **Baseline**: trainare X-LoRA su nostri LoRA e confrontare vs hot-swap deterministico.

## Confidence

- Esistenza repo attivo: **[EXTRACTED]**
- Performance esatta sul nostro use case: **[AMBIGUOUS]** — da testare

## Link interni

- [[hmora]]
- [[mole]]
- [[lorahub]]
- [[architecture/vertical-loras]]
- [[concepts/lora-stacking]]
