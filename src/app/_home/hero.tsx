import { ArrowUpRight, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { CATEGORY_IMAGE } from "@/lib/category-media";

export type HeroHighlight = {
  eyebrow: string;
  title: string;
  subtitle: string;
  href?: string;
};

/** Hero de la home: texto a la izquierda; foto grande con una tarjeta flotante a la derecha. */
export function Hero({
  title,
  subtitle,
  children,
  highlight,
}: {
  title: ReactNode;
  subtitle: ReactNode;
  children?: ReactNode;
  highlight: HeroHighlight;
}) {
  const image = CATEGORY_IMAGE.cascarilla_arroz;
  const card = (
    <>
      <span className="block text-[10px] font-extrabold uppercase tracking-widest text-brand-600">
        {highlight.eyebrow}
      </span>
      <span className="mt-1 flex items-center justify-between gap-3">
        <span className="font-display text-base font-extrabold text-gray-900 group-hover:text-brand-600">
          {highlight.title}
        </span>
        {highlight.href && (
          <ArrowUpRight
            className="h-4 w-4 shrink-0 text-brand-600 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            aria-hidden
          />
        )}
      </span>
      <span className="mt-0.5 block text-xs font-medium text-gray-500">
        {highlight.subtitle}
      </span>
    </>
  );
  const cardClass =
    "group absolute bottom-5 left-5 block max-w-xs rounded-2xl border border-gray-100 bg-white/95 p-4 shadow-lg backdrop-blur-xs transition sm:p-5";

  return (
    <section className="border-b border-gray-200/50 bg-hero px-4 pt-10 pb-14 sm:px-6 sm:pt-16 sm:pb-20 lg:px-8">
      <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2 lg:gap-12">
        <div className="space-y-6">
          <p className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-brand-600" aria-hidden />
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-brand-600">
              subMarket · Lo que sobra, vale.
            </span>
          </p>
          <h1 className="text-4xl font-black leading-[1.08] tracking-tight text-brand-800 sm:text-5xl lg:text-[58px]">
            {title}
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-gray-600 sm:text-base">
            {subtitle}
          </p>
          {children}
          <p className="flex items-center gap-2 text-xs text-gray-500">
            <ShieldCheck
              className="h-4 w-4 shrink-0 text-brand-600"
              aria-hidden
            />
            Acuerdos entre empresas · Corrientes, Chaco y Misiones
          </p>
        </div>
        <div className="relative">
          <div className="relative aspect-[4/3] overflow-hidden rounded-[28px] border border-gray-200/60 bg-stone-200 shadow-md">
            <Image
              src={image.src}
              alt={image.alt}
              fill
              preload
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
          {highlight.href ? (
            <Link
              href={highlight.href}
              className={`${cardClass} hover:border-brand-300`}
            >
              {card}
            </Link>
          ) : (
            <div className={cardClass}>{card}</div>
          )}
        </div>
      </div>
    </section>
  );
}
