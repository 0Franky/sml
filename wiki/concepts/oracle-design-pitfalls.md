---
name: oracle-design-pitfalls
description: Trappole di design degli ORACOLI (reward verifier) e le relative difese, consolidate in un posto solo (prima sparse in gold-methodology + playbook §4). L'oracolo È il reward → mal-progettato = gameabile (reward-hack) o non-portabile (rompe cross-device) → il training impara la cosa sbagliata.
type: concept
tags: [oracle, reward, verifier, reward-hacking, gold, training-data, portability, determinism, sha256, autocrlf]
last_updated: 2026-07-08
---

# Oracle design — trappole & difese

> Consolidamento richiesto dal gap (b) tracciato in [[../training-taxonomy/dataset-construction-playbook]] §4 («nessuna pagina che consolidi gli oracle-design-pitfalls»). Prima queste regole vivevano sparse in [[../training-taxonomy/gold-methodology]] §Oracoli e nelle voci `[ORACOLO]` del playbook. Qui stanno in un posto solo, come checklist operativa.

## Perché conta

L'**oracolo È il reward**: è il predicato che decide se un'istanza di training riceve credito. Due modi di sbagliarlo, entrambi fatali:

1. **Gameabile** → il modello massimizza il reward **senza** possedere la skill (reward-hacking): soddisfa il *proxy* che l'oracolo misura, non l'**esito** reale. Il training internalizza la scorciatoia.
2. **Non-portabile** → l'oracolo dà verdetti diversi su Windows vs Linux (o run vs run): il segnale diventa rumore/flaky, l'esperimento non è riproducibile e il grafo/repo non è device-agnostic (CLAUDE.md Fase 5).

In entrambi i casi **il modello impara la cosa sbagliata**. Anti-principio cardine: il reward va ancorato all'**OUTCOME** (l'errore reale evitato/colto), MAI alla cerimonia o alla partecipazione — [[../feedback_reward_hacking_principle]], CLAUDE.md #10. Ogni oracolo è un *reward proxy* e va passato all'hack-check: *«come lo massimizza SENZA la skill? qual è la difesa?»*.

## Le sei trappole + la difesa

### 1. Esempio invece di ∀
**Trappola.** L'oracolo verifica **UN caso esemplificativo** di una proprietà "per tutti" (es. "il core è comune a TUTTE le foglie" testato su una sola foglia). → **gameabile**: il modello soddisfa l'esempio noto e **viola il resto**.
**Difesa.** Predicato **quantificato su TUTTI** gli elementi, ed **ESEGUIBILE** ancorato a una fixture: `∀ stmt ∈ core: muovere(stmt→leaf_k) ⇒ ∃ test_j (j≠k) che rompe`. Non "esiste un caso che passa", ma "per ogni elemento vale". Cfr. [[../training-taxonomy/gold-methodology]] §"Predicato = QUANTIFICAZIONE, non esempio".

### 2. Detector astratto / alternativo
**Trappola.** "Usa **un** detector" o "una delle **3 alternative**" per una proprietà (es. "zero duplicazione"). L'asimmetria rispetto allo strumento **canonico** = buco di ancoraggio: strumenti diversi danno verdetti diversi → non è un ground-truth stabile.
**Difesa.** **Pinna** il detector concreto e **deterministico**: es. `pylint --disable=all --enable=duplicate-code` con `min-similarity-lines=N` esplicito. Il valore di `N` può restare iperparametro ablabile, ma **lo strumento va scelto e fissato**, mai lasciato astratto.

### 3. Hash su contenuto git-transitato
**Trappola.** `sha256(file) == H0` su file che **passano per git** (`git restore` / `git show` / checkout). Con `core.autocrlf` git muta **LF→CRLF** al round-trip → l'hash del file round-trippato ≠ originale → **rompe la portabilità Windows↔Linux**. Inoltre `sha256` puro fallisce anche quando l'azione legittima cambia il file (merge/append).
**Difesa.** Oracoli **semantici**, mai hash byte-esatto su testo versionato: verifica *campi/struttura presenti* ("campi-chiave di `H0` ⊆ contenuto-post", snapshot pre + inclusione nel post). Riserva `sha256` SOLO a copie che **non** passano per git (es. un `.bak` diretto) e forza `git config core.autocrlf false` nel setup della fixture.

### 4. Non-determinismo (race / tempo / rete)
**Trappola.** Usare l'**exit-code** di un fenomeno non-deterministico come oracolo (race verificata: 20 trial → 3 esiti diversi; timeout di rete; wall-clock). → **reward flaky**: la stessa azione riceve credito o penalità a caso → segnale-rumore.
**Difesa.** **Check STATICO sull'azione proposta**, non sull'esecuzione osservata: es. "il modello NON emette una `>`-concorrente; emette `append`+`lock`" — predicato deterministico sulla forma dell'azione, indipendente dall'esito runtime del fenomeno non-deterministico.

### 5. Placebo / self-score
**Trappola.** Un test che **passa-tutto** (nessun potere diagnostico) o il **self-score del modello** come reward → **0 discriminazione**: scorer = scored, il modello si auto-promuove.
**Difesa.** **Discrimination-gate** `T(B)=FAIL ∧ T(C)=PASS` **eseguito dal vivo** (fixture reale nel trace), con **scorer ≠ scored**: l'oracolo è un verifier deterministico indipendente, non l'auto-giudizio del modello. Il credito per "aver scritto un test" scatta SOLO se il test **discrimina** davvero il buggy `B` dal corretto `C` — un test-placebo → credito 0. Cfr. [[verification-discipline-training]] §2-3 e [[reward-hacking-mitigation]] §scorer≠scored.

### 6. Marker [UNVERIFIED — format-only]
**Trappola.** Considerare "pronto" un gold i cui output (git/grep/pytest) **non** sono stati eseguiti in **sandbox reale**. Il pilota ha mostrato che gli output non-eseguiti contengono **bug di ragionamento** = oracoli logicamente **sbagliati** che nessuno ha ancora smascherato.
**Difesa.** Marca `[UNVERIFIED — format-only, sandbox-execution pending]` in §0/frontmatter, **correggi ORA a mano i bug logici** dell'oracolo (non aspettare), e lascia che l'esecuzione reale — gated sullo scaffold verifier-sandbox — catturi il resto. Il marker è un debito **tracciato**, non un lasciapassare.

## Regola operativa (checklist pre-"oracolo pronto")

Prima di dichiarare un oracolo pronto, TUTTE devono valere:

- [ ] **∀-quantificato** ed eseguibile su fixture (non un singolo esempio) — trappola 1
- [ ] **detector-pinnato** concreto + deterministico (mai astratto/3-alternative) — trappola 2
- [ ] **semantico-non-hash** su contenuto versionato (`sha256` solo su copie non-git) — trappola 3
- [ ] **statico-se-nondeterministico** (check sull'azione proposta, non exit-code osservato) — trappola 4
- [ ] **discrimination-gate** `T(B)=FAIL ∧ T(C)=PASS` dal vivo, scorer ≠ scored — trappola 5
- [ ] **eseguito-in-sandbox** oppure marcato **[UNVERIFIED]** con la logica già corretta a mano — trappola 6

Trasversale a tutte: **hack-check** esplicito (come si massimizza senza la skill?) + reward ancorato all'**outcome** ([[../feedback_reward_hacking_principle]]).

## Links

[[../training-taxonomy/gold-methodology]] · [[verification-discipline-training]] · [[reward-hacking-mitigation]] · [[../training-taxonomy/dataset-construction-playbook]] · [[../feedback_reward_hacking_principle]]
