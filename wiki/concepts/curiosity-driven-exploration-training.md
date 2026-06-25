---
name: curiosity-driven-exploration-training
description: Idea esplorativa — training con obiettivo di massimizzare surprise/curiosity. Cosa succede se il modello esplora invece di ottimizzare loss?
type: concept
tags: [concept, training, exploration, surprise, curiosity, intrinsic-motivation, exploratory]
sources: [user notes 2026-05-21 grill-me discussion, Pathak 2017 ICM, Schmidhuber formal theory]
last_updated: 2026-05-21
status: exploratory-not-validated
---

# Curiosity-Driven Exploration Training (Idea esplorativa)

## Trigger utente (2026-05-21)

In risposta alla mia obiezione "Esempio cattivo: diamo al modello giocattoli random come bambini di 2 anni — il modello non gioca, ottimizza loss", l'utente ha replicato:

> "Anche se sarebbe interessante vedere se gli diamo come obiettivo di massimizzare la surprise (come il paper Titan di Google o un paper sempre di Google ma simile che riguardava la memoria), in questo caso cosa succede? Cosa inizia a fare il modello? Inizia ad esplorare? [non demonizzare a priori, magari qualche cosa esce sempre fuori come vedi haha - o magari no hahahaha]"

Direttiva: **non scartare a priori**, esplora cosa succede se sostituiamo loss-minimization con surprise-maximization come obiettivo.

### Chiarimento utente (2026-05-21 dopo sweep paper verification)

L'utente non conosceva la differenza tra Schmidhuber e Friston, ma ha precisato:

> "Io mi riferivo alla funzione di sorpresa che permette a Titans di ricordare nozioni nuove secondo il criterio della sorpresa."

→ **Riferimento canonical**: **Titans (Behrouz et al. 2025, Google)** arXiv 2501.00663. La nozione di "surprise" usata è specifica di Titans, non identica a Schmidhuber né Friston (vedi sezione "Le 4 teorie" sotto).

## Le 4 teorie della "sorpresa" (chiarimento 2026-05-21)

Esistono 4 framework distinti che usano "surprise" come concetto core. Ognuno risolve un problema diverso. Sintesi per non-esperti:

### #1 Titans (Behrouz et al. 2025, Google) — **riferimento dell'utente**

**Problema risolto**: come fare in modo che un transformer **ricordi durante l'inference** cose viste solo una volta (lifelong memory in-context).

**Meccanismo della surprise**:
- Long-term memory = una rete neurale separata, **modificabile a test-time** (non solo durante training)
- Per ogni token in input, calcolano: "quanto questa info mi sorprende, dato quello che già so?"
- **Surprise = magnitudo del gradiente** di una loss di prediction del token corrente
- High surprise → strong update della long-term memory (registra l'info)
- Low surprise → weak update (l'info è già "saputa", non rilevante)

**Esempio concreto**: modello legge documento di 500K token su un nuovo tema scientifico. Frasi banali (con prediction accurate) lasciano memoria immutata. Frasi novel (con prediction error alto) provocano forte update di memoria. Più tardi nello stesso documento, una domanda relativa al tema viene risposta correttamente grazie alla memoria che ha registrato i passaggi novel.

**Bridge col nostro progetto**:
- Possibile architettura per la **memoria persistente del wrapper** (cross-session). Quando l'agent vede info importante (sorprendente), memoria semantic la registra "forte"
- Compatibile con [[error-memo-system]]: memo con surprise alta = lesson importante; memo con surprise bassa = scarta o pesa meno
- Compatibile con [[contradiction-detection-layer]]: contraddizione = forma di surprise → trigger memoria update

### #2 Schmidhuber "Formal Theory of Creativity" (1990-2010)

**Problema risolto**: come dare al modello/agente una **motivazione intrinseca a esplorare**, senza reward esterno.

**Meccanismo della surprise**:
- Modello tiene traccia di quanto bene riesce a **comprimere** i dati che vede (= quanto bene li predice/spiega)
- **Compression progress** = miglioramento della compression nel tempo (sto imparando?)
- Surprise = pattern che il modello **ora comprime meglio rispetto a prima** → "ho imparato qualcosa"
- Reward intrinseco = compression progress

**Diversità da Titans**: Schmidhuber misura surprise come **delta di abilità nel tempo** (sto migliorando?), non come gradiente di un singolo token. È un meccanismo di **curiosità a lungo termine**.

**Esempio**: agent in un nuovo gioco esplora aree dove le sue predictions sono inizialmente cattive ma **migliorano** (compression progress alto). Evita aree dove predictions sono già ottime (niente più da imparare) e aree dove sono random noise (no compression possible).

### #3 Friston "Free Energy Principle" (2010) — neuroscience

**Problema risolto**: teoria unificata del **funzionamento del cervello biologico** (neuroscience, non ML diretto).

**Meccanismo della surprise**:
- Il cervello cerca di **minimizzare** la sorpresa attesa (free energy = upper bound della surprise)
- Predictive coding: i livelli alti del cervello inviano predizioni ai livelli bassi; i livelli bassi rispondono solo se ci sono **errori** rispetto alle predizioni
- Surprise = prediction error
- Comportamento (azione, percezione, apprendimento) è motivato dalla minimizzazione del free energy

**Diversità**: Friston **minimizza** surprise, Schmidhuber **massimizza la velocità di apprendimento**, Titans usa surprise come **signal per memoria**. Stessi termini, framework diversi.

**Esempio**: cervello che si abitua a rumore di sottofondo (predetto bene → niente surprise → ignora). Cervello che si distrae con suono improvviso (alto prediction error → riallocazione attention).

**Per il nostro progetto**: meno direttamente applicabile, è teoria neuroscience. Ma è il framework che ispira ICM Pathak e altri lavori RL.

### #4 Pathak et al. (2017) — Curiosity-Driven Exploration in RL

**Problema risolto**: agent RL in **ambienti con sparse reward**. Come motivare esplorazione produttiva?

**Meccanismo della surprise**:
- Allena un **forward model** che predice il prossimo stato dato (stato, azione)
- Surprise = errore di predizione del forward model
- Reward intrinseco = surprise
- Agent visita stati dove la sua prediction è cattiva (= stati novel) → impara di più

**Diversità**: Pathak applica il concept a RL (azioni in ambiente), Titans a sequence modeling (token in stream).

### Sintesi: quale è rilevante per il nostro progetto?

Allineato col chiarimento utente: **Titans (#1) è il riferimento canonical**. Schmidhuber (#2) è interessante per fase "agent esplora durante training". Friston (#3) e Pathak (#4) sono framework background ma non direttamente applicabili al nostro setup.

---

## Cosa esiste in letteratura (verifica completata)

### Intrinsic Motivation / Curiosity-Driven Exploration

**Pathak et al. 2017, "Curiosity-driven Exploration by Self-supervised Prediction"** (https://arxiv.org/abs/1705.05363) `[EXTRACTED]`:
- Reward intrinseco basato su **prediction error** del modello del proprio environment
- Stato meno predicibile = stato più "interessante" = reward più alto
- Funziona in RL sparse-reward (Mario Bros, Doom): agent esplora nuove zone perché generano alto prediction error
- **Concetto chiave**: il modello stesso impara cosa è "sorprendente" attraverso un Inverse Dynamics Model (IDM) + Forward Model (FM)

### Schmidhuber's Formal Theory of Creativity

**Schmidhuber, "Formal Theory of Creativity, Fun, and Intrinsic Motivation (1990-2010)"** — IEEE TAMD 2010 (vol. 2 iss. 3, pp. 230-247): https://people.idsia.ch/~juergen/ieeecreative.pdf `[EXTRACTED — verified 2026-05-21]`:
- Definisce creatività come massimizzazione di "compressibility improvement" (= imparare a comprimere meglio = surprise diminuisce nel tempo per pattern visti)
- Il modello cerca esperienze che **migliorano** la sua capacità di compressione
- Connessione con teoria dell'informazione: novelty = high entropy + learnable

**Caveat** (verifica paper 2026-05-21): se nel concept file ho parlato di "free energy" come terminologia Schmidhuber, è impreciso. **Free Energy Principle** è di **Karl Friston (2010)** — diverso autore, diverso framework (neuroscience-centric). Schmidhuber usa "compression progress" / "curiosity reward". Da chiarire con utente quale dei due intendeva (probabilmente Schmidhuber, ma vale la pena verificare).

### Titans (Google 2025) — riferimento utente

**Behrouz et al. 2025, "Titans: Learning to Memorize at Test Time"** (Google Research) — arXiv: https://arxiv.org/abs/2501.00663 `[EXTRACTED — verified 2026-05-21]`:

Autori confermati: Ali Behrouz, Peilin Zhong, Vahab Mirrokni (Google Research). Submitted gennaio 2025.
- Memoria neurale che si aggiorna a test-time basata su "surprise" del data point corrente
- Surprise = quanto il data point devia dalle predictions del modello
- Tre componenti: short-term memory (attention), long-term memory (learnable), persistent memory (task-conditioned)
- Se data point è "sorprendente" → forte update della long-term memory; se è "ovvio" → debole update
- È **uno dei lavori più recenti** che applica esplicitamente "surprise" come driver di apprendimento test-time

## Cosa potrebbe succedere se applichiamo a training (speculativo)

### Setup ipotetico

Invece di:
```
loss = CE(model_output, target)
backprop loss
```

Facciamo:
```
forward_model_pred = ForwardModel(state)
actual_state = step(state, action)
surprise = distance(forward_model_pred, actual_state)
intrinsic_reward = log(surprise + ε)  # high surprise = high reward
loss = -intrinsic_reward (massimizzare surprise)
```

### Cosa il modello potrebbe imparare a fare

`[INFERRED]` (non testato nel nostro progetto):

**Scenario A — "Esplorazione produttiva"**:
- Il modello cerca pattern che non sa ancora prevedere
- Genera output diversi tra di loro (alta varianza)
- Cerca combinazioni rare di concetti nei suoi dati
- Manifesta "creatività" emergente

**Scenario B — "Adversarial mode"**:
- Il modello impara a produrre noise (massimizza surprise triviale)
- Output diventa nonsense progressivamente
- Modalità "degenerate": basta produrre random noise per avere alta surprise
- È il **problema classico** del Pathak et al. paper: serve "filtro" per cosa è surprise utile vs noise

**Scenario C — "Esplorazione bloccata"**:
- Il modello converge a un fixed point di "surprise zero" (memorizza tutto)
- Niente esplorazione vera
- Equivalente a training normale

### Mitigazioni note dal paper Pathak

Per evitare Scenario B (noise generation):
- **Inverse Dynamics Model**: surprise misurata su feature space, non pixel space — feature dovrebbero rappresentare invarianti reali
- **Random Network Distillation** (Burda 2018): surprise come differenza tra random network e learned network — più robusto al noise

## Possibili applicazioni al nostro progetto

### Idea 1 — Exploration phase pre-SFT

Tra pretraining (already-done by Qwen team) e nostro SFT, una **breve fase exploratory** dove il modello vede dataset multi-modal o multi-task e si auto-genera curriculum basato su surprise:

- Modello vede 100K sample diversi
- Self-rates ciascun sample per surprise (basata sul suo current state)
- Costruisce curriculum: prima i sample medium-surprise (zone of proximal development), poi high-surprise
- Skip dei sample low-surprise (già "saputi")

Pro: data-efficient, focus su cosa è realmente da imparare.
Contro: setup complesso, non standard.

### Idea 2 — Surprise come signal per error-memo

Quando il runtime modello produce un output che il `contradiction-detection-layer` flagga, oppure quando l'env produce errore, **misuriamo la surprise**: era prevedibile? Se sì → bug serio nel modello. Se no → genuine new lesson.

Bridge naturale con [[error-memo-system]] — il livello di surprise informa quanto "important" è la lesson.

### Idea 3 — Generator B2 driven by uncertainty

Nel [[pipeline-architecture-data-generation]], invece di generare dynamic sample random uniform, il teacher model genera sample che il **student modello attuale** trova surprising:

- Student fa forward pass su 1000 sample candidate
- Teacher genera nuovi sample che sono "simili ai più surprising"
- Active learning style: training data sempre al confine della capability del modello

Pro: convergenza più veloce.
Contro: implementazione complessa, costo extra inferenze student durante data generation.

### Idea 4 — Surprise come exploration metric in agent runtime

Quando il modello in produzione (Wave 9-10) genera un piano, misuriamo surprise del piano vs storia precedente. **Plan surprising** = potrebbe essere creativo (buono) o sbagliato (cattivo). Triggera review esplicita.

## Trade-off

| Pro potenziali | Contro reali |
|---|---|
| Data-efficient (sample selection intelligente) | Setup molto più complesso |
| Modello sviluppa "personalità" più creativa | Rischio di degenerate behavior (noise) |
| Bridge con error-memo e contradiction detection | Letteratura limitata su LLM (più RL classico) |
| Compatibile con la filosofia "come la scuola" (zone of proximal development) | Difficile da debuggare |

## Verdict provisional

`[A]` (assunto): **Idea esplorativa, NON priority per Wave 1-5**. Da rivalutare in Wave 6+ se baseline workflow funziona e abbiamo budget per esperimenti speculativi.

Vale però la pena **monitorare letteratura** 2026 su surprise-driven LLM training. Se emerge un paper convincente, rivalutare.

## Riferimenti da verificare

L'utente ha menzionato due paper specifici:
1. **Titans** di Google — verifica in corso (agent dedicato cerca URL canonical)
2. **Altro paper Google sulla memoria** — utente non ricorda esattamente. Candidati possibili:
   - Memorizing Transformers (Wu et al. 2022, Google) — https://arxiv.org/abs/2203.08913
   - Recurrent Memory Transformer (Bulatov et al. 2022) — https://arxiv.org/abs/2207.06881
   - Long-Range Memory in Transformers (Burtsev et al. 2020)
   - LongMem (Wang et al. 2023)
   - Da chiarire con l'utente

## Open questions

- Quali metriche concrete per "surprise" su LLM output? KL divergence? Log-likelihood drop? Embedding distance?
- Compatibility con SFT standard: surprise-driven come pre-SFT phase, mid-SFT, o post-SFT?
- Implementabile su Qwen3-4B locale o serve modello più grande?
- Letteratura LLM 2024-2026 su intrinsic motivation: esiste? Da cercare.

## Link interni

- [[scuola-learning-philosophy]] — surprise driver = zone of proximal development
- [[error-memo-system]] — surprise informa importance di lesson
- [[pipeline-architecture-data-generation]] — possibile selettore active learning
- [[runtime-symbol-randomization-training]] — surprise NON è alternativa a questo, è layer aggiuntivo

## Status nel progetto

`exploratory-not-validated` — salvato per non perdere l'idea. Da rivalutare empiricamente in Wave 6+ se workflow base funziona. NON priority immediata.

## Sources

- User notes 2026-05-21 grill-me discussion (citazione "non demonizzare a priori")
- Pathak et al. 2017, "Curiosity-driven Exploration by Self-supervised Prediction": https://arxiv.org/abs/1705.05363
- Burda et al. 2018, "Random Network Distillation"
- Schmidhuber, "Formal Theory of Creativity, Fun and Intrinsic Motivation" — IEEE TAMD 2010: https://people.idsia.ch/~juergen/ieeecreative.pdf
- Friston 2010, "The free-energy principle: a unified brain theory?" — Nature Reviews Neuroscience (NB: diverso da Schmidhuber, citation se vuoi specificamente "free energy")
- Titans Google: Behrouz et al. 2025, https://arxiv.org/abs/2501.00663 — verified
