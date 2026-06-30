/**
 * secrets-consent — orchestrazione node-pure del CONSENSO per le operazioni sui sealed-secrets.
 *
 * ESTRATTO da `.pi/extensions/secrets-guardrail.ts` (il progetto NON ha jiti → una `.ts` non è caricabile dai test
 * node; questa logica, che prima viveva nel tool `execute`, qui diventa testabile con un `ui` finto). Dipende SOLO da:
 *   - un'interfaccia `ui` minimale: { confirm(title,msg)→Promise<boolean>, input(title,placeholder?)→Promise<string|undefined>, notify(msg,type)→void }
 *   - un flag `hasUI` (true in TUI/RPC; false in print/json headless)
 *   - il core sealed-secrets (validazione/diff/apply): nessun import di pi.
 *
 * INVARIANTE: il modello non muta MAI un secret da sé. Ogni mutazione passa da un Ask con DIFF chiaro, e l'ampliamento
 * dei permessi (widening) richiede una **frizione REALE** (type-to-confirm) — non basta premere Invio (anti rubber-stamp).
 * Gemello di `request_local_http`. Design: ../../wiki/concepts/sealed-secrets.md §4ter/§4quater. Idea utente msg 708-724.
 *
 * Ogni funzione ritorna la SHAPE di un tool-result pi: { content: [{type:"text",text}], details: {...} } — così il
 * wrapper `.ts` si limita a passare `ctx.ui`/`ctx.hasUI` e a restituire l'oggetto.
 */
import { computeSecretEditDiff, applySecretEdit, removeSecret, setSecret, hasSecret, isValidSinkHost, isLoopbackLiteral } from "./sealed-secrets.mjs";

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

/**
 * askAndApplyEdit — consenso ESPLICITO (mai auto) per una proposta di edit. Calcola il diff, mostra un Ask con il diff
 * prima→dopo; se il diff è AMPLIANTE (widening) impone una **frizione reale** (type-to-confirm: l'utente DIGITA l'host
 * concesso, altrimenti abort). Solo allora applica via applySecretEdit (ATOMICO). Headless → degrada a notify con
 * istruzioni out-of-band ACCURATE per operazione (differito #4). Usato da request_sink e propose_secret_edit.
 */
export async function askAndApplyEdit(ui, hasUI, name, changes, why, titleVerb) {
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
    const ok = await ui.confirm(
      `${titleVerb} '${name}'?`,
      `${header}\n\nMotivo dichiarato dal modello: ${why}\n\nDIFF (prima → dopo):\n${renderEditDiff(diff)}${localHttpDisclosure}\n\n${diff.anyWidening ? "⚠ " : ""}Confermi?`,
    );
    if (!ok) return result(`User DENIED the edit of '${name}'. Nothing changed.`, { ok: false });
    // FRIZIONE REALE (differito #3): per un widening il solo confirm() è rubber-stampable → richiedi il type-to-confirm.
    // L'utente deve DIGITARE l'host che sta concedendo: conferma di aver LETTO dove andrà il segreto, non un Invio cieco.
    if (diff.anyWidening && typeof ui.input === "function") {
      const challenge = wideningChallenge(diff, changes);
      if (challenge) {
        const typed = await ui.input(
          `Conferma ampliamento di '${name}'`,
          `digita ESATTAMENTE: ${challenge}`,
        );
        if (typed == null || normChallenge(typed) !== normChallenge(challenge)) {
          notify(ui, `Ampliamento di '${name}' ANNULLATO (conferma digitata non combaciante). Nessuna modifica.`, "warning");
          return result(`User did NOT type the exact confirmation ('${challenge}') for the widening of '${name}'. ABORTED — nothing changed. Re-propose only if the user really wants to widen.`, { ok: false, aborted: "widening-not-confirmed" });
        }
      }
    }
    const r = applySecretEdit(name, changes);
    if (!r.ok) return result(`Edit failed: ${r.reason}. Nothing was changed (atomic).`, { ok: false });
    notify(ui, `secret '${name}' aggiornato: ${(r.applied || []).join(", ")}${r.name !== name ? ` (ora '${r.name}')` : ""}`, "info");
    return result(`User APPROVED. Applied to '${r.name}': ${(r.applied || []).join(", ")}. Use {{secret:${r.name}}} now.`, { ok: true, applied: r.applied, name: r.name });
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
      // applySecretEdit garantisce atomicità/validazione; allowLocalHttp:true è un widening ma qui il consenso è il
      // confirm dedicato di questo tool (il dialog disclosa già lo scope) → non si impone un secondo type-to-confirm.
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
  if (hasSecret(name)) return result(`A secret named '${name}' already exists. Use propose_secret_edit to change it (no re-creation).`, { ok: false });
  const reason = typeof why === "string" ? why.trim() : "";
  if (!reason) return result(`Provide a non-empty 'why'.`, { ok: false });
  // valida gli host proposti PRIMA dell'Ask (niente conferma sprecata su input invalido)
  const sinksRaw = Array.isArray(proposal?.allowedSinks) ? proposal.allowedSinks.map((h) => String(h).toLowerCase().trim()).filter(Boolean) : [];
  const badHost = sinksRaw.find((h) => !isValidSinkHost(h));
  if (badHost) return result(`Invalid sink host '${badHost}' (use a domain/IP/'*' — no scheme/path/port).`, { ok: false });
  const allowedSinks = [...new Set(sinksRaw)];
  const externalSinks = allowedSinks.filter((h) => h === "*" || !isLoopbackLiteral(h));
  const description = clean(proposal?.description ?? "");
  const allowLocalHttp = proposal?.allowLocalHttp === true;

  if (hasUI && ui && typeof ui.confirm === "function" && typeof ui.input === "function") {
    const extWarn = externalSinks.length ? `\n⚠ allowedSinks ESTERNI: ${externalSinks.join(", ")} → una volta inserito, il valore potrà raggiungere subito questi host.` : "";
    const sinkLine = allowedSinks.length ? allowedSinks.join(", ") : "(none — in strict il secret resta in lockdown finché non concedi un sink)";
    const ok = await ui.confirm(
      `Creare il secret '${name}'?`,
      `Il modello propone di CREARE un sealed-secret (NON ne vede né riceve il valore):\n` +
      `· nome: ${name}\n· descrizione: ${description || "(none)"}\n· allowedSinks: ${sinkLine}\n· allowLocalHttp: ${allowLocalHttp}\n\n` +
      `Motivo dichiarato dal modello: ${reason}${extWarn}\n\n` +
      `Se confermi, ti chiederò di DIGITARE TU il valore (resta sigillato: il modello e il provider LLM non lo vedono mai, ed è redatto dai transcript). Procedere?`,
    );
    if (!ok) return result(`User DENIED creation of '${name}'. Nothing was created.`, { ok: false });
    const value = await ui.input(
      `Valore per il secret '${name}'`,
      `incolla il valore reale (resta sigillato; il modello non lo vede)`,
    );
    if (value == null || String(value).length < 1) {
      notify(ui, `Creazione del secret '${name}' annullata (nessun valore inserito).`, "warning");
      return result(`No value was entered: secret '${name}' was NOT created. Re-propose if still needed.`, { ok: false });
    }
    const set = setSecret(name, String(value), { description, allowedSinks, allowLocalHttp });
    if (!set.ok) return result(`Could not create '${name}': ${set.reason}. Nothing was created.`, { ok: false });
    notify(ui, `secret '${name}' creato${allowedSinks.length ? ` (sinks: ${allowedSinks.join(", ")})` : " (nessun sink: lockdown finché non ne concedi uno)"}.`, "info");
    const warnTxt = set.warn ? ` Note: ${set.warn}.` : "";
    return result(`User APPROVED and entered a value. Secret '${name}' created — the value is sealed (you will never see it). Use {{secret:${name}}} now.${allowedSinks.length ? "" : " It has NO allowedSinks yet: in strict mode it is in lockdown until you request a sink."}${warnTxt}`, { ok: true, name });
  }
  // Headless: il valore non può essere inserito interattivamente → provisioning out-of-band.
  notify(ui, `Il modello propone di creare il secret '${name}' (${reason}) ma manca l'UI interattiva (headless). Provisionalo TU out-of-band: \`node scripts/set-secret.mjs ${name}${allowedSinks.length ? ` --allow-host "${allowedSinks.join(",")}"` : ""}${description ? ` --desc "${description}"` : ""}${allowLocalHttp ? " --allow-local-http" : ""}\`, poi metti SEALED_SECRET_${name}=<valore> in harness/.env e riavvia pi.`, "warning");
  return result(`No interactive UI (headless): secret '${name}' was NOT created. Provision it out-of-band: set metadata via \`node scripts/set-secret.mjs ${name}${allowedSinks.length ? ` --allow-host "${allowedSinks.join(",")}"` : ""}\`, put SEALED_SECRET_${name}=<value> in harness/.env, then restart pi.`, { ok: false });
}

export default { renderEditDiff, wideningChallenge, headlessEditInstructions, askAndApplyEdit, askAndDestroy, askLocalHttp, askAndCreate };
