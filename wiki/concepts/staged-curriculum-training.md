---
name: staged-curriculum-training
description: Curriculum SFT a stadi incrementali — reasoning → organization → criticality → coding. Loss abbassata sezione per sezione.
type: concept
tags: [concept, training, curriculum-learning, sft, multi-stage, scuola-philosophy, incremental]
sources: [user notes 2026-05-21 grill-me discussion, Bengio 2009 Curriculum Learning, scuola-learning-philosophy concept]
last_updated: 2026-05-21
---

# Staged Curriculum Training (idea utente)

## Trigger utente (2026-05-21)

L'utente, durante la chiusura di open question #15 (post-training), ha aggiunto una proposta originale:

> "Sarebbe possibile fare prima parte di training SOLO sui task di reasoning → poi organizzazione → poi coding e il resto? Vorrei abbassare la loss sezione per sezione: `<sezione solo reasoning>` → `<sezione reasoning + organization>` → `<sezione reasoning + organization + awareness>` → `<sezione reasoning + organization + awareness + coding>`"

## L'idea in dettaglio

Training SFT **stage-by-stage incrementale**, ognuno consolida una nuova capability sopra il precedente abbassando loss su quella specifica skill.

### Schema architetturale

```
STAGE 1: Solo reasoning strutturato
  dataset: ~5K sample (caveman thinking, marker [V]/[A]/[?], scheda contesto)
  output: modello che ha appreso FORMAT del thinking
  eval: format compliance, structure correctness
  loss target: bassa su token di structure (tag, marker)
                          ↓ (checkpoint stage 1)
STAGE 2: + Organization (planning, decomposition, state tracking)
  dataset: Stage 1 (5K) + organization (10K) = 15K total
  output: modello che pianifica + struttura il pensiero
  eval: AgentBench OS, τ-Bench multi-turn
  loss target: bassa su both reasoning + organization
                          ↓ (checkpoint stage 2)
STAGE 3: + Criticality awareness + safety reasoning
  dataset: Stage 2 (15K) + criticality (8K) = 23K total
  output: modello con awareness criticità implicite (es. file cancellation)
  eval: custom criticality 200 task
  loss target: bassa su criticality + previous
                          ↓ (checkpoint stage 3)
STAGE 4: + Coding replay + generic
  dataset: Stage 3 (23K) + coding (3K) + generic (4K) = 30K total
  output: Tier 1 finale (organization specialist completo)
  eval: HumanEval (forgetting check) + LiveCodeBench + tutti i previous
  loss target: bilanciata su tutte le sezioni
```

## Why funziona (basato su letteratura)

### 1. Curriculum Learning (Bengio 2009)

Difficulty-progressive training migliora convergenza + final performance. Standard ML wisdom. Vedi [[scuola-learning-philosophy]].

### 2. Catastrophic forgetting mitigation by replay

Ogni stage include dati degli stage precedenti → previene oblivion. Approccio standard SFT.

### 3. Scaffolded skill acquisition

Cognitive science: bambini imparano skill complesse impilando skill semplici (Vygotsky zone of proximal development). Analogia diretta col nostro Tier 1.

### 4. Modular interpretability

Checkpoint dopo ogni stage permette **ablation studies**: "quale stage ha contribuito quanto al final performance?" — utile per paper.

### 5. Riferimenti SOTA

- **Phi-3 methodology** (Microsoft 2024): data curriculum staged
- **DeepSeek-R1** (Tech report 2025): multi-stage SFT + RL incremental
- **rStar-Math** (Microsoft 2025): training stage-by-stage per reasoning, da [[../entities/rstar-math-paper]]

## Trade-off

| Pro | Contro |
|---|---|
| Cognitivamente "naturale" (come scuola) | 4 training run sequenziali = 4× wall-clock vs single-stage |
| Loss bassa per skill specifica | Catastrophic forgetting tra stage se replay mal dimensionato |
| Checkpoint intermedi = ablation utile per paper | Curriculum design non triviale (in che ordine? quanti stage? quanti sample per stage?) |
| Bridge naturale con [[scuola-learning-philosophy]] | Difficile validare empiricamente "è meglio staged?" — richiede ablation single-stage vs staged |
| Eval per stage = debug più granulare | Storage overhead (4 checkpoint vs 1) |

## Failure modes e mitigazioni

### 1. Stage N degrada stage N-1

- **Rischio**: Stage 3 (criticality) può degradare Stage 2 (organization) se dataset criticality contiene examples che spostano distribution.
- **Mitigazione**: replay aggressivo dei sample previous stage (≥30% del dataset stage N viene da stage 1..N-1).

### 2. Catastrophic forgetting in stage 4

- **Rischio**: Stage 4 (coding replay 10%) può degradare le 3 fasi precedenti se distribuzione coding è troppo diversa.
- **Mitigazione**: Stage 4 coding replay molto basso (5-10% del NUOVO dataset, non 5-10% del totale). Replay del 30%+ dai stage 1-3.

### 3. Loss "non scende" per uno stage specifico

- **Rischio**: Stage 2 organization dataset insufficient → loss plateau alta → modello non impara organization bene.
- **Mitigazione**: monitor per stage. Se loss plateau → aumenta dataset stage N prima di passare a N+1.

### 4. Sequencing wrong (curriculum order matters)

- **Rischio**: order reasoning → organization → criticality → coding è ipotesi. Potrebbe essere meglio organization → reasoning → criticality → coding?
- **Mitigazione**: ablation in Wave 6+ (cloud) per testare order alternative.

## Confronto con single-stage SFT

Stessa quantità di sample totale (30K), distribuzione finale identica, vs:

| Approccio | Wall-clock | VRAM | Checkpoint | Catastrophic forgetting risk | Validabilità incrementale |
|---|---|---|---|---|---|
| **Single-stage** (30K shuffled) | 1× | normal | 1 | medio (no scaffolding) | bassa (solo finale) |
| **Staged 4 fasi** (5K → 15K → 23K → 30K) | 2-3× | normal | 4 | basso (replay built-in) | alta (per stage) |

ROI: 2-3× tempo, ma ottieni:
- Modello potenzialmente migliore (curriculum vantage)
- 4 checkpoint per ablation
- Insight su quale skill è più "costosa" da apprendere
- Material per paper (claim staged > shuffled)

## Implementazione MVP v1 (Wave 5)

Adottiamo **staged curriculum** in MVP v1:

```python
# Pseudocode Wave 5
stages = [
    ('reasoning_only', dataset_reasoning_5k, epochs=3),
    ('reasoning_organization', dataset_reasoning + dataset_organization_10k, epochs=2),
    ('reasoning_org_criticality', stage2_dataset + dataset_criticality_8k, epochs=2),
    ('full_tier1', stage3_dataset + coding_3k + generic_4k, epochs=2),
]

current_model = qwen3_4b_pretrained
for name, data, epochs in stages:
    print(f'Training stage {name} with {len(data)} samples')
    current_model = sft_train(current_model, data, epochs=epochs, lr=2e-4, lora_config=...)
    save_checkpoint(current_model, f'tier1_{name}.ckpt')
    eval_intermediate(current_model, stage_eval_suite[name])
```

Stage del MVP v1 stimato:
- Stage 1: 5K × 3 epoch = 15K step ≈ 1-2 ore su 2080 Ti
- Stage 2: 15K × 2 epoch = 30K step ≈ 3-5 ore
- Stage 3: 23K × 2 epoch = 46K step ≈ 5-8 ore
- Stage 4: 30K × 2 epoch = 60K step ≈ 7-10 ore
- **Totale**: 16-25 ore di training + eval intermedi

vs single-stage 30K × 3 epoch = 12-15 ore. Overhead ~50% accettabile per i benefici.

## Bridge con altri concept

- [[scientific-method-operating-protocol]] — il protocollo metodo-scientifico si integra negli stage (gli stage reasoning→organization→criticality→coding ne realizzano la Fase 1 lungo-corretta); la Fase 2 ottimizza i path appresi
- [[scuola-learning-philosophy]] — questo concept È l'implementazione concreta della filosofia "come la scuola"
- [[catastrophic-forgetting]] — replay tra stage = mitigation standard
- [[runtime-symbol-randomization-training]] — il regime symbol random si applica DENTRO ogni stage (specie stage 4 coding)
- [[dynamic-context-training-regime]] — il context dinamico si applica DENTRO ogni stage
- [[pipeline-architecture-data-generation]] — generator deve produrre dataset per ciascun stage separatamente (e per stage 4 anche il coding subset)
- [[../entities/rstar-math-paper]] — esempio reference di multi-stage training

## Open questions

- Optimal stage order — reasoning prima o organization prima? Da validare empiricamente
- Replay ratio inter-stage — 30% raccomandato standard, ma testare 20-50%
- Numero di stage — 4 stage o sub-stage più granulari (es. organization = planning + decomposition + state separati)?
- Stage RL invece di SFT in Wave 6 — il curriculum staged si può applicare anche a RL? (ORPO stage 1 reasoning prefs, stage 2 organization prefs, etc.)

## Status

`approved-by-user` — adottato in MVP v1 (Wave 5). Wave 6+ può evolvere.

## Sources

- User notes 2026-05-21 grill-me (idea originale)
- Bengio et al. 2009 "Curriculum Learning" ICML
- [[scuola-learning-philosophy]]
- Phi-3 Technical Report (Microsoft 2024)
- DeepSeek-R1 Technical Report
- [[../entities/rstar-math-paper]]
