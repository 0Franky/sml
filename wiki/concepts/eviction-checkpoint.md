---
name: eviction-checkpoint
description: Meccanismo che, quando l'eviction dalla finestra nativa è imminente, inietta una direttiva (come messaggio USER) che spinge il modello a SALVARE i fatti durevoli e consolidare lo scratch PRIMA che i turni escano dalla finestra. Rung off/nudge/inject/require. Validato sul 9B (SAVE funziona, RECALL è il prossimo collo di bottiglia).
type: concept
tags: [harness, context, memory, eviction, keepTurns, scaffolding, training-vs-harness]
sources:
  - src/eviction-checkpoint.mjs (logica pura) + .pi/extensions/eviction-checkpoint.ts (wiring)
  - harness-experiment-log.md F16 (validazione 9B) + regola CLAUDE.md #14/#15 (bug 019f2ab9)
last_updated: 2026-07-05
---

# Eviction checkpoint

## Problema [EXTRACTED]

Nella filosofia "il context È la mente in prima persona del modello" ([[decisions/2026-06-29-context-as-first-person-mind]]) la finestra nativa è **piccola di proposito** (`keepTurns`, [[architecture/context-pressure-mechanism]]): i turni vecchi **escono** (eviction) e restano solo nelle nostre lane (`<facts>`, `<scratch>`, `<recent_changes>`). Ma se il modello NON ha promosso un'informazione durevole in una lane **prima** che il suo turno esca, quell'informazione **si perde**: la lane non la contiene e il turno nativo è sparito. Serve un **checkpoint** che avvisi il modello "stai per perdere gli ultimi turni non salvati — consolida ORA".

## Meccanismo [EXTRACTED]

Quando l'eviction di un turno-utente è imminente, l'harness **inietta una direttiva** `<eviction_checkpoint>` come **messaggio USER** (non system: dev'essere un evento a cui il modello risponde nel turno). La direttiva è composta da:

- **SAVE_HINT** — promuovi in `note()` i fatti che devono sopravvivere oltre i prossimi turni;
- **SCRATCH_HINT** — *consolidation point*: scansiona le working-notes in `<scratch>` e promuovi in `note()` quelle che devono OLTREPASSARE i prossimi turni (i fatti persistono; `<scratch>` è una finestra rolling, il resto è destinato a sfumare);
- **SAVE_CLOSER** — chiusura che rinforza l'azione.

`buildEvictionDirective` (in `src/eviction-checkpoint.mjs`, puro/testabile) assembla SAVE_HINT + SCRATCH_HINT + SAVE_CLOSER per i rung `nudge`/`inject`.

### Rung (severità crescente) [EXTRACTED]

| rung | comportamento |
|---|---|
| `off` | **default** — nessuna iniezione |
| `nudge` | inietta la direttiva come suggerimento leggero |
| `inject` | inietta la direttiva piena (SAVE+SCRATCH+CLOSER) |
| `require` | come inject, con enforcement più forte |

Default **`off`**: lo scaffolding è opt-in (coerente con [[decisions/2026-07-05-slm-scaffolding-extension]] — le pezze-per-il-modello sono separate dal core e recedono man mano che il modello impara).

### Quando scatta [EXTRACTED]

Firing condition: `userTurnCount − keepTurns > lastEvictedOrdinal`.

- `userTurnCount` viene contato da **`store.countUserTurns`** (la sorgente autoritativa), **NON** da `event.messages` (che è l'array GIÀ finestrato → conterebbe sempre ~keepTurns e non farebbe mai scattare il checkpoint). Vedi il bug sotto.
- `keepTurns` = SSOT da `HARNESS_NATIVE_KEEP_TURNS` (default **6**), garantito/clampato da `loadHarnessConfig` ([[feedback_ssot_dry]] / CLAUDE.md #16).
- `lastEvictedOrdinal` è persistito per-sessione (chiave `_eviction_ordinal:<sessId>` nel vars-store) → il checkpoint scatta una volta per turno-che-esce, non a ripetizione.

### Configurazione [EXTRACTED]

- Env: `HARNESS_EVICTION_CHECKPOINT=<off|nudge|inject|require>`.
- Persistente: `.pi/harness.config.json` (attivazione che sopravvive ai riavvii; l'env override vince).

## Il bug 019f2ab9 — perché è nata la regola #14/#15 [EXTRACTED]

Prima versione: il conteggio dei turni veniva preso da `event.messages` (l'array **finestrato** consegnato all'hook) → il valore era sempre ~`keepTurns`, quindi `userTurnCount − keepTurns` non superava mai `lastEvictedOrdinal` → **il checkpoint non scattava MAI**. Gli **unit su funzioni pure erano tutti verdi** (la logica di `buildEvictionDirective` era corretta): il bug viveva nel **WIRING** (la fonte-dato del conteggio). Solo un **integration/wiring test deterministico** ("N turni nello store + array finestrato a K → deve comunque scattare") + il **driver headless** l'hanno svelato.

→ Ha prodotto **CLAUDE.md #14** (validare il WIRING prima del test-live: unit su funzioni pure = falsa sicurezza se il bug è nel wiring) e **#15** (gate di validazione pre-handoff end-to-end). Fix: contare da `store.countUserTurns`. Vedi [[feedback_validate_wiring_before_handoff]] + [[feedback_handoff_validation_gate]].

## Validazione sul 9B — F16 [EXTRACTED]

Driver headless `drive-scratchval-1` (qwen3.5:9b, quota-free, keepTurns=2, rung=inject), scenario 5 turni con fatti durevoli (DB-password "ogni lunedì 3am"; on-call "Wolf"):

- ✅ **SAVE funziona**: a ogni eviction il 9B `note()`a i fatti durevoli; a T4 verbalizza *"I'll save these two important facts before they leave the working window"*. Lo scratch-hint **non è inerte** — spinge davvero il modello a consolidare. Usa `jot` per il volatile + `note` per il durevole, spontaneamente.
- ❌ **RECALL rotto + confabulazione (nuovo collo di bottiglia)**: alla probe finale il modello recupera con `get_var` su id **inventati** (aveva salvato con `note()` → namespace `fact`/slug diverso ⇒ miss by-design), **ignora la `<facts>` lane surfaced** (cap `DEFAULT_MAX_FACTS=12` non raggiunto → i fatti C'ERANO nel context) e **confabula** risposte false ("90 giorni / Sarah Chen"), ri-salvandole.

**Conclusione [INFERRED]:** il SAVE (obiettivo del checkpoint) è risolto; il gap si è spostato sul **RETRIEVAL** — save↔retrieve disallineati (`note`↔`get_var`) + confabulazione-invece-di-ammettere-il-miss. Doppio scopo: *(harness)* allineare save/retrieve + rendere prominente la facts-lane; *(training)* **classe anti-confabulazione** sotto [[training-taxonomy/class-metacognitive-self-audit]]. Dettaglio: [[harness-experiment-log]] F16.

## Relazioni

- Complementare a [[concepts/stuck-state-focus-protocol]] (focus COMPRIME sotto stagnazione; il checkpoint SALVA prima dell'eviction) e allo split `note`/`jot` a 2 layer (durevole vs scratchpad volatile).
- Vive dentro [[architecture/context-pressure-mechanism]] (la meccanica `keepTurns` + finestratura nativa).
- Candidato a migrare nell'estensione dedicata [[decisions/2026-07-05-slm-scaffolding-extension]] (scaffold che recede).
