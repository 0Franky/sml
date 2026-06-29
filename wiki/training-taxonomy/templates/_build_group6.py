#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
_build_group6.py — derivatore invertibile-per-costruzione (authoring helper, gruppo 6.x L-type).

NON e' lo step di training. E' l'utility che DERIVA, via SPLIT-AT-ANCHORS dal canonico
gold-example-area02-6.2-defer.expanded.md:
  1. lo SCHELETRO espandibile (canonico-con-buchi) del template di gruppo 6.x (L-type);
  2. i VALORI-SLOT (testo VERBATIM) della foglia-delta 6.2;
in modo che   expand(skeleton, slot_values) == canonico   BYTE-PER-BYTE (per costruzione).

Metodo (identico a _build_group3.py del gruppo Q):
  - lista ORDINATA di SLOT, ognuno ancorato a un intervallo [anchor_start .. anchor_end)
    del canonico (substring UNICHE → niente ambiguita'); intervalli non-sovrapposti,
    in ordine di apparizione;
  - skeleton = canonico con ogni intervallo-slot rimpiazzato da '{{SLOT}}';
  - slot_values[SLOT] = testo canonico esatto di quell'intervallo (VERBATIM);
  - assert expand(skeleton, slot_values) == canonico.

Lo scheletro INVARIANTE (cio' che e' genuinamente condiviso tra 6.1/6.2, entrambe L-type
"decision-point lookahead A/B") = frontmatter-shell coi campi comuni (type/area/last_updated)
+ header di sezione condivisi (§0 / §1 / §2 "Le 5 classi" + i separatori "---") + gli
header H4 invarianti delle classi (#### INPUT / #### OUTPUT TARGET / #### LABEL...). Tutto il
leaf-specifico (frontmatter leaf, titoli, corpi, §2bis "fixture L" col contract-schema +
env_facts→lane-reali + reward-2-livelli, l'intro §2 con lo scenario-base, le 5 classi L con
WRONG=decisione-sbagliata, §3 no-reward-sul-ramo, §4, Sources) sta negli slot.

Specificita' L gestite negli slot (NON forzare lo schema Q):
  - §1bis/§1ter PRIMA della fixture (layout L), §2bis = fixture L (contract-schema tipizzato +
    ancoraggio env_facts→lane reali last_tool_calls/open_file_view/interconnections/rules +
    reward L a DUE livelli) → tutto in SEC2BIS_BODY (un blocco con 4 sotto-header H3);
  - niente §2ter (la TVH classification vive in §1ter, layout L) → la coda e' §3+§4+Sources;
  - classe 5 con 4 sotto-istanze L (5a coppia bilanciata act/defer · 5b over-asking · 5c
    probe-then-classify/incertezza · 5d adversariale-provenienza) → slot per-istanza 5a..5d.

L'espansore di training vero (generico, Mustache-like) e' expand.py. Questo file e'
solo authoring-time e non finisce nel training set.

Uso:
    python _build_group6.py
Emette (relativi a questa cartella):
    area02-group6-deferral.template.md    — template di gruppo L (doc + blocco EXPAND)
    area02-leaf-6.2-defer.delta.md        — leaf-delta 6.2 (doc + blocco SLOTS:JSON)
    _skeleton_group6.txt / _slots_6.2.json — intermedi rigenerabili
OS-agnostic: I/O UTF-8 + newline LF; nessun path assoluto hardcoded (costanti relative).
"""
import sys, json, re, pathlib

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent                       # wiki/training-taxonomy
CANON = ROOT / "gold-example-area02-6.2-defer.expanded.md"

TEMPLATE_OUT = HERE / "area02-group6-deferral.template.md"
DELTA_OUT    = HERE / "area02-leaf-6.2-defer.delta.md"
SKELETON_OUT = HERE / "_skeleton_group6.txt"
SLOTS_OUT    = HERE / "_slots_6.2.json"


def read(p):
    return p.read_text(encoding="utf-8")


# ---------------------------------------------------------------------------
# Definizione degli SLOT come (NOME, ancora_inizio, ancora_fine).
# L'intervallo coperto va da find(ancora_inizio) (incluso) a find(ancora_fine)
# (escluso). Entrambe le ancore DEVONO essere uniche nel canonico.
# Gli slot DEVONO essere non-sovrapposti e dati in ordine di apparizione.
#
# Convenzione: ancora_inizio = inizio della porzione leaf-specifica;
# ancora_fine = inizio della porzione invariante successiva (header/prosa del
# template che resta verbatim nello scheletro).
#
# INVARIANTE (resta nello scheletro, NON e' slot):
#   "---\nname: " · "\ntype: gold-example\n" · "\narea: area-02-criticality-safety\n"
#   · "\nlast_updated: 2026-06-29\n" · "\n---\n\n"
#   · gli header "## §0 —", "## §1 —", "## §2 — Le 5 classi ...", i separatori "---",
#     gli header H4 "#### INPUT", "#### OUTPUT TARGET", "#### LABEL / REWARD (L) ...".
#   NB: a differenza del gruppo Q, in 6.x l'intro §2 contiene lo *scenario-base*
#       leaf-specifico → e' uno slot (SEC2_INTRO), non invariante.
# ---------------------------------------------------------------------------

SLOTS = [
    # ---- frontmatter : campi leaf-specifici ---------------------------------
    ("FM_NAME",
     "name: gold-example-area02-6.2-defer.expanded",
     "\ndescription: "),
    ("FM_DESC",
     "description: Esempio GOLD CANONICO (espanso, training-fidelity) per la Foglia 6.2",
     "\ntype: gold-example"),
    ("FM_LEAF",
     'leaf: "scegliere o deferire all\'utente"',
     "\narea: area-02-criticality-safety"),
    ("FM_REWARD_TAG",
     'reward_tag: "L (judge-scored, no ground-truth deterministica sul ramo)"',
     "\nlast_updated: 2026-06-29"),
    ("FM_STATUS",
     "status: gold-reference-canonico (autore verticale decision-making/deferral/judge-design",
     "\n---\n\n# GOLD CANONICO"),
    # ---- H1 + intro blockquote (leaf-specifico: titolo + primo gold L) -------
    ("H1_TITLE",
     "# GOLD CANONICO — Foglia 6.2 · `scegliere o deferire all'utente` · reward_tag **L**",
     "\n\n## §0 —"),
    # ---- §0 corpo intero -----------------------------------------------------
    ("SEC0_BODY",
     "Questo è l'**esempio-gold di training data** per la Foglia 6.2",
     "\n## §1 — Skill-target"),
    # ---- §1 corpo intero -----------------------------------------------------
    ("SEC1_BODY",
     "> Di fronte a un bivio **con conseguenze**, il modello (1) **proietta**",
     "\n## §1bis"),
    # ---- §1bis : header diverge tra foglie -> slot header + slot body --------
    ("SEC1BIS_HEADER",
     "## §1bis — Decision policy (criteri di deferral) + omissioni dichiarate + perché NO reward sul ramo",
     "\n\n> **Catena why → problema → soluzione**"),
    ("SEC1BIS_BODY",
     "> **Catena why → problema → soluzione** ([[gold-methodology]] §catena;",
     "\n## §1ter"),
    # ---- §1ter : training-vs-harness (layout L: PRIMA della fixture) ---------
    ("SEC1TER_HEADER",
     "## §1ter — Classificazione training-vs-harness ([[../concepts/training-vs-harness-classification|playbook]]) (CLAUDE.md #11)",
     "\n\n| Metà (scomposta"),
    ("SEC1TER_BODY",
     "| Metà (scomposta {meccanismo} vs {decisione/generazione}) | Asse | Stato-senza-training |",
     "\n---\n\n## §2bis"),
    # ---- §2bis : fixture L (contract-schema + env_facts->lane + reward 2-liv) -
    ("SEC2BIS_HEADER",
     '## §2bis — Contract-schema (tipizzato) + fatti-da-lane-fidate + reward L a DUE livelli (la "fixture" della foglia L)',
     "\n\n> Analogo della §2bis"),
    ("SEC2BIS_BODY",
     "> Analogo della §2bis (sandbox fixture) del template Q, **riadattato al regime L**",
     "\n---\n\n## §2 —"),
    # ---- §2 intro: lo scenario-base e' leaf-specifico -> slot (non invariante)
    ("SEC2_INTRO",
     "> **Convenzione.** INPUT = `<context>` nel formato wrapper",
     "\n---\n\n### (1) WITH-hint"),
    # ---- §2 classe 1 ---------------------------------------------------------
    ("CLASSE1_HEADER",
     "### (1) WITH-hint — bivio cloud-a-pagamento vs locale · 3 livelli di scaffolding",
     "\n#### INPUT (comune ai 3 livelli"),
    ("CLASSE1_INPUT",
     "#### INPUT (comune ai 3 livelli, cambia solo la riga `<hint>`)",
     "\n#### OUTPUT TARGET (reso per livello)"),
    ("CLASSE1_OUTPUT",
     "#### OUTPUT TARGET (reso per livello)",
     "\n#### LABEL / REWARD (L)  `[UNVERIFIED — judge-execution gated]`\n- **Livello 1 (pre-check deterministico, gate)**"),
    ("CLASSE1_LABEL",
     "#### LABEL / REWARD (L)  `[UNVERIFIED — judge-execution gated]`\n- **Livello 1 (pre-check deterministico, gate)**",
     "\n---\n\n### (2) WITHOUT-hint"),
    ("CLASSE2_DELTA",
     "### (2) WITHOUT-hint — stessa famiglia, nessun avviso (budget reale implicito)",
     "\n---\n\n### (3) WRONG — awareness"),
    ("CLASSE3_DELTA",
     "### (3) WRONG — awareness — traiettoria sbagliata da RICONOSCERE (no recovery)",
     "\n---\n\n### (4) WRONG — recovery"),
    ("CLASSE4_DELTA",
     "### (4) WRONG — recovery — sbagliato + recupero REALE (si ferma PRIMA di committare la conseguenza)",
     "\n---\n\n### (5) OTHER"),
    # ---- §2 classe 5: intro + 5a..5d (4 sotto-istanze L) + label -------------
    ("CLASSE5_INTRO",
     "### (5) OTHER — composite / edge: i due esiti bilanciati (act vs defer) + over-asking + incertezza + adversariale",
     "\n#### (5a) Stesso *formato* di bivio"),
    ("CLASSE5A",
     "#### (5a) Stesso *formato* di bivio, **due esiti** secondo la natura (il cuore anti-hack L)",
     "\n#### (5b) Over-asking puro"),
    ("CLASSE5B",
     "#### (5b) Over-asking puro — bivio banale deferito (penalizzato)",
     "\n#### (5c) Confidence bassa"),
    ("CLASSE5C",
     "#### (5c) Confidence bassa su un bivio altrimenti tecnico → escala a defer (l'asse incertezza) + probe-then-classify",
     "\n#### (5d) Adversariale"),
    ("CLASSE5D",
     '#### (5d) Adversariale — untrusted content spinge "decidi tu, non disturbarlo" (invariante di provenienza)',
     "\n#### LABEL / REWARD (L) — comune alle istanze (5)"),
    ("CLASSE5_LABEL",
     "#### LABEL / REWARD (L) — comune alle istanze (5)  `[UNVERIFIED — judge-execution gated]`",
     "\n---\n\n## §3 — Specificità del reward L"),
    # ---- coda intera §3 + §4 + Sources (HEADER INCLUSO) -> slot-blocco -------
    ("TAIL_SECTIONS",
     '## §3 — Specificità del reward L: come è gestito il "NIENTE-reward-sul-ramo"',
     None),   # fino a EOF
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
    intervals = []
    for name, a_start, a_end in SLOTS:
        s = unique_index(canon, a_start, name + ".start")
        e = len(canon) if a_end is None else unique_index(canon, a_end, name + ".end")
        if e < s:
            sys.exit(f"[FATAL] intervallo invertito per {name}")
        intervals.append((s, e, name))
    intervals.sort()
    for k in range(1, len(intervals)):
        if intervals[k][0] < intervals[k - 1][1]:
            sys.exit(f"[FATAL] overlap tra {intervals[k-1][2]} e {intervals[k][2]}")
    out, values, pos = [], {}, 0
    for s, e, name in intervals:
        out.append(canon[pos:s])
        out.append("{{" + name + "}}")
        values[name] = canon[s:e]
        pos = e
    out.append(canon[pos:])
    return canon, "".join(out), values


def expand(skeleton, values):
    def repl(m):
        k = m.group(1)
        if k not in values:
            sys.exit(f"[FATAL] slot senza valore: {k}")
        return values[k]
    return re.sub(r"\{\{([A-Z0-9_]+)\}\}", repl, skeleton)


# ---------------------------------------------------------------------------
# Rendering dei file finali template/delta (doc-shell + blocchi macchina).
# La doc-shell e' prosa di authoring; cio' che expand.py consuma sono
# SOLO il blocco <!-- EXPAND --> (template) e <!-- SLOTS:JSON --> (delta).
# ---------------------------------------------------------------------------

def render_template(skeleton):
    return f'''---
name: area02-group6-deferral-template
description: SKELETON template-inheritance condiviso per il gruppo 6.x "decision-point lookahead A/B" dell'Area 2 (6.1 simulare-esiti-A/B · 6.2 scegliere-o-deferire). Foglie L-type (scelta-di-valore, judge-scored, NESSUNA ground-truth deterministica sul ramo). Pattern-reward L a DUE livelli: livello-1 deterministico (pre-check `campi-tipizzati ↔ facts-da-lane-reali`, enum↔enum) + livello-2 judge (council OPEN su `razionale ↔ campi`); NIENTE reward-sul-ramo (act/defer); held-out bilanciato 50/50 act:defer; doppia-penalita' missed-defer/over-defer via INCOERENZA (non via ramo); scorer≠scored. Definisce struttura, marker, leggi-del-gruppo (contract-schema tipizzato, coherence-2-livelli, ancoraggio env_facts→lane fidate, predicato non-commit/probe, invariante-di-provenienza) e gli SLOT VERBATIM che le foglie-delta riempiono. Lo SCHELETRO ESPANDIBILE (canonico-con-buchi) sta nel blocco <!-- EXPAND --> in coda: expand(skeleton, slot-6.2) == gold-example-area02-6.2-defer.expanded.md BYTE-PER-BYTE. Il modello si addestra sull'ESPANSO, vedi EXPANSION.md + expand.py.
type: gold-template
family: "area-02 gruppo 6.x — decision-point lookahead A/B (L-type scelta-di-valore)"
reward_tag: "L (+Q parziale fase-3 dove l'esito previsto è confrontabile col reale)"
leaves: [6.1-lookahead, 6.2-defer]
tags: [gold, template-inheritance, area-02, criticality, deferral, decision-point, lookahead, L-type, judge, coherence-2-livelli, reward]
sources: [gold-methodology §Reward-L + §coherence-2-livelli + §predicato-vs-esecuzione, gold-example-area02-6.2-defer.expanded (6.2 canonico = round-trip target), judge-design (contract + coherence-anchoring a due livelli + council OPEN), area-02-criticality-safety Topic 6 (lookahead/deferral)]
last_updated: 2026-06-29
status: template-v1 (gruppo 6.x L-type — primo template L del rollout · slot VERBATIM + round-trip byte-esatto verificato da expand.py contro il canonico 6.2)
---

# TEMPLATE di gruppo — Area 2 · gruppo 6.x "decision-point lookahead A/B" (L-type scelta-di-valore)

> **Cos'è.** Lo *skeleton condiviso* per le foglie del gruppo 6.x (6.1 simulare-esiti-A/B · 6.2 scegliere-o-deferire). Le foglie hanno la **stessa spina dorsale L**: di fronte a un bivio con conseguenze il modello *proietta gli esiti A/B*, *classifica la natura del bivio* (tecnico-reversibile ↔ tocca-valori/risorse), ed *emette un contract strutturato* ancorato ai fatti del contesto; poi `act` o `defer`. **Niente oracolo sul ramo** → reward = **coherence a DUE livelli** (livello-1 deterministico `campi↔facts`, livello-2 judge `razionale↔campi`). Questo file fissa struttura, marker, pattern-reward L e leggi-del-gruppo **una volta**; ogni foglia fornisce un `.delta.md` che riempie gli SLOT `{{{{...}}}}` col **testo verbatim**.
>
> ⚠️ **Questo è un template L, DIVERSO dai template Q** (gruppi 1.x/3.x). NON c'è verifier-sul-ramo: il "giusto" act/defer dipende dal contesto, non da un oracolo. Il template Q (oracolo eseguibile, caught/missed binario) **non si applica** alle foglie 6.x. Vedi §ORACOLO-PATTERN-L sotto.
>
> ⚠️ **Il modello si addestra sull'ESPANSO** (template + delta → full-gold a piena fedeltà). La gerarchia è **solo authoring-time** (DRY di manutenzione). L'espansione è una **sostituzione testuale pura** dello scheletro qui in coda (blocco `<!-- EXPAND -->`) coi valori-slot del delta — vedi [[EXPANSION.md]] + lo script [`expand.py`](expand.py). Riferimento metodologico: [[../gold-methodology|gold-methodology]] §Reward-L + §coherence-2-livelli.
>
> ✅ **Round-trip byte-esatto (P1)**: `expand(this.skeleton, delta-6.2.slots)` == [[../gold-example-area02-6.2-defer.expanded|gold-example-area02-6.2-defer.expanded.md]] **byte-per-byte** (nessun "modulo prosa tagliata": il target è il canonico ESATTO). Verificato da `expand.py --diff`. Vedi [[EXPANSION.md]] §Verifica.

---

## §SLOT — Registro degli slot (contratto template↔delta)

Ogni `.delta.md` DEVE fornire ESATTAMENTE questi slot, ognuno col **TESTO VERBATIM** della porzione leaf-specifica (P0-1: **niente** "vedi §X"/referenza-per-indice — il valore È il testo che finisce nell'espanso). Slot non fornito ⇒ `expand.py` **fallisce** con errore esplicito (niente sostituzione vuota silenziosa, [[../gold-methodology|gold-methodology]] §"slot/override espliciti").

> Lo scheletro distingue due nature di slot:
> - **slot-scalari / prosa-breve** (`{{{{FM_NAME}}}}`, `{{{{FM_LEAF}}}}`, `{{{{FM_REWARD_TAG}}}}`, `{{{{FM_DESC}}}}`, `{{{{FM_STATUS}}}}`): valori inline (campi frontmatter leaf-specifici).
> - **slot-blocco di sezione** (tutti gli altri): l'intera porzione (header incluso dove il titolo diverge tra foglie) come testo verbatim.

| Slot | Natura | Cosa contiene | Valore (6.2) |
|------|--------|---------------|--------------|
| `{{{{FM_NAME}}}}` | scalare | campo frontmatter `name:` | `name: gold-example-area02-6.2-defer.expanded` |
| `{{{{FM_DESC}}}}` | prosa | campo frontmatter `description:` (leaf-specifico, lungo) | (descrizione 6.2 · reward L · 5 classi) |
| `{{{{FM_LEAF}}}}` | scalare | campo frontmatter `leaf:` | `scegliere o deferire all'utente` |
| `{{{{FM_REWARD_TAG}}}}` | scalare | campo frontmatter `reward_tag:` | `L (judge-scored, no ground-truth deterministica sul ramo)` |
| `{{{{FM_STATUS}}}}` | prosa breve | campo frontmatter `status:` (autore + allineamenti + `[UNVERIFIED]`) | (status 6.2 + UNVERIFIED) |
| `{{{{H1_TITLE}}}}` | blocco | titolo H1 + blockquote "Primo gold L del rollout" | (titolo 6.2 + intro pattern-L) |
| `{{{{SEC0_BODY}}}}` | blocco | corpo §0 (cos'è / perché gold / la barra L + 2 box `[UNVERIFIED]` + box "NIENTE reward sul ramo") | (skill defer, barra L a 3 punti) |
| `{{{{SEC1_BODY}}}}` | blocco | corpo §1 (skill-target falsificabile: livello-1 deterministico + livello-2 L-judged + predittività Q-parziale + cosa NON è falsificabile) | (proietta/classifica/contract/act-defer) |
| `{{{{SEC1BIS_HEADER}}}}` | blocco | header H2 §1bis (titolo diverge tra foglie) | (`...+ perché NO reward sul ramo`) |
| `{{{{SEC1BIS_BODY}}}}` | blocco | corpo §1bis (catena why→problema→soluzione + 3 assi deferral + discriminante annotata + omissioni dichiarate vs template Q) | (decision-policy deferral 6.2) |
| `{{{{SEC1TER_HEADER}}}}` | blocco | header H2 §1ter (training-vs-harness, layout L: PRIMA della fixture) | (header §1ter) |
| `{{{{SEC1TER_BODY}}}}` | blocco | corpo §1ter (tabella scomposizione F-harness/S + Q0 scomposizione F+S, stato-senza-training) | (giudice+pre-check=F, contract+calibrazione=S) |
| `{{{{SEC2BIS_HEADER}}}}` | blocco | header H2 §2bis (la "fixture" della foglia L) | (header fixture L) |
| `{{{{SEC2BIS_BODY}}}}` | blocco | corpo §2bis (4 sotto-header H3): **contract-schema tipizzato** (oggetto-di-giudizio, enum) · **ancoraggio livello-1 a lane REALI** (env_facts→last_tool_calls/open_file_view/interconnections/rules, NON una lane env_facts) · **reward L a DUE livelli** (predicato enum↔enum + perché-servono-entrambi) · **scorer≠scored** | (fixture L completa 6.2) |
| `{{{{SEC2_INTRO}}}}` | blocco | §2 intro `> **Convenzione.**` + **scenario-base leaf-specifico** (cloud-a-pagamento vs locale = bivio che tocca il budget) | (convenzione L + scenario benchmark/budget) |
| `{{{{CLASSE1_HEADER}}}}` | blocco | §2 classe 1 — header H3 + frase fade-out/scaffolding | (`bivio cloud-a-pagamento vs locale`) |
| `{{{{CLASSE1_INPUT}}}}` | blocco | §2 classe 1 — INPUT `<context>` (cambia solo `<hint>`) + i 3 hint (forte/medio/debole) + nota d'ancoraggio | (INPUT 3-livelli + last_tool_calls reali) |
| `{{{{CLASSE1_OUTPUT}}}}` | blocco | §2 classe 1 — OUTPUT TARGET per livello (reasoning + CONTRACT TOON + prosa user-facing, forte/medio/debole) + nota scaffolding | (defer-cloud, contract TOON) |
| `{{{{CLASSE1_LABEL}}}}` | blocco | §2 classe 1 — LABEL/REWARD (L) a 2 livelli + NIENTE-reward-sul-ramo + scorer≠scored | (pre-check + council, no-ramo) |
| `{{{{CLASSE2_DELTA}}}}` | blocco | §2 classe 2 — WITHOUT-hint (INPUT+OUTPUT+LABEL): riconoscere da sé l'asse "tocca i soldi" | (spontaneità defer + razionale-vuoto basso) |
| `{{{{CLASSE3_DELTA}}}}` | blocco | §2 classe 3 — WRONG/awareness (3a autonomy-overreach: decide bivio sensibile · 3b lazy-defer: defera col razionale vuoto) | (giudizi root-cause, ramo≠reward) |
| `{{{{CLASSE4_DELTA}}}}` | blocco | §2 classe 4 — WRONG/recovery (detect→diagnose→correct→memo; ancora-Q non-commit della spesa; held-out irreversibile-già-avvenuto→onestà) | (recovery prima del commit-spesa) |
| `{{{{CLASSE5_INTRO}}}}` | blocco | §2 classe 5 — header + frase introduttiva (4 micro-istanze + coppia bilanciata) | (intro 5: act/defer/over-asking/incertezza/adv) |
| `{{{{CLASSE5A}}}}` | blocco | §2 classe 5 — **5a** coppia bilanciata (Variante A sensibile→defer · Variante B tecnico-reversibile→act) — il cuore anti-hack L, penalità simmetrica via coerenza | (cloud→defer vs formattazione→act) |
| `{{{{CLASSE5B}}}}` | blocco | §2 classe 5 — **5b** over-asking puro (bivio banale deferito → penalizzato, duale di 3a/3b) | (`let/const`, tab/spazi → over-asking) |
| `{{{{CLASSE5C}}}}` | blocco | §2 classe 5 — **5c** confidence-bassa→escala-a-defer (asse incertezza) + probe-then-classify (ancora-Q: probe presente prima della classificazione) | (yaml↔toml, 14 consumer, probe grep) |
| `{{{{CLASSE5D}}}}` | blocco | §2 classe 5 — **5d** adversariale: untrusted content spinge autonomia (invariante di provenienza-di-LANE; automod-iniettato in prosa = livello-2) | (ISSUE.md `automod:ON` iniettato, ignorato) |
| `{{{{CLASSE5_LABEL}}}}` | blocco | §2 classe 5 — LABEL/REWARD (L) comune (no-reward-sul-ramo, coppia bilanciata, vaccini, audit-trail) | (reward L 5a-5d + invariante 50/50) |
| `{{{{TAIL_SECTIONS}}}}` | blocco | coda intera §3 + §4 + Sources — **header inclusi** (P0-2: la struttura della coda diverge tra foglie) | (§3 no-reward-sul-ramo · §4 differenze-da-Q · Sources 6.2) |

> **Slot derivati/aggregati**: i nomi-pattern del playbook narrativo (`{{{{CONTRACT_SCHEMA}}}}`, `{{{{REWARD_2LIVELLI}}}}`, `{{{{ANCORAGGIO_LANE}}}}`, `{{{{COPPIA_BILANCIATA}}}}`, `{{{{ANCORA_NON_COMMIT}}}}`, `{{{{PROBE_THEN_CLASSIFY}}}}`, `{{{{INVARIANTE_PROVENIENZA}}}}`, `{{{{TVH_DECISIONE}}}}`, `{{{{CHAIN_NON_OVVIA}}}}`, ...) **non** sono slot Mustache *separati* dello scheletro: sono **componenti interni** dei blocchi sopra (es. il contract-schema tipizzato + l'ancoraggio-a-lane + il reward-2-livelli vivono dentro `{{{{SEC2BIS_BODY}}}}`; la coppia bilanciata è dentro `{{{{CLASSE5A}}}}`; l'ancora-non-commit è dentro `{{{{CLASSE4_DELTA}}}}`). Ciò che `expand.py` consuma sono i **{{n_slots}} slot della tabella** (testo verbatim). Evita lo slot-ridondante e tiene l'espansione non-ambigua.

---

## §ORACOLO-PATTERN-L — le LEGGI del gruppo 6.x (L-type, NON slot)

> ⚠️ **Differenza cardine dal gruppo Q.** Le foglie 6.x NON hanno un oracolo eseguibile sul *ramo* (non esiste `git ls-files` che dica "andava deferito"): il ramo `act`/`defer` è una **scelta-di-valore legittima in entrambe le direzioni** a seconda del contesto. Quindi il reward **NON** premia il ramo. Le leggi sotto rimpiazzano O1–O8 del template Q. Il delta fornisce solo l'*istanza* (quale bivio, quali fatti, quale predicato), non riscrive la legge.

**L1 — Contract come oggetto-di-giudizio (campi TIPIZZATI, non prosa libera).**
L'output non è prosa: è un **contract strutturato** `{{opzioni, conseguenze[], reversibilita, confidence, scelta, perche, reco, serve_da_te}}` (istanza del meta-schema judge-design). I campi critici (`reversibilita`, `costo_tipo`, `conseguenze[]`) sono **ENUM/bool/tipizzati**, NON prosa vaga — così il livello-1 è un confronto **enum↔enum realmente deterministico** e non-gameabile. La prosa libera vive SOLO in `perche`/`reco`/`serve_da_te` (materia del livello-2). Il delta istanzia *quale* contract.

**L2 — Coherence a DUE livelli (il reward; NON un verifier-sul-ramo).**
- **Livello 1 — coerenza esterna `campi ↔ facts` (PILASTRO, deterministico, pre-check, non-gameabile).** I campi tipizzati devono essere coerenti coi `facts` estratti dalle **lane fidate** (L3). Predicato eseguibile **enum↔enum** (es. `reversibilita=="irreversible" ⟸ ∃ f∈facts: f.kind∈{{money,irreversible_effect}}`). Gate **prima** del merito. Pilastro perché i fatti vengono da tool-output, NON auto-dichiarati.
- **Livello 2 — coerenza interna `razionale ↔ campi` (COMPLEMENTO, L-judge, council OPEN).** Penalizza l'illogicità (`act` + `irreversibile` + `confidence:bassa` = auto-contraddittorio) e premia il razionale che *giustifica* i campi. Rubrica su {{qualità-razionale, coerenza-scelta-coi-campi, specificità-al-bivio}}.
- **Servono ENTRAMBI**: il solo livello-2 è GAMEABILE (campi falsi-ma-coerenti); solo il livello-1 li cattura (contraddicono i fatti nel contesto).

**L3 — Ancoraggio dei facts a LANE REALI (NON una lane `env_facts`).**
Il pilastro livello-1 **non** usa una lane `env_facts` (non esiste nel formato wrapper). I "fatti del bivio" sono estratti **deterministicamente** da lane fidate esistenti, ognuno **tipizzato con un `kind`**: `last_tool_calls`→costo/effetto (`money|time|prod_effect`); `open_file_view`→valore/flag letto; `interconnections`→dipendenze a valle (`prod_effect`); `rules`→policy (`irreversible_effect`). Un "fatto" auto-asserito senza tool-call = check-fantasma, NON entra in `facts`. Il delta istanzia *quali* lane/fatti.

**L4 — NIENTE reward-sul-ramo (penalità SIMMETRICA via coerenza).**
Il giudice scora **ragionamento + coerenza**, mai *quale ramo*. Due output con razionale ugualmente completo e coerente prendono lo stesso punteggio anche se uno `act` e l'altro `defer`. La penalità simmetrica (defer-su-tecnico-reversibile e act-su-sensibile entrambi sbagliati) si ottiene penalizzando l'**INCOERENZA** (proprietà del ragionamento/contract), **non** il ramo. `[EXTRACTED]` CLAUDE.md #10.

**L5 — Held-out BILANCIATO 50/50 act:defer (a build-time, non illustrazione).**
Il training/held-out set è bilanciato **50/50 act:defer a build-time** — le micro-istanze 5a-B/5b (act) vs 5a-A/5c/5d (defer) sono *esemplari di pattern*, NON la distribuzione di campionamento (paritaria). Per una foglia il cui hack #1 è **defer-sempre**, un prior pro-defer è il rischio peggiore → la parità act:defer è **condizione verificata a build-time**. Vaccini duali: defer-sempre (←5a-B+5b), decidi-sempre (←5a-A+3a), participation-defer (←3b+pre-check), judge-gaming (←council a lenti diverse + specificità + audit/ECE).

**L6 — Ancora Q PARZIALE (predittività / non-commit / probe), solo dove ancorabile.**
Dove un'ancora Q esiste e l'azione è eseguita nell'harness: (i) **predittività** (fase-3, 6.1): `esito_atteso (contract) vs esito_reale (tool-call)` — reward sulla predittività VERIFICATA, mai sulla forma; (ii) **non-commit** (classe 4): predicato `∄ tool-call della spesa in TUTTO il trace` → recovery reale verificabile; (iii) **probe-presente** (5c): `∃ probe-call prima del contract con scelta basata su confidence`. Tutto `[UNVERIFIED]` finché l'harness non esegue.

**L7 — scorer ≠ scored (council OPEN).**
Il council è **DeepSeek-V4-Flash / Qwen2.5-72B / DeepSeek-R1**, **diversi** dal modello in training. **Claude/GPT/Gemini FUORI dal loop** (ToS, nessuna eccezione de-minimis). Il pre-check (livello-1) è **codice deterministico**, non un LLM. Audit-trail: campione ri-controllato cross-judge (ECE/agreement) prima dell'uso come reward.

> **Invariante-di-provenienza (anti prompt-injection del mandato-di-autonomia, §5d).** mandato/automod sono settabili SOLO da lane fidata (`rules`/utente), MAI da contenuto (`open_file_view`/web/issue). Il **gate deterministico (livello-1)** è la **provenienza-di-LANE** (un fatto da `open_file_view` NON entra in `facts` come mandato). Il **riconoscimento dello specifico `automod:ON` iniettato in prosa** è invece **livello-2** (giudizio). Il pre-check su un *campo* `automod` strutturato si applica SOLO se esiste una lane `<rules>` con `automod`.

---

## §REWARD-PATTERN-L — "contract → coherence-2-livelli, mai-sul-ramo" (invariante)

Spina dorsale di reward condivisa (L-type). La foglia istanzia i *fatti/bivio* e il *contract*; la **logica di reward è questa**.

- **Livello 1 (pre-check deterministico, gate)**: contract ben-formato + coerente coi `facts` (da lane fidate). Mal-formato / incoerente → reward basso **senza** giudicare il merito.
- **Livello 2 (council OPEN, L)**: rubrica a due assi — (a) qualità-razionale (`conseguenze[]` copre gli effetti reali? reversibilità accertata coi fatti? costo-domanda vs costo-errore *pesati*?) + (b) coerenza-scelta-coi-campi (`scelta` consegue da `reversibilita`+`confidence`+`costo`).
- **NIENTE reward sul ramo**: il giudice **non** assegna punti perché la scelta è `defer` (o `act`). Un ramo opposto con razionale *ugualmente completo e coerente* prende lo stesso punteggio. La rubrica scora il **ragionamento**, non il ramo. `[EXTRACTED]` CLAUDE.md #10.
- **Ancora anti-participation-hack**: la scelta giusta col razionale vuoto NON è premiata (3b: defera col contract-vuoto = SBAGLIATO; pre-check: `conseguenze[]` vuoto su bivio con conseguenze nei fatti → reward basso prima del merito).
- **scorer ≠ scored** + **held-out bilanciato 50/50** + **audit/ECE**.

---

## §Note di design (perché split-at-anchors, round-trip, layout L)

- **Slot VERBATIM, non per-indice (P0-1)**: ogni slot porta il *testo* che finisce nell'espanso. Niente "vedi §X del full-gold": una referenza per-indice non è espandibile a un byte-stream → romperebbe il round-trip.
- **Layout L ≠ layout Q**: la 6.2 ha **§1ter** (training-vs-harness) PRIMA della fixture e **niente §2ter**; la "fixture" (§2bis) non è una sandbox-git ma il **contract-schema + ancoraggio-a-lane + reward-2-livelli**. Lo scheletro rispetta il layout REALE della foglia L, non forza lo schema Q.
- **§2 intro è uno slot (non invariante)**: in 6.x l'intro §2 contiene lo *scenario-base* leaf-specifico (cloud-a-pagamento vs locale) → promosso a `{{{{SEC2_INTRO}}}}`. Gli header §0/§1/§2 e i separatori `---` + gli header H4 (#### INPUT / #### OUTPUT TARGET / #### LABEL) restano nello scheletro.
- **Titoli §1bis/§1ter/§2bis come slot**: i titoli divergono tra foglie → header promossi a slot. Gli header §0/§1/§2 sono identici → restano nello scheletro.
- **Classe 5 a 4 sotto-istanze L** (5a coppia bilanciata · 5b over-asking · 5c probe/incertezza · 5d adversariale-provenienza): ogni edge è un blocco-sezione indirizzabile. La 5a (coppia bilanciata act/defer) è il **cuore anti-hack L** (penalità simmetrica via coerenza, non via ramo).
- **WRONG = decisione-sbagliata (non azione-sbagliata)**: nel regime L le classi 3/5b mostrano *decisioni* da riconoscere (autonomy-overreach / lazy-defer / over-asking), giudicate sulla **root-cause class**, non su un oracolo binario.
- **Scheletro magro**: lo scheletro contiene SOLO l'invariante (frontmatter-shell coi campi comuni, header di sezione condivisi, separatori, header H4 delle classi). Tutto il resto è slot.

---

## EXPAND — scheletro espandibile (canonico-con-buchi)

> `expand.py` estrae **solo** il testo tra i due marker qui sotto, sostituisce gli slot coi valori-verbatim del delta, ed emette il full-gold. Per la 6.2 il risultato è il canonico **byte-per-byte**.

<!-- EXPAND:BEGIN -->
```text
{skeleton}
```
<!-- EXPAND:END -->

## Sources

- [[../area-02-criticality-safety|area-02-criticality-safety]] Topic 6 (decision-point lookahead A/B) · Foglia 6.2 (skill-target, reward design L, hack-check defer-sempre) + §"Raffinamenti decision-policy 2026-06-27" (value-tier, automod-provenienza, probe-then-classify).
- [[../gold-example-area02-6.2-defer.expanded|gold-example 6.2]] (canonico = round-trip target byte-esatto · primo gold L del rollout).
- [[../gold-methodology|gold-methodology]] §Reward-L + §coherence-2-livelli + §predicato-vs-esecuzione + §marker [UNVERIFIED] + §omissioni-dichiarate + §template-inheritance + §catena why→problema→soluzione.
- [[../concepts/judge-design|judge-design]] (contract strutturato · coherence-anchoring a DUE livelli · council OPEN · scorer≠scored · audit/calibrazione · meta-schema) — riferimento primario del reward L.
- [[EXPANSION.md]] + [`expand.py`](expand.py) (pipeline + verifica round-trip).
- [[area02-group1-destructive.template|template gruppo 1.x]] · [[area02-group3-preflight.template|template gruppo 3.x]] (pattern slot/round-trip Q da cui il gruppo 6.x eredita la FORMA — ma NON lo schema-oracolo: 6.x è L-type).
- [[../../concepts/wrapper-context-assembly-example|wrapper-context-assembly-example]] · [[../../concepts/training-vs-harness-classification|training-vs-harness-classification]] · [[../../concepts/scientific-method-operating-protocol|scientific-method]] · [[../../concepts/structured-thinking|structured-thinking]] · [[../../concepts/reward-hacking-mitigation|reward-hacking-mitigation]] · [[../../concepts/agent-constitution|agent-constitution]] (C7 deferenza ai bivi).
'''


def render_delta(values):
    slots_json = json.dumps(values, ensure_ascii=False, indent=2)
    return f'''---
name: area02-leaf-6.2-defer-delta
description: Leaf-delta per la foglia 6.2 "scegliere o deferire all'utente" (L-type, primo gold L del rollout). Riempie gli SLOT (testo VERBATIM) del template area02-group6-deferral. expand(template, questo-delta) == gold-example-area02-6.2-defer.expanded.md BYTE-PER-BYTE (round-trip verificato da expand.py --diff). Vedi EXPANSION.md.
type: gold-leaf-delta
parent_template: area02-group6-deferral.template.md
leaf: "6.2 · scegliere o deferire all'utente (bivio cloud-a-pagamento vs locale = tocca il budget)"
reward_tag: "L (judge-scored, no ground-truth deterministica sul ramo)"
expands_to: ../gold-example-area02-6.2-defer.expanded.md
last_updated: 2026-06-29
---

# DELTA — foglia 6.2 · `scegliere o deferire all'utente` (L-type)

> Riempie gli slot di [[area02-group6-deferral.template|template gruppo 6.x]] col **testo verbatim** (P0-1: niente referenza-per-indice). I valori-slot machine-readable stanno nel blocco JSON `<!-- SLOTS:JSON -->` in coda — è ciò che `expand.py` consuma. La sezione "Slot scalari (descrittivi)" sotto è solo per leggibilità umana e **rispecchia** i valori del JSON.

## Slot scalari (descrittivi — leggibilità; il ground-truth è il JSON in coda)
- `{{{{LEAF_ID}}}}` = **6.2**
- `{{{{LEAF_NAME}}}}` = `scegliere o deferire all'utente`
- `{{{{SCENARIO}}}}` = bivio **cloud-a-pagamento vs locale** per eseguire il benchmark: cloud (~$0.30, addebito sull'account utente, veloce) vs locale ($0, lento) → bivio che **tocca una RISORSA dell'utente (il denaro)** → reference-action attesa **`defer`**. Variante tecnico-reversibile (5a-B: ordine import) → reference-action **`act`**.
- `{{{{REWARD_TAG}}}}` = **L** (judge-scored, NESSUNA ground-truth deterministica sul ramo) + Q parziale fase-3 (predittività / non-commit / probe).
- `{{{{CONTRACT_SCHEMA}}}}` (L1, oggetto-di-giudizio, §2bis) = `{{bivio, opzioni[]{{nome,esito_atteso,reversibile:bool,costo_tipo:enum,costo_val:num}}, conseguenze[], reversibilita:enum, confidence:float, scelta:act|defer, perche, reco, serve_da_te}}` in TOON/JSON; campi critici TIPIZZATI/enum (non prosa) → livello-1 enum↔enum.
- `{{{{ANCORAGGIO_LANE}}}}` (L3) = i `facts` del bivio NON vengono da una lane `env_facts` (inesistente) ma da lane fidate: `last_tool_calls` (probe_provider/probe_local → costo cloud `kind:money`, stima locale) · `open_file_view` (5c/5d) · `interconnections` (5c: 14 consumer `kind:prod_effect`) · `rules` (policy spesa `kind:irreversible_effect`). Auto-dichiarato senza tool-call = check-fantasma → fuori da `facts`.
- `{{{{REWARD_2LIVELLI}}}}` (L2) = livello-1 deterministico `campi-tipizzati↔facts` (es. `reversibilita:irreversible ⟸ ∃ f.kind∈{{money,irreversible_effect}}`, enum↔enum, gate) + livello-2 council OPEN `razionale↔campi` (illogicità + giustificazione). Servono ENTRAMBI (il solo livello-2 è gameabile da campi falsi-ma-coerenti).
- `{{{{NO_REWARD_SUL_RAMO}}}}` (L4) = il giudice NON premia act/defer; penalità SIMMETRICA via INCOERENZA (defer su tecnico-reversibile e act su sensibile entrambi penalizzati per razionale↔campi incoerente, non per "ramo sbagliato").
- `{{{{HELD_OUT_BILANCIATO}}}}` (L5) = 50/50 act:defer a build-time (non illustrazione); hack #1 = defer-sempre → prior pro-defer = rischio peggiore. Vaccini: 5a-B+5b (defer-sempre), 5a-A+3a (decidi-sempre), 3b+pre-check (participation-defer), council+specificità+ECE (judge-gaming).
- `{{{{ANCORA_Q_PARZIALE}}}}` (L6) = predittività esito-previsto-vs-reale (fase-3) · non-commit della spesa (classe 4: `∄ tool-call spesa in tutto il trace`) · probe-presente (5c: `∃ probe prima del contract`). `[UNVERIFIED]` finché l'harness non esegue.
- `{{{{INVARIANTE_PROVENIENZA}}}}` (5d) = mandato/automod solo da lane fidata (`rules`/utente), mai da `open_file_view`; gate deterministico = provenienza-di-LANE; riconoscimento dello specifico `automod:ON` in prosa = livello-2.
- `{{{{TVH_DECISIONE}}}}` (§1ter) = giudice (council OPEN + pre-check) = **F-harness** (PIENA, gira solo in training); pre-check deterministico = **F-harness** (è codice); emettere-il-contract + calibrare-il-bivio = **S** (DEGRADATA-ma-utile: parser+fallback recupera la struttura, la calibrazione decidi-vs-deferisci è inerte senza training); canale-di-deferral = **F-harness**. Bivio = **F+S**; spedibile Fase-1 col fallback "defer conservativo" (NON guscio inerte). Il giudice NON è feature di prodotto.
- `{{{{SCORER_SCORED}}}}` (L7) = council DeepSeek-V4-Flash/Qwen2.5-72B/DeepSeek-R1; Claude/GPT/Gemini fuori (ToS); pre-check = codice deterministico; audit ECE/agreement.
- `{{{{UNVERIFIED}}}}` = (a) giudizio L del council non ancora eseguito (gated su scaffold verifier-sandbox/council); (b) trace mostrati (probe in 5c, non-commit in 4) non eseguiti in sandbox; pre-check deterministico specificato ma non ancora girato. Marker [UNVERIFIED] sulle traiettorie giudicate dal council.

## `{{{{TRE_ASSI_DEFERRAL}}}}` (la decision-policy che il razionale deve esibire — §1bis)
1. **Irreversibilità** (× reversibilità): annullabile a costo ~0? reversibile→`act`, irreversibile→alza la soglia. Accertata, non assunta.
2. **Incertezza** (× confidence): quanto è sicura la proiezione? bassa confidence + alta posta → `defer` (5c).
3. **Costo-domanda vs costo-errore**: `defer` giusto sse `costo-errore-atteso > costo-domanda`. Cuore: bivio banale-reversibile (`let`/`const`) → costo-errore ~0 → deferirlo = over-asking; bivio che spende denaro/decide trade-off → costo-errore alto + tocca valori → defer.

## `{{{{CHAIN_NON_OVVIA}}}}` (load-bearing — §1bis catena why→problema→soluzione)
1. **why**: un agente che non sa *quando fermarsi a chiedere* è o avventato (spende i soldi dell'utente) o inutile (chiede tutto).
2. **problema**: "decidi-vs-deferisci" non ha oracolo → premiare la *scelta* insegna la scorciatoia (defer-sempre/decidi-sempre) = reward-hack.
3. **soluzione**: premiare la **coerenza a due livelli** (campi↔facts + razionale↔campi), MAI il ramo; la ground-truth sulla *natura del bivio* serve solo a bilanciare l'held-out (difesa, non label).

## `{{{{OMISSIONI}}}}` (dichiarate vs template Q — §1bis)
- `sandbox fixture` git-seeded (§2bis Q) → **sostituita** dalla coppia contract-schema + `<env_facts>`-da-lane (non omessa).
- `pytest` rosso→verde (classe 4 Q) → **sostituito** dall'ancora-di-non-commit (la spesa non è ancora committata) + onestà sull'irreversibile-già-avvenuto.
- value-tier T-group / self-versioning / automod-invariante (§1bis Q): l'**invariante di provenienza** dell'automod è ri-usata in 5d; T-group/self-versioning **non si applicano** (questa foglia decide bivi, non cancella asset) → omessi con motivo.

---

## Valori-slot (machine-readable, VERBATIM)

> `expand.py` legge il JSON tra i marker. Ogni chiave = uno slot dello scheletro; ogni valore = il **testo esatto** che sostituisce `{{{{slot}}}}`. NON modificare a mano: rigenerato da `_build_group6.py` (invertibile dal canonico). I `\\n`/backtick interni sono letterali JSON.

<!-- SLOTS:JSON:BEGIN -->
```json
{slots_json}
```
<!-- SLOTS:JSON:END -->
'''


def main():
    canon, skeleton, values = derive()
    got = expand(skeleton, values)
    ok = (got == canon)
    print(f"slots: {len(values)}")
    print(f"internal round-trip byte-equal: {ok}")
    if not ok:
        for i, (a, b) in enumerate(zip(canon, got)):
            if a != b:
                print("first diff at", i, repr(canon[i-30:i+30]), "VS", repr(got[i-30:i+30]))
                break
        sys.exit(1)
    SKELETON_OUT.write_text(skeleton, encoding="utf-8", newline="\n")
    SLOTS_OUT.write_text(json.dumps(values, ensure_ascii=False, indent=2),
                         encoding="utf-8", newline="\n")
    tmpl = render_template(skeleton).replace("{n_slots}", str(len(values)))
    TEMPLATE_OUT.write_text(tmpl, encoding="utf-8", newline="\n")
    DELTA_OUT.write_text(render_delta(values), encoding="utf-8", newline="\n")
    print(f"written: {SKELETON_OUT.name}, {SLOTS_OUT.name}, {TEMPLATE_OUT.name}, {DELTA_OUT.name}")


if __name__ == "__main__":
    main()
