---
name: architetture-deepseek-v41-flash-e-qwen38-next
description: "Preparazione per la discussione sull'architettura del modello futuro (Fra, TG msg 2246: «credo ti avevo pre-annunciato l'architettura di DeepSeek V4.1 Flash e Qwen3.8 con n-gram»). Il pre-annuncio NON era registrato da nessuna parte (cercato in wiki, _private e inbox Telegram); i due oggetti sono DeepSeek-V4.1-Flash (arXiv 2609.19969: encoder-decoder causale, 8B attivi in prefill e 16B in decode, KV cache 890 byte/token, memoria condizionale Engram da 196B) e Qwen3.8-Flash-Next (arXiv 2608.30320: ibrido GDN+attenzione 3:1, residuo allargato a quattro rami con gate, 51B di embedding n-gram fuori dall'acceleratore). Fatti, non ancora scelte."
type: entity
tags: [architettura, moe, n-gram, engram, kv-cache, encoder-decoder, residual, from-scratch, decision-input]
sources:
  - "arXiv 2609.19969 — DeepSeek-V4.1-Flash: Pushing the Limits of KV Cache Compression (17/09/2026)"
  - "arXiv 2608.30320 — On the Design of Qwen3.8-Next Architecture: Evaluation, Efficiency, and Training Stability (31/08/2026)"
  - "arXiv 2601.07372 — Conditional Memory via Scalable Lookup (Engram, v2 12/07/2026)"
last_updated: 2026-09-29
---

# DeepSeek-V4.1-Flash e Qwen3.8-Flash-Next — le due architetture da cui parte la discussione

> ⚠️ **Livello di verifica**: abstract e introduzione dei due paper letti **da me sul PDF**; il resto (numero di layer, dettagli di CSA2, Engram da 196B) viene da **riassunti** di pagine web, `[via riassunto]`, da confermare sul PDF prima di costruirci sopra. **Nessuna scelta** è fatta qui: la discussione sull'architettura è nuova e segue il workflow a stadi (definisci → chiarisci → approva → design), non si anticipa.

## DeepSeek-V4.1-Flash (10-17/09/2026)

- **Il problema dichiarato**: i carichi degli agenti sono **input-heavy** — il prefill resta caro e le KV cache saturano memoria e banda. È il nostro stesso regime: tracce agentiche lunghe, contesto che cresce.
- **Causal Encoder-Decoder (CED)**: 552B di backbone MoE, **8B attivi per token in prefill e 16B in decode**. Il prompt lo legge un encoder causale più leggero; la generazione la fa un decoder più pesante. `[via riassunto]` 40 layer, 20 + 20.
- **KV cache**: riuso della KV **fra layer** dentro *Compressed Sparse Attention 2* + KV in **FP4** → **890 byte per token** nella cache globale, ~1/4 di V4-Flash e ~1/437 di V1; con *SWA Bounded Replay* (ricostruire su richiesta gli stati mancanti rigiocando gli ultimi token) la cache persistente scende a ~1/8.
- **Estensioni**: *Single-Pass mHC* (connessioni iper-residuali: più flussi residui), **Engram** (memoria condizionale a lookup di n-gram, `[via riassunto]` 196B), *DSpark* (decodifica speculativa). Pre-training su **45T token** multimodali.

## Qwen3.8-Flash-Next (31/08/2026)

- **125B totali, 6B attivi**, più **51B di tabelle di embedding n-gram tenute fuori dall'acceleratore** e precaricate dalla memoria host. Sui 14 benchmark di pre-training batte il predecessore 397B-A17B su 8 e perde sugli altri 6 di al massimo 2,6 punti, con **1/3 dei parametri attivi, 1/3 dei token e ~1/9 dei FLOP**.
- **Mescolamento dei token**: ibrido **Gated DeltaNet + attenzione piena, uno a quattro** — lo stesso dei nostri candidati 3.6/3.8-27B (F44); in continued-pretraining le attenzioni piene diventano *Qwen Sparse Attention* (indicizzatore compresso a micro-blocchi).
- **Gated Residual**: il flusso residuo **allargato a quattro rami** e letto attraverso un **gate elementwise** — la larghezza aggiunge capacità, il gate decide come spenderla, e dà anche la stabilità.
- ⭐ **La frase che conta per chiunque progetti un modello**: *«Loss and downstream accuracy do not always move together: enlarging the n-gram vocabulary lowers loss monotonically while downstream accuracy saturates.»* E il metodo: ogni cambio si valuta su **tre assi insieme** — loss + benchmark, costo in training/prefill/decode, effetto sugli iperparametri ottimali e sulla stabilità.

## L'idea comune ai due: separare la conoscenza STATICA dal ragionamento DINAMICO

Engram lo dice in chiaro: la memoria condizionale è il complemento del calcolo condizionale dei MoE, e serve a *disaccoppiare il lookup statico di conoscenza dal ragionamento dinamico*. I parametri n-gram si possono tenere fuori dalla GPU perché l'indirizzo del lookup è noto in anticipo. Per un progetto il cui Tier-1 deve essere **intelligenza operativa** e non deposito di conoscenza ([[../decisions/2026-06-28-decisions-d1-d5]], three-tier), è una separazione architetturale dello stesso asse — da discutere, non da assumere.

## Cosa questo NON dice (residui)
- Né l'uno né l'altro è un modello che possiamo addestrare **noi da zero** alla loro scala; il valore è nei **principi** e nelle **ablazioni**, non nei pesi.
- I numeri di layer e di Engram non sono verificati sul PDF.
- Nessuna delle due è stata confrontata con i nostri vincoli (una 2080 Ti da 11 GB in locale, training in cloud, LoRA che deve coprire l'ibrido — F44).

## Links
[[base-model-candidates-2026-07]] · [[modelli-piccoli-settembre-2026]] (LensVLM: la stessa idea «vista compressa → espandi dove serve», a livello di tool invece che di attenzione) · [[../harness-experiment-log]] (F44: LoRA sull'ibrido GDN) · [[generatori-del-training-set-2026-09]]
