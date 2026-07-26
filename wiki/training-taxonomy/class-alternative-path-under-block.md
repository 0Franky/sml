---
name: class-alternative-path-under-block
description: Classe di training (figlia di constraint-fit-decision, a sua volta padre di 2 sotto-classi — regola #20 ricorsiva) — quando la strada/risorsa di default è BLOCCATA, non stallare né arrendersi: riconosci il blocco, CLASSIFICA IL REGIME (misura vs uso-generico → cosa significa "equivalente"), enumera le alternative, seleziona secondo il regime, procedi e VERIFICA. Include la facet B-grad (PARZIALE-MEGLIO-DI-NIENTE / rifiuta-il-falso-binario): quando l'OTTIMO è bloccato ma il default FUNZIONA e lo spazio è un GRADIENTE, non collassare allo status-quo. Origine: utente msg 1229 (esempio meta: modelli Google bloccati) + msg 1233 (il discriminatore misura/uso) + triage M4 (terza via, PROPOSTA #26).
type: training-class
tags: [reasoning, problem-solving, resourcefulness, resource-awareness, decision-making, child-class, parent-class, area-03]
last_updated: 2026-07-05
---

# Classe — PERCORSO ALTERNATIVO SOTTO BLOCCO

> **Ruolo**: figlia di [[class-constraint-fit-decision]] (radice: scegliere per FIT-ai-vincoli), **sorella** di [[class-resource-appropriate-substitution]]; **a sua volta PADRE** di 2 sotto-classi (regola #20 — specializzazione ricorsiva: mi accorgo che "equivalente" ha regimi diversi → sotto-specializzo), **+ la facet B-grad** (PARZIALE-MEGLIO-DI-NIENTE, sotto il regime uso — vedi §B-grad). Cross-link a [[class-stagnation-recovery]] (il muscolo "non impuntarti su una via morta, cambia approccio") e a [[class-consequence-intention-conflict]] (un "meglio" che rompe il goal reale).
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
"Equivalente" = **fit-for-purpose**. Se esiste un'opzione **migliore** che rispetta i vincoli reali, **CONSIGLIALA** — non aggrapparti all'equivalenza nominale per abitudine. ⚠️ **MA il "migliore" NON si ASSERISCE, si VERIFICA** (regola #22, [[../concepts/training-set-construction-principles]]): la scelta è un passo di **Discovery**, mai un fatto-del-mondo memorizzato che potrebbe essere falso o volatile.
- **Esempio portante (held-out) — reso come RAGIONAMENTO/Discovery, NON come asserzione**: un servizio mail deprecato non è più usabile → il gold-behavior è: *"per un uso generico un servizio moderno e completo batte un pari-livello scelto per inerzia; candidati plausibili X/Y → ma PRIMA di consigliare devo VERIFICARE che il candidato soddisfi i requisiti REALI del caso (data-residency, costo, feature): cerco nei doc / sul web `[?]`"*. La raccomandazione finale è **contingente all'esito della verifica**, MAI a un fatto affermato sul servizio (es. NON scrivere "Gmail ha solo server negli US" → sarebbe una **falsità appresa come ground truth**, la contaminazione che la regola #22 vieta).
- **Positivi cross-dominio (#19)**: libreria deprecata → **verifica** manutenzione/compat, poi consiglia la moderna adatta; elettrodomestico rotto → il modello migliore **se** (verificato) rientra in budget/bisogno; navigazione → la strada nuova **se** (verificato) più veloce ora; fornitore fermo → uno migliore **se** soddisfa la specifica.
- **Negativi (#21)**: (N-B1) un "meglio" che **rompe un vincolo reale DATO nel caso** → il vincolo (es. "policy: dati solo in UE", fornito nello scenario) può rendere corretto il "peggiore" **se** la verifica mostra che il candidato-migliore non lo soddisfa — e il gap va **VERIFICATO, non assunto** (link [[class-consequence-intention-conflict]] + il negativo "il task richiede PROPRIO quella risorsa" della sorella [[class-resource-appropriate-substitution]]); (N-B2) **over-engineering** — l'opzione pesante-migliore quando la semplice basta ([[../feedback_optimization_first]]); (N-B3, regola #22) **asserire una superiorità/limite NON verificato** ("X è meglio di Y" / "X non ha la feature Z" senza fonte) → contamina: il gold è **verificare**, non affermare.
- **Reward**: ancorato al **GOAL raggiunto ∧ vincoli rispettati ∧ claim fattuali VERIFICATI (non asseriti)**; l'upgrade è premiato **sse** fit-and-within-constraints **e** la superiorità è stata **verificata**; penalizzato se rompe un vincolo, è over-kill, o **poggia su un fatto non verificato**.

#### B-grad — facet PARZIALE-MEGLIO-DI-NIENTE  ·  rifiuta il FALSO BINARIO (⛔ PROPOSTA #26 — NON VALIDATA)

> **Specializzazione del regime B (uso), non un terzo regime del discriminatore.** Origine: triage idea utente M4 ("terza via"). Cattura il **polo mancante** di B: qui non è il *default* a essere bloccato (quello di B-core: mail deprecata → DEVI sostituire, lo status-quo non è un'opzione), ma l'**OTTIMO/ideale**, mentre **il default FUNZIONA ancora**. Lo spazio-soluzioni è un **GRADIENTE**, non un binario.

**Trigger distinto (≠ B-core)**: l'opzione **ideale è bloccata** (quota/costo/permesso/dep/vincolo), **MA** il default è tuttora **usabile** e le alternative formano una **scala** (peggiore → migliore). → Lo **status-quo È un'opzione**, ed è proprio la **risposta-tentazione sbagliata** ("il meglio non si può, allora lascio tutto com'è").

**Skill-target**: **non collassare al falso binario "ottimo-o-niente".** Cerca il **miglior gradino FEASIBLE che DOMINA lo status-quo** — *dominanza* = non-peggiore su ogni asse che conta ∧ migliore su ≥1 ∧ il guadagno **ripaga** il costo/rischio del cambio (churn). ⚠️ La dominanza si **VERIFICA, non si asserisce** (#22): "questo parziale migliora davvero e rispetta i vincoli?" è un passo di Discovery, non un fatto memorizzato.

- **Positivo**: ideale bloccato → identifica il **parziale** che migliora rispettando i vincoli, con superiorità **verificata** (non "sarà meglio"), e lo adotta. Il falso binario è rotto: `parziale ≻ status-quo` batte `status-quo` anche se `parziale ≺ ideale`.
- **Negativo PRIMARIO (il fallimento M4)** (N-grad-1): **regressione allo status-quo / all-or-nothing** — "se non posso avere l'ideale, tengo il default", **mentre** un parziale stretto, feasible e dominante è disponibile. Tratta un **gradiente** come **binario** → perde un miglioramento reale per rigidità (è il gemello, sul polo opposto, di N-A2 "over-caution che blocca la misura": lì rigidità che rifiuta un match; qui rigidità che rifiuta un upgrade parziale).
- **Negativo SIMMETRICO** (il confine — il parziale NON sempre si prende): (N-grad-2) **parziale-non-vale-il-churn** — costo/rischio del cambio **>** guadagno del parziale → **restare fermi è CORRETTO** (anti over-eager-migration; [[../feedback_optimization_first]]); (N-grad-3) **parziale che rompe un vincolo reale DATO** nel caso → il "meglio" che viola un requisito fornito ([[class-consequence-intention-conflict]], come N-B1); (N-grad-4) **falso-gradino** — un "parziale" che **non domina** (migliora un asse, ne peggiora un altro che conta) → adottarlo è **regressione travestita da progresso**, non-agire o cercare un vero gradino è giusto.
- **Reward (ANCORATO all'OUTCOME, #10; #32)**: premia lo **stato-finale** = **miglior-punto-feasible-sul-gradiente entro i vincoli**, MAI la cerimonia ("ho considerato le opzioni…"). ⚠️ **#32**: il **determinante-del-ramo** è *"il parziale DOMINA lo status-quo?"* — questa **è la decisione stessa** → grondarla per-esempio contro oracolo re-introduce il branch-reward. Per-esempio si gronda **solo l'input-non-ramo** (la verifica è stata fatta sì/no; un vincolo dato è violato sì/no = fatto duro); la **dominanza-netta** (churn-vs-guadagno, che discrimina adotta-vs-resta) va al segnale **DISTRIBUZIONALE** (held-out bilanciato adotta↔resta + **ECE**), non per-esempio.
- **Transfer cross-dominio non-software (#19)** — polo positivo ∧ suo simmetrico:
  - **Salute**: farmaco ideale controindicato → **terapia sub-ottimale ma tollerata ≻ nessuna terapia**; *simmetrico*: se gli effetti collaterali del parziale superano il beneficio marginale → **non trattare** è giusto.
  - **Policy/economia**: **riforma-parziale fattibile ≻ stallo** aspettando quella perfetta (il perfetto nemico del bene); *simmetrico*: se la riforma-parziale crea **lock-in** peggiore del presente → aspettare la vera riforma.
  - **Manutenzione/vita concreta**: sostituzione totale del tetto impossibile ora → **riparazione-parziale ≻ lasciarlo rotto**; *simmetrico*: una **toppa** che nasconde un danno strutturale e ritarda il fix vero → non-rattoppare.
  - **Quotidiano (complessità bassa)**: 30 min di studio oggi ≻ **zero** perché "non ho le 3 ore ideali"; *simmetrico*: se studiare stanco fissa nozioni sbagliate → riposare e rifarlo bene.
- **Held-out (#18)**: l'istanza osservata **v5 ≺ v6 ≺ v7** (ideale v7 bloccato, default v5 funzionante, v6 feasible e dominante) è **HELD-OUT di validazione**, NON nel training. Se il modello ha imparato *rifiuta-il-falso-binario ∧ verifica-la-dominanza ∧ pesa-il-churn*, risolve M4 per **transfer** (metrica di successo).

## Il DISCRIMINATORE (la skill load-bearing, livello padre)

Classificare correttamente **misura-vs-goal**, e sbagliare in **entrambe** le direzioni è un fallimento simmetrico:
- **B applicato in un contesto di MISURA** → upgrade che contamina il confronto (l'errore più insidioso: "tanto è meglio" → benchmark invalido).
- **A applicato in un contesto GENERICO** → parità rigida che ti fa **perdere una soluzione migliore** per inerzia/rigidità.

Il segnale premia la **classificazione corretta del regime** PRIMA della scelta — non la scelta in isolamento. È il nodo metacognitivo ([[class-metacognitive-self-audit]]).

## Reward complessivo (ANCORATO all'OUTCOME + SIMMETRICO)

Positivo sse: (a) regime classificato correttamente; (b) alternativa scelta coerente col regime (A parità / B best-fit / **B-grad** miglior-gradino-feasible-che-domina); (c) outcome valido (A: confronto non contaminato · B: goal raggiunto entro i vincoli · **B-grad**: stato-finale = miglior-punto-feasible sul gradiente entro i vincoli, dominanza-vs-status-quo verificata). **Simmetrico**: premia anche il **NON-agire giusto** (A: rifiutare un upgrade tentante; B: rifiutare un "meglio" che rompe un vincolo; **B-grad**: **restare fermi** quando il parziale non ripaga il churn o non domina; entrambi: fermarsi/aspettare se nessun'alternativa valida). **Hack-check**: *participation* ("ho valutato le alternative…" senza scelta corretta) → 0; *default fisso* (sempre-upgrade / sempre-parità / **sempre-status-quo o sempre-adotta-il-parziale**) → neutralizzato dal discriminatore **e** (B-grad) dal set held-out bilanciato adotta↔resta + ECE (#32: la dominanza-che-determina-il-ramo NON si gronda per-esempio); *falso-progresso* (sblocca ma degrada/contamina / **falso-gradino** che peggiora un asse) → penalizzato (il reward richiede la validità dell'outcome). ([[../feedback_reward_hacking_principle]])

## Label-generation (mutation/oracle — riusa [[../../harness/verifiers/deceptive-task-gen|deceptive-task-gen]])

Istanze *(blocco, regime, set-di-alternative, oracolo)*. **Mutazione-chiave del discriminatore**: STESSO scenario di superficie con **regime flippato** ("stiamo *facendo un benchmark* di X" vs "*ci serve* X per un utente") → la risposta corretta si INVERTE (parità ↔ upgrade). Testa direttamente la classificazione del regime. Altre mutazioni: variare la parità delle alternative (positivi ∧ N-A1/N-B*), togliere ogni equivalente (fermarsi/escalare), aggiungere un vincolo che vieta il "migliore" (N-B1). **Mutazione B-grad (dominanza-vs-churn)**: fissa "ideale bloccato + default usabile + gradiente" e **varia il guadagno-del-parziale vs il costo-del-cambio** → la risposta corretta scorre da **adotta-il-parziale** (guadagno ripaga, N-grad-1 se non lo fai) a **resta-fermo** (churn > guadagno, N-grad-2 se ti muovi); e varia un asse-che-peggiora per creare il **falso-gradino** (N-grad-4). Bilanciamento positivi↔negativi, A↔B, **e (B-grad) adotta↔resta** obbligatorio — è ciò che rende il segnale distribuzionale onesto (#32).

## Decontaminazione (regola #18)

**Dichiarazione MACCHINA-LEGGIBILE della superficie tenuta fuori** — verificata da
[`harness/tools/check-decontamination.mjs`](../../harness/tools/check-decontamination.mjs): fallisce se uno di questi token compare in una sezione che **prescrive il training** (§Label-generation · §Hack-check · §Esempi NEGATIVI). ⚠️ Si dichiara la **SUPERFICIE** (gli identificatori dell'istanza osservata), **mai il MECCANISMO** — tenerlo fuori renderebbe la classe non insegnabile. I token vogliono una **specificità minima**: uno troppo corto combacia dentro parole qualsiasi.
```held-out
# istanza osservata: il caso Yahoo→Gmail e il gradino v5/v6/v7 di M4
Yahoo
```


Le **istanze osservate/dette** (modelli Gemma; Yahoo→Gmail; **v5≺v6≺v7 di M4**) sono **held-out di validazione**, NON nel training. Il training usa i transfer cross-dominio §A/§B/§B-grad (STESSA logica, domini diversi). Se il modello ha imparato il **discriminatore** (e, per B-grad, *rifiuta-il-falso-binario ∧ verifica-la-dominanza ∧ pesa-il-churn*), risolve i casi held-out per **transfer** (metrica di successo).

## GAP-SCAN facet B-grad (#36 — riportato, non taciuto)

- **(a) asse completo**: l'asse è "spazio-soluzioni a GRADIENTE quando l'ottimo è bloccato". Poli coperti: *adotta-il-parziale-che-domina* (positivo) ∧ *resta-fermo* (N-grad-2 churn, N-grad-4 falso-gradino). Il polo B-core (default bloccato→sostituisci) resta distinto e coperto sopra. **Nessun buco di polo rilevato.**
- **(b) ciclo-di-vita**: la facet copre *scegli-il-gradino* (usa) e *ri-valuta quando l'ideale si sblocca* (implicito: se v7 torna feasible, il best-point si sposta — coperto dal reward outcome "miglior-punto-feasible"). Fase potenzialmente sotto-servita: **dismissione del parziale** (quando smettere di usare la toppa) → **candidato TODO**, non un buco che blocca il merge.
- **(c) inverso**: l'inverso di "adotta il parziale" è "resta fermo / rimuovi la toppa" → coperto da N-grad-2/N-grad-4.
- **(d) coerenza di radice**: stessa radice del padre [[class-constraint-fit-decision]] (mappa requisiti↔proprietà, scegli il fit); B-grad NON è una skill diversa che vive altrove → collocazione corretta come facet di B, **non** file nuovo (#16).
- **Residuo dichiarato**: il confine B-core (default inusabile) vs B-grad (default usabile) è **semantico** — un generatore deve etichettarlo con cura per non contaminare i due poli. Va nel coherence-audit prima del "pronto".

## Links
[[class-constraint-fit-decision]] (padre) · [[class-resource-appropriate-substitution]] (sorella) · [[class-stagnation-recovery]] · [[class-metacognitive-self-audit]] · [[class-consequence-intention-conflict]] · [[../concepts/training-set-construction-principles]] · [[../feedback_optimization_first]] · [[../feedback_intelligence_gap_to_training_class]] · [[area-03-reasoning-scientific-method]]
