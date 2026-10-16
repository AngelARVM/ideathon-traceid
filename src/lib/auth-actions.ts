"use server";

import { APIError } from "better-auth/api";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";

export interface SignInState {
  error?: string;
  email?: string;
}

const signInSchema = z.object({
  email: z.email("Ingresá un email válido.").trim().toLowerCase(),
  password: z.string().min(1, "Ingresá la contraseña."),
  next: z.string().optional(),
});

/** Solo rutas internas: evita redirecciones abiertas vía `?next=`. */
function safeNext(next: string | undefined): string {
  return next?.startsWith("/") && !next.startsWith("//") ? next : "/animals";
}

export async function signIn(
  _prev: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const parsed = signInSchema.safeParse(Object.fromEntries(formData));
  const email = String(formData.get("email") ?? "");
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message, email };
  }

  try {
    await auth.api.signInEmail({
      body: { email: parsed.data.email, password: parsed.data.password },
      headers: await headers(),
    });
  } catch (err) {
    if (err instanceof APIError) {
      return { error: "Email o contraseña incorrectos.", email };
    }
    throw err;
  }

  redirect(safeNext(parsed.data.next));
}

export async function signOut(): Promise<void> {
  await auth.api.signOut({ headers: await headers() });
  redirect("/login");
}
