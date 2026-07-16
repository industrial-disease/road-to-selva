"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Opera, Evento } from "@/lib/types";
import { formatAnno, PERIODO_LABEL } from "@/lib/types";
import { makeSpiralParams, annoToPoint, spiralTrackD, PERIODO_COLOR } from "@/lib/spiral";

const SIZE = 940;
const CURSOR_WINDOW = 30; // anni di "vicinanza" evidenziati intorno al cursore

export default function Spiral({
  opere,
  eventi,
}: {
  opere: Opera[];
  eventi: Pick<Evento, "anno" | "ambito" | "testo" | "approssimato">[];
}) {
  const anni = [...opere.map((o) => o.anno), ...eventi.map((e) => e.anno)];
  const minAnno = Math.min(...anni);
  const maxAnno = Math.max(...anni);
  const params = useMemo(
    () => makeSpiralParams(minAnno, maxAnno, { turns: 7, rMin: 46, rMax: 460, cx: SIZE / 2, cy: SIZE / 2 }),
    [minAnno, maxAnno]
  );

  const [hovered, setHovered] = useState<Opera | null>(null);
  const [cursorAnno, setCursorAnno] = useState<number>(Math.round((minAnno + maxAnno) / 2));

  // Il box del hover è lontano dal pallino (in basso nell'SVG): senza un piccolo
  // ritardo cancellabile, il mouse esce dal cerchio prima di raggiungere il box e
  // questo sparisce a metà strada. Si nasconde solo se il cursore non rientra né sul
  // pallino né sul box entro la finestra di grazia.
  const hideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showOpera = (o: Opera) => {
    if (hideTimeout.current) {
      clearTimeout(hideTimeout.current);
      hideTimeout.current = null;
    }
    setHovered(o);
  };
  const scheduleHide = () => {
    hideTimeout.current = setTimeout(() => setHovered(null), 250);
  };

  const trackD = useMemo(() => spiralTrackD(params), [params]);
  const cursorPoint = annoToPoint(cursorAnno, params);

  const vicini = useMemo(() => {
    return opere
      .map((o) => ({ o, d: Math.abs(o.anno - cursorAnno) }))
      .filter((x) => x.d <= CURSOR_WINDOW)
      .sort((a, b) => a.d - b.d)
      .slice(0, 6)
      .map((x) => x.o);
  }, [opere, cursorAnno]);

  const periodiPresenti = Array.from(new Set(opere.map((o) => o.periodo)));

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="relative">
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="h-auto w-full select-none"
          role="img"
          aria-label="Spirale del tempo: opere ed eventi storici dalla Grecia arcaica a Dante"
        >
          <path d={trackD} fill="none" stroke="#d6d3d1" strokeWidth={1} />

          {eventi.map((e, i) => {
            const { x, y } = annoToPoint(e.anno, params);
            const near = Math.abs(e.anno - cursorAnno) <= CURSOR_WINDOW;
            return (
              <circle
                key={`ev-${i}`}
                cx={x}
                cy={y}
                r={near ? 2.2 : 1.3}
                fill={e.ambito === "greco" ? "#1d4ed8" : "#b91c1c"}
                opacity={near ? 0.55 : 0.18}
              />
            );
          })}

          {opere.map((o) => {
            const { x, y } = annoToPoint(o.anno, params);
            const near = Math.abs(o.anno - cursorAnno) <= CURSOR_WINDOW;
            const isHovered = hovered?.slug === o.slug;
            const r = o.influenzaDante === "alta" ? 7 : o.influenzaDante === "media" ? 5.5 : 4.5;
            return (
              <g key={o.slug}>
                <circle
                  cx={x}
                  cy={y}
                  r={isHovered ? r + 3 : near ? r + 1.5 : r}
                  fill={PERIODO_COLOR[o.periodo] ?? "#57534e"}
                  stroke="#fff"
                  strokeWidth={isHovered ? 2 : 1}
                  opacity={near || isHovered ? 1 : 0.85}
                  className="cursor-pointer transition-all"
                  onMouseEnter={() => showOpera(o)}
                  onMouseLeave={scheduleHide}
                />
              </g>
            );
          })}

          {/* linea del cursore temporale */}
          <line
            x1={params.cx}
            y1={params.cy}
            x2={cursorPoint.x}
            y2={cursorPoint.y}
            stroke="#292524"
            strokeWidth={1}
            strokeDasharray="4 3"
            opacity={0.5}
          />
          <circle cx={cursorPoint.x} cy={cursorPoint.y} r={5} fill="none" stroke="#292524" strokeWidth={2} />

          <text
            x={params.cx}
            y={params.cy - 4}
            textAnchor="middle"
            className="fill-stone-500 text-[11px]"
          >
            VIII a.C.
          </text>
          <text
            x={params.cx}
            y={params.cy + 14}
            textAnchor="middle"
            className="fill-stone-500 text-[11px]"
          >
            → Dante
          </text>
        </svg>

        {hovered && (
          <div
            className="absolute bottom-2 left-2 right-2 max-w-md rounded-lg border border-amber-300 bg-amber-50/95 p-4 shadow-lg backdrop-blur"
            onMouseEnter={() => showOpera(hovered)}
            onMouseLeave={scheduleHide}
          >
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="font-semibold text-stone-900">{hovered.opera}</h3>
              <span className="whitespace-nowrap font-mono text-xs text-stone-500">
                {formatAnno(hovered.anno)}
              </span>
            </div>
            <p className="text-sm text-stone-600">{hovered.autore}</p>
            <ul className="mt-1.5 list-disc space-y-0.5 pl-4 text-xs text-stone-700">
              {hovered.bullets.slice(0, 2).map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
            <Link
              href={`/opere/${hovered.slug}`}
              className="mt-2 inline-block text-xs font-medium text-amber-800 hover:underline"
            >
              Vedi scheda completa →
            </Link>
          </div>
        )}
      </div>

      <aside className="space-y-6">
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-stone-400">
            Viaggia nel tempo
          </label>
          <input
            type="range"
            min={minAnno}
            max={maxAnno}
            value={cursorAnno}
            onChange={(e) => setCursorAnno(Number(e.target.value))}
            className="w-full accent-stone-800"
          />
          <p className="mt-1 font-mono text-sm text-stone-700">{formatAnno(cursorAnno)}</p>
        </div>

        <div>
          <h4 className="mb-2 text-xs uppercase tracking-wide text-stone-400">
            Intorno a {formatAnno(cursorAnno)}
          </h4>
          {vicini.length === 0 ? (
            <p className="text-sm text-stone-400">Nessuna opera nel raggio di {CURSOR_WINDOW} anni.</p>
          ) : (
            <ul className="space-y-2">
              {vicini.map((o) => (
                <li key={o.slug}>
                  <Link
                    href={`/opere/${o.slug}`}
                    onMouseEnter={() => showOpera(o)}
                    onMouseLeave={scheduleHide}
                    className="block rounded px-2 py-1 text-sm text-stone-700 hover:bg-stone-100"
                  >
                    <span
                      className="mr-2 inline-block h-2 w-2 rounded-full align-middle"
                      style={{ backgroundColor: PERIODO_COLOR[o.periodo] ?? "#57534e" }}
                    />
                    {o.opera}
                    <span className="ml-1 text-xs text-stone-400">({formatAnno(o.anno)})</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h4 className="mb-2 text-xs uppercase tracking-wide text-stone-400">Legenda periodi</h4>
          <ul className="space-y-1 text-xs text-stone-600">
            {periodiPresenti.map((p) => (
              <li key={p} className="flex items-center gap-2">
                <span
                  className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: PERIODO_COLOR[p] ?? "#57534e" }}
                />
                {PERIODO_LABEL[p] ?? p}
              </li>
            ))}
            <li className="flex items-center gap-2 pt-1">
              <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-blue-700 opacity-40" />
              Eventi storici (ambito greco)
            </li>
            <li className="flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-red-700 opacity-40" />
              Eventi storici (ambito romano)
            </li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
