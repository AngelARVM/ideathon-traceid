import { PlusCircle, Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { RecordStatusBadge } from "@/components/RecordStatusBadge";
import { listAnimals } from "@/lib/animals/queries";
import { RECORD_TYPES } from "@/lib/records/types";
import { getMemberships, requireUser } from "@/lib/session";
import { DrainButton } from "./DrainButton";

/**
 * Lee la sesión y el término de búsqueda de la URL en cada request: no hay shell estático que
 * prerenderizar. Es la salida que indica la documentación de Cache Components para rutas
 * autenticadas (node_modules/next/dist/docs, authentication-with-cache-components).
 */
export const instant = false;

export const metadata: Metadata = { title: "Animales" };

const roleLabel = {
  owner: "Titular",
  admin: "Administración",
  operator: "Operación",
  professional: "Profesional",
} as const;

const dateFmt = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export default async function AnimalsPage({
  searchParams,
}: PageProps<"/animals">) {
  const { q } = await searchParams;
  const search = typeof q === "string" ? q : "";

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-10">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-bold tracking-tight">Animales</h1>
        <div className="flex items-center gap-2">
          <DrainButton />
          <Link
            href="/animals/new"
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg bg-campo-600 hover:bg-campo-700 text-white text-sm font-semibold"
          >
            <PlusCircle className="w-4 h-4" />
            Nuevo animal
          </Link>
        </div>
      </div>

      {/* GET: la búsqueda queda en la URL, así se puede compartir y volver atrás. */}
      <search className="mt-5 block">
        <form>
          <label htmlFor="q" className="sr-only">
            Buscar por identificador
          </label>
          <div className="relative">
            <Search
              className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
              aria-hidden
            />
            <input
              id="q"
              name="q"
              type="search"
              inputMode="numeric"
              defaultValue={search}
              // El campo arranca con foco: buscar es el caso común (docs/03, flujo A).
              // biome-ignore lint/a11y/noAutofocus: es la acción primaria de la pantalla.
              autoFocus
              placeholder="Número de caravana, actual o reemplazada"
              className="w-full h-11 pl-9 pr-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 font-mono-num text-sm"
            />
          </div>
          <p className="mt-1.5 text-xs text-stone-500 dark:text-stone-400">
            Busca también identificadores ya reemplazados: el número de una
            caravana vieja sigue encontrando al animal.
          </p>
        </form>
      </search>

      <Suspense fallback={<div className="h-40" />}>
        <AnimalList search={search} />
      </Suspense>
    </div>
  );
}

async function AnimalList({ search }: { search: string }) {
  const user = await requireUser();
  const memberships = await getMemberships(user.id);
  const animals = await listAnimals(
    memberships.map((m) => m.orgId),
    search,
  );

  return (
    <div>
      <ul className="mt-5 flex flex-wrap gap-2 text-xs">
        {memberships.map((m) => (
          <li
            key={m.orgId}
            className="px-2.5 py-1 rounded-lg bg-campo-50 dark:bg-campo-950/60 text-campo-800 dark:text-campo-200 border border-campo-200 dark:border-campo-800"
          >
            {m.orgName} · {roleLabel[m.role]}
          </li>
        ))}
      </ul>

      {memberships.length === 0 ? (
        <p className="mt-8 text-sm text-stone-600 dark:text-stone-400">
          Tu usuario no pertenece a ninguna organización.
        </p>
      ) : animals.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-stone-300 dark:border-stone-700 p-8 text-center">
          <p className="font-medium">
            {search
              ? "Ningún animal coincide con esa búsqueda."
              : "Todavía no hay animales registrados."}
          </p>
          <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
            {search
              ? "Probá con menos dígitos."
              : "Cargá el primero con “Nuevo animal”."}
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-2.5">
          {animals.map((animal) => (
            <li key={animal.id}>
              <Link
                href={`/animals/${animal.id}`}
                className="block rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 hover:border-campo-400 dark:hover:border-campo-700"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-mono-num font-semibold truncate">
                      {animal.identifier ?? "— sin identificador activo —"}
                    </p>
                    <p className="mt-0.5 text-xs text-stone-600 dark:text-stone-400 truncate">
                      {animal.lotLabel ?? "Sin lote"} · {animal.recordCount}{" "}
                      {animal.recordCount === 1 ? "registro" : "registros"}
                      {animal.lastRecordType
                        ? ` · último: ${RECORD_TYPES[animal.lastRecordType as keyof typeof RECORD_TYPES]?.label ?? animal.lastRecordType}`
                        : ""}
                      {animal.lastRecordAt
                        ? ` (${dateFmt.format(animal.lastRecordAt)})`
                        : ""}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${
                        animal.chainStatus === "closed"
                          ? "bg-stone-100 text-stone-700 border-stone-300 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700"
                          : "bg-campo-50 text-campo-800 border-campo-200 dark:bg-campo-950/60 dark:text-campo-200 dark:border-campo-800"
                      }`}
                    >
                      {animal.chainStatus === "closed"
                        ? "Cadena cerrada"
                        : "Cadena abierta"}
                    </span>
                    {animal.hasUnconfirmed ? (
                      <RecordStatusBadge status="pending" />
                    ) : null}
                  </div>
                </div>

                {animal.matchedHistoricalIdentifier ? (
                  <p className="mt-2 text-xs text-tierra-600 dark:text-amber-300">
                    Coincide con un identificador reemplazado de este animal.
                  </p>
                ) : null}

                {animal.detectedFormat === null ||
                animal.identifierKind === "unknown_format" ? (
                  <p className="mt-2 text-xs text-tierra-600 dark:text-amber-300">
                    Formato no reconocido
                  </p>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
