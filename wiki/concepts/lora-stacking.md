---
name: lora-stacking
description: Caricare più LoRA insieme sullo stesso base. Interferenza, composition-aware training.
type: concept
tags: [concept, lora, composition, interference]
last_updated: 2026-05-21
---

# LoRA Stacking

## Problema

Caricare contemporaneamente due o più LoRA sullo stesso base model. Caso nostro: programming generalist (Tier 2) + verticale (Tier 3) attivi simultaneamente quando l'orchestratore (Tier 1) richiede coding.

## Modalità di stacking

### 1. Additivo

Pesi LoRA sommati direttamente sui layer del base: `W_effective = W_base + A_prog · B_prog + A_vert · B_vert`.

**Pro**: zero costo inference oltre il base.
**Contro**: se i due LoRA sono trainati indipendentemente, la somma **non è compositional**. Possono interferire in modi imprevisti — un LoRA può "annullare" o "amplificare" pattern dell'altro.

### 2. Composition con scaling alpha

Stessa formula, ma con `alpha_prog` e `alpha_vert` regolabili a runtime: `W = W_base + alpha_prog · ΔW_prog + alpha_vert · ΔW_vert`.

**Pro**: più sicuro, puoi attenuare un LoRA se sta interferendo.
**Contro**: tuning manuale, niente garanzia di compositionality vera.

### 3. Composition learned (MoLE / X-LoRA / HMoRA)

Router learned che decide pesi composizione layer-wise o token-wise. Vedi [[entities/mole]], [[entities/x-lora]], [[entities/hmora]].

**Pro**: meglio teoricamente, gestisce interferenze.
**Contro**: aggiunge fase di training (il router), perde determinismo.

### 4. Merge into base

Distillare LoRA dentro il base model (`W_new = W + ΔW_lora`), poi training successivi sopra.

**Pro**: serving pulito, no overhead inference, no interferenza tra LoRA "mergiati".
**Contro**: perdi modularità (non puoi più disattivare il LoRA).

## Composition-aware training (mitigazione raccomandata)

Quando trainiamo il LoRA verticale (Tier 3), invece di trainare sul base puro, **manteniamo il LoRA programming (Tier 2) caricato e congelato**. Il gradient del verticale impara a "convivere" con il programming. 

- Costo: training 2x slower (forward pass attraversa anche il programming LoRA)
- Beneficio: riduzione interferenza al test-time quando entrambi caricati

Implementazione: PEFT supporta freeze di adapter durante training. Vedi `peft.PeftModel.set_adapter` + `requires_grad_=False`.

## Per il nostro setup

Stato proposto: **Tier 2 (programming) + Tier 3 (verticale) attivi insieme**. Decisione tra modalità sopra è aperta — vedi [[open-questions]] #8, #14.

Default proposto (da validare):
1. Training Tier 2: LoRA additivo standard
2. Training Tier 3: **composition-aware** (Tier 2 caricato + congelato)
3. Inference: stacking additivo (Tier 2 + Tier 3 caricati)

Se interferenza misurata > soglia → switch a X-LoRA-style learned composition.

## Confidence

- Problema esiste: **[EXTRACTED]** (consenso nella letteratura citata in transcript)
- Soluzioni proposte: **[INFERRED]** dai paper della famiglia MoLE — efficacia esatta nel nostro setup da misurare empiricamente

## Link interni

- [[entities/mole]]
- [[entities/x-lora]]
- [[entities/hmora]]
- [[architecture/programming-generalist]]
- [[architecture/vertical-loras]]
- [[concepts/catastrophic-forgetting]]
