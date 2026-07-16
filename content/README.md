# content/eventi.json

Eventi storici estratti da `tavole_cronologiche.pdf` (Fase 0 del piano, vedi `PLAN.md`).

## Come è stato generato

Il PDF ha un layout a colonne parallele (Cultura Latina | Storia Romana | Storia e
Cultura Greca) impaginato con font proporzionale: `pdftotext` da solo non basta perché
le colonne si sovrappongono e i confini non sono affidabili su base carattere.

`estrai_eventi.py` invece parte da `pdftohtml -xml`, che espone le coordinate reali
(in punti) di ogni riga di testo. Da lì:

- le colonne sono individuate dalla posizione x delle intestazioni ("CULTURA LATINA",
  "STORIA ROMANA", ecc.) sulla singola pagina;
- l'inizio di ogni voce è riconosciuto dal fatto che l'anno è in **grassetto**
  (font semibold nel PDF originale);
- le fasce di secolo ("Secoli VIII-IV a.C." ecc.) sono lette dal testo ruotato a
  margine pagina (larghezza `width="0"` nell'XML, essendo verticale);
- il passaggio a.C./d.C. nella fascia "Secoli I a.C.-I d.C." è dedotto osservando
  quando la sequenza degli anni smette di decrescere e ricomincia a crescere.

Per rigenerare il file: `python3 estrai_eventi.py tavole_cronologiche.xml eventi.json`
(l'XML si ottiene con `pdftohtml -xml -i tavole_cronologiche.pdf tavole_cronologiche.xml`).

## Schema di un evento

```json
{
  "anno": -814,           // intero con segno, a.C. negativo, ordinabile
  "annoRaw": "814",       // testo originale (es. "ca. 590", "21-4-754")
  "approssimato": false,  // true se preceduto da "ca."
  "ambito": "romano",     // "romano" | "greco"
  "tipo": "storia",       // "storia" | "cultura" | "misto"
  "banda": "Secoli VIII-IV a.C.",
  "testo": "..."
}
```

## Copertura e limiti noti

- 815 eventi, dal -814 (fondazione leggendaria di Roma/Cartagine) all'800 d.C.
  (incoronazione di Carlo Magno) — il PDF copre letteratura greca e latina, non
  arriva al volgare/Dante: andrà esteso con altre fonti per le fasi successive del
  percorso di lettura.
- Alcuni paragrafi "senza anno proprio" nella colonna greca (es. "in questo periodo...",
  "nella seconda metà del secolo...") sono stati accorpati alla voce datata precedente,
  fedelmente a come appaiono nell'originale.
- Non revisionato riga per riga: possibili refusi minori residui (nomi propri con
  minuscola come nel testo originale, qualche taglio di sillabazione "‑" a fine riga).
  Essendo JSON semplice, sono facili da correggere a mano incontrando errori.
