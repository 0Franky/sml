---
name: variable-operations-by-reference
description: Capability harness (idea utente TG msg 427, 2026-06-29) — il modello manipola le variabili PER RIFERIMENTO invece di ricopiarne i valori nel proprio stream di generazione. Pipe del risultato di un tool dentro una var, estrazione di un campo per path (JSON), interpolazione di una var nell'output. Vantaggio: meno errori (soprattutto SLM piccolo), meno token, più veloce. Crux di sicurezza: la trasformazione la ESEGUE l'harness in modo deterministico via DSL ristretto (path-access), MAI eval() di codice arbitrario.
type: concept
tags: [harness, variables, vars-queue, dataflow, by-reference, json, dsl, security, small-model, F+S, content-compression]
sources:
  - user TG msg 427 (2026-06-29)
  - harness/src/vars-queue.mjs (datastore esistente — contesto; NON contiene extract_var/getByPath/interpolazione)
  - extract_var / path-DSL / interpolazione = DESIGN PROPOSTO, non ancora implementato in codice
last_updated: 2026-06-29
---

# Variable operations by reference

## Idea (utente, TG msg 427) `[EXTRACTED]`

Il modello ha variabili (nome + valore). Vorrebbe poter:
1. **Pipe del risultato di un tool dentro una var**: `set_var(apiResult, <toolcall()>)` — il JSON del tool va **direttamente** nella var, senza passare per lo stream di generazione.
2. **Estrarre un campo per riferimento**: `set_var(statusApi, JSON.parse(read_var(apiResult)).status)` — prende `.status` dalla var e lo salva, **senza riscrivere tutto il JSON**.
3. **Interpolare nell'output**: scrivere all'utente *"lo stato delle api è ${read_var(statusApi)}"* — la var viene sostituita, il modello non la ri-emette.

**Motivazione [EXTRACTED]**: non ricopiare il contenuto (lungo) di una variabile → **meno errori (specie un modello piccolo)**, **più rapido**, **più intuitivo**.

## Risposta: fattibile? ha senso? conviene? `[INFERRED]`

- **Fattibile**: **sì, pienamente** — ma con una sfumatura cruciale sul *come* (sotto).
- **Ha senso**: **sì, molto**. È **data-flow per riferimento**: il valore lungo non entra MAI nei token generati dal modello → si eliminano gli errori di trascrizione (il tallone d'Achille di un SLM), si risparmiano token, è più veloce. È il principio di [[sliding-window-variable-tool]] esteso dalle *letture* alle *operazioni*.
- **Conviene**: **sì**, per un SLM è un win netto su **accuratezza + token + latenza**. È classico **F+S** ([[training-vs-harness-classification]]): F = il meccanismo deterministico (extract/interpolate, harness); S = la *politica* (il modello impara *cosa* estrarre e *quando* riferire invece di inlinare).

## IL CRUX di sicurezza — chi esegue la trasformazione? `[INFERRED]`

Il beneficio esiste **solo se la trasformazione `.status` la ESEGUE l'harness in modo deterministico**, non se il modello legge il valore e lo "ragiona" (= ricopiatura, ciò che vogliamo evitare). Quindi serve un evaluator harness-side. **Ma NON `eval()` di JS arbitrario** — sarebbe RCE/injection (la var può contenere contenuto ostile da un'API; il modello può essere ingannato a emettere espressioni pericolose; prototype-pollution). La sintassi `JSON.parse(read_var(x)).status` dell'esempio è **pseudo-codice**: ne implementiamo la **semantica** con un **DSL ristretto e deterministico**.

### Design proposto (sicuro, minimale)
- **`set_var(name, <ref a tool_result>)`** — pipe del risultato di un tool in una var. Coincide con la [[wrapper-context-assembly-example|content-compression]] (item-2 del build: i tool_result grandi vanno in var, non inline) → **convergenza**: l'harness auto-cattura il tool_result in una var e dà al modello il ref; il modello poi *estrae*.
- **`extract_var(src, path, dest)`** — **path-access deterministico** (JSONPath / dotted-path: `status`, `data.items[0].id`). L'harness fa `getByPath(JSON.parse(value), path)` e salva in `dest`. Zero esecuzione di codice. È la versione SICURA di `JSON.parse(read_var(x)).status`.
- **Interpolazione output**: marker `{{var:statusApi}}` nella risposta del modello → l'harness sostituisce il valore, poi fa passare l'**output risolto** per la redazione segreti **PRIMA** dell'invio (ordine corretto: interpolazione → redazione finale → invio; vedi criticità #4), trattando il sostituito come **dato** (non come istruzioni).

## Grammatica — design per "minimi problemi" (utente msg 431) `[INFERRED]`

La sintassi `JSON.parse(read_var(x)).status` era **illustrativa**. La grammatica che crea **meno problemi** NON è un linguaggio di espressioni (parser fragile + superficie di injection + difficile per un SLM), ma un **piccolo set di TOOL tipati** con argomenti strutturati:
- `set_var(name, value)` / cattura-automatica del `tool_result` in una var (no espressione).
- `extract(from, path, into)` — **l'unica stringa-DSL è `path`**, e ristretta a un **sottoinsieme JSONPath** (dotted + indice: `data.items[0].status`). Niente funzioni, niente operatori, niente eval → parser banale, deterministico, sicuro.
- Output: **placeholder distintivo opt-in** (es. `{{var:statusApi}}`, delimitatore poco-collidente — NON `${...}` che collide con shell/JS; **ma nessun delimitatore è collision-free** → la disambiguazione vera è per **canale opt-in**, vedi §Disambiguazione), risolto **solo nel messaggio finale all'utente**; l'output risolto passa **poi** per la redazione segreti (ordine: interpolazione → redazione → invio, vedi #4). Il modello può sempre non-usarlo (scrivere il valore a mano se vuole).

**Principio**: la trasformazione vive in **argomenti tipati di tool**, non in stringhe di codice. → zero parser di espressioni da sbagliare, facile da emettere per un modello piccolo, **deterministico e auditabile by-design** (da validare nel build (c)/review-loop con modulo + test, come già esistono per le parti implementate). La grammatica esatta (nomi tool, sintassi path, delimitatore placeholder) si **finalizza nel build (c)** e si **stress-testa nel review-loop**.

## Disambiguazione — `{{var:x}}` comando vs `{{...}}` letterale (utente msg 437) `[EXTRACTED domanda + INFERRED soluzione]`

**Problema (utente, msg 437)**: `{{...}}` è già usato da altri linguaggi (Handlebars, Jinja2, Mustache, Vue/Angular). Se l'harness *scansiona* l'output del modello e sostituisce ogni `{{var:x}}`, come distingue un placeholder-da-espandere da un `{{...}}` che il modello vuole **mostrare** all'utente (sta spiegando Jinja, o scrive un template Vue)? **Nessun delimitatore è collision-free.**

**Soluzione: NON disambiguare per sintassi, ma per INTENTO/CANALE** (coerente con la grammatica "tool tipati, non expression-language"):
1. **Default = passthrough verbatim**: l'output normale del modello NON viene scansionato → qualsiasi `{{...}}` resta letterale. **Zero collisione** nel caso comune (codice/esempi).
2. **Interpolazione = opt-in esplicito**: avviene SOLO sul testo che il modello instrada per un **canale tipato** — un tool `say`/`emit(template)` oppure un campo strutturato `interpolate:true` sul messaggio finale. Il disambiguatore **load-bearing è il canale**, non il delimitatore.
3. **Dentro il testo opt-in**: si risolve solo `{{var:NOME}}` che (a) ha la **grammatica** `var:<identifier>` e (b) punta a una **var esistente** nel vars-queue; riferimenti a var inesistenti + graffe letterali passano **invariati**; + un **escape raw** (es. `{{!var:x}}` o raddoppio) per emettere una `{{var:x}}` letterale anche lì.
4. **Difesa-in-profondità**: namespace `var:` + must-exist + identifier-grammar riducono le collisioni residue, ma sono *secondari* rispetto al canale.

**F/S + stato-senza-training**: il canale + la risoluzione sono **F** (deterministici, PIENA); *quando* usare l'interpolazione è **S**; il fallback senza training è scrivere il valore a mano (DEGRADATA-MA-UTILE). Il **default-passthrough** garantisce che un modello non addestrato non rompa MAI l'output dell'utente. Stesso principio del canale tipato di [[secret-section-exfiltration-defense]] (intent esplicito, non scan-and-guess).

## Criticità da gestire `[INFERRED]`

1. **Path-DSL hardening** (la più importante; include il no-eval come sottocaso): (a) **NO eval arbitrario** → solo DSL path-access ristretto, niente RCE/injection; (b) **anti prototype-pollution**: il path-walk rifiuta i segmenti `__proto__`/`prototype`/`constructor` e accede **solo a own-key enumerable** (`Object.hasOwn`), mai alla catena prototipale; (c) **invariante**: `getByPath` opera **solo** su output di `JSON.parse` (oggetti plain → nessun getter live valutato); (d) parser del path lineare (sotto-JSONPath dotted+indice, niente backtracking) + cap su lunghezza-path e dimensione-valore. *(Se mai servissero trasformazioni, aggiungere un set CHIUSO di op sicure — length/keys/slice — mai un linguaggio Turing-completo.)*
2. **Gestione errori**: var non-JSON / path mancante → **feedback** al modello ("apiResult non è JSON valido / path `status` assente"), mai crash. Robustezza obbligatoria.
3. **Snapshot vs live**: `statusApi` è una **copia** del campo al momento dell'estrazione, non un binding live. Se `apiResult` cambia, `statusApi` resta com'era. (Va comunicato; binding lazy/live = più complesso, non serve in v1.)
4. **Interpolazione e segreti**: una var può contenere un segreto → l'interpolazione non deve esfiltrarlo. **L'ordine deve essere interpolazione → redazione finale → invio**: prima si sostituiscono i placeholder, POI l'**output risolto** passa per [[secret-section-exfiltration-defense|`redactText`]] (lo scanner d'uscita opera sul testo finale; se si redigesse PRIMA, il valore interpolato dopo **bypasserebbe** lo scanner → esfiltrazione). In alternativa: redigere il valore della var al momento della sostituzione **e** ri-scansionare il testo finale.
5. **Audit**: ogni `extract_var` è un'operazione **deterministica e loggata** (changelog vars-queue) → più auditabile e affidabile del "ragionare" il valore.

## Classificazione training-vs-harness `[INFERRED]`

- **F-harness** (meccanismo, deterministico): `extract_var` (path-access), pipe-tool-result→var, interpolazione-post-redazione. **Stato-senza-training = PIENA** (il meccanismo, quando chiamato, gira sempre). La **capacità complessiva è F+S**: è la **metà-S** (quando riferire-invece-di-inlinare, quale path, quando interpolare) ad avere **stato DEGRADATA-MA-UTILE**, grazie al fallback deterministico `read_var`+`set_var` manuale (il modello ricopia, con più errori; il tool `extract` la rende robusta).
- **S** (skill, addestrata): *quando* riferire-invece-di-inlinare, *quale* path estrarre, *quando* interpolare. Reward **outcome-anchored** ([[../concepts/wrapper-context-assembly-example|reward design]]): il campo estratto coincide col campo reale? l'output mostra il valore giusto? — MAI premiare la cerimonia (l'aver usato il tool), ma l'esito corretto. Anti reward-hacking: un `extract_var` con path sbagliato che "sembra" usare il pattern non va premiato.

## Collegamenti
- [[sliding-window-variable-tool]] — leggere finestre di var grandi; questa estende il principio alle *operazioni*.
- [[wrapper-context-assembly-example]] — content-compression (item-2): tool_result→var (il pipe del punto 1).
- [[agent-wrapper-vars-queue]] — il datastore delle var (dove vivono + changelog/audit).
- [[secret-section-exfiltration-defense]] — ordine redazione→interpolazione (criticità #4).
- [[training-vs-harness-classification]] — F (extract/interpolate) vs S (politica di riferimento).
- [[2026-06-29-context-as-first-person-mind]] — il workspace auto-curato in cui queste var vivono.
- `wiki/todo.md` §NEXT BUILD — slot accanto a item-2 (content-compression: stesso meccanismo tool_result→var).
