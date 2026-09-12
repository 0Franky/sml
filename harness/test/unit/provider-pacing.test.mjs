/**
 * installProviderPacing — il pacing è applicato alle chiamate del PROVIDER e a nessun'altra.
 *
 * PERCHE' QUESTO TEST (2026-09-12): il pacer aveva già il suo unit test con orologio finto, ma il difetto
 * reale **non era nella funzione: era nel wiring** — `run-scene.mjs` non la chiamava affatto, e per questo
 * Seed-OSS-36B (candidato PRIMARIO del bake-off) non era mai stato girato su una scena (TPM, F37).
 * Qui si prova la cosa che il wiring deve garantire, con orologio finto e fetch finta: (1) a delay 0 la
 * fetch NON viene avvolta; (2) le chiamate al provider vengono distanziate; (3) quelle che non lo sono
 * (localhost/ollama) NON pagano il ritardo; (4) l'ordine e gli argomenti passano intatti.
 */
import { installProviderPacing, PROVIDER_URL } from "../../eval/pacer.mjs";

let passed = 0, failed = 0;
const ok = (c, m) => { if (c) passed++; else { failed++; console.error("  ✗ FAIL:", m); } };

// orologio finto: il tempo avanza SOLO quando sleep viene chiamato → niente attese vere nel test
let clock = 1000;
const now = () => clock;
const sleep = async (ms) => { clock += ms; };

// (1) delay 0 → no-op: ritorna esattamente la fetch data
const base0 = async () => "risposta";
ok(installProviderPacing(0, { fetchImpl: base0 }) === base0, "a delay 0 la fetch non viene avvolta");
ok(installProviderPacing(-5, { fetchImpl: base0 }) === base0, "a delay negativo la fetch non viene avvolta");

// (2)+(4) chiamate al provider distanziate, argomenti e risposte intatti
{
  clock = 1000;
  const visto = [];
  const base = async (url, opts) => { visto.push({ t: clock, url: String(url), body: opts?.body }); return "ok:" + url; };
  const f = installProviderPacing(45000, { fetchImpl: base, now, sleep });
  const r1 = await f("https://openrouter.ai/api/v1/chat/completions", { body: "a" });
  const r2 = await f("https://api.siliconflow.cn/v1/chat/completions", { body: "b" });
  const r3 = await f("https://openrouter.ai/api/v1/chat/completions", { body: "c" });
  ok(visto.length === 3, "tutte e tre le chiamate sono arrivate alla fetch sottostante");
  ok(r1 === "ok:https://openrouter.ai/api/v1/chat/completions" && r3.endsWith("completions"), "la risposta passa intatta");
  ok(visto[0].body === "a" && visto[1].body === "b" && visto[2].body === "c", "ordine e argomenti intatti");
  ok(visto[0].t === 1000, "la PRIMA chiamata non attende (ritardare l'avvio non ha senso)");
  ok(visto[1].t - visto[0].t >= 45000, `la seconda è distanziata di almeno il delay (osservato ${visto[1].t - visto[0].t})`);
  ok(visto[2].t - visto[1].t >= 45000, `la terza è distanziata dalla seconda (osservato ${visto[2].t - visto[1].t})`);
}

// (3) le NON-provider non pagano il ritardo (è il caso ollama: distanziare localhost è tempo buttato)
{
  clock = 1000;
  const visto = [];
  const base = async (url) => { visto.push({ t: clock, url: String(url) }); return "ok"; };
  const f = installProviderPacing(45000, { fetchImpl: base, now, sleep });
  await f("http://127.0.0.1:11434/api/chat");
  await f("http://localhost:11434/api/chat");
  ok(visto[1].t === visto[0].t, "due chiamate NON-provider non vengono distanziate");
  ok(!PROVIDER_URL.test("http://127.0.0.1:11434/api/chat"), "ollama non è riconosciuto come provider remoto");
  ok(PROVIDER_URL.test("https://api.siliconflow.cn/v1/chat/completions"), "siliconflow è riconosciuto (è il caso per cui il pacing serve)");
}

// (5) una chiamata che FALLISCE non rompe il pacing delle successive (è quando serve di più)
{
  clock = 1000;
  const visto = [];
  let n = 0;
  const base = async (url) => { visto.push(clock); if (++n === 1) throw new Error("429 finto"); return "ok"; };
  const f = installProviderPacing(45000, { fetchImpl: base, now, sleep });
  await f("https://openrouter.ai/v1/completions").catch(() => {});
  await f("https://openrouter.ai/v1/completions");
  ok(visto.length === 2 && visto[1] - visto[0] >= 45000, "dopo un errore il ritardo continua ad essere applicato");
}

console.log(`provider-pacing test: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
