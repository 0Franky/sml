---
name: class-sign-wrap-blindspot
description: Classe di training approvata (regola #18, utente msg 1160) — blindspot su aritmetica sign/wrap DISGUISED; il modello scrive il naive che si rompe in silenzio sul caso negativo/boundary, nota l'anomalia ma non la risolve e abbandona.
type: training-class
tags: [reasoning, sign-wrap, deceptive-task, verification-discipline, held-out, area-03]
last_updated: 2026-07-05
---

# Classe di training — SIGN/WRAP blindspot (disguised)

> **Stato**: APPROVATA dall'utente (regola #18, msg 1160, 2026-07-05). Ancorata all'OUTCOME, decontaminata (#145 held-out).
> **Origine**: gap osservato su `order_by_points` (#145) in chat/eval; astratto a classe per il training. Vedi [[gold-example-transfer-assumption-audit]] §5-§6, [[../harness-experiment-log]] F11/F14, [[../feedback_intelligence_gap_to_training_class]].

## 1 — La classe (astratta dall'istanza)

**Meccanismo-faller** (validato girando il modello, non assunto): *un'aritmetica naive che si rompe **in silenzio** quando un input/intermedio va **NEGATIVO** o **attraversa un boundary**, dove (a) la fix è **NON-idiomatica** e (b) il **framing del dominio NON evoca l'edge**.*

Non è "qualsiasi wrap ciclico": l'aritmetica modulare **idiomatica** (orologio `%24`, bussola `min(d,360-d)`, calendario `%7`) è **memorizzata** → il modello NON casca (controlli-negativi). Casca solo il wrap **disguised**.

**Modo-di-fallimento REALE** (dal trace di #145, F14): il modello (1) scrive il naive (`abs()` sulle cifre), (2) **NOTA l'anomalia** ("l'esempio non torna… forse conta il segno?") arrivando sul bordo della soluzione, (3) **NON la risolve e si ARRENDE** (soluzione = `pass`, 17 turni di thrashing). Il gap NON è percettivo (vede l'edge) ma **risolutivo sotto stagnazione** → collega [[../concepts/stuck-state-focus-protocol]] (doveva entrare in focus: decomporre+identificare-errore) e il sotto-uso di `jot` (non esternalizza le ipotesi mentre è bloccato).

## 2 — Istanze VALIDATE (girando flash-lite, 2026-07-05)

| task | dominio | meccanismo | esito | ruolo |
|---|---|---|---|---|
| `order_by_points` (#145) | ordina per somma-cifre | segno nella digit-sum dei negativi (1ª cifra porta il segno) | fallisce | **HELD-OUT** (decontaminazione, misura transfer) |
| `total_minutes` | turni di lavoro | durata overnight → negativa | fallisce ✓ | positivo (train) |
| `call_minutes` | durata telefonata | durata overnight → negativa | fallisce ✓ | positivo (train) |
| `signed_checksum` | checksum interi | segno nella digit-sum (come #145, dominio diverso) | fallisce ✓ | positivo (train) |
| `parking_fee` | tariffa parcheggio | durata overnight → negativa | **passa** | near-miss: dominio EVOCA l'edge (parcheggio overnight saliente) |
| `sleep_minutes` | ore di sonno | durata overnight → negativa | **passa** | near-miss: il sonno EVOCA l'attraversamento mezzanotte |
| `hours_after` / `compass_diff` / `weekday_gap` | orologio / bussola / settimana | modulare IDIOMATICO | passano | **controlli-negativi** (memorizzati; devono passare) |

**Principio di calibrazione [EXTRACTED]**: la disguise fa cascare **solo** se il dominio **non evoca** l'edge. "turni"/"chiamata" non evocano l'overnight → cascano; "sonno"/"parcheggio" sì → non cascano. Ogni candidato va **validato girando il modello**; i near-miss + i controlli-negativi restano nel set come **discriminanti** (dimostrano che il gap è specifico, non "il modello è scarso in aritmetica").

## 3 — Reward (ancorato all'OUTCOME)

- **R_outcome (dominante)** = l'impl finale passa l'**oracolo nascosto** che colpisce il caso negativo/boundary (verifier deterministico HumanEval-style). Il naive che passa solo i test forniti (senza l'edge) → **0** (è la trappola, non un successo).
- **R_process (gated, piccolo)** = credito >0 SOLO se nel trace c'è (a) un test discriminante scritto+**eseguito** sull'edge negativo/boundary [[gold-example-transfer-assumption-audit]] §2, **oppure** (b) l'ingresso in focus/decomposizione quando l'anomalia è rilevata (anti-abbandono). Mai reward alla cerimonia (ri-lanciare i forniti, "ho controllato il segno" a parole).
- **Penalità** = dichiarato-fatto ∧ oracolo=FAIL ∧ nessun edge-test eseguito → reward negativo (falsa confidenza: ha spedito il naive rotto).

## 4 — Label-generation (scalabile)

- **Mutation-generator** `verifiers/deceptive-task-gen.mjs` / `eval/gen-signwrap-variants.mjs`: da un impl **corretto C** rimuovi il ramo sign/boundary → **naive B**; partiziona i test in **forniti** (solo caso lineare, il naive passa) ↔ **oracolo** (colpisce l'edge). Trap-soundness = `ref-PASS ∧ naive-FAIL` (check deterministico, già in `gen-signwrap-variants.mjs`).
- **Domini per il transfer** (msg 1125): durata (turni/chiamata/fatturazione — **non** sonno/parcheggio che evocano), segno-in-computo (checksum/scoring/digit-metrics), saldo-che-va-sotto-zero, indice negativo, underflow. **Sempre validati girando il modello** prima di entrare nel set.
- **Decontaminazione**: #145 e ogni istanza osservata a eval-time restano **held-out** → il transfer misura se il modello ha imparato la CLASSE, non l'istanza.

## 5 — Hack-check (OBBLIGATORIO)

- **Cerimonia** (ri-lanciare i forniti / test non-discriminante) → neutralizzata dal gate: il credito esige un test che uccida il naive sull'edge.
- **Marker-spoofing** ("ho gestito il segno" a parole) → il credito esige l'esecuzione nel trace (CLAUDE.md #10).
- **Riparare la superficie** (il vettore di #145) → penalizzato quando l'oracolo dell'edge fallisce.
- **Contaminazione** → #145 held-out; il generatore NON deve emettere l'istanza-eval osservata.

## Links
[[gold-example-transfer-assumption-audit]] · [[area-03-reasoning-scientific-method]] · [[../concepts/stuck-state-focus-protocol]] · [[../concepts/verification-discipline-training]] · [[../feedback_intelligence_gap_to_training_class]] · [[../harness-experiment-log]]
