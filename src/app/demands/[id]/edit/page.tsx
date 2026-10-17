import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { getDemandDetail, listLocalities } from "@/lib/demands/queries";
import { todayInArgentina } from "@/lib/demands/validation";
import { requirePersona } from "@/lib/persona";
import { DemandForm } from "../../_components/DemandForm";
import { DemandLoading } from "../../_components/DemandShell";

export const metadata: Metadata = { title: "Editar demanda" };
type Props = { params: Promise<{ id: string }> };

export default function EditDemandPage(props: Props) {
  return (
    <Suspense fallback={<DemandLoading />}>
      <EditDemandContent {...props} />
    </Suspense>
  );
}

async function EditDemandContent({ params }: Props) {
  const persona = await requirePersona();
  if (persona.role !== "buyer") notFound();
  const demand = await getDemandDetail((await params).id, persona);
  if (demand.buyerId !== persona.id || demand.status !== "open") notFound();
  const localities = await listLocalities();
  return (
    <>
      <PageHeader
        title="Editar demanda"
        description="Los cambios actualizan las ofertas compatibles."
      />
      <DemandForm
        id={demand.id}
        key={demand.updatedAt.toISOString()}
        localities={localities}
        today={todayInArgentina()}
        initialValues={{
          title: demand.title,
          category: demand.category,
          description: demand.description ?? "",
          quantityTons: demand.quantityTons.toString(),
          maxPricePerTon: demand.maxPricePerTon?.toString() ?? "",
          neededBy: demand.neededBy?.toISOString().slice(0, 10) ?? "",
          radiusKm: String(demand.radiusKm),
          localityId: demand.localityId,
        }}
      />
    </>
  );
}
