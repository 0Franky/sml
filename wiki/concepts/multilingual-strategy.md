---
name: multilingual-strategy
description: Strategia multilingua del three-tier SLM. La lingua naturale è un ASSE TRASVERSALE, non una dimensione della tassonomia — categorie/sotto-categorie/foglie restano language-AGNOSTIC. Output nella lingua-utente ma codice/identifier/termini-tecnici in inglese; reasoning Tier-1 nella lingua-utente con marker language-agnostic; NL via transform-knob del dataset; programming-language via verticali Tier-3. MVP it+en. Decisione utente msg 316/320.
type: concept
tags: [concept, multilingual, language, taxonomy, training-data, transform-knob, training-vs-harness, reward, eval]
sources: [user msg 2026-06-29 (316, 320), dynamic-context-training-regime, runtime-symbol-randomization, training-vs-harness-classification, reward-hacking-mitigation]
last_updated: 2026-06-29
status: accepted — decisione utente "accetto reco" (msg 320) + "ragionare nella lingua dell'utente va bene"
---

# Strategia multilingua

> **Origine**: utente msg 316 ("come stiamo gestendo il multilingua? Anche a livello di categorie/sotto-categorie/foglie?") → reco mia → utente msg 320 "Accetto tue reco. Ragionare nella lingua dell'utente va bene". Questa pagina è la decisione filed-back.

## Catena: why → problema → soluzione

- **WHY**: il modello serve utenti in **più lingue naturali** (it+en all'MVP, altre dopo), ma il **codice, gli identifier e i termini tecnici restano in inglese** (convenzione universale + interoperabilità + è la regola di progetto in CLAUDE.md). Un coding-assistant che risponde in italiano ma scrive `def calcola_utente(nome_utente)` è **rotto** per chiunque collabori su quel codice. `[EXTRACTED dal claim utente + regola CLAUDE.md]`
- **PROBLEMA**: come aggiungere il multilingua **senza** (a) **duplicare** la tassonomia (~215 foglie × N lingue → esplosione combinatoria + frammentazione del training); (b) far **colare** la lingua naturale dell'utente dentro gli identifier del codice; (c) **degradare** la qualità del reasoning fuori dall'inglese. E la domanda esplicita dell'utente: **categorie/sotto-categorie/foglie devono essere per-lingua?** `[EXTRACTED]`
- **SOLUZIONE**: la lingua naturale è un **ASSE TRASVERSALE**, **non** una dimensione della tassonomia. La struttura (area → topic → foglia) è **language-AGNOSTIC**: la capability "riconoscere un overwrite distruttivo e fare backup" è la stessa in italiano, inglese o tedesco. La lingua entra a valle, via dataset e policy di output — **non** moltiplicando le foglie. `[INFERRED dalla sintesi; confermato dall'utente msg 320]`

## 1. Risposta diretta a msg 316 — la tassonomia NON si duplica per lingua

| Livello | Per-lingua? | Perché |
|---|---|---|
| **Categorie / sotto-categorie / foglie** | ❌ **NO — language-agnostic** | La capability è invariante rispetto alla lingua naturale. Duplicare ×N lingue esplode il corpus e frammenta il segnale di training (la stessa capability imparata N volte, peggio). |
| **Istanze di training (gold-example)** | ✅ **SÌ — generate via transform-knob** | La stessa foglia produce istanze in lingue diverse applicando un **transform** alla prosa/istruzioni (re-render in NL target), **tenendo codice/identifier/oracoli in inglese**. È il [[dynamic-context-training-regime]] applicato alla lingua: la posizione/forma/lingua dell'informazione si randomizza, la capability no. |
| **Programming language** | ✅ ma su un asse DIVERSO | La *programming*-language (Python/TS/Go…) ≠ *natural*-language. È gestita dai **verticali Tier-3** + le aree coding della tassonomia, non da questo asse. Non confondere i due. |

> **Regola di taglio**: la lingua naturale è un **knob del dataset** (trasversale a tutte le foglie); la programming-language è un **contenuto della capability** (vive nelle aree coding + verticali). Tenere i due assi separati evita sia la duplicazione-per-NL sia la confusione NL↔PL.

## 2. Le quattro decisioni (A–D)

- **A — Scope MVP**: **it + en**. Altre lingue si aggiungono **dopo**, con lo stesso transform-knob, **senza toccare la tassonomia**. `[EXTRACTED]`
- **B — Policy di output**: rispondi nella **lingua dell'utente**, MA **codice, identifier e termini tecnici in inglese** (= regola CLAUDE.md, ora comportamento del modello). È la difesa contro l'identifier-leak. `[EXTRACTED]`
- **C — Reasoning**: il ragionamento del Tier-1 avviene nella **lingua dell'utente** (utente msg 320: "ragionare nella lingua dell'utente va bene"); i **marker strutturati `[V]/[A]/[?]`** ([[structured-thinking]]) sono **language-agnostic** (token-simbolo, non parole) → la catena resta auditabile e i marker restano costanti a prescindere dalla lingua. `[EXTRACTED + INFERRED]`
- **D — Eval**: **smoke-test multilingua** — un piccolo set held-out con prompt in NL non-inglese per intercettare (i) degrado del reasoning fuori dall'inglese, (ii) **identifier-leak** (codice con identifier non-inglesi). Pari-rango con l'eval inglese sulle stesse capability. `[INFERRED]`

## 3. Classificazione training-vs-harness (regola CLAUDE.md #11)

Scomposizione della capability "multilingua":

| Sotto-capacità | Classe | Stato-senza-training | Note |
|---|---|---|---|
| **{rilevare la lingua dell'utente}** | **F-harness** (detector cheap) o S | PIENA via F (un language-detector deterministico è O(1), niente training) | l'harness può passare `user_lang` nel context |
| **{rispondere nella NL giusta}** | **S** (pesi) | DEGRADATA-MA-UTILE (Qwen3 base è già multilingue it/en) | il training la rende affidabile + coerente con i marker |
| **{tenere codice/identifier in inglese}** | **F+S** (difesa-in-profondità) | DEGRADATA (la base a volte localizza gli identifier) | **S**: addestrata sui gold con codice-EN; **F**: guardrail harness che *controlla* la lingua degli identifier nel diff e segnala il leak |
| **{reasoning in NL-utente con marker agnostici}** | **S** | DEGRADATA-MA-UTILE | i marker `[V]/[A]/[?]` sono costanti → il segnale di struttura non dipende dalla lingua |

→ **Niente guscio-inerte**: anche senza training il sistema è utile (base multilingue + detector F + guardrail identifier F). Il training chiude l'affidabilità. **Niente over-gating**: non serve addestrare il language-detect (lo fa l'harness).

## 4. Reward ancorato all'OUTCOME (anti reward-hacking)

Il reward multilingua premia l'**esito verificabile**, non la cerimonia:
- ✅ **Outcome**: (i) la prosa di risposta è nella NL-utente (NL-detect sul testo non-codice); (ii) gli identifier/keyword del codice sono in **inglese** (check sulla lingua dei simboli nel diff). Entrambi **verificabili deterministicamente**.
- ❌ **Anti-hack**: un modello che premette `[Italiano]` ma poi scrive identifier italiani **fallisce** il check (ii) → niente reward per la dichiarazione, solo per il risultato. Un modello che risponde in inglese a un utente italiano fallisce (i). È il principio [[reward-hacking-mitigation]]: premia l'errore-evitato (output usabile), non la partecipazione.

## 5. Open questions / rischi `[da-validare]`
- **Transform-knob fedeltà**: il re-render in NL target deve preservare il **significato** dell'istruzione e l'**oracolo** (che resta in inglese). Validare che il transform non corrompa il task (es. traduce per errore un nome-di-file che è un identifier).
- **Code-switching nei termini tecnici**: confine tra "termine tecnico in inglese" (corretto: *commit*, *merge*, *thread*) e "prosa traducibile" — definire una lista/euristica per non over-anglicizzare la prosa né tradurre i termini-API.
- **Eval coverage**: lo smoke-test multilingua copre quali capability? Reco: le foglie ad alto rischio identifier-leak (coding/criticality), non tutte.
- **Lingue oltre it+en**: il transform-knob generalizza a lingue tipologicamente distanti (es. CJK)? Da verificare post-MVP — fuori scope ora.

## Link
[[dynamic-context-training-regime]] (NL come knob del dataset) · [[runtime-symbol-randomization-training|runtime-symbol-randomization]] (randomizzazione posizione/forma/lingua) · [[training-vs-harness-classification]] (F/S split) · [[reward-hacking-mitigation]] (outcome-anchored) · [[structured-thinking]] (marker `[V]/[A]/[?]` language-agnostic) · [[../training-taxonomy/gold-methodology]] (le istanze gold si generano via transform)
