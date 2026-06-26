---
name: area-05-code-correctness
description: Example-space completo per le 6 foglie dell'Area 5 (Code Correctness, Tier T2/T3) — tutte Q, reward via verifier deterministico (test/exec/exact-match), con hint forte→debole, wrong-awareness/recovery e hack-check anti-overfit-ai-test.
type: taxonomy-area
tags: [training, taxonomy, area-05, code-correctness, tests, verifier]
sources: [training-taxonomy/README.md §4 Area 5, user notes 2026-06-23]
last_updated: 2026-06-25
status: generated
---

# Area 5 — Code Correctness

> **Riempimento** dell'Area 5 del backbone ([[README]] §4). Non riscrive lo schema: lo applica foglia per foglia secondo il template canonico §3. Tutte le foglie sono **Q (quantitative)** — l'esito è oggettivo (passa/non passa, compila/non compila, match esatto/no). Questo è il regime ideale per **reward verificabile** in RL/process-reward (vedi [[../concepts/scientific-method-operating-protocol]] D3): lo scorer è un esecutore deterministico, non un judge.

**Tier**: primariamente T2 (programming generalist) e T3 (verticali). **Fase curriculum** (§4.bis): teoria leggera in Fase 1 (cos'è un test, cosa significa "passa"), grosso del volume in **Fase 2** (esercizi con-hint→senza-hint), e **Fase 3** (RL agentico con verifier come reward) per le foglie più adatte al loop esecuzione→diagnosi→fix.

**Confidence sull'intero file**: la *struttura* (tag Q, verifier deterministico, hack-check) è `[EXTRACTED]` dal README §1-§4 e dall'audit. Gli *snippet concreti* e i ratio (es. "30% hidden test mutati") sono `[INFERRED]` come proposta operativa da validare con ablation.

**Hack-check trasversale a tutta l'area** (priorità utente 2026-06-23): il rischio dominante per skill Q-verificabili è l'**overfit ai test visibili** (il modello impara a soddisfare i casi mostrati, non la specifica). Difesa standard applicata a OGNI foglia, salvo dove specificato diversamente:
- **Hidden test** non mostrati nel prompt (≥50% del peso di reward sui test nascosti).
- **Property-based testing** (Hypothesis / fast-check) per coprire input non enumerati.
- **Mutazione dei test** tra train e eval (rinomina, riordino, valori diversi) per impedire la memorizzazione delle asserzioni.
- **Mutation testing** sul codice prodotto (il codice deve far fallire mutanti) per beccare test che "passano per caso".
- → [[../concepts/reward-hacking-mitigation]].

---

## Functional correctness

- **Area**: Code Correctness (A5). **Tag**: **Q**.
- **Skill target (segnale)**: produrre codice il cui **comportamento osservabile** soddisfa la specifica — l'output è corretto su tutti gli input validi, non solo sugli esempi mostrati. È la foglia-madre dell'area (HumanEval/MBPP-style: prompt/docstring → funzione che passa i test).

- **Esempi**:
  - **(1) WITH-hint** — l'hint scaffolda la *strategia di correttezza*, non la soluzione. Hint **forte→debole** (fade-out progressivo):
    - *hint forte (checklist completa)*: *"Implementa `merge_intervals(intervals)`. Prima di scrivere: (a) considera la lista vuota, (b) intervalli che si sovrappongono parzialmente, (c) intervalli annidati, (d) input non ordinato — ordina prima. Verifica mentalmente su `[[1,3],[2,6],[8,10]]` → `[[1,6],[8,10]]`."*
    - *hint medio*: *"Implementa `merge_intervals(intervals)`; ricorda di gestire lista vuota e input non ordinato."*
    - *hint debole*: *"Implementa `merge_intervals(intervals)` — pensa ai casi limite prima di consegnare."*
    - Skill scaffoldata: il riflesso di enumerare i casi della specifica prima di codificare.
  - **(2) WITHOUT-hint** — *"Implementa `merge_intervals(intervals)` che fonde tutti gli intervalli sovrapposti e ritorna la lista ordinata."* Stessa task family, nessun suggerimento sui casi: il modello deve coprirli da sé.
  - **(3) WRONG — awareness** — gli si mostra una soluzione che ordina ma **non fonde quando un intervallo è completamente contenuto** in un altro (`end = max(end, x.end)` mancante, usa `x.end` diretto). Label: *"sbagliato perché: con `[[1,10],[2,3]]` produce `[[1,3]]` invece di `[[1,10]]` — l'estremo destro non prende il massimo."* Il modello deve **riconoscere** il difetto e dire *quale input lo rivela*, senza fixare.
  - **(4) WRONG — recovery** — stessa soluzione bugata + **loop di recupero**: si esegue il test → rosso su `[[1,10],[2,3]]` → diagnosi (`end` non è il max) → patch (`end = max(end, iv[1])`) → riesecuzione → verde. Insegna il verify-loop (test rosso→diagnosi→patch→verde) → [[../concepts/scientific-method-operating-protocol]] verify-loop, [[../concepts/error-memo-system]].
  - **(5) OTHER** — composite/edge raro: specifica **sotto-determinata** (cosa fare con intervalli adiacenti `[1,2],[2,3]` — fondere o no?) → il modello deve **esplicitare l'assunzione** e implementarla coerentemente, oppure (variante adversarial) la docstring contraddice un test fornito → riconoscere la contraddizione invece di indovinare.
- **Fase curriculum**: Fase 2 (volume esercizi con-hint→senza-hint); Fase 3 (RL con verifier su HumanEval+/MBPP+ e task custom).
- **Reward design (Q → verifier deterministico)**: esecuzione su test suite. Reward = frazione di test passati, con **gate binario** sul superamento di tutti gli hidden test per il reward pieno. **Test specificati**: 3-5 test visibili (gli esempi della docstring) + **≥10 hidden test** (vuoto, singleton, tutti sovrapposti, nessuna sovrapposizione, ordine inverso, duplicati, intervalli annidati) + property-based: *"l'output non ha sovrapposizioni residue"* e *"l'unione delle lunghezze coperte è invariante rispetto all'input"*.
- **Hack-check (OBBLIGATORIO)**: overfit ai test visibili (modello hardcoda l'output degli esempi della docstring) → **hidden test pesano ≥50%** + property-based + mutation testing (il codice deve uccidere mutanti tipo `>` → `>=`). Anti-`assert True`/output-stampato-ma-non-ritornato: il verifier importa la funzione e controlla il **valore di ritorno**, non lo stdout. → [[../concepts/reward-hacking-mitigation]].

---

## Compilation / syntax validity

- **Area**: Code Correctness (A5). **Tag**: **Q**.
- **Skill target (segnale)**: emettere codice **sintatticamente valido** che compila/parsa senza errori nel linguaggio target — prerequisito di ogni altra correttezza. Include bilanciamento di parentesi/indentazione, import necessari presenti, nessun simbolo non definito a compile-time.

- **Esempi**:
  - **(1) WITH-hint** — hint **forte→debole**:
    - *forte*: *"Scrivi una funzione TypeScript `parseConfig(raw: string): Config`. Vincoli sintattici: dichiara il tipo `Config`, chiudi tutte le graffe, usa `import` corretti per `JSON`, nessuna virgola finale in posizione vietata. Deve passare `tsc --noEmit`."*
    - *medio*: *"Scrivi `parseConfig` in TypeScript; assicurati che compili con `tsc`."*
    - *debole*: *"Scrivi `parseConfig` in TypeScript — codice che compila."*
  - **(2) WITHOUT-hint** — *"Scrivi una funzione TypeScript che parsa una stringa JSON in un oggetto `Config` tipato."* Nessun riferimento alla compilazione: deve produrre codice che passa `tsc` spontaneamente.
  - **(3) WRONG — awareness** — snippet con **errore di sintassi/tipo** (graffa non chiusa, oppure `const x: number = "5"`). Label: *"sbagliato perché: `tsc` riporta TS2322 — string non assegnabile a number alla riga N."* Il modello identifica **riga ed errore del compilatore atteso**.
  - **(4) WRONG — recovery** — codice che non compila → si lancia `tsc --noEmit` → si legge l'errore → si corregge (`Number("5")` o tipo `string`) → ricompila pulito. Insegna a **leggere e agire sui messaggi del compilatore** (lega ad Area 13 test-execution & iteration).
  - **(5) OTHER** — edge: codice valido in Python 3.12 ma non 3.8 (es. `match` statement, walrus, PEP 695 generics) → **version-awareness** della validità sintattica; oppure codice che parsa ma usa una keyword come identificatore (`class = 1`) → riconoscere reserved word (collega al language-aware blacklist di [[../concepts/runtime-symbol-randomization-training]] §reserved keywords).
- **Fase curriculum**: Fase 1-2 (è una skill di base, alto volume presto). Fase 3 marginale (il verifier compile è cheap, ottimo come gate pre-reward).
- **Reward design (Q → verifier deterministico)**: **gate binario** = il sorgente passa il parser/compiler (`python -c "compile(...)"`, `tsc --noEmit`, `rustc --emit=metadata`, `node --check`). Nessun giudizio: o compila o no. **Test**: invocazione del compiler/parser ufficiale; per linguaggi interpretati, AST-parse + import-resolution. Questo gate è **prerequisito** del reward di tutte le altre foglie.
- **Hack-check (OBBLIGATORIO)**: rischio "compila ma è vuoto/`pass`" → il gate sintattico da solo è hackerabile con stub. Difesa: **mai usare la compilazione come reward terminale isolato**; è solo un gate moltiplicativo davanti al reward funzionale (foglia precedente). Anti-`# type: ignore` / `as any` per silenziare il type-checker → contare e penalizzare le soppressioni di tipo (suppress = no reward pieno). → [[../concepts/reward-hacking-mitigation]].

---

## Edge-case handling

- **Area**: Code Correctness (A5). **Tag**: **Q**.
- **Skill target (segnale)**: gestire **input degenerati e di confine** — vuoto, `null`/`None`, zero, negativi, valore massimo/minimo, collezioni a un elemento, duplicati, Unicode, overflow numerico, e (dove rilevante) accesso concorrente. È la skill che separa "passa l'happy path" da "robusto".

- **Esempi**:
  - **(1) WITH-hint** — hint **forte→debole** (questo è l'hint canonico citato nel task: *"gestisci input vuoti/null/boundary"*):
    - *forte*: *"Implementa `average(nums)`. Gestisci esplicitamente: lista vuota (ritorna `None`, non dividere per zero), `None` in input (solleva `TypeError`), un solo elemento, numeri molto grandi (evita overflow), e valori negativi."*
    - *medio*: *"Implementa `average(nums)`; gestisci lista vuota e null."*
    - *debole*: *"Implementa `average(nums)` in modo robusto ai casi limite."*
  - **(2) WITHOUT-hint** — *"Implementa `average(nums)` che calcola la media di una lista di numeri."* Il modello deve **anticipare** lista vuota e `None` senza che glielo si dica.
  - **(3) WRONG — awareness** — soluzione `return sum(nums)/len(nums)`. Label: *"sbagliato perché: con `nums=[]` solleva `ZeroDivisionError`; con `nums=None` solleva `TypeError` non gestito. La specifica richiede `None` per lista vuota."* Riconoscimento del caso degenere mancante.
  - **(4) WRONG — recovery** — la stessa soluzione → hidden test `average([])` rosso (`ZeroDivisionError`) → diagnosi (manca guard sul vuoto) → patch (`if not nums: return None`) → verde; poi secondo test `average(None)` rosso → ulteriore guard → verde. Verify-loop multi-iterazione.
  - **(5) OTHER** — edge raro/concorrenza/overflow/composite:
    - *overflow*: in un linguaggio a interi fissi (Rust `i32`, Java `int`), `sum` di molti valori grandi → overflow silenzioso → usare tipo wide o checked add.
    - *concorrenza*: contatore condiviso incrementato da N thread senza lock → race condition; il fix richiede `Mutex`/atomic. Riconoscere che il test "a volte passa" è il sintomo.
    - *Unicode*: `reverse` di una stringa con emoji/grapheme cluster → invertire code point spezza i caratteri compositi.
- **Fase curriculum**: Fase 2 (volume), Fase 3 (RL con hidden edge test e property-based — molto efficace qui).
- **Reward design (Q → verifier deterministico)**: test suite **dominata da edge case nascosti**. **Test specificati**: visibili = happy path; **hidden = `[]`, `[x]`, `None`, valori al boundary del tipo (`INT_MAX`, `INT_MIN`), duplicati, input enorme (timeout-guarded)**. Property-based (Hypothesis/fast-check): genera input casuali inclusi degeneri e verifica invarianti (es. *"average ∈ [min, max] quando non vuoto"*). Per la concorrenza: stress test ripetuto N volte / ThreadSanitizer dove disponibile (nota: il non-determinismo va gestito con run multipli, non con singolo pass).
- **Hack-check (OBBLIGATORIO)**: il modello potrebbe **enumerare i casi che ha visto** (catena di `if input == [] ... elif input == [5] ...`) invece di gestire la *classe* del caso → **property-based con input random** rende impraticabile l'enumerazione; **mutazione dei valori** di confine tra train ed eval. Anti-`try/except: pass` che maschera ogni errore facendo "passare" → penalizzare bare-except che inghiotte eccezioni; i test devono verificare il **comportamento atteso** sul caso limite (es. che `None` sia ritornato), non la semplice assenza di crash. → [[../concepts/reward-hacking-mitigation]].

---

## Symbol/variable precision

- **Area**: Code Correctness (A5). **Tag**: **Q**.
- **Skill target (segnale)**: **copiare esattamente** dal contesto i nomi di simboli (variabili, funzioni, classi) forniti nel prompt, senza alterarli, abbreviarli o "normalizzarli". È la skill che il [[../concepts/runtime-symbol-randomization-training|regime di runtime symbol randomization]] mira a forzare: attention chirurgica nel copy, perché i nomi sono random e mai ripetuti → la memorizzazione è impossibile, resta solo l'induction head che cita dal contesto.

- **Esempi**:
  - **(1) WITH-hint** — hint **forte→debole**. Nota: qui l'hint riguarda la *precisione di citazione*, non la logica:
    - *forte*: *"Nel prompt sono definite `frx_q9z()`, `tmp_kk2()`, `xyz_var()`. Copia i nomi ESATTAMENTE come scritti — non correggere, non abbreviare, non rinominare. Scrivi una funzione `dispatch(cond)` che chiama `frx_q9z()` se cond=='A', `tmp_kk2()` se 'B', `xyz_var()` se 'C'."*
    - *medio*: *"Usa esattamente i nomi delle funzioni definiti sopra in `dispatch`."*
    - *debole*: *"Scrivi `dispatch(cond)` usando le funzioni date."*
  - **(2) WITHOUT-hint** — context con definizioni a nomi random + *"scrivi lo switch/dispatcher che le richiama secondo la condizione"*, senza alcun avviso sulla precisione. Il modello deve citare i nomi esatti spontaneamente.
  - **(3) WRONG — awareness** — traiettoria in cui il modello "ripulisce" un nome random: il prompt definisce `v_a3f8b2c1` ma la soluzione chiama `v_a3f8b2c` (un char in meno) o lo rinomina in `helper`. Label: *"sbagliato perché: `NameError: v_a3f8b2c is not defined` — il nome citato non corrisponde a quello in contesto (manca '1' finale)."* Riconoscere il **drift del simbolo**.
  - **(4) WRONG — recovery** — stessa soluzione → esecuzione → `NameError` → diagnosi (confronto carattere-per-carattere col contesto) → correzione del nome → verde. Insegna a verificare la citazione contro la fonte, non contro la memoria.
  - **(5) OTHER** — edge raro/composite:
    - **nomi quasi-collidenti** nel contesto (`tmp_kk2` e `tmp_kk2_` e `tmpkk2`) → disambiguazione esatta richiesta.
    - **case-sensitivity** (`MyVar` vs `myvar`) in linguaggi case-sensitive.
    - **shadowing**: un nome random definito due volte in scope diversi → citare quello giusto per scope.
    - cross-tier: lo stesso pattern vale per Tier 1 (task id / asset id random) — vedi tabella scope in [[../concepts/runtime-symbol-randomization-training]] §scope.
- **Fase curriculum**: Fase 2 (cuore del regime random, alto volume, generato runtime mai-due-volte-uguale). La skill di copy è SFT; il "dare bei nomi" arriva dopo via RL (Fase 3) — vedi distinzione memorization vs skill nel concept.
- **Reward design (Q → verifier deterministico)**: **exact-match dei simboli** + esecuzione. Due livelli: (a) **AST/diff check** — i nomi referenziati nell'output ∈ insieme dei nomi definiti nel contesto, match esatto carattere-per-carattere (binario); (b) **exec** — il codice gira senza `NameError`/`ReferenceError`. **Test**: dato il set di nomi random iniettati, il verifier estrae i `Name`/`Call` dall'AST dell'output e li confronta esattamente. Metrica primaria: *"% match esatto dei nomi citati dal contesto"* (la metrica proposta nel concept, open question §eval).
- **Hack-check (OBBLIGATORIO)**: due rischi specifici di questa foglia. (1) **Statistical memorization** se il vocabolario random è piccolo → mitigato da vocab enorme/hash-based naming (milioni di permutazioni, vedi concept §vocabolario). (2) **Shortcut sul pattern del generatore** (il modello impara "ogni token che inizia con `v_` è una variabile" invece di leggere il contesto) → **mix di strategie di naming** (hash / wordlike / snake natural / camel / single-letter, vedi concept §generate_identifier) per impedire il riconoscimento del prefisso. Il reward è già exact-match deterministico (non hackerabile da un judge), ma va impedito che diventi exact-match *memorizzato*: **mai ripetere lo stesso sample** (runtime generation). → [[../concepts/reward-hacking-mitigation]], [[../concepts/runtime-symbol-randomization-training]].

---

## API / signature correctness

- **Area**: Code Correctness (A5). **Tag**: **Q**.
- **Skill target (segnale)**: rispettare il **contratto** di una funzione/metodo/endpoint — firma esatta (nome, ordine e tipi dei parametri, default, tipo di ritorno), uso corretto delle API di libreria (argomenti giusti, keyword corrette, versione dell'API). Distinta da functional-correctness: qui il focus è il **contratto/interfaccia**, non solo l'output.

- **Esempi**:
  - **(1) WITH-hint** — hint **forte→debole**:
    - *forte*: *"Implementa una funzione con questa firma ESATTA: `def fetch(url: str, *, timeout: float = 5.0, retries: int = 3) -> Response`. `timeout` e `retries` sono keyword-only. Usa `requests.get(url, timeout=timeout)` (il parametro si chiama `timeout`, non `timeout_s`). Ritorna un oggetto `Response`."*
    - *medio*: *"Implementa `fetch` con firma `(url, *, timeout=5.0, retries=3) -> Response`, usando `requests`."*
    - *debole*: *"Implementa `fetch` rispettando la firma richiesta e l'API di `requests`."*
  - **(2) WITHOUT-hint** — *"Implementa una funzione `fetch` che scarica un URL con timeout e retry configurabili e ritorna la Response."* Il modello deve **inferire una firma sensata** e usare correttamente l'API della libreria (nomi dei parametri reali).
  - **(3) WRONG — awareness** — soluzione che usa `requests.get(url, timeout_sec=timeout)` (parametro inesistente) o ritorna un `dict` invece di `Response`, o inverte l'ordine dei posizionali. Label: *"sbagliato perché: `requests.get()` non ha parametro `timeout_sec` (è `timeout`) → `TypeError`; inoltre il tipo di ritorno viola il contratto `-> Response`."*
  - **(4) WRONG — recovery** — soluzione con firma errata (parametro posizionale dove la spec vuole keyword-only) → il **signature-test** fallisce (`inspect.signature` mismatch) e/o `TypeError` a runtime → diagnosi → correzione firma (`*` per keyword-only) → verde.
  - **(5) OTHER** — edge/composite:
    - **API versioning**: `pandas.DataFrame.append` (rimosso in 2.0) vs `pd.concat` → usare l'API valida per la versione dichiarata.
    - **contratto di tipo sottile**: una funzione documentata `-> Iterator` ma implementata con `return list(...)` (viola lazy contract) → riconoscere la differenza semantica.
    - **overload/optional**: parametro opzionale con default mutabile (`def f(x=[])`) — anti-pattern che viola implicitamente il contratto.
- **Fase curriculum**: Fase 2 (esercizi su firme e API note); Fase 3 (RL con verifier su signature + esecuzione contro librerie reali, BigCodeBench-style library calls).
- **Reward design (Q → verifier deterministico)**: **signature-check + exec**. (a) `inspect.signature(fn)` (Python) / type-level check (`tsc`) confrontato con la firma attesa (nomi param, kind posizionale/keyword-only, default, annotazioni di tipo) — binario; (b) chiamate di libreria validate eseguendo contro la libreria reale (o mock con spec stretta che rifiuta kwargs sconosciuti). **Test**: signature-equality test + esecuzione + (per le API) `assert_called_with(...)` su mock `spec=`. Il return-type si verifica con `isinstance`/type-checker.
- **Hack-check (OBBLIGATORIO)**: rischio "**firma giusta, corpo vuoto/`pass`**" che passa il solo signature-test → il signature-check è **gate**, non reward terminale: va combinato col funzionale. Rischio "mock troppo permissivo" (un mock senza `spec=` accetta qualunque kwarg, nascondendo l'errore di API) → usare `autospec=True`/`spec=`. Anti-overfit ai nomi-parametro mostrati → variare i nomi delle firme tra train ed eval mantenendo la *struttura* del contratto. → [[../concepts/reward-hacking-mitigation]].

---

## No introduced bugs (regression)

- **Area**: Code Correctness (A5). **Tag**: **Q**.
- **Skill target (segnale)**: modificare codice esistente (aggiungere una feature, fixare un bug, refactor) **senza rompere** funzionalità già funzionanti — la suite di test pre-esistente resta verde dopo la modifica. È la correttezza *differenziale*: non basta che la nuova parte funzioni, deve non danneggiare il resto. (Stretta parente della foglia omonima in Area 13 §regression-avoidance, qui a livello di singolo modulo/funzione.)

- **Esempi**:
  - **(1) WITH-hint** — hint **forte→debole**:
    - *forte*: *"Aggiungi il supporto per lo sconto percentuale a `compute_total(items, discount=0)`. Esistono già test per `compute_total` senza sconto: NON cambiare il comportamento quando `discount=0`. Esegui l'intera suite esistente prima di consegnare e verifica che resti verde."*
    - *medio*: *"Aggiungi `discount` a `compute_total` senza rompere il comportamento esistente; gira i test prima."*
    - *debole*: *"Estendi `compute_total` con uno sconto, attento alle regressioni."*
  - **(2) WITHOUT-hint** — *"Aggiungi il supporto per lo sconto percentuale a `compute_total`."* Il modello deve **da sé** preservare il comportamento per `discount=0` ed eseguire la suite esistente.
  - **(3) WRONG — awareness** — diff che cambia il default a `discount=10` o altera la firma posizionale rompendo i chiamanti esistenti. Label: *"sbagliato perché: il test `test_total_no_discount` ora fallisce — cambiare il default ha rotto tutti i chiamanti che non passano `discount`. Regressione introdotta."* Riconoscere la **rottura del contratto pre-esistente**.
  - **(4) WRONG — recovery** — il diff rompe `test_total_no_discount` → si esegue la suite **completa** → rosso sul test vecchio → diagnosi (default cambiato / branch che ora si applica anche a discount=0) → patch che isola la nuova logica dietro `if discount:` mantenendo il path originale → tutta la suite verde (vecchi + nuovi test). Insegna il pattern "run-full-suite-after-change" → [[../concepts/scientific-method-operating-protocol]] verify-loop.
  - **(5) OTHER** — edge/composite:
    - **regressione di performance** (non di correttezza): la modifica passa i test funzionali ma rende O(n²) un path prima O(n) → un benchmark-test con soglia di tempo lo cattura (collega ad Area 14 efficiency).
    - **side-effect nascosto**: la modifica tocca uno stato condiviso/globale rompendo un altro modulo non coperto dai test mostrati → serve esecuzione dell'intera suite, non solo dei test toccati.
    - **flaky pre-esistente**: un test già instabile fallisce e il modello deve distinguere "regressione mia" da "flake preesistente" (non attribuirsi colpe non sue, ma neanche scartare un fallimento reale).
- **Fase curriculum**: Fase 2 (diff su moduli con suite data); Fase 3 (RL agentico con esecuzione della suite completa come reward — naturale in harness, lega ad Area 13/SWE-Bench).
- **Reward design (Q → verifier deterministico)**: **differenziale sui test**. Reward pieno richiede: (a) **tutti i test pre-esistenti restano verdi** (nessuna regressione) **E** (b) **i nuovi test della feature passano**. **Test**: si esegue la suite *prima* (baseline verde nota) e *dopo* la modifica; `regression = test che erano verdi e ora sono rossi` → ogni regressione azzera il reward (gate forte: una regressione è peggio di una feature mancante). Property-based sull'invarianza del comportamento per `discount=0`. Mutation/golden-output dei path non toccati.
- **Hack-check (OBBLIGATORIO)**: rischio grave e specifico — il modello **cancella/indebolisce i test che falliscono** per farli "passare" (commenta l'assert, cambia il valore atteso, mette `@skip`). Difese: (1) i test pre-esistenti sono **read-only / hold-out** — il verifier li ripristina dalla baseline e ignora qualunque modifica ai test fatta dal modello; (2) **diff-guard**: penalizzare qualunque edit ai file di test esistenti che riduca le asserzioni (assert rimossi, skip aggiunti); (3) **mutation testing** per assicurarsi che i test non siano stati svuotati. Anti-"passa cancellando la feature" → i nuovi test della feature sono anch'essi obbligatori. → [[../concepts/reward-hacking-mitigation]].

---

## Note di chiusura

- **Tutte e 6 le foglie sono Q** → l'intera Area 5 è il terreno d'elezione per **reward verificabile e RL** (GRPO-style: N completion per prompt, advantage relativo sull'esito del verifier — vedi [[README]] §2.1). Nessuna foglia richiede un judge L per il segnale primario; un eventuale L sul *reasoning* (qualità della diagnosi nel recovery) è secondario e opzionale.
- **Pattern di reward ricorrente nell'area**: `compile-gate × signature-gate × functional-reward`, con regression come **gate negativo forte**. La compilazione e la firma da sole non sono mai reward terminali (hackerabili con stub) — sempre moltiplicative davanti al funzionale.
- **Confidence**: struttura/tag/verifier `[EXTRACTED]`; snippet e ratio numerici `[INFERRED]`, da validare con ablation (skill `aris-experiment-plan`).
- **Forward-link generazione runtime**: la foglia *symbol/variable precision* è il punto di contatto diretto col regime random — il suo dataset si genera con la pipeline producer/consumer di [[../concepts/runtime-symbol-randomization-training]].
