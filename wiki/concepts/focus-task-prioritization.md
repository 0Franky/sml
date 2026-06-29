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

> **STATUS: design-draft DA VALIDARE** (review-loop agnostico+verticale + simulazioni realistiche ad alto contesto, msg 510/511 "altrimenti parliamo del nulla"). NON ancora implementato.

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
