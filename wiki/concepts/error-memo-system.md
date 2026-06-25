---
name: error-memo-system
description: Sistema di memo per errori commessi + lessons learned. Astrazione generica + esempi pratici.
type: concept
tags: [concept, error-handling, memory, learning, self-correction]
sources: [user notes 2026-05-21]
last_updated: 2026-05-21
---

# Error Memo System

## Idea ground truth (utente, 2026-05-21)

> "Se llm commette errore → salvare in memo cosa è successo e cosa evitare e come migliorare - prima presentazione del problema generico (se fattibile) e poi esempi pratici dei problemi affrontati realmente."

## Cosa risolve

Un agente autonomo che fa errori ricorrenti perde valore. Esempi tipici di errori che si ripetono:

- Dimentica di committare dopo file save
- Usa API deprecata invece della nuova
- Non controlla che il test passi prima di marcare task complete
- Cancella file non versionato senza backup
- Dimentica permessi su file creati (chmod)

Soluzione classica: training su examples → ma questo richiede full retraining e perde la specificità del progetto/utente.

Soluzione proposta: **memo system runtime** che vive nella memoria persistente del wrapper, ed è incluso nel context come "lessons learned" attive.

## Schema

Ogni memo ha **due livelli di astrazione**:

### Livello 1 — Lezione generica (astrazione)

```yaml
id: lesson-2026-05-21-001
category: testing
generic_lesson: |
  Prima di marcare un task come complete, eseguire i test rilevanti
  e verificare che passino. Marker IN_PROGRESS → DONE solo dopo
  conferma esecuzione successo.
why: |
  Marcare DONE prima dei test porta a regressioni non rilevate che
  esplodono in step successivi quando il caller assume che il task
  precedente abbia prodotto codice working.
applies_to:
  - any coding step
  - especially: refactoring, new feature, bug fix
how_to_apply: |
  Aggiungi al `<pending_verifications>` del context: "test relevant
  to current step pass = ☐" prima di chiudere lo step.
```

### Livello 2 — Esempi pratici (concretezza)

```yaml
examples:
  - date: 2026-05-21
    task: "Implementa endpoint POST /users"
    what_happened: |
      Agent marcato DONE dopo aver scritto codice endpoint.
      Test pytest non eseguito → in step successivo (GET /users)
      bug latente nel POST causa schema users non popolato per il fetch.
    root_cause: skip test execution
    correction: |
      Aggiunto test_user_create.py al run automatico prima di DONE.
      Tempo perso: 25min debug.

  - date: 2026-05-15
    task: "Add password hashing to user model"
    what_happened: |
      Agent ha modificato il model ma non ha esistito i test esistenti
      che verificavano un hash hardcoded.
    root_cause: skip regression test execution
    correction: |
      Test regression eseguiti, hash hardcoded aggiornato, commit fix.
      Tempo perso: 15min.
```

## Pipeline di vita del memo

```
[Errore avviene]
  ↓
[Agent o wrapper rileva errore (eval, user feedback, contraddizione)]
  ↓
[Agent in modalità "post-mortem" emette]:
   - what_happened (specifico)
   - root_cause (analisi)
   - correction (azione)
   - generic_lesson (se generalizzabile)
  ↓
[Wrapper salva in memory persistente]:
   - se esiste already un memo con stesso `generic_lesson` → appende solo l'esempio
   - se nuovo lesson → crea memo nuovo
  ↓
[Step futuri]:
   - Wrapper include top-K memo rilevanti per task corrente nel `<memory>` del context
   - Agent vede memo all'inizio thinking → applica generic_lesson
   - Se task simile a esempio passato → match esplicito ("vedo questo è simile a esempio 2026-05-21 → applico correction")
```

## Recupero dei memo (semantic search)

Quando wrapper costruisce context per uno step:

1. Embedding dello step description
2. Vector search su tutti i memo
3. Top-K (K=3-5) memo più rilevanti includono nel `<memory>`
4. Priority: ordinati per (recency × frequency × semantic_similarity)

## Decay e maintenance

Per evitare memory bloat:

- Memo con `frequency=0` (mai applicato) per 30+ giorni → archive
- Memo con `frequency≥5` e `success_rate≥0.9` → "validated", boost priority
- Memo conflittuali (due memo dicono cose contrarie) → manual review trigger

## Relazione con altre componenti

- **`<memory>` in [[structured-context-sections]]**: top-K memo entrano qui
- **[[structured-thinking]]**: il thinking referenzia esplicitamente memo applicati ("VEDO lesson-001 si applica, eseguo test")
- **[[post-rl-path-optimization]]**: memo frequenti diventano candidate per template path
- **[[contradiction-detection-layer]]**: contraddizione → trigger post-mortem → genera memo
- **[[pre-flight-safety-checks]]**: memo informano quali check eseguire

## Trade-off

| Pro | Contro |
|---|---|
| Apprendimento continuo senza retraining | Memory grow → token cost |
| Specifico per utente/progetto | Memo sbagliati propagano errori |
| Auditabile (ogni memo ha esempi reali) | Manual review periodica necessaria |
| Migliora con uso | Cold start: niente memo all'inizio |

## Sicurezza

I memo **NON sono untrusted content** (vedi [[untrusted-content-delimiting]]) — sono generati dal sistema. MA: se l'agent ha sbagliato una post-mortem analysis (root cause sbagliato), il memo propaga l'errore. Mitigazione: validation periodica via skill `feature-dev:code-reviewer` o `senior-code-architect`.

## Trigger di generazione memo

Quando produrre un memo (non ogni errore qualifica):

| Trigger | Genera memo? |
|---|---|
| Test failed → fix one-line | No (errore comune, no lezione astratta) |
| Test failed → fix architetturale | Sì (lezione applicabile) |
| Utente corregge agent ("no, non così") | Sì sempre |
| Hard limit violato (vedi [[structured-context-sections]]) | Sì + critical priority |
| Contraddizione detected da [[contradiction-detection-layer]] | Sì |
| Task complete senza problemi | No (no memo positivi qui — quelli sono [[post-rl-path-optimization]]) |

## Open questions

- Memo cross-progetto? (se l'utente lavora su 3 progetti, lessons trasferibili?)
- Privacy: i memo possono contenere code privato, security-sensitive — encryption?
- Memo collisione cross-utente nel platform multi-tenant (futuro)?
- LLM-as-judge per validare memo prima di salvare?
- Re-evaluation: ogni N giorni rileggi memo e chiedi all'agent "ancora valido?"

## Link interni

- [[structured-context-sections]] — sezione `<memory>` ospita memo
- [[structured-thinking]] — il thinking referenzia memo
- [[post-rl-path-optimization]] — memo frequenti → template
- [[contradiction-detection-layer]] — contraddizione trigger memo
- [[pre-flight-safety-checks]] — memo informano check
- [[task-decomposition-adhoc-context]] — memo per step ricorrenti
- [[agent-constitution]] — principio 14 (impara dagli errori) formalizza questo sistema
- [[scientific-method-operating-protocol]] — i giudizi di qualità trajectory (verify-loop) alimentano i memo

## Sources

- Reflexion (Shinn et al. 2023) — agent self-reflection memory
- Voyager (Wang et al. 2023) — skill library con error feedback
- Claude Code "auto memory" pattern (file-based memory in `~/.claude/projects/`)
- User notes 2026-05-21
