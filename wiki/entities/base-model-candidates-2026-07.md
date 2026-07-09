---
name: base-model-candidates-2026-07
description: "Ricerca comparativa (utente msg 1325, 2026-07-08) — il base attuale Qwen3.6-27B è davvero il più intelligente+knowledgeable per i nostri requisiti, o c'è di meglio? Ranking di 9+ candidati ~27-36B (dense preferiti, msg 1326) con verdetto, caveat e reco BAKE-OFF. NON decide: input per l'utente."
type: entity
tags: [base-model, continual-pretrain, model-selection, dense-vs-moe, qwen, seed-oss, glm, olmo, gemma, reference, decision-input]
last_updated: 2026-07-08
---

# Base model candidates — ricerca 2026-07-08

> **Origine**: utente msg 1325 (*"il modello che usiamo ora è davvero quello con maggiore intelligenza+conoscenza, o c'è di meglio di pari caratteristiche?"*) + msg 1326/1327 (**preferenza DENSE > MoE**, intuizione; *"salvali entrambi"*). Prodotta da workflow multi-agente `wf_964989e2` (5 famiglie + sintesi, 30 candidati raccolti, ricerca web).
> **Stato**: `[INFERRED/FRONTIER]` — **NON è una decisione**. La scelta ground-truth [[../../memory]] `project_test_model_vs_target` (Qwen 3.6 ~27B) resta protetta (rule #1) finché l'utente non decide. Questa pagina è *alternative-considerate* + reco di metodo. **Tutti i numeri 2026 sono non-verificati/contraddittori → da RIPRODURRE (caveat #1).**

## Requisiti di ancoraggio (i nostri assi)

~27-36B · **open-WEIGHT** (CPT + full-FT + LoRA) · **INTELLIGENZA+CONOSCENZA** (Tier-1 = intelligenza NON coding, [[../../memory]] `project_base_model_intelligence`) · **operare-il-sistema** forte (bash/PS/sh/CMD + py/JS base, msg 1322) · **CPT-pulito senza fragilità** · licenza permissiva (Apache/MIT) · **LoRA-friendly + vLLM --enable-lora** hot-swap · context lungo *se serve davvero* · riusabilità verso [[../../memory]] `project_from_scratch_slm_future`.

## Verdetto sintetico su Qwen (risposta diretta)

**DIPENDE da QUALE Qwen.** Il pick attuale **Qwen3.6-27B (apr 2026)** NON è chiaramente il massimo su *intelligenza+CONOSCENZA+CPT-pulito* per NOI: (a) **coding-monomaniacale** ("Flagship-Level Coding in a 27B") vs identità Tier-1 = intelligenza/decomposizione, e la conoscenza pura cresce "modesto"; (b) **ibrido GatedDeltaNet** (LoRA-su-linear-attention NON confermata → rischio che l'adapter copra solo ~1/4 full-attn+FFN) + multimodale (peso morto text-only) + modello nuovissimo (zero ricette CPT mature) = **massima fragilità CPT**, contro il requisito esplicito "senza fragilità note"; (c) numeri **contraddittori** (GPQA 73.4 vs 87.8 tra fonti). **Ma dentro Qwen il modello giusto per una pipeline CPT è Qwen3-32B (dense), non il 3.6.** Il suo Terminal-Bench 2.0 ~59.3 (agentic/operare-il-sistema) resta un pro reale.

## Ranking (dense preferiti — top-7 tutti DENSE)

| # | Modello | Params/arch | Licenza | Perché per NOI | Tradeoff / da verificare |
|---|---------|-------------|---------|----------------|--------------------------|
| **1** | **Seed-OSS-36B Base-woSyn** (ByteDance) | 36B **dense** softmax | Apache-2.0 | Miglior **intelligenza+conoscenza-per-taglia** tra i dense permissivi (MMLU-Pro 82.7, GPQA-D 71.4, BBH 87.7). Dense standard = CPT/full-FT/LoRA/vLLM senza fragilità. 512K ctx. **UNICO: base *senza* synthetic-instruction-data** = substrato neutro pensato per chi ci mette sopra il proprio CPT → **fit più letterale**. | Reproduction-gap forte (LCB 30.7 vs 67.4) → **riprodurre prima**. Agentic poco documentato → **nostre probe shell**. Ago 2025. 512K = costo KV reale. |
| **2** | **Qwen3-32B** (mag 2025) | 32B **dense** softmax | Apache-2.0 | **"Il Qwen giusto"** per CPT: conoscenza più ampia (36T token, 119 lingue, generalista NON coding-tilt = allineato Tier-1). Dense softmax = CPT/full-FT/LoRA/vLLM **il più battle-tested**, zero incognite. Toggle-thinking pulito. Text-only = PRO. **Rischio-esecuzione minimo.** | Ceiling reasoning 2026 più basso; agentic gen-2025; ctx 128K. Il base ha reasoning grezzo (thinking dal loro post-training, il CPT può alterarlo). |
| **3** | **GLM-4-32B-0414** (+Z1) (Zhipu) | 32B **dense** | **MIT** | Miglior **operare-il-sistema + CPT-pulito** tra i dense permissivi (la nostra memoria eleva l'asse agentic). Unico ~32B dense MIT con **tool-use/agentic GIÀ forte nel base** ("atomic capabilities for agent tasks") + vLLM/SGLang ufficiale. | Mancano MMLU-Pro/GPQA ufficiali puliti → verificare. Ctx nativo **solo 32K** (128K via YaRN). Apr 2025 cutoff. |
| **4** | **OLMo 3.1 32B** (AllenAI) | 32B **dense** | Apache-2.0 | Il più **research-friendly**: **FULLY-OPEN** (dati pretrain + ricetta + checkpoint intermedi) → per un CPT scientifico sai ESATTAMENTE il substrato = fragilità-sconosciuta minima. Batte Qwen3-32B su MMLU-Pro/GPQA/AIME con ~6× meno token. | Raw-knowledge/coding leggermente sotto. Agentic non è il focus → più lavoro harness+LoRA. Ctx 65K. Ecosistema più piccolo. |
| **5** | **Gemma 4 31B Dense** (Google) | 31B **dense** | Apache-2.0 | 31B in-target, dense = CPT/full-FT/LoRA puliti, 256K ctx, reasoning forte token-efficient, FT day-0 (Unsloth QLoRA su 4090). | **Agentic più debole** (il nostro asse #1) + **recall enciclopedico DEBOLE** (asse conoscenza). Reasoning-by-default senza toggle pulito. vLLM+LoRA tardivo con gotcha. Multimodale = baggage. |
| **6** | **Qwen3.6-27B** ⭐CANDIDATO ATTUALE | 27B **dense-ibrido** (GatedDeltaNet) | Apache-2.0 | Massimo **ceiling** intelligenza+agentic + ctx 1M. Più forte su **agentic/terminal** (SWE-Verified 77.2, **Terminal-Bench 2.0 59.3** = utile al nostro operare-il-sistema). "Preserve thinking" per multi-turno. | coding-monomania vs Tier-1; **ibrido+multimodale+nuovo = max fragilità CPT**; numeri non-verificati/contraddittori. **Adottabile SOLO dopo test CPT+full-FT a scala ridotta** che escluda l'instabilità linear-attention. |
| **7** | **Qwen3.5-27B** (feb 2026) | 27B **dense-ibrido** | Apache-2.0 | Più bilanciato del 3.6 per la nostra identità (meno coding-tilt), agentic forte verificabile (TAU2 79.0, BFCL-V4 68.5), ctx 1M. | Stesse incognite architetturali ibride del 3.6. |
| 8 | DeepSeek-R1-Distill-Qwen-32B | 32B dense (backbone Qwen2.5) | MIT/Apache | Reasoning-distilled forte. | **Substrato "sporco"** (reasoning-distilled) → forgetting facile nel CPT: **NON partire da qui**. |
| 9 | **NVIDIA Nemotron 3 Nano 30B-A3B** | **MoE ibrido Mamba2** (A3B) | NVIDIA Open Model Lic. | Unico MoE ~30B nel target. | **MoE + Mamba2-ibrido** = attrito CPT/LoRA (contro preferenza-dense utente) + licenza non-Apache/MIT. |

**MoE giganti / fuori-scope** (taglia/licenza/arch): DeepSeek V3.2/V4, Mistral-4-119B, Llama-4-Scout 109B (Community lic.), GLM-4.5+, Command-A (CC-BY-NC). **Sub-target**: Mistral 24B/14B, Magistral, Phi-4, distill 8-14B, gpt-oss-20b. **Ibridi-Mamba**: Falcon-H1, Granite-4 (attrito CPT senza compenso). → coerente con la **preferenza DENSE** (msg 1326): i MoE non entrano nella rosa.

## Raccomandazione (metodo, non verdetto a priori)

**NON blindare Qwen3.6-27B.** Fare un **BAKE-OFF a due teste** (prima sul 4B di test, poi sui finalisti 32B):
- **PRIMARIO** = **Seed-OSS-36B-Base-woSyn** (fit più letterale: intelligenza+conoscenza+woSyn-CPT-base).
- **DEFAULT SICURO / CO-LEADER** = **Qwen3-32B** (de-riskato, "il Qwen giusto"). Se il bake-off mostra instabilità o agentic-debole di Seed-OSS → questo è il pick.
- Terza opzione per peso-asse: **GLM-4-32B** se domina "operare-il-sistema"; **OLMo 3.1 32B** se domina il controllo-scientifico del CPT.
- **Regola checkpoint**: CPT SOLO da un vero **BASE** (Qwen3-32B-base / Seed-OSS-woSyn / OLMo-base / GLM-base). MAI da reasoning-distilled/instruct (substrato sporco).
- **Ruolo del 3.6-27B**: declassato da "base blindato" a **candidato-da-validare + potenziale TEACHER** (distillazione). Il suo Terminal-Bench + ceiling sono reali; rientra al vertice SE il test CPT prova che GatedDeltaNet regge E che la LoRA lo copre.

## Caveat (da verificare PRIMA di cambiare — nessuno opzionale, rule #14 + metodo scientifico)

1. **Numeri → RIPRODURRE** noi (MMLU-Pro/GPQA-Diamond sui finalisti, stesso thinking-budget). Tutti i 2026 sono contraddittori; per Seed-OSS la forbice ufficiale-vs-terzi è il caveat #1.
2. **Bake-off CPT a scala ridotta = il test DECISIVO**: (a) catastrophic forgetting (replay 1-5%); (b) **la LoRA copre DAVVERO i layer giusti** — per gli ibridi Qwen3.5/3.6 verificare che l'adapter adatti i GatedDeltaNet e non solo ~1/4 full-attn+FFN; (c) vLLM --enable-lora hot-swap per-richiesta sulla NOSTRA versione (Gemma4 aveva "adapter ignored").
3. **Operare-il-sistema con NOSTRE probe** (bash/PS/sh/CMD + py/JS base), non tau-bench/BFCL riportati. Gating per Seed-OSS/OLMo (agentic poco doc) e per capire se Qwen3-32B basta o serve il ceiling 2026.
4. **Context — dimensionare il bisogno reale** prima di usarlo come criterio (1M irrilevante se operiamo <128K; 512K ha costo KV; GLM nativo 32K).
5. **Licenza**: Seed-OSS/Qwen/OLMo/Gemma4 = Apache-2.0; GLM/DeepSeek-distill = MIT → primi 5 OK. Nemotron = NVIDIA Open (non Apache/MIT).
6. **Onestà 1 vs 2**: Seed-OSS #1 è fit-su-carta; condizionato alla validazione. Decidere **col DATO**, non a priori.

## Prossimi passi — bake-off STAGED (locale-vs-cloud, utente msg 1332 "può girare in locale?")

Il bake-off NON è monolitico: separare **INFERENZA** (leggera, locale/API) da **TRAINING** (pesante, cloud). La maggior parte della DECISIONE si prende in inferenza, PRIMA di spendere in training. `[EXTRACTED da reco + vincoli HW]`

- **Stage 0 — probe di INFERENZA (locale/API, NIENTE training)** ⭐ decide la maggior parte: intelligenza + conoscenza + **operare-il-sistema/shell** (probe nostre) + injection-suite, sui candidati. Un 32B a **4-bit** sta in ~18-22GB → gira su 24GB (4090/3090); Seed-OSS-36B comodo su 48GB. Alternativa: **API pay-per-token** (OpenRouter/Together ospitano Qwen3-32B/GLM/OLMo/Gemma). **Il driver eval è già OpenAI-compatible → si punta indifferentemente a vLLM/Ollama LOCALE o a un endpoint API: stesso harness, stesse probe.**
  > ✅ **PROBE-HARNESS COSTRUITO (T5, opzione-b utente msg 1356)**: `harness/eval/base-probes.mjs` (probe-set: shell **bash/PowerShell/CMD/sh** + **python/JS** base + **reasoning** — requisito base-agentic-strong, grader deterministico outcome-ancorato #10) + `harness/eval/run-base-probe.mjs` (runner **model-agnostic** OpenAI-compatible, validità apiError→invalid #14). Test 15/0; **wiring validato live** contro l'endpoint OpenAI-compat di Gemini (3/3 reasoning). **Pronto-a-girare sui candidati**, basta puntare base-url+key+model:
  > - Seed-OSS-36B (OpenRouter): `OPENAI_BASE_URL=https://openrouter.ai/api/v1 OPENAI_API_KEY=<or-key> MODEL_ID=<seed-oss-slug> node eval/run-base-probe.mjs`
  > - Qwen3-32B (Together/OpenRouter): idem con `MODEL_ID=<qwen3-32b-slug>`. **Validare ENTRAMBI** (msg 1341) → confronto per-categoria. **Gated solo sulla key API** dell'utente.
- **Stage 1 — meccanismo CPT+LoRA sul 4B LOCALE**: che il continual-pretrain giri, LoRA hot-swap su vLLM, catastrophic-forgetting gestito (replay). Il 4B sta in locale → validare il MECCANISMO qui, poi scalare solo il vincitore.
- **Stage 2 — CPT+full-FT del/i FINALISTA/i a 32B in CLOUD**: full-FT di un 32B = ~8×A100 / 4×H100 (impossibile in locale consumer) → **GPU affittate a ore** (RunPod/Vast/Lambda) SOLO alla fine, sui finalisti.

**Open questions (utente msg 1333)**: (a) VRAM della GPU locale dell'utente → quali candidati quantizzati in casa vs via API; (b) budget API pay-per-token per le probe (pochi $) vs solo-locale. → [[../open-questions]].

### Provider FREE per le probe (utente msg 1361-B "solo quote gratuite + escamotage retry", ricerca 2026-07-08)

Il bake-off gira su **free-tier** senza spesa (decisione utente: solo quote gratuite). Provider OpenAI-compatible che ospitano **Qwen3-32B** gratis:
- ⭐ **Groq** — free, no carta, `qwen3-32b` (131K ctx), limiti **30 RPM / 1000 RPD**, base `https://api.groq.com/openai/v1`. Migliore per iniziare.
- **OpenRouter** — `qwen/qwen3-32b:free`, base `https://openrouter.ai/api/v1` (1 key → 300+ modelli, ruota provider).
- Altri OpenAI-compat: Cerebras, SiliconFlow, Nebius, Alibaba Model Studio. Liste: `github.com/cheahjs/free-llm-api-resources`, `freellm.net`.
- ⚠️ **Seed-OSS-36B**: disponibilità free NON confermata → verificare lista OpenRouter/HF Inference; se assente serve provider a pagamento o self-host (caveat per validare ENTRAMBI).

**Escamotage-codice (COSTRUITO)**: `run-base-probe.mjs` ha ora **rotazione multi-key** (`OPENAI_API_KEYS` comma-sep) + **retry con backoff esponenziale su 429/5xx** (ruota key ad ogni retry → aggira il rate-limit per-key) → regge i limiti free tipo Groq 30 RPM. Comando pronto: `OPENAI_BASE_URL=https://api.groq.com/openai/v1 OPENAI_API_KEYS=<key1,key2> MODEL_ID=qwen3-32b node eval/run-base-probe.mjs`. Gated solo sulla key free.

Alla decisione finale: ADR in `wiki/decisions/` + aggiornare [[../../memory]] `project_test_model_vs_target` + [[../harness-experiment-log]] (rule #23).

## Bake-off — 1° giro FLOOR-CHECK (2026-07-08, via Groq, keys utente)

Groq (key utente in `harness/.env` come `GROQ_KEYS`, loader provider-aware `env-keys.mjs`) serve: **`qwen/qwen3-32b`** ✓, **`qwen/qwen3.6-27b`** ✓ (= scelta protetta + target-class), `openai/gpt-oss-20b`/`gpt-oss-120b`, `llama-3.3-70b-versatile`. **Seed-OSS-36B NON presente su Groq** → serve OpenRouter/Together (key) o self-host Kaggle.

**Base-probes** (`base-probes.mjs`: shell bash/PS/cmd/posix + python + JS + reasoning, 13 probe): **TUTTI e 4 i candidati → 100% (13/13 validi)**. → **Floor superato da tutti** (adeguati a operare OS+harness, il requisito base — [[../../memory]] `project_from_scratch_slm_future`). **MA il floor NON DISCRIMINA** (tutti 100%): serve un metro più fine per SCEGLIERE. **[V]** confermato: qwen3.6-27b solido sui basics.

**Caveat infra**: i Qwen (thinking → più token) hanno saturato il **TPM free di Groq (429)** con 1 sola key; aggirato con `PACE_MS=5000 MAX_RETRIES=6` (validi tutti). Più `GROQ_KEYS` → giri veloci/paralleli (rotazione già in `chat()`).

**Prossimo = DISCRIMINANTE** (proposto utente msg 1422): il metro rilevante non è il floor ma la **capacità di memory-management** che stiamo studiando — il modello capace SALVA i fatti durevoli quando istruito (il 9B NO, [[../harness-experiment-log]] §F33)? Rifare il **durable-preference test (F33) su qwen3.6-27b vs qwen3-32b via Groq** + anti-deflect → discrimina E valida la viabilità memoria-harness sul target (metrica **C4** trained-vs-untrained, [[../concepts/harness-value-and-capture-model]] §4). Richiede wiring run-session→Groq.

## Links
[[../../memory]] `project_test_model_vs_target` · `project_base_model_intelligence` · `project_from_scratch_slm_future` · [[open-pretraining-corpora]] (foundation-corpus per il from-scratch) · [[../concepts/catastrophic-forgetting]] · [[../concepts/training-intelligence-optimization]] · [[../decisions/2026-07-08-tier2-justification-analysis]]
