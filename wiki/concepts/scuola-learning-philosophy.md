---
name: scuola-learning-philosophy
description: Filosofia di training "come la scuola" — copiare → capire le basi → allenarsi → migliorare. Analogia bambini per design pre/main/post training.
type: concept
tags: [concept, training, philosophy, curriculum-learning, child-development, pipeline-design]
sources: [user notes 2026-05-21 grill-me discussion]
last_updated: 2026-05-21
---

# Filosofia di Training "Come la Scuola"

## Citazione ground truth (utente, 2026-05-21)

> **"Come la scuola, inizi a copiare, poi a capire le basi, poi ti alleni e migliori."**

## Cosa significa

L'apprendimento del modello deve **emulare il percorso umano**:

| Fase scuola | Fase training del modello | Cosa fa il modello |
|---|---|---|
| **Copiare** (asilo, scuole elementari) | **Pre-training** | Memorizza fatti immutabili. Vede tanti testi, codici, formule. Impara linguaggio, fatti, pattern statistici. Non capisce ancora — copia |
| **Capire le basi** (medie, primo liceo) | **SFT / Instruction tuning** | Impara struttura del thinking, pattern di problem-solving, regole base. Vede esempi etichettati di "come si fa" |
| **Allenarsi** (liceo, università) | **Reinforcement learning + post-training** | Riceve feedback, sbaglia, corregge. Sviluppa "intuizione" attraverso pratica con reward |
| **Migliorare** (lavoro, esperienza) | **Path optimization + impratichimento + memo system** | Ottimizza i path frequenti (impratichimento). Mantiene memo di errori. Diventa più veloce ed efficace su task ricorrenti |

L'utente ha esplicitato: **"dobbiamo progettare pre-training, training e post-training con questa filosofia, facendo anche somiglianze ed esempi con i bambini per capire come evolvono loro e il percorso incrementale di apprendimento che hanno."**

## Connessioni con scienza dell'apprendimento umano

L'analogia con sviluppo cognitivo dei bambini ha basi solide:

### Piaget (Stages of Cognitive Development)

1. **Sensorimotor (0-2 anni)**: imitazione, copia diretta → analogo pre-training (next-token prediction = imitate the data distribution)
2. **Pre-operational (2-7)**: simboli, language emergence → analogo SFT (impara a usare strutture linguistiche)
3. **Concrete operational (7-11)**: reasoning logico su concreti → analogo RL su task definiti
4. **Formal operational (11+)**: astrazione, ipotesi → analogo path optimization, generalizzazione

### Vygotsky (Zone of Proximal Development)

- Bambino impara meglio in **zona di sviluppo prossimale**: difficoltà appena oltre il suo livello attuale
- Analogia: **curriculum learning** — difficulty progressiva del dataset, non random
- Implementazione: i sample fissi prima, poi mix con varianti, poi solo varianti complete

### Tomasello (Shared Intentionality, Imitation)

- Bambini imparano per **imitazione strutturata** (non copia cieca, ma cogliendo l'intent)
- Analogia: pre-training con **structured imitation** (dataset annotato con `reasoning + target`)

### Karmiloff-Smith (Representational Redescription)

- Conoscenza si **rideriva a livelli di astrazione successivi**
- Analogia: post-training distillation (vedi [[post-rl-path-optimization]]) compresses path low-level in high-level templates

## Implicazioni operative per il nostro progetto

### Pre-training (Step 1-3, base full-FT — già parzialmente fatto dai Qwen team)

Sfruttare il pretraining base esistente di Qwen3-4B/8B/3.6-35B-A3B. Il modello ha già "copiato" milioni di testi e codici. Non lo facciamo noi from scratch.

**Nostro intervento** in questa fase: nessuno. Usiamo Qwen3 pretrained come punto di partenza.

### "Capire le basi" — Full-FT Tier 1 (Organization Specialist)

Qui interveniamo. Insegniamo al modello a **strutturare il pensiero** e **organizzare task** con:

- Dataset di task decomposition + planning multi-step (vedi [[../architecture/orchestrator-layer]] dataset breakdown)
- Pattern di reasoning strutturato ([[structured-thinking]])
- Format di context strutturato ([[structured-context-sections]])
- Safety reasoning + criticality awareness ([[pre-flight-safety-checks]])

Sample dataset combinano:
- **Fissi**: tag strutturali, vocabolario marker, pattern di reasoning canonical
- **Random**: nomi task, contenuti asset, paths, timestamps ([[runtime-symbol-randomization-training]])
- **Dinamici nel context**: lunghezze sezioni e combinazioni variabili ([[dynamic-context-training-regime]])

### "Allenarsi" — Post-training RL su Tier 1

Dopo SFT, RL feedback su:
- **Buon naming** quando il modello deve creare variabili (compensa il regime random che insegna solo copy)
- **Buona decomposizione** task (chunk size, ordine logico, dipendenze esplicite)
- **Buona awareness criticità** (chiede conferma quando appropriato, no falsi allarmi cronici)
- **Buona efficienza** token (caveman thinking che non spreca)

Tecniche: ORPO (single-stage preference optimization), GRPO (group RL per reasoning).

### "Allenarsi parte 2" — LoRA Tier 2-3

Specializzazione su coding tramite LoRA aggiunti sopra il Tier 1. Stesso schema (fisso/random/dinamico) ma con focus coding-specific.

### "Migliorare" — Self-supervision loop runtime

In produzione, [[error-memo-system]] + [[contradiction-detection-layer]] + [[post-rl-path-optimization]] formano il **loop continuo di apprendimento** (Pattern β della ricerca correlata). È la fase "esperienza lavorativa" — il modello continua a migliorare senza retraining base.

## Sequenza canonical (data il three-tier)

```
[Qwen3 base pretrained] (pre-training fatto dai vendor)
                ↓
[FT Tier 1 — Organization]
   - copia: struttura tag fissi, vocabolario marker
   - capire: pattern reasoning, planning multi-step
   - dati: fissi (fisica, math, fatti) + random (nomi task) + dinamico (context layout)
                ↓
[RL Tier 1 — Organization refinement]
   - allenarsi: buon naming, decomposizione, criticality
   - tecniche: ORPO/GRPO
                ↓
[Distillation Tier 2 — Programming generalist LoRA]
   - copia: pattern coding generic, sintassi keyword
   - capire: scelta stack, code quality
   - dati: ibrido random+naturale (vedi [[runtime-symbol-randomization-training]])
                ↓
[Distillation Tier 3 — Vertical LoRA]
   - copia: idioms del framework
   - capire: best practice stack-specific
   - dati: random extensivo per skill copy + naturale per fluency
                ↓
[Runtime self-supervision loop]
   - migliorare: error-memo, contradiction-detection, path-optimization
   - LoRA swap incrementale senza retraining base
```

## Trade-off filosofici

| Pro | Contro |
|---|---|
| Analogia chiara guida decisioni di design | Analogie con bambini possono essere fuorvianti (cervello ≠ transformer) |
| Curriculum learning ha evidenze solide (paper) | Difficile quantificare "fase scuola" in cui sta il modello |
| Pipeline naturale, non forzata | Tempo training cumulativo lungo |
| Sequenza modulare permette esperimenti | Errori in fase iniziale propagano (catastrophic forgetting) |

## Riferimenti scientifici

| Lavoro | Contributo | Allineamento |
|---|---|---|
| Bengio et al. 2009, **Curriculum Learning** | Difficulty-progressive training | Pre-training → SFT → RL ricalca questo |
| **Self-Refine** (Madaan 2023) | Modello impara a critically iterate | Fase "allenarsi" |
| **Reflexion** (Shinn 2023) | Memory di mistakes | Fase "migliorare" |
| **Voyager** (Wang 2023) | Skill library che accumula | Fase "migliorare" loop |
| Sutton et al., **Reinforcement Learning intro** | RL = trial-and-error con reward | Fase "allenarsi" |
| **Constitutional AI** (Bai et al. 2022) | Self-critique come training | Fase "capire + allenarsi" |
| Karpathy "School of Hard Knocks" analogy (blog) | Stessa analogia AI ↔ scuola | Concettualmente identico al nostro |
| **Distilling Step-by-Step!** (Hsieh 2023) | Reasoning + distillation | Fase "migliorare" |
| Piaget, Vygotsky, Tomasello, Karmiloff-Smith | Cognitive science di dev. cognitivo | Frame teorico per analogie |

## Open questions

- Come **quantificare** se il modello è in fase "copia" vs "capisce"? Metric concrete?
- Quando passare da SFT a RL? Soglia di loss o validation?
- Curriculum learning interno SFT: dati "easy" prima, "hard" dopo. Definizione di difficulty?
- Catastrophic forgetting tra fasi: come prevenire degrado di skill precedenti?
- Quanto è dannoso "saltare" una fase? (Es. pretrained + RL senza SFT)

## Link interni

- [[runtime-symbol-randomization-training]] — il "come si copia" durante training
- [[dynamic-context-training-regime]] — il "come si studia" la struttura
- [[post-rl-path-optimization]] — la fase "migliorare"
- [[error-memo-system]] — meccanismo di "migliorare con esperienza"
- [[../architecture/orchestrator-layer]] — Tier 1 è dove la filosofia si applica primariamente
- [[../decisions/2026-05-21-training-philosophy-roadmap]] — roadmap concreta basata su questa filosofia

## Sources

- User notes 2026-05-21 grill-me discussion ("come la scuola, inizi a copiare...")
- Bengio et al. 2009 "Curriculum Learning": https://dl.acm.org/doi/10.1145/1553374.1553380
- Piaget, "The Origins of Intelligence in Children" (1936)
- Vygotsky, "Mind in Society" (1978)
- Tomasello, "The Cultural Origins of Human Cognition" (1999)
- Constitutional AI (Bai 2022): https://arxiv.org/abs/2212.08073
- Voyager (Wang 2023): https://arxiv.org/abs/2305.16291
- Self-Refine (Madaan 2023): https://arxiv.org/abs/2303.17651
