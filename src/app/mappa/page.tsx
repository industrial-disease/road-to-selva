import Link from "next/link";
import { getOpere } from "@/lib/content";
import Mappa from "@/components/Mappa";

export default function MappaPage() {
  const opere = getOpere().sort((a, b) => a.anno - b.anno);

  return (
    <>
      {/* Fondale cosmico scuro, come la home ma virato al blu del mare. */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_#0b1226_0%,_#060a16_52%,_#04060e_100%)]" />
      <main className="relative mx-auto max-w-6xl px-4 py-10 text-stone-200">
        <header className="fade-title mb-8 flex items-baseline justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-stone-50">La geografia delle fonti</h1>
            <p className="mt-2 max-w-2xl text-stone-400">
              Dove nasce ciò che confluisce in Dante: dalla Ionia e da Atene, a Roma e
              all&apos;Africa latina, fino a Baghdad e alla Cordova araba, alla Provenza dei
              trovatori e ai comuni toscani. Ogni punto è un luogo; la sua grandezza è il
              numero di opere. Passa sopra per il conteggio, clicca per l&apos;elenco.
            </p>
          </div>
          <Link
            href="/"
            className="whitespace-nowrap text-sm text-stone-400 transition-colors hover:text-amber-300"
          >
            ← Torna alla spirale
          </Link>
        </header>
        <Mappa opere={opere} />
      </main>
    </>
  );
}
