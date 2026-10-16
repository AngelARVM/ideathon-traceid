import type { Metadata } from "next";
import Link from "next/link";
import { getWriteTargets } from "@/lib/animals/queries";
import { getMemberships, requireUser } from "@/lib/session";
import { NewAnimalForm } from "./NewAnimalForm";

/**
 * Ruta de operador: lee la sesión en cada request, así que no hay shell estático que
 * prerenderizar. `instant = false` es la salida que la documentación de Cache Components
 * indica para estos casos (node_modules/next/dist/docs, authentication-with-cache-components).
 */
export const instant = false;

export const metadata: Metadata = { title: "Nuevo animal" };

/**
 * Una sola pantalla y un solo submit, que produce **una** escritura en la cadena: el animal y
 * su `registration` nacen juntos (docs/03, flujo B).
 */
export default async function NewAnimalPage() {
  const user = await requireUser();
  const memberships = await getMemberships(user.id);
  const { establishments, lots } = await getWriteTargets(
    memberships.map((m) => m.orgId),
  );

  return (
    <div className="mx-auto max-w-2xl px-4 pb-20 pt-6">
      <Link
        href="/animals"
        className="inline-flex items-center gap-1.5 rounded-xl bg-stone-100 px-3 py-1.5 text-xs font-semibold text-stone-600 transition hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> Volver al rodeo
      </Link>
      <div className="mt-4 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm dark:border-stone-800 dark:bg-stone-900 sm:p-8">
        <div className="border-b border-stone-100 pb-5 dark:border-stone-800">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-campo-200 bg-campo-50 px-2.5 py-1 text-xs font-semibold text-campo-800 dark:border-campo-800 dark:bg-campo-950/60 dark:text-campo-300">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden /> Alta individual
          </span>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">
            Nuevo animal
          </h1>
          <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
            La caravana, el establecimiento y la dieta base inician su ficha
            operativa.
          </p>
        </div>

        {establishments.length === 0 ? (
          <p className="mt-8 text-sm text-stone-600 dark:text-stone-400">
            Tu organización no tiene establecimientos cargados.
          </p>
        ) : (
          <NewAnimalForm
            memberships={memberships.map((m) => ({
              orgId: m.orgId,
              orgName: m.orgName,
            }))}
            establishments={establishments}
            lots={lots}
          />
        )}
      </div>
    </div>
  );
}

import { ArrowLeft, ShieldCheck } from "lucide-react";
