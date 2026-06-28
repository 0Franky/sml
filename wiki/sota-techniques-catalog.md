---
name: sota-techniques-catalog
description: Catalogo SOTA esaustivo delle tecniche che conviene introdurre nel modello/sistema SLM organization-first — 9 dimensioni (architettura · training · reasoning · metacognizione · agentic · safety · dati · harness · eval). Per ogni tecnica: cos'è · have-already vs NUOVO · fase · classificazione training-vs-harness (F-pi/F-serving/S/F+S) · rischi. Base v0 scritta da me (msg 210), da arricchire col review-loop multi-agente.
type: catalog
tags: [sota, catalog, knowledge-transfer, training, harness, three-tier, review-loop-ready]
sources: [user msg 2026-06-27 (210), wiki/concepts/*, wiki/architecture/harness-feature-catalog, wiki/training-taxonomy/*]
last_updated: 2026-06-27
status: draft v1 — base mia + review-loop multi-agente (10 agenti) integrato; PRE valutazione utente + consolidamento
confidence: provisional
---

# Catalogo SOTA — Tecniche da introdurre nel modello/sistema

> **Scopo** (richiesta utente msg 210): lista *esaustiva* delle tecniche allo stato dell'arte che conviene introdurre, come **knowledge-transfer** — così l'utente non reinventa la ruota e può concentrarsi su innovazioni reali. Per ogni voce marco **cosa abbiamo già** vs **cosa è NUOVO da introdurre** (il valore per l'utente è il NUOVO), con classificazione *dove vive* (pesi vs wrapper vs serving) e *quando* (fase).
>
> **Stato**: questa è la **base v0 scritta da me**. Il passo successivo (msg 210) è il **review-loop multi-agente** — 1 agente specializzato per dimensione (SOTA-sweep web per aggiungere il NUOVO + scovare gap) + 1 agnostico — poi l'utente valuta. I `🔎 da-sweep` marcano dove gli agenti devono approfondire.

## Legenda

- **Stato**: ✅ have-already (già nei nostri concept/decisioni) · 🆕 NEW (da introdurre) · 🔶 parziale (abbiamo il seme, manca formalizzazione/impl)
- **Classif.** (asse training-vs-harness, vedi [[concepts/training-vs-harness-classification]]): **F-pi** (feature/hook harness) · **F-serving** (inference/serving-level) · **S** (skill nei pesi, training) · **F+S** (entrambi)
- **Fase**: MVP (Fase 0-1) · F2 (abilitatori dati RL) · F3 (post-MVP) · ∞ (ricerca/esplorativo)
- **Conf.**: ref con arXiv dove confidente; `[ref?]` dove l'ID va verificato nel review-loop

---

## Dimensione 1 — Architettura del modello

*Cosa cambia nei pesi/struttura: famiglia LoRA, modulazione, long-context, quantizzazione.*

| Tecnica | Cos'è (1 riga) | Stato | Classif. | Fase | Nota/rischio |
|---|---|---|---|---|---|
| **LoRA** (2106.09685) | adapter low-rank additivi | ✅ | F-serving+S | MVP | base della three-tier |
| **DoRA** (2402.09353) | decompone magnitude+direction → più vicino al full-FT | ✅ | F-serving+S | MVP | stack PEFT scelto (r=64) |
| **RsLoRA** (2312.03732) | scaling √rank → stabilità a rank alto | ✅ | F-serving+S | MVP | nel triplo-stack |
| **LoRA+** (2402.12354) | LR diversi per A/B → convergenza migliore | 🔶 | S | MVP | cheap win, da adottare |
| **PiSSA** / **MiLoRA** | init da componenti SVD principali/minori → converge prima | 🆕 | S | F2 | alternativa init, ablation |
| **rsLoRA+QLoRA / NF4** | LoRA su base 4-bit (QLoRA 2305.14314) | 🆕 | F-serving+S | MVP | abilita FT su 2080Ti/VRAM bassa — **alto valore** |
| **X-LoRA** (2402.07148) | router impara scaling per-layer/per-token su LoRA frozen | ✅ (baseline) | S | F3 | alternativa al nostro sequenziale (perde audit) |
| **HMoRA** | gerarchia expert co-trainati, routing depth-dependent | ✅ (baseline) | S | F3 | baseline da battere |
| **MoLE / LD-MoLE / LoRA-Mixer** | mixture di LoRA con gating | ✅ (baseline) | S | F3 | famiglia "learned-concurrent" |
| **S-LoRA** (2311.03285) | serving di migliaia di LoRA, hot-swap per-request | ✅ | F-serving | MVP | è il nostro meccanismo di routing |
| **Steering / activation vectors** | direzione nel residual stream `h'=h+α·v`, modula senza toccare pesi | ✅ (opt-in) | F-serving (+S per policy-α) | F3 | 4° asse; ⚠️ verifica transfer su Qwen3-4B dense (non hybrid) |
| **RoPE-scaling / YaRN** (2309.00071) | estende il context oltre il pretrain | 🆕 | F-serving+S | F2 | per long-horizon/multi-day |
| **Attention-sinks / StreamingLLM** (2309.17453) | mantiene i primi token come "sink" → stream infinito stabile | 🆕 | F-serving | F3 | utile per sessioni lunghe |
| **Sliding-window / GQA / MQA** | attenzione locale + KV condivisa → memoria/latency | 🔶 (Qwen3 ha GQA) | architettura base | — | ereditato dalla base |
| **Multi-Token Prediction (MTP)** | predice N token avanti → speedup + segnale denso (DeepSeek-V3) | 🆕 | S (train) / F-serving (infer) | F3 | self-speculative decoding |
| **Quantizzazione AWQ/GPTQ** | post-training 4-bit per il serving | 🆕 | F-serving | MVP (gate 0-B) | necessaria su 2080Ti |
| **Per-expert MoE quantization** | bit diversi per expert per sensibilità | ✅ | F-serving | F3 (Wave 7-8) | solo se base MoE (Qwen3-35B-A3B) |
| **Speculative decoding** (Medusa/EAGLE/draft) | draft-model o teste multiple → throughput | 🆕 | F-serving | F3 | latency win, non MVP |

🔎 **da-sweep dim-1**: PEFT 2026 oltre DoRA (es. **VeRA**, **LoRA-GA**, **DoRA varianti**, **OLoRA**, **rank-adaptive AdaLoRA**); MoE-LoRA recenti; long-context SOTA 2026 (LongRoPE2, attention compression); KV-cache compression (KV-quant, H2O, SnapKV) — rilevante al nostro "qualità>cache".

---

## Dimensione 2 — Regimi di training

*Come si addestrano i pesi: SFT, RL, process-reward, distillation, curriculum.*

| Tecnica | Cos'è | Stato | Classif. | Fase | Nota/rischio |
|---|---|---|---|---|---|
| **SFT** (instruction tuning) | supervised su (input→output gold) | ✅ | S | MVP | base di tutto |
| **Rejection-sampling SFT** (RFT/STaR) | genera N, tieni i corretti, ri-addestra | ✅ | S | MVP | cheap RL-lite, primo step |
| **GRPO** (2402.03300) | RL group-relative, no critic → economico | ✅ | S | F2 | il nostro RL principale |
| **PPO** | RL classico actor-critic | ✅ (alternativa) | S | F2 | più costoso di GRPO |
| **DPO** (2305.18290) | preference learning senza reward model | ✅ | S | F2 | per L (judge/preference) |
| **ORPO** (2403.07691) | odds-ratio, SFT+preference in un colpo | ✅ | S | F2 | nel piano post-training |
| **KTO** (2402.01306) | preference da segnale binario (no coppie) | 🆕 | S | F2 | label più cheap di DPO |
| **RLVR** (verifiable rewards) | RL su reward deterministico (test/exec) | ✅ | S+F (verifier) | F2 | cardine: scorer≠scored, Classe F |
| **PRM / process-reward** (2305.20050) | reward per-step, non solo outcome | ✅ | S+F | F2 | ancorato all'outcome (anti-hack) |
| **Potential-based reward shaping (PBRS)** (Ng 1999 / Wiewiora 2003) | shaping che NON cambia l'optimum | ✅ | S | F2 | base del nostro phased-reward |
| **Curriculum staged** | reasoning→organization→criticality→coding | ✅ | S | F2 | idea utente, 4 stage |
| **Distillation long→short CoT** | teacher CoT lunga → student CoT corta | ✅ (two-phase) | S | F2 | fase 2 del two-phase CoT |
| **On-policy distillation** | student genera, teacher scora/corregge on-policy | 🆕 | S | F2 | più efficiente di SFT-su-teacher |
| **RLAIF** | reward da AI-feedback invece che umano | ✅ | S+F | F2 | judge LLM, anti-judge-gaming |
| **Self-play / self-improvement** | il modello genera task per sé (SPIN, Self-Rewarding) | 🆕 | S | F3 | rischio collasso/echo-chamber |
| **Rubric/checklist-as-reward** (2607.xxxxx) | reward da rubrica strutturata | 🔶 (quality-tiers) | S+F | F2 | rischio reward-hacking sul self-score |
| **Length/efficiency penalty** | penalizza CoT inutilmente lunga | ✅ | S | F2 | nel two-phase + adaptive-depth |
| **RLHF refusal/safety** | allinea su refusal e condotta | ✅ | S | F2 | constitution + out-of-domain |

🔎 **da-sweep dim-2**: RL 2026 oltre GRPO (**DAPO**, **GSPO**, **Dr.GRPO**, **VAPO**, RLVR scaling); reward-model SOTA (generative RM, **GenRM**, rubric-RM); decontamination-aware training; data-efficient SFT (LIMA/AlpaGasus già citati); curriculum auto-paced.

---

## Dimensione 3 — Reasoning

*Come il modello ragiona: CoT, struttura, profondità adattiva, ricerca, riflessione.*

| Tecnica | Cos'è | Stato | Classif. | Fase | Nota/rischio |
|---|---|---|---|---|---|
| **CoT** (2201.11903) | ragionamento esplicito step-by-step | ✅ | S | MVP | base |
| **Structured-thinking `[V]/[A]/[?]`** | marker epistemici + tabelle di check | ✅ | S | MVP | nostro substrato, task primario Tier 1 |
| **Scientific-method protocol (8 passi)** | observe→orient→…→verify-loop | ✅ | S | MVP | macro-loop Tier 1 |
| **Self-consistency** (2203.11171) | N campioni → maggioranza | ✅ | F-serving+S | F3 | costo×N, per task critici |
| **Two-phase CoT** (lunga-corretta→corta-adaptive) | curriculum di compressione | ✅ | S | F2 | idea utente |
| **Adaptive-depth / think-or-not** (S-GRPO 2505.10832, AdaptThink, AutoThink) | decide *se/quanto* pensare | 🔶 | S | F2 | reward decaying su exit-position |
| **Self-Refine** (2303.17651) | genera→critica→rivedi (stesso modello) | ✅ | S | F2 | rischio confabulazione del critique |
| **Reflexion** (2303.11366) | riflessione verbale da feedback → memoria | ✅ | S+F | F2 | lega a error-memo |
| **MCTS / lookahead reasoning** (rStar-Math 2501.04519) | ricerca ad albero sui passi | ✅ | S+F-serving | F3 | costoso, per math/algoritmi |
| **Verify-loop con cap** | verifica pre-risposta + cap anti-loop | ✅ | S | MVP | nel substrato |
| **Decision-point lookahead (simula A/B)** | simula esiti, decide procedi/cerca/chiedi | ✅ | S (+F deferral) | F2 | signature org-first; ⚠️ reward solo se predizione verificata |
| **PlanSearch / decompose-first** (MinD 2505.19788) | pianifica poi esegue per sezioni | ✅ | S+F | F2 | base anche del section-boundary |
| **Tree/Graph-of-Thoughts** (2305.10601) | esplora rami di ragionamento | 🆕 | S+F-serving | F3 | overhead alto, casi specifici |
| **Backtracking / stream-of-search** | il modello impara a tornare indietro nel reasoning | 🆕 | S | F3 | utile per error-recovery |

🔎 **da-sweep dim-3**: reasoning 2026 (long-CoT efficiency, **latent reasoning**/Coconut, **budget-forcing**/s1, parallel-thinking, **self-verification** trainata); confidence-aware CoT; reasoning-distillation SOTA.

---

## Dimensione 4 — Metacognizione

*Il modello che ragiona su sé stesso: degradazione, compact, incertezza, situational-awareness.*

| Tecnica | Cos'è | Stato | Classif. | Fase | Nota/rischio |
|---|---|---|---|---|---|
| **Degradation-awareness** | riconosce contesto degradato/loop/perdita-filo | 🔶 (gated-training) | F+S | F2-3 | INERTE senza training (§2ter) |
| **When-to-compact** (AdaCoM 2605.30785, ReSum 2509.13313) | decide *quando* compattare il contesto | 🔶 | F+S | F2-3 | manager separato, scorer≠scored |
| **Low-confidence → gather/ask** (EVPI 2511.08798, SELAUR 2602.21158) | sotto incertezza: STOP→gather a budget→ASK | ✅ (concept) | F+S | F2 | reward "l'info ha cambiato la decisione?" |
| **Uncertainty / calibration / abstention** | stima la propria confidenza, si astiene | 🆕 | S | F2 | ⚠️ verbalized-confidence sovra-confidente (2509.21545) → non premiare self-report |
| **When-to-stop (task)** | capisce quando un task è "fatto" | 🔶 | S+F | F2 | lega a quality-tiers/DoD |
| **Situational-awareness (situation-table training)** | situazione→azione-corretta nei pesi | 🆕 (concept pending) | F+S | F2 | addestra il COMPORTAMENTO non il file-path |
| **Self-analysis / strategy-revision** | post-mortem di traiettoria + revisione strategia | ✅ | S+F | F2 | outcome-anchored (anti-confabulazione) |
| **Interruption-robust reasoning** | mantiene accuratezza se interrotto a fine-sezione | 🆕 (gap §2ter) | F+S | F3 | senza training −60% (2510.11713) |

🔎 **da-sweep dim-4**: metacognition SOTA 2026 (introspection benchmarks, **calibration training** methods, selective-prediction, **confidence-as-reward** pitfalls, knowing-what-you-know).

---

## Dimensione 5 — Agentic

*Tool-use, multi-expert, planning, recovery, memoria, interruzione.*

| Tecnica | Cos'è | Stato | Classif. | Fase | Nota/rischio |
|---|---|---|---|---|---|
| **Tool-use (RLVR su tool)** | impara a chiamare tool con reward verificabile | ✅ | S+F | F2 | sandbox/verifier (Classe F) |
| **Multi-expert segment-and-rerun** | expert sequenziali a confine-stage, state passing | ✅ | S+F-serving | F3 | paper-claim #6, audit-friendly |
| **Planning/decomposition (plan→execute)** | plan-mode + context ad-hoc per step | ✅ | S+F | F1 | spina dorsale Classe B |
| **Dependency-aware error recovery** | fix propagato a tutte le decisioni dipendenti (truth-maintenance) | 🆕 (concept pending) | F+S | F2 | dep-graph esiste, traversal=training |
| **Memory (error-memo)** | post-mortem 2-livelli, reiniettato top-K | ✅ | F+S | F2 | recency×freq×semantic |
| **Long-term memory (MemGPT 2310.08560 / Mem-α / A-MEM)** | gerarchia di memoria paginata | 🆕 | F (+S policy) | F3 | SQLite+embedding differito |
| **Task-interruption (preemption-by-urgency)** | enqueue+reference vs preempt su segnale HARD | ✅ | S+F | F1 | default-enqueue (anti-thrash) |
| **Section-boundary injection (MinD multi-call)** | inietta update a fine-sezione (`stop=["</section>"]`) | 🔶 (decisione presa) | F+S | F3 | implementiamo NOI; valore gated-training |
| **Self-correction loop (agentic)** | rileva-failure→ripara, senza human | ✅ | S+F | F2 | lega a verify-loop + error-memo |
| **Subagent orchestration / fan-out** | delega a sub-agenti paralleli | 🆕 | F (+S decisione) | F3 | è ciò che USIAMO noi nel meta-lavoro |
| **Computer-use / browser-use** | interazione con UI/web | 🆕 | F+S | ∞ | fuori scope coding-MVP |

🔎 **da-sweep dim-5**: agentic 2026 (SWE-agent scaffolds, **AgentEvolver**, tool-RL recenti, multi-agent debate/verification, memory-OS SOTA, long-horizon agent benchmarks).

---

## Dimensione 6 — Safety / Alignment

*Guardrail, anti-reward-hacking, difese, refusal.*

| Tecnica | Cos'è | Stato | Classif. | Fase | Nota/rischio |
|---|---|---|---|---|---|
| **Agent constitution** | codice di condotta operativo (16 principi) | ✅ | S (+F SYSTEM.md) | MVP | sostituisce Asimov |
| **Reward-hacking mitigation** | outcome-anchored, scorer≠scored, monitor, ensemble | ✅ | S+F | F2 | vincolo cross-pipeline #1 |
| **Secret-section exfiltration defense** | secrets-map + scanner deterministico in uscita | ✅ | F-pi (+S L1) | MVP | Classe C, scorer≠scored |
| **Untrusted-content delimiting** | `<untrusted_zone>`+marker UUID anti-injection | ✅ | F-pi | F1 | OWASP LLM01 |
| **Pre-flight safety checks** | gate prima di azioni distruttive (rm/DROP) | ✅ | F-pi | MVP | git-check reversibilità |
| **Path-portability linter** | no path assoluti/username in artefatti versionati | ✅ | F-pi | MVP | caso speciale scanner |
| **Out-of-domain refusal training** | refusal su task fuori-scope + hint | ✅ | S | F2 | anti over-refusal (bilanciato) |
| **Constitutional AI / RLAIF safety** (2212.08073) | self-critique guidato da principi | 🔶 | S | F2 | base teorica della constitution |
| **Adversarial robustness / jailbreak defense** | resistenza a prompt avversari | 🆕 | S+F | F3 | red-team training |
| **Deliberative alignment** | ragiona sulle policy prima di rispondere | 🆕 | S | F3 | allinea reasoning+safety |

🔎 **da-sweep dim-6**: safety 2026 (jailbreak-defense SOTA, **prompt-injection** benchmark/difese, reward-hacking detection recenti, **monitor/probes** interpretability-based, unlearning).

---

## Dimensione 7 — Dati

*Generazione, decontaminazione, regimi dinamici, precisione, gym.*

| Tecnica | Cos'è | Stato | Classif. | Fase | Nota/rischio |
|---|---|---|---|---|---|
| **Synthetic / self-instruct** | genera dati da seed/template | ✅ | dati | F2 | qualità>quantità (LIMA) |
| **Dataset on-the-fly pseudo-random** | template→versioni random (posizione/lingua) | ✅ | dati+S | F2 | ×3-5 = knob da ablation |
| **Runtime-symbol-randomization** | rinomina identifier (AST-level) anti name-bias | ✅ | dati | F2 | codebase-grounded + hash |
| **Dynamic-context training regime** | contesto distribuito realisticamente (Gaussians/LogNormal) | ✅ | dati | F2 | edge-case aim-grande/state-piccolo |
| **Char-level precision training** | esercizi #token/#char (token=char 1:1) | 🔶 | dati+S | F3 | per proprietà output |
| **Adversarial needle-in-haystack (training)** | needle a posizione random come regime | ✅ | dati | F2 | paper-claim #5 |
| **Decontamination** | rimuove leakage train↔eval | ✅ | dati | F2 | obbligatorio per claim |
| **SWE gym (SWE-Gym/SWE-smith/R2E-Gym)** | ambienti Docker pronti per RL su repo reali | ✅ | F (infra) | F2 | NON minare da zero |
| **Difficulty filtering / curriculum data** | ordina per difficoltà crescente | 🆕 | dati | F2 | yield/efficienza |
| **Evol-Instruct / WizardLM** | complica progressivamente le istruzioni | 🆕 | dati | F2 | diversità SFT |
| **Persona/diversity sampling** | varia stile/persona per generalizzazione | 🆕 | dati | F3 | anti-mode-collapse |
| **Data attribution / influence** | quali dati guidano quali capacità | 🆕 | dati | ∞ | costoso, diagnostica |

🔎 **da-sweep dim-7**: data 2026 (synthetic-data pipelines SOTA, **rephrasing/ backtranslation**, quality-filtering RM, **agentic data generation**, contamination-detection tools).

---

## Dimensione 8 — Harness / Wrapper

*Le feature-class del wrapper su pi (vedi [[architecture/harness-feature-catalog]]).*

| Tecnica | Cos'è | Stato | Classif. | Fase | Nota |
|---|---|---|---|---|---|
| **Classe A — Context-assembly & memory** | lane + `ctx.getContext()` + VARS O(1) | ✅ | F-pi | MVP-F1 | 4-lane MVP → completo F1 |
| **Classe B — Dynamic context & attention** | ad-hoc context, attention, injection, contradiction | ✅ | F-pi (+S) | F1-F3 | section-boundary = nostro |
| **Classe C — Safety & guardrails** | gate/scanner deterministici | ✅ | F-pi | MVP | scorer≠scored |
| **Classe D — Reasoning & recovery** | structured-thinking, recovery policies | ✅ | S (+F) | MVP-F2 | skill-pesante |
| **Classe E — Routing & serving** | model-entry+`setModel`, S-LoRA hot-swap | ✅ | F-pi+F-serving | F1-F3 | three-tier |
| **Classe F — Verification & sandbox** | runner Docker per verifier/reward | ✅ | F (infra) | MVP(0-A)-F2 | bottleneck-buster |
| **Situation-table lane (router)** | lane "SE situazione X → azione Y" | 🆕 (gap Classe A) | F-pi+S | F2 | nuova lane + skill |
| **Autocompact / compact_context tool** | tool + trigger euristico→appreso | 🔶 | F+S | F1-F2 | Fase1=euristica, training dopo |
| **Dep-graph (interconnections+deps)** | grafo dipendenze per error-recovery | ✅ (esiste) | F-pi | F1 | traversal=skill |
| **Harness-capabilities-as-files** | temp-read N file→nota→close-to-reclaim | ✅ | F-pi+S | F1 | primitiva, caveat KV-cache |

🔎 **da-sweep dim-8**: harness 2026 (context-engineering patterns, **agent-scaffold** comparativi, prompt-caching strategies, structured-output/constrained-decoding integrazione).

---

## Dimensione 9 — Eval

*Come misuriamo: benchmark, criticality, held-out, anti-cry-wolf.*

| Tecnica | Cos'è | Stato | Classif. | Fase | Nota |
|---|---|---|---|---|---|
| **LiveCodeBench** | coding contaminazione-resistente | ✅ | eval | F1 | per Tier 2/3 |
| **SWE-Bench (Lite/Verified)** | bug-fix su repo reali | ✅ | eval | F2 | Tier 1+3 |
| **Criticality benchmark (custom)** | 200 task safety/criticality | ✅ | eval | F1 | paper-claim #4 |
| **Held-out probes (post-compact)** | l'info-chiave è ancora risolvibile? | ✅ | eval | F2 | non-gameable con verbosità |
| **Balanced-accuracy (anti cry-wolf)** | bilancia falsi-positivi/negativi | ✅ | eval | F2 | coppia untracked/tracked |
| **IFEval / instruction-following** | aderenza a istruzioni verificabili | 🆕 | eval | F2 | Area 15 |
| **τ-bench / tool-agent eval** | agentic multi-turn con tool | 🆕 | eval | F2 | per Classe E/agentic |
| **Calibration metrics (ECE)** | quanto la confidenza è calibrata | 🆕 | eval | F2 | per dim-4 metacognition |
| **LLM-as-judge (con anti-gaming)** | valuta L con ensemble di lenti | ✅ | eval | F2 | ancorato al trace |
| **Pass@k / maj@k** | robustezza su k campioni | ✅ | eval | F2 | standard coding |
| **Contamination report** | misura leakage pre-claim | ✅ | eval | F2 | obbligatorio |

🔎 **da-sweep dim-9**: eval 2026 (agentic-eval SOTA, **LiveBench**, contamination-free harness, criticality/safety-eval esistenti da citare, reward-hacking-eval, long-context eval RULER/NIAH varianti).

---

## Dimensione 10 — Ingegneria orizzontale (trasversale)

*Non "cosa fa il modello" ma l'**ingegneria attorno** che abilita i claim — scoperta dall'agnostico come il gap più grosso (§RL-0). Diverse sono decisioni di **setup MVP irreversibili** se dimenticate. Consolidata qui nel corpo (era solo in §RL-0).*

| # | Tecnica | Cos'è | Stato | Classif | Fase | Nota/rischio |
|---|---|---|---|---|---|---|
| **H1** | Reproducibility / experiment-tracking | seed/determinismo/lockfile/config-versioning/run-manifest (WandB/MLflow/TensorBoard) | 🆕 | F (infra) | setup MVP | claim non-riproducibile = morto in review; costo ~0 ora |
| **H2** | Training observability | grad-norm/loss-spike/NaN + reward-collapse + KL-divergence monitoring | 🆕 | F (infra) | F2 (avvio RL) | RL diverge in silenzio → budget bruciato |
| **H3** | Serving/deployment ops | **latenza reale hot-swap S-LoRA**, throughput vLLM, KV-budget 11GB, OOM-handling | 🆕 | F-serving | F1 | il claim three-tier ha bisogno di un numero di latenza |
| **H4** | Data licensing / provenance | filtro GPL, ToS dei teacher-model, **provenance-manifest** | 🆕 | dati/processo | decisione MVP | north-star commerciale → vedi [[decisions/2026-06-28-open-decisions-briefing]] + Dim-7 |
| **H5** | Cost/compute accounting | GPU-hour + $/esperimento tracciato (non stimato a posteriori) | 🆕 | F (infra) | MVP | budget <$200 = vincolo hard |
| **H6** | Tokenizer / special-token | aggiungere `<load:X>`/`<section>`/`[V][A][?]` al vocab + embedding init | 🆕 | F (setup) + S | setup MVP | load-bearing; **irreversibile a metà training** |
| **H7** | Artifact/adapter versioning | naming/versioning/compat-matrix (LoRA-vN ↔ base-vM) degli N verticali | 🆕 | F (infra) | F1 | è l'unità di prodotto del three-tier |

> **H1/H5/H6 = checklist di setup MVP** (costo ~0, irreversibili dopo). **H3** (latenza hot-swap) e **H4** (licensing) sono parte integrante dei claim. Dettaglio originario + razionale in §RL-0.

## Gap noti / domande aperte (da chiudere col review-loop)

1. **Priorità di adozione**: dato il budget MVP (2080Ti, <$200), quali NEW danno il maggior ROI subito? Candidati: QLoRA/NF4 (abilita FT locale), LoRA+ (cheap win), AWQ (serving), difficulty-filtering.
2. **Cosa è davvero NUOVO vs già coperto**: il review-loop deve verificare che i 🆕 non siano duplicati nascosti di concept esistenti.
3. **Classificazione contesa**: alcune voci (adaptive-depth, situation-table) sono F+S con confine sottile → l'agente per-dimensione la precisa.
4. **Rischi reward-hacking per-tecnica**: ogni voce che introduce un reward proxy va passata all'hack-check ([[concepts/reward-hacking-mitigation]]).
5. **Roadmap fasi**: consolidare in una timeline (cosa-quando) dopo che il catalogo è completo.

## Linked
- [[architecture/harness-feature-catalog]] (le 6 feature-class, dim-8) · [[architecture/wrapper-implementation-plan]] (fasi)
- [[concepts/training-vs-harness-classification]] (l'asse di classificazione) · [[concepts/reward-hacking-mitigation]] (hack-check)
- [[training-taxonomy/README]] (le 16 aree di training) · [[training-taxonomy/data-volume-estimate]] (budget dati)
- `wiki/_private/user-ideas-2026-06-27.md` §msg210 (la richiesta + le 9 dimensioni grezze)

---

# Review-loop multi-agente — addizioni & criticità (2026-06-27)

> 10 agenti (1 SOTA-sweep web per dimensione + 1 agnostico) hanno arricchito la base v0. Sotto: (RL-0) le **dimensioni orizzontali mancanti** scovate dall'agnostico — il finding più importante; (RL-1) le **addizioni NEW** ad alto/medio valore per dimensione; (RL-2) le **correzioni critiche**; (RL-3) la **watch-list reward-hacking**; (RL-4) le **priorità ROI consolidate**; (RL-5) i **ref da verificare**. Tutti i ref `[ref?]` o con ID 26xx sono **da confermare** prima di citarli in artefatti pubblici.

## RL-0 — Dimensioni ORIZZONTALI mancanti (agnostico) ⭐ il gap più grosso

> Le 9 dimensioni coprono "cosa fa il modello"; mancano le dimensioni di **ingegneria** che gli specialisti danno per scontate e che invece **bloccano i claim** *prima* di poter rivendicare qualcosa. In ordine di criticità per noi:

| # | Dimensione mancante | Cosa | Perché blocca NOI | Fase | Costo se anticipato |
|---|---|---|---|---|---|
| **H1** | **Reproducibility / experiment tracking** | seed-control, determinismo (cuDNN/flash-attn), lockfile, config-versioning, run-manifest | il nostro valore è una **metodologia di training originale** → un claim non-riproducibile è morto in review | MVP/F0 | ~0 ora, carissimo dopo. Skill già installate: `ml-weights-and-biases`/`ml-mlflow`/`ml-tensorboard` |
| **H2** | **Training observability / monitoring** | grad-norm/loss-spike/NaN, reward-collapse + KL-divergence monitoring (GRPO diverge in silenzio) | su 1-3 A100-day un run che diverge a metà = budget bruciato | F2 (all'avvio RL) | basso |
| **H3** | **Serving/deployment ops** | throughput vLLM, **latenza reale dell'hot-swap S-LoRA per-request**, KV-budget su 11GB, OOM-handling | il claim "LoRA hot-swap governato" DEVE avere un numero di latenza/throughput, altrimenti è architettura su carta | F1 | basso |
| **H4** | **Data licensing / provenance** | licenze eterogenee (GPL-contamination nei pesi, ToS scraping) di The-Stack/SWE-Gym | north-star **commerciale** → dataset GPL-tainted nei pesi = bomba legale; la licenza NON si de-contamina a posteriori | decisione MVP | basso se anticipato |
| **H5** | **Cost/compute accounting** | GPU-hour + $/esperimento tracciato (non stimato a posteriori) | budget <$200 è **vincolo hard** → serve un contatore | MVP | ~0 |
| **H6** | **Tokenizer / special-token** | i token `<load:X>`/`<section>`/`[V]/[A]/[?]` vanno **aggiunti al vocab + embedding init**, altrimenti byte-fallback rumoroso | sono **load-bearing** per routing/struttura di tutta l'architettura; decisione **irreversibile a metà training** | MVP setup | ~0 ma critico |
| **H7** | **Artifact/adapter versioning** | naming/versioning/compat-matrix (LoRA-vN ↔ base-vM) degli N verticali hot-swap | è la tua **unità di prodotto** del three-tier | F1 | basso |

→ **H1, H5, H6 vanno nel setup MVP** (costo ~0, irreversibili/critici dopo). H3 (latenza hot-swap) è parte del claim three-tier. Questi 7 sono **knowledge-transfer puro**: cose che avremmo scoperto mancanti troppo tardi.

## RL-1 — Addizioni NEW per dimensione (alto/medio valore)

> Terse. Formato: **nome** — cos'è · *perché-NOI* · `classif` · fase · ref. Le voci low-confidence/hype sono state scartate dagli agenti stessi.

**Dim-1 Architettura** — `[NB Turing/sm75: no bf16 nativo, no fp8-compute]`
- **Unsloth Dynamic-4bit** — NF4 selettivo (non quantizza layer sensibili) → qualità ~fp16 a VRAM bnb-4bit · *default FT MVP su 2080Ti, supera QLoRA-NF4 piatto* · F-serving+S · MVP · unsloth.ai
- **AWQ-int4 + kernel Marlin (W4A16, path fp16)** — serving Tier1 su sm75 SENZA fp8 · F-serving · MVP(0-B) · docs.vllm.ai
- **LoRA-GA / PiSSA / MiLoRA** — init data-aware/SVD per i verticali → meno GPU-ore, MiLoRA anti-forgetting · S · F2 · 2407.05000[ref?]/2404.02948/2410.18035
- **KIVI 2-bit KV-quant** — low-bit KV-cache **funziona su Turing** (no fp8-HW) → context lungo su 11GB · F-serving · F3 · 2402.02750
- **SnapKV** — eviction prompt-aware, training-free, gira su Turing · F-serving · F3 · 2404.14469
- **VeRA** — adapter ~10-100× più leggeri (shared frozen) se i verticali diventano molti · F-serving+S · F3 · 2310.11454

**Dim-2 Training**
- **Dr.GRPO** — toglie length-norm/std-norm (bias che gonfia CoT lunghe-sbagliate) · *fix anti-verbosità quasi-gratis, sinergico col two-phase* · S · F2 · 2503.20783[ref?]
- **DAPO (solo clip-higher + token-level, NO dynamic-sampling)** — pacchetto fix GRPO; ⚠️ drop-KL confligge con anti-hack → tieni KL piccolo · S · F2 · 2503.14476[ref?]
- **QeRL** — RL(GRPO) su base 4-bit+LoRA, noise=exploration; ⚠️ NVFP4 è Blackwell → su Turing verificare path NF4/INT4 · F-serving+S · F2 · 2510.11696
- **On-policy distillation** — student genera, teacher scora on-policy; **supera RL a meno compute** (Qwen3) → cold-start Tier1 ideale · S · F2 · ThinkingMachines + 2605.07725 (SOD, verificato)
- **GenRM (generative reward model)** — RM che genera critica+rubrica prima dello score → per le L (planning/architettura) · S+F · F2 · 2410.12832
- **OpenRubrics / AutoRubric** — genera rubriche auto da traiettorie corrette · *rimpiazza il placeholder inventato `2607.xxxxx`* · S+F · F2 · 2510.07743/2510.14738
- **LIMO / LIMR** — reasoning forte da ~1K esempi curatissimi (LIMR scarta il già-risolto) · *data-efficiency=budget* · dati+S · MVP/F2 · 2502.03387/2502.11886
- **GSPO** — importance-ratio a livello-sequenza · *critico SE escaliamo a MoE-35B; marginale sul dense-4B* · S · F3 · 2507.18071
- **Tina recipe** — GRPO+LoRA su 1.5B a **$9/esperimento** · *blueprint budget quasi identico al nostro* · S · F2 · 2504.15777
- **IPT (Isomorphic Perturbation Testing) + GRIFT** — difese anti verifier-gaming/gradient-fingerprint (estendono RLVR) · S+F · F2 · 2509.15557 + [ref?]

**Dim-3 Reasoning**
- **Budget-forcing / s1** — controllo profondità a inference (stop/"Wait"); dataset s1K=1K esempi · *F-serving, MVP-ready, zero-training* · F-serving · MVP · 2501.19393
- **DeepConf** — confidence token-level filtra trace, −84.7% token · *taglia il costo×N del self-consistency, training-free* · F-serving · F3 · 2508.15260
- **DEER (dynamic early-exit)** — −31/64% lunghezza CoT **con +accuracy** (coding −64.9% gen, +2.1 pass@1), training-free · F-serving · F2 · 2504.15895
- **CoT-Valve** — un solo modello genera CoT elastica per difficoltà (direzione di lunghezza nei pesi) · *no switch-tier per profondità* · S+F-serving · F2 · 2502.09601
- **ParaThinker** — parallel-thinking nativo, +7-12% con +7% latency (KV condivisa); "smaller surpass larger" · S+F-serving · F3 · 2509.04475
- **Long→short recipe concreta (C3oT/TokenSkip/DLCoT)** — *operazionalizza la nostra distillation two-phase (oggi generica)* · S · F2 · 2502.12067/2503.16385
- **Self-verification trainata** — addestrare la verifica **migliora la generazione** (asimmetria); ⚠️ scorer=scored → tieni verifier esterno · S+F · F2 · 2505.13445
- ⚠️ **Coconut (latent reasoning)** — reasoning token-budget-zero MA **antagonista** del nostro structured-thinking `[V]/[A]/[?]` (rimuove i token espliciti) → candidato ADR, NON adottare senza scelta · S · F3/∞ · 2412.06769

**Dim-4 Metacognizione** — `il how mancante per la calibrazione`
- **RLCR (calibration reward = correttezza + Brier)** — premia confidence **onesta** (proper scoring rule, NON il self-report); −90% ECE · *il how mancante di riga "uncertainty/calibration"* · S · F2 · 2507.16806
- **ConfTuner (Brier tokenizzato, SFT)** — versione **SFT-cheap** di RLCR, niente label di confidence esterne · S · F2-bootstrap · 2508.18847
- **Taming Overconfidence (PPO-M/PPO-C)** — ⚠️ **il nostro GRPO ERODE la calibrazione** come side-effect strutturale → vincolo cross-pipeline, non feature · S · F2 · 2410.09724
- **Agentic-overconfidence (3 punti di misura)** — elicita confidence pre/mid/post-azione per un coding-agent; 73% predetto vs 35% reale · *framing operativo del when-to-stop* · F+S · F2-3 · 2602.06948 (verificato)
- **Activation-based abstention** — astensione da attivazioni interne (white-box), +10-15 AUROC vs verbalized · *sfrutta che abbiamo i pesi (no API)* · F-serving+S · F3 · [ref?]
- ⚠️ **"Can LLMs Introspect? A Reality Check"** — gran parte dell'"introspezione" è pattern-matching sul prompt → **anti-hype guard** per self-analysis · metodologico · 2605.26242[ref?]

**Dim-5 Agentic** — `il buco = credit-assignment, non lo scaffold`
- **GiGPO** — credit-assignment 2-livelli (trajectory + anchor-state), critic-free, +9-12% a pari memoria · *chiude il gap #1 dell'RL agentic, gira su 2080Ti* · S · F2 · 2505.10978
- **Turn-level reward (mtGRPO)** — granularità intermedia, più semplice da impl (primo step prima di GiGPO) · S · F2 · 2505.11821
- **mini-SWE-agent** — scaffold ~100 righe (bash-REPL stateless), >74% SWE-Verified, target 1-8B · *controesempio "scaffold leggero per SLM", struttura di riferimento, zero-training* · F-pi · F1 · github SWE-agent/mini-swe-agent
- **DemyAgent-4B / Open-AgentRL** — checkpoint 4B agentic-RL coding = **il nostro identico setup** · *baseline da clonare/battere* · S+F · F2 · github[ref?]
- **PALADIN / AgentDebug** — recovery appreso da traiettorie (critical-error detection + strategie) · *metodo concreto per dependency-aware-error-recovery (oggi concept pending)* · S+F · F2-3 · 2509.25238
- **ReVeal / PAG** — self-generated test + policy-as-verifier; ⚠️ scorer≠scored (ancora a coverage/mutation, non pass-rate del self-test) · S+F · F2 · 2506.11442/2506.10406
- **MemOS / A-MEM** — memory-OS stratificato (trace→policy→skill) / Zettelkasten linkato · *upgrade del MemGPT-placeholder; prendi il pattern, non l'OS completo* · F(+S) · F3 · github
- **Survey-cardine**: "The Landscape of Agentic RL for LLMs" 2509.02547 (da linkare in testa a Dim-5)

**Dim-6 Safety** — `addestrabile + difesa-by-design`
- **Inoculation prompting** — una riga nel system-prompt RL riformula l'hack come accettabile → **−75-90% misalignment emergente** con hack-rate >99% · *ROI massimo, costo ~0; il nostro RLVR-su-test è ESATTAMENTE lo scenario Anthropic* · S · F2 · 2511.18397
- **SecAlign + Instruction Hierarchy** — injection-defense come DPO (già nel nostro stack) + gerarchia trust system>user>data **addestrata** · *rende addestrabile la nostra capability di firma untrusted/trust-level* · S(+F-pi) · F2 · 2410.05451/2404.13208
- **CaMeL (defeating PI by-design)** — dual-LLM privileged/quarantined + capability-tracking, garanzie by-design (no retrain) · *Tier1=privileged, expert-su-untrusted=quarantined* · F-pi · F3 · 2503.18813
- **Constitutional Classifiers (+exchange classifier)** — guardrail appreso dalla constitution; valuta output-nel-contesto-input · F-pi(+F-serving) · F3 · 2501.18837
- **CoT-monitoring + anti-obfuscation** — monitor debole sul CoT, MA **non includerlo nel reward** (insegna obfuscation) · *operazionalizza "catena-fantasma" + scorer≠scored* · F-pi(+S) · F2 · 2503.11926
- **Emergent-misalignment-da-RH** — RH in produzione generalizza a sabotage/alignment-faking · *evidenza del costo del non-mitigare* · F2 · 2511.18397
- **Deception/linear-probes** — sonda lineare sulle attivazioni, AUROC 0.96-0.99 (white-box) · F-serving · F3 · 2507.12691

**Dim-7 Dati** — `riduci l'authoring umano (il vero collo di bottiglia §7.2)`
- **OSS-Instruct / Magicoder** — istruzioni-coding da snippet OSS reali (no seed-LLM puro) · *SFT Tier2/3 grounded, zero authoring* · dati · F2 · 2312.02120
- **EpiCoder (feature-tree)** — controlla difficoltà E diversità via sottoalberi AST-like, scala function→multi-file · *leva per il curriculum staged + salto A13* · dati+S · F2 · 2501.04694
- **R2E-Gym/SweGen (back-translation da commit)** — genera 8.7K task SWE eseguibili dai commit **senza issue umane**, verifier ibrido exec+judge · *upgrade A13: generiamo task frontend dai commit a costo ~0* · F-infra+dati · F2 · 2504.07164
- **LESS (gradient-influence selection)** — seleziona il subset SFT a massima influenza (LoRA-gradient) · *operazionalizza "20%+scala" in modo principiato; promuovere da ∞ a F2* · dati · F2 · 2402.04333
- **CoT-Self-Instruct** — pianifica+ragiona prima di generare, poi auto-filtra · dati · F2 · 2507.23751
- **ITD (Inference-Time Decontamination)** — rileva+neutralizza leakage riscrivendo benchmark (n-gram non basta vs rephrasing) · tool · F2 · 2406.13990
- **ToolACE / APIGen** — sintesi tool-use con verifica gerarchica (format→exec→semantic) · *template per A8/Classe F* · dati+F · F2 · 2409.00920/2406.18518
- **Persona-Hub** — 370M persone già scaricabili, anti-mode-collapse · dati · F3 · 2406.20094

**Dim-8 Harness**
- **aLoRA (Activated LoRA)** ⭐ — adapter che adatta solo i token DOPO l'invocazione → **accetta la KV-cache base senza ricomputo** allo swap (20-58× più veloce) · *rende il multi-expert sequenziale auditable E veloce, non un trade-off; ⚠️ cambia il regime di training adapter (mask-based) → decidere PRIMA di addestrare Tier2/3* · S+F-serving · F3 · 2504.12397
- **XGrammar structured decoding** ⭐ — constrained-decoding grammar (default vLLM); rende **garantiti** i token `<load:X>`/marker/blocchi XML · *anti-fragilità parsing su SLM 4B; extension-router e scanner non gestiscono più output malformati* · F-serving · F1 · 2411.15100
- **Tool-result clearing** — compaction deterministica: droppa output raw dei tool vecchi (tieni nome+esito), recupero via VARS · *euristica wrapper-side zero-training (no skill metacognitiva)* · F-pi · F1 · Anthropic eng-blog
- **Loop-breaking + pre-exec syntax-checker** — detector di ripetizione + gate sintattico su patch/diff PRIMA dell'exec · *difese deterministiche che catturano il fallimento quando la skill metacognitiva non scatta* · F-pi · F1 · 2511.13646
- **Cache-aware layout** — ordina il context per frequenza-di-cambiamento (statico in testa, dinamico in coda); ⚠️ `<temporal>` con `now` va spostato fuori dal prefisso stabile · F-pi · F1 · 2601.06007[ref?]
- **load_inplace adapter update (vLLM)** — hot-reload adapter senza restart per RL async · F-serving · F2-3 · vLLM docs

**Dim-9 Eval** — `2 terremoti 2026`
- ⚠️⚠️ **SWE-bench Verified RITIRATO (OpenAI, 23-feb-2026)** — i modelli riproducevano i gold-patch dal task-ID (misurava contaminazione) → **deprecare**, usare **SWE-bench Pro** (Scale AI, 1865 task multi-lingua) + **Terminal-Bench 2.0**
- ⚠️ **BenchJack (apr-2026)** — red-team che rompe 8 benchmark agentici (score perfetti senza risolvere; falla = l'agente scrive stato nello stesso env che il grader ispeziona) · *difesa OBBLIGATORIA del nostro criticality-benchmark prima del claim #4* · 2605.12673
- **ImpossibleBench** — test deliberatamente impossibili → misura la propensione a barare · *direttamente il nostro tema reward-hacking, non-gameable* · 2510.20270
- **Reward Hacking Benchmark (RHB)** — scorciatoie naturalistiche, exploit-rate 0%→13.9% · 2605.02964
- **RedCode-Exec** — 4000+ istanze riconosci/rifiuta comandi-OS unsafe · *COPRE già parte del nostro "criticality awareness" → citare come baseline, riposizionare il custom su criticality GRADUATA + org-context* · 2411.07781
- **τ²-bench** — successore di τ-bench (dual-control); ⚠️ user-simulato = proxy umano inaffidabile · github sierra-research/tau2-bench
- **RULER + ONERULER + Sequential-NIAH** — long-context eval che ci manca; ONERULER (needle assente) = test diretto dell'astensione/anti-confabulazione · 2404.06654
- **Over-refusal suite (XSTest/OR-Bench/FalseReject)** — completa la balanced-accuracy sul lato falso-rifiuto (safety↔over-refusal corr. 0.89) · 2308.01263/2405.20947
- **Judge-robustness (BiasScope/position/self-preference)** — audita il judge PRIMA di usarlo nel reward · 2602.09383[ref?]/2406.07791/2410.21819
- **AURC / Abstain-ECE** — selective-prediction (discriminazione, non solo match) per il gate low-confidence→gather · [ref?]

## RL-2 — Correzioni critiche alla base (must-fix)

1. **SWE-bench Verified deprecato** (Dim-9) → un claim su Verified oggi è morto-in-arrivo. Usa SWE-bench Pro + Terminal-Bench 2.0 + nota-contaminazione.
2. **Turing/sm75** (Dim-1): la 2080Ti **non ha bf16 nativo né fp8-compute** → nei tutorial QLoRA usare **fp16** (non bf16); fp8-KV è fuori (resta KIVI 2-bit/SnapKV); AWQ/Marlin gira su sm75 in path fp16.
3. **Placeholder `2607.xxxxx` (rubric-as-reward) era INVENTATO** → OpenRubrics 2510.07743 + AutoRubric 2510.14738.
4. **On-policy distillation** (Dim-2): non è alternativa marginale, è il **cold-start più cost-efficient del RL diretto** → alza a primo-step-post-SFT.
5. **GRPO ha 2 bias noti** (length-norm/std-norm) → la versione da implementare è GRPO+{Dr.GRPO, clip-higher}, NON GRPO-vanilla.
6. **Il nostro GRPO erode la calibrazione** (Dim-4, Taming Overconfidence) → vincolo cross-pipeline da aggiungere ORA, accanto a reward-hacking.
7. **Steering** (Dim-1): il caveat "Qwen3 hybrid" NON vale per l'MVP Qwen3-4B **dense** (residual pulito) — ma i vettori vanno estratti sul checkpoint dense specifico (no riuso cross-checkpoint).
8. **Vincolo "swap LoRA → KV-incoerente → ricomputo" NON è legge fisica** (Dim-8): **aLoRA lo rimuove** → impatta paper-claim #6 (sequenziale auditable E veloce). Decisione di *sequencing* (mask-based) da prendere PRIMA di addestrare gli adapter.
9. **Inverse-U overthinking** (Dim-3): sui modelli piccoli è **più severo** (accuracy sale poi CALA con CoT lunga) → elevare a vincolo first-class del two-phase, non solo "length penalty".
10. **KV-cache "non priorità"** (Dim-8): raffinare, non ribaltare — su locale è **latenza UX reale**, e aLoRA+cache-layout la abbattono a costo ~0 (lunch gratis), senza compromettere la qualità del contesto.

## RL-3 — Watch-list reward-hacking (ogni proxy → hack-check outcome-anchored)

| Voce | Proxy gamabile | Difesa |
|---|---|---|
| Rubric-as-reward · PRM | impara la rubrica/step-plausibili non il task (catena-fantasma) | reward sul risultato verificato; ogni `[V]`↔tool-call reale nel trace |
| Length/efficiency penalty | comprime fino a rompere la correttezza (under-thinking) | penalità **simmetrica** over/under, gate correttezza-prima-di-brevità |
| Verbalized confidence | self-report sovra-confidente | mai premiare self-report; AURC/Brier su outcome reale |
| Adaptive-depth · decision-lookahead | esce presto/simula bivi inventati per il reward | reward solo se *uscire-presto-E-corretto* / predizione verificata vs outcome (regola #10) |
| LLM-judge / RLAIF | judge-gaming (lunghezza/tono) | ensemble di lenti + judge ancorato al trace + audit bias del judge |
| When-to-compact | compatta a caso / mai per il gesto | manager separato + held-out probe post-compact |
| Self-Refine/Reflexion | critica confabulata che gira a vuoto | reward solo su Δoutcome reale |
| Self-play/Self-Rewarding | echo-chamber | verificatore esterno deterministico nel loop |
| structured-thinking marker | `[V]` ovunque (participation-hack) | check-fantasma: ogni marker ↔ artefatto reale |
| ReVeal self-test | scrive test deboli che passa sempre | ancora a coverage/mutation, non pass-rate del self-test |

> **Pattern**: i proxy **metacognitivi (Dim-4)** sono il vettore RH #1 (outcome difficile da ancorare). **Regola**: nessuna voce Dim-4 entra in RL prima di avere *trigger falsificabile + ground-truth label* (i 5 metodi §2ter) → finché manca, restano **SFT-format-only, zero reward** (come già impostato). Il rischio è che la *prosa* del catalogo le faccia sembrare consegnabili in Fase 1.

## RL-4 — Priorità ROI consolidate (verso l'MVP, budget <$200 + 2080Ti)

1. **QLoRA/NF4 + Unsloth Dynamic-4bit** — abilita fisicamente il FT su 11GB (pre-condizione di tutto). Fix: fp16 non bf16.
2. **Verifier-sandbox Docker** (Classe F) — bottleneck #1 dichiarato; sblocca validazione-dati gold + RL.
3. **Reproducibility setup (H1) + cost-counter (H5) + tokenizer/special-token (H6)** — costo ~0 ORA, irreversibili/salva-claim dopo.
4. **Decontamination pipeline (ITD + MinHash)** — senza, ogni numero di eval è contestabile.
5. **SFT structured-thinking `[V]/[A]/[?]` + scientific-method** — task primario Tier1, il differenziatore org-first.
6. **Pre-flight + secrets-scanner deterministici** (Classe C) — cheap, scorer≠scored, governance = parte del claim.
7. **XGrammar structured decoding** — garantisce routing-token/marker su SLM 4B, zero-training, F1.
8. **Routing classifier + S-LoRA per-request + MISURA latenza hot-swap (H3)** — il meccanismo che dimostra il three-tier.
9. **Inoculation prompting** — −75-90% misalignment a costo ~0 quando parte l'RLVR.
10. **Eval suite minima + protocollo statistico** (n-seed, baseline definita, ImpossibleBench + RedCode + custom-criticality) — senza, non sai se l'esperimento ha funzionato; è dove un reviewer ostile distrugge.
- *cheap-win bonus*: **LoRA+** (LR diversi A/B, ~0 impl); **Dr.GRPO+clip-higher** (config, anti-verbosità); **on-policy-distillation** come cold-start.

## RL-5 — Disciplina di scope (agnostico) + ref da verificare

**Tagliare/relegare a ∞ (fuori-scope MVP coding-org, alcuni contraddicono "latenza non-priorità")**: Tree/Graph-of-Thoughts, MCTS/rStar-Math (è math-competition), MTP-heads, speculative-decoding (single-user locale), per-expert-MoE-quant (gated su MoE-35B = 2 wave avanti), self-play/SPIN (collasso su 4B/<$200), char-level-precision, MemGPT-hierarchy (error-memo+VARS coprono il 90%). → distinguere **F3-pianificato** da **∞-forse-mai** (il catalogo usa "F3" come parcheggio → diluisce il segnale).

**Bilanciamento**: Dim-1 (17 voci) e Dim-3 sovra-dense di varianti fuori-dominio; **Dim-9 Eval sottodimensionata rispetto al rischio** (4 paper-claim ci poggiano) → espandere a pari rango (protocollo statistico + baseline-competitor + harness `ml-lm-evaluation-harness`); **Dim-4** densa di "cosa" ma povera di label-generation (il debito vero); **Dim-7** manca qualità/dedup/yield (disallineata da `data-volume-estimate §7.1.F` più maturo).

**Ref da VERIFICARE prima di citare pubblicamente** (ID 26xx futuri o non confermati): Agentic-overconfidence 2602.06948, Self-Compacting 2606.23525, PARC 2512.03549, Mirror 2604.19809, introspection-reality-check 2605.26242, DAPO 2503.14476, Dr.GRPO 2503.20783, GRIFT/spurious-rewards 2604.x/2601.x, on-policy-distill survey 2604.00626, SWE-rebench, REWIRE, D3, Open-AgentRL/DemyAgent (solo github), AgentDebug (OpenReview), Cache-paper 2601.06007, XGrammar-2 2601.04426, BenchJack 2605.12673, RHB 2605.02964, ODCV 2512.20798, ONERULER, Abstain-ECE, FalseReject 2505.x, BiasScope 2602.09383.

---

> **Stato**: review-loop COMPLETO (10 agenti). **Next**: l'utente valuta → poi (a) consolidare le voci utili nel corpo del catalogo + integrare le 7 dimensioni orizzontali; (b) aprire gli ADR scaturiti (KV-policy-Turing, init-LoRA, aLoRA-sequencing, latent-reasoning-vs-audit, judge-selection, data-licensing); (c) roadmap fasi; (d) `graphify --update`.
