/**
 * Test secrets-consent (node-puro): orchestrazione del CONSENSO sui sealed-secrets con un `ui` MOCKATO.
 * Copre i rami che i unit-test sealed-secrets (logica pura) non toccano: headless-degrade, confirm→false (deny),
 * confirm→true (apply), frizione REALE widening (type-to-confirm match/mismatch), create con valore digitato dall'utente,
 * e i messaggi headless ACCURATI (differito #4: la CLI set-secret NON fa rename/destroy).
 */
import { askAndApplyEdit, askAndDestroy, askLocalHttp, askAndCreate, wideningChallenge, headlessEditInstructions } from "../../src/secrets-consent.mjs";
import { setSecret, hasSecret, listSecretsMeta, clearSealed } from "../../src/sealed-secrets.mjs";
import { clearSecrets, getDynamicSecrets } from "../../src/secrets-registry.mjs";

let passed = 0, failed = 0;
function ok(cond, msg) { if (cond) { passed++; } else { failed++; console.error("  ✗ FAIL:", msg); } }
const reset = () => { clearSealed(); clearSecrets(); };

/** ui MOCK: registra le chiamate e risponde con valori scriptati (boolean/string o funzione). */
function mockUi({ confirm = false, input = undefined } = {}) {
  const calls = { confirm: [], input: [], notify: [] };
  const ui = {
    async confirm(title, message) { calls.confirm.push({ title, message }); return typeof confirm === "function" ? confirm(title, message) : confirm; },
    async input(title, placeholder) { calls.input.push({ title, placeholder }); return typeof input === "function" ? input(title, placeholder) : input; },
    notify(message, type) { calls.notify.push({ message, type }); },
  };
  return { ui, calls };
}

// ── askAndApplyEdit: guard di base ───────────────────────────────────────────────────────────────
{
  reset();
  const { ui } = mockUi({ confirm: true });
  const r = await askAndApplyEdit(ui, true, "NOPE", { addSinks: ["x.com"] }, "why", "Edit");
  ok(r.details.ok === false && /does not exist/.test(r.content[0].text), "EDIT: secret inesistente → ok:false");
}
{
  reset();
  setSecret("TKN", "sk-aaaaaaaaaaaa", { allowedSinks: ["api.x.com"] });
  const { ui, calls } = mockUi({ confirm: true });
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

// ── askAndApplyEdit: headless degrade (NON applica) ──────────────────────────────────────────────
{
  reset();
  setSecret("TKN", "sk-aaaaaaaaaaaa", { allowedSinks: [] });
  const { ui, calls } = mockUi({ confirm: true });
  const r = await askAndApplyEdit(ui, false, "TKN", { addSinks: ["api.x.com"] }, "serve l'API", "Edit"); // hasUI:false
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
  const { ui, calls } = mockUi({ confirm: true, input: "evil.com" }); // digita esattamente l'host
  const r = await askAndApplyEdit(ui, true, "TKN", { addSinks: ["evil.com"] }, "why", "Edit");
  ok(calls.input.length === 1, "EDIT widening: type-to-confirm RICHIESTO");
  ok(r.details.ok === true && listSecretsMeta()[0].allowedSinks.includes("evil.com"), "EDIT widening match: applicato");
}

// ── askAndApplyEdit: WIDENING — type-to-confirm MISMATCH → ABORT (non applica) ────────────────────
{
  reset();
  setSecret("TKN", "sk-aaaaaaaaaaaa", { allowedSinks: [] });
  const { ui, calls } = mockUi({ confirm: true, input: "something-else" }); // digita SBAGLIATO
  const r = await askAndApplyEdit(ui, true, "TKN", { addSinks: ["evil.com"] }, "why", "Edit");
  ok(r.details.ok === false && r.details.aborted === "widening-not-confirmed", "EDIT widening mismatch: ABORT");
  ok(listSecretsMeta()[0].allowedSinks.length === 0, "EDIT widening mismatch: NON applicato");
  ok(calls.notify.some((n) => /ANNULLAT/i.test(n.message)), "EDIT widening mismatch: notify di annullamento");
}
{
  reset();
  setSecret("TKN", "sk-aaaaaaaaaaaa", { allowedSinks: [] });
  const { ui } = mockUi({ confirm: true, input: undefined }); // utente ANNULLA il dialog input
  const r = await askAndApplyEdit(ui, true, "TKN", { addSinks: ["evil.com"] }, "why", "Edit");
  ok(r.details.ok === false && listSecretsMeta()[0].allowedSinks.length === 0, "EDIT widening input-cancellato: NON applicato");
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

// ── askLocalHttp ─────────────────────────────────────────────────────────────────────────────────
{
  reset();
  setSecret("LJ", "sk-aaaaaaaaaaaa", { allowedSinks: ["api.x.com"] });
  ok((await askLocalHttp(mockUi().ui, true, "NOPE", "x")).details.ok === false, "LOCALHTTP: secret inesistente → ok:false");
  ok((await askLocalHttp(mockUi().ui, true, "LJ", "  ")).details.ok === false, "LOCALHTTP: why vuoto → ok:false");
  const rH = await askLocalHttp(mockUi().ui, false, "LJ", "dev"); // headless
  ok(rH.details.ok === false && listSecretsMeta()[0].allowLocalHttp === false, "LOCALHTTP headless: NON abilitato");
  const rNo = await askLocalHttp(mockUi({ confirm: false }).ui, true, "LJ", "dev");
  ok(rNo.details.ok === false && listSecretsMeta()[0].allowLocalHttp === false, "LOCALHTTP confirm→false: NON abilitato");
  const rYes = await askLocalHttp(mockUi({ confirm: true }).ui, true, "LJ", "dev");
  ok(rYes.details.ok === true && listSecretsMeta()[0].allowLocalHttp === true, "LOCALHTTP confirm→true: abilitato");
}

// ── askAndCreate (#2): il VALORE lo digita l'utente, mai dal modello ──────────────────────────────
{
  reset();
  // create OK: confirm→true + input=valore
  const { ui, calls } = mockUi({ confirm: true, input: "sk-REALVALUE-xyz123" });
  const r = await askAndCreate(ui, true, { name: "NEWK", description: "test", allowedSinks: ["api.x.com"] }, "serve per l'API");
  ok(r.details.ok === true && hasSecret("NEWK"), "CREATE: secret creato");
  ok(JSON.stringify(listSecretsMeta()).indexOf("sk-REALVALUE") === -1, "CREATE: il VALORE non è in listSecretsMeta (sealed)");
  ok([...getDynamicSecrets()].includes("sk-REALVALUE-xyz123"), "CREATE: valore registrato nel backstop di redazione");
  ok(calls.confirm.length === 1 && calls.input.length === 1, "CREATE: confirm + input chiesti");
}
{
  reset();
  // create rifiutato: confirm→false
  const r = await askAndCreate(mockUi({ confirm: false }).ui, true, { name: "NEWK", allowedSinks: [] }, "why");
  ok(r.details.ok === false && !hasSecret("NEWK"), "CREATE confirm→false: NON creato");
}
{
  reset();
  // create annullato: confirm→true ma input vuoto/annullato
  const r = await askAndCreate(mockUi({ confirm: true, input: undefined }).ui, true, { name: "NEWK", allowedSinks: [] }, "why");
  ok(r.details.ok === false && !hasSecret("NEWK"), "CREATE input-cancellato: NON creato (nessun valore)");
}
{
  reset();
  // nome già esistente
  setSecret("DUP", "sk-aaaaaaaaaaaa", {});
  const r = await askAndCreate(mockUi({ confirm: true, input: "v" }).ui, true, { name: "DUP" }, "why");
  ok(r.details.ok === false && /already exists/i.test(r.content[0].text), "CREATE: nome duplicato → ok:false");
}
{
  reset();
  // host invalido → rifiuto PRIMA dell'Ask
  const { ui, calls } = mockUi({ confirm: true, input: "v" });
  const r = await askAndCreate(ui, true, { name: "NEWK", allowedSinks: ["http://bad/path"] }, "why");
  ok(r.details.ok === false && calls.confirm.length === 0 && /Invalid sink host/i.test(r.content[0].text), "CREATE host invalido: niente Ask, ok:false");
}
{
  reset();
  // headless → provisioning out-of-band, non crea
  const { ui, calls } = mockUi({ confirm: true, input: "v" });
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
