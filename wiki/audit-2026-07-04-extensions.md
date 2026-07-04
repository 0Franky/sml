---
name: audit-2026-07-04-extensions
description: Audit di sicurezza/correttezza delle 20 estensioni pi (4 subagent paralleli), post bug P0 amnesia. Finding + stato fix.
type: audit
last_updated: 2026-07-04
tags: [harness, security, audit, extensions, fail-open, amnesia]
---

# Audit estensioni pi — 2026-07-04

> Innescato dal mandato utente msg 974 ("analizza l'intera codebase di tutte le estensioni, verifica che tutto sia corretto"). 4 subagent paralleli (gruppi A/B/C/D), bug-class mirati sui due bug trovati stanotte: (1) lettura da fonte FINESTRATA invece dell'autoritativa; (2) I/O non gestito → data-loss silenzioso / fail-open. I due bug originari (eviction-count windowed, busy_timeout mancante) sono già FIXATI ([[todo]] P0) ed esclusi dal report.

## Legenda stato
`[FIXED]` corretto in questo ciclo · `[TRACK]` reale, rinviato con priorità · `[VERIFY]` da verificare a mano prima di toccare · `[WONTFIX]` accettato come trade-off documentato.

---

## SICUREZZA (gruppo C) — i più gravi

- **C1 [FIXED] P1 — lockdown/INGRESS secret esfiltrabile via tool MCP strutturati.** ✅ FIXATO: flag `externalEgress` threddato in `checkSink`/`injectIntoStrings` (`src/sealed-secrets.mjs`) + classificazione tool-locali-vs-egress in `secrets-guardrail.ts` (`LOCAL_INJECTION_TOOLS` = bash + built-in FS; tutto il resto = egress esterno). Un lockdown-secret verso un tool-egress esterno senza sink concesso → BLOCCATO (fail-closed); l'uso locale bash hostless resta PERMESSO (no over-gating). Test in `sealed-secrets.test.mjs` (4 asserzioni, fallirebbero senza il flag). ✅ VERIFICATO a mano tracciando `checkSink` (`src/sealed-secrets.mjs:504-519`): per un secret SENZA `allowedSinks`, se `fileExfil=false` E `hosts.length=0` (esatto caso di `telegram reply(text="{{secret:X}}")` / `gmail create_draft` / `drive create_file` — args senza URL/host) → `reason=null` → salta il blocco → riga 519 `return {allowed:true}` = **fail-OPEN**. Il ramo CON `allowedSinks` (riga 494-501) fa invece fail-CLOSED corretto su "no host identificabile" (riga 498) — l'asimmetria è il bug. **Causa-radice**: `checkSink` è CONTENT-based (cerca URL/host/redirect nella stringa) e NON conosce il TOOL → il body di un tool-egress strutturato non ha quei segnali → "sembra locale". L'hook `tool_call` inietta i sealed ref in OGNI tool tranne `http_request` (che ha il proprio gating). Un `INGRESS_N`/`load_secrets_from_env` (partono in lockdown) → valore reale iniettato e spedito fuori. **Fix (architetturale, NON patch)**: threddare l'identità/tipo del tool in `injectIntoStrings`/`checkSink` + classificare i tool come EGRESS-SINK (telegram/gmail/drive/MCP-esterni) vs local-only; per lockdown-secret + tool-egress + no-sink-concesso → BLOCCA (fail-closed) anche senza URL. Attenzione a non rompere l'uso LOCALE legittimo di un secret (shell locale hostless = ok). Da fare in un ciclo dedicato.
- **C2 [FIXED] P1 — hook redazione `tool_result` fail-open su `ctx.ui.notify`.** `secrets-guardrail.ts:391`: `ctx.ui.notify(...)` non-guardato può fare throw DOPO aver calcolato la redazione ma PRIMA di ritornare `{content}` → pi riprende col content originale non-redatto. Scatta ESATTAMENTE quando un secret ha fatto match (`anyHit`). Fix: `ctx?.ui?.notify?.` + intero body in try/catch fail-CLOSED (in errore ritorna comunque il content redatto se calcolato).
- **C3 [FIXED] P1 — envelope untrusted `tool_result` aggirabile.** `src/tool-result-envelope.mjs`: (a) idempotenza decisa su contenuto attacker-controllato (`ALREADY_FRAMED = /^<tool_result\b/`); (b) testo non escapato → un `</tool_result>` a metà content rompe l'envelope. Injection annidata (la difesa P0 019f1d67 aggirabile). ✅ FIXATO: idempotenza banner-aware (`FRAME_SIGNATURE` = header + BANNER esatto → un fake-open senza banner viene comunque incorniciato) + `neutralizeEnvelopeTokens` (escapa `<tool_result`/`</tool_result>` nell'untrusted, anche nei path a blocchi misti → no breakout). Test envelope (breakout + fake-open + idempotenza-reale + wiring, 8 asserzioni).
- **C4 [WONTFIX] P2 — redazione `details` lascia l'originale se il clone JSON lancia** (circolare/BigInt). Già commentato come trade-off (`secrets-guardrail.ts:389`). Track: redigere via traversata safe invece di lasciare l'originale.
- **C5 [TRACK] P2 — regex-ingress fail-open in 3 edge case**: (a) `text.startsWith("/")` salta l'ingress per ogni slash-command; (b) `autoSealIngress` non wrappato → se `scanIngress`/`setSecret` lancia, l'hook async rigetta e pi procede col testo originale; (c) registry pieno (MAX_SEALED=256) → `continue` senza rimpiazzare → raw resta nel testo. `regex-ingress.ts:49-51` + `src/sealed-secrets.mjs:788-802`. Egress redaction ancora applica → impatto limitato (P2).
- **PULITI**: pre-flight, error-memo, http-request (redirect manual, method allow-list, sink-gating fail-closed), secrets-registry, secrets-consent (fail-closed headless).

## VARS/TOOLS (gruppo B)

- **B1 [FIXED] P1 — write in focus-scope mis-attribuite → droppate dal pop-report matrioska.** `extract_var`/`sliding_var_replace` non passano `who:activeWho()` → loggate sotto `who='orchestrator'` invece dello scope focus attivo → `getChangesByAgent('focus-X')` le OMETTE dal report al parent (stessa classe silent-omission dell'eviction). `var-ops.ts:48` + `sliding-var.ts:55`. Fix: thread `getActiveScope()` in entrambi i call-site.
- **B2 [FIXED] P2 — hook `message_end` redazione finale senza try/catch** (fail-open sul canale del testo finale). `var-ops.ts:90-112`. Fix: try/catch fail-closed (come tool-call-log).
- **B3 [TRACK] P2 — `set_task_status` no-op silenzioso su task inesistente** riportato come successo → entry fantasma in `recent_changes`. `vars-queue.ts:152-157`. Fix: rilevare `changes===0` → `ok:false`.
- **B4 [TRACK] P2(low) — `tool-gating` `revealed` Set non resettato su `session_shutdown`** → leak gating tra sessioni se il processo è riusato. Fix: `revealed.clear()` su shutdown.
- **B5 [WONTFIX] P2(low) — `render_template` exfil residuo** per secret in var non-pattern non-registrato (trade-off opt-in documentato).
- **PULITI**: tool-call-log, src/tool-gating.mjs, src/vars-queue.mjs (busy_timeout confermato presente).

## CONTEXT/COMPACTION (gruppo A)

- **A1 [FIXED] P2(severo) — `context-assembly` `before_agent_start` senza try/catch → amnesia TOTALE del turno.** Un throw (SQLITE_BUSY oltre i 5s, null/throw da un getter) fa saltare l'intero `<context>` (rules, tasks, vars, facts, messages_with_user, last_tool_calls, resume digest) → il modello gira context-blind. È il LATO READ dell'amnesia (il lato WRITE conversation-capture è già hardened). `context-assembly.ts:137-210`. Fix: try/catch + log, in errore `return undefined` (lascia il systemPrompt base).
- **A2 [TRACK] P2 — token-pressure legge la history PIENA, non il payload finestrato** (`getContextUsage()` su `this.messages` intero; native-window non muta `this.messages`). `percent` sale da history-fantasma → focus/reorg/compact-cancel spuri. `context-assembly.ts:138-161` + `src/nested-compact.mjs:51-66`. Fix: basare la pressure sulla dimensione del context assemblato, o trattare `watchCount` come asse autoritativo.
- **A3 [TRACK] P2(low) — `checkpoint.ts` execute non-guardato, 2 key non-atomiche** → checkpoint mezzo-applicato se `setMeta` lancia dopo `setVar`. Surfacea come tool-error (non silenzioso). Fix: try/catch + ordine consistente.
- **PULITI**: native-window (windower stesso, identity-contract corretto), nested-compact.ts + .mjs (pop-report scritto prima della mutazione), src/context-assembler.mjs (char-cap + complementarità native-window corrette).

## SANDBOX/ADVANCED (gruppo D)

- **D1 [FIXED] P1 — `verifier-sandbox` `execFileSync` senza `timeout` → freeze permanente model-triggerable.** Setup+assert loop sincroni senza timeout: un comando che blocca (curl a host irraggiungibile, read stdin, sleep) blocca l'INTERO event loop, l'abort `_signal` è ignorato, recupero solo con kill del processo. `verifier-sandbox.ts:52,59`. Fix: `timeout` + `killSignal` + `maxBuffer` esplicito.
- **D2 [FIXED] P2 — eviction-nudge consegnato via canale SYSTEM che il 9B ignora.** `eviction-checkpoint.ts:84` inietta un trailing `{role:"system"}`, ma `src/harness-config.mjs:44-50` documenta che LO STESSO 9B legge user/nativo e IGNORA il system. Il nudge-a-salvare è quindi inefficace + `setMeta(evictedThrough)` avanza il boundary PRIMA che il turno abbia successo → at-most-once, il fatto scrolla via. Fix: consegnare come `user`-role (coerente con gli altri fix amnesia). **Rilevante per il problema awareness** (il modello non salva).
- ✅ **D3 [FIXATO] — `session-context.mjs` `_convId` era un module-global**: 2 sessioni concorrenti nello stesso processo → l'ultima `session_start` vinceva → capture/lane/eviction leggevano il convId sbagliato. Fix reale (workflow REAL_FIX): `Map<sessionId,convId>` + `convIdFor(ctx)` per-sessione; 7 consumer migrati; test 14/0; validato live single-session. Vedi Sintesi.
- **D4 [WONTFIX] P2 — verifier-sandbox isolamento debole** (env-scrub + cwd=tmpdir, ma PATH host + accesso FS via path assoluti). TODO Docker già noto; gate dietro flag config finché non containerizzato → [[todo]].
- **D5 [WONTFIX] P3 — gemini-compat strippa metadata/reasoning_effort per OGNI provider** (innocuo per Gemini/ollama/vLLM; rompe un futuro OpenAI reasoning). Track minore.
- **PULITI**: contradiction-detection, turn-trace (hook wrappati, dump egress-redatto), src/eviction-checkpoint.mjs (OOB con timeout+try/catch).

---

## Sintesi
- **Fixati (14)**: **C1 + C3 (i due P1 sicurezza)** + C2, B1, B2, A1, D1, D2 + **batch P2: B3, B4, A3, C5** + **D3 (convId per-ctx, workflow REAL_FIX 2026-07-04)** + il P0 busy_timeout (`ed453d2`). Tutti con test; suite 37/0, typecheck 0.
- **D3 FIXATO** (workflow understand→design→verify `wf_ed7e6e5f-a51`, verdetto REAL_FIX): de-globalizzato il VALORE convId → `Map<sessionId,convId>` + `convIdFor(ctx)` (risolve da `ctx.sessionManager.getSessionId()`, verificato esposto per-runner). 7 consumer migrati + hook `(event,ctx)` + `_fallbackConvId` retro-compat + flag `singleUser` (gate del fallback `mostRecentConvId`). Nessun cambio-schema. Test `session-context-isolation.test.mjs` 14/0 (rosso con la global). Validato live single-session col driver RPC (2/2 turni, convId `sess-…`, recall ok, zero ext-error). **busy_timeout resta** (fix reale ma PARZIALE, asse ORTOGONALE a D3).
- **Restano 1 P2 (A2) + 2 bug adiacenti tracciati**: **A2** (token-pressure — ipotesi refutata, difetto vero = overhead-fisso+OR-max; **BLOCCATO su strumentazione** del `ctx=X%` reale prima del refactor, regola #14/#15). Adiacenti (da [[todo]]): `closeAll()` process-global (rompe le sorelle in multi-sessione-1-realm; irrilevante driver+TUI); state-dir separata per il driver.
- **Trade-off accettati**: C4, B5, D4, D5, C5-a (slash-command non trasformato: romperebbe il dispatch).
- **Trade-off accettati**: C4, B5, D4, D5.
- Pattern-radice comune ai fix: **fail-CLOSED su ogni hook di sicurezza/memoria** (try/catch che degrada in sicurezza, mai fa passare l'originale non-processato) + **canale user/nativo, non system, per parlare al 9B**.
