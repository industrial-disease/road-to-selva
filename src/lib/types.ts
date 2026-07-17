export type TipoEvento = "storia" | "cultura" | "misto";
export type Influenza = "alta" | "media" | "bassa";
export type TipoInfluenza = "diretta" | "indiretta";

export interface Evento {
  anno: number;
  annoRaw: string;
  approssimato: boolean;
  ambito: Area;
  tipo: TipoEvento;
  banda: string;
  testo: string;
}

export interface Opera {
  slug: string;
  autore: string;
  opera: string;
  anno: number;
  periodo: string;
  disciplina: string;
  lingua: string;
  influenzaDante: Influenza;
  tipo: TipoInfluenza;
  letto: boolean;
  bullets: string[];
  notaAutore: string;
}

export type TimelineItem =
  | { kind: "opera"; anno: number; data: Opera }
  | { kind: "evento"; anno: number; data: Evento };

export function formatAnno(anno: number, approssimato = false): string {
  const prefix = approssimato ? "ca. " : "";
  if (anno < 0) return `${prefix}${Math.abs(anno)} a.C.`;
  return `${prefix}${anno} d.C.`;
}

/**
 * Area culturale unificata, usata per filtrare insieme eventi (via `ambito`) e opere
 * (via `lingua`). Nata "romano vs greco" per il solo mondo antico, arricchita per
 * coprire le culture del basso Medioevo introdotte con le schede verso Dante.
 */
export type Area = "greco" | "romano" | "arabo-ebraico" | "francese-occitano" | "italiano";

export const AREA_LABEL: Record<Area, string> = {
  greco: "Greco",
  romano: "Romano/latino",
  "arabo-ebraico": "Arabo-ebraico",
  "francese-occitano": "Francese/occitano",
  italiano: "Italiano",
};

export const AREA_DOT: Record<Area, string> = {
  greco: "bg-blue-700",
  romano: "bg-red-700",
  "arabo-ebraico": "bg-emerald-700",
  "francese-occitano": "bg-violet-700",
  italiano: "bg-amber-700",
};

const LINGUA_TO_AREA: Record<string, Area> = {
  greco: "greco",
  latino: "romano",
  arabo: "arabo-ebraico",
  ebraico: "arabo-ebraico",
  occitano: "francese-occitano",
  francese: "francese-occitano",
  italiano: "italiano",
};

export function operaArea(lingua: string): Area | null {
  return LINGUA_TO_AREA[lingua] ?? null;
}

export function eventoArea(ambito: Area): Area {
  return ambito;
}

export const INFLUENZA_LABEL: Record<Influenza, string> = {
  alta: "Influenza alta",
  media: "Influenza media",
  bassa: "Influenza bassa",
};

/** Soglia di rilevanza per la "missione dantesca": quanto ci si vuole restringere
 * alle opere che hanno un legame più solido e diretto con la Commedia. */
export type Rilevanza = "tutte" | "alta-media" | "solo-alta";

export const RILEVANZA_LABEL: Record<Rilevanza, string> = {
  tutte: "Tutte",
  "alta-media": "Alta + media",
  "solo-alta": "Solo alta",
};

export function passaRilevanza(influenza: Influenza, soglia: Rilevanza): boolean {
  if (soglia === "tutte") return true;
  if (soglia === "solo-alta") return influenza === "alta";
  return influenza === "alta" || influenza === "media";
}

export const TIPO_INFLUENZA_LABEL: Record<TipoInfluenza, string> = {
  diretta: "Fonte diretta di Dante",
  indiretta: "Fonte indiretta di Dante",
};

export const PERIODO_LABEL: Record<string, string> = {
  "grecia-arcaica": "Grecia arcaica",
  "grecia-classica": "Grecia classica",
  ellenismo: "Ellenismo",
  "grecia-romana": "Grecia sotto Roma (autori greci, età imperiale)",
  "roma-repubblicana": "Roma repubblicana",
  "roma-imperiale": "Roma imperiale",
  "tarda-antichita": "Tarda antichità",
  "alto-medioevo": "Alto Medioevo",
  "basso-medioevo": "Basso Medioevo (scolastica, trovatori, romanzo cortese)",
  "volgare-duecento": "Volgare - Duecento",
  stilnovo: "Dolce stil novo",
  dante: "Dante",
};
