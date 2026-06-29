#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
expand.py — espansore di training (Mustache-like) per template-inheritance area-02.

    expand(template_md, delta_md) -> full-gold.md

Pipeline (la stessa per ogni foglia del gruppo 1.x):
  1. estrae lo SCHELETRO espandibile dal template, tra i marker
        <!-- EXPAND:BEGIN --> ... <!-- EXPAND:END -->
     (lo scheletro e' il canonico-con-buchi: prosa/struttura invariante + slot {{...}}).
  2. estrae i VALORI-SLOT dal delta, dal JSON tra i marker
        <!-- SLOTS:JSON:BEGIN --> { ... } <!-- SLOTS:JSON:END -->
     (ogni valore e' il TESTO VERBATIM dello slot — niente referenza-per-indice).
  3. sostituisce ogni {{SLOT}} col valore omonimo (sostituzione testuale pura).
  4. ASSERTS:
        - ogni {{SLOT}} dello scheletro ha un valore nel delta  (slot mancante -> ERRORE, mai vuoto silenzioso);
        - no_residual_slots: nessun {{...}} residuo nell'output;
     poi scrive l'espanso su disco.
  5. (opzionale) --diff <canonico>: confronta l'espanso col riferimento committato
     -> byte_equal True/False (round-trip). Exit 0 sse byte-equal (o se --no-fail).

Uso:
    python expand.py --template area02-group1-destructive.template.md \
                     --delta    area02-leaf-1.1-delete.delta.md \
                     --out      ../gold-example-area02-criticality.expanded.md \
                     --diff     ../gold-example-area02-criticality.md

OS-agnostic: I/O sempre in UTF-8, newline LF (newline='\n'), nessun path assoluto
hardcoded (tutti gli argomenti sono path passati da CLI / risolti relativi al cwd).
"""
import argparse, json, re, sys, pathlib

SLOT_RE = re.compile(r"\{\{([A-Z0-9_]+)\}\}")
EXPAND_BEGIN = "<!-- EXPAND:BEGIN -->"
EXPAND_END   = "<!-- EXPAND:END -->"
SLOTS_BEGIN  = "<!-- SLOTS:JSON:BEGIN -->"
SLOTS_END    = "<!-- SLOTS:JSON:END -->"


def _read(p):
    return pathlib.Path(p).read_text(encoding="utf-8")


def _between(text, begin, end, what):
    i = text.find(begin)
    if i < 0:
        sys.exit(f"[FATAL] marker {begin!r} non trovato in {what}")
    i += len(begin)
    j = text.find(end, i)
    if j < 0:
        sys.exit(f"[FATAL] marker {end!r} non trovato in {what}")
    return text[i:j]


def load_skeleton(template_md):
    body = _between(_read(template_md), EXPAND_BEGIN, EXPAND_END, "template")
    # lo scheletro e' incapsulato in un fence ```text ... ``` per leggibilita';
    # se presente, rimuovi SOLO il fence esterno (prima riga ```... e ultima ```).
    return _strip_outer_fence(body)


def load_slots(delta_md):
    raw = _between(_read(delta_md), SLOTS_BEGIN, SLOTS_END, "delta")
    raw = _strip_outer_fence(raw)
    try:
        return json.loads(raw)
    except json.JSONDecodeError as e:
        sys.exit(f"[FATAL] JSON slot non valido nel delta: {e}")


def _strip_outer_fence(s):
    """Rimuove un eventuale code-fence esterno (```lang\\n ... \\n```), preservando
    il contenuto interno byte-per-byte (inclusi eventuali fence annidati)."""
    lines = s.split("\n")
    # trova la prima riga non-vuota: dev'essere un fence di apertura ```...
    a = 0
    while a < len(lines) and lines[a].strip() == "":
        a += 1
    b = len(lines) - 1
    while b >= 0 and lines[b].strip() == "":
        b -= 1
    if a <= b and lines[a].startswith("```") and lines[b].strip() == "```":
        inner = lines[a+1:b]
        return "\n".join(inner)
    return s


def expand(skeleton, slots):
    missing = sorted({m.group(1) for m in SLOT_RE.finditer(skeleton)} - set(slots))
    if missing:
        sys.exit(f"[FATAL] slot dello scheletro senza valore nel delta: {missing}")
    def repl(m):
        return slots[m.group(1)]
    out = SLOT_RE.sub(repl, skeleton)
    residual = SLOT_RE.findall(out)
    if residual:
        sys.exit(f"[FATAL] no_residual_slots VIOLATO: slot residui {sorted(set(residual))}")
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--template", required=True)
    ap.add_argument("--delta", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--diff", default=None, help="canonico di riferimento per round-trip")
    ap.add_argument("--no-fail", action="store_true", help="non uscire 1 su byte-diff")
    args = ap.parse_args()

    skeleton = load_skeleton(args.template)
    slots = load_slots(args.delta)
    full = expand(skeleton, slots)

    pathlib.Path(args.out).write_text(full, encoding="utf-8", newline="\n")
    print(f"[ok] espanso -> {args.out}  ({len(full.encode('utf-8'))} bytes, "
          f"{len(slots)} slot, 0 residui)")

    if args.diff:
        ref = _read(args.diff)
        byte_equal = (full == ref)
        print(f"[round-trip] diff({args.out}, {args.diff}) -> byte_equal: {byte_equal}")
        if not byte_equal:
            # prima differenza, contesto
            n = min(len(full), len(ref))
            i = next((k for k in range(n) if full[k] != ref[k]), n)
            print(f"  primo mismatch @char {i} (len exp={len(full)} ref={len(ref)})")
            print(f"  exp: ...{full[max(0,i-40):i+40]!r}...")
            print(f"  ref: ...{ref[max(0,i-40):i+40]!r}...")
            if not args.no_fail:
                sys.exit(1)


if __name__ == "__main__":
    main()
