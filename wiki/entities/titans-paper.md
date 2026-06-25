---
name: titans-paper
description: Titans (Behrouz, Zhong, Mirrokni — Google Research, gennaio 2025) — architettura ibrida con tre tipi di memoria che impara a memorizzare a test-time usando "surprise" (magnitudo del gradient di prediction loss) come signal per aggiornare una long-term memory neurale.
type: paper
entity_type: paper
tags: [paper, memory, surprise, test-time-learning, google, transformer, long-context, lifelong-learning, architecture]
sources:
  - https://arxiv.org/abs/2501.00663
  - https://arxiv.org/pdf/2501.00663
  - https://research.google/blog/titans-learning-to-memorize-at-test-time/
  - https://github.com/lucidrains/titans-pytorch
last_updated: 2026-05-21
---

# Titans — Learning to Memorize at Test Time

## 1. Identificativi essenziali

- **Titolo completo**: *Titans: Learning to Memorize at Test Time* `[EXTRACTED]`
- **Autori**: Ali Behrouz, Peilin Zhong, Vahab Mirrokni `[EXTRACTED]`
- **Affiliazione**: Google Research (con contributo accademico di Behrouz, anche associato a Cornell) `[EXTRACTED]`
- **Data**: 31 dicembre 2024 (v1 su arXiv), revisioni successive nel corso del 2025 `[EXTRACTED]`
- **arXiv**: [2501.00663](https://arxiv.org/abs/2501.00663) (URL verificato accessibile)
- **PDF**: [arxiv.org/pdf/2501.00663](https://arxiv.org/pdf/2501.00663) (accessibile)
- **Blog Google Research**: pagina dedicata su research.google ("Titans: Learning to Memorize at Test Time") `[EXTRACTED]`
- **Implementazioni terze parti**: porting PyTorch non ufficiale di Phil Wang (lucidrains) su GitHub — `titans-pytorch` `[EXTRACTED]`
- **Venue**: preprint arXiv; non ancora chiaramente associato a un venue principale a maggio 2026 `[AMBIGUOUS]`

---

## 2. Contesto: cosa risolve

Per capire perché Titans esiste, vale la pena fare un passo indietro e ricordare il problema strutturale dei Transformer "puri".

Un Transformer standard funziona bene finché il contesto rientra nella sua **context window** — la finestra di token che l'attention può guardare. Le ultime generazioni hanno spinto questa finestra da 4K a 128K, poi a 1M token (Gemini 1.5, Claude 3.5 Sonnet long-context). Ma c'è un problema di fondo: l'attention costa O(n²) in computazione e in memoria. Raddoppiare il contesto quadruplica il costo. Quindi anche con context window enorme, processare 1M token rimane proibitivo per applicazioni real-time o per modelli piccoli su GPU consumer. `[INFERRED]`

Un secondo problema, più sottile, è quello della **memoria fra inference call diverse**. Quando il modello finisce di processare una conversazione, tutto quello che "sa" risiede o nei suoi pesi (acquisito durante training, quindi statico) o nel contesto della call attuale (che evapora alla call successiva). Non esiste un meccanismo standard che permetta al modello di **ricordare** qualcosa visto durante un'inference precedente — a meno di scriverlo esplicitamente in un database esterno (vector store, RAG, MemGPT) e recuperarlo come testo nel contesto della call successiva. Ma quella è memoria **esterna**, gestita da un sistema attorno al modello, non dal modello stesso. `[INFERRED]`

Lavori precedenti hanno tentato di affrontare il secondo problema con varianti architetturali. Memorizing Transformers (Wu et al. 2022) aggiunge un k-NN lookup su uno store di key-value coppie viste durante training. Recurrent Memory Transformer (Bulatov et al. 2022) introduce token speciali di memoria che vengono passati da segmento a segmento. LongMem (Wang et al. 2023) usa un side-network per scrivere e leggere in una memoria a lungo termine. Mamba e Mamba-2 (Gu, Dao) puntano su state-space models per ottenere costo lineare con context lunghissimi. `[EXTRACTED]`

Quello che nessuno di questi lavori fa è usare la **surprise** del modello come signal per decidere cosa vale la pena memorizzare. Titans introduce esattamente questo: un meccanismo che, basandosi su quanto un token è "sorprendente" rispetto a quello che il modello già sa, decide se aggiornare o no una memoria a lungo termine. La memoria si modifica durante l'inference, non solo durante il training. È questo il senso di "learning to memorize **at test time**". `[EXTRACTED]`

---

## 3. Idea core: cos'è Titans

Titans è un'architettura ibrida che mette insieme tre tipi diversi di memoria, ognuno con un ruolo specifico. La metafora intuitiva è quella della mente umana: c'è una memoria di lavoro veloce ma piccola, una memoria a lungo termine grande ma più lenta, e c'è anche un "sapere innato" che non cambia mai. `[INFERRED]`

I tre componenti sono: `[EXTRACTED]`

**(1) Short-term memory** — è l'attention classica del Transformer, ma con un decay esponenziale: i token più recenti pesano di più, quelli più lontani sfumano. Serve a catturare dipendenze locali precise. È veloce, accurata, ma intrinsecamente limitata in dimensione perché il costo cresce con il quadrato della finestra.

**(2) Long-term memory** — questa è la novità centrale del paper. È una **rete neurale separata** (in pratica un MLP profondo) i cui pesi vengono aggiornati durante l'inference, non solo durante il training. Funziona come una memoria associativa: si comporta da contenitore in cui il modello può "scrivere" pattern sorprendenti e da cui può poi "leggere" via query. Il fatto cruciale è che questa memoria **continua a imparare** anche dopo che il training è terminato — è "learning at test time".

**(3) Persistent memory** — sono parametri appresi durante il training, ma a differenza dei pesi normali del modello sono **condizionati al task** o a tipologie di input. Una volta finito il training restano fissi. Sono pensati come "conoscenza statica" che il modello deve avere sempre disponibile (analogo grossolano alla conoscenza enciclopedica acquisita durante pre-training).

Il driver che decide quando aggiornare la long-term memory è la **surprise**. La definizione operativa è semplice e bellissima: surprise = **magnitudo del gradient** della loss di prediction del token corrente rispetto ai parametri della long-term memory. In altre parole, "quanto la rete dovrebbe cambiare se volesse prevedere meglio questo token?". Se il gradient è piccolo, il token era già ben previsto dallo stato attuale → niente da imparare. Se il gradient è grande, il token era sorprendente → la memoria registra il pattern. `[EXTRACTED]`

Il paper propone tre varianti architetturali per integrare i tre tipi di memoria in un singolo modello: `[EXTRACTED]`

- **MAC (Memory as Context)**: la long-term memory viene letta e i risultati vengono iniettati come token aggiuntivi nel contesto, su cui l'attention standard opera.
- **MAG (Memory as Gating)**: l'output dello short-term attention e quello della long-term memory vengono mescolati tramite un meccanismo di gating (qualcosa come "quanta fiducia metto nella memoria a lungo termine vs quella locale?").
- **MAL (Memory as Layer)**: la long-term memory diventa un layer separato dello stack, applicato in sequenza dopo l'attention. È il pattern più "modulare".

Le tre varianti hanno trade-off diversi in termini di costo computazionale e di efficacia, e il paper le confronta empiricamente su diversi benchmark.

---

## 4. Come funziona "surprise" nello specifico — walk-through

Proviamo a tracciare passo per passo quello che succede dentro Titans quando processa una sequenza lunga di token. Immaginiamo che stia leggendo un romanzo di 500K token. `[INFERRED]` (ricostruzione dal paper)

1. Il modello legge il token corrente. Lo short-term attention lo elabora insieme ai token recenti nella finestra locale.
2. In parallelo, la long-term memory viene **interrogata** con una query derivata dallo stato attuale del modello. Restituisce un valore — un vettore — che rappresenta "quello che la memoria sa sull'argomento ora rilevante".
3. Il modello produce una **prediction** del token successivo, combinando short-term attention, output della long-term memory, e persistent memory.
4. Si calcola la **loss di prediction**: quanto è sbagliata la prediction rispetto al token osservato realmente?
5. Da questa loss si deriva un **gradient** rispetto ai parametri della long-term memory. La magnitudo di questo gradient è la **surprise**.
6. Se la surprise è alta → la long-term memory **si aggiorna** con un passo (tipo SGD) nella direzione del gradient. Il pattern sorprendente viene registrato.
7. Se la surprise è bassa → la memoria resta praticamente invariata.
8. Si passa al token successivo. La memoria è ora un po' diversa da prima.

L'effetto cumulativo è che, leggendo il romanzo, la long-term memory si arricchisce gradualmente di "cose rilevanti". Frasi banali di dialogo ("disse Marco", "sorrise lei", "fuori pioveva") sono molto prevedibili → low surprise → memoria immutata. Frasi con un colpo di scena ("il padre era in realtà l'assassino") sono molto poco prevedibili → high surprise → memoria registra. `[INFERRED]`

Trecentomila token più tardi, quando un personaggio fa riferimento al colpo di scena, la query alla long-term memory recupera il pattern registrato e il modello può rispondere coerentemente — **senza** dover tenere tutti i 300K token precedenti dentro l'attention window. Questo è il meccanismo con cui Titans claim di scalare a contesti di 2M+ token con costo gestibile. `[EXTRACTED]`

La cosa intellettualmente elegante è che la stessa quantità — la magnitudo del gradient — gioca due ruoli diversi nei due regimi: durante il training serve a **aggiornare i pesi del modello** (come in qualsiasi backprop); durante l'inference serve a **aggiornare i pesi della memoria** ma non quelli del modello base. La memoria è una rete neurale "satellite" che impara continuativamente, il modello base resta fisso. `[INFERRED]`

---

## 5. Numeri e benchmark

I principali risultati riportati dal paper, da prendere con la solita prudenza dei numeri auto-riportati: `[EXTRACTED]`

- **BABILong** (needle-in-haystack benchmark per long-context retrieval): Titans supera significativamente baselines come Mamba, Mamba-2, LongMem, e altri modelli long-context, raggiungendo livelli di accuracy alti su contesti dell'ordine del milione di token.
- **Language modeling**: perplexity competitiva con baselines forti su benchmark standard, mantenendo costo computazionale gestibile su contesti lunghissimi.
- **Genomics e time-series**: il paper testa Titans anche su domini fuori dal language modeling puro, mostrando capacità di generalizzazione del pattern memory-augmented.
- **Scalabilità del contesto**: il claim più forte è la possibilità di operare su contesti **superiori a 2 milioni di token** con accuracy che non collassa, mentre molti baselines degradano oltre 100K-200K.

Va detto che alcuni di questi confronti — in particolare le comparazioni con Mamba e con altri state-space models — sono state criticate in discussioni community (forum, Twitter accademico) come configurazioni non sempre apples-to-apples in termini di parametri totali e di training compute. `[AMBIGUOUS]` Una riproduzione esterna sistematica al 2026-05 è ancora limitata, anche se l'implementazione di Phil Wang (lucidrains) ha aperto la strada a sperimentazioni più ampie. `[EXTRACTED]`

---

## 6. Connessione col nostro progetto SLM

Titans non è solo un paper interessante: tocca direttamente quattro elementi del nostro design.

**(a) Memoria persistente del wrapper.** Nel nostro [[concepts/error-memo-system]] abbiamo immaginato un sistema in cui il wrapper accumula "memo" (lezioni apprese dagli errori) e li recupera in run successivi per evitare di rifare lo stesso sbaglio. Il problema aperto è: **come decidere quali memo conservare e quali scartare?** La surprise di Titans offre una risposta pulita: un memo con surprise alta (cioè una lesson che ha sorpreso il modello quando l'ha appresa) merita peso alto in memoria; uno con surprise bassa (lesson banale che il modello "sapeva già") può essere scartato o tenuto a peso basso. È un criterio principled, non arbitrario. `[INFERRED]`

**(b) Contradiction detection layer.** Il nostro [[concepts/contradiction-detection-layer]] è pensato come un detector che si attiva quando una nuova informazione nel contesto contraddice qualcosa già stabilito. Bene: una contraddizione è esattamente una forma di **surprise**. Quando vediamo "X is true" dopo aver letto "X is false" la prediction loss schizza. Possiamo quindi pensare al contradiction detector come a un caso particolare del meccanismo di surprise di Titans: stessa segnale di base, stesso modo di trigger di un update. Questo dà al nostro layer una fondazione formale più solida, e suggerisce che probabilmente conviene farlo come **gradient-magnitude detector** anziché come pattern-matching simbolico. `[INFERRED]`

**(c) Three-tier architecture e organization Tier 1.** Il nostro Tier 1 è l'organization specialist — il modello che deve catturare criticality awareness (l'esempio canonico è "ricorda di backup prima di cancellare un file"). Una memoria Titans-like attaccata al Tier 1 potrebbe ricordare pattern di criticality visti in run precedenti **senza retraining**. Esempio: in una run di lunedì il modello ha imparato che "il progetto X usa Postgres 14, mai usare features di 15+". Con memoria Titans, quel pattern resta scritto nella long-term memory del Tier 1 e martedì viene richiamato spontaneamente. Senza Titans, dovremmo affidare quel ricordo al wrapper esterno (database + retrieval). Con Titans, il modello stesso lo possiede. `[INFERRED]`

**(d) Multi-day agent continuity.** Il nostro [[concepts/temporal-awareness-timestamps.md]] affronta il problema "ricordare ieri" per agenti che lavorano su task multi-giorno. Titans dà l'infrastruttura per farlo senza pipeline esterna di save/load: la memoria sopravvive tra inference calls naturalmente, perché è un componente architetturale del modello, non un add-on. Questo semplifica drasticamente il wrapper. `[INFERRED]`

---

## 7. Pro / Contro / Caveats

**Pro:**

- **Lifelong learning at inference**: il modello continua a imparare anche dopo deploy, senza retraining centralizzato. Per un SLM che gira local-first o on-device questa è una proprietà desiderabile.
- **Scalabilità del contesto**: il claim di 2M+ token con costo gestibile, se regge in pratica, è game-changer per use case come reading di codebase intere o agenti multi-day.
- **Surprise come signal interpretabile**: la magnitudo del gradient è una quantità misurabile, loggabile, soglia-tunabile. Apre a debugging e auditing della memoria.
- **Modularità**: le tre varianti (MAC/MAG/MAL) permettono di scegliere il trade-off costo/efficacia adatto al deployment.

**Contro:**

- **Complessità architetturale**: tre memorie + tre varianti di integrazione + meccanismo di gradient durante inference. Non è un drop-in replacement di un Transformer standard.
- **Training pipeline custom**: addestrare un Titans non è banale come addestrare un Transformer. La long-term memory neural net richiede strategie di training specifiche (probabilmente two-stage: prima il modello base, poi co-training della memoria). Il paper documenta alcune scelte ma una "ricetta universale" non è ancora consolidata. `[INFERRED]`
- **Iperparametri sensibili**: la soglia di surprise (sopra la quale aggiornare la memoria) è un hyperparameter critico. Troppo bassa → memoria sovrascritta in continuazione → instabilità. Troppo alta → memoria che non si aggiorna mai → inutile. Tunare bene questo punto richiede sperimentazione empirica per dominio.
- **Dipendenza implementativa**: per ora Titans esiste in implementazioni che richiedono adattamento manuale. Non c'è ancora un'integrazione mainstream in `transformers` di HuggingFace, in vLLM, in TRL/Axolotl. Significa che adottarlo costa lavoro engineering. `[INFERRED]`

**Caveats:**

- Paper recente (gennaio 2025) → ecosystem ancora immaturo. Replicabilità esterna documentata in modo parziale.
- Non chiaro come la memoria interagisca con LoRA stacking. Se la nostra architettura prevede LoRA verticali attivati a runtime sopra un base model, dove va a parare la long-term memory? Sopra o sotto le LoRA? È memoria condivisa o per-LoRA? Domanda aperta importante per noi (vedi sez. 8). `[AMBIGUOUS]`
- Persistent memory (componente 3) è meno descritta nel paper rispetto alle altre due. Sembra essere il "least novel" dei tre, ma anche il meno chiaramente caratterizzato a livello operativo. `[INFERRED]`

---

## 8. Open questions per noi

**(1) Compatibility con LoRA stacking.** La nostra architettura prevede LoRA verticali caricati a runtime sopra un base orchestrator. Se aggiungiamo una long-term memory Titans-like al base, e poi cambiamo LoRA, cosa succede alla memoria? La memoria resta valida o va invalidata? Probabilmente serve **memoria per-LoRA** (ogni adapter porta con sé la sua memoria), oppure **memoria condivisa al base** (ma allora rischiamo cross-contamination tra task). Decisione architetturale non banale, dipendente da esperimenti specifici. Vedi anche [[lora-stacking]]. `[INFERRED]`

**(2) Surprise threshold empirico.** Quale valore di soglia di gradient magnitude usare per il nostro dominio (organization + coding)? Probabilmente diverso da quello usato nel paper per language modeling generico. Richiede una sweep di sperimentazione su un piccolo benchmark interno.

**(3) Training della long-term memory neural net.** Il paper indica che la memoria viene addestrata con il resto del modello, ma non è chiaro se serva un dataset specifico (con coppie input/expected-memory-content) o se l'addestramento avvenga puramente end-to-end. Per il nostro pipeline questo è critico: se serve dataset specifico, va incorporato nella generazione (vedi [[pipeline-architecture-data-generation]]).

**(4) Interazione con il principio "scuola" (Wave 5+).** La nostra [[scuola-learning-philosophy]] prevede una sequenza copia → capisci → allenati → migliora. Titans introduce un componente che continua a imparare in tutte e quattro le fasi. Come si integra? La memoria Titans potrebbe essere "vuota" durante la fase copia, riempirsi durante capisci, raffinarsi durante allenati, e diventare uno strumento attivo durante migliora? È una speculation, ma vale la pena testare. `[INFERRED]`

**(5) Costo reale.** Il paper claim costi gestibili per contesti enormi, ma la matematica esatta del costo di forward + backward su long-term memory durante ogni inference call non è triviale. Per il nostro target di deployment (2080 Ti 11GB locale, poi cloud) serve un'analisi di feasibility ad hoc.

---

## 9. Sources

URL verificati come accessibili a maggio 2026:

- **arXiv abstract**: https://arxiv.org/abs/2501.00663 — accessibile
- **arXiv PDF**: https://arxiv.org/pdf/2501.00663 — accessibile
- **Google Research blog**: https://research.google/blog/titans-learning-to-memorize-at-test-time/ — pagina dedicata al paper (annunciata su Google Research site) `[EXTRACTED]`
- **Phil Wang lucidrains porting PyTorch**: https://github.com/lucidrains/titans-pytorch — implementazione community non ufficiale ma seguita `[EXTRACTED]`
- **HuggingFace papers page**: https://huggingface.co/papers/2501.00663 — pagina di indicizzazione `[INFERRED]` (esistenza standard per paper arXiv)
- **Semantic Scholar**: voce indicizzata sotto titolo "Titans: Learning to Memorize at Test Time" `[INFERRED]`

Follow-up / lavori correlati menzionati:

- **Memorizing Transformers** (Wu et al. 2022, ICLR): arXiv 2203.08913 — precursore nel filone retrieval-augmented memory
- **Recurrent Memory Transformer** (Bulatov et al. 2022, NeurIPS): arXiv 2207.06881
- **LongMem** (Wang et al. 2023, NeurIPS): arXiv 2306.07174
- **Mamba** (Gu, Dao 2023): arXiv 2312.00752 — alternativa state-space al problema long-context

Cross-reference interne wiki:

- [[concepts/curiosity-driven-exploration-training]] — Titans è la "teoria #1 di surprise" tra le 4 mappate lì
- [[concepts/error-memo-system]] — surprise come criterio di pesatura dei memo
- [[concepts/contradiction-detection-layer]] — contraddizione come caso particolare di surprise
- [[concepts/temporal-awareness-timestamps]] — Titans come infrastruttura per multi-day continuity
- [[architecture/three-tier-design]] — possibile collocazione della long-term memory al Tier 1

---

## Note di chiusura

Titans è uno di quei paper che, letti la prima volta, fanno scattare la sensazione "ah, certo, ma allora questo cambia un po' di cose". L'idea di usare la magnitudo del gradient come signal di surprise è quasi banale a posteriori — la quantità è già lì, gratis, dentro ogni backprop step — ma nessuno l'aveva usata in modo sistematico per pilotare una memoria a lungo termine modificabile a inference time.

Per il nostro progetto, Titans è rilevante in tre modi distinti: (1) come **possibile componente architetturale** del Tier 1 orchestrator se decidiamo di volere memoria persistente nativa; (2) come **fondazione teorica** per concetti che avevamo già pensato in modo intuitivo (error-memo, contradiction detection); (3) come **paper da monitorare** perché l'ecosistema attorno (porting, benchmark indipendenti, integrazioni in framework) sta crescendo rapidamente nel 2025-26 e una scelta di "wait and see" potrebbe diventare presto una scelta di "integrate now".

La domanda critica per noi non è "Titans è bello?" — chiaramente sì. È piuttosto "**quanto regge l'idea di surprise-driven memory quando il backend è un SLM coding-specialized e non un foundation model frontier?**". Stessa domanda che ci ponevamo per Voyager (vedi [[entities/voyager-paper]]), ed è probabilmente il pattern di domanda ricorrente per ogni paper che adotteremo: validate the mechanism on our scale.
