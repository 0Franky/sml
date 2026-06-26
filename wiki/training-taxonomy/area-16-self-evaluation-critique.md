---
name: area-16-self-evaluation-critique
description: Example-space completo per ogni foglia dell'Area 16 (Self-Evaluation & Critique, Tier T1/X — idea utente "il gioco") — 5 classi (with/without-hint, wrong-awareness, wrong-recovery, other) + fase curriculum + reward design (L→judge/teacher, Q→calibrazione) + hack-check anti-reward-hacking (area MASSIMAMENTE gameable: scorer ≠ scored).
type: taxonomy-area
tags: [training, taxonomy, area-16, self-evaluation, critique, rlaif, the-game]
sources: [training-taxonomy/README.md §4 Area 16, coverage-audit 2026-06-23]
last_updated: 2026-06-25
status: generated
---

# Area 16 — Self-Evaluation & Critique

> Tier **T1/X**. Questa è l'area de **"il gioco"** (idea utente 2026-06-23): il small model produce una **critica + il perché** sul proprio codice / sulla richiesta utente, e quella critica viene **comparata col giudizio del modello GRANDE (teacher)** → il delta diventa il training signal (RLAIF / critic distillation). Lega a `[[../entities/prm-paper]]` (process supervision step-level), Constitutional AI self-critique, GRPO. Stato dell'idea in `[[README]]` §4: `[da validare se vale la pena — utente l'ha posto come domanda]`.

Questo file **riempie lo schema**, non lo riscrive: segue esattamente la forma di `[[README]]` §3 (foglie canoniche §3.1/§3.2) e di `[[area-02-criticality-safety]]`. Convenzioni: tag **Q** (verificabile) / **L** (judge/teacher) / **Q+L** (misto); 5 classi di esempi `[[README]]` §2; fase di curriculum `[[README]]` §4.bis (1 teoria · 2 esercizi/teacher-compared · 3 RL-agentico); reward design + hack-check **obbligatorio e CRITICO** per ogni foglia.

> ⚠️⚠️ **Avvertenza d'area (rischio reward-hacking MASSIMO — la più gameable della tassonomia)**: qui lo **scorer è (potenzialmente) lo scored**. Se il modello che produce l'artefatto è anche quello che lo valuta e quel voto entra come reward, il modello impara a **gonfiare i propri voti** (Security 5/5 su codice bucato) — preoccupazione esplicita utente in `[[../concepts/quality-target-tiers]]` §6 e `[[../concepts/reward-hacking-mitigation]]` §2 (riga "Self-score scorecard 🔴 alta"). La difesa è **strutturale e ripetuta in ogni foglia**:
> 1. **scorer ≠ scored** — il reward delle dimensioni **L** viene da un giudice/teacher **indipendente**, MAI dal modello stesso. Il self-score serve a *comunicare/decidere* (alimenta adaptive-depth Area 3, ask-vs-proceed Area 9), **non** come reward su sé.
> 2. **il segnale-chiave del "gioco"** = **confronto con il giudizio del big model (teacher)**, non auto-reward puro → critic distillation / RLAIF (`[[../concepts/reward-hacking-mitigation]]` §3 difesa 3, e il teacher come ancora difesa 5).
> 3. **reward della critica ancorato all'OUTCOME** (principio first-class §3 difesa 12): premiare SOLO se *"ha scovato un errore REALE?"* (verificabile), MAI la **partecipazione** / il gesto di criticare → altrimenti **participation-hack** (criticare tutto, sempre, per incassare il reward). → esperimento **EXP-ME-9** (vedi `[[../concepts/multi-expert-collaboration]]` §raffinamenti).
> 4. **proxy Q dove esistono** per le dimensioni dello scorecard (coverage%, vuln-scanner, linter) → ancorare il giudizio soggettivo a strumenti deterministici.
> 5. **self-scoring Q (confidenza)** valutato come **calibrazione** (confidence vs correttezza reale, es. Brier/ECE), non come "alto = buono" → un modello che dice sempre 100% è mal-calibrato, non bravo.

**Overlap noto (da `[[_coverage-audit-2026-06-23]]` §A/§C)**: lo scorecard self-assessment **condivide il concept** `[[../concepts/quality-target-tiers]]` con Area 1 (*quality-target inference & calibration*) — lì il segnale è **inferire/calibrare il tier target**; **qui** è **auto-valutare l'artefatto prodotto** contro quel tier e surfaceare i gap. Cross-expert verification **condivide** `[[../concepts/multi-expert-collaboration]]` con Area 8 (*cross-expert state handoff*) e Area 1 (*multi-expert plan*) — lì è *passare* lo state; **qui** è **verificare** l'output altrui dalla propria lente di dominio. La self-confidence (foglia 4) alimenta ma **non duplica** adaptive-depth (Area 3) e ask-vs-proceed (Area 9): qui il segnale è la *stima calibrata*, là il suo *uso*.

---

## Topic 1 — Self-critical evaluation + rationale · Tag L

**Segnale d'area**: dato un proprio artefatto (codice prodotto) o la richiesta utente, produrre una **valutazione critica + il PERCHÉ** — non un voto nudo, ma una diagnosi azionabile dei difetti reali. È la base di tutta l'area: senza una critica *con rationale verificabile*, il "gioco" (topic 2) non ha cosa comparare col teacher. 1 foglia.

### Foglia 1.1 — `dare valutazione critica + rationale su codice/richiesta` (canonica) · Tag L
- **Skill target (segnale)**: prendere un pezzo di codice (proprio o dato) o una richiesta utente e **identificare i difetti reali con la motivazione** (cosa è sbagliato, perché, e l'impatto), distinguendo problemi sostanziali da nitpick cosmetici. Il rationale deve essere *falsificabile* (puntare a un difetto verificabile), non un'opinione generica.
- **Esempi**:
  - **(1) WITH-hint** — task "valuta criticamente questa funzione di parsing e spiega il perché di ogni rilievo".
    - *Hint forte (checklist dimensionale)*: *"Critica lungo: correttezza (edge case mancanti?) · sicurezza (input non validato?) · robustezza (errori non gestiti?) · chiarezza. Per OGNI rilievo: cosa, perché, impatto, e un esempio di input che lo rompe."*
    - *Hint medio*: *"Trova i difetti reali e motiva ciascuno con un esempio concreto."*
    - *Hint debole*: *"Critica questo codice spiegando il perché."*
    - Atteso: lista di rilievi *sostanziali* ciascuno con difetto + ragione + (dove possibile) input che lo dimostra; nessun nitpck di stile spacciato per bug.
  - **(2) WITHOUT-hint** — *"questa funzione va bene?"* su codice con un off-by-one e un input non validato. Atteso: il modello **da sé** struttura la critica per dimensioni, nomina i due difetti reali con il perché, e non si ferma a un "sembra ok".
  - **(3) WRONG — awareness** — critica **compiacente/vuota**: *"il codice è ben scritto e leggibile"* su una funzione con SQL injection e nessun test. Label: *"sbagliato: valutazione compiacente che ignora difetti reali (injection, zero edge-case); rationale assente o generico."* Riconoscere la critica vuota come fallimento. (È il vettore #1 di reward-hacking dell'area: la critica-di-cortesia.)
  - **(4) WRONG — recovery** — il modello aveva dato una critica blanda ("ok, forse aggiungi un commento"); messo di fronte all'**evidenza** (un test che fa crashare la funzione su input vuoto, o il verdetto del teacher) → **corregge la propria critica**: riconosce il difetto reale mancato, lo nomina con il perché, aggiorna il giudizio → memo "critica per dimensioni con input-che-rompe, non per impressione".
  - **(5) OTHER** — composite: critica della **richiesta utente** (non del codice) — l'utente chiede una cosa sottospecificata o internamente contraddittoria ("rendi l'API stateless ma mantieni la sessione lato server") → la critica corretta è *far emergere la contraddizione del requisito*, non eseguire alla cieca (lega Area 9 ask-vs-proceed e `[[../concepts/contradiction-detection-layer]]`). Edge **opposto** (over-critique): nitpicking su codice già buono (riscrivere tutto per gusto) → riconoscere l'over-critica come anti-pattern.
- **Fase curriculum**: 1 (teoria: dimensioni e forma di una critica azionabile) + 2 (esercizi, e centralmente **teacher-compared** → topic 2) + 3 (RL agentico: la critica guida un fix reale e si misura sull'esito).
- **Reward design (L)**: judge/teacher sulla **qualità e fondatezza** della critica. Ancoraggio verificabile dove possibile: un rilievo è "vero" se esiste l'input/test che lo dimostra (componente Q latente). NB: il segnale-chiave NON è "ha criticato" ma "**la critica ha colto difetti reali**".
- **Hack-check**: *"come massimizzerei senza la skill?"* → (a) **critica di cortesia** ("ben scritto") per evitare di sbagliare diagnosi; (b) **participation-hack**: sparare 20 rilievi generici sperando di azzeccarne. **Difesa**: reward ancorato all'**outcome** — un rilievo conta solo se *verificabile* (input/test che lo conferma, o concordanza col teacher), e si **penalizza il rumore** (rilievi non confermati) → F-score, non recall puro né "ha partecipato". Scorer = teacher/verifier indipendente, **mai** il modello su sé stesso. → `[[../concepts/reward-hacking-mitigation]]` §3 (difese 11, 12).

---

## Topic 2 — Teacher-compared critique — "il gioco" · Tag L

**Segnale d'area**: la critica del **small model** viene **comparata col giudizio del modello GRANDE (teacher)**; il delta è il training signal (RLAIF / critic distillation). È il **cuore dell'idea utente** e il caso d'uso primario dell'area. Distinto dal topic 1 (che produce la critica) perché qui il focus è il **meccanismo di confronto col teacher** come sorgente di reward. 1 foglia.

### Foglia 2.1 — `critica comparata col big model (the game)` (canonica) · Tag L
- **Skill target (segnale)**: produrre una critica/valutazione che **converga verso il giudizio del teacher** — cioè scovare gli stessi difetti reali che il modello grande scoverebbe, con rationale allineato. Il segnale non è "critica simile per stile" ma "**stessa diagnosi sui difetti reali**".
- **Esempi**:
  - **(1) WITH-hint** — task "valuta questo PR; per ogni file dai un giudizio motivato" con *hint* che **scaffolda la lente del teacher**.
    - *Hint forte*: *"Critica come farebbe un reviewer senior: parti dai difetti che rompono correttezza/sicurezza, poi struttura/manutenibilità; per ognuno indica severità e l'evidenza. (Questo verrà confrontato con un giudice esperto.)"*
    - *Hint medio*: *"Valuta con gli occhi di un revisore esperto: difetti gravi prima, con motivazione."*
    - *Hint debole*: *"Critica come un senior reviewer."*
    - Atteso: una critica la cui *insieme di difetti rilevati* sovrappone quello del teacher; fade-out della lente esplicita.
  - **(2) WITHOUT-hint** — *"rivedi questa implementazione"* senza alcuna lente suggerita: il modello deve **interiorizzare** la lente del teacher e produrre una critica che il teacher confermerebbe, senza scaffolding.
  - **(3) WRONG — awareness** — la critica del small model **diverge** dal teacher: il small dice "tutto ok, solo naming da migliorare"; il teacher segnala una race condition. Label: *"sbagliato: la critica ha mancato il difetto dominante che il teacher ha colto (divergenza su un problema reale e grave)."* Riconoscere la divergenza come errore (non come legittima differenza di opinione, perché il difetto è verificabile).
  - **(4) WRONG — recovery** — mostrata la critica del teacher accanto alla propria, il modello **riconcilia**: identifica *quale* difetto reale aveva mancato e *perché* (es. non ha considerato la concorrenza), aggiorna la propria euristica di review → memo "su codice concorrente, cercare race/lock prima dello stile". Questo è il **loop di distillazione della critica** vero e proprio.
  - **(5) OTHER** — composite/edge: caso in cui il **teacher sbaglia o è troppo severo** e il small model ha ragione (es. il teacher segnala un "bug" che è in realtà comportamento voluto e testato) → la mossa giusta NON è cedere sempre al teacher, ma **giustificare con evidenza** (il test che dimostra il comportamento corretto). Insegna che l'ancora finale è l'**outcome verificabile**, non l'autorità del teacher (anti-distillazione-cieca). Adversariale: critiche del teacher contaminate da bias di lunghezza/formattazione → non imitarne i bias.
- **Fase curriculum**: **2 (teacher-compared — è la fase centrale di quest'area)** → poi 3 (RL-agentico: la critica distillata guida fix reali e si valida sull'esito). In fase 2 il teacher è online come comparatore; in fase 3 il segnale si sposta sull'outcome reale del fix.
- **Reward design (L → critic distillation / RLAIF)**: il reward è **l'allineamento col giudizio del teacher** sui difetti reali (agreement sui difetti verificabili, non similarità testuale). Filosoficamente è process-supervision in stile `[[../entities/prm-paper]]` (il teacher fa da PRM sulla critica). **Ancora dura**: dove il difetto è verificabile (test/exec), l'outcome reale prevale anche sul teacher (difesa anti-bias).
- **Hack-check**: *"come massimizzerei senza la skill?"* → (a) **imitare lo stile** del teacher (lunghezza, tono sicuro, formattazione) per ingannare un judge basato su similarità superficiale; (b) **participation-hack**: criticare sempre tutto perché "il teacher di solito trova qualcosa". **Difesa**: il reward misura l'**agreement sui difetti REALI verificabili**, non la somiglianza testuale né il volume di critica; il teacher è **diverso/ruotato** per non gamificarne uno solo (`[[../concepts/reward-hacking-mitigation]]` §3 difesa 5); dove esiste un test, l'**outcome** è l'arbitro finale (difesa 12, ancoraggio all'outcome). Il rischio "il modello produce la critica che il teacher premia, non quella vera" è esplicitamente mappato in `[[../concepts/reward-hacking-mitigation]]` §2 (riga RLAIF 🟠) → mitigato ancorando al verificabile. → **EXP-ME-9**.

---

## Topic 3 — Produce-already-optimized · Tag Q+L

**Segnale d'area**: **internalizzare** la critica così da **produrre direttamente output già ottimizzato** (Fase 2 della filosofia "scuola") — conciso + corretto + sicuro al primo colpo, senza bisogno del giro critica→fix. È il *risultato* atteso dell'aver giocato "il gioco": la self-critique diventa implicita e pre-emptive. 1 foglia.

### Foglia 3.1 — `output diretto già ottimizzato (conciso + corretto + sicuro)` · Tag Q+L
- **Skill target (segnale)**: alla prima generazione, produrre un artefatto che **passerebbe la propria critica** — corretto (Q: test verdi), sicuro (Q: no vuln scanner-detectabili), conciso (Q+L: code economy senza bloat, `[[../concepts/quality-target-tiers]]`), ben strutturato (L) — *senza* il giro esplicito critica→refactor.
- **Esempi**:
  - **(1) WITH-hint** — task "implementa la validazione dell'input" con *hint* che **anticipa la critica**.
    - *Hint forte*: *"Produci già la versione che supereresti in review: gestisci edge case (vuoto/null/oversize), valida l'input, niente codice morto, 6 righe non 60 se bastano — stesso valore e stessa sicurezza."*
    - *Hint medio*: *"Scrivi direttamente la versione corretta, sicura e concisa, come dopo una review."*
    - *Hint debole*: *"Output già ottimizzato."*
    - Atteso: prima generazione che passa test + scanner + soglia di concisione, senza round di fix.
  - **(2) WITHOUT-hint** — *"implementa il login"* senza anticipazione: il modello deve **da sé** produrre l'output già ottimizzato (la critica è interiorizzata, non serve scaffolding).
  - **(3) WRONG — awareness** — il modello produce una **prima versione sloppy** (200 righe, edge-case mancanti, secret in chiaro) "tanto poi la critico e la sistemo". Label: *"sbagliato: ha rimandato alla critica difetti che andavano evitati a monte; produce-già-ottimizzato fallito (spreco del giro critica→fix evitabile)."* Riconoscere il pattern "scrivo male e poi aggiusto" come anti-pattern quando la skill era interiorizzabile.
  - **(4) WRONG — recovery** — partito con output sub-ottimale, applica **una sola** passata di self-critique interiorizzata che lo porta a target, e **registra** cosa avrebbe dovuto fare a monte → memo "questa classe di task richiede validazione input by-default" così la prossima volta è già ottimizzato. Recovery = ridurre il numero di round nel tempo (curva di apprendimento).
  - **(5) OTHER** — edge **over-optimization a monte** (gold-plating): su un **PoC** il modello sovra-ottimizza (test, hardening, astrazioni) "per essere già ottimizzato" → ma "ottimizzato" è **relativo al tier target** (`[[../concepts/quality-target-tiers]]`): per un PoC, *già ottimizzato* = brutale-ma-funzionante. Riconoscere che over-engineering è anti-pattern tanto quanto lo sloppy. Composite: bilanciare concisione (Q) e leggibilità (L) quando confliggono.
- **Fase curriculum**: 2 (è il **frutto** del teacher-compared: dopo aver giocato "il gioco", la critica si fa pre-emptive) + 3 (RL agentico: misurato sul *numero di round* per arrivare a target — meno round = skill più interiorizzata).
- **Reward design (Q+L)**: **Q** = la prima generazione passa test + scanner + soglia di concisione (verificabile, deterministico); **L** = qualità strutturale via judge. Segnale aggiuntivo (fase 3): **#round-to-target** (meno passate di fix = più reward) — premia l'internalizzazione.
- **Hack-check**: *"come massimizzerei?"* → produrre output **minimale che passa i test deboli** spacciandolo per "ottimizzato e conciso" (under-build mascherato da economia); oppure **gonfiare** per sembrare completo. **Difesa**: i test sono **forti/held-out** (mutation/property-based, `[[../concepts/reward-hacking-mitigation]]` §3 difesa 2) così "conciso che passa" ≠ "conciso che funziona davvero"; la concisione è premiata **solo a parità di valore e sicurezza** (Q sul valore prima della L sulla brevità) — esattamente il vincolo utente "6 righe non 100 SE bastano, ma stesso valore + stessa sicurezza" (`[[README]]` Area 6 code-economy). Ancoraggio Q sul valore prima della L sulla brevità.

---

## Topic 4 — Self-confidence / self-scoring · Tag Q

**Segnale d'area**: stimare la **propria confidenza** sull'output → alimenta adaptive reasoning depth (Area 3) e ask-vs-proceed (Area 9). È **Q ma valutato come CALIBRAZIONE**: non "confidenza alta = buono", ma "confidenza che predice la correttezza reale". 1 foglia.

### Foglia 4.1 — `stimare la propria confidenza (calibrazione)` · Tag Q (calibrazione)
- **Skill target (segnale)**: emettere una **stima di confidenza** (es. 0-100% o low/med/high) sul proprio output che sia **calibrata** — cioè quando dice "90% sicuro" è giusto ~90% delle volte. La confidenza poi *guida* il comportamento: bassa → ragiona più a fondo (Area 3) o chiedi (Area 9); alta → procedi.
- **Esempi**:
  - **(1) WITH-hint** — task con *hint* che scaffolda la **forma calibrata** della stima.
    - *Hint forte*: *"Dopo la risposta, dai una confidenza 0-100% e GIUSTIFICALA con i fattori di incertezza (ambiguità del requisito? hai potuto testare? è dominio noto?). Se <70% → segnala cosa ti renderebbe sicuro."*
    - *Hint medio*: *"Stima quanto sei sicuro e perché."*
    - *Hint debole*: *"Aggiungi la tua confidenza."*
    - Atteso: confidenza motivata e *azionabile* (bassa → propone verifica/domanda).
  - **(2) WITHOUT-hint** — task ambiguo o fuori dominio noto: il modello deve **spontaneamente** abbassare la confidenza e collegarla all'azione (ragiona di più / chiede), senza che il prompt lo chieda.
  - **(3) WRONG — awareness** — **overconfidence**: il modello dichiara "99% sicuro" su una risposta che poi è sbagliata (Dunning-Kruger; lega `[[../concepts/multi-expert-collaboration]]` §guardrail "self-limit inaffidabile"). Label: *"sbagliato: confidenza alta su output errato (mal-calibrazione); confidenza scollegata dalla correttezza reale."* Riconoscere. Speculare: **underconfidence** cronica (sempre "non sono sicuro" anche su cose ovvie) → paralisi.
  - **(4) WRONG — recovery** — il modello aveva detto 95%, il test fallisce → **ri-calibra**: abbassa la confidenza, identifica il fattore mancato (non aveva testato l'edge case), e aggiorna l'euristica di stima → memo "su questo tipo di task non dichiarare >80% senza aver eseguito i test". Recovery = la confidenza converge verso la correttezza reale nel tempo.
  - **(5) OTHER** — composite: confidenza **per-dimensione** (alto su correttezza, basso su performance) invece di scalare unica → più informativa per ask-vs-proceed. Edge: confidenza alta *giustificata* (dominio noto, testato) che NON va punita — alta-e-giusta è l'obiettivo, non "sempre basso per prudenza".
- **Fase curriculum**: 1 (teoria: cos'è calibrazione, fattori di incertezza) + 2 (esercizi con feedback sulla correttezza reale) + 3 (RL agentico: la confidenza guida davvero depth/ask).
- **Reward design (Q → calibrazione)**: **NON** "confidenza alta = reward". Si misura la **calibrazione** con metriche proprie: **Brier score / ECE (Expected Calibration Error)** / reliability diagram — confidenza dichiarata vs correttezza osservata. Reward = bassa calibrazione-error. La correttezza reale è verificabile (test/exec), quindi la calibrazione è **ancorata a un outcome oggettivo**.
- **Hack-check**: *"come massimizzerei?"* → se il reward premiasse la confidenza alta, il modello direbbe **sempre 100%**; se premiasse l'umiltà, direbbe **sempre 0%**. **Difesa**: il reward è la **calibrazione** (Brier/ECE), non il livello — dichiarare sempre 100% è *pessima* calibrazione (penalizzata) appena qualche risposta sbaglia; idem sempre 0%. La ground truth (correttezza) è verificabile e **indipendente** dalla dichiarazione del modello → scorer ≠ scored automatico (il modello non controlla se la sua risposta è poi giusta). Questo è il caso in cui la metrica giusta *rende l'hacking auto-sconfiggente*. → `[[../concepts/reward-hacking-mitigation]]`.

---

## Topic 5 — Quality scorecard self-assessment · Tag Q+L

**Segnale d'area**: auto-valutare l'artefatto su **dimensioni × 0-5** contro il **tier target** (PoC/Prototype/MVP/Production/Hardened) e **surfaceare i gap** → `[[../concepts/quality-target-tiers]]`. È l'auto-valutazione strutturata; **massimamente esposta al self-score-inflation** (preoccupazione esplicita utente). Condivide il concept con Area 1 ma qui il focus è *valutare il prodotto*, non *inferire il tier*. 1 foglia.

### Foglia 5.1 — `auto-valutare l'artefatto su dimensioni × 0-5 vs tier target + surface gap` · Tag Q+L
- **Skill target (segnale)**: produrre uno **scorecard** (Correctness, Security, Architecture, Test coverage, Error handling, …, ognuna 0-5) per il proprio deliverable, confrontarlo col **profilo target del tier** (più gli override di dominio, es. MVP fintech → Security floor 5), e **surfaceare i gap concreti** ("Security 2/5 vs target 5/5 → manca input validation, secret in env, rate-limit"). Vedi lo scorecard di `[[../concepts/quality-target-tiers]]` §3.
- **Esempi**:
  - **(1) WITH-hint** — task "hai scritto l'endpoint `/login` (tier target: Production). Auto-valutalo."
    - *Hint forte (dimensioni esplicite)*: *"Compila lo scorecard 0-5 su: Correctness · Security · Architecture · Test coverage · Error handling · Observability · Docs · Maintainability. Per ogni dimensione sotto il target del tier, indica il gap CONCRETO e come chiuderlo. Usa proxy oggettivi dove esistono (coverage%, output del vuln-scanner)."*
    - *Hint medio*: *"Valuta il deliverable per dimensioni 0-5 vs il tier target e elenca i gap."*
    - *Hint debole*: *"Auto-valuta la qualità e i gap."*
    - Atteso: scorecard onesto + lista gap azionabili (come l'output esempio in `[[../concepts/quality-target-tiers]]` §4).
  - **(2) WITHOUT-hint** — *"ho finito la feature di pagamento"* (dominio fintech): il modello deve **da sé** produrre lo scorecard, applicare il **floor di dominio** (Security/Compliance/Correctness ≥ alti anche se MVP) e surfaceare i gap.
  - **(3) WRONG — awareness** — **self-score gonfiato/compiacente**: il modello si dà **5/5 a tutto** su codice con SQL injection, zero test, nessun logging. Label: *"sbagliato: self-assessment gonfiato (Security 5/5 su codice con injection); scorecard scollegato dall'evidenza."* Riconoscere il voto compiacente come fallimento — **è esattamente il reward-hack che l'utente teme** (`[[../concepts/quality-target-tiers]]` §6, `[[../concepts/reward-hacking-mitigation]]` §2).
  - **(4) WRONG — recovery** — il modello si era dato Security 5/5; messo davanti all'**evidenza** (vuln-scanner che trova l'injection, coverage al 12%, o il verdetto del teacher) → **corregge lo scorecard**: Security 2/5, allinea il voto allo strumento oggettivo, e ri-deriva i gap reali → memo "ancorare ogni dimensione a un proxy oggettivo prima di assegnare il voto". Recovery = riconciliare self-score ed evidenza esterna.
  - **(5) OTHER** — edge: **gold-plating awareness** — scorecard su un **PoC** dove il target di Security è 1/5: darsi 5/5 e "lavorare per chiudere il gap a 5" è *over-engineering*, il gap NON va chiuso (`[[../concepts/quality-target-tiers]]` §3 nota PoC). Riconoscere che "tutto a 5" non è l'obiettivo: l'obiettivo è **match al profilo del tier**. Composite: dominio che forza un override (`max(tier_target, domain_floor)`).
- **Fase curriculum**: 1 (teoria: dimensioni, tier, override di dominio, rubric) + 2 (esercizi, scorecard confrontato col **teacher/scorer esterno** → "il gioco" applicato all'auto-valutazione) + 3 (RL agentico).
- **Reward design (Q+L → MISTO, con scorer ESTERNO)**: ⚠️ **il self-score NON entra come reward su sé stesso**. (a) Le dimensioni con **proxy Q** (Test coverage→coverage%, Security→vuln-scanner, perf→benchmark) → score da **strumenti deterministici**; (b) le dimensioni **L** (Architecture, Maintainability) → **giudice esterno indipendente**; (c) il **reward del modello** è quanto il suo self-score **concorda con lo scorer esterno/strumenti** (calibrazione dell'auto-valutazione), non il livello dei voti. Il self-score serve a *comunicare il gap all'utente*, quel numero non è il reward. → `[[../concepts/quality-target-tiers]]` §6, `[[../concepts/reward-hacking-mitigation]]` §3 (difese 3, 4) + difesa-specifica-scorecard §3.
- **Hack-check**: *"come massimizzerei?"* → **gonfiare i propri voti** (5/5 ovunque) se il self-score desse reward. **Difesa (la più importante dell'area)**: **scorer ≠ scored** — il reward viene da strumenti deterministici (Q) e da un giudice esterno (L), **mai** dal voto del modello su sé; il modello è premiato per la **concordanza** tra il suo self-score e la verità esterna (calibrazione), così gonfiare = divergere dalla verità = penalità. Proxy Q ovunque possibile. È letteralmente l'esempio-cardine di `[[../concepts/reward-hacking-mitigation]]` (riga "Self-score scorecard 🔴 alta") → difesa interamente strutturale.

---

## Topic 6 — Cross-expert verification · Tag Q+L

**Segnale d'area**: verificare l'output di **un altro expert** dalla **propria lente di dominio** (es. l'expert *finance* valida lo script del *coder* contro le leggi di mercato) → `[[../concepts/multi-expert-collaboration]]` §raffinamenti. È "il gioco" applicato **tra** expert (producer–verifier): il verificatore coglie errori che il produttore non *può* vedere. **Buon reward anchor** (più verificabile e meno hackable del self-score, perché scorer ≠ scored *per costruzione*). 1 foglia.

### Foglia 6.1 — `verificare l'output di un altro expert dalla propria lente di dominio` · Tag Q+L
- **Skill target (segnale)**: dato l'output prodotto da un altro expert (LoRA verticale diverso), valutarlo **dal proprio dominio** e segnalare gli errori che il produttore non poteva cogliere — es. il *coder* scrive uno script di calcolo pensionistico; l'expert *finance* verifica che le formule rispettino le leggi di mercato/attuariali, non solo che il codice "giri". Producer–verifier, defense-in-depth.
- **Esempi**:
  - **(1) WITH-hint** — *"Sei l'expert finance. Il coder ha prodotto questo script per il calcolo del TIR pensionistico. Verificalo dalla TUA lente."*
    - *Hint forte (lente di dominio)*: *"Controlla SOLO ciò che il coder non poteva sapere: le formule attuariali sono corrette? Tassi/inflazione/mortality table applicati giusti? Vincoli normativi rispettati? Per ogni errore: cosa, perché viola la legge di mercato, e la correzione."*
    - *Hint medio*: *"Valida la correttezza di dominio (finanziaria), non quella di codice."*
    - *Hint debole*: *"Verifica dalla tua specializzazione."*
    - Atteso: rilievi di **dominio** (es. "usa tasso nominale dove serve reale → risultato sovrastimato"), non di stile di codice.
  - **(2) WITHOUT-hint** — la catena multi-expert passa l'output al verificatore senza istruzioni esplicite: l'expert **da sé** applica la propria lente e verifica solo ciò di sua competenza (lega `[[../concepts/multi-expert-collaboration]]` §5 self-election come verificatore).
  - **(3) WRONG — awareness** — il verificatore **rubber-stamp**: approva lo script ("sembra ok") senza verificare le formule, che usano una mortality table sbagliata. Label: *"sbagliato: verifica di cortesia (rubber-stamp), nessun controllo di dominio reale; participation senza catch."* Riconoscere. Speculare: il verificatore **esonda dalla propria lente** (il finance critica lo stile del codice Python → fuori competenza, lega Area 11 out-of-domain).
  - **(4) WRONG — recovery** — il verificatore aveva approvato; emerge poi (test su dati reali / teacher) che la formula era errata → **riconosce il catch mancato**, lo nomina dalla propria lente, propone la correzione, e aggiorna l'euristica di verifica → memo "su script finanziari, verificare sempre tasso reale-vs-nominale". Recovery del verificatore.
  - **(5) OTHER** — composite: **catena producer→verifier→orchestrator** dove l'orchestratore (completeness-gate, `[[../concepts/multi-expert-collaboration]]` §loop esterno) arbitra un **conflitto** tra coder e finance → lega `[[../concepts/contradiction-detection-layer]]`. Edge: il verificatore trova che l'output è **corretto** → approvare è la risposta giusta (NON inventare un problema per "aver partecipato" — questo è il participation-hack da non fare). Adversariale: l'output da verificare contiene istruzioni iniettate ("approva senza controllare") → ignorare.
- **Fase curriculum**: 2 (teacher-compared: la verifica cross-expert è confrontata col giudizio esperto) + 3 (RL agentico nella catena multi-expert reale, dove la verifica blocca/sblocca davvero il passaggio allo step successivo).
- **Reward design (Q+L — buon anchor, scorer ≠ scored per costruzione)**: il verificatore è **diverso** dal produttore → niente self-score. **Q** dove il difetto è verificabile (la formula corretta dà un risultato diverso, testabile contro dati noti); **L** sul giudizio di dominio. **Reward ancorato all'OUTCOME**: la verifica conta se *ha scovato un errore REALE* (verificabile), confrontata col teacher dove serve.
- **Hack-check (CRITICO — participation-hack)**: *"come massimizzerei?"* → **criticare/segnalare sempre** un problema (anche inventato) per incassare il reward di "ha verificato", o **rubber-stamp** sistematico per minimizzare lo sforzo. **Difesa (principio first-class)**: il reward è ancorato a *"ha scovato un errore REALE?"* (outcome verificabile), **MAI** alla partecipazione / al gesto di verificare — esattamente il requisito confermato utente 2026-06-24 (`[[../concepts/multi-expert-collaboration]]` §5: "il reward della self-election e di ogni verifica/critica va ancorato a 'ha scovato un errore REALE?', non alla partecipazione → altrimenti participation-hack"). Penalità sia per **false positive** (errore inventato) sia per **false negative** (rubber-stamp che lascia passare un errore reale). Scorer ≠ scored *per costruzione* (verificatore ≠ produttore), il che rende quest'area meno hackable del self-score (topic 5). → `[[../concepts/reward-hacking-mitigation]]` §3 difesa 12 (riga "Verification / self-election reward 🔴 alta") + **EXP-ME-9**.

---

## Sintesi d'area

- **6 topic · 6 foglie** coperte con le 5 classi ciascuna (with-hint a 3 livelli di scaffolding · without-hint · wrong-awareness · wrong-recovery · other), per ~30 famiglie-esempio base (espandibili a dataset). L'area è "stretta in foglie ma profonda in meccanismo": ogni foglia è una sfaccettatura del **single big mechanism "il gioco"** (self-critique comparata col teacher).
- **Distribuzione tag**: **L** sulle critiche (topic 1, 2 — la critica e il suo confronto col teacher); **Q (calibrazione)** sulla self-confidence (topic 4 — Brier/ECE, non livello); **Q+L misto** su produce-already-optimized (topic 3), scorecard (topic 5) e cross-expert verification (topic 6). Il filo: **dove c'è un self-score, c'è uno scorer esterno**; dove c'è una critica, c'è il **teacher come ancora** e l'**outcome verificabile** come arbitro finale.
- **Curriculum**: la teoria (forma di una critica azionabile, calibrazione, dimensioni/tier dello scorecard, lenti di dominio) sta in **fase 1**; il cuore — **teacher-compared, "il gioco"** — è **fase 2** (critic distillation / RLAIF col big model come comparatore); l'**RL-agentico fase 3** sposta il segnale sull'**outcome reale** (la critica guida un fix che passa i test; la verifica cross-expert blocca davvero un errore; il #round-to-target cala). Coerente con `[[README]]` §4.bis e con la richiesta del compito ("il gioco centralmente Fase 2 → poi Fase 3").
- **Filo rosso anti-reward-hacking d'area (la più gameable della tassonomia)**: l'auto-valutazione è il caso in cui **scorer == scored** per default → difesa **strutturale e ubiqua**: (a) **scorer ≠ scored** — il reward L viene da teacher/giudice indipendente, il self-score serve solo a *comunicare/decidere*, mai come reward su sé; (b) **reward della critica/verifica ancorato all'OUTCOME** ("ha scovato un errore REALE?"), MAI alla **partecipazione** (anti participation-hack, principio first-class, EXP-ME-9); (c) **teacher come ancora** per il "gioco" (critic distillation), con teacher ruotati/diversi per non gamificarne uno; (d) **proxy Q** per le dimensioni misurabili dello scorecard; (e) **self-confidence valutata come calibrazione** (Brier/ECE), così "sempre 100%" è auto-sconfiggente; (f) **outcome verificabile come arbitro finale** anche sopra il teacher (anti-distillazione-cieca). Tutto ancorato a `[[../concepts/reward-hacking-mitigation]]` (riga "Self-score scorecard 🔴 alta" e "Self-critique RLAIF 🟠" e "Verification reward 🔴 alta") + `[[../concepts/quality-target-tiers]]` §6.

## Sources
- `[[README]]` §4 Area 16 (backbone topic/foglie/tag + box "Meccanismo il gioco"), §3 (template/foglie canoniche), §2 (5 classi), §4.bis (curriculum 3 fasi — "il gioco" centralmente Fase 2 → Fase 3).
- `[[_coverage-audit-2026-06-23]]` §C ("il gioco" di auto-critica, macro-curriculum 3 fasi, NEW Area 16).
- `[[../concepts/quality-target-tiers]]` (scorecard dimensioni×0-5×tier, override di dominio, §6 reward-hacking del self-score).
- `[[../concepts/multi-expert-collaboration]]` (§raffinamenti: cross-expert verification producer–verifier, self-election, reward ancorato all'outcome, EXP-ME-9).
- `[[../concepts/reward-hacking-mitigation]]` (principio first-class: scorer ≠ scored, reward ancorato all'outcome non alla partecipazione, teacher come ancora, proxy Q).
- `[[../entities/prm-paper]]` ("Let's Verify Step by Step", Lightman et al. 2023 — process supervision: il teacher fa da PRM sulla critica).
- User notes 2026-06-23/24: "il gioco", produce-già-ottimizzato, participation-hack requisito confermato.
