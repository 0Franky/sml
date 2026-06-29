/**
 * _test-temp-read — verifica il pattern "temp file read" (richiesta utente msg 376): leggere on-fly
 * solo una SLICE di una risorsa grande (capability doc / file / var voluminosa) senza scaricarla
 * tutta nel context, usarla, e "chiudere" → economia di contesto. Modella sliding-window-variable-tool
 * (sliding-var.mjs) + harness-capabilities-as-files. Deterministico (no API).
 */
import { VarsQueue } from "../../src/vars-queue.mjs";
import { slidingRead, slidingReplace } from "../../src/sliding-var.mjs";

let pass = 0, fail = 0;
const ok = (c, m) => { c ? pass++ : (fail++, console.log("  ✗ FAIL: " + m)); };

const vq = new VarsQueue(":memory:", { agent: "orchestrator" });

// una "capability doc" grande (es. il catalogo delle capacità dell'harness) — ~6 KB
const sections = [];
for (let i = 0; i < 60; i++) sections.push(`## CAP-${String(i).padStart(2, "0")}: capability numero ${i} — descrizione, hook pi, esempio d'uso, caveat KV-cache.`);
const BIG = sections.join("\n");
vq.setVar("cap_doc", BIG);                       // salvata nel datastore, NON nel context
const total = BIG.length;

// --- READ on-fly di una sola slice (es. la CAP-30) senza scaricare tutto ---
const needle = "## CAP-30:";
const at = BIG.indexOf(needle);
const slice = slidingRead(vq, "cap_doc", at, at + 90, 20);     // 90 char + 20 di contesto per lato
ok(!slice.error, "slidingRead riuscito");
ok(slice.var_total_length === total, `var_total_length corretto (${slice.var_total_length}==${total})`);
ok(slice.content.startsWith("## CAP-30:"), "la slice contiene esattamente la sezione richiesta");
const loaded = slice.content.length + slice.context_before.length + slice.context_after.length;
ok(loaded < total / 10, `economia di contesto: caricati ${loaded} char su ${total} (<10%)`);

// --- harness-capabilities-as-files: leggo CAP-05, annoto, "chiudo" (la var resta nel datastore) ---
const at5 = BIG.indexOf("## CAP-05:");
const cap5 = slidingRead(vq, "cap_doc", at5, at5 + 90);
ok(cap5.content.includes("capability numero 5"), "secondo open-on-fly (CAP-05) indipendente dal primo");

// --- REPLACE chirurgico: preview-then-apply (default previewOnly = NON applica) ---
const prev = slidingReplace(vq, "cap_doc", at5, at5 + 10, "## CAP-05 [DEPRECATA]:");
ok(prev.applied === false, "preview-then-apply: di default NON applica (safety)");
ok(vq.getVar("cap_doc").value.length === total, "la var è intatta dopo la sola preview");

const applied = slidingReplace(vq, "cap_doc", at5, at5 + 10, "## CAP-05 [DEPRECATA]:", { previewOnly: false });
ok(applied.applied === true, "apply esplicito riuscito");
ok(vq.getVar("cap_doc").value.includes("## CAP-05 [DEPRECATA]:"), "replace chirurgico applicato sul char-range");
ok(vq.getVar("cap_doc").value.length !== total, "lunghezza var aggiornata dopo l'apply");

console.log(`\n===== economia di contesto (temp-read) =====`);
console.log(`  doc totale: ${total} char · slice CAP-30 caricata: ${loaded} char (${(100 * loaded / total).toFixed(1)}%)`);
console.log(`  preview CAP-05: "${prev.preview}"  · diff: ${applied.diff_summary}`);
console.log(`\ntemp-read smoke-test: ${pass} passed, ${fail} failed`);
vq.close();
process.exit(fail ? 1 : 0);
