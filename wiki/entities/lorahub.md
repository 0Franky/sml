---
name: lorahub
description: LoraHub — composizione gradient-free di LoRA con few-shot. Huang et al. 2023 (COLM 2024).
type: entity
entity_type: paper
tags: [paper, lora, composition, few-shot]
sources: [https://arxiv.org/abs/2307.13269]
last_updated: 2026-05-21
---

# LoraHub

## Riferimento

- Paper: https://arxiv.org/abs/2307.13269 (**Huang, Liu, Lin, Pang, Du, Lin**, 2023)
- Titolo: "LoraHub: Efficient Cross-Task Generalization via Dynamic LoRA Composition"
- Venue: COLM 2024

> Nota: in versione iniziale di questa pagina avevo citato "Sun et al." — è ERRATO. Il first author è **Huang Chengsong**. Corretto 2026-05-21 dopo paper verification sweep.

## Cosa fa

Compone N (es. 196) LoRA pre-trainati su task diversi per generalizzare cross-task. La composizione usa **gradient-free optimization** (es. evolutionary search) su ~5 esempi del nuovo task target → no retraining, no router neurale.

## Perché rilevante per noi

- **Modulo "carica i LoRA giusti dato un nuovo task"** senza dover trainare un router.
- Pattern utile se in futuro avessimo tanti LoRA verticali (es. 20+) e volessimo scoprire automaticamente quale combo serve per un task ibrido (es. "fai frontend + backend insieme").

## Limiti per il nostro caso

- LoraHub punta a **cross-task generalization**, non a coding specialization profonda.
- Composition è additiva pesata — non risolve interferenza strutturalmente, solo statisticamente.
- Su pochi LoRA (3-5) il vantaggio vs hot-swap deterministico è marginale.

## Quando usarlo

- Phase 3 se avremo >10 LoRA verticali e vogliamo composizione dinamica
- Come baseline scientifico contro cui valutare l'orchestrator-driven routing nostro

## Confidence

- Esistenza paper + repo: **[EXTRACTED]**
- Applicabilità diretta al nostro setup: **[INFERRED]** — concetto trasferibile ma dettagli vanno verificati

## Link interni

- [[hmora]]
- [[x-lora]]
- [[mole]]
- [[architecture/three-tier-design]]
