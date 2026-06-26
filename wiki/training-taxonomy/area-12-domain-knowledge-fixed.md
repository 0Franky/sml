---
name: area-12-domain-knowledge-fixed
description: Example-space completo per le 3 foglie dell'Area 12 (Domain Knowledge / Immutable Facts, regime "fisso", Tier X) — tutte Q, reward via exact-match/verifier, hint forte→debole come scaffold del recall, wrong-awareness/recovery su API allucinate, hack-check anti-confident-hallucination legato all'anti-hallucination (Area 15).
type: taxonomy-area
tags: [training, taxonomy, area-12, domain-knowledge, immutable-facts, fixed-regime]
sources: [training-taxonomy/README.md §4 Area 12, user notes 2026-06-23]
last_updated: 2026-06-25
status: generated
---

# Area 12 — Domain Knowledge / Immutable Facts

> **Riempimento** dell'Area 12 del backbone ([[README]] §4). Non riscrive lo schema: lo applica foglia per foglia secondo il template canonico §3. Tutte e 3 le foglie sono **Q (quantitative)** — l'esito è oggettivo (il fatto/formula/API è esatto o no, match deterministico).

Questa è l'area del **regime FISSO** opposto a quello variabile del [[../concepts/runtime-symbol-randomization-training|runtime symbol randomization]]: qui il contenuto è **immutabile e oggettivo** (formule fisiche/matematiche, keyword di linguaggio, API canoniche stabili) e va **memorizzato in-weight** via loss minimization e **ripetizione N volte** di esempi fissi — esattamente la riga "Immutabile / oggettivo → Standard CE loss, esempi fissi, ripetizione N volte → memorizzazione in-weight" della tabella del concept ([[../concepts/runtime-symbol-randomization-training]] §principio epistemico). `[EXTRACTED]`

**Distinzione critica con Area 5 §symbol-precision** (collisione deliberata, vedi classe OTHER di ogni foglia): un'**API canonica** (`requests.get`, `useState`) è knowledge **fissa da ricordare**; un **nome user-random** (`frx_q9z`) è da **copiare dal contesto**, mai da memorizzare. Il modello deve tenere separati i due regimi: ricordare ciò che è stabile, citare ciò che è effimero. La foglia "Framework canonical APIs" è il punto di frizione più alto tra i due regimi → `[INFERRED]` rischio di interferenza, da sorvegliare in ablation.

**Tier**: **X** (cross-tier) — la conoscenza canonica serve a tutti i tier, ma è massima nei Tier 2-3 (programming/verticali) per la foglia API e syntax. **Fase curriculum** (§4.bis): queste foglie sono **primariamente Fase 1** (basi/teoria, loss minimization via ripetizione). Gli esercizi con-hint→senza-hint (Fase 2) servono qui solo come **scaffold del recall** (vedi sotto); l'RL agentico (Fase 3) è marginale e serve soprattutto a calibrare l'astensione ("non so") più che a memorizzare nuovi fatti.

**Nota sul significato dell'hint in regime fisso** `[EXTRACTED]` (specifica del task): nelle altre aree l'hint scaffolda una *skill di ragionamento* da interiorizzare; **qui l'hint scaffolda il recall** (es. fornire metà formula, la prima lettera della keyword, la firma parziale dell'API). L'hint è un'impalcatura mnemonica forte→debole, ma **l'obiettivo finale è la classe (2) WITHOUT-hint: il recall puro, senza aiuto**. Il fade-out qui è il passaggio da recognition (riconoscere con cue) a recall (produrre da zero).

**Hack-check trasversale a tutta l'area** (priorità utente 2026-06-23): il rischio dominante per il regime fisso **non** è l'overfit ai test (come in Area 5), ma la **confident hallucination** — il modello **fabbrica un fatto/API plausibile** invece di ammettere "non lo so". Difesa standard applicata a OGNI foglia:
- **Cross-check con doc canonica** (oracolo): la risposta è validata contro la fonte autorevole (formulario/spec linguaggio/doc ufficiale della libreria), non contro un judge.
- **Penalità asimmetrica per allucinazione confidente**: un fatto **sbagliato dato con sicurezza** costa più di un onesto "non so / non sono certo". Il reward favorisce l'astensione calibrata sull'invenzione plausibile.
- **Distrattori di astensione**: una frazione di prompt chiede fatti **inesistenti o fuori-knowledge** → la risposta corretta è astenersi, non confabulare.
- Legame stretto con **Area 15 §factual-calibration / anti-hallucination** (forward-link, file area-15 non ancora generato → vedi [[README]] §4 Area 15) e con [[../concepts/reward-hacking-mitigation]].

**Confidence sull'intero file**: la *struttura* (tag Q, regime fisso, exact-match, hack-check anti-hallucination) è `[EXTRACTED]` dal README §4 Area 12, dall'audit, e dal concept symbol-randomization. Gli *snippet concreti* (formule, keyword, API specifiche) sono fatti canonici verificabili; i *ratio* (es. "% prompt di astensione") sono `[INFERRED]` come proposta operativa da validare con ablation.

---

## Math/physics formulas

- **Area**: Domain Knowledge / Immutable Facts (A12). **Tag**: **Q**.
- **Skill target (segnale)**: **memorizzare e riprodurre esattamente** formule e identità matematiche/fisiche immutabili — la forma esatta dell'equazione, i simboli corretti, le costanti giuste. Sono fatti oggettivi che *non possono cambiare* (`F = m·a`, identità trigonometriche, `E = mc²`, formula quadratica, leggi di Newton/Kirchhoff). È il caso-tipo del regime fisso: CE loss + ripetizione → memorizzazione in-weight.

- **Esempi**:
  - **(1) WITH-hint** — l'hint **scaffolda il recall** (impalcatura mnemonica), forte→debole. Attenzione: l'obiettivo finale è la (2) senza aiuto.
    - *hint forte (metà formula data)*: *"Completa la formula quadratica: `x = (-b ± √(______)) / ______`. Riempi le parti mancanti."* → atteso: `b² - 4ac` (discriminante) e `2a`.
    - *hint medio (nome + struttura)*: *"Scrivi la formula risolutiva dell'equazione di secondo grado `ax² + bx + c = 0` per `x`."* → atteso: `x = (-b ± √(b² - 4ac)) / (2a)`.
    - *hint debole (solo nome)*: *"Qual è la formula quadratica?"* → stesso atteso.
    - Skill scaffoldata: il recupero progressivamente meno assistito della formula esatta.
  - **(2) WITHOUT-hint** — recall puro: *"Esprimi la seconda legge di Newton."* → atteso esatto `F = m·a` (con la consapevolezza che `F` e `a` sono vettori). Nessun cue: il modello produce la formula da zero.
  - **(3) WRONG — awareness** — formula errata da riconoscere: *"È corretta questa identità? `sin²(θ) - cos²(θ) = 1`."* Label: *"sbagliato perché: l'identità pitagorica corretta è `sin²(θ) + cos²(θ) = 1` (somma, non differenza); `cos²(θ) - sin²(θ) = cos(2θ)`."* Il modello **riconosce** l'errore e dice *qual è la forma corretta*, senza necessariamente derivarla.
  - **(4) WRONG — recovery** — fatto errato + correzione: gli si presenta una soluzione che usa il **discriminante sbagliato** `√(b² + 4ac)` (segno `+` invece di `−`) in un calcolo concreto → riconosce l'errore (le radici risultanti non soddisfano l'equazione alla verifica) → **corregge** con `b² - 4ac` → ricalcola → le radici ora verificano `ax²+bx+c=0`. Insegna il loop: fatto-canonico → verifica per sostituzione → correzione.
  - **(5) OTHER** — distrattore/edge:
    - **fatto deprecato vs corrente**: *"Pluto è un pianeta?"* → un fatto la cui *convenzione* è cambiata (riclassificato pianeta nano dal 2006 IAU) → il modello deve dare la classificazione **corrente** con il caveat temporale, distinguendo un fatto stabile (la fisica di `F=ma`) da uno **convenzionale/datato** (lega ad Area 4 §temporal-awareness → [[../concepts/temporal-awareness-timestamps]]).
    - **costante con unità**: `g ≈ 9.81 m/s²` — il valore numerico **e l'unità** sono parte del fatto; ometterle o sbagliare l'ordine di grandezza è errore.
    - **collisione col regime variabile** (anti-pattern): un prompt definisce una "formula" con **simbolo user-random** nel contesto (`q9z = m·a`) → qui NON va memorizzata, va **citata dal contesto** (Area 5 §symbol-precision); il modello deve capire che `q9z` non è canonico, mentre `F=m·a` lo è.
- **Fase curriculum**: **Fase 1** (memorizzazione via ripetizione di un set fisso di formule/identità/costanti). Fase 2 marginale (scaffold del recall con hint). Fase 3 quasi assente (non si "ragiona" una formula immutabile, la si ricorda — il ragionamento è Area 14 §mathematical-reasoning).
- **Reward design (Q → exact-match/verifier)**: **exact-match normalizzato** contro un formulario-oracolo. Normalizzazione algebrica (es. via SymPy `simplify`/`equals`) per accettare forme equivalenti (`2a` vs `a·2`, `b²-4ac` vs `-4ac+b²`) ma rifiutare quelle sbagliate. Per fatti numerici: match del valore **con unità** entro tolleranza dichiarata. **Test**: confronto AST/algebrico con la forma canonica + (dove possibile) **verifica per sostituzione** (le radici prodotte soddisfano l'equazione → verifier funzionale, non solo testuale).
- **Hack-check (OBBLIGATORIO)**: rischio = il modello **inventa una formula plausibile** (giusta nella forma, sbagliata nei coefficienti) invece di ammettere incertezza. Difese: (1) **cross-check col formulario canonico** come oracolo (non un judge); (2) **verifica per sostituzione** dove la formula è applicabile — una formula inventata raramente supera la sostituzione numerica; (3) **penalità asimmetrica**: formula confidente-ma-errata costa più di "non ricordo la forma esatta". Anti-shortcut: variare i **simboli** del prompt tra train ed eval (`ax²+bx+c` vs `αp²+βp+γ`) per assicurare che il modello ricordi la *struttura* dell'identità, non una stringa memorizzata. → [[../concepts/reward-hacking-mitigation]], Area 15 anti-hallucination.

---

## Language syntax / keywords

- **Area**: Domain Knowledge / Immutable Facts (A12). **Tag**: **Q**.
- **Skill target (segnale)**: conoscere **esattamente** le keyword riservate, gli operatori e gli elementi sintattici **fissi** di un linguaggio — `for`, `if`, `def`, `class`, `async`/`await`, `match`, gli operatori (`==`, `===`, `:=`), le parole riservate che NON possono essere usate come identificatori. Sono fatti stabili del linguaggio (a parità di versione). È il complemento "fisso" della tabella di [[../concepts/runtime-symbol-randomization-training]] §scope: *"keyword di linguaggio fisse"* (memorizzate) vs *"nomi user-defined"* (random/citati).

- **Esempi**:
  - **(1) WITH-hint** — hint **scaffolda il recall**, forte→debole:
    - *hint forte (prima lettera/struttura)*: *"In Python, la keyword per definire una funzione inizia con `d__` ed è seguita dal nome. Qual è?"* → atteso `def`.
    - *hint medio (categoria)*: *"Qual è la keyword Python per definire una funzione?"* → atteso `def`.
    - *hint debole (contesto d'uso)*: *"Scrivi l'intestazione (header) di una funzione `foo` senza parametri in Python."* → atteso `def foo():`.
    - Skill scaffoldata: produzione della keyword/forma sintattica esatta con cue decrescente.
  - **(2) WITHOUT-hint** — recall puro: *"Elenca le keyword Python per il controllo di flusso condizionale."* → atteso esatto `if`, `elif`, `else` (non `elseif`, non `else if`). Nessun cue.
  - **(3) WRONG — awareness** — sintassi/keyword errata da riconoscere: gli si mostra `elseif x > 0:` in Python. Label: *"sbagliato perché: Python non ha `elseif` (è una keyword di PHP/VBScript); la keyword Python è `elif`."* Riconoscere la keyword inesistente nel linguaggio target.
  - **(4) WRONG — recovery** — codice con keyword sbagliata + recupero: `function add(a, b) { return a + b }` etichettato come Python → riconosce (`SyntaxError`: `function` non è keyword Python, è JS) → **corregge** in `def add(a, b): return a + b` → il codice ora parsa. Insegna a riconoscere la **provenienza cross-language** della keyword e mappare a quella canonica del target.
  - **(5) OTHER** — distrattore/edge:
    - **fatto deprecato vs corrente (version-aware)**: `print` come **statement** (`print "x"`) era valido in Python 2, è **errore** in Python 3 (`print()` funzione); `match`/`case` esistono **solo** da Python 3.10+. Il modello deve ancorare la validità alla **versione** dichiarata (lega ad Area 5 §version-awareness e Area 4 §temporal).
    - **soft keyword vs reserved**: in Python `match`, `case`, `type` sono *soft keyword* (usabili come identificatori in certi contesti) mentre `for`, `class` sono *reserved* — distinzione fine ma esatta.
    - **collisione col regime variabile**: un prompt definisce una variabile user-random `class_` o `match_` (suffisso per evitare la reserved word) → il modello deve riconoscere che il nome è effimero e **citarlo dal contesto** (Area 5), mentre `class`/`match` restano keyword canoniche. Collega al **language-aware blacklist** di [[../concepts/runtime-symbol-randomization-training]] §reserved keywords (il generatore random NON deve produrre keyword come identificatori).
- **Fase curriculum**: **Fase 1** (memorizzazione del set di keyword/operatori per linguaggio, alto volume presto — è knowledge di base). Fase 2 leggera (scaffold). Fase 3 quasi assente.
- **Reward design (Q → exact-match/verifier)**: **exact-match** sulla keyword/forma + **parser-gate**. (a) per il recall di una keyword: match esatto contro la lista riservata ufficiale del linguaggio (binario); (b) per forme sintattiche prodotte: il frammento **parsa** nel linguaggio/versione dichiarato (`compile()` Python, `node --check`, parser ufficiale). **Test**: confronto con la grammatica/keyword-list canonica + parse-check versionato. Nessun judge: o è la keyword giusta e parsa, o no.
- **Hack-check (OBBLIGATORIO)**: rischio = il modello **inventa una keyword plausibile** (`elseif`, `foreach` in un linguaggio che non l'ha, `def` con sintassi inventata) con sicurezza, per "completare" il pattern. Difese: (1) **cross-check con la keyword-list/grammatica ufficiale** come oracolo + parser reale; (2) **penalità per keyword allucinata** (una keyword inesistente data con confidenza costa più di "non ricordo se questo linguaggio ha questo costrutto"); (3) **distrattori cross-language** (keyword di un linguaggio chiesta per un altro) per beccare il transfer errato. Anti-overfit: variare il **linguaggio target** e la **versione** tra train ed eval, così il modello non memorizza "la risposta è sempre `def`" ma la mappa linguaggio→keyword. → [[../concepts/reward-hacking-mitigation]].

---

## Framework canonical APIs

- **Area**: Domain Knowledge / Immutable Facts (A12). **Tag**: **Q**.
- **Skill target (segnale)**: ricordare **esattamente** le API canoniche e stabili di framework/librerie — nome del metodo/hook, firma, parametri canonici, namespace (`useState`, `app.get(path, handler)`, `db.query(sql, params)`, `requests.get(url, timeout=...)`, `pandas.concat`). Sono fatti stabili **a parità di versione** della libreria. È il complemento "fisso" di [[../concepts/runtime-symbol-randomization-training]] §scope Tier 3: *"sintassi framework"* (memorizzata) vs *"nomi user-defined"* (random). **Frizione massima col regime variabile** → vedi classe OTHER.

- **Esempi**:
  - **(1) WITH-hint** — hint **scaffolda il recall**, forte→debole:
    - *hint forte (firma parziale)*: *"Completa l'hook React per lo stato: `const [state, ______] = useState(______)`."* → atteso `setState` (il setter, nome a scelta dell'utente ma posizione fissa) e `initialValue`; il punto canonico è che `useState` ritorna una **coppia `[value, setter]`**.
    - *hint medio (nome + scopo)*: *"Quale hook React si usa per dichiarare uno stato locale in un componente funzionale, e cosa ritorna?"* → atteso `useState`, ritorna `[value, setterFunction]`.
    - *hint debole (scopo)*: *"Come dichiari uno stato locale in un componente React funzionale?"* → stesso atteso.
    - Skill scaffoldata: recupero dell'API canonica e della sua forma di ritorno/firma.
  - **(2) WITHOUT-hint** — recall puro: *"Definisci una route GET `/users` in Express che risponde `'ok'`."* → atteso esatto `app.get('/users', (req, res) => res.send('ok'))` (metodo `get`, ordine `path, handler`, parametri `req, res`). Nessun cue sull'API.
  - **(3) WRONG — awareness** — **API allucinata** da riconoscere: gli si mostra `useStateHook(0)` o `React.state(0)` o `app.route.get(...)`. Label: *"sbagliato perché: l'hook canonico è `useState` (non `useStateHook`, non `React.state`); in Express il metodo è `app.get(path, handler)`, non `app.route.get`."* Riconoscere l'**API inventata/non-esistente** — è il caso-tipo della confident hallucination.
  - **(4) WRONG — recovery** — codice che usa un'API inesistente + recupero: `requests.fetch(url)` → riconosce (`AttributeError: module 'requests' has no attribute 'fetch'`) → **corregge** con l'API canonica `requests.get(url)` → cross-check con la doc → il codice gira. Insegna: errore-runtime/doc-mismatch → consultare il fatto canonico → sostituire. (Stretta parente di Area 5 §API-correctness, ma qui l'errore è di **memoria del fatto canonico**, non di contratto/firma a runtime.)
  - **(5) OTHER** — distrattore/edge (i due casi richiesti dallo schema):
    - **distrattore — nome user-random simile all'API canonica (collisione col regime variabile)**: il contesto del prompt definisce una funzione user-defined `get(self, url)` su una classe custom, oppure una variabile `useState` ridefinita localmente. Il modello deve distinguere: l'`get` **del contesto** va citato esattamente come scritto (Area 5 §symbol-precision, regime variabile), l'`requests.get` **canonico** va ricordato dalla knowledge. Confondere i due regimi (memorizzare il nome random, o citare male l'API canonica) è l'errore-bersaglio di questa classe. → [[../concepts/runtime-symbol-randomization-training]] (separazione fisso/variabile).
    - **fatto deprecato vs corrente (version-aware)**: `pandas.DataFrame.append()` era canonico ma è stato **rimosso in pandas 2.0** → l'API corrente è `pd.concat`; `componentWillMount` (React, deprecato) vs hooks/`useEffect`. Il modello deve dare l'API **corrente** per la versione dichiarata e segnalare la deprecazione (lega ad Area 4 §stale/freshness e §temporal-awareness → [[../concepts/temporal-awareness-timestamps]]).
- **Fase curriculum**: **Fase 1** (memorizzazione del catalogo di API canoniche stabili per framework in scope — alto valore per i verticali Tier 3). Fase 2 (scaffold del recall + esercizi d'uso). Fase 3 (RL agentico utile qui: in harness, un'API allucinata fallisce a runtime → il loop la corregge contro la doc reale — segnale di reward naturale).
- **Reward design (Q → exact-match/verifier)**: **exact-match del nome/namespace API + exec/import-resolution contro la libreria reale**. (a) il nome dell'API/hook ∈ superficie pubblica reale della libreria/versione (match esatto, no `useStateHook`); (b) il codice **importa ed esegue** senza `AttributeError`/`is not a function` contro la versione dichiarata (o mock con `spec=`/`autospec=True` che rifiuta attributi inesistenti). **Test**: introspezione della libreria reale (`hasattr`/`inspect`) + esecuzione contro versione pinnata + cross-check con doc canonica. Stile BigCodeBench (library calls reali).
- **Hack-check (OBBLIGATORIO — caso-tipo dell'area)**: rischio **primario e nominato** = il modello **fabbrica un'API plausibile** (`requests.fetch`, `useStateHook`, `app.route.get`) invece di ammettere "non conosco questa libreria / non sono certo del nome esatto". È esattamente lo scenario dello Step 2 del task. Difese: (1) **cross-check con doc/superficie reale della libreria** come oracolo + **esecuzione contro la versione reale** (un'API allucinata fallisce deterministicamente con `AttributeError`); (2) **penalità asimmetrica forte per allucinazione confidente** — un'API inventata data con sicurezza è il peggior outcome, peggio di un onesto "non ricordo la firma esatta, consulto la doc"; (3) **mock con `spec=`/`autospec=True`** (un mock permissivo nasconderebbe l'API inventata accettando qualunque attributo → vietato); (4) **distrattori di astensione**: prompt su librerie/versioni fuori-knowledge dove la risposta corretta è astenersi. Legame esplicito con **Area 15 §anti-hallucination** (la calibrazione factual è la stessa skill, qui sul dominio API). → [[../concepts/reward-hacking-mitigation]], Area 15.

---

## Note di chiusura

- **Tutte e 3 le foglie sono Q** → reward via **exact-match/verifier deterministico** (formulario-oracolo, keyword-list/grammatica, superficie API reale + exec), **mai un judge** per il segnale primario. È terreno adatto a GRPO (N completion per prompt, advantage relativo sull'esito del verifier — [[README]] §2.1), ma il volume vive in **Fase 1** (memorizzazione via ripetizione), non in RL.
- **Asse portante dell'area = regime FISSO**: contenuto immutabile → memorizzazione in-weight. È il **contraltare esplicito** del [[../concepts/runtime-symbol-randomization-training|regime variabile]]; la separazione fisso/variabile è la tesi epistemica del progetto e ogni foglia ne tocca il confine nella classe OTHER (formula canonica vs simbolo random; keyword vs identificatore user; API canonica vs nome user-defined del contesto).
- **Hack-check unificante**: a differenza di Area 5 (rischio = overfit ai test), qui il rischio è la **confident hallucination**. La difesa cardine è la **penalità asimmetrica** (sbagliato-confidente ≫ "non so") + **oracolo canonico** (doc/spec/libreria reale) + **distrattori di astensione**. Questo lega l'intera area ad **Area 15 §factual-calibration / anti-hallucination** (file area-15 da generare).
- **Frizione da sorvegliare** `[INFERRED]`: la foglia *Framework canonical APIs* è il punto di massima interferenza tra memorizzare (API canonica) e citare (nome random) — un eventuale degrado del symbol-copy (Area 5) o un'eccessiva memorizzazione di nomi effimeri va monitorato con ablation dedicata (skill `aris-experiment-plan`).
- **Confidence**: struttura/tag/regime/hack-check `[EXTRACTED]`; formule/keyword/API citate sono fatti canonici verificabili; ratio numerici e snippet d'esempio `[INFERRED]`, da validare con ablation.
