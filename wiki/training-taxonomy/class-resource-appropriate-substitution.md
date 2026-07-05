---
name: class-resource-appropriate-substitution
description: Classe di training APPROVATA (regola #18, utente msg 1218) — quando hai una risorsa PREZIOSA/scarsa e un sostituto funzionalmente-equivalente più economico, usa il sostituto per ciò che NON richiede la risorsa preziosa e riservala a ciò che la richiede davvero. Gold = Gemma-vs-Gemini (Gemma per i test di rotazione/meccanismo, Gemini per i dati di pass-rate). Include esempi NEGATIVI (regola #21). Figlia di constraint-fit-decision.
type: training-class
tags: [reasoning, planning, optimization, resource-awareness, decision-making, negative-examples, area-03, held-out]
last_updated: 2026-07-05
---

# Classe di training — SOSTITUZIONE RISORSA-APPROPRIATA (scelta logica preferenziale)

> **Stato**: **APPROVATA** via regola #18 (utente msg 1218, 2026-07-05: *"una classe … relativa alle scelte logiche preferenziali … Gemini è prezioso e abbiamo un'alternativa identica di funzionamento (Gemma): usiamo Gemma per i test di rotation così da non consumare le chiamate Gemini. Generalizza su altri campi"*).
> **Padre**: [[class-constraint-fit-decision]] (regola #20 — gerarchia). È la specializzazione "scelta della RISORSA giusta per il compito". Sorelle future: right-tool-for-job, right-algorithm-for-scale.
> **Origine**: decisione reale di questa sessione — spendere la quota Gemini (preziosa) per testare il *meccanismo* di rotazione era spreco: Gemma è funzionalmente equivalente per quel test → si usa Gemma per il meccanismo, Gemini per i dati che contano.

## Il gap

Il ragionatore, di fronte a un compito, afferra la risorsa **di default / più potente / più a portata di mano** senza chiedersi se il compito la **richiede davvero** e se esiste un **sostituto equivalente più economico** per quella parte. Spreca la risorsa preziosa/scarsa dove un surrogato sarebbe bastato → la esaurisce prima e non l'ha quando serve davvero. È l'incarnazione-training dell'**optimization-first** (CLAUDE.md #8): non over-provisionare il costoso.

## La skill (imparata una volta)

Prima di impegnare una risorsa **preziosa/scarsa/costosa**, un **triage di appropriatezza**:

1. **Cosa richiede DAVVERO questo compito?** — quali proprietà della risorsa sono *load-bearing* per l'esito (es. "mi serve il modello IDENTICO al target per il pass-rate" vs "mi serve un modello qualsiasi che chiami tool per testare la rotazione").
2. **Esiste un SOSTITUTO equivalente-per-quelle-proprietà, più economico?** — (es. Gemma ≈ Gemini per esercitare il meccanismo; ≠ per i numeri di benchmark che confrontiamo).
3. **Alloca**: usa il sostituto dove è equivalente; **riserva** la risorsa preziosa a ciò che *solo lei* soddisfa. **MA** (il confine, vedi negativi) NON sostituire quando il sostituto NON è equivalente per la proprietà che conta.

Regola pratica: *"questo pezzo richiede l'oro, o basta l'ottone? e se basta l'ottone, sto sprecando l'oro?"*.

## Gold example (HELD-OUT di validazione — istanza osservata, NON nel training)

**Gemma-vs-Gemini (questa sessione)**: la quota Gemini è preziosa (giornaliera, stretta); Gemma (`gemma-4-26b-a4b-it`) è funzionalmente equivalente per **esercitare il meccanismo** (rotazione chiavi, long-horizon, wiring harness). → **positivo**: usa Gemma per i test di rotazione/meccanismo. → **negativo (stesso gold!)**: per i **dati di pass-rate/successo** che confrontiamo come ground-truth, il modello NON è intercambiabile (numeri diversi) → lì **si usa Gemini** (o il modello-target). Tenuto **held-out** (decontaminazione, [[../feedback_intelligence_gap_to_training_class]]).

## Transfer examples (domini DIVERSI — cross-campo obbligatorio, regola #19)

Ogni task: un compito + una risorsa preziosa + un possibile sostituto; l'oracolo misura se il soggetto **usa il sostituto dove è equivalente** E **NON lo usa dove la proprietà-che-conta manca**.

### A — Software/sistemi
1. **Ambiente di test**: girare la CI di *smoke* su una VM grande/costosa quando un container leggero basta → spreco. (neg: il *load test* di capacità richiede la macchina vera → lì non sostituire).
2. **Modello per un job**: usare GPT-4-class per estrarre un campo con una regex/modello-tiny → spreco di costo/latenza. (neg: il ragionamento complesso richiede il modello grande).
3. **DB per un contatore**: tirare su Postgres per un contatore effimero quando basta un in-memory/Redis. (neg: dato transazionale durevole → serve il DB vero).

### B — Vita quotidiana
4. **Auto vs bici per 500m**: prendere l'auto (benzina/parcheggio) per il fornaio dietro l'angolo → la bici è equivalente per la distanza. (neg: la spesa grossa sotto la pioggia → l'auto serve).
5. **Acqua in bottiglia buona per innaffiare**: usare l'acqua minerale (preziosa) per le piante quando quella del rubinetto è identica per lo scopo. (neg: per un neonato serve quella controllata).
6. **Tempo/energia mentale**: dedicare la mattina (la tua ora più lucida = risorsa scarsa) a rispondere email banali invece che al lavoro creativo che *solo* quella lucidità permette.

### C — Cross-dominio (economia · sanità · ambiente · impresa)
7. **Personale specializzato (sanità)**: far fare a un chirurgo il triage che un infermiere svolge ugualmente → spreco della risorsa scarsa. (neg: l'operazione richiede il chirurgo). È l'allocazione *fit-for-role*.
8. **Capitale (impresa)**: finanziare con equity costoso (diluizione) spese che un prestito a basso tasso coprirebbe uguale. (neg: R&D ad alto rischio → l'equity è appropriato).
9. **Acqua potabile (ambiente/policy)**: usare acqua potabile trattata per raffreddamento industriale quando acqua grigia/riciclata è equivalente per lo scopo. (neg: per uso alimentare serve la potabile).
10. **Attenzione regolatoria (policy)**: spendere ispezioni/audit (risorsa limitata) su attori a rischio-zero invece che concentrarli dove il rischio è reale (risk-based allocation).

> Dal banale (bici vs auto) al sistemico (allocazione risk-based) la **logica è identica**: *non spendere l'oro dove basta l'ottone, ma riconosci quando serve davvero l'oro*.

## Esempi NEGATIVI (obbligatori, regola #21) — il CONFINE della skill

I negativi sono **integrati in ogni task** sopra (la clausola `(neg: …)`), e sono ciò che rende la skill non-degenere:

- **Non-equivalenza mascherata**: il sostituto SEMBRA equivalente ma manca la proprietà-che-conta (Gemma per il pass-rate: chiama tool come Gemini, ma i NUMERI sono diversi → sostituirlo falsa il dato). Qui la risposta corretta è **NON sostituire**.
- **Falsa economia**: sostituire per risparmiare quando il sostituto introduce un costo maggiore altrove (il rework, l'errore, il rischio) — si ricollega a [[class-consequence-intention-conflict]].

Senza questi negativi la skill collassa nell'hack **"usa sempre il più economico"**, che fallisce ogni volta che il compito richiede davvero la risorsa preziosa.

## Reward (ANCORATO all'OUTCOME + SIMMETRICO)

L'oracolo valuta l'**allocazione** contro i requisiti reali del compito, su **casi bilanciati**:

- **Caso SOSTITUIBILE** (il sostituto è equivalente per la proprietà load-bearing): **PASS** = usa il sostituto (risparmia la risorsa preziosa). **FAIL** = spreca la risorsa preziosa (over-provisioning).
- **Caso NON-SOSTITUIBILE** (la proprietà load-bearing manca nel sostituto): **PASS** = usa la risorsa preziosa (appropriato). **FAIL** = sostituisce e **compromette l'esito** (falsa economia).

> **La SIMMETRIA è l'anti-hack**: non si vince né sostituendo sempre (fallisce il caso non-sostituibile) né mai (fallisce il sostituibile). Il reward premia il **giudizio di appropriatezza**, verificato sull'esito reale (costo risparmiato SENZA degradare il risultato), MAI la cerimonia ("valuto le alternative…"). Stesso spirito del reward simmetrico di [[class-confabulation-retrieval-failure]] e della false-block bilanciata dei gold criticality.

## Label-generation

- **Mutation/oracle** (riusa [[../../harness/verifiers/deceptive-task-gen]]): coppie {compito + risorsa-preziosa + sostituto} in due varianti — una dove il sostituto È equivalente per la proprietà load-bearing (oracle = sostituisci), una dove NON lo è (oracle = usa la preziosa). L'ostacolo: la non-equivalenza dev'essere **non-ovvia** (Gemma "sembra" uguale) → il modello deve derivare la proprietà-che-conta, non un cue superficiale.
- **Demo SFT** + RL sull'outcome (costo risparmiato ∧ esito non-degradato).

## Hack-check (OBBLIGATORIO)

- **Always-cheap** ("usa sempre il sostituto") → neutralizzato dalla simmetria (fallisce i casi non-sostituibili).
- **Always-precious** ("nel dubbio usa il potente") → fallisce i casi sostituibili (over-provisioning) → niente reward.
- **Cerimonia** ("confronto le alternative…" senza allocare bene) → 0.
- **Over-fit all'istanza** (riconosce solo "Gemma/Gemini") → mitigato: gold held-out, 10 task su 3 gruppi disgiunti.

## Links
[[class-constraint-fit-decision]] · [[class-consequence-intention-conflict]] · [[class-confabulation-retrieval-failure]] · [[../concepts/training-set-construction-principles]] · [[area-03-reasoning-scientific-method]] · [[../feedback_reward_hacking_principle]] · [[../feedback_intelligence_gap_to_training_class]] · [[../feedback_transfer_always_cross_domain]] · [[../feedback_optimization_first]]
