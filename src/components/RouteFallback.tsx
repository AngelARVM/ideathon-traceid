export function RouteFallback() {
  return (
    <div
      className="flex justify-center py-24"
      role="status"
      aria-label="Cargando"
    >
      <div className="w-8 h-8 rounded-full border-2 border-stone-300 border-t-[#2F6B3A] animate-spin" />
    </div>
  );
}
