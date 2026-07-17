/**
 * Proiezione equirettangolare del Mediterraneo, con correzione cos(lat) alla
 * latitudine media, per mappare (lng, lat) nelle unità del viewBox della mappa.
 * Le stesse costanti sono cablate in scratchpad/gen_coste.py che genera le coste:
 * se le cambi qui, rigenera src/lib/coste.ts.
 */
export const LNG_MIN = -9;
export const LNG_MAX = 50;
export const LAT_MIN = 28;
export const LAT_MAX = 56;
const K = Math.cos((42 * Math.PI) / 180);
const SCALE = 18;

const round = (n: number) => Math.round(n * 10) / 10;

export function proietta(lng: number, lat: number): { x: number; y: number } {
  return {
    x: round((lng - LNG_MIN) * K * SCALE),
    y: round((LAT_MAX - lat) * SCALE),
  };
}
