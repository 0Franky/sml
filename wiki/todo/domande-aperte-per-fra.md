---
name: domande-aperte-per-fra
description: "🔴 REGISTRO delle domande aperte per Fra — si scrive QUI prima di mandarle su Telegram (regola sua, 2026-08-23: «segnare sempre le domande prima in locale sul file»). Ogni voce: contesto, fatto misurato, opzioni, reco. Quando risponde, la voce si chiude con la data e il numero del messaggio."
type: tracker
status: 🔴 aperto — 5 domande dal 2026-09-11
tags: [tracker, decisioni, telegram, area-processo]
last_updated: 2026-09-11
---

# 🔴 Domande aperte per Fra

> Una domanda che vive solo in chat sparisce alla prima compaction, e con lei la risposta quando arriva
> (l'API di Telegram non espone la cronologia). Per questo si scrive **qui prima**, e il hook
> `domanda-prima-sul-file-poi-su-telegram` blocca l'invio se questo file non c'è.

## Aperte

### D1 · Allineare il submodule `WillHouse/wiki/_core` a `origin/main`? — aperta 2026-09-11

- **Contesto**: `~/.claude/core-source` ora punta al clone standard (`../cc-wiki-core`), come deciso da Fra il 2026-09-11. Il submodule dentro WillHouse è il **pin di quel progetto** e la macchina non lo allinea più.
- **Fatto misurato**: il submodule è a `dfa22df`, **2 commit dietro** `origin/main` (`9681eec`, `558d140`). Nessun commit locale: sarebbe un fast-forward puro. WillHouse ha inoltre il **puntatore del submodule modificato e non committato** (55bbf5f → dfa22df, mosso oggi).
- **Opzioni**: (a) lo porto a `origin/main` (fast-forward, niente da perdere) e lui committa il bump in WillHouse quando vuole; (b) resta a `dfa22df` finché lavora su WillHouse.
- **Reco**: (a) — il suo principio è «non possono esistere due cloni divergenti, al più vanno allineati». Non lo faccio senza ok perché è il working tree di **un altro progetto** e oggi mi ha già detto che toccare quella cartella era sbagliato.

### D2 · La decisione `kubectl` di WillHouse nel vecchio file piatto — aperta 2026-09-11

- **Contesto**: `~/.claude/state/decisioni-pendenti.jsonl` (globale) non viene più letto: le decisioni pendenti sono per-progetto da `55bbf5f`.
- **Fatto misurato**: il file contiene **una** voce, `D-21t9lo0`, sul permesso `kubectl` verso il kubeconfig OVH di willhouse-sa e l'ssh all'host `st`. Appartiene a WillHouse, non a SLM.
- **Opzioni**: (a) la sposto in `~/.claude/state/progetti/WillHouse/decisioni-pendenti.jsonl` così ricompare nelle sessioni WillHouse; (b) la butto perché era un'autorizzazione usa-e-getta; (c) la scrive lui in `WillHouse/wiki/memory/decisions/` se vale anche domani.
- **Reco**: (a) — l'attribuzione è evidente dal testo, ma la regola che ho scritto dice che l'attribuzione la decide una persona: una parola sua e la sposto.

### D3 · `skills/remotion/SKILL.md` non versionato — aperta 2026-09-11

- **Contesto**: `check-install-drift` confronta `~/.claude` col bundle di core.
- **Fatto misurato**: è l'**unico** finding rimasto (`UNVERSIONED`): vive solo in `~/.claude/skills`, nessun repo ce l'ha. Se il disco muore, sparisce.
- **Opzioni**: (a) dargli casa in `cc-wiki-core/claude/skills/` (viene rispecchiato ovunque); (b) dichiararlo in `.claude/install-scope.json` con un `home` versionato altrove; (c) rimuoverlo se non serve più.
- **Reco**: (a) se lo usa; (c) se non lo usa. Non so quale.

### D4 · `AGENTS.md` non tracciato in slm (62 KB, «per Codex») — aperta 2026-09-11

- **Contesto**: il repo `0Franky/sml` è **pubblico**.
- **Fatto misurato**: file creato il 2026-09-11 alle 12:34, prima della mia sessione; è `CLAUDE.md` riscritto con «Questo file è per Codex». **Zero** path assoluti o username dentro (grep). Non tracciato.
- **Opzioni**: (a) tenerlo così → due libri di regole da 62 KB che divergeranno (la stessa famiglia della «seconda scrittura» di oggi); (b) ridurlo a poche righe che **puntano** a `CLAUDE.md`; (c) cancellarlo.
- **Reco**: (b), se Codex lo legge davvero.

### D5 · Il link dell'annuncio su Fable e lo «steering vector» — aperta 2026-09-11

- **Contesto**: Fra ha letto che usando Fable per creare nuovi modelli viene iniettato uno steering vector che degrada il ragionamento, e chiede se conviene Opus 5.
- **Fatto misurato**: una ricerca web (2026-09-11) **non trova** l'annuncio; trova che Fable 5 è la versione «Mythos-class» con salvaguardie e Mythos 5 quella ad accesso ristretto. Il vincolo **documentato** è contrattuale (uso degli output per addestrare modelli concorrenti) e vale per **entrambi** i modelli.
- **Opzioni**: (a) mi manda il link e lo leggo; (b) si procede con la difesa già in uso (verifiche indipendenti dall'onestà del modello), qualunque modello lavori.
- **Reco**: (a) + (b).

## Chiuse

*(nessuna ancora)*
