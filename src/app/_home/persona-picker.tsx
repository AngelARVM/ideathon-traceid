import { Hero } from "@/app/_home/hero";
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

/** Home sin persona: el mismo hero y la elección de una persona del seed (D12). */
export function PersonaPicker({ personas }: { personas: DemoPersona[] }) {
  return (
    <>
      <Hero
        title="Transformamos subproductos en oportunidades"
        subtitle="Lo que una industria ya no necesita, otra lo puede transformar. Conectamos a quienes generan subproductos agroindustriales con compradores cercanos del NEA."
        highlight={{
          eyebrow: "De residuo a recurso",
          title: "5 categorías de subproductos",
          subtitle: "Corrientes · Misiones · Chaco",
        }}
      >
        <a
          href="#persona-heading"
          className="inline-flex items-center gap-2.5 rounded-xl bg-brand-600 px-7 py-3.5 text-sm font-bold text-white shadow-xs transition hover:bg-brand-700"
        >
          Elegir una empresa de demo
          <span aria-hidden>↓</span>
        </a>
      </Hero>
      <section
        aria-labelledby="persona-heading"
        className="mx-auto max-w-7xl scroll-mt-24 px-4 sm:px-6 lg:px-8"
      >
        <h2
          id="persona-heading"
          className="text-2xl font-black tracking-tight text-gray-900 sm:text-3xl"
        >
          Elegí desde dónde empezar
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Esta es una demo con empresas ficticias. Elegí una persona para
          recorrer la plataforma; podés cambiarla desde el header.
        </p>
        {personas.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              title="Todavía no hay personas de demo"
              description="Las empresas de demostración aún no están disponibles."
            />
          </div>
        ) : (
          <div className="mt-8 grid gap-8 md:grid-cols-2 md:gap-10">
            {groups.map(({ role, title, description }) => (
              <section
                key={role}
                aria-labelledby={`${role}-heading`}
                className="min-w-0"
              >
                <h3
                  id={`${role}-heading`}
                  className="text-lg font-bold text-gray-900"
                >
                  {title}
                </h3>
                <p className="mt-0.5 text-sm text-gray-500">{description}</p>
                <div className="mt-4 flex flex-col gap-3">
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
