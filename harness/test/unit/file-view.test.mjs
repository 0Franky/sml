/**
 * file-view — test della lane <open_file_view> (design utente msg 376, costruita 2026-07-16 dopo msg 1708).
 *
 * Il test CENTRALE è §2: la porzione **sopravvive al prune**, che è LA proprietà che distingue questa lane da una
 * read normale (`sliding_var_read` ritorna un tool_result → scorre via). Se questo test cade, la feature non ha senso.
 */
import { VarsQueue } from "../../src/vars-queue.mjs";
import {
  openFileView, closeFileView, closeAllFileViews, listFileViews, fileViewLaneLines,
  MAX_OPEN_VIEWS, MAX_VIEW_LINES, MAX_VIEW_CHARS, DEFAULT_VIEW_LINES,
} from "../../src/file-view.mjs";
import { assembleContext } from "../../src/context-assembler.mjs";

let pass = 0, fail = 0;
const ok = (c, m) => { c ? pass++ : (fail++, console.error("  ✗ " + m)); };
const mkLines = (n, tag = "L") => Array.from({ length: n }, (_, i) => `${tag}${i + 1}: contenuto della riga ${i + 1}`);

// ── 1) apertura base: finestra, numeri di riga reali, residuo dichiarato ──────────────────────
{
  const vq = new VarsQueue(":memory:", { agent: "orchestrator" });
  const r = openFileView(vq, { path: "src/app.py", fileLines: mkLines(500), startLine: 100, lines: 10, now: 1000 });
  ok(r.ok === true, "open: riuscito");
  ok(r.start === 100 && r.end === 109 && r.shown === 10, "open: finestra esatta 100-109");
  ok(r.totalLines === 500 && r.truncated === true, "open: dichiara il totale e che è troncata");

  const lane = fileViewLaneLines(vq).join("\n");
  ok(/lines="100-109\/500"/.test(lane), "lane: dichiara range/totale (il modello sa che vede una FINESTRA)");
  ok(/490 more line\(s\) NOT shown/.test(lane), "lane: dichiara il residuo → anti-confabulazione sul resto del file");
  ok(/^\s*100\t/m.test(lane), "lane: numeri di riga REALI (100), non 1-based della slice");
  ok(/close_file_view/.test(lane), "lane: dice al modello come liberarla");
  vq.close?.();
}

// ── 2) ⭐ IL TEST CHE CONTA: la view SOPRAVVIVE al prune (è una LANE, non un tool_result) ──────
{
  const vq = new VarsQueue(":memory:", { agent: "orchestrator" });
  openFileView(vq, { path: "src/core.py", fileLines: mkLines(80, "CORE"), startLine: 10, lines: 5, now: 1000 });

  // Il prune agisce sui TURNI/tool_result. La lane è ri-generata dall'assembler ad OGNI turno dallo stato durevole:
  // simuliamo 3 turni successivi (3 assemblaggi indipendenti, come farebbe l'harness) → deve esserci sempre.
  for (const turn of [1, 2, 3]) {
    const ctx = assembleContext(vq, { now: 1000 + turn * 60_000 });
    ok(/CORE10:/.test(ctx), `prune-survival: la porzione è ancora nel context al turno ${turn}`);
  }
  // …e sparisce SOLO quando il modello lo decide.
  const c = closeFileView(vq, "src/core.py");
  ok(c.ok === true, "close: riuscito");
  const after = assembleContext(vq, { now: 1000 + 240_000 });
  ok(!/CORE10:/.test(after) && !/<open_file_view/.test(after), "close: rimossa TOTALMENTE dal context (eviction esplicita)");
  vq.close?.();
}

// ── 3) ANTI-PROLIFERAZIONE (vincolo utente I23): la 4ª apertura è RIFIUTATA, non sfrattata in silenzio ──
{
  const vq = new VarsQueue(":memory:", { agent: "orchestrator" });
  for (let i = 1; i <= MAX_OPEN_VIEWS; i++) {
    const r = openFileView(vq, { path: `f${i}.py`, fileLines: mkLines(20), now: 1000 + i });
    ok(r.ok === true, `anti-prolif: apertura ${i}/${MAX_OPEN_VIEWS} ok`);
  }
  const over = openFileView(vq, { path: "f4.py", fileLines: mkLines(20), now: 2000 });
  ok(over.ok === false && over.reason === "too-many-open", "anti-prolif: la 4ª è RIFIUTATA (non sfratta in silenzio)");
  ok(Array.isArray(over.open) && over.open.length === MAX_OPEN_VIEWS, "anti-prolif: il rifiuto ELENCA cosa è aperto → il modello può decidere");
  ok(/close_file_view/.test(over.message), "anti-prolif: il rifiuto dice COSA fare (decidi cosa non ti serve più)");
  ok(listFileViews(vq).length === MAX_OPEN_VIEWS, "anti-prolif: nessuna view persa per lo sfratto (le 3 sono intatte)");

  // ri-aprire una GIÀ aperta è un aggiornamento → sempre lecito anche a cap pieno
  const again = openFileView(vq, { path: "f2.py", fileLines: mkLines(20), startLine: 5, lines: 3, now: 3000 });
  ok(again.ok === true && again.start === 5, "ri-apertura dello stesso path a cap pieno = MUOVE la finestra (non è una nuova view)");
  ok(listFileViews(vq).length === MAX_OPEN_VIEWS, "ri-apertura: nessun doppione (key stabile per-path)");
  vq.close?.();
}

// ── 4) i CAP: righe e char sono difese INDIPENDENTI (lezione F38: il cap sul numero non limita la dimensione) ──
{
  const vq = new VarsQueue(":memory:", { agent: "orchestrator" });
  const r = openFileView(vq, { path: "big.py", fileLines: mkLines(5000), startLine: 1, lines: 99999, now: 1000 });
  ok(r.ok === true && (r.end - r.start + 1) === MAX_VIEW_LINES, `cap-righe: richiesta 99999 → clampata a ${MAX_VIEW_LINES}`);

  // poche righe MA lunghissime → il cap-righe non basta, deve scattare quello sui char (è il bug F38 in miniatura)
  const vq2 = new VarsQueue(":memory:", { agent: "orchestrator" });
  const fat = [Array(50_000).fill("x").join("")]; // UNA riga da 50K char
  const r2 = openFileView(vq2, { path: "fat.txt", fileLines: fat, lines: 1, now: 1000 });
  ok(r2.ok === true && r2.truncated === true, "cap-char: una riga da 50K → troncata");
  const v2 = listFileViews(vq2)[0];
  ok(v2.content.length <= MAX_VIEW_CHARS, `cap-char: contenuto ≤ ${MAX_VIEW_CHARS} (il cap-righe da solo NON avrebbe protetto)`);
  const lane2 = fileViewLaneLines(vq2).join("\n");
  ok(/view truncated at/.test(lane2), "cap-char: il troncamento è DICHIARATO, non silenzioso");
  vq.close?.(); vq2.close?.();
}

// ── 5) range fuori-bordo e default ────────────────────────────────────────────────────────────
{
  const vq = new VarsQueue(":memory:", { agent: "orchestrator" });
  const r = openFileView(vq, { path: "s.py", fileLines: mkLines(10), startLine: 8, lines: 100, now: 1000 });
  ok(r.ok === true && r.end === 10, "range: end clampato alla fine del file (8-10, non 8-107)");
  const r2 = openFileView(vq, { path: "t.py", fileLines: mkLines(500), now: 1000 });
  ok(r2.start === 1 && r2.shown === DEFAULT_VIEW_LINES, `default: senza parametri → 1-${DEFAULT_VIEW_LINES}`);
  const r3 = openFileView(vq, { path: "u.py", fileLines: mkLines(10), startLine: 999, lines: 5, now: 1000 });
  ok(r3.ok === true && r3.start === 10, "range: start oltre EOF → clampato all'ultima riga (no view vuota)");
  const bad = openFileView(vq, { path: "", fileLines: mkLines(3) });
  ok(bad.ok === false && bad.reason === "empty", "guard: path vuoto → rifiutato");
  const empty = openFileView(vq, { path: "e.py", fileLines: [] });
  ok(empty.ok === false && empty.reason === "empty", "guard: file vuoto → rifiutato (niente view fantasma)");
  vq.close?.();
}

// ── 6) escaping: il contenuto di un file può contenere XML → non deve rompere la lane ─────────
{
  const vq = new VarsQueue(":memory:", { agent: "orchestrator" });
  openFileView(vq, { path: "x.html", fileLines: ["<div class=\"a\">&amp; </task_list>"], lines: 1, now: 1000 });
  const ctx = assembleContext(vq, { now: 2000 });
  ok(!/<\/task_list>/.test(ctx.split("<open_file_view")[1] ?? ""), "escaping: un </task_list> dentro un file NON rompe le lane (injection via contenuto)");
  ok(/&lt;div/.test(ctx), "escaping: il markup del file è escapato");
  vq.close?.();
}

// ── 7) no view → lane assente (niente rumore) + closeAll ──────────────────────────────────────
{
  const vq = new VarsQueue(":memory:", { agent: "orchestrator" });
  ok(fileViewLaneLines(vq).length === 0, "nessuna view → lane assente (non un blocco vuoto)");
  ok(!/<open_file_view/.test(assembleContext(vq, { now: 1000 })), "nessuna view → nessun tag nel context");
  openFileView(vq, { path: "a.py", fileLines: mkLines(5), now: 1 });
  openFileView(vq, { path: "b.py", fileLines: mkLines(5), now: 2 });
  ok(closeAllFileViews(vq) === 2, "closeAll: chiude tutte");
  ok(listFileViews(vq).length === 0, "closeAll: nessuna residua");
  ok(closeFileView(vq, "mai-aperta.py").ok === false, "close di una view inesistente → ok:false, non crash");
  vq.close?.();
}

// §7 — CAP CONFIGURABILE (utente 2026-07-16 "rendilo configurabile dal file di configurazione").
// Il valore vive in cfg.maxOpenFileViews; qui si prova che il cap EFFETTIVO è quello passato, non la costante —
// e soprattutto che i DUE punti che lo mostrano al modello (il rifiuto del tool + il `count="N/M"` della lane)
// dicono lo STESSO numero. Se divergessero, la lane dichiarerebbe un budget e il tool ne applicherebbe un altro.
{
  const vq = new VarsQueue(":memory:");
  const mk = (n, p) => Array.from({ length: n }, (_, i) => `${p}${i + 1}`);

  // cap=1: la SECONDA apertura deve essere rifiutata (col default 3 passerebbe → il test fallirebbe senza il fix)
  ok(openFileView(vq, { path: "x1.py", fileLines: mk(5, "X"), now: 1, maxOpen: 1 }).ok === true, "cap=1: la 1ª apre");
  const r2 = openFileView(vq, { path: "x2.py", fileLines: mk(5, "X"), now: 2, maxOpen: 1 });
  ok(r2.ok === false && r2.reason === "too-many-open", "cap=1: la 2ª è RIFIUTATA (il cap passato vince sul default 3)");
  ok(/\b1 views already open\b/.test(r2.message), "cap=1: il messaggio di rifiuto porta il cap EFFETTIVO, non il default");

  // cap=5: la 4ª apertura (che col default sarebbe rifiutata) deve passare → il cap è alzabile davvero
  const vq5 = new VarsQueue(":memory:");
  for (let i = 1; i <= 4; i++) {
    const r = openFileView(vq5, { path: `y${i}.py`, fileLines: mk(5, "Y"), now: i, maxOpen: 5 });
    ok(r.ok === true, `cap=5: apertura ${i}/5 ok (col default 3 la 4ª sarebbe stata rifiutata)`);
  }
  ok(listFileViews(vq5).length === 4, "cap=5: 4 view aperte insieme");

  // la LANE deve dichiarare lo stesso M del cap effettivo
  const lane5 = fileViewLaneLines(vq5, { maxOpen: 5 }).join("\n");
  ok(/count="4\/5"/.test(lane5), `lane: count riflette il cap configurato — ho «${lane5.split("\n")[0]}»`);
  const laneDefault = fileViewLaneLines(vq5).join("\n");
  ok(/count="4\/3"/.test(laneDefault), "lane: senza maxOpen usa il DEFAULT importato (SSOT), non un literal");

  // il cap NON deve sfrattare: le view restano tutte (il rifiuto è il segnale, lo sfratto silenzioso no)
  ok(listFileViews(vq).length === 1, "cap: il rifiuto non tocca le view già aperte (nessuno sfratto)");
  vq.close?.(); vq5.close?.();
}

// §8 — WIRING della config → assembleContext (il bug vivrebbe QUI, non nella funzione pura — #14).
{
  const vq = new VarsQueue(":memory:");
  const mk = (n) => Array.from({ length: n }, (_, i) => `L${i + 1}`);
  openFileView(vq, { path: "w.py", fileLines: mk(5), now: 1 });
  const ctx = assembleContext(vq, { now: 1000, maxOpenFileViews: 7 });
  ok(/count="1\/7"/.test(ctx), "assembleContext: propaga maxOpenFileViews alla lane");
  const ctxDefault = assembleContext(vq, { now: 1000 });
  ok(/count="1\/3"/.test(ctxDefault), "assembleContext: senza opt → default SSOT (3)");
  vq.close?.();
}

// §9 — la CONFIG espone il campo e lo clampa (SSOT #16: la difesa vive in loadHarnessConfig, non nei consumatori)
{
  const { DEFAULT_HARNESS_CONFIG, loadHarnessConfig } = await import("../../src/harness-config.mjs");
  ok(DEFAULT_HARNESS_CONFIG.maxOpenFileViews === MAX_OPEN_VIEWS, "config: il default è la stessa SSOT di file-view (nessuna copia divergente)");
  const viaEnv = loadHarnessConfig("/percorso/inesistente.json", { env: { HARNESS_MAX_OPEN_FILE_VIEWS: "6" } });
  ok(viaEnv.maxOpenFileViews === 6, "config: HARNESS_MAX_OPEN_FILE_VIEWS override");
  for (const bad of ["0", "-3", "abc", ""]) {
    const c = loadHarnessConfig("/percorso/inesistente.json", { env: { HARNESS_MAX_OPEN_FILE_VIEWS: bad } });
    ok(c.maxOpenFileViews === MAX_OPEN_VIEWS, `config: env non valido «${bad}» → default, mai un cap rotto`);
  }
}

console.log(`\nfile-view: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
