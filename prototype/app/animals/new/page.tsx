import type { Metadata } from "next";
import { Suspense } from "react";
import { RouteFallback } from "@/components/RouteFallback";
import { NewAnimalView } from "@/views/NewAnimalView";

export const metadata: Metadata = { title: "Nuevo animal" };

// La vista usa la fecha actual como valor por defecto, así que no se prerenderiza
export default function Page() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <NewAnimalView />
    </Suspense>
  );
}
