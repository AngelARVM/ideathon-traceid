import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/db";
import type { Prisma } from "@/generated/prisma/client";
import type { Role } from "@/generated/prisma/enums";

// Identidad de demo sin login (docs/00-mvp-spec.md §7, D12): una cookie firmada con HMAC dice
// qué persona del seed es el visitante. Cualquiera puede elegir cualquier persona; a partir de
// ahí, toda autorización sale de `getPersona()` y nunca de ids enviados por el cliente.

export type PersonaWithLocality = Prisma.UserGetPayload<{
  include: { locality: true };
}>;

export class AuthorizationError extends Error {
  constructor(message = "No tenés permiso para esta acción.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

const COOKIE_NAME = "submarket_persona";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const DEV_SECRET = "submarket-dev-secret-no-usar-en-produccion";

const SECRET = resolveSecret();

function resolveSecret(): string {
  const secret = process.env.PERSONA_SECRET;
  if (secret) return secret;
  // El build de producción no firma ni lee cookies: las lecturas son por request.
  const building = process.env.NEXT_PHASE === "phase-production-build";
  if (process.env.NODE_ENV === "production" && !building) {
    throw new Error(
      "PERSONA_SECRET no está definida. Generala con `openssl rand -base64 32`.",
    );
  }
  if (!building) {
    console.warn(
      "PERSONA_SECRET no está definida: se usa un secreto fijo de desarrollo.",
    );
  }
  return DEV_SECRET;
}

const sign = (userId: string) =>
  createHmac("sha256", SECRET).update(userId).digest("base64url");

/** Devuelve el userId si la firma es válida. */
function verify(value: string): string | null {
  const dot = value.lastIndexOf(".");
  if (dot <= 0) return null;
  const userId = value.slice(0, dot);
  const given = Buffer.from(value.slice(dot + 1));
  const expected = Buffer.from(sign(userId));
  if (given.length !== expected.length) return null;
  return timingSafeEqual(given, expected) ? userId : null;
}

/** Persona actual, o `null` sin cookie, con firma inválida o con un usuario inexistente. */
export const getPersona = cache(
  async (): Promise<PersonaWithLocality | null> => {
    const value = (await cookies()).get(COOKIE_NAME)?.value;
    const userId = value ? verify(value) : null;
    if (!userId) return null;
    return db.user.findUnique({
      where: { id: userId },
      include: { locality: true },
    });
  },
);

/** Sin persona redirige a `/`. Con `role`, exige ese rol. Llamarla en toda página protegida y acción. */
export async function requirePersona(
  role?: Role,
): Promise<PersonaWithLocality> {
  const persona = await getPersona();
  if (!persona) redirect("/");
  if (role && persona.role !== role) throw new AuthorizationError();
  return persona;
}

/** Solo paths internos: evita redirecciones abiertas (`//host`, `/\host`). */
function safeNext(next: FormDataEntryValue | null): string {
  if (typeof next !== "string") return "/offers";
  if (
    !next.startsWith("/") ||
    next.startsWith("//") ||
    next.startsWith("/\\")
  ) {
    return "/offers";
  }
  return next;
}

/**
 * Al cambiar de persona desde el header se vuelve a la ruta actual, salvo que la nueva persona
 * no pueda verla: entonces va a la página pública más cercana en vez de a un 404 en plena demo.
 * Abrir la URL directamente sigue respondiendo 404 (§9, §13 paso 9).
 */
async function landingFor(
  user: { id: string; role: Role },
  next: string,
): Promise<string> {
  const [section, id, sub, ...rest] = next.split("/").filter(Boolean);
  const buyer = user.role === "buyer";

  if (section === "my-offers") return buyer ? "/offers" : next;
  if (section === "my-demands") return buyer ? next : "/demands";

  if (section === "offers" && id === "new") return buyer ? "/offers" : next;
  if (section === "demands" && id === "new") return buyer ? next : "/demands";

  if (!id || rest.length > 0) return next;

  if (section === "offers") {
    const offer = await db.offer.findUnique({
      where: { id },
      select: { sellerId: true, status: true },
    });
    if (!offer) return next;
    const owner = offer.sellerId === user.id;
    if (offer.status === "withdrawn" && !owner) return "/offers";
    if (sub === "edit" && !owner) return `/offers/${id}`;
    if (sub === "propose" && !buyer) return `/offers/${id}`;
    return next;
  }

  if (section === "demands") {
    const demand = await db.demand.findUnique({
      where: { id },
      select: { buyerId: true, status: true },
    });
    if (!demand) return next;
    const owner = demand.buyerId === user.id;
    if (demand.status === "withdrawn" && !owner) return "/demands";
    if (sub === "edit" && !owner) return `/demands/${id}`;
    return next;
  }

  if (section === "proposals" && !sub) {
    const p = await db.proposal.findUnique({
      where: { id },
      select: { buyerId: true, offer: { select: { sellerId: true } } },
    });
    if (p && p.buyerId !== user.id && p.offer.sellerId !== user.id) {
      return "/proposals";
    }
    return next;
  }

  if (section === "agreements" && !sub) {
    const a = await db.agreement.findUnique({
      where: { id },
      select: { buyerId: true, sellerId: true },
    });
    if (a && a.buyerId !== user.id && a.sellerId !== user.id) {
      return "/agreements";
    }
    return next;
  }

  return next;
}

export async function selectPersona(formData: FormData): Promise<void> {
  "use server";
  const userId = formData.get("userId");
  if (typeof userId !== "string") redirect("/");
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!user) redirect("/");

  (await cookies()).set(COOKIE_NAME, `${user.id}.${sign(user.id)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
  redirect(await landingFor(user, safeNext(formData.get("next"))));
}

export async function clearPersona(): Promise<void> {
  "use server";
  (await cookies()).delete(COOKIE_NAME);
  redirect("/");
}
