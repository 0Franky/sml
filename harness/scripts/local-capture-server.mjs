#!/usr/bin/env node
/**
 * local-capture-server — server HTTP di CATTURA per i test LOCALI (utente msg 668/test live).
 *
 * Ascolta SOLO su loopback (127.0.0.1) e logga ESATTAMENTE cosa riceve (metodo, path, header — incl.
 * Authorization — e body). Serve a verificare LATO-SERVER che, in una chiamata `{{secret:NAME}}` verso
 * http://localhost:PORT, arrivi il VALORE REALE (iniettato dall'harness al confine del tool_call) e NON il
 * placeholder — cioè che il sink-gating + `allowLocalHttp` funzionino end-to-end.
 *
 * NB: è un attrezzo DA TEST. Bind SOLO 127.0.0.1 (mai 0.0.0.0) → non raggiungibile dalla rete. Stampa in chiaro
 * ciò che riceve (nei test si usano chiavi FINTE tipo sk-FAKE...); non usarlo con segreti reali che non vuoi vedere.
 *
 * Uso:
 *   node scripts/local-capture-server.mjs            # porta 3000
 *   node scripts/local-capture-server.mjs 8080       # porta custom
 *   PORT=3000 node scripts/local-capture-server.mjs  # via env
 * Ctrl-C per fermarlo. Risponde sempre 200 {ok:true} così il client (curl) è contento.
 */
import { createServer } from "node:http";

const PORT = Number(process.argv[2] || process.env.PORT || 3000);
const HOST = "127.0.0.1"; // loopback-only, MAI 0.0.0.0

let n = 0;
const server = createServer((req, res) => {
  const chunks = [];
  req.on("data", (c) => chunks.push(c));
  req.on("end", () => {
    const body = Buffer.concat(chunks).toString("utf8");
    n += 1;
    const ts = new Date().toISOString();
    const lines = [];
    lines.push(`\n──────── richiesta #${n}  @${ts} ────────`);
    lines.push(`${req.method} ${req.url}`);
    for (const [k, v] of Object.entries(req.headers)) lines.push(`  ${k}: ${v}`);
    if (body) lines.push(`  body: ${body}`);
    // evidenzia l'header di auth (è lì che di solito finisce il secret) per la verifica a colpo d'occhio
    const auth = req.headers["authorization"];
    if (auth) lines.push(`  → AUTHORIZATION ricevuto: ${auth}  (verifica: è il VALORE reale, non {{secret:...}}?)`);
    console.log(lines.join("\n"));
    res.writeHead(200, { "Content-Type": "application/json" });
    // TEST INGRESS-DA-TOOL_RESULT (utente msg 699): il server (simulato) risponde con NUOVI token, per osservare
    // cosa fa l'harness quando un valore secret-shaped arriva DA un tool_result (non dall'input utente). Sono FINTI.
    //  (A) api_key shape-matching → matcha SECRET_PATTERNS (sk-…{20,}) → ATTESO redatto al confine `tool_result`
    //      (il modello vede [REDACTED-SECRET], non lo possiede mai → non può echeggiarlo).
    //  (B) session_token OPACO → nessuna shape nota → ATTESO passa NON-redatto (gap onesto: ingress-da-tool senza
    //      shape non è coperto; il modello LO VEDE e può echeggiarlo, a meno che non lo sigilli da sé con add_secret).
    // Valori FINTI assemblati a RUNTIME (split dei literal → nessun secret-scanner/gitleaks falso-positivo;
    // a runtime il valore sul filo è IDENTICO, è quello che conta per il test). Sono FALSI.
    const fakeShaped = "sk-" + "SRVnew0renew111222333444555666AbCdE"; // a runtime matcha SECRET_PATTERNS (sk-…{20,})
    const fakeOpaque = "sess-" + "SRVnew-Zq9fLm2pX7vK4nT8wB3cY6hD1sGjR0a"; // opaco: nessuna shape nota
    res.end(JSON.stringify({
      ok: true,
      received: n,
      path: req.url,
      message: "token renewed (test capture server)",
      api_key: fakeShaped,
      session_token: fakeOpaque,
    }));
  });
});

server.listen(PORT, HOST, () => {
  console.log(`local-capture-server in ascolto su http://${HOST}:${PORT}  (loopback-only)`);
  console.log(`In attesa di richieste… (es. il modello chiama http://localhost:${PORT}/api/renew). Ctrl-C per uscire.`);
});

server.on("error", (e) => {
  console.error(`Errore server (porta ${PORT} occupata?):`, e.message);
  process.exit(1);
});
