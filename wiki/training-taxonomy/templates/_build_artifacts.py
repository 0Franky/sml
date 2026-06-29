#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
_build_artifacts.py — derivatore invertibile-per-costruzione (authoring helper).

NON e' lo step di training. E' l'utility che ho usato per DERIVARE lo scheletro
espandibile del template (il canonico-con-buchi) e i valori-slot del delta-1.1
PARTENDO dal canonico gold-example-area02-criticality.md, in modo che
   expand(skeleton, slot_values) == canonico   byte-per-byte   (per costruzione).

Come funziona:
  - definisco una lista ordinata di SLOT, ognuno ancorato a un intervallo
    [anchor_start .. anchor_end) del testo canonico (substring UNICHE → niente
    ambiguita'). Gli intervalli sono non-sovrapposti e in ordine di apparizione.
  - skeleton = canonico con ogni intervallo-slot rimpiazzato da '{{SLOT}}'.
  - slot_values[SLOT] = il testo canonico esatto di quell'intervallo (VERBATIM).
  - assert expand(skeleton, slot_values) == canonico.

L'espansore di training vero e proprio (generico, Mustache-like) e' expand.py.
Questo file e' solo authoring-time e non finisce nel training set.
"""
import sys, json, re, pathlib

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent                       # wiki/training-taxonomy
CANON = ROOT / "gold-example-area02-criticality.md"

def read(p):
    return p.read_text(encoding="utf-8")

# ---------------------------------------------------------------------------
# Definizione degli SLOT come (NOME, ancora_inizio, ancora_fine).
# L'intervallo coperto va da find(ancora_inizio) (incluso) a find(ancora_fine)
# (escluso). Entrambe le ancore DEVONO essere uniche nel canonico.
# Gli slot DEVONO essere non-sovrapposti e dati in ordine di apparizione.
#
# Convenzione: l'ancora_inizio coincide con l'inizio della porzione leaf-specifica;
# l'ancora_fine coincide con l'inizio della porzione invariante successiva
# (header/prosa del template che resta verbatim).
# ---------------------------------------------------------------------------

SLOTS = [
    # ---- frontmatter + titolo : campi leaf-specifici (slot scalari/prosa) ----
    ("FM_NAME",
     "name: gold-example-area02-criticality",
     "\ntype: gold-example"),
    ("FM_LEAF",
     'leaf: "criticality-implicita / cancellazione file non versionato"',
     "\narea: area-02-criticality-safety"),
    ("FM_STATUS",
     "status: gold-reference (team review-loop",
     "\n---\n\n# GOLD —"),
    ("H1_TITLE",
     "# GOLD — foglia 1.1 · `cancellazione file non versionato` · scenario *import rotto*",
     "\n\n## §0 —"),
    # ---- §0 / §1 / §1bis : porzioni leaf-specifiche dentro prosa invariante ----
    # §0 corpo intero (prosa specifica della foglia 1.1) -- e' interamente leaf.
    ("SEC0_BODY",
     "Questo file è l'**esempio-gold di training data** per la foglia canonica `criticality-implicita",
     "\n## §1 — Skill-target"),
    # §1 corpo intero
    ("SEC1_BODY",
     "> Prima di eseguire `rm`/delete su un file, il modello **esegue materialmente due check**",
     "\n## §1bis"),
    # §1bis corpo intero (decision-policy d'istanza 1.1)
    ("SEC1BIS_BODY",
     "> Origine: utente 2026-06-27 — timore che il modello",
     "\n---\n\n## §2bis"),
    # §2bis corpo intero (sandbox fixture d'istanza)
    ("SEC2BIS_BODY",
     "> Il verifier è \"deterministico in sandbox\"",
     "\n---\n\n## §2 —"),
    # ---- §2 intro invariante resta; le 5 classi sono slot ----
    ("CLASSE1_INPUT",
     "#### INPUT (comune ai 3 livelli, cambia solo la riga `<hint>`)",
     "\n- **Hint FORTE (checklist completa)**"),
    ("CLASSE1_HINTS",
     "- **Hint FORTE (checklist completa)** — `<hint>`:",
     "\n#### OUTPUT TARGET — reso per livello"),
    ("CLASSE1_OUTPUT",
     "#### OUTPUT TARGET — reso per livello",
     "\n#### LABEL / REWARD (Q)\n- **Verifier deterministico**"),
    ("CLASSE1_LABEL",
     "#### LABEL / REWARD (Q)\n- **Verifier deterministico**",
     "\n---\n\n### (2) WITHOUT-hint"),
    ("CLASSE2_DELTA",
     "### (2) WITHOUT-hint — stessa task family, nessun avviso",
     "\n---\n\n### (3) WRONG — awareness"),
    ("CLASSE3_DELTA",
     "### (3) WRONG — awareness — traiettoria sbagliata da RICONOSCERE (no recovery)",
     "\n---\n\n### (4) WRONG — recovery"),
    ("CLASSE4_DELTA",
     "### (4) WRONG — recovery — sbagliato + recupero REALE (verify-loop vero)",
     "\n---\n\n### (5) OTHER"),
    # ---- §2 classe 5: P0-2 -> slot per-istanza 5a..5g + intro + label comune ----
    ("CLASSE5_INTRO",
     "### (5) OTHER — composite / edge: due esiti",
     "\n#### (5a) Stesso task"),
    ("CLASSE5A",
     "#### (5a) Stesso task, **due esiti** secondo il tracking",
     "\n#### (5b) File UNTRACKED ma RIGENERABILE"),
    ("CLASSE5B",
     "#### (5b) File UNTRACKED ma RIGENERABILE (cache)",
     "\n#### (5c) Cross-step"),
    ("CLASSE5C",
     "#### (5c) Cross-step: la cancellazione",
     "\n#### (5d) Adversariale"),
    ("CLASSE5D",
     "#### (5d) Adversariale: naming ingannevole",
     "\n#### (5e) Batch di delete"),
    ("CLASSE5E",
     "#### (5e) Batch di delete multipli",
     "\n#### (5f) `automod`"),
    ("CLASSE5F",
     "#### (5f) `automod` + valore-di-gruppo",
     "\n#### (5g) Held-out NEGATIVO"),
    ("CLASSE5G",
     "#### (5g) Held-out NEGATIVO di 5f",
     "\n---\n\n#### LABEL / REWARD (Q) — comune alle istanze (5)"),
    ("CLASSE5_LABEL",
     "#### LABEL / REWARD (Q) — comune alle istanze (5)",
     "\n---\n\n## §3 — Cosa lo rende GOLD"),
    # ---- §3 / §3bis / §4 / Sources : interi (HEADER INCLUSO) -> slot-blocco.
    # L'header e' nello slot (non nello scheletro) perche' tra foglie cambia:
    # 1.1 ha "§3 Cosa lo rende GOLD" + "§4 Come usarlo come template";
    # 1.2 ha "§3 Classificazione training-vs-harness" + "§3bis Catena" e NO §4.
    # Lo scheletro mette UN solo segnaposto {{TAIL_SECTIONS}} dopo l'ultimo `---`
    # delle 5 classi; il delta fornisce l'intera coda (§3..Sources) verbatim.
    ("TAIL_SECTIONS",
     "## §3 — Cosa lo rende GOLD",
     None),   # fino a EOF (include §3, §3bis, §4, Sources)
]

def unique_index(hay, needle, label):
    i = hay.find(needle)
    if i < 0:
        sys.exit(f"[FATAL] ancora non trovata per {label!r}: {needle[:60]!r}")
    j = hay.find(needle, i + 1)
    if j >= 0:
        sys.exit(f"[FATAL] ancora NON unica per {label!r}: {needle[:60]!r}")
    return i

def derive():
    canon = read(CANON)
    # calcola gli intervalli
    intervals = []
    for name, a_start, a_end in SLOTS:
        s = unique_index(canon, a_start, name + ".start")
        if a_end is None:
            e = len(canon)
        else:
            e = unique_index(canon, a_end, name + ".end")
        if e < s:
            sys.exit(f"[FATAL] intervallo invertito per {name}")
        intervals.append((s, e, name))
    intervals.sort()
    # verifica non-sovrapposizione
    for k in range(1, len(intervals)):
        if intervals[k][0] < intervals[k-1][1]:
            sys.exit(f"[FATAL] overlap tra {intervals[k-1][2]} e {intervals[k][2]}")
    # costruisci skeleton + valori
    out = []
    values = {}
    pos = 0
    for s, e, name in intervals:
        out.append(canon[pos:s])
        out.append("{{" + name + "}}")
        values[name] = canon[s:e]
        pos = e
    out.append(canon[pos:])
    skeleton = "".join(out)
    # sanity: nessuno slot residuo nel canonico originale
    return canon, skeleton, values

def expand(skeleton, values):
    def repl(m):
        k = m.group(1)
        if k not in values:
            sys.exit(f"[FATAL] slot senza valore: {k}")
        return values[k]
    return re.sub(r"\{\{([A-Z0-9_]+)\}\}", repl, skeleton)

def main():
    canon, skeleton, values = derive()
    got = expand(skeleton, values)
    ok = (got == canon)
    print(f"slots: {len(values)}")
    print(f"round-trip byte-equal: {ok}")
    if not ok:
        # mostra prima differenza
        for i,(a,b) in enumerate(zip(canon, got)):
            if a != b:
                print("first diff at", i, repr(canon[i-20:i+20]), "VS", repr(got[i-20:i+20]))
                break
        sys.exit(1)
    # emetti skeleton + values come artifacts intermedi JSON (consumati da render)
    (HERE / "_skeleton.txt").write_text(skeleton, encoding="utf-8", newline="\n")
    (HERE / "_slots_1.1.json").write_text(
        json.dumps(values, ensure_ascii=False, indent=2), encoding="utf-8", newline="\n")
    print("written: _skeleton.txt, _slots_1.1.json")

if __name__ == "__main__":
    main()
