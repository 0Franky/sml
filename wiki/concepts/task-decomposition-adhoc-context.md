---
name: task-decomposition-adhoc-context
description: Decomposizione del lavoro in step + costruzione context ad-hoc per ogni step per ridurre context-rot.
type: concept
tags: [concept, task-decomposition, context-engineering, context-rot, planning]
sources: [user notes 2026-05-21]
last_updated: 2026-05-21
---

# Task Decomposition + Ad-hoc Context per Step

## Idea ground truth (utente, 2026-05-21)

> "Quello che pensavo è di fare in modo che lm organizzi il lavoro in step. Per ogni step il wrapper cosa farà creerà un contesto ad hoc per quel specifico task così da ridurre il contesto minimizzare il context-rot e altre informazioni che potrebbero essere fuorvianti."

## Cosa risolve

**Context-rot** = quando il contesto cresce con informazioni accumulate da step precedenti diventando rumoroso, irrilevante per lo step corrente, e degradante per l'attention del modello (paper "Lost in the Middle", Liu et al. 2023).

Strategie tradizionali:

- **Tutto-in-uno**: dump enorme context per ogni step. Caro, lento, lossy.
- **Sliding window**: drop dei messaggi vecchi. Perde info importante.
- **RAG**: retrieve solo al query time. Discontinuo, no state evolution.

Strategia proposta: **context ad-hoc per step** — il wrapper costruisce ogni context dal zero, includendo SOLO ciò che è rilevante per il singolo step.

## Workflow

```
[Inizio task]
  ↓
[LM in modalità "plan" emette decomposizione]
  - Step 1: <descrizione, output atteso, asset richiesti>
  - Step 2: ...
  ↓
[Wrapper salva plan + queue]
  ↓
[Loop su queue]:
  ↓
  [Wrapper costruisce context ad-hoc per Step N]
    - <aim> = singolo step
    - <current_state> = post Step N-1
    - <assets> = solo quelli rilevanti a questo step
    - <memory> = solo top-K rilevanti a questo step (semantic ranking)
    - <working_history> = solo turni che impattano questo step
  ↓
  [LM esegue Step N in modalità "execute"]
  ↓
  [Wrapper raccoglie output, update plan/queue]
  ↓
  [Step N+1: ricomincia da capo con context fresh]
```

## Componenti del context per step

### 1. Inizializzazione "plan" mode

Il primo turno l'agent NON esegue. Risponde con:

```xml
<plan>
  <step id="1" name="setup_env">
    <description>Crea virtualenv e installa dipendenze</description>
    <output>requirements.txt risolto, .venv attivo</output>
    <assets_needed>shell_exec, requirements.txt</assets_needed>
    <hard_limits_relevant>shell:dangerous_cmd</hard_limits_relevant>
    <success_criteria>pip list mostra tutte le dipendenze</success_criteria>
    <estimated_thinking_tokens>200</estimated_thinking_tokens>
  </step>
  <step id="2" name="define_schema">
    <description>Definisci schema users in SQLAlchemy</description>
    ...
  </step>
  ...
</plan>
```

Il wrapper salva e usa questo `plan` per gli step successivi.

### 2. Execute mode (per ogni step)

Context ad-hoc costruito dal wrapper:

```xml
<context>
  <aim>{plan.step[N].description}</aim>
  <current_state>
    {plan.step[N-1].output}
    Step corrente: N - {plan.step[N].name}
  </current_state>
  <state_queue>
    {plan.step[N+1..end].descriptions in formato compresso}
  </state_queue>
  <assets>
    {filter assets by plan.step[N].assets_needed}
  </assets>
  <memory>
    {retrieve top-K from persistent memory by semantic similarity to plan.step[N].description}
  </memory>
  <working_history>
    {filter last turns relevant to plan.step[N]}
  </working_history>
</context>
```

Context complessivo: idealmente **5-15K token** per step, vs 100K+ per "tutto-in-uno". Beneficio: attention concentrata, latency bassa, accuracy alta.

### 3. Aggregazione output di step

Dopo execute mode di Step N:

```xml
<step_result step_id="N">
  <output>{output prodotto}</output>
  <state_delta>{cambiamenti agli asset}</state_delta>
  <new_observations>{cose imparate utili per step futuri}</new_observations>
  <plan_changes>{revisione del plan, eventuali nuovi step}</plan_changes>
</step_result>
```

Queste informazioni vanno in `<memory>` per step successivi (filtrate per relevance).

## Trade-off

| Pro | Contro |
|---|---|
| Context piccolo → attention quality alta | Wrapper logic complessa |
| Latency per step bassa | Plan-then-execute aggiunge overhead iniziale |
| Costo token totale ridotto (no ridondanze) | Re-fetching memory ogni step ha costo |
| Modulare, debuggable per step | Stato cross-step va gestito esplicitamente |
| Resiste a context-rot | Errori di decomposizione cascade |

## Failure modes

1. **Plan-step omesso**: agent salta uno step necessario nel plan iniziale → fallisce su step successivo che lo richiede. Mitigazione: validazione plan dopo emissione (LLM-as-judge o regex sui requirements).

2. **Asset mancante in step context**: il wrapper filtra un asset che invece serviva. Mitigazione: agent può richiedere asset additivi durante execute mode (`<request_asset id="..."/>`).

3. **Memory ranking sbagliato**: top-K semantic retrieval perde un dato critico. Mitigazione: l'agent può fare query esplicita alla memory (vedi [[../architecture/wrapper]]).

4. **Plan obsoleto**: dopo step 3, l'agent capisce che step 5 va riscritto. Mitigazione: l'output di execute mode include `<plan_changes>` esplicito.

5. **Cross-step contraddizione**: step 7 produce risultato contraddittorio con step 3. Mitigazione: [[contradiction-detection-layer]] su `<current_state>`.

## Relazione con architettura three-tier

- **Tier 1 (orchestrator)**: emette il `<plan>`. Trainato esplicitamente su task decomposition.
- **Tier 2 (programming generalist)**: caricato per execute mode su step coding-related.
- **Tier 3 (vertical)**: caricato per execute mode su step stack-specific (frontend, backend, ecc.).
- **Wrapper**: orchestratore del flow, costruisce context ad-hoc.

## Open questions

- Come trainare il modello a fare buone decomposizioni?
- Granularità ottimale: micro-step (5-min ognuno) vs macro-step (1h ognuno)?
- Quando il plan dovrebbe essere immutable vs mutable?
- Sub-decomposition: uno step può a sua volta decomporsi recursive?
- Plan multi-day: come mantenere coerenza su settimane?

## Link interni

- [[structured-context-sections]] — formato del context costruito per ogni step
- [[structured-thinking]] — il thinking strutturato dentro ogni step
- [[external-update-injection]] — update tra step
- [[contradiction-detection-layer]] — monitora coerenza cross-step
- [[error-memo-system]] — errori per step vanno in memory
- [[../architecture/wrapper]] — implementazione del flow

## Sources

- Liu et al. (2023) "Lost in the Middle: How Language Models Use Long Contexts" — https://arxiv.org/abs/2307.03172
- ReAct pattern (Yao et al. 2022) — https://arxiv.org/abs/2210.03629
- Claude Code subagent pattern (dispatching independent subagents with fresh context)
- User notes 2026-05-21
