---
name: lora-sizing-methodology
description: Metodologia per dimensionare LoRA — formula rank/dataset/eval, checklist verifiche, esempi concreti per il progetto.
type: concept
tags: [concept, lora, sizing, methodology, peft, training-recipe, checklist, hyperparameter]
sources: [user requirement 2026-05-21, DoRA + LoRA+ + RsLoRA papers, Unsloth docs, Hu et al. 2021 LoRA original]
last_updated: 2026-05-21
---

# LoRA Sizing Methodology

## Trigger utente (2026-05-21)

> "Io direi che la grandezza dipenda da:
> - grandezza del modello e capacità di memorizzazione
> - training set e benchmark che abbiamo a disposizione + verifica compatibilità tra training set + test e benchmark"
>
> "Inoltre salva tutto questo compreso le raccomandazioni e cose da controllare, come appunto dimensione del modello, esempi, rank ecc"

## Principio guida

La dimensione di un LoRA (rank, alpha, target modules, # trainable params) **NON è arbitraria**. Va calcolata partendo da:

1. **Capacità del base model** (params, hidden dim, num layers)
2. **Dataset realisticamente disponibile** (sample count, quality, diversity)
3. **Target eval/benchmark** (cosa testiamo + complexity)
4. **Vincoli hardware** (VRAM, training time budget)
5. **Vincoli architetturali progetto-specifici** (es. self-contained vs Tier 2 sopra)

Errori comuni:
- Rank troppo basso → si butta via capacity del base model, LoRA underperforma
- Rank troppo alto → overfitting su dataset piccolo, gradient instabili
- Mismatch training/eval framework versions → score sgonfiati irrealisticamente
- No decontamination → score inflated da data leak

## Formula di sizing (heuristic, da calibrare empiricamente)

### Step 1 — Capacity ratio del base model

Sweet spot rank LoRA in funzione del base model:

| Base model | Sweet spot rank | Note |
|---|---|---|
| Qwen3-0.6B / 1.7B | 8-16 | Capacity bassa, rank alto = overfit |
| Qwen3-4B | **32-64** | Sweet spot ampio, dipende dal task |
| Qwen3-8B / 14B | 64-128 | Più capacity → più rank utile |
| Qwen3-30B-A3B+ | 128-256 | Capacity grande, MoE complicato |

Formula approssimativa: `rank_sweet_spot ≈ sqrt(base_params_in_M / 4)`.

### Step 2 — Dataset → rank scaling

Rank deve essere **commisurato** al dataset:

| Dataset size | Rank consigliato | Rationale |
|---|---|---|
| < 1K sample | 4-8 | Troppo piccolo per saturare LoRA grande |
| 1K-10K | 8-16 | Limited capacity, no overfit risk |
| 10K-30K | 16-32 | Standard fine-tuning |
| 30K-100K | 32-64 | Sweet spot ROI |
| 100K-500K | 64-128 | Capacity necessaria per cover diversità |
| > 500K | 128-256 | Solo se base model grande |

Formula approssimativa: `rank ≈ log2(dataset_size) × 2` (clamp by sweet spot del base).

### Step 3 — Self-contained adjustment

Se LoRA deve essere **self-contained** (no Tier sopra che fornisce knowledge generic):
- +30-50% capacity → rank +30%
- Es.: LoRA Tier 3 frontend MVP v1 senza Tier 2 → rank 64 invece di 48

### Step 4 — Eval target adjustment

Eval più complessi richiedono più capacity:

| Eval complexity | Esempi | Rank adjustment |
|---|---|---|
| Bassa | HumanEval, MBPP (single-function task) | 0 |
| Media | LiveCodeBench, BigCodeBench | +25% |
| Alta | SWE-Bench Verified, Aider polyglot, AgentBench | +50% |

### Step 5 — Alpha calibration

Standard: `alpha = 2 × rank` (DoRA paper conferma).

Per Qwen3-4B con rank 64 → alpha 128.

### Step 6 — Target modules

Sempre **all-linear** per LoRA su transformer modern:
`q_proj, k_proj, v_proj, o_proj, gate_proj, up_proj, down_proj`

NON solo q_proj/v_proj (vecchio approccio Hu 2021 — superato).

### Step 7 — VRAM check

Formula VRAM training QLoRA NF4 (approssimativa, Unsloth):

```
VRAM = base_model_Q4 + (rank × params_modificati / 1000) + activation_overhead

# Per Qwen3-4B QLoRA r=64:
# Base Q4: ~2.5GB
# LoRA params: ~50M (rank 64 × all-linear)
# Activation: ~2-3GB (seq_len 4K, batch 1)
# Total: ~5-6GB
```

**Per il nostro caso (2080 Ti 11GB)**: r=64 lascia ~5GB margine. r=128 sarebbe tight. r=256 OOM.

## Stack PEFT raccomandato (Wave 2 SOTA)

Sempre stackare 3 tecniche per max efficiency:

### 1. DoRA (Liu 2024) — [[../entities/dora-paper]]

Decomposizione weight in magnitude + direction. Drop-in replacement di LoRA standard.
- Improvement tipico: +2-4% accuracy vs LoRA standard
- Costo extra: ~5% memoria, ~10% training time
- Implementation: PEFT `use_dora=True`

### 2. LoRA+ (Hayou 2024) — [[../entities/lora-plus-paper]]

Learning rate ratio λ tra matrici A e B:
- LR matrice A = base_lr (es. 2e-4)
- LR matrice B = λ × base_lr (con λ ≫ 1, tipicamente 10-20)
- Speedup: ~2× convergenza vs uniform LR
- Implementation: optimizer custom (param_groups separati per A e B)

### 3. RsLoRA (Kalajdzievski 2023) — [[../entities/rslora-paper]]

Rank-stabilized scaling: `scaling = alpha / sqrt(rank)` invece di `alpha / rank` standard.
- Previene gradient collapse a rank alto (≥32)
- Permette rank 64+ stabile
- Implementation: PEFT `use_rslora=True`

**Stack combinato**: tutti e 3 contemporaneamente — sono ortogonali, non si annullano.

## Checklist verifiche pre-training (CRITICAL)

Da eseguire **prima** di lanciare il training, non dopo.

### A — Capacity check

- [ ] Rank scelto è in sweet spot per il base model? (Tabella Step 1)
- [ ] Dataset size giustifica il rank? (Tabella Step 2)
- [ ] Alpha = 2 × rank?
- [ ] Target all-linear (non solo q_proj/v_proj)?

### B — Dataset quality check

- [ ] Sample count effettivo conta solo sample validi (post-deduplication)?
- [ ] Distribuzione bilanciata cross-categoria?
  - Es. frontend LoRA: ~10K React + ~10K Vue + ~10K Next bilanciati
  - NON: ~25K React + ~3K Vue + ~2K Next sbilanciato
- [ ] Code samples eseguibili (validati con runtime)?
- [ ] Format consistente (chat template uniforme)?

### C — Decontamination check (PREVIENE LEAK)

- [ ] Decontamination MinHash su training set vs ogni eval benchmark
- [ ] Overlap < 1% per essere safe
- [ ] Documentare overlap exactly per audit (paper futuro)
- [ ] Tool consigliato: `bigcode-evaluation-harness` decontaminator

### D — Eval compatibility check

- [ ] Framework versions training ↔ eval allineati?
  - Es. training su React 18+ → eval su React 18+
  - Mismatch: training React 17 + eval React 19 = score sgonfiati
- [ ] Eval set NON è subset/superset di training (verifica esplicita)
- [ ] Eval coverage spans subset realistici del dominio
- [ ] Eval automatic vs manual: chi assegna i punti?

### E — Hardware check

- [ ] VRAM target con margine ≥20% (no OOM in spike)
- [ ] Seq_len realistic (no 32K se 2K basta — sprechi VRAM)
- [ ] Batch + grad_accum bilanciati per stabilità
- [ ] Mixed precision adatta a GPU (FP16 su Turing, BF16 su Ampere+)

### F — Hyperparameter sanity check

- [ ] Learning rate base in range 1e-4 → 5e-4 (QLoRA standard)
- [ ] LoRA+ λ ratio tested (default 15, range 10-20)
- [ ] Warmup ratio 0.03-0.1
- [ ] Epochs: 1-3 (rarely > 3 per LoRA, rischio overfit)
- [ ] Early stopping su validation loss

## Esempio concreto — MVP v1 LoRA Tier 3 frontend

Applicazione completa della metodologia al caso reale:

### Vincoli

- Base: Qwen3-4B-Instruct-2507 (~3.4B params non-embedding)
- Hardware: RTX 2080 Ti 11GB (Turing, no BF16 native)
- Self-contained: sì (skip Tier 2 in MVP v1)
- Eval target: LiveCodeBench frontend + 200 custom + SWE-Bench Lite frontend (eval medium-high complexity)

### Calcolo rank

1. Sweet spot Qwen3-4B: 32-64
2. Dataset target ~30K → rank base 32
3. Self-contained adjustment: +30% → 32 × 1.3 ≈ 42 → arrotondo 64 (potenza 2 più vicina up)
4. Eval medium-high: +25-50% → conferma rank 64

**Decisione**: rank 64.

### Calcolo alpha

`alpha = 2 × rank = 128`.

### Target modules

`q_proj, k_proj, v_proj, o_proj, gate_proj, up_proj, down_proj` (all-linear).

### Stack PEFT

DoRA enabled + LoRA+ (λ=15) + RsLoRA — tutti e 3 stackati.

### VRAM check

- Base Q4: ~2.5 GB
- LoRA params r=64 all-linear: ~50M params trainable → ~0.4 GB
- Activation (seq_len 4K, batch 1): ~2-3 GB
- Optimizer state (AdamW with CPU offload): ~0.5 GB (offloaded)
- **Total: ~5-6 GB** → margine ~5 GB su 11 GB ✓

### Dataset prep checklist

- [ ] ~30K sample mix React/Next/Vue/TS/CSS bilanciati
- [ ] Sources: The Stack v2 filtered + OSS-Instruct + Magicoder + framework docs
- [ ] Quality filter: code execution success per snippet eseguibili
- [ ] Deduplication MinHash
- [ ] Decontamination vs LiveCodeBench v6 frontend + SWE-Bench Lite frontend issues + custom eval
- [ ] Chat format consistente (Qwen3 chat template)
- [ ] Framework versions: React 18+ / Vue 3+ / Next 14+ / TS 5+

### Hyperparameter

- Learning rate: 2e-4 (base, matrice A) / 3e-3 (matrice B con LoRA+ λ=15)
- Warmup ratio: 0.05
- Epochs: 2 (con early stopping su val loss)
- Batch effective: 16 (batch 2 × grad_accum 8)
- Seq len: 4096
- Optimizer: AdamW 8-bit (bitsandbytes)

### Eval threshold

- LiveCodeBench frontend: baseline (Qwen3-4B vanilla) + 5% pass@1
- 200 custom frontend tasks: ≥ 60% pass (baseline ~40%)
- SWE-Bench Lite frontend issues: ≥ 5% resolved (baseline 0-2%)

## Generalizzazione ad altri verticali

Stessa metodologia si applica a Backend-Python, Backend-TS, ecc. Aggiusta:

| Verticale | Dataset stimato | Rank | Note |
|---|---|---|---|
| Frontend | 30K | 64 | MVP v1 |
| Backend Python | 40K (più OSS) | 64 | Wave 6+ |
| Backend TS/Node | 25K | 48-64 | Wave 6+ |
| Data | 15K | 32-48 | Wave 7 |
| DevOps | 10K | 32 | Wave 7, dataset più piccolo |

Tutti con stack PEFT triplo + checklist completa.

## Open questions sul sizing

- Quando MVP v1 + MVP v2 confrontati, quale rank Tier 2 generalist? (Probably 64-128 — più capacity per "ponte semantico")
- Quando Step 2 cloud Qwen3-8B, scale rank verticali a 128? (Sì per dataset 50K+)
- Step 3 Qwen3.6-35B-A3B MoE: LoRA su MoE è territorio sperimentale — rank diverso per layer experts vs shared?

## Link interni

- [[runtime-symbol-randomization-training]] — il dataset frontend verrà generato con regime random
- [[../entities/dora-paper]], [[../entities/lora-plus-paper]], [[../entities/rslora-paper]] — papers PEFT stack
- [[lora-stacking]] — composition-aware training quando Tier 2 + Tier 3 attivi
- [[../decisions/2026-05-21-base-model-pipeline]] — base model evolution
- [[../decisions/2026-05-21-training-philosophy-roadmap]] — Wave 5+

## Sources

- Hu et al. 2021 "LoRA: Low-Rank Adaptation of Large Language Models" arXiv 2106.09685 — paper originale
- DoRA paper (Liu 2024) — arXiv 2402.09353
- LoRA+ paper (Hayou 2024) — arXiv 2402.12354
- RsLoRA paper (Kalajdzievski 2023) — arXiv 2312.03732
- Unsloth documentation (Qwen3 fine-tuning recipes)
- Anthropic best practices fine-tuning
- User requirement 2026-05-21 grill-me discussion
