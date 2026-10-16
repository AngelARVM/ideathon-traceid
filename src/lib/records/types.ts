/**
 * Los once tipos de record y sus esquemas Zod, `schema_version: 1` (docs/05).
 *
 * Deliberadamente mínimos: el MVP no es el lugar para modelar todo campo que un veterinario
 * podría querer. Reglas que atraviesan todos los tipos:
 *
 * - **Ningún monto en ningún tipo** (docs/02, R8.1). Un precio en una cadena pública e
 *   inmutable es información comercial sensible e irreversible. `sale` registra solo una
 *   etiqueta de comprador y una referencia de documento.
 * - **El texto libre tiene tope de largo** y en la UI lleva el aviso "no ingrese datos
 *   personales".
 * - **Los pesos son gramos enteros.** La UI que muestra kilos convierte en el borde, porque la
 *   serialización canónica prohíbe el punto flotante.
 */

import { z } from "zod";
import type { RecordType } from "@/generated/prisma/enums";

/** Texto libre con tope; la UI agrega el aviso de datos personales. */
const freeText = (max: number) => z.string().trim().min(1).max(max);
const optionalText = (max: number) => freeText(max).optional();

/** Fecha sin hora, como string `YYYY-MM-DD`: no entra al hash como timestamp. */
const dateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Usá el formato AAAA-MM-DD")
  .optional();

const ulidRef = z.string().length(26);

/** Identificador de establecimiento + su etiqueta pública: nunca el registro completo (docs/05). */
const establishmentRef = {
  establishment_id: ulidRef,
  establishment_label: freeText(120),
};

/** `vaccination` y `deworming` comparten forma exacta (docs/05). */
const treatmentShape = {
  product: freeText(120),
  dose: freeText(40),
  batch: optionalText(60),
  route: z.enum(["sc", "im", "iv", "oral", "other"]).optional(),
};

export const recordDataSchemas = {
  // Lleva la dieta base, para que todo animal tenga siempre una dieta declarada (R4.1).
  registration: z.object({
    identifier: freeText(64),
    identifier_kind: z.enum([
      "senasa_cii",
      "senasa_printed",
      "internal_tag",
      "unknown_format",
    ]),
    ...establishmentRef,
    lot_label: optionalText(120),
    initial_diet: freeText(200),
    birth_date: dateOnly,
  }),

  // Gramos enteros: un 72.5 que serializa distinto en dos runtimes rompe la verificación.
  weighing: z.object({
    weight_g: z.number().int().positive().max(5_000_000),
    method: z.enum(["scale", "estimated"]).optional(),
  }),

  vaccination: z.object(treatmentShape),
  deworming: z.object(treatmentShape),

  // Solo CAMBIOS de dieta. Una vista de historial de dieta tiene que leer primero
  // `registration.initial_diet` y recién después estos deltas (docs/05).
  feeding: z.object({
    diet: freeText(200),
    change_reason: optionalText(200),
    effective_from: dateOnly,
  }),

  movement: z.object({
    from_establishment_id: ulidRef.optional(),
    from_label: optionalText(120),
    to_establishment_id: ulidRef.optional(),
    to_label: optionalText(120),
    transport_doc: optionalText(60),
  }),

  // Sin campo de precio, a propósito (R8.1).
  sale: z.object({
    buyer_label: optionalText(120),
    document_ref: optionalText(60),
  }),

  // Terminal. La UI advierte que una entrega a frigorífico NO demuestra la faena.
  slaughterhouse_delivery: z.object({
    establishment_label: freeText(120),
  }),

  // Terminal.
  death: z.object({
    cause: z
      .enum(["disease", "accident", "predation", "unknown", "other"])
      .optional(),
    notes: optionalText(280),
  }),

  other: z.object({
    title: freeText(80),
    description: freeText(280),
  }),

  /**
   * Nunca terminal: una rectificación no puede cerrar ni reabrir una cadena.
   *
   * `rectifies_record_id` y `reason` van acá dentro, no como campos de primer nivel. La lista
   * de campos hasheados de docs/05 los menciona aparte para dejar claro que se hashean; como
   * `data` también se hashea, meterlos acá cumple lo mismo y además mantiene `records.data`
   * idéntico al `data` del payload, que es lo que S5 va a necesitar para verificar sin
   * casos especiales.
   */
  rectification: z.object({
    rectifies_record_id: ulidRef,
    reason: freeText(280),
  }),
} as const satisfies Record<RecordType, z.ZodType>;

export type RecordDataSchemas = typeof recordDataSchemas;
export type RecordDataFor<T extends RecordType> = z.infer<RecordDataSchemas[T]>;

/** Cómo entra el record al contrato (`RecordKind` en contracts/traceid/src/lib.rs). */
export type RecordKind = "ordinary" | "terminal" | "rectification";

export interface RecordTypeMeta {
  /** Etiqueta en español para la UI. */
  label: string;
  /** Una línea de ayuda en el selector de tipo. */
  hint: string;
  kind: RecordKind;
  /**
   * Si cierra la cadena. Los terminales NO van por `append_record`: el contrato los rechaza
   * con `TerminalViaAppend` (error 7) y tienen que pasar por `close_chain`.
   */
  terminal: boolean;
}

export const RECORD_TYPES: Record<RecordType, RecordTypeMeta> = {
  registration: {
    label: "Alta",
    hint: "Primer registro del animal, con su dieta base.",
    kind: "ordinary",
    terminal: false,
  },
  weighing: {
    label: "Pesaje",
    hint: "Peso en kilos.",
    kind: "ordinary",
    terminal: false,
  },
  vaccination: {
    label: "Vacunación",
    hint: "Producto, dosis y vía.",
    kind: "ordinary",
    terminal: false,
  },
  deworming: {
    label: "Desparasitación",
    hint: "Producto, dosis y vía.",
    kind: "ordinary",
    terminal: false,
  },
  feeding: {
    label: "Cambio de dieta",
    hint: "Solo cambios: la dieta base está en el alta.",
    kind: "ordinary",
    terminal: false,
  },
  movement: {
    label: "Movimiento",
    hint: "Traslado entre establecimientos.",
    kind: "ordinary",
    terminal: false,
  },
  sale: {
    label: "Venta",
    hint: "Comprador y documento. Sin montos.",
    kind: "ordinary",
    terminal: false,
  },
  slaughterhouse_delivery: {
    label: "Entrega a frigorífico",
    hint: "Cierra la cadena. No demuestra la faena.",
    kind: "terminal",
    terminal: true,
  },
  death: {
    label: "Muerte",
    hint: "Cierra la cadena.",
    kind: "terminal",
    terminal: true,
  },
  other: {
    label: "Otro",
    hint: "Hito que no encaja en los demás.",
    kind: "ordinary",
    terminal: false,
  },
  rectification: {
    label: "Rectificación",
    hint: "Corrige un registro anterior. Ninguno de los dos se borra.",
    kind: "rectification",
    terminal: false,
  },
};

/** Los tipos que el operador puede elegir en `/animals/<id>/records/new`. */
export const SELECTABLE_RECORD_TYPES = (
  Object.keys(RECORD_TYPES) as RecordType[]
).filter(
  // El alta la crea `/animals/new`; la rectificación se inicia desde el registro que corrige.
  (type) => type !== "registration" && type !== "rectification",
);

export const isTerminal = (type: RecordType): boolean =>
  RECORD_TYPES[type].terminal;
export const recordKind = (type: RecordType): RecordKind =>
  RECORD_TYPES[type].kind;
