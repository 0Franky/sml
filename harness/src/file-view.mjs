/**
 * file-view.mjs — lane `<open_file_view>`: porzioni di FILE tenute INLINE nel contesto finché il modello le chiude.
 *
 * Design ORIGINALE dell'utente (msg 376), specificato in ../../wiki/concepts/wrapper-context-assembly-example.md:154
 * (`open/stream_read_file` → `close_stream_file`: *"lo stream-read porta porzioni di file inline nel contesto;
 * close_stream_file lo cancella TOTALMENTE dal contesto. È context-eviction ESPLICITA guidata dall'LLM"*), rimasto
 * backlog "Classe A" e MAI costruito (utente msg 1708). Questo modulo lo costruisce.
 *
 * ⚠️ DISTINTO da `sliding-var.mjs` (che l'utente ricordava come "temp_read" ma è un'ALTRA cosa, e la wiki lo chiama
 * infatti *"complemento"*): `slidingRead` legge una slice di una **VAR** e ritorna un **tool_result** → **scorre via
 * col prune**, non persiste. Qui invece è una **LANE**: ri-emessa a ogni turno dall'assembler → **sopravvive al prune
 * per costruzione**, finché il modello non chiude. È la differenza tra "read ridotta" e "tenere sott'occhio".
 *
 * SPLIT #11 (training-vs-harness): il MECCANISMO (apri/tieni/chiudi) è **F-harness**, è qui. La DECISIONE — *quando*
 * una porzione merita di restare, quando NON serve più, quando conviene preservarla comunque (utente msg 1701) — è
 * **S da addestrare**: [[../wiki/training-taxonomy/class-memory-lane-tool-discipline]] (asse PERMANENZA ↔ durata-del-bisogno).
 * ANTI-PROLIFERAZIONE (vincolo utente I23, *"se ne crea 100 e tutti sparsi ne perde il controllo"*): `MAX_OPEN_VIEWS`
 * **RIFIUTA** la 4ª apertura invece di sfrattare in silenzio → il modello DEVE scegliere cosa chiudere = atto deliberato
 * (è il segnale di training, non burocrazia: uno sfratto silenzioso insegnerebbe che le risorse si gestiscono da sole).
 *
 * PURO/testabile: prende `vq` (duck-typed) + tempo/contenuto INIETTATI → deterministico, nessun I/O qui (il read del
 * file vive nell'estensione TS).
 */
import { DEFAULT_MAX_OPEN_FILE_VIEWS } from "./lane-defaults.mjs"; // SSOT del default (leaf, zero import → nessun ciclo)

/** Namespace SQLite delle view aperte. **Silent** nel change-log (`SILENT_NAMESPACES` in vars-queue.mjs): l'evento
 *  aprire/chiudere È già visibile — meglio — nella lane stessa (compare/sparisce, con i numeri di riga), ed è un'azione
 *  del modello stesso (ha il tool_result). Lasciarlo NON-silent duplicava la porzione nel <context> e faceva ri-stampare
 *  al `close` il valore rimosso → l'eviction non liberava niente (misurato 2026-07-16). Resta nel log per l'audit. */
export const FILEVIEW_NS = "fileview";
/** Righe lette di default se il modello non specifica (l'utente: *"il modello può scegliere quante righe, di default X"*). */
export const DEFAULT_VIEW_LINES = 40;
/** Cap DURO sulle righe per singola view (anti-blowup: una view non deve poter mangiare la finestra). */
export const MAX_VIEW_LINES = 200;
/** Cap DURO sui char per singola view (difesa indipendente dalle righe: una riga può essere lunghissima — lezione F38). */
export const MAX_VIEW_CHARS = 8000;
/**
 * Quante view possono restare aperte insieme — **default**, ora CONFIGURABILE (utente 2026-07-16).
 * SSOT del valore: `lane-defaults.mjs` (modulo leaf, stesso posto di DEFAULT_MESSAGES_WINDOW_N) → composto in
 * `DEFAULT_HARNESS_CONFIG.maxOpenFileViews`, override da `.pi/harness.config.json` o `HARNESS_MAX_OPEN_FILE_VIEWS`.
 * Qui è SOLO il default-param delle pure-fn: i consumatori passano `maxOpen` da `cfg.maxOpenFileViews` (#16 — niente
 * fallback-literal, un `?? 3` qui potrebbe contraddire il default vero e sarebbe il bug `?? 1`/nativeKeepTurns da capo).
 * Superato → RIFIUTO esplicito, mai sfratto silenzioso (vedi header, vincolo anti-proliferazione I23).
 */
export const MAX_OPEN_VIEWS = DEFAULT_MAX_OPEN_FILE_VIEWS;

const clampInt = (v, lo, hi, dflt) => {
  const n = Math.trunc(Number(v));
  return Number.isFinite(n) ? Math.min(Math.max(n, lo), hi) : dflt;
};

/**
 * listFileViews — le view aperte, dalla più RECENTE alla più vecchia (ts desc, tiebreak path).
 * @param {import("./vars-queue.mjs").VarsQueue} vq
 * @returns {{path:string, start:number, end:number, content:string, truncated:boolean, totalLines:number, ts:number}[]}
 */
export function listFileViews(vq) {
  return vq.listVars({ namespace: FILEVIEW_NS })
    .map((v) => (v.value && typeof v.value === "object" ? v.value : null))
    .filter((x) => x && x.path)
    .map((x) => ({
      path: String(x.path),
      start: Number(x.start) || 1,
      end: Number(x.end) || 1,
      content: String(x.content ?? ""),
      truncated: !!x.truncated,
      totalLines: Number(x.totalLines) || 0,
      ts: Number(x.ts) || 0,
    }))
    .sort((a, b) => (b.ts - a.ts) || a.path.localeCompare(b.path));
}

/** Chiave stabile per-path → ri-aprire lo STESSO file AGGIORNA la view invece di duplicarla (niente doppioni). */
export function viewKey(path) { return `${FILEVIEW_NS}:${String(path)}`; }

/**
 * openFileView — apre (o aggiorna) una view su una porzione di file. PURO: il contenuto arriva GIÀ letto dal chiamante.
 *
 * @param {import("./vars-queue.mjs").VarsQueue} vq
 * @param {{ path:string, fileLines:string[], startLine?:number, lines?:number, now?:number, maxOpen?:number }} opts
 *        `fileLines` = il file già splittato in righe (l'I/O vive nell'estensione). `startLine` 1-based.
 *        `maxOpen` = cap di view contemporanee; i chiamanti passano `cfg.maxOpenFileViews` (SSOT harness-config).
 *        Default = la SSOT importata, non una copia riscritta (#16).
 * @returns {{ ok:true, path:string, start:number, end:number, shown:number, truncated:boolean, totalLines:number }
 *          | { ok:false, reason:"too-many-open"|"empty"|"bad-range", open:string[], message:string }}
 */
export function openFileView(vq, { path, fileLines, startLine = 1, lines = DEFAULT_VIEW_LINES, now = Date.now(), maxOpen = DEFAULT_MAX_OPEN_FILE_VIEWS } = {}) {
  const p = String(path ?? "").trim();
  if (!p) return { ok: false, reason: "empty", open: [], message: "open_file_view: path is required" };
  if (!Array.isArray(fileLines)) return { ok: false, reason: "empty", open: [], message: "open_file_view: file content unavailable" };

  const totalLines = fileLines.length;
  if (totalLines === 0) return { ok: false, reason: "empty", open: [], message: `open_file_view: ${p} is empty` };

  // ANTI-PROLIFERAZIONE: il cap vale solo per una view NUOVA (ri-aprire una già aperta è un aggiornamento, sempre lecito).
  const already = listFileViews(vq);
  const isNew = !already.some((v) => v.path === p);
  if (isNew && already.length >= maxOpen) {
    const open = already.map((v) => v.path);
    return {
      ok: false, reason: "too-many-open", open,
      // Il messaggio NON è un errore burocratico: è il punto in cui il modello deve DECIDERE. Gli diamo i dati per farlo.
      message: `open_file_view: ${maxOpen} views already open (${open.join(", ")}). ` +
        `These stay in your context every turn until you close them. Decide which one you no longer need and ` +
        `close_file_view(path) it first — then re-open this one.`,
    };
  }

  const start = clampInt(startLine, 1, totalLines, 1);
  const want = clampInt(lines, 1, MAX_VIEW_LINES, DEFAULT_VIEW_LINES);
  const end = Math.min(start + want - 1, totalLines);
  if (end < start) return { ok: false, reason: "bad-range", open: [], message: `open_file_view: invalid range ${start}-${end}` };

  let slice = fileLines.slice(start - 1, end);
  let content = slice.join("\n");
  let truncated = end < totalLines || start > 1;
  // Difesa char INDIPENDENTE dal conteggio-righe (lezione F38: il cap sul NUMERO non limita la DIMENSIONE).
  if (content.length > MAX_VIEW_CHARS) {
    content = content.slice(0, MAX_VIEW_CHARS);
    truncated = true;
  }

  vq.setVar(viewKey(p), { path: p, start, end, content, truncated, totalLines, ts: now },
    { namespace: FILEVIEW_NS, scope: "private", who: vq.agent });
  return { ok: true, path: p, start, end, shown: end - start + 1, truncated, totalLines };
}

/**
 * closeFileView — rimuove TOTALMENTE la view dal contesto (context-eviction esplicita guidata dall'LLM).
 * @returns {{ ok:boolean, path:string, message:string }}
 */
export function closeFileView(vq, path) {
  const p = String(path ?? "").trim();
  if (!p) return { ok: false, path: p, message: "close_file_view: path is required" };
  const exists = listFileViews(vq).some((v) => v.path === p);
  if (!exists) return { ok: false, path: p, message: `close_file_view: no open view for ${p}` };
  vq.removeVar(viewKey(p));
  return { ok: true, path: p, message: `closed ${p} — it is no longer in your context` };
}

/** closeAllFileViews — libera tutto. @returns {number} quante ne ha chiuse. */
export function closeAllFileViews(vq) {
  const all = listFileViews(vq);
  for (const v of all) vq.removeVar(viewKey(v.path));
  return all.length;
}

/**
 * fileViewLaneLines — righe della lane `<open_file_view>`. Resa INLINE (è il punto: la porzione è SOTT'OCCHIO),
 * con numeri di riga REALI (il modello può citare/editare per riga esatta) e il residuo dichiarato (anti-illusione:
 * deve sapere che sta vedendo una FINESTRA, non il file — altrimenti confabula sul resto).
 * Zona STABILE del prefisso: cambia SOLO su open/close (evento semantico) → byte-identica tra i turni = cache-friendly.
 * @param {import("./vars-queue.mjs").VarsQueue} vq
 * @param {{ esc?: (s:string)=>string }} [opts] `esc` iniettato dall'assembler (SSOT dell'escaping XML)
 * @returns {string[]}
 */
export function fileViewLaneLines(vq, { esc = (s) => String(s), maxOpen = DEFAULT_MAX_OPEN_FILE_VIEWS } = {}) {
  const views = listFileViews(vq);
  if (!views.length) return [];
  const lines = [`  <open_file_view count="${views.length}/${maxOpen}">`];
  for (const v of views) {
    const rest = v.totalLines - (v.end - v.start + 1);
    const restNote = rest > 0 ? ` (${rest} more line(s) NOT shown — re-open at another start_line to move the window)` : "";
    lines.push(`    <file path="${esc(v.path)}" lines="${v.start}-${v.end}/${v.totalLines}">${restNote}`);
    const body = v.content.split("\n");
    for (let i = 0; i < body.length; i++) lines.push(`${String(v.start + i).padStart(6)}\t${esc(body[i])}`);
    if (v.truncated && v.content.length >= MAX_VIEW_CHARS) lines.push(`      …[view truncated at ${MAX_VIEW_CHARS} chars]`);
    lines.push(`    </file>`);
  }
  lines.push(`    (These stay here every turn until you close_file_view(path). Close what you no longer need.)`);
  lines.push(`  </open_file_view>`);
  return lines;
}

export default {
  FILEVIEW_NS, DEFAULT_VIEW_LINES, MAX_VIEW_LINES, MAX_VIEW_CHARS, MAX_OPEN_VIEWS,
  listFileViews, openFileView, closeFileView, closeAllFileViews, fileViewLaneLines, viewKey,
};
