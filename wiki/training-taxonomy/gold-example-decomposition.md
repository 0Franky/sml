---
name: gold-example-decomposition
description: Esempio GOLD di training data per la skill cognitiva hierarchical-decomposition (pensare per fattorizzazione — problema generale → invariante-core + assi-di-specializzazione → foglie che ricompongono senza ridondanza). Scenario portante VERIFICABILE — rifattorizzare N funzioni quasi-identiche (handler di export CSV/JSON/XML) in una gerarchia base+specializzazioni, dove il reward è ancorato a un oracolo deterministico (test verdi + zero duplicazione misurata). Tutte e 5 le classi con INPUT (formato wrapper) / OUTPUT TARGET (reasoning [V]/[A]/[?] osservare→orientare→pianificare→verificare + decomposizione strutturata <decomposition>) / LABEL-REWARD (oracolo eseguibile + hack-check anti over-decomposition + scorer≠scored).
type: gold-example
leaf: "hierarchical-decomposition / fattorizzazione generale→assi→foglie"
area: area-03-reasoning-scientific-method
reward_tag: "Q-DOMINANTE (rifattorizzazione verificabile: coverage+detector+invariante tutti eseguibili). L SOLO per la generalizzazione §4 — decomposizione progettuale non-materializzabile in codice. NON L sulla prosa del mapping (judge-gaming)."
last_updated: 2026-07-06
status: gold-draft (autore verticale; review-loop agnostico pending) — [UNVERIFIED — format-only, sandbox-execution pending]
---

# GOLD — skill `hierarchical-decomposition` · scenario *rifattorizza N handler quasi-identici*

## §0 — Cos'è / perché è gold / la barra

Questo file è l'**esempio-gold di training data** per la skill cognitiva [[../concepts/hierarchical-decomposition|hierarchical-decomposition]]: di fronte a un problema generale da specializzare, **fattorizzarlo** come `core` invariante + `axes` di variazione + `leaves` concrete, e verificare che le foglie **ricompongano** il generale **senza ridondanza**. È la stessa struttura del template-inheritance con cui scriviamo i gold ([[gold-methodology]] §template-inheritance), **promossa a capacità del modello** — connessione ricorsiva: insegniamo a fattorizzare con gold fattorizzati. [EXTRACTED dall'idea utente 2026-06-29, msg 284]

Lo scenario portante è **VERIFICABILE per costruzione**: tre handler di export (`export_csv`, `export_json`, `export_xml`) condividono ~80% del corpo (validazione input, ordinamento righe, scrittura su file) e differiscono solo nella **serializzazione**. Il task: rifattorizzarli in una gerarchia `base + specializzazioni`. La decomposizione è BUONA **sse**, espandendo le foglie (i tre serializzatori), si **ricopre** il comportamento originale: (a) i test esistenti restano **verdi** (coverage — oracolo `pytest` deterministico; becca anche un pezzo format-specifico messo nel core, es. `json.dumps` → `test_csv` rosso); (b) la **duplicazione è 0** (non-ridondanza — oracolo deterministico pinnato `pylint duplicate-code`); (c) ciò che è nel `core` è davvero comune a **tutti** i tre handler (invariante-corretto — mutation-probe quantificato `∀ stmt∈core`: spostare un qualunque statement del core in una foglia rompe un test cross-formato; cattura anche l'elemento-non-comune *sottile* che non spezza i test esistenti). La barra: queste sono **istanze di training reali**, con oracolo che ispeziona lo **stato eseguibile** (test + misura-duplicazione), non il testo che dichiara "ho fattorizzato bene".

> ⚠️ **Anti-over-decomposition first-class** (proporzionalità, CLAUDE.md #10 + concept §⚠️): il dataset bilancia il caso *fattorizzabile* (3 handler con core reale → decomporre è giusto) con due casi negativi nella classe **OTHER** — (5a) **problema banale** (una sola funzione di 4 righe → decomporla in gerarchia = overhead, reward BASSO) e (5b) **falso-invariante adversariale** (tre funzioni che *sembrano* avere un core comune ma NON ce l'hanno → forzare un'astrazione comune produce coupling errato). Così **produrre 3 heading core/axes/leaves NON è premiato di per sé**: è premiato solo l'outcome (la fattorizzazione corretta e ricomponibile, o il riconoscimento che NON va fatta). Scorer ≠ scored.

> **[UNVERIFIED — format-only, sandbox-execution pending]**: gli output `pytest` / misura-duplicazione mostrati sono **format-only**; l'esecuzione reale è gated sullo scaffold verifier-sandbox ([[../decisions/2026-06-23-pi-harness-base]]). I bug di ragionamento sugli oracoli sono stati corretti a mano ora; l'esecuzione cattura il resto.

## §1 — Skill-target (segnale, preciso e falsificabile)

> Di fronte a un problema generale da specializzare, il modello produce una **decomposizione fattorizzata** in tre parti — `core` (l'invariante condiviso da TUTTE le foglie), `axes` (gli assi di variazione lungo cui si specializza), `leaves` (le specializzazioni concrete) — e **verifica la ricomposizione**: espandendo le foglie si riottiene il problema generale **completamente** (coverage) e **senza sovrapposizioni** (non-ridondanza). Decide **se** fattorizzare (complessità sufficiente) o risolvere diretto (proporzionalità).

**Classificazione training-vs-harness della foglia** ([[../concepts/training-vs-harness-classification|playbook]]):
- **S (skill nei pesi)** — il *decidere come fattorizzare* (riconoscere il core invariante, identificare gli assi, derivare le foglie, riconoscere quando NON decomporre) è ragionamento: stato-senza-training **DEGRADATA-MA-UTILE** (il base decompone in modo flat/sequenziale ma non fattorizza in modo affidabile). È la metà dominante.
- **piccola F-scaffold (harness)** — uno scaffold di output `<decomposition>` con campi `core`/`axes`/`leaves` **struttura la forma** ma NON sostituisce il ragionamento (F-harness, stato PIENA: la grammar è banale). Riduce il carico di training sul formato, non sulla semantica. ⚠️ La forma `<decomposition>` da sola NON è la skill (vedi hack-check): un guscio ben-formato con fattorizzazione sbagliata → reward basso.

**Falsificabile** perché, nello scenario portante: la decomposizione è materializzata in **codice** (la gerarchia rifattorizzata) e la ricomposizione è un **fatto eseguibile** — `pytest` verde/rosso (coverage), `pylint duplicate-code` 0/>0 blocchi (non-ridondanza), mutation-probe `∀ stmt∈core` (invariante-corretto). Tag **Q-DOMINANTE** (i tre oracoli sono tutti eseguibili nello scenario portante); **L** SOLO per la generalizzazione §4 (decomposizione *progettuale* non-materializzabile in codice), giudizio su coverage/non-ridondanza/invariante secondo [[../concepts/judge-design|judge-design]]. Curriculum: fase **2** (esercizi con fade-out) + **3** (RL-agentico nell'harness, dove la rifattorizzazione ha test veri). Riferimenti: [[../concepts/hierarchical-decomposition|hierarchical-decomposition]], [[../concepts/structured-thinking|structured-thinking]] (marker `[V]/[A]/[?]`), [[../concepts/scientific-method-operating-protocol|scientific-method]] (observe→orient→plan→verify), [[../concepts/reward-hacking-mitigation|reward-hacking-mitigation]].

## §2bis — Sandbox fixture (riproducibilità del verifier)

> Il verifier è deterministico **solo se lo stato di sandbox è fixturizzato**. Spec di seeding comune; ogni classe cita la sola differenza.

**Fixture base `FX-export` (classi 1, 2, 3, 4):** repo Python con tre handler quasi-identici + i loro test versionati.
```
exporters.py:
  def export_csv(rows, path):
      if not rows: raise ValueError("empty")          # validazione (comune)
      rows = sorted(rows, key=lambda r: r["id"])       # ordinamento (comune)
      body = "\n".join(",".join(str(r[k]) for k in r) for r in rows)   # serializza CSV (specifico)
      with open(path, "w") as f: f.write(body)         # scrittura (comune)
  def export_json(rows, path):
      if not rows: raise ValueError("empty")          # validazione (comune)
      rows = sorted(rows, key=lambda r: r["id"])       # ordinamento (comune)
      body = json.dumps(rows)                           # serializza JSON (specifico)
      with open(path, "w") as f: f.write(body)         # scrittura (comune)
  def export_xml(rows, path):
      if not rows: raise ValueError("empty")          # validazione (comune)
      rows = sorted(rows, key=lambda r: r["id"])       # ordinamento (comune)
      body = "<rows>" + "".join(                        # serializza XML (specifico)
          "<row>" + "".join(f"<{k}>{r[k]}</{k}>" for k in r) + "</row>" for r in rows
      ) + "</rows>"
      with open(path, "w") as f: f.write(body)         # scrittura (comune)

# fixture data (versionati con i test):
ROWS = [{"id": 2, "name": "b"}, {"id": 1, "name": "a"}]
ROWS_SORTED = [{"id": 1, "name": "a"}, {"id": 2, "name": "b"}]
EXPECTED_CSV = "1,a\n2,b"
EXPECTED_XML = "<rows><row><id>1</id><name>a</name></row><row><id>2</id><name>b</name></row></rows>"

tests/test_exporters.py  (VERSIONATO, importa i 3 handler):
  def test_csv():  export_csv(ROWS, "/tmp/o.csv");  assert open("/tmp/o.csv").read() == EXPECTED_CSV
  def test_json(): export_json(ROWS, "/tmp/o.json"); assert json.load(open("/tmp/o.json")) == ROWS_SORTED
  def test_xml():  export_xml(ROWS, "/tmp/o.xml");  assert open("/tmp/o.xml").read() == EXPECTED_XML
  def test_empty_raises_all():  # invariante: TUTTI alzano su input vuoto
      for fn in (export_csv, export_json, export_xml):
          with pytest.raises(ValueError): fn([], "/tmp/x")
```
Stato risultante atteso:
- **oracolo coverage** = `python -m pytest tests/ -q` → tutti **verdi** (deve restare verde dopo la rifattorizzazione). Cattura anche il caso **3a** (un pezzo format-specifico nel core, es. `json.dumps`): il `test_csv`/`test_xml` diventa **rosso** perché l'output cambia — la collocazione-errata-nel-core è un fallimento di **coverage**, non del mutation-probe.
- **oracolo non-ridondanza** = detector **deterministico pinnato** `pylint --disable=all --enable=duplicate-code --min-similarity-lines=N exporters.py` (N = iperparametro di dataset, default **4**, ablabile) → **0 blocchi duplicati** dopo la rifattorizzazione. Stato dichiarato **pre → post**: prima `3` blocchi (validazione+ordinamento+scrittura ripetuti ×3) → dopo `0`.
- **oracolo invariante-corretto (mutation-probe, quantificato su TUTTO il core)** = `INVARIANTE_NEL_CORE := ∀ stmt ∈ core: muovere(stmt → leaf_k) ⇒ ∃ test_j (j≠k) che fallisce`. Per ogni statement del core, spostandolo in UNA foglia, deve esistere un test di **un'altra** foglia che si rompe. Un core-statement che, spostato in una foglia, **non** rompe nessun test cross-formato → non è davvero comune → **fallisce** l'invariante (è un branch morto / un elemento non-realmente-condiviso infilato nel core). NB: questo probe è ortogonale al coverage — serve per il caso *sottile* (elemento-non-comune che NON rompe i test esistenti), non per 3a (che il coverage già becca).

**Fixture `FX-trivial` (held-out 5a):** un solo `exporters.py` con **una** funzione di 4 righe (`def export_csv(rows, path): ...`), nessun duplicato, nessun secondo formato. Stato: `pytest` verde; detector-duplicazione → già 0.

**Fixture `FX-false-invariant` (held-out 5b adversariale):** tre funzioni **`decode_iso_date`, `decode_user_id`, `decode_currency`** (nominalmente distinte dai serializzatori di §4 "parser multi-formato", che sono casi-test di partizione) con **stessa firma** `decode(s: str) -> X` e nomi che suggeriscono un "decoder comune", ma corpi **semanticamente disgiunti** (regex/logica/range completamente diversi, nessun blocco condiviso). Stato: `pylint duplicate-code` → **0 blocchi condivisi** (prova che NON c'è core estraibile). Predicato anti-gaming sull'astrazione forzata: `bodies_non_triviali(post) == bodies_non_triviali(pre)` — il numero di **corpi non-banali** (metodi con statement reali, esclusi `pass`/`...`/default-method ereditati) non deve aumentare. Un tentativo di astrazione comune (`class BaseDecoder` con metodo template, o un `Protocol` con **default-method** che gamerebbe la lettera "nessun BaseParser") aggiunge ≥1 corpo non-banale a fronte di zero fattorizzazione reale → **viola il predicato**.

> **Oracolo di ricomposizione (definito UNA volta, riferito dalle classi):**
> `RICOMPONE(decomp) := pytest(tests/) tutti-verdi  AND  pylint_duplicate_code(min-similarity-lines=N)(post) == 0 blocchi  AND  INVARIANTE_NEL_CORE`
> dove `INVARIANTE_NEL_CORE := ∀ stmt ∈ core: muovere(stmt → leaf_k) ⇒ ∃ test_j (j≠k) che fallisce` (quantificazione su TUTTI gli statement del core, non un singolo pezzo esemplificativo → non gameabile lasciando il pezzo-noto nel core).
> Predicato eseguibile, ancorato alla fixture (detector pinnato, soglia `N` iperparametro ablabile). Dove non c'è ground-truth eseguibile (decomposizione *progettuale* non ancora materializzata in codice) → giudizio **L** su `coverage ∧ non-ridondanza ∧ invariante-corretto` (council OPEN, [[../concepts/judge-design|judge-design]]).

---

## §2 — Le 5 classi (istanze di training complete)

> **Convenzione di formato.** INPUT = blocco `<context>` nel formato wrapper ([[../concepts/wrapper-context-assembly-example|wrapper-context-assembly]]) + task. OUTPUT TARGET = reasoning *caveman strutturato* (`[V]` verificato · `[A]` assunto · `[?]` da-verificare) lungo observe→orient→plan→verify, **+ una `<decomposition>` strutturata** (campi `core`/`axes`/`leaves`), + azione (la rifattorizzazione) e risposta in prosa. La `<decomposition>` è lo scaffold F-harness; il ragionamento che la riempie è la skill S.

---

### (1) WITH-hint — "rifattorizza i 3 export" preceduto dallo scaffold · 3 livelli

Stessa **task family** per i 3 livelli (forte→medio→debole): cambia solo lo scaffold nel prompt; skill-target e output corretto sono **invarianti** (stessa `<decomposition>`, stessa gerarchia, stessi test verdi). Sandbox = `FX-export`.

#### INPUT (comune ai 3 livelli, cambia solo la riga `<hint>`)
```xml
<context>
<temporal> now: 2026-06-29T09:00:00Z · session_elapsed: 3m </temporal>
<rules> 1. code MUST be production ready · 2. preserva il comportamento osservabile (i test devono restare verdi) </rules>
<current_aim> ridurre la duplicazione negli exporter </current_aim>
<task_list> [>] T1 rifattorizza export_csv/json/xml in una gerarchia base+specializzazioni </task_list>
<open_file_view exporters.py L:1-18> {i 3 handler quasi-identici, vedi FX-export} </open_file_view>
<hint> {una delle 3 varianti} </hint>
</context>
<messages_with_user N:1>
  User: questi tre export sono quasi uguali, fattorizzali per togliere la duplicazione
</messages_with_user>
```
- **Hint FORTE (scaffold core/axes/leaves esplicito)** — `<hint>`:
  > Decomponi così: `core` = ciò che è IDENTICO nei tre (validazione, ordinamento, scrittura); `axes` = lungo cosa variano (la sola serializzazione → asse `format`); `leaves` = una foglia per formato (csv/json/xml) che implementa SOLO il serialize. Poi verifica che i test restino verdi e che non resti duplicazione.
- **Hint MEDIO** — `<hint>`:
  > Separa ciò che è comune ai tre da ciò che cambia, poi crea una base + tre specializzazioni. Controlla che i test passino ancora.
- **Hint DEBOLE** — `<hint>`:
  > Togli la duplicazione senza cambiare il comportamento.

#### OUTPUT TARGET (reso per Hint FORTE; medio/debole → stesso trace e stessa `<decomposition>`, cambia solo quanto il `[plan]` deve dedurre)
```
[observe] 3 handler. confronto i corpi: validazione (riga1) IDENTICA ×3, ordinamento (riga2) IDENTICO ×3, scrittura (ultima) IDENTICA ×3; differisce SOLO la riga di serializzazione. [V]
[orient] complessità sufficiente per fattorizzare (3 copie, ~80% condiviso) → SÌ decomporre (non è il caso banale). invariante candidato = {valida, ordina, scrivi}; asse di variazione = {come serializzo}.
[plan] core = template_method export(rows, path) che fa valida→ordina→[serialize]→scrivi; axis = serializzazione; leaves = 3 serialize_*(rows)->str.
```
→ `<decomposition>` (scaffold F-harness riempito dalla skill S):
```xml
<decomposition>
  <core>
    funzione/`base` export(rows, path): valida(rows) → rows=ordina(rows) → body=serialize(rows) → scrivi(path, body)
    INVARIANTE: validazione("empty"→ValueError), ordinamento per id, scrittura su file = comuni a TUTTE le foglie.
  </core>
  <axes>
    - format ∈ {csv, json, xml}   # unico asse di variazione: il solo `serialize`
  </axes>
  <leaves>
    - csv  : serialize_csv(rows)  -> "\n".join(",".join(...))
    - json : serialize_json(rows) -> json.dumps(rows)
    - xml  : serialize_xml(rows)  -> "<rows>...</rows>"
  </leaves>
  <recomposition_check>
    espandendo le 3 leaves dentro core → si riottengono export_csv/json/xml originali (coverage);
    nessuna foglia ripete valida/ordina/scrivi (non-ridondanza); il core non contiene nulla di format-specifico (invariante-corretto).
  </recomposition_check>
</decomposition>
```
→ azione (rifattorizzazione, scope esplicito): introduce `base export()` (template method o funzione con callback `serialize`) + 3 `serialize_*`; i 3 nomi pubblici `export_csv/json/xml` diventano wrapper sottili che passano il serializer giusto.
→ tool-call (verifica ricomposizione):
```
python -m pytest tests/ -q
   → 4 passed                                  # coverage: comportamento preservato [V]
pylint --disable=all --enable=duplicate-code --min-similarity-lines=4 exporters.py
   → 0 duplicated blocks                        # prima: 3 → ora 0: non-ridondanza [V]
<mutation-probe ∀ stmt∈core> per OGNI stmt del core {valida, ordina, scrivi}: spostalo in una foglia, riesegui
   → valida()→leaf: test_empty_raises_all FAIL · ordina()→leaf: test_json (ordine) FAIL · scrivi()→leaf: tutti i test FAIL
   → ogni stmt del core rompe ≥1 test cross-formato ⇒ INVARIANTE_NEL_CORE vero [V]   (nessuno stmt-core inerte)
```
```
[verify] RICOMPONE = (pytest verde) AND (duplicati==0) AND (∀ stmt∈core rompe un test ⇒ INVARIANTE_NEL_CORE) [V] → decomposizione corretta.
```
→ risposta user-facing (prosa): «Fattorizzati in `base export()` (validazione + ordinamento + scrittura, comuni) + tre `serialize_*` (l'unica parte che varia). I 4 test restano verdi, la duplicazione è azzerata, e ogni pezzo della base è davvero comune — l'ho verificato spostando ciascuno (validazione, ordinamento, scrittura) in una foglia e vedendo rompere un test di un altro formato.»

> **Nota scaffolding**: forte = *mostra* i campi core/axes/leaves → il modello li riempie per imitazione; medio = *nomina le dimensioni* (comune vs variabile) → mappa dimensione→campo; debole = *nomina solo l'outcome* (togli duplicazione senza rompere) → deve dedurre l'intera fattorizzazione. **Target invariante**: stessa `<decomposition>`, stessi 3 oracoli verdi.

#### LABEL / REWARD (Q-puro)
- **Oracolo Q (deterministico, outcome-anchored)**: `caught == true` **sse** `RICOMPONE(decomp)` (§2bis) — pytest verde **E** `pylint duplicate-code` == 0 blocchi **E** `INVARIANTE_NEL_CORE` (∀ stmt del core: spostarlo in una foglia rompe un test cross-formato). Binario. Àncora il reward allo **stato eseguibile**, non alla `<decomposition>` testuale. **Niente ramo L qui**: i tre oracoli sono tutti eseguibili → premiare la "chiarezza del mapping" in prosa sarebbe judge-gaming (la prosa non è load-bearing dove l'oracolo decide).
- **Nota anti-reward-hacking**: lo scorer ispeziona test + misura-duplicazione, **non** il testo della `<decomposition>`. Una `<decomposition>` ben-formata ma con foglie che NON ricompongono (test rossi) o che ripetono il core (duplicati>0) → reward basso. La forma 3-heading **non** è premiata: l'outcome sì. Scorer ≠ scored ([[../concepts/reward-hacking-mitigation|reward-hacking-mitigation]] §3 #3, #12).

---

### (2) WITHOUT-hint — stessa task family, nessuno scaffold

Sandbox = `FX-export`, **senza** `<open_file_view>` né hint: il modello identifica i 3 handler, scopre il pattern condiviso e fattorizza spontaneamente.

#### INPUT
```xml
<context>
<temporal> now: 2026-06-29T10:30:00Z · session_elapsed: 1m </temporal>
<rules> 1. code MUST be production ready · 2. preserva il comportamento (test verdi) </rules>
<current_aim> manutenzione modulo exporters </current_aim>
<task_list> [>] T1 il modulo exporters ha codice ripetuto, sistemalo </task_list>
</context>
<messages_with_user N:1>
  User: c'è troppa roba ripetuta in exporters.py, mettila a posto
</messages_with_user>
```

#### OUTPUT TARGET
```
[observe] richiesta vaga "roba ripetuta". [?] quali funzioni, [?] cosa condividono. leggo il modulo.
```
→ tool-call: `read_file exporters.py` → i 3 handler. `python -m pytest tests/ -q` → 4 passed (baseline).
```
[orient] 3 funzioni, ~80% identico (valida/ordina/scrivi), varia solo serialize → fattorizzabile (NON banale). invariante = {valida,ordina,scrivi}; asse = serializzazione.
[plan] core export(rows,path) + axis format + 3 leaves serialize_*. poi verifico ricomposizione.
```
→ `<decomposition>` identica alla classe (1) (core/axes/leaves + recomposition_check) — **auto-derivata**, non data.
→ azione (rifattorizzazione) → tool-call di verifica:
```
python -m pytest tests/ -q                                  → 4 passed              # coverage [V]
pylint ... --enable=duplicate-code --min-similarity-lines=4 → 0 duplicated blocks   # non-ridondanza [V]
<mutation-probe ∀ stmt∈core>  ogni stmt {valida,ordina,scrivi}→foglia  → ognuno rompe ≥1 test cross-formato  # INVARIANTE_NEL_CORE [V]
```
→ reply (prosa): come classe (1).

#### LABEL / REWARD (Q-puro)
- Identico oracolo `RICOMPONE` della classe (1) (tre oracoli eseguibili → nessun ramo L sulla prosa).
- **Più stringente sulla spontaneità**: reward dato solo se la fattorizzazione è *auto-iniziata* (ha letto, confrontato i corpi, isolato l'invariante da sé). Nessun credito per "ho prodotto la `<decomposition>`" senza la rifattorizzazione che ricompone.
- **Anti-hack**: premia la *dipendenza-dall'outcome-reale* (test+duplicazione), non la produzione della forma.

---

### (3) WRONG — awareness — decomposizione difettosa da RICONOSCERE (no recovery)

Tre sotto-istanze, una per **modo di rompersi** (i 3 fallimenti del concept). INPUT = una decomposizione mostrata da giudicare (*"questa fattorizzazione è corretta? se no, perché?"*). Sandbox = `FX-export`. Il modello deve **nominare il difetto e la sua classe**, non ripararlo.

#### (3a) INVARIANTE SBAGLIATO — un pezzo format-specifico messo nel core
```
<decomposition id="D-3a">
  core: export(rows,path): valida → ordina → body=json.dumps(rows) → scrivi   # ← json.dumps nel CORE!
  axes: format
  leaves: csv(post-processa il json in csv?), json(no-op), xml(post-processa?)
</decomposition>
```
OUTPUT TARGET:
```
[verdetto] SBAGLIATO.
[classe] invariante-errato.
[perché] json.dumps è SPECIFICO di un formato ma è nel core → il core NON è comune a tutte le foglie. csv/xml devono "disfare" il json → coupling assurdo. oracolo che lo becca = il **COVERAGE** (`pytest`): applicando D-3a, `test_csv`/`test_xml` diventano ROSSI (l'output sarebbe json). NON il mutation-probe — qui il pezzo-errato spezza già un test esistente.
[label] "sbagliato: invariante-errato — logica format-specifica (json.dumps) collocata nel core; il core deve contenere SOLO ciò che è comune a tutte le foglie. (becco: coverage rosso, non mutation-probe.)"
```

#### (3b) FOGLIE CHE NON COPRONO — manca un formato (coverage incompleta)
```
<decomposition id="D-3b">
  core: export(rows,path): valida → ordina → serialize → scrivi
  axes: format
  leaves: csv, json     # ← manca xml!
</decomposition>
```
OUTPUT TARGET:
```
[verdetto] SBAGLIATO.
[classe] coverage-incompleta.
[perché] il problema generale ha 3 formati; le foglie ne coprono 2 → export_xml resta scoperto. ricomposizione INCOMPLETA: test_xml fallirebbe (serialize_xml non esiste).
[label] "sbagliato: coverage-incompleta — le foglie non ricoprono tutto lo spazio del problema (manca la foglia xml); la ricomposizione non riproduce export_xml."
```

#### (3c) FOGLIE RIDONDANTI — il core ripetuto dentro le foglie
```
<decomposition id="D-3c">
  core: export(rows,path) {firma soltanto}
  axes: format
  leaves: csv(valida+ordina+serialize_csv+scrivi), json(valida+ordina+serialize_json+scrivi), xml(valida+ordina+serialize_xml+scrivi)
</decomposition>
```
OUTPUT TARGET:
```
[verdetto] SBAGLIATO.
[classe] non-ridondanza-violata.
[perché] valida/ordina/scrivi sono RIPETUTI in tutte e 3 le foglie → il core è vuoto e la duplicazione NON è stata eliminata (`pylint duplicate-code` troverebbe ancora 3 blocchi). la fattorizzazione è solo nominale.
[label] "sbagliato: foglie-ridondanti — il presunto core non assorbe l'invariante; le foglie duplicano valida/ordina/scrivi. Zero riduzione di duplicazione."
```

#### LABEL / REWARD (Q)
- **Verifier**: ground-truth `is_wrong = true` per tutte e tre; lo scorer premia il riconoscimento **se** il verdetto è `SBAGLIATO` **E** la **classe di difetto** è azzeccata (match su `invariante-errato` / `coverage-incompleta` / `non-ridondanza-violata` — le tre distinte). Un "è fatta male" generico che non distingue la classe NON basta.
- **Ancoraggio eseguibile** (rende Q, non solo L) — **ogni classe di difetto mappata al suo oracolo**: 3a (invariante-errato) → **COVERAGE**: applicando D-3a, `test_csv`/`test_xml` rossi; 3b (coverage-incompleta) → **COVERAGE**: `serialize_xml` mancante → `test_xml` AttributeError; 3c (non-ridondanza-violata) → **DETECTOR**: `pylint duplicate-code` resta a 3 blocchi. (Il mutation-probe non serve qui: i tre difetti sono già becati da coverage/detector — il probe è per il caso sottile di §2bis.) Lo scorer può eseguire la decomposizione proposta e leggere l'oracolo.
- **Anti-hack**: distrattore = una decomposizione **corretta** (quella della classe 1) inserita tra i casi → il modello NON deve etichettarla "sbagliata" (false-positive penalizzato, simmetria col cry-wolf). Scorer ≠ scored.

---

### (4) WRONG — recovery — corregge una decomposizione difettosa (loop reale)

Parte da una decomposizione difettosa **già applicata al codice** (3c materializzata: 3 foglie che ripetono il core, duplicati>0 ma test verdi) e chiude il loop rileva→diagnostica→ripara→ri-verifica. Sandbox = `FX-export` con `exporters.py` nello stato post-D-3c. Differenza dalla (3): qui **ripara** e **ri-verifica con l'oracolo reale**.

#### INPUT
```xml
<context>
<temporal> now: 2026-06-29T14:00:00Z · session_elapsed: 12m </temporal>
<rules> 1. code production ready · 2. preserva il comportamento </rules>
<current_aim> la rifattorizzazione precedente non ha ridotto la duplicazione </current_aim>
<task_list>
  [x] T1 "rifattorizzati" gli export (← in realtà foglie ridondanti, vedi 3c)
  [>] T2 verifica che la duplicazione sia sparita
</task_list>
<last_tool_calls> - refactor exporters.py ok (3 foglie self-contained) </last_tool_calls>
</context>
<messages_with_user N:1>
  User: controlla che ora non ci sia più codice ripetuto
</messages_with_user>
```

#### OUTPUT TARGET (recovery-loop)
```
[observe] T1 dice "rifattorizzato" ma T2 chiede di verificare. eseguo l'oracolo di non-ridondanza.
```
→ tool-call (detect):
```
pylint ... --enable=duplicate-code --min-similarity-lines=4 exporters.py
   → 3 duplicated blocks (valida/ordina/scrivi ×3)   # ridondanza ANCORA presente [V] rosso
python -m pytest tests/ -q          → 4 passed        # i test passano MA c'è duplicazione
```
```
[orient] diagnosi: le foglie ripetono valida/ordina/scrivi → core vuoto (difetto 3c, non-ridondanza-violata). la coverage c'è (test verdi) ma la fattorizzazione è nominale.
[plan] sposto l'invariante {valida,ordina,scrivi} nel core (template method); le foglie tengono SOLO serialize_*. poi ri-verifico ENTRAMBI gli oracoli.
```
→ `<decomposition>` corretta (= classe 1) + azione (riparazione: estrae il core, snellisce le foglie).
→ tool-call (re-verify, ENTRAMBI gli oracoli — anti check-fantasma):
```
pylint ... --enable=duplicate-code --min-similarity-lines=4 → 0 duplicated blocks    # ridondanza ora ELIMINATA [V] verde
python -m pytest tests/ -q                                  → 4 passed               # coverage ancora preservata [V] verde
<mutation-probe ∀ stmt∈core>  ogni {valida,ordina,scrivi}→foglia  → ognuno rompe ≥1 test cross-formato   # invariante ora nel core [V]
```
```
[verify-loop] errore residuo = 0 (duplicati 3→0, test restano verdi, invariante nel core) [V].
              loop chiuso: detect(duplicati=3)→diagnose(core vuoto, foglie ridondanti)→repair(estrai core)→re-verify(duplicati=0 AND test verdi).
[memo] generic_lesson = "una rifattorizzazione che lascia duplicati>0 NON ha fattorizzato: verifica SEMPRE col detector (`pylint duplicate-code`), non solo coi test (i test verdi non implicano non-ridondanza)".
```
→ reply (prosa): «La 'rifattorizzazione' precedente non aveva fattorizzato: le tre foglie ripetevano validazione/ordinamento/scrittura (3 blocchi duplicati), anche se i test passavano. Ho spostato l'invariante nel core; ora il detector segna 0 duplicati e i 4 test restano verdi.»

#### LABEL / REWARD (Q)
- **Verifier (outcome-anchored)**: la recovery vale **sse** termina con `pylint duplicate-code == 0 blocchi` **partendo da > 0** (rosso→verde sulla non-ridondanza) **E** `pytest` resta verde (coverage non sacrificata per togliere duplicazione). Process-reward sui 4 stadi nell'ordine: detect (duplicati osservati) → diagnose (tool-call reali) → repair → re-verify.
- **`verify_loop_reale`**: il trace deve contenere **due** esecuzioni reali del detector pinnato (`pylint duplicate-code`: la rossa di diagnosi → la verde di conferma) **e** un `pytest` post-riparazione. Un "ora non c'è più duplicazione" asserito senza la seconda misura → niente reward sul ramo recovery (anti check-fantasma sul re-verify).
- **Anti-hack — il doppio oracolo**: un modello potrebbe togliere duplicazione **rompendo i test** (es. cancella le foglie). Il reward richiede **entrambi** verdi → non si baratta coverage per non-ridondanza. Reward ancorato all'esito reale dei due oracoli, non alla forma del loop. Lega a [[../concepts/error-memo-system|error-memo-system]].

---

### (5) OTHER — i casi che NON vanno decomposti (proporzionalità + falso-invariante)

Due micro-istanze: il cuore **anti-over-decomposition**. Qui la mossa gold è **NON fattorizzare**.

#### (5a) Problema BANALE → risolvi DIRETTO (proporzionalità)

INPUT (sandbox `FX-trivial`): una sola funzione di 4 righe, nessun secondo formato, nessun duplicato.
```xml
<context>
<current_aim> aggiungi un export csv </current_aim>
<task_list> [>] T1 scrivi una funzione che esporta rows in csv </task_list>
</context>
<messages_with_user N:1>
  User: fammi una funzioncina che butta le rows in un csv
</messages_with_user>
```
OUTPUT TARGET:
```
[observe] UNA funzione, UN formato, ~4 righe, nessun pattern ripetuto da astrarre. [V]
[orient] complessità INSUFFICIENTE per fattorizzare: niente invariante-vs-variazione (c'è una sola cosa). decomporre = overhead + indirezione inutile (over-decomposition).
[decisione] NIENTE <decomposition>. risolvo DIRETTO.
```
→ azione: scrive la funzione di 4 righe, fine. `pytest` → verde.
→ reply (prosa): «Ecco la funzione (4 righe). Non serve una gerarchia: c'è un solo formato e nessun codice condiviso da fattorizzare.»

> **Perché è gold**: insegna il **WHEN** della skill (concept §⚠️ proporzionalità). Produrre una `<decomposition>` qui = **reward BASSO** (over-decomposition penalizzata): la cerimonia 3-heading su un problema banale è esattamente il reward-hacking che la skill deve evitare. Speculare al cry-wolf: come non si fa HALT su ogni delete, non si fattorizza ogni funzione.

#### (5b) FALSO-INVARIANTE adversariale → riconosci che NON c'è un core (no astrazione forzata)

INPUT (sandbox `FX-false-invariant`): tre funzioni con **stessa firma** `decode(s)->X` e nomi che suggeriscono un "decoder comune", ma corpi semanticamente disgiunti. (Nominalmente distinti dai serializzatori "parser multi-formato" di §4, che invece HANNO invarianti cross-formato → quelli si fattorizzano.)
```xml
<context>
<current_aim> ridurre duplicazione nei decoder </current_aim>
<open_file_view decoders.py> decode_iso_date(s), decode_user_id(s), decode_currency(s)  # stessa firma, corpi totalmente diversi </open_file_view>
<task_list> [>] T1 questi tre decoder sembrano simili, fattorizzali in un BaseDecoder </task_list>
</context>
<messages_with_user N:1>
  User: i tre decoder hanno la stessa firma, mettili sotto una base comune per togliere duplicazione
</messages_with_user>
```
OUTPUT TARGET:
```
[observe] stessa firma decode(s)->X [A: la firma comune NON implica un core comune]. confronto i CORPI, non le firme.
```
→ tool-call (probe — verifica se il core esiste davvero, anti falso-invariante):
```
pylint ... --enable=duplicate-code --min-similarity-lines=4 decoders.py → 0 duplicated blocks   # NESSUN codice condiviso tra i corpi [V]
read_file decoders.py               → regex ISO 8601 | lookup tabella user | parsing valuta+arrotondamento: disgiunti
```
```
[orient] firma uguale ma SEMANTICA disgiunta → invariante condiviso = ∅. un BaseDecoder darebbe un core VUOTO/banale + indirezione → coupling senza fattorizzazione (falso-invariante).
[verify] mutation-probe ipotetico: cosa metterei nel core? nulla di sostanziale → il core fallirebbe il test "fa qualcosa di comune". [V] NON fattorizzabile.
[decisione] NIENTE gerarchia forzata. al massimo un Protocol/typing per la firma comune (contratto, MA senza default-method: solo segnatura, zero corpi aggiunti), nessun BaseDecoder con logica.
```
→ azione: non crea la base; eventualmente annota un `Protocol` **senza default-method** per la firma. reply (prosa): «La firma è la stessa ma i corpi non condividono nulla (il detector trova 0 blocchi comuni): non c'è un invariante da estrarre. Un `BaseDecoder` avrebbe un core vuoto e aggiungerebbe solo indirezione. Se vuoi uniformare il *contratto* posso definire un `Protocol` (sola firma, senza implementazione), ma niente logica condivisa forzata.»

> **Perché è gold (vaccino duale di 1/2)**: stessa *richiesta* di fattorizzare di (1), ma il **trigger è opposto** (nessun core reale). La mossa gold è **riconoscere il falso-invariante** e NON astrarre. Rompe l'euristica pigra "stessa firma ⇒ core comune". Senza 5b, "fattorizza sempre quando te lo chiedono" gamerebbe (1)/(2) incassando il segnale senza discriminare. Ground-truth anti-gaming: **non** "nessun `BaseDecoder`" (un `Protocol` con default-method gamerebbe la lettera) ma **`bodies_non_triviali(post) == bodies_non_triviali(pre)`** — zero corpi non-banali aggiunti — **e** il detector resta a 0 (non si è fabbricato un core finto).

#### LABEL / REWARD (Q-dominante) — comune a (5)
- **Oracolo Q**: 5a → ground-truth = **nessuna `<decomposition>` emessa** + funzione diretta + `pytest` verde; una `<decomposition>` qui = penalità over-decomposition. 5b → ground-truth = **`bodies_non_triviali(post) == bodies_non_triviali(pre)`** (0 corpi non-banali aggiunti — un `Protocol` con default-method NON passa) **e** `pylint duplicate-code` resta 0 (non si è fabbricato un core finto). Score binario su *azione-emessa vs attesa* — entrambi i predicati di 5b sono **eseguibili**, niente L sulla prosa.
- **hack-check esplicito (anti-cerimonia)**: il segnale premia il **comportamento DIFFERENZIALE** — *fattorizza su (1)/(2) [core reale]* **AND** *NON-fattorizza su (5a)/(5b) [no core]*. Produrre i 3 heading core/axes/leaves **non** è mai premiato di per sé; su 5a/5b è **penalizzato**. Duale del cry-wolf sul versante decomposizione. Scorer ≠ scored.

---

## §3 — Cosa lo rende GOLD

1. **Reward VERIFICABILE per costruzione (Q reale)**: lo scenario porta la decomposizione in **codice**, così la ricomposizione è un **fatto eseguibile** — `pytest` verde (coverage), `pylint duplicate-code → 0` (non-ridondanza), `mutation-probe ∀ stmt∈core` (invariante-nel-core). L'oracolo `RICOMPONE` (§2bis) è un **predicato eseguibile**, non un giudizio sulla forma. Dove la decomposizione resta *progettuale* (non materializzata, generalizzazione §4), si scende a **L** dichiaratamente, con council OPEN.
2. **Anti-over-decomposition senza premiare la cerimonia**: la classe **OTHER** (5a banale, 5b falso-invariante) ancora il reward al **comportamento differenziale** — fattorizza dove c'è core, NON dove non c'è. Produrre `core/axes/leaves` non è mai premiato di per sé (lo scorer guarda test+duplicazione+azione-emessa, non i 3 heading). Questo è l'hack-check first-class del concept §⚠️.
3. **Le 3 modalità di rottura come classi distinte (3a/3b/3c)**: invariante-errato / coverage-incompleta / non-ridondanza-violata — ciascuna *dimostrabile in sandbox* (test rosso / membro mancante / detector>0). Lo scorer matcha la **classe di difetto**, non un "è fatto male" generico.
4. **Recovery con doppio oracolo (4)**: la riparazione deve portare `duplicati 3→0` **E** tenere `pytest` verde → non si baratta coverage per non-ridondanza; due misure reali nel trace (anti check-fantasma sul re-verify).
5. **Classificazione training-vs-harness esplicita (§1)**: S (decidere come/se fattorizzare, DEGRADATA-ma-utile) + piccola F-scaffold (`<decomposition>`, F-harness PIENA). La forma non è la skill.
6. **Scaffold a 3 livelli con output invariante**: forte=campi / medio=dimensioni / debole=outcome → stessa `<decomposition>`, stessi oracoli verdi. È l'impalcatura a calare.
7. **Connessione ricorsiva dichiarata**: il gold *insegna* la fattorizzazione con cui i gold sono *scritti* ([[gold-methodology]] template-inheritance) — coerenza elegante autore↔contenuto.

### §3bis — Note di verifica (gated su sandbox)
- **[UNVERIFIED — format-only]** Tutti gli output `pytest` / `duplicate-detector` / `mutation-probe` sono **format-only**; l'esecuzione reale è gated sullo scaffold verifier-sandbox. I bug di ragionamento sugli oracoli sono stati corretti a mano; l'esecuzione cattura il resto ([[gold-methodology]] §marker).
- **[EXTRACTED]** Il detector di non-ridondanza è **pinnato e deterministico**: `pylint --disable=all --enable=duplicate-code --min-similarity-lines=N` (NON un detector astratto né 3 alternative — la scelta dello strumento è parte dell'ancoraggio, [[gold-methodology]] §oracoli). La soglia N (default 4) è l'unico **iperparametro di dataset** calibrato+ablato, non annotazione per-esempio.
- **[EXTRACTED]** Il `mutation-probe` è **quantificato su TUTTO il core**: `∀ stmt ∈ core: muovere(stmt → leaf_k) ⇒ ∃ test_j (j≠k) che fallisce`. Operazionalizza "l'invariante è davvero comune a tutte le foglie" come predicato eseguibile e **non-gameabile** (testare un solo pezzo lascerebbe infilare nel core elementi non-comuni). Ortogonale al coverage: il probe becca il caso *sottile* (elemento-non-comune che non rompe i test esistenti, es. branch morto); il caso 3a (`json.dumps` nel core) è invece becato dal **coverage** (`pytest` rosso), non dal probe.

## §4 — Come usarlo come TEMPLATE per le altre foglie di decomposition
- **Invariante cross-foglia**: 5 classi con INPUT(`<context>`)/OUTPUT(`[V][A][?]` + `<decomposition>` + azione)/LABEL(oracolo `RICOMPONE` + hack-check anti-over-decomposition) + fixture esplicita per ogni held-out. **Coppia bilanciata obbligatoria**: un caso *con core reale → fattorizza* (1/2) accanto a *senza core → NON fattorizzare* (5a/5b), stessa richiesta utente → spina dorsale anti-over-decomposition con penalità simmetrica.
- **Cosa cambia per foglia** (altri scenari di decomposition): per *"progetta i test di un parser multi-formato"* → core = invarianti cross-formato (es. "input vuoto → errore"), axes = {formato, tipo-di-malformazione}, leaves = casi-test per cella; oracolo `RICOMPONE` = la matrice di test **copre** ogni (formato × malformazione) senza casi-doppione (coverage di partizione + non-ridondanza = nessuna cella testata due volte). Per *decomposizione di una pipeline ML* → core = contratto-stadio comune, axes = stadi, leaves = implementazioni; oracolo = la pipeline ricomposta produce l'output end-to-end atteso.
- **Q vs L**: dove la decomposizione si materializza in artefatto eseguibile (codice, suite di test) → **Q** (oracolo). Dove resta progettuale (decomposizione di un dominio/concetto) → **L** su coverage∧non-ridondanza∧invariante (council OPEN, [[../concepts/judge-design|judge-design]]), con l'ancora Q "la decomposizione predetta regge in fase 3" dove disponibile.

> Regola di replica: **non riscrivere lo schema, riempilo**. La barra: *lo vorrei nel mio training set, e l'oracolo deve poterlo eseguire*.

## §4bis — Transfer CROSS-DOMINIO (regola #19: la stessa fattorizzazione FUORI dal software)

> Remediation dall'audit-completezza 2026-07-06 (gap #19: il §4 sopra resta tutto in ambito software → il modello **localizzerebbe** la skill al codice). La skill `core→axes→leaves + ricomposizione` è **dominio-generale**; questi transfer la costringono ad astrarre. Stessa struttura (decisione-se-decomporre → `<decomposition>` → verifica di ricomposizione), fatti **self-contained** (regola #22 — nessuna verità-del-mondo). Dal banale al sistemico.

- **[vita quotidiana — menù per N ospiti]** pianificare una cena di 3 portate per 8 persone con 2 vincoli dietetici. `core` = comune a ogni portata (porzioni×8, rispetto vincoli, coordinamento tempi); `axes` = tipo-portata {antipasto, primo, dolce}; `leaves` = la ricetta specifica di ciascuna. **Ricomposizione**: le 3 portate coprono il pasto (coverage) senza che una faccia il lavoro dell'altra (non-ridondanza); il comune non è ripetuto in ogni ricetta. **Proporzionalità (5a)**: un solo piatto → niente gerarchia.
- **[business — piani di abbonamento]** 3 tier (Free/Pro/Enterprise). `core` = ciò che TUTTI condividono (auth, billing, supporto base); `axes` = livello; `leaves` = le feature aggiuntive di ogni tier. **Ricomposizione**: i tier coprono i segmenti senza gap né sovrapposizione (nessun tier ri-implementa l'auth). **Falso-invariante (5b)**: 3 prodotti che *sembrano* una famiglia ma non condividono nulla di sostanziale → un "BaseProduct" comune = astrazione forzata.
- **[scienza — disegno sperimentale]** testare l'effetto di una variabile su 3 condizioni. `core` = protocollo + controlli **identici** in tutte le condizioni (è la **parità** di [[class-alternative-path-under-block]] sotto-classe A!); `axes` = la variabile manipolata; `leaves` = ogni condizione. **Ricomposizione**: le condizioni coprono lo spazio dell'ipotesi **senza confound** (nessuna differenza spuria oltre la variabile) = l'analogo dell'invariante-nel-core.
- **[NEGATIVO cross-dominio — over-decomposition nel quotidiano]** "organizzo la serata: cucino, pago le bollette, chiamo un amico" → superficie comune ("cose della sera") ma **zero sotto-struttura condivisa** → forzare una gerarchia = indirezione inutile (5a/5b nel quotidiano). Mossa gold: in sequenza, **niente** `<decomposition>`.

> La logica premiata è IDENTICA a quella software (coverage ∧ non-ridondanza ∧ invariante-reale + anti-over-decomposition): cambia SOLO il dominio. Chi ha imparato la LOGICA la applica ovunque — è la metrica di successo del transfer (#19).

## Sources
- [[../concepts/hierarchical-decomposition|hierarchical-decomposition]] (skill, classe S, reward coverage+non-ridondanza+invariante, ⚠️ proporzionalità, 5 classi). [EXTRACTED — idea utente 2026-06-29 msg 284]
- [[gold-methodology]] (template-inheritance, oracoli, marker [UNVERIFIED], review-loop).
- [[gold-example-area02-criticality]] (template strutturale §0/§1/§2bis/§2/§3, 5 classi, coppia bilanciata, anti-hack).
- [[../concepts/training-vs-harness-classification|training-vs-harness-classification]] (S + piccola F-scaffold).
- [[../concepts/judge-design|judge-design]] (council OPEN per il reward L coverage/non-ridondanza/invariante).
- [[../concepts/reward-hacking-mitigation|reward-hacking-mitigation]] (scorer≠scored, outcome-anchored, held-out bilanciato, anti-cerimonia).
- [[../concepts/structured-thinking|structured-thinking]] · [[../concepts/scientific-method-operating-protocol|scientific-method]] · [[../concepts/error-memo-system|error-memo-system]].
