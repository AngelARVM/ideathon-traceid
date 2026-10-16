import type { Metadata } from "next";
import { Suspense } from "react";
import { getMemberships, requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Animales" };

const roleLabel = {
  owner: "Titular",
  admin: "Administración",
  operator: "Operación",
  professional: "Profesional",
} as const;

export default function AnimalsPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-10">
      <h1 className="text-2xl font-bold tracking-tight">Animales</h1>
      <Suspense fallback={<div className="h-40" />}>
        <AnimalList />
      </Suspense>
    </div>
  );
}

async function AnimalList() {
  const user = await requireUser();
  const memberships = await getMemberships(user.id);

  return (
    <>
      <ul className="mt-2 flex flex-wrap gap-2 text-xs">
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
      ) : (
        <div className="mt-8 rounded-2xl border border-dashed border-stone-300 dark:border-stone-700 p-8 text-center">
          <p className="font-medium">Todavía no hay animales registrados.</p>
          <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
            Cuando se registre el primero va a aparecer acá.
          </p>
        </div>
      )}
    </>
  );
}
