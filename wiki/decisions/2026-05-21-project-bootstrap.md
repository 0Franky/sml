---
name: 2026-05-21-project-bootstrap
description: ADR iniziale. Scope, struttura, alternative considerate, alternative rifiutate.
type: decision
status: accepted
date: 2026-05-21
last_updated: 2026-05-21
---

# ADR 2026-05-21 — Project Bootstrap

## Context

Progetto SLM coding-specialized, repo iniziato il 2026-05-21. Sorgenti raw esistenti:

- `transcript.md`: sessione precedente di un'altra AI (analisi critica + redesign)
- `HANDOFF.md`: riassunto/decisioni proposte (non validate dall'utente)
- `docs/superpowers/specs/2026-05-02-qwen-layered-architecture-design.md`: design v1.0 con confusione concettuale

L'utente ha rispiegato a quella AI (transcript:325) la sua idea: orchestrator FT + LoRA programming + LoRA verticali. La AI ha "approvato" ma poi ha proposto redesign che elimina 2 dei 3 livelli. Quel redesign non è validato dall'utente.

## Decisioni

### 1. Ground truth architetturale = idea utente three-tier

L'architettura di riferimento è quella in [[architecture/three-tier-design]] — orchestrator FT + programming LoRA + verticali LoRA. Il redesign della AI precedente (skip orchestrator FT, skip programming generalist, solo verticali) **non è la ground truth**, ma una alternativa documentata qui sotto come "considerata e rifiutata in attesa di evidenza contraria".

### 2. Knowledge base = Karpathy LLM-Wiki + graphify

- **Wiki**: directory `wiki/` con pattern Karpathy (raw sources / wiki / schema). LLM mantiene, umano cura.
- **Schema**: `CLAUDE.md` alla root.
- **Knowledge graph**: graphify, output in `graphify-out/`. Rigenerato via `/graphify --update` dopo modifiche significative.
- **Convenzioni**: confidence tags (`[EXTRACTED]/[INFERRED]/[AMBIGUOUS]`), YAML frontmatter, Obsidian-style links, citation con DOI/arXiv.

### 3. Repo structure

```
slm/
├── CLAUDE.md            # schema wiki (regole maintainer)
├── README.md            # (TBD)
├── .gitignore
├── transcript.md        # raw source (immutable)
├── HANDOFF.md           # raw source (immutable)
├── docs/                # design v1.0 + futuri spec
├── raw/                 # per ingest futuri (paper, articoli, screenshot)
├── wiki/                # LLM-maintained
│   ├── README.md
│   ├── index.md
│   ├── log.md
│   ├── open-questions.md
│   ├── architecture/
│   ├── entities/
│   ├── concepts/
│   └── decisions/
└── graphify-out/        # graph artifacts
```

### 4. Workflow vision

Prima di scrivere codice o pipeline di training: skill `grill-me` per allineare vision (SLM + wrapper + training methodology + ottimizzazioni contesto/ragionamento). Output: risposte a [[open-questions]] → nuovi ADR per ogni blocco chiuso.

## Alternative considerate

### Alt-1: Redesign della AI precedente (rifiutato)

Eliminare orchestrator FT + programming generalist, mantenere solo LoRA verticali su Qwen3-Coder.

**Pro**: timeline ~12 settimane (vs 24), meno compounding error, base coder già ottimizzato, MVP veloce.

**Contro**: non è quello che l'utente ha chiesto. Perde controllo sul comportamento di routing. Perde "ponte" semantico tra alto livello e specializzazione.

**Rifiutato perché**: non ground truth dell'utente. Documentato come opzione disponibile se l'evidenza empirica futura mostrerà che i tre livelli sono ridondanti.

### Alt-2: Single-LoRA su Qwen3-Coder

Un solo LoRA "fat" su Qwen3-Coder con dataset misto multi-dominio.

**Pro**: massima semplicità serving, no compounding.

**Contro**: perde modularità (aggiungere dominio = full retrain), no specializzazione fine.

**Rifiutato perché**: tradisce intent modulare dell'utente.

### Alt-3: HMoRA full-replace

Sostituire l'architettura sequenziale con HMoRA (hierarchical mixture LoRA experts, ICLR 2025) — router token-level differenziabile.

**Pro**: stato dell'arte, codice esistente (LiaoMengqi/HMoRA), un singolo forward pass.

**Contro**: training complesso, perde controllo deterministico sul routing, richiede repo riferimento attivo, blackbox vs hot-swap esplicito.

**Status**: non rifiutata definitivamente. Può essere alternativa per Phase 2/3 se i tre livelli sequenziali mostrano interferenza ingestibile. Vedi [[entities/hmora]].

## Conseguenze

- Tutti i contributor (umani, LLM agent) seguono le regole in `CLAUDE.md` per modifiche alla wiki
- Ogni modifica significativa alla conoscenza → `/graphify --update`
- Decisioni future → nuovo ADR datato in `decisions/`
- `open-questions.md` chiuse → spostate a decisioni o archiviate

## Stato

`accepted` — bootstrap completato 2026-05-21. Prossimo step: grill-me per allineamento vision.
