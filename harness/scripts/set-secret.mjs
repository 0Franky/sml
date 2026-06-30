#!/usr/bin/env node
/**
 * set-secret — provisioning OUT-OF-BAND della METADATA di un sealed-secret (mai il valore).
 *
 * Aggiorna `.pi/secrets.config.json` (nome → {description, allowedSinks}) e stampa come impostare il VALORE via env.
 * Il valore NON passa da questo CLI né dal modello: lo metti TU in `harness/.env` come `SEALED_SECRET_<NOME>=...`.
 *
 * Uso:
 *   node scripts/set-secret.mjs OPENAI_KEY --desc "OpenAI key" --allow-host api.openai.com,azure.openai.com
 *   node scripts/set-secret.mjs OPENAI_KEY --allow-host "*"      # gating off per quel secret
 *   node scripts/set-secret.mjs OPENAI_KEY --allow-host ""       # lockdown (in strict: niente rete)
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const CONFIG = ".pi/secrets.config.json";
const NAME_RE = /^[A-Za-z0-9_.\-]{1,64}$/;

function parseArgs(argv) {
  const a = { name: null, desc: "", allow: undefined };
  const rest = argv.slice(2);
  for (let i = 0; i < rest.length; i++) {
    const t = rest[i];
    if (t === "--desc") a.desc = rest[++i] ?? "";
    else if (t === "--allow-host") a.allow = rest[++i] ?? "";
    else if (!a.name && !t.startsWith("--")) a.name = t;
  }
  return a;
}

const { name, desc, allow } = parseArgs(process.argv);
if (!name || !NAME_RE.test(name)) {
  console.error("Uso: node scripts/set-secret.mjs <NOME> [--desc \"...\"] [--allow-host host1,host2|*|\"\"]");
  console.error("  NOME valido: [A-Za-z0-9_.-], max 64.");
  process.exit(1);
}

let cfg = {};
if (existsSync(CONFIG)) {
  try { cfg = JSON.parse(readFileSync(CONFIG, "utf-8")) || {}; } catch { cfg = {}; }
}
const entry = cfg[name] && typeof cfg[name] === "object" ? cfg[name] : {};
if (desc) entry.description = desc;
if (allow !== undefined) {
  entry.allowedSinks = String(allow).split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
}
if (entry.description == null) entry.description = "";
if (entry.allowedSinks == null) entry.allowedSinks = [];
cfg[name] = entry;
writeFileSync(CONFIG, JSON.stringify(cfg, null, 2) + "\n", "utf-8");

console.log(`✓ metadata salvata in ${CONFIG}:`);
console.log(`  ${name} → ${JSON.stringify(entry)}`);
console.log("");
console.log("Ora imposta il VALORE (NON passa dal modello) — aggiungi a harness/.env (gitignored):");
console.log(`  SEALED_SECRET_${name}=<il-valore-reale>`);
console.log("Poi riavvia pi. Il modello vedrà solo nome+descrizione (list_secrets) e userà {{secret:" + name + "}}.");
if (!entry.allowedSinks.length) {
  console.log("⚠ allowedSinks VUOTO → in sinkGating=strict questo secret NON potrà uscire in rete (lockdown). Dichiara --allow-host per usarlo.");
}
