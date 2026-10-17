// Sin `server-only`: lo usa también el seed, que corre fuera de Next.
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

export function createPrismaClient(
  connectionString = process.env.DATABASE_URL,
) {
  if (!connectionString) {
    throw new Error("DATABASE_URL no está definida (ver .env.example).");
  }
  // En serverless cada instancia abre su propio pool: uno chico y que suelte las conexiones
  // ociosas evita agotar el límite de conexiones de la base (P2037).
  const adapter = new PrismaPg({
    connectionString,
    max: Number(process.env.DATABASE_POOL_MAX ?? 3),
    idleTimeoutMillis: 10_000,
  });
  return new PrismaClient({ adapter });
}
