---
name: low-confidence-gather-and-reorg
description: Protocollo metacognitivo del Tier 1 sotto bassa confidence — STOP (dentro il task corrente), trigger operativo (sta per emettere un token assente dal contesto), primo split INTERNO (grep/file-search, MAI web) vs ESTERNO (web solo se plausibilmente pubblico, altrimenti ASK), gather come budget a K passi con fallback ad ASK. Idea utente 2026-06-27 (msg 130/131/159/160).
type: concept
tags: [agent-skill, metacognition, gathering, context-reorg, ask-vs-gather, optimization, gather-budget, internal-vs-external]
sources: [user notes 2026-06-27 msg 130/131/159/160]
last_updated: 2026-06-27
status: draft v0
confidence: provisional
---

# Low-Confidence: Gather & Reorg (Tier 1)

> **Stato**: draft v0. Cattura + riorganizzazione delle idee utente 2026-06-27 (Telegram msg 130, 131, 159/160). Skill metacognitiva del Tier 1 organization-first: cosa fa il modello **quando è poco confident**. Non ancora validata via grill-me.

---

## Catena di pensiero (why → problema → soluzione)

- **Why** `[EXTRACTED]` — Agire sotto bassa confidence è la sorgente primaria di errori e confabulazione: il modello che non sa, ma procede, **inventa** (numeri, API, riferimenti, intenzioni dell'utente). L'esempio reale (§policy) lo mostra: indovinare invece di chiedere ha prodotto una risposta plausibile ma sbagliata.
- **Problema** `[INFERRED]` — Non basta "sapere di non sapere": serve **ridurre l'incertezza al minor costo possibile** e capire *quale* strumento la riduce. Gather sbagliato (web search su una cosa che era nel repo, o viceversa) spreca turni e può consolidare un'ipotesi falsa.
- **Soluzione** `[EXTRACTED]` — Sequenza: **STOP** (non agire) → **trigger di bassa confidence** (vedi §trigger) → **primo split INTERNO vs ESTERNO** → gather **a budget** con fallback ad ASK.

### Regola centrale 1 — il gather è un budget, non un giudizio a priori

`[INFERRED]` Il "lead" **non** è qualcosa che il modello deve *indovinare* prima di muoversi ("ho un lead?" è esso stesso una stima di confidence, non operazionalizzabile e falsificabile come ogni stima — cfr. `nv/wh`). La skill addestrabile è invece: **tenta il gather mirato; se NON converge in K passi (K piccolo, es. 2), declassa a ASK.** Così l'oggetto da apprendere diventa *"gestisci un budget di gather con fallback ad ASK"* — osservabile (numero di passi, convergenza sì/no) e quindi addestrabile — non *"prevedi se hai un lead"*. Il budget K è il meccanismo, non un'eccezione di sicurezza.

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

**Caso reale `nv/wh` — dimostrazione del PRIMO SPLIT** `[EXTRACTED]` — sigle `nv/wh` ignote. L'AI ha fatto **web search** e ha "indovinato" *Whispers* — risposta plausibile ma **falsa**: erano repo privati (NetView / WillHouse), invisibili al web *per costruzione*. L'errore non è "ho insistito troppo nel gather": è **a monte**, nello split. `nv/wh` sono naming di repo privati → ramo ESTERNO + plausibilmente-privato → l'unica mossa valida è **ASK**. Il web, su un oggetto privato-invisibile, non *trova* nulla: **fabbrica** una corrispondenza plausibile (qui *Whispers*), cioè costruisce certezza dove serviva una domanda. Lezione distillata: il primo split (INTERNO vs ESTERNO, e dentro ESTERNO pubblico vs privato) intercetta l'errore *prima* che lo strumento sbagliato produca una risposta confabulata.

`[CRITICA]` Il budget K (Regola centrale 1) e lo split (Regola centrale 2) sono complementari ma distinti: lo split sceglie *dove/quale strumento* ed esclude i casi senza-lead-possibile (privato → ASK diretto, K=0); il budget gestisce il caso in cui lo strumento è giusto ma può non convergere (K passi, poi ASK). Né l'uno né l'altro richiede di *indovinare* un lead a priori: sono entrambi osservabili (categoria interno/esterno/privato; numero di passi; convergenza sì/no).

---

## Trigger di bassa confidence (proxy operativo)

`[INFERRED]` Senza un trigger osservabile la skill non è addestrabile (non si può premiare "riconosci di essere poco confident" se non si definisce *quando* scatta). Proxy grezzo di partenza, falsificabile sul testo generato:

- **Trigger primario (token-non-in-contesto)**: il modello sta per **emettere** un identificatore concreto — nome di simbolo/funzione/file/path, **numero**, endpoint/API, sigla, versione, nome proprio — che **non compare** nel contesto fornito (prompt, file letti, history). → STOP → entra nel decision-tree (split → budget/ASK). È un proxy del classico failure "completo il token più plausibile invece di quello vero".
- **Trigger secondari** (rafforzano il primario): riferimento a un oggetto introdotto dall'utente ma mai definito (`nv/wh`); un passo del piano che dipende da un fatto che non è stato verificato; due fonti in contesto che si contraddicono sul valore da emettere.
- **Anti-trigger** (per non far scattare l'Hack A "paralisi"): il token è derivabile deterministicamente dal contesto, o è linguaggio naturale/glue senza claim verificabile → nessuno STOP.

Il proxy è grezzo per scelta: dà un segnale **etichettabile** sulle tracce (token emesso ∈ contesto? sì/no) da cui partire per il reward, non una definizione finale di "confidence".

---

## Reward / hack-check

- **Skill (outcome desiderato)**: ridurre l'incertezza *prima* di agire, con la mossa di costo minimo che cambia la decisione.
- **Hack A — over (paralisi)**: gather/ask **sempre**, anche quando la confidence è alta → turni sprecati, utente interrotto inutilmente, latenza. È il reward-hacking "partecipativo" (vedi [[reward-hacking-mitigation]]): premiare l'*atto* di gather/ask invece dell'esito.
- **Hack B — under (confabulazione)**: gather/ask **mai** → il modello procede e inventa. È il fallimento di default che la skill esiste per coprire.
- **Difesa**: reward **bilanciato** che penalizza *entrambi* gli estremi — sia l'azione-sotto-incertezza (B) sia l'over-asking/over-gathering (A).
- **Ground truth (ancora all'outcome, non alla partecipazione)** `[EXTRACTED]` — la domanda di verifica è: *l'info recuperata (o richiesta) era **necessaria** e ha **cambiato** la decisione?* Se gather/ask non ha mosso l'esito, era over. Se l'azione è stata presa senza l'info che poi serviva, era under. Niente reward per il gesto in sé.

---

## Linked

- [[scientific-method-operating-protocol]] — passo 1 "Observe/Awareness": osserva e prendi consapevolezza prima di agire (questa skill ne è il sotto-caso "bassa confidence").
- [[error-memo-system]] — errori da gather-cieco/azione-sotto-incertezza alimentano la memo (es. lezione `nv/wh`).
- [[agent-wrapper-vars-queue]] — le note/task-list/watch-list che il REORG (euristica opzionale) riorganizza vivono qui.
- [[agent-constitution]] — **C8** "Dichiara incertezza: se non sai, dillo, non confabulare" (`agent-constitution.md:32`); C7 deferenza ai bivi ad alto impatto = il ramo ASK.
- [[phased-reward-and-rh-detection]] — è il **meccanismo di reward** che governa la fase "gathering": questo concept *definisce* la fase (quando fare gather, con quale budget K, INTERNO vs ESTERNO), mentre phased-reward la *premia* per-fase e ne previene il participation-hack (gather ripetuto per incassare il reward anche dove inutile = Hack A qui sotto).
- [[task-interruption-discipline]] — disambiguazione (nota B1): lo STOP-low-confidence è **intra-task** (sospendi-poi-riprendi lo stesso task), distinto dal *finish-then-switch* che governa il passaggio *tra* task.
- `feedback_optimization_first` (memory) — reorg proattivo del contesto + low-confidence→gather; "ricordatelo sempre".
- [[_private/rules-tg-warn-before-blocking]] — il ramo ASK in modalità async dev'essere **non-bloccante** (warn before blocking).

> **Skill di training**: Area 4 (metacognition) per il riconoscimento bassa-confidence + bivio; Area 9 (communication / deference) per il ramo ASK. `[INFERRED]`

## Next
- Grill-me: tarare **K** (passi di budget prima del fallback ad ASK) e affinare il **trigger** (oltre al token-non-in-contesto: serve un secondo proxy per i casi senza emissione di token concreto?).
- Definire l'euristica di classificazione **plausibilmente pubblico vs privato** dentro il ramo ESTERNO (è la decisione che `nv/wh` mostra essere critica).
- Generare tracce di training etichettabili sul trigger: positive (trigger→split corretto→gather entro K; ESTERNO-privato→ASK) e negative (`nv/wh` web su privato; over-asking su alta confidence = Hack A; budget ignorato e gather in loop).
- `/graphify --update`.
