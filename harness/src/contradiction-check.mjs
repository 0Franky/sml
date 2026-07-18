/**
 * contradiction-check — rilevamento DETERMINISTICO di contraddizioni tra un nuovo fatto e le
 * ASSUNZIONI di decisioni precedenti registrate. Implementa il livello deterministico di
 * ../../wiki/concepts/contradiction-detection-layer.md (research-gap #2, validato dal Test B
 * harness/src/_dogfood-contradiction.mjs): una decisione di FASE-1 poggia su un'assunzione tipizzata;
 * un nuovo fatto che la NEGA va segnalato PRIMA di applicare il nuovo requisito in isolamento.
 *
 * Modello: un PREDICATO = {key, op, value}. Una DECISIONE = {id, statement, assumptions:[predicato]}.
 * `contradicts(p1,p2)` = true se p1 ∧ p2 è insoddisfacibile sulla STESSA key (conservativo: nel dubbio
 * NON contraddice → anti falso-positivo, coerente con la difesa anti-cry-wolf d'area). La metà-S
 * (quando registrare/quando controllare/come agire) è skill addestrata; questo è la metà-F (meccanismo).
 */

// normalizzazione degli operatori (accetta forme comuni)
const OP = {
  "==": "eq", "=": "eq", eq: "eq", is: "eq",
  "!=": "neq", neq: "neq", isnot: "neq", "is-not": "neq", "not": "neq",
  ">": "gt", gt: "gt", "<": "lt", lt: "lt", ">=": "gte", gte: "gte", "<=": "lte", lte: "lte",
  in: "in", "not-in": "nin", nin: "nin", notin: "nin",
};
const norm = (p) => ({ key: p.key, op: OP[p.op] ?? p.op, value: p.value });
const isNum = (v) => typeof v === "number";
const asSet = (p) => (Array.isArray(p.value) ? p.value : [p.value]);

function numRange(op, v) {
  switch (op) {
    case "eq": return { lo: v, loOpen: false, hi: v, hiOpen: false };
    case "gt": return { lo: v, loOpen: true, hi: Infinity, hiOpen: true };
    case "gte": return { lo: v, loOpen: false, hi: Infinity, hiOpen: true };
    case "lt": return { lo: -Infinity, loOpen: true, hi: v, hiOpen: true };
    case "lte": return { lo: -Infinity, loOpen: true, hi: v, hiOpen: false };
    default: return null;
  }
}
function rangesDisjoint(a, b) {
  let lo, loOpen;
  if (a.lo > b.lo) { lo = a.lo; loOpen = a.loOpen; }
  else if (b.lo > a.lo) { lo = b.lo; loOpen = b.loOpen; }
  else { lo = a.lo; loOpen = a.loOpen || b.loOpen; }
  let hi, hiOpen;
  if (a.hi < b.hi) { hi = a.hi; hiOpen = a.hiOpen; }
  else if (b.hi < a.hi) { hi = b.hi; hiOpen = b.hiOpen; }
  else { hi = a.hi; hiOpen = a.hiOpen || b.hiOpen; }
  if (lo > hi) return true;
  if (lo === hi && (loOpen || hiOpen)) return true;
  return false;
}

/**
 * @returns {boolean} true se i due predicati sulla STESSA key sono jointly UNSAT (si contraddicono).
 */
export function contradicts(p1, p2) {
  const a = norm(p1), b = norm(p2);
  if (a.key !== b.key) return false; // key diverse → non comparabili
  // neq: contraddice solo eq sullo stesso valore
  if (a.op === "neq" && b.op === "eq") return a.value === b.value;
  if (b.op === "neq" && a.op === "eq") return a.value === b.value;
  if (a.op === "neq" || b.op === "neq") return false;
  // membership (in / nin)
  if (a.op === "in" && b.op === "in") return asSet(a).filter((x) => asSet(b).includes(x)).length === 0;
  if (a.op === "in" && b.op === "eq") return !asSet(a).includes(b.value);
  if (b.op === "in" && a.op === "eq") return !asSet(b).includes(a.value);
  if (a.op === "in" && b.op === "nin") return asSet(a).every((x) => asSet(b).includes(x));
  if (b.op === "in" && a.op === "nin") return asSet(b).every((x) => asSet(a).includes(x));
  if (a.op === "nin" && b.op === "eq") return asSet(a).includes(b.value);
  if (b.op === "nin" && a.op === "eq") return asSet(b).includes(a.value);
  if (a.op === "nin" || b.op === "nin") return false;
  // numerico (range-intersection) — fix audit-B AS11: solo se ENTRAMBI i valori sono numerici. Con `||`, eq/eq
  // cross-tipo (es. eq:'postgres' vs eq:5) entrava qui, rangesDisjoint confrontava 'postgres' con 5 (NaN → mai
  // disgiunto) → false, saltando la contraddizione categorica reale di riga 74. Con `&&` cade correttamente lì.
  if (isNum(a.value) && isNum(b.value)) {
    const ra = numRange(a.op, a.value), rb = numRange(b.op, b.value);
    if (ra && rb) return rangesDisjoint(ra, rb);
  }
  // categorico eq/eq: la key tiene UN valore → due eq diversi si contraddicono
  if (a.op === "eq" && b.op === "eq") return a.value !== b.value;
  return false; // conservativo: nel dubbio NON contraddice (anti falso-positivo)
}

/**
 * Controlla un insieme di nuovi fatti contro le assunzioni di decisioni registrate.
 * @param {Array|object} newFacts predicato o array di predicati {key,op,value}.
 * @param {Array<{id:string, statement?:string, assumptions:Array}>} decisions
 * @returns {Array<{decision_id, statement, assumption, fact, reason}>} conflitti (vuoto = nessuno).
 */
export function checkContradiction(newFacts, decisions) {
  const facts = Array.isArray(newFacts) ? newFacts : [newFacts];
  const conflicts = [];
  for (const d of decisions || []) {
    for (const asm of d.assumptions || []) {
      for (const f of facts) {
        if (contradicts(asm, f)) {
          conflicts.push({
            decision_id: d.id,
            statement: d.statement ?? null,
            assumption: asm,
            fact: f,
            reason: `the fact {${f.key} ${f.op} ${JSON.stringify(f.value)}} contradicts the assumption {${asm.key} ${asm.op} ${JSON.stringify(asm.value)}} of decision "${d.id}"${d.statement ? ` (${d.statement})` : ""}`,
          });
        }
      }
    }
  }
  return conflicts;
}

export default checkContradiction;
