---
name: focus-task-prioritization
description: "Gathering di priorità+dipendenze PRIMA dell'enter_focus — il modello stabilisce quali task mettere a fuoco e in che ordine, non 'i primi N'. Design DA VALIDARE (review-loop + simulazioni realistiche)."
type: concept
status: design-draft
tags: [matrioska, focus, task-graph, prioritization, dependencies, training-vs-harness]
sources:
  - TG utente 2026-06-29 msg 506 (gathering priorità+ordine prima del focus)
  - TG utente 2026-06-29 msg 509 (gathering-in-focus-mode)
  - TG utente 2026-06-29 msg 510/511 (validare con review-loop + simulazioni realistiche ad alto contesto)
last_updated: 2026-06-29
---

# Focus task-prioritization — gathering prima dell'enter_focus

> **STATUS: VALIDATO via review-loop (25 agenti, 19/22 confermati) + simulazione realistica.** Design v1 implementabile sotto. (Anti-cecità/context-budget: 2ª review in corso.) NON ancora implementato.

## ✅ SINTESI REVIEW-LOOP → DESIGN v1 IMPLEMENTABILE (decisioni validate)

La review (agentic-systems + ml-training/reward + agnostico, verify per-finding) ha confermato il valore MA imposto correzioni importanti. **Design v1 risultante**:

1. **SSOT-first (P1 #14)**: definire lo schema `deps`/`priority` **una volta** (ADR) — è condiviso da 3 concept (questo + [[dependency-aware-error-recovery]] + reorder). `priority INTEGER DEFAULT 0` + `deps TEXT JSON DEFAULT '[]'`; **deps = HARD** (bloccanti); validazione no-self-dep + **no-ciclo (DFS che ritorna il path del ciclo all'inserimento)**.
2. **🔒 v1: priority/deps sono HARNESS/USER-set, il modello LI LEGGE ma NON LI SCRIVE (P0 #8/#13/#16)**. Chiude il **reward-hacking loop** (il modello non può autorare il grafo E essere premiato per rispettarlo): lo scorer-dell'ordine ≠ chi-dichiara (CLAUDE.md #10). priority/deps = **metadati di routing, MAI termini di reward**; il reward viene SOLO dall'esecuzione reale su grafo-oracolo. (Fase-2: se il modello propone priority/deps, stesso schema anti-hacking + `deps_source`.)
3. **Campo derivato = `ready` (NON `blocked`) (P0 #1)**: `blocked` è già uno **status manuale** in tabella → collisione. `ready = status∈{pending,in_progress} AND tutte le deps done`; `status=blocked` manuale ha **precedenza** → non-ready. Riconciliare collectMetrics/realignParent (un dep-non-ready NON deve finire CURR-fallback).
4. **`list_tasks` arricchito**: `priority` + `deps` + `ready` + `unblocks` (descendants count) + `order` (ready-first → `unblocks` desc → priority desc → created asc). I `done` escono.
5. **GATE proporzionalità DETERMINISTICO (P1 #5/#15)**: se **nessun** task ha deps non-vuote **E** nessuno ha priority≠0 → `list_tasks` emette la **vista odierna semplice** (niente colonne ready/order/unblocks, niente hint di gathering). La struttura appare **SOLO quando esiste**. (No over-engineering su grafi piatti — regola #8.)
6. **enter_focus HARD-GATE (P0 #2)**: se il subset non ha **alcun task ready** → **rifiuto** `{reason:"no-ready-task", missing_deps:[...]}` (gemello del rifiuto subset-vuoto). `lead = primo ready in order`; **mai lead su non-ready**. Marker `[blocca Tx]` nel backlog del frame. (Opz. preferito: auto-expand della chiusura-deps.)
7. **Gathering = PROIEZIONE read-only, NON un focus annidato (P1 #4 / P2 #17)**: il "gathering-in-focus" (msg 509) come vero `enter_focus` è **cerimonia** (brucia 1 depth + pop-report degenere = participation-surface). → **TAGLIATO dal design implementabile**; il gathering è una **vista read-only** `get_execution_order`/`list_tasks` planning (`{id,title,status,ready,order,unblocks,deps}` senza payload), zero stack/pop. (msg 509 resta open-question DEFERRED.)
8. **S ri-classificata (P0 #9)**: "scegliere ready-in-dep-order quando il grafo è esplicito" = **COPERTO dal sort deterministico → stato PIENA**, non DEGRADATA generica. La S vera (training) = (a) **quando** gatherare (proporzionalità), (b) raggruppare per coerenza oltre l'ordine, (c) gestire grafi impliciti. Confine F/S dichiarato esplicito.
9. **Label/anti-over-gather (P1 #10/#11)**: oracolo **by-construction** sul task-graph (grafo noto → ordine giusto verificabile) + **twin-pair** (Twin-A grafo strutturato→gathering paga / Twin-B piatto→gathering=spreco) riusando il pattern di [[low-confidence-gather-and-reorg]].
10. **Ordering — critical-path = refinement aperto (P1 #3)**: `unblocks` (descendants) adottato e validato dalla simulazione; ma `unblocks` ≠ critical-path (un task su catena lunga ha CP alto, count basso) → su grafi a catene lunghe valutare **critical-path-length** come tie-break primario (validare con grafo NON-degenere; quello simulato aveva cp=1 ovunque). Open-question, non v1-blocker.
11. **Doc reorder/focusK (P2 #19)**: oggi promette un priority-sort su un campo inesistente → `priority` è il **prerequisito condiviso**, implementarlo per primo + allineare la doc.
12. **Casi alto-contesto da testare (P2 #18)**: deps cross-subset, blocked-DURANTE-il-focus (ri-derivare `ready` ad ogni `buildFrame`, non fidarsi di un flag salvato), deadlock, raccordo re-align.

> **Refutati (3, fumo)**: order/blocked-stantii-a-runtime (il re-derive ad ogni buildFrame lo risolve); F/S-divergono-su-critical-path; "taglia l'80%/over-engineering" (il gate di proporzionalità #5/#15 già lo indirizza senza tagliare il valore).

## Problema (osservato nel dogfood live 2026-06-29)

Con `pressure="matrioska"` (27 task aperti), Sonnet ha proposto `enter_focus(T-1..T-5)` = **i primi 5 task in ordine di creazione**, alla cieca. Non c'è modo di sapere QUALI task sono prioritari o bloccati: il modello-task è `tasks(id,title,status,payload,created,updated,updated_by)` — **niente `priority`, niente dipendenze**. Quindi la scelta del subset di focus è arbitraria → si rischia di mettere a fuoco task bloccati (deps non soddisfatte) o a bassa priorità, sprecando lo zoom-in.

**Richiesta utente (msg 506)**: la procedura di focus deve **prima fare gathering** (priorità + dipendenze) per stabilire **quali** task mettere a fuoco e in **che ordine** eseguirli.

## Catena (why → problema → soluzione)

- **why**: il valore del focus matrioska è isolare un sotto-lavoro *coerente e sbloccato*; se il subset è scelto a caso, il focus non riduce il lavoro reale (puoi finire a fissare task che non puoi ancora fare).
- **problema**: il task-graph non esiste — non ci sono né priorità né dipendenze, quindi non c'è un ordine d'esecuzione derivabile; `enter_focus` usa `lead = aimTask ?? subset[0] ?? curr` (puro ordine d'inserimento).
- **soluzione**: (F) materializzare il **task-graph** (priorità + deps) e derivare deterministicamente **ordine d'esecuzione + stato blocked**; (S) addestrare il modello a **gatherare prima** (leggere il graph) e scegliere un subset *sbloccato, ad alta priorità, in dep-order*.

## Classificazione training-vs-harness (CLAUDE.md #11)

| Metà | Classe | Stato-senza-training |
|---|---|---|
| **Task-graph + ordine deterministico** (priority/deps → topological+priority sort, blocked-flag) | **F-harness** | PIENA (l'ordine c'è e si vede in `list_tasks` a prescindere dal modello) |
| **Gathering-prima + scelta del subset giusto** (leggere il graph, scegliere sbloccato/prioritario, in dep-order) | **S** (skill) | DEGRADATA-MA-UTILE (l'ordine deterministico è un default sensato; il giudizio del modello rifinisce — es. raggruppare per coerenza, non solo priorità) |

**Reward (outcome-anchored, non cerimonia)**: il focus ha messo a fuoco task **eseguibili nell'ordine giusto** (sbloccati, dipendenze rispettate) → progresso reale; NON "ha chiamato list_tasks prima". Held-out negativo: pochi task indipendenti → NON serve il gathering pesante (proporzionalità).

## Design proposto (F-harness)

1. **Modello task esteso** (via `_ensureColumn` data-driven già esistente in vars-queue): `priority INTEGER DEFAULT 0` (più alto = più urgente) + `deps TEXT` (JSON array di task-id che DEVONO essere `done` prima). Migrazione idempotente, retro-compatibile (default priority=0, deps=[]).
2. **API**: `add_task`/`set_task_meta(id, {priority, deps})` accettano i nuovi campi. Validazione: deps = id esistenti, no self-dep, **no ciclo** (rifiuta con errore se introduce un ciclo nel dep-graph).
3. **`list_tasks` arricchito**: ritorna per ogni task `priority` + `deps` + **`blocked`** (true se ∃ dep non-`done`) + **`unblocks`** (downstream-impact: # task open che dipendono transitivamente da questo) + **`order`**. **ORDINE (rivisto dopo la simulazione, vedi sotto)**: ready-first → **`unblocks` desc** → `priority` desc → `created` asc. (Il topological+priority PURO era insufficiente: lasciava entrare foglie a basso valore — vedi §Simulazione.) I task `done` escono dall'ordine.
4. **`enter_focus` informato**: `lead` = primo task **sbloccato in dep-order** del subset (non `subset[0]`); opzionale: **warning** se il subset contiene task bloccati (deps fuori dal subset non ancora done) → suggerisce di includere le deps o sceglierne altri.
5. **`get_execution_order` (tool opz.)**: ritorna l'ordine consigliato + i ready (sbloccati) in cima → è il "gathering" materializzato che il modello legge prima di decidere.

## Ipotesi da validare: gathering-in-focus-mode (msg 509)

> Il momento di gathering può girare ESSO STESSO in focus-mode: non serve il contesto enorme, basta un **set ristretto** (il task-graph). → un `enter_focus` "meta/leggero" sul solo task-set per decidere l'ordine, poi il focus operativo sui task scelti.

- **Pro**: contesto minimo per la decisione di prioritizzazione (solo id+priority+deps+status, non il contenuto/payload dei task) → meno rumore, decisione più lucida.
- **Contro**: overhead di un focus in più (enter+pop) per una decisione che potrebbe essere inline (un solo `list_tasks` + ragionamento); rischio di cerimonia.
- **Da pesare**: forse il gathering NON richiede un vero `enter_focus` (con scope/report) ma solo una **vista ristretta** (`list_tasks` ordinato, senza payload) — cioè una *proiezione* del workspace, non uno scope nidificato. Oppure: gathering-in-focus conviene solo quando i task hanno payload grandi (allora isolare le sole-meta aiuta). **Domanda per il review-loop.**

## Il gathering è ESPLICITO e DELEGATO al modello, NON un passo forzato (msg 516)

La fase di focus **non deve chiamare automaticamente il gathering**: l'harness ESPONE il task-graph (priority/deps/`unblocks`/order via `list_tasks`/`get_execution_order`), ma la **decisione** di gatherare/riorganizzare prima di `enter_focus` è del **modello**, presa in modo **esplicito** (ci ragiona su). → coerente con l'F/S split (F=meccanismo, S=quando-gatherare) e con la **proporzionalità** (task semplici → niente gathering pesante). Il reward è sull'OUTCOME (subset eseguibile), non su "ha chiamato il gathering". Niente auto-gather silenzioso forzato; niente skip-by-default: il modello **valuta** e agisce deliberatamente. (Si lega a [[concepts/low-confidence-gather-and-reorg]]: il REORG è euristica opzionale falsificabile, non passo magico.)

## Anti-cecità su grandi contesti (msg 515) — il windowing/focus non deve far perdere l'obiettivo

**Concerno utente (corretto)**: riducendo i task visibili (cap del `task_list`, focus su un subset), il modello può diventare **cieco** sul quadro completo e perdere obiettivo/concentrazione. Due difese:

1. **SEGNALA SEMPRE cosa è nascosto, con breakdown per PRIORITÀ** (req-1). VERIFICATO stato attuale: `context-assembler.mjs:158` già emette `(+N task aperti non mostrati — usa list_tasks)`; vars/recent_changes idem. **GAP**: non è per priorità. → con il campo `priority`, il marker diventa **`(+N non mostrati: H=x · M=y · L=z — usa list_tasks)`** sia nel `<task_list>` (cap) sia nel `<frame>` (backlog dello zoom-OUT) sia, idealmente, nel `<focus_hint>`. Così il modello sa SEMPRE quanto e di che priorità sta ignorando. (File: i CAP di temp-read/sliding-var già segnalano le righe nascoste; verificare estensione al medesimo standard.)
2. **Promemoria di re-organize/re-survey (req-2) — ⚠️ EVENT-DRIVEN, non a tempo (CORRETTO dal deep-review SOTA)**: il `<reorganize_reminder>` chiede al modello di **rivedere/ri-prioritizzare e ri-allineare l'obiettivo** se necessario. **MA il trigger NON è il tempo** (l'idea utente "~20 min" è giusta nel bisogno, sbagliata nel driver): la SOTA goal-drift (arXiv:2505.02709) mostra che il drift cresce col **NUMERO DI AZIONI** (~16 timestep), non coi minuti; un nudge a orologio è OOD per un 4B e, cadendo a metà ragionamento, **causa** il drift. → trigger **event-driven**: `(azioni-da-ultimo-nudge ≥ N)` (contate col `seq` monotono già in vars-queue, meta `_reorg_nudge_seq` silent come `focus_hint_ts`) **OR** dopo un `pop_focus` (re-survey naturale) **OR** dopo un task ad alto `unblocks` completato. **Solo a confine di azione/turno, mai a metà.** Time-based **solo** come fail-safe anti-stallo (>30-40 min idle). F=trigger(seq+cooldown+iniezione) / S=il modello decide se/come riorganizzare (outcome: ha ri-allineato quando serviva, no-op quando già allineato — twin-pair). Si lega a `compaction-scheduling` + [[concepts/low-confidence-gather-and-reorg]] + [[concepts/context-limits-explained]] §4.
3. **Objective-persistence (il pezzo LOAD-BEARING anti-drift, sopra il conteggio)**: a contesto pieno (>50%) il regime è **recency** → l'`<current_aim>` in TESTA è sfavorito. → ribadire l'obiettivo **anche in CODA** (`<aim_reminder>` compatto ~15 token, prima della lane volatile). Il marker `+N: H/M/L` resta un segnale di *consapevolezza*, NON la difesa primaria. (Vedi [[concepts/context-limits-explained]] §5.)
4. **Gate di proporzionalità DETERMINISTICO (non delegato)**: tutte le difese (breakdown, reminder, aim-in-coda) **costano token nella finestra che proteggono** → sotto-soglia (`openTasks≤~8 AND deps==0 AND usage<headroom`) restano **dormienti** (gate F-harness via collectMetrics, non giudizio del modello). (Vedi [[concepts/context-limits-explained]] §9.)
5. **⚠️ Difesa anti META-HACK (il rischio #1, msg 515)**: il modello NON deve imparare a chiudere/archiviare/de-prioritizzare task per **alleggerirsi il contesto** invece di completarli. Reward del context-management ancorato all'**OUTCOME reale** (acceptance a valle passa?), MAI ai token-risparmiati/stato-più-corto; **penalità asimmetrica** forte sul chiudere un task il cui check NON passa; scorer≠scored. → concept dedicato `context-management-reward-hacking` + entry test-book. (Vedi [[concepts/context-limits-explained]] §8.)

> **Why → problema → soluzione (anti-cecità)**: *why* la mente-in-prima-persona (Strada-2) vede un workspace curato/windowed → *problema* su contesti grandi il curato può nascondere troppo e il modello perde il quadro/obiettivo → *soluzione* (a) non nascondere mai in silenzio: segnala quantità+priorità del nascosto; (b) nudge periodico a ri-surveyare/ri-prioritizzare. Entrambe ancorate all'outcome (decisione corretta nonostante il window), non alla cerimonia.

## Context-budget headroom + limiti non considerati (msg 517) [broader — candidato concept a sé]

**Idea utente**: usare MENO contesto del disponibile (es. "pieno" = 80% di 1M). **Risposta: idea CORRETTA, e per il NOSTRO modello (SLM ~4B) ancora PIÙ importante.**
- **Già lo facciamo in parte**: i trigger compattano/focalizzano PRIMA del 100% — `tokenReorderPct=0.55`, `tokenMatrioskaPct=0.75`. Quindi "pieno effettivo" ≈ 75%, non 100%.
- **Non danneggia, MIGLIORA**: gli LLM degradano avvicinandosi al pieno (lost-in-the-middle, attention-dilution, context-rot); la qualità è migliore nella prima parte della finestra → tenere headroom = restare nel regime di qualità alta. Costo: curazione (checkpoint/focus/reorg) più frequente (overhead piccolo). **Autonomia invariata** (il modello resta autonomo, consolida solo più spesso).
- **CRUCIALE per un modello PICCOLO**: un 4B degrada MOLTO prima di un frontier model → il suo **contesto EFFETTIVO << finestra massima**. "80%" è probabilmente troppo alto: la soglia va **MISURATA** dalla curva effective-context del nostro modello (needle-in-haystack a profondità crescente), non fissata a occhio (potrebbe essere 50-60% reale).

**Altri limiti che NON stiamo considerando abbastanza** (completeness):
1. **Effective-context << finestra** — misurare la curva di degradazione (needle@depth) → la soglia "pieno" deriva da DATI, non da 80% fisso. [il più importante per noi]
2. **Budget di OUTPUT** — risposta + thinking (Qwen3) consumano token nella stessa finestra → riservare headroom per GENERARE, non solo per il context.
3. **tool_result giganti** — un singolo read/grep grande satura → content-compression (già in piano, NEXT-BUILD item-2).
4. **Train-serve context match** — addestrare sulle dimensioni/forme di contesto del serving; train-corto/serve-lungo = mismatch; la soglia "pieno" deve coincidere col training.
5. **Posizione conta (lost-in-the-middle)** — aim/vincoli all'inizio/fine, non sepolti → il cache-stable-prefix (rules/aim in testa) + lane volatile in coda già aiuta; verificare le posizioni privilegiate.
6. **KV-cache / latenza / VRAM** (2080Ti→A100) — contesto lungo = più lento+memoria; headroom aiuta throughput.
7. **Attention-dilution intra-budget** — anche sotto soglia, troppe lane/task diluiscono il focus (= l'anti-cecità di msg 515).
8. **Tokenizer / max-seq hard-cap** + **costo** (più token = più compute/€).

→ **Sintesi**: NON fissare 80% a occhio — MISURARE l'effective-context del nostro modello e impostare la soglia da lì (probabilmente <80% per un 4B); output-budget, tool_result, train-serve-match e posizione sono i limiti load-bearing. Lega a `decisions/2026-06-29-headroom-evaluation` + cache-stable-prefix + content-compression.

## Validazione richiesta PRIMA di implementare (msg 510/511)

1. **Review-loop** agnostico + verticali (matrioska-specialist + agentic-systems + ML-training): il design regge? l'ordine topological+priority è quello giusto (vs altri schemi: critical-path, WSJF, eisenhower)? il gathering-in-focus conviene o è cerimonia? blocked-handling corretto? edge: cicli, deps cross-subset, task done che sbloccano altri.
2. **Simulazioni REALISTICHE ad ALTO contesto** (msg 511 "altrimenti parliamo del nulla"): scenari con **molti task (30-50+) con deps/priority reali** (catene di dipendenze, fan-out, task bloccati, priorità mescolate) — NON i 28 placeholder banali del dogfood. Misurare: con il gathering, il focus seleziona un subset *eseguibile* (0 task bloccati nel subset, dep-order rispettato, alta priorità) vs il baseline "primi N"? Il gathering-in-focus riduce il contesto della decisione senza perdere qualità?

## Simulazione realistica (msg 510/511) — RISULTATO [VALIDATO]

Prototipo dell'algoritmo (no LLM) su un task-graph **realistico e denso**: 35 task (32 open, 3 done) modellando un progetto software — layer infra→core→feature→test/doc, deps incrociate, 2 bug ad alta priorità bloccanti, chore indipendenti. (Script: `graphify-out/.focus-sim*.mjs`, gitignored.)

**Risultato 1 — il design EVITA i task bloccati** (valore confermato):
- Baseline "primi 5 per creazione" → **1/5 bloccato** (mette a fuoco `core:session`, che attende `auth lib`).
- Proposto "primi 5 ready in exec-order" → **0/5 bloccato**. ✅

**Risultato 2 — GAP scoperto (il topological+priority puro è insufficiente)**: lasciava entrare nel top-5 *foglie a basso valore* (`feat:settings` p3, chore) perché "ready + priority", mentre i task **foundational ad alto sblocco** dovrebbero stare prima. → **FIX: ordinare per `unblocks` (downstream-impact) desc**, poi priority:
  - `core:user model` **unblocks=11**, `auth lib` **=9**, `core:orm` **=7**, `core:api router` **=5** → salgono (corretto);
  - `feat:settings` **=1**, chore **=0** → scendono (corretto).
- **Conclusione**: il subset di focus migliore non è "ready+priority" ma **"ready ad alto unblock"** — il fattore downstream-impact è load-bearing su grafi reali. (Senza la simulazione ad alto contesto non sarebbe emerso — l'utente l'aveva previsto, msg 511.)

**Risultato 3 — niente cicli** sul grafo realistico; il critical-path *upstream* è degenere (tutti i ready hanno cp=1: i loro deps sono done) → la metrica utile è **downstream**, non upstream.

## Open questions (per review-loop)

- Schema di ordinamento: topological+priority basta, o serve **critical-path** (longest-path nel dep-graph) per task con catene lunghe?
- `deps` come blocco hard (must-be-done) o anche soft (preferenza d'ordine)?
- Il modello deve poter SETTARE priority/deps (rischio reward-hacking: si auto-assegna priorità comode) → reward sull'outcome (progresso reale), non sui campi dichiarati.
- gathering-in-focus: scope vero vs proiezione-vista? (vedi sopra)

## Link

- [[architecture/matrioska-orchestration-spec]] (§enter-focus — `lead` diventa primo-in-dep-order)
- [[concepts/dependency-aware-error-recovery]] (dep-graph + truth-maintenance — stesso grafo, uso diverso)
- [[concepts/situational-policy-table]] (situazione→azione: "quali task a fuoco" è una policy situazionale)
- [[concepts/training-vs-harness-classification]] (F=task-graph / S=gathering+scelta)
