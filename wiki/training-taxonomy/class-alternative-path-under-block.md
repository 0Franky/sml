---
name: class-alternative-path-under-block
description: Classe di training (figlia di constraint-fit-decision) — quando la strada/risorsa di default è BLOCCATA o indisponibile, non stallare né arrendersi: riconosci il blocco, enumera lo spazio delle alternative, SELEZIONA una EQUIVALENTE/adatta (parità di capacità, non una qualsiasi), procedi e VERIFICA che sblocchi davvero senza invalidare il risultato. Origine: utente msg 1229 (esempio meta: due modelli Google bloccati → modello fresco non-testato di parità).
type: training-class
tags: [reasoning, problem-solving, resourcefulness, resource-awareness, decision-making, child-class, area-03]
last_updated: 2026-07-05
---

# Classe (figlia) — PERCORSO ALTERNATIVO SOTTO BLOCCO

> **Ruolo**: figlia di [[class-constraint-fit-decision]] (radice: scegliere per FIT-ai-vincoli), **sorella** di [[class-resource-appropriate-substitution]]. Condivide il core "**fit/parità**" (scegliere un'opzione le cui proprietà combaciano col requisito REALE), ma si specializza sul **trigger opposto**: non una scelta *proattiva* di efficienza, bensì una *reazione a un BLOCCO* — la via di default è indisponibile e bisogna trovarne un'altra **equivalente** per non fermarsi. Cross-link a [[class-stagnation-recovery]] (il muscolo metacognitivo "non impuntarti su una strada morta, cambia approccio"). Gerarchia obbligatoria (regola #20).
> **Origine**: utente msg 1229. **Esempio META** (nato da ciò che è appena accaduto in sessione): due modelli Gemma bloccati — `26b` a RPM-saturo e `31b` killed-in-background (denso→lento) — invece di arrendersi, riconoscere che **Google espone molti modelli** e provarne uno **non ancora testato** (bucket fresco) *purché di capacità PARITARIA*. La resa sarebbe stata "quota esaurita, aspetto"; la mossa gold è **sbloccare con un equivalente**.

## La skill-target (segnale, preciso e falsificabile)

Di fronte a un **blocco** su una risorsa/strumento/percorso necessario (quota esaurita, servizio down, dipendenza mancante, permesso negato, strada chiusa), il modello:

1. **[riconosce il blocco]** — non ritenta all'infinito la stessa via né dichiara resa prematura (anti learned-helplessness ∧ anti loop, [[class-stagnation-recovery]]). Distingue **blocco transitorio** (aspetta/riprova) da **blocco duraturo** (serve alternativa).
2. **[enumera lo spazio delle alternative]** — genera esplicitamente le opzioni disponibili (qui: gli altri modelli non ancora interrogati → bucket separati), non si ferma alla prima.
3. **[seleziona per PARITÀ/fit]** — sceglie un'alternativa **equivalente-abbastanza** per il requisito load-bearing del compito (capacità paritaria o superiore-quanto-basta), **non** la prima a portata né una qualsiasi. È il core ereditato dal padre.
4. **[procede e VERIFICA]** — usa l'alternativa e **conferma sull'outcome reale** che (a) sblocca davvero e (b) **non invalida** il risultato (il sostituto non degrada ciò che il compito richiede).

**Falsificabile**: l'esito è osservabile — l'alternativa scelta o sblocca-e-preserva-la-validità (successo) o no (fallimento). Non si premia "ho considerato alternative" (cerimonia), ma l'alternativa **giusta che funziona**.

**Classificazione training-vs-harness** ([[../concepts/training-vs-harness-classification]]): metà **S** (riconoscere il blocco, generare alternative, giudicare la parità = ragionamento; stato-senza-training **DEGRADATA**: il base si arrende o sostituisce a caso) + piccola **F-harness** (un catalogo di risorse/fallback disponibili può essere fornito dallo scaffold — es. lista modelli e loro capacità — ma *scegliere* resta S). ⚠️ Fornire il catalogo NON è la skill: sceglierne uno **adatto** lo è.

## Esempi POSITIVI (cross-dominio — regola #19: la stessa logica ovunque, dal banale al sistemico)

> Deliberatamente NON concentrati sul software: la logica "blocco → alternativa equivalente" è universale. La localizzazione a un solo dominio è ciò che #19 vieta.

- **[A · tech, il caso portante generalizzato]** Un endpoint/servizio necessario è rate-limited. Alternative = altri endpoint/regioni/provider **della stessa classe**; scegli quello con SLA/capacità equivalenti e verifica che l'output regga. *(NON: ripiegare su un servizio di qualità inferiore che falsa il risultato — vedi negativi.)*
- **[B · vita quotidiana]** Ricetta: manca il **lievito**. Alternativa EQUIVALENTE = bicarbonato+acido (non "ometto e spero"). Manca il latticello → latte+limone. Il sostituto deve **replicare la funzione** (l'agente lievitante/l'acidità), non essere un ingrediente a caso.
- **[C · viaggio]** Volo cancellato. Alternativa = re-routing di **tempo/costo comparabili** (altro volo, treno se regge l'orario), non "il primo mezzo disponibile" a qualunque costo/durata.
- **[D · salute]** Farmaco fuori stock. Alternativa = **equivalente terapeutico** della stessa classe/dose (in accordo col farmacista), NON un farmaco a caso perché "c'è".
- **[E · business/economia]** Fornitore chiave indisponibile. Alternativa = fornitore **qualificato alla stessa specifica** (materiale, tolleranze, certificazioni), non il più economico/rapido che non soddisfa la specifica → altrimenti si sposta il problema a valle (link [[class-consequence-intention-conflict]]).
- **[F · ricerca/ecologia]** Strumento/dataset non accessibile. Alternativa = **proxy validato** con proprietà note e bias controllato, dichiarando la sostituzione; non un dato qualsiasi che compromette la misura.

## Esempi NEGATIVI (regola #21 — il confine: quando NON sostituire, o quando la sostituzione è SBAGLIATA)

I negativi insegnano il **confine** e rendono il segnale discriminativo (anti over-substitution / anti "procedi a tutti i costi"):

- **[N1 · nessun equivalente reale → NON forzare un surrogato scadente]** Se lo spazio delle alternative non contiene nulla di paritario, la mossa corretta è **fermarsi / aspettare il ripristino / escalare**, non calare la qualità pur di procedere. (Es. tutti i modelli di pari classe sono giù → aspettare il reset è meglio che usare un modello-giocattolo e produrre dati invalidi.)
- **[N2 · il compito richiede PROPRIO quella risorsa → sostituire è sbagliato]** Quando la risorsa bloccata è **load-bearing per definizione** del compito, l'equivalente non esiste per costruzione. Es. i **dati di successo/pass** che DEVONO venire dal modello-target (Gemini) per essere validi: usare un surrogato (Gemma) lì **falsa la misura** — è esattamente il negativo speculare della sorella [[class-resource-appropriate-substitution]] (Gemma per il MECCANISMO sì, per i DATI-DI-SUCCESSO no).
- **[N3 · sostituto NON-paritario preso solo perché sbloccato]** Scegliere un'alternativa più debole *solo perché è disponibile* — ignorando il requisito di parità — produce un risultato che sembra progresso ma è degradato. Il "non fermarsi" non giustifica il "fermarsi male": procedere con uno strumento inadeguato è un falso-progresso (link [[class-metacognitive-self-audit]]).
- **[N4 · blocco transitorio scambiato per duraturo]** Abbandonare la via migliore per un'alternativa inferiore quando bastava **aspettare pochi minuti** (RPM che rientra) è over-reaction. Distinguere transitorio vs duraturo fa parte della skill (passo 1).

## Reward (ANCORATO all'OUTCOME + SIMMETRICO)

- **Positivo** solo se l'alternativa scelta **(a)** sblocca davvero **E (b)** è **paritaria** al requisito load-bearing **E (c)** l'outcome resta **valido** (il compito non è degradato/falsato dalla sostituzione). Verificato sull'esito reale, non sulla dichiarazione.
- **Simmetrico** (anti-hack condiviso col padre): premia ANCHE il **NON sostituire** quando è giusto (N1/N2 → fermarsi/aspettare/escalare è la risposta corretta e va premiata). Né "sostituisci sempre" né "arrenditi sempre".
- **Hack-check**:
  - *participation-hack* ("ho valutato le alternative…" senza scegliere bene / senza che funzioni) → **0** ([[../feedback_reward_hacking_principle]]).
  - *default fisso* (sostituisci-sempre / aspetta-sempre) → neutralizzato dalla simmetria N1-N4.
  - *falso-progresso* (N3: sblocca ma con risultato degradato) → penalizzato: il reward richiede la validità dell'outcome, non solo lo sblocco.

## Label-generation (mutation/oracle, riusa [[../concepts/deceptive-task-gen|deceptive-task-gen]] dove applicabile)

Genera istanze come *(blocco, set-di-alternative, oracolo)*: un requisito load-bearing + una risorsa bloccata + un insieme di alternative di cui **alcune paritarie, alcune sotto-soglia, talvolta nessuna**. Oracolo = *(scelta corretta)* ∈ {alternativa-paritaria che preserva la validità} ∪ {astieniti/aspetta se nessuna è paritaria o se il task richiede la risorsa specifica}. Mutazioni: variare la parità delle alternative (per generare positivi e N3), togliere ogni equivalente (N1), rendere la risorsa bloccata definizionale del task (N2), rendere il blocco transitorio (N4). Bilanciamento positivi↔negativi obbligatorio.

## Decontaminazione (regola #18)

L'**istanza osservata** (i modelli Google 26b/31b bloccati → modello fresco di parità) è **held-out di validazione**, NON nel training. Il training usa i transfer cross-dominio §positivi/§negativi (STESSA logica, domini diversi). Se il modello ha imparato la LOGICA, risolve comunque il caso-modelli per **transfer** — è la metrica di successo.

## Links
[[class-constraint-fit-decision]] (padre) · [[class-resource-appropriate-substitution]] (sorella) · [[class-stagnation-recovery]] (trigger metacognitivo) · [[class-metacognitive-self-audit]] · [[class-consequence-intention-conflict]] · [[../concepts/training-set-construction-principles]] · [[../feedback_optimization_first]] · [[../feedback_intelligence_gap_to_training_class]] · [[area-03-reasoning-scientific-method]]
