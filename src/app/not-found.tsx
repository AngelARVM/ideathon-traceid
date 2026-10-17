import { ArrowLeft, SearchX } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 py-20 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-xl border border-brand-200 bg-brand-50 text-brand-600">
        <SearchX className="h-8 w-8" aria-hidden />
      </span>
      <p className="mt-5 font-mono-num text-xs font-semibold tracking-widest text-brand-700">
        ERROR 404
      </p>
      <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-gray-900">
        Página no encontrada
      </h1>
      <p className="mt-2 text-sm text-gray-500">
        La página que buscás no existe o no tenés acceso a ella.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex h-11 items-center gap-2 rounded-lg bg-brand-600 px-5 text-sm font-semibold text-white transition hover:bg-brand-700"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Ir al inicio
      </Link>
    </div>
  );
}
