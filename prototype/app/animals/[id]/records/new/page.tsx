import type { Metadata } from "next";
import { Suspense } from "react";
import { RouteFallback } from "@/components/RouteFallback";
import { NewRecordView } from "@/views/NewRecordView";

export const metadata: Metadata = { title: "Nuevo hito" };

export default function Page({
  params,
}: PageProps<"/animals/[id]/records/new">) {
  return (
    <Suspense fallback={<RouteFallback />}>
      {params.then(({ id }) => (
        <NewRecordView animalId={decodeURIComponent(id)} />
      ))}
    </Suspense>
  );
}
