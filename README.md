# SLM — Organization-First Small Language Model

> Knowledge base di ricerca per la progettazione di uno **Small Language Model** specializzato **prima nell'organizzazione/pianificazione** e poi nel coding, con architettura modulare **three-tier** e un wrapper applicativo.
>
> Stato: **fase di design / ricerca** (knowledge base in evoluzione, pre-implementazione). Repo privato.

## Idea in breve

Un SLM che impara **prima** a organizzare, pianificare a orizzonti lunghi e catturare le criticità implicite delle azioni; **solo dopo** si specializza nel coding tramite layer LoRA. Architettura a tre livelli con hot-swap di adapter:

- **Tier 1 — Orchestrator** (base full fine-tuned): specialista di *organizzazione* (planning, criticality awareness, reasoning strutturato col *metodo scientifico*).
- **Tier 2 — Programming generalist** (LoRA): competenze di programmazione trasversali.
- **Tier 3 — Verticali** (LoRA stack-specifici): framework/domini, caricati uno alla volta.

Sopra: un **wrapper/harness** (basato su [pi](https://pi.dev)) che gestisce context engineering, safety, memoria e routing.

## Come è organizzato

Pattern [Karpathy LLM-Wiki](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f) (tre layer: raw / wiki / schema).

```
slm/
├── wiki/                 # knowledge base (entry point: wiki/README.md, indice: wiki/index.md)
│   ├── architecture/     # three-tier design, orchestrator, wrapper, verticali
│   ├── concepts/         # tecniche & metodologia di training, context engineering, safety
│   ├── decisions/        # ADR datati
│   ├── entities/         # paper, modelli, framework (deep-dive)
│   ├── training-taxonomy/# tassonomia completa dei dati di training (16 aree)
│   ├── experiments-backlog.md   # ipotesi da validare sperimentalmente
│   └── open-questions.md
├── docs/                 # design spec
└── prompts/              # template di prompt
```

## Punti d'ingresso

- **[wiki/README.md](wiki/README.md)** — sintesi del progetto
- **[wiki/index.md](wiki/index.md)** — catalogo di tutte le pagine
- **[wiki/architecture/three-tier-design.md](wiki/architecture/three-tier-design.md)** — l'architettura ground-truth
- **[wiki/training-taxonomy/README.md](wiki/training-taxonomy/README.md)** — cosa e come si addestra

## Filosofia

Approccio **scientifico ed evolutivo**: le decisioni (ADR) sono *provisional*, guidate dalle evidenze; le alternative sono documentate, non scartate silenziosamente. Tutto è tracciato e auditabile.

---

*Progetto di ricerca indipendente. Contenuti in evoluzione.*
