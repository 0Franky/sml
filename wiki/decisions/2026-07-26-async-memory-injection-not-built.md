---
name: 2026-07-26-async-memory-injection-not-built
description: PROPOSTA (#26 — attende ratifica) — l'idea utente di una "memoria asincrona" che interroga un RAG/LLM-wiki con gli ultimi messaggi e inietta il risultato come ricordo. Verdetto proposto NON COSTRUIRE, e non per prudenza: il caso dell'esempio è già risolto e misurato al 100%, la seconda metà dell'idea è già stata costruita/accesa/REFUTATA (+74% token, recall peggiore), e il residuo vero l'utente l'ha già assegnato due volte al training.
type: decision
tags: [memoria, harness, rag, context-injection, proposta, ssot, reward-hacking, area-harness]
last_updated: 2026-07-26
---

> # ⛔ PROPOSTA — attende la ratifica dell'utente **dal 2026-07-26**  *(età dichiarata: vedi nota)*
> *(La data non è decorazione: fino al 2026-07-31 questa riga non ne aveva, e un'attesa senza data sembra fresca per sempre — è il difetto che ha tenuto un ADR «in attesa» per 71 giorni. Ora invecchia da sola e si vede.)*
> **Origine**: idea utente TG msg 1964 + *«fai analisi fatta bene»* (msg 1965). Analisi eseguita da un team di ricerca il 2026-07-26; le quattro affermazioni portanti **ri-verificate a mano** prima di accettarle (vedi §Verifica).
> **Nessun codice scritto, nessun meccanismo toccato.**

# Memoria asincrona con iniezione del ricordo — proposta: NON COSTRUIRE

## L'idea, nelle parole dell'utente

Prendere gli ultimi messaggi / una standardizzazione della situazione attuale, usarli come **query asincrona** dentro un RAG o la LLM-wiki, e **iniettare** il risultato come *ricordo*. Esempio dato: il modello dice *«dovrei sistemare questa cosa»* ma **l'ha già fatta** → deve accorgersene e concludere *«l'ho già fixata, forse il mio fix di prima faceva schifo, è la struttura del codice a essere sbagliata»*.
Due varianti: **(a)** è il **sistema** a sottoporre il ricordo · **(b)** è il **modello** addestrato a lanciare da sé la ricerca.

## Verdetto proposto

**Non costruire (a). Non costruire (b) oggi. Nessuna versione ridotta.** E la ragione non è prudenza — è che **il lavoro è già stato fatto, in tre pezzi distinti**:

1. **Il caso dell'esempio è già risolto e misurato**: `task-digest` estrae ciò che il modello ha fatto e lo **pinna** in `<facts>`. Recall **100%** dove la baseline sta a 67%/50%/67%, **e con meno token**; in overflow 100% contro 25%. **Zero headroom**: un iniettore non può migliorare un 100%, può solo sfrattarlo.
2. **La seconda metà dell'idea è già stata costruita, accesa e REFUTATA.** Il *«forse il tuo approccio è sbagliato, riconsidera la struttura»* esiste come nudge anti-fissazione: misurato **pass 1/5 → 0/5 con +74% token**. È **default-OFF per quel motivo**.
3. **Il residuo vero** (i fatti durevoli detti in chat) **l'utente l'ha già deciso due volte**: non si risolve nell'harness — *«le cose le deve salvare il modello secondo la sua intelligenza, non voglio regex»* — e il fix scelto (classe di training) **è già stato eseguito**.

## I cinque meccanismi che coprono già il bisogno (#33 — cerca-se-esiste-già)

| bisogno | meccanismo | dove | stato |
|---|---|---|---|
| *«cosa ho già fatto»*, pinnato | **task-digest** → fatto auto `imp=100` in `<facts>` | `harness/src/task-digest.mjs:155-170` · gate `.pi/extensions/task-digest-capture.ts:19` | **default-ON** |
| azioni oltre il ring | **`view_tool_calls`** store-backed | `.pi/extensions/context-views.ts:52` · `src/tool-call-store.mjs:20` | attivo |
| messaggi fuori finestra | **`get_conversation`** | `src/conversation-store.mjs:253` | attivo |
| lezioni dagli errori | **memo + `recall_lessons`** — *segnalate, non iniettate* | `src/context-assembler.mjs:421` | attivo |
| *«ricordo» spinto dal sistema* | **`<resuming_from>`**, self-gated sul tempo | `src/context-assembler.mjs:147-190` | attivo |

⭐ **Il colpo che chiude la questione** — `context-views.ts:41-42`, l'istruzione di `view_tool_calls`:
> *«When you need an action or result from earlier that is no longer visible, call `view_tool_calls` **instead of re-running the action or guessing the result**.»*

**Lo scenario esatto dell'idea ha già un tool dedicato con un'istruzione esplicita contro il rifare-ciò-che-è-già-fatto.**

**Due precedenti che sono giudizi già emessi**, non opinioni:
- **`recall_lessons`** — la scelta **pull** è già stata presa: le memo esistono e il contesto dice solo *«ce ne sono N, usa `recall_lessons`»*, **senza iniettarle**. La variante (a) rovescia proprio questa decisione.
- **`<resuming_from>`** — il push esiste già **ma con un cancello**: se l'attività è recente restituisce stringa vuota, *«lo stato è già nelle altre lane, niente banner ridondante»*. È **il template corretto** per qualunque push futuro.

## Perché (a) è la variante peggiore

- **Non ha dove atterrare, ed è aritmetica.** `<facts>` ha **cap 12** (`context-assembler.mjs:26`), ordina per importance discendente, e i fatti-digest stanno a **100** (`task-digest.mjs:147`, *«pinned in cima»*). Ogni ricordo iniettato **o compete per gli slot**, sfrattando ciò che produce il 100%, **o entra sotto e non si vede mai**. **Non c'è una terza opzione.**
- **La coda volatile è veleno, misurato**: la direttiva iniettata in coda arriva **anche sul turno della probe** e il modello **risponde alla direttiva invece che all'utente** → recall **0%**. Confronto delle posizioni: trailing **3/6** · preuser **5/6** · **nessuna direttiva ~3.7/6** → **il trailing è peggio del non fare nulla**, a 886K token contro 390K.
- **E il prefisso rompe la cache**: `<facts>` è **byte-stabile di proposito** (`context-assembler.mjs:198-201`: l'età non si renderizza *«perché un "Ns ago" romperebbe la cache»*). Un'iniezione per-turno nel prefisso invalida il prompt-cache ogni turno. → **nessuna collocazione neutra**.
- **Il giudizio di pertinenza è `S`, non `F`** (#11): metterlo nell'harness significa uno **score di similarità**, e un coseno non è un giudizio — è la stessa pezza semantica che l'utente ha già bocciato (#24).
- **Un ricordo sbagliato è peggio del silenzio, e si auto-avvelena**: già osservato un modello che **confabula** un fatto **e lo ri-salva con `importance:10`**. Forma giusta + referente sbagliato = indistinguibile da uno buono.
- **Loop mezzi-fini, già osservato**: il modello smette di lavorare e amministra la memoria (*«I have ensured that all progress is captured…»*) → recall **0%**, **7.4× i token**.

## Perché (b) non oggi

Classificazione giusta (l'intelligenza va nel modello), ma **inerte adesso**: 0 save su 4 framing × 13 eviction; `note=0` su 2/2 sessioni → **guscio inerte**, che #11 vieta esplicitamente. Si riapre **solo** con un base che usa i tool di memoria di sua iniziativa (osservato su `qwen3.6-27b`, `note=10` proattivo) — e vale il divieto di generalizzare fra modelli.

## Non serve nessuna classe di training nuova

Coperto da: `class-prospective-memory` (SAVE) · `class-confabulation-retrieval-failure` (RECALL) · `class-harness-environment-awareness` (*«ri-chiama un tool il cui risultato è già in contesto»*) · `class-memory-lane-tool-discipline` · **`class-async-dispatch-and-prioritization` = letteralmente la variante (b)** · `class-defect-shape-reading` + `class-stagnation-recovery` per la parte *«la struttura è sbagliata»*.

## Come si misurerebbe, se un giorno si facesse

Metriche **sbagliate**: *«quanti ricordi iniettati»* (partecipazione, #10) e *«recall dei nomi»* (**già al soffitto** → nessun segnale possibile).
Metrica **giusta**, già disegnata e mai costruita (`harness-wins-validation-protocol.md:94`): **probe di dipendenza** — *un task che FALLISCE senza il fatto early*. Con: terreno = fatto-da-chat (non i file-write, che sono al soffitto) · primario `task_success_late` binario dal verifier · secondario deterministico = tasso di **lavoro ridondante** dal `tool-call-store` · **braccio placebo obbligatorio** (ricordo pertinente ma inutile: senza, non distingui *«il ricordo ha aiutato»* da *«un'iniezione qualsiasi ha cambiato il comportamento»*, che è ciò che i dati mostrano accadere) · costo appaiato · **#32**: la soglia di pertinenza determina il ramo → **distribuzionale** (held-out bilanciato + ECE), per-esempio solo la **groundedness** meccanica (*il referente esiste nel DB?*) · frazioni, non percentuali (#35b), n≥3.

## Cosa ribalterebbe il verdetto

1. Base = `qwen3.6-27b` **e** misura che usi spontaneamente un tool di ricerca-memoria → (b) diventa un **tool pull**, mai push.
2. **C2 misurata**: le sessioni reali sforano davvero la finestra? **Oggi non misurato.**
3. Un **cancello con precisione dimostrata** su held-out → un push self-gated diventa difendibile, come `<resuming_from>`.
4. Prova che il target legge davvero `<context>`/`system` — **oggi INCONCLUSIVO** (4/6 vs 3.7/6 = rumore, #35b).

## Verifica (fatta a mano prima di accettare il rapporto)

| affermazione portante | esito |
|---|---|
| `task-digest` è default-ON | ✅ `?? "on"` in `task-digest-capture.ts:19` |
| `<facts>` ha cap 12 | ✅ `DEFAULT_MAX_FACTS = 12` |
| i fatti-digest stanno a importance 100 | ✅ `TASK_FACT_IMPORTANCE = 100`, commento *«pinned in cima»* |
| l'utente ha bocciato la cattura deterministica come «pezza» | ✅ **testuale**, `wiki/todo.md:528` |

⚠️ L'ultima era citata a **`:524`** e a quella riga c'è altro: il numero era **slittato di 4** per le mie modifiche di oggi allo stesso file. **Giudicare dal numero avrebbe prodotto un falso «ha confabulato»** — la sostanza si cerca, non si controlla per indirizzo. *(È il motivo per cui altrove usiamo àncore testuali al posto dei numeri di riga.)*

## Limiti dichiarati dell'analisi

- **Zero esecuzioni**: tutti i numeri sono **letti dai report**, non riprodotti.
- L'API hook completa di `pi` **non verificata** (verificati i 12 hook usati dalle nostre estensioni, non tutti quelli disponibili).
- Non aperti: `eviction-checkpoint.mjs`, `nested-compact.mjs`, `slm-scaffolding.mjs`.
- Il punto sulla cache è **INFERITO** dai commenti di design, non profilato.

## 🗳️ Un gap segnalato, non filato (#36 — attende ratifica #18/#26)

Tutte le classi-memoria attuali si attivano su un **bisogno sentito** (*«mi serve una cosa che non vedo»*). **L'esempio dell'utente è il caso opposto: il modello NON sa di avere un buco** — crede di dover ancora fare una cosa già fatta. Asse **retrieval non-sollecitato**, sul lato *read* apparentemente scoperto `[INFERITO — non tutte le classi lette per intero]`.
**Reco**: **facet** di `class-harness-environment-awareness`, **non** una classe nuova.

## Links
[[../harness-experiment-log]] · [[../harness-wins-validation-protocol]] · [[../concepts/harness-value-and-capture-model]] · [[2026-07-24-supermemory-not-in-rl-loop]] (⚠️ anch'esso PROPOSTA non ratificata) · [[../training-taxonomy/class-prospective-memory]] · [[../training-taxonomy/class-confabulation-retrieval-failure]] · [[../training-taxonomy/class-harness-environment-awareness]] · [[../todo]]
