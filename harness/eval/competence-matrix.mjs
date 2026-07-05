/**
 * competence-matrix.mjs — scaffold di eval del CURRICULUM composizionale (utente msg 1140/1146).
 *
 * Aggrega risultati per-(task, skill) in una MATRICE task×competenza (righe=task, colonne=skill). Fornisce:
 *  - pass-rate per-skill (colonna) e per-task (riga);
 *  - **gate di competenza**: uno skill è "pronto" se il suo pass-rate ≥ soglia → decide quando avanzare nel curriculum;
 *  - **rilevamento REGRESSIONE**: confronta due matrici (prima/dopo una fase di composizione) e segnala gli skill
 *    PEGGIORATI = catastrophic-forgetting (guardrail #2 di [[concepts/compositional-curriculum-thinking-optimization]]).
 *
 * PURO/testabile: nessun I/O, opera su array di risultati `{task, skill, pass}` (pass boolean). L'ESECUZIONE che
 * produce i risultati (agentic run + per-skill grader) è a valle e vive altrove; questo è solo l'aggregatore/analizzatore.
 */

/** Le 4 competenze del curriculum (ordine = catena: gathering → implementazione → scrivere-test → eseguire). SSOT. */
export const SKILLS = ["gathering", "implementation", "test_writing", "execution"];
/** Soglia di default del gate di competenza (uno skill è "pronto" a ≥80% pass-rate). SSOT. */
export const DEFAULT_COMPETENCE_THRESHOLD = 0.8;
/** Calo minimo (in punti di rate) per considerare uno skill REGREDITO tra due matrici. SSOT. */
export const DEFAULT_REGRESSION_DROP = 0.1;

/**
 * buildMatrix — aggrega i risultati in celle {pass,total} per (task,skill).
 * @param {{task:string, skill:string, pass:boolean}[]} results
 * @param {{skills?:string[]}} [opts]
 * @returns {{tasks:string[], skills:string[], cells:Object}}  cells[task][skill] = {pass:number,total:number}
 */
export function buildMatrix(results, { skills = SKILLS } = {}) {
  const cells = {};
  const taskSet = new Set();
  const skillSet = new Set(skills);
  for (const r of results || []) {
    if (!r || r.task == null || r.skill == null) continue;
    const task = String(r.task), skill = String(r.skill);
    taskSet.add(task); skillSet.add(skill);
    cells[task] ??= {};
    cells[task][skill] ??= { pass: 0, total: 0 };
    cells[task][skill].total += 1;
    if (r.pass) cells[task][skill].pass += 1;
  }
  return {
    tasks: [...taskSet].sort(),
    skills: skills.concat([...skillSet].filter((s) => !skills.includes(s)).sort()),
    cells,
  };
}

/** rate di una cella {pass,total} → pass/total, oppure null se nessun dato. */
function cellRate(c) { return c && c.total > 0 ? c.pass / c.total : null; }

/**
 * perSkillRates — pass-rate aggregato per colonna (skill), sommando su tutti i task.
 * @returns {Object} {skill: {pass, total, rate|null}}
 */
export function perSkillRates(matrix) {
  const out = {};
  for (const skill of matrix.skills) {
    let pass = 0, total = 0;
    for (const task of matrix.tasks) {
      const c = matrix.cells[task]?.[skill];
      if (c) { pass += c.pass; total += c.total; }
    }
    out[skill] = { pass, total, rate: total > 0 ? pass / total : null };
  }
  return out;
}

/**
 * perTaskRates — pass-rate aggregato per riga (task), sommando su tutti gli skill.
 * @returns {Object} {task: {pass, total, rate|null}}
 */
export function perTaskRates(matrix) {
  const out = {};
  for (const task of matrix.tasks) {
    let pass = 0, total = 0;
    for (const skill of matrix.skills) {
      const c = matrix.cells[task]?.[skill];
      if (c) { pass += c.pass; total += c.total; }
    }
    out[task] = { pass, total, rate: total > 0 ? pass / total : null };
  }
  return out;
}

/** isSkillReady — gate di competenza: rate dello skill ≥ soglia (e almeno un dato). */
export function isSkillReady(matrix, skill, threshold = DEFAULT_COMPETENCE_THRESHOLD) {
  const r = perSkillRates(matrix)[skill];
  return !!r && r.rate != null && r.rate >= threshold;
}

/** readySkills — elenco degli skill che superano il gate (nell'ordine di SKILLS). */
export function readySkills(matrix, threshold = DEFAULT_COMPETENCE_THRESHOLD) {
  return matrix.skills.filter((s) => isSkillReady(matrix, s, threshold));
}

/**
 * detectRegression — confronta due matrici (before=prima della composizione, after=dopo) e segnala gli skill
 * il cui pass-rate è CALATO oltre `minDrop` = catastrophic-forgetting. Solo skill con dati in entrambe.
 * @returns {{skill:string, before:number, after:number, drop:number}[]}  ordinati per drop decrescente
 */
export function detectRegression(before, after, { minDrop = DEFAULT_REGRESSION_DROP } = {}) {
  const b = perSkillRates(before), a = perSkillRates(after);
  const out = [];
  for (const skill of Object.keys(b)) {
    const rb = b[skill]?.rate, ra = a[skill]?.rate;
    if (rb == null || ra == null) continue;
    const drop = rb - ra;
    if (drop > minDrop) out.push({ skill, before: rb, after: ra, drop });
  }
  return out.sort((x, y) => y.drop - x.drop);
}

/** renderMatrix — dump testuale leggibile (righe task, colonne skill, celle "p/t"). Per report/debug. */
export function renderMatrix(matrix) {
  const rates = perSkillRates(matrix);
  const head = ["task".padEnd(24), ...matrix.skills.map((s) => s.slice(0, 12).padStart(13))].join("");
  const rows = matrix.tasks.map((task) => {
    const cellsTxt = matrix.skills.map((skill) => {
      const c = matrix.cells[task]?.[skill];
      return (c ? `${c.pass}/${c.total}` : "-").padStart(13);
    });
    return [String(task).slice(0, 24).padEnd(24), ...cellsTxt].join("");
  });
  const foot = ["RATE".padEnd(24), ...matrix.skills.map((s) => {
    const r = rates[s]?.rate;
    return (r == null ? "-" : `${Math.round(r * 100)}%`).padStart(13);
  })].join("");
  return [head, ...rows, foot].join("\n");
}
