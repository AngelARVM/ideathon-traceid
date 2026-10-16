import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { LogoMark } from "@/components/Logo";

export default function HomePage() {
  return (
    <div className="max-w-xl mx-auto px-4 py-16 sm:py-24 flex flex-col items-center text-center">
      <span className="w-20 h-20 rounded-3xl bg-campo-600 text-white flex items-center justify-center shadow-lg shadow-campo-950/20">
        <LogoMark className="w-12 h-12" />
      </span>
      <h1 className="mt-6 text-4xl font-black tracking-tight">
        Trace<span className="text-campo-600 dark:text-campo-300">ID</span>
      </h1>
      <p className="mt-3 text-lg text-stone-700 dark:text-stone-300">
        Historial verificable de cada animal, anclado en Stellar.
      </p>
      <Link
        href="/animals"
        className="mt-8 inline-flex items-center gap-2 h-12 px-6 rounded-xl bg-campo-600 hover:bg-campo-700 text-white font-bold"
      >
        Ingresar
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
