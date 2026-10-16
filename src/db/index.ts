import "server-only";

import type { PrismaClient } from "@/generated/prisma/client";
import { createPrismaClient } from "./client";

const globalForDb = globalThis as unknown as { prisma?: PrismaClient };

// En desarrollo el HMR reevalúa este módulo; reusar el cliente evita agotar conexiones.
export const db = globalForDb.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForDb.prisma = db;
