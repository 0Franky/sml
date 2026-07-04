/**
 * secrets-consent — orchestrazione node-pure del CONSENSO per le operazioni sui sealed-secrets.
 *
 * ESTRATTO da `.pi/extensions/secrets-guardrail.ts` (il progetto NON ha jiti → una `.ts` non è caricabile dai test
 * node; questa logica, che prima viveva nel tool `execute`, qui diventa testabile con un `ui` finto). Dipende SOLO da:
 *   - un'interfaccia `ui` minimale: { confirm(title,msg)→Promise<boolean>, input(title,placeholder?)→Promise<string|undefined>, notify(msg,type)→void }
 *   - un flag `hasUI` (true in TUI/RPC; false in print/json headless)
 *   - il core sealed-secrets (validazione/diff/apply): nessun import di pi.
 *
 * INVARIANTE: il modello non muta MAI un secret da sé. Ogni mutazione passa da un Ask con DIFF chiaro. Per un WIDENING
 * la scelta è **sì / modifica / annulla** (msg 954/955): il sì INFORMATO è il consenso (niente ri-digitazione), "modifica"
 * dà CONTROLLO sulla lista sink, e la frizione type-to-confirm resta SOLO come escalation sugli host SOSPETTI (isSuspiciousHost).
 * Gemello di `request_local_http`. Design: ../../wiki/concepts/sealed-secrets.md §4ter/§4quater. Idea utente msg 708-724.
 *
 * Ogni funzione ritorna la SHAPE di un tool-result pi: { content: [{type:"text",text}], details: {...} } — così il
 * wrapper `.ts` si limita a passare `ctx.ui`/`ctx.hasUI` e a restituire l'oggetto.
 */
import { computeSecretEditDiff, applySecretEdit, removeSecret, setSecret, hasSecret, isValidSinkHost, isLoopbackLiteral, renameSecret, addAllowedSink, listSinkHosts } from "./sealed-secrets.mjs";

/** Sanitizza un valore per la VISUALIZZAZIONE nel dialog (anti UI-redress): strip newline/control-char + glifi-marker
 * (⚠/·/✗) così un campo controllato dal modello non può forgiare righe-diff o mascherare la riga del widening. */
function clean(v) {
  return String(v ?? "").replace(/[\r\n\t\f\v\0]/g, " ").replace(/[⚠·✗]/g, "");
}

/** Rende il DIFF come testo VISIVAMENTE CHIARO per l'Ask. Marker: ⚠ widening · ✗ invalido · · benigno. */
export function renderEditDiff(diff) {
  return (diff.changes || [])
    .map((c) => `${c.widening ? "⚠" : c.invalid ? "✗" : "·"} ${clean(c.field)}: ${clean(c.before)}  →  ${clean(c.after)}${c.note ? `  [${clean(c.note)}]` : ""}`)
    .join("\n");
}

/** NAME_RE (allineato a sealed-secrets): valida un nome-secret PRIMA di usarlo in QUALSIASI stringa/istruzione
 * (nel ramo headless il nome finisce in un comando che l'utente incolla → un nome malformato = shell-injection). */
const NAME_RE = /^[A-Za-z0-9_.\-]{1,64}$/;

/** Un cambiamento propone il sink wildcard '*'? Il '*' = QUALSIASI host = massimo widening → NON concedibile
 * in-sessione dal modello (la frizione-di-1-carattere degenererebbe in rubber-stamp, review P1). Solo out-of-band. */
function proposesWildcard(hosts) {
  return Array.isArray(hosts) && hosts.some((h) => String(h ?? "").trim() === "*");
}

/** Tool-result helper (shape pi). */
function result(text, details) {
  return { content: [{ type: "text", text }], details };
}

/** notify difensivo (l'`ui` headless potrebbe non avere notify). */
function notify(ui, msg, type) {
  if (ui && typeof ui.notify === "function") ui.notify(msg, type);
}

/**
 * Stringa-CHALLENGE per la frizione type-to-confirm di un widening: ciò che l'utente deve DIGITARE per confermare.
 * Priorità al rischio REALE: host esterno(i) > loopback aggiunto > 'localhost' (per allowLocalHttp). Normalizzata
 * (lowercase, spazi collassati) per il confronto. Ritorna "" se non c'è nulla di ampliante da sfidare.
 */
export function wideningChallenge(diff, changes) {
  const ext = (diff && diff.externalSinks) || [];
  if (ext.length) return ext.map((h) => String(h).toLowerCase().trim()).join(", ");
  if (changes && changes.allowLocalHttp === true) return "localhost";
  if (changes && Array.isArray(changes.addSinks) && changes.addSinks.length) {
    return changes.addSinks.map((h) => String(h).toLowerCase().trim()).filter(Boolean).join(", ");
  }
  return "";
}

/** Normalizza per il confronto del type-to-confirm (lowercase, trim, collassa spazi attorno alle virgole/whitespace). */
function normChallenge(s) {
  return String(s ?? "").toLowerCase().trim().replace(/\s*,\s*/g, ", ").replace(/\s+/g, " ");
}

/** Host "sensibili" comuni: un nuovo sink che li contiene come sotto-dominio NON-tail (api.openai.com.evil.com) è
 * sospetto. Lista NON esaustiva — solo un aiuto anti sosia/typosquat, non una allow/deny-list. */
const BUILTIN_SENSITIVE_HOSTS = [
  "github.com", "api.github.com", "gitlab.com", "api.openai.com", "api.anthropic.com", "googleapis.com",
  "amazonaws.com", "api.stripe.com", "slack.com", "hooks.slack.com", "discord.com", "api.telegram.org", "api.twilio.com",
];

/** Distanza di Levenshtein cappata (oltre `cap` → cap+1). Piccola, per il rilevamento typo. */
function levenshtein(a, b, cap = 2) {
  a = String(a); b = String(b);
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > cap) return cap + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      if (cur[j] < best) best = cur[j];
    }
    if (best > cap) return cap + 1;
    prev = cur;
  }
  return prev[b.length];
}

/**
 * isSuspiciousHost — euristica DETERMINISTICA anti sosia/typosquat per un host che si sta per concedere. Segnala
 * (NON blocca: alza solo la frizione, escalation type-to-confirm) quando: (1) IDN/punycode `xn--` (homograph);
 * (2) contiene un host noto/fidato come sotto-dominio ma NON vi termina (`api.openai.com.evil.com`); (3) è a distanza
 * ≤2 da un host GIÀ FIDATO dall'utente (`gihub.com` per `github.com`). `knownHosts` = i sink già fidati (listSinkHosts).
 * @returns {{ suspicious: boolean, reason?: string }}
 */
export function isSuspiciousHost(host, knownHosts = []) {
  const h = String(host ?? "").toLowerCase().trim();
  if (!h || h === "*" || isLoopbackLiteral(h)) return { suspicious: false };
  if (/(^|\.)xn--/.test(h)) return { suspicious: true, reason: "dominio IDN/punycode (xn--): rischio homograph" };
  const known = knownHosts.map((k) => String(k ?? "").toLowerCase().trim()).filter(Boolean);
  // (2) brand noto/fidato incastonato ma NON in coda → il dominio REALE è un altro.
  for (const k of [...BUILTIN_SENSITIVE_HOSTS, ...known]) {
    if (!k || k === h) continue;
    if ((h.startsWith(k + ".") || h.includes("." + k + ".")) && !h.endsWith("." + k)) {
      return { suspicious: true, reason: `contiene '${k}' come sotto-dominio ma il dominio reale è diverso` };
    }
  }
  // (3) typo di un host GIÀ FIDATO (solo i known dell'utente, non i builtin → niente falsi-positivi su host nuovi legittimi).
  for (const k of known) {
    if (k === h) continue;
    const d = levenshtein(h, k, 2);
    if (d >= 1 && d <= 2) return { suspicious: true, reason: `molto simile a '${k}' già fidato (possibile typo)` };
  }
  return { suspicious: false };
}

/**
 * Istruzioni OUT-OF-BAND ACCURATE per un edit in headless (FIX differito #4): `scripts/set-secret.mjs` gestisce SOLO
 * metadata (desc/allow-host/redact-egress/allow-local-http). NON sa fare rename né destroy → non promettiamo che possa.
 * Ritorna la riga di guida giusta in base ai `changes` richiesti.
 */
export function headlessEditInstructions(name, changes) {
  const parts = [];
  const flags = [];
  if (Array.isArray(changes.addSinks) && changes.addSinks.length) {
    flags.push(`--allow-host "${changes.addSinks.map((h) => String(h).toLowerCase().trim()).filter(Boolean).join(",")}"`);
  }
  if (typeof changes.description === "string") flags.push(`--desc "${clean(changes.description)}"`);
  if (changes.allowLocalHttp === true) flags.push("--allow-local-http");
  if (changes.allowLocalHttp === false) flags.push("--no-allow-local-http");
  if (flags.length) {
    // NB --allow-host SOSTITUISCE l'intera lista nel config → in headless va passata la lista FINALE voluta, non solo il delta.
    parts.push(`metadata: \`node scripts/set-secret.mjs ${name} ${flags.join(" ")}\` (NB: --allow-host replaces the whole sink list — pass the FINAL list), then restart pi.`);
  }
  if (Array.isArray(changes.removeSinks) && changes.removeSinks.length) {
    parts.push(`removing a sink: edit .pi/secrets.config.json (the "allowedSinks" array of "${name}") and restart pi (the CLI --allow-host only ADDS/replaces).`);
  }
  if (typeof changes.rename === "string" && changes.rename) {
    // rename NON è supportato dalla CLI: chiave-config + nome-env-var.
    parts.push(`rename → ${changes.rename}: NOT supported by set-secret.mjs. Rename the key in .pi/secrets.config.json AND the env var SEALED_SECRET_${name} → SEALED_SECRET_${changes.rename}, then restart pi. (An in-session-only secret like INGRESS_N is not persisted there and cannot be renamed headless.)`);
  }
  return parts.length ? parts.join("\n") : `edit .pi/secrets.config.json for '${name}' and restart pi.`;
}

/** applica l'edit + ritorna il tool-result (ramo comune sì-informato / edit / escalation-superata). */
function applyAndReturn(ui, name, changes) {
  const r = applySecretEdit(name, changes);
  if (!r.ok) return result(`Edit failed: ${r.reason}. Nothing was changed (atomic).`, { ok: false });
  notify(ui, `secret '${name}' aggiornato: ${(r.applied || []).join(", ")}${r.name !== name ? ` (ora '${r.name}')` : ""}`, "info");
  return result(`User APPROVED. Applied to '${r.name}': ${(r.applied || []).join(", ")}. Use {{secret:${r.name}}} now.`, { ok: true, applied: r.applied, name: r.name });
}

/**
 * chooseWideningAction — scelta sì/modifica/annulla per un widening (msg 954/955: "al più sì/no/edit"). Usa il
 * selettore 3-vie NATIVO di pi (`ui.select`) se presente (diff nel titolo); altrimenti degrada a `ui.confirm` sì/no
 * (senza select non c'è "modifica" → sì=apply, no=deny). Ritorna "apply" | "edit" | "deny".
 */
async function chooseWideningAction(ui, title, body) {
  const APPLY = "Sì, applica", EDIT = "Modifica i sink", DENY = "No, annulla";
  if (typeof ui.select === "function") {
    const pick = await ui.select(`${title}\n\n${body}`, [APPLY, EDIT, DENY]);
    if (pick === APPLY) return "apply";
    if (pick === EDIT) return "edit";
    return "deny"; // DENY o annullato (undefined)
  }
  const ok = await ui.confirm(title, `${body}\n\nOK = applica · Annulla = rifiuta`);
  return ok ? "apply" : "deny";
}

/**
 * editSinksAndApply — ramo "modifica": l'utente RISCRIVE la lista di host da concedere (VUOTO = annulla). La lista che
 * DIGITA è consenso esplicito → si applica (control, non ostacolo). Notifica se resta qualcosa di sospetto (l'ha scelto lui).
 */
async function editSinksAndApply(ui, name, changes, known) {
  if (typeof ui.input !== "function") {
    return result(`Editing the sink list for '${name}' needs an interactive input, unavailable here. NOT applied.`, { ok: false, aborted: "no-input-ui" });
  }
  const prefill = (changes.addSinks || []).map((h) => String(h).toLowerCase().trim()).filter(Boolean).join(", ");
  const edited = await ui.input(`Scegli quali host concedere a '${name}'`, `Elenca gli host da concedere, separati da virgola (togli quelli che NON vuoi). Invia per applicare · lascia VUOTO per annullare. Proposti: ${prefill}`);
  if (edited == null || !String(edited).trim()) {
    return result(`User chose to edit but left it empty — widening of '${name}' CANCELLED. Nothing changed.`, { ok: false, aborted: "edit-empty" });
  }
  const newHosts = String(edited).split(",").map((h) => h.toLowerCase().trim()).filter(Boolean);
  const editedChanges = { ...changes, addSinks: newHosts };
  const d2 = computeSecretEditDiff(name, editedChanges);
  if (d2.anyInvalid) {
    const bad = (d2.changes || []).filter((c) => c.invalid).map((c) => c.after).join("; ");
    return result(`Your edited sink list has invalid host(s): ${bad}. Nothing changed. Re-propose with valid hosts.`, { ok: false, aborted: "edit-invalid" });
  }
  if (!d2.changes || !d2.changes.length) {
    return result(`Your edited list adds nothing new to '${name}'. Nothing changed.`, { ok: false });
  }
  const stillSusp = newHosts.map((h) => ({ h, ...isSuspiciousHost(h, known) })).filter((x) => x.suspicious);
  const r = applySecretEdit(name, editedChanges);
  if (!r.ok) return result(`Edit failed: ${r.reason}. Nothing changed (atomic).`, { ok: false });
  if (stillSusp.length) notify(ui, `⚠ '${name}': concessi host che sembrano sosia/typosquat (${stillSusp.map((s) => s.h).join(", ")}) — li hai digitati tu.`, "warning");
  notify(ui, `secret '${name}' aggiornato: ${(r.applied || []).join(", ")}`, "info");
  return result(`User APPROVED (edited). Applied to '${name}': ${(r.applied || []).join(", ")}. Use {{secret:${name}}} now.`, { ok: true, applied: r.applied, name });
}

/**
 * askAndApplyEdit — consenso ESPLICITO (mai auto) per una proposta di edit. Calcola il diff, mostra un Ask col diff
 * prima→dopo. Benigno → confirm sì/no. WIDENING → scelta **sì / modifica / annulla** (msg 954/955): il sì INFORMATO
 * (il dialog mostra già host+⚠+diff) È il consenso, niente ri-digitazione ridondante; "modifica" dà CONTROLLO sulla
 * lista sink; la frizione type-to-confirm resta SOLO come escalation su host SOSPETTI (sosia/typosquat, isSuspiciousHost).
 * Applica via applySecretEdit (ATOMICO). Headless → notify con istruzioni out-of-band ACCURATE. Usato da request_sink/propose_secret_edit.
 */
export async function askAndApplyEdit(ui, hasUI, name, changes, why, titleVerb) {
  // review P1: il wildcard '*' (QUALSIASI host) NON è concedibile in-sessione (frizione-1-char = rubber-stamp) → out-of-band.
  if (proposesWildcard(changes && changes.addSinks)) {
    return result(`Cannot grant '*' (ANY host) to '${name}' in-session — that is the maximal widening. If truly needed, the user sets it out-of-band: 'node scripts/set-secret.mjs ${name} --allow-host "*"'. Otherwise request a CONCRETE host.`, { ok: false });
  }
  const diff = computeSecretEditDiff(name, changes);
  if (!diff.exists) return result(`Secret '${name}' does not exist.`, { ok: false });
  if (!diff.changes || !diff.changes.length) {
    return result(`No effective change for '${name}' (already in the requested state).`, { ok: false });
  }
  // review P1 drift: se un change non è appliabile (rename collisione/invalido, host invalido) NON mostriamo un Ask per
  // qualcosa che applySecretEdit rifiuterebbe → il modello lo corregge prima (niente conferma sprecata/parziale).
  if (diff.anyInvalid) {
    const bad = (diff.changes || []).filter((c) => c.invalid).map((c) => `${c.field}→${c.after} (${c.note})`).join("; ");
    return result(`Cannot apply — invalid change(s): ${bad}. Fix and retry; no confirmation was shown to the user.`, { ok: false });
  }
  const externalSinks = diff.externalSinks || [];
  const ext = externalSinks.length ? ` Host ESTERNO/i: ${externalSinks.join(", ")}.` : "";
  // disclosure per-CAMPO: se la modifica abilita allowLocalHttp, RIPETI qui la disclosure relay/per-sessione che vive in
  // request_local_http → parità di consenso a prescindere dal tool scelto dal modello.
  const enablesLocalHttp = (diff.changes || []).some((c) => c.field === "allowLocalHttp" && c.after === "true");
  const localHttpDisclosure = enablesLocalHttp
    ? `\n\n⚠ allowLocalHttp: il permesso vale per TUTTA QUESTA SESSIONE e per QUALSIASI servizio loopback (qualsiasi porta/path su localhost), non solo per questa operazione. Host esterni in http restano sempre bloccati. Un servizio locale compromesso potrebbe però inoltrare il token altrove.`
    : "";
  const header = diff.anyWidening
    ? `⚠ Questa modifica AMPLIA i permessi del secret '${name}'.${ext} Il valore reale potrà raggiungere nuove destinazioni.`
    : `Modifica del secret '${name}' (nessun ampliamento di permessi).`;

  if (hasUI && ui && typeof ui.confirm === "function") {
    // BENIGNO (nessun ampliamento di permessi): confirm sì/no.
    if (!diff.anyWidening) {
      const ok = await ui.confirm(
        `${titleVerb} '${name}'?`,
        `${header}\n\nMotivo dichiarato dal modello: ${why}\n\nDIFF (prima → dopo):\n${renderEditDiff(diff)}${localHttpDisclosure}\n\nConfermi?`,
      );
      if (!ok) return result(`User DENIED the edit of '${name}'. Nothing changed.`, { ok: false });
      return applyAndReturn(ui, name, changes);
    }
    // WIDENING → sì / modifica / annulla (msg 954/955). Il sì INFORMATO (dialog con host+⚠+diff) È il consenso: niente
    // ri-digitazione ridondante. La frizione type-to-confirm resta SOLO come escalation su host SOSPETTI (typosquat/homograph).
    const known = listSinkHosts();
    const flags = externalSinks.map((h) => ({ host: h, ...isSuspiciousHost(h, known) }));
    const suspicious = flags.filter((f) => f.suspicious);
    const sinkLines = flags.length
      ? "\n\nHost esterni da concedere:\n" + flags.map((f) => `  ${f.suspicious ? "⚠⚠ SOSPETTO" : "·"} ${clean(f.host)}${f.suspicious ? ` — ${clean(f.reason)}` : ""}`).join("\n")
      : "";
    const body = `${header}${sinkLines}\n\nMotivo dichiarato dal modello: ${why}\n\nDIFF (prima → dopo):\n${renderEditDiff(diff)}${localHttpDisclosure}`;
    const action = await chooseWideningAction(ui, `${titleVerb} '${name}'?`, body);
    if (action === "deny") return result(`User DENIED the widening of '${name}'. Nothing changed.`, { ok: false });
    if (action === "edit") return editSinksAndApply(ui, name, changes, known);
    // action === "apply": type-to-confirm SOLO se c'è un host sospetto (fail-CLOSED se manca ui.input, come prima).
    if (suspicious.length) {
      if (typeof ui.input !== "function") {
        return result(`Widening '${name}' includes a SUSPICIOUS host (${suspicious.map((s) => s.host).join(", ")}); confirming it needs an interactive dialog, unavailable here. NOT applied.`, { ok: false, aborted: "no-input-ui" });
      }
      const challenge = suspicious.map((s) => normChallenge(s.host)).join(", ");
      const typed = await ui.input(`⚠ Host sospetto — conferma per '${name}'`, `'${challenge}' sembra un imitatore (typosquat) di un host di cui ti fidi. Se lo VUOI davvero, riscrivi qui l'host per confermare; lascia VUOTO per annullare.`);
      if (typed == null || normChallenge(typed) !== normChallenge(challenge)) {
        notify(ui, `Ampliamento di '${name}' ANNULLATO (host sospetto non riconfermato). Nessuna modifica.`, "warning");
        return result(`User did NOT type the exact confirmation ('${challenge}') for the SUSPICIOUS host(s) in the widening of '${name}'. ABORTED — nothing changed.`, { ok: false, aborted: "suspicious-not-confirmed" });
      }
    }
    return applyAndReturn(ui, name, changes);
  }
  // Headless: istruzioni out-of-band ACCURATE per operazione (FIX #4: niente più 'usa set-secret.mjs' per rename/destroy).
  notify(ui, `Il modello propone una modifica al secret '${name}' (${why}) ma manca l'UI interattiva (headless). Applicala TU out-of-band, poi RIAVVIA pi:\n${headlessEditInstructions(name, changes)}`, "warning");
  return result(`No interactive UI (headless): the edit of '${name}' was NOT applied. Apply out-of-band and restart pi:\n${headlessEditInstructions(name, changes)}`, { ok: false });
}

/**
 * askAndDestroy — distruzione PREVIA Ask (mai auto). Headless → notify con istruzioni ACCURATE (la CLI set-secret NON
 * distrugge: si rimuove la voce dal config + la env var + restart). Usato da propose_secret_destroy.
 */
export async function askAndDestroy(ui, hasUI, name, why) {
  if (!hasSecret(name)) return result(`Secret '${name}' does not exist.`, { ok: false });
  if (hasUI && ui && typeof ui.confirm === "function") {
    const ok = await ui.confirm(
      `Distruggere il secret '${name}'?`,
      `Il modello propone di ELIMINARE il secret '${name}'.\nMotivo dichiarato: ${why}\n\n⚠ Operazione irreversibile in-sessione: il riferimento {{secret:${name}}} smetterà di funzionare. Confermi?`,
    );
    if (!ok) return result(`User DENIED destruction of '${name}'. It still exists.`, { ok: false });
    const r = removeSecret(name);
    if (!r.ok) return result(`Destruction failed: ${r.reason}`, { ok: false });
    notify(ui, `secret '${name}' eliminato.`, "info");
    return result(`User APPROVED. Secret '${name}' destroyed.`, { ok: true });
  }
  notify(ui, `Il modello propone di eliminare il secret '${name}' (${why}) ma manca l'UI interattiva (headless). La CLI set-secret.mjs NON distrugge: rimuovi la voce "${name}" da .pi/secrets.config.json e la env var SEALED_SECRET_${name}, poi riavvia pi. (Secret solo-in-sessione tipo INGRESS_N: termina/riavvia la sessione.)`, "warning");
  return result(`No interactive UI (headless): '${name}' was NOT destroyed. To destroy out-of-band: remove "${name}" from .pi/secrets.config.json and unset env SEALED_SECRET_${name}, then restart pi (in-session-only secrets vanish on restart).`, { ok: false });
}

/**
 * askLocalHttp — consenso per abilitare http→loopback su un secret (estratto da request_local_http). Disclosa lo scope
 * reale (sessione + qualsiasi servizio loopback). Headless → notify con il comando CLI corretto (--allow-local-http).
 */
export async function askLocalHttp(ui, hasUI, name, why) {
  if (!hasSecret(name)) {
    return result(`Secret '${name}' does not exist. Ask the user to provision it first (request_secret).`, { ok: false });
  }
  const reason = typeof why === "string" ? why.trim() : "";
  if (!reason) {
    return result(`Provide a non-empty 'why' (the user must see a reason before granting a loopback-http exception).`, { ok: false });
  }
  if (hasUI && ui && typeof ui.confirm === "function") {
    const ok = await ui.confirm(
      `Abilitare http-locale per il secret '${name}'?`,
      `Il modello chiede di poter usare {{secret:${name}}} su http verso loopback (localhost / 127.0.0.1).\n` +
      `Motivo dichiarato dal modello: ${reason}\n\n` +
      `⚠ Se acconsenti, il permesso vale per TUTTA QUESTA SESSIONE e per QUALSIASI servizio locale (qualsiasi porta/path su localhost), non solo per l'operazione descritta. Host ESTERNI in http restano sempre bloccati. Il valore resta sigillato (non lo vedi tu né il modello). Un servizio locale compromesso potrebbe però inoltrare il token altrove. Consenti?`,
    );
    if (ok) {
      // localhost è loopback FISSO → un type-to-confirm "digita localhost" sarebbe puro RITO (stringa costante, zero
      // valore anti-typosquat: msg 954). Il confirm sì/no INFORMATO (scope dichiarato sopra) È il consenso; qui NON si
      // concede alcun host esterno (gli host esterni in http restano sempre bloccati). Comodità E sicurezza, entrambe.
      const r = applySecretEdit(name, { allowLocalHttp: true });
      if (!r.ok) return result(`Failed to enable allowLocalHttp: ${r.reason}.`, { ok: false });
      return result(`User APPROVED: '${name}' may now be used over http toward loopback only (localhost/127.0.0.1), for this session. External hosts remain https-only. Use it in a SINGLE clean command (no ';'/'|'/'&&'/redirects), else it stays blocked.`, { ok: true });
    }
    return result(`User DENIED local-http for '${name}'. Use https; a non-loopback http target is not allowed.`, { ok: false });
  }
  notify(ui, `Il modello chiede allowLocalHttp per '${name}' (${reason}). Abilitalo TU out-of-band: node scripts/set-secret.mjs ${name} --allow-local-http (o aggiungi "allowLocalHttp": true in .pi/secrets.config.json), poi RIAVVIA pi (la config si rilegge al boot). Headless: non posso chiederti conferma interattiva.`, "warning");
  return result(`No interactive UI available (headless): cannot enable allowLocalHttp for '${name}' in-session. The user must set it out-of-band (CLI/config) AND restart pi (config is read at boot) — a same-session retry will NOT pick it up. It is NOT enabled now.`, { ok: false });
}

/**
 * askAndCreate — creazione di un secret NUOVO (differito #2, design §4ter punto 6). Il modello PROPONE solo i METADATA
 * (name/description/allowedSinks/allowLocalHttp); il VALORE lo DIGITA l'utente via ui.input() → USER→harness, il valore
 * non passa MAI dal modello/context. Headless → degrada a notify (provisioning out-of-band env + config + restart).
 *
 * @param {object} proposal { name, description?, allowedSinks?:string[], allowLocalHttp?:boolean }
 */
export async function askAndCreate(ui, hasUI, proposal, why) {
  const name = String(proposal?.name ?? "").trim();
  if (!name) return result(`Provide a non-empty secret name.`, { ok: false });
  // review P2: valida NAME_RE PRIMA di costruire QUALSIASI istruzione (il nome finisce in un comando nel ramo headless
  // che l'utente incolla → un nome malformato = shell-injection verso l'utente). Rifiuta subito.
  if (!NAME_RE.test(name)) return result(`Invalid secret name '${name}' (use [A-Za-z0-9_.-], max 64).`, { ok: false });
  if (hasSecret(name)) return result(`A secret named '${name}' already exists. Use propose_secret_edit to change it (no re-creation).`, { ok: false });
  const reason = typeof why === "string" ? why.trim() : "";
  if (!reason) return result(`Provide a non-empty 'why'.`, { ok: false });
  // valida gli host proposti PRIMA dell'Ask (niente conferma sprecata su input invalido)
  const sinksRaw = Array.isArray(proposal?.allowedSinks) ? proposal.allowedSinks.map((h) => String(h).toLowerCase().trim()).filter(Boolean) : [];
  // review P1: niente wildcard in-sessione (come askAndApplyEdit) — il modello conosce sempre un host concreto.
  if (proposesWildcard(sinksRaw)) return result(`Cannot create '${name}' pre-wired to '*' (ANY host). Propose CONCRETE hosts; a wildcard must be set out-of-band.`, { ok: false });
  const badHost = sinksRaw.find((h) => !isValidSinkHost(h));
  if (badHost) return result(`Invalid sink host '${badHost}' (use a domain/IP — no scheme/path/port).`, { ok: false });
  const allowedSinks = [...new Set(sinksRaw)];
  const externalSinks = allowedSinks.filter((h) => !isLoopbackLiteral(h));
  const description = clean(proposal?.description ?? "");
  const allowLocalHttp = proposal?.allowLocalHttp === true;
  const redactEgress = proposal?.redactEgress !== false; // default true; false = opt-out per OTP/corti (evita rumore)

  if (hasUI && ui && typeof ui.confirm === "function" && typeof ui.input === "function") {
    const extWarn = externalSinks.length ? `\n⚠ allowedSinks ESTERNI: ${externalSinks.join(", ")} → una volta inserito, il valore potrà raggiungere subito questi host.` : "";
    const sinkLine = allowedSinks.length ? allowedSinks.join(", ") : "(none — in strict il secret resta in lockdown finché non concedi un sink)";
    const ok = await ui.confirm(
      `Creare il secret '${name}'?`,
      `Il modello propone di CREARE un sealed-secret (NON ne vede né riceve il valore):\n` +
      `· nome: ${name}\n· descrizione: ${description || "(none)"}\n· allowedSinks: ${sinkLine}\n· allowLocalHttp: ${allowLocalHttp}\n· redactEgress: ${redactEgress}\n\n` +
      `Motivo dichiarato dal modello: ${reason}${extWarn}\n\n` +
      `Se confermi, ti chiederò di DIGITARE TU il valore (resta sigillato: il modello e il provider LLM non lo vedono mai, ed è redatto dai transcript). Procedere?`,
    );
    if (!ok) return result(`User DENIED creation of '${name}'. Nothing was created.`, { ok: false });
    // DECISIONE utente msg 875 (opzione A — "comodità E sicurezza entrambe al top"): in CREAZIONE il consenso è il
    // confirm sì/no qui sopra, che GIÀ elenca gli allowedSinks e mostra ⚠ per gli host ESTERNI (extWarn), mentre l'utente
    // sta inserendo tutto a mano e consapevolmente (subito dopo digita il valore). Niente type-to-confirm ridondante qui.
    // La frizione anti rubber-stamp (type-to-confirm) resta SOLO per il WIDENING di un secret ESISTENTE
    // (askAndApplyEdit/askLocalHttp), dove il "sì" distratto su un secret già in uso è il rischio reale.
    const raw = await ui.input(`Valore per il secret '${name}'`, `incolla il valore reale (resta sigillato; il modello non lo vede)`);
    // review P3: trimma (un paste porta spesso newline/spazi finali → romperebbero la redazione-substring e l'injection).
    const value = raw == null ? "" : String(raw).replace(/^\s+|\s+$/g, "");
    if (value.length < 1) {
      notify(ui, `Creazione del secret '${name}' annullata (nessun valore valido inserito).`, "warning");
      return result(`No (non-whitespace) value was entered: secret '${name}' was NOT created. Re-propose if still needed.`, { ok: false });
    }
    const set = setSecret(name, value, { description, allowedSinks, allowLocalHttp, redactEgress });
    if (!set.ok) return result(`Could not create '${name}': ${set.reason}. Nothing was created.`, { ok: false });
    notify(ui, `secret '${name}' creato${allowedSinks.length ? ` (sinks: ${allowedSinks.join(", ")})` : " (nessun sink: lockdown finché non ne concedi uno)"}.`, "info");
    const warnTxt = set.warn ? ` Note: ${set.warn}.` : "";
    return result(`User APPROVED and entered a value. Secret '${name}' created — the value is sealed (you will never see it). Use {{secret:${name}}} now.${allowedSinks.length ? "" : " It has NO allowedSinks yet: in strict mode it is in lockdown until you request a sink."}${warnTxt}`, { ok: true, name });
  }
  // Headless: il valore non è inseribile interattivamente → provisioning out-of-band. name è NAME_RE-safe e i sink sono
  // isValidSinkHost-safe → interpolabili nel comando; la DESCRIZIONE (control-char strippati ma NON i metacaratteri shell)
  // NON va dentro il comando → si dà come nota separata da quotare a mano (review P2 shell-injection).
  const cmd = `node scripts/set-secret.mjs ${name}${allowedSinks.length ? ` --allow-host "${allowedSinks.join(",")}"` : ""}${allowLocalHttp ? " --allow-local-http" : ""}${redactEgress ? "" : " --no-redact-egress"}`;
  notify(ui, `Il modello propone di creare il secret '${name}' (${reason}) ma manca l'UI interattiva (headless). Provisionalo TU out-of-band:\n  1) ${cmd}\n  2) (descrizione opzionale) aggiungi --desc "…" con: ${description || "(nessuna)"}\n  3) metti SEALED_SECRET_${name}=<valore> in harness/.env\n  4) riavvia pi.`, "warning");
  return result(`No interactive UI (headless): secret '${name}' was NOT created. Provision out-of-band — run: ${cmd}  (add --desc "…" separately if needed), then put SEALED_SECRET_${name}=<value> in harness/.env and restart pi.`, { ok: false });
}

/**
 * promoteSealedIngress — Ask di PROMOZIONE per i valori auto-sigillati da regex-ingress (fix C, utente msg 796/797).
 *
 * regex-ingress sigilla un valore secret-shaped incollato in `INGRESS_N` (silenziosamente). Qui, in mode=`ask`+UI,
 * si dà all'utente un Ask DETERMINISTICO — indipendente dal modello flaky — per (a) RINOMINARE INGRESS_N in un nome
 * parlante (es. REDDIT_API_KEY) e (b) concedere subito gli host consentiti. È il "comodità E sicurezza entrambe al
 * top": la frizione di consenso scatta sull'evento di ingresso, non sul routing incerto del 9B.
 *
 * NON-throwing (l'hook `input` non deve MAI rompere l'input): ogni errore/skip lascia il secret come INGRESS_N sigillato
 * (fail-safe: il valore è comunque protetto). Ritorna la mappa dei rename così il chiamante aggiorna il testo
 * ({{secret:INGRESS_N}} → {{secret:NEWNAME}}).
 *
 * @param ui   { input(title,ph)→Promise<string|undefined>, notify(msg,type)→void }
 * @param hasUI boolean
 * @param names string[]  i nomi INGRESS_N appena sigillati (in ordine)
 * @returns {Promise<{renames: Record<string,string>, granted: Record<string,string[]>}>}
 */
export async function promoteSealedIngress(ui, hasUI, names) {
  const renames = {};
  const granted = {};
  if (!hasUI || !ui || typeof ui.input !== "function" || !Array.isArray(names)) return { renames, granted };
  for (const ingressName of names) {
    if (!hasSecret(ingressName)) continue; // già rimosso/rinominato altrove → skip
    let finalName = ingressName;
    try {
      // (a) RINOMINA opzionale. Vuoto/cancel = tieni INGRESS_N (nessuna perdita).
      const typedName = await ui.input(
        `Nome per il secret appena sigillato (${ingressName})?`,
        `es. REDDIT_API_KEY — vuoto/annulla = tieni ${ingressName}`,
      );
      const newName = typeof typedName === "string" ? typedName.trim() : "";
      if (newName && NAME_RE.test(newName) && !hasSecret(newName)) {
        const r = renameSecret(ingressName, newName);
        if (r.ok && r.renamed) { finalName = newName; renames[ingressName] = newName; }
      } else if (newName && !NAME_RE.test(newName)) {
        notify(ui, `Nome '${newName}' non valido (usa [A-Za-z0-9_.-], max 64) → tenuto ${ingressName}.`, "warning");
      } else if (newName && hasSecret(newName)) {
        notify(ui, `Esiste già un secret '${newName}' → tenuto ${ingressName}.`, "warning");
      }
      // (b) GRANT-SINK opzionale (host consentiti). Vuoto = nessun sink (lockdown finché non se ne concede uno).
      const typedHosts = await ui.input(
        `Host consentiti per '${finalName}'? (comma-separati)`,
        `es. oauth.reddit.com — vuoto = nessuno (il secret resta in lockdown)`,
      );
      const hosts = typeof typedHosts === "string"
        ? typedHosts.split(",").map((h) => h.toLowerCase().trim()).filter(Boolean)
        : [];
      const ok = [];
      const bad = [];
      for (const h of hosts) {
        if (!isValidSinkHost(h)) { bad.push(h); continue; }
        const g = addAllowedSink(finalName, h);
        if (g.ok && g.added) ok.push(h);
      }
      if (ok.length) granted[finalName] = ok;
      if (bad.length) notify(ui, `Host ignorati (formato non valido: dominio/IP, no scheme/path/port): ${bad.join(", ")}.`, "warning");
      notify(
        ui,
        `Secret '${finalName}'${finalName !== ingressName ? ` (era ${ingressName})` : ""} pronto${ok.length ? ` — può raggiungere: ${ok.join(", ")}` : " — nessun sink (lockdown finché non ne concedi uno)"}.`,
        "info",
      );
    } catch {
      /* fail-safe: in caso di errore, il secret resta come INGRESS_N sigillato (protetto) */
    }
  }
  return { renames, granted };
}

export default { renderEditDiff, wideningChallenge, isSuspiciousHost, headlessEditInstructions, askAndApplyEdit, askAndDestroy, askLocalHttp, askAndCreate, promoteSealedIngress };
