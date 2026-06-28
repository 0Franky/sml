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
- [x] **D5** Judge = DSv4-Flash su DwarfStar4 + **structured-contract** (TOON/JSON: dettagli/note/errori/soluzioni-se-100%) + **checklist pre&finali** del giudice + ensemble/audit + preferire verificabili. → [x] **concept `judge-design`** ✅ creato `wiki/concepts/judge-design.md` (draft v0: contract + checklist pre&finali + council-OPEN + classif F-harness/S-contract) · [x] **council DSv4+Claude vs policy** — VERIFICATO 2026-06-28: ❌ Claude-nel-loop **viola Anthropic** (Usage Policy + Commercial-Terms-D.4; OpenAI/Google idem); **DeepSeek permissivo**. **Risoluzione**: council di giudici OPEN (DSv4 + Qwen2.5-72B/R1), Claude fuori dal loop. (Non consulenza legale.)
- [x] **D6** Data-licensing → strategia commercial-clean. **FATTO**: `provenance-manifest` + `training-curriculum-design` (§6 review-loop) + `curriculum-stages-detail` (5 design per-stadio + agnostico). → decisioni §6.5: (a) ✅ **CHIARITO msg 266**: flusso = **Tier1[SFT→RL]→FREEZE→LoRA[SFT→RL]** — RL **anche sul Tier1** (metodi organizzativi; SFT da solo non basta), poi sulle LoRA (coding). Reco LoRA-size **APPROVATA** (rank-minimo-sufficiente, start r=64, ablazione r∈{32,64,128} coding-quality vs ritenzione-Tier1) + **valutare tipi/config LoRA diversi per i verticali Tier2/3**; (b) **hardware Tier1**: QLoRA-Tier1 (locale/cheap, MVP) vs full-FT-A100 (prodotto) — ablation; (c) [ ] **eval-protocol + baseline-competitor** (contro chi "batte i più grandi"); (d) ⭐ [ ] **smoke-test componibilità** = priorità #1 (Tier1-mini + 1 LoRA, misura coding vs ritenzione-Tier1, PRIMA dell'authoring); (e) [ ] **anti-forgetting gate** tra stadi.
- [x] **5 stadi = PRODOTTO; MVP = sottoinsieme di validazione** (msg 262): MVP tiene Tier1-mini + 1 LoRA frontend + smoke-test + 1-slice-RL(1env); taglia merge/toggle/multi-env/preference/soul-completo. §6.4 aggiornato.
- [x] **Structured-thinking confermato integrato** (msg 262): `concepts/structured-thinking` (tabelle-check + marker + token≤1.0) + two-phase CoT, nello Stadio 1. Ha senso (token/context-rot/auditabilità + SOTA efficient-CoT).
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
- [x] ✅ **6 ref VERIFICATI 2026-06-29** (agente, 3 fonti ciascuno → tutti REALI): AdaCoM 2605.30785 · SELAUR 2602.21158 · on-policy-distill/SOD 2605.07725 · Agentic-overconfidence 2602.06948 · BenchJack 2605.12673 · RHB 2605.02964. `[ref?]` rimossi dove presenti (catalogo righe 306/328; gli altri 4 erano già puliti).
- [ ] **Restano `[ref?]` NON ancora verificati** (altri ID nel catalogo, NON nella lista sopra): LoRA-GA 2407.05000 · Dr.GRPO 2503.20783 · DAPO 2503.14476 · Can-LLMs-Introspect 2605.26242 · Cache-aware 2601.06007 · Judge-robustness 2602.09383 · + senza-ID (GRIFT, Activation-abstention, AURC, DemyAgent-github). → verificare in batch successivo; NON citarli in artefatti pubblici finché non confermati.

## 🟣 Campagna Gold-example (PILOTA in corso 2026-06-29)
- [x] **Pilota = 3 foglie area-02** (1.2 overwrite Q+L · 3.2 dep-check Q · 6.2 defer L), autori verticali + revisori agnostici (regola utente msg 274).
- [x] ✅ **Enshrined in `judge-design.md`**: (a) **coherence-anchoring a DUE livelli** (esterna campi↔env_facts deterministica + interna razionale↔campi L) — il review agnostico ha mostrato che il solo livello-interno è gameabile; (b) **meta-schema contract** (campi-meta comuni + istanze per-foglia) → risolto il TODO-schema di judge-design.
- [x] ✅ **`gold-methodology.md` creato** (convenzioni rollout: oracolo-unificato H0⊆post, predicato-vs-esecuzione, marker [UNVERIFIED], review-loop obbligatorio, lunghezza, omissioni-dichiarate, reward_tag).
- [ ] **Fix P0/P1 per-file DIFFERITI a post-decisione-format** (no polish prima che l'utente scelga il format): 1.2 → P0 oracolo set-check unificato + classe(4) old&new + 5d declass + reward_tag + [UNVERIFIED]; 3.2 → FX-dynamic eseguibile + conteggio grep + §1bis omissioni; 6.2 → §3 two-level coherence + ancora-Q-predicato classi 1/2 + pre-check 'ben-formato'. Tutti: marker [UNVERIFIED], trim prosa ridondante.
- [ ] ⚠️ **Sandbox-execution pass dei gold**: gli output git/grep/pytest dei gold sono *attesi/plausibili* ma NON eseguiti in sandbox reale → verificarli quando lo **scaffold verifier-sandbox** (Fase 0.3, task #6) è pronto. Gate del gold-reference definitivo.
- [ ] **Wiring 3 gold** (index/log) — in corso (lo fa l'integratore).
- [ ] 🔴 **DECISIONE UTENTE: format di rollout** — i gold escono lunghi (340/430/491 righe per fedeltà al template canonico 686). ×215 foglie = corpus enorme. Opzioni: (A) template pieno · (B) versione compatta per-foglia · (C) staging multi-sessione. Reco da presentare col pilota.

## 🟢 Milestone
- [ ] **Greenlight implementazione** (gate 0-A: dati/verifier model-independent — fixture + verifier standalone + misura gap base-model). Awaiting go utente.

---
*Aggiornare a ogni rinvio/completamento. `[x]` = done (poi spostare la nota rilevante in `log.md`).*
