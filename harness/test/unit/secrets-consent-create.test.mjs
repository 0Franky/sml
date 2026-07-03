/**
 * secrets-consent-create — PROVA che il flusso "crea sealed-secret via Ask" È FUNZIONANTE (msg 796).
 *
 * L'utente ha osservato che, chiedendo di aggiungere un secret reddit, l'Ask non si apriva mai. Questo test
 * dimostra che il CODICE del flusso è corretto: dato un `ui` con confirm+input (come la TUI reale di pi, dove
 * ctx.hasUI===true e ctx.ui.confirm/input esistono — verificato in pi types.d.ts), askAndCreate:
 *   - apre il dialog di CONFERMA (naming/sink/motivo),
 *   - chiede all'utente di DIGITARE il valore (il modello non lo vede mai),
 *   - crea il secret sigillato.
 * Copre anche: deny, headless (no UI → out-of-band), external-sink via confirm sì/no (opzione A msg 875 — no
 * type-to-confirm in creazione), nome invalido, wildcard.
 *
 * Corollario diagnostico (NON un difetto di questo codice): nel transcript il modello non CHIAMA propose_secret_create
 * → è un problema di routing/instruction-following del modello + troppi tool secret, tracciato in wiki/todo.md.
 */
import { askAndCreate } from "../../src/secrets-consent.mjs";
import { hasSecret, removeSecret } from "../../src/sealed-secrets.mjs";

let pass = 0, fail = 0;
function ok(cond, msg) { if (cond) { pass++; } else { fail++; console.error("  ✗ " + msg); } }

/** ui finto che REGISTRA le chiamate e risponde con risposte scriptate (coda). */
function fakeUI({ confirm = [], input = [] } = {}) {
  const calls = { confirm: [], input: [], notify: [] };
  const cq = [...confirm], iq = [...input];
  return {
    calls,
    ui: {
      async confirm(title, message) { calls.confirm.push({ title, message }); return cq.length ? cq.shift() : false; },
      async input(title, placeholder) { calls.input.push({ title, placeholder }); return iq.length ? iq.shift() : undefined; },
      notify(message, type) { calls.notify.push({ message, type }); },
    },
  };
}

async function run() {
  // 1) HAPPY PATH: hasUI + confirm=true + valore digitato → apre Ask, crea il secret sigillato.
  {
    const name = "TEST_CREATE_HAPPY_1";
    removeSecret(name);
    const { ui, calls } = fakeUI({ confirm: [true], input: ["s3cr3t-value-xyz"] });
    const r = await askAndCreate(ui, true, { name, description: "reddit key", why: "call reddit api" }, "call reddit api");
    ok(calls.confirm.length === 1, "happy: confirm (Ask) aperto una volta");
    ok(calls.input.length === 1, "happy: input del valore richiesto una volta");
    ok(r?.details?.ok === true, "happy: result ok=true");
    ok(hasSecret(name), "happy: il secret è stato creato (sigillato)");
    removeSecret(name);
  }

  // 2) DENY: l'utente rifiuta la conferma → NIENTE input del valore, NIENTE creazione.
  {
    const name = "TEST_CREATE_DENY_1";
    removeSecret(name);
    const { ui, calls } = fakeUI({ confirm: [false] });
    const r = await askAndCreate(ui, true, { name, why: "x" }, "x");
    ok(calls.confirm.length === 1, "deny: confirm aperto");
    ok(calls.input.length === 0, "deny: NESSUN input del valore dopo il rifiuto");
    ok(r?.details?.ok === false, "deny: result ok=false");
    ok(!hasSecret(name), "deny: nessun secret creato");
    removeSecret(name);
  }

  // 3) HEADLESS (hasUI=false): nessun Ask possibile → istruzione out-of-band, ok=false, niente creazione.
  {
    const name = "TEST_CREATE_HEADLESS_1";
    removeSecret(name);
    const { ui, calls } = fakeUI();
    const r = await askAndCreate(ui, false, { name, why: "x" }, "x");
    ok(calls.confirm.length === 0 && calls.input.length === 0, "headless: nessun dialog aperto");
    ok(r?.details?.ok === false, "headless: ok=false (degrada a out-of-band)");
    ok(/out-of-band|SEALED_SECRET_/.test(r?.content?.[0]?.text ?? ""), "headless: istruzione out-of-band presente");
    ok(!hasSecret(name), "headless: nessun secret creato in-process");
    removeSecret(name);
  }

  // 4) EXTERNAL-SINK: opzione A (utente msg 875) → in CREAZIONE il consenso è il confirm sì/no (che elenca gli host
  //    esterni); NIENTE type-to-confirm ridondante. La frizione type-to-confirm resta solo per il WIDENING di secret esistenti.
  {
    const name = "TEST_CREATE_SINK_1";
    removeSecret(name);
    // confirm=true, poi SOLO il valore (nessun type-to-confirm del sink).
    const { ui, calls } = fakeUI({ confirm: [true], input: ["tok"] });
    const r = await askAndCreate(ui, true, { name, allowedSinks: ["oauth.reddit.com"], why: "x" }, "x");
    ok(calls.input.length === 1, "sink: un solo input = il valore (opzione A, no type-to-confirm)");
    ok(r?.details?.ok === true && hasSecret(name), "sink: creato col solo confirm sì/no");
    ok(/oauth\.reddit\.com/.test(calls.confirm[0]?.message ?? ""), "sink: il confirm elenca l'host esterno (consenso informato)");
    removeSecret(name);

    // confirm=NO → niente secret, valore mai chiesto (il confirm sì/no È il gate della creazione a sink esterni).
    const name2 = "TEST_CREATE_SINK_2";
    removeSecret(name2);
    const { ui: ui2, calls: c2 } = fakeUI({ confirm: [false], input: ["should-not-ask"] });
    const r2 = await askAndCreate(ui2, true, { name: name2, allowedSinks: ["oauth.reddit.com"], why: "x" }, "x");
    ok(c2.input.length === 0, "sink-deny: valore mai chiesto dopo il rifiuto");
    ok(r2?.details?.ok === false && !hasSecret(name2), "sink-deny: abort, nessuna creazione");
    removeSecret(name2);
  }

  // 5) NOME INVALIDO: rifiutato PRIMA di qualsiasi Ask (anti shell-injection nel ramo headless).
  {
    const { ui, calls } = fakeUI({ confirm: [true], input: ["v"] });
    const r = await askAndCreate(ui, true, { name: "bad name!;rm -rf", why: "x" }, "x");
    ok(calls.confirm.length === 0, "nome-invalido: nessun Ask aperto");
    ok(r?.details?.ok === false, "nome-invalido: ok=false");
  }

  // 6) WILDCARD '*' nei sink: rifiutato in-sessione (max widening non concedibile con 1 tasto).
  {
    const name = "TEST_CREATE_WILDCARD_1";
    removeSecret(name);
    const { ui, calls } = fakeUI({ confirm: [true], input: ["v"] });
    const r = await askAndCreate(ui, true, { name, allowedSinks: ["*"], why: "x" }, "x");
    ok(calls.confirm.length === 0, "wildcard: nessun Ask (rifiutato prima)");
    ok(r?.details?.ok === false && !hasSecret(name), "wildcard: nessuna creazione");
    removeSecret(name);
  }

  console.log(`\nsecrets-consent-create: ${pass} pass, ${fail} fail`);
  process.exit(fail ? 1 : 0);
}
run().catch((e) => { console.error(e); process.exit(1); });
