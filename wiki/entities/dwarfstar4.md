---
name: dwarfstar4
description: DwarfStar 4 (DS4) — motore di inferenza locale self-contained di antirez per DeepSeek V4 Flash (MoE ~284B), quantizzazione asimmetrica 2/8-bit sui SOLI routed experts, KV-cache su disco first-class, coding agent in-process + server OpenAI/Anthropic-compatibile. MIT. Esempio shipped di mixed-precision MoE quant.
type: entity
tags: [entity, inference-engine, moe, quantization, deepseek, antirez, local-inference, wrapper, kv-cache, harness]
sources: [antirez.com/news/165, github.com/antirez/ds4, web research 2026-06-26]
last_updated: 2026-06-26
status: ingested 2026-06-26 (ricerca web, fonti primarie)
---

# DwarfStar 4 (DS4)

> **⚠️ Update 2026-07-08 (utente msg 1346/1347)**: l'utente indica DS4 come **"motore inferenziale"** del progetto ("useremo come motore inferenziale … DS4 di antirez … Deep sick [DeepSeek] ovviamente"). **CLARIFICATION PENDING (2 punti aperti, [[../todo]])**: (1) DS4 è single-model DeepSeek-V4-specifico → lo si vuole come **engine per il TEACHER** (far girare DeepSeek-V4 per la distillazione, coerente con la decisione teacher=DeepSeek-V4) **oppure** come **re-scope del serving** verso DeepSeek-V4 (oggi il piano è vLLM `--enable-lora` per lo SLM three-tier)? (2) **HW**: DS4+DeepSeek-V4 q2 vuole ~96-128GB RAM unificata; l'utente ha **16GB RAM / 11GB VRAM** → **non gira in locale** in nessuna quant → resterebbe reference-di-tecnica o run su cloud/Mac dedicato. Attesa risposta prima di modificare l'architettura serving.

> **Origine**: richiesta utente 2026-06-26 ("aggiungi e studia a fondo Dwarf Star 4"). Motore di inferenza locale **self-contained** di **Salvatore Sanfilippo (antirez)** — già presente tra le risorse dell'utente — purpose-built per **DeepSeek V4 Flash**. MIT, scritto in C + Objective-C, repo `antirez/ds4` (~13K★ in un mese, rilasciato ~mag 2026). Rinominato da "DwarfStar4" → "DwarfStar" (identità del motore indipendente dalla versione DeepSeek).

## 1. Cos'è (in una riga)
Un **single-model inference engine** che fa girare un MoE frontier-class (DeepSeek V4 Flash) su hardware consumer (MacBook/Mac Studio, DGX Spark, Strix Halo) tramite **quantizzazione asimmetrica aggressiva** + **KV-cache su disco**. NON è un GGUF-runner generico né un wrapper su llama.cpp: possiede l'intero stack (loader GGUF, validazione layout tensori, kernel CPU di riferimento, dispatch GPU Metal/CUDA/ROCm, tokenizer, chat rendering, serving HTTP, coding agent TUI). `[EXTRACTED]`

## 2. Modello: DeepSeek V4 Flash (routed MoE)
- **Routed MoE**, ~**284B** parametri totali, ~**13B attivi** per token `[secondary — techstrong/best-ai, da confermare su README]`. Anche **V4 PRO** su macchine ad altissima memoria.
- Context: **32.768** nei benchmark, fino a **1M** dichiarato per il server. `[EXTRACTED]`
- Tesi di antirez: *"questi modelli da poche centinaia di miliardi sono strettamente migliori di modelli più piccoli (anche se dense)"* — quindi meglio un MoE grande quantizzato duro che un dense piccolo. `[EXTRACTED]` ⚠️ è una posizione, non un benchmark (vedi §9).

## 3. ⭐ Quantizzazione asimmetrica 2/8-bit — il punto chiave
Recipe (variante q2): **solo i routed MoE experts** vengono quantizzati — **up/gate a `IQ2_XXS`, down a `Q2_K`** — mentre **shared experts, projections e routing logic restano NON quantizzati** per preservare la qualità. Le varianti q4 mantengono la stessa selettività. Risultato: DeepSeek V4 Flash (~568GB fp) → ~**81GB** → gira su 96–128GB RAM. `[EXTRACTED README + secondary per i GB]`

→ **Conferma *shipped* del nostro [[../concepts/moe-per-expert-quantization]]**: (a) si quantizzano duro i **routed experts** (il grosso dei parametri sparsi); (b) **router + shared + projections in piena precisione** (esattamente la nostra reco "tieni il router in alta precisione"); (c) **mixed-precision anche per ruolo del tensore** dentro l'esperto (up/gate `IQ2_XXS` ≠ down `Q2_K`). È una mixed-precision MoE quant non per-singolo-esperto-by-sensibilità (come MoPEQ) ma **per-ruolo strutturale** — più semplice, deterministica, e funziona ("behave well, work under coding agents, call tools reliably").

## 4. KV-cache come "cittadino di prima classe su disco"
- *"The KV cache is actually a first-class disk citizen"*: **SSD streaming** quando il modello eccede la RAM; indexer compresso + expert caching. `[EXTRACTED]`
- **La sessione È la KV-cache on-disk**: persiste in `~/.ds4/kvcache`, comandi `/save` `/list` `/switch`; checkpoint a *cold / continued / evict / shutdown* → ripresa **senza riprocessare i prefissi condivisi**. `[EXTRACTED]`

## 5. Coding agent in-process + serving
- **Agent in singolo processo**: *"l'inferenza è controllata da dentro l'agente stesso, senza confini socket/API, quindi la sessione è rappresentata dalla KV-cache su disco"*. `[EXTRACTED]`
- **Server OpenAI/Anthropic-compatibile**: `/v1/chat/completions`, `/v1/messages`, `/v1/responses`. Tool-calling in formato nativo **DSML** con **exact replay** per mantenere l'allineamento della KV-cache attraverso richieste **stateless**. `[EXTRACTED]`
- Modalità: non-thinking · thinking (default, profondità configurabile) · **Think Max** · **MTP speculative decoding** (sperimentale). `[EXTRACTED]`

## 6. Piattaforme, hardware, performance
- **Backend**: Metal (macOS, target primario) · CUDA (ottimizz. DGX Spark) · ROCm (Strix Halo) · CPU reference. `[EXTRACTED]`
- **Memoria**: 96GB (o meno con SSD streaming) · 128GB per q2 · 256GB+ per q4 · 512GB per PRO q2 imatrix · DGX Spark 128GB. `[EXTRACTED]`
- **Throughput** (q2): M3 Max 128GB → 58.5 t/s prefill, 26.7 t/s gen (prompt corti); 250 t/s prefill / 21.5 t/s gen (prompt lunghi). M5 Max → 87/34. Mac Studio M3 Ultra → 84 prefill. RTX PRO 6000 Blackwell → ~43 tok/s. `[EXTRACTED]`

## 7. Licenza & filosofia
MIT-compatibile; mantiene i copyright degli autori **GGML** e riconosce l'ecosistema **llama.cpp** (i formati `IQ2_XXS`/`Q2_K` vengono da lì). Filosofia: **un modello alla volta**, validato contro l'implementazione ufficiale (vector validation), **non benchmark-chasing**; self-contained, minimale. `[EXTRACTED]`

## 8. ⭐ Rilevanza per il progetto
1. **Mixed-precision MoE quant**: prova *shipped* di [[../concepts/moe-per-expert-quantization]] (routed-experts 2-bit, router/shared full, per-ruolo). Da studiare se replichiamo l'approccio sul target **Qwen3.6-35B-A3B** (Wave 7-8).
2. **Wrapper/harness** ([[../concepts/wrapper-context-assembly-example]], [[../decisions/2026-06-23-pi-harness-base]]): il pattern **sessione = KV-cache su disco + checkpoint + `/save`/`/switch`** è il nostro stesso obiettivo di *continuità multi-day + persistenza contesto*. L'**exact replay per riallineare la KV-cache su richieste stateless** è una **soluzione concreta al caveat KV-mismatch** del nostro LoRA hot-swap ([[../concepts/multi-expert-collaboration]] §granularità). L'**agent in-process senza socket boundary** è un'alternativa di design al nostro wrapper-su-pi (separato dal serving) — trade-off da valutare.
3. **DeepSeek come teacher** ([[../concepts/scientific-method-operating-protocol]] D2): V4 Flash è enorme e capace → candidato **teacher** per distillazione. ⚠️ **NON** base model nostro (284B ≫ target <30B).
4. **Local-first**: stesso ethos (far girare frontier in locale via quant aggressiva + SSD KV), **regime HW diverso** (RAM unificata Mac 96-128GB ≠ nostra 2080 Ti 11GB VRAM).
5. **MTP**: DS4 usa MTP per **speculative decoding** (accelerazione inference); noi consideriamo **MTP heads in training** ([[../concepts/multi-token-prediction-training]]) — stesso meccanismo, uso diverso.
6. **Steering**: DeepSeek V4 Flash ha riacceso l'interesse per lo steering (art. "DeepSeek-V4-Flash means LLM steering is interesting again", seangoedecke) → lega a [[../concepts/steering-vectors]]. `[pointer non ancora letto a fondo]`

## 9. ⚠️ Note critiche / limiti
- **Single-model engine**: oggi DeepSeek-V4-specifico (antirez punta a model-agnostico ma è narrow) → **non drop-in** per il nostro stack Qwen/vLLM.
- **Qualità del 2-bit "esperienziale", non benchmarkata**: antirez dichiara correttezza via *vector validation* e "not benchmark chasing" → il claim "behave well" è d'uso, **non** un confronto rigoroso vs full-precision. Da verificare se adottiamo l'approccio.
- **Stato beta** (agent **alpha**).
- **Scala/regime**: 284B@2-bit su 128GB RAM unificata è un mondo diverso dal nostro SLM <30B su 11GB GPU — utile come **reference di tecnica**, non come ricetta diretta.

## Sources
- antirez, "A few words on DS4": https://antirez.com/news/165
- Repo + README: https://github.com/antirez/ds4
- GIGAZINE (overview): https://gigazine.net/gsc_news/en/20260515-dwarfstar-4/
- Techstrong.ai (284B→13B attivi, 568→81GB): https://techstrong.ai/articles/redis-creator-brings-deepseek-to-the-mac/
- DS4 technical report (community): https://pradeep-stellar.github.io/ds4
- Collega: [[../concepts/moe-per-expert-quantization]], [[../concepts/wrapper-context-assembly-example]], [[../concepts/multi-expert-collaboration]], [[../concepts/multi-token-prediction-training]], [[../concepts/steering-vectors]], [[../decisions/2026-06-23-pi-harness-base]], [[../decisions/2026-05-21-base-model-pipeline]].
