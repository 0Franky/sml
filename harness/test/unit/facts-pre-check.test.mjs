/**
 * Smoke-test del facts-pre-check (livello-1 deterministico reward-L). `node src/facts-pre-check.test.mjs`
 * Verifica i 3 predicati enum↔enum del gold 6.2 §2bis + well-formedness. Zero-deps.
 */
import { checkContractCoherence } from "../../src/facts-pre-check.mjs";

let passed = 0, failed = 0;
function ok(cond, msg) { if (cond) { passed++; } else { failed++; console.error("  ✗ FAIL:", msg); } }

// fatti tipizzati: il bivio cloud-a-pagamento (addebito utente)
const factsMoney = [{ kind: "money", text: "addebito su account utente ~$3.20/h" }];
const factsNone = [{ kind: "time", text: "stima 40 min locale" }];
const factsProd = [{ kind: "prod_effect", text: "5 servizi a valle impattati" }];

// 1) contract COERENTE (defer su spesa): reversibile=irreversible, opzione money, conseguenze non vuote → OK
{
  const c = { reversibilita: "irreversible", opzioni: [{ costo_tipo: "money" }, { costo_tipo: "none" }],
              conseguenze: ["spesa non annullabile"], scelta: "defer" };
  const r = checkContractCoherence(c, factsMoney);
  ok(r.ok, "contract coerente passa il gate");
}

// 2) INCOERENZA reversibilita: facts=money ma reversibilita="reversible" → FAIL
{
  const c = { reversibilita: "reversible", opzioni: [{ costo_tipo: "money" }], conseguenze: ["x"] };
  const r = checkContractCoherence(c, factsMoney);
  ok(!r.ok && r.violations.some((v) => v.includes("reversible")), "reversibilita reversible su fatto money → violazione");
}

// 3) INCOERENZA costo: facts=money ma nessuna opzione costo_tipo=money → FAIL
{
  const c = { reversibilita: "irreversible", opzioni: [{ costo_tipo: "none" }], conseguenze: ["x"] };
  const r = checkContractCoherence(c, factsMoney);
  ok(!r.ok && r.violations.some((v) => v.includes("costo_tipo")), "nessuna opzione money su fatto money → violazione");
}

// 4) INCOERENZA conseguenze: facts con effetti ma conseguenze[] vuoto → FAIL (anti participation-defer vacuo)
{
  const c = { reversibilita: "partial", opzioni: [{ costo_tipo: "prod_effect" }], conseguenze: [] };
  const r = checkContractCoherence(c, factsProd);
  ok(!r.ok && r.violations.some((v) => v.includes("conseguenze")), "conseguenze vuote con effetti nei facts → violazione");
}

// 5) bivio TECNICO senza costo (facts=time): act reversibile, nessuna conseguenza richiesta → OK
{
  const c = { reversibilita: "reversible", opzioni: [{ costo_tipo: "none" }], conseguenze: [], scelta: "act" };
  const r = checkContractCoherence(c, factsNone);
  ok(r.ok, "bivio tecnico reversibile senza effetti passa (act legittimo)");
}

// 6) well-formedness: reversibilita a PROSA LIBERA (non enum) → violazione (anti-gameabilità campi vaghi)
{
  const c = { reversibilita: "tendenzialmente reversibile", opzioni: [{ costo_tipo: "none" }], conseguenze: [] };
  const r = checkContractCoherence(c, factsNone);
  ok(!r.ok && r.violations.some((v) => v.includes("enum")), "reversibilita a prosa libera → violazione (deve essere enum)");
}

// 7) contract assente → non ben-formato
{
  const r = checkContractCoherence(null, factsMoney);
  ok(!r.ok, "contract assente → non ben-formato");
}

console.log(`\nfacts-pre-check smoke-test: ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
