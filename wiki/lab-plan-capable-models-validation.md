---
name: lab-plan-capable-models-validation
description: "Piano execute-ready per validare l'harness con MODELLI CAPACI via OpenRouter (supporto-decisione, non paper-grade). 3 correzioni bloccanti + gate P0 (slug/prezzi/key OpenRouter verificati) + lab Tier-1/2/3 + §R (7 famiglie di rigore trasversale dai 29 findings del review-loop) + §VoI (triage MUST/OPT decision-relevance) + raccomandazione a ondate sotto CAP $7.50. Stato: proposta, attende scelta scope+budget."
type: concept
tags: [harness, evaluation, validation, openrouter, capable-models, lab-plan, voi, review-loop, memory, cold-start, canary]
sources:
  - "Piano di lavoro sessione 2026-07-11 (draft v1 → review-loop-1 4-lenti+critico → loop-until-dry-2 4 round → convergenza tematica 29 findings→7 famiglie)"
  - "OpenRouter models API (slug/ctx/prezzo verificati 2026-07-11) + smoke a-pagamento deepseek-v4-flash (200, credito attivo)"
last_updated: 2026-07-11
status: proposta (attende scelta scope+budget dall'utente; NON eseguire finché non decisi)
---

# Lab plan — validazione harness con modelli capaci (OpenRouter)

> **Perché questa pagina.** L'harness è funzionalmente completo e ha **una sola vittoria dimostrata** (Regime-A overflow su banco locale, [[harness-wins-validation-protocol]]). Questo piano cerca di validarlo — memoria, difese, per-lane load-bearing, temporal-anchoring — su **modelli capaci** (target ≥27B) via OpenRouter, con un rigore **calibrato al tier "supporto-decisione"** (non paper-grade). È il prodotto di due review-loop multi-agente (draft → 4 lenti+critico → loop-until-dry a 4 round): i 29 findings emersi sono consolidati nelle **7 famiglie di §R** (vincoli-di-design sui lab) e triagati in **§VoI** (cosa è MUST vs OPT a questo tier).
>
> **Stato**: proposta stabile a livello tematico. **NON eseguire** finché l'utente non sceglie scope + budget. Il criterio di convergenza del review-loop che l'ha prodotta è documentato in [[../memory]] `feedback_convergence_voi_generative` (oggetti generativi → `loop-until-VoI-negative`, non `loop-until-dry` — vedi anche [[../memory]] `feedback_review_loop_until_dry`).

**Legenda sigle** — **F##** = finding in [[harness-experiment-log]]; **E##** = esperimento-infra; **lane** = sezione del `<context>` (facts, task_list, temporal, …); **overflow** = sessione che eccede la finestra di contesto; **digest** = cattura deterministica dei file-write in `<facts>`; **vanilla** = pi `--no-extensions`; **ours** = pi + nostre estensioni.

---

## 0. Tre correzioni bloccanti (dal review-loop)

- **[C-BLOCK-1] "vanilla perde in overflow" NON è dimostrabile sui capaci.** `MODEL_CTX`/keepTurns finestrano solo *ours*; *vanilla* usa la finestra nativa reale (128K-1M). → La tesi Regime-A "vanilla-perde" resta sul **banco locale** (qwen-ctx16k, già verde a F32) a n≥5. Sui capaci si misura solo: (i) *ours@keep1 vs ours@finestra-piena* (le lane sostituiscono la keep1 auto-imposta) — dimostrabile; (ii) il **discriminante** "il capace salva di sua iniziativa" (categorico, F34). `[EXTRACTED]`
- **[C-BLOCK-2] La famiglia qualitativa (self-report/design-review) è soft se non blindata.** Sycophancy + introspezione-confabulata (F16/F23/F33). → **protocollo blind/canary/ground-truth = PREREQUISITO**, non caveat. Inquadrare TUTTA la parte qualitativa come *genera-ipotesi da validare quantitativamente*, mai come "prova che il design è buono". `[EXTRACTED]`
- **[C-BLOCK-3] Contaminazione benchmark.** HumanEval è quasi certo nel pretraining dei capaci → pass saturo E recall-di-nomi rispondibile da **memoria parametrica** (non dalla sessione). → serve substrato **novel/rinominato** + **probe di dipendenza a verifier binario** per ogni claim di memoria. `[EXTRACTED]`

---

## P0 — Gate prerequisiti (prima di spendere 1 token di credito)

- **P0.1 Pre-flight ID/finestra/prezzo — VERIFICATO 2026-07-11** (OpenRouter models API, gratis). Slug/ctx/prezzo reali confermati `[EXTRACTED]`:
  - `anthropic/claude-sonnet-5` — ctx 1M, $2 / $10 per-M (reviewer-capo / frontier di riferimento)
  - `deepseek/deepseek-v4-pro` — ctx 1M, $0.43 / $0.87 per-M (workhorse quant + teacher) · `deepseek/deepseek-v4-flash` — ctx 1M, $0.08 / $0.17 per-M
  - `qwen/qwen3-32b` — ctx 131K, $0.08 / $0.28 per-M → **co-leader base REALE** (dense, text-only; F34: non-salva → conferma il bisogno di cattura-deterministica). Il candidato-base **primario Seed-OSS-36B** richiede una key SiliconFlow separata (assente da OpenRouter).
  - FREE (lab a zero-credito): `qwen/qwen3-coder:free`, `qwen/qwen3-next-80b-a3b-instruct:free`, `meta-llama/llama-3.3-70b-instruct:free`
  - ⚠️ Tutti gli slug hanno ctx 131K-1M → "vanilla perde in overflow" **NON dimostrabile senza spoofing** (conferma C-BLOCK-1).
- **P0.1b Correzione candidati-base** (utente 2026-07-11): `qwen/qwen3.6-27b` è **ESCLUSO dai candidati-base** — multimodale + ibrido GatedDeltaNet = *massima fragilità CPT*, contro la decisione DENSE + text-only + semplice (vedi [[entities/base-model-candidates-2026-07]] §Ranking). Era rientrato dal framing di F34 ("candidato protetto") **senza self-audit** = errore metacognitivo reale (istanza di [[training-taxonomy/class-metacognitive-self-audit]], regola #18). → declassato ad "al più capace-agentic di riferimento", bassa priorità. `[EXTRACTED]`
- **P0.2 Gate canale — VERDE 2026-07-11**: key OpenRouter validata; smoke a-pagamento su `deepseek-v4-flash` → **HTTP 200**, provider SiliconFlow, costo addebitato → **credito attivo**. `usage.cost` è esposto **per-call** → si può enforce-are un CAP in-process (stop a soglia). ⚠️ i modelli `:free` danno **429 rate-limit upstream** → non affidabili per throughput → **workhorse quantitativo = `deepseek-v4-flash`** (~$0.055/sessione, affidabile) invece dei `:free`. `[EXTRACTED]`
- **CAP UTENTE = $7.50** (credito reale disponibile, 2026-07-11) `[EXTRACTED]` → la prima ondata è ri-tarata sotto: `sonnet-5` solo per il qualitativo crown-jewel; tutto il quantitativo su `deepseek-v4-flash` / `qwen3-32b`.
- **Prima di ogni run RESTA da fare**: pinning provider/quant (§R1), noise-floor probe, e **assemblare i runner dei lab nuovi** (cheap-baseline / flat-dump / cold-start / per-lane-canary non esistono ancora).
- **P0.3 Protocollo anti-sycophancy** (per la parte qualitativa): label neutri (Config-1/Config-2, mai rivelare quale è "nostro"); ordine A/B randomizzato e counterbalanced; authorship mascherata; **variante-canary deliberatamente degradata** (lane rotte/ridondanti/scramblate) → la critica vale SOLO se discrimina la degradata dalla buona; forza N-critiche-negative ranked per severità; critica **prima** del reveal dei nostri findings; ground-truth (tool-log + dump `<context>`) accanto a ogni self-report.
- **P0.4 Disciplina di validità** (eredità F29, su ogni lab): apiError→invalid (mai contato come pass); segreto piantato solo su kind-segreto; menzione ≠ esecuzione; within-session key-rotation; grading del recall **verbatim ispezionato** (non fuzzy, anti-confabulazione); fatti-chat piantati **arbitrari** (tipo `ALDO-QX`, non azionabili) per misurare memoria pura; strumenta la **write-modality** del capace (un `bash echo >` / inline bypassa il digest).

---

## TIER 1 — massimo valore/costo (molti CHEAP: trace-esistenti o sessioni corte)

| ID | Lab | Modalità | Win / metrica | Costo | Runner |
|---|---|---|---|---|---|
| **T1.1** | **Capace come ORACOLO che predice il fallimento del debole** su trace GIÀ esistenti (#145/F14, F33, F16) | chat-call singola: {task + context-harness} → "dove fallirà un piccolo e perché"; verifica il locus predetto vs il ground-truth che abbiamo | predice fissazione / ignora-facts-lane / confabula → oracolo economico per i buchi-da-addestrare (regola #18) | quasi-zero | esiste (stile `harness/eval/run-base-probe.mjs`) |
| **T1.2** | **Misura per-lane: canary + ablazione drop/corrupt-one** | token unico in UNA lane per volta → read-rate per-lane × {capace, debole}; + arm-set {full, −facts, −task_list, −temporal…} → Δtask-success per lane rimossa; corrupt-variant = fatto stantio in una lane | ranking load-bearing vs peso-morto (attacca F4 ~3200 tok how_memory_works+rules); spiega F23/F34 | basso | **nuovo** router-canary + arm-set |
| **T1.3** | **Falsificazione: contraddizione / staleness tra lane** (research-gap #2, mai testato) | fatto stantio in `<facts>` ("committente vuole TAB") contraddetto da un msg più recente ("passa a spazi") → il capace nota il conflitto e segue il recente, o la lane stantia? | è il test che può ROMPERE la tesi; lega a regola #27; candidato paper-contribution | basso | **nuovo** (iniezione msg) |
| **T1.4** | **Sonda temporal-anchoring** (regola #13, design-claim mai validato) | context con posizioni SCRAMBLATE ma shift `[+Xs]` corretti → task che dipende dall'ordine vero: il capace si fida dello shift o della posizione? | valida/refuta un pilastro (`harness/src/time-shift.mjs`); cross-modello | quasi-zero | **nuovo** (piccolo) |
| **T1.5** | **Introspezione claimed-vs-actual** | pianta il fatto in UNA lane; confronta la lane che il modello DICE di aver usato vs quella che DAVVERO conteneva il dato | misura l'affidabilità introspettiva → decide se la parte qualitativa self-report è usabile as-is | basso | piggyback su T1.2 |
| **T1.6** | **Red-team del probe-grader** | il capace tenta di massimizzare il punteggio-recall SENZA memorizzare (confabula plausibile, sfrutta la struttura-lane) | se ci riesce → grader gameable, indurirlo PRIMA di fidarsi dei T2.* | basso | esiste (adversarial) |
| **T1.7** | **Discriminante memory n≥5 + Seed** (F34 robustezza) | `harness/eval/run-durable-discriminant.mjs`, fatto 2-parti arbitrario+azionabile, n≥5, Wilson CI; note-content VERBATIM ispezionato; +Seed-OSS se procurabile | note = k-vs-0 categorico robusto? de-riska la scelta-base | medio | esiste |
| **T1.8** | **Substrato novel/rinominato + probe di dipendenza binaria** | funzioni rinominate / problemi inediti; task tardivo che FALLISCE in modo verificabile senza il fatto-early | prerequisito di credibilità per ogni claim di memoria sui capaci (sblocca metrica non-contaminata, C-BLOCK-3) | medio | **nuovo** dataset |

## TIER 2 — alto valore, costo medio (il cuore qualitativo + l'oggettivo che lo valida)

| ID | Lab | Modalità | Win / metrica | Note |
|---|---|---|---|---|
| **T2.1** | **Design-review BLIND per-lane** (il qualitativo migliore) | 2 design anonimi; per ognuna delle 10 lane: keep/cut/reshape + ranking costo/beneficio + forced-tradeoff "taglia il 50%: cosa elimini?"; critica ANCORATA (righe/token) prima del reveal | ≥N critiche ranked; discrimina la variante-canary degradata | preferito al self-report esperienziale (meno sycophancy) |
| **T2.2** | **Esperienziale ground-truth-paired** | il capace usa l'harness su task reali, poi lo si intervista; OGNI risposta introspettiva PAIRED col tool-log / `<context>` (mai self-report nudo) | successo = coerenza claimed-vs-actual > soglia | domanda mirata su temporal-anchoring + discoverability tool |
| **T2.3** | **Scaffold AIUTA o NUOCE al capace a piena capacità** (H6-on-capable, Regime-C oggettivo) | {vanilla, ours-full, ours-lean} su task-set misto realistico, clean n≥3; + ri-test difetto-noto (eviction-hijack F25, rung F9) sul capace | pass-rate + qualità + token; è il regime dove giri DAVVERO i capaci; complemento oggettivo di T2.1 | da qui estrai anche il verdetto per-lane |
| **T2.4** | **Long-horizon agentic REALE end-to-end** (buco materiale dal critico) | traiettoria vera N≥15 turni, decisione turno-3 vincola turno-18, dipendenza cross-turno reale; {capace vanilla, ours-full, ours-lean} | task-completion (NON recall) — valida la TESI-MADRE "lo scaffold aiuta il lavoro reale" | il recall è proxy; questo è il fine |
| **T2.5** | **A1 riformulato + digest-off arm** | ours@keep1 vs ours@finestra-piena (NON vs vanilla); braccio digest-OFF per isolare intelligenza-del-modello vs cattura-deterministica; strumenta quali lane consulta | separa i 2 meccanismi che A1 conflate (F27 vs F33/F34) | sui capaci; la "vanilla-perde" va sul locale |

## TIER 3 — completamenti / coda-budget (cheap o già-validati; solo se avanza margine)

- **T3.1** — `get_conversation` come recall (F28, mai testato sul capace): canale pull vs push di T1.7.
- **T3.2** — `set_keepturns` self-management (F5): il capace governa la propria finestra? test dell'identità Tier-1.
- **T3.3** — lane-decoy / diluizione controllata (H6): distrattore placebo a parità di resto → Δ pass/recall; informa il budget-token del target.
- **T3.4** — difese Regime-C (pre-flight distruttivo + secrets-guardrail) con **false-block rate** (simmetria block↔over-caution = gold-criticality).
- **T3.5** — il capace progetta il proprio context ideale → A/B vs il nostro + transfer (aiuta anche il debole o solo sé?).
- **T3.6** — sonda thinking-token/caching (capable-specific): i thinking-token contano contro la finestra? le lane che cambiano ogni turno rompono il prompt-cache? interferiscono con la reasoning-trace? **Solo i capaci lo rivelano.**
- **T3.7** — instruction-adherence POSITIVA alle rules-lane: il capace FA ciò che how_memory_works/rules gli dicono? se le ignora, quei ~3200 tok sono peso morto a prescindere.
- **T3.8** — injection ridotto a M4/M16 secret-exfil (F30 ha già escluso l'offuscamento): taglio budget enorme vs 95-celle×3-modelli.
- **T3.9** — tool-profile: su Groq FREE (E15 già fatto), fuori dal budget-capace.
- **T3.10** — efficienza iso-recall (ex-A2): metrica-token SECONDARIA dentro T2.3/T2.5, non lab dedicato (premessa probabilmente nulla: ours è sempre più caro). `[INFERRED]`
- **T3.11** — adaptive-context (ex-A7): braccio dentro T2.5, non lab a sé (già validato E16).

## Note trasversali (dal critico + sintesi)

- **Statistica**: delta-recall binari → n≥5 + Wilson CI + decision-rule a priori (quale Δ a quale n = "win"); seed/temperature fissati; note-count categorico ok a n=3.
- **Disaccordo cross-modello come SEGNALE**: convergenza di 3 capaci su "taglia lane X" = difetto oggettivo; divergenza = bisogno **model-specific** → decide se il context ideale è universale o va tarato sul target ≥27B. Layer quasi-gratis su T2.1/T3.5.
- **Validità ecologica / dogfood**: oltre ai canary sintetici, includi ≥1 set di **task reali** come anchor + gestisci il rischio eval-awareness (il capace può fiutare la probe artificiale).
- **Real-wrapper vs substitute-runner + LATENZA** (regole #14/#15): i lab qualitativi vanno validati sul **launcher pi effettivo**, non su un runner-finto (unit-su-sostituto = falsa sicurezza); misura anche **latenza/wall-clock**, non solo token.
- **Ponte OBBLIGATORIO ipotesi→validazione**: ogni proposta qualitativa (specie le migliorie) deve poter alimentare un A/B quantitativo (tipo T3.5), altrimenti resta cortesia non-azionabile.

## Onestà residua (non ancora massimale finché…)

- Sono over-indicizzato sul **recall** (T1.1/2/5/7/8 + T2.5 = molti lab su ritenzione-fatti): tagliare 1-2 recall ridondanti per far spazio a T2.4 (agentic reale) + T3.6 (thinking) a costo invariato.
- I 3 lab a più alto valore-di-falsificazione (T1.3 contraddizione, T1.6 red-team-grader, T1.1 oracolo) sono i **meno specificati operativamente** → richiedono un mini-giro di design (fixture/grader/criterio-di-rottura) prima di essere eseguibili.
- Budget: 30 lab × 3 capaci × n≥5 è **inaffordabile**. Il valore massimo NON è "tutti i lab" ma il percorso in §Raccomandazione.

---

## §R — Protocollo di rigore trasversale (29 findings → 7 famiglie)

> Il loop-until-dry **non è converso a zero** (materiali/round: 8→8→7→6) perché il design sperimentale è ricorsivamente raffinabile — ma è raggiunta la **convergenza TEMATICA**: i 29 findings collassano in 7 famiglie e il round-4 non ha introdotto temi nuovi (questa è precisamente la ragione dietro [[../memory]] `feedback_convergence_voi_generative`). Questi principi si applicano PRIMA/DENTRO i lab, non sono lab a sé.

**R1 — Infrastruttura deterministica** (confound che inquina OGNI delta)
- OpenRouter: `provider.order` + `allow_fallbacks:false` + `require_parameters` + **log provider/quant per call**; **noise-floor probe** (stesso prompt N× a temp=0) → la decision-rule Δ-win deve superare la varianza-di-routing. Uno slug servito da più provider/quant ≠ estrazioni IID → il Wilson-CI misurerebbe anche il routing.
- **toolProfile FISSO** su tutti i bracci; riporta `toolsSent` (schemi) **separato** dai lane-token: ~63% del costo-richiesta è tool-schema (E14), non lane → scomporre il "6.2×". Promuovi il discriminante toolProfile (E15, solo byte su llama-70b) DENTRO l'A/B capace (claim comportamentale mai fatto).

**R2 — Controlli & falsificabilità** (ogni claim ha il suo arm-NULL)
- Ogni detection-lab (T1.3/T1.4/T1.1) → **arm-NULL bilanciato** (no-signal) → win = SEPARAZIONE segnale-vs-controllo + false-alarm rate (oggi la simmetria è solo in T3.4).
- T1.2 ablazione → **placebo iso-token** (isola info-value da lunghezza/posizione) + **controllo-positivo per-lane** (floor-sensitivity: drop-lane DEVE fallire dove serve, prima di leggere un Δ≈0 come "inutile") + **drop-PAIR** (ridondanza/interferenza; leave-one-out assume additività) + **REORDER** (posizione-lane = confound primacy/recency).
- Whole-context: **flat-dump** (stesso contenuto di ours, piatto vs lane → isola *struttura* da *selezione*) + **cheap-baseline** competitor onesto (rolling-summary ~200 tok + file-index, zero lane → isola "il NOSTRO design vale" da "qualunque memoria vale"). **← il più importante**: se il cheap-baseline chiude ≥X% del gap a costo frazionario, l'architettura 10-lane non è giustificata sui capaci → semplificare.
- **Induced-error baseline**: una lane autorevole-ma-sbagliata devia un capace che da solo era corretto? (la deferenza-allo-scaffold può crescere con la capacità, regola #27).
- T1.3 **arm-inverso** (recente=stantio, vecchio=autorevole) → distingue conflict-detection da recency-bias (senza, la rivendicazione paper-gap #2 è non-falsificabile).

**R3 — Rigore statistico** (paired, potenza, molteplicità, reliability)
- **Analisi PAIRED within-item** (McNemar / paired-bootstrap sugli STESSI item), NON due Wilson-CI marginali confrontati per overlap (il draft nominava la statistica sbagliata). Wilson solo per il tasso assoluto di UN braccio.
- **MDE a-priori** a n=5; concentra n su 2-3 lane ad alto-prior invece di spalmare 10×3; **FDR/Holm** oppure pre-registra "ranking descrittivo/effect-size, non inferenziale".
- **LLM-judge reliability** (T2.1/T2.2): k≥5 estrazioni del giudizio + agreement intra-giudice + ≥2 modelli-giudice; il verdetto conta solo se stabile across-draws.
- **Budget-ledger per-BRACCIO** (non per-lab): i controlli-di-interpretabilità (arm-NULL, placebo, flat-dump, cheap-baseline, controllo-positivo) sono **MUST** → se sforano il CAP si taglia il LAB intero, MAI il suo controllo; DEEP su 2-3 lane con tutti i bracci > spalmare lab con bracci amputati.

**R4 — Validità esterna verso il target ≥27B** (asse-capacità)
- Capacità = **ASSE ORDINATO esplicito** (weak-4B → target 27/32B → frontier); plotta Δscaffold-benefit per-lane lungo l'asse. **Regola INVERTITA rispetto al draft**: taglia una lane SOLO se il beneficio→0 già ALLA capacità-target o sotto, **MAI su consenso-frontier** (lo scaffold che il 27B usa e il frontier no = candidato-da-internalizzare via regola #11, non peso-morto). Verifica la monotonicità.
- **Panel diversificato per LINEAGE**: modelli co-lineage (es. qwen3-32b + un altro Qwen) = pseudo-replication (1 voto effettivo) → down-weight degli accordi co-lineage; una lane si taglia solo su rater INDIPENDENTI.
- **Canary construct-validity**: il nonce-verbatim è innaturalmente saliente E sotto-conta l'uso semantico ASIMMETRICAMENTE lungo l'asse → usare **read-rate FUNZIONALE outcome-graded** come primario; mai confrontare il verbatim across-capacità.

**R5 — Robustezza del meccanismo-harness** (altri canali + scala + cold-start)
- **Digest-fire-rate + braccio bash-write**: i capaci scrivono via heredoc/inline → il digest (solo write-tool strutturati) potrebbe non scattare → l'UNICA vittoria harness (Regime-A) non generalizza. Decision-rule: fire-rate < soglia → estendere la cattura PRIMA di generalizzare.
- **Digest multi-file** (≥15 write) → satura `<facts>` (cap 12) ed evicta i durevoli-da-chat? → segregare digest-fact da chat-fact.
- **Canali mai probati**: `<last_tool_calls>` (ring-24 in-memory, esito-operazione non-file) + `record_decision`/`get_decisions` (supersede/versioning — proprio sul research-gap #2).
- **Cold-start cross-session**: tutto il value-prop della memoria durevole è CROSS-sessione, ma ogni lab è single-session → S1 pianta → chiudi → S2 FREDDA → **matrice di sopravvivenza per-canale** attraverso il restart (il ring in-memory è perso?). Wiring load-bearing mai esercitato (regole #14/#15).
- **Production-composite arm**: la config di deploy è un COMPOSITE (adaptive+digest+lean+auto-switch) che nessun lab gira integrato → arm composite su overflow reale, misura il recall AL boundary della transizione adaptive per ciascun canale (la classe-bug più ricorrente del log: F22/E14/F5).

**R6 — Decontaminazione config + task + verifier**
- **Task-set madre** (T2.3/T2.4): congelato da un processo BLIND al design-lane + calibrato-difficoltà (banda goldilocks 30-70% pass vanilla, scarta ceiling/floor) + decontaminato (inediti, non solo rinominati).
- **ours-lean**: pinna la provenienza; se derivata da T1.2 → split dev/test disgiunto (altrimenti train-on-test a livello di CONFIG); riporta la lista-lane esatta.
- **Verifier-soundness** sul substrato novel: PASSA su gold + FALLISCE su ≥1-2 mutanti noti-rotti PRIMA di contare pass (anti fake-ground-truth sul metrico-madre — vedi [[concepts/oracle-design-pitfalls]]).

**R7 — Confronti onesti sul comportamento non-alterato del target**
- **Adaptive su finestra REALE** (non `MODEL_CTX` spoofato): la transizione scatta prima dell'overflow? misura l'oscillazione da isteresi.
- **Regime-B (iso-recall a costo minore) NON pre-scartare** (T3.10): misura costo-cumulativo-vs-lunghezza con accounting del prompt-cache; è l'unico win che opera sulla finestra NATIVA non-spoofata (aggira C-BLOCK-1). Decision-rule: se vanilla+caching resta sempre più economico → dichiararlo (Regime-B morto = riformulazione onesta del valore).

---

## §VoI — Triage decision-relevance (criterio di stop applicato ai 29)

> **Tier-di-rigore-target dichiarato** (utente 2026-07-11): *"supporto-decisione per spendere il credito OpenRouter con dati affidabili"* — **NON paper-grade**. Sotto questo tier un finding è **MUST** solo se cambierebbe una decisione concreta (quale test fare / quale config spedire / quale conclusione trarre) di un margine che vale il costo; altrimenti è **OPT** (gold-plating: valido ma non decision-relevant a questo tier → attivabile solo se avanza credito o se alziamo il tier a paper). È l'applicazione operativa di [[../memory]] `feedback_convergence_voi_generative`. I 29 findings collassano in 3 gruppi:

### A) Principi di VALIDITÀ — MUST, cheap (vincoli di disegno su OGNI lab, non test extra)
Senza questi i dati NON sono affidabili → violano il tier stesso. Sono scelte di setup a costo ~zero:
provider/quant pinning + noise-floor probe (R1) · toolProfile FISSO + toolsSent separato (R1) · analisi PAIRED McNemar non-Wilson-marginali (R3) · MDE a-priori + n concentrato su 2-3 lane ad alto-prior + FDR/ranking-descrittivo (R3) · arm-NULL in ogni detection-lab (R2, include la polarità-inversa staleness di R4) · placebo iso-token + controllo-positivo per-lane (R2) · canary read-rate FUNZIONALE outcome-graded (R4) · verifier-soundness gold/mutant offline (R6) · LLM-judge reliability k≥5 + ≥2 giudici (R3) · decontaminazione task-set + provenienza ours-lean dev/test-split (R6) · asse-capacità esplicito + regola-taglio "→0 al target, mai su consenso-frontier" (R4) · panel diversificato per lineage (co-lineage = 1 voto, R4).

### B) Arm/lab ad alto DECISION-IMPACT — MUST come test
Cambiano una conclusione grossa; vanno eseguiti (costo variabile):
- **cheap-baseline competitor** (R2) — decide "il NOSTRO design vale" vs "qualunque memoria vale" → potenziale verdetto *semplifica*. **Il singolo test a più alto decision-impact.**
- **flat-dump** (R2) — la struttura+istruzioni (~3200 tok) guadagna il suo overhead, o il valore è nella sola SELEZIONE?
- **cold-start cross-session** (R5) — l'intero value-prop della memoria durevole è cross-sessione, mai testato (wiring regole #14/#15).
- **digest-fire-rate + braccio bash-write** (R5) — l'UNICA vittoria harness (Regime-A) generalizza ai capaci solo se il digest scatta.
- **adaptive su finestra REALE** (R7) — è il DEFAULT DI PRODUZIONE, mai misurato non-spoofato.
- **production-composite arm** (R5) — la config di deploy integrata (adaptive+digest+lean) mai girata insieme; classe-bug più ricorrente (F22/E14). ⚠️ più costoso → fascia alta di B.

### C) OPT — gold-plating a questo tier (SOLO se avanza credito)
Validi ma non cambiano una decisione della prima ondata; robustezza-a-scala / canali-extra / raffinamenti di 2° ordine:
induced-error baseline (R2) · digest multi-file satura `<facts>` (R5) · canale `<last_tool_calls>` ring-24 (R5) · canale `record_decision`/supersede (R5) · Regime-B cost-cumulative+caching (R7) · REORDER posizione-lane (R2) · oracolo-held-out-predittivo esteso oltre il sanity-check (R2).
> Gli OPT diventano MUST **se alziamo il tier** (es. una paper-contribution sul contradiction-detection research-gap #2 richiederebbe induced-error + arm-inverso completi) o se eseguiamo i lab-madre a scala SWE (allora digest-multifile e i canali-extra rientrano).

---

## Raccomandazione (percorso a massimo valore/costo — governato dal §VoI)

1. **P0** (gate ID/prezzo/finestra + protocollo anti-sycophancy) — obbligatorio, quasi-gratis.
2. **Ondata cheap ad altissimo ROI** (poco credito): **T1.1** (oracolo su trace) + **T1.4** (temporal-anchoring) + **T1.6** (red-team-grader). Danno subito valore e/o induriscono la metrica.
3. **Ondata per-lane / falsificazione** (costruire 2 runner nuovi): **T1.2** (canary+ablazione) + **T1.3** (contraddizione) + **T1.5** (introspezione). È l'angolo a più alto valore unico.
4. **Ondata qualitativa calibrata**: **T2.1** (design-review blind per-lane) + **T2.2** (esperienziale ground-truth) — il cuore della richiesta, ora affidabile.
5. **Ondata oggettiva-madre**: **T2.3** (scaffold aiuta/nuoce) + **T2.4** (long-horizon agentic reale) — validano "il metodo è buono?" nel regime reale.
6. **Discriminante base**: **T1.7** n≥5 (+Seed quando c'è la key SiliconFlow).
7. Il resto (Tier 3) solo se avanza margine.

## Budget-ledger (CAP $7.50)

`[INFERRED]` stime da tarare col noise-floor probe (P0). Il ledger è **per-braccio**, non per-lab (§R3): il costo dei controlli-di-interpretabilità è incluso nel lab e non tagliabile — se si sfora, si taglia il lab intero.

- **Quantitativo** (T1.*, T2.3-2.5): `deepseek-v4-flash` ~$0.055/sessione → il grosso delle ondate 2-3-5 sta in pochi $ anche a n≥5 su 2-3 lane concentrate.
- **Qualitativo crown-jewel** (T2.1/T2.2): `claude-sonnet-5` ($2/$10 per-M) riservato al solo giudizio qualitativo ancorato, k limitato → frazione del CAP.
- **Enforcement**: `usage.cost` per-call (P0.2) → CAP in-process con stop a soglia; i `:free` esclusi dal throughput (429).
- **Regola di taglio**: sotto pressione-budget si tagliano LAB interi (mantenendo tutti i bracci di quelli che restano), MAI i controlli di un lab.

---

## Links

[[harness-wins-validation-protocol]] (i 3 regimi A/B/C + Regime-A già confermato) · [[harness-experiment-log]] (findings F##/E## citati) · [[entities/base-model-candidates-2026-07]] (candidati-base: Qwen3-32B co-leader + Seed-OSS-36B primario; qwen3.6-27b fuori-rosa) · [[harness-benchmark-versions]] · [[concepts/harness-value-and-capture-model]] · [[concepts/oracle-design-pitfalls]] · [[concepts/agent-communication-protocol]] (i review-loop che hanno prodotto questo piano) · [[concepts/context-limits-explained]] · [[architecture/context-pressure-mechanism]] · [[training-taxonomy/class-metacognitive-self-audit]] (T1.1 → buchi-da-addestrare, regola #18) · [[../memory]] `feedback_convergence_voi_generative` · [[../memory]] `feedback_review_loop_until_dry`
