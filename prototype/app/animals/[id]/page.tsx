import type { Metadata } from "next";
import { Suspense } from "react";
import { RouteFallback } from "@/components/RouteFallback";
import { AnimalDetailView } from "@/views/AnimalDetailView";

export const metadata: Metadata = { title: "Detalle" };

export default function Page({ params }: PageProps<"/animals/[id]">) {
  return (
    <Suspense fallback={<RouteFallback />}>
      {params.then(({ id }) => (
        <AnimalDetailView animalId={decodeURIComponent(id)} />
      ))}
    </Suspense>
  );
}
