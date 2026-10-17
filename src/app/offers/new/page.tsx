import { Info } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Category } from "@/generated/prisma/enums";
import { createOffer } from "@/lib/offers/actions";
import { getDemandTitle, listLocalities } from "@/lib/offers/queries";
import { requirePersona } from "@/lib/persona";
import { OfferForm } from "../_components/OfferForm";

export const metadata: Metadata = { title: "Publicar oferta" };

export default function NewOfferPage({
  searchParams,
}: PageProps<"/offers/new">) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <PageHeader
        title="Publicar oferta"
        description="Un lote de un solo subproducto, con su stock en toneladas."
      />
      <Suspense
        fallback={
          <div className="h-[40rem] animate-pulse rounded-2xl bg-stone-200/60 dark:bg-stone-800/60" />
        }
      >
        <NewOffer searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

const param = (v: string | string[] | undefined) =>
  (Array.isArray(v) ? v[0] : v)?.trim() ?? "";

async function NewOffer({
  searchParams,
}: {
  searchParams: PageProps<"/offers/new">["searchParams"];
}) {
  const persona = await requirePersona();
  if (persona.role !== "seller") notFound();

  // Precarga desde una demanda (§12.2): son solo valores iniciales, la acción valida todo.
  const params = await searchParams;
  const category = param(params.category);
  const demandId = param(params.demand);
  const [localities, demand] = await Promise.all([
    listLocalities(),
    demandId ? getDemandTitle(demandId) : null,
  ]);

  return (
    <div className="flex flex-col gap-5">
      {demand && (
        <p className="flex items-start gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2.5 text-sm text-sky-900 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-100">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>
            Publicando en respuesta a:{" "}
            <Link
              href={`/demands/${demand.id}`}
              className="font-semibold underline underline-offset-2"
            >
              {demand.title}
            </Link>
          </span>
        </p>
      )}
      <OfferForm
        action={createOffer}
        localities={localities}
        submitLabel="Publicar oferta"
        cancelHref="/my-offers"
        initialValues={{
          title: param(params.title),
          category: Object.values<string>(Category).includes(category)
            ? category
            : "",
          quantityTons: param(params.quantity),
          status: "available",
          localityId: persona.localityId,
          freight: "a_convenir",
        }}
      />
    </div>
  );
}
