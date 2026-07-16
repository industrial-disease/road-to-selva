"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Rilevanza, TimelineItem } from "@/lib/types";
import { formatAnno, AMBITO_DOT, INFLUENZA_LABEL, RILEVANZA_LABEL, passaRilevanza } from "@/lib/types";

type Filtro = "tutto" | "solo-opere" | "solo-eventi";

export default function Timeline({ items }: { items: TimelineItem[] }) {
  const [filtro, setFiltro] = useState<Filtro>("tutto");
  const [ambito, setAmbito] = useState<"tutti" | "romano" | "greco">("tutti");
  const [rilevanza, setRilevanza] = useState<Rilevanza>("tutte");

  const filtrati = useMemo(() => {
    return items.filter((item) => {
      if (filtro === "solo-opere" && item.kind !== "opera") return false;
      if (filtro === "solo-eventi" && item.kind !== "evento") return false;
      if (ambito !== "tutti") {
        const itemAmbito = item.kind === "opera" ? null : item.data.ambito;
        if (item.kind === "evento" && itemAmbito !== ambito) return false;
      }
      if (item.kind === "opera" && !passaRilevanza(item.data.influenzaDante, rilevanza)) {
        return false;
      }
      return true;
    });
  }, [items, filtro, ambito, rilevanza]);

  return (
    <div>
      <div className="sticky top-0 z-10 flex flex-wrap gap-3 border-b border-stone-300 bg-stone-50/95 py-3 backdrop-blur">
        <FilterGroup label="Mostra">
          {(
            [
              ["tutto", "Tutto"],
              ["solo-opere", "Solo opere"],
              ["solo-eventi", "Solo eventi storici"],
            ] as [Filtro, string][]
          ).map(([value, label]) => (
            <FilterButton
              key={value}
              active={filtro === value}
              onClick={() => setFiltro(value)}
            >
              {label}
            </FilterButton>
          ))}
        </FilterGroup>
        <FilterGroup label="Ambito">
          {(
            [
              ["tutti", "Tutti"],
              ["greco", "Greco"],
              ["romano", "Romano"],
            ] as const
          ).map(([value, label]) => (
            <FilterButton
              key={value}
              active={ambito === value}
              onClick={() => setAmbito(value)}
            >
              {label}
            </FilterButton>
          ))}
        </FilterGroup>
        <FilterGroup label="Rilevanza per Dante">
          {(Object.keys(RILEVANZA_LABEL) as Rilevanza[]).map((value) => (
            <FilterButton
              key={value}
              active={rilevanza === value}
              onClick={() => setRilevanza(value)}
            >
              {RILEVANZA_LABEL[value]}
            </FilterButton>
          ))}
        </FilterGroup>
        <span className="ml-auto self-center text-sm text-stone-500">
          {filtrati.length} voci
        </span>
      </div>

      <ol className="mt-4 space-y-2">
        {filtrati.map((item, i) =>
          item.kind === "opera" ? (
            <li
              key={`opera-${item.data.slug}`}
              className="rounded-lg border border-amber-300 bg-amber-50 p-4"
            >
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="text-lg font-semibold text-stone-900">
                  <Link href={`/opere/${item.data.slug}`} className="hover:underline">
                    {item.data.opera}
                  </Link>
                </h3>
                <span className="whitespace-nowrap font-mono text-sm text-stone-500">
                  {formatAnno(item.data.anno)}
                </span>
              </div>
              <p className="text-sm text-stone-600">{item.data.autore}</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-stone-800">
                {item.data.bullets.map((b, bi) => (
                  <li key={bi}>{b}</li>
                ))}
              </ul>
              {item.data.notaAutore && (
                <p className="mt-2 text-sm italic text-stone-600">
                  {item.data.notaAutore}
                </p>
              )}
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-stone-500">
                <span className="rounded bg-stone-200 px-2 py-0.5">
                  {item.data.disciplina}
                </span>
                <span className="rounded bg-stone-200 px-2 py-0.5">
                  {item.data.lingua}
                </span>
                <span className="rounded bg-stone-200 px-2 py-0.5">
                  {INFLUENZA_LABEL[item.data.influenzaDante] ?? item.data.influenzaDante}
                </span>
              </div>
            </li>
          ) : (
            <li
              key={`evento-${item.anno}-${i}`}
              className="flex items-start gap-3 rounded px-2 py-1 text-sm text-stone-700 hover:bg-stone-100"
            >
              <span
                className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${AMBITO_DOT[item.data.ambito]}`}
              />
              <span className="w-24 shrink-0 whitespace-nowrap font-mono text-stone-500">
                {formatAnno(item.data.anno, item.data.approssimato)}
              </span>
              <span>{item.data.testo}</span>
            </li>
          )
        )}
      </ol>
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1">
      <span className="mr-1 text-xs uppercase tracking-wide text-stone-400">
        {label}
      </span>
      {children}
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-sm transition ${
        active
          ? "bg-stone-900 text-white"
          : "bg-white text-stone-700 ring-1 ring-inset ring-stone-300 hover:bg-stone-100"
      }`}
    >
      {children}
    </button>
  );
}
