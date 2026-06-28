---
name: situational-policy-table
description: Tabella-router "SE situazione X → leggi/applica regola-azione Y (obbligo) PRIMA di procedere". FEATURE = lane lookup O(1) (drift-impossibile, scalabile, auto-enforced) + SKILL = riconoscere la situazione → emettere l'azione corretta, addestrata nei pesi (si addestra il COMPORTAMENTO, non il file-path). Training goldmine. Parte di una governance della conoscenza a 4 tier. Idea utente msg 200-202 (pattern generico estratto PII-free da repo privato).
type: concept
tags: [concept, situational-awareness, policy-table, governance, training-goldmine, skill-vs-feature, reward-hacking, organization-first]
sources: [user notes 2026-06-27 msg 200-202, wiki/concepts/training-vs-harness-classification, structured-context-sections]
last_updated: 2026-06-27
status: draft v0
confidence: provisional
---

# Situational Policy Table (router situazione → azione)

> **Stato**: draft v0. Idea utente 2026-06-27 (msg 200-202), pattern **generico** estratto da un sistema di disciplina prompt-engineered di repo privati (estratti solo i pattern, **nessun nome/PII**). Doppio valore: meccanismo wrapper **e** materiale di training.

## Catena di pensiero (why → problema → soluzione)

- **Why** `[EXTRACTED]` — un agente con decine di regole non può tenerle tutte sempre in contesto né ricordarle a memoria a ogni passo: la conoscenza "passiva" (read→forget) **si perde**, e le decisioni driftano.
- **Problema** `[EXTRACTED]` — serve un modo per cui, data una **situazione** (sto per cancellare un file / sto per scrivere un secret / sto iniziando un task), l'azione/regola corretta sia **richiamata e applicata obbligatoriamente** prima di procedere, senza dipendere dalla memoria del modello.
- **Soluzione** `[EXTRACTED]` — una **tabella-router**: righe "SE stai facendo X → LEGGI/APPLICA la regola Y PRIMA di procedere". Lookup O(1) per pattern → zero decisioni a memoria → **drift impossibile**, scalabile a 100+ regole senza appesantire il context, **auto-enforced** (non applicare la regola citata = violazione rilevabile). Trigger **aggressivo** (meglio un falso-positivo che una violazione mancata).

## FEATURE vs SKILL (la nuance critica) `[EXTRACTED]`

- **FEATURE (wrapper)**: la tabella come **lane** nel context-assembly (Classe A) — lookup deterministico situazione→regola. Project-specific, aggiornabile senza retraining.
- **SKILL (pesi, da addestrare)**: il **riconoscimento** della situazione → emissione dell'azione corretta. ⚠️ **Si addestra il COMPORTAMENTO / il principio** (situazione→azione-corretta), **NON il file-path-lookup** (project-specific, brittle). Il lookup-table è feature; il riconoscimento-addestrato è skill — stesso pattern [[training-vs-harness-classification]] di tutto il resto.

> **Verifica del claim utente "rafforza i pesi quando prende una scelta"**: `[EXTRACTED]` confermato — addestrare su **situazione→azione-corretta** rinforza il decision-making **nei pesi** invece di affidarsi al lookup-prompt ogni volta. Ogni riga = una **famiglia di esempi** verificabili (riconosci il trigger → emetti l'azione corretta).

## Governance della conoscenza a 4 tier (il "Playbook") `[EXTRACTED]`

Dove vive una conoscenza, dalla più calda alla più fredda:
1. **`LM.md`-directive** (always-context): la più frequente/cross-cutting/critica (1-riga + link, file piccolo).
2. **Situation-table entry** (router, on-demand): specifica a una situazione/trigger (il grosso, 100+ righe).
3. **wiki/memory/rule** (HARD rule, on-demand): contenuto completo, severity `hard|strong|soft`.
4. **Hook** (auto-enforced): per regole **meccanicamente verificabili** o che l'agente "perde" passivamente. Escalation via violation-ladder.

> **Mapping sul nostro wrapper** `[INFERRED]`: `LM.md`-directive ≈ lane `rules` (always-context); situation-table ≈ **nuova lane router** (questo concept); wiki-rule ≈ on-demand; **hook ≈ la nostra Classe C deterministic guardrails** (pre-flight/secrets-scanner, *scorer≠scored*). Il tier-hook **È** il nostro tier-guardrail-deterministico — stesso concetto.

## Reward / hack-check

- **Outcome desiderato**: nella situazione X, l'azione corretta Y è stata applicata e **ha evitato l'errore**.
- **Reward ancorato all'OUTCOME** `[EXTRACTED]` — premia se **seguire la regola ha evitato l'errore** (outcome verificabile), MAI il gesto di "ho consultato la tabella" (participation-hack) né l'emissione del lookup. Vedi [[reward-hacking-mitigation]].
- **Eval / situational-awareness**: misurabile con benchmark di **situational-awareness** (review-loop dim-4: SAD — Situational Awareness Dataset `[ref? da confermare]`) prima di addestrare il comportamento.

## Insight più grande `[INFERRED]`

Il sistema di disciplina prompt-engineered di un'organizzazione (directive + situation-table + hook + rituali) **È la versione prompt-engineered di ciò che vogliamo TRAINARE nei pesi** dell'SLM. Le righe **generiche** (capture-ideas, verify-before-claim, read-before-acting, owner-responsibility, no-unverified-numbers, defense-in-depth, …) sono trasferibili a un coding-agent = ottimo materiale di training organization-first. Le righe **specifiche** del prodotto (stack/API proprietari) NO → estrai solo il pattern + le discipline generiche.

## Linked
- [[training-vs-harness-classification]] — la governance 4-tier è ortogonale-ma-complementare all'asse training-vs-harness; gli hook auto-enforced ≈ F-pi deterministica.
- [[structured-context-sections]] — la situation-table è una nuova lane del context.
- [[reward-hacking-mitigation]] — outcome-anchored (la regola ha evitato l'errore), anti participation-hack.
- [[agent-constitution]] — le directive always-context ≈ tier-1 della governance.

> **Next**: foglia di training (situazione→azione, Area 1/2/4) con example-space; definire la lane `situation-table` nel context-assembly; nota governance-4-tier in [[training-vs-harness-classification]].
