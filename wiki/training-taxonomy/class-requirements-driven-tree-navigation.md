---
name: class-requirements-driven-tree-navigation
description: Classe di training APPROVATA (utente msg 1317) — dato un obiettivo di alto livello, estrarre i requisiti/lo SCOPE e discendere una gerarchia classe→sottoclasse→…→FOGLIA fino alla foglia APPROPRIATA allo scope, invece di saltare a una foglia arbitraria o applicare sempre la stessa profondità/rigore. Include esempi NEGATIVI (regola #21) e transfer cross-dominio (regola #19). Figlia di metacognitive-self-audit.
type: training-class
tags: [reasoning, planning, decomposition, scope-awareness, hierarchical-navigation, requirements-extraction, decision-making, negative-examples, area-01, area-03, area-04, held-out]
last_updated: 2026-07-08
---

# Classe di training — NAVIGAZIONE ALBERO REQUIREMENTS-DRIVEN (salta alla foglia sbagliata / applica sempre la stessa profondità a prescindere dallo scope)

> **Stato**: **APPROVATA** (regola #18, utente msg 1317): *"il modello parte da una classe, ne estrae i requisiti, scende nella sottoclasse giusta, sempre più giù fino alla foglia corretta per la situazione — es. sito → studio UX → studio widget → ingegneria SW → coding loop → verify; e lo scope decide la foglia: usa-e-getta → no-sicurezza/no-gestione-codice, production → SSOT/DRY/services"*.
> **Padre** (rule #20): [[class-metacognitive-self-audit]] — la mossa-radice è **auditare l'assunzione-di-scope** ("a che profondità/rigore mi trovo davvero?") invece di fidarsi del default. **Sorelle / lignaggio parallelo**: [[class-constraint-fit-decision]] (la foglia è la *scelta-di-fit* del livello-di-sforzo che combacia coi requisiti) e la sua figlia [[class-resource-appropriate-substitution]]; [[gold-example-transfer-assumption-audit]] (audit dell'assunzione load-bearing, qui = lo scope).
> **Identità Tier-1**: questa è precisamente l'identità dell'orchestratore — *problem analysis & task decomposition* ([[../project_base_model_intelligence]]), non il coding (che vive nelle LoRA). La foglia È il piano decomposto; la LoRA la esegue.

## Il gap

Non è un buco **percettivo** (il modello legge la richiesta) né di **conoscenza** (sa fare i singoli passi). È un gap di **navigazione ad altezza variabile**: ricevuto un obiettivo di alto livello ("fammi un sito", "analizza questi dati"), il modello o (a) **salta diretto a una foglia arbitraria** — inizia a scrivere codice — senza estrarre i requisiti e discendere la gerarchia corretta, oppure (b) applica **sempre la stessa profondità/rigore** a prescindere dallo scope: *sempre massimo rigore* (over-engineering di un usa-e-getta) o *sempre minimo* (under-engineering di un sistema di produzione). Manca il muscolo *"riconosci la classe → estrai lo scope → discendi al ramo che matcha → fermati alla foglia giusta-per-la-situazione"*. Il difetto è che lo **scope** (effimero↔duraturo, personale↔pubblico, one-shot↔manutenuto, low↔high stakes) è una **assunzione load-bearing lasciata al default** invece di essere estratta e usata come chiave di navigazione.

## La skill (imparata una volta)

1. **Riconosci la CLASSE del problema** — a che famiglia di lavoro appartiene la richiesta (sito web, pipeline dati, fix di bug, decisione, diagnosi…). È la radice dell'albero.
2. **Estrai i REQUISITI / lo SCOPE** dalla richiesta — espliciti *e* inferiti: durata (usa-e-getta ↔ manutenuto), pubblico (te ↔ utenti reali), criticità/rischio (irrilevante ↔ pagamenti/salute), vincoli (tempo, capitale, competenza). **Questa è la mossa metacognitiva** ([[class-metacognitive-self-audit]]): non assumere la profondità, *derivala*.
3. **Discendi un livello alla volta**, e ad **ogni** nodo scegli il ramo il cui costo/rigore **combacia** coi requisiti estratti ([[class-constraint-fit-decision]]) — non il ramo di default né il più completo.
4. **Fermati alla FOGLIA appropriata allo scope** — né *sopra* (piano troppo generico/vago), né *sotto* una foglia sovradimensionata (rigore non richiesto dallo scope). La foglia È il piano.
5. **Lo scope seleziona QUALE foglia**: usa-e-getta → foglia *"no-sicurezza / no-gestione-codice / veloce"*; production → foglia *"SSOT/DRY/services/test/observability"*. Stessa classe-radice, foglia diversa perché lo scope è diverso.

Regola pratica: *"a che profondità mi porta lo SCOPE che ho estratto? — mi fermo lì, non un livello più su (vago) né uno più giù (over-engineering)"*.

## Reward (ANCORATO all'OUTCOME)

L'oracolo confronta la **foglia raggiunta** con la **foglia-target per lo scope estratto** (il piano è eseguibile-e-adeguato *per quello scope*). Premia il **fit foglia↔scope**, **MAI**:
- la **profondità** della discesa (scendere di più non è meglio),
- la **verbosità** del ragionamento di navigazione ("Classe: sito → Sottoclasse: UX → …" recitato),
- il **numero di livelli** attraversati.

Outcome misurabile e bilanciato: un usa-e-getta consegnato *production-grade* = **FAIL** (over-engineering, spreco — [[../feedback_optimization_first]]); un sito di produzione consegnato *senza SSOT/sicurezza/test* = **FAIL** (under-engineering, esito fragile). Il segnale è la correlazione discesa↔foglia-corretta, non l'atto di discendere. Vedi [[../feedback_reward_hacking_principle]] #10.

## Esempi NEGATIVI (rule #21 — il CONFINE della skill)

I due estremi della profondità sono i negativi bilanciati, più il caso "no-albero":

- **Over-descent / always-max-rigor** — script di 20 righe che gira una volta e si butta, per cui il modello impianta CI, auth, microservizi, test-suite, IaC. La foglia corretta è *quick-throwaway*; scendere alla foglia production = **FAIL** (over-engineering). La skill **NON deve** massimizzare il rigore.
- **Under-descent / always-min** — sito bancario in produzione (pagamenti, 10k utenti) trattato come throwaway: niente auth, niente SSOT, niente test. La foglia corretta è *production-hardened*; fermarsi alla foglia minimale = **FAIL**.
- **Deep-but-wrong branch** — scendere *in profondità nel ramo sbagliato* (molta discesa, foglia non-appropriata): profondità alta ma fit nullo. La risposta corretta non è "più profondo", è "il ramo che matcha lo scope".
- **Over-triggering su richiesta atomica (la skill NON deve scattare)** — richiesta già-foglia e vincolata ("cambia questo colore CSS a `#ffffff`", "quanto fa 12×8"): non c'è albero da navigare → aprire l'intera gerarchia UX→widget→engineering è **over-triggering** e va penalizzato. La risposta corretta è **agire direttamente**. Il confine: navigare una richiesta atomica è penalizzato **quanto** saltare la navigazione su un progetto grande.

> **Reward simmetrico**: non si vince né scendendo sempre al massimo (fallisce i throwaway e le richieste atomiche) né restando sempre in alto/minimale (fallisce i sistemi production). Si vince **solo** col fit foglia↔scope — stessa logica della false-block bilanciata dei gold criticality e del reward simmetrico di [[class-resource-appropriate-substitution]].

## Transfer examples (domini DIVERSI — rule #19, cross-campo NON solo software)

> **Gold / istanza-osservata (HELD-OUT, NON nel training)**: il **sito web** — *sito → estrai scope → UX → widget → ingegneria SW → coding loop → verify*; scope *usa-e-getta* → foglia *no-sicurezza/no-gestione-codice*, scope *production* → foglia *SSOT/DRY/services*. Tenuto held-out per misurare il **transfer**, non la memorizzazione ([[../feedback_intelligence_gap_to_training_class]] #18). I task sotto sono su domini **disgiunti**.

Ogni task: {descrizione + scope dato in-context} → foglia-target; l'oracolo misura il fit foglia↔scope, con almeno una variante over e una under.

### A — Software / sistemi
1. **Pipeline dati** — input-verbo identico *"analizza questi dati"*, scope diverso → foglia diversa. Scope *"esplorazione una-tantum sul mio laptop"* → foglia **notebook exploratory** (nessun test/packaging). Scope *"report che gira ogni mese in produzione per il team"* → foglia **ETL orchestrata** (config SSOT, idempotenza, test, monitoring). Over = impiantare Airflow+test per l'esplorazione una-tantum; under = un notebook non riproducibile come reporting mensile.

### B — Vita quotidiana (dal banale)
2. **Scelta ricetta per vincoli** — classe *pasto* → sottoclasse (ospiti↔da-solo, tempo, ingredienti, dieta) → foglia-ricetta. Scope *"10 minuti, da solo, stanco"* → foglia **pasta-veloce**; scope *"cena importante, ospiti celiaci"* → foglia **menu-strutturato gluten-free**. Neg-over: menu 5 portate per te-solo-stanco; neg-under: toast servito agli ospiti importanti.
3. **Troubleshooting elettrodomestico** — *"la lavatrice non parte"* → classe guasto → discendi seguendo i sintomi (alimentazione → porta/blocco → programma → pompa → scheda). Scope-sintomo *"non si accende affatto"* → ramo **alimentazione**, foglia *spina/fusibile/presa* — **non** smontare subito la scheda elettronica (over-descent alla foglia più profonda). Neg-under: ignorare un odore di bruciato dalla scheda tentando reset all'infinito.

### C — Cross-dominio sistemico (sanità · finanza)
4. **Diagnosi / triage clinico** — sintomo → categoria (cardio/resp/gastro) → sottocategoria → diagnosi (foglia); la **gravità estratta al triage** guida la profondità e il ramo. *Dolore toracico + fattori di rischio* → discesa rapida al ramo **cardiaco-urgente**, foglia *ECG+troponina immediati*; *contusione minore* → foglia *ambulatoriale*. Neg-over: TAC total-body per un raffreddore (spreco + rischio radiologico); neg-under: dimettere un infarto etichettandolo "reflusso".
5. **Piano finanziario per profilo** — cliente → classe obiettivo (pensione/liquidità/crescita) → sottoclasse (orizzonte, tolleranza al rischio, capitale) → foglia-portafoglio. *25enne, orizzonte 40 anni, alta tolleranza* → foglia **equity-heavy**; *68enne che vive di rendita* → foglia **conservativa**. Neg-over: derivati strutturati complessi per un piccolo risparmiatore avverso al rischio; neg-under: tutto in conto deposito per un giovane con orizzonte lungo (costo-opportunità).

> ≥3 dei transfer (ricetta, elettrodomestico, medico, finanziario) sono **non-software**. Dal banale (che cena preparo) al sistemico (triage, allocazione di portafoglio) la **logica astratta è identica**: *estrai lo scope, discendi al ramo che combacia, fermati alla foglia giusta-per-la-situazione — né sopra né sotto*.

## Label-generation

- **Scenari {descrizione-progetto + scope} → foglia-target**, con **tassonomia data in-context** (l'albero classe→sottoclasse→foglia è fornito nella fixture) e lo **scope esplicitato nel prompt** (*"questo gira una volta e si butta"* / *"gestisce pagamenti di 10k utenti"*). Così le fixture sono **vere-per-costruzione / self-contained** ([[../feedback_training_set_factual_integrity]] #22): l'oracolo conosce la foglia-corretta per costruzione, senza dipendere da nozioni-del-mondo — l'esempio testa la **navigazione**, non il recall.
- **Mutation (oracle, riusa [[../../harness/verifiers/deceptive-task-gen]])**: muta **SOLO lo scope** (usa-e-getta ↔ production) mantenendo la stessa classe-radice → la foglia-target **cambia**. Il modello che àncora al cue superficiale (la classe, "è un sito") invece che allo **scope** fallisce la variante mutata. Terza variante: richiesta **atomica** (→ foglia diretta, no-navigation) per addestrare il confine anti-over-triggering.
- **Coppie bilanciate** per ogni classe: ≥1 throwaway + ≥1 production + ≥1 atomica.
- **Demo SFT** (una discesa esemplare che si ferma alla foglia giusta) + **RL sull'outcome** (foglia raggiunta == target per lo scope; over/under = FAIL).

## Hack-check (OBBLIGATORIO)

- **Cerimonia / verbosità di discesa** ("Classe → Sottoclasse → Foglia …" recitato senza che la foglia matchi lo scope) → **0**. Il reward è sulla foglia-corretta, non sui passi enunciati (cerimonia→0, [[../feedback_reward_hacking_principle]]).
- **Over-triggering / always-max-depth** (scendere sempre al massimo rigore per lucrare "completezza") → neutralizzato dai **negativi throwaway + atomici** e dalla **simmetria del reward**: l'over-engineering di un usa-e-getta è FAIL.
- **Always-min / under-descent** → neutralizzato dai **negativi production**: la foglia minimale su un sistema critico è FAIL.
- **Reward-la-profondità (deep-but-wrong)** → ancoriamo alla **foglia-target**, non alla profondità raggiunta: scendere nel ramo sbagliato non paga.
- **Over-fit all'istanza-sito** → il gold *sito* è **held-out**; il training è su domini **disgiunti** (dati/cucina/elettrodomestico/medico/finanza) e la **mutation-scope** forza l'astrazione (stessa classe, scope mutato → foglia diversa) → si premia la LOGICA di navigazione, non la memorizzazione della coppia.

## Links
[[class-metacognitive-self-audit]] · [[class-constraint-fit-decision]] · [[class-resource-appropriate-substitution]] · [[gold-example-transfer-assumption-audit]] · [[class-consequence-intention-conflict]] · [[class-stagnation-recovery]] · [[area-01-organization-planning]] · [[area-03-reasoning-scientific-method]] · [[area-04-context-metacognition]] · [[../concepts/training-set-construction-principles]] · [[../concepts/compositional-curriculum-thinking-optimization]] · [[../project_base_model_intelligence]] · [[../feedback_reward_hacking_principle]] · [[../feedback_intelligence_gap_to_training_class]] · [[../feedback_transfer_always_cross_domain]] · [[../feedback_hierarchical_training_classes]] · [[../feedback_negative_examples_and_dataset_completeness]] · [[../feedback_training_set_factual_integrity]] · [[../feedback_optimization_first]]