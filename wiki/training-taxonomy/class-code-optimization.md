---
name: class-code-optimization
description: Classe di training — MIGLIORARE codice ESISTENTE verso un TARGET di performance MISURABILE e DATO (latenza/RAM/throughput/allocazioni/#IO), (a) preservando la correttezza come cancello DOMINANTE e BEHAVIOR-preserving (non solo "test verdi"), (b) mirando il collo GIUSTO (misura/ablaziona, non indovina), (c) in proporzione a quanto il codice conta, (d) senza regredire gli altri invarianti. Home = build-out di area-14 (dimensione code-efficiency EMPIRICA, che l'audit segnala scoperta). Padre-skill = constraint-fit-decision. Oracolo = proxy DETERMINISTICI primari (conteggio istruzioni/allocazioni/#IO/#DB-call, complexity-fit) + wall-clock STATISTICO secondario; harness+test-suite CONGELATI verifier-owned. Distinta dal refactoring e dall'optimize-while-implement.
type: training-class
tags: [coding, performance, optimization, benchmark, area-14, area-05, held-out, deterministic-proxy, ablation, counterfactual-mcq]
last_updated: 2026-07-10
---

# Classe — CODE OPTIMIZATION (verso un target misurabile)

> **Origine**: idea utente msg 1600 (2026-07-10), approvata msg 1603; **re-homing in area-14 approvato msg 1635** (dopo il review-loop che aveva bocciato il primo placement in area-06). Cattura del ragionamento in TG 1601/1602.
> **Home / confini**: **build-out di [[area-14-algorithmic-math|area-14]]** — la sua dimensione **code-efficiency EMPIRICA** (migliorare codice esistente verso un target MISURATO), che l'[[../dataset-audit-2026-07-10|audit]] segnala come **scoperta** → il re-homing colma quel buco (uccide 2 piccioni). **NON in area-06**: quella è **L-quality** ("è scritto bene?", judge); questa è **efficienza misurata** (Q/proxy). **Padre-skill (#20)** = [[class-constraint-fit-decision]] (ottimizzare = raggiungere il target RISPETTANDO i vincoli — correttezza + gli altri invarianti). **Prerequisito** = [[area-05-code-correctness]] (correttezza + anti-tamper del test-harness, ereditati). **Distinta da**: refactoring ([[area-06-code-quality-architecture]], behavior-preserving per LEGGIBILITÀ, non velocità) · optimize-while-implement (scrivere già-ottimizzato ex-novo — qui si MIGLIORA codice esistente) · [[class-action-execution-optimization]] (ops dell'AGENTE, non user-code). L'ottimizzazione algoritmica (O(n²)→O(n log n)) è **un mezzo**; questa classe premia l'**esito misurato** con qualunque mezzo.
> **Meta-skill parenti**: [[../feedback_optimization_first|optimization-first]] + [[class-project-stakes-awareness]] (ottimizza **in proporzione** a quanto il codice conta).

## Il gap

Il modello "ottimizza" in modi fallati: (a) **rompe la correttezza VISIBILE** (test pubblici rossi) inseguendo la velocità; (b) **rompe la correttezza SILENZIOSAMENTE** — passa i test visibili ma cambia il comportamento su casi non-coperti: **caching→dato stale · vettorizzazione→drift float · parallelizzazione→race · cambio int-type→overflow · cambio struttura-dati→ordine diverso**; (c) **cargo-cult** — micro-opt senza guadagno misurabile (cerimonia); (d) **ottimizza l'asse SBAGLIATO** — indovina il collo invece di misurarlo (CPU quando il collo è I/O); (e) **over-opt percorsi freddi** — micro-opt illeggibile per guadagno trascurabile; (f) **regressione collaterale** — centra il target ma peggiora un altro invariante (accelera ma raddoppia la RAM, o cambia l'interfaccia pubblica). Radice comune: **non misura, non gate sulla correttezza-behavior-preserving, non controlla gli altri invarianti**.

## La skill

**Migliorare codice esistente verso un target DATO e MISURABILE**, quattro discipline:
- **① correttezza BEHAVIOR-preserving** (cancello dominante) — NON "stessi test verdi" ma **stesso contratto osservabile** verificato su suite **nascosta** + **property-test** (ordine, tolleranza-float, assenza-race, no-overflow);
- **② target giusto** — **misura/ablaziona** il vero collo di bottiglia, non lo indovina;
- **③ proporzionalità** — calibra l'entità a quanto il codice conta (caldo vs freddo, [[class-project-stakes-awareness]]) e al target (non barattare RAM per velocità se il target è la RAM);
- **④ nessuna REGRESSIONE degli altri invarianti** — non peggiorare una metrica non-target né cambiare l'interfaccia pubblica.
Il *mezzo* (algoritmo migliore, caching, meno allocazioni, batching I/O, vettorizzazione) è libero; conta l'**esito misurato con gli invarianti intatti**.

## Gold HELD-OUT — ottimizzare una funzione verso un target

Fixture **self-contained** (codice `C` + suite di test **PUBBLICA** + suite **NASCOSTA** + **property-test** + harness di benchmark, tutti DATI in-context, veri-per-costruzione #22). Target esplicito, es. *"−40% di istruzioni-eseguite [proxy deterministico] su input di dimensione N, TUTTI i test verdi, RAM di picco non peggiorata"*. L'oracolo (dettaglio in §Reward):
- **correttezza behavior-preserving**: `public_tests(C') ∧ hidden_tests(C') ∧ property_tests(C')` tutti PASS (le proprietà catturano ordine/float-tol/no-race/no-overflow);
- **miglioramento**: **proxy DETERMINISTICO** (conteggio istruzioni/allocazioni/#IO) migliorato di ≥ target; **wall-clock** come conferma **statistica** (warmup + mediana-di-K + significatività), NON oracolo primario;
- **no-regressione**: gli altri invarianti dichiarati (RAM, interfaccia pubblica) non peggiorati;
- **harness+test CONGELATI**: verifier-owned/read-only, ripristinati da baseline, ogni diff al benchmark/alla suite penalizzato (anti-tamper, come [[area-05-code-correctness]]).
Gold-behavior: (i) **misura/ablaziona** il collo reale; (ii) applica la trasformazione mirata; (iii) ri-esegue test pubblici+nascosti+proprietà (behavior-preserving) e il proxy (target); (iv) verifica **no-regressione**; (v) se il target è irraggiungibile senza rompere un invariante → lo **DICHIARA** con l'analisi (non falsifica il guadagno — onestà premiata come un successo).

## Positivi + NEGATIVI (simmetrici, #21)

**POSITIVI (enumerati)**: **P1** collo I/O → batching che dimezza le #IO, test+proprietà verdi; **P2** collo CPU O(n²)→O(n log n), stessa uscita su hidden-test; **P3** target-RAM → meno allocazioni, tempo non-peggiorato; **P4** target irraggiungibile entro i vincoli → **dichiarato** con l'analisi (onestà = successo).

**NEGATIVI**:
- **N1 — più veloce MA rompe la correttezza VISIBILE** (test pubblico rosso): penalità DURA (cancello ①, l'hack #1).
- **N1b — rottura SILENZIOSA** (test pubblici verdi, ma hidden/property rossi: caching→stale · float-drift · race · overflow · ordine): penalità DURA — è il pericolo **peggiore**, preso SOLO dalla suite nascosta+proprietà (non dai test visibili).
- **N2 — cargo-cult / guadagno-nel-rumore** (proxy non migliorato oltre soglia, o ottimizza codice mai-eseguito): **0** (cerimonia/participation-hack).
- **N3 — asse SBAGLIATO** (migliora una metrica **diversa** dal target: accelera CPU quando il target era RAM): **0** anche se "qualcosa migliora".
- **N4 — OVER-opt** (metrica **giusta** ma micro-opt illeggibile per guadagno trascurabile su percorso **freddo**, o spremuta oltre il necessario): penalizzato per **sproporzione**.
- **N5 — UNDER-opt** (lascia un'inefficienza ovvia del percorso **caldo** che il target richiedeva): penalizzato.
- **N6 — REGRESSIONE collaterale** (centra il target ma peggiora un altro invariante: −tempo ma +RAM, o interfaccia pubblica cambiata): penalizzato (④).
**N3↔N4 distinti**: N3 = metrica sbagliata; N4 = metrica giusta ma percorso/misura sbagliata (freddo/eccesso). Positivi↔negativi **bilanciati**; i negativi non-ovvi (il percorso "freddo" descritto senza dire "freddo"; il guadagno-nel-rumore che *sembra* reale; la **rottura silenziosa** che passa i test visibili).

## Reward — STANDARD a 3 SEGNALI (OUTCOME-ancorato)

- **① OUTCOME (dominante)** = correttezza-behavior-preserving **∧** miglioramento-del-target **∧** no-regressione:
  - **proxy DETERMINISTICO primario**: conteggio istruzioni (cachegrind/valgrind), #allocazioni, #IO/#DB-call, op-count, complexity-fit → **veramente deterministici** (riproducibili bit-a-bit), a differenza del wall-clock;
  - **wall-clock STATISTICO secondario** (warmup + mediana-di-K + significatività) = conferma, **mai oracolo unico** *(correzione P0-2: il tempo NON è deterministico — dichiararlo tale sarebbe un fatto falso, #22)*;
  - **correttezza** via public + **hidden** + **property-test** = behavior-preserving, non "stessi test verdi" *(correzione P0-4)*;
  - **harness/test CONGELATI** verifier-owned/read-only, diff penalizzato *(correzione P0-3, come area-05)*.
  Faster-but-wrong (visibile O silenzioso) = **0/negativo** — la correttezza è pavimento. È l'ancora; **nessun judge**.
- **② PROCESSO — ABLATION-CHECK + MCQ (deterministico, non circolare)**: NON premiare "ho mirato il collo giusto" (è **circolare** con ① e non-deterministico) ma un'**ablazione**: se **revertendo** la trasformazione il miglioramento del proxy **sparisce**, allora è LEI a causarlo (non rumore/effetti collaterali) → causalità **verificata**. + **MCQ CONTROFATTUALE** ([[../concepts/discriminative-mcq-hard-distractors]]): date candidate, quale migliora DAVVERO il target? **Flip del collo** (I/O-bound↔CPU-bound) → l'ottimizzazione corretta CAMBIA; il riflesso fisso ("aggiungi sempre una cache") sbaglia. Premia causalità/tracking, mai la prosa ("ho analizzato la complessità…" = 0).
- **③ TRANSFER anti-scorciatoia**: input **held-out + dimensioni multiple + WORST-CASE** (non solo l'input misurato → un'opt che vale solo lì = overfit/benchmark-gaming; il worst-case scopre chi ha ottimizzato il caso-medio rompendo la coda); e la logica "misura→asse-giusto→proporzione→invarianti-intatti" generalizza cross-dominio (sotto).

**Hack-check**: (a) rompi-correttezza (visibile/silenziosa) → cancello ① (hidden+property); (b) cargo-cult → 0 (N2); (c) **benchmark-gaming** (`if input==test: return precomputed`; hardcode; opt-solo-dell'input-misurato) → held-out + dimensioni-multiple + worst-case (③); (d) **harness-tamper** (allenta i test, gonfia il baseline, patcha il benchmark) → verifier-owned/read-only + diff penalizzato *(P0-3)*; (e) micro-opt-theater illeggibile → N4; (f) misura-rumorosa spacciata per guadagno → **proxy deterministico primario** + significatività sul wall-clock. **NB #32 (reward-branch-field-trap)**: qui il "target migliorato" è un **outcome-Q genuino** (misura di uno stato del mondo, l'esecuzione del codice), non un campo-di-decisione groundato → NON incorre nella trappola valore≈ramo; l'oracolo è un vero input misurato. Vedi [[../concepts/reward-hacking-mitigation]] + [[../concepts/oracle-design-pitfalls]] + CLAUDE.md #10/#32.

## Ordine nel curriculum & Tier-split

- **Gated DOPO i prerequisiti** (dipendenza, NON recenza): (i) **code-correctness** (area-05) + **anti-tamper del test-harness**, (ii) **verification-discipline** (ri-testare dopo ogni modifica), (iii) **constraint-fit** (rispettare vincoli/trade-off). **Perché**: il cancello-correttezza tiene ONESTO il reward — se il modello non tiene ferma la correttezza, premiare "più veloce" gli insegna a rompere il codice per la metrica. Coi prerequisiti soddisfatti può girare in parallelo ad altre skill avanzate (non necessariamente ultimissima).
- **Tier-split (#11)**: la **META-skill** (misura/ablaziona-prima, collo-giusto, trade-off, behavior-preserving, proporzionalità, no-regressione) è **INTELLIGENZA generale = Tier-1**; le **tecniche concrete di perf-engineering** (idiomi-perf per-linguaggio, memory-layout, SIMD/vettorizzazione, cache-friendliness) sono **specialità-coding = LoRA T2/3**. L'harness fornisce profiler/benchmark-runner/proxy-counter **congelato** (F strumentale, deterministico); il ragionamento su *cosa* ottimizzare è S.

## Transfer cross-dominio (#19) — "migliora il TARGET preservando gli invarianti, MISURA non indovina"

- **A — software/tecnico**: complessità algoritmica (O(n²)→O(n log n)) · ridurre allocazioni/GC-pressure · batching I/O/DB · caching di risultati **puri** (mai di dati che devono restare freschi — sarebbe N1b) · vettorizzazione (con tolleranza-float controllata). Invariante = correttezza+RAM; misura = profiler/proxy.
- **B — vita quotidiana**: tragitto casa-lavoro per TEMPO senza far esplodere il COSTO · velocizzare una ricetta senza rovinare il piatto · ridurre la bolletta senza rinunciare al comfort essenziale. Invariante = il risultato voluto; misura = cronometro/conto, non "sensazione".
- **C — sistemico**: supply-chain per COSTO senza rompere l'affidabilità · rete per LATENZA senza sacrificare il throughput · processo produttivo per THROUGHPUT senza calo di qualità · energia per CARBONIO senza blackout. **Confine anti-simmetrico**: ottimizzare l'asse sbagliato, o oltre il necessario, o rompendo un invariante, è un fallimento **quanto** non ottimizzare il collo reale — la skill è **misura → asse-giusto → proporzione → invarianti-intatti**, non "più-veloce-a-ogni-costo".

## Label-generation

- Da `(codice corretto C, suite pubblica, suite NASCOSTA, property-test, harness benchmark CONGELATO)` → task con **target esplicito** (−X% proxy-deterministico / −Y RAM). Oracolo = correttezza (public+hidden+property) + miglioramento (proxy) + no-regressione + anti-tamper. Riusa il pattern `verifiers/` (fixture eseguibile in sandbox, harness read-only).
- **Coppie CONTROFATTUALI** per ②: stesso codice, **collo diverso** (una versione I/O-bound, una CPU-bound) → l'ottimizzazione corretta CAMBIA; il flip attraversa il confine "quale asse". MCQ hard-distractor = ottimizzazioni plausibili-ma-sbagliate (ottimizza il ramo freddo / rompe un caso-limite silenziosamente / nessun guadagno / centra il target ma regredisce un invariante).
- **Casi obbligatori**: la **rottura silenziosa** (N1b, ogni modalità: caching/float/race/overflow/ordine) presa dalla suite nascosta+proprietà; il **worst-case** distinto dal caso-medio; il **multi-target** (migliora X senza regredire Y); il **cambio-interfaccia** (vietato).
- **Determinismo** ([[../concepts/oracle-design-pitfalls]]): proxy deterministico primario; wall-clock solo con warmup+mediana-K+significatività+dimensioni-multiple → un guadagno "nel rumore" non conta; niente single-timing spacciato per oracolo.
- **Decontaminazione (#18)**: l'istanza-eval osservata resta **held-out**; il generatore produce esempi su codice/domini **disgiunti**; il transfer sull'held-out è la metrica di successo.

## Coherence-audit (playbook §5) — auto-check
1. Struttura-sezioni ✓ · 2. Reward outcome-anchored (proxy-deterministico Q + wall-clock statistico) + hack-check + 3-segnali + anti-tamper ✓ · 3. **Home = area-14 build-out** (dimensione code-efficiency empirica) + **padre = constraint-fit** (#20 vera, non "in-spirito") + confini netti (≠refactoring ≠optimize-while-implement ≠action-execution-opt) ✓ · 4. Gold held-out + decontaminato ✓ · 5. Transfer A/B/C ≥3-4 non-tecnici ✓ · 6. Negativi 7-poli simmetrici (N1 visibile / N1b silenzioso / N2 cargo / N3 asse / N4 over / N5 under / N6 regressione) + positivi enumerati ✓ · 7. Integrità fattuale (**proxy deterministico**, wall-clock dichiarato statistico non-deterministico; fixture self-contained; nessun claim-perf inventato) ✓ · 8. Nessuna contraddizione (≠ le foglie L di area-06; area-14 è la home, l'algoritmo è un mezzo) ✓ · 9. Wiring (index + registry + area-14 cross-ref + log) ⏳ · 10. Caveat nuovi → §4 playbook (gating-post-correttezza · behavior-preserving≠test-verdi · anti-tamper-harness · proxy-deterministico-vs-wall-clock) ⏳.

## Links
[[area-14-algorithmic-math]] (home — build-out code-efficiency empirica) · [[area-05-code-correctness]] (prerequisito: correttezza + anti-tamper) · [[class-constraint-fit-decision]] (**padre-skill** #20) · [[area-06-code-quality-architecture]] (≠ refactoring L-quality) · [[class-project-stakes-awareness]] (ottimizza ∝ quanto conta) · [[class-action-execution-optimization]] (≠ ops-agente) · [[../concepts/verification-discipline-training]] (ri-testare dopo la modifica) · [[../concepts/discriminative-mcq-hard-distractors]] (MCQ controfattuale ②) · [[../concepts/phased-reward-and-rh-detection]] (standard 3-segnali) · [[../concepts/oracle-design-pitfalls]] (proxy-deterministico vs wall-clock) · [[../feedback_optimization_first]] · [[../feedback_reward_hacking_principle]] · [[../feedback_transfer_always_cross_domain]] · [[../dataset-audit-2026-07-10]] (fonte re-homing)
