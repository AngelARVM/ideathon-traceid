import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      <h1 className="text-xl font-bold mb-2">Página no encontrada</h1>
      <p className="text-sm text-stone-600 dark:text-stone-400 mb-6">
        La ruta solicitada no existe.
      </p>
      <Link
        href="/"
        className="inline-flex items-center h-10 px-4 rounded-xl bg-campo-600 text-white text-sm font-semibold"
      >
        Ir al inicio
      </Link>
    </div>
  );
}
