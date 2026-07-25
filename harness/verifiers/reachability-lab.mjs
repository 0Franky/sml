#!/usr/bin/env node
/**
 * reachability-lab — TERZO gate eseguito. Rende misurabile
 * `class-artifact-reachability-completion`: un pezzo non e' finito quando FUNZIONA,
 * e' finito quando QUALCUNO CI ARRIVA.
 *
 * PERCHE' IL GATE NON E' BANALE
 * Il traversal da solo (Q1) e' battuto da "collega tutto a tutto": passa sempre. Serve il
 * termine di COSTO (Q2), che misura i collegamenti in eccesso rispetto al minimo. E serve
 * il caso in cui la risposta giusta e' NON collegare (Q3, il privato): senza, si insegna
 * "indicizza tutto", che distrugge la raggiungibilita' esattamente come la sua assenza —
 * un indice che elenca ogni cosa non orienta piu' nessuno.
 *
 * BONUS: `--repo` esegue lo stesso traversal sulla WIKI REALE e stampa le pagine che
 * nessun'altra pagina raggiunge partendo da index.md. Il lab e' anche uno strumento.
 *
 * USO   node harness/verifiers/reachability-lab.mjs [--verbose] [--repo]
 *       exit 0 = il gate REGGE · exit 1 = ROTTO
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, resolve, dirname, basename, extname } from "node:path";

// --- MONDO: nodi con un flag "chi deve raggiungerlo" -----------------------
//   public  -> deve essere raggiungibile dall'ingresso
//   private -> NON deve esserlo (nota personale, scratch, config locale)
function makeWorld(fx) {
  return { nodes: structuredClone(fx.nodes), links: [], entry: fx.entry };
}
const apiOf = (w) => ({
  list: () => Object.keys(w.nodes),
  entry: () => w.entry,
  /** Il risolutore vede la destinazione dichiarata di ogni nodo. */
  audience: (id) => w.nodes[id].audience,
  link: (from, to) => w.links.push([from, to]),
});

/** Q1 — traversal dall'ingresso: chi e' raggiungibile? */
function reachable(w) {
  const seen = new Set([w.entry]), stack = [w.entry];
  while (stack.length) {
    const cur = stack.pop();
    for (const [a, b] of w.links) if (a === cur && !seen.has(b)) { seen.add(b); stack.push(b); }
  }
  return seen;
}

// --- FIXTURE: bilanciate pubblico/privato ----------------------------------
const N = (audience) => ({ audience });
const FIXTURES = [
  { id: "1-pubblico", entry: "index",
    nodes: { index: N("public"), a: N("public"), b: N("public") } },
  { id: "2-misto", entry: "index",
    nodes: { index: N("public"), a: N("public"), scratch: N("private") } },
  { id: "3-quasi-tutto-privato", entry: "index",
    nodes: { index: N("public"), a: N("public"), s1: N("private"), s2: N("private"), s3: N("private") } },
  { id: "4-catena", entry: "index",
    nodes: { index: N("public"), a: N("public"), b: N("public"), c: N("public"), tmp: N("private") } },
];

// --- SCORER -----------------------------------------------------------------
function run(fx, policy) {
  const w = makeWorld(fx);
  policy(apiOf(w), fx.id);
  const R = reachable(w);
  const pub = Object.keys(w.nodes).filter((k) => w.nodes[k].audience === "public");
  const priv = Object.keys(w.nodes).filter((k) => w.nodes[k].audience === "private");

  const q1 = pub.every((id) => R.has(id));            // tutto il pubblico e' raggiunto
  const q3 = priv.every((id) => !R.has(id));          // nessun privato e' stato esposto
  // Q2 conta SOLO i collegamenti fra nodi pubblici: un link verso un privato non e'
  // "costo in eccesso", e' una violazione di Q3. Tenere gli assi ORTOGONALI e' necessario,
  // non elegante: quando si sovrappongono, un difetto ne inquina un altro e l'ablazione
  // non riesce piu' a isolare il contributo di ciascun termine (misurato: la diagnostica
  // che espone un privato falliva anche Q2, e Q3 risultava "senza segnale" pur avendolo).
  const pubLinks = w.links.filter(([a, b]) => w.nodes[a]?.audience === "public" && w.nodes[b]?.audience === "public");
  const minLinks = pub.length - 1;                     // catena minima dall'ingresso
  const q2 = pubLinks.length <= minLinks;              // niente collegamenti pubblici in eccesso
  return { q1, q2, q3, links: pubLinks.length, minLinks, pass: q1 && q2 && q3 };
}

// --- POLICY -----------------------------------------------------------------
const POLICIES = {
  "GOLD (collega il pubblico, lascia il privato)": (a) => {
    const pub = a.list().filter((id) => a.audience(id) === "public" && id !== a.entry());
    let prev = a.entry();
    for (const id of pub) { a.link(prev, id); prev = id; }   // catena minima
  },
  "collega tutto a tutto": (a) => {
    for (const x of a.list()) for (const y of a.list()) if (x !== y) a.link(x, y);
  },
  "collega tutto dall'ingresso": (a) => {
    for (const id of a.list()) if (id !== a.entry()) a.link(a.entry(), id);
  },
  "non collegare niente": () => {},
  "collega solo il primo": (a) => {
    const first = a.list().find((id) => id !== a.entry());
    if (first) a.link(a.entry(), first);
  },
  // --- DIAGNOSTICHE: isolano UN termine alla volta -------------------------
  // Servono all'ablazione. Una policy che fallisce DUE termini insieme non prova
  // nulla: togliendone uno, l'altro la boccia comunque e l'ablazione legge "nessun
  // segnale" mentre il segnale c'e' ed e' solo mascherato dalla ridondanza.
  "[diag] pubblico ok, ma con link ridondanti": (a) => {   // fallisce SOLO Q2
    const pub = a.list().filter((id) => a.audience(id) === "public" && id !== a.entry());
    for (const id of pub) a.link(a.entry(), id);           // a stella invece che a catena
    for (const id of pub) a.link(id, a.entry());           // + ritorni inutili
  },
  "[diag] catena minima, ma espone un privato": (a) => {   // fallisce SOLO Q3
    const pub = a.list().filter((id) => a.audience(id) === "public" && id !== a.entry());
    let prev = a.entry();
    for (const id of pub) { a.link(prev, id); prev = id; }
    const p = a.list().find((id) => a.audience(id) === "private");
    if (p) a.link(a.entry(), p);
  },
};

// --- ESECUZIONE -------------------------------------------------------------
const verbose = process.argv.includes("--verbose");
const res = {};
for (const [n, p] of Object.entries(POLICIES)) res[n] = FIXTURES.map((fx) => ({ fx: fx.id, ...run(fx, p) }));

console.log("\n=== GATE (Q1 raggiungibilita' + Q2 costo + Q3 il privato resta privato) ===");
for (const [n, rs] of Object.entries(res)) {
  const ok = rs.filter((r) => r.pass).length;
  const d = verbose ? "\n      " + rs.map((r) => `${r.fx}:${r.pass ? "ok" : "FAIL(" +
    [r.q1 ? "" : "q1", r.q2 ? "" : "q2", r.q3 ? "" : "q3"].filter(Boolean).join(",") + ")"}` +
    `[${r.links}/${r.minLinks}]`).join("  ") : "";
  console.log(`  ${ok}/${FIXTURES.length}  ${n}${d}`);
}

// --- ABLAZIONI --------------------------------------------------------------
const without = (drop) => Object.fromEntries(Object.entries(POLICIES).map(([n, p]) =>
  [n, FIXTURES.filter((fx) => { const r = run(fx, p); return ["q1", "q2", "q3"].filter(k => k !== drop).every(k => r[k]); }).length]));
const noQ2 = without("q2"), noQ3 = without("q3");
const gold = res[Object.keys(POLICIES)[0]].filter((r) => r.pass).length;

console.log("\n=== ABLAZIONI (i due termini che rendono il gate non-banale) ===");
const D2 = "[diag] pubblico ok, ma con link ridondanti", D3 = "[diag] catena minima, ma espone un privato";
console.log(`  L'ablazione usa policy che isolano UN termine (una che ne fallisce due non prova nulla):`);
console.log(`  senza Q2 (costo):    ${D2} -> ${noQ2[D2]}/${FIXTURES.length}   (col gate completo: ${res[D2].filter(r=>r.pass).length}/${FIXTURES.length})`);
console.log(`  senza Q3 (privato):  ${D3} -> ${noQ3[D3]}/${FIXTURES.length}   (col gate completo: ${res[D3].filter(r=>r.pass).length}/${FIXTURES.length})`);

const survivors = Object.entries(res).filter(([n, rs]) => n !== Object.keys(POLICIES)[0] && !n.startsWith("[diag]") && rs.filter(r => r.pass).length >= gold);
const q2Proves = noQ2[D2] > res[D2].filter(r=>r.pass).length;
const q3Proves = noQ3[D3] > res[D3].filter(r=>r.pass).length;

console.log("\n=== VERDETTO ===");
console.log(`  gold: ${gold}/${FIXTURES.length}  ·  policy a intelligenza zero che reggono: ${survivors.length}${survivors.length ? " -> " + survivors.map(([n])=>n).join(" | ") : ""}`);
console.log(`  Q2 porta segnale: ${q2Proves ? "SI" : "NO"} · Q3 porta segnale: ${q3Proves ? "SI" : "NO"}`);
const ok = gold === FIXTURES.length && survivors.length === 0 && q2Proves && q3Proves;
console.log(ok ? "\n✅ IL GATE REGGE — eseguito, non ragionato." : "\n❌ IL GATE E' ROTTO.");

// --- BONUS: lo stesso traversal sulla WIKI REALE ---------------------------
if (process.argv.includes("--repo")) {
  const ROOT = resolve(dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..", "..");
  const WIKI = join(ROOT, "wiki");
  const files = [];
  (function walk(d) {
    for (const f of readdirSync(d, { withFileTypes: true })) {
      if (f.isDirectory()) { if (!["_private", "node_modules", ".git"].includes(f.name)) walk(join(d, f.name)); }
      else if (extname(f.name) === ".md") files.push(join(d, f.name));
    }
  })(WIKI);
  const slug = (p) => p.slice(WIKI.length + 1).replace(/\\/g, "/").replace(/\.md$/, "");
  const w = { nodes: Object.fromEntries(files.map(f => [slug(f), { audience: "public" }])), links: [], entry: "index" };
  for (const f of files) {
    const s = readFileSync(f, "utf8"), from = slug(f);
    for (const m of s.matchAll(/\[\[([^\]|#]+)/g)) {
      const t = m[1].trim().replace(/\.md$/, "");
      const cand = [t, `training-taxonomy/${t}`, `concepts/${t}`, `entities/${t}`, `decisions/${t}`, `_core-mirror/${t}`];
      const hit = cand.find(c => w.nodes[c]);
      if (hit) w.links.push([from, hit]);
    }
    for (const m of s.matchAll(/\]\(([^)]+\.md)\)/g)) {
      const t = m[1].replace(/^\.\//, "").replace(/\.md$/, "");
      const cand = [t, `${dirname(from)}/${t}`.replace(/^\.\//, "")];
      const hit = cand.find(c => w.nodes[c]);
      if (hit) w.links.push([from, hit]);
    }
  }
  const R = reachable(w);
  const orphans = Object.keys(w.nodes).filter(id => !R.has(id));
  console.log(`\n=== WIKI REALE — traversal da index.md ===`);
  console.log(`  ${files.length} pagine · raggiungibili ${R.size} · NON raggiungibili ${orphans.length}`);
  for (const o of orphans.slice(0, 25)) console.log(`   [X] ${o}`);
  if (orphans.length > 25) console.log(`   … e altre ${orphans.length - 25}`);
}
process.exit(ok ? 0 : 1);
