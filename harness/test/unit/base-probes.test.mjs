/**
 * base-probes — test del PROBE-SET bake-off + grader deterministico (T5). Verifica: struttura ben formata (id unici,
 * ogni probe gradabile), gradeProbe outcome-ancorato (mustContain/Any/Not + expectNumber robusto a "mostra i passaggi").
 */
import { BASE_PROBES, gradeProbe, probeCategories } from "../../eval/base-probes.mjs";

let pass = 0, fail = 0;
function ok(cond, msg) { if (cond) { pass++; } else { fail++; console.error("  ✗ " + msg); } }

// ── struttura del probe-set ──────────────────────────────────────────────────────────────────────
{
  ok(BASE_PROBES.length >= 10, "probe-set: ≥10 probe");
  const ids = BASE_PROBES.map((p) => p.id);
  ok(new Set(ids).size === ids.length, "probe-set: id unici");
  let wellFormed = true;
  for (const p of BASE_PROBES) {
    const gradable = typeof p.expectNumber === "number" || (p.mustContain?.length || p.mustContainAny?.length);
    if (!p.id || !p.category || !p.prompt || !gradable) wellFormed = false;
  }
  ok(wellFormed, "probe-set: ogni probe {id,category,prompt} + gradabile (expectNumber o mustContain/Any)");
  const cats = probeCategories();
  ok(["shell-bash", "shell-powershell", "shell-cmd", "shell-posix", "python", "javascript", "reasoning"].every((c) => cats.includes(c)),
    "probe-set: copre shell(bash/PS/cmd/sh)+python+js+reasoning (requisito base-agentic-strong)");
}

// ── gradeProbe: expectNumber (robusto al mostrare i passaggi) ─────────────────────────────────────
{
  const p = BASE_PROBES.find((x) => x.id === "reason-sheep"); // expectNumber 9
  ok(gradeProbe(p, "9").pass, "expectNumber: '9' → pass");
  ok(gradeProbe(p, "The farmer has 9 sheep left.").pass, "expectNumber: risposta in prosa con 9 → pass");
  ok(gradeProbe(p, "17 - 8 = 9").pass, "expectNumber: estrae l'ULTIMO intero (9), robusto ai passaggi");
  ok(!gradeProbe(p, "8").pass, "expectNumber: risposta sbagliata '8' → fail");
  ok(!gradeProbe(p, "no idea").pass, "expectNumber: nessun numero → fail");
}

// ── gradeProbe: mustContain / mustContainAny / mustNotContain ──────────────────────────────────────
{
  const bash = BASE_PROBES.find((x) => x.id === "bash-find-delete");
  ok(gradeProbe(bash, "find . -name '*.log' -mtime -1 -delete").pass, "mustContain/Any: find+.log+-mtime+-delete → pass");
  ok(gradeProbe(bash, "find . -name '*.log' -mtime -1 -print").reasons.some((r) => /none of/.test(r)), "mustContainAny: senza delete/rm → fail (gruppo OR non soddisfatto)");
  ok(!gradeProbe(bash, "ls *.log").pass, "mustContain: senza find → fail");

  const cmd = BASE_PROBES.find((x) => x.id === "cmd-recursive-txt");
  ok(gradeProbe(cmd, "dir /s /b *.txt").pass, "cmd: dir /s /b .txt → pass");
  ok(!gradeProbe(cmd, "Get-ChildItem -Recurse *.txt").pass, "cmd: mustNotContain Get-ChildItem → fail (non è CMD)");

  const ps = BASE_PROBES.find((x) => x.id === "ps-proc-memory");
  ok(gradeProbe(ps, "Get-Process | Where-Object { $_.WorkingSet -gt 500MB }").pass, "ps: Get-Process+WorkingSet+Where → pass");
}

console.log(`\nbase-probes: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
