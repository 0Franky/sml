---
name: harness-capabilities-as-files
description: Pattern "tutto è un file leggibile" — il modello scopre le capacità dell'harness via temp-read on-fly, estrae ciò che serve nelle note e chiude per recuperare contesto. Supporto multi-file concorrente in read temporanea.
type: concept
tags: [agent-skill, harness, context-management, temp-read, optimization, wrapper]
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

## Mappatura sul wrapper (pi)

Il pattern **non è ancora implementato** (wrapper pre-codice) ma è **requisito core di Fase 1**. `[EXTRACTED msg 162]` Si appoggia su primitive già progettate:

- **`stream_read` / `close_stream_file`** di [[wrapper-context-assembly-example]] (§7): lo stream-read porta porzioni inline in `<open_file_view>`, il `close_stream_file` le cancella TOTALMENTE → è **esattamente** la coppia open/close-to-reclaim. Generalizzazione qui: il *target* non è solo un file di codice ma **qualsiasi capacità** (config, doc, lista comandi harness).
- **lane note** di [[agent-wrapper-vars-queue]]: il distillato finisce in `block_notes`/`rules` (decision-cache), che sopravvivono al close del file.
- **read a char-range** di [[sliding-window-variable-tool]]: per estrarre solo lo slice rilevante della fonte, non l'intero blob — riduce ulteriormente il footprint dell'open.
- **Gap rispetto all'esistente** `[INFERRED]`: `close_stream_file(file)` oggi è single-file; il msg 162 richiede esplicitamente **multi-file temp-read concorrente** → serve un registry di handle aperti + chiusura selettiva/batch.

## Reward / hack-check

- **Skill** = aprire → estrarre → **chiudere** in modo efficiente, annotando solo il segnale utile. Candidato foglia di training. `[INFERRED]`
- **Hack #1 — non chiude**: tiene tutti i file aperti "per sicurezza" → vanifica il reclaim, gonfia il contesto. È l'anti-pattern che il pattern stesso vuole eliminare.
- **Hack #2 — annota rumore**: scrive note verbose/irrilevanti per "sembrare diligente" (over-noting → [[wrapper-context-assembly-example]] §7.2 critica 3).
- **Difesa** — misurare il **context-footprint effettivo** (quanti token restano aperti dopo lo step) **e l'utilità delle note** (le info annotate vengono *davvero usate* dopo?). Reward **ancorato all'outcome**: penalizza il footprint che ha causato un degrado/miss verificabile, non l'atto di aprire/annotare (anti participation-hack → `feedback_optimization_first`, [[wrapper-context-assembly-example]] §7.1). `[INFERRED]`

## Linked

- [[wrapper-context-assembly-example]] — primitive `stream_read`/`close_stream_file`, lane note, `ctx.getContext()`
- [[agent-wrapper-vars-queue]] — VARS registry + lane `block_notes`/`rules` dove vive il distillato
- [[sliding-window-variable-tool]] — read a char-range per estrarre solo lo slice rilevante
- [[explicit-attention-layer]] — cosa resta pinnato vs cosa è transitorio
- [[path-portability-awareness]] — `<ROOT_PROJ>` in config = istanza di "config-as-file" letta on-fly
- `feedback_optimization_first` — il pattern È optimization-first applicato al contesto

> Skill di training: **Area 4** (metacognition / context-management — decidere cosa aprire/chiudere) + **Area 8** (tool-use — discovery on-demand delle capacità harness). `[INFERRED]`
