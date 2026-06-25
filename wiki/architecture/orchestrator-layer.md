---
name: orchestrator-layer
description: Tier 1 — Qwen base full-fine-tuned come orchestratore alto-livello.
type: architecture
tags: [tier1, orchestrator, full-ft]
status: design-phase
last_updated: 2026-05-21
---

# Tier 1 — Organization Specialist Layer

> **Aggiornato 2026-05-21**: vedi [[../decisions/2026-05-21-vision-clarification]]. Il Tier 1 è **organization-specialized**, non coding-specialized. Coding capability è aggiunta via LoRA (Tier 2-3).

## Responsabilità

Il valore principale del progetto vive qui. Il Tier 1 deve eccellere in:

- **Task decomposition + planning lungo orizzonte**: rompere goal complesso in step ordinati con dipendenze esplicite, anche multi-day.
- **Awareness criticità implicite**: riconoscere conseguenze nascoste delle azioni. Esempio canonico utente: "cancellazione di un file precedente — se lo ricordo, considero recovery; se non lo ricordo, fa nulla". Generalizzato a tutto il dominio: git ops destructive, DB DROP/TRUNCATE, network POST con secrets, shell rm -rf, modifiche a file non-versionati. Vedi [[../concepts/pre-flight-safety-checks]].
- **Safety reasoning pre-azione**: prima di emettere tool call distruttiva, ragionare sui hard limits e proporre alternative reversibili.
- **State tracking + queue management**: aggiornare e leggere `<current_state>`, `<state_queue>`, `<assets>`, `<pending_verifications>`. Vedi [[../concepts/structured-context-sections]] e [[../concepts/agent-wrapper-vars-queue]].
- **Multi-day session continuity**: riprendere task interrotti, riconoscere gap temporali, verificare se lo state è ancora valido. Vedi [[../concepts/temporal-awareness-timestamps]].
- **Cross-codebase reasoning STRUTTURALE**: navigare repo grandi, capire dipendenze e architettura — senza necessariamente conoscere ogni framework. Quella conoscenza viene da Tier 2-3.
- **Domain classification + routing decision**: capire se il task richiede coding (e quale stack), poi emettere `<load:programming,vertical:frontend>` (o equivalente) per chiamare Tier 2-3.
- **Quality assurance**: validazione finale dell'output prodotto dai layer LoRA.

## Cosa NON è responsabile

- ❌ Conoscenza profonda di framework specifici (questo è Tier 3)
- ❌ Codice idiomatico in linguaggio specifico (Tier 3)
- ❌ Best practice coding generic (Tier 2)
- ❌ Algoritmi avanzati o competitive programming (Tier 2-3)

## Implementazione

- **Method**: full fine-tuning del modello base (NOT LoRA, NOT prompt-only). Aperto: alternativa con LoRA grande (r=128+) se VRAM non basta.
- **Base candidates**: Qwen3.5-9B generic, Qwen3-8B, Qwen3-14B (vedi [[open-questions]] #5).
- **Training data needed** (composizione aggiornata, vedi [[../decisions/2026-05-21-vision-clarification]]):
  - **30% Task decomposition + planning multi-step lungo orizzonte** — synthetic da teacher model (Claude/GPT) su task long-horizon + reali da Claude Code transcripts pubblici
  - **20% Safety reasoning + awareness criticità implicite** — synthetic + reali. Esempi: cancellazione file, git operations destructive, DB DROP, shell rm -rf, modifiche a config sensibili. Pattern: dato un task, identifica le criticità implicite + proponi piano sicuro
  - **15% State tracking + multi-day continuity** — sessioni multi-turn con state evolution. Pattern: leggi context, identifica cosa è cambiato, decidi prossimo step
  - **10% Cross-codebase reasoning strutturale** — repo navigation, dependency analysis, architecture summarization. NON include scrittura codice, solo navigazione e comprensione
  - **10% Structured reasoning** (caveman thinking) — examples in formato strutturato con marker `[V]/[A]/[?]` (vedi [[../concepts/structured-thinking]])
  - **5-10% Coding replay minimo** — OSS-Instruct sample. NON intenso. Solo per evitare collasso totale della capability coding del base
  - **5-10% Generic instruction following** — OASST, instruction tuning standard, per non degradare baseline

## Rischi noti

1. **Catastrophic forgetting**: full-FT su task organizzativi degrada knowledge coding del base.
   - Mitigazione: replay 10-20% dataset coding nel training set, regular eval su benchmark coding general.
   - Riferimento: arXiv:2401.05605 (Scaling Laws for Forgetting).

2. **Routing accuracy**: se l'orchestratore sbaglia il routing, l'intera chain fallisce.
   - Mitigazione: classifier esterno deterministico (BERT-tiny) come safety net + fallback al base se confidence bassa.

3. **Base sub-ottimo per orchestrazione**: alcuni modelli generic sono peggio di Qwen3-instruct nel seguire istruzioni complesse.
   - Verifica: eval orchestrator-task baseline prima di iniziare FT.

## Alternative considerate

- **Skip orchestrator FT**: usare Qwen3 thinking mode + system prompt + agent framework esterno (LangGraph). Risparmia ~4 settimane training. Documentata in [[decisions/2026-05-21-project-bootstrap]] come alternativa rifiutata in attesa di evidenza contraria.
- **LoRA grande (r=128+) al posto di full-FT**: meno forgetting, ma capacità limitata. Da valutare se hardware costringe.

## Open questions

Vedi [[open-questions]] blocco 2-3 — in particolare #5, #7, #10, #13.

## Stato

Design-phase. Nessun training avviato. Eval baseline base candidate non ancora misurato.
