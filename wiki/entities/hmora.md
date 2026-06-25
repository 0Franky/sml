---
name: hmora
description: HMoRA — Hierarchical Mixture of LoRA Experts. ICLR 2025. Match concettuale più vicino.
type: entity
entity_type: paper
tags: [paper, lora, moe, hierarchical, routing]
sources: [https://openreview.net/forum?id=lTkHiXeuDl, https://github.com/LiaoMengqi/HMoRA]
last_updated: 2026-05-21
---

# HMoRA — Hierarchical Mixture of LoRA Experts

## Riferimento

- Paper: OpenReview ICLR 2025 — https://openreview.net/forum?id=lTkHiXeuDl
- Repo: https://github.com/LiaoMengqi/HMoRA — codice riusabile

## Cosa fa

Combina LoRA experts in struttura gerarchica:

- **Lower layers** del transformer: routing sparse, capturano sintassi/feature universali
- **Upper layers**: cluster densi di expert specializzati per task/dominio

Routing è **differenziabile token-level + task-level**. Un singolo forward pass attiva expert appropriati.

## Perché rilevante per noi

Match concettuale **più vicino alla nostra architettura three-tier**. Conferma intuizione che:

1. Gerarchia di livelli funziona
2. Lower layers possono restare generici, upper si specializzano
3. Routing dentro il modello (non sequenziale + hot-swap) può funzionare bene

Differenze chiave vs nostra idea:

| Aspetto | HMoRA | Nostra three-tier |
|---------|-------|-------------------|
| Routing | Differenziabile dentro forward pass | Sequenziale + hot-swap adapter |
| Granularità | Per-token | Per-task (orchestrator decide una volta) |
| Determinismo | Black-box (impara durante training) | Deterministico (controllabile, debuggabile) |
| Training complessità | Alta (load balancing experts) | Media (tre fasi sequenziali) |
| Inference latency | 1 forward pass | 1-3 forward pass (orchestrator → carica LoRA → genera) |

## Quando usarla

- **Alternative architecture path**: se i tre livelli mostrano interferenza pesi ingestibile → switchare a HMoRA come Phase 2.
- **Baseline da battere**: HMoRA pre-trained può essere baseline scientifico contro cui valutare nostra three-tier.
- **Componente ibrida**: usare HMoRA-style routing **dentro** un tier (es. dentro il programming generalist multiple sub-LoRA gestiti via HMoRA).

## Confidence

- Esistenza paper ICLR 2025: **[EXTRACTED]**
- Repo attivo: **[EXTRACTED]**
- Performance esatta vs nostra architettura: **[AMBIGUOUS]** — non testata, ipotetica

## Link interni

- [[architecture/three-tier-design]]
- [[mole]]
- [[x-lora]]
- [[decisions/2026-05-21-project-bootstrap]] (Alt-3)
