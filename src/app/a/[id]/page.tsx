import type { Metadata } from "next";
import { Suspense } from "react";
import { RouteFallback } from "@/components/RouteFallback";
import { PublicHistoryView } from "@/views/PublicHistoryView";

export const metadata: Metadata = { title: "Historial público" };

export default function Page({ params }: PageProps<"/a/[id]">) {
  return (
    <Suspense fallback={<RouteFallback />}>
      {params.then(({ id }) => (
        <PublicHistoryView animalId={decodeURIComponent(id)} />
      ))}
    </Suspense>
  );
}
