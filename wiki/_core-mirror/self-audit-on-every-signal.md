---
name: self-audit-on-every-signal
description: "COPIA della regola-di-lavoro (SSOT nel wiki-core condiviso PRIVATO) — ogni segnale, problema O apprezzamento, apre un self-audit"
type: rule-mirror
tags: [meta, self-audit, mirror, lessons-learned]
last_updated: 2026-07-24
---

> ## 📋 COPIA — la SSOT vive nel wiki-core condiviso (repo PRIVATO, non linkabile da qui)
> Questo repo è **PUBBLICO**: non può contenere un submodule né l'URL del repo privato (decisione utente
> 2026-07-24, dopo che avevo erroneamente montato il wiki-core come submodule qui). Le regole-di-lavoro
> condivise si **COPIANO** come contenuto quando servono anche al progetto SLM.
> ⚠️ **Se modifichi la regola, modificala nella SSOT** (wiki-core, `content/memory/rules/meta/`) e poi
> ri-sincronizza questa copia — **mai il contrario**: due sorgenti che divergono in silenzio sono il difetto
> che questa disciplina esiste per evitare.


# Ogni segnale — problema O apprezzamento — apre un self-audit

Quando emerge un **problema** (un tuo errore, un difetto, una correzione dell'utente) **non fermarti a riparare l'istanza**. E quando arriva un **apprezzamento esplicito** (*"questo mi piace, lo voglio"*) **non limitarti a ringraziare**. Entrambi sono **segnali sul sistema**, non eventi isolati: apri un **self-audit** e chiudilo dove la conoscenza persiste.

**Non è un rito di fine sessione** ([[memory/rules/meta/propagate-lessons-end-of-session]] copre quello): scatta **nel momento** in cui il segnale arriva, mentre il contesto è ancora caldo e verificabile.

## Why

Riparare l'istanza e andare avanti lascia intatta la **causa**: lo stesso difetto ricompare in un'altra forma, e la seconda volta costa di più perché nel frattempo ci si è costruito sopra. Un errore corretto senza audit è un errore **rimandato**.

Il polo positivo è meno ovvio ma vale uguale: un comportamento **apprezzato** è un requisito che l'utente ha appena espresso. Se non lo si cattura dove la conoscenza vive, resta un caso fortunato — e sparirà alla prossima occasione, perché nulla lo rende ripetibile. **Il complimento è un requisito travestito da cortesia.**

## How to apply

Alla comparsa del segnale, rispondi a queste domande **prima** di proseguire:

1. **Cosa l'ha permesso / cosa l'ha prodotto?** Non *cosa è andato storto*, ma **quale controllo mancava** (o quale ha funzionato).
2. **Le verifiche che avevo fatto potevano scoprirlo?** Se erano tutte corrette e nessuna poteva coglierlo, il difetto è nella **domanda saltata**, non nell'esecuzione — ed è quello il vero oggetto dell'audit.
3. **È sistemico?** Cerca **altre occorrenze dello stesso pattern** dove non è ancora esploso. Un difetto trovato in un punto è un'ipotesi da testare altrove.
4. **Dove va scritto perché non dipenda dalla memoria?** Una regola, un test, un controllo automatico — qualcosa che **lo esegua al posto tuo**. Un proposito non è un meccanismo.
5. **Il sistema di conoscenza persistente è allineato?** Verifica che sia **aggiornato, completo e ben strutturato** rispetto a questo segnale: che il caso ci sia, che sia nel posto giusto, che non contraddica ciò che c'è già, e che non sia già coperto altrove (evita il doppione).

Il polo positivo usa **le stesse cinque domande**, con il segno invertito: *cosa ha prodotto il comportamento buono, è riproducibile o è stato un caso, è catturato dove serve?*

## Anti-pattern

- **Riparare e proseguire**: l'istanza è chiusa, la causa no.
- **"Me lo ricorderò"**: un proposito non è un meccanismo. Se non c'è un artefatto che lo fa rispettare, non esiste.
- **Ringraziare per il complimento e basta**: si è appena persa la cattura di un requisito.
- **Audit come cerimonia**: cinque domande con risposte generiche e nessuna azione. Se non produce né una modifica né un "verificato, nessun gap", non è stato fatto.
- **Fermarsi alla prima occorrenza** senza cercare lo stesso pattern altrove.
- **Rimedio sproporzionato**: misura l'estensione reale del problema prima di calibrare la risposta — né panico né minimizzazione.

## Auto-detection triggers

- L'utente ti corregge, ti ferma, o dice *"no, fermo"*.
- Trovi un difetto tuo, anche piccolo, anche già riparato.
- L'utente dice *"questo mi piace / lo voglio / bravo"* su un comportamento specifico.
- Stai per dire *"ok, sistemato"* e passare oltre.
- Ti accorgi che una verifica che avevi fatto **non poteva** cogliere il problema.
