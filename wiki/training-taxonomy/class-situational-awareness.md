---
name: class-situational-awareness
description: Classe-PADRE (radice) di training — mantenere un MODELLO ACCURATO della propria SITUAZIONE OPERATIVA e ancorare le azioni ad esso, invece di operare in un "vuoto senza contesto". Gemello-filosofico di metacognitive-self-audit (quello àudita la MENTE dall'INTERNO; questo modella l'AMBIENTE dall'ESTERNO). Figlie: consapevolezza TEMPORALE (quando siamo / recency-epistemica), consapevolezza dell'AMBIENTE-HARNESS (quali tool/lane/meccanismi ho), CURAZIONE della KNOWLEDGE-BASE (generare/usare la wiki + dove collocare le cose), AUTORITÀ-DELLA-FONTE (fatti-in-context freschi/utente > conoscenza parametrica stantia), OBIETTIVO-UTENTE & opportunità-di-valore (proporre migliorie/consigli validi oltre la richiesta letterale), POSTA/STADIO-DI-VITA del progetto (usa-e-getta↔produzione → quanto rigore/sicurezza è appropriato). Gerarchia obbligatoria (regola #20).
type: training-class
tags: [reasoning, metacognition, situational-awareness, grounding, area-01, area-04, parent-class, held-out]
last_updated: 2026-07-10
---

# Classe-PADRE (radice) — SITUATIONAL AWARENESS

> **Ruolo**: nodo-radice della gerarchia di training per la **consapevolezza situazionale** — il modello mantiene e usa un **modello accurato della propria situazione operativa** (*quando* opera, *dentro quale ambiente/con quali strumenti*, *rispetto a quale base di conoscenza e a quale collocazione*). Regola #20 (utente msg 1195): classi SEMPRE gerarchiche padre→figlia, con specializzazione ricorsiva dove merita.
> **Origine**: idee utente msg 1473 (mostrare la data corrente #1; awareness situazionale + wiki privata/centrale/di-progetto #5) + gap reali del modello (FIND-7 ri-chiama `list_secrets` già in context; F23/F33 ignora lo scaffold che descrive gli strumenti di memoria). Vedi [[../harness-experiment-log]] + [[../feedback_intelligence_gap_to_training_class]].

## La skill-RADICE (livello padre)

**Gap comune**: il modello opera come in un **"vuoto senza contesto"** — non sa *che anno/mese è* (ragiona su conoscenza congelata al training-cutoff come se fosse il presente), non sa *quali strumenti/lane il suo harness gli offre* (ri-chiama un tool il cui risultato è già in context, o allucina un tool inesistente), non sa *quale base di conoscenza esiste né dove collocare una nuova informazione* (confabula invece di consultare la wiki, o mette un fatto nel posto sbagliato). È il **duale esterno** dell'anti-reward-hacking ([[../feedback_reward_hacking_principle]]): lì "non fidarti della presentazione, àncora al ground-truth"; qui **"non operare alla cieca, àncora alla tua situazione reale"**.

**Skill radice** (imparata una volta, condivisa dalle figlie): **percepire e mantenere un modello accurato della propria situazione operativa, e ancorarvi le decisioni** — *quando* siamo, *dove/con-cosa* sto operando, *rispetto a quale conoscenza e autorità*, *qual è l'obiettivo reale e la posta*, **e chi altro sta agendo sullo stesso mondo**. Le figlie sono le **dimensioni** di questa situazione (oggi **sette** — vedi tabella; il conteggio si aggiorna a ogni figlia: un conteggio stantio è il primo sintomo di un'enumerazione incompleta, vedi la lezione in fondo alla tabella).

**Perché padre + figlie** (regola #20): le figlie condividono il trigger di *grounding* ("prima di agire, orienta te stesso nella situazione reale") — impararlo UNA volta e poi specializzare *quale dimensione* della situazione ancorare (i) evita segnale ridondante, (ii) riflette la relazione reale (sono facce dello stesso orientamento), (iii) è composizionale ([[../concepts/compositional-curriculum-thinking-optimization]]).

**Gemello-filosofico** (twin di pari livello): [[class-metacognitive-self-audit]]. I due padri si dividono il campo dell'auto-consapevolezza lungo l'asse **interno↔esterno**:

| | **metacognitive-self-audit** (INWARD) | **situational-awareness** (OUTWARD) |
|---|---|---|
| Oggetto | il proprio **ragionamento / stato cognitivo** | la propria **situazione / ambiente** |
| Domanda | "il mio *pensiero* regge il ground-truth?" | "il mio *modello della situazione* è accurato?" |
| Trigger | stagnazione, assunzione dubbia, recupero incerto | prima di agire su un contesto temporale/ambientale/di-conoscenza |
| Failure | thrashing, confabulazione, azione auto-sconfiggente | operare nel vuoto: presente-eterno, tool allucinati, mis-placement |

> Composizione: le due famiglie **si innestano**. Es.: la memoria-prospettica (metacognitive) richiede di sapere che esistono `note`/`set_var` (harness-awareness, situational) → non puoi *salvare* ciò che non sai di poter salvare. Cross-link espliciti nelle figlie.

## Le figlie (quale dimensione della situazione si ancora)

| Figlia | Dimensione | Trigger | Doc |
|---|---|---|---|
| **consapevolezza TEMPORALE** | *QUANDO* siamo (data, recency-epistemica, staleness/timing) | prima di asserire un fatto volatile / usare un dato datato / decidere wait-retry | [[class-temporal-awareness]] (+ sub-skill epistemic-recency; leaf area-04 Temporal/Stale-TTL) |
| **consapevolezza dell'AMBIENTE-HARNESS** | *DOVE / con-COSA* opero (tool, lane, meccanismi, cosa è già in context) | prima di chiamare un tool / cercare un'info / lamentare un limite | [[class-harness-environment-awareness]] (fondamento dei gemelli-memoria SAVE/RECALL) |
| **CURAZIONE della KNOWLEDGE-BASE** | *RISPETTO a quale conoscenza / DOVE collocarla* (wiki: privata/centrale/di-progetto) | quando emerge/serve conoscenza durevole da collocare o consultare | [[class-knowledge-base-curation]] (oracolo crispo: regole-di-placement date in fixture) |
| **AUTORITÀ-DELLA-FONTE** | *RISPETTO a quale conoscenza è AUTOREVOLE* (fatto-in-context fresco/dall'utente vs memoria parametrica stantia) | conflitto tra un fatto in-context e la credenza interna / dubbio-di-dominio dell'utente | [[class-context-over-parametric-authority]] (mining #5; compone con temporal-awareness [staleness] e confabulation [non-inventare]) |
| **OBIETTIVO-UTENTE & opportunità-di-valore** | *RISPETTO a quale è l'obiettivo REALE dell'utente e dove c'è valore da aggiungere* (la situazione letta dal **lato utente**, non solo il proprio contesto) | mentre eseguo un task, emerge una miglioria/consiglio genuinamente valido e di valore oltre la richiesta letterale | [[class-proactive-improvement-proposal]] (utente msg 1516; **tensione-gemella** con [[class-instruction-fidelity-no-overreach]] sull'altro padre: proponi-non-fare) |
| **POSTA VERA (stadio × blast-radius)** | *QUANTO conta davvero ciò su cui opero* — integra stadio-di-vita (usa-e-getta↔produzione) × blast-radius dell'asset, oltre l'etichetta dichiarata | prima che a valle si scelga il livello di rigore/sicurezza | [[class-project-stakes-awareness]] (utente msg 1586, approvato 1591; **VALUTA/LEGGE** la posta → **nutre** [[class-constraint-fit-decision]] `right-effort-for-stakes` che SCEGLIE il tier; reward sulla valutazione + MCQ-controfattuale; posta bidimensionale/implicita/dinamica) |
| **CHI ALTRO AGISCE (mondo condiviso)** 🆕 | *CHI ALTRO può scrivere sul mondo che osservo* — e quindi **quanto vale la mia osservazione**: la sua validità si chiude su un **EVENTO**, non sull'orologio | prima di **usare** un'osservazione fatta in passato / prima di **sovrascrivere** una risorsa che altri toccano | [[class-concurrent-world-awareness]] (utente msg 1717 + [[gap-report-2026-07-16]] gap A1 **critico**; **twin** di temporal-awareness — quella dà l'**ETÀ**, questa dà l'**EVENTO**: senza la seconda la prima è falsa sicurezza; F-harness `<recent_changes>`/`get_changelog`/`contradiction-check` **già costruita e INERTE**) |

> Se una figlia cresce (es. temporal-awareness → epistemic-recency come sotto-classe propria) si **specializza ricorsivamente** (regola #20), come `stagnation-recovery` sotto l'altro padre.
> **Nota sul confine padre**: le prime 4 figlie ancorano dimensioni del **proprio** contesto operativo; la 5ª estende l'OUTWARD al suo esito naturale — modellare la situazione *include l'obiettivo reale dell'utente*. Il suo confine "beyond-the-request" è condiviso con [[class-instruction-fidelity-no-overreach]] (INWARD): fidelity impone di non allargare lo scope da soli, proactive-proposal fornisce la valvola (surface, non imporre).
>
> ⚠️ **Lezione sull'ENUMERAZIONE di questo padre** (2026-07-16, [[gap-report-2026-07-16]] Difetto 1): la 7ª figlia è stata trovata da un gap-hunt, **non** dalla manutenzione ordinaria — perché la regola #20 era applicata **solo verso l'alto** (*ogni figlia ha un padre?* ✅) e **mai in orizzontale** (*l'enumerazione del padre è COMPLETA?* ❌). Ogni figlia era corretta; **l'insieme no**: mancava un'intera dimensione della situazione (*"il modello ragionava come se fosse l'unico scrittore e l'unico lettore dell'universo"*). Sintomo diagnostico che era lì da vedere: **il testo di questo file diceva ancora "le figlie sono le TRE dimensioni" mentre erano SEI** — il drift dell'enumerazione è il meccanismo stesso che nasconde i buchi. → **Regola operativa** (CLAUDE.md #36): aggiungendo una figlia, ri-chiedersi *"quale dimensione dell'asse NON è ancora nominata?"*, non solo *"questa figlia ha il padre giusto?"*. Vale per **ogni** padre della tassonomia, non solo questo.

## Reward (condiviso, ANCORATO all'OUTCOME)

Ogni figlia premia l'**esito ancorato-alla-situazione** (il fatto volatile è stato verificato invece che asserito a memoria / il tool giusto già-disponibile è stato usato invece di ri-derivato / la conoscenza è finita nel bucket corretto ed è ripescabile), verificato da un **oracolo**, **MAI la cerimonia** ("mi oriento nella situazione…", "controllo il mio ambiente…" a parole → 0). L'orientamento è una strategia *dimostrata* (SFT) + RL sull'outcome; il segnale è la correlazione grounding↔successo, non il conteggio delle dichiarazioni-di-awareness. Vedi [[../feedback_reward_hacking_principle]] + CLAUDE.md #10.

## Split training-vs-harness (regola #11) — trasversale alle figlie

La consapevolezza situazionale è **F-harness + S** per costruzione: l'harness **INIETTA il FATTO situazionale** (F: la `<current_date>`, la lane `<how_memory_works>`/`<resources>`, l'indice della wiki) — stato-senza-training **PIENO sul dato** (il fatto è lì, leggibile); la **skill di ragionamento su cosa il fatto implica e come agirvi** è **S** (INERTE/DEGRADATA senza training: F23/F33/FIND-7 mostrano il modello che IGNORA lo scaffold iniettato). **Doppio scopo** (regola #18): l'harness scaffolda ORA (data, tool-list, wiki-index); il training internalizza l'**uso** → lo scaffold può recedere man mano che la skill regge da sé (misurabile con l'A/B vanilla-vs-ours). ⚠ Coerente con regola #24 ([[../feedback_no_regex_patch_for_language]]): l'harness fornisce **fatti strutturali** (data, inventario tool), MAI una regex che "capisce" — l'interpretazione è del modello.

## Label-generation (delegata alle figlie)

Ogni figlia ha i propri generatori e **fixture self-contained** (regola #22: fatti veri-per-costruzione, la situazione è DATA in-context → l'esempio testa il *ragionare sulla situazione*, non il recall del mondo). Il transfer di OGNI figlia è **cross-dominio obbligatorio** (regola #19, [[../feedback_transfer_always_cross_domain]]) — non solo software. Esempi **NEGATIVI** obbligatori (regola #21): il confine dove la skill NON deve scattare (over-verifica di un dato fresco, ri-consultare ciò che si sa già, over-documentare trivia).

## Hack-check (condiviso)

- **Cerimonia** ("mi sono orientato / ho controllato la situazione" senza cambiare l'esito) → 0.
- **Over-grounding** (verificare tutto all'infinito, ri-consultare l'ovvio, documentare ogni trivia) → neutralizzato: l'oracolo premia il *raggiungimento dell'obiettivo* ancorato, con **simmetria** (over-check di un dato fresco / over-save di trivia costano) — mai l'atto di orientarsi.
- **Decontaminazione**: le istanze osservate (FIND-7, F23, F33, `EVAL_PLANT_PREF`) restano **held-out** → misurano il transfer, non la memorizzazione.

## Links
[[class-temporal-awareness]] · [[class-harness-environment-awareness]] · [[class-knowledge-base-curation]] · [[class-context-over-parametric-authority]] · [[class-proactive-improvement-proposal]] · [[class-project-stakes-awareness]] · [[class-metacognitive-self-audit]] (gemello-INWARD) · [[class-domain-categorization-routing]] (legge il TIPO della situazione-task) · [[class-prospective-memory]] / [[class-confabulation-retrieval-failure]] (memoria — compongono con harness-awareness) · [[../concepts/compositional-curriculum-thinking-optimization]] · [[area-01-organization-planning]] · [[area-04-context-metacognition]] · [[../feedback_reward_hacking_principle]] · [[../feedback_intelligence_gap_to_training_class]] · [[../feedback_transfer_always_cross_domain]] · [[../harness-experiment-log]]
