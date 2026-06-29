/** Smoke-test sliding-var (read/replace per char-range + preview). `node src/sliding-var.test.mjs` */
import { VarsQueue } from "../../src/vars-queue.mjs";
import { slidingRead, slidingReplace } from "../../src/sliding-var.mjs";

let passed = 0, failed = 0;
function ok(c, m) { if (c) passed++; else { failed++; console.error("  ✗ FAIL:", m); } }

const vq = new VarsQueue(":memory:", { agent: "x" });
vq.setVar("doc", "0123456789ABCDEFGHIJ"); // len 20

// read slice [5,10) + context ±2
{
  const r = slidingRead(vq, "doc", 5, 10, 2);
  ok(r.content === "56789", "read content slice");
  ok(r.context_before === "34" && r.context_after === "AB", "read context ±2");
  ok(r.var_total_length === 20, "read total length");
}
// read clamps out-of-range
{
  const r = slidingRead(vq, "doc", 18, 999, 0);
  ok(r.content === "IJ", "read clamps end to length");
}
// replace preview-only → NON applica
{
  const r = slidingReplace(vq, "doc", 5, 10, "XXX", { contextAround: 2, previewOnly: true });
  ok(r.applied === false, "preview-only non applica");
  ok(vq.getVar("doc").value === "0123456789ABCDEFGHIJ", "var invariata dopo preview");
  ok(r.preview.includes("XXX"), "preview mostra il nuovo contenuto");
  ok(r.diff_summary.includes("-5 char") && r.diff_summary.includes("+3 char"), "diff summary");
}
// replace apply → applica
{
  const r = slidingReplace(vq, "doc", 5, 10, "XXX", { previewOnly: false });
  ok(r.applied === true, "apply applica");
  ok(vq.getVar("doc").value === "01234XXXABCDEFGHIJ", "var modificata correttamente");
}
// append (start=end=len)
{
  const len = vq.getVar("doc").value.length;
  slidingReplace(vq, "doc", len, len, "_END", { previewOnly: false });
  ok(vq.getVar("doc").value.endsWith("_END"), "append a fine var");
}
// var inesistente → error
{
  const r = slidingRead(vq, "missing", 0, 1);
  ok(r.error != null, "var inesistente → error");
}

vq.close();
console.log(`\nsliding-var smoke-test: ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
