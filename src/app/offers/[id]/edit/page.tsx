import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { updateOffer } from "@/lib/offers/actions";
import { getOfferFormValues, listLocalities } from "@/lib/offers/queries";
import { requirePersona } from "@/lib/persona";
import { OfferForm } from "../../_components/OfferForm";

export const metadata: Metadata = { title: "Editar oferta" };

export default function EditOfferPage({
  params,
}: PageProps<"/offers/[id]/edit">) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <Suspense
        fallback={
          <div className="h-[40rem] animate-pulse rounded-xl bg-gray-200/60" />
        }
      >
        <EditOffer params={params} />
      </Suspense>
    </div>
  );
}

async function EditOffer({
  params,
}: {
  params: PageProps<"/offers/[id]/edit">["params"];
}) {
  const persona = await requirePersona();
  if (persona.role !== "seller") notFound();
  const { id } = await params;
  // Solo el dueño y con la oferta no retirada; si no, 404 (§9).
  const [{ title, values }, localities] = await Promise.all([
    getOfferFormValues(id, persona),
    listLocalities(),
  ]);

  return (
    <>
      <PageHeader
        title="Editar oferta"
        description={`${title}. Los cambios no afectan propuestas ni acuerdos existentes.`}
      />
      <OfferForm
        action={updateOffer}
        offerId={id}
        localities={localities}
        sellerName={persona.name}
        initialValues={values}
        submitLabel="Guardar cambios"
        cancelHref={`/offers/${id}`}
      />
    </>
  );
}
