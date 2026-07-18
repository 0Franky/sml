/**
 * task-digest — CATTURA DETERMINISTICA della task-history (lane-persistence-redesign, F24 / utente msg 1256).
 *
 * Problema (F23/F24): la memoria-lane dipende dal fatto che il MODELLO salvi con note(), e i modelli capaci NON
 * salvano la task-history (F23) o deflettono (F24: "ho salvato, pronto per il summary" invece di rispondere → recall 0%).
 * Fix: l'HARNESS estrae il digest di ciò che il modello HA FATTO dalla traccia-tool che ha GIÀ OSSERVATO — indipendente
 * dal salvataggio del modello. Questo modulo è la parte PURA (creazione+contenuto); la ritenzione riusa il meccanismo
 * `importance` esistente (context-assembler.mjs, "pinned in cima") scrivendo il digest a importance MAX.
 *
 * PURO + deterministico → unit-testabile senza modello (disciplina #14: pura+test prima del wiring live).
 */

// Memory-op di SCRITTURA del modello: si ESCLUDONO dal digest E dalla lane <last_tool_calls> (F24: sono i salvataggi
// che affollano l'action-log, non "cosa ha fatto sul task"). Solo le WRITE-op (i read tipo get_var/list_secrets NON
// vanno filtrati dalla lane: aiutano l'anti-ripetizione; e dal digest sono già esclusi dal check args-shape path+content).
export const MEMORY_TOOLS = new Set([
  "note", "jot", "set_var", "remove_note", "record_decision",
]);
// Tool di sola-lettura/navigazione: non sono OUTCOME di task → esclusi (riducono rumore).
export const READONLY_TOOLS = new Set([
  "find_tool", "open_category", "ls", "read_file", "grep", "glob", "cat",
]);

// Rilevamento file-write AGNOSTICO al nome-tool (robusto a varianti write_file/create_file/apply_patch/editor):
// si basa sulla FORMA degli args (un campo path-like + un campo content-like) invece che su una whitelist di nomi.
const PATH_KEYS = ["path", "file_path", "filename", "target_file", "file"];
const CONTENT_KEYS = ["content", "file_text", "new_str", "text", "body"];
function firstKey(obj, keys) {
  if (!obj || typeof obj !== "object") return null;
  for (const k of keys) if (obj[k] != null) return obj[k];
  return null;
}
export function pathOf(args) { const v = firstKey(args, PATH_KEYS); return v == null ? null : String(v); }
export function contentOf(args) { const v = firstKey(args, CONTENT_KEYS); return v == null ? null : String(v); }

// ── Fallback SHELL (utente msg 2026-07-08): il modello può scrivere un file con una redirection di shell invece che con
// un write-tool strutturato — `echo "…" > f`, `cat > f <<'EOF' … EOF`, `printf … > f`, `tee f`, PowerShell `Out-File`/
// `Set-Content`. Questi arrivano come UN arg-comando (command/cmd/script), NON path+content → il digest li mancava. È
// sintassi STRUTTURALE (redirection), non linguaggio naturale → parser deterministico è appropriato (regola #24).
// Solo arg INEQUIVOCABILMENTE-shell: escludo `code`/`input` (contengono codice con `>` di confronto → falsi positivi).
export const CMD_KEYS = ["command", "cmd", "script", "shell_command"];
export function cmdOf(args) { const v = firstKey(args, CMD_KEYS); return v == null ? null : String(v); }

function looksLikeFile(p) {
  if (!p) return false;
  if (/^\/dev\//.test(p) || /^&?\d+$/.test(p)) return false; // /dev/null, fd (2>&1, >&2)
  return /\S/.test(p);
}

/**
 * shellWriteFromCommand — PURO. Da una stringa-comando shell → { path, content } del file scritto per redirection,
 * o null se il comando non scrive file. `content` può essere "" (file registrato ma corpo non estraibile → nessun def).
 * Copre bash/sh/zsh (echo/printf/cat-heredoc/tee/redirect) e PowerShell (Out-File/Set-Content/Add-Content).
 */
export function shellWriteFromCommand(cmd) {
  if (typeof cmd !== "string" || !cmd) return null;
  // 1) heredoc `> file <<EOF … EOF` (content ricco → def estraibili). Marker quotato o no; `-` (<<-) tollerato.
  const hd = cmd.match(/>\s*['"]?([^\s'"<>|;&]+)['"]?\s*<<-?\s*['"]?([A-Za-z_]\w*)['"]?\r?\n([\s\S]*?)\r?\n[ \t]*\2\b/);
  if (hd && looksLikeFile(hd[1])) return { path: hd[1], content: hd[3] };
  // 1b) heredoc PRIMA del redirect: `cat <<EOF > file … EOF`
  const hd2 = cmd.match(/<<-?\s*['"]?([A-Za-z_]\w*)['"]?\s*>\s*['"]?([^\s'"<>|;&]+)['"]?\r?\n([\s\S]*?)\r?\n[ \t]*\1\b/);
  if (hd2 && looksLikeFile(hd2[2])) return { path: hd2[2], content: hd2[3] };
  // 2) `echo|printf "content" > file` (content dalla stringa quotata)
  const ep = cmd.match(/\b(?:echo|printf)\s+(?:-e\s+)?(['"])([\s\S]*?)\1\s*>>?\s*['"]?([^\s'"<>|;&]+)/);
  if (ep && looksLikeFile(ep[3])) return { path: ep[3], content: ep[2] };
  // 3) PowerShell `Set-Content/Add-Content/Out-File [-Path] file` (path only)
  const ps = cmd.match(/\b(?:Set-Content|Add-Content|Out-File)\b[^|>\n]*?(?:-(?:FilePath|Path|LiteralPath)\s+)?['"]?([^\s'"<>|;&]+)/i);
  if (ps && looksLikeFile(ps[1])) return { path: ps[1], content: "" };
  // 4) `tee [-a] file`
  const tee = cmd.match(/\btee\s+(?:-a\s+)?['"]?([^\s'"<>|;&]+)/);
  if (tee && looksLikeFile(tee[1])) return { path: tee[1], content: "" };
  // 5) redirection generica `> file` / `>> file` (path only) — ultima risorsa. Richiede un target con ESTENSIONE o
  //    SEPARATORE (difesa extra anti-falso-positivo: non cattura target-bizzarri/variabili nude).
  const strictFile = (p) => looksLikeFile(p) && (/\.\w{1,8}$/.test(p) || /[\\/]/.test(p));
  let m, lastPath = null;
  const RE = />>?\s*['"]?([^\s'"<>|;&]+)/g;
  while ((m = RE.exec(cmd)) !== null) if (strictFile(m[1])) lastPath = m[1];
  if (lastPath) return { path: lastPath, content: "" };
  return null;
}

// Estrae i nomi di funzione/definizione dal content (Python def / class; JS function). È il segnale che la probe-recall
// richiede (il NOME esatto, non prosa). Deterministico.
const DEF_RE = /\b(?:def|class)\s+([A-Za-z_]\w*)|\bfunction\s+([A-Za-z_]\w*)|\b(?:export\s+)?(?:const|let|var)\s+([A-Za-z_]\w*)\s*=\s*(?:async\s*)?\(/g;
export function extractDefs(content) {
  const names = [];
  if (typeof content !== "string" || !content) return names;
  DEF_RE.lastIndex = 0;
  let m;
  while ((m = DEF_RE.exec(content)) !== null) {
    const name = m[1] || m[2] || m[3];
    if (name && !names.includes(name)) names.push(name);
  }
  return names;
}

function basename(p) {
  if (!p) return "";
  const parts = String(p).split(/[\\/]/);
  return parts[parts.length - 1] || String(p);
}

// ultime ≤2 componenti del path (dir/file) → identificatore self-contained E anti-collisione: app/models.py ≠ api/models.py
// (fix AS6/S2: basename-only sovrascriveva a vicenda i digest di file omonimi in dir diverse e non era self-contained).
function lastTwo(p) {
  if (!p) return "";
  const parts = String(p).split(/[\\/]+/).filter(Boolean);
  return parts.slice(-2).join("/") || String(p);
}

/**
 * buildTaskDigest — dalla traccia-tool osservata → righe di digest compatte "file → def NAME[, …] (esito)".
 * @param {Array<{name?:string,args?:object,status?:string,result?:string,ts?:number}>} toolCalls
 * @param {{ maxLines?:number, maxDefsPerFile?:number }} [opts]
 * @returns {string[]} una riga per file-write significativo (ultimo stato per file), cap maxLines (più recenti)
 */
export function buildTaskDigest(toolCalls, { maxLines = 40, maxDefsPerFile = 6 } = {}) {
  if (!Array.isArray(toolCalls)) return [];
  // per-file: tieni l'ULTIMA scrittura (un file riscritto N volte → una riga, lo stato finale)
  const byFile = new Map(); // basename → { line, order }
  let order = 0;
  for (const tc of toolCalls) {
    const name = tc && tc.name ? String(tc.name) : "";
    if (!name || MEMORY_TOOLS.has(name) || READONLY_TOOLS.has(name)) continue;
    const args = tc.args || {};
    let p = pathOf(args);
    let c = contentOf(args);
    if (p == null || c == null) {           // non è un write-tool strutturato → prova il fallback SHELL (redirection)
      const sw = shellWriteFromCommand(cmdOf(args));
      if (!sw) continue;                    // non è nemmeno una scrittura-file via shell → skip
      p = sw.path; c = sw.content;          // c può essere "" (registra il file, nessun def)
    }
    const defs = extractDefs(c).slice(0, maxDefsPerFile);
    const defPart = defs.length ? ` → ${defs.map((d) => "def " + d).join(", ")}` : "";
    const errPart = tc.status === "error" ? " (error)" : "";
    const label = lastTwo(p);
    byFile.set(label, { line: `${label}${defPart}${errPart}`, order: order++ });
  }
  const rows = [...byFile.values()].sort((a, b) => a.order - b.order).map((x) => x.line);
  return rows.slice(-maxLines);
}

// ── Cattura deterministica (wiring): da una singola tool-call osservata → il FATTO-digest da PINNARE nella lane <facts>.
// Riusa la ritenzione-per-importance esistente (context-assembler: importance desc → pinned in cima) scrivendo a
// importance MAX. È la "creazione+contenuto" (l'harness scrive, coi nomi esatti); la "ritenzione" è il meccanismo esistente.
export const TASK_FACT_PREFIX = "_task:";   // key-prefix riservato → auto-fact identificabili/rimovibili, distinti dai note del modello
export const TASK_FACT_IMPORTANCE = 100;    // pinned in cima a <facts> (la task-history non deve scorrere fuori)

/**
 * digestFactFromCall — PURO. Da una tool-call osservata → { key, text, importance } da scrivere come fatto pinned,
 * oppure null se la call non è una scrittura-file (o è una memory-op/readonly). Testabile senza pi.
 * @param {{name?:string, args?:object, status?:string}} call
 * @returns {{key:string, text:string, importance:number} | null}
 */
export function digestFactFromCall({ name, args, status } = {}) {
  const n = name ? String(name) : "";
  if (!n || MEMORY_TOOLS.has(n) || READONLY_TOOLS.has(n)) return null;
  let p = pathOf(args);
  let c = contentOf(args);
  if (p == null || c == null) {             // fallback SHELL: scrittura via redirection (echo>f, cat<<EOF, Out-File…)
    const sw = shellWriteFromCommand(cmdOf(args));
    if (!sw) return null;
    p = sw.path; c = sw.content;            // c può essere "" → nessun def, ma il file resta registrato
  }
  const label = lastTwo(p);                 // ultime ≤2 componenti del path → key univoca + text self-contained (AS6/S2)
  const defs = extractDefs(c).slice(0, 6);
  const defPart = defs.length ? ` → ${defs.map((d) => "def " + d).join(", ")}` : "";
  const errPart = status === "error" ? " (error)" : "";
  return { key: TASK_FACT_PREFIX + label, text: `${label}${defPart}${errPart}`, importance: TASK_FACT_IMPORTANCE };
}

export default { buildTaskDigest, digestFactFromCall, extractDefs, pathOf, contentOf, cmdOf, shellWriteFromCommand, MEMORY_TOOLS, READONLY_TOOLS, CMD_KEYS, TASK_FACT_PREFIX, TASK_FACT_IMPORTANCE };
