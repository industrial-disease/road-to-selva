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
    <main className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-6 flex items-baseline justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-stone-900">Road to Selva</h1>
          <p className="mt-2 max-w-2xl text-stone-600">
            La spirale del tempo: dal VIII secolo a.C. a Dante. Ogni punto colorato è
            un&apos;opera; il pulviscolo intorno è il contesto storico. Trascina il cursore
            per viaggiare avanti e indietro nel tempo.
          </p>
        </div>
        <Link href="/elenco" className="whitespace-nowrap text-sm text-stone-500 hover:underline">
          Vedi elenco lineare →
        </Link>
      </header>
      <Spiral opere={opere} eventi={eventi} />
    </main>
  );
}
