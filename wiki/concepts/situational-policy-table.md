---
name: situational-policy-table
description: Tabella-router "SE situazione X → leggi/applica regola-azione Y (obbligo) PRIMA di procedere". FEATURE = lane lookup O(1) (drift-impossibile, scalabile, auto-enforced) + SKILL = riconoscere la situazione → emettere l'azione corretta, addestrata nei pesi (si addestra il COMPORTAMENTO, non il file-path). Training goldmine. Parte di una governance della conoscenza a 4 tier. Idea utente msg 200-202 (pattern generico estratto PII-free da repo privato).
type: concept
tags: [concept, situational-awareness, policy-table, governance, training-goldmine, skill-vs-feature, reward-hacking, organization-first]
sources: [user notes 2026-06-27 msg 200-202, wiki/concepts/training-vs-harness-classification, structured-context-sections]
last_updated: 2026-06-29
status: finalized v1 — training-spec completa (held-out discrimina-situazione + governance 4-tier)
confidence: provisional
---

# Situational Policy Table (router situazione → azione)

> **Stato**: finalized v1. Idea utente 2026-06-27 (msg 200-202), pattern **generico** estratto da un sistema di disciplina prompt-engineered di repo privati (estratti solo i pattern, **nessun nome/PII**); training-spec completata 2026-06-29. Doppio valore: meccanismo wrapper **e** materiale di training.

## Catena di pensiero (why → problema → soluzione)

- **Why** `[EXTRACTED]` — un agente con decine di regole non può tenerle tutte sempre in contesto né ricordarle a memoria a ogni passo: la conoscenza "passiva" (read→forget) **si perde**, e le decisioni driftano.
- **Problema** `[EXTRACTED]` — serve un modo per cui, data una **situazione** (sto per cancellare un file / sto per scrivere un secret / sto iniziando un task), l'azione/regola corretta sia **richiamata e applicata obbligatoriamente** prima di procedere, senza dipendere dalla memoria del modello.
- **Soluzione** `[EXTRACTED]` — una **tabella-router**: righe "SE stai facendo X → LEGGI/APPLICA la regola Y PRIMA di procedere". Lookup O(1) per pattern → zero decisioni a memoria → **drift impossibile**, scalabile a 100+ regole senza appesantire il context, **auto-enforced** (non applicare la regola citata = violazione rilevabile). Trigger **aggressivo** (meglio un falso-positivo che una violazione mancata).

## FEATURE vs SKILL (la nuance critica) `[EXTRACTED]`

- **FEATURE (wrapper)**: la tabella come **lane** nel context-assembly (Classe A) — lookup deterministico situazione→regola. Project-specific, aggiornabile senza retraining.
- **SKILL (pesi, da addestrare)**: il **riconoscimento** della situazione → emissione dell'azione corretta. ⚠️ **Si addestra il COMPORTAMENTO / il principio** (situazione→azione-corretta), **NON il file-path-lookup** (project-specific, brittle). Il lookup-table è feature; il riconoscimento-addestrato è skill — stesso pattern [[training-vs-harness-classification]] di tutto il resto.

> **Verifica del claim utente "rafforza i pesi quando prende una scelta"**: `[EXTRACTED]` confermato — addestrare su **situazione→azione-corretta** rinforza il decision-making **nei pesi** invece di affidarsi al lookup-prompt ogni volta. Ogni riga = una **famiglia di esempi** verificabili (riconosci il trigger → emetti l'azione corretta).

### Classificazione formale (decision-tree del playbook) `[review-loop]`

Applico il decision-tree di [[training-vs-harness-classification]] (Step-0 scomponi → classifica ogni metà → stato-senza-training).

- **Q0 scomponi**:
  - **{meccanismo}** = la tabella-router come **lane lookup O(1)** nel context-assembly (Classe A) — match-pattern situazione→regola, deterministico.
  - **{decisione}** = il **riconoscimento** della situazione (sto-per-cancellare / sto-per-scrivere-un-secret / sto-iniziando-un-task) → emissione dell'azione corretta.
- **Q1/Q1a → F-harness**: la lane-lookup è infra wrapper-side deterministica. **Stato: PIENA**, e con due proprietà chiave: **O(1)** (scala a 100+ regole senza appesantire il context) e **drift-impossibile** (il lookup non dipende dalla memoria del modello → la regola citata è sempre quella corrente; aggiornabile senza retraining). Auto-enforced: non applicare la regola citata = violazione rilevabile.
- **Q2 → S (recognition)**: riconoscere la situazione → azione corretta. ⚠️ Si addestra il **COMPORTAMENTO/principio** (situazione→azione-corretta), **NON il file-path-lookup** (project-specific, brittle). Il lookup è F; il riconoscimento-addestrato è S.
- **Q3 → F+S**: Q1 ∧ Q2. La metà-S (recognition) ha stato-senza-training **DEGRADATA-MA-UTILE**: con la sola lane-F il sistema funziona (il modello *legge* la regola citata dal lookup), ma il riconoscimento robusto della situazione — incluso quando il trigger è implicito — è **migliore nei pesi**.
- **Q5 stato-senza-training (metà-S): DEGRADATA-MA-UTILE**. La lane-F fornisce un fallback forte (la regola viene comunque iniettata su match), quindi — a differenza di low-confidence-gather — questa F+S **è spedibile in Fase-1 col fallback** (anti over-gating), e la skill di recognition la migliora in Fase-2/3.
- **Q6 fallback deterministico: FORTE**. Il match-pattern della lane È il fallback: su trigger esplicito, la regola viene iniettata indipendentemente dal training. Q6 conferma il deploy del fallback-F in Fase-1.

> **Output**: `{F+S · F=lane-lookup O(1) drift-impossibile (PIENA) · stato-S=DEGRADATA-MA-UTILE · gate=fallback-lane-F1, skill-recognition-F2/3 · spec-S=recognition→azione con held-out per il discriminare}`.

## Governance della conoscenza a 4 tier (il "Playbook") `[EXTRACTED]`

Dove vive una conoscenza, dalla più calda alla più fredda:
1. **`LM.md`-directive** (always-context): la più frequente/cross-cutting/critica (1-riga + link, file piccolo).
2. **Situation-table entry** (router, on-demand): specifica a una situazione/trigger (il grosso, 100+ righe).
3. **wiki/memory/rule** (HARD rule, on-demand): contenuto completo, severity `hard|strong|soft`.
4. **Hook** (auto-enforced): per regole **meccanicamente verificabili** o che l'agente "perde" passivamente. Escalation via violation-ladder.

> **Mapping sul nostro wrapper** `[INFERRED]`: `LM.md`-directive ≈ lane `rules` (always-context); situation-table ≈ **nuova lane router** (questo concept); wiki-rule ≈ on-demand; **hook ≈ la nostra Classe C deterministic guardrails** (pre-flight/secrets-scanner, *scorer≠scored*). Il tier-hook **È** il nostro tier-guardrail-deterministico — stesso concetto.

## Reward / hack-check

- **Outcome desiderato**: nella situazione X, l'azione corretta Y è stata applicata e **ha evitato l'errore**; e — altrettanto importante — nella situazione **non-X**, la regola Y **non** è stata applicata a sproposito.
- **Reward sul riconoscere-situazione→azione** `[review-loop]` — premia se **seguire la regola ha evitato l'errore** (outcome verificabile: l'azione corretta applicata alla situazione corretta), MAI il gesto di "ho consultato la tabella" (participation-hack) né l'emissione del lookup. Vedi [[reward-hacking-mitigation]].
- **Held-out per premiare il DISCRIMINARE (non applicare-sempre)** `[review-loop]` — il rischio-hack specifico di questa skill è la **regola-applicata-sempre**: un modello che applica Y a ogni input massimizza il reward sui positivi senza *discriminare* la situazione. La difesa è un **held-out bilanciato** che include sia situazioni-X (Y è corretta) sia situazioni-non-X confondenti (Y è sbagliata / un'altra regola si applica / nessuna regola): il reward premia il **discriminare** — applicare Y *solo* dove serve — non l'applicarla incondizionatamente. Senza i negativi held-out, "trigger aggressivo / meglio falso-positivo che violazione mancata" degenera in apply-always.
- **Hack-check (scorer ≠ scored)** `[review-loop]`: lo scorer è l'**oracolo della situazione held-out** (la label "in questo input la regola Y si applica? sì/no" è by-construction), non un auto-giudizio del modello → **scorer ≠ scored** (CLAUDE.md #10).
- **Eval / situational-awareness**: misurabile con benchmark di **situational-awareness** (review-loop dim-4: SAD — Situational Awareness Dataset `[ref? da confermare]`) prima di addestrare il comportamento.

## Training (regime)

`[INFERRED]` Pipeline a 3 stadi (cfr. [[training-vs-harness-classification]] Q4):

1. **SFT-format** — famiglie di esempi `(situazione → azione-corretta)`, una famiglia per riga della tabella, includendo da subito i **negativi** (situazione-non-X → non-applicare-Y).
2. **On-policy distillation cold-start** — lo student riconosce/agisce, il teacher scora.
3. **RL-GRPO outcome-anchored** — reward sul discriminare (sopra), con held-out bilanciato X / non-X.

- **Label-generation**: by-construction per riga (trigger riconoscibile + azione attesa) + **held-out di confondenti** per il discriminare.
- ⚠️ **Si addestra il principio generico** (situazione→azione), **non** il file-path: le righe **generiche** (capture-ideas, verify-before-claim, read-before-acting, no-unverified-numbers, defense-in-depth) sono trasferibili; le righe **specifiche** del prodotto (stack/API proprietari) restano nella lane-F, non nel training.
- **Foglia di training**: Area 1/2/4 (situational-awareness, criticality, metacognition).

## Insight più grande `[INFERRED]`

Il sistema di disciplina prompt-engineered di un'organizzazione (directive + situation-table + hook + rituali) **È la versione prompt-engineered di ciò che vogliamo TRAINARE nei pesi** dell'SLM. Le righe **generiche** (capture-ideas, verify-before-claim, read-before-acting, owner-responsibility, no-unverified-numbers, defense-in-depth, …) sono trasferibili a un coding-agent = ottimo materiale di training organization-first. Le righe **specifiche** del prodotto (stack/API proprietari) NO → estrai solo il pattern + le discipline generiche.

## Linked
- [[training-vs-harness-classification]] — la governance 4-tier è ortogonale-ma-complementare all'asse training-vs-harness; gli hook auto-enforced ≈ F-pi deterministica.
- [[structured-context-sections]] — la situation-table è una nuova lane del context.
- [[reward-hacking-mitigation]] — outcome-anchored (la regola ha evitato l'errore), anti participation-hack.
- [[agent-constitution]] — le directive always-context ≈ tier-1 della governance.

> **Next**: generare l'example-space della foglia di training (Area 1/2/4) con i confondenti held-out; definire la lane `situation-table` nel context-assembly. ✅ Training-spec (regime + held-out-discrimina + scorer≠scored) completata 2026-06-29. ✅ Nota governance-4-tier già in [[training-vs-harness-classification]] §"Relazione con la governance della conoscenza".
