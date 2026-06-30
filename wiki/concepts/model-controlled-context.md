---
name: model-controlled-context
description: Il modello deve poter CAPIRE e MODIFICARE i parametri di assemblaggio del proprio <context> (espandere un messaggio lungo, marcare i troncamenti, alzare/abbassare i conteggi per-sezione, distinguere aim-stabile da current-step volatile). Analisi criticità/gap/migliorie (utente msg 726, 2026-06-30).
type: concept
tags: [context-assembly, model-control, self-tuning, window-aware-fetching, criticality, make-or-break]
last_updated: 2026-06-30
---

# Model-controlled context — il modello regola la propria vista

> **Origine**: utente msg 726 (2026-06-30), dai findings del context-sizing ([[concepts/context-section-sizing-study]]). Tesi: il modello non deve subire i cap fissi — deve **capirli e modificarli** (o esploderli per-item) quando il task lo richiede. "Deve essere PERFETTO: così quando lo userai ti troverai bene." Companion di [[concepts/context-limits-explained]] (§11) + [[concepts/window-aware-fetching]] (lato recupero) + memory `feedback_context_window_sizing`.

## I 4 punti dell'utente + analisi

### P1 — Espandere/leggere meglio un SINGOLO messaggio lungo
- **Stato**: `messages_with_user` ha un `charCap` per-messaggio (lane troncata). Esiste [[concepts/window-aware-fetching]] + `get_conversation`/temp-read, ma NON un tool ergonomico "espandi QUESTO messaggio". `[INFERRED]`
- **Gap/design**: ogni messaggio mostrato deve avere un **id STABILE**; un tool `expand_message(id)` ritorna il testo pieno **in una var/temp-read** (non inline → no bloat; pattern temp-read già esistente), il modello lo legge on-demand e lo rilascia. Lato consumatore = window-aware-fetching.

### P2 — Marker di troncamento "il messaggio continua"
- **Stato (BUG confermato dallo studio)**: la lane tronca con `slice(0, charCap)` (tiene la TESTA) e **senza indicare** che il messaggio prosegue → il modello non sa di star leggendo un troncato (può rispondere su un pezzo). `[EXTRACTED]` (context-section-sizing-study, messages_with_user)
- **Fix**: quando si tronca, appendere un marker chiaro `…[troncato, +N caratteri — expand_message(id)]`. Decidere **testa-vs-coda per TIPO** (paste-utente lungo: forse la testa; output-assistant: forse la coda) invece di una regola fissa. Pairing diretto con P1 (il marker dà l'id da espandere).

### P3 — Il modello alza/abbassa AUTONOMAMENTE i conteggi per-sezione (messaggi, decisioni, ultime azioni…)
- **Stato**: i cap sono **config/hardcoded** (`messagesN` default 6, decisions/recent_changes/vars cappati). NON modificabili dal modello a runtime. `[EXTRACTED]`
- **Design**: tool `set_view(section, count)` / `expand_section(section, n)` — il modello alza/abbassa il cap di una lane **entro BOUND sicuri** (min/max per-sezione) per il turno corrente/successivi.
- **⚠ CRITICITÀ MAGGIORE (la tensione vera)**: i cap variabili **rompono il PREFISSO STABILE** del `<context>` — che è (a) la base della **cache** (prefix-stable → due richieste con stato uguale differiscono solo per `<current_time>`) e (b) il **prior posizionale appreso** ([[model-testbook]] TB-10: il modello impara "dove" sta ogni sezione SOLO se la struttura è fissa). Se il modello ridimensiona/riordina le sezioni del prefisso → cache-thrash + prior rotto. → **RISOLUZIONE proposta**: il self-tuning è ammesso SOLO sulle sezioni della **zona VOLATILE/coda** (numero messaggi, ultime-azioni) e **NON** sul prefisso stabile (rules/aim/task-structure); cambia i **conteggi**, mai l'**ordine**. + il tuning è F-harness con BOUND (per-section max + **budget totale**), così "alza tutto" non è possibile (anti-bloat = la degradazione che combattiamo). + è una **skill S** (QUANDO espandere) con reward **outcome-anchored** + proporzionalità (held-out negativo: task che NON richiede l'espansione → non espandere; gemello del cry-wolf di window-aware-fetching). + reset-to-default + niente persistenza illimitata.
- **Relazione P1↔P3**: P1 = espansione PER-ITEM (un messaggio); P3 = espansione PER-SEZIONE (quanti item). Due granularità della stessa idea "model-controlled read-depth".

### P4 — "Stato corrente" (sub-focus volatile) distinto dall'AIM
- **Esempio utente**: Aim = "modifica tutti i js"; Stato-corrente = "devo modificare file3.js".
- **Stato (gap reale)**: oggi `current_aim` **È** il task puntato da CURR (`getCurr()`→`getTask()`, un SOLO livello: id/status/title, `context-assembler.mjs:77/142`). NON c'è un livello "aim stabile" + "step volatile" separati. La matrioska (`focus_frames`) dà nesting ma è **pesante** (uno scope intero) per un semplice sub-step. `[EXTRACTED]`
- **Risposta alla domanda utente** ("rientra nelle note? merita una sezione?"): **NON** è una nota (le note = lesson-memo, ruolo diverso) → **merita un livello dedicato, leggero**. Design: tenere `current_aim` come **goal STABILE** (cache-friendly: lo studio dice che l'aim deve essere stabile-byte) + aggiungere un `current_step`/`<now>` **volatile, 1 riga, free-text, model-editable** (tool `set_step`) che vive SOTTO l'aim. Coerente con lo studio (un sub-focus volatile NON deve sporcare l'aim stabile → niente cache-thrash). Distinzione: aim = "cosa sto facendo nel complesso" (raro cambio) · step = "cosa adesso" (cambio frequente).
- **Sub-criticità**: relazione step↔CURR↔matrioska-focus da chiarire (lo step è una vista leggera dentro lo scope corrente; il focus matrioska resta per gli zoom-in veri con pop-report). Evitare 3 meccanismi sovrapposti.

## Altre criticità/gap emerse (oltre i 4)
- **Id stabile dei messaggi**: P1/P2 richiedono che ogni item mostrato abbia un id citabile (oggi la lane potrebbe non esporlo) → prerequisito.
- **Dove va il testo espanso**: in una **var/temp-read** (on-demand, rilasciabile), MAI inline (bloat). Riuso del pattern temp-read + vars.
- **Coerenza default**: `messagesN` 6-vs-8 incoerente nel codebase (studio) → sanare prima di esporre il tuning.
- **Interazione col budget**: ogni espansione (P1/P3) consuma budget → deve passare per l'**output-reserve**/budget totale già previsto; un expand non deve sfondare la finestra effettiva.
- **Train-serve match**: se il modello impara a usare set_view/expand, va **addestrato sullo stesso meccanismo** (TB-10) — altrimenti a runtime non lo usa o lo usa male.

## Cosa c'è nel context OGGI + cosa MANCA (utente msg 727, 2026-06-30)

**Cosa c'è ora** (15 sezioni, da [[concepts/context-section-sizing-study]]): prefisso STABILE → `rules` · `current_aim`(=CURR) · `task_list` · `verify_queue` · `vars` · `recent_changes` · `notes`(solo count) · `resuming_from`(post-gap) · `execution_order` · gate-condizionati `focus_hint`/`reorganize_hint`/`current_aim_reminder`/`current_time` · `frame`(nested) · blocco SEPARATO finale `messages_with_user`.

**Cosa MANCA e converrebbe mostrare** (capacità/info che il modello HA o a cui ha accesso, ma non sono in context):
1. **✅ FATTO — Inventario SECRET (lane `<secrets>`)** (commit post-`fb6bb67`): lane compatta `<secrets>` nel `<context>` (nome + allowedSinks + flag, MAI valori — da `listSecretsMeta`, renderer puro in `context-assembler.mjs`, dati passati da `context-assembly.ts`). Condizionata (solo se ci sono secret, anti-bloat). **Chiude FIND-7** (il modello ri-chiamava `list_secrets` 6×). Test 36/0. **Residuo**: il ramo NESTED (`buildNestedWorkspace`) non la mostra ancora → TODO.
2. **Stato WORKSPACE / git** — branch corrente + file modificati/uncommitted (un coding-agent decide meglio sapendo cosa ha toccato). Non mostrato.
3. **Working set / file aperti-letti di recente** — quali file ho letto/aperto (open_file_view era previsto nel piano ma non confermato in context). Evita ri-letture.
4. **Indicatore di BUDGET/occupazione context** (% pieno) — `turn-trace` lo calcola ma non è mostrato al modello; mostrarlo abilita il self-tuning P3 (il modello sa quando comprimere/espandere). 
5. **Current sub-step** (P4 sopra) — distinto dall'aim.
6. **Affordance/capacità rilevanti al momento** — un reminder breve e CONDIZIONATO di "cosa puoi fare qui" (es. "un secret è bloccato → preview_secret_use/request_sink"); non l'elenco completo dei tool (quello è il system-prompt) ma i 2-3 affordance pertinenti allo stato corrente.
7. **Esito ultimo tool / ultimo errore** saliente (oltre a recent_changes) — l'ultimo error-memo rilevante inline quando pertinente (notes oggi mostra solo il count).

**Criterio** (anti-bloat): ogni nuova lane paga budget → si aggiunge SOLO se outcome-positiva e CONDIZIONATA alla rilevanza (gemello del principio notes/segnali-binari dello studio). Priorità: #1 (secrets, chiude FIND-7) → #4 (budget%, abilita P3) → #2/#3 (workspace/files) → #5/#6/#7.

## Architettura PUSH-bounded + PULL-on-demand (utente msg 735, 2026-06-30) — CONFERMATA e già in gran parte in piedi

Il modello regola la vista SEMPRE-ON entro bound (P3, **linea confermata**: solo zona volatile, mai il prefisso-stabile, conteggi non ordine, con BOUND per-sezione + budget). Per tutto ciò che sta **FUORI dai bound** usa **tool di PULL specifici** che ritornano SOLO ciò che serve, on-demand, senza gonfiare la vista sempre-on. Le due metà:
- **PUSH (lane bounded)** = la vista standing, cap auto-regolabili entro limiti → protegge cache + prior posizionale.
- **PULL (tool specifici)** = reach illimitato senza bloat. **GIÀ ESISTONO per ogni lane**: `get_shared_view` (vars), `get_changelog` (changes), `list_tasks` (tasks), `recall_lessons` (notes/memo), **`get_conversation`** (messaggi). E i **footer delle lane già puntano** al tool giusto ("(+N hidden — use list_tasks)", "use get_shared_view…").

**Gli esempi dell'utente sono GIÀ coperti**: `get_conversation(from_seq, to_seq)` fa SIA il **messaggio specifico** (`from_seq==to_seq`) SIA la **sliding-window** (`from_seq..to_seq`); senza range ritorna la finestra recente N (`conversation-capture.ts:106`). → **NON serve un nuovo tool `expand_message`** (sarebbe ridondante, anti-bloat): si RIUSA `get_conversation`.

**Gap reale residuo** (la sola cosa che manca per i messaggi, ridimensiona P1/P2): (a) **mostrare il `seq`-id di ogni messaggio nella lane** così il modello sa COSA chiedere a `get_conversation(from_seq=…)`; (b) **truncation-marker** che cita il seq → `…[troncato, +N — get_conversation(from_seq=ID)]`. Niente tool nuovo, solo rendere ancorabile il pull esistente. (Lega FIND-4/«verifica-non-indovinare»: il marker dà l'id esatto, il modello non tira a indovinare.)

## Classificazione F/S (regola #11)
- **F-harness**: gli id-stabili, i marker di troncamento, i tool `expand_message`/`set_view`/`set_step`, i BOUND (min/max/budget), il reset, l'isolamento prefisso-stabile-vs-coda. Deterministico.
- **S (modello)**: **QUANDO** espandere un messaggio / alzare-abbassare una sezione / aggiornare lo step — outcome-anchored (l'espansione ha aiutato il task reale?), con proporzionalità (no over-expand = anti-bloat, gemello del cry-wolf).

## Stato e prossimi passi
- `[voluto]` — analisi fissata qui (msg 726). **NON ancora costruito** (prima atterra la review-loop secrets in corso; e P3 ha la tensione prefisso-stabile da chiudere nel design). Candidato a un **design+review pass dedicato** (specializzato + agnostico) come il context-sizing.
- Testbook: ogni "voglio che il modello sappia regolare X" → entry in [[model-testbook]] a build-time.

## Link
- [[concepts/context-section-sizing-study]] (i cap per-sezione + i 4 bug) · [[concepts/context-limits-explained]] (§11 + effective-context) · [[concepts/window-aware-fetching]] (recupero item nascosti) · [[model-testbook]] TB-05/TB-10 · [[decisions/2026-06-29-context-as-first-person-mind]] · memory `feedback_context_window_sizing`.
