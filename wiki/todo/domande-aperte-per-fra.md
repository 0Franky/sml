---
name: domande-aperte-per-fra
description: "🔴 REGISTRO delle domande aperte per Fra — si scrive QUI prima di mandarle su Telegram (regola sua, 2026-08-23: «segnare sempre le domande prima in locale sul file»). Ogni voce: contesto, fatto misurato, opzioni, reco. Quando risponde, la voce si chiude con la data e il numero del messaggio."
type: tracker
status: 🟡 1 aperta (D7) — 6 chiuse, 1 segnalazione (2026-09-11)
tags: [tracker, decisioni, telegram, area-processo]
last_updated: 2026-09-11
---

# 🟡 Domande aperte per Fra — 1 aperta al 2026-09-11 (D7)

> Una domanda che vive solo in chat sparisce alla prima compaction, e con lei la risposta quando arriva
> (l'API di Telegram non espone la cronologia). Per questo si scrive **qui prima**, e il hook
> `domanda-prima-sul-file-poi-su-telegram` blocca l'invio se questo file non c'è.
>
> **Canale**: dal **TG msg 2159** (2026-09-11, *«aggiornami qui, non sono più al PC»*) gli aggiornamenti e le risposte vanno su Telegram, non nel terminale.

## Aperte

### D7 · Idea 11 del batch 2026-09-11 — «capire come fare transfer learning su altri campi»: quale delle tre letture? — aperta 2026-09-11 (TG msg 2153)

- **Contesto**: la riga è una sola e ammette tre letture: (a) transfer **degli esempi** cross-dominio nel dataset → già regola #19, in vigore su ogni classe; (b) transfer learning **in senso ML** — riusare pesi/LoRA del Tier 1 su altri verticali → è la three-tier stessa (LoRA verticali); (c) una **skill del modello**: portare attivamente una lezione da un campo a un altro (trasferimento analogico) — in tassonomia c'è il guardiano (`training-taxonomy/gold-example-transfer-assumption-audit`: *quando trasferisci, audita i presupposti*) ma non la mossa.
- **Fatto misurato**: grep «analogi» in `wiki/training-taxonomy` → solo occorrenze incidentali (esempi «ereditati per analogia»), nessuna classe.
- **Reco**: se (c), è un gap probabile e va gap-scannato contro `class-metacognitive-self-audit` e `class-consequence-intention-conflict` prima di scrivere; se (a) o (b), nulla da fare.
- 👉 **Domanda**: intendevi (a), (b) o (c)?

## Chiuse

### D6 · Prossimi passi — aperta con TG msg 2166 («quindi i prossimi passi quali sono? come procediamo?») · ✅ chiusa 2026-09-11, TG msg 2169 «Confermo ordine a b c poi discutiamo sul base model appena ci arrivi»

- **Deciso**: (a) triage delle 11 idee → (b) classe «confini di modulo» dall'idea 12 → (c) fixture + scorer per le classi ratificate, in autonomia e in quest'ordine. Il binario empirico (d) **si apre con la discussione sul base model quando (c) è avviato** — non prima. Nel frattempo niente spesa.
- **Compaction**: con TG msg 2170 (*«se vuoi compact te lo faccio ora»*) Fra ha offerto il `/compact` manuale — accettato (TG msg 2172) a stato tutto persistito; il watcher automatico su questa macchina non è attivo.
- **Stato all'atto della chiusura**: (a) avviato, tre verdetti su undici (5 = innesco che manca · 4 = nuova, padre deciso · 9 = nuova probabile); prossima l'idea 3, poi la 8.


### D3 · `skills/remotion/SKILL.md` non versionato — ✅ chiusa 2026-09-11, TG msg 2165 «3 togli skill»

- **Fatto**: rimossa `~/.claude/skills/remotion/` (era l'unica copia: skill generica per video programmatici con React, 5 KB, 2026-02-04, non citata da nessun manifest né progetto). Copia di sicurezza in `~/.claude/backups/removed-skills-2026-09-11/remotion/`. Dopo la rimozione `check-install-drift` non ha più alcun finding: bundle, copia viva e origin coincidono.


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
