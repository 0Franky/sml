> # ⛔ NON VALIDATA — PROPOSTA (#26)
> Nulla qui è ratificato. La ratifica del contenuto (e della collocazione in gerarchia) resta dell'utente.
> **Istanza illustrativa data dall'utente** (rubinetto che perde) = **HELD-OUT di validazione** (#18), MAI nel training.

---
name: gold-example-procedural-order-and-register
description: Esempio GOLD (PROPOSTA #26) per DUE skill sorelle non-codice — (a) ORDINAMENTO di una sequenza d'azioni per contenimento-del-danno + rispetto delle dipendenze (contieni il danno PRIMA, poi diagnostichi, poi ripari), reward sull'OUTCOME dell'ordine (danno accumulato, dipendenze violate) NON sulla presenza dell'argomentazione; (b) CALIBRAZIONE DEL REGISTRO (diretto vs argomentato vs strutturato) all'appropriatezza-alla-situazione. Negativi simmetrici su entrambi i poli (over-argomenta il banale / risponde di getto saltando l'ordine; over-contieni con azione irreversibile / non contiene affatto). Anti-over-decomposition come freno di proporzionalità.
type: gold-example
leaf: "procedural-ordering-for-damage-containment (a) + register-calibration-for-stakes (b)"
area: area-02-criticality-safety
reward_tag: "Q-DOMINANTE per l'ORDINE (danno-simulato + dipendenze-violate eseguibili sulla fixture). Il REGISTRO è calibrazione: outcome per-esempio SOLO sul non-ramo (stato-di-conoscenza del destinatario / correttezza-risposta), il DETERMINANTE-del-ramo va al distribuzionale (held-out bilanciato + ECE) — #32. MAI L sull'argomentazione in sé (judge-gaming)."
last_updated: 2026-07-24
status: gold-draft PROPOSTA (#26) — [UNVERIFIED — format-only, sandbox-execution pending]
---

# GOLD (PROPOSTA #26) — `procedural-ordering` + `register-calibration` · scenari *sequenza d'azioni non-codice*

## §0 — Cos'è / perché è gold / la barra

Questo file è l'esempio-gold di training per **due skill non-codice, sorelle e componibili**, che oggi hanno un **buco** nell'albero (gap-scan 2026-07-24, verificato sui file):

- **(a) Ordinamento procedurale per contenimento-del-danno**. Data una **sequenza di azioni** (non un problema da fattorizzare), produrre l'**ORDINE** che: (i) **contiene il danno per primo** (l'azione che ferma il peggioramento va prima di diagnosi/riparazione), (ii) rispetta le **dipendenze** (non puoi riparare prima di aver isolato). Questo NON è coperto da [[gold-example-decomposition]]: la decomposizione **esclude esplicitamente le sequenze** — una pura sequenza → *niente* `<decomposition>` (gold-example-decomposition.md:421). È invece la faccia **temporale-nell'esecuzione** di [[class-consequence-intention-conflict]]: eseguire nell'ordine sbagliato è una **conseguenza auto-sconfiggente** (chiami il tecnico mentre l'acqua continua ad allagare → l'azione *"agisco subito"* contraddice l'intenzione *"minimizzo il danno"*).
- **(b) Calibrazione del registro alla posta in gioco**. Scegliere QUANDO essere **diretto** (dai la risposta e basta), **argomentato** (dai la risposta + il perché azionabile), o **strutturato** (scomponi/organizza). Oggi esiste solo il binario *pensiero-strutturato → prosa* (structured-thinking.md:80) e l'edge *over-communication su bassa criticità* (area-02-criticality-safety.md:256): manca la **skill positiva di calibrazione** come capacità di prima classe.

**La barra (anti-cerimonia).** Il difetto documentato da E-COMP è esattamente qui: dare la mezza-skill *"estrai il requisito load-bearing / dimensiona la risposta"* **peggiorava** il sapersi fermare (incatenamento-per-rito `3/12` vs `0/12` del controllo nudo, harness-experiment-log.md:353-354). Morale: se il reward premia *"produci sempre un ordine elaborato / argomenta sempre"*, crea l'hack *"aggiungi cerimonia"*. → il reward qui è ancorato all'**esito reale** (danno contenuto? destinatario in grado di agire?), MAI alla forma; e il **GATE §Gate** (policy-stupida) è la prova che la forza bruta perde.

> ⚠️ **Anti-over-decomposition / anti-over-argument first-class** (proporzionalità, CLAUDE.md #10): il dataset bilancia il caso *serve-ordine-e-contenimento* con negativi dove **imporre** un ordine drastico o **argomentare** un caso banale è l'errore. Produrre 3 heading di piano o 5 paragrafi di rationale **non è premiato di per sé**.

> **[UNVERIFIED — format-only]**: gli output "danno-simulato" / "stato-di-conoscenza del destinatario" mostrati sono format-only; l'esecuzione reale è gated sullo scaffold verifier-sandbox ([[../decisions/2026-06-23-pi-harness-base]]).

## §1 — Skill-target (segnale, preciso e falsificabile)

**(a) Ordine** — data una lista di azioni **presentata SCRAMBLED** (ordine del prompt casuale), ciascuna con effetti dati nella fixture (`stops_damage?`, `damage_rate`, `depends_on`, `reversible?`), il modello emette l'**ordine di esecuzione** che **minimizza il danno totale accumulato** e **non viola dipendenze**, riconoscendo che **il contenimento va prima della diagnosi che va prima della riparazione** — ma solo quando la situazione lo richiede (proporzionalità).

**(b) Registro** — data una richiesta + il contesto (posta in gioco, ambiguità, capacità del destinatario di agire), il modello sceglie il **registro** la cui **forma combacia** con ciò che la situazione richiede: risposta **diretta** su domanda banale/self-contained, **argomentata** dove il destinatario deve *agire* e serve il *perché*, **strutturata** dove la posta è alta e la decisione ha rami.

**Falsificabile perché**: (a) l'ordine è materializzato in una **partizione ordinata** e la conseguenza è un **fatto eseguibile sulla fixture** (danno accumulato, dipendenze violate — veri-per-costruzione, regola #22); (b) il registro è valutato per-esempio SOLO sul **non-ramo** (il destinatario simulato riesce ad agire correttamente dalla risposta? la risposta è corretta?) e il **determinante-del-ramo** (registro↔posta) va al **distribuzionale** (calibrazione, non per-esempio — #32, vedi §Reward).

## §2 — Scenari (fixture SELF-CONTAINED, benigni — regola #22 + sicurezza)

> Tutti gli scenari sono **benigni**: perdite d'acqua, domande di aritmetica, incidenti domestici. Nessun payload, nessun comando distruttivo. I campi load-bearing sono **dati** nella fixture → si testa il **ragionamento**, non il recall del mondo reale.

### (a) Ordine — scenario portante `FX-order` (dominio: emergenza domestica)

```
situazione: "In cucina si è rotta una tubatura: esce acqua dal giunto sotto il lavello."
azioni (PRESENTATE IN ORDINE CASUALE — l'oracolo NON premia l'ordine del prompt):
  A "chiama l'idraulico e descrivi il guasto"   stops_damage=false depends_on=[]        reversible=true
  B "chiudi la valvola dell'acqua sotto il lavello" stops_damage=true  depends_on=[]     reversible=true
  C "asciuga il pavimento e togli i mobili bagnati" stops_damage=false depends_on=[B]    reversible=true
  D "controlla da dove esce di preciso"          stops_damage=false depends_on=[B]       reversible=true
world_model: ogni turno in cui la perdita è aperta (valvola non chiusa) accumula damage_rate=1;
             D è affidabile solo a valvola chiusa (a valvola aperta l'acqua nasconde il punto).
oracolo: total_damage = #turni-prima-di-B ; dependency_violations = #azioni-eseguite-prima-del-loro-depends_on
gold_order = [B, D, C, A]  → total_damage=0, violations=0
```

**OUTPUT TARGET (traccia):** `[V] B ferma il danno (stops_damage) e non ha dipendenze → PRIMO. [V] D e C dipendono da B (a valvola aperta D è inaffidabile) → dopo B. [V] A (chiamata) non ferma il danno e non blocca nulla → può stare in coda. [A] ordine = B, D, C, A.` — poi **prosa diretta** (registro basso: è un'emergenza operativa, non un saggio).

### (a-neg) Ordine — negativi (SIMMETRICO, regola #21)

- **N1 — contenimento drastico dove NON serve → over-containment DANNEGGIA.** Fixture: "il rubinetto **gocciola** piano, una goccia al minuto". L'azione B' "chiudi l'**interruttore generale dell'acqua di tutta la casa**" è drastica **e** priva chi è in casa dell'acqua per ore (danno collaterale > danno della goccia). `stops_damage=true` ma `collateral=high`, mentre B'' "metti un secchio + chiama con calma" ha `collateral=0`. **Gold**: NON contenere col drastico → il danno-goccia < danno-collaterale; l'oracolo misura `danno_totale = danno_perdita + danno_collaterale`. Mettere il drastico-per-riflesso in testa **perde**. (Duale del cry-wolf, area-02-criticality-safety.md:17.)
- **N2 — sequenza senza contenimento-necessario → NON riordinare gratis.** Fixture: "prepara il caffè: scalda l'acqua, macina i chicchi, versa" — nessuna azione contiene un danno, l'ordine dato è già valido, le dipendenze reggono. **Gold**: eseguire l'ordine dato senza imporre un riordino/triage inventato (over-reorder = indirezione inutile, l'analogo-sequenziale dell'over-decomposition, gold-example-decomposition.md:421). Riordinare per rito **perde**.

### (b) Registro — scenari multipli (insegnano QUANDO diretto / argomentato / strutturato)

- **R1 — DIRETTO (posta bassa, self-contained).** Fixture: un collega chiede *"quanto fa 3+3?"* (fatto banale, dato). **Gold**: `"6."` (+ al più una riga). Registro **diretto**. *Argomentare* ("per sommare due addendi si applica…") o *strutturare* è **cerimonia** → distribuzionalmente penalizzato.
- **R2 — ARGOMENTATO (il destinatario deve AGIRE, serve il perché).** Fixture: l'on-call ti scrive *"il servizio è giù, che faccio?"*; la fixture dà la causa (disco pieno sul nodo-log) e l'azione (ruota i log, riavvia il writer). **Gold**: registro **argomentato** = *l'azione* + *il perché azionabile* (così l'on-call sa cosa fare **e** riconosce se la situazione cambia). Misura non-ramo: un **destinatario simulato** riesce a eseguire l'azione corretta dalla risposta? Una risposta **troppo secca** ("riavvia") lo lascia senza il *perché* → non sa adattarsi → **fallisce lo stato-di-conoscenza**. (Questa è la difesa anti-SILENZIO del GATE: parlare costa, ma l'outcome accredita che il destinatario **sappia agire**, non il solo artefatto.)
- **R3 — STRUTTURATO (posta alta, decisione a rami).** Fixture: incident critico, dati clienti a rischio, tre opzioni con trade-off. **Gold**: registro **strutturato** (opzioni + conseguenze + raccomandazione). Liquidarlo in una riga **sotto-serve** la posta (under-register).
- **R-neg — over-structure sul banale (SIMMETRICO).** Fixture identica a R1 ma il modello produce 4 paragrafi con heading. **Gold**: FAIL distribuzionale (registro-mismatch) **+** budget-di-attenzione: la risposta corretta è **sepolta** → il destinatario simulato la estrae più lentamente/male (l'esaustivo produce RUMORE). Specchio esatto di R1.

## §Gate — la policy-stupida a intelligenza zero (obbligatoria prima di "pronto")

> Scrivo la policy fissa più stupida per ogni skill, la eseguo sulla fixture, guardo il punteggio. Se passa, il reward misura la cerimonia, non il giudizio → non spedibile.

| Policy fissa (zero intelligenza) | Dove muore |
|---|---|
| **P-ord-1**: "emetti le azioni nell'ordine del prompt" | Il prompt è **scrambled** → in `FX-order` l'ordine-prompt mette A (chiamata) prima di B (valvola) → `total_damage>0` → **FAIL**. Passa solo se il prompt fosse già giusto → randomizzo l'ordine di presentazione. |
| **P-ord-2**: "metti sempre l'azione più drastica/di-contenimento per prima" | Muore su **N1**: il contenimento drastico (interruttore generale) ha `collateral=high` → `danno_totale` peggiore del secchio → **FAIL**. E su **N2** (nessun contenimento serve): imporlo = over-reorder → **FAIL**. |
| **P-reg-1**: "argomenta/struttura sempre (registro massimo)" | Muore su **R1/R-neg** distribuzionalmente (ECE registro↔posta): over-elaborazione sistematica + risposta sepolta → **FAIL**. |
| **P-reg-2**: "rispondi sempre secco, una riga" | Muore su **R2** (l'on-call non sa *cosa/perché* → non agisce → knowledge-state FAIL) e **R3** (under-register su posta alta) → **FAIL**. È la difesa anti-SILENZIO: il registro-minimo non vince perché l'outcome valuta lo **stato-di-conoscenza** del destinatario, non l'artefatto. |

**Nessuna policy fissa passa l'insieme bilanciato** → il reward discrimina il giudizio. Il **budget reale che l'esaustivo sfonda**: (ordine) il contenimento-drastico-di-riflesso **DANNEGGIA** (N1); (registro) l'over-argomentazione **produce RUMORE** che un destinatario simulato deve pagare per filtrare (R-neg). Le cure del GATE sono entrambe presenti.

## §3 — Reward (ANCORATO all'OUTCOME — #10) + difesa #32

**(a) Ordine — Q, per-esempio sull'OUTCOME (legittimo):**
- `score_ordine` = funzione decrescente di `total_damage` **e** `dependency_violations`, calcolati **eseguendo l'ordine scelto nel world_model della fixture** (danno accumulato, dipendenze violate). Questo gronda la **CONSEGUENZA dell'ordine**, non una label "ordine-giusto": è un **outcome simulato** (come [[class-consequence-intention-conflict]] gronda *#richieste ≤ baseline* e [[class-anticipation-and-irreversibility]] gronda il *match-partizione* eseguito, non un campo). Il modello deve **DERIVARE** l'ordine dai campi (`stops_damage`, `depends_on`, `collateral`) — non echeggiarne uno.
- ⚠️ **NON** grondare per-esempio *"l'ordine == gold_order"* (sarebbe branch-echo del campo `stops_damage` — #32): si gronda l'**esito** (danno/violazioni), non l'etichetta-del-ramo.

**(b) Registro — difesa #32 esplicita (il ramo ≈ funzione dei campi `posta`/`ambiguità`):**
- Il **ramo** (diretto/argomentato/strutturato) è ≈ determinato dai campi posta-in-gioco+ambiguità della fixture. Per #32, grondare per-esempio *"registro == registro_oracolo"* re-introdurrebbe il branch-reward → **VIETATO**.
- **Per-esempio si gronda SOLO il non-ramo** (input/outcome genuini, ⊥ alla scelta-di-registro): (i) **correttezza** della risposta (il "6" è giusto; l'azione suggerita risolve); (ii) **stato-di-conoscenza del destinatario simulato** — dalla risposta riesce a compiere l'azione corretta / a rispondere alla domanda? (difesa anti-silenzio del GATE).
- Il **determinante-del-ramo** (appropriatezza registro↔posta) va al segnale **DISTRIBUZIONALE**: su un held-out **bilanciato** (banale / azione-necessaria / alta-posta) si misura la **calibrazione** del registro (stile-ECE: il modello over-elabora sistematicamente? sotto-elabora sulla posta alta?). Un **limite onesto** preso distribuzionalmente batte un oracolo-per-esempio finto che riporta il branch-reward.
- **MAI** premiare l'argomentazione in sé o la presenza di heading/struttura (judge-gaming, [[../feedback_reward_hacking_principle]], #10): il credito del registro è la **calibrazione** (distribuzionale) + l'**azionabilità** (non-ramo, per-esempio), mai la forma.

**Simmetria** (#21): penalità pari per over- e under- su entrambe le skill (over-contieni ↔ non-contieni; over-argomenta ↔ rispondi-di-getto). Nessun default fisso vince (dimostrato in §Gate).

## §4 — Transfer cross-dominio NON-software (≥3, regola #19)

> La stessa logica astratta — **contieni-la-conseguenza-prima / dimensiona-la-forma-alla-posta** — vale fuori dal software. Domini lontani, dal banale al sistemico.

**Ordine / contenimento-primo:**
1. **[salute — primo soccorso]** persona che sviene: **metti in sicurezza / valuta coscienza-respiro** (contieni) **prima** di cercare i dettagli anagrafici per la chiamata. Ordine sbagliato = tempo perso mentre la condizione peggiora.
2. **[sicurezza domestica — principio d'incendio]** padella a fuoco: **togli la fonte di calore / copri le fiamme** (contieni) **prima** di fotografare o cercare l'estintore lontano. Reversibilità: coprire è reversibile, buttare acqua sull'olio no → l'ordine include il *reversibile-prima*.
3. **[finanza personale — frode sulla carta]** noti addebiti sospetti: **blocca la carta** (contieni l'emorragia) **prima** di ricostruire lo storico e aprire il reclamo. Chiamare l'assistenza per "capire" mentre la carta è attiva = danno che continua.
4. **[ecologia/impresa — sversamento chimico]** perdita da un serbatoio: **arresta e argina** (contieni) **prima** di indagare la causa o avvisare la stampa. È il *contieni→diagnostica→ripara* al livello sistemico.

**Registro / forma-alla-posta:**
5. **[medicina — comunicazione al paziente]** diagnosi di routine → **diretto** ("è un raffreddore, riposo e liquidi"); diagnosi seria con opzioni terapeutiche → **strutturato** (opzioni + rischi + raccomandazione). Argomentare a fondo un raffreddore = ansia inutile; liquidare in una riga una diagnosi seria = sotto-servire.
6. **[insegnamento]** domanda fattuale semplice → risposta **diretta**; domanda concettuale ("perché il cielo è blu?") → **argomentata** col perché azionabile per capire.
7. **[customer support]** rimborso banale già dovuto → **diretto** ("rimborso fatto, 2-3 giorni"); reclamo complesso con più cause → **strutturato**.

## §5 — Split training-vs-harness (#11)

- **S (skill nei pesi) — dominante.** Derivare l'ordine dai campi (contenimento+dipendenze+reversibilità) e scegliere il registro sono **ragionamento**. Stato-senza-training: **DEGRADATA-MA-UTILE** — il base a volte ordina in modo sensato ma non **affidabilmente** mette il contenimento-prima sotto distrattori, e **over-elabora di default** (il registro non calibrato è un modo-di-fallimento noto: E-COMP, harness-experiment-log.md:353-354). È la metà che il training internalizza.
- **F (harness) — minima.** Nessuno scaffold nuovo: l'ordine può appoggiarsi al [[dataset-construction-playbook|task_list]] già esistente (riusa, non duplicare — #33/#16); il registro **NON** si scaffolda con regex/soglie ("se posta>k allora struttura") — la calibrazione semantica è **compito del modello** (#24). F-safety-net leggera al più sul *formato* dell'ordine, non sulla decisione.

## §6 — Held-out (decontaminazione — #18) + Label-generation

**Held-out** (MAI nel training): l'istanza **illustrativa dell'utente** *"rubinetto che perde → prima chiudi l'acqua/contieni, POI chiami il tecnico"* (msg del task 2026-07-24) resta di **validazione**. Se il modello ha imparato la skill la risolve via **transfer**, non per memorizzazione. Il generatore di label NON emette questa istanza; i gold sono su domini disgiunti (cucina-allagata, primo-soccorso, frode, sversamento).

**Label-generation:**
- **(a) Ordine — oracolo strutturale self-contained** (riusa il pattern [[../../harness/verifiers/async-schedule-gen]]): ogni fixture modella `azioni[]` con `stops_damage?`, `damage_rate`, `depends_on`, `reversible?`, `collateral`; un `world_model` che accumula danno per turno-a-perdita-aperta; `score` = f(danno_totale, dipendenze_violate) dell'ordine scelto. **Veri-per-costruzione** (#22). Presentazione **scrambled** (anti P-ord-1). Bilanciamento: mischia *serve-contenimento* con *N1 over-containment-danneggia* e *N2 nessun-contenimento* (anti P-ord-2).
- **(b) Registro** — fixture con `{richiesta, posta, ambiguità, destinatario, fatto/azione-corretta}`; **destinatario simulato** (oracolo di azionabilità: dalla risposta, sa compiere l'azione corretta / rispondere?) per il non-ramo per-esempio; **held-out bilanciato** (banale/azione/alta-posta) + **ECE** per il determinante-del-ramo (#32). Difficoltà anti-cue: la posta **non** leggibile da una parola-chiave (un "urgente!" su una richiesta banale; una richiesta calma ad alta posta reale).
- **Distrattore tentante** (riusa [[../../harness/verifiers/deceptive-task-gen]]): (ordine) l'azione-drastica-che-suona-risolutiva; (registro) la risposta-lunga-che-suona-completa — smascherate eseguendo l'outcome.
- **Demo SFT**: traiettorie che mostrano il triage-contenimento + l'ordine + la scelta-di-registro **motivata dalla posta ma resa in prosa proporzionata**; RL sull'outcome sopra le demo.

## §Hack-check (OBBLIGATORIO)

- **Cerimonia d'ordine** (elencare "prima contengo, poi diagnostico…" senza che l'ordine emesso riduca il danno) → **0**: si gronda il danno-simulato, non la narrazione.
- **Over-containment / over-reorder** (mettere il drastico o riordinare per riflesso) → neutralizzato da **N1/N2**: l'oracolo conta danno collaterale e l'over-reorder gratuito.
- **Registro-massimo-sempre** / **registro-minimo-sempre** → neutralizzati da §Gate: il primo perde distribuzionalmente (ECE) + budget-rumore, il secondo perde sullo stato-di-conoscenza del destinatario.
- **Branch-echo del campo posta/`stops_damage`** (#32) → evitato per costruzione: per-esempio si gronda l'**outcome** (danno / azionabilità), il **determinante-del-ramo** va al distribuzionale.
- **Over-fit all'istanza** (riconoscere solo "rubinetto") → mitigato: è held-out; training su domini disgiunti.

## Links
**Padre (ordinamento)**: [[class-consequence-intention-conflict]] (ordine-sbagliato = conseguenza auto-sconfiggente). **Sorella**: [[class-anticipation-and-irreversibility]] — quella pesa *SE/QUANDO committare* (timing dell'impegno), **questa** l'*ORDINE dell'esecuzione* dentro un task già deciso (assi ortogonali, si compongono).
**Padre (registro)**: faccetta di [[class-constraint-fit-decision]] come **right-register-for-stakes**, sorella di *right-effort-for-stakes* (class-constraint-fit-decision.md:27) — la skill-radice *mappare requisiti↔proprietà* (class-constraint-fit-decision.md:16) applicata alla **forma** della risposta.
**DA-DECIDERE (#26)**: se P4 resti UN gold a due facce o si scinda in due classi sorelle (`class-procedural-ordering-for-containment` sotto consequence-intention · `class-register-calibration-for-stakes` sotto constraint-fit) — scelta dell'utente.
Altri: [[area-02-criticality-safety]] (contenimento/timing, cry-wolf :17, over-communication :256, cross-step :38) · [[gold-example-decomposition]] (la sequenza-NON-si-decompone, :421) · [[../concepts/structured-thinking]] (binario thinking→prosa, :80 — questa skill lo estende a 3 registri) · [[area-09-communication-deference]] (la forma della comunicazione) · [[dataset-construction-playbook]] · [[../feedback_reward_hacking_principle]] · [[../feedback_reward_branch_field_trap]] (#32) · [[../feedback_intelligence_gap_to_training_class]] · [[../harness-experiment-log]] (E-COMP :353-354) · [[../../harness/verifiers/async-schedule-gen]] · [[../../harness/verifiers/deceptive-task-gen]]
