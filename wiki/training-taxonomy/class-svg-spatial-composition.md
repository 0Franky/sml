---
name: class-svg-spatial-composition
description: Classe di training APPROVATA (utente msg 1317) — generare/editare una composizione visiva (SVG), confrontarla col ground-truth per STRUTTURA (relazioni spaziali, non pixel), e validarla contro le leggi di design/UX (prossimità=significato, allineamento, gerarchia, leggibilità). Il difetto: composizioni dove gli elementi sono troppo vicini/disallineati/gerarchia rotta → illeggibili = UX pessima. + FACET OBJECT-DEPICTION (msg 1535, approvata 1545): comporre le PARTI di un oggetto su layer distinti perché il render del tutto lo DEPINGA correttamente (simmetria/connettività/ordine-relativo), reward geometrico deterministico NON-percettivo.
type: training-class
tags: [visual-design, svg, spatial-composition, object-depiction, ux-laws, ground-truth-comparison, structural-similarity, vertical, area-svg-spatial, held-out]
last_updated: 2026-07-10
---

# Classe di training — SVG SPATIAL COMPOSITION (composizione spaziale che ignora le leggi di design → illeggibile)

> **Stato**: APPROVATA (rule #18, utente msg 1317).
> **Padre**: [[class-visual-design-quality]] (rule #20) — famiglia "visual-design-quality" (l'output visivo soddisfa leggi di design/UX *misurabili*, non estetica soggettiva). **Sorella**: [[class-frontend-ux-spacing-quality]] (stesse leggi di prossimità/allineamento/gerarchia applicate al layout frontend/DOM; questa figlia le applica alla **composizione SVG** con confronto al ground-truth). **Zia filosofica**: [[class-metacognitive-self-audit]] — confrontare la propria composizione col ground-truth È un audit anti-reward-hacking ([[../feedback_reward_hacking_principle]]): non fidarsi della superficie (i pixel), àncora alla struttura.
> **Split Tier / vertical** ([[project_base_model_intelligence]], [[../concepts/training-vs-harness-classification]]): la skill Tier-1 qui è il **giudizio spaziale** — decomporre la scena, estrarre le relazioni, confrontarle strutturalmente col ground-truth, validare le leggi, decidere le correzioni. L'**emissione della sintassi SVG** (path, transform) è delegata alla **LoRA verticale frontend/svg** — il Tier-1 possiede il *piano spaziale e la critica*, non il codice. Home: vertical **area-svg-spatial**, adiacente a frontend-ux.

## Il gap

Il modello produce una composizione visiva e la considera "fatta" perché tutti gli elementi sono *presenti* — ma **non audita le RELAZIONI spaziali**: elementi correlati finiscono lontani, elementi non correlati appiccicati, assi di allineamento incoerenti, gerarchia (titolo/corpo, focale/contorno) invertita, spaziatura sotto la soglia di leggibilità. Non è un buco **percettivo** (le coordinate/bounding-box sono note ed esplicite) né di **conoscenza** (sa cos'è la prossimità): è **mancata validazione della composizione contro un riferimento strutturale e contro le leggi di design/UX**. Sintomo tipico: due elementi *troppo vicini* → illeggibili = UX pessima; oppure una variante "pixel-quasi-uguale" al target ma con la **gerarchia rotta** (il modello si fida della somiglianza di superficie).

## La skill (imparata una volta)

Prima di dichiarare una composizione valida, eseguire **estrai-relazioni → confronta-struttura → valida-leggi → correggi**:

1. **Estrai le RELAZIONI** (non i pixel): dalla scena ricava, per ogni elemento, bounding-box, gruppo semantico di appartenenza, asse di allineamento condiviso, rango di gerarchia (dimensione/peso/posizione), e le distanze *inter-gruppo* vs *intra-gruppo*.
2. **Confronta col ground-truth per STRUTTURA**: relazione-isomorfismo — stesso raggruppamento, stesso ordinamento relativo (segno di Δx/Δy), stessa topologia e gerarchia — **invariante a traslazione/scala** (il target ridimensionato o spostato è ancora "corretto"). MAI identità pixel-per-pixel.
3. **Valida contro le leggi di design/UX** (vere-per-costruzione, §Label-gen): **prossimità** = elementi correlati vicini / non correlati separati (la prossimità *codifica il significato*); **allineamento** = assi condivisi, residuo off-axis ≤ ε; **gerarchia** = importanza ↔ dimensione/posizione monotona; **leggibilità** = spaziatura inter-gruppo ≥ soglia (**troppo vicino = illeggibile = da rifiutare**).
4. **Correggi e ri-misura**: se una relazione non combacia o una legge è violata → sposta/rispazia/riallinea l'elemento colpevole e **ri-valida** finché struttura-e-leggi passano (o finché il residuo è ≤ tolleranza).

Regola pratica: *"gli elementi vicini SEMBRANO correlati: lo sono davvero? e quelli correlati sono abbastanza vicini — ma non così vicini da diventare illeggibili?"*.

## Reward (ANCORATO all'OUTCOME)

L'oracolo misura l'**esito della composizione**, non l'atto di comporla:

- **(a) Similarità STRUTTURALE col ground-truth**: relation-match / graph-edit-distance sul grafo {raggruppamenti + ordinamenti relativi + topologia + gerarchia}, **invariante a traslazione e scala**. Premia le *relazioni corrette*, non la coincidenza dei pixel.
- **(b) Conformità alle leggi UX**: prossimità (intra < inter, con margine), allineamento (residuo off-axis ≤ ε), gerarchia (monotona), **leggibilità** (spaziatura inter-gruppo ≥ soglia). La **vicinanza eccessiva è un negativo esplicito**: scende sotto soglia → penalità, *peggio* del baseline non-corretto.
- **MAI la cerimonia**: narrare "ho applicato prossimità/allineamento/gerarchia…" senza che le metriche ri-misurate migliorino → **0**. Il credito esige il *delta misurabile* su (a)+(b) ([[../feedback_reward_hacking_principle]], CLAUDE.md #10). L'estetica soggettiva NON è premiata: solo struttura+leggi misurabili.

## Esempi NEGATIVI (rule #21 — il CONFINE della skill)

Reward **simmetrico**: un falso-positivo (rompere una composizione già sana per lucrare "ho spaziato/allineato") è penalizzato quanto un falso-negativo. La skill NON è "distanzia sempre / uniforma sempre".

1. **Prossimità VOLUTA — NON allargarla**. Fixture: label `"12"` e unità `"kg"` a 3px (un singolo token semantico), oppure icona+etichetta di un bottone. Sono **un** gruppo: la prossimità stretta È corretta. L'azione giusta è **non intervenire**; distanziarli "per dare respiro" rompe il significato → penalizzato come una vicinanza-eccessiva al contrario. La regola prossimità=significato **taglia in entrambi i versi**.
2. **Ground-truth denso-per-design — fedeltà, non "fix"**. Fixture: una heatmap/tabella-dati/legenda-mappa dove il target È compatto e regolare *di proposito* (densità informativa voluta). Imporre "più whitespace" come da template generico **abbassa** la similarità strutturale col ground-truth valido → l'azione corretta è **conformarsi al target**, non "arieggiarlo". Over-triggering della legge-leggibilità = negativo.
3. **Differenza solo COSMETICA — accettare**. Fixture: due SVG con la STESSA struttura ma path codificati diversamente / colore `#3366CC` vs `#3366CD` / anti-alias diverso. Nessuna relazione spaziale è violata → la composizione è **corretta**; segnalarla come "errore di composizione" è un falso-positivo (over-triggering su diff di superficie) → penalizzato.
4. **Minimalismo con negative-space voluto — non riempire**. Fixture: un logo/poster con ampio spazio vuoto *intenzionale* attorno a un elemento focale (la gerarchia È lo spazio). "Compattare per usare lo spazio" distrugge la focale → l'azione giusta è **non-agire**. Lo spazio vuoto qui è segnale, non spreco.

## Transfer examples (domini DIVERSI — rule #19, cross-campo NON solo software)

> **Logica astratta unica** (identica in tutti): *la posizione/vicinanza codifica una relazione; composizione corretta = correlati-vicini · non-correlati-separati · gerarchia-per-posizione/dimensione · mai-così-vicini-da-diventare-illeggibili; valida contro un riferimento per **struttura/topologia**, non per superficie.* Dal banale (apparecchiare) al sistemico (zoning urbano). ≥3 non-software.

### A — Software / UI (dove vive il vertical)
1. **Diagramma / dashboard**: in un flowchart i box di uno stesso modulo vanno raggruppati (prossimità) e i moduli distinti separati; due moduli **non** collegati disegnati adiacenti si *leggono* come connessi = errore semantico. Gerarchia: il nodo-root più grande/in-alto. Oracolo: intra-gruppo < inter-gruppo, gerarchia monotona.
2. **Legenda / KPI-row**: valore e unità (`98%`, `↑`) restano un gruppo; le card KPI distinte hanno gutter ≥ soglia. Troppo strette = si leggono come una tabella unica illeggibile.

### B — Vita quotidiana (banale → concreto)
3. **Impaginazione di una pagina**: una didascalia equidistante tra due foto è **ambigua** — la prossimità deve legarla alla SUA foto (Gestalt della prossimità in stampa). Riferimento = il menabò: conta la relazione didascalia↔foto, non i mm esatti.
4. **Apparecchiare la tavola**: forchetta+coltello+piatto di **un** coperto raggruppati; se il bicchiere è troppo vicino al coperto del vicino, non si capisce di chi è (prossimità=appartenenza). Troppo stretto tra coperti = "illeggibile" (non sai dov'è il tuo posto).
5. **Appendere una parete di quadri (gallery wall)**: le stampe correlate (stessa serie) in cluster, quelle scollegate distanziate; una foto di famiglia a 1cm da un astratto scollegato si legge come **un** gruppo confuso; appesa troppo fitta = visivamente soffocante = "illeggibile".

### C — Cross-dominio sistemico
6. **Architettura d'interni / disposizione arredi**: sedie attorno al tavolo abbastanza vicine per conversare ma non così vicine da non poterle scostare; un divano incastrato contro una porta è **non-funzionale** — l'analogo di "troppo vicino = illeggibile" è *"troppo vicino = inagibile"*. Riferimento = la pianta e i flussi, non le misure al mm.
7. **Cartografia / posizionamento etichette**: il nome di una città deve stare più vicino al SUO punto che a qualsiasi vicino; etichette sovrapposte/ambigue = mappa illeggibile. La fedeltà è **topologica** (chi è a nord di chi), non metrica: la proiezione distorce la scala ma la struttura resta = *struttura, non pixel*.
8. **Pianificazione urbana / zoning**: adiacenza funzionale — una scuola troppo vicina a una zona industriale pesante (la prossimità implica una relazione sbagliata); residenziale+rumoroso senza buffer = quartiere "illeggibile"/invivibile. Gerarchia: la piazza come fulcro. Riferimento = il piano regolatore, per relazioni d'uso non per metri esatti.

## Label-generation

- **Fixture self-contained, vere-per-costruzione** (#22, [[../feedback_training_set_factual_integrity]]): ogni fixture è un ground-truth SVG con **coordinate/bounding-box esplicite + i raggruppamenti semantici annotati** nella fixture stessa. Testa il *ragionamento spaziale*, NON il recall di fatti-del-mondo (le "leggi UX" sono definite operativamente come metriche misurabili sulla fixture, non nozioni esterne inventate). L'oracolo si calcola sulle coordinate date → nessuna verità-del-mondo richiesta.
- **Mutation/oracle** (riusa il pattern di [[../../harness/verifiers/deceptive-task-gen]]): da un ground-truth genera **varianti degradate** — (i) *proximity-broken* (allontana un correlato / avvicina un non-correlato: swap di gruppo), (ii) *alignment-broken* (nudge δ fuori dall'asse condiviso), (iii) *hierarchy-broken* (titolo rimpicciolito sotto il corpo / header spostato sotto il contenuto), (iv) *over-crowded* (spaziatura inter-gruppo sotto soglia = illeggibile). Il modello deve **identificare la legge/relazione violata + correggere**; l'oracolo ri-misura similarità-strutturale + conformità-leggi.
- **Negativi generati** (§Esempi NEGATIVI): varianti che *sembrano* degradate ma sono **valide** (prossimità voluta, densità-per-design, diff cosmetica, negative-space intenzionale) → il gold-behavior è **non-agire / conformarsi al target**.
- **Demo SFT + RL sull'outcome**: traiettorie che mostrano estrai-relazioni → confronta → valida → correggi → ri-misura; RL sopra le demo, reward = delta misurabile su (a)+(b), MAI sul numero di correzioni.

## Hack-check (OBBLIGATORIO)

- **Pixel-diff / copia-incolla**: reward su pixel-diff puro → il modello copia verbatim il ground-truth per azzerare il diff. → **Neutralizzato**: (i) reward su relazioni **invarianti a traslazione/scala** (copiare non basta, serve la *struttura* giusta anche se ridimensionata); (ii) a inference il target NON è fornito (si genera da spec/variante-degradata) e i ground-truth sono **held-out** → non c'è nulla da copiare.
- **Whitespace-inflation** ("più spazio è sempre meglio" → sparpaglia tutto): → **Neutralizzato** dai negativi #1/#4 (allargare correlati o riempire negative-space voluto = penalità) + reward simmetrico: la prossimità *intra-gruppo* è anch'essa misurata → l'over-spacing rompe il raggruppamento e **abbassa** la similarità strutturale.
- **Over-triggering / cerimonia**: bocciare composizioni sane gridando "disallineato/troppo vicino" per lucrare il segnale, o narrare l'applicazione delle leggi senza cambiare nulla. → **Neutralizzato**: la cerimonia senza delta-metrico = 0; i negativi #2/#3 penalizzano il flag su target-validi e su diff cosmetiche; il reward esige il *raggiungimento* della struttura+leggi, non l'atto di criticare.
- **Over-fitting all'istanza osservata**: → **held-out** dei ground-truth + transfer cross-dominio obbligatorio (A/B/C) → misura la generalizzazione della *logica spaziale*, non la memorizzazione di un layout.

## Facet — OBJECT-DEPICTION (comporre le PARTI di un oggetto su layer → il tutto lo DEPINGE)

> **Origine**: utente msg 1535/1536 ("crea lo stelo di una rosa e tutti i petali uno a uno su layer SVG differenti → visti nel complesso danno l'immagine di una rosa"), **approvata** msg 1545. **SSOT/DRY** (rule #16/#20): NON è una classe nuova — è una **facet** di questa (stesso reward-engine: relation-match strutturale vs ground-truth, invariante, non-pixel), su un tipo diverso di target. Il framing precedente è UX-layout (leggibilità); questa facet è **rappresentazionale** (il render depinge l'oggetto voluto).

**Il gap (facet)**: il modello sa disporre elementi per un LAYOUT, ma quando deve comporre le **parti di un OGGETTO** (rosa = stelo + petali; faccia = occhi + naso + bocca) perché il render del *tutto* lo depinga, sbaglia le **relazioni geometriche di rappresentazione**: petali non radiali attorno al centro, stelo staccato dal fiore, tutte le parti su **un unico layer** indistinto (non ispezionabili/manipolabili singolarmente), ordine relativo errato (occhi sotto la bocca). Non è percettivo (le coordinate sono esplicite) né di conoscenza (sa com'è una rosa): è **mancata validazione della composizione-oggetto contro le relazioni geometriche che la rendono riconoscibile**.

**La skill (facet)** — estende `estrai-relazioni → confronta-struttura → valida → correggi` con predicati di DEPICTION:
1. **Part-decomposition + LAYER-SEPARATION**: ogni parte semantica su un proprio layer/`<g>` etichettato (stelo, ciascun petalo) → il conteggio-layer combacia con le parti-semantiche attese del ground-truth. Tutto-su-un-layer **fallisce**; layer vuoti/duplicati per gonfiare il numero **penalizzati**.
2. **Relazioni geometriche di depiction** (oltre prossimità/allineamento): **distribuzione/simmetria** (petali ~equi-angolari attorno al centro, varianza angolare ≤ soglia); **connettività** (endpoint dello stelo adiacente alla base del fiore, gap ≤ ε); **ordine relativo** (stelo SOTTO il fiore: y_stelo > y_fiore; occhi SOPRA naso SOPRA bocca — segni di Δy/Δx corretti); **contenimento/stacking** (tetto sopra i muri, muri sopra il suolo, porta dentro i muri).
3. **Confronto strutturale col ground-truth**: stesso relation-isomorfismo, invariante a traslazione/scala (una rosa più piccola/spostata è ancora corretta).

**Gold instance (HELD-OUT)**: la **rosa** — stelo + N petali su N+1 layer, petali a distribuzione radiale (Δθ ~ uniforme), stelo connesso alla base del fiore, y-ordering stelo-sotto-fiore. Oracolo **geometrico deterministico** sulle coordinate date (nessuna verità-del-mondo: la fixture è self-contained, #22).

**Reward (stesso engine, esteso)**: (a) structural-match vs ground-truth (come sopra) **+ (b′) predicati-depiction**: layer-separation (≙ parti attese), radial-distribution (varianza angolare ≤ soglia dove il GT la richiede), connectivity (gap endpoint ≤ ε), relative-order (segni y/x corretti). **MAI** "sembra una rosa" percettivo (hack → 0); **MAI** pixel-diff. Il credito esige i *predicati geometrici raggiunti*, non l'atto di comporre.

**Negativi (facet — il CONFINE, reward simmetrico)**:
- **N-5 oggetto GIÀ valido** → non "ri-comporre"/spostare parti di una rosa target ben formata = falso-positivo penalizzato.
- **N-6 over-decomposition**: un elemento **unitario** (il disco-centro del fiore) spezzato in finti sotto-layer arbitrari → la separazione-layer serve alle parti-semantiche REALI, non a inflazionare i layer → penalizzato.
- **N-7 simmetria NON voluta**: un oggetto **asimmetrico** per design (una "e" minuscola, una freccia direzionale, un logo asimmetrico) forzato a simmetria radiale → rompe la depiction. Il predicato-simmetria si applica SOLO dove il ground-truth lo richiede (taglia in entrambi i versi, come prossimità).

**Transfer object-depiction (domini-oggetto, cross-campo — rule #19)**: logica astratta unica = *le parti, disposte con le giuste relazioni geometriche (ordine/simmetria/connettività/contenimento) e separate per parte, compongono un tutto che DEPINGE il target; valida per struttura, non per pixel*.
- **A software/diagram**: schema di un **circuito**/mappa-metro (nodi + connessioni topologiche corrette, non incroci spuri); una **casa** in un'icona (tetto-su-muri-su-suolo).
- **B vita quotidiana**: **faccia** schematica (occhi-sopra-naso-sopra-bocca, simmetria bilaterale); **orologio** analogico (12 tacche equi-angolari, lancette dal centro all'ora *data*); disporre i **pezzi degli scacchi** nella posizione iniziale corretta.
- **C sistemico**: **planimetria** (stanze adiacenti nel modo giusto, ingresso connesso ai corridoi); **fiore/albero** botanico (radiale/ramificato con connettività ramo→tronco); **costellazione** (stelle nelle posizioni relative che formano la figura).

**Hack-check (facet)**: (i) "sembra l'oggetto" percettivo → 0 (solo predicati geometrici deterministici); (ii) **layer-inflation** (layer vuoti/finti per gonfiare il conteggio) → il conteggio è confrontato con le parti-semantiche del GT, non un numero assoluto; vuoti/duplicati penalizzati; (iii) pixel-copy → held-out target a inference + invarianza traslazione/scala (come la classe base).

**Cugino TEXT-ONLY (recupera l'idea-1 dell'utente SENZA multimodalità)**: dato un albero **DOM/SVG in TESTO** (elementi con coordinate/stili espliciti) + domanda "quale elemento è X? (il bottone rosso al centro / il petalo più in alto)" → identificazione per **ragionamento su coordinate/stili/relazioni nel markup**, input testuale (no vision). L'idea-1 dell'utente (identificare un widget in un'immagine JPEG) era deferita perché serviva l'input multimodale; questo cugino la recupera come ragionamento spaziale su una scena **simbolica**. Reward: id-elemento corretto (exact-match) + la RAGIONE geometrica (bounding-box/centro/colore) verificata sui dati della fixture, non a parole.

**Training-vs-harness split** (invariato, [[../concepts/training-vs-harness-classification]]): la skill Tier-1 = il **piano spaziale** (decomporre l'oggetto in parti, definire le relazioni geometriche, validare vs ground-truth, decidere le correzioni); l'emissione della sintassi SVG (path/transform/`<g>`) = **LoRA verticale svg**. Il Tier-1 possiede il *piano e la critica*, non la sintassi.

## Links
[[class-visual-design-quality]] (padre) · [[class-frontend-ux-spacing-quality]] (sorella) · [[class-metacognitive-self-audit]] (audit-anti-reward-hacking, zia) · [[area-06-code-quality-architecture]] (verticale Tier-3 `svg-spatial` da creare quando si costruisce la LoRA) · [[project_base_model_intelligence]] · [[../concepts/training-vs-harness-classification]] · [[../concepts/training-set-construction-principles]] · [[../../harness/verifiers/deceptive-task-gen]] · [[../feedback_reward_hacking_principle]] · [[../feedback_intelligence_gap_to_training_class]] · [[../feedback_transfer_always_cross_domain]] · [[../feedback_training_set_factual_integrity]]
