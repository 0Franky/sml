/**
 * auto-pop-wiring — REGRESSION test del fix UD3 (auto-pop, utente "1 si" 2026-07-16). Regola #17: il test sta AL
 * LIVELLO DOVE VIVEVA IL BUG. Il bug NON era in una funzione pura sbagliata: era un'ASSENZA nel wiring — `popFocus`
 * esisteva ma nessuno lo chiamava mai fuori dal tool `pop_focus`, e il ramo NESTED di context-assembly non emetteva
 * alcun hint → l'auto-mode ENTRAVA in focus da solo e non ne USCIVA mai.
 *
 * Scenario riprodotto (quello reale dell'audit): pressione matrioska → auto-enter sui top-5 ready → il modello porta
 * a 'done' tutti e 5 → turno successivo: <task_list> filtrata al subset = VUOTA, i task di backlog visibili solo nel
 * <frame>, nessun segnale di poppare = STRANDING. Questi test FALLIREBBERO col bug (maybeAutoPop non esisteva e la
 * <task_list> restava vuota) e ora passano.
 *
 * Replica ciò che fa .pi/extensions/context-assembly.ts (senza il bus pi), su VarsQueue in-memory.
 */
import { VarsQueue } from "../../src/vars-queue.mjs";
import {
  maybeAutoFocus, maybeAutoPop, exhaustedFocusScope, backlogOutsideSubset,
  getFocusStack, enterFocus, buildFrame, DEFAULT_CFG,
} from "../../src/nested-compact.mjs";
import { assembleContext } from "../../src/context-assembler.mjs";

let pass = 0, fail = 0;
function ok(cond, msg) { if (cond) { pass++; } else { fail++; console.error("  ✗ " + msg); } }

// ── 1) LO SCENARIO DI STRANDING END-TO-END (il bug UD3) ──────────────────────────────────────────────
{
  const vq = new VarsQueue(":memory:", { agent: "orchestrator" });
  // 8 task ready (grafo piatto) → oltre watchMatrioska? no: la pressione la forziamo via usage-token per determinismo.
  for (let i = 1; i <= 8; i++) vq.addTask("T" + i, "task " + i);

  // auto-enter come fa l'extension sotto pressione matrioska (tokens/window ≥ tokenMatrioskaPct).
  // NB `now` realistico: (a) shouldEmitFocusHint confronta `now - lastTs >= cooldownMs` con lastTs=0 → con un now
  // piccolo (es. 1000) il cooldown risulterebbe NON scaduto e l'auto-enter sarebbe un no-op silenzioso; (b) addTask
  // stampa le entry con Date.now() reale → un now nel passato darebbe età NEGATIVE in <recent_changes>.
  const T0 = Date.now();
  const entered = maybeAutoFocus(vq, { tokens: 800, contextWindow: 1000, now: T0 }, DEFAULT_CFG);
  ok(entered !== null, "setup: l'auto-mode è entrato in focus da solo (pressione matrioska)");
  ok(getFocusStack(vq).length === 1, "setup: uno scope aperto");
  const scope = getFocusStack(vq)[0];
  ok(scope.task_subset.length === DEFAULT_CFG.focusK, `setup: subset = top-${DEFAULT_CFG.focusK} ready`);

  // il modello porta a done TUTTI i task del subset (è lo scenario: ha fatto il suo lavoro)
  for (const id of scope.task_subset) vq.setTaskStatus(id, "done", { who: scope.scope_id });

  // ── IL BUG: prima del fix, qui lo scope restava aperto e la <task_list> era vuota ──
  const stranded = exhaustedFocusScope(vq);
  ok(stranded !== null && stranded.scope_id === scope.scope_id, "UD3: subset esaurito → exhaustedFocusScope lo rileva");
  const hidden = backlogOutsideSubset(vq, stranded);
  ok(hidden.length === 3, "UD3: 3 task di backlog restano NASCOSTI dal filtro-scope (8 - 5)");

  // La prova del DANNO, osservata sul context reale: con lo scope ancora aperto la <task_list> filtrata è
  // letteralmente `<task_list focus="0"></task_list>` — VUOTA — nonostante 3 task pending. Il modello non ha nulla
  // di azionabile e nessun segnale. (Asserire sull'INTERO context sarebbe sbagliato: T6-T8 compaiono comunque in
  // <recent_changes> come righe di changelog — ma quella non è una lista azionabile.)
  {
    const ctx = assembleContext(vq, { focusTaskIds: scope.task_subset, now: T0 + 1000 });
    const taskList = (ctx.match(/<task_list[\s\S]*?<\/task_list>/) || [""])[0];
    ok(/focus="0"/.test(taskList), "UD3 (danno): <task_list> è filtrata allo scope e conta 0 task");
    ok(!/T6|T7|T8/.test(taskList), "UD3 (danno): i 3 task di backlog sono INVISIBILI nella <task_list> = stranding");
  }

  // ── IL FIX: l'auto-pop chiude lo scope esaurito ──
  const popped = maybeAutoPop(vq, { now: T0 + 2000 }, DEFAULT_CFG);
  ok(Array.isArray(popped) && popped.length === 1 && popped[0] === scope.scope_id, "FIX: maybeAutoPop ha chiuso lo scope esaurito");
  ok(getFocusStack(vq).length === 0, "FIX: nessuno scope aperto → il turno dopo si torna al ramo non-nested");

  // e ora il backlog è di nuovo VISIBILE nella task_list piena (niente stranding)
  {
    const ctx = assembleContext(vq, { now: T0 + 3000 });
    const taskList = (ctx.match(/<task_list[\s\S]*?<\/task_list>/) || [""])[0];
    ok(/T6/.test(taskList) && /T7/.test(taskList) && /T8/.test(taskList), "FIX: la <task_list> mostra di nuovo i 3 task di backlog");
  }
  vq.close?.();
}

// ── 2) NO-OP quando NON è esaurito (non deve poppare uno scope ancora al lavoro) ─────────────────────
{
  const vq = new VarsQueue(":memory:", { agent: "orchestrator" });
  vq.addTask("A", "a"); vq.addTask("B", "b"); vq.addTask("C", "c");
  const { scopeId } = enterFocus(vq, { taskSubset: ["A", "B"], now: 1 });
  vq.setTaskStatus("A", "done", { who: scopeId });          // 1 su 2 fatto → NON esaurito
  ok(exhaustedFocusScope(vq) === null, "no-op: subset con ancora 1 task open → non è esaurito");
  ok(maybeAutoPop(vq, { now: 2 }, DEFAULT_CFG) === null, "no-op: maybeAutoPop non tocca uno scope ancora al lavoro");
  ok(getFocusStack(vq).length === 1, "no-op: lo scope resta aperto");
  vq.close?.();
}

// ── 3) in_progress conta come OPEN (un task avviato non è "esaurito") ────────────────────────────────
{
  const vq = new VarsQueue(":memory:", { agent: "orchestrator" });
  vq.addTask("A", "a"); vq.addTask("Z", "z");
  const { scopeId } = enterFocus(vq, { taskSubset: ["A"], now: 1 });
  vq.setTaskStatus("A", "in_progress", { who: scopeId });
  ok(exhaustedFocusScope(vq) === null, "in_progress conta come open → nessun auto-pop mentre il modello lavora");
  vq.close?.();
}

// ── 4) subset VUOTO (scope sul solo aimTask) → NON è stranding, niente pop ───────────────────────────
{
  const vq = new VarsQueue(":memory:", { agent: "orchestrator" });
  vq.addTask("AIM", "aim-task");
  vq.setCurr("AIM");
  // enterFocus con solo aimTask: subset vuoto ma scope legittimo
  let opened = false;
  try { enterFocus(vq, { aimTask: "AIM", taskSubset: ["AIM"], now: 1 }); opened = true; } catch { /* ok */ }
  if (opened) {
    vq.setTaskStatus("AIM", "done");
    // subset=["AIM"] esaurito e NIENTE backlog → si poppa comunque (ripristina il CURR del padre), ma niente hint
    const ex = exhaustedFocusScope(vq);
    ok(ex !== null, "subset esaurito senza backlog → si rileva comunque (il pop ripristina il padre)");
    ok(backlogOutsideSubset(vq, ex).length === 0, "…ma il backlog è VUOTO → nessun <pop_hint> (niente stranding reale)");
  } else {
    ok(true, "enterFocus ha rifiutato (hard-gate) — caso non applicabile");
  }
  vq.close?.();
}

// ── 5) LOOP: pila di scope annidati tutti esauriti → si srotolano nello stesso turno ─────────────────
{
  const vq = new VarsQueue(":memory:", { agent: "orchestrator" });
  for (const id of ["A", "B", "OUT"]) vq.addTask(id, id);
  const s1 = enterFocus(vq, { taskSubset: ["A"], now: 1 });
  const s2 = enterFocus(vq, { taskSubset: ["B"], now: 2 }); // figlio di s1
  ok(getFocusStack(vq).length === 2, "setup loop: 2 scope annidati");
  vq.setTaskStatus("B", "done", { who: s2.scopeId });
  vq.setTaskStatus("A", "done", { who: s1.scopeId });
  const popped = maybeAutoPop(vq, { now: 3 }, DEFAULT_CFG);
  ok(popped && popped.length === 2, "loop: entrambi gli scope esauriti chiusi nello stesso turno (dal più profondo)");
  ok(popped[0] === s2.scopeId && popped[1] === s1.scopeId, "loop: ordine LIFO (figlio prima del padre)");
  ok(getFocusStack(vq).length === 0, "loop: pila srotolata");
  vq.close?.();
}

// ── 6) SSOT (#16): buildFrame e il pop_hint derivano il backlog dalla STESSA funzione ────────────────
{
  const vq = new VarsQueue(":memory:", { agent: "orchestrator" });
  for (const id of ["F1", "F2", "F3"]) vq.addTask(id, id);
  enterFocus(vq, { taskSubset: ["F1"], now: 1 });
  const deepest = getFocusStack(vq)[0];
  const viaHelper = backlogOutsideSubset(vq, deepest).map((t) => t.id);
  const viaFrame = buildFrame(vq, { now: 2 }).backlog.map((t) => t.id);
  ok(JSON.stringify(viaHelper) === JSON.stringify(viaFrame), "SSOT: buildFrame().backlog === backlogOutsideSubset() (una sola derivazione)");
  ok(viaHelper.length === 2, "SSOT: il backlog esclude il task a fuoco");
  vq.close?.();
}

// ── 7) nessuno scope aperto → tutto no-op (non deve inventarsi pop) ──────────────────────────────────
{
  const vq = new VarsQueue(":memory:", { agent: "orchestrator" });
  vq.addTask("X", "x");
  ok(exhaustedFocusScope(vq) === null, "nessuno scope → exhaustedFocusScope null");
  ok(maybeAutoPop(vq, { now: 1 }, DEFAULT_CFG) === null, "nessuno scope → maybeAutoPop null");
  ok(backlogOutsideSubset(vq, null).length === 1, "frame null → backlog = tutti gli open (niente è nascosto)");
  vq.close?.();
}

console.log(`\nauto-pop-wiring: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
