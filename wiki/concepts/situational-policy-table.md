---
name: situational-policy-table
description: Tabella-router "SE situazione X → leggi/applica regola-azione Y (obbligo) PRIMA di procedere". FEATURE = lane lookup O(1) (drift-impossibile, scalabile, auto-enforced) + SKILL = riconoscere la situazione → emettere l'azione corretta, addestrata nei pesi (si addestra il COMPORTAMENTO, non il file-path). Training goldmine. Parte di una governance della conoscenza a 4 tier. Idea utente msg 200-202 (pattern generico estratto PII-free da repo privato).
type: concept
tags: [concept, situational-awareness, policy-table, governance, training-goldmine, skill-vs-feature, reward-hacking, organization-first]
sources: [user notes 2026-06-27 msg 200-202, wiki/concepts/training-vs-harness-classification, structured-context-sections]
last_updated: 2026-06-29
status: finalized v1 — training-spec completa (held-out discrimina-situazione + governance 4-tier) + architettura scalabile a indice gerarchico (Q8 2026-06-29) + ref-eval risolto (Q9 2026-06-29)
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

**Risposta = GERARCHICA a indice.** Né una tabella gigante piatta (non-manutenibile, costosa in token, generalizza male), né tabelle-foglia isolate e scollegate (drift tra tabelle, nessun invariante condiviso, dispatch ambiguo). La struttura raccomandata è un **indice top-level che instrada verso tabelle progressivamente più specifiche** (area → topic → foglia), con la **stessa logica di fattorizzazione** di [[hierarchical-decomposition]]: l'**invariante condiviso vive in alto**, la **specializzazione vive in basso**.

### Struttura `[INFERRED]`

- **INDICE di situational-table (top-level)**: poche righe ad alta-ricorrenza/cross-cutting (l'analogo del tier-1 `LM.md`-directive della governance 4-tier). Riconosciuta la situazione, l'indice **non risolve tutto da sé**: instrada (`→`) verso la **sotto-tabella pertinente** (area → topic → foglia). È il dispatcher.
- **Sotto-tabelle per area/topic/foglia**: contengono le righe specifiche di quella situazione. Allineate 1:1 alla tassonomia di [[../training-taxonomy/README]] (16 aree → ~77 topic → ~215 foglie): l'indice top-level mappa la situazione sulla **stessa gerarchia** che già governa il training, quindi indice-situazionale e taxonomy condividono lo scheletro (un solo albero, niente doppia manutenzione).
- **Invariante in alto / specializzazione in basso**: le regole **generiche e trasferibili** (capture-ideas, verify-before-claim, read-before-acting, no-unverified-numbers, defense-in-depth) stanno **in alto** (valgono cross-situazione); le regole **prodotto-specifiche** (stack/API proprietari) stanno **in basso**, nelle sotto-tabelle-foglia. Stessa fattorizzazione core-invariante → assi → foglie di [[hierarchical-decomposition]].

### Scoping per situazione (token-efficient) `[INFERRED]`

Si **carica/consulta solo la sotto-tabella pertinente**, non tutte. Riconosciuta la situazione, l'indice fa **dispatch O(1)** sul ramo giusto e **solo quel ramo** entra nel context-assembly. Questo è ciò che rende la struttura scalabile a 100+ regole **senza appesantire il context** (l'opposto della tabella-gigante-piatta, che pagherebbe tutte le righe ad ogni passo). Il costo-token è proporzionale alla **profondità del ramo attivo**, non alla dimensione totale dell'albero.

### Classificazione training-vs-harness ([[training-vs-harness-classification]]) `[review-loop]`

Coerente con la classificazione della tabella-base (§FEATURE vs SKILL), applicata ora al **dispatch gerarchico**:

- **FEATURE = il lookup/dispatch gerarchico O(1)** — la navigazione indice→area→topic→foglia è infra **harness-side deterministica** (lane `RULES` del vars-queue / struttura-router dedicata nel context-assembly). Stato-senza-training **PIENA**: su trigger esplicito il dispatch instrada correttamente indipendentemente dal training; **drift-impossibile** (le tabelle citate sono sempre quelle correnti); aggiornabile senza retraining.
- **SKILL = riconoscere a quale situazione/livello appartiene l'input + GENERALIZZARE** — il modello deve (a) classificare l'input sul nodo giusto dell'albero (specie quando il trigger è **implicito**, non keyword-matchabile) e (b) **generalizzare a situazioni non in tabella** (una situazione mai vista deve mappare sul ramo più vicino e applicare l'invariante ereditato dall'alto). Questo è il valore-nei-pesi: la tabella non può enumerare ogni situazione → la skill copre il long-tail. Stato-senza-training **DEGRADATA-MA-UTILE** (col fallback-F il dispatch esplicito funziona; il riconoscimento robusto + la generalizzazione sono migliori nei pesi).
- **Output**: `{F+S · F=dispatch-gerarchico-O(1) drift-impossibile (PIENA) · S=classificazione-livello + generalizzazione-long-tail (DEGRADATA-MA-UTILE) · gate=fallback-dispatch-F1, skill-F2/3}`.

### Reward outcome-anchored `[review-loop]`

Premia l'**azione corretta nella situazione** (oracolo held-out della situazione), **MAI** la presenza della tabella, la dichiarazione "ho consultato l'indice", o l'emissione del path di dispatch (participation-hack). Per la skill di routing gerarchico il segnale è duplice: (i) **routing corretto** — l'input è stato instradato sul nodo giusto dell'albero (label by-construction: quale foglia governa questo input); (ii) **azione corretta a valle** — applicata la regola del nodo, l'errore è stato evitato. Held-out **bilanciato** anche qui (situazioni-X vs confondenti vicini di ramo) per premiare il **discriminare il livello**, non il routing-sempre-allo-stesso-nodo. Scorer = oracolo della situazione held-out, **scorer ≠ scored** (CLAUDE.md #10). Vedi [[reward-hacking-mitigation]].

### ⚠️ Anti-over-engineering / proporzionalità (critica onesta) `[review-loop]`

**Una tabella (o un livello di gerarchia) esiste solo dove la situazione è RICORRENTE e la regola non-ovvia.** Per situazioni banali → **nessuna tabella, nessun nodo**: la stessa logica anti-over-decomposition di [[hierarchical-decomposition]] (decomporre un problema banale è overhead e una forma di reward-hacking della struttura). L'albero non deve riflettere l'intera taxonomy 1:1 *a forza*: si materializzano i nodi dove c'è una regola load-bearing, gli altri rami restano impliciti (gestiti dall'invariante in alto).

**Trade-off indice-gerarchico vs flat — perché il gerarchico vince:**

| Dimensione | Tabella gigante PIATTA | Tabelle-foglia ISOLATE | **Indice GERARCHICO** (raccomandato) |
|---|---|---|---|
| Manutenzione | regola duplicata su N righe, drift interno | drift tra tabelle, invariante ripetuto | invariante in un punto (alto), specializzazione localizzata |
| Scoping token | paga tutte le righe ad ogni passo | richiede sapere *a priori* quale tabella | carica solo il ramo attivo (O(profondità)) |
| Coerenza | nessuna gerarchia di precedenza | nessun raccordo cross-tabella | precedenza alto→basso esplicita |
| Generalizzazione | match-flat, no fallback strutturale | nessun fallback se nessuna tabella matcha | situazione ignota → ramo più vicino + invariante ereditato |

**Rischio principale del gerarchico = mis-routing** (l'input viene instradato sul ramo sbagliato → si applica la regola sbagliata o nessuna). **Mitigazione**: (i) **fallback al livello superiore** — se il dispatch fine fallisce/è incerto, si risale e si applica l'invariante del nodo-padre (mai "nessuna regola"); (ii) **Q6-deterministico** (cfr. [[training-vs-harness-classification]] Q6) — su trigger esplicito ad alto-rischio il match-pattern della lane instrada deterministicamente, bypassando la classificazione-soft del modello (defense-in-depth: la skill di routing migliora il caso medio, il fallback-deterministico protegge il caso critico). Il routing-incerto è esso stesso un segnale di **low-confidence → gather/ask** ([[low-confidence-gather-and-reorg]]).

## Reward / hack-check

- **Outcome desiderato**: nella situazione X, l'azione corretta Y è stata applicata e **ha evitato l'errore**; e — altrettanto importante — nella situazione **non-X**, la regola Y **non** è stata applicata a sproposito.
- **Reward sul riconoscere-situazione→azione** `[review-loop]` — premia se **seguire la regola ha evitato l'errore** (outcome verificabile: l'azione corretta applicata alla situazione corretta), MAI il gesto di "ho consultato la tabella" (participation-hack) né l'emissione del lookup. Vedi [[reward-hacking-mitigation]].
- **Held-out per premiare il DISCRIMINARE (non applicare-sempre)** `[review-loop]` — il rischio-hack specifico di questa skill è la **regola-applicata-sempre**: un modello che applica Y a ogni input massimizza il reward sui positivi senza *discriminare* la situazione. La difesa è un **held-out bilanciato** che include sia situazioni-X (Y è corretta) sia situazioni-non-X confondenti (Y è sbagliata / un'altra regola si applica / nessuna regola): il reward premia il **discriminare** — applicare Y *solo* dove serve — non l'applicarla incondizionatamente. Senza i negativi held-out, "trigger aggressivo / meglio falso-positivo che violazione mancata" degenera in apply-always.
- **Hack-check (scorer ≠ scored)** `[review-loop]`: lo scorer è l'**oracolo della situazione held-out** (la label "in questo input la regola Y si applica? sì/no" è by-construction), non un auto-giudizio del modello → **scorer ≠ scored** (CLAUDE.md #10).
- **Eval / situational-policy**: l'eval reale è l'**oracolo held-out della situazione** (by-construction: la label "la regola Y si applica in questo input? sì/no" è costruita, scorer≠scored — vedi hack-check sopra). Come **benchmark esterno di confronto** (non come eval primaria) è pertinente la *policy-compliance per richiesta*: **"Policy Compliance of User Requests in Natural Language for AI Systems"** (Cisneros-Velarde, arXiv [2603.00369](https://arxiv.org/abs/2603.00369), 2026) — primo benchmark di richieste annotate per compliance vs una **lista di policy** (= il nostro "quale regola si applica a questo input"); affine **CoPriva** (arXiv [2505.15805](https://arxiv.org/abs/2505.15805), EMNLP 2025, non-disclosure-policy preservation) e **Compass** (arXiv [2601.01836](https://arxiv.org/abs/2601.01836), organization-specific policy alignment). `[EXTRACTED ricerca 2026-06-29]` ⚠️ **NON** è il **SAD** di Laine et al. (arXiv [2407.04694](https://arxiv.org/abs/2407.04694)): quello misura la *self-AI-awareness* (riconoscere il proprio output, predire il proprio comportamento, eval-vs-deployment) → **mismatch** col nostro senso *operativo* (situazione→azione/policy corretta).

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

> **Next**: generare l'example-space della foglia di training (Area 1/2/4) con i confondenti held-out; definire la **lane router gerarchica** (indice→area→topic→foglia) nel context-assembly. ✅ Training-spec (regime + held-out-discrimina + scorer≠scored) completata 2026-06-29. ✅ Architettura scalabile a indice gerarchico (Q8) progettata 2026-06-29. ✅ Ref SAD risolto (Q9): sostituito con policy-compliance benchmark reale + ancoraggio oracolo held-out. ✅ Nota governance-4-tier già in [[training-vs-harness-classification]] §"Relazione con la governance della conoscenza".
