import Link from "next/link";
import { getTimeline } from "@/lib/content";
import Timeline from "@/components/Timeline";

export default function ElencoPage() {
  const items = getTimeline();

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-6">
        <Link href="/" className="text-sm text-stone-500 hover:underline">
          ← Torna alla spirale
        </Link>
        <h1 className="mt-2 text-3xl font-bold text-stone-900">Elenco cronologico</h1>
        <p className="mt-2 text-stone-600">
          Opere e contesto storico, dalla Grecia arcaica a Dante, in ordine lineare.
        </p>
      </header>
      <Timeline items={items} />
    </main>
  );
}
