"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Area, Opera } from "@/lib/types";
import { AREA_LABEL, formatAnno, operaArea } from "@/lib/types";
import { COSTE_PATH, MAPPA_VIEWBOX } from "@/lib/coste";
import { LAT_MAX, LAT_MIN, LNG_MAX, LNG_MIN, proietta } from "@/lib/mappa-proj";
import { luogoDiAutore } from "@/lib/luoghi";
import { makeStars } from "@/lib/spiral";

/** Colori per area culturale, allineati alla legenda della spirale. */
const AREA_FILL: Record<Area, string> = {
  greco: "#60a5fa",
  romano: "#f87171",
  "arabo-ebraico": "#34d399",
  "francese-occitano": "#c084fc",
  italiano: "#fbbf24",
};

/** Sopra questa soglia il nodo mostra sempre l'etichetta, altrimenti solo al passaggio. */
const LABEL_MIN = 8;

/** Semi-ampiezza (anni) della finestra mobile del cursore temporale. */
const FINESTRA = 80;

interface Nodo {
  nome: string;
  x: number;
  y: number;
  opere: Opera[];
  area: Area;
  count: number;
}

const { w: VBW, h: VBH } = MAPPA_VIEWBOX;
const stars = makeStars(150, Math.max(VBW, VBH));

export default function Mappa({ opere }: { opere: Opera[] }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [area, setArea] = useState<"tutti" | Area>("tutti");
  const [tempoAttivo, setTempoAttivo] = useState(false);
  const [annoState, setAnnoState] = useState<number | null>(null);

  const [minAnno, maxAnno] = useMemo(() => {
    let mn = Infinity;
    let mx = -Infinity;
    for (const o of opere) {
      if (o.anno < mn) mn = o.anno;
      if (o.anno > mx) mx = o.anno;
    }
    return [mn, mx];
  }, [opere]);
  const anno = annoState ?? maxAnno;

  const nodi = useMemo<Nodo[]>(() => {
    const gruppi = new Map<string, { lat: number; lng: number; opere: Opera[] }>();
    for (const o of opere) {
      if (area !== "tutti" && operaArea(o.lingua) !== area) continue;
      const l = luogoDiAutore(o.autore);
      if (!l) continue;
      const g = gruppi.get(l.nome) ?? { lat: l.lat, lng: l.lng, opere: [] };
      g.opere.push(o);
      gruppi.set(l.nome, g);
    }
    const out: Nodo[] = Array.from(gruppi.entries()).map(([nome, g]) => {
      const { x, y } = proietta(g.lng, g.lat);
      const conteggi = new Map<Area, number>();
      g.opere.forEach((o) => {
        const a = operaArea(o.lingua);
        if (a) conteggi.set(a, (conteggi.get(a) ?? 0) + 1);
      });
      const area =
        Array.from(conteggi.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "italiano";
      return {
        nome,
        x,
        y,
        area,
        count: g.opere.length,
        opere: g.opere.sort((a, b) => a.anno - b.anno),
      };
    });
    // I nodi piccoli si disegnano per ultimi, così restano in cima e cliccabili.
    return out.sort((a, b) => b.count - a.count);
  }, [opere, area]);

  const nodoAttivo = useMemo(
    () => nodi.find((n) => n.nome === (selected ?? hovered)) ?? null,
    [nodi, selected, hovered]
  );
  const nodoSelezionato = useMemo(
    () => nodi.find((n) => n.nome === selected) ?? null,
    [nodi, selected]
  );

  const raggio = (count: number) => 2.6 + 2.1 * Math.sqrt(count);

  // Meridiani e paralleli tenui, per dare il senso della carta.
  const graticola: string[] = [];
  for (let lng = -10; lng <= LNG_MAX; lng += 10) {
    const a = proietta(lng, LAT_MIN - 4);
    const b = proietta(lng, LAT_MAX + 4);
    graticola.push(`M${a.x} ${a.y}L${b.x} ${b.y}`);
  }
  for (let lat = LAT_MIN; lat <= LAT_MAX; lat += 10) {
    const a = proietta(LNG_MIN - 4, lat);
    const b = proietta(LNG_MAX + 4, lat);
    graticola.push(`M${a.x} ${a.y}L${b.x} ${b.y}`);
  }

  return (
    <div className="relative">
      {/* Filtro per area culturale */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs uppercase tracking-wide text-stone-500">Area</span>
        <FiltroBtn attivo={area === "tutti"} onClick={() => setArea("tutti")}>
          Tutte
        </FiltroBtn>
        {(Object.keys(AREA_FILL) as Area[]).map((a) => (
          <FiltroBtn key={a} attivo={area === a} colore={AREA_FILL[a]} onClick={() => setArea(a)}>
            {AREA_LABEL[a]}
          </FiltroBtn>
        ))}
      </div>

      {/* Cursore temporale: finestra mobile che accende i luoghi attivi nel periodo */}
      <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="mr-1 text-xs uppercase tracking-wide text-stone-500">Tempo</span>
        <input
          type="range"
          min={minAnno}
          max={maxAnno}
          value={anno}
          onChange={(e) => {
            setAnnoState(Number(e.target.value));
            setTempoAttivo(true);
          }}
          className="h-1 w-56 max-w-full cursor-pointer accent-amber-400 md:w-72"
          aria-label="Cursore temporale"
        />
        <span className="w-28 font-mono text-sm text-amber-200">
          {tempoAttivo ? formatAnno(anno) : "tutte le epoche"}
        </span>
        {tempoAttivo ? (
          <>
            <span className="text-xs text-stone-500">finestra ±{FINESTRA} anni</span>
            <button
              onClick={() => {
                setTempoAttivo(false);
                setAnnoState(null);
              }}
              className="rounded-full bg-white/5 px-3 py-1 text-xs text-stone-300 ring-1 ring-inset ring-white/10 transition hover:bg-white/10"
            >
              Tutte le epoche
            </button>
          </>
        ) : (
          <span className="text-xs text-stone-500">trascina per viaggiare nel tempo</span>
        )}
      </div>

      <div className="relative overflow-hidden rounded-2xl ring-1 ring-white/5">
        <svg
          viewBox={`0 0 ${VBW} ${VBH}`}
          className="block w-full"
          onMouseLeave={() => setHovered(null)}
          role="img"
          aria-label="Mappa del Mediterraneo con i luoghi delle opere"
        >
          {/* Mare profondo */}
          <defs>
            <radialGradient id="mare" cx="42%" cy="38%" r="75%">
              <stop offset="0%" stopColor="#0b1226" />
              <stop offset="60%" stopColor="#070b18" />
              <stop offset="100%" stopColor="#04060e" />
            </radialGradient>
          </defs>
          <rect x={0} y={0} width={VBW} height={VBH} fill="url(#mare)" />

          {/* Pulviscolo stellare sul mare */}
          <g>
            {stars.map((s, i) => (
              <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#e8ecff" opacity={s.o * 0.7} />
            ))}
          </g>

          {/* Griglia geografica */}
          <path d={graticola.join("")} fill="none" stroke="#93a4d4" strokeWidth={0.5} strokeOpacity={0.07} />

          {/* Terre emerse */}
          <path
            d={COSTE_PATH}
            fill="#17140d"
            fillRule="evenodd"
            stroke="#4a4230"
            strokeWidth={0.7}
            strokeOpacity={0.8}
          />

          {/* Nodi-città */}
          {nodi.map((n) => {
            const attivo = n.nome === (selected ?? hovered);
            // Quante opere del luogo cadono nella finestra del cursore.
            const nFinestra = tempoAttivo
              ? n.opere.reduce((k, o) => k + (Math.abs(o.anno - anno) <= FINESTRA ? 1 : 0), 0)
              : n.count;
            // Fantasma: luogo senza attività nel periodo scelto.
            const fantasma = tempoAttivo && nFinestra === 0;

            if (fantasma) {
              return (
                <g
                  key={n.nome}
                  className="cursor-pointer"
                  onMouseEnter={() => setHovered(n.nome)}
                  onClick={() => setSelected((s) => (s === n.nome ? null : n.nome))}
                >
                  <circle cx={n.x} cy={n.y} r={2.2} fill={AREA_FILL[n.area]} opacity={0.16} />
                  {attivo && (
                    <circle cx={n.x} cy={n.y} r={4} fill="none" stroke="#ffffff" strokeWidth={1.2} opacity={0.7} />
                  )}
                </g>
              );
            }

            const r = raggio(nFinestra);
            const mostraEtichetta =
              attivo || (tempoAttivo ? nFinestra > 0 : n.count >= LABEL_MIN);
            return (
              <g
                key={n.nome}
                className="dot-enter cursor-pointer"
                onMouseEnter={() => setHovered(n.nome)}
                onClick={() => setSelected((s) => (s === n.nome ? null : n.nome))}
              >
                {/* alone */}
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={r * 1.9}
                  fill={AREA_FILL[n.area]}
                  opacity={attivo ? 0.28 : 0.14}
                  className="pointer-events-none"
                />
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={r}
                  fill={AREA_FILL[n.area]}
                  stroke={attivo ? "#ffffff" : "#0a0a12"}
                  strokeWidth={attivo ? 1.6 : 0.8}
                />
                {mostraEtichetta && (
                  <text
                    x={n.x + r + 3}
                    y={n.y + 3}
                    fontSize={10.5}
                    fill={attivo ? "#f5f5f4" : "#c9c6bd"}
                    stroke="#04060e"
                    strokeWidth={2.4}
                    paintOrder="stroke"
                    className="pointer-events-none select-none"
                    style={{ fontWeight: attivo ? 600 : 400 }}
                  >
                    {n.nome}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Tooltip al passaggio (non su nodo selezionato) */}
        {nodoAttivo && !nodoSelezionato && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full"
            style={{
              left: `${(nodoAttivo.x / VBW) * 100}%`,
              top: `${(nodoAttivo.y / VBH) * 100 - 1.5}%`,
            }}
          >
            <div className="hover-card whitespace-nowrap rounded-lg bg-stone-950/90 px-3 py-2 text-xs text-stone-100 ring-1 ring-white/10 backdrop-blur">
              <div className="flex items-center gap-2 font-semibold">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: AREA_FILL[nodoAttivo.area] }}
                />
                {nodoAttivo.nome}
              </div>
              <div className="mt-0.5 text-stone-400">
                {nodoAttivo.count} {nodoAttivo.count === 1 ? "opera" : "opere"} · clicca per l&apos;elenco
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pannello di dettaglio della città selezionata */}
      {nodoSelezionato && (
        <div className="hover-card absolute right-3 top-3 z-20 max-h-[85%] w-72 overflow-hidden rounded-xl bg-stone-950/95 ring-1 ring-white/10 backdrop-blur">
          <div className="flex items-start justify-between gap-2 border-b border-white/10 px-4 py-3">
            <div>
              <div className="flex items-center gap-2 text-base font-semibold text-stone-50">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: AREA_FILL[nodoSelezionato.area] }}
                />
                {nodoSelezionato.nome}
              </div>
              <div className="mt-0.5 text-xs text-stone-400">
                {nodoSelezionato.count} {nodoSelezionato.count === 1 ? "opera" : "opere"}
              </div>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="rounded p-1 text-stone-400 transition-colors hover:text-stone-100"
              aria-label="Chiudi"
            >
              ✕
            </button>
          </div>
          <ul className="max-h-72 divide-y divide-white/5 overflow-y-auto">
            {nodoSelezionato.opere.map((o) => (
              <li key={o.slug}>
                <Link
                  href={`/opere/${o.slug}`}
                  className="block px-4 py-2 transition-colors hover:bg-white/5"
                >
                  <div className="text-sm text-stone-100">{o.opera}</div>
                  <div className="text-xs text-stone-400">
                    {o.autore} · {formatAnno(o.anno)}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Legenda */}
      <p className="mt-4 text-xs text-stone-500">
        Il colore indica l&apos;area culturale (vedi filtro); il diametro del punto cresce
        col numero di opere del luogo.
      </p>
    </div>
  );
}

function FiltroBtn({
  attivo,
  colore,
  onClick,
  children,
}: {
  attivo: boolean;
  colore?: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm transition ${
        attivo
          ? "bg-stone-100 text-stone-900"
          : "bg-white/5 text-stone-300 ring-1 ring-inset ring-white/10 hover:bg-white/10"
      }`}
    >
      {colore && (
        <span
          className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: colore }}
        />
      )}
      {children}
    </button>
  );
}
