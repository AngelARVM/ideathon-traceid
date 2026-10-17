import { Suspense } from "react";
import { HomeLoading } from "@/app/_home/home-loading";
import { HowItWorks } from "@/app/_home/how-it-works";
import { MarketplaceHome } from "@/app/_home/marketplace-home";
import { PersonaPicker } from "@/app/_home/persona-picker";
import { getHomeData, listDemoPersonas } from "@/app/_home/queries";
import { getPersona } from "@/lib/persona";

export default function HomePage() {
  return (
    <div className="space-y-16 pb-20">
      <Suspense fallback={<HomeLoading />}>
        <HomeContent />
      </Suspense>
    </div>
  );
}

async function HomeContent() {
  const persona = await getPersona();
  if (!persona) {
    return (
      <>
        <PersonaPicker personas={await listDemoPersonas()} />
        <HowItWorks />
      </>
    );
  }
  const buyer = persona.role === "buyer";
  return (
    <>
      <MarketplaceHome persona={persona} data={await getHomeData(persona)} />
      <HowItWorks
        cta={
          buyer
            ? {
                href: "/demands/new",
                label: "Publicar una demanda",
                question:
                  "¿Buscás un material que no encontrás en el catálogo?",
              }
            : {
                href: "/offers/new",
                label: "Publicar un subproducto",
                question: "¿Tenés subproductos en tu molino o aserradero?",
              }
        }
      />
    </>
  );
}
