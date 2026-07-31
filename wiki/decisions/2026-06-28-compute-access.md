---
name: 2026-06-28-compute-access
description: Come accedere al compute per il full-FT/RL del Tier1 (4B). Finding NVIDIA: nessun compute gratuito self-serve per startup commerciale; via pratica = A100-80GB spot a ore (~$10-55/run). Inception worth-apply. QLoRA≠full-FT. Richiesta utente msg 266.
type: adr
tags: [compute, hardware, nvidia, training, budget, full-ft]
sources: [user msg 2026-06-28 (266), research-agent (fonti ufficiali NVIDIA), project_training_approach_decided]
last_updated: 2026-07-31
status: informational — nessuna decisione BLOCCANTE; ⚠️ cifre tarate su un 4B, non sul target 27B
---

# Compute access — full-FT/RL Tier1 (4B)

> Richiesta utente msg 266 ("verifica se il full training possiamo farlo con piattaforme NVIDIA"). Ricerca agente alle fonti ufficiali. **Non consulenza.**

> ## 📌 Stato reale — riletto il 2026-07-31
>
> Questo file diceva `awaiting scelta utente` da **33 giorni** senza dire *quale* scelta. Riletto: **non c'è nessuna decisione bloccante in attesa.** È una **ricerca** con una reco che regge. Cosa è cosa:
>
> - **Nulla da decidere per procedere**: prototipare in locale con QLoRA sulla 2080 Ti costa zero ed è la prima riga della reco. Non serve alcun via libera.
> - **Unico ramo che dipende davvero da te, e NON è sul percorso critico**: applicare a **NVIDIA Inception**. Richiede un'entità **incorporata** + un **sito web** — cioè una scelta d'impresa, non tecnica. Finché non ci sono, la domanda non è nemmeno ponibile. *(Non serve risposta ora: se e quando incorpori, si riapre.)*
>
> ## 🔴 Caveat che vale più dello status — le cifre sono di un'altra taglia
>
> Tutti i numeri qui sotto (**1× A100-80GB, ~$10-55/run, <$300-500 per 5-10 run**) sono calcolati su un **Tier-1 da 4B**. Il target dichiarato è passato a **classe 27B** *(memory `project_test_model_vs_target`: il modello piccolo è test-only, il target è 27B)*.
>
> Un full-FT di un 27B **non entra** in quel profilo: gli stati dell'ottimizzatore da soli eccedono una singola A100-80GB, quindi servono **più GPU + sharding** (ZeRO-3/FSDP) oppure si rinuncia al full-FT. **L'ordine di grandezza cambia, non il decimale.**
>
> → **Da rifare prima di impegnare soldi**: il preventivo sulla taglia vera. **Non l'ho rifatto** — lo dichiaro invece di lasciare in giro cifre che sembrano ancora valide. *(Tracciato in [[todo]].)*

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
