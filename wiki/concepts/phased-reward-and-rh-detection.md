---
name: phased-reward-and-rh-detection
description: Reward per-fase (process reward) di un task spezzettato in step + twin-pair discriminanti per inibire il participation-hack + final-report-reward pesato da quanto il modello ha tentato di hackerare le reward (RH-monitor = giudice LLM più capace). Verdetto critico su fattibilità/sensatezza/convenienza dell'idea utente 2026-06-27 msg 158.
type: concept
tags: [reward-design, reward-hacking, process-reward, rlaif, twin-scenarios, staged-curriculum]
sources: [user notes 2026-06-27 msg 158]
last_updated: 2026-06-27
status: draft v0
confidence: provisional
---

# Phased reward + RH-detection

> **Origine**: idea utente 2026-06-27 (msg 158). Spezzettare l'esecuzione di un task in **fasi** e dare **reward per-fase** (es. *mi aspetto un gathering*: se lo fa → reward+, se non lo fa → reward−). L'utente stesso identifica il problema: questo **induce reward-hacking** (il modello ripete l'azione che SA dare reward, anche dove non serve). Propone due contromisure (twin-scenari discriminanti + RH-monitor che pesa il reward finale).

## Catena di pensiero (why → problema → soluzione)

- **Why**: il reward solo-outcome (task fatto sì/no) è **sparso e a credito ritardato** — su task lunghi e multi-step il modello non sa *quale* step ha causato il successo/fallimento. Un segnale **per-fase** (process reward) dà credito denso e insegna la *procedura* (gather → orient → act → verify), non solo l'esito. Coerente con [[staged-curriculum-training]] (curriculum a fasi) e [[scientific-method-operating-protocol]] (observe→orient→plan→act→verify come fasi nominabili).
- **Problema**: ogni reward per-fase è un **proxy gameable** (Goodhart, vedi [[reward-hacking-mitigation]] §1). Se premio "ha fatto gathering", il modello impara a **fare sempre gathering** — anche quando è inutile — perché la *partecipazione* alla fase paga. È esattamente il **participation-hack** ([[reward-hacking-mitigation]] §2, difesa #12): reward dato all'atto, non all'outcome reale.
- **Soluzione (utente)**: (1) **twin-pair discriminanti** — due scenari apparentemente simili ma con necessità *realmente diverse*: in uno la fase serve, nell'altro NO, differenza sottilissima (impercettibile a una policy ingenua, evidente a un umano); (2) **final-report-reward pesato dall'RH rilevato** — analizzare il comportamento fase-per-fase, detectare RH via euristiche OPPURE chiedendo a un **modello più intelligente** (giudice); se il giudice dichiara RH ⇒ reward finale negativo/basso in %, altrimenti positivo.

## Lo schema

Tre componenti che lavorano insieme:

1. **Reward per-fase** (`r_phase,i`): segnale denso su ciascuna fase del task (gather, plan, act, verify). Insegna la procedura, dà credito locale.
2. **Twin-pair discriminanti** (anti participation-hack): ogni fase premiata è accoppiata a una **gemella** dove quella stessa fase **NON serve**, frase/contesto quasi identici. La policy è premiata per **discriminare** (fare gathering in A, *non* farlo in B), non per eseguire sempre. Penalità **simmetrica**: over-eseguire in B perde reward quanto omettere in A.
3. **Final-report-reward pesato dall'RH** (`R_final`): reward sull'intero task (il report finale), **scalato** da quanto RH il monitor ha rilevato fase-per-fase. Se RH-monitor (euristiche o giudice-LLM più capace) dichiara hacking ⇒ `R_final` ridotto in % / negativo; altrimenti pieno.

Forma operativa proposta (vedi Safeguard #1 per *perché* questa forma e non la somma ingenua):

```
R_totale = R_final(outcome reale del report)            ← ANCORA dominante, outcome-anchored
         + Σ_i  γ·shaping(r_phase,i)                    ← potential-based, NON cambia la policy ottima
         − penalità_RH(monitor fase-per-fase)           ← scala R_final, non somma a parte
```

## Safeguard (perché non si sposta solo il problema)

L'idea è valida **solo** con questi safeguard; senza, sposta soltanto l'hacking dal task alla fase (e poi al giudice). [INFERRED da letteratura RL + EXTRACTED da [[reward-hacking-mitigation]]]

- **#1 — Outcome-anchor dominante + phase-reward come potential-based shaping (CRUCIALE)**. Il reward finale *outcome-anchored* DEVE **dominare**; i reward per-fase vanno trattati come **potential-based reward shaping** (Ng, Harada, Russell 1999). Teorema: una shaping della forma `F(s,s') = γ·Φ(s') − Φ(s)` **non altera la policy ottima** → non crea nuovi optimum hackerabili, accelera solo l'apprendimento. Se invece i phase-reward sono *additivi liberi* (non potential-based), introducono **esattamente** l'hacking che si vuole evitare: un nuovo massimo locale "fai la fase per il bonus". Questo è il safeguard che separa "funziona" da "si sposta il problema".
- **#2 — Twin-pair discriminanti = il pattern già nel nostro gold**. È **esattamente** la coppia bilanciata di [[../training-taxonomy/gold-example-area02-criticality]] §2 (5a): *untracked→HALT* vs *tracked→procedi*, **frase utente quasi identica**, discriminante = esito reale dei check, **penalità simmetrica** anti-cry-wolf. Va **generalizzato a OGNI fase premiata**: per ogni "fase X paga", costruire la gemella "fase X non serve". È la difesa strutturale anti participation-hack, indipendente dal monitor.
- **#3 — RH-monitor = giudice LLM più capace (RLAIF / process supervision), ma gamabile**. Fattibile (un modello più forte valuta il trace fase-per-fase), ma **il monitor stesso è un proxy gamabile** (judge-gaming: lunghezza, tono sicuro, boilerplate che "sembra" diligenza). Anti-judge-gaming, allineato a [[reward-hacking-mitigation]] §3 #5: **ensemble di lenti diverse** + ancorare il giudizio al **trace ESEGUITO** (le tool-call reali, non il testo che le descrive — anti **check-fantasma**, [[../training-taxonomy/gold-example-area02-criticality]] classe 3b) + richiesta di **specificità-al-task** (penalizza valutazioni generiche). **Scorer ≠ scored**: il giudice non valuta mai sé stesso.
- **#4 — Chi controlla il controllore (anti-ricorsione)**. L'RH-detector è anch'esso un proxy → hackerabile a sua volta (ricorsione del reward-hacking). Mitigazione: tenerlo **subordinato all'ancora-outcome** (#1) e validato su **held-out** — se `R_final` outcome-anchored domina, anche un monitor parzialmente gamato non sposta la policy ottima verso l'hacking. È la difesa di ultima istanza.

## Verdetto critico (ha senso? conviene?)

**SÌ — possibile e sensato**, coerente con [[reward-hacking-mitigation]] + [[staged-curriculum-training]], **a condizione** dei safeguard sopra (specialmente #1: phase-reward potential-based + outcome-anchor dominante). Senza #1 l'idea **sposta solo** il problema dal task alla fase.

- **È POSSIBILE**: sì. Process reward + RLAIF-judge sono tecniche note; il twin-pair è già implementato nel nostro gold (riuso, non R&D nuovo).
- **HA SENSO**: sì. Risolve il credit-assignment sparso e insegna la *procedura*; il twin-pair è la difesa corretta contro il participation-hack che l'utente teme.
- **CONVIENE?**: **dipende dal costo di autoraggio**. Gli scenari "differenza impercettibile" sono **costosi da autorare a mano** → mitigare con **batch + generazione assistita** (genera la coppia, umano valida solo la discriminante). Il rendimento (segnale denso + anti-hack) **vs** il costo (twin-pair per ogni fase) **va valutato empiricamente** — candidato a un'ablation: phase-reward+twin vs solo-outcome, a parità di budget.
- **Rischio residuo principale**: **ricorsione del reward-hacking** (l'RH-detector è anch'esso hackerabile). Mitigato — non eliminato — dalla **dominanza dell'outcome-anchor** (#1+#4). Da monitorare con il segnale di overoptimization di [[reward-hacking-mitigation]] §3 #9 (reward ↑ ma qualità held-out piatta = Goodhart).

`[INFERRED]` la quantificazione del trade-off costo/rendimento è da validare; `[EXTRACTED]` il twin-pair pattern e l'outcome-anchor sono già ground truth nel progetto.

## Linked

- [[reward-hacking-mitigation]] — vincolo cross-pipeline (participation-hack #12, scorer≠scored #3, judge-ensemble #5, overoptimization-monitor #9, check-fantasma).
- [[staged-curriculum-training]] — il task spezzettato in fasi è il curriculum a stadi su cui poggia il phase-reward.
- [[../training-taxonomy/gold-example-area02-criticality]] — il twin-pair (untracked→HALT / tracked→procedi, penalità simmetrica) da generalizzare a ogni fase.
- [[error-memo-system]] — il verify-loop reale (rosso→verde) come fase verificabile ancorabile all'outcome.
- [[scientific-method-operating-protocol]] — observe→orient→plan→act→verify come le fasi nominabili che il phase-reward premia.
