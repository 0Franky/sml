---
name: area-10-output-mechanics-precision
description: Example-space completo per le 4 foglie dell'Area 10 (Output Mechanics & Precision, Tier X) — char-level counting/manipulation, length/token control, format adherence, auxiliary MTP heads (sketch/reply-shape + meta-state); tutte Q, reward via verifier deterministico (conteggio esatto, format-match, exact-match sullo sketch), con hack-check anti-"dichiarazione-senza-calcolo".
type: taxonomy-area
tags: [training, taxonomy, area-10, output, precision, char-level, length-control, mtp]
sources: [training-taxonomy/README.md §4 Area 10, user notes 2026-06-23]
last_updated: 2026-06-25
status: generated
---

# Area 10 — Output Mechanics & Precision

> **Riempimento** dell'Area 10 del backbone ([[README]] §4). Non riscrive lo schema: lo applica foglia per foglia secondo il template canonico §3. L'Area 10 raccoglie le skill **meccaniche** sull'output — non *cosa* dire ma *come* è fatto il testo emesso: contarne/manipolarne i caratteri, controllarne la lunghezza, rispettarne il formato, e predire metadati sull'output (sketch/reply-shape + meta-state) come target ausiliari MTP. Sono skill **Tier X (cross-tier)**: servono all'orchestrator (T1) tanto quanto ai programming/vertical (T2/T3).

**Tutte le foglie sono Q (quantitative)**: l'esito è oggettivo e misurabile da un **verifier deterministico** (conteggio esatto dei char, match del budget di lunghezza, validazione di schema/format, exact-match sullo sketch atteso). Questo è il regime ideale per **reward verificabile** in RL/process-reward (vedi [[../concepts/scientific-method-operating-protocol]] D3): lo scorer è un programma che **conta/valida davvero**, mai un giudizio.

**Origine note utente** (2026-06-23, [[../concepts/_user-notes-2026-06-23]]):
- **Nota 7** (char-level): i BPE token aggregano più char → il modello "non vede" i singoli caratteri → fallisce su conteggi/manipolazioni char-level (il classico "quante r in strawberry"). Tecnica: forzare output **char-spaced (1:1 token↔char)** quando serve precisione. *Non possiamo cambiare il tokenizer*, ma possiamo addestrare sul formato.
- **Nota 6a** (length): target ausiliari su #token e #char dell'output; doppio obiettivo (risoluzione utente): **(a) controllare** la lunghezza ("rispondi in ≤N") **e (b) migliorare il conteggio**. La length-prediction alimenta il **thinking adattivo** (Fase 2, lega a metacognizione note 4+5).
- **MTP** ([[../concepts/multi-token-prediction-training]]): heads ausiliari H4 (sketch/reply-shape: `<reply_type:code:python:200tok+test:50tok>`) e H5 (meta-state: BUSY/CHECKING/READY/BLOCKED/UNCERTAIN).

**Confidence sull'intero file**: la *struttura* (tag Q, verifier deterministico, char-spacing come tecnica, heads MTP) è `[EXTRACTED]` da README §4 + note 6a/7 + concept MTP. Gli *snippet concreti*, i ratio e i pesi di loss (es. "0.5 sketch, 0.3 state") sono `[INFERRED]` come proposta operativa da validare con ablation.

**Hack-check trasversale a tutta l'area** (priorità utente 2026-06-23): il rischio dominante per queste skill è che il modello **dichiari un risultato senza calcolarlo** — "ci sono 3 'r'" buttato lì senza contare, "≈200 token" senza aver budgetato, "formato JSON valido" senza che lo sia. Difesa madre applicata a OGNI foglia: **il verifier conta/valida indipendentemente dall'asserzione del modello** — scorer ≠ scored. Il numero/format che il modello *dichiara* non è mai il segnale di reward; il segnale è ciò che un programma terzo **misura sull'output effettivo**. → [[../concepts/reward-hacking-mitigation]].

---

## Char-level precision

- **Area**: Output Mechanics & Precision (A10). **Tag**: **Q**. Origine: nota 7.
- **Skill target (segnale)**: contare e **manipolare a livello di singolo carattere** — quante volte appare un char, in che posizione, reverse di una stringa, n-esimo carattere, anagrammi, conteggio per categoria (vocali/cifre/maiuscole). Il segnale chiave è **superare il collo di bottiglia del BPE** producendo, quando serve, output **char-spaced (1:1 token↔char)** che costringe la tokenizzazione a token mono-char e rende i caratteri "visibili" al meccanismo di conteggio.

- **Esempi**:
  - **(1) WITH-hint** — l'hint scaffolda la *strategia char-spacing*, non la risposta. Hint **forte→debole** (fade-out progressivo):
    - *hint forte (tecnica esplicita + worked example)*: *"Conta quante 'r' ci sono in 'strawberry'. Tecnica: prima **scomponi la parola un carattere per riga o spaziata** — `s t r a w b e r r y` — poi marca con un indice ogni occorrenza del target: posizioni 3, 8, 9 → conteggio = 3. Non rispondere a occhio: enumera."*
    - *hint medio*: *"Conta le 'r' in 'strawberry'. Spazia i caratteri prima di contare per non sbagliare."*
    - *hint debole*: *"Conta le 'r' in 'strawberry' — procedi carattere per carattere."*
    - Skill scaffoldata: il riflesso di **espandere in char-spaced ed enumerare** invece di stimare dalla forma tokenizzata.
  - **(2) WITHOUT-hint** — *"Quante 'r' ci sono in 'strawberry'?"* Nessun suggerimento sulla tecnica: il modello deve **spontaneamente** ricorrere alla scomposizione char-level (in un blocco di reasoning) prima di emettere il numero finale.
  - **(3) WRONG — awareness** — gli si mostra una traiettoria che risponde *"ci sono 2 'r' in strawberry"* (conteggio a occhio, sbagliato). Label: *"sbagliato perché: il modello ha contato sulla forma tokenizzata senza enumerare i char; spaziando `s t r a w b e r r y` le 'r' sono in posizione 3, 8, 9 → 3, non 2."* Il modello deve **riconoscere** che è un conteggio non verificato e dire *qual è il numero giusto e perché* — senza che gli venga chiesto il fix.
  - **(4) WRONG — recovery** — stessa risposta sbagliata ("2") + **loop di recupero**: il modello rilegge → applica char-spacing → ri-enumera (`s¹ t² r³ a⁴ w⁵ b⁶ e⁷ r⁸ r⁹ y¹⁰` → r in 3,8,9) → corregge a "3" → (opzionale) verifica incrociata ricontando dall'altro estremo. Insegna il verify-loop sul conteggio (asserzione→ri-enumerazione→correzione) → [[../concepts/scientific-method-operating-protocol]] verify-loop, [[../concepts/error-memo-system]].
  - **(5) OTHER** — edge / regime token≈char / manipolazione composita:
    - *regime token≈char*: task su stringhe già 1:1 (cifre, codici esadecimali `4F2A`, sequenze di simboli isolati) dove ogni char è già un token → il modello deve riconoscere che qui **non serve** spaziare (no over-engineering del formato).
    - *manipolazione*: *"reverse di 'naïve'"* con grapheme cluster/diacritici — invertire i code point spezza i caratteri compositi (`naïve` → l'accento si stacca); riconoscere l'unità "grapheme" vs "code point" vs "byte".
    - *composito*: *"qual è il 7° carattere di 'metacognition' e quante volte appare?"* — combina indexing posizionale + conteggio in un'unica risposta.
    - *adversarial*: parola con caratteri visivamente simili (`l`/`I`/`1`, `O`/`0`) dove il conteggio "a occhio" è ingannato ma l'enumerazione char-level no.
- **Fase curriculum** (§4.bis): **Fase 1** (teoria: *perché* il BPE rende i char invisibili e *quando* usare char-spacing — collega alla meta-awareness regime-training di [[../concepts/runtime-symbol-randomization-training]]); **Fase 2** grosso del volume (esercizi con-hint→senza-hint sul char-spacing); **Fase 3** RL con verifier che conta davvero.
- **Reward design (Q → verifier deterministico)**: il verifier **conta/manipola i caratteri in codice puro** (`s.count('r')`, `s[6]`, `s[::-1]` con normalizzazione grapheme) sull'output finale del modello e confronta con l'asserzione. Reward = **exact-match sul numero/stringa risultante**. **Test specificati**: parole-trabocchetto note (`strawberry`→3 r, `mississippi`→4 s, `banana`→3 a) + stringhe generate casualmente con conteggio noto a priori + casi grapheme/Unicode + casi token≈char. Per i task generati, il **ground-truth è calcolato dal programma**, mai annotato a mano.
- **Hack-check (OBBLIGATORIO)**: il fallimento-tipo è **dichiarare il conteggio senza calcolarlo** ("ci sono 3 'r'" indovinato). Difese: **(1)** il reward viene dal verifier che conta *indipendentemente*, mai dal numero asserito dal modello; **(2)** stringhe **generate casualmente** a ogni episodio → impossibile memorizzare "strawberry→3" (anti-overfit sulle parole-trabocchetto canoniche, che sono nei dataset pubblici e quindi "bruciate"); **(3)** anti-shortcut "spazia ma poi conta lo stesso a occhio": premiare anche su stringhe **lunghe** (50+ char) dove l'enumerazione è obbligata. Anti reward-del-formato: spaziare i char è *strumento*, non obiettivo — non dare reward per l'output char-spaced in sé, solo per il **conteggio corretto**. → [[../concepts/reward-hacking-mitigation]].

---

## Length / token control

- **Area**: Output Mechanics & Precision (A10). **Tag**: **Q**. Origine: nota 6a (doppio obiettivo: controllo + conteggio).
- **Skill target (segnale)**: **predire e rispettare** un budget di lunghezza dell'output — in token, in char, in parole, in righe, in frasi. Due facce: **(a) controllo** = produrre output *dentro* il vincolo richiesto ("rispondi in ≤50 parole", "esattamente 3 bullet"); **(b) conteggio/predizione** = stimare a priori quanto sarà lungo l'output (alimenta il **thinking adattivo**: decidere se serve un ragionamento lungo o corto — lega a [[../concepts/multi-token-prediction-training]] length-aware head e a Fase 2 di [[../concepts/scientific-method-operating-protocol]]).

- **Esempi**:
  - **(1) WITH-hint** — hint **forte→debole**:
    - *hint forte (strategia di budgeting esplicita)*: *"Riassumi questo paragrafo in **esattamente 2 frasi, ≤40 parole totali**. Strategia: prima abbozza il riassunto, poi **conta le parole**, poi taglia/espandi per centrare il budget prima di consegnare. Verifica il conteggio sull'output finale."*
    - *hint medio*: *"Riassumi in ≤40 parole, 2 frasi; controlla la lunghezza prima di rispondere."*
    - *hint debole*: *"Riassumi in modo conciso, rispettando il limite di lunghezza indicato."*
    - Skill scaffoldata: il riflesso **abbozza→conta→aggiusta** invece di emettere a lunghezza libera.
  - **(2) WITHOUT-hint** — *"Riassumi questo paragrafo in massimo 40 parole, in 2 frasi."* Il vincolo è nel task ma nessuna strategia è suggerita: il modello deve auto-budgetare e auto-verificare.
  - **(3) WRONG — awareness** — output che il modello dichiara *"(38 parole)"* ma che ne ha **52**, o che usa 3 frasi invece di 2. Label: *"sbagliato perché: il vincolo era ≤40 parole / 2 frasi; l'output ne ha 52 ed è su 3 frasi. Il conteggio dichiarato (38) non corrisponde al testo reale."* Riconoscere lo **sforamento** e la **discrepanza tra conteggio dichiarato e reale**.
  - **(4) WRONG — recovery** — output a 52 parole → il modello **conta** (52 > 40) → diagnosi (due subordinate ridondanti, una frase di troppo) → riscrittura comprimendo → ri-conta (39 ✓, 2 frasi ✓) → consegna. Verify-loop sul budget di lunghezza.
  - **(5) OTHER** — edge / regime token≈char / vincoli compositi:
    - *unità ambigua*: vincolo in "token" mentre l'utente pensa in "parole" → esplicitare la differenza (1 parola ≈ 1.3 token) e su quale unità si misura.
    - *vincolo combinato*: *"≥100 e ≤120 caratteri"* (range bilatero, più difficile di un solo upper-bound) — centrare una finestra stretta.
    - *predizione pura (no controllo)*: *"prima di rispondere, stima quante righe richiederà questa risposta"* → la stima alimenta l'adaptive depth (risposta breve attesa → reasoning corto). Target ausiliario, non output utente.
    - *token≈char*: budget su una stringa di sole cifre/simboli dove token≈char rende #token≈#char → il modello deve sapere che in *questo* regime le due metriche coincidono.
    - *adversarial*: richiesta di "esattamente N caratteri" con N che cade a metà di una parola → o si riempie/tronca pulito o si segnala l'impossibilità di N esatto senza spezzare.
- **Fase curriculum** (§4.bis): **Fase 1** (teoria: differenza token/char/parola, perché il budget conta per l'adaptive thinking); **Fase 2** volume (esercizi con-hint→senza-hint, incluso IFEval-style length constraints); **Fase 3** RL con verifier di lunghezza + integrazione con la length-head MTP per la predizione a priori.
- **Reward design (Q → verifier deterministico)**: il verifier **misura la lunghezza reale** dell'output (token col tokenizer ufficiale, char con `len()`, parole con split, frasi/righe con regex) e confronta col vincolo. Reward = **dentro-budget binario** (per upper/lower-bound) o **distanza dal target** (per vincolo esatto: reward decrescente con |actual − target|). Per la length-head (predizione a priori): reward = accuratezza della stima vs lunghezza effettivamente prodotta (loss dedicata, vedi nota 6a "loss diverse per feature"). **Test**: budget vari (≤N parole, esattamente N frasi, range char), su unità diverse, con ground-truth misurato dal programma.
- **Hack-check (OBBLIGATORIO)**: fallimenti-tipo: **(1)** il modello **dichiara** "(38 parole)" senza contare → il verifier conta indipendentemente, l'asserzione non è il reward; **(2)** rispetta la lunghezza **degradando il contenuto** (taglia info essenziali per stare nel budget, o riempie di filler per raggiungerlo) → il reward di lunghezza dev'essere **moltiplicato per un gate di qualità/correttezza** (per il riassunto: copertura dei punti chiave verificata separatamente), mai isolato — altrimenti il modello impara "conta i token, ignora il senso"; **(3)** per la length-head: predire sempre lo stesso valore medio per minimizzare la loss → penalizzare la varianza-zero / premiare la **calibrazione** (la stima deve correlare con la lunghezza reale, non essere costante). → [[../concepts/reward-hacking-mitigation]].

---

## Format adherence

- **Area**: Output Mechanics & Precision (A10). **Tag**: **Q**.
- **Skill target (segnale)**: emettere l'output nel **formato strutturato esatto** richiesto — JSON valido conforme a uno schema, CSV con le colonne giuste, Markdown con la struttura richiesta (N heading, una tabella), XML/YAML ben formati, un template a slot fissi, regex-constrained output. Il segnale è la **conformità sintattica e strutturale** parsabile da una macchina, non l'eleganza.

- **Esempi**:
  - **(1) WITH-hint** — hint **forte→debole**:
    - *hint forte (schema + vincoli espliciti)*: *"Restituisci **solo** un oggetto JSON valido con esattamente queste chiavi: `name` (string), `age` (int), `tags` (array di string). Nessun testo prima o dopo, nessun commento, nessun trailing comma, virgolette doppie. Esempio di forma attesa: `{\"name\": \"...\", \"age\": 0, \"tags\": []}`."*
    - *hint medio*: *"Rispondi con un JSON valido con chiavi `name`, `age`, `tags`; solo il JSON, niente altro testo."*
    - *hint debole*: *"Rispondi in formato JSON conforme allo schema richiesto."*
    - Skill scaffoldata: aderire allo **schema esatto** ed evitare il preambolo/postfazione che rompe il parsing.
  - **(2) WITHOUT-hint** — *"Dammi i dati dell'utente come JSON con nome, età e tag."* Nessun vincolo esplicito su "solo JSON / no prosa": il modello deve sapere che "come JSON" implica output **parsabile** senza testo extra.
  - **(3) WRONG — awareness** — output che **avvolge il JSON in prosa** (*"Ecco i dati: ```json {...} ``` spero sia utile!"*) o con **trailing comma** / virgolette singole. Label: *"sbagliato perché: il vincolo era 'solo JSON valido'; `json.loads()` fallirebbe per il testo circostante / il trailing comma alla chiave `tags`. Non è parsabile."* Riconoscere **perché il parser fallirebbe** e dove.
  - **(4) WRONG — recovery** — output con errore di formato → si lancia `json.loads()` (o il validatore di schema) → si legge l'errore (`Expecting value: line 1 col 1`, oppure "extra data") → si rimuove la prosa / si fixa la virgola → ri-parse pulito → validazione schema verde. Insegna a **leggere e agire sull'errore del parser** (lega ad Area 5 compilation-validity e Area 13 test-execution).
  - **(5) OTHER** — edge / formati annidati / compositi:
    - *formati annidati*: una stringa JSON che contiene a sua volta una stringa CSV o codice — **escaping** corretto dei livelli (le virgolette interne vanno escapate, i newline in `\n`); riconoscere il nesting come fonte primaria di bug.
    - *format vs content*: JSON sintatticamente valido ma **schema-non-conforme** (chiave `years` invece di `age`, `age` come string "30") → distinguere "parsa" da "conforme allo schema".
    - *formato misto richiesto*: Markdown con un blocco di codice che dentro contiene JSON — due livelli di format da rispettare insieme.
    - *adversarial*: contenuto che **somiglia** a delimitatori di formato (un valore stringa che contiene ``` o `{` `}`) e che va escapato per non rompere la struttura esterna.
- **Fase curriculum** (§4.bis): **Fase 1-2** (skill di base ad alto volume; molti task IFEval/BigCodeBench-style sono format-constrained); **Fase 3** RL con validatori di schema come gate. È un'ottima **gate-skill** moltiplicativa davanti ad altri reward (output non parsabile → reward 0 a monte).
- **Reward design (Q → verifier deterministico)**: il verifier **parsa e valida** l'output (`json.loads` + JSON-Schema validation, `csv.reader` + check colonne, parser YAML/XML, regex per template, conteggio heading per Markdown). Reward = **gate binario di parsing** × **conformità allo schema** (chiavi/tipi/struttura attesi). Per "solo formato, niente prosa": verificare che l'output **intero** sia il documento (nessun testo fuori dalle delimitazioni). **Test**: schemi vari, formati annidati, casi con prosa-da-rimuovere, valori che richiedono escaping.
- **Hack-check (OBBLIGATORIO)**: **(1)** il modello dichiara *"questo è JSON valido"* senza che lo sia → il verifier **parsa davvero**, l'auto-dichiarazione non conta; **(2)** "format-pass ma contenuto vuoto/placeholder" — JSON con schema giusto ma valori `null`/`""`/`"TODO"` che soddisfano lo schema senza contenere l'informazione richiesta → il reward di formato dev'essere **gate moltiplicativo** davanti a un check di contenuto (i valori devono essere quelli giusti, non solo del tipo giusto), mai reward terminale isolato; **(3)** anti-overfit allo schema mostrato: **mutare lo schema** tra train ed eval (rinominare chiavi, riordinare, cambiare tipi richiesti) per impedire la memorizzazione di un template fisso. → [[../concepts/reward-hacking-mitigation]].

---

## Auxiliary prediction heads (MTP)

- **Area**: Output Mechanics & Precision (A10). **Tag**: **Q**. Origine: [[../concepts/multi-token-prediction-training]] (heads H4 sketch + H5 state).
- **Skill target (segnale)**: predire, **come target ausiliari** (non output utente), due metadati sull'output che il modello sta per produrre — **(H4) sketch / reply-shape**: lo "scheletro" della risposta prima del content (tipo, lunghezza approssimativa, sezioni: `<reply_type:code:python:200tok+test:50tok>`); **(H5) meta-state**: lo stato runtime corrente (`BUSY` / `CHECKING` / `READY` / `BLOCKED` / `UNCERTAIN`). Servono al wrapper per pre-allocare strutture, pre-caricare LoRA (latency cut), e mostrare lo stato in UI ("sta verificando..." vs "sta scrivendo..."). Sono **obiettivi di training**, non skill conversazionali (vedi [[README]] §4.ter: "auxiliary MTP heads sono *obiettivi di training*, rappresentati in Area 10").

- **Esempi** (la "task" è la predizione del target ausiliario, valutata in parallelo al next-token):
  - **(1) WITH-hint** — l'hint nel prompt/system scaffolda *quali metadati emettere e con che vocabolario*. Hint **forte→debole**:
    - *hint forte (schema dei target ausiliari esplicito)*: *"Mentre rispondi, su una traccia separata emetti: (1) lo **sketch** della risposta nel formato `<reply_type:TIPO:LANG:~Ntok[+SEZIONE:~Mtok]>` con TIPO ∈ {code, answer, table, plan}; (2) il **meta-state** corrente ∈ {BUSY, CHECKING, READY, BLOCKED, UNCERTAIN} a ogni transizione. Esempio: per 'implementa endpoint POST /users con test' → sketch `<reply_type:code:python:~200tok+test:~50tok>`, state `READY→BUSY→CHECKING→READY`."*
    - *hint medio*: *"Prevedi la forma della risposta (tipo+lunghezza) e lo stato (busy/checking/...) mentre generi."*
    - *hint debole*: *"Annota la forma attesa dell'output e il tuo stato corrente."*
    - Skill scaffoldata: produrre lo sketch **prima** del content e marcare le transizioni di stato.
  - **(2) WITHOUT-hint** — task normale (*"implementa l'endpoint POST /users con validazione email e un test"*) **senza** istruzioni sui metadati: le head H4/H5 devono emettere sketch e state da sé (sono apprese, non promptate a inferenza). Il prompt-hint serve solo nella fase di apprendimento; a regime gli heads predicono autonomamente.
  - **(3) WRONG — awareness** — esempio in cui lo **sketch contraddice l'output reale**: H4 predice `<reply_type:code:~200tok>` ma il modello produce 40 token di sola prosa; oppure H5 dice `READY` mentre il prossimo output è una domanda (stato reale `BLOCKED`). Label: *"sbagliato perché: lo sketch dichiara 'code ~200tok' ma l'output è prosa ~40tok — sketch-vs-actual divergente; lo state 'READY' è incoerente con un output che è una richiesta di chiarimento (atteso BLOCKED)."* Riconoscere la **divergenza sketch↔actual** e **state↔output** (failure mode "sketch hallucination" / "head conflict" del concept MTP).
  - **(4) WRONG — recovery** — sketch/state divergente → il modello **rileva** la divergenza (l'output prodotto non matcha lo sketch dichiarato) → **ri-emette** lo sketch coerente con ciò che sta effettivamente generando, o aggiusta l'output per rispettare lo sketch, e corregge lo state (`READY`→`BLOCKED`). Insegna l'allineamento heads↔output (mitigazione "head conflict": ensemble/derivazione coerente).
  - **(5) OTHER** — edge / sketch annidato / meta-state come predizione MTP:
    - *sketch composito/annidato*: risposta multi-parte `<reply_type:plan:~80tok+code:python:~150tok+table:3rows>` — lo sketch deve descrivere una **struttura annidata** coerente con un output a sezioni.
    - *state come segnale per il wrapper*: sequenza di transizioni `READY→CHECKING(legge schema)→BUSY(scrive)→CHECKING(run test)→READY` — predire la **traiettoria di stato**, non un singolo stato (lega al wrapper sync-loop).
    - *UNCERTAIN come confidence*: quando la confidence è bassa, H5 deve emettere `UNCERTAIN` → alimenta adaptive-depth (Area 3) e ask-vs-proceed (Area 9); riconoscere quando *non* dichiarare READY.
    - *regime token≈char per lo sketch*: la stima `~Ntok` nello sketch si appoggia alla length-head (foglia precedente) — coerenza tra il budget predetto e lo sketch.
    - *speculative decoding (bonus)*: heads +2/+3 (H2/H3) come target ausiliari per coerenza multi-token → exact-match su token a distanza 2 e 3.
- **Fase curriculum** (§4.bis): **Fase 2-3** principalmente. La struttura heads richiede modifica dell'architettura/loss (tokenizer extension per gli special token sketch/state), quindi è **Wave avanzata** (vedi MTP step-by-step: Step 2 sketch experimental, Step 3 full H1-H5). In Fase 1 solo la **teoria** (cosa sono sketch/state e perché servono al wrapper). I label sono **derivabili automaticamente**: lo sketch via post-processing della risposta finale (analizza tipo/lunghezza/sezioni), lo state via teacher che marca le transizioni.
- **Reward design (Q → verifier deterministico)**: ogni head ha la **sua loss** (nota 6a "loss diverse per feature"), aggregata in weighted sum (es. next 1.0, +2 0.3, +3 0.2, sketch 0.5, state 0.3). Per gli heads ausiliari il segnale è **exact-match / structured-match deterministico**:
  - **H4 sketch**: confronto strutturato tra sketch predetto e sketch **derivato dall'output effettivo** (tipo corretto = match; lunghezza = entro tolleranza ±X% sul conteggio reale; sezioni = set-match). Penalizzare la **divergenza sketch-vs-actual** (loss esplicita, failure mode noto).
  - **H5 state**: exact-match sulla sequenza di stati vs le transizioni ground-truth marcate dal teacher; per `UNCERTAIN`, calibrazione vs confidence reale.
  - **H2/H3**: CE / exact-match su token a +2/+3 (MTP standard).
  Tutti i target sono **macchina-verificabili** (nessun judge): lo sketch reale si *calcola* dall'output, le transizioni di stato sono *annotate* dal teacher e confrontate per match.
- **Hack-check (OBBLIGATORIO)**: **(1)** "sketch hallucination" — il modello emette uno sketch plausibile **scollegato** dall'output reale per minimizzare la loss dello sketch in isolamento → il reward dello sketch dev'essere **ancorato all'output effettivamente prodotto** (sketch confrontato con ciò che il modello genera *davvero*, non con un target indipendente), così "dichiarare uno sketch" senza onorarlo viene penalizzato; **(2)** "state collapse" — H5 predice sempre `BUSY` (lo stato più frequente) per minimizzare la loss → penalizzare la varianza-zero / pesare per classe (gli stati rari `BLOCKED`/`UNCERTAIN` contano di più), come per la length-head; **(3)** "head conflict" — H1 (next-token) e H5 (state) emettono predizioni inconsistenti (H1 inizia una domanda, H5 dice `READY`) → derivare/ensemblare H5 in coerenza con H1 invece che indipendente (mitigazione dal concept MTP), e penalizzare l'incoerenza heads↔output come segnale di reward. Principio madre: il metadato (sketch/state) è premiato **solo se coerente con l'output reale misurato**, mai per il fatto di essere "ben formato" in sé. → [[../concepts/reward-hacking-mitigation]].

---

## Note di chiusura

- **Coesione cross-foglia**: char-level (conteggio) e length (budget) condividono la **length-head** MTP; lo sketch (H4) si appoggia alla stima di lunghezza; il format-adherence è la **gate-skill** che protegge il parsing degli output strutturati (inclusi sketch/state serializzati). L'Area 10 è quindi internamente sinergica: gli heads ausiliari *consumano* le metriche delle prime tre foglie.
- **Tier X**: queste skill non appartengono a un tier specifico — l'orchestrator (T1) le usa per length-control e meta-state, i programming/vertical (T2/T3) per char-level e format. Vivono come **obiettivi di training trasversali** (MTP heads) più che come capability conversazionali.
- **Benchmark**: Area 10 contribuisce a **IFEval** (vincoli verificabili di formato/lunghezza, vedi [[README]] §4.quater) insieme ad Area 15.
- **Confidence**: pesi di loss, tolleranze (±X%), e ratio di hidden-test sono `[INFERRED]` (proposta operativa); la struttura Q + verifier + char-spacing + heads MTP è `[EXTRACTED]` dalle fonti.

## Sources
- [[README]] §4 Area 10 + §4.bis (curriculum) + §4.ter (MTP heads = obiettivi di training).
- [[_coverage-audit-2026-06-23]] §A gap #5 (sketch/reply-shape + meta-state prediction → Area 10).
- [[../concepts/_user-notes-2026-06-23]] nota 6a (length, doppio obiettivo controllo+conteggio), nota 7 (char-level, token=char 1:1).
- [[../concepts/multi-token-prediction-training]] (heads H1-H5, sketch/state, failure modes sketch-hallucination/head-conflict/state-collapse).
- [[../concepts/reward-hacking-mitigation]] (scorer ≠ scored, verifier indipendente conta/valida davvero).
- [[../concepts/scientific-method-operating-protocol]] (D3 reward verificabile, verify-loop).
