import { AlertTriangle } from "lucide-react";
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
}: PageProps<"/animals/[id]/close">) {
  const { id } = await params;

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
    <div className="max-w-xl mx-auto px-4 py-6 sm:py-10">
      <Link
        href={`/animals/${animal.id}`}
        className="text-sm text-campo-700 dark:text-campo-300 hover:underline"
      >
        ← Detalle
      </Link>
      <h1 className="mt-2 text-2xl font-bold tracking-tight">Cerrar cadena</h1>
      <p className="mt-1 text-sm text-stone-600 dark:text-stone-400 font-mono-num">
        {active?.identifier ?? animal.id}
      </p>

      <div className="mt-5 rounded-xl border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/40 p-4 text-sm text-red-900 dark:text-red-100">
        <p className="flex items-start gap-2 font-semibold">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden />
          Es irreversible.
        </p>
        <ul className="mt-2 space-y-1.5 list-disc pl-5">
          <li>
            Después del cierre, el contrato rechaza todo hito ordinario sobre
            este animal. No hay forma de reabrir la cadena.
          </li>
          <li>
            Solo se pueden registrar rectificaciones, y una rectificación nunca
            reabre ni vuelve a cerrar nada.
          </li>
          <li>
            <strong>Una entrega a frigorífico no demuestra la faena.</strong>{" "}
            Registra que el animal fue entregado, nada más.
          </li>
        </ul>
      </div>

      <CloseChainForm animalId={animal.id} />
    </div>
  );
}
