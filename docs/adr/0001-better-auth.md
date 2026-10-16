# ADR-0001 — Better Auth for authentication

**Status:** accepted (2026-10-16, S1) · resolves O1 and O2 (document 10)

## Context

S1 needs seeded per-user accounts, argon2 password hashes, server-side sessions and a
`requireMembership` check on every write path (documents 02 R6, 07). Two candidates were open:
Auth.js v5 (`next-auth@beta`) and Better Auth. Maintenance of Auth.js passed to the Better Auth
team in September 2025, and Auth.js's own documentation points new projects at Better Auth.

## Decision

Use **Better Auth `1.7.x`** (installed: `1.7.10`) with:

- the Prisma adapter over the same PostgreSQL database (models `User`, `Session`, `Account`,
  `Verification`, mapped to tables `users`, `sessions`, `accounts`, `verifications`; see ADR-0002);
- email + password only, **sign-up disabled** — accounts exist only through `npm run db:seed`;
- password hashing overridden to **argon2id** (`@node-rs/argon2`, OWASP defaults) instead of
  Better Auth's default scrypt;
- ULIDs for every id (`advanced.database.generateId`), consistent with the rest of the model;
- database-backed sessions (cookie holds an opaque token, validated against `sessions`);
- the `nextCookies` plugin so Server Actions can set the session cookie.

Authorization does **not** live in the library. `src/lib/session.ts` is the single Data Access
Layer: `getCurrentUser`, `requireUser` and `requireMembership(orgId, roles?)`. `src/proxy.ts` only
does an optimistic cookie-presence redirect for `/animals/*`; it is never the enforcement point.

## Consequences

- The password hash lives in `accounts.password` (provider `credential`), not in
  `users.password_hash` as document 05 originally sketched. `users.display_name` is mapped to
  Better Auth's `name` field.
- Better Auth reads `AUTH_SECRET` and `AUTH_URL` explicitly from our config, so the variable
  names in document 07 stay unchanged.
- Adding OAuth providers or an invitation flow later is configuration, not a rewrite — but both
  remain out of MVP scope.
