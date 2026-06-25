---
name: user-notes-2026-06-23
description: Cattura + organizzazione di 9 appunti utente inviati via Telegram il 2026-06-23. Stato provisional, in attesa di analisi congiunta su quali "portare dentro" come concept validati.
type: inbox
tags: [user-notes, inbox, provisional, training, wrapper, metacognition, steering-vectors]
last_updated: 2026-06-23
status: provisional — da analizzare con utente prima di graduare a concept page
---

# User Notes — 2026-06-23 (batch Telegram)

> **Workflow richiesto dall'utente**: "salvali, organizzali, se non ti è chiaro qualcosa chiedi. poi analizziamoli e capiamo se ha senso portarli e cosa".
>
> **Stato di questo file**: cattura raw + organizzazione + assessment preliminare. **Nessun appunto è ancora stato graduato a concept page validato.** Le pagine `concepts/*.md` definitive vanno create solo dopo l'analisi congiunta (decidere quali "portare dentro").

Tutti gli appunti sono riportati **verbatim** (testo originale utente) + interpretazione `[INFERRED]` + mapping a pagine esistenti + assessment + flag `❓DA CHIARIRE` dove l'intento non è univoco.

---

## Tema 1 — Metacognizione & auto-gestione del contesto

Il modello impara a **riconoscere il proprio stato degradato** e ad agire di conseguenza (pulire/comprimere il contesto da solo). È un filone nuovo e forte: sposta il context-management da responsabilità del wrapper a **skill appresa dal modello**.

### Nota 4 — Self-awareness del degrado operativo
> **Verbatim**: "#Ai creare dei train set in cui si addestra il modello a capire quando non è più in grado di operare in maniera efficiente una volta che capisce questo in modo autonomo poi procederà con la parte di sistemazione del contesto eccetera"

- `[INFERRED]` Training regime per **metacognizione**: il modello deve imparare a segnalare "non sto più operando efficacemente" (contesto troppo lungo/sporco/confuso, loop, perdita del filo) → trigger autonomo di rimedio.
- **Mapping**: estende [[contradiction-detection-layer]] (ma lì il detector è esterno/wrapper-side; qui è skill interna del modello) e si collega a [[structured-thinking]] (marker `[?]`).
- **Assessment**: 🟢 forte e originale. Differenza chiave vs letteratura: non "context compression" automatica del wrapper, ma **il modello che decide quando serve**. Candidato concept page nuovo: `metacognitive-degradation-awareness`.
- **Rischio/da verificare**: come generi le label di "degrado" nel dataset? Serve un segnale ground-truth (es. drop di accuracy oltre soglia X di token, o trajectory annotate). Da definire in analisi.

### Nota 5 — Autocompact / context edit guidato dal modello
> **Verbatim**: "autocompact/context edit -> da parte dell'llm"

- `[INFERRED]` Il modello stesso emette un'azione di **compattazione/editing del proprio contesto** (es. tool `compact_context` / `edit_context`), invece di subirlo dall'esterno. Coppia naturale con Nota 4 (4 = quando; 5 = come).
- **Mapping**: estende [[task-decomposition-adhoc-context]] (context ad-hoc) e [[agent-wrapper-vars-queue]] (D — il wrapper espone l'API che il modello chiama).
- **Assessment**: 🟢 implementabile come **tool callable** nel wrapper + training su quando invocarlo. Allineato all'idea organization-first (gestire orizzonti lunghi). Candidato: stessa concept page di Nota 4, sezione "azione di rimedio".
- ❓**DA CHIARIRE**: il `context edit` è (a) il modello che riscrive/riassume il proprio context window, oppure (b) il modello che istruisce il wrapper su *cosa* tenere/buttare via lasciando a lui l'esecuzione? Cambia il design.
- **✅ Risoluzione utente 2026-06-23**: il contesto è **generato dinamicamente ogni turno** dal wrapper attingendo a lane strutturate (regole, ultimi N messaggi, sezione dati sensibili, note/scelte del blocco corrente, queue summary blocchi precedenti, queue verifiche, task list del blocco). Più vicino a (b) wrapper-managed + assemblaggio dinamico guidato dall'interazione dell'LM. Utente vuole vedere un esempio → [[wrapper-context-assembly-example]].

---

## Tema 2 — Awareness esplicita nel prompt di training

### Nota 3 — Dichiarare al modello che sta venendo addestrato + che i nomi random sono anti-pattern
> **Verbatim**: "Dare awareness nei prompt. Stai venendo addestrato a programmare. L'obbiettivo è completare lo script. Nota, le variabili sono nomi casuali, devi essere bravo a non sbagliarle. Questo è un anti design pattern, va bene per il training ma per l'operatività. Per l'operatività usare le best practices, es dare nomi auto esplicativi."

- `[INFERRED]` Aggiungere nel prompt di training una **meta-istruzione di consapevolezza**: "stai imparando a programmare; in questi esempi le variabili hanno nomi casuali *apposta* per allenare la copia chirurgica; **è un anti-pattern valido solo per il training**; in operatività usa best practice (nomi auto-esplicativi)".
- **Mapping**: completa direttamente [[runtime-symbol-randomization-training]] e [[pretrained-name-bias-mitigation]]. Risolve un **rischio reale** già sul tavolo: che il modello impari a *produrre* nomi casuali in produzione.
- **Assessment**: 🟢 importante e a costo quasi zero (è prompt engineering del dataset). Separazione netta regime-training vs regime-operativo. Da integrare come sezione "awareness prompt" nelle due pagine sopra.
- **Nota di metodo**: collegare alla filosofia [[scuola-learning-philosophy]] ("a scuola fai esercizi artificiali che non rifaresti mai così nella vita reale").

---

## Tema 3 — Lookahead & valutazione di scelte e azioni

Due appunti distinti ma fortemente coerenti: insegnare al modello a **valutare la qualità di sequenze d'azione** (a posteriori) e a **simulare le conseguenze di un bivio** (a priori). Entrambi centrali per l'idea organization-first (catturare criticità implicite, pianificare a orizzonti lunghi).

### Nota 9 — Lookahead ai bivi (simulazione A/B + decidi se procedere/migliorare/chiedere)
> **Verbatim**: "Previsione sul futuro delle scelte quando ti trovi a un bivio — cosa accadrebbe se scegliessi a? — cosa b? — quale conseguenza è più affine a quello che l'utente vorrebbe? Tradeoff? Migliorabile? Conviene trovare strada migliore oppure chiedere all'utente (dopo averlo informato con contesto e le diverse strade possibili compreso strada attuale, miglioramento possibile, effort, ecc)?"

- `[INFERRED]` Training su **branch-simulation**: davanti a un bivio, il modello genera esiti ipotetici di A e B, li valuta su "affinità all'intento utente / tradeoff / migliorabilità", e decide tra: procedere, cercare strada migliore, o **chiedere all'utente fornendo contesto strutturato** (strada attuale + alternative + effort).
- **Mapping**: estende [[pre-flight-safety-checks]] (verifica pre-azione) e [[structured-thinking]]; è il cuore comportamentale dell'organization-first ([[../architecture/orchestrator-layer]] — "safety reasoning" + "planning").
- **Assessment**: 🟢🟢 fortissimo, è quasi una *signature capability* del progetto. Candidato concept page nuovo: `decision-point-lookahead`. Collega a rStar-Math ([[../entities/rstar-math-paper]], MCTS lookahead) e PRM ([[../entities/prm-paper]], valuta step intermedi).
- **Da verificare**: il "chiedi all'utente con contesto" va formalizzato come **output template** (strada attuale / alternative / effort / raccomandazione) — riusabile sia in training che nel wrapper.

### Nota 6b — Critica di sequenze d'azione (trajectory quality)
> **Verbatim** (seconda metà nota 6): "Migliorare la awarness delle azioni mettendoli davanti degli schemi e lui deve indovinare cosa succede nel senso diamo un esempio di sequenze di azioni e lui deve capire e valutare quanto hanno senso se ci sono ad esempio ripetizioni se non non serviva a chiamare da volte quel tool o se c'era una scelta migliore eccetera."

- `[INFERRED]` Training task: dato uno **schema/log di sequenza d'azioni** (tool call), il modello deve (a) predire cosa succede e (b) **valutarne la qualità** — rilevare ripetizioni inutili, chiamate ridondanti dello stesso tool, alternative migliori.
- **Mapping**: complementare a Nota 9 (9 = a priori, 6b = a posteriori). Si collega a [[post-rl-path-optimization]] (path efficienti) e [[error-memo-system]] (lessons learned dagli errori).
- **Assessment**: 🟢 forte per l'agentic behavior. Genera dataset di "trajectory critique" (buona/cattiva + perché). Candidato: stessa concept page di Nota 9 oppure `action-trajectory-critique` separata.
- **Sinergia**: i giudizi di 6b possono alimentare i memo di [[error-memo-system]] e i reward di un eventuale PRM.

---

## Tema 4 — Training objective su proprietà dell'output (lunghezza, char-level)

### Nota 6a — Training su #token e #char dell'output, loss differenziate per feature
> **Verbatim** (prima metà nota 6): "Ai Training set addestramento anche su num token e num chars dell'output. Funzioni di loss e di apprendimento differenti per colonna/feature da apprendere?"

- `[INFERRED]` Aggiungere **target ausiliari** (numero di token e di char dell'output) e valutare **loss diverse per feature/colonna** (multi-objective: la testa che predice la lunghezza ha una loss diversa da quella next-token).
- **Mapping**: estende direttamente [[multi-token-prediction-training]] (già prevede heads multiple: next, +2, +3, sketch, state). Aggiunge heads "length-aware".
- **Assessment**: 🟡 plausibile ma da scopare con cura. Predire/controllare la lunghezza è utile (output budgeting), ma "loss diverse per colonna" aumenta la complessità del training. Da valutare se vale per MVP o se è Wave avanzata.
- ❓**DA CHIARIRE**: l'obiettivo è (a) far **controllare** al modello la lunghezza dell'output ("rispondi in ≤N token"), oppure (b) migliorare il **conteggio** char/token (collegato a Nota 7)? Sono due cose diverse.
- **✅ Risoluzione utente 2026-06-23**: **entrambi**. La feature di length-prediction serve a far capire al modello quanto deve essere lunga la risposta/pensiero → meccanismo per il **thinking adattivo** (lega a Fase 2 di [[scientific-method-operating-protocol]] e alle note metacognizione 4+5).

### Nota 7 — Esercizi token=char (1:1) per il char-counting
> **Verbatim**: "Dlm non riescono a contare i Chars probabilmente perché usando token i token non sono altro che sillabe quindi l'insieme di più Chars (potenzialmente) quindi per questo potrebbe avere problemi. Potremmo creare degli esercizi in cui forziamo l'lm a rispondere con token uguale a char (1:1) solamente per i casi necessari? Questo aiuterebbe? Creerebbe nuove skills?"

- `[INFERRED]` Diagnosi utente (corretta): il BPE raggruppa più char per token → il modello "non vede" i singoli char → fallisce su conteggi/manipolazioni a livello carattere. Proposta: esercizi che **forzano output char-separati (1:1 token↔char)** nei casi che lo richiedono.
- **Mapping**: nuovo, si collega a Nota 6a (proprietà numeriche dell'output) e alla critica chirurgica di [[runtime-symbol-randomization-training]] (precisione sui simboli).
- **Assessment**: 🟡 idea valida e con base reale in letteratura (il problema "quante r in strawberry", character-level tasks). Tecnica nota: spaziare i caratteri (`s t r a w b e r r y`) costringe il tokenizer a token mono-char. **Non possiamo cambiare il tokenizer**, ma possiamo addestrare su formati char-spaced quando serve precisione.
- **Risposta alle domande utente**: "Aiuterebbe?" → sì per task char-level specifici. "Creerebbe nuove skill?" → più che skill nuova, sblocca una capability latente; va attivata via formato di output (char-spacing) + training mirato. Candidato concept page: `char-level-precision-training`.

---

## Tema 5 — Context structuring: tag di tipologia + sezioni segrete

### Nota 2 — Tag di tipologia sui riassunti dei task esterni
> **Verbatim**: "Per ogni riassunto dell'outer task più generico del task corrente, oltre al riassunto mettere anche dei tag sulla tipologia del task quindi di cosa riguarda se ad esempio è coding se finanza ecc"

- `[INFERRED]` Nella gerarchia di task (sub-task → outer task), ogni **riassunto del task esterno** porta, oltre al testo, **tag di dominio** (coding, finanza, ...). Dà al modello consapevolezza del contesto gerarchico e del dominio.
- **Mapping**: estende [[task-decomposition-adhoc-context]] (gerarchia plan→step) e [[structured-context-sections]] (metadata di sezione). **Collegamento chiave**: i tag di dominio alimentano la [[../architecture/three-tier-design|routing strategy]] (classifier che sceglie quale LoRA verticale caricare → vedi memory `project_routing_strategy`).
- **Assessment**: 🟢 a basso costo e ad alto valore: i tag servono *due* scopi — (1) attention/awareness gerarchica, (2) **segnale di routing** per il hot-swap LoRA. Da integrare in B (context engineering) + collegare al routing.
- **Idea derivata**: i tag possono essere **multi-label/composti** (es. "coding+finance" per un task fintech) — già coerente con la richiesta utente passata di classificazione di "argomenti composti".

### Nota 8 — Sezione "secret": dati privati che il modello non deve far uscire
> **Verbatim**: "split info into section -> secret section, dati che non devono essere condivisi con l'esterno perchè privati es: carta di credito, llm non può e non deve farla uscire."

- `[INFERRED]` Strutturare il contesto in sezioni con un livello **`<secret>`**: dati sensibili (es. carta di credito) che il modello può usare internamente ma **non deve mai emettere verso l'esterno** (output, tool call, log).
- **Mapping**: estende [[structured-context-sections]] (nuovo tipo di sezione) e [[untrusted-content-delimiting]] (qui il problema è duale: non *injection in entrata* ma **exfiltration in uscita**).
- **Assessment**: 🟢 importante per wrapper sicuro + è un **training regime** (data-exfiltration refusal: esempi dove il modello deve rifiutarsi di rivelare la secret section anche sotto pressione/prompt injection). Collega a [[out-of-domain-refusal-training]] (stessa famiglia: addestrare il "no").
- **Da verificare**: enforcement a due livelli — (1) modello addestrato a non emettere; (2) **guardrail deterministico nel wrapper** (regex/scanner sull'output) come rete di sicurezza, perché il solo training non è garanzia. Candidato concept page: `secret-section-exfiltration-defense`.
- **✅ Approccio utente 2026-06-23**: enforcement anti-exfiltration in **post-training con RL adversariale** — istruzioni specifiche che *tentano* di far uscire i dati della sezione protetta + **reward negativo** se il modello cede (red-team training). Combinato col guardrail deterministico wrapper-side. Pattern noto: adversarial/red-team RLHF.

---

## Tema 6 — Tecnica di controllo: steering vectors

### Nota 1 — Steering vector per ottimizzare path e reasoning
> **Verbatim**: "Steering vector optimization path and reasoning"

- `[INFERRED]` Uso di **steering vectors** (activation steering / representation engineering): vettori aggiunti alle attivazioni a inference-time per orientare il comportamento — qui per **guidare/ottimizzare il path di reasoning** del modello.
- **Mapping**: nuovo filone, **ortogonale a LoRA**. Possibile alternativa/complemento leggero alla three-tier ([[../architecture/three-tier-design]]): invece di (o oltre a) caricare un LoRA, applicare uno steering vector per modulare lo stile di reasoning. Si collega a [[post-rl-path-optimization]] e [[structured-thinking]].
- **Assessment**: 🟡 promettente ma **il più ambiguo del batch** (appunto telegrafico). Gli steering vector sono economici (no training di pesi, si estraggono da contrasti di attivazioni) e hot-swappabili come i LoRA → interessante per il progetto. Ma serve capire cosa intendi esattamente.
- ❓**DA CHIARIRE (priorità alta)**: intendi (a) usare steering vectors **a inference** per modulare il reasoning (alternativa/aggiunta leggera ai LoRA), (b) **ottimizzare il path** *di estrazione* degli steering vectors durante il training, o (c) altro? È la domanda #1 da risolvere.
- **✅ Risoluzione utente 2026-06-23**: "esplodiamo il concetto, analizziamo tutte le aree di applicazione, capiamo le più promettenti" → creato concept page dedicato [[steering-vectors]] (esplorazione completa).

---

## Riepilogo: mapping → categorie esistenti & azioni candidate

| # | Appunto | Tema | Estende / Nuovo | Valore | Stato |
|---|---------|------|-----------------|--------|-------|
| 1 | Steering vectors | Control | **Nuovo** (ortogonale a LoRA) | 🟡 | ❓ chiarire intento |
| 2 | Tag tipologia outer-task | B + routing | Estende task-decomposition + routing | 🟢 | pronto |
| 3 | Awareness "anti-pattern" nomi random | E (training) | Estende symbol-randomization + name-bias | 🟢 | pronto, costo ~0 |
| 4 | Self-awareness degrado | A/C metacog | **Nuovo** `metacognitive-degradation-awareness` | 🟢 | pronto |
| 5 | Autocompact by LLM | A/D metacog | Stessa pagina di #4 (azione di rimedio) | 🟢 | ❓ (a) self-rewrite vs (b) istruisce wrapper |
| 6a | Loss per #token/#char | A training | Estende multi-token-prediction | 🟡 | ❓ controllo vs conteggio |
| 6b | Critica trajectory | A/agentic | **Nuovo** `action-trajectory-critique` | 🟢 | pronto |
| 7 | Esercizi token=char 1:1 | training | **Nuovo** `char-level-precision-training` | 🟡 | pronto (scoping) |
| 8 | Secret section | B + security | **Nuovo** `secret-section-exfiltration-defense` | 🟢 | pronto (serve guardrail wrapper) |
| 9 | Lookahead ai bivi | A/agentic | **Nuovo** `decision-point-lookahead` | 🟢🟢 | pronto, signature capability |

**Sinergie cross-nota rilevate**:
- **4+5** = metacognizione (quando + come gestire il proprio contesto).
- **9+6b** = valutazione scelte/azioni (a priori + a posteriori).
- **2** alimenta sia context-awareness sia **routing LoRA** (doppio uso).
- **6a+7** = proprietà numeriche/char-level dell'output.
- **3** chiude un rischio aperto di [[runtime-symbol-randomization-training]].
- **8** è il duale "in uscita" di [[untrusted-content-delimiting]] (in entrata).

**Domande aperte per l'analisi congiunta** (`❓`):
1. **Nota 1**: cosa intendi esattamente con steering vector "optimization path and reasoning"? (priorità alta — il più ambiguo)
2. **Nota 5**: il context-edit è self-rewrite del modello o istruzione al wrapper?
3. **Nota 6a**: obiettivo = controllo della lunghezza output o miglioramento del conteggio char/token?

---

## Next (dopo analisi con utente)
- Decidere quali appunti graduano a concept page validata (e quali restano provisional o si fondono in pagine esistenti).
- Aggiornare le pagine esistenti impattate (3→symbol-randomization+name-bias; 2→task-decomposition+routing; 8→structured-context-sections+untrusted; 6a→multi-token-prediction).
- Valutare impatto su `decisions/` (steering vectors potrebbe meritare un ADR "alternative considerate" se diventa rilevante per la three-tier).
- `/graphify --update` per integrare nel knowledge graph.

## Sources
- User notes 2026-06-23, batch di 9 messaggi Telegram.
