---
name: mcq-training-dosage-and-format-overfitting
description: GUIDA COMPLETA — rischio di over-specializzazione da training (SFT/RL) su MCQ e le metodologie per usarlo bene. L'MCQ è uno SCAFFOLD di verifica (label-gen per un sottoinsieme reasoning/attribution), NON un target di deployment (agentico, free-form). Contiene 12 metodologie a schede (problema→soluzione→DO/DON'T→perché) + matrice riassuntiva ✅/❌ + reco (cap + format-transfer + decay + held-out generativo). PROPOSTA — ratio da validare empiricamente con ablation.
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

## Metodologie operative — problema → soluzione → DO/DON'T → perché

> Dettaglio operativo delle leve sopra + le metodologie di supporto. Ogni scheda è **azionabile**: cosa fare (✅), cosa NON fare (❌) e il **perché** (il razionale che regge la regola — se salta il perché, salta la regola). Le leve §sopra sono il riassunto; queste schede sono la forma completa.

### M1 — L'MCQ è uno SCAFFOLD di verifica, non un target
- **Problema**: trattare l'MCQ come *formato-obiettivo* (addestrare il modello a "rispondere in MCQ") → il deployment è agentico free-form, la skill non trasferisce.
- **Soluzione**: usarlo SOLO come **generatore di label verificabili** per le skill dove l'oracolo generativo è costoso (reasoning/attribution); la skill target resta la *generazione*.
- ✅ **Adottare**: MCQ per rendere verificabile "il modello ha auditato l'assunzione?" dove un oracolo a mano sarebbe intrattabile.
- ❌ **Evitare**: MCQ come unico o principale segnale per una skill; MCQ come formato che il modello vede spesso in output.
- **Perché**: *recognition ≠ generation*. È l'analogo-di-formato dell'harness-vs-training (#11): lo scaffold regge ORA, la skill che sopravvive quando lo scaffold recede è quella generativa. Vedi [[../training-taxonomy/dataset-construction-playbook]] §4 [MCQ-DOSAGE].

### M2 — Dosaggio: l'MCQ resta MINORANZA del mix
- **Problema**: MCQ che domina il gradiente → format-overfit (il modello si specializza sul riconoscere).
- **Soluzione**: cap esplicito sulla frazione MCQ del mix di training; il resto è generativo/agentico.
- ✅ **Adottare**: fissare e monitorare una % massima; trattarla come iperparametro di prima classe.
- ❌ **Evitare**: lasciar crescere l'MCQ "perché è cheap da generare e verificare" (falsa economia).
- **Perché**: l'overfit di formato dipende dalla **proporzione del gradiente**, non dalla semplice presenza → tenerlo piccolo è il grosso della difesa (≈70%).

### M3 — Multi-formato per skill (format-transfer)
- **Problema**: una skill imparata SOLO come MCQ resta legata al formato ("pensiero critico = cosa da MCQ").
- **Soluzione**: ogni skill insegnata via MCQ va insegnata **anche** free-form + come task reale/agentico → il modello astrae la LOGICA dal FORMATO.
- ✅ **Adottare**: per ogni skill via-MCQ, ≥2 altri formati (generazione libera, task eseguibile).
- ❌ **Evitare**: classi mono-formato MCQ.
- **Perché**: è **il transfer cross-dominio (#19) applicato all'asse-FORMATO** — la stessa logica per cui insegniamo una skill su domini lontani per costringere l'astrazione, applicata alla *forma* invece che al *dominio*. [[../feedback_transfer_always_cross_domain]].

### M4 — Distrattori HARD (load-bearing, minimal-pairs, style-matched)
- **Problema**: distrattori facili → il modello impara un **cue di superficie** (lunghezza, "all of the above", hedging, posizione) invece della skill.
- **Soluzione**: distrattori = **minimal-pairs** mutati lungo la SOLA feature load-bearing, derivati dai **failure-mode reali**, **style-matched** (lunghezza/tono/specificità pari), **posizione randomizzata** + audit distractor-tell.
- ✅ **Adottare**: generare i distrattori dagli errori veri del modello; auditare che nessun cue lessicale/posizionale predìca la risposta.
- ❌ **Evitare**: distrattori palesemente assurdi, o corretto-sistematicamente-più-lungo, o "sempre C".
- **Perché**: se esiste una scorciatoia, l'RL la trova. I distrattori duri fanno sì che la scorciatoia **non esista per costruzione**. [[../concepts/discriminative-mcq-hard-distractors]], [[../concepts/position-answer-randomization]].

### M5 — "Astensione come opzione valida" dove la skill È l'astensione
- **Problema**: l'MCQ forza "scegline 1 su N" → **DIS-insegna l'astensione** che addestriamo apposta (confabulation, effort-honesty, "devo verificare").
- **Soluzione**: nelle classi dove il gold-behavior è astenersi/verificare, includere *"nessuna delle precedenti / devo verificare"* come **opzione corretta** nella fixture.
- ✅ **Adottare**: item MCQ la cui risposta giusta È "non lo so senza verificare", con l'astensione premiata.
- ❌ **Evitare**: forzare sempre una delle N risposte fattuali → insegna che esiste sempre una risposta giusta fra quelle date.
- **Perché**: il formato non deve **punire il comportamento-gold**. È il conflitto più insidioso e specifico al nostro progetto (addestriamo l'astensione da una parte e la puniremmo con l'MCQ dall'altra). Composizione con [[../training-taxonomy/class-confabulation-retrieval-failure]] / [[../training-taxonomy/class-effort-honesty-under-difficulty]].

### M6 — RL su MCQ: blindare la scorciatoia (l'RL amplifica)
- **Problema**: in RL il modello ottimizza verso QUALSIASI cosa massimizzi il reward → se la lettera-giusta è ottenibile con un'euristica, l'RL premia l'euristica, non la skill. L'RL è **più** pericoloso dell'SFT qui.
- **Soluzione**: non premiare la lettera-sola quando è gameable; ancorare a **outcome + correttezza-dei-passi** (segnale ②) e blindare gli assi ortogonali.
- ✅ **Adottare**: reward che richiede il ragionamento tracciabile (M7) accanto alla lettera; hack-check esplicito ("come prende la lettera senza la skill?").
- ❌ **Evitare**: RL con reward = solo exact-match della lettera su MCQ facili.
- **Perché**: è il nostro **reward-hacking sul FORMATO** (#10). La speranza "l'RL è più robusto dell'SFT" è rovesciata: l'RL è un ottimizzatore di scorciatoie. [[../feedback_reward_hacking_principle]], [[../feedback_reward_branch_field_trap]] (#32).

### M7 — CoT ancorata + MCQ-controfattuale (anti-guessing, valida il ragionamento)
- **Problema**: il modello può indovinare la lettera **senza** ragionare (pavimento 1/N + fortuna) → premi il caso, non la skill.
- **Soluzione**: richiedere la CoT E validarla con l'**MCQ-controfattuale** (flippa il fatto load-bearing → la risposta corretta cambia): chi ragiona traccia il flip, chi ha una risposta fissa sceglie uguale → sbugiardato. Premi solo la **lettera** (deterministica), mai la prosa.
- ✅ **Adottare**: coppie di item controfattuali; reward sulla coerenza flip↔risposta.
- ❌ **Evitare**: premiare la prosa "ho ragionato…" (cerimonia → 0); fidarsi di un item singolo non-flippato.
- **Perché**: separa **ragionamento da fortuna**. È la versione-MCQ del context-flip; valida il segnale ② senza premiare la cerimonia. Caveat: valida gli assi che i distrattori coprono (mirato), valida SELEZIONE non COSTRUZIONE. [[../concepts/discriminative-mcq-hard-distractors]] §Tracker, [[../concepts/phased-reward-and-rh-detection]].

### M8 — Recognition + Generation: la generazione resta PRIMARIA
- **Problema**: fermarsi alla fase di riconoscimento (scegli fra date) → non si addestra il costruire.
- **Soluzione**: 2 fasi — Recognition (MCQ, per insegnare *il confine*) **+** Generation (produzione libera + self-check), con la **generazione primaria**.
- ✅ **Adottare**: l'MCQ come warm-up discriminativo che insegna il confine (cfr. esempi negativi #21), seguito dalla generazione.
- ❌ **Evitare**: dataset dove la skill esiste solo in forma MCQ.
- **Perché**: l'MCQ valida la **selezione**, non la **costruzione** → è complemento, mai sostituto della generazione.

### M9 — Scheduling: DECAY, non pulse on/off
- **Problema**: alternare batch pieni-di-MCQ e batch a-vuoto ("un beccuccio, poi 3 a vuoto, poi 2") → **oscillazione** e **catastrophic forgetting** fra le fasi.
- **Soluzione**: **annealare** la frazione MCQ verso il basso lungo il training (discrimina-presto → genera-tardi), invece di on/off.
- ✅ **Adottare**: curriculum con decay graduale della quota MCQ.
- ❌ **Evitare**: pulse a gradino (rischia che la skill oscilli e si de-alleni fra un pulse e l'altro).
- **Perché**: lo scheduling **NON è la leva di prevenzione** (quella è M2+M3+M4); è una *forma del curriculum*. Il decay è liscio e monotòno; il pulse introduce discontinuità che il modello dimentica.

### M10 — Misura: probe held-out GENERATIVO fra le onde
- **Problema**: non sai se l'MCQ ha degradato la **generazione** finché non è tardi (il timore resta un'ipotesi).
- **Soluzione**: fra un'onda di training e l'altra, lancia un **probe held-out generativo** (non-MCQ) e misura la degradazione.
- ✅ **Adottare**: eval generativo fissato a monte + soglia di "degradazione accettabile"; instrumenta prima di dichiarare.
- ❌ **Evitare**: dichiarare "non ha degradato" senza misurarlo (measure-then-declare al contrario: qui la misura è doverosa).
- **Perché**: trasforma il timore in un **numero**. È [[../feedback_instrument_before_hypothesizing]] applicato al training-mix. È anche l'unico modo di scegliere la ratio (§Reco → ablation).

### M11 — Guessing-floor 1/N: alza N + audit distribuzione lettere
- **Problema**: con 4 opzioni il modello incassa 25% a caso → reward rumoroso, hackabile col guessing.
- **Soluzione**: più opzioni (4→16 abbassa il floor 25%→6.25%) + più item + **audit della distribuzione delle lettere-corrette** (~uniforme a livello dataset).
- ✅ **Adottare**: N alto dove possibile; shuffle per-item + bilanciamento globale delle lettere.
- ❌ **Evitare**: N=2/3 come segnale unico; distribuzione sbilanciata (bias "sempre-C").
- **Perché**: abbassa il pavimento del caso → il reward misura la skill, non la fortuna. [[../concepts/position-answer-randomization]].

### M12 — Decontaminazione: l'istanza-eval MCQ resta HELD-OUT
- **Problema**: mettere l'item MCQ osservato/di-eval nel training = train-on-test → contamina il validation, gonfia le metriche.
- **Soluzione**: l'istanza-eval resta **held-out**; il generatore di label NON emette l'item di valutazione; la skill si traduce in item su **assi/domini disgiunti**.
- ✅ **Adottare**: split rigoroso; il transfer sull'held-out È la metrica di successo.
- ❌ **Evitare**: riusare gli item di validazione come training MCQ.
- **Perché**: senza decontaminazione il numero mente (#18). [[../feedback_intelligence_gap_to_training_class]].

### Matrice riassuntiva ✅/❌

| # | Metodologia | ✅ Adotta | ❌ Evita |
|---|---|---|---|
| M1 | MCQ = scaffold | label-gen su skill oracolo-costose | MCQ come target/formato-output |
| M2 | Dosaggio | cap % minoranza | lasciarlo dominare il mix |
| M3 | Multi-formato | stessa skill anche free-form + task | classe mono-formato MCQ |
| M4 | Distrattori hard | minimal-pairs da failure reali, style-matched | distrattori facili / cue di superficie |
| M5 | Astensione-opzione | "devo verificare" premiata | forzare sempre 1-su-N |
| M6 | RL blindato | outcome + passi + hack-check | reward = lettera-sola gameable |
| M7 | CoT + controfattuale | coppie flip, premia la lettera | premiare la prosa / item singolo |
| M8 | Recognition+Generation | MCQ warm-up, generazione primaria | skill solo-MCQ |
| M9 | Scheduling | decay annealato | pulse on/off |
| M10 | Misura | probe held-out generativo | "non degrada" non-misurato |
| M11 | Guessing-floor | N alto + audit lettere | N=2/3 unico, distribuzione sbilanciata |
| M12 | Decontaminazione | istanza-eval held-out | train-on-test |

## Reco (PROPOSTA — attende ok utente + validazione empirica)

**Cap + diversifica-formato + decay + misura-su-held-out-generativo.** NON pulse puri.

È in fondo una **domanda EMPIRICA**: la ratio esatta non è nota a priori → fissarla con un'**ablation** a 3 condizioni (MCQ-heavy / MCQ-light / MCQ-decay), misurando la degradazione su un held-out generativo. **Prossimo passo tracciato**: abbozzare il protocollo dell'ablation (quale held-out, le 3 condizioni esatte, metrica + soglia di degradazione accettabile). → [[../todo]].

## Links
[[discriminative-mcq-hard-distractors]] · [[../training-taxonomy/class-code-optimization]] (counterfactual-MCQ) · [[../training-taxonomy/class-confabulation-retrieval-failure]] · [[../training-taxonomy/class-effort-honesty-under-difficulty]] · [[../feedback_reward_hacking_principle]] · [[../feedback_reward_branch_field_trap]] · [[../feedback_transfer_always_cross_domain]] · [[../feedback_instrument_before_hypothesizing]] · [[../feedback_negative_examples_and_dataset_completeness]] · [[../training-taxonomy/dataset-construction-playbook]] · grill [E] (retrofit reward 3-segnali + MCQ-controfattuale) in [[../todo]]
