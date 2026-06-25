---
name: 2026-05-21-base-model-pipeline
description: Pipeline progressiva di base model. Qwen3-4B locale → Qwen3-8B cloud → Qwen3.6-35B-A3B target SOTA.
type: decision
status: accepted
date: 2026-05-21
last_updated: 2026-05-21
---

# ADR 2026-05-21 — Base Model Pipeline

## Context

Hardware locale: RTX 2080 Ti 11GB VRAM (Turing, no BF16 nativo). Cloud disponibile on-demand (Vast.ai/Modal/RunPod) per scaling. Use case: agent autonomo coding versatile, multi-day, cross-codebase. Architettura: three-tier (orchestrator FT + LoRA programming + LoRA verticali). Vincolo: workflow consolidation locale prima dello scaling.

Ricerca completa landscape SLM coding 2026 in [`../concepts/slm-coding-landscape.md`](../concepts/slm-coding-landscape.md): 22 modelli valutati con benchmark, VRAM, ecosystem support.

## Decisioni

### Pipeline progressiva tre step

**Step 1 — Workflow consolidation (locale, 2080 Ti)**: `Qwen3-4B-Instruct-2507`

Razionale:
- QLoRA NF4 funziona (~3.5-5GB) → headroom enorme su 11GB
- 262K context nativo (raro per 4B) → utile per cross-codebase mini-test
- Apache 2.0
- Vocab Qwen2.5 maturo + ecosystem Unsloth/Axolotl/LLaMA-Factory 100% supportato
- LiveCodeBench v6 35.1% — non SOTA ma "non giocattolo"
- Transcript precedente cita "Qwen3-4B-Instruct-2507 fine-tuned matcha 120B+ teacher"

**Step 2 — Scaling intermedio (cloud, A100 40GB ~$1.5/h)**: `Qwen3-8B`

Razionale:
- LoRA bf16 ~6GB minimum (Unsloth) → comodo su A100 40GB
- Stessa famiglia Qwen3 del Step 1 → tokenizer 151,936, transfer adapter concettualmente naturale
- Validazione orchestrator FT serio su scale maggiore
- Dual-mode thinking nativo (toggle)
- Bridge tra mini-experiment locale e target finale

**Step 3 — Target finale produzione (cloud, H100 80GB / B200)**: `Qwen3.6-35B-A3B`

Razionale:
- State-of-the-art open-source aprile 2026 per coding
- SWE-Bench Verified **73.4%**, LiveCodeBench v6 **80.4%** — tier-1 mondiale
- 35B totali / **3B attivi** → costo inferenza ragionevole in produzione
- 262K context nativo, 1M con YaRN → multi-day agent + cross-codebase OK
- Apache 2.0
- Architettura hybrid MoE+DeltaNet+Gated Attention

Trade-off accettato: **discontinuità arch** Step 2 → Step 3 (Qwen3 dense → Qwen3.6 hybrid MoE). Adapter LoRA non transferable direttamente, ma:
- Workflow, dataset, eval methodology e training recipe si trasferiscono
- LoRA stacking pattern validato su Step 1-2 va riaffinato sul MoE arch
- Tokenizer Qwen3.6 da verificare (probabile cambio vs Qwen3 base 151,936)

## Alternative considerate

### Alt-1: Tutta-famiglia-Qwen3 (no salto a 3.6)

Step 1-2 uguali, Step 3 = `Qwen3-Coder-30B-A3B` (SWE-V 51.6%).

**Pro**: continuità tokenizer + ecosystem completo Qwen3 family, transfer LoRA più naturale.
**Contro**: -22pt SWE-Bench Verified vs Qwen3.6-35B-A3B.

**Rifiutata** perché l'utente vuole vision ambiziosa (agent versatile multi-day cross-codebase). SOTA giustifica la discontinuità.

### Alt-2: Salto a Qwen3.5 dal cloud

Step 1 = Qwen3-4B (locale), Step 2 = `Qwen3.5-9B` (cloud, +20pt LCB).

**Pro**: +20pt LiveCodeBench v6 (65.6 vs ~45 stima Qwen3-8B).
**Contro**: tokenizer cambia (vocab 248,320 vs 151,936), adapter non transferable, Qwen3.5 hybrid Gated DeltaNet → LoRA stacking + forgetting territorio meno esplorato; Unsloth sconsiglia QLoRA.

**Rifiutata** perché aggiunge rischio sul Step 2 senza beneficio strategico (Step 3 Qwen3.6 ha già SOTA).

### Alt-3: Skip locale, cloud-only

Skippare Step 1, iniziare direttamente cloud.

**Pro**: niente "cambio modello" tra mini-experiment e produzione.
**Contro**: costo subito ($150-300/mese minimo), perdi vantaggio iterazione gratis notturna.

**Rifiutata** perché utente ha esplicitamente detto "userei hw locale per primo mini esperimento".

## Conseguenze

- **Step 1 priority**: setup Unsloth + PEFT + transformers su 2080 Ti per Qwen3-4B-Instruct-2507. Validare baseline inference + training trivial LoRA prima di iniziare pipeline three-tier.
- **Step 2 preparation**: budget cloud A100 stimato ~$50-100 per training Tier 1 orchestrator + Tier 2 programming generalist. Sweep iperparametri esclusi (fanno esplodere budget).
- **Step 3 strategy**: Qwen3.6-35B-A3B richiede framework MoE-friendly (Megatron-Core, OpenRLHF, ms-swift). Stack tooling diverso da Step 1-2 (Unsloth). Da pianificare.
- **Tokenizer continuity check**: prima di iniziare Step 3, verificare se Qwen3.6 ha tokenizer Qwen3 (151,936) o nuovo. Influenza riusabilità dei dati training preparati negli Step 1-2.
- **Eval coerente cross-step**: stesso eval suite (SWE-Bench Verified subset, LiveCodeBench v6, BigCodeBench, Aider polyglot) eseguita su ogni Step → numeri confrontabili.

## Stato

`accepted` — confermato dall'utente durante grill-me 2026-05-21.

## Linked

- [Landscape modelli](../concepts/slm-coding-landscape.md) — ricerca completa che ha portato a questa decisione
- [Three-tier design](../architecture/three-tier-design.md) — architettura supportata da questa pipeline
- [Open questions](../open-questions.md) #5, #6 — chiuse da questo ADR
