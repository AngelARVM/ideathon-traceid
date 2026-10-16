import type { Metadata } from "next";
import { Suspense } from "react";
import { RouteFallback } from "@/components/RouteFallback";
import { CloseChainView } from "@/views/CloseChainView";

export const metadata: Metadata = { title: "Cerrar cadena" };

export default function Page({ params }: PageProps<"/animals/[id]/close">) {
  return (
    <Suspense fallback={<RouteFallback />}>
      {params.then(({ id }) => (
        <CloseChainView animalId={decodeURIComponent(id)} />
      ))}
    </Suspense>
  );
}
