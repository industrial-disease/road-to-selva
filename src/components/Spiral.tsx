"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Opera, Evento, Rilevanza } from "@/lib/types";
import { formatAnno, PERIODO_LABEL, RILEVANZA_LABEL, passaRilevanza } from "@/lib/types";
import { makeSpiralParams, annoToPoint, annoToT, spiralTrackD, makeStars, PERIODO_COLOR } from "@/lib/spiral";

const SIZE = 940;
const CURSOR_WINDOW = 30; // anni di "vicinanza" evidenziati intorno al cursore
const DRAW_DURATION = 2.6; // deve combaciare con .spiral-track-anim in globals.css
const MAX_AUTHOR_THREADS = 14; // per non affollare gli autori con moltissime opere

// Colori evento più brillanti sul fondo scuro rispetto alla vista chiara.
const EVENTO_COLOR = { greco: "#60a5fa", romano: "#f87171" } as const;
const DANTE_THREAD = "#fbbf24";

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
  const [rilevanza, setRilevanza] = useState<Rilevanza>("tutte");
  const [focus, setFocus] = useState<string | null>(null); // periodo messo a fuoco (cinepresa)

  // La scala della spirale (params) resta fissa sull'intero dataset: filtrare la
  // rilevanza deve "diradare" i pallini mostrati, non far respirare/deformare la spirale.
  const opereFiltrate = useMemo(
    () => opere.filter((o) => passaRilevanza(o.influenzaDante, rilevanza)),
    [opere, rilevanza]
  );

  // --- Fili di influenza: relazioni fra opere ---------------------------------
  // Non esistono archi "X influenza Y" nei dati, quindi li deriviamo: le opere dello
  // stesso autore (la sua costellazione) e un filo dorato verso Dante per le opere di
  // influenza alta/media (es. Ovidio → Commedia).
  const perAutore = useMemo(() => {
    const m = new Map<string, Opera[]>();
    for (const o of opere) {
      const arr = m.get(o.autore);
      if (arr) arr.push(o);
      else m.set(o.autore, [o]);
    }
    return m;
  }, [opere]);

  const danteTarget = useMemo(() => {
    const dante = opere.filter((o) => o.periodo === "dante");
    if (!dante.length) return null;
    return dante.reduce((a, b) => (b.anno > a.anno ? b : a)); // la Commedia: l'opera-Dante più tarda
  }, [opere]);

  // --- Cinepresa: trasformazione di zoom/pan sul periodo a fuoco --------------
  const zoom = useMemo(() => {
    const identity = { k: 1, tx: 0, ty: 0 };
    if (!focus) return identity;
    const yrs = opere.filter((o) => o.periodo === focus).map((o) => o.anno);
    if (!yrs.length) return identity;
    const a0 = Math.min(...yrs);
    const a1 = Math.max(...yrs);
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const N = 48;
    for (let i = 0; i <= N; i++) {
      const yr = a0 + ((a1 - a0) * i) / N;
      const { x, y } = annoToPoint(yr, params);
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    // lato del riquadro quadrato inquadrato, con margine; limitato per evitare
    // zoom eccessivi (periodi minuscoli) o nulli (periodi che avvolgono tutto).
    let s = Math.max(maxX - minX, maxY - minY) * 1.45;
    s = Math.max(SIZE / 4, Math.min(s, SIZE));
    const k = SIZE / s;
    return { k, tx: SIZE / 2 - k * cx, ty: SIZE / 2 - k * cy };
  }, [focus, opere, params]);

  const zoomTransform = `translate(${zoom.tx.toFixed(2)}px, ${zoom.ty.toFixed(2)}px) scale(${zoom.k.toFixed(4)})`;

  // Il box del hover è staccato dal pallino: senza un piccolo ritardo cancellabile, il
  // mouse esce dal cerchio prima di raggiungere il box e questo sparisce a metà strada.
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
  const stars = useMemo(() => makeStars(150, SIZE), []);
  const cursorPoint = annoToPoint(cursorAnno, params);

  // Fili da mostrare per l'opera sotto il cursore, già trasformati in coordinate SVG.
  const threads = useMemo(() => {
    if (!hovered) return null;
    const from = annoToPoint(hovered.anno, params);
    const stesso = (perAutore.get(hovered.autore) ?? [])
      .filter((o) => o.slug !== hovered.slug)
      .map((o) => ({ o, d: Math.abs(o.anno - hovered.anno) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, MAX_AUTHOR_THREADS)
      .map(({ o }) => ({ p: annoToPoint(o.anno, params), color: PERIODO_COLOR[o.periodo] ?? "#a8a29e" }));
    const versoDante =
      danteTarget &&
      hovered.periodo !== "dante" &&
      (hovered.influenzaDante === "alta" || hovered.influenzaDante === "media")
        ? annoToPoint(danteTarget.anno, params)
        : null;
    return { from, stesso, versoDante };
  }, [hovered, params, perAutore, danteTarget]);

  // Posiziona il box hover accanto al pallino, tenendo conto dello zoom della cinepresa.
  const hoveredPos = hovered ? annoToPoint(hovered.anno, params) : null;
  const screenX = hoveredPos ? zoom.k * hoveredPos.x + zoom.tx : SIZE / 2;
  const screenY = hoveredPos ? zoom.k * hoveredPos.y + zoom.ty : SIZE / 2;
  const leftPct = Math.max(0, Math.min(100, (screenX / SIZE) * 100));
  const topPct = Math.max(0, Math.min(100, (screenY / SIZE) * 100));
  const anchorRight = leftPct > 58;
  const anchorBottom = topPct > 62;
  const tooltipStyle: React.CSSProperties = {
    ...(anchorRight
      ? { right: `calc(${100 - leftPct}% + 16px)` }
      : { left: `calc(${leftPct}% + 16px)` }),
    ...(anchorBottom
      ? { bottom: `calc(${100 - topPct}% + 16px)` }
      : { top: `calc(${topPct}% + 16px)` }),
  };

  const vicini = useMemo(() => {
    return opereFiltrate
      .map((o) => ({ o, d: Math.abs(o.anno - cursorAnno) }))
      .filter((x) => x.d <= CURSOR_WINDOW)
      .sort((a, b) => a.d - b.d)
      .slice(0, 6)
      .map((x) => x.o);
  }, [opereFiltrate, cursorAnno]);

  const periodiPresenti = Array.from(new Set(opereFiltrate.map((o) => o.periodo)));

  const toggleFocus = (p: string) => setFocus((cur) => (cur === p ? null : p));

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="relative">
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="h-auto w-full select-none"
          role="img"
          aria-label="Spirale del tempo: opere ed eventi storici dalla Grecia arcaica a Dante"
        >
          <defs>
            <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fcd34d" stopOpacity="0.45" />
              <stop offset="35%" stopColor="#d97706" stopOpacity="0.16" />
              <stop offset="100%" stopColor="#78350f" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Fondale fisso (non segue la cinepresa): stelle + nucleo */}
          <g className="star-field">
            {stars.map((s, i) => (
              <circle key={`st-${i}`} cx={s.x} cy={s.y} r={s.r} fill="#e7e5e4" opacity={s.o} />
            ))}
          </g>
          <circle className="core-glow" cx={params.cx} cy={params.cy} r={150} fill="url(#coreGlow)" />

          {/* Gruppo che la cinepresa zooma/panoramica */}
          <g className="zoom-group" style={{ transform: zoomTransform }}>
            {/* La traccia della spirale, che si disegna dal centro verso l'esterno */}
            <path
              className="spiral-track-anim"
              d={trackD}
              pathLength={1}
              fill="none"
              stroke="#a8a29e"
              strokeWidth={1}
              strokeOpacity={focus ? 0.16 : 0.35}
            />

            {/* Pulviscolo degli eventi storici */}
            {eventi.map((e, i) => {
              const { x, y } = annoToPoint(e.anno, params);
              const near = Math.abs(e.anno - cursorAnno) <= CURSOR_WINDOW;
              const t = annoToT(e.anno, params);
              const baseOp = (near ? 0.7 : 0.22) * (focus ? 0.3 : 1);
              return (
                <circle
                  key={`ev-${i}`}
                  className="dust-enter"
                  style={{
                    animationDelay: `${(t * DRAW_DURATION).toFixed(2)}s`,
                    ["--dust-op" as string]: baseOp,
                  }}
                  cx={x}
                  cy={y}
                  r={near ? 2.4 : 1.4}
                  fill={e.ambito === "greco" ? EVENTO_COLOR.greco : EVENTO_COLOR.romano}
                  opacity={baseOp}
                />
              );
            })}

            {/* Fili di influenza (sotto ai pallini) */}
            {threads && (
              <g className="pointer-events-none">
                {threads.stesso.map((t, i) => (
                  <g key={`th-${i}`}>
                    <line
                      className="thread-line"
                      style={{ animationDelay: `${(i * 0.02).toFixed(2)}s` }}
                      pathLength={1}
                      x1={threads.from.x}
                      y1={threads.from.y}
                      x2={t.p.x}
                      y2={t.p.y}
                      stroke={t.color}
                      strokeWidth={2.5 / zoom.k}
                      strokeOpacity={0.1}
                    />
                    <line
                      className="thread-line"
                      style={{ animationDelay: `${(i * 0.02).toFixed(2)}s` }}
                      pathLength={1}
                      x1={threads.from.x}
                      y1={threads.from.y}
                      x2={t.p.x}
                      y2={t.p.y}
                      stroke={t.color}
                      strokeWidth={0.9 / zoom.k}
                      strokeOpacity={0.55}
                    />
                  </g>
                ))}
                {threads.versoDante && (
                  <>
                    <line
                      className="thread-line"
                      pathLength={1}
                      x1={threads.from.x}
                      y1={threads.from.y}
                      x2={threads.versoDante.x}
                      y2={threads.versoDante.y}
                      stroke={DANTE_THREAD}
                      strokeWidth={4 / zoom.k}
                      strokeOpacity={0.12}
                    />
                    <line
                      className="thread-line"
                      pathLength={1}
                      x1={threads.from.x}
                      y1={threads.from.y}
                      x2={threads.versoDante.x}
                      y2={threads.versoDante.y}
                      stroke={DANTE_THREAD}
                      strokeWidth={1.3 / zoom.k}
                      strokeOpacity={0.85}
                      strokeDasharray={`${5 / zoom.k} ${4 / zoom.k}`}
                    />
                  </>
                )}
              </g>
            )}

            {/* Le opere: punti luminosi con alone. Compaiono in sequenza dal centro. */}
            {opereFiltrate.map((o) => {
              const { x, y } = annoToPoint(o.anno, params);
              const near = Math.abs(o.anno - cursorAnno) <= CURSOR_WINDOW;
              const isHovered = hovered?.slug === o.slug;
              const dimmed = focus != null && o.periodo !== focus;
              const t = annoToT(o.anno, params);
              const rBase = o.influenzaDante === "alta" ? 7 : o.influenzaDante === "media" ? 5.5 : 4.5;
              const r = isHovered ? rBase + 3 : near ? rBase + 1.5 : rBase;
              const color = PERIODO_COLOR[o.periodo] ?? "#a8a29e";
              const haloOp = (isHovered ? 0.45 : near ? 0.3 : 0.18) * (dimmed ? 0.25 : 1);
              const dotOp = dimmed ? 0.2 : 1;
              return (
                <g
                  key={o.slug}
                  className="dot-enter"
                  style={{ animationDelay: `${(t * DRAW_DURATION).toFixed(2)}s` }}
                >
                  {/* alone luminoso */}
                  <circle
                    cx={x}
                    cy={y}
                    r={r * 2.6}
                    fill={color}
                    opacity={haloOp}
                    className="pointer-events-none transition-opacity"
                  />
                  {/* punto */}
                  <circle
                    cx={x}
                    cy={y}
                    r={r}
                    fill={color}
                    stroke="#fafaf9"
                    strokeWidth={isHovered ? 2 : 1}
                    strokeOpacity={(isHovered ? 1 : 0.7) * (dimmed ? 0.4 : 1)}
                    opacity={dotOp}
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
              stroke="#fbbf24"
              strokeWidth={1}
              strokeDasharray="4 4"
              opacity={0.5}
            />
            <circle
              cx={cursorPoint.x}
              cy={cursorPoint.y}
              r={5}
              fill="none"
              stroke="#fbbf24"
              strokeWidth={2}
              opacity={0.9}
            />

            <text x={params.cx} y={params.cy - 4} textAnchor="middle" className="fill-stone-400 text-[11px]">
              VIII a.C.
            </text>
            <text x={params.cx} y={params.cy + 14} textAnchor="middle" className="fill-stone-400 text-[11px]">
              → Dante
            </text>
          </g>
        </svg>

        {hovered && (
          <div
            className="hover-card absolute z-20 w-72 rounded-xl border border-amber-400/25 bg-stone-950/80 p-4 shadow-[0_10px_50px_rgba(0,0,0,0.6)] backdrop-blur-md transition-[top,left,right,bottom] duration-200"
            style={tooltipStyle}
            onMouseEnter={() => showOpera(hovered)}
            onMouseLeave={scheduleHide}
          >
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="font-semibold text-stone-50">{hovered.opera}</h3>
              <span className="whitespace-nowrap font-mono text-xs text-amber-300/80">
                {formatAnno(hovered.anno)}
              </span>
            </div>
            <p className="text-sm text-stone-400">{hovered.autore}</p>
            <ul className="mt-1.5 list-disc space-y-0.5 pl-4 text-xs text-stone-300">
              {hovered.bullets.slice(0, 2).map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
            <Link
              href={`/opere/${hovered.slug}`}
              className="mt-2 inline-block text-xs font-medium text-amber-300 hover:text-amber-200 hover:underline"
            >
              Vedi scheda completa →
            </Link>
          </div>
        )}
      </div>

      <aside className="space-y-6">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur">
          <label className="mb-2 block text-xs uppercase tracking-wide text-stone-400">
            Rilevanza per Dante
          </label>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(RILEVANZA_LABEL) as Rilevanza[]).map((value) => (
              <button
                key={value}
                onClick={() => setRilevanza(value)}
                className={`rounded-full px-3 py-1 text-sm transition ${
                  rilevanza === value
                    ? "bg-amber-400 font-medium text-stone-950"
                    : "text-stone-300 ring-1 ring-inset ring-white/15 hover:bg-white/10"
                }`}
              >
                {RILEVANZA_LABEL[value]}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-stone-500">
            {opereFiltrate.length} di {opere.length} opere mostrate
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur">
          <label className="mb-2 block text-xs uppercase tracking-wide text-stone-400">
            Viaggia nel tempo
          </label>
          <input
            type="range"
            min={minAnno}
            max={maxAnno}
            value={cursorAnno}
            onChange={(e) => setCursorAnno(Number(e.target.value))}
            className="w-full accent-amber-400"
          />
          <p className="mt-1 font-mono text-sm text-amber-200">{formatAnno(cursorAnno)}</p>
        </div>

        <div>
          <h4 className="mb-2 text-xs uppercase tracking-wide text-stone-400">
            Intorno a {formatAnno(cursorAnno)}
          </h4>
          {vicini.length === 0 ? (
            <p className="text-sm text-stone-500">Nessuna opera nel raggio di {CURSOR_WINDOW} anni.</p>
          ) : (
            <ul className="space-y-1">
              {vicini.map((o) => (
                <li key={o.slug}>
                  <Link
                    href={`/opere/${o.slug}`}
                    onMouseEnter={() => showOpera(o)}
                    onMouseLeave={scheduleHide}
                    className="block rounded-lg px-2 py-1 text-sm text-stone-300 hover:bg-white/10"
                  >
                    <span
                      className="mr-2 inline-block h-2 w-2 rounded-full align-middle"
                      style={{ backgroundColor: PERIODO_COLOR[o.periodo] ?? "#a8a29e" }}
                    />
                    {o.opera}
                    <span className="ml-1 text-xs text-stone-500">({formatAnno(o.anno)})</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <h4 className="text-xs uppercase tracking-wide text-stone-400">Periodi</h4>
            {focus ? (
              <button
                onClick={() => setFocus(null)}
                className="whitespace-nowrap text-xs text-amber-300 hover:text-amber-200"
              >
                ← vista completa
              </button>
            ) : (
              <span className="whitespace-nowrap text-[11px] text-stone-500">clicca per mettere a fuoco</span>
            )}
          </div>
          <ul className="space-y-0.5 text-xs text-stone-400">
            {periodiPresenti.map((p) => {
              const active = focus === p;
              return (
                <li key={p}>
                  <button
                    onClick={() => toggleFocus(p)}
                    className={`flex w-full items-center gap-2 rounded-lg px-2 py-1 text-left transition ${
                      active
                        ? "bg-amber-400/15 text-stone-100 ring-1 ring-inset ring-amber-400/40"
                        : focus
                        ? "text-stone-500 hover:bg-white/5"
                        : "hover:bg-white/5"
                    }`}
                  >
                    <span
                      className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: PERIODO_COLOR[p] ?? "#a8a29e" }}
                    />
                    {PERIODO_LABEL[p] ?? p}
                  </button>
                </li>
              );
            })}
          </ul>
          <ul className="mt-2 space-y-1 px-2 text-xs text-stone-500">
            <li className="flex items-center gap-2">
              <span
                className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: EVENTO_COLOR.greco, opacity: 0.6 }}
              />
              Eventi storici (ambito greco)
            </li>
            <li className="flex items-center gap-2">
              <span
                className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: EVENTO_COLOR.romano, opacity: 0.6 }}
              />
              Eventi storici (ambito romano)
            </li>
            <li className="flex items-center gap-2 pt-1">
              <span className="inline-block h-px w-4 shrink-0" style={{ backgroundColor: DANTE_THREAD }} />
              Filo di influenza verso Dante (al passaggio del mouse)
            </li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
