---
name: discriminative-mcq-hard-distractors
description: Metodologia di label-gen cross-cutting (NON una classe) — MCQ a distrattori-confondibili a coppie (4/6/10/16 opzioni = 2/3/5/8 minimal-pairs, una-sola-corretta) per affinare la discriminazione fine; applicabile a TUTTE le classi di ragionamento, in fase Recognition E Generation. Approvata utente msg 1372/1378.
type: concept
tags: [training, label-generation, methodology, hard-negatives, minimal-pairs, discrimination, reward-hacking, mcq, cross-cutting]
last_updated: 2026-07-08
---

# MCQ a distrattori-confondibili (hard-distractor / minimal-pairs)

> **Stato**: metodologia APPROVATA dall'utente (msg 1372 idea, msg 1378 conferma con i 5 fix). **NON è una classe di training** ([[../training-taxonomy]]) ma un **FORMATO di label-generation cross-cutting**: si applica come *variante-discriminazione* a molte classi esistenti (sign-wrap, confabulation, constraint-fit, consequence-intention…). Fonte: [[../_private/user-idea-mcq-hard-distractors-2026-07-08]] (gitignored). Discende dal principio-cardine [[../feedback_reward_hacking_principle]] e si compone con [[training-set-construction-principles]].

## Cos'è

Domande a **scelta multipla** con **4 / 6 / 10 / 16** opzioni strutturate in **coppie di quasi-gemelli** — rispettivamente **2 / 3 / 5 / 8 minimal-pairs**. Ogni opzione ha un *near-twin* che differisce su **UN dettaglio load-bearing** (minimal pair). **Una sola** opzione è corretta; **tutte le altre** contengono "pezzi fuorvianti" progettati per ingannare → l'item allena la **discriminazione fine**.

Il quasi-gemello della risposta corretta è l'**hard-negative primario** (differisce minimamente dal corretto lungo la feature che conta); le altre coppie sono famiglie di **near-miss secondarie**. [EXTRACTED] La struttura-a-coppie è l'interpretazione confermata di *"le risposte hanno sempre una coppia simile"* (msg 1372/1378).

## Perché (grounding ML)

- **Hard-negatives / minimal-pairs** [EXTRACTED]: distrattori massimamente confondibili forzano feature **discriminanti fini**, non shortcut. È il cuore del contrastive learning e dei benchmark "challenge" (ARC-Challenge, GPQA, MMLU-Pro).
- **Baseline-guess bassa** [EXTRACTED]: 4→16 opzioni abbassa il random-guess **25% → 6.25%** → meno **reward-da-fortuna** → anti-reward-hacking ([[../feedback_reward_hacking_principle]]).
- **Reward pulito** [EXTRACTED]: MCQ = **lettera corretta** = outcome-anchor deterministico, zero ambiguità di grading.
- Si aggancia a meccanismi già nostri: la mutation di [[../../harness/verifiers/deceptive-task-gen]], il discrimination-gate dei gold, il **near-miss** di [[../training-taxonomy/class-sign-wrap-blindspot]] ("la disguise casca solo se il dominio NON evoca l'edge"), la runtime-symbol-randomization.

## Applicazione DUALE — Recognition **e** Generation (esplicito utente msg 1378)

La stessa famiglia di distrattori confondibili si usa in **DUE fasi** per OGNI classe:

- **Recognition / fact-checking** — item MCQ classico: il modello **sceglie** la corretta fra le opzioni confondibili. Allena a **NON farsi ingannare** dal near-miss plausibile (il gemello-sbagliato style-matched).
- **Generation** — gli **stessi** distrattori confondibili alimentano il **self-check generativo**: il modello genera la propria risposta/azione, poi la **verifica contro i near-miss** — *"sto producendo la corretta o il gemello-plausibile-sbagliato?"*. È un training **contrastivo**: generare la corretta **E** rigettare esplicitamente il twin.

> **La generazione resta PRIMARIA** (fix #2): il lavoro reale del modello è GENERARE (risposta/azione), non scegliere fra opzioni date. L'MCQ è **ausiliario di affinamento-discriminazione**, sempre bilanciato con task generativi. Recognition-only rischia il **gap generativo** (bravo a scegliere, non a generare) → va sempre accoppiato alla fase Generation.

## I 5 fix (caveat accettati dall'utente — applicati punto per punto)

1. **Metodologia, non classe** — è **cross-cutting**: si applica come variante-discriminazione a sign-wrap, confabulation, constraint-fit, consequence-intention… Non va filata come singola classe taxonomy isolata. (Si *può* avere ANCHE una classe dedicata "fine-discrimination-under-confusable-options" se la skill addestrata **È** la discriminazione stessa — ma il default è la metodologia.)
2. **Recognition ≠ Generation** — applicare a **ENTRAMBE** le fasi (§Applicazione duale). La **generazione è primaria**, l'MCQ è affinamento-discriminazione ausiliario; mai spedire recognition-only.
3. **Qualità del distrattore = tutto** — ogni distrattore è sbagliato per una **ragione REALE (load-bearing)**, mai superficiale; il corretto è **inequivocabilmente** corretto. I "pezzi fuorvianti" migliori sono gli **errori che il modello DAVVERO fa** — near-miss/confabulazioni reali dai **failure-mode osservati** (aggancio a [[../feedback_intelligence_gap_to_training_class]] + mutation di [[../../harness/verifiers/deceptive-task-gen]]). **Style-matched** (stessa lunghezza / tono / specificità del corretto) per non lasciare tell. Modello di riferimento: i distrattori derivati da failure-mode reali di [[../training-taxonomy/class-sign-wrap-blindspot]] (naive-B = corretto-C mutato lungo la feature sign/boundary; near-miss = domini che evocano l'edge).
4. **Posizione SEMPRE randomizzata** (richiesta forte, msg 1378) — l'ordine delle opzioni è **sempre** randomizzato. Anche se il processo di generazione ha un bias (es. corretta-emessa-per-prima), randomizzando la corretta mappa a una **lettera uniformemente distribuita** → nessuna preponderanza di "corretta=C". Va garantito su DUE livelli: (a) **singolo item** → shuffle; (b) **dataset** → distribuzione **~uniforme** delle lettere-corrette (auditata). Aggancio a runtime-symbol-randomization. Previene il **position/letter bias** (always-C) che i modelli MCQ imparano.
5. **Exactly-one-correct + distractor-tell audit** — un **oracolo** garantisce **UNA sola** corretta (no multi-correct / ambiguo) **E** audita che **nessun cue superficiale** predìca la risposta: lunghezza, hedging, "all of the above", posizione, specificità. Senza questo audit il modello impara il **cue di superficie** invece della discriminazione (reward-hack del formato).

## Reward + hack-check

- **Reward** = **lettera corretta** → outcome pulito, deterministico ([[../feedback_reward_hacking_principle]]).
- **Guard anti-format-tell** (obbligatorio, altrimenti il reward-pulito è illusorio): distrattori **style-matched** (fix #3) + **audit tell** (fix #5) + **posizione randomizzata** su item e dataset (fix #4). Insieme impediscono al modello di **lucrare cue di superficie** anziché discriminare davvero.
- **Bilanciamento anti-gap** — Recognition-only rischia il **gap generativo** → si **bilancia sempre con la fase Generation** (self-check contrastivo). È l'analogo, sul formato MCQ, del principio "esempi negativi + reward simmetrico" di [[training-set-construction-principles]] #21: il near-twin è il **negativo massimamente informativo** che insegna il **confine** della discriminazione.

## Implementazione

[EXTRACTED] L'oracolo/generatore è **IMPLEMENTATO** in [[../../harness/verifiers/mcq-distractor-gen]] (`harness/verifiers/mcq-distractor-gen.mjs`, **test 11/0**):

- `assembleMCQ(spec, {nOptions, seed})` — costruisce l'item da `{correct, correctTwin, distractorPairs}` con **shuffle seeded** (mulberry32, determinismo riproducibile), coppie con `pairId`, lettere A.., corretta marcata (fix #4a);
- `auditMCQ(mcq)` — verifica **exactly-one-correct** + struttura-a-coppie + **distractor-tell** (`length-tell`, `banned-pattern` "all/none of the above"/"tutte le precedenti") → nessun cue superficiale predice la risposta (fix #3/#5);
- `positionBalance(mcqs, {tolerance})` — controllo **dataset-level**: la distribuzione delle lettere-corrette deve essere **~uniforme** (fix #4b — mai preponderanza "corretta=C"); ritorna `{pass, distribution, maxDeviation, worst}`;
- `VALID_N = [4,6,10,16]`, `mkRng`/`shuffle` seeded esportati.

I distrattori-CONTENUTO si generano come **mutazione del corretto lungo la feature load-bearing**, estendendo [[../../harness/verifiers/deceptive-task-gen]] (stesso paradigma trap-soundness `ref-PASS ∧ twin-FAIL`) — il modulo MCQ assembla+audita+randomizza sopra quei distrattori. Gemello architetturale: [[../../harness/verifiers/async-schedule-gen]] (oracolo strutturale self-contained).

## Come si compone con le classi

Su una classe di ragionamento esistente la metodologia si innesta così: si prende il **failure-mode reale** già validato (girando il modello), si genera il **near-twin** hard-negative mutando il corretto lungo la feature che conta, si style-matcha, si aggiunge alle famiglie di coppie fino a 4/6/10/16 opzioni, si **shuffla + audita** (exactly-one + tell + position-balance), e si usa in **entrambe** le fasi (recognition + self-check generativo). La **generazione resta primaria**; l'MCQ affina la discriminazione senza sostituirla.

## Links

[[training-set-construction-principles]] · [[../feedback_intelligence_gap_to_training_class]] · [[../feedback_reward_hacking_principle]] · [[../feedback_negative_examples_and_dataset_completeness]] · [[../training-taxonomy/class-sign-wrap-blindspot]] · [[../training-taxonomy/class-confabulation-retrieval-failure]] · [[../../harness/verifiers/deceptive-task-gen]]
