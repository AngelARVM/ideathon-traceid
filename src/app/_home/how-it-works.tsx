import { Handshake, Search, Truck } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "Publicá o buscá",
    text: "Encontrá un subproducto cerca tuyo o publicá lo que tu empresa genera.",
  },
  {
    icon: Handshake,
    title: "Proponé y negociá",
    text: "Proponé cantidad y precio; el vendedor acepta o contraoferta.",
  },
  {
    icon: Truck,
    title: "Confirmá y coordiná",
    text: "Confirmá el acuerdo y coordiná flete y pago por fuera de la plataforma.",
  },
];

export function HowItWorks() {
  return (
    <section
      aria-labelledby="how-it-works-heading"
      className="mt-14 border-t border-stone-200 pt-10 pb-4 sm:mt-20 dark:border-stone-800"
    >
      <h2
        id="how-it-works-heading"
        className="text-2xl font-bold tracking-tight"
      >
        Cómo funciona SubMarket
      </h2>
      <ol className="mt-7 grid gap-7 md:grid-cols-3 md:gap-10">
        {steps.map(({ icon: Icon, title, text }, index) => (
          <li key={title} className="flex gap-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-campo-100 text-campo-800 dark:bg-campo-900 dark:text-campo-200">
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <h3 className="font-bold">
                <span className="mr-1 text-campo-700 dark:text-campo-300">
                  {index + 1}.
                </span>{" "}
                {title}
              </h3>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-stone-600 dark:text-stone-300">
                {text}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
