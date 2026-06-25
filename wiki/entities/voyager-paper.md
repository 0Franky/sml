---
name: voyager-paper
description: Voyager (Wang et al., NVIDIA + Caltech, 2023) — primo agente embodied LLM-powered con lifelong learning in Minecraft, basato su skill library + automatic curriculum + iterative prompting.
type: paper
entity_type: paper
tags: [paper, llm-agent, embodied-ai, lifelong-learning, skill-library, curriculum-learning, gpt-4, minecraft, code-generation]
sources:
  - https://arxiv.org/abs/2305.16291
  - https://voyager.minedojo.org
  - https://github.com/MineDojo/Voyager
  - https://openreview.net/forum?id=ehfRiF0R3a
last_updated: 2026-05-21
---

# Voyager — An Open-Ended Embodied Agent with Large Language Models

## Identificativi essenziali

- **Titolo completo**: *Voyager: An Open-Ended Embodied Agent with Large Language Models*
- **Autori**: Guanzhi Wang, Yuqi Xie, Yunfan Jiang, Ajay Mandlekar, Chaowei Xiao, Yuke Zhu, Linxi Fan, Anima Anandkumar `[EXTRACTED]`
- **Affiliazioni**: NVIDIA, Caltech, UT Austin, University of Wisconsin-Madison `[EXTRACTED]`
- **Anno**: 2023 (preprint maggio 2023; revisione v2 disponibile su arXiv) `[EXTRACTED]`
- **arXiv**: [2305.16291](https://arxiv.org/abs/2305.16291) (URL verificato accessibile)
- **Sito ufficiale**: [voyager.minedojo.org](https://voyager.minedojo.org) (URL verificato accessibile)
- **Codice**: [github.com/MineDojo/Voyager](https://github.com/MineDojo/Voyager) (URL verificato accessibile)
- **Venue**: TMLR (Transactions on Machine Learning Research), inizialmente sottomesso anche a NeurIPS — OpenReview [ehfRiF0R3a](https://openreview.net/forum?id=ehfRiF0R3a) `[EXTRACTED]`

---

## Sezione 1 — Contesto: dove eravamo nel 2023 prima di Voyager

Per capire perché Voyager è considerato un punto di svolta, vale la pena fermarsi sullo stato dell'arte degli LLM-based agents nella prima metà del 2023. In quel periodo, l'ecosistema degli "agenti basati su language model" era dominato da una manciata di pattern: ReAct (che intreccia *reasoning* e *acting* in un singolo prompt loop), Reflexion (che aggiunge una memoria episodica testuale per riflettere sugli errori) e AutoGPT (un wrapper open-source che impacchettava GPT-4 in cicli ricorsivi di pianificazione e tool use). Tutti questi sistemi condividevano una proprietà strutturale: erano *task-driven*, cioè ricevevano un obiettivo specifico, cercavano di completarlo, e nulla restava in memoria a livello programmatico una volta finito.

Quello che mancava era un'architettura per **lifelong learning**: un agente che, esplorando un ambiente, accumulasse abilità riusabili senza umano nel loop, senza fine-tuning del modello, e senza un curriculum scritto a mano. Le tecniche di reinforcement learning classico (DreamerV3, IMPALA, AlphaStar) erano in grado di imparare in ambienti aperti, ma a costo di milioni o miliardi di passi di interazione, gradient updates costosi e generalizzazione limitata a domini molto simili a quello di training. La promessa degli LLM era proprio quella di *bypassare* questo bottleneck usando la conoscenza già compressa nei pesi del modello, ma nessuno aveva ancora dimostrato un agente LLM capace di accumulare in modo persistente conoscenza operativa specifica all'ambiente.

I limiti concreti del 2023 erano quindi quattro: `[INFERRED]` (sintesi dall'introduzione del paper)

1. **Task fissi**: gli agenti completavano (o fallivano) un task assegnato e ripartivano da zero per il successivo.
2. **Nessuna skill accumulation**: ogni successo si traduceva al più in qualche traccia testuale dentro la memoria conversazionale, non in artefatti riusabili come codice eseguibile.
3. **Nessuna curiosità intrinseca**: senza un goal esterno, l'agente non sapeva cosa fare. Non c'era un meccanismo per generare obiettivi autonomamente.
4. **Forgetting tra episodi**: anche con memorie esterne tipo Reflexion, l'informazione preservata era frammentaria e non strutturata.

Voyager attacca esattamente questi quattro limiti in modo elegante e (a posteriori) sorprendentemente semplice.

---

## Sezione 2 — Cosa è Voyager

Voyager è un agente embodied posato in Minecraft, con GPT-4 nel ruolo di "cervello", che esplora autonomamente il mondo, decide cosa imparare, scrive il codice per farlo, esegue il codice, riceve feedback dall'ambiente, corregge gli errori, e quando ha successo salva la routine come skill riutilizzabile. Tutto questo *senza fine-tuning del modello*, *senza human intervention*, e *senza un curriculum predefinito*. La scelta di Minecraft come ambiente non è casuale: è un mondo procedurale, infinito, con una tech tree complessa (legno → pietra → ferro → diamante → netherite), un'enorme varietà di item e creature, e — fondamentale — una API testuale ricca tramite la libreria JavaScript **Mineflayer**, che permette di scrivere bot programmaticamente. Minecraft fornisce quindi feedback strutturato (inventory, posizione, blocchi vicini, errori di esecuzione) che il modello può leggere, e un orizzonte di obiettivi sufficientemente aperto da non esaurirsi mai. `[EXTRACTED]`

L'architettura concettuale è elegantemente snella e si appoggia su tre componenti:

**(1) Automatic curriculum**. Un modulo che, a ogni iterazione, propone un nuovo sotto-obiettivo all'agente, calibrato sullo stato corrente del mondo, sull'inventario, sui successi recenti e su quello che resta da esplorare. Non è un planner gerarchico classico (tipo Hierarchical Task Network) e non è un goal sampler RL: è un prompt strutturato a GPT-4 che, dato lo stato, suggerisce "la prossima cosa interessante da fare". L'obiettivo dichiarato è "massimizzare l'esplorazione" — nuovi item, nuove zone, nuovi traguardi nella tech tree. `[EXTRACTED]`

**(2) Skill library**. È il cuore della contribuzione e dove Voyager rompe davvero col passato. Ogni volta che l'agente completa con successo un task, il codice JavaScript Mineflayer che ha portato al successo viene salvato in una libreria persistente, indicizzato tramite l'embedding vettoriale della descrizione in linguaggio naturale della skill (qualcosa tipo "craft a wooden pickaxe", "kill a zombie at night"). Quando arriva un nuovo task, le **top-5 skill più semanticamente rilevanti** vengono recuperate via similarity search e iniettate nel prompt come esempi/utility callable. La conseguenza è composizionalità: skill complesse possono richiamarne di più semplici, e l'agente cresce in capacità monotonicamente. `[EXTRACTED]`

**(3) Iterative prompting con environment feedback**. Quando GPT-4 scrive un programma per un task, raramente funziona al primo colpo. Voyager esegue il codice e raccoglie tre tipi di segnali: (a) lo stato dell'ambiente dopo l'esecuzione, (b) eventuali execution errors di JavaScript/Mineflayer, (c) una **self-verification** fatta da una seconda chiamata a GPT-4 che valuta se l'obiettivo è stato davvero raggiunto. Questo trio di feedback viene reinserito nel prompt per un nuovo round di correzione, fino a un massimo di circa quattro iterazioni. `[EXTRACTED]`

Vale la pena chiarire **cosa Voyager NON è**, perché aiuta a posizionarlo correttamente:

- **Non è RL classic**: nessun gradiente, nessun reward shaping, nessun replay buffer, nessuna policy network addestrata.
- **Non è hierarchical planning puro**: non c'è un HTN o un POMDP planner esplicito. Il "planning" emerge dal prompting strutturato.
- **Non è un agente puramente reattivo**: l'esistenza della skill library introduce esplicitamente memoria persistente con semantica operativa.
- **Non è multimodale**: Voyager originale non vede pixel di Minecraft. Riceve solo descrizioni testuali dello stato dall'API Mineflayer. Questo limite è poi attaccato dai successori (JARVIS-1, STEVE-EYE) che aggiungono visione. `[EXTRACTED]`

---

## Sezione 3 — Come funziona, walk-through di un task

Per concretizzare, prendiamo un esempio plausibile (parafrasato dal paper e dal codice del repo). Supponiamo che l'agente sia appena spawnato in un mondo nuovo, con inventario vuoto. Il loop opera circa così: `[INFERRED]` (ricostruzione dal paper + codice GitHub)

```
LOOP:
  1. state = observe_environment()
     // inventory: vuoto, biome: foresta, time: giorno, nearby_blocks: [oak_log, grass, dirt]

  2. task = automatic_curriculum.propose(state, history)
     // Prompt a GPT-4: "Dato che hai inventario vuoto e sei in una foresta,
     //  cosa dovresti fare per esplorare e progredire?"
     // → output: "obtain 3 oak logs"

  3. relevant_skills = skill_library.retrieve(task, top_k=5)
     // ricerca via embedding del task description; ritorna funzioni JS pertinenti
     // se la library è vuota → array vuoto

  4. code = action_agent.generate(state, task, relevant_skills)
     // GPT-4 scrive una funzione JavaScript Mineflayer per completare il task
     // es: async function obtainOakLogs(bot) { ... bot.dig(log) ... }

  5. result = execute(code)
     // esegue contro il server Minecraft via Mineflayer
     // raccoglie: new_state, execution_errors, console_output

  6. verified = self_verifier.check(task, new_state, code)
     // seconda chiamata GPT-4: "Ha l'agente davvero completato il task?"
     // ritorna: success | critique

  7. IF errors OR NOT verified:
        feedback = compose_feedback(errors, new_state, critique)
        // re-prompt con feedback, iter < 4
        GOTO 4
     ELSE:
        skill_library.add(description=task, code=code, embedding=embed(task))
        history.append(task, success=True)
```

Quello che rende il sistema interessante in pratica è il **compounding effect**: dopo aver imparato `obtainOakLogs`, alla prossima iterazione l'automatic curriculum potrebbe proporre "craft a crafting table", e la skill `obtainOakLogs` è automaticamente disponibile come building block riutilizzabile nel prompt. Da lì in poi la skill library cresce in modo cumulativo: `craftWoodenPickaxe` richiama `obtainOakLogs`, `mineCobblestone` richiama `craftWoodenPickaxe`, e così via, costruendo de facto una pseudo-tech-tree appresa dal basso. `[INFERRED]`

L'iterative prompting con feedback merita un'osservazione critica: il vantaggio di iterare *con* l'environment feedback (e non solo con un critic interno tipo Reflexion) è che gli errori sono *concreti* — una eccezione `bot.dig() failed: no item in hand` è infinitamente più informativa di un generico "il piano non ha funzionato". Questo riduce drasticamente le allucinazioni tipiche del LLM-as-planner. `[INFERRED]`

---

## Sezione 4 — Risultati e benchmark

I numeri principali pubblicati dal paper, contro baseline (ReAct, Reflexion, AutoGPT, tutti con GPT-4 come backend per garantire fairness): `[EXTRACTED]`

- **3.3× più item unici** scoperti (63 item unici raggiunti in 160 iterazioni di prompting, contro la frazione raggiunta dai baseline).
- **2.3× più distanza percorsa** nel mondo Minecraft (proxy di esplorazione spaziale).
- **15.3× più rapido** nel raggiungere milestone della tech tree di livello *wooden* (es. wooden pickaxe).
- **8.5× più rapido** per milestone *stone-tier*.
- Anche su milestone più avanzati (iron, diamond) Voyager domina, sebbene i fattori esatti varino.

**Zero-shot transfer a mondi nuovi**: l'esperimento più impressionante è probabilmente questo. Una volta che la skill library è stata costruita in un mondo A, Voyager viene spawnato in un mondo B completamente nuovo (seed diverso, biomi diversi, inventario vuoto, e — crucialmente — task non visti durante l'addestramento della library). Risultato: Voyager risolve tutti i task proposti entro 50 iterazioni. ReAct, Reflexion e AutoGPT con la stessa configurazione **non ne risolvono nemmeno uno**. `[EXTRACTED]` Questo è il claim più forte del paper, perché dimostra che la skill library cattura conoscenza riutilizzabile (e non semplicemente overfit a un mondo specifico).

**Riproducibilità**: il codice è pubblico su GitHub (MineDojo/Voyager), incluso il codice Mineflayer, i prompt template, e (importante) le skill library già addestrate. Questo permette replicazione anche senza spendere migliaia di dollari in token GPT-4. Detto questo, il costo originale in token GPT-4 per generare l'agente "from scratch" è significativo — un punto su cui il paper è onesto. `[EXTRACTED]`

---

## Sezione 5 — Connessione col nostro progetto

Voyager non è "un paper interessante in più": è uno dei riferimenti concettuali più diretti per quello che stiamo costruendo, anche se l'environment è completamente diverso (coding agent vs Minecraft). Mappo qui le connessioni con i nostri concept file, una per una:

**[[concepts/error-memo-system]]** — Voyager salva *codice che ha funzionato*; noi salviamo *lezioni distillate dagli errori passati*. Le due strategie sono nella stessa famiglia di idee — entrambe materializzano l'esperienza dell'agente in un artefatto persistente, indicizzato e recuperabile per task simili. La differenza è il livello di astrazione: Voyager salva la soluzione, noi salviamo il "memo del professore" su cosa evitare. Le due possono coesistere nel nostro design: skill library positiva (cose che funzionano) + error memo (cose da non rifare). `[INFERRED]`

**[[concepts/post-rl-path-optimization]]** — il principio di "impratichimento" è esattamente lo stesso. Voyager non ri-deriva da capo `obtainOakLogs` ogni volta che gli serve legno; lo richiama dalla library. Noi vogliamo che il modello, dopo aver imparato a risolvere un problema, non ri-pianifichi da zero la prossima volta che incontra qualcosa di simile, ma attinga a una rappresentazione compressa del percorso già percorso. Voyager fa questo a livello di codice testuale; noi vogliamo farlo a livello di pesi/LoRA. Stessa filosofia, granularità diversa. `[INFERRED]`

**[[concepts/task-decomposition-adhoc-context]]** — l'automatic curriculum di Voyager è di fatto un task decomposer adattivo: dato lo stato globale, decompone l'obiettivo macro ("progress through tech tree") in sotto-obiettivi specifici e contestualmente sensati. Il nostro pattern di decomposizione ad-hoc segue lo stesso principio: non un piano rigido, ma una decomposizione che tiene conto dello stato corrente del problema e di cosa è già stato fatto. `[INFERRED]`

**[[concepts/scuola-learning-philosophy]]** — Voyager incarna alla lettera il triplo "copia → capisci → migliora": *copia* dagli esempi nella skill library top-5 retrievati, *capisci* l'errore quando l'esecuzione fallisce e ne assorbe la lezione, *migliora* iterando con feedback strutturato fino a successo. È quasi un caso di studio della nostra filosofia applicata a un dominio diverso. `[INFERRED]`

**[[concepts/structured-context-sections]]** — i prompt di Voyager sono fortemente strutturati: una sezione per `state`, una per `inventory`, una per `nearby_entities`, una per `recent_actions`, una per `error_log`, una per `retrieved_skills`. Questo è esattamente il pattern che vogliamo replicare nel nostro contesto coding, dove le sezioni sarebbero `file_tree`, `current_file`, `recent_changes`, `test_output`, `compiler_errors`, `retrieved_skills`. `[INFERRED]`

---

## Sezione 6 — Pro, contro, caveat

**Pro:**

- **Open-ended e self-supervised**: nessun curriculum scritto a mano, nessun reward designer umano. L'agente si auto-suggerisce gli obiettivi.
- **Skill compositionality emergente**: skill complesse riusano skill semplici. Non è programmato, emerge dal retrieval-augmented prompting.
- **Sample efficiency relativa**: nel contesto di Minecraft, 160 iterazioni LLM sono enormemente meno di milioni di steps RL. Naturalmente "enormemente meno" va contestualizzato: 160 chiamate a GPT-4 con prompt lunghi non sono gratuite.
- **Trasferibilità**: il pattern (curriculum + skill library + iterative correction) si scolla bene da Minecraft e si applica a qualsiasi ambiente con feedback strutturato.
- **Open source completo**: prompt, codice, skill library pre-addestrate. Eccellente per ricerca.

**Contro:**

- **Dipendenza da GPT-4**: il paper è esplicito nel dire che modelli più deboli (GPT-3.5) falliscono catastroficamente nello stesso framework. Questo è un problema serio per noi che lavoriamo su SLM. Vedi anche Sezione 8. `[EXTRACTED]`
- **Costo monetario**: replicare gli esperimenti completi richiede budget GPT-4 non triviali (stime informali in community menzionano centinaia/migliaia di dollari per run completi).
- **Minecraft come dominio**: il transfer al real-world (robotica fisica, software engineering reale) non è automatico. Minecraft ha feedback discreti, perfetto state observability, niente ambiguità percettiva. Il real-world non è così.
- **Skill library può degradare**: se una skill scritta è subottimale o ha edge cases non gestiti, viene comunque salvata. Nel tempo la library può accumulare "ciarpame" che peggiora il retrieval. Il paper non affronta sistematicamente questo problema. `[INFERRED]`
- **No real-time**: ogni iterazione richiede secondi/decine di secondi di chiamata a GPT-4. Per task che richiedono reattività veloce (es. combattere mob), Voyager è lento.
- **No vision**: solo testo, niente pixel. Limite poi attaccato da JARVIS-1 (Wang et al. 2023, follow-up multimodal) e STEVE-EYE (ICLR 2024). `[EXTRACTED]`

**Limitazioni note esplicite nel paper:**

- Hard task richiedono un curriculum *molto* attento; quando il curriculum sbaglia il livello di difficoltà l'agente si blocca.
- Self-verifier può avere falsi positivi (dichiarare successo quando non c'è stato), inflazionando la skill library con codice non funzionante.
- L'ambiente deve fornire feedback strutturato leggibile; ambienti puramente visivi senza API testuale richiedono adattamenti significativi.

---

## Sezione 7 — Idee derivative per il nostro progetto

Voyager suggerisce diverse direzioni concrete e azionabili per il nostro SLM coding-specialized:

**(a) Skill library come LoRA verticali aggiunte a runtime.** Nel nostro three-tier, le skill ricorrenti del coding agent (es. "scrivere un test unitario in pytest", "implementare un endpoint REST in FastAPI", "fare migration di uno schema SQL") potrebbero materializzarsi come **LoRA verticali addestrati on-demand** e caricati a runtime quando il task corrente li richiede. Il retrieval avverrebbe sull'embedding della descrizione del task corrente vs le descrizioni delle LoRA disponibili — esattamente analogo alla skill retrieval di Voyager, ma a livello di pesi anziché di codice testuale. Questo è compatibile con la nostra architettura three-tier e con l'idea di LoraHub-style composability. Vedi [[entities/lorahub]]. `[INFERRED]`

**(b) Automatic curriculum applicato all'organization training del Tier 1.** Durante il post-training del modello orchestrator, invece di feedare task in ordine fisso, potremmo lasciare che il modello stesso (o un suo proxy debole iniziale) proponga la prossima sfida calibrata sul livello corrente. Questo crea un curriculum self-paced che potrebbe ridurre catastrophic forgetting e accelerare la generalizzazione. Vedi [[concepts/catastrophic-forgetting]]. `[INFERRED]`

**(c) Iterative prompting con env feedback = (external-update-injection) + (contradiction-detection-layer).** Quello che Voyager chiama "iterative prompting with environment feedback" è esattamente la combinazione dei nostri due research gap identificati. L'env feedback è l'**external update** (informazione di runtime che non era nel prompt iniziale). Il self-verifier che controlla se task è completato è una forma di **contradiction detection** (rileva mismatch tra goal e stato risultante). Voyager è una proof-of-concept esistente di entrambi i meccanismi, ed è già pubblicato — significa che il nostro approccio è meno speculativo di quanto sembrasse. Vedi [[concepts/external-update-injection]] e [[concepts/contradiction-detection-layer]]. `[INFERRED]`

**(d) Skill come Python code = naturale fit per coding agent.** Mentre Voyager salva JavaScript Mineflayer, il nostro coding agent salverebbe Python (o linguaggio target). La differenza è che il dominio target *è* il codice, quindi la skill library è ontologicamente coerente con l'output del sistema. Questo elimina un layer di traduzione che Voyager deve mantenere (Minecraft world ↔ JS bot). `[INFERRED]`

---

## Sezione 8 — Domande aperte per esplorazione futura

Tre questioni che il paper lascia aperte e che sono particolarmente rilevanti per noi:

**(1) Voyager funzionerebbe con un SLM <30B come backend invece di GPT-4?** Il paper riporta che GPT-3.5 fallisce nella stessa configurazione, ma GPT-3.5 era già obsoleto al momento della pubblicazione. Modelli recenti come Qwen2.5-Coder-32B, DeepSeek-Coder-V2-Lite, o Phi-4 potrebbero avere code generation capabilities sufficienti per il loop Voyager. Quanto degrada il rate di task completion? Quanto cresce il numero di iterazioni necessarie per skill? Questa è una domanda empirica che varrebbe la pena risolvere come pilot — un ablation Voyager-like con SLM coding-specialized backend sarebbe un risultato pubblicabile e direttamente informativo per il nostro design. `[INFERRED]`

**(2) Skill library cross-domain.** Voyager dimostra skill compositionality entro Minecraft. La library funzionerebbe se i task spaziassero su domini eterogenei (es. crafting + combat + farming + redstone engineering)? La struttura del retrieval embedding-based suggerisce di sì, ma il paper non fa esperimenti esplicitamente cross-domain. Per il coding, dove i sotto-domini sono numerosi (frontend, backend, DB, ML, devops, scripting), questa è una domanda critica.

**(3) Tie con MemGPT, Letta, Mem0 e l'ondata "memory papers" 2024-2025.** Voyager è del maggio 2023, prima dell'esplosione dei paper sulla memoria persistente per agenti LLM (MemGPT di Packer et al. ottobre 2023, Letta come framework derivato, Mem0 nel 2024). La skill library di Voyager è una forma di memoria *procedurale* (ricorda come fare cose), mentre MemGPT/Mem0 si concentrano su memoria *dichiarativa* (ricorda fatti, conversazioni). L'integrazione delle due famiglie — memoria procedurale + memoria dichiarativa — è ancora un'area aperta. Per noi, costruire un agente che ricordi sia "come si scrive un test pytest" (procedurale, à la Voyager) sia "il progetto X usa Postgres versione 14 con queste convenzioni di naming" (dichiarativo, à la MemGPT) è esattamente quello che vogliamo.

---

## Sezione 9 — Follow-up e critiche pubblicate

Voyager ha generato una linea di follow-up paper che lo estendono o lo criticano:

- **JARVIS-1** (Wang et al., 2023, follow-up degli stessi autori NVIDIA): estende Voyager con memoria multimodale (visione + testo), completando 200+ Minecraft task. Affronta il limite "no vision" di Voyager. arXiv 2311.05997 `[EXTRACTED]`
- **STEVE-EYE** (Zheng et al., ICLR 2024): equipaggia gli LLM-based embodied agents con percezione visiva, criticando esplicitamente la dipendenza testuale di Voyager. `[EXTRACTED]`
- **GITM (Ghost in the Minecraft)** (Zhu et al., 2023): approccio concorrente uscito poco dopo Voyager, basato su Mente strutturata + Memoria + Riflessione. Spesso citato come alternativa a Voyager. `[INFERRED]`
- **Co-Voyager** (Itakello, repo GitHub 2024): estensione collaborativa multi-agent del Voyager originale, ancora in stato di repo accademico/personale. `[EXTRACTED]`

Critica più frequente nei follow-up `[EXTRACTED]`:

- Voyager si appoggia interamente su descrizioni testuali dello stato ignorando l'osservazione visiva nativa di Minecraft, che è ricchissima.
- L'output LLM è una frase descrittiva, talvolta ambigua per derivare azioni specifiche deterministiche.
- Voyager è single-agent: non gestisce task paralleli o cooperazione umano-agente.
- Knowledge gap del modello base su Minecraft causa risposte errate e cicli di correzione lunghi.

Detto questo, *nessuna delle critiche invalida il contributo concettuale di Voyager*: la triade (curriculum + skill library + iterative prompting) resta un pattern dominante nei lavori successivi, anche quando aumentati con visione, memoria dichiarativa o cooperazione multi-agente.

---

## Sezione 10 — Sources verificati

URL verificati come accessibili (presenza confermata via search engine, maggio 2026):

- **arXiv abstract**: https://arxiv.org/abs/2305.16291 — accessibile
- **arXiv PDF**: https://arxiv.org/pdf/2305.16291 — accessibile
- **Sito ufficiale**: https://voyager.minedojo.org — accessibile, ospita demo video e sezione method
- **Codice GitHub**: https://github.com/MineDojo/Voyager — accessibile, repo attivo
- **OpenReview (TMLR)**: https://openreview.net/forum?id=ehfRiF0R3a — accessibile
- **Semantic Scholar**: https://www.semanticscholar.org/paper/Voyager:-An-Open-Ended-Embodied-Agent-with-Large-Wang-Xie/f197bf0fc2f228483f6af3285000d54d8d97f9eb — accessibile

URL secondari utili (review/blog, accessibili):

- HuggingFace papers page: https://huggingface.co/papers/2305.16291
- Arize AI paper reading: https://arize.com/blog/voyager-an-open-ended-embodied-agent-with-llms-paper-reading-and-discussion/

Follow-up paper menzionati nella Sezione 9:

- JARVIS-1: https://arxiv.org/abs/2311.05997 *(no verifiable access tested, citato da follow-up search)* `[AMBIGUOUS]`
- STEVE-EYE (ICLR 2024 proceedings): https://proceedings.iclr.cc/paper_files/paper/2024/file/a97b58c4f7551053b0512f92244b0810-Paper-Conference.pdf — segnalato accessibile via search

---

## Note di chiusura

Voyager è uno di quei paper che, in retrospettiva, sembrano *ovvi* — "ma certo, basta salvare il codice che funziona e riusarlo!" — ma che al momento dell'uscita hanno cristallizzato un pattern (lifelong skill accumulation via code + retrieval) che è poi diventato standard de facto per LLM-based agents. Per il nostro progetto vale come riferimento concettuale primario, come proof-of-concept che le idee di skill library, automatic curriculum e iterative correction *funzionano in pratica*, e come monito sui costi computazionali quando si dipende da un foundation model frontier-tier.

La domanda critica per noi non è "ha senso il pattern Voyager?" — la risposta è chiaramente sì — ma "quanto del pattern Voyager regge quando il backend non è GPT-4 frontier ma un SLM coding-specialized da noi addestrato?". È esattamente la domanda che il nostro progetto pone, e Voyager fornisce una baseline concettuale chiara contro cui misurarci.
