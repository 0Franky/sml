/**
 * gemini-keys — test del loader/rotazione multi-chiave (utente 2026-07-05). Parsing .env iniettato (no file, no rete).
 */
import { loadGeminiKeys, pickKey, maskKey } from "../../eval/gemini-keys.mjs";

let pass = 0, fail = 0;
function ok(cond, msg) { if (cond) { pass++; } else { fail++; console.error("  ✗ " + msg); } }

// GEMINI_API_KEYS (plurale) → array, comma-separated
{
  const ks = loadGeminiKeys("GEMINI_API_KEYS=k1,k2,k3,k4\nOTHER=x\n");
  ok(ks.length === 4 && ks[0] === "k1" && ks[3] === "k4", "KEYS: 4 chiavi comma-separated");
}
// space-separated + quotes strip
{
  const ks = loadGeminiKeys('GEMINI_API_KEYS="a  b   c"\n');
  ok(ks.length === 3 && ks[1] === "b", "KEYS: space-separated + virgolette rimosse");
}
// precedenza: KEYS vince su KEY singola
{
  const ks = loadGeminiKeys("GEMINI_API_KEY=solo\nGEMINI_API_KEYS=x,y\n");
  ok(ks.length === 2 && ks[0] === "x", "PRECEDENZA: GEMINI_API_KEYS vince sulla singola");
}
// fallback: solo GEMINI_API_KEY
{
  const ks = loadGeminiKeys("GEMINI_API_KEY=onlyone\n");
  ok(ks.length === 1 && ks[0] === "onlyone", "FALLBACK: solo GEMINI_API_KEY → 1 chiave");
}
// nessuna chiave → array vuoto
ok(loadGeminiKeys("NOTHING=1\n").length === 0, "VUOTO: nessuna key → []");

// pickKey: rotazione modulo + wrap negativo difensivo
{
  const ks = ["a", "b", "c"];
  ok(pickKey(ks, 0) === "a" && pickKey(ks, 1) === "b" && pickKey(ks, 2) === "c", "PICK: 0/1/2 → a/b/c");
  ok(pickKey(ks, 3) === "a" && pickKey(ks, 4) === "b", "PICK: wrap-around (3→a, 4→b)");
  ok(pickKey(ks, -1) === "c", "PICK: indice negativo → wrap difensivo (-1→c)");
  let threw = false; try { pickKey([], 0); } catch { threw = true; }
  ok(threw, "PICK: zero chiavi → lancia (no silent-undefined)");
}
// maskKey: non leaka (mostra solo prefix…suffix)
{
  const m = maskKey("AIzaSyABCDEFGHIJKLMNOP");
  ok(!m.includes("SyABCDE") && m.startsWith("AIza") && m.includes("…"), "MASK: non rivela il corpo della chiave");
  ok(maskKey("short") === "****", "MASK: chiave corta → ****");
}

console.log(`\ngemini-keys: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
