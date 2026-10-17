import { ArrowRight } from "lucide-react";
import { Suspense } from "react";
import { LinkButton } from "@/components/ui/Button";
import { db } from "@/db";
import { getPersona, selectPersona } from "@/lib/persona";

// Placeholder de M0: M4 lo reemplaza por la home completa.
export default function HomePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
        Sub<span className="text-campo-600 dark:text-campo-300">Market</span>
      </h1>
      <p className="mt-2 max-w-2xl text-stone-700 dark:text-stone-300">
        Lo que sobra, vale. Subproductos agroindustriales del NEA, cerca de
        quien los necesita.
      </p>
      <Suspense fallback={<div className="mt-8 h-64" />}>
        <PersonaEntry />
      </Suspense>
    </div>
  );
}

async function PersonaEntry() {
  const persona = await getPersona();
  if (persona) {
    return (
      <div className="mt-8">
        <LinkButton href="/ofertas">
          Explorar ofertas como {persona.name}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </LinkButton>
      </div>
    );
  }

  const users = await db.user.findMany({
    include: { locality: true },
    orderBy: [{ role: "desc" }, { name: "asc" }],
  });

  return (
    <section className="mt-8">
      <h2 className="text-sm font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
        Elegí una persona para recorrer la demo
      </h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {users.map((u) => (
          <form key={u.id} action={selectPersona}>
            <input type="hidden" name="userId" value={u.id} />
            <button
              type="submit"
              className="flex h-full w-full flex-col rounded-2xl border border-stone-200 bg-white p-4 text-left shadow-sm transition hover:border-campo-300 hover:shadow-md dark:border-stone-800 dark:bg-stone-900 dark:hover:border-campo-700"
            >
              <span className="text-[11px] font-bold uppercase tracking-wider text-campo-700 dark:text-campo-300">
                {u.role === "seller" ? "Vendedor" : "Comprador"}
              </span>
              <span className="mt-1 font-bold">{u.name}</span>
              <span className="text-sm text-stone-600 dark:text-stone-400">
                {u.tagline} · {u.locality.name}
              </span>
            </button>
          </form>
        ))}
      </div>
    </section>
  );
}
