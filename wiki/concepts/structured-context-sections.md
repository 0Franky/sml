---
name: structured-context-sections
description: Formato context strutturato con sezioni delimitate da tag (aim, state, queue, assets, hard limits, interconnections).
type: concept
tags: [concept, context-engineering, prompt-design, tagging, state-management]
sources: [user notes 2026-05-21]
last_updated: 2026-05-21
---

# Structured Context — Sezioni e State Tracking

## Idea ground truth (utente, 2026-05-21)

> "Il context deve sempre avere una tabella o elenco (informazioni strutturate) con stato attuale, verifiche richieste per andare oltre, ecc."

> "Quindi capiamo innanzitutto come formalizzare il contesto suddiviso sezioni. Obiettivo: migliorare l'organizzazione mentale del llm e ottimizzare l'operatività."

> "Aim, current state, state queue, assets e risorse che sta staccando e gli hard limits verso di loro (es: per cancellare un file deve fare exploitation, viola hard limit → si ferma e chiede prima di procedere), interconnessioni tra info e risorse."

## Schema proposto

Il contesto a runtime è composto da **sezioni delimitate da tag** (XML-style, allineato con le linee guida Anthropic). Esempio canonico:

```xml
<context>
  <aim>
    <!-- Obiettivo finale del task corrente, immutabile durante la sessione -->
    Implementare endpoint REST per gestione utenti con CRUD.
  </aim>

  <current_state>
    <!-- Stato del lavoro adesso (cosa è fatto, cosa è in corso) -->
    - Step 1: schema DB definito [DONE]
    - Step 2: model SQLAlchemy creato [DONE]
    - Step 3: endpoint POST /users in corso [IN_PROGRESS]
    - Step 4: test pytest [TODO]
  </current_state>

  <state_queue>
    <!-- Coda di step futuri, ordinati -->
    1. Completa Step 3 (POST /users)
    2. Step 5: endpoint GET /users/{id}
    3. Step 6: endpoint PATCH /users/{id}
    4. Step 7: endpoint DELETE /users/{id}
    5. Step 4: pytest suite completa
  </state_queue>

  <assets>
    <!-- Risorse che il modello/wrapper sta toccando, con stato e hard limits -->
    <asset id="users_table" type="db_table" mutability="rw" hard_limit="no_drop">
      Tabella DB `users`. Permessi: SELECT/INSERT/UPDATE.
      HARD LIMIT: DELETE table = exploitation → richiede conferma utente.
    </asset>
    <asset id="user_model.py" type="file" mutability="rw" hard_limit="git_check">
      File modello. HARD LIMIT: se non versionato git → backup prima di overwrite.
    </asset>
    <asset id="alembic_migrations" type="directory" mutability="append-only" hard_limit="no_delete">
      Migrations storiche. HARD LIMIT: mai cancellare migration esistenti.
    </asset>
    <asset id="shell_exec" type="tool" mutability="r-only-prod" hard_limit="dangerous_cmd_list">
      Tool shell. HARD LIMIT: rm -rf, dd, mkfs → conferma esplicita.
    </asset>
  </assets>

  <interconnections>
    <!-- Relazioni tra asset/info: cosa dipende da cosa -->
    - user_model.py → usa users_table (schema deve allinearsi)
    - endpoint POST /users → scrive users_table + chiama email_service
    - alembic_migrations → genera/aggiorna users_table
    - test pytest → usa fixture sqlite (NON users_table prod)
  </interconnections>

  <pending_verifications>
    <!-- Tabella di check necessari per procedere -->
    | Verifica | Status | Action |
    |---|---|---|
    | schema users include `email` unique? | [V] | grep user_model.py:12 |
    | password hashing già implementato? | [?] | da verificare prima POST |
    | endpoint protetto da auth middleware? | [?] | da decidere prima Step 3 |
  </pending_verifications>

  <memory>
    <!-- Memoria persistente cross-session (top-N relevant) -->
    - Convention progetto: tutti gli endpoint REST sono in `app/api/v1/`.
    - Errore passato: dimenticato hashing password → ora obbligatorio prima di INSERT.
  </memory>

  <working_history>
    <!-- Ultimi N turni di dialogo, in formato compresso -->
    T-3: user request "fai endpoint users"
    T-2: assistant proposes schema → user approves
    T-1: assistant generates SQLAlchemy model → user "ok"
    T-0: assistant works on POST /users
  </working_history>

  <external_inputs>
    <!-- Eventuali update esterni iniettati durante il pensiero -->
    <!-- Vedi [[external-update-injection]] -->
  </external_inputs>

  <untrusted_zone>
    <!-- Content da fonti esterne inaffidabili (web, user input non-sanitized) -->
    <!-- Vedi [[untrusted-content-delimiting]] -->
  </untrusted_zone>
</context>
```

## Sezioni obbligatorie (minimum viable context)

Anche per task semplici, il contesto deve sempre avere almeno:

1. **`<aim>`** — obiettivo, immutabile durante sessione
2. **`<current_state>`** — dove siamo
3. **`<state_queue>`** — dove vogliamo arrivare (anche se 1 sola voce)
4. **`<assets>`** — risorse toccate + hard limits
5. **`<pending_verifications>`** — tabella check (anche vuota se non serve niente)

Altre sezioni opzionali per complessità crescente.

## Hard limits — il meccanismo "trigger and ask"

Ogni asset dichiara hard limits machine-readable. Il modello, prima di eseguire un'azione che li violerebbe:

1. **Riconosce la violazione** durante pensiero strutturato
2. **Si ferma** prima del tool call
3. **Chiede all'utente** con specifico format: "Per fare X devo violare hard limit Y su asset Z. Confermi?"
4. Solo dopo conferma esplicita procede

Esempi di hard limits:

| Asset type | Hard limit tipico | Trigger |
|---|---|---|
| file | `git_check` | overwrite di file non-versionato → backup prima |
| directory | `no_delete` | rm -rf su directory non-vuota |
| db table | `no_drop` | DROP TABLE |
| shell | `dangerous_cmd_list` | rm -rf /, dd, mkfs |
| network | `no_external_post` | POST a domini non whitelist |
| secrets | `no_read` | accesso a .env, secrets/ |

## Aggiornamento del context tra step

Quando l'agent completa uno step (vedi [[task-decomposition-adhoc-context]]):

1. Aggiorna `<current_state>` (marca step DONE)
2. Pop step da `<state_queue>` → diventa current
3. Eventuale update di `<assets>` (nuovi asset toccati)
4. Aggiungi memo a `<memory>` se ha imparato qualcosa di rilevante (vedi [[error-memo-system]])

## Interconnessioni: perché esplicite

Senza `<interconnections>` esplicite, il modello deve dedurre relazioni dal codice ogni volta → costo cognitivo + rischio allucinazione. Con il grafo dichiarato:

- Routing decision più rapide ("se modifico users_table, devo anche aggiornare user_model.py")
- Validazione automatica ("Step 5 GET /users/{id} dipende da users_table esistente")
- Audit cross-asset

## Token budget

Sezioni hanno priorità decrescente. Se context supera 80% del max:

1. Trunc `<working_history>` (compaction LLM)
2. Trunc `<memory>` (top-N semantic search)
3. Mai trunc `<aim>`, `<assets>`, `<pending_verifications>`

## Open questions

- Format finale: XML come sopra, oppure JSON, oppure YAML? (XML allineato Anthropic guidance, JSON più strutturato per parsing, YAML più human-readable)
- Compaction strategy: LLM-summarization, hash-and-drop, semantic ranking?
- Sezioni vincolate vs estensibili (chi può aggiungere `<section>` nuove)?
- Tipo asset finiti vs aperti (estendibili da utente)?

## Link interni

- [[structured-thinking]] — il thinking opera dentro questo context
- [[task-decomposition-adhoc-context]] — costruzione context ad-hoc per ogni step
- [[external-update-injection]] — sezione `<external_inputs>` runtime
- [[untrusted-content-delimiting]] — sezione `<untrusted_zone>` mitigation
- [[pre-flight-safety-checks]] — checks all'avvio task popolano `<assets>` con hard limits
- [[contradiction-detection-layer]] — monitora coerenza tra sezioni
- [[wrapper-context-assembly-example]] — esempio concreto di questo context assemblato dinamicamente (lane → `ctx.getContext()` → testo) + history gerarchica blocchi/step
- [[secret-section-exfiltration-defense]] — la sezione `<secrets>` (lista popolata via `add_secret`) e il guardrail anti-exfiltration

## Sources

- Anthropic "Use XML tags" prompt engineering: https://docs.anthropic.com/claude/docs/use-xml-tags
- Claude Code system prompt structure (reverse-engineered)
- Cursor "rules" pattern
- User notes 2026-05-21
