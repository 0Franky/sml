---
name: class-temporal-awareness
description: Classe (figlia di situational-awareness) — sapere QUANDO si opera e ancorarvi le decisioni. Tre facce - (i) recency-EPISTEMICA [NUOVA, idea utente #1] - la conoscenza del modello è ferma al training-cutoff; la <current_date> iniettata dice che ORA è dopo → per i fatti VOLATILI non asserire a memoria, verifica/qualifica; (ii) staleness/TTL (leaf area-04) - un dato oltre il suo TTL va ri-fetchato; (iii) timing wait/retry (leaf area-04). Reward sul VERIFICARE (non sul conoscere il fatto) + simmetrico (non over-verificare un fatto fresco o senza-tempo).
type: training-class
tags: [reasoning, situational-awareness, temporal, epistemic-recency, staleness, area-04, child-class, held-out]
last_updated: 2026-07-09
---

# Classe (figlia) — CONSAPEVOLEZZA TEMPORALE (sai QUANDO sei)

> **Ruolo**: 1ª figlia di [[class-situational-awareness]] (radice: modello accurato della propria situazione). Àncora la dimensione **TEMPORALE**: *quando* siamo, quanto è **fresca** la mia conoscenza/i miei dati, come ragionare sul **timing**. Senza, il modello vive in un **"presente eterno"** — tratta conoscenza congelata al training-cutoff come attuale e dati datati come freschi.
> **Origine**: idea utente **msg 1473 #1** (*"voglio mostrare la data corrente o quantomeno anno-mese"*) → la parte **F** è FATTA nell'harness (l'anchor `<current_date>` iniettato in `<context>`, granularità giorno, cache-stable — [[../architecture/context-pressure-mechanism]], `harness/src/context-assembler.mjs`); questa classe è la parte **S** (cosa il modello DEVE farci). Le facce (ii)/(iii) formalizzano le leaf esistenti [[area-04-context-metacognition]] §Temporal-awareness + §Stale/TTL sotto il nuovo padre.

## Le tre facce (dimensione temporale)

### (i) Recency EPISTEMICA — la faccia NUOVA (idea #1)
La conoscenza parametrica del modello è **ferma al training-cutoff**. L'harness inietta `<current_date>` (il FATTO, F). La **skill (S)**: riconoscere che, per un **fatto VOLATILE** (prezzi, versioni software, "l'ultimo/attuale X", cariche/titolari correnti, superfici-API, listini, chi-detiene-un-record), la propria memoria **può essere obsoleta** rispetto alla data corrente → **NON asserire con sicurezza a memoria**; invece **verificare** (cercare nei doc/sul web/nei tool) o **qualificare esplicitamente** ("al mio training-cutoff era X; oggi è {data} → va verificato"). È il **ponte diretto** con la gemella [[class-confabulation-retrieval-failure]]: un fatto-volatile-ricordato-male è una confabulazione *temporale* → la disciplina è la stessa (astieniti/verifica invece di inventare). Reward sul **verificare/qualificare** (regola #22), MAI sul "conoscere il fatto" (che potremmo aver sbagliato).

### (ii) Staleness / TTL (leaf area-04, ora sotto questo padre)
Un dato letto **N tempo fa oltre il suo TTL** (codebase_tree ~1h, prezzo-mercato ~min, config-statica ∞) → **re-fetch prima di usarlo**; flaggare timestamp **incoerenti** (età negativa, `responded_at < requested_at`). Esempio-space completo in [[area-04-context-metacognition]] §Stale/TTL — non si duplica qui.

### (iii) Timing / wait-retry (leaf area-04)
Un tool `in_progress` da più della sua **latenza tipica** → wait vs retry vs declare-failed in base al tool; pianificazione latency-aware (chiamare in parallelo ciò che è lento). Esempio-space in [[area-04-context-metacognition]] §Temporal-awareness.

## La skill-target (segnale, preciso e falsificabile)

Prima di **asserire un fatto** o **usare un dato datato**, il modello **consulta la propria situazione temporale** (`<current_date>`, l'età del dato, il TTL, il tool-log) e decide: (a) fatto **senza-tempo** (matematica, definizioni, il codice-in-context) → usa la memoria liberamente; (b) fatto **volatile** oltre la propria freschezza → **verifica/qualifica** invece di asserire; (c) dato **oltre TTL** → **re-fetch**; (d) tool oltre latenza-tipica → decidi wait/retry/failed. **Falsificabile**: a valle, l'output è corretto-e-fresco (verificato) oppure sbagliato-perché-stale. Non si premia "ha menzionato la data" (participation-hack), ma che l'ancoraggio temporale **abbia evitato un errore di obsolescenza**.

**Split training-vs-harness** ([[../concepts/training-vs-harness-classification]], CLAUDE.md #11): **F-harness** = iniezione del FATTO temporale (`<current_date>` [FATTO nell'harness], `<current_time>`, timestamp del tool-log) — stato-senza-training PIENO sul dato; **S** = il ragionamento (a)-(d) sopra, INERTE senza training (il modello ignora la data e asserisce a memoria). Doppio scopo (regola #18): l'harness dà la data ORA; il training internalizza il *riflesso di recency*.

## Esempi POSITIVI (cross-dominio — regola #19)

> Logica astratta unica: *distingui il senza-tempo dal volatile; per il volatile oltre la tua freschezza, VERIFICA/QUALIFICA invece di asserire a memoria; per un dato oltre TTL, aggiornalo prima di usarlo*.

- **[A · software/tech, held-out generalizzato]** ti chiedono "qual è l'ultima versione stabile di {libreria}?" con `<current_date>` mesi/anni dopo il training-cutoff → **NON** sparare la versione ricordata; riconosci la volatilità → **cerca/verifica** (o qualifica: "al cutoff era X, verifico l'attuale").
- **[B · vita quotidiana]** pianifichi un viaggio: "gli orari dei treni delle 8" ricordati da mesi fa → sono **volatili** → controlli l'orario aggiornato, non ti fidi della memoria.
- **[C · economia/finanza]** ti serve un **prezzo/tasso** per un calcolo e l'ultimo che hai è di 2h fa (TTL ~minuti) → **re-fetch** prima di calcolare; un tasso "a memoria" dal training è certamente stale.
- **[D · salute/policy]** "le linee-guida attuali su {trattamento}" → riconosci che le linee-guida **cambiano nel tempo** → verifica l'edizione corrente invece di citare quella interiorizzata.
- **[E · timing operativo]** un `install`/build `in_progress` da 100s con latenza tipica ~2min → **aspetta** (non declare-failed); un `git status` fermo da 30s (tipico <1s) → **probabilmente bloccato** → indaga.

## Esempi NEGATIVI (regola #21 — il CONFINE: quando NON scattare)

I negativi rendono il segnale discriminativo (anti over-verify / anti recency-tic):

- **[N1 · fatto SENZA-TEMPO]** una **verità matematica/logica/definizione stabile** (2+2, l'algoritmo di quicksort, la sintassi di un costrutto) → NON serve verificare la recency: è invariante nel tempo. Trattarla come "volatile" e rifiutarsi di rispondere = over-caution penalizzata. (Confine diretto della faccia-(i).)
- **[N2 · dato FRESCO entro TTL]** un dato appena letto, entro il suo TTL → **NON** re-fetchare "per sicurezza": spreco di budget/latenza. (Simmetria della faccia-(ii): il re-fetch superfluo costa.)
- **[N3 · fatto DATO in-context]** l'informazione è **nella fixture/nel contesto corrente** (un valore in `<vars>`, un file letto ora) → è vera-per-costruzione, NON soggetta a staleness-epistemica → usala senza cerimonia di verifica-recency.
- **[N4 · timing entro latenza-tipica]** un tool `in_progress` da 5s con latenza tipica ~2min → **NON** declare-failed prematuro: è dentro la norma → aspetta.
- **[N5 · recency-tic]** premettere "considerando che la mia conoscenza è aggiornata a…" a OGNI risposta, anche su fatti senza-tempo → cerimonia penalizzata (è l'over-triggering della faccia-(i), speculare all'over-flagging metacognitivo).

## Reward (ANCORATO all'OUTCOME + SIMMETRICO)

- **Positivo** sse: fatto-volatile → il modello ha **verificato/qualificato** e l'output finale è **corretto-e-fresco** (oracolo: la risposta regge la realtà-della-fixture, o il verify-step è stato eseguito quando il fatto era marcato volatile); dato-oltre-TTL → **re-fetch** e uso del valore fresco; timing → decisione appropriata alla latenza-tipica.
- **Simmetrico**: premia ANCHE il **NON verificare** correttamente (N1-N4 → usa la memoria/il dato fresco senza cerimonia). Né "verifica-sempre" né "asserisci-sempre-a-memoria". Il costo del **verify superfluo** (N2/N5) bilancia il costo dell'**asserzione-stale** (positivi) → la skill diventa *discriminativa* sull'asse volatile-vs-senza-tempo.
- **Reward sul VERIFICARE, non sul CONOSCERE il fatto** (regola #22, [[../feedback_training_set_factual_integrity]]): per un fatto-volatile si premia il *riconoscere-la-volatilità-e-verificare*, MAI l'aver-indovinato il valore (che nella fixture potremmo aver reso volutamente incerto). Così non si premia una confabulazione fortunata.
- **Hack-check**: recency-tic / cerimonia ("controllo la data…" premesso sempre) → 0; over-verify (N2/N5) → penalizzato; default fisso ("verifica sempre" / "mai") → neutralizzato dalla simmetria. ([[../feedback_reward_hacking_principle]])

## Label-generation (mutation/oracle)

**Fixture self-contained** (regola #22): la data corrente è **DATA in-context** (`<current_date>` nel `<context>` — parità train/serve con l'harness) e ogni claim è **marcato per costruzione** come `[senza-tempo]` / `[volatile]` / `[dato-fresco]` / `[dato-stale, età+TTL]`. Oracolo:
- per `[volatile]`: PASS sse il modello **verifica/qualifica** (emette il verify-step / non asserisce con sicurezza); FAIL se asserisce a memoria.
- per `[senza-tempo]`/`[dato-fresco]`/`[dato-in-context]` (i **negativi**): PASS sse **risponde/usa senza** cerimonia di verifica; FAIL se over-verifica.
- per staleness/timing: riusa gli oracoli delle leaf area-04 (età>TTL → re-fetch; latenza → wait/retry).
**Mutazioni**: variare la distanza `<current_date>`↔cutoff; variare il TTL per tipo-di-dato (una soglia fissa fallisce); mescolare claim senza-tempo e volatili nello stesso prompt (costringe la discriminazione, non una regola globale). Bilanciamento positivi↔negativi obbligatorio. **Complessità variabile** (regola #19): dal "che versione è l'ultima" (banale) al pianificare-su-dati-con-TTL-diversi (sistemico).

## Decontaminazione (regola #18)

Qualunque istanza osservata (un fallimento di recency in un esperimento, l'eval `<current_date>`-driven) resta **held-out di validazione**. Il training usa i transfer cross-dominio §positivi/§negativi. Se il modello ha imparato la **recency epistemica**, a valle qualifica/verifica i volatili **per transfer** su domini nuovi — metrica di successo del branch idea-#1 (harness inietta la data → il modello la USA da sé).

## Links
[[class-situational-awareness]] (padre) · [[class-confabulation-retrieval-failure]] (gemella: il volatile-mal-ricordato è confabulazione temporale) · [[class-harness-environment-awareness]] (sorella) · [[class-knowledge-base-curation]] (sorella) · [[area-04-context-metacognition]] (§Temporal-awareness + §Stale/TTL — esempio-space) · [[../concepts/temporal-awareness-timestamps]] · [[../concepts/training-vs-harness-classification]] · [[../feedback_training_set_factual_integrity]] · [[../feedback_reward_hacking_principle]] · [[../feedback_transfer_always_cross_domain]] · [[../harness-experiment-log]]
