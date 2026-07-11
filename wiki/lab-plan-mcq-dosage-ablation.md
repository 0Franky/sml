---
name: lab-plan-mcq-dosage-ablation
description: PROTOCOLLO (proposta) dell'ablation per fissare EMPIRICAMENTE quanto MCQ mettere nel training-mix senza degradare la generazione — risponde al timore utente (msg 2026-07-11). Design a arm (baseline 0% / light / heavy / decay / pulse / +format-transfer), controllo-chiave = budget-token COSTANTE per arm, metriche a 4 assi (guadagno-skill-generativo · regressione-generale · astensione · guadagno-MCQ), criterio di decisione outcome-anchored. Banco = 4B-test (poi validazione leggera sul target). PROPOSTA — attende ok scope+budget (#26/#30).
type: lab-plan
tags: [training, ablation, mcq, dosage, format-overfitting, experiment-design, held-out, rl, proposal]
last_updated: 2026-07-11
status: PROPOSTA-attende-ok-esecuzione
sources:
  - user msg 2026-07-11 (timore overfitting MCQ + "procedi" col protocollo)
  - concept [[concepts/mcq-training-dosage-and-format-overfitting]]
---

# Lab-plan — Ablation MCQ-dosage (quanto MCQ senza degradare la generazione)

> **Stato**: PROPOSTA (#26 — non ratificata; non eseguire finché l'utente non decide scope+budget, #30). Questo doc è **decision-ready**: lo fermo qui perché il VoI di ulteriore raffinamento è ~0 finché non c'è l'ok + la scelta del base-model/dataset ([[feedback_convergence_voi_generative]]: oggetto generativo → loop-until-VoI, tier fissato a monte, NON loop-until-dry).
> **Teoria di riferimento** (il "perché"): [[concepts/mcq-training-dosage-and-format-overfitting]] (12 metodologie M1-M12). Questo lab-plan **operazionalizza M10** (misura) + risolve empiricamente M2 (frazione) e M9 (decay-vs-pulse).

## §0 — Domanda, ipotesi, cosa falsifichiamo

**Domanda**: qual è la **frazione + lo schedule** di MCQ nel training-mix che massimizza il guadagno sulle skill-target **senza** degradare la capacità **generativa/agentica** (e senza dis-insegnare l'astensione)?

**Ipotesi** (falsificabili):
- **H1 (soglia)** — oltre una certa frazione MCQ la performance **generativa** degrada (format-overfit). *Falsifica*: nessuna degradazione fino a heavy → l'MCQ è "gratis", il timore non morde.
- **H2 (schedule)** — a pari esposizione MCQ totale, il **decay** preserva la generazione **meglio** del pulse on/off (e del costante). *Falsifica*: pulse ≥ decay → l'intuizione-scaglionamento dell'utente vince e la adottiamo.
- **H3 (format-transfer)** — insegnare ogni skill **anche free-form** (M3) sposta la soglia di degradazione **verso l'alto** (puoi permetterti più MCQ). *Falsifica*: nessuno spostamento → M3 non è una leva di dosaggio.
- **H4 (astensione, M5)** — l'MCQ heavy-costante **abbassa il tasso di astensione corretta** (dis-insegna il "devo verificare"). *Falsifica*: astensione stabile → il conflitto choose-one è teorico, non pratico.

> **Nota-onestà**: includo il **pulse** come arm reale (idea utente) invece di scartarlo a tavolino — la sua intuizione va **misurata**, non solo confutata in teoria ([[feedback_scientific_evolution]]: le evidenze guidano). Se H2 fallisce, adottiamo il pulse.

## §1 — Design: gli arm

Design **fattoriale ridotto** (non pieno — VoI): baseline + 2 sull'asse-frazione + 2 sull'asse-schedule + 1 opzionale sull'asse-format.

| Arm | Frazione MCQ | Schedule | Format-transfer (M3) | Serve a testare |
|---|---|---|---|---|
| **A0 — Baseline** | 0% | — | (skill solo free-form) | control: il segno di ogni Δ |
| **A1 — Light** | ~8%* | costante | off | H1 (soglia bassa) |
| **A2 — Heavy** | ~30%* | costante | off | H1 (soglia alta) + ancora per gli schedule |
| **A3 — Decay** | ~30%→0* | annealato | off | H2 (decay vs costante/pulse) |
| **A4 — Pulse** | on/off, esposiz.=A3 | a gradino | off | H2 (idea utente, confronto diretto vs A3) |
| **A5 — Heavy+FT** *(opz. budget)* | ~30%* | costante | **on** | H3 (M3 alza la soglia) |

`*` percentuali = **proposta da calibrare** col noise-floor probe (P0), non numeri sacri (#22 — non invento precisione).

**Confronti puliti** (ogni confronto muove UN asse):
- **frazione**: A1 vs A2 (schedule costante fisso).
- **schedule**: A2 vs A3 vs A4 a **pari esposizione MCQ totale** (isola la *forma temporale* dalla *quantità*).
- **format-transfer**: A2 vs A5 (frazione fissa).

## §2 — Il controllo CRUCIALE (senza cui l'esperimento non vale nulla)

**Ogni arm ha lo STESSO budget-token/optimizer-step TOTALE.** Varia SOLO la *composizione* (MCQ vs generativo) e la sua *distribuzione temporale*. Il 30% di MCQ in A2 **sostituisce** il 30% di generativo, non lo **aggiunge**.

- ❌ Senza questo controllo, "più MCQ" si confonde con "più training" → qualunque risultato è ininterpretabile.
- Corollario: A0 (0% MCQ) usa quel budget tutto in generativo → è il vero control per il **costo-opportunità** dell'MCQ (ogni token-MCQ è un token-generativo non speso).

## §3 — Metriche (4 assi — coprono i 3 rischi del concept)

Tutte su **held-out decontaminato** (#18), tutte confrontate vs A0.

1. **GUADAGNO-skill-generativo** *(primaria)* — le skill insegnate via MCQ, valutate in forma **generativa** held-out (il modello **produce** l'audit/la spiegazione, NON sceglie una lettera), con l'oracolo generativo della classe o judge indipendente (**scorer ≠ scored**). *È il punto: l'MCQ deve migliorare la GENERAZIONE della skill, non solo l'MCQ-accuracy.*
2. **REGRESSIONE-generale** *(guardia collaterale)* — un benchmark generativo/agentico generale (coding-bench piccolo + istruzioni) → cattura il format-overfit che danneggia capacità **non** mirate.
3. **ASTENSIONE/calibrazione** *(guardia M5)* — probe dove la risposta corretta è "verifica / non lo so senza dati" → misura se l'MCQ ha **dis-insegnato** l'astensione (tasso di astensione-corretta + ECE).
4. **GUADAGNO-MCQ** *(diagnostica)* — le stesse skill in forma MCQ held-out → serve a vedere il **gap** MCQ↑ vs generativo-fermo (= sintomo diretto di format-overfit).

## §4 — Criterio di decisione (outcome-anchored, #10)

Scegli l'arm ottimale:

> **arm\* = argmax [ GUADAGNO-skill-generativo ]** soggetto a:
> (i) REGRESSIONE-generale ≥ −τ_gen · (ii) ASTENSIONE ≥ −τ_abs

con **τ_gen, τ_abs fissati a monte** (proposta: entro *noise-floor + piccolo margine*, calibrati da P0). 

- Se **nessun** arm con MCQ>0 batte A0 sul guadagno-**generativo** netto → **l'MCQ non paga** per quelle skill (risultato valido e utile: declassalo a scaffold-non-premiato lì, o abbassa ancora la frazione).
- La scelta premia il **guadagno che si materializza nella generazione** (l'outcome vero), non l'MCQ-accuracy (che è il proxy) → coerente con [[feedback_reward_hacking_principle]] + [[feedback_reward_branch_field_trap]].

## §5 — Modello, fattibilità, costo (onesto)

- **Banco = 4B-test** (memory [[project_test_model_vs_target]]: il 4B è il banco del **SISTEMA**, non si tara su di esso). QLoRA sul 4B entra sul locale (2080 Ti 11GB — [[project_local_hardware]]); framework **Unsloth** (coerente [[project_framework_stack]]).
- **Cosa dà il 4B**: la **FORMA della relazione** (esiste la soglia H1? decay>pulse H2? M3 alza la soglia H3?) + il **segno** di ogni Δ. Questo è il deliverable trasferibile.
- ⚠️ **Caveat-transfer (#22)**: la *ratio ottimale numerica* può **non** trasferire 1:1 al target 27B — un modello più capace potrebbe tollerare **più** MCQ. Quindi: (a) il 4B fissa forma+vincitore-schedule; (b) prima di committare una ratio in produzione → **validazione leggera sul target** su 1-2 arm chiave (baseline + il vincitore). Non prometto transfer perfetto.
- **Costo (ordine di grandezza, da raffinare — non invento precisione)**: ~5 arm × 2-3 seed = **10-15 fine-tuning brevi** + eval. Locale in ~giorni, o cloud economico. Numeri esatti dopo aver fissato dataset-size/step.

## §6 — Rigore (tarato VoI, non paranoia)

- **Seed multipli** (≥2-3/arm) → separa l'effetto dal rumore; il **noise-floor probe (P0)** definisce τ.
- **Held-out generativo ≠ formato MCQ** (il cuore della metrica 1): se lo valutassi in MCQ misurerei il proxy, non l'obiettivo.
- **Decontaminazione** (#18): gli item di eval **mai** nel training; il generatore di label non emette l'istanza-eval.
- **A0 obbligatoria**: senza il control 0%-MCQ non conosci il **segno** di Δ.
- **Budget-token costante** (§2) — il controllo che regge tutto.
- **Scorer ≠ scored** sulla metrica 1 (judge indipendente o oracolo, mai self-score).

## §7 — Prerequisiti prima di eseguire + cosa NON fare ora

**Serve prima (dipendenze APERTE → per questo è PROPOSTA, non esecuzione)**:
- Il **dataset** delle classi MCQ **+ le versioni generative held-out** di quelle skill (dipende dallo stato del dataset-build).
- La **pipeline** QLoRA sul 4B (Unsloth) + gli eval runner delle 4 metriche (riusare `harness/eval/` dove possibile).
- P0: **noise-floor probe** per fissare τ_gen/τ_abs e calibrare le % degli arm.

**Cosa NON fare (#30/#26)**:
- ❌ NON eseguire finché l'utente non decide **scope** (con/senza A5, quanti seed) + **budget**.
- ❌ NON tarare il design sui vincoli del 4B (il 4B è il banco, non il target — memory).
- ❌ NON committare una ratio in produzione dal solo 4B senza il check-transfer sul target (§5).

## §8 — Scelte aperte (da confermare) + collegamenti

**Da confermare con l'utente** (default proposti tra parentesi):
1. **Scope arm**: includere A5 (Heavy+format-transfer) e A4 (Pulse)? *(default: sì entrambi — A4 testa la tua idea, A5 testa una leva vera).*
2. **Banco**: solo 4B, o anche il mini-check sul target? *(default: 4B ora, target-check dopo il vincitore).*
3. **Soglie τ_gen/τ_abs**: fissate da P0-noise-floor *(default: entro noise-floor + margine)*, o vuoi un limite assoluto (es. "max −2% sul generale")?
4. **Budget/tempo**: locale-4B (gratis, giorni) vs cloud-economico (più veloce). *(default: locale)*.

**Collegamenti**:
- **grill [E]** (retrofit reward 3-segnali + MCQ-controfattuale) — **complementare**: l'MCQ-controfattuale (M7) è il *validatore-di-ragionamento* del reward; questo lab-plan fissa la *frazione/schedule*. L'ablation può girare col reward-baseline o col 3-segnali già deciso.
- Vincoli-di-disegno §VoI del [[lab-plan-capable-models-validation]] (validità cheap su ogni lab) — si applicano anche qui.

## Links
[[concepts/mcq-training-dosage-and-format-overfitting]] (teoria M1-M12) · [[training-taxonomy/dataset-construction-playbook]] §4 [MCQ-DOSAGE] · [[concepts/discriminative-mcq-hard-distractors]] · [[concepts/phased-reward-and-rh-detection]] · [[feedback_reward_hacking_principle]] · [[feedback_convergence_voi_generative]] · [[feedback_scientific_evolution]] · [[project_test_model_vs_target]] · [[project_local_hardware]] · [[project_framework_stack]] · [[lab-plan-capable-models-validation]]
