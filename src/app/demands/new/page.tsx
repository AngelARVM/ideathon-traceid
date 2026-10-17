import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { listLocalities } from "@/lib/demands/queries";
import { todayInArgentina } from "@/lib/demands/validation";
import { requirePersona } from "@/lib/persona";
import { DemandForm } from "../_components/DemandForm";
import { DemandLoading } from "../_components/DemandShell";

export const metadata: Metadata = { title: "Publicar demanda" };

export default function NewDemandPage() {
  return (
    <Suspense fallback={<DemandLoading />}>
      <NewDemandContent />
    </Suspense>
  );
}

async function NewDemandContent() {
  const persona = await requirePersona();
  if (persona.role !== "buyer") notFound();
  const localities = await listLocalities();
  return (
    <>
      <PageHeader
        title="Publicar demanda"
        description="Contá qué subproducto buscás y encontrá ofertas cercanas."
      />
      <DemandForm
        localities={localities}
        today={todayInArgentina()}
        initialValues={{
          title: "",
          category: "",
          description: "",
          quantityTons: "",
          maxPricePerTon: "",
          neededBy: "",
          radiusKm: "200",
          localityId: persona.localityId,
        }}
      />
    </>
  );
}
