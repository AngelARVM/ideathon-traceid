import type { Metadata } from "next";
import { AnimalListView } from "@/views/AnimalListView";

export const metadata: Metadata = { title: "Animales" };

export default function Page() {
  return <AnimalListView />;
}
