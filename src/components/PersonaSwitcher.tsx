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

/** Persona actual y desplegable para cambiarla, agrupado por rol. Las personas salen del seed. */
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
      <summary className="flex h-10 cursor-pointer list-none items-center gap-2 rounded-xl bg-gray-100 px-2.5 text-left transition hover:bg-gray-200/70 [&::-webkit-details-marker]:hidden">
        <span
          className="h-2 w-2 shrink-0 rounded-full bg-emerald-500"
          aria-hidden
        />
        <span className="hidden min-w-0 sm:block">
          <span className="block max-w-40 truncate text-xs font-bold leading-tight text-gray-900">
            {persona.name}
          </span>
          <span className="block max-w-40 truncate text-[11px] leading-tight text-gray-500">
            {ROLE_LABEL[persona.role]} · {persona.locality.name}
          </span>
        </span>
        <span className="text-xs font-bold text-gray-800 sm:hidden">
          {ROLE_LABEL[persona.role]}
        </span>
        <ChevronDown
          className="h-4 w-4 shrink-0 text-gray-500 transition group-open:rotate-180"
          aria-hidden
        />
      </summary>

      <div className="absolute right-0 z-50 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-xl border border-gray-200 bg-white p-2 shadow-xl">
        {GROUPS.map(({ role, title }) => (
          <div key={role} className="py-1">
            <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-gray-500">
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
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-brand-50"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-gray-900">
                        {u.name}
                      </span>
                      <span className="block truncate text-[11px] text-gray-500">
                        {u.tagline} · {u.locality.name}
                      </span>
                    </span>
                    {u.id === persona.id && (
                      <Check
                        className="h-4 w-4 shrink-0 text-brand-600"
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
          className="mt-1 border-t border-gray-100 pt-1"
        >
          <button
            type="submit"
            className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            Salir del modo persona
          </button>
        </form>
      </div>
    </details>
  );
}
