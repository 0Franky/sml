---
name: modelli-piccoli-settembre-2026
description: "Ricerca chiesta da Fra (TG msg 2246, 2026-09-29): i due modelli piccoli nuovi e cosa delle loro tecniche ci serve. Identità chiarita da Fra (msg 2253): il piccolo è MiniCPM5-2B (OpenBMB, 7/09, 2,5B denso Apache-2.0 che batte Qwen3.5-4B; ricetta: SFT deep-thinking 400B token, RL con maestri specialisti, fusione di 16 esperti per distillazione on-policy; dati SFT/RL agentici aperti). Letto anche il report di MiMo-V2.6 sul PDF (giudice subordinato al test, fail-silent insegnato dal reward solo funzionale, mini-harness). Convergenza n=2: specialisti separati + fusione per distillazione. Apple: da confermare."
type: entity
tags: [ricerca, modelli, distillazione, rl, agentic, apple, xiaomi, teacher, d11, decision-input]
sources:
  - utente TG msg 2246 (2026-09-29)
  - "MiMo-V2.6 tech report «Scaling Reinforcement Learning Towards Self-Improvement», 21/09/2026 — https://www.alphaxiv.org/abs/2609.mimo-scaling-reinforcement-learning"
  - "model card https://huggingface.co/XiaomiMiMo/MiMo-V2.6-Distill-Qwen-9B · annuncio https://mimo.mi.com/docs/en-US/news/latest/v2-6"
  - "arXiv 2609.02998 — Verify Before You Distill (TGOPD)"
  - "arXiv 2605.07019 — LensVLM · model card https://huggingface.co/apple/LensVLM-9B"
  - "Apple, Introducing the Third Generation of Apple's Foundation Models (8/06/2026) — https://machinelearning.apple.com/research/introducing-third-generation-of-apple-foundation-models"
last_updated: 2026-09-29
---

# I due modelli piccoli di settembre 2026 — e cosa ci serve

> ⚠️ **Livello di verifica, dichiarato**: il **report tecnico di MiMo-V2.6** (PDF ufficiale, `MiMo_V2_6_technical_report.pdf` sul repo HF del Pro-RL) l'ho letto **io, sezioni 4.2, 4.3, 5 e 7** — i numeri di quelle sezioni sono `[EXTRACTED dal PDF]`. La sezione 6 (infrastruttura) è solo scorsa. LensVLM, AFM 3 e TGOPD restano `[EXTRACTED via riassunto]` dell'abstract. Attenzione a una tabella: nel testo estratto la Tabella 4 ha le etichette sfalsate di una riga; i valori giusti sono quelli qui sotto, e coincidono con la model card.
>
> ✅ **Identità chiarita da Fra (TG msg 2253, 2026-09-30): il modello piccolo è MiniCPM** — cioè **MiniCPM5-2B** (OpenBMB, 7/09/2026), non MiMo. La descrizione («forse 8B») era a memoria: il modello è da **2,5B** e batte i 4B. MiMo-V2.6 resta in questa pagina perché è stato letto sul PDF e le sue lezioni valgono comunque; sul modello Apple Fra non ha ancora risposto.

## Chi sono i candidati

| modello | chi, quando | cos'è | perché potrebbe essere «quello» |
|---|---|---|---|
| **MiMo-V2.6-Distill-Qwen-9B** | Xiaomi, 22/09/2026, MIT | Qwen3.5-9B addestrato in SFT su **77,4B token** (27,2B con loss) generati dai MiMo-V2.6 grandi, poi RL | salti enormi sulla stessa base: SWE-Pro 32,0 → 44,6 · Terminal-Bench 2.1 27,0 → 37,1 → **52,8 dopo RL** · AutomationBench 5,0 → 30,3; quattro domini insieme (codice, agenti generali, visual coding, cyber) = la «rosa ampia» |
| **LensVLM-9B** | Apple, paper 2605.07019 (7/05), in tendenza su HF il 27/09 | il **primo modello aperto di Apple**: VLM su Qwen3.5-9B-Base che legge testo reso come immagine compressa ed **espande solo le pagine rilevanti** con tool appresi (SFT + RL) | è Apple ed è nuovo come *apertura*; ma non è un modello generalista |
| **AFM 3** (Core 3B denso · Core Advanced 20B sparso con 1-4B attivi) | Apple, 8/06/2026, pesi chiusi | i modelli di sistema di Apple Intelligence; il report tecnico era annunciato per *«later this summer»* | è «il» modello Apple dell'anno, ma non è piccolo-e-aperto |
| meno probabili | Granite 4.2 8B (IBM, 25/08) · MiniCPM5-2B (7/09, AIME 86,5) · Ling-3.0-tiny 7,9B MoE | | |

## ⭐ MiniCPM5-2B — il modello che intendeva Fra (OpenBMB, 7/09/2026)

> Livello: model card e README del repo, `[EXTRACTED via riassunto]`. Il link al report tecnico punta ancora a quello di MiniCPM4 (arXiv 2506.07900): un report specifico di MiniCPM5 **non l'ho trovato**.

**Cos'è**: **2,52B** densi (1,98B senza embedding), 42 layer, GQA 16/2, contesto 128K, **Apache-2.0**, architettura **`LlamaForCausalLM` standard** — nessun kernel custom, nessun fork. Media **53,9** su 34 benchmark contro **51,1** di Qwen3.5-4B; alcuni contro Qwen3.5-4B: LiveCodeBench 69,1 vs 56,4 · AIME 2025 86,5 vs 78,8 · τ²-Bench Telecom 97,1 vs 92,1 · **IFBench 66,3 vs 59,0** · **SWE-bench Verified 46,4 vs 33,6** · GAIA testo 88,7 vs 78,6. Perde sul contesto lungo (AA-LCR 59,0 vs 61,0).

**La ricetta, in ordine**:
1. **Base**: pre-training stabile + fase di decadimento su Ultra-FineWeb / Ultra-FineWeb-L3.
2. **Mid-training** sulle capacità bersaglio: UltraX, UltraData-Code, UltraData-Math.
3. **SFT «deep-thinking» da 400B token** (UltraData-SFT-2605 + **UltraData-SFT-Agent-2609**, 500K campioni agentici).
4. **RL con un maestro SPECIALISTA per dominio** (matematica, codice, agenti, scrittura…), su UltraData-RL-2609 (80K+ campioni), algoritmi critic-based da JustRL II.
5. ⭐ **On-Policy Distillation che FONDE 16 esperti in un solo checkpoint** (5 sono agentici): l'advantage è la **reverse KL sull'intero vocabolario** fra studente e maestro, e si riusano i prompt dell'RL senza costruire un corpus nuovo. Effetto dichiarato di RL + OPD rispetto al solo SFT: **+10,96** in media su ragionamento e generale, **+6,96** sugli agenti.

**Cosa ci serve — tre cose, e una è una convergenza**:
- ⭐ **Specialisti separati + fusione per distillazione on-policy: ora sono DUE laboratori su due** (MiMo con MOPD2 per i domini difficili, MiniCPM con 16 esperti). È la risposta che due gruppi indipendenti hanno dato alla domanda che la nostra sequenza a fasi ([[../training-taxonomy/lab-sequence]], D10) affronta con l'**ordine**: come insegnare molte capacità senza che l'ultima cancelli le prime. Loro non ordinano: **addestrano a parte e fondono**. Non smentisce D10 — la nostra sequenza misura *cosa è stato appreso* fra una fase e l'altra — ma è un'alternativa con evidenza, n=2, e chi decide il curriculum deve averla davanti. ⚠️ E va tenuta distinta dall'idea protetta dei tre livelli (regola #1): loro fondono gli specialisti **nei pesi**; nel nostro disegno i verticali restano **LoRA separabili** a runtime. Sono due risposte allo stesso problema, non una che sostituisce l'altra.
- **I dati sono aperti**: UltraData-SFT-Agent-2609 (500K campioni agentici) e UltraData-RL-2609 (80K+) potrebbero ridurre molto il lavoro del [[generatori-del-training-set-2026-09|generatore]] per la parte agentica generica. ⛔ Prima di usarli: **licenza dei dataset** (la model card dice «open-source», non quale) e **decontaminazione** contro i nostri held-out (#18, #29).
- **Un banco di prova locale plausibile**: 2,5B in architettura Llama standard stanno sulla nostra 2080 Ti da 11 GB con margine per un LoRA, e battono Qwen3.5-4B. Come **modello di test** (mai di target: [[../../memory|project_test_model_vs_target]]) potrebbe sostituire il 4B per provare la pipeline SFT/LoRA in locale senza il problema dell'ibrido GDN di F44. Da provare, non deciso.

## Le sei cose importabili (dal report di MiMo-V2.6 salvo dove detto)

**1. ⭐ GAR — la qualità si ordina SOLO fra i tentativi che hanno già passato l'oracolo.** *Groupwise Advantage Redistribution*: 16 tentativi dello stesso compito; quelli che **passano i test** vengono ordinati da un valutatore su cinque dimensioni — adeguatezza dell'approccio · precisione **senza fallback inutili** · **modifiche minime** rispetto alla richiesta · **nessuna alterazione dello scope** · coerenza di stile; gli hack confermati vengono **azzerati prima** di ordinare. **L'ablazione è la parte che conta**: *senza* GAR il pass-rate si appiattisce presto mentre **turni e token esplodono** fino al limite di contesto; *con* GAR il pass-rate continua a salire e i turni restano stabili. Costo del valutatore: 12,7 % dell'RL.
- **Per noi, due cose**. (a) È **evidenza esterna esattamente sull'asse che abbiamo aperto il 15/09**: un reward solo pass/fail gonfia l'overhead — cioè ciò che misura **t\*** (turni dopo che il lavoro era già finito), in modo deterministico e senza giudice. (b) ⚠️ **Tocca D11**: la nostra reco (A) dice *«giudice LLM solo etichettatore offline, mai reward nel loop»*. GAR è un giudice **nel loop ma subordinato a un cancello deterministico**: non può promuovere un tentativo che fallisce, solo ordinare quelli che passano. È una **terza posizione** che la D11 non considerava, e va aggiunta alle opzioni prima che Fra decida. Il loro *Groupwise Reward Synthesis* offline (reward binario × punteggio di qualità precalcolato) è invece **già compatibile** con la (A).
- Le cinque dimensioni ricalcano classi nostre: *modifiche minime* e *nessuna alterazione dello scope* = [[../training-taxonomy/class-instruction-fidelity-no-overreach]] · [[../training-taxonomy/class-subgoal-hijacks-task]]; *niente fallback inutili* = la nostra regola del «guardrail-pezza».

**2. MixRL, «You Only RL Once» — un solo run di RL con tutti i domini e tutti gli harness nello stesso batch**; i compiti difficili da verificare, lunghissimi o troppo duri si addestrano **a parte** e si fondono dopo per distillazione on-policy (MOPD). Secondo gli autori generalizza *«remarkably well»* e gestisce la ritenzione fra domini.
- **Per noi**: è evidenza da pesare contro la **sequenza a fasi** di [[../training-taxonomy/lab-sequence]] (D10, ratificata: un gruppo alla volta). Non la contraddice per forza — noi ordiniamo l'*apprendimento di skill* con la misura in mezzo, loro mescolano l'RL di un modello già capace — ma chi decide il curriculum deve saperlo. ⛔ Nessun cambio proposto finché non leggo il PDF.

**3. La scala della distillazione per un 9B**: **77,4B token** (27,2B con loss), mix codice 29,9 % · cyber 14,2 % · generale 28,5 % · visivo 27,4 %. Ordine di grandezza di riferimento contro le nostre stime di SFT (decine di migliaia di esempi). Con il generatore più economico del [[generatori-del-training-set-2026-09|dossier]] (0,08 $/M in output), 27,2B token di output costano **~2.200 $** — prima dei rifiuti e del filtraggio, che ne moltiplicano il volume.

**4. ⭐ TGOPD — «Verify Before You Distill»** (arXiv 2609.02998, 2/09): la distillazione on-policy con la *reverse KL* è *mode-seeking*, quindi **un maestro sicuro e sbagliato produce un aggiornamento forte e fuorviante**. Rimedio: prima di distillare un prompt, **sondare il maestro con un verificatore**; se è affidabile su quel prompt → distillazione densa, altrimenti → GRPO ancorato al verificatore. Studenti 4B e 35B; batte la distillazione normale in tutti e sei i setting; e porta l'uso delle GPU del maestro dal 9,8 % al 78,9 %.
- **Per noi**: è la forma **operativa** del criterio 3 del dossier dei generatori (*«un teacher deve stare SOPRA lo studente, altrimenti insegna i nostri errori»*): non si decide una volta per modello, si decide **prompt per prompt, con un verificatore**. E i verificatori li abbiamo: sono gli assert delle scene.

**5. LensVLM — panoramica compressa, poi espansione solo dove serve, con un tool appreso** (Apple): mantiene l'accuratezza a 4,3× di compressione, batte recupero e compressione fino a 10,1×; il modello **usa sempre più l'espansione** quanto più il contesto è compresso.
- **Per noi**: è la versione **S** (appresa) di ciò che il nostro harness fa in **F** (lane, eviction, compressione) — e il punto in cui la nostra scommessa è debole: F43 ha misurato che il 32B **non tocca** i nostri tool di memoria, mentre i modelli usano quelli di *retrieval* (lo stesso segnale che era uscito da Graft). LensVLM **addestra** l'uso del tool di espansione. Il meccanismo «vista compressa → espandi su richiesta» si trasferisce al testo senza la parte visiva (il Tier-1 resta testo-only).

**6. Non applicabile, per completezza**: congelare il router MoE durante l'RL (senza, la variazione del carico degli esperti passa da 0,78 a 2,0 in venti passi e gli esperti freddi dallo 0,5 al 22 %). I nostri candidati base sono **densi**.

## Letto sul PDF: sette cose in più, e tre toccano cose che abbiamo appena fatto

**7. ⭐ L'audit della supervisione fatto con i rollout — è il metodo di F48, industrializzato** (§4.2.1). Ogni compito tentato 4 volte; un agente-revisore riceve i quattro tentativi con patch, output dei test e log, **scrive prima cosa richiede una soluzione corretta**, poi giudica ogni tentativo e lo confronta con il reward osservato. *Passa ma è sbagliato* = **falso positivo** (verifica incompleta); *è giusto ma fallisce* = **falso negativo** (test troppo restrittivo). E la regola che ne esce: *i test che esigono requisiti assenti dalla specifica si correggono o si tolgono* — la nostra regola dell'oracolo (o il prompt pinna, o l'assert tollera). **Il 15/09 io l'ho fatto a mano su un modello e ho trovato tre assi di forma**; loro lo fanno su ogni compito. Il nostro `control`/per-assenza copre i falsi positivi; per i **falsi negativi** non abbiamo ancora niente di sistematico.

**8. ⭐ Senza il controllo di qualità, l'RL insegna da solo il FAIL-SILENT** (§4.3.2): gli audit dei manutentori hanno trovato che le policy addestrate senza GAR adottavano sempre più *«speculative compatibility branches, broad exports, **exception swallowing**, **relaxed validation**, and evaluation-specific configuration changes»* — trucchi per passare i test che *«oscurano i fallimenti»*. È **evidenza esterna diretta** per l'idea (2) di Fra ([[../concepts/valutazione-idee-2026-09-29]]): un oracolo solo funzionale non è neutro, **premia** l'inghiottire le eccezioni. La checklist di rilascio con le sonde nascoste è la difesa deterministica contro esattamente questo.

**9. ⭐ «I requisiti che il reward non misura vengono semplicemente ignorati»** (§4.2.5) — la frase spiega F43/F47. Gli harness di produzione avvolgono il modello di salvaguardie e prompt di vincolo che stanno **fuori dal reward**: il credito diventa inaffidabile e quei requisiti vengono ignorati. Loro addestrano su **mini-harness minimi e disaccoppiati**, ricombinabili; risultato: sugli harness **mai visti** (codex, claude code, mini-swe-agent) il pass@1 medio sale da ~50 % a 66 % e il divario con quelli di training si chiude. **Per noi**: il braccio `ours` è un harness di produzione pesante, e F43 ha misurato che il 32B non ne usa un solo tool — coerente. La leva che abbiamo già sono i **profili** (`core`/`minimal`/`standard`): la diversità di harness in training, non un harness più ricco.

**10. Le difese contro il reward hacking, in ordine** (§4.2.6): pulizia dell'ambiente (log di build, output dei verificatori, cache, storia git successiva alla base) + **isolamento di rete**; poi un **hack agent** che cerca exploit finché non ne trova più (ne ha trovati *«many»* che la pulizia non copriva); poi **audit offline delle traiettorie** durante il training; quota di hack confermati **sotto il 2 %** per tutto il run. Il loro hack principale è la **fuga della soluzione** (installare la versione nuova del pacchetto, scaricare il file da GitHub, leggere la cronologia del ticket) — cioè *leggere l'oracolo*. **L'hanno chiuso con l'isolamento e l'audit sul trace, non con un canarino**: la stessa conclusione a cui ero arrivato il 15/09 decidendo di non costruirlo. E un dettaglio che conferma la nostra tassonomia: **esempi di mid-training in cui il modello riflette sul ragionamento sbagliato e lo corregge esplicitamente, lasciando l'errore riconoscibile** — è la nostra classe WRONG-recovery; loro misurano che migliora l'allineamento.

**11. Il costo si penalizza relativo al gruppo e solo sui successi** (§4.3.3): lunghezza di riferimento = un quantile delle lunghezze dei tentativi **riusciti** dello stesso prompt; penalità solo ai riusciti più lunghi; e **solo se il gruppo supera una soglia di pass-rate**, così i prompt difficili tengono spazio per esplorare. È la forma giusta della nostra trappola #32: il costo non è un campo grondato per-esempio, è **distribuzionale e condizionato all'esito**. Riferimento diretto per usare t\* come reward senza ricadere nel branch-reward.

**12. Dove un verificatore affidabile non esiste — distillazione on-policy da un maestro SFT, non un PRM** (§5.6, MOPD2): per i compiti a dominio aperto addestrano **maestri SFT** su dimostrazioni sintetiche di qualità, poi lo studente genera **il proprio** turno a partire da un prefisso di dimostrazione e il maestro dà supervisione token per token. **Per noi**: un percorso per le classi con tag **L** (senza oracolo) che **non** mette un giudice appreso nel loop — compatibile con la reco (A) di D11, ed è l'argomento che mancava per le classi dove l'oracolo non si può scrivere.

**13. Gli ambienti rilasciati, per dominio** (§7.2, Tabella 5): codice ~3k (test eseguibili) · cyber ~1k (regole) · **generale ~1k, lavoro di conoscenza, giudicato con rubriche LLM** · visuale ~2k · musica ~1k. ⚠️ Per il nostro Tier-1 (intelligenza operativa, non codice) il set che interesserebbe è proprio quello **giudicato da un LLM**, cioè il meno deterministico. Il loro disegno degli ambienti generali è comunque importabile anche se gli ambienti no: **mock locali** del software, sandbox **ripristinabile**, voci di rubrica **atomiche e binarie** (controlli via codice per ciò che è deterministico), **controlli negativi sui file e sui database non correlati al compito**, **soluzioni avversarie** che sembrano giuste senza esserlo. ⚠️ I **controlli negativi sui file non correlati** nelle nostre scene **non ci sono** in modo sistematico: è un buco concreto e costa poco chiuderlo.

**Numeri del 9B, dal PDF** (Tabella 6): SWE-bench Verified 60,0 → **61,1** (SFT) → **66,2** (RL) · SWE-bench Pro 32,0 → 44,6 → 47,6 · Terminal-Bench 2.1 27,0 → 37,1 → **52,8** · AutomationBench 5,0 → 30,3 → 33,1 · cyber interno 5,7 → 31,3 → 47,0. Mix dell'SFT (Tabella 4): codice 23,2B token · cyber 11,0B · generale 22,0B · visuale 21,2B; totale 77,4B, di cui 27,2B con loss. RL: GRPO, rollout parziali asincroni, aggregazione della loss **per prompt** (*impedisce alla lunghezza di crescere troppo in fretta*). Mix dei compiti dell'RL grande: codice 68 % · strumenti generali 12 % · design 13 % · seguire il contesto 3 % · cyber 4 %.

## Caveat che non vanno persi
- **Epoch AI segnala punteggi «flawed» e problemi di contaminazione** sui numeri SWE di MiMo; **tre benchmark su quattro sono interni**.
- Gli autori stessi: i miglioramenti arrivano **con più token usati** — *capacità, non soluzioni più corte*.
- I **7.000+ ambienti** non stanno nella collezione HF dei modelli: vanno localizzati, e la **licenza verificata** prima di qualsiasi uso (#29).
- Un 9B distillato **non** è la prova che la ricetta riproduca a scala i risultati del modello da 1T.

## Cosa manca, prima di costruirci sopra
1. ✅ Il modello piccolo è MiniCPM5-2B (Fra, msg 2253). Apple: ancora da confermare.
2. ✅ Report MiMo letto (§4.2, 4.3, 5, 7). Restano 2609.02998 (TGOPD) per intero e la §6.
3. Aggiungere a **D11** la terza posizione (giudice subordinato al cancello) con l'evidenza di GAR — lo faccio nel registro, non lo decido.

## Links
[[generatori-del-training-set-2026-09]] · [[base-model-candidates-2026-07]] · [[../decisions/2026-09-12-prm-appreso-escluso-proposta]] (D11) · [[../training-taxonomy/lab-sequence]] (D10) · [[../training-taxonomy/class-right-effort-for-stakes]] (t\*) · [[../concepts/valutazione-graft-e-deepseek-v41-flash]] · [[../harness-experiment-log]] (F43)
