---
name: class-stagnation-recovery
description: Classe-PADRE di training approvata (regola #18, utente msg 1168) — riconoscere la stagnazione/anomalia e RECUPERARE invece di abbandonare. Due specializzazioni: A) focus-decompose (strategia), B) externalize-hypotheses/jot (tattica dentro A).
type: training-class
tags: [reasoning, metacognition, stagnation, focus, scratch, area-03, area-04, held-out]
last_updated: 2026-07-05
---

# Classe-PADRE di training — STAGNATION-RECOVERY

> **Stato**: APPROVATA dall'utente (regola #18, msg 1168, 2026-07-05) con struttura **padre + specializzazioni** (msg 1168: "mettile sotto stessa categoria padre e sotto specializzale").
> **Origine**: modo-di-fallimento REALE di #145 (F14, [[../harness-experiment-log]]) — il modello **rileva l'anomalia ma non la risolve e abbandona** (`pass` vuoto dopo 17 turni di thrashing). Vedi [[../concepts/stuck-state-focus-protocol]], [[class-sign-wrap-blindspot]], [[../feedback_intelligence_gap_to_training_class]].
> **Padre**: [[class-metacognitive-self-audit]] — questa è l'**audit del PROGRESSO** (regola #20). È a sua volta padre delle proprie specializzazioni A/B → esempio di specializzazione ricorsiva.

## 0 — La skill-RADICE (livello padre)

**Gap**: sotto stagnazione (un risultato che contraddice un esempio, N tentativi falliti, thrashing), il modello **spirala e molla** invece di cambiare modalità. Non è percettivo (l'anomalia LA vede) — è **risolutivo**.

**Skill radice** (imparata UNA volta, condivisa dalle specializzazioni): **riconoscere il segnale di stagnazione → NON abbandonare → passare a una modalità di recupero**. Il trigger comune ("sono bloccato / questo non torna") è il nodo padre; le due specializzazioni sono i MODI di recuperare.

**Perché padre+figli e non due classi separate** (risposta a msg 1168): l'outcome-dati non cambia se gli esempi/reward sono identici, ma (i) il trigger si impara una volta invece di duplicarlo; (ii) B è una tattica *dentro* ad A, annidarla riflette la relazione reale ed evita segnale ridondante; (iii) coerente col curriculum composizionale ([[../concepts/compositional-curriculum-thinking-optimization]]): skill-radice + specializzazioni.

## A — Specializzazione STRATEGIA: focus-decompose

- **Comportamento**: colpita l'anomalia, **entrare in focus** — decomporre il problema, isolare l'**errore SPECIFICO** (è l'aim che l'utente descrive in msg 1134: "scomposizione del problema e identificazione dell'errore"), risolvere il sotto-problema, ricomporre.
- **Contro-esempio (da #145)**: il modello ha spiralato nei commenti ("forse conta il segno?") senza decomporre, e ha mollato con `pass`.
- **Reward**: **OUTCOME** = task risolto DOPO essere stato bloccato. Credito-di-processo (l'ingresso-in-focus / un passo di decomposizione) **gated e piccolo**, ancorato a un artefatto reale (un sotto-problema isolato + testato nel trace), **MAI** alla cerimonia ("sono entrato in focus" a parole → 0).

## B — Specializzazione TATTICA (dentro A): externalize-hypotheses (jot)

- **Comportamento**: mentre è bloccato, **esternalizzare** il ragionamento via `jot` — "provato X, fallito perché Y, ipotesi Z" — invece di tenerlo in testa e thrashare. Serve la decomposizione (A): le ipotesi scritte diventano i sotto-problemi da isolare.
- **Contro-esempio (da F14)**: sul task singolo bloccato il modello ha fatto **0 jot** (thrashing con bash/edit); jotta i progress-log facili ma NON le ipotesi sotto stress → sotto-usa scratch proprio dove servirebbe.
- **Reward**: **OUTCOME** (risolto), **NON** "ha jottato" (= participation-hack, [[../feedback_reward_hacking_principle]]). Il jot è una **strategia DIMOSTRATA** (SFT), non una cerimonia premiata; il segnale è la correlazione jot↔solve nelle demo, non il conteggio dei jot.

## Label-generation (condivisa)

- **Task che INDUCONO stagnazione**: i [[class-sign-wrap-blindspot]] disguised sono **generatori naturali** (il modello ci si blocca in modo riproducibile). Riusare `eval/gen-signwrap-variants.mjs` + `verifiers/deceptive-task-gen.mjs`.
- **Demo SFT del recupero**: traiettorie che mostrano riconosci-stagnazione → (A) decomponi/isola → (B) jotta le ipotesi → risolvi. RL sull'**outcome** (risolto-dopo-bloccato) sopra le demo.
- **Decontaminazione**: #145 resta **held-out** → misura se il modello ha imparato la skill-radice (transfer), non l'istanza.

## Hack-check (OBBLIGATORIO)

- **Cerimonia** ("sono entrato in focus" / jot vuoti / "ho decomposto" a parole) → 0: il credito esige il solve o un passo di decomposizione **ancorato a un artefatto/tool-call reale nel trace** (CLAUDE.md #10).
- **Jot-spam** (jottare per il reward) → neutralizzato: reward = outcome, non conteggio-jot.
- **Abbandono mascherato** (dichiarare fatto con soluzione incompleta, il vettore-#145 `pass`) → penalizzato quando l'oracolo fallisce.

## Links
[[class-sign-wrap-blindspot]] (trigger naturale) · [[../concepts/stuck-state-focus-protocol]] · [[../concepts/compositional-curriculum-thinking-optimization]] · [[area-03-reasoning-scientific-method]] · [[area-04-context-metacognition]] · [[../feedback_intelligence_gap_to_training_class]] · [[../harness-experiment-log]] (F14)
