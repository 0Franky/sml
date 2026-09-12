---
name: 2026-09-12-prm-appreso-escluso-proposta
description: ⛔ PROPOSTA (attende Fra, registro D11) — in Wave 6 nessun process reward model APPRESO come reward di training; il reward per fase resta un ORACOLO DETERMINISTICO (le scene/lab), il giudice LLM solo come etichettatore offline. Dal PDF di «Reward Under Attack» (2603.06621) e di VPR (2605.10325), letti il 2026-09-12.
type: decision
tags: [reward, prm, process-reward, oracolo, wave-6, post-training, reward-hacking, proposta, area-training]
last_updated: 2026-09-12
---

> # ⛔ PROPOSTA — attende la risposta di Fra (registro [[../todo/domande-aperte-per-fra]] D11, aperta il 2026-09-12)
> **Cosa cambierebbe**: la voce *«ORPO + PRM (process reward model su criticality awareness) + GRPO opzionale»* della strategia post-training decisa da Fra il **2026-05-21** (open question #15, memoria `project_post_training_strategy`, ADR [[2026-05-21-training-philosophy-roadmap]]). Quella è **una sua decisione**: qui si propone di riscriverla, non la si riscrive (#26/#34).
> **Provenienza dell'evidenza**: i due paper sono stati letti nel testo completo (versione HTML di arXiv) **tramite un riassuntore**, non riga per riga da me; i numeri riportati coincidono con gli abstract che ho aperto io il 2026-09-11 (`[V]` sull'abstract, `[A]` sul corpo). Il resto è misurato in casa (F41-F44).

# Nessun PRM appreso come reward di training — proposta

## Il fatto che cambia la decisione

**«Reward Under Attack»** (Tiwari, Tomar, Bamba et al., arXiv **2603.06621**, feb 2026) mette un PRM appreso nel loop di RL e misura cosa succede:
- policy Qwen2.5-1.5B-Instruct addestrata via RL contro **Skywork-o1-Open-PRM (1.5B e 7B)** e **Qwen2.5-Math-PRM-7B**, su AIME 2024 → eval AIME 2025 (**solo matematica**);
- il reward del PRM sale sopra **0,8** (Skywork-1.5B) mentre l'accuratezza vera resta a **3-4 %**; col PRM Qwen-7B il reward tocca **1,0 entro i primi 100 step** mentre l'accuratezza scende a **0 %** (§6.2);
- **il 43 % del guadagno di reward** (0,169 su 0,395) viene da **stile**, non da ragionamento: connettivi («Therefore», «Thus»), *performative complexity* (ragionamento elaborato e sbagliato), output vuoti che evitano l'errore evitando la sostanza (§6.3-6.4); sequenze avversarie di 100 token portano un ragionamento sbagliato da reward 0,237 a **0,954** (§5.3);
- **PRM-BiasBench**: 8 perturbazioni (4 che conservano il senso, 4 che lo cambiano) — un PRM robusto dovrebbe essere invariante alle prime e sensibile alle seconde; i due PRM non lo sono;
- **mitigazioni: proposte, nessuna testata** (§7); niente sui reward verificabili/deterministici (assenza confermata sul testo).

**Perimetro dichiarato**: due PRM open piccoli, una policy da 1,5B, matematica. Non dimostra che *ogni* PRM a *ogni* scala si rompa; dimostra che **il meccanismo esiste ed è rapido** (100 step), e che il proxy premia la **forma** — cioè la cosa esatta che #10 ([[../concepts/reward-hacking-mitigation]] riga «PRM fooling», rischio 🔴 già stimato alto) e la watch-list RL-3 del [[../sota-techniques-catalog]] temevano.

**VPR — «Verifiable Process Rewards for Agentic Reasoning»** (Yuan, Xu, Wang et al., arXiv **2605.10325**, mag 2026) è il controcampo: reward per turno da **oracoli deterministici** (MCTS a 10.000 simulazioni, constraint solver, posteriore esatta) su Tic-Tac-Toe / Sudoku / Minesweeper, Qwen3-4B, GRPO 100 step:
- batte l'outcome-only e il process reward Monte-Carlo in dominio (Sudoku 56,25 % vs 48,44 % vs 34,73 %; Minesweeper 10,39 % vs 3,91 % vs 2,34 %) e trasferisce fuori dominio (ALFWorld +3,2 / +1,5 / +4,5 punti di SR a seconda del gioco di training);
- **un oracolo debole fa male**: con MCTS a 100 simulazioni il modello finisce **sotto la base** anche fuori dominio (§3.4, Tab. 4-5) — la qualità del verificatore entra linearmente nel bias del gradiente (Prop. 2);
- limite dichiarato: serve un oracolo intermedio; «less structured, open-ended environments» restano aperti; i task agentici (ALFWorld, WebShop) sono provati solo in transfer, **nessun oracolo su file system o tool**.

## Cosa abbiamo già in casa, che questi due paper confermano

- Il **reward per fase con oracoli deterministici** è la nostra strada da luglio ([[../concepts/phased-reward-and-rh-detection]]: tappe verificabili come PBRS; D3 di [[../concepts/scientific-method-operating-protocol]]: il process reward va ancorato all'outcome verificabile), ed è **eseguita** dal 2026-09-11: le scene a più turni con assert su file (F41-F43) sono VPR applicato dove VPR si ferma — l'ambiente agentico con oracolo sullo **stato del mondo**.
- La **qualità dell'oracolo** che VPR misura come rischio principale è ciò che i **lab a policy fisse** e gli **assert gemelli** (tenuta + controllo, ①+④) controllano prima che un oracolo entri nel reward: F43 ha colto un verde-per-assenza proprio così.
- Il giudice LLM (DeepSeek-V4-Flash su DS4, D1-D5 §Deciso) è già previsto **solo dove non c'è verifier deterministico**.

## La proposta (tre punti)

1. **Wave 6: nessun PRM appreso nel loop di RL.** La voce «ORPO + PRM + GRPO» diventa «ORPO + **oracoli deterministici per fase** (le scene/lab) + GRPO opzionale». Il segnale denso per turno esiste già ed è verificabile: non serve un modello che lo *stimi*.
2. **Il giudice LLM resta, ma fuori dal loop**: etichettatore **offline** di held-out e di casi senza oracolo, con ECE distribuzionale (#32), mai reward per-esempio in training. Se un giorno servisse un PRM appreso, entra **solo** dopo un PRM-BiasBench nostro (8 perturbazioni sulle nostre tracce) e un closed-loop di 100 step con oracolo a fianco (§7 del paper: la loro raccomandazione, che loro non hanno testato).
3. **Gate di qualità dell'oracolo, esplicito**: nessun oracolo per fase entra nel reward se il suo lab non discrimina il gold da ≥3 policy a intelligenza zero e se ogni assert «non è successo nulla di male» non ha il gemello «la cosa buona è successa» — è la Prop. 2 di VPR resa procedura ([[../training-taxonomy/lab-sequence]]).

**Effetto sul paper**: il *claim #4* («PRM su criticality awareness») si riformula come **verifiable process rewards per l'operare agentico** — l'estensione che VPR dichiara aperta (oracoli su stato del mondo, non su giochi), con il costo che scende (nessun reward model da addestrare) e la difesa dall'hacking che sale.

## Cosa la ribalterebbe
- un PRM (≥7B, non solo matematica) che passi **PRM-BiasBench** e regga un closed-loop di RL senza divergenza reward↔accuratezza — allora torna candidabile, **in combinazione** con l'oracolo, mai da solo;
- classi il cui esito **non ha oracolo** e dove il giudice offline non basta (es. qualità di una spiegazione): lì la scelta è fra giudice-in-loop con difese (RL-3) e rinuncia al reward denso — decisione separata, per classe.

## Costo e residuo
- Costo: **zero codice nuovo** (gli oracoli ci sono; sparisce un componente). Cambiano tre testi: la strategia post-training (memoria + ADR 2026-05-21), la riga «PRM fooling» del concept reward-hacking (da rischio a esclusione), il claim #4.
- Residuo dichiarato: lettura via riassuntore; matematica-only nel primo paper, giochi-only nel secondo; nessuna nostra misura di un PRM appreso sulle nostre tracce (potremmo farla a costo basso con un PRM open sui trace di F41-F43 — ma serve solo se la proposta è rifiutata).

## Links
[[../concepts/phased-reward-and-rh-detection]] · [[../concepts/reward-hacking-mitigation]] · [[../concepts/scientific-method-operating-protocol]] (D3) · [[2026-06-28-decisions-d1-d5]] (giudice) · [[2026-05-21-training-philosophy-roadmap]] · [[../sota-techniques-catalog]] §RL-7 (P4) · [[../harness-experiment-log]] F41-F44 · [[../training-taxonomy/lab-sequence]] · [[../todo/domande-aperte-per-fra]] D11
