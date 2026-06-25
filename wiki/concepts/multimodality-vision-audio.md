---
name: multimodality-vision-audio
description: Feasibility — aggiungere comprensione di immagini/audio all'SLM. Cosa serve davvero (architettura vs base-swap vs wrapper-as-tool), Gemma 4 encoder-free, Qwen3-VL/Omni, spettro di 4 opzioni + raccomandazione (defer native, wrapper-as-tool per MVP). Domanda utente 2026-06-24.
type: concept
tags: [multimodality, vision, audio, encoder-free, gemma4, qwen3-vl, qwen3-omni, architecture, feasibility, scope]
last_updated: 2026-06-24
status: draft — feasibility analysis, decisione rimandata (impatta base-model ADR)
confidence: provisional
---

# Multimodalità (vision + audio) — feasibility

> **Domanda utente 2026-06-24**: "Se volessi metterci dentro vision (immagini) e audio, almeno che li *comprenda* — è possibile? Serve cambiare struttura, o riusciamo a iniettare i file nel contesto così com'è come ha fatto Gemma 4 (che ha tolto i vision/audio token e inietta il file nativo)?"

## 1. Risposta breve
- **Sì, è possibile.** Per sola **comprensione** (input), non generazione.
- **No, non puoi iniettare un file raw in un modello text-only e farglielo capire senza ALCUN meccanismo.** Un modello testuale non ha rappresentazioni visive/audio nei pesi. Serve **una via multimodale** (encoder+projector, oppure il "encoder-free" di Gemma 4, oppure partire da una base già multimodale).
- **MA** puoi ottenere comprensione **senza toccare il nostro modello** facendo convertire il file a testo da un modello esterno (caption/OCR/ASR) nel **wrapper (pi)** e iniettando il testo → vedi Opzione 1. È la via MVP.

## 2. Cosa ha fatto Gemma 4 (verificato — la memoria utente è corretta, con una sfumatura)
[Gemma 4](https://huggingface.co/blog/gemma4) (Google DeepMind, 2026-06-03, **Apache 2.0**):
- **Encoder-free**: elimina gli encoder pesanti (ViT/audio). Al loro posto usa **layer lineari leggeri** che proiettano **patch di pixel** e **waveform audio** *direttamente* nello spazio di embedding dell'LLM; tutto passa per un **singolo transformer decoder-only** con attention unificata. ([MarkTechPost](https://www.marktechpost.com/2026/06/03/google-deepmind-releases-gemma-4-12b-an-encoder-free-multimodal-model-with-native-audio-that-runs-on-a-16-gb-laptop/))
- `[CRITICA/SFUMATURA]` **"encoder-free" ≠ "processing-free"**: non sono byte raw iniettati così com'è — c'è comunque una **proiezione lineare** in embedding, e le immagini **consumano un budget di token** (70/140/280/560/1120 per immagine). Quindi la tua frase "iniettano il file nativo nel contesto" è giusta nello spirito (niente encoder separato), ma resta una conversione leggera + costo in token di contesto.
- **Varianti** (tutte **comprehension-only**, output = testo; ✅ esattamente "almeno che li comprenda"):

| Variante | Param | Context | Modalità | Locale 2080 Ti 11GB? |
|---|---|---|---|---|
| **E2B** | 2.3B eff. | 128K | img+text+**audio** | ✅ probabile (quantizzato) |
| **E4B** | 4.5B eff. | 128K | img+text+**audio** | ✅ probabile |
| 12B Unified | ~12B | 256K | img+text+**audio** | ❌ (serve ~16GB+) |
| 26B-A4B (MoE) | 4B att./26B | 256K | img+text (no audio) | ❌ |
| 31B | 31B | 256K | img+text (no audio) | ❌ |

## 3. Opzioni Qwen (per restare nel nostro ecosistema/tokenizer)
- **Qwen3-VL** (vision-only): esistono varianti piccole (~1B-2B) → fattibili **localmente**. Recipe adapter/projector standard. ([Qwen3-VL](https://github.com/QwenLM/Qwen3-VL))
- **Qwen3-Omni** (text+image+audio+video, genera anche speech): solo **30B-A3B MoE**, richiede **~78 GB GPU** → **cloud only**, NON gira su 2080 Ti. Inoltre è un **modello standalone**, non derivato dalla base Qwen3 text. ([Qwen3-Omni](https://github.com/QwenLM/Qwen3-Omni))

## 4. Lo spettro delle opzioni (objective)

| # | Opzione | Cosa comporta | Costo | Verdetto |
|---|---------|---------------|-------|----------|
| **1** | **Wrapper-as-tool** (NO model change) | pi chiama un modello esterno (caption/OCR vision + Whisper/ASR audio) → **testo** → iniettato nel contesto del nostro SLM testuale | 🟢 basso, fattibile **ora** | **MVP**: comprensione a livello di sistema, modulare, perfetto per pi. Con: lossy (la caption perde dettagli), +latency, non "nativo" |
| **2** | **Adapter/projector su Qwen3 text** | aggiungi vision encoder (SigLIP) + audio encoder + MLP projector → allinea a embedding Qwen3 (freeze LLM → train projector → light unfreeze) | 🟡 medio (training + dati) | Tiene l'ecosistema Qwen. Recipe nota (Qwen-VL). È un **cambio di architettura** |
| **3** | **Base-swap a Qwen3-VL** (vision) | parti da Qwen3-VL piccolo come base Tier 1, applichi three-tier LoRA sopra | 🟡 medio | Vision nativa locale, tokenizer Qwen. Audio NON coperto (servirebbe Omni=cloud) |
| **4** | **Encoder-free nativo (stile Gemma 4)** | (a) adottare Gemma 4 E2B/E4B come base (Apache 2.0, locale, audio incluso) **oppure** (b) implementare la proiezione encoder-free su Qwen3 (ricerca) | 🔴 (a) rompe la continuità Qwen / (b) heavy research | Cutting-edge. (a) è l'unico modo "pronto" per audio+vision locale, ma è **Gemma non Qwen** |

## 5. Raccomandazione (critica oggettiva)
- **Per l'MVP: la multimodalità è scope creep** rispetto al core org-first coding. **Defer** la multimodalità nativa.
- Se vuoi "almeno che li comprenda" **adesso**: **Opzione 1 (wrapper-as-tool)**. Zero modifiche al nostro SLM, si innesta come **extension di pi** (vision/ASR esterni → testo → contesto). È la risposta concreta a "iniettare i file nel contesto" — sì, via un convertitore.
- **Per una versione nativa futura** (Wave 7+):
  - Vision locale sulla linea Qwen → **Opzione 3 (Qwen3-VL piccolo)** o **2 (adapter)**.
  - Audio locale nativo → oggi solo **Gemma 4 E2B/E4B** lo dà pronto (ma è base Gemma, rompe la continuità Qwen [[../decisions/2026-05-21-base-model-pipeline]]).
- **Trade-off chiave da non dimenticare**: la multimodalità nativa **cambia la base model di Tier 1** → impatta [[../decisions/2026-05-21-base-model-pipeline]]. **Non committare ora**; è una **futura ADR**.
- Nota di scope: tutte le opzioni "comprehension-only" → coerente con la richiesta (input, non generazione di immagini/audio).

## 6. Decisione (utente 2026-06-24)
**Multimodalità = POST-MVP.** Confermato dall'utente. Per l'MVP: solo testo (eventuale comprensione via wrapper-as-tool Opzione 1 se serve). Native (Opzione 2/3/4) = **futura ADR** dopo che il core testuale è validato — decisione tra Qwen3-VL (vision) e base-swap Gemma 4 (audio+vision, perde continuità Qwen).

## Sources
- Domanda utente 2026-06-24 (Telegram).
- [Gemma 4 — HF blog](https://huggingface.co/blog/gemma4) · [MarkTechPost Gemma 4](https://www.marktechpost.com/2026/06/03/google-deepmind-releases-gemma-4-12b-an-encoder-free-multimodal-model-with-native-audio-that-runs-on-a-16-gb-laptop/) · [Qwen3-Omni](https://github.com/QwenLM/Qwen3-Omni) · [Qwen3-VL](https://github.com/QwenLM/Qwen3-VL)
- Collega: [[../decisions/2026-05-21-base-model-pipeline]], [[../architecture/wrapper]], [[../decisions/2026-06-23-pi-harness-base]], [[wrapper-context-assembly-example]].
