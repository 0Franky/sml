---
name: learned-rules-preview
description: Processo — quando catturo una preferenza/lezione appresa dall'utente, presentarla come PREVIEW (destinazione + severity) per approvazione esplicita PRIMA di committerla nella knowledge-base/regole.
type: concept
tags: [process, meta, rule-institutionalization, decision-provenance, mining-2026-07]
last_updated: 2026-07-10
---

# Learned-rules PREVIEW (approvazione prima del filing)

> **Origine**: mining Stage-2 (#15, 2026-07-10). Raffina il *come* di `CLAUDE.md #17` ("ogni lezione → regola/test/meccanismo") aggiungendo un **gate di approvazione strutturato** prima che una regola-appresa entri nella KB.

## Il processo

Quando dall'interazione emerge una **preferenza/lezione durevole** (l'utente esprime una regola, un gusto, un vincolo, o approva/critica un comportamento):

1. **Cattura** (subito, anti-perdita — [[../feedback_track_everything]]): registro la lezione grezza in un buffer durevole (`wiki/_private/` o memory-draft), MAI solo in chat.
2. **Preview**: la ripresento all'utente come **candidata** con due metadati espliciti:
   - **destinazione**: dove finirebbe (regola CLAUDE.md #N / memory `feedback_*` / wiki concept / classe-training) — così l'utente sa il *peso* (una regola-always-on ≠ una nota-wiki);
   - **severity/scope**: quanto vincolante e su quale ambito (hard-rule sempre-attiva vs preferenza-contestuale vs solo-questo-progetto).
3. **Approvazione esplicita** → solo dopo l'ok **filo** nella destinazione (con provenienza citabile — [[../feedback_decision_provenance]] / CLAUDE.md #26: la ratifica è registrata).
4. Se l'utente raffina/declassa → aggiorno destinazione+severity prima del filing.

## Perché

- **Provenienza** (CLAUDE.md #26): una regola nella KB deve avere un'approvazione **citabile**; il preview la produce esplicitamente (niente regola auto-istituzionalizzata che l'utente non ha ratificato).
- **Peso corretto**: l'utente decide se una lezione merita una regola-always-on (che consuma il budget del manuale-lean) o basta una nota-wiki — evita sia l'inflazione-di-regole sia il sotto-filing.
- **Reversibilità a costo-zero**: correggere destinazione/severity in preview è gratis; correggerlo dopo che ha inquinato la KB costa.

## Confine (quando NON serve il preview)

- Lezioni **operative-di-sessione** (non durevoli) → non vanno in KB, niente preview.
- Quando l'utente **detta esplicitamente** una regola con destinazione chiara ("metti come regola sempre X") → la cattura+filing è diretta (l'approvazione è già nell'istruzione), il preview si riduce a confermare *dove* l'ho messa.

## Links
[[../feedback_decision_provenance]] (CLAUDE.md #26) · [[../feedback_institutionalize_lessons_as_rules]] (CLAUDE.md #17) · [[../feedback_track_everything]] (#12) · [[../feedback_staged_design_workflow]] (gate espliciti) · [[harness-tool-affordance-design]] (altro output del mining)
