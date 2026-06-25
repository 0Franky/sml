---
name: vertical-loras
description: Tier 3 — LoRA verticali stack-specifici. Caricati uno alla volta sopra programming.
type: architecture
tags: [tier3, lora, verticals, stacks]
status: design-phase
last_updated: 2026-05-21
---

# Tier 3 — Vertical LoRAs

## Responsabilità

Generare codice idiomatico in una tecnologia/stack specifico. Conoscenza profonda di framework, convenzioni, edge case, integrazioni con ecosistema.

## Candidati domini

Da decidere in [[open-questions]] #9. Opzioni discusse:

**Granularità fine (stack-singolo)**:
- React / Vue / Angular separati
- FastAPI / Django / Express separati
- Postgres / MongoDB / Redis separati

**Granularità larga (area)**:
- Frontend (React + Next + TypeScript + styling)
- Backend Python (FastAPI + Django + asyncio + pytest)
- Backend Node (Express + Nest + TypeScript)
- Data (Pandas + SQL + ETL + DuckDB)
- DevOps (Docker + K8s + Terraform + CI/CD)
- Mobile (Flutter / React Native)
- AI/ML (PyTorch + transformers + RL)

**Trade-off**:
- Fine = LoRA piccoli, più mirati, più LoRA totali → più training, eval più granulare
- Larga = LoRA più grandi, meno LoRA totali, knowledge volatile (React cambia ogni 6 mesi, "Frontend" cambia più lentamente)

## Implementazione

- **Method**: QLoRA 4-bit, rank 16-64 (più basso di programming generalist — domini specializzati hanno meno capacità necessaria), alpha 32-64.
- **Target modules**: stesso di programming (`all-linear`) per consistenza.
- **Training data**:
  - Codice idiomatico nello stack (filtrato per qualità, deduplicated)
  - Esempi di pattern frequenti del framework
  - Integration examples con altri tool dell'ecosistema
  - Eventuale Q&A specifica (Stack Overflow filtrato, doc framework)

## Caricamento

**One at a time**: solo un verticale attivo per inference. Il sistema (vLLM `--enable-lora`) hot-swappa quando l'orchestratore lo richiede.

**Stacking con Tier 2**: programming generalist + verticale caricati insieme. Composition-aware training necessario per evitare interferenza (vedi [[concepts/lora-stacking]]).

## Rischi noti

1. **Knowledge volatility**: framework cambiano. Un LoRA addestrato a maggio 2026 su React può essere stantio entro novembre 2026.
   - Mitigazione: re-training periodico, oppure dominio più largo (riduce churn).

2. **Cross-domain bleeding**: LoRA frontend potrebbe degradare performance backend quando attivo.
   - Mitigazione: eval cross-domain dopo ogni LoRA training (LoRA frontend NON deve degradare backend eval).

3. **Dataset insufficiente per stack di nicchia**: alcuni stack hanno meno codice OSS pubblico → dataset piccolo → LoRA debole.
   - Mitigazione: synthesis con modelli più forti (Qwen3.6-Max, Claude, GPT) + verifica esecuzione test.

4. **Forgetting cross-LoRA**: verticali addestrati indipendentemente, se composti additivamente con programming → interferenza.
   - Mitigazione: composition-aware training (vedi [[programming-generalist]]).

## Pipeline di training (proposta)

```
1. Dataset preparation
   - Sources: The Stack v2 filtered, OSS-Instruct, Magicoder, framework doc, internal codebase
   - Quality filter: test execution per snippet eseguibili, decontamination vs eval set
   - Dedup MinHash
   - Chat format conversion

2. Training (per verticale, in parallelo se possibile)
   - QLoRA r=16-64, lr 2e-4 cosine, 3 epochs
   - Composition-aware: programming LoRA caricato + frozen
   - Early stopping su domain-specific eval

3. Eval
   - Domain-specific custom (200-500 task)
   - Cross-domain regression check (LiveCodeBench, BigCodeBench)
   - Human eval su 50 sample
```

## Open questions

[[open-questions]] #9, #14, #16, #17.

## Stato

Design-phase. Lista domini da chiudere in grill-me.
