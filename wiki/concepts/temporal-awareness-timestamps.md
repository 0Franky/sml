---
name: temporal-awareness-timestamps
description: Senso del tempo nel modello — timestamp current + timing tool calls (request/response/failure).
type: concept
tags: [concept, temporal-awareness, timestamps, tool-call-timing, observability]
sources: [user notes 2026-05-21]
last_updated: 2026-05-21
---

# Temporal Awareness — Timestamps & Tool Timing

## Idea ground truth (utente, 2026-05-21)

> "Inoltre dobbiamo sempre passare l'orario attuale e dei tool call quando richiesti e quando ricevuta risposta / fallito - dobbiamo dare il senso del tempo."

## Cosa risolve

Un agent autonomo multi-day (vedi [[task-decomposition-adhoc-context]]) ha bisogno di **senso del tempo** per:

1. **Capire la durata** di tool call (è ancora "fresco" o è stale?)
2. **Decidere timeout**: se un tool aspetta da 5 min, probabilmente è bloccato
3. **Ragionare su scadenze**: "questo task ha deadline domani"
4. **Decay di memoria**: lesson di 6 mesi fa è ancora valida?
5. **Coerenza temporale**: lo state era T, ora è T+5min, cosa è cambiato?
6. **Audit**: ricostruire ordine eventi per debug

Senza temporal info, il modello vive in un "presente eterno" che lo confonde su task long-horizon.

## Cosa includere nel context

### 1. Timestamp corrente (sempre)

In `<context>`, sezione meta:

```xml
<temporal_state>
  <now>2026-05-21T14:33:42+02:00</now>
  <session_started>2026-05-21T09:15:00+02:00</session_started>
  <elapsed_session>5h 18min</elapsed_session>
  <user_timezone>Europe/Rome</user_timezone>
</temporal_state>
```

### 2. Timing per ogni tool call

Per ogni tool call, registra: request time, response time, durata, status.

```xml
<tool_call_log>
  <call id="tc-001" tool="shell_exec">
    <requested_at>2026-05-21T14:30:12+02:00</requested_at>
    <responded_at>2026-05-21T14:30:14+02:00</responded_at>
    <duration_ms>2148</duration_ms>
    <status>success</status>
    <command>pytest tests/test_user.py</command>
  </call>
  <call id="tc-002" tool="web_fetch">
    <requested_at>2026-05-21T14:31:05+02:00</requested_at>
    <responded_at>2026-05-21T14:31:47+02:00</responded_at>
    <duration_ms>42130</duration_ms>
    <status>success</status>
    <note>slow response — server lento o rete latente</note>
  </call>
  <call id="tc-003" tool="shell_exec">
    <requested_at>2026-05-21T14:32:00+02:00</requested_at>
    <responded_at>null</responded_at>
    <status>in_progress</status>
    <elapsed_so_far>105s</elapsed_so_far>
    <timeout_at>2026-05-21T14:37:00+02:00</timeout_at>
    <command>npm install --save react-redux</command>
  </call>
  <call id="tc-004" tool="git">
    <requested_at>2026-05-21T14:25:00+02:00</requested_at>
    <responded_at>2026-05-21T14:25:01+02:00</responded_at>
    <duration_ms>1023</duration_ms>
    <status>failed</status>
    <error>permission denied: cannot push to main</error>
  </call>
</tool_call_log>
```

### 3. Timestamp sulle VARS

Ogni VAR nel registry (vedi [[agent-wrapper-vars-queue]]) include:

```
vars[var_id] = {
  content: ...,
  created_at: <timestamp>,
  last_modified: <timestamp>,
  source: "tool_call:tc-001" | "user_input" | "agent_generated",
  fresh: True/False  # auto-set false dopo TTL
}
```

### 4. Timestamp sulle external_inputs

Quando il wrapper inietta update esterni (vedi [[external-update-injection]]):

```xml
<update from="external" source="..." timestamp="2026-05-21T14:33:50+02:00" age_ms="50">
  ...
</update>
```

L'`age_ms` aiuta il modello a giudicare priorità: update di 50ms fa è "in tempo reale"; update di 5min fa potrebbe essere obsoleto.

### 5. Timestamp sulle memo (error-memo-system)

Vedi [[error-memo-system]]: ogni memo ha date `created_at` e `last_applied_at`. Decay basato sull'età.

## Pattern di utilizzo

### A) Decidere se ritrarre o aspettare

Modello vede tool call in_progress da 100s. Decisione:

- Se tool tipicamente impiega <30s → probabilmente bloccato → emit retry o alert
- Se tool è "npm install" che può impiegare 2min → aspetta
- Se elapsed > timeout_at → consider failed

Il modello impara questi pattern da training su tool call log realistici.

### B) Stale data detection

```xml
<thinking>
  VAR `current_codebase_tree` last_modified: 2026-05-21T09:30:00 (5h fa)
  AZIONE: read file user_model.py
  CHECK: `current_codebase_tree` è stale? → 5h è oltre TTL 1h → SI
  ACTION: re-fetch codebase_tree prima di procedere
</thinking>
```

### C) Cross-session continuity

Multi-day agent (vedi [[task-decomposition-adhoc-context]]) deve riconoscere "ho lasciato qui ieri sera, oggi cosa è cambiato?".

```xml
<temporal_state>
  <last_session_end>2026-05-20T22:15:00+02:00</last_session_end>
  <now>2026-05-21T09:00:00+02:00</now>
  <gap>10h 45min</gap>
  <recommendation>verifica se asset hanno cambiato stato (es. utente ha committato durante la notte?)</recommendation>
</temporal_state>
```

### D) Tool call latency awareness

Se il modello vede che `web_fetch` impiega tipicamente 40s+, può:

- Chiamare in parallelo invece di sequenzialmente
- Pre-fetch speculative se prevede di servirgli dopo
- Avvisare l'utente "questo step richiederà ~1min"

## Training del modello a usare timestamp

Dataset di training deve includere:

1. Esempi di context con tool call log + correct reasoning su staleness
2. Esempi di decisione "wait vs retry" basata su elapsed
3. Esempi di multi-day session resume con gap analysis
4. Adversarial: timestamp inconsistenti (es. responded_at < requested_at) → modello deve flaggare

## Format scelte

### ISO 8601 con timezone

Sempre `2026-05-21T14:33:42+02:00` (mai naive UTC senza zone, mai relative "5min ago").

### Durations

Espresse in formato leggibile + machine-parseable:

- `42130ms` (precise, ml-friendly)
- `5h 18min` (human-friendly)
- Sezioni hanno entrambi.

### Granularity

- Tool call: precision ms
- Session events: precision second
- User-facing logs: minute

## Trade-off

| Pro | Contro |
|---|---|
| Sense of time → migliori decisioni async | Context bloat con timestamp ovunque |
| Stale data detection automatica | Modello deve imparare a interpretare |
| Multi-day continuity migliore | Format inconsistency → bug |
| Audit trail completo | Storage usage (log esplode in sessione lunga) |

## Token budget

Timestamp + tool log possono crescere rapidamente. Mitigazioni:

- **Compaction**: tool log di sessioni vecchie → riassunto LLM-generated
- **Truncation**: tieni solo ultimi N tool call full + summary del resto
- **On-demand**: tool log dettagliato in VAR separata, fetched solo on demand (vedi [[sliding-window-variable-tool]])

## Failure modes

1. **Clock drift**: wrapper su macchine diverse hanno clock leggermente diversi → timestamps inconsistenti. Mitigazione: NTP sync, validation post-hoc.

2. **Timezone confusion**: utente in CEST, server in UTC → conversioni sbagliate. Mitigazione: sempre con `+offset` esplicito, mai naive.

3. **Modello ignora timestamp**: trainato senza dataset adeguato → tratta come token rumore. Mitigazione: dataset dedicato + auxiliary loss "time-aware reasoning".

4. **Storage explosion**: 10000 tool call → tool log enorme. Mitigazione: compaction + on-demand fetching.

## Open questions

- Time-aware token in vocab? (es. `<time:2026-05-21T14:33>` come token speciale)
- Tool call log: full in context o reference-by-id?
- Compaction strategy: every N call, or on overflow?
- Cross-session memory: timestamps formattati come "ieri" o assoluti?
- Modelling latency: il modello dovrebbe avere model interno della latenza tipica per tool?

## Link interni

- [[structured-context-sections]] — `<temporal_state>` come sezione nuova del context
- [[agent-wrapper-vars-queue]] — VARS includono timestamp
- [[external-update-injection]] — update injection include `timestamp` e `age_ms`
- [[error-memo-system]] — memo decay basato su age
- [[task-decomposition-adhoc-context]] — multi-day continuity
- [[../architecture/wrapper]] — il wrapper gestisce e logga tutti i timestamp

## Sources

- ISO 8601 standard
- W3C "Date and Time Formats" — https://www.w3.org/TR/NOTE-datetime
- User notes 2026-05-21
- Ispirazione: distributed systems observability (Datadog, OpenTelemetry traces)
