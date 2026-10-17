import { Plus } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DemandCard } from "@/app/demands/_components/DemandCard";
import { DemandLoading } from "@/app/demands/_components/DemandShell";
import { WithdrawDemandButton } from "@/app/demands/_components/WithdrawDemandButton";
import { LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Tabs } from "@/components/ui/Tabs";
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
  const tab = (await searchParams).tab === "withdrawn" ? "withdrawn" : "open";
  const demands = await listMyDemands(persona);
  const open = demands.filter((d) => d.status === "open");
  const withdrawn = demands.filter((d) => d.status === "withdrawn");
  const visible = tab === "open" ? open : withdrawn;

  return (
    <>
      <PageHeader
        title="Mis demandas"
        description={`Necesidades publicadas por ${persona.name}.`}
        actions={
          <LinkButton href="/demands/new">
            <Plus className="h-4 w-4" aria-hidden />
            Publicar demanda
          </LinkButton>
        }
      />
      <div className="mb-6">
        <Tabs
          label="Estado de las demandas"
          active={tab}
          items={[
            {
              key: "open",
              label: "Abiertas",
              href: "/my-demands",
              count: open.length,
            },
            {
              key: "withdrawn",
              label: "Retiradas",
              href: "/my-demands?tab=withdrawn",
              count: withdrawn.length,
            },
          ]}
        />
      </div>
      {visible.length ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
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
      ) : tab === "open" ? (
        <EmptyState
          title="No tenés demandas abiertas"
          description="Publicá lo que necesitás para encontrar subproductos cerca de tu empresa."
          action={<LinkButton href="/demands/new">Publicar demanda</LinkButton>}
        />
      ) : (
        <EmptyState title="No tenés demandas retiradas" />
      )}
    </>
  );
}
