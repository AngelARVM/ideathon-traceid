/** Resultado de toda server action que no redirige (docs/00-mvp-spec.md §12.1). */
export type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };
