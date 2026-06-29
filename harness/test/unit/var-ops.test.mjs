/**
 * Smoke-test di var-ops (operazioni sulle var per riferimento). Zero dipendenze/Docker.
 * Verifica le proprietà di design di ../../wiki/concepts/variable-operations-by-reference.md:
 * path-DSL hardened (no eval, anti proto-pollution), extract_var, interpolazione, disambiguazione-per-canale,
 * ordine criticità #4 interpolazione→redazione→invio (TB-01/TB-04).
 */
import { parsePath, getByPath, extractVar, interpolate, emitToUser } from "../../src/var-ops.mjs";
import { VarsQueue } from "../../src/vars-queue.mjs";

let passed = 0, failed = 0;
function ok(cond, msg) { if (cond) { passed++; } else { failed++; console.error("  ✗ FAIL:", msg); } }

// 1) getByPath — dotted + indice + sicurezza ----------------------------------
{
  const obj = { status: "ok", data: { items: [{ id: 7 }, { id: 8 }] }, count: 2 };
  ok(getByPath(obj, "status").value === "ok", "PATH: dotted top-level");
  ok(getByPath(obj, "data.items[0].id").value === 7, "PATH: dotted + indice annidato");
  ok(getByPath(obj, "data.items[1].id").value === 8, "PATH: indice 1");
  ok(getByPath(obj, "count").value === 2, "PATH: valore numerico");

  // errori → {ok:false}, mai crash (criticità #2)
  ok(getByPath(obj, "data.items[5].id").ok === false, "PATH: indice fuori range → errore");
  ok(getByPath(obj, "nope").ok === false, "PATH: chiave assente → errore");
  ok(getByPath(obj, "status.foo").ok === false, "PATH: discesa su non-oggetto → errore");

  // anti proto-pollution (criticità #1b)
  ok(getByPath(obj, "__proto__").ok === false, "PATH: __proto__ vietato");
  ok(getByPath(obj, "constructor.prototype").ok === false, "PATH: constructor/prototype vietato");
  ok(getByPath({}, "__proto__.polluted").ok === false, "PATH: proto-walk bloccato");
  // accede SOLO a own-key: una chiave ereditata non è raggiungibile
  const inherited = Object.create({ secret: "X" });
  inherited.own = 1;
  ok(getByPath(inherited, "own").value === 1, "PATH: own-key ok");
  ok(getByPath(inherited, "secret").ok === false, "PATH: chiave ereditata (non-own) NON raggiungibile");

  // grammatica invalida → errore (no eval, parser ristretto)
  ok(getByPath(obj, "data; rm -rf").ok === false, "PATH: grammatica non valida rifiutata");
  try { parsePath(""); ok(false, "PATH: parsePath('') deve lanciare"); }
  catch { ok(true, "PATH: parsePath('') lancia su vuoto"); }
}

// 2) extractVar — da var JSON-string e da var oggetto --------------------------
{
  const vq = new VarsQueue(":memory:", { agent: "orchestrator" });
  // tool_result tipico: una STRINGA JSON catturata in una var
  vq.setVar("apiResult", '{"status":"ok","data":{"items":[{"id":7}]}}');
  const r1 = extractVar(vq, "apiResult", "status", "statusApi");
  ok(r1.ok && r1.value === "ok", "EXTRACT: da var JSON-string");
  ok(vq.getVar("statusApi").value === "ok", "EXTRACT: dest salvata nel vars-queue");
  const r2 = extractVar(vq, "apiResult", "data.items[0].id", "firstId");
  ok(r2.ok && r2.value === 7, "EXTRACT: path annidato");

  // da var che contiene già un oggetto
  vq.setVar("objVar", { a: { b: 42 } });
  ok(extractVar(vq, "objVar", "a.b", "out").value === 42, "EXTRACT: da var oggetto");

  // errori robusti (criticità #2)
  ok(extractVar(vq, "missing", "x", "d").ok === false, "EXTRACT: var sorgente assente → errore");
  vq.setVar("notJson", "questo non è json {");
  ok(extractVar(vq, "notJson", "x", "d").ok === false, "EXTRACT: var non-JSON → errore");
  ok(extractVar(vq, "apiResult", "nope.path", "d").ok === false, "EXTRACT: path assente → errore");

  // audit: l'estrazione è loggata (criticità #5)
  ok(vq.getChangeLog({ entity: "vars", entityId: "statusApi" }).length >= 1, "EXTRACT: operazione loggata (audit)");
  vq.close();
}

// 3) interpolate — risoluzione + passthrough + escape -------------------------
{
  const vq = new VarsQueue(":memory:", { agent: "x" });
  vq.setVar("statusApi", "ok");
  ok(interpolate("stato: {{var:statusApi}}", vq) === "stato: ok", "INTERP: var esistente risolta");
  ok(interpolate("manca: {{var:assente}}", vq) === "manca: {{var:assente}}", "INTERP: var inesistente passthrough");
  ok(interpolate("escape: {{!var:statusApi}}", vq) === "escape: {{var:statusApi}}", "INTERP: escape → letterale");
  // Jinja/Handlebars: `{{name}}` senza `var:` NON è matchato → passthrough (disambiguazione grammaticale)
  ok(interpolate("Jinja: {{ name }} e {{user.id}}", vq) === "Jinja: {{ name }} e {{user.id}}",
     "INTERP: {{...}} non-var passthrough (no clobber di Jinja/Vue)");
  vq.close();
}

// 4) emitToUser — DISAMBIGUAZIONE-PER-CANALE + ordine segreti (criticità #4) ---
{
  const vq = new VarsQueue(":memory:", { agent: "x" });
  vq.setVar("statusApi", "ok");

  // DEFAULT (no opt-in): passthrough totale → `{{var:x}}` resta LETTERALE (il canale è il disambiguatore)
  const def = emitToUser("ecco un template: {{var:statusApi}}", vq);
  ok(def.text === "ecco un template: {{var:statusApi}}" && def.interpolated === false,
     "CANALE: default passthrough — NON espande (disambiguazione per canale)");

  // OPT-IN (interpolate:true, es. tool `say`): risolve
  const said = emitToUser("stato: {{var:statusApi}}", vq, { interpolate: true });
  ok(said.text === "stato: ok" && said.interpolated === true, "CANALE: opt-in interpola");

  // anche nel canale opt-in, un `{{name}}` Jinja resta letterale (serve grammatica var:)
  const jinja = emitToUser("template Vue: {{ name }}", vq, { interpolate: true });
  ok(jinja.text === "template Vue: {{ name }}", "CANALE: opt-in non clobbera {{...}} non-var");

  // CRITICITÀ #4: var con SEGRETO → interpolazione PRIMA, redazione DOPO → l'output è redatto
  // chiave Google SINTETICA (matcha il pattern statico AIza…, NON è reale)
  const fakeKey = "AIza" + "A".repeat(35);
  vq.setVar("leak", fakeKey);
  const out = emitToUser("la chiave è {{var:leak}}", vq, { interpolate: true });
  ok(!out.text.includes(fakeKey), "SEGRETI #4: il segreto interpolato NON esce in chiaro");
  ok(out.text.includes("[REDACTED-SECRET]") && out.secretHit === true, "SEGRETI #4: redatto dopo l'interpolazione");

  // segreto dinamico per-sessione
  vq.setVar("msg", "password: hunter2-super-segreta-xyz");
  const dyn = emitToUser("{{var:msg}}", vq, { interpolate: true, dynamicSecrets: ["hunter2-super-segreta-xyz"] });
  ok(!dyn.text.includes("hunter2-super-segreta-xyz"), "SEGRETI #4: segreto dinamico redatto post-interpolazione");
  vq.close();
}

console.log(`\nvar-ops smoke-test: ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
