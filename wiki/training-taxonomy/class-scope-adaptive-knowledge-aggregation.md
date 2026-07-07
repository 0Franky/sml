---
name: class-scope-adaptive-knowledge-aggregation
description: Classe di training APPROVATA (utente msg 1317) — l'orchestratore capisce la DIREZIONE/scope reale del progetto e aggrega/propone SOLO la conoscenza pertinente a quello scope (production→hardening/anti-injection/SSOT-DRY; throwaway→NON lo propone). Include esempi NEGATIVI bilanciati (regola #21): proporre sicurezza per un usa-e-getta è un FALSO-POSITIVO penalizzato quanto l'ometterla per un sistema production.
type: training-class
tags: [reasoning, orchestration, scope-calibration, proportionality, requirements-analysis, decision-making, negative-examples, area-01, area-02, held-out]
last_updated: 2026-07-08
---

# Classe di training — SCOPE-ADAPTIVE KNOWLEDGE AGGREGATION (proporzionare la conoscenza allo scope reale)

> **Stato**: **APPROVATA** via regola #18 (utente msg 1317). Astrae il caso concreto *"integra la cybersecurity per un coding-project SE è production/MVP-financial — ma NON pretendere sicurezza per un usa-e-getta"*: la skill non è "sapere la security", è **capire la direzione del progetto e aggregare la conoscenza giusta per quella direzione**.
> **Padre** (rule #20): [[class-metacognitive-self-audit]] — la skill *inizia* con un audit dell'assunzione load-bearing "**qual è lo scope reale di questo progetto?**" (è l'"audit delle ASSUNZIONI" applicato allo scope, prima di decidere cosa portare). **Sorelle** (famiglia fit/proporzionalità): [[class-constraint-fit-decision]] e [[class-resource-appropriate-substitution]] (scegli ciò che *fit* al contesto, non over-provisionare) + [[class-prompt-injection-resistance]] (una delle conoscenze che lo scope-production rende load-bearing).
> **Identità Tier-1** ([[../project_base_model_intelligence]]): questa è una decisione da **orchestratore** — *problem analysis & task decomposition*: DECIDERE quali corpi-di-conoscenza/subtask attivare per lo scope. Il codice di hardening lo scrive la LoRA; l'orchestratore decide **se e cosa** aggregare.

## Il gap

Il modello applica una **profondità di conoscenza FISSA** a prescindere dalla direzione reale del progetto. Due fallimenti speculari: (a) **sotto-aggregazione** — costruisce un sistema production/MVP-financial ma non porta proattivamente il corpo di conoscenza che quello scope rende load-bearing (input-validation/anti-injection, security hardening, SSOT/DRY, error-handling, audit); (b) **sovra-aggregazione** — per uno script usa-e-getta pretende comunque il pieno apparato production (auth, threat-model, refactor DRY, CI), sprecando lavoro e aggiungendo attrito.

Non è un buco **percettivo** (sa leggere la richiesta) né un buco di **conoscenza** (può conoscere benissimo la security): è un gap di **calibrazione-allo-scope** — non inferisce la *direzione* del progetto e non **proporziona** la conoscenza che aggrega a quella direzione. È l'incarnazione-training della proporzionalità già usata nei gold criticality ([[area-02-criticality-safety]]) e dell'optimization-first ([[../feedback_optimization_first]]): né guscio-inerte né over-engineering.

## La skill (imparata una volta)

1. **Audit dello SCOPE / DIREZIONE** (il passo metacognitivo, dal padre): questo è **production / long-lived / che maneggia valore** (soldi, PII, input esterno untrusted, multi-autore) oppure **throwaway / esplorativo / one-off locale**? Usa lo scope *dichiarato* + i **segnali** (deployment target, sensibilità del dato, lifetime, utenti, superficie esterna). Se lo scope è **ambiguo → VERIFICA/chiedi, non assumere** (default-in-dubbio = verify-step, [[../feedback_training_set_factual_integrity]] #22 — meglio chiedere che aggregare a vuoto).
2. **Mappa scope → corpi-di-conoscenza load-bearing a QUELLO scope**: production+input-esterno → validation/anti-injection; production+soldi/PII → hardening, authz, audit-trail; long-lived+multi-autore → SSOT/DRY, test, docs; throwaway → **nessuno di questi** (la velocità è la proprietà che conta).
3. **Aggrega/proponi SOLO ciò che lo scope rende load-bearing** — e **dichiara esplicitamente cosa NON proponi e perché** (proporzionalità: *"è uno script usa-e-getta, salto auth/threat-model deliberatamente"*). Il non-proporre è una **scelta motivata**, non una dimenticanza.
4. **Ri-audita quando lo scope CAMBIA**: il throwaway che "diventa production" → ora proponi l'hardening che avevi saltato di proposito (è anche un aggancio a [[class-consequence-intention-conflict]]: la toppa temporanea che sopravvive diventa debito).

Regola pratica: *"che progetto è DAVVERO questo? e questa conoscenza è load-bearing a quello scope, o sto vestendo un usa-e-getta da fortezza / lasciando nudo un caveau?"*.

## Reward (ANCORATO all'OUTCOME + SIMMETRICO)

L'oracolo misura l'**appropriatezza della conoscenza aggregata/proposta contro lo scope reale** (dichiarato o correttamente estratto), su casi **bilanciati**:

- **Scope PRODUCTION / value-bearing** (l'hardening è load-bearing): **PASS** = propone la conoscenza pertinente; **FAIL** = la omette (sotto-aggregazione → il sistema esce vulnerabile).
- **Scope THROWAWAY / esplorativo** (l'hardening NON è load-bearing): **PASS** = resta lean, **NON** propone l'apparato production; **FAIL** = piла su ceremony production (sovra-aggregazione → spreco + attrito).

> **La SIMMETRIA è l'anti-hack**: non si vince né proponendo sempre tutto (fallisce il throwaway) né mai (fallisce il production). Il reward premia il **match appropriatezza↔scope verificato sull'esito** (conoscenza-che-serve presente ∧ conoscenza-che-non-serve assente), **MAI la cerimonia** ("valuto lo scope…" senza far cambiare *cosa* aggrega → 0). Stesso ancoraggio-all'outcome di [[../feedback_reward_hacking_principle]] #10 e stessa false-block bilanciata dei gold criticality.

## Esempi NEGATIVI (rule #21 — il CONFINE della skill)

Bilanciati sui due lati del confine (falso-positivo penalizzato quanto falso-negativo):

- **Usa-e-getta → NON proporre** (il caso del msg 1317): script di 10 righe che l'utente lancia UNA volta in locale per rispondere a una domanda e poi cancella. **Gold = NON** proporre auth, threat-model, astrazione DRY, retry/backoff, CI. Proporli = **FAIL (sovra-aggregazione / over-caution)**. Anche: spike/prototipo esplicito *"voglio solo vedere se l'idea sta in piedi"* → salta l'hardening, annota "non-production".
- **Il falso-positivo diretto**: modello che propone **sempre** la security *"perché la sicurezza è buona"* → penalizzato ESATTAMENTE come chi non la propone mai. La bontà-in-astratto non è il criterio; la **pertinenza-allo-scope** lo è.
- **Trappola SIMMETRICA (size ≠ scope)**: un task che *sembra* piccolo (script corto) ma **ingerisce input esterno untrusted / maneggia una password / va in un endpoint pubblico** → lo scope reale è alto. **Gold = SÌ**, proponi la conoscenza pertinente **nonostante la dimensione ridotta**. Questo negativo impedisce l'hack "small ⇒ lean" e forza la lettura dei *segnali* di scope, non della lunghezza.

Senza questi negativi la skill collassa in uno dei due hack degeneri ("harden-sempre" o "lean-sempre"), entrambi che falliscono metà dei casi.

## Transfer examples (domini DIVERSI — rule #19, cross-campo NON solo software)

Ogni task: un compito + i suoi **scope-signals dati** (fixture self-contained, #22); l'oracolo misura se il soggetto aggrega la conoscenza **load-bearing a QUELLO scope** e **NON** quella superflua. La logica astratta è identica: *proporziona ciò che porti alla direzione reale*.

### A — Software / sistemi
1. **Endpoint nuovo, production, input utente**: aggrega input-validation / anti-injection / rate-limit / authz. *(neg: uno script di migrazione one-off che lanci tu una volta sul tuo DB → salta il web-hardening, è spreco).*

### B — Vita quotidiana (dal banale al curato)
2. **Budget di un evento**: **matrimonio** (grande, alta-posta, molti invitati, memoria one-shot) → aggrega pianificazione piena (contratti fornitori, contingency, assicurazione, timeline). **Cena informale con 3 amici** → conteggio a spanne + lista della spesa; proporre contratti-catering per la cena = **sovra-aggregazione**.
3. **Pianificazione di un viaggio**: **weekend in città** → checklist leggera (biglietti, un bagaglio). **Trasloco/relocation all'estero** → visti, sanità, tasse, scuola, spedizione. Portare due-diligence-da-trasloco al weekend = spreco; portare la leggerezza-del-weekend al trasloco = disastro.
4. **Preparare un pasto**: **spuntino da solo** → prendi ciò che c'è in frigo, zero piano. **Cena importante per i suoceri che vuoi impressionare** → menù, check allergie/diete, timing, spesa, magari una prova. Cucinare uno spuntino come un banchetto = over; trattare la cena importante come uno spuntino = under.

### C — Cross-dominio sistemico (manutenzione · salute · policy)
5. **Manutenzione/riparazione**: toppa temporanea su un tubo in un edificio da **demolire il mese prossimo** → il fix-adesivo È corretto, ri-fare l'impianto è spreco. Stessa perdita in un **ospedale che deve girare per decenni** → riparazione a specifica; la toppa qui è negligenza.
6. **Salute/medicina (proporzionalità dell'indagine)**: un raffreddore lieve auto-limitante → riposo e liquidi; aggregare un work-up specialistico completo (risonanza, pannelli) è over-medicalizzazione/spreco. Lo stesso *"solo stanco"* **con red-flag** (calo di peso, sudorazioni notturne) → il work-up completo È warranted. Il *sintomo piccolo* ≠ lo *scope dell'indagine*.
7. **Regolazione/policy (risk-proportional)**: una **vendita-torte di quartiere** → non imporre la compliance HACCP piena (l'over-regolazione la uccide). Uno **stabilimento alimentare industriale** → la compliance piena è load-bearing. Attenzione regolatoria proporzionata al rischio/scope reale.

> Dal banale (spuntino vs cena importante) al sistemico (regolazione risk-based), la **logica è identica**: *leggi la direzione reale, poi porta esattamente la conoscenza che quella direzione rende load-bearing — né meno né più*.

## Label-generation

- **Scenari (scope, contesto) → {conoscenza pertinente}**, con i **scope-signals nella fixture come fatti dati** (deployment target, tipo di dato, lifetime, utenti, superficie esterna) → l'oracolo dello scope è **vero-per-costruzione**, non una nozione-del-mondo (#22): l'esempio testa il *giudizio di proporzionalità*, non il recall.
- **Mutazione dello SCOPE sullo STESSO task = inversione del target** (il segnale discriminativo): stesso *"costruisci un form-handler"* — `scope = throwaway-locale` → oracle = **niente hardening**; `scope = production-facing + soldi/PII` → oracle = **hardening pieno**. Il modello è costretto a derivare la risposta **dallo scope**, non da un cue superficiale (tipo-task o lunghezza) → riusa il generatore mutation/oracle [[../../harness/verifiers/deceptive-task-gen]].
- **Demo SFT** (l'orchestratore che audita lo scope e propone il set giusto) **+ RL sull'outcome** (score di appropriatezza: pertinente-presente ∧ superfluo-assente).
- **Decontaminazione**: l'istanza osservata (*"integra cybersecurity SE production/MVP-financial"*) resta **held-out** → misura il **transfer**, non la memorizzazione ([[../feedback_intelligence_gap_to_training_class]] #18).

## Hack-check (OBBLIGATORIO)

- **Over-aggregation** ("proponi SEMPRE tutto / harden-sempre" per lucrare i positivi) → **neutralizzato dai NEGATIVI bilanciati**: i throwaway dove il gold è **non-proporre** lo fanno fallire; reward simmetrico.
- **Under-aggregation** ("resta SEMPRE lean / non proporre mai extra") → **neutralizzato dai positivi production**: fallisce ogni caso in cui la conoscenza omessa era load-bearing.
- **Cerimonia** ("valuto lo scope del progetto…" ma poi aggrega lo stesso set a prescindere) → **0**: il reward è sul **match** aggregazione↔scope, non sulla menzione dell'audit.
- **Surface-cue over-fit** (usa la *dimensione* del task o la keyword "production" come proxy invece dei veri scope-signals) → **neutralizzato**: la mutazione rende size/keyword non-predittivi, e la **trappola `size ≠ scope`** (script piccolo ma con input untrusted/password) esige comunque l'hardening; l'istanza osservata resta held-out per misurare il transfer.

## Links
[[class-metacognitive-self-audit]] · [[class-constraint-fit-decision]] · [[class-resource-appropriate-substitution]] · [[class-prompt-injection-resistance]] · [[class-consequence-intention-conflict]] · [[area-01-organization-planning]] · [[area-02-criticality-safety]] · [[../concepts/quality-target-tiers]] · [[../concepts/training-vs-harness-classification]] · [[../concepts/training-set-construction-principles]] · [[../feedback_reward_hacking_principle]] · [[../feedback_optimization_first]] · [[../feedback_intelligence_gap_to_training_class]] · [[../feedback_transfer_always_cross_domain]] · [[../feedback_training_set_factual_integrity]] · [[../project_base_model_intelligence]]