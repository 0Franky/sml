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
import { addSecret as registerEgress } from "./secrets-registry.mjs";

/** Registry sigillato: name → { value, description, allowedSinks[] }. In-memory, MAI su disco in chiaro. */
const SEALED = new Map();
const MAX_SEALED = 256;
const NAME_RE = /^[A-Za-z0-9_.\-]{1,64}$/;
const SECRET_REF = /\{\{secret:([A-Za-z0-9_.\-]+)\}\}/g; // riferimento usato dal modello negli args

/**
 * Registra/aggiorna un sealed-secret. Il valore NON è mai esposto da listSecretsMeta. Lo registra anche in
 * secrets-registry (egress-redaction backstop). @returns {{ok:boolean, name?:string, reason?:string}}
 */
export function setSecret(name, value, { description = "", allowedSinks = [] } = {}) {
  if (typeof name !== "string" || !NAME_RE.test(name)) return { ok: false, reason: "nome non valido (usa [A-Za-z0-9_.-], max 64)" };
  if (typeof value !== "string" || value.length < 1) return { ok: false, reason: "valore vuoto" };
  if (!SEALED.has(name) && SEALED.size >= MAX_SEALED) return { ok: false, reason: `registry pieno (max ${MAX_SEALED})` };
  const sinks = Array.isArray(allowedSinks) ? [...new Set(allowedSinks.map((s) => String(s).toLowerCase().trim()).filter(Boolean))] : [];
  SEALED.set(name, { value, description: String(description || ""), allowedSinks: sinks });
  registerEgress(value); // backstop: redatto da ogni tool_result/output
  return { ok: true, name };
}

/** Vista per il MODELLO: nome + descrizione + allowedSinks, MAI il valore. */
export function listSecretsMeta() {
  return [...SEALED.entries()].map(([name, s]) => ({ name, description: s.description, allowedSinks: s.allowedSinks }));
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

/** Host (lowercase, senza userinfo/porta) dei URL in un testo di operazione. */
export function extractHosts(opText) {
  const out = new Set();
  const re = /\b[a-z][a-z0-9+.\-]*:\/\/([^/\s'"`)]+)/gi;
  let m;
  while ((m = re.exec(String(opText ?? "")))) {
    let h = m[1];
    const at = h.lastIndexOf("@"); if (at >= 0) h = h.slice(at + 1); // toglie user:pass@
    h = h.split(":")[0].toLowerCase(); // toglie :porta
    if (h) out.add(h);
  }
  return [...out];
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
  if (!s) return { allowed: false, reason: "secret inesistente" };
  if (mode === "off") return { allowed: true };
  const hosts = extractHosts(opText);
  const fileExfil = hasFileOrPipeExfil(opText);
  // https-only: un sealed-secret NON transita su http:// in chiaro (vale in strict E warn: è igiene crittografica).
  if (hasInsecureHttp(opText)) return { allowed: false, reason: `'${name}' non può essere inviato su http:// in chiaro (usa https)` };

  if (s.allowedSinks.length) {
    // allow-host fail-closed (vale anche in 'warn': l'allow-list è una scelta esplicita dell'utente)
    if (fileExfil) return { allowed: false, reason: `'${name}' non può essere scritto su file/pipe (scrittura rilevata)` };
    if (!hosts.length) return { allowed: false, reason: `'${name}' richiede una destinazione fra [${s.allowedSinks.join(", ")}] ma nessun host è identificabile nell'operazione (fail-closed)` };
    const bad = hosts.filter((h) => !s.allowedSinks.some((a) => hostMatches(h, a)));
    if (bad.length) return { allowed: false, reason: `'${name}' consentito solo verso [${s.allowedSinks.join(", ")}]; host non permessi: ${bad.join(", ")}` };
    return { allowed: true };
  }

  // secret SENZA allow-list dichiarata → deny-list conservativa
  const reason = fileExfil
    ? `'${name}' senza allowedSinks: scrittura-file/pipe bloccata`
    : hosts.length
      ? `'${name}' senza allowedSinks: invio di rete bloccato (dichiara allowedSinks per usarlo verso un host)`
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
    if (!SEALED.has(name)) { blocked.push({ name, reason: "secret inesistente" }); continue; }
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
    const r = setSecret(name, String(v), { description: m.description ?? "", allowedSinks: m.allowedSinks ?? [] });
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
    if (!SEALED.has(name)) { blocked.push({ name, reason: "secret inesistente" }); continue; }
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

/** Svuota il registry (test / fine-sessione). */
export function clearSealed() {
  SEALED.clear();
}

export default { setSecret, listSecretsMeta, hasSecret, referencedSecrets, extractHosts, hasFileOrPipeExfil, hasInsecureHttp, checkSink, injectSecrets, injectIntoStrings, scanIngress, loadFromEnv, clearSealed };
