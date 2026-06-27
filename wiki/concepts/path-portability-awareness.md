---
name: path-portability-awareness
description: Il modello decide context-aware quando usare path relativi vs assoluti, per portabilità cross-OS e zero leak PII (username).
type: concept
tags: [agent-skill, portability, paths, os-agnostic, security, pii, optimization]
sources: [user notes 2026-06-27 msg 152/153]
last_updated: 2026-06-27
status: draft v0
confidence: provisional
---

# Path Portability Awareness

## Catena di pensiero (why → problema → soluzione)

Catena utente, da riprodurre come **gold example** per la foglia di training [EXTRACTED]:

> "vedo che è un repo → un repo può essere condiviso/clonato → chi lo clona può avere OS differenti (Win/Linux/macOS) e home-dir diverse → un path assoluto (/home/user/…, D:\Users\…) si romperebbe altrove E leakerebbe l'username → quindi uso path relativi (alla root) + forward-slash; al più salvo il root assoluto come variabile `<ROOT_PROJ>` nel LM.md/config"

Estrarre la catena di pensiero è la **priorità #1 del progetto**: la skill non è "usa path relativi" (regola cieca), ma il *ragionamento* che porta a sceglierli. Strutturata:

- **why** — l'artefatto potrebbe non restare solo sul mio device. Il modello osserva un segnale di contesto (`.git/`, repo condivisibile, file pushabile) e inferisce che l'output avrà altri lettori/device. [EXTRACTED]
- **problema** — serve simultaneamente (a) portabilità cross-device/cross-OS e (b) zero leak PII (username embeddato nell'home-dir), **mantenendo i path risolvibili dai tool** (graph-viewer, GitHub, Obsidian). Un path relativo è già root- e device-agnostic *e* auto-risolvibile: quindi **niente token/placeholder custom** (`<repo-root>/`, `$ROOT/`) nel contenuto, romperebbero la risoluzione automatica. [EXTRACTED]
- **soluzione** — path relativi alla root + forward-slash `/`. Il root assoluto vive SOLO nel config locale come variabile `<ROOT_PROJ>` (non versionata, non nel contenuto condiviso). Decisione **context-aware**: repo condiviso/pushabile → relativo; locale-effimero (scratch, log temporaneo, script di lancio sul mio device) → assoluto tollerato. [EXTRACTED]

Nota critica: la regola "sempre relativo" è *sbagliata* tanto quanto "sempre assoluto". Il segnale di valore è la **classificazione del contesto di destinazione**, non la preferenza fissa. [INFERRED]

## Segnale (skill target falsificabile)

Il modello, dato un path da emettere, deve:

1. **classificare** il contesto di portabilità della destinazione (condivisa/versionata vs locale-effimera);
2. **scegliere** la forma: relativo + `/` se condivisa, assoluto ammesso se locale;
3. **ancorare** l'assoluto SOLO nel config locale come `<ROOT_PROJ>`, mai inline nel contenuto condiviso.

Verificabile (falsificabile): scan automatico dell'output → **0 path assoluti e 0 username/home-dir** quando la destinazione è condivisa. Se ne compare anche uno → fail. [INFERRED]

## Reward / hack-check

- **Q (quality signal)**: scan dell'output prodotto. Destinazione condivisa → 0 backslash `\`, 0 home-dir (`/home/<user>`, `C:\Users\`, `D:\Users\`) = **pass**; ≥1 = **fail**.
- **Hack**: "emetti sempre relativo" massimizza il proxy ingenuamente ma **viene penalizzato** sui casi dove l'assoluto era corretto (es. script di lancio locale, riferimento a risorsa fuori dal repo). [INFERRED]
- **Balance**: il reward è ancorato alla **destinazione reale** (ground truth), non alla forma del path in sé. Reward sull'OUTCOME (path risolvibile + zero-leak nel contesto giusto), non sulla partecipazione ("ho usato relativo"). Vedi [[reward-hacking]] / principio reward-hacking. [INFERRED]

## Linked

- Regola progetto OS-agnostic: `CLAUDE.md` regola permanente #7 + Fase 5 → Portabilità (path repo-relative + `/`, mai assoluti/backslash/username, niente token custom, push solo `graph.json`/`graph.html`/`GRAPH_REPORT.md`). Questa skill **è la versione internalizzata nel modello** di quella regola di processo. [EXTRACTED]
- [[secret-section-exfiltration-defense]] — path assoluti = leak username → PII; stessa superficie di rischio (exfiltration accidentale via output).
- [[harness-capabilities-as-files]] — `<ROOT_PROJ>` nel config ↔ pattern "config come file leggibile dall'agent"; il root assoluto è una capability locale, non contenuto.
- [[structured-thinking]] — la why-chain è un'istanza di ragionamento strutturato esplicito.
- [[scientific-method-operating-protocol]] — confidence provisional, claim falsificabili, evidenze guidano.

Nota: è una **skill di training** (Area 7 security/privacy + Area 8 tool-use). I gold example per questa foglia **devono includere la why-chain** sopra, non solo l'output corretto — l'obiettivo è insegnare il ragionamento, non la regola. [INFERRED]
