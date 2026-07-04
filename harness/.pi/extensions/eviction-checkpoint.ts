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
  evictionEvent,
  summarizeEvicting,
  buildEvictionDirective,
} from "../../src/eviction-checkpoint.mjs";
import { loadHarnessConfig } from "../../src/harness-config.mjs";
import { getVarsQueue, getConversationStore, closeAll } from "../../src/state-db.mjs";
import { getConvId } from "../../src/session-context.mjs";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

const VARS_DB_PATH = ".pi/state/vars.db";
const LAST_EVICTED_META = "_eviction_ordinal:";

export default function (pi: ExtensionAPI) {
  const { rung, enabled } = loadEvictionConfig();
  if (!enabled) return; // DEFAULT off → no-op TOTALE (nessun hook, nessun DB): push sicuro, zero cambio live.

  const keepTurns = Math.max(1, Number((loadHarnessConfig() as any).nativeKeepTurns ?? 1));
  mkdirSync(dirname(VARS_DB_PATH), { recursive: true });
  const vq = getVarsQueue(VARS_DB_PATH, { agent: "orchestrator" });
  const store = getConversationStore(); // FONTE AUTORITATIVA del conteggio turni (condivisa con conversation-capture)
  pi.on("session_shutdown", () => closeAll());

  // require (OOB) non ancora wired live → degrada a inject con avviso una-tantum (interim, vedi spike todo NEW-A).
  let effRung = rung;
  if (rung === "require") {
    effRung = "inject";
    // eslint-disable-next-line no-console
    console.error("[eviction-checkpoint] rung 'require' (OOB) non ancora wired: uso 'inject' come interim (spike endpoint pending).");
  }

  pi.on("context", (event) => {
    const messages = ((event as any).messages as any[]) || [];
    const convId = getConvId();

    // CONTEGGIO DALLO STORE, non da event.messages: native-window gira nello stesso hook `context` e finestra
    // l'array PRIMA (contarlo da lì darebbe ≤ keepTurns → eviction MAI rilevata, bug sessione 019f2ab9). (fix 2026-07-04)
    const userTurnCount = store.countUserTurns(convId);
    const metaKey = LAST_EVICTED_META + convId;
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

    // appende la direttiva come messaggio SISTEMA effimero, SOLO per questo request (il context-hook non persiste).
    const injected = messages.concat([
      { role: "system", content: "<eviction_checkpoint>\n" + directive + "\n</eviction_checkpoint>" },
    ]);
    return { messages: injected };
  });
}
