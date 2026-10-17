import { Check, ChevronDown, LogOut } from "lucide-react";
import { CurrentPathInput } from "@/components/CurrentPathInput";
import { db } from "@/db";
import type { Role } from "@/generated/prisma/enums";
import {
  clearPersona,
  type PersonaWithLocality,
  selectPersona,
} from "@/lib/persona";

const ROLE_LABEL: Record<Role, string> = {
  seller: "Vendedor",
  buyer: "Comprador",
};

const GROUPS: { role: Role; title: string }[] = [
  { role: "seller", title: "Vendedores" },
  { role: "buyer", title: "Compradores" },
];

/** Persona actual y selector para cambiarla. Las personas salen del seed. */
export async function PersonaSwitcher({
  persona,
}: {
  persona: PersonaWithLocality;
}) {
  const users = await db.user.findMany({
    include: { locality: true },
    orderBy: { name: "asc" },
  });

  return (
    // `key`: al cambiar de persona el desplegable se vuelve a montar cerrado.
    <details key={persona.id} className="group relative">
      <summary className="flex h-10 cursor-pointer list-none items-center gap-2 rounded-xl border border-stone-200 px-2.5 text-left transition hover:bg-stone-50 dark:border-stone-700 dark:hover:bg-stone-800 [&::-webkit-details-marker]:hidden">
        <span className="hidden min-w-0 sm:block">
          <span className="block max-w-44 truncate text-sm font-semibold leading-tight">
            {persona.name}
          </span>
          <span className="block max-w-44 truncate text-[11px] leading-tight text-stone-500 dark:text-stone-400">
            {ROLE_LABEL[persona.role]} · {persona.locality.name}
          </span>
        </span>
        <span className="text-sm font-semibold sm:hidden">Persona</span>
        <ChevronDown
          className="h-4 w-4 shrink-0 text-stone-500 transition group-open:rotate-180"
          aria-hidden
        />
      </summary>

      <div className="absolute right-0 z-40 mt-2 w-72 rounded-2xl border border-stone-200 bg-white p-2 shadow-xl dark:border-stone-700 dark:bg-stone-900">
        {GROUPS.map(({ role, title }) => (
          <div key={role} className="py-1">
            <p className="px-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              {title}
            </p>
            {users
              .filter((u) => u.role === role)
              .map((u) => (
                <form key={u.id} action={selectPersona}>
                  <input type="hidden" name="userId" value={u.id} />
                  <CurrentPathInput />
                  <button
                    type="submit"
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-stone-100 dark:hover:bg-stone-800"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {u.name}
                      </span>
                      <span className="block truncate text-[11px] text-stone-500 dark:text-stone-400">
                        {u.tagline} · {u.locality.name}
                      </span>
                    </span>
                    {u.id === persona.id && (
                      <Check
                        className="h-4 w-4 shrink-0 text-campo-600"
                        aria-label="Persona actual"
                      />
                    )}
                  </button>
                </form>
              ))}
          </div>
        ))}
        <form
          action={clearPersona}
          className="mt-1 border-t border-stone-100 pt-1 dark:border-stone-800"
        >
          <button
            type="submit"
            className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-stone-700 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            Salir del modo persona
          </button>
        </form>
      </div>
    </details>
  );
}
