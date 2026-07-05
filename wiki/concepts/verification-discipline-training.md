---
name: verification-discipline-training
description: "Design del training per la DISCIPLINA di verifica anti-inganno (utente msg 1103): il modello deve implementare → scrivere NUOVI test discriminanti → testare LIVE → POI concludere; se salta la verifica e si fida dei test forniti/esistenti (che possono ingannare) è PENALIZZATO sull'OUTCOME, non sulla cerimonia. Reward Q ancorato all'oracolo nascosto + discrimination-gate anti-reward-hacking."
type: concept
tags: [training, reward, verification, scientific-method, reward-hacking, deception, area-03, self-critique]
reward_tag: Q
last_updated: 2026-07-05
sources:
  - "Utente TG msg 1103 (2026-07-05): esercizi subdoli di ragionamento e inganno; implementa→scrivi-nuovi-test→testa-live→delibera; salti la verifica = penalizzato"
  - "Lezione di sessione: set_keepturns unit-verdi ma rotto E2E (regola #17 [[feedback_institutionalize_lessons_as_rules]])"
---

# Disciplina di verifica anti-inganno (training design)

> **Origine (utente msg 1103, 2026-07-05):** «esercizi subdoli di ragionamento e di inganno … il modello deve capire che
> deve implementare, deve scrivere i nuovi test, deve testare live (quando possibile) perché abbiamo appena visto che di solito
> i test statici non bastano, e poi può deliberare. Se invece semplicemente implementa e passa i test esistenti senza fare la
> parte di verifica e controllo allora deve essere penalizzato.» **Voglio efficienza E affidabilità.**

Questo è il training-signal che interiorizza nel MODELLO la stessa disciplina che stanotte ho dovuto istituzionalizzare per me
in [[feedback_institutionalize_lessons_as_rules]] (regola #17): **"verde nei test forniti" ≠ "corretto"** — il bug `set_keepturns`
aveva 13/13 unit verdi ed era rotto end-to-end. Il modello deve imparare a NON fidarsi della copertura che gli viene data, a
**derivare i casi dallo SPEC**, scrivere un test che *discrimina*, eseguirlo dal vivo, e solo allora dichiarare fatto.

## 1. Il meccanismo d'inganno (cosa rende il task "subdolo")

L'esercizio è costruito perché **i test forniti INGANNANO**: passano su un'implementazione plausibile-ma-SBAGLIATA.
- Spec `S` (con un requisito su un edge-case `e`), reference corretto `C`, variante plausibile-buggy `B` (un errore *naturale* che
  un modello fa di getto: dimentica `e`).
- **Test forniti `P`** = un set che passa su **ENTRAMBI** `B` e `C` (insufficiente *per costruzione* — non esercita `e`).
- **Oracolo nascosto `O_hidden`** = test derivabili da `S` che **distinguono** `C` da `B` (falliscono su `B`). Il modello NON li vede.

Un modello che *implementa la variante naturale (≈B) → esegue solo `P` (verdi) → dichiara fatto* **spedisce il bug**: `O_hidden` lo
boccia. Un modello *disciplinato* legge `S`, nota che `P` non copre `e`, **scrive un test per `e`**, lo **esegue dal vivo**, vede il
fallimento, corregge → passa `O_hidden`. È il metodo scientifico applicato al codice (ipotesi «il mio codice è giusto» → esperimento
discriminante → *poi* conclusione), area [[training-taxonomy/area-03-reasoning-scientific-method]].

## 2. Reward (Q, ancorato all'OUTCOME — mai alla cerimonia)

Tre termini; il dominante è l'outcome. **Regola-cardine anti-hack: non si premia MAI "ha scritto un test" o "ha detto verifico"; si
premia SOLO l'aver colto/evitato il difetto REALE** ([[reward-hacking-mitigation]], [[feedback_reward_hacking_principle]], CLAUDE.md #10).

1. **R_outcome (dominante)** = il codice finale passa `O_hidden` (l'oracolo nascosto, ground-truth eseguibile). Da solo, questo già
   incentiva la verifica: su un task ingannevole non passi `O_hidden` in modo affidabile senza derivare `e` dallo spec e testarlo.
2. **R_discipline (gated sulla DISCRIMINAZIONE, non sul gesto)** — credito per la verifica **solo se** il test `T` scritto dal modello è
   **discriminante**: `T(B)=FAIL ∧ T(C)=PASS` (coglie davvero il bug piantato) **E** è stato **eseguito dal vivo** (tool-call reale nel
   trace → marker `[V]` ancorato a un artefatto, non dichiarato; CLAUDE.md #10 anti "catena-fantasma"). Un test che passa tutto
   (cerimonia) → credito **0**. È il *discrimination-gate*: rende premiabile "scrivere un test" **solo** quando ha potere diagnostico.
3. **Penalità (il comportamento che l'utente vuole punire)** = *dichiarato-fatto* **∧** `O_hidden`=FAIL **∧** nessun test discriminante
   eseguito → reward **negativo**. È la "falsa confidenza": implementa, gira i test forniti verdi, dice fatto, spedisce il bug.

**Proporzionalità (anti over-caution, optimization-first, CLAUDE.md #8/#10):** su task dove `P` è *già* sufficiente (nessun `e`
scoperto), dichiarare fatto dopo i test forniti è **corretto** → nessuna penalità *e* nessun premio per over-testing. Il set di
training **MISCHIA** apposta task-ingannevoli e task-onesti, così il modello impara *quando* serve un test nuovo, non "scrivi sempre
10 test" (che sarebbe la sua cerimonia-di-over-caution). Il segnale è **calibrazione dello sforzo di verifica al rischio**, non rito.

## 3. Perché non è gameabile (difese, allineate all'hack-check d'Area 3)

Il rischio d'area è il **process-marker spoofing** (mimare `verifico`/`[V]`/"ho scritto i test" senza eseguire). Difese:
- **Scorer ≠ scored**: `O_hidden` e il discrimination-gate sono **verifier deterministici indipendenti** (fixture eseguita), non
  l'auto-giudizio del modello. → [[reward-hacking-mitigation]] §scorer≠scored.
- **Discriminazione quantificata, non esemplificata** (gold-methodology §predicato): il gate NON è "esiste un test"; è `T(B)=FAIL ∧
  T(C)=PASS` — un predicato eseguibile ancorato alle due reference. Un test-placebo non lo soddisfa.
- **Ancoraggio all'esecuzione reale** (CLAUDE.md #10): il credito-verifica esige un tool-call di esecuzione **presente nel trace**;
  "ho testato" a parole = 0.
- **Outcome sopra tutto**: R_discipline è **subordinato** a R_outcome (non standalone) → non puoi incassare la disciplina spedendo
  codice rotto.

## 4. Generazione delle label (come si fabbricano gli esercizi)

Deterministico e riproducibile (F-harness genera il dato; nessun giudizio umano per-istanza):
1. Parti da `(S, C)` (task coding con reference corretto — es. una foglia HumanEval/SWE o sintetica).
2. **Muta** `C → B` con un *mutation operator* che modella un errore naturale su un edge `e` (off-by-one al boundary, `<` vs `≤`,
   negativi/zero/empty non gestiti, case-sensitivity, overflow…). Tieni `e` esplicito.
3. **Test forniti `P`** = campiona test che passano su **sia `B` sia `C`** (scartane ogni caso che esercita `e`). Insufficienza *provata*: `∀ p∈P: p(B)=p(C)=PASS`.
4. **Oracolo nascosto `O_hidden`** = i test che distinguono (`∃ o: o(B)=FAIL, o(C)=PASS`), inclusi i casi-`e`.
5. **Discrimination-gate** per il test-modello `T`: `run(T,B)` e `run(T,C)` in sandbox ([[training-taxonomy/area-02-criticality-safety]]/verifier-sandbox).
> Il *mutation testing* è letteratura solida (i "mutanti" = i `B`); qui lo usiamo al contrario per **costruire l'inganno** e per
> **misurare la potenza** del test del modello (uccide il mutante?).

## 5. Classificazione training-vs-harness (regola #11, [[training-vs-harness-classification]])

Capacità = «verificare prima di concludere sotto copertura ingannevole». Scomposta:
- **{eseguire i test dal vivo}** = `F-harness` — lo fa `verifier-sandbox` (esecuzione), non va addestrato.
- **{derivare `e` dallo spec · decidere di scrivere un test discriminante · decidere quando è davvero fatto}** = **`S` (skill da
  addestrare)** — è il giudizio epistemico, il cuore del segnale.
- **Stato-senza-training = DEGRADATA-MA-UTILE**: un modello capace lo fa già; un SLM debole **spedisce la variante naturale** (≈B) →
  è un **vero target di training**, non un guscio inerte. Reward ancorato all'OUTCOME (`O_hidden`), regime F2→F3 (esercizi→RL agentico).

## 6. Curriculum & collocazione

- **Home**: Area 3 (metodo scientifico, *verify-loop*) — foglia **verify-before-concluding sotto test-coverage ingannevole**. Gold:
  [[training-taxonomy/gold-example-area03-verification-discipline]].
- **Overlap**: Area 16 (self-critique: «non fidarti del verde, critica il tuo stesso output») e Area 5 (code-correctness). Il *segnale*
  qui è la **disciplina di verifica** (derivare+eseguire il test discriminante), non la critica in prosa (Area 16) né la sola correttezza (Area 5).
- **Fasi**: F2 = esercizi con-hint (checklist «deriva i casi dallo spec, scrivi un test che fallirebbe se sbagliassi, eseguilo») →
  senza-hint; F3 = RL agentico nell'harness (il reward `O_hidden` + discrimination-gate girano in `verifier-sandbox`).

## Links
[[training-taxonomy/area-03-reasoning-scientific-method]] · [[training-taxonomy/gold-example-area03-verification-discipline]] · [[reward-hacking-mitigation]] · [[feedback_reward_hacking_principle]] · [[training-vs-harness-classification]] · [[feedback_institutionalize_lessons_as_rules]] · [[scientific-method-operating-protocol]] · [[training-taxonomy/gold-methodology]]
