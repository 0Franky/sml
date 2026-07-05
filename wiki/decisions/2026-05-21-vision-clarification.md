---
name: 2026-05-21-vision-clarification
description: Chiarificazione critica della vision — organization-specialized base, coding via LoRA aggiunto sopra. Correggi precedenti ADR.
type: decision
status: accepted
date: 2026-05-21
last_updated: 2026-05-21
supersedes_parts_of:
  - 2026-05-21-project-bootstrap
  - 2026-05-21-base-model-pipeline
---

# ADR 2026-05-21 (b) — Vision Clarification: Organization-First, Coding-After

## Context

Durante la sessione grill-me, ho prodotto una sintesi della mia comprensione del progetto. L'utente ha corretto un punto **fondamentale** che richiede aggiornamento di precedenti ADR e file architettura.

## Correzione critica

### Quello che avevo capito (errato)

> "Un Small Language Model **coding-specialized** + wrapper applicativo"

### Quello che è la vera vision

> "Un Small Language Model **organization-specialized** + wrapper applicativo. Prima deve essere bravo a organizzare e pianificare le cose a orizzonti lunghi, **catturando tutte le possibili criticità anche implicite** ad alcune azioni di step richiesti (esempio: cancellazione file precedente — se lo ricordi, se no fa nulla). **Dopo** che ha acquisito queste capacità fondamentali di base, **solo allora** si specializza con layer(s) LoRA."

## Implicazioni architetturali

### Tier 1 — Orchestrator (full-FT) — **CAMBIO RUOLO**

| Aspetto | Prima (errato) | Dopo (corretto) |
|---|---|---|
| **Capacità primaria** | Routing + coding generic + planning | **Organization + planning a orizzonti lunghi + awareness criticità implicite** |
| **Esempio canonico** | "Decidi quale LoRA caricare" | "Cancellazione file precedente: ricordo che esisteva → consideriamo recovery; non lo ricordo → fa nulla" |
| **Knowledge coding** | Importante, replay 15% durante FT | Secondaria. Replay coding minimo (5-10%) per non degradare base, ma il coding non è il focus |
| **Dataset training** | Mix orchestration + coding | **Mix organization tasks + planning multi-step + safety reasoning + criticality awareness + multi-day session continuity** + minimo replay general |

### Tier 2 — Programming generalist (LoRA) — **CONFERMATO ma con nuovo posizionamento**

- Si carica **sopra** il base organization-specialized quando il task è coding
- Aggiunge knowledge coding mancante nel base (perché Tier 1 non è coding-focused)
- Funge da "ponte" tra il modello che sa organizzare e quello che sa fare codice

### Tier 3 — Vertical LoRAs — **CONFERMATO**

Stack-specific (Frontend, Backend-Py, Backend-TS, Data, DevOps). Si carica sopra Tier 2.

### Architettura risultante

```
┌────────────────────────────────────────────────────────────┐
│  Qwen base full-FT → ORGANIZATION/PLANNING SPECIALIST     │
│  - planning lungo orizzonte                                 │
│  - awareness criticità implicite (es. file cancellati)     │
│  - safety reasoning pre-azione                              │
│  - state tracking, queue management                         │
│  - multi-day session continuity                             │
│  - cross-codebase ragionamento (su struttura, non codice)   │
│  → CHE È IL CORE DEL VALORE                                 │
└────────────────────────────────────────────────────────────┘
                       ↓ (caricato quando task = coding)
┌────────────────────────────────────────────────────────────┐
│  LoRA Programming Generalist                                │
│  - knowledge programming generalista                        │
│  - scelta stack, mindset coding                             │
│  - "ponte" tra organizzazione e codice                      │
└────────────────────────────────────────────────────────────┘
                       ↓ (uno alla volta)
┌────────────────────────────────────────────────────────────┐
│  LoRA Vertical (frontend / backend / data / devops)         │
│  - codice idiomatico nello stack                            │
└────────────────────────────────────────────────────────────┘
```

## Conseguenze sul progetto

### 1. Naming corrette nel progetto

- "SLM coding-specialized" → **"SLM organization-specialized + coding capability via LoRA"**
- "Coding agent autonomo" → **"Organizing agent autonomo che sa anche fare coding"**

### 2. Dataset Tier 1 — radicalmente diverso

Sources e composizione cambiano:

| Categoria | % proposta | Sources |
|---|---|---|
| Task decomposition + planning multi-step | 30% | Synthetic da Claude/GPT su task long-horizon + reali da Claude Code transcripts |
| Safety reasoning + criticality awareness | 20% | Synthetic + reali (`pre-flight-safety-checks` examples + cancellazione file + git operations + DB destructive operations) |
| State tracking + multi-day continuity | 15% | Sessioni multi-turn con state evolution, lessons learned applicate |
| Cross-codebase reasoning (struttura, non codice) | 10% | Repo-level navigation, dependency analysis, architecture summarization |
| Reasoning strutturato (caveman thinking) | 10% | Examples in formato `<aim>/<state>/<verification>` |
| Coding replay (minimo, per non degradare base) | 5-10% | OSS-Instruct sample, NON coding intenso |
| Generic instruction following | 5-10% | OASST, general instruction tuning |

NON è "agent coding training" — è "**organization-aware general agent training, con coding minimo**".

### 3. Eval del Tier 1 — non SWE-Bench-driven

L'eval del **Tier 1 da solo** deve misurare capacità organizzative, non coding:

- **AgentBench Web/OS** (task generali multi-step)
- **τ-Bench** (multi-turn tool use con state)
- **LIBERO** (long-horizon planning, robotics-derived ma applicabile)
- Custom: 200 task con **criticità implicita** (es. "modifica config", il modello deve capire criticità auto-revert)
- Custom: 100 task multi-day continuity (resume from yesterday)

L'eval coding (SWE-Bench Verified [aggiornamento 2026-07-05: SWE-Bench Verified ritirato → usare SWE-Bench Lite/Pro, vedi [[training-taxonomy/curriculum-stages-detail]]], LiveCodeBench, BigCodeBench, Aider polyglot) **si applica solo a Tier 1 + Tier 2 + Tier 3 attivi insieme**, NON al Tier 1 da solo.

### 4. Pipeline base model — confermata, razionale aggiornato

| Step | Modello | Hardware | Ruolo |
|---|---|---|---|
| 1 | Qwen3-4B-Instruct-2507 | 2080 Ti 11GB locale | Workflow consolidation + mini organization FT |
| 2 | Qwen3-8B | Cloud A100 | Organization full FT serio + LoRA programming generalist |
| 3 | Qwen3.6-35B-A3B | Cloud H100/B200 | Target finale: organization specialist + LoRA stack vertical |

**Cambio chiave nel razionale**:
- Step 3 non è scelto per "SOTA coding" (SWE-V 73.4%) — la metrica che ci interessa è **organization+planning capability + criticality awareness**, e Qwen3.6 ha più capacity totale = più capacity per imparare organization complex.
- Coding strength del base non è priorità, anzi può essere "diluita" dal training organization-focused. Va bene così, perché coding viene aggiunto da LoRA.
- Skip ufficiale di Qwen3-Coder e Qwen3.6-Coder come base — siamo agnostici al coding del base perché lo aggiungeremo via LoRA.

### 5. Connessione con appunti utente (concept files)

Questa vision rende **ancora più rilevanti** i seguenti concept utente:

- `pre-flight-safety-checks` — è esattamente la "awareness criticità implicite" dell'esempio (cancellazione file)
- `structured-context-sections` — il modello deve usarlo per organizzare task multi-step
- `task-decomposition-adhoc-context` — core capability del Tier 1
- `agent-wrapper-vars-queue` — supporto runtime per organization tasks
- `temporal-awareness-timestamps` — multi-day continuity = organization-first
- `error-memo-system` — lessons learned su criticità sono valore principale

### 6. Wrapper form chiarito — **Web UI o App**

L'utente ha indicato Web UI o App come forma del wrapper. Implicazioni:

- Backend Python (FastAPI o Litestar) — espone API verso frontend
- Frontend Web (React/Vue/SvelteKit) o App desktop (Tauri preferito vs Electron per peso)
- Sessione multi-day richiede persistenza locale (SQLite) + sync su backend
- Auth necessaria se Web (per ora single-user)
- Non-CLI, non-IDE-extension (decidemmo questo)
- **Aggiornare `wiki/architecture/wrapper.md`** di conseguenza

## Filosofia di lavoro (chiarita)

> "Siamo scienziati, evolviamo le nostre idee e concetti in base alle evidenze. Se le evidenze dimostrano una strada migliore la percorriamo. Al più rivalutiamo l'applicazione, es: ragionamento da validare con altri modelli, architetture, grandezze diverse. Più esperimenti si fanno e più capiamo la strada corretta. Dobbiamo semplicemente seguire quella."

**Conseguenze operative**:

1. ADR sono **provisional**, non immutabili. Ogni evidenza forte → ADR di revisione (no censura dell'idea originale).
2. Esperimenti hanno **valore di per sé**, anche se invalidano un'ipotesi.
3. Ridimensionare ambizione (e.g. "agent multi-day autonomy" potrebbe essere ridotto a "multi-hour" se evidenze mostrano è impossibile a 7-14B) è **OK** se basato su numeri.
4. Più modelli/architetture/grandezze testati = più sicurezza nelle conclusioni. Pianificare ablation grandi.

## Budget e deadline (chiariti)

- **Budget al momento 0**: hardware locale (2080 Ti) per Step 1. Cloud successivamente "vedrò come fare" — non c'è ancora budget allocato, da rivalutare quando arriviamo a Step 2.
- **Deadline**: nessuna. "Fatto bene ma senza sprecare tempo". Privilegiamo qualità rispetto a velocità.
- **Team**: solo l'utente per ora. Nessun co-author/contributor planned.

## Linked

- Corregge in parte: [[2026-05-21-project-bootstrap]] (razionale base model)
- Corregge in parte: [[2026-05-21-base-model-pipeline]] (motivazioni dei Step)
- Aggiorna: [[../architecture/three-tier-design]], [[../architecture/orchestrator-layer]], [[../architecture/wrapper]]
- Conferma rilevanza: tutti i 14 concept appunti utente, specialmente [[pre-flight-safety-checks]], [[task-decomposition-adhoc-context]], [[error-memo-system]]

## Stato

`accepted` — 2026-05-21. Aggiornamenti dei file collegati eseguiti in batch insieme a questo ADR.
