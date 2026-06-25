---
name: wrapper
description: Wrapper applicativo attorno all'SLM. Ancorato su pi (harness MIT) — i concept wrapper diventano extension di pi. Forma frontend Web/App.
type: architecture
tags: [wrapper, integration, pi, harness]
status: anchored — base = pi (ADR 2026-06-23)
last_updated: 2026-06-23
---

# Wrapper

> **Status**: **base harness scelta = [[../decisions/2026-06-23-pi-harness-base|pi]]** (ADR 2026-06-23). Forma frontend (Web vs App) ancora da chiudere in grill-me #2. I concept wrapper si implementano come **Extensions TypeScript** di pi.

## Architettura a 3 layer (aggiornato 2026-06-23, post-pi)

```
┌─ FRONTEND (Web/App) ──────────────┐   embedding via SDK/RPC di pi
│  React/Vue/Svelte  o  Tauri        │
└───────────────┬────────────────────┘
                │
┌─ HARNESS = pi (TypeScript, MIT) ───┐   task intake · context mgmt · loop · tools
│  + nostre Extensions:              │
│    context-assembly, secrets-map   │
│    guardrail, pre-flight-safety,   │
│    vars-queue, contradiction,      │
│    temporal, memo, LoRA-router     │
└───────────────┬────────────────────┘
                │ endpoint OpenAI-compatible
┌─ SERVING MODELLO (Python) ─────────┐   vLLM --enable-lora / Ollama
│  Tier 1 base + LoRA hot-swap        │
└─────────────────────────────────────┘
```

- **Harness**: **pi** (`earendil-works/pi`). I nostri concept (vedi mappatura in [[../decisions/2026-06-23-pi-harness-base]]) sono extension. pi dà gli hook (window control, inject pre-turn, filter history); **la safety/guardrail la costruiamo noi** (pi non ha permission-gate built-in).
- **Serving modello**: vLLM con `--enable-lora` per hot-swap (S-LoRA), dietro endpoint. Python resta qui + nel training, **non** in un backend-harness monolitico (assunzione precedente decaduta).
- **Frontend**: Web app o Tauri, embedding di pi via **SDK/RPC**.
- **Persistenza**: sessioni tree-structured di pi + storage extension (VARS registry, memo, tool-call log).
- **Auth**: single-user (MVP). Multi-utente fuori scope MVP.

Vincoli di filosofia (chiariti dall'utente):

- **No deadline esterna**: privilegiamo qualità ("fatto bene ma senza sprecare tempo")
- **Solo l'utente** come stakeholder (no team, no contributor)
- **Approccio scientifico**: ridimensionamento ambizione OK se evidenze lo giustificano

## Forma confermata: Web UI o App desktop

Decisione 2026-05-21 dall'utente. Le opzioni rimaste sono:

| Forma | Pro | Contro | Verdetto |
|-------|-----|--------|----------|
| **Web app** (React/Vue/SvelteKit + FastAPI backend) | Cross-platform, no install, sync facile | Latency, hosting necessario, auth da gestire | Candidata |
| **Desktop app** (Tauri + Rust + frontend React) | UX completa, offline, single binary | Distribuzione cross-OS complessa, no mobile | Candidata (preferenza per Tauri vs Electron per peso) |

**Da decidere in grill-me #2 wrapper-dedicato**.

### Esclusi esplicitamente

| Forma | Motivo esclusione |
|-------|-------------------|
| CLI agent | UX non sufficiente per multi-day visualizzazione state |
| Plugin IDE (VS Code extension) | Ristretto a un solo IDE, costo di mantenimento alto |
| Multi-agent orchestrator standalone | Pattern interno, ma il prodotto finale deve avere UX visibile |
| API server only | Manca UX |

## Funzionalità candidate (da chiedere)

- Streaming token-by-token
- Tool calling (filesystem, shell, web search, ecc.)
- Memory persistente cross-session
- RAG su codebase locale dell'utente
- Multi-turn conversation con history compaction
- Autenticazione/multi-user
- Audit log delle interazioni
- Switching dinamico verticale (UI per scegliere lo stack)

## Vincoli da definire

- Linguaggio backend (Python più allineato col modello, Go/Rust per perf)
- Deployment (locale, server self-hosted, cloud)
- Latency requirement (interactive < 200ms TTFT)
- Concurrency (single user, multi-user, enterprise)
- Storage (locale, sqlite, postgres, vector DB per RAG)

## Open questions

[[open-questions]] blocco 1 (#1, #2, #3, #4) + blocco 6 (#24-28).

## Stato

Da definire integralmente in grill-me.
