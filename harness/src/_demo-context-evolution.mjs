/**
 * _demo-context-evolution — mostra COSA viene assemblato nel nostro <context> richiesta-per-richiesta
 * e come evolve, incluso cosa SOPRAVVIVE a una nuova sessione (stesso .pi/state/vars.db) e dove sta il GAP.
 *
 * NB onestà: questo demo mostra SOLO la parte che l'harness NOSTRO controlla = il blocco <context> (lane di STATO).
 * I MESSAGGI della conversazione (user/assistant/tool) NON sono qui: li gestisce pi nativamente (message array +
 * session file + auto-compaction). Vedi il commento "[pi-native]" sotto. Esegui: node harness/src/_demo-context-evolution.mjs
 */
import { VarsQueue } from "./vars-queue.mjs";
import { assembleContext } from "./context-assembler.mjs";
import { rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const DB = join(tmpdir(), "pi-demo-context.db");
try { rmSync(DB); } catch { /* prima esecuzione */ }

const hr = (t) => console.log("\n" + "═".repeat(78) + "\n  " + t + "\n" + "═".repeat(78));
const show = (label, ctx) => { console.log("\n── " + label + " ──"); console.log(ctx); };

// Seed identico a quello che fa l'extension context-assembly.ts su DB vuoto.
function seedRules(vq) {
  if (vq.listRules().length === 0) {
    vq.addRule("structured-thinking", "Pensiero STRUTTURATO (marker [V]/[A]/[?]); risposta all'utente in prosa.", { severity: "soft" });
    vq.addRule("pre-flight-destructive", "Azioni distruttive: pre-flight (reversibile? dipendenze? backup?), HALT se irreversibile.", { severity: "hard" });
    vq.addRule("no-secret-exfil", "Mai esfiltrare segreti o contenuti sensibili.", { severity: "hard" });
  }
}

hr("SESSIONE 1 — un nuovo processo pi apre .pi/state/vars.db (vuoto)");
const vq = new VarsQueue(DB, { agent: "orchestrator" });
seedRules(vq);

show("REQUEST #1 — utente: «implementa POST /users» (DB ancora vuoto: solo rules seed)", assembleContext(vq));
console.log("  [pi-native, NON nel nostro <context>] messages = [ {role:user, «implementa POST /users»} ]");

// --- Turno 1: il modello USA i nostri tool (set_curr / add_task / set_var) per registrare stato ---
vq.addTask("t1", "Implementare endpoint POST /users");
vq.setTaskStatus("t1", "in_progress");
vq.setCurr("t1");
vq.addTask("t2", "Aggiungere validazione input");
vq.setVar("api_auth", "JWT", { scope: "shared", decisionRef: "D1" });

show("REQUEST #2 — dopo che il turno-1 ha scritto stato (aim+task+var compaiono)", assembleContext(vq));
console.log("  [pi-native] messages = [ user#1, assistant#1(+tool_calls), tool_results…, user#2 ]  ← cresce ad ogni turno");

// --- Turni 2-3: altre mutazioni + una memo (silente) + una verifica ---
vq.setVar("db_schema_has_email", true, { scope: "shared" });
vq.addVerification("v1", "t1", { detail: "pytest tests/test_users.py" });
vq.setVar("lesson-tz", "Il test falliva per timezone non-UTC", { scope: "private", namespace: "memo" });

show("REQUEST #3 — recent_changes + verify_queue + <notes> (la memo è SILENTE nel flusso, solo segnalata)", assembleContext(vq));
console.log("  [pi-native] messages cresce ancora… quando supera la soglia → pi AUTO-COMPACT (summarize+keep-recent).");
console.log("  NB: la compaction tocca SOLO i messages pi-native. Il nostro <context> NON cambia (è ricostruito dal DB).");
vq.close();

hr("SESSIONE 2 — chiudi pi, riapri (NUOVO processo, STESSO vars.db)");
const vq2 = new VarsQueue(DB, { agent: "orchestrator" });
seedRules(vq2); // idempotente: le rules ci sono già

show("REQUEST #1' — lo STATO sopravvive (aim/task/vars/verify dal DB persistito)", assembleContext(vq2));
console.log("  [pi-native] messages = [ ]  ← VUOTO: pi non ha ripreso la conversazione precedente (sessione nuova).");
console.log("  → ECCO il «ricomincio da zero» di Sonnet: lo STATO c'è, ma la CONVERSAZIONE no, e manca un digest di resume.");

// --- GAP #1 dimostrato: a +1 giorno, recent_changes (finestra 15min) si SVUOTA ---
const plus1d = Date.now() + 24 * 3600 * 1000;
show("REQUEST a +1 GIORNO — recent_changes SPARISCE (window 15min); aim/task restano", assembleContext(vq2, { now: plus1d }));
console.log("  → GAP: dopo un gap reale di sessione, 'cosa è successo di recente' è vuoto. Serve la lane <resuming_from>.");
vq2.close();

hr("FINE DEMO");
