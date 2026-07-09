---
name: class-consequence-intention-conflict
description: Classe di training PROPOSTA (regola #18, utente msg 1177) — prima di committare un'azione/soluzione, tracciare causa→azione e azione→conseguenza e verificare che le CONSEGUENZE non contraddicano l'INTENZIONE. Il difetto: soluzioni auto-sconfiggenti (il side-effect annulla lo scopo). Gold example REALE: il mio pre-flight.
type: training-class
tags: [reasoning, metacognition, planning, causal-analysis, self-audit, area-03, area-04, held-out]
last_updated: 2026-07-05
---

# Classe di training — CONSEQUENCE↔INTENTION CONFLICT (soluzione auto-sconfiggente)

> **Stato**: PROPOSTA via regola #18 (utente msg 1177, 2026-07-05: *"le analisi di causa-azione e azione-conseguenza e vedere se le conseguenze vanno in conflitto con l'intenzione … il pre-flight che in realtà è controproducente, vorrei impedire questo"*). In attesa di conferma struttura.
> **Origine**: modo-di-fallimento REALE **mio, in questa sessione** (non del modello-sotto-test — ma è la STESSA classe di gap): ho costruito un **pre-flight** che pinga le chiavi per *risparmiare* quota, ma i ping SONO richieste extra che *bruciano* quota/RPM → la conseguenza dell'azione contraddice la sua intenzione. Auto-sconfiggente.
> **Padre**: [[class-metacognitive-self-audit]] (regola #20 — gerarchia obbligatoria). **Sorelle**: [[class-stagnation-recovery]] (audit del *progresso*), [[gold-example-transfer-assumption-audit]] / #145 (audit delle *assunzioni*); questa è l'audit della *coerenza mezzi-fini*. Vedi [[../feedback_intelligence_gap_to_training_class]].

## Il gap

Il ragionatore sceglie un'azione che serve un'intenzione dichiarata, ma **non traccia le conseguenze a valle** dell'azione → adotta una soluzione il cui **side-effect annulla lo scopo** (o lo peggiora). Non è un buco percettivo (l'intenzione è chiara) né di conoscenza (il dominio è noto): è **mancata analisi causale della propria azione** — forward (che effetti produce?) e backward (qual è la vera intenzione che sto servendo?).

## La skill (imparata una volta)

Prima di committare un'azione/soluzione non banale, eseguire un **doppio trace causale + check di coerenza**:

1. **causa→azione** (backward): *qual è la vera INTENZIONE/obiettivo* che questa azione serve? (l'obiettivo reale, non il proxy — es. "risparmiare quota", non "evitare la key morta").
2. **azione→conseguenza** (forward): quali sono gli **effetti a valle** dell'azione, inclusi i side-effect? (es. "il pre-flight fa N richieste in più").
3. **check di coerenza**: le conseguenze **servono** l'intenzione o la **contraddicono**? Se una conseguenza *annulla o peggiora* l'intenzione → l'azione è **auto-sconfiggente** → rifiutala/riprogettala (es. → tracking lazy a costo-zero).

Regola pratica: *"la cura costa più della malattia?"* / *"questa azione, come side-effect, produce esattamente ciò che voleva evitare?"*.

## Gold example (HELD-OUT di validazione — istanza osservata, NON nel training)

Il **pre-flight** di questa sessione (intenzione: risparmiare quota evitando la chiave morta → conseguenza: N ping = richieste extra che bruciano quota/RPM = *proprio ciò che voleva evitare*). Tenuto come **held-out**: se il modello impara la skill deve segnalare questo caso via transfer, non per averlo memorizzato ([[../feedback_intelligence_gap_to_training_class]], decontaminazione msg 1125).

## Transfer examples (domini DIVERSI — OBBLIGATORIO cross-campo, NON solo informatica)

> **Regola di generalizzazione** (utente msg 1186, CLAUDE.md #19): il transfer set NON deve concentrarsi in un'area (men che meno solo software) — altrimenti il modello impara "pensiero critico = cosa del codice" e **localizza** la skill invece di generalizzarla ("cosa che non deve assolutamente avvenire"). Deve spaziare **domini lontani/opposti + vita quotidiana + complessità variabile** (banale→sistemica). La classe è intrinsecamente cross-dominio: in economia/policy si chiama **perverse incentive** / **Cobra effect**.

Ogni task presenta un obiettivo + un'azione *plausibile* con una conseguenza-auto-sconfiggente nascosta; l'oracolo misura se la soluzione scelta **raggiunge davvero l'obiettivo senza innescare la conseguenza**.

### A — Software/sistemi (dove è nato il gap)
1. **Retry per affidabilità → retry-storm**: aggiungere retry aggressivi per "aumentare l'affidabilità" durante un guasto amplifica il carico e **peggiora** il guasto (cascading failure). Intenzione: affidabilità → conseguenza: meno affidabilità. Fix coerente: backoff+jitter+circuit-breaker.
2. **Rate-limiter che interroga uno store condiviso per-richiesta**: per "ridurre il carico" sul servizio, un limiter che legge un contatore su Redis a OGNI richiesta **aggiunge** il carico che doveva togliere. Intenzione: meno carico → conseguenza: più carico. Fix: token-bucket locale/in-memory.
3. **Cache per velocizzare, ma l'invalidazione costa più del risparmio**: cache-are valori che cambiano a ogni scrittura → l'overhead di invalidazione/coerenza supera il risparmio di lettura. Intenzione: più veloce → conseguenza: più lento. Fix: non cache-are (o TTL/scope adeguati).
4. **Lock per prevenire una race → deadlock**: prendere due lock in ordine incoerente per "garantire la correttezza" introduce un deadlock che blocca tutto. Intenzione: correttezza → conseguenza: hang. Fix: lock-ordering/lock-free.
5. **Compressione per risparmiare banda su payload minuscoli**: comprimere risposte da pochi byte → la CPU+overhead-header superano il risparmio di trasferimento (a volte il payload *cresce*). Intenzione: meno banda → conseguenza: più costo/latenza. Fix: soglia di dimensione minima.

### B — Vita quotidiana (scelte basilari)
6. **Scorciatoia per arrivare prima**: prendere la strada "più corta" ma piena di semafori/traffico → ci metti di più. Intenzione: risparmiare tempo → conseguenza: più tempo. Fix: valutare il tempo reale, non la distanza.
7. **Fare scorta per risparmiare**: comprare all'ingrosso cibo deperibile che scade prima di consumarlo → lo butti = spendi di più. Intenzione: risparmiare → conseguenza: spreco/più spesa. Fix: comprare per consumo reale.
8. **Caffè la sera per rendere di più**: saltare il sonno per lavorare → il giorno dopo rendi meno del tempo "guadagnato". Intenzione: più produttività → conseguenza: meno produttività netta.
9. **Urlare per far smettere di piangere**: alzare la voce con un bambino agitato → piange di più. Intenzione: calmare → conseguenza: agitare. Fix: abbassare i toni.
10. **Rimandare la piccola riparazione**: ignorare la perdita d'acqua/il dente per "risparmiare ora" → danno grosso e costoso dopo. Intenzione: risparmiare → conseguenza: costo maggiore.

### C — Scelte complesse cross-dominio (policy · ecologia · salute · business · economia)
11. **Cobra effect (canonico, India coloniale)**: taglia sui cobra per ridurne il numero → la gente li alleva per l'incentivo → più cobra alla fine della taglia. Intenzione: meno cobra → conseguenza: più cobra. È il NOME storico di questa classe.
12. **Rent control (policy/economia)**: tetto agli affitti per rendere le case accessibili → crolla l'offerta in affitto → scarsità e prezzi peggiori per chi cerca casa. Intenzione: accessibilità → conseguenza: meno case accessibili.
13. **Specie introdotta (ecologia)**: importare un predatore (rospo delle canne in Australia) per controllare un parassita → il predatore diventa un'infestazione peggiore. Intenzione: controllo → conseguenza: danno maggiore.
14. **Tagliare manutenzione/formazione per il profitto trimestrale (business)**: massimizzare l'utile a breve → guasti e turnover che costano di più a medio termine. Intenzione: più profitto → conseguenza: meno profitto.
15. **Incentivo a prestazione in sanità**: pagare per numero di prestazioni per aumentare l'accesso → sovra-trattamento, costi e danni al paziente. Intenzione: più cure → conseguenza: cure peggiori/più costose.

> Dal banale (scorciatoia) al sistemico (rent control) la **logica astratta è identica** — è QUESTO che il modello deve imparare, non il dominio.

## Reward (ANCORATO all'OUTCOME)

- **OUTCOME**: la soluzione finale **raggiunge l'obiettivo dichiarato misurabile SENZA innescare la conseguenza-auto-sconfiggente**, verificato da un oracolo *sull'effetto reale* (es. #richieste totali ≤ baseline; carico-sullo-store = 0 per-richiesta; latenza-netta < no-cache). Il pre-flight **fallirebbe** l'oracolo "#richieste ≤ baseline"; il tracking-lazy lo **passa**.
- **MAI** premiare la *cerimonia* ("analizzo le conseguenze…", "traccio causa→azione…" a parole): il credito esige l'azione che *dimostrabilmente* evita il conflitto, non la narrazione dell'analisi ([[../feedback_reward_hacking_principle]], CLAUDE.md #10).

## Label-generation

- **Mutation/oracle** (riusa [[../../harness/verifiers/deceptive-task-gen]] pattern): generare coppie {obiettivo, azione-tentante-con-side-effect-nascosto} + un **oracolo che misura la metrica-obiettivo reale** (richieste, carico, latenza, liveness). Il distrattore è l'azione plausibile-ma-auto-sconfiggente; la soluzione premiata è quella coerente.
- **Difficoltà**: il side-effect NON deve essere ovvio dal nome dell'azione (come "pre-flight" suona *protettivo*): il modello deve derivarlo dal trace forward, non da un cue lessicale.
- **Demo SFT**: traiettorie che mostrano il doppio-trace + il rifiuto dell'azione auto-sconfiggente + l'alternativa; RL sull'outcome sopra le demo.

## Hack-check (OBBLIGATORIO)

- **Cerimonia-di-analisi** (narrare "causa→azione / azione→conseguenza" senza cambiare la scelta) → 0: reward solo se l'azione finale evita *misurabilmente* il conflitto.
- **Falso-positivo di coerenza** (bocciare azioni SANE gridando "auto-sconfiggente" per lucrare il segnale) → neutralizzato: l'oracolo premia il *raggiungimento dell'obiettivo*, quindi rifiutare un'azione coerente fa mancare l'obiettivo → niente reward. Serve la terza-via che *raggiunge* il fine, non solo il "no".
- **Over-fitting all'istanza** (riconoscere solo "pre-flight/ping") → mitigato: pre-flight è held-out; il training è su 5 domini disgiunti.

## Links
[[class-metacognitive-self-audit]] (padre) · [[class-subgoal-hijacks-task]] (figlia — il MEZZO si sostituisce al FINE, da F24) · [[class-anticipation-and-irreversibility]] (figlia — anticipo-su-scelta-aperta / irreversibilità, mining #16) · [[class-stagnation-recovery]] · [[gold-example-transfer-assumption-audit]] · [[area-03-reasoning-scientific-method]] · [[area-04-context-metacognition]] · [[../feedback_reward_hacking_principle]] · [[../feedback_intelligence_gap_to_training_class]] · [[../harness-experiment-log]]
