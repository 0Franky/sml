---
name: judge-design
description: Design del giudice/verifier per il reward RL — contract strutturato + checklist pre&finali + council OPEN (Claude/GPT/Gemini fuori dal loop per vincoli commerciali). Reward ancorato all'outcome, scorer≠scored.
type: concept
tags: [concept, reward, judge, rl, verifier, reward-hacking, training, council]
sources: [decisions/2026-06-28-decisions-d1-d5 (D5), concepts/reward-hacking-mitigation, user msg 245]
last_updated: 2026-06-29
status: draft v0 (da raffinare: schema-contract esatto + set-giudici finale + calibrazione)
---

# Judge Design — il giudice del reward (contract + checklist + council OPEN)

> Capability trasversale: nel reward-design di ogni foglia compare un `L` (label-judge) per i campi non deterministicamente verificabili. Questa pagina ne è la **specifica unica** (prima era solo un pattern sparso in 11+ foglie). Decisione di riferimento: [[../decisions/2026-06-28-decisions-d1-d5]] §D5.

## Catena: why → problema → soluzione

- **WHY** — il reward RL determina *cosa* il modello impara. Un giudice debole o gameabile insegna a ottimizzare la **forma**, non l'**outcome**. `[EXTRACTED]` (principio reward-hacking, [[reward-hacking-mitigation]]).
- **PROBLEMA** — per i task NON verificabili deterministicamente (qualità del ragionamento, rationale, scelte di design) serve un giudice-modello (LLM-as-judge). Ma: (a) un singolo giudice è gameabile + porta bias sistematico; (b) **Claude/GPT/Gemini come giudice violano i ToS** per un modello commerciale concorrente (anche un veto binario — vedi §council-policy in D5); (c) un giudice senza struttura produce reward rumoroso e non auditabile.
- **SOLUZIONE** — il giudice è una **pipeline**, non un singolo prompt: `contract strutturato` (l'output del modello in forma verificabile) → `checklist pre&finali` del giudice → `council OPEN` (ensemble di giudici open-weight) → `audit` + preferenza per i verificabili. Claude **fuori dal loop**.

## Classificazione training-vs-harness ([[training-vs-harness-classification]])

| Metà | Asse | Stato-senza-training |
|---|---|---|
| **Il giudice** (modello esterno + scorer deterministici) | **F-harness/serving** — infrastruttura di reward separata dai pesi del nostro SLM, gira solo in TRAINING | **PIENA** da subito (modello open-weight già competente) |
| **Emettere output conforme al contract** (TOON/JSON: dettagli/note/errori/soluzioni) | **S** — skill nei pesi del nostro modello, addestrata nello Stadio 1 | **DEGRADATA-ma-utile** (senza training la forma è irregolare → giudice meno affidabile, ma un parser + fallback recupera in parte) |

> Implicazione: il giudice **non** è una feature del prodotto finale — è infrastruttura di training. La feature di prodotto correlata è semmai l'auto-verifica del modello (un'altra foglia).

## Componenti della pipeline

### 1. Contract strutturato (output del modello → forma verificabile)
Lo schema fisso `[INFERRED]` (da specificare campo-per-campo): `{ dettagli, note, errori_rilevati[], soluzioni (solo se confidence≈100%), incertezze[] }` in **TOON o JSON**. Far valutare al giudice **campi discreti** invece di prosa libera → meno rumore + abilita check deterministici parziali (es. "il campo `errori_rilevati` è non-vuoto quando il verifier deterministico segnala un errore?").

### 2. Checklist del giudice (pre & finali)
- **PRE-check** (prima di giudicare): l'input è ben formato? il contract è rispettato? campi obbligatori presenti? → se no, reward invalido/basso, **non** giudicare a caso.
- **Checklist FINALE** (dopo): la valutazione *consegue* dagli output osservati? ordine corretto (check **prima** del verdetto)? il verdetto è ancorato a evidenza nel **trace**, non a plausibilità?

### 3. Council OPEN (ensemble)
- **N giudici open-weight indipendenti** (reco iniziale: DeepSeek-V4/R1 + Qwen2.5-72B), voto a maggioranza o media. La **diversità di modello** riduce il bias single-judge e rende più costoso il gaming (devi ingannare giudici diversi insieme).
- ⚠️ **Claude/GPT/Gemini FUORI dal loop**: i loro ToS vietano l'uso degli output per addestrare un modello commerciale concorrente — **anche un veto binario** è precluso. `[EXTRACTED]` da [[../decisions/2026-06-28-decisions-d1-d5]] §council-policy. DeepSeek-R1 (MIT) permette esplicitamente la distillazione.

### 4. Audit + preferenza per i verificabili
- Dove esiste ground-truth, reward = **verifier DETERMINISTICO** (test/exec/oracle); il giudice-LLM **solo** dove il deterministico non arriva.
- **Audit trail**: un campione dei giudizi ri-controllato (cross-judge o umano) per stimare il **rumore del giudice** (ECE/agreement). Senza questo, il reward sembra pulito ma può essere sistematicamente distorto.

## Anti reward-hacking (scorer ≠ scored)
- Lo scorer ispeziona il **trace reale** (tool-call/artefatti), non il testo auto-dichiarato: il **check-fantasma** (il modello scrive "ho verificato" senza una tool-call reale) → reward **0**. [[reward-hacking-mitigation]], CLAUDE.md #10.
- Reward ancorato all'**OUTCOME** (errore reale corretto, danno evitato), **mai** alla partecipazione (*participation-hack*). [[feedback_reward_hacking_principle]]
- Difese cumulative: dataset bilanciato (positivi+negativi), penalità simmetrica, held-out negativo, council-diversity, contract obbligatorio, audit.

### Penalità simmetrica per scelte-di-valore — coherence-anchoring a DUE livelli
Per le foglie **L di tipo scelta-di-valore/deferral** (es. [[../training-taxonomy/area-02-criticality-safety]] Foglia 6.2) il reward NON può premiare il *ramo* scelto (decidere vs deferire) — sarebbe reward-hacking. Come ottenere penalità **simmetrica** senza premiare la scelta? Coerenza a **due livelli** (emerso dal pilota gold 2026-06-29, corretto dal review agnostico):
1. **Livello 1 — coerenza esterna `campi ↔ <env_facts>` (PILASTRO, deterministico, non-gameabile)**: i campi auto-dichiarati del contract (`reversibilità`, `costo`, `confidence`) devono essere ancorati ai **fatti del contesto**. Se `<env_facts>` dice "addebito su account utente" e il contract dichiara `reversibilità: reversibile`, è un'incoerenza **verificabile come pre-check** → fallisce il gate. Pilastro perché i fatti sono nel contesto, non auto-dichiarati.
2. **Livello 2 — coerenza interna `razionale ↔ campi` (COMPLEMENTO, L-judge)**: dato che i campi sono ancorati, il council penalizza l'illogicità (`act` + `reversibilità: irreversibile` + `confidence: bassa` = auto-contraddittorio).

⚠️ **Enshrinare solo il livello 2 = meccanismo GAMEABILE**: un modello che mente scrive campi *falsi-ma-coerenti* (`reversibile` + `confidence:alta` + `act` resta internamente coerente). Solo il livello 1 lo cattura. **Servono ENTRAMBI.** `[INFERRED dal pilota, da validare in training]`

## Open / TODO (tracciati in [[../todo]])
- **Schema = META-SCHEMA + istanze per-foglia** (risolto dal pilota 2026-06-29): judge-design definisce i **campi-meta obbligatori comuni** a ogni contract — `{decisione, evidenza[], incertezza[], razionale}` — + il **pre-check** (ben-formato, evidenza ancorabile a `<env_facts>`). Ogni **foglia istanzia** un contract specializzato: es. foglia *analisi/review* → `{dettagli, note, errori_rilevati[], soluzioni, incertezze[]}`; foglia *deferral* (Foglia 6.2) → `{opzioni, conseguenze[], reversibilità, confidence, scelta, perché, reco, serve_da_te}`. **Precedenza**: il per-foglia prevale sul *contenuto*; judge-design prevale sui *campi-meta + pre-check*. (TODO residuo: fissare il TOON/JSON esatto dei meta-campi.)
- Set di giudici open-weight **finale** + soglia di consenso del council.
- **Calibrazione** del giudice (ECE su un set human-labeled) prima di usarlo come reward.

## Link
[[../decisions/2026-06-28-decisions-d1-d5]] (D5 + council-policy) · [[reward-hacking-mitigation]] · [[scientific-method-operating-protocol]] · [[training-vs-harness-classification]] · [[structured-thinking]] (il contract è la forma strutturata dell'output)
