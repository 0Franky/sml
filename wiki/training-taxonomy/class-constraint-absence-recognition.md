---
name: class-constraint-absence-recognition
description: Classe di training PROPOSTA (#26, non validata) — quando NESSUNA dimensione discrimina fra le opzioni (sono equivalenti rispetto ai vincoli REALI del compito), riconoscere l'ASSENZA di base discriminante, DIRLO con motivazione e restare fermi (ammesso offrire un METODO per decidere, non una scelta mascherata da oggettiva) invece di FABBRICARE un vincolo per giustificare una risposta. Polo-degenere dell'asse di constraint-fit-decision. Negativi simmetrici — (i) vincolo c'è ma nascosto → non cercarlo e dire "è soggettivo"; (ii) vincolo non c'è → inventarne uno. Held-out = item N1 di E-COMP.
type: training-class
tags: [reasoning, metacognition, decision-making, calibration, anti-confabulation, self-audit, area-03, held-out, proposed]
last_updated: 2026-07-24
---

> # ⛔ NON VALIDATA — PROPOSTA (#26)
> Nulla qui è ratificato. La ratifica del contenuto resta dell'utente (proposta ≠ approvazione). Il **padre** è deciso ed esistente; le figlie/negativi/reward sotto sono proposta.

# Classe di training — RICONOSCERE L'ASSENZA-DI-VINCOLO (e affermarla, senza fabbricarne uno)

> **Padre**: [[class-constraint-fit-decision]] (PADRE già esistente e deciso, regola #20). Questa classe è il **POLO OPPOSTO MANCANTE** del suo asse, non una sorella scollegata (#20/#36): constraint-fit copre *"c'è una dimensione che discrimina → trova il fit"* (class-constraint-fit-decision.md:16); questa copre il caso **degenere** dello stesso asse — *"NESSUNA dimensione discrimina → riconoscilo, dillo, non inventarne una"*. Stessa muscolatura (mappare requisiti↔proprietà), stesso padre → coerenza-di-radice #36.
> **Sorella cross-dominio forte**: [[class-confabulation-retrieval-failure]] — questa è *"non fabbricare un VINCOLO"*, quella è *"non fabbricare un FATTO"*: stessa disciplina anti-confabulazione applicata alla **base decisionale** anziché alla base fattuale. Cross-link forte, ma la CASA resta constraint-fit (è lì che vive il difetto-del-reward, vedi §Amendment al padre).
> **Origine**: gap-scan 2026-07-24 su P1; difetto osservato in E-COMP ([[../harness-experiment-log]] §E-COMP, harness-experiment-log.md:353) — dare la mezza-skill "estrai il requisito load-bearing / dimensiona la risposta" tende a **peggiorare** il sapersi fermare (incatenamento-per-rito `3/12` vs `0/12` del controllo nudo, **sotto-soglia**, ipotesi coerente non fatto).

## Il gap

Al ragionatore si presentano ≥2 opzioni e deve sceglierne una. Il fallimento **non è percettivo** (legge le opzioni) **né di conoscenza** (i fatti sono dati): è che quando **nessuna proprietà delle opzioni combacia in modo diverso** coi vincoli REALI del compito — le opzioni sono **genuinamente equivalenti** rispetto a ciò che conta — il modello **non tollera l'indifferenza** e **fabbrica un vincolo** per razionalizzare una scelta ("prendo la A perché *[criterio inventato a posteriori]*"). È il gemello, sulla base **decisionale**, della confabulazione sulla base **fattuale**: colma un vuoto (qui: l'assenza di un discriminante) con un'invenzione coerente, presentata come oggettiva.

Il difetto ha **due poli**, entrambi da penalizzare (asse completo #36):
- **OVER-COMMIT / fabbricazione-di-vincolo**: il vincolo **non c'è** → il modello **ne inventa uno** pur di dare una risposta "motivata". [INFERRED dal segnale E-COMP: incatenamento-per-rito]
- **FALSA-PARALISI / "è tutto soggettivo"**: il vincolo **c'è ma è nascosto** → il modello **non lo cerca** e liquida con *"sono equivalenti, scegli tu"* per non fare il lavoro. È under-search travestito da umiltà.

## La skill (imparata una volta)

Prima di scegliere fra opzioni, **auditare la base discriminante**:

1. **Cerca la dimensione che discrimina** — mappa i **requisiti load-bearing** del compito contro le **proprietà** di ciascuna opzione (la skill-radice del padre, class-constraint-fit-decision.md:16). Questo passo **precede** ogni conclusione di equivalenza: dichiarare "sono uguali" **senza** averlo fatto è il polo falsa-paralisi.
2. **Se una dimensione discrimina → sei in constraint-fit**: scegli il fit (esci da questa classe, entra nel padre).
3. **Se NESSUNA dimensione discrimina** (dopo aver cercato) → **dillo esplicitamente e resta fermo con motivazione**: *"rispetto a ciò che conta qui — X, Y, Z — le opzioni sono equivalenti; non c'è una base oggettiva per preferirne una"*. **NON fabbricare** un criterio per forzare una scelta: un vincolo inventato **a posteriori** è il vettore con cui un bias/una preferenza-già-fatta si traveste da oggettività (vedi transfer B ed E — è corruzione/bias-laundering, non solo cerimonia).
4. **Ammesso: offrire un METODO, non una scelta** — quando la scelta è indifferente si può proporre un **tie-breaker dichiarato-arbitrario** (sorteggio equo, "scegli tu", primo-disponibile) **etichettato come tale**, oppure restituire la decisione all'utente. Un metodo-arbitrario-dichiarato ≠ un vincolo-inventato-spacciato-per-oggettivo.

Regola pratica: *"ho un discriminante REALE, o sto scrivendo un criterio per giustificare una scelta che ho già fatto?"*.

## Reward (ANCORATO all'OUTCOME + difesa #32)

L'esito da premiare è: **la conclusione di equivalenza/non-equivalenza corrisponde alla presenza-reale di un discriminante nella fixture, ED è EARNED (cercata), NON asserita**.

⚠️ **Difesa #32 — il ramo NON si gronda per-esempio contro un oracolo.** Il ramo da premiare = {dichiara-assenza ↔ trova-il-fit} è ≈ **funzione di un campo**: *"esiste una dimensione discriminante?"* (booleano ground-truth della fixture). Grondare quel campo per-esempio **re-introdurrebbe il reward-sul-ramo** (branch-hack, #32/#10). Quindi:

- **Il DETERMINANTE-del-ramo → segnale DISTRIBUZIONALE**, mai per-esempio: su un held-out **bilanciato 50/50** (metà item con discriminante presente, metà con opzioni realmente equivalenti) si misura la **calibrazione** della decisione-di-assenza (**ECE**). Un modello che dichiara-assenza *sempre* (o *mai*) crolla distribuzionalmente — è esattamente ciò che neutralizza le policy-forza-bruta (vedi §Gate).
- **Per-esempio si gronda solo l'INPUT NON-ramo**: quando il modello **afferma un discriminante**, quel discriminante **corrisponde a una proprietà REALE della fixture** (self-contained, vera-per-costruzione #22c) oppure è **fabbricato**? Questo è un check di **soundness** (correttezza del mapping requisito↔proprietà), ortogonale al ramo: un vincolo citato che **non matcha alcuna proprietà-fixture** = fabbricazione = FAIL **indipendentemente** dal ramo scelto. È l'unico grondaggio per-esempio ammesso, ed è un *input* (validità), non la *decisione*.
- **Distinzione chiave richiesta dal task** — «ha cercato e non c'è» vs «non ha cercato e ha detto che non c'è»: emerge dall'**OUTCOME sulla fixture bilanciata**, non da un premio-alla-ricerca (premiare "ha cercato" sarebbe cerimonia gameabile con l'always-search). Meccanismo: negli item negative-(i) **il discriminante È presente nella fixture** → chi non l'ha cercato **dichiara assenza a torto** → l'outcome FALLISCE. Chi l'ha cercato lo trova → entra in constraint-fit → PASS. Negli item positivi (equivalenza vera) **nessun** discriminante è presente → dichiarare assenza è corretto E nessun vincolo citabile esiste → chi ne fabbrica uno FALLISCE il check-soundness. Così i due casi si separano **senza** grondare il ramo.

Il credito è sull'esito+soundness, MAI sulla frase pronunciata (participation-hack). Le demo SFT mostrano la traiettoria (cerca → non-c'è → dillo/metodo); l'RL premia l'outcome bilanciato sopra le demo.

## Esempi NEGATIVI (regola #21 — simmetrici, entrambi i poli)

Senza i negativi, *"di' sempre che sono equivalenti"* **oppure** *"trova sempre un vincolo"* sarebbero hack che passano. La simmetria li uccide entrambi.

1. **(polo OVER-COMMIT) Vincolo NON c'è → inventarne uno = FAIL.** Fixture: due opzioni equivalenti su ogni criterio rilevante. Il modello risponde *"scelgo la A perché [criterio non presente/non pertinente nella fixture]"*. Il criterio citato non matcha alcuna proprietà-fixture → **fabbricazione** → FAIL (check-soundness). Il gold: dichiarare l'equivalenza + eventuale metodo-arbitrario.
2. **(polo FALSA-PARALISI) Vincolo C'È ma nascosto → non cercarlo e dire "è soggettivo" = FAIL.** Fixture: le opzioni **differiscono** su una dimensione load-bearing presente-ma-non-in-primo-piano (una clausola, un vincolo di compatibilità, una scadenza). Il modello liquida con *"sono equivalenti, scegli tu"* senza aver mappato. Negli item bilanciati l'outcome fallisce: **c'era** un fit. Il gold: cercare, trovare il discriminante, scegliere il fit (→ padre).
3. **(confine / non-triggering) Discriminante presente e ovvio → NON dichiarare falsa-equivalenza né esitare.** Se una dimensione discrimina in modo chiaro, la mossa è **scegliere il fit direttamente** (constraint-fit puro): attivare il "sono equivalenti, decidi tu" qui è falsa-paralisi → FAIL. Il credito va al **non-triggering** di questa classe.

> Simmetria: il falso-positivo (dichiarare assenza quando un vincolo c'è) è penalizzato **quanto** il falso-negativo (fabbricare un vincolo quando non c'è). Nessun default fisso vince — specchio della simmetria cheap↔precious del padre (class-constraint-fit-decision.md:33) e del negativo "scelta di gusto → deferisci" di [[class-instruction-phase-clarification]] (class-instruction-phase-clarification.md:52).

## Transfer examples (domini DIVERSI — regola #19, ≥3 NON-software)

> La logica astratta è UNA: *cerca il discriminante; se non c'è, dillo e non inventarlo; se c'è ma nascosto, non spacciare l'indifferenza per verità*. Vale identica fuori dal software.

### A — Vita quotidiana (banale)
1. **Due lattine di pelati** stessa marca, prezzo, peso, scadenza, lotto sullo scaffale: **equivalenti** → prendine una qualsiasi, non *"quella a destra è più fresca"* (vincolo inventato). Confine (vincolo-nascosto, negative-(i)): una ha un'offerta 3×2 sul cartellino → il discriminante **c'è** (costo) → dire "sono uguali" senza guardare il cartellino = falsa-paralisi.

### B — Economia / procurement (sistemico, con danno reale)
2. **Due fornitori con offerte identiche** su prezzo, SLA, tempi, referenze per una commessa: la scelta è **indifferente** rispetto ai criteri → dichiaralo e usa un **metodo equo** (sorteggio documentato) invece di **fabbricare** un criterio ad-hoc per giustificare il preferito. Qui il vincolo-inventato **non è cerimonia**: è il meccanismo con cui un **bias/una tangente** si traveste da valutazione oggettiva (bias-laundering). Confine: uno ha una penale nascosta in clausola contrattuale → discriminante **reale** non cercato.

### C — Medicina (sistemico, benigno)
3. **Due antibiotici** egualmente efficaci, stesso spettro, stesso costo, nessuna allergia/interazione del paziente: **equivalenti** → prescrivi l'uno o l'altro senza inventare una falsa superiorità. Confine (negative-(i)): paziente in gravidanza e uno dei due è controindicato → esiste una dimensione che discrimina → dire "sono uguali" per saltare l'anamnesi = falsa-paralisi pericolosa.

### D — HR / selezione (cross-dominio)
4. **Due candidati con profili sostanzialmente equivalenti** sui criteri del ruolo → dichiara la parità e usa un **tie-breaker dichiarato-arbitrario**, invece di inventare a posteriori un criterio (che spesso maschera un pregiudizio). Confine: uno ha una certificazione **richiesta** dal ruolo che l'altro non ha → discriminante reale → constraint-fit.

> Dal banale (pelati) al sistemico con danno reale (procurement, sanità) il modello impara **la logica** — cerca-il-discriminante / non-fabbricarlo / non-fingere-l'indifferenza — non il dominio. B ed E mostrano perché la fabbricazione-di-vincolo è **dannosa oltre la cerimonia**: è il canale della corruzione e del bias.

## Split #11 (F harness / S skill)

- **S (skill — training, target model)**: riconoscere l'assenza di dimensione discriminante DOPO aver cercato · distinguere "cercato e non c'è" da "non cercato" · **non fabbricare** un vincolo · offrire un **metodo dichiarato-arbitrario** invece di una scelta mascherata da oggettiva. È intelligenza/metacognizione → vive nel modello (Tier-1, [[../project_base_model_intelligence]]).
- **F (harness)**: **nessun meccanismo nuovo richiesto** per le fixture self-contained (#33 riusa-l'esistente: le proprietà delle opzioni sono in-context, è lettura pura). Solo se le opzioni richiedono di ispezionare stato esterno reale (prezzi/filesystem/DB) serve un tool di **retrieval** (F) — ma quello è già coperto dai canali esistenti, non si costruisce qui.
- **Stato-senza-training**: **DEGRADATA-MA-UTILE** sugli item facili (E-COMP: il modello nudo compone già su item di vita quotidiana), **INERTE** sul regime discriminativo (vincolo nascosto profondo, distrattori) — che è esattamente il regime-bersaglio del training (E-COMP §conseguenza operativa: servono item dove il modello nudo fallisce). Non è un guscio-inerte spedito come feature: è S che internalizza un fix su un regime dove il nudo confabula.

## Held-out di validazione (#18 — decontaminazione)

**Item N1 di E-COMP** ([[../harness-experiment-log]], uno dei 4 negativi dove la risposta giusta è FERMARSI, harness-experiment-log.md:339): *scegliere fra bianco opaco e verde salvia per un ambiente dove — per costruzione della fixture — tutte le dimensioni rilevanti (resa, costo, copertura, durata) sono equivalenti*. Il gold: riconoscere l'equivalenza + non fabbricare una preferenza. **Tenuto HELD-OUT**: mai nel training set; se il modello ha imparato la skill lo risolve **per transfer**, non per memorizzazione (msg 1125). È anche la **metrica di successo**.

## Amendment al PADRE richiesto da questa classe (gap-scan orizzontale #36)

Il difetto-del-reward **vive nel padre**: se [[class-constraint-fit-decision]] premia *sempre* "produrre un vincolo che regge", **crea** l'hack "fabbrica un vincolo plausibile" (è la lettura meccanicistica del segnale E-COMP, harness-experiment-log.md:353). → **PROPOSTA**: iniettare nel reward DI constraint-fit un **negativo simmetrico** (#21) — sugli item dove **nessuna dimensione discrimina**, "trova comunque un vincolo" deve **fallire** l'oracolo. Così il polo-assenza è difeso **dentro** il padre, non solo in questa figlia. *(Non applico la modifica al file del padre: è una proposta, attende ratifica #26.)*

## Hack-check (OBBLIGATORIO)

- **Default fisso** (*sempre* "sono equivalenti" / *sempre* "trovo un vincolo") → neutralizzato dall'**held-out bilanciato 50/50** + ECE: ogni polo perde metà degli item (vedi §Gate). Mai per-esempio sul ramo (#32).
- **Vincolo-inventato spacciato per oggettivo** → check-soundness per-esempio: il discriminante citato deve matchare una proprietà-fixture reale, altrimenti FAIL.
- **Premio-alla-ricerca** (grondare "ha cercato") → **evitato**: la distinzione cercato/non-cercato emerge dall'outcome sulla fixture bilanciata, non da un segnale-di-processo gameabile con always-search.
- **Over-fitting all'istanza** → E-COMP N1 e ogni istanza osservata restano HELD-OUT (#18).

## Links
[[class-constraint-fit-decision]] (padre — polo "c'è") · [[class-confabulation-retrieval-failure]] (sorella cross-dominio — "non fabbricare un FATTO") · [[class-instruction-phase-clarification]] (negativo scelta-di-gusto→deferisci) · [[class-metacognitive-self-audit]] · [[../harness-experiment-log]] (E-COMP) · [[../concepts/oracle-design-pitfalls]] · [[../concepts/training-set-construction-principles]] · [[../feedback_reward_hacking_principle]] · [[../feedback_reward_branch_field_trap]] (#32) · [[../feedback_optimization_first]] · [[../feedback_gap_scan_is_mine]] (#36) · [[area-03-reasoning-scientific-method]]
