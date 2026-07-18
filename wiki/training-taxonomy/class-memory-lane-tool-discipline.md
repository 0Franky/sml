---
name: class-memory-lane-tool-discipline
description: Classe (figlia di harness-environment-awareness, nipote di situational-awareness) — dati TUTTI i canali di memoria dell'harness PRESENTI e VALIDI (note/jot/set_var → lane <facts>/<scratch>/<vars>), instradare ogni dato nel canale la cui PERMANENZA e FORMA corrispondono alla NATURA del dato (durevole-self-contained → facts/note; volatile-di-lavoro → scratch/jot; strutturato-computabile → vars/set_var), così che l'informazione SOPRAVVIVA e sia UTILIZZABILE quando serve. Gap reale (qualitative-review 2026-07-11, gap più citato dai 3 modelli): qwen3-32b confonde facts-vs-vars; deepseek-v4-pro nota che note/jot/set_var è "semanticamente sottile, i meno capaci la usano male"; sonnet-5 rischio dati non self-contained. Reward all'OUTCOME (l'info è ripescabile+interpretabile a valle) + simmetrico (né tutto-in-facts né tutto-volatile). Il mis-routing in SCRITTURA causa a valle il retrieval-failure delle gemelle memoria.
type: training-class
tags: [reasoning, situational-awareness, harness-awareness, memory, lane-routing, storage-tiering, self-contained, area-04, child-class, held-out]
last_updated: 2026-07-11
---

# Classe (figlia) — DISCIPLINA DEI CANALI DI MEMORIA (metti il dato nel canale GIUSTO)

> **Ruolo**: figlia di [[class-harness-environment-awareness]] (a sua volta 2ª figlia di [[class-situational-awareness]], sub-albero OUTWARD/ambiente) → **specializzazione ricorsiva** (regola #20) del padre applicata al sotto-dominio dei **CANALI DI PERSISTENZA**. Il padre insegna *"usa l'affordance giusta già disponibile invece di ri-derivare/allucinare"*; qui il **compito** è la persistenza e l'**affordance giusta** è il canale-di-memoria **semanticamente corretto**. Sta un gradino **sopra** "sai che i canali esistono" (padre) e un gradino **sotto** "salvi il dato giusto" (gemelle-memoria).
> **Origine** (gap reale — [[../harness-experiment-log]] + qualitative-review 2026-07-11): è il **gap PIÙ citato dai 3 modelli** del design-review qualitativo delle lane. **qwen3-32b** confonde `<facts>` vs `<vars>` (salva un fatto come valore strutturato o viceversa). **deepseek-v4-pro**: la distinzione `note`/`jot`/`set_var` è *"semanticamente sottile — i modelli meno capaci la usano male"*. **sonnet-5**: rischio di salvare **dati non self-contained** (valore-nudo non interpretabile a valle). Il filo comune: i canali ci sono TUTTI e sono VALIDI, ma il modello **mis-routa il dato**.
> **Composizione (regola #20, cross-link esplicito)**: il mis-routing in **SCRITTURA** CAUSA a valle il **retrieval-failure** che le gemelle-memoria gestiscono → legami verso [[class-prospective-memory]] (gemella-SAVE: *whether/what* salvare) e [[class-confabulation-retrieval-failure]] (gemella-RECALL: *read-side*, non fabbricare). Questa classe vive sul lato **WRITE-ROUTING**: presuppone la decisione-di-salvare già presa (prospective) e precede il recupero (confabulation).

## Il gap

L'harness DESCRIVE tutti i canali nel context (F): `<how_memory_works>` / `<resources>` spiegano che **`note(...)` → lane `<facts>`** (durevole, sopravvive al rolling-window E alla compaction), **`jot(...)` → lane `<scratch>`** (volatile, finestra rolling che sfuma), **`set_var(...)` → lane `<vars>`** (valore strutturato, riletto con `get_var`). I canali sono **tutti PRESENTI e VALIDI**. Ciò nonostante il modello **instrada il dato nel canale sbagliato**:

- **(a) durevole → canale volatile** (`jot`/`<scratch>`): un fatto che servirà molti turni dopo finisce nella finestra rolling → **sfuma** → **PERSO** proprio quando serve a valle.
- **(b) fatto → valore-nudo in `<vars>`** (`set_var("nome_alfred","Alfred")`): non self-contained — non dice CHI è Alfred né PERCHÉ conta → a valle è **rumore inutilizzabile** (l'esempio BAD è letteralmente nel contratto `<how_memory_works>` dell'harness).
- **(c) dato-di-lavoro → canale durevole** (`note`/`<facts>`): la lane `<facts>` ha **capacità finita**; riempirla di note effimere **spinge fuori** i durevoli veri (crowding) → i fatti che contano vengono soffocati.

Non è un buco di conoscenza-del-mondo né di *whether-to-save*: **l'ambiente e il contratto dei canali sono nel context**. È un buco di **conoscenza-delle-affordance applicata alla persistenza** — scegliere il contenitore la cui *permanenza* e *forma* corrispondono alla *natura* del dato.

## La skill-target (segnale, preciso e falsificabile)

Prima di salvare, il modello **classifica la NATURA del dato** e sceglie il canale il cui affordance la rispetta:
1. **durevole + necessario a valle** (nome/preferenza/decisione/promessa/vincolo che deve LAST) → **`note` → `<facts>`**, come **frase completa self-contained** (interpretabile da un estraneo fra un mese), non un valore-nudo;
2. **di-lavoro / volatile** (provato-X-fallito-Y, thinking mid-task che non deve durare) → **`jot` → `<scratch>`** (scratchpad economico, rolling);
3. **strutturato / computabile** (un id, un contatore, un path che interpolerai o su cui calcolerai) → **`set_var` → `<vars>`**, comunque con **key parlante** (`discord_client_id`, non `x`).

**Falsificabile**: a valle (a un turno t+K oltre la finestra), l'informazione **è ancora ripescabile E interpretabile e viene usata correttamente** (canale-giusto + self-contained), oppure è **persa / illeggibile / soffocata** perché mis-routata. Non si premia "ha usato `note`" (participation-hack) ma che l'instradamento **abbia fatto sopravvivere-e-servire** il dato.

**Split training-vs-harness** ([[../concepts/training-vs-harness-classification]], CLAUDE.md #11): **F-harness** = il **contratto dei canali** iniettato (`<how_memory_works>`/`<resources>` + le lane `<facts>`/`<scratch>`/`<vars>` popolate — scaffolding-crutch registrato da `slm.ts`) → stato-senza-training **PIENO sul dato** (il contratto è lì, con perfino l'esempio BAD/GOOD). **S** = *classificare la natura del dato e instradarlo* → **INERTE senza training** (qualitative-review: contratto presente, mis-routato). **Doppio scopo** (regola #18): l'harness scaffolda ORA (spiega i canali + BAD/GOOD); il training internalizza la disciplina → man mano che regge, lo scaffold-crutch (il verboso `<how_memory_works>` con esempi) può **recedere**. ⚠ Coerente con regola #24: l'harness dà i fatti **strutturali** (nomi-tool, lane, semantica-di-permanenza), l'interpretazione *quale-natura-ha-questo-dato* è del modello.

## Esempi POSITIVI (cross-dominio — regola #19)

> Logica astratta unica: *metti ogni cosa nel contenitore la cui PERMANENZA e FORMA corrispondono alla NATURA del dato — durevole nel canale che sopravvive, di-lavoro nel volatile, strutturato nel computabile — e rendilo interpretabile-da-solo*.

- **[A · software/harness, il caso nativo held-out generalizzato]** durante una sessione lunga arrivano tre cose: una **preferenza durevole** ("commenti in inglese britannico"), una **nota di lavoro** ("provato l'approccio ricorsivo, stack-overflow su n>1000"), un **contatore** ("retry rimasti: 2") → instrada rispettivamente `note(...frase-completa..., key="pref-stile")` → `<facts>`, `jot(...)` → `<scratch>`, `set_var("retries_left","2")` → `<vars>`. A valle la preferenza è ancora in `<facts>` (sopravvissuta), non persa nello scratch.
- **[B · archiviazione domestica / documenti — banale]** il **passaporto / il contratto d'affitto** → cassetto-documenti permanente; la **lista-spesa di oggi** → post-it sul frigo; NON metti il passaporto tra i post-it (li butti al riordino settimanale → perso), NON scrivi solo "Mario" su un foglietto senza dire *chi-è-Mario e perché* (valore-nudo = a valle rumore).
- **[C · cucina/dispensa — banale]** la **carne per la settimana prossima** → freezer (durevole); gli **avanzi di stasera** → frigo (breve termine); le **spezie che usi ADESSO** → sul bancone (working). Mettere la carne sul bancone = si guasta **prima** di servirla (durevole nel canale volatile = il fallimento (a)).
- **[D · finanza personale — sistemico]** i **risparmi-pensione** → conto vincolato/lungo-termine (non li tocchi, devono durare); la **spesa del mese** → conto corrente (working); i **contanti per oggi** → in tasca. Tenere i risparmi-pensione come contanti-in-tasca = spariscono prima di servire (mis-routing durevole→volatile a scala di vita).
- **[E · sanità/turni — critico]** un dato clinico **permanente** (allergia, gruppo sanguigno) → **cartella clinica** (durevole, la legge il prossimo turno); un appunto del turno ("PA misurata alle 14:00") → **foglio-turno** (working, si archivia a fine turno). Scrivere l'**allergia** solo sul foglio-turno = va persa quando serve al turno successivo (durevole nel volatile = danno).
- **[F · self-containedness cross-dominio — banale→sistemico]** etichettare uno scatolone del trasloco **"cose"** (valore-nudo) vs **"libri-di-cucina — scaffale-alto"**: a valle "cose" è inutilizzabile (mirror diretto di `set_var("x","Alfred")`); a scala di sistema è la stessa logica di **storage tiering** (hot/warm/cold + retention policy): dove collochi un dato secondo *durata × pattern-di-accesso*.

## Esempi NEGATIVI (regola #21 — il CONFINE: quando NON usare il canale durevole / non mis-routare al contrario)

I negativi rendono il segnale discriminativo e **simmetrico** (nessun default fisso vince):

- **[N1 · effimero di lavoro → jot è GIUSTO, promuoverlo a note è ERRORE]** una nota mid-task ("sto provando l'edge-case vuoto") → `jot`/`<scratch>` è la scelta corretta; **promuoverla a `note`/`<facts>`** = rumore che **soffoca i durevoli** nella lane cap-limitata. Non tutto va nel durevole. (Confine speculare al fallimento (c).)
- **[N2 · già persistito nel canale giusto]** l'info è **già** in `<facts>` (salvata con `note`) → **NON** ri-salvarla anche in `<vars>`/`<scratch>` (duplicazione cross-lane, incoerenza). Prima verifica se ce l'hai già e dove (link [[class-confabulation-retrieval-failure]] N2).
- **[N3 · usa-e-getta del turno → NESSUN canale]** un dato rilevante **solo per il turno corrente** (un valore intermedio che consumi subito) → non instradarlo in nessuna lane; salvarlo "per sicurezza" è cerimonia penalizzata (link [[class-prospective-memory]] N3).
- **[N4 · strutturato-computabile → vars è GIUSTO, forzarlo in facts è ERRORE]** un **contatore/id/path** che interpolerai o su cui calcolerai → `set_var`/`<vars>` (leggibile con `get_var`); riversarlo come **prosa in `<facts>`** lo rende non-computabile e ingombrante. Confine opposto: **non tutto va in facts** — la forma-computabile ha il suo canale.
- **[N5 · canale-tic]** premettere "salvo questo nel canale durevole appropriato…" a ogni salvataggio, anche ovvio → cerimonia → 0 (over-triggering, speculare all'affordance-tic del padre N4).
- **[N6 · default fisso "tutto-in-facts per sicurezza"]** instradare **ogni** dato (anche il lavoro effimero) in `<facts>` "così non lo perdo" → fallisce perché la lane durevole è **cap-limitata**: i durevoli veri vengono **spinti fuori** (crowding) → a valle i fatti che contano non ci sono più. Speculare a "tutto-in-scratch" (i durevoli sfumano). **Nessun comportamento fisso è corretto** — il gold è la classificazione per-dato.

## Reward (ANCORATO all'OUTCOME + SIMMETRICO — standard a 3 SEGNALI, §4 playbook)

**⚠️ Attenzione trappola #32 (ramo≈campo)**: qui il **ramo da premiare** (la scelta-del-canale) è ≈ una **funzione diretta** del campo *"natura-del-dato"* (durevole/volatile/strutturato). Grondare quel campo **per-esempio** contro un'annotazione ("hai scelto `facts` quando natura=durevole") **re-introduce il branch-reward** (participation/branch-hack, viola #10). Perciò la correttezza-del-canale si misura **all'OUTCOME reale**, non contro un'etichetta-di-ramo; e il **determinante-del-ramo** (la calibrazione natura→canale, es. la soglia "abbastanza durevole da promuovere a note") va al segnale **DISTRIBUZIONALE** (held-out bilanciato + ECE), MAI per-esempio.

- **① OUTCOME (DOMINANTE)** — verificato a valle su fixture multi-turno: a un turno **t+K oltre la finestra rolling**, una probe dipendente dall'info **riesce sse** l'info fu instradata nel canale che **sopravvive** (durevole→`<facts>`) **ED è interpretabile** (self-contained). Meccanica reale, non etichetta: se il durevole finì in `<scratch>` → è **sfumato** → probe FAIL; se finì come valore-nudo in `<vars>` → a t+K il modello rilegge un token che **non sa interpretare** → FAIL; se il lavoro-junk affollò `<facts>` → il durevole vero fu **espulso** → la sua probe FAIL. Il reward **gronda dalla sopravvivenza-e-uso**, che è una **conseguenza genuina** della meccanica dei canali, NON dall'annotazione del ramo (rispetta #32).
- **② CORRETTEZZA-DEI-PASSI dove esiste un oracolo** — la **self-containedness** del `note` è un **INPUT ortogonale al ramo** (soundness dell'enunciato salvato: un valutatore a fresh-context lo interpreta correttamente sì/no), quindi grondabile **per-esempio** senza toccare il determinante-del-ramo (self-containedness ⊥ scelta-canale). Più l'**MCQ-controfattuale** (sotto) come validatore anti-cerimonia del ragionamento.
- **③ TRANSFER = reward diretto anti-scorciatoia** — la scelta-canale deve reggere sulle **varianti held-out** (natura del dato travestita, dimensione-finestra e cap-lane variati, nomi-canale randomizzati). Un default fisso ("sempre `note`") prende reward basso perché fallisce i negativi (N1/N6 crowding) e le varianti; chi ha imparato la LOGICA instrada correttamente ovunque.

**Simmetria** (obbligatoria): premia in egual misura il **non-promuovere** l'effimero (N1) e il **non-declassare** il durevole; il costo del **crowding** (tutto-in-facts, N6) bilancia il costo della **perdita** (durevole-in-scratch) e della **illeggibilità** (fatto-in-vars-nudo). Né "tutto-durevole" né "tutto-volatile" né "tutto-strutturato" vincono.

**Hack-check** (OBBLIGATORIO):
- **Canale-tic / cerimonia** ("instrado nel canale corretto…") senza sopravvivenza reale → 0 (àncora all'outcome).
- **"Always `note`"** (default per battere il polo perdita) → neutralizzato: affolla `<facts>` cap-limitata → i durevoli veri espulsi → N1/N6 downstream FAIL.
- **"Always `jot`/`set_var`"** → il durevole sfuma / il fatto è valore-nudo illeggibile a t+K → ① FAIL.
- **Save-junk per lucrare il segnale** → 0 (participation-hack, [[../feedback_reward_hacking_principle]]).
- **Copiare l'etichetta-natura** → impossibile: la natura è **authoring-metadata NON leakata nel prompt** (regola #24 / [[../concepts/dataset-on-the-fly-pseudorandom]] §no-checklist) e il determinante-del-ramo è **distribuzionale** (#32), non un campo per-esempio.

## Label-generation (mutation/oracle)

**Fixture self-contained** (regola #22): l'ambiente-memoria è **DATO in-context** — il contratto `<how_memory_works>` REALE (note→`<facts>` durevole; jot→`<scratch>` rolling; set_var→`<vars>` strutturato, con l'esempio BAD/GOOD) + le lane popolate con **cap noti** + uno scenario **multi-turno lungo** dove un'info al turno *t* è necessaria a *t+K* (K oltre la finestra rolling di `<scratch>` e/o oltre la native window). Fatti **veri-per-costruzione** (nessuna verità-del-mondo).

- **Oracolo ① (outcome)**: la probe a *t+K* riesce **sse** l'info è nel canale sopravvivente **e** self-contained. Meccanica simulata fedelmente (scratch sfuma, facts persiste, vars è token-nudo, facts cap-limitata espelle in FIFO/priorità).
- **Oracolo ② (self-containedness)**: il `note` salvato passa un **fresh-context-interpretability test** (un valutatore senza il turno-origine lo capisce) — grondabile per-esempio, ⊥ canale.
- **MCQ-controfattuale** (validatore segnale-② anti-cerimonia, posizione risposta **randomizzata**): stesso testo del dato **travestito** da durevole vs effimero vs strutturato → il canale corretto **cambia** → premi solo la **lettera** (deterministica), mai la prosa. Chi ha una regola-fissa sceglie uguale e si sbugiarda.
- **Mutazioni**: variare K (dentro rolling di scratch = genera N3 "non-serve-durevole"; fuori = serve facts); **mescolare** dati di natura diversa nello **stesso** prompt (costringe la classificazione per-dato, non una regola globale); iniettare **work-junk** per generare l'over-promote-crowding (N1/N6, lane cap-limitata); rendere l'info **già-persistita** (N2); dato **usa-e-getta** del turno (N3); **strutturato-computabile** da forzare-erroneamente-in-facts (N4). Bilanciamento positivi↔negativi obbligatorio.
- **Randomizzazione anti-overfit** (cruciale): **variare epoch-by-epoch i NOMI di tool/lane** (non sempre `note`/`facts`) → il modello impara a **LEGGERE il contratto** `<how_memory_works>` (semantica di permanenza/forma), non a memorizzare "note=durevole" ([[../concepts/runtime-symbol-randomization-training]] + [[../concepts/dynamic-context-training-regime]]). Distrattori: tool-simili-ma-sbagliati (esca).
- **Held-out distribuzionale** (#32): la **calibrazione** natura→canale (soglia di promozione a durevole) misurata su set bilanciato + **ECE**, mai per-esempio.
- Riusa [[../../harness/verifiers/deceptive-task-gen]] (distrattori/trappole), pattern [[../../harness/verifiers/async-schedule-gen]] (oracolo strutturale multi-turno self-contained), [[../../harness/verifiers/mcq-distractor-gen]] (controfattuale). Demo SFT: traiettorie che classificano-e-instradano correttamente; RL sull'**outcome** (info-sopravvissuta-e-usata) sopra le demo.

## Decontaminazione (regola #18)

L'**istanza osservata** = il **dump harness rate-limited** del **qualitative-review 2026-07-11** (qwen3-32b confusione `<facts>`↔`<vars>`; deepseek-v4-pro note/jot/set_var "semanticamente sottile"; sonnet-5 rischio dati non self-contained) → **held-out di validazione**, MAI nel training (train-on-test contamina il validation). Il training usa i transfer cross-dominio §positivi/§negativi con **nomi-canale randomizzati**. Se il modello ha imparato la **disciplina-di-canale**, a valle instrada correttamente il durevole in `<facts>` self-contained, il lavoro in `<scratch>`, lo strutturato in `<vars>` — **per transfer**, risolvendo comunque l'istanza osservata. È anche la **metrica di successo** del *doppio scopo* harness→training (lo scaffold `<how_memory_works>` verboso recede quando la skill regge).

## Facet / possibile sub-specializzazione (regola #20)

La skill ha tre facce che condividono trigger e outcome (per ora **una classe**, come le facce di [[class-temporal-awareness]]) — se il pattern cresce sono candidate a **sotto-figlie ricorsive**:
- **(i) durabilità-routing**: `<facts>` (sopravvive) vs `<scratch>` (sfuma) — asse *permanenza*.
- **(ii) forma-routing**: `<facts>` (prosa self-contained) vs `<vars>` (valore strutturato computabile) — asse *forma/uso*.
- **(iii) self-containedness**: l'enunciato salvato è interpretabile-da-solo (non valore-nudo) — asse *qualità-dell'enunciato* (il caso sonnet-5).

## Links
[[class-harness-environment-awareness]] (padre — affordance-awareness, di cui questa è la specializzazione sui canali di persistenza) · [[class-situational-awareness]] (nonno) · [[class-prospective-memory]] (gemella-SAVE: *whether/what* salvare — il mis-routing qui rende inutile il save giusto lì) · [[class-confabulation-retrieval-failure]] (gemella-RECALL: read-side — il mis-routing in scrittura PRODUCE il retrieval-failure che lì si gestisce) · [[class-temporal-awareness]] (sorella — freschezza/TTL: dato-in-context stale → ri-fetch, ortogonale al canale) · [[../concepts/runtime-symbol-randomization-training]] · [[../concepts/dynamic-context-training-regime]] · [[../concepts/training-vs-harness-classification]] · [[../concepts/dataset-on-the-fly-pseudorandom]] · [[area-04-context-metacognition]] · [[dataset-construction-playbook]] · [[../feedback_reward_hacking_principle]] · [[../feedback_reward_branch_field_trap]] · [[../feedback_transfer_always_cross_domain]] · [[../harness-experiment-log]] (qualitative-review 2026-07-11)
</content>
</invoke>
