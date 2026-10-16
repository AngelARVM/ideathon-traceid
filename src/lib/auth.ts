import "server-only";

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";
import { newId } from "@/lib/ids";
import { hashPassword, verifyPassword } from "@/lib/password";

export const auth = betterAuth({
  secret: process.env.AUTH_SECRET,
  baseURL: process.env.AUTH_URL ?? "http://localhost:3000",
  // Modelos User/Session/Account/Verification, mapeados a tablas en plural (prisma/schema.prisma).
  database: prismaAdapter(db, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    // Cuentas sembradas: no hay registro ni invitaciones en el MVP (docs/02, R6.3).
    disableSignUp: true,
    password: { hash: hashPassword, verify: verifyPassword },
  },
  advanced: {
    database: { generateId: () => newId() },
  },
  // nextCookies debe ser el último plugin: aplica las cookies en Server Actions.
  plugins: [nextCookies()],
});
