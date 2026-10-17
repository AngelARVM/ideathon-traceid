export function HomeLoading() {
  return (
    <div aria-busy="true" className="min-h-96">
      <output className="sr-only">Cargando SubMarket…</output>
      <div aria-hidden className="bg-hero px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="h-4 w-48 rounded bg-gray-200/80" />
            <div className="h-14 w-full rounded-lg bg-gray-200/80" />
            <div className="h-14 w-3/4 rounded-lg bg-gray-200/80" />
            <div className="h-5 w-2/3 rounded bg-gray-200/80" />
          </div>
          <div className="aspect-[4/3] rounded-[28px] bg-gray-200/80" />
        </div>
      </div>
    </div>
  );
}
