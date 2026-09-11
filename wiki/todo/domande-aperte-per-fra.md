---
name: domande-aperte-per-fra
description: "🔴 REGISTRO delle domande aperte per Fra — si scrive QUI prima di mandarle su Telegram (regola sua, 2026-08-23: «segnare sempre le domande prima in locale sul file»). Ogni voce: contesto, fatto misurato, opzioni, reco. Quando risponde, la voce si chiude con la data e il numero del messaggio."
type: tracker
status: 🔴 aperto — 1 domanda aperta (D3), 4 chiuse, 1 segnalazione (2026-09-11)
tags: [tracker, decisioni, telegram, area-processo]
last_updated: 2026-09-11
---

# 🔴 Domande aperte per Fra

> Una domanda che vive solo in chat sparisce alla prima compaction, e con lei la risposta quando arriva
> (l'API di Telegram non espone la cronologia). Per questo si scrive **qui prima**, e il hook
> `domanda-prima-sul-file-poi-su-telegram` blocca l'invio se questo file non c'è.
>
> **Canale**: dal **TG msg 2159** (2026-09-11, *«aggiornami qui, non sono più al PC»*) gli aggiornamenti e le risposte vanno su Telegram, non nel terminale.

## Aperte

### D3 · `skills/remotion/SKILL.md` non versionato — aperta 2026-09-11 · Fra (TG msg 2163): *«che fa questa skill?»*

- **Contesto**: `check-install-drift` confronta `~/.claude` col bundle di core; è l'**unico** finding rimasto (`UNVERSIONED`).
- **Fatto misurato**: è una skill generica per **Remotion**, il framework React che genera **video programmatici** (composizioni, frame, `interpolate`/`spring`, render MP4/WebM per social, explainer, video da dati). 5 KB, un solo file, datato **2026-02-04**, **non citata** da nessun manifest, da `settings.json` né da alcun repo. Nessun progetto attuale (SLM, NetView, WillHouse) fa video.
- **Opzioni**: (a) **rimuoverla** (è una skill pubblica, si reinstalla in un minuto se mai servisse); (b) darle casa in `cc-wiki-core/claude/skills/` così viene rispecchiata ovunque; (c) dichiararla eccezione in `install-scope.json`.
- **Reco**: (a). Non l'ho fatto perché ha chiesto cosa fa, non di toglierla: una parola e sparisce.

## Chiuse

### D5 · L'annuncio su Fable e lo «steering vector» — ✅ risposto 2026-09-11 (TG msg 2160 domanda · 2163 link · risposta corretta su TG)

- **⚠️ Correzione**: la mia prima risposta (TG msg 2161) diceva *«annuncio non trovato»*. **Era una ricerca fallita, non una prova di assenza.** L'annuncio esiste.
- **Fatto verificato** (system card di Claude Fable 5 / Mythos 5, p. 13, citato verbatim dai post di Simon Willison del 10 e 11 giugno 2026 — il PDF da 319 pagine supera il limite del mio fetch): le richieste di *frontier LLM development* — *«building pretraining pipelines, distributed training infrastructure, or ML accelerator design»* — vengono limitate con *«prompt modification, steering vectors, or parameter-efficient fine-tuning (PEFT)»*; in origine *«these safeguards will not be visible to the user»*; portata stimata *«~0.03% of traffic, concentrated in fewer than 0.1% of organizations»*.
- **Il dietrofront (11 giugno 2026)**, Anthropic testuale: *«Starting this week, flagged requests will visibly fall back to Opus 4.8—the same as our safeguards for cyber and bio»* e *«that was the wrong tradeoff. You should have visibility into the safeguards we have in place, and why»*. Il filtro **resta**, ma **visibile**: una richiesta segnalata passa a Opus 4.8 e lo si vede; il motivo esposto anche via API.
- **Cosa significa per noi**: il perimetro colpito è il pretraining di frontiera, l'infrastruttura di training distribuito e il design di acceleratori. Il nostro lavoro — SLM da 27B su base open, SFT/LoRA/RL, harness, tassonomia, laboratori — **non è quello**, ma non posso garantire come classifica il filtro una singola richiesta. Il punto pratico: dopo l'11 giugno il modo in cui si rompe è **visibile** (fallback dichiarato a Opus 4.8), non uno steering silenzioso. Se compare un fallback durante il nostro lavoro, quello è il segnale — e la difesa resta la stessa: verifiche indipendenti dall'onestà del modello.
- **Su «meglio Opus 5?»**: le fonti descrivono la salvaguardia per Fable 5 (classe Mythos); **nessuna fonte** dice che Opus 5 ce l'abbia, e **nessuna** dice che non ce l'abbia. Non lo affermo.
- Fonti: https://simonwillison.net/2026/Jun/10/if-claude-fable-stops-helping-you/ · https://simonwillison.net/2026/Jun/11/anthropic-walks-back-policy/ · https://fortune.com/2026/06/10/anthropic-accu-claude-fable-5-limits-capabilities-ai-researchers-developers/ · system card (PDF): https://www-cdn.anthropic.com/d00db56fa754a1b115b6dd7cb2e3c342ee809620.pdf


### D1 · Allineare il submodule `WillHouse/wiki/_core` a `origin/main` — ✅ chiusa 2026-09-11, TG msg 2163 «1 Ok»

- **Fatto**: fast-forward `dfa22df → 558d140` (= `origin/main` del clone standard), nessun commit locale toccato. WillHouse ha ora il **puntatore del submodule modificato**, da committare lì quando vuole.

### D2 · La decisione `kubectl` di WillHouse nel vecchio file piatto — ✅ chiusa 2026-09-11, TG msg 2163 «2 sposta»

- **Fatto**: la voce `D-21t9lo0` è stata spostata in `~/.claude/state/progetti/WillHouse/decisioni-pendenti.jsonl`; il file piatto globale è **vuoto**. Ricomparirà a fine turno nelle sessioni WillHouse, dove appartiene.

### D4 · `AGENTS.md` non tracciato in slm (62 KB, «per Codex») — ✅ chiusa 2026-09-11, TG msg 2163 «se reputi sia meglio toglierlo fallo»

- **Fatto**: **tolta la copia**, non le istruzioni: `AGENTS.md` è ora **807 byte** che puntano a `CLAUDE.md` e a `wiki/GOAL.md` §2, con scritto perché è corto. Così Codex ha ancora un punto d'ingresso e non esiste un secondo libro di regole che possa divergere. Zero PII; committato nel repo pubblico. Se lo vuole via del tutto, è un `git rm`.

## Segnalazioni ricevute (non domande)

### S1 · «Il wrapper sui PC dev si riavvia all'auto-compact» — TG msg 2163, 2026-09-11

- **Cosa dice**: sulle macchine di sviluppo (nv-dev / wh-dev su Proxmox) il wrapper si **riavvia** quando scatta l'auto-compact. Segnalato da Fra, non osservato da me.
- **Dove appartiene**: al **compact-system** di core (`compact-watcher`, `ensure-compact-watcher`, `start-compact-watcher.sh`), non a SLM. È **coerente** con il finding C5 della revisione avversaria di oggi (il processo del watcher gira col file di quando è partito; `ensure-compact-watcher` tace se è già vivo) — ma il sintomo qui è un **riavvio**, non una copia stantia: potrebbe essere lo starter che riparte a ogni SessionStart post-compact. **Non verificato**: non ho accesso ai PC dev da questa sessione.
- **Da fare**: riprodurre su una macchina dev leggendo `~/.claude/compact-watcher.log` dopo un auto-compact; il fix, se c'è, va in core. Tracciato qui perché il numero di messaggio resti ritrovabile.
