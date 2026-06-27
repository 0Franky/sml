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

### Layout fisso

```
slm/
├── CLAUDE.md            # questo file (schema)
├── transcript.md        # raw — sessione AI precedente, immutable
├── HANDOFF.md           # raw — handoff sessione, immutable
├── docs/                # raw — design v1.0 e futuri spec
├── raw/                 # raw — ingest futuri (paper, articoli, screenshot, web clippings)
├── wiki/                # LLM-maintained, mai modificato a mano dall'utente
│   ├── README.md        # entry point + synthesis
│   ├── index.md         # catalogo content-oriented
│   ├── log.md           # ledger cronologico (## [YYYY-MM-DD] action | title)
│   ├── open-questions.md
│   ├── architecture/
│   ├── entities/        # paper, modelli, framework, persone
│   ├── concepts/        # tecniche, idee, principi, trade-off
│   └── decisions/       # ADR datati (2026-MM-DD-slug.md)
└── graphify-out/        # knowledge graph artifacts (graph.html, graph.json, GRAPH_REPORT.md)
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

- **Path relativi alla root del repo**, sempre. Mai assoluti, mai username/home dir (`D:\Users\frhae\...`, `C:\Users\...`, `/home/<user>/...`). Un path relativo è già di per sé root- e device-agnostic e **risolvibile dai tool** (graph viewer, GitHub, Obsidian) — niente token/placeholder custom (`<repo-root>/`, `$ROOT/`…): romperebbero la risoluzione automatica.
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
7. **Artifact graphify OS-agnostic**: path repo-relative + forward slash, mai assoluti/backslash/username, niente token custom. Push solo `graph.json`+`graph.html`+`GRAPH_REPORT.md`, escludi `manifest.json` (vedi Fase 5 → Portabilità).
8. **Optimization-first** (utente 2026-06-27, "ricordatelo sempre"): batch le operazioni ripetute (analisi unica, non N volte), **ottimizza proattivamente il contesto** (riorganizza task-list/note/regole, chiudi ciò che non serve), NON over-cautela su cose a basso valore. Vale per il modello in progettazione E per il mio modo di lavorare. Vedi memory `feedback_optimization_first`.
9. **Cattura idee + low-confidence→gather**: cattura SUBITO ogni idea utente in modo durevole (anti-loss; idee grezze non-pubblicabili → `wiki/_private/` gitignored). Quando poco confident: fermati, riorganizza, fai gathering (grep/file-search/web) prima di procedere.
10. **Catene di pensiero = priorità #1** (utente 2026-06-27, enfatico — "ricorda SEMPRE", "sempre e subito"): davanti a ogni idea/decisione/skill estrai SUBITO la catena **why → problema → soluzione** (non solo la conclusione/regola). Documentala nei concept wiki **E** aggiungila come **componente obbligatoria** ai **gold template** di training (è l'OUTPUT TARGET che vogliamo il modello internalizzi; una catena esplicita è anti-shortcut e più difficile da reward-hackare di una conclusione nuda). Vedi memory `feedback_chain_of_thought_extraction`.

---

*Generato da Cowork / Claude Dispatch — Aprile 2026 — Aggiornato 2026-05-21 con Wiki Schema*
