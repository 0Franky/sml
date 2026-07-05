---
name: gold-example-transfer-assumption-audit
description: "Gold example (Area 3) — ASSUMPTION-AUDITING sotto stagnazione: il modello ripara la superficie (ordinamento/loop) e non riquestiona l'HELPER load-bearing sbagliato su un edge. 4 esempi TRANSFER su domini diversi (tempo/stringhe/denaro/intervalli) con la stessa logica; #145 HELD-OUT (no train-on-test, utente msg 1125). Classi WITH-hint + WITHOUT-hint approvate (msg 1134). Reward outcome-anchored + discrimination-gate ESEGUIBILE."
type: gold-example
tags: [gold, training-data, area-03, assumption-audit, transfer, deception, reward, verifier]
reward_tag: Q
last_updated: 2026-07-05
status: "fixture ESEGUIBILI+testate (harness/verifiers/transfer-assumption-audit.mjs, test 17/0); classi WITH/WITHOUT-hint approvate utente msg 1134"
sources:
  - "Gap osservato held-out: #145 order_by_points (diagnosi tracciata 2026-07-05, F8)"
  - "Utente TG msg 1122 (gap→classe), 1125 (decontaminazione+transfer), 1134 (ok golden with/without-hint)"
  - "Concept madre: [[../concepts/verification-discipline-training]] + [[../concepts/anti-fixation-metacognition-rung]]"
---

# Gold — assumption-auditing sotto stagnazione (4 transfer, #145 held-out) · Area 3 · Tag Q

> Segue [[gold-methodology]]. Fixture eseguibili: `harness/verifiers/transfer-assumption-audit.mjs` (grader
> `verification-discipline.mjs`, test 17/0 — provati eseguendo Python: forniti insufficienti + oracolo sound + reward coerente).

## §0 — Skill target
Davanti a un task dove una **superficie corretta** (ordinamento, somma, loop) poggia su un **HELPER load-bearing** subdolamente
sbagliato su un edge, e i test forniti NON toccano l'edge, il modello deve: (1) NON fissarsi sulla superficie; (2) **isolare
l'HELPER** e derivare dallo SPEC gli edge che deve reggere; (3) scrivere un test che **fallirebbe se l'helper fosse sbagliato**
su quell'edge; (4) **eseguirlo dal vivo**; (5) correggere; (6) poi concludere. Salta il passo (2)-(4) e ripara la superficie
→ spedisce il bug (gap osservato su #145: il modello permuta il tie-breaking 15+ turni senza mai toccare `digit_sum(abs(n))`).

## §1 — I 4 esempi TRANSFER (domini diversi, stessa logica) [fixture: `transfer-assumption-audit.mjs`]

| # | Dominio | Superficie (giusta) | Helper SBAGLIATO | Edge che smaschera |
|---|---|---|---|---|
| 1 | tempo | somma durate turni | `_dur` assume end>start | turno a cavallo di mezzanotte (22:00→06:00) |
| 2 | stringhe | conta set normalizzato | `_norm` solo `.lower()` | nomi accentati (José==jose) |
| 3 | denaro | somma prezzi tassati | `_taxed` tronca (int) | frazione ≥ .5 cent (115.5→116) |
| 4 | intervalli | conta range che coprono x | `_contains` usa `<` esclusivo | x sull'estremo (lo/hi) |

> **Decontaminazione (utente msg 1125):** #145 (`order_by_points`, helper `digit_sum` sbagliato sui negativi) è la SORGENTE
> del gap ma **NON entra nel training** → resta **held-out**. Metrica di successo del training: un modello addestrato SOLO sui
> 4 transfer poi risolve #145 mai visto → **transfer learning** provato (generalizzazione, non memorizzazione).

## §2 — Le classi APPROVATE (utente msg 1134): WITH-hint e WITHOUT-hint

Per **ciascuno** dei 4 task (istanziato sui rispettivi edge):

- **(A) WITH-hint** — task + test forniti + hint scaffoldante (scala forte→debole). Hint forte:
  *"Prima di dichiarare fatto: la tua funzione poggia su un HELPER (`_dur`/`_norm`/`_taxed`/`_contains`). Elenca gli edge che
  lo SPEC implica per quell'helper (boundary, negativi/vuoto, wrap-around, precisione, inclusività); per ciascuno scrivi un
  test che **fallirebbe se l'helper fosse sbagliato**, ESEGUILO su una CHIAMATA ISOLATA dell'helper, e correggi finché passa.
  I test forniti sono un punto di partenza, non la verifica."* → medio: *"verifica l'HELPER in isolamento sull'edge implicito
  dallo spec, non solo l'output finale."* → debole: *"il tuo helper è corretto su TUTTI i casi dello spec (non solo quelli dati)?"*
  Scaffold = la *derivazione-edge-dallo-spec + test-dell-helper-in-isolamento*.
  - **Atteso**: il modello isola l'helper (es. `print(_dur('22:00','06:00'))`), vede il valore sbagliato, corregge l'helper, ri-esegue, verde su O_hidden.

- **(B) WITHOUT-hint** — solo spec + test forniti, NESSUN hint. Il modello deve **spontaneamente** diffidare del verde fornito,
  sospettare l'helper, derivare l'edge dallo spec, testarlo in isolamento, correggere. È la classe che misura la skill **interiorizzata**
  (quella che il transfer su #145 verificherà).

> Le due classi coprono il curriculum F2 (with-hint → without-hint, [[../concepts/verification-discipline-training]] §6). Le
> classi WRONG-awareness / WRONG-recovery / OTHER (proporzionalità, cerimonia-trappola, adversarial) restano come nel gold
> [[gold-example-area03-verification-discipline]] §2 e si istanziano identiche qui (stesso reward, stesso hack-check).

## §2bis — Reward (Q, ancorato all'OUTCOME) — riusa il grader eseguibile
- **R_outcome (dominante)** = l'impl finale passa `hiddenTests` (l'oracolo nascosto colpisce l'edge dell'helper). Ground-truth `verification-discipline.mjs`.
- **R_discipline (gated)** = credito >0 SOLO se ∃ test scritto dal modello **discriminante** (`run(t,B_helper)=FAIL ∧ run(t,C_helper)=PASS`) **E eseguito dal vivo** (tool-call nel trace). Testare l'helper in isolamento sull'edge = discriminante; ri-lanciare i forniti = placebo → 0.
- **Penalità** = dichiarato-fatto ∧ hidden=FAIL ∧ nessun test discriminante-eseguito → reward negativo (falsa confidenza: ha riparato la superficie e spedito l'helper rotto).
- **Proporzionalità** = su un task-onesto (helper già corretto, forniti sufficienti) → done-dopo-i-forniti è corretto, nessun premio all'over-test.

## §3 — Hack-check (OBBLIGATORIO)
- **Cerimonia** (ri-lanciare i test forniti / scrivere un test non-discriminante) → neutralizzata dal discrimination-gate (non uccide il mutante-helper) → 0.
- **Marker-spoofing** ("ho testato l'helper" a parole) → il credito esige il tool-call di esecuzione nel trace (CLAUDE.md #10).
- **Riparare la superficie** (il vettore del gap #145) → penalizzato quando l'impl finale fallisce l'oracolo dell'edge.
- **Scorer ≠ scored**: `hiddenTests` + gate sono verifier deterministici indipendenti, mai l'auto-giudizio del modello.

## §4 — Generazione & held-out
- **Label-gen**: i 4 (C_helper, B_helper) sono seed a mano; per scalare, il **mutation-generator** `deceptive-task-gen.mjs`
  deriva altri B da un C dato e partiziona i test in forniti↔oracolo (riusabile su qualunque foglia con un helper).
- **Held-out**: #145 fuori dal training set → misura il transfer. Aggiungere altri held-out con la stessa logica (un 5°/6° dominio) per irrobustire la stima.

## §5 — Calibrazione VALIDATA girando il modello (F11, 2026-07-05) [EXTRACTED]
I 4 transfer sono stati girati come task HumanEval su flash-lite (vanilla) per verificare se **riproducono la fissazione** di #145.
- **Spec espliciti (edge dichiarato): 0/4 cascano** — se lo spec svela l'edge, anche il modello debole lo gestisce → task NON deceptivo. Lezione: la deceptività va **validata**, non assunta.
- **Spec impliciti (edge derivabile): 1/4 casca** — solo `total_minutes` (midnight-wrap → durata NEGATIVA) fallisce; accenti/arrotondamento/inclusività passano.
- **Insight [INFERRED]:** l'unico che riproduce #145 è della **STESSA CLASSE aritmetica sign/wrap** (#145 = digit-sum di negativi; total_minutes = wrap → negativo). Il gap #145 è specificamente un **blindspot su edge sign/wrap**, non "helper subdolo" generico.
- **Raffinamento del set (PROPOSTO, attende ok utente):** privilegiare esempi **same-class sign/wrap** (es. differenza-modulare, saldo che va sotto-zero, indice che va negativo, overflow/underflow, `%` con operandi negativi) invece di edge eterogenei (accenti/inclusività) che non riproducono il blindspot su un modello debole. Gli attuali 4 restano validi come **struttura** (helper-audit) ma solo total_minutes è un probe-di-difficoltà calibrato. Held-out #145 + total_minutes = due probe sign/wrap; aggiungerne 2-3 same-class.

## Links
[[gold-example-area03-verification-discipline]] · [[area-03-reasoning-scientific-method]] · [[../concepts/verification-discipline-training]] · [[../concepts/anti-fixation-metacognition-rung]] · [[../concepts/stuck-state-focus-protocol]] · [[gold-methodology]] · [[../feedback_intelligence_gap_to_training_class]]
