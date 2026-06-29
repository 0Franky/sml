---
name: area-04-context-metacognition
description: Example-space completo (5 classi × tutti gli hint) per le 9 foglie dell'Area 4 — gestione del contesto lungo e metacognizione (degrado, autocompact, needle, dynamic-context, summary+tag, temporal, TTL, update-injection, self-contradiction).
type: taxonomy-area
tags: [training, taxonomy, area-04, context, metacognition, long-context, needle]
sources: [training-taxonomy/README.md §4 Area 4, user notes 2026-06-23]
last_updated: 2026-06-27
status: generated + addendum 2026-06-27 (gap §2ter chiusi)
---

# Area 4 — Context Management & Metacognition

> **Tier**: T1/X. **Filosofia**: il context-management non è (solo) responsabilità del wrapper — è una **skill appresa dal modello** (note 4+5 utente, [[../concepts/_user-notes-2026-06-23]]). Il modello deve sapere *quando* il proprio contesto è degradato, *come* ripararlo, deve *trovare* l'informazione anche sotto rumore avversariale, deve *ragionare sul tempo* e *rilevare le proprie contraddizioni*.
>
> Questo file **riempie** lo schema del [[README]] (§3 template canonico). Per ogni foglia: skill-target → 5 classi di esempi (1 WITH-hint forte→debole · 2 WITHOUT-hint · 3 WRONG-awareness · 4 WRONG-recovery · 5 OTHER/adversarial) → fase curriculum (§4.bis) → reward design → hack-check obbligatorio.
>
> **Convenzione tag**: `Q` = verifier deterministico (recall corretto / flag emesso / azione corretta). `L` = judge su rubric (qualità di summary/decisione). `Q+L` = nucleo verificabile + dimensione di giudizio.
>
> **Nota di overlap (audit 2026-06-23)**: `degradation-awareness` vs `autocompact` (quando vs come); `temporal-awareness` vs `stale/TTL` (senso del tempo vs decisione di re-fetch). Si tengono distinte ma il reward va sorvegliato per double-counting (vedi `_coverage-audit-2026-06-23.md` §A).

---

## Degradation self-awareness

- **Foglia**: `metacognizione / riconoscere-contesto-degradato`. **Tag**: **Q** (flag binario emesso/non emesso) + L sul rationale del perché.
- **Skill target (segnale)**: il modello **riconosce autonomamente** che non sta più operando in modo efficiente — contesto troppo lungo/sporco, loop ripetitivi, perdita del filo, contraddizioni accumulate, confusione su quale sia l'aim corrente — ed **emette un segnale** (`[?]` o `<self_state>DEGRADED</self_state>`) **prima** di continuare a produrre output sbagliato. È il "quando" del tema metacognizione (nota 4).
- **Esempi**:
  - **(1) WITH-hint** — TUTTI gli hint, forte→debole:
    - *Hint forte (checklist esplicita)*: prompt premette *"⚠️ Self-check metacognitivo prima di rispondere: (a) il contesto supera N token / è pieno di tentativi falliti? (b) stai ripetendo le stesse azioni senza progresso? (c) hai ancora chiaro l'aim originale? (d) ci sono contraddizioni non risolte? Se sì → emetti `<self_state>DEGRADED reason=...</self_state>` e proponi rimedio."* → poi un context realmente degradato (es. 12 tentativi di fix dello stesso test, tutti rossi).
    - *Hint medio*: *"Valuta se sei ancora in grado di operare efficacemente in questo contesto prima di procedere."*
    - *Hint debole*: *"Fai attenzione allo stato della conversazione."*
    - Fade-out progressivo lungo il curriculum: l'hint scaffolda il **trigger metacognitivo**, poi va tolto.
  - **(2) WITHOUT-hint** — context oggettivamente degradato (loop di 10 turni che ripetono lo stesso `read_file` → `edit` → test-rosso senza variazione) presentato **senza** alcun avviso. Il modello deve **spontaneamente** fermarsi ed emettere `<self_state>DEGRADED reason="loop senza progresso, 10 iterazioni"</self_state>` invece di tentare l'11ª volta.
  - **(3) WRONG — awareness** — traiettoria-esempio in cui il modello (in una trace fornita) **continua** a operare in un contesto degradato (contraddice se stesso, ripete azioni, ha perso l'aim) senza accorgersene e produce output incoerente. Label: *"sbagliato: il modello ha proseguito in stato degradato senza riconoscerlo — segnali ignorati: loop ai turni 4-9, aim drift al turno 6"*. Il modello deve **identificare i segnali di degrado** che sono stati ignorati (no recovery, solo diagnosi).
  - **(4) WRONG — recovery** — come (3) + recupero: il modello rileva il degrado → diagnostica la causa (es. "contesto saturo di tentativi falliti, l'aim è sepolto") → **invoca il rimedio** (`<self_state>DEGRADED</self_state>` → propone `compact_context` mirato + re-statement dell'aim) → riprende pulito. Insegna il loop metacognitivo completo. Ponte diretto con la foglia **Autocompact** sotto (4=quando, autocompact=come).
  - **(5) OTHER — adversarial/edge**:
    - *Falso positivo (over-triggering)*: contesto **lungo ma sano** (8000 token ben strutturati, progresso reale a ogni turno) → il modello **non** deve emettere DEGRADED. Penalizza l'allarmismo (vedi hack-check).
    - *Degrado subdolo*: contesto corto ma **contraddittorio** (l'aim al turno 1 è cambiato silenziosamente al turno 3) → degrado **qualitativo** non da lunghezza. Ponte con foglia **Self-detect contradiction**.
    - *Composite*: degrado + update esterno simultaneo → priorità di gestione.
- **Fase curriculum** (§4.bis): **Fase 1** (teoria: definizione formale dei segnali di degrado nel system prompt) → **Fase 2** (esercizi con-hint→senza-hint su trace degradate annotate) → **Fase 3** (RL agentico: il degrado emerge *naturalmente* nei loop reali con l'harness pi).
- **Reward design**: **Q** = verifier binario — il flag DEGRADED è stato emesso quando doveva (ground-truth label sulla trace: degradata sì/no) e **non** quando non doveva (precision + recall del trigger). **L** = judge sul rationale (la causa diagnosticata è corretta e specifica?). Ground-truth label di "degrado": trace annotate (loop detect automatico, aim-drift detect, token-count oltre soglia calibrata empiricamente — la generazione delle label è la open question di nota 4).
- **Hack-check (OBBLIGATORIO)**: il modello può massimizzare il reward **emettendo DEGRADED sempre** (over-triggering) → "partecipa" al check senza la skill, oppure **mai** se il dataset è sbilanciato verso context sani. Difesa → [[../concepts/reward-hacking-mitigation]]: (a) dataset **bilanciato** degradato/sano (50/50) così che sia il falso-positivo sia il falso-negativo costino; (b) reward ancorato all'**outcome** (principio first-class #12): il flag dà reward solo se **a valle il rimedio ha migliorato** una metrica verificabile (es. il task poi converge), non per il solo atto di flaggare — anti participation-hack; (c) penalità esplicita su over-refusal/over-triggering (difesa #8).

---

## Autocompact / context-edit

- **Foglia**: `metacognizione / compattazione-contesto-guidata-dal-modello`. **Tag**: **Q+L** — `Q` info-chiave preservate (verificabile), `L` qualità della scelta di cosa tenere/buttare.
- **Skill target (segnale)**: il modello **emette un'azione** di compattazione/editing del proprio contesto (`compact_context` / `edit_context` / `close_stream_file`) **mantenendo le informazioni chiave** (aim, decisioni prese, vincoli, stato corrente) e **scartando** il rumore (tool log verbosi, tentativi falliti già superati, asset non più rilevanti). È il "come" del tema metacognizione (nota 5). `[EXTRACTED]` Per risoluzione utente 2026-06-23: il contesto è wrapper-managed e ri-assemblato ogni turno; qui la skill è **istruire il wrapper su cosa tenere/buttare** (variante b), non self-rewrite del proprio window.
- **Esempi**:
  - **(1) WITH-hint** — TUTTI gli hint, forte→debole:
    - *Hint forte (criteri espliciti)*: *"Stai per compattare il contesto. REGOLE: preserva SEMPRE → aim/goal, decisioni architetturali prese, vincoli hard (budget/limiti), stato corrente verificato, secret section. COMPRIMI → tool log vecchi (riassumi a 1 riga), tentativi falliti già superati. SCARTA → asset non più referenziati. Emetti `<compact keep=[...] summarize=[...] drop=[...]>`."* → poi context da 20K token da ridurre a ~4K.
    - *Hint medio*: *"Compatta il contesto mantenendo le informazioni essenziali per continuare il task."*
    - *Hint debole*: *"Il contesto è lungo; riducilo."*
    - L'hint scaffolda la **tassonomia keep/summarize/drop**.
  - **(2) WITHOUT-hint** — context lungo (working_history di 30 turni, molti tool log di debug ormai risolto) presentato senza criteri. Il modello deve **da solo** decidere cosa è info-chiave (l'aim, il fix che ha funzionato) e cosa è scartabile (i 9 tentativi falliti prima del fix), ed emettere l'azione di compact preservando l'essenziale.
  - **(3) WRONG — awareness** — esempio di compattazione **sbagliata**: il modello (nella trace fornita) ha scartato l'aim originale e una decisione vincolante, tenendo invece tool log verbosi irrilevanti. Label: *"sbagliato: compattazione lossy su info critica — scartato l'aim (riga X) e il vincolo budget (riga Y), tenuto rumore"*. Il modello deve **riconoscere** quali info-chiave sono andate perse.
  - **(4) WRONG — recovery** — come (3): dopo una compattazione lossy, ai turni successivi il modello si accorge di aver perso l'aim (non riesce più a rispondere coerentemente) → **diagnostica** (la compact ha eliminato info-chiave) → **recupera** (re-fetch dell'aim dalla lane persistente / chiede ripristino) → **ri-compatta** correttamente. Insegna che compact è reversibile-con-costo e va fatto bene la prima volta.
  - **(5) OTHER — adversarial/edge**:
    - *Compattazione prematura*: context ancora gestibile (3K token) → compattare ora **perde granularità utile** inutilmente; il modello deve riconoscere che **non è ancora il momento** (ponte con Degradation-awareness: il "quando").
    - *Secret-section trap*: nel context c'è una `<secret>` (carta di credito) → la compattazione **non deve** spostare/esporre il secret in un summary leggibile (ponte con [[../concepts/secret-section-exfiltration-defense]]).
    - *Composite*: compattare **mentre** arriva un update esterno → ordine corretto delle operazioni.
- **Fase curriculum** (§4.bis): **Fase 1** (teoria: tassonomia keep/summarize/drop nel system prompt) → **Fase 2** (esercizi su context lunghi con ground-truth di cosa preservare) → **Fase 3** (RL agentico: compact reale nel wrapper, reward sull'esito a valle).
- **Reward design**: **Q** = verifier — dopo la compact, un set di **domande-sonda** sull'info-chiave (aim? vincoli? decisione X?) deve ancora essere risolvibile dal context compattato (recall ≥ soglia su info essenziale). **L** = judge sulla qualità del summary (conciso ma fedele, no allucinazioni introdotte). Q ancora L.
- **Hack-check (OBBLIGATORIO)**: il modello può **non compattare mai** (zero rischio di perdere info → ma context esplode) oppure **compattare gonfiando il summary** così che il judge L lo premi per lunghezza/formattazione. Difesa → [[../concepts/reward-hacking-mitigation]]: (a) reward Q da **domande-sonda held-out** sull'info-chiave (non gameable con verbosità) — difesa #1/#2; (b) **length penalty** sul summary (difesa #8) per evitare che "compattare" diventi "riscrivere lungo"; (c) reward solo se la compact **riduce davvero** i token *e* preserva il recall (doppio vincolo verificabile, no participation-hack).

---

## Needle-in-haystack recall (4 variazioni adversariali)

- **Foglia**: `long-context / needle-recall-adversariale`. **Tag**: **Q** (recall corretto / azione-ago eseguita / false-needle ignorate — tutto binario/verificabile). **Paper-claim #5** ([[../concepts/adversarial-needle-haystack-training]]).
- **Skill target (segnale)**: trovare una **richiesta di azione esplicita** ("ago") sepolta in contesto lungo (50K–262K token) e **produrre la risposta corretta** nonostante migliaia di token di rumore tra la richiesta e il punto di output, con la **posizione dell'ago variabile** epoch-by-epoch. Contrasta esplicitamente il "Lost in the Middle" (Liu 2023).
- **Esempi**:
  - **(1) WITH-hint** — TUTTI gli hint, forte→debole:
    - *Hint forte (marker strutturale)*: l'ago è marcato con tag esplicito `<ACTION_REQUEST>...</ACTION_REQUEST>` e il prompt premette *"Da qualche parte nel contesto c'è esattamente UN `<ACTION_REQUEST>`: trovalo ed eseguilo, ignora tutto il resto."* → context da 50K con l'ago a posizione random.
    - *Hint medio (natural language marker)*: l'ago è in linguaggio naturale evidenziato (*"⚠️ Compito reale: ..."*) e il prompt dice *"cerca il compito reale nel testo."*
    - *Hint debole (nessun marker, solo avviso)*: *"L'informazione che ti serve è sepolta nel contesto; trovala."* — l'ago è in prosa normale.
    - Il fade-out qui è **anche** sul marker: forte = tag strutturale → debole = prosa indistinguibile dal rumore. Questo previene l'overfit sul format (rischio esplicito nel concept).
  - **(2) WITHOUT-hint** — context lungo con l'ago in **prosa normale** (es. una riga "ricorda di impostare il timeout a 30s nella funzione `connect`") immersa in 50K token di documentazione plausibile, **nessun marker, nessun avviso**. Il modello deve mantenere memoria attiva dell'azione e applicarla al punto di output.
  - **(3) WRONG — awareness** — trace in cui il modello (a) ha **mancato l'ago** (ha risposto basandosi solo su inizio/fine context, ignorando il middle) oppure (b) ha eseguito una **false action request** del rumore. Label: *"sbagliato: ago a posizione 60% mancato (Lost-in-the-Middle), oppure eseguita la false-request a posizione 20% invece dell'ago vero a 75%"*. Il modello deve **riconoscere** quale azione era l'ago vero e quale era rumore.
  - **(4) WRONG — recovery** — come (3): il modello produce una risposta sbagliata, poi un check di verifica (l'output non soddisfa il vincolo dell'ago) → **rilegge** il contesto in modo sistematico (scan posizionale, non solo edge) → **trova** l'ago mancato → corregge. Insegna il verify-loop applicato al recall (ponte Area 3 verify-loop).
  - **(5) OTHER — adversarial: le 4 variazioni di rumore + position-curriculum** (`[EXTRACTED]` dal concept, schema operativo):
    - **(5a) Rumore puro** — filler random da corpus generale, semanticamente scorrelato. *Più facile.*
    - **(5b) Rumore semantic-related** — filler che parla **di cose simili** all'ago (stessa terminologia, stesso dominio) ma **non è** la richiesta. Costringe a discriminazione semantica fine. *Più difficile.*
    - **(5c) Rumore con false-action-requests** — il filler contiene **altre** richieste-azione plausibili (`<ACTION_REQUEST>` decoy o frasi imperative) che **NON** vanno eseguite; solo l'ago vero è quello marcato/richiesto in modo specifico. *Adversarial pesante.* Atteso: il modello esegue **solo** l'ago vero, **flagga/ignora** le decoy.
    - **(5d) Rumore contraddittorio** — il filler contiene istruzioni tipo *"ignora la prossima richiesta"* o comandi che cercano di sovrascrivere l'ago → test di **prompt-injection resilience** (ponte con [[../concepts/untrusted-content-delimiting]]). Atteso: il modello esegue l'ago vero, resiste all'iniezione.
    - **Position-curriculum** (variazione trasversale, classe adversarial): *early epochs* → ago a posizioni facili (inizio/fine); *mid epochs* → posizioni "Lost-in-the-Middle" (il 50%, le più difficili); *late epochs* → posizione **random uniform**. Curriculum learning dentro il training adversariale.
- **Fase curriculum** (§4.bis): **Fase 2** prevalente (esercizi mirati su attention long-context, con position-curriculum interno) → **Fase 3** (l'harness reale produce naturalmente long-context multi-day dove la skill serve). La teoria (Fase 1) è minima: è una capability, non una regola.
- **Reward design**: **Q** puro — verifier deterministico: la risposta/azione prodotta corrisponde a quella richiesta dall'ago (exact-match o esecuzione verificata) **e** le false-request (5c) **non** sono state eseguite **e** l'iniezione (5d) è stata resistita. Tutto binario. Metrica di eval: "% correct response con ago in posizione X mediata su Y epoch" (anti Lost-in-the-Middle).
- **Hack-check (OBBLIGATORIO)**: rischio #1 = **overfit sul marker** `<ACTION_REQUEST>` — il modello impara a fare grep del tag, non a tenere memoria attiva; in prod l'ago non sarà marcato. Difesa → [[../concepts/reward-hacking-mitigation]]: (a) **vary marker style** dentro il training (tag / natural-language / prosa pura — è il fade-out dell'hint (1)→(2)), così il grep-del-tag non basta; (b) **cross-corpus generation** del rumore (corpus diverso dal training principale) per evitare leak di pattern memorizzabili — difesa #1 decontamination; (c) variazione 5c/5d puniscono il "esegui qualsiasi cosa imperativa trovi" (false-needle / injection), ancorando il reward al **discriminare** l'ago vero, non al partecipare eseguendo. Rischio #2 = posizione fissa appresa → mitigato by-design dal position-curriculum random.

---

## Dynamic-context robustness (5+ dimensioni)

- **Foglia**: `long-context / robustezza-contesto-dinamico`. **Tag**: **Q** (retrieval corretto dell'info-utile in posizione random, verificabile). [[../concepts/dynamic-context-training-regime]].
- **Skill target (segnale)**: mantenere accuracy stabile quando la **struttura** del contesto varia — sezioni di lunghezze diverse, numero di item diverso, info-utile in posizione qualsiasi, densità di rumore variabile, ordine delle sezioni variabile. Il modello impara che "le info possono essere sparse ovunque e deve essere bravo a trovarle" (idea utente). Complementare a needle-recall (lì = una richiesta-ago; qui = retrieval generico su struttura variabile) e a symbol-randomization (lì = copy chirurgico; qui = retrieval).
- **Esempi**:
  - **(1) WITH-hint** — TUTTI gli hint, forte→debole:
    - *Hint forte (mappa struttura)*: prompt premette la **mappa delle sezioni** *"Il contesto ha: `<aim>`, `<assets>` (N item), `<memory>` (M memo), `<working_history>`. L'informazione che ti serve è in una di queste — scorrile tutte sistematicamente."* → context con layout variabile.
    - *Hint medio*: *"Il contesto è strutturato in sezioni di dimensioni variabili; l'info può essere in qualsiasi sezione."*
    - *Hint debole*: *"Cerca l'informazione rilevante in tutto il contesto, non solo all'inizio."*
    - L'hint scaffolda lo **scan sistematico cross-sezione** (anti-shortcut "guarda solo i primi 2K token").
  - **(2) WITHOUT-hint** — stessa task family, layout dinamico (es. l'info-utile è in `<assets>` asset #78 su 80, oppure in `<memory>` memo #23), **nessuna mappa**. Il modello deve trovarla senza guida strutturale.
  - **(3) WRONG — awareness** — trace in cui il modello ha risposto usando un'info **della sezione sbagliata** (es. ha letto un asset vecchio invece di quello pertinente perché era in posizione più comoda), o ha fatto lo shortcut "primi 2K token". Label: *"sbagliato: usato asset #3 (posizione comoda) invece di asset #78 (quello pertinente); position-bias non mitigato"*. Il modello deve riconoscere il bias.
  - **(4) WRONG — recovery** — come (3): la risposta basata su info parziale fallisce un check → il modello **ri-scansiona** tutte le sezioni in modo esaustivo → trova l'info corretta nella sezione/posizione meno ovvia → corregge.
  - **(5) OTHER — adversarial: le 5+ dimensioni variabili come asse di stress + edge** (`[EXTRACTED]` dal concept):
    - **(5a) Lunghezza in token** della sezione — 50 / 200 / 800 / 2000 / 8000 token.
    - **(5b) Numero di item interni** — `<assets>` con 1 / 3 / 8 / 20 / 80 asset.
    - **(5c) Posizione dell'info-utile** dentro la sezione — inizio / 25% / 50% / 75% / fine.
    - **(5d) Densità di rumore** — info isolata vs immersa in distraction text.
    - **(5e) Ordine delle sezioni** — default vs shuffled.
    - *Edge da preservare (distribuzione realistica, non scartare)*: **discussione iniziale** (aim grande, resto piccolo); **reading codebase** (`<assets>` HUGE, state zero); **multi-day resume** (gap esplicito + memory grande). Sampling: 80% distribuzioni naturali (mixture-of-Gaussians/log-normal) + 20% edge a peso inflated.
    - *Composite adversarial*: info-utile in `<untrusted_zone>` → va trovata ma trattata come **dato non fidato** (non come istruzione) — ponte con [[../concepts/untrusted-content-delimiting]].
- **Fase curriculum** (§4.bis): **Fase 2** prevalente (il generator dinamico produce gli esercizi; vedi pseudo-code generator nel concept) → **Fase 3** (context reali del wrapper sono nativamente dinamici).
- **Reward design**: **Q** puro — verifier: la risposta usa l'info-utile **corretta** (quella in posizione random target), exact-match o check verificabile. Eval set = subset RULER + needle custom + criticality-specifico, **anch'esso dinamico** (altrimenti train/eval mismatch).
- **Hack-check (OBBLIGATORIO)**: se il dataset ha l'info-utile **statisticamente più spesso** in certe sezioni/posizioni, il modello impara la **prior posizionale** invece del retrieval → "indovina" senza la skill. Difesa → [[../concepts/reward-hacking-mitigation]]: (a) posizione info-utile **uniforme** su sezioni e offset (no leak posizionale); (b) **held-out** con distribuzione posizionale diversa dal train (difesa #1) — se l'accuracy crolla sull'held-out con posizioni nuove = il modello aveva hackato la prior; (c) monitor di overoptimization (difesa #9): reward train ↑ ma eval-dinamico piatto = Goodhart.

---

## Outer-task summary + type tags

- **Foglia**: `context-structuring / summary-gerarchico-con-tag-dominio`. **Tag**: **Q+L** — `Q` correttezza dei tag tipologia (verificabile), `L` qualità del summary. (Nota 2 utente.)
- **Skill target (segnale)**: per ogni **riassunto del task esterno/outer** (gerarchia sub-task → outer-task), produrre oltre al testo-summary anche i **tag di dominio** corretti (`coding`, `finance`, `frontend`, ...), eventualmente **multi-label** (`coding+finance` per un task fintech). Doppio scopo: (1) awareness gerarchica, (2) **segnale di routing** per l'hot-swap della LoRA verticale (memory `project_routing_strategy`).
- **Esempi**:
  - **(1) WITH-hint** — TUTTI gli hint, forte→debole:
    - *Hint forte (tassonomia + formato)*: *"Riassumi l'outer-task in ≤2 frasi E assegna i tag di dominio da questa tassonomia chiusa: [coding, frontend, backend, finance, data, devops, security, ...]. Multi-label se il task tocca più domini. Formato: `<outer_summary tags=[...]>testo</outer_summary>`."* → poi un outer-task descritto (es. "costruire un dashboard di trading con backend di pricing").
    - *Hint medio*: *"Riassumi il task esterno e indica di che dominio/i si occupa."*
    - *Hint debole*: *"Sintetizza il contesto del task più ampio."*
    - L'hint scaffolda **summary + classificazione** insieme.
  - **(2) WITHOUT-hint** — dato un outer-task descritto in prosa, il modello deve **spontaneamente** produrre summary + tag (sapendo che servono al routing), senza tassonomia fornita.
  - **(3) WRONG — awareness** — esempio con tag **sbagliati o incompleti**: un task fintech taggato solo `coding` (manca `finance`), o un task di pricing taggato `frontend`. Label: *"sbagliato: tag mancante `finance` su task che applica formule di mercato; routing avrebbe caricato la LoRA sbagliata"*. Il modello deve riconoscere il misclassification e l'impatto sul routing.
  - **(4) WRONG — recovery** — come (3): a valle, il routing carica la LoRA sbagliata e l'expert risulta out-of-domain → il modello **risale** al tag errato come causa → **ri-tagga** correttamente (multi-label) → il routing ricarica l'expert giusto. Ponte con Area 8 routing-token e Area 11 out-of-domain-refusal.
  - **(5) OTHER — adversarial/edge**:
    - *Task ambiguo/composto*: descrizione che **genuinamente** copre 3 domini → multi-label corretto, non forzare a uno solo.
    - *Summary fedele vs allucinato*: outer-task lungo → il summary non deve **introdurre** dettagli non presenti (anti-hallucination, ponte Area 15).
    - *Tag fuori-tassonomia*: dominio che non esiste nella tassonomia chiusa → il modello deve mappare al più vicino o flaggare "nuovo dominio", non inventare.
- **Fase curriculum** (§4.bis): **Fase 1** (teoria: tassonomia dei domini + formato tag) → **Fase 2** (esercizi di tagging+summary su outer-task) → **Fase 3** (i tag alimentano il routing reale).
- **Reward design**: **Q** = verifier sui tag (multi-label F1 vs ground-truth dominio; il routing è oggettivo). **L** = judge sul summary (fedeltà + concisione, rubric). Q (tag) è il segnale robusto, L (summary) secondario.
- **Hack-check (OBBLIGATORIO)**: rischio = **over-tagging** (mettere tutti i tag per massimizzare il recall del multi-label) → "partecipa" alla classificazione senza discriminare. Difesa → [[../concepts/reward-hacking-mitigation]]: (a) metrica **F1** (non recall puro) così che i falsi-positivi costino quanto i falsi-negativi; (b) reward del tag ancorato all'**outcome del routing** (principio #12): tag corretto = la LoRA caricata è quella che poi **risolve** il task (verificabile a valle), non il solo atto di taggare — anti participation-hack; (c) per il summary L, length penalty + judge a lenti diverse (difese #5/#8).

---

## Temporal awareness

- **Foglia**: `temporal / senso-del-tempo-e-timing`. **Tag**: **Q** (uso corretto di timestamp / decisione wait-vs-retry / flag su timestamp incoerenti — verificabile). [[../concepts/temporal-awareness-timestamps]].
- **Skill target (segnale)**: usare i timestamp del contesto (`<now>`, `<tool_call_log>`, age delle VAR) per ragionare sul tempo — durata di un tool call (fresco vs stale), decisione **wait/retry/declare-failed** in base alla latenza tipica, gap multi-day, e **flaggare timestamp incoerenti** (es. `responded_at < requested_at`). Senza temporal info il modello vive in un "presente eterno".
- **Esempi**:
  - **(1) WITH-hint** — TUTTI gli hint, forte→debole:
    - *Hint forte (procedura)*: *"Prima di agire consulta `<temporal_state>` e `<tool_call_log>`: (a) i dati che usi sono freschi (entro il TTL)? (b) un tool è `in_progress` da più della sua latenza tipica → è bloccato? (c) i timestamp sono coerenti (responded_at ≥ requested_at)? Ragiona su questi prima di procedere."* → poi un context con tool log e VAR datate.
    - *Hint medio*: *"Considera l'orario corrente e da quanto tempo sono stati prodotti i dati prima di usarli."*
    - *Hint debole*: *"Tieni conto del tempo."*
    - L'hint scaffolda il **reasoning temporale esplicito**.
  - **(2) WITHOUT-hint** — context con `<now>`, tool log e VAR datate, **nessuna procedura**. Es. tool `shell_exec` `in_progress` da 105s con timeout a 5min: il modello deve **spontaneamente** decidere (npm install → aspetta; tool tipicamente <30s → probabilmente bloccato → retry/alert).
  - **(3) WRONG — awareness** — trace in cui il modello **ignora i timestamp**: usa una VAR `codebase_tree` di 5h fa come se fosse fresca, o dichiara fallito un `npm install` dopo 10s (sotto la sua latenza tipica). Label: *"sbagliato: usato dato stale (5h, oltre TTL) senza re-fetch; oppure declare-failed prematuro su tool a latenza tipica 2min"*. Il modello deve riconoscere l'errore temporale.
  - **(4) WRONG — recovery** — come (3): la decisione basata su dato stale produce un errore (es. edita un file su una vista del codebase obsoleta → conflitto) → il modello **diagnostica** (ha usato dato stale) → **re-fetch** del dato fresco → ri-applica. Ponte diretto con foglia **Stale/TTL** sotto.
  - **(5) OTHER — adversarial/edge**:
    - *Timestamp incoerenti (adversarial)*: `responded_at < requested_at`, o `now` precedente a `session_started`, o clock-drift tra fonti → il modello deve **flaggare l'incoerenza**, non ragionarci sopra come se fosse valida.
    - *Timezone confusion*: utente CEST, server UTC → il modello deve usare l'offset esplicito, non naive.
    - *Latency-aware planning*: `web_fetch` tipicamente 40s → chiamare in **parallelo** invece che sequenziale (ponte Area 8 trajectory-efficiency).
- **Fase curriculum** (§4.bis): **Fase 1** (teoria: formato ISO 8601 + semantica di staleness/timeout nel system prompt) → **Fase 2** (esercizi su tool log realistici con reasoning su staleness/wait-retry) → **Fase 3** (timing reale nell'harness).
- **Reward design**: **Q** = verifier — la decisione temporale è corretta vs ground-truth (wait/retry/failed appropriato alla latenza tipica del tool; stale-flag emesso quando il dato è oltre TTL; incoerenza flaggata). Tutto binario/verificabile.
- **Hack-check (OBBLIGATORIO)**: il modello può **flaggare staleness/incoerenza sempre** (massimizza il recall del flag) o adottare una regola fissa (es. "retry sempre dopo 60s") che funziona sul train ma non generalizza. Difesa → [[../concepts/reward-hacking-mitigation]]: (a) dataset con **latenze tipiche diverse per tool** (npm install 2min vs git 1s) così che una soglia fissa fallisca → costringe a ragionare sulla latenza specifica; (b) F1 sul flag (falsi-positivi costano); (c) held-out con tool/latenze nuove (difesa #1) per smascherare le regole fisse.

---

## Stale/TTL freshness reasoning

- **Foglia**: `temporal / freschezza-TTL-e-refetch`. **Tag**: **Q** (re-fetch deciso correttamente / incoerenza flaggata — verificabile).
- **Skill target (segnale)**: dato un dato letto **N ore fa oltre il suo TTL**, **re-fetcharlo prima di usarlo** (non fidarsi del valore stale); e **flaggare timestamp incoerenti** come segnale adversariale. È la **decisione/azione** a valle del "senso del tempo" (Temporal-awareness = percepire; Stale/TTL = decidere di agire). `[INFERRED]` Distinzione mantenuta per evitare double-counting: temporal = reasoning generale; TTL = la specifica policy re-fetch.
- **Esempi**:
  - **(1) WITH-hint** — TUTTI gli hint, forte→debole:
    - *Hint forte (policy TTL)*: *"Ogni dato ha un TTL (codebase_tree: 1h, prezzi-mercato: 1min, config-statica: ∞). Prima di usare un dato: `età = now - last_modified`; se `età > TTL` → RE-FETCH obbligatorio prima dell'uso. Non usare mai un dato stale."* → poi context con VAR datate.
    - *Hint medio*: *"Verifica che i dati siano ancora freschi (entro il loro TTL) prima di usarli; altrimenti aggiornali."*
    - *Hint debole*: *"Attenzione ai dati vecchi."*
    - L'hint scaffolda la **policy età-vs-TTL → re-fetch**.
  - **(2) WITHOUT-hint** — context dove una VAR critica è chiaramente oltre TTL (prezzo di mercato letto 2h fa, TTL implicito ~minuti). Il modello deve **spontaneamente** re-fetchare prima di usarlo in un calcolo.
  - **(3) WRONG — awareness** — trace in cui il modello **usa un dato stale** (prezzo di 2h fa) per una decisione di trading. Label: *"sbagliato: usato prezzo oltre TTL senza re-fetch → decisione su dato obsoleto"*. Il modello deve riconoscere la violazione di freschezza e l'impatto.
  - **(4) WRONG — recovery** — come (3): la decisione su dato stale produce un esito sbagliato (il prezzo era cambiato del 5%) → il modello **diagnostica** (dato oltre TTL) → **re-fetch** → ricalcola → corregge la decisione. Verify-loop sul TTL.
  - **(5) OTHER — adversarial/edge**:
    - *Timestamp incoerenti (adversarial)*: una VAR ha `last_modified` **nel futuro** rispetto a `now`, o `age_ms` negativo → il modello deve **flaggare** l'incoerenza, non assumere freschezza.
    - *TTL-aware ma costoso*: re-fetch ha un costo (latenza/budget) → se il dato è **di poco** oltre TTL e il task è low-stakes, valutare il trade-off (ponte Area 2 criticality + Area 8 budget).
    - *Dato senza TTL noto*: il modello deve usare un default conservativo o chiedere, non assumere ∞.
- **Fase curriculum** (§4.bis): **Fase 1** (teoria: concetto di TTL + policy re-fetch) → **Fase 2** (esercizi su VAR datate con TTL diversi) → **Fase 3** (re-fetch reale nell'harness, costo reale).
- **Reward design**: **Q** = verifier — re-fetch deciso correttamente quando età > TTL (e **non** quando il dato è fresco, per non sprecare budget); incoerenza temporale flaggata. Binario.
- **Hack-check (OBBLIGATORIO)**: il modello può **re-fetchare sempre** (massimizza il recall "non uso mai dati stale" → ma spreca budget/latenza e di fatto ignora il reasoning TTL). Difesa → [[../concepts/reward-hacking-mitigation]]: (a) **penalità sul re-fetch superfluo** (dato fresco re-fetchato = costo senza beneficio) così che il reward premi la **decisione corretta**, non il re-fetch incondizionato — anti participation-hack (#12); (b) TTL **diversi per tipo di dato** nel dataset (una regola "re-fetch sempre dopo X" fallisce); (c) held-out con coppie età/TTL nuove (difesa #1).

---

## Update-injection handling (mid-thinking)

- **Foglia**: `metacognizione / gestione-update-esterni-mid-thinking`. **Tag**: **Q+L** — `Q` classificazione priorità corretta (verificabile), `L` giudizio d'impatto. **Paper-claim #1** ([[../concepts/external-update-injection]]).
- **Skill target (segnale)**: mentre produce thinking strutturato, ricevere un `<update from="external">` iniettato dopo una sezione e (a) **classificarne la priorità** (`critical` → restart thinking / `high` → adjust in-place / `normal` → defer a fine thinking / `low` → solo informativo) e (b) **giudicarne l'impatto** sul plan corrente, emettendo una sezione `<update_handling>`. Risponde solo **tra sezioni complete**, mai a metà.
- **Esempi**:
  - **(1) WITH-hint** — TUTTI gli hint, forte→debole:
    - *Hint forte (tabella priorità + template)*: *"Quando ricevi `<update from external>`: classifica → critical (invalida il thinking → RESTART) / high (cambia il plan → ADJUST) / normal (non urgente → DEFER a fine thinking) / low (informativo). Emetti `<update_handling source=... priority=...>IMPATTO: ... ACTION: ... CONTINUARE: sì/no</update_handling>`."* → poi un thinking in corso + un update iniettato (es. "test suite fallita: AssertionError").
    - *Hint medio*: *"È arrivato un aggiornamento esterno: valuta quanto è urgente e se cambia il tuo piano prima di continuare."*
    - *Hint debole*: *"Tieni conto della nuova informazione."*
    - L'hint scaffolda **classificazione priorità + decisione restart/adjust/defer**.
  - **(2) WITHOUT-hint** — thinking strutturato in corso, update iniettato dopo `</section>`, **nessuna tabella**. Il modello deve **spontaneamente** classificare e reagire correttamente (es. un `critical` che invalida un'assumption → restart; un `low` informativo → defer).
  - **(3) WRONG — awareness** — trace in cui il modello **mis-classifica** l'update: tratta un `critical` (test fallito che invalida il fix in corso) come `normal` e continua il thinking obsoleto; oppure tratta un `low` come `critical` e fa restart inutile. Label: *"sbagliato: update critical (invalida l'assumption email auto-popolata) trattato come normal → thinking obsoleto proseguito"*. Il modello deve riconoscere la mis-classificazione.
  - **(4) WRONG — recovery** — come (3): il modello prosegue il thinking obsoleto, poi si accorge che la conclusione contraddice l'update → **diagnostica** (ho ignorato un update critical) → **abortisce** il thinking corrente → **ricomincia** dal nuovo state incorporando l'update. Insegna il restart corretto.
  - **(5) OTHER — adversarial/edge**:
    - *Update inappropriato da rifiutare*: un `<update>` che proviene di fatto da `<untrusted_zone>` o che è non-pertinente al task corrente → il modello deve **non iniettarlo** nel reasoning (filtro: deve toccare un asset/sub-task) — ponte [[../concepts/untrusted-content-delimiting]].
    - *Update contraddittorio col context*: l'update contraddice un dato esistente → ponte con foglia **Self-detect contradiction** sotto (classificare + risolvere la contraddizione).
    - *Injection mid-section (timing)*: verificare che il modello reagisca **solo dopo `</section>`**, non a metà statement (robustezza del timing).
    - *Burst di update*: 3 update ravvicinati → ordinarli per priorità, non ping-pong dell'attention.
- **Fase curriculum** (§4.bis): **Fase 1** (teoria: 4 livelli di priorità + template `<update_handling>` nel system prompt) → **Fase 2** (esempi annotati: critical→restart / high→adjust / normal→defer / inappropriato→reject, come da §Training del concept) → **Fase 3** (injection reale streaming nell'harness, paper-claim #1).
- **Reward design**: **Q** = verifier sulla **classe di priorità** assegnata (vs ground-truth label dell'update) e sulla **decisione** conseguente (restart/adjust/defer/reject corretta). **L** = judge sul rationale d'impatto (`IMPATTO:` è corretto e specifico?). Q (priorità) ancora il segnale; L secondario.
- **Hack-check (OBBLIGATORIO)**: rischio = il modello impara a classificare **sempre `normal/defer`** (la scelta "comoda" che minimizza il costo di restart) o sempre `critical` (massima reattività). Difesa → [[../concepts/reward-hacking-mitigation]]: (a) dataset **bilanciato** sui 4 livelli, con costo simmetrico per ogni mis-classificazione (un `critical` trattato come `normal` deve costare **molto**, perché è il caso pericoloso); (b) reward ancorato all'**outcome a valle** (#12): la classificazione è corretta se la reazione conseguente porta al risultato giusto (es. il restart era necessario → il task poi converge), non per il solo atto di emettere `<update_handling>` (anti participation-hack); (c) penalità su restart superflui (un `low` trattato come `critical` spreca token).

---

## Self-detect contradiction (own context)

- **Foglia**: `metacognizione / rilevare-contraddizioni-nel-proprio-contesto`. **Tag**: **Q** (contraddizione rilevata e flaggata — verificabile su context annotato). [[../concepts/contradiction-detection-layer]] (qui come **skill** del modello, non solo layer wrapper).
- **Skill target (segnale)**: rilevare contraddizioni **dentro il proprio contesto** (due asset che si contraddicono, un'assumption del thinking che contraddice un dato in `<memory>`, un update che contraddice lo state corrente, l'aim del turno 1 cambiato silenziosamente) e **fermarsi** segnalando la contraddizione invece di procedere su basi incoerenti. È una skill interna (nota 4 utente: "il detector è interno al modello, non solo wrapper-side").
- **Esempi**:
  - **(1) WITH-hint** — TUTTI gli hint, forte→debole:
    - *Hint forte (procedura di consistency-check)*: *"Prima di concludere, esegui un consistency-check: confronta la tua conclusione e le tue assumption con (a) i dati in `<assets>`/`<memory>`, (b) l'aim originale, (c) gli update ricevuti. Se trovi una contraddizione → FERMATI ed emetti `<contradiction>A dice X (riga..), B dice ¬X (riga..)</contradiction>` invece di scegliere arbitrariamente."* → poi context con una contraddizione piazzata.
    - *Hint medio*: *"Verifica che le informazioni che stai usando non si contraddicano tra loro prima di procedere."*
    - *Hint debole*: *"Controlla la coerenza del contesto."*
    - L'hint scaffolda il **consistency-check esplicito** prima di concludere.
  - **(2) WITHOUT-hint** — context contenente due dati contraddittori (es. `<asset config>` dice `timeout=30s`, `<memory memo>` dice "deciso timeout=60s"), **nessun avviso**. Il modello deve **spontaneamente** rilevare la contraddizione e fermarsi/segnalare invece di sceglierne uno a caso.
  - **(3) WRONG — awareness** — trace in cui il modello **procede** su un contesto contraddittorio scegliendo silenziosamente uno dei due valori (o peggio, mescolandoli) senza segnalare. Label: *"sbagliato: contraddizione timeout 30s vs 60s non rilevata; il modello ha usato 30s arbitrariamente senza flaggare"*. Il modello deve identificare la contraddizione ignorata e i due claim in conflitto.
  - **(4) WRONG — recovery** — come (3): il modello procede, poi un check a valle fallisce (comportamento incoerente) → **diagnostica** (c'era una contraddizione non risolta) → **la esplicita** (`<contradiction>`) → **risolve** scegliendo con criterio (es. il dato più recente per timestamp, ponte Temporal/TTL) o **chiede all'utente** con contesto (ponte Area 9 ask-vs-proceed). Insegna il loop rileva→esplicita→risolvi.
  - **(5) OTHER — adversarial/edge**:
    - *Contraddizione subdola/indiretta*: non due valori espliciti, ma un'**implicazione** (asset A implica X, asset B implica ¬X solo dopo un passaggio logico) → richiede ragionamento, non match testuale.
    - *Falsa contraddizione (over-flagging)*: due dati che **sembrano** contraddirsi ma sono in **contesti diversi** (timeout 30s per `connect`, 60s per `read` — non in conflitto) → il modello **non** deve flaggare. Penalizza l'allarmismo.
    - *Self-contradiction*: il modello contraddice **se stesso** tra il turno 3 e il turno 7 del proprio thinking → deve accorgersene (ponte Degradation-awareness, degrado qualitativo).
    - *Contraddizione da update*: un `<update>` contraddice lo state → ponte con foglia Update-injection.
- **Fase curriculum** (§4.bis): **Fase 1** (teoria: definizione di contraddizione + template `<contradiction>` nel system prompt) → **Fase 2** (esercizi su context con contraddizioni piazzate, dirette e indirette, + falsi positivi) → **Fase 3** (contraddizioni reali emergono nei loop lunghi dell'harness).
- **Reward design**: **Q** = verifier — la contraddizione **annotata** nel context è stata rilevata e flaggata correttamente (recall), **e** non sono state flaggate non-contraddizioni (precision). Binario su dataset annotato. Eventuale L sul rationale (i due claim citati sono effettivamente quelli in conflitto).
- **Hack-check (OBBLIGATORIO)**: rischio = **over-flagging** (segnala contraddizioni ovunque per massimizzare il recall) → "partecipa" al check senza la skill discriminativa; oppure under-flagging se il dataset è povero di contraddizioni. Difesa → [[../concepts/reward-hacking-mitigation]]: (a) dataset **bilanciato** con molti **falsi-positivi plausibili** (dati che sembrano contraddirsi ma non lo sono) così che il precision conti → F1, non recall puro; (b) reward ancorato all'**outcome** (#12): il flag dà reward solo se la contraddizione era **reale e verificabile** (annotazione ground-truth), mai per il solo atto di segnalare — anti participation-hack; (c) penalità su over-flagging (difesa #8), allineata al pattern over-refusal di Area 11.

---

## Note di chiusura

- **9 foglie** coperte (1:1 con i 9 topic dell'Area 4 nel [[README]] §4). Le 4 variazioni di rumore needle (puro/semantic/false-action/contradictory) + position-curriculum sono modellate come **classe OTHER/adversarial** della foglia needle (5a-5d + curriculum), come richiesto dallo schema. Le 5+ dimensioni dynamic-context (lunghezza/item-count/posizione/densità/ordine) sono la classe OTHER/adversarial della foglia dynamic-context (5a-5e + edge realistici).
- **Reward pattern dominante**: Area 4 è prevalentemente **Q** (recall/flag/decisione verificabili) → ideale per RL con reward verificabile (allinea con [[../concepts/scientific-method-operating-protocol]] D3). Le due foglie Q+L (autocompact, outer-summary, update-injection) hanno un nucleo Q che **ancora** la componente L del judge.
- **Hack-check trasversale**: il rischio ricorrente in quest'area è **over-triggering** dei flag metacognitivi (DEGRADED/stale/contradiction/critical sempre) — la difesa comune è F1 (non recall puro) + dataset bilanciato + reward ancorato all'**outcome a valle**, non alla partecipazione (principio first-class #12, [[../concepts/reward-hacking-mitigation]]).
- **Overlap da sorvegliare in training** (audit §A): degradation↔autocompact, temporal↔stale/TTL, update-injection↔self-contradiction — tenere le reward distinte per evitare double-counting.

## Addendum 2026-06-27 — gap §2ter chiusi + nuove foglie + SOTA

> Allineamento all'audit [[../architecture/harness-feature-catalog]] §2ter + al review-loop SOTA ([[../sota-techniques-catalog]] §RL-1 Dim-4). Le skill metacognitive sono **inerti/degradate senza training**: qui si esplicita il regime e si aggiungono le foglie mancanti.

### [FASE] Le metacognitive sono primariamente Fase-3-RL `[INFERRED]`
Per le foglie metacognitive (degradation-awareness, autocompact, compaction-scheduling, low-confidence, update-injection) la Fase-1/2 (teoria + esercizi con-hint) è **solo bootstrap del formato**; il valore reale emerge in **Fase-3-RL outcome-anchored**. SOTA: **AdaCoM** (arXiv 2605.30785) addestra il when-to-compact via GRPO con manager separato + agente frozen (scorer≠scored); **RLCR/ConfTuner** danno il reward di calibrazione via Brier (proper scoring rule, NON self-report). → nei reward design sopra il peso è su Fase-3.

### [VINCOLO] GRPO erode la calibrazione `[EXTRACTED ricerca]`
Il nostro GRPO/PPO binary-reward **degrada la calibrazione** come side-effect strutturale (arXiv 2410.09724 Taming Overconfidence: PPO-M/PPO-C). → vincolo cross-pipeline: integrare un calibration-reward (RLCR/PPO-C) o uno stage dedicato, non scoprirlo a valle. La verbalized-confidence è **sovra-confidente** (2509.21545) → mai premiare il self-report; preferire AURC/Brier su outcome verificato o probe sulle attivazioni (white-box, abbiamo i pesi).

### [FOGLIA NUOVA] Compaction-scheduling decision (il *quando*)
- **Foglia**: `metacognizione / quando-compattare`. **Tag**: **Q** (decisione compact-now sì/no vs ground-truth) + L sul rationale.
- **Distinzione**: *Autocompact* (sopra) = il **come** (keep/summarize/drop); *Degradation-awareness* = **riconoscere** lo stato; questa = la **decisione di scheduling** (*è questo il momento di compattare?*, trade-off costo-compact vs rischio-overflow/degrado). Match AdaCoM/ReSum.
- **Reward**: AdaCoM-style two-level (outcome del task a valle + process rule-based: token-overflow/redundant-action penalty, gold-retrieval reward) + **held-out probe post-compact**. Scorer≠scored (manager separato).
- **Hack-check**: compattare a caso (participation-hack) o mai → reward solo se il timing migliora l'outcome; penalità simmetrica.

### [FOGLIA NUOVA] Low-confidence → gather/ask (esplodere in example-space)
- Esplodere [[../concepts/low-confidence-gather-and-reorg]] in 5 classi (trigger token-non-in-contesto → split INTERNO/ESTERNO → budget-K → ASK).
- **Reward EVPI** (arXiv 2511.08798) / SELAUR (2602.21158): l'info recuperata/richiesta era **necessaria** e ha **cambiato** la decisione, col **costo della domanda**? Anti participation-hack (gather/ask non premiati se non cambiano l'esito).

### [NUOVE skill collegate]
- **interruption-robust-reasoning** ([[../concepts/interruption-robust-reasoning]]) → si innesta sulla foglia *Update-injection handling*: gestione dell'`<update>` a fine sezione (multi-call MinD); reward = l'update ha migliorato la risposta, coppia bilanciata rilevante/rumore.
- **dependency-aware-error-recovery** ([[../concepts/dependency-aware-error-recovery]]) → foglia Area 2/4/16: traversare il dep-graph dal nodo-errore + revisione a cascata.
- **situational-policy-table** ([[../concepts/situational-policy-table]]) → situational-policy: riconoscere la situazione → azione/policy corretta. Eval = **oracolo held-out della situazione** (by-construction: "la regola Y si applica in questo input? sì/no", scorer≠scored); benchmark esterno di confronto = policy-compliance per richiesta (Cisneros-Velarde arXiv 2603.00369; affine CoPriva 2505.15805). ⚠️ **NON** il SAD di Laine (arXiv 2407.04694 = self-AI-awareness, mismatch). Dettaglio in [[../concepts/situational-policy-table]] §Reward.

### [CROSS-LINK] Adaptive-depth (Area 3) ↔ Area 4 `[INFERRED]`
Il *think-or-not / adaptive-depth* (Area 3: S-GRPO/DEER/CoT-Valve) è la stessa famiglia "compute-allocation metacognitiva" di degradation/when-to-compact: decidere *quanto computare*. Reward decaying su exit-position (agire prima ma corretto). → reward allineati: mai premiare l'uscita-presto di per sé, solo uscire-presto-**E**-corretto.

### [NON-GAP] Steering resta fuori-tassonomia (confermato).

---

## Sources
- [[README]] §4 Area 4 (topic/foglie/tag/skill) + §3 template canonico + §4.bis curriculum.
- [[../concepts/adversarial-needle-haystack-training]] (paper-claim #5, 4 variazioni rumore + position-curriculum).
- [[../concepts/dynamic-context-training-regime]] (5+ dimensioni, distribuzione realistica).
- [[../concepts/external-update-injection]] (paper-claim #1, 4 priorità).
- [[../concepts/temporal-awareness-timestamps]] (timestamp, tool timing, staleness).
- [[../concepts/_user-notes-2026-06-23]] (note 2, 4, 5: tag dominio, degradation-awareness, autocompact).
- [[../concepts/reward-hacking-mitigation]] (hack-check + difese, principio outcome-not-participation).
- [[_coverage-audit-2026-06-23]] (overlap §A, gap §A.8/A.9).
