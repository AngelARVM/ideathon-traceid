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
    <div className="max-w-xl mx-auto px-4 py-6 sm:py-10">
      <Link
        href={`/animals/${animal.id}`}
        className="text-sm text-campo-700 dark:text-campo-300 hover:underline"
      >
        ← Detalle
      </Link>
      <h1 className="mt-2 text-2xl font-bold tracking-tight">Nuevo hito</h1>
      <p className="mt-1 text-sm text-stone-600 dark:text-stone-400 font-mono-num">
        {active?.identifier ?? animal.id}
      </p>

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
  );
}
