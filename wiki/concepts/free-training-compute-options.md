---
name: free-training-compute-options
description: Opzioni di compute GRATUITO / a-credito per addestrare il nostro SLM (4B di test → 27B-class target). Free no-card (Kaggle/Colab/Lightning/Paperspace/HF ZeroGPU) per LoRA su modelli piccoli; programmi a-credito per il 27B (NVIDIA Inception ~$100K DGX H100, Google for Startups AI fino $350K, AWS Activate GenAI fino $300K). Ricerca web verificata luglio 2026 (regola #22).
type: reference
tags: [training, compute, gpu, funding, free-tier, nvidia, cloud-credits, reference]
last_updated: 2026-07-06
sources:
  - https://www.nvidia.com/en-us/startups/
  - https://cloud.google.com/startup/ai
  - https://aimultiple.com/free-cloud-gpu
  - https://www.thundercompute.com/blog/free-cloud-gpu-credits
  - https://grantedai.com/blog/ai-compute-grants-gpu-credits-guide
  - https://www.runpod.io/articles/guides/how-to-fine-tune-large-language-models-on-a-budget
  - https://www.kaggle.com/product-announcements/607202
---

# Compute gratuito / a-credito per il training

> Ricerca web **verificata luglio 2026** (regola #22 — i programmi cambiano, dati con fonte, non a memoria). Mappata al nostro caso: **4B = modello di test** (sta comodo nei free-tier con LoRA/QLoRA) · **27B-class = target reale** (richiede i programmi a-credito: i free-tier NON bastano di VRAM).

## Tier 1 — FREE, no carta, immediato (per il 4B di test + ablazioni piccole)

| Servizio | Hardware free | Limiti | Cosa ci fai |
|---|---|---|---|
| **Kaggle** *(migliore free-tier)* | 1× P100 16GB **o** 2× T4 (32GB combinati) + **TPU v5e-8** | ~30 GPU-h/settimana; sessione 12h GPU / 9h TPU | LoRA/QLoRA sul 4B; ablazioni; la TPU v5e-8 apre modelli più grandi |
| **Google Colab** (free) | T4 16GB | 15–30h/sett; sessione max 12h; disconnette a ~90min idle | LoRA/QLoRA su modelli ≤7–13B con gradient-checkpointing |
| **Lightning AI · Paperspace Gradient · HF ZeroGPU · Saturn Cloud · Intel Tiber AI Cloud** | free tier, no carta | vari | capacità extra per dev/inferenza/LoRA piccola |

⚠️ **Limite duro**: i free-tier hanno 16–32GB VRAM → NIENTE full-FT del 27B (solo LoRA su piccoli, QLoRA borderline). Il **27B reale** ha bisogno del Tier 2.

## Tier 2 — Programmi a-CREDITO (per il 27B target) — il percorso migliore per NOI

| Programma | Cosa dà | Eleggibilità (⚠️ da verificare) |
|---|---|---|
| **NVIDIA Inception** *(reco #1 — barra più bassa per noi)* | fino a **$100K DGX Cloud credits (H100)** + fino $100K AWS credits + preferred GPU pricing + training gratis; **nessuna fee/deadline/cohort**, applicazioni tutto l'anno | startup **incorporata** + sito web + sviluppo attivo + **<10 anni**. Rete di 40K+ aziende. NON serve faculty né VC. |
| **Google for Startups Cloud — AI tier** | fino a **$350K** credits (H100 / A3 Ultra / TPU v5e) — il più generoso | AI-first startup, **VC-backed fino a Series A** (esistono tier più bassi $2K–$350K con requisiti più leggeri) |
| **AWS Activate — Generative AI** | fino a **$300K** credits | startup AI qualificata |

## Tier 3 — Ricerca / accademico / pubblico

- **NVIDIA Academic Grant Program**: compute per ricercatori — MA richiede **faculty full-time in un'istituzione accreditata che rilascia PhD** → **noi NON qualifichiamo** (founder solo, non faculty).
- **NAIRR · NSF ACCESS · DOE** (USA): grant di GPU-time pubblici, orientati alla ricerca US → verificare fit per un founder non-US.

## Raccomandazione per NOI (mappata a [[../../MEMORY|project_test_model_vs_target]])

1. **ADESSO (gratis, subito)**: **Kaggle** come banco principale (2×T4 / TPU v5e-8, 30h/sett) + Colab di riserva → coprono LoRA/QLoRA sul **4B di test** e le ablazioni. Zero costo, zero carta.
2. **Per il 27B target**: applicare a **NVIDIA Inception** (gratis, ~$100K DGX H100 — barra bassa: basta incorporazione + sito + <10 anni) + valutare **Google for Startups AI** e **AWS Activate GenAI** per credit aggiuntivi.
3. **⚠️ Verificare l'eleggibilità (regola #22, non assumere)**: siamo **incorporati**? Abbiamo un **sito**? Siamo **VC-backed**? Questi gate decidono l'accesso ai programmi grossi. Inception ha la barra più bassa → primo da provare.

**Onestà**: i free-tier senza carta (16–32GB) **non** addestrano il 27B in full-FT — solo LoRA su piccoli / QLoRA borderline. Il training del 27B **richiede** i programmi a-credito (Inception DGX / cloud credits). Piano realistico: **free-tier per il 4B + dev · programmi-credito per il 27B**.

## Strategia operativa — Kaggle definisce la procedura, Inception scala (decisa 2026-07-06, msg 1247)

**Decisione utente**: sviluppare e validare l'INTERA procedura di training su **Kaggle** col **modello più grande addestrabile lì**, poi — a procedura definita — scalare al **27B su NVIDIA Inception**.

**Capacità Kaggle reale (verificata):**
- QLoRA **4B** ≈ 15GB VRAM → sta su **1 sola T4**.
- **7B** 4-bit → comodo su T4 16GB.
- **13–14B** QLoRA → ci sta con **quantizzazione aggressiva + gestione attenta VRAM/RAM** su 2×T4 (32GB).
- **Pratico più grande**: ~**14B in QLoRA** (7–9B = margine comodo). La TPU v5e-8 può spingere oltre ma con più engineering (JAX/PyTorch-XLA).
- → **Target Kaggle: 9B QLoRA** (comodo, rappresentativo), con **14B come stretch**.

**⚠️ Caveat ONESTO (critica oggettiva [[../feedback_objective_critique]]):**
- Su Kaggle si fa **QLoRA/LoRA**, NON **full-FT**. Il nostro Tier-1 è deciso **full-FT** ([[../../MEMORY|project_training_approach_decided]] Default D) → su Kaggle il Tier-1 si può solo **prototipare in QLoRA** per DEFINIRE la procedura (dati, curriculum, eval, decontaminazione, harness-integration, LoRA-stacking Tier 2/3), NON per il training finale.
- **Dinamiche full-FT ≠ QLoRA** (LR, capacità, catastrophic-forgetting [[catastrophic-forgetting]]) → gli iperparametri vanno **ri-tarati a scala** su Inception. Kaggle valida la **PIPELINE**, non i valori finali del full-FT.
- **Limiti sessione** (30h/sett, 12h/sessione) → il dataset pieno (~30K) richiede **checkpoint + resume** multi-sessione.

**Cosa Kaggle valida end-to-end (quota-free, subito):** l'intera pipeline dati→SFT→post-training→eval + l'harness-integration + il LoRA-stacking Tier 2/3 (che SONO LoRA) + un Tier-1-QLoRA proxy. **Cosa resta a Inception:** il full-FT reale di Tier-1 + il 27B target.

**Prossimo passo concreto** ("verifica cosa riusciamo a fare", msg 1247): un **dry-run QLoRA 9B su Kaggle** (1 epoca, dataset-campione) per misurare tempi/memoria/feasibility reali PRIMA di committare la procedura.

## Links
[[training-vs-harness-classification]] · [[../training-taxonomy/data-volume-estimate]] · [[../feedback_optimization_first]]
