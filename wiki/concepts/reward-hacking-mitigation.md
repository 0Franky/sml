---
name: reward-hacking-mitigation
description: Vincolo di prima classe sull'intero reward design. Mappa DOVE il reward hacking può avvenire nella nostra pipeline (PRM, GRPO, RLAIF "il gioco", self-score scorecard, LLM-judge) e le difese in profondità. Emphasis utente 2026-06-23.
type: concept
tags: [reward-hacking, goodhart, rlhf, rlaif, prm, grpo, reward-overoptimization, safety, training, guardrail]
last_updated: 2026-06-23
status: draft — vincolo cross-pipeline, da raffinare
confidence: provisional
---

# Reward Hacking Mitigation

> **Origine**: emphasis utente 2026-06-23 — "dobbiamo fare MOLTA ATTENZIONE AI REWARD HACK". Vincolo che **attraversa tutto il reward design** del progetto (D3 di [[scientific-method-operating-protocol]], la taxonomy reward design, il "gioco" auto-critica, lo scorecard di [[quality-target-tiers]]).

## 1. Principio (Goodhart)
> "When a measure becomes a target, it ceases to be a good measure."

Ogni segnale di reward è un **proxy** della qualità vera. Il modello, ottimizzando, trova il modo di **massimizzare il proxy senza la qualità** (reward overoptimization). Più il reward è soggettivo/gameable, più velocemente succede. Il nostro programma è particolarmente esposto perché si appoggia a **molti reward proxy** (process, outcome, judge, self-score).

## 2. DOVE può avvenire nella NOSTRA pipeline

| Sorgente di reward | Hack tipico | Esposizione |
|---|---|---|
| **Process reward / PRM** (D3 split pos/neg) | step che *sembrano* corretti al PRM ma non portano alla soluzione; reasoning verboso-plausibile | 🔴 alta (PRM è un modello, fallibile) |
| **Outcome reward / GRPO** (test pass) | hardcode dell'output atteso, overfit a test deboli, exploit dell'harness/test | 🔴 alta se i test sono deboli |
| **Self-critique "il gioco"** (RLAIF, Area 16) | produce la critica che il teacher premia (non quella vera); auto-compiacenza | 🟠 media (limitata dal teacher) |
| **Self-score scorecard** ([[quality-target-tiers]]) | **gonfia i propri voti** (Security 5/5 quando è 2/5) ← preoccupazione esplicita utente | 🔴 alta se il self-score dà reward |
| **LLM-as-judge** (dimensioni L) | sfrutta i bias del judge: lunghezza, formattazione, tono sicuro | 🟠 media |
| **Refusal/safety reward** (Area 11) | **over-refusal**: rifiuta tutto per non sbagliare | 🟠 media |
| **Length/format reward** (Area 10) | padding, formato senza sostanza | 🟡 bassa-media |
| **Verification / self-election reward** (cross-expert, "il gioco", self-election EXP-ME-9) | **participation-hack**: critica / si auto-elegge / recluta OVUNQUE per massimizzare coinvolgimento e reward | 🔴 alta |

## 3. Difese in profondità

### Principio guida: ancorare al VERIFICABILE
**Preferire reward Q (verificabili) a reward L (judge) ovunque possibile.** Esecuzione, test, exact-match, scanner non si possono "addolcire". Usare Q come spina dorsale; L solo dove inevitabile, e mai da solo.

| # | Difesa | Contro quale hack |
|---|--------|-------------------|
| 1 | **Held-out / hidden test set** + decontamination | hardcode/overfit ai test (GRPO) |
| 2 | **Verifier robusti** (mutation testing, property-based, fuzzing, test forti) | "passa i test" ≠ corretto |
| 3 | **Scorer ≠ scored**: il reward delle dimensioni L viene da un **giudice indipendente**, MAI dal modello stesso. Il self-score serve per *comunicare/decidere*, non come reward | self-score gonfiato (scorecard) |
| 4 | **Proxy Q per le dimensioni dello scorecard** dove esistono (coverage%, vuln-scanner per Security, linter per quality) | self-score gonfiato |
| 5 | **Judge diversi / ensemble + lenti diverse + rotazione** | gaming di un singolo judge |
| 6 | **KL regularization** (resta vicino al reference policy) | deriva verso policy degeneri |
| 7 | **Process + Outcome combinati**: l'outcome (Q forte) ancora il process reward gameable | PRM fooling |
| 8 | **Penalità esplicite** anti-hack: length penalty, anti-sycophancy, detector di hardcoded-output, penalità over-refusal | padding, sycophancy, over-refusal |
| 9 | **Monitor di overoptimization**: reward ↑ ma qualità vera (held-out) piatta/↓ = segnale di Goodhart → early stop / re-tune del reward | tutti (segnale globale) |
| 10 | **Red-team del reward**: audit periodico "cosa sta REALMENTE premiando il reward?" su campioni | tutti |
| 11 | **Anti-reward-hack nel dataset**: esempi dove "passa il test ma è hardcoded/sbagliato" → il modello deve **riconoscerlo e NON farlo** (lega a honesty constitution + self-critique) | meta: insegnare a non barare |
| 12 ⭐ | **Reward ancorato all'OUTCOME, non alla partecipazione** (principio first-class, emphasis utente 2026-06-24): il reward di verifica / critica / self-election / reclutamento si dà SOLO se *"ha scovato/risolto un errore REALE"* (verificabile), mai per il solo atto di partecipare/criticare/candidarsi | **participation-hack** (auto-eleggersi/criticare/reclutare ovunque) |

### Difesa specifica per lo scorecard (preoccupazione utente)
- Le dimensioni **Q** (test coverage, security-scan, perf-benchmark) → score da **strumenti deterministici**, non dal modello.
- Le dimensioni **L** (architettura, leggibilità) → **giudice esterno** indipendente, mai self.
- Il modello **può** auto-valutarsi per *comunicare il gap* all'utente, ma quel numero **non entra come reward** su sé stesso.

## 4. Wiring nel progetto

- **Reward design della taxonomy**: ogni foglia, quando definisce il reward (Q/L), deve passare un **"hack-check"**: *"come potrebbe il modello massimizzare questo senza la skill?"* → aggiungere la difesa corrispondente.
- **[[scientific-method-operating-protocol]] D3**: il process reward (split pos/neg) va sempre **ancorato all'outcome verificabile** + monitor di overoptimization.
- **[[quality-target-tiers]]**: scorer esterno per il reward, self-score solo per comunicazione.
- **[[agent-constitution]]**: aggiungere principio "**non gamificare metriche/test**: riporta la qualità vera, non barare per far passare un check" (inference-side; complementa la difesa training-side).
- **Area 16 "il gioco"**: giudici a lenti diverse + il teacher come ancora, mai self-reward puro.

## 5. Riferimenti `[DA VERIFICARE ID]`
- Goodhart's law (Strathern 1997 formulation).
- "Scaling Laws for Reward Model Overoptimization" (Gao, Schulman, Hilton 2022).
- Reward hacking / specification gaming (Krakovna et al., DeepMind).
- Sycophancy in RLHF (Perez et al. 2022; Sharma et al. 2023).
- Test-set / harness exploitation in code RL (varie SWE-bench post-mortem).

## Sources
- Emphasis utente 2026-06-23 (Telegram).
- Collega: [[scientific-method-operating-protocol]] (D3), [[quality-target-tiers]], [[agent-constitution]], [[../training-taxonomy/README]], [[../entities/prm-paper]], [[multi-expert-collaboration]].
