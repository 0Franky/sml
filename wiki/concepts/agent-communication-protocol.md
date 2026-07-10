---
name: agent-communication-protocol
description: Protocollo STANDARD di scambio messaggi e report tra agenti orchestrati — il template fisso (RUOLO · OBIETTIVO · INPUT/SCOPE · REGOLE · METODO · CONTRATTO-OUTPUT · BARRA-QUALITÀ) che ogni brief deve avere + il formato-report ancorato-all'evidenza + le variazioni per tipo-agente (esploratore/verificatore-scettico/sintetizzatore/costruttore/ricercatore) + le anti-pattern. Codifica il motivo per cui gli agenti dell'audit sono andati "a colpo sicuro" (utente msg 1604). SSOT di processo per l'orchestrazione multi-agente; INFERRED anche come blueprint del dispatch Tier-1→esperti della three-tier.
type: concept
tags: [process, multi-agent, orchestration, workflow, review-loop, protocol, template, tier-1, ssot]
last_updated: 2026-07-10
---

# Protocollo di comunicazione tra agenti (dispatch + report)

> **Origine**: utente msg 1604 (2026-07-10) — *"aggiungi anche un protocollo di scambio messaggi e report. uno standard che tutti gli agenti devono usare come template + variazioni del caso… sei andato a colpo sicuro su cosa e come cercare, quindi un protocollo standard tra agenti come template ci vorrebbe"*.
> **Perché ora**: negli ultimi workflow (audit del dataset, review-loop delle classi) gli agenti sono andati *a colpo sicuro* non per caso, ma perché a ciascuno ho dato **la stessa struttura precisa**: ruolo + obiettivo + file-da-leggere + regole-da-applicare + schema-di-output + barra-di-qualità. Quella struttura era **ad-hoc** (ricostruita a ogni invocazione). Questo documento la **codifica come standard replicabile** → consistenza, report confrontabili, meno drift, verificabilità. È il pattern-fratello del [[../training-taxonomy/dataset-construction-playbook|playbook]] (SSOT del *cosa* costruire) applicato al *come gli agenti si parlano*.

---

## 1 · Il template di DISPATCH (orchestratore → agente)

Ogni brief a un agente **DEVE** contenere queste 7 sezioni, nell'ordine. Le fisse (1-4, 6-7) sono quasi invarianti; la 5 (METODO) è dove vivono le variazioni per tipo (§4).

| # | Sezione | Contenuto | Perché obbligatoria |
|---|---------|-----------|---------------------|
| 1 | **RUOLO** | Chi sei in una riga (es. *"revisore agnostico severo del dataset"*). | Àncora la postura (scettico? costruttivo? esploratore?). |
| 2 | **OBIETTIVO** | UN solo goal, formulato sull'**OUTCOME** verificabile, non sull'attività. *"Trova le incoerenze REALI tra classi"*, non *"leggi le classi"*. | Anti participation-hack ([[../feedback_reward_hacking_principle|#10]]): l'agente ottimizza ciò che gli chiedi. |
| 3 | **INPUT / SCOPE** | I file/dati ESATTI da leggere (path repo-relative) + i **confini**: cosa NON toccare, dove fermarsi. | Elimina l'ambiguità che porta a "colpo incerto"; previene scope-creep. |
| 4 | **REGOLE / STANDARD** | Le regole di governo pertinenti da applicare (playbook, regole CLAUDE.md rilevanti, convenzioni). Citate, non riassunte a memoria. | Senza, ogni agente re-inventa il criterio → report non-confrontabili. |
| 5 | **METODO** | *Come* procedere. **Varia per tipo** (§4). Per l'esploratore: leggi→applica-regole→enumera. Per il verificatore: ri-deriva in indipendenza→prova a CONFUTARE. | È il cuore che rende l'agente "andare a colpo sicuro". |
| 6 | **CONTRATTO DI OUTPUT** | Lo **schema** del ritorno (§2). Strutturato, con tassonomia-severità, **evidenza obbligatoria** per ogni claim. Se possibile, `schema` JSON forzato (Workflow lo valida al tool-layer). | Report confrontabili + parsabili + verificabili; niente prosa libera. |
| 7 | **BARRA DI QUALITÀ** | Problemi REALI non nitpick · dedup · ranking severità · **evidenza-per-ogni-claim** · default-scettico per i verificatori · **dichiara cosa NON hai coperto**. | Alza il segnale, previene report gonfiati e truncation-silenziosa. |

> **Regola d'oro**: se un brief non ha OBIETTIVO-outcome (2) + SCHEMA-output (6) + EVIDENZA-obbligatoria (7), l'agente **improvviserà** — ed è esattamente il "colpo incerto" che questo protocollo elimina.

---

## 2 · Il formato di REPORT (agente → orchestratore)

Il ritorno di ogni agente è **dati strutturati**, mai un messaggio umano-facing (i subagent lo sanno: il loro testo finale *è* il valore di ritorno). Schema canonico — quello realmente usato nell'audit `wf_6a4a94bf-95e`:

```
{
  summary: string,                    // 1-2 frasi: cosa ho fatto e trovato
  findings: [ {
    id: string,                       // stabile, per referenziarlo in verifica
    title: string,                    // una frase: il difetto
    severity: "P0"|"P1"|"P2"|"nit",   // tassonomia condivisa fissa
    files: ["path:line", ...],        // ANCORAGGIO: dove vive (repo-relative, '/')
    evidence: string,                 // la prova: cosa dice il source / quale tool-call
    why: string,                      // perché è un difetto (quale regola viola)
    fix: string                       // rimedio proposto, azionabile
  } ],
  coverage: string,                   // cosa ho coperto E cosa NON ho coperto (no truncation-silenziosa)
  verdict?: "CONFIRMED"|"PLAUSIBLE"|"REJECTED"  // solo per i verificatori
}
```

**Invarianti del report** (valgono per ogni tipo):
- **Ogni claim porta la sua EVIDENZA** (file:line / tool-call / artefatto). Un finding senza ancoraggio = confabulazione → si scarta. È l'anti-[[../training-taxonomy/class-confabulation-retrieval-failure|confabulazione]] applicata agli agenti + l'ancoraggio-all'outcome ([[../feedback_reward_hacking_principle|#10]]).
- **Severità dalla tassonomia condivisa** (P0/P1/P2/nit), mai scale private → i report di 6 agenti diversi si fondono senza traduzione.
- **`coverage` esplicita il non-coperto** — "non ho auditato le 16 aree" è informazione, il silenzio è un bug (no-silent-caps).
- **Provenienza onesta** (per verificatori/sintetizzatori): se una conclusione viene da inferenza e non da evidenza diretta, dillo (`PLAUSIBLE`, non `CONFIRMED`) — [[../feedback_decision_provenance|#26]].

---

## 3 · Il formato di HANDOFF (agente → agente, quando si concatenano)

Quando un agente passa il testimone a un altro (pipeline finder→verifier→synthesizer, o un builder che consegna a un tester), l'handoff **DEVE** essere self-contained — è la [[../feedback_complete_state_and_caveats_handoff|regola completezza-stato/GIVE-CONTEXT #31]] applicata agente↔agente:

- **FATTO**: cosa ho prodotto (con ancoraggio).
- **DA-FARE**: cosa devi fare tu, esatto.
- **CONTESTO-CHE-TI-SERVE**: i fatti/percorsi/vincoli necessari, riassunti DENTRO l'handoff (l'altro agente non vede la mia sessione — stesso vincolo dell'utente-da-telefono).
- **CAVEAT**: cosa è incerto, cosa NON ho verificato, dove sono i rischi.

> In un Workflow questo è per lo più implicito (il ritorno di stage-N è l'input di stage-N+1). Renderlo **esplicito nello schema** (`handoff: {done, todo, context, caveats}`) serve quando la catena è lunga o il ricevente parte "a freddo".

---

## 4 · Variazioni per tipo di agente (la sezione METODO specializzata)

Il template è UNO; cambia il **METODO (5)** + il **default** + la forma-output. Cinque archetipi coprono quasi tutto:

| Tipo | METODO (5) | Default / postura | Output specifico |
|------|-----------|-------------------|------------------|
| **Esploratore / finder** | leggi lo scope → applica le regole → **enumera in modo esaustivo** dentro il confine. | Esaustività: meglio un P2 in più che un P0 perso. | `findings[]` con evidenza. |
| **Verificatore / scettico** | ri-deriva il finding IN INDIPENDENZA (non fidarti dell'autore) → **prova a CONFUTARLO** → aggiusta la severità. | **`REJECTED` se incerto** (anti falso-positivo). Scorer ≠ scored (mai auto-verifica). | `verdict` + severità corretta + motivo. |
| **Sintetizzatore** | raccogli i report → **dedup** → risolvi le contraddizioni → **ranking** per severità/valore. | Preserva il dissenso (nota la minoranza), non appiattire. | Sintesi prioritizzata + conflitti residui. |
| **Costruttore / builder** | segui la spec + le regole di governo → **auto-check** contro i criteri di accettazione. | **Isolamento** (worktree se muta file in parallelo). | Artefatto + self-check + caveat. |
| **Ricercatore** | multi-fonte (web/doc/codice) → **cita** ogni claim → segna la confidence. | Freschezza + citazione obbligatoria ([[../feedback_training_data_compliance|#29]]). | Findings + citazioni + confidence. |

Ogni agente prende **template §1 + la sua riga di §4**. Le "variazioni del caso" che l'utente chiedeva sono: (a) la scelta dell'archetipo, (b) i campi extra nello schema che quel task richiede (es. un finder di reward-compliance aggiunge `reward_signal_gamed: bool`).

---

## 5 · Anti-pattern (cosa rende scadente un brief o un report)

- **Scope vago** ("guarda il dataset") → l'agente sceglie da sé cosa guardare = copertura casuale.
- **Nessuno schema di output** → prosa libera non-confrontabile, non-parsabile.
- **Nessuna regola di governo** → ogni agente re-inventa il criterio → 6 metri diversi.
- **Nessuna evidenza obbligatoria** → finding plausibili-ma-falsi sopravvivono (l'audit ne ha scartati 10/49 proprio con la verifica adversariale).
- **Auto-verifica** (l'autore giudica sé stesso) → nessuna indipendenza; il verificatore DEVE essere un agente diverso.
- **Truncation silenziosa** (ha guardato metà, non lo dice) → il `coverage` obbligatorio la previene.
- **Severità private** (ognuno la sua scala) → i report non si fondono.

---

## 6 · Composizione con le regole esistenti

- **[[../feedback_reward_hacking_principle|#10 outcome-anchor]]** — OBIETTIVO e reward dell'agente sull'esito verificabile, non sull'attività; evidenza-per-claim = ancoraggio.
- **[[../feedback_track_everything|#12 traccia-tutto]]** + **[[../feedback_complete_state_and_caveats_handoff|#31 GIVE-CONTEXT]]** — l'handoff (§3) è la loro forma agente↔agente.
- **[[../feedback_decision_provenance|#26 decision-provenance]]** — `CONFIRMED` vs `PLAUSIBLE`: non dichiarare certezza senza evidenza.
- **[[../feedback_instrument_before_hypothesizing|strumenta-prima]]** — l'evidenza obbligatoria costringe a guardare il ground-truth prima di asserire.
- **[[../training-taxonomy/dataset-construction-playbook|playbook]] §[PROCESSO] review-loop** — author→reviewer→integrator è la **prima istanza** di questo protocollo (3 agenti, 3 brief §1, schema §2). Questo doc la generalizza. **Iterato fino a DRY** (utente 2026-07-10): si ripete finché il verificatore non torna a **zero findings validati** — loop-until-dry, mai un solo giro ([[../feedback_review_loop_until_dry]]).
  - **⚠️ CAVEAT criterio-di-stop** (utente 2026-07-11): "dry" (zero findings) è raggiungibile solo su oggetti con **ground-truth FINITO** (bug, fatti verificabili — gli artefatti-dataset lo sono). Su oggetti **GENERATIVI** (design, piani sperimentali, strategie) la critica è ricorsivamente raffinabile → non c'è dry, il loop non termina e degenera in gold-plating. Per questi: **loop-until-VoI-negative** con **tier-di-rigore fissato a monte** ("materiale"=cambia una decisione concreta, non "raffinamento valido in astratto"). Classifica l'oggetto PRIMA di scegliere il criterio → [[../feedback_convergence_voi_generative]].

---

## 7 · Relazione col TRAINING (Tier-1 orchestratore) — [INFERRED]

Questo è un artefatto di **processo** (come IO orchestro i subagent). Ma la struttura NON è solo mia: la [[../decisions/2026-06-29-monorepo-itlmv1|three-tier]] ha un **orchestratore Tier-1** che dispaccia a **esperti LoRA** (Tier-2/3). Un orchestratore che emette brief strutturati (RUOLO/OBIETTIVO/SCOPE/CONTRATTO) ai suoi esperti, e li ricompone via report-schema, è **esattamente** ciò che il modello-target dovrà saper fare — è il cuore di **area-08 (tool-use/agentic/cross-expert-handoff)**, che l'[[../dataset-audit-2026-07-10|audit]] segnala come **scoperta**. → questo protocollo è un **candidato-blueprint** per la futura classe di training di orchestrazione multi-esperto (attende ok #18 prima di filarla). Ancoraggio: [INFERRED] (la mappatura processo→training è plausibile, non ancora un ADR).

## Links
[[../training-taxonomy/dataset-construction-playbook]] · [[../dataset-audit-2026-07-10]] · [[compositional-curriculum-thinking-optimization]] · [[../training-taxonomy/class-situational-awareness]] · [[../feedback_complete_state_and_caveats_handoff]] · [[../feedback_reward_hacking_principle]] · [[../training-taxonomy/area-08-tool-use-agentic]]
