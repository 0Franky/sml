/**
 * var-ops — operazioni sulle variabili PER RIFERIMENTO (F-harness deterministico).
 *
 * Implementa ../../wiki/concepts/variable-operations-by-reference.md (idea utente TG msg 427/431/437):
 * il modello manipola le var senza ricopiarne i valori nel proprio stream → meno errori (SLM piccolo),
 * meno token, più veloce. La trasformazione la ESEGUE l'harness in modo deterministico — MAI eval() di
 * codice arbitrario (RCE/injection). Opera sul datastore vars-queue.mjs.
 *
 * Tre primitive:
 *  - getByPath(obj, path)            — path-access deterministico (dotted + indice), hardened anti proto-pollution.
 *  - extractVar(vq, src, path, dest) — estrae un campo da una var (JSON) e lo salva in un'altra. Versione SICURA
 *                                      di `JSON.parse(read_var(src)).path` (criticità #1: niente eval).
 *  - interpolate(text, vq)           — risolve i marker `{{var:NOME}}` (+ escape `{{!var:NOME}}`) di var ESISTENTI.
 *  - emitToUser(text, vq, opts)      — il CANALE d'uscita: disambiguazione-per-canale (default passthrough,
 *                                      interpola solo se opt-in) + ordine criticità #4 interpolazione→redazione→invio.
 *
 * Sicurezza (variable-operations-by-reference.md §criticità):
 *  #1 path-DSL hardening: solo own-key enumerable (Object.hasOwn), segmenti `__proto__`/`prototype`/`constructor`
 *     rifiutati, opera SOLO su output di JSON.parse (niente getter live), parser lineare + cap lunghezza-path.
 *  #2 error-handling: var non-JSON / path assente → feedback strutturato {ok:false,error}, mai crash.
 *  #3 snapshot non-live: extractVar copia il valore al momento dell'estrazione (no binding live).
 *  #4 segreti: l'interpolazione avviene PRIMA della redazione finale → l'output risolto passa per redactText
 *     (se si redigesse prima, il valore interpolato dopo bypasserebbe lo scanner → esfiltrazione).
 */
import { redactText } from "./secrets-redact.mjs";

/** Chiavi vietate nel path-walk (criticità #1b: anti prototype-pollution). */
const FORBIDDEN_KEYS = new Set(["__proto__", "prototype", "constructor"]);
const MAX_PATH_LEN = 512;
/** Cap dimensione-valore (criticità #1d): la var può contenere contenuto ostile da un'API. */
const MAX_VALUE_BYTES = 256 * 1024; // 256KB: oltre, JSON.parse sincrono bloccherebbe l'event-loop
const MAX_INTERP_CHARS = 8 * 1024; // cap dell'amplificazione: un {{var:big}} non deve gonfiare l'output

/**
 * Parser del sotto-JSONPath ristretto: dotted + indice `[N]`. Es. `data.items[0].status`.
 * Lineare, niente funzioni/operatori/backtracking. Lancia su grammatica non valida.
 * @returns {string[]} segmenti (chiavi e indici come stringhe)
 */
export function parsePath(path) {
  if (typeof path !== "string" || path.trim() === "") throw new Error("path vuoto");
  if (path.length > MAX_PATH_LEN) throw new Error(`path troppo lungo (>${MAX_PATH_LEN})`);
  // normalizza `[N]` → `.N`, poi split su `.`
  const normalized = path.replace(/\[(\d+)\]/g, ".$1");
  const parts = normalized.split(".").filter((p) => p !== "");
  if (parts.length === 0) throw new Error("path senza segmenti");
  for (const p of parts) {
    if (!/^[A-Za-z0-9_$]+$/.test(p)) throw new Error(`segmento di path non valido: '${p}'`);
  }
  return parts;
}

/**
 * Path-access deterministico e sicuro su un valore JSON-plain (output di JSON.parse).
 * @returns {{ok:true, value:any} | {ok:false, error:string}}
 */
export function getByPath(obj, path) {
  let parts;
  try { parts = parsePath(path); }
  catch (e) { return { ok: false, error: e.message }; }

  let cur = obj;
  for (const part of parts) {
    if (FORBIDDEN_KEYS.has(part)) {
      return { ok: false, error: `path '${path}': segment '${part}' forbidden (proto-pollution)` };
    }
    if (cur == null || typeof cur !== "object") {
      return { ok: false, error: `path '${path}': '${part}' on a non-object value` };
    }
    if (Array.isArray(cur)) {
      const idx = Number(part);
      if (!Number.isInteger(idx) || idx < 0 || idx >= cur.length) {
        return { ok: false, error: `path '${path}': index '${part}' out of range [0,${cur.length})` };
      }
      cur = cur[idx];
    } else {
      // SOLO own-key, lette via descriptor (mai la catena prototipale, mai invocare un getter):
      // se la chiave è un accessor (get/set) NON la si valuta → l'invariante "solo dati JSON-plain"
      // diventa enforced anche se un chiamante passa un oggetto live (non solo output di JSON.parse).
      const desc = Object.getOwnPropertyDescriptor(cur, part);
      if (!desc) return { ok: false, error: `path '${path}': key '${part}' missing` };
      if (desc.get || desc.set) return { ok: false, error: `path '${path}': '${part}' is an accessor (getter/setter), not evaluated` };
      cur = desc.value;
    }
  }
  return { ok: true, value: cur };
}

/**
 * Estrae `path` dalla var `src` (JSON) e salva il risultato nella var `dest`.
 * La var può contenere un oggetto già decodificato (es. set_var di un oggetto) o una stringa JSON
 * (es. tool_result auto-catturato): in quel caso si fa JSON.parse. Snapshot, non binding live (#3).
 * @returns {{ok:true, dest:string, value:any} | {ok:false, error:string}}
 */
export function extractVar(vq, src, path, dest, opts = {}) {
  const v = vq.getVar(src);
  if (!v) return { ok: false, error: `var '${src}' not found` };

  let data = v.value;
  if (typeof data === "string") {
    if (data.length > MAX_VALUE_BYTES) return { ok: false, error: `var '${src}' too large (${data.length} > ${MAX_VALUE_BYTES} bytes)` };
    try { data = JSON.parse(data); }
    catch (e) { return { ok: false, error: `var '${src}' is not valid JSON: ${e.message}` }; }
  }
  if (data == null || typeof data !== "object") {
    return { ok: false, error: `var '${src}' is not a JSON object/array` };
  }

  const r = getByPath(data, path);
  if (!r.ok) return r;

  vq.setVar(dest, r.value, {
    // NON ereditare lo scope del src: un campo estratto da una var `shared` NON deve diventare
    // `shared` di default (least-privilege: eviterebbe un widening silenzioso della visibilità segreti).
    scope: opts.scope ?? "private",
    namespace: opts.namespace ?? v.namespace,
    who: opts.who ?? vq.agent,
    decisionRef: opts.decisionRef ?? null,
  });
  return { ok: true, dest, value: r.value };
}

/** Marker di interpolazione: `{{var:NOME}}` (espandi) e `{{!var:NOME}}` (escape → letterale). */
const VAR_MARKER = /\{\{(!?)var:([A-Za-z0-9_$]+)\}\}/g;

function valueToString(value) {
  if (value == null) return "";
  // NB (review P1-D): NON troncare QUI. Il cap va applicato DOPO la redazione (in emitToUser): troncare il valore
  // prima della redazione lascerebbe leakare un prefisso in chiaro di un segreto che cade a cavallo del cap.
  return typeof value === "string" ? value : JSON.stringify(value);
}

/**
 * Risolve i marker `{{var:NOME}}` di var ESISTENTI; tutto il resto passthrough verbatim:
 *  - `{{!var:NOME}}` → letterale `{{var:NOME}}` (escape).
 *  - `{{var:INESISTENTE}}` → invariato (passthrough).
 *  - `{{...}}` non-`var:` (Jinja/Handlebars/Vue) → NON matchato → invariato.
 * NB: va chiamata SOLO su testo instradato per un canale opt-in (vedi emitToUser) — è il CANALE il
 * disambiguatore load-bearing, non il delimitatore.
 */
export function interpolate(text, vq) {
  return String(text).replace(VAR_MARKER, (match, bang, name) => {
    if (bang === "!") return `{{var:${name}}}`; // escape → letterale
    const v = vq.getVar(name);
    if (!v) return match; // var inesistente → passthrough
    return valueToString(v.value);
  });
}

/**
 * CANALE d'uscita verso l'utente. Disambiguazione-per-canale (utente msg 437):
 *  - default `interpolate:false` → PASSTHROUGH: nessuna scansione, ogni `{{...}}` resta letterale (zero collisione).
 *  - `interpolate:true` (opt-in esplicito, es. tool `say`) → risolve i `{{var:NOME}}` di var esistenti.
 * Ordine criticità #4: interpolazione → redazione FINALE → invio (lo scanner segreti opera sull'output risolto).
 * @returns {{text:string, interpolated:boolean, secretHit:boolean}}
 */
export function emitToUser(text, vq, { dynamicSecrets = [], interpolate: doInterpolate = false } = {}) {
  const resolved = doInterpolate ? interpolate(text, vq) : String(text);
  const { redacted, hit } = redactText(resolved, dynamicSecrets);
  // cap DOPO la redazione (review P1-D): anti-amplificazione applicata sul risultato GIÀ redatto, così nessun
  // prefisso di un segreto a cavallo del cap può sfuggire (redazione su testo completo, poi troncamento).
  // fix AS2: il cap è ANTI-AMPLIFICAZIONE dell'interpolazione ({{var:big}}), NON del canale di redazione della risposta
  // finale. In passthrough (interpolate:false) non c'è espansione → non troncare output legittimo (>8KB) dell'assistant.
  const capped = (doInterpolate && redacted.length > MAX_INTERP_CHARS) ? redacted.slice(0, MAX_INTERP_CHARS) + "…[truncated]" : redacted;
  return { text: capped, interpolated: doInterpolate, secretHit: hit };
}

export default { parsePath, getByPath, extractVar, interpolate, emitToUser };
