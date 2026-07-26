---
name: lab-plan-base-model-metro
description: PROPOSTA (#26 — attende approvazione) — il METRO STANDARD per confrontare i candidati base (Seed-OSS-36B vs Qwen3-32B vs Gemma 4 31B) a parità di condizioni. Separa LIVELLO 1 (il MODELLO, su pi liscio, payload piccolo, gira ovunque) da LIVELLO 2 (modello+HARNESS, i nostri tool, l'unico che satura i provider). Il problema centrale non è "quali test" ma "quali test DISCRIMINANO" — il floor attuale dà 100% a tutti e quindi non sceglie niente.
type: lab-plan
tags: [base-model, bake-off, evaluation, metro-standard, proposta, pi-vanilla, rate-limit, area-eval]
last_updated: 2026-07-26
---

> # ⛔ PROPOSTA — attende approvazione dell'utente (#26)
> **Origine**: utente TG msg 1973 (2026-07-26): *«non abbiamo un metodo standard per valutare tutti i prodotti … facciamo un metro standard, dobbiamo capire chi tra Seed-OSS vs Qwen vs Gemma 4 — stessi test, prima con pi normale che sappiamo funzionare a prescindere, e poi test secondari con il nostro harness con i nostri tool aggiuntivi»*.
> **Niente qui è stato eseguito.** Nessun credito impegnato.

# Metro standard per la scelta del modello base

## Perché la separazione a due livelli è giusta (e non è solo ordine)

| | **LIVELLO 1 — il MODELLO** | **LIVELLO 2 — modello + HARNESS** |
|---|---|---|
| Ambiente | **pi liscio**, tool suoi | il nostro harness, i nostri tool |
| Cosa misura | intelligenza · conoscenza · operare-il-sistema | se il modello **usa bene** ciò che gli diamo (memoria, lane) |
| Payload | piccolo | **25-27K token/chiamata** → satura i provider |
| Validità nel tempo | **sopravvive** a qualunque rifacimento dell'harness | **decade** a ogni cambio di harness |
| Chi ci gira | tutti e tre, ovunque, gratis | solo i finalisti |

⭐ **Il punto che rende la separazione necessaria, non estetica**: finora i due livelli erano **mescolati**, e l'unico confronto che abbiamo (il discriminante C4 sui due Qwen) è **contaminato** — misurava il modello *attraverso* un harness che satura i limiti dei provider. Un risultato del livello 1 invece resta vero anche se domani riscriviamo l'harness da zero.

---

## ⚠️ IL PROBLEMA CENTRALE — il metro che abbiamo NON discrimina

**Non è un dettaglio da mettere in fondo: è ciò che il piano deve risolvere.**

Il floor-check del 2026-07-08 (`eval/base-probes.mjs`, 13 probe: shell bash/PS/CMD/sh + python + JS + reasoning) ha dato **13/13 a tutti e quattro** i candidati provati. `[EXTRACTED — entities/base-model-candidates-2026-07 §Bake-off 1° giro]`

→ Rifare *quello* come «metro standard» produce un **pareggio a tre** e non sceglie niente. Il floor ha già fatto il suo lavoro (**tutti sono adeguati a operare il sistema**, il requisito minimo è superato da tutti) ed è **esaurito come strumento di scelta**.

**Quindi il livello 1 va progettato per DISCRIMINARE**, e questo significa due cose che il floor non aveva:

1. **Difficoltà sopra il tetto di tutti** — se tutti passano, la misura non porta informazione. Serve un livello dove qualcuno *fallisce*.
2. ⭐ **Calibrazione esterna** — un punteggio nostro (*«62%»*) **non significa niente da solo**: non sappiamo se 62 è buono. Con un benchmark pubblico accanto sappiamo *dove siamo nel mondo*, e scopriamo se il nostro test misura ciò che crede. **Solo-nostro = relevante ma non interpretabile. Solo-pubblico = interpretabile ma non allineato ai nostri assi.** Servono entrambi, ed è per questo che il caveat #1 della pagina-candidati dice da sempre *«i numeri vanno RIPRODOTTI da noi»*.

---

## Cosa deve misurare (gli assi, in ordine di peso per la NOSTRA identità)

Dall'identità Tier-1 (`project_base_model_intelligence`: **intelligenza e decomposizione, NON codificare**):

| # | Asse | Perché pesa | Stato dello strumento |
|---|---|---|---|
| **1** | **Decomposizione / analisi del problema** | è *l'identità dichiarata* del Tier-1 | 🔴 **non esiste** un test nostro |
| **2** | **Operare-il-sistema** (shell, file, iterazione) | requisito esplicito (`project_from_scratch_slm_future`) | 🟡 esiste ma **al floor** (tutti 100%) → va alzato |
| **3** | **Conoscenza** | il secondo asse della domanda originale (*intelligenza + conoscenza*) | 🔴 nessun test nostro; qui il benchmark pubblico è il metro naturale |
| **4** | **Robustezza** (injection, istruzioni ostili) | il modello opererà una macchina | 🟢 esiste: `run-injection*.mjs` |
| 5 | Coding | **deliberatamente basso**: NON è l'identità Tier-1 | 🟢 esiste (HumanEval) — utile come **controllo**, non come criterio |

> ⚠️ **Nota anti-deriva**: l'asse 5 è quello con gli strumenti più pronti, ed è **il meno rilevante**. Il rischio concreto è misurare ciò che è facile misurare e chiamarlo «il metro». Se il ranking finale è guidato da HumanEval, abbiamo scelto il modello sbagliato con grande precisione.

---

## Il piano (bozza — i punti aperti sono marcati)

### Fase 0 — condizioni identiche (vincoli di validità, costo zero)
Riusa **§R** di [[lab-plan-capable-models-validation]] invece di re-inventarlo (#33). I vincoli che contano qui:
- **stessi prompt, stesso ordine, stesso budget di contesto** su tutti e tre;
- **stessa superficie di tool** su tutti i bracci (il vincolo §R già scritto — è esattamente quello che il livello 2 aveva violato);
- **temperatura fissata** e, dove il provider lo permette, **seed fissato**; altrimenti **n ripetizioni** e si riporta la dispersione, non la media secca;
- **grader deterministico** e ancorato all'outcome (#10) dove possibile; dove serve un giudizio, **giudice cieco** al nome del modello.

### Fase 1 — asse 2+5 (esiste, va solo alzato) · costo ~zero
Alzare la difficoltà del probe-set finché **non è più un pareggio**. Materiale già presente: `data/humaneval-hard*.jsonl`, `hard3-fail.jsonl`, `hard5.jsonl`. **Criterio di successo del METRO (non dei modelli)**: la misura è utile solo se **separa** i tre. Se restano appaiati, il test è ancora troppo facile → si alza, non si conclude «sono equivalenti».

### Fase 2 — asse 3 (conoscenza) via benchmark pubblico · costo ~zero se free-tier
Riprodurre **MMLU-Pro** e **GPQA-Diamond** sui tre, stesso thinking-budget. È il caveat #1 che aspetta dal 2026-07-08. Dà la **calibrazione esterna** che manca.
🔴 **Da verificare prima**: i dataset non sono nel repo (`fetch-humaneval.mjs` e `fetch-swe-lite.mjs` esistono, un fetch per MMLU-Pro/GPQA **no**) → va scritto, oppure si sceglie un benchmark già scaricabile con quel che c'è.

### Fase 3 — asse 1 (decomposizione) · **è qui il lavoro vero**
🔴 **Non esiste e non si può copiare**: i benchmark pubblici di reasoning misurano *risolvere*, noi vogliamo misurare *scomporre e pianificare*. Va disegnato. **Non lo abbozzo qui**: è una decisione di design che merita il suo giro, e buttarlo giù di slancio produrrebbe un test che misura la forma della risposta invece della qualità del piano — l'errore contro cui il progetto ha già una regola (#10, reward all'outcome).
→ **Proposta**: farlo **dopo** le fasi 1-2, con i risultati in mano, perché sapremo *dove* i tre si separano davvero.

### Fase 4 — livello 2 (harness) · **solo sui finalisti**
Il discriminante C4 memoria, con la correzione del pacing (sotto). Non prima: costa, ed è specifico del nostro harness.

---

## Raggiungibilità e costo dei tre candidati `[da ri-verificare al lancio]`

| Modello | Come lo raggiungiamo | Costo |
|---|---|---|
| **Qwen3-32B** | **Groq** (free) ✓ già usato nel floor-check · OpenRouter | **zero** |
| **Gemma 4 31B** | 🟡 `GEMINI_API_KEYS` presente e l'esperimento E-COMP ha girato su `gemma-4-31b-it` → **la via esiste**, ma **quale endpoint** non l'ho ri-verificato oggi | presumibilmente zero (free tier) — **da confermare** |
| **Seed-OSS-36B** | **solo SiliconFlow** (`SILICONFLOW_KEYS` presente, ~$0.21/$0.57 per M) | 🟡 **a pagamento** — $9.997 residui |

> ⛔ **CORREZIONE 2026-07-26 — la tabella sopra è SUPERATA, e la mia riga *«asimmetria strutturale, non aggirabile»* era FALSA.** Interrogati i provider (`/models`, non la wiki): **SiliconFlow serve TUTTI E TRE i candidati** — `Qwen/Qwen3-32B` · `ByteDance-Seed/Seed-OSS-36B-Instruct` · `google/gemma-4-31B-it`. *(OpenRouter ne serve due dei tre, con `gemma-4-31b-it:free` e `qwen3-32b`; Seed-OSS lì non c'è.)*
>
> ⭐ **Perché è meglio di una comodità**: un solo provider = **stesse condizioni su tutti i bracci**, che è il vincolo **§R** che avevamo scritto e che finora non riuscivamo a rispettare **proprio perché i modelli stavano su servizi diversi**. È anche la ragione per cui il confronto C4 sui due Qwen resta **sporco**: bracci su infrastrutture diverse.
> **Il trade-off, esplicito**: stesso-provider (a pagamento, **confrontabile**) ↔ misto (in parte gratis, **non confrontabile**). Su 12 probe corte il costo è trascurabile → **vince il confrontabile**. La riga *«due gratis, uno no»* nasceva dall'aver guardato **un provider alla volta** invece di chiedere a ciascuno cosa avesse: il perimetro sbagliato, di nuovo.
> ⚠️ **Nota operativa**: **Seed-OSS-36B è LENTO** (ragiona a lungo) — i run vanno messi in background con tempo adeguato, non con timeout da smoke-test.

~~⚠️ **Asimmetria strutturale, non aggirabile**: due candidati girano gratis, uno no.~~

---

## Il vincolo di velocità del provider — CHIUSO, con i numeri veri

`[EXTRACTED — docs.siliconflow.com/en/userguide/rate-limits/rate-limit-and-upgradation, letto 2026-07-26]`

| Tier | RPM | **TPM** |
|---|---|---|
| **L0** (nuovi account) | 1.000 | **40.000** |
| L1 | 1.200 | 60.000 |
| L2 | 2.000 | 80.000 |
| L3 | 4.000 | 160.000 |
| L4 | 8.000 | 500.000 |
| L5 | 10.000 | 2.000.000 |

Il tier si determina sulla **spesa mensile** (si prende il massimo fra mese precedente e mese corrente). Con $0.003 spesi siamo **L0**.

**Il conto che spiega tutto**: 40.000 TPM ÷ **25-27K token per nostra chiamata** = **~1,5 chiamate al minuto**. Una singola chiamata consuma **due terzi del minuto**.

⭐ **Il credito NON è il vincolo**: $10 a ~$0.21/M valgono decine di milioni di token; anche saturando il tetto servirebbero **~20 ore continuative** per finirli. Il problema è **la velocità, non la quantità** — e la velocità è colpa nostra.

### La causa esatta, ed è un nostro difetto
`run-session.mjs:278` mette la pausa **tra un TASK e l'altro** (*«pacing tra i task»*, commento esplicito nel codice). **Dentro** un task il ciclo agentico fa più turni **back-to-back, senza alcuna pausa**. Un task multi-turno spara 25K + 25K + 25K nello stesso minuto → ~3× oltre il budget, e muore.
→ **Fix**: pacing **fra le CHIAMATE**, non fra i task (~45 s/chiamata a payload attuale). La manopola esiste già ma è nel posto sbagliato (#33: correggere dove sta, non costruirne un'altra).

### ⛔ CORREZIONE a una nostra conclusione — la «leva-fix primaria» di F37 era sbagliata

F37 concludeva: *«il vero costo è il TOOL-SCHEMA, non le lane → leva-fix primaria: ridurre i tool-schema»*. **Quell'attribuzione non era mai stata misurata**: era dedotta dal vedere `tools 32` accanto a un body grosso.

**Misurata il 2026-07-26** (`eval/measure-tool-payload.mjs`, costo **zero** — chiave volutamente invalida, il body viene dumpato prima dell'invio):

| profilo | tool | body turno-1 | di cui tool |
|---|---|---|---|
| `core` | 8 | 33.4 KB | 5.9 KB |
| `minimal` | 12 | 30.6 KB | 8.1 KB |
| `standard` | 34 | 54.8 KB | **27.1 KB** |
| `full` | 62 | 68.0 KB | 41.5 KB |

Sul payload che ha **davvero fallito** (92.9 KB, F37): i tool erano **27.1 KB = ~29%**. Il restante **~71% è conversazione/system** — ed è **la parte che cresce** (92.9 → 104.7 KB mentre i tool restano fissi).
→ Passare a `minimal` risparmia ~19 KB fissi = **~20%**, cioè **da ~4 a ~5 chiamate**. **Non risolve.** Chi avesse seguito la nota di F37 avrebbe fatto il lavoro, speso credito, e ritrovato lo stesso crash.

> ⭐ **Lezione (#0)**: il log diceva `tools 32` — **vero**. Noi abbiamo concluso *«sono i tool a pesare»* — **mai verificato**. È la finestra, non il razzo: una misura corretta di **un'altra cosa**, promossa a diagnosi, rimasta 12 giorni in wiki come *fix raccomandato*.

⚠️ **Due trappole da non prendere**:
- **`core` NON è utilizzabile** per il livello 2: non ha le meta-tool → nessuna riscoperta → `src/tool-gating.mjs:72` lo dichiara *«test NON discriminante»*. Sceglierlo per stare sotto il TPM **farebbe passare la misura eliminando ciò che misura**.
- ~~**ANOMALIA non spiegata**: `core` produce un body più grande di `minimal`~~ → ✅ **CHIUSA lo stesso giorno: è RUMORE — misurata a n=3, non archiviata a n=1.**

  | profilo | run 1 | run 2 | run 3 | **dispersione** |
  |---|---|---|---|---|
  | `core` (8 tool) | 27.3 KB | 32.9 KB | 35.0 KB | **7.7 KB** |
  | `minimal` (12 tool) | 32.6 KB | 33.7 KB | 34.7 KB | **2.1 KB** |

  Il divario che sembrava un'anomalia (**2.8 KB**) sta **dentro** la dispersione di `core`, che è quasi **3× più grande**. E il colpo che chiude: **al run 2 il segno si inverte** — `core` 27.3 < `minimal` 33.7. ⭐ **Un segnale non cambia segno.**
  > ⛔ **Refutata anche l'ipotesi intermedia, e vale più del risultato.** Con **due** punti sembrava che entrambi i profili **crescessero nel tempo** (`minimal` 30.6→32.6, `core` 33.4→35.0) e l'ipotesi era attraente: *«la parte non-tool cresce mentre il repo cresce»* — cioè un costo che aumenta da solo senza che nessuno lo decida. **Il terzo punto l'ha uccisa**: `core` fa 35.0 → 27.3 → 32.9, nessuna monotonia. ⭐ **Due punti bastano sempre a raccontare una storia** — ed era stata *dichiarata come ipotesi da verificare*, non asserita: è l'unica ragione per cui la sua morte è costata zero.
  ✅ **I byte dei TOOL sono deterministici**: 5.9 / 8.1 / 27.1 / 41.5 KB, **identici in tutti e tre i run** → il **verdetto del 21% regge**, perché poggia sui byte di schema, non sulla differenza fra profili.

---

## Caveat onesti

- **La stima in token è calibrata su UN punto** (F37: 92.9 KB → 25.140 `prompt_tokens` riportati dal provider = 3.78 B/tok). Meglio della proporzionalità 15/32, ma **non è il tokenizer del modello** → ordine di grandezza.
- **Il body misurato è del PRIMO turno**: è il caso migliore, poi cresce.
- **Nessuna delle fasi è stata eseguita.** Niente qui è un risultato.
- **La fase 3 è la più importante e la meno definita** — dirlo è più utile che riempirla di scaffolding.

## Links
[[entities/base-model-candidates-2026-07]] (la rosa, i verdetti, i 2 giri già fatti) · [[lab-plan-capable-models-validation]] (§R protocollo di rigore — da riusare, non riscrivere) · [[harness-experiment-log]] (§F34 discriminante C4, §F37 il run morto) · [[fix-ledger]] (F26) · [[todo]]
