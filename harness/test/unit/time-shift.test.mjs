/**
 * time-shift — test dell'ancoraggio temporale delle lane (utente msg 848/849, 2026-07-03).
 */
import { parseSessionStartMs, sessionStartIso, formatShift, shiftPrefix } from "../../src/time-shift.mjs";

let pass = 0, fail = 0;
function ok(cond, msg) { if (cond) { pass++; } else { fail++; console.error("  ✗ " + msg); } }

// ── parseSessionStartMs ──
ok(parseSessionStartMs("sess-1783090971455-startup") === 1783090971455, "parse: sess-<epoch>-startup");
ok(parseSessionStartMs("sess-1783090971455-fork") === 1783090971455, "parse: reason arbitrario");
ok(parseSessionStartMs("main") === null, "parse: 'main' → null (fallback)");
ok(parseSessionStartMs("") === null, "parse: '' → null");
ok(parseSessionStartMs(null) === null, "parse: null → null");
ok(parseSessionStartMs(undefined) === null, "parse: undefined → null");
ok(parseSessionStartMs("sess-abc-startup") === null, "parse: epoch non numerico → null");
ok(parseSessionStartMs("sess-123-startup") === null, "parse: troppo corto (<10 cifre) → null");
ok(parseSessionStartMs("prefix-sess-1783090971455-x") === null, "parse: deve iniziare per 'sess-'");

// ── sessionStartIso ──
ok(sessionStartIso(1783090971455) === "2026-07-03T15:02:51Z", "iso: epoch → ISO senza ms");
ok(sessionStartIso(0) === null, "iso: 0 → null");
ok(sessionStartIso(NaN) === null, "iso: NaN → null");
ok(sessionStartIso(-5) === null, "iso: negativo → null");

// ── formatShift: scale ──
ok(formatShift(0) === "+0s", "shift: 0 → +0s");
ok(formatShift(999) === "+1s", "shift: 999ms → +1s (arrotonda)");
ok(formatShift(37000) === "+37s", "shift: 37s → +37s");
ok(formatShift(59000) === "+59s", "shift: 59s → +59s");
ok(formatShift(60000) === "+1m", "shift: 60s → +1m (secondi 0 omessi)");
ok(formatShift(72000) === "+1m12s", "shift: 72s → +1m12s");
ok(formatShift(192000) === "+3m12s", "shift: 192s → +3m12s");
ok(formatShift(125000) === "+2m05s", "shift: 125s → +2m05s (pad secondi)");
ok(formatShift(3600000) === "+1h", "shift: 3600s → +1h (minuti 0 omessi)");
ok(formatShift(3720000) === "+1h02m", "shift: 3720s → +1h02m (pad minuti)");
ok(formatShift(7380000) === "+2h03m", "shift: 7380s → +2h03m");
ok(formatShift(86400000) === "+1d", "shift: 86400s → +1d");
ok(formatShift(90000000) === "+1d01h", "shift: 25h → +1d01h");

// ── formatShift: robustezza ──
ok(formatShift(-5000) === "+0s", "shift: negativo (skew) → +0s (clamp)");
ok(formatShift(NaN) === "", "shift: NaN → ''");
ok(formatShift(Infinity) === "", "shift: Infinity → ''");

// ── shiftPrefix ──
const start = 1783090971455;
ok(shiftPrefix(start + 5000, start) === "[+5s] ", "prefix: ts+5s → '[+5s] ' (con spazio)");
ok(shiftPrefix(start, start) === "[+0s] ", "prefix: ts==start → '[+0s] '");
ok(shiftPrefix(NaN, start) === "", "prefix: ts mancante → '' (degrada)");
ok(shiftPrefix(start + 5000, null) === "", "prefix: start mancante → '' (degrada)");

console.log(`\ntime-shift: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
