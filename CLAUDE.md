# Setup & Onboarding — SLM Research Project

> Questo file è per Claude Code. Leggi tutto prima di fare qualsiasi altra cosa.

---

## Fase 1 — Installa le skills ML research

Esegui questi comandi in sequenza nel terminale. Non procedere alla Fase 2 finché non sono tutti completati con successo.

```bash
# Crea la cartella skills se non esiste
mkdir -p ~/.claude/skills

# 1. paper-search — ricerca multi-database (arXiv, Semantic Scholar, DBLP)
git clone --depth=1 https://github.com/openags/paper-search-mcp.git /tmp/paper-search-mcp
mkdir -p ~/.claude/skills/paper-search
cp /tmp/paper-search-mcp/claude-code/SKILL.md ~/.claude/skills/paper-search/SKILL.md
rm -rf /tmp/paper-search-mcp

# 2. ARIS — loop autonomo ricerca (experiment plan, arxiv, auto-review, paper writing)
git clone --depth=1 https://github.com/wanshuiyin/Auto-claude-code-research-in-sleep.git /tmp/ARIS
for skill_dir in /tmp/ARIS/skills/*/; do
  skill_name=$(basename "$skill_dir")
  if [ -f "$skill_dir/SKILL.md" ]; then
    mkdir -p ~/.claude/skills/aris-$skill_name
    cp "$skill_dir/SKILL.md" ~/.claude/skills/aris-$skill_name/SKILL.md
  fi
done
rm -rf /tmp/ARIS

# 3. AI-Research-SKILLs — skills ML specifiche (LoRA, PEFT, fine-tuning, post-training, RL)
git clone --depth=1 https://github.com/Orchestra-Research/AI-Research-SKILLs.git /tmp/AI-Research-SKILLs
for category_dir in /tmp/AI-Research-SKILLs/*/; do
  for skill_dir in "$category_dir"*/; do
    skill_name=$(basename "$skill_dir")
    if [ -f "$skill_dir/SKILL.md" ]; then
      mkdir -p ~/.claude/skills/ml-$skill_name
      cp "$skill_dir/SKILL.md" ~/.claude/skills/ml-$skill_name/SKILL.md
    fi
  done
done
rm -rf /tmp/AI-Research-SKILLs
```

Verifica che l'installazione sia andata a buon fine:

```bash
ls ~/.claude/skills/ | grep -E "paper-search|aris-|ml-" | wc -l
# Atteso: ~155 skills
```

Se il numero è > 100, procedi alla Fase 2.

---

## Fase 2 — Intervista il progetto

Una volta completata l'installazione, conduci un'intervista strutturata con l'utente per raccogliere tutti i requisiti del suo progetto. L'obiettivo è costruire una comprensione completa del sistema che vuole realizzare prima di scrivere una riga di codice o avviare qualsiasi ricerca.

**Contesto noto:** l'utente sta sviluppando un Small Language Model (SLM) con uno strato LoRA applicabile a runtime, con pipeline che include reinforcement learning, training, post-training. Vuole anche costruire un wrapper attorno al modello.

Segui questa struttura di intervista. Fai **una domanda per volta**, aspetta la risposta, poi vai alla successiva. Non somministrare tutto in blocco.

---

### Blocco A — Il modello

1. Qual è l'architettura base che stai usando o vuoi usare? (es. LLaMA, Mistral, Phi, Qwen, custom) E quali dimensioni — quanti parametri indicativamente?

2. La LoRA applicabile a runtime: intendi che i pesi LoRA vengono caricati/scambiati dinamicamente a inferenza già avvenuta, o che il modello si adatta in-context durante la sessione? Hai già un'idea di come implementarlo tecnicamente?

3. Quali task vuoi che il modello sappia fare bene? (es. ragionamento, coding, domande specifiche di dominio, seguire istruzioni, dialogue) Ci sono benchmark specifici che usi come riferimento?

4. Hai già dati di training, o devi costruire/raccogliere il dataset? Se sì, che tipo di dati e in che formato?

---

### Blocco B — Il training pipeline

5. Descrivimi le fasi che hai in mente: pre-training from scratch, continual pre-training su base esistente, SFT, RLHF/GRPO, DPO, o una combinazione? In che ordine?

6. Quale infrastruttura hai a disposizione? (GPU locali, cloud, HPC — tipo e quantità)

7. Hai già un framework preferito? (Axolotl, LLaMA-Factory, TRL, Unsloth, custom PyTorch) O sei aperto a valutare?

8. Come intendi misurare se un esperimento ha funzionato? Hai metriche specifiche o benchmark che vuoi usare come ground truth?

---

### Blocco C — Il wrapper

9. Il "wrapper" di cui parli: è un'applicazione che espone il modello tramite API, un'interfaccia utente, un sistema multi-agente, o qualcos'altro?

10. Chi sono gli utenti finali del wrapper? (ricercatori, sviluppatori, utenti consumer, solo tu)

11. Ci sono funzionalità specifiche che deve avere il wrapper? (es. gestione del contesto, tool calling, RAG, memory, streaming, autenticazione)

12. Hai vincoli tecnologici per il wrapper? (linguaggio, framework, deployment target — cloud/on-prem/edge)

---

### Blocco D — Ricerca e stato dell'arte

13. Ci sono paper specifici che ti hanno ispirato o che stai cercando di replicare/estendere?

14. Qual è la tua ipotesi principale — la cosa che vuoi dimostrare o verificare con questo progetto?

15. Ci sono approcci che hai già provato e scartato? Se sì, perché non hanno funzionato?

---

### Blocco E — Priorità e timeline

16. Cosa deve funzionare per primo? Se dovessi avere qualcosa di concreto in una settimana, cosa sarebbe?

17. Ci sono scadenze esterne (paper submission, demo, lancio) che devo tenere in conto?

18. Preferisci che io lavori in autonomia sugli esperimenti notturni e ti presenti i risultati, o vuoi essere coinvolto step-by-step nelle decisioni?

---

## Fase 3 — Dopo l'intervista

Una volta raccolte le risposte a tutti i blocchi:

1. Scrivi un documento `PROJECT.md` nella root del repo con: obiettivo, architettura scelta, pipeline di training, descrizione del wrapper, metriche di successo, e todo list prioritizzata.

2. Suggerisci le 3-5 skills più rilevanti tra quelle installate da usare subito (es. `ml-peft` per LoRA, `aris-experiment-plan` per la pianificazione, `aris-arxiv` per la letteratura).

3. Proponi il primo esperimento concreto da fare, con: obiettivo misurabile, dataset minimo, metrica di valutazione, e tempo stimato.

---

## Fase 4 — Wiki Schema (pattern Karpathy LLM-Wiki)

Il progetto usa il pattern [Karpathy LLM-Wiki](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f): tre layer (raw / wiki / schema). Questo file **è lo schema**. La wiki sta in `wiki/`. I raw sources stanno nella root e in `raw/`.

### Layout fisso — monorepo `ITLMv1`

> **Decisione 2026-06-29** (utente msg 319/323, ADR `wiki/decisions/2026-06-29-monorepo-itlmv1.md`): repo unico **`ITLMv1`** (la cartella locale è ancora `slm/`; il repo GitHub `0Franky/sml` è rinominabile a `ITLMv1` senza toccare i contenuti). **SSOT centralizzata**: TUTTA la conoscenza dei sub-progetti (`lm/`, `harness/`) vive in `wiki/`. I sub-progetti contengono solo codice/config/artefatti, mai design-knowledge. Subdir piani (non submodule) → grafo unico + un solo push. I subrepo indipendenti per `lm/`/`harness/` si creeranno **dopo**, se serviranno (vedi ADR).

```
ITLMv1/  (cartella locale: slm/)
├── CLAUDE.md            # questo file (schema)
├── transcript.md        # raw — sessione AI precedente, immutable (gitignored)
├── HANDOFF.md           # raw — handoff sessione, immutable (gitignored)
├── docs/                # raw — design v1.0 e futuri spec
├── raw/                 # raw — ingest futuri (paper, articoli, screenshot, web clippings)
├── wiki/                # SSOT — LLM-maintained, conoscenza di ENTRAMBI i sub-progetti
│   ├── README.md        # entry point + synthesis
│   ├── index.md         # catalogo content-oriented
│   ├── log.md           # ledger cronologico (## [YYYY-MM-DD] action | title)
│   ├── open-questions.md
│   ├── todo.md          # tracker forward-looking
│   ├── architecture/
│   ├── entities/        # paper, modelli, framework, persone
│   ├── concepts/        # tecniche, idee, principi, trade-off
│   ├── decisions/       # ADR datati (2026-MM-DD-slug.md)
│   └── training-taxonomy/  # tassonomia training + gold-example + foglie
├── lm/                  # sub-progetto LM: training + eval + data-pipeline + configs (codice, no knowledge)
├── harness/             # sub-progetto HARNESS: wrapper pi (extensions) + serving vLLM + verifiers + sandbox
└── graphify-out/        # knowledge graph artifacts UNICO (graph.html, graph.json, GRAPH_REPORT.md)
```

### Operazioni

#### Ingest (nuovo raw source aggiunto)

Quando l'utente aggiunge un file in `raw/`, o linka una URL nuova, o richiede l'analisi di un paper esistente:

1. Leggi il source integralmente. Discuti i takeaway con l'utente.
2. Crea/aggiorna pagine in `wiki/entities/` o `wiki/concepts/` come pertinente. Usa frontmatter YAML completo (`name`, `description`, `type`, `tags`, `sources`, `last_updated`).
3. Aggiorna `wiki/index.md` aggiungendo la nuova pagina nella categoria appropriata.
4. Aggiungi entry in `wiki/log.md`: `## [YYYY-MM-DD] ingest | Titolo sorgente`.
5. Verifica se la nuova fonte impatta `wiki/architecture/*` o `wiki/decisions/*` → aggiorna se sì.
6. Lancia `/graphify --update` per ri-allineare il knowledge graph.

#### Query (utente fa una domanda)

1. Leggi `wiki/index.md` per trovare pagine rilevanti.
2. Drill-down nelle pagine specifiche.
3. Rispondi sintetizzando dalla wiki, citando paths e righe (`wiki/entities/hmora.md:14`).
4. **Buone risposte vanno filed back nella wiki** — se la risposta produce nuova sintesi/comparazione/insight, creane una pagina in `wiki/concepts/` o `wiki/decisions/`.
5. Aggiungi entry in log: `## [YYYY-MM-DD] query | Domanda`.

#### Lint (health check periodico)

Su richiesta utente o quando appropriato:

- Cerca contraddizioni tra pagine
- Identifica claim stantii che nuove fonti hanno superato
- Trova pagine orfane (zero link in entrata)
- Trova concetti citati ma senza pagina propria
- Cross-reference mancanti
- Gap conoscitivi colmabili con web search

Output: report + proposte di ingest/correzione. Aggiungi entry in log: `## [YYYY-MM-DD] lint | summary`.

### Regole di scrittura

- **Confidence tags** obbligatorie per claim non banali: `[EXTRACTED]` (esplicito nel source), `[INFERRED]` (inferenza), `[AMBIGUOUS]` (incerto, segnalato).
- **Frontmatter YAML** in ogni pagina con almeno: `name`, `description`, `type`, `last_updated`.
- **Date assolute** sempre. Mai "ieri", "scorsa settimana".
- **Link interni** stile Obsidian: `[[entities/hmora]]` o `[testo](relative/path.md)`.
- **Citazioni** sempre con arXiv URL, DOI, o URL HF/GitHub. Mai "secondo un paper".
- **Nessuna confabulazione**: se non sai una cosa, scrivilo. Non inventare numeri o riferimenti.
- **Idea ground truth** (three-tier dell'utente) protetta: alternative documentate sì, ma in `decisions/` come "alternative considerate", mai sovrascrivendo l'idea principale.

### Maintenance obbligatoria

L'LLM (tu) è il maintainer della wiki. Ogni volta che:

- Apprendi nuova conoscenza rilevante al progetto → aggiorna `wiki/`
- Prendi una decisione architetturale o di processo → ADR in `wiki/decisions/`
- Chiudi una open question → spostala da `open-questions.md` a un ADR
- Modifichi significativamente la struttura del progetto → aggiorna `wiki/index.md` e `wiki/log.md`
- Aggiungi/modifichi/elimini file rilevanti → lancia `/graphify --update`

L'utente non scriverà la wiki a mano. Tu sì.

### Tooling

- **Wiki search**: per ora basta `index.md` + grep. Se la wiki cresce, valuta installazione di `qmd` (https://github.com/tobi/qmd).
- **Knowledge graph**: `/graphify` per build iniziale, `/graphify --update` per incremental. Output in `graphify-out/`.
- **Skill grill-me**: usala quando serve allineamento profondo su vision/idea con l'utente. È rigorosa, segui i suoi checkpoint.
- **Obsidian** (opzionale): se l'utente apre `slm/` come vault Obsidian, ottiene navigazione visuale + graph view nativi.

---

## Fase 5 — Knowledge Graph (graphify)

Mantenere knowledge graph parallelo alla wiki. Single source of truth per query semantiche cross-document.

- **Build iniziale**: `/graphify` (la prima volta dopo il bootstrap)
- **Update incrementale**: `/graphify --update` dopo ogni modifica significativa (>3 file nuovi/modificati, o nuovo paper ingerito, o ADR creato)
- **Query semantica**: `/graphify query "domanda"` per risposte cross-document
- **Path discovery**: `/graphify path "ConceptA" "ConceptB"` per trovare collegamenti

Audit trail: ogni edge ha confidence tag (EXTRACTED/INFERRED/AMBIGUOUS), allineato con la convenzione wiki.

### Portabilità / OS-agnostic (obbligatorio)

Tutti gli artifact graphify destinati al repo devono essere **device-independent** (Linux / Windows / macOS / altri). Convenzione unica e standard:

- **Path relativi alla root del repo**, sempre. Mai assoluti, mai username/home dir (`D:\Users\<user>\...`, `C:\Users\...`, `/home/<user>/...`). Un path relativo è già di per sé root- e device-agnostic e **risolvibile dai tool** (graph viewer, GitHub, Obsidian) — niente token/placeholder custom (`<repo-root>/`, `$ROOT/`…): romperebbero la risoluzione automatica.
- **Forward slash `/`** ovunque, **mai** backslash `\` (Windows-only → rompe su Linux).
- I link interni nel contenuto wiki seguono già questa convenzione (Obsidian `[[...]]` / markdown relativo): mantienila a ogni scrittura.
- I subagent di estrazione graphify devono emettere `source_file` **repo-relative con `/`** (è già il default di `graph.json`).
- **Al push**: pubblicare SOLO `graph.json` + `graph.html` + `GRAPH_REPORT.md`. **Escludere `manifest.json`** (contiene path assoluti del device). Prima del push, pass di sanitizzazione: ogni `\` → `/`, ogni path assoluto/username → ridotto a repo-relative.

> Razionale: il grafo va pushato per evitare ad altri di rigenerarlo (~170K token); deve clonarsi e aprirsi identico su qualsiasi device. Un solo path assoluto lo rende non-portabile **e** leaka l'username (→ [[feedback_no_pii_in_repo]]).

---

## Regole permanenti

1. **Idea utente protetta**: la three-tier architecture (orchestrator FT + LoRA programming + LoRA verticali) è ground truth. Alternative consideratele in `wiki/decisions/`, non sovrascriverla mai senza esplicita richiesta utente.
2. **Critica oggettiva**: l'utente vuole feedback critico, non piaggeria. Indica trade-off e rischi reali. Vedi `wiki/concepts/catastrophic-forgetting.md`, `lora-stacking.md` come esempi.
3. **Nessun spostamento di raw sources** senza accordo: `transcript.md`, `HANDOFF.md`, `docs/` restano in posizione attuale fino a decisione esplicita.
4. **Italiano** in tutta la conversazione con l'utente (vedi globalCLAUDE.md). Termini tecnici e identifier in inglese.
5. **No co-author Claude** nei commit (vedi globalCLAUDE.md).
6. **Skill `grill-me`** prima di scrivere codice/training pipeline. È la fase 2 dell'onboarding, ma riformulata e più rigorosa.
7. **Artifact graphify OS-agnostic**: path repo-relative + forward slash, mai assoluti/backslash/username, niente token custom. Push solo `graph.json`+`graph.html`+`GRAPH_REPORT.md`, escludi `manifest.json` (vedi Fase 5 → Portabilità). **⚠️ Il repo `0Franky/sml` è PUBLIC (verificato `gh` 2026-07-05): ogni push è visibile pubblicamente su GitHub → scan PII sull'INTERO tree (non solo il diff) + redigere path assoluti/username da OGNI dump PRIMA di inviarlo all'utente. Vedi memory `feedback_no_pii_in_repo`.**
8. **Optimization-first** (utente 2026-06-27, "ricordatelo sempre"): batch le operazioni ripetute (analisi unica, non N volte), **ottimizza proattivamente il contesto** (riorganizza task-list/note/regole, chiudi ciò che non serve), NON over-cautela su cose a basso valore. Vale per il modello in progettazione E per il mio modo di lavorare. Vedi memory `feedback_optimization_first`.
9. **Cattura idee + low-confidence→gather**: cattura SUBITO ogni idea utente in modo durevole (anti-loss; idee grezze non-pubblicabili → `wiki/_private/` gitignored). Quando poco confident: fermati, riorganizza, fai gathering (grep/file-search/web) prima di procedere.
10. **Catene di pensiero = priorità #1** (utente 2026-06-27): estrai SUBITO la catena **why → problema → soluzione** (non solo la conclusione). Documentala nei concept E nei gold template. **MA subordinata all'ANCORAGGIO** (review 2026-06-27, anti "catena-fantasma"): la catena dà *reward* solo dove è ancorabile — (i) ogni marker `[V]` deve corrispondere a una **tool-call/artefatto reale nel trace** (estende il check-fantasma 3b a tutte le foglie Q); (ii) foglie L → premia la **predittività verificata in fase 3** (esito previsto vs reale), MAI la forma; (iii) deferral/scelte-di-valore → CoT presente per il formato ma NIENTE reward (valgono le difese judge). **Proporzionalità**: catena dove il ragionamento è non-ovvio; per conclusioni banali una riga basta — non gonfiare why→problema→soluzione in rito a 3 heading. Razionale: la catena esplicita è anti-shortcut SOLO se *load-bearing*; altrimenti diventa essa stessa un vettore di reward-hacking (reasoning plausibile ma non causale). Vedi memory `feedback_chain_of_thought_extraction` + `wiki/_private/review-formalization-2026-06-27.md`.
11. **Classificazione training-vs-harness obbligatoria** (utente 2026-06-27, msg 205): per OGNI capacità, PRIMA di costruirla/addestrarla, **scomponila** ({meccanismo} vs {decisione/generazione}) e **classifica ciascuna metà** sull'asse `F-harness` / `F-serving-stock` / `F-serving-custom` / `S` / `F+S`; dichiara lo **stato-senza-training** (PIENA / DEGRADATA-MA-UTILE / INERTE); per la parte SKILL definisci regime + label-generation + **reward ancorato all'OUTCOME** (mai alla cerimonia). **Mai** spedire una `F+S` inerte-senza-training come feature di Fase-1 (guscio inerte); **né** over-gatare ciò che un fallback deterministico rende già utile (anti optimization-first). Playbook completo: `wiki/concepts/training-vs-harness-classification.md`. Vedi memory `feedback_training_vs_harness_classification`.
12. **Mai lavori a metà + tracciare tutto** (utente 2026-06-28): **wiring sempre completo** — creando/modificando un pezzo, completa anche link/index/cross-ref/stati collegati (niente riferimenti appesi né pezzi orfani); **ogni pezzo mancante o rinviato → TODO in `wiki/todo.md` SUBITO** (mai solo in chat: la compaction la perde); **tieni tutti gli stati allineati** allo stato corrente (todo/log/memory/index sincronizzati). Razionale: "se non si traccia si crea rumore e si perde il filo". Vedi memory `feedback_track_everything` + `wiki/todo.md`.
13. **Ancoraggio TEMPORALE = ordine autoritativo** (utente 2026-07-03, msg 848/849): il tempo è fondamentale — **ogni item di una lane/contesto porta il proprio tempo** (start-sessione ASSOLUTO nell'header una volta + **shift** compatto per riga `[+Xs]`/`[+3m12s]` = delta dallo start; shift-non-timestamp-pieno per economia-char + si ragiona relativi all'inizio). **I timestamp sono l'ORDINE AUTORITATIVO**: il modello ricostruisce la timeline DAI timestamp, MAI dalla posizione/sequenza che l'harness costruisce (può essere sbagliata: bug, load-al-contrario, race) → istruzione esplicita nell'awareness ("l'ordine è dato dagli shift, non dalla posizione; se una riga è fuori ordine, fidati dello shift"). Stessa filosofia dell'anchoring anti-reward-hacking (non fidarti della presentazione, àncora al ground-truth, [[feedback_reward_hacking_principle]]). **Focus mode**: entrando in focus si ricrea il contesto → nuovo start + shift rebased al focus-start. Impl: `src/time-shift.mjs` (puro, 33 test); lane `<messages_with_user>` + `<last_tool_calls>`. Vedi memory `feedback_temporal_anchoring`.
14. **Validare al livello del WIRING prima del test-live utente** (utente 2026-07-04, msg 962, dopo il bug eviction-checkpoint `019f2ab9`): un unit-test su funzioni PURE è **falsa sicurezza** se il bug vive nel WIRING (fonte-dato, ordine-hook, pipeline, contesto realmente ricevuto dal modello). PRIMA di consegnare qualcosa all'utente per un test LIVE: (a) scrivere un **integration/wiring test deterministico** che riproduca la pipeline reale e che *fallirebbe* col bug (per l'eviction: "N turni nello store + array finestrato a K → deve comunque scattare"); (b) **strumentare il ground-truth** e verificare che la feature abbia davvero avuto effetto (es. meta scritta, payload reale — [[feedback_instrument_before_hypothesizing]]); (c) sapere **cosa carica davvero** l'ambiente del modello-sotto-test (il 9B mangiava `slm/CLAUDE.md` via resource-loader di pi → lanciare pi con `-nc`). Il test manuale dell'utente è l'**ULTIMA** linea di difesa, mai la prima: verde-in-unit ≠ validato. Vedi memory `feedback_validate_wiring_before_handoff`.
15. **Gate di validazione PRE-HANDOFF + io-testo-non-l'utente** (utente 2026-07-04, msg 962/964, dopo la catena di errori notturni eviction/`-nc`/QA-manuale): il pattern-errore da estirpare è *dichiarare "fatto/funziona/verificato" e consegnare, mentre "verificato" era shallow (unit-green, code-read) non end-to-end al livello REALE dove l'utente lo usa*. È la stessa non-learning del 9B: fixo l'istanza e salto la prevenzione, e più l'errore è importante più lo minimizzo. **Prevenzione — gate obbligatorio prima di OGNI "fatto" detto all'utente**: (a) validato END-TO-END dove l'utente lo usa davvero — per il MODELLO col driver headless `harness/tools/drive-qwen.mjs` (guido IO qwen multi-turno, l'utente non è mai il primo QA); per l'HARNESS col wiring reale **e il launcher effettivo** (non "a voce"); (b) ground-truth ISPEZIONATO (payload reale `last-turn-full.md`, DB) — mai dichiarare un finding senza guardarlo: es. "l'harness non ri-mostra i fatti salvati" era FALSO, `recent_changes`+`<messages_with_user>` li avevano, la colpa era del 9B che ignora il contesto; (c) se NON validato → **dirlo esplicito**, mai implicare "fatto". La regola vale SOLO se eseguo il gate ogni volta. Vedi memory `feedback_handoff_validation_gate` + [[feedback_validate_wiring_before_handoff]].
16. **SSOT + DRY obbligatori** (utente 2026-07-04, msg 1000/1001/1003, dopo i fallback-literal `?? 1` su `nativeKeepTurns` col default reale 6): **ogni valore ha UNA sola sorgente di verità**. Per la config: `DEFAULT_HARNESS_CONFIG` è la SSOT dei default; **`loadHarnessConfig` clampa/garantisce OGNI campo una volta** (la difesa vive LÌ); i consumatori leggono `cfg.campo` e basta — **ZERO fallback-literal, ZERO `?? <valore>`** su campi che la config già garantisce (un `?? 1` è codice morto E può contraddire il default = doppio bug). Le **funzioni pure** che accettano cfg opzionale defaultano all'oggetto **SSOT importato**, non a una copia ri-scritta (niente `DEFAULT_CFG` che duplica `DEFAULT_HARNESS_CONFIG.trigger`). **Niente magic-constant ripetute** (cap, soglie, path DB, prefissi meta-key): nominale/sourcele una volta. **Niente logica duplicata**: stessa derivazione in ≥2 file → un helper. Il difetto NON è solo estetico: due sorgenti divergono in silenzio (il fallback `1` mascherava il vero `6`). **Prevenzione**: prima di scrivere un default/fallback/costante, chiediti "esiste già la sorgente?"; se sì, referenziala, non copiarla. Vedi memory `feedback_ssot_dry` + `wiki/architecture/context-pressure-mechanism.md`.
17. **Ogni lezione → REGOLA/TEST/MECCANISMO, mai solo acknowledgment** (utente 2026-07-05, msg 1103/1105: *"dici sempre che devi pensarci ma non metti mai regole per ricordartelo … non so più come fartelo capire"*). Il pattern-errore da estirpare: riconosco a parole ("hai ragione, dovrei pensarci/ricordarmelo") e poi NON creo il meccanismo che me lo fa fare → ripeto l'errore (identica non-learning del 9B, [[feedback_handoff_validation_gate]] #15). **Prevenzione — due gate automatici**: (a) **bug trovato da validazione live/headless che i test verdi NON hanno catturato → PRIMA di proseguire scrivo un regression test AL LIVELLO DOVE VIVE IL BUG** (wiring/integration se il bug è nel wiring, non un altro unit sulle funzioni pure — [[feedback_validate_wiring_before_handoff]] #14) che *fallirebbe* col bug e ora passa: il gap si chiude PER SEMPRE, non "mi ricorderò"; es. set_keepturns gated-e-invisibile → test che asserisce reachability di OGNI tool registrato. (b) **meta-gate**: ogni volta che mi sento dire "dovrei pensarci / ricordarmelo / la prossima volta" → lo ENCODO SUBITO come regola (CLAUDE.md/memory), test, o check deterministico — nella stessa risposta, non "dopo". Se non lo encodo, non esiste ([[feedback_track_everything]] #12). L'acknowledgment senza meccanismo è rumore che erode la fiducia. Vedi memory `feedback_institutionalize_lessons_as_rules`.

18. **Ogni buco di intelligenza → proponi la CLASSE nel training set, mai solo notarlo** (utente 2026-07-05, msg 1122). Ogni volta che noto un gap di ragionamento/intelligenza del modello — in chat, negli esperimenti, OVUNQUE — devo **SEMPRE proporre** l'inserimento nel training set della **CLASSE di problemi** (astratta dall'istanza singola) + la relativa **soluzione/skill**, ancorata all'OUTCOME. Poi l'utente approva (*"se mi va bene procediamo"*) PRIMA dell'aggiunta effettiva. **Flusso**: (a) astrai il gap in una classe (es. #145 → *"non riquestiona l'assunzione load-bearing sotto stagnazione, ripara la dimensione sbagliata"*); (b) proponi home (area taxonomy + reward-tag) + **label-gen** (mutation/oracle, riusa `verifiers/deceptive-task-gen.mjs`) + **hack-check**; (c) attendi l'ok → fila in `wiki/training-taxonomy/`. **Doppio scopo degli esperimenti** (esplicito msg 1122): ogni test serve a migliorare l'HARNESS *e* a scoprire i **buchi-da-addestrare** → collega sempre i due (finding harness ↔ classe-training). L'harness scaffolda ORA, il training internalizza il fix. **Decontaminazione + transfer (utente msg 1125)**: MAI mettere l'istanza-eval osservata nel training (= train-on-test, contamina il validation set); **traduci lo skill in 3-4 esempi su DOMINI DIVERSI con la STESSA logica**, e tieni l'istanza osservata (es. #145) come **held-out di validazione** → se il modello impara davvero fa **transfer** e la risolve comunque (è anche la metrica di successo del training). Vedi memory `feedback_intelligence_gap_to_training_class` + [[feedback_institutionalize_lessons_as_rules]] #17.

19. **Transfer set SEMPRE cross-dominio + vita quotidiana + complessità variabile** (utente 2026-07-05, msg 1186). Quando genero gli esempi di **transfer** per una skill di ragionamento/metacognizione, NON devo mai concentrarli in una sola area (men che meno solo informatica/software) — altrimenti il modello **localizza** la skill ("pensiero critico = cosa del codice") invece di **generalizzarla**, *"cosa che non deve assolutamente avvenire"*. Ogni transfer set deve spaziare **domini lontani/opposti** (vita quotidiana, relazioni, economia/policy, ecologia, salute, business…) **+ complessità variabile** (scelte banali/basilari → scelte complesse sistemiche), perché la STESSA logica astratta vale ovunque (es. consequence↔intention = **perverse incentive / Cobra effect** in economia, NON un pattern software). **Regola operativa**: per OGNI classe/gold, dopo gli esempi tecnici aggiungere SEMPRE ≥3-4 transfer non-tecnici cross-campo, dal banale al sistemico. Razionale: una skill di ragionamento insegnata in un solo dominio si àncora a quel dominio; il transfer cross-campo è ciò che *costringe* l'astrazione (ed è anche la metrica di successo — chi ha imparato la LOGICA la applica ovunque). Vedi `wiki/training-taxonomy/class-consequence-intention-conflict.md` (gruppi A software / B vita-quotidiana / C cross-dominio) + memory `feedback_transfer_always_cross_domain` + [[feedback_intelligence_gap_to_training_class]] #18.

20. **Classi di training SEMPRE gerarchiche (padre→figlia) + specializzazione ricorsiva** (utente 2026-07-05, msg 1195). Ogni volta che formalizzo una classe di training la costruisco **gerarchica**: identifico la **skill-radice condivisa** (il padre) e ci appendo le **figlie** come specializzazioni di *cosa/come* si applica; se poi mi accorgo che una figlia può specializzarsi ulteriormente, **lo faccio** (ricorsione — es. `class-stagnation-recovery` è figlia di `class-metacognitive-self-audit` ED è a sua volta padre di A focus-decompose / B jot-ipotesi). MAI classi-sorelle scollegate quando condividono un trigger/skill comune: il padre fa imparare la radice UNA volta (anti-ridondanza di segnale) + riflette la relazione reale + è composizionale ([[concepts/compositional-curriculum-thinking-optimization]]). **Regola operativa**: prima di filare una classe nuova, cerco il suo padre tra le esistenti (o lo creo) e la aggancio; poi valuto se la nuova figlia ha sotto-specializzazioni. Prototipo: `wiki/training-taxonomy/class-metacognitive-self-audit.md` (padre) → stagnation-recovery / transfer-assumption-audit / consequence-intention-conflict (figlie). Vedi memory `feedback_hierarchical_training_classes` + [[feedback_intelligence_gap_to_training_class]] #18.

21. **Esempi NEGATIVI sempre (quando il caso lo richiede) + completezza-dataset auditata** (utente 2026-07-05, msg 1218). Ogni training set / classe / gold deve includere **esempi NEGATIVI** (contro-esempi, distrattori, casi-in-cui-NON-si-applica / dove la risposta corretta è l'OPPOSTO o il non-agire) quando migliorano le performance — non solo positivi. I negativi insegnano il **CONFINE** della skill (quando NON attivarla), rendono il segnale **discriminativo**, e prevengono over-triggering / over-caution: è la stessa logica della *false-block bilanciata* dei gold criticality e del *reward simmetrico* anti-confabulazione — senza il negativo, "sempre-prudente / sempre-astieniti" diventa un hack che passa. **Regola operativa**: per OGNI classe/gold, dopo i positivi chiediti *"qual è il caso-confine dove la skill NON deve scattare / la risposta corretta è non-agire?"* e aggiungi ≥N contro-esempi bilanciati. Inoltre, prima di considerare un dataset "pronto", **auditane COMPLETEZZA e COERENZA** (checklist `wiki/concepts/training-set-completeness-audit.md`): nessun gap di copertura, positivi↔negativi bilanciati, transfer cross-dominio sufficiente su ≥N classi esterne generalizzate (#19), nessuna contraddizione tra esempi, decontaminazione held-out (#18). Le regole di costruzione del training (#18 gap→classe · #19 transfer-cross-dominio · #20 gerarchia · #21 negativi+completezza) sono **mirrorate in wiki** (`wiki/concepts/training-set-construction-principles.md`) come SSOT navigabile. Vedi memory `feedback_negative_examples_and_dataset_completeness`.

22. **Integrità fattuale del training set — mai fatti inventati, sempre completi; l'incerto → passo di VERIFICA, non asserzione** (utente 2026-07-06, msg 1235). Ogni informazione **fattuale** in un training example diventa **ground truth** per il modello: la interiorizza e la riproduce con sicurezza → un fatto **falso o incompleto CONTAMINA** conoscenza e prestazioni (es. affermare "Gmail ha solo server negli US" = falso → il modello impara una falsità e la ripete). **Regola**: (a) i fatti nel training devono essere **accurati (mai inventati) E completi (nessuna omissione fuorviante — mezza verità = falsità)**; (b) **SPLIT del substrato fattuale** — separa **(I) conoscenza VERIFICATA e STABILE** (usabile come ground truth, ma **citata** come nella wiki e **minimizzata**) da **(II) claim NON verificati o VOLATILI** (servizi/prezzi/API/feature cambiano) → **MAI affermarli**; riformulali come **passo di ragionamento/Discovery**: il gold-behavior è il modello che **riconosce l'incertezza e VERIFICA** (cerca nei doc / sul web) invece di asserire. **Default in dubbio = (II)** (meglio insegnare a verificare che contaminare). (c) **Per le skill di RAGIONAMENTO preferisci fatti DATI in-context / self-contained nella fixture** (veri-per-costruzione) → l'esempio testa il ragionamento NON il recall, e **aggira** la verità-del-mondo (già così i gold Q con fixture di codice); i fatti-del-mondo-reale come ground truth restano ai task di CONOSCENZA vera (area-12), verificati+citati. (d) **Reward**: per un fatto incerto premia il **comportamento di verifica** (ha riconosciuto il `[?]` e l'ha risolto), NON il conoscere-il-fatto (che potremmo avere sbagliato) → altrimenti si premia una confabulazione fortunata. È l'applicazione al **SUBSTRATO** degli esempi della stessa disciplina `[V]/[A]/[?]` già usata nell'OUTPUT ([[concepts/structured-thinking]]), dell'**anti-confabulazione** ([[training-taxonomy/class-confabulation-retrieval-failure]]), delle **confidence-tag** wiki (§Regole di scrittura) e del **reward-ancorato-all'outcome** ([[feedback_reward_hacking_principle]]). Caveat (costo): ogni claim del mondo-reale va verificato+citato o trasformato in verify-step → mitigato da (c). Mirror in `wiki/concepts/training-set-construction-principles.md`. Vedi memory `feedback_training_set_factual_integrity`.

23. **Aggiornare SEMPRE il "manuale di costruzione del modello" (findings→wiki come SSOT navigabile, mai perderli)** (utente 2026-07-07, msg 1292). Ogni cosa scoperta dagli esperimenti/chat/analisi va **SUBITO** consolidata nella wiki (`wiki/harness-experiment-log.md` per i finding sperimentali, `wiki/concepts/`/`wiki/decisions/` per sintesi/ADR, `wiki/todo.md` per il forward-looking) — la wiki È il manuale di costruzione del modello e dell'harness. **Scopo esplicito**: *"per le prossime attività usiamo questa conoscenza come Wiki ed evitiamo di ripetere gli stessi errori"*. Non basta committare il codice o dirlo in chat (la compaction la perde): il sapere-sistema vive in wiki, versionato e linkato. Rafforza [[feedback_document_findings_always]] elevandolo a regola esplicita "aggiorna il manuale". Ogni finding: numero-esperimento + verdetto + implicazione (harness ↔ training). Vedi memory `feedback_always_update_model_manual`.

24. **NO pezze-regex per compiti di LINGUAGGIO/semantica — usa l'intelligenza del modello (target ≥32B)** (utente 2026-07-07, msg 1292). Per catturare/interpretare fatti espressi in linguaggio naturale (nomi, preferenze, intenzioni, sfumature) **NON** usare regex/pattern hardcoded: *"se è tramite regex non possiamo contemplare tutti i casi, questa sarebbe una pezza… il linguaggio ha sfumature sottili che solo il modello può capire a fondo (se intelligente, target finale ≥32B)"*. Le difese/estrazioni **deterministiche** vanno bene per segnali **strutturali** (file-write → task-digest, URL/secret-pattern per la redazione-sicurezza dove il costo di un miss è alto), ma **la comprensione semantica è compito del modello**, non di una regex che elenca casi. Coerente con [[feedback_clear_instructions_over_patches]] (istruzioni chiare > guardrail-pezza) e con l'identità Tier-1 = INTELLIGENZA ([[project_base_model_intelligence]]). **Regola operativa**: prima di scrivere una regex per "capire" del testo naturale, fermati — è una pezza; delega al modello (istruzione chiara + tool come get_conversation/note) o, se serve determinismo di sicurezza, limita la regex al pattern strutturale stretto e documenta il residuo. Vedi memory `feedback_no_regex_patch_for_language`.

---

*Generato da Cowork / Claude Dispatch — Aprile 2026 — Aggiornato 2026-07-07 (regola #24 no-regex-pezza-per-linguaggio + regola #23 aggiorna-sempre-il-manuale-findings→wiki + regola #22 integrità-fattuale-training-set + regola #21 negative-examples+completezza-dataset + regola #20 classi-gerarchiche-sempre + regola #19 transfer-cross-dominio-sempre + regola #18 gap-intelligenza→classe-training + regola #17 lezione→regola/test-sempre + regola #16 SSOT/DRY)*
