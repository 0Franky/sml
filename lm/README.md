# lm — ITLMv1

Sub-progetto **LM** del monorepo **ITLMv1**: training, eval, data-pipeline e configs del three-tier SLM (Tier1 orchestrator full-FT + Tier2 programming LoRA + Tier3 vertical LoRAs).

> **SSOT**: tutta la conoscenza di design (architettura, decisioni, tassonomia training, gold-example, metriche) vive nella wiki centralizzata `../wiki/`. Questo sub-progetto contiene **solo codice/config/artefatti**, mai design-knowledge.

## Layout previsto (placeholder — codice da iniziare post-FFT-readiness)

```
lm/
├── README.md            # questo file
├── training/            # script di training (SFT, RL/GRPO) per stadio — framework per wave (Unsloth → Axolotl → ms-swift/TRL)
├── eval/                # suite di eval (Tier1 standalone + Tier1+3; criticality 200-task; LiveCodeBench/SWE-Bench-Lite)
├── data/                # data-pipeline + transform-knob (NL on-the-fly, replay 10%) — dataset gitignored
└── configs/             # config di training/LoRA (rank, DoRA/RsLoRA, curriculum 5-stadi) + provenance-manifest
```

## Stato

**Placeholder (2026-06-29)**. Il codice di training si inizia quando i prerequisiti sono chiari e pronti (gold-example validati + smoke-test componibilità + harness verifier-sandbox operativo). Vedi `../wiki/todo.md` per lo stato corrente e `../wiki/decisions/` per le decisioni di training (D1-D6, curriculum, LoRA-size).

## Riferimenti wiki (design-knowledge centralizzato)

- `../wiki/decisions/2026-06-28-decisions-d1-d5.md` — LoRA-init, tokenizer, hardware, marker, judge, licensing
- `../wiki/concepts/training-curriculum-design.md` + `curriculum-stages-detail.md` — pipeline 5-stadi
- `../wiki/training-taxonomy/` — tassonomia capability + gold-example + foglie
- `../wiki/decisions/2026-06-29-monorepo-itlmv1.md` — struttura monorepo
