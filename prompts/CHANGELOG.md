# Changelog — Thinking Style Prompt

Versionamento del prompt che governa lo stile di ragionamento di Claude in questo progetto.
Ogni versione è un file separato (`thinking-style.v<N>.md`) per permettere confronto e rollback.

---

## v1 — 2026-05-05 — Baseline strutturato

**File:** [`thinking-style.v1.md`](./thinking-style.v1.md)

**Cosa introduce:**
- Divieto di pensiero discorsivo a flusso libero.
- Scheda di contesto obbligatoria all'apertura del thinking (`OBIETTIVO / INPUT NOTI / OUTPUT ATTESO / VINCOLI`).
- 5 blocchi di ragionamento ammessi: tabella check dati, decisione a confronto, piano a passi, albero di ipotesi, check di output pre-consegna.
- Marker di stato per ogni asserzione fattuale: `[V]` verificato, `[A]` assunto, `[?]` da verificare.
- Vincolo di lunghezza: il thinking deve essere più corto della risposta finale nel 90% dei casi.
- Eccezione esplicita per redesign / problemi nuovi.

**Motivazione:**
Riduzione del consumo token nel reasoning interno e taglio del rischio di allucinazione spingendo ogni asserzione a dichiarare la propria fonte/stato.

**Aperto in v1, da affrontare nelle prossime iterazioni:**
- Nessuna metrica concreta per misurare "token spesi proporzionali al valore" — è soggettivo.
- Manca un meccanismo di self-correction: se Claude si accorge di aver sgarrato a metà, cosa fa?
- Non specifica come comportarsi nei tool result lunghi (es. cosa estrarre, cosa scartare).
- Non c'è gestione esplicita di task multi-fase con stato persistente.
