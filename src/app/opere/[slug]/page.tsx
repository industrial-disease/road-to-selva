import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getOperaBySlug,
  getOpereOrdinate,
  getEventiVicini,
} from "@/lib/content";
import {
  formatAnno,
  AMBITO_DOT,
  INFLUENZA_LABEL,
  TIPO_INFLUENZA_LABEL,
  PERIODO_LABEL,
} from "@/lib/types";

export function generateStaticParams() {
  return getOpereOrdinate().map((o) => ({ slug: o.slug }));
}

export default function OperaPage({ params }: { params: { slug: string } }) {
  const opera = getOperaBySlug(params.slug);
  if (!opera) notFound();

  const ordinate = getOpereOrdinate();
  const indice = ordinate.findIndex((o) => o.slug === opera.slug);
  const precedente = indice > 0 ? ordinate[indice - 1] : null;
  const successiva = indice < ordinate.length - 1 ? ordinate[indice + 1] : null;

  const contesto = getEventiVicini(opera.anno);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/" className="text-sm text-stone-500 hover:underline">
        ← Torna all&apos;elenco
      </Link>

      <header className="mt-4 mb-8 rounded-lg border border-amber-300 bg-amber-50 p-6">
        <div className="flex items-baseline justify-between gap-4">
          <h1 className="text-2xl font-bold text-stone-900">{opera.opera}</h1>
          <span className="whitespace-nowrap font-mono text-stone-500">
            {formatAnno(opera.anno)}
          </span>
        </div>
        <p className="mt-1 text-stone-600">{opera.autore}</p>

        <ul className="mt-4 list-disc space-y-1.5 pl-5 text-stone-800">
          {opera.bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>

        {opera.notaAutore && (
          <p className="mt-4 border-t border-amber-200 pt-3 text-sm italic text-stone-600">
            <span className="font-semibold not-italic">Autore: </span>
            {opera.notaAutore}
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-2 text-xs text-stone-500">
          <span className="rounded bg-stone-200 px-2 py-0.5">
            {PERIODO_LABEL[opera.periodo] ?? opera.periodo}
          </span>
          <span className="rounded bg-stone-200 px-2 py-0.5">{opera.disciplina}</span>
          <span className="rounded bg-stone-200 px-2 py-0.5">{opera.lingua}</span>
          <span className="rounded bg-stone-200 px-2 py-0.5">
            {INFLUENZA_LABEL[opera.influenzaDante] ?? opera.influenzaDante}
          </span>
          <span className="rounded bg-stone-200 px-2 py-0.5">
            {TIPO_INFLUENZA_LABEL[opera.tipo] ?? opera.tipo}
          </span>
          {opera.letto && (
            <span className="rounded bg-emerald-200 px-2 py-0.5 text-emerald-800">
              Letto
            </span>
          )}
        </div>
      </header>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-stone-900">
          Contesto storico intorno al {formatAnno(opera.anno)}
        </h2>
        <ol className="space-y-1.5">
          {contesto.map((e, i) => (
            <li
              key={i}
              className="flex items-start gap-3 rounded px-2 py-1 text-sm text-stone-700"
            >
              <span
                className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${AMBITO_DOT[e.ambito]}`}
              />
              <span className="w-24 shrink-0 whitespace-nowrap font-mono text-stone-500">
                {formatAnno(e.anno, e.approssimato)}
              </span>
              <span>{e.testo}</span>
            </li>
          ))}
        </ol>
      </section>

      <nav className="mt-10 flex items-center justify-between border-t border-stone-200 pt-6 text-sm">
        {precedente ? (
          <Link
            href={`/opere/${precedente.slug}`}
            className="max-w-[45%] text-stone-600 hover:underline"
          >
            ← {precedente.opera}
            <span className="block text-xs text-stone-400">
              {formatAnno(precedente.anno)}
            </span>
          </Link>
        ) : (
          <span />
        )}
        {successiva ? (
          <Link
            href={`/opere/${successiva.slug}`}
            className="max-w-[45%] text-right text-stone-600 hover:underline"
          >
            {successiva.opera} →
            <span className="block text-xs text-stone-400">
              {formatAnno(successiva.anno)}
            </span>
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </main>
  );
}
