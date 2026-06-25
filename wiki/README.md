---
name: wiki-root
description: Entry point della knowledge base SLM coding. Pattern Karpathy LLM-Wiki.
type: overview
last_updated: 2026-05-21
---

# Wiki — SLM Coding Specialist

Knowledge base persistente del progetto. Pattern [Karpathy LLM-Wiki](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f) — l'LLM è il maintainer, l'umano è il curatore.

## Architettura della wiki

Tre layer (Karpathy):

1. **Raw sources** — immutabili. Stanno nella root del repo: `transcript.md`, `HANDOFF.md`, `docs/superpowers/specs/2026-05-02-qwen-layered-architecture-design.md`. Più paper/articoli ingeriti in `raw/`.
2. **Wiki** — questa directory (`wiki/`). LLM-generated, LLM-maintained. Tu leggi, l'LLM scrive.
3. **Schema** — `CLAUDE.md` alla root. Regole su come ingestare, querare, lintare.

## Struttura

```
wiki/
├── README.md            # questo file (synthesis + entry point)
├── index.md             # catalogo di tutte le pagine
├── log.md               # ledger cronologico (ingest/query/lint/decisione)
├── open-questions.md    # decisioni aperte da chiudere
├── architecture/        # le 3 (o N) componenti del sistema
├── entities/            # paper, modelli, framework, persone
├── concepts/            # idee, principi, tecniche, trade-off
└── decisions/           # ADR (Architecture Decision Records) datati
```

## Synthesis attuale (one-paragraph)

Progetto: **Small Language Model coding-specialized** con architettura modulare a tre livelli — (1) Qwen base full-fine-tuned come **orchestratore alto-livello**, (2) **LoRA "programming generalist"** caricato sopra per task coding, (3) **LoRA verticali stack-specifici** (uno alla volta) per generare codice idiomatico. Il "delegare" è hot-swap di adapter via PEFT/vLLM, **non MoE neurale**. Obiettivo finale: SLM + wrapper applicativo (API/UI/agent — da definire). Stato: idea formalizzata in chat, design v1.0 critico, redesign aperto, intervista vision in corso via skill `grill-me`.

## Idea originale (ground truth)

Vedi [`architecture/three-tier-design.md`](architecture/three-tier-design.md). Importante: la prima AI che ha analizzato l'idea (transcript) ha proposto un redesign che **elimina** due dei tre livelli (skip orchestrator FT, skip programming generalist). Quel redesign **non è la nostra idea** — è documentato in `decisions/` come "alternativa considerata e rifiutata in attesa di evidenza contraria".

## Convenzioni di scrittura

- **Confidence tags** per ogni claim non banale: `[EXTRACTED]` (esplicito in sorgente), `[INFERRED]` (inferenza ragionevole), `[AMBIGUOUS]` (incerto). Stesso schema di graphify.
- **Frontmatter YAML** in ogni pagina: `name`, `description`, `type` (entity|concept|architecture|decision|overview), `tags`, `sources`, `last_updated`.
- **Link interni** stile Obsidian: `[[entities/hmora]]` o `[entities/hmora](entities/hmora.md)`.
- **Citation**: paper sempre con DOI/arXiv URL. Repo sempre con URL GitHub.
- **Date assolute**, mai relative.

## Come navigare

- Sei nuovo? Leggi nell'ordine: `architecture/three-tier-design.md` → `open-questions.md` → `decisions/2026-05-21-project-bootstrap.md`.
- Cerchi un paper? `entities/`.
- Cerchi una tecnica? `concepts/`.
- Cerchi cosa è stato fatto e quando? `log.md`.
- Cerchi cosa va deciso? `open-questions.md`.

## Stato

- **Bootstrap**: 2026-05-21
- **Vision interview**: in corso (grill-me)
- **Knowledge graph**: vedi `../graphify-out/graph.html` (rigenerato via `/graphify --update` dopo modifiche significative)
