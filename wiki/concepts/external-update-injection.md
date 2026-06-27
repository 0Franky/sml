---
name: external-update-injection
description: Iniezione di update esterni durante il pensiero del modello, delimitati da tag in tempo reale.
type: concept
tags: [concept, real-time, streaming, context-update, attention]
sources: [user notes 2026-05-21]
last_updated: 2026-05-21
---

# External Update Injection

> ⚠️ **Correzione di fattibilità `[VERIFICATO 2026-06-27 contro l'API di pi]`**: il modello *pause/resume mid-stream* (pausare la generazione dopo una `</section>`, iniettare token, riprendere) **NON è disponibile** su pi (né hook "confine di sezione", né pausa/ripresa della generazione). L'unità di controllo è il **TURNO** + i delta di streaming. → questa feature **degrada** a *interrupt + steer al prossimo confine di turno*: si usa `turn_end`/`message_end` (post-turn) o **steering** (`session.steer()` / `streamingBehavior:"steer"`) per influenzare il **turno successivo**, NON il pensiero corrente a metà. Cambia la semantica (latency + caso d'uso "interrompo mentre pensa" → "steero il prossimo turno") e conferma il collocamento **post-MVP / Fase 3**. Le primitive "pausare/riprendere" sotto (riga ~114) vanno lette come *non-implementabili così*; vedi [[../architecture/wrapper-implementation-plan]] §Step-0.0 divergenza-1 e [[../architecture/harness-feature-catalog]] §Classe-B.

## Idea ground truth (utente, 2026-05-21)

> "Se arriva una nuova info mentre pensa, valutare se iniettare l'aggiornamento nel pensiero. Mentre lm scrive il pensiero delimitato da `<sections>` dopo una section iniettare una cosa del tipo `<update from external>content</...>`"

## Cosa risolve

Negli agenti autonomi con loop think→tool→observe→think, il modello produce thinking strutturato (vedi [[structured-thinking]]) potenzialmente lungo. Durante questo thinking, può succedere:

- Un tool che è ancora in esecuzione restituisce output (es. test suite finisce)
- Un altro agente del wrapper produce un risultato
- L'utente manda un messaggio interrupt ("aspetta, prima fai X")
- Il filesystem cambia (file salvato esterno)

**Senza injection**: il modello completa il thinking obsoleto, poi processa la nuova info al turno successivo → spreca token, può prendere decisioni sbagliate basate su dati vecchi.

**Con injection**: il wrapper interrompe il thinking dopo una sezione completa, inietta `<update from external>...</update>`, il modello incorpora l'info al volo.

## Schema

```xml
<thinking>
  <section name="check_data">
    OBIETTIVO: modifica file X
    INPUT NOTI: X path, dipendenza Y [?]
    ...
  </section>

  <!-- ⬇ wrapper inietta qui in real-time ⬇ -->
  <update from="external" source="tool:pytest" timestamp="2026-05-21T13:45:12Z" priority="high">
    Test suite fallita: test_user_create.py:45 AssertionError
    user.email == "test@example.com", got None
  </update>
  <!-- ⬆ thinking riprende ⬆ -->

  <section name="adjust_plan">
    RECONOSCO: test failed → root cause email non popolata
    REVISIONE PLAN: prima di POST /users, fix model che imposta email
    NEW STEP_QUEUE: [fix_model_email, retry_test, ...]
  </section>
</thinking>
```

## Regole di injection

### Quando iniettare

Solo **tra sezioni completate**, mai a metà di una sezione. Garanzia: thinking non corrotto mid-statement.

### Cosa qualifica come "external"

- Tool results che arrivano async
- User messages di tipo interrupt/priority
- Hook events del wrapper
- Notifiche da altri agent/processi
- Filesystem watch events
- Webhook esterni

### Priority levels

- `critical` — interrupt forzato dopo sezione corrente, deve essere valutato prima di continuare
- `high` — valutare se cambia il plan corrente
- `normal` — può essere processato a fine thinking
- `low` — solo informativo, dopo risposta finale

### Cosa NON iniettare

- Output di tool già in stream nel thinking (sarebbe duplicato)
- Update non-pertinenti al task corrente (filtro: deve toccare un `<asset>` o sub-task)
- Update da `<untrusted_zone>` (vedi [[untrusted-content-delimiting]]) — questi non sono iniezione di knowledge, sono dati da elaborare

### Risposta del modello all'update

Subito dopo l'`<update>`, il modello deve emettere una sezione `<update_handling>`:

```xml
<update_handling source="tool:pytest" priority="high">
  IMPATTO: invalida assumption email auto-popolata
  ACTION: aggiungi sub-step fix_model_email prima di retry
  CONTINUARE THINKING: sì, da sezione adjust_plan
</update_handling>
```

Se `IMPATTO=invalida thinking precedente`, allora **abortire thinking corrente** e ricominciare dal nuovo state.

## Training

Per insegnare al modello questo pattern, dataset di training deve includere:

1. Esempi di thinking strutturato senza injection (baseline)
2. Esempi con injection critical → restart thinking
3. Esempi con injection high → adjustment in-place
4. Esempi con injection normal → defer a fine thinking
5. Esempi di injection inappropriata → modello la rifiuta esplicitamente

Skill `aris-experiment-plan` può aiutare a strutturare ablation.

## Architettura wrapper

Il wrapper (vedi [[../architecture/wrapper]]) deve avere:

- **Event queue** per messaggi esterni con priority
- **Hook system** per detectare quando il modello emette `</section>` (fine sezione) → momento di injection
- **Streaming inference adapter**: PEFT/vLLM streaming permette di pausare la generazione, iniettare token, riprendere
- **Audit log**: ogni injection registrata con timestamp + source + decision del modello

## Trade-off

| Pro | Contro |
|---|---|
| Risposta in real-time a eventi async | Complessità wrapper alta |
| Meno token sprecati su thinking obsoleto | Streaming inference non sempre supportato (dipende da serving stack) |
| Agent più "vivo" / responsive | Difficile da debuggare / replay |
| Possibilità di interrupt esplicito utente | Race conditions possibili |

## Open questions

- Quale frequency di injection è ottimale? (troppo frequente = ping-pong attention)
- Come trainare il modello a **valutare correttamente** l'impatto degli update?
- vLLM `--enable-streaming` + injection mid-stream: supportato 2026?
- Modello deve "preservare context" precedente o resettare?

## Link interni

- [[structured-thinking]] — il thinking strutturato che riceve injection
- [[structured-context-sections]] — sezione `<external_inputs>` raccoglie injection storiche
- [[contradiction-detection-layer]] — può triggerare injection di tipo `correction`
- [[../architecture/wrapper]] — implementazione

## Sources

- User notes 2026-05-21
- Ispirazione: AutoGen async pattern, ROS2 callback queue
