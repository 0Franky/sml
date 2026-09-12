---
name: wiki-root
description: Entry point della knowledge base del progetto SLM a tre livelli (Tier-1 = intelligenza operativa generale, il codice sta nei LoRA). Pattern Karpathy LLM-Wiki.
type: overview
last_updated: 2026-09-12
---

# Wiki — SLM a tre livelli (Tier-1 = intelligenza operativa, non codice)

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
├── index.md             # catalogo di TUTTE le pagine (completezza garantita da un checker)
├── log.md               # ledger cronologico (gitignored: è il diario di lavoro)
├── todo.md              # cosa resta, con lo stato
├── open-questions.md    # tracker del 2026-06-29, parzialmente superato dagli ADR — ⚠️ 10 item risultano ancora aperti e nessuno li ha ri-triati (todo); le domande VIVE stanno in todo/
├── harness-experiment-log.md   # cosa abbiamo MISURATO (§0 = vista per-modello)
├── sota-techniques-catalog.md  # tecniche esterne, triate voce per voce
├── REQUISITO-AFFIDABILITA.md   # il requisito fondante
├── architecture/        # le componenti del sistema
├── entities/            # paper, modelli, framework, persone
├── concepts/            # idee, principi, tecniche, trade-off
├── training-taxonomy/   # cosa si insegna al modello: classi, gold, playbook, sequenza
├── decisions/           # ADR (Architecture Decision Records) datati
└── todo/                # domande aperte per Fra (si scrive QUI prima di chiedere)
```

## Synthesis attuale (one-paragraph)

Progetto: **Small Language Model a tre livelli** — (1) un modello **instruct dense ~27-36B** fine-tuned come **orchestratore**, (2) **LoRA "programming generalist"** sopra, per i task di codice, (3) **LoRA verticali** stack-specifici (uno alla volta). Il "delegare" è **hot-swap di adapter** via PEFT/vLLM, **non MoE neurale**. Obiettivo finale: SLM + wrapper applicativo, costruito sopra [[../harness/README|pi]].

⚠️ **Due cose che questa pagina diceva sbagliate fino al 2026-09-12, e che chi entra di qui leggeva per prime**:
1. **L'identità del Tier-1 NON è «coding-specialized»**: è **intelligenza operativa generale** — analizzare un problema, decomporlo, decidere, operare il sistema. Il codice è il *dominio dei LoRA*, non del livello 1 (memoria `project_base_model_intelligence`; è la correzione dell'ADR [[decisions/2026-05-21-vision-clarification]], che questa pagina non aveva recepito).
2. Non si parte da un **base**: la regola ratificata (2026-09-11, TG msg 2197 → [[entities/base-model-candidates-2026-07]] §D9) è **«CPT da base · SFT/RL da instruct»**, e i nostri dati sono di scala SFT/RL.

**Come si decide, oggi**: per misura. Il metro sono le **scene a più turni con oracolo su file** (`harness/verifiers/*.json`, ADR [[decisions/2026-07-26-fixture-runner-proposta]]), gradate dai **lab a policy fisse** e dal **gate** (22 lab · 6 checker). Esiti per modello in [[harness-experiment-log]] (§0 = vista per-modello; F41-F45).

## Idea originale (ground truth)

Vedi [`architecture/three-tier-design.md`](architecture/three-tier-design.md). Importante: la prima AI che ha analizzato l'idea (transcript) ha proposto un redesign che **elimina** due dei tre livelli (skip orchestrator FT, skip programming generalist). Quel redesign **non è la nostra idea** — è documentato in `decisions/` come "alternativa considerata e rifiutata in attesa di evidenza contraria".

## Convenzioni di scrittura

- **Confidence tags** per ogni claim non banale: `[EXTRACTED]` (esplicito in sorgente), `[INFERRED]` (inferenza ragionevole), `[AMBIGUOUS]` (incerto). Stesso schema di graphify.
- **Frontmatter YAML** in ogni pagina: `name`, `description`, `type` (entity|concept|architecture|decision|overview), `tags`, `sources`, `last_updated`.
- **Link interni** stile Obsidian: `[[entities/hmora]]` o `[entities/hmora](entities/hmora.md)`.
- **Citation**: paper sempre con DOI/arXiv URL. Repo sempre con URL GitHub.
- **Date assolute**, mai relative.

## Come navigare

- **Sei nuovo?** Nell'ordine: [`REQUISITO-AFFIDABILITA.md`](REQUISITO-AFFIDABILITA.md) (il requisito fondante, tutto ruota lì) → [`architecture/three-tier-design.md`](architecture/three-tier-design.md) → [`index.md`](index.md) (il catalogo completo: **ogni** pagina è lì, lo garantisce `harness/tools/check-index-coverage.mjs`).
- **Cerchi un paper?** `entities/` · una tecnica? `concepts/` · il catalogo ragionato delle tecniche esterne? [`sota-techniques-catalog.md`](sota-techniques-catalog.md) (§RL-7 = triage del sweep 2026-09-11).
- **Cosa insegniamo al modello?** `training-taxonomy/` — le classi, il [`dataset-construction-playbook.md`](training-taxonomy/dataset-construction-playbook.md) (regole di costruzione + catalogo dei caveat) e la [`lab-sequence.md`](training-taxonomy/lab-sequence.md) (in che ordine si allena).
- **Cosa abbiamo misurato?** [`harness-experiment-log.md`](harness-experiment-log.md) — §0 è la vista **per-modello**, il resto è per esperimento.
- **Cosa è stato fatto e quando?** `log.md` · **cosa resta** → [`todo.md`](todo.md) · **cosa aspetta una risposta di Fra** → [`todo/domande-aperte-per-fra.md`](todo/domande-aperte-per-fra.md).

## Stato

- **Bootstrap**: 2026-05-21 · **vision interview**: chiusa (grill-me; le decisioni stanno in `decisions/`)
- **Dove siamo al 2026-09-12**: il **metro esiste ed è eseguito** (10 scene, 22 lab, 6 checker, gate verde) e per la prima volta **separa i modelli**: `qwen3.6-27b` passa scene e reward che `qwen3-32b` fallisce (F45). La **rosa del base NON è chiusa**: Seed-OSS-36B-Instruct non è mai stato girato (non è su OpenRouter; serve il pacing per SiliconFlow). Il **training non è iniziato**: nessuna classe è validata per il training, le fixture della maggior parte non esistono.
- **Decisioni aperte per Fra**: D11 (PRM appreso fuori dal loop di Wave 6) · D12 (il vincolo «non serve multimodale»: lettera o rationale).
- **Knowledge graph**: vedi `../graphify-out/graph.html` (rigenerato via `/graphify --update` dopo modifiche significative)
