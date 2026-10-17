import { MapPin } from "lucide-react";
import { PersonaButton } from "@/app/_home/persona-button";
import type { DemoPersona } from "@/app/_home/queries";
import { EmptyState } from "@/components/ui/EmptyState";
import { selectPersona } from "@/lib/persona";

const groups = [
  {
    role: "seller",
    title: "Vendedores",
    description: "Dale un nuevo destino a tus subproductos.",
  },
  {
    role: "buyer",
    title: "Compradores",
    description: "Encontrá materiales cerca de tu empresa.",
  },
] as const;

export function PersonaPicker({ personas }: { personas: DemoPersona[] }) {
  return (
    <>
      <div className="border-b border-stone-200 pb-10 sm:pb-14 dark:border-stone-800">
        <h1 className="max-w-3xl text-balance text-4xl font-bold leading-tight tracking-tight text-campo-900 sm:text-6xl dark:text-campo-100">
          SubMarket —<br />
          Lo que sobra, vale.
        </h1>
        <p className="mt-5 max-w-2xl text-pretty text-base leading-relaxed text-stone-700 sm:text-lg dark:text-stone-300">
          Conectamos a quienes generan subproductos agroindustriales con
          compradores cercanos del NEA.
        </p>
        <p className="mt-6 flex items-center gap-2 text-sm text-campo-800 dark:text-campo-200">
          <MapPin className="h-4 w-4 shrink-0" aria-hidden />
          Corrientes · Misiones · Chaco
        </p>
      </div>
      <section aria-labelledby="persona-heading" className="mt-10">
        <h2 id="persona-heading" className="text-2xl font-bold tracking-tight">
          Elegí desde dónde empezar
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600 dark:text-stone-300">
          Esta es una demo con empresas ficticias. Elegí una persona para
          recorrer la plataforma.
        </p>
        {personas.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              title="Todavía no hay personas de demo"
              description="Las empresas de demostración aún no están disponibles."
            />
          </div>
        ) : (
          <div className="mt-7 grid gap-8 md:grid-cols-2 md:gap-10">
            {groups.map(({ role, title, description }) => (
              <section key={role} aria-labelledby={`${role}-heading`}>
                <h3 id={`${role}-heading`} className="text-lg font-bold">
                  {title}
                </h3>
                <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
                  {description}
                </p>
                <div className="mt-4 grid gap-3">
                  {personas
                    .filter((persona) => persona.role === role)
                    .map((persona) => (
                      <form key={persona.id} action={selectPersona}>
                        <input type="hidden" name="userId" value={persona.id} />
                        <input type="hidden" name="next" value="/offers" />
                        <PersonaButton persona={persona} />
                      </form>
                    ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
