/**
 * response-capture — unit test dell'estrazione PURA del valore dalla risposta (renewal, utente msg 799).
 */
import { extractCaptureValue } from "../../src/response-capture.mjs";

let pass = 0, fail = 0;
function ok(cond, msg) { if (cond) { pass++; } else { fail++; console.error("  ✗ " + msg); } }
function val(r, expected, msg) { ok(r.ok && r.value === expected, `${msg} (avuto ${JSON.stringify(r)})`); }
function no(r, msg) { ok(r && r.ok === false && typeof r.reason === "string", `${msg} (avuto ${JSON.stringify(r)})`); }

// ── JSON path ──
const oauth = JSON.stringify({ access_token: "AT-123", data: { token: "DT-9" }, list: [{ k: "first" }, { k: "second" }] });
val(extractCaptureValue(oauth, {}, "$.access_token"), "AT-123", "json: $.access_token");
val(extractCaptureValue(oauth, {}, "access_token"), "AT-123", "json: senza $ iniziale");
val(extractCaptureValue(oauth, {}, "$.data.token"), "DT-9", "json: path annidato");
val(extractCaptureValue(oauth, {}, "list[0].k"), "first", "json: indice array");
val(extractCaptureValue(oauth, {}, "list[1].k"), "second", "json: indice array 1");
no(extractCaptureValue(oauth, {}, "$.missing"), "json: path assente → reason");
no(extractCaptureValue(oauth, {}, "$.data"), "json: valore non-stringa (oggetto) → reason");
no(extractCaptureValue("not json", {}, "$.x"), "json: body non-JSON → reason");

// ── regex ──
val(extractCaptureValue("token=ABC123;expires=1", {}, "regex:token=([A-Z0-9]+)"), "ABC123", "regex: gruppo 1");
val(extractCaptureValue("PLAINTOKEN", {}, "regex:[A-Z]+"), "PLAINTOKEN", "regex: gruppo 0 se no gruppo 1");
no(extractCaptureValue("xyz", {}, "regex:NOPE([0-9]+)"), "regex: nessun match → reason");
no(extractCaptureValue("x", {}, "regex:([")  , "regex: pattern invalido → reason");

// ── header ──
val(extractCaptureValue("", { "x-new-token": "HDR-1" }, "header:X-New-Token"), "HDR-1", "header: case-insensitive");
val(extractCaptureValue("", { location: "https://h/x" }, "header:location"), "https://h/x", "header: presente");
no(extractCaptureValue("", {}, "header:X-Absent"), "header: assente → reason");
no(extractCaptureValue("", {}, "header:"), "header: nome vuoto → reason");

// ── spec vuota ──
no(extractCaptureValue(oauth, {}, ""), "spec vuota → reason");
no(extractCaptureValue(oauth, {}, "   "), "spec whitespace → reason");

// ── il reason non contiene MAI il valore ──
{
  const r = extractCaptureValue(JSON.stringify({ tok: "SUPER-SECRET-VAL" }), {}, "$.missing");
  ok(r.ok === false && !String(r.reason).includes("SUPER-SECRET-VAL"), "reason non contiene il valore");
}

console.log(`\nresponse-capture: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
