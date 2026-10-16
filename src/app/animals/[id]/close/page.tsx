import { AlertTriangle, ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAnimalDetail } from "@/lib/animals/queries";
import { getMemberships, requireUser } from "@/lib/session";
import { CloseChainForm } from "./CloseChainForm";

/**
 * Ruta de operador: lee la sesión en cada request, así que no hay shell estático que
 * prerenderizar. `instant = false` es la salida que la documentación de Cache Components
 * indica para estos casos (node_modules/next/dist/docs, authentication-with-cache-components).
 */
export const instant = false;

export const metadata: Metadata = { title: "Cerrar cadena" };

/** Cierre explícito con confirmación tipeada y advertencias a la vista (docs/03, flujo E). */
export default async function CloseChainPage({
  params,
  searchParams,
}: PageProps<"/animals/[id]/close">) {
  const { id } = await params;
  const { tipo } = await searchParams;

  const user = await requireUser();
  const memberships = await getMemberships(user.id);
  const animal = await getAnimalDetail(
    id,
    memberships.map((m) => m.orgId),
  );
  if (!animal) notFound();
  if (animal.chainStatus === "closed") redirect(`/animals/${animal.id}`);

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
          <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-800 dark:border-rose-900 dark:bg-rose-950/60 dark:text-rose-300">
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden /> Acción
            irreversible
          </span>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">
            Cerrar cadena
          </h1>
          <p className="mt-1 font-mono-num text-sm text-stone-600 dark:text-stone-400">
            Caravana {active?.identifier ?? animal.id}
          </p>
        </header>

        <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-100">
          <p className="flex items-start gap-2 font-semibold">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden />
            Es irreversible.
          </p>
          <ul className="mt-2 space-y-1.5 list-disc pl-5">
            <li>
              Después del cierre no se admiten hitos ordinarios sobre este
              animal. No hay forma de reabrir la cadena.
            </li>
            <li>
              Solo se pueden registrar rectificaciones, y una rectificación
              nunca reabre ni vuelve a cerrar nada.
            </li>
            <li>
              <strong>Una entrega a frigorífico no demuestra la faena.</strong>{" "}
              Registra que el animal fue entregado, nada más.
            </li>
          </ul>
        </div>

        <CloseChainForm
          animalId={animal.id}
          initialType={tipo === "death" ? "death" : "slaughterhouse_delivery"}
        />
      </div>
    </div>
  );
}
