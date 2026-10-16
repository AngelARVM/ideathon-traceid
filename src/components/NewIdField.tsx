"use client";

import { useState } from "react";
import { ulid } from "ulid";

/**
 * El ULID lo genera el cliente (docs/04, D4): es la clave de idempotencia, así que tiene que
 * sobrevivir a un reenvío del mismo formulario. Se genera una vez por montaje y no cambia,
 * de modo que un doble submit o un reintento tras un error de red reusan el mismo
 * `record_id` y la escritura se deduplica en vez de duplicarse.
 */
export function NewIdField({ name }: { name: string }) {
  const [id] = useState(ulid);
  return <input type="hidden" name={name} value={id} />;
}
