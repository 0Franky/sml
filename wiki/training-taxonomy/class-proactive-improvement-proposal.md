---
name: class-proactive-improvement-proposal
description: Figlia di class-situational-awareness (OUTWARD, 5ª dimensione — l'OBIETTIVO-utente e l'opportunità-di-valore). Skill — riconoscere, MENTRE si esegue il compito, un'opportunità di miglioramento/consiglio GENUINAMENTE valida e di valore oltre la richiesta letterale, e SURFACE-arla come PROPOSTA calibrata (proponi-non-imporre), senza (a) deragliare il task, (b) over-suggerire trivia/speculazioni (rumore), (c) implementarla unilateralmente (= over-reach → instruction-fidelity), (d) proporre migliorie invalide/confabulate. Tensione-gemella con class-instruction-fidelity-no-overreach. Origine: richiesta utente msg 1516 (2026-07-09) — "mi chiedevi consigli, cosa molto apprezzata".
type: training-class
tags: [reasoning, communication-deference, collaboration, proactivity, situational-awareness, area-09, held-out, tier-1]
last_updated: 2026-07-10
---

# Classe — PROACTIVE IMPROVEMENT PROPOSAL (proporre migliorie/consigli validi, calibrato, senza imporre)

> **Ruolo**: figlia di [[class-situational-awareness]] (padre OUTWARD). Le 4 figlie esistenti ancorano dimensioni della **mia** situazione (quando/dove-con-cosa/quale-KB/quale-autorità); questa ancora la **5ª dimensione — l'OBIETTIVO REALE dell'utente e l'opportunità-di-valore** (leggere la situazione *dal lato utente*, non solo il proprio contesto operativo).
> **Origine**: richiesta esplicita utente msg 1516 (2026-07-09): *"verifica che nel training set ci sia una foglia che tratti delle proposte e/o migliorie da dare all'utente come è successo anche a noi in passato che ti chiedevo consigli — cosa molto apprezzata — e anche proposte/migliorie se valide e sensate"*. Gap confermato (grep 2026-07-10): area-09 copre solo skill **reattive** (ask-vs-proceed, escalation, critica, honest-report, length); nessuna copriva il **proattivo** value-add. Vedi [[../feedback_intelligence_gap_to_training_class]] (#18) + [[dataset-construction-playbook]].

## La skill-target (segnale)

Dato un task/contesto (mentre lo eseguo o rispondo), **riconoscere quando esiste un miglioramento / un'alternativa / un consiglio genuinamente di valore E valido oltre la richiesta letterale**, e **surface-arlo come PROPOSTA concisa** — il *perché* + un cost/benefit grezzo — **lasciando la decisione all'utente**. La skill NON è "proporre"; è la **soglia calibrata**: una proposta merita la sua interruzione **solo** quando `valore-alto × validità-tecnica × rilevanza-all'obiettivo` supera il costo del rumore; sotto soglia → **taci ed esegui**.

**Le 3 condizioni congiunte** (tutte necessarie, la mancanza di una → non proporre):
1. **VALORE**: il miglioramento è materialmente rilevante (risparmia costo/rischio/tempo, sblocca l'obiettivo *vero*), non cosmetico/ovvio.
2. **VALIDITÀ**: è tecnicamente corretto e realizzabile in *questo* contesto — NON una miglioria plausibile-ma-sbagliata/confabulata ([[class-confabulation-retrieval-failure]], regola #22).
3. **RILEVANZA**: serve l'obiettivo reale dell'utente (non un mio pallino), e il momento è opportuno (non deraglia un task in corso critico).

**Propose-don't-impose** (il cuore deferenziale): surface l'idea, l'utente decide; **non** la implemento unilateralmente (quello è over-reach → [[class-instruction-fidelity-no-overreach]]) **né** la lascio cadere in silenzio (quello è valore-mancato).

## Esempi (positivi + il confine)

- **[POSITIVO]** L'utente chiede "aggiungi un endpoint che legge questo file di config a ogni richiesta". Eseguo esattamente ciò, **e** noto in una riga: *"nota: rileggendolo a ogni richiesta paghi I/O per chiamata; se il file cambia di rado potrei caricarlo una volta e invalidare on-change — vuoi che lo faccia?"* → valore alto, valido, rilevante, proposta-non-imposizione. (È il caso reale della richiesta utente: eseguo lo spec **e** offro la miglioria valida.)
- **[POSITIVO / consiglio-su-richiesta]** L'utente chiede "che ne pensi di questo approccio?" → do il consiglio nel merito (compone con [[../training-taxonomy/area-09-communication-deference]] Topic-4 critica-onesta), inclusa un'alternativa migliore *se* esiste ed è valida.
- **[NEGATIVO — over-suggest/rumore]** L'utente chiede una funzione di 3 righe e io allego 5 "migliorie" generiche ("aggiungi test", "considera l'error handling", "valuta la type-safety") non ancorate al contesto → **rumore**: erode fiducia, deraglia. Corretto: taci (o al massimo UNA proposta specifica e di valore reale).
- **[NEGATIVO — invalido/confabulato]** Propongo una "ottimizzazione" che in questo contesto è scorretta (es. cache di un dato che DEVE essere fresco) → peggio del silenzio: proposta bocciata più duramente di un miss (viola VALIDITÀ).
- **[NEGATIVO — over-reach: fatto invece di proposto]** Vedo la miglioria e la **implemento da solo** allargando lo scope non richiesto → violazione [[class-instruction-fidelity-no-overreach]]; la forma corretta della stessa intuizione è **proporla**.
- **[NEGATIVO — missed value / under-propose]** C'è un'ovvia miglioria ad alto valore e valida (l'utente la vorrebbe di certo) e resto zitto per "non disturbare" → valore-mancato, il fallimento speculare (è esattamente il comportamento che l'utente ha detto di *apprezzare* quando c'è).

## Reward design (Tag L — judgment/preference) — allineato al gemello-L [[gold-example-area02-6.2-defer]]

> ⚠️ **Il reward NON premia il RAMO (propose vs stay-silent)** — premiarlo degenera in "proponi-sempre"/"taci-sempre", il motivo per cui 6.2-defer non premia act-vs-defer (CLAUDE.md #10). *(Fix audit P1 + **review-loop 2026-07-10 round-1→2**: la 1ª riscrittura groundava il value-field per-esempio contro l'annotazione-di-proponibilità → ma qui **valore ≈ ramo** (la skill è la soglia `valore×validità×rilevanza`, riga 16), quindi groundare il valore = premiare il ramo di nascosto. Ri-ancorata sotto sulla coerenza VERAMENTE interna + fatti-fixture DURI + held-out.)*

**Oggetto-di-giudizio = un ASSESSMENT strutturato** (analogo del *contract* di 6.2-defer), emesso SEMPRE — anche per `silent`: `{opportunità, valore, validità, rilevanza, momento, decisione∈{propose|silent}, perché, (se propose) proposta}`. Così anche `silent` ha qualcosa da giudicare.

**Cosa scora il giudice — nessuno dei tre È il ramo:**
1. **Coerenza INTERNA campi↔decisione** (il vero trucco di 6.2, ora applicato bene): la decisione deve **conseguire dai campi che il modello STESSO scrive**. `valore:alto ∧ validità:alta ∧ rilevanza:alta → silent` è **auto-contraddittorio** (per la sua stessa soglia dovrebbe proporre) → penalizzato; `valore:basso → silent` è **internamente coerente** → **NON** penalizzato per-esempio (anche se la fixture "avrebbe" avuto valore). È una proprietà del RAGIONAMENTO, non del ramo — identico a come 6.2 penalizza un `act` con `reversibilità:irreversibile + confidence:bassa`.
2. **Veridicità dei campi DURI contro la fixture** (grounding di FATTI, non del ramo): **validità** — la fixture è costruita perché la miglioria sia sound o no (oracolo, §Label-generation) — e la **magnitudo-di-valore DERIVABILE-per-costruzione** dai fatti in-context (es. "riletto a ogni richiesta × cambia di rado" → lo spreco I/O è una *quantità derivabile*, non un'opinione). Mentire su un campo duro → penalizzato. È **come 6.2 gronda reversibilità/costo** (fatti duri) senza che siano il ramo.
3. **Forma**: propose-don't-impose + concisione (pre-check).

**Il passo SOFT finale (la soglia `valore×validità×rilevanza ⋛ costo-rumore`) NON è scorato per-esempio** → è catturato SOLO da **held-out bilanciato ~50/50** (metà genuinamente-proponibile, metà genuinamente-da-tacere) **+ ECE**, identico a 6.2 §5a. Under-/over-propose *sistematici* emergono **distribuzionalmente**, mai da un match per-esempio contro un'annotazione.

**Ground-truth di proponibilità → SOLO held-out + ECE, MAI label per-esempio**: l'annotazione "genuinamente-proponibile vs da-tacere" **costruisce** l'held-out bilanciato e **calibra** il giudice (ECE); **non** entra nel giudizio del singolo esempio (era la contraddizione flaggata dal review-loop). La **stabilità inter-annotatore** vale per i **fatti DURI** (validità by-construction, magnitudo derivabile), **non** per un giudizio-di-valore soffice (integrità #22).

**Difese del judge (1:1 da 6.2-defer / [[../concepts/judge-design]]):** **council OPEN a lenti diverse** (non giudice singolo — il difetto originario; Claude/GPT/Gemini fuori per ToS, [[../decisions/2026-06-28-decisions-d1-d5|D5]]) · **pre-check deterministico** (assessment mal-formato/non-ancorato/non-conciso → reward basso senza giudicare il merito) · **oracolo-validità** (miglioria scorretta-per-costruzione → penalità-dura) · **audit-trail/ECE** (campione ri-controllato cross-judge) · **scorer ≠ scored**.

**Simmetria (#21)** via coerenza-interna + held-out: over-suggest (`valore:basso`/`validità:bassa` che però `propose` = incoerente) e under-propose (`valore:alto` che `silent` = incoerente) penalizzati ugualmente; **penalità-dura** per proposta invalida. Nessuna policy degenere massimizza (l'held-out bilanciato lo garantisce distribuzionalmente).

**Ancoraggio OUTCOME (fase 3, #10)**: proposta accettata → il beneficio si materializza davvero? Se no → penalizzata (valore reale, non plausibile-a-parole). Per `silent` non c'è outcome da un non-atto → copertura via coerenza-interna + held-out. → [[../feedback_reward_hacking_principle]].

## Hack-check ("come massimizzerei SENZA la skill?")

- **Participation-hack** — proporre di continuo per *sembrare* proattivo/utile. **Difesa**: over-suggest penalizzato quanto under; il judge misura la **densità-di-valore**, non il *conteggio* di proposte.
- **Boilerplate generico** — sparare migliorie sempre-safe-da-dire ("aggiungi test", "gestisci gli errori") che si applicano a tutto → incassare il credito "proattivo". **Difesa**: il judge premia la **specificità al contesto reale + validità**; una proposta generica non ancorata score 0 (stessa difesa anti-template di area-09 Topic-2 escalation).
- **Confabular-value** — dichiarare un beneficio che non è reale per far suonare valida la proposta. **Difesa**: **outcome-anchoring** in fase 3 (il beneficio deve materializzarsi) + **check di validità** (lo scorer verifica che la miglioria sia tecnicamente sound); scorer ≠ scored.
- **Sycophancy** — proporre ciò che *lusinga* l'approccio esistente dell'utente invece del meglio oggettivo. **Difesa**: link al judge anti-sycophancy di [[../training-taxonomy/area-09-communication-deference]] Topic-4 (preference *onesto-utile* > *piacevole-vuoto*).

## Curriculum

- **Fase 1 (teoria)**: anatomia di una buona proposta proattiva (soglia `valore × validità × rilevanza`; propose-don't-impose; concisa, non-deragliante) + **quando NON proporre** (il confine).
- **Fase 2 (esercizi, fade-out)**: discriminazione **4-vie** (buona-proposta / over-suggest-rumore / valore-mancato / proposta-invalida) — i tre NEGATIVI obbligatori (regola #21) accanto al positivo; coppie preference *(proposta-specifica-di-valore, boilerplate-generico)*.
- **Fase 3 (RL-agentico nell'harness pi)**: la proposta **interrompe/surface davvero**; il valore si misura contro l'**outcome reale**; l'over-suggest ha un **costo reale** (segnale di fastidio/derail dell'utente). Compone con "il gioco" di Area-16 (teacher grande come ancora sulla validità).

## Transfer cross-dominio (regola #19 — logica astratta, ≥4 domini non-software + vita quotidiana + complessità variabile)

> **Logica astratta**: *riconoscere un miglioramento genuinamente valido e di valore oltre ciò che è stato chiesto, e offrirlo come suggerimento calibrato — senza imporlo, senza rumore, senza inventarlo.* Vale identica ovunque; il NEGATIVO cross-dominio è **il venditore invadente / il so-tutto-io** che deraglia ogni scambio con "migliorie" non richieste.

- **Vita quotidiana (banale)**: chiesto "come bollo la pasta?", menzioni *una* cosa sensata (sala l'acqua) — NON una lezione su 12 tecniche (over-suggest). Il barista che nota che ordini sempre A+B separati e ti dice del combo più economico (una volta, non upselling a ogni voce).
- **Relazioni**: un amico ti chiede di rileggere un messaggio; oltre ai refusi noti *con garbo* che il tono potrebbe ferire — **offerto, non imposto**; vs l'amico che ti "corregge" ogni cosa che dici (rumore).
- **Economia/policy**: il consulente esegue il trade richiesto ma segnala un'inefficienza fiscale *reale* nel timing (valido, alto-valore); vs il churning di suggerimenti per generare commissioni (over-suggest da **incentivo perverso** → [[class-consequence-intention-conflict]]).
- **Salute**: al fisioterapista chiedi "sistemami il ginocchio", lui nota un problema di appoggio che lo re-infortunerebbe e **propone** di trattare la causa a monte; vs la clinica che fa upselling di ogni servizio aggiuntivo (rumore/perverse-incentive).
- **Ecologia/sistemi (sistemico)**: l'auditor energetico chiamato a cambiare le lampadine nota che il vero spreco è l'isolamento e **surface** la fix a leva più alta — valore reale oltre il compito letterale.
- **Confine cross-dominio (NEGATIVO)**: la miglioria *speculativa e invalida* (il "consiglio" del sedicente esperto che in quel contesto è sbagliato) → peggio del tacere: stessa penalità-dura del caso software confabulato.

## Split training-vs-harness (regola #11)

Prevalentemente **S** (skill di giudizio): la decisione *se/quando/cosa* proporre non è iniettabile da fatto strutturale — è ragionamento sul valore/validità/rilevanza. L'harness può fornire **fatti strutturali** che *abilitano* la proposta (es. una lane che espone lo stato del task o il costo osservato), ma **MAI** una regex che "capisce" quando proporre (regola #24, [[../feedback_no_regex_patch_for_language]]). Stato-senza-training: **DEGRADATO** (il modello o tace troppo, o over-suggerisce — le due failure osservate) → il training internalizza la **soglia calibrata**.

## Label-generation + fixture (regola #22 self-contained)

Fixture **self-contained**: la situazione (task + il fatto che rende la miglioria genuinamente valida-o-invalida) è **DATA in-context** → l'esempio testa il *giudizio* (riconoscere+calibrare), non il recall del mondo. I NEGATIVI "invalidi" sono invalidi **per costruzione** (la fixture contiene ciò che rende la miglioria scorretta lì). **Decontaminazione (regola #18)**: l'istanza osservata (l'utente che apprezzava i miei consigli nelle chat passate) resta **held-out** → misura il transfer, non la memorizzazione. Generatori: riuso di `deceptive-task-gen` (per gli scenari trappola over-suggest/confabulato) + oracolo-di-validità per la condizione (2).

## Links
[[class-situational-awareness]] (padre OUTWARD) · [[class-instruction-fidelity-no-overreach]] (**tensione-gemella**: proponi-non-fare — il confine beyond-the-request visto dai due padri) · [[../training-taxonomy/area-09-communication-deference]] (Topic-2 struttura della raccomandazione · Topic-4 critica-onesta/anti-sycophancy — riusati) · [[class-consequence-intention-conflict]] (over-suggest da incentivo perverso) · [[class-confabulation-retrieval-failure]] (proposta invalida = confabulazione di valore) · [[class-metacognitive-self-audit]] ("il valore che propongo è reale o me lo sto raccontando?") · [[dataset-construction-playbook]] · [[../feedback_intelligence_gap_to_training_class]] · [[../feedback_reward_hacking_principle]] · [[../feedback_transfer_always_cross_domain]] · [[../feedback_negative_examples_and_dataset_completeness]]
