import { z } from "zod";
import {
  Category,
  Freight,
  OfferStatus,
  Presentation,
} from "@/generated/prisma/enums";
import { parsePrice, parseTons } from "@/lib/decimal";

// Validación del formulario de oferta (M1). Crear y editar comparten las mismas reglas, salvo el
// stock (al editar puede quedar en 0) y la fecha estimada (al crear tiene que ser futura).

export type OfferFormMode = "create" | "update";

/** Valores crudos del formulario, tal como se escriben en los inputs. */
export type OfferFormValues = Partial<Record<OfferFormField, string>>;

export type OfferFormField =
  | "title"
  | "category"
  | "description"
  | "quantityTons"
  | "pricePerTon"
  | "status"
  | "estimatedDate"
  | "localityId"
  | "humidityPct"
  | "calorificKcalKg"
  | "presentation"
  | "freight"
  | "hasWeighbridge"
  | "labAnalysis";

/** Datos listos para Prisma: los decimales van como string normalizado. */
export type OfferInput = {
  title: string;
  category: Category;
  description: string;
  quantityTons: string;
  pricePerTon: string | null;
  status: "available" | "estimated";
  estimatedDate: Date | null;
  localityId: string | null;
  humidityPct: string | null;
  calorificKcalKg: number | null;
  presentation: Presentation | null;
  freight: Freight;
  hasWeighbridge: boolean;
  labAnalysis: string | null;
};

const ZERO = /^0+(?:[.,]0*)?$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Hoy en Argentina, como "YYYY-MM-DD". */
const todayInArgentina = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(new Date());

const text = (max: number, missing: string) =>
  z.string().trim().min(1, missing).max(max, `Usá hasta ${max} caracteres.`);

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Usá hasta ${max} caracteres.`)
    .transform((s) => s || null);

/** Humedad %: opcional, entre 0 y 100, hasta 2 decimales (Decimal(5, 2)). */
const humidity = z.string().transform((raw, ctx) => {
  const s = raw.trim().replace(",", ".");
  if (s === "") return null;
  const match = /^(\d{1,3})(?:\.(\d{1,2}))?$/.exec(s);
  if (!match || Number(s) > 100) {
    ctx.addIssue({
      code: "custom",
      message: "La humedad va de 0 a 100, con hasta 2 decimales.",
    });
    return z.NEVER;
  }
  return s;
});

/** Poder calorífico: opcional, entero entre 0 y 10000. */
const calorific = z.string().transform((raw, ctx) => {
  const s = raw.trim().replace(/\./g, "");
  if (s === "") return null;
  if (!/^\d{1,5}$/.test(s) || Number(s) > 10000) {
    ctx.addIssue({
      code: "custom",
      message: "El poder calorífico es un entero entre 0 y 10000.",
    });
    return z.NEVER;
  }
  return Number(s);
});

const tons = (mode: OfferFormMode) =>
  z.string().transform((raw, ctx) => {
    // Al editar, el stock es el restante y puede quedar en cero (§M1, updateOffer).
    if (mode === "update" && ZERO.test(raw.trim())) return "0";
    const r = parseTons(raw);
    if (!r.ok) {
      ctx.addIssue({ code: "custom", message: r.error });
      return z.NEVER;
    }
    return r.value;
  });

const price = z.string().transform((raw, ctx) => {
  if (raw.trim() === "") return null;
  const r = parsePrice(raw);
  if (!r.ok) {
    ctx.addIssue({ code: "custom", message: r.error });
    return z.NEVER;
  }
  return r.value;
});

const schema = (mode: OfferFormMode) =>
  z
    .object({
      title: text(120, "Ingresá un título."),
      category: z.enum(Category, { error: "Elegí una categoría." }),
      description: text(1000, "Ingresá una descripción."),
      quantityTons: tons(mode),
      pricePerTon: price,
      status: z.enum([OfferStatus.available, OfferStatus.estimated], {
        error: "Elegí la disponibilidad.",
      }),
      estimatedDate: z.string().trim(),
      localityId: optionalText(64),
      humidityPct: humidity,
      calorificKcalKg: calorific,
      presentation: z
        .union([z.enum(Presentation), z.literal("")], {
          error: "Elegí una presentación válida.",
        })
        .transform((s) => s || null),
      freight: z.enum(Freight, { error: "Elegí una modalidad de flete." }),
      hasWeighbridge: z.string().transform((s) => s === "on"),
      labAnalysis: optionalText(500),
    })
    .transform((data, ctx): OfferInput => {
      let estimatedDate: Date | null = null;
      if (data.status === "estimated") {
        if (!DATE.test(data.estimatedDate)) {
          ctx.addIssue({
            code: "custom",
            path: ["estimatedDate"],
            message: "Una oferta estimada necesita su fecha estimada.",
          });
          return z.NEVER;
        }
        // Al editar se permite conservar una fecha ya vencida; al publicar, tiene que ser futura.
        if (mode === "create" && data.estimatedDate <= todayInArgentina()) {
          ctx.addIssue({
            code: "custom",
            path: ["estimatedDate"],
            message: "La fecha estimada tiene que ser futura.",
          });
          return z.NEVER;
        }
        estimatedDate = new Date(`${data.estimatedDate}T00:00:00.000Z`);
      }
      return { ...data, estimatedDate };
    });

export type ParsedOfferForm =
  | { ok: true; data: OfferInput }
  | { ok: false; fieldErrors: Record<string, string> };

const FIELDS: OfferFormField[] = [
  "title",
  "category",
  "description",
  "quantityTons",
  "pricePerTon",
  "status",
  "estimatedDate",
  "localityId",
  "humidityPct",
  "calorificKcalKg",
  "presentation",
  "freight",
  "hasWeighbridge",
  "labAnalysis",
];

/** Lee los campos del formulario como strings (un campo ausente es ""). */
export function readOfferForm(formData: FormData): OfferFormValues {
  const values: OfferFormValues = {};
  for (const field of FIELDS) {
    const v = formData.get(field);
    values[field] = typeof v === "string" ? v : "";
  }
  return values;
}

export function parseOfferForm(
  formData: FormData,
  mode: OfferFormMode,
): ParsedOfferForm {
  const result = schema(mode).safeParse(readOfferForm(formData));
  if (result.success) return { ok: true, data: result.data };

  const fieldErrors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = String(issue.path[0] ?? "form");
    fieldErrors[key] ??= issue.message;
  }
  return { ok: false, fieldErrors };
}
