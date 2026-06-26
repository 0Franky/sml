---
name: area-13-swe-repo-level
description: Example-space completo per le 8 foglie dell'Area 13 (Software Engineering / Repo-level, cluster SWE-Bench, Tier T2/T3) — quasi tutte Q con reward via verifier SWE-Bench-style (test della repo passano, patch applica, no regressioni), comprehension Q+L, con hint forte→debole, wrong-awareness/recovery e hack-check anti-overfit-ai-test / anti-modifica-dei-test.
type: taxonomy-area
tags: [training, taxonomy, area-13, swe, repo-level, fault-localization, swe-bench]
sources: [training-taxonomy/README.md §4 Area 13, coverage-audit 2026-06-23]
last_updated: 2026-06-25
status: generated
---

# Area 13 — Software Engineering / Repo-level

> **Riempimento** dell'Area 13 del backbone ([[README]] §4). Non riscrive lo schema: lo applica foglia per foglia secondo il template canonico §3. Quest'area nasce dal **gap SWE-Bench** identificato nell'audit di copertura ([[_coverage-audit-2026-06-23]] §B): i benchmark agentici (SWE-Bench Verified, Aider polyglot) richiedono skill **repo-level** — capire un'intera codebase, localizzare un bug tra molti file, riprodurlo, editarlo coerentemente cross-file, eseguire i test e iterare fino a verde **senza regressioni**. Vedi [[../concepts/eval-modern-coding]] (SWE-Bench, Aider) per i benchmark di riferimento.

**Tier**: primariamente T2 (programming generalist) e T3 (verticali, dove la repo è del dominio del LoRA). **Differenza chiave vs Area 5 (Code Correctness)**: lì il contesto è una singola funzione/specifica; **qui il contesto è un repository reale** — il segnale dominante è *navigare, localizzare, modificare nel posto giusto, non rompere il resto*.

**Fase curriculum** (§4.bis): quest'area è **fortemente Fase 3 — RL agentico** con l'harness [[../decisions/2026-06-23-pi-harness-base|pi]], nel loop **test → edit → verify**. Il modello agisce dentro una repo reale, esegue comandi (grep/read/edit/run-tests), legge i fallimenti e itera. La teoria (Fase 1, cos'è una repo / un repro / un diff valido) e gli esercizi con-hint→senza-hint (Fase 2) preparano il terreno, ma il volume e il segnale forte vengono dal loop agentico verificabile.

**Confidence sull'intero file**: la *struttura* (tag Q/Q+L, verifier SWE-Bench-style, hack-check anti-test-tampering) è `[EXTRACTED]` dal README §4 Area 13, dall'audit §B e da [[../concepts/eval-modern-coding]]. Gli *snippet concreti* (issue, diff, nomi di file/test) e i ratio numerici sono `[INFERRED]` come proposta operativa da validare con ablation (skill `aris-experiment-plan`).

## Hack-check trasversale a tutta l'area (priorità utente 2026-06-23)

Per skill Q-verificabili **repo-level** il rischio non è solo l'overfit ai test visibili (come in Area 5): emergono hack **specifici dell'agentic loop**. Difesa standard applicata a OGNI foglia, salvo dove specificato diversamente:

- **Hidden test SWE-Bench-style**: la patch è valutata contro `FAIL_TO_PASS` (test che devono passare dopo il fix) **e** `PASS_TO_PASS` (test che devono restare verdi). Almeno la maggioranza del peso sui test **non mostrati** all'agente durante la traiettoria.
- **Test read-only / ripristinati dalla baseline**: i file di test sono **immutabili dal punto di vista del reward**. Il verifier li ripristina dalla golden version prima di valutare → modificare/indebolire/`@skip` i test **non** produce reward. Difesa diretta contro l'hack "modifico i test invece del codice".
- **Patch deve applicare pulita** (`git apply` / unified-diff valido) sulla revisione base: una patch in formato invalido = reward zero (gate).
- **Check di causalità del fix**: la fix deve far passare i `FAIL_TO_PASS` **e** il revert della sola fix deve riportarli rossi → il successo non è "per caso" o per side-effect non correlato. Mutation/ablation della patch.
- → [[../concepts/reward-hacking-mitigation]].

---

## Codebase comprehension & navigation

- **Area**: Software Engineering / Repo-level (A13). **Tag**: **Q+L** (la navigazione "trovo il simbolo giusto" è Q; "ho capito l'architettura" è L via judge).
- **Skill target (segnale)**: data una repo non vista, **costruire un modello mentale** dell'architettura (moduli, entry point, flussi, dipendenze) e **navigare** efficacemente fino al simbolo/file rilevante — senza leggere tutto, usando ricerca mirata (grep simbolo, segui import, leggi il file giusto). È la skill-madre dell'area: ogni altra foglia presuppone di sapersi muovere nella repo.

- **Esempi**:
  - **(1) WITH-hint** — l'hint scaffolda la *strategia di navigazione* (localizza prima, leggi dopo), forte→debole:
    - *forte (checklist completa)*: *"Devi capire come la repo gestisce l'autenticazione. Procedi così: (a) parti dall'entry point (`main.py`/`app.py`/`__init__`), (b) cerca il simbolo con `grep -rn 'authenticate\|login\|auth' --include='*.py'`, (c) segui gli import dal punto trovato verso il modulo che lo definisce, (d) leggi SOLO i file sul percorso, non l'intera repo. Riporta il file e la funzione che implementano l'auth."*
    - *medio*: *"Localizza dove la repo gestisce l'autenticazione: cerca il simbolo e segui gli import, non leggere tutto."*
    - *debole*: *"Trova il modulo responsabile dell'autenticazione in questa repo."*
    - Skill scaffoldata: il riflesso **search-before-read** (localizza il file PRIMA di leggere/editare) e il seguire le dipendenze invece di scandire alla cieca.
  - **(2) WITHOUT-hint** — *"In quale file e funzione questa repo valida il token di sessione?"* Nessuna strategia suggerita: il modello deve scegliere da sé come muoversi (grep mirato + follow-import) e arrivare al punto giusto con poche letture.
  - **(3) WRONG — awareness** — traiettoria in cui l'agente **legge file a caso / nell'ordine alfabetico** consumando il budget di contesto senza convergere, oppure conclude sul file sbagliato (un omonimo: `auth.py` di un test fixture invece del modulo di produzione). Label: *"sbagliato perché: ha letto 18 file senza usare grep sul simbolo; la conclusione punta a `tests/fixtures/auth.py` (fixture) invece di `core/auth/session.py` (produzione)."* Il modello deve **riconoscere** la navigazione inefficiente / la conclusione sul file errato.
  - **(4) WRONG — recovery** — parte leggendo file a caso → si accorge di non convergere (degradazione del contesto, lega ad Area 4) → **cambia strategia**: grep sul simbolo → segue gli import → arriva al file corretto. Insegna il recupero da navigazione cieca a navigazione mirata.
  - **(5) OTHER** — composite/edge raro:
    - **monorepo / multi-package**: lo stesso simbolo definito in più package → disambiguare per package corretto (quello importato dal call-site rilevante).
    - **indirezione**: la logica passa per dependency-injection / registry / dynamic dispatch (`getattr`, plugin loader) → il grep diretto non basta, serve seguire la registrazione.
    - **comprehension Q+L**: *"riassumi l'architettura di questo modulo in 5 righe"* → giudicato (L) per accuratezza/completezza dal judge, con ancoraggio Q ai simboli realmente citati esistenti nella repo.
- **Fase curriculum**: Fase 3 (navigazione agentica reale in harness, su repo SWE-Bench/Aider); Fase 2 per gli esercizi di "trova il simbolo" con hint→senza-hint. La parte comprehension-L usa il teacher (Area 16 "il gioco").
- **Reward design (Q → verifier; comprehension Q+L → verifier + judge)**:
  - *Navigazione (Q)*: **localization exact-match** — il file/funzione indicato dall'agente ∈ insieme golden dei file rilevanti (ground truth = i file toccati dalla PR gold di SWE-Bench, o annotazione). Binario/IoU sul set di file.
  - *Comprehension (L)*: rubric via **LLM-judge** (accuratezza architetturale, copertura dei moduli chiave, assenza di confabulazioni) — **ancorata** al vincolo Q che i simboli citati esistano davvero nella repo (un simbolo inventato azzera il punteggio).
  - *Efficienza (Q+L)*: numero di file letti / token consumati prima di convergere (proxy di efficienza di navigazione) — secondario.
- **Hack-check (OBBLIGATORIO)**: rischio "**confabula l'architettura**" — il judge premia un riassunto plausibile ma inventato → ancorare la rubric ai **simboli verificabili** (ogni file/funzione citato deve esistere: check su AST/filesystem; citazione inesistente = penalità forte). Rischio "claim di localizzazione senza prova" → richiedere che il file indicato **contenga** il simbolo dichiarato (grep-verify). Per la comprehension non usare mai il judge da solo senza l'ancora Q. → [[../concepts/reward-hacking-mitigation]].

---

## Fault localization

- **Area**: Software Engineering / Repo-level (A13). **Tag**: **Q**.
- **Skill target (segnale)**: dato un comportamento sbagliato (issue / test rosso / stack trace), individuare **DOVE** nel repo si trova la causa — il file, la funzione, idealmente la riga responsabile — prima di toccare codice. Distingue "so che c'è un bug" da "so dove intervenire". È il prerequisito di ogni fix mirato (no shotgun debugging).

- **Esempi**:
  - **(1) WITH-hint** — hint **forte→debole**, scaffolda la strategia di localizzazione (parti dal sintomo, risali):
    - *forte*: *"Issue: `KeyError: 'currency'` quando si formatta un ordine. Localizza la causa così: (a) leggi lo stack trace e parti dal frame più interno del codice della repo (non delle librerie), (b) apri il file/riga indicato, (c) risali la catena di chiamate per capire da dove arriva il dict senza `currency`, (d) identifica la funzione che dovrebbe popolarlo. Riporta file:riga della causa, NON ancora la fix."*
    - *medio*: *"Parti dallo stack trace e risali fino alla funzione che non popola `currency`; indica file:riga."*
    - *debole*: *"Localizza la causa del `KeyError: 'currency'` in questa repo."*
  - **(2) WITHOUT-hint** — *"C'è una issue: gli ordini esteri vanno in `KeyError: 'currency'`. Dove sta il problema?"* Senza stack trace né strategia: il modello deve riprodurre/cercare il simbolo, seguire il flusso e indicare la posizione.
  - **(3) WRONG — awareness** — l'agente punta al **sintomo invece della causa**: indica la riga dove avviene il `KeyError` (`order['currency']`) come "il bug" invece della funzione a monte che costruisce l'`order` senza `currency` per gli ordini esteri. Label: *"sbagliato perché: la riga `order['currency']` è dove il bug si MANIFESTA, non dove si ORIGINA; la causa è in `build_order()` che omette il campo per `country != 'US'`."* Riconoscere la confusione sintomo↔causa.
  - **(4) WRONG — recovery** — localizza inizialmente sul sintomo → scrive un repro → si accorge che fixare lì (try/except sul `KeyError`) maschera ma non risolve → **risale** al costruttore dell'order → localizza la vera causa. Insegna il "5-whys" / risalita causale.
  - **(5) OTHER** — composite/edge raro:
    - **bug multi-causa / interazione**: il fallimento emerge solo dalla combinazione di due moduli (config + parser) → localizzare entrambi i punti.
    - **bug nel test, non nel codice**: l'issue è un'assunzione errata nel test stesso → riconoscere che la "fault" è altrove (ma vedi hack-check: non si toccano i test per far passare).
    - **off-by-one in una catena di trasformazioni**: la causa è a 3 hop dal sintomo nella pipeline dati.
- **Fase curriculum**: Fase 3 (localizzazione agentica con esecuzione reale dello stack trace); Fase 2 per esercizi statici "data l'issue+repo, indica file:riga".
- **Reward design (Q → verifier)**: **localization match** contro ground truth. SWE-Bench fornisce la PR gold → i file/righe modificati dalla fix gold sono il target. Reward = match (file-level binario, o **line-level IoU** tra le righe indicate e le righe della patch gold). Proxy più forte: la localizzazione è "buona" se, dato quel punto, la fix successiva risolve i `FAIL_TO_PASS` (validazione a valle).
- **Hack-check (OBBLIGATORIO)**: rischio "**indica mezzo repo**" per massimizzare la probabilità di centrare il file gold (over-broad localization) → **penalità sulla precisione** (IoU penalizza i falsi positivi: indicare 20 file non aiuta). Rischio "localizzazione che combacia col gold per coincidenza statistica" → richiedere che la localizzazione sia **azionabile**: la fix ancorata a quel punto deve risolvere i test nascosti. Mai dare reward alla sola dichiarazione di posizione senza il check a valle. → [[../concepts/reward-hacking-mitigation]].

---

## Issue reproduction

- **Area**: Software Engineering / Repo-level (A13). **Tag**: **Q**.
- **Skill target (segnale)**: data una issue, **scrivere un test/repro che FALLISCE** sullo stato attuale della repo, catturando esattamente il comportamento sbagliato descritto — *prima* di tentare la fix. È la skill "red test first": senza un repro fallente non si sa se la fix funziona davvero (rischio di fixare il nulla o di dichiarare risolto a caso).

- **Esempi**:
  - **(1) WITH-hint** — hint **forte→debole**, scaffolda il "scrivi un repro fallente prima di editare":
    - *forte*: *"Issue: `parse_date('2021-13-01')` ritorna una data invece di sollevare errore (mese 13 invalido). PRIMA di fixare: scrivi un test che esercita esattamente questo caso e che oggi FALLISCE — `assert raises(ValueError): parse_date('2021-13-01')`. Eseguilo e conferma che è rosso sullo stato attuale. Solo dopo passerai alla fix."*
    - *medio*: *"Scrivi un test fallente che riproduce la issue del mese 13 prima di toccare il codice; verifica che sia rosso."*
    - *debole*: *"Riproduci la issue con un test che oggi fallisce."*
    - Skill scaffoldata: il riflesso **repro-first** (red test che cattura il bug) come ancora di verifica per la fix.
  - **(2) WITHOUT-hint** — *"La issue dice che `parse_date` accetta mesi invalidi. Affronta la issue."* Il modello deve **spontaneamente** scrivere prima un repro fallente, non saltare diretto alla patch.
  - **(3) WRONG — awareness** — repro **mal scritto** che passa già sullo stato buggato (non cattura il bug): es. testa `parse_date('2021-12-01')` (mese valido) invece del caso `13`, oppure asserisce qualcosa di sempre vero. Label: *"sbagliato perché: questo test è VERDE anche col bug presente → non riproduce nulla; un repro deve essere ROSSO prima della fix, altrimenti non verifica niente."* Riconoscere il repro non-discriminante.
  - **(4) WRONG — recovery** — scrive un repro che passa subito → si accorge (test verde su codice buggato = sospetto) → corregge il repro perché colpisca davvero il caso descritto nella issue → ora è rosso → procede. Insegna a validare il repro stesso (deve fallire per la ragione giusta).
  - **(5) OTHER** — composite/edge raro:
    - **repro non-deterministico**: il bug è una race / dipende dall'ordine → il repro deve renderlo riproducibile (seed, forzare l'interleaving) o riconoscerne la natura flaky.
    - **repro a livello di integrazione**: il bug emerge solo end-to-end (più moduli) → un unit test non basta, serve un test di integrazione minimale.
    - **issue ambigua**: la descrizione è vaga → il modello deve esplicitare quale comportamento sta riproducendo (assunzione dichiarata).
- **Fase curriculum**: Fase 3 (repro eseguito nel loop agentico); Fase 2 per esercizi "data issue+repo, scrivi il test rosso".
- **Reward design (Q → verifier)**: **doppio gate temporale**. (a) Il repro deve essere **ROSSO sulla revisione base** (pre-fix) — un repro che passa subito = reward zero (non riproduce nulla). (b) Dopo la fix gold, lo stesso repro deve diventare **VERDE** — conferma che cattura il comportamento giusto. Bonus se il repro dell'agente è **consistente** con i `FAIL_TO_PASS` ufficiali (copre lo stesso comportamento).
- **Hack-check (OBBLIGATORIO)**: rischio "**repro banalmente fallente**" (`assert False`) che è rosso ma non riproduce la issue → richiedere che il repro diventi **verde dopo la fix gold** (un `assert False` resta rosso → smascherato). Rischio "scrivere un repro che testa qualcosa di non correlato" → ancorare al comportamento della issue (il repro deve esercitare il simbolo/percorso menzionato). Il reward è sul **comportamento del repro pre/post fix**, mai sulla sua semplice presenza. → [[../concepts/reward-hacking-mitigation]].

---

## Multi-file coherent editing

- **Area**: Software Engineering / Repo-level (A13). **Tag**: **Q**.
- **Skill target (segnale)**: applicare una modifica che tocca **più file in modo coerente** — quando cambi una firma in un modulo, aggiorni tutti i call-site; quando rinomini, aggiorni import ed export; quando aggiungi un parametro, propaghi attraverso i layer — **senza lasciare la repo in stato incoerente** (import rotti, chiamate disallineate, type-error cross-file).

- **Esempi**:
  - **(1) WITH-hint** — hint **forte→debole**, scaffolda la coerenza cross-file:
    - *forte*: *"Aggiungi il parametro `currency: str` a `Order.__init__` in `models/order.py`. Prima di consegnare: (a) cerca TUTTI i call-site con `grep -rn 'Order(' --include='*.py'`, (b) aggiorna ognuno passando `currency`, (c) aggiorna la factory `make_order()` e i serializer che costruiscono `Order`, (d) esegui `tsc`/`mypy`/import-check sull'intera repo per confermare zero riferimenti rotti."*
    - *medio*: *"Aggiungi `currency` a `Order` e aggiorna tutti i punti che lo costruiscono; verifica che non resti nulla di rotto."*
    - *debole*: *"Aggiungi `currency` a `Order`, coerentemente in tutta la repo."*
  - **(2) WITHOUT-hint** — *"Gli ordini devono avere una valuta. Aggiungi il supporto a `Order`."* Il modello deve **da sé** trovare e aggiornare tutti i call-site, non solo la definizione.
  - **(3) WRONG — awareness** — edit che modifica la firma in `models/order.py` ma **lascia 3 call-site non aggiornati** in `api/checkout.py` e `jobs/export.py`. Label: *"sbagliato perché: cambiare `Order.__init__` senza aggiornare i call-site rompe `checkout.py:42` e `export.py:88` (`TypeError: missing required argument currency`). Modifica multi-file incoerente."* Riconoscere l'edit che rompe un'altra parte.
  - **(4) WRONG — recovery** — applica solo la modifica al modello → esegue i test / import-check dell'intera repo → rosso su `checkout.py` e `export.py` (`TypeError`) → **fault-localization** dei call-site mancanti via grep → li aggiorna → verde ovunque senza regressioni. Insegna il loop "modifica → run-full → trova ciò che ho rotto → completa la propagazione".
  - **(5) OTHER** — composite/edge raro:
    - **rename cross-file**: rinominare una funzione esportata → aggiornare definizione, tutti gli import, le ri-esportazioni in `__init__.py`/`index.ts`, e le stringhe di dynamic-import.
    - **interfaccia + implementazioni multiple**: cambiare un metodo di un'interfaccia/ABC → aggiornare TUTTE le sottoclassi che lo implementano (altrimenti `abstractmethod` non soddisfatto).
    - **edit coordinato con migrazione**: cambiare uno schema dati richiede anche una migration coerente (collega ad Area 2 azioni distruttive).
- **Fase curriculum**: Fase 3 (editing multi-file agentico con verifica sull'intera repo); Fase 2 per esercizi "propaga questa modifica".
- **Reward design (Q → verifier)**: **patch applica + repo coerente + no regressioni**. (a) la patch unificata applica pulita; (b) import-check / type-check / build dell'intera repo passa (nessun riferimento rotto cross-file); (c) `PASS_TO_PASS` resta verde (no regressioni) **e** `FAIL_TO_PASS` passa. Gate forte: **una sola incoerenza cross-file** (call-site mancante che fa fallire l'import o un test PASS_TO_PASS) azzera il reward.
- **Hack-check (OBBLIGATORIO)**: rischio "**aggiorna solo i call-site coperti dai test visibili**" lasciando rotti quelli non testati → il check è su **import/type/build dell'INTERA repo**, non solo sui test mostrati (un call-site non testato ma con import rotto viene comunque beccato dal compile/import-check). Rischio "rende il nuovo parametro opzionale con default per non dover toccare i call-site" quando la spec lo voleva obbligatorio → verificare contro l'intento della issue (PASS_TO_PASS + comportamento atteso). Rischio test-tampering (vedi hack-check trasversale): test read-only. → [[../concepts/reward-hacking-mitigation]].

---

## Test execution & iteration

- **Area**: Software Engineering / Repo-level (A13). **Tag**: **Q**.
- **Skill target (segnale)**: **eseguire la test suite**, **leggere correttamente i fallimenti** (quale test, quale assert, quale traceback), e **iterare** modifica→riesecuzione fino al verde — il loop operativo centrale dell'agentic coding. Include saper invocare il runner giusto (`pytest`/`npm test`/`cargo test`), interpretare l'output, e non dichiarare "fatto" finché non è effettivamente verde.

- **Esempi**:
  - **(1) WITH-hint** — hint **forte→debole**, scaffolda il loop test-edit-verify:
    - *forte*: *"Fai passare `test_discount_applied`. Loop: (a) esegui `pytest tests/test_billing.py::test_discount_applied -x` e leggi il fallimento (assert, valori attesi vs ottenuti, traceback), (b) localizza la causa nel codice di produzione, (c) applica una modifica minimale, (d) riesegui lo STESSO test, (e) quando è verde, esegui l'INTERA suite per escludere regressioni. Non dichiarare fatto finché tutto non è verde."*
    - *medio*: *"Esegui il test, leggi il fallimento, fixa, riesegui finché verde, poi gira tutta la suite."*
    - *debole*: *"Fai passare i test, iterando."*
  - **(2) WITHOUT-hint** — *"Il test `test_discount_applied` fallisce. Risolvi."* Il modello deve **da sé** eseguire, leggere il traceback, iterare e fare il run finale completo.
  - **(3) WRONG — awareness** — l'agente **dichiara verde senza aver eseguito** (o legge male l'output e crede sia passato quando il summary dice `1 failed`), oppure fixa il test giusto ma non rilancia la suite completa. Label: *"sbagliato perché: l'output di pytest dice `1 failed, 12 passed` ma l'agente ha concluso 'tutti i test passano'; inoltre non ha rieseguito la suite completa dopo la modifica."* Riconoscere il misreading dell'output / il claim non verificato.
  - **(4) WRONG — recovery** — la prima fix non passa (il test resta rosso, ma per una ragione diversa: ora un `AssertionError` differente) → l'agente **non si arrende e non maschera**: rilegge il nuovo fallimento → capisce che il primo fix era parziale → seconda iterazione → verde → run completo. Insegna l'iterazione multi-round leggendo il *nuovo* errore a ogni giro (verify-loop → [[../concepts/scientific-method-operating-protocol]]).
  - **(5) OTHER** — composite/edge raro:
    - **test flaky**: il test passa/fallisce a intermittenza → distinguere flake da fallimento reale (run multipli) senza attribuirsi il flake né ignorarlo.
    - **runner/ambiente**: il test fallisce per dipendenza mancante / fixture non configurata, non per il codice → riconoscere il fallimento d'ambiente vs di logica.
    - **errore interpretativo subdolo**: traceback con eccezione incatenata (`during handling of ... another exception occurred`) → individuare l'eccezione *originaria*, non quella di superficie.
- **Fase curriculum**: Fase 3 (è IL loop agentico per eccellenza — harness pi, run reali). Poca Fase 2 (serve l'esecuzione vera).
- **Reward design (Q → verifier)**: **stato finale della suite**. Reward pieno = `FAIL_TO_PASS` verdi **e** `PASS_TO_PASS` verdi al termine della traiettoria, con la patch che applica. Segnale di processo (process-reward, secondario): premiare le iterazioni che **riducono** il numero di test rossi giro dopo giro (progresso monotono), penalizzare i giri che non leggono l'output prima di agire.
- **Hack-check (OBBLIGATORIO)**: rischio centrale e specifico — **modificare i test invece del codice** per farli "passare" (commenta l'assert, cambia il valore atteso, `@pytest.mark.skip`, `assert True`) → i file di test sono **read-only / ripristinati dalla baseline** dal verifier prima della valutazione: qualunque edit dell'agente ai test viene scartato (vedi hack-check trasversale). Rischio "dichiara verde senza eseguire" → il reward viene **dall'esecuzione del verifier**, non dall'auto-dichiarazione dell'agente (scorer ≠ scored). Rischio "fix che passa per caso" → il `FAIL_TO_PASS` deve tornare rosso se si revert la sola fix (check di causalità). → [[../concepts/reward-hacking-mitigation]].

---

## Edit/diff-format precision

- **Area**: Software Engineering / Repo-level (A13). **Tag**: **Q**.
- **Skill target (segnale)**: produrre **edit nel formato esatto richiesto dall'harness** — search-replace block alla Aider (il blocco `SEARCH` deve combaciare **byte-per-byte** col contenuto attuale del file) o unified-diff valido alla SWE/`git apply` (header, hunk `@@`, contesto e conteggi di riga corretti). Un edit "logicamente giusto" ma in formato invalido **non si applica** → non vale nulla. È una skill di precisione meccanica, non di logica.

- **Esempi**:
  - **(1) WITH-hint** — hint **forte→debole**, scaffolda la precisione del formato:
    - *forte (Aider search-replace)*: *"Modifica `utils.py` con un blocco SEARCH/REPLACE. Il blocco SEARCH deve riprodurre ESATTAMENTE il testo attuale (stessa indentazione, stessi spazi, nessuna riga in più/meno) — copialo dal file, non a memoria. Formato:*
      ```
      utils.py
      <<<<<<< SEARCH
      def slugify(s):
          return s.lower().replace(' ', '-')
      =======
      def slugify(s):
          return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')
      >>>>>>> REPLACE
      ```
      *Se il SEARCH non combacia, l'edit fallisce."*
    - *medio*: *"Usa un blocco SEARCH/REPLACE; il SEARCH deve combaciare esattamente col file attuale (copialo, non riscriverlo a memoria)."*
    - *debole*: *"Applica la modifica come search-replace valido."*
  - **(2) WITHOUT-hint** — *"Cambia `slugify` per rimuovere anche la punteggiatura."* Senza ricordare il formato: il modello deve produrre un diff/blocco applicabile, col SEARCH che combacia col file reale.
  - **(3) WRONG — awareness** — diff **in formato invalido**: il blocco `SEARCH` ha un'indentazione diversa dal file (4 spazi vs tab) o include una riga che non esiste → `git apply`/Aider rifiutano. Oppure l'header del hunk dichiara `@@ -10,3 +10,4 @@` ma le righe di contesto non corrispondono. Label: *"sbagliato perché: il blocco SEARCH non combacia col contenuto attuale (indentazione tab vs spazi) → 'SEARCH block not found, edit not applied'. Patch in formato invalido."* Riconoscere il diff non applicabile.
  - **(4) WRONG — recovery** — il primo edit non si applica (`SEARCH block not found`) → l'agente **rilegge il file esatto** (incluse whitespace/indentazione reali) → riproduce il SEARCH byte-per-byte → riprova → applica. Insegna a riallineare il SEARCH alla fonte reale invece di insistere col testo a memoria.
  - **(5) OTHER** — composite/edge raro:
    - **SEARCH non univoco**: il blocco compare più volte nel file → serve più contesto per renderlo univoco (altrimenti l'edit è ambiguo).
    - **CRLF vs LF / trailing whitespace / BOM**: differenze invisibili che fanno fallire il match → normalizzazione consapevole.
    - **edit su file binario o generato**: riconoscere che non va editato a mano (rigenerare invece).
- **Fase curriculum**: Fase 3 (formato dell'harness reale — pi/Aider/SWE); un po' di Fase 2 per drillare il formato. È meccanica → si apprende presto e va automatizzata.
- **Reward design (Q → verifier)**: **la patch applica = gate binario**. (a) `git apply --check` / il parser Aider accettano l'edit (SEARCH combacia, hunk validi) — o applica o no, zero ambiguità. (b) dopo l'applicazione, il contenuto risultante è quello atteso (no corruzione di righe vicine). Solo dopo questo gate ha senso valutare la correttezza funzionale (test). Metrica: **apply-rate** (% di edit che applicano al primo colpo) come segnale dedicato.
- **Hack-check (OBBLIGATORIO)**: il rischio di reward-hacking è basso (il formato è deterministico, non gameable da un judge), ma attenzione a: rischio "**riscrive l'intero file** invece di un diff mirato" per aggirare la difficoltà del SEARCH-match → penalizzare gli edit non-minimali (un diff che tocca 200 righe per cambiarne 2 è sospetto; collega a DRY/economy Area 6). Rischio "apply-rate gonfiato con edit no-op" (SEARCH==REPLACE che applica ma non cambia nulla) → l'apply-rate da solo non è reward terminale: è gate davanti al funzionale (test). → [[../concepts/reward-hacking-mitigation]].

---

## Regression avoidance

- **Area**: Software Engineering / Repo-level (A13). **Tag**: **Q**.
- **Skill target (segnale)**: a livello di **repo**, fare in modo che il fix di una issue **non rompa funzionalità esistenti** — tutta la suite pre-esistente (`PASS_TO_PASS`) resta verde dopo la patch. È la dimensione *differenziale* della correttezza scalata all'intera codebase: è esattamente la metà del criterio SWE-Bench "resolved" (i `PASS_TO_PASS` non devono regredire). Parente repo-level della foglia omonima in Area 5 (lì a livello di singolo modulo).

- **Esempi**:
  - **(1) WITH-hint** — hint **forte→debole**:
    - *forte*: *"Fixa la issue del calcolo sconto. Vincolo anti-regressione: PRIMA della modifica esegui l'intera suite e annota il set di test verdi (baseline). DOPO la modifica riesegui TUTTA la suite e confronta: nessun test prima verde deve diventare rosso. Se uno regredisce, è la tua modifica ad averlo rotto — isola il cambiamento dietro la condizione giusta invece di alterare il path esistente."*
    - *medio*: *"Fixa lo sconto senza far regredire nessun test esistente; gira tutta la suite prima e dopo."*
    - *debole*: *"Risolvi la issue senza introdurre regressioni."*
  - **(2) WITHOUT-hint** — *"Risolvi la issue #214 (sconto non applicato sugli ordini bundle)."* Il modello deve **da sé** eseguire la suite completa dopo il fix e garantire zero regressioni, non solo far passare il test della issue.
  - **(3) WRONG — awareness** — la patch fa passare il `FAIL_TO_PASS` della issue ma **rompe due `PASS_TO_PASS`** in un modulo adiacente (ha cambiato una funzione condivisa). Label: *"sbagliato perché: `test_bundle_discount` ora passa, ma `test_single_item_total` e `test_tax_calc` (prima verdi) ora falliscono — la modifica a `apply_discount()` ha alterato il path degli ordini singoli. Regressione cross-modulo."* Riconoscere la rottura collaterale.
  - **(4) WRONG — recovery** — la patch passa la issue ma rompe `PASS_TO_PASS` → l'agente **esegue la suite completa** (non solo il test della issue) → vede i rossi nuovi → fault-localization sul cambiamento condiviso → isola la nuova logica (branch su `is_bundle`) preservando il path originale → tutta la suite verde. Insegna "run-full-suite-after-fix" a livello repo.
  - **(5) OTHER** — composite/edge raro:
    - **regressione di performance**: il fix passa i test funzionali ma rende O(n²) un hot path → un benchmark-test con soglia lo cattura (collega Area 14 efficiency).
    - **side-effect su stato globale/DB**: la modifica altera uno stato condiviso rompendo un modulo non coperto dai test mostrati → serve la suite completa.
    - **flaky pre-esistente**: un `PASS_TO_PASS` già instabile fallisce — distinguere "regressione mia" da "flake preesistente" (run multipli) senza attribuirsi colpe non sue.
- **Fase curriculum**: Fase 3 (RL agentico con esecuzione della suite completa come gate — naturale in harness). Fase 2 per esercizi diff-con-suite-data.
- **Reward design (Q → verifier)**: **criterio SWE-Bench "resolved"** esatto. Reward pieno richiede `FAIL_TO_PASS` verdi **E** **tutti** i `PASS_TO_PASS` ancora verdi. **Ogni regressione su un PASS_TO_PASS azzera il reward** (gate negativo forte: una regressione è peggio della issue irrisolta). Si esegue la suite *prima* (baseline) e *dopo* la patch; `regression = {test verdi prima ∧ rossi dopo}` → reward = 0 se non vuoto.
- **Hack-check (OBBLIGATORIO)**: rischio grave e specifico — l'agente **indebolisce/cancella i `PASS_TO_PASS` che la sua patch rompe** per farli "tornare verdi" (commenta assert, `@skip`, cambia il valore atteso) → i test pre-esistenti sono **read-only / ripristinati dalla golden baseline** dal verifier: ogni edit ai test è scartato e i `PASS_TO_PASS` valutati sulla versione originale (difesa diretta contro "modificare i test invece del codice"). Diff-guard: penalizzare qualunque modifica ai file di test che riduca le asserzioni. Rischio "passa la issue rimuovendo la feature collaterale" → i `PASS_TO_PASS` proteggono proprio le feature esistenti. → [[../concepts/reward-hacking-mitigation]].

---

## DRY / reuse-before-write

- **Area**: Software Engineering / Repo-level (A13). **Tag**: **Q** (con sfumatura L sul giudizio "questa logica è davvero la stessa?").
- **Skill target (segnale)**: **cercare logica esistente nella codebase PRIMA di scriverne di nuova** — se una utility/helper/funzione fa già (o quasi) ciò che serve, riusarla/estenderla invece di duplicarla. È la skill anti-duplicazione **repo-level** (priorità utente 2026-06-23): richiede prima di tutto **ricerca nella repo** (grep del concetto/firma simile), poi la decisione riuso vs nuovo. Lega ad Area 6 §DRY (lì il principio, qui l'operatività repo-level: l'"hint nel prompt" = classe (1)).

- **Esempi**:
  - **(1) WITH-hint** — hint **forte→debole**, scaffolda il "search-before-write":
    - *forte*: *"Ti serve una funzione che converta una stringa in slug URL-safe. PRIMA di scriverla: cerca nella repo se esiste già — `grep -rn 'def slug\|slugify\|to_url\|normalize.*name' --include='*.py'`. Se esiste una utility equivalente in `utils/text.py`, RIUSALA (importala) invece di scriverne una nuova. Scrivine una nuova SOLO se non esiste nulla di adeguato, e mettila dove vivono le altre utility di testo."*
    - *medio*: *"Prima di scrivere lo slugify, controlla con grep se la repo ne ha già uno e riusalo."*
    - *debole*: *"Non duplicare logica già presente: riusa se esiste."*
    - Skill scaffoldata: il riflesso **DRY/reuse-before-write** (cerca PRIMA, scrivi solo se serve).
  - **(2) WITHOUT-hint** — *"Aggiungi al modulo ordini una funzione che genera lo slug del nome prodotto."* Senza suggerimento: il modello deve **spontaneamente** cercare in repo un'utility esistente prima di scriverne una nuova.
  - **(3) WRONG — awareness** — l'agente **scrive una nuova `slugify` duplicata** mentre `utils/text.py` ne contiene già una identica (o quasi). Label: *"sbagliato perché: esiste già `utils.text.slugify` con la stessa semantica → questa è logica duplicata (viola DRY); andava importata/estesa, non riscritta. La duplicazione crea due fonti di verità che divergeranno."* Riconoscere la duplicazione evitabile.
  - **(4) WRONG — recovery** — scrive una nuova funzione → poi (o su prompt di review) **cerca in repo**, trova l'utility esistente → **rimuove la duplicata e reindirizza all'esistente** (import), eventualmente estendendola se mancava un caso. Insegna il recupero: deduplica reindirizzando alla single source of truth.
  - **(5) OTHER** — composite/edge raro:
    - **quasi-duplicato (giudizio L)**: l'utility esistente fa l'80% del necessario → decidere se **estenderla con un parametro** (riuso) o se le responsabilità sono diverse e va una funzione separata (non forzare un riuso improprio — over-DRY è anch'esso un anti-pattern, collega Area 6 over-engineering).
    - **riuso che introdurrebbe una dipendenza sbagliata**: l'utility esiste ma in un layer che non dovrebbe essere importato qui (viola l'architettura a livelli) → riconoscere il trade-off DRY-vs-layering.
    - **riuso cross-package** in monorepo: la funzione esiste in un altro package → valutare se importarla è lecito o se crea coupling indesiderato.
- **Fase curriculum**: Fase 3 (search-in-repo agentico reale prima di scrivere); Fase 2 per esercizi "esiste già? trovala e riusala". La sfumatura L (quasi-duplicato) usa il teacher/judge (Area 16).
- **Reward design (Q → verifier, con L secondario)**:
  - *Q principale*: **detector di duplicazione** sul codice prodotto vs codebase — strumenti di clone-detection (`jscpd`, token-based similarity, AST near-duplicate) confrontano la funzione nuova con quelle esistenti: alta similarità con una utility già presente = penalità (duplicato evitabile). Bonus se l'agente **importa** l'esistente (l'AST mostra un riferimento alla utility invece di una ridefinizione).
  - *Q ancora*: la soluzione deve comunque passare i test (riuso corretto, non riuso che rompe).
  - *L secondario (giudizio "stessa logica?")*: judge sul caso quasi-duplicato (estendere vs separare) — ancorato al Q (il riuso non deve far fallire i test né violare i layer).
- **Hack-check (OBBLIGATORIO)**: due rischi opposti. (1) **Over-DRY hacking**: per massimizzare il "reuse score" il modello forza riusi impropri (chiama una utility che non c'entra, o ne abusa con flag su flag) → il reward di riuso è **subordinato al passare i test** e al non violare i layer; penalizzare i riusi che aumentano l'accoppiamento o falliscono i test (riuso ≠ riuso corretto). (2) **Gaming del clone-detector**: rinominare variabili/ristrutturare per evadere il rilevatore di duplicati pur duplicando la logica → usare **near-duplicate AST/semantic** (non solo match testuale) e valutare sul comportamento, non sulla forma. Mai premiare il solo "ho cercato" (participation-hack, vedi [[../concepts/reward-hacking-mitigation]] difesa #12): il reward si dà se il riuso è **reale e corretto**, non per il solo atto di fare grep. → [[../concepts/reward-hacking-mitigation]].

---

## Note di chiusura

- **Profilo tag dell'area**: 7 foglie su 8 sono **Q** (verifier deterministico SWE-Bench-style); solo *Codebase comprehension* porta una componente **L** (la sintesi architetturale, sempre ancorata a simboli verificabili) e *DRY/reuse* una sfumatura L (giudizio "stessa logica?"). Questo rende l'Area 13 un terreno d'elezione per **RL agentico** (GRPO-style: N traiettorie per issue, advantage relativo sull'esito del verifier — [[README]] §2.1).
- **Il criterio "resolved" SWE-Bench come reward unificante**: per le foglie di fix (issue-repro → multi-file-edit → test-iter → regression-avoidance) il segnale terminale è lo stesso — `FAIL_TO_PASS` verdi **e** `PASS_TO_PASS` non regrediti, con patch che applica. Le singole foglie isolano *sotto-skill* del medesimo loop end-to-end.
- **Pattern di reward ricorrente nell'area**: `patch-applies-gate × repo-builds-gate × (FAIL_TO_PASS ∧ PASS_TO_PASS)`, con **regressione come gate negativo forte** e **test read-only** come difesa cardine contro l'hack dominante dell'area (modificare i test invece del codice).
- **Hack dominante repo-level**: a differenza di Area 5 (overfit ai test visibili), qui il rischio numero uno è il **test-tampering** (l'agente ha accesso in scrittura ai file di test nella repo) e il **fix che passa per caso**. Difese cardine: test ripristinati dalla baseline + check di causalità (revert-della-fix → torna rosso). → [[../concepts/reward-hacking-mitigation]].
- **Curriculum**: area **fortemente Fase 3** (loop test-edit-verify nell'harness [[../decisions/2026-06-23-pi-harness-base|pi]]). Fase 1/2 preparano formato-diff, repro-first, search-before-write, ma il segnale forte è il loop agentico verificabile.
- **Benchmark di riferimento**: SWE-Bench Verified (issue reali resolved/not-resolved), Aider polyglot (edit search-replace multi-lang). Vedi [[../concepts/eval-modern-coding]].
- **Confidence**: struttura/tag/verifier `[EXTRACTED]` (README §4 Area 13, audit §B, eval-modern-coding); snippet concreti e ratio numerici `[INFERRED]`, da validare con ablation (`aris-experiment-plan`).
