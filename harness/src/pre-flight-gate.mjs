/**
 * pre-flight-gate — logica node-pura del gate anti-distruttivo (estratta da .pi/extensions/pre-flight.ts per testabilità).
 * F-harness deterministico: analogo della foglia area-02 "criticality" (S) addestrata nei pesi. Blocca comandi shell
 * palesemente distruttivi PRIMA dell'esecuzione (Fase 1: HALT + ask). NON è una sandbox: è una deny-list conservativa.
 *
 * Hardening (2026-07-03): pattern CASE-INSENSITIVE → blocca anche `rm -Rf`/`-RF` (stesso intento distruttivo).
 * GAP NOTI documentati nei test (flag separati `rm -r -f`, long-form `--recursive --force`): deny-list, non parser →
 * per intento va accoppiata al reward area-02 nei pesi. Vedi wiki/todo.md (coverage backlog) per l'estensione.
 */

export const DESTRUCTIVE_PATTERNS = [
  { re: /\brm\s+-[a-z]*r[a-z]*f|\brm\s+-[a-z]*f[a-z]*r/i, label: "rm -rf/-fr (recursive force delete)" },
  { re: /\bgit\s+reset\s+--hard\b/i, label: "git reset --hard (discards working tree)" },
  { re: /\bgit\s+clean\s+-[a-z]*f/i, label: "git clean -f (deletes untracked)" },
  { re: /\bmkfs\b/i, label: "mkfs (format filesystem)" },
  { re: /\bdd\s+if=/i, label: "dd if= (raw disk write)" },
  { re: />\s*\/dev\/sd[a-z]/i, label: "redirect to /dev/sd* (raw disk)" },
];

/**
 * @param {string} cmd  il comando shell (event.input.command)
 * @returns {{blocked:true, label:string, pattern:RegExp}|null}  match distruttivo o null (consentito)
 */
export function checkDestructive(cmd) {
  const c = typeof cmd === "string" ? cmd : "";
  if (!c) return null;
  for (const p of DESTRUCTIVE_PATTERNS) if (p.re.test(c)) return { blocked: true, label: p.label, pattern: p.re };
  return null;
}

/** Messaggio di blocco (model-facing, EN) coerente con la fase corrente (HALT + ask). */
export function blockReason(hit) {
  return `pre-flight: potentially destructive command blocked (${hit.label}). Explicit confirmation required. (Phase 1: HALT + ask the user, automod gate.)`;
}

export default { DESTRUCTIVE_PATTERNS, checkDestructive, blockReason };
