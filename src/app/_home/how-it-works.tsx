import Link from "next/link";

const steps = [
  {
    title: "Publicá o buscá",
    text: "Encontrá un subproducto cerca tuyo o publicá lo que tu empresa genera, con humedad, poder calorífico y ubicación.",
  },
  {
    title: "Proponé y negociá",
    text: "Proponé cantidad y precio; el vendedor acepta, rechaza o contraoferta una vez.",
  },
  {
    title: "Confirmá y coordiná",
    text: "Confirmá el acuerdo y coordiná flete y pago por fuera de la plataforma.",
  },
];

/** "Cómo funciona", sin promesas fuera de alcance (M4). `cta` es el enlace de publicar, si hay persona. */
export function HowItWorks({
  cta,
}: {
  cta?: { href: string; label: string; question: string };
}) {
  return (
    <section
      aria-labelledby="how-it-works-heading"
      className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
    >
      <div className="space-y-8 rounded-3xl border border-gray-200/80 bg-hero p-6 sm:p-12">
        <div className="max-w-2xl space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
            subMarket · Bioeconomía circular
          </span>
          <h2
            id="how-it-works-heading"
            className="text-2xl font-black tracking-tight text-gray-900 sm:text-3xl"
          >
            Cómo funciona SubMarket
          </h2>
          <p className="text-xs text-gray-600 sm:text-sm">
            Conectamos a quienes generan subproductos agroindustriales con
            empresas que los pueden aprovechar.
          </p>
        </div>
        <ol className="grid gap-4 md:grid-cols-3 md:gap-6">
          {steps.map(({ title, text }, index) => (
            <li
              key={title}
              className="h-full space-y-2 rounded-2xl border border-gray-200/80 bg-white p-6"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-sm font-bold text-brand-600">
                {index + 1}
              </span>
              <h3 className="font-sans text-sm font-bold text-gray-900">
                {title}
              </h3>
              <p className="text-xs leading-relaxed text-gray-500">{text}</p>
            </li>
          ))}
        </ol>
        {cta && (
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-gray-200/60 pt-4">
            <p className="text-xs text-gray-500">{cta.question}</p>
            <Link
              href={cta.href}
              className="rounded-xl bg-brand-600 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-brand-700"
            >
              {cta.label}
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
