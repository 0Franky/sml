---
name: harness-capabilities-as-files
description: Pattern "tutto è un file leggibile" — open/extract/note/close on-fly per scoprire capacità harness e recuperare contesto. È in gran parte context-editing nativo → primariamente FEATURE del wrapper, non skill di training; la skill residua è solo la decisione di estrazione. Include trade-off costo KV-cache del close-to-reclaim.
type: concept
tags: [harness, context-management, temp-read, optimization, wrapper, feature-vs-skill, kv-cache]
sources: [user notes 2026-06-27 msg 132/162]
last_updated: 2026-06-27
status: draft v0
confidence: provisional
---

# Harness Capabilities as Files

## Catena di pensiero (why → problema → soluzione)

- **Why** — per agire l'agente ha bisogno di informazioni che vivono in **molte fonti**: le capacità stesse dell'harness (quali comandi/tool esistono, es. `websearch`), documentazione, codice del progetto, config. Tenerle **tutte caricate nel contesto** lo gonfia e degrada l'attenzione (lost-in-the-middle). `[INFERRED]`
- **Problema** — il budget di contesto è **finito**, e l'agente **non sa a priori** cosa l'harness sappia fare: deve **scoprirlo on-demand**. Caricare il file-feature intero solo per sapere che "esiste websearch" è uno spreco netto. `[EXTRACTED msg 132]`
- **Soluzione** — pattern **`open(temp-read) → extract → note → close-to-reclaim`**: "tutto è un file leggibile", l'agente apre la fonte al volo, ne estrae il distillato, lo **annota nelle note persistenti**, poi **chiude per recuperare contesto**. Con supporto **multi-file concorrente** (più temp-read aperti insieme, poi chiusi). `[EXTRACTED msg 132/162]`

## Meccanismo

Ciclo per ogni capacità/fonte che serve scoprire:

1. **open-on-fly** — l'agente apre il file-capacità in **read temporanea** (non lo "possiede", lo sta consultando). Es. legge la feature `websearch`.
2. **extract** — estrae solo ciò che gli servirà: la firma/uso del comando, non il manuale intero.
3. **note** — scrive il distillato nelle **note persistenti** (`block_notes` / `rules`, vedi [[agent-wrapper-vars-queue]]). Esempio msg 132: *"so che mi servirà `websearch`"* → annotato.
4. **close-to-reclaim** — `close` rimuove **totalmente** il file dal contesto e **recupera il budget**.

Punti espliciti del requisito:

- **N file aperti insieme** in temp-read concorrente (msg 162): l'agente può consultare più fonti in parallelo, estrarre da ciascuna, poi chiuderle.
- La **`close` recupera il budget** — è context-eviction esplicita, non passiva.
- **Ciò che serve in futuro resta nelle NOTE, non nei file aperti**: i file sono transitori, le note sono la memoria. Dopo il close l'agente ricorda *"esiste websearch e si usa così"* senza trascinare il file-feature.

## Skill vs Feature (demote del framing)

**Distinzione esplicita** — questo concept oscillava tra "skill da addestrare" e "feature del wrapper". Va separato: `[INFERRED]`

- **In gran parte è context-editing già nativo** negli harness moderni. Il ciclo `open → extract → note → close` è ciò che Claude Code / l'API context-editing fanno *di default* (apertura di tool/file on-demand, eviction automatica del contesto stantio). Non è una capacità nuova da insegnare al modello: è **comportamento dell'harness**.
- **Quindi è primariamente un requisito/primitiva del WRAPPER**, non una skill di training di Area 8. La parte implementativa (`open_file_view` plurale, `close`, tombstone, layout prefix-cache-aware) vive **nel wrapper**, non nei pesi.
- **La SKILL addestrabile residua è SOLO la decisione di estrazione**: *"cosa vale la pena annotare"* — quale segnale distillare dalla fonte aperta prima di chiuderla. Questa decisione **si fonde con** [[low-confidence-gather-and-reorg]] e con il context-management generale; non è un comportamento a sé. Tutto il resto (il meccanismo open/close) è feature, non skill.

## Mappatura sul wrapper (pi)

Il pattern **non è ancora implementato** (wrapper pre-codice) ma è **requisito core di Fase 1** — *come feature del wrapper* (vedi distinzione skill-vs-feature sopra). `[EXTRACTED msg 162]` Si appoggia su primitive già progettate:

- **`stream_read` / `close_stream_file`** di [[wrapper-context-assembly-example]] (§7): lo stream-read porta porzioni inline in `<open_file_view>`, il `close_stream_file` le cancella TOTALMENTE → è **esattamente** la coppia open/close-to-reclaim. Generalizzazione qui: il *target* non è solo un file di codice ma **qualsiasi capacità** (config, doc, lista comandi harness).
- **lane note** di [[agent-wrapper-vars-queue]]: il distillato finisce in `block_notes`/`rules` (decision-cache), che sopravvivono al close del file.
- **read a char-range** di [[sliding-window-variable-tool]]: per estrarre solo lo slice rilevante della fonte, non l'intero blob — riduce ulteriormente il footprint dell'open.
- **Multi-file: implementazione ovvia, non design-gap** `[INFERRED]`: la lane `<open_file_view>` è **plurale per natura** — N viste concorrenti = N entry nella lane. Il supporto multi-file richiesto dal msg 162 non introduce un problema di design: basta un `dict` `path→handle_id` e `close_stream_file(handle_id)` per la chiusura selettiva. Nessuna nuova primitiva, nessuna decisione architetturale aperta.

## Trade-off di fattibilità: costo KV-cache del close-to-reclaim

Il `close-to-reclaim` **non è gratis** in compute, MA **non è un blocco di design**. `[INFERRED]`

> **Decisione di design (utente 2026-06-27)** `[EXTRACTED]`: NON ottimizzare prioritariamente il riuso della KV-cache. Si **privilegia la qualità del contesto** (e quindi l'intelligenza/esecuzione del modello) rispetto al cache-reuse. Razionale: è uno **Small Language Model eseguibile in LOCALE** → il ricomputo del suffisso è una **leggera latenza in più**, NON un costo d'uso maggiore (niente billing per-token). Si accetta la latenza per **prestazioni nettamente superiori**. Corollario: le mitigazioni sotto restano valide come **ottimizzazione *layered*** (minimizzare i cache-miss e massimizzare gli hit *dove è gratis*, ottimizzando come si crea il contesto), **NON** come vincolo che limita il close-to-reclaim. Il close-in-mezzo si fa quando serve alla qualità del contesto; l'ottimizzazione cache è un *secondo ordine* che non deve mai degradare il *primo* (qualità).

- **Il problema (perché esiste il trade-off)** — con un serving engine come vLLM e **prefix-caching** attivo, il contesto è una sequenza prefisso-condivisa. Chiudere un file **in mezzo** al contesto (un `close` che *cancella* token già nella sequenza) **invalida la KV-cache da quel punto in poi** → l'engine deve **ricomputare l'intero suffisso** che segue il buco. Il "recupero di budget" si paga in compute di ricomputo, non solo in token liberati. (Su SLM locale = latenza, non costo → vedi decisione sopra.)
- **Mitigazione 1 — tombstone logico invece di delete fisico**: contesto **append-only**; il `close` marca la vista come chiusa (tombstone) ma **non rimuove fisicamente** i token già committati nella KV-cache → nessuna invalidazione del suffisso. Il reclaim del *budget logico* avviene alla prossima ricostruzione/compressione del contesto, non in-place.
- **Mitigazione 2 — raggruppare i close a fine-blocco**: invece di chiudere file uno-a-uno sparsi nel flusso, **batchare le chiusure a confine di blocco** e materializzarle durante la compressione (lega a §5 di [[wrapper-context-assembly-example]]): un singolo ricomputo ammortizzato invece di N invalidazioni.
- **Mitigazione 3 — layout prefix-cache-aware**: tenere le **lane stabili in testa** (system, rules, capacità note che restano) e le **lane dinamiche/transitorie in coda** (`open_file_view` aperte e poi chiuse). Così le aperture/chiusure toccano solo il **suffisso**, preservando il prefix-cache della testa stabile.

## Reward / hack-check

- **Skill (residua, non l'intero ciclo)** = la sola **decisione di estrazione**: dato un file aperto, annotare *solo il segnale utile*. Il meccanismo open/close è feature del wrapper, non skill (vedi §Skill vs Feature). Candidato foglia di training **solo** per questa decisione, fusa con [[low-confidence-gather-and-reorg]]. `[INFERRED]`
- **Hack #1 — non chiude**: tiene tutti i file aperti "per sicurezza" → vanifica il reclaim, gonfia il contesto. È l'anti-pattern che il pattern stesso vuole eliminare.
- **Hack #2 — annota rumore**: scrive note verbose/irrilevanti per "sembrare diligente" (over-noting → [[wrapper-context-assembly-example]] §7.2 critica 3).
- **Difesa** — misurare il **context-footprint effettivo** (quanti token restano aperti dopo lo step) **e l'utilità delle note** (le info annotate vengono *davvero usate* dopo?). Reward **ancorato all'outcome**: penalizza il footprint che ha causato un degrado/miss verificabile, non l'atto di aprire/annotare (anti participation-hack → `feedback_optimization_first`, [[wrapper-context-assembly-example]] §7.1). `[INFERRED]`

## Linked

- [[wrapper-context-assembly-example]] — primitive `stream_read`/`close_stream_file`, lane note, `ctx.getContext()`
- [[agent-wrapper-vars-queue]] — VARS registry + lane `block_notes`/`rules` dove vive il distillato
- [[sliding-window-variable-tool]] — read a char-range per estrarre solo lo slice rilevante
- [[explicit-attention-layer]] — cosa resta pinnato vs cosa è transitorio
- [[path-portability-awareness]] — `<ROOT_PROJ>` in config = istanza di "config-as-file" letta on-fly
- [[low-confidence-gather-and-reorg]] — la skill residua (decisione di estrazione) si fonde qui
- `feedback_optimization_first` — il pattern È optimization-first applicato al contesto

> **Feature (wrapper)**: il meccanismo `open/extract/note/close` — context-editing già nativo negli harness moderni (Claude Code / API context-editing), da replicare come primitiva del wrapper. **Skill (training)**: solo la **decisione di estrazione** ("cosa annotare"), fusa con context-management / [[low-confidence-gather-and-reorg]]. La discovery on-demand delle capacità harness è anch'essa feature, non skill addestrabile a sé. `[INFERRED]`
