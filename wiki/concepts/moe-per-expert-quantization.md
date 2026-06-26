---
name: moe-per-expert-quantization
description: Quantizzare in modo differente ogni esperto in un MoE (mixed-precision per-expert). Fattibile e SOTA — bit allocati per frequenza di attivazione o (meglio) sensibilità. Caveat hardware/kernel. Rilevante per il target Qwen3.6-35B-A3B su VRAM limitata.
type: concept
tags: [quantization, moe, mixed-precision, inference, memory, expert, serving, draft]
sources: [user query 2026-06-26 Telegram, MoQE, QMoE, MoPEQ, MxMoE, EAQuant, AlphaQ]
last_updated: 2026-06-26
status: draft — query utente 2026-06-26, citazioni verificate via web search
confidence: research-backed
---

# Per-Expert (Mixed-Precision) Quantization in MoE

## Domanda utente (2026-06-26)
> *"Nelle architetture Mixture of Experts avrebbe senso quantizzare in maniera differente ogni singolo esperto? È possibile farlo?"*

## Risposta breve
**Sì a entrambe**: è possibile ed ha senso. È una linea di ricerca **attiva (2023→2026)** con metodi concreti — si chiama **expert-wise / per-expert mixed-precision MoE quantization**.

## Perché ha senso (razionale)
- Gli esperti sono **eterogenei**: la **frequenza di attivazione** è molto skewed (varianza **>10×** dentro un singolo blocco MoE, es. DeepSeek-V2-Lite `[EXTRACTED da survey]`) e la **sensibilità alla quantizzazione** differisce da esperto a esperto.
- In un MoE quasi tutti i parametri stanno **negli esperti**, attivati sparsamente → spostarli a basso-bit è il leverage di memoria principale; **differenziare i bit** ottimizza ulteriormente il budget.

## Come si allocano i bit (criteri)
1. **Per frequenza di attivazione** (hot → più bit, cold → meno). Semplice, ma la letteratura lo segnala **subottimo**: ignora la sensibilità.
2. **Per sensibilità** (es. **Hessian-trace**): alloca i bit dove quantizzare degrada di più la loss. **MoPEQ** fa esattamente questo (Hessian-trace per-expert + clustering di esperti simili).
3. **Calibration-free**: **AlphaQ** stima l'importanza senza dipendere dai dati di calibrazione.

## Metodi chiave (verificati)
- **MoQE** (arXiv:2310.02410): weight-only ultra-low-bit (fino a **2-bit**) SOLO sui pesi degli esperti → mostra che gli esperti sono **robusti** al basso-bit.
- **QMoE** (Frantar & Alistarh 2023, arXiv:2310.16795): compressione **sub-1-bit** di MoE da trilioni di parametri.
- **MoPEQ** (arXiv:2509.02512): bitwidth per-expert via sensibilità Hessian.
- **MxMoE** (arXiv:2505.05799): mixed-precision MoE con **co-design accuracy + performance dei kernel** (affronta direttamente il caveat hardware).
- **EAQuant** (arXiv:2506.13329) expert-aware PTQ · **MoEQuant** (arXiv:2505.03804) expert-balanced sampling · **AlphaQ** (arXiv:2606.04980) calibration-free bit allocation · **MC#** (arXiv:2510.10962) · **MoQAE** (arXiv:2506.07533, su KV-cache).
- Survey curata: github.com/MoE-Inf/awesome-moe-inference.

> 🛠️ **Esempio SHIPPED**: [[../entities/dwarfstar4]] (DS4, antirez) applica esattamente questo su DeepSeek V4 Flash — quantizza i **routed experts** (up/gate `IQ2_XXS`, down `Q2_K`) tenendo **router + shared experts + projections in piena precisione**. È mixed-precision **per-ruolo strutturale** (non per-singolo-esperto-by-sensibilità come MoPEQ), ma conferma in produzione la reco "router/shared in alta precisione, esperti routed in basso-bit". 568GB→81GB.

## ⚠️ Caveat / critica onesta
1. **Complessità kernel/runtime (#1)**: bitwidth eterogenei rompono il **batched/grouped GEMM uniforme** degli esperti (vLLM/SGLang) → percorsi de-quant per-expert, possibile **calo di throughput** su GPU. MxMoE nasce proprio per co-progettare accuracy+kernel. Su **llama.cpp/GGUF** il per-tensor mixed type è già supportato (più facile su CPU/edge che su GPU fused).
2. **Importanza data-dependent**: frequenza/sensibilità dipendono dalla distribuzione di **calibrazione**. Un esperto "cold" sul calib può essere "hot" sul workload reale (dominio specifico) → quantizzarlo troppo danneggia on-domain. Calibrare sulla distribuzione **target** (o calibration-free).
3. **Interazione col router**: quantizzare un esperto cambia i suoi output → può **spostare le decisioni del router** e il load-balance (feedback). Tenere il **router in alta precisione** (piccolo ma sensibile); expert-balanced sampling.
4. **Rendimenti decrescenti vs uniforme**: gli esperti sono già ridondanti; un buon 4-bit (o meno) **uniforme** è forte. Il guadagno marginale del per-expert mixed va **misurato**, non assunto.

## Rilevanza per il progetto
- **Target Qwen3.6-35B-A3B (MoE)** su VRAM limitata (2080 Ti 11GB → cloud): il per-expert quant permette di **far entrare** il MoE quantizzando duro gli esperti cold/insensibili e tenendo precisi gli hot/sensibili. → ottimizzazione di **Wave 7-8**. **NON** sull'MVP (Qwen3-4B è **dense**, non si applica).
- **Analogo coi nostri LoRA verticali** (Tier 3): si potrebbe quantizzare più aggressivamente i verticali **raramente usati**, tenendo precisi quelli caldi → lega a [[lora-stacking]], [[s-lora]] (serving multi-LoRA), [[slm-coding-landscape]] (base/VRAM).

## Verdetto
Idea **fondata e fattibile**, già SOTA. Per noi è un'ottimizzazione di **Wave 7-8** sul target MoE, da **validare vs un baseline uniforme forte**; tenere router/attention in precisione alta, differenziare gli esperti **per sensibilità** (non solo frequenza), calibrare sulla distribuzione target.

## Sources
- User query 2026-06-26 (Telegram).
- MoQE: https://arxiv.org/abs/2310.02410
- QMoE (Frantar & Alistarh): https://arxiv.org/abs/2310.16795
- MoPEQ: https://arxiv.org/abs/2509.02512
- MxMoE: https://arxiv.org/abs/2505.05799
- EAQuant: https://arxiv.org/abs/2506.13329
- MoEQuant: https://arxiv.org/abs/2505.03804
- AlphaQ: https://arxiv.org/abs/2606.04980
- MC#: https://arxiv.org/abs/2510.10962
- MoQAE: https://arxiv.org/abs/2506.07533
- awesome-moe-inference: https://github.com/MoE-Inf/awesome-moe-inference
- Collega: [[lora-stacking]], [[s-lora]], [[slm-coding-landscape]], [[../decisions/2026-05-21-base-model-pipeline]].
