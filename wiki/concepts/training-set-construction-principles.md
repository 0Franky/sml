---
name: training-set-construction-principles
description: Mirror navigabile (SSOT wiki) delle regole di COSTRUZIONE dei training set — #18 gap→classe, #19 transfer cross-dominio, #20 gerarchia padre→figlia, #21 esempi negativi + completezza-dataset. Le regole vivono in CLAUDE.md; qui la versione linkabile con esemplari e checklist.
type: concept
tags: [training, taxonomy, methodology, dataset-quality, reward-hacking, meta]
last_updated: 2026-07-05
---

# Principi di costruzione dei training set

> **Perché questa pagina** (utente msg 1218): le regole di costruzione del training vivono in `CLAUDE.md` (istruzioni per l'agente), ma servono anche **navigabili nella wiki** come SSOT — così ogni classe/gold può linkarle e un revisore le trova. Questa pagina **mirrora** #18-#21; la fonte autoritativa resta CLAUDE.md. Tutte discendono dal principio-cardine [[../feedback_reward_hacking_principle]] (reward ancorato all'OUTCOME) e [[../feedback_optimization_first]].

## I quattro principi

### #18 — Ogni buco di intelligenza → una CLASSE (non solo notarlo)
Ogni gap di ragionamento osservato (chat, esperimenti, ovunque) → si **astrae in una classe** di problemi + soluzione/skill, **outcome-anchored**, proposta all'utente e approvata PRIMA di filarla. **Doppio scopo**: ogni esperimento migliora l'harness *e* scopre buchi-da-addestrare (finding-harness ↔ classe-training). **Decontaminazione**: l'istanza osservata resta **held-out** (mai train-on-test); la skill si traduce in esempi su domini diversi → il transfer sull'held-out È la metrica di successo. Vedi [[../feedback_intelligence_gap_to_training_class]].

### #19 — Transfer set SEMPRE cross-dominio + vita quotidiana + complessità variabile
Gli esempi di transfer di una skill di ragionamento NON si concentrano in un'area (men che meno software): il modello **localizzerebbe** la skill invece di generalizzarla. Ogni classe: ≥3-4 transfer non-tecnici su domini lontani (vita quotidiana, economia/policy, ecologia, salute, business), dal banale al sistemico. La stessa logica astratta vale ovunque (es. consequence↔intention = Cobra effect in economia). Vedi [[../feedback_transfer_always_cross_domain]].

### #20 — Classi SEMPRE gerarchiche (padre→figlia) + specializzazione ricorsiva
Prima di filare una classe si cerca/crea il **padre** (skill-radice condivisa) e la si aggancia come specializzazione; se una figlia merita sotto-figlie, si ricorre. Il padre fa imparare la radice una volta (anti-ridondanza), riflette la relazione reale, è composizionale. Mai sorelle scollegate con trigger comune. Vedi [[../feedback_hierarchical_training_classes]].

### #21 — Esempi NEGATIVI sempre (quando serve) + completezza-dataset auditata
Ogni set/classe/gold include **esempi negativi** (contro-esempi, casi-dove-NON-si-applica / risposta-opposta) quando migliorano le performance: insegnano il **confine** della skill, rendono il segnale **discriminativo**, prevengono over-triggering/over-caution. Senza il negativo, "sempre-prudente / sempre-cheap / sempre-astieniti" diventa un **hack che passa** (→ il reward SIMMETRICO è il rimedio: premia il giudizio, non un comportamento fisso). Prima del "pronto", audit di **completezza/coerenza** → [[training-set-completeness-audit]].

## Gli esemplari (dove i principi sono già applicati)

| Principio | Esemplari |
|---|---|
| #18 doppio-scopo + held-out | [[../training-taxonomy/class-confabulation-retrieval-failure]] (F16), [[../training-taxonomy/gold-example-transfer-assumption-audit]] (#145) |
| #19 transfer cross-dominio | [[../training-taxonomy/class-consequence-intention-conflict]] (gruppi A/B/C), tutte le classi-audit |
| #20 gerarchia padre→figlia | [[../training-taxonomy/class-metacognitive-self-audit]] (4 figlie), [[../training-taxonomy/class-constraint-fit-decision]] |
| #21 negativi + reward simmetrico | [[../training-taxonomy/class-resource-appropriate-substitution]] (neg integrati), [[../training-taxonomy/class-confabulation-retrieval-failure]] (simmetria), false-block bilanciata dei gold criticality |

## Come si compongono

I quattro principi si applicano **insieme** su ogni classe nuova: astrai il gap (#18) → trova/crea il padre e aggancia (#20) → scrivi positivi + **negativi** con reward simmetrico (#21) → aggiungi transfer cross-dominio (#19) → **audita la completezza** ([[training-set-completeness-audit]]) → tieni l'istanza osservata held-out (#18). Il filo comune: [[../feedback_reward_hacking_principle]] — il reward àncora all'OUTCOME reale, mai alla cerimonia/forma.

## Links
[[training-set-completeness-audit]] · [[../training-taxonomy/class-metacognitive-self-audit]] · [[../training-taxonomy/class-constraint-fit-decision]] · [[../feedback_intelligence_gap_to_training_class]] · [[../feedback_transfer_always_cross_domain]] · [[../feedback_hierarchical_training_classes]] · [[../feedback_reward_hacking_principle]]
