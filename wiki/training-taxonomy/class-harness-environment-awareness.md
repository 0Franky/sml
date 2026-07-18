---
name: class-harness-environment-awareness
description: Classe (figlia di situational-awareness) — mantenere un modello accurato del PROPRIO AMBIENTE OPERATIVO (quali tool/lane/meccanismi offre l'harness, cosa è GIÀ in context) e ancorarvi le azioni. Gap reale - FIND-7 (ri-chiama list_secrets il cui inventario è già in context), F23/F33 (ignora lo scaffold <how_memory_works> che descrive note/jot). È il FONDAMENTO dei gemelli-memoria (non puoi SALVARE se non sai che esiste note; non puoi RECUPERARE se non sai di get_conversation). Reward - usa l'affordance giusta già disponibile invece di ri-derivare/allucinare un tool; simmetrico (non ri-chiamare ciò che è già in context, non over-esplorare l'ambiente per un task banale).
type: training-class
tags: [reasoning, situational-awareness, harness-awareness, tool-use, affordances, area-04, child-class, parent-class, held-out]
last_updated: 2026-07-11
---

# Classe (figlia) — CONSAPEVOLEZZA DELL'AMBIENTE-HARNESS (sai DOVE / con-COSA operi)

> **Ruolo**: 2ª figlia di [[class-situational-awareness]]. Àncora la dimensione **AMBIENTE**: *quali strumenti, lane e meccanismi* l'harness mi offre, e *cosa è già presente* nel mio context. È il **FONDAMENTO** dei gemelli-memoria: [[class-prospective-memory]] (SAVE) e [[class-confabulation-retrieval-failure]] (RECALL) presuppongono che il modello **sappia** che esistono `note`/`jot`/`set_var` (per salvare) e `get_conversation`/`recall_lessons` (per recuperare) — *non puoi salvare ciò che non sai di poter salvare, né recuperare da uno store che non sai esista*. Composizione esplicita (regola #20, [[../concepts/compositional-curriculum-thinking-optimization]]).
> **Origine** (gap reali, [[../harness-experiment-log]]): **FIND-7** — il modello ri-chiama `list_secrets` più volte benché l'inventario sealed sia GIÀ nella lane `<secrets>` del context (fix harness: mostrarlo; ma la skill mancante è *leggerlo*). **F23/F33** — il modello IGNORA lo scaffold `<how_memory_works>` che descrive gli strumenti di memoria e fa 0 `note`. Il filo comune: **non mantiene un modello del proprio ambiente** → agisce come se le affordance non ci fossero.

## Il gap

Il modello opera **senza un modello del proprio harness**: (a) **ri-chiama un tool** il cui risultato è **già in context** (FIND-7: `list_secrets` × N — spreco di turni + rumore); (b) **allucina un tool inesistente** (chiama `save_memory` quando lo strumento si chiama `note`) o inventa parametri; (c) **si lamenta di un limite** che l'harness già risolve ("non ricordo i turni precedenti" mentre la lane `<messages_with_user>` e `<last_tool_calls>` glieli mostrano); (d) **ignora un'affordance** che gli servirebbe (non salva perché "non sa" di `note`, benché descritto in `<how_memory_works>`). Non è un buco di conoscenza-del-mondo: **l'ambiente è DESCRITTO nel context** (tool-list, `<resources>`, `<how_memory_works>`). È un buco di **grounding ambientale**: leggere e usare ciò che l'ambiente offre, invece di operare alla cieca.

## La skill-target (segnale, preciso e falsificabile)

Prima di agire, il modello **consulta il modello del proprio ambiente** (la tool-list disponibile, le lane del context, cosa è già presente) e: (1) **usa l'affordance giusta già disponibile** (il tool corretto per il compito; l'info già in una lane invece di ri-fetcharla); (2) **non allucina** tool/parametri inesistenti — se manca lo strumento, lo **dichiara** invece di inventarlo (astensione, gemella di [[class-confabulation-retrieval-failure]]); (3) **non ri-deriva/ri-chiama** ciò che è già in context. **Falsificabile**: a valle, l'azione ha usato l'affordance corretta e disponibile (task avanza) oppure ha sprecato un turno / fallito perché ha ignorato/allucinato l'ambiente. Non si premia "ha elencato i suoi tool" (participation-hack), ma che il grounding ambientale **abbia prodotto l'azione giusta**.

**Split training-vs-harness** ([[../concepts/training-vs-harness-classification]], CLAUDE.md #11): **F-harness** = iniezione della descrizione-ambiente (tool-list; `<how_memory_works>`/`<resources>`/`<secrets>` — lo **scaffolding-crutch** registrato da `slm.ts`, letto lazy per-turno) — stato-senza-training **PIENO sul dato** (la descrizione è lì); **S** = *leggerla e agirvi*, **INERTE senza training** (FIND-7/F23/F33 = descrizione presente, ignorata). **Doppio scopo** (regola #18): l'harness scaffolda ORA (mostra tool+lane+inventario); il training internalizza l'uso → man mano che la skill regge, lo **scaffold-crutch può recedere** (meno `<how_memory_works>` verboso) — misurabile con l'A/B vanilla-vs-ours (il gap si chiude se il training funziona). ⚠ Coerente con regola #24: l'harness fornisce fatti **strutturali** (nomi-tool, lane), l'interpretazione è del modello.

## Esempi POSITIVI (cross-dominio — regola #19)

> Logica astratta unica: *orientati alle affordance che l'ambiente offre PRIMA di agire; usa lo strumento/l'informazione giusti già disponibili invece di ri-derivarli, e se un'affordance manca dichiaralo invece di inventarla*.

- **[A · software/harness, il caso nativo held-out]** l'inventario dei secret / la storia dei turni / le lezioni-memo sono **già** in una lane del context → **usali** (leggi `<secrets>`, `<messages_with_user>`, `recall_lessons`) invece di ri-chiamare `list_secrets` o dichiarare "non ricordo" (anti FIND-7/F23).
- **[B · cucina]** prima di improvvisare, **guardi quali utensili/ingredienti hai** in cucina → usi la pentola giusta che è nel cassetto, non ne "immagini" una che non possiedi né vai a comprarne una identica.
- **[C · nuovo lavoro/onboarding]** un neoassunto **impara quali sistemi/help-desk/procedure esistono** prima di reinventarli → apre un ticket al reparto giusto invece di ricostruire da zero un processo che l'azienda ha già.
- **[D · biblioteca/ricerca]** usi il **catalogo** (l'affordance) per trovare un volume invece di scandire gli scaffali alla cieca; se il catalogo non copre un fondo, **chiedi al bibliotecario**, non "inventi" una collocazione.
- **[E · officina/strumenti]** controlli **quali attrezzi hai nella cassetta** prima di forzare una vite con l'attrezzo sbagliato; se manca la chiave giusta lo dichiari, non fingi di averla.

## Esempi NEGATIVI (regola #21 — il CONFINE: quando NON scattare)

- **[N1 · affordance ASSENTE → dichiara, non allucinare]** il task richiede uno strumento che l'ambiente **non offre** → la risposta corretta è **dichiararlo** ("non ho un tool per X, propongo Y") — NON inventare un nome-tool plausibile. (Confine speculare a confabulation: astieniti invece di confabulare l'affordance.)
- **[N2 · dato in-context STALE → ri-fetch è GIUSTO]** un dato è in una lane MA è **oltre il suo TTL** (temporal, faccia-ii) → ri-fetcharlo NON è un errore di ambiente: è la decisione corretta. "Non ri-chiamare ciò che è in context" **non è assoluto** → il discriminante è *freschezza*, non *presenza*. (Legame [[class-temporal-awareness]].)
- **[N3 · over-orientamento per task banale]** per un compito di una riga, spendere turni a **catalogare l'intero toolset/leggere ogni lane** → cerimonia penalizzata (over-grounding). L'orientamento è **proporzionale** al compito.
- **[N4 · affordance-tic]** premettere "controllo i miei strumenti disponibili…" a ogni azione anche ovvia → cerimonia → 0.

## Reward (ANCORATO all'OUTCOME + SIMMETRICO)

- **Positivo** sse: il modello ha **usato l'affordance corretta e disponibile** (tool giusto / info-già-in-context) e l'azione è **andata a buon fine** (oracolo: task avanzato / risposta corretta usando la risorsa presente), oppure — quando l'affordance manca — l'ha **dichiarato** invece di allucinarla.
- **Simmetrico**: premia ANCHE il **non-agire ambientale corretto** (N1 dichiara-assenza, N3 non-over-esplorare). Penalizza sia **ignorare/ri-derivare** un'affordance presente (FIND-7) sia **allucinare** una assente (N1) sia **over-orientarsi** (N3). Né "esplora-sempre-tutto" né "ignora-l'ambiente".
- **Hack-check**: affordance-tic / "elenco i miei tool" senza usarli → 0; over-orientamento (N3) → penalizzato; ri-chiamare-per-partecipare → 0 (àncora all'outcome). ([[../feedback_reward_hacking_principle]])

## Label-generation (mutation/oracle)

**Fixture self-contained** (regola #22): l'ambiente è **DATO in-context** — un `<resources>`/tool-list + lane popolate (`<secrets>`, `<messages_with_user>`, `<vars>`) + una situazione. Oracolo:
- affordance-presente → PASS sse usa il tool/lane corretto; FAIL se ri-chiama/ri-deriva ciò che è già lì.
- affordance-assente (**negativo N1**) → PASS sse dichiara l'assenza; FAIL se allucina un tool.
- dato-in-context-ma-stale (**negativo N2**) → PASS sse ri-fetcha (non "riusa a memoria").
**Randomizzazione anti-overfit** (cruciale): **variare il toolset descritto** epoch-by-epoch (nomi/insieme dei tool cambiano) → il modello impara a **LEGGERE la descrizione**, non a memorizzare un set fisso ([[../concepts/runtime-symbol-randomization-training]] + [[../concepts/dynamic-context-training-regime]]). Distrattori: tool-simili-ma-sbagliati (esca), lane con l'info in posizione variabile (ponte needle/dynamic-context area-04). Bilanciamento positivi↔negativi obbligatorio.

## Decontaminazione (regola #18)

Le istanze osservate (**FIND-7** list_secrets · **F23/F33** scaffold-memoria ignorato) sono **held-out di validazione**, NON nel training. Il training usa i transfer cross-dominio §positivi/§negativi con toolset randomizzato. Se il modello ha imparato il **grounding ambientale**, a valle: legge l'inventario invece di ri-chiamare, usa `note` quando serve, dichiara un tool-assente invece di allucinarlo — **per transfer**. È anche la metrica di successo del *doppio scopo* harness→training (lo scaffold-crutch recede quando la skill regge).

## Facet aggiuntivi (mining Stage-2, 2026-07-10) — lato-S del twin con [[../concepts/harness-tool-affordance-design]]

Il concept-harness (lato-F) fornisce le affordance; questa classe (lato-S) internalizza il **saperle sfruttare**:
- **Visibility ≠ callability** (#1): il modello sa che un tool **non-mostrato** nella lista può essere **comunque chiamato** — non conclude "non esiste" dall'assenza dalla surface (fallimento speculare all'allucinare-un-tool: qui *sotto*-stimare l'inventario reale).
- **Access-by-intent / recupero out-of-bound** (#8): davanti a una lane troncata (`"+N nascosti"`) il modello **espande/recupera** ciò che gli serve invece di trattare il troncato come esaustivo o rinunciare.
- **Isolamento delle risorse per-progetto** (#3): riconoscere i **confini** delle proprie risorse (env/token/identità/state-dir) e non incrociare la config di un progetto con un altro — dimensione "conosci-il-tuo-ambiente" applicata all'isolamento. Vedi memory `feedback_isolate_parallel_project_resources`.

Reward invariato (outcome + simmetrico): premia l'uso-corretto-dell'affordance (espande quando serve / chiama il tool giusto anche se non-listato / rispetta i confini), penalizza sia il sotto-uso (rinuncia/allucina) sia l'over-uso (espande l'ovvio, over-isola).

## Figlia (sotto-specializzazione ricorsiva — regola #20)

Da fondamento delle affordance, questa classe è ora a sua volta **padre** di una specializzazione sul sotto-dominio dei **canali di persistenza** (write-routing):

| Figlia | Cosa specializza | Origine | Doc |
|---|---|---|---|
| **DISCIPLINA DEI CANALI DI MEMORIA** (metti il dato nel canale GIUSTO) | dall'affordance-awareness generale al **write-routing** semanticamente corretto: durevole→`note`/`<facts>` (self-contained) · di-lavoro→`jot`/`<scratch>` · strutturato→`set_var`/`<vars>` | qualitative-review 2026-07-11 (gap **più citato** dai 3 modelli capaci; training-insight **T1**) | [[class-memory-lane-tool-discipline]] |

> Colloca un gradino **sopra** "sai che i canali esistono" (questo padre) e un gradino **sotto** "salvi il dato giusto" (gemelle-memoria [[class-prospective-memory]] SAVE / [[class-confabulation-retrieval-failure]] RECALL): il mis-routing in SCRITTURA qui **causa** a valle il retrieval-failure che le gemelle gestiscono.

## Links
[[class-situational-awareness]] (padre) · [[class-memory-lane-tool-discipline]] (FIGLIA — sotto-specializzazione write-routing dei canali di memoria) · [[../concepts/harness-tool-affordance-design]] (twin lato-F) · [[class-prospective-memory]] (SAVE — presuppone di sapere che esiste `note`) · [[class-confabulation-retrieval-failure]] (RECALL — presuppone di sapere gli store; astensione condivisa su affordance-assente) · [[class-temporal-awareness]] (sorella — freschezza vs presenza) · [[../concepts/runtime-symbol-randomization-training]] · [[../concepts/dynamic-context-training-regime]] · [[../concepts/training-vs-harness-classification]] · [[area-04-context-metacognition]] · [[../feedback_reward_hacking_principle]] · [[../feedback_transfer_always_cross_domain]] · [[../harness-experiment-log]] (FIND-7, F23, F33)
