/**
 * conversation-store — la CONVERSAZIONE persistita per ID (Strada 2, ADR 2026-06-29-context-as-first-person-mind).
 *
 * Realizza il principio 3 dell'ADR: la conversazione è un artefatto memorizzato con un **ID** che (a) sopravvive
 * al compact (file SQLite su disco), (b) è condivisibile coi subagent per riferimento (passano l'ID + range,
 * non il testo), (c) nel workspace se ne mostra una **finestra degli ultimi N messaggi VERBATIM** + un marker
 * recuperabile-per-ID per il pieno. È lo stesso pattern di sliding-window-variable-tool applicato alla chat.
 *
 * Disaccoppiato da pi (prende/ritorna dati puri) → testabile con node puro (node:sqlite, come vars-queue).
 * La lane `<messages_with_user>` è un blocco SEPARATO e ULTIMO (zona volatile, dopo il prefisso stabile del
 * <context>): la finestra verbatim cambia a ogni turno, quindi NON va dentro il prefisso cache-stable.
 * (review-loop 2026-06-29, finding volatile-messages-vs-stable-prefix.)
 *
 * Timestamp: Date.now() (epoch ms) — codice runtime Node, non script workflow.
 */
import { DatabaseSync } from "node:sqlite";
import { parseSessionStartMs, sessionStartIso, shiftPrefix } from "./time-shift.mjs";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS conversations (
  seq     INTEGER PRIMARY KEY AUTOINCREMENT,   -- id monotono globale (ordine totale, recupero-per-ID)
  conv_id TEXT NOT NULL,                        -- l'ID della conversazione
  role    TEXT NOT NULL,                        -- user | assistant | tool | system
  text    TEXT NOT NULL,
  ts      INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_conv ON conversations(conv_id, seq);
`;

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export class ConversationStore {
  /**
   * @param {string} dbPath  ":memory:" oppure un path file (es. ".pi/state/conversations.db").
   * @param {{agent?: string}} [opts]
   */
  constructor(dbPath = ":memory:", opts = {}) {
    this.agent = opts.agent ?? "main";
    this.db = new DatabaseSync(dbPath);
    this.db.exec("PRAGMA journal_mode = WAL;");
    this.db.exec(SCHEMA);
  }

  close() { this.db.close(); }

  /** Appende un turno alla conversazione `convId`. Ritorna il `seq` (id monotono). */
  append(convId, role, text, { ts = Date.now() } = {}) {
    const r = this.db.prepare(`INSERT INTO conversations (conv_id, role, text, ts) VALUES (?,?,?,?)`)
      .run(convId, role, String(text), ts);
    return Number(r.lastInsertRowid);
  }

  /**
   * Numero di turni della conversazione. `afterSeq` > 0 → solo quelli DOPO un checkpoint/segment-boundary;
   * `untilSeq` (≠ null) → bound SUPERIORE inclusivo (es. escludere il turno corrente in volo, vedi buildMessagesLane).
   */
  count(convId, { afterSeq = 0, untilSeq = null } = {}) {
    const upper = untilSeq != null ? " AND seq <= ?" : "";
    const args = untilSeq != null ? [convId, afterSeq, untilSeq] : [convId, afterSeq];
    return this.db.prepare(`SELECT COUNT(*) AS c FROM conversations WHERE conv_id = ? AND seq > ?${upper}`).get(...args).c;
  }

  /**
   * Ultimi N turni in ordine cronologico (oldest→newest), VERBATIM. `afterSeq` = bound inferiore (segmento
   * post-checkpoint); `untilSeq` (≠ null) = bound SUPERIORE inclusivo (simmetrico) → la finestra può escludere
   * la coda (es. il turno corrente, che la native-window porta già). Sentinella null = nessun bound superiore.
   */
  window(convId, n = 6, { afterSeq = 0, untilSeq = null } = {}) {
    const upper = untilSeq != null ? " AND seq <= ?" : "";
    const args = untilSeq != null ? [convId, afterSeq, untilSeq, n] : [convId, afterSeq, n];
    const rows = this.db.prepare(
      `SELECT seq, role, text, ts FROM conversations WHERE conv_id = ? AND seq > ?${upper} ORDER BY seq DESC LIMIT ?`
    ).all(...args);
    return rows.reverse();
  }

  /**
   * Seq del K-esimo messaggio UTENTE contando dalla FINE (bound inferiore `afterSeq`). È il confine di
   * COMPLEMENTARITÀ con la native-window (keepTurns=K, fix amnesia 2026-07-03): gli ultimi K turni-utente sono
   * nell'array NATIVO, quindi la lane deve mostrare solo ciò che sta PRIMA di questo seq. `null` se i turni-utente
   * sono < K → l'intera conversazione sta nella finestra nativa (lane complementare vuota, niente doppia-chat).
   */
  nthLastUserSeq(convId, k, { afterSeq = 0 } = {}) {
    if (!(k > 0)) return null;
    const rows = this.db.prepare(
      `SELECT seq FROM conversations WHERE conv_id = ? AND seq > ? AND role = 'user' ORDER BY seq DESC LIMIT ?`
    ).all(convId, afterSeq, k);
    return rows.length >= k ? rows[rows.length - 1].seq : null;
  }

  /** Max seq della conversazione (0 se vuota) — il confine che un `checkpoint` registra come segment-boundary. */
  lastSeq(convId) {
    const r = this.db.prepare(`SELECT MAX(seq) AS s FROM conversations WHERE conv_id = ?`).get(convId);
    return r && r.s != null ? Number(r.s) : 0;
  }

  /** Turni per range di `seq` (inclusivo) — è il recupero-per-ID che un subagent chiama (passa conv_id + range). */
  range(convId, fromSeq, toSeq) {
    return this.db.prepare(
      `SELECT seq, role, text, ts FROM conversations WHERE conv_id = ? AND seq >= ? AND seq <= ? ORDER BY seq`
    ).all(convId, fromSeq, toSeq);
  }

  /** Conversazione completa (usare con parsimonia: la `window` è la vista di default). */
  all(convId) {
    return this.db.prepare(`SELECT seq, role, text, ts FROM conversations WHERE conv_id = ? ORDER BY seq`).all(convId);
  }
}

/**
 * isGenuineUserInput — un evento `input` è un turno-utente GENUINO da persistere? true SOLO per input TOP-LEVEL reale:
 *   - source `interactive` (TUI) O `rpc` (driver programmatico / SDK / harness di interrogazione) — entrambi = utente;
 *   - NON mid-turn (streamingBehavior `steer`/`followUp`), NON slash-command, testo non vuoto;
 *   - esclude source `extension` (input INIETTATO da un'estensione, non è l'utente che parla).
 * Fix 2026-07-03: prima il filtro whitelistava SOLO `interactive` → in `rpc`/headless la conversazione NON veniva
 * catturata (lane <messages_with_user> vuota) → multi-turno non testabile headless + nessuna memoria in produzione SDK.
 * @param {{ text?: unknown, source?: string, streamingBehavior?: string }} [event]
 */
export function isGenuineUserInput({ text, source, streamingBehavior } = {}) {
  return typeof text === "string" && text.trim().length > 0 &&
    (source === "interactive" || source === "rpc") &&
    !streamingBehavior && !String(text).startsWith("/");
}

/**
 * buildMessagesLane — la lane `<messages_with_user>`: blocco SEPARATO e ULTIMO (zona volatile, dopo il prefisso
 * cache-stable). Mostra gli ultimi N turni VERBATIM (no perdita delle parole esatte recenti) + un marker
 * recuperabile-per-ID per i più vecchi. Cap di dimensione (`charCap`): se la finestra eccede, droppa i più
 * VECCHI mantenendo i più recenti verbatim (e ne segnala il numero nascosto).
 *
 * F (meccanismo deterministico): finestra + cap + marker + store-by-ID. S (politica, futura): quanti tenere /
 * quando recuperare i più vecchi (window-aware-fetching). Senza training il default-N è già utile (DEGRADATA-MA-UTILE).
 *
 * `excludeCurrentTurn` (Strada-2 complementarità, review-full P1-B): la native-window porta il TURNO CORRENTE
 * (keepTurns=1, native-window.ts); la lane mostra la STORIA. Se l'hook `input` ha già catturato il messaggio
 * utente in volo (caso interattivo genuino) questo è l'ULTIMO record dello store → va ESCLUSO dalla lane,
 * altrimenti compare due volte (lane + native = "doppia-chat", overlap=1). Degrada con grazia: se il turno
 * corrente NON è stato catturato (headless/slash/streaming, filtro `genuine` in conversation-capture), l'ultimo
 * record è l'assistant precedente → niente da escludere (la storia resta completa, nessun overlap).
 *
 * @param {ConversationStore} store
 * @param {string} convId
 * @param {{ n?: number, charCap?: number, afterSeq?: number, excludeCurrentTurn?: boolean }} [opts]
 * @returns {string} blocco "<messages_with_user …>…</messages_with_user>" oppure "" (conversazione vuota)
 */
export function buildMessagesLane(store, convId, { n = 6, charCap = 4000, afterSeq = 0, excludeCurrentTurn = false, nativeKeepTurns = 0 } = {}) {
  // bound superiore: escludi il turno utente in volo (la sua seq è il max della conversazione, appena appeso).
  // untilSeq può legittimamente valere 0 (turno corrente = primissimo messaggio) → lane vuota, corretto.
  let untilSeq = null;
  if (nativeKeepTurns > 0) {
    // COMPLEMENTARITÀ con la native-window (keepTurns=K, fix amnesia 2026-07-03): gli ultimi K turni-utente sono
    // nell'array NATIVO — dove il modello guarda DAVVERO (un chat-model tratta l'array messaggi come "la
    // conversazione", NON la lane nel system prompt). La lane mostra perciò SOLO i turni più VECCHI del K-esimo.
    // Se i turni-utente sono < K → tutta la conversazione è nell'array nativo → lane VUOTA (niente doppia-chat).
    const nativeStart = store.nthLastUserSeq(convId, nativeKeepTurns, { afterSeq });
    if (nativeStart == null) return "";
    untilSeq = nativeStart - 1;
  } else if (excludeCurrentTurn) {
    const tail = store.window(convId, 1, { afterSeq });
    if (tail.length && tail[0].role === "user") untilSeq = tail[0].seq - 1;
  }
  const total = store.count(convId, { afterSeq, untilSeq });
  if (!total) return "";
  let win = store.window(convId, n, { afterSeq, untilSeq });
  const sizeOf = (rows) => rows.reduce((a, r) => a + r.text.length, 0);
  while (win.length > 1 && sizeOf(win) > charCap) win = win.slice(1); // droppa i più vecchi, tieni i recenti verbatim
  // se l'UNICO messaggio rimasto eccede ancora il cap (paste enorme in un solo turno), tronca il suo testo →
  // il budget della lane resta bounded anche nel caso singolo-messaggio-gigante. (review-loop #2 2026-06-29, P3.)
  if (win.length === 1 && win[0].text.length > charCap) {
    const t = win[0];
    win = [{ ...t, text: t.text.slice(0, charCap) + `…[+${t.text.length - charCap} chars — use get_conversation]` }];
  }
  const shownFrom = win.length ? win[0].seq : afterSeq + total + 1;
  const olderHidden = total - win.length; // più vecchi DENTRO il segmento post-checkpoint
  const ckptAttr = afterSeq > 0 ? ` checkpoint="${afterSeq}"` : "";
  // ANCORAGGIO TEMPORALE (utente msg 848/849): start ASSOLUTO nell'header, ogni riga con SHIFT compatto. Il modello
  // ricostruisce l'ordine dai timestamp, NON dalla posizione (che può essere buggata). Degrada con grazia (convId
  // non-`sess-<epoch>` come "main" → nessun attr/prefisso). Lo start-epoch è già nel convId → costo zero.
  const startMs = parseSessionStartMs(convId);
  const startIso = sessionStartIso(startMs);
  const startAttr = startIso ? ` session_start="${startIso}"` : "";
  const lines = [`<messages_with_user conv="${esc(convId)}"${startAttr} shown="${win.length}/${total}"${ckptAttr}>`];
  for (const t of win) lines.push(`  ${shiftPrefix(t.ts, startMs)}[${esc(t.role)}] ${esc(t.text)}`);
  if (olderHidden > 0) {
    lines.push(`  (+${olderHidden} older messages in the segment — use get_conversation conv="${esc(convId)}" range=${afterSeq + 1}..${shownFrom - 1})`);
  }
  // dopo un checkpoint: la chat PRE-checkpoint è ripiegata (sintetizzata in <resuming_from>), recuperabile per ID.
  if (afterSeq > 0) {
    lines.push(`  (folded at checkpoint @${afterSeq}: the earlier messages are in the <resuming_from> digest + get_conversation range=1..${afterSeq})`);
  }
  lines.push(`</messages_with_user>`);
  return lines.join("\n");
}

/** Ruoli STRUTTURALI non-conversazionali che pi può mettere in testa all'array (es. branchSummary dopo /tree). */
const STRUCTURAL_ROLES = new Set(["branchSummary", "compactionSummary", "custom"]);

/**
 * windowNativeMessages — Strada-2: BOUNDA l'array messaggi NATIVO di pi tenendo gli ULTIMI `keepTurns` turni
 * (con i loro tool_call/tool_result) e sopprimendo la storia più vecchia → niente crescita illimitata
 * (sostituisce la compaction nativa, OFF) preservando la continuità del tool-loop del turno corrente.
 *
 * DEFAULT keepTurns=1 (= solo TURNO CORRENTE): coerente con l'ADR principio-3 (context-as-first-person-mind).
 * L'array nativo porta SOLO il turno in corso (coi suoi tool); la STORIA dei turni precedenti è curata e
 * NON-duplicata nella lane <messages_with_user> (testo verbatim) + nello stato (recent_changes/vars/error-memo).
 * Native (turno corrente) e lane (storia) sono COMPLEMENTARI → niente "doppia-chat". I tool_result dei turni
 * passati sono intenzionalmente transitori: vanno catturati on-demand (set_var/note/error-memo), non riportati
 * raw all'infinito. (review-loop #3 2026-06-29, P1: keepTurns=4 sovrapponeva native+lane → ripristinato a 1.)
 *
 * Preserva il PREFISSO CONTIGUO di messaggi strutturali in testa (branchSummary/compactionSummary da /tree o
 * compaction): sono "summary di ciò che precede", semanticamente di testa. Si ferma al primo non-strutturale →
 * NON promuove in testa i 'custom' iniettati a metà storia (che perderebbero il riferimento posizionale).
 * (review-loop #3 2026-06-29, P3 custom-reorder.)
 *
 * Sotto soglia (≤ keepTurns turni) ritorna lo STESSO riferimento (il caller confronta per identità). (ADR principio-3.)
 *
 * @param {Array<{role?:string}>} messages
 * @param {{ keepTurns?: number }} [opts]  keepTurns=1 (default) = solo turno corrente.
 * @returns {Array} l'array ridotto agli ultimi keepTurns turni (+ prefisso strutturale contiguo), o lo stesso `messages`.
 */
export function windowNativeMessages(messages, opts = {}) {
  const keepTurns = opts.keepTurns ?? 1;
  if (!Array.isArray(messages) || messages.length < 2) return messages;
  const userIdx = [];
  for (let i = 0; i < messages.length; i++) {
    if (messages[i] && messages[i].role === "user") userIdx.push(i);
  }
  if (userIdx.length <= keepTurns) return messages; // sotto soglia → niente storia da rimuovere
  const cut = userIdx[userIdx.length - keepTurns]; // indice d'inizio del K-esimo turno dal fondo
  if (cut <= 0) return messages;
  // SOLO il prefisso CONTIGUO di strutturali in testa (no reorder dei 'custom' sparsi a metà storia).
  let prefixEnd = 0;
  while (prefixEnd < cut && messages[prefixEnd] && STRUCTURAL_ROLES.has(messages[prefixEnd].role)) prefixEnd++;
  const head = messages.slice(0, prefixEnd);
  const tail = messages.slice(cut);
  return head.length ? head.concat(tail) : tail;
}

export default ConversationStore;
