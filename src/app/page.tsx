import { Suspense } from "react";
import { HomeLoading } from "@/app/_home/home-loading";
import { HowItWorks } from "@/app/_home/how-it-works";
import { MarketplaceHome } from "@/app/_home/marketplace-home";
import { PersonaPicker } from "@/app/_home/persona-picker";
import { getHomeData, listDemoPersonas } from "@/app/_home/queries";
import { getPersona } from "@/lib/persona";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <Suspense fallback={<HomeLoading />}>
        <HomeContent />
      </Suspense>
      <HowItWorks />
    </div>
  );
}

async function HomeContent() {
  const persona = await getPersona();
  if (!persona) return <PersonaPicker personas={await listDemoPersonas()} />;
  return (
    <MarketplaceHome persona={persona} data={await getHomeData(persona)} />
  );
}
