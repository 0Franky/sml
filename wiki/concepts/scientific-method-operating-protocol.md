---
name: scientific-method-operating-protocol
description: Metodo scientifico come protocollo operativo del Tier 1 (system prompt + tracce di training) + two-phase CoT training (fase 1 lunga-corretta via RL, fase 2 ottimizzata-adaptive) + codice di condotta. Idea utente 2026-06-23, in formalizzazione via grill-me.
type: concept
tags: [training, reasoning, scientific-method, cot, rl, post-training, system-prompt, organization-first, draft]
last_updated: 2026-06-23
status: draft — working doc del grill-me 2026-06-23, non ancora validato
confidence: provisional
---

# Scientific Method Operating Protocol (Tier 1)

> **Stato**: draft. Cattura + riorganizzazione + analisi di fattibilità dell'idea utente del 2026-06-23 (Telegram msg 44). In corso di formalizzazione via skill `grill-me`. Le decisioni aperte (§Decisioni aperte) vanno chiuse con l'utente prima di graduare a concept validato + eventuale ADR.

Idea centrale: il **Tier 1 (orchestrator organization-first)** non improvvisa il reasoning. Esegue un **protocollo operativo esplicito basato sul metodo scientifico**, messo nel system prompt e rinforzato dalle tracce di training. Sopra, un **two-phase training**: prima impara a pensare lungo-e-corretto, poi comprime a corto-e-diretto in modo adaptive.

---

## 1. Raw verbatim (utente, 2026-06-23)

> "[...] mettere nel Tier per la maggior parte regole teoriche e concetti formalizzati bene. Nel training set / system prompt definire la metodologia di operatività: nello specifico voglio il metodo scientifico. Quindi prima di tutto OSSERVA, vedi la situazione in cui ti trovi, prendi awareness; dopodiché capisci l'obiettivo, potenziali limiti e problematiche, tutte le aree di operatività per il task. Dopo aver scomposto il problema grosso, si pensa alle interconnessioni dei task estratti e decomposti, come questo impatta nella timeline futura; verificare se ci potrebbero essere problemi nell'operatività tra i diversi task; verificare come e se parallelizzare, quanto e dove. Dividere la timeline in blocchi di task eseguibili insieme (attenzione a sequenze, contraddizioni: uno step o le istruzioni per uno step non devono contrastare con gli altri). Poi si opera; per ogni task o blocco di implementazione aggregato per scopo e concetto si implementa. Perché aggregare per concetti? Perché se c'è una decisione da prendere, sappiamo che varrà per tutto quel blocco, senza creare buchi quando un task successivo riprende gli stessi argomenti e potrebbe mancare la scelta fatta prima. Fondamentale: al termine dei task, verificare e controllare tutti i punti, tutti gli edge case, tutte le possibili problematiche della sezione svolta. Cercare/individuare/verificare errori e fixarli, tutto in loop: trovato un errore, ricominci, identifica, trova, fixa, loop finché non trovi più errori. Inoltre mettere nel system prompt di training le leggi di Asimov, per istruire il modello ad agire nel rispetto dell'utente.
>
> Mettiamo insieme i punti. FASE 1 (training): il modello si addestra a produrre catene di pensiero anche lunghe ma corrette, possibilmente senza errori devianti. Se ci sono errori devianti, due strade: (1) cancelliamo l'errore e rafforziamo quel path di pensiero fixato via RL, oppure (2) lo scomponiamo in parte errata (reward negativo) e parte corretta (reward positivo). Perché far produrre catene lunghe ma senza deviare: per un task complesso l'LLM potrebbe non avere l'intuizione / un path affine, quindi allucinerebbe o andrebbe su sentieri sbagliati. Forzando il metodo scientifico rendo il tutto più deterministico e capisco meglio le scelte e i perché. FASE 2 (post-training): rido quasi le stesse tracce (o leggermente cambiate, stesso scopo); ora che il modello sa fare pensieri corretti anche se lunghi, OTTIMIZZO questi percorsi: il pensiero lungo lo abbiamo reso probabile, ora lo rendo più corto e diretto. Così: se il modello si rende conto di non saper fare una cosa → metodo scientifico con catene lunghe passo-passo; se ha già visto un task simile e lo ha già analizzato → catena di pensiero ottimizzata corta."

---

## 2. Riorganizzazione — il protocollo in 8 passi

Loop operativo (ciclo OBSERVE → ORIENT → DECOMPOSE → PLAN → EXECUTE → VERIFY):

| # | Passo | Cosa fa | Concept wiki collegato |
|---|-------|---------|------------------------|
| 1 | **Observe / Awareness** | Vede la situazione corrente, prende coscienza dello stato | [[structured-context-sections]] (`<current_state>`), [[temporal-awareness-timestamps]] |
| 2 | **Orient / Goal & risk** | Capisce obiettivo, limiti, aree di criticità (anche implicite) | [[pre-flight-safety-checks]], organization-first ([[../architecture/orchestrator-layer]]) |
| 3 | **Decompose** | Scompone il problema grosso in sotto-task | [[task-decomposition-adhoc-context]] |
| 4 | **Interconnections & timeline** | Mappa dipendenze tra sotto-task, impatto sulla timeline futura, conflitti inter-task | [[contradiction-detection-layer]] |
| 5 | **Parallelization** | Decide se/quanto/dove parallelizzare | nuovo |
| 6 | **Timeline blocking** | Divide in blocchi co-eseguibili, attento a sequenze e contraddizioni tra step | [[contradiction-detection-layer]] |
| 7 | **Execute per concept-block** | Implementa per blocco aggregato per scopo/concetto → una decisione vale per tutto il blocco (consistency, no buchi) | nuovo (insight chiave) |
| 8 | **Verify loop** | A fine sezione: controlla tutti i punti/edge case/problemi → trova+fixa → loop finché zero errori | [[error-memo-system]], self-refinement (Reflexion-like) |

**Insight originale del passo 7** (aggregazione per concetto): risolve un problema reale di coerenza nel long-horizon planning — una decisione presa una volta si propaga a tutto il blocco concettuale, evitando che task successivi sullo stesso tema "dimentichino" o contraddicano la scelta. È una forma di *decision caching* per blocco semantico.

---

## 3. Codice di condotta (Asimov)

Idea utente: leggi di Asimov nel system prompt di training → agire nel rispetto dell'utente.

`[CRITICA OGGETTIVA]` Le 3 leggi di Asimov sono **narrative**, progettate per fallire nei racconti, e **vaghe/conflittuali** come spec di alignment operativa. L'**intento** (non danneggiare, servire/rispettare l'utente, sicurezza) è giusto. Raccomandazione: usarle come *ispirazione* per un **codice di condotta operativo concreto** tarato su un agente coding/organization, es.:
- non eseguire azioni irreversibili senza conferma (→ [[pre-flight-safety-checks]]);
- preservare i dati dell'utente (→ secret-section, [[_user-notes-2026-06-23]] nota 8);
- esplicitare rischi e tradeoff prima di agire (→ decision-point-lookahead, [[_user-notes-2026-06-23]] nota 9);
- in caso di scelta ambigua ad alto impatto, informare e deferire all'utente.

Collega a Constitutional AI (system-prompt constitution). **Decisione aperta D4.**

---

## 4. Two-phase training

### Fase 1 — Long, correct, non-deviating CoT
- **Obiettivo**: rendere probabile nello spazio delle scelte un reasoning lungo, strutturato (metodo scientifico) e **corretto**, senza errori devianti.
- **Razionale utente**: su task complessi l'LLM può non avere "intuizione"/path affine → allucina o devia. Il metodo scientifico forza un percorso più **deterministico e legibile** → si capiscono le scelte e i perché.
  - `[CRITICA]` "deterministico" è impreciso: l'LLM resta stocastico. Il beneficio reale è **legibilità/auditabilità + minore varianza + meno path allucinati**. Framing da correggere ma sostanza valida.
- **Gestione errori devianti** (2 strade proposte dall'utente):
  1. **Erase + reinforce**: cancella il segmento errato, rinforza il path corretto fixato (rejection-sampling SFT / DPO-style su corretto vs deviante).
  2. **Split pos/neg**: scomponi la traccia in parte-errata (reward neg) + parte-corretta (reward pos) → **process-level reward**, territorio PRM. Collega [[../entities/prm-paper]], [[../entities/rstar-math-paper]].
- **Crux di fattibilità (D2)**: serve un **segnale di correttezza / label dell'errore**. Facile su domini verificabili (math/code: test, ground truth). **Difficile su pianificazione/organization** (non verificabile deterministicamente) → serve teacher model / LLM-judge / il benchmark criticality custom dell'utente.

### Fase 2 — Optimize to short, adaptive CoT
- **Obiettivo**: ora che il lungo-corretto è appreso, **comprimere** verso catene corte e dirette, **mantenendo la correttezza**.
- **Comportamento adaptive target**: task nuovo/difficile → CoT lunga (metodo scientifico completo); task familiare/già analizzato → CoT corta ottimizzata.
- **Mapping**: è essenzialmente la formalizzazione di [[post-rl-path-optimization]] ("impratichimento"). Letteratura allineata: distillation long-CoT→short, adaptive/elastic reasoning, "thinking budget", System-1/System-2.
- **Decisione aperta D5**: come decide il modello lungo-vs-corto? Serve un **segnale di difficoltà/familiarità** (self-estimated). Si lega alle note metacognizione [[_user-notes-2026-06-23]] (note 4+5).
- **Decisione aperta D3 (metodo RL fase 2)**: length-penalized DPO / distillation con vincolo di correttezza.

---

## 5. Fattibilità — sintesi critica

| Componente | Verdetto | Note |
|---|---|---|
| Metodo scientifico come scaffold CoT | 🟢 fattibile | È structured-CoT/agentic-workflow prompt + training. Allineato organization-first |
| Aggregazione per concept-block (passo 7) | 🟢 insight valido | Decision caching semantico, riduce incoerenze long-horizon |
| Verify-loop fino a zero errori | 🟡 con cap | Rischio loop infinito/oscillazione → serve budget max-iter + soglia "good enough" + escalation utente |
| Asimov verbatim | 🔴 debole | Trasformare in codice di condotta operativo (D4) |
| Fase 1 long-correct CoT (SFT) | 🟢 fattibile | Tracce curate/teacher, filtrate per correttezza |
| Fase 1 RL su devianti | 🟡 dipende dal segnale | Split pos/neg = PRM (solido su verificabili); su planning serve judge/criticality bench (D2) |
| Fase 2 compressione adaptive | 🟢 fattibile | = post-rl-path-optimization formalizzato; serve segnale difficoltà (D5) |
| Claim "determinismo" | 🟡 reframe | → legibilità + minore varianza, non determinismo vero |

**Non è "tutto nuovo"**: gran parte è **sintesi + formalizzazione** di concept già in wiki (structured-thinking, scuola-learning-philosophy, post-rl-path-optimization, staged-curriculum-training, pre-flight-safety-checks, contradiction-detection-layer, task-decomposition-adhoc-context) + le note metacognizione/lookahead del 2026-06-23. **Contributo nuovo**: (a) il metodo scientifico come protocollo Tier 1 esplicito; (b) il curriculum Fase1-lungo→Fase2-corto legato ad esso; (c) il codice di condotta operativo.

---

## 6. Decisioni aperte (grill-me 2026-06-23)

- **D1 — Locazione metodologia** → ✅ **RISOLTA: entrambi**. Train CON il system prompt presente (i pesi imparano `P(completion | methodology-prompt)`) + mantieni il prompt a inference. Per robustezza includere una frazione di esempi con prompt assente/variato → la metodologia **generalizza nei pesi** invece di restare *gated* sul trigger. *Risposta alla domanda tecnica utente*: sì, addestrare con un system prompt **influenza i pesi** — il prompt agisce da segnale di **condizionamento** (il loss è sui token di risposta ma condizionati dall'intero contesto); quanto il comportamento sopravvive senza prompt dipende dalla diversità del dataset. Tenere il prompt a inference serve a poter **aggiornare** la metodologia senza retraining. → ✅ **Confermato utente 2026-06-23**: "mixa".
- **D2 — Segnale errore deviante / generazione tracce** → ✅ **RISOLTA: teacher-student SFT, teacher = DeepSeek** (R1 per long-CoT; open-weight, economico). Filtro anti-bias: su domini verificabili (code/math) NON fidarsi cieco del teacher → filtrare le tracce con esecuzione/test/answer-check e distillare solo CoT **verificate-corrette**. Su planning non verificabile → teacher-as-judge + criticality benchmark custom.
- **D3 — Metodo reward Fase 1** → ✅ **RISOLTA (target): split pos/neg = process-level reward** (PRM/step). Più informativo del segnale trajectory-level (credit assignment localizzato) — confermato da [[../entities/prm-paper]] e [[../entities/rstar-math-paper]]. **Staging efficiente**: MVP bootstrap con rejection-sampling SFT (tieni corrette, scarta devianti, no PRM necessario) → poi graduare a process reward (GRPO+PRM, allineato a `project_post_training_strategy`). → ⏸️ **Utente 2026-06-23 rimanda lo staging**: da valutare se partire con **una sola reward** (rejection-sampling) o **entrambe** (process reward split pos/neg) fin da subito. Il target split pos/neg resta confermato. → ⚠️ **Reward-hacking (priorità utente)**: il process reward (PRM) è gameable → ancorarlo sempre all'**outcome verificabile** + monitor di overoptimization. Difese: [[reward-hacking-mitigation]].
- **D4 — Codice di condotta** → ✅ **RISOLTA: constitution operativa** stile Constitutional AI (no Asimov verbatim). Da redigere concreta: no azioni irreversibili senza conferma · preserva dati (secret-section) · esplicita rischi/tradeoff · deferisci sull'ambiguo ad alto impatto · critica oggettiva > piaggeria. Confluiscono [[pre-flight-safety-checks]], nota 9 lookahead, nota 8 secret, [[out-of-domain-refusal-training]]. → candidato file `agent-constitution`.
- **D5 — Switch lungo/corto Fase 2** → ⏳ **RI-CONTESTUALIZZATA** (utente ha chiesto di spiegare meglio). Domanda: *con quale segnale il modello decide, a inizio turno, se fare CoT lunga (metodo scientifico completo) o corta (ottimizzata)?* Opzioni: (a) self-assessment difficoltà/confidenza appreso, (b) length-prediction head (nota 6a) che setta il budget, (c) router/classifier esterno, (d) confidence-threshold su un primo passaggio veloce. **Reco: (a)+(b) unificate** — self-assessment metacognitivo a inizio turno → setta thinking-budget (length head) ± coeff α depth-steering ([[steering-vectors]] #1). Unifica note 4+5+6a + steering. → ✅ **RISOLTA utente 2026-06-23**: (a) self-assessment + (b) length-head + **steering disattivabile** (opzionale, può creare problemi → toggle) + (d) confidence-threshold come **fallback finale** (attivato solo se la situazione si presenta, altrimenti evitato). Meccanismo unico elegante approvato.

> **Chiusura grill 2026-06-23**: utente — "per il resto accetto tutto, salva le tue raccomandazioni". D2 e D4 accettate come da reco. Grill completo (D3 staging rimane l'unica sotto-decisione deferita).

---

## 7. Next
- Chiudere D1–D5 con utente (grill-me in corso).
- Graduare a concept validato + valutare **ADR** "Scientific-method operating protocol come metodologia Tier 1" (impatta [[../decisions/2026-05-21-training-philosophy-roadmap|roadmap wave]] e [[staged-curriculum-training]]).
- Aggiornare [[post-rl-path-optimization]] (fase 2 = sua formalizzazione) e [[staged-curriculum-training]] (integrare il protocollo nelle stage).
- `/graphify --update`.

## Sources
- User notes 2026-06-23, Telegram msg 44.
- Collega: [[_user-notes-2026-06-23]] (note 4,5,9,6b metacognizione/lookahead), [[post-rl-path-optimization]], [[staged-curriculum-training]], [[structured-thinking]], [[scuola-learning-philosophy]], [[pre-flight-safety-checks]], [[contradiction-detection-layer]], [[../entities/prm-paper]], [[../entities/rstar-math-paper]].
