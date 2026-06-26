---
name: area-14-algorithmic-math
description: Example-space completo per le 5 foglie dell'Area 14 (Algorithmic & Mathematical Reasoning, Tier T2/X) — algorithm design e complexity sono Q+L, efficiency/math/self-verification sono Q; reward via verifier (test/TLE/exact-answer GSM8K-MATH-LiveCodeBench-style), self-verification = process reward (PRM/PPM); hack-check anti-hardcode/anti-shortcut con hidden test + input randomizzati + complexity-check.
type: taxonomy-area
tags: [training, taxonomy, area-14, algorithms, complexity, math, self-verification]
sources: [training-taxonomy/README.md §4 Area 14, coverage-audit 2026-06-23]
last_updated: 2026-06-25
status: generated
---

# Area 14 — Algorithmic & Mathematical Reasoning

> **Riempimento** dell'Area 14 del backbone ([[README]] §4). Non riscrive lo schema: lo applica foglia per foglia secondo il template canonico §3. L'area nasce dal **gap LiveCodeBench/MATH** identificato nell'audit ([[_coverage-audit-2026-06-23]] §B: "algorithm design, complexity, efficiency (no TLE) → NEW Area 14"; "math/numerical reasoning → Area 14"). Copre **competitive coding** (LiveCodeBench v6) e **math reasoning** (GSM8K/MATH, se in scope).

**Tag dell'area (misto Q e Q+L)**: `algorithm-design` e `complexity-analysis` sono **Q+L** (c'è un nucleo oggettivo — l'algoritmo passa/non passa, la complessità asintotica è calcolabile — *e* una dimensione di giudizio — eleganza/scelta della struttura dati/qualità dell'argomento di complessità). `code-efficiency`, `mathematical-numerical-reasoning`, `self-testing/self-verification` sono **Q** puro (TLE/no-TLE, exact-answer, test passano/falliscono).

**Tier**: primariamente **T2** (programming generalist) con componente **X** (cross-tier): il reasoning algoritmico/matematico è una skill che attraversa i verticali (T3) e supporta l'orchestratore (T1) quando deve stimare costi/fattibilità.

**Fase curriculum** (§4.bis): **Fase 1** teoria leggera (notazione asintotica, paradigmi algoritmici — divide&conquer, DP, greedy, graph; cosa significa "exact answer" in math). Grosso del volume in **Fase 2** (esercizi con-hint→senza-hint su problem-solving algoritmico/numerico). **Fase 3** (RL agentico con verifier come reward) per le foglie a loop esecuzione→TLE/WA→ottimizzazione→AC, e in particolare per `self-testing` che è il cuore del **process reward**.

**Confidence sull'intero file**: la *struttura* (tag Q/Q+L, verifier deterministico su test/TLE/exact-answer, self-verification come process reward, hack-check) è `[EXTRACTED]` dal README §1-§4, dall'audit, e dai paper [[../entities/rstar-math-paper]] (code-augmented CoT + PPM) e [[../entities/prm-paper]] (process supervision). Gli *snippet concreti*, i limiti di complessità target e i ratio numerici sono `[INFERRED]` come proposta operativa da validare con ablation (skill `aris-experiment-plan`).

**Hack-check trasversale a tutta l'area** (priorità utente 2026-06-23): il rischio dominante per skill algoritmiche/numeriche Q-verificabili è duplice: (a) **hardcode dell'output** per i sample test noti (`if input == sample1: return ans1`), e (b) **shortcut** che passa i sample ma fallisce il general case (es. soluzione O(n²) che passa i piccoli sample ma va in TLE sui test grandi, o una formula "indovinata" che combacia su pochi numeri). Difesa standard applicata a OGNI foglia, salvo dove specificato:
- **Hidden test** mai mostrati nel prompt (≥50% del peso di reward), inclusi i **large test** dimensionati per far cadere le complessità sbagliate.
- **Input randomizzati** generati a runtime (mai-due-volte-uguali) → l'hardcode degli output noti diventa impraticabile.
- **Complexity-check**: misurazione empirica del tempo su input di taglia crescente (fit della curva) e/o **limite di tempo (TLE)** calibrato perché solo la complessità target passi.
- **Brute-force oracle**: per problemi piccoli, un risolutore esaustivo lento ma corretto genera ground truth per validare l'output su input randomizzati (differential testing).
- → [[../concepts/reward-hacking-mitigation]].

---

## Algorithm design

- **Area**: Algorithmic & Mathematical Reasoning (A14). **Tag**: **Q+L** (oggettivo: l'algoritmo passa i test entro i limiti; soggettivo: scelta dell'algoritmo/struttura dati, eleganza, generalità).
- **Skill target (segnale)**: data una specifica, **scegliere l'algoritmo e la struttura dati corretti** per il problema (e per i vincoli di input), non solo "una" soluzione qualsiasi. Es. riconoscere che un problema di "k elementi più frequenti" vuole un heap/bucket, che uno di "range sum query" vuole prefix-sum/segment-tree, che un problema su grafi pesati non-negativi vuole Dijkstra e non Bellman-Ford. È la foglia che separa "scrive codice che gira" da "sceglie l'approccio giusto per i constraint".

- **Esempi**:
  - **(1) WITH-hint** — l'hint scaffolda la *strategia di scelta*, non la soluzione. Hint **forte→debole** (fade-out progressivo):
    - *hint forte (impalcatura completa)*: *"Dato un array di `n ≤ 2·10^5` interi e `q ≤ 2·10^5` query `(l, r)` che chiedono la somma del sottoarray `[l, r]`, rispondi a tutte le query. **Considera la complessità target O(n + q)**: ricomputare ogni somma è O(n·q) → troppo lento. Quale precomputazione rende ogni query O(1)? (suggerimento: prefix-sum)."*
    - *hint medio*: *"Somma di sottoarray ripetute su `n,q ≤ 2·10^5`. O(n·q) va in TLE — precomputa qualcosa una volta sola."*
    - *hint debole*: *"Rispondi a molte query di range-sum efficientemente — pensa ai vincoli di input."*
    - Skill scaffoldata: il riflesso di **leggere i constraint** (`n, q`) e farne derivare la **complessità target**, poi scegliere la struttura dati che la raggiunge.
  - **(2) WITHOUT-hint** — *"Dato un array di interi e una lista di query `(l, r)`, ritorna per ciascuna la somma del sottoarray `[l, r]`."* (con i constraint nel testo ma **senza** indicazione sulla complessità o sulla tecnica). Il modello deve **da sé** dedurre dai constraint che serve prefix-sum.
  - **(3) WRONG — awareness** — gli si mostra una soluzione **naïve O(n·q)** (loop annidato che risomma ogni volta) e i constraint `n,q ≤ 2·10^5`. Label: *"sbagliato perché: O(n·q) ≈ 4·10^10 operazioni con questi constraint → **TLE** (oltre il time limit). L'approccio non scala; serve precomputazione (prefix-sum, O(n+q))."* Il modello deve **riconoscere l'inadeguatezza dell'approccio rispetto ai constraint**, indicando *perché* va in TLE, **senza** ancora riscriverlo.
  - **(4) WRONG — recovery** — stessa soluzione O(n·q) → si sottopone → **TLE sui large test** → diagnosi (complessità troppo alta per i constraint) → **redesign** verso prefix-sum O(n+q) → ri-sottomissione → AC. Insegna il loop *scegli→misura→riconosci inefficienza→riprogetta* (non solo "fixa un bug", ma **cambia algoritmo**). Lega al verify-loop di [[../concepts/scientific-method-operating-protocol]] e al pattern self-evolution di [[../entities/rstar-math-paper]] (genera alternative → tieni quella che passa).
  - **(5) OTHER** — composite/edge:
    - **multi-paradigma**: un problema risolvibile sia con DP che con greedy, ma **solo uno dei due è corretto** (greedy fallisce su un controesempio) → riconoscere quando greedy è insufficiente e serve DP.
    - **struttura dati sbagliata ma stessa complessità asintotica**: usare una lista dove serve un set per il lookup → stesso O() teorico ma costante peggiore / errore logico sui duplicati.
    - **over-engineering** (l'opposto): tirare fuori un segment-tree dove basta un prefix-sum → riconoscere che *anche* la complessità eccessiva nella soluzione è un anti-pattern (più codice, più bug, stesso risultato) — collega ad [[area-06-code-quality-architecture]] code-economy.
- **Fase curriculum**: Fase 1 (paradigmi algoritmici come teoria nel system prompt), Fase 2 (volume di esercizi con-hint→senza-hint dove l'hint è il "considera la complessità target"), Fase 3 (RL con verifier su LiveCodeBench-style, dove TLE/AC è il segnale).
- **Reward design (Q+L)**:
  - **Q → verifier**: la soluzione passa **tutti** i test (sample + hidden + large) **entro il time/memory limit**. Reward primario = frazione di test passati con **gate sul superamento dei large test** (che discriminano la complessità). LiveCodeBench/Codeforces-style judge.
  - **L → judge/preference**: a parità di "passa", un **judge** (o preference PPM-style, vedi [[../entities/rstar-math-paper]] §PPM) ordina per **scelta dell'algoritmo e qualità del design** (struttura dati appropriata, generalità, no over-engineering). Usato come tie-breaker / per il reasoning, non come segnale primario. Il process-reward sul *ragionamento di scelta* ("perché Dijkstra e non Bellman-Ford qui") è valutabile alla PRM ([[../entities/prm-paper]]).
- **Hack-check (OBBLIGATORIO)**: due rischi specifici. (1) **Hardcode degli output dei sample** (`if arr == [esempio]: return [...]`) → **input randomizzati** + **hidden test** + **brute-force oracle** che genera ground truth su input casuali piccoli (differential testing) rende l'hardcode inutile. (2) **Shortcut che passa i sample ma non il general case** (soluzione che sfrutta una regolarità dei soli sample, es. assume input sempre ordinato) → i large/hidden test includono input **non ordinati, con duplicati, ai boundary** dei constraint. Anti-"complessità sbagliata mascherata da sample piccoli" → i large test sono dimensionati al **massimo dei constraint** così solo la complessità target sopravvive (vedi `complexity-check` trasversale). → [[../concepts/reward-hacking-mitigation]].

---

## Complexity analysis

- **Area**: Algorithmic & Mathematical Reasoning (A14). **Tag**: **Q+L** (oggettivo: la complessità asintotica di un dato codice è determinabile e verificabile empiricamente; soggettivo: la *qualità dell'argomentazione*, l'identificazione del bottleneck dominante, l'amortized analysis).
- **Skill target (segnale)**: **analizzare la complessità time/space** di un algoritmo dato — derivare il Big-O corretto, identificare il termine dominante, riconoscere costi nascosti (es. `list.insert(0, x)` è O(n), non O(1); concatenare stringhe in loop è O(n²)), e fare amortized analysis dove serve (es. dynamic array, union-find con path compression). Skill **diagnostica e predittiva**, non generativa: data un'implementazione, dire quanto costa *prima* di eseguirla.

- **Esempi**:
  - **(1) WITH-hint** — hint **forte→debole**:
    - *forte*: *"Analizza la complessità time di questa funzione. **Procedi così**: (a) conta i loop annidati e i loro range, (b) individua le operazioni nascoste costose (slicing, `in` su lista, concat di stringhe), (c) somma i contributi e tieni il termine dominante, (d) esprimi in Big-O. La funzione fa un loop esterno su `n` e dentro un `x in lista` su una lista di `n` elementi."*
    - *medio*: *"Qual è la complessità time? Attento alle operazioni nascoste dentro il loop (`in` su lista è O(n))."*
    - *debole*: *"Qual è la complessità asintotica time e space di questo codice?"*
  - **(2) WITHOUT-hint** — *"Qual è la complessità temporale e spaziale di questa funzione?"* (solo il codice, nessuna guida). Il modello deve produrre il Big-O corretto **e** giustificarlo.
  - **(3) WRONG — awareness** — gli si mostra un'analisi **sbagliata**: codice con `for i in range(n): if x in seen_list:` dichiarato O(n) dall'autore. Label: *"sbagliato perché: `x in seen_list` su una lista è O(n), dentro un loop O(n) → la complessità reale è **O(n²)**, non O(n). L'errore è ignorare il costo nascosto del membership-test su lista (un `set` lo renderebbe O(n))."* Il modello **riconosce l'errore di analisi** e ne indica la causa.
  - **(4) WRONG — recovery** — analisi errata (O(n) dichiarato) → **verifica empirica**: si esegue su input di taglia crescente (`n = 10^3, 10^4, 10^5`), si misura il tempo, **il fit mostra crescita quadratica** → si riconosce la discrepanza con l'analisi → si corregge l'analisi a O(n²) **e** si propone il fix (`set` → O(n)). Insegna il loop *analizza→verifica empiricamente→correggi* (l'analisi teorica va confrontata col profilo reale).
  - **(5) OTHER** — composite/edge:
    - **amortized vs worst-case**: `append` su dynamic array è O(1) amortized ma O(n) nel singolo resize → distinguere amortized da worst-case singolo.
    - **space complexity nascosta**: ricorsione che sembra O(1) space ma ha O(n) di stack frames (recursion depth); oppure slicing `arr[1:]` che copia → O(n) space per chiamata.
    - **complessità dipendente dai dati**: quicksort O(n log n) medio ma O(n²) worst-case su input già ordinato → la complessità "giusta" dipende dall'assunzione sull'input.
    - **multi-variabile**: grafo con `V` nodi ed `E` archi → O(V + E), non collassabile a O(n) (riconoscere quando servono due parametri).
- **Fase curriculum**: Fase 1 (notazione asintotica e costi delle operazioni base come teoria), Fase 2 (esercizi di analisi su codice dato), Fase 3 (marginale: la verifica empirica via profiling può essere un tool nel loop agentico).
- **Reward design (Q+L)**:
  - **Q → verifier**: la complessità dichiarata è **verificabile empiricamente** — si esegue il codice analizzato su taglie crescenti e si **fitta la curva** (lineare/quadratica/log-lineare); il Big-O dichiarato deve combaciare col fit (exact-match della classe asintotica = binario). Per la space, misurazione del picco di memoria / conteggio dei frame. Questo è un **verifier deterministico sull'esito dell'analisi**, non un judge.
  - **L → judge**: qualità dell'**argomentazione** (identificazione corretta del bottleneck, gestione di amortized/worst-case, chiarezza). Process-reward PRM-style ([[../entities/prm-paper]]) sui passi dell'analisi.
- **Hack-check (OBBLIGATORIO)**: rischio "**indovina la classe** senza analisi" — il modello spara "O(n log n)" perché è la risposta più frequente, azzeccandola statisticamente. Difese: (a) il verifier empirico (fit della curva) **smaschera** la classe sbagliata indipendentemente da cosa è dichiarato; (b) richiedere la **giustificazione step-by-step** valutata via process-reward (non basta la label finale: ogni passo dell'analisi deve reggere); (c) **variare i casi** (stesso pattern di codice con costi nascosti diversi) così la risposta-template non funziona. Anti-overfit alle "complessità tipiche dei problemi classici" → presentare codice non standard dove la complessità non è quella attesa per il tipo di problema. → [[../concepts/reward-hacking-mitigation]].

---

## Code efficiency / performance

- **Area**: Algorithmic & Mathematical Reasoning (A14). **Tag**: **Q** (l'esito è oggettivo: passa entro il time/memory limit, o va in TLE/MLE).
- **Skill target (segnale)**: produrre codice che **rispetta i limiti di tempo e memoria** — evitare TLE (Time Limit Exceeded) e MLE (Memory Limit Exceeded) scegliendo una complessità adeguata ai constraint e curando le **costanti** (evitare allocazioni inutili, I/O lento, operazioni ripetute estraibili dal loop). Distinta da `algorithm-design`: qui il focus è il **costo eseguito misurato contro un limite**, non la scelta concettuale dell'approccio (anche se le due si toccano).

- **Esempi**:
  - **(1) WITH-hint** — hint **forte→debole**:
    - *forte*: *"Scrivi una funzione che conta le coppie `(i, j)` con `a[i] + a[j] == k` in un array di `n ≤ 10^6` interi. **Time limit: 1s. Considera la complessità target O(n)** (non O(n²)). Usa una hash-map dei complementi. Attento all'I/O: leggi tutto l'input in un colpo, non riga per riga in un loop lento."*
    - *medio*: *"Conta le coppie con somma `k`, `n ≤ 10^6`, time limit 1s. O(n²) va in TLE — usa una struttura per i complementi."*
    - *debole*: *"Conta le coppie con somma `k` efficientemente entro il time limit (`n` fino a 10^6)."*
  - **(2) WITHOUT-hint** — *"Conta le coppie `(i, j)`, `i < j`, con `a[i] + a[j] == k`."* (constraint `n ≤ 10^6`, time limit 1s nel testo, ma nessuna guida sulla tecnica). Il modello deve produrre la soluzione O(n) **e** curare le costanti per stare nel limite.
  - **(3) WRONG — awareness** — soluzione **O(n²)** (doppio loop) con `n ≤ 10^6`. Label: *"sbagliato perché: O(n²) = 10^12 operazioni, ben oltre ~10^8/s del time limit di 1s → **TLE**. Serve O(n) con hash-map."* Riconoscere il TLE **prima** di sottomettere, stimando le operazioni vs il budget temporale.
  - **(4) WRONG — recovery** — O(n²) → sottomissione → **TLE sui large test** → diagnosi (complessità + eventuale I/O lento) → ottimizzazione (hash-map O(n) + fast I/O) → AC. Variante: l'algoritmo è già O(n) ma va in TLE per **costanti** (es. `input()` in un loop di 10^6 → I/O bound) → il fix è solo sull'I/O/allocazioni, non sulla complessità. Insegna a distinguere *complessità sbagliata* da *costante sbagliata*.
  - **(5) OTHER** — composite/edge:
    - **MLE invece di TLE**: soluzione corretta in tempo ma che alloca una matrice `n×n` con `n=10^5` → 10^10 celle → memory limit exceeded; il fix richiede una rappresentazione sparsa o rolling-array (DP space optimization).
    - **costante killer**: due soluzioni O(n log n), una con `sort` nativo e una con un sort custom in Python puro che è 50× più lento → stessa complessità, una passa e una no.
    - **trade-off tempo/spazio**: precomputare una tabella (più memoria, meno tempo) vs ricomputare (meno memoria, più tempo) → scegliere il lato giusto del trade-off dato il limite più stringente.
- **Fase curriculum**: Fase 2 (esercizi con time limit), **Fase 3** (RL agentico con il judge/TLE come reward — è la foglia più naturale per il loop sottometti→TLE→ottimizza→AC).
- **Reward design (Q → verifier)**: **esecuzione contro time/memory limit**. Reward = AC (tutti i test entro i limiti) vs WA/TLE/MLE. **Test specificati**: sample visibili (piccoli) + **hidden large test dimensionati al massimo dei constraint** (è il discriminante: solo la complessità+costanti adeguate passano) + **stress test temporale** (worst-case input per il pattern, es. tutti uguali / già ordinato). Il reward è **binario sul superamento dei limiti** (non parziale sul tempo): o sta nel budget o no — come un judge competitivo (LiveCodeBench/Codeforces).
- **Hack-check (OBBLIGATORIO)**: rischio specifico — **passare i sample piccoli con O(n²) e fallire i large** (è esattamente lo shortcut che l'utente cita). Difesa: i **large test nascosti** sono il cuore del reward (≥50% del peso) e sono dimensionati perché O(n²) vada in TLE; senza di essi la foglia è hackerabile. Rischio "**hardcode dei sample output**" → input randomizzati a runtime. Rischio "**precompute offline**" (calcolare le risposte fuori dal programma e stamparle) → i test sono generati a runtime con seed segreto, impossibili da precomputare. **Complexity-check**: oltre al TLE, misurare la curva tempo-vs-taglia per confermare che la complessità sia quella target (cattura soluzioni che passano per poco ma con la complessità sbagliata). → [[../concepts/reward-hacking-mitigation]].

---

## Mathematical / numerical reasoning

- **Area**: Algorithmic & Mathematical Reasoning (A14). **Tag**: **Q** (l'esito è oggettivo: la risposta finale è esatta o no — exact-match con la ground truth, stile GSM8K/MATH).
- **Skill target (segnale)**: risolvere **problemi matematici/numerici** con ragionamento multi-step corretto fino alla risposta finale esatta — aritmetica, algebra, combinatoria, teoria dei numeri, word-problems (GSM8K-style) e problemi più hard (MATH-style). Include il **code-augmented reasoning** ([[../entities/rstar-math-paper]] §code-augmented CoT): esprimere i passi anche come codice eseguibile per verificarli, eliminando gli errori aritmetici.

- **Esempi**:
  - **(1) WITH-hint** — hint **forte→debole**:
    - *forte*: *"Un negozio vende mele a 3 per €2. Quanto costano 18 mele? **Procedi a step**: (a) trova quante 'terzine' sono 18 mele, (b) moltiplica per €2, (c) verifica il calcolo eseguendolo in codice prima di rispondere. Scrivi la risposta finale come numero."*
    - *medio*: *"Mele 3 per €2, quante per 18 mele? Procedi step-by-step e verifica l'aritmetica."*
    - *debole*: *"Quanto costano 18 mele se costano 3 per €2?"*
  - **(2) WITHOUT-hint** — *"Un treno percorre 240 km in 3 ore. Mantenendo la stessa velocità, quanto impiega per 400 km?"* (nessuna guida sui passi). Il modello deve scomporre, calcolare e dare la risposta esatta da sé.
  - **(3) WRONG — awareness** — gli si mostra una soluzione con **errore aritmetico/logico**: *"18 mele / 3 = 5 terzine, 5 × €2 = €10"* (sbaglia la divisione: 18/3 = 6, non 5). Label: *"sbagliato perché: 18 / 3 = **6**, non 5 → il costo corretto è 6 × €2 = €12. Errore di divisione allo step (a)."* Il modello **localizza lo step errato** (credit assignment, alla PRM [[../entities/prm-paper]]) e indica il valore corretto, **senza** rifare tutto.
  - **(4) WRONG — recovery** — soluzione con lo step sbagliato → **self-check via codice** (`18 // 3` → 6, contraddice il 5 scritto) → riconosce la discrepanza → corregge lo step → ricalcola → risposta €12. Insegna il pattern rStar-Math: ogni step ha una **controparte eseguibile** che lo verifica; se codice e testo divergono, lo step va scartato/corretto ([[../entities/rstar-math-paper]] §code-augmented CoT).
  - **(5) OTHER** — edge numerici/composite (esplicitamente richiesti dallo schema OTHER):
    - **overflow**: `factorial(50)` o `2^64` in un linguaggio a interi fissi → overflow silenzioso; usare big-integer (Python int arbitrario, `BigInteger` in Java).
    - **precisione float**: `0.1 + 0.2 == 0.3` è `False` in floating point → confrontare con tolleranza (`abs(a-b) < 1e-9`), o usare aritmetica esatta (`Fraction`/`Decimal`) dove la risposta deve essere esatta.
    - **divisione intera vs reale**: `7 / 2` deve dare 3.5 o 3? dipende dalla specifica → riconoscere quando serve `//` vs `/`.
    - **arrotondamento/formato**: la risposta richiesta a 2 decimali, o modulo `10^9+7` (combinatoria) → applicare il modulo/arrotondamento corretto come parte della risposta.
- **Fase curriculum**: Fase 1 (formule/fatti immutabili come teoria — collega ad [[../README|Area 12]] domain-knowledge per le formule fisse), Fase 2 (volume di word-problems con-hint→senza-hint), Fase 3 (RL con verifier exact-answer; qui è applicabile il pattern **self-evolution MCTS** di rStar-Math: generare traiettorie, verificare via code+ground-truth, distillare le verificate).
- **Reward design (Q → verifier)**: **exact-answer match** con la ground truth (GSM8K/MATH-style). Per risposte numeriche: confronto esatto (interi/frazioni) o con tolleranza esplicita (float). Per risposte simboliche (MATH): normalizzazione + equivalenza simbolica (es. `sympy.simplify(a - b) == 0`). **Process reward** (PRM/PPM, [[../entities/prm-paper]], [[../entities/rstar-math-paper]]): oltre alla risposta finale, premiare gli **step intermedi corretti** — il code-augmented CoT fornisce un verifier per-step a costo zero (esegui il codice del passo, deve combaciare col testo). Questo risolve il credit-assignment ("right answer for wrong reasons" → penalizzato perché gli step intermedi non reggono).
- **Hack-check (OBBLIGATORIO)**: rischio "**right answer, wrong reasoning**" (gli errori si cancellano e l'output finale è giusto per caso) → il **process reward** sugli step (PRM) e il **code-check per-step** (rStar-Math) lo intercettano: se uno step eseguito contraddice il testo, lo step è penalizzato anche se la risposta finale combacia. Rischio "**hardcode della risposta**" sui problemi noti del dataset (data leakage / memorizzazione di MATH/GSM8K) → **input randomizzati** (stesso template, numeri diversi generati a runtime) + **hidden problems** + brute-force/symbolic oracle per la ground truth. Rischio "**guess senza ragionamento**" (output diretto della risposta senza CoT verificabile) → richiedere la traccia step-by-step e premiare via process-reward, non solo l'outcome. → [[../concepts/reward-hacking-mitigation]].

---

## Self-testing / self-verification

- **Area**: Algorithmic & Mathematical Reasoning (A14). **Tag**: **Q** (l'esito è oggettivo: i test che il modello genera sono validi e coprono i casi? la verifica intercetta gli errori? — misurabile contro hidden test e mutanti).
- **Skill target (segnale)**: **generare test propri e verificare la soluzione PRIMA di consegnare** — il modello produce casi di test (inclusi edge case), li esegue contro la propria soluzione, e se qualcosa fallisce **corregge prima di rispondere**. È la skill **meta** dell'area (e il cuore del process-reward / self-verification di [[../entities/rstar-math-paper]] e [[../entities/prm-paper]]): non aspettare il giudice esterno, costruirsene uno interno. È la versione "anticipata" del verify-loop ([[../concepts/scientific-method-operating-protocol]]).

- **Esempi**:
  - **(1) WITH-hint** — hint **forte→debole**:
    - *forte*: *"Implementa `is_palindrome(s)`. **Prima di consegnare**: (a) genera almeno 5 test, includendo stringa vuota, un carattere, palindromo pari/dispari, non-palindromo, e con maiuscole/spazi; (b) esegui la tua funzione su ciascuno; (c) se un test fallisce, correggi e ri-testa; (d) consegna solo quando tutti passano, mostrando i test."*
    - *medio*: *"Implementa `is_palindrome(s)` e scrivi tu stesso dei test (inclusi edge case) per verificarla prima di consegnare."*
    - *debole*: *"Implementa `is_palindrome(s)`; verifica la tua soluzione prima di darla per buona."*
  - **(2) WITHOUT-hint** — *"Implementa `is_palindrome(s)`."* (nessuna richiesta esplicita di test). La skill interiorizzata: il modello **spontaneamente** genera ed esegue test propri prima di consegnare, anche senza che glielo si chieda.
  - **(3) WRONG — awareness** — gli si mostra una traiettoria dove il modello **consegna senza testare** una soluzione che fallisce sul caso vuoto (`s=""` → IndexError) o sulle maiuscole. Label: *"sbagliato perché: ha consegnato senza generare alcun test; un test banale (`""`, `"Aa"`) avrebbe rivelato il bug. Manca il passo di self-verification."* Riconoscere **l'assenza del self-test** come difetto di processo (non solo il bug in sé).
  - **(4) WRONG — recovery** — soluzione bugata consegnata senza test → si **innesta il self-testing a posteriori**: genera i test → uno fallisce (`""`) → diagnosi → patch → ri-testa tutto → verde → riconsegna. Insegna a inserire il loop di self-verification *prima* della consegna come abitudine. Lega al pattern PPM ([[../entities/rstar-math-paper]]): le traiettorie che includono auto-verifica e arrivano a soluzione corretta diventano preferenza positiva.
  - **(5) OTHER** — composite (self-testing come OTHER esplicito dello schema):
    - **property-based self-testing**: invece di casi singoli, il modello genera una **proprietà** (`reverse(reverse(x)) == x`, oppure `is_palindrome(s) == is_palindrome(s[::-1])`) e la testa su input casuali generati da sé.
    - **oracle differenziale auto-costruito**: per una soluzione ottimizzata, il modello scrive **anche** una brute-force lenta-ma-ovvia e confronta gli output su input casuali (self-differential testing) — esattamente il pattern di validazione che usiamo come hack-check, qui interiorizzato dal modello.
    - **edge numerici auto-generati**: il modello, sapendo del rischio overflow/precisione (foglia precedente), **genera da sé** i test di boundary (`INT_MAX`, `0.1+0.2`) prima di consegnare.
    - **test che rivelano la propria incertezza**: il modello identifica la parte di codice di cui è meno sicuro e ci concentra i test (self-confidence → self-test mirato; collega ad [[../README|Area 16]] self-scoring).
- **Fase curriculum**: Fase 2 (esercizi dove l'hint chiede esplicitamente di testare, poi fade-out), **Fase 3** (RL agentico: è qui che il self-testing diventa **process reward** — le traiettorie che si auto-verificano e arrivano corrette sono premiate; cuore del meccanismo rStar-Math/PPM).
- **Reward design (Q → verifier + process reward)**: doppio livello.
  - **Outcome (Q)**: la soluzione finale passa gli **hidden test** del valutatore (la verifica vera resta esterna e nascosta).
  - **Process reward (self-verification)**: si **premia la presenza e l'efficacia del self-test** — (a) il modello ha generato test? (b) i suoi test **coprono** gli edge case (misurato confrontando i suoi test con la suite hidden / con la **mutation coverage**: i test auto-generati uccidono i mutanti?); (c) il self-test ha **intercettato** un errore che la soluzione iniziale aveva (cattura→fix prima della consegna = reward alto). Questo è esattamente process supervision ([[../entities/prm-paper]]): premiare il *processo* di verifica, non solo l'esito. Allineato a PPM ([[../entities/rstar-math-paper]]): preferenza per traiettorie che si auto-verificano.
- **Hack-check (OBBLIGATORIO)**: rischio centrale e specifico di questa foglia — il modello **genera test deboli/tautologici** per "dimostrare" di aver testato senza vera copertura (`assert is_palindrome("aa") == is_palindrome("aa")`, o test che il codice supera per costruzione). Difese: (a) **mutation testing sui test auto-generati** — i suoi test devono **uccidere mutanti** della soluzione (se un mutante sopravvive, i test sono vuoti) → il process-reward è ancorato alla *mutation kill rate*, non al numero di assert; (b) **confronto col hidden set** — la copertura dei suoi test si misura contro i casi nascosti (i suoi test devono toccare le stesse classi di edge); (c) anti-"**test che combaciano col bug**" (il modello scrive il test sull'output sbagliato che produce, facendolo "passare") → la **ground truth dei test è verificata** contro l'oracle del valutatore, non contro l'output del modello (scorer ≠ scored, [[README]] §1). Anti-"genera test ma non li esegue / li ignora se rossi" → richiedere la **traccia di esecuzione** dei self-test e penalizzare consegne con self-test rossi non risolti. → [[../concepts/reward-hacking-mitigation]].

---

## Note di chiusura

- **Tag misti nell'area**: `code-efficiency`, `mathematical-numerical-reasoning`, `self-testing` sono **Q puro** (verifier deterministico: TLE/AC, exact-answer, hidden-test+mutation). `algorithm-design` e `complexity-analysis` sono **Q+L** — hanno un nucleo Q forte (passa i test / la complessità è empiricamente verificabile) più una dimensione L (scelta dell'approccio, qualità dell'argomento) usata come tie-breaker/process-reward, mai come segnale primario.
- **Pattern di reward ricorrente nell'area**: `correctness-gate × within-limits-gate × (large-test discriminator)`, con **TLE/complexity-check** come discriminante centrale (è ciò che distingue Area 14 da Area 5: qui non basta "passa i test", deve passarli **entro i limiti** e con la **complessità giusta**).
- **Self-verification = process reward**: la foglia `self-testing` è il ponte diretto verso [[../entities/prm-paper]] (process supervision step-level) e [[../entities/rstar-math-paper]] (code-augmented CoT come verifier per-step + PPM come preferenza tra step). È la foglia più "Fase 3 / RL" dell'area e candidata naturale per il meccanismo self-evolution.
- **Hack-check dominante**: a differenza di Area 5 (overfit ai test visibili), qui il rischio principale è lo **shortcut con complessità sbagliata** (passa i sample piccoli, TLE sui grandi) e l'**hardcode/precompute** delle risposte note → difesa = **large hidden test dimensionati ai constraint + input randomizzati a runtime + brute-force/symbolic oracle + complexity-check empirico**.
- **Confidence**: struttura/tag/verifier/process-reward `[EXTRACTED]` da README+audit+rStar-Math+PRM; snippet, limiti di complessità target e ratio numerici `[INFERRED]`, da validare con ablation (`aris-experiment-plan`).
- **Benchmark di riferimento** ([[README]] §4.quater): **LiveCodeBench v6** (competitive coding, copre design/complexity/efficiency/self-test), **GSM8K/MATH** (math/numerical reasoning, se in scope).
- **Cross-link**: over-engineering ↔ [[area-06-code-quality-architecture]] (code-economy); edge numerici ↔ [[area-05-code-correctness]] (edge-case handling, overflow); verify-loop ↔ [[../concepts/scientific-method-operating-protocol]]; self-evolution/process-reward ↔ [[../entities/rstar-math-paper]], [[../entities/prm-paper]].
