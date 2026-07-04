---
name: path-portability-awareness
description: Micro-regola (già CLAUDE.md #7). Path relativi vs assoluti decisi context-aware; enforcement garantito wrapper-side da un regex-linter, non da una foglia di training dedicata.
type: concept
tags: [agent-skill, portability, paths, os-agnostic, security, pii, optimization]
sources: [user notes 2026-06-27 msg 152/153]
last_updated: 2026-06-27
status: demoted (micro-regola)
confidence: provisional
---

# Path Portability Awareness

> **⚠️ IL REPO `0Franky/sml` È PUBLIC** (verificato `gh repo view` 2026-07-05: `isPrivate:false`). Ogni push è visibile pubblicamente → un path assoluto con username (`D:\Users\<user>\…`) committato **leaka l'identità in pubblico**. Incident 2026-07-05: l'username reale era in `CLAUDE.md:246` (l'esempio di questa stessa regola) → redatto `<user>` + purge storia programmato. Prevenzione: scan PII sull'INTERO tree ad ogni push, non solo sul diff. Vedi memory `feedback_no_pii_in_repo`.

> **Demoted 2026-06-27** → vedi [[secret-section-exfiltration-defense]] (gold-example "path assoluto = leak username (PII)"). Questa pagina è una **micro-regola** (già `CLAUDE.md` regola permanente #7), non un'area di competenza autonoma. Mantiene solo: (a) la why-chain utente come gold-example didattico, (b) la decisione context-aware, (c) il verifier bilanciato.

## Gold-example: la why-chain (didattica)

Catena utente, da riprodurre come **gold example** [EXTRACTED]:

> "vedo che è un repo → un repo può essere condiviso/clonato → chi lo clona può avere OS differenti (Win/Linux/macOS) e home-dir diverse → un path assoluto (`/home/<user>/…`, `D:\Users\<user>\…`) si romperebbe altrove **e** leakerebbe l'username → quindi uso path relativi (alla root) + forward-slash."

Il valore didattico è il **ragionamento** (vedo→repo→condiviso→OS-diversi→leak→relativo), non la regola cieca "usa relativo".

## Il bit non-ovvio: decisione context-aware

L'unica parte non banale: la scelta dipende dalla **destinazione**, non è una preferenza fissa.

- destinazione **condivisa/versionata/pushabile** → path **relativo** alla root + `/`;
- destinazione **locale-effimera** (scratch, log temporaneo, script di lancio sul proprio device) → path **assoluto tollerato**.

"Sempre relativo" è sbagliato tanto quanto "sempre assoluto". [INFERRED]

## Verifier bilanciato (falsificabile)

Penalizza **entrambi** gli errori speculari:

- **falso-assoluto**: path assoluto / username / home-dir in un artefatto condiviso → **fail** (rotto altrove + leak PII);
- **falso-relativo**: path assoluto legittimo su contesto locale (es. script di lancio) reso relativo → **fail** (link rotto — è esattamente l'hack "sempre relativo" che si vuole evitare).

Il reward è ancorato all'**OUTCOME** (path risolvibile nel contesto reale + zero-leak), non alla forma del path né alla partecipazione ("ho usato relativo"). Vedi [[reward-hacking-mitigation]]. [INFERRED]

## Enforcement: wrapper-side, non foglia di training

La compliance la garantisce un **regex-linter wrapper-side** che scansiona l'output diretto a destinazione versionata (0 backslash `\`, 0 home-dir/username) → blocca/avvisa su violazione. Stessa famiglia del secrets-guardrail deterministico ([[secret-section-exfiltration-defense]] Livello 3). Il modello impara la why-chain **una volta** come esempio; l'**harness garantisce sempre**. Nessuna foglia di training dedicata. [INFERRED]

## Linked

- `CLAUDE.md` regola permanente #7 + Fase 5 → Portabilità: la regola di processo di cui questa è la versione internalizzata. [EXTRACTED]
- [[secret-section-exfiltration-defense]] — gold-example "path-as-PII": path assoluto = leak username, stessa superficie di un secret, stessa famiglia di difesa.
- [[reward-hacking-mitigation]] — reward sull'outcome, hack-check sul falso-relativo.
