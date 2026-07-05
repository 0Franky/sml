---
name: lane-persistence-redesign
description: Design-problem + opzioni per il redesign delle lane di memoria dell'harness, aperto da F23 — le lane contengono SOLO ciò che il modello sceglie di salvare (note/jot), e i modelli capaci NON salvano in modo affidabile la task-history nemmeno col nudge dell'eviction-checkpoint → la memoria estesa dell'harness è inerte per una classe di info importante. Enumera 6 opzioni + reco (hybrid).
type: architecture
tags: [harness, memory, lanes, eviction-checkpoint, context-assembly, design-decision, open]
last_updated: 2026-07-06
---

# Redesign della persistenza delle lane — problema aperto (F23)

## Contesto — come funzionano le lane OGGI

L'harness dà al modello memoria OLTRE la finestra nativa iniettando **lane** nel contesto: `<facts>` (fatti durevoli), `<scratch>` (appunti volatili), `<vars>` (variabili). Meccanica chiave:
- Le lane sono popolate **SOLO** da tool che il **MODELLO** chiama: `note()`→facts, `jot()`→scratch, `set_var()`→vars.
- La finestra nativa tiene gli ultimi **K** turni-utente (`keepTurns`). Quando un turno **evicta** (esce da K) il suo contenuto sparisce dal contesto nativo — **ma** se il modello ne aveva salvato qualcosa via note/jot, quello **persiste** nella lane.
- L'[[../concepts/eviction-checkpoint]] è la rete di sicurezza: quando un turno evicta, **spinge** il modello ("MEMORY EVICTION — salva i fatti durevoli ORA") a salvare prima della perdita.

## Il PROBLEMA (F23, dirimente — [[../harness-experiment-log]])

**Tutto il meccanismo dipende dal fatto che il MODELLO scelga di salvare.** F23 (run pulito, 26b, eviction-checkpoint=inject scattato **5×**):
- **0 note / 0 jot** — il modello, spinto 5 volte, **non ha salvato nulla**.
- Recall = **60% = esattamente la finestra nativa** (i task fuori finestra persi), vs vanilla-storia-piena **100%**.
- **Perché**: il modello non percepisce la **task-history** ("ho implementato la funzione X") come un "fatto durevole" da `note()`. Il nudge dice "salva un nome/decisione/vincolo" → la task-history non matcha quel framing. *(Contrasto F16: il 9B SALVAVA fatti espliciti tipo password/"Lupo" — perché matchano chiaramente "durable fact".)*

**Conseguenza**: la "memoria estesa" dell'harness è **inaffidabile** per una classe di info importante (task-history + tutto ciò che il modello non auto-classifica come fatto-durevole). **A scala** (sessioni lunghe, target 27B) è ESATTAMENTE lì che l'harness dovrebbe aggiungere valore; se il modello non salva, la memoria-lane è inerte → recall collassa alla finestra nativa → nessun vantaggio su vanilla. La causa NON sono le lane (terrebbero ciò che fosse salvato) né la finestra: è la **dipendenza dal salvataggio volontario del modello**.

## Le opzioni (tutte le Reco)

| # | Opzione | Pro | Contro |
|---|---|---|---|
| 1 | **Cattura DETERMINISTICA** — l'harness auto-salva un digest strutturato di ogni turno in uscita in una lane persistente, SENZA `note()` del modello | funziona a prescindere dal modello; immediata; deterministica | *cosa* salvare è euristico (qualità del summary); rischio rumore (over-capture spinge fuori i fatti veri); "l'harness decide per il modello" (granularità); il digest costa token |
| 2 | **Inject-digest PERSISTENTE** — tieni il digest in contesto per più di un request (ora è effimero) | cambio minimo | non scala: gonfia il contesto (vanifica il windowing); rimanda la perdita, non la risolve — **non è un vero fix** |
| 3 | **Rung `require` OOB** — chiamata modello DEDICATA fuori-conversazione che estrae i fatti durevoli dai turni in uscita e li salva | attenzione focalizzata (un prompt dedicato "estrai fatti" può riuscire dove il nudge inline fallisce); non sporca la conversazione | +1 chiamata per eviction (latenza/costo); serve il wiring endpoint (spike pendente); dipende ANCORA da un modello che giudica bene (ma focalizzato → meglio del nudge inline) |
| 4 | **Retrieval / RAG** — indicizza TUTTI i turni + recupera i rilevanti a query-time | nessuna decisione-di-salvataggio lossy (si tiene tutto); il problema "salva ciò che servirà" sparisce (la rilevanza si risolve al recupero) | infra maggiore (embedding + vector store); qualità/latenza del retrieval; architettura diversa (non "lane" ma recupero) |
| 5 | **Training** — internalizza la disciplina di salvataggio ([[../training-taxonomy/class-prospective-memory]]) così il modello SALVA proattivamente e selettivamente | il fix "giusto" a lungo termine (modello capace, non solo scaffoldato); allineato alla filosofia del progetto | serve il training (non immediato); finché non addestrato il modello non salva → serve uno scaffold nel frattempo |
| 6 | **HYBRID (reco)** — cattura deterministica (1) ORA + training prospective-memory (5), con lo **scaffold che RECEDE** | immediato E corretto: l'harness scaffolda ora (memoria affidabile, zero dipendenza dal modello); il training internalizza; metrica = frazione di eviction dove il modello aveva GIÀ salvato → sale col training → si declassa lo scaffold | richiede entrambi i filoni; il tuning dello scaffold |

## Raccomandazione — HYBRID (#6)

**Cattura deterministica ADESSO** (scaffold harness, memoria affidabile subito, nessuna dipendenza dalla cooperazione del modello) **+ training prospective-memory** (il modello impara a salvare da sé) **→ lo scaffold recede** man mano che il training sale. È **esattamente** la filosofia del progetto (CLAUDE.md #11 [[../concepts/training-vs-harness-classification]] + il design dichiarato dell'eviction-checkpoint: *"scaffold che RECEDE"*, L3-anti-pezza): l'harness rende il sistema utile ORA, il training lo rende capace. Doppio scopo (regola #18): il finding-harness (F23) ↔ la classe-training (prospective-memory) già collegati.

**Dettaglio di design della cattura deterministica**: salvare un digest **compatto e strutturato** di ogni turno in uscita in una lane **dedicata** (es. `<recall>` / auto-history) **separata** dai `<facts>` curati dal modello → così è **bounded** (cap + ordinamento recency/importance come le altre lane, [[context-pressure-mechanism]]), **auditabile**, e **non inquina** le note del modello. Attenzione a **non doppio-mostrare** i turni più recenti (già nella finestra nativa): il boundary di eviction lo traccia già.

## Aggiornamento F24 (2026-07-06) — il nudge PIÙ forte peggiora; `<last_tool_calls>` è già metà del fix

**Test dell'hint più forte** (utente msg 1245, [[../harness-experiment-log]] F24): allargare il nudge ("salva i tuoi PROGRESSI") **ottiene** il save (F23: 0 → F24: 7) ma **DERAGLIA l'outcome** — a keep1 recall **0%** (vs vecchio-hint 60%) + 844K token, perché il modello **deflette** la probe ("ho salvato tutto in `session_progress`, pronto per il summary") invece di rispondere: **hijack mezzi-fini**. → **il push-via-hint è un vicolo cieco** (insufficiente in F23, dannoso in F24): rafforza la scelta **cattura DETERMINISTICA (#1/#6)** e declassa nudge/inject (#3-parziale).

**`<last_tool_calls>` ESISTE già** (`src/tool-call-log.mjs` + `context-assembly.ts`, "fix amnesia #1" msg 811-817): ring-buffer delle **ultime 8** tool-call con esito, formato `[+Xs][ok] name(args) → result` — è **già** una cattura deterministica della traccia-azioni. Limiti per la recall long-horizon: **(a)** size 8 + **rolling** → sfuma come la finestra nativa; **(b)** include le **memory-op del modello** (note/jot/set_var) → in F24 i 7 salvataggi avrebbero comunque affollato la lane; **(c)** non è **persistente per-task**. → **La cattura deterministica = promuovere `<last_tool_calls>` da ring-buffer volatile a**: **(1) lane FILTRATA** alle azioni vere (write_file/exec/test), escluse le memory-op; **+ (2) digest PERSISTENTE per-task** (una riga durevole per task completato dalla traccia, che NON scorre). Entrambi deterministici, lato-harness, ancorati agli eventi osservati. È il ponte tra l'idea utente (msg 1253) e F24.

## ⚠️ Le due decisioni che restano a TE

1. **Selettività vs completezza della cattura**: salvare **tutto** l'evicted (completo ma rumoroso/token-pesante) o un **summary selettivo** (compatto ma serve un giudizio di sintesi — un modello cheap/euristica)? È il trade-off principale.
2. **Budget di contesto** della lane auto-history (quanto grande): è un **parametro di prima classe** ([[context-pressure-mechanism]] + [[../feedback_context_window_sizing]]) — troppo piccola = perde comunque; troppo grande = ri-crea la pressione che il windowing risolveva.

## Links
[[../concepts/eviction-checkpoint]] · [[context-pressure-mechanism]] · [[context-assembler]] · [[../training-taxonomy/class-prospective-memory]] · [[../concepts/training-vs-harness-classification]] · [[../harness-experiment-log]] (F23) · [[../feedback_context_window_sizing]]
