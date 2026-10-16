import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      <h2 className="text-xl font-bold mb-2">Página no encontrada</h2>
      <p className="text-xs text-stone-500 mb-4">
        La ruta solicitada no existe en el sistema TraceID.
      </p>
      <Link
        href="/"
        className="inline-block px-4 py-2 rounded-xl bg-[#2F6B3A] text-white text-xs font-semibold"
      >
        Ir al inicio
      </Link>
    </div>
  );
}
