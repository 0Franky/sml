---
name: harness-inventory-triage-2026-08-04
description: "Passo 1 della fase (C) — inventario delle 25 estensioni dell'harness + i flag di config, con il triage «utile / neutro / dannoso su un modello CAPACE» (Sonnet, Opus 5). Stabilisce il criterio giusto (quale DEFICIT compensa una feature, non «è nata per gli SLM»), separa ciò che recede con la capacità da ciò che non recede mai, e registra il fatto operativo che blocca ogni misura: i default del repo sono in regime SLM."
type: architecture
tags: [harness, triage, context-engineering, fase-C, misura, regime, area-harness]
sources:
  - harness/.pi/extensions/ (25 estensioni, intestazioni lette il 2026-08-04)
  - harness/src/harness-config.mjs (SSOT dei default)
  - wiki/architecture/harness-feature-catalog.md (il catalogo di DESIGN, 2026-06-29)
  - wiki/harness-experiment-log.md §0 + §0.1 (playbook per-modello) · F26/F32/F33/F34/F37
last_updated: 2026-08-04
status: passo 1 di (C) — analisi a costo zero, nessuna misura eseguita
---

# Inventario dell'harness e triage per un modello capace

> **A che domanda risponde** (utente msg 2065): *«ci sono dei tool specifici per gli SLM che non andrebbero
> bene con i modelli che voglio testare — Sonnet e Opus 5. Voglio che innanzitutto mi analizzi tutte le
> feature e tutte le classi da valutare»*.
>
> **Costo**: zero crediti di inferenza. È lettura di codice e di wiki. È il prerequisito dei passi 2-4
> di [[../STATO-2026-08-04]] §4.

---

## 1. Il criterio — e perché non è quello che sembra

La domanda naturale è *«questa feature è nata per gli SLM, sì o no?»*. **È la domanda sbagliata**, e mandarci
dietro il triage produrrebbe due errori simmetrici: spegneremmo difese che non c'entrano nulla con la taglia
del modello, e terremmo accese pezze convinti che «male non fanno».

La domanda che discrimina davvero è: **quale DEFICIT stava compensando questa feature, e un modello capace
ha quel deficit?** `[INFERRED — il criterio è mio; i deficit sotto sono estratti dalle intestazioni]`

Ne escono tre deficit distinti, con destini diversi:

| Deficit compensato | Recede con la capacità del modello? |
|---|---|
| **① FINESTRA** — l'informazione non ci sta | **No: recede col REGIME.** Dipende da quanto è pieno il contesto, non da chi è il modello |
| **② DISCIPLINA** — l'informazione c'è e il modello non la usa | **Sì, ed è qui che si concentra il rischio di DANNO** |
| **③ GARANZIA** — non si delega a nessun modello, quanto capace sia | **Mai.** E su un modello capace il valore *sale*, perché agisce di più |

⭐ **La conseguenza pratica più importante**: le famiglie ① e ③ **non vanno valutate sull'asse «aiuta il
modello»**, perché non è per quello che esistono. Valutare il pre-flight chiedendosi se Opus lavora meglio con
esso acceso è come giudicare un airbag dal comfort di guida.

---

## 2. Il triage — 25 estensioni

Fonte: `harness/.pi/extensions/`, intestazioni lette una per una il 2026-08-04. Quasi tutte **dichiarano da
sole** il proprio regime — il triage è in larga parte `[EXTRACTED]`, non una mia congettura. Dove ho inferito,
è marcato.

### ① Deficit di FINESTRA — regime-dipendenti (11)

`native-window` · `nested-compact` · `checkpoint` · `context-assembly` · `conversation-capture` ·
`tool-call-log` · `task-digest-capture` · `eviction-checkpoint` · `file-view` · `context-views` · `sliding-var`

**Verdetto: né utili né dannose in astratto — dipende dal riempimento.** Lo abbiamo già misurato: **F32** dice
che su finestra ampia lo scaffolding è **overhead (2.6× token a recall invariato)** e diventa decisivo solo
quando la finestra satura.

⚠️ **Implicazione diretta sul disegno degli esercizi**: un esercizio corto su Sonnet/Opus **misurerebbe solo il
costo** di questa famiglia, mai il beneficio — e produrrebbe il verdetto «l'harness è overhead», che sarebbe
vero e inutile. *(È anche il motivo per cui `adaptiveContext` esiste ed è OFF di default.)*

🔴 **CORREZIONE a quanto avevo scritto qui poche ore prima** — avevo concluso *«servono due regimi, uno
sotto-saturazione e uno in saturazione»*. **Non è ottenibile su un modello capace**, e il perché era **già
scritto** da tre settimane in [[../lab-plan-capable-models-validation]] **C-BLOCK-1**: `MODEL_CTX`/`keepTurns`
finestrano **solo il braccio nostro**; il braccio *vanilla* usa la finestra nativa reale (128K-1M), che non
possiamo saturare a costi sensati. Quindi il confronto giusto sui capaci **non** è *ours-vs-vanilla in
overflow* (quello resta sul banco locale `qwen-ctx16k`, dove è già verde a **F32**) ma
**`ours@keep-basso` vs `ours@finestra-piena`**: le lane sostituiscono una compressione che ci siamo imposti
noi. *(Istanza esatta della regola #37: stavo ri-decidendo una cosa già decisa, e il perché esisteva già —
andava cercato prima, non dopo.)*

### ② Deficit di DISCIPLINA — le vere candidate al «dannoso» (5)

| Estensione | Cosa fa | Perché è sospetta su un modello capace |
|---|---|---|
| **`slm`** | inietta `how_memory_works` + reminder + `<resources>` | Il file **lo dice di sé**: *«aiuta un modello DEBOLE ma è RUMORE per uno capace (H6)»*, ed è progettata per essere **disinstallata togliendo il file** |
| **`tool-gating`** | in modo `gated` nasconde la coda lunga dei tool | Nata perché *«un 9B annega se vede ~50 tool»*. Su un modello capace **sottrae strumenti** e aggiunge due passaggi (`find_tool`/`open_category`) per riottenerli |
| **`tool-result-frame`** | avvolge ogni `tool_result` in un envelope `untrusted` | Nata da un bug **P0 reale** (il 9B eseguiva l'output di un tool come istruzione). Un modello capace distingue già i ruoli → probabile **neutro-con-costo**. ⚠️ **Ma il costo è token, il beneficio è anti-injection**: non è una pezza da rottamare a cuor leggero, è a cavallo fra ② e ③ |
| **`anti-fixation`** | conta i fallimenti consecutivi e inietta un nudge escalante | Già **OFF di default** e **mai validata**: il file dichiara *«costruito ≠ efficace»* |
| **`laneMemoryHint`** (flag) | livello dello scaffolding: `full` / `lean` / `off` | La config stessa dice *«full = regime SLM debole; lean = modello più capace»* |

**Verdetto: è la famiglia da testare acceso-contro-spento**, con l'aspettativa dichiarata in anticipo che
**spento vinca**. Se spento non vince, l'aspettativa era sbagliata ed è un risultato — purché lo scriviamo
*prima*, altrimenti è razionalizzazione a posteriori.

### ③ GARANZIA — non recedono, e non si spengono nei test (4)

`pre-flight` (blocca `rm -rf`, `git reset --hard`, `dd`…) · `secrets-guardrail` (redige in uscita) ·
`regex-ingress` (sigilla i segreti in ingresso, prima che raggiungano il provider) · `verifier-sandbox`
(esegue i verifier isolati).

**Verdetto: restano accese in ogni configurazione.** E vanno valutate su un asse tutto loro — non *«il modello
lavora meglio?»* ma ***«il gate regge quando qualcuno prova ad aggirarlo?»***. Su un modello capace questa
domanda è **più** urgente, non meno: un agente più bravo compie più azioni e le compie più in fretta.

### ④ Fuori dal perimetro di (C) — ma per ragioni diverse (5)

| | Perché fuori |
|---|---|
| **`gemini-compat`** | shim per un difetto dell'endpoint Google. Irrilevante per Anthropic — **da verificare che non si attivi** e basta |
| **`turn-trace`** | ⭐ **non è una feature sotto test: è il nostro STRUMENTO DI MISURA.** Deve restare acceso sempre (vedi §4) |
| **`error-memo` · `contradiction-detection` · `vars-queue`/`var-ops`** | Sono meccanismi di stato pienamente funzionanti, ma il loro valore dipende dalla **decisione** di usarli — appartengono all'asse ortogonale del §3, non al triage utile/dannoso |

*(I file in `harness/verifiers/` e i lab in `harness/tools/` sono **attrezzatura di laboratorio del training**,
non parti del serving: non entrano affatto in (C).)*

---

## 3. ⭐ L'asse ortogonale — le feature che non hanno mai avuto un pilota

Questo è il punto che il triage «utile / dannoso» da solo **non fa vedere**, e secondo me è il più importante
della fase.

Molte feature sono **F+S** nel senso della regola #11: l'harness fornisce il *meccanismo* (F), ma il valore si
realizza solo se qualcuno prende la *decisione* di usarlo (S) — quando fare checkpoint, quando aprire e
chiudere una vista su un file, quando entrare in focus, quando richiamare una lezione, quando tirare (pull) la
coda delle proprie tool-call.

**Quella decisione non è mai stata presa da un modello in grado di prenderla.** Il playbook per-modello lo dice
in modo netto: il 9B **non salva** (`note=0`) e **confabula col fatto davanti**; il 32B **non salva e
confabula**; solo il 3.6-27b salva di sua iniziativa. `[EXTRACTED — wiki/harness-experiment-log.md §0]`

→ **Conseguenza**: per queste feature non sappiamo se siano buone o cattive. Sappiamo solo che **non sono mai
state guidate**. Un verdetto «non serve» raccolto oggi da un test col 9B non è un verdetto sulla feature: è un
verdetto sul pilota.

⭐ **Quindi (C) non è solo l'occasione di capire cosa spegnere. È la prima occasione di vedere l'harness
funzionare.** E questo cambia il disegno degli esercizi: almeno uno deve mettere il modello in condizione di
**dover pilotare** l'harness (stato che deve sopravvivere, materiale che non ci sta tutto insieme), non solo di
sopravvivergli.

Le candidate: `checkpoint` · `nested-compact` (`enter_focus`/`pop_focus`) · `file-view` · `context-views` ·
`error-memo` · `vars-queue`/`var-ops` · `contradiction-detection`.

---

## 4. Il fatto operativo che blocca ogni misura: **i default sono in regime SLM**

Verificato leggendo `harness/src/harness-config.mjs` e la config attiva `harness/.pi/harness.config.json`
(che oggi sovrascrive **un solo** campo: `evictionCheckpoint: "inject"`).

**Lanciare Sonnet o Opus 5 sul repo com'è adesso significa consegnargli l'intera pila di stampelle** — e
misurare quelle, non l'harness.

| Campo | Default oggi | Perché è un problema su un modello capace |
|---|---|---|
| `toolGating` | **`gated`** | Gli nasconde la coda lunga dei tool |
| `toolProfile` | `standard` | Quanti tool restano attivi quando `gated` |
| `laneMemoryHint` / `…Level` | **`true` / `full`** | Checklist anti-amnesia completa nel contesto |
| `nativeKeepTurns` | **`6`** | Tronca l'array nativo a 6 turni **anche con una finestra da 200K** |
| `maxOpenFileViews` | `3` | Budget di viste concorrenti pensato per un contesto piccolo |
| `messagesCharCap` | `4000` | ~1300-1400 token per la lane dei messaggi |
| estensione `slm` | **installata** | È lo scaffolding-crutch; si disinstalla **spostando il file** |

→ **Serve un «profilo capace» prima di qualunque run.** Costa zero crediti ed è puro lavoro di config: è la
cosa più economica che possiamo fare e la più facile da dimenticare.

**Nota di igiene trovata strada facendo** `[EXTRACTED]`: `harness/.pi/extensions/tool-gating.ts:10` documenta
*«`off` (default)»*, mentre la SSOT (`harness/src/harness-config.mjs:117`) e la riga 25 dello **stesso file**
dicono `gated`. Il runtime legge la config, quindi **il default effettivo è `gated`**: l'intestazione è
rimasta indietro rispetto alla decisione successiva. Difetto piccolo, ma è esattamente il tipo che fa
configurare la cosa sbagliata a chi legge il commento invece del codice (#16).

---

## 5. Cosa (C) può chiudere, che è già aperto e ci sta costando

`wiki/harness-experiment-log.md` **§0.1** registra un buco che nessuno ha mai colmato:

> Il design dell'harness poggia sulla regola **«autorità = canale `user`, mai `system`»**, e la ragione
> registrata è che *«il `system` è ignorato»* — misurato in modo controllato **sul 9B**, che è il modello di
> **test**, non il target. L'unico dato vicino su un modello grande (gemma-26b) è **INCONCLUSIVO**: `4/6` contro
> un controllo di `~3.7/6`, cioè 0.3 item di differenza = rumore.

**Non sappiamo se la scelta di design più load-bearing dell'harness valga per un modello vero.** Sonnet e Opus
5 sono modelli di classe-target: la stessa sonda che gira negli esercizi può chiudere questa domanda **senza
un run dedicato**, se la prevediamo nel disegno.

⚠️ E la legge trasversale del playbook (**F34**) va rispettata anche qui: **la viabilità della memoria-harness è
model-specific e NON monotona nella taglia** — un modello più grosso non è automaticamente più bravo a usare
l'harness. Quindi *«Sonnet e Opus sono grandi, quindi si comporteranno come il 27b»* è un'inferenza vietata:
va misurata, non dedotta.

---

## 6. La buona notizia sul test di auto-report: **lo strumento esiste già**

Il passo 4 di (C) chiede: i modelli lavorano, poi raccontano come si sono trovati, e io **incrocio il racconto
con la storia reale** cercando le contraddizioni. Serviva un registro fedele di cosa è successo davvero.
**Ce l'abbiamo, e non va costruito niente** `[EXTRACTED — intestazioni delle tre estensioni]`:

- **`turn-trace`** → a ogni richiesta al provider registra **ciò che il modello riceve davvero** (system prompt
  + array messaggi post-windowing) in `.pi/state/trace/trace-<convId>.jsonl`. È il ground-truth del contesto.
- **`conversation-capture`** → persiste messaggi utente e risposte in `.pi/state/conversations.db`.
- **`tool-call-log`** → registra ogni tool-call con argomenti ed esito.

Insieme danno la **storia sequenziale completa**: cosa ha visto, cosa ha detto, cosa ha fatto. Il confronto
auto-report ↔ traccia è quindi un lavoro di **analisi**, non di costruzione.

⚠️ **Caveat da dichiarare subito**: quei file sono **gitignored e runtime**. Vanno **copiati fuori a fine
sessione**, altrimenti il materiale del test più costoso è anche il più facile da perdere.

---

## 6bis. ⭐ Il passo 2 è in gran parte GIÀ FATTO — [[../lab-plan-capable-models-validation]]

Cercando *prima* di progettare (#33), è emerso che **il disegno degli esercizi esiste già**, in un piano del
**2026-07-11** che ha attraversato due review-loop multi-agente (29 findings → 7 famiglie di rigore) ed è
fermo solo perché **attende scope e budget dall'utente**. Contiene, già pronti:

- **Gate P0 VERIFICATO** (2026-07-11): key OpenRouter valida, credito attivo, **`usage.cost` esposto
  per-chiamata → un CAP di spesa si può imporre in-process con stop automatico a soglia**. Slug e prezzo di
  `anthropic/claude-sonnet-5` confermati (ctx 1M, $2/$10 per-M).
- **T2.2 «esperienziale ground-truth-paired»** = *esattamente* il test di auto-report chiesto dall'utente,
  con già scritto il vincolo che lo rende affidabile: **ogni risposta introspettiva va appaiata al tool-log e
  al `<context>` reale, mai self-report nudo**.
- **T2.4 «long-horizon agentic reale»** = la traccia di lavoro vera (≥15 turni, una decisione al turno 3 che
  vincola il turno 18).
- **T2.3 «lo scaffold aiuta o nuoce al capace»** = il braccio oggettivo che il triage di questo documento
  serve a disegnare: `{vanilla, ours-full, ours-lean}`.
- **C-BLOCK-2**, che va letto prima di fidarsi di qualunque auto-report: sycophancy e introspezione
  confabulata rendono la famiglia qualitativa **generatrice di ipotesi, mai prova**. E **T1.5** misura
  direttamente quanto il modello sia affidabile quando dice quale lane ha usato.
- **Scoperta di costo già fatta** (2026-07-11): una **chiamata singola** di giudizio qualitativo costa
  **~$0.02-0.04 anche sui frontier**, contro i ~$3 di una sessione agentica. → **il pezzo "dimmi come ti sei
  trovato" è quasi gratis; a costare è il lavoro**, non l'opinione.

**Cosa è davvero NUOVO** rispetto al piano, e quindi da fare: **(a)** Opus 5 non è nel gate P0 (slug, finestra
e prezzo da verificare come si fece per Sonnet); **(b)** il piano tiene T2.4 e T2.2 come lab **separati**,
mentre la richiesta dell'utente li **fonde** — lavora, poi racconta, e io incrocio: la fusione è **più
economica** (la sessione di lavoro si paga una volta sola e l'intervista costa centesimi) **ed è l'unica forma
in cui l'incrocio racconto↔traccia è possibile**, perché senza lavoro non c'è traccia da incrociare;
**(c)** il triage per-feature di questo documento, che il piano non aveva.

---

## 7. Cosa NON è ancora deciso *(dichiarato, non nascosto — #37)*

1. ✅ **RISOLTO il 2026-08-04** → [[../concepts/self-report-vs-trace-adjudication]]. *(Era: come si misura una
   «contraddizione» senza arbitrio.)* Il predicato è stato fissato **a dati non ancora esistenti**, e la cosa
   che è emersa scrivendolo è che una divergenza ha **tre facce che non si sommano** — e che la faccia
   «**punto cieco**» ha un'implicazione scomoda per noi: **un pezzo dell'harness può funzionare senza che il
   modello se ne accorga**, quindi ciò che finisce lì **non va tagliato perché «non lo apprezzano»**.
2. **Il regime di saturazione** per la famiglia ①: quanto contesto serve per uscire dal regime dove l'harness è
   solo overhead. Non ricavabile dall'inventario.
3. **Se `tool-result-frame` vada in ② o in ③.** Ha un beneficio anti-injection reale e un costo in token: la
   collocazione dipende da se un modello capace resta comunque vulnerabile all'injection annidata — che è una
   domanda **misurabile**, e vale la pena misurarla.
4. **Budget e traccia di lavoro** — chieste all'utente il 2026-08-04, in attesa.

---

## 8. Via d'accesso ai due modelli — stato VERIFICATO il 2026-08-04

> Tutto quanto segue è **eseguito, non dedotto**. Nasce da un mio errore: avevo affermato all'utente che
> l'abbonamento *«non è quel tipo di accesso»*. **Era falso**, e l'ho detto ragionando per categorie invece di
> aprire il pacchetto — istanza del valore **#0** (fermarsi al livello comodo), con l'aggravante di aver
> **negato all'utente un'opzione che voleva**, sulla mia autorità.

| Fatto | Come l'ho verificato |
|---|---|
| **Anthropic è un provider NATIVO di pi** — nessuna estensione da scrivere, nessun SDK da installare | `pi --list-models anthropic` elenca 25 modelli. *(Stavo per adattare le 604 righe di `examples/extensions/custom-provider-anthropic`: non servivano. Ho anche installato `@anthropic-ai/sdk` e poi **disinstallato** — albero pulito.)* |
| **L'OAuth Anthropic è nel CORE di pi**, non solo nell'esempio | `…/pi-coding-agent/node_modules/@earendil-works/pi-ai/dist/utils/oauth/anthropic.js` esiste; l'esempio mostra il flusso `/login` → `claude.ai/oauth/authorize` **+** il fallback `ANTHROPIC_API_KEY` |
| 🔴 **pi 0.80.2 NON conosce i modelli «5»** — il catalogo si ferma a `claude-opus-4-8` e `claude-sonnet-4-6` (entrambi **1M** di contesto) | `--list-models anthropic`, sia `--offline` sia online: stesso esito. **Non è un problema di credenziali: quel nome per pi non esiste** |
| **pi 0.83.0 è disponibile** (installata: 0.80.2) | `npm view` |
| **OpenRouter HA i «5»**: `anthropic/claude-opus-5` 1M `$5/$25` · `anthropic/claude-sonnet-5` 1M `$2/$10` | chiamata a `/api/v1/models`. Key valida, **pay-as-you-go senza tetto** (`limit: null`), `usage=$0.78` |
| **`curl` è bloccato in questo ambiente, `fetch` di Node no** | `curl` → HTTP 000 su qualsiasi host; `node fetch` → 200. **I runner sono Node → funzionano** |

**L'inversione da tenere a mente**: i modelli «5» stanno su **OpenRouter** (che l'utente vuole riservare ai
base-model), mentre la strada col **suo piano** arriva oggi al **4.8**.

⭐ **Perché il 4.8 probabilmente basta**: la domanda di (C) è *«il nostro contesto aiuta o intralcia un modello
CAPACE?»*. `opus-4-8` e `sonnet-4-6` **sono capaci e hanno la finestra da 1M** — cioè esattamente il regime in
cui lo scaffolding rischia di essere solo peso (F32). La misura non cambia. **Cambierebbe** solo se lo scopo
fosse *certificare la config da spedire sui modelli che l'utente usa davvero*, invece di *capire se l'harness
funziona*: sono due domande diverse e la risposta dipende da quale delle due stiamo facendo. **Chiesto
all'utente, in attesa** (#26).

⚠️ **Aggiornare pi a 0.83 è un cambio STRUTTURALE** — è il pavimento sotto 25 estensioni. Non si fa di
iniziativa e non si fa **mentre** si misura: prima i test sul pavimento attuale, poi eventualmente l'upgrade
con la sua verifica.

## Links

[[../STATO-2026-08-04]] (§4 = i quattro passi di (C)) · ⭐ [[../lab-plan-capable-models-validation]] (**il disegno
degli esercizi, già fatto e già revisionato — leggere PRIMA di progettarne uno nuovo**) · [[harness-feature-catalog]] (il catalogo di *design*;
questo è l'inventario del *costruito*) · [[../harness-experiment-log]] (§0 playbook per-modello · §0.1 il buco ·
F26/F32/F34/F37) · [[../concepts/training-vs-harness-classification]] (la regola #11 che governa il §3) ·
[[../model-testbook]]
