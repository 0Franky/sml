---
name: context-bounds-study
description: Studio (workflow 8-agenti specializzato+agnostico, 2026-06-30) sui BOUND [min,default,max] per il self-tuning P3 del <context>. Classifica ogni lane (self-tunable volatile-tail / FROZEN stable-prefix / FROZEN gate), fissa il design-contract P3, e identifica 3 infrastrutture BLOCCANTI mancanti (budget-allocator, tool set_view, reset-lifecycle). Builds-on context-section-sizing-study.
type: study
tags: [context-assembly, sizing, bounds, self-tuning, P3, review-loop, make-or-break]
last_updated: 2026-06-30
---

# Context Bounds — studio P3 self-tuning (specializzato + agnostico)

> **Origine**: utente msg 741 (2026-06-30) — *"C ... Studia bene i boundary e i valori di default per ciascuna sezione. Approvo che le sezioni più dinamiche (e/o ad alto valore) stiano in basso"*. Eseguito come workflow multi-agente (`wtwcvg2f6` / `wf_0eac52d4-441`, 8 agenti: Map → 4 propose specializzati → 2 critic agnostici → synthesize) sul codice REALE. **Builds-on** [[concepts/context-section-sizing-study]] (la tabella per-sezione + i 4 bug) e [[concepts/model-controlled-context]] (il design P3). Companion: memory `feedback_context_window_sizing`.
>
> **Tesi confermata**: l'asse di classificazione (Stable-Prefix / Volatile-Tail / Gate) e il principio "self-tuning solo sulla coda volatile" sono **sani e approvati**. MA **spedire qualunque self-tuning è BLOCCATO** su infrastruttura che oggi NON esiste (vedi §4 P0).

## Verifica delle affermazioni dello studio (metodo: verifica-non-fidarti) [EXTRACTED]
Due claim fattuali dei critic, controllati contro HEAD `460686f`:
1. **"frame slice-direction già fixato"** → ✅ VERO. `nested-compact.mjs` ordina `shared_state` per `last_modified` DESC poi `slice(0,N)` (= recenti), e costruisce `backlog` ready-first via `listTasksOrdered`. **NON ri-applicare il flip `slice(0,N)→slice(-N)`** (lo studio iniziale lo prescriveva: era basato su codice pre-fix → claim STALE). Resta vivo solo lo split del `displayCap` condiviso.
2. **"eviction multi-turno silenziosa, senza marker"** (`conversation-store.mjs:128`) → ⚠️ **IMPRECISO**. `olderHidden = total - win.length` (`:136`) conta ANCHE i turni sfrattati dal `charCap`, e `:140-141` emette `(+N older messages in the segment — use get_conversation range=…)`. Il marker **aggregato C'È** (count + range pointer). Il gap reale è solo il **seq-id per-messaggio** + la **direzione di troncamento per-ruolo** del singolo-turno-gigante (RESUME #3), non un marker mancante.

## 1. Tabella BOUND (per-lane)

Classi: **SP** = Stable-Prefix (FROZEN, config write-time) · **VT** = Volatile-Tail (self-tunable P3) · **GATE** = never-truncate.

| Lane | Default attuale (file:line) | Classe / Tunable? | Rec. default | Min | Max | Note budget · empirico |
|---|---|---|---|---|---|---|
| `<rules>` | NO cap, sort severità+id (`context-assembler.mjs:134`) | SP — FROZEN | — | — | — | prefisso uncapped; mai resize a runtime |
| `<current_aim>` | 1 voce (`:142`) | SP — FROZEN | 1 | — | — | single line |
| `<task_list>` (maxTasks) | `20` hardcoded (`:153`) | **SP — FROZEN per il modello / config-only** | **10** `[CALIBRATE]` | 5 | 16 | è nel prefisso stabile (`:46`) → resize = KV-thrash + prior rotto. PULL `list_tasks` |
| `<verify_queue>` | NO count-cap; `VERIFY_DETAIL_CAP=200` (`:181,40`) | **GATE — never-truncate** | — | — | — | cappare il numero = gate nascosto = falla. Solo char-cap sul detail |
| `<vars>` | `maxVars=12`, last_modified DESC (`:190`) | **VT — TUNABLE** | **12** | 6 | 16 | coda volatile; PULL `get_shared_view`. **Il sort è la leva vera, non il count** |
| `<secrets>` | NO cap, valore mai mostrato (`:212`) | **GATE — FROZEN** | — | — | — | inventario sicurezza; **assente nel ramo nested = bug** |
| `<recent_changes>` | 15min + `maxChanges=12` (`:35,225`) | **VT — TUNABLE (solo count)** | **8** `[CALIBRATE]` | 3 | 12 | **window FROZEN** (condivisa col resume-gating). PULL `get_changelog` |
| `<notes count>` | solo count (`:239`) | FROZEN (segnale binario) | — | — | — | canale di controllo, non dati |
| `<current_time>` | 1 riga, gated (`:244`) | FROZEN (unica riga volatile del prefisso) | — | — | — | driver = train-serve del FORMATO, non il count |
| `<messages_with_user>` **n** | fn-def `6` vs config `messagesWindowN=8` | **VT — TUNABLE** | **6** (reconcile DOWN) | 2 | 10 | n è SECONDARIO; charCap binda prima. PULL `get_conversation` |
| `<messages_with_user>` **charCap** | `4000` char; config esposto (`harness-config.mjs`) + ✅ ora cablato (`460686f`) | **VT — TUNABLE** | **4000 char, ri-espresso in TOKEN** | 1500 | 8000 | IL vincolo binding. 4000 char ≈ **1300-1400 tok** (non ~1000); ~3 char/tok per codice |
| `<resuming_from>` | tasks[0:5]/dec[0:4]/handoff 1, gated 15min | FROZEN (transiente, self-removing) | as-is | — | — | one-shot, bassa leva |
| `<frame><constraints>` | MAI troncate (`nested-compact.mjs:231`) | **GATE — FROZEN** | — | — | — | hard rules sopravvivono al focus |
| `<frame><decisions>` | `displayCap=8`, `slice(-N)` ✓ | **config/write-time** | 6 | 3 | 10 | lane più pesante (id+text+rationale) → la PRIMA a restringere |
| `<frame><shared_state>` | `displayCap=8`, sort last_modified DESC+`slice(0,N)` ✓ | **config/write-time** | 6 | 3 | 8 | slice-direction GIÀ FIXATO — non ri-flippare |
| `<frame><backlog>` | `displayCap=8`, `listTasksOrdered` ready-first ✓ | **config/write-time** | 3 | 2 | 5 | periferia → cap più basso, prima a restringere |
| `<frame>` `displayCap` | unico `?? 8` per le 3 lane (`:224`) | **SPLIT in 3 (refactor write-time)** | — | — | — | un solo knob mischia lane pesanti e leggere |
| `<execution_order>` | NO cap, tutti i task (`:297`) | **floor=ready FROZEN + coda config-only** | floor=`\|ready\|`; non-ready cap=maxTasks | floor | 16 | iniettato a `enter_focus`; il floor (ready) mai troncato = lead corretto |

### Riconciliazioni proposta-vs-critic (chi ha vinto, perché)
- **task_list / execution_order — proposta `tunable:true`; critic (P0) FROZEN-per-modello** → **SIDE = CRITIC**. Sono provabilmente nel prefisso stabile; la stessa proposta ammette il KV-thrash. Il tuning resta **config write-time**, profondità via PULL. `[EXTRACTED]`
- **frame shared_state/backlog — proposta "flippa slice"; critic "GIÀ FIXATO"** → **SIDE = CRITIC, verificato a HEAD**. Aggiornare il testo stale in [[concepts/context-section-sizing-study]] (righe 31/63/68). `[EXTRACTED]`
- **frame per-lane counts — proposta P3-tunable; critic config-only** → **SIDE = CRITIC**: il frame è la testa atemporale cache-stable (stessa classe del task_list). `[INFERRED]`
- **messagesCharCap "non cablato" (Map) vs "config-exposed" (critic)** → **entrambi in parte**: il campo+env esistevano ma non passati ai call-site → **ora cablato** (`460686f`). Resta la riconciliazione `default==fallback==6` byte-per-byte (decisione di valore). `[EXTRACTED]`
- **recent_changes 8 vs 12** → **SIDE = proposta (8)** ma `[CALIBRATE]`: difendibile solo se mutazioni/15min p95 ≤ 8.

## 2. Design-contract P3 (prosa)

**Superficie self-tunable (il modello regola solo i CONTEGGI) = ESATTAMENTE 4 lane**, tutte nella coda genuinamente volatile: `<vars>` count, `<recent_changes>` count (mai la window 15min), `<messages_with_user>` **n** + **charCap**. Stanno DOPO il prefisso stabile / dopo `</context>` → ridimensionarle sposta solo byte già oltre la base cacheata (nessuna invalidazione del prefisso). `[EXTRACTED]`

**FROZEN — prefisso stabile** (mai un knob a runtime): `<rules>`, `<current_aim>`, `<task_list>` (struttura, ordine E cap), `<frame><aim>`, `<execution_order>` ready-floor, e l'intera testa atemporale `<frame>` (cap per-lane di decisions/shared_state/backlog). Razionale: il contratto cache-stable-prefix richiede byte identici cross-turno a stato invariato; `<current_time>` è l'UNICA riga volatile del prefisso. Resize/reorder qui → KV-thrash + prior posizionale rotto (TB-10). Restano **config write-time**; per più profondità → PULL tools. `[EXTRACTED]`

**FROZEN — GATE never-truncate**: `<verify_queue>` (count mai cappato — pending nascosta = gate di correttezza saltato; solo `VERIFY_DETAIL_CAP=200` tronca un detail verboso SENZA nascondere il gate), `<secrets>` (inventario sicurezza), `<frame><constraints>`. Sono **proibiti** sulla superficie P3, non solo "non proposti". `[EXTRACTED]`

**Regola d'ordine (dinamico-in-basso) + caveat-gate**: il contenuto volatile sta in coda; il prefisso stabile resta in testa byte-identico. **Caveat**: i GATE never-truncate sono l'eccezione a "piccolo=in basso" — `<verify_queue>`/`<secrets>` stanno DENTRO il prefisso e rendono per intero a prescindere dalla posizione, perché il ruolo di correttezza batte l'economia di dimensione. Il modello non riordina mai nulla; **l'ordine è di proprietà di sort deterministici**. `[INFERRED]` — **conferma la regola utente "sezioni dinamiche in basso", col caveat che i gate ad alto valore NON vanno in coda effimera.**

**Budget totale + cap per-sezione — NON ESISTE ANCORA (BLOCCANTE P0)**: entrambi i critic hanno verificato che NON c'è alcun costrutto di budget aggregato — `assembleContext`/`buildMessagesLane`/`serializeFrame` prendono cap per-sezione INDIPENDENTI e nulla somma/clampa il totale; `outputReservePct` sposta solo il TRIGGER di compaction, non la SIZE delle lane. Quindi la garanzia delle proposte "alzare-tutto è impossibile by-construction" è **fittizia oggi**: alzare ogni lane al max dà un prefisso illimitato. **Requisito di contratto**: prima di esporre qualunque self-tune, un allocatore di budget-token deterministico che, riservato il prefisso stabile (uncapped) + l'output-reserve, distribuisce il resto sulle 4 lane di coda e HARD-CLAMPa la somma (alzare A forza giù B o viene rifiutato). Contare in **token**, non char/righe. `[EXTRACTED]` (assenza verificata)

**Costo KV-cache**: ridimensionare un conteggio di coda = economico (ri-renderizza byte già oltre la base; in regime relativo la coda si ri-renderizza comunque ogni richiesta). Ridimensionare QUALUNQUE conteggio del prefisso/frame = costoso (invalida la cache dall'offset di quella lane in poi + shifta il prior posizionale). Questa asimmetria È il motivo per cui la superficie self-tune è solo-coda. `[EXTRACTED]`

**Reset-to-default / decay — NON specificato (BLOCCANTE)**: `model-controlled-context.md` mandata "reset-to-default + niente persistenza illimitata" ma nulla lo implementa. **Requisito**: salvare i conteggi self-tuned nel META di sessione (pattern `_focus_hint_ts` silent, NON nel changelog); RESET su `pop_focus` + nuova sessione; auto-decay dopo K turni senza ri-affermazione → un "expand" una-tantum non diventa la baseline permanente che re-introduce il bloat. `[EXTRACTED]` (mandato) / `[CALIBRATE]` (K)

**Train-serve**: (1) `set_view`/`expand_section`/`expand_message` **NON esistono** (grep 0 hit) → PHASE-2. **PHASE-1**: addestrare SOLO sui footer PULL già renderizzati + la grammatica `+N hidden — use X`. **PHASE-2**: dopo aver congelato schema-tool + byte-format + bound, ri-generare le trace con azioni self-tune a CONTEGGI MULTIPLI (generalizza sulla profondità, no overfit a un default). (2) Train e serve devono condividere default/fallback/direzione-troncamento/regime-timestamp ESATTI per-lane. (3) Il tool `set_view` deve accettare **solo un argomento count per sezione, NESSUN parametro d'ordine** → "counts non order" impossibile da violare by-construction. Ogni cambio di sort va spedito come **sort deterministico FROZEN PRIMA** di raccogliere le trace. `[EXTRACTED]`

## 3. EMPIRICO — misurare PRIMA di fissare `[CALIBRATE]`
Tutto economico, **no-GPU, su log esistenti**. Bloccare min/default/max solo dopo.
1. **Feasibility congiunta (ARITMETICA, subito)**: somma di tutti i max proposti in token + il prefisso stabile UNCAPPED (rules+verify_queue+secrets) + output-reserve **deve stare in 12-16K**. Probabilmente forza vari max GIÙ. Finché non passa, ogni `max` è **placeholder provvisorio**.
2. **Curva effective-context 4B (L2 multi-hop + L3 harness-realistic)** — IL prereq bloccante. Finché non misurata, i default (task_list 10, recent_changes 8, charCap-as-token) sono stime ancorate-alla-discriminabilità.
3. **Cardinalità p95 per-lane**: se p95 < default, il cap NON morde e conta solo il sort/order.
4. **Re-fetch rate via turn-trace** (il proxy outcome-anchored che ha pescato FIND-7): re-fetch crescente sotto cap basso *falsifica* "cap troppo basso → myopia".
5. **vars SORT A/B**: single-key last_modified vs 2-key (decision_ref-weighted). Per questa lane il count è low-info; il sort è la leva. Congelare il sort PRIMA delle trace self-tune.
6. **Frequenza task-graph strutturato-vs-flat**: se i set reali sono per lo più flat, `execution_order` collassa alla lista semplice e la questione cap è accademica.

## 4. COSA COSTRUIRE (F = meccanismo harness · S = skill modello, outcome-anchored)

**F — meccanismi (DEVONO atterrare PRIMA di esporre il self-tune):**
1. **Allocatore budget-token totale** `[F-harness]` — singolo `assembleBudgetTokens` in `buildWorkspace`/`buildNestedWorkspace`; riserva prefisso-stabile + output-reserve, distribuisce il resto sulle 4 lane di coda, HARD-CLAMP della somma. **(P0 — non esiste oggi.)**
2. **Tool `set_view`/`expand_section`/`expand_message`** `[F-harness]` — arg count-only per sezione (NO order), ristretto alle 4 lane di coda, byte-format frozen + enforcement dei bound (clamp out-of-band → default). **(Non esiste — grep 0 hit.)**
3. **Lifecycle self-tune** `[F-harness]` — conteggi nel META; reset su `pop_focus`+nuova-sessione; auto-decay dopo K turni.
4. **Wiring config→assembler** `[F-harness]` — ✅ PARZIALE (`460686f`: charCap+windowN cablati ai call-site live in `context-assembly.ts`). Residuo: riconciliare `default==fallback==6` byte-per-byte + propagare anche a `buildWorkspace` (non-live).
5. **charCap → token-accounting + marker troncamento** `[F-harness]` — ri-esprimere charCap in token (o pin ratio char/tok per codice); il single-giant-turn già appende `…[+N chars]` — il gap reale è **seq-id per-messaggio** + direzione di troncamento per-ruolo (turno assistant → tieni la CODA/conclusione). *(NB: la "eviction multi-turno silenziosa" è un'imprecisione dello studio: il marker aggregato `+N older` esiste già — vedi §verifica.)*
6. **Split frame displayCap** `[F-harness]` — sostituire l'unico `?? 8` con 3 cap write-time indipendenti. **NON ri-applicare flip di slice** (già fatto).
7. **Completezza gate (adiacente, gate-critical)** `[F-harness]` — passare `opts.secrets` all'`assembleContext` DENTRO `buildNestedWorkspace` (i secret oggi spariscono in focus mode = RESUME #6); confermare che `<verify_queue>` NON sia filtrato da `focusTaskIds` nel nested (un pending è un gate globale); **GC-on-resolve/abandon** per verify_queue (cleanup-on-state-change, NON un display-cap; GC-on-abandon serve `focus_id` nello schema).

**S — skill modello (PHASE-2, dopo F.1-F.3, outcome-anchored):**
8. **WHEN-espandere/restringere** `[S]` — reward ancorato al **delta di task-success** su item che genuinamente servono la vista profonda, NON al call-count né alla plausibilità immediata. Mettere il **COSTO del bloat** (token/latenza/cache-invalidation) NEL reward → "always expand to max" (il participation-hack) dis-incentivato. Vedi `feedback_reward_hacking_principle`.
9. **Cry-wolf / proporzionalità held-out** `[S]` — set NEGATIVO esplicito: task risolvibili con la vista DEFAULT la cui gold-trajectory NON chiama `set_view`/`expand` (reward dell'espansione → 0/negativo lì). Deliverable di gating (gemello del cry-wolf di window-aware-fetching, rule #11).

## Net verdict
La classificazione (SP/VT/GATE) e il principio volatile-tail-only sono **sani e approvati**. Ma spedire qualunque self-tune è **BLOCCATO** su infra inesistente: (P0) l'allocatore di budget totale + la riclassificazione task_list/execution_order/frame a config-only; (P1) il tool `set_view` + bound frozen, il charCap-token-fix + seq-id, il lifecycle reset-to-default, e il cry-wolf held-out. Due claim Map/proposta sono **stale vs HEAD** e NON vanno eseguiti: frame slice-direction già fixato, e messagesCharCap già config-exposed (residuo = wiring, ora fatto). Tenere la disciplina "cardinalità p95 + re-fetch PRIMA, curva effective-context è il prereq bloccante"; declassare ogni `max` a `[CALIBRATE]` finché l'aritmetica di feasibility e la curva L2/L3 non sono fatte.

## Link
- [[concepts/context-section-sizing-study]] (tabella per-sezione + 4 bug; aggiornare righe stale 31/63/68) · [[concepts/model-controlled-context]] (P3 — aggiornare la classificazione FROZEN-vs-tunable) · [[concepts/context-limits-explained]] (§11 curva effective-context) · [[concepts/window-aware-fetching]] · [[model-testbook]] TB-05/TB-10 · memory `feedback_context_window_sizing` + `feedback_reward_hacking_principle`.
