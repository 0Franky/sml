---
name: valutazione-front-jev-e-llm
description: "Due idee di Fra (2026-10-01/02) con Jev, il «System One model» di TypeSafe AI: (1) un giudice veloce per classe, (2) un front Jev davanti al LLM che decide se gestire lui la richiesta o delegarla e imposta thinking budget e configurazione. Jev esiste: decisioni tipizzate su uno schema dichiarato, probabilità calibrate, una sola passata, niente testo; solo API chiusa. Verdetto: il CONCETTO è giusto e combacia con il routing di maggio e con D18; Jev in sé non lo possiamo usare nel prodotto (chiuso, a pagamento, fuori dal locale), quindi si costruisce un nostro System One. Il front non «risponde» alle richieste: decide."
type: concept
tags: [routing, jev, system-one, calibrazione, latenza, effort, cascata, proposta, architettura]
sources:
  - "versioni open, README letti il 2026-10-02: https://github.com/ikermoel/open-alternative-jev · https://github.com/wfzyx/von · https://github.com/rupeshpoojary9/poorjev · https://github.com/mithalouni/system-one-open · https://huggingface.co/autotrust/JEV-9B"
  - "Fra, messaggi nel terminale 2026-10-01 e 2026-10-02 — testo in wiki/_private/user-ideas-2026-10-01.md (terza nota); chiarito «cerca jev system one» il 2026-10-02"
  - "TypeSafe AI, https://typesafe.ai — pagina del prodotto letta il 2026-10-02"
  - "DataCamp, «Jev: TypeSafe's System One Model Explained», https://www.datacamp.com/blog/system-one-models-jev — letto il 2026-10-02 (secondaria)"
  - "RouteLLM, arXiv 2406.18665 — titolo verificato"
last_updated: 2026-10-02
---

# Un System One davanti al LLM — Jev come modello del pezzo

> ⛔ **PROPOSTA, non ratificata** (#26).
> ⚠️ **Correzione 2026-10-02**: due volte ho letto «jev» come JEPA (Joint Embedding Predictive Architecture). Fra intendeva **Jev**, il modello di TypeSafe AI. L'analisi JEPA di stamattina è superata; una riga sopravvive in fondo.

## Cos'è Jev (fonti: pagina del produttore + una secondaria; nessun paper)

- **Non è un LLM e non genera testo.** Riceve un input non strutturato più un insieme di **domande tipizzate** dichiarate prima: *Choice* (categoria), *Score* (punteggio), *yes/no* (probabilità). Restituisce i valori **dentro quello schema** e nient'altro. Per costruzione non produce un formato sbagliato, ma **può comunque scegliere la risposta sbagliata** `[EXTRACTED, secondarie]`.
- **Ogni uscita porta una probabilità calibrata**: *«higher confidence genuinely corresponds to higher accuracy»* `[EXTRACTED, DataCamp]`. Addestrato con un algoritmo loro, *Reinforcement Learning for Calibrated Decisions* (RLCD), e un campionatore che produce tutte le uscite in **una sola passata parallela** `[EXTRACTED, typesafe.ai]`.
- **Numeri del produttore, non indipendenti**: 0,114 s contro 8,566 s di un LLM su compiti comparabili; 0,042 $ per milione di token in input, output gratis; accordo del **67,8%** con le risposte di riferimento sul loro benchmark `[EXTRACTED, typesafe.ai + DataCamp]`.
- **Limiti dichiarati**: *«useless for open-ended generation»*; funziona solo quando lo spazio delle risposte valide è **limitato e noto in anticipo**.
- **Disponibilità**: solo API ospitata, early access con lista d'attesa. Niente pesi aperti, niente report tecnico.
- **L'uso consigliato dal produttore è proprio l'idea di Fra**: *«Use Jev as the fast decision layer that classifies, scores, and routes, and hand the small slice of hard or open-ended cases to a model like Terra or Opus 5. Jev's calibration is what makes that handoff clean, since you can route on a confidence threshold.»* `[EXTRACTED, DataCamp]`

## Possiamo usare Jev? Nel prodotto no, come modello del pezzo sì

`[INFERRED]` Usare Jev come componente del nostro sistema vorrebbe dire:
- una **dipendenza chiusa e a pagamento** davanti a ogni richiesta;
- un servizio **esterno**, contro l'esecuzione in locale e la strada verso l'open source ([[../architecture/orchestrator-layer]], memoria `project_audience_strategy`);
- un pezzo il cui comportamento non possiamo misurare né riaddestrare.

Per esperimenti, o per misurare quanto un System One renderebbe sulle nostre scene, va bene, con le condizioni di uso verificate prima (#29). Per il prodotto si costruisce **il nostro**. Il concetto è riproducibile con tecnica nota `[INFERRED]`: un modello piccolo (MiniCPM5-2B per il prototipo, o un encoder) con **teste di classificazione e regressione** al posto della generazione, addestrato con una **proper scoring rule** perché la probabilità sia calibrata. RLCD non è pubblicato, quindi la loro ricetta non la conosciamo.

## Idea 1 · Il giudice veloce per classe

Jev è la forma giusta del giudice veloce di [[valutazione-giudice-veloce-per-classe]]: l'uscita di un giudice è **limitata** (passa / boccia / escala, o un punteggio di rubrica), e la proprietà che lì avevo indicato come decisiva — **sapere quando non sa** — è proprio quella su cui Jev è costruito. Il verdetto di quella pagina regge: cascata **offline**, mai reward nel loop di RL senza cancello deterministico (D11), un solo modello condizionato dalla rubrica invece di uno per classe.

## Idea 2 · Il front davanti al LLM

Il routing c'è dal 2026-05-21 ([[../architecture/orchestrator-layer]]): un classifier veloce sceglie la macro-area e ripiega sul modello base quando la confidenza è bassa. Un System One lo **generalizza**, perché ogni decisione di configurazione è una domanda tipizzata:

| decisione | tipo | etichetta per addestrarlo |
|---|---|---|
| serve il LLM o basta un'azione deterministica? | yes/no | dai log: richieste chiuse da un comando o da un lookup |
| quale LoRA verticale | Choice | il routing già previsto a maggio |
| quanto pensare (0-100) | Score | il livello più basso che, nelle scene girate a più livelli, raggiunge l'esito del migliore (D18) |
| quali tool esporre | Choice multipla | i tool effettivamente usati nelle tracce riuscite |

**Correzione dell'idea, importante**: un System One **non risponde** alle richieste, **decide**. Quando *«si prende in carico»* la richiesta, il risultato è una decisione su uno schema (*«è una domanda di stato → esegui il comando X»*), non un testo per l'utente. Quindi il guadagno di latenza c'è solo sulle richieste che si chiudono con una **decisione più un'azione deterministica**. Su un compito agentico il System One fa risparmiare la **configurazione** (budget, LoRA, tool), non la generazione.

**Le stesse tre condizioni di prima**:
- **Default rosso, nel dubbio delega.** La soglia di confidenza decide; la metrica è *dei casi sbagliati dal front, quanti ha passato al LLM*.
- **La distribuzione va misurata.** Quante richieste reali si chiudono con una decisione tipizzata? Senza questo numero il guadagno di latenza è un'ipotesi.
- **Il budget è un punto di partenza, non un tetto.** Il modello deve poterlo rivedere se la confidenza cala (D14, D18).

**E migliora le prestazioni?** `[INFERRED]` Può, per una via indiretta. Il budget giusto evita sia l'overthinking (che peggiora l'accuratezza, arXiv 2507.14417) sia il sotto-pensiero, e il LoRA giusto evita di caricare quello sbagliato. Va misurato sulle scene come qualsiasi altro pezzo.

## Le versioni open di Jev (ricerca del 2026-10-02)

> ⚠️ **Livello**: README e model card letti il 2026-10-02 per cinque progetti; il resto da risultati di ricerca. **Tutti i numeri sono dichiarati dagli autori**, nessuno verificato da terzi, e i benchmark sono diversi fra progetto e progetto, quindi **non si confrontano fra righe**. Gli elenchi (topic GitHub `jev-alternative` 30 repo, `typed-decisions` 93; madewithjev.com 146 build) non li ho scorsi tutti: ho preso un rappresentante per famiglia.

Quattro famiglie, che funzionano in modo diverso:

| famiglia | esempio | come funziona | numeri dichiarati | per noi |
|---|---|---|---|---|
| **A · lettura vincolata dal LLM** | `ikermoel/open-alternative-jev` (Apache-2.0) | **nessun training**: il LLM che hai già legge stato + domande in **una passata**; la risposta è la softmax sui logit delle sole lettere-opzione; calibrazione = una temperatura fittata su metà dei dati e misurata sull'altra | Qwen3.6-27B a 8 bit: **73,7%**, ECE **0,020**, **582 ms** per caso su *typed-decisions* (400 casi, 2.000 decisioni), su uno slice H200 | ottima per il **giudice**; per il front non è veloce |
| **B · encoder piccolo + testa tipizzata** | `wfzyx/von` (ModernBERT 395M, Apache-2.0) · Laya (421M inglese, **322M multilingue** su mmBERT) | encoder con testa di decisione, niente generazione | Von: **0,023 s** su A10G, 0,34 s su CPU; Banking77 0,838 / ECE 0,135; misto 0,775 / ECE 0,108 (tabella di poorjev, n non dato); «intelligence» 34,5 su JevBench | il più economico, ma ⚠️ **Von è solo inglese** e le nostre richieste sono in italiano; fuori dominio degrada |
| **C · decoder piccolo + LoRA + testa, addestrato su dati pubblici** | `mithalouni/system-one-open` (Gemma 4 E2B, MIT) · *decider* (Qwen3.5-2B-Base) | LoRA sull'attenzione + testa, addestrato su **92 dataset pubblici** di decisioni (intent, routing, NLI, scelta del tool…) più generatori sintetici; **dichiaratamente non distillato da Jev** | **76,7%** contro **86,9%** di Jev su 343 coppie dell'eval pubblico di TypeSafe; 74,8% su 23 tipi di compito mai visti; 97 ms su H100; pesi non ancora su HF | è **il nostro piano** (MiniCPM5-2B + LoRA + testa) già provato da altri |
| **D · distillato dalle uscite di Jev** | `autotrust/JEV-9B` (Qwen3.5-9B congelato + LoRA r=16 + testa) | addestrato su **498.010 righe di uscite di Jev 1.13** raccolte via OpenRouter | KL ≈ 0,019 da Jev; 90,2% d'accordo | ⛔ **escluso**: è distillazione da un modello proprietario. L'etichetta Apache-2.0 sul corpus non pulisce la provenienza (regola #29, `provenance-manifest`: il rischio è il modello maestro, non il tag di licenza). ToS di TypeSafe non letti |

E una tecnica che vale **a prescindere dalla famiglia**: `poorjev` (MIT) combina la temperatura con una **soglia conforme**, che converte un budget di rischio scelto («al massimo il 5% di errori fra le decisioni prese») nel segnale *«non lo so, passa al LLM»*. È la forma rigorosa del **default rosso** per una cascata. poorjev riporta anche, con onestà, che **Jev resta il più forte** sul suo benchmark misto (0,906 / ECE 0,045) e che a 77 classi la miscalibrazione è strutturale: la temperatura non la corregge (0,414 → 0,416).

### Quale per noi `[INFERRED]`

- **Giudice (offline) → famiglia A.** Zero training. Si usa il modello che fa già da giudice e si calibra la temperatura sulle **nostre** etichette, con la soglia conforme per decidere cosa passare al grande. La latenza non conta. ⚠️ Serve accesso ai **logit**: su un modello aperto servito da noi sì; via API solo se l'API restituisce le logprob delle opzioni — da verificare sul giudice deciso in D5.
- **Front (online) → famiglia C**, con la B come **baseline economica**. Un decoder piccolo con LoRA e testa tipizzata, addestrato sulle etichette che abbiamo (il budget minimo dalle scene a più livelli, D18; la LoRA dal routing di maggio) e su dataset pubblici di decisione **con licenza verificata**. Prototipo su MiniCPM5-2B. Laya multilingue come baseline, perché Von non regge l'italiano. ⚠️ Che MiniCPM5-2B regga bene l'italiano **non l'ho verificato**: è il primo controllo da fare.
- **La famiglia A fa anche da tetto di riferimento per il front**: con il Tier-1 che legge le stesse domande si sa quanto si perde scendendo al piccolo.
- **Una misura sola per tutte**: lo stesso insieme di decisioni nostre, e per ciascuna **richiamo degli errori passati al grande**, quota passata al grande, ECE. L'eval pubblico di TypeSafe come secondo riferimento, licenza permettendo.

## Ordine proposto
1. **Misurare la distribuzione** delle richieste: quota chiudibile con una decisione tipizzata.
2. **Front = il classifier di maggio con più teste** (budget, LoRA, tool), calibrato. Etichette dalle scene a più livelli.
3. **Giudice = lo stesso modello** con le teste di rubrica, offline.
4. Facoltativo: Jev via API come **confronto** sulle stesse etichette, se le condizioni d'uso lo permettono.
5. Prima di tutto il resto, a costo zero: verificare che MiniCPM5-2B regga l'**italiano**; se no, la base del front va cambiata.

**Cosa la ribalterebbe**: se la calibrazione del nostro piccolo non regge (un errore non escalato è frequente), allora il front resta il classifier minimo di maggio, e budget e configurazione li sceglie il LLM stesso.

## Residuo dalla lettura sbagliata
VL-JEPA (arXiv 2512.10942) decodifica il testo **solo quando serve** (2,85× meno decodifiche). È un'idea affine, ma è un altro oggetto. Sul linguaggio l'evidenza JEPA è mista (arXiv 2509.14252 contro 2605.15394).

## Links
[[valutazione-giudice-veloce-per-classe]] · [[valutazione-pensiero-adattivo-ed-effort]] (D18) · [[valutazione-idee-2026-09-29]] (D14) · [[../architecture/orchestrator-layer]] · [[../entities/modelli-piccoli-settembre-2026]] (MiniCPM5-2B)
