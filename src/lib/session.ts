import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/db";
import type { MembershipRole } from "@/generated/prisma/enums";
import { auth } from "@/lib/auth";

// Capa de acceso a sesión (Data Access Layer). Toda lectura de la sesión pasa por acá;
// el proxy solo hace un chequeo optimista de cookie y nunca es el punto de autorización.

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
}

export interface Membership {
  orgId: string;
  orgName: string;
  role: MembershipRole;
}

/** Sesión validada contra la base, o `null`. Memoizada por request. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  const { id, name, email } = session.user;
  return { id, name, email };
});

/** Como `getCurrentUser`, pero redirige a `/login` si no hay sesión. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

const membershipSelect = {
  orgId: true,
  role: true,
  organization: { select: { name: true } },
} as const;

export const getMemberships = cache(
  async (userId: string): Promise<Membership[]> => {
    const rows = await db.membership.findMany({
      where: { userId },
      select: membershipSelect,
      orderBy: { organization: { name: "asc" } },
    });
    return rows.map((m) => ({
      orgId: m.orgId,
      orgName: m.organization.name,
      role: m.role,
    }));
  },
);

export class AuthorizationError extends Error {
  constructor(message = "No tenés permiso para operar en esta organización.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

/**
 * Punto único de autorización para toda escritura (docs/02, R6.2). Verifica sesión y
 * membresía en la organización dueña del recurso y, si se indican, el rol.
 * Lanza `AuthorizationError`; nunca confíes en que la UI haya ocultado la acción.
 */
export async function requireMembership(
  orgId: string,
  allowedRoles?: readonly MembershipRole[],
): Promise<{ user: CurrentUser; membership: Membership }> {
  const user = await getCurrentUser();
  if (!user) throw new AuthorizationError("Necesitás iniciar sesión.");

  const row = await db.membership.findUnique({
    where: { orgId_userId: { orgId, userId: user.id } },
    select: membershipSelect,
  });

  if (!row) throw new AuthorizationError();
  if (allowedRoles && !allowedRoles.includes(row.role)) {
    throw new AuthorizationError("Tu rol no permite esta acción.");
  }
  return {
    user,
    membership: {
      orgId: row.orgId,
      orgName: row.organization.name,
      role: row.role,
    },
  };
}
