---
name: modelli-piccoli-settembre-2026
description: "Ricerca chiesta da Fra (TG msg 2246, 2026-09-29): i due modelli piccoli nuovi — «uno di Apple» e «un ~8B straordinario per la sua taglia» — e cosa delle loro tecniche e dei loro workflow ci serve. Nomi NON ancora confermati da Fra (domanda msg 2248). Candidato principale: MiMo-V2.6-Distill-Qwen-9B (Xiaomi, 22/09), con il report tecnico del 21/09 e 7.000+ ambienti di RL pubblicati; candidato Apple: LensVLM-9B (paper di maggio, in tendenza ora). Sei cose importabili, mappate sulle nostre decisioni aperte — una delle quali tocca D11."
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

> ⚠️ **Livello di verifica, dichiarato**: tutto qui viene da **riassunti** di pagine web e abstract, letti attraverso uno strumento che riassume — **nessun PDF letto per intero** da me. I numeri sono `[EXTRACTED via riassunto]`: abbastanza per decidere **cosa** leggere e **dove** guarda, non per costruirci sopra una scelta. Prima di adottare una tecnica, il PDF.
>
> ⚠️ **Identità non confermata**: la descrizione di Fra (*«uno rilasciato da Apple e un altro, straordinario per la piccola taglia, forse 8B, la rosa delle skill ampia su tutto»*) non basta a identificarli con certezza. Domanda aperta, msg 2248.

## Chi sono i candidati

| modello | chi, quando | cos'è | perché potrebbe essere «quello» |
|---|---|---|---|
| **MiMo-V2.6-Distill-Qwen-9B** | Xiaomi, 22/09/2026, MIT | Qwen3.5-9B addestrato in SFT su **77,4B token** (27,2B con loss) generati dai MiMo-V2.6 grandi, poi RL | salti enormi sulla stessa base: SWE-Pro 32,0 → 44,6 · Terminal-Bench 2.1 27,0 → 37,1 → **52,8 dopo RL** · AutomationBench 5,0 → 30,3; quattro domini insieme (codice, agenti generali, visual coding, cyber) = la «rosa ampia» |
| **LensVLM-9B** | Apple, paper 2605.07019 (7/05), in tendenza su HF il 27/09 | il **primo modello aperto di Apple**: VLM su Qwen3.5-9B-Base che legge testo reso come immagine compressa ed **espande solo le pagine rilevanti** con tool appresi (SFT + RL) | è Apple ed è nuovo come *apertura*; ma non è un modello generalista |
| **AFM 3** (Core 3B denso · Core Advanced 20B sparso con 1-4B attivi) | Apple, 8/06/2026, pesi chiusi | i modelli di sistema di Apple Intelligence; il report tecnico era annunciato per *«later this summer»* | è «il» modello Apple dell'anno, ma non è piccolo-e-aperto |
| meno probabili | Granite 4.2 8B (IBM, 25/08) · MiniCPM5-2B (7/09, AIME 86,5) · Ling-3.0-tiny 7,9B MoE | | |

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

## Caveat che non vanno persi
- **Epoch AI segnala punteggi «flawed» e problemi di contaminazione** sui numeri SWE di MiMo; **tre benchmark su quattro sono interni**.
- Gli autori stessi: i miglioramenti arrivano **con più token usati** — *capacità, non soluzioni più corte*.
- I **7.000+ ambienti** non stanno nella collezione HF dei modelli: vanno localizzati, e la **licenza verificata** prima di qualsiasi uso (#29).
- Un 9B distillato **non** è la prova che la ricetta riproduca a scala i risultati del modello da 1T.

## Cosa manca, prima di costruirci sopra
1. La conferma di Fra su quali modelli intendeva (msg 2248).
2. I PDF: report MiMo-V2.6 (MOPD2, costruzione degli ambienti, dettagli di GAR) e 2609.02998.
3. Aggiungere a **D11** la terza posizione (giudice subordinato al cancello) con l'evidenza di GAR — lo faccio nel registro, non lo decido.

## Links
[[generatori-del-training-set-2026-09]] · [[base-model-candidates-2026-07]] · [[../decisions/2026-09-12-prm-appreso-escluso-proposta]] (D11) · [[../training-taxonomy/lab-sequence]] (D10) · [[../training-taxonomy/class-right-effort-for-stakes]] (t\*) · [[../concepts/valutazione-graft-e-deepseek-v41-flash]] · [[../harness-experiment-log]] (F43)
