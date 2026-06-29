# SLM — Organization-First Small Language Model

> Knowledge base di ricerca per la progettazione di uno **Small Language Model** specializzato **prima nell'organizzazione/pianificazione** e poi nel coding, con architettura modulare **three-tier** e un wrapper applicativo.
>
> Stato: **fase di design / ricerca** — knowledge base in evoluzione (pre-implementazione).

## Idea in breve

Un SLM che impara **prima** a organizzare, pianificare a orizzonti lunghi e catturare le criticità implicite delle azioni; **solo dopo** si specializza nel coding tramite layer LoRA. Architettura a tre livelli con hot-swap di adapter:

- **Tier 1 — Orchestrator** (base full fine-tuned): specialista di *organizzazione* (planning, criticality awareness, reasoning strutturato col *metodo scientifico*).
- **Tier 2 — Programming generalist** (LoRA): competenze di programmazione trasversali.
- **Tier 3 — Verticali** (LoRA stack-specifici): framework/domini, caricati uno alla volta.

Sopra: un **wrapper/harness** (basato su [pi](https://pi.dev)) che gestisce context engineering, safety, memoria e routing.

## Come è organizzato

Monorepo **ITLMv1** + pattern [Karpathy LLM-Wiki](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f) (tre layer: raw / wiki / schema). La conoscenza di design è **centralizzata** in `wiki/`; i sub-progetti (`harness/`, `lm/`) contengono solo codice/config/artefatti.

```
slm/  (repo ITLMv1)
├── wiki/                 # SSOT — knowledge base (entry: wiki/README.md, indice: wiki/index.md)
│   ├── architecture/     # three-tier design, orchestrator, wrapper, matrioska-spec
│   ├── concepts/         # training, context-engineering (focus-task-prioritization, context-limits…), safety
│   ├── decisions/        # ADR datati
│   ├── entities/         # paper, modelli, framework (deep-dive)
│   ├── training-taxonomy/# tassonomia completa dei dati di training (16 aree)
│   ├── model-testbook.md # desiderata-modello ("voglio che il modello…") + come si verificano
│   └── open-questions.md
├── harness/              # sub-progetto HARNESS — wrapper su pi (extension TS) + serving vLLM + verifier (vedi harness/README.md)
├── lm/                   # sub-progetto LM — training + eval + data-pipeline + configs
├── graphify-out/         # knowledge graph (graph.html / graph.json / GRAPH_REPORT.md)
├── docs/                 # design spec
└── prompts/              # template di prompt
```

## Punti d'ingresso

- **[wiki/README.md](wiki/README.md)** — sintesi del progetto
- **[wiki/index.md](wiki/index.md)** — catalogo di tutte le pagine
- **[wiki/architecture/three-tier-design.md](wiki/architecture/three-tier-design.md)** — l'architettura ground-truth
- **[wiki/training-taxonomy/README.md](wiki/training-taxonomy/README.md)** — cosa e come si addestra
- **[harness/README.md](harness/README.md)** — il wrapper/harness su pi (context-engineering, matrioska, focus-gathering, guardrail) — già implementato + testato

## Filosofia

Approccio **scientifico ed evolutivo**: le decisioni (ADR) sono *provisional*, guidate dalle evidenze; le alternative sono documentate, non scartate silenziosamente. Tutto è tracciato e auditabile.

---

*Progetto di ricerca indipendente. Contenuti in evoluzione.*
