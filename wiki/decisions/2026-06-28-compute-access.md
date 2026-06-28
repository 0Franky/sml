---
name: 2026-06-28-compute-access
description: Come accedere al compute per il full-FT/RL del Tier1 (4B). Finding NVIDIA: nessun compute gratuito self-serve per startup commerciale; via pratica = A100-80GB spot a ore (~$10-55/run). Inception worth-apply. QLoRA≠full-FT. Richiesta utente msg 266.
type: adr
tags: [compute, hardware, nvidia, training, budget, full-ft]
sources: [user msg 2026-06-28 (266), research-agent (fonti ufficiali NVIDIA), project_training_approach_decided]
last_updated: 2026-06-28
status: informational — awaiting scelta utente
---

# Compute access — full-FT/RL Tier1 (4B)

> Richiesta utente msg 266 ("verifica se il full training possiamo farlo con piattaforme NVIDIA"). Ricerca agente alle fonti ufficiali. **Non consulenza.**

## Finding (NVIDIA)
- **Nessun compute gratuito self-serve** per solo-founder commerciale: **Academic-Grant CHIUSO** + ineleggibile (non-faculty); **DGX-Cloud** enterprise-gated (min ~$75K); **LaunchPad** solo trial-demo (2 settimane); **Inception** dà crediti **partner** (AWS Activate…), non compute NVIDIA diretto.
- **NeMo / NeMo-RL** = framework **Apache-2.0** (SFT/DPO/GRPO/distillation) → software gratis, NON compute; per un 4B i nostri framework (Unsloth→Axolotl→TRL) sono più semplici.
- **NVIDIA Inception** (startup): **gratis, no-equity**; requisiti = entità **incorporata** + **sito web** + ≥1 dev; esclude consulting/reseller/crypto. Crediti realistici bootstrapped **~$10-25K** (non i $100K headline) → **vale la pena applicare** (coprirebbe tutto il training), inquadrando il wrapper come **PRODOTTO AI** (non servizio).

## Via pratica (reco)
- **Full-FT Tier1 (4B) = 1× A100-80GB spot/on-demand a ore**: RunPod ~$1.2/h · Vast ~$0.67-1.1/h · Lambda ~$2/h (affidabile). Un run SFT ~10-40 GPU-h → **~$10-55/run**; con 5-10 run di tuning **<$300-500**. RL aggiunge costo (rollout) ma resta **centinaia $, non migliaia**, su spot.
- ⚠️ **QLoRA ≠ full-FT** (chiarimento): QLoRA entra anche nel **2080Ti** (prototipa la pipeline a costo 0) MA **non è equivalente** al full-FT per il reshaping del Tier1. La scelta reale = full-FT su A100-spot (decisione §6.5.b). QLoRA-Tier1 resta opzione-MVP-economica ma con reshaping meno profondo.

## Reco operativa
1. **Prototipa la pipeline in locale** (QLoRA, 2080Ti) — costo 0, de-risk del codice.
2. **Full-FT Tier1 vero → A100-80GB spot** (RunPod/Vast), ~$10-55/run.
3. **In parallelo: applica a Inception** (gratis) per crediti partner (prerequisiti: incorporare + sito web).

## Incertezze: importi Inception ($10-25K vs $100K headline), pricing DGX-Lepton/Brev non pubblici, prezzi spot variabili → verificare al momento del noleggio.

## Linked: [[../training-taxonomy/training-curriculum-design]] §6.5.b · `project_training_approach_decided` (full-FT Tier1) · `project_framework_stack`
