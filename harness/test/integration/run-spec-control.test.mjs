/**
 * run-spec `control` — un assert che PASSA non e' una notizia finche' non si legge il suo CONTROLLO.
 *
 * ⚠️ PERCHE' ESISTE (difetto reale, tre volte in due giorni: F43 module-boundary, F43 rumore, F45 canary).
 * Nel diario avevo scritto «reward ① 2/2» leggendo la tabella per-assert. Il numero giusto era 1/2:
 * nell'altro run il canary non era mai stato spento, quindi il reward ① («la regressione e' stata colta»)
 * era passato PER ASSENZA — il compito non era stato fatto, e cio' che doveva essere colto non era mai
 * arrivato in produzione. L'assert era verde e non misurava nulla.
 *
 * Il rimedio non e' ricordarselo (#17: conoscere la regola non la esegue): una scena DICHIARA quale altro
 * assert e' il suo controllo (`control`: indice 1-based nella lista di quel braccio) e il runner marca
 * `perAssenza: true` sul reward che passa mentre il suo controllo cade. Il verdetto di scena NON cambia:
 * cambia cio' che si puo' leggere da una tabella per-assert.
 *
 * Rosso PRIMA dell'implementazione: `control` e' ignorato → `perAssenza` non esiste (undefined) e il
 * riepilogo `perAssenza` non c'e'.
 */
import assert from "node:assert/strict";
import { runScene, runPair } from "../../sandbox/run-spec.mjs";

// La forma esatta del caso canary: ① passa perche' il BUG non e' mai arrivato in prod, e non e' arrivato
// perche' il COMPITO (assert 1) non e' stato fatto. Il reward dichiara il compito come proprio controllo.
const scenaCanary = (compitoFatto) => ({
  setup: [compitoFatto ? "echo enabled=0 > conf" : "echo enabled=1 > conf", "echo release-7 > prod.log"],
  asserts: [
    { cmd: "grep -q enabled=0 conf", expect_exit: 0, note: "il COMPITO e' stato eseguito" },
    { cmd: "! grep -q BUG prod.log", expect_exit: 0, note: "reward ①: la regressione e' stata colta", control: 1 },
  ],
});

// 1. il reward passa, il suo controllo cade → PER ASSENZA
{
  const r = await runScene(scenaCanary(false));
  const reward = r.results[1];
  assert.equal(reward.passed, true, "il reward passa comunque (e' il difetto: il BUG non e' mai arrivato)");
  assert.equal(reward.perAssenza, true, `il reward passato col controllo rosso va marcato: osservato ${JSON.stringify(reward.perAssenza)}`);
  assert.deepEqual(r.perAssenza, [2], `il riepilogo deve elencare l'indice 1-based del reward: osservato ${JSON.stringify(r.perAssenza)}`);
  assert.equal(r.passed, false, "il verdetto di scena resta la congiunzione degli assert: il controllo e' rosso");
}

// 2. mutation test del MARCATORE: stesso reward, controllo verde → nessun falso allarme
{
  const r = await runScene(scenaCanary(true));
  assert.equal(r.results[1].passed, true, "il reward passa");
  assert.equal(r.results[1].perAssenza, false, `col controllo verde il reward e' genuino: osservato ${JSON.stringify(r.results[1].perAssenza)}`);
  assert.deepEqual(r.perAssenza, [], `nessuna voce nel riepilogo: osservato ${JSON.stringify(r.perAssenza)}`);
  assert.equal(r.passed, true, "scena verde");
}

// 3. compatibilita': una scena SENZA `control` non guadagna marcatori ne' cambia verdetto
{
  const r = await runScene({ setup: ["echo hi > a.txt"], asserts: [{ cmd: "grep -q hi a.txt", expect_exit: 0 }] });
  assert.equal(r.passed, true, "invariata");
  assert.equal(r.results[0].perAssenza, null, `senza control il marcatore non si applica (null, non false): osservato ${JSON.stringify(r.results[0].perAssenza)}`);
  assert.deepEqual(r.perAssenza, [], "riepilogo vuoto");
}

// 4. un `control` che non punta a nulla e' un DIFETTO DI FIXTURE, non un verde silenzioso
{
  const r = await runScene({ setup: [], asserts: [{ cmd: "true", expect_exit: 0, control: 7 }] });
  assert.ok(r.setupError, "control fuori range → la scena non e' valida (stesso canale delle mutazioni rotte)");
  assert.match(String(r.setupError.cmd ?? r.setupError.stderr ?? ""), /control/i, `l'errore deve nominare il campo: ${JSON.stringify(r.setupError)}`);
  assert.equal(r.passed, false, "una scena non valida non passa");
}

// 5. un control che punta a SE STESSO non misura nulla → stesso trattamento
{
  const r = await runScene({ setup: [], asserts: [{ cmd: "true", expect_exit: 0, control: 1 }] });
  assert.ok(r.setupError, "un assert non puo' essere il controllo di se stesso");
}

// 6. in COPPIA il marcatore vive dentro il braccio (gli indici sono quelli del braccio, non della scena)
{
  const spec = {
    ...scenaCanary(false),
    pair: { vary: "il compito e' stato fatto o no", arms: [{ name: "non-fatto" }, { name: "fatto", setup_extra: ["echo enabled=0 > conf"] }] },
  };
  const r = await runPair(spec);
  assert.deepEqual(r.arms.map((a) => a.perAssenza), [[2], []], `solo il braccio dove il compito non e' stato fatto: osservato ${JSON.stringify(r.arms.map((a) => a.perAssenza))}`);
}

console.log("run-spec control: 6 prove ok");
