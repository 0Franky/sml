---
name: class-prospective-memory
description: Classe di training (5ª figlia di metacognitive-self-audit, gemella-SAVE di confabulation-retrieval) — riconoscere ORA che un'informazione servirà MOLTI turni dopo (oltre la finestra nativa) e SALVARLA proattivamente PRIMA che si perda, in modo DISCRIMINATIVO (durevole+utile, non ogni cosa). Origine: F23 (Gemma: 0 note su 5 nudge) + F33 (flash-lite salva l'AZIONABILE ma perde l'ARBITRARIO "ALDO-QX" → asimmetria actionable-vs-arbitrary: il caso più duro è il durevole arbitrario a uso-singolo-differito).
type: training-class
tags: [reasoning, metacognition, memory, prospective-memory, self-audit, area-04, child-class, held-out]
last_updated: 2026-07-09
---

# Classe (figlia) — MEMORIA PROSPETTICA (salva-ciò-che-ti-servirà)

> **Ruolo**: 5ª figlia di [[class-metacognitive-self-audit]] (radice: consapevolezza + audit del proprio processo). È il **lato SAVE** del binomio memoria; la **gemella-RECALL** è [[class-confabulation-retrieval-failure]] (*"ce l'ho davvero o lo invento?"*). Insieme formano la **disciplina di memoria** attraverso il bordo della finestra: **salva ciò che outlast-erà** (prospettiva) ↔ **non affermare ciò che non hai salvato/recuperato** (provenienza). *(Se il pattern cresce → candidato sub-parent "memory-discipline"; per ora coppia cross-linkata sotto lo stesso padre — regola #20.)*
> **Origine**: **F23** ([[../harness-experiment-log]]) — l'eviction-checkpoint ha SCATTATO 5× spingendo Gemma a salvare i task in uscita dalla finestra, e Gemma ha fatto **0 note / 0 jot**: non riconosce la task-history come "da salvare". La recall è crollata alla sola finestra nativa (60%). Il modello non ha **memoria prospettica**: non anticipa che gli servirà.
> **Evidenza 2 — F33 / adaptive-ON (2026-07-09)**: su un modello PIÙ capace (flash-lite, che a differenza del 9B USA `note`/`jot`) piantato un durevole a DUE parti — preferenza **AZIONABILE** ("commenti in inglese britannico") + fatto **ARBITRARIO** ("committente ALDO-QX") — e forzato l'overflow: il modello ha TENUTO la parte azionabile (riapplicata a OGNI task → segnale di uso ricorrente) ma ha **PERSO l'arbitrario** (`noteCalls=1`, `prefRecall=FALSE`). → **asimmetria ACTIONABLE-vs-ARBITRARY**: si sotto-salvano i durevoli privi del segnale "mi serve di nuovo" — proprio gli **arbitrari a uso singolo/differito**, benché genuinamente durevoli, sono i più a rischio. È il **caso PIÙ DURO** della skill (un modello che salva solo ciò che riusa spesso NON ha imparato la memoria prospettica). Vedi [[../project_durable_fact_capture_is_training]] (il fix è QUESTA classe, non una cattura harness-side — regola #24).

## La skill-target (segnale, preciso e falsificabile)

Mentre lavora, il modello **riconosce che un'informazione avrà rilevanza FUTURA oltre l'orizzonte della finestra** (un vincolo, una decisione, un nome, un valore, un thread aperto, un risultato intermedio che servirà a valle) e la **SALVA proattivamente** (note/set_var / store durevole) **PRIMA** che esca dal contesto e vada persa. **Discriminativo**: salva ciò che è **durevole E servirà**, NON ogni dettaglio (l'over-save è il modo-di-fallire speculare).

**Caso PIÙ DURO (F33, actionable-vs-arbitrary)**: il criterio è **DURABILITÀ + NECESSITÀ-FUTURA**, NON "quante volte lo riuso". Un durevole **arbitrario** (un nome, un codice, una decisione one-off) con uso **SINGOLO e DIFFERITO** — necessario molti turni dopo ma senza alcun riuso intermedio che lo "rinfreschi" — è il più facile da perdere, perché manca del segnale di ricorrenza che invece porta una preferenza azionabile (riapplicata a ogni passo). La skill deve salvarlo **lo stesso**, valutando che *sarà necessario a valle*, non che *lo si riusa spesso*.

**Falsificabile**: a valle, l'informazione salvata o **è ripescabile e viene usata** quando serve (valore prospettico realizzato) o no. Non si premia "ho salvato qualcosa" (participation-hack), ma il fatto che il salvataggio **abbia evitato una perdita reale**.

**Classificazione training-vs-harness** ([[../concepts/training-vs-harness-classification]], CLAUDE.md #11): metà **S** (decidere *cosa* e *quando* salvare = giudizio prospettico; stato-senza-training **INERTE-o-DEGRADATA**: F23 mostra 0-save anche col nudge) + **F-harness** = la **cattura deterministica** SOLO per i fatti a **segnale STRUTTURALE** (file-write → task-digest: path+content, forma non-semantica). ⚠ Per i **fatti-da-CHAT** (nomi/preferenze/decisioni/vincoli — il caso F33/ALDO-QX) **NON c'è** né va costruito uno scaffold harness (regola #24, [[../feedback_no_regex_patch_for_language]]: una regex non coglie le sfumature del linguaggio): sono **interamente S** → li salva il modello con la sua intelligenza. **Doppio scopo** (regola #18): per i file-write l'harness scaffolda ORA (task-digest) e il training internalizza → lo scaffold recede; per i chat-fact è **solo training** dal primo giorno ([[../project_durable_fact_capture_is_training]]).

## Esempi POSITIVI (cross-dominio — regola #19)

- **[A · lavoro/tech, il caso generalizzato held-out]** durante una sessione lunga arriva un **vincolo/decisione** che servirà molti passi dopo → salvalo ora (nel ticket/nota) prima che esca dal contesto; a valle lo ritrovi invece di ri-derivarlo o confabularlo.
- **[B · vita quotidiana]** ti presentano una persona → **annoti il nome** subito (sai che lo dimenticheresti); parcheggi in un garage grande → **segni il piano/settore** prima di allontanarti.
- **[C · viaggio]** all'arrivo **salvi l'indirizzo dell'hotel / il gate** mentre li hai davanti, non "tanto me lo ricordo".
- **[D · salute]** annoti **quando hai preso il farmaco** per non ri-dosare per dimenticanza.
- **[E · ricerca/riproducibilità]** registri il **seed / l'iperparametro** dell'esperimento nel momento in cui lo usi → a valle riproduci invece di indovinare.

**Caso-DURO arbitrario a uso-singolo-differito (F33 generalizzato — cross-dominio, regola #19)** — durevole ma SENZA riuso intermedio (il tranello: nessun segnale "mi serve di nuovo"):
- **[F · burocrazia]** all'inizio di una pratica lunga ti danno un **numero di protocollo/riferimento** che servirà SOLO alla fine → salvalo ORA; a valle lo citi invece di doverlo richiedere.
- **[G · vita quotidiana]** ti dicono UNA volta la **combinazione dell'armadietto** / il **posto auto** che userai fra ore → annotali subito (non li riusi nel frattempo → è proprio quello il rischio).
- **[H · relazioni/eventi]** a inizio cena un ospite dice **un'allergia/preferenza** rilevante solo al momento di servire il dolce → tienila da parte fino ad allora.
- **[I · lavoro/tech, il caso ALDO-QX generalizzato held-out]** a inizio sessione arriva un **vincolo/nome-committente arbitrario** che non tocca i task intermedi ma vale alla consegna → salvalo, anche se "non lo stai usando adesso".

## Esempi NEGATIVI (regola #21 — il CONFINE: quando NON salvare / non over-save)

I negativi rendono il segnale **discriminativo** (anti-hoarding, anti participation-hack):

- **[N1 · over-save di trivia]** salvare OGNI dettaglio transitorio (ogni riga di output, ogni passo intermedio irrilevante) → rumore che soffoca ciò che conta. La lane ha capacità finita: over-salvare **spinge fuori** i fatti veri. Il gold è **selettività**, non volume.
- **[N2 · già persistito/disponibile]** l'informazione è **già** nel contesto durevole / recuperabile a comando → ri-salvarla è ridondanza (link [[class-confabulation-retrieval-failure]]: prima verifica se ce l'hai già).
- **[N3 · non servirà]** un dato chiaramente **usa-e-getta** (rilevante solo per il turno corrente) → NON salvarlo; salvarlo "per sicurezza" è cerimonia penalizzata.
- **[N4 · save-di-spazzatura per lucrare il segnale]** salvare qualcosa *solo perché "salvare è premiato"* → **0** (è l'anti-hack esplicito del design eviction-checkpoint: mai premiare il salvare-per-salvare).
- **[N5 · arbitrario ma EFFIMERO — il CONFINE della sfumatura F33]** un token arbitrario (un **ID temporaneo**, un nome-variabile usa-e-getta, un **codice valido solo per il passo corrente**) rilevante SOLO al turno corrente → **NON salvarlo**. "Arbitrario" NON implica "durevole": il discriminante resta DURABILITÀ+NECESSITÀ-FUTURA, non l'apparenza-di-codice/nome. Impedisce che l'aggiunta del caso-duro [F-I] ribalti la skill in "salva ogni nome/codice che vedi".
- **[N6 · vita quotidiana, effimero]** il **numero della cassa** al supermercato mentre paghi, il **posto in fila** appena chiamato → serve ORA e si esaurisce → salvarlo è cerimonia (contrasto diretto col posto-auto [G], che invece riuserai fra ore).

## Reward (ANCORATO all'OUTCOME + SIMMETRICO)

- **Positivo** sse l'informazione salvata **(a)** era **durevole e realmente necessaria a valle** E **(b)** il salvataggio ha **evitato una perdita** (a valle è ripescata e usata / avrebbe altrimenti richiesto ri-derivazione o prodotto confabulazione). Verificato sull'**uso-a-valle reale** (oracolo: la probe/task successiva che dipende dall'info riesce), NON sul "ha salvato".
- **Simmetrico**: premia ANCHE il **NON salvare** correttamente (N1-N3 + **N5-N6** arbitrario-effimero → selettività). Né "salva-sempre" né "non-salvare-mai". Il caso-duro [F-I] (arbitrario durevole → SÌ) e il confine [N5-N6] (arbitrario effimero → NO) devono stare **bilanciati**: è ciò che rende la skill *discriminativa* sull'asse actionable-vs-arbitrary, non un "salva ogni codice".
- **Hack-check**: *participation* ("salvo per prudenza" senza necessità reale) → 0; *over-save* (N1/N4) → penalizzato (àncora all'outcome, non al volume); *default fisso* → neutralizzato dalla simmetria. ([[../feedback_reward_hacking_principle]])

## Label-generation (mutation/oracle)

Scenari multi-turno *lunghi* dove un'informazione al turno *t* è **necessaria** al turno *t+K* (K > finestra) — costruiti come **fixture self-contained** (regola #22: fatti veri-per-costruzione, nessuna verità-del-mondo). Oracolo = la task/probe a *t+K* riesce **sse** l'info è stata salvata a *t*. **Mutazioni**: variare K (dentro/fuori finestra → dentro = N3 non-serve-salvare); iniettare distrattori transitori (per generare N1 over-save); rendere l'info già-persistita (N2). Bilanciamento positivi↔negativi obbligatorio. Riusa [[../../harness/verifiers/deceptive-task-gen]] per i distrattori.

**Caso-DURO obbligatorio (F33 — arbitrario a uso-singolo-differito)**: includere apposta fixture dove il durevole è **arbitrario** (nome/codice/decisione one-off) usato **SOLO a *t+K***, con **nessun riuso a *t..t+K-1*** (nessun segnale di ricorrenza). Contrasto BILANCIATO obbligatorio con la **preferenza AZIONABILE** (riapplicata a ogni passo → facile) e con l'**arbitrario EFFIMERO** ([N5]/[N6]: apparenza-di-codice ma rilevante solo a *t* → oracle = non-salvare). Senza questo caso il modello impara la scorciatoia "salva solo ciò che riusi spesso" e continua a perdere gli ALDO-QX. Variare il *travestimento* dell'arbitrario (protocollo, combinazione, nome-committente, seed-mai-riusato).

## Decontaminazione (regola #18)

Le **istanze osservate** (F23: Gemma / task-history di coding · **F33: flash-lite / "ALDO-QX" in adaptive-ON**) sono **held-out di validazione**, NON nel training. Il training usa i transfer cross-dominio §positivi ([F-I] per il caso-duro) / §negativi ([N5-N6] per il confine). Se il modello ha imparato la **memoria prospettica**, a valle risolve F23 **e** F33 per **transfer** — l'eval `EVAL_PLANT_PREF` (fatto durevole arbitrario piantato + overflow + probe) è l'held-out diretto: se il training funziona, il modello persiste "ALDO-QX" **da sé**. È anche la **metrica di successo del branch harness→training** (nessuno scaffold di cattura deterministica per i fatti-da-chat — regola #24: è il modello a doverlo fare).

## Links
[[class-metacognitive-self-audit]] (padre) · [[class-confabulation-retrieval-failure]] (gemella-RECALL) · [[class-stagnation-recovery]] · [[../harness-experiment-log]] (F23 + F33) · [[../project_durable_fact_capture_is_training]] (decisione: durevoli-da-chat = training, non harness) · [[../concepts/training-vs-harness-classification]] · [[../concepts/eviction-checkpoint]] · [[../feedback_no_regex_patch_for_language]] · [[../feedback_reward_hacking_principle]] · [[../feedback_intelligence_gap_to_training_class]] · [[../feedback_transfer_always_cross_domain]] · [[area-04-context-metacognition]]
