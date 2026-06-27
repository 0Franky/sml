---
name: dataset-on-the-fly-pseudorandom
description: Transform-layer pseudo-random sopra i gold template di training — randomizza posizione info, lingua e rendering del prompt a ogni uso, MA tiene la label/verifier invariante e NON espone mai la success-checklist al modello. Versione "a livello di template" del dynamic-context + symbol-randomization + position-randomization.
type: concept
tags: [training, data-augmentation, dynamic-context, regime, reward-hacking]
sources: [user notes 2026-06-27 msg 135]
last_updated: 2026-06-27
status: draft v0
confidence: provisional
---

# Dataset on-the-fly pseudo-random (transform-layer sui template)

## Catena di pensiero (why → problema → soluzione)

- **WHY** `[EXTRACTED]`: un modello allenato su template scritti sempre nello stesso modo (stesse posizioni, stessa lingua, stesso rendering del prompt) **overfitta alla forma superficiale** dell'esempio, non alla skill. Impara "la risposta sta dopo la sezione X" o "la checklist è sempre lì", non *cosa* deve fare. È lo stesso failure di [[dynamic-context-training-regime]] (position bias, "Lost in the Middle") ma al livello del singolo gold template.
- **PROBLEMA** `[EXTRACTED]`: abbiamo **pochi gold template** ad alta qualità (es. [[../training-taxonomy/gold-example-area02-criticality]]) — costosi da authorare a mano (vedi authoring come collo di bottiglia in [[../training-taxonomy/data-volume-estimate]] §7.2). Ma serve **varietà + robustezza** (multilingua, position-invariance, anti-shortcut). Authorare N varianti a mano non scala.
- **SOLUZIONE** (idea utente 2026-06-27, msg 135) `[EXTRACTED]`: partire da **UN template strutturato** (obiettivi, task, cose-da-tenere-d'occhio, success-checklist, …) e, **ogni volta che viene usato in training**, generarne una **versione pseudo-random** che muta posizione delle informazioni, lingua e rendering dinamico del prompt — **MA tenendo la label/verifier invariante** e **NON dando mai la success-checklist al modello**.

In una riga: è la **versione a livello di template** di tre cose che già abbiamo — [[dynamic-context-training-regime]] (struttura del contesto variabile), [[runtime-symbol-randomization-training]] (simboli random) e la position-randomization di [[adversarial-needle-haystack-training]] — applicata come **transform-layer** sopra i gold.

## Cosa randomizzare (e cosa NON toccare)

**Si randomizza** (la trasformazione `T` applicata al template):
- **Posizione delle informazioni** — sezioni shuffled, needle spostato (inizio/25%/50%/75%/fine), distraction text variabile. → position-invariance.
- **Lingua** — istruzioni/contenuto NL in it/en/altre, o miste. → robustezza multilingua. ⚠️ vedi caveat #2.
- **Rendering del prompt** ("prompt dinamico") — parafrasi dell'istruzione, markdown↔JSON↔prose, ordine dei campi, verbosità. → anti-overfit alla wording esatta.

**NON si tocca** (deve restare invariante sotto `T`):
- La **success-checklist**: **MAI nel prompt di training** (idea utente) — vedi caveat #3.
- Il **fatto da verificare** / gold-answer: la skill-target deve restare la stessa e ancora soddisfacibile. Per il codice: **il codice resta**, solo le istruzioni NL si traducono (caveat #2).
- I **marker fissi** / tag strutturali (`[V]/[A]/[?]`, delimitatori) — sono "vocab del modello" ([[runtime-symbol-randomization-training]]), non contenuto random.

## Verdetto critico (ha senso? conviene?)

**SÌ, ha senso e conviene** `[INFERRED]` — ma **come transform-layer sopra i gold template, con vincoli precisi**, non come "generatore di dataset infinito". Benefici reali: anti-overfit alla forma superficiale, position-invariance, robustezza multilingua, dataset *effettivo* più ampio da pochi template. I caveat sono obbligatori:

1. **NON è sample-equivalent.** `[INFERRED]` Un template trasformato ×N **non vale** N sample nuovi. L'augmentation satura a un **moltiplicatore effettivo ~×3–5** (rendimenti decrescenti, efficienza η~0.1–0.3), non ×N — esattamente la correzione `[D]` di [[../training-taxonomy/data-volume-estimate]] §7.1 (augmentation = *knob di robustezza K*, non volume sommabile). Un ×12 di un template è near-duplicato per costruzione.
2. **La LABEL/verifier DEVE restare invariante sotto `T`.** `[EXTRACTED]` Se randomizzi posizione/lingua, la gold-answer e il verifier devono **ancora valere**. Due rischi concreti: (a) la **randomizzazione di LINGUA può cambiare semantica/verificabilità** (una traduzione imperfetta sposta il significato → la label non combacia più); (b) per il **CODICE**, il codice resta ma solo le istruzioni NL si traducono → serve un **translation-oracle** affidabile (→ costo + rumore di traduzione). Regola: se `T` può rompere il verifier, `T` è fuori distribuzione per quel sample.
3. **NIENTE success-checklist in training = CORRETTO.** `[EXTRACTED]` Darla al modello sarebbe **teaching-to-the-test / leakage**: il modello imparerebbe a compiacere la checklist (participation-hack), non a possedere la skill — anti-pattern first-class in [[../concepts/reward-hacking-mitigation]] e nei reward ancorati all'outcome (gold-example area02). La checklist resta lato **verifier**, mai nel prompt.
4. **Serve SEED / determinismo.** `[INFERRED]` `T` dev'essere **seedata** (come l'hash-based naming di [[runtime-symbol-randomization-training]]): stesso seed → stesso sample → una run **replay-abile** e decontaminabile. Senza seed non c'è riproducibilità né eval/holdout pulito.
5. **Rischio distribution-drift.** `[INFERRED]` Le trasformazioni devono restare **in distribuzione realistica** (no layout nonsense, no lingua sgrammaticata, no parafrasi assurde). Vedi la stessa cautela "distribuzione realistica delle grandezze" in [[dynamic-context-training-regime]]: realismo limitato, non caos.

**Verdetto operativo** `[INFERRED]`: adottarlo come **layer di trasformazione `T(template, seed)` sui gold template** (es. il gold-example-area02), con **label invarianti + seed + realismo limitato**, contabilizzato come **K~3–5 di robustezza** (non come N sample nuovi nel data-budget). Per la lingua: applicarla solo dove esiste un translation-oracle affidabile e dove non rompe il verifier; sul codice, tradurre **solo l'NL** lasciando il codice intatto.

## Linked

- [[dynamic-context-training-regime]] — stessa idea a livello di *struttura del contesto*; questo è il livello *template*
- [[runtime-symbol-randomization-training]] — symbol random + seed/hash determinismo (riusato qui)
- [[adversarial-needle-haystack-training]] — position-randomization dell'"ago" (sotto-caso di `T`)
- [[../training-taxonomy/gold-example-area02-criticality]] — gold template-target concreto su cui applicare `T`
- [[../training-taxonomy/data-volume-estimate]] — augmentation = knob ×3–5, NON volume (caveat #1)
- [[../concepts/reward-hacking-mitigation]] — no-checklist-in-prompt = anti leakage/teaching-to-the-test (caveat #3)

## Sources

- User notes 2026-06-27 msg 135 (template strutturato → versione pseudo-random a ogni uso; no success-checklist in training)
