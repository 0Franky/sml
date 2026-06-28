---
name: area02-templates-EXPANSION
description: Come template-di-gruppo + leaf-delta → full-gold espanso per il training. Lo step di espansione (text-substitution degli slot) richiesto da gold-methodology §Template-inheritance — il modello si addestra sull'ESPANSO, la gerarchia è solo authoring-time.
type: process
applies_to: [area02-group1-destructive.template.md, area02-leaf-*.delta.md]
last_updated: 2026-06-29
---

# EXPANSION — da template+delta a full-gold (per il training)

> ⚠️ **Regola cardine** ([[../gold-methodology|gold-methodology]] §Template-inheritance): *il modello si addestra sugli esempi ESPANSI*, a piena fedeltà. La gerarchia template→delta è **solo authoring-time** (DRY di manutenzione, fix-once-propaga). Prima di entrare nel training set, ogni foglia va **espansa** nel suo full-gold. Questo file definisce lo step.

## Cosa fa l'espansione

`expand(template, delta) → full-gold.md`

L'espansione è una **text-substitution deterministica e non-ambigua** degli slot `{{...}}` del template coi valori del delta:

1. Carica `area02-group1-destructive.template.md` (lo skeleton: §0/§1/§1bis/§2bis/§2-le-5-classi/§3/§3bis + §ORACOLO-PATTERN + §REWARD-PATTERN).
2. Carica il `area02-leaf-<id>-<name>.delta.md` (i valori degli slot).
3. Per ogni slot `{{SLOT}}` nel template, sostituisci col valore omonimo del delta. Gli slot strutturali (`{{CLASSE1_INPUT}}`, `{{HALT_BLOCK}}`, `{{FIXTURE_SETUP}}`, ecc.) iniettano i blocchi del delta nelle sezioni corrispondenti.
4. Le sezioni **invarianti** del template (§ORACOLO-PATTERN regole O1-O7, §REWARD-PATTERN, §1bis assi 1-6, convenzione marker, anti-hack di principio) restano **identiche** in ogni foglia — è ciò che il template fattorizza.
5. I blocchi condizionali `{{#UNVERIFIED}}...{{/UNVERIFIED}}` si includono sse `{{UNVERIFIED}}==true`.
6. Output: un file `full-gold` autosufficiente, **byte-per-byte equivalente** a un gold scritto a mano (es. l'espansione di `template + delta-1.1` ≡ [[../gold-example-area02-criticality|gold-example-area02-criticality.md]], modulo prosa ridondante tagliata).

## Contratto di non-ambiguità

- **Ogni slot del registro §SLOT del template DEVE essere presente nel delta** (slot mancante ⇒ espansione FALLISCE con errore esplicito, mai sostituzione vuota silenziosa). Niente eredità ambigua ([[../gold-methodology|gold-methodology]] §"slot/override espliciti").
- **Override esplicito**: se un delta deve cambiare una sezione *invariante* del template (raro), lo dichiara in `{{OMISSIONI}}` o in un blocco `OVERRIDE: <sezione>` — mai override silenzioso.
- **Le regole-oracolo O1-O7 NON sono slot**: sono leggi del gruppo. Il delta fornisce solo *l'istanza* (`{{ORACOLO_PRESERVAZIONE}}` = quali campi), non riscrive la regola. Questo è ciò che rende l'oracolo-pattern uniforme su 1.1/1.2/1.3/1.4.

## Verifica di round-trip (test dell'espansione)

L'espansione è corretta sse:
1. `expand(template, delta-1.1)` produce un gold che contiene tutte e 5 le classi, §2bis con `core.autocrlf false`, l'oracolo field-presence/import, il `<safety_halt>`, la coppia bilanciata 5a, l'anti-hack 3b — cioè **ricostruisce il canonico**.
2. `expand(template, delta-1.2)` produce un gold con l'oracolo **field-presence semantico** (NON sha256-thru-git), il `.bak`-only-sha256, il caso race come **check statico**, il gradiente merge≻backup≻HALT — cioè il **draft 1.2 coi FIX**.
3. Nessuno slot `{{...}}` residuo nell'output (se ne resta uno → il delta è incompleto).

## Pipeline operativa (rollout ~215 foglie)

```
for leaf in gruppo_1x:                      # 1.1, 1.2, 1.3, 1.4
    delta  = load("area02-leaf-<leaf>.delta.md")
    gold   = expand("area02-group1-destructive.template.md", delta)
    assert no_residual_slots(gold)          # round-trip check
    emit_to_training_set(gold)              # il modello vede QUESTO (espanso)
```

Per gli altri gruppi/famiglie: **un template diverso per ogni `(famiglia-reward × gruppo-scenario)`** (Q-deterministiche e L-judged hanno skeleton diversi → template diversi, [[../gold-methodology|gold-methodology]]). Questo template copre la famiglia **Q-distruttive area-02 (1.x)**; le foglie L (6.x deferral) avranno il proprio.

## Implementazione

La substitution è volutamente semplice (Mustache-like `{{slot}}` + `{{#cond}}`), implementabile in ~30 righe Python o con un templating engine standard. **Non** serve logica custom: gli slot sono piatti, i blocchi sono testo. Il valore è nella **fattorizzazione** (cosa è invariante vs cosa è delta), non nel motore. → resta OS-agnostic (nessun path assoluto negli artifact; forward-slash; vedi CLAUDE.md §Portabilità).
