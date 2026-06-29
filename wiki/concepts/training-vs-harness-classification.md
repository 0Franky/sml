---
name: training-vs-harness-classification
description: PLAYBOOK + regola fondamentale per classificare ogni capacità del sistema sull'asse training(pesi) vs harness(wrapper) vs serving — categorie F-harness / F-serving-stock / F-serving-custom / S / F+S, Step-0 di scomposizione, decision tree, "stato senza training", spec di training (checklist), worked example, anti-pattern. Principio cardine emerso 2026-06-27; v1 post review-loop (3 reviewer).
type: playbook
tags: [playbook, meta, skill-vs-feature, training, harness, serving, wrapper, classification, reward-hacking, organization-first]
sources: [user msg 2026-06-27 (190/197/200/205), harness-feature-catalog §1/§2ter, sota-techniques-catalog, reward-hacking-mitigation]
last_updated: 2026-06-27
status: draft v1 — post review-loop (3 reviewer: ML-training, wrapper-systems, agnostico)
confidence: provisional
---

# Training-vs-Harness — Classificazione delle capacità (PLAYBOOK)

> **Regola fondamentale (sintesi)**: per OGNI capacità del sistema, PRIMA di costruirla/addestrarla, **(0) scomponila** in {meccanismo} e {decisione/generazione}, **(1) classifica ciascuna metà** sull'asse — `F-harness` / `F-serving-stock` / `F-serving-custom` / `S` — dichiara lo **stato-senza-training**, e per la parte SKILL definisci **regime + label-generation + reward ancorato all'OUTCOME**. **Mai** presentare una `F+S` come feature consegnabile quando è *inerte senza training*; **né** bloccare in Fase-1 una capacità che un **fallback deterministico** renderebbe già utile (over-gating).

## Catena why → problema → soluzione

- **Why** — ogni capacità può vivere nei **pesi** (skill addestrata), nell'**harness** (hook/infra wrapper), a livello **serving** (inference: nativo del provider o custom), o in **combinazione**.
- **Problema** — confonderli è il **rischio di design #1**. (i) Trattare come "feature consegnabile" una capacità il cui valore è gated su una skill non-addestrata → **guscio inerte** (il tool che il modello non sa quando usare). (ii) Mettere a training qualcosa che la **sola feature deterministica** risolverebbe → spreco. (iii) Premiare la **cerimonia** (ho chiamato il tool / aggiunto la sezione) invece dell'outcome → participation-hack. (iv) **Non scomporre** una F+S e trattarla come monolite → si eredita l'errore (i) o (ii) su una delle due metà. (v) **Over-gating**: ritardare a "post-training" valore che un fallback euristico spedirebbe subito (anti optimization-first).
- **Soluzione** — una **scomposizione + classificazione obbligatoria** a categorie + decision tree + lo "stato senza training" + la spec di training, così che la natura di ogni capacità sia esplicita e nessun guscio-inerte (né over-gating) passi inosservato.

## Step 0 — SCOMPONI prima di classificare `[review-loop]`

Prima di entrare nel tree, **separa la capacità nelle sue due metà** (cfr. [[harness-feature-catalog]] §1 "ogni capacità si scompone in due metà"):
- **{meccanismo}** = stato / strumento / gate / scanner / storage / exec / controllo-inference → candidato **F**.
- **{decisione · riconoscimento · generazione}** = *quando* agire, *cosa* riconoscere, *come* ragionare/emettere → candidato **S**.

Classifica **ciascuna metà** separatamente nel tree. È il passo che la maggior parte degli errori salta.

## Le categorie

| Cat | Cos'è | Stato senza training | Esempi |
|---|---|---|---|
| **F-harness** (ex F-pi) | meccanismo deterministico via **hook pi** (`context`/`tool_call`/`tool_result`/…) **OPPURE infrastruttura wrapper-side non-hook** (verifier-sandbox/runner, storage, lane) | **PIENA** | context-assembly, secrets-scanner, pre-flight gate, VARS storage, lora-router (`setModel`), **verifier-sandbox Docker (Classe F)** |
| **F-serving-stock** | capability **nativa del provider** (vLLM), attivabile via **config** — zero nostro codice | **PIENA** (giorno-1) | sampling (temp/top-p), **structured/guided decoding (XGrammar)**, APC, `--enable-lora` |
| **F-serving-custom** | meccanismo a livello inference **che costruiamo noi** (non un hook testuale pi) | meccanismo da **implementare**; policy può essere S | steering vectors (estrazione contrastiva + injection), aLoRA-swap |
| **S** (Skill) | comportamento nei pesi; il modello lo genera/decide nativamente; richiede training | **INERTE** senza training | generazione marker `[V]/[A]/[?]`, reasoning strutturato, metodo scientifico |
| **F+S** (Both — categoria dominante, ma vedi soglia Q3) | meccanismo (F-harness/serving) **+** skill addestrata: il wrapper dà tool/struttura, il modello va addestrato a QUANDO/COME usarlo | **INERTE** o **DEGRADATA-MA-UTILE** | autocompact, section-boundary, low-confidence-gather, decision-lookahead, situation-table, dependency-aware-error-recovery |

> **Nota structured-decoding (F-serving-stock + S)** `[review-loop]`: la grammar/schema (XGrammar) **garantisce la forma** dei marker `[V]/[A]/[?]`, dei token `<load:X>`, dei blocchi `<plan>`/`<safety_halt>` → è F-serving-stock; la **decisione di cosa emettere** resta S. **Riduce il carico di training sul formato** (la grammar forza la sintassi, il training insegna solo la semantica).

## Procedura di classificazione (decision tree)

0. **Q0 — SCOMPONI** (sopra): {meccanismo} vs {decisione/generazione}. Classifica ogni metà.
1. **Q1 — Serve un MECCANISMO che il modello non può fare da solo?** (storage, scan, gate, tool, exec, dep-graph, controllo-inference) → serve **FEATURE**.
   - **Q1a — di che tipo?** Hook testuale di pi **o** infra wrapper-side (sandbox/runner/storage)? → **F-harness**. Capability **nativa del provider via config** (sampling, guided-decoding)? → **F-serving-stock**. Inference-level **che costruiamo noi** (residual stream, swap custom)? → **F-serving-custom**.
2. **Q2 — Serve una DECISIONE/RICONOSCIMENTO/GENERAZIONE che il modello deve fare?** → serve **SKILL** (training).
3. **Q3 — combinazione + soglia di materialità** `[review-loop]`: Q1 ∧ Q2 → **F+S** **solo se** lo stato-senza-training della metà-S è **INERTE o DEGRADATA**. Se la "decisione" è coperta da un **fallback deterministico** (Q6) che dà stato **PIENA**, classifica come **F** e tratta la skill come *ottimizzazione post-MVP*, non come F+S (evita l'over-inflazione a F+S). Solo Q1 → **F**. Solo Q2 → **S**.
4. **Q4 (per la parte S) — spec di training (CHECKLIST, dettaglio in [[harness-feature-catalog]] §2ter)**:
   - Regime definito? (SFT-format-bootstrap → **on-policy distillation cold-start** → RL-GRPO outcome-anchored)
   - Label-method scelto? (sintetiche-by-construction / outcome-bisect / sonde-held-out / EVPI-twin-pair / self-consistency-drop)
   - Reward **ancorato a outcome verificabile**, non al gesto? scorer≠scored?
   - Per skill **confidence** (degradation/low-confidence/contradiction): calibration-reward wired? (RLCR/ConfTuner-Brier; mai self-report; ECE come early-stop) — vincolo "GRPO erode la calibrazione".
5. **Q5 — grada lo STATO SENZA TRAINING**: PIENA / DEGRADATA-MA-UTILE / INERTE. Se **INERTE** → NON spedire come feature di Fase-1; gate su training + **misura il gap del base-model** (gate 0-A.4 di [[../architecture/wrapper-implementation-plan]] §Fase-0).
6. **Q6 — fallback deterministico?** Esiste un'euristica wrapper-side che rende la capacità **DEGRADATA-MA-UTILE** senza training? (es. soglia su `getContextUsage` per autocompact) → **spedisci il fallback-feature in Fase-1** (anti over-gating), training della skill dopo. **Q6 può retro-declassare Q3** (F+S → F) se il fallback dà stato PIENA.

## Worked example — `autocompact` attraverso il tree `[review-loop]`

- **Q0 scomponi**: {meccanismo} = tool `compact_context` (istruisce il wrapper su cosa tenere/buttare); {decisione} = riconoscere il degrado + *quando* compattare.
- **Q1/Q1a**: il tool è un hook/infra wrapper-side → **F-harness**.
- **Q2**: il *quando/cosa-buttare* è una decisione del modello → **S**.
- **Q3**: Q1 ∧ Q2; lo stato-senza-training della metà-S è **INERTE** (il tool senza trigger non scatta) → **F+S** (la soglia di materialità è superata, non retro-declassa).
- **Q4**: regime SFT-boot → on-policy-distill → GRPO; label = outcome-bisect + sonde-held-out post-compact; reward = AdaCoM-style two-level (outcome a valle + process), scorer≠scored (manager separato); calibration-reward sì.
- **Q5**: **INERTE** → NON Fase-1 come skill.
- **Q6**: fallback = soglia `getContextUsage` → compatta → stato **DEGRADATA-MA-UTILE** → **spedisci il fallback in Fase-1**, addestra la skill in Fase-2/3.
- **Output**: `{F+S · stato=INERTE(skill)/DEGRADATA(con-fallback) · gate=fallback-F1, skill-F2/3 · spec-S=AdaCoM+calibration}`.

## Worked example 2 — `low-confidence → gather/ask` attraverso il tree `[review-loop add]`

Contrasto utile con autocompact: qui il fallback deterministico è **debole** → la skill è ancora più critica.
- **Q0 scomponi**: {meccanismo} = strumenti di gather (grep/file-search/web come tool callable) + il ramo **ASK** (domanda non-bloccante all'utente); {decisione} = riconoscere la bassa-confidence (trigger token-non-in-contesto) + scegliere INTERNO/ESTERNO + budget-K + *quando* fermarsi e chiedere.
- **Q1/Q1a**: gli strumenti di gather e il canale-ASK sono tool/hook wrapper → **F-harness**.
- **Q2**: riconoscere l'incertezza + decidere gather-vs-ask + dove cercare → **S**.
- **Q3**: Q1 ∧ Q2; lo stato-senza-training della metà-S è **INERTE** (il caso reale del *riferimento-opaco-a-repo-privato*, dove il gather-cieco ha confabulato, È il fallimento di questa skill) → **F+S**.
- **Q4**: regime SFT-traiettorie → **RL uncertainty-aware**; label = **EVPI twin-pair** (coppia gemella dove l'info NON cambia l'esito → si misura se gather/ask era *necessario*); reward = "l'info recuperata/richiesta ha **cambiato la decisione**?" col **costo della domanda** (EVPI/SELAUR), MAI il gesto di gather (participation-hack). Calibration-reward rilevante (è una decisione sotto incertezza).
- **Q5**: **INERTE**.
- **Q6**: fallback deterministico **debole** — si può forzare un gather su token-non-in-contesto, ma rischia **over-asking** e non dà stato PIENA → resta gated sul training.
- **Output**: `{F+S · stato=INERTE · gate=training F2-3 · spec-S=EVPI-twin-pair + uncertainty-reward + costo-domanda}`.

## Anti-pattern (da evitare — e da flaggare in review)

1. **Training travestito da feature**: presentare una `F+S` come consegnabile quando il valore è gated su skill non-addestrata (guscio inerte). → il difetto che §2ter ha corretto.
2. **Feature travestita da training**: mettere a training ciò che la sola feature deterministica risolverebbe (es. un check che `git ls-files` risolve).
3. **Reward sulla cerimonia**: premiare il gesto (chiamato il tool / aggiunto la sezione / dichiarato "uncertain") invece dell'esito verificabile.
4. **Capacità-monolite non scomposta** `[review-loop]`: trattare una F+S come puramente-S o puramente-F senza scomporla → si eredita l'errore di direzione (1 o 2) su una delle due metà. È l'errore *a monte* (Q0 lo previene).
5. **Over-gating** `[review-loop]`: bloccare in Fase-1 una capacità che un fallback euristico (Q6) renderebbe già utile → ritarda valore spedibile (anti optimization-first, regola progetto #8). Speculare al guscio-inerte.

## Nota training-spec (deltas dal review-loop ML-training) `[review-loop]`

Da indirizzare nelle foglie di training (vedi [[../training-taxonomy/area-04-context-metacognition]] addendum):
- **Cold-start a 3 stadi**: per le metacognitive inerti, `SFT-format → on-policy distillation (student genera, teacher scora) → GRPO`. Il distillation step riduce il cold-start gap del GRPO su 4B.
- **Calibration-reward wired** (non solo dichiarato): RLCR/ConfTuner-Brier nelle foglie confidence + **ECE/Brier come early-stop** di pari rango con l'accuracy.
- **EVPI = controfattuale**: specificare il meccanismo (raccomandato **twin-pair by-construction**, riuso del pattern gold area-02), altrimenti "l'info ha cambiato la decisione" è un'etichetta non implementabile.
- **AdaCoM frozen-agent**: precondizione = **Tier-1 base competente PRIMA** del training manager+frozen-agent (altrimenti scorer≈scored).
- **Ref VERIFICATI 2026-06-29** (no-confab, 3 fonti): AdaCoM 2605.30785, SELAUR 2602.21158, on-policy-distill/SOD 2605.07725 — confermati reali (gli ID YYMM 26xx sono paper inizio-2026, legittimi).

## Relazione con la governance della conoscenza (pattern a tier) `[INFERRED]`

La classificazione training-vs-harness è **ortogonale ma complementare** a un pattern generico di **governance della conoscenza a tier**: `LM.md`-directive (always-context) / situation-table (router → [[situational-policy-table]]) / wiki-rule (on-demand) / **hook** (auto-enforced). Gli **hook auto-enforced** ≈ la nostra categoria **F-harness deterministica** (Classe C guardrails, scorer≠scored); le **rule/directive** ≈ conoscenza che può diventare **S** (addestrata nei pesi) invece che lookup-prompt. La governance dice *dove vive una conoscenza*; questo playbook dice *se una capacità richiede pesi, harness, o serving*.

## Linked
- [[harness-feature-catalog]] §1 (tabella SKILL-vs-FEATURE) + §2ter (audit "inerte senza training" + regime SOTA)
- [[../architecture/wrapper-implementation-plan]] (gate di fase 0-A.4 misura-gap; fallback euristici)
- [[sota-techniques-catalog]] (le tecniche da classificare; §RL-1 Dim-4 metacognizione)
- [[reward-hacking-mitigation]] (outcome-anchored, scorer≠scored, participation-hack)
- **Capability F+S classificate con questo playbook** (stato-senza-training DEGRADATA-MA-UTILE, stesso decision-tree F+S — indice esplicito dell'hyperedge, evita N² cross-link tra le foglie): [[low-confidence-gather-and-reorg]] · [[dependency-aware-error-recovery]] · [[situational-policy-table]] · [[interruption-robust-reasoning]] · [[self-analysis-strategy-revision]] · [[harness-capabilities-as-files]]
- [[harness-elicitation-vs-execution]] 🔬 — **validazione sperimentale del playbook** (dogfood Gemini reale 2026-06-29): conferma la separazione F/S osservando che l'harness (F) **elicita** in modo affidabile la considerazione (3/3) che il vanilla omette, ma su modello non-addestrato **elicitare ≠ eseguire** (esecuzione ~1/3) → il training (S) chiude il gap. Reward ancorato all'**esecuzione**, non all'elicitazione (anti participation-hack)

> **Provenance**: v1 dopo review-loop 3 reviewer (ML-training / wrapper-systems / agnostico, 2026-06-27). Fix applicati: Step-0 scomposizione, split F-serving (stock/custom) + F-harness per il verifier, structured-decoding classificato, soglia-materialità + retro-declass Q3↔Q6, Q4→checklist+pointer, worked example, anti-pattern #4/#5, nota training-spec. **Next**: ✅ CLAUDE.md #11 fatta · ✅ worked-example 2 (low-confidence) aggiunto (2026-06-28). Resta: convertire le decisioni-aperte in ADR datati dopo conferma utente.
