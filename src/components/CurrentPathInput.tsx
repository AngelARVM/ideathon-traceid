"use client";

import { usePathname } from "next/navigation";

/** Campo oculto `next` con la ruta actual, para volver a ella después de una acción. */
export function CurrentPathInput() {
  return <input type="hidden" name="next" value={usePathname()} />;
}
