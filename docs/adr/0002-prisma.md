# ADR-0002 — Prisma instead of Drizzle

**Status:** accepted (2026-10-16, S1) · supersedes the ORM row of document 04, D12

## Context

Document 04 proposed Drizzle ORM + drizzle-kit. S1 was first built on Drizzle; the team then
chose Prisma, which it is more familiar with, before anything was committed.

## Decision

Use **Prisma `7.10.x`** (stable line; npm's `latest` tag currently points at an `8.0.0` release
candidate, and Better Auth `1.7` declares support up to Prisma 7):

- `prisma/schema.prisma` with the `prisma-client` generator, output to `src/generated/prisma/`
  (git-ignored, regenerated on `postinstall`);
- `prisma.config.ts` holds the datasource URL (Prisma 7 no longer reads it from the schema or
  loads `.env` files by itself — the config loads `.env.local`);
- `@prisma/adapter-pg` driver adapter over `pg`;
- the **`partialIndexes`** preview feature, because the model depends on partial unique indexes:
  `lots` today, and the two on `animal_identifiers` in S2 (one active identifier per animal, one
  active value per organization — document 04, D11);
- PascalCase models mapped with `@@map`/`@map` to the snake_case tables and columns of
  document 05, so the relational model is unchanged.

## Consequences

- Migrations are SQL files in `prisma/migrations/`, reviewed and committed like code.
- `partialIndexes` is a preview feature. If it misbehaves, the fallback is to write the partial
  index by hand in a `--create-only` migration; the constraint must exist in the database either
  way.
- The seed (`scripts/seed.ts`) imports the generated client directly, so `npm install` (or
  `npm run db:generate`) must have run before it.
