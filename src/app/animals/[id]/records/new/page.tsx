import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAnimalDetail } from "@/lib/animals/queries";
import { getMemberships, requireUser } from "@/lib/session";
import { NewRecordForm } from "./NewRecordForm";

/**
 * Ruta de operador: lee la sesión en cada request, así que no hay shell estático que
 * prerenderizar. `instant = false` es la salida que la documentación de Cache Components
 * indica para estos casos (node_modules/next/dist/docs, authentication-with-cache-components).
 */
export const instant = false;

export const metadata: Metadata = { title: "Nuevo hito" };

/** Selector de tipo y después el formulario del tipo (docs/03, flujo C). */
export default async function NewRecordPage({
  params,
  searchParams,
}: PageProps<"/animals/[id]/records/new">) {
  const { id } = await params;
  const { tipo } = await searchParams;

  const user = await requireUser();
  const memberships = await getMemberships(user.id);
  const animal = await getAnimalDetail(
    id,
    memberships.map((m) => m.orgId),
  );
  if (!animal) notFound();

  const active = animal.identifiers.find((i) => i.replacedAt === null) ?? null;

  return (
    <div className="mx-auto max-w-2xl px-4 pb-20 pt-6">
      <Link
        href={`/animals/${animal.id}`}
        className="inline-flex items-center gap-1.5 rounded-xl bg-stone-100 px-3 py-1.5 text-xs font-semibold text-stone-600 transition hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> Volver al animal
      </Link>
      <div className="mt-4 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm dark:border-stone-800 dark:bg-stone-900 sm:p-8">
        <header className="border-b border-stone-100 pb-5 dark:border-stone-800">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
            Nuevo hito · Caravana {active?.identifier ?? animal.id}
          </span>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Nuevo hito</h1>
          <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
            Elegí el tipo de hito y completá sus datos.
          </p>
        </header>

        {animal.chainStatus === "closed" ? (
          <p className="mt-8 rounded-xl border border-stone-300 dark:border-stone-700 px-3 py-2.5 text-sm">
            La cadena de este animal está cerrada. Solo se pueden registrar
            rectificaciones, desde el registro que se quiera corregir.
          </p>
        ) : (
          <NewRecordForm
            animalId={animal.id}
            selected={typeof tipo === "string" ? tipo : null}
          />
        )}
      </div>
    </div>
  );
}

import { ArrowLeft } from "lucide-react";
