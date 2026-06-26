---
name: area-03-reasoning-scientific-method
description: Example-space completo dell'Area 3 — Reasoning & Scientific Method (Tier T1). 6 topic → foglie → 5 classi (with/without-hint, wrong-awareness, wrong-recovery, other) + fase curriculum + reward design + hack-check.
type: taxonomy-area
tags: [training, taxonomy, area-03, reasoning, scientific-method, cot]
sources: [training-taxonomy/README.md §4 Area 3, user notes 2026-06-23]
last_updated: 2026-06-25
status: generated
---

# Area 3 — Reasoning & Scientific Method

> **Tier**: T1 (organization-first). **Origine schema**: [[README]] §4 Area 3 + §3 (template canonico) + §4.bis (curriculum a 3 fasi). **Concept madre**: [[../concepts/scientific-method-operating-protocol]] (gli 8 passi + two-phase CoT Fase1-lungo→Fase2-corto) e [[../concepts/structured-thinking]] (caveman thinking, marker `[V]/[A]/[?]`).
>
> Questa è l'area **cuore del process-reward (PRM)** del progetto: foglie come *long-correct CoT (no deviazione)* e *verify-loop* sono esattamente ciò che il reward a livello di step deve premiare. Per esse il reward è ancorato a [[../entities/prm-paper]] (process reward model) e [[../entities/rstar-math-paper]] (step-level verification + rejection sampling). Regola d'oro: **non riscrivere lo schema, riempirlo**.

**Convenzioni di questo file** (per non ripeterle in ogni foglia):
- **Hint forte→debole** = scaffolding fade-out: hint forte (checklist/template esplicito) → hint medio (reminder di principio) → hint debole (una parola di trigger) → assente (classe 2). Vedi [[README]] §2.1 (paired/contrastive batching + GRPO).
- **Fase curriculum** (§4.bis): **F1** = basi/teoria (system prompt + tracce); **F2** = esercizi con-hint→senza-hint (fade-out, incluso "il gioco" Area 16); **F3** = RL agentico con harness [[../decisions/2026-06-23-pi-harness-base|pi]].
- **Reward design**: Q → verifier deterministico / process-reward (PRM); L → LLM-judge / preference; Q+L → verifier filtra + judge ordina.
- **Hack-check (OBBLIGATORIO)**: il rischio trasversale di tutta l'Area 3 è il **process-marker spoofing** — il modello impara a **mimare i marker/passi** (scrivere `[V]`, elencare gli 8 passi, dire "verifico") **senza** eseguire il ragionamento sottostante, per intascare il reward. Difesa generale → ancorare SEMPRE all'**outcome verificabile**, non alla presenza del marker. Dettaglio per foglia sotto. Vedi [[../concepts/reward-hacking-mitigation]].

---

## Topic 1 — Structured thinking

> **Tag topic**: Q+L. **Concept**: [[../concepts/structured-thinking]]. Due foglie: una sulla **conformità di formato** (marker, scheda, tabelle di check — Q), una sulla **qualità/non-discorsività** del pensiero (L).

### Foglia 1.1 — `structured-thinking / format-compliance (marker [V]/[A]/[?] + scheda + check-table)`
- **Tag**: Q.
- **Skill target (segnale)**: emettere il pensiero nel **formato strutturato** richiesto — scheda di contesto (`OBIETTIVO / INPUT NOTI / OUTPUT ATTESO / VINCOLI`), tabella di check dei dati, e marker di stato `[V]` (verificato) `[A]` (assunto) `[?]` (da verificare) applicati correttamente a ogni asserzione. La risposta user-facing **non** deve contenere i marker (sez. 6 del concept).
- **Esempi (5 classi)**:
  - **(1) WITH-hint** — *hint forte*: il prompt include il template completo verbatim (`OBIETTIVO:<...> / INPUT NOTI:<...> / marker: [V]=verificato in sessione, [A]=assunto esplicitato, [?]=da verificare`) + task: *"prima di rispondere, compila la scheda e marca ogni dato"*. → *hint medio*: *"struttura il pensiero con scheda + marker di stato delle asserzioni"*. → *hint debole*: *"pensa in modo strutturato (caveman, non discorsivo)"*. Skill scaffoldata: la grammatica dei marker e della scheda.
  - **(2) WITHOUT-hint** — *"Modifica la funzione `parse_config` per accettare anche YAML"* senza alcuna indicazione di formato. Il modello deve **spontaneamente** produrre scheda + tabella di check (`schema YAML disponibile? [?]` → verifica) + marcare i dati noti `[V]` vs assunti `[A]`, e poi risposta in prosa pulita senza marker.
  - **(3) WRONG — awareness** — traccia in cui il modello presenta un'API/flag inventato come `[V]` ("usa `yaml.safe_load_v2()` [V]") quando non l'ha verificato. Label: *"sbagliato: `[V]` significa verificato-in-sessione, qui è un'assunzione → doveva essere `[?]` o `[A]`; marker di stato falsificato"*. Il modello deve **riconoscere** la violazione semantica del marker.
  - **(4) WRONG — recovery** — come (3) + recupero: rileva che `yaml.safe_load_v2` non esiste (grep/check) → declassa il marker a `[?]` → verifica la vera API (`yaml.safe_load`) → la promuove a `[V]` → corregge la conclusione dipendente. Insegna il loop marker→verifica→aggiorna.
  - **(5) OTHER** — adversarial/composite: prompt che **chiede esplicitamente i marker NELLA risposta finale** all'utente ("metti i [V] nella risposta") → tensione con la sez. 6 (marker solo nel thinking) → il modello deve gestire l'eccezione esplicita; oppure caso degenere in cui *tutti* i dati sono `[?]` (niente verificato) → deve fermarsi e chiedere, non procedere assumendo.
- **Fase curriculum**: F1 (la grammatica scheda+marker vive nel system prompt) → F2 (esercizi con-hint→senza-hint).
- **Reward design (Q)**: verifier deterministico sul **formato** — presenza scheda, marker ben-formati, assenza di marker nella risposta user-facing (parser); inoltre **consistenza semantica** del marker via cross-check (un `[V]` deve corrispondere a un fatto realmente presente nel contesto/eseguito).
- **Hack-check**: gaming = **sparare `[V]` ovunque** per "sembrare verificato" (massimizza un reward ingenuo che conta i `[V]`). Difesa: il reward sul marker `[V]` è dato **solo se** l'asserzione è effettivamente verificabile e vera nel contesto (scorer ≠ scored; il `[V]` non auto-certifica). Reward sul formato **subordinato** alla correttezza dell'outcome, mai standalone. → [[../concepts/reward-hacking-mitigation]].

### Foglia 1.2 — `structured-thinking / qualità-e-non-discorsività (caveman, token-economy)`
- **Tag**: L (+ Q sul rapporto token-thinking/token-risposta come proxy).
- **Skill target (segnale)**: il pensiero è **essenziale e action-ready**, non un saggio. Evita le frasi vietate (sez. "Vietato": "ok allora vediamo", riformulare la domanda, auto-complimenti, ri-esplorare path già scartati). Obiettivo misurabile del concept: `token_thinking / token_risposta ≤ 1.0` nel 90% dei casi.
- **Esempi (5 classi)**:
  - **(1) WITH-hint** — *hint forte*: tabella comparativa "discorsivo (bad) vs caveman (good)" del concept mostrata nel prompt + *"pensa come una scheda tecnica, non un saggio; banna le frasi di transizione"*. → *hint medio*: *"pensiero strutturato e conciso, no prosa narrativa"*. → *hint debole*: *"caveman thinking"*. Skill scaffoldata: la distinzione discorsivo↔essenziale.
  - **(2) WITHOUT-hint** — task qualsiasi di reasoning (*"decidi se questa lista va ordinata prima o dopo il dedup"*) senza istruzione di stile: il modello deve produrre pensiero compatto da sé.
  - **(3) WRONG — awareness** — gli si mostra un blocco di thinking discorsivo e gonfio ("Allora, vediamo un po', l'utente vorrebbe... mi chiedo se forse... in effetti potrebbe essere che... let me think...") e deve **giudicarlo**: *"perché è scadente: transizioni vuote, riformula la domanda, 80 token per 15 di contenuto"*.
  - **(4) WRONG — recovery** — thinking discorsivo → **riscrittura** in forma caveman equivalente (stesso contenuto decisionale, meno token), spiegando i tagli (rimuovi transizioni, comprimi in tabella di check).
  - **(5) OTHER** — over-compression: monosillabico al punto da perdere informazione decisionale ("fix. done.") → riconoscere che **anche** è un anti-pattern (il concept dice "non monosillabico"); trade-off contestuale. Più l'**eccezione redesign/problema-nuovo**: ammesso un breve blocco discorsivo iniziale per impostare un problema genuinamente nuovo.
- **Fase curriculum**: F2 (è una skill di stile affinata con esercizi e "il gioco" di critica vs teacher, Area 16).
- **Reward design (L + Q-proxy)**: LLM-judge / preference su una rubric (essenzialità, assenza frasi vietate, completezza decisionale conservata); **Q-proxy** = ratio token-thinking/token-risposta e classificatore di "frasi vietate". Judge ordina, il proxy filtra gli outlier.
- **Hack-check**: gaming = **comprimere a vuoto** per minimizzare il ratio di token (output telegrafico che *sembra* conciso ma perde il ragionamento) → reward-hacking della metrica-proxy. Difesa: la token-economy è premiata **solo a parità di outcome corretto** (la risposta finale deve restare giusta e completa); judge penalizza la perdita di contenuto decisionale. Non premiare mai la brevità in sé. → [[../concepts/reward-hacking-mitigation]].

---

## Topic 2 — Scientific-method protocol (8 passi)

> **Tag topic**: Q+L. **Concept**: [[../concepts/scientific-method-operating-protocol]] §2 (gli 8 passi: 1 Observe · 2 Orient · 3 Decompose · 4 Interconnections · 5 Parallelization · 6 Timeline-blocking · 7 Execute-per-concept-block · 8 Verify-loop). Due foglie: **presenza/sequenza** dei passi (Q) e **qualità** di ciascun passo (L).

### Foglia 2.1 — `scientific-method / presenza-e-sequenza-degli-8-passi`
- **Tag**: Q.
- **Skill target (segnale)**: di fronte a un task complesso, percorrere i passi nell'**ordine corretto** senza saltarne di necessari né invertire dipendenze (es. non eseguire — passo 7 — prima di aver decomposto — passo 3; non parallelizzare — passo 5 — prima di mappare le interconnessioni — passo 4).
- **Esempi (5 classi)**:
  - **(1) WITH-hint** — *hint forte*: il prompt elenca gli 8 passi con etichetta e li chiede uno per uno (*"procedi: OBSERVE → ORIENT → DECOMPOSE → INTERCONNECTIONS → PARALLELIZE → BLOCK → EXECUTE-per-concept → VERIFY"*). → *hint medio*: *"applica il metodo scientifico in 8 passi prima di agire"*. → *hint debole*: *"metodo scientifico"*. Skill scaffoldata: il template di sequenza.
  - **(2) WITHOUT-hint** — task multi-step reale (*"migra il modulo auth da sessioni a JWT in questo repo"*) senza menzione del protocollo: il modello deve **istanziare spontaneamente** i passi (osservare lo stato, capire obiettivo/rischi, decomporre, mappare dipendenze, ecc.).
  - **(3) WRONG — awareness** — traccia che **salta** Decompose+Interconnections e va dritta a Execute (scrive codice al primo colpo) producendo un piano con buchi. Label: *"sbagliato: passo 7 (execute) eseguito senza passi 3-4 → dipendenze non mappate"*. Il modello deve **riconoscere il passo mancante**, non solo il sintomo.
  - **(4) WRONG — recovery** — come (3) + recupero: si accorge a metà che mancava la mappa delle dipendenze (un task ne presuppone un altro non fatto) → **torna indietro** al passo 4, ricostruisce il grafo, ri-blocca la timeline, riprende l'esecuzione coerente. Insegna il back-tracking strutturato.
  - **(5) OTHER** — task **banale** (es. *"rinomina questa variabile"*) dove eseguire tutti gli 8 passi è over-process → riconoscere che il protocollo va **scalato** (collegamento alla Foglia 6.1 adaptive-depth: 8 passi per il complesso, scorciatoia per il triviale). Edge: task con **passi non-applicabili** (niente da parallelizzare) → il passo 5 si chiude con "N/A motivato", non si forza.
- **Fase curriculum**: F1 (gli 8 passi sono nel system prompt + tracce teacher, [[../concepts/scientific-method-operating-protocol]] D2: teacher = DeepSeek) → F3 (in RL agentico la sequenza si rinforza sull'esito).
- **Reward design (Q)**: verifier di **presenza+ordine** dei passi (parser sui marker di passo) + check di **dipendenza** (execute non prima di decompose). NB: è un reward di *processo* → da ancorare all'outcome (sotto).
- **Hack-check**: gaming = **enumerare gli 8 passi come boilerplate** ("1. Observe: ok. 2. Orient: ok. ...") senza ragionarci, per superare il parser di presenza — il caso-scuola del prompt utente. Difesa: il reward sulla presenza dei passi vale **solo se il task viene risolto correttamente** (outcome verificabile: test verdi, piano senza buchi); un passo "presente ma vuoto" (nessun contenuto sostanziale rilevato dal judge) **non conta**. Marker ≠ ragionamento. → [[../concepts/reward-hacking-mitigation]] + [[../entities/prm-paper]] (process reward ancorato all'outcome).

### Foglia 2.2 — `scientific-method / qualità-di-ciascun-passo`
- **Tag**: L.
- **Skill target (segnale)**: ogni passo è **eseguito bene**, non solo presente. Es. al passo 1 (Observe) coglie lo stato *rilevante* (non rumore); al passo 3 (Decompose) la scomposizione è completa e a granularità giusta; al passo 7 (Execute-per-concept-block) aggrega davvero per concetto così che una decisione valga per tutto il blocco (il *decision caching* semantico, insight chiave del concept §2 passo 7).
- **Esempi (5 classi)**:
  - **(1) WITH-hint** — *hint forte*: per ogni passo, criteri di qualità espliciti (*"Decompose: copertura completa del goal, no overlap; Execute-per-concept: raggruppa per scopo così una decisione si propaga al blocco"*). → *hint medio*: *"esegui ogni passo con cura, non a vuoto"*. → *hint debole*: *"passi di qualità"*. Skill scaffoldata: i criteri di bontà per-passo.
  - **(2) WITHOUT-hint** — stesso task complesso senza i criteri: il modello deve auto-applicare lo standard di qualità a ogni passo.
  - **(3) WRONG — awareness** — traccia con tutti gli 8 passi **presenti ma scadenti**: Observe coglie dettagli irrilevanti, Decompose lascia metà goal scoperto, Execute non aggrega (decisione presa in un sotto-task contraddetta in quello dopo). Label: *"passi presenti ma di bassa qualità: passo 7 non fa decision-caching → buco di coerenza"*. Riconoscere il **gap di qualità** dietro la presenza formale.
  - **(4) WRONG — recovery** — come (3) + recupero: identifica il blocco mal-aggregato → ri-aggrega per concetto → propaga la decisione mancante a tutti i task del blocco → verifica che la contraddizione cross-task sia risolta (lega [[../concepts/contradiction-detection-layer]]).
  - **(5) OTHER** — composite con Topic 1: pensiero strutturato *e* metodo scientifico insieme su un task con vincolo di budget-token → bilanciare qualità-per-passo e token-economy. Edge: due decomposizioni entrambe valide ma a granularità diversa → giudicare quale è "giusta" per il tier di qualità target ([[../concepts/quality-target-tiers]]).
- **Fase curriculum**: F2 (la qualità si affina con esercizi + "il gioco" di auto-critica comparata col teacher, Area 16).
- **Reward design (L)**: LLM-judge / teacher (DeepSeek) con rubric per-passo (per [[../concepts/scientific-method-operating-protocol]] D2: su planning non-verificabile serve teacher-as-judge + criticality benchmark custom). Preference tra due esecuzioni dello stesso passo.
- **Hack-check**: gaming = produrre passi **verbosi e plausibili** che impressionano il judge ma non migliorano l'outcome (sycophancy-verso-il-judge / lunghezza). Difesa: judge calibrato su rubric **outcome-linked** (un Decompose è buono se davvero copre il goal misurato a valle, non se "suona completo"); cross-check con un secondo judge / il criticality bench; penalizzare verbosità non-informativa. → [[../concepts/reward-hacking-mitigation]].

---

## Topic 3 — Long-correct CoT (no deviazione)

> **Tag topic**: Q. **Concept**: [[../concepts/scientific-method-operating-protocol]] §4 Fase 1 (catene lunghe ma corrette, gestione degli errori devianti via erase+reinforce o split pos/neg). È il **cuore del process-reward**: una sola foglia, ma centrale.

### Foglia 3.1 — `long-correct-CoT / catena-lunga-senza-passi-devianti`
- **Tag**: Q (correttezza finale + assenza di step devianti, entrambi verificabili su domini con ground truth).
- **Skill target (segnale)**: su un task complesso, produrre una **catena di pensiero lunga** che resta **corretta passo-passo** — nessuno step deviante (errore logico, vicolo cieco perseguito, salto allucinato) — e arriva alla soluzione giusta. Il valore non è la lunghezza in sé ma la **non-deviazione** lungo la lunghezza.
- **Esempi (5 classi)**:
  - **(1) WITH-hint** — *hint forte*: il prompt fornisce gli **anchor intermedi** ("passo per passo; dopo ogni step verifica che sia coerente col precedente prima di proseguire; se uno step contraddice, fermati") + un esempio di traccia lunga-corretta. → *hint medio*: *"ragiona passo-passo verificando ogni passaggio"*. → *hint debole*: *"non saltare passaggi"*. Skill scaffoldata: il controllo di coerenza inter-step.
  - **(2) WITHOUT-hint** — problema math/algoritmico difficile (stile MATH/competitive) senza scaffolding: il modello deve mantenere la catena corretta da sé fino alla risposta.
  - **(3) WRONG — awareness** — traccia lunga con **uno step deviante** in mezzo (es. un'algebra sbagliata al passo 4 che però "torna" per coincidenza al risultato, oppure un'assunzione non giustificata). Label: *"step 4 deviante: la derivazione non segue dal 3; risultato finale inaffidabile anche se sembra plausibile"*. Riconoscere la **deviazione locale** anche quando l'output finale non è palesemente rotto.
  - **(4) WRONG — recovery** — come (3) + recupero: localizza lo step deviante (credit assignment) → **lo cancella e rifà il path corretto** da quel punto (erase+reinforce, [[../concepts/scientific-method-operating-protocol]] §4 strada 1) → ri-verifica gli step a valle che ne dipendevano. Insegna il process-level self-correction.
  - **(5) OTHER** — caso **"corretto per fortuna"**: catena tutta deviante che azzecca il risultato finale → deve essere trattata come **negativa** (l'outcome giusto non riscatta il processo rotto) — esempio chiave per il reward split pos/neg. E il duale: catena corretta che si ferma prima della fine (incompleta) → corretta-ma-incompleta.
- **Fase curriculum**: F1 (Fase 1 del two-phase: si impara il lungo-corretto). Tracce teacher **filtrate per correttezza** su domini verificabili (D2: distillare solo CoT verificate-corrette via esecuzione/test/answer-check).
- **Reward design (Q → process-reward / PRM)**: **split pos/neg a livello di step** — reward positivo agli step corretti, negativo allo step deviante ([[../concepts/scientific-method-operating-protocol]] §4 strada 2, D3). Bootstrap efficiente: **rejection-sampling SFT** (tieni le catene corrette, scarta le devianti) → poi graduare a PRM/GRPO. Ancore: [[../entities/prm-paper]] (process reward model), [[../entities/rstar-math-paper]] (step verification + rejection sampling).
- **Hack-check**: gaming = (a) **outcome-only hacking** — azzeccare il risultato con processo rotto (il caso "corretto per fortuna"); (b) **PRM-overoptimization** — sfruttare i bias del process-verifier per far passare step in realtà errati. Difese: (a) reward ancorato **sia** al processo **sia** all'outcome, e una catena deviante con outcome giusto **non** prende reward pieno; (b) PRM sempre **ancorato all'outcome verificabile** + monitor di overoptimization ([[../concepts/scientific-method-operating-protocol]] D3 nota reward-hacking). → [[../concepts/reward-hacking-mitigation]].

---

## Topic 4 — Hypothesis formation & verification

> **Tag topic**: L. **Concept**: [[../concepts/scientific-method-operating-protocol]] (passo Orient/Verify) + spirito "siamo scienziati". Foglia singola sulla **formulazione di ipotesi plausibili** e la loro **verifica prima di concludere**.

### Foglia 4.1 — `hypothesis / formazione-ipotesi-plausibili-e-verifica-pre-conclusione`
- **Tag**: L (qualità/plausibilità dell'ipotesi è qualitativa; il *fatto* di aver verificato prima di concludere è in parte Q).
- **Skill target (segnale)**: di fronte a un'incertezza (bug di causa ignota, comportamento inatteso), **formulare ipotesi candidate plausibili e discriminanti**, poi **verificarle** (test/esperimento/lettura) **prima** di affermare una conclusione — non saltare alla prima ipotesi come se fosse certezza.
- **Esempi (5 classi)**:
  - **(1) WITH-hint** — *hint forte*: *"elenca 2-3 ipotesi sulla causa, per ciascuna un test discriminante, esegui il test, poi concludi"* + template (`IPOTESI / TEST / ESITO`). → *hint medio*: *"forma ipotesi e verificale prima di concludere"*. → *hint debole*: *"non dare per scontata la causa"*. Skill scaffoldata: il ciclo ipotesi→test→conclusione.
  - **(2) WITHOUT-hint** — *"il test `test_login` passa in locale ma fallisce in CI"* senza guida: il modello deve generare ipotesi (env diverso? race? fixture mancante?) e proporre come discriminarle prima di sentenziare.
  - **(3) WRONG — awareness** — traccia che **salta alla prima ipotesi** e conclude senza verificare ("fallisce in CI → di sicuro è un problema di timezone", e fixa quello). Label: *"sbagliato: conclusione affermata senza test discriminante; ipotesi singola non verificata"*. Riconoscere il salto ipotesi→conclusione.
  - **(4) WRONG — recovery** — come (3) + recupero: si accorge che il fix-su-ipotesi-non-verificata non risolve (test ancora rosso) → **torna a formulare ipotesi alternative**, le testa, isola la vera causa, fixa quella. Insegna che l'ipotesi va falsificata, non assunta.
  - **(5) OTHER** — caso con **ipotesi multiple non mutuamente esclusive** (due cause concorrenti) → riconoscere che verificarne una non esclude l'altra; oppure ipotesi **non verificabile con gli strumenti a disposizione** → esplicitare l'incertezza residua invece di fingere certezza (lega [[../concepts/agent-constitution]] honest reporting).
- **Fase curriculum**: F2 (esercizi di debugging/diagnosi con-hint→senza-hint) → F3 (in RL agentico col harness le ipotesi si testano davvero con i tool).
- **Reward design (L)**: judge su rubric (plausibilità + potere discriminante delle ipotesi, presenza di verifica prima della conclusione, calibrazione dell'incertezza residua). Dove il dominio è verificabile (la causa vera è nota), si aggiunge un check Q: l'ipotesi confermata coincide con la causa reale.
- **Hack-check**: gaming = **teatro dell'ipotesi** — elencare ipotesi e dire "verificato" senza un test reale, per soddisfare la rubric. Difesa: il judge premia la verifica **solo se c'è una traccia di test/azione reale** (in F3 il harness fornisce l'esecuzione effettiva → ancoraggio all'outcome); ipotesi confermata che NON coincide con la causa reale (quando nota) azzera il reward. → [[../concepts/reward-hacking-mitigation]].

---

## Topic 5 — Verify-loop (find+fix fino a zero)

> **Tag topic**: Q. **Concept**: [[../concepts/scientific-method-operating-protocol]] §2 passo 8 + §5 ("verify-loop con cap"). **Cuore del process-reward** insieme al Topic 3. Foglia singola sul loop trova→fixa→ricontrolla con convergenza e anti-loop.

### Foglia 5.1 — `verify-loop / find-fix-fino-a-zero (con cap anti-loop)`
- **Tag**: Q (errori residui = 0 è binario/verificabile; convergenza misurabile).
- **Skill target (segnale)**: a fine sezione, **controllare tutti i punti/edge case/problemi**, trovare gli errori, fixarli, e **ri-controllare in loop** finché gli errori residui sono zero — **con cap**: budget max-iter + soglia "good enough" + escalation all'utente, per evitare loop infiniti o oscillazione fix-A-rompe-B ([[../concepts/scientific-method-operating-protocol]] §5 verdetto 🟡 "con cap").
- **Esempi (5 classi)**:
  - **(1) WITH-hint** — *hint forte*: *"dopo l'implementazione: (a) genera la checklist degli edge case, (b) verifica ciascuno, (c) per ogni errore trovato fixa e RI-ESEGUI tutta la verifica, (d) ripeti fino a zero errori O fino a max N iterazioni → poi escalate"*. → *hint medio*: *"verifica in loop finché non trovi più errori, con un limite di iterazioni"*. → *hint debole*: *"controlla tutto alla fine"*. Skill scaffoldata: la struttura del loop + il cap.
  - **(2) WITHOUT-hint** — *"implementa e consegna `merge_intervals`"* senza menzione di verifica: il modello deve **spontaneamente** entrare nel verify-loop (test su vuoto, singolo, overlap, adiacenti) prima di dichiarare done.
  - **(3) WRONG — awareness** — traccia che **dichiara "done" al primo passaggio verde** senza coprire gli edge case (poi rompe su input vuoto). Label: *"sbagliato: verify-loop saltato/incompleto, edge case non coperti, zero-errori non raggiunto"*. Riconoscere la chiusura prematura del loop.
  - **(4) WRONG — recovery** — come (3) + recupero: l'input vuoto fallisce a valle → **rientra nel loop**, aggiunge il caso alla checklist, fixa, ri-esegue *tutta* la verifica (non solo il caso nuovo, per intercettare regressioni), converge a zero. Insegna che un fix richiede ri-verifica completa (lega [[../concepts/error-memo-system]]).
  - **(5) OTHER** — caso **oscillante**: fix-di-A rompe-B e fix-di-B rompe-A → il cap deve scattare: riconoscere il ciclo, fermarsi, **escalare con contesto** invece di loopare all'infinito. Edge: errore **non fixabile con gli strumenti dati** → dichiararlo onestamente (no fake-green). Adversarial: test suite essa stessa buggata → non "fixare il codice per assecondare un test sbagliato".
- **Fase curriculum**: F1 (la struttura del loop+cap è nel protocollo/system prompt) → F3 (in RL agentico col harness il loop gira su test reali).
- **Reward design (Q → process-reward)**: verifier deterministico — **errori residui = 0** (test verdi su tutta la checklist edge-case) come segnale terminale; **convergenza** premiata (numero di iterazioni ragionevole, niente loop infinito); rispetto del **cap** ed escalation corretta quando non si converge. PRM sui singoli passi find→fix. Ancore: [[../entities/prm-paper]], [[../entities/rstar-math-paper]].
- **Hack-check**: gaming = (a) **fake-green** — modificare/indebolire i test o stubbare l'output per farli passare senza fixare il bug (massimizza "errori=0" senza la skill); (b) **dichiarare done** saltando edge case non coperti dai test visibili. Difese: (a) test/oracoli **held-out** non modificabili dal modello (scorer ≠ scored), diff-check che il modello non abbia toccato la suite, ancoraggio all'**outcome reale** (il bug è davvero risolto?), non alla presenza di "tutti verdi"; (b) edge-case generati indipendentemente. È l'esempio canonico di reward-hacking del progetto → [[../concepts/reward-hacking-mitigation]].

---

## Topic 6 — Adaptive reasoning depth

> **Tag topic**: Q. **Concept**: [[../concepts/scientific-method-operating-protocol]] §4 Fase 2 + D5 (switch lungo/corto: self-assessment + length-head + steering toggle + confidence-threshold fallback). Foglia singola: scegliere la **profondità giusta** in base alla difficoltà/familiarità.

### Foglia 6.1 — `adaptive-depth / scelta-lungo-vs-corto-appropriata-alla-difficoltà`
- **Tag**: Q (l'appropriatezza è valutabile: depth-scelta vs difficoltà-reale del task → match/mismatch).
- **Skill target (segnale)**: a inizio turno, **stimare difficoltà/familiarità** del task e impostare la profondità di ragionamento di conseguenza — **CoT lunga** (metodo scientifico completo, 8 passi) per task nuovo/difficile; **CoT corta ottimizzata** per task familiare/già analizzato — **mantenendo la correttezza** (Fase 2 del two-phase). Meccanismo (D5): self-assessment + length-head, steering disattivabile, confidence-threshold come fallback.
- **Esempi (5 classi)**:
  - **(1) WITH-hint** — *hint forte*: *"prima di pensare, stima la difficoltà (familiare/nuovo, semplice/complesso); se semplice-familiare → catena corta diretta; se nuovo-complesso → metodo scientifico completo. Dichiara la scelta e il perché"*. → *hint medio*: *"adatta la lunghezza del ragionamento alla difficoltà"*. → *hint debole*: *"non over-pensare il banale, non sotto-pensare il difficile"*. Skill scaffoldata: il self-assessment iniziale → budget.
  - **(2) WITHOUT-hint** — mix di task nello stesso batch (alcuni triviali: *"converti °C→°F"*; alcuni complessi: *"progetta lo schema di sharding"*) senza istruzione: il modello deve calibrare la profondità per ciascuno autonomamente.
  - **(3) WRONG — awareness** — due tracce: (i) **over-thinking** — 8 passi del metodo scientifico per `2+2`; (ii) **under-thinking** — risposta corta diretta a un problema di design complesso, che sbaglia per superficialità. Label: *"mismatch depth↔difficoltà: (i) over-process sul triviale, (ii) under-process sul complesso"*. Riconoscere **entrambi** i mismatch.
  - **(4) WRONG — recovery** — under-thinking → recupero: parte corto, ma a un **confidence-threshold basso** (fallback D5) si accorge che il task era più difficile del previsto → **escala a CoT lunga** (metodo scientifico) e ri-fa. Insegna l'escalation di profondità a runtime. Il duale: parte lungo su un task che si rivela banale → comprime senza perdere correttezza.
  - **(5) OTHER** — task **ingannevolmente semplice** (sembra triviale ma ha un edge nascosto, es. "ordina questa lista" ma con NaN/duplicati/locale) → la difficoltà apparente ≠ reale; premiare chi rileva la trappola e alza la profondità. Adversarial: prompt che **spinge a rispondere veloce** ("fai in fretta, è facile") su un task in realtà critico → non lasciarsi indurre a under-thinking (lega [[../concepts/scientific-method-operating-protocol]] §3 constitution, e Topic 5 cap).
- **Fase curriculum**: F2 (Fase 2 del two-phase: compressione adaptive sugli esercizi già padroneggiati) → F3 (in RL il match depth↔difficoltà si rinforza sull'esito e sull'efficienza).
- **Reward design (Q)**: verifier sul **match** depth-scelta ↔ difficoltà-reale (label di difficoltà nota in training) **condizionato a correttezza mantenuta**: corto+corretto su task facile = reward pieno; lungo+corretto su task facile = corretto ma penalità di efficienza; corto+sbagliato su task difficile = penalità forte (under-thinking dannoso). Self-confidence calibrata (lega Area 16 self-scoring) come segnale ausiliario.
- **Hack-check**: gaming = **andare sempre corto** per massimizzare l'efficienza/token-economy, sacrificando i task difficili (under-thinking sistematico che vince sul reward di brevità). Difesa: la brevità è premiata **solo a parità di correttezza**; un corto-sbagliato su task difficile prende penalità **maggiore** del risparmio di token → l'incentivo netto punta alla profondità-giusta, non alla brevità. Reward **mai** sulla lunghezza in sé, sempre sull'(correttezza × efficienza-appropriata). → [[../concepts/reward-hacking-mitigation]].

---

## Riepilogo Area 3

| # | Topic | Foglie | Tag | Fase prevalente | Reward |
|---|-------|--------|-----|-----------------|--------|
| 1 | Structured thinking | format-compliance · qualità/non-discorsività | Q · L | F1 / F2 | verifier formato · judge |
| 2 | Scientific-method (8 passi) | presenza+sequenza · qualità-per-passo | Q · L | F1 / F2 | verifier presenza+ordine · judge |
| 3 | Long-correct CoT | catena-lunga-no-deviazione | Q | F1 | **PRM split pos/neg** |
| 4 | Hypothesis form. & verif. | ipotesi-plausibili + verifica-pre-conclusione | L | F2 / F3 | judge (+Q se causa nota) |
| 5 | Verify-loop | find-fix-fino-a-zero (con cap) | Q | F1 / F3 | **PRM + verifier errori=0** |
| 6 | Adaptive reasoning depth | lungo-vs-corto adattivo | Q | F2 / F3 | verifier match depth↔difficoltà × correttezza |

**6 topic · 9 foglie · ~45 esempi** (9 foglie × 5 classi). Tag: 4 foglie Q, 2 L, 3 con dimensione mista. Topic 3 e 5 = nucleo del process-reward (PRM). Hack-check trasversale: **process-marker spoofing** → ancorare sempre all'outcome verificabile, mai alla presenza del marker/passo.

## Sources
- [[README]] §4 Area 3 (topic/foglie/tag), §3 (template canonico), §2 (5 classi + hint), §4.bis (curriculum 3 fasi).
- [[../concepts/scientific-method-operating-protocol]] (8 passi, two-phase CoT, D2/D3/D5, verify-loop con cap, reward-hacking nota).
- [[../concepts/structured-thinking]] (caveman, marker `[V]/[A]/[?]`, frasi vietate, token-economy).
- [[../concepts/reward-hacking-mitigation]], [[../entities/prm-paper]], [[../entities/rstar-math-paper]].
- User notes 2026-06-23 (sessione grill metodo scientifico).
