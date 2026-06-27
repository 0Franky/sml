---
name: secret-section-exfiltration-defense
description: Difesa anti-exfiltration di dati sensibili (credenziali, PII) — 3+1 livelli (training adversariale, contesto a riferimenti opachi, guardrail deterministico secrets-map dinamica, refusal steering opzionale). Da nota utente 8 + design secrets-map 2026-06-23.
type: concept
tags: [security, secret, exfiltration, guardrail, refusal, defense-in-depth, wrapper]
last_updated: 2026-06-27
status: draft — design consolidato, da validare
confidence: provisional
---

# Secret-section exfiltration defense

> **Origine**: [[_user-notes-2026-06-23]] nota 8 ("secret section: dati privati che il modello non deve far uscire") + design **secrets-map guardrail** dell'utente (2026-06-23): "se l'harness rileva un valore di un secret in una tool-call o risposta → blocca e avvisa l'utente". Graduazione della nota 8 a concept.

## Minaccia
Esfiltrazione di dati sensibili (chiavi, password, token, PII, numeri di carta) verso l'esterno tramite: **output al utente**, **argomenti di tool-call**, **log**, **commit**. Il modello potrebbe rivelarli per errore, per sycophancy, o sotto **prompt injection** (richiesta avversaria di "stampa la chiave").

> Duale di [[untrusted-content-delimiting]]: là il rischio è *injection in entrata*; qui è *exfiltration in uscita*.

## Gold-example: path assoluto = leak username (PII)

Caso incorporato da [[path-portability-awareness]] (demoted 2026-06-27). Un **path assoluto** in un artefatto pushato/versionato (es. `/home/<user>/proj/...`, `D:\Users\<user>\proj\...`) **leaka l'username** → stessa superficie PII di un secret: un dato sensibile che esce verso l'esterno via output. Quindi è la **stessa famiglia di difesa** — scan deterministico in uscita + uso di riferimenti relativi (l'analogo dei `SECRET#n` opachi del Livello 2).

Why-chain didattica (gold-example per il modello):

> "vedo che è un repo → un repo può essere clonato → chi lo clona può avere OS e home-dir diverse → un path assoluto si romperebbe altrove **e** leakerebbe l'username → uso path relativi alla root + forward-slash."

Enforcement coerente col Livello 3: un **regex-linter wrapper-side** scansiona l'output verso destinazione versionata (0 backslash, 0 home-dir/username) e blocca/avvisa, esattamente come il secrets-guardrail. Nessun username/path reale negli esempi — solo placeholder `<user>`.

## Difesa in profondità (3+1 livelli)

### Livello 1 — Training adversariale (modello)
- **Red-team RL** (approccio utente, D-collegato): nel post-training, esempi con **istruzioni specifiche che tentano di estrarre** i dati della sezione protetta + **reward negativo** se il modello cede; reward positivo per il rifiuto corretto.
- Combinato con refusal training generale ([[out-of-domain-refusal-training]], stessa famiglia "addestrare il no").
- `[CRITICA]` Il training **non è garanzia**: un modello può sempre essere aggirato → serve il Livello 3.

### Livello 2 — Contesto a riferimenti opachi (struttura)
- La lane `<secrets>` espone **riferimenti `SECRET#n`**, non i valori. Il modello ragiona su "uso SECRET#1" senza vederlo/emetterlo dove possibile.
- Riduce la superficie: il valore raw entra nel contesto solo quando strettamente necessario.

### Livello 3 — Guardrail deterministico (harness) ⭐
- **secrets-map** `key→value` mantenuta dal wrapper.
- **Scanner in uscita**: ogni **tool-call arg** e ogni **token di output** verso l'esterno viene confrontato con i valori della map → su match: **BLOCCA l'azione + avvisa l'utente**.
- **Dinamica & model-driven**: `secrets` è **sempre una lista**, popolata dal modello via tool **`add_secret(value)`** (LLM-callable). Quando il modello legge un secret (es. `secret = "MY_SEC"` hardcoded in un file) **chiama `add_secret`** e da quel momento è protetto dal guardrail. (Vedi [[wrapper-context-assembly-example]] §4 e §7, SECRET#2.) Eventuale auto-detect come complemento.
- È deterministico → non soggetto alle debolezze del modello.

### Livello 4 (opzionale) — Refusal steering vector
- A runtime, un **refusal steering vector** ([[steering-vectors]] #2) come nudge extra verso il rifiuto su tentativi di estrazione. Disattivabile. Rete di sicurezza ridondante, non sostitutiva.

## Edge case / problemi aperti `[da affrontare]`
- **Leakage parziale/frammentato**: il modello emette il secret a pezzi su più messaggi → lo scanner deve normalizzare/concatenare la finestra di output.
- **Leakage trasformato**: secret codificato (base64, hex, reverse, cifrato) → lo scanner deterministico fallisce il match esatto. Mitigazione parziale: normalizzazione/decodifica comune prima del match; problema **non completamente risolvibile** con sole regex → il Livello 1 (training) resta necessario.
- **Falsi positivi**: un valore di secret molto corto/comune può matchare testo legittimo → preferire secret ad alta entropia, o hashing/canary.
- **Secret in chiaro necessari per un tool legittimo** (es. autenticazione a un servizio): serve una **allowlist di destinazioni fidate** per cui il valore può uscire (verso quel tool/endpoint specifico), bloccando tutto il resto.

## Perché defense-in-depth
Nessun livello da solo basta: training aggirabile (L1), struttura non copre i raw quando servono (L2), guardrail fallisce su trasformazioni (L3). **Insieme** coprono i buchi reciproci.

## Next
- Definire il formato della secrets-map + policy allowlist destinazioni.
- Spec dello scanner (normalizzazione, finestra, entropy threshold).
- Dataset red-team per L1 (Wave post-training).
- Esperimento: refusal steering vector su Qwen3-4B per L4.

## Sources
- User notes 2026-06-23, nota 8 + design secrets-map (Telegram msg 44/51 + sessione).
- Collega: [[_user-notes-2026-06-23]], [[wrapper-context-assembly-example]], [[untrusted-content-delimiting]], [[out-of-domain-refusal-training]], [[steering-vectors]], [[pre-flight-safety-checks]], [[agent-constitution]], [[path-portability-awareness]] (gold-example path-as-PII, merged 2026-06-27).
