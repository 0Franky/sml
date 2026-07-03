/**
 * Test pre-flight-gate (node-puro): la deny-list anti-distruttivo. Copre BLOCCATI, CONSENTITI e GAP NOTI
 * (documentati come asserzioni esplicite → visibili, non silenziosi). F-harness deterministico.
 */
import { checkDestructive, blockReason, DESTRUCTIVE_PATTERNS } from "../../src/pre-flight-gate.mjs";

let passed = 0, failed = 0;
function ok(cond, msg) { if (cond) { passed++; } else { failed++; console.error("  ✗ FAIL:", msg); } }
const blocked = (cmd) => checkDestructive(cmd) !== null;

// ── BLOCCATI (comandi distruttivi) ────────────────────────────────────────────────────────────────
ok(blocked("rm -rf /tmp/x"), "BLOCK: rm -rf");
ok(blocked("rm -fr build"), "BLOCK: rm -fr");
ok(blocked("rm -Rf node_modules"), "BLOCK: rm -Rf (uppercase, hardening case-insensitive)");
ok(blocked("sudo rm -rf /"), "BLOCK: rm -rf con prefisso");
ok(blocked("git reset --hard"), "BLOCK: git reset --hard");
ok(blocked("git reset --hard HEAD~3"), "BLOCK: git reset --hard con ref");
ok(blocked("git clean -fd"), "BLOCK: git clean -fd");
ok(blocked("git clean -xdf"), "BLOCK: git clean -xdf");
ok(blocked("mkfs.ext4 /dev/sda1"), "BLOCK: mkfs");
ok(blocked("dd if=/dev/zero of=/dev/sda"), "BLOCK: dd if=");
ok(blocked("echo boom > /dev/sda"), "BLOCK: redirect a /dev/sd*");

// ── CONSENTITI (comandi safe — niente falsi positivi) ─────────────────────────────────────────────
ok(!blocked("ls -la"), "ALLOW: ls -la");
ok(!blocked("rm file.txt"), "ALLOW: rm senza flag (singolo file)");
ok(!blocked("rm -f tempfile"), "ALLOW: rm -f (force ma NON recursive → non catastrofico)");
ok(!blocked("git status"), "ALLOW: git status");
ok(!blocked("git reset --soft HEAD~1"), "ALLOW: git reset --soft");
ok(!blocked("git reset HEAD file"), "ALLOW: git reset (unstage, no --hard)");
ok(!blocked("git clean -n"), "ALLOW: git clean -n (dry-run, no -f)");
ok(!blocked("cat /dev/sda > backup.img"), "ALLOW: LEGGERE da /dev/sda (redirect verso file, non verso il device)");
ok(!blocked(""), "ALLOW: comando vuoto");
ok(!blocked(undefined), "ALLOW: input non-stringa → null (nessun crash)");

// CAVEAT esplicito: la deny-list è TESTUALE (non un parser), quindi 'rm -rf' anche dentro una stringa echo
// viene bloccato (falso positivo accettabile per una deny-list conservativa). Lo documento per trasparenza:
ok(blocked("echo 'rm -rf' is dangerous"), "CAVEAT: 'rm -rf' in una stringa echo È bloccato (deny-list testuale) — noto e accettato");

// ── GAP NOTI (documentati: la deny-list NON è un parser) ──────────────────────────────────────────
// Questi NON sono bloccati oggi. Sono tracciati in wiki/todo.md (coverage backlog). Il reward area-02 nei
// pesi (S) copre l'intento; qui il fallback harness è volutamente conservativo per non generare falsi positivi.
ok(!blocked("rm -r -f build"), "GAP-NOTO: 'rm -r -f' (flag SEPARATI) non bloccato (deny-list non-parser) — tracciato");
ok(!blocked("rm --recursive --force build"), "GAP-NOTO: 'rm --recursive --force' (long-form) non bloccato — tracciato");
ok(!blocked("find . -delete"), "GAP-NOTO: 'find -delete' non bloccato — tracciato");

// ── blockReason + shape ────────────────────────────────────────────────────────────────────────────
{
  const hit = checkDestructive("rm -rf x");
  ok(hit && hit.blocked === true && typeof hit.label === "string", "SHAPE: checkDestructive → {blocked, label, pattern}");
  const r = blockReason(hit);
  ok(/pre-flight.*blocked/i.test(r) && r.includes(hit.label), "REASON: messaggio cita il label del match");
  ok(Array.isArray(DESTRUCTIVE_PATTERNS) && DESTRUCTIVE_PATTERNS.every((p) => p.re instanceof RegExp && typeof p.label === "string"), "PATTERNS: shape {re, label}");
}

console.log(`pre-flight-gate test: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
