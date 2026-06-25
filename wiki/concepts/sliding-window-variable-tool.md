---
name: sliding-window-variable-tool
description: Tool dedicato per read/replace di variabili tramite char range (sliding window), con context preview opzionale.
type: concept
tags: [concept, tool-design, vars-access, sliding-window, context-efficiency]
sources: [user notes 2026-05-21 hand-sketch photo]
last_updated: 2026-05-21
---

# Sliding Window Variable Tool

## Idea ground truth (utente, 2026-05-21 — foto appunti)

```
REPLACE BY PREVIEW VIA SLIDING WINDOW READ:

TOOL INPUT:
  - VAR ID
  - SLIDING NEW
  - START FROM CHAR
  - END TO CHAR
       (relate to var_id)

OUTPUT:
  - RESULT PREVIEW REPLACE
  - + X CHARS to see context around (optional param)
```

## Cosa fa

Tool che il modello (Tier 1 orchestrator o Tier 2-3 verticali) chiama per:

1. **Leggere** uno slice di una variabile registrata nel VARS registry del wrapper (vedi [[agent-wrapper-vars-queue]])
2. **Sostituire** uno slice (write) producendo una preview prima di applicare
3. Opzionalmente includere **±X char di contesto** attorno allo slice per evitare lettura cieca

Sostituisce il pattern "metti tutta la variabile nel context": invece si legge/scrive a porzioni.

## Signature

```python
class SlidingVarTool:
    def read(
        self,
        var_id: str,
        start_char: int,
        end_char: int,
        context_around: int = 0  # optional, default 0
    ) -> SlidingReadResult:
        ...

    def replace(
        self,
        var_id: str,
        start_char: int,
        end_char: int,
        new_content: str,
        context_around: int = 0,
        preview_only: bool = True  # if True, ritorna preview senza applicare
    ) -> SlidingReplaceResult:
        ...

@dataclass
class SlidingReadResult:
    var_id: str
    requested_range: (int, int)
    content: str             # lo slice richiesto
    context_before: str      # ±X char prima
    context_after: str       # ±X char dopo
    var_total_length: int    # info per il modello su quanto resta

@dataclass
class SlidingReplaceResult:
    var_id: str
    preview: str             # come apparirebbe dopo replace
    context_around: str      # context ±X char per orientamento
    applied: bool            # True se preview_only=False ed è stato applicato
    diff_summary: str        # diff snippet per audit
```

## Esempio di chiamata

Modello vuole modificare la funzione `validate_email` nel file `user_model.py`:

```xml
<tool_call name="sliding_var">
  <op>replace</op>
  <var_id>user_model_py</var_id>
  <start_char>1245</start_char>
  <end_char>1389</end_char>
  <new_content>
def validate_email(email: str) -> bool:
    """Validate email format using RFC 5322 regex."""
    return bool(EMAIL_REGEX.match(email))
  </new_content>
  <context_around>200</context_around>
  <preview_only>true</preview_only>
</tool_call>
```

Wrapper esegue:

1. Lookup `vars["user_model_py"]` O(1)
2. Estrae char 1045-1589 (con context ±200)
3. Genera preview applicando il replace virtualmente
4. Ritorna risultato

Modello vede preview, valuta, poi (se ok) richiama con `preview_only=false` per applicare effettivo.

## Perché non "passare il file intero"

Costo tradizionale: file 5000 char × N tool call = N×5000 char in context.

Con sliding window: solo ±200 char attorno alla modifica + content nuovo = ~400 char per call.

Beneficio: **risparmio token enorme** in scenari multi-edit (refactoring multi-file), e modello non viene distratto dai dettagli irrilevanti del file.

## Casi d'uso

### 1. Edit chirurgico

Modifica una funzione in un file 1000-righe: il modello sa già il range char (da grep o struttura precedente), opera solo lì.

### 2. Append a fine variabile

`start_char = var_total_length, end_char = var_total_length, new_content = "..."` → append.

### 3. Inserimento

`start_char = end_char = N` → inserisci a posizione N (no delete).

### 4. Read partial

Solo `read` mode: legge slice + context per orientarsi senza scaricare tutto.

### 5. Multi-step refactoring

Tier 3 verticale fa 10 edit in sequenza, ognuno slice piccolo. Il file completo non entra mai in context.

## Sicurezza / Hard limits

Il tool **DEVE rispettare hard_limits** dell'asset:

- Se `asset.hard_limit = "git_check"` → verifica versionato prima di replace
- Se `asset.hard_limit = "no_delete"` → blocca se `new_content = ""` su range non vuoto (è delete)
- Se char range collide con sezione protetta (es. license header del file) → warn

Vedi [[pre-flight-safety-checks]] per la logica check completa.

## Preview-then-apply pattern

Il default `preview_only=true` è importante per safety:

1. Modello propone replace
2. Wrapper genera preview
3. Modello (o validator esterno) controlla che il diff sia sensato
4. Se ok → call esplicita con `preview_only=false` per apply
5. Se no → modificare proposta

Riduce errori di "edit cieco" che danneggiano file.

## Compatibilità con tools standard (Edit, Write)

Questo tool **non sostituisce** `Read`/`Edit`/`Write` standard. Li **complementa** quando:

- Variabile non è file ma data structure (es. JSON, lista, codebase tree)
- Variabile è file grande dove leggere full sarebbe inefficiente
- Variabile è output di tool precedente (es. result di analysis)

`Read`/`Edit` standard restano usabili per file piccoli (< 1000 char) o quando context window non è vincolo.

## Vincolo: il modello deve sapere il char range

Pre-requisito: il modello deve **sapere già** dove operare. Pattern tipici:

- Grep prima → modello ottiene riga/char position dal risultato
- Read iniziale del file con range largo → modello identifica char target dal content
- Tool `get_structure(var_id)` → ritorna mappa funzioni/classi con char ranges

Il tool sliding NON è di "discovery" — è di precision edit.

## Integration con LSP / tree-sitter

Per file di codice, char position può venire da:

- **Tree-sitter AST**: il wrapper espone un tool `get_ast(var_id)` che ritorna struttura con char positions
- **LSP** (Language Server Protocol): se collegato, ritorna posizione di simboli specifici
- **Skill `mcp__plugin_serena_serena__find_symbol`** (quando attiva): ritorna simboli con posizione → modello chiama sliding tool con quei numeri

## Trade-off

| Pro | Contro |
|---|---|
| Context piccolo per edit | Modello deve conoscere char range (overhead di discovery) |
| Preview-then-apply safe | Più step per edit semplice |
| Multi-edit efficiente | Tool nuovo da imparare per modello |
| Audit trail dei diff | Off-by-one error in char position → bug subdolo |

## Failure modes

1. **Off-by-one**: modello sbaglia char position → replace di sezione sbagliata. Mitigazione: preview obbligatorio, validator esterno che confronta old vs new.

2. **Concurrent modify**: var modificata da altro processo tra read e replace. Mitigazione: versioning + optimistic locking (token version check).

3. **Char vs token confusion**: modello pensa in token, char ranges sono diversi. Mitigazione: API char-based, mai esporre token positions al modello.

4. **Variable too large for in-memory**: var di 100MB. Mitigazione: streaming I/O per var grandi, lazy load.

## Open questions

- Tool granularity: una API unica `sliding_var(read|replace|insert|delete)` o tool separati?
- Tree-sitter integration default-on per file di codice?
- Cache di preview tra read e replace (per evitare re-computation)?
- Support per binary vars (immagini, file binari) o solo testo?

## Link interni

- [[agent-wrapper-vars-queue]] — VARS registry dove vivono le var
- [[structured-context-sections]] — context contiene riferimenti var_id, non content
- [[task-decomposition-adhoc-context]] — sliding tool chiamato durante step
- [[pre-flight-safety-checks]] — sliding replace rispetta hard_limits
- [[../architecture/wrapper]] — implementazione

## Sources

- User notes 2026-05-21 (hand-sketch photo)
- Tree-sitter for source code AST
- LSP (Language Server Protocol) for symbol position
- Serena MCP `find_symbol` / `replace_symbol_body` pattern (analoga)
