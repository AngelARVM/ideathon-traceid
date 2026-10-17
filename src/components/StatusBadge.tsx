import type { OfferStatus, ProposalStatus } from "@/generated/prisma/enums";
import type { DecimalLike } from "@/lib/format";
import { OFFER_STATUS_LABEL, PROPOSAL_STATUS_LABEL } from "@/lib/labels";

const pill =
  "inline-flex shrink-0 items-center rounded border px-2 py-0.5 text-[11px] font-semibold shadow-xs";

const tone = {
  green: "border-brand-200 bg-brand-50 text-brand-700",
  amber: "border-amber-200 bg-amber-50 text-amber-800",
  blue: "border-blue-200 bg-blue-50 text-blue-700",
  red: "border-red-200 bg-red-50 text-red-700",
  stone: "border-gray-200 bg-gray-100 text-gray-600",
};

/** Estado de la oferta. Una oferta disponible sin stock se muestra "Agotada" (§8.1). */
export function OfferStatusBadge({
  status,
  quantityTons,
}: {
  status: OfferStatus;
  quantityTons: DecimalLike;
}) {
  if (status === "available" && Number(String(quantityTons)) <= 0) {
    return <span className={`${pill} ${tone.stone}`}>Agotada</span>;
  }
  const color =
    status === "available"
      ? tone.green
      : status === "estimated"
        ? tone.amber
        : tone.stone;
  return (
    <span className={`${pill} ${color}`}>{OFFER_STATUS_LABEL[status]}</span>
  );
}

const proposalTone: Record<ProposalStatus, string> = {
  pending: tone.amber,
  accepted: tone.blue,
  countered: tone.blue,
  rejected: tone.red,
  confirmed: tone.green,
};

/** Estado de la propuesta (§8.2). */
export function ProposalStatusBadge({ status }: { status: ProposalStatus }) {
  return (
    <span className={`${pill} ${proposalTone[status]}`}>
      {PROPOSAL_STATUS_LABEL[status]}
    </span>
  );
}
