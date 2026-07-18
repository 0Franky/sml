---
name: class-frontend-ux-spacing-quality
description: Classe di training APPROVATA (utente msg 1317) — riconoscere/produrre la variante di SPAZIATURA giusta di un layout ancorandola alle leggi UX verificabili (prossimità→raggruppamento, spacing→leggibilità), non a un'euristica monotona "più spazio = meglio". Il difetto: valutare lo spacing come monotòno invece di riconoscere l'OPTIMUM (entrambi gli estremi rompono).
type: training-class
tags: [frontend, ux, visual-design, spatial-reasoning, gestalt, quality-judgment, tier-3, lora-vertical, held-out]
last_updated: 2026-07-08
---

# Classe di training — FRONTEND UX SPACING QUALITY (gradiente di spaziatura: riconoscere l'optimum, non "più spazio = meglio")

> **Stato**: APPROVATA (rule #18, utente msg 1317; origine nota-design 1295b, `wiki/_private/proposal-design-notes-2026-07-07.md` §P1).
> **Home**: area verticale **`frontend-ux`** → **LoRA Tier-3 frontend** (NON base). L'INTELLIGENZA Tier-1 ([[../project_base_model_intelligence]]) resta orchestrazione/decomposizione; il *coding/rendering* frontend è nella LoRA verticale. Ciò che questa classe addestra è il **giudizio di qualità** (skill di ragionamento spaziale ancorato a legge) che vive nella verticale.
> **Padre**: [[class-visual-design-quality]] (rule #20 — famiglia `visual-design-quality`, skill-radice: "giudicare la composizione visiva contro leggi verificabili, non contro il gusto"). **Sorella**: [[class-svg-spatial-composition]] (P3 — stessa radice legge-UX applicata a generazione/editing SVG e conformità struttura↔ground-truth). Vedi [[../feedback_intelligence_gap_to_training_class]], [[../feedback_hierarchical_training_classes]].

## Il gap

Il modello valuta la spaziatura di un layout con un'**euristica monotòna ingenua** — "più whitespace = più pulito/professionale" — invece di riconoscere che esiste un **OPTIMUM**: sia la compressione (varianti a=tutto-compresso, b=poco-spaziato) sia la **dispersione eccessiva** (d=troppo-spaziato) degradano la leggibilità e il raggruppamento semantico. Solo c=ben-spaziato-arieggiato cade nella banda giusta. Non è un buco **percettivo** (il modello vede i gap) né di **conoscenza** (sapere che "la legge di prossimità esiste" non basta): è un gap di **CALIBRAZIONE** — mappare la legge UX verificabile allo *spacing concreto* del contesto e trovare la **banda ottimale**, non l'estremo. Il fallimento tipico è il bias "d sembra ariosa quindi migliore" → il modello premia la variante che *rompe* il raggruppamento.

## La skill (imparata una volta)

Data una o più varianti di spaziatura di uno stesso design, prima di giudicare/produrre:

1. **Leggi la struttura semantica**: quali elementi appartengono allo *stesso* gruppo (devono stare *vicini*) e quali a gruppi *diversi* (devono essere *separati*); qual è la gerarchia di lettura.
2. **Applica la legge UX pertinente e verificabile**: prossimità → gap-intra-gruppo < gap-inter-gruppo (la vicinanza *codifica* l'appartenenza); spacing→leggibilità → interlinea/gutter dentro la banda leggibile; contrasto→gerarchia → i salti di gap marcano le sezioni.
3. **Controlla ENTRAMBI i modi di rottura** (bilaterale, non monotòno): sotto-spaziatura → elementi di gruppi diversi *fondono* (raggruppamento ambiguo, illeggibile); **sovra-spaziatura → elementi dello stesso gruppo si *disconnettono*** (il gruppo si spezza, costo di scansione, viewport sprecato → scroll). Entrambi sono regressioni.
4. **Condiziona al CONTESTO**: la banda ottimale è *context-dependent*, non un "arioso" fisso — una dashboard dati-densa/viewport mobile vuole la banda più stretta (aria = scroll = comparazione-a-colpo-d'occhio persa); un hero marketing vuole la banda più ampia. Scegli/produci la variante il cui spacing cade **nella banda derivata dalla legge per QUESTO contesto**.
5. **Ancora l'esito al misurabile**: raggruppamento correttamente percepibile + leggibilità/task-success, mai "è bello".

## Reward (ANCORATO all'OUTCOME)

- **OUTCOME**: la variante scelta/prodotta ha lo spacing **dentro la banda derivata dalla legge UX per il contesto dato**, verificato da un oracolo *numerico* sui gap (rapporto gap-intra/gap-inter coerente con la prossimità; interlinea/gutter nella banda leggibile) **e** sul risultato (assegnazione-gruppo corretta dell'oracolo, o proxy di scan-time/task-success). c **passa**; a/b **falliscono** per fusione dei gruppi; **d fallisce per disconnessione** dei gruppi.
- **Simmetria** (rule #21): un verdetto "regressione" su una variante SANA (es. bocciare c) è penalizzato *esattamente quanto* mancare una regressione reale su a/b/d. Falso-positivo = falso-negativo.
- **MAI** premiare la *cerimonia* ("per la legge di prossimità questi si raggruppano…" a parole) né un **voto estetico/"bello"**: il credito esige che lo spacing scelto *cada misurabilmente nella banda*, non la narrazione della legge ([[../feedback_reward_hacking_principle]] #10).

## Esempi NEGATIVI (rule #21 — il CONFINE della skill)

1. **d = troppo-spaziato = PEGGIO (rompe la monotonia)**. Stesso card-group con gap ×3: le card che formano *un* gruppo semantico ora galleggiano come isole scollegate, la relazione si perde, metà scende sotto la piega. Gold: **c ≻ d** (d è una *regressione*, non un miglioramento). Un modello che ordina "d migliore perché più arioso" o che risponde "sempre più aria" **perde** reward. È il negativo che rompe il bias monotòno "più spazio = meglio".
2. **Contesto denso dove l'ARIOSO è SBAGLIATO** (la skill NON deve scattare verso c). Trading terminal / spreadsheet / lista mobile in cui il compito è *comparazione-a-colpo-d'occhio* di molte righe: la variante arieggiata forza lo scroll e spezza il confronto visivo → **la variante corretta è la più STRETTA (ma ancora leggibile)**, non c. La risposta giusta è l'*opposto* dell'euristica "prendi l'arioso". Scegliere c qui fallisce l'outcome task-success (righe comparabili a colpo d'occhio).
3. **Falso-positivo critico su c corretto** (farming del segnale "ho trovato un problema"). Data la variante c già in banda, dichiararla "troppo stretta / troppo larga" per lucrare un verdetto-regressione. L'oracolo *sa* che c è ottimale → un "regressione" spurio su c è penalizzato come una regressione mancata su d. Neutralizza l'over-triggering "critica sempre".

## Transfer examples (domini DIVERSI — rule #19, cross-campo NON solo software)

> **Legge astratta invariante**: *la prossimità codifica l'appartenenza; esiste un OPTIMUM e ENTRAMBI gli estremi (troppo fitto / troppo rado) rompono la funzione.* È QUESTO che il modello deve generalizzare — non "il layout web". Dal banale al sistemico.

### A — Software / frontend (dove nasce la classe)
1. **Griglia di card responsive / spaziatura dei campi di un form**: gutter troppo piccolo → card di sezioni diverse fondono; gutter troppo grande → la riga si spezza in isole scollegate e spinge il contenuto sotto la piega. Optimum di banda per breakpoint.

### B — Vita quotidiana (banale → intermedio, non-software)
2. **Tipografia / impaginazione**: interlinea (leading) e spazio-tra-paragrafi — troppo fitto = muro di testo illeggibile; troppo lasco = le righe si "staccano", l'occhio perde il filo. Banda leggibile tipica ≈ interlinea 1.4–1.6× il corpo. Stessa curva a U.
3. **Layout di una slide / poster**: bullet stipati vs una parola che galleggia in una slide vuota — entrambi pessimi; i punti correlati vanno raggruppati per prossimità, i gruppi separati da gap maggiori.
4. **Disposizione di un negozio fisico (planogram / scaffali)**: prodotti stipati = cliente sopraffatto, non trova nulla; troppo radi = scaffale che sembra vuoto/esaurito, spreca lo spazio a reddito e segnala "negozio che va male". Esiste un numero-di-facing ottimale.
5. **Spaziatura ritmica in musica**: densità di note e pause — troppe note = confuso/affaticante; troppo silenzio = perde slancio/noioso. Le pause (lo "spacing") creano il fraseggio e fanno *raggruppare* i motivi. Prossimità-temporale = appartenenza melodica.

### C — Cross-dominio sistemico (agronomia · urbanistica · relazioni)
6. **Densità d'impianto in un frutteto / coltura (agronomia, ecologia)**: piante troppo fitte → competizione radicale, malattie che si propagano, resa/pianta scarsa; troppo rade → suolo sprecato, erosione, resa totale bassa. Esiste una **spaziatura agronomica ottimale**. È la prova più pulita che *"più spazio ≠ meglio"*: il caso-d è reale e costoso (dimostra il negativo #1 in un dominio senza pixel).
7. **Densità edilizia / verde urbano (urbanistica)**: città iper-densa → niente luce/aria, isola di calore; sprawl iper-rado → auto-dipendenza, infrastruttura sprecata, spazio pubblico morto. Banda di densità ottimale — stesso trade-off bilaterale a scala sistemica.
8. **Disposizione dei posti a un evento / tavolo (relazioni)**: sedie troppo vicine = scomodo, non ci si muove; troppo distanti = niente conversazione, sala fredda. La prossimità *fa* il gruppo sociale.

> Dal gutter di una card (banale) alla densità di un frutteto o di una città (sistemico) la **logica è identica**: prossimità = significato, e c'è un optimum con due bordi di rottura. Chi ha imparato la LOGICA la applica ovunque.

## Label-generation

- **Mutazione/oracolo da UN ground-truth** (riusa il pattern [[../../harness/verifiers/deceptive-task-gen]]): prendi **un layout c** con spacing nella banda ottimale *per una legge UX dichiarata in fixture*, poi scala programmaticamente i gap → **a = ×0.15** (tutto-compresso), **b = ×0.5** (poco-spaziato), **d = ×3** (troppo-spaziato). Le coppie **{variante, verdetto}** sono **vere-per-costruzione**: il verdetto = {regressione-fusione (a,b), OPTIMAL (c), regressione-disconnessione (d)} è *derivabile* dai gap mutati + dalla legge, non da conoscenza-del-mondo.
- **Fixture self-contained (#22)**: ogni item porta *in-context* la struttura del layout, i **valori di spacing concreti** (gutter px, rapporto interlinea, gap-intra vs gap-inter), la **legge UX applicabile enunciata** e il **contesto** (dati-densi vs hero). Il verdetto è così *vero-per-costruzione* — l'esempio testa il RAGIONAMENTO spaziale, non il recall di una nozione UX del mondo reale (coerente con i gold Q a fixture di codice; le nozioni-del-mondo verificate+citate restano ai task di conoscenza area-12).
- **Condizionamento al contesto** (anti "sempre c"): varia la banda ottimale col contesto (banda-stretta per tabella-densa vs banda-ampia per hero) → il *target si sposta*, così l'oracolo premia la banda-per-contesto e non una posizione fissa.
- **Demo SFT + RL**: traiettorie che mostrano il **check bilaterale** (sotto→fusione E sopra→disconnessione) + la scelta della variante in-banda + il rifiuto esplicito di d come sovra-spaziata; **RL sull'outcome misurato** (assegnazione-gruppo corretta / task-success) sopra le demo, non sulla forma del ragionamento.

## Hack-check (OBBLIGATORIO)

- **Bias monotòno "più spazio = meglio"** → neutralizzato dal **negativo d** (troppo-spaziato = PEGGIO, #21): l'oracolo ordina **c ≻ d**, quindi un modello che risponde "d migliore" o "sempre più aria" fallisce misurabilmente. La curva a U è nella label, non un giudizio soggettivo.
- **Collasso su "sempre c" / scorciatoia posizionale** (prendi l'opzione etichettata 'c' o la 3ª) → neutralizzato: **etichette/posizioni delle varianti mescolate** + **optimum condizionato al contesto** (nei contesti densi la variante *più stretta* è quella giusta, negativo #2) → "sempre l'ariosa" sbaglia una frazione misurabile; contesti **held-out**.
- **Cerimonia di legge-UX** (recitare "per la prossimità questi si raggruppano…" senza che lo spacing scelto cada nella banda) → **0**: reward solo quando lo spacing prodotto/selezionato è *numericamente* in banda ([[../feedback_reward_hacking_principle]] #10).
- **Hack estetico / "bello"** (ottimizzare un voto di gusto umano) → escluso: reward ancorato a **legge verificabile** (rapporto gap-intra/inter, banda-interlinea) + **outcome** (raggruppamento corretto, task-success), mai a uno score estetico arbitrario.
- **Over-fit ai design visti** (memorizza i layout della fixture) → mitigato: **design held-out** + **transfer cross-dominio** (frutteto, musica, urbanistica) che *costringono* la legge astratta invece del pixel-recall; l'istanza-osservata resta held-out di validazione (decontaminazione #18, [[../feedback_intelligence_gap_to_training_class]]).

## Links
[[class-svg-spatial-composition]] (sorella — stessa radice legge-UX su SVG/ground-truth) · [[class-metacognitive-self-audit]] (nonno-metodo: audit prima di committare un giudizio) · [[class-resource-appropriate-substitution]] / [[class-constraint-fit-decision]] (parenti dell'"appropriatezza-al-contesto") · [[../concepts/compositional-curriculum-thinking-optimization]] · [[../concepts/training-set-construction-principles]] · [[../project_base_model_intelligence]] (Tier-1 intelligenza vs LoRA verticale Tier-3) · [[../feedback_reward_hacking_principle]] · [[../feedback_intelligence_gap_to_training_class]] · [[../feedback_transfer_always_cross_domain]] · [[../feedback_hierarchical_training_classes]] · [[../feedback_negative_examples_and_dataset_completeness]] · [[../harness-experiment-log]]
