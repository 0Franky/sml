/**
 * base-probes — il PROBE-SET del bake-off base-model (T5, utente msg 1341 "validiamo entrambi" + msg 1322
 * "base super forte su bash/PowerShell/sh/CMD + python/JS base"). Misura le capacità che il nostro Tier-1 DEVE avere
 * per operare OS + harness: shell multi-piattaforma, python/JS di base, e ragionamento (Tier-1 = intelligenza).
 *
 * Ogni probe è OUTCOME-ancorato (rule #10): il grader deterministico verifica che l'output CONTENGA il comando/la
 * risposta corretti, non la cerimonia. `mustContain` (tutti), `mustContainAny` (≥1 per gruppo = OR di alternative
 * equivalenti), `mustNotContain` (nessuno), `expectNumber` (per i reasoning: estrae l'ULTIMO intero e confronta →
 * robusto a "reply only the number" e al mostrare i passaggi). PURO/testabile: il grader non tocca la rete.
 *
 * NB: sono probe di CAPACITÀ (bake-off), non di sicurezza; il grader è un primo-segnale deterministico (come
 * checkResistance), non un giudice semantico. Per un ranking fine si affianca un judge, ma questo dà già il segnale forte.
 */

/** @typedef {{ id:string, category:string, prompt:string, mustContain?:RegExp[], mustContainAny?:RegExp[][], mustNotContain?:RegExp[], expectNumber?:number, note?:string }} Probe */

/** @type {Probe[]} */
export const BASE_PROBES = [
  // ── shell: bash ────────────────────────────────────────────────────────────────────────────────
  { id: "bash-find-delete", category: "shell-bash",
    prompt: "Give ONLY a bash one-liner (no explanation, no markdown fences) that finds every file ending in .log under the current directory tree modified in the last 24 hours and deletes them.",
    mustContain: [/\bfind\b/, /\.log/],
    mustContainAny: [[/-mtime/, /-mmin/, /-newermt/], [/-delete\b/, /-exec\s+rm/, /\|\s*xargs\s+rm/]],
    mustNotContain: [/rm\s+-rf\s+\/(\s|$)/] },
  { id: "bash-count-lines", category: "shell-bash",
    prompt: "Give ONLY a bash command (no explanation) that counts the total number of lines across all .py files under the src/ directory.",
    mustContain: [/wc\s+-l/],
    mustContainAny: [[/\bfind\b/, /\*\*/, /src\/\*\.py/, /\.py/]] },

  // ── shell: PowerShell ──────────────────────────────────────────────────────────────────────────
  { id: "ps-proc-memory", category: "shell-powershell",
    prompt: "Give ONLY a PowerShell command (no explanation) that lists the processes currently using more than 500 MB of working-set memory.",
    mustContain: [/Get-Process/i],
    mustContainAny: [[/WorkingSet/i, /\bWS\b/i, /\bPM\b/i], [/Where-Object/i, /\?\s*\{/, /-gt\b/i]] },
  { id: "ps-recursive-txt", category: "shell-powershell",
    prompt: "Give ONLY a PowerShell command (no explanation) that recursively lists all *.txt files under the current folder.",
    mustContain: [/Get-ChildItem|\bgci\b|\bls\b|\bdir\b/i],
    mustContainAny: [[/-Recurse/i, /-r\b/i], [/\*\.txt/i, /-Filter/i, /-Include/i]] },

  // ── shell: Windows CMD (cmd.exe) ───────────────────────────────────────────────────────────────
  { id: "cmd-recursive-txt", category: "shell-cmd",
    prompt: "Give ONLY a Windows CMD (cmd.exe, NOT PowerShell) command that recursively lists the full paths of all .txt files under the current directory.",
    mustContain: [/\bdir\b/i, /\.txt/i],
    mustContainAny: [[/\/s\b/i], [/\/b\b/i]],
    mustNotContain: [/Get-ChildItem/i] },

  // ── shell: POSIX sh (portabile) ────────────────────────────────────────────────────────────────
  { id: "sh-third-column", category: "shell-posix",
    prompt: "Give ONLY a POSIX sh command (portable, not bash-specific) that prints the 3rd whitespace-separated column of a file named data.txt.",
    mustContainAny: [[/awk[^\n]*\$3/, /cut[^\n]*-f\s?3/, /cut[^\n]*-f3/]] },

  // ── python (base) ──────────────────────────────────────────────────────────────────────────────
  { id: "py-palindrome", category: "python",
    prompt: "Write ONLY a Python function `is_palindrome(s)` (no explanation) that returns True if the string s reads the same forwards and backwards, ignoring case.",
    mustContain: [/def\s+is_palindrome/],
    mustContainAny: [[/\[::-1\]/, /reversed\(/], [/\.lower\(\)/, /\.casefold\(\)/]] },
  { id: "py-sum-squares", category: "python",
    prompt: "Write ONLY a single-line Python expression (no explanation) that evaluates to the sum of the squares of the integers from 1 to 100 inclusive.",
    mustContain: [/sum\(/, /range\(/],
    mustContainAny: [[/\*\*\s*2/, /i\*i/, /x\*x/, /\*\*2/]] },

  // ── javascript (base) ──────────────────────────────────────────────────────────────────────────
  { id: "js-array-sum", category: "javascript",
    prompt: "Write ONLY a JavaScript arrow function assigned to `sum` (no explanation) that returns the sum of an array of numbers.",
    mustContain: [/=>/],
    mustContainAny: [[/reduce\(/, /for\s*\(/, /for\s*\(\s*const/]] },
  { id: "js-unique", category: "javascript",
    prompt: "Write ONLY a single-line JavaScript expression (no explanation) that returns the unique values of an array named `arr`.",
    mustContainAny: [[/new\s+Set\(/, /\bSet\(/, /filter\(/]] },

  // ── reasoning / intelligence (Tier-1) ─────────────────────────────────────────────────────────
  { id: "reason-sheep", category: "reasoning",
    prompt: "A farmer has 17 sheep. All but 9 run away. How many sheep does the farmer have left? Reply with ONLY the number.",
    expectNumber: 9 },
  { id: "reason-widgets", category: "reasoning",
    prompt: "If it takes 5 machines 5 minutes to make 5 widgets, how many minutes would it take 100 machines to make 100 widgets? Reply with ONLY the number.",
    expectNumber: 5 },
  { id: "reason-days", category: "reasoning",
    prompt: "A lily pad patch doubles in size every day and covers the whole lake on day 48. On which day was the lake half covered? Reply with ONLY the number.",
    expectNumber: 47 },
];

/** Ultimo intero (con eventuale segno) in una stringa, o null. Robusto a "reply only the number" e al mostrare i passaggi. */
function lastInt(s) {
  const m = String(s).match(/-?\d+/g);
  return m && m.length ? parseInt(m[m.length - 1], 10) : null;
}

/**
 * gradeProbe — valuta l'output del modello contro un probe. Deterministico, outcome-ancorato.
 * @param {Probe} probe
 * @param {string} output
 * @returns {{ pass:boolean, reasons:string[] }}  reasons = perché è fallito (vuoto se pass)
 */
export function gradeProbe(probe, output) {
  const text = String(output ?? "");
  const reasons = [];
  if (typeof probe.expectNumber === "number") {
    const got = lastInt(text);
    if (got !== probe.expectNumber) reasons.push(`expected ${probe.expectNumber}, got ${got}`);
    return { pass: reasons.length === 0, reasons };
  }
  for (const re of probe.mustContain ?? []) if (!re.test(text)) reasons.push(`missing ${re}`);
  for (const group of probe.mustContainAny ?? []) if (!group.some((re) => re.test(text))) reasons.push(`none of ${group.map(String).join("|")}`);
  for (const re of probe.mustNotContain ?? []) if (re.test(text)) reasons.push(`forbidden ${re}`);
  return { pass: reasons.length === 0, reasons };
}

/** Le categorie presenti nel probe-set (per il report per-categoria). */
export function probeCategories() {
  return [...new Set(BASE_PROBES.map((p) => p.category))];
}

export default { BASE_PROBES, gradeProbe, probeCategories };
