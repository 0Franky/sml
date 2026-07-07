---
name: training-intelligence-optimization
description: "Analisi tecnica delle domande dell'utente (2026-07-07, msg 1295f-1300) su come massimizzare l'INTELLIGENZA del modello: split pre-train/RL, steering-vector-diff per aggiornare i pesi, optimizer/LR per-parte, quanto addestrare i topic secondari. Con confidence-tag (rule #22)."
type: concept
tags: [training, pre-training, rl, optimization, steering-vectors, data-mixing, catastrophic-forgetting, intelligence]
last_updated: 2026-07-07
sources:
  - user notes 2026-07-07 (Telegram msg 1295-1300), raw in wiki/_private/user-notes-2026-07-07.md
---

# Ottimizzare per l'INTELLIGENZA: analisi delle domande utente (2026-07-07)

> North-star dell'utente (msg 1297): **intelligenza finale »»»» tempo di training**. Ogni raccomandazione qui è pesata su questo: massimizzare la capacità di ragionamento del Tier-1, il costo-tempo è secondario.
> Convenzione confidenza: `[EST]` = stabilito in letteratura · `[INF]` = mia inferenza ancorata · `[FRONTIER]` = area di ricerca aperta / non ancora consolidata · `[?]` = da verificare.

---

## 1. Split del dataset: pre-training (fatti permanenti, NO code-memorization) vs RL (coding). "Ha senso?" (msg 1295f)

**Verdetto: l'istinto è SOLIDO e allineato alla three-tier, con 3 raffinamenti importanti.**

**Perché ha senso** `[INF]`:
- Coerente con [[project_base_model_intelligence]] (Tier-1 = intelligenza/ragionamento, non capacità-codice) e con lo split conoscenza-stabile (pre-train) vs skill-praticata (post-train/RL) che è il paradigma moderno.
- Evitare di memorizzare codice volatile (API/framework che cambiano) nel base è corretto: invecchia male e sprecherebbe capacità su recall invece che su ragionamento.
- Ragionamento + linguaggio + teoria SONO il substrato stabile giusto per un pre-training/continual-pretraining.

**Raffinamento 1 — è CONTINUAL-PRETRAINING, non from-scratch** `[EST]`. Decisione già presa ([[project_training_approach_decided]]: NO pre-training from scratch). Il base Qwen **è già pre-addestrato su enormi quantità di codice+conoscenza**: non puoi "non insegnargli" il codice — lo sa già. Quindi "niente codice nel pre-train" significa: *non aggiungere memorizzazione di codice nel NOSTRO corpus di continual-pretraining*, non "un modello che non ha mai visto codice". L'obiettivo è **rinforzare** ragionamento/teoria/linguaggio, non installare recall di codice.

**Raffinamento 2 — un po' di codice-COME-RAGIONAMENTO aiuta, zero è sub-ottimale** `[EST]`. Finding empirico robusto: il codice nei dati di pretraining **migliora il ragionamento** anche su task non-code (struttura, composizionalità, rigore). Quindi la tua intuizione "pochissimi esempi semplici istruzione→categoria→risultato" è nella direzione giusta, ma il razionale migliore è **codice-come-scaffold-di-ragionamento** (non codice-come-nozione-da-ricordare): tenerne una quota MODESTA e di alta qualità, non azzerarlo.

**Raffinamento 3 — RL da solo non basta: serve il ponte SFT** `[EST]`. Punto tecnico critico: **l'RL (GRPO/PPO) NON installa conoscenza nuova in modo efficiente — AFFILA/ELICITA capacità che il modello già possiede** (reward sparso su qualcosa che non sa fare = nessun segnale). La pipeline standard è **(continual)-pretrain → SFT → RL**, non "pretrain-teoria → RL-coding" saltando l'SFT. La skill di coding va **seminata con SFT** e poi **affilata con RL** (RLVR, reward verificabile). Mappato sulla three-tier: il coding SFT+RL vive sulla **LoRA Tier-2/3**, non sul base → lo split torna perfettamente: **base = continual-pretrain (teoria/ragionamento/linguaggio + codice-scaffold modesto); LoRA = SFT + RL (skill di coding, reward ancorato all'outcome)**.

> Sintesi: SÌ allo split, riformulato come — **base: continual-pretrain di conoscenza stabile + ragionamento (con un po' di codice-scaffold); coding-skill: SFT→RL sulle LoRA**. Lega a [[project_post_training_strategy]] (curriculum SFT staged + ORPO/PRM/GRPO) e [[project_replay_strategy]].

---

## 2. Steering-vector diff per aggiornare i pesi più in fretta (msg 1296 + 1298.2)

> Idea utente: domanda → risposta sbagliata → prendo lo steering-vector della risposta sbagliata, medio/differenzio con quello di una risposta corretta → uso la **differenza dei due vettori** per modificare i pesi automaticamente e più rapidamente.

**Verdetto: l'INTUIZIONE è ottima e mappa su tecniche reali, ma con 3 precisazioni tecniche importanti.**

**Cosa è, nella letteratura** `[EST]`:
- La "differenza tra attivazioni corrette e sbagliate" è esattamente il **contrastive activation steering / representation engineering** (CAA, RepE, ActAdd): la *difference-of-means* tra due insiemi di attivazioni = un **steering vector** che sommi al residual stream. **FUNZIONA — ma è un intervento a INFERENCE-TIME (aggiungi il vettore alle attivazioni), NON un aggiornamento dei pesi.**

**Precisazione 1 — attivazioni ≠ pesi** `[EST]`. Non puoi "sommare" un vettore nello spazio delle ATTIVAZIONI direttamente a una matrice di PESI: vivono in spazi diversi (il vettore è per-token nel residual stream; i pesi sono matrici che mappano tra spazi). L'operazione "somma la diff-di-attivazione ai pesi" non è ben definita.

**Precisazione 2 — l'analogo a livello-PESI esiste, ma è un'altra cosa** `[EST]`: i **task vector / task arithmetic** (Ilharco et al.) operano sulla DIFFERENZA di PESI (fine-tuned − base), non di attivazioni — quelli sì si sommano/sottraggono. È un meccanismo diverso dall'idea (che parte dalle attivazioni).

**Precisazione 3 — la versione MATURA del tuo istinto "contrasto giusto-vs-sbagliato come segnale di training" esiste già ed è a livello-pesi via GRADIENTE: la PREFERENCE OPTIMIZATION (DPO / contrastive loss)** `[EST]`. DPO prende esattamente coppie (risposta preferita, risposta rifiutata) e aggiorna i pesi nella direzione del contrasto — è il tuo "media/diff tra corretto e sbagliato", fatto in modo principiato tramite discesa del gradiente. Quindi:
- **Vuoi un aggiornamento di pesi guidato dal contrasto giusto/sbagliato?** → è DPO/ORPO/preference-tuning (già in [[project_post_training_strategy]]).
- **Vuoi un nudge economico a inference-time senza toccare i pesi?** → activation steering.
- **Vuoi usare la direzione-di-errore per SELEZIONARE/PESARE i dati o come loss ausiliaria?** `[FRONTIER]` → è un'area di ricerca plausibile ma NON un metodo consolidato; da validare empiricamente, non darlo per scontato come "speed-up".

> Sul "velocizza il training" (1298.2): un aggiornamento chiuso-in-forma dalla diff-di-vettori che sostituisce la discesa del gradiente **non è un metodo stabilito** `[FRONTIER]`. La cosa reale e utile è: (a) DPO per il contrasto a livello-pesi; (b) steering per il nudge inference-time; (c) eventualmente usare le direzioni contrastive per la *data curation*. Non aspettarsi un bypass gratuito del gradiente.

---

## 3. Come massimizzare l'intelligenza (msg 1297) — leve ad alto ROI

Dato "intelligenza »»» tempo", spendi generosamente sulle leve che comprano intelligenza `[EST]` salvo dove indicato:
1. **Qualità dati » quantità** (la leva #1): corpus ad alta densità di ragionamento (stile "textbooks"), dedup, decontaminazione. Meglio meno dati eccellenti che tanti mediocri.
2. **Distillazione da un teacher forte** `[EST]`: per un modello piccolo è IL modo di diventare intelligente — distillare traiettorie di ragionamento (CoT) da un modello frontier. ROI altissimo per SLM.
3. **RL con reward verificabile (RLVR / GRPO)** `[EST]`: il post-training RL su task verificabili (math/code/logica) è la frontiera attuale per il reasoning (stile o1/R1). Questo è dove nasce l'"intelligenza" moderna.
4. **Long chain-of-thought / thinking budget** `[EST]`: addestrare il modello a usare traiettorie di ragionamento lunghe + test-time compute.
5. **Curriculum** `[INF]`: foundational→advanced, easy→hard (lega a [[concepts/compositional-curriculum-thinking-optimization]]).
6. **Over-training oltre Chinchilla-optimal su dati di qualità** `[EST]`: essendo un modello piccolo servito molto, conviene addestrare oltre l'ottimo-compute per massimizzare qualità a inferenza.

> Ordine di priorità suggerito per la NOSTRA pipeline: dati-di-qualità + distillazione (base) → SFT su ragionamento → RLVR (il grosso dell'intelligenza) → long-CoT. Il tempo è esplicitamente secondario.

---

## 4. Optimizer / LR / gradient-descent diversi per parti omogenee (msg 1298.1)

> L'utente ha incollato (msg 1299) una risposta corretta (multi-task loss weighting ≈ LR effettivo per-task; GradNorm/uncertainty-weighting Kendall; Adam/AdamW già adatta per-parametro). **La confermo ed estendo** `[EST]`:

- **LR/weight-decay per GRUPPO di parametri = standard**: embeddings, layernorm, matrici hanno già trattamenti diversi. Il **layer-wise LR decay (LLRD/ULMFiT)** — layer bassi LR più piccolo — è una tecnica reale e utile nel fine-tuning.
- **"Spingere diversamente su topic diversi" = loss/data weighting, NON optimizer diversi** `[EST]`: il framework giusto è il **multi-task loss weighting** (peso per-loss ≈ LR effettivo per-task; GradNorm/uncertainty-weighting auto-bilanciano) e soprattutto il **data-mixture / domain weighting** (DoReMi e simili: pesi di campionamento per-dominio). Questa è la leva pratica per "quanto il modello spinge su ciascun argomento".
- **Optimizer LETTERALMENTE diversi per parti diverse = raro e destabilizzante** `[INF]`: si tiene un solo optimizer (AdamW) e si variano LR/weight-decay/loss-weight/mixing. Optimizer recenti (Muon, Shampoo) applicano regole diverse a tipi-di-parametro diversi (matrici 2D vs vettori 1D) — è la versione principiata di "trattamento diverso per parte", ma resta UN optimizer.
- **Adam/AdamW adatta già il passo per-parametro** → gran parte del micro-management lo hai gratis; intervieni a mano solo con motivo strutturale (layer bassi/alti, embedding/matrici, task sbilanciati), non a tappeto (il caveat del msg 1299 è giusto).

> Sintesi: SÌ, si può e in parte è standard — ma la forma corretta è **data-mixture weighting + per-task loss weighting + layer-wise LR**, non "optimizer diversi per parte".

---

## 5. Quanto addestrare i topic "secondari" del Tier-1 (piccola % vs troppo poco) (msg 1300)

> Tensione dell'utente: piccola % di ciascun topic, ma timore che "troppo poco" → imparano cose incomplete/male.

**Verdetto: la piccola % è CORRETTA per il base — a patto di addestrare ANCHE la calibrazione/astensione.**

- Per i topic secondari l'obiettivo è **alfabetizzazione/grounding, non mastery** `[INF]`: un orchestratore intelligente non deve padroneggiare la chimica, deve saperne abbastanza per ragionarci, riconoscere i limiti e sapere quando delegare/verificare. La mastery, se serve, va in una **LoRA Tier-3** (coerente three-tier).
- Il rischio "impara male se troppo poco" è REALE ma la mitigazione giusta **NON è "addestrare di più"** (spreca capacità + rischia [[concepts/catastrophic-forgetting]]) bensì:
  - **(a) qualità > quantità**: pochi esempi rappresentativi e di alta qualità insegnano la *struttura* del dominio senza mastery.
  - **(b) insegnare al modello a SAPERE COSA NON SA** (calibrazione / astensione / verify-step): per i domini shallow deve **riconoscere l'incertezza e verificare/cercare invece di confabulare**. Questo RISOLVE il rischio: *shallow-ma-calibrato ≫ shallow-ma-sicuro-di-sé*. È esattamente la disciplina di [[training-taxonomy/class-confabulation-retrieval-failure]] + regola #22 (fatti incerti → verify-step) + reward-ancorato-all'outcome. **La mezza-conoscenza è pericolosa solo se accompagnata da over-confidence.**
  - **(c) bilanciare via data-mixing** per non erodere le skill core (lega al gate anti-catastrophic-forgetting, msg 1305, [[todo]]).

> Sintesi: piccola % OK, MA il dataset dei topic secondari deve includere esempi che insegnano **"riconosci il limite → verifica/deferisci"** (positivi + negativi, regola #21), non solo nozioni. Così la conoscenza shallow non diventa confident-wrong.

---

## Cross-link
- [[project_base_model_intelligence]] · [[project_three_tier_idea]] · [[project_training_approach_decided]] · [[project_post_training_strategy]] · [[project_replay_strategy]]
- [[concepts/catastrophic-forgetting]] · [[concepts/compositional-curriculum-thinking-optimization]] · [[training-taxonomy/class-confabulation-retrieval-failure]]
- Regole: #22 (integrità fattuale / verify-step) · #18 (gap→classe) · #21 (negativi+completezza)
- Sorgente grezza: `wiki/_private/user-notes-2026-07-07.md` (msg 1295f-1300)
