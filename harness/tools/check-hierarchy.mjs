#!/usr/bin/env node
/**
 * check-hierarchy — verifica DETERMINISTICA della gerarchia padre↔figlia nella tassonomia.
 *
 * PERCHE' ESISTE (#17: la lezione diventa meccanismo, non acknowledgment).
 * Utente 2026-07-16, sulla reciprocita' rotta al 25%: **"inaccettabile, non deve mai piu' accadere"**.
 * Una promessa non lo garantisce; un check che gira nella suite si'.
 *
 * IL DIFETTO CHE CATTURA
 *  - **legame a SENSO UNICO**: la figlia dichiara il padre, il padre non la elenca. Chi entra dal padre
 *    non trova mai la figlia → la gerarchia esiste solo meta' (viola #20: il padre insegna la radice UNA volta).
 *  - **padre FANTASMA**: la figlia dichiara un padre che non e' un file (es. "famiglia safety/protection").
 *  - **padre inesistente**: il file dichiarato non c'e'.
 *  - **padre AMBIGUO** *(2026-07-26)*: due marcatori nello stesso file indicano padri **diversi** e il tool
 *    sceglie in silenzio → **falso verde**. Ne aveva prodotto uno lungo 8 giorni, vedi §AMBIGUO sotto.
 *  - **conteggio-figlie a parole ≠ misurato** *(2026-07-26, INFO)*: il padre dice *"le due figlie"* e le
 *    figlie sono tre. Nasce da un evento che **non innesca nessuna revisione** — la nascita di una figlia
 *    rende stantio il padre, **sempre**. Non fallisce: distinguere una nota storica da una claim sullo
 *    stato corrente e' semantica (#24), e il tool si limita a **contare e affiancare**.
 *
 * ⚠️ TRE STATI, NON DUE — e la differenza decide l'exit code:
 *   1. **ROTTO** (senso-unico / padre fantasma / padre inesistente) → **errore**: e' un difetto reale.
 *   2. **ILLEGGIBILE** (padre in prosa libera, nessun marcatore) → **errore**: e' *"non lo so"*, e non lo so
 *      perche' il lavoro di forma non e' stato fatto. E' MIO da chiudere.
 *   3. **DA-DECIDERE** (marcato esplicitamente \`**Padre**: DA-DECIDERE\`) → **NON e' un errore**: e' uno stato
 *      *determinato* — sappiamo esattamente cosa manca (una decisione dell'utente) ed e' tracciato nei gate.
 * Perche' il 3 non fallisce (segnalato dall'agente su class-code-optimization, 2026-07-18): se le decisioni
 * pendenti tenessero il check **rosso in permanenza**, nessuno potrebbe piu' distinguere i rossi **azionabili**
 * da quelli **parcheggiati** → il rosso perde significato e viene ignorato, e un check ignorato non protegge
 * piu' nulla. Restano **elencati e contati** a ogni run: visibili, non silenziosi.
 * La differenza sostanziale col caso 2: *"non lo so"* ≠ *"lo so, ed e' in attesa di lui"*.
 *
 * ⚠️ "NON SO LEGGERLO" E' UN ERRORE, NON UNA NOTA (utente 2026-07-18: *"se il parser non legge il padre non
 * sarebbe meglio che torni errore?"* — ha ragione).
 * Prima versione: le classi senza marcatore riconosciuto finivano in un bucket informativo e il tool usciva
 * **0**. Cioe' dichiarava "0 rotti" mentre 20 legami su 47 erano semplicemente **IGNOTI** → falsa sicurezza,
 * ed e' lo **stesso difetto** del `grep -c` che ritorna 1 su zero-risultati: trattare *"non lo so"* come
 * *"va bene"*. Un check che non sa e tace e' peggio di nessun check, perche' produce fiducia.
 * Ora: `unparsed` e' **ERRORE** (exit 1) → l'unico modo di far passare la suite e' **standardizzare il
 * marcatore**, che e' il fix vero. Il rumore diventa pressione a sistemare invece che sfondo tollerato.
 *
 * COSA NON VERIFICA (dichiarato, non taciuto — #0)
 *  - se il padre e' quello GIUSTO: e' un giudizio di design, non meccanico. Questo tool garantisce che il
 *    legame sia DICHIARATO e RECIPROCO, non che sia corretto.
 *
 * USO
 *   node harness/tools/check-hierarchy.mjs            # report leggibile
 *   node harness/tools/check-hierarchy.mjs --json
 *   exit 0 = nessun legame rotto · exit 1 = rotti (usabile in CI / pre-commit)
 */
import { readdirSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";

const ROOT = resolve(dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..", "..");
const TAX = `${ROOT}/wiki/training-taxonomy`;

/**
 * Marcatori con cui una figlia dichiara il proprio padre, **in ordine di autorita'**.
 * Il primo che matcha vince — ed e' proprio li' che si nascondeva un falso verde di 8 giorni.
 */
const PARENT_PATTERNS = [
  ["Padre-marker",   /\*\*Padre(?:-skill)?\*\*\s*[:(]?\s*\[\[([^\]|]+)/i],
  ["Padre-backtick", /\*\*Padre(?:-skill)?\*\*\s*[:(]?\s*`?(class-[a-z0-9-]+)/i],
  ["prosa-figlia",   /figlia\s+(?:diretta\s+)?di\s+\[\[([^\]|]+)/i],
  // "figlia (a) di [[...]]" — la forma usata dopo il re-home 2026-07-18, che NESSUN pattern vedeva.
  // Aggiunta il 2026-07-26: la sua assenza e' meta' della causa del falso verde (vedi §AMBIGUO sotto).
  // `\*{0,2}` dopo ogni pezzo perche' nel testo reale la forma e' in grassetto: "**figlia (a)** di [[...]]"
  // e "**figlia (a)** del nodo intermedio **[[...]]**". Senza, il pattern non aggancia proprio il file
  // che ha causato il falso verde — verificato eseguendo, non assunto.
  ["prosa-figlia-lettera", /figlia\s*\([a-z]\)\*{0,2}\s*(?:del\s+nodo\s+intermedio\s+)?(?:di\s+)?\*{0,2}\[\[([^\]|]+)/i],
  ["prosa-ordinale", /\d+[ªa]\s+figlia\s+di\s+\[\[([^\]|]+)/i],
];

const norm = (s) => String(s).trim().replace(/^.*\//, "").replace(/\.md$/, "").toLowerCase();

// PERIMETRO: ogni file che DICHIARA un padre, non solo quelli chiamati `class-*`.
// Prima filtrava `startsWith("class-")` e perdeva `gold-example-transfer-assumption-audit.md`,
// che dichiara `**Padre**: [[class-metacognitive-self-audit]]` ed E' una classe a tutti gli
// effetti (CLAUDE.md #20 la elenca fra le figlie): il suo legame non e' MAI stato verificato,
// e il verde del checker significava "non l'ho guardata", non "va bene" (2026-07-25).
// Vedi wiki/training-taxonomy/class-instrument-coverage-scope.md.
const files = readdirSync(TAX).filter((f) => f.endsWith(".md") &&
  (f.startsWith("class-") || /\*\*Padre(?:-skill)?\*\*\s*:?\s*\[\[/i.test(readFileSync(`${TAX}/${f}`, "utf8"))));
// Il criterio e' `**Padre**:` SEGUITO DA UN WIKILINK — cioe' chi DICHIARA una parentela, non chi
// nomina la parola. Tarato misurando i falsi positivi, non a intuito: il solo "**Padre**" nel testo
// prendeva `dataset-construction-playbook.md` (parla di padri senza esserne uno); il `type:` del
// frontmatter prendeva 18 gold-example di area, che un padre gerarchico non ce l'hanno per
// costruzione. Il caso reale da recuperare era UNO: gold-example-transfer-assumption-audit.
const bodies = new Map();
for (const f of files) bodies.set(norm(f), readFileSync(`${TAX}/${f}`, "utf8"));

const declared = [];   // { child, parent, raw }
const unparsed = [];   // nessun marcatore → "non lo so": ERRORE, lavoro di forma non fatto
const undecided = [];  // `**Padre**: DA-DECIDERE` → stato DETERMINATO in attesa dell'utente: elencato, non fallisce
const roots = [];
/**
 * AMBIGUO — due marcatori nello stesso file indicano padri DIVERSI (aggiunto 2026-07-26).
 *
 * IL FALSO VERDE CHE HA PRODOTTO, ed e' durato 8 giorni.
 * `class-tool-perception-fidelity` ha subito un re-home il 2026-07-18: da figlia di
 * `metacognitive-self-audit` a figlia di `instrument-epistemic-reach`. Il banner che documenta lo
 * spostamento contiene, in ordine, **«Prima**: figlia diretta di [[class-metacognitive-self-audit]]»
 * e «**Ora**: figlia (a) del nodo intermedio [[class-instrument-epistemic-reach]]». Il vecchio parser
 * matchava **la prima** — una frase **storica**, esplicitamente marcata come passata — e non aveva
 * **nessun** pattern per la forma «figlia (a) di», cioe' per quella **corrente**. Risultato: da 8 giorni
 * il tool registrava la classe sotto il **nonno**, e usciva **verde**, perche' il nonno la elenca
 * ancora (per ragioni storiche). Il check rispondeva perfettamente a *"esiste un legame dichiarato e
 * reciproco?"* — che **non e'** la domanda che conta, cioe' *"il padre CORRENTE e' quello giusto?"*.
 *
 * ⚠️ PERCHE' E' ERRORE E NON NOTA: quando due marcatori discordano, il tool **non lo sa** — sceglie per
 * ordine di autorita', che e' una convenzione, non una prova. E' esattamente il caso 2 del §TRE STATI
 * gia' codificato qui sopra (*"non lo so" ≠ "va bene"*), e l'unico fix vero e' **dichiarare `**Padre**:`
 * esplicitamente**, che risolve l'ambiguita' alla fonte invece di farla arbitrare a una regex.
 *
 * ⚠️ NON risolvibile per via semantica (#24): capire che «Prima:» introduce uno stato passato e «Ora:»
 * quello presente **e' comprensione del linguaggio**, non pattern-matching — e infilare "Prima" in una
 * lista di parole-da-ignorare sarebbe la pezza che #24 vieta (funzionerebbe per i casi previsti, e per
 * nessun altro). Il tool fa la cosa strutturale: **si accorge di non sapere, e lo dice**.
 */
const ambigui = [];
/** Dipende SOLO dalla prosa: leggibile ma fragile — la prosa cambia, il marcatore no. Informativo. */
const prosaOnly = [];

for (const f of files) {
  const child = norm(f);
  const src = bodies.get(child);
  // una radice si auto-dichiara
  if (/Classe-PADRE\s*\(radice\)|\bradice\b.*\bnessun padre\b/i.test(src.slice(0, 2500))) { roots.push(child); continue; }

  // DA-DECIDERE va riconosciuto PRIMA dei pattern normali: e' una dichiarazione esplicita di non-decisione,
  // non un'assenza di dichiarazione.
  if (/\*\*Padre(?:-skill)?\*\*\s*[:(]?\s*DA-DECIDERE/i.test(src)) { undecided.push(child); continue; }

  // Si raccolgono TUTTI i candidati, non solo il primo: se due marcatori indicano padri DIVERSI,
  // il tool sta **tirando a indovinare** e deve dirlo (vedi §AMBIGUO).
  const hits = [];
  for (const [nome, re] of PARENT_PATTERNS) {
    const m = src.match(re);
    if (m) hits.push({ nome, parent: norm(m[1]), raw: m[0].replace(/\s+/g, " ").slice(0, 90) });
  }
  if (!hits.length) { unparsed.push(child); continue; }

  const distinti = [...new Set(hits.map((h) => h.parent))];
  const autorevole = hits[0];                       // l'ordine di PARENT_PATTERNS e' l'autorita'
  // ⚠️ L'ambiguita' e' un difetto SOLO in assenza di un `**Padre**:` esplicito. Con il marcatore la
  //    questione e' CHIUSA — quello E' il contratto — e la prosa che nomina il nonno ("figlia della
  //    2a figlia di X") e' narrativa legittima, non una dichiarazione concorrente. Segnalarla comunque
  //    terrebbe il check rosso in permanenza su file corretti → il rosso perde significato e viene
  //    ignorato: stesso argomento gia' usato qui per il bucket DA-DECIDERE. Misurato: senza questa
  //    clausola i flag sono 4, di cui 1 (temporal-order-from-timestamp) gia' risolto dal marcatore.
  const haMarcatore = hits.some((h) => h.nome.startsWith("Padre"));
  if (distinti.length > 1 && !haMarcatore) {
    ambigui.push({ child, scelto: autorevole.parent, via: autorevole.nome,
                   alternative: hits.filter((h) => h.parent !== autorevole.parent)
                                    .map((h) => `${h.nome}=${h.parent}`) });
  }
  declared.push({ child, parent: autorevole.parent, raw: autorevole.raw });
  if (!hits.some((h) => h.nome.startsWith("Padre"))) prosaOnly.push(child);
}

/**
 * Una figlia NON RATIFICATA (⛔ NON VALIDATA / STATO: PROPOSTA) che il padre non elenca **non e' un difetto**:
 * e' lo stato CORRETTO. Scriverla nella tabella-figlie di un padre validato **asserirebbe una ratifica che non
 * esiste** (#26) — e un padre lo dice pure a chiare lettere: *"non pre-costruiamo la gerarchia a priori"*.
 * Ripararlo renderebbe verde il check al prezzo di far dire alla wiki una cosa che nessuno ha deciso: e' il
 * **padre-inventato un livello piu' in la'**.
 * → va nel bucket "in attesa dell'utente", non fra i rotti. (Segnalato dall'agente su compositional-reversibility,
 *   2026-07-18; verificato: **4/4** i senso-unico di allora erano figlie non ratificate.)
 */
const isUnratified = (slug) => /NON VALIDATA|STATO:\s*PROPOSTA|—\s*PROPOSTA|attende (ok|ratifica)/i.test((bodies.get(slug) ?? "").slice(0, 3000));

const problems = [];
for (const d of declared) {
  if (!bodies.has(d.parent)) {
    problems.push({ kind: d.parent.startsWith("class-") ? "padre-inesistente" : "padre-FANTASMA", child: d.child, parent: d.parent, raw: d.raw });
    continue;
  }
  // reciprocita': il padre nomina la figlia?
  if (!bodies.get(d.parent).toLowerCase().includes(d.child)) {
    if (isUnratified(d.child)) undecided.push(`${d.child} → ${d.parent} (figlia non ratificata: il padre NON deve elencarla finche' non e' approvata)`);
    else problems.push({ kind: "senso-unico", child: d.child, parent: d.parent, raw: d.raw });
  }
}

/**
 * CONTEGGIO-FIGLIE dichiarato a PAROLE vs MISURATO (aggiunto 2026-07-26, #17).
 *
 * PERCHE': trasferendo F2 ho trovato a mano **3 affermazioni stantie** nel padre
 * `instrument-epistemic-reach`, tutte prodotte dallo stesso evento — la nascita di una terza figlia —
 * e nessuna intercettata da niente: il §GAP-SCAN diceva ancora *"posizione 3 SCOPERTA"* mentre la
 * tabella dodici righe sopra la dava coperta, e *"le DUE figlie"* compariva in tre punti. Erano tutte
 * **vere il giorno in cui furono scritte**: e' decadenza-senza-innesco, e **creare o spostare un nodo
 * rende stantio il padre, SEMPRE**.
 *
 * COSA FA: cerca nel file-padre le affermazioni **numeriche** sulle proprie figlie e le mette accanto
 * al numero **misurato** dai legami. Un `2` dove le figlie sono `3` salta all'occhio in un secondo.
 *
 * ⚠️ TASSO DI SEGNALE **MISURATO**, non promesso (2026-07-26, prima applicazione su tutto il corpus):
 * su **8** segnalazioni → **2 stantie vere** (`ground-truth-integrity` diceva *due* figlie e ne ha
 * **quattro**; `situational-awareness` descriveva una famiglia di **cinque** e ne ha **nove**) · **1
 * falso positivo** (soggetto = una terza classe) · **5 legittime**: storiche, ipotetiche, o descrizioni
 * **parziali** (*"le prime 4 figlie…"* non e' un totale). **Circa 1 su 4 e' azionabile.**
 * → **il valore e' stato reale ma in gran parte ONE-SHOT**: ha ripulito uno stantio accumulato che
 * nessun altro controllo vedeva. A regime mostrera' per lo piu' righe gia' note e legittime. Si tiene
 * perche' e' **silenzioso quando i conti tornano** e costa zero leggerlo — ma **chi lo consulta deve
 * sapere che la maggioranza delle righe NON e' un difetto**, altrimenti si abitua a ignorarlo, ed e'
 * il modo in cui un controllo muore.
 *
 * ⚠️ PERCHE' E' INFO E NON ERRORE — e non e' timidezza, e' il confine di #24.
 * Distinguere *"il padre HA due figlie"* (claim sullo stato corrente, da correggere) da *"l'utente
 * approvo' il nodo con quelle due figlie"* (registrazione storica, **corretta cosi'**) e' **semantica**,
 * e la semantica non si fa con una regex — sarebbe la pezza che la regola #24 vieta. Il tool fa la sola
 * cosa che sa fare in modo affidabile: **conta e affianca**. Adjudica l'umano, in due secondi.
 * Farlo fallire produrrebbe rossi permanenti sulle note storiche → il rosso perde significato e viene
 * ignorato, esattamente l'argomento gia' usato qui sopra per il bucket DA-DECIDERE.
 */
const NUM = { due: 2, tre: 3, quattro: 4, cinque: 5, sei: 6 };
const kids = new Map();
for (const d of declared) {
  if (!bodies.has(d.parent)) continue;
  if (!kids.has(d.parent)) kids.set(d.parent, new Set());
  kids.get(d.parent).add(d.child);
}
const countClaims = [];
for (const [parent, set] of kids) {
  const real = set.size;
  const src = bodies.get(parent) ?? "";
  // ⚠️ PERIMETRO — il corpus non dice solo "figlie": dice anche **direzioni · posizioni · facce · poli**
  //    quando enumera i rami di un padre. La prima versione cercava la sola parola "figlie" e cosi' non
  //    vedeva la frase-radice di `ground-truth-integrity` (*"le figlie sono le DUE DIREZIONI in cui si
  //    applica"*), rimasta stantia con **quattro** figlie. Trovata a mano, non dal tool: e' la stessa
  //    forma di difetto che il corpus chiama *copertura dello strumento* — il controllo rispondeva a
  //    *"si dice «due figlie»?"* invece che a *"si enumera male la famiglia?"*.
  //
  // ⚠️ MA ALLARGARE NON E' GRATIS — e la misura lo ha detto subito. Il primo tentativo includeva anche
  //    **facce · posizioni · poli** e il conteggio e' passato **7 → 24**, quasi tutti FALSI: in questo
  //    corpus *"facce"* sono gli **aspetti INTERNI** di una classe, non le sue figlie (`right-effort`
  //    ha **4 facce e 1 figlia**, ed e' corretto), e *"posizioni"* sono le caselle di un **asse**, che
  //    puo' averne piu' delle figlie che lo coprono (`instrument-epistemic-reach`: **4 posizioni, 3
  //    figlie**, e la quarta e' dichiarata coperta altrove). **Si era allargato dentro un altro
  //    SIGNIFICATO**, non dentro piu' copertura. Restano `figlie` e `direzioni`, che nel corpus
  //    enumerano davvero i rami di un padre.
  const re = /(?:\b(due|tre|quattro|cinque|sei|\d+)\s+(?:figli[ea]|direzioni)\b|\bpadre\s+di\s+(due|tre|quattro|cinque|sei|\d+)\b|\b(entrambe)\s+le\s+(?:figlie|direzioni)\b)/gi;
  const seen = new Set();
  // ⚠️ MENZIONE ≠ USO — e la distinzione e' PUNTEGGIATURA, non semantica (quindi lecita per #24).
  //    Un conteggio dentro le virgolette e' **citato**, non **asserito**: e' cosi' che si scrivono le
  //    note di correzione (*«diceva «le due figlie»…»*) e le citazioni storiche. Senza questo filtro
  //    il tool segnala **la prosa che spiega la correzione** — ci sono cascato TRE volte in un giorno,
  //    e la regola *"non ri-citare la forma sbagliata"* non ha retto: se una regola si viola tre volte,
  //    non serve ripeterla, serve renderla **non-necessaria** (#17). Qui lo diventa.
  const srcVisibile = src
    .replace(/«[^»]*»/g, " ")            // citazione a caporali
    .replace(/\*"[^"]*"\*/g, " ")        // citazione in corsivo-virgolette
    .replace(/~~[^~]*~~/g, " ");         // testo barrato = storico per convenzione
  for (const m of srcVisibile.matchAll(re)) {
    const tok = (m[1] ?? m[2] ?? m[3] ?? "").toLowerCase();
    const said = tok === "entrambe" ? 2 : (NUM[tok] ?? Number(tok));
    if (!Number.isFinite(said) || said === real) continue;      // silenzioso quando combacia
    const frase = m[0].replace(/\s+/g, " ");
    if (seen.has(frase)) continue;
    seen.add(frase);
    countClaims.push({ parent, said, real, frase });
  }
}

/**
 * PARENTELA DICHIARATA A PAROLE vs MISURATA (aggiunto 2026-07-26, #17).
 *
 * PERCHE': `class-prospective-obligation-discharge` chiamava `class-durable-knowledge-retraction`
 * *"gemella della famiglia-memoria"* — ma il grafo dice che quella e' sorella del **padre**, cioe' la
 * **ZIA**. E' la **seconda** istanza dello stesso errore (la prima era gia' stata corretta su un altro
 * call-site dello stesso file), e il grafo che la smentisce **lo abbiamo gia' calcolato qui sopra**.
 * Un testo che sbaglia la parentela **insegna la gerarchia sbagliata** — che e' precisamente cio' che
 * la regola #20 esiste per evitare.
 *
 * ⚠️ INFO E NON ERRORE — e' il confine di #24. *"sorella"* nel corpus e' **anche** una metafora
 * legittima (*"sorella di metodo"*, *"sorella-speculare"*, *"la sorella che tiene il confine"*):
 * distinguere la **claim di parentela** dall'**analogia** e' comprensione del linguaggio, non
 * pattern-matching. Il tool fa la cosa che sa fare: **affianca la parola alla parentela misurata**
 * quando le due divergono. Adjudica l'umano.
 *
 * TARATURA — ogni passo e' un numero MISURATO, mai un'opinione: **116 → 125 → 32 → 9 → 7 → 1**.
 *  - **116 → 125**: la "correzione" della direzione ha fatto **SALIRE** il rumore. Non serviva piu'
 *    filtro: avevo invertito **entrambe** le forme. *Un numero che si muove nel verso sbagliato dice
 *    che stai misurando un'altra cosa* — e' la stessa spia gia' vista due volte oggi.
 *  - **→ 32**: verso giusto. Convenzione unica: `k(a,b)` = «**b e' il k di a**»; "k **di** [[X]]" = io
 *    sono k di X; "[[X]] (**k**)" = X e' k di me.
 *  - **→ 9**: filtro METAFORE — si segnala solo se il grafo dice **un'altra parentela nota**. Nessuna
 *    relazione ⇒ e' un'analogia legittima (*"sorella di metodo"*), e segnalarla affogherebbe i veri.
 *  - **→ 7**: vietati i **segni di rottura di frase** fra la parola e il "di". Era l'artefatto che non
 *    sapevo spiegare, e strumentando si e' rivelato **mio**: `"padre (§GAP-SCAN(b) di [[X]]"`, dove il
 *    "di" lega **§GAP-SCAN(b)** a X, non "padre" a X. La finestra faceva da **ponte fra due sintagmi**.
 *  - **→ 1**: le 7 segnalazioni superstiti erano **tutte VERE** (7/7) e sono state corrette nei testi.
 *
 * ⚠️ RESIDUO — ora **CARATTERIZZATO**, non piu' ignoto. Ne resta **1**, ed e' un limite di principio:
 * il **soggetto** della frase puo' essere un **terzo nodo**, non il file ne' il link. Es. in
 * `class-constraint-fit-decision` la riga *"…a sua volta **padre di** [[class-code-optimization]]"*
 * parla di **right-effort-for-stakes**, ed e' **CORRETTA** — ma il tool attribuisce la claim al file.
 * Capire chi sia il soggetto e' comprensione del linguaggio (#24), non pattern-matching → **si dichiara,
 * non si aggiusta con una regex**. Per questo resta **INFO e non gate**.
 *
 * ⚠️ TRAPPOLA PER CHI CORREGGE (pagata due volte oggi, qui e in `check-decontamination`): **non
 * ri-citare la forma sbagliata nella riga che stai correggendo** — il rilevatore flagghera' la tua
 * stessa spiegazione. Scrivi *"parentela corretta il <data> sul grafo misurato"*, non *"era «sorella»"*.
 */
const padreDi = new Map(declared.map((d) => [d.child, d.parent]));
const parentele = [];
const KIN = [
  ["sorella", (a, b) => padreDi.get(a) && padreDi.get(a) === padreDi.get(b)],
  ["zia",     (a, b) => padreDi.get(padreDi.get(a)) && padreDi.get(padreDi.get(a)) === padreDi.get(b)],
  ["nonno",   (a, b) => padreDi.get(padreDi.get(a)) === b],
  ["padre",   (a, b) => padreDi.get(a) === b],
  ["figlia",  (a, b) => padreDi.get(b) === a],
];
// ⚠️ LA DIREZIONE E' NELLA PREPOSIZIONE, e la prima versione la ignorava: `figlia DI [[X]]` significa
//    *"IO sono figlia di X"*, non *"X e' mia figlia"*. Leggendole tutte nello stesso verso il tool ha
//    prodotto **116** segnalazioni quasi tutte false — e un controllo cosi' rumoroso e' **peggio di
//    nessun controllo**, perche' produce l'apparenza della copertura e insegna a saltarlo (stesso
//    argomento gia' usato qui per il bucket DA-DECIDERE). Due forme, due versi:
const FORME = [
  // "<parola> di [[X]]"  →  IO sono <parola> DI X
  // ⚠️ Fra la parola e il "di" NON puo' esserci un segno di ROTTURA DI FRASE (`§ ; — , :` o una
  //    parentesi APERTA che non sia il marcatore di figlia `(a)`). Senza questo vincolo la finestra
  //    fa da PONTE fra due sintagmi diversi e il "di" lega la cosa sbagliata — artefatto reale,
  //    trovato strumentando: `"padre (§GAP-SCAN(b) di [[X]]"`, dove il "di" lega **§GAP-SCAN(b)** a X,
  //    non "padre" a X. Era l'unica segnalazione che non sapevo spiegare, ed era un mio falso positivo.
  [/\b(sorella|zia|nonno|padre|figlia)\b(?:\s*\([a-z]\))?[^\n\[§;—,:()]{0,12}?\bd(?:i|el|ella|elle)\b\s*\*{0,2}\[\[([^\]|#]+)/gi, false],
  // "[[X]] (<parola>"    →  X e' <parola> DI ME  → verso invertito
  [/\[\[([^\]|#]+)\]\]\s*[(（]\s*\*{0,2}(sorella|zia|nonno|padre|figlia)\b/gi, true],
];
for (const [self, src] of bodies) {
  for (const [re, invertito] of FORME) {
    for (const m of src.matchAll(re)) {
      const parola = (invertito ? m[2] : m[1]).toLowerCase();
      const altro = norm(invertito ? m[1] : m[2]);
      if (!bodies.has(altro) || altro === self) continue;
      const regola = KIN.find(([k]) => k === parola);
      if (!regola) continue;
      // ⚠️ CONVENZIONE UNICA delle regole KIN: `k(a, b)` si legge **«b e' il k di a»**.
      //    - forma "k **di** [[X]]"  = *io sono k di X*      → b = IO,    a = X
      //    - forma "[[X]] (**k**)"   = *X e' il k di me*     → b = X,     a = IO
      //    Le avevo scritte **entrambe al contrario** e il rumore e' salito da 116 a 125 — cioe' il
      //    segnale si muoveva nella direzione sbagliata, che e' la stessa spia gia' vista oggi.
      const [a, b] = invertito ? [self, altro] : [altro, self];
      if (regola[1](a, b)) continue;                               // silenzioso quando combacia
      const vera = KIN.find(([, f]) => f(a, b));
      // ⚠️ Si segnala SOLO quando il grafo dice **un'ALTRA parentela nota**. Se non ce n'e' NESSUNA,
      //    la parola e' quasi certamente una **metafora** — nel corpus abbondano *"sorella di metodo"*,
      //    *"sorella-speculare"*, *"la sorella che tiene il confine"* fra classi senza legame di grafo.
      //    Segnalarle per sempre affogherebbe i casi veri, ed e' l'argomento gia' usato qui per il
      //    bucket DA-DECIDERE: un segnale rumoroso viene ignorato, e allora non protegge piu' nulla.
      if (!vera) continue;
      parentele.push({ self, altro, parola, invertito, vera: vera[0] });
    }
  }
}
const parenteleUniche = [...new Map(parentele.map((x) => [`${x.self}|${x.altro}|${x.parola}`, x])).values()];

const byKind = (k) => problems.filter((p) => p.kind === k);
const asJson = process.argv.includes("--json");

if (asJson) {
  console.log(JSON.stringify({ stats: { classes: files.length, roots: roots.length, links: declared.length, broken: problems.length, unparsed: unparsed.length, undecided: undecided.length, ambigui: ambigui.length, prosaOnly: prosaOnly.length, countClaims: countClaims.length }, problems, unparsed, undecided, ambigui, prosaOnly, countClaims, roots }, null, 2));
} else {
  for (const k of ["padre-FANTASMA", "padre-inesistente", "senso-unico"]) {
    const g = byKind(k);
    if (!g.length) continue;
    console.log(`\n${k === "senso-unico" ? "🟠" : "🔴"} ${k.toUpperCase()} — ${g.length}`);
    for (const p of g) {
      console.log(`   ${p.child}`);
      console.log(`      dichiara padre: ${p.parent}${k === "senso-unico" ? "  → ma il padre NON la elenca" : "  → non e' un file di classe"}`);
    }
  }
  if (ambigui.length) {
    console.log(`\n🔴 PADRE AMBIGUO — ${ambigui.length} (due marcatori, padri DIVERSI: il tool sta indovinando)`);
    console.log(`   Fix: aggiungi un **Padre**: [[class-nome]] esplicito → risolve alla fonte.`);
    for (const a of ambigui) {
      console.log(`   ${a.child}`);
      console.log(`      scelto ${a.scelto} (via ${a.via}) · ma il file dice anche: ${a.alternative.join(" · ")}`);
    }
  }
  if (unparsed.length) {
    console.log(`\n🔴 PADRE NON LEGGIBILE — ${unparsed.length} (NON verificate: "non lo so" ≠ "va bene")`);
    console.log(`   Il padre e' dichiarato in prosa libera. Usa un marcatore riconosciuto:`);
    console.log(`     **Padre**: [[class-nome]]      oppure      figlia di [[class-nome]]`);
    console.log(`   (o marca la classe come radice: "Classe-PADRE (radice)")`);
    console.log("   " + unparsed.join(" · "));
  }
  if (undecided.length) {
    console.log(`\n🟡 PADRE DA-DECIDERE — ${undecided.length} (in attesa dell'utente: NON un difetto, elencati per non dimenticarli)`);
    console.log("   " + undecided.join(" · "));
  }
  if (parenteleUniche.length) {
    console.log(`\nℹ️  PARENTELA a parole ≠ misurata — ${parenteleUniche.length} (NON un errore: "sorella di metodo" è metafora legittima)`);
    console.log(`   Una CLAIM di parentela sbagliata insegna la gerarchia sbagliata (#20); un'ANALOGIA no. Adjudica tu.`);
    for (const p of parenteleUniche)
      console.log(`   ${p.self}: chiama ${p.altro} «${p.parola}» — misurata: ${p.vera}`);
  }
  if (countClaims.length) {
    console.log(`\nℹ️  CONTEGGIO-FIGLIE a parole ≠ misurato — ${countClaims.length} (NON un errore: adjudica tu, in due secondi)`);
    console.log(`   Una nota STORICA ("l'utente approvo' il nodo con quelle due figlie") e' corretta cosi' e va lasciata.`);
    console.log(`   Una claim sullo STATO CORRENTE ("le due figlie lo istanziano") e' stantia e va corretta.`);
    for (const c of countClaims) console.log(`   ${c.parent}: dice "${c.frase}" ma le figlie misurate sono ${c.real}`);
  }
  const total = problems.length + unparsed.length + ambigui.length;
  console.log(`\n${files.length} classi · ${roots.length} radici · ${declared.length} legami verificati · ` +
    `${problems.length} rotti (${byKind("senso-unico").length} senso-unico, ${byKind("padre-FANTASMA").length} fantasma) · ` +
    `${ambigui.length} ambigui · ${unparsed.length} illeggibili · ${undecided.length} in attesa di decisione` +
    (prosaOnly.length ? ` · ${prosaOnly.length} dichiarati solo in prosa (leggibili ma fragili)` : ""));
  console.log(total
    ? `❌ ${total} DA SISTEMARE (${problems.length} rotti + ${unparsed.length} illeggibili + ${ambigui.length} ambigui)` + (undecided.length ? `  —  ${undecided.length} parcheggiati, non contano` : "")
    : `✅ ogni legame verificato e reciproco` + (undecided.length ? `  —  restano ${undecided.length} in attesa di una tua decisione` : ""));
}

// Rotti, illeggibili E ambigui falliscono: un legame che non so leggere — o che leggo in DUE modi
// diversi — non e' un legame verificato (#0). L'ambiguo e' il piu' insidioso dei tre, perche' passava
// per verde: il tool sceglieva in silenzio e rispondeva a una domanda diversa da quella che contava.
process.exit(problems.length + unparsed.length + ambigui.length ? 1 : 0);
