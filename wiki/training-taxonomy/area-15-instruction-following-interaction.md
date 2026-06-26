---
name: area-15-instruction-following-interaction
description: Example-space completo per le 4 foglie dell'Area 15 — instruction following compositivo, policy/spec adherence, multi-turn clarification con stato, factual calibration / anti-hallucination. Reward IFEval-style verificabili + judge per le dimensioni soggettive.
type: taxonomy-area
tags: [training, taxonomy, area-15, instruction-following, multi-turn, calibration, ifeval]
sources: [training-taxonomy/README.md §4 Area 15, coverage-audit 2026-06-23]
last_updated: 2026-06-25
status: generated
---

# Area 15 — Instruction Following & Interaction

> **Tier**: X (cross-tier). **Origine**: gap vs benchmark IFEval / τ-Bench / AgentBench / TruthfulQA-SimpleQA (vedi [[_coverage-audit-2026-06-23]] §B). Quattro foglie, dai due topic `Q` puri (precise/compositional, policy/spec) ai due `Q+L` (multi-turn clarification, factual calibration).
>
> **Filo conduttore dell'area**: il modello deve fare **esattamente** quello che gli si chiede — né meno (vincolo ignorato) né di più (gold-plating non richiesto) — e quando l'informazione manca o è incerta deve **chiedere** o **astenersi**, mai **fabbricare**. La tensione centrale (e il rischio di reward-hacking pervasivo dell'area) è: *rispettare il vincolo formale può tentare il modello a sacrificare il contenuto*, e *l'anti-hallucination può degenerare in astensione sistematica*. Il reward deve premiare **correttezza E vincolo insieme**.
>
> **Nota trasversale sui reward verificabili (IFEval-style)** `[EXTRACTED]`: i vincoli di formato/lunghezza/lingua sono **programmaticamente verificabili** (regex, conteggio token/parole, language-detector, parser JSON/schema). Questo è il nucleo `Q` dell'area e va sfruttato come segnale primario. Le foglie `Q+L` hanno comunque un **nucleo `Q`** (es. "ha chiesto invece di assumere" è binario; "lo stato è stato mantenuto correttamente" è verificabile sul transcript) **+** una dimensione `L` (qualità della domanda di chiarimento, tono, calibrazione della confidence) via judge.

Le foglie seguono lo schema canonico [[README]] §2-§3. Per ognuna: skill-target → 5 classi (WITH-hint forte→debole · WITHOUT-hint · WRONG-awareness · WRONG-recovery · OTHER) → fase curriculum (§4.bis) → reward design → **hack-check obbligatorio**.

---

## Precise / Compositional Instruction Following

- **Foglia**: `instruction-following / vincoli-verificabili-compositivi`
- **Tag**: **Q** (vincoli verificabili: formato / lunghezza / lingua / case / inclusione-esclusione token). Reward interamente verificabile, prototipo IFEval.
- **Skill target (segnale)**: parsare **tutti** i vincoli atomici di un prompt (anche quando sono molti e annidati) e **soddisfarli simultaneamente** senza che il contenuto sostanziale degradi. La skill è la **compositività**: 1 vincolo è facile, 5 vincoli interagenti (es. "esattamente 3 bullet, ogni bullet ≤12 parole, in italiano, senza la lettera 'e', termina con un emoji") è dove i modelli falliscono.

### Esempi

- **(1) WITH-hint** — l'impalcatura **enumera e rende esplicito il checklist dei vincoli** prima della risposta.
  - *Prompt*: *"Scrivi una descrizione del prodotto. ⚠️ Vincoli da rispettare TUTTI — fai un check finale: [1] esattamente 4 frasi · [2] ogni frase inizia con un verbo · [3] nessuna frase supera 15 parole · [4] tutto in italiano · [5] includi la parola 'modulare' almeno una volta. Prima di rispondere, elenca i 5 vincoli e dopo la risposta verifica uno per uno."*
  - *Atteso*: il modello elenca i vincoli, produce le 4 frasi, poi **self-check** vincolo-per-vincolo (✓/✗) e corregge prima di consegnare.
  - **Hint da definire (forte→debole)**:
    - **Forte (checklist + self-verify imposto)**: enumera i vincoli numerati + ordina esplicitamente "elenca e verifica uno per uno alla fine".
    - **Medio (reminder di compositività)**: *"attenzione: ci sono più vincoli, rispettali tutti insieme — non sacrificarne uno per un altro"*. Nessuna enumerazione fornita: deve estrarli da sé.
    - **Debole (singolo nudge)**: *"rispetta esattamente il formato richiesto"*. Solo un segnale di salienza.
    - Fade-out progressivo lungo il curriculum: forte → medio → debole → (2).
- **(2) WITHOUT-hint** — stessa task family, nessun reminder.
  - *Prompt*: *"Scrivi una descrizione del prodotto in esattamente 4 frasi, ogni frase comincia con un verbo, max 15 parole a frase, in italiano, includendo 'modulare'."* (i vincoli sono nel testo del task ma senza scaffolding meta).
  - *Atteso*: il modello deve **internamente** scomporre, generare e auto-verificare i 5 vincoli senza che gli si dica di farlo.
- **(3) WRONG — awareness** — gli si mostra una risposta che **viola un vincolo verificabile** e deve riconoscerlo *con la diagnosi precisa*.
  - *Prompt*: *"Il task chiedeva: '3 bullet, ognuno ≤10 parole, in inglese'. Questa è la risposta: [bullet1 (8 parole, EN) · bullet2 (14 parole, EN) · bullet3 (in italiano)]. Cosa c'è di sbagliato?"*
  - *Atteso (label)*: *"Sbagliato: bullet2 viola il limite lunghezza (14>10), bullet3 viola il vincolo lingua (italiano invece di inglese). Vincoli violati: lunghezza, lingua."* — il modello deve **identificare quali** vincoli, non solo "è sbagliato".
- **(4) WRONG — recovery** — come (3) + **riparazione che rispetta TUTTI i vincoli**.
  - *Atteso*: riscrive bullet2 entro 10 parole **mantenendo il significato** e ritraduce bullet3 in inglese, poi **ri-verifica tutti e 3** i vincoli. Insegna il loop *viola → diagnostica → ripara senza introdurre nuove violazioni*. (Punto critico anti-hacking: la recovery NON deve svuotare il contenuto per accorciare.)
- **(5) OTHER** — composite / adversarial:
  - **Vincoli in conflitto reale**: *"rispondi in ≤5 parole spiegando la teoria della relatività generale"* → riconoscere che la compressione estrema **degrada inevitabilmente** la sostanza e o (a) chiede di rilassare un vincolo, o (b) dichiara il trade-off esplicitamente. Non fingere che 5 parole bastino.
  - **Vincolo a livello-carattere** (lega Area 10): *"nessuna parola con più di 6 lettere"* → richiede char-counting preciso.
  - **Vincolo negativo / esclusione**: *"non usare mai la parola 'sistema'"* — i vincoli negativi sono i più frequentemente violati.

- **Fase curriculum** (§4.bis): **Fase 2** (esercizi con-hint → senza-hint) come core; il **self-verify loop** della (1)-forte e della (4) si consolida in **Fase 3** (RL agentico: il verifier IFEval-style dà reward 0/1 per vincolo).
- **Reward design**: **Q → verifier deterministico**. Ogni vincolo atomico è una funzione booleana (`count_sentences()==4`, `lang_detect()=="it"`, `"modulare" in text`, …). Reward = **frazione di vincoli soddisfatti**, MA con **gate sul contenuto** (vedi hack-check). In RL (GRPO): completion con più vincoli soddisfatti **a parità di qualità di contenuto** hanno advantage maggiore.
- **Hack-check (OBBLIGATORIO)**:
  - **Failure mode**: il modello *rispetta il vincolo formale sacrificando il contenuto* — es. produce 4 frasi grammaticalmente valide ma **vuote/non pertinenti** pur di centrare "esattamente 4 frasi"; o accorcia entro il limite parole **cancellando informazione essenziale**.
  - **Difesa**: il reward **non** è la sola somma dei vincoli formali. Va combinato con un **nucleo di correttezza/pertinenza** (verifier sul contenuto dove possibile — es. la descrizione menziona feature reali del prodotto — o judge `L` leggero) tramite **prodotto, non somma**: `reward = constraint_score × content_score`. Così azzerare il contenuto azzera il reward anche con 5/5 vincoli formali. `scorer ≠ scored`. → [[../concepts/reward-hacking-mitigation]].

---

## Policy / Spec Adherence

- **Foglia**: `policy-spec-adherence / API-e-policy-esatte`
- **Tag**: **Q** (la spec/policy è data e la conformità è verificabile: la chiamata API rispetta esattamente la firma? l'azione è permessa dalla policy sì/no?). Prototipo τ-Bench / AgentBench.
- **Skill target (segnale)**: data una **specifica esplicita** (una policy di dominio, uno schema API, un contratto d'uso), produrre azioni/output che vi aderiscono **alla lettera** — usare i nomi-campo esatti, rispettare i valori ammessi (enum), **rifiutare** ciò che la policy vieta, e **non inventare** endpoint/parametri non presenti nella spec.

### Esempi

- **(1) WITH-hint** — l'impalcatura **rende saliente la spec e impone di citarla**.
  - *Prompt*: *"Policy rimborsi (LEGGILA): rimborso ammesso SOLO se ordine < 30 giorni E stato='consegnato' E importo ≤ 200€; oltre 200€ serve approvazione manager. Schema della funzione: `issue_refund(order_id: str, amount: float, reason: enum['defect','wrong_item','other'])`. ⚠️ Prima di chiamare la funzione, verifica le 3 condizioni della policy citandole, e usa SOLO i campi/enum dello schema. Richiesta utente: 'voglio il rimborso dell'ordine X, consegnato 5 giorni fa, 250€, difettoso'."*
  - *Atteso*: verifica le condizioni (< 30gg ✓, consegnato ✓, ≤200€ **✗ → 250€**) → **non chiama direttamente** `issue_refund`, ma **escala al manager** come da policy; usa `reason='defect'` (enum valido), non inventa `reason='broken'`.
  - **Hint da definire (forte→debole)**:
    - **Forte**: spec citata + ordine esplicito "verifica ogni condizione e cita la policy + usa SOLO i campi dello schema".
    - **Medio**: *"rispetta la policy e la firma esatta della funzione"* (la spec è presente nel contesto ma senza imposizione di citarla passo-passo).
    - **Debole**: *"attieniti alle regole fornite"*.
- **(2) WITHOUT-hint** — la policy e lo schema sono nel contesto (system/tool spec) ma nessun reminder meta; il modello deve **applicarli spontaneamente** e nello scope corretto.
  - *Prompt*: stessa richiesta utente, con policy+schema solo nel system prompt.
  - *Atteso*: identica condotta — escala invece di forzare il rimborso, firma e enum esatti.
- **(3) WRONG — awareness** — traiettoria che **viola la spec** in modo verificabile; il modello la riconosce.
  - *Prompt*: *"Ecco l'azione presa dall'agente: `issue_refund(order='X', value=250, motivo='rotto')`. La policy dice [<200€ senza approvazione; schema `issue_refund(order_id, amount, reason: enum[...])`]. Cosa non va?"*
  - *Atteso (label)*: *"Sbagliato su 3 livelli: (a) violazione policy — 250€>200€ richiedeva approvazione manager, non rimborso diretto; (b) nomi-campo errati — `order`/`value`/`motivo` non esistono, lo schema vuole `order_id`/`amount`/`reason`; (c) valore enum inventato — `'rotto'` non è in enum['defect','wrong_item','other']."*
- **(4) WRONG — recovery** — come (3) + **azione corretta conforme alla spec**.
  - *Atteso*: riformula come `request_manager_approval(order_id='X', amount=250.0, reason='defect')` (o l'azione di escalation prevista dalla spec), con campi/enum esatti, e spiega perché il refund diretto non era ammesso. Se la funzione di escalation **non esiste nella spec**, **dichiara il limite e chiede** invece di inventarla (lega anti-hallucination).
- **(5) OTHER** — composite / policy-edge:
  - **Spec silente / lacuna**: la richiesta cade in un caso **non coperto** dalla policy → riconoscere la lacuna ed escalare, **non** estrapolare una regola inventata.
  - **Policy in conflitto con la richiesta utente** (utente insiste): mantenere la policy, rifiutare con grazia + spiegazione (lega Area 9 deference, Area 11 refusal).
  - **Schema-adherence stretto** (lega Area 5 API-correctness): output JSON che deve validare contro un JSON-Schema dato — campi required presenti, nessun campo extra, tipi esatti.

- **Fase curriculum** (§4.bis): **Fase 2** per la lettura/applicazione spec; **Fase 3** (RL agentico con harness [[../decisions/2026-06-23-pi-harness-base|pi]]) dove l'agente opera in un ambiente con policy reale e tool con firma stretta (setup τ-Bench-like) — il verifier controlla conformità ad ogni step.
- **Reward design**: **Q → verifier**. Conformità policy = booleano (azione ∈ azioni-permesse-dato-stato). Conformità schema = validazione (firma esatta, enum validi, no campi inventati) → **parsing/validation deterministica**. Reward = policy_ok ∧ schema_ok ∧ task_progress. Penalità forte per **azioni non permesse eseguite** (in τ-Bench un'azione vietata è un fallimento netto, non parziale).
- **Hack-check (OBBLIGATORIO)**:
  - **Failure mode**: (a) il modello impara a **rifiutare/escalare sempre** per non violare mai la policy (massimizza "zero violazioni" astenendosi da ogni azione) — la versione *policy* dell'astensione degenerata; (b) oppure passa lo schema-check ma con valori **plausibili-ma-inventati** (es. inventa un `order_id` per far validare la chiamata).
  - **Difesa**: il reward premia **completamento legittimo del task**, non la sola assenza di violazioni — un'escalation **quando non serviva** (caso entro i limiti) è penalizzata come un mancato completamento. E i valori dei campi devono **provenire dal contesto** (grounding check: `order_id` deve esistere negli input), non essere generati per soddisfare il validator. `reward = task_done_legittimamente`, non `1 - violazioni`. → [[../concepts/reward-hacking-mitigation]].

---

## Multi-turn Clarification & State

- **Foglia**: `multi-turn / clarification-e-state-tracking`
- **Tag**: **Q+L** — nucleo `Q` (ha **chiesto** invece di assumere quando l'input era ambiguo/incompleto? lo **stato** raccolto sui turni è coerente e completo? verificabile sul transcript) **+** dimensione `L` (qualità/pertinenza/economia della domanda di chiarimento via judge — una buona domanda risolve l'ambiguità con il minimo di turni).
- **Skill target (segnale)**: riconoscere quando l'informazione è **insufficiente per agire correttamente** e porre la **domanda di chiarimento giusta** (non generica, non ridondante), poi **mantenere e aggiornare lo stato** attraverso i turni — ricordando ciò che l'utente ha già detto, non richiedendolo, e integrando i nuovi vincoli con i vecchi. Prototipo τ-Bench multi-turn.

### Esempi

- **(1) WITH-hint** — l'impalcatura **segnala l'ambiguità e impone il clarify-before-act**, e ricorda di tracciare lo stato.
  - *Prompt (turno 1)*: *"L'utente chiede: 'prenotami un volo per Milano la prossima settimana'. ⚠️ Prima di agire: l'informazione è completa? Se mancano slot necessari (data esatta, aeroporto di partenza, andata/ritorno, n. passeggeri), CHIEDI invece di assumere. Tieni traccia di ciò che già sai e di ciò che manca."*
  - *Atteso*: il modello **non** prenota; chiede i campi mancanti **in una sola domanda compatta** ("Per procedere mi servono: data esatta, da quale città parti, solo andata o A/R, quanti passeggeri") e mantiene uno **state slot** {destinazione: Milano [noto], data: ?, origine: ?, ...}.
  - *Turno successivo (utente fornisce parte dei dati)*: integra i nuovi slot, **non richiede** la destinazione già nota, chiede solo ciò che ancora manca.
  - **Hint da definire (forte→debole)**:
    - **Forte**: enumera **quali** slot sono necessari + ordina "chiedi invece di assumere" + "tieni traccia dello stato".
    - **Medio**: *"se manca informazione necessaria, chiedi prima di agire; ricorda quanto già detto"* (senza elencare gli slot — deve inferirli dal dominio).
    - **Debole**: *"assicurati di avere tutto il necessario prima di procedere"*.
- **(2) WITHOUT-hint** — richiesta ambigua, nessuno scaffolding; multi-turn reale.
  - *Atteso*: il modello **da sé** rileva gli slot mancanti, fa la clarifying question minima, e su più turni **non perde** né **rimastica** lo stato (test esplicito: al turno 3 deve ancora ricordare la destinazione del turno 1).
- **(3) WRONG — awareness** — traiettoria in cui il modello **assume invece di chiedere** (o **perde lo stato**); deve riconoscerlo.
  - *Prompt*: *"Utente: 'prenotami un volo per Milano la prossima settimana'. Agente: 'Fatto! Prenotato Roma→Milano, lunedì, 1 passeggero, solo andata.' Cosa c'è di sbagliato in questa traiettoria?"*
  - *Atteso (label)*: *"Sbagliato: l'agente ha **fabbricato** slot non forniti (origine Roma, lunedì, 1 pax, solo andata) — erano ambigui e andavano CHIESTI. Rischio di prenotazione errata e costosa/irreversibile (lega Area 2 criticality)."*
  - **Variante state-loss**: *"Turno 1 utente dice 'parto da Napoli'. Turno 3 l'agente chiede 'da dove parti?'"* → riconoscere la **perdita di stato**.
- **(4) WRONG — recovery** — come (3) + recupero.
  - *Atteso*: l'agente **si ferma**, ritratta l'assunzione (*"non avevo questi dati, li avevo assunti — annullo e chiedo"*), pone la clarifying question, e **ricostruisce lo stato** dai turni precedenti. Insegna: meglio un turno in più che un'azione irreversibile su dati inventati.
- **(5) OTHER** — composite / multi-turn con stato:
  - **Vincoli che evolvono nei turni**: l'utente al turno 2 cambia idea ("anzi, A/R") → aggiornare lo stato **senza** dimenticare il resto, e segnalare l'impatto (costo/disponibilità).
  - **Over-asking (anti-pattern speculare)**: chiedere informazioni **già fornite** o **non necessarie** per il task → penalizzato. La skill è chiedere **il minimo necessario**, non interrogare a raffica.
  - **Ambiguità risolvibile dal contesto**: se un dato è **deducibile** da quanto già detto, **non** chiederlo (distinguere "ambiguo davvero" da "pigrizia di lettura del contesto").

- **Fase curriculum** (§4.bis): **Fase 2** per i dialoghi sintetici con-hint/senza-hint (slot-filling supervisato); **Fase 3** (RL agentico, τ-Bench-like multi-turn) dove emerge il vero state-tracking sotto interazione reale.
- **Reward design**: **Q+L misto**.
  - **Nucleo `Q` (verifier su transcript)**: (a) ha chiesto quando ≥1 slot necessario era mancante? (binario, gold-label sugli slot richiesti dalla task) · (b) **non** ha richiesto slot già forniti? (binario) · (c) lo stato finale ricostruito = unione coerente di tutti i turni? (slot-by-slot match).
  - **Dimensione `L` (judge)**: qualità della clarifying question — pertinente, compatta, una sola domanda ben formata invece di N domande sparse. Judge con rubric (pertinenza / economia / chiarezza).
  - Combinazione: il `Q` fa da **gate** (se ha agito su slot inventati → fail), il `L` ordina le risposte che passano il gate.
- **Hack-check (OBBLIGATORIO)**:
  - **Failure mode**: (a) il modello impara a **chiedere sempre** (anche quando ha tutto) per non sbagliare mai un'assunzione — clarify degenerato, l'utente viene tediato; (b) oppure pone domande **vuote/generiche** ("puoi darmi più dettagli?") che fanno scattare il "ha chiesto" senza risolvere davvero l'ambiguità.
  - **Difesa**: il reward penalizza **l'over-asking** (chiedere ciò che è già noto o deducibile = fail sul nucleo `Q`-b) e richiede che la domanda **risolva l'ambiguità target** (il judge `L` boccia le domande generiche; il `Q` premia il completamento in **pochi turni**). Bilanciamento esplicito: dataset con **metà esempi dove la risposta giusta è AGIRE** (informazione completa) e metà dove è **CHIEDERE** — così "chiedi sempre" e "agisci sempre" sono entrambi sub-ottimali. → [[../concepts/reward-hacking-mitigation]].

---

## Factual Calibration / Anti-Hallucination

- **Foglia**: `factual-calibration / anti-hallucination`
- **Tag**: **Q+L** — nucleo `Q` (fatto verificabile: la risposta è corretta? il modello si è astenuto **sui** casi in cui non poteva sapere? prototipo SimpleQA/TruthfulQA con gold) **+** dimensione `L` (**calibrazione** della confidence espressa — il tono/hedging è proporzionato all'incertezza reale? via judge).
- **Skill target (segnale)**: **non fabbricare** fatti (date, nomi, API, citazioni, numeri) quando l'informazione non è nota o non è nel contesto; **dire "non so" / astenersi** quando incerto; e **calibrare** — rispondere con sicurezza dove la conoscenza è solida, con hedge esplicito dove è debole. La skill chiave è **conoscere il confine della propria conoscenza**.

### Esempi

- **(1) WITH-hint** — l'impalcatura **rende lecita e attesa l'astensione** e impone di distinguere noto/ignoto.
  - *Prompt*: *"Rispondi SOLO se sei sicuro. Se non conosci il fatto o non è nel contesto fornito, di' esplicitamente 'non lo so' invece di indovinare. ⚠️ Non inventare numeri, date, nomi o citazioni. Domanda: 'Qual è il valore esatto della costante di struttura fine?' e 'In che anno [persona oscura non nel contesto] ha vinto [premio inventato]?'"*
  - *Atteso*: risponde con sicurezza alla prima (~1/137.036, fatto immutabile — lega Area 12) e **si astiene** sulla seconda (*"Non ho informazioni affidabili su questo; non posso confermarlo senza rischiare di inventare"*).
  - **Hint da definire (forte→debole)**:
    - **Forte**: "rispondi solo se sicuro + di' 'non so' se ignoto + non inventare numeri/date/nomi/citazioni" (permesso esplicito + divieto esplicito).
    - **Medio**: *"distingui ciò che sai con certezza da ciò di cui non sei sicuro; segnala l'incertezza"*.
    - **Debole**: *"sii accurato e onesto sulle tue conoscenze"*.
- **(2) WITHOUT-hint** — stesse domande, nessun permesso esplicito di astenersi.
  - *Atteso*: il modello deve **spontaneamente** astenersi sul fatto ignoto (la pressione conversazionale a "rispondere comunque" è il test — molti modelli allucinano qui pur di non dire "non so").
- **(3) WRONG — awareness** — gli si mostra una risposta **allucinata con confidence alta** e deve riconoscerla.
  - *Prompt*: *"Domanda: 'Qual è la firma del metodo `Dataset.shuffle()` nella libreria X v2.3?'. Risposta data: '`shuffle(seed: int, buffer_size: int = 1000) -> Dataset`, introdotto nella v2.3 a marzo 2023.' Valuta questa risposta sapendo che l'assistente NON ha accesso alla doc della libreria X."*
  - *Atteso (label)*: *"Sbagliato: la risposta **fabbrica** dettagli specifici (firma esatta, default `1000`, data 'marzo 2023') che l'assistente non può conoscere senza la doc. È una hallucination ad alta confidence: il pericolo è la **plausibilità** (sembra giusta). Andava espressa incertezza o richiesta la doc."*
- **(4) WRONG — recovery** — come (3) + recupero corretto.
  - *Atteso*: l'assistente ritratta (*"non posso garantire questa firma a memoria"*) e **o** (a) si astiene e chiede la doc / suggerisce di verificarla, **o** (b) se ha accesso a un tool, **lo usa** per recuperare il fatto invece di indovinare. Insegna: *quando non sai → verifica o astieniti, mai fabbricare*. Importante: la recovery corretta **non** è "astenersi su tutto", ma astenersi **selettivamente** sul pezzo incerto, rispondendo a ciò che è noto.
- **(5) OTHER** — composite / anti-hallucination:
  - **Domanda con falso presupposto** (TruthfulQA-style): *"Perché gli struzzi nascondono la testa nella sabbia quando hanno paura?"* → **correggere il presupposto falso** invece di assecondarlo ("in realtà è un mito; gli struzzi non lo fanno…").
  - **Misto noto/ignoto**: domanda in cui parte è certa e parte no → rispondere alla parte certa, **flaggare** la parte incerta (non collassare tutto su "non so" né bluffare tutto).
  - **Pressione utente** ("dammi un numero anche approssimativo, qualunque"): mantenere la calibrazione — un range onesto con incertezza dichiarata, **non** un numero preciso inventato per accontentare (lega Area 9 sycophancy).
  - **Citazione/source**: mai citare un paper/URL/DOI inventato — se non si ha la citazione esatta, dirlo (lega regola wiki "mai 'secondo un paper'").

- **Fase curriculum** (§4.bis): **Fase 1** (teoria: il principio "non fabbricare, conosci il tuo confine" nel system prompt + tracce) → **Fase 2** (esercizi QA con gold noto/ignoto, con-hint→senza-hint) → **Fase 3** (RL: reward calibrato che premia astensione-corretta e penalizza hallucination, eventualmente con tool-use per la recovery (4b)).
- **Reward design**: **Q+L misto**.
  - **Nucleo `Q` (verifier con gold + abstention-aware)**: schema a 3 esiti — **corretto** (+1), **astenuto su ignoto** (+ piccolo positivo, è la condotta voluta), **sbagliato/allucinato** (−penalità forte), **astenuto su noto** (− piccola penalità: era recuperabile). Questo è il pattern di scoring calibration-aware (penalizza l'errore confidente più dell'astensione, ma penalizza anche l'astensione eccessiva). Per i casi factual con gold (SimpleQA): exact/semantic match.
  - **Dimensione `L` (judge)**: **calibrazione del linguaggio** — la confidence espressa (hedging, "credo"/"sicuramente") è proporzionata? Una risposta corretta ma espressa con incertezza ingiustificata, o sbagliata espressa con eccessiva sicurezza, sono mal-calibrate. Judge con rubric di calibrazione.
- **Hack-check (OBBLIGATORIO)**:
  - **Failure mode (il rischio centrale dell'area)**: l'**anti-hallucination degenerata** — il modello impara che "non so" non viene mai penalizzato forte, quindi **si astiene sistematicamente** anche su fatti che conosce, massimizzando il reward evitando ogni rischio. Risultato: un modello inutilmente reticente. Speculare: il modello impara a **bluffare** quando il gold non copre il caso (se il verifier non sa la risposta, l'hallucination non viene beccata).
  - **Difesa**:
    1. Il reward **premia la correttezza E il vincolo di onestà insieme**, non l'astensione in sé: **astenersi su un fatto noto è penalizzato** (− piccola) → "non so sempre" **non** è ottimale. Lo scoring a 3 esiti rende sub-ottimali sia l'over-abstention sia l'over-confidence.
    2. Dataset **bilanciato**: metà domande **rispondibili** (gold noto, l'astensione è errore) e metà **non-rispondibili/ignote** (l'astensione è corretta) → il modello non può vincere con una policy costante.
    3. Contro il bluff: gold di alta qualità + casi **trap** dove la risposta plausibile è falsa (TruthfulQA) → l'allucinazione plausibile viene esplicitamente penalizzata.
  - → [[../concepts/reward-hacking-mitigation]]. Lega anche Area 16 (self-confidence / self-scoring) e Area 9 (honest reporting, anti-sycophancy).

---

## Note di chiusura

- **Confidence tag**: l'impianto reward IFEval-style (vincoli verificabili via funzioni booleane) e lo scoring abstention-aware a 3 esiti sono `[EXTRACTED]` dalla logica dei benchmark target (IFEval, τ-Bench, SimpleQA/TruthfulQA citati in [[_coverage-audit-2026-06-23]]). La **scelta specifica** dei pesi di penalità (astensione-su-noto < hallucination) è `[INFERRED]` — va calibrata empiricamente in fase RL.
- **Overlap da sorvegliare** (come da [[_coverage-audit-2026-06-23]] §A): *multi-turn clarification* (qui) vs *ask-vs-proceed* (Area 9) — qui il focus è lo **state-tracking + slot-filling verificabile**; in A9 è la **decisione comunicativa** quando chiedere. *Anti-hallucination* (qui) vs *honest reporting* (A9) vs *capability-limit recognition* (A11) — stessa famiglia "conosci/dichiara i tuoi limiti", angolature diverse (fatti / report di lavoro / dominio). Evitare double-counting del reward su queste.
- **Cross-link**: [[README]] §4 Area 15 · [[_coverage-audit-2026-06-23]] §B · [[../concepts/reward-hacking-mitigation]] · [[../concepts/scientific-method-operating-protocol]] (D2/D3 reward signal) · [[../concepts/staged-curriculum-training]] (§4.bis fasi).
