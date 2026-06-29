---
name: variable-operations-by-reference
description: Capability harness (idea utente TG msg 427, 2026-06-29) — il modello manipola le variabili PER RIFERIMENTO invece di ricopiarne i valori nel proprio stream di generazione. Pipe del risultato di un tool dentro una var, estrazione di un campo per path (JSON), interpolazione di una var nell'output. Vantaggio: meno errori (soprattutto SLM piccolo), meno token, più veloce. Crux di sicurezza: la trasformazione la ESEGUE l'harness in modo deterministico via DSL ristretto (path-access), MAI eval() di codice arbitrario.
type: concept
tags: [harness, variables, vars-queue, dataflow, by-reference, json, dsl, security, small-model, F+S, content-compression]
sources:
  - user TG msg 427 (2026-06-29)
  - harness/src/vars-queue.mjs
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
- **Interpolazione output**: marker `${var:statusApi}` nella risposta del modello → l'harness sostituisce il valore **DOPO** la redazione segreti, trattando il sostituito come **dato** (non come istruzioni).

## Criticità da gestire `[INFERRED]`

1. **NO eval arbitrario** (la più importante): solo DSL path-access ristretto → niente RCE/injection. *(Se mai servissero trasformazioni, aggiungere un set CHIUSO di op sicure — length/keys/slice — mai un linguaggio Turing-completo.)*
2. **Gestione errori**: var non-JSON / path mancante → **feedback** al modello ("apiResult non è JSON valido / path `status` assente"), mai crash. Robustezza obbligatoria.
3. **Snapshot vs live**: `statusApi` è una **copia** del campo al momento dell'estrazione, non un binding live. Se `apiResult` cambia, `statusApi` resta com'era. (Va comunicato; binding lazy/live = più complesso, non serve in v1.)
4. **Interpolazione e segreti**: l'interpolazione nell'output deve passare **dopo** [[secret-section-exfiltration-defense|secrets-guardrail]] (una var può contenere un segreto → l'interpolazione non deve esfiltrarlo). Ordine: redazione → interpolazione → invio.
5. **Audit**: ogni `extract_var` è un'operazione **deterministica e loggata** (changelog vars-queue) → più auditabile e affidabile del "ragionare" il valore.

## Classificazione training-vs-harness `[INFERRED]`

- **F-harness** (meccanismo, deterministico): `extract_var` (path-access), pipe-tool-result→var, interpolazione-post-redazione. **Stato-senza-training = DEGRADATA-MA-UTILE**: senza training il modello può ancora `read_var`+`set_var` a mano (ricopia, errori) — il tool extract lo rende robusto.
- **S** (skill, addestrata): *quando* riferire-invece-di-inlinare, *quale* path estrarre, *quando* interpolare. Reward **outcome-anchored** ([[../concepts/wrapper-context-assembly-example|reward design]]): il campo estratto coincide col campo reale? l'output mostra il valore giusto? — MAI premiare la cerimonia (l'aver usato il tool), ma l'esito corretto. Anti reward-hacking: un `extract_var` con path sbagliato che "sembra" usare il pattern non va premiato.

## Collegamenti
- [[sliding-window-variable-tool]] — leggere finestre di var grandi; questa estende il principio alle *operazioni*.
- [[wrapper-context-assembly-example]] — content-compression (item-2): tool_result→var (il pipe del punto 1).
- [[agent-wrapper-vars-queue]] — il datastore delle var (dove vivono + changelog/audit).
- [[secret-section-exfiltration-defense]] — ordine redazione→interpolazione (criticità #4).
- [[training-vs-harness-classification]] — F (extract/interpolate) vs S (politica di riferimento).
- [[2026-06-29-context-as-first-person-mind]] — il workspace auto-curato in cui queste var vivono.
- `wiki/todo.md` §NEXT BUILD — slot accanto a item-2 (content-compression: stesso meccanismo tool_result→var).
