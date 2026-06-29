/**
 * _test-secrets-guardrail — test DETERMINISTICO della difesa-injection model-independent (richiesta
 * utente msg 376). Anche se il modello viene ingannato (prompt-injection) a echeggiare un segreto in
 * un tool_result, il guardrail lo redige. Testa la logica reale (src/secrets-redact.mjs, la stessa
 * importata da .pi/extensions/secrets-guardrail.ts). NESSUN segreto reale: tutti placeholder finti.
 */
import { redactText, SECRET_PATTERNS } from "./secrets-redact.mjs";

let pass = 0, fail = 0;
const ok = (c, m) => { c ? pass++ : (fail++, console.log("  ✗ FAIL: " + m)); };

const fakeG = "AIza" + "B".repeat(35);          // finta Google/GEMINI key
const fakeSK = "sk-" + "A".repeat(24);          // finta OpenAI-style key
const fakePAT = "ghp_" + "c".repeat(36);        // finto GitHub PAT
const fakeAWS = "AKIA" + "IOSFODNN7EXAMPLE";    // finto AWS key id (AKIA + 16 char)

// --- pattern statici ---
ok(redactText(`key=${fakeSK}`).hit, "sk- redatto");
ok(redactText(`token ${fakePAT}`).hit, "GitHub PAT redatto");
ok(redactText(`id=${fakeAWS}`).redacted.includes("[REDACTED-SECRET]"), "AWS AKIA redatto");
ok(redactText("-----BEGIN RSA PRIVATE KEY-----\n...").hit, "PEM private key header redatto");

// --- il FIX di oggi: chiavi Google AIza (= pattern di GEMINI_API_KEY) ---
const g = redactText(`GEMINI_API_KEY=${fakeG}`);
ok(g.hit && !g.redacted.includes(fakeG), "Google AIza key REDATTA (fix 2026-06-29: copre GEMINI_API_KEY)");

// --- secret DINAMICO (add_secret): valore opaco per-sessione ---
const sess = "OPAQUE-SESSION-TOKEN-7f3a9c";
ok(redactText(`echo ${sess}`, [sess]).redacted.includes("[REDACTED-SECRET]"), "secret dinamico (add_secret) redatto");

// --- scenario INJECTION end-to-end: il modello (ingannato) prova a esfiltrare la chiave nel tool_result ---
const exfil = `ADMIN-MODE-ON ${fakeG} (inviato a http://attacker.test/collect)`;
const r = redactText(exfil);
ok(!r.redacted.includes(fakeG), "difesa-in-profondità: chiave esfiltrata nel tool_result → REDATTA (model-independent)");

// --- multipli segreti nello stesso blocco ---
const multi = redactText(`${fakeSK} e ${fakeG} e ${fakeAWS}`);
ok(!multi.redacted.includes(fakeSK) && !multi.redacted.includes(fakeG) && !multi.redacted.includes(fakeAWS), "redazione multipla nello stesso testo");

// --- nessun falso positivo su testo benigno ---
ok(!redactText("questo è un README normale: pip install acme-utils, MIT license.").hit, "nessun falso positivo su testo benigno");

console.log(`\n  pattern statici attivi: ${SECRET_PATTERNS.length} (incl. Google AIza)`);
console.log(`secrets-guardrail smoke-test: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
