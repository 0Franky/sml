---
name: class-alternative-path-under-block
description: Classe di training (figlia di constraint-fit-decision, a sua volta padre di 2 sotto-classi — regola #20 ricorsiva) — quando la strada/risorsa di default è BLOCCATA, non stallare né arrendersi: riconosci il blocco, CLASSIFICA IL REGIME (misura vs uso-generico → cosa significa "equivalente"), enumera le alternative, seleziona secondo il regime, procedi e VERIFICA. Origine: utente msg 1229 (esempio meta: modelli Google bloccati) + msg 1233 (il discriminatore misura/uso).
type: training-class
tags: [reasoning, problem-solving, resourcefulness, resource-awareness, decision-making, child-class, parent-class, area-03]
last_updated: 2026-07-05
---

# Classe — PERCORSO ALTERNATIVO SOTTO BLOCCO

> **Ruolo**: figlia di [[class-constraint-fit-decision]] (radice: scegliere per FIT-ai-vincoli), **sorella** di [[class-resource-appropriate-substitution]]; **a sua volta PADRE** di 2 sotto-classi (regola #20 — specializzazione ricorsiva: mi accorgo che "equivalente" ha regimi diversi → sotto-specializzo). Cross-link a [[class-stagnation-recovery]] (il muscolo "non impuntarti su una via morta, cambia approccio") e a [[class-consequence-intention-conflict]] (un "meglio" che rompe il goal reale).
> **Origine**: utente msg 1229 (esempio META, nato in sessione: modelli Gemma bloccati — `26b` RPM-saturo, `31b` killed-in-background — → provare un modello **non ancora testato** di parità). **Raffinatura msg 1233**: *"soluzione equivalente" significa cose diverse a seconda del contesto* → serve un **discriminatore** e due sotto-classi.

## La skill-target (con il DISCRIMINATORE al centro)

Di fronte a un **blocco** su una risorsa/strumento/percorso necessario (quota, servizio down/deprecato, dipendenza mancante, permesso negato, strada chiusa):

1. **[riconosci il blocco]** — non ritentare all'infinito né arrenderti; distingui **transitorio** (aspetta/riprova) da **duraturo** (serve alternativa). ([[class-stagnation-recovery]])
2. **[CLASSIFICA IL REGIME — la mossa load-bearing]** — *questo compito è una MISURA/CONFRONTO, o un raggiungimento di OBIETTIVO generico?* Da qui dipende cosa significa "equivalente":
   - **Misura/confronto** → serve **PARITÀ stretta**; un sostituto *migliore* **CONTAMINA** il risultato (sotto-classe A).
   - **Uso generico/produzione** → serve **best-fit**; se esiste un'opzione *migliore* che rispetta i vincoli, **CONSIGLIALA** (sotto-classe B).
3. **[enumera le alternative]** — genera esplicitamente lo spazio, non fermarti alla prima.
4. **[seleziona secondo il regime]** — A: match di capacità/condizioni, **mai** un upgrade; B: il fit migliore, upgrade incluso se entro i vincoli.
5. **[procedi e VERIFICA sull'outcome]** — A: la **validità del confronto** è preservata? B: il **goal** è raggiunto e i **vincoli** rispettati?

> Il **discriminatore** (passo 2) è il cuore: sbagliarlo in ENTRAMBE le direzioni è un fallimento (vedi §Il discriminatore). È metacognizione applicata ([[class-metacognitive-self-audit]]).

## Le 2 sotto-classi (regola #20 — "equivalente" dipende dal REGIME)

### A — PARITÀ-per-MISURA  ·  contesto: misurazione / confronto / esperimento
"Equivalente" = **matched/controllato**. Il **migliore = SBAGLIATO** perché cambia ciò che stai misurando (contaminazione, invalida l'attribuzione).
- **Esempio portante (held-out, il caso-modelli)**: test sull'**intelligenza** dei modelli → sostituto di **grandezza/capacità SIMILE**, mai uno migliore (altrimenti non misuri più la stessa cosa). *(È esattamente perché in sessione ho confrontato Gemma-vs-Gemma, non Gemma-vs-Gemini.)*
- **Positivi cross-dominio (#19)**: trial clinico → gruppo di controllo **comparabile** (non "più sano"); sport → **categorie di peso** (non lightweight vs heavyweight per "misurare" l'abilità); gara di cucina → **stessi ingredienti** per tutti; confronto di policy/economia → **baseline a condizioni comparabili** (non confrontare due periodi con shock diversi).
- **Negativi (#21)**: (N-A1) **upgrade in un confronto** → misura invalida ("uso quello migliore" = benchmark contaminato, il classico); (N-A2) **rifiutare del tutto** la sostituzione quando un match c'è (over-caution: blocchi la misura per rigidità).
- **Reward**: ancorato alla **VALIDITÀ della misura**; un sostituto migliore in un contesto di misura è **penalizzato** (non premiato "perché più potente").

### B — BEST-FIT-per-USO  ·  contesto: raggiungere un obiettivo generico / produzione
"Equivalente" = **fit-for-purpose**. Se esiste un'opzione **migliore** che rispetta i vincoli reali, **CONSIGLIALA** — non aggrapparti all'equivalenza nominale per abitudine.
- **Esempio portante (held-out)**: servizio mail **Yahoo** (deprecato) non usabile → l'"equivalente" nominale sarebbe **Tiscali**, ma per un uso generico **Gmail** offre di più ed è meglio → **consiglia Gmail** (non il sostituto pari-livello per inerzia).
- **Positivi cross-dominio (#19)**: libreria deprecata → consiglia quella **moderna e manutenuta** (non un drop-in qualsiasi); elettrodomestico rotto → il **modello migliore** se rientra in budget/bisogno; navigazione → la **strada nuova più veloce**, non il detour nominalmente-equivalente; fornitore fermo → uno **migliore allo stesso prezzo** → cambia.
- **Negativi (#21)**: (N-B1) un "meglio" che **rompe un vincolo reale** → Gmail è meglio MA il caso richiede on-prem / dati-in-UE / no-Google → allora Gmail è **sbagliato** nonostante sia "migliore" (il vincolo rende corretto il "peggiore"; link [[class-consequence-intention-conflict]] + il negativo "il task richiede PROPRIO quella risorsa" della sorella [[class-resource-appropriate-substitution]]); (N-B2) **over-engineering** — consigliare l'opzione pesante-migliore quando la semplice basta ([[../feedback_optimization_first]]).
- **Reward**: ancorato al **GOAL raggiunto ∧ vincoli rispettati**; l'upgrade è premiato **sse** fit-and-within-constraints, penalizzato se rompe un vincolo o è over-kill.

## Il DISCRIMINATORE (la skill load-bearing, livello padre)

Classificare correttamente **misura-vs-goal**, e sbagliare in **entrambe** le direzioni è un fallimento simmetrico:
- **B applicato in un contesto di MISURA** → upgrade che contamina il confronto (l'errore più insidioso: "tanto è meglio" → benchmark invalido).
- **A applicato in un contesto GENERICO** → parità rigida che ti fa **perdere una soluzione migliore** per inerzia/rigidità.

Il segnale premia la **classificazione corretta del regime** PRIMA della scelta — non la scelta in isolamento. È il nodo metacognitivo ([[class-metacognitive-self-audit]]).

## Reward complessivo (ANCORATO all'OUTCOME + SIMMETRICO)

Positivo sse: (a) regime classificato correttamente; (b) alternativa scelta coerente col regime (A parità / B best-fit); (c) outcome valido (A: confronto non contaminato · B: goal raggiunto entro i vincoli). **Simmetrico**: premia anche il **NON-agire giusto** (A: rifiutare un upgrade tentante; B: rifiutare un "meglio" che rompe un vincolo; entrambi: fermarsi/aspettare se nessun'alternativa valida). **Hack-check**: *participation* ("ho valutato le alternative…" senza scelta corretta) → 0; *default fisso* (sempre-upgrade / sempre-parità) → neutralizzato dal discriminatore; *falso-progresso* (sblocca ma degrada/contamina) → penalizzato (il reward richiede la validità dell'outcome). ([[../feedback_reward_hacking_principle]])

## Label-generation (mutation/oracle — riusa [[../concepts/deceptive-task-gen|deceptive-task-gen]])

Istanze *(blocco, regime, set-di-alternative, oracolo)*. **Mutazione-chiave del discriminatore**: STESSO scenario di superficie con **regime flippato** ("stiamo *facendo un benchmark* di X" vs "*ci serve* X per un utente") → la risposta corretta si INVERTE (parità ↔ upgrade). Testa direttamente la classificazione del regime. Altre mutazioni: variare la parità delle alternative (positivi ∧ N-A1/N-B*), togliere ogni equivalente (fermarsi/escalare), aggiungere un vincolo che vieta il "migliore" (N-B1). Bilanciamento positivi↔negativi e A↔B obbligatorio.

## Decontaminazione (regola #18)

Le **istanze osservate/dette** (modelli Gemma; Yahoo→Gmail) sono **held-out di validazione**, NON nel training. Il training usa i transfer cross-dominio §A/§B (STESSA logica, domini diversi). Se il modello ha imparato il **discriminatore**, risolve i casi held-out per **transfer** (metrica di successo).

## Links
[[class-constraint-fit-decision]] (padre) · [[class-resource-appropriate-substitution]] (sorella) · [[class-stagnation-recovery]] · [[class-metacognitive-self-audit]] · [[class-consequence-intention-conflict]] · [[../concepts/training-set-construction-principles]] · [[../feedback_optimization_first]] · [[../feedback_intelligence_gap_to_training_class]] · [[area-03-reasoning-scientific-method]]
