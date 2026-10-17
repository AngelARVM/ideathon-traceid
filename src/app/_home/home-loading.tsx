export function HomeLoading() {
  return (
    <div aria-busy="true" className="min-h-96 space-y-8 py-6">
      <output className="block text-sm text-stone-600 dark:text-stone-300">
        Cargando SubMarket…
      </output>
      <div aria-hidden className="space-y-4">
        <div className="h-12 w-3/4 rounded-lg bg-stone-200 dark:bg-stone-800" />
        <div className="h-5 w-1/2 rounded-lg bg-stone-200 dark:bg-stone-800" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="h-40 rounded-2xl bg-stone-100 dark:bg-stone-900" />
          <div className="h-40 rounded-2xl bg-stone-100 dark:bg-stone-900" />
        </div>
      </div>
    </div>
  );
}
