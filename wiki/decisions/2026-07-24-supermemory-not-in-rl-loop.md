---
name: 2026-07-24-supermemory-not-in-rl-loop
description: ADR — NON adottare supermemory nel loop RL. La memoria resta MODEL-CONTROLLED (set_var/note/lane) come ambiente RL invariato. supermemory annotato solo come possibile reference/baseline per il RAG-su-doc del layer SERVING del wrapper (non training), da valutare separatamente.
type: decision
status: PROPOSTA (attende ok utente, #26)
tags: [infrastructure, memory, rl-loop, reward-hacking, training-vs-harness, supermemory, rag, serving, decision-provenance]
sources:
  - triage idea utente msg 1799-1804 (2026-07-24) — M3-supermemory
  - github.com/supermemoryai — Memory API (core MIT, SDK Apache-2.0)
  - supermemory.ai/docs, /pricing, /docs/self-hosting/overview — semantic retrieval + auto fact-extraction; self-host free o hosted $19-399/mo
last_updated: 2026-07-24
---

# ADR 2026-07-24 — supermemory NON nel loop RL

> **Status**: PROPOSTA — attende ratifica esplicita dell'utente **dal 2026-07-24** (#26). Nessun cambio di codice/ambiente eseguito.

## Contesto

Triage dell'idea utente **M3-supermemory** (msg 1799-1804, "procedi in autonomia"): valutare se adottare [supermemory](https://github.com/supermemoryai) — Memory API semantica (embeddings + vector index + semantic retrieval + auto fact-extraction) — nel progetto.

## Verdetto: **INFRASTRUTTURA** → NON adottare nel loop RL

Non è una classe di training (nessun buco di intelligenza nuovo da insegnare). È una **scelta infrastrutturale**, e per l'RL è **ridondante + controproducente**.

### Perché NON nell'RL (il punto load-bearing)

- **supermemory è memoria AUTOMATICA/semantica**: il *sistema* decide cosa estrarre e recupera per **similarità**, al posto del modello.
- **La nostra è MODEL-CONTROLLED**: il *modello* decide via `set_var`/`note` e richiama via `get_var` ([[../concepts/persist-salient-facts]], [[../concepts/agent-wrapper-vars-queue]]).
- Nel loop RL, supermemory farebbe il **recall al posto del modello** → il modello prenderebbe credito per ciò che fa il RAG = **participation/branch-hack** (viola #10 [[feedback_reward_hacking_principle]] e #32 [[feedback_reward_branch_field_trap]]) → **invaliderebbe** il reward-outcome di persist-salient-facts (`persist-salient-facts.md:56-61`: si premia *"il fatto richiamato N turni dopo con i PROPRI tool"*, MAI la cerimonia).
- **Ridondante**: la memoria è **già costruita e implementata** — lane VARS (map O(1) by-id), FACTS inline, change-log, persistenza SQLite cross-compact/cross-session (`vars-queue.mjs`; `persist-salient-facts.md:26`).
- **Controproducente per l'obiettivo**: Tier-1 = **INTELLIGENZA** ([[project_base_model_intelligence]]). Il modello deve **imparare** a gestire la memoria, non **delegarla** a un servizio.

### Classificazione #11

`{meccanismo recall}` = **F** (già coperto da vars-queue); `{decisione cosa/quando persistere+richiamare}` = **S** (trained, è la skill che l'RL insegna). supermemory rimpiazzerebbe la metà **S** con un automatismo → toglie proprio ciò che si vuole addestrare.

### License / compliance (#29)

Pulita: core **MIT** self-host, SDK **Apache-2.0**, self-host free. Non è il fattore deciding (l'esclusione è per reward-integrity, non per licenza).

## Unico uso residuo legittimo (SEPARATO, non-training)

RAG semantico **sui documenti** nel layer **SERVING** del wrapper (non training). Lì il retrieval-per-similarità è la feature voluta, non un hack. Da valutare **separatamente** e **in competizione** con serena / soluzioni esistenti. **NON** confondere con la memoria conversazionale model-controlled.

## Conseguenze

- Ambiente RL **invariato**: memoria model-controlled (vars/facts/lane) confermata come ambiente.
- Nessuna nuova dipendenza infra introdotta.
- TODO forward-looking: se/quando si progetta il RAG-su-doc del SERVING, riaprire supermemory come *baseline/reference* accanto a serena.

## Alternative considerate

- **Adottare supermemory nel loop RL** — SCARTATA: reintroduce il branch/participation-hack, ridondante, contro l'identità Tier-1.
- **Sostituire vars-queue con supermemory** — SCARTATA: la memoria model-controlled è ground-truth del design ([[../concepts/persist-salient-facts]]); supermemory è un modello di memoria diverso (automatico) non allineato all'obiettivo.

## Copertura esistente

- [[../concepts/persist-salient-facts]] — skill memoria model-controlled + reward outcome-anchored
- [[../concepts/agent-wrapper-vars-queue]] — lane VARS/FACTS, change-log, persistenza SQLite (`vars-queue.mjs`)
