/**
 * task-digest — test dell'estrattore PURO della cattura deterministica (F24 / lane-persistence-redesign).
 * Puro + deterministico, nessun modello. Encoda l'invariante: dalla traccia-tool osservata → i nomi-funzione esatti
 * dei file scritti, escluse le memory-op del modello (il buco di F24).
 */
import { buildTaskDigest, extractDefs, pathOf, contentOf } from "../../src/task-digest.mjs";

let pass = 0, fail = 0;
function ok(cond, msg) { if (cond) { pass++; } else { fail++; console.error("  ✗ " + msg); } }
const wf = (path, content, extra = {}) => ({ name: "write_file", args: { path, content }, status: "ok", ...extra });

// ── extractDefs ──
ok(extractDefs("def has_close_elements(x):\n  pass").join(",") === "has_close_elements", "defs: python def");
ok(extractDefs("class Foo:\n  pass").join(",") === "Foo", "defs: python class");
ok(extractDefs("function bar(a){}").join(",") === "bar", "defs: js function");
ok(extractDefs("export const baz = (x) => x").join(",") === "baz", "defs: js const arrow");
ok(extractDefs("def a():\n def a():\n pass").join(",") === "a", "defs: dedup");
ok(extractDefs("").length === 0 && extractDefs(null).length === 0, "defs: vuoto/null → []");
{
  const d = extractDefs("def f(): pass\ndef g(): pass");
  ok(d.length === 2 && d[0] === "f" && d[1] === "g", "defs: multipli in ordine");
}

// ── pathOf / contentOf (args-shape agnostico al nome-tool) ──
ok(pathOf({ file_path: "s.py" }) === "s.py", "pathOf: file_path");
ok(pathOf({ path: "a" }) === "a" && pathOf({}) === null, "pathOf: path / assente→null");
ok(contentOf({ file_text: "x" }) === "x" && contentOf({}) === null, "contentOf: file_text / assente→null");

// ── buildTaskDigest: caso base ──
{
  const d = buildTaskDigest([wf("solution_1.py", "def has_close_elements(nums, t):\n  return False")]);
  ok(d.length === 1 && d[0] === "solution_1.py → def has_close_elements", "digest: file→def base");
}
// ── ordine + multipli file ──
{
  const d = buildTaskDigest([
    wf("solution_1.py", "def has_close_elements(): pass"),
    wf("solution_2.py", "def separate_paren_groups(): pass"),
  ]);
  ok(d.length === 2 && d[0].includes("has_close_elements") && d[1].includes("separate_paren_groups"), "digest: 2 file in ordine");
}
// ── IL BUCO DI F24: le memory-op del modello NON entrano nel digest ──
{
  const d = buildTaskDigest([
    { name: "note", args: { text: "session_progress: implemented stuff" }, status: "ok" },
    wf("solution_3.py", "def truncate_number(n): return n%1"),
    { name: "set_var", args: { key: "progress", value: "x" }, status: "ok" },
    { name: "jot", args: { text: "scratch" }, status: "ok" },
  ]);
  ok(d.length === 1 && d[0] === "solution_3.py → def truncate_number", "digest: ESCLUDE note/set_var/jot (buco F24)");
}
// ── readonly esclusi ──
{
  const d = buildTaskDigest([
    { name: "find_tool", args: { q: "write" }, status: "ok" },
    { name: "ls", args: {}, status: "ok" },
    wf("solution_4.py", "def below_zero(ops): pass"),
  ]);
  ok(d.length === 1 && d[0].includes("below_zero"), "digest: ESCLUDE find_tool/ls (readonly)");
}
// ── rewrite stesso file → una riga (stato finale) ──
{
  const d = buildTaskDigest([
    wf("solution_5.py", "def wrong(): pass"),
    wf("solution_5.py", "def mean_absolute_deviation(xs): pass"),
  ]);
  ok(d.length === 1 && d[0] === "solution_5.py → def mean_absolute_deviation", "digest: rewrite → una riga (ultimo stato)");
}
// ── error status ──
ok(buildTaskDigest([wf("s.py", "def f(): pass", { status: "error" })])[0] === "s.py → def f (error)", "digest: status error");
// ── nome-tool alternativo (create_file / apply_patch) via args-shape ──
{
  const d = buildTaskDigest([{ name: "create_file", args: { file_path: "s.py", file_text: "def intersperse(): pass" }, status: "ok" }]);
  ok(d.length === 1 && d[0].includes("intersperse"), "digest: create_file (args-shape, nome-agnostico)");
}
// ── tool senza path/content → skip; file senza def → riga senza def ──
ok(buildTaskDigest([{ name: "run_python", args: { code: "print(1)" }, status: "ok" }]).length === 0, "digest: no path/content → skip");
ok(buildTaskDigest([wf("data.txt", "just text")])[0] === "data.txt", "digest: file senza def → solo path");
// ── maxLines cap (più recenti) ──
{
  const many = Array.from({ length: 10 }, (_, i) => wf(`f${i}.py`, `def fn${i}(): pass`));
  const d = buildTaskDigest(many, { maxLines: 3 });
  ok(d.length === 3 && d[0].includes("f7") && d[2].includes("f9"), "digest: cap maxLines (tiene i più recenti)");
}
// ── input degenere ──
ok(buildTaskDigest([]).length === 0 && buildTaskDigest(null).length === 0, "digest: vuoto/null → []");

console.log(`\ntask-digest: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
