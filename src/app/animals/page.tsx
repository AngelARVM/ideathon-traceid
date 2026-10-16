import { ChevronRight, MapPin, Plus, Search, Tag } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { RecordStatusBadge } from "@/components/RecordStatusBadge";
import { RecordTypeIcon } from "@/components/RecordTypeIcon";
import type { RecordType } from "@/generated/prisma/enums";
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
    <div className="mx-auto max-w-7xl px-3 pb-28 pt-5 sm:px-6 sm:pb-16 sm:pt-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-stone-950 dark:text-white sm:text-2xl">
            Rodeo y Trazabilidad
          </h1>
          <p className="mt-0.5 text-sm text-stone-500 dark:text-stone-400">
            Ficha e historia operativa de cada animal
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DrainButton />
          <Link
            href="/animals/new"
            className="hidden h-10 items-center gap-1.5 rounded-xl bg-campo-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-campo-700 sm:inline-flex"
          >
            <Plus className="w-4 h-4" aria-hidden />
            Nuevo animal
          </Link>
        </div>
      </div>

      {/* GET: la búsqueda queda en la URL, así se puede compartir y volver atrás. */}
      <search className="mt-5 block">
        <form className="relative">
          <label htmlFor="q" className="sr-only">
            Buscar por identificador
          </label>
          <Search
            className="pointer-events-none absolute left-4 top-6 h-5 w-5 -translate-y-1/2 text-stone-400"
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
            placeholder="Buscar por caravana o ID"
            className="h-12 w-full rounded-2xl border border-stone-200 bg-white pl-11 pr-24 font-mono-num text-sm shadow-sm focus:border-campo-500 focus:outline-none focus:ring-2 focus:ring-campo-600/20 dark:border-stone-800 dark:bg-stone-900"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1.5 h-9 rounded-xl bg-campo-600 px-3 text-xs font-semibold text-white transition hover:bg-campo-700"
          >
            Buscar
          </button>
          <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">
            Busca también identificadores ya reemplazados: el número de una
            caravana vieja sigue encontrando al animal.
          </p>
        </form>
      </search>

      <Suspense fallback={<div className="h-40" />}>
        <AnimalList search={search} />
      </Suspense>
      <div className="safe-bottom fixed bottom-4 right-4 z-20 sm:hidden">
        <Link
          href="/animals/new"
          className="inline-flex h-14 items-center gap-2 rounded-2xl bg-campo-600 px-5 text-sm font-bold text-white shadow-xl shadow-campo-950/30 transition hover:bg-campo-700"
        >
          <Plus className="h-5 w-5" aria-hidden /> Nuevo animal
        </Link>
      </div>
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
      <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
        <ul className="flex flex-wrap gap-2 text-xs">
          {memberships.map((m) => (
            <li
              key={m.orgId}
              className="px-2.5 py-1 rounded-lg bg-campo-50 dark:bg-campo-950/60 text-campo-800 dark:text-campo-200 border border-campo-200 dark:border-campo-800"
            >
              {m.orgName} · {roleLabel[m.role]}
            </li>
          ))}
        </ul>
        <span className="rounded-full bg-stone-200 px-2.5 py-1 text-xs font-semibold text-stone-700 dark:bg-stone-800 dark:text-stone-300">
          {animals.length} {animals.length === 1 ? "animal" : "animales"}
        </span>
      </div>

      {memberships.length === 0 ? (
        <p className="mt-8 text-sm text-stone-600 dark:text-stone-400">
          Tu usuario no pertenece a ninguna organización.
        </p>
      ) : animals.length === 0 ? (
        <div className="mx-auto mt-6 max-w-lg rounded-3xl border border-dashed border-stone-300 bg-white p-8 text-center dark:border-stone-700 dark:bg-stone-900">
          <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-campo-50 text-campo-700 dark:bg-campo-950 dark:text-campo-300">
            <Tag className="h-7 w-7" aria-hidden />
          </span>
          <p className="font-bold">
            {search
              ? "Ningún animal coincide con esa búsqueda."
              : "Todavía no hay animales registrados."}
          </p>
          <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
            {search
              ? "Probá con menos dígitos."
              : "Cargá el primero con “Nuevo animal”."}
          </p>
          <Link
            href="/animals/new"
            className="mt-5 inline-flex h-10 items-center gap-1.5 rounded-xl bg-campo-600 px-4 text-sm font-semibold text-white hover:bg-campo-700"
          >
            <Plus className="h-4 w-4" aria-hidden /> Registrar animal
          </Link>
        </div>
      ) : (
        <ul className="mt-5 grid grid-cols-1 gap-3.5 md:grid-cols-2 lg:grid-cols-3">
          {animals.map((animal) => (
            <li key={animal.id}>
              <Link
                href={`/animals/${animal.id}`}
                className="group flex h-full flex-col justify-between rounded-2xl border border-stone-200 bg-white p-4 shadow-sm transition hover:border-campo-400 hover:shadow-md dark:border-stone-800 dark:bg-stone-900 dark:hover:border-campo-700"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                      Caravana
                    </span>
                    <p className="font-mono-num truncate text-xl font-bold tracking-tight text-stone-950 dark:text-white">
                      {animal.identifier ?? "— sin identificador activo —"}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span
                      className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                        animal.chainStatus === "closed"
                          ? "bg-stone-100 text-stone-700 border-stone-300 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700"
                          : "bg-campo-50 text-campo-800 border-campo-200 dark:bg-campo-950/60 dark:text-campo-200 dark:border-campo-800"
                      }`}
                    >
                      {animal.chainStatus === "closed" ? "Cerrada" : "Abierta"}
                    </span>
                    {animal.hasUnconfirmed ? (
                      <RecordStatusBadge status="pending" />
                    ) : null}
                  </div>
                </div>

                <div className="mt-3 rounded-xl border border-stone-100 bg-stone-50 p-2.5 text-xs dark:border-stone-800 dark:bg-stone-800/40">
                  <p className="flex items-center gap-1.5 font-semibold text-stone-700 dark:text-stone-200">
                    <MapPin
                      className="h-3.5 w-3.5 shrink-0 text-campo-600 dark:text-campo-300"
                      aria-hidden
                    />{" "}
                    {animal.lotLabel ?? "Sin lote asignado"}
                  </p>
                </div>
                <div className="mt-3 flex items-center justify-between gap-2 border-t border-stone-100 py-2 text-xs dark:border-stone-800">
                  <span className="flex min-w-0 items-center gap-2 text-stone-600 dark:text-stone-300">
                    {animal.lastRecordType ? (
                      <RecordTypeIcon
                        type={animal.lastRecordType as RecordType}
                        className="h-7 w-7 [&_svg]:h-4 [&_svg]:w-4"
                      />
                    ) : null}
                    <span className="truncate">
                      Último hito:{" "}
                      <strong className="text-stone-800 dark:text-stone-100">
                        {animal.lastRecordType
                          ? RECORD_TYPES[animal.lastRecordType as RecordType]
                              .label
                          : "Alta"}
                      </strong>
                    </span>
                  </span>
                  <span className="font-mono-num shrink-0 text-stone-500">
                    {animal.recordCount} hito
                    {animal.recordCount === 1 ? "" : "s"}
                  </span>
                </div>
                {animal.lastRecordAt ? (
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Última actividad: {dateFmt.format(animal.lastRecordAt)}
                  </p>
                ) : null}

                {animal.matchedHistoricalIdentifier ? (
                  <p className="mt-2 text-xs font-medium text-tierra-600 dark:text-amber-300">
                    Coincide con un identificador reemplazado de este animal.
                  </p>
                ) : null}

                {animal.detectedFormat === null ||
                animal.identifierKind === "unknown_format" ? (
                  <p className="mt-2 text-xs font-medium text-tierra-600 dark:text-amber-300">
                    Formato no reconocido
                  </p>
                ) : null}
                <div className="mt-3 flex items-center justify-between border-t border-stone-100 pt-2 text-xs dark:border-stone-800">
                  <span className="font-mono-num text-[11px] text-stone-500">
                    ID: {animal.id.slice(0, 10)}…
                  </span>
                  <span className="inline-flex items-center gap-1 font-semibold text-campo-700 dark:text-campo-300">
                    Ver ficha{" "}
                    <ChevronRight
                      className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
