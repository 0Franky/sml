/**
 * eviction-checkpoint (NEW-A) — estensione DEDICATA: rete di sicurezza per i FATTI DUREVOLI che stanno per
 * uscire dalla finestra nativa (keepTurns=K). Quando un turno-utente supera il bordo visibile, spinge il modello
 * a SALVARLO (note/set_var) PRIMA che sparisca (caso "Lupo"). Logica pura in `src/eviction-checkpoint.mjs`.
 *
 * ATTIVAZIONE = env `HARNESS_EVICTION_CHECKPOINT` ∈ {off,nudge,inject,require}. **DEFAULT off**: la sola presenza
 * del file NON cambia il comportamento live (nessun hook registrato, nessun DB aperto) finché non abiliti un rung.
 * Packaging deciso con l'utente (msg 930.1): estensione dedicata (presenza = capability), rung via env/const.
 *
 * EFFIMERO "sparisce dalla storia" = MAI ENTRARCI (verdetto todo NEW-A 2026-07-04):
 *  - nudge/inject → la direttiva è appesa all'array uscente SOLO in questo request via hook `context`
 *    (non-persistito → effimero per costruzione, come native-window che toglie i vecchi msg senza cancellarli).
 *  - require → chiamata-modello DEDICATA out-of-band (Impl-2). ⚠ La risoluzione dell'endpoint dal config di pi
 *    è lo SPIKE LIVE residuo → finché non è wired, `require` degrada a `inject` con un warning una-tantum.
 *
 * anti-hack: qui c'è SOLO lo scaffold runtime (spinta a salvare), MAI un reward — il reward è strato-3,
 * ancorato all'OUTCOME (il fatto è ripescabile dopo?), non alla partecipazione. Vedi todo NEW-A + memory.
 *
 * RISOLTO 2026-07-04 (bug sessione 019f2ab9: non scattava MAI): conteggio-turni + digest ora dallo STORE autoritativo
 * (store.countUserTurns / userTurnsByOrdinal), NON da event.messages → indipendente dall'ordine-hook. native-window
 * gira nello stesso hook `context` e finestra l'array PRIMA: contare da lì dava sempre ≤ keepTurns → eviction nulla.
 *
 * ⚠ VALIDAZIONI LIVE residue (evidence-first): (1) trailing system-message — confermare che il provider accetti un
 * messaggio `system` in coda (altrimenti ripiegare sul last-user); (2) require/OOB endpoint resolution.
 */
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import {
  loadEvictionConfig,
  loadEvictionInjectMode,
  evictionEvent,
  summarizeEvicting,
  buildEvictionDirective,
  injectDirectiveMessages,
} from "../../src/eviction-checkpoint.mjs";
import { loadHarnessConfig } from "../../src/harness-config.mjs";
import { getVarsQueue, getConversationStore, closeAll } from "../../src/state-db.mjs";
import { convIdFor } from "../../src/session-context.mjs";
import { EVICTION_ORDINAL_META } from "../../src/meta-keys.mjs"; // SSOT prefisso ordinale evicted (tool drive-qwen)

export default function (pi: ExtensionAPI) {
  const { rung, enabled } = loadEvictionConfig();
  if (!enabled) return; // DEFAULT off → no-op TOTALE (nessun hook, nessun DB): push sicuro, zero cambio live.

  const keepTurns = loadHarnessConfig().nativeKeepTurns; // SSOT harness-config: intero ≥1 garantito (no `?? 1`/as any)
  const injectMode = loadEvictionInjectMode(); // FORMA d'iniezione (F26 forma-vs-richiesta): default trailing (invariato)
  const vq = getVarsQueue(); // vars.db dell'orchestratore (path+mkdir+agent nel singleton state-db)
  const store = getConversationStore(); // FONTE AUTORITATIVA del conteggio turni (condivisa con conversation-capture)
  pi.on("session_shutdown", () => closeAll());

  // require (OOB) non ancora wired live → degrada a inject con avviso una-tantum (interim, vedi spike todo NEW-A).
  let effRung = rung;
  if (rung === "require") {
    effRung = "inject";
    // eslint-disable-next-line no-console
    console.error("[eviction-checkpoint] rung 'require' (OOB) non ancora wired: uso 'inject' come interim (spike endpoint pending).");
  }

  pi.on("context", (event, ctx) => {
    const messages = ((event as any).messages as any[]) || [];
    const convId = convIdFor(ctx);

    // CONTEGGIO DALLO STORE, non da event.messages: native-window gira nello stesso hook `context` e finestra
    // l'array PRIMA (contarlo da lì darebbe ≤ keepTurns → eviction MAI rilevata, bug sessione 019f2ab9). (fix 2026-07-04)
    const userTurnCount = store.countUserTurns(convId);
    const metaKey = EVICTION_ORDINAL_META + convId;
    const lastEvictedOrdinal = Number(vq.getMeta(metaKey) ?? 0) || 0;

    const { evictedThrough, newlyEvicted } = evictionEvent({ userTurnCount, keepTurns, lastEvictedOrdinal });
    if (newlyEvicted.length === 0) return; // niente è appena uscito dal nativo → nessuna direttiva

    // digest dei turni appena usciti, ripescati DALLO STORE (non sono più nell'array finestrato).
    const turns = store.userTurnsByOrdinal(convId, newlyEvicted[0], newlyEvicted[newlyEvicted.length - 1]);
    const digest = summarizeEvicting(turns);
    const directive = buildEvictionDirective(effRung, { digest });
    if (!directive) return;

    // avanza il boundary PRIMA di ritornare → fire-once per turno-in-uscita (idempotente sui request ripetuti).
    vq.setMeta(metaKey, String(evictedThrough));

    // FORMA d'iniezione (F26): default `trailing` = user-msg in coda (D2 audit 2026-07-04: canale USER non SYSTEM,
    // perché harness-config.mjs:44-50 ha PROVATO che il 9B legge user/nativo e IGNORA system). MA il trailing è anche
    // ciò che DIROTTA la probe (F25): most-recent → risposto. I modi `preuser`/`system` isolano forma-vs-richiesta.
    // Messaggio effimero (solo questo request, il context-hook non persiste); il tag lo marca come direttiva harness.
    const injected = injectDirectiveMessages(messages, directive, injectMode);
    return { messages: injected };
  });
}
