---
name: experiments-backlog
description: Tracker scientifico vivo degli esperimenti da eseguire per validare le ipotesi del progetto. Ogni esperimento = ipotesi + cosa testare + metrica di successo + wave/priorità + concept collegato. "Siamo scienziati: le evidenze guidano."
type: index
tags: [experiments, backlog, hypotheses, validation, scientific-method, todo]
last_updated: 2026-06-24
---

# Experiments Backlog

> Raccolta centrale delle **ipotesi da validare sperimentalmente**. Allineato alla filosofia scientifica del progetto (ADR provisional, evidenze guidano). Molti concept hanno flag `[da validare]`/`[da-rivalutare]` → confluiscono qui. **Living doc**: aggiungo man mano che emergono idee.
>
> Stato: `proposed` (da fare) · `running` · `done` (con esito). Quasi tutti Wave 7-8+ (richiedono ≥3 verticali e il core testuale validato).

## Batch: Multi-Expert Collaboration (aggiunto 2026-06-24)
Ipotesi madre: per task multi-domain, una **collaborazione dinamica di vertical specializzati** batte un singolo LoRA. Concept: [[concepts/multi-expert-collaboration]].

| ID | Ipotesi / cosa testare | Metrica di successo | Wave | Stato |
|---|---|---|---|---|
| **EXP-ME-1** | Catena sequenziale di expert vs **single-LoRA** su task multi-domain | accuracy/qualità su 100 task multi-domain custom vs baseline single-LoRA | 7 | proposed |
| **EXP-ME-2** | **Reclutamento dinamico** (expert dichiara limiti → recluta un vertical) vs catena statica decisa upfront | domain-coverage + correttezza su task che richiedono domini non previsti dal plan iniziale | 7-8 | proposed |
| **EXP-ME-3** ⭐ | **Cross-expert verification** (producer–verifier): es. finance valida lo script del coder vs leggi di mercato | error-catch rate (errori di dominio scovati dal verificatore che il produttore non vede) | 7-8 | proposed |
| **EXP-ME-4** | **Completeness-gate** dell'orchestratore (ultimo turno Tier 1: gap? → richiama : delibera) | gap-detection rate + accuracy finale vs no-gate | 7-8 | proposed |
| **EXP-ME-5** | **RL negativo per mancata dichiarazione dei limiti**, ancorato all'**outcome** (non all'atto di dichiarare) | precision/recall delle dichiarazioni + efficienza reclutamento; **watch over-declaration hack** ([[concepts/reward-hacking-mitigation]]) | 8 | proposed |
| **EXP-ME-6** | **Baseline router-learned** ([[concepts/xlora-vs-hmora|X-LoRA / HMoRA]]) vs nostro sequenziale | qualità + auditabilità + latency (il sequenziale deve giustificare il costo in audit) | 7-8 | proposed |
| **EXP-ME-7** | **Good-enough threshold guidato dal quality-tier** (100% = disabilitato) + max-round + escalation | terminazione garantita + qualità che scala col tier; no loop infinito su 100% irraggiungibile | 8 | proposed |
| **EXP-ME-8** | **Compose-to-fill**: vertical assente → comporre più vertical per coprire il dominio | domain-recovery accuracy + **calibrazione della confidenza** (non è lossless) | 8-9 | proposed |
| **EXP-ME-9** | **Self-election verificatore** — modello di controllo = **(C) blackboard-arbitrato** (scelto 2026-06-24); validare: catch precoce reale + che il reward "errore reale" eviti il **participation-hack** | error-catch precoce vs costo/loop + audit; reward ancorato a errori scovati (outcome, NON partecipazione) | 8 | proposed |

## Altri esperimenti già flaggati (cross-ref, da espandere)
| ID | Ipotesi | Concept | Wave |
|---|---|---|---|
| EXP-STEER-1 | **Depth steering vector** su Qwen3-4B modula lunghezza CoT mantenendo correttezza | [[concepts/steering-vectors]] | 6 |
| EXP-GAME-1 | **"Il gioco"** (self-critique vs teacher, RLAIF) migliora calibrazione/self-eval | [[concepts/scientific-method-operating-protocol]] Area 16 | 6 |
| EXP-SYM-1 | **Symbol-randomization** → exact-copy >95% match dei nomi dal contesto | [[concepts/runtime-symbol-randomization-training]] | 5 |
| EXP-NEEDLE-1 | **Adversarial needle** come training regime (4 variazioni rumore) migliora recall in contesto sporco | [[concepts/adversarial-needle-haystack-training]] | 5-6 |
| EXP-CURRIC-1 | **Staged curriculum** (reasoning→org→criticality→coding) batte single-stage shuffled | [[concepts/staged-curriculum-training]] | 5-6 |

## Regole
- Ogni esperimento ha una **metrica di successo** misurabile (Q dove possibile) e un **baseline** contro cui confrontare.
- Risultati (anche negativi) → registrati con esito; un'ipotesi smentita è un risultato valido.
- Prima di un esperimento RL/judge: passare l'**hack-check** ([[concepts/reward-hacking-mitigation]]).

## Sources
- Idee utente 2026-06-24 (multi-expert) + flag `[da validare]` sparsi nei concept.
