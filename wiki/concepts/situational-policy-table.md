---
name: situational-policy-table
description: Tabella-router "SE situazione X → leggi/applica regola-azione Y (obbligo) PRIMA di procedere". FEATURE = lane lookup O(1) (drift-impossibile, scalabile, auto-enforced) + SKILL = riconoscere la situazione → emettere l'azione corretta, addestrata nei pesi (si addestra il COMPORTAMENTO, non il file-path). Training goldmine. Parte di una governance della conoscenza a 4 tier. Idea utente msg 200-202 (pattern generico estratto PII-free da repo privato).
type: concept
tags: [concept, situational-awareness, policy-table, governance, training-goldmine, skill-vs-feature, reward-hacking, organization-first]
sources: [user notes 2026-06-27 msg 200-202, wiki/concepts/training-vs-harness-classification, structured-context-sections]
last_updated: 2026-06-29
status: finalized v1.1 — training-spec completa (held-out discrimina-situazione + governance 4-tier) + architettura scalabile a indice gerarchico (Q8 2026-06-29, review-loop verticale+agnostico applicato: regola taglio index-vs-inline + precedenza floor/override + multi-match + reward-gate + held-out stratificato + sync drift-free) + ref-eval risolto e VERIFICATO (Q9 2026-06-29)
confidence: provisional
---

# Situational Policy Table (router situazione → azione)

> **Stato**: finalized v1. Idea utente 2026-06-27 (msg 200-202), pattern **generico** estratto da un sistema di disciplina prompt-engineered di repo privati (estratti solo i pattern, **nessun nome/PII**); training-spec completata 2026-06-29. Doppio valore: meccanismo wrapper **e** materiale di training.

## Catena di pensiero (why → problema → soluzione)

- **Why** `[EXTRACTED]` — un agente con decine di regole non può tenerle tutte sempre in contesto né ricordarle a memoria a ogni passo: la conoscenza "passiva" (read→forget) **si perde**, e le decisioni driftano.
- **Problema** `[EXTRACTED]` — serve un modo per cui, data una **situazione** (sto per cancellare un file / sto per scrivere un secret / sto iniziando un task), l'azione/regola corretta sia **richiamata e applicata obbligatoriamente** prima di procedere, senza dipendere dalla memoria del modello.
- **Soluzione** `[EXTRACTED]` — una **tabella-router**: righe "SE stai facendo X → LEGGI/APPLICA la regola Y PRIMA di procedere". Lookup O(1) per pattern → zero decisioni a memoria → **drift impossibile**, scalabile a 100+ regole senza appesantire il context, **auto-enforced** (non applicare la regola citata = violazione rilevabile). Trigger **aggressivo** (meglio un falso-positivo che una violazione mancata).

## FEATURE vs SKILL (la nuance critica) `[EXTRACTED]`

- **FEATURE (wrapper)**: la tabella come **lane** nel context-assembly (Classe A) — lookup deterministico situazione→regola. Project-specific, aggiornabile senza retraining.
- **SKILL (pesi, da addestrare)**: il **riconoscimento** della situazione → emissione dell'azione corretta. ⚠️ **Si addestra il COMPORTAMENTO / il principio** (situazione→azione-corretta), **NON il file-path-lookup** (project-specific, brittle). Il lookup-table è feature; il riconoscimento-addestrato è skill — stesso pattern [[training-vs-harness-classification]] di tutto il resto.

> **Verifica del claim utente "rafforza i pesi quando prende una scelta"**: `[EXTRACTED]` confermato — addestrare su **situazione→azione-corretta** rinforza il decision-making **nei pesi** invece di affidarsi al lookup-prompt ogni volta. Ogni riga = una **famiglia di esempi** verificabili (riconosci il trigger → emetti l'azione corretta).

### Classificazione formale (decision-tree del playbook) `[review-loop]`

Applico il decision-tree di [[training-vs-harness-classification]] (Step-0 scomponi → classifica ogni metà → stato-senza-training).

- **Q0 scomponi**:
  - **{meccanismo}** = la tabella-router come **lane lookup O(1)** nel context-assembly (Classe A) — match-pattern situazione→regola, deterministico.
  - **{decisione}** = il **riconoscimento** della situazione (sto-per-cancellare / sto-per-scrivere-un-secret / sto-iniziando-un-task) → emissione dell'azione corretta.
- **Q1/Q1a → F-harness**: la lane-lookup è infra wrapper-side deterministica. **Stato: PIENA**, e con due proprietà chiave: **O(1)** (scala a 100+ regole senza appesantire il context) e **drift-impossibile** (il lookup non dipende dalla memoria del modello → la regola citata è sempre quella corrente; aggiornabile senza retraining). Auto-enforced: non applicare la regola citata = violazione rilevabile.
- **Q2 → S (recognition)**: riconoscere la situazione → azione corretta. ⚠️ Si addestra il **COMPORTAMENTO/principio** (situazione→azione-corretta), **NON il file-path-lookup** (project-specific, brittle). Il lookup è F; il riconoscimento-addestrato è S.
- **Q3 → F+S**: Q1 ∧ Q2. La metà-S (recognition) ha stato-senza-training **DEGRADATA-MA-UTILE**: con la sola lane-F il sistema funziona (il modello *legge* la regola citata dal lookup), ma il riconoscimento robusto della situazione — incluso quando il trigger è implicito — è **migliore nei pesi**.
- **Q5 stato-senza-training (metà-S): DEGRADATA-MA-UTILE**. La lane-F fornisce un fallback forte (la regola viene comunque iniettata su match), quindi — a differenza di low-confidence-gather — questa F+S **è spedibile in Fase-1 col fallback** (anti over-gating), e la skill di recognition la migliora in Fase-2/3.
- **Q6 fallback deterministico: FORTE**. Il match-pattern della lane È il fallback: su trigger esplicito, la regola viene iniettata indipendentemente dal training. Q6 conferma il deploy del fallback-F in Fase-1.

> **Output**: `{F+S · F=lane-lookup O(1) drift-impossibile (PIENA) · stato-S=DEGRADATA-MA-UTILE · gate=fallback-lane-F1, skill-recognition-F2/3 · spec-S=recognition→azione con held-out per il discriminare}`.

## Governance della conoscenza a 4 tier (il "Playbook") `[EXTRACTED]`

Dove vive una conoscenza, dalla più calda alla più fredda:
1. **`LM.md`-directive** (always-context): la più frequente/cross-cutting/critica (1-riga + link, file piccolo).
2. **Situation-table entry** (router, on-demand): specifica a una situazione/trigger (il grosso, 100+ righe).
3. **wiki/memory/rule** (HARD rule, on-demand): contenuto completo, severity `hard|strong|soft`.
4. **Hook** (auto-enforced): per regole **meccanicamente verificabili** o che l'agente "perde" passivamente. Escalation via violation-ladder.

> **Mapping sul nostro wrapper** `[INFERRED]`: `LM.md`-directive ≈ lane `rules` (always-context); situation-table ≈ **nuova lane router** (questo concept); wiki-rule ≈ on-demand; **hook ≈ la nostra Classe C deterministic guardrails** (pre-flight/secrets-scanner, *scorer≠scored*). Il tier-hook **È** il nostro tier-guardrail-deterministico — stesso concetto.

## Architettura scalabile (categorie → sotto-categorie → foglie)

> **Domanda utente (msg 2026-06-29, Q8)**: ogni categoria/sotto-categoria/foglia ha la **sua** situational-table, OPPURE esiste una **situational-table INDEX** che ne referenzia altre più specifiche? Qual è la strategia che ASSICURA l'esito migliore?

**Risposta = INDICE GERARCHICO con regola-di-taglio esplicita.** Né una tabella gigante piatta (non-manutenibile, costosa in token, generalizza male), né tabelle-foglia isolate e scollegate (drift tra tabelle, nessun invariante condiviso, dispatch ambiguo). La struttura raccomandata è un **indice top-level che instrada verso tabelle progressivamente più specifiche** (area → topic → foglia), con la **stessa logica di fattorizzazione** di [[hierarchical-decomposition]]: l'**invariante condiviso vive in alto**, la **specializzazione vive in basso**.

> ⚠️ **Onestà sul verbo "ASSICURA"** `[review-loop 2026-06-29]`: l'indice gerarchico **non *assicura* in assoluto** l'esito migliore (nessuna struttura lo fa su ogni input). **Domina** le alternative considerate (flat-gigante, foglie-isolate, flat+tag) **sotto queste assunzioni**: branching-factor moderato, **profondità ≤ 3**, e le regole-di-taglio/precedenza/multi-match qui sotto rispettate. Fuori da queste (albero profondo, multi-match irrisolto, reward sul routing) il vantaggio svanisce → le sezioni seguenti chiudono esattamente quelle condizioni. La garanzia è **condizionale e auditabile**, non un assoluto.

### Regola di taglio: INDICE vs INLINE (risposta operativa alla Q8) `[review-loop]`
Il cuore della domanda utente. Un nodo è:
- **INLINE** (righe-azione direttamente nel nodo) se ha **≤ K regole-foglia** (reco **K ≈ 5–7**, la soglia working-set della governance 4-tier) **e** nessun figlio con regole proprie.
- **INDICE** (solo dispatch `→` verso sotto-tabelle, **zero righe-azione proprie** tranne gli invarianti-floor cross-cutting) quando (a) ha **> K** regole sotto di sé, **oppure** (b) ha **≥ 2 figli** che possiedono regole proprie.
- **Invariante**: un nodo è **O indice O tabella-foglia, mai un ibrido a metà** (il nodo-ibrido duplica e crea ambiguità di precedenza). L'indice top-level porta **solo** gli invarianti-floor + i dispatch.

### Regola di PRECEDENZA: chi vince tra livelli `[review-loop]`
Risponde a "una policy di foglia contraddice una di categoria — chi vince?". Ogni regola dichiara un flag `{override-able | floor}`:
- **override-able** (regole additive/di raffinamento) → **most-specific-wins**: la foglia raffina/override il ramo/categoria (semantica eccezioni, come CSS).
- **floor** (invarianti di sicurezza in alto: secrets-defense, read-before-acting, pre-flight distruttivo) → **non-derogabili**: una foglia **non può rilassarli**, può solo **aggiungere** vincoli. Risoluzione = **AND-merge (unione dei vincoli)**.
- **Conflitto floor ↔ foglia** → **vince il floor** + **segnala l'incoerenza** (la foglia è mal-progettata).
- **Lint auditabile** (F-harness): nessuna foglia rilassa un floor del padre → violazione rilevabile staticamente.

### Disambiguazione MULTI-MATCH (una situazione attiva 2+ nodi) `[review-loop]`
Il dispatch **non è mutuamente esclusivo**: "sto cancellando un file *che contiene un secret*" attiva sia `file-ops` sia `secrets`. Default = **union-of-policies, non pick-one**:
- si applicano **TUTTE** le regole dei nodi matchati, risolvendo i conflitti con la regola di precedenza (floor in AND, override-able most-specific-wins);
- due regole **override-able** che collidono allo **stesso livello** di specificità → **escalation a low-confidence → gather/ask** ([[low-confidence-gather-and-reorg]]), **mai** scelta arbitraria;
- il dispatcher emette il **SET** di nodi attivati (auditabile), non un singolo path → niente drop silenzioso di policy.

### Struttura `[INFERRED]`

- **INDICE di situational-table (top-level)**: poche righe ad alta-ricorrenza/cross-cutting + gli invarianti-floor (l'analogo del tier-1 `LM.md`-directive). Riconosciuta la situazione, instrada (`→`) verso la sotto-tabella pertinente. È il dispatcher.
- **Sotto-tabelle per area/topic/foglia**: le righe specifiche. **Derivate dalla tassonomia** (vedi §sincronizzazione), allineate alla gerarchia di [[../training-taxonomy/README]] (16 aree → ~77 topic → ~215 foglie) → un solo albero, niente doppia manutenzione.
- **Invariante in alto / specializzazione in basso**: regole generiche e trasferibili (capture-ideas, verify-before-claim, read-before-acting, no-unverified-numbers, defense-in-depth) in alto; regole prodotto-specifiche (stack/API proprietari) in basso, nelle sotto-tabelle-foglia. Stessa fattorizzazione core-invariante → assi → foglie di [[hierarchical-decomposition]].
- **Budget di profondità ≤ 3** (area→topic→foglia) come **default duro** `[review-loop]`: oltre, l'errore-di-routing *composto* lungo il path supera il guadagno di specificità. Se un'area sembra richiedere > 3 livelli, è segnale che l'invariante non è stato fattorizzato bene (rivedere la decomposizione, non aggiungere profondità).

### Sincronizzazione indice ↔ taxonomy (drift-free by-construction) `[review-loop]`

"Come si tiene allineato l'indice quando si aggiungono foglie?" → l'indice situazionale **non è un file separato**: è **derivato** dalla taxonomy (single source of truth = `training-taxonomy/`). Ogni nodo-taxonomy con un campo `policy:` non-vuoto **genera** la riga-dispatch; un nodo senza policy non materializza alcun nodo situazionale (coerente con anti-over-engineering). **Lint di allineamento** (eseguibile, F-harness): "ogni foglia con policy ha **esattamente una** entry nel dispatch e viceversa; **zero orfani**". Così il drift indice↔taxonomy è **meccanicamente impossibile**, non affidato alla disciplina. Una foglia nuova = una nuova riga-F derivata (drift-free), **non** richiede retraining della skill di routing (la skill generalizza, vedi §SKILL).

### Scoping per situazione (token-efficient) `[INFERRED]`

Si **carica/consulta solo la sotto-tabella pertinente**, non tutte. Riconosciuta la situazione, **ogni hop** dell'indice è un lookup **O(1)** (hash su un livello), ma la **traversata completa indice→foglia è O(profondità) = O(depth ≤ 3)** — **non** O(1) end-to-end (il claim "O(1)" vale per il *singolo hop*, non per la navigazione). `[review-loop: corretto da "dispatch O(1)"]` Solo il ramo attivo entra nel context-assembly → costo-token ∝ profondità del ramo attivo, non dimensione totale dell'albero. È ciò che rende la struttura scalabile a 100+ regole senza appesantire il context (l'opposto della tabella-gigante-piatta).

### Classificazione training-vs-harness ([[training-vs-harness-classification]]) `[review-loop]`

Coerente con la classificazione della tabella-base (§FEATURE vs SKILL), applicata ora al **dispatch gerarchico**:

- **FEATURE = navigazione/lookup dell'albero** — il *trasporto* indice→area→topic→foglia (**dato** il nodo-target) è infra **harness-side deterministica** (lane `RULES` del vars-queue / struttura-router dedicata): ogni hop **O(1)**, traversata **O(depth)**. Stato-senza-training **PIENA** per il *trasporto* e per il **dispatch su trigger esplicito keyword-matchabile ad alto rischio** (Q6-deterministico). **Drift-impossibile nel lookup-F** (le tabelle citate sono sempre quelle correnti).
- **SKILL = la DECISIONE-DI-ROTTA a ogni hop + GENERALIZZARE** — il modello deve (a) **scegliere il ramo** quando il trigger è **implicito** (non keyword-matchabile) — questo è S **a ogni livello di profondità**, non solo alla foglia; (b) **generalizzare a situazioni non in tabella** mappandole sul ramo più vicino + invariante ereditato. La tabella non può enumerare ogni situazione → la skill copre il long-tail. Stato-senza-training **DEGRADATA-MA-UTILE** (col fallback-F il dispatch esplicito funziona; la decisione-di-rotta implicita + la generalizzazione sono migliori nei pesi).
- ⚠️ **Precisazione F/S** `[review-loop]`: è **PIENA** il *trasporto* (navigazione data la rotta) + il *dispatch esplicito*; è **S** la *decisione di rotta a profondità > 1 su trigger implicito*. Dichiarare "dispatch end-to-end PIENA" confonderebbe le due metà.
- ⚠️ **Drift skill ↔ albero** `[review-loop]`: "drift-impossibile" vale per il **lookup-F**, **non** per il sistema intero — se l'albero-F viene ristrutturato, una skill addestrata sul vecchio scheletro può instradare male. Gestito dalla §sincronizzazione (l'albero deriva dalla taxonomy; cambi d'albero = eventi versionati che triggerano ri-verifica/ri-training mirato della rotta).
- **Output**: `{F+S · F=trasporto-albero (hop O(1), traversata O(depth)) + dispatch-esplicito (PIENA, drift-free nel lookup) · S=decisione-di-rotta-implicita + generalizzazione-long-tail (DEGRADATA-MA-UTILE) · gate=fallback-dispatch-F1, skill-F2/3}`.

### Reward outcome-anchored `[review-loop]`

Il routing **NON è un reward indipendente** (sarebbe un participation-hack di secondo ordine: il modello impara a emettere il path-label giusto senza poi *applicare* la regola — il gemello del "check-fantasma"). Regola:
- **routing-corretto = GATE / pre-check, non reward**: se il routing è sbagliato il sample è **invalido**; ma il routing-giusto **da solo dà reward 0**. Serve come **diagnostica/auditing** (process-signal), **mai** come termine additivo.
- **reward positivo SOLO dall'OUTCOME**: applicata la regola del nodo, **l'errore è stato evitato** (oracolo della situazione held-out). `scorer ≠ scored` (CLAUDE.md #10). Vedi [[reward-hacking-mitigation]].
- **Held-out STRATIFICATO per livello** (premia il discriminare, non il routing-difensivo): per ogni foglia includere (a) **sibling-confusable** (foglia adiacente sotto lo stesso padre → discriminare-foglia), (b) **cross-branch-confusable** (foglia sotto altro padre → discriminare-area), (c) **negativi-del-fallback** (situazioni dove risalire al padre è *over-application* perché una foglia specifica era corretta → penalizza il "padre-sempre"), (d) **situazioni mai-viste** (long-tail) con label-azione-corretta → misura che la generalizzazione-al-ramo-più-vicino **batte il fallback banale** "applica solo l'invariante top-level". Senza (c)+(d), "risali al padre quando incerto" degenera in under-specialization premiata.

### ⚠️ Anti-over-engineering / proporzionalità (critica onesta) `[review-loop]`

**Una tabella (o un livello di gerarchia) esiste solo dove la situazione è RICORRENTE e la regola non-ovvia.** Per situazioni banali → **nessuna tabella, nessun nodo**: la stessa logica anti-over-decomposition di [[hierarchical-decomposition]] (decomporre un problema banale è overhead e una forma di reward-hacking della struttura). L'albero non riflette l'intera taxonomy 1:1 *a forza*: si materializzano i nodi dove c'è una regola load-bearing, gli altri rami restano impliciti (gestiti dall'invariante in alto).

**Trade-off — perché l'indice gerarchico vince (incluso vs flat+tag):** `[review-loop: aggiunta colonna flat+tag, l'alternativa più seria]`

| Dimensione | Flat GIGANTE | Foglie ISOLATE | **Flat + TAG/faceting** | **Indice GERARCHICO** (reco) |
|---|---|---|---|---|
| Manutenzione | regola duplicata, drift interno | drift tra tabelle, invariante ripetuto | invariante ancora duplicato per-tag | invariante in un punto (alto), specializzazione localizzata |
| Scoping token | paga tutte le righe | serve sapere a priori la tabella | carica le righe col tag attivo (buono) | carica solo il ramo attivo (O(depth)) |
| Precedenza | nessuna gerarchia | nessun raccordo cross-tabella | **piatta — nessuna precedenza floor/override** | **floor/override esplicita** (vedi §precedenza) |
| Generalizzazione | match-flat, no fallback | nessun fallback | match-per-tag, no fallback strutturale | situazione ignota → ramo più vicino + invariante ereditato |

**vs flat+tag** (l'alternativa più seria): il faceting dà lo scoping-token *senza* l'albero, ma **non porta la semantica di precedenza floor/override né il fallback strutturale all'invariante-padre** — proprio i due meccanismi che chiudono i casi-limite (multi-match, conflitto-livelli). Il gerarchico costa un po' di routing ma **compra precedenza + fallback ereditato**; flat+tag è preferibile solo se le policy sono **indipendenti e senza floor cross-cutting** (raro nel nostro caso safety-critical).

**Rischio principale = mis-routing** (input instradato sul ramo sbagliato → regola sbagliata o nessuna; l'errore cresce **composto** con la profondità → da qui il budget ≤ 3). **Mitigazione**: (i) **fallback al livello superiore** — dispatch fine incerto → applica l'invariante del nodo-padre (mai "nessuna regola"); (ii) **Q6-deterministico** su trigger esplicito ad alto-rischio (defense-in-depth: la skill migliora il caso medio, il fallback-deterministico protegge il caso critico); (iii) il routing-incerto è esso stesso un segnale **low-confidence → gather/ask** ([[low-confidence-gather-and-reorg]]).

## Reward / hack-check

- **Outcome desiderato**: nella situazione X, l'azione corretta Y è stata applicata e **ha evitato l'errore**; e — altrettanto importante — nella situazione **non-X**, la regola Y **non** è stata applicata a sproposito.
- **Reward sul riconoscere-situazione→azione** `[review-loop]` — premia se **seguire la regola ha evitato l'errore** (outcome verificabile: l'azione corretta applicata alla situazione corretta), MAI il gesto di "ho consultato la tabella" (participation-hack) né l'emissione del lookup. Vedi [[reward-hacking-mitigation]].
- **Held-out per premiare il DISCRIMINARE (non applicare-sempre)** `[review-loop]` — il rischio-hack specifico di questa skill è la **regola-applicata-sempre**: un modello che applica Y a ogni input massimizza il reward sui positivi senza *discriminare* la situazione. La difesa è un **held-out bilanciato** che include sia situazioni-X (Y è corretta) sia situazioni-non-X confondenti (Y è sbagliata / un'altra regola si applica / nessuna regola): il reward premia il **discriminare** — applicare Y *solo* dove serve — non l'applicarla incondizionatamente. Senza i negativi held-out, "trigger aggressivo / meglio falso-positivo che violazione mancata" degenera in apply-always.
- **Hack-check (scorer ≠ scored)** `[review-loop]`: lo scorer è l'**oracolo della situazione held-out** (la label "in questo input la regola Y si applica? sì/no" è by-construction), non un auto-giudizio del modello → **scorer ≠ scored** (CLAUDE.md #10).
- **Eval / situational-policy**: l'eval reale è l'**oracolo held-out della situazione** (by-construction: la label "la regola Y si applica in questo input? sì/no" è costruita, scorer≠scored — vedi hack-check sopra). Come **benchmark esterno di confronto** (non come eval primaria) è pertinente la *policy-compliance per richiesta*: **"Policy Compliance of User Requests in Natural Language for AI Systems"** (Cisneros-Velarde, arXiv [2603.00369](https://arxiv.org/abs/2603.00369), 2026) — primo benchmark di richieste annotate per compliance vs una **lista di policy** (= il nostro "quale regola si applica a questo input"); affine **CoPriva** (= nome del *benchmark*; paper *"Keep Security! Benchmarking Security Policy Preservation in LLM Contexts Against Indirect Attacks in QA"*, arXiv [2505.15805](https://arxiv.org/abs/2505.15805), EMNLP 2025) e **Compass** (*"COMPASS: A Framework for Evaluating Organization-Specific Policy Alignment in LLMs"*, arXiv [2601.01836](https://arxiv.org/abs/2601.01836)). `[EXTRACTED ricerca 2026-06-29 — 3 ref VERIFICATI indipendentemente, no-confab]` ⚠️ **NON** è il **SAD** di Laine et al. (arXiv [2407.04694](https://arxiv.org/abs/2407.04694)): quello misura la *self-AI-awareness* (riconoscere il proprio output, predire il proprio comportamento, eval-vs-deployment) → **mismatch** col nostro senso *operativo* (situazione→azione/policy corretta).

## Training (regime)

`[INFERRED]` Pipeline a 3 stadi (cfr. [[training-vs-harness-classification]] Q4):

1. **SFT-format** — famiglie di esempi `(situazione → azione-corretta)`, una famiglia per riga della tabella, includendo da subito i **negativi** (situazione-non-X → non-applicare-Y).
2. **On-policy distillation cold-start** — lo student riconosce/agisce, il teacher scora.
3. **RL-GRPO outcome-anchored** — reward sul discriminare (sopra), con held-out bilanciato X / non-X.

- **Label-generation**: by-construction per riga (trigger riconoscibile + azione attesa) + **held-out di confondenti** per il discriminare.
- ⚠️ **Si addestra il principio generico** (situazione→azione), **non** il file-path: le righe **generiche** (capture-ideas, verify-before-claim, read-before-acting, no-unverified-numbers, defense-in-depth) sono trasferibili; le righe **specifiche** del prodotto (stack/API proprietari) restano nella lane-F, non nel training.
- **Foglia di training**: Area 1/2/4 (situational-awareness, criticality, metacognition).

## Insight più grande `[INFERRED]`

Il sistema di disciplina prompt-engineered di un'organizzazione (directive + situation-table + hook + rituali) **È la versione prompt-engineered di ciò che vogliamo TRAINARE nei pesi** dell'SLM. Le righe **generiche** (capture-ideas, verify-before-claim, read-before-acting, owner-responsibility, no-unverified-numbers, defense-in-depth, …) sono trasferibili a un coding-agent = ottimo materiale di training organization-first. Le righe **specifiche** del prodotto (stack/API proprietari) NO → estrai solo il pattern + le discipline generiche.

## Linked
- [[training-vs-harness-classification]] — la governance 4-tier è ortogonale-ma-complementare all'asse training-vs-harness; gli hook auto-enforced ≈ F-pi deterministica.
- [[hierarchical-decomposition]] — l'architettura a indice (§Architettura scalabile) usa la **stessa fattorizzazione** core-invariante→assi→foglie: invariante in alto, specializzazione in basso, + proporzionalità anti-over-decomposition.
- [[../training-taxonomy/README]] — l'indice situazionale condivide lo scheletro 16-aree→topic→foglie della taxonomy di training (un solo albero).
- [[structured-context-sections]] — la situation-table è una nuova lane del context.
- [[reward-hacking-mitigation]] — outcome-anchored (la regola ha evitato l'errore), anti participation-hack.
- [[low-confidence-gather-and-reorg]] — il routing-incerto del dispatch gerarchico è un segnale low-confidence → gather/ask (mitigazione mis-routing).
- [[agent-constitution]] — le directive always-context ≈ tier-1 della governance.
- [[graph-aware-impact-review]] — "SE cambiamento strutturale/cross-cutting → ri-deriva la struttura e revisiona globale" è una **riga di questa policy-table** (recognition→azione).

> **Next**: generare l'example-space della foglia di training (Area 1/2/4) con i confondenti held-out **stratificati per livello** (sibling / cross-branch / negativi-fallback / mai-viste); definire la **lane router gerarchica** (indice→area→topic→foglia) nel context-assembly + il **lint di sincronizzazione** (zero-orfani) e il **lint floor-non-rilassato**. ✅ Training-spec (regime + held-out-discrimina + scorer≠scored) completata 2026-06-29. ✅ Architettura scalabile a indice gerarchico (Q8) progettata 2026-06-29 + **review-loop verticale+agnostico applicato** (regola taglio index-vs-inline, precedenza floor/override, multi-match union-of-policies, reward routing=gate, held-out stratificato, sync drift-free, fix O(1)→O(depth), declass "ASSICURA", colonna flat+tag, budget profondità ≤3). ✅ Ref policy-compliance VERIFICATI (Q9): 3 ref reali no-confab + ancoraggio oracolo held-out. ✅ Nota governance-4-tier già in [[training-vs-harness-classification]] §"Relazione con la governance della conoscenza".
