---
name: xlora-vs-hmora
description: Confronto X-LoRA vs HMoRA — entrambi router learned per-token (paradigma "concurrent", alternativa al nostro hot-swap sequenziale). Differenza chiave: X-LoRA scala adapter FROZEN con un router; HMoRA costruisce una gerarchia di expert co-trainata con routing dipendente dalla profondità.
type: concept
tags: [lora, moe, routing, x-lora, hmora, comparison, hierarchical, scaling-weights]
last_updated: 2026-06-24
status: draft — sintesi comparativa (query utente)
---

# X-LoRA vs HMoRA

> Query utente 2026-06-24: "differenza tra X-LoRA e HMoRA?". Entrambi sono la famiglia **router-learned MoE-of-LoRA** (paradigma *concurrent / per-token*), cioè l'**alternativa** al nostro hot-swap **sequenziale a confine-di-stage** ([[multi-expert-collaboration]]).

## In una riga
- **X-LoRA** = un **router** impara **pesi di scaling per-layer e per-token** sopra LoRA **pre-trainati e congelati** → "*quanto* di ogni adapter, layer per layer, token per token". Composizione **post-hoc e modulare**.
- **HMoRA** = una **gerarchia di expert co-trainati** con **routing dipendente dalla profondità** (layer bassi: sparse, feature universali; layer alti: cluster densi specializzati per task) + routing **token-level + task-level**, in **un singolo forward pass**. Gerarchia **integrata nel training**.

## Confronto

| Aspetto | **X-LoRA** ([[../entities/x-lora]]) | **HMoRA** ([[../entities/hmora]]) |
|---|---|---|
| Cosa impara | pesi di **scaling** continui sugli adapter | **gerarchia** di expert + gating token+task |
| Gli expert (LoRA) | **frozen**, pre-trainati a parte | **co-trainati** insieme al router |
| Struttura | "flat": ogni adapter ha un peso a ogni layer/token | **gerarchica**: comportamento del routing **cambia con la profondità** (basso=universale sparse, alto=specializzato denso) |
| Granularità | per-layer + per-token | per-token + per-task |
| Modularità | 🟢 alta (riusi i tuoi LoRA, aggiungi il router) | 🟡 bassa (la gerarchia è nel training) |
| Forward pass | router scala gli adapter (dual-pass concettuale) | singolo forward pass |
| Interpretabilità | media (pesi di scaling ispezionabili) | bassa (black-box gerarchico) |
| Match con three-tier | "wrapper di composizione" su Tier 2+3 | match concettuale **più vicino** alla gerarchia stessa |

## Analogia
- **X-LoRA**: hai già dei musicisti (LoRA) registrati; un **mixer** (router) decide il volume di ciascuno, istante per istante. I musicisti non li ri-registri.
- **HMoRA**: costruisci un'**orchestra gerarchica** dove le sezioni (archi/fiati) e il direttore sono **provati insieme**; chi suona dipende dal "piano" (profondità del layer) e dal brano (task).

## Cosa significano per noi
- **Comune**: entrambi sono il paradigma **per-token concurrent** → l'opposto del nostro **sequenziale + hot-swap** (auditable, deterministico). Sono l'opzione **(b)** del bivio in [[multi-expert-collaboration]].
- **X-LoRA** è il candidato più pratico **se** vogliamo una composizione learnable **sopra** i nostri Tier 2 + Tier 3 senza ri-addestrarli → risolverebbe il composition-aware-training in modo modulare. Buon **baseline** da battere.
- **HMoRA** è interessante come **architettura alternativa** dell'intero stack (se l'interferenza pesi della three-tier diventasse ingestibile) o come **routing dentro un singolo tier** (sub-LoRA del programming generalist gestiti à la HMoRA). Match concettuale più vicino, ma perde determinismo/auditabilità.
- **Trade-off chiave**: entrambi guadagnano fluidità ma **perdono l'audit** "ho caricato questi adapter, in quest'ordine, per questo motivo" — proprio ciò che l'utente valorizza (vedi la scelta sequenziale + il design a reclutamento dinamico). → Tenuti come **alternative considerate** / baseline, non come default.

## Sources
- [[../entities/x-lora]] (Buehler 2024, repo EricLBuehler/xlora), [[../entities/hmora]] (ICLR 2025, openreview lTkHiXeuDl).
- Collega: [[multi-expert-collaboration]], [[lora-stacking]], [[../entities/mole]], [[../architecture/three-tier-design]].
