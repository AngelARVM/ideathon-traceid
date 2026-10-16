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
    <div className="max-w-xl mx-auto px-4 py-6 sm:py-10">
      <Link
        href="/animals"
        className="text-sm text-campo-700 dark:text-campo-300 hover:underline"
      >
        ← Animales
      </Link>
      <h1 className="mt-2 text-2xl font-bold tracking-tight">Nuevo animal</h1>
      <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
        Se registra el animal y su alta como un único hito en la cadena.
      </p>

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
  );
}
