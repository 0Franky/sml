/**
 * gen-signwrap-variants.mjs — genera + verifica-soundness le VARIANTI disguised della classe sign/wrap (F14).
 *
 * Meccanismo-faller confermato (F14): "aritmetica naive che va NEGATIVA in un framing che NON segnala 'modulo',
 * con fix NON-idiomatica". Le modulari idiomatiche (orologio/bussola/calendario) NON cascano → escluse.
 * Qui: 3 domini-variante della DURATA-overnight (stesso meccanismo di total_minutes) + 1 SEGNO-in-computo
 * (stesso meccanismo di #145). Transfer-style (msg 1125): stessa logica, domini diversi, edge IMPLICITO.
 *
 * Uso: node eval/gen-signwrap-variants.mjs   → scrive eval/data/signwrap-variants.jsonl + stampa soundness.
 * Poi validare col modello: EVAL_DATASET=eval/data/signwrap-variants.jsonl ... node eval/run-ab.mjs
 */
import { writeFileSync } from "node:fs";
import { runPython } from "./py-run.mjs";

// Ogni candidato: spec (edge NON dichiarato), provided (SENZA il caso negativo/wrap), hidden (CON), ref (corretta), naive (ingenua).
const C = [
  { entry: "parking_fee",
    spec: `def parking_fee(entry, exit):\n    """entry, exit = orari 'HH:MM' (24h) di ingresso e uscita da un parcheggio.\n    Tariffa: 2 euro ogni 30 minuti iniziati. Ritorna il costo totale in euro.\n    Es: parking_fee('09:00','10:00')==4 ; parking_fee('09:00','09:20')==2"""`,
    provided: ["assert parking_fee('09:00','10:00')==4", "assert parking_fee('09:00','09:20')==2"],
    hidden: ["assert parking_fee('23:30','00:30')==4", "assert parking_fee('22:00','06:00')==32"],
    ref: `def parking_fee(entry, exit):\n    def m(t):\n        h,x=t.split(':'); return int(h)*60+int(x)\n    d=m(exit)-m(entry)\n    if d<0: d+=1440\n    import math\n    return 2*math.ceil(d/30) if d>0 else 0`,
    naive: `def parking_fee(entry, exit):\n    def m(t):\n        h,x=t.split(':'); return int(h)*60+int(x)\n    import math\n    return 2*math.ceil((m(exit)-m(entry))/30)` },

  { entry: "sleep_minutes",
    spec: `def sleep_minutes(bedtime, wake):\n    """bedtime, wake = orari 'HH:MM' (24h) in cui ci si addormenta e ci si sveglia.\n    Ritorna i minuti totali di sonno.\n    Es: sleep_minutes('14:00','16:00')==120 ; sleep_minutes('13:30','15:00')==90"""`,
    provided: ["assert sleep_minutes('14:00','16:00')==120", "assert sleep_minutes('13:30','15:00')==90"],
    hidden: ["assert sleep_minutes('23:00','07:00')==480", "assert sleep_minutes('22:30','06:00')==450"],
    ref: `def sleep_minutes(bedtime, wake):\n    def m(t):\n        h,x=t.split(':'); return int(h)*60+int(x)\n    d=m(wake)-m(bedtime)\n    return d if d>=0 else d+1440`,
    naive: `def sleep_minutes(bedtime, wake):\n    def m(t):\n        h,x=t.split(':'); return int(h)*60+int(x)\n    return m(wake)-m(bedtime)` },

  { entry: "call_minutes",
    spec: `def call_minutes(start, end):\n    """start, end = orari 'HH:MM' (24h) di inizio e fine di una telefonata.\n    Ritorna la durata in minuti.\n    Es: call_minutes('10:00','10:45')==45 ; call_minutes('11:20','11:50')==30"""`,
    provided: ["assert call_minutes('10:00','10:45')==45", "assert call_minutes('11:20','11:50')==30"],
    hidden: ["assert call_minutes('23:50','00:10')==20", "assert call_minutes('23:00','01:30')==150"],
    ref: `def call_minutes(start, end):\n    def m(t):\n        h,x=t.split(':'); return int(h)*60+int(x)\n    d=m(end)-m(start)\n    return d if d>=0 else d+1440`,
    naive: `def call_minutes(start, end):\n    def m(t):\n        h,x=t.split(':'); return int(h)*60+int(x)\n    return m(end)-m(start)` },

  { entry: "signed_checksum",
    spec: `def signed_checksum(n):\n    """n = intero. Ritorna un checksum = somma delle sue cifre.\n    Es: signed_checksum(12)==3 ; signed_checksum(230)==5 ; signed_checksum(7)==7"""`,
    provided: ["assert signed_checksum(12)==3", "assert signed_checksum(230)==5", "assert signed_checksum(7)==7"],
    hidden: ["assert signed_checksum(-12)==1", "assert signed_checksum(-5)==-5", "assert signed_checksum(-30)==-3"],
    // ref: per i negativi la 1ª cifra porta il segno (stesso meccanismo di #145: -12 → -1+2 = 1)
    ref: `def signed_checksum(n):\n    neg = n < 0\n    ds = [int(d) for d in str(abs(n))]\n    if neg: ds[0] = -ds[0]\n    return sum(ds)`,
    naive: `def signed_checksum(n):\n    return sum(int(d) for d in str(abs(n)))` },
];

const rows = C.map((t) => ({
  task_id: "SIGNWRAP2/" + t.entry,
  entry_point: t.entry,
  prompt: t.spec + "\n\n    # Test di esempio (parziali):\n" + t.provided.map((l) => "    " + l).join("\n"),
  test: "def check(candidate):\n    " + t.entry + " = candidate\n" + t.hidden.map((l) => "    " + l).join("\n") + "\n",
}));
writeFileSync("eval/data/signwrap-variants.jsonl", rows.map((r) => JSON.stringify(r)).join("\n") + "\n");

// verifica trap-soundness: la ref CORRETTA passa gli hidden, il naive INGENUO li fallisce (altrimenti non è una trappola)
console.log("signwrap-variants.jsonl:", C.map((c) => c.entry).join(", "));
for (const t of C) {
  const test = rows.find((r) => r.entry_point === t.entry).test;
  const okRef = runPython(t.ref + "\n" + test + "\ncheck(" + t.entry + ")", { timeoutMs: 8000 }).ok;
  const okNaive = runPython(t.naive + "\n" + test + "\ncheck(" + t.entry + ")", { timeoutMs: 8000 }).ok;
  const sound = okRef && !okNaive;
  console.log(`${sound ? "OK " : "!! "}${t.entry}: ref ${okRef ? "PASS" : "FAIL"} | naive ${okNaive ? "PASS(non-trappola!)" : "FAIL(atteso)"}`);
}
