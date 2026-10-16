import { ulid } from "ulid";

/** Identificador opaco, ordenable por tiempo (docs/05). Se usa para todas las tablas. */
export const newId = (): string => ulid();
