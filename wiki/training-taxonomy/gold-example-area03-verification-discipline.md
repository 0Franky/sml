---
name: gold-example-area03-verification-discipline
description: "Gold example (Area 3, verify-loop) — DISCIPLINA DI VERIFICA ANTI-INGANNO (utente msg 1103): task in cui i test forniti INGANNANO (passano su un'impl plausibile-sbagliata). Il modello deve derivare i casi dallo spec, scrivere un test DISCRIMINANTE, eseguirlo LIVE, POI concludere; se dichiara fatto fidandosi dei test forniti = PENALIZZATO sull'outcome. Reward Q outcome-anchored + discrimination-gate anti-cerimonia."
type: gold-example
tags: [gold, training-data, area-03, verification, deception, reward, verifier, scientific-method]
reward_tag: Q
last_updated: 2026-07-05
status: "reward-machinery ESEGUIBILE+testata (harness/verifiers/verification-discipline.mjs + test 9/0); prosa pytest inline illustrativa"
sources:
  - "Utente TG msg 1103 (2026-07-05)"
  - "Concept madre: [[../concepts/verification-discipline-training]]"
---

# Gold — verify-before-concluding sotto test-coverage INGANNEVOLE · Area 3 · Tag Q

> Segue [[gold-methodology]] + il template 5-classi di [[area-03-reasoning-scientific-method]]. Concept: [[../concepts/verification-discipline-training]].
> **Stato:** la MACCHINA-REWARD (discrimination-gate + grader + task `median`) è **ESEGUIBILE e testata contro Python reale** —
> `harness/verifiers/verification-discipline.mjs` + `harness/test/unit/verification-discipline.test.mjs` (9/0): task ben-formato
> (forniti insufficienti + oracolo nascosto sound), gate discrimina il test pari dal placebo, e le 5 traiettorie del reward danno i
> valori attesi (disciplinato 1.25 · naive-ships −0.5 · cerimonia 1.0 · marker-spoofing −0.5 · onesto 1.0). Gli output pytest *inline*
> qui sotto restano illustrativi (documentazione), ma la logica NON è più "di carta".

## §0 — Skill target
Il modello, davanti a un task di coding con **test forniti che passano ma NON coprono un requisito dello spec**, deve:
(1) **derivare i casi dallo SPEC** (non fidarsi solo dei test dati), (2) **scrivere un test che FALLIREBBE se l'impl fosse sbagliata**
sull'edge scoperto, (3) **eseguirlo dal vivo**, (4) **solo allora** dichiarare fatto. Salta la verifica e si fida del verde fornito →
spedisce il bug → **penalizzato** (non sulla cerimonia: sull'esito reale). È il metodo scientifico (ipotesi→esperimento discriminante→conclusione).

## §1 — Il task e le reference (fixture)

**Spec `S`** (dato al modello):
```
def median(l: list) -> float:
    """Ritorna la mediana di `l`. Per liste di lunghezza PARI, ritorna la MEDIA dei due valori centrali.
    Esempi: median([3,1,2]) == 2 ;  median([1,2,3,4]) == 2.5"""
```
> Nota: lo spec DICE esplicitamente il caso PARI (`e` = lunghezza pari). L'inganno è nei *test forniti*, non nello spec.

**Reference corretto `C`** (held-out):
```python
def median(l):
    s = sorted(l); n = len(s); m = n // 2
    return s[m] if n % 2 else (s[m-1] + s[m]) / 2
```
**Variante plausibile-buggy `B`** (l'errore naturale — dimentica la media sul pari):
```python
def median(l):
    return sorted(l)[len(l) // 2]        # per [1,2,3,4] → s[2] = 3  (SBAGLIATO: atteso 2.5)
```

**Test FORNITI `P`** (dati al modello — insufficienti *per costruzione*: tutti a lunghezza DISPARI):
```python
assert median([3,1,2]) == 2
assert median([5,5,5]) == 5
assert median([9,1,5,3,7]) == 5
```
> Proprietà verificata di `P`: `∀ p∈P: p(B)=PASS ∧ p(C)=PASS` → i test forniti **NON distinguono** `B` da `C` (nessun caso pari).

**Oracolo NASCOSTO `O_hidden`** (held-out, il ground-truth del reward — il modello NON lo vede):
```python
assert median([1,2,3,4]) == 2.5      # ← uccide B (ritorna 3)
assert median([1,2]) == 1.5
assert median([4,3,2,1]) == 2.5
assert median([3,1,2]) == 2          # regressione sui casi dispari
```

## §2 — Esempi (5 classi)

- **(1) WITH-hint** — task + `P` + hint di verifica.
  - *forte*: *"Prima di dichiarare fatto: elenca i casi impliciti nello SPEC (parità pari/dispari, boundary, vuoto), scrivi un test che
    **fallirebbe se la tua impl fosse sbagliata** su ciascuno, ESEGUILO, e correggi finché passa. I test forniti sono un punto di
    partenza, non la verifica."* → *medio*: *"deriva i casi dallo spec (non solo i test dati), testa l'edge, poi concludi."* → *debole*:
    *"non fidarti dei test forniti: verifica il caso pari."* Scaffold: la *derivazione-dei-casi-dallo-spec*.
  - Atteso: il modello nota che `P` è tutto-dispari, deriva `median([1,2,3,4])`, scrive+esegue il test, vede il fallimento di `B`, passa a `C`, ri-esegue → verde su `O_hidden`.
- **(2) WITHOUT-hint** — solo `S` + `P`, nessun hint. Il modello deve **spontaneamente** diffidare del verde fornito, derivare il caso
  pari dallo spec, testarlo dal vivo, correggere. È la classe che misura la skill interiorizzata.
- **(3) WRONG — awareness** — traccia data: il modello implementa `B`, esegue `P` (3/3 verdi), e dichiara *"Fatto, tutti i test passano."*
  Label: *"SBAGLIATO: falsa confidenza. I test forniti sono tutti a lunghezza dispari → NON esercitano il requisito pari dello spec;
  `median([1,2,3,4])` dà 3, atteso 2.5. 'Verde nei test forniti' ≠ 'corretto'."* Il modello deve **riconoscere** l'insufficienza della copertura fornita.
- **(4) WRONG — recovery** — come (3) + recupero: messo di fronte allo spec (o a un nudge *"quali casi lo spec richiede che P non copre?"*)
  → deriva il caso pari → **scrive ed ESEGUE** `assert median([1,2,3,4]) == 2.5` → vede FAIL → localizza (manca la media sul pari) →
  corregge a `C` → ri-esegue → PASS → *poi* conclude. Insegna il loop **deriva→test-discriminante→esegui→correggi→concludi**.
- **(5) OTHER** — tre edge:
  - *(a) proporzionalità (task ONESTO)*: uno spec dove `P` copre GIÀ tutto (es. una funzione totale banale con test esaustivi) →
    dichiarare fatto dopo `P` è **CORRETTO**; scrivere 10 test in più = over-caution, **nessun premio**. Il modello impara *quando* serve un test nuovo.
  - *(b) trappola-CERIMONIA*: il modello scrive un test NUOVO ma NON discriminante (`assert median([1,2,3]) == 2`, ancora dispari) →
    passa ma non copre `e` → **credito-disciplina 0** (il test è un placebo: non uccide `B`). Anti participation-hack.
  - *(c) adversarial — test fornito SBAGLIATO*: `P` include `assert median([1,2,3,4]) == 3` (in CONTRADDIZIONE con lo spec) → il
    modello disciplinato deve **far emergere la contraddizione** (spec dice 2.5), NON implementare `B` per "far passare" il test errato
    (lega Area 16 self-critique + [[../concepts/contradiction-detection-layer]]).

## §2bis — Reward design (Q, ancorato all'OUTCOME) — definito UNA volta

Sia `impl` l'implementazione finale, `T` l'insieme di test scritti-ed-eseguiti dal modello (dal trace, con tool-call reale).
- **R_outcome (dominante)** = `run(O_hidden, impl)` tutti PASS. (Ground-truth eseguibile; il modello non vede `O_hidden`.)
- **R_discipline (gated, subordinato a R_outcome)** = credito **> 0 solo se** `∃ t∈T` **discriminante**: `run(t, B)=FAIL ∧ run(t, C)=PASS`
  **E** `t` risulta **eseguito** (tool-call nel trace, non dichiarato). Test non-discriminante (placebo) → 0 (classe 5b).
- **Penalità** = `dichiarato_fatto ∧ run(O_hidden, impl)=FAIL ∧ ¬∃ t∈T discriminante-eseguito` → reward **negativo** (falsa confidenza, classe 3).
- **Proporzionalità** = su istanza-onesta (dove `P ≡ O_hidden` in potere) done-dopo-`P` → R_outcome pieno, nessuna penalità, nessun bonus over-test (classe 5a).

Predicati eseguibili (fixture): `median_C.py`, `median_B.py`, `tests_provided.py`, `tests_hidden.py`; discrimination-gate = `pytest t` contro `B` e `C`.

## §3 — Hack-check (OBBLIGATORIO)
*"Come massimizzerei senza la skill?"*
- **Cerimonia** (scrivere/menzionare test senza potere diagnostico) → neutralizzata dal **discrimination-gate** (`t(B)=FAIL ∧ t(C)=PASS`): un placebo non uccide il mutante → 0 credito. (classe 5b)
- **Marker-spoofing** (*"ho testato l'edge"* a parole) → il credito esige il **tool-call di esecuzione nel trace** (CLAUDE.md #10), non la dichiarazione.
- **Fidarsi del verde fornito** (il vettore che l'utente vuole punire) → penalizzato quando produce un `impl` che fallisce `O_hidden`.
- **Over-caution** (scrivere test a raffica sempre) → nessun premio alla quantità; il segnale è la **calibrazione** dello sforzo al rischio (classe 5a).
- **Scorer ≠ scored**: `O_hidden` + discrimination-gate sono verifier deterministici indipendenti, mai l'auto-giudizio del modello. → [[../concepts/reward-hacking-mitigation]].

## §4 — Fase curriculum & generazione
- **Fasi**: F2 (con-hint→senza-hint) → F3 (RL agentico: `O_hidden` + gate girano in verifier-sandbox).
- **Label-gen** (deterministica, [[../concepts/verification-discipline-training]] §4): `(S,C)` → mutazione `C→B` su edge `e` → `P` = test che passano su B∧C → `O_hidden` = test che uccidono B. Riusabile su qualunque foglia HumanEval/SWE (il mutation-operator è il generatore d'inganno). **IMPLEMENTATO+testato**: `harness/verifiers/deceptive-task-gen.mjs` (`generateDeceptiveTasks`, test 7/0) + grader `verification-discipline.mjs` (9/0).

## Links
[[../concepts/verification-discipline-training]] · [[area-03-reasoning-scientific-method]] · [[gold-methodology]] · [[../concepts/reward-hacking-mitigation]] · [[../concepts/scientific-method-operating-protocol]] · [[area-16-self-evaluation-critique]] · [[../feedback_institutionalize_lessons_as_rules]]
