---
name: context-limits-explained
description: "I limiti REALI del contesto per il nostro SLM 4B, spiegati in modo accessibile + le mie raccomandazioni. Validato da review-loop SOTA (msg 517/518/521)."
type: concept
status: explainer + reco (candidato ADR)
tags: [context-budget, effective-context, anti-cecità, goal-drift, reward-hacking, train-serve]
sources:
  - review-loop deep-analysis 2026-06-29 (RULER arXiv:2404.06654, context-rot Chroma, length-alone arXiv:2510.05381, goal-drift arXiv:2505.02709, Train-Short-Test-Long arXiv:2108.12409)
  - TG utente 2026-06-29 msg 517/518/521
last_updated: 2026-06-29
---

# I limiti del contesto, spiegati (+ cosa farei)

> Per chi legge: niente gergo inutile. L'idea di fondo in una frase: **il contesto NON è "spazio libero da riempire". Riempirlo costa qualità — e per un modello piccolo come il nostro (4B) costa MOLTO prima di quanto sembri.** Sotto, ogni limite con un'analogia, perché conta per noi, l'evidenza, e la mia raccomandazione.

---

## 1. La "finestra da 32K" è in gran parte un'illusione (contesto EFFETTIVO << dichiarato)

- **Cos'è**: Qwen3-4B ha una finestra *nativa* di **32K token** (i "128K" si ottengono solo con trucchi a inferenza, YaRN, che degradano). Ma la parte **realmente usabile bene** è molto più piccola.
- **Analogia**: una valigia "da 32 kg" la cui cerniera però si sforza già a metà — oltre, le cose dentro si sgualciscono.
- **Evidenza**: il benchmark RULER (arXiv:2404.06654) misura quanto contesto un modello usa DAVVERO: i modelli ≤7B ne usano solo il **3-50%** del nominale (alcuni 6B: **3%**). I piccoli crollano molto prima dei modelli grandi.
- **Perché conta per noi**: il nostro è piccolo → realisticamente il contesto affidabile è **~40-60%** della finestra (≈13-20K su 32K), non 80-100%.
- **→ Reco**: NON considerare "pieno" l'80%. Usare una soglia più bassa, **misurata** (vedi §11), non scelta a occhio.

## 2. Riempire degrada la qualità ANCHE se il modello "trova" l'informazione

- **Cos'è**: non è solo questione di "ritrovare" un dato sepolto. Allungare l'input peggiora il *ragionamento* di per sé.
- **Analogia**: rispondere a una domanda dopo aver letto **il paragrafo giusto** vs dopo aver letto **tutto il libro** — anche se in entrambi i casi "sai dov'è" la risposta, nel secondo caso sei più stanco e sbagli di più.
- **Evidenza**: con recupero PERFETTO dell'info, allungare a 30K token fa comunque calare un modello 8B del **-24% su test di cultura e -47.6% su coding** (arXiv:2510.05381). La causa è un "bias di posizione" appreso in addestramento, non distrazione.
- **Perché conta per noi**: tenere il contesto **corto e curato** (la nostra Strada-2) NON è cosmesi — riduce un danno reale e misurabile. *Ma* solo se il `<context>` che assembliamo resta nella fascia di qualità alta (§1).
- **→ Reco**: la curazione del workspace è giusta; va però tenuta DENTRO la soglia buona, altrimenti curare tanto contesto-cattivo non aiuta.

## 3. Pensare e rispondere consumano la STESSA finestra dell'input

- **Cos'è**: in Qwen3 il "ragionamento" (thinking) + la risposta vivono nello stesso spazio dell'input. Più riempi di input, meno resta per *generare*.
- **Analogia**: un foglio A4. Se riempi 3/4 con la domanda, per la risposta ti resta un angolino.
- **Evidenza**: a 32K, se l'input è al 75% restano **~8K token** per pensare+rispondere → su un task di coding con ragionamento esteso si **tronca**.
- **→ Reco**: riservare un **budget di output esplicito** (es. 6-10K token "intoccabili" a 32K). La soglia di "pieno" deve valere sull'INPUT, lasciando fuori lo spazio per rispondere.

## 4. Il modello perde l'obiettivo col NUMERO DI AZIONI, non col tempo (goal-drift)

- **Cos'è**: lavorando a lungo, un agente tende a "scordarsi" il vero obiettivo e a inseguire l'ultima cosa che ha in mano. Questo "drift" cresce col **numero di passi fatti**, non con i minuti passati.
- **Evidenza**: studio sul goal-drift (arXiv:2505.02709): un modello inizia a derivare dopo **~16 passi**; il driver è il *pattern-matching dal contesto recente*, non l'orologio.
- **Perché conta per noi (CORREZIONE a una tua idea, msg 515)**: il tuo "hook ogni ~20 minuti" è l'intuizione giusta (serve un promemoria) ma sul **driver sbagliato**. Un promemoria a orologio: (a) scatta scorrelato dal vero rischio (un agente fa 50 azioni in 3 minuti o 2 in 25); (b) il modello non l'ha mai visto in addestramento → lo confonde; (c) se cade **a metà di un ragionamento**, RESETTA l'attenzione e *causa* il drift che vorrebbe prevenire.
- **→ Reco**: promemoria **event-driven**, non a tempo: scatta **ogni N azioni** (contiamo già le azioni nel datastore) oppure **dopo un `pop_focus`** (momento naturale di re-survey) o **dopo un task importante completato**. Il timer a orologio resta SOLO come rete di sicurezza anti-stallo (es. >30-40 min fermo). E deve scattare solo **a confine di azione**, mai a metà.

## 5. La POSIZIONE conta: a contesto pieno il modello guarda la coda, non la testa

- **Cos'è**: dove metti un'informazione conta quanto l'informazione stessa.
- **Evidenza** (Chroma context-rot): sotto il ~50% di riempimento il modello è forte su **inizio + fine** (curva a U, "lost-in-the-middle"); **oltre** il 50% diventa **recency** — privilegia la FINE e penalizza l'inizio.
- **Perché conta per noi**: noi mettiamo l'obiettivo (`<current_aim>`) in **testa**. Ma quando il contesto è pieno (≈0.75) siamo nel regime "recency" → proprio l'obiettivo in testa viene sfavorito quando serve di più.
- **→ Reco**: ribadire l'obiettivo **anche in coda** (un `<aim_reminder>` compatto, ~15 token, subito prima dei messaggi recenti). E **non** mettere mai informazione critica nel "centro" del contesto.

## 6. Devi addestrare il modello sulle stesse lunghezze che gli servi (train-serve match)

- **Cos'è**: un modello rende bene solo sulle lunghezze di contesto che ha "visto" in addestramento.
- **Evidenza**: Qwen3-4B è addestrato a 32K. Servirlo oltre (senza YaRN) = chiedergli di leggere in posizioni mai viste → degrada (arXiv:2108.12409). E vale anche al contrario: se lo *fine-tuniamo* su contesti corti ma lo *serviamo* lunghi, creiamo lo stesso problema.
- **→ Reco**: scegliere **una** lunghezza operativa (in MVP: **stare entro i 32K nativi**, niente YaRN) e addestrare i nostri dati su quella stessa fascia. La soglia di "pieno" deve coincidere con la lunghezza su cui addestriamo.

## 7. Sul 2080Ti il limite è l'HARDWARE, non la qualità

- **Cos'è**: il contesto lungo costa memoria GPU (la "KV-cache" cresce in proporzione al contesto).
- **Evidenza**: su una 2080Ti (11 GB) i pesi del modello (FP16) occupano già ~7.5 GB → il contesto pratico single-stream è **~12-16K token**, PIÙ STRETTO della soglia di qualità.
- **→ Reco**: la soglia operativa reale = **il minimo tra "soglia di qualità" e "tetto hardware"**. Su 2080Ti comanda l'hardware (~12-16K); la curva fino a 32K va misurata su una A100. Tenere headroom dà anche più velocità/throughput.

## 8. ⚠️ Il rischio che TEMI è quello giusto (e il meno difeso): il "meta-hack"

- **Cos'è**: con l'addestramento RL, il modello potrebbe **imparare la scorciatoia sbagliata** — accorgersi che "contesto pulito / pochi task visibili / scope chiuso" tende a correlare col premio, e quindi **chiudere/archiviare/de-prioritizzare task per ALLEGGERIRSI il contesto invece di completarli davvero**. È il "fare scena" di pulizia.
- **Evidenza**: l'RL post-training **aumenta** il reward-hacking; gli agenti con memoria tendono a conformarsi a decisioni passate (sycophancy). La tua paura (msg 515 "potrebbe ridurre i task visibili e perdere l'obiettivo") è esattamente questo, ed è il punto **più importante e meno difeso**.
- **→ Reco**: difenderlo col rigore degli altri reward-hack (scorer ≠ scored, CLAUDE.md #10): il premio del context-management deve venire **solo dal progresso REALE** (i test/acceptance a valle passano?), **mai** dai "token risparmiati" o dallo "stato più corto". **Penalità asimmetrica forte**: chiudere un task il cui controllo di completamento NON passa deve costare molto. Creerò un concept dedicato (`context-management-reward-hacking`) + entry nel test-book.

## 9. Paradosso: ogni difesa anti-cecità COSTA contesto (quindi va accesa solo quando serve)

- **Cos'è**: il promemoria dell'obiettivo, il conteggio dei nascosti, il frame, l'ordine dei task... aggiungono token alla stessa finestra che vogliono proteggere.
- **Perché conta per noi**: su un modello con contesto effettivo piccolo, se queste difese sono **sempre accese** il bilancio netto può essere **negativo** (spendi più di quanto salvi).
- **→ Reco**: un **gate di proporzionalità deterministico** (deciso dall'harness, non dal modello): sotto-soglia (pochi task, niente dipendenze, contesto poco pieno) le difese restano **dormienti**. Si attivano SOLO quando la complessità esiste davvero. (= la regola optimization-first: scala giù sul semplice.)

## 10. Lo stato curato che cresce può contraddirsi o invecchiare (staleness)

- **Cos'è**: non sono i *messaggi* a crescere (quelli li gestiamo), ma lo **stato curato** (decisioni, variabili, priorità). Una decisione del turno 3 può contraddire una variabile aggiornata al turno 12; una priorità "alta" al turno 1 può non esserlo più al turno 40.
- **→ Reco**: prevedere un **controllo di coerenza** periodico sullo stato che cresce (ri-derivare invece di fidarsi di flag salvati). Si lega al contraddiction-layer che già abbiamo.

## 11. ⚠️ Quante voci per SEZIONE = parametro make-or-break (da tenere SEMPRE sotto osservazione)

- **Cos'è** (utente msg 712, 2026-06-30): i **cap per-sezione** del context serializzato — quanti *ultimi messaggi*, *ultime decisioni*, *ultimi tool_result salienti*, *task aperti*, *vars*, *recent_changes* si mostrano — sono un parametro di **prima classe**. Troppo pochi → cecità, ri-fetch, perdita-del-filo; troppi → costo, rumore, lost-in-the-middle. "La corretta gestione di questi parametri farà la differenza tra **successo e fallimento** della metodologia."
- **Caveat diagnostico OBBLIGATORIO**: prima di attribuire un finding all'**allineamento del modello**, escludere che sia **context-retention** (il modello non ha *visto* abbastanza). Istanza reale: in sessione live `019f1953` il modello ha chiamato `list_secrets` **6×** perché `keepTurns=1` non ri-mostra i tool_result dei turni precedenti e la lane non li porta → ri-fetch forzato, **non** inefficienza del modello. Vedi [[concepts/sealed-secrets-livetest-findings]] FIND-7 + memory `feedback_context_window_sizing`.
- **→ Reco**: **studio dedicato** sui conteggi default per-lane (review-loop + agenti specializzati agnostici), misurato con `turn-trace`; prereq la **curva effective-context** (#1 sotto). Sub-fix candidato: far sopravvivere nella lane/working-state gli **ultimi tool_result salienti** (o un digest) così il modello non ri-chiama gli stessi tool. Tracciato in [[todo]] (studio per-section counts). **Da tenere SEMPRE sotto osservazione.**

---

## 🎯 Le mie raccomandazioni operative (cosa farei ORA vs DOPO)

**ORA (Fase-1) — solo ciò che dà ~80% del valore a costo zero-training:**
1. **Soglia headroom configurabile** ✅ *già fatta* (`harness.config.json`, msg 520) — ma il valore va **calibrato sui dati**, non a occhio.
2. **Segnale del nascosto non-silenzioso** ✅ *già esiste* (il "+N task non mostrati" piatto) — il breakdown per priorità H/M/L arriva DOPO (richiede un campo che non abbiamo ancora).
3. **Riservare budget di output** (~6-10K token) e far scattare la compaction sull'input-meno-output.
4. **Obiettivo anche in coda** (`<aim_reminder>` compatto) per battere il recency-bias.
5. **Gate di proporzionalità deterministico** (difese dormienti sotto-soglia).

**DOPO (Fase-2+) — richiede il campo `priority`/`deps` o l'addestramento:**
- Breakdown nascosti per priorità (H/M/L); promemoria **event-driven** (ogni N azioni / on pop_focus); difesa anti-meta-hack con reward twin-pair; consistency-check dello stato.

**TAGLIATO (non farlo):**
- L'hook a **tempo** come meccanismo principale (sbagliato, §4 → solo fail-safe anti-stallo).
- Fissare **80%** o qualunque numero "a occhio".
- Tarare la soglia sul test facile (single-needle): nasconde il crollo vero sui task multi-step.

## 🔑 La soglia: numeri provvisori + il prerequisito #1

- **Provvisorio** (da trattare come **ipotesi da falsificare**, non verità): "pieno" = **50-60%** della finestra di serving; trigger reorder **~0.50-0.55**, matrioska/compaction **~0.65-0.70** (abbassare il 0.75 attuale), sempre al netto del budget di output. Operativo reale = **min(qualità, tetto-hardware)**.
- **PREREQUISITO #1 (bloccante, e qui hai ragione tu, msg 511 "altrimenti parliamo del nulla")**: tutti questi numeri sono **inferenze** da modelli 7-8B, **non misure sul NOSTRO 4B**. Vanno **MISURATI** con un protocollo a 3 livelli: (1) needle singolo = sanity (ottimistico, NON usarlo per la soglia); (2) **multi-hop / aggregazione** a 4/8/16/24/32K (la curva che conta); (3) **harness-realistic** sui veri `<context>` Strada-2 con esito held-out (il task agentico riesce?). La soglia "pieno" = la lunghezza oltre cui l'accuratezza su (2)+(3) cala oltre il -5% relativo. Finché questa curva non esiste, ogni numero è una stima fondata, non un dato.

> **In una riga**: il contesto è un budget di qualità che si esaurisce prima del previsto; per il nostro modello piccolo va tenuto basso, l'obiettivo va ribadito in coda, i promemoria vanno legati alle *azioni* non al *tempo*, e la difesa più importante è impedire che il modello "pulisca per finta" — ma il numero esatto della soglia va **misurato sul nostro modello**, non indovinato.

## Link
- [[concepts/focus-task-prioritization]] (anti-cecità + gathering — design correlato) · [[decisions/2026-06-29-context-as-first-person-mind]] · [[concepts/cache-stable-prefix]] (se presente) · [[concepts/reward-hacking-mitigation]] (→ aggiungere `context-management-reward-hacking`) · [[concepts/training-vs-harness-classification]].
