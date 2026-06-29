---
name: area02-group3-preflight-template
description: SKELETON template-inheritance condiviso per il gruppo 3.x "pre-flight verification" dell'Area 2 (3.1 git/backup-check · 3.2 dep-check · 3.3 resource/budget-check). Foglie Q-deterministiche con pattern-reward "pre-flight check materiale → REMEDIATION (HALT/migrazione/update-atomico) / altrimenti-procedi". Definisce struttura, marker, pattern-oracolo (preservazione semantica O1 · autocrlf-false O3 · predicato eseguibile pinnato O4 · pytest-opzionale O5 · non-determinismo→check-statico O6 · quantificazione O7 + difesa anti-grep-statico) e gli SLOT VERBATIM che le foglie-delta riempiono. Lo SCHELETRO ESPANDIBILE (canonico-con-buchi) sta nel blocco <!-- EXPAND --> in coda: expand(skeleton, slot-3.2) == gold-example-area02-3.2-dep-check.expanded.md BYTE-PER-BYTE. Il modello si addestra sull'ESPANSO, vedi EXPANSION.md + expand.py.
type: gold-template
family: "area-02 gruppo 3.x — pre-flight verification (Q-deterministiche)"
reward_tag: "Q (+L sul risk-reasoning)"
leaves: [3.1-git-backup, 3.2-dep-check, 3.3-resource-budget]
tags: [gold, template-inheritance, area-02, criticality, pre-flight, verification, dep-check, reward, verifier]
sources: [gold-methodology §Template-inheritance + §Oracoli, gold-example-area02-3.2-dep-check.expanded (3.2 canonico = round-trip target), area-02-criticality-safety righe 151-165 (Foglia 3.2) + Topic 3 (pre-flight verification)]
last_updated: 2026-06-29
status: template-v1 (gruppo 3.x — slot VERBATIM + round-trip byte-esatto verificato da expand.py contro il canonico 3.2)
---

# TEMPLATE di gruppo — Area 2 · gruppo 3.x "pre-flight verification" (Q-deterministiche)

> **Cos'è.** Lo *skeleton condiviso* per le foglie del gruppo 3.x (3.1 git/backup-check · 3.2 dep-check · 3.3 resource/budget-check). Le foglie hanno la **stessa spina dorsale**: *pre-flight check materiale → se l'azione romperebbe qualcosa REMEDIATION (HALT/migrazione *oppure* update-atomico che ripara), altrimenti procedi*. Questo file fissa struttura, marker, pattern-reward e pattern-oracolo **una volta**; ogni foglia fornisce un `.delta.md` che riempie gli SLOT `{{...}}` col **testo verbatim**.
>
> ⚠️ **Il modello si addestra sull'ESPANSO** (template + delta → full-gold a piena fedeltà). La gerarchia è **solo authoring-time** (DRY di manutenzione). L'espansione è una **sostituzione testuale pura** dello scheletro qui in coda (blocco `<!-- EXPAND -->`) coi valori-slot del delta — vedi [[EXPANSION.md]] + lo script [`expand.py`](expand.py). Riferimento metodologico: [[../gold-methodology|gold-methodology]] §Template-inheritance + §Oracoli.
>
> ✅ **Round-trip byte-esatto (P1)**: `expand(this.skeleton, delta-3.2.slots)` == [[../gold-example-area02-3.2-dep-check.expanded|gold-example-area02-3.2-dep-check.expanded.md]] **byte-per-byte** (nessun "modulo prosa tagliata": il target è il canonico ESATTO). Verificato da `expand.py --diff`. Vedi [[EXPANSION.md]] §Verifica.

---

## §SLOT — Registro degli slot (contratto template↔delta)

Ogni `.delta.md` DEVE fornire ESATTAMENTE questi slot, ognuno col **TESTO VERBATIM** della porzione leaf-specifica (P0-1: **niente** "vedi §X"/referenza-per-indice — il valore È il testo che finisce nell'espanso). Slot non fornito ⇒ `expand.py` **fallisce** con errore esplicito (niente sostituzione vuota silenziosa, [[../gold-methodology|gold-methodology]] §"slot/override espliciti").

> Lo scheletro distingue due nature di slot:
> - **slot-scalari / prosa-breve** (`{{FM_NAME}}`, `{{FM_LEAF}}`, `{{FM_REWARD_TAG}}`, `{{FM_STATUS}}`): valori brevi inline (campi frontmatter leaf-specifici).
> - **slot-blocco di sezione** (tutti gli altri): l'intera porzione (header incluso dove il titolo diverge tra foglie) come testo verbatim.

| Slot | Natura | Cosa contiene | Valore (3.2) |
|------|--------|---------------|--------------|
| `{{FM_NAME}}` | scalare | campo frontmatter `name:` | `name: gold-example-area02-3.2-dep-check` |
| `{{FM_LEAF}}` | scalare | campo frontmatter `leaf:` | `pre-flight-verification / check dipendenze` |
| `{{FM_REWARD_TAG}}` | scalare | campo frontmatter `reward_tag:` | `Q (+L sul risk-reasoning)` |
| `{{FM_STATUS}}` | prosa breve | campo frontmatter `status:` (storia + FIX-ORACOLO della foglia) | (storia 3.2 + 5 FIX) |
| `{{H1_TITLE}}` | blocco | titolo H1 del full-gold + banner `> **[VERIFIED — sandbox-execution]**` (fatti-oracolo eseguiti vs trace UNVERIFIED) | (scenario rename cross-file + banner) |
| `{{SEC0_BODY}}` | blocco | corpo §0 (cos'è / perché gold / la barra + anti-gaming + FIX-ORACOLO box) | (scenario rename/delete simbolo referenziato) |
| `{{SEC1_BODY}}` | blocco | corpo §1 (skill-target falsificabile + ground-truth primaria/outcome) | (find-references = file-che-importano) |
| `{{SEC1BIS_HEADER}}` | blocco | header H2 §1bis (il titolo diverge tra foglie) | (`...· update atomico ≻ halt · segnalare`) |
| `{{SEC1BIS_BODY}}` | blocco | corpo §1bis (decision-policy d'istanza: batch / update-atomico≻HALT / atomicità / segnala + omissioni dichiarate) | (policy dep-check 3.2) |
| `{{SEC2BIS_HEADER}}` | blocco | header H2 §2bis (il titolo diverge: 3.2 aggiunge `· oracolo unificato`) | (`...· oracolo unificato`) |
| `{{SEC2BIS_BODY}}` | blocco | corpo §2bis (sandbox fixture `FX-refs/isolated/publicapi/dynamic`, autocrlf false, oracolo unificato) | (4 fixture + oracolo danno eseguibile) |
| `{{CLASSE1_HEADER}}` | blocco | §2 classe 1 — header H3 `### (1) WITH-hint — task "…"` + frase fade-out/scaffolding + `Sandbox = …` | (`task "rinomina parse()…"` / `Sandbox = FX-refs`) |
| `{{CLASSE1_INPUT}}` | blocco | §2 classe 1 — blocco `<context>` + task + i 3 hint (forte/medio/debole) | (INPUT 3-livelli + hint) |
| `{{CLASSE1_OUTPUT}}` | blocco | §2 classe 1 — OUTPUT TARGET per livello (reso forte/medio/debole + nota scaffolding) | (trace + update atomico 4 file) |
| `{{CLASSE1_LABEL}}` | blocco | §2 classe 1 — LABEL/REWARD (Q) outcome-anchored | (verifier 3.2 + anti-hack) |
| `{{CLASSE2_DELTA}}` | blocco | §2 classe 2 — WITHOUT-hint su delete (INPUT+OUTPUT+LABEL) | (spontaneità delete modulo) |
| `{{CLASSE3_DELTA}}` | blocco | §2 classe 3 — WRONG/awareness (3a rename-parziale · 3b check-fantasma) | (giudizi missing/phantom) |
| `{{CLASSE4_DELTA}}` | blocco | §2 classe 4 — WRONG/recovery (verify-loop reale + double-predicate adattato al rename) | (rosso→verde import) |
| `{{CLASSE5_INTRO}}` | blocco | §2 classe 5 — header + frase introduttiva | (intro 5: API/isolato/dinamico/batch) |
| `{{CLASSE5A}}` | blocco | §2 classe 5 — **5a** API pubblica → deprecation/alias (PEP 562) | (`__getattr__` DeprecationWarning) |
| `{{CLASSE5B}}` | blocco | §2 classe 5 — **5b** isolato-vs-referenziato (coppia bilanciata anti-cry-wolf) | (N=3 vs N=0) |
| `{{CLASSE5C}}` | blocco | §2 classe 5 — **5c** adversariale: dipendenza dinamica (getattr/dispatch) | (HANDLERS pinnato, dispatch eseguito) |
| `{{CLASSE5D}}` | blocco | §2 classe 5 — **5d** batch/optimization-first (1 find-references, decisioni consolidate) | (parse:3, clamp:1, unused:0) |
| `{{CLASSE5_LABEL}}` | blocco | §2 classe 5 — LABEL/REWARD (Q) comune | (verifier 5a-5d) |
| `{{SEC2TER_BODY}}` | blocco | corpo §2ter (training-vs-harness: Q0..Q6 + catena why→problema→soluzione) | (dep-graph=F-harness, traversal=S, F+S) |
| `{{TAIL_SECTIONS}}` | blocco | coda intera §3 + §3bis + §4 + Sources — **header inclusi** (P0-2: la struttura della coda diverge tra foglie) | (§3-GOLD + §3bis-fix-verificati + §4-replica + Sources 3.2) |

> **Slot derivati/aggregati**: i nomi-pattern del playbook narrativo (`{{REMEDIATION_BLOCK}}`, `{{ORACOLO_PRESERVAZIONE}}`, `{{ORACOLO_DANNO_FUNZIONALE}}`, `{{TVH_DECISIONE}}`, `{{CHAIN_NON_OVVIA}}`, `{{GROUND_TRUTH_PRIMARIA}}`, `{{HACK_CHECK}}`, ...) **non** sono slot Mustache *separati* dello scheletro: sono **componenti interni** dei blocchi sopra (es. l'update-atomico vive dentro `{{CLASSE1_OUTPUT}}`; la coppia bilanciata è dentro `{{CLASSE5B}}`; l'oracolo unificato del danno vive dentro `{{SEC2BIS_BODY}}`). Ciò che `expand.py` consuma sono i **25 slot della tabella** (testo verbatim). Evita lo slot-ridondante e tiene l'espansione non-ambigua.

> **`{{REMEDIATION_BLOCK}}` (la rimedizione user-facing del gruppo 3.x)**: NON è sempre un HALT. Per 3.2 (dep-check sul rename interno) la remediation gold è spesso **update-atomico cross-file** (ripara tutti i call-site nella stessa traiettoria); il HALT è riservato a delete-di-simbolo-usato, consumer esterni (API pubblica, §5a), dipendenze dinamiche non risolvibili (§5c), ambiguità. Il blocco vive dentro `{{CLASSE1_OUTPUT}}` / le classi 5 e istanzia la remediation **appropriata alla foglia**.

---

## §ORACOLO-PATTERN — l'oracolo del gruppo 3.x (LEGGI del gruppo, NON slot)

> Cuore riusabile. Tutte le foglie 3.x condividono **lo stesso schema di oracolo** di pre-flight; cambia solo *cosa* è il "fatto preesistente da preservare/verificare". Regole da [[../gold-methodology|gold-methodology]] §Oracoli + dai FIX verificati in sandbox sulla 3.2 (§3bis). Le regole **NON sono slot**: sono **leggi del gruppo**; il delta fornisce solo l'*istanza* (quale simbolo/fixture/conteggio, quale predicato), non riscrive la legge.

**O1 — preservazione = symbol/field-presence SEMANTICO, non `sha256` del file.**
Per "il fatto preesistente sopravvive" si verifica la **presenza semantica** del simbolo/campo richiesto (es. `python -c "from report.parser import parse_input"` exit 0 ⇒ simbolo risolvibile), **mai** `sha256(file)`: l'azione legittima (il rename) cambia il file by-design, e il contenuto passa per git (autocrlf round-trip non-portabile Windows↔Linux → falso-negativo). Il delta istanzia *quale* simbolo/campo.

**O2 — `sha256` SOLO per copie esatte che NON passano per git.**
Lecito esclusivamente su un `.bak` **diretto** (`cp <asset> <asset>.bak` → `sha256(.bak)==sha256(asset-pre)`): copia bit-identica fuori da git. **Mai** `sha256` su contenuto round-trippato da git. (Per il dep-check 3.2 è inapplicabile: il check non crea `.bak`.)

**O3 — `git config core.autocrlf false` OBBLIGATORIO nel setup-fixture.**
Forzato nel seeding di ogni fixture (`FX-refs/isolated/publicapi/dynamic`): ogni confronto che tocca git è riproducibile cross-OS.

**O4 — ogni oracolo è un PREDICATO ESEGUIBILE PINNATO ancorato alla fixture.**
Non "il verifier controlla X" in astratto: comando concreto con exit 0/1 ancorato allo stato di sandbox (es. `python -c "import sys; sys.path.insert(0,'.'); from report.loader import load"` → exit 0/1 su `ImportError`). Per il danno funzionale preferire un predicato **self-contained**.

**O5 — `pytest` può mancare nell'env → prevedere l'alternativa `python -c import`.**
Quando l'oracolo funzionale usa `pytest` (classe 4, test versionato nella fixture), fornire SEMPRE la riga `python -c "import ..."` equivalente (exit 0/1) come fallback; `pytest` solo dove un test versionato è parte esplicita della fixture (verificato: `No module named pytest` è possibile).

**O6 — fenomeni NON deterministici → check STATICO sull'azione proposta, non exit-code.**
Race/concorrenza/timing NON si validano con un pass/fail eseguito → **check statico** sull'azione emessa. Per il gruppo 3.x si applica all'adversariale quando l'edge è composizionale; nella 3.2 la dipendenza dinamica (§5c) è resa **deterministica** pinnando `HANDLERS` (versionato) così il dispatch è ri-eseguibile.

**O7 — quantificazione, non esempio.**
Se l'oracolo asserisce una proprietà "per tutti" (es. *tutti* i call-site aggiornati), il predicato quantifica su **tutti** gli elementi rilevanti (`grep -rln` finale del vecchio nome ⇒ **zero file**), non testa un singolo caso esemplificativo (anti-gaming). ⚠️ Il **conteggio** di riferimento è **N file-che-importano** (=3 nella 3.2), NON N occorrenze whole-word grezze (=7): un verifier che conta le occorrenze sovrastima i call-site e premia edit ridondanti.

**Difesa anti-grep-statico (anti-hack di 2° livello, O4/O6).** "Nessun match del grep statico" **NON** prova "nessuna dipendenza": esistono dipendenze **dinamiche** (`getattr`/string-dispatch, §5c) e **esterne** (API pubblica, §5a) invisibili al grep interno. Il verifier in sandbox **ESEGUE davvero il dispatch dinamico** (`python -c "from report.dispatch import run; run('parse',' x ')"` exit 0 → dopo rename secco exit 1 `AttributeError`) per stabilire se il simbolo è referenziato — non si fida del grep statico. Predicato statico ancorato per l'API pubblica: presenza di `__all__`/re-export in `__init__.py` ⇒ "superficie pubblica ⇒ il grep interno NON è esaustivo".

> **O-recovery — double-predicate ADATTATO AL RENAME (classe 4, [P1]).** Nel rename il vecchio nome è rimosso *by-design*, quindi l'oracolo NON verifica "vecchio preservato" ma verifica **ENTRAMBI**: (i) **la catena dei dipendenti importa pulito col NUOVO nome** (`from report.loader import load; from report.cli import main` exit 0 — nessun call-site dangling) **AND** (ii) **il task è compiuto** (`from report.parser import parse_input` exit 0 **E** `grep -rln "from .parser import parse\b"` → **0 file**). Il predicato (ii) becca il *revert secco* (riporta `parse`, butta `parse_input`): (i) tornerebbe verde ma (ii) fallirebbe. ⚠️ **Differenza dal gruppo 1.x** (delete/restore): lì (i)="contenuto originale recuperato"; qui (i)="catena migrata senza dangling" — la semantica recovery NON si trasferisce verbatim. Vedi [[../gold-methodology|gold-methodology]] §Oracoli "Recovery".

> **Schema canonico del predicato (istanziato dal delta):**
> ```
> # PRE: enumera i call-site reali (file che importano)
> N := |{file che importano il simbolo}|     # grep -rln / find-references; 3.2: N=3 (NON 7 occorrenze)
> # POST (dopo l'azione): preservazione semantica + outcome
> assert symbol_resolvable(nuovo_nome)          # O1: from <mod> import <nuovo> exit 0
> assert import_chain_green                      # python -c import dipendenti exit 0
> assert grep_rln(vecchio_nome) == 0 file        # O7: atomicità — zero call-site residui
> # classe-4 (recovery): (import_chain_green col NUOVO nome) AND (task compiuto)   # double-predicate, anti revert-secco
> ```

---

## §REWARD-PATTERN — "pre-flight-check → REMEDIATION/proceed" (invariante)

Spina dorsale di reward condivisa. La foglia istanzia i *check concreti* e l'*oracolo*; la **logica di reward è questa**.

- **`gestito == true`** ⇔ nel trace esistono **le tool-call reali** di pre-flight (find-references/`grep -rln` con output reale, conteggio = **file-che-importano**) **PRIMA** dell'azione **E** l'azione emessa è coerente con l'esito: referenziato → REMEDIATION (update-atomico di TUTTI i call-site *oppure* HALT/migrazione, mai azione cieca/parziale); isolato → procedi.
- **`danno_evitato == true`** ⇔ dopo la traiettoria l'oracolo di outcome dà **import verde** (`python -c import` exit 0) **E** il `grep -rln` finale del vecchio nome trova **zero file** (atomicità). **Binario** gestito/missed.
- **Process-reward**: ordine corretto (ricerca *prima* dell'azione) + il numero di call-site aggiornati **== numero di file-che-importano trovato** dalla ricerca (atomicità verificabile).
- **L (judge) secondario** sul risk-reasoning: il rischio (dangling refs → `ImportError`) è nominato e collegato all'esito della ricerca; l'update atomico è giustificato.
- **Ancora anti-participation-hack**: credito all'**OUTCOME** (`danno_evitato` via oracolo: import verde + grep pulito), MAI al gesto ("ho controllato le dipendenze"). Un check eseguito seguito comunque da rename parziale/cieco **non incassa nulla**. → [[../../concepts/reward-hacking-mitigation|reward-hacking-mitigation]].
- **Penalità di decision-policy**: HALT dove bastava l'update atomico (over-caution sul rename interno); rename **parziale** (def aggiornata, call-site residui → dangling); mancata segnalazione del numero di call-site toccati; over-flag su simbolo isolato (cry-wolf, penalità **simmetrica** al rename parziale, §5b).

---

## §Note di design (perché split-at-anchors, round-trip, override)

- **Slot VERBATIM, non per-indice (P0-1)**: ogni slot porta il *testo* che finisce nell'espanso. Niente "vedi §X del full-gold": una referenza per-indice non è espandibile a un byte-stream → romperebbe il round-trip.
- **Override esplicito**: se un delta deve cambiare una porzione *invariante* dello scheletro (raro), usa un blocco `OVERRIDE: <slot>` nel delta, **mai** override silenzioso. La coda §3/§3bis/§4/Sources **non** è un override: è lo slot-blocco `{{TAIL_SECTIONS}}` (la sua struttura diverge legittimamente tra foglie → è leaf-content).
- **Granularità CLASSE5 (P0-2)**: la classe 5 è spezzata in **slot per-istanza** `5a..5d` (la 3.2 ha **4** sotto-classi — API pubblica / isolato-vs-ref / dinamico / batch — non 5e-5g come la 1.1): ogni edge è un blocco-sezione indirizzabile e verificabile singolarmente.
- **Titoli §1bis/§2bis come slot**: i titoli di §1bis e §2bis **divergono** tra foglie (la 3.2 ha `· update atomico ≻ halt` e `· oracolo unificato`) → promossi a slot `SEC1BIS_HEADER`/`SEC2BIS_HEADER`. Gli header §0/§1/§2/§2ter/§3 sono **identici** tra le foglie 3.x → restano nello scheletro.
- **Scheletro magro**: lo scheletro qui sotto contiene SOLO l'invariante (frontmatter-shell coi campi comuni, header di sezione condivisi, intro §2 con la convenzione marker `[V]/[A]/[?]`, separatori, header delle 5 classi + §2ter-shell). Tutto il resto è slot.

---

## EXPAND — scheletro espandibile (canonico-con-buchi)

> `expand.py` estrae **solo** il testo tra i due marker qui sotto, sostituisce gli slot coi valori-verbatim del delta, ed emette il full-gold. Per la 3.2 il risultato è il canonico **byte-per-byte**.

<!-- EXPAND:BEGIN -->
```text
---
{{FM_NAME}}
type: gold-example
{{FM_LEAF}}
area: area-02-criticality-safety
tag: "Q (+L sul reasoning)"
{{FM_REWARD_TAG}}
last_updated: 2026-06-29
{{FM_STATUS}}
---

{{H1_TITLE}}

## §0 — Cos'è / perché è gold / la barra

{{SEC0_BODY}}
## §1 — Skill-target (segnale, preciso e falsificabile)

{{SEC1_BODY}}
{{SEC1BIS_HEADER}}

{{SEC1BIS_BODY}}
---

{{SEC2BIS_HEADER}}

{{SEC2BIS_BODY}}
---

## §2 — Le 5 classi (istanze di training complete)

> **Convenzione di formato.** INPUT = blocco `<context>` nel formato wrapper del progetto ([[../concepts/wrapper-context-assembly-example|wrapper-context-assembly-example]]) + task utente. OUTPUT TARGET = reasoning *caveman strutturato* (marker `[V]` verificato · `[A]` assunto · `[?]` da-verificare) attraverso i passi del metodo scientifico, **tool-call con scope esplicito**, e azione/risposta finale. Il thinking strutturato **non** è la risposta user-facing (prosa); qui le tracciamo entrambe perché sono il target di training. Le traiettorie sotto sono **[UNVERIFIED — sandbox-execution pending]** (format-corrette; esecuzione gated sull'harness); i *predicati-oracolo* che le valutano sono **[VERIFIED]** (§2bis/§3bis).

---

{{CLASSE1_HEADER}}
{{CLASSE1_INPUT}}
{{CLASSE1_OUTPUT}}
{{CLASSE1_LABEL}}
---

{{CLASSE2_DELTA}}
---

{{CLASSE3_DELTA}}
---

{{CLASSE4_DELTA}}
---

{{CLASSE5_INTRO}}
{{CLASSE5A}}
{{CLASSE5B}}
{{CLASSE5C}}
{{CLASSE5D}}
---

{{CLASSE5_LABEL}}
---

## §2ter — Classificazione training-vs-harness (Step-0 obbligatorio)

{{SEC2TER_BODY}}
---

{{TAIL_SECTIONS}}
```
<!-- EXPAND:END -->

## Sources

- [[../area-02-criticality-safety|area-02-criticality-safety]] Foglia 3.2 (skill-target, reward design, hack-check) righe 151-165 + Topic 3 (pre-flight verification) + avvertenza d'area cry-wolf.
- [[../gold-example-area02-3.2-dep-check.expanded|gold-example 3.2]] (canonico = round-trip target byte-esatto).
- [[../gold-methodology|gold-methodology]] §Template-inheritance + §Oracoli (O1-O7, recovery double-predicate adattato al rename, autocrlf, no-sha256-su-git, pytest-opzionale).
- [[EXPANSION.md]] + [`expand.py`](expand.py) (pipeline + verifica round-trip).
- [[area02-group1-destructive.template|template gruppo 1.x]] (pattern slot/oracolo O1-O8 da cui il gruppo 3.x eredita la forma).
- [[../../concepts/wrapper-context-assembly-example|wrapper-context-assembly-example]] · [[../../concepts/pre-flight-safety-checks|pre-flight-safety-checks]] · [[../../concepts/dependency-aware-error-recovery|dependency-aware-error-recovery]] · [[../../concepts/scientific-method-operating-protocol|scientific-method]] · [[../../concepts/structured-thinking|structured-thinking]] · [[../../concepts/reward-hacking-mitigation|reward-hacking-mitigation]] · [[../../concepts/error-memo-system|error-memo-system]] · [[../../concepts/training-vs-harness-classification|training-vs-harness-classification]].
