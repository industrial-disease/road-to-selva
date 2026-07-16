# Road to Selva — Piano di progetto

> Obiettivo: leggere la *Divina Commedia* verso i 35 anni avendo attraversato tutta la
> letteratura che ha influenzato Dante (greca → romana → volgare → Petrarca → Commedia).
> Questo sito è la mappa del percorso: ogni libro con 3 bullet di sintesi, 2 note
> sull'autore, e soprattutto il **contesto storico** che scorre lungo una linea (spirale)
> del tempo.

---

## 1. Principio guida: dati separati dalla presentazione

La cosa più preziosa del progetto è il **contenuto** (i libri letti, i riassunti, il
contesto), che cresce nel tempo mano a mano che leggi. La spirale animata è "solo" un
modo di visualizzarlo. Quindi: prima i dati, poi la vista.

---

## 2. Modello dati

### 2.1 Opere / Autori — un file per opera
Cartella `content/opere/`, un file Markdown per opera con frontmatter:

```yaml
---
autore: Omero
opera: Iliade
anno: -750            # negativo = a.C. → permette ordinamento numerico
periodo: grecia-arcaica
disciplina: Poesia epica
lingua: greco
influenzaDante: alta   # alta | media | bassa
tipo: diretta          # diretta | indiretta  (Dante l'ha letto vs mediato)
letto: false
copertina: null
---

- Bullet 1 sul contenuto/importanza
- Bullet 2
- Bullet 3

**Autore:** due note biografiche sintetiche.
```

### 2.2 Eventi storici — dalle tavole cronologiche
Cartella `content/eventi/` o un unico `content/eventi.json`. Fonte: `tavole_cronologiche.pdf`,
che è organizzato in colonne parallele (Cultura Latina | Storia Romana || Storia e Cultura Greca).

```json
{ "anno": -776, "titolo": "Prima Olimpiade (data tradizionale)", "ambito": "greco" }
{ "anno": -753, "titolo": "Fondazione di Roma (Varrone)", "ambito": "romano" }
```

Sulla timeline **opere ed eventi scorrono insieme** → il contesto storico emerge da sé.

### 2.3 Periodi — per colorare/segmentare la spirale
Piccola tabella di riferimento: `grecia-arcaica`, `grecia-classica`, `ellenismo`,
`roma-repubblicana`, `roma-imperiale`, `tarda-antichita`, `alto-medioevo`,
`volgare-duecento`, `stilnovo`, `dante`. Ognuno con range di anni e un colore.

---

## 3. Da fare con i materiali esistenti

- [x] **`letteratura.md`**: convertito in 115 nuove schede opera (+ 5 preesistenti = 120
      totali in `content/opere/`). Esclusi Socrate e Pitagora (nessuna opera, come
      annotato dal file stesso) e la sezione finale sul latino post-dantesco (Erasmo,
      Pontano, Sannazaro, Copernico, Pascoli: tutti posteriori a Dante). Per gli autori
      di cui restano solo frammenti o opere perdute, i bullet lo dichiarano onestamente
      invece di inventare contenuti (es. Leucippo, Crisippo, Talete).
- [x] **`tavole_cronologiche.pdf`**: estratto in `content/eventi.json` (815 eventi,
      -814 → 800 d.C., romano/greco, storia/cultura). Vedi `content/README.md` per
      schema e limiti noti. Copre solo greco+latino: andrà esteso per volgare/Dante.
- [x] Rimosso il blocco iniettato `nextjs-agent-rules` in fondo a `letteratura.md`
      (il file non lo contiene più).

---

## 4. Stack tecnico (scelto: Next.js / React)

- **Next.js (App Router)** + **TypeScript**.
- Contenuti in Markdown letti a build-time (`gray-matter` + `remark`), generati come pagine statiche.
- **Tailwind CSS** per lo stile.
- Spirale/timeline: **SVG** (con `d3-scale`/`d3-shape` per la geometria) o Canvas se i punti diventano molti.
- Deploy: **Vercel** (naturale per Next.js, zero-config).

---

## 5. Struttura del sito (pagine)

1. **Home / Spirale del tempo** — la vista principale. Spirale che parte dal centro
   (VIII sec. a.C.) e si avvolge verso l'esterno fino a Dante. Ogni punto = un'opera;
   sullo sfondo/lungo il tracciato scorrono gli eventi storici. Hover → mini-card con i 3 bullet.
2. **Elenco cronologico** — fallback lineare, filtrabile per periodo / disciplina / lingua /
   "letto". Utile subito, prima ancora che la spirale sia pronta.
3. **Scheda opera** — pagina singola: 3 bullet, note sull'autore, contesto storico di quegli
   anni (eventi vicini), collegamenti ("cosa leggere prima/dopo").
4. **Il percorso** — pagina narrativa sul progetto e sullo stato di avanzamento (quanto letto).

---

## 6. La "spirale del tempo" — nota di fattibilità

Concetto: coordinate polari dove l'**angolo** e il **raggio** crescono col tempo.
`raggio = a + b·t`, `angolo = c·t`. Ogni opera è un punto sulla spirale; il colore dal periodo.

È la parte con più rischio/effort. Strategia consigliata: **prima la vista lineare
(pagine 2 e 3), poi la spirale come evoluzione**, quando i dati sono già solidi e navigabili.

---

## 7. Roadmap incrementale

- [x] **Fase 0 — Dati.** Estrarre PDF → `eventi.json` (815 eventi). `letteratura.md` da
      convertire in schede opera resta da fare (5 schede di esempio create per validare
      la pipeline, non è ancora una conversione sistematica).
- [x] **Fase 1 — Scheletro.** Progetto Next.js 14 + TypeScript + Tailwind, lettura
      Markdown/JSON via `src/lib/content.ts`, pagina *Elenco cronologico* (`/`) con
      filtri (mostra/ambito) verificata nel browser.
- [x] **Fase 2 — Schede.** Pagina opera singola (`/opere/[slug]`): bullet, nota autore,
      badge (periodo/disciplina/lingua/influenza), contesto storico centrato sull'anno
      dell'opera (`getEventiVicini`, raggio adattivo), navigazione precedente/successiva
      cronologica. Verificata nel browser.
- [x] **Fase 3 — Spirale.** Home page (`/`) sostituita con visualizzazione SVG polare
      (`src/lib/spiral.ts` + `src/components/Spiral.tsx`): raggio e angolo crescono col
      tempo (7 giri, VIII a.C. al centro → Dante al bordo), opere come punti colorati
      per periodo, eventi storici come pulviscolo di sfondo colorato per ambito.
      Aggiunto un cursore scrubbabile (slider `input range`) che riprende l'idea del
      "binario" POV di `idee.md`: muovendolo si evidenziano le opere vicine nel tempo
      e si può cliccare per aprirne la scheda. Elenco lineare spostato su `/elenco`.
      Verificata nel browser (936 punti renderizzati, hover/scrub/click funzionanti).
- [ ] **Fase 4 — Rifinitura.** Filtri avanzati, stato "letto" persistente, progressione,
      deploy su Vercel.

Ogni fase è utile e usabile da sola: puoi già consultare/aggiornare l'elenco mentre leggi,
molto prima che la spirale esista.

---

## 8. Prime decisioni ancora aperte

- Granularità: una scheda per **opera** o per **autore**? (Proposta: per opera; un autore
  con più opere = più schede, collegate.)
- Lingua dei contenuti: solo italiano (presumo di sì).
- Quanto del PDF estrarre subito: solo greco, o greco+latino in parallelo fin dall'inizio.
