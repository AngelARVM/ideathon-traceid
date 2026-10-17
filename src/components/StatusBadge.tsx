import type { OfferStatus, ProposalStatus } from "@/generated/prisma/enums";
import type { DecimalLike } from "@/lib/format";
import { OFFER_STATUS_LABEL, PROPOSAL_STATUS_LABEL } from "@/lib/labels";

const pill =
  "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide";

const tone = {
  green:
    "border-campo-200 bg-campo-50 text-campo-800 dark:border-campo-800 dark:bg-campo-950/60 dark:text-campo-200",
  amber:
    "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200",
  blue: "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-200",
  red: "border-red-200 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200",
  stone:
    "border-stone-200 bg-stone-100 text-stone-700 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300",
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

export function ProposalStatusBadge({ status }: { status: ProposalStatus }) {
  return (
    <span className={`${pill} ${proposalTone[status]}`}>
      {PROPOSAL_STATUS_LABEL[status]}
    </span>
  );
}
