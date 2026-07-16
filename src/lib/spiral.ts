export interface SpiralParams {
  minAnno: number;
  maxAnno: number;
  turns: number;
  rMin: number;
  rMax: number;
  cx: number;
  cy: number;
}

export function makeSpiralParams(
  minAnno: number,
  maxAnno: number,
  opts?: Partial<Pick<SpiralParams, "turns" | "rMin" | "rMax" | "cx" | "cy">>
): SpiralParams {
  return {
    minAnno,
    maxAnno,
    turns: opts?.turns ?? 7,
    rMin: opts?.rMin ?? 46,
    rMax: opts?.rMax ?? 460,
    cx: opts?.cx ?? 470,
    cy: opts?.cy ?? 470,
  };
}

export function annoToT(anno: number, p: SpiralParams): number {
  return (anno - p.minAnno) / (p.maxAnno - p.minAnno);
}

// Arrotondato a 2 decimali: Math.cos/sin possono differire nell'ultimo bit fra il
// rendering server (Node) e quello client (browser), causando un mismatch di
// idratazione su valori altrimenti identici in sostanza.
const round = (n: number) => Math.round(n * 100) / 100;

export function annoToPoint(anno: number, p: SpiralParams) {
  const t = annoToT(anno, p);
  const angle = t * p.turns * 2 * Math.PI - Math.PI / 2;
  const radius = p.rMin + t * (p.rMax - p.rMin);
  return {
    x: round(p.cx + radius * Math.cos(angle)),
    y: round(p.cy + radius * Math.sin(angle)),
    angle,
    radius,
  };
}

/** Path `d` attribute for the spiral guide track, sampled at fixed steps. */
export function spiralTrackD(p: SpiralParams, steps = 500): string {
  const pts: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const anno = p.minAnno + t * (p.maxAnno - p.minAnno);
    const { x, y } = annoToPoint(anno, p);
    pts.push(`${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return pts.join(" ");
}

export const PERIODO_COLOR: Record<string, string> = {
  "grecia-arcaica": "#0369a1",
  "grecia-classica": "#0284c7",
  ellenismo: "#0ea5e9",
  "grecia-romana": "#38bdf8",
  "roma-repubblicana": "#b91c1c",
  "roma-imperiale": "#dc2626",
  "tarda-antichita": "#c2410c",
  "alto-medioevo": "#a16207",
  "basso-medioevo": "#7e22ce",
  "volgare-duecento": "#4d7c0f",
  stilnovo: "#15803d",
  dante: "#7c2d12",
};
