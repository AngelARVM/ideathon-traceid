import { ChevronRight, FileCheck2 } from "lucide-react";
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
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Suspense
        fallback={
          <div className="h-96 animate-pulse rounded-xl bg-gray-200/60" />
        }
      >
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
        description="Acuerdos declarados en los que sos parte. Pago, flete y entrega se coordinan fuera de SubMarket."
      />
      {agreements.length === 0 ? (
        <EmptyState
          title="Todavía no hay acuerdos"
          description="Cuando se confirme una propuesta, su comprobante va a aparecer acá."
        />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {agreements.map((a) => (
            <li key={a.id}>
              <Link
                href={`/agreements/${a.id}`}
                className="group flex h-full flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-card transition hover:border-brand-300 hover:shadow-card-hover"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 font-mono-num text-xs font-bold text-gray-500">
                    <FileCheck2
                      className="h-4 w-4 text-brand-600"
                      aria-hidden
                    />
                    N° {shortId(a.id)}
                  </span>
                  <span className="text-[11px] text-gray-400">
                    {formatDateTime(a.confirmedAt)}
                  </span>
                </div>
                <div className="min-w-0">
                  <h2 className="truncate font-sans text-sm font-bold text-gray-900 group-hover:text-brand-600">
                    {a.offerTitle}
                  </h2>
                  <p className="mt-0.5 truncate text-xs text-gray-500">
                    {CATEGORY_LABEL[a.category]} ·{" "}
                    {a.viewerRole === "buyer" ? "Vendedor" : "Comprador"}:{" "}
                    {a.counterparty}
                  </p>
                </div>
                <div className="mt-auto flex items-center justify-between gap-2 rounded-lg border border-gray-100 bg-slate-50 px-3 py-2">
                  <span className="font-mono-num text-xs font-semibold text-gray-700">
                    {formatTons(a.quantityTons)}
                  </span>
                  <span className="flex items-center gap-1 font-mono-num text-sm font-extrabold text-brand-600">
                    {formatArs(a.totalAmount)}
                    <ChevronRight
                      className="h-4 w-4 text-gray-400"
                      aria-hidden
                    />
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
