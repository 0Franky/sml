---
name: training-set-construction-principles
description: Mirror navigabile (SSOT wiki) delle regole di COSTRUZIONE dei training set — #18 gap→classe, #19 transfer cross-dominio, #20 gerarchia padre→figlia, #21 esempi negativi + completezza-dataset, #22 integrità fattuale (mai fatti inventati; incerto→verify-step). Le regole vivono in CLAUDE.md; qui la versione linkabile con esemplari e checklist.
type: concept
tags: [training, taxonomy, methodology, dataset-quality, reward-hacking, meta]
last_updated: 2026-07-06
---

# Principi di costruzione dei training set

> **Perché questa pagina** (utente msg 1218): le regole di costruzione del training vivono in `CLAUDE.md` (istruzioni per l'agente), ma servono anche **navigabili nella wiki** come SSOT — così ogni classe/gold può linkarle e un revisore le trova. Questa pagina **mirrora** #18-#21; la fonte autoritativa resta CLAUDE.md. Tutte discendono dal principio-cardine [[../feedback_reward_hacking_principle]] (reward ancorato all'OUTCOME) e [[../feedback_optimization_first]].

## I cinque principi

### #18 — Ogni buco di intelligenza → una CLASSE (non solo notarlo)
Ogni gap di ragionamento osservato (chat, esperimenti, ovunque) → si **astrae in una classe** di problemi + soluzione/skill, **outcome-anchored**, proposta all'utente e approvata PRIMA di filarla. **Doppio scopo**: ogni esperimento migliora l'harness *e* scopre buchi-da-addestrare (finding-harness ↔ classe-training). **Decontaminazione**: l'istanza osservata resta **held-out** (mai train-on-test); la skill si traduce in esempi su domini diversi → il transfer sull'held-out È la metrica di successo. Vedi [[../feedback_intelligence_gap_to_training_class]].

### #19 — Transfer set SEMPRE cross-dominio + vita quotidiana + complessità variabile
Gli esempi di transfer di una skill di ragionamento NON si concentrano in un'area (men che meno software): il modello **localizzerebbe** la skill invece di generalizzarla. Ogni classe: ≥3-4 transfer non-tecnici su domini lontani (vita quotidiana, economia/policy, ecologia, salute, business), dal banale al sistemico. La stessa logica astratta vale ovunque (es. consequence↔intention = Cobra effect in economia). Vedi [[../feedback_transfer_always_cross_domain]].

### #20 — Classi SEMPRE gerarchiche (padre→figlia) + specializzazione ricorsiva
Prima di filare una classe si cerca/crea il **padre** (skill-radice condivisa) e la si aggancia come specializzazione; se una figlia merita sotto-figlie, si ricorre. Il padre fa imparare la radice una volta (anti-ridondanza), riflette la relazione reale, è composizionale. Mai sorelle scollegate con trigger comune. Vedi [[../feedback_hierarchical_training_classes]].

### #21 — Esempi NEGATIVI sempre (quando serve) + completezza-dataset auditata
Ogni set/classe/gold include **esempi negativi** (contro-esempi, casi-dove-NON-si-applica / risposta-opposta) quando migliorano le performance: insegnano il **confine** della skill, rendono il segnale **discriminativo**, prevengono over-triggering/over-caution. Senza il negativo, "sempre-prudente / sempre-cheap / sempre-astieniti" diventa un **hack che passa** (→ il reward SIMMETRICO è il rimedio: premia il giudizio, non un comportamento fisso). Prima del "pronto", audit di **completezza/coerenza** → [[training-set-completeness-audit]].

### #22 — Integrità fattuale: mai fatti inventati, sempre completi; l'incerto → verify-step
Ogni fatto in un esempio diventa **ground truth** per il modello → un fatto **falso o incompleto CONTAMINA** conoscenza e prestazioni (es. "Gmail ha solo server US" = falso appreso e ripetuto). **Split del substrato**: **(I)** conoscenza **verificata e stabile** (ground-truth-able, **citata**, minimizzata) vs **(II)** claim **non verificati o volatili** → **MAI asseriti**, riformulati come passo di **Discovery/verifica** (il gold è il modello che riconosce il `[?]` e verifica, non che afferma). **Default in dubbio = (II)**. Per le skill di ragionamento preferisci **fatti self-contained nella fixture** (veri-per-costruzione → testa il ragionamento, non il recall); i fatti-del-mondo come ground truth restano ai task di conoscenza vera (area-12), verificati+citati. **Reward** sul **comportamento di verifica**, non sul conoscere-il-fatto (che potremmo avere sbagliato). È la disciplina `[V]/[A]/[?]` ([[structured-thinking]]) applicata al **SUBSTRATO** degli esempi + le confidence-tag wiki + l'anti-confabulazione. Vedi [[../feedback_training_set_factual_integrity]] + CLAUDE.md #22.

## Gli esemplari (dove i principi sono già applicati)

| Principio | Esemplari |
|---|---|
| #18 doppio-scopo + held-out | [[../training-taxonomy/class-confabulation-retrieval-failure]] (F16), [[../training-taxonomy/gold-example-transfer-assumption-audit]] (#145) |
| #19 transfer cross-dominio | [[../training-taxonomy/class-consequence-intention-conflict]] (gruppi A/B/C), tutte le classi-audit |
| #20 gerarchia padre→figlia | [[../training-taxonomy/class-metacognitive-self-audit]] (4 figlie), [[../training-taxonomy/class-constraint-fit-decision]] |
| #21 negativi + reward simmetrico | [[../training-taxonomy/class-resource-appropriate-substitution]] (neg integrati), [[../training-taxonomy/class-confabulation-retrieval-failure]] (simmetria), false-block bilanciata dei gold criticality |
| #22 integrità fattuale (verify, non asserire) | [[../training-taxonomy/class-alternative-path-under-block]] (sotto-classe B: "migliore"→Discovery/verifica, non asserzione; N-B3), [[../training-taxonomy/gold-example-decomposition]] (fixture self-contained = fatti veri-per-costruzione) |

## Come si compongono

I principi si applicano **insieme** su ogni classe nuova: astrai il gap (#18) → trova/crea il padre e aggancia (#20) → scrivi positivi + **negativi** con reward simmetrico (#21) → aggiungi transfer cross-dominio (#19) → **verifica l'integrità fattuale** (#22: ogni fatto verificato+citato oppure incerto→verify-step; preferisci fixture self-contained) → **audita la completezza** ([[training-set-completeness-audit]]) → tieni l'istanza osservata held-out (#18). Il filo comune: [[../feedback_reward_hacking_principle]] — il reward àncora all'OUTCOME reale, mai alla cerimonia/forma.

## Tecniche di label-generation (cross-cutting)

Metodologie di generazione-label applicabili a più classi (non legate a una sola):

- **[[discriminative-mcq-hard-distractors]]** (utente msg 1372/1378): MCQ a **distrattori-confondibili a coppie** (4/6/10/16 opz = minimal-pairs, una-sola-corretta) per affinare la **discriminazione fine**, in fase **recognition E generation**. Distrattori da **failure-mode reali** + **style-matched** + **posizione sempre randomizzata** (item + dataset ~uniforme) + audit exactly-one-correct/tell. Oracolo: `harness/verifiers/mcq-distractor-gen.mjs` (11/0). È l'estensione MCQ del principio #21 (il near-twin = negativo massimamente informativo).
- **Mutation trap-sound** ([[../../harness/verifiers/deceptive-task-gen]]): da `(C corretto, suite)` genera mutanti + partiziona provided/hidden (deceptiveness verificata eseguendo). Base per i distrattori load-bearing dell'MCQ.
- **Oracoli strutturali self-contained** ([[../../harness/verifiers/async-schedule-gen]]): decisione modellata + `score` outcome-anchored su fixture (rule #22: testa il ragionamento, non il recall).

## Links
[[training-set-completeness-audit]] · [[discriminative-mcq-hard-distractors]] · [[../training-taxonomy/class-metacognitive-self-audit]] · [[../training-taxonomy/class-constraint-fit-decision]] · [[../feedback_intelligence_gap_to_training_class]] · [[../feedback_transfer_always_cross_domain]] · [[../feedback_hierarchical_training_classes]] · [[../feedback_reward_hacking_principle]]
