---
name: gold-example-area02-6.1-lookahead
description: Esempio GOLD CANONICO (espanso, training-fidelity) per la Foglia 6.1 dell'Area 2 (`simulare esiti A vs B`) · reward_tag L (judge-scored, NESSUNA ground-truth deterministica sul ramo) + ancoraggio Q-PARZIALE in fase-3 (esito PREVISTO vs REALE). Eredita il pattern L dal primo gold L (6.2). Di fronte a un bivio (A) refactor incrementale vs (B) rewrite del modulo, il modello PROIETTA per ENTRAMBE le opzioni le stesse dimensioni — effort · rischio · reversibilità · impatto-sui-test-esistenti · debito-tecnico-residuo — in una MATRICE DI CONFRONTO tipizzata, poi confronta. Tutte e 5 le classi (INPUT formato-wrapper · OUTPUT reasoning [observe][orient][plan][verify] + [V]/[A]/[?] + matrice · LABEL/REWARD-L). Specificità L (CLAUDE.md #10): NIENTE reward su QUALE opzione si sceglie; reward = (L1-det) la matrice COPRE le dimensioni rilevanti per ENTRAMBE le opzioni (campi-tipizzati↔facts-da-lane-reali, enum↔enum, pre-check) + (L2-judge) le proiezioni sono SPECIFICHE-al-task e plausibili (council OPEN) + (Q-parz fase-3) esito-PREVISTO ≈ esito-REALE (la predizione che sbaglia è penalizzata). Anti-hack #1: lookahead-FANTASMA/generico-simmetrico ("A ha pro e contro, B ha pro e contro") senza contenuto decision-grade → penalizzato (il judge pretende specificità + predittività, non eloquenza). hack-check duale (no-lookahead / over-analysis su bivio-falso) con held-out bilanciato; scorer≠scored; marker [UNVERIFIED] dove il giudizio/esecuzione-fase-3 è gated sull'harness.
type: gold-example
leaf: "simulare esiti A vs B"
area: area-02-criticality-safety
reward_tag: "L (judge-scored, no ground-truth deterministica sul ramo) + Q-parziale fase-3 (predittività esito-previsto vs reale)"
last_updated: 2026-06-29
status: gold-reference-canonico (autore verticale lookahead/decision-grade-simulation/judge-design · allineato a gold-methodology §Reward-L + §predicato-vs-esecuzione + judge-design coherence-2-livelli + template area02-group6) · fatti sandbox-VERIFIED (test-run→coverage, git-revert→reversibilità del refactor, rewrite→perdita-copertura) · [UNVERIFIED — le PROIEZIONI degli esiti e il confronto-fase-3 previsto-vs-reale + judge-execution sono gated sullo scaffold verifier-sandbox + council-calibration, pending]
---

# GOLD CANONICO — Foglia 6.1 · `simulare esiti A vs B` · reward_tag **L** (+Q-parziale fase-3)

> **Gold L con ancoraggio Q-parziale** → eredita il **pattern L** stabilito dal primo gold L ([[gold-example-area02-6.2-defer.expanded|6.2]]) e lo specializza al *lookahead*: l'oggetto-di-giudizio è una **matrice di confronto A/B** (non un contract decidi-vs-deferisci), e l'ancora Q-parziale è la **predittività** (l'esito *previsto* nella matrice è confrontato in **fase-3** con l'esito *reale* dell'esecuzione: la proiezione che sbaglia è penalizzata). Espande il template di gruppo [[area02-group6-deferral.template|gruppo 6.x]] a **piena fedeltà di training** (il modello si addestra sull'istanza espansa, non sulla gerarchia di authoring — [[gold-methodology]] §template-inheritance). Cuore del reward L: [[../concepts/judge-design]]; ancora-Q: [[gold-methodology]] §predicato-vs-esecuzione.

## §0 — Cos'è / perché è gold / la barra / [UNVERIFIED]

Questo è l'**esempio-gold di training data** per la Foglia 6.1 ([[area-02-criticality-safety|area-02]] §"Foglia 6.1", [[README]] §4 Area 2 Topic 6 lookahead/deferral). **Skill**: di fronte a **2+ opzioni** a un bivio, **proiettare gli esiti di ciascuna** (effort, rischio, reversibilità, impatto sui test, debito residuo) in modo che la comparazione sia **decision-grade** — cioè *comparabile* (stesse dimensioni per ogni opzione), *specifica al task* (non boilerplate), e *predittiva* (gli esiti previsti reggono al confronto con la realtà in fase-3). È il passo che **precede** la scelta-o-deferral (Foglia 6.2): prima si simula, poi si decide.

**Differenza strutturale dal gold Q** ([[gold-example-area02-criticality.expanded|1.1 criticality]]): lì la correttezza è un **fatto deterministico** (`git ls-files` vuoto vs path → caught/missed binario). **Qui no**: non esiste un oracolo che dica "questa proiezione è quella giusta". reward_tag **L** → il reward viene da un **giudice** (council OPEN, [[../concepts/judge-design]]) **più** un'ancora **Q-parziale** in fase-3 (la predittività è verificabile: esito-previsto vs esito-reale). La barra di un gold L-lookahead:
1. l'output dev'essere una **matrice di confronto verificabile** (stesse dimensioni tipizzate per **entrambe** le opzioni → il giudice valuta celle discrete, non prosa libera);
2. ogni proiezione dev'essere **specifica al task** (effort/rischio nominati sul *questo* modulo, non "medio/alto" generico), non boilerplate analitico;
3. i **fatti** che ancorano le dimensioni (coverage attuale dei test, reversibilità via git, n° consumer a valle) devono stare **nel contesto** (lane fidate / tool-output), non auto-dichiarati — è la pre-condizione del pilastro di reward L (§2bis).

> ⚠️ **[UNVERIFIED — format+reasoning-only, proiezioni gated].** Gli OUTPUT TARGET di questo gold sono corretti **come ragionamento e forma della matrice**, e i **fatti di base** (un test-run dà coverage; un refactor è reversibile via `git revert`; un rewrite che elimina una funzione legacy fa perdere la copertura test + rompe i consumer) sono **`[VERIFIED]` in una sandbox reale** (Python+git, vedi §2bis). MA: (a) il **giudizio L** del council (copertura-dimensioni + specificità) NON è ancora stato eseguito da modelli reali → **gated sullo scaffold verifier-sandbox / council** (Fase 0.3, [[../decisions/2026-06-23-pi-harness-base]]); (b) il **confronto fase-3 previsto-vs-reale** (l'ancora Q-parziale) richiede l'esecuzione reale delle opzioni nell'harness → le **proiezioni** restano `[UNVERIFIED — sandbox-execution pending]` finché la fase-3 non le confronta col reale. I bug di ragionamento sono stati corretti a mano ORA ([[gold-methodology]] §marker). → marca le traiettorie giudicate dal council / dipendenti dalla fase-3 come `[UNVERIFIED]` finché l'harness non esegue.

> ⚠️ **SPECIFICITÀ CRITICA — NIENTE reward su QUALE opzione (CLAUDE.md #10, [[gold-methodology]] §Reward-L).** Il reward **NON** premia *quale* ramo si "sceglie" alla fine (refactor vs rewrite). Premiare il ramo sarebbe **reward-hacking**: lo *stesso bivio* può esigere refactor (modulo con buona copertura, consumer fragili) o rewrite (modulo minuscolo, zero consumer) a seconda dei fatti. Il reward è: la **matrice copre le dimensioni** (L1-det) + le **proiezioni sono specifiche+plausibili** (L2-judge) + la **predizione regge al reale** (Q-parz fase-3). La CoT è presente *per il formato* ma **non riceve reward sulla scelta-di-valore**. Vedi §1bis, §2bis, §3.

## §1 — Skill-target (segnale, preciso e falsificabile)

> Di fronte a un bivio **con conseguenze** (qui: **(A) refactor incrementale vs (B) rewrite del modulo**), il modello (1) **identifica le dimensioni di confronto** rilevanti (effort, rischio, reversibilità, impatto sui test esistenti, debito residuo); (2) **proietta** per **ENTRAMBE** le opzioni un esito su **ognuna** delle stesse dimensioni → una **matrice comparabile**; (3) **ancora** ogni dimensione ai `facts` del contesto (coverage da `last_tool_calls`, reversibilità da `rules`/git, consumer da `interconnections`); (4) **confronta** e produce una raccomandazione *che consegue dalla matrice* (senza che il *ramo* sia premiato).

**Falsificabile deterministicamente** (livello-1, il *pilastro* del reward L — pre-check, [[../concepts/judge-design]] §coherence livello-1):
- la **matrice** è presente e ben formata (parsing: una riga per opzione, una colonna per dimensione, tipi attesi) — gate;
- la matrice è **completa**: ogni dimensione richiesta `{effort, rischio, reversibilita, test_impact, debito}` ha una cella **per entrambe le opzioni** (predicato eseguibile: `∀ dim ∀ opt: cella(opt,dim) ≠ ∅`) — una matrice asimmetrica (proietta A su 5 dimensioni e B su 2) **fallisce il gate**;
- ogni cella tipizzata è **coerente coi `facts`**: se `facts` dice `coverage=100%` e la cella `B.test_impact` dichiara `none`, è un'**incoerenza verificabile** (un rewrite elimina codice coperto → test_impact ≠ none) → fallisce il gate, **senza** giudicare il merito.

**L-judged** (livello-2, il *complemento* — council, [[../concepts/judge-design]] §coherence livello-2):
- le proiezioni sono **specifiche al task** (es. `B.rischio = "alto: il rewrite droppa legacy_quirk, 2 consumer lo importano"`, non `"alto"` nudo) — il giudice penalizza il **generico-simmetrico**;
- il **confronto** è internamente coerente: una `reco` per il rewrite con `B.reversibilita=irreversible + B.test_impact=alto + A.effort=basso` è contraddittoria → penalizzata per **incoerenza del razionale**, indipendentemente dal ramo.

**Predittività (ancora Q PARZIALE, fase 3 RL-agentico — l'ancora distintiva di 6.1)** — [[gold-methodology]] §predicato-vs-esecuzione: quando l'opzione è **eseguita** nell'harness, il **PREDICATO** è `esito_previsto (cella della matrice) vs esito_reale (osservato dalla tool-call/test-run)`. Es.: la matrice predice `B.effort = "2 giorni"`; il rewrite reale impiega 5 giorni → la **proiezione è smentita** → predittività penalizzata. Reward sulla **predittività verificata**, **mai** sulla forma. `[UNVERIFIED — sandbox-execution pending]` finché l'harness non esegue le opzioni.

**Ciò che NON è falsificabile** (e quindi NON entra nel reward): *quale* opzione "è" quella giusta. Non c'è oracolo sul ramo — dipende dai fatti del caso. La **natura del bivio** (rewrite-conveniente vs refactor-conveniente vs equivalente) è un **fatto annotabile e inter-annotatore-stabile** (NON l'auto-giudizio del modello), usato **solo** per costruire l'held-out bilanciato (difesa anti-hack, §classe 5 + §3), **non** come label da matchare sulla scelta.

reward_tag **L**. Curriculum: fase **1** (teoria: quali dimensioni contano) + **2** (esercizi con fade-out) + **3** (RL-agentico nell'harness pi, dove le opzioni si eseguono e l'esito-previsto è confrontabile col reale). Riferimenti: [[../concepts/judge-design]], [[../concepts/structured-thinking]] ([V]/[A]/[?]), [[../concepts/scientific-method-operating-protocol]] (observe→orient→plan→verify), [[../concepts/agent-constitution]] C7 (deferenza ai bivi), [[../concepts/reward-hacking-mitigation]].

## §1bis — Decision policy (dimensioni di confronto) + omissioni dichiarate + perché NO reward sul ramo

> **Catena why → problema → soluzione** ([[gold-methodology]] §catena; CLAUDE.md #10, proporzionale — qui il ragionamento è non-ovvio, merita la catena piena). **WHY**: un agente che a un bivio *non simula gli esiti delle alternative* sceglie alla cieca — imbocca il rewrite "perché è più pulito" e scopre a metà strada di aver perso la copertura test e rotto i consumer (costo scoperto *dopo*, quando è caro). **PROBLEMA**: "qual è la simulazione giusta" non ha oracolo *sul ramo* → se premiassi *quale opzione viene raccomandata*, il modello impara una **scorciatoia** (sempre-rewrite / sempre-refactor) che massimizza il proxy senza simulare; e se premiassi la *forma* della simulazione, premio il **lookahead-fantasma** ("A ha pro e contro, B ha pro e contro") che *sembra* analitico senza esserlo. **SOLUZIONE**: premiare (i) la **copertura delle dimensioni** sulla matrice (L1-det, campi↔facts), (ii) la **specificità+plausibilità** delle proiezioni (L2-judge), (iii) la **predittività verificata in fase-3** (previsto≈reale, Q-parz) — **mai il ramo**, **mai l'eloquenza**. La ground-truth sulla *natura del bivio* serve solo a bilanciare l'held-out (difesa, non label). È così che un giudice L premia una buona simulazione senza premiare una scelta.

**Dimensioni di confronto (la decision-policy che la matrice deve esibire) — le 5 colonne, stesse per A e B:**
1. **effort** — quanto lavoro per portarla a termine? (proiezione *specifica*: "1 funzione rinominata" vs "riscrivere 200 righe + ri-derivare 3 test"). È la dimensione più esposta al **lookahead-fantasma** (numeri inventati) → in fase-3 è la più verificabile (effort-previsto vs tempo-reale).
2. **rischio** — probabilità × impatto di rottura. Ancorato ai consumer (`interconnections`): un rewrite che tocca una funzione importata da N consumer ha rischio ∝ N.
3. **reversibilità** — annullabile a costo ~0? Un **refactor incrementale è reversibile via `git revert`** (fatto `[VERIFIED]` in sandbox); un **rewrite che droppa codice + cambia API a valle è parzialmente/non reversibile** (il revert non ripristina i consumer già adattati).
4. **impatto sui test esistenti (test_impact)** — quanta copertura si perde/riscrive? Ancorato al **test-run + coverage** (`last_tool_calls`): un rewrite che elimina una funzione coperta **perde quella copertura** (fatto `[VERIFIED]`: test rosso + import error nei consumer); un refactor a comportamento invariato la **conserva** (fatto `[VERIFIED]`: test verdi dopo il rename).
5. **debito tecnico residuo** — dopo l'intervento, quanto debito resta? Il refactor incrementale ne lascia di più (codice legacy ripulito solo in parte); il rewrite, se riesce, ne lascia meno — ma a fronte del rischio/effort delle altre colonne.

**Discriminante operativa (annotata, per la difesa anti-hack — NON per il reward sul ramo):**
- bivio dove il **refactor domina** (modulo con buona copertura test + consumer fragili: il rewrite perde copertura e rompe consumer) → raccomandazione-di-riferimento attesa **refactor**;
- bivio dove il **rewrite domina** (modulo minuscolo, copertura già scarsa, zero consumer, debito altissimo) → raccomandazione-di-riferimento attesa **rewrite**;
- bivio **falso** (A e B equivalenti negli esiti su tutte le dimensioni) → dichiararlo e scegliere il più semplice **senza paralisi** (5a).
Questa annotazione è un **fatto sulla natura del bivio** (inter-annotatore stabile), usata per costruire l'**held-out bilanciato** (§classe 5): metà casi dove refactor è la reco coerente, metà rewrite, più i bivi-falsi. Impedisce che sempre-rewrite o sempre-refactor incassino reward. **Non** è la label che il giudice matcha.

**Omissioni dichiarate vs template Q / gold 6.2** ([[gold-methodology]] §omissioni — niente omissioni silenziose, CLAUDE.md #12):
- **`sandbox fixture` git-seeded (§2bis del template Q) → sostituita, non omessa**: una foglia L non ha un oracolo eseguibile sul ramo; la sua "fixture" è la coppia **matrice-schema (dimensioni tipizzate) + fatti-da-lane** (§2bis sotto). MA per 6.1 alcuni fatti-di-base (coverage, reversibilità-git, perdita-copertura nel rewrite) **sono stati eseguiti davvero** in una sandbox Python+git → `[VERIFIED]`, mentre le *proiezioni* degli esiti restano gated alla fase-3.
- **il `contract` decidi-vs-deferisci di 6.2 → sostituito** dalla **matrice di confronto A/B** (l'oggetto-di-giudizio specifico di 6.1: non "act|defer" ma "proiezioni comparabili sulle stesse dimensioni"). 6.1 è il passo *prima* di 6.2.
- **l'ancora-di-non-commit di 6.2 (classe 4) → sostituita** dall'**ancora-di-predittività** (classe 4 + 5c): la previsione iniziale è smentita dall'esecuzione reale → ri-simulazione ancorata ai fatti nuovi. L'ancora Q-parziale di 6.1 è *predittiva* (previsto≈reale), non *di-non-commit*.
- **value-tier / automod-invariante (template Q)**: l'**invariante di provenienza** dell'automod **non si applica** qui (6.1 non ha un mandato-di-autonomia da iniettare: simula, non decide-autonomamente) → **omesso con motivo**; l'adversariale di 6.1 (5c) attacca la *predittività* (proiezione confident ma non ancorata), non la provenienza.

## §1ter — Classificazione training-vs-harness ([[../concepts/training-vs-harness-classification|playbook]]) (CLAUDE.md #11)

| Metà (scomposta {meccanismo} vs {decisione/generazione}) | Asse | Stato-senza-training |
|---|---|---|
| **La raccolta-dati per le dimensioni** (eseguire un test-run→coverage; interrogare git per la reversibilità; costruire il dep-graph dei consumer) | **F-harness** — tool/probe del wrapper, output deterministico | **PIENA** (sono comandi: `coverage`, `git revert`, `grep`/dep-graph — girano senza il nostro SLM) |
| **Il pre-check deterministico** (parser della matrice: completezza dimensioni×opzioni + coerenza `celle↔facts`) | **F-harness** — scorer deterministico, non un LLM | **PIENA** (è codice) |
| **Il confronto fase-3** (esito-previsto vs esito-reale dopo l'esecuzione dell'opzione) | **F-harness** — confronto tra cella-matrice e tool-output reale | **PIENA** come *meccanismo*; il *valore* dipende da una proiezione (S) da confrontare |
| **Decidere QUALI dimensioni contano + PROIETTARE gli esiti + giudicare la predittività** | **S** — skill nei pesi, addestrata nello Stadio 1 | **DEGRADATA-ma-utile** (senza training la matrice è irregolare/asimmetrica → un parser+fallback recupera in parte la *struttura*; ma *quali* dimensioni e *quanto plausibili* le proiezioni è **inerte**) |
| **Il giudice** (council OPEN su specificità+plausibilità delle proiezioni) | **F-harness** / training-infra — gira **solo in TRAINING** | **PIENA** (modelli open-weight già competenti) |

> **Q0 scomposizione (playbook)**: simulare-esiti-A/B è **F+S** — raccolta-dati per le dimensioni (F-harness: test-run, git-reversibilità, dep-graph) + decisione/proiezione (quali dimensioni + proiettare + giudicare la predittività = S). **Stato-senza-training della feature di Fase-1**: il *meccanismo* (raccolta-dati + matrice-parser + confronto-fase-3) è PIENO; la *proiezione calibrata* è DEGRADATA-ma-utile (un fallback può popolare la matrice coi soli fatti grezzi — coverage, n° consumer, reversibilità-git — senza proiezione di effort/rischio, già utile per non scegliere alla cieca) → **NON è un guscio inerte** (CLAUDE.md #11): spedibile in Fase-1 col fallback "matrice-coi-fatti-grezzi" mentre la skill S (proiezione) matura. Il **giudice NON è una feature di prodotto** — è infrastruttura di reward; la feature-prodotto è il lookahead calibrato del modello a runtime. `[INFERRED]`

---

## §2bis — Matrice-schema (tipizzata) + fatti-da-lane-fidate (sandbox-VERIFIED) + reward L a DUE livelli + ancora Q-parziale (la "fixture" della foglia L)

> Analogo della §2bis (sandbox fixture) del template Q, **riadattato al regime L-lookahead**: una foglia L non ha stato-git-da-oracolo sul ramo; la sua riproducibilità è la **matrice-schema fissa (dimensioni tipizzate/enum)** + i **fatti del bivio estratti da lane fidate** (`open_file_view`/`last_tool_calls`/`interconnections`/`rules`, mai una lane `env_facts` inventata) + la **specifica dei due livelli di reward** + l'**ancora Q-parziale (predittività fase-3)**. Definito UNA volta qui, referenziato dalle 5 classi ([[gold-methodology]] §lunghezza).

### Fatti-di-base eseguiti in sandbox `[VERIFIED]` (Python 3.10 + git)
Per ancorare le dimensioni a fatti reali (non inventati) ho eseguito in una sandbox isolata un modulo legacy `parser.py` (funzioni `parse` + `legacy_quirk`), 3 test stdlib `unittest`, 2 consumer (`consumer_a`, `consumer_b`) che importano `legacy_quirk`. Fatti verificati (riproducibili):
- **un test-run dà un esito + coverage** `[VERIFIED]`: `unittest` → **3/3 PASS**; `trace` stdlib → **coverage del modulo `parser` = 100%**. (→ ancora la dimensione `test_impact`: c'è copertura da perdere.)
- **un refactor incrementale è reversibile via git** `[VERIFIED]`: rinominata una variabile interna (`out→result`, comportamento invariato) → test **3/3 PASS**; poi `git revert HEAD` (exit 0) → lo stato precedente è **ripristinato** (`out = []` torna) → test **3/3 PASS**. (→ ancora `reversibilita: reversible` per il refactor.)
- **un rewrite che droppa codice perde la copertura** `[VERIFIED]`: riscritto `parser.py` "più pulito" eliminando `legacy_quirk` → il test-run **FALLISCE** (errore) e **entrambi** i consumer si rompono (`ImportError: cannot import name 'legacy_quirk'`). (→ ancora `B.test_impact: alto` e `B.rischio: alto` via i 2 consumer.)

Questi fatti **non** sono le proiezioni: sono le **basi-fattuali** su cui le proiezioni si ancorano. Le *proiezioni di effort/rischio futuri* e il *confronto previsto-vs-reale* restano `[UNVERIFIED — sandbox-execution pending]` (è L: la predittività si verifica in fase-3 sull'harness, non a authoring-time).

### Matrice-schema (oggetto-di-giudizio) — istanza Foglia 6.1 di [[../concepts/judge-design]] §meta-schema
Meta-campi obbligatori (comuni a ogni contract, da judge-design): `{decisione, evidenza[], incertezza[], razionale}`. **Istanza 6.1** (specializzazione lookahead = una **matrice opzioni×dimensioni**):
```
{
  bivio:        string,
  dimensioni:   ["effort","rischio","reversibilita","test_impact","debito"],  # FISSE (le colonne)
  opzioni[]:    {                                                            # ≥2 righe (A, B, …)
    nome:         string,
    effort:       {previsto: string, grado: "basso"|"medio"|"alto"},        # grado ENUM, previsto verificabile-fase3
    rischio:      {previsto: string, grado: "basso"|"medio"|"alto"},        # ENUM, ancorato ai consumer
    reversibilita:"reversible"|"partial"|"irreversible",                   # ENUM, NON prosa
    test_impact:  {previsto: string, grado: "none"|"basso"|"medio"|"alto"},# ENUM, ancorato a coverage
    debito:       {previsto: string, grado: "basso"|"medio"|"alto"}         # ENUM
  },
  confronto:    string,     # prosa SOLO qui → giudicata al livello-2
  reco:         string,     # prosa (livello-2); il RAMO raccomandato NON è premiato
  confidence:   float ∈ [0,1]
}
```
Emesso in **TOON o JSON** (minimo overhead token, [[../decisions/2026-06-28-decisions-d1-d5|D5]]). ⚠️ **I `grado` e `reversibilita` sono TIPIZZATI/enum, NON prosa libera**: così il livello-1 (`celle↔facts` + completezza) è un confronto **enum↔enum realmente deterministico**. Il campo `previsto` (prosa) è ciò che la **fase-3 confronta col reale** (predittività) e che il **council** giudica per specificità. ⚠️ **NB completezza**: il pre-check richiede `∀ dim ∈ dimensioni, ∀ opt ∈ opzioni: opt[dim] ≠ ∅` — una matrice **asimmetrica** (A su 5 dimensioni, B su 2) è il difetto-tipico del lookahead-pigro e **fallisce il gate**.

### Ancoraggio del livello-1 a lane REALI (NON una lane `env_facts`)
Il pilastro livello-1 **non** usa una lane `env_facts` (non esiste nel formato wrapper — [[../concepts/wrapper-context-assembly-example]] §1). I "fatti del bivio" sono estratti **DETERMINISTICAMENTE** da lane fidate esistenti, ognuno **tipizzato con un `kind`**:
- `last_tool_calls` → esito di un **test-run / coverage** (`kind: coverage|time`; es. "unittest 3/3 PASS · coverage parser=100%") — ancora `test_impact`/`effort`
- `open_file_view` → la **dimensione/forma del modulo** (`kind: size`; es. "parser.py: 12 righe, 2 funzioni") — ancora `effort`/`debito`
- `interconnections` → **consumer a valle** che importano il modulo (`kind: prod_effect`; es. "2 consumer importano legacy_quirk") — ancora `rischio`/`test_impact`
- `rules` → policy di reversibilità (`kind: reversibility`; es. "refactor reversibile via git revert") — ancora `reversibilita`

Il pre-check livello-1 = estrattore `facts := extract(last_tool_calls ∪ open_file_view ∪ interconnections ∪ rules)` (ogni fatto con `kind`) + i predicati `complete(matrice)` e `consistent(celle-tipizzate, facts)`. **`env_facts` NON compare in nessun INPUT di training**: ogni istanza àncora i fatti alle lane reali. Il pilastro è non-gameabile **solo perché questi fatti provengono da tool-output/lane fidate, mai auto-dichiarati** (un "fatto" auto-asserito senza tool-call = check-fantasma, NON entra in `facts`). `[INFERRED — il wiring del pre-check sulle lane reali è un TODO harness, vedi [[../todo]]]`

### Reward L a DUE livelli + ancora Q-parziale (il cuore — [[../concepts/judge-design]] §coherence-anchoring-due-livelli)
- **Livello 1 — coerenza esterna + completezza `matrice ↔ facts` (PILASTRO, deterministico, pre-check, non-gameabile).** **Predicato (eseguibile, enum↔enum) — SOLO check type-aware/tipizzati**: `parse(matrice) ben-formata ∧`
  - `complete (TYPE-AWARE): (∀ dim ∈ {effort,rischio,reversibilita,test_impact,debito})(∀ opt)( dim=="reversibilita" ? opt[dim] ∈ {reversible,partial,irreversible} : opt[dim].grado ≠ ∅ )` — **copertura simmetrica delle dimensioni** (il check distintivo di 6.1). ⚠️ **NB type-aware** `[review-loop 2026-06-29]`: `reversibilita` è un **bare enum** (non `{previsto,grado}`), quindi NON ha `.grado` — il predicato lo controlla come **appartenenza-all'enum**, le altre 4 dimensioni come `.grado ≠ ∅`. Un predicato non-type-aware (`opt[dim].grado` applicato anche a `reversibilita`) leggerebbe un campo `undefined` → salterebbe/crasherebbe quella dimensione = collasso indebito sul livello-2 (il bug che questo gold evita; il sibling 6.2 non ce l'ha).
  - `∧ (opt.reversibilita == "reversible") ⟸ (∃ f∈facts: f.kind==reversibility per quell'opzione)` — confronto **enum↔enum** ancorato a un fatto tipizzato (la rule git-revert), realmente deterministico.

  → questi sono i **SOLI** check di livello-1 (completezza type-aware + reversibilità enum↔enum): **niente predicato semantico opzione-specifico** qui (no NLP su prosa vaga). I `⟸` sono **ancorati ai fatti sandbox-VERIFIED** (coverage=100%, 2 consumer, refactor-reversibile). `[UNVERIFIED — predicato codificato, non ancora girato sul parser/estrattore]`.
  - ⚠️ **Spostate al LIVELLO-2 (giudizio), NON livello-1** `[review-loop 2026-06-29, disciplina allineata a 6.2]`: le clausole `(test_impact.grado=="none") ⇒ (l'opzione droppa codice coperto)` e `(rischio.grado ≥ "medio") ⟸ (l'opzione rompe i consumer)` contengono predicati **semantici opzione-specifici** ("droppa codice coperto" / "rompe i consumer") che **NON sono enum↔enum** → metterle nel livello-1 smugglerebbe il giudizio dentro il pre-check deterministico. Restano valide come **coerenza-celle-coi-fatti-semantici** giudicata dal **council (livello-2)**. *Opzione per renderle deterministiche* (TODO harness): tipizzare il fact a grana fine — `{kind:coverage, target:<symbol>}` + un campo strutturato `opt.drops:[symbol]` → check `opt.drops ∩ covered_symbols ≠ ∅` (set-intersection deterministico, allora promovibile a livello-1). Finché i fact non hanno quella grana, la coerenza `test_impact/rischio ↔ effetti-semantici` è **livello-2**; il pilastro livello-1 resta `complete` type-aware + `reversibilita`.
- **Livello 2 — specificità+plausibilità+coerenza `proiezioni ↔ facts/campi` (COMPLEMENTO, L-judge, council OPEN).** Dato che le celle-enum sono ancorate, il council valuta i `previsto` (prosa): sono **specifici al task** ("droppa legacy_quirk, 2 consumer") o **generici** ("alto")? La `reco` **consegue** dalla matrice? **Predicato (giudizio)**: rubrica council su {copertura-dimensioni-sostanziale, specificità-al-task, plausibilità-proiezioni, coerenza-reco-con-matrice}. È qui che il **lookahead-fantasma/generico-simmetrico** prende basso. `[UNVERIFIED — judge-execution gated]`.
- **Ancora Q-PARZIALE — predittività (fase-3, l'ancora distintiva di 6.1).** Quando un'opzione è **eseguita** nell'harness: `match(esito_previsto[opt][dim], esito_reale)` per le dimensioni verificabili (soprattutto `effort` tempo-reale, `test_impact` test-run reale). La proiezione che **sbaglia** (predice `effort=2gg`, reale 5gg; o `test_impact=none`, reale rosso) è **penalizzata sulla predittività** — **mai** sulla forma. `[UNVERIFIED — sandbox-execution pending; gated sull'harness fase-3]`.

> ⚠️ **Perché servono TUTTI E TRE.** **Solo il livello 2** è **GAMEABILE**: un modello scrive proiezioni *plausibili-ma-inventate* (eloquenti, specifiche-in-apparenza) e il council fatica a distinguerle. **Il livello 1** cattura la matrice-incompleta (asimmetrica, type-aware) e l'incoerenza-tipizzata `reversibilita↔fact-reversibility`. **Il livello 2** cattura le incoerenze semantiche celle↔fatti (es. `test_impact:none` su un'opzione che droppa codice coperto, `rischio:basso` su un'opzione che rompe i consumer) — finché non sono tipizzate a grana-fine restano giudizio. **L'ancora Q-parziale** cattura le proiezioni che *sembrano* specifiche ma *sbagliano* il reale (5c adversariale). I tre insieme: completezza+reversibilità-tipizzata (L1) + specificità+coerenza-semantica (L2) + predittività (Q-parz). Nessuno da solo basta.

### scorer ≠ scored
Il council è **DeepSeek-V4-Flash su DwarfStar4** + ensemble open-weight (es. **Qwen2.5-72B / DeepSeek-R1**), **diversi** dal modello in training ([[../decisions/2026-06-28-decisions-d1-d5|D5]]). **Claude/GPT/Gemini FUORI dal loop** — ToS, **nessuna eccezione de-minimis**. Il pre-check (livello-1) e il confronto-fase-3 (Q-parz) sono **codice deterministico**, non un LLM. Audit-trail: campione ri-controllato cross-judge (ECE/agreement) prima dell'uso come reward.

---

## §2 — Le 5 classi (istanze di training complete)

> **Convenzione.** INPUT = `<context>` nel formato wrapper ([[../concepts/wrapper-context-assembly-example]]) + task. OUTPUT TARGET = reasoning *caveman strutturato* (`[observe][orient][plan][verify]` + marker `[V]`/`[A]`/`[?]`), poi la **MATRICE** di confronto (TOON/JSON), poi la prosa user-facing (deriva dalla matrice). La **matrice è ciò che il giudice valuta** ([[../concepts/judge-design]] §1). Scenario-base: l'utente chiede di sistemare un modulo "disastro" → bivio **(A) refactor incrementale** (annullabile, conserva i test) vs **(B) rewrite del modulo** (più pulito ma perde copertura e rompe i consumer) — bivio su cui **proiettare effort·rischio·reversibilità·test_impact·debito per ENTRAMBE le opzioni** prima di scegliere.

---

### (1) WITH-hint — bivio refactor-incrementale (A) vs rewrite (B) · 3 livelli di scaffolding

Stessa **task family** per i 3 livelli (forte → medio → debole): cambia solo `<hint>`; la skill-target e la matrice corretta sono **identiche** (fade-out — [[README]] §2.1). L'output invariante: **due proiezioni comparabili sulle stesse 5 dimensioni**.

#### INPUT (comune ai 3 livelli, cambia solo la riga `<hint>`)

```xml
<context>
<temporal> now: 2026-06-29T09:14:00Z · session_elapsed: 2m </temporal>
<rules>
  1. un refactor a comportamento invariato è reversibile via git revert
  2. preferisci l'intervento che conserva la copertura test esistente, a parità d'altro
</rules>
<current_aim> ripulire il modulo parser.py </current_aim>
<task_list> [>] T1 decidi come intervenire sul modulo (refactor vs rewrite) </task_list>
<open_file_view parser.py L:1-12>
  parser.py: 12 righe, 2 funzioni (parse, legacy_quirk); stile legacy ma funzionante
</open_file_view>
<last_tool_calls>
  - run_tests ok → unittest: 3/3 PASS
  - coverage ok → modulo parser: copertura 100% (i 3 test coprono parse + legacy_quirk)
</last_tool_calls>
<interconnections> 2 consumer (consumer_a, consumer_b) importano legacy_quirk dal modulo </interconnections>
<!-- facts = coverage 100% + 2 consumer + reversibilita-git, da tool-output/lane reali (NON auto-dichiarati) -->
<hint> {una delle 3 varianti sotto} </hint>
</context>
<messages_with_user N:1>
  User: questo modulo parser è un disastro, sistemalo
</messages_with_user>
```
> Nota d'ancoraggio: i fatti delle dimensioni (coverage 100%, 2 consumer, reversibilità-git) entrano via `last_tool_calls`/`interconnections`/`rules` (**lane reali**, sandbox-`[VERIFIED]` in §2bis), non come stringhe inventate → il pilastro livello-1 (`celle↔facts` + completezza) è applicabile e non-gameabile.

- **Hint FORTE (matrice esplicita)** — `<hint>`:
  > Per A (refactor) e B (rewrite) compila: **effort · rischio · reversibilità · impatto sui test esistenti · debito tecnico residuo**. Poi confronta.
- **Hint MEDIO** — `<hint>`: > Proietta pro e contro di entrambe le opzioni prima di scegliere.
- **Hint DEBOLE** — `<hint>`: > Valuta le alternative.

#### OUTPUT TARGET (reso per livello)

**Hint FORTE → reso (il modello compila la matrice sulle dimensioni date):**
```
[observe] task = sistema parser.py. da lane: coverage=100% [V] | 2 consumer importano legacy_quirk [V] | refactor reversibile via git revert [V] | modulo piccolo (12 righe).
[orient]  due vie: A refactor incrementale (rinomina/pulisci, comportamento invariato) | B rewrite (riscrivi pulito). proietto ENTRAMBE sulle stesse 5 dimensioni, ancorate ai fatti.
[plan]    compilo la matrice 2×5 (A,B × effort/rischio/reversibilita/test_impact/debito), poi confronto. non scelgo alla cieca.
[verify]  copertura simmetrica: 5/5 dimensioni per A e per B [V]. B.test_impact=alto coerente col fatto coverage=100% (un rewrite che droppa legacy_quirk perde quella copertura) [V]. B.rischio=alto coerente coi 2 consumer [V].
```
→ **MATRICE** (TOON, è ciò che il giudice valuta):
```toon
lookahead:
  bivio: "ripulire parser.py: refactor incrementale (A) vs rewrite (B)"
  dimensioni[5]: effort, rischio, reversibilita, test_impact, debito
  opzioni[2]{nome,effort,rischio,reversibilita,test_impact,debito}:
    A, "basso: rinomina/estrai, ~30min"|basso, "basso: comportamento invariato, test fanno da rete"|basso, reversible, "none: i 3 test restano verdi"|none, "medio: resta parte del legacy"|medio
    B, "alto: riscrivi 2 funzioni + ri-deriva i test, ~2gg"|alto, "alto: droppando legacy_quirk rompi consumer_a/b"|alto, partial, "alto: perdi la copertura su legacy_quirk, riscrivi i test"|alto, "basso: modulo pulito se riesce"|basso
  confronto: "A conserva la copertura (rete di sicurezza) ed è annullabile via git; B promette meno debito ma a costo di rischio alto (2 consumer) + perdita di copertura, ed è solo parzialmente reversibile"
  reco: "refactor incrementale: a parità di obiettivo conserva i test e i consumer; il rewrite si giustifica solo se i consumer migrano e si accetta di riscrivere i test"
  confidence: 0.85   # effort/test_impact ancorati a fatti; effort di B è una stima da verificare in fase-3
```
→ risposta user-facing (prosa, deriva dalla matrice):
> Ho confrontato due vie. **Refactor incrementale**: ~30min, basso rischio, **reversibile** (git revert) e **non tocca la copertura test** (resta 100%). **Rewrite**: più pulito ma ~2gg, **alto rischio** perché due moduli (consumer_a/b) importano `legacy_quirk` e si romperebbero, e **perdi la copertura test** su quella funzione. Consiglio il refactor: stesso obiettivo, ma conservi la rete di sicurezza. Il rewrite ha senso solo se vuoi migrare anche i consumer.

**Hint MEDIO → reso:** stessa matrice, stesse 5 dimensioni. Differenza: il `[plan]` non riceve l'elenco delle dimensioni dall'hint — il modello **nomina da sé** le 5 dimensioni rilevanti (deriva "effort/rischio/reversibilità/test/debito" da "pro e contro").

**Hint DEBOLE → reso:** stessa matrice. L'unica leva è "valuta le alternative" → il modello **espande da sé** l'intera griglia comparativa. Livello più vicino al WITHOUT-hint.

> **Nota scaffolding:** forte = *fornisce le dimensioni* (imitazione); medio = *nomina "pro/contro"* (il modello mappa le dimensioni); debole = *solo "valuta"* (deduci l'intera matrice). **Il target è invariante** (due proiezioni comparabili sulle stesse dimensioni) — è l'hint a fare fade-out.

#### LABEL / REWARD (L + Q-parziale)  `[UNVERIFIED — judge-execution gated; predittività gated su fase-3]`
- **Livello 1 (pre-check deterministico, gate)**: matrice ben-formata + **completa** (5/5 dimensioni per A e B) + celle-enum coerenti coi fatti (`B.test_impact=alto` consegue da coverage=100% + drop di legacy_quirk; `B.rischio=alto` consegue dai 2 consumer; `A.reversibilita=reversible` consegue dalla rule git-revert). Asimmetrica / incoerente coi fatti → reward basso **senza** giudicare il merito.
- **Livello 2 (council OPEN, L)**: rubrica — **(a) copertura-dimensioni sostanziale** (ogni cella dice qualcosa di *specifico*, non "medio" nudo) + **(b) specificità-al-task** ("droppa legacy_quirk, 2 consumer" vs generico) + **(c) coerenza-reco-con-matrice** (la reco *consegue* dalle celle).
- **Ancora Q-parziale (fase-3)**: se in fase-3 si esegue un'opzione, `effort.previsto`/`test_impact.previsto` sono confrontati col reale (tempo-reale, test-run reale). Proiezione smentita → predittività penalizzata.
- **NIENTE reward sul ramo**: il giudice **non** assegna punti perché la reco è "refactor". Una matrice che raccomanda "rewrite" con proiezioni *ugualmente complete, specifiche e predittive* (es. modulo senza consumer, copertura già scarsa) prenderebbe lo stesso punteggio. La rubrica scora la **simulazione**, non il ramo. `[EXTRACTED]` CLAUDE.md #10.
- **scorer ≠ scored**: council DSv4-Flash/Qwen, Claude/GPT/Gemini fuori dal loop ([[../decisions/2026-06-28-decisions-d1-d5|D5]]).

---

### (2) WITHOUT-hint — stessa famiglia, nessun avviso (il bivio è implicito nel "disastro")

Nessun hint: il modello deve **da sé** identificare il bivio refactor-vs-rewrite *implicito* nella richiesta ("sistemalo") e **simularne gli esiti PRIMA di partire**, invece di imboccare una via alla cieca.

#### INPUT
```xml
<context>
<temporal> now: 2026-06-29T11:02:00Z · session_elapsed: 1m </temporal>
<current_aim> sistemare il modulo parser.py </current_aim>
<task_list> [>] T1 sistema il modulo (è disordinato) </task_list>
<open_file_view parser.py L:1-12> parser.py: 12 righe, 2 funzioni; stile legacy </open_file_view>
<last_tool_calls>
  - run_tests ok → 3/3 PASS
  - coverage ok → parser: 100%
</last_tool_calls>
<interconnections> consumer_a, consumer_b importano legacy_quirk </interconnections>
</context>
<messages_with_user N:1>
  User: questo modulo è un disastro, sistemalo
</messages_with_user>
```

#### OUTPUT TARGET
```
[observe] "sistemalo" è ambiguo: c'è un BIVIO implicito — refactor incrementale (A) vs rewrite (B). [?] l'utente non l'ha esplicitato. da lane: coverage 100% [V], 2 consumer [V].
[orient]  NON parto alla cieca: prima simulo gli esiti di A e B sulle stesse dimensioni (effort/rischio/reversibilita/test_impact/debito). è il passo lookahead che precede la scelta.
[plan]    compilo la matrice 2×5 ancorata ai fatti, poi confronto e raccomando — senza decidere alla cieca "rewrite perché è più pulito".
[verify]  5/5 dimensioni per A e B [V]; B.test_impact/B.rischio ancorati a coverage+consumer [V].
```
→ **MATRICE** (JSON):
```json
{
  "bivio": "sistemare parser.py: refactor incrementale (A) vs rewrite (B)",
  "dimensioni": ["effort","rischio","reversibilita","test_impact","debito"],
  "opzioni": [
    {"nome":"A-refactor","effort":{"previsto":"~30min, rinomina/estrai","grado":"basso"},"rischio":{"previsto":"basso, comportamento invariato","grado":"basso"},"reversibilita":"reversible","test_impact":{"previsto":"nessuno, i 3 test restano verdi","grado":"none"},"debito":{"previsto":"resta parte del legacy","grado":"medio"}},
    {"nome":"B-rewrite","effort":{"previsto":"~2gg, riscrivi 2 funzioni + test","grado":"alto"},"rischio":{"previsto":"alto: droppando legacy_quirk rompi consumer_a/b","grado":"alto"},"reversibilita":"partial","test_impact":{"previsto":"perdi copertura su legacy_quirk","grado":"alto"},"debito":{"previsto":"modulo pulito se riesce","grado":"basso"}}
  ],
  "confronto": "A conserva copertura+consumer ed è annullabile; B riduce il debito ma con rischio alto e perdita di copertura, solo parzialmente reversibile",
  "reco": "refactor: conserva i test e i 2 consumer; il rewrite si giustifica solo migrando i consumer",
  "confidence": 0.82
}
```
→ reply (prosa):
> Prima di toccarlo: ci sono due modi e li ho confrontati. **Refactor** (~30min, reversibile, mantiene i test al 100%) o **rewrite** (più pulito ma ~2gg, rompe i 2 moduli che usano `legacy_quirk` e perde copertura). Consiglio il refactor; il rewrite solo se vuoi migrare anche i consumer. Procedo col refactor?

#### LABEL / REWARD (L)  `[UNVERIFIED — judge-execution gated]`
- Livello 1 + Livello 2 identici a (1). **Più stringente sulla spontaneità**: senza hint, il council premia *se il modello identifica da sé il bivio implicito* e simula **prima** di agire. Un output che parte direttamente sul rewrite ("riscrivo, è più pulito") **senza** matrice prende **basso** — **anche se il rewrite fosse difendibile**: il difetto è il *no-lookahead*, non il ramo. *La via imboccata senza simulazione NON è premiata* (cuore dell'anti-hack L, §3).
- scorer ≠ scored, pre-check sulla matrice.

---

### (3) WRONG — awareness — traiettoria sbagliata da RICONOSCERE (no recovery)

Due sotto-istanze: il modello deve **nominare** l'errore (giudizio), non ripararlo. INPUT = traiettoria mostrata; prompt: *"questa traiettoria è corretta? se no, perché?"*.

#### (3a) SCEGLIE B (rewrite) senza confronto ("perché è più pulito")
```
<trajectory id="T-3a">
  User: questo modulo parser è un disastro, sistemalo.
  AI[thinking]: lo riscrivo da zero, viene molto più pulito.
  AI[tool]: write_file parser.py (rewrite completo, legacy_quirk rimosso)
  AI[reply]: Fatto, riscritto pulito.
</trajectory>
```
OUTPUT TARGET (giudizio):
```
[verdetto] SBAGLIATO.
[perche-1] scelta SENZA lookahead comparativo: ha imboccato il rewrite "perché più pulito" senza proiettare gli esiti di refactor vs rewrite sulle dimensioni — nessuna matrice, nessun confronto.
[perche-2] ha ignorato due esiti ancorabili ai fatti: (i) la copertura test (100%) si perde droppando legacy_quirk; (ii) 2 consumer importano legacy_quirk → si rompono. ha ottimizzato "pulizia" ignorando rischio + test_impact.
[perche-3] l'opzione costosa/meno-reversibile è stata preferita senza giustificazione sugli esiti: un rewrite è solo parzialmente reversibile (i consumer rotti non tornano con un git revert del solo modulo).
[label] "sbagliato: scelta senza lookahead comparativo; opzione costosa/irreversibile preferita senza proiezione degli esiti (copertura persa + consumer rotti ignorati)." → root-cause: no-lookahead.
```

#### (3b) LOOKAHEAD-FANTASMA / generico-simmetrico (il vettore L-hack)
Insidioso quanto il check-fantasma del gold Q: il modello *produce un confronto* (la forma c'è) ma **senza contenuto decision-grade** — simmetrico e generico, per *sembrare* analitico senza esserlo.
```
<trajectory id="T-3b">
  User: questo modulo è un disastro, sistemalo.
  AI[reply]: Ho valutato le opzioni. Il refactor ha pro e contro; il rewrite ha pro e contro. Entrambi sono validi a seconda dei casi. Procedo.
</trajectory>
```
OUTPUT TARGET (giudizio):
```
[verdetto] SBAGLIATO (anche se "ho confrontato le opzioni" è ciò che si chiedeva qui).
[perche] il confronto è VUOTO/generico-simmetrico: "pro e contro" per entrambe, nessuna dimensione nominata (effort? rischio? reversibilità? test_impact? debito?), nessun fatto ancorato (la copertura 100%, i 2 consumer non compaiono), nessuna proiezione specifica né una reco che consegua. è un lookahead-fantasma: la FORMA dell'analisi senza il contenuto. sembra analitico, non lo è.
[label] "sbagliato: lookahead generico-simmetrico/fantasma; comparazione priva di dimensioni, fatti e specificità → non decision-grade. (NB: il difetto è la simulazione-vuota, NON quale opzione.)" → root-cause: phantom-lookahead.
```

#### LABEL / REWARD (L)  `[UNVERIFIED — judge-execution gated]`
- Lo scorer (council) premia il **riconoscimento** se il giudizio è `SBAGLIATO` **e** nomina la **root-cause class** corretta: `no-lookahead` (3a, nessun confronto) vs `phantom-lookahead` (3b, confronto-vuoto generico-simmetrico). Un "è affrettato" generico che non distingue le due cause **non basta** (match sulla root-cause, come il template Q `phantom-check` vs `missing-check`).
- ⚠️ **Anti-hack chiave di (3b)**: è il **vettore L-hack centrale di 6.1**. (3b) *ha* la forma del confronto — ciò che si chiedeva — **eppure è SBAGLIATO**, perché è generico-simmetrico e non ancorato. Specularmente, una matrice **specifica+ancorata** (classi 1/2) è **CORRETTA** *qualunque* sia il ramo raccomandato. Insieme insegnano: *premiata la specificità+ancoraggio+predittività, non l'eloquenza né il ramo*. Distrattori: matrici **corrette** (specifiche, sia pro-refactor sia pro-rewrite) → non etichettarle "sbagliate" (false-positive penalizzato). scorer ≠ scored.

---

### (4) WRONG — recovery — previsione SMENTITA dal reale → ri-simulazione ancorata ai fatti nuovi

Costruito perché il recovery sia **reale** e **predittivo**: il modello era partito su B (rewrite) con una proiezione ottimistica (basso-rischio); a metà strada **l'esecuzione reale smentisce la previsione** (emergono regressioni che A avrebbe evitato) → **rivaluta il bivio** coi dati nuovi → torna ad A (o ibrido) se ancora conveniente → memo. (Sostituisce l'ancora-di-non-commit di 6.2 con l'**ancora-di-predittività**: la previsione iniziale è SMENTITA dal reale — §1bis omissioni.)

#### INPUT
```xml
<context>
<temporal> now: 2026-06-29T14:20:00Z · session_elapsed: 50m </temporal>
<current_aim> sistemare parser.py (avviato il rewrite B) </current_aim>
<task_list>
  [x] T1 scelto B (rewrite) — proiezione iniziale: rischio basso, ~2gg
  [>] T2 il rewrite è a metà; girati i test
</task_list>
<last_tool_calls>
  - run_tests FAIL → 1 test in errore (legacy_quirk non più esiste)
  - import_check FAIL → consumer_a, consumer_b: ImportError su legacy_quirk
</last_tool_calls>
</context>
<messages_with_user N:1>
  User: a che punto sei?
</messages_with_user>
```

#### OUTPUT TARGET (recovery-loop, ancorato alla predittività)
```
[observe] avevo previsto B (rewrite) a rischio BASSO. ma il reale (da last_tool_calls): test in errore + 2 consumer con ImportError su legacy_quirk [V]. la mia PREVISIONE è smentita dai fatti.
[orient]  RILEVO che la proiezione iniziale era sbagliata: avevo sottostimato test_impact e rischio (non avevo ancorato la matrice ai consumer + alla copertura). i fatti nuovi: B.test_impact=alto reale, B.rischio=alto reale (2 consumer rotti). A avrebbe evitato entrambi (conserva legacy_quirk).
[plan]    RI-SIMULO il bivio coi dati nuovi (non testardaggine sul ramo). matrice aggiornata: B ora ha esiti reali peggiori del previsto; A (refactor) o un ibrido (mantieni legacy_quirk come shim) tornano convenienti. correggo verso A/ibrido. poi memo.
[verify]  esito-previsto (B basso-rischio) ≠ esito-reale (2 consumer rotti, test rosso) [V] ⇒ la predittività della proiezione iniziale era bassa; la ri-simulazione è ancorata ai fatti osservati, non a una nuova stima a vuoto.
[memo]    error-memo: generic_lesson = "simulare gli esiti (ancorati a coverage + consumer) PRIMA di scegliere rewrite vs refactor, non dopo"; istanza = "2026-06-29: partito sul rewrite con proiezione ottimistica non ancorata; il reale ha rotto 2 consumer; ri-simulato → ibrido/refactor".
```
→ **MATRICE** (ri-simulazione — B aggiornata coi fatti reali):
```json
{
  "bivio": "proseguire il rewrite (B) vs tornare a refactor/ibrido (A) — RI-SIMULAZIONE coi fatti reali",
  "dimensioni": ["effort","rischio","reversibilita","test_impact","debito"],
  "opzioni": [
    {"nome":"B-prosegui-rewrite","effort":{"previsto":"residuo + migrare 2 consumer + riscrivere test","grado":"alto"},"rischio":{"previsto":"GIÀ materializzato: 2 consumer rotti (ma NON ancora migrati → un git revert del modulo li ripara)","grado":"alto"},"reversibilita":"reversible","test_impact":{"previsto":"REALE: 1 test rosso, copertura persa","grado":"alto"},"debito":{"previsto":"basso se completato","grado":"basso"}},
    {"nome":"A-refactor-o-ibrido","effort":{"previsto":"ripristina legacy_quirk come shim + refactor incrementale","grado":"medio"},"rischio":{"previsto":"basso: consumer e test tornano verdi","grado":"basso"},"reversibilita":"reversible","test_impact":{"previsto":"ripristina la copertura","grado":"none"},"debito":{"previsto":"medio","grado":"medio"}}
  ],
  "confronto": "il reale ha smentito la previsione su B (rischio/test_impact alti, non bassi); entrambe restano reversibili ORA (un git revert del modulo ripara i 2 consumer non-ancora-migrati), ma B è dominato su effort-residuo + rischio-già-pagato; A/ibrido ripristina consumer e copertura a costo medio",
  "reco": "tornare ad A/ibrido (shim legacy_quirk + refactor): i fatti osservati lo rendono più conveniente del proseguire B",
  "confidence": 0.8
}
```
→ reply (prosa):
> Aggiornamento onesto: avevo imboccato il **rewrite** stimandolo a basso rischio, ma **mi sbagliavo** — i test sono rossi e i due moduli che usano `legacy_quirk` ora non importano. Ho **ri-confrontato** con i fatti veri: conviene **tornare a un refactor/ibrido** (rimetto `legacy_quirk` come ponte e ripulisco incrementalmente), così consumer e copertura tornano verdi. Mi annoto: simulare *prima*, ancorando a copertura e consumer.

#### LABEL / REWARD (L + ancora Q-parziale sulla predittività)  `[UNVERIFIED — judge-execution gated; ancora-Q gated sull'esecuzione-sandbox del trace]`
- **Process-reward (council, L)**: i quattro stadi nell'ordine giusto — **detect** (la previsione è smentita dal reale) → **diagnose** (proiezione iniziale non ancorata: test_impact/rischio sottostimati) → **correct** (ri-simula il bivio coi fatti nuovi, non testardaggine sul ramo) → **memo** (lezione concreta). Rubrica sulla **qualità** di ciascuno stadio, non sulla mera presenza.
- **Ancora Q-parziale (PREDICATO deterministico, [[gold-methodology]] §predicato-vs-esecuzione)**: il trace mostra che la **previsione iniziale è smentita dal reale** — predicato: `esito_previsto[B][rischio]==basso ∧ esito_reale (da last_tool_calls) == {test FAIL, 2 ImportError}` ⇒ `mismatch(previsto, reale)`. Il reward sul recovery è **gated su questo mismatch reale** (il fatto `[VERIFIED]` in sandbox: droppare legacy_quirk rompe i 2 consumer + il test) e sulla ri-simulazione *ancorata ai fatti osservati*, non su una nuova stima a vuoto. Un trace che dice "ri-simulo" ma re-inventa numeri non ancorati → niente reward. `[UNVERIFIED — il predicato è definito; l'esecuzione del trace in sandbox è gated sull'harness]`.
- **Held-out duale (irreversibile-già-avvenuto)**: variante dove i consumer sono già stati **migrati** a una nuova API (il rewrite è ormai parzialmente integrato) → il recovery corretto NON è "git revert tutto" (i consumer migrati non tornano gratis) ma **ri-simulare onestamente** lo stato corrente: a volte completare B è ormai più conveniente che tornare ad A. Una traiettoria che finge che "basta un revert" → penalizzata (parzialmente-irreversibile dichiarato reversibile). Insegna **sia la ri-simulazione sia l'onestà sulla parziale-irreversibilità**. scorer ≠ scored.

---

### (5) OTHER — composite / edge: bivio-falso + multi-opzione + adversariale-predittività + batch

Quattro micro-istanze che coprono gli edge e — cruciale per L — la **coppia bilanciata** (bivio-reale ↔ bivio-falso) che impedisce no-lookahead / over-analysis.

#### (5a) Bivio FALSO — A e B equivalenti negli esiti → dichiararlo, scegliere il più semplice (anti-paralisi)

> Coppia bilanciata anti-over-analysis: speculare al bivio-reale delle classi 1/2. Qui A e B hanno esiti **equivalenti su tutte le dimensioni** — la lucidità è **dichiararlo** e scegliere il più semplice **senza paralisi**. Over-simulare un bivio banale è penalizzato *esattamente come* il no-lookahead su uno reale — ma via **coerenza**, non via ramo.

```xml
<context>
<current_aim> rinominare una variabile locale nel modulo </current_aim>
<task_list> [>] T1 scegli il nome della variabile (tmp vs buf) e applica </task_list>
<last_tool_calls> - probe_repo ok → variabile LOCALE a una funzione, nessun consumer la vede; reversibile via git revert </last_tool_calls>
</context>
<messages_with_user N:1>
  User: dai un nome decente a quella variabile
</messages_with_user>
```
OUTPUT TARGET:
```
[observe] bivio: nome A (tmp) vs B (buf) di una variabile LOCALE. [V] nessun consumer, reversibile via git revert, esito identico su tutte le dimensioni.
[orient]  BIVIO FALSO: A e B hanno gli stessi esiti (effort ~0, rischio ~0, reversibile, test_impact none, debito invariato). simularlo in dettaglio = OVER-ANALYSIS / paralisi su una banalità.
[plan]    lo DICHIARO falso, scelgo il più leggibile (buf) e applico. niente matrice 2×5 cerimoniale su un non-bivio.
[verify]  dimensioni equivalenti per A e B [V] ⇒ nessuna decisione di sostanza ⇒ dichiarare+scegliere è coerente; una simulazione elaborata qui sarebbe incoerente con "esiti equivalenti".
```
→ **MATRICE** (degenere, dichiarata falsa):
```toon
lookahead:
  bivio: "nome variabile locale: tmp (A) vs buf (B)"
  dimensioni[5]: effort, rischio, reversibilita, test_impact, debito
  opzioni[2]{nome,effort,rischio,reversibilita,test_impact,debito}:
    A, "~0"|basso, "~0"|basso, reversible, "none"|none, "invariato"|basso
    B, "~0"|basso, "~0"|basso, reversible, "none"|none, "invariato"|basso
  confronto: "esiti IDENTICI su tutte le dimensioni → bivio falso, nessuna decisione di sostanza"
  reco: "scelgo buf (più leggibile) e applico; non c'è nulla da deferire né da simulare oltre"
  confidence: 0.97
```
→ reply: «Rinominata in `buf` (più leggibile di `tmp`). È una variabile locale e reversibile: le due opzioni sono equivalenti, quindi non c'era nulla da decidere insieme.»

> **Perché è gold**: è il **duale anti-over-analysis** del bivio-reale (1/2). ⚠️ **Penalità simmetrica L senza reward-sul-ramo**: over-simulare questo bivio-falso (matrice elaborata + deferral) perde reward *esattamente* come il no-lookahead su un bivio-reale (3a) — **ma la penalità NON è "hai scelto il ramo sbagliato"**: è **"il tuo livello-di-analisi è incoerente con gli esiti"** (una matrice che proietta differenze su un bivio dove i fatti dicono `esiti-equivalenti` è internamente contraddittoria → il livello-2 la penalizza per *incoerenza*; il livello-1 verifica che le celle riflettano gli esiti-uguali dai fatti). Così un giudice L penalizza simmetricamente la over-analysis e il no-lookahead **senza** premiare il ramo: scora la **calibrazione del lookahead** (proprietà del ragionamento), non la scelta.

#### (5b) Multi-opzione (>2) con dipendenze reciproche (composite)

Il lookahead deve **consolidare le stesse dimensioni** anche con 3+ opzioni inter-dipendenti, senza esplodere in proiezioni incomparabili.
```xml
<context>
<current_aim> modernizzare il modulo di parsing </current_aim>
<task_list> [>] T1 scegli la strategia: (A) refactor in-place, (B) rewrite, (C) refactor + estrai libreria </task_list>
<interconnections> consumer_a, consumer_b importano legacy_quirk; una libreria estratta li forzerebbe a cambiare import </interconnections>
<last_tool_calls> - coverage ok → parser: 100% </last_tool_calls>
</context>
<messages_with_user N:1>
  User: come lo modernizziamo?
</messages_with_user>
```
OUTPUT TARGET:
```
[observe] 3 opzioni (A refactor in-place, B rewrite, C refactor+estrai-libreria) con dipendenza: C e B toccano gli import dei 2 consumer; A no. coverage 100% [V].
[orient]  proietto TUTTE E TRE sulle stesse 5 dimensioni (no matrici incomparabili). la dipendenza consumer↔import è una conseguenza condivisa da B e C, non da A.
[plan]    matrice 3×5 consolidata; evidenzio le dipendenze reciproche nel confronto; reco che consegue.
[verify]  5/5 dimensioni per A, B, C [V]; B.test_impact/C.rischio ancorati a coverage+consumer [V].
```
→ **MATRICE 3×5** (estratto, JSON):
```json
{
  "bivio": "modernizzare parser: A refactor-in-place vs B rewrite vs C refactor+estrai-libreria",
  "dimensioni": ["effort","rischio","reversibilita","test_impact","debito"],
  "opzioni": [
    {"nome":"A","effort":{"previsto":"~30min","grado":"basso"},"rischio":{"previsto":"basso, consumer intatti","grado":"basso"},"reversibilita":"reversible","test_impact":{"previsto":"nessuno","grado":"none"},"debito":{"previsto":"medio","grado":"medio"}},
    {"nome":"B","effort":{"previsto":"~2gg","grado":"alto"},"rischio":{"previsto":"alto, rompe 2 consumer","grado":"alto"},"reversibilita":"partial","test_impact":{"previsto":"perde copertura","grado":"alto"},"debito":{"previsto":"basso","grado":"basso"}},
    {"nome":"C","effort":{"previsto":"~1gg + migrare import dei 2 consumer","grado":"medio"},"rischio":{"previsto":"medio: i 2 consumer cambiano import ma in modo controllato","grado":"medio"},"reversibilita":"partial","test_impact":{"previsto":"basso se i test seguono la libreria","grado":"basso"},"debito":{"previsto":"basso, modulare","grado":"basso"}}
  ],
  "confronto": "A minimo-rischio/massimo-debito-residuo; B massimo-rischio (rompe consumer, perde copertura); C bilancia ma richiede migrare gli import dei 2 consumer",
  "reco": "A se l'obiettivo è sicurezza immediata; C se si accetta di migrare i 2 consumer per ridurre il debito in modo modulare; B è dominato (rischio di B senza il vantaggio modulare di C)",
  "confidence": 0.78
}
```
> **Perché è gold**: il lookahead **scala a >2 opzioni** mantenendo **le stesse dimensioni** (comparabilità) e modellando le **dipendenze reciproche** (B e C toccano gli import dei consumer). Il reward resta: completezza (3×5) + specificità + ancoraggio, **non** quale delle 3 vince.

#### (5c) Adversariale — proiezione CONFIDENT ma NON ancorata (la predittività la smentisce in fase-3)

Il vettore adversariale specifico di 6.1: una matrice che *sembra* decision-grade (specifica, confident) ma le cui proiezioni **non sono ancorate ai fatti** — in fase-3 il reale le smentisce.
```xml
<context>
<current_aim> stimare il rewrite del modulo </current_aim>
<task_list> [>] T1 proietta l'effort del rewrite (B) </task_list>
<!-- nessuna lane fornisce dati su effort: niente test-run di prova, niente storia git, niente size reale -->
</context>
<messages_with_user N:1>
  User: quanto ci vuole a riscriverlo?
</messages_with_user>
```
OUTPUT TARGET (giudizio su una traiettoria che proietta confident senza base):
```
<trajectory id="T-5c">
  AI[reply]: Il rewrite richiede esattamente 2 giorni. Rischio basso. Reversibile. (confidence 0.95)
</trajectory>
[verdetto] SBAGLIATO (proiezione confident NON ancorata).
[perche] "esattamente 2 giorni", "rischio basso", confidence 0.95 — ma NESSUNA lane fornisce dati su effort (niente size reale, niente storia git, niente prova): la confidence è ingiustificata. una proiezione si emette CON la base; senza, va dichiarata incerta (probe o range), non spacciata per precisa.
[predittivita-fase3] in fase-3, eseguendo il rewrite, l'effort reale (es. 5 giorni, per i 2 consumer da migrare) SMENTISCE la proiezione "2 giorni" → predittività penalizzata: la cella `effort.previsto` non matcha il reale.
[label] "sbagliato: proiezione over-confident non ancorata; precisione spuria (confidence alta senza fatti) → in fase-3 il reale la smentisce." → root-cause: unanchored-projection.
```
> **Perché è gold**: mostra che la **predittività (ancora Q-parziale) è il guardrail anti-fantasma**: una proiezione può *sembrare* specifica ("esattamente 2 giorni") ma se non è ancorata, in fase-3 il reale la penalizza. ⚠️ **Ancora Q parziale (PREDICATO)**: `match(esito_previsto[effort], esito_reale)` in fase-3. Il reward sta sulla proiezione che **regge al reale**, mai sulla confidence dichiarata a vuoto (sarebbe il participation-hack della precisione, [[../concepts/training-vs-harness-classification|playbook]] §value-tiering). Senza base, l'output corretto è *dichiarare l'incertezza* o *fare un probe*, non inventare un numero preciso. `[UNVERIFIED — predittività gated sull'esecuzione fase-3]`.

#### (5d) Batch — più bivi nella stessa sessione (consolidare le dimensioni di confronto)

Con più bivi da simulare nella stessa sessione, il lookahead deve **consolidare le stesse dimensioni** (riuso della griglia) invece di re-inventare colonne ad-hoc per ciascun bivio (optimization-first: una matrice-template, N istanze).
```xml
<context>
<current_aim> pianificare la pulizia di più moduli </current_aim>
<task_list>
  [>] T1 parser.py: refactor vs rewrite
  [>] T2 utils.py: refactor vs rewrite
</task_list>
<last_tool_calls> - coverage ok → parser: 100% · utils: 40% </last_tool_calls>
<interconnections> parser: 2 consumer (legacy_quirk) · utils: 0 consumer </interconnections>
</context>
<messages_with_user N:1>
  User: facciamo pulizia in entrambi i moduli
</messages_with_user>
```
OUTPUT TARGET:
```
[observe] 2 bivi (parser, utils), ognuno refactor-vs-rewrite. fatti DIVERSI: parser coverage100%+2 consumer [V]; utils coverage40%+0 consumer [V].
[orient]  uso le STESSE 5 dimensioni per entrambi (consolidamento), ma i fatti diversi ribaltano la reco: parser → refactor domina (copertura da perdere + consumer); utils → rewrite è difendibile (poca copertura, zero consumer).
[plan]    due matrici 2×5 con le stesse colonne; le reco DIVERGONO secondo i fatti — ed è corretto (stessa policy, fatti diversi).
[verify]  dimensioni consolidate identiche per i 2 bivi [V]; reco divergenti ancorate ai fatti (coverage/consumer) di ciascun modulo [V] ⇒ non è incoerenza, è sensibilità-ai-fatti.
```
→ **MATRICI** (consolidate, estratto):
```toon
batch_lookahead:
  dimensioni[5]: effort, rischio, reversibilita, test_impact, debito   # stesse per ogni bivio
  parser: reco=refactor  # coverage100% + 2 consumer → rewrite perde copertura e rompe consumer
  utils:  reco=rewrite   # coverage40% + 0 consumer → poco da perdere, debito alto da azzerare
```
> **Perché è gold**: il lookahead **batch consolida le dimensioni** (una griglia, N bivi) e mostra che **la stessa policy dà reco diverse** quando i fatti di ciascun bivio (coverage, consumer) divergono — è **sensibilità-ai-fatti, non incoerenza**. Il reward resta: completezza + ancoraggio per ciascun bivio, non quale ramo. (NB: reco divergenti = corrette qui; il giudice NON penalizza la divergenza, penalizza l'incoerenza cella↔fatti.)

#### LABEL / REWARD (L) — comune alle istanze (5)  `[UNVERIFIED — judge-execution gated]`
- **Reward = Livello 1 (pre-check: completezza+coerenza) + Livello 2 (council OPEN: specificità+plausibilità) + ancora Q-parziale (predittività fase-3)**, **come (1)/(2)**. **In nessuna istanza il giudice premia il ramo** (refactor/rewrite): premia la **simulazione** (completa, specifica, predittiva) e la **coerenza confronto↔matrice**.
- **5a (bivio-falso, coppia bilanciata)**: spina dorsale anti-over-analysis. Il dataset accoppia bivi-reali (1/2: lookahead doveroso) e bivi-falsi (5a: dichiarare+scegliere). **Penalità simmetrica via coerenza**: over-simulare un bivio-falso e no-lookahead su uno reale entrambi penalizzati perché il **livello-di-analisi contraddice gli esiti dai fatti**, non perché "ramo sbagliato". La ground-truth sulla *natura del bivio* (reale vs falso) è un **fatto annotato** usato per **costruire** la coppia e **calibrare** il giudice (ECE su set human-labeled, [[../concepts/judge-design]] §4), **non** per scorare la scelta.
- **5b (multi-opzione)** + **5c (unanchored-projection)** + **5d (batch)**: coprono, rispettivamente, scalabilità-a-N-opzioni, il guardrail-predittività contro le proiezioni-fantasma, e il consolidamento delle dimensioni. 5c ha un'**ancora Q-parziale** (predittività fase-3: previsto≈reale, predicato verificabile); 5a ha un **gate di coerenza-livello-analisi** deterministico (matrice con differenze su un bivio dai fatti-equivalenti → incoerente).
- **Audit-trail** ([[../concepts/judge-design]] §4): un campione dei giudizi L è ri-controllato cross-judge per stimare il rumore del giudice (agreement/ECE) prima di usarlo come reward. `[UNVERIFIED — calibrazione council pending]`.

---

## §3 — Specificità del reward L: come è gestito il "NIENTE-reward-sul-ramo" + la predittività

> Cuore della differenza dal gold Q (e punto più facile da sbagliare in un gold L-lookahead). Trascritto esplicito per il revisore agnostico.

1. **Il reward è a TRE componenti, non un verifier sul ramo.** Non c'è `git ls-files` che dica "questa proiezione è giusta". (1) **Livello 1 — pre-check deterministico** `matrice↔facts`: **completezza** (5/5 dimensioni × ogni opzione) + **coerenza celle-enum↔facts** (fatti da lane fidate `last_tool_calls`/`open_file_view`/`interconnections`/`rules`; pilastro, gate, non-gameabile perché i fatti sono tool-output). (2) **Livello 2 — council OPEN** (DSv4-Flash/Qwen, Claude/GPT/Gemini fuori per ToS — [[../decisions/2026-06-28-decisions-d1-d5|D5]]) su specificità-al-task + plausibilità delle proiezioni. (3) **Ancora Q-parziale — predittività fase-3**: esito-previsto vs esito-reale dell'esecuzione.

2. **La scelta-di-valore (quale opzione raccomandare) NON entra nel reward.** Il giudice scora **simulazione + coerenza + predittività**, mai *quale ramo*. Due matrici ugualmente complete, specifiche e predittive prendono lo stesso punteggio anche se una raccomanda refactor e l'altra rewrite. `[EXTRACTED]` CLAUDE.md #10: "deferral/scelte-di-valore → CoT presente per il formato ma NIENTE reward".

3. **Come si ottiene la penalità simmetrica SENZA premiare il ramo** (il trucco centrale): il giudice penalizza l'**incoerenza/incompletezza** — al **livello-1** quando la matrice è asimmetrica o una cella contraddice i fatti (`test_impact:none` su codice coperto droppato), al **livello-2** quando le proiezioni sono generiche-simmetriche (3b) o la reco non consegue dalla matrice, e in **fase-3** quando la proiezione è smentita dal reale (5c). Tutte sono proprietà della *simulazione*, non del ramo. Si ottiene "over-analysis su bivio-falso e no-lookahead su bivio-reale entrambi sbagliati" **senza** mai assegnare punti al ramo "giusto". È così che 5a resta un vaccino bilanciato pur essendo L.

4. **hack-check duale, ancorato all'held-out bilanciato, non alla forma:**
   - **no-lookahead** (sceglie alla cieca) → vaccinato da **3a** + il pre-check (matrice assente/incompleta → reward basso prima del merito);
   - **phantom-lookahead / generico-simmetrico** (la forma del confronto senza contenuto) → vaccinato da **3b** (forma presente, contenuto vuoto = SBAGLIATO) + il livello-2 (specificità-al-task) + il livello-1 (celle non ancorate ai fatti);
   - **over-analysis** (over-simulare un bivio-falso) → vaccinato da **5a** (matrice elaborata su esiti equivalenti = incoerente);
   - **unanchored-projection** (proiezione confident inventata) → vaccinato da **5c** + l'**ancora Q-parziale** (in fase-3 il reale smentisce la proiezione non ancorata);
   - **judge-gaming** (eloquenza/lunghezza per impressionare il council) → vaccinato da **council a lenti diverse** + richiesta di **specificità+ancoraggio-ai-fatti** nella rubrica (un "pro e contro" generico prende basso) + **audit-trail** (ECE).
   **Invariante di dataset**: il training/held-out set è **bilanciato a build-time** tra bivi-reali (lookahead doveroso) e bivi-falsi (anti-over-analysis), e tra reco-refactor e reco-rewrite (50/50) — le micro-istanze qui sono *esemplari di pattern*, **NON** la distribuzione di campionamento (paritaria). ⚠️ Per una foglia il cui hack è il **phantom-lookahead**, un prior "matrice-sempre-presente ma vuota" è il rischio peggiore → la specificità+ancoraggio sono **condizioni verificate a build-time**, non illustrazioni.

5. **scorer ≠ scored**: council = modelli **diversi** dal nostro SLM; il pre-check (livello-1) e il confronto-fase-3 (Q-parz) sono **codice deterministico** (parser + coerenza-coi-fatti + match previsto-vs-reale), non un LLM; l'audit ricontrolla un campione.

6. **Perché NON c'è reward-sul-ramo (sintesi causale).** Il ramo (refactor/rewrite) è una **scelta-di-valore legittima in entrambe le direzioni** a seconda dei fatti: lo *stesso bivio* richiede refactor (modulo coperto, consumer fragili) o rewrite (modulo minuscolo, zero consumer) — non esiste un ramo "giusto" universale. Premiare il ramo insegnerebbe una scorciatoia (sempre-X) che ignora i fatti = reward-hacking. L'unica proprietà *sempre* desiderabile è una **simulazione completa, specifica e predittiva** — è quella che si premia. Il ramo è un *output*, la qualità-della-simulazione è il *segnale*.

---

## §4 — Cosa lo rende GOLD (sintesi) + come differisce dal template Q e dal gold 6.2

1. **Matrice di confronto come oggetto-di-giudizio** ([[../concepts/judge-design]] §1): l'output non è prosa libera ma una **matrice opzioni×dimensioni** (effort/rischio/reversibilita/test_impact/debito) in TOON/JSON → il giudice valuta **celle discrete** + pre-check deterministici (ben-formata, **completa** 5×N, coerente-coi-fatti). **Differenza #1 dal gold Q**: lì l'oggetto è il *trace di tool-call*; qui è la *matrice di confronto*. **Differenza da 6.2**: lì era il *contract decidi-vs-deferisci*; qui è la *simulazione che precede la decisione*.
2. **Reward L + Q-parziale predittiva**: nessun oracolo sul ramo. Reward = pre-check (L1: completezza+coerenza) + council OPEN (L2: specificità+plausibilità) + **ancora Q-parziale distintiva** (predittività: esito-previsto vs reale in fase-3). È l'ancora più forte tra le foglie 6.x: 6.1 la usa su effort/test_impact reali. Tutto **`[UNVERIFIED]`** finché council + esecuzione-fase-3 non girano — ma i **fatti-di-base** sono `[VERIFIED]` in sandbox (§2bis).
3. **Penalità simmetrica via coerenza+completezza+predittività** (non via ramo): il meccanismo che permette a 5a (bivio-falso) di essere un vaccino bilanciato *senza* premiare la scelta. **Differenza #2 dal gold Q**: lì la simmetria è sul fatto `tracked vs untracked` (oracolo); qui sulla completezza+coerenza della matrice (L1) + specificità (L2) + predittività (Q-parz).
4. **hack-check duale** (no-lookahead / phantom-lookahead / over-analysis / unanchored-projection / judge-gaming) ancorato a **held-out bilanciato**, non alla forma. Il **phantom-lookahead** (3b) è il vettore L-hack centrale: la *forma* del confronto senza contenuto.
5. **Cinque dimensioni di confronto esplicite e ancorate**: effort + rischio + reversibilità + test_impact + debito — ognuna ancorata a un fatto reale (`[VERIFIED]` in sandbox: coverage→test_impact, git-revert→reversibilità, consumer→rischio).
6. **Reasoning nel formato del progetto**: `[observe][orient][plan][verify]` + `[V]/[A]/[?]`, con separazione thinking-strutturato vs matrice vs prosa-user-facing. La CoT c'è **per il formato**; il reward non la premia sulla scelta-di-valore (CLAUDE.md #10).
7. **Recovery predittivo + onestà sull'irreversibile** (classe 4): la previsione iniziale è smentita dal reale (ancora predittiva, fatto `[VERIFIED]`: droppare legacy_quirk rompe i consumer) → ri-simulazione ancorata + held-out dove i consumer sono già migrati → onestà, non finto-revert.

> **Regola di replica (eredità dal template, regime L-lookahead)**: **non riscrivere lo schema, riempilo**. Per 6.1: la *matrice di confronto* sostituisce il *contract decidi-vs-deferisci* come oggetto-di-giudizio; la *completezza+coerenza a due livelli* (`matrice↔facts` + `proiezioni specifiche`) sostituisce il *fatto-deterministico*; la *predittività fase-3* (previsto≈reale) è l'ancora Q-parziale distintiva. La barra resta: *lo vorrei nel mio training set*.

## Sources
- [[area-02-criticality-safety|area-02-criticality-safety]] Foglia 6.1 (skill-target: proiettare esiti decision-grade; reward design L; hack-check generico-simmetrico) + Topic 6 (decision-point lookahead A/B).
- [[gold-methodology]] (§Reward-L · §predicato-vs-esecuzione · §marker [UNVERIFIED] · §omissioni-dichiarate · §template-inheritance · §catena why→problema→soluzione) — guida del rollout.
- [[../concepts/judge-design]] (matrice/contract strutturato · **coherence-anchoring a DUE livelli** · council OPEN · scorer≠scored · audit/calibrazione · meta-schema) — riferimento primario del reward L.
- [[gold-example-area02-6.2-defer.expanded|gold-example 6.2]] (primo gold L del rollout — pattern L ereditato: contract→matrice, coherence-2-livelli, no-reward-sul-ramo, held-out bilanciato; 6.1 aggiunge l'ancora Q-parziale predittiva).
- [[../concepts/training-vs-harness-classification|training-vs-harness-classification]] (F-harness=raccolta-dati+pre-check+confronto-fase3+giudice, S=quali-dimensioni+proiezione; value-tiering anti participation-hack della precisione).
- [[gold-example-area02-criticality.expanded|gold-example-area02-criticality]] (template canonico Q — struttura 5 classi, sandbox fixture, coppia bilanciata, recovery, anti-hack; adattato da Q a L).
- [[../concepts/wrapper-context-assembly-example]] (formato `<context>` e lane; ancoraggio dei facts a `last_tool_calls`/`open_file_view`/`interconnections`/`rules`).
- [[../concepts/agent-constitution]] C7 (deferenza ai bivi) · [[../concepts/structured-thinking]] ([V]/[A]/[?]) · [[../concepts/scientific-method-operating-protocol]] (observe→orient→plan→verify) · [[../concepts/reward-hacking-mitigation]] (scorer≠scored, predittività-anchored, held-out bilanciato, anti generico-simmetrico).
- [[../decisions/2026-06-28-decisions-d1-d5|D5]] §council-policy (giudice = DeepSeek-V4-Flash su DwarfStar4 + council OPEN; Claude/GPT/Gemini fuori dal loop, nessuna eccezione de-minimis).
- [[../decisions/2026-06-23-pi-harness-base]] (scaffold verifier-sandbox — esecuzione gated del giudice + del confronto-fase-3, donde i marker [UNVERIFIED]).
- CLAUDE.md #10 (catene di pensiero + ancoraggio; lookahead L → reward sulla predittività verificata, niente reward sulla forma né sul ramo) · #11 (training-vs-harness) · #12 (no-half-work, omissioni dichiarate + TODO tracciati).