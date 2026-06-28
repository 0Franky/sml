---
name: curriculum-stages-detail
description: Design DETTAGLIATO per-stadio del curriculum (5 stadi + piano dataset/decontaminazione) — output del review-loop 6 agenti 2026-06-28. Per ogni stadio: obiettivo · dataset+volume+mix · metodo+reward · hyperparam · rischi · eval · incertezze. Companion di training-curriculum-design (che ha la sintesi + tabella pesi-per-stadio + decisioni aperte). NUMERI = ordini di grandezza da calibrare con ablation, NON target rigidi.
type: training-design
tags: [training, curriculum, sft, rl, grpo, preference, merge, dataset, decontamination, three-tier]
sources: [review-loop 6 agenti 2026-06-28, training-curriculum-design, data-volume-estimate, provenance-manifest, lora-sizing-methodology]
last_updated: 2026-06-28
status: draft v0 — studio approfondito, da verificare con l'utente + ablation
confidence: provisional
---

# Curriculum — design dettagliato per-stadio

> Output del review-loop (5 specialisti + 1 agnostico). La **sintesi, la tabella pesi-per-stadio, il budget onesto, l'MVP-v1-subset e le decisioni aperte** sono in [[training-curriculum-design]] §6. Qui il dettaglio operativo per stadio. **Tutti i numeri sono `[INFERRED]`/provisional** — regola progetto: *genera al 20% e scala su ablation*, non sono target rigidi.

---

## STADIO 1 — SFT "scuola" Tier 1 (full-FT)

**Obiettivo**: installare il comportamento (non superare il teacher — quello è l'RL) in 7 sotto-capacità: (1) constitution-REGOLE hard (anti-leak/safety/honest-report/refusal) · (2) logica/metodo-scientifico 8 passi · (3) marker `[V][A][?]`/structured-thinking (semantica corretta, solo nel thinking) · (4) teoria coding (regime FISSO) · (5) teoria architetturale · (6) instruction-following base · (7) dati **paired reasoning-on/off** (toggle). *Esclusa* la constitution-PREFERENZA (→ Stadio 4).

**Dataset + volume (~14-18K esempi, sottoinsieme dei ~17-22K MVP-v1)**:
| Sotto-capacità | Dataset (HF id) | ~Esempi |
|---|---|---|
| Conversazione/IF base (umano) | `OpenAssistant/oasst1`+`oasst2` · `databricks/databricks-dolly-15k` · `Muennighoff/flan` | ~3-4K |
| Reasoning paired + long-correct CoT | `open-r1/OpenR1-Math` · `nvidia/OpenCodeReasoning` · `OpenThoughts` (R1-derived, filtrare per correttezza) | ~3-4K |
| Safety/constitution-regole | `nvidia/Aegis-AI-Content-Safety` v1/v2 | ~1.5-2K |
| Instruction-following | `argilla/ifeval-like-data` · `allenai/RLVR-IFeval` (qui come SFT) | ~1.5-2K |
| Teoria coding/architetturale | `opc-sft-stage2` (SOLO `educational`+`package`) · StarCoderData-GPL-filtered | ~1.5-2K |
| Constitution/soul + criticality + self-critique seed | **autorati da noi** + held-out negativi | ~2-3K (il collo di bottiglia) |

Mix interno 5-classi: WITH-hint 30% / WITHOUT 30% / WRONG-aware 15% / WRONG-recovery 15% / OTHER 10% (eccezione regime-fisso A12: WITHOUT ~50%). **Replay coding 10%** (anti-forgetting, D1).

**Schedule (4 sub-fasi con replay ≥30% inter-fase)**: 1a soul/constitution-regole+marker → 1b +logica/8-passi+long-CoT → 1c +teoria coding/architetturale → 1d +IF+paired-on/off. **Metodo** (costo crescente): SFT diretto → **rejection-sampling** per le CoT (tieni solo le corrette) → **on-policy distillation** come cold-start (teacher = DSv4/Qwen, Claude FUORI per policy).

**Hyperparam** `[INFERRED]`: full-FT, **fp16** (Turing) o bf16 (se cloud A100) · **LR ~1e-5** cosine warmup 3-5% (full-FT vuole LR basso, NON il 2e-4 da LoRA) · **2-3 epoche**/sub-fase · effective batch 32-64 · packing **con attention-masking cross-sample** · max-len 4-8K · **special-token aggiunti al vocab + embedding init** PRIMA (D2). ⚠️ **Il full-FT 4B NON sta sul 2080Ti → A100 cloud** (vedi §6.3 budget).

**Rischi**: catastrophic-forgetting del base (LR basso + 10% replay + anti-forgetting-gate) · overfit teoria (regime-fisso confinato + dedup) · **process-marker spoofing** (`[V]` ovunque → dati WRONG-aware + consistenza `[V]`↔fatto) · calibrazione/over-confidence (ConfTuner-Brier, mai self-report) · over-caution/cry-wolf (dataset bilanciato + held-out negativo) · contaminazione (decontam obbligatoria) · instabilità fp16-full-FT (loss-scaling + observability).

**Eval**: per-capability (format-compliance marker · ordine-8-passi · long-correct CoT · caught-rate constitution + false-positive · balanced-accuracy criticality · per-constraint IF · ECE/Brier · toggle on/off A/B) + **anti-forgetting gate** HumanEval+MMLU pre/post (se drop >3-5pt → aumenta replay) + protocollo n-seed≥3 + baseline (SFT-single-stage-shuffled per il claim staged>shuffled) + contamination-report.

---

## STADIO 2 — SFT coding Tier 2/3 (LoRA)

**Obiettivo**: installare nei **LoRA r=64 sopra il Tier1-full-FT congelato** (B=0 → no-op all'init → Tier1 intatto) un coding-base **robusto** (NON minimo — l'RL amplifica non crea) + strutture linguaggi + framework frontend. MVP-v1: Tier2 skippato, LoRA frontend **self-contained**.

**Dataset + volume (~20-25K post-dedup)**:
| Dataset | Ruolo | Teacher/licenza | ~Volume |
|---|---|---|---|
| `nvidia/OpenCodeInstruct` (5M) | coding-base core | Qwen2.5-Coder-32B/QwQ · CC-BY | ~12-15K (subset filtrato) |
| `OpenCoder-LLM/opc-sft-stage2` (SOLO `educational`+`package`) | strutture+package | code-seed · MIT | ~3-4K |
| `StarCoderData` (TS/JS/CSS/Vue/Svelte, GPL-filtered) | grounding codice reale | permissive-filtered | ~3-4K |
| `bigcode/self-oss-instruct-sc2-exec-filter-50k` (opz.) | OSS-Instruct exec-filtered | StarCoder2-gen | ~2-3K |

**Split che conta**: coding-base robusto (condiviso) **~55-60%** (~12-15K, *floor* non minimo) · verticale frontend **~40-45%** (~8-10K, bilanciati per framework: ~2-2.5K React/~2K Vue/~1.5K Svelte/~2K TS/~1.5K CSS). **Non scendere sotto ~12K base**; ginocchio della curva da validare (genera 20% ~5K, misura pendenza, scala).

**LoRA config**: rank **64**, alpha **128**, target **all-linear** (q/k/v/o/gate/up/down), stack **DoRA+RsLoRA+LoRA+** (λ=15), init **B=0 default** + **ablation MiLoRA** (⚠️ DoRA+MiLoRA combo poco testata → verificare, non assumere). **Replay 10%** (Tier1-sample + coding-base) lungo tutto lo stadio.

**Hyperparam** `[INFERRED]`: LR_A 2e-4 / LR_B 3e-3 (LoRA+) · 2 epoche early-stop · batch-eff 16 · seq 4096 · warmup 0.05 · **fp16** (Turing) · **QLoRA NF4** (Unsloth Dynamic-4bit, ~5-6GB/11GB ✓ — questo **gira sul 2080Ti**) · AdamW-8bit · Unsloth→Axolotl.

**Rischi**: forgetting Tier1 (B=0+MiLoRA+10%replay+LoRA-freeza-base+**regression-gate Tier1**) · contaminazione (embedding-decontam vs tutti gli holdout) · overfit-soluzioni (epoche≤2, quality≫quantity, difficulty-filter) · **GPL-leak** (2° license-scan sul subset usato) · sotto-dimensionamento (floor 12K) · framework-version-mismatch (pin React18+/Vue3+/Svelte5/TS5+).

**Eval**: LiveCodeBench-v6 (+5% pass@1 vs vanilla) · SWE-Bench-**Lite** (≥5% resolved; ⚠️ NON Verified, ritirato) · custom 200 frontend (≥60%) · HumanEval sanity · **regression-gate Tier1** + decontam-report + per-foglia 90/10 held-out.

---

## STADIO 3 — RL agentico (GRPO + RLVR) [il cuore; RL completo → Wave 6+]

**Obiettivo**: superare il teacher dove c'è segnale verificabile. 3 target MVP-priority: (1) coding agentico repo-level (Area 13) · (2) criticality-in-azione (Area 2) · (3) tool-use/traiettoria (Area 8). Scala onesta: **2-4 environment, poche centinaia GPU-h** (NON 21-env/140k-H100 di Nemotron).

**Environment + reward**:
| Env | Cosa | Fonte | Reward verificabile | ~Task MVP |
|---|---|---|---|---|
| E1 SWE repo-level | issue→patch | SWE-Gym(2.4k)+R2E-env(7.5k); SWE-smith(50k) Wave6 | FAIL_TO_PASS ∧ PASS_TO_PASS ∧ patch-applies + **causality-check** (revert-fix→test-rossi) | ~300-600 |
| E2 Criticality sandbox | pre-flight HALT/procedi | **autorato** (fixture del gold) | check nel **trace** (git/grep reali) ∧ decisione corretta ∧ oracolo-danno + **penalità simmetrica** | ~150-250 |
| E3 Tool-use/IF | tool/scope/recovery/routing | RLVR-IFeval + scenari pi | rule-based (tool==oracolo, scope, IF-constraint) | ~200-400 |

Trajectory generate da NOI (G=8-16 verificabile, 4-8 agentico). **Test read-only/golden-baseline** prima della valutazione (anti test-tampering).

**Algoritmo + reward**: **GRPO + {Dr.GRPO (no length-norm), clip-higher}** (NON GRPO-vanilla, NON drop-KL); credit-assignment **GiGPO/mtGRPO** (E1/E3 long-horizon). Reward = **verificabile-dominante** + format-reward-sui-marker (ancorato ad artefatto, XGrammar garantisce sintassi) + **inoculation-prompting** (−75-90% misalignment, costo~0) + **RLCR** (calibration, anti GRPO-erosion) + **PBRS phase-reward GATE-DIETRO-ABLATION** (Φ su stato, default=solo-outcome). RL **mono-stadio** MVP.

**Curriculum difficoltà** (correzione Nemotron): genera N risposte col checkpoint-St.2 → **pass-rate filtering** (scarta ≥0.75 facili + ≈0 duri, tieni 0.1-0.7) → ordina easy→hard.

**Hyperparam/infra**: KL **piccolo-non-zero** vs ref(St.2) · sandbox **Docker BenchJack-safe** (agente non scrive nell'env che il grader ispeziona) · serving rollout vLLM **AWQ-int4+Marlin** (fp16, Turing) · **A100 cloud** per i run · observability **NaN/KL/reward-std/entropy** (GRPO diverge in silenzio) · repro/cost-counter.

**Rischi** (RL = max esposizione RH): test-tampering · fix-per-caso · check-fantasma · participation-hack · cry-wolf · instabilità · **calibration-erosion** · overoptimization/Goodhart · emergent-misalignment · BenchJack · PBRS-rotto. Difese **by-design** (vedi [[training-curriculum-design]] §6.6).

**Eval**: ⚠️ **SWE-bench Verified RITIRATO** → **ImpossibleBench** (anti-cheat, cardine) · **RedCode-Exec** (criticality baseline) · RHB · SWE-bench **Pro**+Terminal-Bench-2.0 · custom-criticality (difesa BenchJack obbligatoria) · ECE/Brier · held-out decontaminato. n-seed≥3.

---

## STADI 4+5 — Preference (corto, ultimo) + Merge [opzionali MVP]

**Stadio 4 — obiettivo**: tono/helpfulness/deference/constitution-PREFERENZA, **corto e ultimo** (l'alignment-preferenza presto erode il reasoning — correzione 1; RLHF causa benchmark-drop). Vive su **Tier 1** (non sui LoRA coding).

**Dataset**: **`nvidia/HelpSteer3`** (40.5k preference pair, **CC-BY-4.0 puro, human-annotated** — gold clean). Volume nostro: **~2.3K MVP / ~6.5K full** (pair autorati su assi critici: anti-sycophancy A9, self-eval A16, planning A1) + subset HelpSteer3 decontaminato. ⚠️ EVITARE UltraFeedback/Nectar/orca_dpo (closed-distilled).

**Metodo**: **DPO diretto (default), NON RLOO-su-RM-piccolo** (un RM piccolo è debole/gameable = vettore RH #1; DPO elimina l'RM, è offline, low-budget; Nemotron stesso usa DPO per IF). Alternativa ORPO (no ref-model) o KTO (label binarie). **β 0.1-0.3** (alto = vicino al reference = meno erosione) · LR 3e-7–5e-6 · **1 epoca** (il "corto" è iperparametro di sicurezza). Stop = **eval-di-non-erosione** (sotto).

**Stadio 5 — Merge (opzionale)**: interpolazione `θ=α·chat+(1-α)·reasoning`, **α≈0.5** sweep {0.3-0.7} su frontiera Pareto (mergekit/SLERP). Risolve trade-off reasoning↔chat (Nemotron Nano2). **Toggle on/off** via dati paired (già da St.1) + budget-forcing harness (F-serving). ⚠️ Re-eval safety/preference POST-merge (un merge può spostare fuori dalla regione allineata).

**Rischi**: **erosione reasoning** (corto+β-alto+merge+replay 10%+gate-di-stop) · over-optimization (monitor) · **sycophancy** (anti-sycophancy pairs honest>pleasant + length-penalty) · judge-RH (se RM: scorer≠scored, ensemble; o usa DPO senza RM) · length-bias DPO (SimPO/normalization) · merge-degrada (sweep/SLERP/fallback no-merge).

**Eval**: (A) Arena-Hard-style win-rate (judge=DeepSeek, mai GPT/Claude) + anti-sycophancy-probe + over-refusal-suite; (B) **non-erosione (gate)**: GSM8K/MATH + LiveCodeBench + SWE-Pro + custom-criticality + ECE, misurati pre/post St.4 e su ogni α — soglia Δ≤2% o riduci epoche/β.

---

## PIANO DATASET & DECONTAMINAZIONE

**Acquisizione (size verificate alle card HF; ri-verificare i tag al download)**: OASST2(~135k)·Dolly(13MB)·Aegis2(28MB,33k)·RLVR-IFeval(12MB,15k)·HelpSteer3(304MB, config `preference` 40.5k) = zero-friction <2GB. OpenCodeInstruct(6.4GB,~5M→campiona)·OpenCodeReasoning(736k, teacher R1)·opc-sft-stage2(537MB, SOLO educational+package, **scarta evol/mceval=GPT**)·opc-annealing(26.8GB→campiona)·StarCoderData(**783GB full→NON scaricare**, solo frontend GPL-filtered). Gym: SWE-Gym(43MB,2438)·R2E-Gym(1.66GB,~7.5k, **licenza da verificare**)·SWE-smith(278MB,~50k) = **solo ambienti, non trajectory**.

**Decontaminazione 3-stadi** (held-out: LiveCodeBench/SWE-Bench/IFEval/HumanEval/MBPP/custom-criticality):
- **A** n-gram (13-gram; 8 per IFEval) exact-match → drop su hit (cheap pre-filtro).
- **B** MinHash-LSH (NeMo-Curator): near-dedup interno (Jaccard ≥0.7) + flag-vs-benchmark (≥0.8).
- **C** embedding-similarity (cosine ≥0.85) + **LLM-judge** sui borderline (giudice=DeepSeek, mai GPT/Claude). Cattura le riformulazioni (n-gram non basta).
- Tool: skill `ml-nemo-curator` (tutti e 3). Held-out per-foglia 90/10.

**License-check operativo**: per ogni fonte → ri-verifica tag al download + riga NOTICE (CC-BY/SA/ODC-BY = attribuzione; SA=share-alike). **Punti di rischio**: FLAN (licenza non sulla card → verificare per-componente o NON usare) · StarCoderData (no variant GPL-filtered ufficiale → filtro a valle sui metadati per-repo, droppa GPL/AGPL/LGPL, o usa subset The-Stack license-clean) · R2E-Gym (verificare). Provenance R1-derived (OpenCodeReasoning) = documentare (R1-MIT permette distillazione).

**Storage MVP-v1**: ~20-55GB dataset grezzi (StarCoder-subset è la variabile). **Gym Docker** (decine-centinaia GB) → on-demand sul nodo GPU cloud durante l'RL, NON in locale/2080Ti.

**Ordine (per sbloccare gate 0-A)**: (1) zero-friction <2GB [OASST/Dolly/Aegis/RLVR-IFeval/HelpSteer3] → sblocca St.1+St.4; (2) **scarica i benchmark held-out + costruisci l'indice di contaminazione PRIMA** dei coding-dataset grandi; (3) coding clean piccolo [opc-sft educational+package, poi campioni OpenCodeInstruct/Reasoning] → St.2; (4) StarCoderData per ultimo (gating+GPL+size); (5) gym in parallelo bassa-priorità (RL=Wave6+).

---

## Incertezze trasversali (no hype)
- **Tutti i volumi/hyperparam = `[INFERRED]`/provisional**, ±40% sui dati RL. Calibrare con ablation (20%+scala). NON target rigidi.
- **Curva Nemotron 25k→736k NON trasferibile 1:1** (loro full-FT 8-253B; noi LoRA-r64/4B → satura prima). Il floor robusto resta, il ginocchio è ignoto.
- **DoRA+MiLoRA+RsLoRA+LoRA+ insieme** = componibilità non validata in letteratura → ablation, non assumere.
- **Full-FT Tier1 = A100 cloud** (non 2080Ti); valutare QLoRA-Tier1 per abbassare il costo.
- **Ref arXiv 26xx** (Dr.GRPO/DAPO/GiGPO/mtGRPO/RHB/BenchJack/Tina/Nemotron...) = da confermare prima di citarli pubblicamente.
- **PBRS sotto GRPO**: invarianza asintotica, da verificare empiricamente (non assumere) → phase-reward gate-dietro-ablation.

> **Next**: discussione con l'utente ("capiamo bene insieme") → poi finalizzare le decisioni aperte (§6.5 di [[training-curriculum-design]]) + smoke-test componibilità. Tracciato in `wiki/todo.md`.
