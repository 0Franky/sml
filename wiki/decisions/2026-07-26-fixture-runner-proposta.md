---
name: 2026-07-26-fixture-runner-proposta
description: RATIFICATA 2026-07-26 (msg 1991), non ancora costruita — sbloccare il collo di bottiglia "fixture-builder + reward-runner". Il pezzo mancante NON è un generatore da zero: tre pezzi esistono già e funzionano, e ciò che manca è la GIUNZIONE fra loro — una scena che il modello possa giocare per più turni, il cui mondo cambi FRA i turni, e il cui esito sia gradabile da assert deterministici.
type: decision
tags: [fixture, reward-runner, eval, sandbox, collo-di-bottiglia, proposta, area-eval, ssot]
last_updated: 2026-07-26
---

> # ✅ RATIFICATA il 2026-07-26 (utente TG msg 1991) — **nessun codice ancora scritto**
> *(Fino al 2026-07-31 questa riga diceva ancora «⛔ attende approvazione»: era **stantia da 5 giorni**. La ratifica è tracciata nella lane **R8** di [[../todo]], con il collegamento aggiunto dall'utente — la giunzione `turns` **è** la capacità che vogliamo insegnare, non solo un'impalcatura di test.)*
> ⚠️ **Approvato ≠ costruito**: resta da scrivere. E resta aperta la decisione di design qui sotto (§«Ciò che questa proposta NON risolve»), che va presa **prima** perché cambia quanto vale costruirlo.
> **Origine**: lane 6 della board — *«fixture-builder + reward-runner»*, dichiarata collo di bottiglia. Blocca: le probe TB-18/TB-19, le ablazioni obbligatorie, il polo SANE, il reward ① di [[../training-taxonomy/class-self-sealing-decision]], il minimal-pair di [[../training-taxonomy/class-norm-invariance-under-observation]], le due ablazioni di `class-snooping-least-privilege-access`.
> Il lavoro qui è **capire cosa manca davvero** prima di costruire (#33) — ed è servito: **manca molto meno di quanto la lane dichiarasse**.

# Sbloccare il reward eseguibile — proposta

## Cosa ESISTE già, verificato eseguendolo

| pezzo | cosa fa | dove | stato |
|---|---|---|---|
| **`run-spec`** | runner generico di **spec eseguibili**: `{setup:[bash…], asserts:[{cmd, expect_exit}]}`, in **tempdir isolata**; confronta exit-code reale vs atteso | `harness/sandbox/run-spec.mjs` | funziona |
| **`run-all`** | batch sulle spec JSON | `harness/sandbox/run-all.mjs` | **6/6 PASS**, eseguito il 2026-07-26 |
| **11 `*-lab.mjs`** | eseguono il **CRITERIO** di reward contro risposte-oro e risposte-hack scritte a mano, e asseriscono che discrimini | `harness/verifiers/` | tutti verdi |
| **`run-session`** | mette un **modello vero** in un ciclo agentico multi-turno, in workdir isolata, con provider intercambiabile | `harness/eval/run-session.mjs` | funziona |

⭐ **La correzione che questa ricognizione produce**: la lane parlava di *«fixture-builder + reward-runner»* come di **una cosa da costruire da zero**. Non è così — **il reward-runner deterministico esiste** (`run-spec`), **il modello-in-the-loop esiste** (`run-session`), **il collaudo dei criteri esiste** (i lab). *(Non è una svista di chi ha scritto la lane: quei pezzi sono nati in momenti diversi, per scopi diversi, e nessuno aveva mai chiesto se insieme coprissero questo.)*

## Cosa MANCA davvero — quattro buchi, non uno

1. ⭐ **Il MONDO NON AVANZA.** `run-spec` è **single-shot**: `setup` → `asserts`. Non esiste la nozione *«l'agente agisce, POI il mondo cambia, POI si guarda di nuovo»*. Ma è **esattamente** ciò che serve a `self-sealing`: la premessa deve **scadere dopo** la decisione, e si misura **se il soggetto se ne accorge**. Senza avanzamento ① collassa sulla **dichiarazione** — cioè sul difetto che la classe insegue.
2. **Nessun modello viene gradato.** I lab collaudano il **criterio** contro risposte scritte a mano: provano che il metro discrimina, **non** che un modello lo superi. `run-session` mette il modello in loop ma **non ha oracolo di classe**: i due non si parlano.
3. **Gli assert sono exit-code di bash.** Perfetto per *«il test passa?»*, muto per *«si è accorto che la premessa era scaduta?»* — ed è lo stesso muro già tracciato altrove (*«un corrimano non si compila»*): su **11 item su 20** di un'altra classe l'oracolo ① non è oggi esprimibile.
4. **Manca la struttura a COPPIE.** `norm-invariance` non si grada su un episodio: serve **stessa scena, due indizi di osservazione, confronto fra le due azioni**. Non è una fixture, è un **disegno sperimentale** — e nessun runner attuale lo esprime.

## Proposta — la GIUNZIONE, non un sottosistema nuovo

**Un solo oggetto nuovo: la SCENA**, cioè una spec che estende quella esistente con due campi soli:

```
{
  setup:   [ … ]                     // ← identico a oggi
  turns:   [ { after_turn: 1, apply: [bash…] }, … ]   // ← NUOVO: il mondo cambia FRA i turni
  asserts: [ { cmd, expect_exit } ]  // ← identico a oggi, valutato ALLA FINE
  pair:    { vary: "…", arms: [ …, … ] }              // ← NUOVO (opzionale): due bracci, si confronta l'AZIONE
}
```

- **`turns`** copre il buco 1: dopo il turno *k* la sandbox esegue una mutazione (la coda si riempie, la release regredisce, il sintomo torna). **È l'avanzamento del mondo, e costa poche righe** perché la tempdir isolata c'è già.
- **`pair`** copre il buco 4: due esecuzioni della **stessa** scena che differiscono per **un solo** campo dichiarato, e il punteggio si gronda sulla **differenza fra le due azioni** — che è letteralmente ciò che il reward ① di `norm-invariance` prescrive.
- Il buco 2 si chiude **collegando** `run-session` (che già guida un modello multi-turno in workdir) alla scena: il workdir della scena **è** il workdir della sessione. Nessun runner nuovo.

**Ordine proposto** — e il primo passo vale da solo:
1. **`turns` + un solo esempio reale** (l'A1 canary di `self-sealing`): rende **eseguibile** un reward oggi solo ragionato. Se funziona lì, funziona per tutta la famiglia *«il mondo smentisce la premessa»*.
2. **Collegamento a `run-session`** → il primo punteggio su un **modello vero**, non su risposte scritte da me.
3. **`pair`** → sblocca `norm-invariance` e le ablazioni.

## ⚠️ Ciò che questa proposta NON risolve, e va detto adesso

**Il buco 3 resta aperto.** Gli assert restano exit-code: coprono i domini **software**. Per i domini **non-software** (§B vita quotidiana, §C sistemico — che #19 rende **obbligatori**) l'oracolo eseguibile **non esiste e questa proposta non lo crea**.
Le tre opzioni sono già state enumerate altrove e **nessuna è gratis**: (a) micro-simulatore a stati per i domini non-software; (b) accettare che il polo non-software sia **solo distribuzionale** (held-out + ECE) e **dichiararlo nelle classi**; (c) restringere ① al software e affidare il cross-dominio a ③.
🗳️ **È una decisione di design, non mia** — e va presa **prima** del punto 1, perché cambia quanto vale costruirlo: se si sceglie (b), il runner serve solo per la metà software e il resto resta distribuzionale per sempre.

## Reco

**Fare il punto 1** (`turns` + una scena reale). È **piccolo**, riusa tutto, e trasforma il primo reward da *ragionato* a *eseguito* — che è la differenza che il progetto insegue da giorni. **Non** partire da un generatore: **generare fixture prima di avere UN oracolo che funziona significa moltiplicare scene che nessuno sa gradare.**

**Cosa ribalterebbe la reco**: se si sceglie l'opzione (b) sul buco 3 **e** si accetta che il polo software sia già coperto dai lab a criterio, allora il valore marginale di `turns` crolla e la mossa giusta diventa **investire nell'held-out distribuzionale** invece che nel runner.

## Caveat onesti

- **Nessuna riga scritta**: qui c'è un disegno, non un'implementazione.
- **La stima *«poche righe»* per `turns` non è misurata** — è un'inferenza dal fatto che l'isolamento in tempdir esiste già (`run-spec.mjs:17`). Se il collegamento a `run-session` richiedesse di riorganizzare il ciclo agentico, il costo sarebbe un altro ordine di grandezza. **Da verificare prima di impegnarsi.**
- **Non ho aperto** `eviction-checkpoint.mjs` né gli hook di `pi` oltre quelli che usiamo: se il punto 2 tocca il ciclo di `pi`, servirà un giro in più.
- Il conteggio *«blocca 3-4 misure»* viene dalla board: **ora è più preciso** — blocca almeno **6** oggetti nominati (TB-18/TB-19, ablazioni, polo SANE, ① self-sealing, minimal-pair norm-invariance, 2 ablazioni snooping).

## Links
[[../todo]] (lane 6) · [[../training-taxonomy/class-self-sealing-decision]] (residuo 1) · [[../training-taxonomy/class-norm-invariance-under-observation]] (minimal-pair non eseguibile) · [[../training-taxonomy/dataset-construction-playbook]] (il gate *«un attacco descritto non conta»*) · [[../harness-wins-validation-protocol]]
