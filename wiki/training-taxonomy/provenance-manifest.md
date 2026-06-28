---
name: provenance-manifest
description: Manifest di tracciabilità (legal-defense) dei dataset di training — per OGNI fonte usata: dataset → teacher-model → licenza → verdetto commerciale → note. Principio: per un modello da vendere il rischio è il TEACHER-MODEL, non il tag del dataset. Living document, da aggiornare a ogni fonte aggiunta + ri-verificare i tag al momento dell'uso. Richiesto utente msg 245.
type: manifest
tags: [dataset, licensing, provenance, commercial, legal, training-data]
sources: [user msg 2026-06-28 (245), 2 research-agent dataset (coding+instruction), research-agent Nemotron, 2026-06-28-open-decisions-briefing Parte 3]
last_updated: 2026-06-28
status: living — verificare i tag licenza al momento dell'uso
---

# Provenance Manifest — dataset di training

> **Scopo** (utente msg 245): tracciabilità legale per il north-star commerciale. **Principio cardine**: il rischio commerciale è **CHI ha generato i dati** (teacher-model), NON il tag del dataset. Output di **GPT-4/Claude/Gemini** → ToS del provider vietano l'addestramento di concorrenti → 🔴 anche se il dataset è "MIT".
>
> ⚠️ **Disclaimer**: area legale grigia e non risolta (la copyrightability/sub-licensabilità degli output LLM non è settled law). Questo è **risk-minimization, NON una garanzia legale**. **Revisione legale obbligatoria prima del rilascio commerciale.** Ri-verificare ogni tag `license:` HF al momento dell'uso (i tag cambiano).

## ✅ Fonti APPROVATE per uso commerciale (shortlist)

| Dataset | Stadio | Teacher / fonte | Licenza | Verdetto | Note |
|---|---|---|---|---|---|
| **OpenAssistant oasst1/2** | SFT Tier1 | **Umani** | Apache-2.0 | ✅ pieno | base conversazionale, zero rischio-ToS |
| **databricks-dolly-15k** | SFT Tier1 | **Umani** | CC-BY-SA-3.0 | ✅ (ShareAlike) | attribuzione + share-alike |
| **FLAN** (Muennighoff/flan) | SFT/IF | **Template, no LLM** | per-componente | ✅ mostly | verificare per-componente |
| **NVIDIA HelpSteer2 / HelpSteer3** | Preference (st.4) | **Human-annotated** | CC-BY-4.0 puro | ✅ pieno | gold standard pulito; HelpSteer3 il più sicuro |
| **NVIDIA Daring-Anteater** | SFT generale | Mixtral (Apache) | CC-BY-4.0 | ✅ (misto) | subset FinQA/Open-Platypus da verificare |
| **NVIDIA Aegis v1/v2** | Safety (st.1) | Mistral/Gemma + **umani** | CC-BY-4.0 | ✅ pieno | safety/refusal pulito |
| **OpenCodeInstruct** (NVIDIA, 5M) | SFT coding (st.2) | **Qwen2.5-Coder-32B / QwQ** (open) | CC-BY-4.0 | ✅ (provenance da paper) | miglior SFT code clean; teacher nel paper non sulla card |
| **StarCoderData** (GPL-filtered) | grounding | codice reale | per-repo | ⚠️→✅ con filtro | **escludere GPL/AGPL** prima dell'uso |
| **opc-annealing-corpus** | pretrain/anneal | seed algoritmici | ODC-By | ✅ pieno | sintetico, no distillazione proprietaria |
| **opc-sft-stage2** (SOLO `educational`+`package`) | SFT coding | code-seed synth | MIT | ✅ (solo 2 subset) | **scarta `evol`/`mceval`** (GPT) |
| **SWE-Gym / R2E-Gym-env / SWE-smith-tasks** | RL (st.3) | codice reale / bug sintetici | MIT/Apache | ✅ **solo AMBIENTI** | NON le trajectory (Claude/GPT); genera le tue |
| **SWE-rebench** | eval/RL | GitHub rolling | CC-BY-4.0 | ✅ (per-repo) | primario come eval decontaminata |
| **argilla/ifeval-like-data · allenai/RLVR-IFeval** | IF/RLVR (st.1/3) | Qwen-open / regole | qwen / ODC-BY | ✅ | per RLVR (reward = regola, no teacher) |

## ⚠️ Fonti con CAVEAT (usabili con condizioni — segnalare nel manifest)

| Dataset | Caveat | Azione |
|---|---|---|
| **OpenR1-Math · OpenCodeReasoning · OpenMathReasoning · SYNTHETIC-1 · OpenThoughts** (R1-derived) | distillati da **DeepSeek-R1** (MIT, distillazione **esplicitamente permessa**) | ✅ usabili; **DOCUMENTARE** la provenance R1 nel manifest |
| **Nemotron-Post-Training v1** | DeepSeek-R1 + Qwen3 | ✅ con doc provenance |
| **Nemotron-Post-Training v2 / Llama-Nemotron-PT** | **MISTO**: CC-BY + **ODC-BY** (WildChat) + **CC-BY-SA** (StackOverflow) | ⚠️ NON uniforme; usare solo i subset CC-BY puliti |
| **Magpie-Llama-3.1** | Llama permette output-training MA obbliga nome "Llama-…" + "Built with Llama" | ⚠️ evita se vuoi brand libero |
| **tulu-3-sft-mixture** | misto: human + **GPT-4o personas + WildChat-GPT4** | ⚠️ FILTRA (droppa Persona-*/WildChat-GPT4/No-Robots) |

## 🔴 Fonti da EVITARE (commercial-unsafe)

- **Distillati da modelli CLOSED (GPT-4/Claude/Gemini)** — ToS no-compete (il tag permissivo è irrilevante): OpenHermes, Dolphin, OpenOrca/SlimOrca, UltraChat, Capybara, **Magicoder** (OSS/Evol), WizardCoder, **UltraFeedback** (+derivate), Nectar, orca_dpo_pairs, Conifer, coconot, wildjailbreak; + **trajectories** SWE-smith/R2E (Claude/GPT).
- **Licenza non-commerciale (NC)**: PKU-SafeRLHF/BeaverTails, facebook/natural_reasoning, No-Robots, chatbot_arena, Multi-IF.
- **Solo-eval (mai nel training, contaminazione)**: IFEval, Multi-IF, FollowBench, + i nostri benchmark (LiveCodeBench/SWE-Bench/custom-criticality).

## Igiene operativa (per vendere)
1. **Questo manifest** = la difesa legale: per ogni fonte effettivamente addestrata, riga dataset→teacher→licenza→verdetto.
2. File **NOTICE/attribuzione** (ODC-BY, CC-BY, CC-BY-SA richiedono attribuzione; SA aggiunge share-alike).
3. **Ri-verificare i tag** licenza HF al momento dell'uso.
4. **Decontaminazione** vs tutti i benchmark held-out (embedding-similarity, non solo n-gram).
5. **Giudice/RLAIF**: usare DeepSeek (permissivo, D5), **mai** GPT-4/Claude come teacher/giudice per un modello da vendere (→ vedi domanda-council in `wiki/todo.md`).
6. **Revisione legale prima del rilascio commerciale** (area grigia).

## Linked
- [[training-curriculum-design]] (quale dataset per quale stadio) · [[../decisions/2026-06-28-open-decisions-briefing]] Parte 3 · [[data-volume-estimate]]
