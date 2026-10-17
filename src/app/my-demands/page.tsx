import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DemandCard } from "@/app/demands/_components/DemandCard";
import { DemandLoading } from "@/app/demands/_components/DemandShell";
import { WithdrawDemandButton } from "@/app/demands/_components/WithdrawDemandButton";
import { Button, LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { listMyDemands } from "@/lib/demands/queries";
import type { SearchParams } from "@/lib/demands/validation";
import { requirePersona } from "@/lib/persona";

export const metadata: Metadata = { title: "Mis demandas" };
type Props = { searchParams: Promise<SearchParams> };

export default function MyDemandsPage(props: Props) {
  return (
    <Suspense fallback={<DemandLoading />}>
      <MyDemandsContent {...props} />
    </Suspense>
  );
}

async function MyDemandsContent({ searchParams }: Props) {
  const persona = await requirePersona();
  if (persona.role !== "buyer") notFound();
  const showWithdrawn = (await searchParams).showWithdrawn === "true";
  const demands = await listMyDemands(persona);
  const visible = demands.filter(
    (demand) => showWithdrawn || demand.status !== "withdrawn",
  );
  return (
    <>
      <PageHeader
        title="Mis demandas"
        description={`Necesidades publicadas por ${persona.name}.`}
        actions={<LinkButton href="/demands/new">Publicar demanda</LinkButton>}
      />
      <form
        action="/my-demands"
        method="get"
        className="mb-6 flex flex-wrap items-center gap-3"
      >
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="showWithdrawn"
            value="true"
            defaultChecked={showWithdrawn}
            key={String(showWithdrawn)}
            className="h-4 w-4 accent-campo-600"
          />
          Mostrar retiradas
        </label>
        <Button type="submit" variant="secondary" size="sm">
          Aplicar
        </Button>
      </form>
      {visible.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {visible.map((demand) => (
            <DemandCard
              key={demand.id}
              demand={demand}
              actions={
                demand.status === "open" ? (
                  <>
                    <LinkButton
                      href={`/demands/${demand.id}/edit`}
                      variant="secondary"
                      size="sm"
                    >
                      Editar
                    </LinkButton>
                    <WithdrawDemandButton id={demand.id} />
                  </>
                ) : undefined
              }
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No tenés demandas abiertas"
          description="Publicá lo que necesitás para encontrar subproductos cerca de tu empresa."
          action={<LinkButton href="/demands/new">Publicar demanda</LinkButton>}
        />
      )}
    </>
  );
}
