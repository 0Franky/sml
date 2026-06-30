---
name: context-section-sizing-study
description: Studio (workflow multi-agente specializzato + agnostico, 2026-06-30) su QUANTE voci mostrare per ogni sezione/lane del <context>. Tabella per-sezione (cap attuale → raccomandato → rationale → serve-misura-empirica) + top-3 priorità + cosa misurare prima (curva effective-context) + bug concreti trovati.
type: study
tags: [context-assembly, sizing, effective-context, lanes, review-loop, make-or-break]
last_updated: 2026-06-30
---

# Per-Section Context Sizing — Studio (specializzato + agnostico)

> **Origine**: utente msg 712/720 (2026-06-30) — "studio di quanti item mostrare per ogni sezione". Eseguito come workflow multi-agente (`wunbzti29`, 32 agenti: Map → per-sezione specializzato + critica agnostica → synthesize) sul codice REALE (`context-assembler.mjs`, `context-assembly.ts`, `vars-queue.mjs`, `harness-config.mjs`). Companion di [[concepts/context-limits-explained]] (§11 make-or-break) + memory `feedback_context_window_sizing`. **Caveat**: quasi ogni numero resta "dipende → MISURARE" finché non esiste la curva effective-context del nostro 4B.

## (1) Tabella riassuntiva

| Sezione | Cap attuale | Raccomandato | Rationale (1 riga) | Empirico? |
|---|---|---|---|---|
| **rules** | NESSUN CAP (sort severità+id) | Nessun cap a serve-time; governo a write-time/lint | Driver = discriminabilità k-istruzioni del 4B (~5-9), non token; hard mai cappate | SÌ — k-discriminabilità + robustezza hard sotto diluizione |
| **current_aim** | 1 voce o '(none)' | 1 voce (architetturale) | Cardinalità fissa; driver = stabilità-byte title + densità-ancora del troncamento | SÌ sul contenuto, no sul numero |
| **task_list** | 20 (hardcoded; disallineato da watchReorder=12) | ~10-12 ready-first, floor = ready con unblocks>0 | cap limita solo costo/rumore; maxTasks≠watchReorder (cap vs trigger) | SÌ — eff-context + watchCount + re-fetch rate |
| **verify_queue** | NESSUN CAP (tutte pending) | Nessun cap numerico + GC-on-resolve/abandon + cap-token su `detail` | Gate correttezza: mai nascondere pending; rischio = no-GC + detail verboso | SÌ — distrib \|pending\| + token/detail + GC-rate |
| **vars** | 12 (sort last_modified) | 12 tetto; sort per decision_ref (2 chiavi) | Costo~0 e recuperabili → vincolo = SELEZIONE/sort, non numero | SÌ — distrib #vars + re-fetch + A/B sort |
| **recent_changes** | 15min + 12 voci | 15min primario; cap ~5-8 provvisorio | Valore decade in fretta; cap morde solo in burst | SÌ — istogramma mutazioni/15min |
| **notes** | count(*), 0 voci | 0 voci (corretto); segnale condizionato-alla-rilevanza non count globale | Payload escluso by-design; count globale è inerte/fuorviante | SÌ — sensibilità decisione al count |
| **current_time** | 1 voce, gated (off) | 1 voce, gate binario (off) | Driver = train-serve match del FORMATO timestamp, non cache | NO (cardinalità) |
| **messages_with_user** | n=8 + charCap=4000 (NON config.) | n=6; vincolo reale = charCap (~1000 tok), non n | Unica fonte verbatim; binding = char non n | SÌ — eff-context + budget-lane + distrib lunghezza-turno |
| **resuming_from** | open 5 / dec 4 / handoff 1 | open 3 (ma ORDINA con listTasksOrdered) / dec 2 / handoff 1 + "+N" | Blocco one-shot self-rimovente → bassa leva | SÌ — costo-token + curva-outcome resume |
| **current_aim_reminder** | 1 voce o '' | 1 voce + cap-char sul title + gating sotto-soglia | Driver = lunghezza-cappata + attivazione solo in regime recency | SÌ — fill-point recency 4B |
| **focus_hint** | 0-o-1, gate matrioska + cooldown 90s | 1 riga statica; NO payload/lista | Driver = QUANDO emettere (soglia 0.75→?), non quante voci | SÌ sulle soglie |
| **execution_order** | NESSUN CAP (tutti i task) | Floor = tutti i ready; cap non-ready = riusa maxTasks (DRY) | Driver = \|ready\| (frontier stretto) | SÌ — distrib \|ready\| |
| **reorganize_hint** | 0-o-1, gate reorder + cooldown 90s | 1 riga, 0-o-1; NO lista; drop H/M/L inline (doppione) | Segnale di controllo binario, non canale-dati | SÌ sulle soglie |
| **frame** (nested) | constraints ∞ / dec,shared,backlog = 8 | constraints ∞; dec/shared ~6; backlog 2-3; FIX slice shared→recency | Bug reale = DIREZIONE slice (shared mostra i più VECCHI) | SÌ — distrib cardinalità per-lane |

## (2) Top-3 priorità

1. **`messages_with_user`** — unica fonte verbatim; il vincolo vero (`charCap=4000`) è **hardcoded e non esposto** (non A/B-abile). Fix a costo-zero: sanare incoerenza default 8-vs-6 + esporre `charCap`.
2. **`task_list` / `execution_order`** (coppia) — governano "cosa fare adesso" (goal-myopia/re-fetch). Difetti: task_list=20 hardcoded **disallineato** da watchReorder=12 (display-cap ≠ soglia-pressione); execution_order **uncapped** mentre task_list cappato. Fix DRY: stesso `maxTasks`, stesso "+N H/M/L", floor = tutti i ready.
3. **`verify_queue`** — rischio asimmetrico (pending nascosta = gate di correttezza saltato). Numero illimitato giusto, ma mancano **GC-on-resolve/abandon** (oggi accumulo monotòno → lost-in-the-middle) + **cap-token sul detail**. NB: GC-on-abandon richiede prima un `focus_id` nello schema verification (oggi keyed by task_id).

## (3) Cosa misurare PRIMA — curva effective-context (prerequisito #1 BLOCCANTE)

Curva effective-context del **nostro Qwen3-4B**, 3 livelli (vedi [[concepts/context-limits-explained]] §"soglia"):
- **L1 needle singolo**: solo sanity-check, NON per fissare soglie (ottimistico).
- **L2 multi-hop/aggregazione** a 4/8/16/24/32K: la curva che conta.
- **L3 harness-realistic**: sui veri `<context>` Strada-2, esito held-out.
- **Soglia "pieno"** = lunghezza oltre cui accuratezza (L2+L3) cala >5% relativo. **min(soglia-qualità, tetto-hardware)**: su 2080Ti comanda l'hardware (~12-16K); 32K va su A100.

**Sblocca**: tutti i cap numerici (task_list ~10-12, messages n/char, recent_changes ~5-8, frame); le soglie gate matrioska/reorder (0.75/0.55 sono `[CALIBRATE]`); il fill-point del regime recency.

**Misure ECONOMICHE da fare SUBITO (no GPU, su log esistenti)** — spesso rendono il dibattito-cap accademico:
- **Distribuzioni di cardinalità** per lane (\|ready\|, \|pending\|, #vars, mutazioni/15min, watchCount, lunghezza-turno): se p95 è già sotto il cap, **il cap non morde** → conta il sort.
- **Re-fetch rate** via `turn-trace` (il proxy outcome-anchored che ha pescato FIND-7, list_secrets 6×): falsifica "cap troppo basso → myopia".
- **Caveat §11**: prima di attribuire un finding all'allineamento del modello, **escludere context-retention**.

## (4) Dove specializzato e agnostico DIVERGONO (le tensioni vere)

- **`rules`**: lo specializzato lo giustifica col token-budget (8-10%); l'agnostico mostra che con 3 seed sei a ~1-3% (due ordini sotto) → driver reale = **discriminabilità ~k-istruzioni del 4B**, scorrelata dai token. Floor-by-severità protegge dal taglio-budget ma **non dalla saturazione-attenzione** (15 hard > 4 hard+11 soft). Conclusione operativa uguale (non cappare), razionale da riscrivere.
- **`task_list`**: falsa equivalenza maxTasks↔watchReorder (display-cap vs trigger su openTasks+pendingVerifs). Allinearli **maschera la pressione**. Fix: rinominare il commento, tenerli **disgiunti**.
- **`verify_queue`**: l'enforcement hard è ALTROVE (assets hard-limits + secrets-guardrail); qui è skill **S addestrabile**, non F-enforced. GC-on-abandon **non implementabile** senza focus_id. Direzione regge, criticità sovrastimata.
- **`notes`**: "by-design" è framing improprio — l'idea ground-truth (error-memo-system) prescriveva **top-K inline**; push→pull è una **decisione d'implementazione** da documentare in `decisions/` (regola #1), non legge di natura. Bucket "20" = numero a occhio (vietato §11).
- **`current_time`**: la cache NON è il driver (messages/recent_changes/vars sono ugualmente volatili) → driver = **train-serve match del formato**.
- **`messages_with_user`**: **errore fattuale** — lo specializzato dice "tieni la coda se 1 turno eccede", il codice fa l'opposto (`slice(0,charCap)` = tiene la TESTA). Decidere **per-tipo** (paste-user ≠ turno-assistant-lungo).
- **`resuming_from`**: la staleness-in-testa NON avviene (self-gated, si auto-rimuove). Rischio vero: gli open-task del resume **non sono execution-ordered**.
- **`frame`**: bug load-bearing → decisions usa `slice(-N)` (recenti, giusto) ma **shared_state/backlog usano `slice(0,N)` (i più VECCHI)** — cap giusto sulla metà sbagliata. Fix 1-riga (head→tail) vale più della ri-taratura.

**Pattern trasversale**: lo specializzato importa l'apparato token-budget anche dove NON è il driver (prefissi stabili `rules`, puntatori O(1) `current_aim`/`current_time`, segnali binari `focus_hint`/`reorganize_hint`/`notes`). Lì il driver è altro: discriminabilità del modello, stabilità-cache/train-serve, rilevanza-condizionata, direzione-di-selezione. L'agnostico converge sulla stessa conclusione operativa ma con razionale corretto.

## Bug concreti emersi (→ [[todo]])
1. **`frame` slice-direction** (load-bearing): `shared_state`/`backlog` usano `slice(0,N)` → mostrano i più VECCHI invece dei recenti. Fix 1-riga head→tail. 🔴
2. **`task_list` cap=20 hardcoded** disallineato da watchReorder=12 + commento "≈ cap" fuorviante; **execution_order uncapped** (incoerenza DRY).
3. **`messages_with_user`**: `charCap=4000` hardcoded non esposto; default 8-vs-6 incoerente; troncamento tiene la TESTA non la coda.
4. **`verify_queue`**: manca GC-on-resolve/abandon (accumulo monotòno); GC-on-abandon serve `focus_id` nello schema.

## Link
- [[concepts/context-limits-explained]] (§11 make-or-break · curva effective-context) · [[concepts/wrapper-context-assembly-example]] · memory `feedback_context_window_sizing` · [[concepts/sealed-secrets-livetest-findings]] (FIND-7 re-fetch = proxy outcome).
