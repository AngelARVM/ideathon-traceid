import { z } from "zod";
import { Category } from "@/generated/prisma/enums";
import { parsePrice, parseTons } from "@/lib/decimal";

export type SearchParams = Record<string, string | string[] | undefined>;

/** Calendar day in the demo's region, independent of the server's timezone. */
export function todayInArgentina(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

const tons = z.string().transform((value, ctx) => {
  const result = parseTons(value);
  if (result.ok) return result.value;
  ctx.addIssue({ code: "custom", message: result.error });
  return z.NEVER;
});

const optionalPrice = z.string().transform((value, ctx) => {
  if (!value.trim()) return null;
  const result = parsePrice(value);
  if (result.ok) return result.value;
  ctx.addIssue({ code: "custom", message: result.error });
  return z.NEVER;
});

const optionalDate = z
  .string()
  .trim()
  .transform((value, ctx) => {
    if (!value) return null;
    const date = new Date(`${value}T00:00:00.000Z`);
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
      Number.isNaN(date.getTime()) ||
      date.toISOString().slice(0, 10) !== value ||
      value < todayInArgentina()
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Ingresá una fecha válida, de hoy en adelante.",
      });
      return z.NEVER;
    }
    return date;
  });

export const demandSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Ingresá un título de al menos 3 caracteres.")
    .max(120, "El título admite hasta 120 caracteres."),
  category: z.enum(Category, { error: "Elegí una categoría válida." }),
  description: z
    .string()
    .trim()
    .max(2000, "La descripción admite hasta 2000 caracteres.")
    .transform((value) => value || null),
  quantityTons: tons,
  maxPricePerTon: optionalPrice,
  neededBy: optionalDate,
  radiusKm: z
    .enum(["50", "100", "200"], {
      error: "Elegí un radio de 50, 100 o 200 km.",
    })
    .transform(Number),
  localityId: z.string().trim().min(1, "Elegí una localidad."),
});

export const demandIdSchema = z.string().trim().min(1).max(128);

export function demandInput(formData: FormData, defaultLocalityId: string) {
  return {
    title: formData.get("title"),
    category: formData.get("category"),
    description: formData.get("description") ?? "",
    quantityTons: formData.get("quantityTons"),
    maxPricePerTon: formData.get("maxPricePerTon") ?? "",
    neededBy: formData.get("neededBy") ?? "",
    radiusKm: formData.get("radiusKm") ?? "200",
    localityId: formData.get("localityId") || defaultLocalityId,
  };
}

export function parseDemandFilters(params: SearchParams) {
  const category = z.enum(Category).safeParse(params.category);
  const radius = z.enum(["50", "100", "200"]).safeParse(params.radius);
  return {
    category: category.success ? category.data : undefined,
    radiusKm: radius.success ? Number(radius.data) : undefined,
  };
}

export type DemandFilters = ReturnType<typeof parseDemandFilters>;
