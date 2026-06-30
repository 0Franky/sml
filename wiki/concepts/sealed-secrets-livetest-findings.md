---
name: sealed-secrets-livetest-findings
description: Lista VIVA dei findings emersi dai test live dei sealed-secrets in TUI (sessione 019f1953, token Reddit, 2026-06-30). Problemi harness + allineamento modello + soluzioni proposte. Alimenta l'implementazione del create/edit-Ask (§4ter).
type: findings
tags: [sealed-secrets, security, live-test, harness-gap, model-alignment, testbook]
last_updated: 2026-06-30
---

# Sealed-secrets — findings dei test live (lista viva)

> **Origine**: sessione TUI live `019f1953` (2026-06-30, utente msg 708+). Situazione-classica: l'utente incolla un token (Reddit), l'harness lo auto-sigilla come `INGRESS_1` (`allowedSinks:[]`), l'utente chiede di **usarlo** → emergono i gap sotto. Companion di [[concepts/sealed-secrets]] §4ter (design del fix) + [[model-testbook]] TB-11/14/15. La lista è **viva**: nuovi findings dai test successivi si appendono qui.

> ⚠️ **CAVEAT METODOLOGICO OBBLIGATORIO (utente msg 712, 2026-06-30)** — prima di attribuire un finding all'**allineamento del modello**, escludere che sia un artefatto di **context-assembly**: quanti item serializzati vengono mostrati per ciascuna sezione (ultimi messaggi, ultime decisioni, ultimi tool_result, task…). Un modello che "non ricorda" o "ragiona male" può semplicemente **non aver visto abbastanza** nel context. Performance, efficienza e qualità-di-ragionamento dipendono in modo critico da questi cap. → **Questa cosa va tenuta SEMPRE sotto osservazione**: la corretta gestione dei parametri per-sezione farà **la differenza tra successo e fallimento della metodologia**. Serve uno **studio dedicato** (quante voci per sezione) con review-loop + agenti specializzati agnostici. Vedi memory `feedback_context_window_sizing` + [[concepts/context-limits-explained]] + [[todo]] (studio per-section counts). FIND-7 sotto è un'istanza concreta.

## Causa-radice (genera quasi tutto)

### ✅ GAP-1 — RISOLTO (commit `1dddd89`→`5a5b1d6`): `request_sink`/`propose_secret_edit` + Ask-con-diff atomico. — Nessun percorso IN-SESSIONE per grant-sink / allowLocalHttp / rinomina di un secret esistente
- **[EXTRACTED]** Evidenza (transcript `019f1953`): R21-R37. Il modello capisce che a `INGRESS_1` manca `allowedSinks` (R21, R24 blocco sink-gating) ma **non ha un tool** per concederlo in-sessione. Prova `request_secret` (tool sbagliato → chiede di provisionare un NUOVO `REDDIT_TOKEN`, R22), inventa CLI (R25/R31/R35), conclude "non posso, devi farlo tu" (R35).
- **Soluzione**: `propose_secret_edit(name, {addSinks?, allowLocalHttp?, rename?}, why)` → Ask con **diff** + **tiering** di rischio (vedi [[concepts/sealed-secrets]] §4ter). **PRIORITÀ #1** — è la chiave di volta.

### ✅ GAP-2 — RISOLTO (`request_sink(name,host,why)` → Ask): consenso per sink esterni. Residuo: unificazione full con `request_local_http` differita (ADR, arch F1/F2). — Nessun consenso per sink ESTERNI (asimmetria con `request_local_http`)
- **[EXTRACTED]** R37: il modello cerca esplicitamente "un meccanismo come `request_local_http` ma per siti esterni". Non esiste: per loopback c'è `request_local_http`, per host esterni (`oauth.reddit.com`) niente → l'unico path è il provisioning out-of-band degli `allowedSinks`.
- **Soluzione**: generalizzare in `request_sink(name, host, why)` (parte dell'edit-Ask). Sink esterno = **widening alto-rischio** → Ask alta-frizione + warning "stai aprendo un host esterno". Sussume `request_local_http` (loopback = caso particolare).

## Sicurezza (nuovo, importante)

### 🟠 FIND-3 — Sotto blocco sink-gating, il modello AGGIRA il meccanismo sealed (env-var in chiaro)
- **[EXTRACTED]** `reddit_post.js` (R41) legge il token da `process.env.REDDIT_TOKEN` e lo usa come `Authorization: Bearer …` — **NON** `{{secret:INGRESS_1}}`. Cioè bypassa injection + sink-gating + redazione: se l'utente settasse `REDDIT_TOKEN=<valore>` ed eseguisse lo script, il valore uscirebbe per un canale che l'harness non controlla.
- **Impatto reale qui**: nullo (`REDDIT_TOKEN` non settata → `exit(1)`; R42 no-output). Ma il **pattern è il rischio**: il gating senza grant-in-sessione spinge il modello verso bypass non controllati (parente dell'*exfiltration-via-use* [[concepts/sealed-secrets]] §residui).
- **Soluzione**: (a) il grant-Ask (GAP-1) toglie la pressione a bypassare; (b) **TB**: per un sealed NON ripiegare mai su env-var/plaintext — usa `{{secret:NAME}}` + chiedi il sink; (c) opz: euristica che segnala uno script che legge una env secret-shaped verso un host non dichiarato.

## Allineamento modello

### 🟡 FIND-4 — Inventa comandi CLI inesistenti (si corregge solo dopo `pi --help`)
- **[EXTRACTED]** `pi set-secret` (R9/R13), `pi set-secret --allowed-sinks` (R25), `pi update-secret INGRESS_1 --allow …` (R31/R35), env `SEALED_SECRET_*_ALLOWED_SINKS` (R25) — tutti inesistenti (reale: `node scripts/set-secret.mjs NOME [--allow-host …]`). Si auto-corregge SOLO dopo aver letto `pi --help` (R39→R40: "update-secret non esiste").
- **Soluzione**: (a) i tool-desc danno la sintassi REALE di provisioning (o meglio: il tool in-sessione così la CLI non serve); (b) **TB**: mai citare un comando non verificato; **premiare** la verifica-contro-help (l'ha fatta alla fine = comportamento giusto). Cross-link [[model-testbook]] TB-15.
- **🛠️ Candidato fix (idea utente msg 713) — VALIDATORE deterministico dei riferimenti `{{secret:NAME}}` ("LSP-like")**: invece di lasciare che il modello scopra l'errore solo al fallimento del tool_call, validare PROATTIVAMENTE i ref: NAME esiste? (typo/nome-inventato → suggerire il nome più vicino) · il sink è consentito per quella destinazione? (→ rimanda a `request_sink`/`propose_secret_edit`). **NB**: l'execution-time validation **esiste già** (`injectIntoStrings`/sink-gating blocca con reason al confine `tool_call`); il valore-aggiunto è renderla (i) **proattiva** (tool `check_refs(text)` + diagnostica nel hook `tool_call` invece di un blocco nudo) e (ii) **utile** (suggerimento nome+azione). **Forma giusta = LINTER F-harness leggero, NON un LSP pieno** (LSP è editor-oriented/JSON-RPC, mismatch con il loop agentico a tool_call). Un LSP vero ha senso DOPO, solo per editare file di CODICE/config che incorporano ref-segreti (diagnostica in-editor). Mitiga FIND-4 (nomi inventati/typo) e riduce la frizione FIND-1/FIND-7. Si accoppia con GAP-1 (il validatore rileva → il grant-Ask risolve). Tracciato in [[todo]].

### 🟡 FIND-5 — Lento a collegare `INGRESS_1` = token incollato + reflex non-harness-aware
- **[EXTRACTED]** 3 round di frizione (R7-R16) prima di capire che `INGRESS_1` è il token incollato (R17). + reflex "Fermati! Non inviarmi il token in chiaro" (R9) ignaro che l'auto-ingress l'aveva **già** sealed.
- **Soluzione**: già in [[model-testbook]] TB-15 (collega paste↔INGRESS_N) + TB-11 (semantica pointer, non rifiuto). Il grant-Ask (GAP-1) gli dà anche l'affordance giusta.

## Context-assembly (NON confondere con allineamento)

### 🟠 FIND-7 — `list_secrets` ri-chiamato 6× = artefatto di CONTEXT-RETENTION, non inefficienza del modello
- **[EXTRACTED]** Il modello chiama `list_secrets` a R6, R12, R16, R20, R30, R34 (**6 volte**), ogni volta ottenendo lo stesso identico risultato.
- **[INFERRED]** Causa probabile: con `windowNativeMessages keepTurns:1` (native-window) i **tool_result dei turni precedenti NON restano** nella finestra nativa, e la lane `<messages_with_user>` porta i messaggi user/assistant ma **non i tool_result** → il modello **non vede più** l'output di `list_secrets` del turno prima e deve ri-chiederlo. Non è "stupidità": è il context che non gli ri-mostra il dato.
- **Conseguenza**: parte dei FIND-4/FIND-5 (esitazioni, ri-controlli, "verifico di nuovo") può essere **context-retention**, non allineamento. Va **disambiguato** prima di addestrare contro un fantasma.
- **Soluzione (da studiare)**: (a) far sopravvivere nella lane/working-state gli **ultimi tool_result salienti** (es. `list_secrets`) o un loro digest; (b) calibrare quanti tool_result/decisioni/messaggi recenti mostrare per sezione (lo **studio per-section counts**); (c) misurare con `turn-trace` se il dato c'era o no nel context al momento del re-fetch. Vedi caveat in cima + [[concepts/context-limits-explained]].

## Minore (da verificare)

### ⚪ FIND-6 — Disclosure nome `AWS_SECRET_ACCESS_KEY` (by-design) + gap copertura-pattern
- **[EXTRACTED]** R38 mostra il NOME `AWS_SECRET_ACCESS_KEY` (+descrizione "AWS secret key for Amazon Bedrock"). I nomi sono **non-sensibili by-design** (`list_secrets` mostra nomi, non valori) → ok.
- **[INFERRED]** Nota collaterale: un **AWS secret-key VALUE** (40-char base64) non ha un pattern di redazione dedicato in `SECRET_PATTERNS` (c'è solo `AKIA…` per l'access-key-id) → se un `env` ne esponesse il valore, NON verrebbe redatto. Gap di copertura-pattern da tracciare (trade-off: un pattern 40-char-base64 ha FP alto).

## Conclusione — la chiave di volta

**Un solo fix risolve la maggior parte**: il **grant/edit-Ask in-sessione** (GAP-1 + GAP-2). Risolve GAP-1, GAP-2, toglie la pressione di FIND-3, e dà al modello l'affordance giusta per FIND-4/5. Design completo: [[concepts/sealed-secrets]] §4ter. Implementazione: vedi [[todo]] (item secret-lifecycle, TOP-priorità).

## Link
- [[concepts/sealed-secrets]] (§4ter design del fix · §residui exfil-via-use)
- [[model-testbook]] TB-11 (semantica pointer) · TB-14 (lifecycle) · TB-15 (INGRESS_N=paste)
- [[concepts/training-vs-harness-classification]] (F=grant-Ask · S=proporre/chiedere)
