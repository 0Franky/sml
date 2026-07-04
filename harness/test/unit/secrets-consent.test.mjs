/**
 * Test secrets-consent (node-puro): orchestrazione del CONSENSO sui sealed-secrets con un `ui` MOCKATO.
 * Copre i rami che i unit-test sealed-secrets (logica pura) non toccano: headless-degrade, confirm→false (deny),
 * confirm→true (apply), frizione REALE widening (type-to-confirm match/mismatch + fail-CLOSED), wildcard-reject,
 * create con valore digitato dall'utente (+ type-to-confirm sink esterni + trim), parità askLocalHttp,
 * e i messaggi headless ACCURATI (differito #4). Include gli hardening della review 2026-07-03 (P1/P2/P3).
 */
import { askAndApplyEdit, askAndDestroy, askLocalHttp, askAndCreate, wideningChallenge, isSuspiciousHost, headlessEditInstructions } from "../../src/secrets-consent.mjs";
import { setSecret, hasSecret, listSecretsMeta, clearSealed } from "../../src/sealed-secrets.mjs";
import { clearSecrets, getDynamicSecrets } from "../../src/secrets-registry.mjs";

let passed = 0, failed = 0;
function ok(cond, msg) { if (cond) { passed++; } else { failed++; console.error("  ✗ FAIL:", msg); } }
const reset = () => { clearSealed(); clearSecrets(); };

/** ui MOCK: `input`/`select` possono essere scalari (stessi per ogni call), FUNZIONE (title,…), o ARRAY (coda, shift).
 * `select` è presente SOLO se passato (undefined → ui senza select → si testa il fallback confirm). */
function mockUi({ confirm = false, input = undefined, select = undefined, noInput = false } = {}) {
  const calls = { confirm: [], input: [], notify: [], select: [] };
  let idx = 0, sidx = 0;
  const ui = {
    async confirm(title, message) { calls.confirm.push({ title, message }); return typeof confirm === "function" ? confirm(title, message) : confirm; },
    notify(message, type) { calls.notify.push({ message, type }); },
  };
  if (select !== undefined) {
    ui.select = async (title, options) => {
      calls.select.push({ title, options });
      if (typeof select === "function") return select(title, options);
      if (Array.isArray(select)) return select[sidx++];
      return select;
    };
  }
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

// ── WIDENING non-sospetto: sì INFORMATO applica SENZA ri-digitare (msg 954/955) ───────────────────
{
  reset();
  setSecret("TKN", "sk-aaaaaaaaaaaa", { allowedSinks: [] });
  const { ui, calls } = mockUi({ select: "Sì, applica" });
  const r = await askAndApplyEdit(ui, true, "TKN", { addSinks: ["evil.com"] }, "why", "Edit");
  ok(r.details.ok === true && listSecretsMeta()[0].allowedSinks.includes("evil.com"), "WIDENING non-sospetto: select 'Sì' → applicato");
  ok(calls.input.length === 0, "WIDENING non-sospetto: NESSUNA ri-digitazione (input non chiesto)");
  ok(calls.select.length === 1, "WIDENING: usato il selettore 3-vie nativo");
}
// ── WIDENING: 'No, annulla' → DENIED ──
{
  reset();
  setSecret("TKN", "sk-aaaaaaaaaaaa", { allowedSinks: [] });
  const { ui } = mockUi({ select: "No, annulla" });
  const r = await askAndApplyEdit(ui, true, "TKN", { addSinks: ["evil.com"] }, "why", "Edit");
  ok(r.details.ok === false && /DENIED/.test(r.content[0].text) && listSecretsMeta()[0].allowedSinks.length === 0, "WIDENING 'No': DENIED, non applicato");
}
// ── WIDENING: 'Modifica i sink' → l'utente restringe la lista (CONTROLLO, non ostacolo) ──
{
  reset();
  setSecret("TKN", "sk-aaaaaaaaaaaa", { allowedSinks: [] });
  const { ui, calls } = mockUi({ select: "Modifica i sink", input: "api.x.com" });
  const r = await askAndApplyEdit(ui, true, "TKN", { addSinks: ["evil.com", "api.x.com"] }, "why", "Edit");
  ok(r.details.ok === true, "WIDENING 'Modifica': applicato");
  ok(listSecretsMeta()[0].allowedSinks.includes("api.x.com") && !listSecretsMeta()[0].allowedSinks.includes("evil.com"), "WIDENING 'Modifica': tiene solo l'host voluto (evil.com scartato)");
  ok(calls.input.length === 1, "WIDENING 'Modifica': un input per editare la lista");
}
// ── WIDENING: 'Modifica' lasciato VUOTO → annullato ──
{
  reset();
  setSecret("TKN", "sk-aaaaaaaaaaaa", { allowedSinks: [] });
  const { ui } = mockUi({ select: "Modifica i sink", input: "" });
  const r = await askAndApplyEdit(ui, true, "TKN", { addSinks: ["evil.com"] }, "why", "Edit");
  ok(r.details.ok === false && r.details.aborted === "edit-empty" && listSecretsMeta()[0].allowedSinks.length === 0, "WIDENING 'Modifica' vuoto → annullato, non applicato");
}
// ── WIDENING: 'Modifica' con host INVALIDO → rifiutato ──
{
  reset();
  setSecret("TKN", "sk-aaaaaaaaaaaa", { allowedSinks: [] });
  const { ui } = mockUi({ select: "Modifica i sink", input: "http://bad/path" });
  const r = await askAndApplyEdit(ui, true, "TKN", { addSinks: ["evil.com"] }, "why", "Edit");
  ok(r.details.ok === false && r.details.aborted === "edit-invalid" && listSecretsMeta()[0].allowedSinks.length === 0, "WIDENING 'Modifica' host invalido → rifiutato");
}
// ── WIDENING SOSPETTO (typo di host fidato): escalation type-to-confirm — MATCH → applica ──
{
  reset();
  setSecret("TKN", "sk-aaaaaaaaaaaa", { allowedSinks: ["github.com"] });
  const { ui, calls } = mockUi({ select: "Sì, applica", input: "gihub.com" });
  const r = await askAndApplyEdit(ui, true, "TKN", { addSinks: ["gihub.com"] }, "why", "Edit");
  ok(calls.input.length === 1, "WIDENING sospetto: escalation type-to-confirm RICHIESTA");
  ok(r.details.ok === true && listSecretsMeta()[0].allowedSinks.includes("gihub.com"), "WIDENING sospetto + type match → applicato");
}
// ── WIDENING SOSPETTO: MISMATCH → ABORT ──
{
  reset();
  setSecret("TKN", "sk-aaaaaaaaaaaa", { allowedSinks: ["github.com"] });
  const { ui, calls } = mockUi({ select: "Sì, applica", input: "wrong" });
  const r = await askAndApplyEdit(ui, true, "TKN", { addSinks: ["gihub.com"] }, "why", "Edit");
  ok(r.details.ok === false && r.details.aborted === "suspicious-not-confirmed", "WIDENING sospetto mismatch: ABORT");
  ok(!listSecretsMeta().find((s) => s.name === "TKN").allowedSinks.includes("gihub.com"), "WIDENING sospetto mismatch: NON applicato");
  ok(calls.notify.some((n) => /ANNULLAT/i.test(n.message)), "WIDENING sospetto mismatch: notify annullamento");
}
// ── WIDENING SOSPETTO (brand builtin incastonato non-tail), senza known ──
{
  reset();
  setSecret("TKN", "sk-aaaaaaaaaaaa", { allowedSinks: [] });
  const { ui, calls } = mockUi({ select: "Sì, applica", input: "nomatch" });
  const r = await askAndApplyEdit(ui, true, "TKN", { addSinks: ["api.github.com.evil.com"] }, "why", "Edit");
  ok(calls.input.length === 1 && r.details.ok === false && r.details.aborted === "suspicious-not-confirmed", "WIDENING brand-incastonato → sospetto → escalation");
}
// ── WIDENING SOSPETTO: FAIL-CLOSED senza ui.input ──
{
  reset();
  setSecret("TKN", "sk-aaaaaaaaaaaa", { allowedSinks: ["github.com"] });
  const { ui } = mockUi({ select: "Sì, applica", noInput: true });
  const r = await askAndApplyEdit(ui, true, "TKN", { addSinks: ["gihub.com"] }, "why", "Edit");
  ok(r.details.ok === false && r.details.aborted === "no-input-ui", "WIDENING sospetto senza ui.input → FAIL-CLOSED");
  ok(!listSecretsMeta().find((s) => s.name === "TKN").allowedSinks.includes("gihub.com"), "WIDENING sospetto fail-closed: NON applicato");
}
// ── WIDENING fallback SENZA ui.select (UI vecchia): confirm sì → applica senza retype (non-sospetto) ──
{
  reset();
  setSecret("TKN", "sk-aaaaaaaaaaaa", { allowedSinks: [] });
  const { ui, calls } = mockUi({ confirm: true }); // niente select
  const r = await askAndApplyEdit(ui, true, "TKN", { addSinks: ["evil.com"] }, "why", "Edit");
  ok(r.details.ok === true && calls.confirm.length === 1 && calls.input.length === 0, "WIDENING fallback (no select): confirm sì → applicato senza retype");
}
// ── allowLocalHttp via propose_secret_edit: widening senza host → applica su 'Sì' senza retype ──
{
  reset();
  setSecret("TKN", "sk-aaaaaaaaaaaa", { allowedSinks: ["api.x.com"] });
  const { ui, calls } = mockUi({ select: "Sì, applica" });
  const r = await askAndApplyEdit(ui, true, "TKN", { allowLocalHttp: true }, "dev server", "Edit");
  ok(r.details.ok === true && listSecretsMeta()[0].allowLocalHttp === true, "EDIT allowLocalHttp: 'Sì' → applicato senza type-to-confirm");
  ok(calls.input.length === 0, "EDIT allowLocalHttp: nessuna ri-digitazione");
  ok(wideningChallenge({ externalSinks: [] }, { allowLocalHttp: true }) === "localhost", "wideningChallenge: allowLocalHttp → 'localhost' (pura, ancora esportata)");
}

// ── isSuspiciousHost: rilevatore typosquat/homograph (deterministico) ──
ok(isSuspiciousHost("api.x.com", []).suspicious === false, "susp: host normale → no");
ok(isSuspiciousHost("api.github.com.evil.com", []).suspicious === true, "susp: brand builtin incastonato non-tail → sì");
ok(isSuspiciousHost("xn--pple-43d.com", []).suspicious === true, "susp: IDN/punycode → sì");
ok(isSuspiciousHost("gihub.com", ["github.com"]).suspicious === true, "susp: typo di host fidato → sì");
ok(isSuspiciousHost("github.com", ["github.com"]).suspicious === false, "susp: host fidato identico → no");
ok(isSuspiciousHost("api.github.com", []).suspicious === false, "susp: sotto-dominio legittimo (tail) → no");
ok(isSuspiciousHost("localhost", ["github.com"]).suspicious === false, "susp: loopback → no");
ok(isSuspiciousHost("totallydifferent.io", ["github.com"]).suspicious === false, "susp: host nuovo non simile → no");

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

// ── askLocalHttp (msg 954: rito 'digita localhost' rimosso — il confirm sì/no informato È il consenso) ──
{
  reset();
  setSecret("LJ", "sk-aaaaaaaaaaaa", { allowedSinks: ["api.x.com"] });
  ok((await askLocalHttp(mockUi().ui, true, "NOPE", "x")).details.ok === false, "LOCALHTTP: secret inesistente → ok:false");
  ok((await askLocalHttp(mockUi().ui, true, "LJ", "  ")).details.ok === false, "LOCALHTTP: why vuoto → ok:false");
  const rH = await askLocalHttp(mockUi().ui, false, "LJ", "dev"); // headless
  ok(rH.details.ok === false && listSecretsMeta()[0].allowLocalHttp === false, "LOCALHTTP headless: NON abilitato");
  const rNo = await askLocalHttp(mockUi({ confirm: false }).ui, true, "LJ", "dev");
  ok(rNo.details.ok === false && listSecretsMeta()[0].allowLocalHttp === false, "LOCALHTTP confirm→false: NON abilitato");
  const { ui, calls } = mockUi({ confirm: true });
  const rYes = await askLocalHttp(ui, true, "LJ", "dev");
  ok(rYes.details.ok === true && listSecretsMeta()[0].allowLocalHttp === true, "LOCALHTTP confirm→true: abilitato SENZA type-to-confirm");
  ok(calls.input.length === 0, "LOCALHTTP: nessun 'digita localhost' (rito rimosso, msg 954)");
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
