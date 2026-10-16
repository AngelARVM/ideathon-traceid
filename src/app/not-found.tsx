import { ArrowLeft, SearchX } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 py-20 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-campo-200 bg-campo-50 text-campo-700 dark:border-campo-800 dark:bg-campo-950/60 dark:text-campo-300">
        <SearchX className="h-8 w-8" aria-hidden />
      </span>
      <p className="mt-5 font-mono-num text-xs font-semibold tracking-widest text-campo-700 dark:text-campo-300">
        ERROR 404
      </p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight">
        Página no encontrada
      </h1>
      <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
        La ruta solicitada no existe en TraceID.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-campo-600 px-5 text-sm font-semibold text-white transition hover:bg-campo-700"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Ir al inicio
      </Link>
    </div>
  );
}
