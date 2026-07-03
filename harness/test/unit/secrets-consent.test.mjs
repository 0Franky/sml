/**
 * Test secrets-consent (node-puro): orchestrazione del CONSENSO sui sealed-secrets con un `ui` MOCKATO.
 * Copre i rami che i unit-test sealed-secrets (logica pura) non toccano: headless-degrade, confirm→false (deny),
 * confirm→true (apply), frizione REALE widening (type-to-confirm match/mismatch + fail-CLOSED), wildcard-reject,
 * create con valore digitato dall'utente (+ type-to-confirm sink esterni + trim), parità askLocalHttp,
 * e i messaggi headless ACCURATI (differito #4). Include gli hardening della review 2026-07-03 (P1/P2/P3).
 */
import { askAndApplyEdit, askAndDestroy, askLocalHttp, askAndCreate, wideningChallenge, headlessEditInstructions } from "../../src/secrets-consent.mjs";
import { setSecret, hasSecret, listSecretsMeta, clearSealed } from "../../src/sealed-secrets.mjs";
import { clearSecrets, getDynamicSecrets } from "../../src/secrets-registry.mjs";

let passed = 0, failed = 0;
function ok(cond, msg) { if (cond) { passed++; } else { failed++; console.error("  ✗ FAIL:", msg); } }
const reset = () => { clearSealed(); clearSecrets(); };

/** ui MOCK: `input` può essere scalare (stesso per ogni call), FUNZIONE (title,placeholder), o ARRAY (coda, shift). */
function mockUi({ confirm = false, input = undefined, noInput = false } = {}) {
  const calls = { confirm: [], input: [], notify: [] };
  let idx = 0;
  const ui = {
    async confirm(title, message) { calls.confirm.push({ title, message }); return typeof confirm === "function" ? confirm(title, message) : confirm; },
    notify(message, type) { calls.notify.push({ message, type }); },
  };
  if (!noInput) {
    ui.input = async (title, placeholder) => {
      calls.input.push({ title, placeholder });
      if (typeof input === "function") return input(title, placeholder);
      if (Array.isArray(input)) return input[idx++];
      return input;
    };
  }
  return { ui, calls };
}

// ── askAndApplyEdit: guard di base ───────────────────────────────────────────────────────────────
{
  reset();
  const { ui } = mockUi({ confirm: true, input: "x.com" });
  const r = await askAndApplyEdit(ui, true, "NOPE", { addSinks: ["x.com"] }, "why", "Edit");
  ok(r.details.ok === false && /does not exist/.test(r.content[0].text), "EDIT: secret inesistente → ok:false");
}
{
  reset();
  setSecret("TKN", "sk-aaaaaaaaaaaa", { allowedSinks: ["api.x.com"] });
  const { ui, calls } = mockUi({ confirm: true, input: "api.x.com" });
  const r = await askAndApplyEdit(ui, true, "TKN", { addSinks: ["api.x.com"] }, "why", "Edit"); // già presente → no-op
  ok(r.details.ok === false && calls.confirm.length === 0, "EDIT: no-op (sink già presente) → niente Ask, ok:false");
}
{
  reset();
  setSecret("TKN", "sk-aaaaaaaaaaaa", {});
  setSecret("OTHER", "sk-bbbbbbbbbbbb", {});
  const { ui, calls } = mockUi({ confirm: true });
  const r = await askAndApplyEdit(ui, true, "TKN", { rename: "OTHER" }, "why", "Edit"); // collisione
  ok(r.details.ok === false && calls.confirm.length === 0 && /invalid|exists|CANNOT/i.test(r.content[0].text), "EDIT: rename in collisione → niente Ask (anyInvalid), ok:false");
}

// ── review P1: wildcard '*' NON concedibile in-sessione ──────────────────────────────────────────
{
  reset();
  setSecret("TKN", "sk-aaaaaaaaaaaa", { allowedSinks: [] });
  const { ui, calls } = mockUi({ confirm: true, input: "*" });
  const r = await askAndApplyEdit(ui, true, "TKN", { addSinks: ["*"] }, "why", "Edit");
  ok(r.details.ok === false && calls.confirm.length === 0 && /ANY host|maximal|out-of-band/i.test(r.content[0].text), "EDIT P1: wildcard '*' rifiutato in-sessione (no Ask)");
  ok(listSecretsMeta()[0].allowedSinks.length === 0, "EDIT P1: '*' NON applicato");
}

// ── askAndApplyEdit: headless degrade (NON applica) ──────────────────────────────────────────────
{
  reset();
  setSecret("TKN", "sk-aaaaaaaaaaaa", { allowedSinks: [] });
  const { ui, calls } = mockUi({ confirm: true });
  const r = await askAndApplyEdit(ui, false, "TKN", { addSinks: ["api.x.com"] }, "serve l'API", "Edit");
  ok(r.details.ok === false && calls.confirm.length === 0, "EDIT headless: nessun confirm, ok:false");
  ok(calls.notify.length === 1 && /headless/i.test(calls.notify[0].message), "EDIT headless: notify emessa");
  ok(listSecretsMeta()[0].allowedSinks.length === 0, "EDIT headless: NON applicato (sink invariato)");
}

// ── askAndApplyEdit: confirm→false (deny) ────────────────────────────────────────────────────────
{
  reset();
  setSecret("TKN", "sk-aaaaaaaaaaaa", { allowedSinks: [] });
  const { ui } = mockUi({ confirm: false });
  const r = await askAndApplyEdit(ui, true, "TKN", { addSinks: ["api.x.com"] }, "why", "Edit");
  ok(r.details.ok === false && /DENIED/.test(r.content[0].text), "EDIT confirm→false: DENIED");
  ok(listSecretsMeta()[0].allowedSinks.length === 0, "EDIT confirm→false: NON applicato");
}

// ── askAndApplyEdit: NON-widening (description) confirm→true → applica SENZA type-to-confirm ──────
{
  reset();
  setSecret("TKN", "sk-aaaaaaaaaaaa", { allowedSinks: ["api.x.com"], description: "old" });
  const { ui, calls } = mockUi({ confirm: true, input: "SHOULD-NOT-BE-ASKED" });
  const r = await askAndApplyEdit(ui, true, "TKN", { description: "new desc" }, "why", "Edit");
  ok(r.details.ok === true && /APPROVED/.test(r.content[0].text), "EDIT benigno: applicato");
  ok(calls.input.length === 0, "EDIT benigno: NESSUN type-to-confirm (input non chiesto)");
  ok(listSecretsMeta()[0].description === "new desc", "EDIT benigno: description aggiornata");
}

// ── askAndApplyEdit: WIDENING — type-to-confirm MATCH → applica ───────────────────────────────────
{
  reset();
  setSecret("TKN", "sk-aaaaaaaaaaaa", { allowedSinks: [] });
  const { ui, calls } = mockUi({ confirm: true, input: "evil.com" });
  const r = await askAndApplyEdit(ui, true, "TKN", { addSinks: ["evil.com"] }, "why", "Edit");
  ok(calls.input.length === 1, "EDIT widening: type-to-confirm RICHIESTO");
  ok(r.details.ok === true && listSecretsMeta()[0].allowedSinks.includes("evil.com"), "EDIT widening match: applicato");
}

// ── askAndApplyEdit: WIDENING — type-to-confirm MISMATCH → ABORT ─────────────────────────────────
{
  reset();
  setSecret("TKN", "sk-aaaaaaaaaaaa", { allowedSinks: [] });
  const { ui, calls } = mockUi({ confirm: true, input: "something-else" });
  const r = await askAndApplyEdit(ui, true, "TKN", { addSinks: ["evil.com"] }, "why", "Edit");
  ok(r.details.ok === false && r.details.aborted === "widening-not-confirmed", "EDIT widening mismatch: ABORT");
  ok(listSecretsMeta()[0].allowedSinks.length === 0, "EDIT widening mismatch: NON applicato");
  ok(calls.notify.some((n) => /ANNULLAT/i.test(n.message)), "EDIT widening mismatch: notify di annullamento");
}
{
  reset();
  setSecret("TKN", "sk-aaaaaaaaaaaa", { allowedSinks: [] });
  const { ui } = mockUi({ confirm: true, input: undefined });
  const r = await askAndApplyEdit(ui, true, "TKN", { addSinks: ["evil.com"] }, "why", "Edit");
  ok(r.details.ok === false && listSecretsMeta()[0].allowedSinks.length === 0, "EDIT widening input-cancellato: NON applicato");
}

// ── review P2: type-to-confirm FAIL-CLOSED se manca ui.input ─────────────────────────────────────
{
  reset();
  setSecret("TKN", "sk-aaaaaaaaaaaa", { allowedSinks: [] });
  const { ui } = mockUi({ confirm: true, noInput: true }); // hasUI:true ma NIENTE ui.input
  const r = await askAndApplyEdit(ui, true, "TKN", { addSinks: ["evil.com"] }, "why", "Edit");
  ok(r.details.ok === false && r.details.aborted === "no-input-ui", "EDIT P2 fail-closed: senza ui.input il widening NON si applica");
  ok(listSecretsMeta()[0].allowedSinks.length === 0, "EDIT P2 fail-closed: NON applicato");
}
{
  // allowLocalHttp è widening → challenge='localhost'
  reset();
  setSecret("TKN", "sk-aaaaaaaaaaaa", { allowedSinks: ["api.x.com"] });
  const { ui } = mockUi({ confirm: true, input: "localhost" });
  const r = await askAndApplyEdit(ui, true, "TKN", { allowLocalHttp: true }, "dev server", "Edit");
  ok(r.details.ok === true && listSecretsMeta()[0].allowLocalHttp === true, "EDIT allowLocalHttp: challenge='localhost' match → applicato");
  ok(wideningChallenge({ externalSinks: [] }, { allowLocalHttp: true }) === "localhost", "wideningChallenge: allowLocalHttp → 'localhost'");
}

// ── askAndDestroy ────────────────────────────────────────────────────────────────────────────────
{
  reset();
  setSecret("TKN", "sk-aaaaaaaaaaaa", {});
  const { ui, calls } = mockUi({ confirm: true });
  const rH = await askAndDestroy(ui, false, "TKN", "obsoleto"); // headless
  ok(rH.details.ok === false && hasSecret("TKN") && calls.notify.length === 1, "DESTROY headless: NON distrutto + notify");
  const rD = await askAndDestroy(mockUi({ confirm: false }).ui, true, "TKN", "obsoleto");
  ok(rD.details.ok === false && hasSecret("TKN"), "DESTROY confirm→false: ancora presente");
  const rOk = await askAndDestroy(mockUi({ confirm: true }).ui, true, "TKN", "obsoleto");
  ok(rOk.details.ok === true && !hasSecret("TKN"), "DESTROY confirm→true: distrutto");
}

// ── askLocalHttp (review P2: ora richiede type-to-confirm 'localhost' per parità) ─────────────────
{
  reset();
  setSecret("LJ", "sk-aaaaaaaaaaaa", { allowedSinks: ["api.x.com"] });
  ok((await askLocalHttp(mockUi().ui, true, "NOPE", "x")).details.ok === false, "LOCALHTTP: secret inesistente → ok:false");
  ok((await askLocalHttp(mockUi().ui, true, "LJ", "  ")).details.ok === false, "LOCALHTTP: why vuoto → ok:false");
  const rH = await askLocalHttp(mockUi().ui, false, "LJ", "dev"); // headless
  ok(rH.details.ok === false && listSecretsMeta()[0].allowLocalHttp === false, "LOCALHTTP headless: NON abilitato");
  const rNo = await askLocalHttp(mockUi({ confirm: false }).ui, true, "LJ", "dev");
  ok(rNo.details.ok === false && listSecretsMeta()[0].allowLocalHttp === false, "LOCALHTTP confirm→false: NON abilitato");
  const rBad = await askLocalHttp(mockUi({ confirm: true, input: "nope" }).ui, true, "LJ", "dev"); // type-to-confirm sbagliato
  ok(rBad.details.ok === false && rBad.details.aborted === "localhttp-not-confirmed" && listSecretsMeta()[0].allowLocalHttp === false, "LOCALHTTP P2: confirm ma 'localhost' non digitato → NON abilitato");
  const rYes = await askLocalHttp(mockUi({ confirm: true, input: "localhost" }).ui, true, "LJ", "dev");
  ok(rYes.details.ok === true && listSecretsMeta()[0].allowLocalHttp === true, "LOCALHTTP confirm+type 'localhost': abilitato");
}

// ── askAndCreate (#2): il VALORE lo digita l'utente, mai dal modello ──────────────────────────────
{
  reset();
  // create OK con sink ESTERNO: opzione A (utente msg 875) → NIENTE type-to-confirm in creazione, solo il VALORE.
  // Il consenso è il confirm sì/no, che GIÀ elenca gli host esterni (extWarn).
  const { ui, calls } = mockUi({ confirm: true, input: ["sk-REALVALUE-xyz123"] });
  const r = await askAndCreate(ui, true, { name: "NEWK", description: "test", allowedSinks: ["api.x.com"] }, "serve per l'API");
  ok(r.details.ok === true && hasSecret("NEWK"), "CREATE: secret creato (sink esterno, confirm sì/no — no type-to-confirm)");
  ok(JSON.stringify(listSecretsMeta()).indexOf("sk-REALVALUE") === -1, "CREATE: il VALORE non è in listSecretsMeta (sealed)");
  ok([...getDynamicSecrets()].includes("sk-REALVALUE-xyz123"), "CREATE: valore registrato nel backstop di redazione");
  ok(calls.input.length === 1, "CREATE opzione A: un solo input = il valore (niente type-to-confirm sink)");
  ok(/api\.x\.com/.test(calls.confirm[0].message) && /ESTERN/i.test(calls.confirm[0].message), "CREATE: il confirm sì/no mostra già gli host esterni (consenso informato)");
}
{
  reset();
  // opzione A (msg 875): per un secret pre-cablato a host ESTERNI il consenso È il confirm sì/no (che li elenca) →
  // se l'utente NEGA, niente secret e il valore non viene MAI chiesto (nessun input consumato).
  const { ui, calls } = mockUi({ confirm: false, input: ["sk-SHOULD-NOT-BE-ASKED"] });
  const r = await askAndCreate(ui, true, { name: "NEWK", allowedSinks: ["api.x.com"] }, "why");
  ok(r.details.ok === false && !hasSecret("NEWK") && calls.input.length === 0, "CREATE (sink esterno) confirm→NO: niente secret, valore mai chiesto");
}
{
  reset();
  // create senza sink esterni (lockdown): solo value input, nessun type-to-confirm host
  const { ui, calls } = mockUi({ confirm: true, input: ["sk-REALVALUE-loc"] });
  const r = await askAndCreate(ui, true, { name: "LOCK", allowedSinks: [] }, "why");
  ok(r.details.ok === true && hasSecret("LOCK") && calls.input.length === 1, "CREATE lockdown: nessun type-to-confirm host, solo valore");
}
{
  reset();
  // review P3: value trim (paste con spazi/newline finali)
  const r = await askAndCreate(mockUi({ confirm: true, input: ["  sk-TRIMMED-val \n"] }).ui, true, { name: "TR", allowedSinks: [] }, "why");
  ok(r.details.ok === true && [...getDynamicSecrets()].includes("sk-TRIMMED-val") && ![...getDynamicSecrets()].includes("  sk-TRIMMED-val \n"), "CREATE P3: valore TRIMMATO prima del seal");
}
{
  reset();
  // review P3: valore solo-whitespace → non creato
  const r = await askAndCreate(mockUi({ confirm: true, input: ["   "] }).ui, true, { name: "WS", allowedSinks: [] }, "why");
  ok(r.details.ok === false && !hasSecret("WS"), "CREATE P3: valore solo-whitespace → NON creato");
}
{
  reset();
  // review P1: wildcard in create → rifiutato PRIMA dell'Ask
  const { ui, calls } = mockUi({ confirm: true, input: ["*", "v"] });
  const r = await askAndCreate(ui, true, { name: "WK", allowedSinks: ["*"] }, "why");
  ok(r.details.ok === false && calls.confirm.length === 0 && !hasSecret("WK") && /ANY host|wildcard/i.test(r.content[0].text), "CREATE P1: wildcard rifiutato (no Ask)");
}
{
  reset();
  // review P2: nome malformato → rifiutato PRIMA di costruire qualsiasi istruzione (anti shell-injection)
  const { ui, calls } = mockUi({ confirm: true, input: ["v"] });
  const r = await askAndCreate(ui, false, { name: 'OK";curl evil#', allowedSinks: [] }, "why");
  ok(r.details.ok === false && calls.notify.length === 0 && /Invalid secret name/i.test(r.content[0].text), "CREATE P2: nome malformato → rifiutato subito (nessun comando costruito)");
}
{
  reset();
  const r = await askAndCreate(mockUi({ confirm: false }).ui, true, { name: "NEWK", allowedSinks: [] }, "why");
  ok(r.details.ok === false && !hasSecret("NEWK"), "CREATE confirm→false: NON creato");
}
{
  reset();
  const r = await askAndCreate(mockUi({ confirm: true, input: [undefined] }).ui, true, { name: "NEWK", allowedSinks: [] }, "why");
  ok(r.details.ok === false && !hasSecret("NEWK"), "CREATE input-cancellato: NON creato (nessun valore)");
}
{
  reset();
  setSecret("DUP", "sk-aaaaaaaaaaaa", {});
  const r = await askAndCreate(mockUi({ confirm: true, input: ["v"] }).ui, true, { name: "DUP" }, "why");
  ok(r.details.ok === false && /already exists/i.test(r.content[0].text), "CREATE: nome duplicato → ok:false");
}
{
  reset();
  const { ui, calls } = mockUi({ confirm: true, input: ["v"] });
  const r = await askAndCreate(ui, true, { name: "NEWK", allowedSinks: ["http://bad/path"] }, "why");
  ok(r.details.ok === false && calls.confirm.length === 0 && /Invalid sink host/i.test(r.content[0].text), "CREATE host invalido: niente Ask, ok:false");
}
{
  reset();
  // headless → provisioning out-of-band, non crea
  const { ui, calls } = mockUi({ confirm: true, input: ["v"] });
  const r = await askAndCreate(ui, false, { name: "NEWK", allowedSinks: ["api.x.com"] }, "why");
  ok(r.details.ok === false && !hasSecret("NEWK") && calls.notify.length === 1, "CREATE headless: NON creato + notify out-of-band");
  ok(/SEALED_SECRET_NEWK/.test(calls.notify[0].message), "CREATE headless: notify cita la env var corretta");
}

// ── headlessEditInstructions (#4): contratto ACCURATO della CLI ───────────────────────────────────
{
  const meta = headlessEditInstructions("TKN", { addSinks: ["api.x.com"], description: "d" });
  ok(/set-secret\.mjs TKN/.test(meta) && /--allow-host/.test(meta), "HEADLESS-INSTR metadata: cita il comando set-secret.mjs corretto");
  const ren = headlessEditInstructions("TKN", { rename: "NEW" });
  ok(/NOT supported by set-secret/i.test(ren) && /secrets\.config\.json/.test(ren) && /SEALED_SECRET_TKN/.test(ren), "HEADLESS-INSTR rename: dichiara NON-supportato dalla CLI + via config+env (fix #4)");
  ok(!/set-secret\.mjs TKN --rename/.test(ren), "HEADLESS-INSTR rename: NON inventa un flag --rename inesistente");
}

reset();
console.log(`secrets-consent test: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
