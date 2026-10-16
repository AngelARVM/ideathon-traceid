import { ArrowRight, ClipboardList, Layers, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { LogoMark } from "@/components/Logo";

export default function HomePage() {
  return (
    <div className="mx-auto flex min-h-[calc(100dvh-9rem)] max-w-4xl flex-col justify-between px-4 py-10 sm:px-6 sm:py-16">
      <div className="my-auto flex flex-col items-center text-center">
        <span className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-campo-600 text-white shadow-xl shadow-campo-950/20 ring-4 ring-campo-600/20 sm:h-24 sm:w-24">
          <LogoMark className="h-12 w-12 sm:h-14 sm:w-14" />
          <span className="absolute -bottom-2 -right-2 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-black tracking-wider text-stone-950 shadow">
            NEA
          </span>
        </span>
        <h1 className="text-4xl font-black tracking-tight text-stone-950 dark:text-stone-50 sm:text-5xl">
          Trace<span className="text-campo-600 dark:text-campo-300">ID</span>
        </h1>
        <p className="mt-3 max-w-xl text-base font-medium leading-relaxed text-stone-700 dark:text-stone-300 sm:text-xl">
          El historial de cada animal, claro para quien lo carga y para quien lo
          consulta.
        </p>
        <div className="mt-8 flex w-full max-w-md flex-col gap-3 sm:flex-row">
          <Link
            href="/animals"
            className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-campo-600 px-5 py-3 font-bold text-white shadow-md shadow-campo-950/20 transition hover:bg-campo-700"
          >
            Ingresar al rodeo <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <Link
            href="#como-funciona"
            className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border-2 border-stone-300 bg-white px-5 py-3 font-semibold text-stone-800 transition hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:hover:bg-stone-800"
          >
            <ShieldCheck
              className="h-5 w-5 text-campo-600 dark:text-campo-300"
              aria-hidden
            />{" "}
            Conocer el flujo
          </Link>
        </div>
        <div
          id="como-funciona"
          className="mt-12 grid w-full grid-cols-1 gap-3 text-left sm:grid-cols-3"
        >
          {[
            {
              icon: ClipboardList,
              title: "Registro individual",
              text: "Cada caravana abre una ficha con sus hitos de manejo y sanidad.",
            },
            {
              icon: Layers,
              title: "Historia encadenada",
              text: "Los cambios se agregan en orden y conservan sus huellas criptográficas.",
            },
            {
              icon: ShieldCheck,
              title: "Evidencia visible",
              text: "La ficha distingue los registros en cola, confirmados y fallidos.",
            },
          ].map(({ icon: Icon, title, text }) => (
            <section
              key={title}
              className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm dark:border-stone-800 dark:bg-stone-900"
            >
              <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-campo-100 text-campo-700 dark:bg-campo-950 dark:text-campo-300">
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <h2 className="text-xs font-bold uppercase tracking-wider">
                {title}
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-stone-600 dark:text-stone-400">
                {text}
              </p>
            </section>
          ))}
        </div>
      </div>
      <p className="mt-8 border-t border-stone-200 pt-6 text-center text-xs text-stone-500 dark:border-stone-800 dark:text-stone-400">
        Diseñado para productores y equipos de campo del nordeste argentino.
      </p>
    </div>
  );
}
