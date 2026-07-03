/**
 * env-ingest — test di ingestEnvContent (utente msg 811): carica i secret da un env-file sigillandoli, SENZA che il
 * valore passi dal modello. Il risultato contiene SOLO nomi/reason, MAI valori.
 */
import { ingestEnvContent, hasSecret, removeSecret, addAllowedSink, injectTypedRequest } from "../../src/sealed-secrets.mjs";

let pass = 0, fail = 0;
function ok(cond, msg) { if (cond) { pass++; } else { fail++; console.error("  ✗ " + msg); } }

/** valore reale corrente (test-only) via injection verso un host consentito. */
function currentValue(name, host) {
  const inj = injectTypedRequest({ url: `https://${host}/p`, headers: { A: `{{secret:${name}}}` }, body: "" }, "strict");
  return inj.headers?.A;
}

// 1) BASE: più KEY=VALUE + commenti + blank + export + virgolette → sigillati; valore corretto.
{
  ["REDDIT_TOKEN", "FOO_KEY", "QUOTED", "EXPORTED"].forEach(removeSecret);
  const content = [
    "# commento",
    "",
    "REDDIT_TOKEN=abc123xyz",
    'QUOTED="val with spaces"',
    "export EXPORTED=exp-val",
    "FOO_KEY = spaced-value ",
  ].join("\n");
  const r = ingestEnvContent(content, {});
  ok(r.loaded.includes("REDDIT_TOKEN") && r.loaded.includes("QUOTED") && r.loaded.includes("EXPORTED") && r.loaded.includes("FOO_KEY"), "base: 4 secret caricati");
  ok(hasSecret("REDDIT_TOKEN"), "base: REDDIT_TOKEN sigillato");
  // valore corretto (virgolette strippate, trim applicato)
  addAllowedSink("QUOTED", "h.example.com");
  ok(currentValue("QUOTED", "h.example.com") === "val with spaces", "base: virgolette strippate, valore integro");
  addAllowedSink("REDDIT_TOKEN", "oauth.reddit.com");
  ok(currentValue("REDDIT_TOKEN", "oauth.reddit.com") === "abc123xyz", "base: valore reddit integro");
  ok(!String(JSON.stringify(r)).includes("abc123xyz"), "base: il RISULTATO non contiene mai il valore");
  ["REDDIT_TOKEN", "FOO_KEY", "QUOTED", "EXPORTED"].forEach(removeSecret);
}

// 2) LOCKDOWN di default: nessun allowedSinks → non usabile finché non concedi un sink.
{
  removeSecret("LOCKED");
  ingestEnvContent("LOCKED=secret-v", {});
  const before = currentValue("LOCKED", "any.host.com"); // bloccato (no sink) → NON risolto al valore
  ok(before !== "secret-v", "lockdown: senza sink il valore non è iniettabile");
  removeSecret("LOCKED");
}

// 3) SKIP: nome invalido, valore vuoto, riga non-assignment.
{
  removeSecret("VALIDNAME");
  const r = ingestEnvContent(["bad name=x", "EMPTY=", "VALIDNAME=ok", "nonsense line", "=noKey"].join("\n"), {});
  ok(r.loaded.length === 1 && r.loaded[0] === "VALIDNAME", "skip: solo VALIDNAME caricato");
  ok(r.skipped.some((s) => s.key === "bad name" && /invalid name/.test(s.reason)), "skip: nome invalido segnalato");
  ok(r.skipped.some((s) => s.key === "EMPTY" && /empty value/.test(s.reason)), "skip: valore vuoto segnalato");
  removeSecret("VALIDNAME");
}

// 4) ALREADY EXISTS: default skip; overwrite=true → renew del valore.
{
  removeSecret("DUP");
  ingestEnvContent("DUP=first", {});
  const r2 = ingestEnvContent("DUP=second", {}); // no overwrite
  ok(r2.loaded.length === 0 && r2.skipped.some((s) => s.key === "DUP" && /already exists/.test(s.reason)), "dup: skip senza overwrite");
  addAllowedSink("DUP", "h.example.com");
  ok(currentValue("DUP", "h.example.com") === "first", "dup: valore invariato senza overwrite");
  const r3 = ingestEnvContent("DUP=second", { overwrite: true });
  ok(r3.loaded.includes("DUP"), "dup: overwrite=true → ricaricato");
  ok(currentValue("DUP", "h.example.com") === "second", "dup: overwrite aggiorna il valore (sink preservati)");
  removeSecret("DUP");
}

// 5) input degenere → nessun crash, nessun caricamento.
{
  ok(ingestEnvContent("", {}).loaded.length === 0, "vuoto: nessun load");
  ok(ingestEnvContent(null, {}).loaded.length === 0, "null: nessun crash");
}

console.log(`\nenv-ingest: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
