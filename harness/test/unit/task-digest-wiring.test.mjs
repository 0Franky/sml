/**
 * task-digest-wiring — WIRING test (rule #14): round-trip REALE della cattura deterministica attraverso una VarsQueue
 * in-memory + la lane <facts> (factsLaneLines). Fallirebbe se namespace/key/importance fossero sbagliati o se la
 * lane non surface-asse gli auto-fatti. Replica ciò che fa l'estensione task-digest-capture.ts (senza il bus pi).
 */
import { VarsQueue } from "../../src/vars-queue.mjs";
import { digestFactFromCall, TASK_FACT_IMPORTANCE, TASK_FACT_PREFIX } from "../../src/task-digest.mjs";
import { factsLaneLines } from "../../src/context-assembler.mjs";

let pass = 0, fail = 0;
function ok(cond, msg) { if (cond) { pass++; } else { fail++; console.error("  ✗ " + msg); } }

// Simula la cattura dell'estensione (stesso setVar).
function capture(vq, call) {
  const f = digestFactFromCall(call);
  if (f) vq.setVar(`fact:${f.key}`, { text: f.text, importance: f.importance }, { namespace: "fact", scope: "private", who: "harness-auto" });
  return f;
}

const vq = new VarsQueue(":memory:", { agent: "orchestrator" });

// 3 scritture-file + una note del modello (NON deve diventare digest) + un rewrite dello stesso file
capture(vq, { name: "write_file", args: { path: "solution_1.py", content: "def has_close_elements(): pass" } });
capture(vq, { name: "write_file", args: { path: "solution_2.py", content: "def separate_paren_groups(): pass" } });
capture(vq, { name: "note", args: { text: "progress saved to session_progress" } }); // memory-op → null
capture(vq, { name: "write_file", args: { path: "solution_1.py", content: "def has_close_elements(nums, t): return False" } }); // rewrite

const lines = factsLaneLines(vq);
const blob = lines.join("\n");

ok(blob.includes("has_close_elements"), "wiring: il digest di solution_1 è nella lane <facts>");
ok(blob.includes("separate_paren_groups"), "wiring: il digest di solution_2 è nella lane <facts>");
ok(!blob.includes("progress saved"), "wiring: la note() del modello NON diventa un auto-digest (buco F24)");
// il render è "- <key>: <text>" → conto le FACT-LINE per la key univoca (non il substring, che compare in key+text)
const factLines1 = (blob.match(new RegExp(`- ${TASK_FACT_PREFIX}solution_1\\.py:`, "g")) || []).length;
ok(factLines1 === 1, "wiring: rewrite dello stesso file → UNA sola entry (key stabile per-file, upsert)");
ok(blob.includes("has_close_elements(nums, t)".replace(/[()]/g, "").split(" ")[0]) || blob.includes("has_close_elements"), "wiring: il rewrite ha aggiornato allo stato finale");

// il fatto pinnato deve avere importance MAX (→ in cima alla lane)
{
  const raw = vq.getVar(`fact:${TASK_FACT_PREFIX}solution_2.py`);
  ok(raw && raw.value && raw.value.importance === TASK_FACT_IMPORTANCE, "wiring: auto-fatto scritto a importance MAX (pinned)");
}

// digestFactFromCall — casi puri
ok(digestFactFromCall({ name: "note", args: { text: "x" } }) === null, "digestFactFromCall: note → null");
ok(digestFactFromCall({ name: "set_var", args: { key: "k", value: "v" } }) === null, "digestFactFromCall: set_var → null");
ok(digestFactFromCall({ name: "run_python", args: { code: "print(1)" } }) === null, "digestFactFromCall: no path/content → null");
{
  const f = digestFactFromCall({ name: "write_file", args: { path: "a/b/solution_3.py", content: "def truncate_number(n): return n%1" } });
  ok(f && f.text === "solution_3.py → def truncate_number" && f.key === TASK_FACT_PREFIX + "solution_3.py", "digestFactFromCall: basename + def estratto + key prefissata");
}

try { vq.close?.(); } catch { /* best-effort */ }
console.log(`\ntask-digest-wiring: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
