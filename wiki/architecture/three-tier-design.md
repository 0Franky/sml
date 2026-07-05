---
name: three-tier-design
description: Idea utente ground truth. Orchestrator FT + LoRA programming generalist + LoRA verticali.
type: architecture
tags: [architecture, lora, orchestrator, modular]
sources: [transcript.md:325, HANDOFF.md, docs/superpowers/specs/2026-05-02-qwen-layered-architecture-design.md]
last_updated: 2026-05-21
---

# Three-Tier Design — Idea utente (ground truth)

> **Citazione letterale (transcript.md:325)**:
> "Voglio fare training a qwen (modello base) per fargli fare da orchestratore ad alto livello, poi inserire un lora che sia un generalista sulla programmazione e poi dei lora verticali per aree specifiche."

## Diagramma

```
┌──────────────────────────────────────────────────────────────┐
│  Qwen base — FULL FINE-TUNED → Orchestratore alto-livello   │
│  - planning, decomposizione task                              │
│  - decide quando attivare layer specializzati                │
│  - sempre attivo                                              │
└──────────────────────────────────────────────────────────────┘
                       │
                       │  load adapter (hot-swap)
                       ▼
┌──────────────────────────────────────────────────────────────┐
│  LoRA "programming generalist"                                │
│  - mindset programmazione, multi-repo                         │
│  - scelta stack, code-quality awareness                       │
│  - caricato per task coding                                   │
└──────────────────────────────────────────────────────────────┘
                       │
                       │  load adapter (uno alla volta)
                       ▼
┌──────────────────────────────────────────────────────────────┐
│  LoRA verticale stack-specifico                               │
│  - es. React/Frontend, Python/Backend, DB, DevOps, ...        │
│  - codice idiomatico nella tecnologia                         │
└──────────────────────────────────────────────────────────────┘
```

## Cosa NON è

- ❌ **Non è MoE neurale.** Il livello superiore non "delega" attraverso un router differenziabile a runtime. Il base orchestratore decide (es. emettendo un token speciale `<load:react>` o tramite classifier esterno) e il sistema (PEFT / vLLM `--enable-lora`) fa **hot-swap dell'adapter**.
- ❌ **Non è LoraHub-style composition gradient-free.** I LoRA sono specializzati e caricati uno alla volta (o programming + verticale insieme con composition-aware training).
- ❌ **Non è la riscrittura della prima AI** (transcript:799+) che elimina orchestratore e generalist mantenendo solo verticali. Quella è un'**alternativa** documentata in `decisions/2026-05-21-project-bootstrap.md`, non la nostra ground truth.
- ❌ **Non è un SLM coding-specialized.** È un SLM **organization-specialized** con coding capability **aggiunta via LoRA**. Vedi [[../decisions/2026-05-21-vision-clarification]].

## Cosa è

Architettura **modulare a tre livelli sequenziali** dove:

1. **Tier 1 — Organization Specialist** = base Qwen **full-FT su organization, planning, awareness criticità implicite, safety reasoning, multi-day continuity**. NOT coding-focused. Sempre attivo. È il **core del valore** del progetto.
2. **Tier 2 — Programming generalist** = LoRA caricato sopra il base quando il task è coding. Aggiunge knowledge coding mancante (perché il base non è coding-focused). Ponte tra organizzazione e codice.
3. **Tier 3 — Verticale** = LoRA stack-specifico caricato sopra (uno alla volta), genera codice idiomatico.

**Filosofia**: prima il modello deve essere bravo a **pianificare**, **organizzare**, **capire criticità implicite** delle azioni (esempio canonico: "cancellazione di un file precedente — se lo ricordo, considero recovery; se non lo ricordo, fa nulla"). **Solo dopo** che ha acquisito queste capacità fondamentali, si specializza con i LoRA per il coding.

Vedi:
- [[orchestrator-layer]] — dettagli Tier 1
- [[programming-generalist]] — dettagli Tier 2
- [[vertical-loras]] — dettagli Tier 3

## Flusso esempio

```
User: "Crea un componente React per gestire utenti."
  ↓
[Tier 1 — Orchestrator] capisce: task coding, dominio frontend
  ↓ emette decisione: "carica programming + carica vertical:frontend"
  ↓
[Sistema] hot-swap: programming LoRA + frontend LoRA caricati
  ↓
[Tier 2 + Tier 3] generano il componente React idiomatico
  ↓
[Tier 1] valida output + risponde all'utente
```

## Trade-off vs single-LoRA o full-FT-on-mix

| Aspetto | Three-tier (questo) | Single LoRA su Qwen-Coder | Full-FT su mix |
|---------|--------------------|-----------------------------|----------------|
| Modularità (aggiungi dominio = +1 LoRA) | ✅ Alta | ❌ Bassa | ❌ Nulla |
| Costo training totale | Alto (3 fasi) | Basso | Medio |
| Catastrophic forgetting | ⚠️ Rischio Tier 1 | Basso | Alto |
| Compounding error inference | ⚠️ 3 step | Nessuno | Nessuno |
| Controllo comportamento orchestratore | ✅ Massimo | Solo prompting | Nessuno |
| Time-to-MVP | Lungo | Breve | Medio |
| Aderenza stato dell'arte 2026 (HMoRA/X-LoRA) | Parziale | — | — |

## Decisioni aperte legate

Vedi [[open-questions]] blocco 2 (architettura). In sintesi:

- Base orchestratore: 8-14B (decidere su hardware) **[superato 2026-07-05 → [[decisions/2026-05-21-base-model-pipeline]]: target 35B-A3B; OQ#5/#6 CHIUSE; Qwen3.5 = Alt-2 rifiutata]**
- Base verticali: stesso modello o Qwen3-Coder
- Routing meccanismo: token speciale vs classifier esterno
- Granularità verticali: stack singolo vs area larga
- Programming generalist davvero necessario o ridondante su base coder

## Stato dell'arte di riferimento

Pattern simili (citazioni in `entities/`):
- [[hmora]] — hierarchical mixture LoRA experts (ICLR 2025) — match concettuale più vicino, ma usa routing token-level differenziabile, non sequenziale
- [[x-lora]] — scaling weight per layer/token
- [[lora-mixer]] — serial attention routing
- [[med-moe-lora]] — decoupling cognizione generale vs expertise dominio (pattern trasferibile)
- [[lorahub]] — composizione gradient-free di molti LoRA

Vedi anche [[concepts/lora-stacking]] e [[concepts/catastrophic-forgetting]] per i rischi noti e mitigazioni.

**Asse di controllo aggiuntivo (2026-06-23)**: [[concepts/steering-vectors]] — possibile 4° asse ortogonale ai 3 tier (modulazione runtime leggera: depth-reasoning, refusal, dominio-fine) sopra il LoRA caricato. Harness/wrapper di riferimento: [[decisions/2026-06-23-pi-harness-base|pi]].
