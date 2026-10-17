import { OfferCard } from "@/components/OfferCard";
import type { CompatibleOffer } from "@/lib/demands/queries";
import { formatTons } from "@/lib/format";

/** `OfferCard` con lo que importa para la demanda: cuánto cubre y si supera el precio máximo (§9.3). */
export function CompatibleOfferCard({
  match,
  requestedTons,
}: {
  match: CompatibleOffer;
  requestedTons: string;
}) {
  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex-1">
        <OfferCard offer={match.offer} distanceKm={match.distanceKm} />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs">
        <span className="font-semibold text-gray-800">
          Cubre {formatTons(match.coversTons).replace(" Tn", "")} de{" "}
          {formatTons(requestedTons)}
        </span>
        {match.overMaxPrice && (
          <span className="rounded border border-amber-200 bg-amber-50 px-2 py-0.5 font-semibold text-amber-800">
            Sobre tu precio máximo
          </span>
        )}
      </div>
    </div>
  );
}
