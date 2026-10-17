import { existsSync } from "node:fs";
import { defineConfig, env } from "prisma/config";

// Prisma 7 no carga archivos .env por sí mismo.
if (existsSync(".env.local")) process.loadEnvFile(".env.local");

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx scripts/seed.ts",
  },
  datasource: { url: env("DATABASE_URL") },
});
