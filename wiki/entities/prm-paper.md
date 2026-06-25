---
name: prm-paper
description: "Let's Verify Step by Step" (Lightman et al., OpenAI, 2023) — primo paper a stabilire rigorosamente che Process Reward Models (PRM, reward su ogni step intermedio del ragionamento) superano gli Outcome Reward Models (ORM) per training di LLM su task di reasoning. Introduce il dataset PRM800K.
type: paper
entity_type: paper
tags: [paper, openai, prm, process-reward-model, rlhf, reasoning, math, step-level-supervision, prm800k, lightman]
sources:
  - https://arxiv.org/abs/2305.20050
  - https://openreview.net/forum?id=v8L0pN6EOi
  - https://github.com/openai/prm800k
  - https://huggingface.co/papers/2305.20050
last_updated: 2026-05-21
---

# PRM — Let's Verify Step by Step

## Identificativi essenziali

- **Titolo completo**: *Let's Verify Step by Step* `[VERIFIED]`
- **Autori**: Hunter Lightman, Vineet Kosaraju, Yura Burda, Harri Edwards, Bowen Baker, Teddy Lee, Jan Leike, John Schulman, Ilya Sutskever, Karl Cobbe `[VERIFIED]`
- **Affiliazione**: OpenAI (all authors) `[VERIFIED]`
- **Anno**: 2023 (submission 31 maggio 2023)
- **arXiv**: [2305.20050](https://arxiv.org/abs/2305.20050) `[VERIFIED]`
- **Venue**: ICLR 2024 (poster) `[VERIFIED]` (verificato via OpenReview)
- **Dataset rilasciato**: PRM800K — 800,000 step-level correctness labels per soluzioni MATH `[VERIFIED]`
- **Codice/dataset GitHub**: https://github.com/openai/prm800k `[VERIFIED]`

---

## Sezione 1 — Contesto: ORM vs PRM, perché conta la differenza

Per capire l'impatto di "Let's Verify Step by Step" bisogna ricordare lo stato dell'arte di RLHF nella prima metà del 2023. RLHF (Reinforcement Learning from Human Feedback) era già consolidato come paradigma per allineare LLM (ChatGPT, GPT-4, Claude, etc.). Il componente core è il **reward model** — un modello addestrato a predire "quanto è buona una risposta" date preferenze umane.

Tradizionalmente, il reward model riceve come input l'intera risposta (input + output completi) e produce un singolo scalare (il reward). Questo è chiamato **Outcome Reward Model (ORM)**: vede solo l'outcome finale, non il processo che lo ha prodotto. È una scelta naturale per task chiusi (conversazione, instruction following), ma diventa problematica per task di reasoning multi-step.

Il problema con ORM su reasoning è il **credit assignment**:

- Supponi di avere un problema MATH risolto in 8 step.
- Step 1-7 sono corretti, step 8 contiene un errore aritmetico che porta a risposta sbagliata.
- ORM vede: input + output completo, risposta finale sbagliata → reward basso.
- Il modello impara: "qualcosa qui ha sbagliato" ma **non sa cosa**. Potrebbe rivedere step 1 (irrilevante), step 5 (irrilevante), o step 8 (la causa reale). Senza segnale step-level, è un random search.

Inoltre, ORM può premiare "soluzioni con risposta corretta ma reasoning sbagliato" — un classico "right answer for wrong reasons". Esempio: il modello sbaglia uno step, sbaglia anche un altro step, gli errori si cancellano per caso, e la risposta finale è giusta. ORM dà reward positivo, il modello impara che quel pattern di reasoning è "buono", ma in realtà è fragile e non generalizza.

**Process Reward Model (PRM)** affronta questo problema fornendo reward per ogni step intermedio del reasoning. Per il problema sopra: PRM vede gli step 1-7 e dà loro reward positivo, vede lo step 8 e gli dà reward negativo. Il credit assignment è risolto: il modello sa esattamente dove ha sbagliato.

Sembra una distinzione minore, ma è epistemologicamente importante. ORM e PRM rappresentano due modi profondamente diversi di "valutare un ragionamento":
- **ORM**: il giudice guarda solo la sentenza finale, ignora il processo.
- **PRM**: il giudice valuta ogni argomento del processo separatamente.

Il paper di Lightman et al. stabilisce empiricamente che PRM è **strettamente superiore** a ORM su task di reasoning matematico.

---

## Sezione 2 — L'idea core del paper

Il contributo del paper è di tre tipi: `[VERIFIED]`

### (1) Confronto empirico rigoroso PRM vs ORM

Gli autori conducono ablation controllati: stesso budget di annotation umana, stesso modello base, stesso protocollo di training. Sostituiscono solo il tipo di reward model (ORM vs PRM). Il risultato: PRM **supera consistentemente** ORM su MATH benchmark, con margini di 4-10 punti di accuracy a seconda della configurazione.

### (2) Active learning per ridurre il costo di annotation

Annotare ogni step di ogni soluzione MATH è costoso (richiede annotatori umani esperti di matematica). Gli autori mostrano che usando **active learning** — selezionando per annotation solo le soluzioni dove il modello PRM corrente è più incerto — si ottiene un PRM di qualità simile con frazione (~2-3×) meno annotation budget.

### (3) Release del dataset PRM800K

Il vero regalo del paper alla community: 800,000 label step-level di correctness su soluzioni MATH model-generated. È il primo dataset di questa scala per process supervision, e diventa il fondamento per moltissimi lavori successivi (rStar-Math incluso). `[VERIFIED]`

---

## Sezione 3 — Walk-through: come si addestra e usa un PRM

**Training del PRM:**

```
1. Genera N (es. 1000) soluzioni a problemi MATH usando modello base (es. GPT-4)
2. Per ogni soluzione, annotatori umani labellano ogni step:
   - 1: step corretto
   - 0: step incorretto
   - -1: step neutro (es. ripetizione)
3. Training data = (problema, step_1, ..., step_k, label_k) per ogni k
4. PRM è un modello (es. GPT-4 fine-tuned) che predice P(label_k = 1 | problema, step_1, ..., step_k)
5. Loss = cross-entropy sulla predizione di label
```

**Inference con PRM (best-of-N sampling):**

```
1. Per ogni problema MATH al test time:
   a. Genera N (es. 100) soluzioni candidate dal modello generatore
   b. Per ogni soluzione, PRM assegna uno score = aggregazione (es. min, prodotto) degli step-level scores
   c. Seleziona la soluzione con score più alto come risposta finale
```

Questo è **PRM-guided best-of-N**. Sostituisce "scegli la soluzione più frequente" (majority voting) o "scegli la soluzione con higher confidence dal generatore" (greedy decoding) con "scegli la soluzione che il PRM giudica avere il reasoning più solido".

**Risultati:**

- ORM-guided best-of-N: 72.4% accuracy su MATH (PaLM-2)
- PRM-guided best-of-N: **78.2%** accuracy su MATH
- Differenza: +5.8 punti, statisticamente significativo `[VERIFIED]`

---

## Sezione 4 — Il dataset PRM800K

Caratteristiche: `[VERIFIED]`

- **800,000 label step-level** su soluzioni a problemi del MATH dataset
- **75,000 soluzioni uniche** annotate
- **12,000 problemi MATH** coperti
- Annotation in **due fasi**: phase 1 con labels più rumorosi (raccolta veloce), phase 2 con relabeling controllato (qualità più alta)
- **Active learning** integrato in phase 2: annotatori vedono prevalentemente soluzioni dove il PRM corrente è più incerto
- **Licenza permissiva**: open release su GitHub openai/prm800k, usabile per training accademico e commerciale

L'impatto del dataset è enorme: dopo il release, ogni paper su PRM math reasoning lo usa come benchmark o training set di riferimento. È diventato lo "ImageNet del process supervision per math". `[INFERRED]` (sintesi della letteratura successiva)

---

## Sezione 5 — Connessione col nostro progetto

PRM è direttamente rilevante per Wave 6 (post-training) e potenzialmente per Wave 5 (durante SFT iterativa).

**[[entities/rstar-math-paper]]** — rStar-Math usa una variante moderna di PRM chiamata PPM (Process Preference Model), che usa preferenze tra step alternativi invece di label assoluti. Filosoficamente è discesa diretta di Lightman et al., con miglioramenti per ridurre noise di annotation. Per noi: capire PRM "classico" è il prerequisito per implementare PPM. `[INFERRED]`

**[[concepts/contradiction-detection-layer]]** — Il nostro gap di letteratura "contradiction detection layer" è essenzialmente l'idea di un PRM che invece di valutare "questo step è corretto matematicamente?" valuta "questo step contraddice altri elementi del contesto (system prompt, retrieved docs, recent user messages)?". È una formulazione domain-shift di PRM, dal dominio math al dominio organizational. Il framework di Lightman et al. è direttamente adattabile: cambia il labelling protocol per annotare "contradizioni" invece di "errori matematici". `[INFERRED]`

**[[concepts/pre-flight-safety-checks]]** — Il PRM può essere il backbone di pre-flight safety checks: prima di mostrare una risposta all'utente, scorri gli step di reasoning, e se il PRM segnala uno step con score basso, blocca o re-genera. Pattern direttamente preso dal paper. `[INFERRED]`

**[[concepts/error-memo-system]]** — Quando il PRM scopre uno step problematico, il memo "in questi casi, evita di fare X" può essere generato e memorizzato. PRM diventa il "detector" che alimenta il "memory write" del sistema di error memo. `[INFERRED]`

**[[concepts/structured-thinking]]** — PRM impone implicitamente una struttura step-by-step nel reasoning, perché è il livello di granularità a cui può valutare. Se il modello genera reasoning monolitico ("ecco la risposta, motivata dal seguente lungo paragrafo"), PRM non può valutare nulla. Forza l'output a essere step-strutturato — esattamente quello che vogliamo per il nostro Tier 1 organization. `[INFERRED]`

**Wave 6 post-training con PRM** — Decisione strategica: dopo SFT del Tier 1 organization (Wave 5), addestrare un PRM organizational dedicato che valuta step di pianificazione organizzativa (planning multi-day, safety decisions, etc.). Usarlo per:
- best-of-N sampling a inferenza (qualità più alta del singolo forward)
- training data filtering (scarta soluzioni con step PRM-bassi prima di addestrare il modello su esse)
- RLHF reward signal (alternativa al solo outcome reward) `[INFERRED]`

---

## Sezione 6 — Pro, contro, caveat

**Pro:**

- **Migliora drasticamente reasoning quality**: 4-10 punti su MATH, applicabile ad altri reasoning task con adattamento.
- **Risolve credit assignment**: il modello sa dove ha sbagliato, non solo che ha sbagliato.
- **Dataset PRM800K open**: training base disponibile gratis per la community.
- **Compatibile con qualsiasi reward setup**: best-of-N, RLHF, MCTS guidance, ecc.
- **Forza reasoning strutturato**: collateral benefit, il modello impara a generare reasoning step-by-step pulito.

**Contro:**

- **Annotation costoso**: labellare step-level richiede esperti di dominio, è 5-10× più caro di outcome-level annotation.
- **Dominio-specifico**: PRM800K è solo math; adattare PRM ad altri domini richiede nuovo dataset specifico.
- **Granularità di "step" è non triviale**: cosa è uno step? In math è abbastanza chiaro, in coding o organizational reasoning è ambiguo. Servono protocolli espliciti.
- **Bias annotatori**: due esperti possono labellare lo stesso step diversamente (specialmente per step "neutri" o "stilistici"). Inter-annotator agreement è una metrica da monitorare.

**Caveat noti:**

- Il paper usa GPT-4 come generator e PaLM-2 come PRM. Le interazioni con modelli più piccoli (es. nostro Qwen3-4B) non sono testate sistematicamente. `[INFERRED]`
- PRM può overfit a pattern di reasoning specifici: se annotatori labellano "step esplicito" come buono e "step compresso" come cattivo, il modello impara a produrre output verbose anche quando non serve. `[INFERRED]`
- Per task creativi/open-ended, PRM ha limiti fondamentali: non c'è "uno step corretto", ci sono molti modi validi di procedere. Pre-Apocalypse Bias check necessario prima di applicare PRM a task creativi.

---

## Sezione 7 — Idee derivative per il nostro progetto

**(a) PRM organizational addestrato su step di pianificazione**. Dataset: 1000-5000 piani organizzativi multi-day, annotati step-level per: (i) coerenza con principi safety, (ii) realismo nell'esecuzione, (iii) consistency con context fornito. Costo annotation: alto ma alla portata di un piccolo team. `[INFERRED]`

**(b) PRM per criticality awareness**. Mini-PRM specializzato che valuta "questo step ha implicazioni critical che sono state riconosciute esplicitamente?". Forza il modello a esplicitare riflessione su criticality (un nostro requirement Tier 1 fondamentale). `[INFERRED]`

**(c) PRM per coding agent**. Step in coding: "scegliere il design pattern", "definire interface", "implementare metodo", "scrivere test", "validare con test". Ogni step ha verificabilità diversa. PRM coding può valutare: design quality (subjective), test coverage (objective), code style (objective), bug presence (objective via static analysis). Multi-criteria PRM è una direzione promettente. `[INFERRED]`

**(d) Combine PRM con error memo writes**. Quando PRM segnala step problematico durante inference, scrivi memo automatico "in questo tipo di task, attenzione a evitare X". Memo poi recuperati in task simili futuri. Crea un loop di apprendimento online. `[INFERRED]`

---

## Sezione 8 — Domande aperte per noi

**(1) Definizione di "step" per task organizationali**. Cosa è uno step in un piano di pianificazione di un onboarding di un nuovo developer? Subtask? Decision point? Action item? Servono linee guida esplicite prima di annotare. `[INFERRED]`

**(2) Costo annotation per PRM organizational realistic**. Se servono 5000-10000 step labels per ottenere un PRM decente, e ogni label costa $0.50-2 da annotator esperto, totale $2.5K-20K. Affordable ma da budgetare seriamente. `[INFERRED]`

**(3) PRM size vs policy size**. Lightman usa PRM grande (~PaLM-2 scale). Per noi che lavoriamo con Qwen3-4B/8B/35B, il PRM dovrebbe essere uguale al policy o più piccolo? Trade-off da esplorare. `[INFERRED]`

**(4) Online PRM update dal wrapper**. Il wrapper può raccogliere feedback "questo step suggerito era utile/dannoso" e usarlo per aggiornare il PRM continuamente. Pipeline online learning per PRM è un'area aperta. `[INFERRED]`

**(5) PRM vs PPM (process preference)**. rStar-Math sostiene che PPM (preferenze) è più robusto di PRM (label assoluti). Per il nostro domain (organizational), quale è preferibile? PRM ha labels più puliti se annotators concordano. PPM è più rumore-resistant se concordanza è bassa. Ablation a basso costo prima di committare. `[INFERRED]`

---

## Sezione 9 — Sources verificati

- **arXiv abstract**: https://arxiv.org/abs/2305.20050 — accessibile
- **arXiv PDF**: https://arxiv.org/pdf/2305.20050 — accessibile
- **OpenReview (ICLR 2024)**: https://openreview.net/forum?id=v8L0pN6EOi — accessibile
- **HuggingFace papers**: https://huggingface.co/papers/2305.20050 — accessibile
- **GitHub PRM800K (dataset)**: https://github.com/openai/prm800k — accessibile, repo ufficiale OpenAI
- **OpenAI blog announcement**: https://openai.com/research/improving-mathematical-reasoning-with-process-supervision `[INFERRED]` (URL canonical, da verificare accesso)

---

## Note di chiusura

"Let's Verify Step by Step" è uno di quei paper che apre un'area di ricerca intera. Prima del paper, "reward model = ORM single-scalar" era un'assunzione tacita; dopo il paper, è diventato chiaro che per task di reasoning serve granularità step-level. Tutta la linea successiva di lavoro su PRM (Math-Shepherd, PRM-Verify, AutoMathCritique, PPM in rStar-Math, ecc.) discende direttamente da questa fondazione.

Per il nostro progetto, PRM è uno strumento chiave per il Wave 6 (post-training). La pipeline operativa è:

1. SFT del Tier 1 organization (Wave 5)
2. Genera step-level dataset organizational con annotation interna
3. Addestra PRM organizational
4. Usa PRM per (a) best-of-N a inferenza, (b) filter di SFT data quality, (c) reward in RLHF se decidiamo di fare RLHF

L'investimento di annotation è significativo ma proporzionato al valore: senza un PRM dedicato, il nostro Tier 1 sarà allenato solo con outcome supervision (reward su "il piano finale è buono") e patirà gli stessi problemi che ORM patisce su MATH. Con un PRM, possiamo addestrare il modello a fare ogni passo bene, non solo a "azzeccare la risposta finale".

La sfida sarà definire bene cosa è uno "step" nel nostro dominio, e mettere in piedi un'annotation pipeline che mantenga inter-annotator agreement alto. Probabilmente vorremo iniziare con un sotto-dominio molto stretto (es. solo "step di safety analysis") prima di estendere a tutta la pianificazione organizzativa.
