/**
 * pacer — distanzia nel tempo chiamate concorrenti a uno stesso provider (rate-limit TPM).
 *
 * PERCHE' ESISTE (F26/F37, 2026-07-26): `run-session.mjs` spaziava solo i TASK
 * (`EVAL_INTERTASK_DELAY_MS`), ma dentro un task il ciclo agentico fa piu' turni **back-to-back
 * senza alcuna pausa**. Con ~25-27K prompt_tokens per chiamata contro il TPM di SiliconFlow L0
 * (**40.000 token/minuto**) una sola chiamata consuma due terzi del minuto -> il run moriva dopo
 * ~4 richieste. La manopola esisteva, era nel posto sbagliato.
 *
 * ⚠️ NON e' un backoff. Il backoff reagisce DOPO il 429, e il 429 ha gia' consumato quota. Questo
 * PREVIENE, distanziando prima di chiedere. Sono complementari, non alternativi.
 *
 * Estratto da `run-session.mjs` per essere TESTABILE con un orologio finto: il difetto viveva nel
 * wiring (l'ordine delle chiamate nel tempo), non in una funzione pura, e un test che non guarda
 * il tempo non lo avrebbe visto (rule #14/#17).
 */

/**
 * makePacer — crea un gate che lascia passare una chiamata alla volta, garantendo `delayMs` fra
 * l'inizio di una e l'inizio della successiva.
 *
 * @param {number} delayMs  ms minimi fra due chiamate. **0 (o negativo) = no-op**: chi gira su
 *                          free-tier veloci non paga nulla. Il default deve restare 0 perche' il
 *                          pacing e' un rimedio a un vincolo del PROVIDER, non un comportamento
 *                          desiderabile di per se'.
 * @param {{now?:()=>number, sleep?:(ms:number)=>Promise<void>}} [deps] iniettabili per i test
 *                          (orologio e attesa finti -> il test e' deterministico e istantaneo).
 * @returns {() => Promise<void>}  `pace()`: da attendere PRIMA di ogni chiamata al provider.
 */
export function makePacer(delayMs, deps = {}) {
  const now = deps.now || (() => Date.now());
  const sleep = deps.sleep || ((ms) => new Promise((r) => setTimeout(r, ms)));
  const delay = Number(delayMs) || 0;

  if (delay <= 0) return () => Promise.resolve();

  let chain = Promise.resolve();
  let lastAt = 0; // 0 = mai chiamato -> la PRIMA chiamata non attende (non ha senso ritardare l'avvio)
  let started = false;

  return function pace() {
    const next = chain.then(async () => {
      if (started) {
        const wait = lastAt + delay - now();
        if (wait > 0) await sleep(wait);
      }
      started = true;
      lastAt = now();
    });
    // un errore a valle non deve rompere la catena: il pacing deve continuare a funzionare anche
    // se una chiamata fallisce (ed e' proprio quando fallisce che serve di piu').
    chain = next.catch(() => {});
    return next;
  };
}

export default { makePacer };
