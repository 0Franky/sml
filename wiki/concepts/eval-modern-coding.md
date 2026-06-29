---
name: eval-modern-coding
description: Benchmark di riferimento per coding LLM nel 2026. HumanEval saturo, usare benchmark agentici.
type: concept
tags: [concept, evaluation, benchmark, coding]
last_updated: 2026-05-21
---

# Eval moderno per coding LLM (2026)

## TL;DR

**Non usare HumanEval/MBPP da soli**. Saturi, non discriminano i modelli moderni. Usare benchmark moderni: SWE-Bench Verified, LiveCodeBench, BigCodeBench, Aider polyglot. Plus custom domain-specific.

## Benchmark obbligatori

### SWE-Bench Verified

- **Cosa misura**: capacità di risolvere issue real-world da repo open source (GitHub PR pairs)
- **Perché**: agentic, multi-file, real production code
- **URL**: https://www.swebench.com
- **Verifica**: usare il subset "Verified" (validato manualmente)

### LiveCodeBench

- **Cosa misura**: problemi di programmazione competitiva, **contamination-free**
- **Perché**: si aggiorna periodicamente con problemi nuovi → impossibile aver visto nel pretraining
- **URL**: https://livecodebench.github.io

### BigCodeBench

- **Cosa misura**: function calls diverse, library usage, multi-step coding
- **Perché**: cattura "scripting real-world" più di HumanEval
- **URL**: https://bigcode-bench.github.io

### Aider Polyglot

- **Cosa misura**: editing multi-language, multi-file, multi-turn
- **Perché**: testa "coding come dialogo" — il caso che ci interessa più dell'autocomplete
- **URL**: https://aider.chat/docs/leaderboards/

## Benchmark da NON usare da soli

### HumanEval

Saturo. I migliori modelli > 90%. Non discrimina più tra modelli moderni.

### MBPP

Stesso. Saturo per modelli 2024+.

(Usare solo come **sanity check** o per confrontare con paper vecchi.)

## Custom eval domain-specific (per i nostri verticali)

Per ogni LoRA verticale (frontend, backend, ecc.):

- 200-500 task interni con esecuzione automatica test
- Coverage:
  - Codice idiomatico (best practice)
  - Edge case (error handling, async, race)
  - Multi-turn refactoring
  - Integration con altri tool dell'ecosistema
- Human eval su 50 sample per validare metriche automatiche

## Eval baseline (Phase 0)

Prima di iniziare training:

```
Misura Qwen3-Coder base su:
- SWE-Bench Verified (full, o subset Lite se troppo lento)
- LiveCodeBench (ultimo snapshot)
- BigCodeBench
- Aider polyglot

Numeri → baseline. Ogni LoRA verticale deve battere baseline ≥5% sul domain-specific eval senza degradare gli altri.
```

## Compounding error

Vedi [[dependency-aware-error-recovery]] (stesso tema error-propagation lungo le dipendenze). Importante: eval **end-to-end** (con orchestrator + LoRA stack), non solo i singoli componenti. La pipeline ha 3 step, errore composto.

## Confidence

- Lista benchmark moderni: **[EXTRACTED]** (consenso community 2026)
- Saturazione HumanEval/MBPP: **[EXTRACTED]**
- Soglia "5% over baseline": **[INFERRED]** — domain-specific, da calibrare

## Link interni

- [[architecture/three-tier-design]]
- [[concepts/catastrophic-forgetting]]
- [[open-questions]]
