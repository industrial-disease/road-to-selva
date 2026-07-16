export type Ambito = "romano" | "greco";
export type TipoEvento = "storia" | "cultura" | "misto";
export type Influenza = "alta" | "media" | "bassa";
export type TipoInfluenza = "diretta" | "indiretta";

export interface Evento {
  anno: number;
  annoRaw: string;
  approssimato: boolean;
  ambito: Ambito;
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

export const AMBITO_DOT: Record<Ambito, string> = {
  romano: "bg-red-700",
  greco: "bg-blue-700",
};

export const INFLUENZA_LABEL: Record<Influenza, string> = {
  alta: "Influenza alta",
  media: "Influenza media",
  bassa: "Influenza bassa",
};

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
  "volgare-duecento": "Volgare - Duecento",
  stilnovo: "Dolce stil novo",
  dante: "Dante",
};
