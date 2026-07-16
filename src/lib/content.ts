import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { Evento, Opera, TimelineItem } from "@/lib/types";

const CONTENT_DIR = path.join(process.cwd(), "content");

export function getEventi(): Evento[] {
  const file = path.join(CONTENT_DIR, "eventi.json");
  const raw = fs.readFileSync(file, "utf-8");
  return JSON.parse(raw) as Evento[];
}

function parseOperaBody(body: string): { bullets: string[]; notaAutore: string } {
  const lines = body.split("\n").map((l) => l.trim());
  const bullets = lines
    .filter((l) => l.startsWith("- "))
    .map((l) => l.slice(2).trim());
  const notaLine = lines.find((l) => l.startsWith("**Autore:**"));
  const notaAutore = notaLine ? notaLine.replace(/^\*\*Autore:\*\*\s*/, "") : "";
  return { bullets, notaAutore };
}

export function getOpere(): Opera[] {
  const dir = path.join(CONTENT_DIR, "opere");
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md"));
  return files.map((filename) => {
    const raw = fs.readFileSync(path.join(dir, filename), "utf-8");
    const { data, content } = matter(raw);
    const { bullets, notaAutore } = parseOperaBody(content);
    return {
      slug: filename.replace(/\.md$/, ""),
      autore: data.autore,
      opera: data.opera,
      anno: data.anno,
      periodo: data.periodo,
      disciplina: data.disciplina,
      lingua: data.lingua,
      influenzaDante: data.influenzaDante,
      tipo: data.tipo,
      letto: !!data.letto,
      bullets,
      notaAutore,
    } as Opera;
  });
}

export function getTimeline(): TimelineItem[] {
  const opere: TimelineItem[] = getOpere().map((o) => ({
    kind: "opera",
    anno: o.anno,
    data: o,
  }));
  const eventi: TimelineItem[] = getEventi().map((e) => ({
    kind: "evento",
    anno: e.anno,
    data: e,
  }));
  return [...opere, ...eventi].sort((a, b) => a.anno - b.anno);
}

/** Opere ordinate cronologicamente, per la navigazione prima/dopo nella scheda singola. */
export function getOpereOrdinate(): Opera[] {
  return getOpere().sort((a, b) => a.anno - b.anno);
}

export function getOperaBySlug(slug: string): Opera | undefined {
  return getOpere().find((o) => o.slug === slug);
}

/**
 * Eventi storici nell'intorno di un anno, per dare contesto a una singola opera.
 * La finestra si allarga finché non trova un numero minimo di eventi, perché nei
 * secoli più antichi le voci sono più rade.
 */
export function getEventiVicini(anno: number, opts?: { minEventi?: number; maxRaggio?: number }): Evento[] {
  const minEventi = opts?.minEventi ?? 6;
  const maxRaggio = opts?.maxRaggio ?? 60;
  const eventi = getEventi();
  let raggio = 10;
  let trovati: Evento[] = [];
  while (raggio <= maxRaggio) {
    trovati = eventi.filter((e) => Math.abs(e.anno - anno) <= raggio);
    if (trovati.length >= minEventi) break;
    raggio *= 2;
  }
  return trovati.sort((a, b) => Math.abs(a.anno - anno) - Math.abs(b.anno - anno)).slice(0, 12)
    .sort((a, b) => a.anno - b.anno);
}
