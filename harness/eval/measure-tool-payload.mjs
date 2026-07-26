#!/usr/bin/env node
/**
 * measure-tool-payload — quanto pesa DAVVERO ogni `toolProfile` nel payload della richiesta.
 *
 * PERCHE' ESISTE (F26/F37): il discriminante C4 su Seed-OSS-36B muore sul TPM di SiliconFlow —
 * ~25-27K prompt_tokens per chiamata, dominati dai 32 tool-schema. Il fix candidato e' abbassare
 * `HARNESS_TOOL_PROFILE` da `standard` a `minimal`. Ma "minimal ha ~15 tool invece di 32, quindi
 * costa meta'" e' PROPORZIONALITA', NON UNA MISURA: gli schema hanno dimensioni molto diverse
 * (un `bash` con una descrizione lunga pesa piu' di tre tool banali). Spendere credito per
 * scoprirlo sarebbe ri-bruciare la quota per una domanda che si puo' chiudere gratis.
 *
 * COME MISURA A COSTO ZERO — l'interceptor di `run-session.mjs` scrive `EVAL_DUMP_REQ` con il body
 * della richiesta *PRIMA* di inviarla (`run-session.mjs:129`, prima di `fetchWithRotation`).
 * Quindi con una API-key volutamente INVALIDA il body viene comunque dumpato, la chiamata muore in
 * 401 e NON si spende un token. Zero credito, zero quota.
 *
 * COSA RIPORTA — per ogni profilo: byte totali del body · byte dei soli `tools` · numero di tool ·
 * token STIMATI. La stima NON e' un tokenizer indovinato: e' calibrata sull'unico punto di
 * osservazione reale che abbiamo, cioe' il provider stesso in F37 (`reqBodyLen` 92.9KB -> 25.140
 * `prompt_tokens` = 3.79 byte/token su QUESTO identico contenuto). Vedi CAVEAT in fondo.
 *
 * USO:  node eval/measure-tool-payload.mjs            (da harness/)
 *       PROFILES=core,minimal,standard,full node eval/measure-tool-payload.mjs
 */
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WORKER = resolve(__dirname, "run-session.mjs");

const PROFILES = (process.env.PROFILES || "core,minimal,standard,full").split(",").map((s) => s.trim()).filter(Boolean);

/** Punto di calibrazione OSSERVATO (F37, SiliconFlow su Seed-OSS-36B): il provider ha riportato
 *  `prompt_tokens` 25140 per un `reqBodyLen` di 92.9KB con `tools 32`. Non e' un tokenizer nostro:
 *  e' il tokenizer DEL PROVIDER, misurato sullo stesso tipo di contenuto che stiamo pesando qui. */
const CALIB = { bytes: 92.9 * 1024, tokens: 25140 };
const BYTES_PER_TOKEN = CALIB.bytes / CALIB.tokens; // ~3.78

/** Tetto TPM osservato: il run moriva dopo ~4 chiamate. Non e' documentato da noi come numero
 *  ufficiale del provider -> lo trattiamo come SOGLIA OSSERVATA, non come specifica. */
const TPM_OBSERVED_DEATH_AFTER = 4;

function measureProfile(profile) {
  const workdir = mkdtempSync(join(tmpdir(), `measure-${profile}-`));
  const stateDir = join(workdir, "_state");
  mkdirSync(stateDir, { recursive: true });
  const dumpPath = join(workdir, "req.json");

  const env = {
    ...process.env,
    EVAL_PROVIDER: "openrouter",
    MODEL_ID: "qwen/qwen3-32b",
    OPENROUTER_KEYS: "sk-invalid-measurement-only",   // volutamente INVALIDA: 401 immediato, zero spesa
    EVAL_ARM: "ours",
    HARNESS_STATE_DIR: stateDir,
    HARNESS_TOOL_PROFILE: profile,                     // <-- la variabile sotto misura
    EVAL_DUMP_REQ: dumpPath,
    // un task qualsiasi: qui misuriamo il PESO DEI TOOL-SCHEMA, non la soluzione. La chiamata muore
    // in 401 prima di produrre qualunque risultato — il task serve solo a far costruire la richiesta.
    EVAL_TASKS_FILE: resolve(__dirname, "data", "humaneval-6.jsonl"),
    EVAL_N: "1",
    EVAL_ROT_MAX_RETRIES: "0",                         // niente backoff: il body e' gia' dumpato al 1o tentativo
    EVAL_WORKDIR: workdir,
    EVAL_TASK_TIMEOUT_MS: "45000",
  };

  const r = spawnSync(process.execPath, [WORKER], {
    env, cwd: workdir, encoding: "utf8", maxBuffer: 64 * 1024 * 1024, timeout: 120000,
  });

  if (!existsSync(dumpPath)) {
    return { profile, error: `nessun dump (exit ${r.status}) — stderr: ${String(r.stderr || "").slice(0, 300)}` };
  }

  const raw = readFileSync(dumpPath, "utf8");
  let parsed;
  try { parsed = JSON.parse(raw); } catch { return { profile, error: "dump non-JSON" }; }

  const tools = Array.isArray(parsed?.tools) ? parsed.tools : [];
  const toolsBytes = Buffer.byteLength(JSON.stringify(tools), "utf8");
  const totalBytes = Buffer.byteLength(raw, "utf8");

  try { rmSync(workdir, { recursive: true, force: true }); } catch {}

  return {
    profile,
    toolCount: tools.length,
    totalBytes,
    toolsBytes,
    toolsShare: totalBytes > 0 ? toolsBytes / totalBytes : 0,
    estTokens: Math.round(totalBytes / BYTES_PER_TOKEN),
    estToolTokens: Math.round(toolsBytes / BYTES_PER_TOKEN),
  };
}

const rows = PROFILES.map(measureProfile);
const ok = rows.filter((r) => !r.error);

console.log("\n=== PESO DEL PAYLOAD PER toolProfile (misurato, zero costo) ===\n");
console.log("profilo    | tool |   body KB | tools KB | tools% |  token stimati | tool-token stimati");
console.log("-----------|------|-----------|----------|--------|----------------|-------------------");
for (const r of rows) {
  if (r.error) { console.log(`${r.profile.padEnd(10)} | ERRORE: ${r.error}`); continue; }
  console.log(
    `${r.profile.padEnd(10)} | ${String(r.toolCount).padStart(4)} | ` +
    `${(r.totalBytes / 1024).toFixed(1).padStart(9)} | ${(r.toolsBytes / 1024).toFixed(1).padStart(8)} | ` +
    `${(r.toolsShare * 100).toFixed(0).padStart(5)}% | ${String(r.estTokens).padStart(14)} | ${String(r.estToolTokens).padStart(18)}`
  );
}

const std = ok.find((r) => r.profile === "standard");
const min = ok.find((r) => r.profile === "minimal");
if (std && min) {
  // ⚠️ IL DENOMINATORE CHE CONTA NON E' IL BODY AL TURNO 1 (#35b).
  // Confrontare i totali del turno-1 gonfia il risparmio, perche' al turno 1 la conversazione e'
  // quasi vuota e i tool pesano una quota artificialmente alta. Il payload che DAVVERO ha ucciso il
  // run e' quello osservato in F37 (92.9KB). I tool sono l'unica parte FISSA: non crescono coi turni.
  // Quindi il risparmio reale = (tools_standard - tools_minimal) / body_osservato_al_fallimento.
  const OBSERVED_FAIL_BYTES = 92.9 * 1024;
  const saved = std.toolsBytes - min.toolsBytes;
  const cutTurn1 = 1 - min.estTokens / std.estTokens;
  const cutReal = saved / OBSERVED_FAIL_BYTES;
  const toolShareAtFailure = std.toolsBytes / OBSERVED_FAIL_BYTES;

  console.log(`\n>> Al TURNO 1 minimal taglierebbe il ${(cutTurn1 * 100).toFixed(0)}% ` +
    `(${std.estTokens} -> ${min.estTokens} token). ⚠️ NUMERO FUORVIANTE, denominatore sbagliato.`);
  console.log(`>> SUL PAYLOAD CHE HA DAVVERO FALLITO (92.9KB, F37) il taglio e' ${(cutReal * 100).toFixed(0)}%: ` +
    `si risparmiano ${(saved / 1024).toFixed(1)}KB fissi su 92.9KB.`);
  console.log(`>> Chiamate prima di saturare: da ~${TPM_OBSERVED_DEATH_AFTER} a ` +
    `~${(TPM_OBSERVED_DEATH_AFTER / (1 - cutReal)).toFixed(1)}. **NON risolve il problema.**`);
  console.log(`\n>> ⛔ SMENTITA UNA CONCLUSIONE IN WIKI: F37 dava come *«leva-fix primaria: ridurre i`);
  console.log(`   tool-schema»*, ma quella attribuzione non era mai stata MISURATA — era dedotta dal`);
  console.log(`   vedere \`tools 32\` accanto a un body grosso. Misurata ora: al momento del fallimento`);
  console.log(`   i tool erano il ${(toolShareAtFailure * 100).toFixed(0)}% del payload. Il restante ` +
    `${((1 - toolShareAtFailure) * 100).toFixed(0)}% e' conversazione/system,`);
  console.log(`   ed e' la parte che CRESCE (92.9KB -> 104.7KB mentre i tool restano fissi). La leva`);
  console.log(`   sui tool esiste ma e' secondaria: da sola compra una chiamata in piu', non un test.`);
}

console.log(`
CAVEAT — da dichiarare a chi legge il numero, non da nascondere:
 (1) I token sono STIMATI da una calibrazione byte/token (${BYTES_PER_TOKEN.toFixed(2)} B/tok) ricavata
     dall'UNICO punto osservato (F37: 92.9KB -> 25.140 prompt_tokens riportati dal provider). E'
     molto meglio della proporzionalita' 15/32, ma NON e' il tokenizer del modello: un secondo
     punto di calibrazione lo restringerebbe. Trattare come ORDINE DI GRANDEZZA.
 (2) Il tetto TPM non e' una specifica che abbiamo letto: e' dedotto da "il run moriva dopo ~4
     chiamate". La riga "chiamate prima di saturare" eredita quell'incertezza.
 (3) Il body misurato e' quello del PRIMO turno. Nei turni successivi la conversazione cresce,
     quindi la quota-tool CALA in percentuale ma il totale SALE. Questo e' il caso migliore.
 (5) ⚠️ ANOMALIA NON SPIEGATA, segnalata invece che lisciata: \`core\` (8 tool, 5.9KB di schema) ha un
     body TOTALE piu' GRANDE di \`minimal\` (12 tool, 8.1KB) — 33.4KB vs 30.6KB. Se i tool fossero
     l'unica differenza dovrebbe essere il contrario. Vuol dire che la parte NON-tool cambia col
     profilo (~27.5KB per core vs ~22.5KB per minimal): o l'harness inietta testo diverso a seconda
     del profilo, o e' varianza fra i due processi. NON e' stato investigato -> non usare la
     differenza core-vs-minimal per decidere finche' non si sa da dove vengono quei 5KB.
 (4) \`core\` compare in tabella per completezza ma NON e' utilizzabile per il discriminante C4:
     non ha le meta-tool -> nessuna riscoperta -> \`tool-gating.mjs:72\` lo dichiara esplicitamente
     "test NON discriminante". Sceglierlo per stare sotto il TPM farebbe passare la misura
     ELIMINANDO CIO' CHE MISURA.
`);

process.exit(rows.some((r) => r.error) ? 1 : 0);
