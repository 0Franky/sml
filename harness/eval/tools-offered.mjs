#!/usr/bin/env node
/**
 * tools-offered — quali tool arrivano DAVVERO al modello in ciascun braccio, a COSTO ZERO.
 *
 * PERCHE' ESISTE (2026-09-12, da F43). Il finding diceva: *«il 32B non ha usato un solo tool
 * dell'harness in 16 run»* — e la conclusione che se ne traeva (*«il contesto e' pagato e ignorato»*)
 * regge **solo se i tool gli erano stati offerti**. Prima di attribuire al MODELLO un non-uso, va
 * escluso il wiring: e' esattamente la domanda che E14 aveva gia' trovato scomoda (il tool-gating
 * non riduceva l'array inviato) e la forma del difetto #0 (*ho verificato la cosa giusta?*).
 *
 * COME MISURA SENZA SPENDERE — stesso trucco di `measure-tool-payload` (F37): si intercetta `fetch`
 * e si legge il body **prima** dell'invio; la chiave e' volutamente **invalida**, quindi la chiamata
 * muore in 401 e non consuma ne' credito ne' quota. Nessun token speso, nessuna rete utile.
 *
 * ESITO MISURATO IL 2026-09-12 (provider openrouter, modello qwen/qwen3-32b):
 *   vanilla → **4 tool** (read, bash, edit, write), body **11,5 KB**
 *   ours    → **34 tool**, di cui **12 delle nostre lane** (list_tasks, add_task, set_task_status,
 *             set_var, get_var, note, jot, recall_scratch, enter_focus, pop_focus, focus_status,
 *             get_conversation), body **51,7 KB** = **4,5x** il vanilla.
 * → i tool **c'erano**. Il non-uso in F43 e' del modello, non del wiring.
 *
 * USO:  node eval/tools-offered.mjs [vanilla|ours] [modelId]     (da harness/)
 */
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openSession } from "./_pi-session.mjs";

const ARM = process.argv[2] || "ours";
const MODEL_ID = process.argv[3] || "qwen/qwen3-32b";
// Chiave volutamente invalida: il body si legge PRIMA dell'invio, la chiamata muore in 401 → spesa zero.
// ⚠️ NON deve *assomigliare* a una chiave (niente prefisso `sk-…`): il 2026-09-12 la prima stesura usava
// un finto `sk-or-v1-…` e **gitleaks ha bloccato il push** (regola `generic-api-key`) — giustamente, perche'
// un repo pubblico non puo' distinguere un finto da un vero. Meglio cambiare la stringa che allowlistare:
// l'allowlist si porta dietro il rischio per sempre, questa riga no.
process.env.OPENROUTER_KEYS = "chiave-invalida-di-proposito-per-non-spendere";

/** riconosce i tool delle NOSTRE lane (memoria, task, focus) fra quelli inviati */
const NOSTRI = /note|jot|var|fact|memo|task|conversation|changelog|focus|scratch|fileview|digest|keepturns/i;

let captured = null;
const _f = globalThis.fetch;
globalThis.fetch = async (url, opts) => {
  const u = String(url?.url ?? url);
  if (/openrouter|groq|api\.openai|completions/i.test(u) && opts?.body && !captured) {
    try {
      const p = JSON.parse(opts.body);
      if (Array.isArray(p?.tools)) captured = { n: p.tools.length, bytes: opts.body.length, names: p.tools.map((t) => t?.function?.name ?? t?.name ?? "?") };
    } catch { /* body non-JSON → ignora */ }
  }
  return _f(url, opts);
};

const dir = mkdtempSync(join(tmpdir(), "tools-offered-"));
writeFileSync(join(dir, "nota.txt"), "ciao\n");
const s = await openSession({ cwd: dir, provider: "openrouter", modelId: MODEL_ID, arm: ARM, ctx: 32768 });
console.log(`arm=${ARM} · modello=${MODEL_ID} · estensioni caricate: ${s.nExt}`);
const wait = s.waitAgentEnd(60000);
try { await s.session.sendUserMessage("Scrivi una riga in nota.txt."); } catch (e) { console.log("send:", String(e?.message ?? e).slice(0, 90)); }
await wait;

if (!captured) { console.log("🔴 nessuna richiesta con `tools` intercettata: il modello non ha mai chiamato il provider (wiring da guardare)."); process.exit(2); }
const nostri = captured.names.filter((n) => NOSTRI.test(n));
console.log(`tool OFFERTI al modello: ${captured.n} · body ${(captured.bytes / 1024).toFixed(1)} KB`);
console.log(`  delle NOSTRE lane (${nostri.length}): ${nostri.join(", ") || "NESSUNO"}`);
console.log(`  tutti: ${captured.names.join(", ")}`);
process.exit(0);
