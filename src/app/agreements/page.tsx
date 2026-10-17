import { ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatArs, formatTons } from "@/lib/format";
import { CATEGORY_LABEL } from "@/lib/labels";
import { formatDateTime, shortId } from "@/lib/negotiation/format";
import { listAgreementsFor } from "@/lib/negotiation/queries";
import { requirePersona } from "@/lib/persona";

export const metadata: Metadata = { title: "Acuerdos" };

export default function AgreementsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Suspense fallback={<div className="h-96" />}>
        <AgreementsContent />
      </Suspense>
    </div>
  );
}

async function AgreementsContent() {
  const persona = await requirePersona();
  const agreements = await listAgreementsFor(persona);

  return (
    <>
      <PageHeader
        title="Acuerdos"
        description="Acuerdos comerciales declarados en los que sos parte."
      />
      {agreements.length === 0 ? (
        <EmptyState
          title="Todavía no hay acuerdos"
          description="Cuando se confirme una propuesta, su comprobante va a aparecer acá."
        />
      ) : (
        <ul className="divide-y divide-stone-100 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm dark:divide-stone-800 dark:border-stone-800 dark:bg-stone-900">
          {agreements.map((a) => (
            <li key={a.id}>
              <Link
                href={`/agreements/${a.id}`}
                className="flex items-center gap-4 px-4 py-3 transition hover:bg-stone-50 dark:hover:bg-stone-800/60"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{a.offerTitle}</p>
                  <p className="truncate text-xs text-stone-600 dark:text-stone-400">
                    {CATEGORY_LABEL[a.category]} ·{" "}
                    {a.viewerRole === "buyer" ? "Vendedor" : "Comprador"}:{" "}
                    {a.counterparty} · N° {shortId(a.id)} ·{" "}
                    {formatDateTime(a.confirmedAt)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono-num text-sm font-semibold">
                    {formatArs(a.totalAmount)}
                  </p>
                  <p className="font-mono-num text-xs text-stone-500 dark:text-stone-400">
                    {formatTons(a.quantityTons)}
                  </p>
                </div>
                <ChevronRight
                  className="h-4 w-4 shrink-0 text-stone-400"
                  aria-hidden
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
