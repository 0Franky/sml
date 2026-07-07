---
name: class-domain-categorization-routing
description: Classe di training APPROVATA (utente msg 1317) — data una richiesta, classificarla nel DOMINIO corretto (la funzione-router del Tier-1: decidere quale LoRA/verticale invocare); per i task multi-dominio, scomporli nei domini giusti. Il difetto è il mis-routing / collasso su un dominio di default / confidenza esibita al posto della label corretta. Il base tiene una piccola % di TUTTI i domini per avere l'ISTINTO di categorizzare (riconoscere la firma), non per risolverli.
type: training-class
tags: [reasoning, metacognition, categorization, routing, classification, tier1, self-audit, area-01, area-04, held-out]
last_updated: 2026-07-08
---

# Classe di training — DOMAIN CATEGORIZATION & ROUTING (che TIPO di problema è questo?)

> **Stato**: **APPROVATA** (regola #18, utente msg 1314/1317). Proposta: *"il base tiene una piccola % di TUTTI i domini per avere ISTINTO + saper CATEGORIZZARE; la categorizzazione È la funzione del router Tier-1 (decidere quale LoRA/verticale invocare)"*.
> **Home**: Tier-1 routing/classification ([[../architecture/orchestrator-layer]] §"Domain classification + routing decision", [[../architecture/three-tier-design]]). È l'espressione, come skill di ragionamento, dell'identità Tier-1 = *"problem analysis and task decomposition"* — orchestratore INTELLIGENTE, non coder.
> **Padre** (regola #20): [[class-metacognitive-self-audit]] — è l'**audit del TIPO-di-problema** ("che genere di task è questo, e quale specialista lo gestisce?"): auto-consapevolezza della categoria, non fiducia nel primo-impatto. **Sorelle**: [[class-stagnation-recovery]] (audit del *progresso*) · [[gold-example-transfer-assumption-audit]]/#145 (audit delle *assunzioni*) · [[class-consequence-intention-conflict]] (audit *mezzi-fini*) · [[class-confabulation-retrieval-failure]] (audit della *provenienza*) · [[class-prospective-memory]] (memoria SAVE). Questa è la **6ª figlia**.

## Il gap

Al Tier-1 arriva una richiesta e deve **instradarla al gestore giusto** (quale LoRA verticale? frontend/backend/data/infra? o nessuno → generale?). Il fallimento: **mis-routing** (manda un task frontend alla LoRA backend), **collasso su un dominio di default** (predice sempre il dominio più frequente / il primo che "suona" giusto), oppure **forza un task multi-dominio dentro un solo dominio** invece di scomporlo. Variante insidiosa: si àncora a una **keyword di superficie** (l'esca lessicale) invece che all'oggetto reale del task.

Non è un buco percettivo (il testo della richiesta è tutto visibile) né un buco di conoscenza-dominio (categorizzare NON richiede la competenza profonda del verticale — è proprio per questo che il base tiene solo una **piccola % di ogni dominio**: gli basta l'ISTINTO per riconoscere la *firma* del task, non per risolverlo). È un buco di **classificazione / auto-consapevolezza del tipo di problema**: sapere *cos'è* questo task e *chi* lo gestisce, prima di committare la chiamata.

## La skill (imparata una volta)

Prima di emettere la decisione di routing, eseguire un **triage esplicito**:

1. **Estrai l'oggetto REALE** del task (cosa viene chiesto davvero), separandolo dalle keyword di superficie che possono puntare al dominio sbagliato.
2. **Mappa sul tassonomia dei domini** (data in-context): scegli il/i dominio/i il cui specialista gestisce *quell'oggetto*. Usa l'istinto multi-dominio per riconoscere la firma, **non** per iniziare a risolvere.
3. **Se è multi-dominio, SCOMPONI**: identifica i sotto-task e **etichetta ciascuno col suo dominio** (regola #20, decomposizione) — non schiacciare tutto in uno.
4. **Se NESSUN dominio calza** (o è genuinamente ambiguo/sotto-specificato): instrada a **generale / chiedi-chiarimento / trattieni** — non forzare il dominio-più-plausibile. (Astensione calibrata, come nella sorella confabulation.)
5. **Emetti la LABEL** (il dominio, o l'insieme di domini), non una performance di confidenza.

Regola pratica: *"di che TIPO è questo problema, e chi lo gestisce? — e se è più d'uno, quali? — e se non lo so, lo dico invece di indovinare?"*.

## Reward (ANCORATO all'OUTCOME)

- **OUTCOME single-dominio**: la **label-di-dominio è corretta** verificata contro l'oracolo (= gold label della fixture). Punto. Il reward NON guarda la confidenza esibita né la lunghezza del ragionamento.
- **OUTCOME multi-dominio**: il reward premia la **scomposizione nei domini GIUSTI** — **set-match / macro-F1** sull'insieme dei domini (precision *e* recall): un dominio spurio aggiunto costa quanto uno mancante. Così premi la decomposizione corretta, non "ha diviso".
- **OUTCOME no-dominio / ambiguo**: PASS = instrada a generale / chiede; FAIL = etichetta un dominio specifico plausibile-ma-sbagliato (simmetrico al caso-assente di confabulation).
- **MAI** premiare la **confidenza** né la cerimonia ("categorizzo il task…", "sono sicuro al 95% che sia frontend…"): il credito esige la *label corretta vs oracolo*, non l'atto/tono della classificazione ([[../feedback_reward_hacking_principle]], CLAUDE.md #10). Premiare la confidenza la trasforma in un **tic**.

## Esempi NEGATIVI (rule #21 — il CONFINE della skill)

Bilanciati: la skill NON è "spacca sempre in più domini" né "trova sempre un dominio". Reward **simmetrico** — il falso-split e il default-forzato costano quanto il mis-routing.

1. **Single-dominio che SEMBRA multi (esca lessicale)** — *"il bottone di login del frontend ha il colore sbagliato dopo il deploy"* nomina *login/deploy/colore/frontend*: superficie da 3-4 domini, ma l'oggetto reale è **un solo dominio (frontend/UI)**. Risposta corretta: **single**, NON split in design+auth+infra+frontend. (Confine: qui la skill di decomposizione NON deve scattare.)
2. **Nessun dominio calza → generale, non forzare** — *"riscrivimi questa email al fornitore in tono più cordiale"*: nessun verticale-coding lo gestisce. Risposta corretta: **route-to-general / Tier-1 diretto**, NON "il più vicino" (es. non forzarlo su "documentazione" per riempire una casella). (Confine: anti default-collapse E anti over-trigger dello split.)
3. **Ambiguo / sotto-specificato → chiedi, non etichettare** — *"sistema la performance"* senza contesto: performance di *cosa* (query DB? render? algoritmo? processo di team?). Risposta corretta: **chiedi-chiarimento / trattieni**, NON committare un dominio plausibile a caso.
4. **Keyword→dominio sbagliato** — *"ottimizza il testo della landing page per convertire di più"*: "ottimizza" evoca performance/algoritmi, ma l'oggetto reale è **copywriting/marketing**, non un dominio ingegneristico. Risposta corretta: categorizza sull'**oggetto reale**, resistendo alla keyword.

> Senza questi negativi, un modello che "spacca sempre" o "trova sempre un dominio" passerebbe come hack. I negativi insegnano il **confine**: quando NON scomporre, quando NON instradare.

## Transfer examples (domini DIVERSI — rule #19, cross-campo NON solo software)

> **Logica astratta unica** (identica in ogni riga): *classifica l'elemento nel bucket corretto / instradalo al gestore giusto; se appartiene a più categorie, scomponilo nelle giuste; se non calza in nessuna o è incerto, escala/trattieni invece di forzarlo nel più vicino*. Dal banale al sistemico. L'oracolo misura la label/insieme corretto, MAI la confidenza.

### A — Software/sistemi (dove vive il router Tier-1)
1. **Routing alla LoRA/verticale (caso nativo)**: task → frontend vs backend vs data vs infra; un task "aggiungi un endpoint E la UI che lo consuma" → **split** backend+frontend; un task fuori-coding → generale.
2. **Bug-triage a componente/team**: una segnalazione entra → auth vs billing vs rendering; un bug che tocca auth *e* billing → **due sotto-ticket**; un bug non riproducibile/di categoria ignota → **coda di triage umano**, non assegnarlo a caso.

### B — Vita quotidiana (banale → concreto)
3. **Smistamento della posta**: bolletta → cassetto "da pagare", lettera personale → "da leggere", volantino → cestino, busta per il vicino → **rigira a lui**, non infilarla nei tuoi mucchi. (Il caso più banale della stessa logica.)
4. **Triage al pronto soccorso / help-desk / banco-informazioni della biblioteca**: dolore toracico → cardiologia, caviglia storta → ortopedia, "non so cos'ho" + parametri instabili → **escala all'emergenza** (non tirare a indovinare un reparto); paziente con **frattura E dolore toracico** → instrada a **entrambi**.
5. **Catalogazione di un libro**: quale sezione/Dewey? Un libro storia+cucina → **cross-reference**, non forzare uno scaffale; genere ignoto → **trattieni per il bibliotecario**, non collocarlo sbagliato (un libro mal-scaffalato è un libro perso).

### C — Cross-dominio sistemico (salute · business/economia · ecologia)
6. **Diagnosi differenziale (medicina, sistemico)**: dati i sintomi, classifica nella/e classe/i di malattia candidata; **resisti alla diagnosi "ovvia"** (bias di ancoraggio) e considera l'insieme vero; se inconcludente → "indeterminato / altri esami", NON committare una diagnosi plausibile-ma-errata; paziente con più condizioni → **più diagnosi**.
7. **Instradamento richieste in azienda (business/economia)**: una richiesta cliente → vendite vs supporto vs legale vs fatturazione; una richiesta che è **due cose** → **split ai due reparti**; una richiesta nuova/atipica → **coda umana/generale**, non forzarla al reparto più vicino (il mis-routing propaga costo a valle — ticket rimbalzati, SLA persi).
8. **Smistamento rifiuti / riciclo (ecologia)**: oggetto → plastica/vetro/organico/pericoloso; un composito (tetrapak) → **il flusso speciale corretto**, non "abbastanza vicino" alla plastica; ignoto → indifferenziato per regola, **non contaminare** un flusso di riciclo (un mis-sort contamina l'intero lotto — costo reale a valle).

> Dal smistamento-posta (banale) al routing-richieste-azienda / diagnosi-differenziale (sistemico) la logica è **identica**: è QUESTO che il modello deve generalizzare, non il dominio. ≥6 transfer sono **non-software** → la skill non si àncora al codice ([[../feedback_transfer_always_cross_domain]]).

## Label-generation

- **Oracolo = la label-di-dominio (o l'insieme di domini) corretta**: outcome verificabile per costruzione.
- **Fixture self-contained (#22)**: la **tassonomia dei domini è data IN-CONTEXT** (un elenco fisso di domini + il loro scope, vero-per-costruzione) e la richiesta è auto-contenuta → l'esempio testa il **categorizzare**, non il recall di "quali domini esistono nel mondo". Nessun fatto-del-mondo inventato.
- **Mutation/oracle** (riusa [[../../harness/verifiers/deceptive-task-gen]]): genera coppie {richiesta → gold-dominio/i}. Iniettare **esche lessicali** (keyword del dominio sbagliato) così il modello non può scorciatoiare sui token di superficie (come "ottimizza" → marketing, non perf). Includere una frazione **bilanciata** dei negativi: single-che-sembra-multi, no-dominio→generale, ambiguo→chiedi.
- **Multi-dominio**: gold = l'**insieme** di domini; oracle = set-match/macro-F1 → costringe la decomposizione corretta, non lo split riflesso.
- **Complessità variabile** (#19): dal single-dominio banale al multi-dominio sistemico.
- **Demo SFT + RL**: traiettorie estrai-oggetto → mappa → (scomponi-se-multi | astieni-se-nessuno) → label; RL sull'**outcome** (label/insieme corretto) sopra le demo.
- **Decontaminazione**: qualunque istanza-di-mis-routing osservata in esperimenti resta **held-out** → misura il transfer, non la memorizzazione ([[../feedback_intelligence_gap_to_training_class]], msg 1125).

## Hack-check (OBBLIGATORIO)

- **Confidenza-tic / cerimonia** ("categorizzo il task…", "sono al 95% sicuro che sia backend") → **0**: il reward è la label corretta vs oracolo, MAI la confidenza esibita o la narrazione. Premiare la confidenza la renderebbe un tic (proprio il rischio segnalato in msg 1314).
- **Default-collapse** (predire sempre il dominio più frequente / uno fisso per lucrare l'accuracy su un set sbilanciato) → neutralizzato da **oracolo class-balanced + macro-F1 per-dominio**: un predittore costante crolla a chance; e i negativi "no-dominio→generale" puniscono il forzare.
- **Over-splitting** (etichettare tutto multi-dominio per prendere i multi) → neutralizzato dai negativi *single-che-sembra-multi* + dal **set-match simmetrico** (un dominio spurio costa quanto uno mancante: precision E recall).
- **Over-triggering l'astensione** (dire sempre "generale/chiedo" per non sbagliare) → neutralizzato dalla **simmetria**: fallisce ogni caso con un dominio reale → niente reward (come la calibrazione della sorella confabulation).
- **Over-fit all'istanza osservata** → mitigato: istanza held-out + training su A/B/C disgiunti e cross-dominio.

## Links
[[class-metacognitive-self-audit]] (padre) · [[class-confabulation-retrieval-failure]] (sorella — simmetria astieniti-quando-manca) · [[class-stagnation-recovery]] · [[gold-example-transfer-assumption-audit]] · [[class-consequence-intention-conflict]] · [[class-prospective-memory]] · [[../architecture/orchestrator-layer]] · [[../architecture/three-tier-design]] · [[../concepts/out-of-domain-refusal-training]] · [[area-01-organization-planning]] · [[area-04-context-metacognition]] · [[area-11-refusal-scope]] · [[../feedback_reward_hacking_principle]] · [[../feedback_intelligence_gap_to_training_class]] · [[../feedback_transfer_always_cross_domain]]
