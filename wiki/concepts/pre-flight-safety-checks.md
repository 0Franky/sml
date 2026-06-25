---
name: pre-flight-safety-checks
description: Verifiche pre-azione per asset/risorse a rischio (git, backup, file persi). Hard limit enforcement.
type: concept
tags: [concept, safety, pre-flight, validation, git, backup, hard-limit]
sources: [user notes 2026-05-21]
last_updated: 2026-05-21
---

# Pre-Flight Safety Checks

## Idea ground truth (utente, 2026-05-21)

> "Verifica dei file che potrebbero essere persi prima di iniziare (es: git versiona file? allora lavora diretto, lo recuperi - non ci sono backup? chiedi all'utente se vuole eseguire il bk e per quali file)."

## Cosa risolve

Un agent autonomo che fa azioni distruttive (overwrite file, rm, drop table, git reset --hard) può causare perdita di lavoro irrecuperabile. **Pre-flight checks** = verifiche eseguite PRIMA dell'azione per:

1. Capire se l'azione è reversibile (ha backup/version control)
2. Se non lo è, **fermare** e chiedere conferma
3. Eventualmente eseguire backup automatico prima di procedere

Questo è il meccanismo di enforcement degli **hard limits** dichiarati in `<assets>` (vedi [[structured-context-sections]]).

## Tipi di pre-flight check

### 1. File system checks

| Check | Trigger | Action |
|---|---|---|
| File è versionato in git? | overwrite, delete file | se sì: procedi (recoverable via git). Se no: backup |
| Directory tracked? | rm -rf directory | se yes: procedi con caveat. Se no: HALT |
| File ha modifiche uncommitted? | overwrite | warn user, backup first |
| File è in `.gitignore`? | delete | HALT — probabilmente file locale critico (e.g. .env) |

Comandi check (per git):

```bash
git status --porcelain "<file>"
git ls-files "<file>"
```

### 2. Database checks

| Check | Trigger | Action |
|---|---|---|
| Tabella ha backup? | DROP, TRUNCATE | se yes: warn. Se no: HALT |
| Migration framework presente? | CREATE/ALTER TABLE | se yes: usa migrations (alembic). Se no: HALT, suggerisci migration |
| Data recente di backup? | qualsiasi DESTRUCT | se < 24h: ok. Se > 24h: warn |

### 3. Shell command checks

Whitelist + blacklist:

| Pattern | Action |
|---|---|
| `rm -rf /`, `rm -rf $HOME`, `rm -rf ~` | HARD HALT |
| `dd`, `mkfs`, `fdisk` | HARD HALT |
| `sudo` | warn, richiede conferma utente |
| `curl -X POST` a domini non whitelist | warn |
| `git push --force` su main/master | HARD HALT |
| `git reset --hard` su uncommitted | warn, backup before |

### 4. Network / external action checks

| Check | Trigger | Action |
|---|---|---|
| POST a esterno con secret in body | qualsiasi network call | HALT, leak prevention |
| Domain in whitelist? | network call | se no: warn |
| Rate limit sotto soglia? | API call | se no: throttle |

### 5. Secrets / sensitive files checks

| Check | Trigger | Action |
|---|---|---|
| File contiene API key / token? | read/write/print | warn, NO log full content |
| `.env`, `.envrc`, `secrets/` | access | warn, log access esplicito |
| Path `~/.ssh/`, `~/.aws/`, `~/.kube/` | read | HARD HALT |

## Flow operativo

```
[Agent decide azione A su asset X]
  ↓
[Wrapper esegue pre-flight check]:
  - Lookup hard_limit in asset X
  - Esegui check pertinenti (factual + logical)
  - Calcola reversibility risk
  ↓
[Decision tree]:
  ├─ Reversible (versionato/backup) → procede
  ├─ Recoverable con backup automatico → fai backup + procede
  ├─ Irrecoverabile → HALT
  │   └─ Emit user_confirmation_request:
  │       "Azione A su asset X è irreversibile (X non versionato, no backup).
  │        Vuoi:
  │          1. Procedere (rischio totale)
  │          2. Backup manuale prima
  │          3. Setup git init / backup script
  │          4. Annulla"
  ↓
[User risponde]
  ↓
[Esecuzione]
```

## Format della richiesta conferma

```xml
<safety_halt source="pre_flight_check" severity="critical">
  ASSET: user_router.py
  AZIONE PROPOSTA: overwrite (current state → new state)
  RISK: file non versionato in git, no backup recente
  IRREVERSIBILE: sì
  RACCOMANDAZIONI:
    [A] Esegui backup automatico in ./backups/user_router.py.{timestamp}
    [B] Inizializza git nella directory e committa
    [C] Procedi senza backup (accept rischio)
    [D] Annulla operazione
  USER ACTION REQUIRED: scegli [A/B/C/D]
</safety_halt>
```

## Integrazione con hard limits (assets)

In [[structured-context-sections]], ogni `<asset>` dichiara hard_limit. Il pre-flight checker:

1. Legge hard_limit dell'asset coinvolto
2. Esegue il check corrispondente (mapping hard_limit → check function)
3. Se check fallisce → HALT

Mapping esempio:

| hard_limit attr | check function |
|---|---|
| `git_check` | `git ls-files <asset>` deve restituire path |
| `no_drop` | DROP statement → halt |
| `dangerous_cmd_list` | regex su command vs blacklist |
| `no_external_post` | URL parsing + whitelist check |
| `no_delete` | rm/unlink → halt |

## Backup automatico

Quando il check decide "backup before procede":

```
backup_dir = .agent-backups/{YYYY-MM-DD}/{task_id}/
copy asset → backup_dir/{asset_relative_path}.{timestamp}.bak
log to wrapper memory: backup_id, original_path, restore_command
```

L'agent può poi restoraré con singolo comando se l'azione si rivela sbagliata.

## Cleanup backup

I backup auto-generati hanno TTL (default 7 giorni). Wrapper cron pulisce vecchi backup. Skill `cybersecurity-threat-analyst` o `senior-code-architect` può validare retention policy.

## Trade-off

| Pro | Contro |
|---|---|
| Previene perdita di lavoro irreversibile | Latency overhead per ogni azione critica |
| Educa l'utente (suggerisce git init) | Falsi positivi possono frustrare |
| Audit log completo | Backup automatico → storage usage |
| Auto-rollback possibile | Maintenance backup TTL |

## Failure modes

1. **Check skipped**: agent emette azione senza passare per il checker (bug wrapper). Mitigazione: tutti i tool tool-call obbligati a passare per il checker.

2. **Backup fallisce silentemente**: disk full, permessi → procede ignaro. Mitigazione: backup validation, retry, escalation.

3. **Storia troppo lunga**: 1000 backup accumulati → storage. Mitigazione: TTL + cron cleanup.

4. **Race condition**: agent emette 2 azioni parallele, una invalida l'altra. Mitigazione: lock per asset durante operazioni critical.

## Relazione con altre componenti

- **[[structured-context-sections]]**: hard_limit di asset → guida check
- **[[contradiction-detection-layer]]**: check fallisce → emette attention event
- **[[error-memo-system]]**: pattern di check falliti → memo per future task
- **[[task-decomposition-adhoc-context]]**: ogni step include `<pre_flight_check_list>` nel plan

## Open questions

- Granularity check: per ogni tool call (latency alto) o batch?
- Backup storage location: locale, cloud (s3), entrambi?
- User confirmation UX: come renderlo non bloccante? (notif systray vs CLI prompt vs auto-suggest)
- Modello deve "imparare" quali check sono ricorrenti per il progetto e suggerire skip?

## Link interni

- [[structured-context-sections]] — hard_limits dichiarati negli asset
- [[contradiction-detection-layer]] — analogo per checks coerenza
- [[error-memo-system]] — check falliti → memo
- [[task-decomposition-adhoc-context]] — pre-flight per step
- [[untrusted-content-delimiting]] — anche le fonti untrusted hanno safety check
- [[agent-constitution]] — principi A (sicurezza/reversibilità) + C7 (deferenza ai bivi) formalizzano questi check come codice di condotta
- [[../architecture/wrapper]] — implementazione (come extension di [[../decisions/2026-06-23-pi-harness-base|pi]])

## Sources

- Claude Code "executing actions with care" pattern (from system prompt)
- Aider auto-commit + auto-test pattern
- `git stash` / `git ls-files` for version check
- Atomic operations theory (database systems)
- User notes 2026-05-21
