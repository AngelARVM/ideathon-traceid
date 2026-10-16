// Sin `server-only`: lo usa también el seed, que corre fuera de Next.
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

export function createPrismaClient(
  connectionString = process.env.DATABASE_URL,
) {
  if (!connectionString) {
    throw new Error("DATABASE_URL no está definida (ver .env.example).");
  }
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}
