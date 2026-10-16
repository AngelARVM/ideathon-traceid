import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { RouteFallback } from "@/components/RouteFallback";
import { PublicRecordDetailView } from "@/views/PublicRecordDetailView";

export const metadata: Metadata = { title: "Verificación de registro" };

async function Content({
  params,
}: Pick<PageProps<"/a/[id]/records/[seq]">, "params">) {
  const { id, seq } = await params;
  if (!/^\d+$/.test(seq)) notFound();

  return (
    <PublicRecordDetailView
      animalId={decodeURIComponent(id)}
      seq={Number.parseInt(seq, 10)}
    />
  );
}

export default function Page({ params }: PageProps<"/a/[id]/records/[seq]">) {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Content params={params} />
    </Suspense>
  );
}
