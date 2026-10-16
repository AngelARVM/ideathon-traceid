import { ArrowLeft, History, Lock, MapPin, Plus, Tag } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DrainButton } from "@/app/animals/DrainButton";
import { HashChip } from "@/components/HashChip";
import { RecordStatusBadge, statusHint } from "@/components/RecordStatusBadge";
import { RecordTypeIcon } from "@/components/RecordTypeIcon";
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
    <div className="mx-auto max-w-4xl px-3 pb-24 pt-6 sm:px-6">
      <Link
        href="/animals"
        className="inline-flex items-center gap-1.5 rounded-xl bg-stone-100 px-3 py-1.5 text-xs font-semibold text-stone-600 transition hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> Volver al rodeo
      </Link>

      {typeof aviso === "string" && aviso ? (
        <p className="mt-3 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/50 px-3 py-2.5 text-sm text-amber-900 dark:text-amber-200">
          {aviso}
        </p>
      ) : null}

      <div className="mt-4 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm dark:border-stone-800 dark:bg-stone-900 sm:p-7">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-stone-100 pb-5 dark:border-stone-800">
          <div className="min-w-0">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                Ficha operativa de campo
              </span>
              <span className="rounded-full bg-stone-100 px-2 py-0.5 font-mono-num text-[11px] text-stone-500 dark:bg-stone-800 dark:text-stone-400">
                ULID: {animal.id.slice(0, 10)}…
              </span>
            </div>
            <h1 className="break-all font-mono-num text-2xl font-bold tracking-tight text-stone-950 dark:text-white sm:text-3xl">
              {active?.identifier ?? "— sin identificador activo —"}
            </h1>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <span
              className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${
                closed
                  ? "bg-stone-100 text-stone-700 border-stone-300 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700"
                  : "bg-campo-50 text-campo-800 border-campo-200 dark:bg-campo-950/60 dark:text-campo-200 dark:border-campo-800"
              }`}
            >
              {closed ? "Cadena cerrada" : "Cadena abierta"}
            </span>
            <span className="font-mono-num text-xs text-stone-500 dark:text-stone-400">
              {animal.recordCount} registro{animal.recordCount === 1 ? "" : "s"}
            </span>
          </div>
        </header>

        <div className="grid grid-cols-2 gap-3 pt-4 text-xs sm:grid-cols-4">
          <div className="rounded-2xl border border-stone-100 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-800/40">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-stone-500">
              Organización
            </span>
            <strong className="mt-1 block truncate">
              {animal.organization.name}
            </strong>
          </div>
          <div className="rounded-2xl border border-stone-100 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-800/40">
            <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-stone-500">
              <MapPin className="h-3 w-3" aria-hidden /> Lote actual
            </span>
            <strong className="mt-1 block truncate">
              {animal.currentLot?.name ?? "Sin lote"}
            </strong>
          </div>
          <div className="rounded-2xl border border-stone-100 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-800/40">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-stone-500">
              Especie
            </span>
            <strong className="mt-1 block">
              {animal.species === "bovine" ? "Bovino" : animal.species}
            </strong>
          </div>
          <div className="rounded-2xl border border-stone-100 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-800/40">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-stone-500">
              Nacimiento
            </span>
            <strong className="mt-1 block">
              {animal.birthDate
                ? dateFmt.format(animal.birthDate)
                : "No declarado"}
            </strong>
          </div>
        </div>

        {diet ? (
          <p className="mt-4 rounded-xl border border-campo-200 bg-campo-50 px-3 py-2.5 text-sm text-campo-900 dark:border-campo-800 dark:bg-campo-950/40 dark:text-campo-200">
            <span className="font-semibold">Dieta vigente:</span> {diet.diet}{" "}
            <span className="text-stone-500 dark:text-stone-400">
              (desde {dateFmt.format(diet.since)})
            </span>
          </p>
        ) : null}

        {replaced.length > 0 ? (
          <section className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/60 p-3 dark:border-amber-900 dark:bg-amber-950/20">
            <h2 className="flex items-center gap-1.5 text-sm font-semibold">
              <Tag className="h-4 w-4 text-amber-700" aria-hidden />
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

        <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-stone-100 pt-5 dark:border-stone-800">
          {closed ? (
            <p className="w-full rounded-2xl border border-stone-200 bg-stone-100 p-4 text-sm text-stone-600 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300">
              La cadena está cerrada: no se aceptan hitos ordinarios, solo
              rectificaciones.
            </p>
          ) : (
            <>
              <Link
                href={`/animals/${animal.id}/records/new`}
                className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-campo-600 px-5 text-base font-bold text-white shadow-md shadow-campo-950/20 transition hover:bg-campo-700"
              >
                <Plus className="h-5 w-5" aria-hidden />
                Nuevo hito
              </Link>
              <Link
                href={`/animals/${animal.id}/close`}
                className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300"
              >
                <Lock className="w-4 h-4" />
                Cerrar cadena
              </Link>
            </>
          )}
          <DrainButton animalId={animal.id} />
        </div>
      </div>

      <section className="mt-8">
        <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <History
            className="h-5 w-5 text-campo-600 dark:text-campo-300"
            aria-hidden
          />
          Historia · {animal.recordCount}{" "}
          {animal.recordCount === 1 ? "registro" : "registros"}
        </h2>
        <ul className="ml-3 mt-5 space-y-4 border-l-2 border-campo-200 pl-6 dark:border-campo-900">
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
    <li className="relative rounded-2xl border border-stone-200 bg-white p-4 shadow-sm before:absolute before:-left-[2.3rem] before:top-5 before:h-5 before:w-5 before:rounded-full before:border-4 before:border-stone-50 before:bg-campo-600 dark:border-stone-800 dark:bg-stone-900 dark:before:border-stone-950">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex min-w-0 items-start gap-3">
          <RecordTypeIcon type={record.type} />
          <div className="min-w-0">
            <p className="font-bold">
              {meta.label}{" "}
              <span className="ml-1 rounded bg-stone-100 px-1.5 py-0.5 font-mono-num text-xs font-medium text-stone-500 dark:bg-stone-800 dark:text-stone-400">
                #{record.seq}
              </span>
              {record.terminal ? (
                <span className="ml-2 rounded bg-stone-800 px-1.5 py-0.5 text-xs font-semibold text-white">
                  cierra la cadena
                </span>
              ) : null}
            </p>
            <p className="mt-1 text-xs text-stone-600 dark:text-stone-400">
              Fecha del hecho: {dateTimeFmt.format(record.occurredAt)}
            </p>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Registrado: {dateTimeFmt.format(record.recordedAt)} ·{" "}
              {record.author.name}
            </p>
          </div>
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
