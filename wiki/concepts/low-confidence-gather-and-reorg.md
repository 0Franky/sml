---
name: low-confidence-gather-and-reorg
description: Protocollo metacognitivo del Tier 1 sotto bassa confidence — STOP (dentro il task corrente), trigger operativo (sta per emettere un token assente dal contesto), primo split INTERNO (grep/file-search, MAI web) vs ESTERNO (web solo se plausibilmente pubblico, altrimenti ASK), gather come budget a K passi con fallback ad ASK. Idea utente 2026-06-27 (msg 130/131/159/160).
type: concept
tags: [agent-skill, metacognition, gathering, context-reorg, ask-vs-gather, optimization, gather-budget, internal-vs-external]
sources: [user notes 2026-06-27 msg 130/131/159/160]
last_updated: 2026-06-29
status: finalized v1 — training-spec completa (EVPI twin-pair + costo-domanda + calibration)
confidence: provisional
---

# Low-Confidence: Gather & Reorg (Tier 1)

> **Stato**: finalized v1. Cattura + riorganizzazione delle idee utente 2026-06-27 (Telegram msg 130, 131, 159/160), con training-spec completata 2026-06-29. Skill metacognitiva del Tier 1 organization-first: cosa fa il modello **quando è poco confident**. Non ancora validata via grill-me (vedi §Next).

---

## Catena di pensiero (why → problema → soluzione)

- **Why** `[EXTRACTED]` — Agire sotto bassa confidence è la sorgente primaria di errori e confabulazione: il modello che non sa, ma procede, **inventa** (numeri, API, riferimenti, intenzioni dell'utente). L'esempio reale (§policy) lo mostra: indovinare invece di chiedere ha prodotto una risposta plausibile ma sbagliata.
- **Problema** `[INFERRED]` — Non basta "sapere di non sapere": serve **ridurre l'incertezza al minor costo possibile** e capire *quale* strumento la riduce. Gather sbagliato (web search su una cosa che era nel repo, o viceversa) spreca turni e può consolidare un'ipotesi falsa.
- **Soluzione** `[EXTRACTED]` — Sequenza: **STOP** (non agire) → **trigger di bassa confidence** (vedi §trigger) → **primo split INTERNO vs ESTERNO** → gather **a budget** con fallback ad ASK.

### Regola centrale 1 — il gather è un budget, non un giudizio a priori

`[INFERRED]` Il "lead" **non** è qualcosa che il modello deve *indovinare* prima di muoversi ("ho un lead?" è esso stesso una stima di confidence, non operazionalizzabile e falsificabile come ogni stima — cfr. il caso del riferimento-opaco sotto). La skill addestrabile è invece: **tenta il gather mirato; se NON converge in K passi (K piccolo, es. 2), declassa a ASK.** Così l'oggetto da apprendere diventa *"gestisci un budget di gather con fallback ad ASK"* — osservabile (numero di passi, convergenza sì/no) e quindi addestrabile — non *"prevedi se hai un lead"*. Il budget K è il meccanismo, non un'eccezione di sicurezza.

### Regola centrale 2 — primo split del decision-tree: INTERNO vs ESTERNO

`[EXTRACTED]` Prima di scegliere *come* fare gather, si sceglie *dove*:

- **INTERNO** (codice, repo, file di progetto) → `grep` / file-search / Read. **MAI web**: l'info è locale per definizione, il web non la contiene e può solo fabbricare false corrispondenze.
- **ESTERNO** (infra, sigle ignote, fatti di mondo) → web search **solo se** l'oggetto è *plausibilmente pubblico*. Se è plausibilmente privato/interno (repo non pubblici, naming aziendale, risorse non indicizzabili) → **ASK**, non web.

Questo split viene **prima** del budget: orienta lo strumento corretto, e già da solo scarta i due fallimenti più comuni (web su cosa interna; web su cosa privata-invisibile).

### Regola opzionale — REORG come euristica, non passo 1 fisso

`[INFERRED]` Riorganizzare ciò che già si ha (task-list, note, regole, watch-list) **può** rivelare che il lead/l'info è già presente, evitando un gather/ask inutile. Ma è un'**euristica opzionale**, non un passo magico garantito: vale solo se è *falsificabile* — cioè se si può dire concretamente *cosa* si riordina e *come* si verifica che ha rivelato il lead (es. l'identificatore mancante compare in una nota già in contesto). Senza questa ancora osservabile, NON va trattato come passo obbligatorio né venduto come quasi-deterministico: è coerente con [[_user-notes-2026-06-23]] "osserva prima di agire", ma resta un *try-cheap-first*, non una garanzia.

### Nota di composizione (B1) — STOP è intra-task, non un preempt

`[INFERRED]` Lo **STOP-low-confidence** opera **DENTRO** l'esecuzione del task corrente (sospende l'azione rischiosa per ridurre incertezza, poi riprende lo *stesso* task), **non** è un'interruzione che fa passare a un nuovo task. Questo lo disambigua dal default *"finish-then-switch"* di [[task-interruption-discipline]]: lì il tema è *quando* abbandonare il task corrente per un altro; qui il task non cambia, cambia solo se il prossimo passo è "agisci" o "gather/ask".

---

## La policy (decision tree)

```
TRIGGER: sto per emettere un identificatore/numero/API/sigla/path
         ASSENTE dal contesto fornito  → STOP (intra-task)
   │
   ├─ (opz.) REORG contesto: l'identificatore mancante è già in una nota/task in contesto?
   │         → se sì, falsificabile → usa quello, niente gather
   │
   ├─ PRIMO SPLIT: l'oggetto è INTERNO o ESTERNO?
   │
   ├─ INTERNO (codice/repo/file progetto) ──► grep / file-search → Read   [MAI web]
   │         └─ budget K (es. 2 passi): converge? ── sì → agisci
   │                                              └─ no → ASK
   │
   └─ ESTERNO (infra/sigle/fatti di mondo)
             ├─ plausibilmente PUBBLICO? ──► web search / fetch
             │         └─ budget K: converge? ── sì → agisci
             │                                 └─ no → ASK
             └─ plausibilmente PRIVATO/interno ──► ASK (no web: fabbricherebbe certezza)
                          └─ utente async → domanda NON-BLOCCANTE (warn-before-blocking)
```

**Caso reale — riferimento opaco a repo privati** `[EXTRACTED]` — una sigla interna ignota, riferita a repo privati (non indicizzati pubblicamente). L'AI ha fatto **web search** e ha "indovinato" una corrispondenza plausibile ma **falsa** (un progetto pubblico omonimo): l'oggetto reale era privato, invisibile al web *per costruzione*. L'errore non è "ho insistito troppo nel gather": è **a monte**, nello split. Un riferimento a repo privati → ramo ESTERNO + plausibilmente-privato → l'unica mossa valida è **ASK**. Il web, su un oggetto privato-invisibile, non *trova* nulla: **fabbrica** una corrispondenza plausibile, cioè costruisce certezza dove serviva una domanda. Lezione distillata: il primo split (INTERNO vs ESTERNO, e dentro ESTERNO pubblico vs privato) intercetta l'errore *prima* che lo strumento sbagliato produca una risposta confabulata.

`[CRITICA]` Il budget K (Regola centrale 1) e lo split (Regola centrale 2) sono complementari ma distinti: lo split sceglie *dove/quale strumento* ed esclude i casi senza-lead-possibile (privato → ASK diretto, K=0); il budget gestisce il caso in cui lo strumento è giusto ma può non convergere (K passi, poi ASK). Né l'uno né l'altro richiede di *indovinare* un lead a priori: sono entrambi osservabili (categoria interno/esterno/privato; numero di passi; convergenza sì/no).

---

## Trigger di bassa confidence (proxy operativo)

`[INFERRED]` Senza un trigger osservabile la skill non è addestrabile (non si può premiare "riconosci di essere poco confident" se non si definisce *quando* scatta). Proxy grezzo di partenza, falsificabile sul testo generato:

- **Trigger primario (token-non-in-contesto)**: il modello sta per **emettere** un identificatore concreto — nome di simbolo/funzione/file/path, **numero**, endpoint/API, sigla, versione, nome proprio — che **non compare** nel contesto fornito (prompt, file letti, history). → STOP → entra nel decision-tree (split → budget/ASK). È un proxy del classico failure "completo il token più plausibile invece di quello vero".
- **Trigger secondari** (rafforzano il primario): riferimento a un oggetto introdotto dall'utente ma mai definito (una sigla interna mai esplicitata); un passo del piano che dipende da un fatto che non è stato verificato; due fonti in contesto che si contraddicono sul valore da emettere.
- **Anti-trigger** (per non far scattare l'Hack A "paralisi"): il token è derivabile deterministicamente dal contesto, o è linguaggio naturale/glue senza claim verificabile → nessuno STOP.

Il proxy è grezzo per scelta: dà un segnale **etichettabile** sulle tracce (token emesso ∈ contesto? sì/no) da cui partire per il reward, non una definizione finale di "confidence".

---

## Classificazione training-vs-harness `[review-loop]`

Applico il decision-tree di [[training-vs-harness-classification]] (Step-0 scomponi → classifica ogni metà → stato-senza-training). Cfr. worked-example 2 del playbook stesso.

- **Q0 scomponi**:
  - **{meccanismo}** = gli strumenti di gather (grep / file-search / Read come tool callable) **+** il canale **ASK** (domanda non-bloccante all'utente, warn-before-blocking) **+** il budget-counter K (contatore di passi gestito wrapper-side).
  - **{decisione}** = riconoscere la bassa-confidence (trigger token-non-in-contesto) + scegliere INTERNO/ESTERNO + pubblico/privato + *quando* fermare il gather e declassare ad ASK.
- **Q1/Q1a → F-harness**: strumenti di gather, canale-ASK e budget-counter sono tool/hook wrapper-side deterministici. **Stato: PIENA** (esistono e funzionano senza training).
- **Q2 → S**: il riconoscimento dell'incertezza + lo split INTERNO/ESTERNO/privato + la gestione del budget sono decisioni che il modello deve fare nei pesi.
- **Q3 → F+S**: Q1 ∧ Q2, e lo stato-senza-training della metà-S è **INERTE** (il caso reale del *riferimento-opaco-a-repo-privato* — dove il gather-cieco ha confabulato — È esattamente il fallimento di questa skill non-addestrata).
- **Q5 stato-senza-training (metà-S): INERTE**. Il base-model non riconosce l'incertezza in modo affidabile e tende al default "completa-il-token-plausibile" (Hack B). NON spedibile come skill di Fase-1.
- **Q6 fallback deterministico: DEBOLE**. Si può forzare un gather su ogni token-non-in-contesto, ma rischia **over-asking** sistematico (Hack A) e non dà stato PIENA → la skill resta **gated sul training** (a differenza di autocompact, dove la soglia `getContextUsage` dà un fallback forte). Per questo qui la skill è *più* critica che altrove.

> **Output**: `{F+S · stato-S=INERTE · gate=training F2-3 (fallback debole) · spec-S=EVPI-twin-pair + uncertainty/calibration-reward + costo-domanda}`.

## Reward / hack-check

- **Skill (outcome desiderato)**: ridurre l'incertezza *prima* di agire, con la mossa di costo minimo che cambia la decisione.
- **Hack A — over (paralisi)**: gather/ask **sempre**, anche quando la confidence è alta → turni sprecati, utente interrotto inutilmente, latenza. È il reward-hacking "partecipativo" (vedi [[reward-hacking-mitigation]]): premiare l'*atto* di gather/ask invece dell'esito.
- **Hack B — under (confabulazione)**: gather/ask **mai** → il modello procede e inventa. È il fallimento di default che la skill esiste per coprire.
- **Difesa**: reward **bilanciato** che penalizza *entrambi* gli estremi — sia l'azione-sotto-incertezza (B) sia l'over-asking/over-gathering (A).
- **Ground truth (ancora all'outcome, non alla partecipazione)** `[EXTRACTED]` — la domanda di verifica è: *l'info recuperata (o richiesta) era **necessaria** e ha **cambiato** la decisione?* Se gather/ask non ha mosso l'esito, era over. Se l'azione è stata presa senza l'info che poi serviva, era under. Niente reward per il gesto in sé.

### Reward outcome-anchored: EVPI twin-pair (il meccanismo concreto) `[review-loop]`

`[INFERRED]` "L'info ha cambiato la decisione?" è un'etichetta **non implementabile** se misurata su una singola traiettoria (non si osserva il controfattuale). Il meccanismo concreto — riuso del pattern gold di area-02 — è la **coppia gemella (twin-pair) by-construction**:

- Si costruisce una **coppia di prompt identici** che differiscono **solo** per la presenza dell'informazione che il gather/ask recupererebbe:
  - **Twin-A (info-assente)**: il fatto critico NON è nel contesto → il gather/ask è *necessario* per decidere bene.
  - **Twin-B (info-già-presente)**: lo stesso fatto È già nel contesto → il gather/ask **non cambierebbe l'esito** (è ridondante).
- **Reward = l'informazione ha cambiato la DECISIONE osservabile**, non il gesto di chiederla:
  - su Twin-A: gather/ask che porta alla decisione corretta → **reward+**; procedere senza (Hack B) → penalità.
  - su Twin-B: gather/ask che ripete un'info già disponibile (Hack A, over-asking) → **penalità**; procedere diretto e corretto → **reward+**.
- Lo scorer confronta l'esito (decisione/azione finale corretta) **tra i due gemelli** → il segnale premia il *discriminare quando l'info serve*, non l'atto di cercarla. È by-construction non-gameable con la verbosità ("ho cercato accuratamente").

### Costo-della-domanda esplicito `[review-loop]`

`[INFERRED]` ASK e gather **non sono gratis**: interrompono l'utente / spendono turni / latenza. Il reward deve includere un **termine di costo** esplicito (allineato a EVPI / SELAUR `[ref?]`): l'azione di gather/ask vale solo se *Expected Value of Perfect Information − costo > 0*. Senza il termine di costo, il reward bilanciato collassa verso l'over-asking (chiedere è "safe"). Il costo è ciò che rende Twin-B una vera penalità e non un pareggio.

### Calibration-reward (RLCR / Brier) `[review-loop]`

`[INFERRED]` Questa è una **decisione sotto incertezza**: la confidence stimata dal modello deve essere *calibrata*, altrimenti il trigger token-non-in-contesto da solo è troppo grezzo. Si wira un **calibration-reward** (RLCR / ConfTuner-Brier `[ref?]`) — mai self-report grezzo — con **ECE/Brier come metrica di early-stop** di pari rango con l'accuracy del gather. Vincolo noto: **GRPO erode la calibrazione** (cfr. [[training-vs-harness-classification]] Q4), quindi il calibration-reward va mantenuto attivo *durante* l'RL, non solo in SFT.

### Hack-check (scorer ≠ scored) `[review-loop]`

`[INFERRED]` Lo scorer del twin-pair è **deterministico/by-construction** (confronto di esiti tra gemelli + lookup info∈contesto), **non** un giudizio del modello su sé stesso → **scorer ≠ scored** rispettato (CLAUDE.md #10). Il participation-hack ("dichiaro uncertain / cerco per incassare") è disinnescato perché il reward è sul *delta di decisione tra gemelli*, non sull'emissione del gesto.

---

## Training (regime)

`[INFERRED]` Pipeline a 3 stadi standard per le skill metacognitive inerti (cfr. [[training-vs-harness-classification]] Q4 "cold-start a 3 stadi"):

1. **SFT-format-bootstrap** — traiettorie con la sequenza canonica (trigger → split INTERNO/ESTERNO/privato → gather entro K → ASK come fallback) per insegnare il *formato* della decisione. Le grammar (XGrammar) possono forzare la forma del blocco-decisione, lasciando al training solo la semantica.
2. **On-policy distillation cold-start** — lo student genera traiettorie, un teacher le scora; riduce il gap del cold-start del GRPO su modello 4B (`on-policy-distill` `[ref?]`).
3. **RL-GRPO uncertainty-aware** — reward EVPI-twin-pair + costo-domanda + calibration-reward (sopra). Outcome-anchored, scorer≠scored.

- **Label-generation**: **EVPI twin-pair by-construction** (coppia info-assente/info-presente) — riuso del pattern gold area-02; più tracce held-out negative (web su riferimento privato; over-asking ad alta confidence; budget ignorato in loop).
- **Foglia di training**: Area 4 (metacognition) per il riconoscimento bassa-confidence + bivio; Area 9 (communication / deference) per il ramo ASK.

## Linked

- [[scientific-method-operating-protocol]] — passo 1 "Observe/Awareness": osserva e prendi consapevolezza prima di agire (questa skill ne è il sotto-caso "bassa confidence").
- [[training-vs-harness-classification]] — il playbook di classificazione; questo concept è il **worked-example 2** del playbook (F+S, stato-S INERTE, fallback debole).
- [[error-memo-system]] — errori da gather-cieco/azione-sotto-incertezza alimentano la memo (es. lezione del riferimento-opaco-a-repo-privato).
- [[agent-wrapper-vars-queue]] — le note/task-list/watch-list che il REORG (euristica opzionale) riorganizza vivono qui.
- [[agent-constitution]] — **C8** "Dichiara incertezza: se non sai, dillo, non confabulare" (`agent-constitution.md:32`); C7 deferenza ai bivi ad alto impatto = il ramo ASK.
- [[phased-reward-and-rh-detection]] — è il **meccanismo di reward** che governa la fase "gathering": questo concept *definisce* la fase (quando fare gather, con quale budget K, INTERNO vs ESTERNO), mentre phased-reward la *premia* per-fase e ne previene il participation-hack (gather ripetuto per incassare il reward anche dove inutile = Hack A qui sotto).
- [[task-interruption-discipline]] — disambiguazione (nota B1): lo STOP-low-confidence è **intra-task** (sospendi-poi-riprendi lo stesso task), distinto dal *finish-then-switch* che governa il passaggio *tra* task.
- `feedback_optimization_first` (memory) — reorg proattivo del contesto + low-confidence→gather; "ricordatelo sempre".
- [[_private/rules-tg-warn-before-blocking]] — il ramo ASK in modalità async dev'essere **non-bloccante** (warn before blocking).

## Next
- Grill-me: tarare **K** (passi di budget prima del fallback ad ASK) e affinare il **trigger** (oltre al token-non-in-contesto: serve un secondo proxy per i casi senza emissione di token concreto?).
- Definire l'euristica di classificazione **plausibilmente pubblico vs privato** dentro il ramo ESTERNO (è la decisione che il caso del riferimento-opaco mostra essere critica).
- Generare tracce di training etichettabili sul trigger: positive (trigger→split corretto→gather entro K; ESTERNO-privato→ASK) e negative (web search su un riferimento privato; over-asking su alta confidence = Hack A; budget ignorato e gather in loop).
- `/graphify --update`.
