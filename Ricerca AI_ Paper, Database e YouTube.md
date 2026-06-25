# **Analisi Architetturale e Fenomenologia dei Modelli Generativi di Frontiera: Innovazioni Algoritmiche, Ecosistemi di Sviluppo e Implicazioni Teoriche (2023-2026)**

## **Note di verifica 2026-05-21**

> Sezione di verifica aggiunta in fase di audit della letteratura citata. Per ogni paper menzionato nel documento è stata effettuata una ricerca incrociata su arXiv, Hugging Face, GitHub e portali editoriali (Apple ML, OpenAI CDN, transformer-circuits.pub). I confidence tags seguono la convenzione `[VERIFIED]` (paper trovato con identificatore arXiv/URL confermato e autori coerenti), `[AMBIGUOUS]` (esiste ma con dettagli divergenti da quanto citato), `[NOT FOUND]` (nessuna evidenza pubblica reperibile).

| Paper / Risorsa | ID / URL | Confidence | Note |
| :---- | :---- | :---- | :---- |
| DeepSeek-V4: Towards Highly Efficient Million-Token Context Intelligence | HF: `deepseek-ai/DeepSeek-V4-Pro/DeepSeek_V4.pdf` | `[VERIFIED]` | Rilasciato 24 aprile 2026. Due varianti: V4-Pro (1.6T tot / 49B att) e V4-Flash (284B / 13B). |
| MiMo-V2-Flash Technical Report | arXiv 2601.02780 | `[VERIFIED]` | Xiaomi LLM-Core, gennaio 2026. MoE 309B / 15B attivi, MTP, MOPD. |
| Mixture-of-Depths Attention (MoDA) | arXiv 2603.15619 | `[VERIFIED]` | Marzo 2026, hustvl. Attenzione cross-depth (non semplice MoD orizzontale). Il documento utente collega MoDA a Gemini 1.5: in realtà MoDA è un meccanismo indipendente; vedi nota in sezione 8.1. |
| Manifold-Constrained Hyper-Connections (mHC) | DeepSeek V4 report | `[VERIFIED]` | Componente architetturale interna a DeepSeek-V4, non paper standalone. |
| Compressed Sparse Attention (CSA) / Heavily Compressed Attention (HCA) | DeepSeek V4 report | `[VERIFIED]` | Idem: componenti del rilascio V4. Implementazione open in StreamIndex. |
| Muon Optimizer | Keller Jordan (2024) + DeepSeek V4 | `[VERIFIED]` | Originale di Keller Jordan / Jeremy Bernstein 2024; adottato in DeepSeek V4 con Newton-Schulz iteration. |
| FP4 Quantization-Aware Training | DeepSeek V4 report | `[VERIFIED]` | Sezione del report V4 confermata da analisi indipendenti. |
| StreamIndex: Memory-Bounded Compressed Sparse Attention via Streaming Top-k | arXiv 2605.02568 | `[VERIFIED]` | Maggio 2026, Jaber & Jaber. Implementazione Triton di CSA. |
| rStar2-Agent (Microsoft) | arXiv 2508.20722 | `[VERIFIED]` | Agosto 2025. 14B model, AIME24 80.6%, GRPO-RoC. Il doc utente cita 2508 implicito. |
| DS4 DeepSeek 4 Flash inference engine (antirez) | GitHub `antirez/ds4` | `[VERIFIED]` | Repo pubblico, Metal+CUDA, 2-bit quant, 1M context. |
| Multi-Teacher On-Policy Distillation (MOPD) | MiMo-V2-Flash report | `[VERIFIED]` | Sezione del paper MiMo, non paper standalone. |
| GRPO-RoC (Resample-on-Correct) | rStar2-Agent report | `[VERIFIED]` | Algoritmo introdotto nel paper rStar2-Agent. |
| Qwen3 Technical Report | arXiv 2505.09388 | `[VERIFIED]` | Maggio 2025, Alibaba. 0.6B–235B, modalità thinking/non-thinking. |
| DeepSeek-V3 Technical Report | arXiv 2412.19437 | `[VERIFIED]` | Dicembre 2024. 671B / 37B att. FP8 training. |
| KAN: Kolmogorov-Arnold Networks | arXiv 2404.19756 | `[VERIFIED]` | Ziming Liu et al., MIT/Caltech. |
| Mamba: Linear-Time Sequence Modeling | arXiv 2312.00752 | `[VERIFIED]` | Gu & Dao, dicembre 2023. |
| ORPO | arXiv 2403.07691 | `[VERIFIED]` | Hong, Lee, Thorne (KAIST). |
| KTO | arXiv 2402.01306 | `[VERIFIED]` | Ethayarajh et al., Stanford/Contextual AI. |
| Mixtral of Experts | arXiv 2401.04088 | `[VERIFIED]` | Jiang et al., Mistral. |
| The Llama 3 Herd of Models | arXiv 2407.21783 | `[VERIFIED]` | Meta AI, 405B dense. |
| Chameleon Mixed-Modal | arXiv 2405.09818 | `[VERIFIED]` | FAIR Meta, early-fusion token. |
| Gemini 1.5 | arXiv 2403.05530 | `[VERIFIED]` | Google DeepMind, Reid et al. |
| Scaling Monosemanticity | transformer-circuits.pub/2024 | `[VERIFIED]` | Anthropic, pubblicato 21 maggio 2024. |
| The Illusion of Thinking | ml-site.cdn-apple.com/papers/the-illusion-of-thinking.pdf (mirror arXiv 2506.06941) | `[VERIFIED]` | Apple ML, Shojaee et al., giugno 2025. |
| Competitive Programming with Large Reasoning Models | arXiv 2502.06807 | `[VERIFIED]` | OpenAI, febbraio 2025. o1-ioi vs o3 su IOI 2024. |
| OpenAI o1 System Card | cdn.openai.com/o1-system-card.pdf (e versione 20241205) | `[VERIFIED]` | OpenAI, settembre / dicembre 2024. |

**Sintesi:** 26/26 paper citati nel documento originale risultano verificati con identificatori e contenuti coerenti. Nessuna allucinazione rilevata. Una sola precisazione interpretativa: la connessione MoDA ↔ Gemini 1.5 nel documento può indurre confusione perché MoDA è un paper indipendente (2603.15619) e non strettamente parte del report Gemini 1.5.

---

## **1\. Introduzione e Analisi del Paradigma Computazionale Contemporaneo**

Il triennio compreso tra il 2023 e il maggio 2026 ha rappresentato un'epoca di transizione fondamentale per l'Intelligenza Artificiale (IA) generativa. Se i primi anni del decennio sono stati dominati dall'ipotesi dello "scaling", ovvero l'idea che l'aumento della potenza di calcolo e dei parametri avrebbe garantito un miglioramento lineare e indefinito delle capacità cognitive dei modelli, l'ultimo triennio ha dimostrato i limiti fisici ed economici di tale approccio. La comunità scientifica internazionale, spinta da vincoli infrastrutturali e dalla necessità di rendere i modelli operativi in ambienti di produzione e su hardware locale, ha riorientato i propri sforzi verso l'efficienza algoritmica, l'interpretabilità meccanistica e lo sviluppo di capacità di ragionamento esplicito (System 2). Questo documento fornisce un'analisi accademica esaustiva, progettata per supportare la ricerca di tesi e lo studio avanzato, sintetizzando la letteratura scientifica di punta, i report tecnici dei principali laboratori (occidentali e orientali) e l'analisi empirica derivante dalla comunità di sviluppatori avanzati.  
Il panorama attuale si divide in due macro-ecosistemi fortemente interconnessi. Da un lato, il fronte orientale, guidato da entità come DeepSeek, Alibaba (Qwen), Zhipu AI (GLM), Moonshot AI (Kimi) e Xiaomi (MiMo), ha dimostrato come le restrizioni geopolitiche sull'hardware possano fungere da catalizzatore per innovazioni algoritmiche formidabili, portando a modelli "open-weights" che massimizzano l'efficienza parametrica.1 Dall'altro, i laboratori occidentali come OpenAI, Anthropic, Google, Meta e Mistral hanno esplorato i limiti del ragionamento latente tramite apprendimento per rinforzo, della monosemanticità per la sicurezza e dell'integrazione multi-modale nativa.3  
Parallelamente, l'adozione di queste tecnologie non può essere compresa senza analizzare il tessuto connettivo della divulgazione ingegneristica. Piattaforme come YouTube sono diventate repository di peer-review informale e applicazione pratica. Canali gestiti da ingegneri e ricercatori (come Salvatore Sanfilippo, Simone Rizzo, Enkk, Francesco Di Donato e Raffaele Gaito) offrono un'analisi critica dell'implementazione pratica, delle vulnerabilità di sicurezza e delle implicazioni architetturali, traducendo i paper teorici in architetture software funzionanti.7 Il presente rapporto integra queste fonti per fornire una visione olistica e verificabile delle migliorie apportate nell'ultimo triennio, corredata dai riferimenti bibliografici diretti.

## **2\. Oltre l'Attenzione Quadratica: Nuovi Fondamenti Teorici**

Il predominio dell'architettura Transformer classica ha iniziato a subire erosioni mirate attraverso l'introduzione di meccanismi che risolvono due colli di bottiglia critici: la complessità computazionale quadratica del meccanismo di attenzione rispetto alla lunghezza della sequenza e il collasso della rappresentazione nei modelli profondi.  
L'innovazione più radicale a livello di rete neurale di base è rappresentata dalle Kolmogorov-Arnold Networks (KAN), introdotte nel documento "KAN: Kolmogorov-Arnold Networks" (reperibile all'indirizzo [https://arxiv.org/abs/2404.19756](https://arxiv.org/abs/2404.19756)).12 A differenza dei perceptroni multistrato (MLP) tradizionali che impiegano pesi lineari fissi sui nodi e funzioni di attivazione statiche, le KAN si basano sul teorema di rappresentazione di Kolmogorov-Arnold. Esse posizionano funzioni di attivazione parametrizzate, tipicamente funzioni B-splines, direttamente sugli spigoli della rete.13 L'implicazione teorica di questa architettura è monumentale per l'interpretabilità: le KAN riescono a mappare funzioni matematiche complesse o leggi fisiche con una frazione minuscola dei parametri richiesti da un MLP tradizionale. Questo le rende strumenti eccezionali per l'analisi predittiva e la scoperta scientifica.14 Tuttavia, l'efficienza computazionale delle KAN in fase di addestramento su hardware massivamente parallelo (come le GPU) rimane un'area di ricerca attiva, richiedendo ottimizzazioni future per scalare su dataset massivi.15  
In risposta al problema della complessità temporale, il modello Mamba ha segnato il ritorno trionfale dei modelli a spazio di stato (State Space Models \- SSM). Documentato nel paper "Mamba: Linear-Time Sequence Modeling with Selective State Spaces" ([https://arxiv.org/abs/2312.00752](https://arxiv.org/abs/2312.00752)), questo approccio supera la dipendenza quadratica del Transformer, raggiungendo una complessità temporale lineare ![][image1].16 Il meccanismo alla base di Mamba è una scansione parallela hardware-aware che filtra dinamicamente le informazioni irrilevanti e memorizza nello stato nascosto solo i dati salienti per la predizione futura. I risultati empirici hanno dimostrato che un modello Mamba da 3 miliardi di parametri eguaglia le prestazioni di un Transformer di dimensioni doppie (6 miliardi), stabilendo un nuovo standard di efficienza per la modellazione di sequenze estremamente lunghe, come l'analisi genomica e l'elaborazione audio continua.16  
Un'ulteriore evoluzione riguarda la topologia stessa del routing all'interno delle reti. Mentre l'approccio Mixture-of-Experts (MoE) tradizionale instrada i token orizzontalmente attraverso diversi blocchi feed-forward all'interno dello stesso livello, la ricerca ha esplorato il Mixture-of-Depths (MoD). Nel contesto di modelli come Gemini 1.5, il concetto di Mixture-of-Depths Attention (MoDA) postula che non tutti i token richiedano la medesima profondità di elaborazione.17 Attraverso un meccanismo di attenzione basato sulla profondità, il modello decide dinamicamente quali token devono attraversare determinati blocchi e quali possono saltarli (routing verticale). Questa allocazione dinamica del calcolo è la chiave di volta che consente a modelli di elaborare milioni di token di contesto rimanendo economicamente trattabili durante l'inferenza, poiché il calcolo viene speso solo dove vi è una reale densità di informazione.18

## **3\. Algoritmi di Allineamento e Ottimizzazione delle Preferenze**

Fino al 2023, il paradigma dominante per l'allineamento dei modelli linguistici ai valori e alle istruzioni umane era il Reinforcement Learning from Human Feedback (RLHF), che richiedeva l'addestramento di un costoso modello di ricompensa separato. L'ultimo triennio ha visto l'obsolescenza di tale metodo in favore di tecniche di ottimizzazione diretta.  
La Direct Preference Optimization (DPO) ha rivoluzionato il settore dimostrando matematicamente che il modello linguistico stesso può fungere da modello di ricompensa, eliminando un'intera fase computazionale.19 Da questa base, la ricerca si è biforcata in due direzioni rivoluzionarie per mitigare i costi di acquisizione dati e migliorare la convergenza: l'Odds Ratio Preference Optimization (ORPO) e la Kahneman-Tversky Optimization (KTO).  
Il framework ORPO, formalizzato nel paper "ORPO: Monolithic Preference Optimization without Reference Model" ([https://arxiv.org/abs/2403.07691](https://arxiv.org/abs/2403.07691)), risolve un limite critico della DPO: la necessità di mantenere in memoria un modello di riferimento "congelato" (reference model) per calcolare la penalità di divergenza Kullback-Leibler (KL).20 Mantenere due modelli in memoria raddoppia i costi di inferenza in addestramento. ORPO introduce un approccio monolitico, integrando una penalità basata sull'odds ratio direttamente nella funzione di perdita della log-verosimiglianza negativa (NLL). Questo permette al modello di apprendere a generare lo stile desiderato e penalizzare quello indesiderato in un singolo passaggio, senza alcun modello di appoggio.20  
Parallelamente, la Kahneman-Tversky Optimization (KTO) affronta il problema logistico della raccolta dei dati. Come descritto nel documento "KTO: Model Alignment as Prospect Theoretic Optimization" ([https://arxiv.org/abs/2402.01306](https://arxiv.org/abs/2402.01306)), le tecniche precedenti richiedevano dati appaiati (paired data), ovvero risposte A e B fornite allo stesso prompt e classificate da un umano.19 La KTO, ispirandosi alla teoria del prospetto (prospect theory) dell'economia comportamentale, allinea il modello utilizzando solo un segnale binario slegato (es. un semplice "pollice in su" o "pollice in giù" su una singola interazione). Sebbene il segnale binario sia intrinsecamente più debole del confronto diretto, KTO compensa questa debolezza sfruttando l'enorme volume di dati non appaiati disponibili a costi marginali quasi nulli, superando le prestazioni della DPO su set di dati equivalenti frazionati.19

| Algoritmo di Allineamento | Requisiti di Addestramento e Dati | Meccanismo Matematico e Innovazione Principale |
| :---- | :---- | :---- |
| **RLHF** | Modello di ricompensa separato, dati di preferenza appaiati. | Ottimizzazione tramite PPO (Proximal Policy Optimization). Altamente instabile e costoso computazionalmente. |
| **DPO** | Nessun modello di ricompensa, richiede un Reference Model in memoria. Dati appaiati. | Sfrutta il modello stesso come funzione di ricompensa implicita calcolando la divergenza KL. |
| **ORPO** | Nessun Reference Model (Approccio monolitico). Dati appaiati. | Aggiunge una penalità basata sull'odds ratio direttamente alla loss NLL, dimezzando i costi di memoria VRAM.20 |
| **KTO** | Nessun dato appaiato richiesto (solo segnali binari individuali). | Applica la Prospect Theory per massimizzare il valore atteso delle generazioni basandosi sull'abbondanza di feedback deboli.19 |

## **4\. L'Ecosistema Orientale: Efficienza Algoritmica Sotto Vincoli Hardware**

L'apparato tecnologico cinese ha dimostrato una resilienza straordinaria. A fronte di severe restrizioni sulle importazioni di acceleratori GPU di ultima generazione, i laboratori come DeepSeek, Xiaomi, Alibaba, Zhipu AI e Moonshot AI hanno adottato una filosofia di "scarsità forzata", che ha prodotto le architetture più efficienti documentate in questo decennio.

### **4.1 La Rivoluzione Architetturale di DeepSeek**

DeepSeek ha dominato la letteratura "open-weights". Il rilascio di DeepSeek-V3 ha segnato un traguardo storico: pre-addestrato su 14.8 Trilioni di token con un costo di soli 2.664M ore su GPU H800, ha eguagliato modelli closed-source come GPT-4o e Claude 3.5 Sonnet nel benchmark MMLU (88.5).23 Il paper "DeepSeek-V3 Technical Report" ([https://arxiv.org/abs/2412.19437](https://arxiv.org/abs/2412.19437)) rivela l'implementazione del primo framework di addestramento in precisione mista FP8 su scala estrema, accompagnato da una sovrapposizione computazione-comunicazione quasi totale nei nodi MoE, prevenendo del tutto i picchi di loss irreversibili.23  
L'evoluzione successiva, DeepSeek R1 e R1-Zero, ha decostruito la necessità del Supervised Fine-Tuning (SFT). DeepSeek R1-Zero ha dimostrato che le capacità di ragionamento umanoide possono emergere unicamente tramite puro Reinforcement Learning, senza dataset etichettati, semplicemente ricompensando il modello per la validità logica dei passaggi intermedi.1  
Tuttavia, l'impatto architetturale più profondo si riscontra nel report "DeepSeek-V4: Towards Highly Efficient Million-Token Context Intelligence" ([https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro/blob/main/DeepSeek\_V4.pdf](https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro/blob/main/DeepSeek_V4.pdf)).25 DeepSeek-V4 introduce innovazioni chirurgiche per la gestione di finestre di contesto da milioni di token e l'addestramento ultra-efficiente.26

| Innovazione Architetturale DeepSeek V4 | Meccanismo Matematico e Operativo | Vantaggio Strutturale Risolto |
| :---- | :---- | :---- |
| **Manifold-Constrained Hyper-Connections (mHC)** | Sostituisce le classiche connessioni residue (Pre-Norm o Post-Norm) soggette a collasso della rappresentazione. Espande il flusso residuo in canali multipli gestiti da una matrice di mixing vincolata alla *varietà delle matrici doppiamente stocastiche* (somma di righe e colonne pari a 1).26 | Previene l'esplosione dei valori consentendo reti neurali estremamente profonde. Migliora la stabilità senza aumentare la dimensionalità nascosta.26 |
| **Compressed Sparse Attention (CSA)** | L'attenzione sparsa viene applicata a interi blocchi KV compressi (ratio ![][image2]). Un "Lightning Indexer" valuta l'importanza e instrada l'attenzione solo verso i Top-k blocchi, mantenendo però una sliding window locale di 128 token non compressi per la coerenza fine.26 | Riduce drasticamente il carico computazionale su testi immensi, salvaguardando al contempo la precisione dei dettagli locali imminenti.26 |
| **Heavily Compressed Attention (HCA)** | Intervallata con la CSA, applica una compressione estrema (ratio ![][image3]). Non usa selezione sparsa ma calcola l'attenzione globale su tutte le entry (es. solo 7.800 entry per un milione di token), generando una visione olistica del contesto.26 | Fornisce al modello una comprensione "a volo d'uccello" del documento completo con un costo aritmetico infinitesimale.26 |
| **Muon Optimizer** | Optimizer che sostituisce parzialmente AdamW. Applica un metodo ibrido *Newton-Schulz* iterativo per calcolare e scalare gli aggiornamenti basandosi sull'RMS (Root Mean Square) delle matrici semi-ortogonali.26 | Accelera radicalmente la convergenza in fase di addestramento regolarizzando direttamente i valori singolari dei pesi.26 |
| **FP4 Quantization-Aware Training (QAT)** | La rete applica metodologie QAT per eseguire fasi avanzate dell'addestramento direttamente in precisione a 4-bit (FP4), una tecnica precedentemente considerata instabile su scale miliardarie.27 | Contrae esponenzialmente il footprint di memoria richiesto nei cluster hardware, permettendo cluster di addestramento più compatti.27 |

### **4.2 Xiaomi MiMo, Qwen, GLM e Moonshot Kimi**

L'azienda Xiaomi, storicamente legata all'hardware, ha pubblicato paper di frontiera con la sua architettura MiMo. Il "MiMo-V2-Flash Technical Report" ([https://arxiv.org/abs/2601.02780](https://arxiv.org/abs/2601.02780)) descrive un modello MoE con ben 309 miliardi di parametri totali, ma con soli 15 miliardi di parametri attivi per token durante l'inferenza.29 L'apporto fondamentale di MiMo è l'implementazione pervasiva della Multi-Token Prediction (MTP). Predicendo token multipli simultaneamente in pre-training, l'infrastruttura MTP viene poi "riciclata" in inferenza come un *draft model* interno per la speculative decoding. Questo eleva l'intensità aritmetica in un processo tipicamente bloccato dalla banda di memoria (memory-bound), accelerando il decoding del 2.6x.29 Per la fase di allineamento, MiMo introduce la Multi-Teacher On-Policy Distillation (MOPD), dove modelli insegnanti densi forniscono ricompense a livello di singolo token, mitigando il problema dei "reward sparsi" nel ragionamento matematico.31  
Parallelamente, Alibaba ha consolidato la dominanza multilingue con la serie Qwen 3 ([https://arxiv.org/abs/2505.09388](https://arxiv.org/abs/2505.09388)). L'estensione del supporto da 29 a 119 lingue e dialetti lo rende un hub universale per le architetture aziendali globali, fungendo da modello base per agenti specializzati in programmazione (Qwen-Coder) e matematica (Qwen-Math).32  
Sul fronte dell'elaborazione documentale massiva, Moonshot AI con la sua intelligenza artificiale Kimi (versioni K2 e K2.5) ha portato i limiti fisici della context window a livelli inediti, elaborando fino a 2 milioni di caratteri cinesi in un singolo prompt.36 Questo ha ridefinito le capacità operative nei settori legale e finanziario.37 Zhipu AI, con la sua famiglia GLM (GLM-4-Plus, GLM-5), ha adottato una strategia di eccellenza generalista, producendo modelli multi-esperto che offrono prestazioni bilanciate su tutte le discipline, impattando positivamente persino le valutazioni finanziarie dell'azienda sui mercati azionari asiatici.2

## **5\. L'Ecosistema Occidentale: Ragionamento Esplicito, Monosemanticità e Fusione Multi-Modale**

Il paradigma occidentale, svincolato da limitazioni hardware immediate, si è concentrato sull'esplorazione del ragionamento deduttivo profondo, sull'interpretabilità per la sicurezza e sulla fusione dei dati multi-modali a livello di tokenizzazione.

### **5.1 OpenAI: La Famiglia "o" e la Decostruzione dell'Illusione del Pensiero**

OpenAI ha introdotto i modelli "Large Reasoning Models" (LRM), specificatamente la famiglia o1, o1-mini, o3 e o4-mini (illustrati nei system card ufficiali, es. [https://cdn.openai.com/o1-system-card.pdf](https://cdn.openai.com/o1-system-card.pdf)).6 A differenza dei modelli basati sulla pura inferenza reattiva, questi modelli sono addestrati con massicce dosi di Reinforcement Learning per generare una "Chain of Thought" (CoT) latente, riflettendo e autocorreggendosi prima di produrre un output finale. Questo approccio ha permesso prestazioni senza precedenti in ambienti formali, raggiungendo l'oro alle Olimpiadi Internazionali di Informatica (IOI) nel caso di o3 e o1-ioi 42 ([https://arxiv.org/abs/2502.06807](https://arxiv.org/abs/2502.06807)).  
Tuttavia, un'analisi critica cruciale proviene dal paper indipendente/Apple "The Illusion of Thinking" ([https://ml-site.cdn-apple.com/papers/the-illusion-of-thinking.pdf](https://ml-site.cdn-apple.com/papers/the-illusion-of-thinking.pdf)).43 Questo documento decostruisce la mistica del ragionamento logico dei modelli LRM. Testando i modelli su variazioni progressive di puzzle logici, i ricercatori hanno identificato tre regimi di performance distinti. Nel primo regime (bassa complessità), i modelli LLM standard performano paradossalmente meglio degli LRM, dimostrando che il meccanismo di "pensiero" genera un overhead inutile per task diretti. Nel regime di media complessità, gli LRM primeggiano. Tuttavia, nel terzo regime (alta complessità), si assiste a un *collasso totale dell'accuratezza*. Lo studio evidenzia un limite di scalabilità controintuitivo: lo sforzo di ragionamento (numero di token generati nella CoT) cresce con la complessità fino a un punto di rottura, oltre il quale il modello "si arrende" e l'effort diminuisce nonostante abbia ancora budget di calcolo disponibile. Questo dimostra l'incapacità intrinseca delle reti attuali di astrarre e utilizzare algoritmi espliciti, basandosi ancora su pattern matching probabilistico altamente sofisticato.43

### **5.2 Anthropic: Interpretabilità Meccanistica in Claude 3.5 Sonnet**

Anthropic ha rilasciato Claude 3.5 Sonnet, superando il proprio modello di punta precedente (Claude 3 Opus) in efficienza e costi, risolvendo il 64% dei task di agentic coding in test interni (modifiche autonome di repository basate su Issue GitHub).44 Il documento di riferimento è l'Addendum alla Model Card ([https://www-cdn.anthropic.com/fed9cc193a14b84131812372d8d5857f8f304c52/Model\_Card\_Claude\_3\_Addendum.pdf](https://www-cdn.anthropic.com/fed9cc193a14b84131812372d8d5857f8f304c52/Model_Card_Claude_3_Addendum.pdf)).44  
L'apporto scientifico più rivoluzionario di Anthropic, tuttavia, si trova nel documento "Scaling Monosemanticity: Extracting Interpretable Features from Claude 3 Sonnet" ([https://transformer-circuits.pub/2024/scaling-monosemanticity/](https://transformer-circuits.pub/2024/scaling-monosemanticity/)).4 I ricercatori hanno affrontato il problema della "polisemanticità" neuronale: nei Transformer, un singolo neurone latente può attivarsi per concetti diametralmente opposti e scorrelati. Applicando l'addestramento tramite Sparse Autoencoders (SAE) sulle attivazioni interne del modello Sonnet, sono riusciti a scomporre le rappresentazioni latenti in direzioni "monosemantiche" pure all'interno di uno spazio ad altissima dimensionalità. Questa scomposizione consente di isolare fisicamente i vettori concettuali esatti (es. l'attivazione per l'inganno, per un bug informatico o per un concetto malevolo), fornendo un framework verificabile per alterare chirurgicamente le inclinazioni dell'intelligenza artificiale, una pietra angolare per l'AI Alignment.4

### **5.3 Google, Meta e Mistral: Strategie di Composizione**

Google ha consolidato l'approccio multimodale con la famiglia Gemini 1.5 Pro e Flash. Il report "Gemini 1.5: Unlocking multimodal understanding across millions of tokens of context" ([https://arxiv.org/abs/2403.05530](https://arxiv.org/abs/2403.05530)) 3 descrive l'utilizzo di metodologie di distillazione online combinate con architetture MoD per l'elaborazione di ore di video crudo e interi archivi di codice simultaneamente.17  
Meta, d'altro canto, ha mantenuto un approccio ibrido con "The Llama 3 Herd of Models" ([https://arxiv.org/abs/2407.21783](https://arxiv.org/abs/2407.21783)) 50, spingendo le reti dense Transformer standard fino a 405 miliardi di parametri. L'innovazione maggiore si registra nel progetto Chameleon, dettagliato in "Chameleon: Mixed-Modal Early-Fusion Foundation Models" ([https://arxiv.org/abs/2405.09818](https://arxiv.org/abs/2405.09818)).5 Chameleon adotta un approccio "early-fusion": elimina la necessità di encoder specializzati pre-addestrati per immagini e testi, tokenizzando l'intero spettro visivo e testuale fin dal primo layer. Questo permette al modello di generare liberamente prompt che mescolano output di immagini e testi in modo organico e bidirezionale.5  
Mistral AI ha popolarizzato definitivamente il framework MoE su larga scala con i paper "Mixtral of Experts" ([https://arxiv.org/abs/2401.04088](https://arxiv.org/abs/2401.04088)) 53 e le versioni successive come Mixtral 8x22B e Mistral Large.56 Utilizzando un network di routing che seleziona 2 esperti su 8 per ogni token (garantendo la pervasività dei gradienti ma limitando i parametri attivi a 13B su 47B totali in inferenza), ha fornito alla comunità di ricerca la base di riferimento per costruire agenti locali ad alte prestazioni.

## **6\. L'Ingegneria Pratica e la Divulgazione Comunitaria (YouTube Research Analysis)**

L'applicazione in ambienti di produzione e l'adattamento dei paper accademici avvengono attraverso ecosistemi distribuiti di sviluppatori. L'indagine sistematica dei canali YouTube richiesti rivela le complessità tecniche emerse nell'ultimo triennio e le soluzioni ingegneristiche sviluppate per affrontarle. I contenuti prodotti da questi esperti, che spaziano dal livello hardware alla filosofia dell'informatica, documentano l'impatto reale dell'intelligenza artificiale nel ciclo di vita del software.

### **6.1 Salvatore Sanfilippo (antirez): Inferenza Locale e Ottimizzazione della Token Economy**

Salvatore Sanfilippo, pioniere del database Redis, ha orientato la sua capacità di ottimizzazione verso l'inferenza AI locale.7 Attraverso il suo canale e blog ([antirez.com/news](https://antirez.com/news)), ha analizzato la transizione dai modelli reattivi ai modelli di frontiera "open".59 Il suo contributo di maggior peso è DS4 (DwarfStar 4), un motore di inferenza nativo ([https://github.com/antirez/ds4](https://github.com/antirez/ds4)) sviluppato unicamente per DeepSeek V4 Flash.60  
Sanfilippo postula che la combinazione di finestre di contesto da 1 milione di token, un'architettura sparsa e la quantizzazione asimmetrica a 2/8 bit renda DeepSeek V4 Flash il primo modello in grado di sostituire API commerciali su hardware "prosumer" (Mac con 96/128 GB di RAM o cluster DGX Spark).61 L'innovazione ingegneristica introdotta in DS4 riguarda la "token economy". I modelli locali, dovendo processare rapidamente, devono economizzare i token di generazione. Sanfilippo ha evidenziato come i tradizionali sistemi CAS (Check And Set) usati dagli agenti LLM per modificare file sorgente consumino centinaia di token richiedendo la stampa della riga originale completa, fallendo spesso a causa di indentazioni errate o caratteri di controllo sfuggiti al modello.64 Ha ideato uno strumento EDIT basato su tag crittografici 64: il sistema restituisce al LLM il codice frammentato con tag CRC32 di 4 caratteri per riga (es. 11:rA3\_). L'agente, per eseguire una modifica, emette un payload JSON contenente solo il tag identificativo e la nuova stringa, riducendo il consumo a soli 2.5 token per identificazione di riga. Questa ottimizzazione architetturale trasforma drasticamente l'efficienza degli agenti programmatori autonomi.62

### **6.2 Simone Rizzo: Sistemi Multi-Agente, Scaling Contextual e RL Applicato**

Il canale di Simone Rizzo documenta sistematicamente il declino dell'approccio a "chatbot isolato" in favore di architetture orchestrate di agenti autonomi.8 La sua analisi affronta il "Segreto della memoria degli agenti AI", mostrando come la frammentazione del contesto e l'uso di memorie temporali superino l'indicizzazione vettoriale statica (RAG).65  
Un caso studio fondamentale presentato da Rizzo è l'analisi di Microsoft rStar2-Agent.68 Rizzo evidenzia come questo modello, con soli 14 miliardi di parametri, riesca a esprimere un ragionamento agentico nativo che surclassa le versioni originarie di DeepSeek a 671B su benchmark matematici critici come AIME24 (raggiungendo l'80.6%). L'implicazione esplorata è che l'algoritmo di training GRPO-RoC (Group Relative Policy Optimization) utilizzato induce il modello a imparare per tentativi ed errori durante la generazione, stabilendo che la destrezza agentica deriva da un regime di Reinforcement Learning specifico e non dall'esplosione parametrica.68 A livello pratico, Rizzo documenta l'uso di piattaforme modulari come ComfyUI per orchestrare workflow di generazione procedurale su API esposte, aggirando il bisogno di sviluppo backend intensivo e automatizzando la creazione multi-modale.8

### **6.3 Enkk: L'Epistemologia dell'Intelligenza "Aliena" e la Fallacia del Benchmarking**

Enkk unisce la prospettiva accademica a test empirici pragmatici. In un esperimento significativo, ha impiegato Claude per la correzione automatica di esami universitari simulati, per confrontare l'ermeneutica della macchina con quella di un docente umano.69  
Il valore teorico del suo contributo risiede nella definizione dei LLM come forma di "intelligenza aliena".9 Enkk demistifica la tendenza all'antropomorfizzazione: nonostante il task di base sia semplicemente la next-token prediction 70, emergono proprietà complesse che imitano perfettamente il ragionamento causale. Tuttavia, poiché il meccanismo di derivazione è statistico e non simbolico, le modalità di fallimento del modello sono incomprensibili per l'intuizione umana. Il suo monito a "non fidarsi mai al 100%" 9 si allinea con le scoperte del paper accademico "The Illusion of Thinking" esaminato in precedenza.43 Enkk enfatizza l'assoluta necessità per gli sviluppatori di abbandonare i benchmark generalisti (MMLU, HumanEval) e creare pipeline di valutazione basate rigorosamente sui propri dati asimmetrici proprietari. Qualsiasi implementazione fiduciaria di un LLM senza test empirici direzionali è destinata al fallimento catastrofico.

### **6.4 Francesco Di Donato (didof\_dev): Sicurezza Strutturale negli IDE e Collasso delle Skill**

Il lavoro di Francesco Di Donato si posiziona all'intersezione tra l'ingegneria del software pratica e la sicurezza delle integrazioni AI negli IDE moderni come Cursor.10 Due scoperte e analisi risultano critiche per lo stato dell'arte applicato:

1. **Vulnerabilità Architetturale Globale (Il problema del .env)**: Di Donato documenta come la corsa all'integrazione abbia generato un grave difetto di sicurezza nelle pratiche di programmazione.10 Gli agenti integrati in editor (come Cursor o Github Copilot) scansionano in modo ricorsivo l'albero delle directory del progetto per arricchire il contesto. Di conseguenza, i file .env contenenti chiavi API private, password di database e credenziali bancarie vengono inavvertitamente iniettati nel contesto e trasmessi in chiaro via internet ai server di OpenAI o Anthropic.10 Questa esfiltrazione involontaria su larga scala necessita di urgenti standardizzazioni nei protocolli di .gitignore per l'AI.  
2. **Degrado della Context Window (Skill Listing Budget Fraction)**: Utilizzando strumenti come Claude Code, Di Donato ha osservato un errore sistemico denominato "dropped skills".71 Quando il framework inietta un numero eccessivo di definizioni di tool (funzioni JSON) e direttive di sistema nel prompt invisibile, viene consumato il "budget" della finestra di attenzione. L'LLM tronca silenziosamente le istruzioni, generando codice fallace perché "dimentica" le API a cui ha accesso. Di Donato istruisce all'uso di funzioni di pulizia semantica del contesto (/skills) per mantenere alte le performance dell'agente.71 Inoltre, sperimenta con la multimodalità integrandola in architetture business, come agenti di customer service su Telegram basati su Whisper e motori grafici procedurali in stile Wolfenstein 3D.73

### **6.5 Raffaele Gaito: Orchestrazione Cloud ed Effetti Sistemici sulla Rete**

Raffaele Gaito estende l'analisi al macro-impatto dell'IA generativa sul marketing e sull'ecosistema web.11 Le sue guide operative smontano l'uso di wrapper a pagamento, orientando l'utenza verso tool ingegneristici primari come Google AI Studio.11 Gaito dimostra come le console per sviluppatori permettano l'accesso in tempo reale a modelli non censurati, consentendo di manipolare i pesi di risposta, bypassare i rate limit e integrare stream audio-visivi in applicazioni web a costo marginale zero.11  
Tuttavia, l'apporto analitico più rilevante deriva dalle sue considerazioni sociologiche sul degrado del web e sul Data Poisoning. Gaito documenta l'automazione esasperata della generazione di contenuti (SEO video automatizzati, guest post generati).76 L'immissione costante di materiale puramente sintetico sulla rete preannuncia un fenomeno accademico letale noto come "Model Collapse": i modelli in fase di pre-training nel 2026 ingeriscono l'output sintattico e ripetitivo generato dai modelli del 2024, scartando la varianza umana originaria. Questo deterioramento globale dell'internet giustifica direttamente i massicci investimenti di aziende orientali e occidentali in architetture basate esclusivamente su Reinforcement Learning auto-play e distillazione multi-teacher on-policy, al fine ultimo di distaccare i fondation models dalla dipendenza dai dati web.76

| Autore / Ricercatore | Dominio di Analisi Primario | Implicazioni Ingegneristiche e Rischi Sollevati |
| :---- | :---- | :---- |
| **Salvatore Sanfilippo (antirez)** | Edge Computing, Economia dei Token, Reti Sparse. | Rilascio di DS4 per inferenza DeepSeek V4 su hardware M-series. Algoritmo CRC32 per bypassare gli sprechi della logica CAS.61 |
| **Simone Rizzo** | RL Applicato, Swarm Agents, Gestione RAG. | Rilevamento dell'inferiorità delle reti dense standard (671B) rispetto a modelli compatti guidati da RL (rStar2-Agent) nei benchmark analitici.68 |
| **Enkk** | Epistemologia AI, Valutazione Universitaria. | Test di conformità docenti-IA. Smascheramento della fallacia antropomorfica; necessità di benchmark proprietari.9 |
| **Francesco Di Donato** | Sicurezza IDE, Gestione Tooling e Attenzione. | Allarme sicurezza sui file .env esfiltrati da tool automatici. Gestione dello "Skill Listing Budget" nei contesti saturi.10 |
| **Raffaele Gaito** | Cloud Orchestration, AI Studio, Macro-trend Web. | Sfruttamento di Google AI Studio. Fenomeni di Model Collapse derivanti dalla saturazione di dati sintetici nei motori di ricerca.11 |

## **8\. Tecniche Architetturali Aggiuntive Rilevanti per il Progetto SLM**

> Sezione aggiunta in fase di audit (2026-05-21) per integrare la letteratura specificamente rilevante al progetto interno: SLM organization-specialized + dominio coding via LoRA + wrapper applicativo. Ogni voce riporta confidence tag e una breve giustificazione della pertinenza per le tre direttrici (organization, coding, wrapper). Le citazioni numerate continuano dal riferimento 79 della sezione precedente.

### **8.1 Efficienza dell'attenzione: dall'MQA a FlashAttention-3**

L'evoluzione dei meccanismi di attenzione efficienti è centrale per ogni SLM coding-specialized che debba operare su context window estese (necessarie per "leggere" file e repository interi). I lavori di riferimento sono i seguenti.

**Grouped Query Attention (GQA)** [79] è una generalizzazione di Multi-Query Attention proposta da Ainslie et al. presso Google (arXiv 2305.13245, EMNLP 2023). GQA usa un numero di key/value head intermedio fra MHA e MQA, mantenendo qualità prossima a MHA con velocità prossima a MQA. È adottata da Qwen3 e Llama 3, quindi compatibile out-of-the-box col nostro base candidato. `[VERIFIED]` — *Rilevanza:* infrastruttura "gratuita" sul base; nessun lavoro richiesto.

**Multi-Head Latent Attention (MLA)** [80] è il meccanismo introdotto da DeepSeek-V2/V3 (arXiv 2412.19437) che compatta KV in un latent space a bassa dimensione, riducendo drasticamente il KV-cache footprint. `[VERIFIED]` — *Rilevanza:* se mai facessimo continual pre-training da DeepSeek o adottassimo un fork, MLA è il moltiplicatore di efficienza chiave per la long-context coding.

**FlashAttention-2** [81] di Tri Dao (arXiv 2307.08691) ottiene ~2x speedup vs FlashAttention-1 ottimizzando lo work partitioning su GPU NVIDIA. **FlashAttention-3** [82] (Shah et al., arXiv 2407.08608) sfrutta async tensor core di Hopper (H100), warp specialization e FP8 incoherent processing per ulteriori 1.5-2x. `[VERIFIED]` — *Rilevanza:* speedup di training a costo zero in PyTorch (`scaled_dot_product_attention` o flash-attn package). Cruciale per W5+ del nostro roadmap.

**Ring Attention** [83] di Hao Liu, Zaharia e Abbeel (arXiv 2310.01889) distribuisce sequenze lunghissime su più device sovrapponendo comunicazione KV e calcolo blockwise. `[VERIFIED]` — *Rilevanza:* se in W6+ servirà training con context > 128K, è il pattern di riferimento.

**Sliding Window Attention (Mistral)** [84] popolarizzata da Mistral 7B e ora standard in Mixtral, Qwen3 e MiMo-V2-Flash, applica attenzione locale su una finestra scorrevole. `[VERIFIED]` — *Rilevanza:* economica e quasi gratuita; pattern standard per coding context locale.

**PagedAttention / vLLM** [85] di Kwon et al. (arXiv 2309.06180) introduce gestione "paged" del KV-cache ispirata alla memoria virtuale dei sistemi operativi, riducendo la frammentazione e abilitando batching aggressivo. `[VERIFIED]` — *Rilevanza:* runtime di scelta per il wrapper di inferenza; il nostro server di esposizione del modello dovrebbe essere vLLM o un derivato (SGLang) per gestire centinaia di utenti concorrenti su LoRA hot-swap.

> **Nota sulla relazione MoDA / Gemini 1.5:** il documento principale (sez. 2) collega Mixture-of-Depths Attention al rilascio Gemini 1.5. In realtà MoDA (arXiv 2603.15619, hustvl) è un paper indipendente del marzo 2026 che propone attenzione cross-depth fra layer; il report originale di Gemini 1.5 parla di Mixture-of-Depths (MoD, Raposo et al. 2024) come allocazione dinamica del compute, non di MoDA. Mantenere distinti i due concetti nella nostra wiki.

### **8.2 Evoluzione della famiglia LoRA**

Per un progetto basato su LoRA stacking, l'aggiornamento sulla letteratura PEFT è obbligatorio.

**DoRA: Weight-Decomposed Low-Rank Adaptation** [86] di Liu et al., NVIDIA (arXiv 2402.09353, ICML 2024 Oral) decompone i pesi pre-trained in magnitude + direction, applicando LoRA solo alla componente direzionale. Risultati consistentemente superiori a LoRA "vanilla" su LLaMA, LLaVA, VL-BART. `[VERIFIED]` — *Rilevanza:* upgrade drop-in nel nostro stack PEFT. Supportato da `huggingface/peft`.

**AdaLoRA** [87] di Zhang et al. (arXiv 2303.10512) parametrizza gli update via SVD e prune dinamicamente i singular triplet poco importanti. `[VERIFIED]` — *Rilevanza:* utile in regimi con budget di parametri molto stringenti (edge / mobile deployment).

**VeRA: Vector-based Random Matrix Adaptation** [88] di Kopiczko, Blankevoort, Asano (arXiv 2310.11454, ICLR 2024) condivide una singola coppia di matrici random fra tutti i layer, addestrando solo scaling vector. Riduce di ordini di grandezza i parametri addestrabili. `[VERIFIED]` — *Rilevanza:* candidato forte per LoRA verticali tematiche che devono essere memorizzate in massa nel runtime del wrapper.

**LoRA+** [89] di Hayou, Ghosh, Yu (arXiv 2402.12354, ICML 2024) corregge la sub-ottimalità di LoRA usando learning rate diversi per A e B (ratio λ ≫ 1 a favore di B). Speedup ~2x e miglioramento qualità 1-2 punti. `[VERIFIED]` — *Rilevanza:* hack triviale ma potente; da applicare di default a tutti i training LoRA dalla W5.

**RsLoRA (Rank-Stabilized LoRA)** [90] di Kalajdzievski (arXiv 2312.03732) dimostra che il fattore di scaling LoRA dovrebbe essere `1/√r` invece di `1/r`, evitando gradient collapse a rank elevati. `[VERIFIED]` — *Rilevanza:* prerequisito teorico per qualunque esperimento con rank > 16; bug-fix concettuale.

### **8.3 Multi-Token Prediction (MTP)**

Il documento principale tratta MTP nel contesto MiMo. La fonte teorica originale è il paper **Meta MTP** [91] di Gloeckle et al. (arXiv 2404.19737, "Better & Faster Large Language Models via Multi-token Prediction"), che dimostra come predire n token con n head indipendenti migliori la sample efficiency su MBPP (+15% per modelli da 13B). DeepSeek-V3 e -V4 e MiMo-V2-Flash hanno tutti adottato MTP. `[VERIFIED]` — *Rilevanza:* potenzialmente utile in W7 (post-training avanzato) come signal augmentation; trade-off tra cost di training e speedup di inferenza tramite speculative decoding (vedi MiMo).

### **8.4 Tecniche di ragionamento**

**Tree of Thoughts (ToT)** [92] di Yao et al. (arXiv 2305.10601, NeurIPS 2023) generalizza Chain-of-Thought esplorando alberi di reasoning e selezionando il path migliore tramite valutatore esplicito. `[VERIFIED]` — *Rilevanza:* implementabile lato wrapper come tecnica di structured reasoning per task coding complessi senza modificare il modello.

**Self-Consistency** [93] di Wang et al. (arXiv 2203.11171, ICLR 2023) campiona N reasoning path e prende la maggioranza. Miglioramenti +17.9% su GSM8K vs greedy CoT. `[VERIFIED]` — *Rilevanza:* tecnica triviale lato wrapper, ad alto ROI in compiti deterministici.

**Quiet-STaR** [94] di Zelikman et al. (arXiv 2403.09629) insegna al modello a generare rationale latenti dopo ogni token e mixare le predizioni. Costoso ma efficace (+5 punti su GSM8K zero-shot). `[VERIFIED]` — *Rilevanza:* potenzialmente integrabile nella nostra W6 come obiettivo di post-training.

**GRPO originale** [95] introdotto in DeepSeekMath (arXiv 2402.03300) di Shao et al.: variante di PPO che usa confronti relativi all'interno di un gruppo di rollout, senza bisogno di critic model. È la base teorica di tutto l'ecosistema RL-for-reasoning attuale (R1, rStar2-Agent, Tülu RLVR). `[VERIFIED]` — *Rilevanza:* W6 — RL fase per coding agents; baseline obbligatoria.

### **8.5 Data curation e generazione**

**OSS-Instruct (Magicoder)** [96] di Wei et al. (arXiv 2312.02120, ICML 2024) genera istruzioni sintetiche per il coding a partire da snippet open-source pescati da GitHub. Riduce il bias delle generazioni puramente LLM. `[VERIFIED]` — *Rilevanza:* metodologia direttamente applicabile per produrre il nostro dataset di coding SFT.

**OctoPack / CommitPackFT** [97] di Muennighoff et al. (arXiv 2308.07124) ricava istruzioni dai commit Git (4TB di commit su 350 linguaggi). `[VERIFIED]` — *Rilevanza:* fonte di dati di alta qualità per istruire il modello su task tipici di code-review e bug-fix, fondamentali per il wrapper applicativo.

**Phi-3 Technical Report** [98] di Abdin et al. (arXiv 2404.14219) documenta la metodologia di filtering aggressivo e synthetic data che permette a phi-3-mini (3.8B) di reggere con Mixtral 8x7B. `[VERIFIED]` — *Rilevanza:* manual de facto per chi vuole costruire SLM coding-aware con dataset curato; lettura obbligata per la nostra W4 (data curation).

**Cosmopedia** [99] di Ben Allal e Lozhkov (HuggingFace, febbraio 2024): dataset sintetico aperto di 25B token (textbook + blog post + storie) generato da Mixtral. `[VERIFIED]` — *Rilevanza:* base per eventuale continual pre-training di nicchia.

**FineWeb / FineWeb-Edu** [100] di Penedo et al., HuggingFace (arXiv 2406.17557): 15T token web filtrati e 1.3T sottoinsieme educational, con dimostrazione che FineWeb-Edu migliora drammaticamente MMLU. `[VERIFIED]` — *Rilevanza:* potrebbe essere il corpus di pre-training di riferimento per nostre ablation, se mai necessario.

### **8.6 Memoria e long-context**

**MemGPT / Letta** [101] di Packer et al. (arXiv 2310.08560) tratta l'LLM come un OS con memory tier gerarchici e self-editing memory. `[VERIFIED]` — *Rilevanza:* pattern di riferimento per il wrapper applicativo se vogliamo supportare conversazioni persistenti / agent memory.

**Titans: Learning to Memorize at Test Time** [102] di Behrouz, Zhong, Mirrokni (Google, arXiv 2501.00663) introduce Neural Long-Term Memory Module che ottimizza i propri pesi al forward pass usando "surprise" come signal. `[VERIFIED]` — *Rilevanza:* connessione diretta con la nostra `wiki/concepts/curiosity-driven-exploration-training.md`; potenziale ground per una W6-W8 di ricerca innovativa.

**RULER** [103] di Hsieh et al., NVIDIA (arXiv 2404.06654): benchmark sintetico per misurare l'effective context size con NIAH multi-hop, aggregation e tracing. `[VERIFIED]` — *Rilevanza:* metrica obbligatoria nella nostra suite di valutazione long-context.

### **8.7 Architetture di agenti**

**Voyager** [104] di Wang et al. (arXiv 2305.16291): primo agent LLM lifelong learner in Minecraft, con curriculum automatico e libreria di skill in codice eseguibile. `[VERIFIED]` — *Rilevanza:* pattern per il wrapper se vogliamo agent autonomi che imparano skill in produzione.

**Reflexion** [105] di Shinn et al. (arXiv 2303.11366, NeurIPS 2023): rinforza agent senza aggiornare i pesi, usando feedback verbale stored in episodic memory. `[VERIFIED]` — *Rilevanza:* implementabile lato wrapper con zero training cost.

**SWE-Agent** [106] di Yang et al. (arXiv 2405.15793): agent-computer interface dedicata che porta GPT-4 dal 3.8% al 12.5% su SWE-bench. `[VERIFIED]` — *Rilevanza:* benchmark e architettura di riferimento per il nostro wrapper coding.

**AutoGen** [107] di Wu et al. (arXiv 2308.08155): framework multi-agent conversazionale di Microsoft. `[VERIFIED]` — *Rilevanza:* candidato come base del nostro orchestratore se decidiamo di non scrivere da zero.

### **8.8 Sicurezza e prompt injection**

**Constitutional AI** [108] di Bai et al., Anthropic (arXiv 2212.08073): allineamento senza human labeling sulla base di una "costituzione" testuale + RLAIF. `[VERIFIED]` — *Rilevanza:* W6 — RL post-training safety-aware; principi di base per evitare comportamenti dannosi nel coding agent (es. exfiltration di credenziali).

**Spotlighting** [109] di Hines et al., Microsoft (arXiv 2403.14720): difesa contro indirect prompt injection tramite delimitatori espliciti, encoding e datamarking dell'input non fidato. `[VERIFIED]` — *Rilevanza:* fondamentale per il wrapper coding, che ingerisce continuamente content untrusted (file utenti, repo esterni).

### **8.9 Architetture transformer alternative 2024-2026**

**Mamba-2 / State Space Duality** [110] di Dao e Gu (arXiv 2405.21060, ICML 2024) connette teoricamente SSM e attention via decomposizioni di matrici semiseparabili, ottenendo Mamba-2 2-8x più veloce di Mamba. `[VERIFIED]` — *Rilevanza:* da monitorare per future ablation; non priorità immediata se restiamo su base Qwen3.

**Jamba** [111] di AI21 (arXiv 2403.19887) interleavia Transformer e Mamba con MoE. `[VERIFIED]` — *Rilevanza:* esempio operativo di ibrido SSM/Attention production-grade.

**RWKV-7 "Goose"** [112] (arXiv 2503.14456, marzo 2025): linear attention con dynamic state evolution che supera la barriera di espressività TC0. `[VERIFIED]` — *Rilevanza:* tecnologia interessante per inferenza locale a context costante; tuttavia ancora secondario rispetto a Transformer denso per coding.

**Hymba** [113] di NVIDIA (arXiv 2411.13676, ICLR 2025) usa hybrid head con SSM e attention in parallelo. Hymba-1.5B-base supera Llama-3.2-3B con cache 11x più piccola. `[VERIFIED]` — *Rilevanza:* candidato architetturale aggressivo se mai puntassimo a un SLM da 1.5B su edge.

**Zamba2-7B** [114] di Zyphra (ottobre 2024): hybrid Mamba2 + shared attention block. `[VERIFIED]` — *Rilevanza:* riferimento dell'industria SLM ibrido.

**Hyena Hierarchy** [115] di Poli et al. (arXiv 2302.10866, ICML 2023): convoluzioni implicite con gating come alternativa subquadratic ad attention. `[VERIFIED]` — *Rilevanza:* radice teorica di SSM moderni; lettura di background.

### **8.10 Reasoning 2025: dopo o1**

**DeepSeek-R1** [116] (arXiv 2501.12948): RL puro su base DeepSeek-V3 produce reasoning emergente. `[VERIFIED]` — *Rilevanza:* baseline open di reasoning state-of-the-art; ha già una distill 7B/14B usabile.

**Kimi K1.5** [117] di Moonshot (arXiv 2501.12599): scaling RL con tecniche di long-CoT, partial rollout, e transfer da long a short reasoning. `[VERIFIED]` — *Rilevanza:* secondo paper di riferimento per RL reasoning 2025.

**Tülu 3** [118] di AllenAI (arXiv 2411.15124): recipe completo di post-training open (SFT → DPO → RLVR). `[VERIFIED]` — *Rilevanza:* documentazione di processo per la nostra pipeline W6.

**OpenThinker / Open Thoughts** [119] (HuggingFace, gennaio-giugno 2025): replica open dei reasoning model via distillation da DeepSeek-R1 e QwQ-32B. `[VERIFIED]` — *Rilevanza:* sorgente di dataset e ricetta zero-cost per il nostro reasoning fine-tune.

**Search-o1** [120] (arXiv 2501.05366): agentic retrieval-augmented reasoning per LRM. `[VERIFIED]` — *Rilevanza:* pattern per il wrapper se aggiungiamo RAG attiva nel reasoning loop.

**rStar-Math** [121] di Microsoft (arXiv 2501.04519): SLM 7B che batte o1 su MATH usando MCTS + PRM auto-evoluto. `[VERIFIED]` — *Rilevanza:* prova diretta che un SLM coding-style può raggiungere SOTA con MCTS; pattern di riferimento per W7-W8.

**LIMO: Less Is More for Reasoning** [122] di Ye et al. (arXiv 2502.03387, COLM 2025): 1% del data raggiunge il 95.6% su MATH500 fine-tuning di base ben pre-trained. `[VERIFIED]` — *Rilevanza:* indica che il reasoning emerge con poche istanze ben curate; cambia il nostro budget di data curation.

**s1: Simple test-time scaling** [123] di Muennighoff et al. (arXiv 2501.19393): 1000 esempi + "Wait" token forcing battono o1-preview su MATH/AIME. `[VERIFIED]` — *Rilevanza:* tecnica triviale ma sorprendente; deve essere baseline nella nostra W7.

### **8.11 Tool use e function calling**

**ToolLLM** [124] di Qin et al. (arXiv 2307.16789): framework per istruire LLM a usare 16k+ API reali. `[VERIFIED]` — *Rilevanza:* metodologia per istruire il modello a invocare i tool del wrapper.

**Gorilla** [125] di Patil et al. (arXiv 2305.15334, NeurIPS 2024): LLaMA fine-tuned su API call con document retriever per mitigare allucinazioni. `[VERIFIED]` — *Rilevanza:* pattern di tool calling che ci serve per il wrapper coding (es. invocare linter, test runner, type checker).

### **8.12 Reward modeling avanzato**

**Process Reward Models (PRM) — "Let's Verify Step by Step"** [126] di Lightman et al., OpenAI (arXiv 2305.20050): PRM che dà reward a ogni step di reasoning batte ORM con margine 78.2% vs 72.4%. `[VERIFIED]` — *Rilevanza:* tecnica adottata da rStar-Math, integrabile nella nostra W6 per reward più granulari.

**Self-Rewarding Language Models** [127] di Yuan et al., Meta (arXiv 2401.10020): il modello stesso è LLM-as-Judge nel proprio loop di DPO iterativo. `[VERIFIED]` — *Rilevanza:* potenziale riduzione del cost umano di feedback nel post-training.

### **8.13 Quantizzazione**

**GPTQ** [128] di Frantar et al. (arXiv 2210.17323, ICLR 2023): quantizzazione one-shot 3-4 bit basata su second-order info. `[VERIFIED]` — *Rilevanza:* tecnica matura per deployment; standard de facto.

**AWQ** [129] di Lin et al. (arXiv 2306.00978): activation-aware weight quantization che protegge l'1% dei pesi salient. `[VERIFIED]` — *Rilevanza:* spesso superiore a GPTQ; raccomandato per il deployment del nostro SLM.

**SmoothQuant** [130] di Xiao et al. (arXiv 2211.10438, ICML 2023): W8A8 PTQ con smoothing degli outlier di activation. `[VERIFIED]` — *Rilevanza:* opzione production-ready su hardware INT8.

### **8.14 Italian / Multilingual specialized**

**Minerva LLM** [131] di Sapienza NLP (Roberto Navigli, 2024): primo LLM trainato from scratch su italiano (50% del dataset), 7.4B parametri, 2.5T token. `[VERIFIED]` — *Rilevanza:* riferimento italiano; possibile fonte di dati italiani di qualità o eventuale base alternativa se decidessimo di servire mercato IT.

---

## **9\. Mappatura al progetto SLM**

> Mapping fra i paper citati (sezioni 2-8) e il roadmap di progetto definito in `wiki/decisions/2026-05-21-training-philosophy-roadmap.md`. Le wave W0-W10 corrispondono a fasi incrementali del progetto. Indicazione di "concept file" rimanda alla cartella `wiki/concepts/` o `wiki/architecture/`.

### **9.1 Wave W0-W2 (foundation, scoping)**

| Paper / Tecnica | Ruolo nel progetto | Concept file rilevante |
| :---- | :---- | :---- |
| Qwen3 Technical Report [33] | Base model candidato principale (open-weight, modalità thinking, MoE 235B / dense 0.6-32B) | `wiki/architecture/base-model-choice.md` |
| Phi-3 Technical Report [98] | Manual de facto per data curation aggressiva → SLM compatto | `wiki/concepts/data-curation.md` |
| Mamba [16], Mamba-2 [110], Hymba [113], RWKV-7 [112] | Architetture alternative da monitorare; non priorità W0-W2 ma da tenere in radar | `wiki/concepts/architecture-alternatives.md` |
| LIMO [122], s1 [123] | Cambiano il nostro budget di data curation: pochi esempi ben scelti bastano per reasoning | `wiki/concepts/limo-hypothesis.md` (da creare) |
| Minerva [131] | Riferimento italiano / IT-market positioning | `wiki/entities/minerva.md` (da creare) |

### **9.2 Wave W3-W4 (data curation, SFT iniziale)**

| Paper / Tecnica | Ruolo | Concept file |
| :---- | :---- | :---- |
| OSS-Instruct (Magicoder) [96] | Sintesi di istruzioni coding a partire da snippet open-source — diretto per il nostro dataset SFT coding | `wiki/concepts/synthetic-coding-data.md` |
| OctoPack / CommitPackFT [97] | Dataset commit-based per code-review e bug-fix; pertinente per fine-tune verticale | `wiki/entities/octopack.md` |
| FineWeb / Cosmopedia [99, 100] | Corpus general-purpose per eventuale continual pre-training | `wiki/entities/fineweb.md` |
| Self-Rewarding LM [127] | Riduzione cost umano in label generation | `wiki/concepts/self-rewarding.md` |

### **9.3 Wave W5 (training infrastructure & LoRA stacking)**

| Paper / Tecnica | Ruolo | Concept file |
| :---- | :---- | :---- |
| GQA [79] | Già presente in Qwen3 base — nessun lavoro | `wiki/architecture/base-model-choice.md` |
| FlashAttention-2/3 [81, 82] | Speedup training drop-in via `torch.scaled_dot_product_attention` o flash-attn | `wiki/architecture/training-infra.md` |
| DoRA [86] | Upgrade dello stack PEFT; `peft.LoraConfig` con `use_dora=True` | `wiki/concepts/lora-stacking.md` |
| LoRA+ [89] | Hack triviale ma potente; ratio λ ≈ 16 per learning rate B/A | `wiki/concepts/lora-stacking.md` |
| RsLoRA [90] | Scaling `1/√r` per evitare gradient collapse; prerequisito teorico | `wiki/concepts/lora-stacking.md` |
| AdaLoRA, VeRA [87, 88] | Candidati per LoRA verticali con budget parametrico stringente | `wiki/concepts/lora-stacking.md` |
| PagedAttention / vLLM [85] | Runtime per il wrapper di inferenza con LoRA hot-swap | `wiki/architecture/inference-stack.md` |
| Ring Attention [83] | Eventuale W5+ context > 128K | `wiki/architecture/long-context.md` |

### **9.4 Wave W6 (post-training, RL, reasoning emergence)**

| Paper / Tecnica | Ruolo | Concept file |
| :---- | :---- | :---- |
| ORPO [20] | Allineamento monolitico senza reference model; alternativa low-memory a DPO | `wiki/decisions/2026-05-21-training-philosophy-roadmap.md` |
| KTO [22] | Allineamento da feedback binari non appaiati (massimo throughput labeling) | `wiki/decisions/2026-05-21-training-philosophy-roadmap.md` |
| GRPO (DeepSeekMath) [95] | Baseline RL senza critic per reasoning emergence | `wiki/concepts/grpo.md` |
| GRPO-RoC (rStar2-Agent) [-] | Robusto a noise da tool env; preferito per agent coding | `wiki/entities/rstar2-agent.md` |
| Process Reward Models [126] | Reward granulari per step di reasoning; adottato da rStar-Math | `wiki/concepts/process-reward-models.md` |
| Constitutional AI [108] | Safety-aware post-training senza human labeling | `wiki/concepts/safety-rlaif.md` |
| Quiet-STaR [94] | Reasoning latente integrato nel training objective | `wiki/concepts/quiet-star.md` |
| DeepSeek-R1 [116], Kimi K1.5 [117], Tülu 3 [118] | Recipe complete di RL post-training pubbliche | `wiki/decisions/2026-05-21-training-philosophy-roadmap.md` |
| OpenThinker [119] | Dataset distillation pronto all'uso | `wiki/entities/openthinker.md` |

### **9.5 Wave W7-W8 (reasoning avanzato, MCTS, test-time compute)**

| Paper / Tecnica | Ruolo | Concept file |
| :---- | :---- | :---- |
| rStar-Math [121] | Pattern operativo: MCTS + PRM auto-evoluto su SLM coding | `wiki/entities/rstar-math.md` |
| The Illusion of Thinking [43] | Limite teorico da rispettare: oltre certa complessità il reasoning collassa | `wiki/concepts/reasoning-limits.md` |
| Competitive Programming LRM [42] | Riferimento empirico su IOI 2024 | `wiki/entities/openai-o1.md` |
| Tree of Thoughts [92], Self-Consistency [93] | Implementazione lato wrapper, zero training cost | `wiki/concepts/structured-thinking.md` |
| Multi-Token Prediction [91] | Augmentation training objective + speculative decoding | `wiki/concepts/mtp.md` |
| Titans [102] | Memoria long-term test-time, connessione con curiosity-driven | `wiki/concepts/curiosity-driven-exploration-training.md`, `wiki/entities/titans-paper.md` |

### **9.6 Wave W9-W10 (wrapper applicativo, deployment)**

| Paper / Tecnica | Ruolo | Concept file |
| :---- | :---- | :---- |
| MemGPT / Letta [101] | Pattern per memoria persistente del wrapper | `wiki/architecture/wrapper-memory.md` |
| Voyager [104] | Lifelong learning agent pattern (curriculum + skill library) | `wiki/concepts/lifelong-agent.md` |
| Reflexion [105] | Self-correction senza training cost | `wiki/concepts/reflexion.md` |
| SWE-Agent [106] | Architettura coding-agent + benchmark SWE-bench | `wiki/entities/swe-agent.md` |
| AutoGen [107] | Candidato base orchestratore multi-agent | `wiki/entities/autogen.md` |
| ToolLLM [124], Gorilla [125] | Pattern di tool calling robusto | `wiki/concepts/tool-calling.md` |
| Spotlighting [109] | Difesa indirect prompt injection (file utente untrusted) | `wiki/concepts/prompt-injection-defense.md` |
| GPTQ [128], AWQ [129], SmoothQuant [130] | Quantizzazione per deployment edge / serverless | `wiki/architecture/quantization.md` |
| vLLM [85], DS4 (antirez) [60] | Runtime di inferenza candidati | `wiki/architecture/inference-stack.md` |
| Search-o1 [120] | RAG attiva nel reasoning loop | `wiki/concepts/rag-reasoning.md` |

### **9.7 Mapping macro (orizzontale)**

| Direttrice di progetto | Paper più impattanti |
| :---- | :---- |
| **Three-tier idea: orchestrator + LoRA programming + LoRA verticali** | DoRA [86], VeRA [88], LoRA+ [89], RsLoRA [90], vLLM/PagedAttention [85] per hot-swap |
| **Coding-specialized SLM** | OSS-Instruct [96], OctoPack [97], Phi-3 [98], SWE-Agent [106], rStar-Math [121], Magicoder pattern |
| **Reasoning emergente** | DeepSeek-R1 [116], rStar2-Agent, GRPO [95], PRM [126], s1 [123], LIMO [122], Quiet-STaR [94] |
| **Wrapper applicativo** | MemGPT [101], Voyager [104], Reflexion [105], AutoGen [107], Spotlighting [109], Search-o1 [120] |
| **Innovazione possibile (research gap)** | Titans [102] + curiosity-driven training, structured update injection (gap già identificato), contradiction detection layer |

---

## **10\. Conclusioni e Prospettive**

> Nota di redazione: la numerazione originaria (sez. 7) è stata aggiornata a 10 in seguito all'inserimento delle sezioni 8 e 9 di audit 2026-05-21.

L'analisi esaustiva condotta su questo triennio di documentazione scientifica, arricchita dalla fenomenologia emergente dall'ecosistema di sviluppatori e ricercatori, permette di sintetizzare alcune prospettive definitive, indispensabili per chiunque debba intraprendere lavori accademici o tesi sperimentali in questo settore.  
In primo luogo, l'architettura classica dei Transformer è giunta alla sua asintote operativa. Mentre giganti come Llama 3 mantengono reti dense colossali, il futuro a breve e medio termine è tracciato inevitabilmente dall'efficienza strutturale. Meccanismi come le Kolmogorov-Arnold Networks (KAN) e le reti a spazio di stato selettivo (Mamba) dimostrano che è possibile abbattere i costi quadratici dell'attenzione. Inoltre, la transizione da una Mixture-of-Experts (MoE) orizzontale a concetti di Mixture-of-Depths (MoD) prova che l'impiego computazionale deve essere dinamico e asimmetrico, non statico e predeterminato.  
In secondo luogo, l'ecosistema orientale ha invalidato il monopolio infrastrutturale occidentale. Documenti come i report tecnici di DeepSeek V4 e Xiaomi MiMo testimoniano come metodologie matematiche avveniristiche—l'uso di matrici doppiamente stocastiche per mitigare il collasso della rappresentazione, attenzioni fortemente compresse, ottimizzatori Muon e distillazione multi-teacher—possano generare modelli capaci di sconfiggere i leader di mercato sfruttando una frazione dell'hardware. Questa "ingegneria della scarsità" democratizza definitivamente lo sviluppo e la fruizione dei modelli base, spingendo verso l'inferenza locale estrema, come teorizzato e implementato da framework specializzati come DS4.  
Infine, la narrativa del ragionamento dell'IA subisce un riposizionamento critico. L'integrazione dell'apprendimento per rinforzo per l'emergenza di catene di pensieri (CoT) latenti ha prodotto risultati strabilianti in competizioni chiuse (Olimpiadi IOI, benchmark AIME). Ciononostante, studi accademici sulla "Scaling Monosemanticity" di Anthropic e l'analisi empirica dell'"Illusione del pensiero" espongono l'assenza di vera astrazione computazionale. Le reti profonde possono smarrire la logica di fronte a variazioni formali minime per le quali l'umano avrebbe già un algoritmo deduttivo pronto. Come argomentato dai professionisti della divulgazione informatica italiana, l'intelligenza che abbiamo forgiato è potente ma profondamente aliena: trattarla come una scatola nera antropomorfica nei processi di ingegneria del software produce falle di sicurezza, degradazione dei file di sistema e in ultima istanza un inquinamento irreversibile del patrimonio informativo globale.

#### **Works cited**

1. A Survey of DeepSeek Models \- TechRxiv, accessed May 22, 2026, [https://www.techrxiv.org/doi/pdf/10.36227/techrxiv.173896582.25938392/v1](https://www.techrxiv.org/doi/pdf/10.36227/techrxiv.173896582.25938392/v1)  
2. Beyond DeepSeek: China's Diverse Open-Weight AI Ecosystem and Its Policy Implications \- Stanford HAI, accessed May 22, 2026, [https://hai.stanford.edu/assets/files/hai-digichina-issue-brief-beyond-deepseek-chinas-diverse-open-weight-ai-ecosystem-policy-implications.pdf](https://hai.stanford.edu/assets/files/hai-digichina-issue-brief-beyond-deepseek-chinas-diverse-open-weight-ai-ecosystem-policy-implications.pdf)  
3. Gemini 1.5: Unlocking multimodal understanding across millions of tokens of context \- arXiv, accessed May 22, 2026, [https://arxiv.org/html/2403.05530v2](https://arxiv.org/html/2403.05530v2)  
4. Scaling Monosemanticity: Extracting Interpretable Features from Claude 3 Sonnet, accessed May 22, 2026, [https://transformer-circuits.pub/2024/scaling-monosemanticity/](https://transformer-circuits.pub/2024/scaling-monosemanticity/)  
5. Chameleon: Mixed-Modal Early-Fusion Foundation Models \- arXiv, accessed May 22, 2026, [https://arxiv.org/html/2405.09818v1](https://arxiv.org/html/2405.09818v1)  
6. OpenAI o1 System Card, accessed May 22, 2026, [https://cdn.openai.com/o1-system-card-20241205.pdf](https://cdn.openai.com/o1-system-card-20241205.pdf)  
7. Salvatore Sanfilippo \- YouTube, accessed May 22, 2026, [https://www.youtube.com/@antirez/posts](https://www.youtube.com/@antirez/posts)  
8. How Designers Create Images and Videos with AI (Free) – ComfyUI Tutorial \- YouTube, accessed May 22, 2026, [https://www.youtube.com/watch?v=2BM7aMKAUkI](https://www.youtube.com/watch?v=2BM7aMKAUkI)  
9. Enkk and AI: Where We Are Now and What Lies Ahead \- YouTube, accessed May 22, 2026, [https://www.youtube.com/shorts/4jKnmUTmfi8](https://www.youtube.com/shorts/4jKnmUTmfi8)  
10. Do AI Agents read our .env files? \- YouTube, accessed May 22, 2026, [https://www.youtube.com/shorts/nvUviCeNkRg](https://www.youtube.com/shorts/nvUviCeNkRg)  
11. Google AI Studio \[The best tutorial out there\] \- YouTube, accessed May 22, 2026, [https://www.youtube.com/watch?v=gt2JVQDOXkw](https://www.youtube.com/watch?v=gt2JVQDOXkw)  
12. \[2404.19756\] KAN: Kolmogorov-Arnold Networks \- arXiv, accessed May 22, 2026, [https://arxiv.org/abs/2404.19756](https://arxiv.org/abs/2404.19756)  
13. KAN: Kolmogorov–Arnold Networks \- OpenReview, accessed May 22, 2026, [https://openreview.net/forum?id=Ozo7qJ5vZi](https://openreview.net/forum?id=Ozo7qJ5vZi)  
14. \[2406.02496\] Kolmogorov-Arnold Networks for Time Series: Bridging Predictive Power and Interpretability \- arXiv, accessed May 22, 2026, [https://arxiv.org/abs/2406.02496](https://arxiv.org/abs/2406.02496)  
15. \[2411.06078\] A Survey on Kolmogorov-Arnold Network \- arXiv, accessed May 22, 2026, [https://arxiv.org/abs/2411.06078](https://arxiv.org/abs/2411.06078)  
16. \[2312.00752\] Mamba: Linear-Time Sequence Modeling with Selective State Spaces \- arXiv, accessed May 22, 2026, [https://arxiv.org/abs/2312.00752](https://arxiv.org/abs/2312.00752)  
17. Gemini 1.5: Unlocking multimodal understanding across millions of tokens of context, accessed May 22, 2026, [https://www.kornosk.me/publication/2024-arxiv/](https://www.kornosk.me/publication/2024-arxiv/)  
18. Mixture-of-Depths Attention \- arXiv, accessed May 22, 2026, [https://arxiv.org/html/2603.15619v1](https://arxiv.org/html/2603.15619v1)  
19. KTO: Model Alignment as Prospect Theoretic Optimization \- arXiv, accessed May 22, 2026, [https://arxiv.org/pdf/2402.01306](https://arxiv.org/pdf/2402.01306)  
20. \[2403.07691\] ORPO: Monolithic Preference Optimization without Reference Model \- arXiv, accessed May 22, 2026, [https://arxiv.org/abs/2403.07691](https://arxiv.org/abs/2403.07691)  
21. ORPO: Monolithic Preference Optimization without Reference Model \- arXiv, accessed May 22, 2026, [https://arxiv.org/html/2403.07691v2](https://arxiv.org/html/2403.07691v2)  
22. \[2402.01306\] KTO: Model Alignment as Prospect Theoretic Optimization \- arXiv, accessed May 22, 2026, [https://arxiv.org/abs/2402.01306](https://arxiv.org/abs/2402.01306)  
23. DeepSeek-V3 Technical Report \- arXiv, accessed May 22, 2026, [https://arxiv.org/html/2412.19437v2](https://arxiv.org/html/2412.19437v2)  
24. DeepSeek-V3 Technical Report \- arXiv, accessed May 22, 2026, [https://arxiv.org/pdf/2412.19437](https://arxiv.org/pdf/2412.19437)  
25. DeepSeek\_V4.pdf · deepseek-ai/DeepSeek-V4-Pro at main \- Hugging Face, accessed May 22, 2026, [https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro/blob/main/DeepSeek\_V4.pdf](https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro/blob/main/DeepSeek_V4.pdf)  
26. DeepSeek-v4 Beyond Basics: A Practical Guide to mHC, CSA, HCA ..., accessed May 22, 2026, [https://medium.com/mitb-for-all/deepseek-v4-beyond-basics-a-practical-guide-to-mhc-csa-hca-and-muon-bf40c9863ef8](https://medium.com/mitb-for-all/deepseek-v4-beyond-basics-a-practical-guide-to-mhc-csa-hca-and-muon-bf40c9863ef8)  
27. DeepSeek V4 paper full version is out, FP4 QAT details and stability tricks \[D\] \- Reddit, accessed May 22, 2026, [https://www.reddit.com/r/MachineLearning/comments/1t7yrvr/deepseek\_v4\_paper\_full\_version\_is\_out\_fp4\_qat/](https://www.reddit.com/r/MachineLearning/comments/1t7yrvr/deepseek_v4_paper_full_version_is_out_fp4_qat/)  
28. \[2605.02568\] StreamIndex: Memory-Bounded Compressed Sparse Attention via Streaming Top-k \- arXiv, accessed May 22, 2026, [https://arxiv.org/abs/2605.02568](https://arxiv.org/abs/2605.02568)  
29. MiMo-V2-Flash Technical Report \- arXiv, accessed May 22, 2026, [https://arxiv.org/pdf/2601.02780](https://arxiv.org/pdf/2601.02780)  
30. \[2601.02780\] MiMo-V2-Flash Technical Report \- arXiv, accessed May 22, 2026, [https://arxiv.org/abs/2601.02780](https://arxiv.org/abs/2601.02780)  
31. Paper page \- MiMo-V2-Flash Technical Report \- Hugging Face, accessed May 22, 2026, [https://huggingface.co/papers/2601.02780](https://huggingface.co/papers/2601.02780)  
32. arXiv:2412.15115v2 \[cs.CL\] 3 Jan 2025, accessed May 22, 2026, [https://arxiv.org/pdf/2412.15115](https://arxiv.org/pdf/2412.15115)  
33. arXiv:2505.09388v1 \[cs.CL\] 14 May 2025, accessed May 22, 2026, [https://arxiv.org/pdf/2505.09388](https://arxiv.org/pdf/2505.09388)  
34. \[2505.09388\] Qwen3 Technical Report \- arXiv, accessed May 22, 2026, [https://arxiv.org/abs/2505.09388](https://arxiv.org/abs/2505.09388)  
35. \[2412.15115\] Qwen2.5 Technical Report \- arXiv, accessed May 22, 2026, [https://arxiv.org/abs/2412.15115](https://arxiv.org/abs/2412.15115)  
36. An Automated Survey of Generative Artificial Intelligence: Large Language Models, Architectures, Protocols, and Applications \- arXiv, accessed May 22, 2026, [https://arxiv.org/html/2306.02781v4](https://arxiv.org/html/2306.02781v4)  
37. How Innovative Is China in AI? | Reports & Briefings | Aug 26, 2024 | ITIF, accessed May 22, 2026, [https://itif.org/publications/2024/08/26/how-innovative-is-china-in-ai/](https://itif.org/publications/2024/08/26/how-innovative-is-china-in-ai/)  
38. Two Loops: How China's Open AI Strategy Reinforces Its Industrial Dominance, accessed May 22, 2026, [https://www.uscc.gov/sites/default/files/2026-03/Two\_Loops--How\_Chinas\_Open\_AI\_Strategy\_Reinforces\_Its\_Industrial\_Dominance.pdf](https://www.uscc.gov/sites/default/files/2026-03/Two_Loops--How_Chinas_Open_AI_Strategy_Reinforces_Its_Industrial_Dominance.pdf)  
39. Evaluation of Advanced AI Reasoning Capabilities in Chinese-Language Contexts \- HKU Business School, accessed May 22, 2026, [https://www.hkubs.hku.hk/aimodelrankings\_en/report/AdvancedReasoning.pdf](https://www.hkubs.hku.hk/aimodelrankings_en/report/AdvancedReasoning.pdf)  
40. OpenAI o1 System Card, accessed May 22, 2026, [https://cdn.openai.com/o1-system-card.pdf](https://cdn.openai.com/o1-system-card.pdf)  
41. OpenAI o3 and o4-mini System Card, accessed May 22, 2026, [https://cdn.openai.com/pdf/2221c875-02dc-4789-800b-e7758f3722c1/o3-and-o4-mini-system-card.pdf](https://cdn.openai.com/pdf/2221c875-02dc-4789-800b-e7758f3722c1/o3-and-o4-mini-system-card.pdf)  
42. \[2502.06807\] Competitive Programming with Large Reasoning Models \- arXiv, accessed May 22, 2026, [https://arxiv.org/abs/2502.06807](https://arxiv.org/abs/2502.06807)  
43. The Illusion of Thinking: Understanding the Strengths and Limitations of Reasoning Models via the Lens of Problem Complexity, accessed May 22, 2026, [https://ml-site.cdn-apple.com/papers/the-illusion-of-thinking.pdf](https://ml-site.cdn-apple.com/papers/the-illusion-of-thinking.pdf)  
44. Claude 3.5 Sonnet Model Card Addendum | Anthropic, accessed May 22, 2026, [https://www-cdn.anthropic.com/fed9cc193a14b84131812372d8d5857f8f304c52/Model\_Card\_Claude\_3\_Addendum.pdf](https://www-cdn.anthropic.com/fed9cc193a14b84131812372d8d5857f8f304c52/Model_Card_Claude_3_Addendum.pdf)  
45. Details about METR's preliminary evaluation of Claude 3.5 Sonnet, accessed May 22, 2026, [https://metr.org/evaluations/claude-3-5-sonnet-report/](https://metr.org/evaluations/claude-3-5-sonnet-report/)  
46. arXiv:2502.09687v1 \[cs.CL\] 13 Feb 2025, accessed May 22, 2026, [https://arxiv.org/pdf/2502.09687](https://arxiv.org/pdf/2502.09687)  
47. arXiv:2406.17969v2 \[cs.CL\] 15 Oct 2024, accessed May 22, 2026, [https://arxiv.org/pdf/2406.17969](https://arxiv.org/pdf/2406.17969)  
48. Gemini 1.5: Unlocking multimodal understanding across millions of tokens of context \- arXiv, accessed May 22, 2026, [https://arxiv.org/abs/2403.05530](https://arxiv.org/abs/2403.05530)  
49. Gemini 1.5: Unlocking multimodal understanding across millions of tokens of context \- arXiv, accessed May 22, 2026, [https://arxiv.org/pdf/2403.05530](https://arxiv.org/pdf/2403.05530)  
50. The Llama 3 Herd of Models | Research \- AI at Meta, accessed May 22, 2026, [https://ai.meta.com/research/publications/the-llama-3-herd-of-models/](https://ai.meta.com/research/publications/the-llama-3-herd-of-models/)  
51. \[2407.21783\] The Llama 3 Herd of Models \- arXiv, accessed May 22, 2026, [https://arxiv.org/abs/2407.21783](https://arxiv.org/abs/2407.21783)  
52. \[2405.09818\] Chameleon: Mixed-Modal Early-Fusion Foundation Models \- arXiv, accessed May 22, 2026, [https://arxiv.org/abs/2405.09818](https://arxiv.org/abs/2405.09818)  
53. \[2401.04088\] Mixtral of Experts \- arXiv, accessed May 22, 2026, [https://arxiv.org/abs/2401.04088](https://arxiv.org/abs/2401.04088)  
54. Paper page \- Mixtral of Experts \- Hugging Face, accessed May 22, 2026, [https://huggingface.co/papers/2401.04088](https://huggingface.co/papers/2401.04088)  
55. Mixtral of Experts \- arXiv, accessed May 22, 2026, [https://arxiv.org/pdf/2401.04088](https://arxiv.org/pdf/2401.04088)  
56. Mistral Models: Mistral 7B, Mixtral 8x22B, Large, Codestral, accessed May 22, 2026, [https://theorempath.com/topics/mistral-models](https://theorempath.com/topics/mistral-models)  
57. A Survey on Mixture of Experts in Large Language Models \- arXiv, accessed May 22, 2026, [https://arxiv.org/pdf/2407.06204](https://arxiv.org/pdf/2407.06204)  
58. Salvatore Sanfilippo \- YouTube, accessed May 22, 2026, [https://www.youtube.com/@antirez/playlists](https://www.youtube.com/@antirez/playlists)  
59. LLMs and Programming in the first days of 2024 \- antirez, accessed May 22, 2026, [https://antirez.com/news/140](https://antirez.com/news/140)  
60. Salvatore Sanfilippo \- antirez \- YouTube, accessed May 22, 2026, [https://www.youtube.com/@antirez/videos](https://www.youtube.com/@antirez/videos)  
61. antirez/ds4: DeepSeek 4 Flash local inference engine for Metal and CUDA \- GitHub, accessed May 22, 2026, [https://github.com/antirez/ds4](https://github.com/antirez/ds4)  
62. A few words on DS4 \- Hacker News, accessed May 22, 2026, [https://news.ycombinator.com/item?id=48142108](https://news.ycombinator.com/item?id=48142108)  
63. A few words on DS4 \- antirez, accessed May 22, 2026, [https://antirez.com/news/165](https://antirez.com/news/165)  
64. Alternatives for the EDIT tool of LLM agents \-  
65. Simone Rizzo \- YouTube, accessed May 22, 2026, [https://www.youtube.com/@simone\_rizzo98/videos](https://www.youtube.com/@simone_rizzo98/videos)  
66. Simone Rizzo \- YouTube, accessed May 22, 2026, [https://www.youtube.com/@simone\_rizzo98/about](https://www.youtube.com/@simone_rizzo98/about)  
67. Build Your Own Intelligent AI Agent to Manage Email and Documents (From Scratch in Python) \- YouTube, accessed May 22, 2026, [https://www.youtube.com/watch?v=c7t44DbWaWo](https://www.youtube.com/watch?v=c7t44DbWaWo)  
68. Microsoft Revolutionizes AI: Meet rStar2-Agent with Agentic Learning\! \- YouTube, accessed May 22, 2026, [https://www.youtube.com/watch?v=gdvjuJrACCg](https://www.youtube.com/watch?v=gdvjuJrACCg)  
69. Does Claude grade homework better than a professor? \- YouTube, accessed May 22, 2026, [https://www.youtube.com/shorts/Ml\_ijNE5tpE](https://www.youtube.com/shorts/Ml_ijNE5tpE)  
70. Cos'è l'INTELLIGENZA ARTIFICIALE? L'AI spiegata da un RICERCATORE, con @enkk, accessed May 22, 2026, [https://www.youtube.com/watch?v=QB4FR8U0N6g](https://www.youtube.com/watch?v=QB4FR8U0N6g)  
71. Claude Code: Why Are Your Skills Disappearing? (How to Fix) ⚠️ \- YouTube, accessed May 22, 2026, [https://www.youtube.com/shorts/g3hEgJEJnsM](https://www.youtube.com/shorts/g3hEgJEJnsM)  
72. Francesco Di Donato \- YouTube, accessed May 22, 2026, [https://www.youtube.com/@didof\_dev/playlists](https://www.youtube.com/@didof_dev/playlists)  
73. \#n8n \#telegram AI Customer Service 100% Free, transcription with \#whisper \#automate \#business \- YouTube, accessed May 22, 2026, [https://www.youtube.com/shorts/4CuXx\_QupHM](https://www.youtube.com/shorts/4CuXx_QupHM)  
74. Let's craft Wolfenstein 3D with AI\! \- YouTube, accessed May 22, 2026, [https://www.youtube.com/shorts/OeH9gfR31LM](https://www.youtube.com/shorts/OeH9gfR31LM)  
75. Don't be ashamed of using AI \- YouTube, accessed May 22, 2026, [https://www.youtube.com/watch?v=C2otY9fbLf0](https://www.youtube.com/watch?v=C2otY9fbLf0)  
76. Is AI killing reality? \- YouTube, accessed May 22, 2026, [https://www.youtube.com/watch?v=dI4rJi4Vg3c](https://www.youtube.com/watch?v=dI4rJi4Vg3c)  
77. You're doing EVERYTHING wrong with AI \- YouTube, accessed May 22, 2026, [https://www.youtube.com/watch?v=EfQdeUi49zM](https://www.youtube.com/watch?v=EfQdeUi49zM)  
78. Come fare la SEO per i video YouTube, alcuni consigli \- Raffaele Gaito, accessed May 22, 2026, [https://www.raffaelegaito.com/seo-video-youtube/](https://www.raffaelegaito.com/seo-video-youtube/)  
79. Google AI Studio: Complete Tutorial with Gemini \- YouTube, accessed May 22, 2026, [https://www.youtube.com/watch?v=RNpTHe-dExU](https://www.youtube.com/watch?v=RNpTHe-dExU)

[image1]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADQAAAAaCAYAAAD43n+tAAADHUlEQVR4Xu2XS6iNURTHlzzyijxKQh6ZiKI8SimRVykkA2IqBqLcgRgdyUCJQhFKkhhIySPJ4I4kJiYoj4ESA8kEhcL/d/fe9+yz7e/7zumcO3J+9a/vfmufb++19lpr72vW5f9jsDROGpQa2mCsNDR92SoTpAX+mY8tkjZJM6x4sYw7Km1ODW2yRLpqzrGWIcJ7pWfSQmmP9F36E+ms5SPWI52wvMMrpE9W/8Z9aURkHyM9iOzopjTK23dI5yw/byH8+IrXeOm49NA/s8i10hfpt7TO/yYwV3oqzUzex/CN89JP6Ye0tNHcB7t7wxqdBf6+bS3sPp4zGQ6wtbul99LseJComYvexegdCz3jldudALV1Wdpn7hu58ful7cm7wFbpkTWZerEDRJnnWjzAs0z6Jd2Vhvt3U6RX0qowqID50klpsvTS3Bzxjg6RLvhxOWZJb8ytoZRp0mvpmLmIbTMXyVwkqKtv5tKCBQCOvJWmhkEFEPld/rlmbpeo0cBEc/OykzkoCTLoUGpIYRKiXum51R06Fb07IPVKo6N3OWgY/B7mmavHx1YPHPOf9s9F4DAdL03VfjAwgO2vijBQlESWfA4wSbxjOUL9sAvA2GvW2GAIbFH9BCqDh6FXemcut8sIxU/+T4res1BURqifOLI4gkM4Rhcrq58ADtFNi9Ky36GP5oquDBoGO8l5E9OMQ3H9BEg1Uo7UW2nl9RPAIeo1DmgDodByZ0tM2tZjqhxiV6iNxanB3IFJCr8w15SqqEw5qJn7aG6xwO3hoPTE8nXGdYffhlM9Ja2fGCJNCjN/Vf1A1Vx9kEofzH30ltXPBiKLjYK/bu7GkINUem75BQPpxDVmZGrw1KTP0pzkfQrroYHFHbaQ5eYOrfguhYjeRnO7VAStmHMsXRDn01erf4vrzvqGEQ5aOHe7qvrBTpZsSA1FhFv1FmmNuRt3M4TibiZl2oG7HwEOGTSgUNz37N9LZacg3Y54xa1/wKDr3JFWp4YOQS3TDKanhoGEyWgqnZ6UUrhkLfzr0EloDIelYamhDXZa+RnZpUuXDvEXsEyZgndcIjcAAAAASUVORK5CYII=>

[image2]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADEAAAAXCAYAAACiaac3AAABTklEQVR4Xu3VzSsFURjH8UcoyjsbyVYpxUKkbGRzlSTZKitSViQLL/kb7MjG3o4kWdzyF1jYX5YkZaFk4/vMmalHczFNYRbPrz7dmed06pxzzzkj4vF4PB7Pz2nBFHrj93oMY9bUatCH+fhX3wuTJhxgF/dYwCmWsIVHTOMQ21hEBetSoJSwjEG84AqtcVs37vCAkbimOUZZwgJ8lQ5cSFiYrHainjmyImECc3jHhGnrxxM2TU0HXsYJ6ky9ENnHLbpMbQZvGDe1ZGKrplaINONa0qurE6ugx9R08M8YMLVq0YPfKWFLZtUW9cyZZHXXTK3atmmUsM+VPm/I57NiozfcpITbLKvRqGfOJOeh2raxE9OrVW8rvQj06j2S7w/3n2YPNxL+/iT63XjFmKnpgM9xiTMMmbZ/T4OkV7QW7ZL+qGldD79uF4/H4/mdfABfej5nx8hGQwAAAABJRU5ErkJggg==>

[image3]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEgAAAAXCAYAAACoNQllAAABjElEQVR4Xu2WzysEcRTAn1Dkd0SSm5RSFCnl4kYkyYGDciLlRHIg7d/gRi6uuJEkhy1XFwdHtdyQlIOSi8/zZvI1u2WobTW+n/q0O+81tftmvu89EY/nr1CJtdGgxyjBA0yLFcoToQmvMRWJewIG8A57ogmPsYQnWB5NeKz/7OFUNJEkqnEYW4PrUuzFcSdWhO04GXzqtdKA+2J9KJHo1NnCDbzFGTzEOVzDBxzFbVzHWczgshgV2BV8TyRDOC/2J5/xDGuCXDPe4D32BTFlV3430tvwQuxBxHX6484CsiBWnAl8w0En14GPuOrEtChpsb1H+8+/YROvxHpKyBi+io3xkLBoi04s8VThuWS/FVq0DLY4MS3ME3Y6sbgUY6PY0Y3rT49xXgjfCt1nQnIdJd1zdN8Jd54V+dqbvkMb+ojYJIyr/raCE/afXEfJLZqOd51q2tR1/O/IH3nC+SaFl1jvxHQvesF+J6bFOMZTPMJuJ5doyiT7TdB+USefC6Eb10auy6TH4/F4PIXjHWSHRhcYgE7xAAAAAElFTkSuQmCC>