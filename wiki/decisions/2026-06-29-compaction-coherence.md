---
name: 2026-06-29-compaction-coherence
description: Analisi approfondita — la compaction NATIVA di pi è coerente con quello che ci aspettiamo per il nostro harness/SLM? Verdetto = PARZIALMENTE. Sorpresa positiva (il formato summary di pi è quasi identico al nostro modello di stato/handoff) ma 5 incoerenze reali (due memorie scoordinate, summary fatto dal modello attivo=SLM-piccolo, train-serve mismatch, default tarati per modelli grandi, compaction-stato vs compaction-messaggi separate). Proposta: ibrido via hook session_before_compact. Decisione pending utente.
type: decision
status: RISOLTA 2026-06-29 (utente TG msg 424) → vedi 2026-06-29-context-as-first-person-mind (compaction nativa di pi OFF + compaction a matrioska nostra)
tags: [harness, pi, compaction, context, train-serve, summary, kv, dogfood, decision]
sources:
  - harness/node_modules/@earendil-works/pi-coding-agent/dist/core/compaction/compaction.js
  - harness/node_modules/@earendil-works/pi-coding-agent/dist/core/extensions/types.d.ts
  - harness/src/context-assembler.mjs
  - harness/src/vars-queue.mjs
last_updated: 2026-06-29
---

# La compaction di pi è coerente con quello che ci aspettiamo? (analisi)

> Domanda utente (TG 2026-06-29): *"sei sicuro che il compact che fa pi è coerente con quello che ci aspettiamo noi? Analisi approfondita, capisci bene il funzionamento, come attualmente, come dovrebbe essere, resoconto."*
>
> **Verdetto in una riga**: **PARZIALMENTE coerente.** C'è una sorpresa positiva (il *formato* del summary di pi è concettualmente quasi identico al nostro modello di stato/handoff) ma **5 incoerenze reali** che, non gestite, rompono la qualità (SLM piccolo) e il train-serve match. Sono tutte risolvibili via hook — pi espone i punti di estensione giusti.
>
> **→ RISOLTA 2026-06-29** (utente TG msg 424, [[2026-06-29-context-as-first-person-mind]]): si **spegne la compaction nativa di pi** e si sostituisce con la **compaction a matrioska** nostra (nested-vision) + workspace auto-curato → le incoerenze #1-#5 si chiudono per costruzione.

## 1. Come funziona DAVVERO la compaction di pi `[EXTRACTED da compaction.js]`

- **Trigger**: `shouldCompact = contextTokens > contextWindow − reserveTokens`. Default: `reserveTokens=16384`, `keepRecentTokens=20000`, `enabled=true`. → compatta quando il contesto arriva a ~16K dal fondo del window.
- **Cut point** (`findCutPoint`): cammina all'indietro dai messaggi più nuovi accumulando token finché ≥ `keepRecentTokens` (20K); taglia su un confine **user/assistant** (mai su un `toolResult` — deve seguire la sua tool-call). Tiene **verbatim** i ~20K token recenti, **riassume** tutto il più vecchio. Gestisce anche lo **split-turn** (se il taglio cade a metà turno, riassume a parte il prefisso del turno).
- **Summary** (`generateSummary`): è una chiamata **LLM** con il **modello ATTIVO** della sessione, e un **prompt FISSO strutturato**. Il template di pi:
  ```
  ## Goal
  ## Constraints & Preferences
  ## Progress  (### Done / ### In Progress / ### Blocked)
  ## Key Decisions
  ## Next Steps
  ## Critical Context
  ```
  + "Preserve exact file paths, function names, and error messages" + lista file-ops (`readFiles`/`modifiedFiles`) appesa in coda.
- **Iterativo**: se esiste un summary precedente, usa un prompt di UPDATE che PRESERVA il vecchio e fonde il nuovo (sposta item da In-Progress→Done, aggiorna Next-Steps).
- **Dove finisce**: il summary diventa un messaggio `compactionSummary` **nello stream dei messaggi** (= lato PI), i recenti restano verbatim. Il nostro `<context>` (stato) **non è toccato** (è nel system prompt, ricostruito dal `vars.db`).

## 2. La sorpresa POSITIVA — il formato di pi è quasi il NOSTRO `[INFERRED]`

Il template di summary di pi mappa quasi 1:1 sul nostro modello di stato/handoff:

| Sezione summary di pi | Nostra lane / stato (`vars-queue`) |
|---|---|
| `## Goal` | `current_aim` (CURR) |
| `## Constraints & Preferences` | `rules` |
| `## Progress` (Done/InProgress/Blocked) | `task_list` (status dei task) |
| `## Key Decisions` | decisioni (`record_decision`) / `vars` con `decision_ref` |
| `## Next Steps` | handoff "prossimo passo" |
| `## Critical Context` | `vars` / fatti critici |
| file-ops (`readFiles`/`modifiedFiles`) | — (non abbiamo una lane file → gap minore) |

→ **Non stiamo combattendo una filosofia diversa.** pi ha già "internalizzato" l'idea di checkpoint strutturato. Questo abbassa molto il costo di renderli coerenti.

## 3. Le INCOERENZE reali (perché NON è pienamente coerente) `[INFERRED]`

1. **Due memorie parallele e SCOORDINATE → rischio duplicazione/contraddizione.** pi costruisce Goal/Progress/Decisions/NextSteps **dal testo della conversazione**; noi costruiamo current_aim/task_list/decisions/vars **dalle tool-call esplicite**. Sono due rappresentazioni della stessa cosa, mantenute in modo indipendente: possono **divergere** (il modello aggiorna un task in prosa ma non col nostro tool, o viceversa). Dopo la compaction il modello vede **entrambe** (il nostro `<context>` + il `compactionSummary` di pi) → ridondante nel migliore dei casi, contraddittorio nel peggiore.
2. **Il summary lo fa il MODELLO ATTIVO = il nostro SLM piccolo.** `generateSummary(messages, model, …)` usa il modello della sessione. Un 4B che auto-riassume 20K+ token è un'operazione **debole e lossy**: la qualità della compaction crolla **proprio** quando usiamo il modello piccolo. (I modelli grandi riassumono bene; i piccoli no.)
3. **Train-serve mismatch.** Dopo la compaction il modello vede un messaggio `compactionSummary` (markdown nel message-stream) **che NON è il nostro formato `<context>`**. Se l'SLM è addestrato sul nostro `<context>` strutturato e a runtime riceve in più il blob-summary di pi, vede un formato **non visto in training** → deriva. Va deciso: includere il summary-di-pi nella training-distribution, o **sostituirlo** col nostro.
4. **Default tarati per modelli GRANDI.** `reserve=16K`, `keepRecent=20K` presumono un window ampio. Per Qwen3-4B (window effettivo più piccolo) vanno **calibrati**, anche perché il nostro `<context>` (stato) è re-iniettato PIENO ad ogni richiesta e **conta** nel window pur non essendo compattato da pi → man mano che lo stato cresce, "mangia" il window e innesca più compaction dei messaggi.
5. **Le due compaction non si parlano.** La nostra compaction-di-stato (windowing delle lane: cap 12/20 + `gcVars`/`gcChangeLog`) e la compaction-di-messaggi di pi sono **meccanismi separati e scoordinati**. Nessuno dei due sa dell'altro.

> Cosa può **perdere** la compaction di pi: tutto ciò che vive SOLO nei messaggi e non è stato promosso a stato durevole. pi prova a tenerlo nel `## Key Decisions`/`## Critical Context`, ma è il **modello piccolo** a deciderlo → affidabilità bassa. La nostra filosofia (promuovi-a-stato-durevole-PRIMA-della-perdita) è la difesa giusta.

## 4. Come DOVREBBE essere (proposta) `[INFERRED]`

pi espone esattamente le leve giuste (verificato in `types.d.ts`): hook **`session_before_compact`** (`SessionBeforeCompactEvent` con `preparation`; `SessionBeforeCompactResult` può ritornare un **`compaction?: CompactionResult`** custom → **sostituisce** il summary di default), hook `session_compact` (after), `actions.compact()` (trigger). Quindi:

- **A) Flush handoff PRIMA della compaction** (economico, fai-subito): su `session_before_compact`, garantire che current_aim + task aperti + decisioni-chiave + vars critiche siano nel `vars.db` (la nostra memoria durevole) → nulla di critico dipende dalla qualità del summary. Alimenta anche la lane [[../architecture/harness-request-flow|`<resuming_from>`]].
- **B) Focalizzare il summary di pi con `customInstructions`** per **non duplicare** ciò che è già stato: *"Lo stato strutturato traccia già goal/task/decisioni/vars; riassumi SOLO il contesto conversazionale, i thread di ragionamento e i finding NON ancora registrati come stato."* → riduce l'incoerenza #1.
- **C) (più forte, train-serve) Sostituire il summary con uno NOSTRO**: ritornare un `CompactionResult` costruito **deterministicamente dal `vars-queue`** (zero chiamata LLM per la parte di stato → niente degrado da modello-piccolo, formato = il nostro), con al più una mini-pass LLM solo per il residuo conversazionale. Dà **train-serve match** e qualità indipendente dalla taglia del modello.
- **D) Calibrare** `reserveTokens`/`keepRecentTokens` sul window reale dell'SLM (via config pi `settings.jsonl`), tenendo conto che il nostro `<context>` occupa parte del budget.
- **E) Coordinare le due memorie**: regola "single source" — ciò che conta diventa **stato** (tool nostri); il summary di pi è solo il residuo conversazionale.

## 5. Raccomandazione

**Ibrido, in due tempi:**
- **Subito (economico, dogfood-validato, indipendente dalla decisione Opzione-B)**: A + B + D — flush handoff su `session_before_compact`, `customInstructions` anti-duplicazione, calibrazione settings. Risolve le incoerenze #1 (parziale), #4, #5 e blinda la perdita-dati.
- **Con la decisione "chi possiede la conversazione" ([[../architecture/harness-request-flow]] §decisione)**: se si va verso **Opzione B**, fare anche **C** (custom `CompactionResult` deterministico) → chiude #2 e #3 (train-serve match). Se si resta su pi-native (A), accettare il summary di pi e **includerlo nella training-distribution** (mitiga #3 dal lato dati).

## 6. Gate / cosa serve dall'utente

- Conferma direzione: **C ora** (compaction nostra, train-serve match — implica Opzione B) **oppure** A+B+D ora e C dopo?
- Valore reale del window dell'SLM (per calibrare reserve/keepRecent).

## Collegamenti
- [[../architecture/harness-request-flow]] — il flusso richiesta-per-richiesta + la decisione "chi possiede la conversazione".
- [[../concepts/cross-session-state-sharing]] — la memoria durevole che sopravvive alla compaction.
- [[2026-06-29-headroom-evaluation]] — train-serve-match + context-compression.
- [[../concepts/wrapper-context-assembly-example]] — design delle lane (incl. la lane conversazione non implementata).
- `wiki/todo.md` §NEXT BUILD — item-0/0b (resume + request_compaction + handoff-flush).
