/**
 * F38 — i VALORI nelle lane <vars>/<recent_changes> sono RIASSUNTI, non dumpati (bloat 3.11× misurato).
 *
 * Regression AL LIVELLO DOVE VIVE IL BUG (#17): il difetto NON era in una funzione pura, era nella RESA della lane
 * (context-assembler) + nella scelta di namespace (vars-queue). Un unit su `summarizeValue` da solo sarebbe stato
 * falsa sicurezza (#14) → qui si asserisce sul <context> REALE assemblato e sulla RISOLUZIONE dell'handle.
 *
 * Contratto (guida utente msg 1701): un valore troncato deve SEMPRE lasciare al modello **esito + timestamp + ID**,
 * e l'ID deve **funzionare** (recuperare quella singola entry). Un handle che non risolve è peggio del dump.
 */
import { VarsQueue } from "../../src/vars-queue.mjs";
import { assembleContext, summarizeValue } from "../../src/context-assembler.mjs";

let pass = 0, fail = 0;
const ok = (c, m) => { c ? pass++ : (fail++, console.error("  ✗ " + m)); };
const BIG = (n) => "Z".repeat(n);

// ── 1) summarizeValue: sotto cap = verbatim (nessun costo, nessuna perdita); sopra = forma + peso + testa ──
{
  const small = summarizeValue('{"a":1}');
  ok(small.truncated === false && small.text === '{"a":1}', "sotto cap → VERBATIM (il caso comune non paga nulla)");

  const obj = JSON.stringify({ path: "x.py", start: 1, end: 9, content: BIG(400) });
  const s = summarizeValue(obj);
  ok(s.truncated === true, "sopra cap → troncato");
  ok(/^\{path,start,end,content\}/.test(s.text), "riassunto: dichiara la FORMA (quali chiavi) senza stampare il valore");
  ok(new RegExp(`${obj.length}B`).test(s.text), "riassunto: dichiara il PESO reale del valore intero");
  ok(s.text.endsWith("…"), "riassunto: il troncamento è marcato, mai muto");
  ok(s.text.length < obj.length / 2, "riassunto: costa MENO del dump (è il punto di F38)");

  ok(/^array\[300\]/.test(summarizeValue(JSON.stringify(Array(300).fill(7))).text), "riassunto: array → array[N]");
  ok(/^text \d+B/.test(summarizeValue(BIG(500)).text), "riassunto: non-JSON → 'text NB' (nessun crash sul parse)");
  ok(summarizeValue(null).text === "null" && summarizeValue(null).truncated === false, "guard: null → 'null', non crash");
  // la FORMA stessa non deve poter esplodere (un oggetto con 500 chiavi)
  const many = Object.fromEntries(Array.from({ length: 500 }, (_, i) => [`chiave_lunghissima_${i}`, i]));
  const sm = summarizeValue(JSON.stringify(many));
  ok(sm.text.indexOf(":") < 140, "riassunto: anche la FORMA è cappata (500 chiavi non diventano la nuova bomba)");
}

// ── 2) ⭐ <recent_changes>: riassunto + ESITO + ID, e l'ID RISOLVE davvero ────────────────────────────────
{
  const vq = new VarsQueue(":memory:", { agent: "orchestrator" });
  const full = { note: BIG(600), kind: "blob" };
  vq.setVar("payload", full, { namespace: "main", scope: "shared" });

  const ctx = assembleContext(vq, { now: Date.now() });
  ok(!ctx.includes(BIG(300)), "recent_changes: il valore NON è dumpato intero");
  ok(/#\d+ /.test(ctx), "recent_changes: ogni riga porta l'ID (#seq) = handle per recuperarla");
  ok(/\{note,kind\}/.test(ctx), "recent_changes: mostra l'esito/forma del valore");
  ok(/get_changelog\{seq:N\}/.test(ctx), "recent_changes: dice COME riavere il valore pieno");
  ok(/s ago,/.test(ctx), "recent_changes: il timestamp resta sempre (esito+timestamp+ID, msg 1701)");

  // ⭐ L'HANDLE DEVE RISOLVERE: è la promessa che rende accettabile il troncamento.
  const seq = Number(ctx.match(/- #(\d+) /)[1]);
  const one = vq.getChangeLog({ seq });
  ok(one.length === 1 && one[0].seq === seq, "handle: get_changelog{seq} ritorna ESATTAMENTE quella entry");
  ok(JSON.parse(one[0].new_value).note === full.note, "handle: e ne ritorna il valore PIENO (niente è andato perso)");
  vq.close?.();
}

// ── 3) la RIMOZIONE non deve ri-stampare il valore rimosso (era F38 al quadrato: chiudere COSTAVA) ────────
{
  const vq = new VarsQueue(":memory:", { agent: "orchestrator" });
  vq.setVar("tmp", { blob: BIG(600) }, { namespace: "main", scope: "shared" });
  vq.removeVar("tmp");
  const ctx = assembleContext(vq, { now: Date.now() });
  ok(/\.value cleared/.test(ctx), "remove: esito = 'cleared' (il modello sa cosa è successo)");
  ok(!ctx.includes(BIG(200)), "remove: il valore rimosso NON viene ri-stampato — liberare DEVE liberare");
  const cleared = ctx.split("\n").find((l) => /cleared/.test(l));
  ok(cleared.length < 140, "remove: la riga di rimozione è compatta (era ~2× il valore)");
  vq.close?.();
}

// ── 4) <vars>: stesso trattamento, handle = l'id della var ────────────────────────────────────────────────
{
  const vq = new VarsQueue(":memory:", { agent: "orchestrator" });
  vq.setVar("cfg", { big: BIG(600) }, { namespace: "main", scope: "shared" });
  const ctx = assembleContext(vq, { now: Date.now() });
  const varsLane = ctx.split("<vars>")[1].split("</vars>")[0];
  ok(!varsLane.includes(BIG(300)), "vars: valore lungo → riassunto, non dumpato");
  ok(/cfg=/.test(varsLane), "vars: l'id resta (è l'handle: get_var(id))");
  ok(/get_var\(id\)/.test(varsLane), "vars: dice COME riavere il valore pieno");
  vq.close?.();
}

// ── 5) NEGATIVO: sotto cap nulla cambia (il fix non deve peggiorare il caso normale) ──────────────────────
{
  const vq = new VarsQueue(":memory:", { agent: "orchestrator" });
  vq.setVar("port", 8080, { namespace: "main", scope: "shared" });
  const ctx = assembleContext(vq, { now: Date.now() });
  ok(/port=8080/.test(ctx), "sotto cap: la var si legge esattamente come prima");
  ok(!/SUMMARIZED/.test(ctx), "sotto cap: nessun hint di troncamento (niente rumore quando non serve)");
  vq.close?.();
}

// ── 6) namespace con lane propria → SILENT (niente duplicazione lane↔recent_changes) ──────────────────────
{
  const vq = new VarsQueue(":memory:", { agent: "orchestrator" });
  vq.setVar("fileview:a.py", { path: "a.py", start: 1, end: 2, content: "RIGA_UNICA", truncated: false, totalLines: 9, ts: 1 },
    { namespace: "fileview", scope: "private" });
  const ctx = assembleContext(vq, { now: Date.now() });
  ok((ctx.match(/RIGA_UNICA/g) || []).length === 1, "silent: il contenuto compare UNA volta sola (nella lane, non anche nel changelog)");
  ok(vq.getChangeLog({ includeSilent: true }).length === 1, "silent: resta comunque nel log per l'AUDIT (non è cancellato, è non-mostrato)");
  vq.close?.();
}

console.log(`\nvalue-cap-f38: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
