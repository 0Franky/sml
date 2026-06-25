---
name: session-summary-2026-05-21
description: Comprensione completa del progetto dopo grill-me #1. Versione originale + correzioni esplicite utente.
type: summary
tags: [summary, vision, comprehension, grill-me]
date: 2026-05-21
last_updated: 2026-05-21
---

# Comprensione del progetto — 2026-05-21

Sintesi prodotta a fine grill-me #1 in risposta alla richiesta dell'utente "spiegami tutto quello che hai capito sin dall'inizio". L'utente ha poi fornito 7 correzioni/chiarificazioni che ho integrato qui in linea con marker `→ CORREZIONE UTENTE:` per traceability.

Confidence markers: `[V]` verificato dai messaggi diretti utente, `[A]` assunto/inferito, `[?]` ancora dubbioso.

---

## 1. Chi è l'utente

- `[V]` Ricercatore solo / fondatore-indipendente. Windows 11, PowerShell, italiano. Sviluppa in autonomia.
- `[V]` Familiarità con LoRA/QLoRA/PEFT/fine-tuning/multi-adapter. Non principiante.
- `[V]` Vittima di una AI precedente che ha tradito la vision (transcript.md): ha proposto redesign che eliminava 2/3 dei livelli architettura. Da qui prudenza.
- `[V]` Vuole **feedback critico oggettivo**, no piaggeria. Vuole che dichiari trade-off senza sovrascrivere silenziosamente.
- `[V]` Vuole tutto **tracciato, auditabile, persistente** (wiki, graph, ADR, memory). Pattern Karpathy.
- `[A]` Ha esperienza con AI tools (Claude Code, Cursor, varie) che lo hanno deluso — da qui attenzione a untrusted/contradiction/error-memo.

→ **CORREZIONE UTENTE su team**: confermato `[V]` "no, per ora ho solo te". Solo lui come stakeholder. Nessun co-author/contributor planned.

---

## 2. Cosa vuole costruire — la vision

### Versione che avevo capito (parzialmente errata)

`[V]` Un **Small Language Model coding-specialized** + **wrapper applicativo** attorno.

L'SLM deve essere un **agent autonomo coding versatile**: code + esecuzione test + git ops + cross-codebase + multi-day autonomy.

### → CORREZIONE UTENTE — VISION VERA

> "Un Small Language Model **organization-specialized** + wrapper applicativo. Prima deve essere bravo a organizzare e pianificare le cose a orizzonti lunghi, **catturando tutte le possibili criticità anche implicite** ad alcune azioni di step richiesti (esempio: cancellazione file precedente — se lo ricordi, se no fa nulla). **Dopo** che ha acquisito queste capacità fondamentali di base, **solo allora** si specializza con layer(s) LoRA."

**Implicazione fondamentale**:
- Il **base full-FT** è **organization/planning specialist**, NON coding specialist
- Il coding arriva **dopo**, via LoRA aggiunti sopra
- Esempio canonico utente: "cancellazione di un file precedente — se lo ricordi, se no fa nulla" → modello deve avere awareness intrinseca di criticità implicite

**Conseguenze**:
- Nuovo ADR: `wiki/decisions/2026-05-21-vision-clarification.md`
- Dataset Tier 1 RIBILANCIATO: 30% task decomposition + 20% safety reasoning + 15% multi-day continuity + 10% cross-codebase strutturale + 10% structured reasoning + 5-10% coding replay minimo + 5-10% generic
- Eval Tier 1 NON è SWE-Bench (quello è per Tier 1+2+3 attivi). Tier 1 da solo si valuta su agent benchmarks (AgentBench, τ-Bench, LIBERO) + custom criticality awareness + multi-day continuity
- Naming corretto: NON "coding agent autonomo" → **"organizing agent autonomo che sa anche fare coding"**

---

## 3. Architettura del modello — three-tier

### Cosa avevo capito (struttura corretta, ruoli ora chiariti)

`[V]` Tre livelli **sequenziali**, hot-swap di adapter (NOT MoE neurale):

1. **Tier 1 — Orchestrator full-FT**: sempre attivo, decide cosa fare
2. **Tier 2 — Programming generalist LoRA**: caricato per task coding
3. **Tier 3 — Verticale stack-specifico LoRA**: caricato sopra Tier 2 (uno alla volta)

`[V]` "Delegare" = hot-swap via PEFT/vLLM (`--enable-lora`), NOT routing differenziabile dentro forward pass. Chiarito dall'utente in transcript.md:325.

### → CORREZIONE UTENTE — RUOLO TIER 1

- **Tier 1 NON è coding-aware orchestrator. È organization specialist puro.**
- Tier 2 (programming generalist) aggiunge knowledge coding generic (perché il base non ce l'ha più)
- Tier 3 (verticale) aggiunge stack-specific
- L'esempio "cancellazione file precedente con awareness recovery" è quello che Tier 1 deve gestire intrinsecamente, NON come tool call esterno

### Architettura corretta

```
┌────────────────────────────────────────────────────────────┐
│  Qwen base full-FT → ORGANIZATION/PLANNING SPECIALIST     │
│  - planning lungo orizzonte                                 │
│  - awareness criticità implicite (file cancellati, etc)    │
│  - safety reasoning pre-azione                              │
│  - state tracking, queue management                         │
│  - multi-day session continuity                             │
│  - cross-codebase ragionamento STRUTTURALE (no codice)     │
│  → CORE DEL VALORE DEL PROGETTO                            │
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

---

## 4. Pipeline base model (decisione fissata ADR + razionale aggiornato)

Pipeline **confermata identica** (Qwen3-4B → Qwen3-8B → Qwen3.6-35B-A3B), ma **razionale aggiornato** dopo la vision clarification.

| Step | Modello | Hardware | Ruolo (versione organization-first) |
|---|---|---|---|
| 1 | **Qwen3-4B-Instruct-2507** | 2080 Ti 11GB locale | Workflow consolidation + mini organization FT |
| 2 | **Qwen3-8B** | Cloud A100 40GB | Organization full FT serio + LoRA programming generalist training |
| 3 | **Qwen3.6-35B-A3B** | Cloud H100/B200 | Target finale: organization specialist + Tier 2 + Tier 3 verticali |

**Razionale aggiornato**:
- Step 3 NON è scelto per "SOTA coding". È scelto perché ha più capacity totale → più capacity per imparare organization complex
- Coding strength del base **non è priorità**, anzi può essere diluita dal training organization-focused — va bene, perché coding viene da LoRA
- Skip ufficiale di Qwen3-Coder e Qwen3.6-Coder come base: siamo agnostici al coding del base
- Trade-off accettato: Step 3 cambia arch (Qwen3 dense → Qwen3.6 hybrid MoE+DeltaNet) → adapter Step 2 non transferable, ma metodologia + dataset + eval si trasferiscono

→ **CORREZIONE UTENTE su budget**: `[V]` "al momento 0, per questo consolidiamo il possibile sul nostro hw e poi andiamo online. poi vedrò come fare." Cloud budget da rivalutare quando arriviamo a Step 2.

---

## 5. Wrapper — forma chiarita

### → CORREZIONE UTENTE — FORMA

`[V]` "Web UI o App"

Esclusi esplicitamente: CLI standalone, IDE extension, multi-agent orchestrator standalone.

Implicazioni stack:
- Backend Python (FastAPI/Litestar) — REST/WebSocket
- Frontend: Web (React/Vue/SvelteKit) o App desktop (Tauri preferibile vs Electron)
- Persistenza locale: SQLite per memory + VARS + tool log
- Auth: per ora single-user

Da scegliere Web vs App in **grill-me #2 dedicato**.

---

## 6. I 4 livelli concettuali del wrapper (dai tuoi appunti)

`[V]` Confermati 14 file di concept divisi in 4 categorie:

### A. Reasoning structure (come pensa il modello)

- **structured-thinking** — caveman thinking, marker `[V]/[A]/[?]`, no discorsivo
- **post-rl-path-optimization** — impratichimento + token compression dopo RL
- **error-memo-system** — memo errori (generico + esempi pratici), recupero semantic
- **multi-token-prediction-training** — heads multiple: next, +2, +3, sketch, state

### B. Context engineering (cosa vede il modello)

- **structured-context-sections** — XML tag con `<aim>`/`<state>`/`<assets>` (hard_limits)/`<interconnections>`/etc
- **external-update-injection** — `<update from external>` tra `<section>`
- **untrusted-content-delimiting** — `<untrusted_zone>` UUID marker, anti-prompt-injection
- **task-decomposition-adhoc-context** — plan-then-execute, context ad-hoc per step
- **temporal-awareness-timestamps** — `<temporal_state>` + tool call timing

### C. Runtime safety + coherence

- **contradiction-detection-layer** — detector cross-section, attention event. **GAP DI LETTERATURA** (paper opportunity)
- **pre-flight-safety-checks** — verifiche pre-azione (git, backup, hard limits). **Realizza l'esempio cancellazione file**

### D. Wrapper runtime architecture

- **agent-wrapper-vars-queue** — 4 lane TASKS/VERIFICATIONS/RULES/VARS + CURR pointer
- **sliding-window-variable-tool** — tool char-range per read/replace VARS
- **explicit-attention-layer** — attention forzata su aim/prev_step/global/rules

→ **CORREZIONE IMPLICITA UTENTE**: con la vision corretta, **pre-flight-safety-checks e error-memo-system diventano core**, non opzionali. Sono la realizzazione concreta dell'awareness criticità implicite del Tier 1.

---

## 7. Gap di letteratura (paper opportunity)

`[V]` Due aree con **no comparable published work**:

1. **Structured update injection mid-thinking** come pattern formalizzato (vs LangGraph/AutoGen interrupt a livello agent loop)
2. **Structured-context contradiction detection layer runtime-side** (vs SelfCheckGPT/CRITIC che sono inside-the-model)

Candidati paper-contribution originale del progetto. Salvati in memory `project_research_gaps.md`.

---

## 8. Cross-concept patterns trasformativi (dalla ricerca correlata)

`[V]` Tre pattern emersi:

- **Pattern α — Knowledge Graph Runtime**: unifica assets + interconnections + memory + untrusted in grafo versionato. Memory retrieval = graph traversal
- **Pattern β — Self-Supervision Loop**: error-memo + contradiction + post-rl → loop continuo apprendimento via LoRA swap **senza retraining base**
- **Pattern γ — Context API**: context come API (`ctx.get_aim()`, `ctx.add_memo()`) — non più blob testo

Plus 5 idee derivative: hard limits → grammar constraint (Outlines/xgrammar), Tier 2/3 come compression specialists, DAG decomposition, datamarking auto-adversarial, NLI differential check.

---

## 9. Filosofia di lavoro

### → CORREZIONE/CHIARIMENTO UTENTE — APPROCCIO SCIENTIFICO

`[V]` "Siamo scienziati, evolviamo le nostre idee e concetti in base alle evidenze. Se le evidenze dimostrano una strada migliore la percorriamo. Al più rivalutiamo l'applicazione, es: ragionamento da validare con altri modelli, architetture, grandezze diverse. Più esperimenti si fanno e più capiamo la strada corretta. Dobbiamo semplicemente seguire quella."

**Conseguenze operative**:

1. **ADR sono provisional**, non immutabili. Ogni evidenza forte → ADR di revisione (senza censurare l'idea originale)
2. **Esperimenti hanno valore di per sé**, anche se invalidano un'ipotesi
3. **Ridimensionare ambizione OK** se basato su numeri (es. multi-day → multi-hour se evidenze lo richiedono)
4. **Più modelli/architetture/grandezze testati = più sicurezza nelle conclusioni**. Pianificare ablation grandi
5. **Validazione cross-architettura** per ragionamento: il pattern di pensiero strutturato deve funzionare su Qwen, Llama, Mistral, DeepSeek — non legarci a un solo modello

→ **CORREZIONE UTENTE su deadline**: `[V]` "no [pressione], voglio fare le cose fatte bene, quindi lavoriamo solo per questo senso. ovviamente senza perdere tempo." → Privilegiamo qualità rispetto a velocità, ma senza procrastinare.

---

## 10. Knowledge management (come stiamo lavorando)

`[V]` **Wiki Karpathy-pattern** in `wiki/`:
- 5 architecture files
- 9 entities (Qwen3-Coder family + paper LoRA family)
- 18 concepts (14 dai tuoi appunti + 4 progetto)
- 3 ADR datati (project-bootstrap, base-model-pipeline, vision-clarification)
- 4 root (README, index, log, open-questions)
- 1 session-summary (questo file)

`[V]` **Knowledge graph** (graphify): 197 nodes / 389 edges / 13 communities. Riduzione token query 7.7×.

`[V]` **CLAUDE.md** = schema. 5 fasi + regole permanenti.

`[V]` **Memory persistente**: 11 entries (user, project, feedback, reference, research-gaps).

---

## 11. Open questions — stato

| Categoria | Stato |
|---|---|
| Chiuse | #1 use case, #5 base orchestratore, #6 base verticali, #11 hardware → ora corrette dopo vision clarification |
| Da chiudere in grill-me #2 wrapper | #2 forma wrapper (precisato Web/App), #24-28 context/reasoning ottimizzazioni |
| Precompilate da smarcare | #3, #4, #7, #8, #9, #10, #12-23 (14 questions) |

---

## 12. Cosa non capivo bene (sezione "Cosa ancora non capisco")

Ricapitolo lo stato precedente + correzioni utente:

| Domanda | Stato dopo correzione |
|---|---|
| Wrapper form concreto | `[V]` "Web UI o App" — Web o desktop da decidere in grill-me #2 |
| Quanto rigido su three-tier | `[V]` "Siamo scienziati, evolviamo in base alle evidenze." → ADR provisional, esperimenti validano |
| Budget cloud realistico | `[V]` "Al momento 0, hardware locale, poi cloud — vedrò come fare" |
| Deadline reali | `[V]` "No, fatto bene senza sprecare tempo" |
| Telegram contesto | `[V]` "Stesso di sopra" (interpretato come: lo usa quando vuole, no scope fissato) |
| Team futuro | `[V]` "Per ora ho solo te" — single user, nessun co-author |

---

## 13. Sintesi in una frase (versione corretta post-correzione utente)

Stai costruendo un **Small Language Model organization-specialized** (base full-FT su organization, planning, awareness criticità implicite, safety reasoning, multi-day continuity) **+ LoRA coding-specialized aggiunti sopra** (Tier 2 programming generalist + Tier 3 verticali stack-specific) **+ wrapper Web UI o App desktop** (FastAPI backend + frontend Web/Tauri) che implementa pattern di structured reasoning, context engineering tagged, contradiction detection runtime, safety pre-flight, queue-based state management, con obiettivo finale di un **organizing agent autonomo multi-day che sa anche fare coding**, basato su Qwen3.6-35B-A3B come target finale, potenzialmente paper-worthy su due gap di letteratura identificati (mid-thinking update injection + runtime contradiction detection layer).

Approccio **scientifico evolutivo**: evidenze guidano, ADR provisional, validazione cross-architettura, esperimenti accumulati sono il vero asset. Budget: locale ora, cloud da rivalutare. Deadline: nessuna esterna, qualità primaria. Team: single-user (l'utente).

---

## 14. Cosa serve ancora per il vero MVP

Stato attuale = bootstrap + vision allineata. Per cominciare a costruire:

1. **Smarcare 14 open questions** precompilate (granularità verticali, replay %, framework, eval suite, ecc.)
2. **Grill-me #2 wrapper** (Web vs App + context org + memory + tool calling + session lifecycle)
3. **Sprint idee** sui 5+3 pattern emersi + nuovi pattern dal grafo
4. **Phase 0 — Baseline eval di Qwen3-4B-Instruct-2507 su 2080 Ti** (misurazione capability organization-pre-FT)
5. **Generazione dataset Tier 1 v0** (con composizione organization-first)
6. **Mini-experiment workflow: 1 LoRA verticale POC** prima di partire con Tier 1 FT
7. **Eval rigoroso**: AgentBench + τ-Bench + custom criticality + SWE-Bench (per Tier 1+2+3)

## Sources

- Sessione grill-me #1 con utente, 2026-05-21
- Correzioni utente 7-fold (use case, salvataggio, wrapper form, filosofia, budget, deadline, team)
- ADR collegati: project-bootstrap, base-model-pipeline, **vision-clarification** (questo session ne riassume i contenuti)
