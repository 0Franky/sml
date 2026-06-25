---
name: slm-coding-landscape
description: Comparative landscape of coding-friendly Small Language Models 1B-30B for fine-tuning base selection (RTX 2080 Ti 11GB constraint).
type: concept
tags: [concept, models, slm, coding, base-selection, qwen3, qwen35, deepseek, mistral, granite, hardware]
sources:
  - https://huggingface.co/Qwen/Qwen3-Coder-30B-A3B-Instruct
  - https://huggingface.co/Qwen/Qwen3-8B
  - https://huggingface.co/Qwen/Qwen3-14B
  - https://huggingface.co/Qwen/Qwen3-4B-Instruct-2507
  - https://huggingface.co/Qwen/Qwen3.5-9B
  - https://huggingface.co/Qwen/Qwen3.5-4B
  - https://huggingface.co/Qwen/Qwen3.6-35B-A3B
  - https://unsloth.ai/docs/get-started/fine-tuning-for-beginners/unsloth-requirements
  - https://unsloth.ai/docs/models/qwen3.5/fine-tune
  - https://unsloth.ai/docs/models/qwen3-coder-next
  - https://qwenlm.github.io/blog/qwen3-coder/
  - https://huggingface.co/deepseek-ai/DeepSeek-Coder-V2-Lite-Instruct
  - https://huggingface.co/bigcode/starcoder2-15b
  - https://huggingface.co/ibm-granite/granite-8b-code-instruct-4k
  - https://huggingface.co/mistralai/Codestral-22B-v0.1
  - https://www.latent.space/p/ainews-top-local-models-list-april
  - https://artificialanalysis.ai/articles/qwen3-5-small-models
  - https://www.marktechpost.com/2026/03/02/alibaba-just-released-qwen-3-5-small-models-a-family-of-0-8b-to-9b-parameters-built-for-on-device-applications/
last_updated: 2026-05-21
---

# SLM Coding Models Landscape — 2026-05-21

Confronto SLM 1B-30B per scelta base model di fine-tuning. Hardware target: **RTX 2080 Ti 11GB VRAM** (Turing, no BF16 nativo, FP16 ok, no FlashAttention-2 ottimale).

> **Nota Turing-2080Ti**: niente BF16 nativo → forziamo FP16 mixed-precision. Unsloth supporta Turing ma con limitazioni (no Flash-Attn 2 full speed). QLoRA NF4 ok. Considerare instabilità FP16 con loss scaling.

---

## Summary Table

Legenda colonne: SWE-V = SWE-Bench Verified %, LCB = LiveCodeBench v5/v6 %, Q4-Inf = VRAM inferenza Q4_K_M (GGUF), QLoRA-Tr = VRAM training QLoRA 4-bit (numeri Unsloth, "absolute minimum" — aggiungere ~30-50% per gradient accum / seq_len 2048+).

| Model | Params (tot/act) | Context | Arch | SWE-V | LCB | HumanEval+ | Q4-Inf | QLoRA-Tr | Unsloth | 2080Ti Train | Licenza |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Qwen3-0.6B | 0.6B dense | 32K (YaRN→128K) | GQA dense | n/a | n/a | n/a | ~0.5GB | ~2GB | yes | yes (trivial) | Apache 2.0 |
| Qwen3-1.7B | 1.7B dense | 32K (YaRN→128K) | GQA dense | n/a | stima ~20% | n/a | ~1.2GB | ~2.5GB | yes | yes (easy) | Apache 2.0 |
| Qwen3-4B-Instruct-2507 | 4B dense | **262K native** | GQA dense, 36L | non trovato | **35.1** | non trovato | ~2.5GB | ~3.5GB | yes (full) | **yes** (sweet spot) | Apache 2.0 |
| Qwen3-8B | 8.2B dense | 32K (YaRN→128K) | GQA dense, 36L | non trovato | stima 40-45 | non trovato | ~5GB | ~6GB | yes (full) | **yes** (tight, seq<2K) | Apache 2.0 |
| Qwen3-14B | 14.8B dense | 32K (YaRN→128K) | GQA dense, 40L | non trovato | stima 50-55 | non trovato | ~8.5GB | 8.5GB | yes (full) | **marginale** (no headroom) | Apache 2.0 |
| Qwen3-30B-A3B-Instruct-2507 | 30.5B/3.3B MoE | 262K | MoE 128/8 GQA | non trovato | stima ~60 | non trovato | ~18GB | ~22GB | yes | **no** (MoE >11GB anche Q4) | Apache 2.0 |
| Qwen3-Coder-30B-A3B | 30.5B/3.3B MoE | **256K (1M YaRN)** | MoE 128/8 GQA, 48L | **51.6** (OpenHands) / **54.2** (TTS) | non trovato | n/a | ~18GB | ~22GB | yes | **no** | Apache 2.0 |
| Qwen3-Coder-Next-80B-A3B | 80B/3B MoE | 256K | hybrid MoE+linear | **70.6** | non trovato | n/a | ~46GB | B200 only | yes | **no** | Apache 2.0 |
| Qwen3.5-0.8B | 0.8B dense+linear | **262K native** | hybrid DeltaNet+GA | n/a | n/a | n/a | ~0.6GB | ~3GB (LoRA bf16) | yes | yes (LoRA only) | Apache 2.0 |
| Qwen3.5-2B | 2B dense+linear | **262K native** | hybrid DeltaNet+GA | n/a | n/a | n/a | ~1.5GB | ~5GB (LoRA bf16) | yes | yes (LoRA only) | Apache 2.0 |
| Qwen3.5-4B | 4B dense+linear | **262K native** | hybrid DeltaNet+GA, 32L | non trovato | **55.8** (v6) | non trovato | ~3GB | **10GB** (LoRA bf16) | yes (no QLoRA) | **marginale** (10/11, FP16 forzato) | Apache 2.0 |
| Qwen3.5-9B | 9B dense+linear | **262K native** | hybrid DeltaNet+GA, 32L | non trovato | **65.6** (v6) | non trovato | ~6GB | **22GB** (LoRA bf16) | yes (no QLoRA) | **no** (>11GB anche con tricks) | Apache 2.0 |
| Qwen3.6-35B-A3B | 35B/3B MoE | 262K (1M YaRN) | hybrid MoE+DeltaNet+GA, 40L | **73.4** | **80.4** (v6) | n/a | ~22GB | ~74GB (LoRA bf16) | yes | **no** | Apache 2.0 |
| DeepSeek-Coder-V2-Lite-Instruct | 16B/2.4B MoE | 128K | DeepSeekMoE | non trovato | stima ~30 | stima ~80 | ~10GB | ~14GB | yes | **marginale/no** (Q4 quasi-cap, train no) | DeepSeek License (commercial ok) |
| DeepSeek-Coder-6.7B | 6.7B dense | 16K | LLaMA-arch | non trovato | non trovato | 78.6 (HE+) | ~4GB | ~5GB | yes | yes (easy) | DeepSeek License |
| Codestral-22B-v0.1 | 22B dense | 32K | dense Mistral | non trovato | non trovato | ~81 (HE) | ~13GB | ~22GB | yes | **no** | **MNPL** (non-production only!) |
| Codestral-Mamba-7B | 7.3B dense | 256K | Mamba SSM | non trovato | non trovato | 81.1 (HE) | ~4.5GB | ~6GB | parziale (SSM) | yes (tight) | Apache 2.0 |
| StarCoder2-3B | 3B dense | 16K (SWA 4K) | GQA+SWA | n/a | n/a | 27.4 (HE+) | ~2GB | ~3.5GB | yes | yes | BigCode OpenRAIL-M |
| StarCoder2-7B | 7B dense | 16K (SWA 4K) | GQA+SWA | n/a | n/a | ~30 (HE+) | ~4GB | ~5GB | yes | yes | BigCode OpenRAIL-M |
| StarCoder2-15B | 15B dense | 16K (SWA 4K) | GQA+SWA | n/a | n/a | **37.8** (HE+) | ~9GB | ~8.5GB | yes | **marginale** | BigCode OpenRAIL-M |
| granite-3b-code-instruct-2k | 3B dense | 2K | dense (deprecato) | n/a | n/a | ~52 (HE py) | ~2GB | ~3.5GB | yes | yes | Apache 2.0 |
| granite-8b-code-instruct-4k | 8B dense | 4K | dense (deprecato) | n/a | n/a | **57.9** (HE py) | ~5GB | ~6GB | yes | yes (tight) | Apache 2.0 |
| granite-20b-code-instruct | 20B dense | 8K | dense (deprecato) | n/a | n/a | ~60 (HE py) | ~12GB | ~12GB | yes | **no** | Apache 2.0 |
| granite-34b-code-instruct | 34B dense | 8K | dense (deprecato) | n/a | n/a | ~62 (HE py) | ~20GB | ~26GB | yes | **no** | Apache 2.0 |

**Numeri Unsloth VRAM table** (fonte ufficiale, "absolute minimum"): 3B→3.5GB QLoRA / 8GB LoRA, 7B→5GB / 19GB, 8B→6GB / 22GB, 9B→6.5GB / 24GB, 14B→8.5GB / 33GB, 27B→22GB / 64GB, 32B→26GB / 76GB. ([unsloth-requirements](https://unsloth.ai/docs/get-started/fine-tuning-for-beginners/unsloth-requirements))

> Per **Qwen3.5**, Unsloth raccomanda **bf16 LoRA, NON QLoRA** ("higher than normal quantization differences"). Tabella Qwen3.5 specifica: 4B→10GB LoRA bf16, 9B→22GB LoRA bf16. ([qwen3.5/fine-tune](https://unsloth.ai/docs/models/qwen3.5/fine-tune))

---

## Detailed model cards

### Qwen3-4B-Instruct-2507 — CANDIDATO #1 per 2080 Ti

- **Release**: 2025-05-14 (Qwen3 Tech Report arXiv:2505.09388), variant 2507 = update Jul 2025
- **Params**: 4.0B totali, 3.6B non-embedding
- **Arch**: dense, 36 layer, GQA (32 Q / 8 KV), head_dim 128, hidden 2560, intermediate 9728, vocab 151936, **tied embeddings**, RoPE θ=1e6
- **Context**: **262,144 nativo** (raro in dense piccoli!) — non serve YaRN
- **Benchmark**: LiveCodeBench v6 **35.1%**, MultiPL-E 76.8%, Aider-Polyglot 12.9, MMLU-Pro 69.6, AIME25 47.4
- **Non-thinking mode only** (variant 2507)
- **VRAM**: Q4 inf ~2.5GB, QLoRA train ~3.5-5GB → enorme headroom su 2080 Ti
- **Unsloth**: full support, QLoRA NF4 ok (modello Qwen3, non Qwen3.5)
- **Verdict 2080 Ti**: ✅ **ottimale per workflow consolidation**. Headroom per seq_len 4-8K, gradient accum 4+, batch effettivo decente.

### Qwen3-8B — CANDIDATO #2 (tight)

- **Release**: 2025-05-14
- **Params**: 8.2B totali, 6.95B non-embedding
- **Arch**: dense, 36 layer, GQA (32 Q / 8 KV), head_dim 128, hidden 4096, intermediate 12288, vocab 151936, **NOT tied**, RoPE θ=1e6, no SWA
- **Context**: 32K nativo, YaRN→131K
- **Benchmark**: dati specifici coding non trovati su model card; tech report cita "surpasses Qwen2.5-Instruct"
- **Dual-mode thinking** (toggle via prompt)
- **VRAM**: Q4 inf ~5GB, QLoRA train ~6GB minimum (Unsloth) → **headroom limitato** su 11GB con seq_len >2K e gradient accum
- **Verdict 2080 Ti**: ⚠️ **marginale ma fattibile**: bs=1, seq_len ≤2048, grad_accum 8-16. Niente FlashAttn-2 su Turing peggiora throughput. Va testato.

### Qwen3-14B — TROPPO GRANDE per 2080 Ti

- 14.8B dense, 40 layer, GQA 40/8
- Context 32K+YaRN
- QLoRA min 8.5GB (Unsloth) ma con seq_len realistico e activations sale a 12-14GB → **OOM probabile**
- Adatto per cloud A100/H100 next step.

### Qwen3.5-4B — OTTIMA ALTERNATIVA, ma occhio QLoRA

- **Release**: 2026-03-05 (Qwen3.5 Small Models family)
- **Params**: 4B
- **Arch**: **hybrid Gated DeltaNet + sparse MoE/Gated Attention**, 32 layer
  - Pattern: `8 × (3 × (DeltaNet → FFN) + 1 × (GatedAttn → FFN))`
  - DeltaNet linear attention: 32 V heads / 16 QK heads, head_dim 128
  - Gated Attention full: 16 Q / 4 KV, head_dim 256, RoPE dim 64
  - FFN intermediate 9216, hidden 2560
  - **Vocab 248,320** (vs 151,936 Qwen3) → tokenizer più ricco (201 lingue)
  - **RoPE θ = 1e7** (vs 1e6 Qwen3)
- **Context**: **262K nativo**, YaRN→1.01M
- **Multimodal nativo** (vision encoder incluso)
- **Benchmark**: LiveCodeBench v6 **55.8%** (+20.7pt vs Qwen3-4B!), OJBench 24.1, MMMU-Pro 65.4
- **VRAM**: Unsloth richiede **bf16 LoRA, NO QLoRA** → 10GB minimum. **Problema su 2080 Ti**: Turing **no bf16 nativo** → forzato FP16, possibile instabilità.
- **Verdict 2080 Ti**: ⚠️ **marginale**: 10GB su 11GB lascia ~1GB → bs=1, seq_len ≤2K, no headroom. **FP16 fallback rischioso** per modelli con linear attention (gating instabile). Non raccomandato per workflow consolidation iniziale.

### Qwen3.5-9B — TROPPO GRANDE su 2080 Ti

- 9B, hybrid DeltaNet+MoE, 32 layer, hidden 4096, head_dim 256
- LiveCodeBench v6 **65.6%** — best in <10B class
- LoRA bf16 22GB richiesti → **fuori scope locale**, perfetto per cloud step 2.

### Qwen3-Coder-30B-A3B-Instruct — TARGET FUTURO MoE

- **Release**: 2025-07-31
- **Params**: 30.5B totali, **3.3B attivi** (MoE 128 experts, 8 routed/token)
- **Arch**: MoE, 48 layer, GQA (32 Q / 4 KV), head_dim 128, hidden 2048, moe_intermediate 768
- **Context**: 256K nativo, 1M con YaRN
- **Benchmark**: SWE-Bench Verified **51.6%** (OpenHands 100 turns), **54.2%** (TTS rubrics)
- **Non-thinking only**
- **VRAM**: Q4 ~18GB inf, ~22GB QLoRA train → solo cloud
- **Verdict**: target finale "modello grande" post-cloud scaling. MoE 3B attivi = inferenza veloce ma full weights ~22GB anche Q4.

### Qwen3.6-35B-A3B — STATE OF THE ART aprile 2026

- **Release**: 2026-04 circa
- **Params**: 35B / 3B attivi, MoE 256 experts (8 routed + 1 shared)
- **Arch**: hybrid MoE + Gated DeltaNet + Gated Attention, 40 layer, hidden 2048
- **Context**: 262K nativo, 1.01M YaRN
- **Benchmark**: **SWE-Bench Verified 73.4%**, **LiveCodeBench v6 80.4%**, SWE-bench Pro 49.5, Terminal-Bench 2.0 51.5
- **Verdict**: candidato top per "modello target finale" cloud-scale. Inferenza locale OK con Q4 + offload, training solo cloud H100/B200.

### DeepSeek-Coder-V2-Lite-Instruct

- 16B/2.4B MoE, DeepSeekMoE, context 128K, 338 lingue
- License DeepSeek (commercial allowed ma non Apache)
- Inferenza tight su 11GB Q4 (~10GB) — training **no** locale
- Benchmark specifici 2026 non trovati; vecchio (2024), superato da Qwen3-Coder

### Codestral-22B-v0.1

- 22B dense, 32K context, 80+ linguaggi
- **License MNPL (Mistral Non-Production License)** → **non utilizzabile per prodotto commerciale**. Solo research.
- HumanEval ~81% (saturo)
- Training su 2080 Ti **impossibile**, inferenza solo Q4 tight
- **SCARTATO** per vincolo licenza.

### Codestral-Mamba-7B

- 7.3B Mamba SSM, Apache 2.0, 256K context, HumanEval 81.1%
- Unsloth supporto **parziale** (Mamba kernels diversi)
- Curiosità interessante (long-context efficient) ma ecosistema LoRA-on-Mamba meno maturo
- **Scartato** per workflow consolidation: troppo divergente dall'ecosistema transformer mainstream.

### StarCoder2-15B

- 15B dense, GQA + sliding window (4K), context 16K
- HumanEval+ 37.8% — superato da Qwen3-4B su benchmark moderni
- License BigCode OpenRAIL-M (permissive ma con attribution constraints)
- Coding-only (no generalist) → meno utile per orchestrator agent
- **Scartato**: 2024 model, ormai legacy.

### granite-code (IBM) 3B/8B/20B/34B

- Apache 2.0, family completa
- Card 8B segna **"Not recommended for new projects — use latest Granite mainline"**
- HumanEval Python 57.9% (8B) ma context 4K-8K solo
- **Scartato**: deprecato dal vendor; IBM Granite 4.1 (mainline) è il successore ma è meno coding-focused.

---

## Qwen3 vs Qwen3.5 — Confronto architetturale dettagliato

### Tabella architettura (ground truth: HuggingFace config.json)

| Param | Qwen3-4B | Qwen3-8B | Qwen3.5-4B | Qwen3.5-9B |
|---|---|---|---|---|
| `architectures` | `Qwen3ForCausalLM` | `Qwen3ForCausalLM` | `Qwen3_5ForConditionalGeneration` | `Qwen3_5ForConditionalGeneration` |
| `num_hidden_layers` | 36 | 36 | 32 | 32 |
| `hidden_size` | 2560 | 4096 | 2560* | 4096 |
| `num_attention_heads` | 32 | 32 | 16 | 16 |
| `num_key_value_heads` | 8 | 8 | 4 | 4 |
| `head_dim` | 128 | 128 | **256** | **256** |
| `intermediate_size` (FFN) | 9728 | 12288 | 9216* | 12288 |
| `vocab_size` | 151936 | 151936 | **248320** | **248320** |
| `max_position_embeddings` | 40960 (32K+ext) | 40960 (32K+ext) | **262144** | **262144** |
| `rope_theta` | 1e6 | 1e6 | **1e7** | **1e7** |
| `tie_word_embeddings` | true | false | false | false |
| Attention type | full GQA only | full GQA only | **hybrid (linear + full)** | **hybrid (linear + full)** |
| Linear attn layers | — | — | 24 (3 ogni 4) | 24 (3 ogni 4) |
| Full attn layers | — | — | 8 (ogni 4°) | 8 (ogni 4°) |
| Linear K/V heads | — | — | 16 K / 32 V (head_dim 128) | 16 K / 32 V (head_dim 128) |
| `attn_output_gate` | n/a | n/a | true | true |
| `partial_rotary_factor` | 1.0 | 1.0 | **0.25** (solo 64-dim rotato) | **0.25** |
| MoE | no | no | **sparse MoE in FFN** | **sparse MoE in FFN** |
| Multimodal | no | no | **yes** (vision+video tokens) | **yes** |
| Activation | SiLU | SiLU | SiLU | SiLU |
| dtype native | bfloat16 | bfloat16 | bfloat16 | bfloat16 |

\* Qwen3.5-4B `hidden_size=2560`, `intermediate_size=9216` (da model card; config.json non raggiungibile direttamente, info dedotta dall'HF model page).

Source config.json: [Qwen3-4B](https://huggingface.co/Qwen/Qwen3-4B/raw/main/config.json), [Qwen3-8B](https://huggingface.co/Qwen/Qwen3-8B/raw/main/config.json), [Qwen3.5-9B](https://huggingface.co/Qwen/Qwen3.5-9B/raw/main/config.json).

### Differenze architetturali sostanziali

1. **Attention type — la rivoluzione 3.5**
   - Qwen3: full softmax GQA in ogni layer, RoPE pieno su tutte le head dim.
   - Qwen3.5: **hybrid Gated DeltaNet (linear attention) + Gated Attention (full)** in pattern 3:1. 24/32 layer usano DeltaNet → memoria costante in context, abilita 262K nativo anche su 4B. `partial_rotary_factor=0.25` significa solo 64 dim su 256 head_dim ruotate (RoPE applicato parzialmente, il resto è "NoPE-style").
   - Implicazione fine-tuning: layer linear attention sono **più fragili a quantization** (gating + chunked recurrent state) → motivo per cui Unsloth dice "no QLoRA su Qwen3.5".

2. **Hidden / head dim**
   - Qwen3 head_dim 128 (standard); Qwen3.5 head_dim **256** ma fewer heads (16 vs 32) → totale flops attention simile ma rappresentazione per-head più ricca.

3. **FFN / MoE**
   - Qwen3 dense piccoli: FFN SwiGLU classico.
   - Qwen3.5 dense small models: paper dice "sparse Mixture-of-Experts" ma config.json del 9B non mostra `num_experts` esplicito → probabilmente architettura ibrida con MoE-style routing implicito o "fat" SwiGLU (da confermare paper). Qwen3.6-35B-A3B invece è esplicitamente MoE (256 expert).

4. **Tokenizer / vocab**
   - Qwen3: vocab 151,936 (BPE, ereditato da Qwen2.5).
   - Qwen3.5: **vocab 248,320** (+63%) per coprire 201 lingue + token speciali multimodali (image_token 248056, video_token 248057). **Tokenizer DIVERSO** → embedding non riusabili tra famiglie.

5. **Positional encoding**
   - Qwen3 RoPE θ=1e6 con 32K native + YaRN.
   - Qwen3.5 RoPE θ=1e7 (10× larger base) → estende meglio long-range, + `partial_rotary_factor 0.25` (NoPE hybrid). Context 262K nativo senza YaRN.

6. **Tied embeddings**
   - Qwen3-4B: tied (sì) — risparmia parametri.
   - Qwen3-8B in su: not tied.
   - Qwen3.5: not tied.

7. **Multi-Token Prediction (MTP)**
   - Qwen3.5 introduce MTP nativo per faster inference (citato in model card).

8. **Thinking mode**
   - Qwen3 base ("non-2507"): dual-mode native, toggle via `enable_thinking` flag al prompt. `<think>` tag generato in modalità reasoning.
   - Qwen3 "Instruct-2507" variants (es. Qwen3-4B-Instruct-2507): **only non-thinking** — `<think>` rimosso, modello più diretto.
   - Qwen3.5: thinking mode **default attivo**, ridisegnato con RL scaling più aggressivo (citato nei blog).

9. **Pretraining**
   - Qwen3: ~36T token (da tech report 2505.09388), cutoff ~Q1 2025.
   - Qwen3-Coder-480B: 7.5T token con **70% code ratio** (blog Qwen).
   - Qwen3.5 Small: non disclosed totale, presumibilmente >40T, cutoff ~Q4 2025.
   - Qwen3.5 instruct: post-training con RLHF + GRPO scale-up, dataset multimodale.

10. **Modalità**
    - Qwen3 e Qwen3-Coder: **text-only**.
    - Qwen3.5 Small models: **multimodali nativi** (text + image + video) anche le size 0.8B/2B. Aggiunge complessità al fine-tuning text-only (vision encoder ~150-300M params extra).

### Tabella mapping ecosistema training

| | Qwen3-4B | Qwen3-8B | Qwen3.5-4B | Qwen3.5-9B |
|---|---|---|---|---|
| Unsloth QLoRA 4-bit | ✅ | ✅ | ❌ (sconsigliato) | ❌ (sconsigliato) |
| Unsloth LoRA bf16 | ✅ ~8GB | ✅ ~22GB | ✅ ~10GB | ✅ ~22GB |
| Axolotl / LLaMA-Factory | ✅ | ✅ | parziale | parziale |
| TRL native | ✅ | ✅ | ✅ (transformers 4.57+) | ✅ |
| FlashAttention-2 | ✅ (Ampere+) | ✅ | parziale (DeltaNet ha kernel custom) | parziale |
| **2080 Ti (Turing, no BF16)** | ✅ (FP16) | ⚠️ tight | ⚠️ FP16 fallback rischioso | ❌ |

---

## Quale è meglio per noi

### Per workflow consolidation locale (2080 Ti 11GB, primo mini-experiment)

**Winner: Qwen3-4B-Instruct-2507**

Motivi:
- **VRAM**: 3.5-5GB QLoRA → headroom enorme su 11GB, permette seq_len 4-8K e batch effettivo decente con grad_accum.
- **Apache 2.0**.
- **262K context nativo** (raro per 4B) → utile per cross-codebase / multi-file agent.
- QLoRA NF4 **funziona bene** (no fragilità Qwen3.5 linear attention).
- **Vocab Qwen2.5-style** → tokenizer maturo per code, tonnellata di tooling.
- LiveCodeBench v6 35.1% — non SOTA ma ragionevole per 4B, e RFT/SFT può migliorare di +10-15pt sul dominio target.
- Ecosistema Unsloth + Axolotl al 100%.
- Compatibile con LoRA stacking (vedi [lora-stacking.md](./lora-stacking.md)).

Alternative considerate:
- **Qwen3-8B**: ⚠️ tight ma fattibile per "scaling intermedio" prima del cloud step.
- **Qwen3.5-4B**: ⚠️ benchmark coding migliori (+20pt LCB) ma rischio FP16-instability su Turing + niente QLoRA = no margine VRAM. **Da rivalutare se si trova GPU Ampere+ economica**.

### Per scaling cloud post-MVP (A100 40GB / H100 80GB)

**Winner: Qwen3.5-9B** (se budget compute medio) **o Qwen3-Coder-30B-A3B** (se MoE-friendly stack)

- **Qwen3.5-9B**: LiveCodeBench v6 65.6% (best <10B), bf16 LoRA ~22GB → ok su A100 40GB con margine. 262K context nativo. Stessa **famiglia 3.5** del 4B → portabilità adapter LoRA limitata ma transfer learning architetturale buono.
- **Qwen3-Coder-30B-A3B**: SWE-Bench Verified 51.6%, 3B attivi → inference veloce in produzione. MoE training richiede framework adeguato (Megatron, OpenRLHF, ms-swift).

Scelta dipende dal vincolo: se vogliamo **continuità adapter LoRA dal mini-experiment locale → cloud**, **Qwen3-8B** è il candidato (stessa famiglia di Qwen3-4B, same tokenizer, scale-up architetturale lineare). Se invece accettiamo discontinuità per benchmark migliori, **Qwen3.5-9B**.

### Per modello "target finale" grande (cloud H100/B200, prodotto)

**Winner: Qwen3.6-35B-A3B**

- SWE-Bench Verified **73.4%** → tier-1 open-source per coding agent
- LiveCodeBench v6 **80.4%**
- 3B attivi → costo inferenza ragionevole
- 262K nativo + 1M YaRN per long-context agentic workflow
- Apache 2.0

Alternativa: **Qwen3-Coder-Next-80B-A3B** (SWE-V 70.6%) se hybrid linear attention è preferibile per la verticale coding.

### Architettura three-tier (orchestrator FT + 2 LoRA stacking + agent autonomy + multi-day + cross-codebase)

**Raccomandazione: pipeline progressiva su famiglia Qwen3 (non 3.5)** per i seguenti motivi:

1. **Catastrophic forgetting** (vedi [catastrophic-forgetting.md](./catastrophic-forgetting.md)): Qwen3 dense tradizionale è più "studiato" su mitigazione (LoRA rank bassi, replay buffer noti). Qwen3.5 hybrid DeltaNet è troppo nuovo (Mar 2026) → letteratura su forgetting in linear attention layers ancora scarsa.

2. **LoRA stacking** (vedi [lora-stacking.md](./lora-stacking.md)): stacking funziona meglio su attention pura. Su Qwen3.5 i 24 layer DeltaNet hanno state recurrent — LoRA su quei layer è meno studiato (richiederebbe verifica empirica).

3. **Context length per cross-codebase**: Qwen3-4B-Instruct-2507 ha già 262K nativo → sufficiente per ingest repo medio-grande senza bisogno di andare su 3.5.

4. **Continuità scaling**: orchestrator 4B → 8B → 30B-A3B tutti famiglia Qwen3, **same tokenizer (151,936)**, **same RoPE base**, transfer learning concettuale lineare.

5. **Capacity**: 4B per task narrow (programming LoRA verticale singolo dominio); 8B+ per orchestrator FT con knowledge mantenuta; 30B-A3B per "modello finale" multi-task.

**Sequenza concreta proposta**:
- **Step 1 (locale 2080 Ti)**: Qwen3-4B-Instruct-2507 + QLoRA NF4 + LoRA rank 16 → workflow consolidation, mini-experiment LoRA stacking proof-of-concept.
- **Step 2 (cloud A100)**: Qwen3-8B + LoRA bf16 → orchestrator fine-tune con dataset più ampio, validazione catastrophic-forgetting su MMLU + HumanEval.
- **Step 3 (cloud H100/B200)**: Qwen3-Coder-30B-A3B → modello target finale per produzione, full SFT + DPO + (opzionale) GRPO sul dominio.

**Trade-off chiave da accettare**: Qwen3.5 ha **+20pt LiveCodeBench** vs Qwen3 a parità di parametri. Per un agent puramente coding-focused vale la pena rivalutare. Ma per **architettura three-tier con stacking adapter + orchestrator generalista**, la maturità ecosystem di Qwen3 dense vince.

---

## Modelli scartati e perché

| Modello | Motivo scarto |
|---|---|
| Codestral-22B | License MNPL non-production → non commerciabile |
| Codestral-Mamba-7B | Ecosistema LoRA-on-Mamba immaturo, divergenza ecosistema |
| StarCoder2 (tutta family) | 2024, superato; license OpenRAIL-M con attribution constraints |
| granite-code (tutta family) | Deprecato dal vendor IBM, context corto (2K-8K) |
| DeepSeek-Coder-V2 Lite | Buono ma vecchio (2024), license non-Apache, superato da Qwen3-Coder |
| Qwen3-14B | OOM probabile su 2080 Ti anche QLoRA con seq realistico |
| Qwen3-30B-A3B (qualsiasi) | MoE non gestibile su 11GB |
| Qwen3.5-9B | Richiede >20GB anche LoRA bf16 → fuori scope locale |
| Qwen3-0.6B / 1.7B | Troppo piccolo per orchestrator multi-task |

---

## Note metodologiche e gap

- **Benchmark coding 2026**: HumanEval+ ormai saturo (>90% frontier), LiveCodeBench v6 è il refer-metric attuale ma molti model card Qwen non riportano la cifra (es. Qwen3-8B, Qwen3-14B → "non trovato").
- **SWE-Bench Verified su SLM <10B**: praticamente nessuno pubblica. Si trova solo per i Coder MoE (30B-A3B → 51.6%, Coder-Next → 70.6%, Qwen3.6-35B-A3B → 73.4%).
- **Conflitto Qwen3-Coder-Next data release**: Unsloth docs dicono "Feb 2025", arxiv id 2603.00729 implica 2026-03 → probabile typo Unsloth, **release reale 2026-03**.
- **Qwen3.5 architettura "MoE"**: model card parla di "sparse MoE" ma config.json non espone `num_experts` (a differenza di Qwen3.6-35B-A3B). Possibile che si tratti di MoE-style routing implicito o naming impreciso. **Da verificare nel paper Qwen3.5 quando uscirà**.
- **Tutti i numeri VRAM**: minimo assoluto Unsloth; realistico per training serio aggiungere +30-50% per activations a seq_len 2048+ con grad_accum.
- **2080 Ti specifica**: Turing arch, no BF16 nativo (solo FP16/INT8), Tensor Cores limitati, niente FlashAttention-2 al massimo speed. Consigliato `torch.compile` mode default e FP16 con loss-scaling robusto.

---

## Sources

- [Qwen3-Coder-30B-A3B-Instruct (HF)](https://huggingface.co/Qwen/Qwen3-Coder-30B-A3B-Instruct)
- [Qwen3-8B (HF)](https://huggingface.co/Qwen/Qwen3-8B)
- [Qwen3-14B (HF)](https://huggingface.co/Qwen/Qwen3-14B)
- [Qwen3-4B-Instruct-2507 (HF)](https://huggingface.co/Qwen/Qwen3-4B-Instruct-2507)
- [Qwen3.5-9B (HF)](https://huggingface.co/Qwen/Qwen3.5-9B)
- [Qwen3.5-4B (HF)](https://huggingface.co/Qwen/Qwen3.5-4B)
- [Qwen3.6-35B-A3B (HF)](https://huggingface.co/Qwen/Qwen3.6-35B-A3B)
- [Qwen3-Coder-480B-A35B (HF)](https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct)
- [Qwen3 Tech Report arxiv:2505.09388](https://arxiv.org/pdf/2505.09388)
- [Qwen3-Coder blog](https://qwenlm.github.io/blog/qwen3-coder/)
- [Unsloth VRAM requirements](https://unsloth.ai/docs/get-started/fine-tuning-for-beginners/unsloth-requirements)
- [Unsloth Qwen3.5 fine-tune](https://unsloth.ai/docs/models/qwen3.5/fine-tune)
- [Unsloth Qwen3-Coder-Next](https://unsloth.ai/docs/models/qwen3-coder-next)
- [DeepSeek-Coder-V2-Lite-Instruct (HF)](https://huggingface.co/deepseek-ai/DeepSeek-Coder-V2-Lite-Instruct)
- [StarCoder2-15B (HF)](https://huggingface.co/bigcode/starcoder2-15b)
- [granite-8b-code-instruct-4k (HF)](https://huggingface.co/ibm-granite/granite-8b-code-instruct-4k)
- [Codestral-22B-v0.1 (HF)](https://huggingface.co/mistralai/Codestral-22B-v0.1)
- [Latent.space top local models April 2026](https://www.latent.space/p/ainews-top-local-models-list-april)
- [Artificial Analysis Qwen3.5 Small Models article](https://artificialanalysis.ai/articles/qwen3-5-small-models)
- [MarkTechPost Qwen 3.5 Small announcement](https://www.marktechpost.com/2026/03/02/alibaba-just-released-qwen-3-5-small-models-a-family-of-0-8b-to-9b-parameters-built-for-on-device-applications/)
- [SitePoint Best Local LLM Models 2026](https://www.sitepoint.com/best-local-llm-models-2026/)
- [Aider polyglot bench discussion (Qwen3)](https://aider.chat/2025/05/08/qwen3.html)
- [Profiling QLoRA on consumer GPUs (arxiv 2509.12229)](https://arxiv.org/pdf/2509.12229)
