import Link from "next/link";
import { getOpere, getEventi } from "@/lib/content";
import Spiral from "@/components/Spiral";

export default function Home() {
  const opere = getOpere().sort((a, b) => a.anno - b.anno);
  const eventi = getEventi().map((e) => ({
    anno: e.anno,
    ambito: e.ambito,
    approssimato: e.approssimato,
    testo: e.testo.slice(0, 90),
  }));

  return (
    <>
      {/* Fondale cosmico a tutto schermo: caldo al centro (origine del tempo),
          profondo verso i bordi. Solo sulla home. */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_#1c1408_0%,_#0b0b16_46%,_#050509_100%)]" />
      <main className="relative mx-auto max-w-6xl px-4 py-10 text-stone-200">
        <header className="fade-title mb-8 flex items-baseline justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-stone-50">Road to Selva</h1>
            <p className="mt-2 max-w-2xl text-stone-400">
              La spirale del tempo: dal VIII secolo a.C. a Dante. Ogni punto luminoso è
              un&apos;opera; il pulviscolo intorno è il contesto storico. Passa sul punto per
              vederne i fili di influenza verso Dante, clicca un periodo per metterlo a fuoco,
              trascina il cursore per viaggiare nel tempo.
            </p>
          </div>
          <Link
            href="/elenco"
            className="whitespace-nowrap text-sm text-stone-400 transition-colors hover:text-amber-300"
          >
            Vedi elenco lineare →
          </Link>
        </header>
        <Spiral opere={opere} eventi={eventi} />
      </main>
    </>
  );
}
