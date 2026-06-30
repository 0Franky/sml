---
name: 2026-06-30-typed-http-request
description: ADR — introdurre un tool http_request TIPIZZATO come canale durevole per l'uso dei sealed-secrets in rete (sink-gating sul solo campo url, niente shell-parsing). La via bash con {{secret:NAME}} resta come legacy-fallback (additivo, nessuna regressione).
type: decision
tags: [adr, sealed-secrets, harness, pi, security, sink-gating, http, exfiltration]
status: accepted
date: 2026-06-30
last_updated: 2026-06-30
---

# ADR 2026-06-30 — `http_request` tipizzato come canale durevole per i sealed-secrets in rete

> **Status**: accepted (decisione utente msg 741: "se il nuovo metodo è più sicuro e ha lo stesso comportamento attuale + altro allora procedi"). Provisional per filosofia scientifica: rivedibile se l'evidenza d'uso mostra problemi.

## Contesto

Il sink-gating dei sealed-secrets nasce per una superficie **shell** (curl in `bash`): il modello mette `{{secret:NAME}}` in un comando e l'harness lo sostituisce col valore reale SOLO verso gli `allowedSinks`. Disambiguare la destinazione **dalla shell** è però fragile — cinque giri di review-loop di sicurezza (2026-06-30) hanno trovato residui P0 reali (verificati con `curl`): host estranei codificati (`8.8`→8.0.0.8, decimale, hex, `%2e`, dot-unicode), composizione di comandi (`;`/`&&`/`|`/`$()`/redirect bash), bare-operand. Tutti chiusi via `hasForeignHostToken` (normalizzazione `new URL`) + `hasCommandComposition`, ma la **causa-radice** resta: *il gate deve vedere quanto vede `curl`*, e la shell è un linguaggio ostile da gateare. L'architetto (review H2) ha indicato il target durevole: un tool **`http_request` tipizzato** dove la destinazione è un **campo `url` tipizzato** → un solo `new URL()` → gating banale. Vedi [[../concepts/sealed-secrets]] §4bis (residui) e [[todo]] (ADR FUTURO).

## Decisione

Introdurre il tool **`http_request`** (typed: `url`/`method`/`headers`/`body`/`timeout_ms`) come **canale PREFERITO** per usare un sealed-secret in rete. L'injection e il sink-gating avvengono sul **solo host dell'URL** (`injectTypedRequest` → `checkSinkTyped` → un `new URL()` in `src/sealed-secrets.mjs`); l'executor è `src/http-request.mjs` (`executeHttpRequest`, con `fetch` iniettabile). La via **bash con `{{secret:NAME}}` resta INVARIATA** (legacy-fallback): additivo, nessuna regressione. Il tool è esentato dall'hook `tool_call` shell-based (`injectIntoStrings`) — fa la propria injection tipizzata nel suo `execute()`.

## Perché qualifica (condizione utente msg 741)

- **Più sicuro**: la destinazione è il campo `url` tipizzato → niente shell da disambiguare. Si **eliminano** `hasForeignHostToken`/`hasCommandComposition`/`hasFileOrPipeExfil`/`hasHostPinning` per questa via (non hanno più nulla da difendere: `headers`/`body` sono DATI verso l'host già gateato, non un secondo canale d'uscita). In più: `redirect: "manual"` → un `3xx` verso un host diverso **non viene seguito** col token (chiude l'exfil-via-redirect, che la via bash con `curl -L` avrebbe); IPv6 loopback `http://[::1]` gestito (più capace del path bash); body di risposta CAP-ato + redatto (hook `tool_result`).
- **Stesso comportamento**: la via bash è intatta → ogni flusso esistente continua a funzionare. Test live sealed-secrets (3/3 PASS) non toccati.
- **Extra**: canale tipizzato, verificabile, ergonomico (header `Authorization: Bearer {{secret:TOKEN}}`), con remediation coerente (request_sink/request_local_http) su blocco.

## Regole del gate tipizzato (`checkSinkTyped`)

- solo `http`/`https`; altri schemi → blocco.
- **https** → allow-host fail-closed (`allowedSinks`, suffix-domain `api.x.com ⊆ x.com`, `*`=qualsiasi); senza `allowedSinks` → blocco rete (in `warn` → consentito con warning).
- **http** → consentito SOLO verso **loopback letterale** (`127.0.0.0/8`, `localhost`, `::1`) e SOLO con `allowLocalHttp` on (parità col fast-path bash). Mai http verso host esterno.
- **fail-closed** in `injectTypedRequest`: se anche un solo ref è bloccato/inesistente → NON si sostituisce nulla e NON si invia (il valore resta privato).

## Conseguenze

- Il modello deve **gravitare** su `http_request`: la description di `list_secrets` + le `promptGuidelines` di `http_request` lo indicano come PREFERITO; il block-message del gate bash continua a rimandare a request_sink/request_local_http.
- Il **regex/shell fast-path** (`hasForeignHostToken` & co.) diventa **interim/legacy**: resta per la via bash (che alcuni flussi shell legittimi useranno) ma non è più il percorso raccomandato per i secret.
- **Residui ACCETTATI** (de-prioritizzati, coerenti col primario "valore-mai-al-provider"): l'**exfil-via-use** resta per costruzione — un secret consentito verso un host PUÒ essere usato per inviare lì dati (è lo scopo); il typed-channel non lo risolve (né lo pretende). Un servizio loopback compromesso può ancora rilanciare (relay/SSRF) — rischio residuo della concessione `allowLocalHttp`, già disclosato nel consenso.

## Alternative considerate

- **Rimuovere la via bash** e tenere solo il typed-channel → SCARTATA: regressione (flussi shell esistenti), contro la condizione "stesso comportamento".
- **Tenere solo il regex/shell gate** → SCARTATA: fragile (5 giri di review per chiudere i residui), causa-radice irrisolta.
- **Seguire i redirect ri-gatando ogni hop** → SCARTATA per v1: `redirect:"manual"` è più semplice e sicuro (il modello rifà esplicitamente la richiesta sul nuovo host, che si ri-gatea). Riapribile se l'ergonomia lo richiede.

## Implementazione

- `src/sealed-secrets.mjs`: `checkSinkTyped(name, url, mode)` + `injectTypedRequest({url,headers,body}, mode)` (valore privato via `valueOf`). `.d.mts` aggiornato.
- `src/http-request.mjs`: `executeHttpRequest(params, {fetchImpl, mode, maxBytes})` — `fetch` iniettabile (testabile senza rete), `redirect:"manual"`, timeout, header-risposta allow-list, body CAP-ato. `.d.mts`.
- `.pi/extensions/secrets-guardrail.ts`: tool `http_request` + esenzione dall'hook `tool_call` shell-based + desc/guidelines.
- Test: `test/unit/http-request.test.mjs` (45) — checkSinkTyped/injectTypedRequest + executor con fake fetch (asserzioni [A] bloccato→no-fetch, [B] valore-reale-al-sink, [C] redirect-non-seguito).

## Link

- [[../concepts/sealed-secrets]] (§4bis residui, §4ter/§4quater lifecycle) · [[../concepts/sealed-secrets-livetest-findings]] · [[todo]] (ADR FUTURO chiuso da qui) · [[2026-06-23-pi-harness-base]].
