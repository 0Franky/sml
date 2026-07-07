---
name: open-pretraining-corpora
description: "Reference — corpus di pre-training OPEN di alta qualità (risposta utente msg 1319). Qwen/DeepSeek NON rilasciano il loro corpus (open-weight, non open-data); alternative open attestate: FineWeb-Edu, Dolma, SmolLM-Corpus, Nemotron-CC, ecc. Con note su cosa serve al NOSTRO caso (continual-pretrain su Qwen)."
type: reference
tags: [pre-training, datasets, corpus, foundation, open-data, reference]
last_updated: 2026-07-08
sources:
  - user msg 1319 (2026-07-07/08) "esiste un foundation corpus già attestato/approvato... Qwen o DeepSeek?"
  - HuggingFace FineWeb / FineWeb-Edu; AI2 Dolma/OLMo; NVIDIA Nemotron-CC; arXiv:2505.05427 (Ultra-FineWeb); arXiv:2509.25531 (MixtureVitae)
---

# Corpus di pre-training OPEN di alta qualità (reference)

## Risposta diretta: Qwen / DeepSeek rilasciano il loro corpus?
**NO.** Sono **open-WEIGHT, non open-DATA** `[EST]`: rilasciano i pesi (+ report architetturale), ma il **corpus di pre-training resta PROPRIETARIO**. Qwen3 ~36T token, DeepSeek-V3 ~14.8T token — nessuno dei due pubblica il dataset. Quindi non esiste "il corpus di Qwen/DeepSeek" da riusare.

## Ma esistono ottimi corpus OPEN, attestati e usati (le vere opzioni)

| Corpus | Cosa è | Perché rilevante |
|---|---|---|
| **FineWeb-Edu** (HuggingFace) | ~1.3T token, sottoinsieme *educational-filtered* di FineWeb (96 snapshot CommonCrawl, filtraggio aggressivo) | ⭐ **Top per QUALITÀ/RAGIONAMENTO**: batte gli altri web-dataset open sui benchmark; reasoning/knowledge-dense = allineato al nostro "intelligenza-first" |
| **Ultra-FineWeb** (arXiv:2505.05427) | FineWeb filtrato/verificato in modo più efficiente | versione più pulita/efficiente di FineWeb |
| **Dolma** (AI2, dietro OLMo) | ~3T token: web + paper scientifici + codice + Wikipedia + libri + social | ⭐ **Top per TRASPARENZA/COMPLETEZZA**: ogni fonte/filtro/step documentato; full-open riproducibile |
| **SmolLM-Corpus** (HuggingFace) | Cosmopedia (textbook SINTETICI) + FineWeb-Edu + Python-Edu | ⭐ **Pensato per SLM CAPACI**: filosofia "textbooks are all you need" = qualità>quantità, ideale per un modello piccolo intelligente |
| **Nemotron-CC** (NVIDIA) | ~trilioni di token da CommonCrawl con perplexity + ensemble-quality + synthetic | pipeline di curation forte, multitask-ready |
| **MixtureVitae** (arXiv:2509.25531) | web-scale *permissive-first* + instruction/reasoning di qualità | se conta la LICENZA (dati permissivi) + reasoning |
| **Common Corpus** | il più grande set *etico/permissivo* | licenze pulite |

**Per dominio** (da mixare): **The Stack v2 / StarCoderData** (codice — a noi serve MINIMALE, msg 1312) · **OpenWebMath / FineMath** (matematica) · **Cosmopedia** (textbook sintetici) · Wikipedia + Stack Exchange + libri.

## Cosa serve al NOSTRO caso (importante — non confondere i due scenari)
- **Ora facciamo CONTINUAL-pretraining su Qwen** (NON from-scratch, [[project_training_approach_decided]]): Qwen HA GIÀ ingoiato un foundation-corpus enorme. Non ci serve un foundation-corpus completo — ci serve un **corpus di SPECIALIZZAZIONE + replay di alta qualità** (ragionamento/teoria + il replay anti-forgetting, [[project_replay_strategy]]). Per questo: **FineWeb-Edu + FineMath + Cosmopedia** come substrato di ragionamento, un po' di **The Stack v2** (coding minimale msg 1312), + il nostro training-set custom (la taxonomy).
- **Per un SLM FROM-SCRATCH futuro** (lo scenario "riusabile paro paro" del msg 1312): LÌ serve il foundation-corpus completo → **Dolma** (full-open, riproducibile) o **FineWeb(-Edu) + The Stack v2 + OpenWebMath** come base, POI il nostro set di specializzazione sopra. Vedi il caveat in [[decisions/2026-07-08-tier2-justification-analysis]] (il nostro set è la specializzazione; la foundation va anteposta).

## Cross-link
[[project_training_approach_decided]] · [[project_replay_strategy]] · [[concepts/training-intelligence-optimization]] (§3 dati-qualità) · [[decisions/2026-07-08-tier2-justification-analysis]] · [[reference_papers]]
