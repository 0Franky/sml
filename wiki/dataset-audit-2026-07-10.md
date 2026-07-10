---
name: dataset-audit-2026-07-10
description: Report dell'audit COMPLETO del training dataset (utente msg 1598) — 6 revisori dimensionali multi-agente sull'intero dataset (34 classi/19 gold/16 aree/18 decisioni) → verifica adversariale di ogni finding (10 falsi-positivi scartati) → sintesi. 32 confirmed + 7 plausible. Prioritizzato per remediation.
type: report
tags: [audit, dataset-quality, coherence, coverage, reward-compliance, review-loop, meta]
last_updated: 2026-07-10
---

# Audit completo del training dataset — 2026-07-10

> **Origine**: utente msg 1598 ("review-loop sull'intero dataset + decisioni, coerenza, gap, nuove migliorie, report"). Metodo: Workflow `wf_6a4a94bf-95e` — 6 revisori dimensionali in parallelo (coerenza/gerarchia-wiring/reward-compliance/coverage-gaps/integrità-fattuale/migliorie) → verifica adversariale scettica di OGNI finding → sintesi. **55 agenti, ~5.5M token.**
> **Esito**: 49 findings → **32 CONFIRMED · 7 PLAUSIBLE · 10 REJECTED** (la verifica ha scartato 10 falsi-positivi e declassato diversi finding sopravvalutati — es. il "duplicato quasi-totale" req/scope → in realtà P2 confine-da-dichiarare).

## Priorità 1 (P1) — da affrontare per primi

- **✅ FIXED (2026-07-10, commit successivo)** — **[P1 · integrità-fattuale] Recovery-gold "secret già leakato" OMETTE rotate/revoke.** Un gold insegna "redigi/registra e prosegui" dopo un leak, ma un segreto una volta esposto va **ruotato/revocato** (il blast-radius resta): omissione = mezza-verità (#22), stessa classe di bug del "throwaway→.env" corretto oggi. → **FATTO**: `area-07-security-privacy.md` §Secret-non-exfiltration (4) riga 41 + §Dynamic-secret-detection (4) riga 122 — aggiunto rotate/revoke ancorato alla **reversibilità** dell'esposizione (irreversibile → compromesso → ruota; contenibile → redazione basta; nuance simmetrica non "ruota-sempre").
- **[P1 · coverage] Area-09: objective-critique-vs-sycophancy + honest-reporting SENZA classe/gold.** È una skill-FIRMA di Tier-1 e a **massimo rischio reward-hacking** (compiacere = hack facile) → un buco grave. → **PROPOSTA nuova classe** (attende ok #18).
- **[P1 · reward] proactive-improvement-proposal: reward dominato da judge-L senza le difese del gemello-L.** Il gemello 6.2-defer impone council-a-lenti-diverse + audit-ECE + NIENTE-reward-sul-ramo; proactive scora un ramo value-laden con un solo judge → gameabile. → allineare al pattern 6.2-defer.
- **[P1 · hierarchy] 3 figlie (requirements-driven, scope-adaptive, domain-categorization) dichiarano padre=metacognitive ma il PADRE non le riconosce** (tabella §figlie + registry §6 desync; reciprocità rotta #20/#12). Complicato da un **padre-conteso** (req/scope hanno legami forti con constraint-fit; domain con situational). → risolvere il padre + riconciliare tabella/registry/index.

## Priorità 2 (P2) — wiring & confini (per lo più fix meccanici)

- **[wiring] 2 wikilink ROTTI**: `class-alternative-path-under-block.md:56` (`../concepts/deceptive-task-gen` → inesistente; va `../../harness/verifiers/deceptive-task-gen`) + `class-confabulation-retrieval-failure.md:90` (`concepts/eviction-checkpoint` manca `../`). → FIX.
- **[wiring] index.md:127 conteggio stantio "5 figlie"** di situational-awareness (sono 6, project-stakes non conteggiata). → FIX.
- **[wiring] registry §6** duplica domain-categorization + elenca req/scope come "flat" invece che sotto il padre dichiarato. → FIX.
- **[wiring] class-sign-wrap-blindspot ORFANA** (nessun padre) → dichiarare padre (candidato: stagnation-recovery) o motivare lo standalone.
- **[coerenza] confini da DICHIARARE** (sovrapposizioni reali ma separabili, no merge): proactive ⇆ instruction-phase-clarification (#5 propose-alternativa); context-over-parametric N2 ⇆ instruction-phase #4 (anti-sycophancy); requirements-driven ⇆ scope-adaptive (naviga-profondità vs seleziona-conoscenza). Pattern-fix = come project-stakes(LEGGE)/constraint-fit(SCEGLIE): confine netto + cross-link + dedup transfer condivisi.
- **[factual] citazione arXiv 2606.27275** (−58% perplessità) non verificata / probabilmente confabulata, asserita senza tag → verificare o rimuovere/`[UNVERIFIED]`.
- **[coverage] completeness-audit eseguito 1 sola volta** (decomposition); le 16 aree mai auditate.
- **[coverage] area-03 long-correct-CoT+verify-loop** (cuore PRM) senza gold eseguibile.

## Priorità 3 — improvement (migliorie di sistema, per lo più metodologiche)

**Coverage (aree deboli → candidate classi, attendono ok #18):**
- Area-05 code-correctness: solo sign-wrap (faccetta stretta); functional/edge/regression/API senza gold.
- Area-06 code-quality: naming/SoC/DRY/refactoring/economy senza classi (il code-optimization in corso copre la PERFORMANCE, non queste).
- Area-08 tool-use/agentic: routing-token / cross-expert-handoff / expert-recruitment = **core della three-tier (idea protetta)** senza classe/gold.
- Area-10 output-mechanics: char-level (debolezza SLM nota), length, format, MTP — nessuna classe.
- Area-12 domain-knowledge: **CONTRADDICE la regola #22** (fatti immutabili vs "non asserire fatti") — mai riconciliata.
- Area-13 SWE repo-level: **signature benchmark di uno SLM coding**, ZERO gold eseguibili.
- Area-14 algorithmic-math: math-reasoning + self-verification non costruiti.

**Metodologia / reward:**
- **Retrofit dello STANDARD a 3-segnali** a tutte le classi di ragionamento pre-2026-07-10 (oggi 1/34 lo adotta) + **applicare l'MCQ-controfattuale** (implementato, usato da 0 classi).
- Segnale ② su ragionamento SFUMATO senza oracolo **rollout-derived** (Math-Shepherd/PPM) — solo oracoli a esito discreto.
- reward-L (judge) non specificano la **decorrelazione ensemble** obbligatoria; difese anti-hack #10 (red-team-reward) / #13 (ablation-monitor) dichiarate ma **non strumentate**; monitor-audit-held-out non strumentato.
- Oracoli marcati **[UNVERIFIED — format-only]** (il pilota ha mostrato bug di ragionamento) da eseguire in sandbox; quasi tutti i gold sono INLINE, non ESEGUITI (solo area-02 ha eseguibili validati).

**Struttura / SSOT:**
- **Le AREE (example-space 2026-06-25) sono scollegate dalla gerarchia di CLASSI** = due layer paralleli che possono divergere (rischio SSOT) → mappare classi↔aree.
- Coherence-audit + completeness-audit ancora **MANUALI** su ~34 classi + 16 aree → la drift si accumula (prova: standard-3-segnali in 1/30). Valutare un check semi-automatico.
- Regola "de-dup delle fasi premiate" (D1) confinata in un concept → vettore di participation-hack quando il curriculum composizionale comporrà le skill.

**Idee già catturate ma mai filate (attendono ok):**
- `right-algorithm-for-scale` (figlia constraint-fit, efficienza↔scala) — placeholder previsto.
- `graph-aware / impact-review post-structural-change` (F+S) — gap validato sul campo (165 ghost-node).

## Plausible (7) — da verificare più a fondo
- secret-hygiene: oracolo Q = scanner **letterale** del valore-esca → leak offuscato/encodato in USCITA passa (manca decode-then-rescreen) — **potenziale gap di sicurezza reale**.
- project-stakes: oracolo ① "il massimo (o combinazione definita)" NON-PINNATO → pinnare la funzione ground-truth.
- Area-10/12 gaps; identifier `gemma-4-26b-a4b-it` da verificare; convenzione-reward non uniforme.

## Remediation plan (proposto)
1. **SUBITO (safe, correzioni)**: fix meccanici wiring (2 link, index-count, registry-dedup, reciprocità padre↔figlia) + fix fattuale rotate/revoke + tag/verify citazione arXiv. (autonomo — sono correzioni, non design)
2. **Confini da dichiarare** (P2 coerenza): 3 coppie + cross-link + dedup transfer. (autonomo — additivo)
3. **Padre-conteso** (P1 hierarchy): decidere il padre di req/scope/domain (proposta: sono all'intersezione metacognitive×constraint-fit/situational → dichiarare padre primario + cross-link secondario). (decisione, propongo)
4. **Reward proactive** allineato a 6.2-defer (P1). (autonomo — fix conforme a pattern esistente)
5. **Nuove classi** (Area-09 critique/honest-reporting P1 + aree 05/06/08/10/13/14): **attendono approvazione utente** (#18) + prioritizzazione.
6. **Retrofit metodologico** (3-segnali + MCQ a tutte le classi): grande, da pianificare a ondate.

## Links
[[training-taxonomy/dataset-construction-playbook]] · [[concepts/training-set-completeness-audit]] · [[concepts/phased-reward-and-rh-detection]] · [[training-taxonomy/README]] · [[todo]]
