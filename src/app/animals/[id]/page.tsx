import { Lock, PlusCircle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DrainButton } from "@/app/animals/DrainButton";
import { HashChip } from "@/components/HashChip";
import { RecordStatusBadge, statusHint } from "@/components/RecordStatusBadge";
import {
  type AnimalRecord,
  currentDiet,
  getAnimalDetail,
} from "@/lib/animals/queries";
import { bytesToHex } from "@/lib/records/canonical";
import { RECORD_TYPES } from "@/lib/records/types";
import { getMemberships, requireUser } from "@/lib/session";
import { RectifyDialog } from "./RectifyDialog";

/**
 * Ruta de operador: lee la sesión en cada request, así que no hay shell estático que
 * prerenderizar. `instant = false` es la salida que la documentación de Cache Components
 * indica para estos casos (node_modules/next/dist/docs, authentication-with-cache-components).
 */
export const instant = false;

export const metadata: Metadata = { title: "Detalle" };

const dateTimeFmt = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});
const dateFmt = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

/**
 * Vista operativa (docs/03). Lee PostgreSQL y por eso muestra registros que todavía no están
 * en la cadena. La vista pública es otra ruta y llega en S5.
 */
export default async function AnimalDetailPage({
  params,
  searchParams,
}: PageProps<"/animals/[id]">) {
  const { id } = await params;
  const { aviso } = await searchParams;

  const user = await requireUser();
  const memberships = await getMemberships(user.id);
  const animal = await getAnimalDetail(
    id,
    memberships.map((m) => m.orgId),
  );
  if (!animal) notFound();

  const active = animal.identifiers.find((i) => i.replacedAt === null) ?? null;
  const replaced = animal.identifiers.filter((i) => i.replacedAt !== null);
  const diet = currentDiet(animal.records);
  const closed = animal.chainStatus === "closed";

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-10">
      <Link
        href="/animals"
        className="text-sm text-campo-700 dark:text-campo-300 hover:underline"
      >
        ← Animales
      </Link>

      {typeof aviso === "string" && aviso ? (
        <p className="mt-3 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/50 px-3 py-2.5 text-sm text-amber-900 dark:text-amber-200">
          {aviso}
        </p>
      ) : null}

      <header className="mt-3 flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight font-mono-num break-all">
            {active?.identifier ?? "— sin identificador activo —"}
          </h1>
          <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
            {animal.organization.name} · {animal.currentLot?.name ?? "Sin lote"}{" "}
            · {animal.species === "bovine" ? "Bovino" : animal.species}
            {animal.birthDate
              ? ` · nacido ${dateFmt.format(animal.birthDate)}`
              : ""}
          </p>
          <p className="mt-1 text-xs text-stone-500 dark:text-stone-400 font-mono-num break-all">
            {animal.id}
          </p>
        </div>
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-md border shrink-0 ${
            closed
              ? "bg-stone-100 text-stone-700 border-stone-300 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700"
              : "bg-campo-50 text-campo-800 border-campo-200 dark:bg-campo-950/60 dark:text-campo-200 dark:border-campo-800"
          }`}
        >
          {closed ? "Cadena cerrada" : "Cadena abierta"}
        </span>
      </header>

      {diet ? (
        <p className="mt-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 px-3 py-2.5 text-sm">
          <span className="font-semibold">Dieta vigente:</span> {diet.diet}{" "}
          <span className="text-stone-500 dark:text-stone-400">
            (desde {dateFmt.format(diet.since)})
          </span>
        </p>
      ) : null}

      {replaced.length > 0 ? (
        <section className="mt-4">
          <h2 className="text-sm font-semibold">
            Identificadores reemplazados
          </h2>
          <ul className="mt-1.5 space-y-1 text-sm">
            {replaced.map((i) => (
              <li key={i.id} className="text-stone-600 dark:text-stone-400">
                <span className="font-mono-num line-through">
                  {i.identifier}
                </span>{" "}
                <span className="text-xs">
                  reemplazado el {dateFmt.format(i.replacedAt as Date)}
                  {i.replacementReason ? ` · ${i.replacementReason}` : ""}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
            Siguen siendo buscables: el animal y su historia son los mismos.
          </p>
        </section>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {closed ? (
          <p className="text-sm text-stone-600 dark:text-stone-400">
            La cadena está cerrada: no se aceptan hitos ordinarios, solo
            rectificaciones.
          </p>
        ) : (
          <>
            <Link
              href={`/animals/${animal.id}/records/new`}
              className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg bg-campo-600 hover:bg-campo-700 text-white text-sm font-semibold"
            >
              <PlusCircle className="w-4 h-4" />
              Nuevo hito
            </Link>
            <Link
              href={`/animals/${animal.id}/close`}
              className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg border border-red-300 dark:border-red-800 text-red-800 dark:text-red-200 hover:bg-red-50 dark:hover:bg-red-950/40 text-sm font-semibold"
            >
              <Lock className="w-4 h-4" />
              Cerrar cadena
            </Link>
          </>
        )}
        <DrainButton animalId={animal.id} />
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-bold tracking-tight">
          Historia · {animal.recordCount}{" "}
          {animal.recordCount === 1 ? "registro" : "registros"}
        </h2>
        <ul className="mt-3 space-y-3">
          {animal.records.map((record) => (
            <RecordCard
              key={record.recordId}
              animalId={animal.id}
              record={record}
              closed={closed}
            />
          ))}
        </ul>
      </section>
    </div>
  );
}

function RecordCard({
  animalId,
  record,
  closed,
}: {
  animalId: string;
  record: AnimalRecord;
  closed: boolean;
}) {
  const meta = RECORD_TYPES[record.type];
  const data = record.data as Record<string, unknown>;
  const rectifiedBy = record.rectifiedBy[0] ?? null;

  return (
    <li className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <p className="font-semibold">
            <span className="font-mono-num text-stone-500 dark:text-stone-400">
              #{record.seq}
            </span>{" "}
            {meta.label}
            {record.terminal ? (
              <span className="ml-2 text-xs font-semibold text-stone-600 dark:text-stone-400">
                cierra la cadena
              </span>
            ) : null}
          </p>
          <p className="mt-0.5 text-xs text-stone-600 dark:text-stone-400">
            {dateTimeFmt.format(record.occurredAt)} · cargado por{" "}
            {record.author.name}
          </p>
        </div>
        <RecordStatusBadge status={record.status} />
      </div>

      {/* Marcadores de rectificación: los dos registros se conservan y se muestran (R7). */}
      {record.rectifiesRecordId ? (
        <p className="mt-2 text-xs font-semibold text-tierra-600 dark:text-amber-300">
          Rectifica un registro anterior
        </p>
      ) : null}
      {rectifiedBy ? (
        <p className="mt-2 text-xs font-semibold text-tierra-600 dark:text-amber-300">
          Rectificado por #{rectifiedBy.seq}
        </p>
      ) : null}

      <dl className="mt-3 grid sm:grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="min-w-0">
            <dt className="text-xs text-stone-500 dark:text-stone-400">
              {fieldLabel(key)}
            </dt>
            <dd className="truncate">{formatValue(key, value)}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-3 pt-3 border-t border-stone-100 dark:border-stone-800 flex flex-wrap items-center gap-x-4 gap-y-1.5">
        <HashChip label="hash" value={bytesToHex(record.contentHash)} />
        <HashChip
          label="anterior"
          value={record.prevHash ? bytesToHex(record.prevHash) : null}
        />
        {record.txHash ? <HashChip label="tx" value={record.txHash} /> : null}
      </div>

      {record.status !== "confirmed" ? (
        <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">
          {statusHint(record.status)}
          {record.outbox?.lastError ? ` — ${record.outbox.lastError}` : ""}
        </p>
      ) : null}

      {/* Una rectificación se ofrece con la cadena abierta o cerrada, pero no sobre otra. */}
      {record.type !== "rectification" && !rectifiedBy ? (
        <RectifyDialog
          animalId={animalId}
          recordId={record.recordId}
          seq={record.seq ?? 0}
          typeLabel={meta.label}
          chainClosed={closed}
        />
      ) : null}
    </li>
  );
}

const FIELD_LABELS: Record<string, string> = {
  identifier: "Identificador",
  identifier_kind: "Tipo de identificador",
  establishment_id: "Establecimiento (id)",
  establishment_label: "Establecimiento",
  lot_label: "Lote",
  initial_diet: "Dieta base",
  birth_date: "Nacimiento",
  weight_g: "Peso",
  method: "Método",
  product: "Producto",
  dose: "Dosis",
  batch: "Partida",
  route: "Vía",
  diet: "Dieta",
  change_reason: "Motivo del cambio",
  effective_from: "Vigente desde",
  from_label: "Desde",
  to_label: "Hacia",
  from_establishment_id: "Desde (id)",
  to_establishment_id: "Hacia (id)",
  transport_doc: "Documento de transporte",
  buyer_label: "Comprador",
  document_ref: "Documento",
  cause: "Causa",
  notes: "Notas",
  title: "Título",
  description: "Descripción",
  rectifies_record_id: "Rectifica",
  reason: "Motivo",
};

const fieldLabel = (key: string): string => FIELD_LABELS[key] ?? key;

const VALUE_LABELS: Record<string, string> = {
  scale: "balanza",
  estimated: "estimado",
  sc: "subcutánea",
  im: "intramuscular",
  iv: "intravenosa",
  oral: "oral",
  other: "otra",
  disease: "enfermedad",
  accident: "accidente",
  predation: "depredación",
  unknown: "desconocida",
  senasa_cii: "CII SENASA",
  senasa_printed: "caravana impresa",
  internal_tag: "caravana interna",
  unknown_format: "formato no reconocido",
};

function formatValue(key: string, value: unknown): string {
  // Los gramos se vuelven a kilos acá, en el borde: el payload los guarda enteros (docs/05).
  if (key === "weight_g" && typeof value === "number") {
    return `${(value / 1000).toLocaleString("es-AR", { maximumFractionDigits: 3 })} kg`;
  }
  if (typeof value === "string") return VALUE_LABELS[value] ?? value;
  return String(value);
}
