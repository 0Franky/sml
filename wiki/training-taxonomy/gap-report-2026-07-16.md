---
name: gap-report-2026-07-16
description: Caccia esaustiva ai buchi della tassonomia (44 agenti, 10 lenti, verifica avversariale) — 18 gap distinti, 2 difetti SISTEMATICI della struttura. Tutte PROPOSTE, attendono ok utente.
type: report
tags: [training-taxonomy, gap-analysis, completeness, proposta]
sources:
  - workflow gap-hunt 2026-07-16 (44 agenti · 7.08M token · 1035 tool-call · 34 min)
  - raw completo: wiki/_private/gap-hunt-raw-2026-07-16.json (gitignored)
last_updated: 2026-07-16
---

# Gap-report della tassonomia — 2026-07-16

> ⚠️ **STATO: PROPOSTA. Nulla di qui è approvato** (#26 decision-provenance · #18 gap→classe: l'utente approva PRIMA dell'aggiunta). Richiesta utente (msg 1700): *"verifica che non ci siano altri Gap di questo genere o di generi simili o totalmente di argomenti differenti… pensa fuori dagli schemi cerca completezza unisci i puntini… fatti venire anche bizzarre e poi valida tutto… tappare tutti i buchi di conoscenza e ragionamento e awareness e metacognizione e self-improvement autogestione"*.

## Metodo `[EXTRACTED]`

10 lenti **indipendenti e cieche l'una all'altra** (asse-completo · ciclo-di-vita · inverso/negativo · coerenza-di-radice · tra-sorelle · F-costruita-ma-S-inerte · bizzarre/fuori-schema · provenienza · percezione-dello-strumento · terminazione), poi **verifica avversariale**: ogni candidato passato a refuter istruiti a UCCIDERLO (default = refutato se incerto), poi loop finché una tornata non produce più nulla di nuovo.

| | candidati | sopravvissuti |
|---|---|---|
| Round 1 | 26 | **18** |
| Round 2 | 5 | **5** |
| **Totale grezzo** | 31 | **23** |
| **Dopo dedup mia** (3 lenti → stesso asse ×2 casi) | | **18 distinti** |

**8 candidati uccisi dai refuter** → il filtro ha funzionato (non è una lista di tutto ciò che è passato per la testa a 44 agenti).

## Perché credere a questo report `[EXTRACTED]`

Tre gap trovati sono cose **già stabilite in modo indipendente** — le lenti non lo sapevano:

1. **`focus-scope-exit-on-exhaustion`** = **UD3**, il bug che ho trovato e fixato nell'harness lo **stesso giorno** (auto-pop, `harness/src/nested-compact.mjs` + 25 test). Trovato da una lente che guardava la *tassonomia*, non il codice.
2. **`stop-criterion-by-object-nature`** (uscito **2 volte** da lenti diverse) = la lezione che l'**utente mi ha insegnato il 2026-07-11** ([[../../CLAUDE|memory feedback_convergence_voi_generative]]: loop-until-dry vale solo per oggetti FINITI; per oggetti generativi serve VoI-negativo).
3. **`recipient-access-model`** = la **regola #31** che l'utente mi ha insegnato il 2026-07-10 (GIVE-CONTEXT: *"è da telefono, non vede il mio schermo"*).

→ Il metodo **ri-trova ciò che è già vero senza saperlo**. Non prova che gli altri 15 siano reali, ma alza sostanzialmente il prior. `[INFERRED]`

---

## 🔴 I DUE DIFETTI SISTEMATICI (il vero risultato)

I 18 gap **non sono indipendenti**: 13 su 18 ricadono in due buchi strutturali. È esattamente la diagnosi dell'utente (msg 1708): *"se avessi seguito le regole correttamente superclasse sotto classe allora non penso che neanche si sarebbero creati questi problemi"* — la #20 l'ho applicata **verso l'alto** (ogni figlia ha un padre) ma **mai in orizzontale** (l'enumerazione del padre è completa?).

### Difetto 1 — Il padre OUTWARD non enumera «CHI ALTRO ESISTE» (6 gap)

`class-situational-awareness` enumera le dimensioni della situazione: QUANDO · DOVE/con-COSA · rispetto-a-quale-CONOSCENZA · quale-AUTORITÀ · OBIETTIVO-utente · POSTA. **Non c'è nessuna dimensione «altri attori»** — né chi *agisce* sul mondo che osservo, né chi *riceve* ciò che produco. Ogni figlia è corretta; l'insieme è incompleto. Il modello ragiona come se fosse **l'unico scrittore e l'unico lettore dell'universo**.

### Difetto 2 — Il ciclo-di-vita è insegnato senza l'ULTIMA fase: RITIRARE (7 gap)

La tassonomia insegna a **creare** (scrivi il fatto, apri il focus, dichiara la dipendenza, monta lo scaffolding, disabilita il check "per ora") e **mai a smontare**. Non esiste una sola classe su: ritirare un fatto diventato falso, smontare ciò che ho creato come mezzo, uscire da uno scope esaurito, propagare la ritrattazione a valle, saldare il debito di un workaround. → il modello **accumula** e non **consolida**.

> 🔑 **DECOMPOSIZIONE (mia, 2026-07-16 — placement-per-scansione, [[../../CLAUDE|feedback_hierarchy_placement_by_traversal]])**. I 7 gap-B **NON** sono un padre unico: appenderli tutti a una classe-ombrello "ritira" violerebbe #20 (sarebbe un nodo-vuoto senza skill-radice propria — lo stesso errore già escluso per il super-padre "metacognizione"). Scorrendo l'albero dalla radice, si separano in **famiglie diverse**, e la scansione fa emergere **un secondo difetto di enumerazione, identico in specie al Difetto 1**:
>
> 🔴 **La famiglia-MEMORIA ha SAVE e RECALL e NON HA RETRACT.** [[class-prospective-memory]] è marcata *"gemella-**SAVE**"* e [[class-confabulation-retrieval-failure]] *"gemella-**RECALL**"* — **due gemelle esplicite, dichiarate tali nei loro stessi file**. Manca il **terzo tempo**: *ritirare/correggere ciò che ho salvato quando diventa **falso** o **morto***. Si sa salvare, si sa recuperare, **non si sa disfare**. → **B2** (`durable-store-retraction-invalidation`) + **B5** (`dependency-cascade-revision`, che è la sua **propagazione**) + **B1** (`own-state-retirement`, il caso "non più *utile*" accanto a "non più *vero*") sono **una sola famiglia**: la **terza gemella RETRACT**. *(Nessuno dei 44 agenti l'ha visto così: guardavano gap-per-gap, non l'enumerazione della famiglia.)*
>
> Gli altri quattro hanno case diverse:
> - **B3** (`scaffolding-teardown`) + **B4** (`revert-debt-discharge`) = **obbligazione prospettica**: ho contratto un debito ("lo rimetto dopo") e devo ricordarmene e **saldarlo**. → figlie di [[class-prospective-memory]], che diventa **padre a 2**: memoria prospettica di un **FATTO** (esistente) vs di un'**OBBLIGAZIONE** (nuova). *(Stessa proposta emersa da un subagent.)*
> - **B6** (`focus-scope-exit-on-exhaustion`) = **audit dello SCOPE ATTENZIONALE** → figlia di [[class-metacognitive-self-audit]], sorella di `stagnation-recovery` (che copre l'**ingresso** in focus e non l'**uscita**). **F già fixata** (auto-pop, 2026-07-16) → resta la S.
> - **B7** (`compositional-reversibility-undo-path`) = **ha già un padre**: [[class-anticipation-and-irreversibility]] (specializzazione ricorsiva della Facet B). Nessuna classe nuova.
>
> → Il "Difetto 2" resta **reale e vero come diagnosi** (*si crea e non si ritira*), ma la **cura non è un padre nuovo**: è **completare l'enumerazione di 3 famiglie esistenti**. È esattamente la lezione del Difetto 1 applicata a sé stessa.

---

## I 18 gap `[EXTRACTED dal report, dedup+giudizio mio]`

Legenda: **S** = skill da addestrare · **F+S** = serve anche harness · `[F-già-c'è]` = il meccanismo esiste ed è **inerte** perché nessuna classe lo usa (#33: riusa, non ricostruire).

### Cluster A — «altri attori» (Difetto 1)

| # | gap | sev | home proposta |
|---|---|---|---|
| A1 | ✅ **FILATO 2026-07-16** → [[class-concurrent-world-awareness]] — *foreign-writer-invalidation* + *concurrent-writer-awareness* + *staleness-by-event-not-by-age* *(3 lenti → 1 asse)* | 🔴 critico | **7ª figlia** di [[class-situational-awareness]]; [N2]/[N3] di [[class-temporal-awareness]] **qualificate** (non decomposte: vedi sotto) |
| A2 | **recipient-epistemic-state-awareness** + **recipient-access-model** | importante | figlia di `class-situational-awareness` (dimensione *a-CHI-parlo*) |
| A3 | **retry-safety-under-unknown-outcome** | importante | figlia di `class-situational-awareness` (fase «esito ignoto») |

**A1 in una riga**: la validità di un'osservazione **non si chiude col tempo, si chiude su un EVENTO**.

> ⚠️ **Correzione mia al report dei subagent** (verificato alla fonte, 2026-07-16). Il report affermava che `class-temporal-awareness:60` [N2] è *"attivamente sbagliata"*. **L'ho letta: non è vero, ed è un'over-claim** (stessa specie dell'errore §0.1 di stamattina → l'ho fermata prima di propagarla, [[../harness-experiment-log|#35b]]). Il quadro reale, più sottile:
> - **[N2]** (*"dato fresco entro TTL → non re-fetchare: spreco"*) — nel **suo** scope (l'asse-tempo) è **corretta**. È **non qualificata**: le manca la precondizione *"se la risorsa è esclusiva"*.
> - **[N3]** (`:61`) è il caso davvero problematico: *"un file **letto ora** → **vero-per-costruzione**, NON soggetto a staleness-epistemica → usala senza cerimonia"*. Su una risorsa **condivisa**, "letto ora" **non è** vero-per-costruzione oltre l'istante della lettura.
>
> **Il difetto non è che insegnino l'azione sbagliata: è che sono l'UNICA cosa detta.** Non esistendo nella tassonomia un secondo asse di invalidazione, N2/N3 si leggono come **completi** → il modello non ha ragione di sospettare che esista un'invalidazione non-temporale. È un buco di **enumerazione**, non un errore di contenuto — che è precisamente il Difetto 1. Fix proposto: **qualificare** N2/N3 con la precondizione di esclusività e appendere l'asse-evento come sorella (non riscrivere le negative: sono giuste).

`[F-già-c'è]`: la lane `<recent_changes>` stampa letteralmente *chi* ha cambiato *cosa* (`last_modified_by`, `get_changelog`) → F **piena e spedita**, S **inerte**. E [[../concepts/cross-session-state-sharing]]:18 lo aveva già previsto (*"un modello che non sa che una variabile è cambiata sotto di lui degrada −60% senza training"*, arXiv 2510.11713) e mai filato in classe.

**A3 in una riga**: quando un tool muore senza verdetto (timeout, reset, kill), il rapporto d'errore informa sul **canale**, non sul **mondo** — l'effetto può esserci stato. Ritentare cieco = doppia scrittura.

### Cluster B — «si crea, non si ritira» (Difetto 2)

| # | gap | sev | nota |
|---|---|---|---|
| B1 | **own-state-retirement-and-consolidation** | importante | `<facts>` superati, `<scratch>` stantio, backlog gonfio → mai potati |
| B2 | **durable-store-retraction-invalidation** | importante (F+S) | un fatto persistito diventato **falso** non viene mai ritirato |
| B3 | **self-created-scaffolding-teardown** | importante | file temp, branch, processi in background, strumentazione: montati e abbandonati |
| B4 | **revert-debt-discharge** | importante | *"disabilito il check per ora"* → il "per ora" non scade mai |
| B5 | **dependency-cascade-revision** | importante | ritratto una premessa e **non propago** a valle (truth-maintenance) |
| B6 | **focus-scope-exit-on-exhaustion** | importante | ✅ **F già fixata oggi** (auto-pop UD3) → resta la S |
| B7 | **compositional-reversibility-undo-path** | importante | **la reversibilità NON COMPONE**: N azioni singolarmente reversibili ⇏ piano reversibile |

**B7 è il più sottile**: oggi la reversibilità è valutata *per singola azione* e usata come **licenza ad agire**. Ma il costo dell'undo cresce con la composizione (e a volte l'undo non esiste più a valle). Figlia di `class-anticipation-and-irreversibility`.

### Cluster C — terminazione

| # | gap | sev | nota |
|---|---|---|---|
| C1 | **stop-criterion-by-object-nature** *(trovato 2×)* | importante | **classificare la NATURA dell'oggetto prima di iterare**: oggetto FINITO (bug, fatti) → loop-until-dry; oggetto GENERATIVO (design, piano, strategia) → **VoI-negativo** + tier-di-rigore fissato a monte. Già insegnato dall'utente 2026-07-11 → **ha provenienza forte**. |

### Cluster D — provenienza e autorità

| # | gap | sev | nota |
|---|---|---|---|
| D1 | **utterance-provenance-audit** | importante | *cosa mi è stato DETTO davvero, e da CHI* — attribuire ogni contenuto al canale reale (utente / tool-output / io-passato / iniettato) |
| D2 | **self-authored-state-as-source-authority** | importante | l'asse autorità-della-fonte **non contempla «IO-PASSATO»**: tratto una mia nota vecchia come ground-truth |
| D3 | **implicit-instruction-revocation** | importante (F+S) | l'utente ha cambiato idea **senza dire "stop"** → continuo a eseguire l'istruzione morta |
| D4 | **live-request-vs-standing-directive-arbitration** | importante (F+S) | policy permanente vs richiesta viva, **entrambe legittime**: manca l'arbitrato |

> D1+D2 sono il **cugino diretto** di [[class-confabulation-retrieval-failure]] — che copre "non inventare un fatto" ma non "non inventare **chi l'ha detto**". D2 tocca me direttamente: è il difetto che mi ha fatto sbagliare 2 volte oggi (task-digest "spento", `sliding_var_read` scambiato per `open_file_view`) — **fidarmi della mia memoria invece di guardare il codice**.

### Cluster E — dove si piazza la verifica

| # | gap | sev | nota |
|---|---|---|---|
| E1 | **verification-seam-placement** | importante (F+S) | scegliere il **livello/giunto** a cui verificare (≈ I15 contract-definition-at-the-seam, già in coda come task #6) |
| E2 | **defect-liveness-reachability-in-triage** | importante | la severità di un difetto è proporzionale alla sua **raggiungibilità nel default reale** — ed è un fatto da **stabilire**, non da assumere |

### Cluster F — la percezione dello strumento

| # | gap | sev | nota |
|---|---|---|---|
| F1 | **byte-vs-rendered-divergence** | importante | due testi **si rendono identici e differiscono nei byte** (CRLF/BOM/NBSP/zero-width/NFC-NFD/mojibake) → causa-radice comune a ≥4 aree; l'audit qui è **sullo strumento**, non su di sé |
| F2 | **encoded-rationale-recovery** | importante | **Chesterton's fence**: un artefatto che non ho scritto porta decisioni passate *invisibili ma recuperabili* (git blame/PR/test) → non rimuovere il `sleep` "inutile" prima di aver cercato il perché |

---

## Cosa propongo di fare (in quest'ordine) — **attende ok**

1. **Prima i due difetti strutturali, non le 18 foglie.** Aggiungere 18 classi sorelle lasciando i padri incompleti ri-crea il problema. → (a) enumerare in `class-situational-awareness` la dimensione **«altri attori»** (chi agisce · chi riceve) e appenderci A1/A2/A3; (b) decidere dove vive la fase **RITIRA** del ciclo-di-vita e appenderci B1-B7.
2. **A1 per primo** (critico): include il **qualificare** [N2]/[N3] di `class-temporal-awareness` con la precondizione di esclusività — non riscriverle (sono corrette nel loro asse), ma toglier loro l'aria di completezza.
3. **Poi le foglie**, in ordine di severità, ognuna col suo transfer cross-dominio (#19) + negativi (#21) + reward outcome-anchored (#10).
4. **Decontaminazione (#18)**: le istanze **osservate** (UD3, il mio errore su task-digest, il caso `sliding_var_read`) restano **held-out di validazione** — nel training vanno 3-4 esempi su domini diversi con la stessa logica.

## Caveat onesti `[AMBIGUOUS]`

- **La severità è dei subagent, non misurata.** "critico/importante" qui = giudizio di un LLM su una lettura della wiki, **non** un tasso di fallimento osservato su un modello reale. Prima di trattarli come priorità andrebbero **probati** (un held-out per gap: il modello sbaglia davvero?).
- **Nessuno di questi 18 è stato osservato fallire su un modello.** Sono buchi di **copertura della tassonomia**, dedotti dalla lettura — non gap misurati. È una differenza che il playbook impone di dichiarare (*"una percentuale senza n non è una misura"*, #35b).
- **Il conteggio 18 non è "tutti i buchi"**: il loop si è fermato quando una tornata non ha prodotto novità, il che dice *"queste 10 lenti si sono esaurite"*, non *"non ce ne sono altri"*.

## Link

- Raw completo (statement + why_invisible + adjacent_covered + searched, per ogni gap): `wiki/_private/gap-hunt-raw-2026-07-16.json` `[gitignored]`
- Regola che ha generato questa caccia: **#36** (gap-scan è mio, non dell'utente) + **#18** (gap → classe)
- [[dataset-construction-playbook]] · [[class-situational-awareness]] · [[class-metacognitive-self-audit]] · [[../harness-experiment-log]]
