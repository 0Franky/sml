---
name: wiki-todo
description: Tracker vivo di TODO/pending — tutto ciò che è rinviato o aperto va QUI, non lasciato in chat (regola utente 2026-06-28 "tracciamo sempre tutto"). Stato: open/in-progress/done.
type: todo
last_updated: 2026-06-28
---

# TODO Tracker

> Regola (utente 2026-06-28): **tutto ciò che si rinvia va tracciato qui**, mai lasciato solo in chat. Companion di `log.md` (ledger storico) — questo è il *forward-looking* (cosa resta da fare). Vedi memory `feedback_track_everything`.

## ✅ Decisioni D1-D6 — CONFERMATE (msg 245) → ADR `wiki/decisions/2026-06-28-decisions-d1-d5.md`
- [x] **D1** LoRA-init + aLoRA — standard B=0 + ablation MiLoRA + 10% replay + DoRA/RsLoRA; aLoRA = spike vs standard. → **da fare**: spike aLoRA + ablation-init in F2.
- [x] **D2** Tokenizer/special-token — vocab + embedding init in setup + XGrammar.
- [x] **D3** Hardware — 2080 Ti MVP, fp16 (no bf16/fp8), KIVI/SnapKV se serve.
- [x] **D4** marker espliciti = scelta. → [ ] **FUTURO: ibrido Coconut** (latent + pre-final-check strutturato scelte+perché + risposta finale) — studiare fattibilità (concept esplorativo).
- [x] **D5** Judge = DSv4-Flash su DwarfStar4 + **structured-contract** (TOON/JSON: dettagli/note/errori/soluzioni-se-100%) + **checklist pre&finali** del giudice + ensemble/audit + preferire verificabili. → [ ] **concept `judge-design`** (contract-schema + checklist pre&finali + **council OPEN**) · [x] **council DSv4+Claude vs policy** — VERIFICATO 2026-06-28: ❌ Claude-nel-loop **viola Anthropic** (Usage Policy + Commercial-Terms-D.4; OpenAI/Google idem); **DeepSeek permissivo**. **Risoluzione**: council di giudici OPEN (DSv4 + Qwen2.5-72B/R1), Claude fuori dal loop. (Non consulenza legale.)
- [x] **D6** Data-licensing → strategia commercial-clean confermata. **FATTO**: `provenance-manifest.md` + `training-curriculum-design.md` (validato Nemotron). → [ ] **discutere il curriculum con l'utente** ("capiamo bene insieme") + dettagliare per-stadio (volumi/mix/schedule).
- [x] **Ricerca Nemotron** (pipeline + RL) FATTA → integrata in `training-curriculum-design.md` (verdetto: ipotesi a round confermata + 3 correzioni + toggle/merge).

## 🟠 Dettagli training-spec rinviati (dal playbook training-vs-harness, da dettagliare nelle FOGLIE di training)
- [ ] **Meccanismo twin-pair per EVPI** (low-confidence→gather/ask): coppia gemella senza-info dove gather NON cambia l'esito → reward = "l'info ha cambiato la decisione" osservabile. Riusa il pattern del gold area-02.
- [ ] **Regime cold-start a 3 stadi** per le metacognitive inerti: `SFT-format → on-policy distillation → GRPO`.
- [ ] **Calibration-reward wired per foglia** (degradation/low-confidence/contradiction): termine RLCR/ConfTuner-Brier + **ECE/Brier come early-stop** di pari rango con l'accuracy. Vincolo "GRPO erode la calibrazione".
- [ ] **AdaCoM frozen-agent precondition**: Tier-1 base competente PRIMA del training manager+frozen-agent.
- [ ] **Gap label-generation** (dal reviewer ML-training): (a) transfer sintetico→reale del degrado (canary set naturale); (b) outcome-bisect cattura anche traiettorie degradate-ma-recuperate (non solo collassi); (c) self-consistency-drop orfano da operazionalizzare.
- [ ] Foglie di training da scrivere: `dependency-aware-error-recovery` (Area 2/4/16), `interruption-robust-reasoning` (Area 3/4), `situational-policy-table` (Area 1/2/4), `compaction-scheduling` (Area 4).

## 🟡 Rifiniture documentazione
- [x] 2° worked-example (low-confidence) nel playbook `training-vs-harness-classification` — **FATTO 2026-06-28**.
- [x] Consolidare le 7 dimensioni orizzontali nel corpo del catalogo SOTA → **Dimensione 10** — **FATTO 2026-06-28**.
- [ ] **Integrare la PARTE 1 del briefing** (glossario non-tecnico: GRPO-calibrazione/XGrammar/inoculation/mini-SWE-agent/GiGPO/OSS-Instruct) nella knowledge base — utente msg 243 "parte 1 perfetta, da integrare tutta". Le tecniche sono già nel catalogo SOTA; integrare le **spiegazioni plain-language** (come glossario/note nei concept rilevanti o un `wiki/concepts/glossario.md`).

## 🔵 Verifica fonti
- [ ] **Ref arXiv da verificare** (ID con YYMM futuro 26xx, marcati `[ref?]` nel catalogo §RL-5): AdaCoM 2605.30785, SELAUR 2602.21158, on-policy-distill 2605.07725, Agentic-overconfidence 2602.06948, BenchJack 2605.12673, RHB 2605.02964, e altri in §RL-5. NON citarli in artefatti pubblici/paper finché non confermati.

## 🟢 Milestone
- [ ] **Greenlight implementazione** (gate 0-A: dati/verifier model-independent — fixture + verifier standalone + misura gap base-model). Awaiting go utente.

---
*Aggiornare a ogni rinvio/completamento. `[x]` = done (poi spostare la nota rilevante in `log.md`).*
