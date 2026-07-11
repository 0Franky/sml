---
name: mcq-training-dosage-and-format-overfitting
description: Rischio di over-specializzazione da training (SFT/RL) su MCQ e le leve per mitigarlo. L'MCQ è uno SCAFFOLD di verifica (label-gen per un sottoinsieme di classi reasoning/attribution), NON un target di deployment (agentico, free-form). Analisi + reco (cap + format-transfer + decay + held-out generativo). PROPOSTA — da validare empiricamente con ablation.
type: concept
tags: [training, rl, mcq, overfitting, format-transfer, reward-hacking, anti-shortcut, held-out, area-03, area-04]
last_updated: 2026-07-11
status: analysis-pending-empirical-validation
sources:
  - user msg 2026-07-11 19:13 (timore overfitting MCQ + proposta scaglionamento RL)
---

# MCQ: dosaggio nel training e rischio di format-overfitting

> **Origine**: domanda utente 2026-07-11 — *"quanto addestrare il modello su MCQ? timore: che poi si fitti i pensieri solo su queste classi e perda prestazione, anche in RL. Ha senso scaglionare l'RL su MCQ a batch (on/off)?"*. Questa pagina è l'**analisi** (il manuale, #23). **NON è una decisione ratificata** (#26): la ratio va fissata empiricamente (§Reco → ablation).

## Contesto: cos'è l'MCQ da noi

L'MCQ (multiple-choice) nel nostro training è una **tecnica di label-generation** per un *sottoinsieme* di classi — quelle reasoning/attribution dove generare un oracolo verificabile a mano è costoso: [[discriminative-mcq-hard-distractors]], counterfactual-MCQ (attribuzione in [[../training-taxonomy/class-code-optimization]]). **Non è l'intero training.** Il deployment reale è **agentico, free-form, multi-turno** — mai "scegli fra 4". [EXTRACTED dal design taxonomy]

**Principio-cardine da cementare**: *l'MCQ è uno **scaffold di verifica**, non un **target di training***. È l'analogo-di-formato dell'harness-vs-training ([[../training-taxonomy/class-... |#11]] — lo scaffold regge ORA, il modello internalizza la skill che sopravvive quando lo scaffold recede). [INFERRED]

## Il rischio esiste — e in RL è MAGGIORE, non minore

Tre forme, dalla meno alla più insidiosa:

1. **Format overfit (recognition ≠ generation)** [EXTRACTED, noto in letteratura]. L'MCQ addestra il *riconoscere* fra opzioni date; il deployment richiede il *generare*. Una skill imparata **solo** come MCQ può non trasferirsi al free-form.

2. **L'RL amplifica, non attenua** [INFERRED, alta confidenza]. L'RL sfrutta le scorciatoie: se un MCQ è risolvibile con un'euristica (posizione/lunghezza/eliminazione), l'RL la trova e **premia la scorciatoia invece della skill**. → l'RL è *più* pericoloso dell'SFT qui. È il nostro reward-hacking ([[../feedback_reward_hacking_principle]], #10) applicato al **formato**. La speranza "l'RL è più robusto" è rovesciata.

3. **Conflitto choose-one ↔ astensione (specifico al NOSTRO progetto, il più insidioso)** [INFERRED]. L'MCQ costringe a "scegline 1 su 4" → contraddice **strutturalmente** le skill che addestriamo apposta: astensione / "devo verificare prima di rispondere" ([[../training-taxonomy/class-confabulation-retrieval-failure]]), onestà-sotto-difficoltà ([[../training-taxonomy/class-effort-honesty-under-difficulty]]). Addestrare troppo il choose-one può **DIS-insegnare l'astensione** (insegni che esiste sempre una risposta giusta fra quelle date). Invisibile finché non lo si misura.

## Le leve — la prevenzione NON è lo scheduling

**Prevenzione vera (3 leve, ordine di potenza):**

1. **MCQ = MINORANZA del mix.** L'overfit di formato dipende dalla *proporzione* del gradiente, non dalla presenza → tenerlo piccolo è il grosso della difesa.
2. **Format-transfer.** Ogni skill insegnata via MCQ va insegnata **anche** free-form + come task reale → la skill si astrae dal formato. È il **transfer cross-dominio (#19, [[../feedback_transfer_always_cross_domain]]) applicato all'asse-FORMATO** invece che all'asse-dominio.
3. **Hard-distractor + CoT ancorata + "astensione" come opzione valida.** Distrattori = plausibili-ma-sbagliati (già il design counterfactual-MCQ) → la scorciatoia non esiste; includere *"nessuna / devo verificare"* dove la skill È l'astensione → il formato smette di punire il comportamento giusto. Neutralizza (2) e (3) sopra. Coerente con #10 + [[../feedback_reward_branch_field_trap]] (#32: non grondare il ramo).

**Lo scaglionamento serve — ma per altri 2 scopi, NON prevenzione:**

4. **MISURA.** Interleavi e, fra un'onda e l'altra, lanci un **probe held-out GENERATIVO** (non-MCQ) → il timore diventa un *numero misurato*, non un'ipotesi. È il measure-then-declare / [[../feedback_instrument_before_hypothesizing]].
5. **DECAY, non pulse.** La forma giusta non è on/off ("un batch, poi tre a vuoto") — rischia oscillazione + forgetting. Meglio **annealare la frazione MCQ verso il basso** lungo il training: discrimina presto (l'MCQ è ottimo per insegnare *il confine* di una skill — cfr. esempi negativi #21), genera tardi.

## Reco (PROPOSTA — attende ok utente + validazione empirica)

**Cap + diversifica-formato + decay + misura-su-held-out-generativo.** NON pulse puri.

È in fondo una **domanda EMPIRICA**: la ratio esatta non è nota a priori → fissarla con un'**ablation** a 3 condizioni (MCQ-heavy / MCQ-light / MCQ-decay), misurando la degradazione su un held-out generativo. **Prossimo passo tracciato**: abbozzare il protocollo dell'ablation (quale held-out, le 3 condizioni esatte, metrica + soglia di degradazione accettabile). → [[../todo]].

## Links
[[discriminative-mcq-hard-distractors]] · [[../training-taxonomy/class-code-optimization]] (counterfactual-MCQ) · [[../training-taxonomy/class-confabulation-retrieval-failure]] · [[../training-taxonomy/class-effort-honesty-under-difficulty]] · [[../feedback_reward_hacking_principle]] · [[../feedback_reward_branch_field_trap]] · [[../feedback_transfer_always_cross_domain]] · [[../feedback_instrument_before_hypothesizing]] · [[../feedback_negative_examples_and_dataset_completeness]] · [[../training-taxonomy/dataset-construction-playbook]] · grill [E] (retrofit reward 3-segnali + MCQ-controfattuale) in [[../todo]]
