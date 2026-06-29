---
name: agent-wrapper-vars-queue
description: Struttura runtime del wrapper — queue di TASKS/VERIFICATIONS/RULES/VARS con map O(1) e current pointer.
type: concept
tags: [concept, wrapper, runtime, queue, data-structure, vars-registry]
sources: [user notes 2026-05-21 hand-sketch photo]
last_updated: 2026-05-21
---

# Agent Wrapper Runtime — Queue + Vars Registry

## Idea ground truth (utente, 2026-05-21 — foto appunti)

Schema dalla foto:

```
AGENT WRAPPER
┌──────┐
│ CURR │
├──────┼───────┬───────┬─────────┐
│      │       │       │ VARS    │
│      │       │       │ LIST    │
│      │       │       │ ┌─────┐ │
│      │       │       │ │LIST │ │
│      │       │       │ │/MAP │ │
│      │       │       │ │O(1) │ │
│      │       │       │ └─────┘ │
└──────┴───────┴───────┴─────────┘
TASKS  VERIFICATIONS  RULES   VARS
        TO DO
              QUEUE  →

A destra:
VARS BY SLIDING WINDOW READ:
- PROMPT
- USER CHAT — LIST AI/USER CHAT (MCP?)
- CURRENT AIM
- GLOBAL VISION TASK SUMMARY
- PREV STEP SUMMARY
```

## Cosa rappresenta

Il **runtime state** del wrapper. Non è il context inviato al modello (quello è [[structured-context-sections]]), ma il **datastore interno del wrapper** da cui il context viene costruito dinamicamente.

Quattro "lane" parallele in una queue + un puntatore `CURR` alla riga corrente:

| Lane | Contenuto | Accesso |
|---|---|---|
| **TASKS** | Coda di task pianificati. Ogni task ha id, descrizione, status (TODO/IN_PROGRESS/DONE/BLOCKED), dipendenze | sequenziale + lookup by id |
| **VERIFICATIONS TO DO** | Coda di check da eseguire prima di avanzare. Hard limits, pre-flight, contradiction resolution | filter by current task |
| **RULES** | Regole runtime (constraints, hard limits, preferences utente, lesson learned). Sempre tutte attive | broadcast (sempre incluse) |
| **VARS** | Registry di variabili nominate (any data structure: list/map/string/file_handle/etc) | **map O(1) per ID lookup** |

Il `CURR` è il puntatore: indica quale riga della queue è "in lavorazione". Lo step corrente che alimenta il context ad-hoc (vedi [[task-decomposition-adhoc-context]]).

## Vars registry — perché O(1)

Le VARS sono **named handles** a dati possibly grandi:

```
vars = {
  "current_codebase_tree": <file_tree_object, 50KB>,
  "active_issue_body": <text, 3KB>,
  "test_results_last_run": <json, 12KB>,
  "user_prompt_original": <text, 500B>,
  "memory_top_5": <list[memo], 8KB>,
}
```

Il modello non vede mai il content full nel context. Quando ha bisogno di un dato, lo richiama **per ID** (`var_id`). Il wrapper poi:

1. Lookup O(1) nella map
2. Estrae **slice via sliding window** (vedi [[sliding-window-variable-tool]])
3. Inietta solo lo slice nel context

Beneficio: il context resta piccolo, ma il modello ha accesso "virtuale" a tutto il datastore.

## Sliding window read — riferimento

I dati elencati a destra nella foto ("VARS BY SLIDING WINDOW READ") sono var candidate per accesso slicing:

- **PROMPT** — user prompt originale, raramente serve full, slice on demand
- **USER CHAT** — lista turni AI/User, sliding finestra di N turni recenti, accesso a turni vecchi via slicing (MCP-style protocol?)
- **CURRENT AIM** — sempre full nel context (è piccolo, < 100 token)
- **GLOBAL VISION TASK SUMMARY** — task description complessivo, può essere lungo, slice se serve dettaglio
- **PREV STEP SUMMARY** — riassunto step precedente, full nel context (compatto)

Vedi [[sliding-window-variable-tool]] per il tool che il modello chiama per leggere slice.

## Flow operativo

```
[Avvio task]
  ↓
[Wrapper inizializza queue]:
  - TASKS: [main_task]
  - VERIFICATIONS_TO_DO: [setup_check, asset_inventory]
  - RULES: [load from project config + user prefs + active memos]
  - VARS: registry vuoto, populated as needed
  CURR = (TASKS[0], VERIFS[0], RULES[*], VARS[*])
  ↓
[Wrapper costruisce context ad-hoc per CURR]
  ↓
[Modello esegue step, emette output + var_refs richiesti]
  ↓
[Wrapper processa output]:
  - Esegui tool calls
  - Aggiorna VARS (nuovi handle creati)
  - Aggiorna TASKS (mark DONE / add new sub-tasks)
  - Aggiorna VERIFICATIONS (check eseguito → drop, nuovi check → push)
  - Aggiorna RULES (se nuova lesson learned in memo)
  ↓
[CURR advance → next iteration]
```

## Esempio runtime

```yaml
# State T-0 (start)
tasks:
  - id: t1, desc: "implement user model", status: TODO
  - id: t2, desc: "implement endpoint POST /users", status: TODO, blocks: [t1]
  - id: t3, desc: "write pytest suite", status: TODO, blocks: [t2]
verifications_to_do:
  - id: v1, desc: "git init done?", critical: true
  - id: v2, desc: "alembic available?", critical: false
rules:
  - id: r1, desc: "all endpoints in app/api/v1/"
  - id: r2, desc: "hash password before INSERT (lesson 2026-05-15)"
  - id: r3, desc: "no DELETE on users table without --force flag" (hard_limit)
vars:
  user_prompt_original: <ref_id=u_p_o>
  current_codebase_tree: <ref_id=c_c_t>
  memory_top_5: <ref_id=m_t_5>
CURR: (task=t1, verifs=[v1,v2], rules=all, vars=all)

# State T-1 (after step 1: schema defined)
tasks:
  - id: t1, status: DONE
  - id: t2, status: TODO  ← CURR
  - id: t3, status: TODO, blocks: [t2]
verifications_to_do:
  - (v1, v2 done, removed)
  - id: v3, desc: "schema migration created?", critical: true
  - id: v4, desc: "test fixture for users available?", critical: false
rules: (unchanged + new memo if triggered)
vars:
  user_prompt_original: <ref>
  current_codebase_tree: <ref, UPDATED with new file>
  schema_users: <new ref, content="..."> ← created in step 1
  memory_top_5: <ref>
CURR: (task=t2, ...)
```

## Persistenza

Il queue+vars state è persistito su disco dopo ogni step (per supportare multi-day session):

- **TASKS queue** → JSON
- **VERIFICATIONS** → JSON
- **RULES** → JSON (versionato git per audit)
- **VARS registry** → SQLite (per O(1) lookup + content possibilmente grande)

Skill `mcp__plugin_serena_serena__write_memory` (quando server attivo) può servire come backend in alternativa a SQLite.

## Concorrenza

Più sub-agent del wrapper potrebbero leggere/scrivere VARS in parallelo. Locking:

- **VARS reads**: lock-free (MVCC-style)
- **VARS writes**: lock per var_id, no contention cross-var
- **TASKS queue mutations**: append-only, atomic via transaction
- **CURR advance**: serializzato (un solo step alla volta normalmente)

## Trade-off

| Pro | Contro |
|---|---|
| O(1) lookup vars → context costruito veloce | Wrapper datastore complesso (4 lane + map) |
| Modello vede solo slice → context piccolo | Modello deve "imparare" a chiedere var slice |
| Multi-day persistence built-in | Schema migration se queue format cambia |
| Auditable (ogni state change loggato) | Storage usage cresce con sessione |

## Open questions

- VARS registry: in-memory + flush, o sempre persistente?
- Garbage collection di VARS non più referenziate (es. var creata e poi dimenticata)?
- Cross-session: VARS sopravvivono o reset?
- Schema RULES: declarative (regex/JSON Schema) o executable (Python predicate)?
- Migration path da queue v1 a queue v2 (rule schema evolves)?

## Link interni

- [[structured-context-sections]] — formato del context costruito DA questa queue
- [[task-decomposition-adhoc-context]] — usa il queue state per costruire ad-hoc context
- [[sliding-window-variable-tool]] — tool che modello chiama per leggere VARS slice
- [[explicit-attention-layer]] — quali sezioni del context ricevono attention forzata
- [[wrapper-context-assembly-example]] — esempio concreto: le lane serializzate via `ctx.getContext()`, `add_secret`, `close_stream_file`
- [[cross-session-state-sharing]] — propagazione delle VARS tra sessioni (cross-compact) e tra agenti (cross-agent) on-request + persistenza MIX file/DB + change-log/timestamp; chiude le open-question concorrenza/GC di questa pagina
- [[../architecture/wrapper]] — implementazione (come extension di [[../decisions/2026-06-23-pi-harness-base|pi]])

## Sources

- User notes 2026-05-21 (hand-sketch photo)
- Ispirazione: Voyager skill library + state, AutoGen group chat state, LangGraph state machine
