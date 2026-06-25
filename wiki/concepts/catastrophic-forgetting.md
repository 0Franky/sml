---
name: catastrophic-forgetting
description: Degrado della knowledge generale durante fine-tuning specializzato. Rischio Tier 1.
type: concept
tags: [concept, training, forgetting, mitigation]
sources: [https://arxiv.org/pdf/2401.05605]
last_updated: 2026-05-21
---

# Catastrophic Forgetting

## Problema

Quando fine-tuniamo un modello su un task specifico, il modello tende a "dimenticare" capacità su altri task — specialmente quelle sviluppate durante il pretraining generale.

Nel nostro setup il rischio è massimo per **Tier 1 (orchestrator)**: facciamo full-FT del base su task organizzativi (planning, routing decision, decomposition). Rischio: il modello perde la conoscenza di coding presente nel base.

## Evidenza letteratura

Paper di riferimento: "Scaling Laws for Forgetting When Fine-Tuning Large Language Models" (https://arxiv.org/pdf/2401.05605).

Insight chiave:
- Forgetting cresce con **numero di step di fine-tuning** e **divergenza task** dal pretraining
- Modelli più grandi forgettano di **meno** a parità di training
- LoRA forgetta **di meno** del full-FT (perché tocca meno parametri)
- Il forgetting è quasi-monotonico — early stopping aiuta

## Mitigazioni

### 1. Replay (raccomandato per noi)

Mischiare nel dataset di training del Tier 1 una percentuale di dati del pretraining originale (in particolare: dati coding generic).

- Percentuale: 10-20% del dataset orchestrator
- Sources: subset del pretraining coding (The Stack v2 filtrato), oppure CommitPackFT, OSS-Instruct
- Effetto: modello continua a vedere coding examples durante FT → conoscenza non si erode

### 2. Regularization (LoRA o low-rank)

Usare LoRA grande (r=128+) invece di full-FT per Tier 1. Limita drift dei pesi del base.

- Trade-off: meno capacità di apprendimento, ma molto meno forgetting

### 3. Elastic Weight Consolidation (EWC)

Penalizzare cambiamenti ai pesi "importanti" per il pretraining task. Tecnica datata ma applicabile.

- Costo: serve calcolare Fisher information matrix
- Beneficio: forgetting più graduale

### 4. Monitoring continuo durante training

Misurare forgetting in real-time:
- Run benchmark coding (LiveCodeBench, BigCodeBench) ogni N step di training
- Se score scende >5% rispetto al base → early stop

## Implementazione concreta nel nostro setup

Per Tier 1 (orchestrator full-FT):

```text
# Pseudo-dataset
dataset_tier1 = [
    orchestrator_examples,        # 80-85% — task planning/decomposition
    coding_replay_examples,       # 15-20% — coding generic da replay set
]

# Training loop pseudo
ogni 100 step:
    score_coding = run_benchmark(LiveCodeBench_subset, model)
    se score_coding < baseline * 0.95:
        early_stop("forgetting threshold hit")
```

## Open questions

[[open-questions]] #13 (percentuale replay) — da decidere empiricamente.

## Confidence

- Esistenza problema: **[EXTRACTED]** (multipli paper)
- Quantità replay ottimale: **[AMBIGUOUS]** — 10-20% è range tipico, valore esatto domain-specific

## Link interni

- [[architecture/orchestrator-layer]]
- [[concepts/lora-stacking]]
- [[concepts/eval-modern-coding]]
- [[open-questions]]
