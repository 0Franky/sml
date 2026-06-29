/**
 * _test-secrets-guardrail — test DETERMINISTICO della difesa-injection model-independent (richiesta
 * utente msg 376). Anche se il modello viene ingannato (prompt-injection) a echeggiare un segreto in
 * un tool_result, il guardrail lo redige. Testa la logica reale (src/secrets-redact.mjs, la stessa
 * importata da .pi/extensions/secrets-guardrail.ts). NESSUN segreto reale: tutti placeholder finti.
 */
import { redactText, SECRET_PATTERNS } from "../../src/secrets-redact.mjs";
import { addSecret, clearSecrets, MIN_SECRET_LEN, MIN_SECRET_DISTINCT } from "../../src/secrets-registry.mjs";

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
// generico key=value NON è un pattern (per non mutilare codice) → testo con 'password = ...' resta intatto
ok(!redactText('const password = "changeme";').hit, "no FP: key=value generico NON redatto (si usa add_secret)");

// --- pattern high-recall aggiunti (review #3 P2 secret-coverage) ---
const fakeJWT = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dQw4w9WgXcQ_signature_part";
ok(redactText(`auth: ${fakeJWT}`).hit, "JWT (eyJ.…) redatto");
ok(redactText(`stripe sk_live_${"a".repeat(24)}`).hit, "Stripe sk_live_ redatto (underscore, gap colmato)");
ok(redactText(`slack xoxb-${"1".repeat(12)}-${"a".repeat(12)}`).hit, "Slack xoxb- redatto");
ok(redactText(`gho_${"a".repeat(36)}`).hit, "GitHub gho_ redatto");
ok(redactText(`github_pat_${"a".repeat(30)}`).hit, "GitHub fine-grained PAT redatto");
ok(redactText(`Authorization: Bearer ${"a".repeat(28)}`).hit, "Bearer <token lungo> redatto");
ok(redactText("clone https://user:supersegreto@git.example.com/x").hit, "basic-auth URL (user:pass@) redatto");
ok(!redactText("vai su https://example.com/path").hit, "no FP: URL normale senza credenziali");

// --- opzione staticPatterns:false (canale tool_call: solo dynamic, niente shape statiche) ---
const onlyDyn = redactText(`chiave ${fakeG} e ${"OPAQUE-TOKEN-xyz789"}`, ["OPAQUE-TOKEN-xyz789"], { staticPatterns: false });
ok(onlyDyn.redacted.includes(fakeG), "staticPatterns:false → NON redige le shape statiche (no mutilazione args legittimi)");
ok(!onlyDyn.redacted.includes("OPAQUE-TOKEN-xyz789"), "staticPatterns:false → redige comunque i dynamic-secrets");

// --- guardia add_secret (review #3 P2 add_secret-no-guard) ---
clearSecrets();
ok(!addSecret("e").ok && addSecret("e").size === 0, `add_secret rifiuta valore < ${MIN_SECRET_LEN} char`);
ok(!addSecret("aaaaaaaa").ok, `add_secret rifiuta valore poco-vario (< ${MIN_SECRET_DISTINCT} char distinti)`);
const good = addSecret("OPAQUE-SESSION-TOKEN-7f3a9c");
ok(good.ok && good.size === 1, "add_secret accetta un valore opaco ad alta entropia");
clearSecrets();

console.log(`\n  pattern statici attivi: ${SECRET_PATTERNS.length} (incl. Google AIza, JWT, Stripe, Slack, Bearer, basic-auth)`);
console.log(`secrets-guardrail smoke-test: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
