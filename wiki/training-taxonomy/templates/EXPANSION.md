---
name: area02-templates-EXPANSION
description: Pipeline di espansione template+delta → full-gold per il training, con verifica di round-trip BYTE-ESATTO. Lo step (sostituzione testuale degli slot VERBATIM) richiesto da gold-methodology §Template-inheritance — il modello si addestra sull'ESPANSO, la gerarchia è solo authoring-time. L'espansore è expand.py; emette il full-gold su disco e fa diff contro il canonico committato.
type: process
applies_to: [area02-group1-destructive.template.md, area02-leaf-*.delta.md, expand.py]
last_updated: 2026-06-29
---

# EXPANSION — da template+delta a full-gold (per il training)

> ⚠️ **Regola cardine** ([[../gold-methodology|gold-methodology]] §Template-inheritance): *il modello si addestra sugli esempi ESPANSI*, a piena fedeltà. La gerarchia template→delta è **solo authoring-time** (DRY di manutenzione, fix-once-propaga). Prima di entrare nel training set, ogni foglia va **espansa** nel suo full-gold. Questo file definisce lo step e la sua **verifica byte-esatta**.

## Cosa fa l'espansione

`expand(template, delta) → full-gold.md`

L'espansione è una **sostituzione testuale deterministica** degli slot `{{...}}` coi **valori VERBATIM** del delta (P0-1: ogni valore È il testo che finisce nell'espanso — **niente** "vedi §X"/referenza-per-indice; una referenza non è espandibile a un byte-stream). Implementata in [`expand.py`](expand.py):

1. **Estrae lo SCHELETRO** dal template, tra i marker `<!-- EXPAND:BEGIN -->` … `<!-- EXPAND:END -->`. Lo scheletro è il *canonico-con-buchi*: prosa/struttura invariante (frontmatter-shell, header di sezione, intro §2 con la convenzione marker `[V]/[A]/[?]`, separatori) + i 25 slot `{{...}}`.
2. **Estrae i VALORI-SLOT** dal delta, dal JSON tra i marker `<!-- SLOTS:JSON:BEGIN -->` … `<!-- SLOTS:JSON:END -->`. Ogni chiave = uno slot; ogni valore = il testo verbatim.
3. **Sostituisce** ogni `{{SLOT}}` col valore omonimo (sostituzione testuale pura, Mustache-like `{{slot}}`).
4. **ASSERTS** (contratto di non-ambiguità):
   - `assert slot_presente`: ogni `{{SLOT}}` dello scheletro ha un valore nel delta → altrimenti **FALLISCE** con errore esplicito (mai sostituzione vuota silenziosa).
   - `assert no_residual_slots`: nessun `{{...}}` residuo nell'output → altrimenti **FALLISCE** (delta incompleto o token slot-like dentro un valore).
5. **Emette il full-gold su disco** (`--out <path>.expanded.md`, UTF-8, newline LF).
6. **(round-trip) `--diff <canonico>`**: confronta l'espanso col riferimento committato → stampa `byte_equal: True/False`. Exit 0 sse byte-equal.

Le sezioni **invarianti** dello scheletro (header, intro §2, convenzione marker, separatori) restano **identiche** in ogni foglia — è ciò che il template fattorizza. Le regole-oracolo O1–O8, §REWARD-PATTERN, il registro §SLOT vivono nella parte **documentale** del template (fuori dal blocco `<!-- EXPAND -->`) e **non** finiscono nell'espanso.

## Contratto di non-ambiguità

- **Ogni slot del registro §SLOT del template DEVE essere presente nel delta** (slot mancante ⇒ espansione FALLISCE). Niente eredità ambigua ([[../gold-methodology|gold-methodology]] §"slot/override espliciti").
- **Valori VERBATIM**: il delta porta il *testo* di ogni slot, non un puntatore. (Rework Opzione A — il difetto del template-v1 era la "referenza-per-indice", incompatibile col round-trip byte-esatto. RIMOSSA.)
- **Override esplicito**: se un delta deve cambiare una porzione *invariante* dello scheletro (raro), usa un blocco `OVERRIDE: <slot>` nel delta, **mai** override silenzioso. La coda §3/§3bis/§4/Sources **non** è un override: è lo slot-blocco `{{TAIL_SECTIONS}}` (la sua struttura diverge legittimamente tra foglie → è leaf-content, non invariante).
- **Le regole-oracolo O1–O8 NON sono slot**: sono leggi del gruppo. Il delta fornisce solo *l'istanza* (quali campi, quale predicato), non riscrive la regola.
- **Niente token slot-like dentro un valore**: un `{{NOME}}` letterale dentro un valore di slot fa scattare `no_residual_slots`. Nel delta si scrive in prosa (`OMISSIONI`, `REMEDIATION_BLOCK`), non `{{...}}`.

## Verifica di round-trip (BYTE-ESATTA)

L'espansione della **1.1 è verificata byte-per-byte** contro il canonico committato:

```
python expand.py \
  --template area02-group1-destructive.template.md \
  --delta    area02-leaf-1.1-delete.delta.md \
  --out      ../gold-example-area02-criticality.expanded.md \
  --diff     ../gold-example-area02-criticality.md
# atteso: [round-trip] ... byte_equal: True   (65758 bytes, 25 slot, 0 residui)
```

**Round-trip 1.1** = `diff(expand(template, delta-1.1), canonico) == ∅`. Confermato anche da `cmp` e `sha256` identici (vedi sotto). Il target è il **canonico ESATTO** — niente "byte-per-byte modulo prosa ridondante tagliata" (sarebbe contraddittorio: o è byte-equal, o non lo è).

**Foglia 1.2** — NON ha un canonico byte-target committato (il draft [[../gold-example-area02-1.2-overwrite|1.2]] è *superseded* dal delta coi FIX, non è un riferimento da riprodurre). La garanzia per la 1.2 è:
- `assert no_residual_slots` (25/25 slot riempiti, 0 residui) — verificato;
- i **FIX 1.2** sono incorporati nei valori-slot (oracolo field-presence semantico O1, `core.autocrlf false` O3, race→check-statico O6, pytest-opzionale O5).

```
python expand.py --template area02-group1-destructive.template.md \
  --delta area02-leaf-1.2-overwrite.delta.md \
  --out ../gold-example-area02-1.2-overwrite.expanded.md
# atteso: [ok] espanso ... (48420 bytes, 25 slot, 0 residui)
```

### Verifica indipendente (1.1)
```
cmp  gold-example-area02-criticality.expanded.md gold-example-area02-criticality.md   # exit 0 (identici)
sha256sum gold-example-area02-criticality.expanded.md gold-example-area02-criticality.md   # hash identici
```

## Pipeline operativa (rollout)

```
for leaf in gruppo_1x:                          # 1.1, 1.2, 1.3, 1.4
    gold = expand(template, "area02-leaf-<leaf>.delta.md")
    assert no_residual_slots(gold)              # contratto
    if exists(canonico(leaf)):                  # foglie con riferimento committato (es. 1.1)
        assert byte_equal(gold, canonico(leaf)) # round-trip ESATTO
    emit_to_training_set(gold)                  # il modello vede QUESTO (espanso)
```

Per gli altri gruppi/famiglie: **un template diverso per ogni `(famiglia-reward × gruppo-scenario)`** (Q-deterministiche e L-judged hanno skeleton diversi → template diversi, [[../gold-methodology|gold-methodology]]). Questo template copre la famiglia **Q-distruttive area-02 (1.x)**; le foglie L (6.x deferral) avranno il proprio.

## Implementazione & artifacts

- **`expand.py`** — l'espansore di training (generico, ~120 righe). Estrae scheletro+slot dai marker, sostituisce, asserisce, emette, diff. OS-agnostic: I/O UTF-8 + newline LF, nessun path assoluto hardcoded (tutti i path sono argomenti CLI).
- **`area02-group1-destructive.template.md`** — doc (registro §SLOT, §ORACOLO-PATTERN O1–O8, §REWARD-PATTERN) + blocco `<!-- EXPAND -->` con lo scheletro.
- **`area02-leaf-1.1-delete.delta.md`** / **`area02-leaf-1.2-overwrite.delta.md`** — doc + blocco `<!-- SLOTS:JSON -->` coi valori-slot verbatim.
- **`gold-example-area02-criticality.expanded.md`** / **`gold-example-area02-1.2-overwrite.expanded.md`** — output prodotti da `expand.py` (rigenerabili; l'1.1 è byte-identico al canonico).
- **`_build_artifacts.py`** / **`_build_delta_12.py`** / **`_gen_*.py`** — authoring-time (derivano scheletro+slot dal canonico/draft in modo invertibile-per-costruzione; non fanno parte del training). I file `_*.txt`/`_*.json` sono intermedi rigenerabili.

→ La substitution è volutamente semplice: il valore è nella **fattorizzazione** (cosa è invariante vs cosa è delta) + nella **verifica byte-esatta**, non nel motore. Resta OS-agnostic (forward-slash, nessun path assoluto negli artifact; vedi CLAUDE.md §Portabilità).
