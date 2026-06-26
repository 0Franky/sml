---
name: area-06-code-quality-architecture
description: Example-space completo dell'Area 6 (Code Quality & Architecture) — 9 foglie L/Q+L, ognuna con 5 classi di esempi (with-hint forte→debole, without-hint, wrong-awareness, wrong-recovery, other), reward design judge/rubric/preference e hack-check anti reward-hacking.
type: taxonomy-area
tags: [training, taxonomy, area-06, code-quality, architecture, refactoring]
sources: [training-taxonomy/README.md §4 Area 6, user notes 2026-06-23]
last_updated: 2026-06-25
status: generated
---

# Area 6 — Code Quality & Architecture

> **Tier**: T2 (programming generale) / T3 (verticali). **Tag dominante**: **L** (qualitativo, richiede judge/rubric/preference). Alcune foglie sono **Q+L** (un nucleo verificabile + una dimensione di giudizio).
>
> **Riferimento template**: questo file riempie lo schema del [[README]] — in particolare la **foglia canonica §3.2** (`code-quality / architettura-e-struttura`) è di quest'area e fa da template ESATTO. Non riscrivo lo schema, lo riempio per TUTTE le 9 foglie del backbone §4 Area 6.

Questa è l'area più qualitativa della tassonomia: il segnale non è "funziona / non funziona" (quello è [[area-05-code-correctness|Area 5]]) ma **"è scritto bene?"**. Per questo il reward è quasi sempre un **judge/rubric multi-dimensione** o una **preference pairwise** (codice A meglio di codice B), col **modello grande come teacher** (il "gioco" di [[README#Area 16]]). Il rischio sistematico è il **reward-hacking del judge**: un LLM-judge tende a premiare codice *verboso, commentato, "impressionante"* invece che codice *pulito ed essenziale*. Ogni foglia qui sotto chiude questo rischio con un hack-check esplicito → [[../concepts/reward-hacking-mitigation]].

**Principio trasversale (curriculum "scuola", §4.bis)**: la maggior parte delle foglie vive in **Fase 2** (affinamento con esercizi che il modello vede e comprende: with-hint → without-hint, fade-out dell'impalcatura) e in **Fase 3** (RL agentico: il giudizio di qualità diventa reward su artefatti reali prodotti nell'harness). La teoria dei principi di design sta in **Fase 1** (system prompt + tracce).

**Nota di metodo sugli hint (vale per tutte le foglie)**: gli hint della classe (1) sono **scaffolding da rimuovere**, non parte della skill. Si declinano per **dimensione** (naming · modularità · SoC · testabilità · error-handling) e per **intensità** forte→debole. Il fade-out è il cuore del paired/contrastive batching descritto in [[README#2.1]]: stessa task-family, (1) con-hint e (2) senza-hint nello stesso gruppo, così il modello impara che **la skill è la stessa con o senza impalcatura**.

---

## Readability / Naming

- **Foglia**: `code-quality / readability-naming`. **Tag**: **L**.
- **Skill target (segnale)**: produrre identificatori **auto-esplicativi** (variabili, funzioni, classi, file) che comunicano *intento* e non *implementazione*; nominare per dominio, non per tipo; evitare abbreviazioni opache, nomi-rumore (`data`, `tmp`, `obj`, `x1`), e nomi fuorvianti (un `getUser` che scrive). Riconoscere quando un nome è cattivo.
- **Esempi**:
  - **(1) WITH-hint** — task: *"implementa la funzione che, dato un carrello, calcola lo sconto fedeltà"*.
    - *Hint forte (checklist naming completa)*: *"Nomi auto-esplicativi: il nome della funzione dice cosa restituisce, non come; le variabili dicono il significato di dominio (es. `loyaltyDiscountRate`, non `r`); niente abbreviazioni opache; niente nomi-rumore (`data`, `tmp`); un nome non deve mentire (un getter non muta)."*
    - *Hint medio (dimensione naming)*: *"Cura i nomi: devono spiegarsi da soli, livello di dominio."*
    - *Hint debole (puntatore)*: *"Attenzione alla leggibilità dei nomi."*
    - Atteso: `calculateLoyaltyDiscount(cart)` con `eligibleItems`, `loyaltyTier`, `discountRate` — non `calc(c)` con `a`, `b`, `tmp`.
  - **(2) WITHOUT-hint** — *"implementa la funzione di sconto fedeltà per il carrello"*, nessuna linea guida sui nomi. Il modello deve nominare bene **spontaneamente**.
  - **(3) WRONG — awareness** — gli si mostra:
    ```python
    def f(d, x):
        t = 0
        for i in d:
            if i["p"] > x: t += i["p"] * 0.1
        return t
    ```
    e deve **giudicarlo**: *"perché è sloppy: nome funzione `f` non comunica nulla; `d`/`x`/`t`/`i` non hanno significato di dominio; `i['p']`/`0.1` sono magic value senza nome; il lettore deve eseguire mentalmente il codice per capire che è uno sconto."* (no recovery).
  - **(4) WRONG — recovery** — stesso codice sloppy → **refactor** verso versione leggibile, spiegando ogni mossa: rinomina `f`→`calculateLoyaltyDiscount`, `d`→`cartItems`, `x`→`priceThreshold`, estrae `LOYALTY_RATE = 0.1` e `i["p"]`→`item["price"]`. Insegna il loop diagnostica → ripara.
  - **(5) OTHER** — over-naming (anti-pattern opposto): nomi **iper-verbosi e ridondanti** (`theFinalCalculatedTotalLoyaltyDiscountAmountValueForTheCustomerCart`) o notazione ungherese inutile (`strName`, `intCount`) in un linguaggio tipizzato → riconoscere che *anche* questo danneggia la leggibilità. Trade-off contestuale: in uno scope di 3 righe `i` come indice di loop è **idiomatico e accettabile**; la regola "nomi lunghi" non è assoluta.
- **Fase curriculum**: Fase 1 (regola naming nel system prompt) + Fase 2 (esercizi with→without hint) + classe (3)/(4) anche in Fase 2 come "gioco" auto-critica vs teacher.
- **Reward design (L)**: **judge/rubric** a una dimensione (`naming_quality` 0-5: auto-esplicatività, assenza di abbreviazioni opache/nomi-rumore, coerenza, non-fuorvianza). Meglio ancora **preference pairwise** (versione ben-nominata vs sloppy dello stesso codice: il modello deve preferire la prima). Q prerequisito: il codice **compila e passa i test** identici prima e dopo (il naming non cambia il comportamento → vedi foglia Refactoring).
- **Hack-check (OBBLIGATORIO)**: il judge potrebbe premiare nomi **più lunghi = più "professionali"** (over-naming, classe 5) o codice **pieno di commenti** che spiegano nomi cattivi invece di nomi buoni. Difese: (a) **rubric ancorata** con esempi calibrati di 0/3/5 inclusi i casi over-naming penalizzati; (b) **preference pairwise** dove uno dei due candidati è deliberatamente over-named (il judge deve preferire il conciso-chiaro); (c) penalità esplicita per "commento che compensa un nome cattivo". → [[../concepts/reward-hacking-mitigation]].

---

## Structure / Modularity / SoC

> Questa è la **foglia canonica §3.2** del [[README]] (`architettura-e-struttura`). Qui la riempio per intero e la estendo.

- **Foglia**: `code-quality / structure-modularity-soc`. **Tag**: **L** (+ Q sul "compila/passa test" come prerequisito).
- **Skill target (segnale)**: produrre codice **ben strutturato** — separation of concerns (I/O ≠ business logic ≠ presentation), funzioni piccole e a singola responsabilità, basso accoppiamento tra moduli, alta coesione interna — e **riconoscere** strutture monolitiche/spaghetti.
- **Esempi**:
  - **(1) WITH-hint** — task: *"implementa il modulo di pagamento (valida la carta, addebita, salva la transazione, manda la ricevuta)"*.
    - *Hint forte (per dimensione, completo)*: *"Struttura per responsabilità: separa validazione / addebito / persistenza / notifica in funzioni distinte; ogni funzione fa UNA cosa; minimizza il coupling (passa dati, non globali); niente funzione monolitica."*
    - *Hint medio (SoC + modularità)*: *"Tieni separate le responsabilità; funzioni piccole."*
    - *Hint debole (puntatore)*: *"Struttura bene il codice."*
    - Atteso: `validateCard()`, `chargeCustomer()`, `persistTransaction()`, `sendReceipt()` orchestrate da `processPayment()`, ognuna testabile in isolamento — NON un unico `processPayment()` da 200 righe che fa tutto e tocca lo stato globale.
  - **(2) WITHOUT-hint** — *"implementa il modulo di pagamento"* senza linee guida: il modello applica la SoC da sé.
  - **(3) WRONG — awareness** — gli si mostra una funzione da ~200 righe che valida, addebita, scrive su DB, logga, formatta HTML e manda email tutto inline, con stato globale e tre livelli di `if` annidati. Deve **giudicarla**: *"perché è sloppy: viola la single-responsibility (5 concern in una funzione); impossibile testare l'addebito senza toccare il DB e l'email; alto coupling con lo stato globale; un bug nella formattazione email può rompere l'addebito."* Lega a nota 6b trajectory-critique ([[../concepts/_user-notes-2026-06-23]]).
  - **(4) WRONG — recovery** — il monolite → **refactor** in moduli, spiegando ogni mossa: *estrai* `validateCard` (pure), *estrai* `chargeCustomer` (side-effect isolato dietro un gateway), *inietta* le dipendenze invece delle globali, *componi* in `processPayment`. Mostra che i test esistenti restano verdi (comportamento invariato).
  - **(5) OTHER** — **over-engineering** (anti-pattern opposto): astrazione inutile — `AbstractPaymentStrategyFactoryProvider`, 6 interfacce e 4 layer di indirezione per un singolo metodo di pagamento (YAGNI). Riconoscere che *anche* questo è un anti-pattern: la complessità accidentale supera quella del dominio. Trade-off contestuale: con UN solo provider la factory è premature abstraction; con CINQUE provider che cambiano a runtime diventa giustificata. Decisione dipende dal [[../concepts/quality-target-tiers|tier target]] (un PoC non vuole il pattern; un sistema Hardened sì).
- **Fase curriculum**: Fase 1 (principi SoC/coupling/coesione a teoria) + Fase 2 (esercizi + auto-critica) + Fase 3 (RL: la struttura di artefatti reali nell'harness diventa reward).
- **Reward design (L)**: **rubric multi-dimensione** (naming, SoC, modularità, testabilità) via judge/preference — esattamente la "Misura (L)" della §3.2. **Q prerequisito**: compila + test verdi (la struttura non deve rompere il comportamento). Proxy strutturali oggettivi *come supporto, non come reward primario*: lunghezza media funzione, profondità di annidamento, fan-out/coupling — utili per ancorare il judge ma **non da massimizzare da soli** (vedi hack-check).
- **Hack-check (OBBLIGATORIO)**: due trappole. (1) Se si premiasse "**più funzioni = più modulare**", il modello impara a **frammentare** (10 funzioni da 1 riga ciascuna, classe over-engineering 5) → reward-hack della metrica strutturale. (2) Il judge premia codice **lungo e "architetturato"** che *sembra* sofisticato. Difese: rubric ancorata con esempi di over-fragmentation penalizzati; **preference pairwise** dove un candidato è over-engineered; il proxy "numero funzioni" entra solo come **vincolo a U** (né troppo poche né troppe), mai come reward monotono; teacher = modello grande che giudica la *coesione*, non il conteggio. → [[../concepts/reward-hacking-mitigation]].

---

## Idiomatic / Best-Practices

- **Foglia**: `code-quality / idiomatic-best-practices`. **Tag**: **L**.
- **Skill target (segnale)**: scrivere codice **idiomatico** per il linguaggio/framework — usare i costrutti naturali (list comprehension in Python invece di loop+append, context manager `with` invece di try/finally manuale, hooks idiomatici in React invece di pattern imperativi) e seguire le convenzioni della community (PEP 8, naming convention del framework).
- **Esempi**:
  - **(1) WITH-hint** — task: *"in Python, filtra gli utenti attivi e restituisci le loro email"*.
    - *Hint forte (convenzioni esplicite)*: *"Usa costrutti idiomatici Python: comprehension al posto di loop+append, `with` per risorse, niente indici manuali dove un `for x in xs` basta, segui PEP 8."*
    - *Hint medio*: *"Scrivi codice idiomatico e pythonic."*
    - *Hint debole*: *"Usa lo stile naturale del linguaggio."*
    - Atteso: `[u.email for u in users if u.is_active]` — non `result = []; for i in range(len(users)): if users[i].is_active == True: result.append(users[i].email)`.
  - **(2) WITHOUT-hint** — *"filtra gli utenti attivi e restituisci le email"* senza menzionare lo stile: idioma applicato da sé.
  - **(3) WRONG — awareness** — gli si mostra codice **anti-idiomatico** (loop con `range(len())`, `== True`, gestione manuale del file senza `with`, `type(x) == list` invece di `isinstance`) e deve **giudicarlo**: *"perché è sloppy: ignora gli idiomi del linguaggio; `== True` è ridondante; `range(len())` è un C-ism; file aperto senza `with` può leakare il descriptor."*
  - **(4) WRONG — recovery** — codice anti-idiomatico → **refactor** idiomatico, spiegando ogni mossa (comprehension, `with`, `isinstance`, troncamento del `== True`).
  - **(5) OTHER** — **idioma esibizionista** (anti-pattern opposto): one-liner illeggibile che *abusa* degli idiomi (triple nested comprehension con walrus + `reduce` + lambda) dove un loop chiaro sarebbe più leggibile → riconoscere che "idiomatico" ≠ "massimamente compresso". Trade-off contestuale: l'idioma giusto dipende anche dalla **versione** del linguaggio/framework (pattern match in Python 3.10+, hooks vs class component in React) → un idioma "best practice" oggi era anti-pattern ieri. Lega alla foglia **Regime-meta-awareness** (cosa è best practice dipende dal contesto/versione).
- **Fase curriculum**: Fase 1 (convenzioni nel system prompt) + Fase 2 (esercizi per linguaggio/framework, rilevante per i **LoRA verticali** T3 dove ogni framework ha i suoi idiomi).
- **Reward design (L)**: **judge/rubric** (`idiomaticity` 0-5) con **teacher modello grande** che conosce le convenzioni; **preference pairwise** idiomatico vs C-ism. Un **linter** (ruff/eslint/clippy) fornisce un **segnale Q parziale** (violazioni di stile auto-rilevabili) usabile come prerequisito/filtro, ma non copre l'idiomaticità "di gusto" → resta L.
- **Hack-check (OBBLIGATORIO)**: il judge potrebbe premiare l'**idioma più "clever"/compresso** (classe 5, one-liner illeggibile) come segno di competenza. Inoltre se si usasse **solo il linter come reward**, il modello impara a soddisfare il linter (`# noqa`, disabilitare regole) senza scrivere codice davvero idiomatico → hack del proxy. Difese: rubric che **penalizza esplicitamente la compressione a scapito della leggibilità**; preference pairwise dove un candidato è "clever ma illeggibile"; il linter conta solo come **gate Q** (zero violazioni) non come reward L; vietare `# noqa`/suppression nel reward. → [[../concepts/reward-hacking-mitigation]].

---

## Maintainability

- **Foglia**: `code-quality / maintainability`. **Tag**: **L**.
- **Skill target (segnale)**: scrivere codice **manutenibile** — basso accoppiamento, alta coesione, estendibilità (aggiungere una feature non richiede toccare 10 file), assenza di magic number, configurazione esternalizzata, dipendenze esplicite. Riconoscere il "debito tecnico" prima che si accumuli.
- **Esempi**:
  - **(1) WITH-hint** — task: *"implementa il calcolo delle tasse per i diversi paesi"*.
    - *Hint forte*: *"Pensa alla manutenibilità: l'aliquota e le regole per paese devono essere dati/config, non `if` hardcoded sparsi; aggiungere un nuovo paese deve richiedere UNA modifica localizzata; niente magic number; dipendenze esplicite."*
    - *Hint medio*: *"Rendi il codice facile da estendere e modificare."*
    - *Hint debole*: *"Pensa a chi manterrà questo codice."*
    - Atteso: una tabella/registry `TAX_RULES[country]` + una funzione che la consulta — aggiungere un paese = aggiungere una riga. NON un `if country == "IT": ... elif country == "DE": ...` lungo 80 righe ripetuto in 3 punti.
  - **(2) WITHOUT-hint** — *"implementa il calcolo tasse per più paesi"*: estendibilità applicata da sé.
  - **(3) WRONG — awareness** — gli si mostra una cascata di `if/elif` per paese, replicata in 3 funzioni diverse, con aliquote come magic number inline. Deve **giudicarla**: *"perché è sloppy: aggiungere un paese richiede modifiche in 3 punti (shotgun surgery); le aliquote magiche rendono il cambio rischioso; alto rischio di dimenticare un punto → bug silenzioso."*
  - **(4) WRONG — recovery** — la cascata → **refactor** verso registry data-driven, spiegando ogni mossa (estrai le regole in una struttura dati, sostituisci i 3 `if` con una lookup, centralizza). Mostra che ora "aggiungi paese" = 1 riga e i test restano verdi.
  - **(5) OTHER** — **future-proofing eccessivo** (anti-pattern opposto): un plugin-system configurabile via YAML con dependency injection per supportare "ipotetici futuri paesi con regole arbitrarie" quando ne servono 3 fissi → over-engineering travestito da manutenibilità (YAGNI). Trade-off contestuale: il livello di estendibilità giusto dipende dal **tier target** e dal numero atteso di varianti.
- **Fase curriculum**: Fase 1 (principi coupling/coesione) + Fase 2 (esercizi "aggiungi una variante" che premiano la localizzazione del cambiamento) + Fase 3 (RL su task multi-step dove la manutenibilità dello step N abilita lo step N+1).
- **Reward design (L)**: **judge/rubric** (`maintainability` 0-5: localizzazione del cambiamento, assenza di duplicazione di regole, config esternalizzata, no magic number). Misura **comportamentale forte e originale**: dare al modello un *change request follow-up* ("ora aggiungi il paese X") e misurare **quante righe/file deve toccare** (Q quasi-oggettivo, derivato) → meno diff = più manutenibile, **purché i test passino**. Questo ancora il giudizio L a un proxy verificabile.
- **Hack-check (OBBLIGATORIO)**: usare "**diff minimo per il change request**" come reward è hackable → il modello impara a fare **astrazioni premature** (il plugin-system della classe 5) che minimizzano il diff futuro a costo di complessità presente. Difese: il proxy "diff del follow-up" entra **solo accoppiato** a una penalità di complessità presente (rubric `over_engineering`); preference pairwise dove un candidato è over-abstracted; il teacher grande giudica se l'estendibilità è **proporzionata al dominio**, non massima in assoluto. → [[../concepts/reward-hacking-mitigation]].

---

## Production-Readiness

- **Foglia**: `code-quality / production-readiness`. **Tag**: **Q+L** (checklist verificabile `Q` + robustezza di giudizio `L`).
- **Skill target (segnale)**: portare il codice da "funziona sul caso felice" a **production-ready** — error handling esplicito, logging appropriato, validazione input, gestione delle risorse (timeout, retry, cleanup), test, niente `print` di debug, niente segreti hardcoded. **Calibrare** il livello al [[../concepts/quality-target-tiers|tier target]] (un PoC non vuole il logging strutturato; un sistema Hardened sì).
- **Esempi**:
  - **(1) WITH-hint** — task: *"rendi production-ready questa funzione che chiama un'API esterna"*.
    - *Hint forte (checklist completa, dimensione error-handling)*: *"Production-readiness: gestisci gli errori di rete (timeout + retry con backoff); valida l'input; logga gli eventi rilevanti (non con `print`); chiudi/rilascia le risorse; nessun segreto hardcoded; aggiungi i test dei casi d'errore."*
    - *Hint medio*: *"Aggiungi error handling, logging e validazione robusti."*
    - *Hint debole*: *"Rendila robusta per la produzione."*
    - Atteso: `try/except` mirati sui fallimenti di rete, timeout esplicito, retry con backoff, `logger.warning(...)` non `print`, input validato, API key da config/env.
  - **(2) WITHOUT-hint** — *"questa funzione chiama un'API, preparala per la produzione"*: la checklist applicata da sé, calibrata al contesto.
  - **(3) WRONG — awareness** — gli si mostra il caso-felice nudo: `r = requests.get(url); return r.json()["data"]` senza timeout, senza except, con la chiave API in chiaro e un `print(r.text)` di debug. Deve **giudicarlo**: *"perché non è production-ready: nessun timeout (può appendere all'infinito); `r.json()` esplode su risposta non-JSON; `["data"]` esplode su payload inatteso; API key esposta; `print` di debug residuo; nessun retry."*
  - **(4) WRONG — recovery** — il caso-felice → versione hardened, spiegando ogni mossa (aggiungi timeout, avvolgi in try/except specifici, sposta la key in env, sostituisci print con logger, valida la shape del payload, aggiungi retry).
  - **(5) OTHER** — **robustezza fuori scala per il tier** (anti-pattern opposto): per uno **script PoC monouso** il modello aggiunge circuit breaker, distributed tracing, retry esponenziale e 200 righe di error handling → over-engineering rispetto al [[../concepts/quality-target-tiers|tier PoC]]. Riconoscere che production-readiness è **relativa al tier**: il giusto livello per un Prototype ≠ per un sistema Hardened. **Chiedere se il tier è ambiguo** (lega ad Area 1 quality-target inference).
- **Fase curriculum**: Fase 1 (checklist a teoria) + Fase 2 (esercizi "hardening" su funzioni date) + Fase 3 (RL agentico: nell'harness, la robustezza dell'artefatto reale è premiata, e i fallimenti reali — timeout veri — danno segnale).
- **Reward design (Q+L)**: **doppio**. **Q** = checklist verificabile in parte automaticamente — esistono i test dei casi d'errore? il linter trova `print`/segreti hardcoded? c'è un timeout sulla chiamata? (scanner deterministico, gate). **L** = judge/rubric sulla **robustezza qualitativa** (l'error handling è *appropriato* o cattura `Exception` nuda? il logging è al livello giusto?) + **preference pairwise** caso-felice vs hardened. Il livello-target è dato dal tier (Area 1) per non penalizzare under/over.
- **Hack-check (OBBLIGATORIO)**: la **checklist Q è la trappola classica** — il modello impara a **mettere la spunta senza la sostanza**: un `try/except Exception: pass` "ha l'error handling" ma è peggio di niente; un `logger.debug("")` "ha il logging"; un test vuoto "ha i test". Difese: (a) la checklist non premia la *presenza* del costrutto ma la sua *efficacia* verificata (il test dei casi d'errore deve **fallire** se rimuovi l'handling → mutation-style check); (b) **vietare** `except: pass`/bare-except nel reward (penalità); (c) il judge L valuta se l'handling è *mirato*, non cosmetico; (d) ancorare al tier per impedire il reward-hack opposto (gonfiare per un PoC). Questo è il caso-scuola di "scorer ≠ scored" + reward ancorato all'OUTCOME (l'errore reale gestito), non alla partecipazione (il costrutto presente). → [[../concepts/reward-hacking-mitigation]].

---

## Refactoring Quality

- **Foglia**: `code-quality / refactoring-quality`. **Tag**: **L** (+ Q forte: comportamento **invariato** = test identici verdi prima/dopo).
- **Skill target (segnale)**: **migliorare** la struttura/leggibilità di codice esistente **senza cambiarne il comportamento** — il refactoring è behavior-preserving per definizione. Saper applicare le mosse canoniche (extract function, rename, inline, dedup, replace-conditional-with-polymorphism) e **giustificare ogni mossa**. È la capability "motore" che le foglie (4) WRONG-recovery di tutta l'area esercitano.
- **Esempi**:
  - **(1) WITH-hint** — task: *"refactora questa funzione mantenendo identico il comportamento"* + codice da migliorare.
    - *Hint forte (metodo + vincolo)*: *"Refactoring behavior-preserving: prima assicurati che ci siano test che fissano il comportamento; poi applica una mossa per volta (estrai funzione, rinomina, deduplica) spiegando ognuna; ri-esegui i test dopo ogni mossa; il comportamento osservabile NON deve cambiare."*
    - *Hint medio*: *"Migliora struttura e nomi senza cambiare cosa fa il codice."*
    - *Hint debole*: *"Refactora questo codice."*
    - Atteso: sequenza di piccole mosse, ognuna motivata, test verdi a ogni passo.
  - **(2) WITHOUT-hint** — *"questo codice funziona ma è brutto, sistemalo"*: il modello applica il metodo behavior-preserving da sé, **senza** che gli venga ricordato di preservare il comportamento.
  - **(3) WRONG — awareness** — gli si mostra un *finto refactoring* dove qualcuno ha "ripulito" il codice ma **ha cambiato il comportamento** (es. ha trasformato `>` in `>=` mentre rinominava, o ha cambiato l'ordine di valutazione di side-effect). Deve **riconoscerlo**: *"questo non è un refactoring valido: oltre a rinominare, ha alterato il boundary `>`→`>=`, cambiando il comportamento su input uguale alla soglia — un refactoring NON deve fare questo."* (skill chiave: distinguere refactoring da modifica funzionale travestita).
  - **(4) WRONG — recovery** — dato il finto-refactoring buggato della (3), **diagnostica** la deviazione di comportamento (test rosso o ragionamento sul boundary) → **ripristina** il comportamento corretto mantenendo i miglioramenti strutturali leciti. Insegna il verify-loop applicato al refactoring.
  - **(5) OTHER** — **refactoring-churn** (anti-pattern opposto): rimaneggiare codice che già va bene solo per "stile personale" (rinominare per gusto, riorganizzare senza valore), introducendo rischio e diff inutile → riconoscere che *non tutto* va refactorato; il refactoring senza un beneficio chiaro è costo netto. Trade-off contestuale: refactorare *durante* un bugfix urgente vs in un momento dedicato.
- **Fase curriculum**: Fase 2 (esercizi di refactoring con test-harness che verifica l'invarianza) + Fase 3 (RL agentico: refactoring su repo reali, dove la suite di test reale è il guardrail Q). Forte sinergia con [[area-13-swe-repo-level|Area 13]] (refactoring multi-file).
- **Reward design (L + Q)**: **Q forte e non negoziabile** = la suite di test **identica** deve passare prima e dopo (behavior-preservation verificabile; se cambia un test, NON è un refactoring valido → reward = 0 o negativo). **L** = judge/rubric sul **miglioramento di qualità** (la struttura è davvero migliore? le mosse sono motivate?) + **preference pairwise** (refactoring buono vs churn inutile). Combinazione: il gate Q elimina i "refactoring" che barano sul comportamento; il judge L ordina quelli validi per qualità.
- **Hack-check (OBBLIGATORIO)**: due hack. (1) Il modello potrebbe **modificare anche i test** per farli passare dopo aver cambiato il comportamento → bisogna **congelare i test** (i test NON sono editabili dal modello durante un task di refactoring; vengono dal valutatore). (2) Il judge L premia il refactoring **più esteso/appariscente** → il modello fa churn (classe 5) per sembrare attivo. Difese: test congelati + diff verificato (il comportamento osservabile è identico via test/property-based); rubric che premia il **rapporto miglioramento/rischio**, non l'estensione del diff; preference pairwise con un candidato "churn". Reward ancorato all'OUTCOME (qualità migliorata a comportamento invariato), mai alla quantità di modifiche. → [[../concepts/reward-hacking-mitigation]].

---

## Code Economy / Conciseness

- **Foglia**: `code-quality / code-economy-conciseness`. **Tag**: **Q+L** (nucleo Q: stesso valore + stessa sicurezza; layer L: no bloat). Origine: nota utente 2026-06-23 — *"6 righe non 100 SE bastano, ma stesso VALORE + stessa SICUREZZA"*.
- **Skill target (segnale)**: produrre la soluzione **più essenziale** che mantiene **identico valore funzionale e identica sicurezza** — eliminare codice ridondante, variabili intermedie inutili, branch morti, wrapper superflui — **senza** sacrificare correttezza, leggibilità o robustezza. Distinguere "conciso" (buono) da "compresso/criptico" (cattivo) e da "verboso" (cattivo).
- **Esempi**:
  - **(1) WITH-hint** — task: *"semplifica questa funzione mantenendo stesso comportamento e stessa sicurezza"* + codice gonfio (variabili temporanee inutili, doppi controlli ridondanti, branch che non si raggiungono mai).
    - *Hint forte (vincolo esplicito utente)*: *"Punta all'economia di codice: rimuovi il superfluo (variabili intermedie inutili, controlli ridondanti, branch morti) MA mantieni esattamente lo stesso valore funzionale E lo stesso livello di sicurezza/robustezza — non rimuovere validazioni o error handling per accorciare."*
    - *Hint medio*: *"Rendi il codice più conciso senza perdere funzionalità né sicurezza."*
    - *Hint debole*: *"Togli il superfluo."*
    - Atteso: la versione snella che fa **esattamente** quello che faceva prima, validazioni incluse, ma senza i 90 righe di rumore.
  - **(2) WITHOUT-hint** — *"questa funzione è troppo lunga, scrivila meglio"*: economia applicata da sé, **preservando** sicurezza e valore senza che glielo si ricordi.
  - **(3) WRONG — awareness** — due bersagli opposti da giudicare:
    - codice **gonfio**: 100 righe con 8 variabili temporanee monouso, un `if x == True: return True else: return False`, try/except che riavvolgono lo stesso errore. *"sloppy perché: bloat — la stessa logica sta in 6 righe; le temp non aggiungono chiarezza; il pattern booleano è ridondante."*
    - codice **iper-compresso pericoloso**: un one-liner che accorcia **rimuovendo una validazione** o un check di sicurezza. *"sloppy/pericoloso perché: ha barattato la sicurezza per la brevità — viola il vincolo 'stesso valore + stessa sicurezza'."*
  - **(4) WRONG — recovery** — dal codice gonfio → versione concisa, spiegando ogni taglio E **verificando** che ogni rimozione non tolga né valore né un controllo di sicurezza (rimozione giustificata una per una). Se un "taglio" toglieva una validazione, lo si **ripristina**.
  - **(5) OTHER** — **code-golf** (anti-pattern opposto): comprimere a tutti i costi in un one-liner illeggibile (nested ternari, side-effect dentro comprehension) → riconoscere che l'economia ha un **limite di leggibilità**: "conciso" non è "minimo numero di caratteri". Trade-off contestuale: la soglia tra conciso e criptico dipende dal lettore/team.
- **Fase curriculum**: Fase 2 (esercizi "gonfio → snello" con test che fissano valore + sicurezza) + classe (3)/(4) come "gioco" auto-critica vs teacher.
- **Reward design (Q+L, struttura nota utente)**: **nucleo Q** = i test **(funzionali + di sicurezza)** devono restare verdi → la versione concisa deve avere **stesso valore** (test funzionali) e **stessa sicurezza** (test/scanner di sicurezza: le validazioni rimosse fanno fallire un test di sicurezza). Dato il gate Q superato, **layer L** = preference/judge premia la versione **più essenziale a parità di valore+sicurezza** (no bloat), con **penalità di leggibilità** per il code-golf (classe 5). Si può aggiungere un segnale Q ausiliario "lunghezza" ma **solo subordinato** ai gate (vedi hack-check).
- **Hack-check (OBBLIGATORIO)**: premiare la **brevità** (meno righe/token) è il reward-hack più ovvio di questa foglia → il modello **accorcia rimuovendo validazioni, error handling o casi limite** (esattamente lo scenario "pericoloso" della classe 3) o produce code-golf illeggibile (classe 5). Difese, in ordine: (a) la lunghezza **non è mai reward diretto**; è ammessa solo come tie-breaker **dopo** che i gate Q valore+sicurezza sono superati; (b) **test di sicurezza dedicati** che falliscono se una validazione sparisce (così "più corto rimuovendo un check" = reward negativo); (c) preference pairwise con un candidato code-golf che il judge deve **rifiutare** per illeggibilità; (d) reward ancorato all'OUTCOME (stesso comportamento + stessa robustezza, più essenziale) — mai al conteggio caratteri. → [[../concepts/reward-hacking-mitigation]].

---

## DRY / No-Duplicated-Logic

- **Foglia**: `code-quality / dry-no-duplicated-logic`. **Tag**: **Q** (verificabile: la logica duplicata esiste o no) **+ L** (giudizio su *quale* astrazione). Origine: nota utente 2026-06-23 — *"verifica la codebase PRIMA di scrivere; riusa, non re-inventare"*. **Nota di scope**: qui il focus è *non duplicare logica nello stesso artefatto / riusare quella ovvia a portata*; la versione **repo-level** (cercare attivamente nella codebase prima di scrivere, navigazione/ricerca) vive in [[area-13-swe-repo-level|Area 13]] (`DRY / reuse-before-write`). Le due si rimandano.
- **Skill target (segnale)**: **non duplicare** logica — riconoscere quando due blocchi fanno la stessa cosa ed estrarre una funzione/util condivisa; **riusare** codice esistente invece di re-implementarlo; ma anche sapere **quando** la duplicazione è accettabile (la "regola del tre", evitare l'astrazione sbagliata che accoppia cose solo accidentalmente simili).
- **Esempi**:
  - **(1) WITH-hint** — task: *"aggiungi la funzione di export in CSV; nel modulo esiste già `export_to_json`"*.
    - *Hint forte (verifica-prima, da nota utente)*: *"Prima di scrivere, controlla se nel codice esiste già logica riusabile (qui c'è `export_to_json`): estrai la parte comune (raccolta/formattazione dei dati) in un helper condiviso e riusala; NON ricopiare la logica di serializzazione duplicandola."*
    - *Hint medio*: *"Riusa la logica esistente, non duplicarla."*
    - *Hint debole*: *"Occhio alle duplicazioni."*
    - Atteso: estrazione di `_collect_export_rows()` condiviso tra `export_to_json` e `export_to_csv`; non due funzioni che ripetono la stessa raccolta dati.
  - **(2) WITHOUT-hint** — *"aggiungi l'export in CSV"* (senza dirgli che esiste già il JSON): il modello deve **spontaneamente** verificare cosa c'è e riusare. (La ricerca attiva nel repo è la skill di Area 13; qui basta che, vista la presenza, riusi).
  - **(3) WRONG — awareness** — gli si mostra una codebase con la **stessa validazione email** copia-incollata in 4 punti, ognuna leggermente divergente (una accetta `+`, un'altra no). Deve **giudicarla**: *"sloppy: logica duplicata in 4 punti già divergenti → un fix va applicato 4 volte e qualcuno verrà dimenticato (fonte di bug); va estratta UNA `validate_email`."*
  - **(4) WRONG — recovery** — la validazione quadruplicata → **dedup**: estrai `validate_email` unica, sostituisci le 4 occorrenze, **riconcilia** le divergenze (decidi la regola corretta), verifica che i test di tutti e 4 i call-site passino. Spiega ogni mossa.
  - **(5) OTHER** — **DRY troppo aggressivo / astrazione sbagliata** (anti-pattern opposto): unificare due blocchi che *sembrano* uguali oggi ma rispondono a requisiti **diversi** (es. "validazione email utente" e "validazione email di fatturazione" che evolveranno diversamente) → l'astrazione prematura crea accoppiamento e poi parametri-flag che la sporcano ("the wrong abstraction is worse than duplication"). Riconoscere la **regola del tre** e la differenza tra duplicazione *incidentale* e *essenziale*. Trade-off contestuale.
- **Fase curriculum**: Fase 1 (principio DRY + regola-del-tre + "verifica prima" a teoria) + Fase 2 (esercizi dedup con codebase data) + Fase 3 (RL repo-level con Area 13: la ricerca attiva pre-scrittura premiata sull'harness).
- **Reward design (Q + L)**: **Q (oggettivo)** = rilevamento di **logica duplicata** — clone detection / similarità AST tra blocchi: se la soluzione del modello introduce un blocco quasi-identico a uno già presente, è penalizzata; se riusa/estrae, premiata (verificabile). **L** = judge sul **giudizio dell'astrazione** (l'estrazione è sensata o è l'astrazione sbagliata della classe 5?) + preference pairwise (dedup-buono vs over-DRY). Q prerequisito: dopo dedup, **tutti** i test dei call-site coinvolti restano verdi.
- **Hack-check (OBBLIGATORIO)**: premiare "**meno duplicazione**" in modo monotono spinge all'**over-DRY** (classe 5): il modello accorpa tutto, crea god-helper con 12 flag booleani, accoppia codice indipendente → reward-hack della metrica di similarità. Inoltre il modello potrebbe "**nascondere**" la duplicazione rendendola sintatticamente diversa (stessa logica, nomi diversi) per ingannare il clone-detector. Difese: (a) la metrica di duplicazione entra come **vincolo a U**, non come reward monotono (un minimo di duplicazione incidentale è OK); (b) il clone-detector lavora su **similarità semantica/AST**, non solo testuale (resistente al rename); (c) il judge L penalizza esplicitamente l'astrazione-sbagliata e i flag-parameter; (d) preference pairwise con un candidato over-DRY che va rifiutato. → [[../concepts/reward-hacking-mitigation]].

---

## Regime-Meta-Awareness (train vs prod)

- **Foglia**: `code-quality / regime-meta-awareness`. **Tag**: **L**. Origine: nota 3 [[../concepts/_user-notes-2026-06-23]] — *"i nomi casuali sono un anti-pattern, va bene per il training ma per l'operatività usa best practices (nomi auto-esplicativi)"*. Collega a [[../concepts/runtime-symbol-randomization-training]].
- **Skill target (segnale)**: **distinguere il regime di training dal regime operativo**. Il modello è addestrato con **nomi-variabile random** (per allenare la copia chirurgica dei simboli, [[../concepts/runtime-symbol-randomization-training]] / [[area-05-code-correctness|Area 5]] symbol-precision) — ma deve **sapere** che quello è un **anti-pattern valido solo per il training**: quando *produce* codice in operatività deve usare **best practice** (nomi auto-esplicativi, foglia Readability/Naming di quest'area). È la meta-cognizione che impedisce di "imparare la lezione sbagliata" dal regime random.
- **Esempi**:
  - **(1) WITH-hint** — il prompt di training porta l'**awareness meta** (verbatim nota 3): *"Stai venendo addestrato a programmare. In questi esempi le variabili hanno nomi casuali APPOSTA, per allenarti a non sbagliarle (copia chirurgica). Questo è un anti-pattern valido SOLO per il training: in operatività usa best practice (nomi auto-esplicativi)."* + task con simboli random da copiare con precisione.
    - *Hint forte*: il paragrafo completo sopra (regime esplicito + perché + cosa fare in prod).
    - *Hint medio*: *"Nota: i nomi random sono solo per l'esercizio; in produzione useresti nomi chiari."*
    - *Hint debole*: *"(esercizio di precisione sui simboli)"*.
  - **(2) WITHOUT-hint** — task con nomi random **senza** la meta-istruzione: il modello deve, da sé, (a) copiare i simboli random con precisione **in questo task** e (b) **non interiorizzare** che i nomi random siano lo stile da produrre. La verifica del (b) avviene con un task successivo "scrivi tu da zero" dove ci si aspetta nomi **buoni**.
  - **(3) WRONG — awareness** — gli si mostra una traiettoria dove il modello, **dopo** training sui nomi random, in un task operativo *genera spontaneamente* variabili `a7`, `q_3`, `tmp_x` per codice nuovo. Deve **riconoscerlo**: *"errore di regime: ha trasferito l'anti-pattern del training (nomi random) all'operatività; in produzione i nomi vanno auto-esplicativi — ha confuso il regime di esercizio con quello reale."*
  - **(4) WRONG — recovery** — dato il codice operativo con nomi random della (3) → **corregge** rinominando in nomi di dominio auto-esplicativi, **spiegando il perché**: *"il regime random serviva solo ad allenare la copia; qui sto producendo, quindi applico la best practice di naming."* Lega esplicitamente alla foglia Readability/Naming e a [[../concepts/scuola-learning-philosophy]] ("a scuola fai esercizi artificiali che non rifaresti così nella vita reale").
  - **(5) OTHER** — generalizzazione del principio ad **altri anti-pattern solo-training**: es. output **char-spaced** (`s t r a w b e r r y`) usato negli esercizi char-level (nota 7) — è formato di training, non di produzione; oppure prompt deliberatamente ambigui usati per allenare il "chiedi chiarimenti" — non significa che in prod si debba essere ambigui. Skill: riconoscere la **classe** "artefatto didattico ≠ pratica operativa", non solo il caso dei nomi.
- **Fase curriculum**: **Fase 1** (la meta-istruzione di regime è prompt engineering del dataset, costo ~0 — va nel system prompt degli esempi random) + **Fase 2** (verifica del transfer corretto: esercizi random ↔ task di produzione liberi). È una **meta-skill** che protegge l'integrità delle altre foglie di quest'area.
- **Reward design (L)**: **judge** su due segnali. (a) **In task random**: il modello copia i simboli con precisione (questo è Q, ma è di [[area-05-code-correctness|Area 5]]; qui non lo si re-premia). (b) **In task di produzione successivi** (il vero test della meta-awareness): il **naming è buono** → giudicato dalla rubric della foglia Readability/Naming. La meta-awareness si misura come **assenza di leakage del regime random nei task operativi** (preference: codice operativo ben-nominato ≫ codice operativo con nomi random-style). Opzionale: chiedere al modello di **esplicitare** che riconosce il regime (Fase 1) come segnale di processo.
- **Hack-check (OBBLIGATORIO)**: rischio sottile e **opposto** al solito — se si premiasse troppo "usa sempre nomi lunghi/auto-esplicativi", il modello potrebbe applicarlo **anche dentro i task random**, **rovinando la copia chirurgica** (sostituendo i simboli random con "nomi migliori" → fallisce symbol-precision di Area 5). Il reward deve essere **context-gated dal regime**: nei task random vince la precisione (Area 5), nei task operativi vince il naming (Readability). Difese: (a) il segnale di naming-quality è attivo **solo nei task di produzione**, mai nei task di copia-random; (b) preference pairwise costruite per regime; (c) verificare che il modello **non "corregga" i nomi random** quando il task chiede copia esatta (sarebbe un hack della rubric di naming a danno della correttezza). Scorer ≠ scored, e il regime determina quale scorer è attivo. → [[../concepts/reward-hacking-mitigation]].

---

## Note di chiusura (cross-foglia)

- **Pattern reward ricorrente in tutta l'Area 6**: gate **Q** (compila + test verdi, e per le foglie Q+L un test/scanner specifico) → poi **judge/rubric L multi-dimensione** → **preference pairwise** col **teacher grande** come signal più robusto del judge assoluto. Le preference pairwise (codice buono vs anti-pattern dello stesso task) sono la difesa numero uno contro il reward-hacking del judge, perché spostano la domanda da "quanto è buono?" (gameable) a "quale dei due è meglio?" (più robusto).
- **Anti-pattern opposti (classe 5) ricorrenti**: ogni foglia ha un suo eccesso speculare — over-naming, over-engineering, idioma-clever, future-proofing, robustezza-fuori-scala, refactoring-churn, code-golf, over-DRY, leakage-di-regime. Insegnarli esplicitamente è ciò che impedisce al modello di "barare verso l'estremo premiato".
- **Calibrazione al tier**: production-readiness, maintainability e structure dipendono dal [[../concepts/quality-target-tiers|tier target]] (Area 1). Il "giusto livello" non è assoluto → quando il tier è ambiguo, la mossa corretta è **chiedere** (lega Area 1 + Area 9 ask-vs-proceed), non assumere il massimo.
- **Sinergie con altre aree**: la capability *refactoring* (foglia 6) è il motore di tutte le classi (4) WRONG-recovery dell'area; *DRY* si compone con [[area-13-swe-repo-level|Area 13]] (reuse-before-write repo-level); *regime-meta-awareness* protegge [[area-05-code-correctness|Area 5]] symbol-precision; il "gioco" di auto-critica vs teacher ([[README#Area 16]]) è il meccanismo di reward di fondo per tutte le foglie L.

## Sources
- [[README]] §4 Area 6 (backbone topic/foglie/tag), §3.2 (foglia canonica = template), §2 (5 classi), §4.bis (curriculum 3 fasi), §2.1 (paired/contrastive batching).
- [[_coverage-audit-2026-06-23]] §C (code economy/DRY, regime-meta-awareness).
- [[../concepts/_user-notes-2026-06-23]] (nota 3 regime-meta-awareness, nota 6b trajectory-critique, code economy/DRY).
- [[../concepts/reward-hacking-mitigation]], [[../concepts/quality-target-tiers]], [[../concepts/runtime-symbol-randomization-training]], [[../concepts/scuola-learning-philosophy]], [[../concepts/staged-curriculum-training]], [[../concepts/scientific-method-operating-protocol]].
